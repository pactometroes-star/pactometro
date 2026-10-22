"""Static pages for search engines: one HTML file per institution, province and section of pactómetro.es.

Every address of the site (/ayuntamiento/lugo/, /provincia/lugo/, /congreso/1982/…) is a small static page with its own
<title>, description, canonical address and the essential data written as text, so that search engines can index it
without running JavaScript. The page then loads /app.js, which draws the interactive view on top (body[data-ruta]).

Rules:
- Pages must be deterministic: no build date or anything else that changes when the data does not, so that a new build
  only touches the files whose data changed (smaller commits, accurate <lastmod> in the sitemap).
- No poll data (CIS) in static HTML: it could not be hidden during the legal blackout of art. 69.7 LOREG.
- Party names, numbers and dates are formatted exactly as in the app (nice/niceSig, es-ES numbers).
"""
import ast, html, json, os, re, unicodedata

URL = 'https://pactometro.es'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


# ---------------------------------------------------------------- formatting (same rules as the app)
def esc(s):
    return html.escape(str('' if s is None else s), quote=True)


def fmt(n):
    """Intl.NumberFormat('es-ES'): dot every three digits, but only from five digits up (1234, 12.345)."""
    if n is None:
        return '—'
    n = int(round(n))
    a = abs(n)
    s = str(a) if a < 10000 else f'{a:,}'.replace(',', '.')
    return ('-' if n < 0 else '') + s


def pct(x):
    return ('—' if x is None else f'{x:.1f}'.replace('.', ',') + ' %')


def fecha(iso):
    if not iso:
        return ''
    p = [int(x) for x in iso.split('-')]
    return f'{p[2]} de {MESES[p[1] - 1]} de {p[0]}' if len(p) == 3 else str(p[0])


def slug(s):
    s = unicodedata.normalize('NFKD', str(s).lower().replace('·', ''))
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def lista_y(xs):
    xs = list(xs)
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' y ' + xs[-1] if xs else ''


class Nombres:
    """nice() and niceSig() from the app, with the same word lists (read from the app source)."""
    def __init__(self, js):
        arr = lambda name: ast.literal_eval(re.search(r'const %s = new Set\((\[.*?\])\);' % name, js, re.S).group(1))
        self.ACR, self.PART = set(arr('ACR')), set(arr('PART'))
        self.FIX = ast.literal_eval(re.search(r'const SIG_FIX = (\{.*?\});', js).group(1))

    def nice(self, s):
        s = str(s or '')
        if not s or s != s.upper() or not re.search(r'[A-ZÁÉÍÓÚÑÇÀÈÒÏÜ]{3}', s):
            return s
        first = [True]

        def rep(m):
            w = m.group(0)
            up = re.sub(r"[·'’]", '', w.upper())
            if up in self.ACR:
                out = w.upper()
            elif not first[0] and w in self.PART:
                out = w
            elif re.match(r"^(d|l)['’].", w):
                out = w[:2] + w[2].upper() + w[3:]
            else:
                out = w[0].upper() + w[1:]
            first[0] = False
            return out
        return re.sub(r"(?:[^\W\d_]|[·'’])+", rep, s.lower())

    def sig(self, s):
        s = str(s or '')
        if s.upper() in self.FIX:
            return self.FIX[s.upper()]
        return self.nice(s) if (re.search(r'\s', s) and len(s) > 6 and s == s.upper()) else s


def minimas(rows, maj, n_max=18):
    """Minimal winning coalitions (as minimalWinning in the app). rows: [sig, nom, color, fam, votos, esc]."""
    P = sorted([r for r in rows if r[5] > 0], key=lambda r: -r[5])[:n_max]
    n, out = len(P), []
    for mask in range(1, 1 << n):
        s, mn, k, mem = 0, 10 ** 9, 0, []
        for i in range(n):
            if mask & (1 << i):
                s += P[i][5]; k += 1; mn = min(mn, P[i][5]); mem.append(P[i])
        if s >= maj and s - mn < maj:
            out.append((k, s, mem))
    out.sort(key=lambda x: (x[0], x[1]))
    return out


# ---------------------------------------------------------------- building blocks
def tabla(rows, N, validos=None, unidad='Escaños', caption=''):
    has_v = any(r[4] for r in rows)
    validos = validos or sum((r[4] or 0) for r in rows)
    th = '<th>Candidatura</th>' + ('<th class="n">Votos</th><th class="n">%</th>' if has_v else '') + f'<th class="n">{unidad}</th>'
    trs = []
    for r in rows:
        nm = N.nice(r[1]) if r[1] and slug(r[1]) != slug(r[0]) else ''
        cells = f'<td><span class="sw" style="background:{r[2]}"></span><b>{esc(N.sig(r[0]))}</b>' + (f' <span class="muted small nm">{esc(nm)}</span>' if nm else '') + '</td>'
        if has_v:
            cells += f'<td class="n">{fmt(r[4])}</td><td class="n">{pct(100 * r[4] / validos) if r[4] and validos else "—"}</td>'
        cells += f'<td class="n"><b>{r[5]}</b></td>'
        trs.append(f'<tr>{cells}</tr>')
    cap = f'<caption class="vh">{esc(caption)}</caption>' if caption else ''
    return f'<div class="tablewrap"><table class="data">{cap}<thead><tr>{th}</tr></thead><tbody>{"".join(trs)}</tbody></table></div>'


def frase_pactos(rows, total, N, unidad='escaños', max_c=3):
    maj = total // 2 + 1
    con = [r for r in rows if r[5] > 0]
    if not con:
        return ''
    top = max(con, key=lambda r: r[5])
    if top[5] >= maj:
        return f'{esc(N.sig(top[0]))} tiene mayoría absoluta en solitario: {top[5]} de {total} {unidad}.'
    cs = minimas(rows, maj)[:max_c]
    if not cs:
        return f'Ninguna combinación de candidaturas alcanza la mayoría absoluta de {maj} {unidad}.'
    ej = [' + '.join(esc(N.sig(m[0])) for m in c[2]) + f' ({c[1]})' for c in cs]
    return f'Ninguna candidatura tiene mayoría absoluta ({maj} de {total} {unidad}). La alcanzan, por ejemplo: {lista_y(ej)}.'


def migas_html(migas):
    if not migas:
        return ''
    partes = [f'<a href="{u}">{esc(t)}</a>' for t, u in migas[:-1]] + [f'<span aria-current="page">{esc(migas[-1][0])}</span>']
    return '<nav class="migas" aria-label="Estás en">' + ' › '.join(partes) + '</nav>'


def cabecera(eyebrow, h1, lede='', extra=''):
    return (f'<div class="page-head"><span class="eyebrow">{eyebrow}</span><h1>{esc(h1)}</h1>'
            + (f'<p class="lede">{lede}</p>' if lede else '') + extra + '</div>')


def seccion(h2, cuerpo, intro='', id=''):
    ida = f' id="{id}"' if id else ''
    return f'<div class="section"{ida}><div class="section-head"><h2>{esc(h2)}</h2>' + (f'<p>{intro}</p>' if intro else '') + f'</div>{cuerpo}</div>'


def enlaces(items, cls='enlaces'):
    return f'<ul class="{cls}">' + ''.join(f'<li><a href="{u}">{esc(t)}</a>{(" " + extra) if extra else ""}</li>' for t, u, extra in items) + '</ul>'


def resumen_corto(rows, N, max_p=6):
    con = [r for r in rows if r[5] > 0]
    return ', '.join(f'{N.sig(r[0])} {r[5]}' for r in con[:max_p]) + (', …' if len(con) > max_p else '')


def dhondt(votos, escanos, umbral=None):
    """votos: {key: n}. Barrera opcional (votos mínimos). Devuelve {key: escaños} y la lista ordenada de cocientes."""
    ok = {k: v for k, v in votos.items() if v and (umbral is None or v >= umbral)}
    q = sorted(((v / d, v, k) for k, v in ok.items() for d in range(1, escanos + 1)), key=lambda x: (-x[0], -x[1]))
    out = {}
    for _, _, k in q[:escanos]:
        out[k] = out.get(k, 0) + 1
    return out, q


# ---------------------------------------------------------------- page factory
class Generador:
    def __init__(self, data_dir, js_src):
        self.D = data_dir
        self.js = js_src
        self.N = Nombres(js_src)
        L = lambda f: json.load(open(os.path.join(data_dir, f), encoding='utf-8'))
        self.G, self.A, self.Lo, self.M = L('generales.json'), L('autonomicas.json'), L('locales.json'), L('municipios.json')
        self.prog = L('programas.json') if os.path.exists(os.path.join(data_dir, 'programas.json')) else None
        self.ESC_2026 = json.loads(re.search(r'const ESC_2026 = (\{.*?\});', js_src).group(1))
        cal = re.search(r'const CAL_29N = (\[.*?\n\]);', js_src, re.S).group(1)
        cal = re.sub(r'//[^\n]*', '', cal).replace('null', 'None')
        self.CAL = ast.literal_eval(cal)
        self.prov_n = self.M['provincias']
        self.ccaa = self.M['ccaa']
        self.prov_ca = {}
        self._mun = {}
        # provincia → slug (the Spanish name for the bilingual ones, as people search them)
        ESPECIAL = {'01': 'alava', '03': 'alicante', '12': 'castellon', '46': 'valencia', '07': 'baleares'}
        self.slug_prov = {k: ESPECIAL.get(k, slug(v.split('/')[0])) for k, v in self.prov_n.items()}
        assert len(set(self.slug_prov.values())) == len(self.slug_prov)
        self.auto_de_ca = {a['ccaa']: k for k, a in self.A.items() if a.get('ccaa')}
        # municipio → slug; same name in several provinces → name + province
        filas = self.M['municipios']
        base = {r[0]: slug(r[1]) for r in filas}
        cuenta = {}
        for s in base.values():
            cuenta[s] = cuenta.get(s, 0) + 1
        self.slug_mun, usados = {}, set()
        for r in filas:
            s = base[r[0]]
            if cuenta[s] > 1:
                s = f'{s}-{self.slug_prov[r[2]]}'
            if s in usados:
                s = f'{s}-{r[0]}'
            usados.add(s)
            self.slug_mun[r[0]] = s
        self.dup_nombre = {r[0] for r in filas if cuenta[base[r[0]]] > 1}

    def mun_prov(self, p):
        if p not in self._mun:
            self._mun[p] = json.load(open(os.path.join(self.D, 'mun', p + '.json'), encoding='utf-8'))
        return self._mun[p]

    def url_mun(self, ine):
        return f'/ayuntamiento/{self.slug_mun[ine]}/'

    def url_prov(self, p):
        return f'/provincia/{self.slug_prov[p]}/'

    def pagina(self, path, ruta, titulo, descripcion, contenido, migas=None, indexar=True):
        return {'path': path, 'ruta': ruta, 'titulo': titulo, 'descripcion': re.sub(r'\s+', ' ', descripcion).strip(),
                'contenido': contenido, 'migas': migas or [], 'indexar': indexar}

    # ------------------------------------------------ Congreso
    def congreso(self):
        G, N = self.G, self.N
        out = []
        keys = sorted(G['congreso'])
        def leg(e):
            return 'Legislatura constituyente' if e['leg'] == 'Constituyente' else f"{e['leg']} Legislatura"
        def nombre(k):
            return (('abril' if k.endswith('-04') else 'noviembre') + ' de ' + k[:4]) if '-' in k else k
        hist = enlaces([(f"Generales de {nombre(k)}", '/congreso/' if k == '2023' else f'/congreso/{k}/',
                         esc(resumen_corto(G['congreso'][k]['r'], N, 3))) for k in reversed(keys)], 'enlaces col2')
        for k in keys:
            e = G['congreso'][k]
            rows = sorted(e['r'], key=lambda r: (-r[5], -(r[4] or 0)))
            validos = (e['votantes'] - e['nulos']) if e.get('votantes') and e.get('nulos') is not None else None
            path = '/congreso/' if k == '2023' else f'/congreso/{k}/'
            ganador = rows[0]
            part = f" La participación fue del {pct(100 * e['votantes'] / e['censo'])}." if e.get('censo') and e.get('votantes') else ''
            txt = (f"Elecciones generales del {fecha(e['fecha'])} ({leg(e)}). {esc(N.sig(ganador[0]))} obtuvo {ganador[5]} de los 350 escaños"
                   + (f" con {fmt(ganador[4])} votos" if ganador[4] else '') + f".{part} " + frase_pactos(rows, 350, N))
            cont = (migas_html([('Inicio', '/'), ('Congreso', '/congreso/'), (f'Generales {nombre(k)}', path)])
                    + cabecera('Congreso de los Diputados · 350 escaños · mayoría absoluta 176', 'Elecciones del 23 de julio de 2023' if k == '2023' else f'Elecciones generales de {nombre(k)}', txt)
                    + seccion('Resultados por candidatura', tabla(rows, N, validos, caption=f'Resultados de las elecciones generales de {nombre(k)}'),
                              'Totales nacionales oficiales del Ministerio del Interior.' if e.get('fuente') == 'oficial' else esc(e.get('nota') or ''))
                    + seccion('Todas las elecciones generales', hist)
                    + seccion('Y ahora, el 29-N', enlaces([('Simulador para el 29-N', '/congreso/simulador/', ''), ('El Congreso al disolverse las Cortes', '/congreso/disolucion/', ''),
                                                           ('Calendario y cómo se reparten los escaños', '/29n/', ''), ('Escaños de tu provincia', '/29n/', '')])))
            tit = ('Congreso: escaños del 23-J y pactos posibles' if k == '2023' else f'Elecciones generales de {nombre(k)}: escaños y pactos') + ' · pactómetro.es'
            desc = (f"Elecciones generales del {fecha(e['fecha'])}: {resumen_corto(rows, N)}. Mayoría absoluta: 176 de 350 escaños. "
                    "Calcula qué pactos suman y descarga los datos oficiales.")
            out.append(self.pagina(path, 'congreso' if k == '2023' else f'congreso-{k}', tit, desc, cont, [('Inicio', '/'), ('Congreso', '/congreso/')] + ([] if k == '2023' else [(f'Generales {nombre(k)}', path)])))
        d = G['disolucion']
        rows = sorted(d['r'], key=lambda r: -r[5])
        cont = (migas_html([('Inicio', '/'), ('Congreso', '/congreso/'), ('Al disolverse las Cortes', '/congreso/disolucion/')])
                + cabecera('Congreso de los Diputados · 350 escaños', 'Composición al disolverse las Cortes',
                           f"Así estaba el Congreso cuando se disolvieron las Cortes, el 6 de octubre de 2026, con los cambios de la legislatura. {frase_pactos(rows, 350, N)}")
                + seccion('Escaños por grupo', tabla(rows, N, caption='Composición del Congreso al disolverse las Cortes'), esc(d.get('nota') or '')))
        out.append(self.pagina('/congreso/disolucion/', 'congreso-disolucion', 'El Congreso al disolverse las Cortes (octubre de 2026) · pactómetro.es',
                               f"Composición del Congreso al disolverse las Cortes en octubre de 2026: {resumen_corto(rows, N)}. Prueba qué mayorías eran posibles.", cont,
                               [('Inicio', '/'), ('Congreso', '/congreso/'), ('Al disolverse las Cortes', '/congreso/disolucion/')]))
        cont = (migas_html([('Inicio', '/'), ('Congreso', '/congreso/'), ('Simulador 29-N', '/congreso/simulador/')])
                + cabecera('Congreso de los Diputados · 350 escaños · mayoría absoluta 176', 'Simulador para el 29-N',
                           'Reparte los 350 escaños como creas que quedarán tras las elecciones generales del 29 de noviembre de 2026 y comprueba qué pactos alcanzan la mayoría absoluta. '
                           'Puedes partir del resultado del 23-J, de la composición al disolverse las Cortes, de la última encuesta del CIS o de cero.')
                + seccion('Cómo funciona', '<ul class="enlaces"><li>Cambia los escaños de cada candidatura con − y + o escribiendo el número.</li><li>Marca el voto de cada una en la investidura: sí, abstención o no.</li>'
                          '<li>El pactómetro calcula si hay investidura en primera votación (176 síes) o en segunda (más síes que noes).</li><li>Comparte tu escenario con un enlace o una imagen.</li></ul>'))
        out.append(self.pagina('/congreso/simulador/', 'congreso-simulador', 'Simulador de pactos para el 29-N · pactómetro.es',
                               'Simula el resultado de las elecciones generales del 29 de noviembre de 2026: reparte los 350 escaños del Congreso, prueba pactos y compártelos.', cont,
                               [('Inicio', '/'), ('Congreso', '/congreso/'), ('Simulador 29-N', '/congreso/simulador/')]))
        return out

    # ------------------------------------------------ 29-N
    def p29n(self):
        G, N = self.G, self.N
        c = G['convocatoria']
        e23 = G['congreso']['2023']['provincias']
        filas = sorted(self.ESC_2026.items(), key=lambda kv: self.prov_n[kv[0]])
        tb = ('<div class="tablewrap"><table class="data"><caption class="vh">Diputados por provincia en 2026 y en 2023</caption><thead><tr><th>Provincia</th><th class="n">2026</th><th class="n">2023</th></tr></thead><tbody>'
              + ''.join(f'<tr><td><a href="{self.url_prov(p)}">{esc(self.prov_n[p])}</a></td><td class="n"><b>{n}</b></td><td class="n">{e23[p]["escanos"]}</td></tr>' for p, n in filas) + '</tbody></table></div>')
        cal = '<ol class="enlaces">' + ''.join(f'<li><b>{fecha(i)}{(" – " + fecha(f)) if f else ""}</b>: {esc(q)}. {esc(d)}</li>' for i, f, q, d in self.CAL) + '</ol>'
        cont = (migas_html([('Inicio', '/'), ('Elecciones 29-N', '/29n/')])
                + cabecera('Elecciones generales · domingo 29 de noviembre de 2026', 'Elecciones generales del 29-N',
                           f"Las Cortes se disolvieron por el Real Decreto 806/2026 (BOE del {fecha(c['decreto_boe'])}). La campaña va del {fecha(c['campana'][0])} al {fecha(c['campana'][1])} "
                           f"y se vota el domingo 29 de noviembre de 9:00 a 20:00. Se eligen 350 diputados y {c['senadores_electos']} senadores; las nuevas Cortes se constituyen el {fecha(c['constitucion_cortes'])}.")
                + seccion('Calendario electoral', cal)
                + '<div class="section" id="sec-prov"><div class="section-head"><h2>Diputados por provincia</h2><p>Madrid gana un escaño (38) y Cádiz pierde uno (8) respecto a 2023. Cada provincia reparte sus escaños con la ley D\'Hondt entre las candidaturas que superan el 3 % de los votos válidos.</p></div>' + tb + '</div>'
                + seccion('Más sobre el 29-N', enlaces([('Programas electorales de los partidos', '/29n/programas/', ''), ('Simulador para el 29-N', '/congreso/simulador/', ''),
                                                        ('Encuesta de pactómetro.es', '/encuesta/', ''), ('Resultados en directo (noche electoral)', '/29n/resultados/', '')])))
        out = [self.pagina('/29n/', '29n', 'Elecciones generales del 29-N de 2026: calendario y escaños · pactómetro.es',
                           'Elecciones generales del 29 de noviembre de 2026: calendario electoral, diputados por provincia, cómo se reparten los escaños (D\'Hondt y barrera del 3 %), tipos de voto y cómo votar.',
                           cont, [('Inicio', '/'), ('Elecciones 29-N', '/29n/')])]
        # programas
        if self.prog:
            P = self.prog
            ESTADO = {'pendiente': 'Pendiente de publicación', 'publicado': 'Programa publicado', 'compromisos': 'Compromisos publicados (no es el programa completo)'}
            items = []
            for x in P['partidos']:
                est = ESTADO.get(x['estado'], x['estado'])
                doc = f' · <a href="{esc(x["documento"])}" rel="noopener">{esc(x.get("documento_titulo") or "Documento oficial")}</a>' if x.get('documento') else ''
                web = f' · <a href="{esc(x["web"])}" rel="noopener">web oficial</a>' if x.get('web') else ''
                fch = f' ({fecha(x["fecha"])})' if x.get('fecha') else ''
                nota = f'<br><span class="small muted">{esc(x["nota"])}</span>' if x.get('nota') else ''
                items.append(f'<li><b>{esc(x["nombre"])}</b>: {esc(est)}{fch}{doc}{web}{nota}</li>')
            cont = (migas_html([('Inicio', '/'), ('Elecciones 29-N', '/29n/'), ('Programas electorales', '/29n/programas/')])
                    + cabecera('Elecciones generales del 29-N', 'Programas electorales del 29-N',
                               f'Qué partidos han publicado ya su programa para las elecciones generales del 29 de noviembre, con el enlace a su web oficial. Revisado el {fecha(P["revisado"])}.')
                    + seccion('Estado de los programas', '<ul class="enlaces">' + ''.join(items) + '</ul>', esc(P.get('nota') or '')))
            out.append(self.pagina('/29n/programas/', 'programas', 'Programas electorales del 29-N: qué ha publicado cada partido · pactómetro.es',
                                   'Programas electorales de las elecciones generales del 29 de noviembre de 2026: qué partidos los han publicado, cuándo y dónde leerlos en sus webs oficiales.',
                                   cont, [('Inicio', '/'), ('Elecciones 29-N', '/29n/'), ('Programas electorales', '/29n/programas/')]))
        cont = (migas_html([('Inicio', '/'), ('Elecciones 29-N', '/29n/'), ('Resultados en directo', '/29n/resultados/')])
                + cabecera('Noche electoral · domingo 29 de noviembre de 2026', 'Resultados del 29-N en directo',
                           'La noche del 29 de noviembre, a partir del cierre de los colegios, esta página mostrará el escrutinio provisional: los escaños de cada candidatura en el Congreso, '
                           'el porcentaje escrutado y qué pactos alcanzan la mayoría absoluta de 176. Se actualiza sola, sin recargar.'))
        out.append(self.pagina('/29n/resultados/', 'directo', 'Resultados de las elecciones generales del 29-N en directo · pactómetro.es',
                               'Resultados provisionales de las elecciones generales del 29 de noviembre de 2026 en directo: escaños en el Congreso, escrutinio y pactos posibles.',
                               cont, [('Inicio', '/'), ('Elecciones 29-N', '/29n/'), ('Resultados en directo', '/29n/resultados/')]))
        return out

    # ------------------------------------------------ provinces (general elections + municipalities)
    def provincias(self):
        G, N = self.G, self.N
        e23 = G['congreso']['2023']
        out = []
        dip = self.Lo['diputaciones']
        munis = {}
        for r in self.M['municipios']:
            munis.setdefault(r[2], []).append(r)
        for p, nombre in sorted(self.prov_n.items(), key=lambda kv: kv[1]):
            pv = e23['provincias'][p]
            ca = self.M['prov_ccaa'].get(p)
            rows = sorted(pv['r'], key=lambda r: (-r[5], -(r[4] or 0)))
            esc23, esc26 = pv['escanos'], self.ESC_2026[p]
            votos = {r[0]: r[4] for r in rows if r[4]}
            # last seat and the votes the runner-up lacked (D'Hondt over the listed candidatures)
            rep, q = dhondt(votos, esc23)
            real = {r[0]: r[5] for r in rows if r[5]}
            ult = ''
            if rep == real and esc23 > 1:
                w_q, w_v, w = q[esc23 - 1]
                cands = [(votos[k] / (rep.get(k, 0) + 1), k) for k in votos if k != w]
                if cands:
                    nq, nk = max(cands)
                    falta = int(w_q * (rep.get(nk, 0) + 1) - votos[nk]) + 1
                    ult = (f'<p>El último de los {esc23} escaños fue para <b>{esc(N.sig(w))}</b>. A <b>{esc(N.sig(nk))}</b> le faltaron unos <b>{fmt(falta)} votos</b> '
                           f'para quitárselo (ley D\'Hondt, con los votos de las candidaturas que aparecen en la tabla).</p>')
            cambio = ''
            if esc26 != esc23:
                rep26, _ = dhondt(votos, esc26)
                gana = [k for k in rep26 if rep26[k] > rep.get(k, 0)]
                pierde = [k for k in rep if rep[k] > rep26.get(k, 0)]
                quien = (f'{esc(N.sig(gana[0]))} habría ganado ese escaño' if gana else f'{esc(N.sig(pierde[0]))} habría perdido un escaño') if (gana or pierde) else ''
                cambio = (f'<p>En 2026 {esc(nombre)} elige <b>{esc26} diputados</b>, {"uno más" if esc26 > esc23 else "uno menos"} que en 2023. '
                          f'Con los votos del 23-J y {esc26} escaños, {quien}.</p>') if quien else ''
            senado = ('2 senadores' if p in ('51', '52') else 'senadores por islas' if p in ('07', '35', '38') else '4 senadores')
            lista = sorted(munis.get(p, []), key=lambda r: slug(r[1]))
            lis = '<ul class="enlaces col3">' + ''.join(f'<li><a href="{self.url_mun(r[0])}">{esc(r[1])}</a></li>' for r in lista) + '</ul>'
            links = [('Simulador para el 29-N', '/congreso/simulador/', ''), ('Calendario del 29-N', '/29n/', '')]
            if p in dip:
                links.insert(0, (self.nombre_dip(p, dip[p]), f'/diputacion/{self.slug_prov[p]}/', ''))
            if ca in self.auto_de_ca:
                a = self.A[self.auto_de_ca[ca]]
                links.insert(1, (a['camara'], f"/parlamento/{a['id']}/", ''))
            lede = (f"El 29 de noviembre de 2026 la provincia de {esc(nombre)} elige <b>{esc26} {'diputado' if esc26 == 1 else 'diputados'}</b> al Congreso"
                    f"{' (los mismos que en 2023)' if esc26 == esc23 else f' ({esc23} en 2023)'} y {senado}.")
            cont = (migas_html([('Inicio', '/'), ('Elecciones 29-N', '/29n/'), (nombre, self.url_prov(p))])
                    + cabecera(f'Provincia · {esc(self.ccaa.get(ca, ""))}', f'{nombre}: elecciones generales y municipios', lede)
                    + seccion(f'Resultado del 23-J de 2023 en {nombre}', tabla(rows, N, caption=f'Elecciones generales de 2023 en {nombre}') + ult + cambio,
                              'Votos y diputados de cada candidatura en la provincia (Ministerio del Interior).')
                    + '<div id="prov-cis"></div>'
                    + seccion(f'Ayuntamientos de {nombre}', lis, f'Los {len(lista)} municipios con datos: entra en cualquiera para ver su pleno y calcular quién puede gobernar.', 'sec-municipios')
                    + seccion('También en esta provincia', enlaces(links)))
            tit = f'{nombre}: diputados el 29-N, resultados del 23-J y ayuntamientos · pactómetro.es'
            desc = (f"{nombre} elige {esc26} diputados el 29-N. Resultado del 23-J en la provincia: {resumen_corto(rows, N)}. "
                    f"Pactos, municipios y diputación de {nombre}.")
            out.append(self.pagina(self.url_prov(p), f'prov-{p}', tit, desc, cont, [('Inicio', '/'), ('Elecciones 29-N', '/29n/'), (nombre, self.url_prov(p))]))
        return out

    # ------------------------------------------------ regional parliaments
    def autonomias(self):
        N = self.N
        out = []
        ids = sorted(self.A, key=lambda k: self.A[k]['n'])
        items = []
        for k in ids:
            a = self.A[k]
            els = a['elecciones']
            e = els[-1]
            rows = sorted(e['r'], key=lambda r: (-r[5], -(r[4] or 0)))
            items.append((a['camara'], f'/parlamento/{k}/', esc(f"({fecha(e['fecha'])}: {resumen_corto(rows, N, 4)})")))
            gob = a.get('gobierno') or {}
            hist = '<ul class="enlaces">' + ''.join(f'<li><a href="/parlamento/{k}/?eleccion={x["fecha"]}">{fecha(x["fecha"])}</a>: {esc(resumen_corto(sorted(x["r"], key=lambda r: -r[5]), N, 4))}</li>' for x in reversed(els)) + '</ul>'
            lede = (f"Elecciones del {fecha(e['fecha'])}: {e['escanos']} escaños, mayoría absoluta en {e['escanos'] // 2 + 1}. {frase_pactos(rows, e['escanos'], N)}"
                    + (f" Presidencia actual: {esc(gob.get('presidente'))}." if gob.get('presidente') else ''))
            fuente = 'Datos recopilados de fuentes públicas.' if e.get('fuente') == 'compilada' else 'Datos oficiales.'
            cont = (migas_html([('Inicio', '/'), ('Autonomías', '/autonomias/'), (a['n'], f'/parlamento/{k}/')])
                    + cabecera(f"{esc(a['camara'])} · {e['escanos']} escaños", a['n'], lede)
                    + seccion(f"Resultado de las elecciones del {fecha(e['fecha'])}", tabla(rows, N, caption=f"{a['camara']}: elecciones del {fecha(e['fecha'])}"), fuente)
                    + seccion('Todas sus elecciones', hist))
            out.append(self.pagina(f'/parlamento/{k}/', f'auto-{k}', f"{a['camara']}: escaños y pactos posibles · pactómetro.es",
                                   f"{a['camara']}, elecciones del {fecha(e['fecha'])}: {resumen_corto(rows, N)}. Mayoría absoluta: {e['escanos'] // 2 + 1} de {e['escanos']}. Todas sus elecciones desde 1980.",
                                   cont, [('Inicio', '/'), ('Autonomías', '/autonomias/'), (a['n'], f'/parlamento/{k}/')]))
        cont = (migas_html([('Inicio', '/'), ('Autonomías', '/autonomias/')])
                + cabecera('17 parlamentos y 2 asambleas', 'Parlamentos autonómicos', 'Resultado de las últimas elecciones de cada comunidad y ciudad autónoma, con todas sus elecciones desde 1980.')
                + seccion('Últimas elecciones de cada comunidad', enlaces(items)))
        out.append(self.pagina('/autonomias/', 'autonomias', 'Parlamentos autonómicos: escaños y pactos posibles · pactómetro.es',
                               'Escaños y mayorías de los 17 parlamentos autonómicos y las asambleas de Ceuta y Melilla, con todas sus elecciones desde 1980.', cont,
                               [('Inicio', '/'), ('Autonomías', '/autonomias/')]))
        return out

    # ------------------------------------------------ provincial and island governments
    def nombre_dip(self, p, x):
        DIP = ast.literal_eval(re.search(r'const DIP_NOMBRE = (\{.*?\});', self.js).group(1))
        return DIP.get(p) or 'Diputación de ' + x['n'].split('/')[0]

    def locales(self):
        N = self.N
        out = []
        T = {'diputaciones': ('dip', 'diputacion', 'Diputación provincial'), 'cabildos': ('cab', 'cabildo', 'Cabildo insular'),
             'consells': ('con', 'consell', 'Consell insular'), 'juntas': ('jjgg', 'juntas-generales', 'Juntas Generales')}
        grupos = []
        for grupo, (t, base, tipo_txt) in T.items():
            items = []
            for k, x in sorted(self.Lo[grupo].items(), key=lambda kv: kv[1]['n']):
                ys = sorted(x['e'])
                e = x['e'][ys[-1]]
                rows = sorted(e['r'], key=lambda r: (-r[5], -(r[4] or 0)))
                nombre = self.nombre_dip(k, x) if t == 'dip' else ('Cabildo de ' + x['n'] if t == 'cab' else x['n'])
                idurl = self.slug_prov[k] if t == 'dip' else k
                path = f'/{base}/{idurl}/'
                items.append((nombre, path, ''))
                cuando = ('Constituida tras las elecciones municipales del ' if t == 'dip' else 'Elecciones del ') + fecha(e['fecha'])
                hist = '<ul class="enlaces">' + ''.join(f'<li><a href="{path}?eleccion={y}">{y}</a>: {esc(resumen_corto(sorted(x["e"][y]["r"], key=lambda r: -r[5]), N, 4))}</li>' for y in reversed(ys)) + '</ul>'
                lede = f"{cuando}. {e['escanos']} {'diputados provinciales' if t == 'dip' else 'consejeros' if t in ('cab', 'con') else 'junteros'}; mayoría absoluta en {e['escanos'] // 2 + 1}. {frase_pactos(rows, e['escanos'], N)}"
                extra = []
                if t == 'dip':
                    extra = [(f'Elecciones generales y ayuntamientos de {x["n"]}', self.url_prov(k), '')]
                cont = (migas_html([('Inicio', '/'), ('Diputaciones y cabildos', '/locales/'), (nombre, path)])
                        + cabecera(f"{tipo_txt} · {e['escanos']} escaños", nombre, lede)
                        + seccion('Resultado', tabla(rows, N, caption=f'{nombre}: {cuando}'))
                        + (seccion('Todas sus elecciones', hist) if len(ys) > 1 else '')
                        + (seccion('En la provincia', enlaces(extra)) if extra else ''))
                desc = f"{nombre}: {resumen_corto(rows, N)}. Mayoría absoluta: {e['escanos'] // 2 + 1} de {e['escanos']}. Calcula los pactos posibles y consulta todas sus elecciones."
                out.append(self.pagina(path, f'{t}-{k}', f'{nombre}: escaños y pactos posibles · pactómetro.es', desc, cont,
                                       [('Inicio', '/'), ('Diputaciones y cabildos', '/locales/'), (nombre, path)]))
            grupos.append(seccion({'dip': 'Diputaciones provinciales', 'cab': 'Cabildos insulares', 'con': 'Consells insulars', 'jjgg': 'Juntas Generales'}[t], enlaces(items, 'enlaces col2')))
        cont = (migas_html([('Inicio', '/'), ('Diputaciones y cabildos', '/locales/')])
                + cabecera('Gobiernos provinciales e insulares', 'Diputaciones, cabildos, consells y juntas',
                           'Las 38 diputaciones de régimen común se forman con los resultados municipales de cada partido judicial; los cabildos canarios, los consells baleares y las juntas generales vascas se eligen en urnas propias.')
                + ''.join(grupos))
        out.append(self.pagina('/locales/', 'locales', 'Diputaciones, cabildos, consells y juntas generales · pactómetro.es',
                               'Composición y pactos posibles en las diputaciones provinciales, los cabildos canarios, los consells baleares y las juntas generales vascas.', cont,
                               [('Inicio', '/'), ('Diputaciones y cabildos', '/locales/')]))
        return out

    # ------------------------------------------------ municipalities
    def municipios(self):
        N = self.N
        out = []
        TIPO = {'G': 'listas cerradas', 'A': 'listas abiertas (municipio de 100 a 250 habitantes)', 'C': 'concejo abierto (menos de 100 habitantes)'}
        dips = self.Lo['diputaciones']
        for r in self.M['municipios']:
            ine, nombre, p = r[0], r[1], r[2]
            P = self.mun_prov(p)
            m = P['m'].get(ine)
            if not m:
                continue
            ys = sorted(m['e'])
            y = ys[-1]
            tipo, escanos, censo, votantes, blancos, nulos, res = m['e'][y]
            rows = sorted(([*P['c'][ci], v, s] for ci, v, s in res), key=lambda x: (-x[5], -(x[4] or 0)))
            validos = votantes - nulos if votantes is not None and nulos is not None else None
            prov = self.prov_n[p]
            ccaa = self.ccaa.get(P.get('ca'), '')
            dup = f' ({prov})' if ine in self.dup_nombre else ''
            path = self.url_mun(ine)
            mas = max(rows, key=lambda x: x[4] or 0) if rows else None
            if tipo == 'C' or escanos < 2:
                el = [x for x in rows if x[5] > 0]
                txt = (f'En las elecciones municipales de {y}, {esc(nombre)} funcionó en concejo abierto: los vecinos eligen directamente al alcalde, sin pleno de concejales.'
                       + (f' Candidatura con electo: {esc(", ".join(N.sig(x[0]) for x in el))}.' if el else ''))
                cuerpo = tabla(rows, N, validos, 'Electo', f'Elecciones municipales de {y} en {nombre}') if rows else ''
            else:
                maj = escanos // 2 + 1
                txt = (f'Elecciones municipales de {y}: {escanos} concejales elegidos por {TIPO.get(tipo, "")}; la mayoría absoluta está en {maj}. '
                       + (f'{esc(N.sig(mas[0]))} fue la lista más votada, con {fmt(mas[4])} votos ({pct(100 * mas[4] / validos) if validos else "—"}) y {mas[5]} concejales. ' if mas and mas[4] else '')
                       + frase_pactos(rows, escanos, N, 'concejales'))
                cuerpo = tabla(rows, N, validos, 'Concejales', f'Elecciones municipales de {y} en {nombre}')
            rc = []
            if censo:
                rc.append(f'censo {fmt(censo)}')
            if votantes is not None and censo:
                rc.append(f'votantes {fmt(votantes)} ({pct(100 * votantes / censo)})')
            if blancos is not None:
                rc.append(f'en blanco {fmt(blancos)}')
            if nulos is not None:
                rc.append(f'nulos {fmt(nulos)}')
            cuerpo += f'<p class="small muted">{"; ".join(rc).capitalize()}. Resultados oficiales del Ministerio del Interior.</p>' if rc else ''
            hist_items = []
            for k in reversed(ys[-6:-1]):
                rk = m['e'][k]
                rr = sorted(([*P['c'][ci], v, s] for ci, v, s in rk[6]), key=lambda x: -x[5])
                hist_items.append(f'<li><a href="{path}?eleccion={k}">{k}</a>: {"concejo abierto" if rk[0] == "C" else esc(resumen_corto(rr, N, 4))}</li>')
            links = [(f'Elecciones generales y ayuntamientos de {prov}', self.url_prov(p), '')]
            if p in dips:
                links.insert(0, (self.nombre_dip(p, dips[p]), f'/diputacion/{self.slug_prov[p]}/', ''))
            pob = f' · {fmt(r[4])} habitantes' if r[4] else ''
            cont = (migas_html([('Inicio', '/'), ('Ayuntamientos', '/ayuntamientos/'), (prov, self.url_prov(p)), (nombre, path)])
                    + cabecera(f'{esc(prov)} · {esc(ccaa)}{pob}', f'Ayuntamiento de {nombre}{dup}', txt)
                    + seccion(f'Resultado de las municipales de {y}', cuerpo)
                    + (seccion('Elecciones anteriores', '<ul class="enlaces">' + ''.join(hist_items) + '</ul>') if hist_items else '')
                    + seccion('En la provincia', enlaces(links)))
            if tipo == 'C' or escanos < 2:
                desc = f'{nombre} ({prov}) funciona en concejo abierto: los vecinos eligen directamente al alcalde. Resultados de las elecciones municipales de {y} y anteriores.'
            else:
                desc = (f'Elecciones municipales de {y} en {nombre} ({prov}): {resumen_corto(rows, N)}. Mayoría absoluta: {escanos // 2 + 1} de {escanos} concejales. '
                        'Calcula los pactos posibles y consulta todas sus elecciones desde 1979.')
            out.append(self.pagina(path, f'mun-{ine}', f'Ayuntamiento de {nombre}{dup}: concejales y pactos · pactómetro.es', desc, cont,
                                   [('Inicio', '/'), ('Ayuntamientos', '/ayuntamientos/'), (prov, self.url_prov(p)), (nombre, path)]))
        # search page: provinces → municipalities
        cap = [r for r in self.M['municipios'] if r[0] in set(self.M['capitales'])]
        provs = sorted(self.prov_n.items(), key=lambda kv: kv[1])
        cont = (migas_html([('Inicio', '/'), ('Ayuntamientos', '/ayuntamientos/')])
                + cabecera('Todos los municipios de España', 'Ayuntamientos',
                           f'Busca tu municipio para ver su pleno, calcular quién puede gobernar y recorrer sus elecciones municipales desde 1979. {fmt(len(self.M["municipios"]))} municipios con resultados oficiales del Ministerio del Interior.')
                + seccion('Capitales', enlaces([(r[1], self.url_mun(r[0]), '') for r in sorted(cap, key=lambda r: slug(r[1]))], 'enlaces col3'))
                + seccion('Municipios por provincia', enlaces([(f'Municipios de {n}', self.url_prov(k) + '#sec-municipios', '') for k, n in provs], 'enlaces col3')))
        out.append(self.pagina('/ayuntamientos/', 'ayuntamientos', 'Ayuntamientos: concejales y pactos de todos los municipios · pactómetro.es',
                               'Busca cualquier municipio de España: concejales, mayoría absoluta, pactos posibles y todas sus elecciones municipales desde 1979.', cont,
                               [('Inicio', '/'), ('Ayuntamientos', '/ayuntamientos/')]))
        return out

    # ------------------------------------------------ other sections
    def secciones(self, titulo_inicio, desc_inicio):
        N = self.N
        provs = sorted(self.prov_n.items(), key=lambda kv: kv[1])
        out = []
        cont = (cabecera('pactómetro.es', '¿Quién puede gobernar?', 'Calcula las mayorías y los pactos posibles en el Congreso, los parlamentos autonómicos, las diputaciones, los cabildos y los más de 8.000 ayuntamientos de España, con los resultados oficiales desde 1977.')
                + seccion('Elecciones generales del 29 de noviembre de 2026', enlaces([('Calendario y cómo se reparten los escaños', '/29n/', ''), ('Simulador para el 29-N', '/congreso/simulador/', ''),
                                                                                     ('Programas electorales', '/29n/programas/', ''), ('Encuesta de pactómetro.es', '/encuesta/', ''), ('Resultados en directo', '/29n/resultados/', '')]))
                + seccion('Instituciones', enlaces([('Congreso de los Diputados', '/congreso/', ''), ('Parlamentos autonómicos', '/autonomias/', ''), ('Diputaciones, cabildos y consells', '/locales/', ''),
                                                     ('Ayuntamientos', '/ayuntamientos/', ''), ('Histórico electoral', '/historico/', ''), ('Comparar instituciones', '/comparar/', '')]))
                + seccion('Tu provincia', enlaces([(n, self.url_prov(k), '') for k, n in provs], 'enlaces col3'), 'Diputados que elige el 29-N, resultado del 23-J y todos sus ayuntamientos.'))
        out.append(self.pagina('/', 'inicio', titulo_inicio, desc_inicio, cont))
        fijas = [
            ('/historico/', 'historico', 'Histórico electoral: elecciones generales, autonómicas y municipales · pactómetro.es', 'Histórico electoral', 'Histórico electoral',
             'Todas las elecciones generales, las investiduras y el Senado desde 1977, las autonómicas desde 1980 y los concejales de toda España desde 1979.'),
            ('/comparar/', 'comparar', 'Comparar instituciones y elecciones · pactómetro.es', 'Cruce de datos', 'Comparar',
             'Pon frente a frente hasta cuatro instituciones o elecciones (el Congreso, un parlamento, una diputación o cualquier ayuntamiento) y compara votos y escaños.'),
            ('/encuesta/', 'encuesta', 'Encuesta del 29-N: ¿a quién piensas votar? · pactómetro.es', 'Encuesta de pactómetro.es', '¿A quién piensas votar el 29-N?',
             'Encuesta abierta y anónima de pactómetro.es sobre las elecciones generales del 29 de noviembre de 2026. Se responde en un minuto; necesita JavaScript.'),
            ('/fuentes/', 'fuentes', 'Fuentes y metodología · pactómetro.es', 'Metodología', 'Fuentes y metodología',
             'De dónde salen los datos de pactómetro.es (Ministerio del Interior, Congreso de los Diputados y fuentes públicas) y cómo se calculan las mayorías.'),
            ('/aviso-legal/', 'aviso-legal', 'Aviso legal · pactómetro.es', 'Información legal', 'Aviso legal', 'Titular, condiciones de uso y propiedad intelectual de pactómetro.es.'),
            ('/privacidad/', 'privacidad', 'Política de privacidad · pactómetro.es', 'Información legal', 'Política de privacidad', 'Cómo trata pactómetro.es la información: la web no pide datos personales y la encuesta es anónima.'),
            ('/cookies/', 'cookies', 'Política de cookies · pactómetro.es', 'Información legal', 'Política de cookies', 'pactómetro.es no usa cookies. Qué guarda tu navegador y cómo borrarlo.'),
        ]
        for path, ruta, tit, eb, h1, desc in fijas:
            out.append(self.pagina(path, ruta, tit, desc, migas_html([('Inicio', '/'), (h1, path)]) + cabecera(eb, h1, esc(desc)), [('Inicio', '/'), (h1, path)]))
        return out

    def todas(self, titulo_inicio, desc_inicio):
        pags = (self.secciones(titulo_inicio, desc_inicio) + self.congreso() + self.p29n() + self.provincias()
                + self.autonomias() + self.locales() + self.municipios())
        paths = [p['path'] for p in pags]
        assert len(paths) == len(set(paths)), 'direcciones repetidas'
        return pags
