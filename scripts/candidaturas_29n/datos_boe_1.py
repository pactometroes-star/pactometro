# Candidaturas al Congreso presentadas (BOE-A-2026-22607, 28-10-2026), transcritas de la lectura del BOE
# [siglas, nombre oficial (si se conoce), cabeza de lista, nota]
BOE = 'BOE'
NOM = {'PSOE': 'PARTIDO SOCIALISTA OBRERO ESPAÑOL', 'FO': 'FRENTE OBRERO', 'SALF': 'SE ACABÓ LA FIESTA', 'MUNDO+JUSTO': 'POR UN MUNDO MÁS JUSTO',
       'VOX': 'VOX', 'PODEMOS': 'PODEMOS', 'PACMA': 'PARTIDO ANIMALISTA CON EL MEDIO AMBIENTE', 'PP': 'PARTIDO POPULAR', 'FA': 'FRENTE AMPLIO',
       'PCTE': 'PARTIDO COMUNISTA DE LOS TRABAJADORES DE ESPAÑA', 'FE de las JONS': 'FALANGE ESPAÑOLA DE LAS JONS',
       'ESCAÑOS EN BLANCO': 'ESCAÑOS EN BLANCO PARA DEJAR ESCAÑOS VACÍOS', 'PDSJE': 'PARTIDO DEMÓCRATA SOCIAL JUBILADOS EUROPEOS',
       'ADELANTE ANDALUCÍA': 'ADELANTE ANDALUCÍA', 'D21': 'DEMOCRACIA PARA EL SIGLO 21'}
def L(*filas):
    out = []
    for f in filas:
        sig, cab = f[0], f[1]
        nombre = f[2] if len(f) > 2 and f[2] else NOM.get(sig, '')
        nota = f[3] if len(f) > 3 else ''
        out.append([sig, nombre, cab, nota] if nota else [sig, nombre, cab])
    return out
P = {
 '02': (BOE, L(('PSOE', 'Amparo Torres Valencoso'), ('FO', 'Adrián Moreno Contreras'), ('SALF', 'Isabel Ferrer de la Cruz'), ('MUNDO+JUSTO', 'Alberto Martínez Cuartero'),
              ('VOX', 'Rubén Herrero de Castro'), ('PODEMOS', 'Luisa María García Tárraga'), ('PACMA', 'María de los Llanos Soriano García'), ('PP', 'Francisco Navarro Cebrián'),
              ('FA', 'Juan Blanco Castellanos'))),
 '03': (BOE, L(('PSOE', 'Antonio Alfonso Francés Pérez'), ('FO', 'Rodrigo Pastor García'), ('PARTIDO AUTÓNOMOS', 'Lydia Cañedo Oliver', 'PARTIDO AUTÓNOMOS'), ('SALF', 'Casimiro Martín Soto'),
              ('PCTE', 'Pablo Román Muñoz'), ('COMPROMIS-EUPV-PODEM-ERPV', 'María Teresa Pérez Díaz', 'COMPROMÍS: FRONT VALENCIÀ'), ('VOX', 'David García Gomis'), ('PACMA', 'Jaime Barceló Ríos'),
              ('FE de las JONS', 'José Garcia Miralles'), ('PP', 'Macarena Montesinos De Miguel'))),
 '04': (BOE, L(('PSOE', 'Anabel Mateos Sánchez'), ('FO', 'Emilio Gustavo Icasati Weidemüller'), ('SALF', 'Inmaculada María Jaén Pérez'), ('ADELANTE ANDALUCÍA', 'Tania Ferre Carrión'),
              ('PACMA', 'Eduardo José Milla Juan'), ('VOX', 'Rocío de Meer Méndez'), ('PP', 'María Carmen Crespo Díaz'), ('IPAL', 'Juan Andrés Ruiz López', 'IZQUIERDA POR ALMERÍA'),
              ('MUNDO+JUSTO', 'María Mercedes Quero Molina'), ('ESCAÑOS EN BLANCO', 'Mariana García Hernández'), ('PCTE', 'Mohsin Faiz Douhab'), ('PODEMOS', 'Jésica Jiménez Gómez'),
              ('FA', 'Zacarías Lucas Lekal Villegas'))),
 '01': (BOE, L(('PSE-EE (PSOE)', 'Javier Hurtado Domínguez', 'PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA'), ('EH Bildu', 'Mikel Otero Gabirondo', 'EUSKAL HERRIA BILDU'),
              ('EAJ-PNV', 'Gorka Urtaran Agirre', 'EUZKO ALDERDI JELTZALEA-PARTIDO NACIONALISTA VASCO'), ('ESCAÑOS EN BLANCO', 'Raúl Aperribay Ganzábal'), ('VOX', 'Jonathan Romero Gámiz'),
              ('PACMA', 'Saioa Martín Donoso'), ('PODEMOS', 'Garbiñe Ruiz Noriega'), ('PCTE/ELAK', 'Liher Calleja Montero', 'PARTIDO COMUNISTA DE LOS TRABAJADORES DE EUSKADI/EUSKADIKO LANGILEEN ALDERDI KOMUNISTA'),
              ('SALF', 'Leire Bengoa Chávarri'), ('FO', 'Laura Barrenengoa Clemente'), ('PP', 'Iñaki Oyarzábal de Miguel'), ('FRENTE AMPLIO-FRONTE ZABALA', 'José Damián García-Moreno López', 'FRENTE AMPLIO-FRONTE ZABALA'),
              ('PFAC', 'Zuriñe Ojeda Santiago', 'FEMINISTAS AL CONGRESO'), ('MUNDO+JUSTO', 'Cristina Elcuaz Arana'), ('JL', 'Ángel García Fernández Viñegra', 'JUSTICIA Y LEY'))),
 '33': (BOE, L(('FO', 'Juan Sánchez Pérez'), ('PSOE', 'Adriana Lastra Fernández'), ('SALF', 'Luis Felipe Álvarez Pérez'), ('VOX', 'José María Figaredo Álvarez-Sala'),
              ('MUNDO+JUSTO', 'José Ramón Bahamonde Nava'), ('PCTE', 'Ástor García Suárez'), ('PODEMOS', 'Manuel Antonio Pravia Fernández', 'PODEMOS (PAZ, CASA Y TRABAJO)'),
              ('PUEDE', 'José Luis Zapico Martínez', 'PARTIDO UNIONISTA ESTADO DE ESPAÑA'), ('PP', 'Ángela Pumariega Menéndez'), ('PACMA', 'Irene Jiménez López'),
              ('FA', 'Juan Antonio González Ponte', 'FRENTE AMPLIU POR ASTURIES'))),
 '05': (BOE, L(('PSOE', 'Manuel Arribas Maroto'), ('MUNDO+JUSTO', 'Julio Blanco Rodríguez'), ('SALF', 'Pedro Hermosa González'), ('FO', 'Jorge Moyano García'), ('PCTE', 'Adrián Franco Barata'),
              ('VOX', 'Samuel Vázquez Álvarez'), ('PODEMOS', 'Laura Ruiz Ginés'), ('PP', 'Héctor Palencia Rubio'), ('PDSJE', 'Carmen Alicia Manchón Villaverde'), ('FA', 'Pablo Garcinuño García'))),
 '06': (BOE, L(('PSOE', 'María Yolanda García Seco'), ('SALF', 'German Martínez Valverde'), ('VOX', 'Ignacio Hoces Iñiguez'), ('FO', 'Yago De Francisco González'),
              ('NEX', 'Víctor Ramos Sánchez', 'NUEVO EXTREMEÑISMO - ADELANTE EXTREMADURA'), ('PP', 'María Teresa Tortonda Gordillo'), ('FA', 'María del Pilar Ramos Duro'),
              ('J.U.E.X.', 'Francisco Fuentes Gutiérrez', 'JUNTOS POR EXTREMADURA'), ('MUNDO+JUSTO', 'Inmaculada Soria Eugenio'), ('PODEMOS', 'Amparo Botejara Sanz'))),
 '07': (BOE, L(('FO', 'Selva Lucía Belmaña López'), ('PSIB-PSOE', 'Francesca Lluch Armengol Socias', 'PARTIDO SOCIALISTA DE LAS ISLAS BALEARES'), ('VOX', 'Maria Isabel Cerezo Sánchez'),
              ('PACMA', 'María Remedios García Castillo'), ('PCTE', 'Joan Luna Mateu'), ('SALF', 'Daniel Rodríguez Rincón'), ('PP', 'José Vicente Marí Bosó'),
              ('ARAMÉS-EU-MS', 'Carmen Gomila Domínguez', 'ARAMÉS-FRONT AMPLI'))),
 '08': (BOE, L(('PSC', 'Jordi Hereu Boher', 'PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE)'), ('JxCat', 'Míriam Nogueras i Camero', 'JUNTS PER CATALUNYA'),
              ('ERC', 'Gabriel Rufián Romero', 'ESQUERRA REPUBLICANA DE CATALUNYA'), ('FO', 'Daniel Carro Peralta'), ('SALF', 'Yolanda López Carreño'),
              ('PCTC', 'Maria Rodríguez-Farge Hijano', 'PARTIT COMUNISTA DELS TREBALLADORES DE CATALUNYA'), ('VOX', 'Juan José Aizcorbe Torra'),
              ('COMUNS-FRONT AMPLI', 'Ada Colau Ballano', 'COMUNS-FRONT AMPLI'), ('PP', 'Xavier García Albiol', 'PARTIT POPULAR/PARTIDO POPULAR'), ('MUNDO+JUSTO', 'Ana María Surra Spadea'),
              ('D21', 'David Andrés Díaz'), ('PACMA', 'Beatriz Arévalo Rodrigo'), ('ALHORA', 'Jordi Graupera Garcia Milà', 'ALHORA'))),
}
EE = 'BOE, vía El Español'
P.update({
 '09': (EE, L(('FO', 'Gonzalo Herrero Burgos'), ('PSOE', 'Esther Peña Camarero'), ('SALF', 'Marcos Santamaría del Olmo'), ('PODEMOS', 'Isabel Lara Benítez'), ('VOX', 'Eugenia Landaluce Miranda'),
             ('MUNDO+JUSTO', 'Elsa Colina Arreba'), ('PCTE', '', '', 'no admitida por la junta electoral'), ('PP', 'Ángel Mariano Ibáñez Hernando'), ('FA', 'Fernando José Saiz Martínez'))),
 '24': (EE, L(('PSOE', 'Javier Alfonso Cendón'), ('FO', 'José Manuel Estébanez Fernández'), ('PACMA', 'María Natividad Franco Natal'), ('SALF', 'Enrique Jesús Pérez Suárez'),
             ('PROYECTO ALANTRE', 'José Antonio Fernández García', 'PROYECTO ALANTRE'), ('VOX', 'Pablo Juan Calvo Liste'), ('PREPAL', 'Manuela Iglesias Carreño'), ('PCTE', 'Estrella Alonso Almazán'),
             ('PODEMOS', 'Sixto Martínez Álvarez'), ('PP', 'Ester Muñoz de la Iglesia'), ('MUNDO+JUSTO', 'María Elena Cánovas Puglisi'), ('FA', 'Rubén Estévez Miguel'),
             ('ESCAÑOS EN BLANCO', 'María López Castellanos'))),
 '34': (EE, L(('PSOE', 'María Luz Martínez Seijo'), ('SALF', 'Fernando Martínez Torres'), ('VOX', 'Matías Recio Juárez'), ('PODEMOS', 'Alberto Pozo Díez'), ('FE de las JONS', 'Luis Miguel Pérez González'),
             ('PCTE', 'Aitor Vega García'), ('FO', 'Yeray Yáñez Ibáñez'), ('PP', 'Milagros Marcos Ortega'), ('MUNDO+JUSTO', 'Miren Josu Moneo Viloria'), ('ESCAÑOS EN BLANCO', 'Alicia Calzada Bujedo'),
             ('FA', 'Ana Belén Collantes Martín'))),
 '37': (EE, L(('FO', 'Marco Pedro Pérez Graña'), ('PSOE', 'David Serrada Pariente'), ('PODEMOS', 'María Aurora Zarco Blanco'), ('SALF', 'Luis Eduardo Riesco Lorenzo'), ('VOX', 'Laura Magdalena Miguel'),
             ('PACMA', 'Jorge Martín García'), ('PREPAL', 'Rafael Diego Núñez'), ('PCTE', 'Mario López Pascua'), ('PP', 'María del Carmen Seguín Kattán'), ('FA', 'Miriam Ruiz Arias'))),
 '40': (EE, L(('FO', 'Pablo de Mercado Alcalde'), ('PSOE', 'José Luis Aceves Galindo'), ('MUNDO+JUSTO', 'José Manuel Eizaguirre Fernández-Palacios'), ('SALF', 'Jesús Ángel Gascón Ames'),
             ('VOX', 'Gonzalo Babe Romero'), ('PACMA', 'Rosa María Díaz García'), ('PODEMOS', 'María Soledad Alba Monfort'), ('PCTE', 'Carlos Presa Irazábal'), ('FA', 'Víctor Javier Borreguero García'),
             ('PP', 'Pablo Pérez Coronado'))),
 '42': (EE, L(('FO', 'Diego Gallardo de la Fuente'), ('PCTE', 'Ezequiel Blanco López'), ('MUNDO+JUSTO', 'Rafael Alfonso Gómez Aguilar'), ('PSOE', 'Luis Alfonso Rey de las Heras'),
             ('SALF', 'José María Lorenzo Córdoba Alós'), ('VOX', 'Andrea Martínez Ruiz'), ('SORIA ¡YA!', 'Juan Antonio Palomar Sicilia', 'SORIA ¡YA!'), ('FA', 'Ángel Alberto Flores Gaitán'),
             ('PP', 'Tomás Cabezón Casas'), ('ESCAÑOS EN BLANCO', 'Luis García Molina'), ('PODEMOS', 'María Luisa Muñoz González'))),
 '47': (EE, L(('PSOE', 'Óscar Puente Santiago'), ('FO', 'Alejandro López De Diego'), ('SALF', 'Onecha López Merino'), ('PANCAL-URCI', 'María Yolanda Pérez López'), ('MUNDO+JUSTO', 'Eider Rodríguez Camps'),
             ('VOX', 'Pablo Sáez Alonso-Muñumer'), ('PACMA', 'María Hernández García'), ('FALANGE', 'Francisco Javier Sanz Méndez'), ('PODEMOS', 'María Almudena Villareal Vidal'),
             ('PCTE', 'Ignacio Javier Díez Arauz'), ('PP', 'María Pardo Álvarez'), ('FA', 'Abdul Gadiri Diallo Bah'), ('ESCAÑOS EN BLANCO', 'Katia García Casas'))),
 '49': (EE, L(('PSOE', 'Antidio Fagúndez Campo'), ('PCTE', 'Sócrates Fernández López'), ('PREPAL', 'Francisco Iglesias Carreño'), ('SALF', 'María Cynthia Garrote Ballestero'), ('VOX', 'Miguel Suárez Arca'),
             ('PODEMOS', 'Miguel Ángel Guerra Cosme'), ('PP', 'María Montserrat Chimeno Viñas'), ('FO', 'Francisco Ramos Orgaz'), ('FA', 'Diego Bernardo Rosas'))),
 '28': ('BOE, vía Demócrata', L(('FO', 'Roberto Vaquero Arribas'), ('PSOE', 'Pedro Sánchez Pérez-Castejón'), ('FE de las JONS', 'Norberto Pedro Pico Sanabria'), ('VOX', 'Santiago Abascal Conde'),
             ('PCTE', 'Eva García de Madariaga Delgado'), ('PH', 'José Luis Álvarez Cedena', 'PARTIDO HUMANISTA'), ('D21', 'Miryan Mercedes González Durántez'), ('IE', 'Luis María Pardo Rodríguez', 'IUSTITIA EUROPA'),
             ('MUNDO+JUSTO', 'José Manuel Romero Melero'), ('SALF', 'Luis Alvise Pérez Fernández'), ('PP', 'Alberto Núñez Feijóo'), ('PACMA', 'Asier Esparza Billalabeitia'),
             ('FA', 'Emilio Delgado Orgaz'), ('PODEMOS', 'Irene Montero Gil'))),
})
