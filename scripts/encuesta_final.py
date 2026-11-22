"""Cálculo final de la encuesta 29-N (escenario C: CCAA + CIS 3584 + tope regional). Uso: python3 encuesta_final.py final.xlsx salida.png"""
import sys, json, math
sys.path.insert(0, '/home/claude/scripts')
import numpy as np, pandas as pd
import encuesta_prueba_escanos as E

K = 40; MIN_TERR = 30; CAP = 0.30
REG = ['bng', 'erc', 'junts', 'bildu', 'pnv', 'cc', 'compromis', 'aa', 'upc', 'upn', 'podemos', 'gbai', 'texiste', 'sy']
GRANDES = ['psoe', 'vox', 'pp', 'fa']
FIJOS = {'upn', 'gbai', 'texiste', 'sy'}

def pipeline(df):
    w = E.pesos(df); TA = E.estimar(df, w); nt = E.nterr_de(df)
    sin = set(FIJOS) | {j for j in REG if nt.get(j, 0) < MIN_TERR}
    T = {}
    for j in set(TA) | set(E.CIS_T):
        a = TA.get(j, 0); c = E.CIS_T.get(j, 0); n = nt.get(j, len(df))
        wt = n / (n + K); T[j] = wt * a + (1 - wt) * c
    for j in REG:
        den = sum(E.WP[p] * E.B[p].get(j, 0) for p in E.TERR[j])
        if den > 0 and j in T: T[j] = min(max(T[j], (1 - CAP) * den), (1 + CAP) * den)
    s = sum(T.values()); T = {k: v / s for k, v in T.items()}
    seats, _ = E.reparto(T, sin)
    return seats, T, sin, nt, w

def main(x, out):
    df = E.cargar(x)
    seats, T, sin, nt, w = pipeline(df)
    rng = np.random.default_rng(11); grupos = {c: np.where(df['ccaa'].values == c)[0] for c in sorted(set(df['ccaa']))}
    bs = []
    for _ in range(300):
        idx = np.concatenate([rng.choice(ix, size=len(ix), replace=True) for ix in grupos.values()])
        bs.append(pipeline(df.iloc[idx].reset_index(drop=True))[0])
    rg = {j: tuple(int(np.percentile([b.get(j, 0) for b in bs], q)) for q in (5, 95)) for j in set(seats) | set(sum((list(b) for b in bs), []))}
    v = df['k'].notna().values
    print('respuestas', len(df), 'válidas', int(v.sum()), 'n_eff', round(E.neff(w[v]), 1), 'sin datos', sorted(sin))
    for j, n in sorted(seats.items(), key=lambda t: -t[1]): print(E.NOM[j], n, rg.get(j))
    json.dump(dict(seats=seats, rg=rg, n=len(df), valid=int(v.sum()), sin=sorted(sin)), open(out + '.json', 'w'))
    return seats, rg, df

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
