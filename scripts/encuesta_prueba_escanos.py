"""Prueba (NO se publica): reparto de escaños a partir de las respuestas de la encuesta abierta de pactómetro.es.

Uso: python3 scripts/encuesta_prueba_escanos.py <Encuesta_29-N.xlsx> <salida.xlsx>

Método (el mismo que usaba la web con el CIS: cambio proporcional sobre el 23-J + D'Hondt), con estas diferencias:
  1. Las respuestas se ponderan por comunidad autónoma (peso = votos válidos del 23-J), porque se responde muy desigual.
     Variante B: además, por recuerdo de voto del 23-J (raking con pesos recortados).
  2. Cada partido se estima SOLO entre quienes podían votarlo y solo se reparte donde se presenta (candidaturas del BOE,
     data/candidaturas.json): ninguna circunscripción única.
  3. Si en el territorio de una candidatura hay menos de 10 respuestas válidas, no se inventa nada: se mantiene su nivel del 23-J.
  4. «Nulo», «No votaré» y «Aún no lo sé» no cuentan como voto válido. «Otro partido» y «En blanco» sí (cuentan para la barrera).
Referencias: el CIS 3584 con este mismo método y el reparto central de la web (horquillas del CIS).
"""
import json, sys, unicodedata, random
import numpy as np, pandas as pd

D = '/home/claude/site/data'
G = json.load(open(f'{D}/generales.json', encoding='utf-8'))['congreso']['2023']
C = json.load(open(f'{D}/candidaturas.json', encoding='utf-8'))['provincias']
CIS = json.load(open(f'{D}/cis.json', encoding='utf-8'))
P = G['provincias']

ESC = {"02":4,"03":12,"04":6,"01":4,"33":7,"05":3,"06":5,"07":8,"08":32,"48":8,"09":4,"10":4,"11":8,"39":5,"12":5,"13":5,"14":6,"15":8,"16":3,"20":6,"17":6,"18":7,"19":3,"21":5,"22":3,"23":5,"24":4,"25":4,"27":4,"28":38,"29":11,"30":10,"31":5,"32":4,"34":3,"35":8,"36":7,"26":4,"37":4,"38":7,"40":3,"41":12,"42":2,"43":6,"44":3,"45":6,"46":16,"47":5,"49":3,"50":7,"51":1,"52":1}
CCAA = {'Andalucía': '04 11 14 18 21 23 29 41', 'Aragón': '22 44 50', 'Asturias': '33', 'Illes Balears': '07', 'Canarias': '35 38',
        'Cantabria': '39', 'Castilla y León': '05 09 24 34 37 40 42 47 49', 'Castilla-La Mancha': '02 13 16 19 45', 'Cataluña': '08 17 25 43',
        'C. Valenciana': '03 12 46', 'Extremadura': '06 10', 'Galicia': '15 27 32 36', 'Madrid': '28', 'Murcia': '30', 'Navarra': '31',
        'País Vasco': '01 20 48', 'La Rioja': '26', 'Ceuta': '51', 'Melilla': '52'}
PROV_CCAA = {p: c for c, ps in CCAA.items() for p in ps.split()}

NOM = {'pp': 'PP', 'psoe': 'PSOE', 'vox': 'Vox', 'fa': 'Frente Amplio', 'podemos': 'Podemos', 'erc': 'ERC', 'junts': 'Junts', 'bildu': 'EH Bildu',
       'pnv': 'EAJ-PNV', 'bng': 'BNG', 'compromis': 'Compromís', 'aa': 'Adelante Andalucía', 'cc': 'Coalición Canaria', 'upc': 'Unidad del Pueblo Canario',
       'upn': 'UPN-PP', 'gbai': 'Geroa Bai', 'texiste': 'Teruel Existe', 'sy': 'Soria Ya', 'salf': 'SALF', 'd21': 'Democracia 21', 'fo': 'Frente Obrero',
       'otro': 'Otros partidos', 'blanco': 'En blanco'}
PARTIDOS = [k for k in NOM if k not in ('otro', 'blanco')]
OPT = {'PP': 'pp', 'PSOE': 'psoe', 'Vox': 'vox', 'Frente Amplio': 'fa', 'Podemos': 'podemos', 'Democracia 21': 'd21', 'Se Acabó La Fiesta': 'salf',
       'Frente Obrero': 'fo', 'ERC': 'erc', 'Junts': 'junts', 'EH Bildu': 'bildu', 'PNV': 'pnv', 'BNG': 'bng', 'Compromís': 'compromis',
       'Coalición Canaria': 'cc', 'Unidad del Pueblo Canario': 'upc', 'UPN': 'upn', 'Geroa Bai': 'gbai', 'Adelante Andalucía': 'aa',
       'Teruel Existe': 'texiste', 'Coalición Existe': 'texiste', 'Soria Ya': 'sy', 'Otro partido': 'otro', 'En blanco': 'blanco'}
LISTA = {'upnpp': 'upn'}                     # clave de data/candidaturas.json -> clave del modelo (las demás coinciden)


def norm(s): return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower().strip()
COD = {norm(v['n']): k for k, v in P.items()}

# ------------------------------------------------------------------ presencia y base del 23-J
PRES = {p: {LISTA.get(l['k'], l['k']) for l in v['listas']} & set(PARTIDOS) for p, v in C.items()}
FAM = {'pp': {'pp'}, 'psoe': {'psoe'}, 'vox': {'vox'}, 'erc': {'erc'}, 'junts': {'junts'}, 'bildu': {'bildu'}, 'pnv': {'pnv'}, 'bng': {'bng'},
       'cc': {'cc'}, 'gbai': {'gbai'}, 'texiste': {'texiste'}, 'upc': {'nc'}, 'upn': {'upn', 'pp'},
       'fa': {'sumar', 'podemos'}, 'podemos': {'sumar', 'podemos'}, 'compromis': {'sumar', 'podemos'}, 'aa': {'sumar', 'podemos', 'aa'}}
PLANO = {'salf', 'fo', 'd21'}                # no se presentaron en 2023: mismo nivel en todas las provincias donde se presentan
VT = {p: sum(r[4] or 0 for r in v['r']) for p, v in P.items()}
WP = {p: VT[p] / sum(VT.values()) for p in P}
B = {}
for p, v in P.items():
    B[p] = {}
    for j in PRES[p]:
        if j in PLANO: B[p][j] = 1.0
        elif j == 'sy': B[p][j] = sum(r[4] or 0 for r in v['r'] if r[0] == 'SY') / VT[p]
        else: B[p][j] = sum(r[4] or 0 for r in v['r'] if r[3] in FAM[j]) / VT[p]
TERR = {j: [p for p in P if j in PRES[p]] for j in PARTIDOS}


def dhondt(sh, escanos):
    ok = {k: s for k, s in sh.items() if s >= 3.0 and k not in ('otro', 'blanco')}
    q = sorted(((s / d, s, k) for k, s in ok.items() for d in range(1, escanos + 1)), reverse=True)[:escanos]
    out = {}
    for _, _, k in q: out[k] = out.get(k, 0) + 1
    return out


def reparto(T, sin=()):
    """T: % nacional de cada partido (fracciones sobre voto válido, con 'otro' y 'blanco'; lo que falta vale 0).
    sin: partidos de los que no hay datos suficientes: mantienen su nivel del 23-J (los que no existían en 2023, 0).
    Devuelve escaños y % por provincia."""
    f = {}
    for j in PARTIDOS:
        den = sum(WP[p] * B[p].get(j, 0) for p in TERR[j])
        if j in sin or den == 0: f[j] = 0.0 if (j in PLANO or den == 0) else 1.0
        else: f[j] = T.get(j, 0.0) / den
    resto = 100 * (T.get('otro', 0) + T.get('blanco', 0))
    seats, shares = {}, {}
    for p in P:
        raw = {j: f[j] * B[p][j] for j in PRES[p]}
        tot = sum(raw.values())
        sh = {j: (100 - resto) * v / tot for j, v in raw.items()} if tot else {}
        shares[p] = sh
        for j, n in dhondt(sh, ESC[p]).items(): seats[j] = seats.get(j, 0) + n
        shares[p]['_s'] = dhondt(sh, ESC[p])
    return seats, shares


# ------------------------------------------------------------------ respuestas
def cargar(xlsx, con_revisar=True, sin_duplicados=False):
    r = pd.read_excel(xlsx, 'Respuestas').dropna(how='all'); r['hoja'] = 'Respuestas'
    if con_revisar:
        v = pd.read_excel(xlsx, 'Revisar').dropna(how='all'); v['hoja'] = 'Revisar'; r = pd.concat([r, v], ignore_index=True)
    r.columns = ['t', 'int', 'rec', 'prov', 'hoja']
    if sin_duplicados: r = r.drop_duplicates(['t', 'int', 'rec', 'prov']).reset_index(drop=True)
    r['pc'] = r['prov'].map(lambda s: COD[norm(s)])
    r['ccaa'] = r['pc'].map(PROV_CCAA)
    r['k'] = r['int'].map(OPT)                       # None: no vale como voto (Nulo, No votaré, Aún no lo sé)
    return r


WCC = {}
for c, ps in CCAA.items(): WCC[c] = sum(VT[p] for p in ps.split())
WCC = {c: v / sum(WCC.values()) for c, v in WCC.items()}

# objetivo de recuerdo de voto (% del censo del 23-J; los que no tenían edad: ~3,9 % del censo actual, supuesto)
tot_par = {}
for r in G['r']: tot_par[r[3]] = tot_par.get(r[3], 0) + (r[4] or 0)
VOT_TOT = sum(sum(r[4] or 0 for r in v['r']) for v in P.values())
SIN_EDAD = 0.039
def _f(*fams): return sum(tot_par.get(x, 0) for x in fams)
REC = {'PP': _f('pp'), 'PSOE': _f('psoe'), 'Vox': _f('vox'), 'Sumar': _f('sumar', 'podemos'), 'ERC': _f('erc'), 'Junts': _f('junts'),
       'EH Bildu': _f('bildu'), 'PNV': _f('pnv'), 'BNG': _f('bng'), 'Coalición Canaria': _f('cc'), 'UPN': _f('upn')}
REC['Otro partido'] = VOT_TOT - sum(REC.values())
REC['En blanco o nulo'] = G['blancos'] + G['nulos']
REC['No votó'] = G['censo'] - G['votantes']
REC = {k: v / G['censo'] * (1 - SIN_EDAD) for k, v in REC.items()}
REC['No tenía edad para votar'] = SIN_EDAD


def pesos(df, rec=False, tope=5.0):
    """Pesos de cada respuesta. Comunidad (siempre) y, si rec, recuerdo de voto (raking con pesos recortados)."""
    n = len(df); w = np.ones(n)
    cc = df['ccaa'].values; presentes = sorted(set(cc)); tw = {c: WCC[c] for c in presentes}; s = sum(tw.values()); tw = {c: v / s for c, v in tw.items()}
    rc = df['rec'].values; conocido = np.array([isinstance(x, str) and x in REC for x in rc])
    for _ in range(100 if rec else 1):
        for c in presentes:
            m = cc == c; w[m] *= tw[c] * w.sum() / w[m].sum()
        if not rec: break
        tot = w[conocido].sum()
        for k, v in REC.items():
            m = conocido & (rc == k)
            if m.any(): w[m] *= v * tot / w[m].sum()
        w *= n / w.sum(); w = np.clip(w, 0.1, tope * 1.0); w *= n / w.sum()
    return w


def estimar(df, w):
    v = df['k'].notna().values
    den = w[v].sum()
    T = {k: w[(df['k'] == k).values].sum() / den for k in OPT.values() if (df['k'] == k).any()}
    return T


def neff(w): return w.sum() ** 2 / (w ** 2).sum()


def nterr_de(df):
    return {j: int((df['k'].notna() & df['pc'].isin(TERR[j])).sum()) for j in PARTIDOS}


def sin_de(df, minimo=10):
    """Partidos con menos de `minimo` respuestas válidas en las provincias donde se presentan."""
    return {j for j, n in nterr_de(df).items() if n < minimo}


# ------------------------------------------------------------------ referencia: CIS 3584 con el mismo método
CIS_T = {'psoe': 33.3, 'pp': 25.5, 'vox': 18.4, 'fa': 4.9, 'erc': 3.1, 'bildu': 1.8, 'compromis': 1.6, 'aa': 1.5, 'junts': 1.2, 'podemos': 1.1,
         'bng': 1.0, 'pnv': 0.7, 'upc': 0.4, 'salf': 1.4, 'cc': 0.2, 'otro': 3.4, 'blanco': 0.5}
CIS_T = {k: v / 100 for k, v in CIS_T.items()}
CIS_T['fo'] = 0.0; CIS_T['d21'] = 0.0
CIS_CENTRAL = {p['k']: p['esc'] for p in CIS['partidos']}


def semillas(df, B_=300, rec=False, seed=7):
    rng = np.random.default_rng(seed); res = []
    grupos = {c: np.where(df['ccaa'].values == c)[0] for c in sorted(set(df['ccaa']))}
    for _ in range(B_):
        idx = np.concatenate([rng.choice(ix, size=len(ix), replace=True) for ix in grupos.values()])
        d = df.iloc[idx].reset_index(drop=True)
        w = pesos(d, rec=rec)
        s, _ = reparto(estimar(d, w), sin_de(d))
        res.append(s)
    return res


def main(xlsx, salida):
    df = cargar(xlsx)
    n_total, n_valid = len(df), int(df['k'].notna().sum())
    wA = pesos(df); wB = pesos(df, rec=True)
    TA, TB = estimar(df, wA), estimar(df, wB)
    T0 = estimar(df, np.ones(len(df)))
    nt = nterr_de(df)
    sinA = sin_de(df)
    sA, shA = reparto(TA, sinA); sB, shB = reparto(TB, sinA); s0, _ = reparto(T0, sinA)
    sC, _ = reparto(CIS_T, {'upn', 'gbai', 'texiste', 'sy'})
    dfd = cargar(xlsx, sin_duplicados=True); sD, _ = reparto(estimar(dfd, pesos(dfd)), sin_de(dfd))
    dfr = cargar(xlsx, con_revisar=False); sR, _ = reparto(estimar(dfr, pesos(dfr)), sin_de(dfr))
    bsA = semillas(df, rec=False); bsB = semillas(df, rec=True, B_=200)
    q = lambda bs, j: tuple(int(np.percentile([b.get(j, 0) for b in bs], x)) for x in (5, 50, 95))
    print('respuestas', n_total, 'válidas', n_valid, '| n efectivo A', round(neff(wA[df['k'].notna().values]), 1), 'B', round(neff(wB[df['k'].notna().values]), 1))
    for s, nom in ((sA, 'A'), (sB, 'B'), (s0, 'sin ponderar'), (sC, 'CIS mismo método'), (sD, 'sin duplicados'), (sR, 'sin Revisar')):
        print(nom, sum(s.values()), {NOM[k]: v for k, v in sorted(s.items(), key=lambda x: -x[1])})
    print('sin datos suficientes (se mantiene el 23-J):', sorted(sinA))
    print('respuestas válidas en el territorio de cada partido:', nt)
    print('T_A', {k: round(100 * v, 1) for k, v in sorted(TA.items(), key=lambda x: -x[1])})
    print('T_B', {k: round(100 * v, 1) for k, v in sorted(TB.items(), key=lambda x: -x[1])})
    return dict(df=df, wA=wA, wB=wB, TA=TA, TB=TB, T0=T0, sA=sA, sB=sB, s0=s0, sC=sC, sD=sD, sR=sR, shA=shA, shB=shB, bsA=bsA, bsB=bsB, nt=nt, sin=sinA, q=q)


def excel(R, salida):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    df = R['df']; v = df['k'].notna().values
    G23 = {}
    for r in G['r']:
        k = {'pp': 'pp', 'psoe': 'psoe', 'vox': 'vox', 'sumar': 'fa', 'erc': 'erc', 'junts': 'junts', 'bildu': 'bildu', 'pnv': 'pnv', 'bng': 'bng', 'cc': 'cc', 'upn': 'upn'}.get(r[3])
        if k: G23[k] = G23.get(k, 0) + (r[5] or 0)
    wb = Workbook()
    azul = PatternFill('solid', fgColor='051E3E'); gris = PatternFill('solid', fgColor='EEF1F5'); amar = PatternFill('solid', fgColor='FFF4CC')
    cab = Font(bold=True, color='FFFFFF'); fino = Side(style='thin', color='C8D0DA')
    def hoja(ws, filas, anchos, cabecera=1, titulo=None):
        if titulo: ws.append([titulo]); ws['A1'].font = Font(bold=True, size=13); ws.append([])
        for f in filas: ws.append(f)
        h = (3 if titulo else 1)
        for c in ws[h]: c.font = cab; c.fill = azul; c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
        for i, a in enumerate(anchos): ws.column_dimensions[chr(65 + i)].width = a
        for row in ws.iter_rows(min_row=h + 1):
            for c in row: c.border = Border(bottom=fino)
        ws.freeze_panes = ws.cell(row=h + 1, column=2)
    # 1. Escaños
    ws = wb.active; ws.title = 'Escaños'
    orden = sorted(PARTIDOS, key=lambda j: -(R['sA'].get(j, 0) + R['sB'].get(j, 0)))
    rg = lambda bs, j: '%d–%d' % (R['q'](bs, j)[0], R['q'](bs, j)[2])
    filas = [['Candidatura', 'A · respuestas ponderadas por comunidad', 'A · rango de simulación (90 %)', 'B · A + recuerdo de voto 23-J', 'B · rango de simulación (90 %)',
              'Respuestas sin ponderar', 'CIS 3584 con el mismo método', 'CIS 3584 · reparto central de la web', 'Resultado del 23-J']]
    for j in orden:
        if not any([R['sA'].get(j), R['sB'].get(j), R['s0'].get(j), R['sC'].get(j), CIS_CENTRAL.get(j), G23.get(j)]) and rg(R['bsA'], j) == '0–0' and rg(R['bsB'], j) == '0–0': continue
        nd = 'sin datos (nivel del 23-J)'
        filas.append([NOM[j], R['sA'].get(j, 0), nd if j in R['sin'] else rg(R['bsA'], j), R['sB'].get(j, 0), nd if j in R['sin'] else rg(R['bsB'], j), R['s0'].get(j, 0), R['sC'].get(j, 0),
                      CIS_CENTRAL.get({'upc': 'upc'}.get(j, j), 0) if j not in ('upn',) else '', G23.get(j, 0)])
    filas.append(['Total', sum(R['sA'].values()), '', sum(R['sB'].values()), '', sum(R['s0'].values()), sum(R['sC'].values()), 350, 350])
    hoja(ws, filas, [30, 20, 18, 20, 18, 18, 20, 22, 16], titulo='PRUEBA con las respuestas de la encuesta abierta del 29-N · NO publicada · no es una proyección')
    ws.row_dimensions[3].height = 48
    for c in ws[ws.max_row]: c.font = Font(bold=True)
    for row in ws.iter_rows(min_row=4, max_row=ws.max_row, min_col=2): 
        for c in row: c.alignment = Alignment(horizontal='center')
    ws.append([]); ws.append(['El rango muestra cuánto cambia el reparto al repetir la encuesta con otras respuestas parecidas (simulación con las mismas respuestas, remuestreadas por comunidad): 300 repeticiones en A y 200 en B. Es solo el error de muestreo; no incluye el sesgo de quien responde.'])
    ws.append([f'Respuestas: {len(df)} ({int((df.hoja == "Respuestas").sum())} de «Respuestas» y {int((df.hoja == "Revisar").sum())} de «Revisar»); {int(v.sum())} con voto válido. Tamaño efectivo tras ponderar: A {neff(R["wA"][v]):.0f}, B {neff(R["wB"][v]):.0f}.'])
    # 2. Voto
    ws2 = wb.create_sheet('Voto %')
    filas = [['Candidatura', 'Respuestas (nº)', 'Sin ponderar (% voto válido)', 'A · ponderado por comunidad', 'B · A + recuerdo 23-J', 'CIS 3584 (estimación)', 'Respuestas válidas en su territorio', 'Cómo se ha tratado']]
    cisest = {p['k']: p['est'] for p in CIS['partidos']}
    for j in orden + ['otro', 'blanco']:
        n = int((df['k'] == j).sum()); tn = R['nt'].get(j)
        trato = ''
        if j in R['sin']: trato = 'Menos de 10 respuestas válidas en su territorio: se mantiene el nivel del 23-J'
        filas.append([NOM[j], n, round(100 * R['T0'].get(j, 0), 1), round(100 * R['TA'].get(j, 0), 1), round(100 * R['TB'].get(j, 0), 1),
                      {'fa': cisest.get('fa'), 'erc': cisest.get('erc'), 'upn': None}.get(j, cisest.get(j)) if j not in ('otro', 'blanco') else {'otro': 3.4, 'blanco': 0.5}[j], tn if tn is not None else '', trato])
    hoja(ws2, filas, [30, 14, 18, 18, 18, 18, 20, 62])
    ws2.row_dimensions[1].height = 48
    # 3. Provincias
    ws3 = wb.create_sheet('Por provincia')
    cis_prov = CIS['proyeccion']['provincias']
    fmt = lambda d: ', '.join(f'{NOM.get(k, k)} {n}' for k, n in sorted(d.items(), key=lambda x: -x[1]))
    filas = [['Provincia', 'Escaños', 'Respuestas', 'A · reparto', 'B · reparto', 'CIS 3584 · reparto central de la web']]
    for p in sorted(P, key=lambda p: P[p]['n']):
        filas.append([P[p]['n'], ESC[p], int((df['pc'] == p).sum()), fmt(R['shA'][p]['_s']), fmt(R['shB'][p]['_s']), fmt({k: n for k, n in cis_prov[p]['r'].items() if n})])
    hoja(ws3, filas, [24, 9, 11, 52, 52, 52])
    # 4. Notas
    ws4 = wb.create_sheet('Método y avisos')
    notas = [
        ['Qué es esto'], ['Una prueba interna con las respuestas de la encuesta abierta de pactómetro.es. No es una proyección ni una estimación de voto: responde quien quiere y la muestra es muy pequeña y desigual.'], [''],
        ['Método'],
        ['1. Se cuentan como voto válido los partidos, «Otro partido» y «En blanco». «Nulo», «No votaré» y «Aún no lo sé» no cuentan.'],
        ['2. Ponderación A: cada comunidad pesa lo que pesó en el 23-J (votos a candidaturas); Melilla no tiene respuestas y no entra.'],
        ['3. Ponderación B: además, el recuerdo de voto del 23-J se ajusta a su resultado real (pesos entre 0,1 y 5 veces la media). Quienes no tenían edad en 2023 se fijan en el 3,9 % (supuesto).'],
        ['4. Cada partido se estima solo con quienes podían votarlo y solo se reparte en las provincias donde se presenta (candidaturas del BOE). No hay circunscripción única.'],
        ['5. Del % nacional de cada partido se pasa a escaños con el cambio proporcional sobre los resultados provinciales del 23-J (el método que usaba la web con el CIS), con barrera del 3 % y D\'Hondt.'],
        ['6. Frente Amplio, Podemos, Compromís y Adelante Andalucía siguen el patrón de Sumar del 23-J en sus provincias. SALF, Frente Obrero y Democracia 21 no se presentaron en 2023: mismo nivel en todas las provincias donde se presentan. «Otros partidos» y «En blanco» se reparten por igual.'],
        ['7. Con menos de 10 respuestas válidas en el territorio de una candidatura (EAJ-PNV, EH Bildu, UPN-PP, Geroa Bai, Teruel Existe, Soria Ya) no se inventa nada: se mantiene su nivel del 23-J.'],
        [''], ['Avisos'],
        ['· Las respuestas se concentran: Madrid, Barcelona, A Coruña y Pontevedra suman el 45 % de las respuestas; solo 5 provincias tienen más de 10 y 7 no tienen ninguna. El BNG, con 19 respuestas de 50 en Galicia, sale con muchos más escaños que en 2023.'],
        ['· Los rangos de simulación solo recogen el error de muestreo, no el sesgo de quien responde, que es mayor. En las candidaturas que se mantienen en el nivel del 23-J no hay rango: son un supuesto, no un dato de la encuesta.'],
        ['· SALF, Democracia 21 y Frente Obrero no llegan al 3 % en ninguna provincia con este reparto plano, así que no obtienen escaños.'],
        ['· Hay 9 respuestas en la pestaña «Revisar» (Adelante Andalucía, Se Acabó La Fiesta y Frente Obrero) que la hoja no contó. Aquí sí se han contado porque son opciones válidas en su provincia.'],
        ['· Hay 9 filas idénticas (misma hora, provincia, voto y recuerdo), la mayoría de A Coruña el primer día. Se han mantenido; quitarlas cambia pocos escaños (véase la consola del script).'],
        ['· El reparto del CIS «con el mismo método» sirve de referencia: no es el reparto de la web, que sale de las horquillas que publica el CIS.'],
    ]
    for n in notas: ws4.append(n)
    ws4.column_dimensions['A'].width = 150
    for row in ws4.iter_rows():
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        if row[0].value in ('Qué es esto', 'Método', 'Avisos'): row[0].font = Font(bold=True, size=12)
    wb.save(salida)


if __name__ == '__main__':
    R = main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    if len(sys.argv) > 2: excel(R, sys.argv[2]); print('escrito', sys.argv[2])
