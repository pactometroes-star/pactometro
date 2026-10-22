"""Add vote-count totals (censo, votantes, blancos, nulos) where they can be derived from official files.

- Diputaciones provinciales: sum of the official municipal results of every municipality in the province
  for that election (the same base the parties' votes already use).
- Ceuta and Melilla (asambleas): the single municipality's official municipal record.
Idempotent: recomputes the fields each time.
"""
import json, os
D = '/home/claude/site/data'
L = json.load(open(f'{D}/locales.json', encoding='utf-8'))
A = json.load(open(f'{D}/autonomicas.json', encoding='utf-8'))
mun = {}
def prov(p):
    if p not in mun:
        mun[p] = json.load(open(f'{D}/mun/{p}.json', encoding='utf-8'))
    return mun[p]

def totals(p, year):
    P = prov(p)
    t = {'censo': 0, 'votantes': 0, 'blancos': 0, 'nulos': 0, 'votos_cand': 0, 'municipios': 0}
    for m in P['m'].values():
        e = m['e'].get(year)
        if not e:
            continue
        tipo, esc, censo, vot, bl, nul, res = e
        t['censo'] += censo or 0; t['votantes'] += vot or 0; t['blancos'] += bl or 0; t['nulos'] += nul or 0
        t['votos_cand'] += sum(v or 0 for _, v, _ in res); t['municipios'] += 1
    return t

n = 0
for pid, d in L['diputaciones'].items():
    for y, e in d['e'].items():
        t = totals(pid, y)
        if not t['municipios'] or not t['votantes']:
            continue
        listed = sum(r[4] or 0 for r in e['r'])
        e.update({'censo': t['censo'], 'votantes': t['votantes'], 'blancos': t['blancos'], 'nulos': t['nulos'],
                  'votos_cand': max(t['votos_cand'], listed), 'recuento': 'suma-municipal'})
        n += 1
print('diputaciones enriched', n)

for aid, ine in (('ceuta', '51001'), ('melilla', '52001')):
    P = prov(ine[:2]); m = P['m'][ine]
    for e in A[aid]['elecciones']:
        rec = m['e'].get(e['fecha'][:4])
        if not rec:
            print('missing', aid, e['fecha']); continue
        tipo, esc, censo, vot, bl, nul, res = rec
        e.update({'censo': censo, 'votantes': vot, 'blancos': bl, 'nulos': nul, 'votos_cand': sum(v for _, v, _ in res)})
print('ceuta/melilla done')

# cabildos: derive votantes when missing
for c in L['cabildos'].values():
    for e in c['e'].values():
        if 'votos_cand' in e and 'votantes' not in e and e.get('blancos') is not None and e.get('nulos') is not None:
            e['votantes'] = e['votos_cand'] + e['blancos'] + e['nulos']

json.dump(L, open(f'{D}/locales.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(A, open(f'{D}/autonomicas.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
