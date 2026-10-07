#!/usr/bin/env python3
"""Fill a template with data.json and render a PDF with headless Chrome.

usage: render.py <flyer|postcard|bov> data.json out.pdf [--brand <name|folder>] [--photos <folder>]
Without --brand, the brand named in <data dir>/active-brand is used, if any.
data.json "agent_photo" (headshot path) is optional; no headshot, no slot.
List fields (highlights, specs, photos) are turned into HTML here. Missing values render as
visible placeholders, never invented text.
"""
import html, json, os, pathlib, shutil, subprocess, sys, tempfile

args = [a for a in sys.argv[1:]]
brand_dir = None
data_home = pathlib.Path(os.environ.get("REAL_ESTATE_HOME") or pathlib.Path.home() / ".claude" / "real-estate")
plugin_root = pathlib.Path(__file__).resolve().parents[3]
def find_brand(name):
    """A path, else the user's own brands (survive plugin updates), else the bundled demo brands."""
    for c in (pathlib.Path(name), data_home / "brands" / name, plugin_root / "brands" / name):
        if (c / "brand.json").exists():
            return c.resolve()
    sys.exit(f"No brand pack '{name}'. Run /brokerage-sales:brand-setup, or pass a folder containing brand.json.")
photos_dir = None
if "--photos" in args:
    i = args.index("--photos"); photos_dir = pathlib.Path(args[i + 1]).expanduser().resolve(); del args[i:i + 2]
if "--brand" in args:
    i = args.index("--brand"); brand_dir = find_brand(args[i + 1]); del args[i:i + 2]
elif (data_home / "active-brand").exists():
    brand_dir = find_brand((data_home / "active-brand").read_text().strip())
kind, data_path, out = args[:3]
root = pathlib.Path(__file__).resolve().parent.parent / "references"
if kind == "bov":
    root = pathlib.Path(__file__).resolve().parents[2] / "bov" / "references"
d = json.load(open(data_path))
if brand_dir:  # brand pack fills anything data.json leaves out
    b = json.load(open(brand_dir / "brand.json"))
    missing = [k for k in ("firm", "primary_color", "display_font", "body_font", "google_fonts") if not b.get(k)]
    if missing:
        sys.exit(f"{brand_dir}/brand.json is missing: {', '.join(missing)}")
    for k, v in b.items():
        d.setdefault(k, v)
    if not d.get("logo_src") and b.get("logo_horizontal"):
        d["logo_src"] = (brand_dir / b["logo_horizontal"]).as_uri()
    if not d.get("firm_address") and (b.get("address") or b.get("city_state_zip")):
        d["firm_address"] = ", ".join(x for x in (b.get("address"), b.get("city_state_zip")) if x)
e = lambda v: html.escape(str(v))
ph = lambda name: f'<span class="ph">[{name}]</span>'

if photos_dir:  # hero = file named hero*, else first by name; next four fill the photo tiles
    imgs = sorted(p for p in photos_dir.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and not p.name.startswith("."))
    hero = next((p for p in imgs if p.stem.lower().startswith("hero")), imgs[0] if imgs else None)
    rest = [p for p in imgs if p != hero]
    if hero and not d.get("hero_photo"): d["hero_photo"] = hero.as_uri()
    if rest and not d.get("photos"): d["photos"] = [p.as_uri() for p in rest[:4]]

if kind == "bov":  # raw numbers in data.json; formatted and tabulated here
    money = lambda v: f"${float(v):,.0f}" if v not in (None, "") else None
    for k in ("range_low", "range_high", "range_mid"):  # a range from public comps is not precise to the dollar
        if d.get(k): d[k] = round(float(d[k]) / 5000) * 5000
    for k in ("range_low", "range_high", "range_mid", "value_conclusion", "asking_price", "rate_median", "rate_q1", "rate_q3"):
        d[k + "_f"] = money(d.get(k)) or ph(k.replace("_", " "))
    comps = d.get("comps", [])
    med = d.get("rate_median")
    d["comps_n"] = len(comps)
    d["comps_rows"] = "".join(
        f"<tr><td>{e(c['address'])}</td><td>{e(c['sale_date'])}</td><td class='num'>{c['sqft']:,}</td><td class='num'>{e(c.get('year_built',''))}</td>"
        f"<td class='num'>{money(c['sale_price'])}</td><td class='num'>${c['psf']:,.0f}</td>"
        f"<td class='num'>{(c['psf']/med-1)*100:+.0f}%</td></tr>" if med else
        f"<tr><td>{e(c['address'])}</td><td>{e(c['sale_date'])}</td><td class='num'>{c['sqft']:,}</td><td class='num'>{e(c.get('year_built',''))}</td><td class='num'>{money(c['sale_price'])}</td><td class='num'>${c['psf']:,.0f}</td><td></td></tr>"
        for c in comps)
    d["deed_rows"] = "".join(
        f"<tr><td>{e(x['date'])}</td><td class='num'>{money(x['price']) if x.get('price') else '&mdash;'}</td><td>{e(x['grantor'])}</td><td>{e(x['grantee'])}</td></tr>"
        for x in d.get("deeds", []))
    for key, name in (("facts", "facts_rows"), ("ownership", "owner_rows")):
        d[name] = "".join(f"<tr><td>{e(k)}</td><td>{e(v)}</td></tr>" for k, v in d.get(key, {}).items())
    d["cover_image"] = d.get("cover_image") or d.get("aerial_labeled", "")
d["highlights_li"] = "".join(f"<li>{e(x)}</li>" for x in d.get("highlights", [])) or f"<li>{ph('highlights')}</li>"
d["specs_rows"] = "".join(f"<tr><td>{e(k)}</td><td>{e(v)}</td></tr>" for k, v in d.get("specs", {}).items()) or f"<tr><td>{ph('specs')}</td><td></td></tr>"
d["photo_tiles"] = "".join(f"<div style=\"background-image:url('{e(p)}')\"></div>" for p in d.get("photos", [])[:4])
d["area_overview_html"] = "".join(f"<p>{e(p)}</p>" for p in d.get("area_overview", [])) or f"<p>{ph('area overview')}</p>"

d["agent_photo_html"] = (f'<img class="agent" src="{e(pathlib.Path(d["agent_photo"]).expanduser().resolve().as_uri() if "://" not in d["agent_photo"] else d["agent_photo"])}" alt="">'
                         if d.get("agent_photo") else "")
for k, v in (("cover_image", ""),("prepared_date", ""),("hero_photo", ""), ("aerial_labeled", ""), ("agent_title", ""), ("agent_license", ""), ("listing_type", ""),
             ("accent_color", d.get("primary_color", "#000")), ("link_color", d.get("primary_color", "#000")), ("ink_color", "#1f2421"),
             ("muted_color", "#5a635d"), ("tint_color", "#f1f3f0"), ("border_color", "#dfe4dc"), ("headline_transform", "none")):
    d.setdefault(k, v)
d["logo_html"] = (f'<img src="{e(d["logo_src"])}" alt="{e(d.get("firm",""))}">' if d.get("logo_src")
                  else f'<span class="tag" style="font-size:16pt">{e(d.get("firm",""))}</span>')
tpl = (root / f"{kind}.html").read_text()
for k, v in d.items():
    if isinstance(v, (str, int, float)):
        tpl = tpl.replace("{{" + k + "}}", v if k.endswith(("_li", "_rows", "_tiles", "_html", "_f")) else e(v))
import re
tpl = re.sub(r"\{\{(\w+)\}\}", lambda m: ph(m.group(1)), tpl)

chrome = next((c for c in ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", shutil.which("google-chrome"), shutil.which("chromium")] if c and pathlib.Path(c).exists()), None)
if not chrome:
    sys.exit("No Chrome/Chromium found. Install Chrome, or open the .html and print to PDF.")
with tempfile.TemporaryDirectory() as t:
    f = pathlib.Path(t) / "doc.html"; f.write_text(tpl)
    pathlib.Path(out).with_suffix(".html").write_text(tpl)
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
                    f"--print-to-pdf={out}", f.as_uri()], check=True, capture_output=True)
print(out)
