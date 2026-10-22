import csv, sys, collections, glob
rows=[]
for f in sorted(glob.glob(sys.argv[1]+'/*.csv')):
    for r in csv.DictReader(open(f,encoding='utf-8')):
        rows.append(r)
tot=collections.Counter(); seen=collections.Counter()
for r in rows:
    tot[(r['region'],r['date'])]+=int(r['seats']); seen[(r['region'],r['date'],r['party'])]+=1
dups=[k for k,v in seen.items() if v>1]
print('rows',len(rows),'elections',len(tot),'dups',dups[:10])
def expected(reg,y):
    y=int(y)
    E={'Andalusia':109,'Asturias':45,'Catalonia':135,'Extremadura':65,'Navarre':50}
    if reg in E: return E[reg]
    if reg=='Aragon': return 66 if y==1983 else 67
    if reg=='Balearic Islands': return 54 if y==1983 else 59
    if reg=='Canary Islands': return 60 if y<2019 else 70
    if reg=='Cantabria': return 35 if (y==1983 or y>=2015) else 39
    if reg=='Castile and León': return {1983:84,1987:84,1991:84,1995:84,1999:83,2003:82,2007:83,2011:84,2015:84,2019:81,2022:81,2026:82}[y]
    if reg=='Castilla–La Mancha': return 44 if y==1983 else (49 if y==2011 else (33 if y>=2015 else 47))
    if reg=='Galicia': return 71 if y<1989 else 75
    if reg=='Madrid': return {1983:94,1987:96,1991:101,1995:103,1999:102,2003:111,2007:120,2011:129,2015:129,2019:132,2021:136,2023:135}[y]
    if reg=='Murcia': return 43 if y==1983 else 45
    if reg=='Basque Country': return 60 if y==1980 else 75
    if reg=='La Rioja': return 35 if y==1983 else 33
    if reg=='Valencian Community': return 89 if y<2007 else 99
bad=0
byreg=collections.defaultdict(list)
for (reg,d),s in sorted(tot.items()):
    e=expected(reg,d[:4]); byreg[reg].append(d[:4])
    if e!=s: print('MISMATCH',reg,d,s,'expected',e); bad+=1
print('mismatches',bad)
for reg in sorted(byreg): print(reg, len(byreg[reg]), ' '.join(sorted(byreg[reg])))
