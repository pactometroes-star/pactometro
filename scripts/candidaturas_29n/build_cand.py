# Uso: python3 build_cand.py → escribe provincias_cand.json, que va en data/candidaturas.json → "provincias".
# datos_boe_1.py: candidaturas de 18 provincias leídas en el BOE (y en El Español / Demócrata, que lo reproducen).
# porprov_repo.json: siglas de las candidaturas de cada provincia según una lectura automática del mismo BOE
# (github.com/paablofraga4/comparador_partidos_politicos_espana, rama boe/BOE-A-2026-22607), contrastada con la anterior.
# Builds the per-province Congress candidacies (BOE-A-2026-22607, 28-10-2026) for data/candidaturas.json.
# Presence per province: BOE (read directly for 18 provinces) cross-checked with an automated parse of the same BOE
# (porprov_repo.json) and with press reproductions; heads of list from the BOE or BOE-based press, or (flag 'a')
# as announced by the party.
import json, re, sys, unicodedata, os
sys.path.insert(0, os.path.dirname(__file__))
from datos_boe_1 import P as BOE_P

HERE = os.path.dirname(__file__)
repo = json.load(open(os.path.join(HERE, 'porprov_repo.json'), encoding='utf-8'))

SLUG = {'alava': '01', 'albacete': '02', 'alicante': '03', 'almeria': '04', 'avila': '05', 'badajoz': '06', 'illes-balears': '07',
        'barcelona': '08', 'burgos': '09', 'caceres': '10', 'cadiz': '11', 'castellon': '12', 'ciudad-real': '13', 'cordoba': '14',
        'a-coruna': '15', 'cuenca': '16', 'girona': '17', 'granada': '18', 'guadalajara': '19', 'gipuzkoa': '20', 'huelva': '21',
        'huesca': '22', 'jaen': '23', 'leon': '24', 'lleida': '25', 'la-rioja': '26', 'lugo': '27', 'madrid': '28', 'malaga': '29',
        'murcia': '30', 'navarra': '31', 'ourense': '32', 'asturias': '33', 'palencia': '34', 'las-palmas': '35', 'pontevedra': '36',
        'salamanca': '37', 'santa-cruz-de-tenerife': '38', 'cantabria': '39', 'segovia': '40', 'sevilla': '41', 'soria': '42',
        'tarragona': '43', 'teruel': '44', 'toledo': '45', 'valencia': '46', 'valladolid': '47', 'bizkaia': '48', 'zamora': '49',
        'zaragoza': '50', 'ceuta': '51', 'melilla': '52'}
assert len(SLUG) == 52 and set(SLUG) == set(repo), set(SLUG) ^ set(repo)
# lines of the BOE the automated parse could not read (listed in its report): add them
EXTRA = {'31': ['EGUZKILORE', 'GEROA BAI', 'VOX', 'PODEMOS', 'FRENTE AMPLIO-FRONTE ZABALA'], '26': ['VOX', 'PODEMOS'], '51': ['FO']}

SIG2K = {'PP': 'pp', 'UPN-PP': 'upnpp', 'PSOE': 'psoe', 'PSC': 'psoe', 'PSDEG-PSOE': 'psoe', 'PSE-EE (PSOE)': 'psoe', 'PSN-PSOE': 'psoe',
         'PSIB-PSOE': 'psoe', 'VOX': 'vox', 'PODEMOS': 'podemos', 'PAZ, CASA Y TRABAJO': 'podemos', 'FA': 'fa',
         'FRENTE AMPLIO-FRONTE AMPLA': 'fa', 'FRENTE AMPLIO-FRONTE ZABALA': 'fa', 'COMUNS-FRONT AMPLI': 'fa', 'CHA-IU-MS-FRENTE AMPLIO': 'fa',
         'ARAMÉS-EU-MS': 'fa', 'COMPROMIS-EUPV-PODEM-ERPV': 'compromis', 'COMPROMÍS-EUPV-PODEM-ERPV': 'compromis',
         'NC-BC, PODEMOS, IU, SUMAR': 'upc', 'ERC': 'erc', 'JXCAT': 'junts', 'EH BILDU': 'bildu', 'EH-BILDU': 'bildu', 'EAJ-PNV': 'pnv',
         'BNG': 'bng', '1.OCAN-CCA': 'cc', 'CCA-1.OCAN': 'cc', 'ADELANTE ANDALUCÍA': 'aa', 'GEROA BAI': 'gbai', 'TERUEL EXISTE': 'texiste',
         'SY': 'sy', 'SORIA ¡YA!': 'sy', 'SALF': 'salf', 'D21': 'd21', 'FO': 'fo', 'PACMA': 'pacma', 'MUNDO+JUSTO': 'mundo', 'PUM+J': 'mundo',
         'PCTE': 'pcte', 'PCTE/ELAK': 'pcte', 'PCTC': 'pcte', 'PCTG': 'pcte', 'PCPC': 'pcpc', 'FE DE LAS JONS': 'fe', 'FALANGE': 'fe',
         'ESCAÑOS EN BLANCO': 'eb', 'ALHORA': 'alhora', 'CNV': 'cnv', 'D.R.G': 'drago', 'LIB': 'lib', 'F8': 'f8',
         'PARTIDO AUTÓNOMOS': 'autonomos', '29': 'am', '3E': '3e', 'UC': 'uc', 'IPAL': 'ipal', 'J.U.E.X.': 'juex', 'NEX': 'nex',
         'PUEDE': 'puede', 'PDSJE': 'pdsje', 'P ALANTRE': 'alantre', 'PROYECTO ALANTRE': 'alantre', 'PREPAL': 'prepal',
         'PANCAL-URCI': 'pancal', 'FIA': 'fia', 'AGENDA VALENCIANA': 'agenda', 'RRB': 'rrb', 'VLC': 'vlc', 'IE': 'ie', 'PH': 'ph',
         'JL': 'jl', 'PFAC': 'pfac', 'EGUZKILORE': 'eguzki'}

CAT, PV, GAL = ['08', '17', '25', '43'], ['01', '20', '48'], ['15', '27', '32', '36']
def etiqueta(k, p):
    """(siglas or short name shown in bold, full name shown in grey)."""
    if k == 'psoe':
        if p in CAT: return 'PSC-PSOE', 'Partit dels Socialistes de Catalunya'
        if p in GAL: return 'PSdeG-PSOE', 'Partido dos Socialistas de Galicia'
        if p in PV: return 'PSE-EE (PSOE)', 'Partido Socialista de Euskadi-Euskadiko Ezkerra'
        if p == '31': return 'PSN-PSOE', 'Partido Socialista de Navarra'
        if p == '07': return 'PSIB-PSOE', 'Partit Socialista de les Illes Balears'
        return 'PSOE', 'Partido Socialista Obrero Español'
    if k == 'fa':
        if p == '33': return 'Frente Ampliu por Asturies', 'Frente Amplio en Asturias'
        if p in PV or p == '31': return 'Frente Amplio-Fronte Zabala', ''
        if p in GAL: return 'Frente Amplio-Fronte Ampla', ''
        if p in ('08', '17', '25'): return 'Comuns-Front Ampli', 'Frente Amplio en Cataluña'
        if p in ('22', '50'): return 'Chunta Aragonesista-Frente Amplio Aragón', 'CHA, IU y Movimiento Sumar'
        if p == '07': return 'AraMés-Front Ampli', 'Ara Més, Esquerra Unida y Movimiento Sumar'
        return 'Frente Amplio', ''
    if k == 'podemos':
        return ('Podemos', 'Podemos (Paz, Casa y Trabajo)') if p == '33' else ('Podemos', '')
    if k == 'pcte':
        if p in PV: return 'PCTE/ELAK', 'Partido Comunista de los Trabajadores de Euskadi'
        if p in CAT: return 'PCTC', 'Partit Comunista dels Treballadors de Catalunya'
        if p in GAL: return 'PCTG', 'Partido Comunista dos Traballadores da Galiza'
        return 'PCTE', 'Partido Comunista de los Trabajadores de España'
    if k == 'mundo':
        return ('Por un Mundo Máis Xusto', '') if p == '32' else ('Por un Mundo Más Justo', '')
    if k == 'cc':
        return ('Primero Canarias-CC', 'Municipalistas Primero Canarias-Coalición Canaria') if p == '35' else ('CC-Primero Canarias', 'Coalición Canaria-Municipalistas Primero Canarias')
    return {
        'pp': ('PP', 'Partido Popular'), 'upnpp': ('UPN-PP', 'Unión del Pueblo Navarro en coalición con el Partido Popular'), 'vox': ('Vox', ''),
        'compromis': ('Compromís: Front Valencià', 'Compromís, EUPV, Podem y ERPV'), 'upc': ('Unidad del Pueblo Canario', 'Nueva Canarias-BC, Podemos, IU y Sumar'),
        'erc': ('ERC', 'Esquerra Republicana de Catalunya'), 'junts': ('Junts', 'Junts per Catalunya'), 'bildu': ('EH Bildu', 'Euskal Herria Bildu'),
        'pnv': ('EAJ-PNV', 'Partido Nacionalista Vasco'), 'bng': ('BNG', 'Bloque Nacionalista Galego'), 'aa': ('Adelante Andalucía', ''),
        'gbai': ('Geroa Bai', ''), 'texiste': ('Teruel Existe', ''), 'sy': ('Soria ¡Ya!', ''), 'salf': ('SALF', 'Se Acabó La Fiesta'),
        'd21': ('D21', 'Democracia para el Siglo 21, con Ciudadanos y UCIN'), 'fo': ('Frente Obrero', ''),
        'pacma': ('PACMA', 'Partido Animalista con el Medio Ambiente'), 'pcpc': ('PCPC', 'Partido Comunista del Pueblo Canario'),
        'fe': ('FE de las JONS', 'Falange Española de las JONS'), 'eb': ('Escaños en Blanco', ''), 'alhora': ('Alhora', ''),
        'cnv': ('Convergents', ''), 'drago': ('Drago Canarias', ''), 'lib': ('Liberación Canaria', ''), 'f8': ('F8', 'Feminism8'),
        'autonomos': ('Partido Autónomos', ''), 'am': ('Alternativa Malagueña', ''), '3e': ('Tercera Edad en Acción', ''),
        'uc': ('Unión Cartaginense', ''), 'ipal': ('IPAL', 'Izquierda por Almería'), 'juex': ('JUEX', 'Juntos por Extremadura'),
        'nex': ('NEX', 'Nuevo Extremeñismo-Adelante Extremadura'), 'puede': ('PUEDE', 'Partido Unionista Estado de España'),
        'pdsje': ('PDSJE', 'Partido Demócrata Social Jubilados Europeos'), 'alantre': ('Proyecto Alantre', ''),
        'prepal': ('PREPAL', 'Partido Regionalista del País Leonés'), 'pancal': ('PANCAL-URCI', 'Partido Nacionalista de Castilla y León-Unión Reformista Ciudadana'),
        'fia': ('FIA', 'Federación de los Independientes de Aragón'), 'agenda': ('Agenda Valenciana', ''), 'rrb': ('Renacer Renàixer', ''),
        'vlc': ('Valencia Unida', ''), 'ie': ('Iustitia Europa', ''), 'ph': ('Partido Humanista', ''), 'jl': ('Justicia y Ley', ''),
        'pfac': ('Feministas al Congreso', ''), 'eguzki': ('Eguzkilore', ''),
    }[k]

FAMILIA = {'pp': 'pp', 'upnpp': 'upn', 'psoe': 'psoe', 'vox': 'vox', 'fa': 'sumar', 'compromis': 'compromis', 'upc': 'nc', 'erc': 'erc',
           'junts': 'junts', 'bildu': 'bildu', 'pnv': 'pnv', 'podemos': 'podemos', 'bng': 'bng', 'cc': 'cc', 'aa': 'aa', 'gbai': 'gbai',
           'texiste': 'texiste'}
# Order shown: first the candidacies of the parties with deputies in the outgoing Congress, from more to fewer; then the rest A-Z.
RANGO = ['pp', 'upnpp', 'psoe', 'vox', 'fa', 'compromis', 'upc', 'erc', 'junts', 'bildu', 'pnv', 'podemos', 'bng', 'cc']

def plano(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

# ---------------------------------------------------------------- heads of list
# 'a' = announced by the party (not yet checked against the BOE)
A = 'a'
CAB = {}
FUENTES = {}
def cab(p, fuente, **kw):
    CAB.setdefault(p, {}).update(kw)
    if fuente and fuente not in FUENTES.setdefault(p, []):
        FUENTES[p].append(fuente)

# 1) read directly from the BOE (or BOE as reproduced by El Español / Demócrata)
SRC_EE = ['El Español, 28-10-2026', 'https://www.elespanol.com/castilla-y-leon/region/20261028/partidos-presentan-elecciones-generales-castilla-leon-candidaturas-completas/1003744437571_0.html']
SRC_DEM_MAD = ['Demócrata, 28-10-2026', 'https://www.democrata.es/elecciones-generales-espana/herramientas/candidaturas']
boe_keys = {}
for p, (src, filas) in BOE_P.items():
    ks = {}
    for f in filas:
        sig, cabeza = f[0], f[2]
        k = SIG2K[sig.upper()]
        if cabeza:
            ks[k] = (cabeza, None)
        else:
            ks.setdefault(k, (None, None))
    boe_keys[p] = set(ks)
    for k, (c, fl) in ks.items():
        if c:
            CAB.setdefault(p, {})[k] = (c, fl)
    if src.endswith('El Español'):
        FUENTES.setdefault(p, []).append(SRC_EE)
    elif 'Demócrata' in src:
        FUENTES.setdefault(p, []).append(SRC_DEM_MAD)

# 2) press reproducing the BOE of 28-10-2026
S = lambda t, u: [t, u]
F_VAL = S('Diario de Alicante, 28-10-2026', 'https://diariodealicante.net/candidaturas-congreso-senado-valencia-29n/')
cab('46', F_VAL, psoe=('Pilar Bernabé García', None), fo=('Carmen López', None), pcte=('Gabriel Lorente', None), vox=('Ignacio Gil Lázaro', None),
    compromis=('Àgueda Micó', None), salf=('Kevin Pérez', None), pacma=('Irene Mora', None), autonomos=('Roberto Pradas', None),
    vlc=('Vicente González-Lizondo Sánchez', None), rrb=('Miguel Ramón Martí', None), fe=('Alejo Herrero', None), pp=('María José Catalá', None),
    mundo=('Marta Calatayud', None), agenda=('José Ramón Chirivella', None))
F_CR = S('Lanza, 28-10-2026', 'https://www.lanzadigital.com/provincia/ciudad-real/presentadas-6-candidaturas-al-congreso-y-4-al-senado-por-ciudad-real-de-cara-a-las-elecciones-del-29-n/')
cab('13', F_CR, psoe=('Isabel Rodríguez García', None), fo=('Raül Abengózar Galán', None), vox=('Ricardo Chamorro Delmo', None),
    podemos=('María Isabel Ruiz García', None), pp=('María del Carmen Fúnez de Gregorio', None), fa=('Juana Caro Marín', None))
F_CLM = S('El Plural, 28-10-2026', 'https://www.elplural.com/autonomias/castilla-la-mancha/todas-listas-congreso-castilla-la-mancha-29n-44-candidatos-encabezan-papeletas_802602102')
cab('16', F_CLM, fo=('Adrián Tabasco Bonilla', None), psoe=('Luis Carlos Sahuquillo García', None), salf=('Rafael García Sáez', None),
    vox=('Ismael Iván Vélez Cipriano', None), pcte=('Alejandro Fernández Suárez', None), podemos=('José María Oviedo Oviedo', None),
    pp=('Raquel Oliver Chico', None), mundo=('Miguel Ángel Hernández Pedreño', None), pacma=('Pedro José Contreras Racionero', None),
    fa=('Francisco Javier Martínez Huerta', None))
cab('19', F_CLM, psoe=('María Jesús Merino Poyo', None), pp=('Itziar Asenjo Domínguez', None), vox=('Ángel López Maraver', None),
    fa=('Ernesto Martín Doménech', None), podemos=('Mario Javier Gallego Pareja', None), salf=('José Carlos Albares Gallego', None),
    fo=('Carlos Calvo Fernández', None), pcte=('Jorge Miguel Perucha', None), mundo=('Pedro Alfonso Cabello Albendea', None),
    fe=('Juan Francisco Durán Carralero', None))
cab('45', F_CLM, psoe=('Milagros Tolón Jaime', None), pp=('Carlos Velázquez Romo', None), vox=('Manuel Mariscal Zabala', None),
    fa=('José Alejandro Ávila Sánchez', None), podemos=('María Ángeles Castellanos Valverde', None), salf=('Antonio Cuñarro Alonso', None),
    fo=('Cristina Martínez Ortega', None), fe=('José Ramón Jarones Martín-Aragón', None), pcte=('Miguel Ángel Alonso García-Largo', None))
F_CO = S('Cordópolis, 28-10-2026', 'https://cordopolis.eldiario.es/cordoba-hoy/sociedad/son-listas-electorales-partidos-presentan-cordoba-29n_1_13620448.html')
cab('14', F_CO, psoe=('Alberto Mayoral de Lamo', None), fo=('Ángel Molina Ruiz', None), aa=('María del Carmen Sánchez Solís', None),
    salf=('Eladio Barrado Prieto', None), vox=('José Ramírez del Río', None), pcte=('Ana Isabel Bastida Burgos', None),
    pacma=('Patricia María García Carmona', None), fe=('Manuel Chacón Rodríguez', None), pp=('Lorena Guerra Sánchez', None),
    fa=('Sebastián Pérez Gallardo', None), podemos=('Ana Belén Calzada Hombrado', None), eb=('Carmen María Valderrama Crespo', None))
F_GR = S('Ahora Granada, 28-10-2026', 'https://www.ahoragranada.com/noticias/todas-las-candidaturas-por-granada-al-congreso-y-al-senado-para-el-29n/')
cab('18', F_GR, pp=('Jorge Saavedra Requena', None), psoe=('María José Sánchez Sánchez', None), vox=('Jacobo González-Robatto Perote', None),
    fa=('Jesús Fernández Martín', None), podemos=('Alejandra Durán Parra', None), aa=('María Alcantud López', None),
    pacma=('Débora Godoy Izquierdo', None), fo=('Raúl Domínguez Rincón', None), pcte=('Adrián García Barbarroja', None),
    salf=('Rosa Alonso Domínguez', None), mundo=('Augustin Marie Ndour Ndong', None))
F_NOS = S('Nós Diario, 28-10-2026', 'https://www.nosdiario.gal/articulo/internacional/consulte-aqui-candidaturas-presentadas-galiza-concorrer-eleccions-do-29-n/20261028100715270391.html')
cab('15', F_NOS, pp=('Miguel Ángel Tellado Figueira', None), psoe=('Obdulia Taboadela', None), bng=('Néstor Rego Candamil', None),
    fa=('Xosé Lois Piñeiro García', None), podemos=('Isabel Faraldo Calvo', None), vox=('Manuel Fuentes Lamas', None))
cab('27', F_NOS, pp=('Francisco José Conde López', None), psoe=('Patricia Otero Rodríguez', None), bng=('Olalla Rodil Fernández', None),
    fa=('Reyes Rodríguez García', None), vox=('Jesús Primitivo Rodríguez González', None))
cab('32', F_NOS, pp=('Ana Belén Vázquez Blanco', None), psoe=('María del Carmen Rodríguez Dacosta', None), bng=('Noa Presas Bergantiños', None),
    fa=('Juan Diego Conde Eguileta', None), podemos=('Antonio José Naval Calviño', None), vox=('María Jesús Morenza Fernández', None))
cab('36', F_NOS, pp=('Julio García Comesaña', None), psoe=('Abel Fermín Losada Álvarez', None), bng=('María Carme da Silva Méndez', None),
    fa=('Gloria Alonso Domínguez', None), podemos=('Lucas Meda Herbojo', None), vox=('Álvaro José Díaz-Mella López', None),
    salf=('David Díaz Garrido', None))
F_LU = S('El Progreso, 26-10-2026', 'https://elprogreso.es/articulo/lugo/ocho-candidaturas-aspiran-congreso-provincia-comicios-29-n/202610262148192009527.html')
cab('27', F_LU, podemos=('Ximena Cheda Tuya', A), salf=('María Ferreiro', A))
F_NA = S('Navarra.com, 28-10-2026', 'https://navarra.okdiario.com/articulo/politica/todas-listas-electorales-navarra-29-n-candidatos-cada-partido-congreso-senado/20261028085307665743.html')
cab('31', F_NA, upnpp=('Leticia San Martín Rodríguez', None), psoe=('Elma Saiz Delgado', None), bildu=('Eneka Maiz Ulaiar', None),
    gbai=('Pablo Azcona Molinet', None), vox=('María Perpetuo Socorro Sada Ballesteros', None), fa=('Javier Ibáñez Orayen', None),
    podemos=('Virginia Alonso Aparicio', None), salf=('Lidia Martínez Aranguibel', None), fo=('Nerea León Miranda', None),
    pacma=('Manuel Piñar Bautista', None), mundo=('José Antonio Aparicio Martín', None), eguzki=('Francisco Javier Pérez Cueva', None))
F_EUS = S('Europa Press en Demócrata, 28-10-2026', 'https://www.democrata.es/euskadi/euskadi-publica-las-listas-provisionales-15-candidaturas-por-alava-12-por-bizkaia-y-11-por-gipuzkoa-al-congreso/')
cab('48', F_EUS, pnv=('Idoia Sagastizabal', None), psoe=('Patxi López', None), bildu=('Oskar Matute', None), pp=('Esther Martínez', None),
    vox=('Marco Antonio Moreno Asla', None), podemos=('José Manuel de Pablos', None), fa=('Lander Martínez', None))
cab('20', F_EUS, pnv=('Maribel Vaquero', None), psoe=('Rafaela Romero', None), bildu=('Oihana Etxebarrieta', None), pp=('Jon Echeverría', None),
    vox=('Juan de Dios Dávila', None), podemos=('Maite Gartzia', None), fa=('Rosa Rubio', None))
F_CE = S('Ceuta TV, 28-10-2026', 'https://www.ceutatv.com/politica/seis-candidaturas-congreso-cuatro-senado-conozca-aqui-quienes-concurriran-elecciones-29n/20261028094510259192.html')
cab('51', F_CE, pp=('Rafael Martínez Peñalver Mateos', None), psoe=('Luis Manuel Tovar Gálvez', None), vox=('Ana Belén Cifuentes Cánovas', None),
    podemos=('Ramón Rodríguez Casaubón', None), salf=('Carlos Pavón Fumado', None), fo=('Manuel Marcos Vidal Tejada', None))
F_CANT = S('Europa Press en Cantabria Liberal, 28-10-2026', 'https://www.cantabrialiberal.com/cantabria/siete-partidos-presentan-candidaturas-en-cantabria-a-las-elecciones-generales,851502.html')
cab('39', F_CANT, pp=('Isabel Urrutia', None), psoe=('Susana Herrán', None), fa=('Carmen Martín', None), vox=('Emilio del Valle', None),
    podemos=('Pablo Gómez', None), pcte=('Pablo Isidro Gómez', None), fo=('Raúl Díaz', None))

# 3) announced by the parties (to be checked against the proclaimed lists)
F_PP = S('Demócrata, 26-10-2026 (cabezas de lista del PP)', 'https://www.democrata.es/en/general-elections-spain/feijoo-rushes-the-closure-of-the-pp-lists-for-the-29n-these-are-the-52-heads-of-candidacy/')
F_VOX = S('El Debate, 21-10-2026 (cabezas de lista de Vox)', 'https://www.eldebate.com/espana/20261021/estos-son-cabezas-lista-vox-29n_472379.html')
F_AND = S('101TV (cabezas de lista en Andalucía)', 'https://www.101tv.es/andalucia/quien-es-quien-en-las-listas-andaluzas-para-el-29n-los-candidatos-al-congreso-provincia-a-provincia')
F_JA = S('Diario Jaén, 28-10-2026', 'https://www.diariojaen.es/jaen/las-fuerzas-politicas-cierran-sus-candidaturas-en-jaen-para-el-29n-EB11676828')
F_CAN = S('Canarias7, 27-10-2026', 'https://www.canarias7.es/elecciones/generales/elecciones-generales-2026-lista-partidos-candidatos-canarias-20261027175409-nt.html')
F_CAN2 = S('Canarias Ahora, 28-10-2026', 'https://www.eldiario.es/canariasahora/politica/son-candidatos-canarias-elecciones-generales-2026-listas-congreso-senado_1_13618307.html')
F_TGN = S('Canal 21 Ebre', 'https://www.canal21ebre.com/llistes-catalanes-eleccions-generals-29n-2026/')
PP = {'11': 'María José García-Pelayo', '21': 'Pilar Miranda', '29': 'Elías Bendodo', '41': 'Juan Bravo', '22': 'Ana Alós', '44': 'Alberto Herrero',
      '50': 'Rocío Dívar', '17': 'Diana Moya', '25': 'Roger Melero', '43': 'Mónica Landete', '12': 'Elena Albalat', '10': 'Cristina Teniente',
      '30': 'Mirian Guardiola', '26': 'Cuca Gamarra', '52': 'Sofía Acedo', '35': 'Sergio Ramos', '38': 'Gustavo González de Vega'}
VOX = {'11': 'Blanca Armario González', '21': 'Tomás Fernández Ríos', '29': 'Carlos Hernández Quero', '41': 'María de los Reyes Romero Vilches',
       '12': 'Alberto Asarta Cuevas', '17': 'Ignasi Mulleras Vinzia', '25': 'Rafael Villafranca Mercé', '43': 'Jordi de la Fuente',
       '10': 'Marcela Reija', '22': 'Esther Blanco', '44': 'Daniel Alda', '50': 'Carmen Rouco', '26': 'Ángel Alda', '30': 'Joaquín Robles López',
       '35': 'Alberto Rodríguez Almeida', '38': 'Alejandro Gómez', '52': 'José Miguel Tasende'}
for p, n in PP.items():
    cab(p, F_PP if p not in ('35', '38', '43') else None, pp=(n, A))
for p, n in VOX.items():
    cab(p, F_VOX if p not in ('35', '38', '43') else None, vox=(n, A))
cab('11', F_AND, psoe=('José Manuel Albares', A), podemos=('Julio de la Torre', A), aa=('María Sánchez', A))
cab('21', F_AND, psoe=('Gabriel Cruz', A), podemos=('Hermes Gómez', A), aa=('Carmen Martín', A), fa=('Rebeca Martín', A))
cab('29', F_AND, psoe=('José Bernal', A), podemos=('Micaela Jiménez', A), aa=('Ana Jiménez', A))
cab('41', F_AND, psoe=('Alfonso Rodríguez Gómez de Celis', A), podemos=('Mar Cambrollé', A), aa=('Luis de los Santos', A), fa=('Enrique Santiago', A))
cab('23', F_JA, pp=('Luis Mariano Camacho', A), psoe=('Isabel Uceda', A), vox=('Francisco José Alcaraz Martos', A), fa=('Antonio Ortega', A),
    podemos=('Lola Rodríguez López', A), aa=('Silvia Cano', A))
cab('35', F_CAN, cc=('Teodoro Sosa', A), psoe=('Dolores Corujo', A), pp=('Sergio Ramos', A), upc=('Luis Campos', A), vox=('Alberto Rodríguez Almeida', A))
cab('35', F_CAN2, drago=('Héctor Morán', A))
cab('38', F_CAN, cc=('Cristina Valido', A), psoe=('José Antonio Valbuena', A), pp=('Gustavo González de Vega', A),
    upc=('María de la Soledad Collado Mirabal', A), vox=('Alejandro Gómez', A))
cab('38', F_CAN2, drago=('Alberto Rodríguez', A))
cab('43', F_TGN, psoe=('Ione Montalvo', A), erc=('Norma Pujol', A), junts=('Josep Maria Cruset', A), fa=('Ester Roca', A), pp=('Mónica Landete', A),
    vox=('Jordi de la Fuente', A))
cab('25', S('Nació Digital (Alhora en Lleida)', 'https://naciodigital.cat/lleida/politica/cristina-casol-encapcalara-la-candidatura-dalhora-a-lleida-per-a-les-eleccions-del-29-n.html'),
    alhora=('Cristina Casol', A))
cab('25', S('La Ciutat (ERC en Lleida y Tarragona)', 'https://laciutat.cat/catalunya/erc-tria-norma-pujol-tarragona-ines-granollers-lleida-eleccions-29-n_902670_102.html'),
    erc=('Inès Granollers', A))
cab('12', S('Castellón Plaza (Compromís: Front Valencià)', 'https://castellonplaza.com/castellonplaza/castellon9/compromisfront-valencia-registra-su-candidatura-al-congreso-en-castellon-encabezada-por-ignasi-garcia'),
    compromis=('Ignasi Garcia', A))
cab('12', S('El Debate (listas del PSOE en la Comunitat Valenciana)', 'https://www.eldebate.com/espana/comunidad-valenciana/20261022/candidaturas-completas-psoe-elecciones-generales-29n_472444.html'),
    psoe=('María Jiménez Román', A))
cab('30', S('Murcia Plaza (listas del PSOE, Frente Amplio y Podemos)', 'https://murciaplaza.com/murciaplaza/region/la-batalla-del-29n-se-libra-en-femenino-en-la-region-y-con-solo-dos-cartageneros-en-las-listas-de-salida'),
    psoe=('María González Veracruz', A), fa=('Penélope Luna', A), podemos=('Víctor Egío', A))
cab('10', S('La Portada de Extremadura (Podemos)', 'https://www.laportadadeextremadura.com/extremadura/podemos-presenta-a-amparo-botejara-y-alvaro-jaen-como-cabezas-de-lista-al-congreso-en-badajoz-y-caceres_9261_102.html'),
    podemos=('Álvaro Jaén', A))
cab('26', S('elDiario.es La Rioja (PSOE)', 'https://www.eldiario.es/la-rioja/candidatas-psoe-rioja-29n-repiten-garrido-congreso-andreu-senado_1_13586379.html'),
    psoe=('Elisa Garrido', A))
cab('52', S('Demócrata (PSOE de Melilla)', 'https://www.democrata.es/actualidad/riduan-moh-liderara-la-lista-del-psoe-de-melilla-al-congreso-el-29-de-noviembre/'),
    psoe=('Riduan Moh', A))
cab('22', S('Aragón Digital (PSOE en Aragón)', 'https://www.aragondigital.es/articulo/politica/fernando-beltran-cabeza-lista-psoe-zaragoza-nasarre-herminio-sancho-repiten-huesca-teruel/202610152010331015767.html'),
    psoe=('Begoña Nasarre', A))
cab('50', S('Aragón Digital (PSOE en Aragón)', 'https://www.aragondigital.es/articulo/politica/fernando-beltran-cabeza-lista-psoe-zaragoza-nasarre-herminio-sancho-repiten-huesca-teruel/202610152010331015767.html'),
    psoe=('Fernando Beltrán', A))
cab('44', S('Aragón Digital (PSOE en Aragón)', 'https://www.aragondigital.es/articulo/politica/fernando-beltran-cabeza-lista-psoe-zaragoza-nasarre-herminio-sancho-repiten-huesca-teruel/202610152010331015767.html'),
    psoe=('Herminio Sancho', A))
cab('22', S('Demócrata (CHA-Frente Amplio Aragón en Huesca)', 'https://www.democrata.es/aragon/luis-parra-y-pilar-garces-encabezan-la-lista-cha-frente-amplio-aragon-al-congreso-por-huesca/'),
    fa=('Luis Parra', A))
cab('44', S('Aragón Digital (Teruel Existe)', 'https://www.aragondigital.es/articulo/politica/tomas-guitarte-encabeza-candidatura-teruel-existe-29n-congreso-diputados/202610261127171017884.html'),
    texiste=('Tomás Guitarte', A))

NOTAS = {
    '09': 'Según El Español, la junta electoral no admitió la candidatura del PCTE.',
    '29': 'Además, según Europa Press, una agrupación de electores presentó una candidatura con un solo candidato.',
    '44': 'No se presentan Frente Amplio (Chunta Aragonesista renunció para no dividir el voto), Aragón Existe ni Izquierda Unida, que no pudo presentar lista.',
}
NOTA_LISTA = {('09', 'pcte'): 'no admitida'}

# ---------------------------------------------------------------- per province
out, problemas = {}, []
for slug_, p in sorted(SLUG.items(), key=lambda kv: kv[1]):
    sigs = list(repo[slug_]) + EXTRA.get(p, [])
    keys = []
    for s in sigs:
        k = SIG2K[s.upper()]
        if k not in keys:
            keys.append(k)
    if p in boe_keys and set(keys) != boe_keys[p]:
        problemas.append(f'{p}: repo {sorted(set(keys) - boe_keys[p])} vs BOE {sorted(boe_keys[p] - set(keys))}')
    heads = CAB.get(p, {})
    for k in heads:
        if k not in keys:
            problemas.append(f'{p}: cabeza para {k} sin candidatura')
    def orden(k):
        sig = etiqueta(k, p)[0]
        return (RANGO.index(k), '') if k in RANGO else (len(RANGO), plano(sig))
    listas = []
    for k in sorted(keys, key=orden):
        sig, nom = etiqueta(k, p)
        e = {'k': k, 's': sig}
        if nom:
            e['n'] = nom
        if k in FAMILIA:
            e['f'] = FAMILIA[k]
        c = heads.get(k)
        if c and c[0]:
            e['c'] = c[0]
            if c[1] == A:
                e['a'] = 1
        if (p, k) in NOTA_LISTA:
            e['nota'] = NOTA_LISTA[(p, k)]
        listas.append(e)
    d = {'listas': listas}
    if p in NOTAS:
        d['nota'] = NOTAS[p]
    if FUENTES.get(p):
        d['fuentes'] = FUENTES[p]
    out[p] = d

print('\n'.join(problemas) or 'sin discrepancias')
tot = sum(len(v['listas']) for v in out.values())
con = sum(1 for v in out.values() for e in v['listas'] if e.get('c'))
anun = sum(1 for v in out.values() for e in v['listas'] if e.get('a'))
print(f'{tot} candidaturas; {con} con cabeza de lista ({anun} anunciadas)')
json.dump(out, open(os.path.join(HERE, 'provincias_cand.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for p in ('31', '07', '44', '35', '17', '43', '52'):
    print(p, [(e['s'], e.get('c', '')) for e in out[p]['listas']])
