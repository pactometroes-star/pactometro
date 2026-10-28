/**
 * Encuesta 29-N y noche electoral · pactómetro.es
 * Titular: Javier Pereiro Pérez · pactometroes@gmail.com
 *
 * Guarda en esta hoja de cálculo las respuestas anónimas de la encuesta de la web.
 * No recibe ni guarda nombre, correo ni dirección IP: solo la intención de voto, el recuerdo de voto
 * (opcional), la provincia (obligatoria) y la fecha con la hora redondeada.
 *
 * Horario: acepta respuestas desde el 13 de octubre hasta el domingo 22 de noviembre de 2026
 * a las 20:00 (hora peninsular). Las respuestas de prueba (dirección de la web con #encuesta-prueba)
 * se aceptan cualquier día y van a la pestaña «Pruebas», que no cuenta en el recuento.
 *
 * Seguridad (versión 2, 14-10-2026):
 *   - Solo guarda la respuesta si llega con el consentimiento expreso marcado en la web (art. 9.2.a RGPD).
 *   - La provincia y el recuerdo de voto tienen que ser exactamente una de las opciones de la web.
 *   - Una intención de voto que no esté en la lista (por ejemplo, un partido añadido en la web y no aquí)
 *     no se pierde: va a la pestaña «Revisar», que no cuenta en el recuento, para que la compruebes.
 *   - Ningún valor puede empezar por = + - @, así que nadie puede colar fórmulas en la hoja.
 *   - Campo trampa contra robots y un límite de respuestas por minuto contra envíos masivos.
 *
 * Instalación, una sola vez (los pasos completos están en LEEME.md):
 *   1. Elige la función «configurar» arriba y pulsa ▶ Ejecutar. Autoriza el acceso.
 *   2. Implementar → Nueva implementación → tipo «Aplicación web».
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → Implementar.
 *   3. Copia la URL que termina en /exec y pégala en config.js de la web.
 *
 * Para ver los resultados: abre esta hoja. La pestaña «Respuestas» tiene una fila por
 * respuesta y la pestaña «Recuento» los totales (menú Encuesta 29-N → Actualizar recuento).
 *
 * Si ya habías pegado una versión anterior: sustitúyela por esta, guarda y ve a
 * Implementar → Gestionar implementaciones → editar (lápiz) → Versión: nueva versión → Implementar.
 * Así se mantiene la misma URL.
 *
 * Noche electoral (versión 3, 22-10-2026): la página pactometro.es/29n/resultados/ y el widget leen la pestaña
 * «Directo» de esta hoja (con ?directo=1 en la misma URL /exec). Créala con el menú Encuesta 29-N → «Preparar la
 * pestaña Directo». Esa noche basta con escribir el porcentaje escrutado y los escaños (y, si se quiere, los votos)
 * de cada candidatura: la web lo muestra en menos de un minuto a todos los visitantes. La hora se pone sola.
 *
 * Candidaturas reales (versión 4, 27-10-2026): la web enseña en cada provincia solo los partidos que se presentan allí
 * y añade Frente Obrero, Se Acabó La Fiesta, Unidad del Pueblo Canario, Adelante Andalucía, Coalición Existe y
 * Geroa Bai. Las coaliciones regionales se guardan con el nombre de siempre: «Compromís» es Compromís-Front Valencià,
 * «Frente Amplio» incluye sus marcas de Aragón, Andalucía y Baleares, «UPN» es UPN-PP y «Coalición Canaria» va con
 * Primero Canarias. Las respuestas que llegaron antes con esas opciones nuevas están en «Revisar».
 *
 * Candidaturas presentadas (versión 5, 28-10-2026): la web sigue ya las candidaturas que publicó el BOE el 28 de octubre.
 * Añade Teruel Existe (solo Teruel: Aragón Existe retiró sus listas de Zaragoza y Huesca, así que «Coalición Existe»
 * deja de salir en la web, aunque se sigue aceptando por las respuestas que ya llegaron) y Soria ¡Ya! (solo Soria; se
 * guarda como «Soria Ya», sin signos de exclamación, porque la hoja no admite esos caracteres).
 *
 * Conservación: la política de privacidad de la web dice que las respuestas individuales se borran
 * como tarde el 31 de mayo de 2027. Ese día (o antes) usa el menú Encuesta 29-N → «Borrar respuestas
 * individuales»: guarda antes el recuento con los totales y después vacía las filas.
 */

const APERTURA = new Date('2026-10-12T22:00:00Z'); // 13 de octubre, 00:00 hora peninsular
const CIERRE = new Date('2026-11-22T19:00:00Z');   // domingo 22 de noviembre, 20:00 hora peninsular
const MAX_POR_MINUTO = 120;                        // freno contra envíos masivos (todas las respuestas juntas)
const HOJA_RESPUESTAS = 'Respuestas';
const HOJA_PRUEBAS = 'Pruebas';
const HOJA_REVISAR = 'Revisar';
const HOJA_RECUENTO = 'Recuento';
const HOJA_DIRECTO = 'Directo';
const CABECERA = ['Fecha (hora redondeada)', 'Intención de voto 29-N', 'Recuerdo de voto 23-J', 'Provincia'];

// Opciones de la web (pactometro.es, vista «Encuesta»). Si cambian allí, cámbialas también aquí.
const INTENCIONES = ['PP', 'PSOE', 'Vox', 'Frente Amplio', 'Democracia 21', 'Podemos', 'Se Acabó La Fiesta', 'Frente Obrero',
  'ERC', 'Junts', 'EH Bildu', 'PNV', 'BNG', 'Compromís', 'Coalición Canaria', 'Unidad del Pueblo Canario', 'UPN', 'Geroa Bai',
  'Adelante Andalucía', 'Teruel Existe', 'Soria Ya', 'Coalición Existe', 'Otro partido', 'En blanco', 'Nulo', 'No votaré', 'Aún no lo sé'];
const RECUERDOS = ['PP', 'PSOE', 'Vox', 'Sumar', 'ERC', 'Junts', 'EH Bildu', 'PNV', 'BNG', 'Coalición Canaria', 'UPN',
  'Otro partido', 'En blanco o nulo', 'No votó', 'No tenía edad para votar'];
const PROVINCIAS = ['A Coruña', 'Albacete', 'Alicante/Alacant', 'Almería', 'Araba/Álava', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón/Castelló', 'Ceuta', 'Ciudad Real', 'Córdoba',
  'Cuenca', 'Gipuzkoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja',
  'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia',
  'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo',
  'Valencia/València', 'Valladolid', 'Zamora', 'Zaragoza'];

/** Recibe cada respuesta enviada desde la web. */
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.web) return texto_('ok');                     // campo trampa: solo lo rellenan los robots
  if (p.consentimiento !== '1') return texto_('sin-consentimiento');
  const prueba = p.prueba === '1';
  const ahora = new Date();
  if (!prueba && ahora < APERTURA) return texto_('aun-no-abierta');
  if (!prueba && ahora >= CIERRE) return texto_('cerrada');
  const intencion = limpia_(p.intencion);
  const provincia = String(p.provincia || '').trim();
  const recuerdo = String(p.recuerdo || '').trim();
  if (!intencion || PROVINCIAS.indexOf(provincia) < 0) return texto_('error');
  if (recuerdo && RECUERDOS.indexOf(recuerdo) < 0) return texto_('error');
  const fila = [Utilities.formatDate(ahora, 'Europe/Madrid', 'yyyy-MM-dd HH:00'), intencion, recuerdo, provincia];
  const destino = prueba ? HOJA_PRUEBAS : INTENCIONES.indexOf(intencion) >= 0 ? HOJA_RESPUESTAS : HOJA_REVISAR;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return texto_('ocupado');
  try {
    if (!prueba && demasiadas_()) return texto_('demasiadas');
    hoja_(destino).appendRow(fila);
  } finally {
    lock.releaseLock();
  }
  return texto_('ok');
}

/** Con ?directo=1 devuelve los resultados de la pestaña «Directo» (datos públicos); si no, solo confirma que funciona.
    Nunca muestra las respuestas de la encuesta. */
function doGet(e) {
  if (e && e.parameter && e.parameter.directo === '1') return directo_();
  return texto_('Encuesta de pactómetro.es: funcionando.');
}

/** Escrutinio de la noche electoral en el formato que espera la web. Se guarda 30 segundos en caché. */
function directo_() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('directo');
  if (guardado) return json_(guardado);
  const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_DIRECTO);
  if (!h) return json_('{"partidos":[]}');
  const v = h.getDataRange().getValues();
  const num = function (x) {
    if (typeof x === 'number') return x;
    let t = String(x || '').trim().replace(/\s|%/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '');   // 1.234.567 (miles con punto)
    return parseFloat(t.replace(',', '.')) || 0;
  };
  const partidos = v.slice(6).filter(function (f) { return String(f[0]).trim(); }).slice(0, 60).map(function (f) {
    const color = String(f[3] || '').trim();
    const p = {sig: String(f[0]).trim().slice(0, 40), esc: Math.max(0, Math.round(num(f[1])))};
    if (num(f[2]) > 0) p.votos = Math.round(num(f[2]));
    if (/^#[0-9a-fA-F]{6}$/.test(color)) p.color = color;
    return p;
  });
  const esFecha = function (x) { return Object.prototype.toString.call(x) === '[object Date]' && !isNaN(x); };
  const act = v[3] && esFecha(v[3][1]) ? v[3][1].toISOString() : new Date().toISOString();
  const salida = JSON.stringify({actualizado: act, escrutado: num(v[0] && v[0][1]), participacion: num(v[1] && v[1][1]) || null,
    fuente: String((v[2] && v[2][1]) || 'Ministerio del Interior (escrutinio provisional)').slice(0, 120), partidos: partidos});
  cache.put('directo', salida, 30);
  return json_(salida);
}

function json_(t) {
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.JSON);
}

/** Al editar la pestaña «Directo», apunta la hora y renueva la caché para que la web lo muestre enseguida. */
function onEdit(e) {
  const h = e && e.range && e.range.getSheet();
  if (!h || h.getName() !== HOJA_DIRECTO || e.range.getRow() === 4) return;
  h.getRange(4, 2).setValue(new Date());
  CacheService.getScriptCache().remove('directo');
}

/** Crea la pestaña «Directo» con su plantilla (escrutado, participación, fuente, hora y tabla de candidaturas). */
function prepararDirecto() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA_DIRECTO);
  if (!h) h = libro.insertSheet(HOJA_DIRECTO);
  h.getRange(1, 1, 4, 2).setValues([['Escrutado (%)', 0], ['Participación (%)', ''], ['Fuente', 'Ministerio del Interior (escrutinio provisional)'], ['Actualizado', new Date()]]);
  h.getRange(1, 1, 4, 1).setFontWeight('bold');
  h.getRange(6, 1, 1, 4).setValues([['Candidatura', 'Escaños', 'Votos (opcional)', 'Color (opcional, #rrggbb)']]).setFontWeight('bold');
  h.setFrozenRows(6);
  h.setColumnWidths(1, 4, 190);
  h.getRange(4, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  SpreadsheetApp.getUi().alert('Pestaña «Directo» preparada. La noche del 29-N escribe el porcentaje escrutado en B1 y, desde la fila 7, cada candidatura con sus escaños.');
}

/** Admite letras, números, espacios y puntuación básica. Nunca empieza por = + - @, así que no puede colar fórmulas. */
function limpia_(valor) {
  const s = String(valor || '').trim().slice(0, 60);
  return /^[\p{L}\p{N}][\p{L}\p{N} .,'’()\/·-]*$/u.test(s) ? s : '';
}

/** Cuenta las respuestas del minuto en curso (se llama con el bloqueo puesto). */
function demasiadas_() {
  const cache = CacheService.getScriptCache();
  const clave = 'n' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(clave) || 0) + 1;
  cache.put(clave, String(n), 120);
  return n > MAX_POR_MINUTO;
}

function texto_(t) {
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT);
}

function hoja_(nombre) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(nombre);
  if (!h) {
    configurar();
    h = libro.getSheetByName(nombre);
  }
  return h;
}

/** Crea las pestañas «Respuestas», «Recuento», «Pruebas» y «Revisar». Ejecútala una vez antes de implementar. */
function configurar() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  [[HOJA_RESPUESTAS, 0], [HOJA_PRUEBAS, 2], [HOJA_REVISAR, 3]].forEach(function (par) {
    if (libro.getSheetByName(par[0])) return;
    const h = libro.insertSheet(par[0], Math.min(par[1], libro.getSheets().length));
    h.getRange(1, 1, 1, CABECERA.length).setValues([CABECERA]).setFontWeight('bold');
    h.setFrozenRows(1);
    h.setColumnWidths(1, CABECERA.length, 230);
  });
  if (!libro.getSheetByName(HOJA_RECUENTO)) libro.insertSheet(HOJA_RECUENTO, 1);
  actualizarRecuento();
}

/** Añade el menú «Encuesta 29-N» al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Encuesta 29-N')
    .addItem('Actualizar recuento', 'actualizarRecuento')
    .addItem('Preparar la pestaña Directo (noche electoral)', 'prepararDirecto')
    .addSeparator()
    .addItem('Borrar respuestas individuales…', 'borrarRespuestasIndividuales')
    .addToUi();
}

/** Guarda el recuento final y vacía las respuestas individuales (política de privacidad: como tarde el 31-5-2027). */
function borrarRespuestasIndividuales() {
  const ui = SpreadsheetApp.getUi();
  const ok = ui.alert('Borrar respuestas individuales',
    'Se actualizará la pestaña «Recuento» con los totales y después se borrarán todas las filas de «Respuestas», «Pruebas» y «Revisar». No se puede deshacer. ¿Continuar?',
    ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  actualizarRecuento();
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  [HOJA_RESPUESTAS, HOJA_PRUEBAS, HOJA_REVISAR].forEach(function (n) {
    const h = libro.getSheetByName(n);
    if (h && h.getLastRow() > 1) h.deleteRows(2, h.getLastRow() - 1);
  });
  ui.alert('Hecho: solo quedan los totales de la pestaña «Recuento».');
}

/** Rehace la pestaña «Recuento»: totales, cruce por provincia y cruce con el recuerdo de voto. */
function actualizarRecuento() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const resp = libro.getSheetByName(HOJA_RESPUESTAS);
  const filas = resp ? resp.getDataRange().getValues().slice(1).filter(function (f) { return f[1]; }) : [];
  const hoja = libro.getSheetByName(HOJA_RECUENTO) || libro.insertSheet(HOJA_RECUENTO, 1);
  hoja.clear();
  const total = filas.length;
  const etiqueta = function (v, vacio) { return v ? String(v) : vacio; };

  const cuenta = {};
  filas.forEach(function (f) { cuenta[f[1]] = (cuenta[f[1]] || 0) + 1; });
  const opciones = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; });

  let fila = 1;
  hoja.getRange(fila, 1).setValue('Respuestas totales: ' + total + ' · actualizado el ' +
    Utilities.formatDate(new Date(), 'Europe/Madrid', 'dd/MM/yyyy HH:mm')).setFontWeight('bold');
  fila += 2;

  // 1. Intención de voto
  hoja.getRange(fila, 1).setValue('Intención de voto').setFontWeight('bold');
  fila++;
  if (!total) {
    hoja.getRange(fila, 1).setValue('Todavía no hay respuestas.');
    return;
  }
  hoja.getRange(fila, 1, 1, 3).setValues([['Respuesta', 'Respuestas', '%']]).setFontWeight('bold');
  fila++;
  const tabla = opciones.map(function (o) { return [o, cuenta[o], cuenta[o] / total]; });
  hoja.getRange(fila, 1, tabla.length, 3).setValues(tabla);
  hoja.getRange(fila, 3, tabla.length, 1).setNumberFormat('0.0%');
  fila += tabla.length + 2;

  // 2. y 3. Cruces
  const cruce = function (titulo, col, vacio) {
    const grupos = {};
    filas.forEach(function (f) {
      const g = etiqueta(f[col], vacio);
      grupos[g] = grupos[g] || {};
      grupos[g][f[1]] = (grupos[g][f[1]] || 0) + 1;
    });
    const claves = Object.keys(grupos).sort(function (a, b) { return a.localeCompare(b, 'es'); });
    hoja.getRange(fila, 1).setValue(titulo).setFontWeight('bold');
    fila++;
    const cab = [col === 3 ? 'Provincia' : 'Recuerdo de voto 23-J'].concat(opciones, ['Total']);
    hoja.getRange(fila, 1, 1, cab.length).setValues([cab]).setFontWeight('bold');
    fila++;
    const datos = claves.map(function (g) {
      const n = opciones.map(function (o) { return grupos[g][o] || 0; });
      return [g].concat(n, [n.reduce(function (a, b) { return a + b; }, 0)]);
    });
    hoja.getRange(fila, 1, datos.length, cab.length).setValues(datos);
    fila += datos.length + 2;
  };
  cruce('Intención de voto por provincia', 3, 'Sin indicar');
  cruce('Intención de voto según el recuerdo de voto del 23-J', 2, 'Sin indicar');
  hoja.autoResizeColumn(1);
}
