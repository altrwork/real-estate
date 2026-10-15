#!/usr/bin/env node
/* Build the landscape BOV deck (.pptx) from data.json and a brand pack.
 *
 *   node build_deck.js data.json out.pptx [--brand <name|folder>]
 *
 * Needs pptxgenjs (npm i -g pptxgenjs). Letter landscape, 11 x 8.5 in.
 * Slide 2 is the letter and the contents on one slide. Sections the data leaves out
 * (location, zoning, market, strategy) are skipped and the contents renumber.
 * Missing text prints as a visible [field] placeholder, never invented text.
 * Brand fields in data.json override the pack. Roboto/Roboto Condensed style fonts come from the brand.
 */
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");

function load(mod) {
  try { return require(mod); } catch (e) {}
  try { return require(path.join(cp.execFileSync("npm", ["root", "-g"]).toString().trim(), mod)); } catch (e) {}
  console.error(`Missing ${mod}. Run: npm install -g ${mod}`); process.exit(1);
}
const pptxgen = load("pptxgenjs");

const args = process.argv.slice(2);
let brandArg = null;
const bi = args.indexOf("--brand"); if (bi >= 0) { brandArg = args[bi + 1]; args.splice(bi, 2); }
const [dataPath, outPath] = args;
if (!dataPath || !outPath) { console.error("usage: build_deck.js data.json out.pptx [--brand name|folder]"); process.exit(1); }

const home = process.env.REAL_ESTATE_HOME || path.join(os.homedir(), ".claude", "real-estate");
const pluginRoot = path.resolve(__dirname, "../../..");
const findBrand = (n) => {
  for (const c of [path.resolve(n), path.join(home, "brands", n), path.join(pluginRoot, "brands", n)])
    if (fs.existsSync(path.join(c, "brand.json"))) return c;
  console.error(`No brand pack '${n}'. Run /brokerage-sales:brand-setup, or pass a folder containing brand.json.`); process.exit(1);
};
const d = JSON.parse(fs.readFileSync(dataPath, "utf8"));
let brandDir = null;
if (brandArg) brandDir = findBrand(brandArg);
else if (fs.existsSync(path.join(home, "active-brand"))) brandDir = findBrand(fs.readFileSync(path.join(home, "active-brand"), "utf8").trim());
if (brandDir) {
  const b = JSON.parse(fs.readFileSync(path.join(brandDir, "brand.json"), "utf8"));
  for (const k of Object.keys(b)) if (d[k] === undefined) d[k] = b[k];
  if (!d.logo && b.logo_horizontal) d.logo = path.join(brandDir, b.logo_horizontal);
}

// ---- brand tokens
const hex = (c, f) => (c || f).replace("#", "").toUpperCase();
const C = { brand: hex(d.primary_color, "#19472b"), accent: hex(d.accent_color, "#7aa732"), link: hex(d.link_color, d.primary_color || "#3d7727"),
  ink: hex(d.ink_color, "#1f2421"), muted: hex(d.muted_color, "#5a635d"), tint: hex(d.tint_color, "#f4f6f2"), line: hex(d.border_color, "#dfe4dc"), white: "FFFFFF" };
const DISPLAY = d.display_font || "Arial Narrow", BODY = d.body_font || "Arial";
const upper = (s) => (d.headline_transform === "none" ? s : s.toUpperCase());

// ---- helpers
const ph = (name) => `[${name}]`;
const T = (v, name) => (v === undefined || v === null || v === "" ? ph(name) : String(v));
const money = (v) => `$${Math.round(Number(v)).toLocaleString("en-US")}`;
const psf = (v) => `$${Number(v).toFixed(2)}`;
const mil = (v) => { const m = Number(v) / 1e6; return `$${(Math.round(m * 10) / 10).toString()}`; };
const round5k = (v) => Math.round(Number(v) / 5000) * 5000;
const rangeText = (lo, hi) => `${mil(lo)} to ${mil(hi)} million`;
const have = (o) => o && Object.keys(o).length > 0;
const exists = (p) => p && fs.existsSync(p);

function svgToPng(svg) {  // Chrome renders the vector logo once; pptx needs a bitmap
  const chrome = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "google-chrome", "chromium"].find((c) => {
    try { return c.startsWith("/") ? fs.existsSync(c) : !!cp.execFileSync("which", [c]).toString().trim(); } catch (e) { return false; }
  });
  if (!chrome) return null;
  const src = fs.readFileSync(svg, "utf8");
  const vb = (src.match(/viewBox="([\d.\s-]+)"/) || [])[1];
  const [w, h] = vb ? vb.trim().split(/\s+/).slice(2).map(Number) : [600, 150];
  const scale = 1200 / w, W = Math.round(w * scale), H = Math.round(h * scale);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bovlogo-"));
  const html = path.join(tmp, "l.html"), png = path.join(tmp, "logo.png");
  fs.writeFileSync(html, `<html><body style="margin:0;background:transparent"><img src="file://${path.resolve(svg)}" width="${W}" height="${H}"></body></html>`);
  try {
    cp.execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000", `--window-size=${W},${H}`, `--screenshot=${png}`, "file://" + html], { stdio: "ignore" });
    return { path: png, ratio: W / H };
  } catch (e) { return null; }
}
function pngRatio(p) { const b = fs.readFileSync(p); return b.readUInt32BE(16) / b.readUInt32BE(20); }
let logo = null;
if (exists(d.logo)) {
  if (/\.svg$/i.test(d.logo)) logo = svgToPng(d.logo);
  else if (/\.png$/i.test(d.logo)) logo = { path: d.logo, ratio: pngRatio(d.logo) };
}
const firm = T(d.firm, "firm");
const footerText = `${T(d.address_street, "address")}, ${T(d.address_city, "city")}  |  Broker Opinion of Value`;

// ---- deck, masters
const pres = new pptxgen();
pres.defineLayout({ name: "LETTER_LANDSCAPE", width: 11, height: 8.5 });
pres.layout = "LETTER_LANDSCAPE";
pres.title = `Broker Opinion of Value: ${d.address_street || ""}`;
pres.author = d.agent_name || firm;

const footerObjs = [];
if (logo) { const h = 0.375; footerObjs.push({ image: { path: logo.path, x: 0.6, y: 7.85, w: h * logo.ratio, h } }); }
else footerObjs.push({ text: { text: firm, options: { x: 0.6, y: 7.85, w: 3, h: 0.375, fontFace: DISPLAY, fontSize: 12, bold: true, color: C.brand, margin: 0, valign: "middle" } } });
pres.defineSlideMaster({
  title: "CONTENT", background: { color: C.tint },
  objects: [
    { rect: { x: 0, y: 0, w: 11, h: 1.0, fill: { color: C.brand } } },
    ...footerObjs,
    { text: { text: footerText, options: { x: 3.2, y: 7.85, w: 6.6, h: 0.375, fontFace: BODY, fontSize: 10, color: C.muted, align: "right", valign: "middle", margin: 0 } } },
  ],
  slideNumber: { x: 9.9, y: 7.85, w: 0.5, h: 0.375, fontFace: BODY, fontSize: 10, color: C.muted, align: "right" },
});
pres.defineSlideMaster({ title: "COVER", background: { color: C.tint }, objects: [] });

const card = (s, x, y, w, h, fill) => s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill || C.white }, line: { color: fill || C.line, width: 1 } });
const txt = (s, text, o) => s.addText(text, Object.assign({ fontFace: BODY, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 6 }, o));
const disp = (s, text, o) => txt(s, text, Object.assign({ fontFace: DISPLAY, bold: true, color: C.brand }, o));
function slideWith(title) {
  const s = pres.addSlide({ masterName: "CONTENT" });
  disp(s, upper(title), { x: 0.6, y: 0.2, w: 9.8, h: 0.6, fontSize: 26, color: C.white, valign: "middle" });
  return s;
}
const paras = (arr, size, o) => arr.map((p) => ({ text: p, options: Object.assign({ fontSize: size, breakLine: true, paraSpaceAfter: 8 }, o || {}) }));
const bigStat = (s, x, y, w, h, big, label, bigSize, labSize) => {
  card(s, x, y, w, h);
  disp(s, big, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: bigSize / 40 + 0.2, fontSize: bigSize, valign: "top" });
  txt(s, label, { x: x + 0.2, y: y + 0.2 + bigSize / 40 + 0.2, w: w - 0.4, h: h - (bigSize / 40 + 0.5), fontSize: labSize || 13, color: C.muted });
};
const th = (t, align) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.brand }, fontFace: DISPLAY, align: align || "left", valign: "middle" } });
const tblBase = (o) => Object.assign({ fontFace: BODY, color: C.ink, border: { type: "solid", pt: 0.75, color: C.line }, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1] }, o);
const cell = (t, o) => ({ text: String(t), options: Object.assign({ fill: { color: C.white } }, o || {}) });

// ---- section plan: a title slide, then the section's slides. Sections with no slides drop out.
const subj = d.subject_sf, loc = d.location, prop = d.property, zon = d.zoning, mkt = d.market, meth = d.methodology,
  cmp = d.comps, val = d.valuation, strat = d.strategy;
const valueStr = d.value ? money(d.value) : ph("value");
const rLo = d.range_low ? round5k(d.range_low) : null, rHi = d.range_high ? round5k(d.range_high) : null;
const rangeStr = rLo && rHi ? rangeText(rLo, rHi) : ph("range");
const SECTIONS = [
  { title: "Introduction", slides: [["letter", "Opinion of value", true], ["summary", "Executive summary", true]] },
  { title: "Location Overview", slides: [["location", "Location overview", have(loc)], ["market", "Market and economic drivers", have(mkt)]] },
  { title: "Property Overview", slides: [["property", "Property overview", have(prop)], ["zoning", "Zoning and land use", have(zon)]] },
  { title: "Property Valuation", slides: [["method", "Valuation methodology", have(meth)], ["comps", "Comparable sales", have(cmp)], ["valuation", "Valuation summary", have(val) || d.value != null]] },
  { title: "Marketing Strategy", slides: [["strategy", "Marketing and disposition strategy", have(strat)]] },
  { title: "About Us", slides: [["about", "About us", true]] },
].map((x) => ({ title: x.title, slides: x.slides.filter((y) => y[2]).map((y) => ({ key: y[0], title: y[1] })) })).filter((x) => x.slides.length);
const order = [{ key: "cover" }];  // slide order; the page number is index + 1
SECTIONS.forEach((sec, i) => {
  sec.n = i + 1; sec.page = order.length + 1;
  order.push({ key: "divider", sec });
  sec.slides.forEach((sl) => order.push({ key: sl.key }));
});
const R = {};  // slide renderers

// ---- cover
R.cover = () => {
  const s = pres.addSlide({ masterName: "COVER" });
  if (logo) s.addImage({ path: logo.path, x: 0.6, y: 0.6, w: 0.5 * logo.ratio, h: 0.5 });
  disp(s, "BROKER OPINION OF VALUE", { x: 0.6, y: 1.9, w: 4.9, h: 1.9, fontSize: 40, valign: "top", paraSpaceAfter: 0 });
  txt(s, T(d.address_street, "address"), { x: 0.6, y: 4.0, w: 4.9, h: 0.5, fontSize: 22, bold: true });
  txt(s, `${T(d.address_city, "city")}${d.property_line ? "  |  " + d.property_line : ""}`, { x: 0.6, y: 4.5, w: 4.9, h: 0.4, fontSize: 18, color: C.muted });
  txt(s, `Prepared for ${T(d.prepared_for, "prepared for")}`, { x: 0.6, y: 5.5, w: 4.9, h: 0.35, fontSize: 16, bold: true, color: C.link });
  txt(s, T(d.prepared_date, "date"), { x: 0.6, y: 5.9, w: 4.9, h: 0.3, fontSize: 14, color: C.muted });
  txt(s, [
    { text: T(d.agent_name, "agent name"), options: { bold: true, breakLine: true } },
    { text: firm, options: { breakLine: true } },
    { text: `${T(d.agent_phone, "phone")}  |  ${T(d.agent_email, "email")}` },
  ], { x: 0.6, y: 6.9, w: 4.9, h: 0.9, fontSize: 12, color: C.muted, paraSpaceAfter: 0 });
  if (exists(d.cover_image)) s.addImage({ path: d.cover_image, x: 5.9, y: 0, w: 5.1, h: 8.5, sizing: { type: "cover", w: 5.1, h: 8.5 } });
  else s.addShape(pres.ShapeType.rect, { x: 5.9, y: 0, w: 5.1, h: 8.5, fill: { color: C.line }, line: { color: C.line } });
}

// ---- letter + contents (one slide)
R.letter = () => {
  const s = slideWith("Opinion of Value");
  card(s, 0.6, 1.3, 5.9, 6.2);
  const letter = [
    { text: T(d.prepared_date, "date"), options: { color: C.muted, breakLine: true } },
    { text: T(d.prepared_for, "prepared for"), options: { breakLine: true } },
    { text: `Re: ${T(d.address_street, "address")}, ${T(d.address_city, "city")}`, options: { bold: true, breakLine: true } },
    { text: T(d.salutation, "salutation"), options: { breakLine: true } },
    ...(d.letter && d.letter.length ? d.letter : [ph("letter")]).map((p) => ({ text: p, options: { breakLine: true } })),
    { text: "Sincerely,", options: {} },
  ];
  txt(s, letter, { x: 0.85, y: 1.5, w: 5.4, h: 4.6, fontSize: 12, paraSpaceAfter: 6 });
  let tx = 0.85;
  if (exists(d.agent_photo)) { s.addImage({ path: d.agent_photo, x: 0.85, y: 6.3, w: 0.9, h: 0.9, rounding: true, sizing: { type: "cover", w: 0.9, h: 0.9 } }); tx = 1.95; }
  txt(s, [
    { text: T(d.agent_name, "agent name"), options: { bold: true, fontSize: 14, color: C.brand, breakLine: true } },
    { text: [d.agent_title, firm].filter(Boolean).join(", "), options: { fontSize: 11, breakLine: true } },
    { text: `${T(d.agent_phone, "phone")}  |  ${T(d.agent_email, "email")}`, options: { fontSize: 10, color: C.muted } },
  ], { x: tx, y: 6.3, w: 6.3 - tx, h: 0.95, paraSpaceAfter: 2 });

  card(s, 6.7, 1.3, 3.7, 6.2);
  disp(s, upper("Contents"), { x: 6.95, y: 1.45, w: 3.2, h: 0.35, fontSize: 14 });
  const rowH = Math.min(0.9, 5.3 / SECTIONS.length);
  SECTIONS.forEach((sec, i) => {
    const y = 1.95 + i * rowH;
    if (i > 0) s.addShape(pres.ShapeType.line, { x: 6.95, y: y - 0.08, w: 3.2, h: 0, line: { color: C.line, width: 0.75 } });
    disp(s, String(sec.n), { x: 6.95, y, w: 0.35, h: 0.3, fontSize: 14, color: C.link });
    disp(s, upper(sec.title), { x: 7.35, y, w: 2.3, h: 0.25, fontSize: 11, valign: "middle", paraSpaceAfter: 0 });
    txt(s, String(sec.page), { x: 9.65, y, w: 0.5, h: 0.25, fontSize: 11, color: C.muted, align: "right", valign: "middle", paraSpaceAfter: 0 });
    txt(s, sec.slides.map((x) => x.title).join("  \u00B7  "), { x: 7.35, y: y + 0.27, w: 2.8, h: rowH - 0.4, fontSize: 9, color: C.muted, paraSpaceAfter: 0 });
  });
};

// ---- executive summary
R.summary = () => {
  const s = slideWith("Executive Summary");
  card(s, 0.6, 1.3, 4.7, 2.5, C.brand);
  disp(s, upper("Opinion of sale value"), { x: 0.9, y: 1.5, w: 4.1, h: 0.3, fontSize: 14, color: C.white });
  disp(s, valueStr, { x: 0.9, y: 1.9, w: 4.1, h: 1.0, fontSize: 54, color: C.white, valign: "middle" });
  const psfOp = d.value && subj ? `  |  about $${Math.round(d.value / subj)} per square foot` : "";
  txt(s, `Range ${rangeStr}${psfOp}`, { x: 0.9, y: 3.05, w: 4.1, h: 0.55, fontSize: 13, color: C.white });
  const stats = d.exec?.stats || [];
  [0, 1, 2].forEach((i) => {
    const st = stats[i] || {};
    bigStat(s, 0.6 + i * 1.6, 4.05, 1.5, 1.7, T(st.big, `stat ${i + 1}`), T(st.label, `label ${i + 1}`), 20, 12);
  });
  txt(s, d.exec?.note || "Based on public records only. No leases, rent roll, or inspection reviewed.", { x: 0.6, y: 6.35, w: 4.7, h: 0.6, fontSize: 12, color: C.muted });
  txt(s, paras(d.exec?.paragraphs?.length ? d.exec.paragraphs : [ph("summary")], 16), { x: 5.7, y: 1.3, w: 4.7, h: 6.0 });
}

// ---- location
R.location = () => {
  const s = slideWith("Location Overview");
  if (exists(loc.image)) s.addImage({ path: loc.image, x: 0.6, y: 1.3, w: 4.65, h: 6.2, sizing: { type: "cover", w: 4.65, h: 6.2 } });
  else card(s, 0.6, 1.3, 4.65, 6.2, C.line);
  txt(s, paras([T(loc.text, "location text")], 14), { x: 5.65, y: 1.3, w: 4.75, h: 1.9 });
  (loc.stats || []).slice(0, 2).forEach((st, i) => bigStat(s, 5.65, 3.5 + i * 2.05, 4.75, 1.9, T(st.big, "stat"), T(st.label, "label"), 40, 13));
}

// ---- property overview
R.property = () => {
  const s = slideWith("Property Overview");
  const rows = (prop.rows || []).map(([k, v]) => [cell(k, { bold: true }), cell(v)]);
  s.addTable(rows, tblBase({ x: 0.6, y: 1.3, w: 6.1, colW: [1.7, 4.4], rowH: 0.5, fontSize: 12 }));
  if (exists(prop.image)) s.addImage({ path: prop.image, x: 7.0, y: 1.3, w: 3.4, h: 2.55, sizing: { type: "cover", w: 3.4, h: 2.55 } });
  card(s, 7.0, 4.1, 3.4, 3.3, C.brand);
  (prop.stats || []).slice(0, 2).forEach((st, i) => {
    disp(s, T(st.big, "stat"), { x: 7.3, y: 4.35 + i * 1.5, w: 2.8, h: 0.6, fontSize: 30, color: C.white, valign: "middle" });
    txt(s, T(st.label, "label"), { x: 7.3, y: 4.95 + i * 1.5, w: 2.8, h: 0.6, fontSize: 13, color: C.white });
  });
}

// ---- zoning
R.zoning = () => {
  const s = slideWith("Zoning and Land Use");
  (zon.cards || []).slice(0, 3).forEach((c, i) => {
    const x = 0.6 + i * 3.35;
    card(s, x, 1.3, 3.1, 3.45);
    card(s, x, 1.3, 3.1, 1.1, C.brand);
    disp(s, T(c.big, "code"), { x, y: 1.3, w: 3.1, h: 1.1, fontSize: 40, color: C.white, align: "center", valign: "middle" });
    disp(s, upper(T(c.title, "title")), { x: x + 0.25, y: 2.55, w: 2.6, h: 0.45, fontSize: 13, valign: "top" });
    txt(s, T(c.text, "text"), { x: x + 0.25, y: 3.1, w: 2.6, h: 1.55, fontSize: 13 });
  });
  [["Other checks", zon.other, 0.6], ["To confirm", zon.confirm, 5.6]].forEach(([h, body, x]) => {
    card(s, x, 5.0, 4.8, 2.5);
    disp(s, upper(h), { x: x + 0.25, y: 5.2, w: 4.3, h: 0.35, fontSize: 16 });
    txt(s, T(body, h.toLowerCase()), { x: x + 0.25, y: 5.65, w: 4.3, h: 1.7, fontSize: 14 });
  });
}

// ---- market and economic drivers
R.market = () => {
  const s = slideWith("Market and Economic Drivers");
  (mkt.stats || []).slice(0, 3).forEach((st, i) => bigStat(s, 0.6 + i * 3.35, 1.3, 3.1, 1.45, T(st.big, "stat"), T(st.label, "label"), 36, 13));
  disp(s, T(mkt.headline, "headline"), { x: 0.6, y: 3.05, w: 9.8, h: 0.45, fontSize: 20, valign: "middle" });
  const dm = mkt.demographics;
  if (dm) {
    const rows = [[th(""), th(T(dm.cols?.[0], "area"), "right"), th(T(dm.cols?.[1], "county"), "right")],
      ...(dm.rows || []).map(([l, a, b]) => [cell(l, { bold: true }), cell(a, { align: "right" }), cell(b, { align: "right" })])];
    s.addTable(rows, tblBase({ x: 0.6, y: 3.75, w: 5.7, colW: [2.5, 1.6, 1.6], rowH: 0.45, fontSize: 13 }));
  }
  if (mkt.callout) txt(s, mkt.callout, { x: 6.6, y: 3.75, w: 3.8, h: 3.2, fontSize: 14, bold: true, color: C.link });
  if (mkt.sources) txt(s, mkt.sources, { x: 0.6, y: 7.25, w: 9.8, h: 0.3, fontSize: 10, color: C.muted });
}

// ---- methodology
R.method = () => {
  const s = slideWith("Valuation Methodology");
  txt(s, T(meth.intro, "method intro"), { x: 0.6, y: 1.3, w: 9.8, h: 0.8, fontSize: 16 });
  (meth.steps || []).slice(0, 4).forEach((st, i) => {
    const x = 0.6 + i * 2.5;
    card(s, x, 2.3, 2.3, 3.5);
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.2, y: 2.5, w: 0.7, h: 0.7, fill: { color: C.brand }, line: { color: C.brand } });
    disp(s, String(i + 1), { x: x + 0.2, y: 2.5, w: 0.7, h: 0.7, fontSize: 24, color: C.white, align: "center", valign: "middle" });
    disp(s, upper(T(st.title, "step")), { x: x + 0.2, y: 3.4, w: 1.9, h: 0.4, fontSize: 20 });
    txt(s, T(st.text, "step text"), { x: x + 0.2, y: 3.9, w: 1.9, h: 1.8, fontSize: 13 });
  });
  txt(s, T(meth.note, "limits note"), { x: 0.6, y: 6.2, w: 9.8, h: 0.8, fontSize: 14, color: C.muted });
}

// ---- comparable sales
R.comps = () => {
  const s = slideWith("Comparable Sales");
  const rows = (cmp.rows || []);
  const hdr = [th("Address"), th("Sold"), th("SF", "right"), th("Built", "right"), th("Price", "right"), th("$ / SF", "right")];
  const body = rows.map((r) => [cell(r.address), cell(r.sold), cell(Number(r.sf).toLocaleString("en-US"), { align: "right" }), cell(r.built ?? "", { align: "right" }),
    cell(money(r.price), { align: "right" }), cell(psf(r.price / r.sf), { align: "right" })]);
  const sub = cmp.subject ? [[cell(`Subject: ${cmp.subject.address || d.address_street}`, { bold: true, fill: { color: C.tint } }), cell("", { fill: { color: C.tint } }),
    cell(Number(subj || cmp.subject.sf).toLocaleString("en-US"), { bold: true, align: "right", fill: { color: C.tint } }), cell(cmp.subject.built ?? "", { bold: true, align: "right", fill: { color: C.tint } }),
    cell("", { fill: { color: C.tint } }), cell("", { fill: { color: C.tint } })]] : [];
  s.addTable([hdr, ...body, ...sub], tblBase({ x: 0.6, y: 1.3, w: 9.8, colW: [3.2, 1.3, 1.2, 1.0, 1.7, 1.4], rowH: 0.4, fontSize: 12 }));
  const tableBottom = 1.3 + 0.4 * (1 + rows.length + sub.length);
  const cy = Math.max(4.35, tableBottom + 0.3);
  if (cy < 6.2) {
    disp(s, upper("Price per square foot"), { x: 0.6, y: cy, w: 5.4, h: 0.35, fontSize: 16 });
    s.addChart(pres.charts.BAR, [{ name: "$ / SF", labels: rows.map((r) => r.address), values: rows.map((r) => Math.round((r.price / r.sf) * 100) / 100) }], {
      x: 0.6, y: cy + 0.35, w: 5.6, h: 7.6 - (cy + 0.35), barDir: "col", chartColors: [C.brand], showValue: true, dataLabelFormatCode: "$#,##0", dataLabelFontFace: BODY, dataLabelFontSize: 10, dataLabelColor: C.ink,
      catAxisLabelFontFace: BODY, catAxisLabelFontSize: 9, catAxisLabelColor: C.muted, valAxisHidden: true, valGridLine: { style: "none" }, showLegend: false, valAxisMinVal: 0,
    });
  }
  if (cmp.note) txt(s, cmp.note, { x: 6.5, y: cy + 0.05, w: 3.9, h: 7.5 - cy, fontSize: 13 });
}

// ---- valuation summary
R.valuation = () => {
  const s = slideWith("Valuation Summary: Sale");
  txt(s, T(val?.intro, "valuation intro"), { x: 0.6, y: 1.3, w: 9.8, h: 0.8, fontSize: 16 });
  const ind = val?.indications || [];
  const rows = [[th("Indication"), th("$ / SF", "right"), th(`x ${subj ? Number(subj).toLocaleString("en-US") : ph("SF")} SF`, "right")],
    ...ind.map((r) => [cell(r.label), cell(psf(r.psf), { align: "right" }), cell(subj ? money(Math.round(r.psf * subj / 100) * 100) : ph("SF"), { align: "right" })]),
    [cell("Opinion of value", { bold: true, fill: { color: C.tint } }), cell(d.value && subj ? `$${Math.round(d.value / subj)}` : "", { bold: true, align: "right", fill: { color: C.tint } }), cell(valueStr, { bold: true, align: "right", fill: { color: C.tint } })]];
  s.addTable(rows, tblBase({ x: 0.6, y: 2.3, w: 6.2, colW: [3.8, 1.0, 1.4], rowH: 0.5, fontSize: 13 }));
  card(s, 7.1, 2.3, 3.3, 2.5, C.brand);
  disp(s, upper("Opinion of value"), { x: 7.3, y: 2.5, w: 2.9, h: 0.3, fontSize: 14, color: C.white });
  disp(s, valueStr, { x: 7.3, y: 2.9, w: 2.9, h: 0.9, fontSize: 40, color: C.white, valign: "middle" });
  txt(s, d.value && subj ? `about $${Math.round(d.value / subj)} per square foot` : "", { x: 7.3, y: 3.95, w: 2.9, h: 0.6, fontSize: 13, color: C.white });
  disp(s, upper("Range and point value"), { x: 0.6, y: 5.1, w: 4.8, h: 0.35, fontSize: 16 });
  txt(s, T(val?.range_text, "range text"), { x: 0.6, y: 5.5, w: 4.8, h: 2.2, fontSize: 13 });
  disp(s, upper("What could move it"), { x: 5.7, y: 5.1, w: 4.7, h: 0.35, fontSize: 16 });
  txt(s, (val?.could_move?.length ? val.could_move : [ph("what could move it")]).map((t) => ({ text: t, options: { breakLine: true } })), { x: 5.7, y: 5.5, w: 4.7, h: 2.2, fontSize: 13, paraSpaceAfter: 6 });
}

// ---- strategy
R.strategy = () => {
  const s = slideWith("Marketing and Disposition Strategy");
  txt(s, T(strat.intro, "strategy intro"), { x: 0.6, y: 1.3, w: 9.8, h: 0.7, fontSize: 16 });
  const opts = (strat.options || []).slice(0, 3);
  opts.forEach((o, i) => {
    const x = 0.6 + i * 3.35;
    card(s, x, 2.2, 3.1, 2.9);
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.25, y: 2.4, w: 0.7, h: 0.7, fill: { color: C.brand }, line: { color: C.brand } });
    disp(s, String.fromCharCode(65 + i), { x: x + 0.25, y: 2.4, w: 0.7, h: 0.7, fontSize: 24, color: C.white, align: "center", valign: "middle" });
    disp(s, upper(T(o.title, "option")), { x: x + 0.25, y: 3.25, w: 2.6, h: 0.4, fontSize: 18 });
    txt(s, T(o.text, "option text"), { x: x + 0.25, y: 3.7, w: 2.6, h: 1.35, fontSize: 13 });
  });
  if (strat.note) txt(s, strat.note, { x: 0.6, y: 5.4, w: 9.8, h: 2.0, fontSize: 14 });
}

// ---- section title slide
pres.defineSlideMaster({ title: "SECTION", background: { color: C.brand }, objects: [] });
R.divider = (sec) => {
  const s = pres.addSlide({ masterName: "SECTION" });
  s.addShape(pres.ShapeType.rect, { x: 0.6, y: 2.6, w: 0.18, h: 3.1, fill: { color: C.accent }, line: { color: C.accent } });
  disp(s, String(sec.n).padStart(2, "0"), { x: 1.1, y: 2.5, w: 3, h: 1.0, fontSize: 54, color: C.accent, valign: "middle", paraSpaceAfter: 0 });
  disp(s, upper(sec.title), { x: 1.1, y: 3.55, w: 9.3, h: 1.1, fontSize: 44, color: C.white, valign: "middle", paraSpaceAfter: 0 });
  txt(s, sec.slides.map((x) => ({ text: x.title, options: { breakLine: true } })), { x: 1.1, y: 4.8, w: 9.3, h: 1.2, fontSize: 16, color: C.white, paraSpaceAfter: 4 });
  txt(s, `${T(d.address_street, "address")}, ${T(d.address_city, "city")}`, { x: 0.6, y: 7.6, w: 9.8, h: 0.4, fontSize: 11, color: C.white, valign: "middle" });
};

// ---- about us
R.about = () => {
  const a = d.about || {};
  const s = slideWith("About Us");
  card(s, 0.6, 1.3, 5.9, 3.4);
  disp(s, upper(`Why ${firm}`), { x: 0.85, y: 1.5, w: 5.4, h: 0.35, fontSize: 16 });
  txt(s, paras(a.paragraphs?.length ? a.paragraphs : [ph("about the firm")], 13), { x: 0.85, y: 1.95, w: 5.4, h: 2.6 });
  card(s, 6.7, 1.3, 3.7, 3.4, C.brand);
  const stats = a.stats?.length ? a.stats.slice(0, 3) : [{ big: ph("stat"), label: ph("label") }];
  const sh = 3.0 / stats.length;
  stats.forEach((st, i) => {
    disp(s, T(st.big, "stat"), { x: 6.95, y: 1.45 + i * sh, w: 3.2, h: 0.6, fontSize: 28, color: C.white, valign: "middle", paraSpaceAfter: 0 });
    txt(s, T(st.label, "label"), { x: 6.95, y: 2.05 + i * sh, w: 3.2, h: sh - 0.7, fontSize: 12, color: C.white });
  });
  card(s, 0.6, 4.95, 9.8, 2.5);
  let tx = 0.85;
  if (exists(d.agent_photo)) { s.addImage({ path: d.agent_photo, x: 0.85, y: 5.2, w: 1.4, h: 1.4, rounding: true, sizing: { type: "cover", w: 1.4, h: 1.4 } }); tx = 2.5; }
  txt(s, [
    { text: T(d.agent_name, "agent name"), options: { bold: true, fontSize: 18, color: C.brand, fontFace: DISPLAY, breakLine: true } },
    { text: [d.agent_title, d.agent_license].filter(Boolean).join("  |  ") || ph("title"), options: { fontSize: 12, color: C.muted, breakLine: true } },
    { text: T(a.bio, "agent bio"), options: { fontSize: 12 } },
  ], { x: tx, y: 5.15, w: 9.65 - tx, h: 1.5, paraSpaceAfter: 4 });
  txt(s, `${T(d.agent_phone, "phone")}  |  ${T(d.agent_email, "email")}${d.web ? "  |  " + d.web : ""}`, { x: tx, y: 6.8, w: 9.65 - tx, h: 0.4, fontSize: 12, bold: true, color: C.link, valign: "middle" });
};

order.forEach((o) => R[o.key](o.sec));
pres.writeFile({ fileName: outPath }).then((f) => console.log(f));
