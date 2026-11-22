import sys, json, math
sys.path.insert(0, '/home/claude/scripts')
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
import encuesta_prueba_escanos as E
R = json.load(open(sys.argv[1] + '.json')); S = R['seats']; RG = R['rg']; SIN = set(R['sin'])
COL = {'psoe': '#e1001a', 'pp': '#1d84ce', 'vox': '#6cc24a', 'fa': '#e5007e', 'podemos': '#7b2d8e', 'erc': '#ffb000', 'junts': '#3fc1b0', 'bildu': '#00897b',
       'pnv': '#1d6b39', 'bng': '#7fc6e8', 'compromis': '#e8742a', 'aa': '#2e8b57', 'cc': '#d4b400', 'upc': '#c9a227', 'upn': '#11246b', 'sy': '#8a8a8a'}
ORD = ['fa', 'podemos', 'psoe', 'erc', 'bildu', 'bng', 'junts', 'pnv', 'compromis', 'aa', 'cc', 'upc', 'sy', 'upn', 'pp', 'vox']
ORD = [j for j in ORD if S.get(j)]
GR = {'psoe', 'pp', 'vox', 'fa'}
N = 350; rows = 11
rad = [3.0 + i * 0.62 for i in range(rows)]
tot = sum(rad); pts = []
n_row = [round(N * r / tot) for r in rad]; n_row[-1] += N - sum(n_row)
for r, n in zip(rad, n_row):
    for k in range(n):
        a = math.pi * (1 - k / (n - 1)); pts.append((a, r, r * math.cos(a), r * math.sin(a)))
pts.sort(key=lambda p: -p[0])
seq = []
for j in ORD:
    n = S[j]; lo, hi = RG.get(j, (n, n)); solid = n if j in GR else max(min(lo, n), 0)
    if j in SIN: solid = max(n - 1, 0) if False else n
    seq += [(j, True)] * solid + [(j, False)] * (n - solid)
fig = plt.figure(figsize=(12, 9), dpi=160); ax = fig.add_axes([0.02, 0.39, 0.96, 0.48]); ax.set_aspect('equal'); ax.axis('off')
for (a, r, x, y), (j, solid) in zip(pts, seq):
    ax.scatter(x, y, s=95, color=COL[j] if solid else 'white', edgecolor=COL[j], linewidth=1.6, zorder=3)
ax.text(0, 0.3, '350', ha='center', fontsize=34, fontweight='bold'); ax.text(0, -0.5, 'escaños', ha='center', fontsize=12, color='#555')
from PIL import Image, ImageChops
import numpy as np
_raw = Image.open('/home/claude/site/brand/logo-original.png').convert('RGBA'); _im = Image.new('RGB', _raw.size, (255, 255, 255)); _im.paste(_raw, mask=_raw.split()[3])
_bg = Image.new('RGB', _im.size, (255, 255, 255)); _d = ImageChops.difference(_im, _bg).convert('L').point(lambda v: 255 if v > 60 else 0)
_im = _im.crop(_d.getbbox()); _im = _im.crop((max(_im.getbbox()[0], 0), 0, _im.size[0], _im.size[1]))
_lax = fig.add_axes([0.28, 0.915, 0.44, 0.075]); _lax.imshow(np.asarray(_im)); _lax.axis('off')
fig.text(0.5, 0.885, 'Encuesta 29N', ha='center', fontsize=26, fontweight='bold')
# tabla
y = 0.375; fig.text(0.07, y, 'Partido', fontsize=11, fontweight='bold'); fig.text(0.37, y, 'Escaños', fontsize=11, fontweight='bold'); 
fig.text(0.58, y, 'Partido', fontsize=11, fontweight='bold'); fig.text(0.88, y, 'Escaños', fontsize=11, fontweight='bold'); 
def fila(j, x0, yy):
    n = S[j]; lo, hi = RG.get(j, (n, n))
    if j in GR: txt = f'{n}'; mg = f'{lo}–{hi}'
    else:
        lo2, hi2 = (max(n - 1, 0), n + 1) if j in SIN else (lo, hi); lo2 = min(lo2, n); hi2 = max(hi2, n); txt = f'{lo2}–{hi2}' if lo2 != hi2 else f'{n}'; mg = ''
    fig.patches.append(plt.Circle((x0 - 0.012, yy + 0.008), 0.0, transform=fig.transFigure))
    fig.text(x0 - 0.02, yy, '●', color=COL[j], fontsize=13, va='baseline')
    fig.text(x0, yy, E.NOM[j], fontsize=11); fig.text(x0 + (0.30 if x0 < 0.5 else 0.30), yy, txt, fontsize=11, fontweight='bold' if j in GR else None)
    return mg
orden = sorted(ORD, key=lambda j: (j not in GR, -S[j]))
mid = math.ceil(len(orden) / 2)
for i, j in enumerate(orden):
    col = 0 if i < mid else 1; yy = y - 0.0305 * (1 + (i if i < mid else i - mid))
    x0 = 0.09 if col == 0 else 0.60
    mg = fila(j, x0, yy)
    pass
fig.text(0.5, 0.090, 'Escaño relleno: seguro en la estimación · escaño con borde: dentro del margen. Los partidos territoriales y pequeños se muestran con margen amplio', ha='center', fontsize=9.5, color='#444')
fig.text(0.5, 0.066, 'porque la muestra en su territorio es pequeña. Resultado de personas que votaron voluntariamente en pactometro.es, ponderado por comunidad y contrastado con el CIS.', ha='center', fontsize=9.5, color='#444')
fig.text(0.5, 0.026, '¡Muchas gracias a todas las personas que habéis participado!   ·   pactometro.es', ha='center', fontsize=12, fontweight='bold')
fig.savefig(sys.argv[2], facecolor='white')
