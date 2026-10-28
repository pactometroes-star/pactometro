# Escribe data/candidaturas.json: textos de coaliciones y Senado (revisados con el BOE del 28-10-2026) y las
# candidaturas de cada provincia (provincias_cand.json, de build_cand_boe.py). Las fuentes de prensa del Senado
# salen de la versión del 27-10 (candidaturas_2026-10-27.json).
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('CANDIDATURAS', '/home/claude/site/data/candidaturas.json')
old = json.load(open(os.path.join(HERE, 'candidaturas_2026-10-27.json'), encoding='utf-8'))
prov = json.load(open(os.path.join(HERE, 'provincias_cand.json'), encoding='utf-8'))
fuentes_old = {s['nombre']: s.get('fuentes', []) for s in old['senado']}
f = lambda nombre_viejo: fuentes_old.get(nombre_viejo, [])
BOE = ['BOE-A-2026-22607, 28-10-2026', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-22607']
VOZ_IBIZA = ['La Voz de Ibiza, 28-10-2026', 'https://lavozdeibiza.com/actualidad/oficial-estas-son-las-listas-para-las-elecciones-del-29-n-en-ibiza-y-formentera/']

C = {
    'revisado': '2026-10-28',
    'estado': 'presentadas',
    'boe': {'id': 'BOE-A-2026-22607', 'fecha': '2026-10-28',
            'url': 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-22607',
            'pdf': 'https://www.boe.es/boe/dias/2026/10/28/pdfs/BOE-A-2026-22607.pdf'},
    'nota': 'Candidaturas presentadas ante las juntas electorales, según el BOE del 28 de octubre (BOE-A-2026-22607). '
            'Todavía no son definitivas: las juntas las proclaman el 2 de noviembre y el BOE publica las listas proclamadas el 3.',
    'congreso': [
        {'nombre': 'Frente Amplio',
         'partidos': 'Izquierda Unida, Movimiento Sumar, Más Madrid y Comuns, con socios distintos en cada comunidad. Candidata a la presidencia: Ada Colau',
         'donde': 'En 44 circunscripciones: todas menos las de la Comunitat Valenciana y Canarias, donde sus partidos van en otras coaliciones, Teruel, Ceuta y Melilla. '
                  'Cambia de nombre en Barcelona, Girona y Lleida («Comuns-Front Ampli»), Huesca y Zaragoza («Chunta Aragonesista-Frente Amplio Aragón»), '
                  'Baleares («AraMés-Front Ampli»), Asturias («Frente Ampliu por Asturies»), Álava y Navarra («Frente Amplio-Fronte Zabala»), '
                  'A Coruña y Ourense («Frente Amplio-Fronte Ampla»), Pontevedra («Fronte Ampla») y Cádiz, Córdoba, Granada, Huelva y Sevilla («Frente Amplio Andaluz»)'},
        {'nombre': 'Compromís: Front Valencià',
         'partidos': 'Compromís, Esquerra Unida del País Valencià, Podem y Esquerra Republicana del País Valencià',
         'donde': 'Alicante, Castellón y Valencia'},
        {'nombre': 'Unidad del Pueblo Canario',
         'partidos': 'Nueva Canarias-Bloque Canarista, Podemos, Izquierda Unida y Movimiento Sumar',
         'donde': 'Las Palmas y Santa Cruz de Tenerife'},
        {'nombre': 'Coalición Canaria y Primero Canarias',
         'partidos': 'Coalición Canaria y Municipalistas Primero Canarias: «Municipalistas Primero Canarias-Coalición Canaria» en Las Palmas '
                     'y «Coalición Canaria-Municipalistas Primero Canarias» en Santa Cruz de Tenerife',
         'donde': 'Las Palmas y Santa Cruz de Tenerife'},
        {'nombre': 'UPN-PP',
         'partidos': 'Unión del Pueblo Navarro en coalición con el Partido Popular',
         'donde': 'Navarra'},
        {'nombre': 'Democracia para el Siglo 21',
         'partidos': 'Democracia 21, Ciudadanos y UCIN. Candidata: Miriam González',
         'donde': 'Solo Madrid y Barcelona'},
    ],
    'solos': 'Van con su propia candidatura el PP (en Navarra, con UPN), el PSOE (con el nombre de su federación en Cataluña, Galicia, Euskadi, Navarra y Baleares), '
             'Vox y Frente Obrero, en las 52 circunscripciones; ERC (con candidatos de Podemos), Junts y Alhora, en las cuatro catalanas; EH Bildu, en Euskadi y Navarra; '
             'el PNV, en las tres provincias vascas; el BNG, en las cuatro gallegas; Geroa Bai, en Navarra; Adelante Andalucía, en las ocho andaluzas; Teruel Existe, solo en Teruel; '
             'Soria ¡Ya!, en Soria; Drago Canarias, en las dos provincias canarias, y PACMA, en 37. Podemos se presenta por su cuenta en 41 circunscripciones: '
             'no en Cataluña, donde apoya a ERC, ni en la Comunitat Valenciana y Canarias, donde va en coalición, ni en Baleares y Melilla. '
             'Se Acabó La Fiesta está en 46: todas menos Lleida, Girona, Gipuzkoa, Bizkaia, Cantabria y Ciudad Real. '
             'No se presentan Aliança Catalana, la CUP, el PRC, Foro Asturias, El Pi ni Aragón Existe, que retiró sus listas de Zaragoza y Huesca.',
    'senado': [
        {'nombre': '«Senado de Progreso»: PSOE y Frente Amplio',
         'texto': 'Una sola candidatura al Senado del PSOE con los partidos del Frente Amplio (Izquierda Unida, Movimiento Sumar, Más Madrid, Compromís, Chunta Aragonesista, '
                  'Batzarre…), que en el BOE figura como «Senado de Progreso» (SDP) en todas las provincias menos en Cataluña, donde el PSC y los Comuns '
                  '(«Comuns-Front Ampli per la Democràcia») van por separado; Baleares, con una lista distinta en cada isla, y Canarias, donde el PSOE va solo. '
                  'En Huesca y Teruel se llama «Senado de Progreso de Aragón»; en Galicia la forman solo el PSOE y Movimiento Sumar, y en Alicante y Valencia, '
                  'el PSOE, Compromís y EUPV. Podemos no forma parte.',
         'fuentes': f('«Senado de Progreso»: PSOE y Frente Amplio') + [BOE]},
        {'nombre': 'Baleares: una lista de la izquierda en cada isla',
         'texto': 'En Mallorca, «Acord de Progrés per Mallorca» (PSIB-PSOE, Més per Mallorca, Sumar y EUIB); en Menorca, «Menorca al Senat» (PSOE, Més per Menorca, EM, EU y Podemos); '
                  'en Ibiza, «Eivissa al Senat» (PSOE, Sumar, EUIB, Ara Eivissa y Podem), y en Formentera, «Formentera al Senat» (PSOE, Gent per Formentera y Movimiento Sumar).',
         'fuentes': f('Baleares: PSIB-PSOE, Més, Sumar y Esquerra Unida') + [BOE]},
        {'nombre': 'PP y Vox: reparto de candidatos',
         'texto': 'No es una coalición, sino un reparto acordado el 26 de octubre. En el BOE, Vox no presenta candidatos al Senado en Cádiz, Valencia, Castellón, Baleares '
                  'ni Canarias, y presenta uno solo en vez de tres en 14 provincias: Alicante, Álava, Asturias, Badajoz, Bizkaia, Cáceres, Cuenca, Granada, Huelva, Huesca, '
                  'Jaén, Pontevedra, Sevilla y Zaragoza. El PP no se presenta al Senado en Gipuzkoa, Girona ni Tarragona, y en Valencia su número dos es José Luis Aguirre, '
                  'independiente y exconseller de Vox.',
         'fuentes': f('PP y Vox: reparto de candidatos') + [BOE]},
        {'nombre': 'ERC y EH Bildu',
         'texto': 'Van juntos al Senado: en el BOE, «ERC-EH Bildu» en las cuatro provincias catalanas y «EH Bildu-ERC» en Euskadi y Navarra.',
         'fuentes': f('ERC y EH Bildu') + [BOE]},
        {'nombre': 'Coalición Canaria y Primero Canarias',
         'texto': 'Candidatura conjunta al Congreso y al Senado: en el BOE, «Coalición Canaria-Municipalistas Primero Canarias» en todas las islas, salvo en Gran Canaria, '
                  'donde va al revés.',
         'fuentes': f('Coalición Canaria y Primero Canarias') + [BOE]},
        {'nombre': 'Formentera: Sa Unió',
         'texto': '«Sa Unió de Formentera», del PP y Compromís amb Formentera, presenta a Vicente Tur Costa al senador de Formentera, que el 29-N se elige por primera vez '
                  'por separado de Ibiza. También se presentan «Formentera al Senat» (PSOE, Gent per Formentera y Movimiento Sumar) y «Formentera Viva».',
         'fuentes': f('Formentera: Sa Unió') + [VOZ_IBIZA, BOE]},
        {'nombre': 'Se Acabó La Fiesta',
         'texto': 'No presenta candidatos al Senado en ninguna provincia.',
         'fuentes': f('Se Acabó La Fiesta') + [BOE]},
    ],
    'provincias': prov,
}
for s in C['senado']:
    assert s['fuentes'], s['nombre']
json.dump(C, open(SITE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(os.path.getsize(SITE), 'bytes →', SITE)
