import sys, csv, gzip, collections
path=sys.argv[1]; target=sys.argv[2].lower()
seats=collections.Counter(); provs=set(); names=set()
with gzip.open(path,'rt',encoding='utf-8') as f:
    for row in csv.DictReader(f):
        if row['election_type']=='municipales' and row['year']=='2023':
            provs.add(row['province'])
            if target in row['municipality'].lower():
                names.add((row['province'],row['municipality']))
                if row['elected']=='1': seats[(row['municipality'],row['acronym'])]+=1
print(sorted(provs)[:60]); print(len(provs))
print(names); print(seats.most_common())
