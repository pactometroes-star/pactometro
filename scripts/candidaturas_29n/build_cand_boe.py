# Candidaturas al Congreso del 29-N por provincia, a partir del BOE (BOE-A-2026-22607, candidaturas presentadas).
# Uso: python3 build_cand_boe.py → escribe provincias_cand.json (va en data/candidaturas.json → "provincias").
# boe_congreso.json: [provincia, [[siglas, cabeza de lista(, nombre si difiere del habitual)(, "#0" si no tiene candidatos)]]],
# extraído del texto del BOE (cabeza de lista sin la afiliación entre paréntesis).
import json, os, unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
boe = json.load(open(os.path.join(HERE, 'boe_congreso.json'), encoding='utf-8'))

INE = {'ALBACETE': '02', 'ALICANTE': '03', 'ALMERÍA': '04', 'ÁLAVA': '01', 'ASTURIAS': '33', 'ÁVILA': '05', 'BADAJOZ': '06',
       'ILLES BALEARS': '07', 'BARCELONA': '08', 'BIZKAIA': '48', 'BURGOS': '09', 'CÁCERES': '10', 'CÁDIZ': '11', 'CANTABRIA': '39',
       'CASTELLÓN': '12', 'CIUDAD REAL': '13', 'CÓRDOBA': '14', 'A CORUÑA': '15', 'CUENCA': '16', 'GIPUZKOA': '20', 'GIRONA': '17',
       'GRANADA': '18', 'GUADALAJARA': '19', 'HUELVA': '21', 'HUESCA': '22', 'JAÉN': '23', 'LEÓN': '24', 'LLEIDA': '25', 'LUGO': '27',
       'MADRID': '28', 'MÁLAGA': '29', 'MURCIA': '30', 'NAVARRA': '31', 'OURENSE': '32', 'PALENCIA': '34', 'LAS PALMAS': '35',
       'PONTEVEDRA': '36', 'LA RIOJA': '26', 'SALAMANCA': '37', 'SANTA CRUZ DE TENERIFE': '38', 'SEGOVIA': '40', 'SEVILLA': '41',
       'SORIA': '42', 'TARRAGONA': '43', 'TERUEL': '44', 'TOLEDO': '45', 'VALENCIA': '46', 'VALLADOLID': '47', 'ZAMORA': '49',
       'ZARAGOZA': '50', 'CEUTA': '51', 'MELILLA': '52'}

SIG2K = {'PP': 'pp', 'UPN-PP': 'upnpp', 'PSOE': 'psoe', 'PSC': 'psoe', 'PSDEG-PSOE': 'psoe', 'PSE-EE (PSOE)': 'psoe', 'PSN-PSOE': 'psoe',
         'PSIB-PSOE': 'psoe', 'VOX': 'vox', 'PODEMOS': 'podemos', 'PAZ, CASA Y TRABAJO': 'podemos', 'FA': 'fa',
         'FRENTE AMPLIO-FRONTE AMPLA': 'fa', 'FRENTE AMPLIO-FRONTE ZABALA': 'fa', 'FRENTE AMPLIO – FRONTE ZABALA': 'fa',
         'COMUNS-FRONT AMPLI': 'fa', 'CHA-IU-MS-FRENTE AMPLIO': 'fa', 'ARAMÉS-EU-MS': 'fa',
         'COMPROMIS-EUPV-PODEM-ERPV': 'compromis', 'COMPROMÍS-EUPV-PODEM-ERPV': 'compromis', 'NC-BC, PODEMOS, IU, SUMAR': 'upc',
         'ERC': 'erc', 'JXCAT': 'junts', 'EH BILDU': 'bildu', 'EH-BILDU': 'bildu', 'EAJ-PNV': 'pnv', 'BNG': 'bng',
         '1.ºCAN-CCA': 'cc', 'CCA-1.ºCAN': 'cc', 'ADELANTE ANDALUCÍA': 'aa', 'GEROA BAI': 'gbai', 'TERUEL EXISTE': 'texiste', 'SY': 'sy',
         'SALF': 'salf', 'D21': 'd21', 'FO': 'fo', 'FRENTE OBRERO': 'fo', 'PACMA': 'pacma', 'MUNDO+JUSTO': 'mundo', 'PUM+J': 'mundo',
         'PCTE': 'pcte', 'PCTE/ELAK': 'pcte', 'PCTC': 'pcte', 'PCTG': 'pcte', 'PCPC': 'pcpc', 'FE DE LAS JONS': 'fe',
         'ESCAÑOS EN BLANCO': 'eb', 'ALHORA': 'alhora', 'CNV': 'cnv', 'D.R.G': 'drago', 'LIB': 'lib', 'F8': 'f8',
         'PARTIDO AUTÓNOMOS': 'autonomos', '29': 'am', '3E': '3e', 'UC': 'uc', 'IPAL': 'ipal', 'J.U.E.X.': 'juex', 'NEX': 'nex',
         'PUEDE': 'puede', 'PDSJE': 'pdsje', 'P ALANTRE': 'alantre', 'PREPAL': 'prepal', 'PANCAL-URCI': 'pancal', 'FIA': 'fia',
         'AGENDA VALENCIANA': 'agenda', 'RRB': 'rrb', 'VLC': 'vlc', 'IE': 'ie', 'PH': 'ph', 'JL': 'jl', 'PFAC': 'pfac',
         'EGUZKILORE': 'eguzki', 'JOSÉ MARÍA CALVO GUERRA': 'calvo'}

CAT, PV, GAL = ['08', '17', '25', '43'], ['01', '20', '48'], ['15', '27', '32', '36']
FA_NOMBRE = {'FRENTE AMPLIO': ('Frente Amplio', ''), 'FRENTE AMPLIO ANDALUZ': ('Frente Amplio Andaluz', ''),
             'FRENTE AMPLIU POR ASTURIES': ('Frente Ampliu por Asturies', ''), 'FRONTE AMPLA': ('Fronte Ampla', ''),
             'FRENTE AMPLIO-FRONTE AMPLA': ('Frente Amplio-Fronte Ampla', ''), 'FRENTE AMPLIO-FRONTE ZABALA': ('Frente Amplio-Fronte Zabala', ''),
             'FRENTE AMPLIO – FRONTE ZABALA': ('Frente Amplio-Fronte Zabala', ''), 'COMUNS-FRONT AMPLI': ('Comuns-Front Ampli', ''),
             'CHUNTA ARAGONESISTA-FRENTE AMPLIO ARAGÓN': ('Chunta Aragonesista-Frente Amplio Aragón', 'CHA, IU y Movimiento Sumar'),
             'ARAMÉS-FRONT AMPLI': ('AraMés-Front Ampli', 'Ara Més, Esquerra Unida y Movimiento Sumar')}
PSOE_NOMBRE = {'PARTIDO SOCIALISTA DE CÁCERES': 'Partido Socialista de Cáceres', 'PARTIDO SOCIALISTA DE HUELVA': 'Partido Socialista de Huelva',
               'PARTIDO SOCIALISTA DE SANTA CRUZ DE TENERIFE': 'Partido Socialista de Santa Cruz de Tenerife'}

def etiqueta(k, p, sig, nombre_boe):
    """(siglas or short name in bold, full name in grey) for one candidacy."""
    if k == 'psoe':
        if p in CAT: return 'PSC-PSOE', 'Partit dels Socialistes de Catalunya'
        if p in GAL: return 'PSdeG-PSOE', 'Partido dos Socialistas de Galicia'
        if p in PV: return 'PSE-EE (PSOE)', 'Partido Socialista de Euskadi-Euskadiko Ezkerra'
        if p == '31': return 'PSN-PSOE', 'Partido Socialista de Navarra'
        if p == '07': return 'PSIB-PSOE', 'Partido Socialista de las Islas Baleares'
        return 'PSOE', PSOE_NOMBRE.get(nombre_boe, 'Partido Socialista Obrero Español')
    if k == 'fa':
        n = nombre_boe or 'FRENTE AMPLIO'
        if sig in ('FRENTE AMPLIO-FRONTE AMPLA', 'FRENTE AMPLIO-FRONTE ZABALA', 'FRENTE AMPLIO – FRONTE ZABALA', 'COMUNS-FRONT AMPLI'):
            n = sig
        elif sig == 'CHA-IU-MS-FRENTE AMPLIO':
            n = 'CHUNTA ARAGONESISTA-FRENTE AMPLIO ARAGÓN'
        elif sig == 'ARAMÉS-EU-MS':
            n = 'ARAMÉS-FRONT AMPLI'
        return FA_NOMBRE[n]
    if k == 'podemos':
        return ('Podemos', 'Podemos (Paz, Casa y Trabajo)') if p == '33' else ('Podemos', '')
    if k == 'pcte':
        if p in PV: return 'PCTE/ELAK', 'Partido Comunista de los Trabajadores de Euskadi'
        if p in CAT: return 'PCTC', 'Partit Comunista dels Treballadors de Catalunya'
        if p in GAL: return 'PCTG', 'Partido Comunista dos Traballadores da Galiza'
        return 'PCTE', 'Partido Comunista de los Trabajadores de España'
    if k == 'mundo':
        return ('Por un Mundo Máis Xusto', '') if p == '32' else ('Por un Mundo Más Justo', '')
    if k == 'pacma':
        return ('PACMA', 'Partit Animalista amb el Medi Ambient') if nombre_boe == 'PARTIT ANIMALISTA AMB EL MEDI AMBIENT' else ('PACMA', 'Partido Animalista con el Medio Ambiente')
    if k == 'pp':
        return ('PP', 'Partit Popular/Partido Popular') if p in CAT else ('PP', 'Partido Popular')
    if k == 'cc':
        return ('Primero Canarias-CC', 'Municipalistas Primero Canarias-Coalición Canaria') if p == '35' else ('CC-Primero Canarias', 'Coalición Canaria-Municipalistas Primero Canarias')
    return {
        'upnpp': ('UPN-PP', 'Unión del Pueblo Navarro en coalición con el Partido Popular'), 'vox': ('Vox', ''),
        'compromis': ('Compromís: Front Valencià', 'Compromís, EUPV, Podem y ERPV'), 'upc': ('Unidad del Pueblo Canario', 'Nueva Canarias-BC, Podemos, IU y Sumar'),
        'erc': ('ERC', 'Esquerra Republicana de Catalunya'), 'junts': ('Junts', 'Junts per Catalunya'), 'bildu': ('EH Bildu', 'Euskal Herria Bildu'),
        'pnv': ('EAJ-PNV', 'Partido Nacionalista Vasco'), 'bng': ('BNG', 'Bloque Nacionalista Galego'), 'aa': ('Adelante Andalucía', ''),
        'gbai': ('Geroa Bai', ''), 'texiste': ('Teruel Existe', ''), 'sy': ('Soria ¡Ya!', ''), 'salf': ('SALF', 'Se Acabó La Fiesta'),
        'd21': ('D21', 'Democracia para el Siglo 21, con Ciudadanos y UCIN'), 'fo': ('Frente Obrero', ''),
        'pcpc': ('PCPC', 'Partido Comunista del Pueblo Canario'), 'fe': ('FE de las JONS', 'Falange Española de las JONS'),
        'eb': ('Escaños en Blanco', 'Escaños en Blanco para dejar escaños vacíos'), 'alhora': ('Alhora', ''), 'cnv': ('Convergents', ''),
        'drago': ('Drago Canarias', 'Partido Drago Canarias'), 'lib': ('Liberación Canaria', ''), 'f8': ('Feminism8', ''),
        'autonomos': ('Partido Autónomos', ''), 'am': ('Alternativa Malagueña', ''), '3e': ('Tercera Edad en Acción', ''),
        'uc': ('Unión Cartaginense', ''), 'ipal': ('IPAL', 'Izquierda por Almería'), 'juex': ('JUEX', 'Juntos por Extremadura'),
        'nex': ('NEX', 'Nuevo Extremeñismo-Adelante Extremadura'), 'puede': ('PUEDE', 'Partido Unionista Estado de España'),
        'pdsje': ('PDSJE', 'Partido Demócrata Social Jubilados Europeos'), 'alantre': ('Proyecto Alantre', ''),
        'prepal': ('PREPAL', 'Partido Regionalista del País Leonés'), 'pancal': ('PANCAL-URCI', 'Partido Nacionalista de Castilla y León-Unión Reformista Ciudadana'),
        'fia': ('FIA', 'Federación de los Independientes de Aragón'), 'agenda': ('Agenda Valenciana', ''), 'rrb': ('Renacer Renàixer', ''),
        'vlc': ('Valencia Unida', ''), 'ie': ('Iustitia Europa', ''), 'ph': ('Partido Humanista', ''), 'jl': ('Justicia y Ley', ''),
        'pfac': ('Feministas al Congreso', ''), 'eguzki': ('Eguzkilore', ''), 'calvo': ('José María Calvo Guerra', ''),
    }[k]

FAMILIA = {'pp': 'pp', 'upnpp': 'upn', 'psoe': 'psoe', 'vox': 'vox', 'fa': 'sumar', 'compromis': 'compromis', 'upc': 'nc', 'erc': 'erc',
           'junts': 'junts', 'bildu': 'bildu', 'pnv': 'pnv', 'podemos': 'podemos', 'bng': 'bng', 'cc': 'cc', 'aa': 'aa', 'gbai': 'gbai',
           'texiste': 'texiste'}
# Order: first the candidacies of the parties with deputies in the outgoing Congress, from more to fewer; then the rest A-Z.
RANGO = ['pp', 'upnpp', 'psoe', 'vox', 'fa', 'compromis', 'upc', 'erc', 'junts', 'bildu', 'pnv', 'podemos', 'bng', 'cc']
NOTA_LISTA = {('09', 'pcte'): 'inadmitida por la junta electoral el 27 de octubre', ('29', 'calvo'): 'un solo candidato'}
NOTAS = {'44': ('No se presentan Frente Amplio (Chunta Aragonesista renunció para no dividir el voto), Aragón Existe ni Izquierda Unida, '
                'que no pudo presentar lista.',
                [['elDiario.es Aragón, 21-10-2026', 'https://www.eldiario.es/aragon/politica/cha-frente-amplio-renuncian-presentarse-congreso-teruel-evitar-dispersion-voto_1_13604566.html'],
                 ['elDiario.es Aragón (Aragón Existe)', 'https://www.eldiario.es/aragon/politica/aragon-existe-renuncia-presentar-lista-zaragoza-huesca-29n-centrarse-elecciones-municipales_1_13606349.html'],
                 ['elDiario.es Aragón (IU)', 'https://www.eldiario.es/aragon/politica/iu-renuncia-presentar-lista-teruel-29n-motivos-legales-criticas-cha-no-hecho-posible_1_13609969.html']])}

def plano(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

out, cuenta = {}, Counter()
for nombre_prov, filas in boe:
    p = INE[nombre_prov.upper()]
    listas = []
    for f in filas:
        sig, cab = f[0], f[1]
        nombre_boe = next((x for x in f[2:] if x != '#0'), None)
        k = SIG2K[sig.upper()]
        s, n = etiqueta(k, p, sig, nombre_boe)
        e = {'k': k, 's': s}
        if n:
            e['n'] = n
        if k in FAMILIA:
            e['f'] = FAMILIA[k]
        if cab:
            e['c'] = cab
        if (p, k) in NOTA_LISTA:
            e['nota'] = NOTA_LISTA[(p, k)]
        listas.append(e)
        cuenta[k] += 1
    listas.sort(key=lambda e: (RANGO.index(e['k']), '') if e['k'] in RANGO else (len(RANGO), plano(e['s'])))
    assert len({e['k'] for e in listas}) == len(listas), p
    d = {'listas': listas}
    if p in NOTAS:
        d['nota'], d['fuentes'] = NOTAS[p]
    out[p] = d

assert len(out) == 52
json.dump(dict(sorted(out.items())), open(os.path.join(HERE, 'provincias_cand.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(sum(len(v['listas']) for v in out.values()), 'candidaturas en', len(out), 'circunscripciones')
print({k: cuenta[k] for k in ('pp', 'upnpp', 'psoe', 'vox', 'fa', 'podemos', 'salf', 'fo', 'pacma', 'pcte', 'mundo', 'eb', 'fe', 'd21', 'aa', 'drago')})
sin = lambda k: sorted(p for p, v in out.items() if k not in {e['k'] for e in v['listas']})
print('sin Podemos:', sin('podemos')); print('sin SALF:', sin('salf')); print('sin FA:', sin('fa')); print('sin FO:', sin('fo'))
fa = Counter((p, e['s']) for p, v in out.items() for e in v['listas'] if e['k'] == 'fa')
print('nombres FA:', sorted({(s) for (_, s) in fa}), {s: sorted(p for (p, s2) in fa if s2 == s) for s in {s for (_, s) in fa} if s != 'Frente Amplio'})
