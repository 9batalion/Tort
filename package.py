"""Generate standalone preview and ZIP with exactly one folder; no dependencies."""
from pathlib import Path
import re
import zipfile

root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'style.css').read_text(encoding='utf-8')
parts = []
for name in ['engine.js', 'data.js', 'storage.js', 'sales-ui.js', 'app.js']:
    js = (root / name).read_text(encoding='utf-8')
    js = re.sub(r'^import .*;\n', '', js, flags=re.M)
    js = re.sub(r'\bexport (?=(?:function|const|class)\b)', '', js)
    parts.append(js)
html = html.replace('<link rel="stylesheet" href="./style.css">', '<style>' + css + '</style>')
js = '\n'.join(parts).replace('</script', '<\\/script')
html = html.replace('<script type="module" src="./app.js"></script>', '<script type="module">' + js + '</script>')
(root / 'PODGLAD.html').write_text(html, encoding='utf-8')
out = root.parent / 'Pracownia-Tortow-GitHub-Pages.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(root.iterdir()):
        if path.is_file() and path.suffix != '.zip':
            archive.write(path, 'Pracownia-Tortow/' + path.name)
print(out)
