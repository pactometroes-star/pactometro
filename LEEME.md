# pactómetro.es: cómo ponerla en marcha

Titular de la web y del dominio: **Javier Pereiro Pérez** · Contacto: **pactometroes@gmail.com**

Este ZIP tiene tres cosas:

| Archivo | Qué es |
|---|---|
| `pactometro.es/` | La web completa. Es la carpeta que se sube al alojamiento |
| `LEEME.md` | Esta guía |
| `encuesta-google-apps-script.gs` | El programa que guarda las respuestas de la encuesta en una hoja de Google (paso 4) |

Dentro de `pactometro.es/`:

| Archivo | Qué es |
|---|---|
| `index.html` | La web: portada con buscador, pactómetros de todas las instituciones, encuesta, histórico, comparador, fuentes y aviso legal |
| `config.js` | Configuración de la encuesta: aquí va la dirección de tu hoja de Google (paso 4) |
| `data/` | Datos electorales. `data/mun/` tiene un archivo por provincia con todos sus municipios de 1979 a 2023 |
| `img/`, `favicon.ico`, `site.webmanifest` | Logotipos, icono de la pestaña e iconos para móvil |
| `CNAME`, `robots.txt`, `sitemap.xml` | Dominio para GitHub Pages e indexación en buscadores |

La web no necesita servidor ni base de datos: sirve cualquier alojamiento de páginas estáticas.

## 1. Registra el dominio a tu nombre

El 8 de octubre de 2026 ni `pactómetro.es` ni `pactometro.es` estaban registrados.

1. Elige un agente registrador acreditado para .es (la lista oficial está en dominios.es, de Red.es). Dos opciones españolas:
   - **DonDominio**: unos 7 € al año, tanto el alta como la renovación.
   - **Dinahosting** (empresa de Santiago de Compostela): unos 10 € el primer año y unos 14 € las renovaciones.

   Son precios orientativos de octubre de 2026: comprueba el precio final, con IVA, al comprar.
2. Busca `pactómetro.es`. Si el buscador no admite la tilde, escribe `xn--pactmetro-86a.es`: es el mismo dominio.
3. Registra también `pactometro.es` (sin tilde), porque mucha gente lo escribirá así, y redirígelo al principal.
4. Titular: **Javier Pereiro Pérez**, con tu DNI. Correo de contacto: **pactometroes@gmail.com**. Comprueba que el titular eres tú y no el registrador: eso es lo que te da la propiedad del dominio.

## 2. Publica la web (gratis)

Puedes publicarla ya, antes de tener el dominio: tendrá una dirección provisional gratuita.

**GitHub Pages (recomendado)**

Es gratis, aguanta bien los picos de visitas (100 GB de tráfico al mes) y, si conectas tu cuenta de GitHub a Claude, puedo subir yo los cambios y la web se actualiza sola.

1. Crea una cuenta en github.com con pactometroes@gmail.com.
2. Pulsa *New repository*, llámalo `pactometro`, márcalo como *Public* y pulsa *Create repository*.
3. Pulsa *uploading an existing file*. Abre la carpeta `pactometro.es` en tu ordenador, selecciona todo lo que hay dentro (también las carpetas `data` e `img`) y arrástralo a la página. Pulsa *Commit changes*.
4. Ve a *Settings → Pages*. En *Branch* elige `main` y `/ (root)` y pulsa *Save*. En uno o dos minutos la web estará en `https://tu-usuario.github.io/pactometro/`.
5. Cuando tengas el dominio, en esa misma pantalla escribe `pactometro.es` en *Custom domain* y pulsa *Save*. Cuando lo permita, marca *Enforce HTTPS*.

**Cloudflare Pages (alternativa, con tráfico ilimitado)**

También es gratis y no limita el tráfico, pero para usar el dominio tienes que pasar su DNS a Cloudflare (cambiar los dos «servidores de nombres» en el registrador). Pasos: crea una cuenta en cloudflare.com, añade el dominio y copia sus dos servidores de nombres en el registrador. Después ve a *Workers & Pages → Create → Pages → Upload assets*, arrastra la carpeta `pactometro.es` y, en *Custom domains*, añade el dominio.

**Por qué no Netlify:** para las cuentas nuevas (desde septiembre de 2025), su plan gratuito funciona con 300 créditos al mes. Cada publicación gasta 15 y cada GB de tráfico 20, y cuando se acaban la web queda en pausa hasta el mes siguiente. Es un riesgo en una noche electoral.

## 3. Apunta el dominio al alojamiento

Con **GitHub Pages**, en el panel de DNS de tu registrador:

- Cuatro registros `A` para `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
- Un registro `CNAME` para `www` → `tu-usuario.github.io`.

Con **Cloudflare Pages** no hace falta: basta con el cambio de servidores de nombres del paso anterior.

Si registraste también `pactometro.es` (sin tilde), configura en el registrador una redirección de ese dominio a `https://pactómetro.es`.

Comprueba estas direcciones en la ayuda del servicio antes de guardarlas, por si han cambiado. Los cambios tardan de minutos a unas horas, y el HTTPS se activa gratis cuando el dominio ya apunta al alojamiento.

## 4. Activa la encuesta del 29-N (10 minutos)

**Horario:** la encuesta se abre en cuanto `config.js` tiene la URL de la hoja y admite respuestas hasta el **domingo 22 de noviembre a las 20:00** (hora peninsular). Mientras `config.js` esté vacío no sale en el menú. Después de las 20:00 del 22 muestra «Encuesta cerrada». La hoja de Google también rechaza cualquier respuesta fuera de ese plazo, aunque alguien tenga mal la hora de su ordenador.

Las respuestas se guardan en una hoja de cálculo privada de tu cuenta de Google. Nadie más puede verla, y la web nunca muestra el recuento.

1. Entra en Google Drive con **pactometroes@gmail.com** y crea una hoja de cálculo nueva. Llámala «Encuesta 29-N».
2. En la hoja, abre **Extensiones → Apps Script**. Borra lo que aparece y pega todo el contenido de `encuesta-google-apps-script.gs`. Pulsa el icono de guardar.
3. En la lista de funciones de arriba elige **configurar** y pulsa **▶ Ejecutar**. Google pedirá permiso: elige tu cuenta y, si sale «Google no ha verificado esta aplicación», pulsa *Configuración avanzada → Ir a… (no seguro)* y luego *Permitir*. Es normal: la aplicación es tuya y solo escribe en esta hoja.
4. Pulsa **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web**. Pon *Ejecutar como: Yo* y *Quién tiene acceso: Cualquier usuario*. Pulsa *Implementar* y copia la **URL de la aplicación web** (termina en `/exec`).
5. Pega esa URL entre las comillas de `encuestaURL: ''` en el archivo `config.js` de la web. En GitHub: abre `config.js` en el repositorio, pulsa el lápiz, pega la URL y pulsa *Commit changes*. (O mándame la URL y lo dejo hecho yo.)
6. Haz una prueba antes del 22: abre tu web añadiendo `#encuesta-prueba` al final de la dirección (por ejemplo, `https://pactometro.es/#encuesta-prueba`) y envía una respuesta. En unos segundos debe aparecer una fila en la pestaña «Pruebas», que no cuenta en el recuento. Esa dirección de prueba funciona cualquier día.

**Dónde ver los resultados:** en esa hoja. La pestaña «Respuestas» tiene una fila por respuesta (fecha con la hora redondeada, intención de voto, recuerdo de voto del 23-J y provincia). La pestaña «Recuento» tiene los totales y los cruces por provincia y por recuerdo de voto: actualízala con el menú **Encuesta 29-N → Actualizar recuento**. También puedes descargar la hoja (*Archivo → Descargar*) y pasármela para analizarla.

**Si cambias el script** más adelante, en Apps Script usa *Implementar → Gestionar implementaciones → editar → Versión: nueva versión*. Así se mantiene la misma URL.

**Versión 2 del script (14-10-2026):** solo guarda respuestas que llegan con la casilla de consentimiento marcada, comprueba que la provincia y el recuerdo de voto son opciones de la web, manda a la pestaña «Revisar» las intenciones de voto que no reconoce (sin contarlas) y limita las respuestas por minuto. Si cambia la lista de partidos de la encuesta, hay que cambiar también la lista `INTENCIONES` del script y volver a implementarlo; si no, esas respuestas irán a «Revisar».

**Conservación:** la política de privacidad dice que las respuestas individuales se borran como tarde el **31 de mayo de 2027**. Usa el menú *Encuesta 29-N → Borrar respuestas individuales…*: guarda los totales en «Recuento» y vacía el resto.

**Antes de publicar resultados, ten en cuenta la ley electoral:**
- No se pueden publicar ni difundir encuestas electorales los cinco días anteriores a la votación, del 24 al 28 de noviembre (art. 69.7 de la LOREG). Con la encuesta cerrada el domingo 22 a las 20:00, el último día para publicar sus resultados es el lunes 23.
- Una encuesta publicada en periodo electoral debe ir acompañada de su ficha técnica: quién la ha hecho, sus características técnicas y el texto íntegro de las preguntas. La Junta Electoral Central vigila el cumplimiento.
- Es una encuesta abierta (responde quien quiere), así que conviene presentarla como no representativa y no como una estimación de voto.

## 5. Cambios en la web

Pídemelos en el chat de Claude (en el mismo o en uno nuevo, pegando el enlace de la página publicada).

- **Con tu GitHub conectado a Claude:** subo yo los cambios al repositorio y la web se actualiza sola en uno o dos minutos.
- **Sin conectarlo:** te paso un ZIP nuevo y subes los archivos cambiados al repositorio (*Add file → Upload files*), o en Cloudflare Pages vuelves a arrastrar la carpeta.

## 6. Datos que habrá que actualizar

- **Candidaturas del 29-N:** están en `data/candidaturas.json` (ver el apartado 10). Desde el 28-10-2026 son las presentadas que publicó el BOE; las proclamadas salen en el BOE del 3 de noviembre y entonces se revisan también la encuesta y la versión del script.
- **Resultados del 29-N:** cuando el Ministerio del Interior publique los resultados oficiales, se añaden al Congreso y al histórico.
- **Municipales y autonómicas de mayo de 2027:** mismo procedimiento con los nuevos ficheros oficiales.

## 7. Derechos, aviso legal y seguridad

- El diseño, el código y la recopilación de datos son © 2026 Javier Pereiro Pérez. La web lo indica en el pie y en las páginas «Aviso legal», «Privacidad» y «Cookies».
- La web no usa cookies. Si algún día añades publicidad o analítica, antes hay que poner un gestor de consentimiento (con botón de rechazar), actualizar la política de cookies y añadir al aviso legal tu NIF y un domicilio.
- `index.html` lleva una política de seguridad de contenidos (CSP): el navegador solo ejecuta el código de la propia web y la encuesta solo puede enviar datos a Google Apps Script. Si añades un script externo (publicidad, analítica, un mapa…), hay que añadir su dominio a esa política o no funcionará.
- Los resultados oficiales proceden del Ministerio del Interior y del Congreso de los Diputados; hay que citar siempre la fuente, como ya hace la web.
- Los escaños del Congreso de 1989 y 1993 proceden del proyecto *listas-electorales* (licencia CC BY 4.0), que exige atribución; ya figura en «Fuentes».
- Si algún día pones publicidad o cobras por algo en la web, la Ley 34/2002 (LSSI) obliga a añadir tu NIF y un domicilio en el aviso legal.

## 8. Páginas, compartir, widget y noche electoral (desde el 22-10-2026)

**Una dirección por página.** Cada institución tiene su propia dirección, con título, descripción y los datos en texto para Google:
`/congreso/`, `/congreso/1982/`, `/parlamento/galicia/`, `/diputacion/lugo/`, `/ayuntamiento/lugo/`, `/provincia/lugo/`, `/29n/`, `/29n/programas/`, `/29n/resultados/`…
Son más de 8.300 páginas. Los enlaces antiguos con almohadilla (`pactometro.es/#encuesta`, `#mun-27028`) siguen funcionando: llevan a la dirección nueva.

- **Search Console:** en «Sitemaps», vuelve a enviar `sitemap.xml` (ahora tiene todas las direcciones). Google tarda unos días o semanas en indexarlas.
- **Programas electorales:** la lista está en `data/programas.json` (estado, fecha y enlaces oficiales). Se actualiza a medida que los partidos los publiquen.

**Compartir.** Cada pactómetro tiene un botón «Compartir»: enlace con la coalición marcada (en el simulador, también los escaños), WhatsApp, Telegram, X, Bluesky, LinkedIn, correo, una imagen PNG de 1200 × 630 y el código para insertar el pactómetro en otra web.

**Widget para otras webs.** `https://pactometro.es/widget/?i=…` muestra el hemiciclo de cualquier institución (y la coalición, si se indica). No usa cookies. El código para copiarlo sale en «Compartir → Insertar en tu web». Ejemplos:
`?i=congreso`, `?i=mun-27028&si=PP,BNG`, `?i=auto-galicia`, `?i=directo` (resultados de la noche electoral).

**Noche electoral (29-N).** La página `/29n/resultados/` y el widget `?i=directo` leen la pestaña «Directo» de la hoja de Google de la encuesta y se actualizan solos cada minuto a partir de las 20:00.

1. Antes del 29-N: pega la **versión 3** de `encuesta-google-apps-script.gs` en Apps Script y publica una nueva versión (*Implementar → Gestionar implementaciones → editar → Versión: nueva versión*). La URL no cambia.
2. Recarga la hoja y usa el menú *Encuesta 29-N → Preparar la pestaña Directo (noche electoral)*.
3. La noche del 29-N: escribe en la pestaña «Directo» el porcentaje escrutado (B1), la participación (B2) y, desde la fila 7, cada candidatura con sus escaños (y, si quieres, sus votos). La web lo muestra en menos de un minuto; la hora se pone sola.

Si la conexión automática con los datos del Ministerio está disponible, se podrá rellenar la pestaña sola (los datos en directo del Ministerio solo se entregan a medios acreditados que lo pidieran antes del 28 de octubre).


## 9. Mapa electoral (desde el 22-10-2026)

`/mapa/` es un mapa interactivo de España con cuatro niveles: **General** (Congreso por provincias, elecciones generales desde 1977, menos 1989 y 1993, que no tienen datos por provincia), **Comunidades** (últimas elecciones de cada parlamento o la situación tras las autonómicas de cada mayo desde 1983), **Provincias** (diputaciones, juntas generales y, en Canarias y Baleares, un cabildo o un consell por isla, desde 1987) y **Ayuntamientos** (los 8.131 municipios, municipales desde 1979). Cada lugar lleva el color de la candidatura con más escaños (si empatan, la más votada); la opción «Solo mayorías absolutas» deja en gris el resto. Al pulsar un lugar se ve su resultado y el enlace a su página. La dirección guarda lo que se está viendo, así que se puede compartir: `/mapa/?nivel=ayuntamientos&id=27028`, `/mapa/?nivel=ayuntamientos&prov=27`, `/mapa/?eleccion=1982`, `/mapa/?nivel=comunidades&id=11`.

- **Límites:** Instituto Geográfico Nacional (CC BY 4.0) en la versión simplificada de *es-atlas* (MIT). La atribución figura bajo el mapa y en «Fuentes».
- **Ficheros:** `data/mapa/espana.json` (comunidades, provincias e islas, 135 KB) y `data/mapa/municipios.json` (1,1 MB; solo se descarga al abrir el nivel de ayuntamientos) los genera `scripts/mapa.mjs` (Node, con los paquetes `es-atlas`, `d3-geo`, `d3-composite-projections`, `topojson-client` y `topojson-simplify`); solo hay que volver a generarlos si cambian los municipios. Los ganadores de cada municipal (`data/mapa/ayto-AAAA.json`) los escribe `build_dist.py` con los datos de `data/mun/`.
- **Nuevas elecciones:** las generales del 29-N aparecerán solas en el nivel General cuando se añadan a `generales.json` con sus resultados por provincia; las municipales de 2027 necesitan añadir el año a `MUNICIPALES` en el código.
- **Familias políticas:** el mapa colorea por familia. La regla de Compromís solo vale ya para las listas valencianas («Compromiso por…» o «Compromís amb Formentera» son otras candidaturas); `scripts/corregir_compromis.py` aplicó la corrección a los datos.

## 10. Candidaturas del 29-N (desde el 28-10-2026)

`data/candidaturas.json` alimenta «Quién se presenta» en `/29n/` y la tabla «Candidaturas al Congreso el 29-N» de cada página de provincia (`/provincia/…/`).

- `congreso`, `solos` y `senado`: coaliciones al Congreso, quién va por su cuenta y pactos para el Senado, con sus fuentes.
- `provincias`: para cada circunscripción (código INE, `"01"`–`"52"`), la lista de candidaturas presentadas según el BOE del 28-10-2026 (BOE-A-2026-22607). En cada una, `s` son las siglas, `n` el nombre completo, `f` la familia (para el color), `c` el cabeza de lista y `a: 1` marca un cabeza de lista anunciado por el partido que aún no se ha comprobado en el BOE (sale con asterisco). Se ordenan así: primero las de los partidos con diputados en el Congreso saliente y después el resto por orden alfabético.
- **Encuesta:** en cada provincia solo salen las candidaturas que se presentan allí (`ENC.partidos` en el código: `p` = solo en esas provincias, `sin` = en todas menos esas, `alias` = el nombre que usan allí). Si se añade una opción, hay que añadirla también a `INTENCIONES` en `encuesta-google-apps-script.gs` (versión 5: Teruel Existe y Soria ¡Ya!, que se guarda como «Soria Ya» porque la hoja no admite signos de exclamación) y publicar una nueva versión del script.
- **3 de noviembre:** el BOE publica las candidaturas proclamadas. Entonces se sustituyen las presentadas, se completan los cabezas de lista que faltan y se quita el asterisco a los comprobados.
