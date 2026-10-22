"""Assemble the deployable static site (dist/) from src/pactometro.html.

Output:
  app.css, app.js            the application (shared by every page, cached by the browser)
  index.html, congreso/…     one small static page per address (scripts/paginas.py): own title, description,
                             canonical address and the essential data as text; app.js draws the interactive view on top
  404.html                   page for unknown addresses
  widget/index.html          embeddable view for other websites (no cookies, no notice)
  sitemap.xml, robots.txt, .nojekyll, CNAME, data/, img/, fonts/, config.js, site.webmanifest, favicon.ico

Pages are deterministic (no build date inside), so a build only changes the files whose data changed. The date of the
last publication lives in app.js (footer «Actualizado el …»). <lastmod> in the sitemap is the date each page last changed
(kept in site/paginas-lastmod.json).

Usage: python3 scripts/build_dist.py [--zip]
"""
import os, shutil, zipfile, json, datetime, re, hashlib, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paginas import Generador, esc

SRC = '/home/claude/site/src/pactometro.html'
WIDGET_SRC = '/home/claude/site/src/widget.html'
DATA = '/home/claude/site/data'
BRAND = '/home/claude/site/brand/out'
DIST = '/home/claude/site/dist'
SITE = '/home/claude/site'
LASTMOD = os.path.join(SITE, 'paginas-lastmod.json')
URL = 'https://pactometro.es'
HOY = datetime.date.today()
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

src = open(SRC, encoding='utf-8').read()
cabeza, resto = src.split('<style>', 1)
css, resto = resto.split('</style>', 1)
shell, resto = resto.split('<script>', 1)
js, _ = resto.split('</script>', 1)
titulo_inicio = re.search(r'<title>(.*?)</title>', cabeza).group(1)
desc_inicio = re.search(r'<meta name="description" content="(.*?)">', cabeza).group(1)
assert '<!--CONTENIDO-->' in shell

gen = Generador(DATA, js)
js = (js.replace('__ACTUALIZADO_ISO__', HOY.isoformat()).replace('__ACTUALIZADO__', f'{HOY.day} de {MESES[HOY.month - 1]} de {HOY.year}')
        .replace('__SLUG_PROV__', json.dumps(gen.slug_prov, ensure_ascii=False, sort_keys=True))
        .replace('__PROV_NOMBRE__', json.dumps(gen.prov_n, ensure_ascii=False, sort_keys=True)))
assert '__ACTUALIZADO' not in js and '__SLUG_PROV__' not in js and '__PROV_NOMBRE__' not in js

# Content Security Policy (GitHub Pages can't send headers, so it goes in a <meta>). Only our own scripts run
# (no inline code); the poll and the election night may only talk to Google Apps Script.
# frame-ancestors is not allowed in a <meta>: the widget can be embedded anywhere, the rest of the site too.
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://pactometro.es; "
       "font-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; manifest-src 'self'; "
       "object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; worker-src 'none'")
ICONOS = f'''<link rel="icon" type="image/png" sizes="192x192" href="{URL}/img/icono-192.png">
<link rel="icon" type="image/png" sizes="144x144" href="{URL}/img/icono-144.png">
<link rel="icon" type="image/png" sizes="96x96" href="{URL}/img/icono-96.png">
<link rel="icon" type="image/png" sizes="48x48" href="{URL}/img/icono-48.png">
<link rel="icon" href="{URL}/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="{URL}/img/apple-touch-icon.png">'''
PUBLISHER = '{"@type":"Person","name":"Javier Pereiro Pérez","sameAs":["https://www.linkedin.com/in/javier-pereiro-p%C3%A9rez-159763213/"]}'


def jsonld(pg):
    if pg['path'] == '/':
        return ('{"@context":"https://schema.org","@type":"WebSite","name":"pactómetro.es","alternateName":["Pactómetro","pactometro.es"],'
                f'"url":"{URL}/","inLanguage":"es-ES","publisher":{PUBLISHER}}}')
    if not pg['migas']:
        return ''
    items = ','.join('{"@type":"ListItem","position":%d,"name":%s,"item":"%s%s"}' % (i + 1, json.dumps(t, ensure_ascii=False), URL, u)
                     for i, (t, u) in enumerate(pg['migas']))
    return '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + items + ']}'


def documento(pg):
    canon = URL + pg['path']
    ld = jsonld(pg)
    head = f'''<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(pg["titulo"])}</title>
<meta name="description" content="{esc(pg["descripcion"])}">
{'' if pg['indexar'] else '<meta name="robots" content="noindex">' + chr(10)}<link rel="canonical" href="{canon}">
<meta name="author" content="Javier Pereiro Pérez">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="pactómetro.es">
<meta property="og:title" content="{esc(pg["titulo"])}">
<meta property="og:description" content="{esc(pg["descripcion"])}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{URL}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#051e3e">
{ICONOS}
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/app.css">
{f'<script type="application/ld+json">{ld}</script>' if ld else ''}'''
    body = shell.strip().replace('<!--CONTENIDO-->', pg['contenido'])
    return (f'<!doctype html>\n<html lang="es">\n<head>\n{head}\n</head>\n<body data-ruta="{esc(pg["ruta"])}">\n{body}\n'
            '<script src="/config.js"></script>\n<script src="/app.js"></script>\n</body>\n</html>\n')


# ---------------------------------------------------------------- write
if os.path.exists(DIST):
    shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'img'))
open(os.path.join(DIST, 'app.css'), 'w', encoding='utf-8').write(css.strip() + '\n')
open(os.path.join(DIST, 'app.js'), 'w', encoding='utf-8').write(js.strip() + '\n')

paginas = gen.todas(titulo_inicio, desc_inicio)
paginas.append(gen.pagina('/404.html', '404', 'Página no encontrada · pactómetro.es', 'Esta dirección no corresponde a ninguna página de pactómetro.es.',
                          '<div class="error"><h1 class="h3">No encontramos esa página</h1><p class="muted">La dirección no corresponde a ninguna institución con datos. '
                          '<a href="/">Ir a la portada</a> o <a href="/ayuntamientos/">buscar un municipio</a>.</p></div>', indexar=False))
try:
    lastmod = json.load(open(LASTMOD, encoding='utf-8'))
except FileNotFoundError:
    lastmod = {}
nuevo_lastmod, total_bytes = {}, 0
for pg in paginas:
    doc = documento(pg)
    path = pg['path']
    destino = os.path.join(DIST, path.lstrip('/'), 'index.html') if path.endswith('/') else os.path.join(DIST, path.lstrip('/'))
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, 'w', encoding='utf-8').write(doc)
    total_bytes += len(doc.encode('utf-8'))
    h = hashlib.sha1(doc.encode('utf-8')).hexdigest()[:16]
    antes = lastmod.get(path)
    nuevo_lastmod[path] = antes if antes and antes[0] == h else [h, HOY.isoformat()]
json.dump(nuevo_lastmod, open(LASTMOD, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)

# widget for other websites (its own small page; no cookies, no notice, no tracking)
if os.path.exists(WIDGET_SRC):
    os.makedirs(os.path.join(DIST, 'widget'), exist_ok=True)
    w = open(WIDGET_SRC, encoding='utf-8').read().replace('__CSP__', CSP)
    open(os.path.join(DIST, 'widget', 'index.html'), 'w', encoding='utf-8').write(w)
    wj = open(WIDGET_SRC.replace('.html', '.js'), encoding='utf-8').read().replace('__SLUG_PROV__', json.dumps(gen.slug_prov, ensure_ascii=False, sort_keys=True))
    assert '__SLUG_PROV__' not in wj
    open(os.path.join(DIST, 'widget', 'widget.js'), 'w', encoding='utf-8').write(wj)

# data (municipios.json gets the address of each municipality as column 7)
shutil.copytree(DATA, os.path.join(DIST, 'data'))
M = json.load(open(os.path.join(DATA, 'municipios.json'), encoding='utf-8'))
for r in M['municipios']:
    del r[7:]
    r.append(gen.slug_mun[r[0]])
M['campos'] = M['campos'][:7] + ['slug']
json.dump(M, open(os.path.join(DIST, 'data', 'municipios.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

shutil.copytree(os.path.join(SITE, 'fonts'), os.path.join(DIST, 'fonts'))   # self-hosted Archivo and Ibarra Real Nova (OFL)
for f in ['logo.png', 'logo-oscuro.png', 'icono-32.png', 'icono-48.png', 'icono-64.png', 'icono-96.png', 'icono-144.png', 'icono-192.png', 'icono-512.png',
          'apple-touch-icon.png', 'og-image.png']:
    shutil.copy(os.path.join(BRAND, f), os.path.join(DIST, 'img', f))
shutil.copy(os.path.join(BRAND, 'favicon.ico'), os.path.join(DIST, 'favicon.ico'))
shutil.copy(os.path.join(SITE, 'config.js'), os.path.join(DIST, 'config.js'))
json.dump({
    'name': 'pactómetro.es', 'short_name': 'pactómetro', 'lang': 'es', 'start_url': '/', 'display': 'standalone',
    'background_color': '#f2f4f7', 'theme_color': '#051e3e',
    'icons': [{'src': '/img/icono-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': '/img/icono-512.png', 'sizes': '512x512', 'type': 'image/png'}],
}, open(os.path.join(DIST, 'site.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /widget/\nSitemap: {URL}/sitemap.xml\n')
urls = [f'  <url><loc>{URL}{pg["path"]}</loc><lastmod>{nuevo_lastmod[pg["path"]][1]}</lastmod></url>' for pg in paginas if pg['indexar']]
open(os.path.join(DIST, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                                   + '\n'.join(urls) + '\n</urlset>\n')
open(os.path.join(DIST, 'CNAME'), 'w').write('pactometro.es\n')
open(os.path.join(DIST, '.nojekyll'), 'w').write('')   # files are served as they are (faster deploys)

print('páginas', len(paginas), '· html', total_bytes, 'bytes · sitemap', len(urls), 'direcciones')
print('dist', sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(DIST) for f in fs), 'bytes')

if '--zip' in sys.argv:
    zp = os.path.join(SITE, 'pactometro-web.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for dp, _, fs in os.walk(DIST):
            for f in sorted(fs):
                full = os.path.join(dp, f)
                z.write(full, os.path.join('pactometro.es', os.path.relpath(full, DIST)))
        z.write(os.path.join(SITE, 'LEEME.md'), 'LEEME.md')
        z.write(os.path.join(SITE, 'encuesta-google-apps-script.gs'), 'encuesta-google-apps-script.gs')
    print('zip', os.path.getsize(zp), 'bytes')
