"""Build normalized municipal results 1979-2019 from official Interior files."""
import sys, os, json, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ie

BASE = sys.argv[1]          # .../files/municipales
OUT = sys.argv[2]           # output dir
os.makedirs(OUT, exist_ok=True)

summary = {}
for folder in sorted(os.listdir(BASE)):
    if not (folder.endswith('_MUNI') and folder.startswith('04')):
        continue
    fp = os.path.join(BASE, folder)
    yyyymm = folder[2:8]
    cands = ie.candidaturas(ie.find(fp, '03', '04'))
    mun = ie.datos_municipios(ie.find(fp, '05', '04'))
    cm = ie.cand_municipios(ie.find(fp, '06', '04'))
    men = ie.datos_menores(ie.find(fp, '11')) if ie.find(fp, '11') else {}
    cmen = ie.cand_menores(ie.find(fp, '12')) if ie.find(fp, '12') else {}
    dsup = ie.datos_superior(ie.find(fp, '07', '10')) if ie.find(fp, '07', '10') else {}
    csup = ie.cand_superior(ie.find(fp, '08', '10')) if ie.find(fp, '08', '10') else {}

    munis = {}
    bad_sum = []
    for k, m in mun.items():
        rows = [(c, v, s) for (c, v, s) in cm.get(k, [])]
        seats = sum(s for _, _, s in rows)
        if m['escanos'] and seats != m['escanos']:
            bad_sum.append((k, m['nombre'], m['escanos'], seats))
        m2 = dict(m); m2['tipo'] = 'G'
        m2['res'] = sorted(rows, key=lambda r: (-r[2], -r[1]))
        munis[k] = m2
    bad_small = []
    for k, m in men.items():
        cc = cmen.get(k, {})
        rows = []
        for c, d in cc.items():
            seats = d['electos'] if d['electos'] else d['obtenidos']
            rows.append((c, d['votos'], seats))
        seats = sum(r[2] for r in rows)
        if m['escanos'] and seats != m['escanos']:
            bad_small.append((k, m['nombre'], m['escanos'], seats))
        m2 = dict(m); m2['tipo'] = 'A' if m['tipo'] == '08' else 'C'
        m2['res'] = sorted(rows, key=lambda r: (-r[2], -r[1]))
        if k in munis:
            print('DUP', yyyymm, k)
        munis[k] = m2
    # diputaciones
    dips = {}
    for key, d in dsup.items():
        rows = csup.get(key, [])
        dips['%s-%s-%s' % key] = {'info': d, 'res': sorted(rows, key=lambda r: (-r[2], -r[1]))}

    total_seats = sum(sum(r[2] for r in m['res']) for m in munis.values())
    summary[yyyymm] = {
        'municipios': len(munis), 'grandes': len(mun), 'menores': len(men),
        'concejales': total_seats, 'candidaturas': len(cands),
        'descuadres_grandes': len(bad_sum), 'descuadres_menores': len(bad_small),
        'diputaciones': len(dsup), 'diputados_prov': sum(sum(r[2] for r in v['res']) for v in dips.values()),
    }
    if bad_sum[:3] or bad_small[:3]:
        print(yyyymm, 'ejemplos descuadre', bad_sum[:3], bad_small[:3])
    with open(os.path.join(OUT, f'mun_{yyyymm}.json'), 'w', encoding='utf-8') as fh:
        json.dump({'candidaturas': cands, 'municipios': munis, 'diputaciones': dips}, fh, ensure_ascii=False)

for k, v in summary.items():
    print(k, v)
prev = {}
sp = os.path.join(OUT, 'summary_municipales.json')
if os.path.exists(sp): prev = json.load(open(sp))
prev.update(summary)
json.dump(prev, open(sp, 'w'), indent=1)
