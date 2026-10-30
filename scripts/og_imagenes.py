"""Social preview images (og:image, 1200 × 630) for pages that are shared on their own: the 29-N poll and the
pact simulator. Rendered with the site's own fonts and logo. Run: python3 scripts/og_imagenes.py
(writes site/brand/out/og-encuesta.png and og-simulador.png; build_dist.py copies them to /img/)."""
import asyncio, os
from playwright.async_api import async_playwright

SITE = '/home/claude/site'
OUT = os.path.join(SITE, 'brand', 'out')
F = 'file://' + os.path.join(SITE, 'fonts')
LOGO = 'file://' + os.path.join(OUT, 'logo-oscuro.png')

BASE = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@font-face{{font-family:Archivo;font-weight:100 900;font-stretch:62% 125%;src:url({F}/archivo-latin-wdth-normal.woff2) format('woff2')}}
@font-face{{font-family:Ibarra;font-weight:600;src:url({F}/ibarra-real-nova-latin-600-normal.woff2) format('woff2')}}
html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{background:#051e3e;color:#fff;font-family:Archivo,sans-serif;box-sizing:border-box;padding:64px 72px 52px;display:flex;flex-direction:column}}
.k{{font-weight:650;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#9fb3cc}}
h1{{font:600 96px/1.02 Ibarra,Georgia,serif;margin:26px 0 0;letter-spacing:-.01em}}
p{{font-weight:500;font-size:31px;line-height:1.35;color:#dfe6ef;margin:26px 0 0;max-width:980px}}
.pie{{margin-top:auto;display:flex;align-items:center;justify-content:space-between}}
.pie img{{height:52px}}
.pie span{{font-weight:650;font-size:27px;color:#fff}}
.bar{{position:absolute;right:72px;top:64px;display:flex;gap:10px;align-items:flex-end}}
.bar i{{display:block;width:22px;border-radius:5px}}
</style></head><body>__CUERPO__</body></html>'''

IMAGENES = {
    'og-encuesta.png': '''<div class="k">Encuesta · elecciones generales del 29-N</div>
<h1>¿A quién piensas<br>votar el 29-N?</h1>
<p>Anónima, en un minuto y en tu provincia, solo con las candidaturas que se presentan allí.</p>
<div class="pie"><img src="__LOGO__" alt=""><span>pactometro.es/encuesta</span></div>''',
    'og-simulador.png': '''<div class="k">Calculadora de pactos · Congreso · 29-N</div>
<h1>¿Qué pactos suman<br>176 escaños?</h1>
<p>Simula el resultado del 29-N, reparte los 350 escaños y comprueba qué mayorías permiten la investidura.</p>
<div class="pie"><img src="__LOGO__" alt=""><span>pactometro.es/congreso/simulador</span></div>''',
}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1200, 'height': 630})
        for nombre, cuerpo in IMAGENES.items():
            # file:// page, so the fonts and the logo (file:// too) can load
            tmp = os.path.join(OUT, '_og_tmp.html')
            open(tmp, 'w', encoding='utf-8').write(BASE.replace('__CUERPO__', cuerpo.replace('__LOGO__', LOGO)))
            await pg.goto('file://' + tmp)
            await pg.evaluate('document.fonts.ready')
            ok = await pg.evaluate("[document.fonts.check('600 96px Ibarra'), document.fonts.check('500 31px Archivo'), document.querySelector('.pie img').naturalWidth]")
            print(nombre, 'fuentes y logo:', ok)
            os.remove(tmp)
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(OUT, nombre), type='png')
            print('escrita', os.path.join(OUT, nombre))
        await b.close()

asyncio.run(main())
