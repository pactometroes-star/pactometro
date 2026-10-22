"""Generic extraction of 07/08 (areas above municipality) for an election folder list.
Usage: build_superior.py OUT.json TYP folder1 [folder2 ...]
Stores, per election: candidaturas + every territorial row (ccaa, prov, dist) with info and results."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ie

out_path, typ, folders = sys.argv[1], sys.argv[2], sys.argv[3:]
res = {}
if os.path.exists(out_path):
    res = json.load(open(out_path, encoding='utf-8'))
for fp in folders:
    name = os.path.basename(fp.rstrip('/'))
    yyyymm = name[2:8]
    f3, f7, f8 = ie.find(fp, '03', typ), ie.find(fp, '07', typ), ie.find(fp, '08', typ)
    if not (f3 and f7 and f8):
        print('skip', fp); continue
    cands = ie.candidaturas(f3)
    d7 = ie.datos_superior(f7); d8 = ie.cand_superior(f8)
    areas = {}
    for key, info in d7.items():
        rows = sorted(d8.get(key, []), key=lambda r: (-r[2], -r[1]))
        areas['-'.join(key)] = {'info': info, 'res': rows}
    res[yyyymm] = {'candidaturas': cands, 'areas': areas}
    nat = areas.get('99-99-9')
    top = []
    if nat:
        top = [(cands.get(c, {}).get('siglas'), s) for c, v, s in nat['res'][:10]]
    print(yyyymm, 'areas', len(areas), 'national seats', nat and sum(r[2] for r in nat['res']), top)
json.dump(res, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False)
