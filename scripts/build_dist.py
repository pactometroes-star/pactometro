"""Assemble the deployable static site (dist/) from src/pactometro.html, plus the ZIP for the user.

ZIP layout:
  pactometro.es/                      <- the folder to upload to the hosting
  LEEME.md                            <- instructions (domain, hosting, poll, updates)
  encuesta-google-apps-script.gs      <- script for the Google Sheet that stores poll answers
"""
import os, shutil, zipfile, json, datetime, re, hashlib, base64
SRC ='/home/claude/site/src/pactometro.html'
DATA = '/home/claude/site/data'
BRAND = '/home/claude/site/brand/out'
DIST = '/home/claude/site/dist'
SITE = '/home/claude/site'
URL = 'https://pactometro.es/'

src = open(SRC, encoding='utf-8').read()
# «Actualizado el …»: the date of this build, in the footer, Fuentes and the 29-N page
HOY = datetime.date.today()
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
src = src.replace('__ACTUALIZADO_ISO__', HOY.isoformat()).replace('__ACTUALIZADO__', f'{HOY.day} de {MESES[HOY.month - 1]} de {HOY.year}')
assert '__ACTUALIZADO' not in src
head_part, body_part = src.split('</style>', 1)
head_part += '</style>'
meta = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="author" content="Javier Pereiro Pérez">
<meta name="copyright" content="© 2026 Javier Pereiro Pérez">
<link rel="canonical" href="{URL}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="pactómetro.es">
<meta property="og:title" content="pactómetro.es">
<meta property="og:description" content="Mayorías y pactos posibles en el Congreso, los parlamentos autonómicos, las diputaciones y todos los ayuntamientos de España, con el histórico electoral oficial.">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="{URL}img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#051e3e">
<link rel="icon" type="image/png" sizes="192x192" href="{URL}img/icono-192.png">
<link rel="icon" type="image/png" sizes="144x144" href="{URL}img/icono-144.png">
<link rel="icon" type="image/png" sizes="96x96" href="{URL}img/icono-96.png">
<link rel="icon" type="image/png" sizes="48x48" href="{URL}img/icono-48.png">
<link rel="icon" href="{URL}favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="{URL}img/apple-touch-icon.png">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebSite","name":"pactómetro.es","alternateName":["Pactómetro","pactometro.es"],"url":"{URL}","inLanguage":"es-ES","publisher":{{"@type":"Person","name":"Javier Pereiro Pérez","sameAs":["https://www.linkedin.com/in/javier-pereiro-p%C3%A9rez-159763213/"]}}}}</script>
<link rel="manifest" href="site.webmanifest">
'''
# config.js must load before the main script so the poll knows where to send answers
body_part = body_part.replace('<script>\n', '<script src="config.js"></script>\n<script>\n', 1)
doc = '<!doctype html>\n<html lang="es">\n<head>\n' + meta + head_part.strip() + '\n</head>\n<body>\n' + body_part.strip() + '\n</body>\n</html>\n'

# Content Security Policy (GitHub Pages can't send headers, so it goes in a <meta>). Only our own files and the
# inline app script (allowed by its hash) can run; the poll may only POST to Google Apps Script.
# frame-ancestors is not allowed in a <meta> and is left out on purpose.
inline = re.findall(r'<script>(.*?)</script>', doc, re.S)
hashes = ' '.join("'sha256-%s'" % base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() for x in inline)
CSP = ("default-src 'self'; script-src 'self' " + hashes + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://pactometro.es; "
       "font-src 'self'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; manifest-src 'self'; "
       "object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; worker-src 'none'")
doc = doc.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + CSP + '">\n'
                  '<meta name="referrer" content="strict-origin-when-cross-origin">\n', 1)
assert 'Content-Security-Policy' in doc and len(inline) == 1, len(inline)

if os.path.exists(DIST):
    shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, 'img'))
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(doc)
shutil.copytree(DATA, os.path.join(DIST, 'data'))
shutil.copytree(os.path.join(SITE, 'fonts'), os.path.join(DIST, 'fonts'))   # self-hosted Archivo and Ibarra Real Nova (OFL)
for f in ['logo.png', 'logo-oscuro.png', 'icono-32.png', 'icono-48.png', 'icono-64.png', 'icono-96.png', 'icono-144.png', 'icono-192.png', 'icono-512.png',
          'apple-touch-icon.png', 'og-image.png']:
    shutil.copy(os.path.join(BRAND, f), os.path.join(DIST, 'img', f))
shutil.copy(os.path.join(BRAND, 'favicon.ico'), os.path.join(DIST, 'favicon.ico'))
cfg_path = os.path.join(SITE, 'config.js')
if not os.path.exists(cfg_path):
    open(cfg_path, 'w', encoding='utf-8').write(
        "/* Configuración de pactómetro.es\n"
        "   encuestaURL: pega entre las comillas la URL de tu aplicación web de Google Apps Script\n"
        "   (la que termina en /exec). Mientras esté vacía, la encuesta aparece como «Muy pronto». */\n"
        "window.PACTOMETRO_CONFIG = {\n  encuestaURL: ''\n};\n")
shutil.copy(cfg_path, os.path.join(DIST, 'config.js'))
json.dump({
    'name': 'pactómetro.es', 'short_name': 'pactómetro', 'lang': 'es', 'start_url': '/', 'display': 'standalone',
    'background_color': '#f2f4f7', 'theme_color': '#051e3e',
    'icons': [{'src': 'img/icono-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'img/icono-512.png', 'sizes': '512x512', 'type': 'image/png'}],
}, open(os.path.join(DIST, 'site.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {URL}sitemap.xml\n')
open(os.path.join(DIST, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>{URL}</loc><lastmod>{datetime.date.today().isoformat()}</lastmod></url>\n</urlset>\n')
open(os.path.join(DIST, 'CNAME'), 'w').write('pactometro.es\n')

zp = os.path.join(SITE, 'pactometro-web.zip')
if os.path.exists(zp):
    os.remove(zp)
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for dp, _, fs in os.walk(DIST):
        for f in sorted(fs):
            full = os.path.join(dp, f)
            z.write(full, os.path.join('pactometro.es', os.path.relpath(full, DIST)))
    z.write(os.path.join(SITE, 'LEEME.md'), 'LEEME.md')
    z.write(os.path.join(SITE, 'encuesta-google-apps-script.gs'), 'encuesta-google-apps-script.gs')
print('zip', os.path.getsize(zp), 'bytes')
print('dist ready', sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(DIST) for f in fs), 'bytes')
