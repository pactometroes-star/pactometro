import sys, csv, gzip, collections, json
path=sys.argv[1]; types=sys.argv[2].split(','); out=sys.argv[3]
res=collections.defaultdict(collections.Counter); names={}
with gzip.open(path,'rt',encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['election_type'] in types and row['elected']=='1':
            k=f"{row['election_type']}_{row['year']}{int(row['month']):02d}"
            key=row['acronym'] if row['election_type']!='senado' else row['acronym']+' | '+row['province']
            res[k][row['acronym']]+=1; names[row['acronym']]=row['name']
json.dump({k:dict(v.most_common()) for k,v in res.items()}, open(out,'w'), ensure_ascii=False, indent=0)
for k in sorted(res):
    print(k, sum(res[k].values()), res[k].most_common(14))
