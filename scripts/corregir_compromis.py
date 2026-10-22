"""Reclassify the lists that partidos.familia() used to put in the Compromís family by mistake.

The old rule matched any name containing «COMPROMIS», so «Compromiso por Galicia», «Compromisu por Asturies»,
«Compromiso con Aragón» or «Sa Unió de Formentera (PP-Compromís)» were drawn as Valencian Compromís. partidos.py is
fixed; this script applies the fixed rule to the data already built (site/data), without rebuilding everything:
only rows of the Compromís family change, and they get the colour a local list would get. It can be run again safely.

Usage: python3 scripts/corregir_compromis.py [site/data]
"""
import sys, os, json, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import partidos as P

D = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site/data'
ISLA_PROV = {'gran-canaria': '35', 'lanzarote': '35', 'fuerteventura': '35', 'tenerife': '38', 'la-palma': '38', 'la-gomera': '38', 'el-hierro': '38',
             'mallorca': '07', 'menorca': '07', 'eivissa': '07', 'formentera': '07', 'araba': '01', 'bizkaia': '48', 'gipuzkoa': '20'}
cambios = []


def corregir(fila, prov, donde):
    """fila: [sig, nombre, color, familia, …] (changed in place)"""
    if fila[3] != 'compromis':
        return False
    f = P.familia(fila[0], fila[1] or '', prov)
    if f == 'compromis':
        return False
    fila[3], fila[2] = f, P.color(f, fila[0] + '|' + (fila[1] or ''))
    cambios.append((donde, fila[0], fila[1], f))
    return True


def guardar(path, obj):
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(obj, fh, ensure_ascii=False, separators=(',', ':'))


for path in sorted(glob.glob(os.path.join(D, 'mun', '*.json'))):
    prov = os.path.basename(path)[:2]
    M = json.load(open(path, encoding='utf-8'))
    if sum(corregir(c, prov, f'mun/{prov}') for c in M['c']):
        guardar(path, M)

L = json.load(open(os.path.join(D, 'locales.json'), encoding='utf-8'))
n = 0
for grupo, xs in L.items():
    for k, x in xs.items():
        prov = k if grupo == 'diputaciones' else ISLA_PROV.get(k)
        for y, e in x['e'].items():
            n += sum(corregir(r, prov, f'{grupo}/{k}/{y}') for r in e['r'])
if n:
    guardar(os.path.join(D, 'locales.json'), L)

G = json.load(open(os.path.join(D, 'generales.json'), encoding='utf-8'))
n = 0
for k, e in G['congreso'].items():
    n += sum(corregir(r, None, f'congreso/{k}') for r in e.get('r', []))
    for pk, pv in (e.get('provincias') or {}).items():
        n += sum(corregir(r, pk, f'congreso/{k}/{pk}') for r in pv['r'])
if n:
    guardar(os.path.join(D, 'generales.json'), G)

for donde, sig, nom, f in cambios:
    print(f'{donde:24} {sig[:30]:30} {(nom or "")[:60]:60} → {f}')
print(len(cambios), 'filas corregidas')
