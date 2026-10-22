"""Seat projection for the 29-N simulator from the CIS vote estimate (Estudio 3582, Barómetro de octubre 2026).

The CIS publishes vote shares only (% of valid votes), not seats. pactómetro.es turns them into seats like this:
  1. Base: official 23-J 2023 results of every province (data/generales.json).
  2. Proportional swing: each party's 2023 provincial share is multiplied by (CIS national share / 2023 national share).
     SUMAR/Frente Amplio and Podemos (one coalition in 2023) both follow the 2023 Sumar pattern.
     Se Acabó la Fiesta did not stand in 2023: the same share in every province.
     "Otros partidos" and "En blanco" are spread evenly and count only for the 3 % threshold.
  3. Each province is rescaled to 100 % of valid votes.
  4. Seats per province from Real Decreto 806/2026; 3 % threshold and D'Hondt (art. 163 LOREG).
Output: data/cis.json (estimate table, ficha técnica, national and provincial projection).
"""
import json, os
D = '/home/claude/site/data'
G = json.load(open(f'{D}/generales.json', encoding='utf-8'))
P = G['congreso']['2023']['provincias']

ESC_2026 = {"02":4,"03":12,"04":6,"01":4,"33":7,"05":3,"06":5,"07":8,"08":32,"48":8,"09":4,"10":4,"11":8,"39":5,"12":5,"13":5,"14":6,"15":8,"16":3,"20":6,"17":6,"18":7,"19":3,"21":5,"22":3,"23":5,"24":4,"25":4,"27":4,"28":38,"29":11,"30":10,"31":5,"32":4,"34":3,"35":8,"36":7,"26":4,"37":4,"38":7,"40":3,"41":12,"42":2,"43":6,"44":3,"45":6,"46":16,"47":5,"49":3,"50":7,"51":1,"52":1}

# CIS, Estudio 3582, «Estimación de voto» (labels exactly as the CIS writes them):
# [key, label, name, colour, family, voto directo (% sobre censo), margen teórico de error (±, IC 95 %), estimación (% sobre voto válido)]
CIS = [
    ['psoe', 'PSOE', 'Partido Socialista Obrero Español', '#e1001a', 'psoe', 25.3, 1.2, 34.0],
    ['pp', 'PP', 'Partido Popular', '#1d84ce', 'pp', 14.7, 1.2, 22.2],
    ['vox', 'VOX', 'Vox', '#6cc24a', 'vox', 11.6, 0.9, 17.1],
    ['fa', 'SUMAR / Frente Amplio', 'Partidos firmantes de la coalición Sumar, excepto Podemos', '#e5007e', 'sumar', 4.5, 0.6, 6.1],
    ['podemos', 'Podemos', 'Podemos', '#6a2c70', 'podemos', 2.2, 0.4, 3.1],
    ['erc', 'ERC', 'Esquerra Republicana de Catalunya', '#ffb000', 'erc', 1.8, 0.4, 3.0],
    ['salf', 'Se Acabó la Fiesta', 'Se Acabó la Fiesta (SALF)', '#5b4b8a', 'local', 1.1, 0.3, 1.8],
    ['bildu', 'EH Bildu', 'Euskal Herria Bildu', '#00897b', 'bildu', 0.9, 0.3, 1.6],
    ['junts', 'Junts', 'Junts per Catalunya', '#3fc1b0', 'junts', 0.8, 0.2, 1.1],
    ['bng', 'BNG', 'Bloque Nacionalista Galego', '#7fc6e8', 'bng', 0.7, 0.2, 0.9],
    ['pnv', 'EAJ-PNV', 'Euzko Alderdi Jeltzalea - Partido Nacionalista Vasco', '#1d6b39', 'pnv', 0.4, 0.2, 0.6],
    ['cc', 'CCa', 'Coalición Canaria', '#ffd200', 'cc', 0.1, 0.1, 0.2],
    ['upn', 'UPN', 'Unión del Pueblo Navarro', '#11246b', 'upn', 0.04, 0.05, 0.1],
]
OTROS, BLANCO = 7.9, 0.3
RESTO = [['Otros partidos', 5.7, 0.6, 7.9], ['En blanco', 3.2, 0.5, 0.3], ['Voto nulo', 1.9, 0.4, None],
         ['Abstención («No votaría»)', 5.1, 0.6, None], ['No sabe', 17.3, 1.0, None], ['No contesta', 2.6, 0.4, None]]

# 2023 pattern per CIS party (families in the 2023 data); Sumar 2023 = families sumar + podemos (one coalition)
BASE = {'psoe': ['psoe'], 'pp': ['pp'], 'vox': ['vox'], 'fa': ['sumar', 'podemos'], 'podemos': ['sumar', 'podemos'],
        'erc': ['erc'], 'bildu': ['bildu'], 'junts': ['junts'], 'bng': ['bng'], 'pnv': ['pnv'], 'cc': ['cc'], 'upn': ['upn']}
tot23 = {k: 0 for k in BASE}; total23 = 0
prov_share = {}
for pk, pv in P.items():
    vt = sum(r[4] or 0 for r in pv['r']); total23 += vt
    sh = {}
    for k, fams in BASE.items():
        v = sum(r[4] or 0 for r in pv['r'] if r[3] in fams)
        sh[k] = v / vt if vt else 0
        tot23[k] += v
    prov_share[pk] = sh
nat23 = {k: tot23[k] / total23 for k in BASE}

def dhondt(shares, seats):
    ok = {k: s for k, s in shares.items() if s >= 3.0}
    q = sorted(((s / d, s, k) for k, s in ok.items() for d in range(1, seats + 1)), reverse=True)[:seats]
    out = {}
    for _, _, k in q: out[k] = out.get(k, 0) + 1
    return out

est = {c[0]: c[7] for c in CIS}
nat_seats = {}; provincias = {}; votos_nac = {k: 0.0 for k in est}; peso_total = 0
for pk, seats in ESC_2026.items():
    sh = {}
    for k in BASE:
        sh[k] = 100 * prov_share[pk][k] * (est[k] / 100) / nat23[k] if nat23[k] else 0
    sh['salf'] = est['salf']
    resto = OTROS + BLANCO
    escala = (100 - resto) / sum(sh.values())          # every province adds up to 100 % of valid votes
    sh = {k: v * escala for k, v in sh.items()}
    r = dhondt(sh, seats)
    provincias[pk] = {'n': P[pk]['n'], 'escanos': seats, 'pct': {k: round(v, 2) for k, v in sh.items() if v >= 0.05}, 'r': r}
    for k, n in r.items(): nat_seats[k] = nat_seats.get(k, 0) + n
    w = sum(rr[4] or 0 for rr in P[pk]['r'])           # weight provinces by their 2023 turnout to check national shares
    for k, v in sh.items(): votos_nac[k] += v * w
    peso_total += w
check = {k: round(v / peso_total, 2) for k, v in votos_nac.items()}
assert sum(nat_seats.values()) == 350, nat_seats
out = {
    'estudio': {'numero': 3582, 'titulo': 'Barómetro de octubre 2026', 'organismo': 'Centro de Investigaciones Sociológicas (CIS)',
                'publicado': '2026-10-14', 'campo': ['2026-10-01', '2026-10-06'],
                'url': 'https://www.cis.es/gl/w/avance-de-resultados-del-estudio-3582-bar%C3%B3metro-de-octubre-2026-',
                'estimacion_pdf': 'https://www.cis.es/documents/d/guest/3582_estimacion-pdf',
                'frecuencias_pdf': 'https://www.cis.es/documents/d/guest/es3582mar_A-pdf',
                'excel': 'https://www.cis.es/documents/d/guest/3582-multi_a-xlsx'},
    'ficha': {'ambito': 'Nacional', 'universo': 'Población española de ambos sexos de 18 años y más',
              'muestra': 'Diseñada: 5.000 entrevistas. Realizada: 5.025 entrevistas',
              'afijacion': 'No proporcional: reparto proporcional por comunidad autónoma con un mínimo de 125 entrevistas en cada una; 20 en Ceuta y 20 en Melilla',
              'ponderacion': 'Coeficientes de ponderación para la muestra total (y una variable específica para estimaciones por comunidad autónoma)',
              'puntos': '1.370 municipios y 50 provincias',
              'procedimiento': 'Selección aleatoria de números de teléfono (14,3 % fijos y 85,7 % móviles) y de las personas por cuotas de sexo y edad',
              'modo': 'Entrevista telefónica asistida por ordenador (CATI)',
              'error': '±1,4 % para el conjunto de la muestra, con un nivel de confianza del 95,5 % (dos sigmas) y P = Q, en el supuesto de muestreo aleatorio simple',
              'fechas': 'Del 1 al 6 de octubre de 2026',
              'pregunta': '«Y en unas próximas elecciones al Parlamento español, ¿a qué partido votaría Ud.?» (P17R, respuesta espontánea)'},
    'metodo_cis': 'Estimación por escenarios con el «modelo bidimensional inercia-incertidumbre Alaminos-Tezanos», de temporalidad «sincrónica estructural». Según el CIS, no tiene intención prospectiva: se refiere al periodo en que se recogieron los datos.',
    'columnas': ['Voto directo en la encuesta (en % sobre censo)', 'Margen teórico de error (intervalo de confianza del 95 %)', 'Estimación de voto CIS (en % sobre el voto válido)'],
    'notas_cis': ['El voto estimado de SUMAR agrupa a los partidos que firmaron la coalición excepto Podemos.',
                  'Dada la volatilidad de las estimaciones de UPN, partido de implantación uniprovincial, el CIS le imputa el valor medio de referencia de 0,1.',
                  'Por el redondeo al segundo decimal, la suma puede no ser exactamente 100.'],
    'partidos': [{'k': c[0], 'sig': c[1], 'nom': c[2], 'color': c[3], 'fam': c[4], 'directo': c[5], 'margen': c[6], 'est': c[7], 'esc': nat_seats.get(c[0], 0)} for c in CIS],
    'resto': [{'n': r[0], 'directo': r[1], 'margen': r[2], 'est': r[3]} for r in RESTO],
    'n': 5025,
    'proyeccion': {'metodo': 'pactómetro.es', 'provincias': provincias, 'control_pct_nacional': check},
}
json.dump(out, open(f'{D}/cis.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('escaños', {c[0]: nat_seats.get(c[0], 0) for c in CIS}, sum(nat_seats.values()))
print('control % nacional', check)
