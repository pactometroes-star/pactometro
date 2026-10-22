"""Build all JSON data for pactómetro.es from the official files and the compiled tables."""
import sys, os, json, csv, glob, collections, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ie
import partidos as P

WORK = '/home/claude/work'
OBR = '/home/claude/raw/obregon/files'
OF23 = '/home/claude/raw/oficial2023'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site/data'
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, 'mun'), exist_ok=True)

def dump(name, obj):
    p = os.path.join(OUT, name)
    with open(p, 'w', encoding='utf-8') as fh:
        json.dump(obj, fh, ensure_ascii=False, separators=(',', ':'))
    return os.path.getsize(p)

def fam_color(siglas, nombre, prov=None):
    f = P.familia(siglas, nombre, prov)
    return f, P.color(f, siglas + '|' + nombre)

def nice_name(n):
    """Official names come as 'Poblets, els' or 'BAGUENA'. Return a readable form."""
    n = (n or '').strip()
    if n.isupper() and len(n) > 3:
        n = n.title()
    m = re.match(r'^(.*), (el|la|los|las|els|les|l\'|o|a|os|as|lo|sa|ses|es|s\'|El|La|Los|Las|Els|Les|L\'|O|A|Os|As|Lo|Sa|Ses|Es)$', n)
    if m:
        art = m.group(2)
        art = art[0].upper() + art[1:]
        n = (art + m.group(1)) if art.endswith("'") else (art + ' ' + m.group(1))
    return n

# ---------------------------------------------------------------- municipal
MUN_FECHAS = {'197904': '1979-04-03', '198305': '1983-05-08', '198706': '1987-06-10', '199105': '1991-05-26',
              '199505': '1995-05-28', '199906': '1999-06-13', '200305': '2003-05-25', '200705': '2007-05-27',
              '201105': '2011-05-22', '201505': '2015-05-24', '201905': '2019-05-26', '202305': '2023-05-28'}
mun = {}
for ym in MUN_FECHAS:
    mun[ym] = json.load(open(os.path.join(WORK, 'oficial', f'mun_{ym}.json'), encoding='utf-8'))
    print('loaded municipales', ym, len(mun[ym]['municipios']))

# provinces & CCAA from 2023 municipal superior file + municipality ccaa codes
CCAA = {'01': 'Andalucía', '02': 'Aragón', '03': 'Asturias', '04': 'Illes Balears', '05': 'Canarias', '06': 'Cantabria',
        '07': 'Castilla-La Mancha', '08': 'Castilla y León', '09': 'Cataluña', '10': 'Extremadura', '11': 'Galicia',
        '12': 'Comunidad de Madrid', '13': 'Navarra', '14': 'País Vasco', '15': 'Región de Murcia', '16': 'La Rioja',
        '17': 'Comunitat Valenciana', '18': 'Ceuta', '19': 'Melilla'}
PROV_NAMES = {'01': 'Araba/Álava', '02': 'Albacete', '03': 'Alicante/Alacant', '04': 'Almería', '05': 'Ávila', '06': 'Badajoz',
              '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón/Castelló',
              '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca', '17': 'Girona', '18': 'Granada',
              '19': 'Guadalajara', '20': 'Gipuzkoa', '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
              '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
              '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra', '37': 'Salamanca',
              '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia', '41': 'Sevilla', '42': 'Soria',
              '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo', '46': 'Valencia/València', '47': 'Valladolid',
              '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'}
prov_ccaa = {}
for ym in sorted(MUN_FECHAS):
    for k, m in mun[ym]['municipios'].items():
        if m['prov'].strip().isdigit():
            prov_ccaa[m['prov']] = m['ccaa']

# per-province municipal files
provfiles = {p: {'p': p, 'n': PROV_NAMES[p], 'ca': prov_ccaa.get(p), 'c': [], 'm': {}} for p in PROV_NAMES}
cand_idx = {p: {} for p in PROV_NAMES}
latest = {}   # ine -> (ym, name, pob)
TIPO = {'G': 'G', 'A': 'A', 'C': 'C'}
national_mun = {}
for ym in sorted(MUN_FECHAS):
    year = ym[:4]
    cands = mun[ym]['candidaturas']
    fam_tot = collections.defaultdict(lambda: [0, 0])  # fam -> [concejales, votos]
    tot_conc = 0
    for k, m in mun[ym]['municipios'].items():
        p = m['prov']
        if p not in provfiles or not m['mun'].strip().isdigit():
            continue
        pf = provfiles[p]
        rows = []
        for code, v, s in m['res']:
            if v <= 0 and s <= 0:
                continue
            cd = cands.get(code, {'siglas': '?', 'nombre': ''})
            sig = P.clean_siglas(cd['siglas']) or '?'
            nom = cd['nombre'].strip()
            key = (sig, nom)
            idx = cand_idx[p].get(key)
            if idx is None:
                f, col = fam_color(sig, nom, p)
                idx = len(pf['c'])
                pf['c'].append([sig, nom, col, f])
                cand_idx[p][key] = idx
            rows.append([idx, v, s])
            f = pf['c'][idx][3]
            fam_tot[f][0] += s
            fam_tot[f][1] += v
            tot_conc += s
        votantes = m['blancos'] + m['nulos'] + m['votos_cand']
        rec = [m['tipo'], m['escanos'], m['censo'], votantes, m['blancos'], m['nulos'], rows]
        ent = pf['m'].setdefault(k, {'n': None, 'e': {}})
        ent['e'][year] = rec
        nm = nice_name(m['nombre'])
        if k not in latest or latest[k][0] <= ym:
            latest[k] = (ym, nm, m['poblacion'])
    national_mun[year] = {'fecha': MUN_FECHAS[ym], 'concejales': tot_conc, 'municipios': len(mun[ym]['municipios']),
                          'familias': {f: v for f, v in sorted(fam_tot.items(), key=lambda kv: -kv[1][0])}}
    print('municipales', ym, 'concejales', tot_conc)

index = []
for p, pf in provfiles.items():
    for k, ent in pf['m'].items():
        ent['n'] = latest[k][1]
    # [ine, nombre, provincia, año de la última elección, población, concejales en esa elección, tipo G/A/C]
    index.extend([[k, latest[k][1], p, int(latest[k][0][:4]), latest[k][2],
                   pf['m'][k]['e'][latest[k][0][:4]][1], pf['m'][k]['e'][latest[k][0][:4]][0]] for k in pf['m']])
index.sort(key=lambda r: (P.norm(r[1]), r[0]))
sizes = 0
for p, pf in provfiles.items():
    sizes += dump(f'mun/{p}.json', pf)
print('municipal province files total bytes', sizes, 'municipios', len(index))
CAPITALES = ['01059', '02003', '03014', '04013', '05019', '06015', '07040', '08019', '09059', '10037', '11012', '12040', '13034',
             '14021', '15030', '16078', '17079', '18087', '19130', '20069', '21041', '22125', '23050', '24089', '25120', '26089',
             '27028', '28079', '29067', '30030', '31201', '32054', '33044', '34120', '35016', '36038', '37274', '38038', '39075',
             '40194', '41091', '42173', '43148', '44216', '45168', '46250', '47186', '48020', '49275', '50297', '51001', '52001',
             '15078', '06083']
known = {r[0] for r in index}
missing_caps = [c for c in CAPITALES if c not in known]
print('capitales no encontradas:', missing_caps)
dump('municipios.json', {'campos': ['ine', 'nombre', 'prov', 'ultima', 'poblacion', 'concejales', 'tipo'], 'provincias': PROV_NAMES,
                         'prov_ccaa': prov_ccaa, 'ccaa': CCAA, 'capitales': [c for c in CAPITALES if c in known],
                         'municipios': index})

# ---------------------------------------------------------------- diputaciones (official, from municipal files)
dips = {}
for ym in sorted(MUN_FECHAS):
    year = ym[:4]
    cands = mun[ym]['candidaturas']
    for key, d in mun[ym]['diputaciones'].items():
        ca, pr, di = key.split('-')
        if pr == '99':
            continue
        ent = dips.setdefault(pr, {'id': pr, 'n': PROV_NAMES[pr], 'ca': ca, 'e': {}})
        rows = []
        for code, v, s in d['res']:
            if s <= 0 and v <= 0:
                continue
            cd = cands.get(code, {'siglas': '?', 'nombre': ''})
            sig = P.clean_siglas(cd['siglas']); nom = cd['nombre'].strip()
            f, col = fam_color(sig, nom, pr)
            rows.append([sig, nom, col, f, v, s])
        rows = [r for r in rows if r[5] > 0] + sorted([r for r in rows if r[5] == 0], key=lambda r: -r[4])[:3]
        ent['e'][year] = {'fecha': MUN_FECHAS[ym], 'escanos': d['info']['escanos'], 'r': rows}
print('diputaciones', len(dips), sorted(dips))

# ---------------------------------------------------------------- cabildos (official)
cab_raw = json.load(open(os.path.join(WORK, 'oficial', 'cabildos_sup.json'), encoding='utf-8'))
ISLA_ID = {('35', '1'): 'gran-canaria', ('35', '2'): 'lanzarote', ('35', '3'): 'fuerteventura', ('38', '4'): 'tenerife',
           ('38', '5'): 'la-palma', ('38', '6'): 'la-gomera', ('38', '7'): 'el-hierro'}
ISLA_N = {'gran-canaria': 'Gran Canaria', 'lanzarote': 'Lanzarote', 'fuerteventura': 'Fuerteventura', 'tenerife': 'Tenerife',
          'la-palma': 'La Palma', 'la-gomera': 'La Gomera', 'el-hierro': 'El Hierro'}
CAB_FECHAS = {'197904': '1979-04-03', '198706': '1987-06-10', '199105': '1991-05-26', '199505': '1995-05-28',
              '199906': '1999-06-13', '200305': '2003-05-25', '200705': '2007-05-27', '201105': '2011-05-22',
              '201505': '2015-05-24', '201905': '2019-05-26', '202305': '2023-05-28'}
cabildos = {}
for ym, el in cab_raw.items():
    cands = el['candidaturas']
    for key, a in el['areas'].items():
        ca, pr, di = key.split('-')
        iid = ISLA_ID.get((pr, di))
        if not iid:
            continue
        ent = cabildos.setdefault(iid, {'id': iid, 'n': ISLA_N[iid], 'e': {}})
        rows = []
        for code, v, s in a['res']:
            cd = cands.get(code, {'siglas': '?', 'nombre': ''})
            sig = P.clean_siglas(cd['siglas']); nom = cd['nombre'].strip()
            f, col = fam_color(sig, nom, pr)
            rows.append([sig, nom, col, f, v, s])
        rows = [r for r in rows if r[5] > 0] + sorted([r for r in rows if r[5] == 0], key=lambda r: -r[4])[:3]
        ent['e'][ym[:4]] = {'fecha': CAB_FECHAS.get(ym, ym[:4]), 'escanos': a['info']['escanos'], 'r': rows,
                            'censo': a['info']['censo'], 'blancos': a['info']['blancos'], 'nulos': a['info']['nulos'],
                            'votos_cand': a['info']['votos_cand']}
print('cabildos', {k: sorted(v['e']) for k, v in cabildos.items()})

# ---------------------------------------------------------------- consells insulars & juntas generales 2023 (compiled)
def mkrows(lst):
    out = []
    for sig, nom, s in lst:
        f, col = fam_color(sig, nom)
        out.append([sig, nom, col, f, None, s])
    return out
consells = {
    'mallorca': {'id': 'mallorca', 'n': 'Consell de Mallorca', 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 33, 'fuente': 'compilada',
        'r': mkrows([('PP', 'Partido Popular', 13), ('PSIB-PSOE', 'Partit Socialista de les Illes Balears', 9), ('Vox', 'Vox', 5),
                     ('Més', 'Més per Mallorca', 4), ('El Pi', 'El Pi-Proposta per les Illes', 2)])}}},
    'menorca': {'id': 'menorca', 'n': 'Consell Insular de Menorca', 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 13, 'fuente': 'compilada',
        'r': mkrows([('PP', 'Partido Popular', 6), ('PSIB-PSOE', 'Partit Socialista de les Illes Balears', 4),
                     ('MxMe', 'Més per Menorca', 2), ('Vox', 'Vox', 1)])}}},
    'eivissa': {'id': 'eivissa', 'n': "Consell d'Eivissa", 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 13, 'fuente': 'compilada',
        'r': mkrows([('PP', 'Partido Popular', 8), ('PSIB-PSOE', 'Partit Socialista de les Illes Balears', 3), ('Vox', 'Vox', 1),
                     ('Unidas Podemos', 'Unidas Podemos', 1)])}}},
}
# Formentera: official municipal data (its Consell is elected in the municipal election)
fm = provfiles['07']['m'].get('07024')
if fm:
    cons_e = {}
    for y, rec in fm['e'].items():
        rows = []
        for idx, v, s in rec[6]:
            sig, nom, col, f = provfiles['07']['c'][idx]
            rows.append([sig, nom, col, f, v, s])
        cons_e[y] = {'fecha': MUN_FECHAS[[k for k in MUN_FECHAS if k.startswith(y)][0]], 'escanos': rec[1], 'r': rows, 'fuente': 'oficial'}
    consells['formentera'] = {'id': 'formentera', 'n': 'Consell Insular de Formentera', 'e': cons_e,
                              'nota': 'Formentera es municipio y consell a la vez: sus datos son los oficiales de las elecciones municipales.'}
jjgg = {
    'araba': {'id': 'araba', 'n': 'Juntas Generales de Álava/Araba', 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 51, 'fuente': 'compilada',
        'r': mkrows([('EAJ-PNV', 'Euzko Alderdi Jeltzalea-Partido Nacionalista Vasco', 15), ('EH Bildu', 'Euskal Herria Bildu', 14),
                     ('PSE-EE (PSOE)', 'Partido Socialista de Euskadi', 9), ('PP', 'Partido Popular', 9),
                     ('Elkarrekin Podemos', 'Elkarrekin Podemos', 3), ('Vox', 'Vox', 1)])}}},
    'bizkaia': {'id': 'bizkaia', 'n': 'Juntas Generales de Bizkaia', 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 51, 'fuente': 'compilada',
        'r': mkrows([('EAJ-PNV', 'Euzko Alderdi Jeltzalea-Partido Nacionalista Vasco', 23), ('EH Bildu', 'Euskal Herria Bildu', 15),
                     ('PSE-EE (PSOE)', 'Partido Socialista de Euskadi', 8), ('PP', 'Partido Popular', 3),
                     ('Elkarrekin Podemos', 'Elkarrekin Podemos', 2)])}}},
    'gipuzkoa': {'id': 'gipuzkoa', 'n': 'Juntas Generales de Gipuzkoa', 'e': {'2023': {'fecha': '2023-05-28', 'escanos': 51, 'fuente': 'compilada',
        'r': mkrows([('EH Bildu', 'Euskal Herria Bildu', 22), ('EAJ-PNV', 'Euzko Alderdi Jeltzalea-Partido Nacionalista Vasco', 17),
                     ('PSE-EE (PSOE)', 'Partido Socialista de Euskadi', 7), ('PP', 'Partido Popular', 3),
                     ('Elkarrekin Podemos', 'Elkarrekin Podemos', 2)])}}},
}

dump('locales.json', {'diputaciones': dips, 'cabildos': cabildos, 'consells': consells, 'juntas': jjgg})

# ---------------------------------------------------------------- Congreso (official national rows)
cong_raw = json.load(open(os.path.join(WORK, 'oficial', 'congreso_sup.json'), encoding='utf-8'))
CONG_FECHAS = {'197706': '1977-06-15', '197903': '1979-03-01', '198210': '1982-10-28', '198606': '1986-06-22',
               '198910': '1989-10-29', '199306': '1993-06-06', '199603': '1996-03-03', '200003': '2000-03-12',
               '200403': '2004-03-14', '200803': '2008-03-09', '201111': '2011-11-20', '201512': '2015-12-20',
               '201606': '2016-06-26', '201904': '2019-04-28', '201911': '2019-11-10', '202307': '2023-07-23'}
LEG = {'197706': 'Constituyente', '197903': 'I', '198210': 'II', '198606': 'III', '198910': 'IV', '199306': 'V', '199603': 'VI',
       '200003': 'VII', '200403': 'VIII', '200803': 'IX', '201111': 'X', '201512': 'XI', '201606': 'XII', '201904': 'XIII',
       '201911': 'XIV', '202307': 'XV'}
congreso_hist = {}
for ym, el in cong_raw.items():
    nat = el['areas'].get('99-99-9')
    cands = el['candidaturas']
    info = nat['info']
    valid = info['votos_cand'] + info['blancos']
    rows = []
    for code, v, s in nat['res']:
        cd = cands.get(code, {'siglas': '?', 'nombre': ''})
        sig = P.clean_siglas(cd['siglas']); nom = cd['nombre'].strip()
        f, col = fam_color(sig, nom)
        if s > 0 or v >= 0.003 * valid:
            rows.append([sig, nom, col, f, v, s])
    # provinces (seats by candidatura)
    provs = {}
    for key, a in el['areas'].items():
        ca, pr, di = key.split('-')
        if pr == '99' or di != '9':
            continue
        pr_rows = []
        for code, v, s in a['res']:
            if s <= 0 and v < 0.01 * max(1, a['info']['votos_cand']):
                continue
            cd = cands.get(code, {'siglas': '?', 'nombre': ''})
            sig = P.clean_siglas(cd['siglas']); nom = cd['nombre'].strip()
            f, col = fam_color(sig, nom, pr)
            pr_rows.append([sig, nom, col, f, v, s])
        provs[pr] = {'n': PROV_NAMES.get(pr, a['info']['nombre']), 'escanos': a['info']['escanos'], 'r': pr_rows}
    congreso_hist[ym[:4] + ('-' + ym[4:] if ym in ('201904', '201911') else '')] = {
        'ym': ym, 'fecha': CONG_FECHAS[ym], 'leg': LEG[ym], 'fuente': 'oficial',
        'censo': info['censo'], 'votantes': info['votos_cand'] + info['blancos'] + info['nulos'],
        'blancos': info['blancos'], 'nulos': info['nulos'], 'escanos': 350, 'r': rows, 'provincias': provs}
# 1989 and 1993: official decoded candidate lists (elected flags), grouped
pucela = json.load(open(os.path.join(WORK, 'pucela_seats.json'), encoding='utf-8'))
for ym in ('198910', '199306'):
    grp = collections.OrderedDict()
    for sig, s in pucela['congreso_' + ym].items():
        f = P.familia(sig)
        if sig.upper().startswith('UPN-PP'):
            f = 'pp'
        key = f if f != 'local' else 'local:' + sig
        g = grp.setdefault(key, {'sig': {}, 'f': f})
        g['sig'][sig] = g['sig'].get(sig, 0) + s
    rows = []
    for key, g in grp.items():
        seats = sum(g['sig'].values())
        label = max(g['sig'].items(), key=lambda kv: kv[1])[0]
        label = P.clean_siglas(label)
        f = g['f']
        rows.append([label, ' + '.join(sorted(g['sig'])) if len(g['sig']) > 1 else '', P.color(f, label), f, None, seats])
    rows.sort(key=lambda r: -r[5])
    congreso_hist[ym[:4]] = {'ym': ym, 'fecha': CONG_FECHAS[ym], 'leg': LEG[ym], 'fuente': 'oficial-candidatos',
                             'escanos': 350, 'r': rows,
                             'nota': 'Escaños por candidatura agregados a partir de la relación oficial de candidatos electos '
                                     '(los ficheros de totales de 1989 y 1993 no están disponibles); sin datos de votos.'}
print('congreso hist', sorted(congreso_hist))
for k in sorted(congreso_hist):
    assert sum(r[5] for r in congreso_hist[k]['r']) == 350, k

# Senado: elected senators by candidatura (official TOTA 04 + 03; 2023 decoded list)
senado_hist = {}
SEN_FECHAS = dict(CONG_FECHAS); SEN_FECHAS['197706'] = '1977-06-15'
for fp in sorted(glob.glob(os.path.join(OBR, 'senado', '*_TOTA'))):
    ym = os.path.basename(fp)[2:8]
    cands = ie.candidaturas(ie.find(fp, '03', '03'))
    cnt = collections.Counter()
    for c in ie.candidatos(ie.find(fp, '04', '03')):
        if c['electo']:
            cnt[c['cand']] += 1
    grp = collections.defaultdict(lambda: {'sig': collections.Counter(), 'f': None})
    for code, n in cnt.items():
        cd = cands.get(code, {'siglas': '?', 'nombre': ''})
        sig = P.clean_siglas(cd['siglas']); nom = cd['nombre'].strip()
        f = P.familia(sig, nom)
        if sig.upper().startswith('UPN-PP'):
            f = 'pp'
        key = f if f != 'local' else 'local:' + sig
        grp[key]['sig'][sig] += n; grp[key]['f'] = f
    senado_hist[ym] = grp
# 2023 from decoded lists
grp = collections.defaultdict(lambda: {'sig': collections.Counter(), 'f': None})
for sig, n in pucela['senado_202307'].items():
    f = P.familia(sig)
    key = f if f != 'local' else 'local:' + sig
    grp[key]['sig'][sig] += n; grp[key]['f'] = f
senado_hist['202307'] = grp
senado = {}
for ym, grp in sorted(senado_hist.items()):
    rows = []
    for key, g in grp.items():
        seats = sum(g['sig'].values())
        label = P.clean_siglas(g['sig'].most_common(1)[0][0])
        f = g['f']
        if f != 'local' and len(label) > 14:
            label = P.FAMILIAS[f][0]
        rows.append([label, ' + '.join(sorted(g['sig'])) if len(g['sig']) > 1 else '', P.color(f, label), f, None, seats])
    rows.sort(key=lambda r: -r[5])
    senado[ym[:4] + ('-' + ym[4:] if ym in ('201904', '201911') else '')] = {
        'fecha': SEN_FECHAS.get(ym), 'leg': LEG.get(ym), 'electos': sum(r[5] for r in rows), 'r': rows}
print('senado', {k: v['electos'] for k, v in senado.items()})

# ---------------------------------------------------------------- Congreso: composition at dissolution, investitures
def prow(sig, nom, s, fam=None):
    f = fam or P.familia(sig, nom)
    return [sig, nom, P.color(f, sig), f, None, s]
congreso_disolucion = {
    'fecha': '2026-10-06',
    'titulo': 'Composición del Congreso al disolverse las Cortes (6-10-2026)',
    'nota': 'Por partido y no por grupo parlamentario. Cambios respecto al 23-J: Podemos (4) y Àgueda Micó (Compromís) pasaron '
            'del Grupo Sumar al Mixto; Javier Ortega Smith dejó el grupo de Vox por el Mixto (julio de 2026); José Luis Ábalos '
            'renunció a su acta (enero de 2026) y el escaño volvió al PSOE.',
    'r': [prow('PP', 'Partido Popular', 137), prow('PSOE', 'PSOE (incluye PSC)', 121), prow('Vox', 'Vox', 32),
          prow('Sumar', 'Grupo Plurinacional Sumar (Movimiento Sumar, Comuns, IU, Más Madrid…)', 26, 'sumar'),
          prow('ERC', 'Esquerra Republicana', 7), prow('Junts', 'Junts per Catalunya', 7), prow('EH Bildu', 'EH Bildu', 6),
          prow('EAJ-PNV', 'Partido Nacionalista Vasco', 5), prow('Podemos', 'Podemos (Grupo Mixto)', 4, 'podemos'),
          prow('BNG', 'Bloque Nacionalista Galego', 1), prow('CC', 'Coalición Canaria', 1), prow('UPN', 'Unión del Pueblo Navarro', 1),
          prow('Compromís', 'Àgueda Micó (Compromís, Grupo Mixto)', 1, 'compromis'),
          prow('Ortega Smith', 'Javier Ortega Smith (exVox, Grupo Mixto)', 1, 'local')],
}
assert sum(r[5] for r in congreso_disolucion['r']) == 350
investiduras = [
    # leg, candidato, partido, fecha, votacion, si, no, abst, resultado
    ['I', 'Adolfo Suárez', 'UCD', '1979-03-30', '1ª', 183, 149, 8, True],
    ['I', 'Leopoldo Calvo-Sotelo', 'UCD', '1981-02-20', '1ª', 169, 158, 17, False],
    ['I', 'Leopoldo Calvo-Sotelo', 'UCD', '1981-02-25', '2ª', 186, 158, None, True],
    ['II', 'Felipe González', 'PSOE', '1982-12-01', '1ª', 207, 116, 21, True],
    ['III', 'Felipe González', 'PSOE', '1986-07-23', '1ª', 184, 144, 6, True],
    ['IV', 'Felipe González', 'PSOE', '1989-12-05', '1ª', 167, 155, 6, True],
    ['V', 'Felipe González', 'PSOE', '1993-07-09', '1ª', 181, 165, 1, True],
    ['VI', 'José María Aznar', 'PP', '1996-05-04', '1ª', 181, 166, 1, True],
    ['VII', 'José María Aznar', 'PP', '2000-04-26', '1ª', 202, 148, None, True],
    ['VIII', 'José Luis Rodríguez Zapatero', 'PSOE', '2004-04-16', '1ª', 183, 148, 19, True],
    ['IX', 'José Luis Rodríguez Zapatero', 'PSOE', '2008-04-09', '1ª', 168, 158, 23, False],
    ['IX', 'José Luis Rodríguez Zapatero', 'PSOE', '2008-04-11', '2ª', 169, 158, 23, True],
    ['X', 'Mariano Rajoy', 'PP', '2011-12-20', '1ª', 187, 149, 14, True],
    ['XI', 'Pedro Sánchez', 'PSOE', '2016-03-04', 'final', 131, 219, 0, False],
    ['XII', 'Mariano Rajoy', 'PP', '2016-09-02', 'final', 170, 180, 0, False],
    ['XII', 'Mariano Rajoy', 'PP', '2016-10-29', '2ª', 170, 111, 68, True],
    ['XIII', 'Pedro Sánchez', 'PSOE', '2019-07-25', 'final', 124, 155, 67, False],
    ['XIV', 'Pedro Sánchez', 'PSOE', '2020-01-05', '1ª', 166, 165, 18, False],
    ['XIV', 'Pedro Sánchez', 'PSOE', '2020-01-07', '2ª', 167, 165, 18, True],
    ['XV', 'Alberto Núñez Feijóo', 'PP', '2023-09-27', '1ª', 172, 178, 0, False],
    ['XV', 'Alberto Núñez Feijóo', 'PP', '2023-09-29', '2ª', 172, 177, 0, False],
    ['XV', 'Pedro Sánchez', 'PSOE', '2023-11-16', '1ª', 179, 171, 0, True],
]
mociones = [
    ['1980-05-30', 'Felipe González', 'PSOE', 'Adolfo Suárez', 152, 166, 21, False],
    ['1987-03-30', 'Antonio Hernández Mancha', 'AP', 'Felipe González', 66, 195, 71, False],
    ['2017-06-14', 'Pablo Iglesias', 'Unidos Podemos', 'Mariano Rajoy', 82, 170, 97, False],
    ['2018-06-01', 'Pedro Sánchez', 'PSOE', 'Mariano Rajoy', 180, 169, 1, True],
    ['2020-10-22', 'Santiago Abascal', 'Vox', 'Pedro Sánchez', 52, 298, 0, False],
    ['2023-03-22', 'Ramón Tamames', 'Vox (candidato independiente)', 'Pedro Sánchez', 53, 201, 91, False],
]
dump('generales.json', {
    'congreso': congreso_hist, 'disolucion': congreso_disolucion, 'senado': senado,
    'investiduras': investiduras, 'mociones': mociones,
    'convocatoria': {'fecha_eleccion': '2026-11-29', 'decreto_boe': '2026-10-06', 'constitucion_cortes': '2026-12-23',
                     'campana': ['2026-11-13', '2026-11-27'], 'senadores_electos': 209},
})

# ---------------------------------------------------------------- autonómicas
REG = {'Andalusia': 'andalucia', 'Aragon': 'aragon', 'Asturias': 'asturias', 'Balearic Islands': 'baleares',
       'Canary Islands': 'canarias', 'Cantabria': 'cantabria', 'Castile and León': 'castilla-leon',
       'Castilla–La Mancha': 'castilla-la-mancha', 'Catalonia': 'cataluna', 'Extremadura': 'extremadura', 'Galicia': 'galicia',
       'Madrid': 'madrid', 'Murcia': 'murcia', 'Navarre': 'navarra', 'Basque Country': 'pais-vasco', 'La Rioja': 'la-rioja',
       'Valencian Community': 'valencia'}
CAMARA = {
    'andalucia': ('Andalucía', 'Parlamento de Andalucía', '01'), 'aragon': ('Aragón', 'Cortes de Aragón', '02'),
    'asturias': ('Asturias', 'Junta General del Principado de Asturias', '03'), 'baleares': ('Illes Balears', 'Parlament de les Illes Balears', '04'),
    'canarias': ('Canarias', 'Parlamento de Canarias', '05'), 'cantabria': ('Cantabria', 'Parlamento de Cantabria', '06'),
    'castilla-la-mancha': ('Castilla-La Mancha', 'Cortes de Castilla-La Mancha', '07'), 'castilla-leon': ('Castilla y León', 'Cortes de Castilla y León', '08'),
    'cataluna': ('Cataluña', 'Parlament de Catalunya', '09'), 'extremadura': ('Extremadura', 'Asamblea de Extremadura', '10'),
    'galicia': ('Galicia', 'Parlamento de Galicia', '11'), 'madrid': ('Comunidad de Madrid', 'Asamblea de Madrid', '12'),
    'navarra': ('Navarra', 'Parlamento de Navarra', '13'), 'pais-vasco': ('País Vasco', 'Parlamento Vasco', '14'),
    'murcia': ('Región de Murcia', 'Asamblea Regional de Murcia', '15'), 'la-rioja': ('La Rioja', 'Parlamento de La Rioja', '16'),
    'valencia': ('Comunitat Valenciana', 'Corts Valencianes', '17'), 'ceuta': ('Ceuta', 'Asamblea de Ceuta', '18'),
    'melilla': ('Melilla', 'Asamblea de Melilla', '19')}
LABEL_ES = {
    'Cat–Junts+': ('Junts+', 'Junts+ Puigdemont per Catalunya'), 'Comuns Sumar': ('Comuns Sumar', 'Comuns Sumar'),
    'PSC–PSOE': ('PSC', "Partit dels Socialistes de Catalunya"), 'PSC–CpC': ('PSC-CpC', 'PSC-Ciutadans pel Canvi'),
    'Aliança.cat': ('Aliança Catalana', 'Aliança Catalana'), 'EAJ/PNV': ('EAJ-PNV', 'Partido Nacionalista Vasco'),
    'PSE–EE (PSOE)': ('PSE-EE', 'Partido Socialista de Euskadi'), 'PP+Cs': ('PP+Cs', 'PP + Ciudadanos'),
    'DO': ('DO', 'Democracia Ourensana'), 'Existe': ('Aragón-Teruel Existe', 'Aragón-Teruel Existe'),
    'IU–MS': ('IU-Movimiento Sumar', 'Izquierda Unida-Movimiento Sumar'), 'MM–VQ': ('Más Madrid', 'Más Madrid-Verdes Equo'),
    'Contigo/Zurekin': ('Contigo-Zurekin', 'Contigo Navarra-Zurekin Nafarroa'), 'I–E': ('I-E', 'Izquierda-Ezkerra'),
    'NA+': ('NA+', 'Navarra Suma'), 'GBai': ('Geroa Bai', 'Geroa Bai'), 'PorA': ('Por Andalucía', 'Por Andalucía'),
    'AA': ('Adelante Andalucía', 'Adelante Andalucía'), 'XAV': ('XAV', 'Por Ávila'), 'SY': ('Soria ¡Ya!', 'Soria ¡Ya!'),
    'EV–SY': ('Soria ¡Ya!', 'España Vaciada-Soria ¡Ya!'), 'UxE (Podemos–IU–AV)': ('UPE', 'Unidas por Extremadura (Podemos-IU-AV)'),
    'Podemos–IU–AV': ('Podemos-IU-AV', 'Podemos-IU-Alianza Verde'), 'Més': ('Més', 'Més per Mallorca'), 'MxMe': ('MxMe', 'Més per Menorca'),
    'Sa Unió': ('Sa Unió', 'Sa Unió de Formentera'), 'NC–BC': ('NC-BC', 'Nueva Canarias-Bloque Canarista'),
    'CCa': ('CC', 'Coalición Canaria'), 'CCa–PNC': ('CC-PNC', 'Coalición Canaria-PNC'), 'CC–PNC': ('CC-PNC', 'Coalición Canaria-PNC'),
    'CC–PNC–CCN': ('CC-PNC-CCN', 'Coalición Canaria-PNC-CCN'), 'Podemos Asturies': ('Podemos', 'Podemos Asturies'),
    'IU–MP–IAS': ('IU-Convocatoria por Asturias', 'IU-Más País-Izquierda Asturiana'), 'Foro': ('Foro', 'Foro Asturias'),
    'PSIB–PSOE': ('PSIB-PSOE', 'Partit Socialista de les Illes Balears'), 'EUIB–Podemos': ('Unidas Podemos', 'Unidas Podemos'),
    'PSdeG–PSOE': ('PSdeG-PSOE', 'Partido dos Socialistas de Galicia'), 'PSOE–A': ('PSOE-A', 'PSOE de Andalucía'),
    'PSN–PSOE': ('PSN-PSOE', 'Partido Socialista de Navarra'), 'PSPV–PSOE': ('PSPV-PSOE', 'Partit Socialista del País Valencià'),
    'Elkarrekin Podemos': ('Elkarrekin Podemos', 'Elkarrekin Podemos'), 'Sumar': ('Sumar', 'Sumar'),
    'JxCat': ('JxCat', 'Junts per Catalunya'), 'ECP–PEC': ('ECP-PEC', 'En Comú Podem-Podem en Comú'), 'CUP–G': ('CUP-G', 'CUP-Guanyem'),
    'CUP–DT': ('CUP', "Candidatura d'Unitat Popular-Defensem la Terra"), 'Cs': ('Cs', 'Ciudadanos'), "C's": ('Cs', 'Ciudadanos'),
    'Más Madrid': ('Más Madrid', 'Más Madrid'), 'Podemos–IU': ('Podemos-IU', 'Podemos-IU'), 'UPL': ('UPL', 'Unión del Pueblo Leonés'),
    'Podemos–Equo': ('Podemos-Equo', 'Podemos-Equo'), 'Unides Podem–EUPV': ('Unides Podem-EUPV', 'Unides Podem-EUPV'),
    'IU–IAS': ('IU-IAS', 'IU-Izquierda Asturiana'), 'FAC': ('Foro', 'Foro Asturias'), 'Podemos–EUIB': ('Podemos-EUIB', 'Podemos-EUIB'),
    'Vox–ACTUA Baleares': ('Vox', 'Vox-Actua Baleares'), 'GxF+PSOE+EUIB': ('GxF+PSOE+EUIB', 'Gent per Formentera+PSOE+EUIB'),
    'NCa': ('NC', 'Nueva Canarias'), 'Podemos–SSP–Equo': ('Podemos-SSP-Equo', 'Podemos-Sí Se Puede-Equo'),
    'Podemos–IU–eX–Equo': ('Podemos-IU-eX-Equo', 'Unidas por Extremadura'), 'Podemos–IU–Equo': ('Podemos-IU-Equo', 'Podemos-IU-Equo'),
    'Podemos': ('Podemos', 'Podemos'), 'EV–SY': ('Soria ¡Ya!', 'España Vaciada-Soria ¡Ya!'), 'Podemos–IU–AV': ('Podemos-IU-AV', 'Podemos-IU-Alianza Verde'),
    'Podemos–AV': ('Podemos-AV', 'Podemos-Alianza Verde'), 'JuntsxCat': ('JuntsxCat', 'Junts per Catalunya'),
    'ERC–CatSí': ('ERC-CatSí', 'ERC-Catalunya Sí'), 'CatComú–Podem': ('CatComú-Podem', 'Catalunya en Comú-Podem'),
    'En Marea': ('En Marea', 'En Marea'), 'BNG–Nós': ('BNG', 'BNG-Nós Candidatura Galega'), 'PSOE–SIEx': ('PSOE-SIEx', 'PSOE-SIEx'),
    'IULV–CA': ('IULV-CA', 'IU Los Verdes-Convocatoria por Andalucía'), 'JxSí': ('JxSí', 'Junts pel Sí'),
    'CatSíqueesPot': ('CSQEP', 'Catalunya Sí que es Pot'), 'Podemos/Podem': ('Podemos', 'Podemos'), 'MpM': ('MxMe', 'Més per Menorca'),
    'GxF+PSOE': ('GxF+PSOE', 'Gent per Formentera+PSOE'), 'IU/IX': ('IU', 'Izquierda Xunida'), 'IU–Equo': ('IU-Equo', 'IU-Equo'),
    'UPyD': ('UPyD', 'Unión Progreso y Democracia'), 'AGE': ('AGE', 'Alternativa Galega de Esquerda'), 'ICV–EUiA': ('ICV-EUiA', 'ICV-EUiA'),
    'IU–LV': ('IU-LV', 'IU-Los Verdes'), 'PSM–IV–ExM': ('PSM-IV-ExM', 'PSM-Iniciativa Verds-Entesa'), 'PSM–EN': ('PSM-EN', 'PSM-Entesa Nacionalista'),
    'CC–PNC': ('CC-PNC', 'Coalición Canaria-PNC'), 'NC': ('NC', 'Nueva Canarias'), 'IUCyL': ('IU', 'IU de Castilla y León'),
    'PP–EU': ('PP-EU', 'PP-Extremadura Unida'), 'PSOE–r': ('PSOE-regionalistas', 'PSOE-regionalistas'), 'IU–SIEx': ('IU-SIEx', 'IU-SIEx'),
    'PR': ('PR', 'Partido Riojano'), 'IUCM–LV': ('IU-LV', 'IU Comunidad de Madrid-Los Verdes'), 'IU–V–RM': ('IU-V-RM', 'IU-Verdes Región de Murcia'),
    'NaBai 2011': ('NaBai', 'Nafarroa Bai'), 'B–EA/AE–EA': ('Bildu', 'Bildu-Eusko Alkartasuna'), 'Compromís': ('Compromís', 'Compromís'),
    'EUPV': ('EUPV', 'Esquerra Unida del País Valencià'), 'Aralar': ('Aralar', 'Aralar'), 'EA': ('EA', 'Eusko Alkartasuna'),
    'EB–B': ('EB-B', 'Ezker Batua-Berdeak'), 'IU–BA–LV': ('IU-BA-LV', 'IU-Bloque por Asturies-Los Verdes'), 'Bloc': ('Bloc', 'Bloc per Mallorca'),
    'UM': ('UM', 'Unió Mallorquina'), 'PSOE–ExC': ('PSOE-ExC', 'PSOE-Eivissa pel Canvi'), 'AIPF': ('AIPF', 'Agrupació Independent Popular de Formentera'),
    'UPL–UZ': ('UPL', 'Unión del Pueblo Leonés'), 'IUCM': ('IU', 'IU Comunidad de Madrid'), 'IU–LV–RM': ('IU-LV-RM', 'IU-Los Verdes Región de Murcia'),
    'NaBai': ('NaBai', 'Nafarroa Bai'), 'CDN': ('CDN', 'Convergencia de Demócratas de Navarra'), 'IUN/NEB': ('IU', 'Izquierda Unida de Navarra'),
    'Compromís PV': ('Compromís PV', 'Compromís pel País Valencià'), 'SI': ('SI', 'Solidaritat Catalana per la Independència'),
    'PNV–EA': ('PNV-EA', 'PNV-Eusko Alkartasuna'), 'PCTV/EHAK': ('PCTV/EHAK', 'Partido Comunista de las Tierras Vascas'),
    'IU–BA': ('IU-BA', 'IU-Bloque por Asturies'), 'Pacte+COP': ('Pacte', "Pacte Progressista d'Eivissa + COP"), 'EU–EV': ('EU-EV', 'Esquerra Unida-Els Verds'),
    'CC': ('CC', 'Coalición Canaria'), 'FNC': ('FNC', 'Federación Nacionalista Canaria'), 'PSOE–p': ('PSOE-progresistas', 'PSOE-progresistas'),
    'IU–SIEx': ('IU-SIEx', 'IU-SIEx'), 'IURM': ('IU', 'IU Región de Murcia'), 'EA–PNV': ('EA-PNV', 'Eusko Alkartasuna-PNV'),
    'Entesa': ('Entesa', "Entesa de l'Esquerra (EUPV-Els Verds)"), 'ICV–EA': ('ICV-EA', 'ICV-Esquerra Alternativa'), 'EH': ('EH', 'Euskal Herritarrok'),
    'IU/EB': ('IU/EB', 'Izquierda Unida/Ezker Batua'), 'URAS': ('URAS', 'Unión Renovadora Asturiana'), 'AHI': ('AHI', 'Agrupación Herreña Independiente'),
    'TC–PNC': ('TC-PNC', 'Tierra Comunera-PNC'), 'IU–CE': ('IU-CE', 'IU-Coalición Extremeña'), 'IC–V': ('IC-V', 'Iniciativa per Catalunya-Verds'),
    'UA': ('UA', 'Unidad Alavesa'), 'PSdeG–PSOE/EU–EG/OV': ('PSdeG-PSOE', 'PSdeG-PSOE-Esquerda de Galicia-Os Verdes'),
    'PAS': ('PAS', 'Partíu Asturianista'), 'PSIB-PSOE': ('PSIB-PSOE', 'Partit Socialista de les Illes Balears'), 'PSM-ENE': ('PSM-EN', 'PSM-Entesa Nacionalista'),
    'EVIB': ('EVIB', 'Els Verds de les Illes Balears'), 'PCN': ('PCN', 'Plataforma Canaria Nacionalista'), 'UPCA': ('UPCA', 'Unión para el Progreso de Cantabria'),
    'IU-ICAM': ('IU', 'IU-Izquierda de Castilla-La Mancha'), 'IU-LV-CE': ('IU-LV-CE', 'IU-Los Verdes-Coalición Extremeña'), 'CEx': ('CEx', 'Coalición Extremeña'),
    'PSN-PSOE': ('PSN-PSOE', 'Partido Socialista de Navarra'), 'IU/EB': ('IU', 'Izquierda Unida'), 'HB': ('HB', 'Herri Batasuna'),
    'EU-EV': ('EU-EV', 'Esquerra Unida-Els Verds'), 'UV-FICVA-CCV': ('UV', 'Unió Valenciana'), 'UV': ('UV', 'Unió Valenciana'),
    'IC-EV': ('IC-EV', 'Iniciativa per Catalunya-Els Verds'), 'PA–PAP': ('PA', 'Partido Andalucista'), 'IC': ('IC', 'Iniciativa per Catalunya'),
    'CAA–IU': ('IU', 'IU-Convergencia Alternativa de Aragón'), 'PAS–UNA': ('PAS-UNA', 'Partíu Asturianista-Unidá'), 'PP–UM': ('PP-UM', 'PP-Unió Mallorquina'),
    'PSM–NM': ('PSM-NM', 'PSM-Nacionalistes de Mallorca'), 'PSM–EU': ('PSM-EU', 'PSM-Esquerra Unida (Menorca)'), 'UIM–IM': ('UIM', 'Unió Independent de Mallorca'),
    'FIEF': ('FIEF', 'Federació Independents d\'Eivissa i Formentera'), 'AIC': ('AIC', 'Agrupaciones Independientes de Canarias'),
    'ICAN': ('ICAN', 'Iniciativa Canaria'), 'AM': ('AM', 'Asamblea Majorera'), 'PSE–PSOE': ('PSE-PSOE', 'Partido Socialista de Euskadi'),
    'EE': ('EE', 'Euskadiko Ezkerra'), 'IU–CA': ('IU-CA', 'IU-Convocatoria por Andalucía'), 'PSG–EG': ('PSG-EG', 'Partido Socialista Galego-Esquerda Galega'),
    'CG': ('CG', 'Coalición Galega'), 'AP–PL': ('AP-PL', 'Alianza Popular-Partido Liberal'), 'AC–INC': ('AC-INC', 'Asamblea Canaria-ICN'),
    'ICU': ('ICU', 'Izquierda Canaria Unida'), 'PDP': ('PDP', 'Partido Demócrata Popular'), 'EU': ('EU', 'Extremadura Unida'),
    'PRP': ('PRP', 'Partido Riojano Progresista'), 'UDF (PDP–PL)': ('UDF', 'Unión Demócrata Foral (PDP-PL)'), 'IU–UPV': ('IU-UPV', 'IU-Unitat del Poble Valencià'),
    'AP–PDP–PL': ('AP-PDP-PL', 'Coalición Popular'), 'AP–PDP–PL–CdG': ('AP-PDP-PL-CdG', 'Coalición Popular'), 'PSdG–PSOE': ('PSdG-PSOE', 'PSdeG-PSOE'),
    'AP–PDP–UL': ('AP-PDP-UL', 'Coalición Popular'), 'PSUC': ('PSUC', 'Partit Socialista Unificat de Catalunya'), 'PCE': ('PCE', 'Partido Comunista de España'),
    'PCA–PCE': ('PCE', 'Partido Comunista de Asturias'), 'PSM–PSI': ('PSM-PSI', 'PSM-Partit Socialista de Menorca'), 'PSM': ('PSM', 'Partit Socialista de Mallorca'),
    'PDL': ('PDL', 'Partido Demócrata Liberal'), 'CIM': ('CIM', 'Candidatura Independent de Menorca'), 'UPC–AC': ('UPC', 'Unión del Pueblo Canario'),
    'AGI': ('AGI', 'Agrupación Gomera Independiente'), 'PCC': ('PCC', 'Partido Comunista Canario'), 'CNC': ('CNC', 'Convergencia Nacionalista Canaria'),
    'AP–PDP–UL–UV': ('AP-PDP-UL-UV', 'Coalición Popular-Unió Valenciana'), 'PCE–PCPV': ('PCE', 'Partit Comunista del País Valencià'),
    'UCD': ('UCD', 'Unión de Centro Democrático'), 'PSA–PA': ('PSA-PA', 'Partido Socialista de Andalucía'), 'BNPG–PSG': ('BNPG-PSG', 'Bloque Nacional-Popular Galego'),
    'EG': ('EG', 'Esquerda Galega'), 'PCE–PCG': ('PCE', 'Partido Comunista de Galicia'), 'PCE/EPK': ('PCE', 'Partido Comunista de Euskadi'),
    'CC–UCD': ('CC-UCD', 'Centristes de Catalunya-UCD'), 'CiU': ('CiU', 'Convergència i Unió'), 'ERC': ('ERC', 'Esquerra Republicana de Catalunya'),
    'PSOE': ('PSOE', 'Partido Socialista Obrero Español'), 'PP': ('PP', 'Partido Popular'), 'Vox': ('Vox', 'Vox'), 'BNG': ('BNG', 'Bloque Nacionalista Galego'),
    'EH Bildu': ('EH Bildu', 'Euskal Herria Bildu'), 'CHA': ('CHA', 'Chunta Aragonesista'), 'PAR': ('PAR', 'Partido Aragonés'), 'IU': ('IU', 'Izquierda Unida'),
    'PRC': ('PRC', 'Partido Regionalista de Cantabria'), 'ASG': ('ASG', 'Agrupación Socialista Gomera'), 'El Pi': ('El Pi', 'El Pi-Proposta per les Illes'),
    'UPN': ('UPN', 'Unión del Pueblo Navarro'), 'AP': ('AP', 'Alianza Popular'), 'CDS': ('CDS', 'Centro Democrático y Social'), 'PA': ('PA', 'Partido Andalucista'),
    'CUP': ('CUP', "Candidatura d'Unitat Popular"), 'PNV–EA': ('PNV-EA', 'PNV-Eusko Alkartasuna'),
}
FAM_OVERRIDE = {'PSC–CpC': 'psoe', 'Cat–Junts+': 'junts', 'Comuns Sumar': 'sumar', 'IU–MP–IAS': 'iu', 'Podemos Asturies': 'podemos',
                'EUIB–Podemos': 'podemos', 'UxE (Podemos–IU–AV)': 'podemos', 'Podemos–IU–AV': 'podemos', 'Podemos–AV': 'podemos',
                'PP+Cs': 'pp', 'PP–UM': 'pp', 'PP–EU': 'pp', 'AP–PDP–UL–UV': 'pp', 'UDF (PDP–PL)': 'pp', 'Pacte+COP': 'local',
                'GxF+PSOE+EUIB': 'local', 'GxF+PSOE': 'local', 'PSdeG–PSOE/EU–EG/OV': 'psoe', 'AGE': 'podemos', 'B–EA/AE–EA': 'bildu',
                'Aralar': 'bildu', 'PNV–EA': 'pnv', 'EA–PNV': 'ea', 'IUN/NEB': 'iu', 'Bloc': 'mes', 'PSM–EU': 'mes', 'IU–UPV': 'iu',
                'Entesa': 'iu', 'NA+': 'upn', 'I–E': 'iu', 'PCE/EPK': 'iu', 'SI': 'local', 'EV–SY': 'local', 'SY': 'local', 'XAV': 'local',
                'DO': 'local', 'JxSí': 'junts', 'CatSíqueesPot': 'podemos', 'ECP–PEC': 'podemos', 'CatComú–Podem': 'podemos',
                'En Marea': 'podemos', 'Elkarrekin Podemos': 'podemos', 'Sumar': 'sumar', 'IU–MS': 'iu', 'PorA': 'iu', 'MM–VQ': 'mm',
                'Más Madrid': 'mm', 'UPL–UZ': 'upl', 'FAC': 'foro', 'Foro': 'foro', 'CC–UCD': 'ucd', 'PSA–PA': 'pa', 'PA–PAP': 'pa',
                'BNPG–PSG': 'bng', 'PSOE–SIEx': 'psoe', 'PSOE–r': 'psoe', 'PSOE–p': 'psoe', 'PSOE–ExC': 'psoe', 'Vox–ACTUA Baleares': 'vox',
                'Contigo/Zurekin': 'podemos', 'Unides Podem–EUPV': 'podemos', 'Podemos–IU': 'podemos', 'Podemos–Equo': 'podemos',
                'Podemos–EUIB': 'podemos', 'Podemos–SSP–Equo': 'podemos', 'Podemos–IU–eX–Equo': 'podemos', 'Podemos–IU–Equo': 'podemos',
                'MxMe': 'mes', 'MpM': 'mes', 'Més': 'mes', 'ICV–EUiA': 'iu', 'ICV–EA': 'iu', 'IC–V': 'iu', 'IC-EV': 'iu', 'IC': 'iu',
                'EU–EV': 'iu', 'EU-EV': 'iu', 'EU': 'local', 'CUP–G': 'cup', 'CUP–DT': 'cup', 'Aliança.cat': 'ac'}
auton = {}
rows_all = []
for f in sorted(glob.glob(os.path.join(WORK, 'autonomicas', '*.csv'))):
    rows_all.extend(csv.DictReader(open(f, encoding='utf-8')))
for r in rows_all:
    rid = REG[r['region']]
    lab, nom = LABEL_ES.get(r['party'], (r['party'].replace('–', '-'), r['party'].replace('–', '-')))
    fam = FAM_OVERRIDE.get(r['party']) or P.familia(r['party'], nom)
    col = P.color(fam, lab)
    el = auton.setdefault(rid, {}).setdefault(r['date'], [])
    el.append([lab, nom, col, fam, None, int(r['seats'])])
# Ceuta & Melilla from official municipal data
for rid, (pr, ine) in {'ceuta': ('51', '51001'), 'melilla': ('52', '52001')}.items():
    pf = provfiles[pr]
    ent = pf['m'][ine]
    for y, rec in ent['e'].items():
        ym = [k for k in MUN_FECHAS if k.startswith(y)][0]
        rows = []
        for idx, v, s in rec[6]:
            sig, nom, col, fam = pf['c'][idx]
            if s > 0:
                rows.append([sig, nom, col, fam, v, s])
        auton.setdefault(rid, {})[MUN_FECHAS[ym]] = sorted(rows, key=lambda r: -r[5])
GOBIERNO = {
    'andalucia': ('Juan Manuel Moreno (PP)', 'Reelegido el 3-7-2026 en segunda votación tras un primer intento fallido (30-6-2026); gobierno PP con una vicepresidencia para Vox.'),
    'aragon': ('Jorge Azcón (PP)', 'Investido el 29-4-2026 con el apoyo de Vox.'),
    'castilla-leon': ('Alfonso Fernández Mañueco (PP)', 'Investido el 9-6-2026 con los votos de PP y Vox, tras un acuerdo de gobierno.'),
    'extremadura': ('María Guardiola (PP)', 'Investida el 22-4-2026 con los votos de PP (29) y Vox (11), tras una investidura fallida en marzo.'),
    'asturias': ('Adrián Barbón (PSOE)', 'Gobierno de PSOE y Convocatoria por Asturias (IU).'),
    'baleares': ('Marga Prohens (PP)', 'Gobierno del PP en minoría.'),
    'pais-vasco': ('Imanol Pradales (EAJ-PNV)', 'Gobierno de coalición PNV-PSE.'),
    'canarias': ('Fernando Clavijo (CC)', 'Gobierno de CC y PP, con apoyo de ASG y AHI.'),
    'cantabria': ('María José Sáenz de Buruaga (PP)', 'Gobierno del PP en minoría.'),
    'castilla-la-mancha': ('Emiliano García-Page (PSOE)', 'Gobierno del PSOE con mayoría absoluta.'),
    'cataluna': ('Salvador Illa (PSC)', 'Gobierno del PSC en minoría.'),
    'galicia': ('Alfonso Rueda (PP)', 'Gobierno del PP con mayoría absoluta.'),
    'la-rioja': ('Gonzalo Capellán (PP)', 'Gobierno del PP con mayoría absoluta.'),
    'madrid': ('Isabel Díaz Ayuso (PP)', 'Gobierno del PP con mayoría absoluta.'),
    'murcia': ('Fernando López Miras (PP)', 'Gobierno del PP en minoría.'),
    'navarra': ('María Chivite (PSN-PSOE)', 'Gobierno de PSN, Geroa Bai y Contigo-Zurekin.'),
    'valencia': ('Juanfran Pérez Llorca (PP)', 'Presidente desde el 2-12-2025, tras la dimisión de Carlos Mazón; gobierno del PP en minoría.'),
    'ceuta': ('Juan Jesús Vivas (PP)', 'Presidente de la Ciudad Autónoma.'),
    'melilla': ('Juan José Imbroda (PP)', 'Presidente de la Ciudad Autónoma.'),
}
autonomias = {}
for rid, (nombre, camara, cod) in CAMARA.items():
    els = auton.get(rid, {})
    elist = []
    for d in sorted(els):
        rows = sorted(els[d], key=lambda r: -r[5])
        elist.append({'fecha': d, 'escanos': sum(r[5] for r in rows), 'r': rows,
                      'fuente': 'oficial' if rid in ('ceuta', 'melilla') else 'compilada'})
    g = GOBIERNO.get(rid)
    autonomias[rid] = {'id': rid, 'n': nombre, 'camara': camara, 'ccaa': cod, 'elecciones': elist,
                       'gobierno': {'presidente': g[0], 'nota': g[1]} if g else None}
    if rid in ('ceuta', 'melilla'):
        autonomias[rid]['nota'] = 'Hasta 1995 eran ayuntamientos; desde los Estatutos de 1995 se eligen sus Asambleas en las elecciones municipales.'
print('autonomias', {k: len(v['elecciones']) for k, v in autonomias.items()})
dump('autonomicas.json', autonomias)

# ---------------------------------------------------------------- national municipal summary + families
dump('resumen.json', {
    'municipales': national_mun,
    'familias': {k: {'corto': v[0], 'largo': v[1], 'color': v[2]} for k, v in P.FAMILIAS.items()},
    'generado': '2026-10-08',
})
print('done')
