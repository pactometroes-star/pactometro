"""National and provincial Congreso (and Senado) results from official TOTA files."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ie

BASE = sys.argv[1]   # .../files/congreso or senado
TYP = sys.argv[2]    # '02' or '03'
OUT = sys.argv[3]
res = {}
for folder in sorted(os.listdir(BASE)):
    if not folder.endswith('_TOTA'):
        continue
    fp = os.path.join(BASE, folder)
    yyyymm = folder[2:8]
    cands = ie.candidaturas(ie.find(fp, '03', TYP))
    d7 = ie.datos_superior(ie.find(fp, '07', TYP))
    d8 = ie.cand_superior(ie.find(fp, '08', TYP))
    nat = ('99', '99', '9')
    if nat not in d7:
        print(yyyymm, 'no national row; keys sample', list(d7)[:5])
    info = d7.get(nat)
    rows = d8.get(nat, [])
    tot_seats = sum(r[2] for r in rows)
    provs = {}
    for (ca, pr, di), v in d7.items():
        if pr != '99' and di == '9':
            provs[pr] = {'ccaa': ca, 'nombre': v['nombre'], 'escanos': v['escanos'], 'censo': v['censo'],
                         'blancos': v['blancos'], 'nulos': v['nulos'], 'votos_cand': v['votos_cand'],
                         'res': sorted(d8.get((ca, pr, di), []), key=lambda r: (-r[2], -r[1]))}
    res[yyyymm] = {
        'nacional': info,
        'res': sorted([(c, cands.get(c, {}).get('siglas', '?'), cands.get(c, {}).get('nombre', '?'), v, s) for c, v, s in rows], key=lambda r: (-r[4], -r[3])),
        'provincias': provs,
        'candidaturas': cands,
    }
    print(yyyymm, 'seats', tot_seats, 'censo', info and info['censo'], 'votos cand', info and info['votos_cand'],
          '| top:', [(r[1], r[4]) for r in res[yyyymm]['res'][:8]])
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
