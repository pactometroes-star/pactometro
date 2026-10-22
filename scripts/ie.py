"""Parser for the official Ministerio del Interior electoral result files
(fixed-width .DAT records, ANSI/latin-1), following FICHEROS.DOC.
Positions are 1-indexed inclusive, as in the official spec."""
import os, glob

ENC = 'latin-1'

def _f(line, a, b):
    return line[a-1:b]

def _i(line, a, b):
    s = line[a-1:b].strip()
    return int(s) if s.isdigit() else 0

def _lines(path):
    with open(path, 'r', encoding=ENC, newline='') as fh:
        for line in fh:
            line = line.rstrip('\r\n')
            if line.strip():
                yield line

def find(folder, nn, typ=None):
    """Return path of file nn (e.g. '03') inside an election folder."""
    pats = sorted(glob.glob(os.path.join(folder, f'{nn}*.DAT')))
    if typ:
        pats = [p for p in pats if os.path.basename(p)[2:4] == typ]
    return pats[0] if pats else None

def candidaturas(path):
    out = {}
    for l in _lines(path):
        code = _f(l, 9, 14)
        out[code] = {
            'siglas': _f(l, 15, 64).strip(),
            'nombre': _f(l, 65, 214).strip(),
            'acum_prov': _f(l, 215, 220),
            'acum_aut': _f(l, 221, 226),
            'acum_nac': _f(l, 227, 232),
        }
    return out

def datos_municipios(path):
    """File 05: one record per municipality (distrito 99 = total)."""
    out = {}
    for l in _lines(path):
        dist = _f(l, 17, 18)
        if dist != '99':
            continue
        key = _f(l, 12, 13) + _f(l, 14, 16)
        out[key] = {
            'ccaa': _f(l, 10, 11), 'prov': _f(l, 12, 13), 'mun': _f(l, 14, 16),
            'nombre': _f(l, 19, 118).strip(),
            'pj': _f(l, 120, 122), 'dip': _f(l, 123, 125), 'comarca': _f(l, 126, 128),
            'poblacion': _i(l, 129, 136), 'mesas': _i(l, 137, 141),
            'censo_ine': _i(l, 142, 149), 'censo': _i(l, 150, 157),
            'blancos': _i(l, 190, 197), 'nulos': _i(l, 198, 205),
            'votos_cand': _i(l, 206, 213), 'escanos': _i(l, 214, 216),
            'oficial': _f(l, 233, 233),
        }
    return out

def cand_municipios(path):
    """File 06: votes and seats per candidatura per municipality."""
    out = {}
    for l in _lines(path):
        if _f(l, 15, 16) != '99':
            continue
        key = _f(l, 10, 11) + _f(l, 12, 14)
        out.setdefault(key, []).append((_f(l, 17, 22), _i(l, 23, 30), _i(l, 31, 33)))
    return out

def datos_superior(path):
    """File 07: data for areas above the municipality."""
    out = {}
    for l in _lines(path):
        key = (_f(l, 10, 11), _f(l, 12, 13), _f(l, 14, 14))
        out[key] = {
            'nombre': _f(l, 15, 64).strip(), 'poblacion': _i(l, 65, 72),
            'censo_ine': _i(l, 78, 85), 'censo': _i(l, 86, 93),
            'blancos': _i(l, 126, 133), 'nulos': _i(l, 134, 141),
            'votos_cand': _i(l, 142, 149), 'escanos': _i(l, 150, 155),
        }
    return out

def cand_superior(path):
    """File 08: votes and seats per candidatura for areas above the municipality."""
    out = {}
    for l in _lines(path):
        key = (_f(l, 10, 11), _f(l, 12, 13), _f(l, 14, 14))
        out.setdefault(key, []).append((_f(l, 15, 20), _i(l, 21, 28), _i(l, 29, 33)))
    return out

def datos_menores(path):
    """File 11: municipalities under 250 inhabitants (08: 100-250, 09: <100)."""
    out = {}
    for l in _lines(path):
        key = _f(l, 12, 13) + _f(l, 14, 16)
        out[key] = {
            'tipo': _f(l, 1, 2), 'ccaa': _f(l, 10, 11), 'prov': _f(l, 12, 13), 'mun': _f(l, 14, 16),
            'nombre': _f(l, 17, 116).strip(), 'pj': _f(l, 117, 119), 'dip': _f(l, 120, 122),
            'poblacion': _i(l, 126, 128), 'mesas': _i(l, 129, 130),
            'censo_ine': _i(l, 131, 133), 'censo': _i(l, 134, 136),
            'blancos': _i(l, 149, 151), 'nulos': _i(l, 152, 154),
            'votos_cand': _i(l, 155, 157), 'escanos': _i(l, 158, 159),
            'oficial': _f(l, 160, 160),
        }
    return out

def cand_menores(path):
    """File 12: one record per candidate in municipalities under 250 inhabitants.
    Returns {muni_key: {cand_code: {'votos': v, 'obtenidos': n, 'electos': k}}}"""
    out = {}
    for l in _lines(path):
        key = _f(l, 10, 11) + _f(l, 12, 14)
        code = _f(l, 15, 20)
        d = out.setdefault(key, {}).setdefault(code, {'votos': _i(l, 21, 23), 'obtenidos': _i(l, 24, 25), 'electos': 0, 'n': 0})
        d['n'] += 1
        if _f(l, 123, 123).upper() == 'S':
            d['electos'] += 1
    return out

def candidatos(path):
    """File 04: candidate list. Yields dicts."""
    for l in _lines(path):
        yield {
            'prov': _f(l, 10, 11), 'dist': _f(l, 12, 12), 'mun': _f(l, 13, 15),
            'cand': _f(l, 16, 21), 'orden': _i(l, 22, 24), 'tipo': _f(l, 25, 25),
            'nombre': _f(l, 26, 50).strip(), 'ap1': _f(l, 51, 75).strip(), 'ap2': _f(l, 76, 100).strip(),
            'electo': _f(l, 120, 120).upper() == 'S',
        }
