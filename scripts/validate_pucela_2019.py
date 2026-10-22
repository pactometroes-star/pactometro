"""Compare PucelaBits decoded elected flags (2019 municipal) with official 2019 files."""
import sys, os, json, csv, gzip, collections, unicodedata, re
off = json.load(open(sys.argv[1], encoding='utf-8'))
pucela = sys.argv[2]

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return ' '.join(s.split())

PROV = {}
# official province code -> name via pucela province names (built by matching municipality sets)
cands = off['candidaturas']
offseats = {}
for k, m in off['municipios'].items():
    if m['tipo'] != 'G':
        continue
    d = collections.Counter()
    for c, v, s in m['res']:
        if s:
            d[norm(cands[c]['siglas'])] += s
    offseats[k] = (m['nombre'], d)

ps = collections.defaultdict(collections.Counter)
with gzip.open(pucela, 'rt', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['election_type'] == 'municipales' and row['year'] == '2019' and row['elected'] == '1':
            ps[(row['province'], row['municipality'])][norm(row['acronym'])] += 1

# match by total seats + party distribution + name similarity
by_name = collections.defaultdict(list)
for k, (n, d) in offseats.items():
    by_name[norm(n)].append(k)

def name_variants(n):
    n0 = norm(n)
    out = {n0}
    # official 2019 names like "Poblets, els" -> "els Poblets"
    m = re.match(r'^(.*?) (el|la|los|las|els|les|l|o|a|os|as|lo|sa|ses|es|s)$', n0)
    if m:
        out.add(m.group(2) + ' ' + m.group(1))
    return out

matched = 0; equal = 0; diff = []; unmatched = []
for (prov, mname), d in ps.items():
    keys = []
    for v in name_variants(mname):
        keys += by_name.get(v, [])
    keys = list(dict.fromkeys(keys))
    cand_keys = [k for k in keys if sum(offseats[k][1].values()) == sum(d.values())]
    if len(cand_keys) != 1:
        unmatched.append((prov, mname, keys))
        continue
    matched += 1
    k = cand_keys[0]
    if offseats[k][1] == d:
        equal += 1
    else:
        diff.append((prov, mname, dict(offseats[k][1]), dict(d)))
print('pucela munis', len(ps), 'matched', matched, 'equal distributions', equal, 'diff', len(diff), 'unmatched', len(unmatched))
for x in diff[:15]: print('DIFF', x)
for x in unmatched[:15]: print('UNM', x)
print('official G munis', len(offseats), 'official G seats', sum(sum(d.values()) for _, d in offseats.values()), 'pucela seats', sum(sum(d.values()) for d in ps.values()))
