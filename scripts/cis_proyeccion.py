"""data/cis.json for the 29-N simulator, home page, province pages and widget: CIS Estudio 3584
(Preelectoral elecciones generales 2026, avance de resultados of 12-11-2026).

The CIS publishes, for the 29-N, the vote estimate (national) and seat ranges (percentiles 5-95) for every province and
for the total. The simulator needs whole seats, so scripts/cis3584/reparto_central.py picks the split that respects every
provincial and national range and stays closest to their centres (see that file). This script only assembles cis.json.
Order: python3 scripts/cis3584/reparto_central.py  (done here too)  →  python3 scripts/cis_proyeccion.py
Inputs: scripts/cis3584/horquillas_provincias.json (the CIS table «Estimación de escaños por provincias», parsed from the PDF),
        the national table below (CIS, «Estimación de voto», page 2 of 3584_Estimacion.pdf).
The previous study (3582, October barometer, projected by pactómetro.es) is kept in scripts/cis3584/cis_3582_anterior.json.
"""
import json, os, subprocess, sys
AQUI = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cis3584')
subprocess.run([sys.executable, os.path.join(AQUI, 'reparto_central.py')], check=True)
H = json.load(open(os.path.join(AQUI, 'horquillas_provincias.json'), encoding='utf-8'))
R = json.load(open(os.path.join(AQUI, 'reparto_central.json'), encoding='utf-8'))
D = '/home/claude/site/data'

# [key, short label (site), CIS label (exact), long name, colour, family, voto directo (% sobre censo), margen (±, IC 95 %), estimación (% voto válido)]
CIS = [
    ['psoe', 'PSOE', 'PSOE', 'Partido Socialista Obrero Español', '#e1001a', 'psoe', 28.7, 0.4, 33.3],
    ['pp', 'PP', 'PP', 'Partido Popular', '#1d84ce', 'pp', 17.2, 0.3, 25.5],
    ['vox', 'Vox', 'VOX', 'Vox', '#6cc24a', 'vox', 15.0, 0.3, 18.4],
    ['fa', 'Frente Amplio', 'Frente Amplio', 'Frente Amplio (Sumar, IU y aliados)', '#e5007e', 'sumar', 3.3, 0.2, 4.7],
    ['erc', 'ERC-Podemos', 'ERC-Podemos', 'Esquerra Republicana de Catalunya y Podemos (campaña conjunta en Cataluña)', '#ffb000', 'erc', 2.4, 0.1, 3.1],
    ['bildu', 'EH Bildu', 'EH-Bildu', 'Euskal Herria Bildu', '#00897b', 'bildu', 1.3, 0.1, 1.8],
    ['compromis', 'Compromís', 'Compromís: Front Valencià', 'Compromís: Front Valencià', '#f08a00', 'compromis', 1.2, 0.1, 1.6],
    ['aa', 'Adelante Andalucía', 'Adelante Andalucía', 'Adelante Andalucía', '#3e8e41', 'aa', 1.1, 0.1, 1.5],
    ['junts', 'Junts', 'Junts', 'Junts per Catalunya', '#3fc1b0', 'junts', 0.7, 0.1, 1.2],
    ['podemos', 'Podemos', 'Podemos', 'Podemos', '#6a2c70', 'podemos', 0.8, 0.1, 1.1],
    ['bng', 'BNG', 'BNG', 'Bloque Nacionalista Galego', '#7fc6e8', 'bng', 0.7, 0.1, 1.0],
    ['pnv', 'EAJ-PNV', 'EAJ-PNV', 'Euzko Alderdi Jeltzalea - Partido Nacionalista Vasco', '#1d6b39', 'pnv', 0.4, 0.1, 0.7],
    ['upc', 'UPC', 'UPC', 'Unidad del Pueblo Canario', '#5bb5a2', 'nc', 0.3, 0.1, 0.4],
    ['ames', 'Ara Més', 'Ara Més-Front Ampli', 'Ara Més-Front Ampli (Illes Balears)', '#b5367a', 'mes', 0.2, 0.04, 0.2],
    ['salf', 'SALF', 'SALF', 'Se Acabó la Fiesta (SALF)', '#5b4b8a', 'local', 1.3, 0.1, 1.4],
    ['cc', 'CC-Primero Canarias', 'CC-Municipalistas Primero Canarias', 'Coalición Canaria-Municipalistas Primero Canarias', '#ffd200', 'cc', 0.2, 0.04, 0.2],
]
RESTO = [['En blanco', 1.5, 0.1, 0.5], ['Otros partidos', 3.0, 0.2, 3.4], ['Voto nulo', 0.8, 0.1, None],
         ['Abstención («No votaría»)', 1.7, 0.1, None], ['No sabe', 15.8, 0.3, None], ['No contesta', 2.3, 0.1, None]]
assert abs(sum(c[8] for c in CIS) + RESTO[0][3] + RESTO[1][3] - 100) < 0.05

partidos = [{'k': c[0], 'sig': c[1], 'cis': c[2], 'nom': c[3], 'color': c[4], 'fam': c[5], 'directo': c[6], 'margen': c[7], 'est': c[8],
             'esc': R['nacional'].get(c[0], 0), 'h': H['total'].get(c[0])} for c in CIS]
assert sum(p['esc'] for p in partidos) == 350

out = {
    'estudio': {'numero': 3584, 'titulo': 'Preelectoral elecciones generales 2026', 'organismo': 'Centro de Investigaciones Sociológicas (CIS)',
                'publicado': '2026-11-12', 'campo': ['2026-10-07', '2026-10-30'],
                'url': 'https://www.cis.es/es/w/avance-de-resultados-del-estudio-3584-preelectoral-elecciones-generales-2026-',
                'estimacion_pdf': 'https://www.cis.es/documents/d/guest/3584_estimacion-pdf',
                'frecuencias_pdf': 'https://www.cis.es/documents/d/guest/es3584mar_A-pdf',
                'excel': 'https://www.cis.es/documents/d/guest/3584-multi_A-xlsx'},
    'ficha': {'ambito': 'Nacional',
              'universo': 'Población española de ambos sexos de 18 años y más con derecho a voto en elecciones generales y residente en España',
              'muestra': 'Diseñada: 45.000 entrevistas. Realizada: 45.074 entrevistas',
              'afijacion': 'No proporcional: partiendo de un reparto proporcional por provincias, todas alcanzan un mínimo de 300 entrevistas, salvo Ceuta y Melilla, con un mínimo de 50 cada una; después, cuotas proporcionales de tamaño de hábitat, sexo y edad',
              'ponderacion': 'Coeficientes de ponderación para la muestra total (PESO) y variables específicas para las estimaciones por provincia (PESOPROV) y por comunidad autónoma (PESOCCAA)',
              'puntos': '4.190 municipios, 50 provincias y las 2 ciudades autónomas',
              'procedimiento': 'Selección aleatoria de teléfonos fijos (14,6 %) y móviles (85,4 %) y de las personas por cuotas de sexo y edad',
              'modo': 'Entrevista telefónica asistida por ordenador (CATI)',
              'error_corto': '±0,5 %',
              'error': '±0,5 % para el conjunto de la muestra, con un nivel de confianza del 95,5 % (dos sigmas) y P = Q, en el supuesto de muestreo aleatorio simple; entre ±1,5 % (Madrid) y ±10,7 % (Melilla) según la provincia',
              'fechas': 'Del 7 al 30 de octubre de 2026',
              'pregunta': '«En las próximas elecciones generales del 29 de noviembre, ¿a qué partido votaría Ud.?» (P3R, respuesta espontánea, recodificada)'},
    'metodo_cis': 'Los escaños los da el CIS como horquillas: los percentiles 5 y 95 de la distribución de escaños de cada candidatura en sus simulaciones, es decir, el 90 % central de los escenarios. Según el propio CIS, no es un intervalo de confianza ni un error de muestreo.',
    'columnas': ['Voto directo en la encuesta (en % sobre censo)', 'Margen teórico de error (intervalo de confianza del 95 %)', 'Estimación de voto CIS (en % sobre el voto válido)', 'Estimación de escaños (percentiles 5-95)'],
    'notas_cis': ['Aunque ERC y Podemos no concurren formalmente en coalición electoral, ambas formaciones realizan una campaña conjunta en Cataluña.',
                  'Por el redondeo al segundo decimal, la suma puede no ser exactamente 100.',
                  'Los percentiles no son aditivos entre provincias: sumar las horquillas provinciales no equivale a la horquilla nacional.'],
    'partidos': partidos,
    'resto': [{'n': r[0], 'directo': r[1], 'margen': r[2], 'est': r[3]} for r in RESTO],
    'n': 45074,
    'proyeccion': {'metodo': 'pactómetro.es: reparto central dentro de las horquillas del CIS', 'provincias': R['provincias']},
}
json.dump(out, open(f'{D}/cis.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('escaños de partida', {p['k']: p['esc'] for p in partidos}, sum(p['esc'] for p in partidos))
