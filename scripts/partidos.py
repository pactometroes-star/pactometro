"""Party family classification and colours for pactómetro.es."""
import re, unicodedata, hashlib

# id: (short label, long label, colour)
FAMILIAS = {
    'pp':        ('PP', 'Partido Popular (antes AP/CD)', '#1d84ce'),
    'psoe':      ('PSOE', 'PSOE y federaciones (PSC, PSdeG, PSE…)', '#e1001a'),
    'vox':       ('Vox', 'Vox', '#6cc24a'),
    'sumar':     ('Sumar', 'Sumar y aliados', '#e5007e'),
    'podemos':   ('Podemos', 'Podemos y confluencias', '#6a2c70'),
    'iu':        ('IU · PCE', 'IU, PCE y federaciones (PSUC, ICV, EUPV…)', '#a6192e'),
    'cs':        ('Cs', 'Ciudadanos', '#eb6109'),
    'upyd':      ('UPyD', 'UPyD', '#c2007a'),
    'ucd':       ('UCD', 'Unión de Centro Democrático', '#1a9850'),
    'cds':       ('CDS', 'Centro Democrático y Social', '#8bc34a'),
    'ciu':       ('CiU', 'CiU / CDC / DL', '#2e3a87'),
    'junts':     ('Junts', 'Junts (JxCat, PDeCAT, JxSí)', '#3fc1b0'),
    'erc':       ('ERC', 'Esquerra Republicana', '#ffb000'),
    'cup':       ('CUP', 'CUP', '#f7e400'),
    'ac':        ('Aliança', 'Aliança Catalana', '#26324f'),
    'pnv':       ('PNV', 'EAJ-PNV', '#1d6b39'),
    'bildu':     ('EH Bildu', 'EH Bildu (antes HB, EH, Amaiur…)', '#00897b'),
    'ea':        ('EA', 'Eusko Alkartasuna', '#7cb342'),
    'ee':        ('EE', 'Euskadiko Ezkerra', '#d35400'),
    'bng':       ('BNG', 'Bloque Nacionalista Galego', '#7fc6e8'),
    'cc':        ('CC', 'Coalición Canaria (y AIC/ATI)', '#ffd200'),
    'nc':        ('NC', 'Nueva Canarias', '#5bb5a2'),
    'upn':       ('UPN', 'UPN / Navarra Suma', '#11246b'),
    'gbai':      ('Geroa Bai', 'Geroa Bai / Nafarroa Bai', '#e3591f'),
    'compromis': ('Compromís', 'Compromís (y Bloc)', '#f08a00'),
    'mm':        ('Más Madrid', 'Más Madrid / Más País', '#00a28a'),
    'mes':       ('Més', 'Més per Mallorca / Més per Menorca / PSM', '#b5367a'),
    'prc':       ('PRC', 'Partido Regionalista de Cantabria', '#c2d500'),
    'par':       ('PAR', 'Partido Aragonés', '#f4c300'),
    'cha':       ('CHA', 'Chunta Aragonesista', '#178f86'),
    'texiste':   ('Teruel Existe', 'Teruel Existe / Aragón Existe', '#2f6f4e'),
    'pa':        ('PA', 'Partido Andalucista', '#22a35f'),
    'aa':        ('Adelante And.', 'Adelante Andalucía', '#3e8e41'),
    'foro':      ('Foro', 'Foro Asturias', '#00559f'),
    'upl':       ('UPL', 'Unión del Pueblo Leonés', '#99134d'),
    'asg':       ('ASG', 'Agrupación Socialista Gomera', '#e94e1b'),
    'ahi':       ('AHI', 'Agrupación Herreña Independiente', '#8e7cc3'),
    'local':     ('Locales', 'Candidaturas locales e independientes', '#8a8f98'),
}

# muted palette for local/independent candidaturas (deterministic by name)
LOCAL_PALETTE = ['#8d6e63', '#78909c', '#a1887f', '#7e8f3a', '#5c7a99', '#9e7a4a',
                 '#6d8b74', '#8c6f8f', '#a17f6b', '#5f8a8b', '#7a7f9a', '#9a8a5b',
                 '#6f7d5c', '#8b6a6a', '#5e7f6e', '#7b6d8d']

def norm(s):
    s = (s or '').replace('\u2013', '-').replace('\u2014', '-').replace('\u00b4', "'")
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().upper()
    s = s.replace('´', "'").replace('`', "'")
    return ' '.join(s.split())

def clean_siglas(s):
    s = (s or '').strip()
    # P.S.O.E. -> PSOE, B.N.G. -> BNG, P.S.V.-P.S.O.E. -> PSV-PSOE (dots after single letters)
    s = re.sub(r'(?<=\b[A-Za-zÀ-ÿ])\.', '', s)
    return s.replace('–', '-').strip()

def _tok(s, *toks):
    for t in toks:
        if re.search(r'(^|[^A-Z0-9])' + re.escape(t) + r'([^A-Z0-9]|$)', s):
            return True
    return False

CATALUNYA = {'08', '17', '25', '43'}
VALENCIA = {'03', '12', '46'}

def familia(siglas, nombre='', prov=None):
    s = norm(siglas).replace('–', '-')
    s = re.sub(r'(?<=\b[A-Z])\.', '', s).strip()
    n = norm(nombre)
    sn = s + ' | ' + n
    # province-aware labels (2019-2023 municipal brands in Catalonia)
    if prov in CATALUNYA:
        if 'COMPROMIS MUNICIPAL' in n or s == 'CM' or s.endswith('-CM') or 'JUNTS' in s:
            return 'junts'
        if 'ACORD MUNICIPAL' in n or s == 'AM' or s.endswith('-AM') or 'ESQUERRA REPUBLICANA' in n:
            return 'erc'
        if 'CANDIDATURA DE PROGRES' in n or s == 'CP' or s.endswith('-CP'):
            return 'psoe'
        if 'ALTERNATIVA MUNICIPALISTA' in n or 'AMUNT' in s:
            return 'cup'
        if n == 'CONFLUENCIA' or s == 'C' or 'EN COMU' in sn:
            return 'podemos'
    # order matters
    if 'SUMAR' in s and not _tok(s, 'PSOE'):
        return 'sumar'
    if _tok(s, 'UPN', 'NA+') or 'NAVARRA SUMA' in n or 'UNION DEL PUEBLO NAVARRO' in n or s == 'NA+':
        return 'upn'
    if _tok(s, 'PSOE', 'PSC', 'PSDEG', 'PSDG', 'PSIB', 'PSN', 'PSPV', 'PSE', 'PS G/PSOE', 'PSE-EE') or 'SOCIALISTA OBRERO ESPANOL' in n \
            or 'SOCIALISTES DE CATALUNYA' in n or 'SOCIALISTAS DE GALICIA' in n or 'SOCIALISTAS DE EUSKADI' in n \
            or 'SOCIALISTA DE EUSKADI' in n or 'SOCIALISTA DEL PAIS VALENCIA' in n or 'SOCIALISTA DE NAVARRA' in n or _tok(n, 'PSOE'):
        if not _tok(s, 'PSA', 'PSM', 'PSUC', 'PSP') or _tok(s, 'PSOE'):
            return 'psoe'
    if s in ('PSC-CPC', 'PSC-CP') or s.startswith('PSC'):
        return 'psoe'
    if _tok(s, 'VOX'):
        return 'vox'
    if _tok(s, 'PP') or s.startswith('PP-') or s.startswith('PP+') or _tok(s, 'AP', 'AP-PDP', 'AP-PL', 'AP-PDP-UL', 'AP-PDP-PL', 'CD', 'PDP') \
            or 'PARTIDO POPULAR' in n or 'ALIANZA POPULAR' in n or 'COALICION POPULAR' in n or 'COALICION DEMOCRATICA' in n:
        if not s.startswith('PPMAJO'):
            return 'pp'
    if s in ('CS', "C'S", 'CS-', "C'S-") or s.startswith("C'S") or s.startswith('CS ') or 'CIUDADANOS-PARTIDO DE LA CIUDADANIA' in n \
            or 'CIUTADANS-PARTIT DE LA CIUTADANIA' in n or 'CIUDADANOS - PARTIDO DE LA CIUDADANIA' in n:
        return 'cs'
    if 'UPYD' in s or 'UNION PROGRESO Y DEMOCRACIA' in n:
        return 'upyd'
    if _tok(s, 'MM', 'MM-VQ', 'MAS MADRID', 'MAS PAIS') or 'MAS MADRID' in n or 'MAS PAIS' in n:
        if 'MAS MADRID' in sn or 'MAS PAIS' in sn or s.startswith('MM'):
            return 'mm'
    if 'COMPROMIS' in s and ('PODEM' in s or 'PODEMOS' in s):
        return 'podemos'
    if 'PODEMOS' in s or 'PODEM' in s or 'EN COMU' in s or s.startswith('ECP') or 'EN MAREA' in s or 'ELKARREKIN' in s \
            or 'UNIDOS PODEMOS' in n or 'UNIDAS PODEMOS' in n or 'CATCOMU' in s or s.startswith('UXE') or 'UNIDAS POR EXTREMADURA' in n \
            or 'CATSIQUEESPOT' in s or s == 'AGE' or 'UNITED WE CAN' in s or 'COMUNS' in s:
        return 'podemos'
    if 'EXTREMADURA UNIDA' in n or s in ('EU', 'PP-EU') and 'EXTREMADURA' in n:
        return 'local'
    if s in ('EU',) and not n:
        return 'local'
    if _tok(s, 'PCE', 'IU', 'IULV', 'IULV-CA', 'IU-CA', 'IU-LV', 'EB', 'EB-B', 'PSUC', 'IC', 'ICV', 'IC-V', 'IC-EV', 'IC-EA', 'ICV-EUIA', 'ICV-EA',
            'EUPV', 'EU-PV', 'EUIA', 'EU-EV', 'IUCM', 'IURM', 'IUCYL', 'IU-ICAM', 'CAA-IU', 'PCA-PCE', 'PCE-PCPV', 'PCE-PCG', 'PCE/EPK', 'I-E',
            'IU/IX', 'IU-IAS', 'IU-BA', 'IU-SIEX', 'IU-CE', 'IU-LV-CE', 'IU-LV-RM', 'IU-V-RM', 'IUN/NEB', 'IU/EB', 'IU-MS', 'PORA', 'ENTESA') \
            or 'IZQUIERDA UNIDA' in n or 'ESQUERRA UNIDA' in n or 'PARTIDO COMUNISTA' in n or 'PARTIT COMUNISTA' in n or 'POR ANDALUCIA' in n \
            or 'INICIATIVA PER CATALUNYA' in n or 'CON ANDALUCIA' in sn or 'EZKER BATUA' in n or 'IZQUIERDA-EZKERRA' in n:
        return 'iu'
    if s.startswith('ERC') or s == 'ESQUERRA' or 'ESQUERRA REPUBLICANA' in n:
        return 'erc'
    if s.startswith('CUP') or 'CANDIDATURA D\'UNITAT POPULAR' in n or "CANDIDATURA D'UNITAT POPULAR" in n:
        return 'cup'
    if 'JXCAT' in s or 'JUNTS' in s or 'JXSI' in s or 'PDECAT' in s or 'JUNTSXCAT' in s or 'CAT-JUNTS' in s or 'JUNTS PER CATALUNYA' in n:
        return 'junts'
    if s in ('CIU', 'DL', 'CDC', 'PDPC') or 'CONVERGENCIA I UNIO' in n or 'CONVERGENCIA DEMOCRATICA' in n or 'DEMOCRACIA I LLIBERTAT' in n \
            or 'PACTE DEMOCRATIC PER CATALUNYA' in n:
        return 'ciu'
    if 'ALIANCA' in s and ('CAT' in s or 'CATALANA' in n):
        return 'ac'
    if _tok(s, 'PNV', 'EAJ', 'EAJ-PNV', 'EAJ/PNV', 'PNV-EA') or 'PARTIDO NACIONALISTA VASCO' in n or 'EUZKO ALDERDI' in n:
        return 'pnv'
    if 'BILDU' in s or _tok(s, 'HB', 'EH', 'AMAIUR', 'EHAK', 'PCTV', 'PCTV/EHAK', 'ANV', 'B-EA/AE-EA') or 'HERRI BATASUNA' in n \
            or 'EUSKAL HERRITARROK' in n or 'ACCION NACIONALISTA VASCA' in n:
        return 'bildu'
    if s in ('EA', 'EA-PNV', 'EA-EUE') or 'EUSKO ALKARTASUNA' in n:
        return 'ea'
    if s == 'EE' or 'EUSKADIKO EZKERRA' in n:
        return 'ee'
    if _tok(s, 'BNG', 'BNPG', 'BNPG-PSG', 'BNG-NOS') or 'BLOQUE NACIONALISTA GALEGO' in n:
        return 'bng'
    if _tok(s, 'NC', 'NCA', 'NC-BC', 'NC-FAC', 'NC-FA', 'NC-AMF', 'NC-IF') or 'NUEVA CANARIAS' in n:
        return 'nc'
    if _tok(s, 'CC', 'CCA', 'CC-PNC', 'CCA-PNC', 'CC-PNC-CCN', 'AIC', 'ATI', 'CCN-IF', 'CCA-AHI', 'CC-AHI', 'CCA-UXGC') or 'COALICION CANARIA' in n \
            or 'AGRUPACIONES INDEPENDIENTES DE CANARIAS' in n or 'AGRUPACION TINERFENA' in n:
        if not _tok(s, 'CC-UCD'):
            return 'cc'
    if _tok(s, 'UCD', 'CC-UCD') or 'UNION DE CENTRO DEMOCRATICO' in n or 'UNION CENTRO DEMOCRATICO' in n:
        return 'ucd'
    if _tok(s, 'CDS') or 'CENTRO DEMOCRATICO Y SOCIAL' in n:
        return 'cds'
    if 'GBAI' in s or 'GEROA BAI' in n or 'GEROA BAI' in s or 'NABAI' in s or 'NAFARROA BAI' in n:
        return 'gbai'
    # Compromís is Valencian: «Compromiso por Galicia», «Compromisu por Asturies» or «Compromís amb Formentera» are other lists
    if (prov is None or prov in VALENCIA) and (re.search(r'COMPROMIS(?![OU])', sn) or s == 'BLOC' and 'VALENCI' in n or 'BLOC NACIONALISTA VALENCIA' in n):
        return 'compromis'
    if s in ('MES', 'MXME', 'MPM', 'PSM-EN', 'PSM-NM', 'PSM', 'PSM-ENE', 'PSM-IV-EXM', 'PSM-PSI', 'BLOC') or 'MES PER MALLORCA' in n or 'MES PER MENORCA' in n \
            or 'PARTIT SOCIALISTA DE MALLORCA' in n:
        return 'mes'
    if s == 'PRC' or 'REGIONALISTA DE CANTABRIA' in n:
        return 'prc'
    if s == 'PAR' or 'PARTIDO ARAGONES' in n:
        return 'par'
    if s == 'CHA' or 'CHUNTA ARAGONESISTA' in n:
        return 'cha'
    if 'EXISTE' in s or 'TERUEL EXISTE' in n or 'ARAGON EXISTE' in n:
        return 'texiste'
    if s in ('PA', 'PSA-PA', 'PA-PAP') or 'PARTIDO ANDALUCISTA' in n or 'SOCIALISTA DE ANDALUCIA' in n:
        return 'pa'
    if s == 'AA' or 'ADELANTE ANDALUCIA' in sn:
        return 'aa'
    if s in ('FORO', 'FAC') or 'FORO DE CIUDADANOS' in n or 'FORO ASTURIAS' in n:
        return 'foro'
    if s == 'UPL' or 'UNION DEL PUEBLO LEONES' in n:
        return 'upl'
    if s == 'ASG' or 'AGRUPACION SOCIALISTA GOMERA' in n:
        return 'asg'
    if s in ('AHI', 'AHI-CCA') or 'AGRUPACION HERRENA' in n:
        return 'ahi'
    return 'local'

def color(fam, key=''):
    if fam != 'local':
        return FAMILIAS[fam][2]
    h = int(hashlib.md5(norm(key).encode()).hexdigest(), 16)
    return LOCAL_PALETTE[h % len(LOCAL_PALETTE)]

if __name__ == '__main__':
    tests = [('PP', 'PARTIDO POPULAR'), ('P.S.O.E.', ''), ('PSDEG-PSOE', ''), ('B.N.G.', ''), ('VOX', ''), ('SUMAR', ''),
             ('JxCAT - JUNTS', ''), ('EH Bildu', ''), ('EAJ-PNV', ''), ('CCa', ''), ('U.P.N.', ''), ('ERC', ''), ('PSC', ''),
             ('MM-VQ', 'MÁS MADRID-VERDES EQUO'), ('PODEMOS-IU-AV', ''), ('CS', 'CIUDADANOS-PARTIDO DE LA CIUDADANÍA'),
             ('COMPOSTELA ABERTA', ''), ('TRIASXBCN-CM', ''), ('ACORD PER GUANYAR', 'COMPROMÍS MUNICIPAL'),
             ('PSA-PA', ''), ('PSUC', ''), ('UCD', ''), ('AP-PDP', ''), ('CDS', ''), ('PCE', ''), ('HB', ''), ('UPN-PP', ''),
             ('PPMAJO', ''), ('Cat–Junts+', ''), ('Comuns Sumar', ''), ('PSE–EE (PSOE)', ''), ('NC–BC', ''), ('AHI', ''),
             ('CC–UCD', ''), ('IU–MS', ''), ('PorA', ''), ('AA', ''), ('UxE (Podemos–IU–AV)', ''), ('Existe', ''), ('Més', ''),
             ('MxMe', ''), ('EU', 'EXTREMADURA UNIDA'), ('EU–EV', ''), ('ESQUERRA', ''), ('PSOE-PROGR.', ''), ("C's", ''),
             ('PODEMOS-COM', ''), ('EN COMÚ', ''), ('AMAIUR', ''), ('CiU', ''), ('DL', ''), ('PDPC', ''), ('PSP-US', ''),
             ('EE', ''), ('PNV', ''), ('ECP-GUANYEM', ''), ('ERC-SOBIRANISTES', ''), ('CCa-PNC', ''), ('ASG', ''),
             ('SA UNIÓ', ''), ('GXF', ''), ('MDYC', ''), ('CPM', ''), ('CEUTA YA!', ''), ('CON ANDALUCÍA', ''), ('ADELANTE ANDALUCÍA', '')]
    for s, n in tests:
        print(f'{s:28} -> {familia(s, n)}')
