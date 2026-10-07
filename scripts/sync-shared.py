#!/usr/bin/env python3
"""Copy shared/ into every plugin (a plugin installs alone, so it must carry its own copy).

  python3 scripts/sync-shared.py          write the copies
  python3 scripts/sync-shared.py --check  exit 1 if any copy is stale (for CI)
"""
import json, pathlib, shutil, sys

root = pathlib.Path(__file__).resolve().parent.parent
shared = root / "shared"
man = json.load(open(shared / "manifest.json"))
plugins = sorted(p.parent.parent for p in root.glob("*/.claude-plugin/plugin.json"))
check = "--check" in sys.argv
stale = []

def files(src):
    return [src] if src.is_file() else sorted(f for f in src.rglob("*") if f.is_file())

for plug in plugins:
    for kind, names in man.items():
        if kind == "_doc":
            continue
        for name in names:
            src = shared / kind / name
            for f in files(src):
                dest = plug / kind / f.relative_to(shared / kind)
                want = f.read_bytes()
                try:
                    text = want.decode()
                    want = text.replace("{{PLUGIN}}", plug.name).encode()
                except UnicodeDecodeError:
                    pass
                if not dest.exists() or dest.read_bytes() != want:
                    stale.append(str(dest.relative_to(root)))
                    if not check:
                        dest.parent.mkdir(parents=True, exist_ok=True)
                        dest.write_bytes(want)
                        if f.suffix == ".sh":
                            dest.chmod(0o755)
if check and stale:
    print("stale:\n  " + "\n  ".join(stale)); sys.exit(1)
print(("checked" if check else "synced") + f" {len(plugins)} plugin(s)" + (f", wrote {len(stale)} file(s)" if not check else ""))
