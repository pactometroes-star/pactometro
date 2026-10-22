import sys, csv, gzip, collections
path = sys.argv[1]
cnt = collections.Counter(); el = collections.Counter(); munis = collections.defaultdict(set)
emptyprov = collections.Counter()
with gzip.open(path, 'rt', encoding='utf-8') as f:
    r = csv.DictReader(f)
    for row in r:
        k = (row['election_type'], row['year'], row['month'])
        cnt[k] += 1
        if row['elected'] == '1':
            el[k] += 1
        if row['municipality']:
            munis[k].add((row['province'], row['municipality']))
        if not row['province']:
            emptyprov[k] += 1
for k in sorted(cnt):
    print(k, 'rows', cnt[k], 'elected', el[k], 'munis', len(munis[k]), 'noprov', emptyprov[k])
