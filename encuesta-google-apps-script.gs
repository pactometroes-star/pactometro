/**
 * Encuesta 29-N · pactómetro.es
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
const CABECERA = ['Fecha (hora redondeada)', 'Intención de voto 29-N', 'Recuerdo de voto 23-J', 'Provincia'];

// Opciones de la web (pactometro.es, vista «Encuesta»). Si cambian allí, cámbialas también aquí.
const INTENCIONES = ['PP', 'PSOE', 'Vox', 'Frente Amplio', 'Democracia 21', 'Podemos', 'ERC', 'Junts', 'EH Bildu', 'PNV',
  'BNG', 'Compromís', 'Coalición Canaria', 'UPN', 'Otro partido', 'En blanco', 'Nulo', 'No votaré', 'Aún no lo sé'];
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

/** Al abrir la URL en el navegador solo confirma que funciona; nunca muestra resultados. */
function doGet() {
  return texto_('Encuesta de pactómetro.es: funcionando.');
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
