"""Add to each row of data/municipios.json the seats and list type of its latest municipal election:
[ine, nombre, prov, ultima, poblacion] -> [ine, nombre, prov, ultima, poblacion, concejales, tipo].

The portada's search shows «mayoría N de M» for every ayuntamiento without loading the 52 province files.
build_site_data.py writes the same two fields; this script patches an existing build in place. Idempotent.
"""
import json
D = '/home/claude/site/data'
M = json.load(open(f'{D}/municipios.json', encoding='utf-8'))
prov = {}
n = 0
for r in M['municipios']:
    ine, p, year = r[0], r[2], str(r[3])
    if p not in prov:
        prov[p] = json.load(open(f'{D}/mun/{p}.json', encoding='utf-8'))
    rec = prov[p]['m'][ine]['e'][year]
    del r[5:]
    r.extend([rec[1], rec[0]])
    n += 1
M['campos'] = ['ine', 'nombre', 'prov', 'ultima', 'poblacion', 'concejales', 'tipo']
json.dump(M, open(f'{D}/municipios.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('municipios', n)
