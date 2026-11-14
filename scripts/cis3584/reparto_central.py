"""Reparto central de las horquillas de escaños del CIS (estudio 3584) para el simulador.

El CIS publica, para cada provincia y candidatura, una horquilla de escaños (percentiles 5-95 de sus simulaciones), no un
reparto concreto. El simulador necesita escaños enteros que sumen los de cada provincia. Se elige, entre todos los repartos
posibles, el que cumple a la vez:
  1. cada candidatura queda dentro de su horquilla en cada provincia,
  2. los escaños de cada provincia suman los del Real Decreto 806/2026,
  3. cada candidatura queda dentro de su horquilla nacional del CIS,
y de entre ellos el que menos se aleja del centro de las horquillas, provinciales y nacionales (suma de cuadrados de las
distancias; los centros nacionales suman justo 350).
Es un problema de flujo con costes crecientes (convexo): se resuelve exactamente con programación lineal entera.
Uso: python3 scripts/cis3584/reparto_central.py  → escribe scripts/cis3584/reparto_central.json
"""
import json, os
import numpy as np
from scipy.optimize import linprog

AQUI = os.path.dirname(os.path.abspath(__file__))
H = json.load(open(os.path.join(AQUI, 'horquillas_provincias.json'), encoding='utf-8'))
ESC = {"02":4,"03":12,"04":6,"01":4,"33":7,"05":3,"06":5,"07":8,"08":32,"48":8,"09":4,"10":4,"11":8,"39":5,"12":5,"13":5,"14":6,"15":8,"16":3,"20":6,"17":6,"18":7,"19":3,"21":5,"22":3,"23":5,"24":4,"25":4,"27":4,"28":38,"29":11,"30":10,"31":5,"32":4,"34":3,"35":8,"36":7,"26":4,"37":4,"38":7,"40":3,"41":12,"42":2,"43":6,"44":3,"45":6,"46":16,"47":5,"49":3,"50":7,"51":1,"52":1}
EST = {'psoe': 33.3, 'pp': 25.5, 'vox': 18.4, 'fa': 4.7, 'erc': 3.1, 'bildu': 1.8, 'compromis': 1.6, 'aa': 1.5, 'junts': 1.2,
       'podemos': 1.1, 'bng': 1.0, 'pnv': 0.7, 'upc': 0.4, 'ames': 0.2}          # estimación de voto del CIS (desempate: gana la más votada)
COLS = H['columnas']
assert sum(ESC.values()) == 350

# una variable por «escaño posible» (provincia, candidatura, n.º de escaño); los de por debajo del mínimo van fijos a 1
var = []                                   # (provincia, candidatura, j, coste)
for k, p in H['provincias'].items():
    for c in COLS:
        lo, hi = p['h'][c]; mid = (lo + hi) / 2
        for j in range(1, hi + 1):
            var.append((k, c, j, 2 * (j - mid) - 1 - 1e-4 * EST[c]))    # coste marginal del escaño j (crece con j)
n = len(var)
# y una por cada escaño nacional por encima del mínimo del CIS: su coste crece al alejarse del centro de la horquilla nacional,
# así que el reparto no favorece a nadie dentro de su horquilla (los centros nacionales suman justo 350)
nac = []                                   # (candidatura, m, coste)
for c in COLS:
    L, U = H['total'][c]; mid = (L + U) / 2
    for m in range(1, U - L + 1):
        nac.append((c, m, 2 * (L + m - mid) - 1))
assert abs(sum(sum(H['total'][c]) / 2 for c in COLS) - 350) < 1e-9
N = n + len(nac)
cost = np.array([v[3] for v in var] + [v[2] for v in nac])
bounds = [(1, 1) if j <= H['provincias'][k]['h'][c][0] else (0, 1) for k, c, j, _ in var] + [(0, 1)] * len(nac)
Aeq, beq = [], []
for k, s_ in ESC.items():
    Aeq.append([1.0 if v[0] == k else 0.0 for v in var] + [0.0] * len(nac)); beq.append(s_)
for c in COLS:                             # total nacional de la candidatura = mínimo del CIS + escaños nacionales «extra»
    Aeq.append([1.0 if v[1] == c else 0.0 for v in var] + [-1.0 if v[0] == c else 0.0 for v in nac]); beq.append(H['total'][c][0])
res = linprog(cost, A_eq=np.array(Aeq), b_eq=beq, bounds=bounds, integrality=np.ones(N), method='highs')
assert res.status == 0, res.message
x = np.round(res.x[:n]).astype(int)
prov = {}
for (k, c, j, _), u in zip(var, x):
    if u:
        d = prov.setdefault(k, {'n': H['provincias'][k]['n'], 'escanos': ESC[k], 'r': {}, 'h': {}})
        d['r'][c] = d['r'].get(c, 0) + 1
for k, d in prov.items():
    d['h'] = {c: H['provincias'][k]['h'][c] for c in COLS if H['provincias'][k]['h'][c][1] > 0}
    assert sum(d['r'].values()) == d['escanos']
    for c, v in d['r'].items(): assert H['provincias'][k]['h'][c][0] <= v <= H['provincias'][k]['h'][c][1]
nac = {c: sum(d['r'].get(c, 0) for d in prov.values()) for c in COLS}
for c in COLS: assert H['total'][c][0] <= nac[c] <= H['total'][c][1], (c, nac[c])
assert sum(nac.values()) == 350
json.dump({'provincias': prov, 'nacional': nac}, open(os.path.join(AQUI, 'reparto_central.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('escaños de partida', nac, '| horquilla CIS', {c: H['total'][c] for c in COLS})
