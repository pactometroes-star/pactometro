'use strict';
// Cookie notice and poll strip: they only work with JavaScript, so they are not in the static pages
document.getElementById('saltar').insertAdjacentHTML('afterend', `<section class="ck" id="ck" aria-labelledby="ck-t" hidden>
  <div class="wrap ck-in">
    <div class="ck-txt">
      <h2 class="ck-h" id="ck-t" tabindex="-1">Cookies y datos en tu navegador</h2>
      <p>pactómetro.es <b>no usa cookies</b>, ni analítica, ni publicidad. Guarda en tu navegador lo imprescindible para funcionar y, si lo aceptas, tus preferencias: el escenario del simulador y el aviso de la encuesta cerrado. Nada sale de tu dispositivo. <a href="#cookies">Política de cookies</a></p>
    </div>
    <fieldset class="ck-cfg" id="ck-cfg" hidden>
      <legend class="vh">Elige qué puede guardar la web</legend>
      <label class="ck-op"><input type="checkbox" checked disabled><span><b>Necesarios</b> · siempre activos. Recuerdan tu elección en este aviso y, si respondes la encuesta, que ya lo has hecho.</span></label>
      <label class="ck-op"><input type="checkbox" id="ck-pref"><span><b>Preferencias</b> · opcionales. Guardan tu escenario del simulador y que has cerrado el aviso de la encuesta.</span></label>
    </fieldset>
    <div class="ck-acts">
      <button class="btn ck-b" type="button" data-ck="si">Aceptar</button>
      <button class="btn ck-b" type="button" data-ck="no">Rechazar</button>
      <button class="btn ghost" type="button" data-ck="cfg" aria-expanded="false" aria-controls="ck-cfg">Configurar</button>
      <button class="btn ck-b" type="button" data-ck="guardar" hidden>Guardar mi elección</button>
    </div>
  </div>
</section>`);
document.querySelector('.mast').insertAdjacentHTML('afterend', `<aside class="promo" id="promo" aria-label="Encuesta del 29-N" hidden>
  <div class="wrap promo-in"><p><b>Encuesta del 29-N:</b> ¿a quién piensas votar? Es anónima y se responde en un minuto.<span class="promo-mas"> Abierta hasta el 22 de noviembre a las 20:00.</span></p>
    <a class="btn promo-go" href="/encuesta/">Responder la encuesta</a>
    <button class="promo-x" type="button" id="promo-x" aria-label="Ocultar el aviso de la encuesta hasta mañana"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>
</aside>`);
/* ================================================================ utilidades */
const NF = new Intl.NumberFormat('es-ES');
const fmt = n => (n === null || n === undefined || isNaN(n)) ? '—' : NF.format(n);
const fmtPct = x => (x === null || x === undefined || !isFinite(x)) ? '—' : x.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' %';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fecha(iso){ if(!iso) return ''; const [y,m,d] = iso.split('-').map(Number); return d ? `${d} de ${MESES[m-1]} de ${y}` : String(y); }
function fechaCorta(iso){ const [y,m,d] = iso.split('-').map(Number); return `${d}-${m}-${y}`; }
const own = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;   // lookups with ids taken from the URL
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ACR = new Set(['PSOE','PP','IU','PSC','PSUC','ERC','CUP','BNG','PNV','EAJ','UPN','PAR','CHA','PRC','CDS','UCD','AP','PCE','EUPV','ICV','EUIA','PSPV','PSIB','PSN','PSE','EE','EA','HB','CC','NC','ASG','AHI','UPL','PDP','PL','UL','PDPC','JXCAT','PCPV','PCA','PCG','PSA','PA','UV','UPYD','CIU','IC','EUIB','PSM','UM','GBAI','EH','AV','PACMA','SALF','IULV','CA','PSDEG','PSG','EG','CG','CDN','IUN','NEB','RM','LV','IX','IAS','BA','CE','ICAN','AIC','ATI','AM','PSV','CM','CP','TE','XAV','SY','DO','CCN','PNC','NCA','FAC','UPCA','URAS','PAS','UNA','FIEF','AIPF','COP','EVIB','PCN','TC','CEX','SIEX','INME','EHAK','PCTV','ANV','MDYC','CPM','SML','UPV','EB','DL','CDC','JXSI','PDECAT','ECP','MM','VQ','AA','UXE']);
const PART = new Set(['de','del','la','las','los','el','y','e','i','per','por','para','con','en','a','al','da','das','do','dos','les','els','o','u','pel','dels','amb','sin','pola','na','no']);
function nice(s){
  s = String(s || '');
  if (!s || s !== s.toUpperCase() || !/[A-ZÁÉÍÓÚÑÇÀÈÒÏÜ]{3}/.test(s)) return s;
  let first = true;
  return s.toLowerCase().replace(/[\p{L}·'’]+/gu, w => {
    const up = w.toUpperCase().replace(/[·'’]/g, '');
    let out;
    if (ACR.has(up)) out = w.toUpperCase();
    else if (!first && PART.has(w)) out = w;
    else if (/^(d|l)['’]./.test(w)) out = w.slice(0, 2) + w.charAt(2).toUpperCase() + w.slice(3);
    else out = w.charAt(0).toUpperCase() + w.slice(1);
    first = false;
    return out;
  });
}
const SIG_FIX = {'PSDEG-PSOE': 'PSdeG-PSOE', 'CCA': 'CCa', 'CCA-PNC': 'CCa-PNC', 'MÉS': 'Més', 'GXF': 'GxF', 'EH BILDU': 'EH Bildu', 'JXCAT': 'JxCat', 'MXME': 'MxMe', 'VOX': 'Vox', 'SUMAR': 'Sumar'};
function niceSig(s){
  s = String(s || '');
  if (SIG_FIX[s.toUpperCase()]) return SIG_FIX[s.toUpperCase()];
  return (/\s/.test(s) && s.length > 6 && s === s.toUpperCase()) ? nice(s) : s;
}
function ink(hex){ // text colour on a party fill: white or black, whichever contrasts more (always ≥ 4.58:1)
  const h = hex.replace('#',''); const r = parseInt(h.substr(0,2),16)/255, g = parseInt(h.substr(2,2),16)/255, b = parseInt(h.substr(4,2),16)/255;
  const L = c => c <= .03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4);
  const lum = .2126*L(r) + .7152*L(g) + .0722*L(b);
  return 1.05 / (lum + .05) >= (lum + .05) / .05 ? '#ffffff' : '#000000';
}
const app = document.getElementById('app');
const tip = document.getElementById('tip');
function showTip(ev, html){ tip.innerHTML = html; tip.hidden = false; moveTip(ev); }
function moveTip(ev){
  const pad = 14, w = tip.offsetWidth, hgt = tip.offsetHeight;
  let x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
  if (y + hgt > innerHeight - 8) y = ev.clientY - hgt - pad;
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
function hideTip(){ tip.hidden = true; }
// Consent (cookie notice). Necessary items (the consent itself, the «poll answered» mark) are always stored;
// preferences (simulator scenario, poll notice closed) only after the visitor accepts them. Asked again after 24 months
// or when CONSENT_V changes.
const CONSENT_KEY = 'pacto.consentimiento', CONSENT_V = 1, CONSENT_MESES = 24;
const esPreferencia = k => k.startsWith('pacto.sim') || k.startsWith('pacto.promo');
const memoria = {};   // preferences kept only while the page is open
function leerConsentimiento(){
  let c = null; try { c = JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch(e){}
  if (!c || c.v !== CONSENT_V || !c.fecha || isNaN(Date.parse(c.fecha))) return null;
  const caduca = new Date(c.fecha); caduca.setMonth(caduca.getMonth() + CONSENT_MESES);
  return Date.now() < caduca.getTime() ? c : null;
}
const prefsAceptadas = () => { const c = leerConsentimiento(); return !!(c && c.pref); };
const store = {
  get(k){ if (esPreferencia(k) && !prefsAceptadas()) return k in memoria ? memoria[k] : null; try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k, v){ if (esPreferencia(k) && !prefsAceptadas()){ memoria[k] = v; return; } try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
function guardarConsentimiento(pref){
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({v: CONSENT_V, pref: !!pref, fecha: new Date().toISOString()}));
    if (pref) Object.keys(memoria).forEach(k => localStorage.setItem(k, JSON.stringify(memoria[k])));   // keep what was done before accepting
    else Object.keys(localStorage).filter(esPreferencia).forEach(k => localStorage.removeItem(k));
  } catch(e){}
}

/* ================================================================ datos */
const cache = {};
function load(path){
  if (!cache[path]) cache[path] = fetch('/data/' + path).then(r => {
    if (!r.ok) throw new Error(`No se pudo cargar «${path}» (error ${r.status}). Recarga la página para intentarlo de nuevo.`);
    return r.json();
  }).then(j => { if (path === 'municipios.json') indexarSlugs(j); return j; }).catch(e => { delete cache[path]; throw e; });
  return cache[path];
}
let FAM = {};
const rowToParty = (r, i) => ({ id: String(i), sig: r[0], nom: r[1], color: r[2], fam: r[3], votos: r[4], esc: r[5] });

/* ================================================================ recuento de votos */
// Devuelve {censo, votantes, validos, blancos, nulos, cand} con lo que haya en los datos, o null si no hay recuento.
function recuentoDe(e){
  if (!e) return null;
  const n = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const censo = n(e.censo), blancos = n(e.blancos), nulos = n(e.nulos);
  let votantes = n(e.votantes), cand = n(e.votos_cand);
  if (votantes === null && cand !== null && blancos !== null && nulos !== null) votantes = cand + blancos + nulos;
  const validos = (votantes !== null && nulos !== null) ? votantes - nulos : (cand !== null && blancos !== null ? cand + blancos : null);
  if (cand === null && validos !== null && blancos !== null) cand = validos - blancos;
  if (votantes === null && validos === null) return null;
  return {censo, votantes, validos, blancos, nulos, cand, suma: e.recuento === 'suma-municipal'};
}
const recuentoMun = rec => recuentoDe({censo: rec[2], votantes: rec[3], blancos: rec[4], nulos: rec[5], votos_cand: rec[6].reduce((a, x) => a + (x[1] || 0), 0)});
// Votos de las candidaturas que no figuran una a una en los datos (sin escaño): votos a candidaturas menos los listados.
function otrasFila(rows, rc){
  if (!rc || rc.cand === null || !rows.some(r => r[4])) return null;
  const resto = rc.cand - rows.reduce((a, r) => a + (r[4] || 0), 0);
  return resto > 0 ? ['Otras', 'Resto de candidaturas (sin escaño)', '#b4bcc8', 'otras', resto, 0] : null;
}
const validosDe = (rows, rc) => (rc && rc.validos) || rows.reduce((a, r) => a + (r[4] || 0), 0) || 0;
const famNombre = f => f === 'otras' ? 'Resto de candidaturas sin escaño' : f === 'local' ? 'Candidaturas locales, independientes y otras' : (FAM[f] ? FAM[f].largo : f || '');
const famCorto = f => f === 'otras' ? 'Resto sin escaño' : f === 'local' ? 'Locales y otras' : (FAM[f] ? FAM[f].corto : f || '');
const famColor = f => f === 'otras' ? '#b4bcc8' : f === 'local' ? '#8a8f98' : (FAM[f] ? FAM[f].color : '#8a8f98');
const textoPlano = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
function recuentoHTML(rc){
  if (!rc) return '';
  const it = (k, v, sub) => v === null || v === undefined ? '' : `<div><dt>${k}</dt><dd>${v}${sub ? `<small>${sub}</small>` : ''}</dd></div>`;
  return `<dl class="recuento">${it('Censo', rc.censo !== null ? fmt(rc.censo) : null)}${it('Votantes', rc.votantes !== null ? fmt(rc.votantes) : null, rc.censo ? fmtPct(100 * rc.votantes / rc.censo) + ' de participación' : '')}${it('Votos válidos', rc.validos !== null ? fmt(rc.validos) : null)}${it('A candidaturas', rc.cand !== null ? fmt(rc.cand) : null)}${it('En blanco', rc.blancos !== null ? fmt(rc.blancos) : null, rc.validos && rc.blancos !== null ? fmtPct(100 * rc.blancos / rc.validos) + ' de los válidos' : '')}${it('Nulos', rc.nulos !== null ? fmt(rc.nulos) : null, rc.votantes && rc.nulos !== null ? fmtPct(100 * rc.nulos / rc.votantes) + ' de los votantes' : '')}${rc.censo && rc.votantes !== null ? it('Abstención', fmt(rc.censo - rc.votantes), fmtPct(100 * (rc.censo - rc.votantes) / rc.censo) + ' del censo') : ''}</dl>${rc.suma ? '<p class="small muted">Recuento: suma de los resultados municipales oficiales de los municipios de la provincia.</p>' : ''}`;
}

/* ================================================================ Excel (.xlsx) generado en el navegador, sin librerías */
const XLSX = (() => {
  const enc = new TextEncoder();
  const T = new Uint32Array(256);
  for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files){                       // ZIP sin compresión (método «stored»), válido para Excel, LibreOffice y Numbers
    const parts = [], central = []; let off = 0;
    const d = new Date();
    const dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
    const dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    for (const f of files){
      const nm = enc.encode(f.name), data = enc.encode(f.text), c = crc32(data), n = data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
      h.setUint32(14, c, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(12, dt, true); ch.setUint16(14, dd, true);
      ch.setUint32(16, c, true); ch.setUint32(20, n, true); ch.setUint32(24, n, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + n;
    }
    const size = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  const x = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const col = i => { let s = ''; i++; while (i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  // Estilos: b negrita · h cabecera · int miles · pct porcentaje · t título · intb/pctb en negrita · note nota · pp puntos con un decimal
  const STY = {b: 1, h: 2, int: 3, pct: 4, t: 5, intb: 6, pctb: 7, note: 8, pp: 9, sub: 10};
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="+0.0;-0.0;0.0"/></numFmts>
<fonts count="6"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="15"/><color rgb="FF051E3E"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF626E80"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FF051E3E"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF051E3E"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="11"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  function sheetXml(sh){
    let rows = '';
    sh.rows.forEach((r, ri) => {
      if (!r || !r.length) return;
      let cells = '';
      r.forEach((c, ci) => {
        let v = c, s = 0;
        if (c && typeof c === 'object'){ v = c.v; s = STY[c.s] || 0; }
        const ref = col(ci) + (ri + 1);
        if (v === null || v === undefined || v === ''){ if (s) cells += `<c r="${ref}" s="${s}"/>`; return; }
        if (typeof v === 'number'){
          if (!isFinite(v)) return;
          if (!s && Number.isInteger(v) && Math.abs(v) >= 1000) s = STY.int;
          cells += `<c r="${ref}"${s ? ` s="${s}"` : ''}><v>${v}</v></c>`;
        } else cells += `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ''}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
      });
      if (cells) rows += `<row r="${ri + 1}">${cells}</row>`;
    });
    const cols = sh.cols ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
    const pane = sh.freeze ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${pane}${cols}<sheetData>${rows}</sheetData>${sh.filter ? `<autoFilter ref="${sh.filter}"/>` : ''}</worksheet>`;
  }
  // Rango A{fila}:{col}{fila final} para el autofiltro de una tabla que empieza en la fila `r0` (0-based) y tiene `nc` columnas
  const rango = (r0, nc, r1) => `A${r0 + 1}:${col(nc - 1)}${r1 + 1}`;
  function libro(hojas){
    const used = new Set();
    const names = hojas.map(h => {
      let n = String(h.name).replace(/[\[\]:*?\/\\]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Hoja';
      let k = n, i = 2; while (used.has(k.toLowerCase())){ const suf = ' (' + i++ + ')'; k = n.slice(0, 31 - suf.length) + suf; }
      used.add(k.toLowerCase()); return k;
    });
    const files = [];
    files.push({name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`});
    files.push({name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`});
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    files.push({name: 'docProps/core.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>pactómetro.es</dc:title><dc:creator>pactómetro.es · Javier Pereiro Pérez</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`});
    files.push({name: 'docProps/app.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>pactometro.es</Application></Properties>`});
    const defs = hojas.map((h, i) => h.filter ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${names[i].replace(/'/g, "''")}'!${h.filter.replace(/([A-Z]+)(\d+)/g, '$$$1$$$2')}</definedName>` : '').join('');
    files.push({name: 'xl/workbook.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names.map((n, i) => `<sheet name="${x(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${defs ? `<definedNames>${defs}</definedNames>` : ''}</workbook>`});
    files.push({name: 'xl/_rels/workbook.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`});
    files.push({name: 'xl/styles.xml', text: STYLES});
    hojas.forEach((h, i) => files.push({name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(h)}));
    return zip(files);
  }
  function descargar(hojas, nombre){
    const blob = libro(hojas);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.xlsx';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  return {libro, descargar, rango};
})();
const archivoSlug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const hoyTexto = () => { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
const pieExcel = fuente => [[], [{v: `Descargado de pactómetro.es el ${hoyTexto()} · ${location.href}`, s: 'note'}], [{v: `Datos: ${fuente || 'Ministerio del Interior y fuentes indicadas en pactometro.es/fuentes/'}`, s: 'note'}], [{v: '© 2026 Javier Pereiro Pérez · pactómetro.es · Cita la fuente si reutilizas estos datos.', s: 'note'}]];
const pct01 = (a, b) => (b ? a / b : null);
const fuenteTexto = f => f === 'simulacion' ? 'Escenario creado en el simulador de pactómetro.es (no es un resultado electoral)' : f === 'compilada' ? 'Resultados recopilados de fuentes públicas (no oficiales del Ministerio del Interior)' : 'Ministerio del Interior (ficheros oficiales de resultados) · Congreso de los Diputados';
// Filas de una tabla de resultados para Excel: devuelve {filas, inicio, fin} con cabecera incluida
function tablaResultadosExcel(rows, rc, total, extra){
  const validos = validosDe(rows, rc), otras = otrasFila(rows, rc);
  const hasV = rows.some(r => r[4]);
  const cab = ['Candidatura', 'Nombre completo', 'Familia política', 'Votos', '% votos válidos', 'Escaños', '% escaños'].concat(extra ? extra.cab : []);
  const out = [cab.map(v => ({v, s: 'h'}))];
  const ord = rows.slice().sort((a, b) => (b[5] || 0) - (a[5] || 0) || (b[4] || 0) - (a[4] || 0));
  ord.forEach((r, i) => out.push([niceSig(r[0]), r[1] ? nice(r[1]) : '', famNombre(r[3]), hasV ? r[4] ?? null : null, {v: hasV && r[4] ? pct01(r[4], validos) : null, s: 'pct'}, r[5] || 0, {v: pct01(r[5] || 0, total), s: 'pct'}].concat(extra ? extra.fila(r, i) : [])));
  if (otras) out.push([otras[0], otras[1], famNombre('otras'), otras[4], {v: pct01(otras[4], validos), s: 'pct'}, 0, {v: 0, s: 'pct'}]);
  if (rc && rc.blancos !== null) out.push(['En blanco', 'Votos en blanco', '', rc.blancos, {v: pct01(rc.blancos, validos), s: 'pct'}, '', '']);
  const sumE = rows.reduce((a, r) => a + (r[5] || 0), 0);
  out.push([{v: 'Total', s: 'b'}, '', '', {v: hasV ? (rc && rc.validos) || validos : null, s: 'intb'}, {v: hasV && rc && rc.validos ? 1 : null, s: 'pctb'}, {v: sumE, s: 'intb'}, {v: pct01(sumE, total), s: 'pctb'}]);
  return out;
}
function bloqueRecuentoExcel(rc){
  if (!rc) return [];
  const f = [[{v: 'Recuento de votos', s: 'sub'}]];
  const add = (k, v, s) => { if (v !== null && v !== undefined) f.push([k, s ? {v, s} : v]); };
  add('Censo', rc.censo); add('Votantes', rc.votantes); if (rc.censo && rc.votantes !== null) add('Participación', rc.votantes / rc.censo, 'pct');
  add('Votos válidos', rc.validos); add('Votos a candidaturas', rc.cand); add('Votos en blanco', rc.blancos); add('Votos nulos', rc.nulos);
  if (rc.censo && rc.votantes !== null) add('Abstención', rc.censo - rc.votantes);
  if (rc.suma) f.push([{v: 'Suma de los resultados municipales oficiales de la provincia.', s: 'note'}]);
  return f;
}

/* ================================================================ hemiciclo */
const layoutCache = {};
function seatLayout(n){
  if (layoutCache[n]) return layoutCache[n];
  const cap = N => { let t = 0; for (let i = 1; i <= N; i++) t += Math.floor(Math.PI / (2 * Math.asin(2 / (3*N + 4*i - 2)))); return t; };
  let rows = 1; while (cap(rows) < n) rows++;
  const total = cap(rows), rad = 0.4 / rows, pos = [];
  const arc = (J, R) => {
    if (J <= 0) return;
    if (J === 1) { pos.push([Math.PI/2, R]); return; }
    for (let j = 0; j < J; j++) pos.push([j * (Math.PI - 2*Math.sin(rad/R)) / (J-1) + Math.sin(rad/R), R]);
  };
  for (let i = 1; i < rows; i++) arc(Math.floor(n / total * Math.PI / (2 * Math.asin(2 / (3*rows + 4*i - 2)))), (3*rows + 4*i - 2) / (4*rows));
  arc(n - pos.length, (7*rows - 2) / (4*rows));
  pos.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
  return (layoutCache[n] = {pos, rad, rows});
}

/* ================================================================ coaliciones mínimas ganadoras */
function minimalWinning(parties, maj){
  const P = parties.filter(p => p.esc > 0).sort((a, b) => b.esc - a.esc).slice(0, 18);
  const n = P.length, out = [];
  for (let mask = 1; mask < (1 << n); mask++){
    let s = 0, mn = Infinity, k = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { s += P[i].esc; k++; if (P[i].esc < mn) mn = P[i].esc; }
    if (s >= maj && s - mn < maj) out.push({members: P.filter((_, i) => mask & (1 << i)), s, k});
  }
  out.sort((a, b) => a.k - b.k || a.s - b.s);
  return out;
}

// ?si=PSOE,Sumar,EH%20Bildu → ['PSOE', 'Sumar', 'EH Bildu'] (commas inside a name come encoded)
function paramLista(k){
  const par = location.search.slice(1).split('&').find(x => x.split('=')[0] === k);
  if (!par) return [];
  return par.split('=').slice(1).join('=').split(',').filter(Boolean).map(x => { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch(e){ return ''; } }).filter(Boolean);
}

/* ================================================================ componente pactómetro */
/* cfg: {total, partidos, regla:'congreso'|'parlamento'|'municipal'|'diputacion'|'insular', preset:{id:'si'|'abs'}, presetNota,
         editable, simKey, masVotada,
         simBases: [{k, label, origen, partidos}] (simulator starting points), simEstado: {base, mod}} */
let pactoN = 0;
function Pactometro(cfg){
  const uid = ++pactoN;
  const root = document.createElement('section');
  root.className = 'pacto';
  const st = { partidos: cfg.partidos.map(p => ({...p})), voto: new Map(), showAll: false,
    base: cfg.simEstado ? cfg.simEstado.base : null, mod: !!(cfg.simEstado && cfg.simEstado.mod) };
  st.partidos.forEach(p => st.voto.set(p.id, (cfg.preset && cfg.preset[p.id]) || 'no'));
  const total = cfg.total, maj = Math.floor(total / 2) + 1;
  root.innerHTML = `
    <div class="stage">
      <div class="hemi"></div>
      <div class="stack" style="gap:8px">
        <div class="tally" aria-hidden="true"></div>
        <div class="tally-legend"></div>
      </div>
      <div class="verdict" aria-live="polite"></div>
    </div>
    <div class="side">
      ${cfg.simBases ? `<div class="simctl" role="group" aria-labelledby="simctl-t">
        <h2 class="h3" id="simctl-t">Punto de partida</h2>
        <div class="simctl-b">
          ${cfg.simBases.map(b => `<button class="btn ghost" type="button" data-act="base" data-base="${b.k}" aria-pressed="false">${esc(b.label)}</button>`).join('')}
          <button class="btn ghost" type="button" data-act="ceros" data-base="cero" aria-pressed="false"><span class="cero" aria-hidden="true">0</span>Empezar de cero</button>
        </div>
        <p class="simctl-o" aria-live="polite"></p>
      </div>` : ''}
      <div class="side-head">
        <h2 class="h3">Votos por candidatura</h2>
        <div class="row">
          <button class="btn ghost" type="button" data-act="nadie">Todos «no»</button>
          ${cfg.preset ? '<button class="btn ghost" type="button" data-act="preset">Restaurar</button>' : ''}
          <button class="btn" type="button" data-act="compartir" aria-expanded="false" aria-controls="share-${uid}"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="12" cy="3.5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="4" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12.5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.8 7 10.2 4.5M5.8 9l4.4 2.5" stroke="currentColor" stroke-width="1.6"/></svg>Compartir</button>
          ${cfg.exportar ? '<button class="btn" type="button" data-act="xlsx" title="Descarga los resultados, tu escenario, las mayorías posibles y el histórico en una hoja de Excel"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 12v2.5h12V12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Excel</button>' : ''}
        </div>
      </div>
      <div class="share" id="share-${uid}" hidden></div>
      <div class="share-aviso" hidden></div>
      ${cfg.presetNota ? `<p class="preset-note">${esc(cfg.presetNota)}</p>` : ''}
      <div class="plist" role="list"></div>
      ${cfg.editable ? `<div class="sumline"></div>
        <form class="addform" autocomplete="off">
          <input type="text" id="sim-nombre" placeholder="Nueva candidatura (p. ej. SALF)" maxlength="40" aria-label="Nombre de la nueva candidatura" required>
          <input type="number" id="sim-escanos" min="0" max="${total}" value="1" aria-label="Escaños de la nueva candidatura">
          <button class="btn" type="submit">Añadir</button>
        </form>` : ''}
    </div>
    ${cfg.recuento ? `<div class="rec-wrap" style="grid-column:1/-1"><h2 class="h3">Recuento de votos</h2>${recuentoHTML(cfg.recuento)}</div>` : ''}
    <div class="coal" style="grid-column:1/-1"></div>`;
  const $hemi = root.querySelector('.hemi'), $tally = root.querySelector('.tally'), $tleg = root.querySelector('.tally-legend');
  const $ver = root.querySelector('.verdict'), $list = root.querySelector('.plist'), $coal = root.querySelector('.coal');
  const $sum = root.querySelector('.sumline'), $orig = root.querySelector('.simctl-o');

  const seatsOf = p => Math.max(0, Math.round(+p.esc || 0));
  const votosTot = cfg.editable ? 0 : (cfg.votosValidos || 0);
  const hayVotos = !cfg.editable && st.partidos.some(p => p.votos);
  const votosTexto = v => hayVotos && v ? `${fmt(v)} votos${votosTot ? ' · ' + fmtPct(100 * v / votosTot) : ''}` : '';
  function totals(){
    let si = 0, no = 0, ab = 0;
    for (const p of st.partidos){ const s = seatsOf(p), v = st.voto.get(p.id); if (v === 'si') si += s; else if (v === 'abs') ab += s; else no += s; }
    return {si, no, ab, asig: si + no + ab};
  }
  function ordered(){
    const rank = {si: 0, abs: 1, no: 2};
    return st.partidos.filter(p => seatsOf(p) > 0).slice().sort((a, b) => rank[st.voto.get(a.id)] - rank[st.voto.get(b.id)] || seatsOf(b) - seatsOf(a));
  }
  function drawHemi(){
    const {pos, rad} = seatLayout(total);
    const cx = 180, cy = 178, S = 168 / 1.75, r = Math.max(1.2, rad * S * 0.86);
    const seats = [];
    for (const p of ordered()) for (let k = 0; k < seatsOf(p); k++) seats.push(p);
    const t = totals();
    let svg = `<svg viewBox="0 0 360 200" role="img" aria-label="Hemiciclo de ${total} escaños: ${t.si} sí, ${t.ab} abstención, ${t.no} no. Mayoría absoluta: ${maj}.">`;
    pos.forEach(([a, R], i) => {
      const x = cx + R * Math.cos(a) * S, y = cy - R * Math.sin(a) * S, p = seats[i];
      svg += `<circle class="seat${p ? '' : ' empty'}" ${p ? `data-p="${p.id}"` : ''} cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${p ? p.color : 'var(--seat-empty)'}" stroke="var(--seat-ring)" stroke-width="0.8"/>`;
    });
    if (maj < pos.length){
      const a = (pos[maj - 1][0] + pos[maj][0]) / 2, R0 = pos.reduce((m, q) => Math.min(m, q[1]), 9) - rad * 1.7, R1 = pos.reduce((m, q) => Math.max(m, q[1]), 0) + rad * 1.9;
      const x0 = cx + R0 * Math.cos(a) * S, y0 = cy - R0 * Math.sin(a) * S, x1 = cx + R1 * Math.cos(a) * S, y1 = cy - R1 * Math.sin(a) * S;
      const xl = cx + (R1 + 0.06) * Math.cos(a) * S, yl = cy - (R1 + 0.06) * Math.sin(a) * S;
      svg += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>`;
      svg += `<text x="${xl.toFixed(1)}" y="${(yl - 2).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700">${maj}</text>`;
    }
    const innerR = pos.reduce((m, q) => Math.min(m, q[1]), 9) * S;
    const big = Math.min(46, innerR * 0.62);
    svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="${big.toFixed(1)}" font-weight="700" style="font-variation-settings:'wdth' 112;letter-spacing:-.02em">${maj}</text>`;
    svg += `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="9.5" fill="var(--muted)" style="letter-spacing:.12em">PARA LA MAYORÍA · ${total}</text></svg>`;
    $hemi.innerHTML = svg;
    const s = $hemi.querySelector('svg');
    s.addEventListener('pointerover', ev => {
      const id = ev.target.getAttribute && ev.target.getAttribute('data-p'); if (!id) return;
      highlight(id, true);
      const p = st.partidos.find(q => q.id === id);
      const v = {si: 'Sí', abs: 'Abstención', no: 'No'}[st.voto.get(id)];
      const vt = votosTexto(p.votos);
      showTip(ev, `<strong>${fmt(seatsOf(p))} escaños</strong>${esc(niceSig(p.sig))} · vota ${v}${vt ? '<br>' + vt : ''}${p.nota ? '<br>' + esc(p.nota) : ''}`);
    });
    s.addEventListener('pointermove', ev => { if (!tip.hidden) moveTip(ev); });
    s.addEventListener('pointerout', ev => { if (ev.target.getAttribute && ev.target.getAttribute('data-p')) { highlight(null); hideTip(); } });
  }
  function highlight(id){
    const s = $hemi.querySelector('svg'); if (!s) return;
    s.classList.toggle('dim', !!id);
    s.querySelectorAll('.seat.hi').forEach(c => c.classList.remove('hi'));
    if (id) s.querySelectorAll(`.seat[data-p="${id}"]`).forEach(c => c.classList.add('hi'));
  }
  function drawTally(){
    const t = totals(), pc = x => (100 * x / Math.max(total, t.asig)).toFixed(3) + '%';
    $tally.innerHTML = `<i class="t-si" style="width:${pc(t.si)}"></i><i class="t-ab" style="width:${pc(t.ab)}"></i><i class="t-no" style="width:${pc(t.no)}"></i><span class="mark" style="left:${(100 * maj / Math.max(total, t.asig)).toFixed(3)}%"></span>`;
    $tleg.innerHTML = `<span>Sí <b>${t.si}</b></span><span>Abstención <b>${t.ab}</b></span><span>No <b>${t.no}</b></span>${total - t.asig > 0 ? `<span>Sin asignar <b>${total - t.asig}</b></span>` : ''}<span>Mayoría absoluta <b>${maj}</b></span>`;
  }
  function nombres(){
    const si = ordered().filter(p => st.voto.get(p.id) === 'si');
    if (!si.length) return 'Ninguna candidatura';
    const n = si.map(p => niceSig(p.sig));
    return n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1];
  }
  function drawVerdict(){
    const t = totals(), abs = t.si >= maj, simple = t.si > t.no, falta = Math.max(0, maj - t.si);
    let pill, why = '', law = '';
    const who = nombres();
    if (cfg.regla === 'municipal'){
      const mv = cfg.masVotada;
      pill = abs ? '<span class="pill on">Mayoría absoluta</span>' : '<span class="pill off">Sin mayoría absoluta</span>';
      why = abs ? `${esc(who)} ${who.includes(' y ') ? 'suman' : 'suma'} ${t.si} de ${total} concejales: su candidato sería elegido alcalde o alcaldesa en la sesión constitutiva.`
                : `Con ${t.si} concejales a favor faltan ${falta} para la mayoría absoluta (${maj}). Si ningún cabeza de lista la alcanza, es proclamado alcalde el de la lista más votada${mv ? `: <b>${esc(niceSig(mv.sig))}</b> (${fmt(mv.votos)} votos)` : ''}.`;
      law = 'Elección del alcalde: art. 196 de la Ley Orgánica del Régimen Electoral General (LOREG).';
    } else if (cfg.regla === 'diputacion'){
      pill = abs ? '<span class="pill on">Presidencia en 1.ª votación</span>' : simple ? '<span class="pill on">Presidencia en 2.ª votación</span>' : '<span class="pill off">Sin mayoría</span>';
      why = abs ? `${esc(who)} reúne ${t.si} de ${total} diputados provinciales: mayoría absoluta.` : simple ? `Faltan ${falta} para la mayoría absoluta, pero en la segunda votación basta la mayoría simple (${t.si} frente a ${t.no}).` : `No hay mayoría absoluta (faltan ${falta}) ni simple: los votos en contra (${t.no}) igualan o superan a los favorables (${t.si}).`;
      law = 'Elección del presidente de la diputación: mayoría absoluta en primera votación y simple en segunda (art. 207 LOREG).';
    } else if (cfg.regla === 'insular'){
      pill = abs ? '<span class="pill on">Mayoría absoluta</span>' : '<span class="pill off">Sin mayoría absoluta</span>';
      why = abs ? `${esc(who)} reúne ${t.si} de ${total} escaños.` : `Faltan ${falta} escaños para la mayoría absoluta (${maj}). ${simple ? `Hay mayoría simple: ${t.si} a favor frente a ${t.no} en contra.` : ''}`;
      law = 'Cada institución insular o foral tiene su propio procedimiento de elección de presidencia; aquí se calcula la mayoría del pleno.';
    } else {
      pill = abs ? '<span class="pill on">Investidura en 1.ª votación</span>' : simple ? '<span class="pill on">Investidura en 2.ª votación</span>' : '<span class="pill off">Investidura fallida</span>';
      why = abs ? `${esc(who)} ${who.includes(' y ') ? 'reúnen' : 'reúne'} ${t.si} síes: mayoría absoluta (${maj}) en la primera votación.`
          : simple ? `En la primera votación faltan ${falta} síes. En la segunda basta con más síes que noes: ${t.si} frente a ${t.no}.`
          : `Faltan ${falta} síes para la mayoría absoluta y en la segunda votación los noes (${t.no}) ${t.no === t.si ? 'empatan con' : 'superan a'} los síes (${t.si}).`;
      law = cfg.regla === 'congreso'
        ? 'Art. 99 de la Constitución: mayoría absoluta en la primera votación; simple en la segunda, 48 horas después. Si en dos meses nadie es investido, se disuelven las Cortes.'
        : 'Regla general de los estatutos de autonomía: mayoría absoluta en la primera votación y simple en las siguientes. Algunos parlamentos tienen procedimientos propios.';
    }
    const siVotos = hayVotos ? st.partidos.filter(p => st.voto.get(p.id) === 'si').reduce((a, p) => a + (p.votos || 0), 0) : 0;
    const votosLinea = siVotos ? `<p class="small">Las candidaturas del sí sumaron <b>${fmt(siVotos)} votos</b>${votosTot ? `: el ${fmtPct(100 * siVotos / votosTot)} de los votos válidos` : ''}.</p>` : '';
    $ver.innerHTML = `<div class="figures">
        <div class="fig"><span class="v">${maj}</span><span class="k">Mayoría absoluta</span></div>
        <div class="fig minor"><span class="v">${t.si}</span><span class="k">Sí</span></div>
        <div class="fig minor"><span class="v">${t.ab}</span><span class="k">Abstención</span></div>
        <div class="fig minor"><span class="v">${t.no}</span><span class="k">No</span></div>
        <div style="margin-left:auto">${pill}</div>
      </div>
      <p class="why">${why}</p>${votosLinea}<p class="law">${law}</p>`;
    st.veredicto = textoPlano(pill) + '. ' + textoPlano(why);
  }
  function drawList(){
    const parts = st.partidos.slice().sort((a, b) => seatsOf(b) - seatsOf(a) || (b.votos || 0) - (a.votos || 0));
    $list.innerHTML = '';
    for (const p of parts){
      if (!cfg.editable && seatsOf(p) === 0) continue;
      const v = st.voto.get(p.id);
      const row = document.createElement('div');
      row.className = 'prow'; row.setAttribute('role', 'listitem'); row.dataset.p = p.id;
      const pct = hayVotos && votosTot && p.votos ? fmtPct(100 * p.votos / votosTot) : '';
      const vts = hayVotos && p.votos ? fmt(p.votos) + ' votos' : '';
      row.innerHTML = `<span class="sw" style="background:${p.color}"></span>
        <div class="pname"><b></b><small></small></div>
        ${cfg.editable ? `<div class="pseats step">
          <button type="button" class="stp" data-step="-1" tabindex="-1" aria-label="Un escaño menos para ${esc(niceSig(p.sig))}">−</button>
          <input type="number" inputmode="numeric" min="0" max="${total}" value="${seatsOf(p)}" id="esc-${p.id}" aria-label="Escaños de ${esc(niceSig(p.sig))}">
          <button type="button" class="stp" data-step="1" tabindex="-1" aria-label="Un escaño más para ${esc(niceSig(p.sig))}">+</button>
        </div>` : `<div class="pseats"><span class="e">${seatsOf(p)}</span>${vts ? `<small>${vts}</small>` : ''}${pct ? `<small>${pct}</small>` : ''}</div>`}
        <div class="seg" role="radiogroup" aria-label="Voto de ${esc(p.sig)}">
          <button type="button" role="radio" class="v-si" data-v="si" aria-checked="${v === 'si'}" tabindex="${v === 'si' ? 0 : -1}">Sí</button>
          <button type="button" role="radio" class="v-abs" data-v="abs" aria-checked="${v === 'abs'}" tabindex="${v === 'abs' ? 0 : -1}" aria-label="Abstención">Abs.</button>
          <button type="button" role="radio" class="v-no" data-v="no" aria-checked="${v === 'no'}" tabindex="${v === 'no' ? 0 : -1}">No</button>
        </div>`;
      row.querySelector('b').textContent = niceSig(p.sig);
      const nm = p.nota ? p.nota : p.nom && norm(p.nom) !== norm(p.sig) ? nice(p.nom) : '';
      const sm = row.querySelector('small'); sm.textContent = nm; sm.title = nm;
      row.addEventListener('pointerenter', () => highlight(p.id));
      row.addEventListener('pointerleave', () => highlight(null));
      $list.appendChild(row);
    }
    drawSum();
  }
  function drawSum(){
    if (!$sum) return;
    const t = totals();
    $sum.innerHTML = t.asig === total ? `<span>Escaños repartidos: <b>${t.asig} de ${total}</b></span><span>Cuadra</span>`
      : `<span>Escaños repartidos: <b>${t.asig} de ${total}</b></span><span class="warn">${t.asig < total ? `Faltan ${total - t.asig}` : `Sobran ${t.asig - total}`}</span>`;
  }
  function drawOrigen(){
    if (!$orig) return;
    root.querySelectorAll('.simctl-b [data-base]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.base === st.base)));
    const b = (cfg.simBases || []).find(x => x.k === st.base);
    const txt = st.base === 'cero' ? `Todas las candidaturas empiezan con 0 escaños. Escribe el número de cada una o usa − y + hasta repartir los ${total}.`
      : b ? b.origen : 'Escenario guardado en este navegador.';
    const o = txt + (st.mod && st.base !== null ? ' Incluye tus cambios.' : '');
    if ($orig.textContent !== o) $orig.textContent = o;
  }
  function drawCoal(){
    const parts = st.partidos.map(p => ({...p, esc: seatsOf(p)}));
    const sol = parts.find(p => p.esc >= maj);
    const list = minimalWinning(parts, maj);
    const shown = st.showAll ? list.slice(0, 120) : list.slice(0, 9);
    $coal.innerHTML = `<div class="coal-head"><h2 class="h3">Mayorías absolutas posibles</h2><span class="small muted">${list.length ? `${list.length} combinaciones mínimas (si sale cualquiera de sus miembros, se pierde la mayoría)` : 'Ninguna combinación alcanza la mayoría absoluta'}</span></div>
      ${sol ? `<p class="small">${esc(niceSig(sol.sig))} tiene mayoría absoluta en solitario (${sol.esc} de ${total}).</p>` : ''}
      <div class="coal-list"></div>
      ${list.length > 9 ? `<div><button class="btn ghost" type="button" data-act="todas">${st.showAll ? 'Ver menos' : `Ver las ${Math.min(list.length, 120)}${list.length > 120 ? ' primeras' : ''}`}</button></div>` : ''}`;
    const box = $coal.querySelector('.coal-list');
    for (const c of shown){
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cbox';
      const cv = hayVotos ? c.members.reduce((a, m) => a + (m.votos || 0), 0) : 0;
      b.innerHTML = `<span class="chips"></span><span class="tot"><span><b>${c.s}</b> escaños</span><span>${c.k === 1 ? 'en solitario' : c.k + ' candidaturas'} · ${c.s === maj ? 'justo la mayoría' : (c.s - maj) + ' por encima'}</span>${cv ? `<span class="cv">${votosTexto(cv)}</span>` : ''}</span>`;
      const chips = b.querySelector('.chips');
      for (const m of c.members){ const ch = document.createElement('span'); ch.className = 'chip'; ch.innerHTML = `<i style="background:${m.color}"></i>`; ch.appendChild(document.createTextNode(`${niceSig(m.sig)} ${m.esc}`)); chips.appendChild(ch); }
      b.setAttribute('aria-label', 'Probar esta coalición: ' + c.members.map(m => m.sig).join(', '));
      b.addEventListener('click', () => { editado(); st.partidos.forEach(p => st.voto.set(p.id, c.members.some(m => m.id === p.id) ? 'si' : 'no')); refresh(false); root.querySelector('.stage').scrollIntoView({behavior: 'smooth', block: 'start'}); });
      box.appendChild(b);
    }
  }
  function exportar(btn){
    const E = cfg.exportar, rc = cfg.recuento || null;
    const txt0 = btn.innerHTML; btn.disabled = true;
    try {
      const VOTO = {si: 'Sí', abs: 'Abstención', no: 'No'};
      const rows = st.partidos.map(p => [p.sig, p.nom, p.color, p.fam, cfg.editable ? null : (p.votos ?? null), seatsOf(p), p.id]);
      const t = totals();
      const h1 = [[{v: 'pactómetro.es · ' + E.institucion, s: 't'}], [{v: E.eleccion, s: 'sub'}], [],
        ['Escaños', total], ['Mayoría absoluta', maj], E.fecha ? ['Fecha', fecha(E.fecha)] : null, ['Fuente', fuenteTexto(E.fuente)], $orig ? ['Punto de partida', $orig.textContent] : null, []].filter(Boolean);
      const rec = bloqueRecuentoExcel(rc); if (rec.length) h1.push(...rec, []);
      h1.push([{v: 'Resultados y escenario del pactómetro', s: 'sub'}]);
      const r0 = h1.length;
      const tabla = tablaResultadosExcel(rows, cfg.editable ? null : rc, total, {cab: ['Voto en el pactómetro'], fila: r => [VOTO[st.voto.get(r[6])] || 'No']});
      h1.push(...tabla);
      const fin = h1.length - 1;
      h1.push([], [{v: 'Escenario', s: 'sub'}], ['Sí', t.si], ['Abstención', t.ab], ['No', t.no], ['Resultado', st.veredicto || '']);
      h1.push(...pieExcel(fuenteTexto(E.fuente)));
      const hojas = [{name: 'Pactómetro', rows: h1, cols: [30, 46, 34, 14, 15, 10, 11, 20], filter: XLSX.rango(r0, 8, r0 + tabla.length - 2)}];
      // mayorías posibles
      const parts = st.partidos.map(p => ({...p, esc: seatsOf(p)}));
      const list = minimalWinning(parts, maj).slice(0, 5000);
      const validos = validosDe(rows, rc);
      const h2 = [[{v: 'Mayorías absolutas posibles · ' + E.institucion, s: 't'}], [{v: `${E.eleccion} · mayoría absoluta: ${maj} de ${total}. Coaliciones mínimas ganadoras: si sale cualquiera de sus miembros, se pierde la mayoría.`, s: 'note'}], [],
        ['Nº', 'Candidaturas', 'Número de candidaturas', 'Escaños', 'Por encima de la mayoría', 'Votos', '% votos válidos'].map(v => ({v, s: 'h'}))];
      list.forEach((c, i) => { const v = hayVotos ? c.members.reduce((a, m) => a + (m.votos || 0), 0) : null; h2.push([i + 1, c.members.map(m => `${niceSig(m.sig)} (${m.esc})`).join(' + '), c.k, c.s, c.s - maj, v, {v: v && validos ? v / validos : null, s: 'pct'}]); });
      if (!list.length) h2.push(['', 'Ninguna combinación alcanza la mayoría absoluta']);
      hojas.push({name: 'Mayorías posibles', rows: h2, cols: [6, 70, 12, 10, 14, 14, 14], freeze: 4, filter: list.length ? XLSX.rango(3, 7, 3 + list.length) : null});
      // histórico de la institución
      if (E.historico && E.historico.length){
        const h3 = [[{v: 'Histórico · ' + E.institucion, s: 't'}], [], ['Elección', 'Fecha', 'Escaños de la cámara', 'Mayoría absoluta', 'Candidatura', 'Nombre completo', 'Familia política', 'Votos', '% votos válidos', 'Escaños', '% escaños'].map(v => ({v, s: 'h'}))];
        const h4 = [[{v: 'Participación · ' + E.institucion, s: 't'}], [], ['Elección', 'Fecha', 'Censo', 'Votantes', 'Participación', 'Votos válidos', 'A candidaturas', 'En blanco', 'Nulos'].map(v => ({v, s: 'h'}))];
        for (const el of E.historico){
          const rcx = el.rc || null, vv = validosDe(el.r, rcx), filas = el.r.slice().sort((a, b) => (b[5] || 0) - (a[5] || 0) || (b[4] || 0) - (a[4] || 0));
          const ot = otrasFila(el.r, rcx); if (ot) filas.push(ot);
          for (const r of filas) h3.push([el.eleccion, el.fecha ? fechaCorta(el.fecha) : '', el.total, Math.floor(el.total / 2) + 1, niceSig(r[0]), r[1] ? nice(r[1]) : '', famNombre(r[3]), r[4] ?? null, {v: r[4] && vv ? r[4] / vv : null, s: 'pct'}, r[5] || 0, {v: pct01(r[5] || 0, el.total), s: 'pct'}]);
          if (rcx) h4.push([el.eleccion, el.fecha ? fechaCorta(el.fecha) : '', rcx.censo, rcx.votantes, {v: rcx.censo && rcx.votantes !== null ? rcx.votantes / rcx.censo : null, s: 'pct'}, rcx.validos, rcx.cand, rcx.blancos, rcx.nulos]);
        }
        hojas.push({name: 'Histórico', rows: h3, cols: [16, 11, 10, 10, 22, 46, 32, 13, 12, 9, 10], freeze: 3, filter: XLSX.rango(2, 11, h3.length - 1)});
        if (h4.length > 3) hojas.push({name: 'Participación', rows: h4, cols: [16, 11, 13, 13, 13, 13, 14, 12, 12], freeze: 3});
      }
      if (E.provincias){
        const h5 = [[{v: 'Resultados por provincia · ' + E.eleccion, s: 't'}], [], ['Provincia', 'Escaños de la provincia', 'Candidatura', 'Nombre completo', 'Votos', '% votos (listados)', 'Escaños'].map(v => ({v, s: 'h'}))];
        Object.keys(E.provincias).sort((a, b) => E.provincias[a].n.localeCompare(E.provincias[b].n, 'es')).forEach(k => { const pv = E.provincias[k], sv = pv.r.reduce((a, r) => a + (r[4] || 0), 0); pv.r.forEach(r => h5.push([pv.n, pv.escanos, niceSig(r[0]), r[1] ? nice(r[1]) : '', r[4] ?? null, {v: r[4] && sv ? r[4] / sv : null, s: 'pct'}, r[5] || 0])); });
        hojas.push({name: 'Provincias', rows: h5, cols: [24, 12, 22, 46, 13, 12, 9], freeze: 3, filter: XLSX.rango(2, 7, h5.length - 1)});
      }
      XLSX.descargar(hojas, 'pactometro-' + (E.archivo || archivoSlug(E.institucion + ' ' + E.eleccion)));
    } catch(e){ console.error(e); alertaExcel(btn); }
    finally { setTimeout(() => { btn.disabled = false; btn.innerHTML = txt0; delete btn.dataset.err; }, btn.dataset.err ? 3500 : 600); }
  }
  function save(){ if (cfg.simKey && !st.compartido) store.set(cfg.simKey, {base: st.base, mod: st.mod, partidos: st.partidos.map(p => ({sig: p.sig, nom: p.nom, color: p.color, fam: p.fam, esc: seatsOf(p), nota: p.nota || ''})), voto: st.partidos.map(p => st.voto.get(p.id))}); }
  function refresh(coal = true){ drawHemi(); drawTally(); drawVerdict(); drawList(); if (coal) drawCoal(); drawOrigen(); save();
    if (cfg.alCambiar){ const m = new Map(); st.partidos.forEach(p => { const v = st.voto.get(p.id); if (v !== 'no') m.set(norm(niceSig(p.sig)), v); }); cfg.alCambiar(m); } }
  function editado(){ if (st.compartido){ st.compartido = false; avisoCompartido(); } }
  function escanosCambiados(){ editado(); st.mod = true; drawHemi(); drawTally(); drawVerdict(); drawCoal(); drawSum(); drawOrigen(); save(); }
  function cargarBase(k){
    if (k === 'cero'){ st.partidos.forEach(p => p.esc = 0); st.voto = new Map(st.partidos.map(p => [p.id, 'no'])); }
    else {
      const b = (cfg.simBases || []).find(x => x.k === k); if (!b) return;
      const t = Date.now();
      st.partidos = b.partidos.map((p, i) => ({...p, id: 'b' + i + '-' + t})); st.voto = new Map(st.partidos.map(p => [p.id, 'no']));
    }
    editado(); st.base = k; st.mod = false; st.showAll = false; refresh();
  }
  // ---------------------------------------------------------------- compartir
  const PALETA = ['#8d6e63', '#5c7a99', '#7e8f3a', '#8c6f8f', '#9e7a4a', '#5f8a8b'];
  const clave = sig => norm(niceSig(sig)).replace(/[^a-z0-9]+/g, '');
  function leerCompartido(){
    const si = paramLista('si'), ab = paramLista('abs'), ps = paramLista('p');
    if (cfg.editable && ps.length){
      const ref = {}; (cfg.simBases || []).forEach(b => b.partidos.forEach(x => { if (!ref[clave(x.sig)]) ref[clave(x.sig)] = x; }));
      cfg.partidos.forEach(x => { if (!ref[clave(x.sig)]) ref[clave(x.sig)] = x; });
      const filas = ps.map(x => x.split('~')).filter(x => x[0] && x[0].length <= 40).slice(0, 40);
      if (!filas.length) return;
      st.partidos = filas.map(([sig, n, v], i) => { const r = ref[clave(sig)];
        return {id: 'u' + i, sig: r ? r.sig : sig, nom: r ? r.nom : 'Candidatura añadida en el simulador', color: r ? r.color : PALETA[i % PALETA.length], fam: r ? r.fam : 'local', votos: null,
          esc: Math.max(0, Math.min(total, parseInt(n, 10) || 0)), nota: r && r.nota || ''}; });
      st.voto = new Map(st.partidos.map((p, i) => [p.id, {s: 'si', a: 'abs'}[filas[i][2]] || 'no']));
      st.base = null; st.mod = true; st.compartido = true;
    } else if (si.length || ab.length){
      const S = new Set(si.map(clave)), A = new Set(ab.map(clave));
      st.partidos.forEach(p => st.voto.set(p.id, S.has(clave(p.sig)) ? 'si' : A.has(clave(p.sig)) ? 'abs' : 'no'));
      st.compartido = !!cfg.simKey;
    }
  }
  function avisoCompartido(){
    const el = root.querySelector('.share-aviso');
    el.hidden = !st.compartido;
    el.innerHTML = st.compartido ? `<p><b>Escenario compartido por enlace.</b> Tu escenario guardado no se toca mientras no cambies nada. <a href="${esc(location.pathname)}">Volver a mi escenario</a></p>` : '';
  }
  const quienesSi = () => ordered().filter(p => st.voto.get(p.id) === 'si').map(p => niceSig(p.sig));
  function textoEscenario(){
    const t = totals(), unidad = cfg.regla === 'municipal' ? 'concejales' : 'escaños', n = quienesSi();
    const inst = (cfg.exportar && cfg.exportar.institucion) || 'esta institución';
    if (!n.length) return `¿Quién puede gobernar en ${inst}? Prueba los pactos posibles en pactómetro.es`;
    const quien = n.length === 1 ? n[0] : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1];
    return `${quien} ${n.length > 1 ? 'suman' : 'tiene'} ${t.si} de ${total} ${unidad} (${inst}): ${t.si >= maj ? 'mayoría absoluta' : `${n.length > 1 ? 'les' : 'le'} faltan ${maj - t.si} para la mayoría absoluta, que está en ${maj}`}.`;
  }
  function consultaEscenario(){
    const lista = arr => arr.map(x => encodeURIComponent(String(x).replace(/[~,]/g, ' '))).join(',');
    const q = new URLSearchParams(location.search); ['si', 'abs', 'p'].forEach(k => q.delete(k));
    let extra = '';
    if (cfg.editable) extra = 'p=' + st.partidos.filter(p => seatsOf(p) > 0).map(p => `${encodeURIComponent(String(p.sig).replace(/[~,]/g, ' '))}~${seatsOf(p)}~${{si: 's', abs: 'a'}[st.voto.get(p.id)] || 'n'}`).join(',');
    else {
      const si = st.partidos.filter(p => st.voto.get(p.id) === 'si' && seatsOf(p) > 0).map(p => p.sig), ab = st.partidos.filter(p => st.voto.get(p.id) === 'abs' && seatsOf(p) > 0).map(p => p.sig);
      extra = [si.length ? 'si=' + lista(si) : '', ab.length ? 'abs=' + lista(ab) : ''].filter(Boolean).join('&');
    }
    const base = q.toString();
    return [base, extra].filter(Boolean).join('&');
  }
  const enlaceEscenario = () => { const qq = consultaEscenario(); return 'https://pactometro.es' + location.pathname + (qq ? '?' + qq : ''); };
  function codigoInsertar(){
    const qq = consultaEscenario().replace(/(^|&)eleccion=[^&]*/, '').replace(/^&/, '');
    const src = 'https://pactometro.es/widget/?i=' + encodeURIComponent(rutaActual()) + (qq ? '&' + qq : '');
    const tit = (cfg.exportar && cfg.exportar.institucion) || 'pactómetro.es';
    return `<iframe src="${src}" title="Pactómetro: ${esc(tit)}" width="100%" height="480" style="border:0;max-width:680px" loading="lazy"></iframe>`;
  }
  function abrirCompartir(btn){
    const $s = root.querySelector('.share');
    const abrir = $s.hidden;
    btn.setAttribute('aria-expanded', String(abrir));
    if (!abrir){ $s.hidden = true; return; }
    const url = enlaceEscenario(), txt = textoEscenario(), u = encodeURIComponent(url), tt = encodeURIComponent(txt);
    const red = (n, href) => `<a class="btn ghost" href="${href}" target="_blank" rel="noopener">${n}<span class="vh"> (se abre en una pestaña nueva)</span></a>`;
    $s.innerHTML = `<h3 class="share-h" tabindex="-1">Compartir este escenario</h3>
      <p class="share-res">${esc(txt)}</p>
      <label class="share-l" for="share-url-${uid}">Enlace</label>
      <div class="share-row"><input id="share-url-${uid}" type="text" readonly value="${esc(url)}"><button class="btn" type="button" data-act="copiar">Copiar enlace</button></div>
      <div class="share-red">${red('WhatsApp', `https://wa.me/?text=${encodeURIComponent(txt + ' ' + url)}`)}${red('Telegram', `https://t.me/share/url?url=${u}&text=${tt}`)}${red('X', `https://twitter.com/intent/tweet?text=${tt}&url=${u}`)}${red('Bluesky', `https://bsky.app/intent/compose?text=${encodeURIComponent(txt + ' ' + url)}`)}${red('LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`)}<a class="btn ghost" href="mailto:?subject=${encodeURIComponent('Pactómetro: ' + ((cfg.exportar && cfg.exportar.institucion) || 'pactos'))}&body=${encodeURIComponent(txt + '\n\n' + url)}">Correo</a>
        ${navigator.share ? '<button class="btn ghost" type="button" data-act="nativo">Más opciones…</button>' : ''}</div>
      <div class="share-img"><button class="btn" type="button" data-act="imagen">Descargar imagen</button><span class="small muted">Imagen de 1200 × 630 con el hemiciclo, lista para redes sociales.</span></div>
      <details class="share-emb"><summary>Insertar en tu web</summary>
        <p class="small">Copia este código en tu web o blog para mostrar este pactómetro. No usa cookies ni guarda datos de quien lo ve.</p>
        <label class="vh" for="share-emb-${uid}">Código para insertar</label><textarea id="share-emb-${uid}" readonly rows="3">${esc(codigoInsertar())}</textarea>
        <button class="btn ghost" type="button" data-act="copiar-emb">Copiar código</button></details>
      <p class="share-st small" role="status"></p>`;
    $s.hidden = false;
    $s.querySelector('.share-h').focus();
  }
  async function copiar(texto, campo){
    const st2 = root.querySelector('.share-st');
    try { await navigator.clipboard.writeText(texto); st2.textContent = 'Copiado.'; }
    catch(e){ campo.focus(); campo.select(); st2.textContent = 'Seleccionado: pulsa Ctrl+C (o mantén pulsado y elige Copiar).'; }
  }
  function recortar(x, t, w){ if (x.measureText(t).width <= w) return t; while (t.length > 1 && x.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
  async function imagenEscenario(){
    const W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    try { await Promise.all(['700 40px Archivo', '500 22px Archivo', '600 44px "Ibarra Real Nova"'].map(f => document.fonts.load(f))); } catch(e){}
    const INK = '#051e3e', MUT = '#5b6676', SANS = 'Archivo, Arial, sans-serif';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#f2f4f7'; x.fillRect(0, H - 70, W, 70);
    const t1 = (cfg.exportar && cfg.exportar.institucion) || 'pactómetro.es', t2 = (cfg.exportar && cfg.exportar.eleccion) || '';
    x.fillStyle = INK; x.font = '600 42px "Ibarra Real Nova", Georgia, serif'; x.fillText(recortar(x, t1, W - 100), 50, 78);
    x.font = `500 22px ${SANS}`; x.fillStyle = MUT; x.fillText(recortar(x, t2, W - 100), 50, 114);
    // hemiciclo, como en la web: primero los síes, después las abstenciones y los noes
    const {pos, rad} = seatLayout(total);
    const cx = 330, cy = 492, S = 268 / 1.75, r = Math.max(1.6, rad * S * 0.86);
    const seats = []; for (const p of ordered()) for (let k = 0; k < seatsOf(p); k++) seats.push(p);
    pos.forEach(([a, R], i) => { const p = seats[i]; x.beginPath(); x.arc(cx + R * Math.cos(a) * S, cy - R * Math.sin(a) * S, r, 0, 2 * Math.PI); x.fillStyle = p ? p.color : '#e1e6ee'; x.fill(); });
    if (maj < pos.length){
      const a = (pos[maj - 1][0] + pos[maj][0]) / 2, R0 = Math.min(...pos.map(q => q[1])) - rad * 1.7, R1 = Math.max(...pos.map(q => q[1])) + rad * 1.9;
      x.strokeStyle = INK; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath();
      x.moveTo(cx + R0 * Math.cos(a) * S, cy - R0 * Math.sin(a) * S); x.lineTo(cx + R1 * Math.cos(a) * S, cy - R1 * Math.sin(a) * S); x.stroke();
    }
    x.textAlign = 'center'; x.fillStyle = INK; x.font = `700 84px ${SANS}`; x.fillText(String(maj), cx, cy - 8);
    x.font = `600 17px ${SANS}`; x.fillStyle = MUT; x.fillText(`PARA LA MAYORÍA · ${total}`, cx, cy + 22);
    x.textAlign = 'left';
    // cifras y veredicto
    const t = totals(), X0 = 690;
    [['Sí', t.si], ['Abstención', t.ab], ['No', t.no]].forEach(([k, v], i) => {
      x.fillStyle = INK; x.font = `700 ${i ? 46 : 64}px ${SANS}`; x.fillText(String(v), X0 + [0, 150, 330][i], 214);
      x.fillStyle = MUT; x.font = `600 16px ${SANS}`; x.fillText(k.toUpperCase(), X0 + [0, 150, 330][i], 242);
    });
    const pill = textoPlano($ver.querySelector('.pill') ? $ver.querySelector('.pill').outerHTML : ''), on = !!$ver.querySelector('.pill.on');
    x.font = `700 20px ${SANS}`; const pw = x.measureText(pill).width + 40;
    x.beginPath(); x.roundRect ? x.roundRect(X0, 266, pw, 42, 21) : x.rect(X0, 266, pw, 42);
    if (on){ x.fillStyle = INK; x.fill(); x.fillStyle = '#ffffff'; } else { x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.fillStyle = INK; }
    x.fillText(pill, X0 + 20, 294);
    const si = ordered().filter(p => st.voto.get(p.id) === 'si');
    const lista = si.length ? si : ordered().slice(0, 7);
    x.fillStyle = MUT; x.font = `600 16px ${SANS}`; x.fillText(si.length ? 'VOTAN SÍ' : 'COMPOSICIÓN', X0, 350);
    const filas = lista.length > 6 ? 5 : lista.length;
    lista.slice(0, filas).forEach((p, i) => {
      const y = 384 + i * 30;
      x.fillStyle = p.color; x.beginPath(); x.arc(X0 + 8, y - 7, 8, 0, 2 * Math.PI); x.fill();
      x.fillStyle = INK; x.font = `600 21px ${SANS}`; x.fillText(recortar(x, niceSig(p.sig), 360), X0 + 26, y);
      x.font = `700 21px ${SANS}`; x.textAlign = 'right'; x.fillText(String(seatsOf(p)), W - 60, y); x.textAlign = 'left';
    });
    if (lista.length > filas){ x.fillStyle = MUT; x.font = `500 18px ${SANS}`; x.fillText(`y ${lista.length - filas} más`, X0 + 26, 384 + filas * 30); }
    x.fillStyle = INK; x.font = `700 26px ${SANS}`; x.fillText('pactómetro.es', 50, H - 26);
    x.fillStyle = MUT; x.font = `500 18px ${SANS}`; x.textAlign = 'right'; x.fillText('Calcula mayorías y pactos en pactometro.es', W - 50, H - 28); x.textAlign = 'left';
    return new Promise(res => cv.toBlob(res, 'image/png'));
  }
  const nombreImagen = () => 'pactometro-' + archivoSlug(((cfg.exportar && (cfg.exportar.archivo || cfg.exportar.institucion)) || 'escenario')) + '.png';
  async function descargarImagen(btn){
    const txt0 = btn.textContent; btn.disabled = true; btn.textContent = 'Generando…';
    try {
      const blob = await imagenEscenario(); const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = nombreImagen(); document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      root.querySelector('.share-st').textContent = 'Imagen descargada.';
    } catch(e){ console.error(e); root.querySelector('.share-st').textContent = 'No se pudo generar la imagen.'; }
    finally { btn.disabled = false; btn.textContent = txt0; }
  }
  async function compartirNativo(){
    const url = enlaceEscenario(), text = textoEscenario();
    try {
      let files;
      try { const blob = await imagenEscenario(); const f = new File([blob], nombreImagen(), {type: 'image/png'}); if (navigator.canShare && navigator.canShare({files: [f]})) files = [f]; } catch(e){}
      await navigator.share(files ? {title: 'pactómetro.es', text, url, files} : {title: 'pactómetro.es', text, url});
    } catch(e){ /* cancelado */ }
  }
  root.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const row = b.closest('.prow');
    if (row && b.dataset.step){
      const p = st.partidos.find(q => q.id === row.dataset.p); if (!p) return;
      p.esc = Math.max(0, Math.min(total, seatsOf(p) + (+b.dataset.step)));
      const inp = row.querySelector('input'); if (inp) inp.value = p.esc;
      escanosCambiados();
      return;
    }
    if (row && b.dataset.v){
      const id = row.dataset.p, v = b.dataset.v, foco = row.contains(document.activeElement);
      editado(); st.voto.set(id, v); refresh(false);
      if (foco){ const nb = $list.querySelector(`.prow[data-p="${id}"] [data-v="${v}"]`); if (nb) nb.focus(); }
      return;
    }
    const act = b.dataset.act;
    if (act === 'nadie'){ editado(); st.partidos.forEach(p => st.voto.set(p.id, 'no')); refresh(false); }
    if (act === 'preset'){ editado(); st.partidos.forEach(p => st.voto.set(p.id, (cfg.preset && cfg.preset[p.id]) || 'no')); refresh(false); }
    if (act === 'compartir') abrirCompartir(b);
    if (act === 'copiar') copiar(root.querySelector('.share input').value, root.querySelector('.share input'));
    if (act === 'copiar-emb') copiar(root.querySelector('.share textarea').value, root.querySelector('.share textarea'));
    if (act === 'imagen') descargarImagen(b);
    if (act === 'nativo') compartirNativo();
    if (act === 'todas'){ st.showAll = !st.showAll; drawCoal(); }
    if (act === 'xlsx') exportar(b);
    if (act === 'ceros' || act === 'base'){ cargarBase(b.dataset.base); b.focus(); }
  });
  root.addEventListener('input', ev => {
    const inp = ev.target; if (!inp.id || !inp.id.startsWith('esc-')) return;
    const p = st.partidos.find(q => 'esc-' + q.id === inp.id); if (!p) return;
    p.esc = Math.max(0, Math.min(total, parseInt(inp.value, 10) || 0));
    escanosCambiados();
  });
  root.addEventListener('focusout', ev => {   // normalise what was typed (empty, negative or over the total)
    const inp = ev.target; if (!inp.id || !inp.id.startsWith('esc-')) return;
    const p = st.partidos.find(q => 'esc-' + q.id === inp.id); if (p && inp.value !== String(seatsOf(p))) inp.value = seatsOf(p);
  });
  const form = root.querySelector('.addform');
  if (form) form.addEventListener('submit', ev => {
    ev.preventDefault();
    const name = root.querySelector('#sim-nombre').value.trim(); if (!name) return;
    const seats = Math.max(0, Math.min(total, parseInt(root.querySelector('#sim-escanos').value, 10) || 0));
    const palette = ['#8d6e63', '#5c7a99', '#7e8f3a', '#8c6f8f', '#9e7a4a', '#5f8a8b'];
    const id = 'n' + Date.now();
    st.partidos.push({id, sig: name, nom: 'Candidatura añadida en el simulador', color: palette[st.partidos.length % palette.length], fam: 'local', votos: null, esc: seats});
    editado(); st.voto.set(id, 'no'); st.mod = true; form.reset(); refresh();
  });
  leerCompartido();
  refresh();
  avisoCompartido();
  return root;
}

/* ================================================================ piezas compartidas */
function miniBar(rows, total, deco = false){
  const maj = Math.floor(total / 2) + 1;
  const segs = rows.filter(r => r[5] > 0).map(r => `<i style="width:${(100 * r[5] / total).toFixed(3)}%;background:${r[2]}"${deco ? '' : ` title="${esc(r[0])}: ${r[5]}"`}></i>`).join('');
  const a11y = deco ? 'aria-hidden="true"' : `role="img" aria-label="${esc(rows.filter(r => r[5] > 0).map(r => r[0] + ' ' + r[5]).join(', '))}"`;
  return `<div class="minibar" ${a11y}>${segs}<span class="mk" style="left:${(100 * maj / total).toFixed(3)}%"></span></div>`;
}
function miniLegend(rows, max = 5){
  const r = rows.filter(x => x[5] > 0).slice(0, max);
  const rest = rows.filter(x => x[5] > 0).slice(max).reduce((a, x) => a + x[5], 0);
  return `<div class="minilegend">${r.map(x => `<span><i style="background:${x[2]}"></i>${esc(niceSig(x[0]))} ${x[5]}</span>`).join('')}${rest ? `<span>otros ${rest}</span>` : ''}</div>`;
}
function hbar(label, sub, rows, total, href, opts = {}){
  const maj = Math.floor(total / 2) + 1;
  const segs = rows.filter(r => r[5] > 0).map(r => {
    const w = 100 * r[5] / total, txt = w >= 7 ? r[5] : '';
    return `<i style="width:${w.toFixed(3)}%;background:${r[2]};color:${ink(r[2])}" data-tip="${esc(niceSig(r[0]))}|${r[5]}|${esc(nice(r[1] || ''))}">${txt}</i>`;
  }).join('');
  return `<a class="hbar" href="${href}"><span class="lab"><b>${esc(label)}</b><span>${esc(sub)}</span></span><span class="bar">${segs}${opts.noMark ? '' : `<span class="mk" style="left:${(100 * maj / total).toFixed(3)}%"></span>`}</span></a>`;
}
function wireBarTips(container, unit = 'escaños'){
  container.addEventListener('pointerover', ev => {
    const i = ev.target.closest('[data-tip]'); if (!i) return;
    const [sig, n, nom] = i.dataset.tip.split('|');
    showTip(ev, `<strong>${fmt(+n)} ${unit}</strong>${esc(sig)}${nom && nom !== sig ? ' · ' + esc(nom) : ''}`);
  });
  container.addEventListener('pointermove', ev => { if (!tip.hidden) moveTip(ev); });
  container.addEventListener('pointerout', ev => { if (ev.target.closest('[data-tip]')) hideTip(); });
}
function resultsTable(rows, opts = {}){
  const validos = opts.validos || rows.reduce((a, r) => a + (r[4] || 0), 0);
  const hasV = rows.some(r => r[4]);
  return `<div class="tablewrap"><table class="data"><thead><tr><th>Candidatura</th>${hasV ? '<th class="n">Votos</th><th class="n">%</th>' : ''}<th class="n">${opts.unit || 'Escaños'}</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><span class="sw" style="background:${r[2]}"></span><b>${esc(niceSig(r[0]))}</b>${r[1] && norm(r[1]) !== norm(r[0]) ? ` <span class="muted small nm">${esc(nice(r[1]))}</span>` : ''}</td>${hasV ? `<td class="n">${fmt(r[4])}</td><td class="n">${r[4] ? fmtPct(100 * r[4] / validos) : '—'}</td>` : ''}<td class="n"><b>${r[5]}</b></td></tr>`).join('')}
  </tbody></table></div>`;
}
function badge(fuente){
  if (fuente === 'simulacion') return '<span class="badge compilado" title="Escenario que puedes cambiar; no es un resultado electoral">Simulación</span>';
  return fuente === 'compilada'
    ? '<span class="badge compilado" title="Resultados recopilados de fuentes públicas y verificados (sumas de escaños)">Recopilado</span>'
    : '<span class="badge" title="Ficheros oficiales del Ministerio del Interior o del Congreso">Dato oficial</span>';
}
function presetByFam(partidos, siFams, absFams = []){
  const pr = {};
  partidos.forEach(p => { if (siFams.includes(p.fam)) pr[p.id] = 'si'; else if (absFams.includes(p.fam)) pr[p.id] = 'abs'; });
  return pr;
}
function presetLargest(partidos){
  const p = partidos.filter(x => x.esc > 0).sort((a, b) => b.esc - a.esc)[0];
  return p ? {[p.id]: 'si'} : {};
}
function alertaExcel(btn){ btn.dataset.err = '1'; btn.textContent = 'No se pudo generar el Excel'; }
const cmpLink = (spec, txt = 'Comparar con otra →') => `<a class="tab" href="#comparar?s=${encodeURIComponent(spec)}">${txt}</a>`;
function setTitle(t){ if (primeraVista && document.body.dataset.ruta && document.body.dataset.ruta !== '404') return; document.title = t ? `${t} · pactómetro.es` : 'pactómetro.es'; }

/* ================================================================ aviso del 29-N (portada y Congreso) */
// Cuenta atrás con días, horas, minutos y segundos; iniciarCuenta() la pone en marcha. conv: G.convocatoria si ya se ha cargado.
function avisoElecciones(conv, sinEncuesta){
  const c = conv || {decreto_boe: '2026-10-06', campana: ['2026-11-13', '2026-11-27']};
  const camp = c.campana || ['2026-11-13', '2026-11-27'];
  return `<div class="notice cd"><span class="date">29-N</span><div class="cd-main"><p class="cd-titulo">Elecciones generales · domingo 29 de noviembre de 2026</p><div class="cuenta" id="cuenta" role="timer" aria-live="off"></div><p class="cd-meta">Cortes disueltas por decreto (BOE del ${fechaCorta(c.decreto_boe)}) · campaña del ${+camp[0].slice(8)} al ${+camp[1].slice(8)} de noviembre</p></div><div class="row"><a class="btn" href="#congreso-simulador">Simular el 29-N</a><a class="btn ghost" href="#29n">Calendario y cómo se vota</a>${encPromo() && !sinEncuesta ? `<a class="btn solid" href="#encuesta">${encModo() === 'previa' ? 'Ver la encuesta' : 'Responder la encuesta · hasta el 22-N'}</a>` : ''}</div></div>`;
}

/* ================================================================ vista: Congreso */
/* Encuesta del CIS como punto de partida del simulador (data/cis.json, scripts/cis_proyeccion.py).
   Art. 69.7 LOREG: durante los cinco días anteriores a la votación no se pueden publicar sondeos. Se oculta del 24 al 28 de noviembre
   (hora peninsular) y el 29 hasta que cierren todos los colegios (20:00 en Canarias = 21:00 peninsular). */
const VEDA_SONDEOS = ['2026-11-23T23:00:00Z', '2026-11-29T20:00:00Z'];
const enVedaSondeos = (t = Date.now()) => t >= Date.parse(VEDA_SONDEOS[0]) && t < Date.parse(VEDA_SONDEOS[1]);
const VEDA_AVISO = `<div class="veda" role="note"><p><b>Del 24 al 28 de noviembre no se pueden publicar encuestas electorales</b> (art. 69.7 de la Ley Orgánica del Régimen Electoral General). Por eso el simulador no muestra ahora la encuesta del CIS y parte del resultado del 23-J. La encuesta vuelve cuando cierren los colegios electorales el 29 de noviembre.</p></div>`;
function cisPanel(C){
  const E = C.estudio, F = C.ficha, P = C.proyeccion.provincias;
  const dec = x => x === null || x === undefined ? '' : x.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 2});
  const nueva = '<span class="vh"> (se abre en una pestaña nueva)</span>';
  const enlace = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener">${t}${nueva}</a>`;
  const fichaFilas = [
    ['Organismo', 'Centro de Investigaciones Sociológicas (CIS), calle Montalbán 8, 28014 Madrid'],
    ['Estudio', `n.º ${E.numero}, «${E.titulo}» (avance de resultados publicado el ${fecha(E.publicado)})`],
    ['Ámbito', F.ambito], ['Universo', F.universo], ['Tamaño de la muestra', F.muestra], ['Afijación', F.afijacion],
    ['Ponderación', F.ponderacion], ['Puntos de muestreo', F.puntos], ['Procedimiento de muestreo', F.procedimiento],
    ['Modo de entrevista', F.modo], ['Error muestral', F.error], ['Trabajo de campo', F.fechas], ['Pregunta de intención de voto', F.pregunta]];
  const est = C.partidos.map(p => `<tr><td><span class="sw" style="background:${p.color}"></span><b>${esc(p.sig)}</b></td><td class="n">${dec(p.directo)}</td><td class="n">±${dec(p.margen)}</td><td class="n"><b>${dec(p.est)}</b></td><td class="n">${p.esc}</td></tr>`).join('')
    + C.resto.map((r, i) => `<tr${i === 0 ? ' class="sep"' : ''}><td>${esc(r.n)}</td><td class="n">${dec(r.directo)}</td><td class="n">±${dec(r.margen)}</td><td class="n">${r.est === null ? '' : dec(r.est)}</td><td class="n"></td></tr>`).join('')
    + `<tr class="sep"><td>Entrevistas (N)</td><td class="n">${fmtQ(C.n)}</td><td></td><td></td><td class="n"><b>350</b></td></tr>`;
  const conEsc = C.partidos.filter(p => p.esc > 0);
  const corto = p => p.k === 'fa' ? 'SUMAR / FA' : niceSig(p.sig);
  const provs = Object.keys(P).sort((a, b) => P[a].n.localeCompare(P[b].n, 'es'));
  const provTabla = `<div class="tablewrap"><table class="data"><caption class="vh">Proyección de escaños por provincia de pactómetro.es a partir de la estimación del CIS</caption>
    <thead><tr><th>Provincia</th><th class="n">Escaños</th>${conEsc.map(p => `<th class="n" title="${esc(p.sig)}">${esc(corto(p))}</th>`).join('')}</tr></thead>
    <tbody>${provs.map(k => `<tr><td>${esc(P[k].n)}</td><td class="n"><b>${P[k].escanos}</b></td>${conEsc.map(p => P[k].r[p.k] ? `<td class="n">${P[k].r[p.k]}</td>` : '<td class="n z"><span aria-hidden="true">·</span><span class="vh">0</span></td>').join('')}</tr>`).join('')}
    <tr class="sep"><td><b>Total</b></td><td class="n"><b>350</b></td>${conEsc.map(p => `<td class="n"><b>${p.esc}</b></td>`).join('')}</tr></tbody></table></div>`;
  return `<section class="sheet pad cis" aria-labelledby="cis-t">
    <div class="cis-head">
      <div>
        <span class="eyebrow">Punto de partida del simulador</span>
        <h2 class="h3" id="cis-t">Encuesta del CIS: ${esc(E.titulo)}</h2>
        <p>El simulador arranca con la <b>estimación de voto del Centro de Investigaciones Sociológicas (CIS)</b>: estudio n.º ${E.numero}, publicado el ${fecha(E.publicado)}, con trabajo de campo del 1 al 6 de octubre, ${fmtQ(C.n)} entrevistas telefónicas y un error muestral de ±1,4 %.</p>
        <p class="small">El CIS estima porcentajes de voto, no escaños: los escaños de partida son una proyección de pactómetro.es a partir de esos porcentajes.</p>
      </div>
      <div class="cis-acc">
        <a class="btn solid" href="${esc(E.url)}" target="_blank" rel="noopener">Ver el estudio en la web del CIS${nueva}<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        ${enlace(E.estimacion_pdf, 'Tabla de estimación de voto (PDF)').replace('<a ', '<a class="small" ')}
      </div>
    </div>
    <details class="more"><summary>Cómo hizo el CIS el estudio</summary><div>
      <h3>Ficha técnica</h3>
      <dl class="cis-dl">${fichaFilas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <h3>De las respuestas a la estimación</h3>
      <p>El <b>voto directo</b> es lo que contestan los entrevistados a la pregunta de intención de voto, en porcentaje sobre el total de entrevistados («sobre censo», en palabras del CIS). La <b>estimación de voto</b> es el porcentaje sobre el voto válido que calcula el CIS: una ${esc(C.metodo_cis.charAt(0).toLowerCase() + C.metodo_cis.slice(1))}</p>
      <div class="tablewrap"><table class="data"><caption class="vh">Estimación de voto del CIS, estudio ${E.numero}</caption>
        <thead><tr><th>Candidatura</th><th class="n">Voto directo<br>(% sobre censo)</th><th class="n">Margen de error<br>(IC 95 %)</th><th class="n">Estimación CIS<br>(% voto válido)</th><th class="n">Escaños<br>(pactómetro.es)</th></tr></thead>
        <tbody>${est}</tbody></table></div>
      <h3>Notas del CIS</h3>
      <ul>${C.notas_cis.map(n => `<li>${esc(n)}</li>`).join('')}<li>El margen teórico de error del voto directo es un intervalo de confianza del 95 %.</li></ul>
      <p>Documentos oficiales: ${enlace(E.url, 'avance de resultados')} · ${enlace(E.estimacion_pdf, 'estimación de voto (PDF)')} · ${enlace(E.frecuencias_pdf, 'frecuencias y ficha técnica (PDF)')} · ${enlace(E.excel, 'documentación completa (Excel)')}.</p>
      <p class="small muted">Cita: Centro de Investigaciones Sociológicas, Estudio n.º ${E.numero}, «${esc(E.titulo)}». Avance de resultados, Madrid, ${fecha(E.publicado)}.</p>
    </div></details>
    <details class="more"><summary>Cómo calcula pactómetro.es los escaños</summary><div>
      <p>El CIS no estima escaños. Para convertir su estimación nacional en escaños, pactómetro.es aplica un método sencillo y transparente:</p>
      <ol>
        <li>Parte de los votos de cada partido en cada provincia el 23 de julio de 2023 (resultados oficiales del Ministerio del Interior).</li>
        <li>Cada partido sube o baja en todas las provincias en la misma proporción en que lo hace en el conjunto de España según el CIS: si la estimación le da un 10 % más de voto que el que logró en 2023, se le suma un 10 % en cada provincia.</li>
        <li>SUMAR / Frente Amplio y Podemos, que en 2023 se presentaron juntos en Sumar, siguen el reparto provincial de Sumar. Se Acabó la Fiesta no se presentó al Congreso en 2023: recibe el mismo porcentaje en todas las provincias.</li>
        <li>«Otros partidos» (7,9 %) y el voto en blanco (0,3 %) se reparten por igual en todas las provincias: cuentan para la barrera del 3 %, pero no obtienen escaños.</li>
        <li>En cada provincia los porcentajes se ajustan para sumar el 100 % del voto válido y se reparten los escaños del Real Decreto 806/2026 con la barrera del 3 % y la ley D'Hondt (art. 163 LOREG), como se explica en <a href="#29n">Elecciones 29-N</a>.</li>
      </ol>
      <p>Es una aproximación orientativa: supone que el voto cambia igual en todo el territorio, algo que no suele ocurrir, sobre todo con los partidos que solo se presentan en algunas provincias. Úsala como punto de partida y cambia los escaños como quieras.</p>
      <h3>Escaños por provincia</h3>
      ${provTabla}
    </div></details>
  </section>`;
}
const LEYENDA_ELECCION = k => k.includes('-') ? (k.endsWith('-04') ? 'abril de ' : 'noviembre de ') + k.slice(0, 4) : k;
async function viewCongreso(modo, clave){
  const G = await load('generales.json');
  const conv = G.convocatoria;
  const keys = Object.keys(G.congreso).sort();
  const notice = avisoElecciones(conv);
  let data, partidos, preset, presetNota, editable = false, simKey = null, simBases = null, simEstado = null, titulo, fuente = 'oficial', extra = '', cabecera = '';
  const base23 = G.congreso['2023'].r.map(rowToParty);
  const baseDis = G.disolucion.r.map(rowToParty);
  if (modo === 'disolucion'){
    partidos = baseDis; titulo = 'Composición al disolverse las Cortes';
    preset = presetByFam(partidos, ['psoe', 'sumar', 'erc', 'junts', 'bildu', 'pnv', 'podemos', 'bng', 'cc', 'compromis']);
    presetNota = 'Referencia de partida: votan sí los partidos que apoyaron la investidura de noviembre de 2023. Cambia los votos para probar otras mayorías.';
    extra = `<p class="small muted" style="margin-top:10px">${esc(G.disolucion.nota)}</p>`;
    fuente = 'compilada';
  } else if (modo === 'simulador'){
    titulo = 'Simulador para el 29-N'; editable = true; simKey = 'pacto.sim.v2'; fuente = 'simulacion';
    const veda = enVedaSondeos();
    const C = veda ? null : await load('cis.json').catch(() => null);
    const from23 = base23.map(p => ({...p, votos: null})), fromDis = baseDis.map(p => ({...p, votos: null}));
    const deCis = C ? C.partidos.map((p, i) => ({id: 'c' + i, sig: p.sig, nom: p.nom, color: p.color, fam: p.fam, votos: null, esc: p.esc, nota: 'CIS: ' + fmtPct(p.est) + ' del voto'})) : null;
    simBases = [
      deCis && {k: 'cis', label: 'Encuesta del CIS', partidos: deCis,
        origen: 'Escaños estimados por pactómetro.es a partir de la estimación de voto del barómetro del CIS de octubre de 2026 (estudio 3582).'},
      {k: 'r2023', label: 'Resultado del 23-J', partidos: from23, origen: 'Escaños que obtuvo cada candidatura en las elecciones generales del 23 de julio de 2023.'},
      {k: 'dis', label: 'Al disolverse las Cortes', partidos: fromDis, origen: 'Composición del Congreso al disolverse las Cortes, con los cambios de la legislatura.'}].filter(Boolean);
    const saved = store.get(simKey);
    const ok = saved && Array.isArray(saved.partidos) && saved.partidos.length && !(veda && saved.base === 'cis');
    const bSaved = ok ? simBases.find(b => b.k === saved.base) : null;
    const votoGuardado = (lista, n) => { const pr = {}; if (saved && Array.isArray(saved.voto) && saved.voto.length === n) lista.forEach((p, i) => { const v = saved.voto[i]; if (v === 'si' || v === 'abs') pr[p.id] = v; }); return pr; };
    if (bSaved && !saved.mod){             // untouched starting point: reload it, so updated data reach returning visitors
      partidos = bSaved.partidos; preset = votoGuardado(partidos, partidos.length); simEstado = {base: bSaved.k, mod: false};
    } else if (ok){
      partidos = saved.partidos.map((p, i) => ({id: 's' + i, sig: String(p.sig), nom: String(p.nom || ''), color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#8a8f98', fam: p.fam || 'local', votos: null, esc: +p.esc || 0, nota: typeof p.nota === 'string' ? p.nota.slice(0, 80) : ''}));
      preset = votoGuardado(partidos, partidos.length);
      simEstado = {base: bSaved || saved.base === 'cero' ? saved.base : null, mod: !!saved.mod};
    } else {
      partidos = simBases[0].partidos; preset = {}; simEstado = {base: simBases[0].k, mod: false};
    }
    presetNota = 'Cambia los escaños con − y + o escribiendo el número, añade candidaturas y marca el voto de cada una. ' + (prefsAceptadas() ? 'El escenario se guarda solo en este navegador.' : 'Tu escenario no se guardará al cerrar la página porque no has aceptado guardar preferencias (puedes cambiarlo en «Configurar cookies», al pie).');
    cabecera = C ? cisPanel(C) : veda ? VEDA_AVISO : '';
  } else {
    const k = (modo === 'hist' && G.congreso[clave]) ? clave : '2023';
    data = G.congreso[k];
    partidos = data.r.map(rowToParty);
    titulo = k === '2023' ? 'Elecciones del 23 de julio de 2023' : `Elecciones de ${LEYENDA_ELECCION(k)}`;
    fuente = 'oficial';
    if (k === '2023'){
      preset = presetByFam(partidos, ['psoe', 'sumar', 'erc', 'junts', 'bildu', 'pnv', 'bng', 'cc']);
      presetNota = 'Votación real de la investidura de Pedro Sánchez (16-11-2023): 179 sí y 171 no.';
    } else {
      preset = presetLargest(partidos);
      presetNota = 'Empieza con la candidatura más votada a favor. Usa las combinaciones de abajo para probar mayorías.';
    }
  }
  const validos = data ? (data.votantes - data.nulos) : 0;
  const rcData = data ? recuentoDe(data) : null;
  const kSel = data ? Object.keys(G.congreso).find(k => G.congreso[k] === data) : null;
  const exportar = {institucion: 'Congreso de los Diputados', eleccion: titulo, fecha: data ? data.fecha : null, fuente,
    archivo: 'congreso-' + (kSel || modo), provincias: data ? data.provincias : null,
    historico: modo === 'simulador' ? null : keys.slice().reverse().map(k => ({eleccion: 'Generales ' + LEYENDA_ELECCION(k), fecha: G.congreso[k].fecha, total: 350, r: G.congreso[k].r, rc: recuentoDe(G.congreso[k])}))};
  const tabs = `<div class="tabs">
      <a class="tab" href="#congreso" aria-current="${modo === '2023' || (modo === 'hist' && clave === '2023')}">23-J 2023</a>
      <a class="tab" href="#congreso-disolucion" aria-current="${modo === 'disolucion'}">Al disolverse las Cortes</a>
      <a class="tab" href="#congreso-simulador" aria-current="${modo === 'simulador'}">Simulador 29-N</a>
      <select class="select" id="sel-congreso" aria-label="Otras elecciones generales">
        <option value="">Otras elecciones…</option>
        ${keys.slice().reverse().map(k => `<option value="${k}" ${modo === 'hist' && clave === k ? 'selected' : ''}>${G.congreso[k].leg === 'Constituyente' ? 'Constituyentes' : G.congreso[k].leg + ' Legislatura'} · ${fechaCorta(G.congreso[k].fecha)}</option>`).join('')}
      </select>
      ${kSel ? cmpLink('congreso::' + kSel) : modo === 'disolucion' ? '' : cmpLink('congreso::2023', 'Comparar elecciones →')}
    </div>`;
  app.innerHTML = `${notice}
    <div class="page-head"><span class="eyebrow">Congreso de los Diputados · 350 escaños</span><h1>${esc(titulo)}</h1>
    <div class="row">${badge(fuente)}${modo === 'simulador' ? '<span class="small muted">Escenario editable para las elecciones generales del 29 de noviembre de 2026</span>' : ''}${data ? `<span class="small muted">${data.leg === 'Constituyente' ? 'Legislatura constituyente' : data.leg + ' Legislatura'} · ${fecha(data.fecha)}${data.censo ? ` · censo ${fmt(data.censo)} · participación ${fmtPct(100 * data.votantes / data.censo)}` : ''}</span>` : ''}</div></div>
    ${tabs}${cabecera}<div class="sheet pad" id="pacto-slot"></div>${extra}
    <div class="section" id="detalle"></div>`;
  iniciarCuenta();
  app.querySelector('#sel-congreso').addEventListener('change', e => { if (e.target.value) irA('congreso-' + e.target.value); });
  app.querySelector('#pacto-slot').appendChild(Pactometro({total: 350, partidos, regla: 'congreso', preset, presetNota, editable, simKey, simBases, simEstado, votosValidos: validos, recuento: rcData, exportar}));
  const det = app.querySelector('#detalle');
  if (data){
    det.innerHTML = `<div class="section-head"><h2>Resultados por candidatura</h2><p>${data.fuente === 'oficial' ? 'Totales nacionales oficiales del Ministerio del Interior. Las candidaturas aparecen tal y como se agregan oficialmente (por ejemplo, las coaliciones con nombre propio en cada comunidad).' : esc(data.nota || '')}</p></div>
      ${resultsTable(data.r, {validos})}
      ${data.provincias ? `<details class="more"><summary>Escaños por provincia</summary><div>${provTable(data.provincias)}</div></details>` : ''}`;
  } else if (modo === 'disolucion'){
    det.innerHTML = `<div class="section-head"><h2>De dónde sale esta composición</h2><p>Escaños por partido según la composición de los grupos parlamentarios recogida en fuentes públicas y en la prensa al cierre de la legislatura. No es un dato del Ministerio del Interior: el resultado oficial de las elecciones es el de la pestaña «23-J 2023».</p></div>${resultsTable(G.disolucion.r)}`;
  }
}
function provTable(provs){
  const keys = Object.keys(provs).sort((a, b) => provs[a].n.localeCompare(provs[b].n, 'es'));
  return `<div class="tablewrap" style="margin-top:4px"><table class="data"><thead><tr><th>Provincia</th><th class="n">Escaños</th><th>Reparto</th></tr></thead><tbody>
    ${keys.map(k => { const p = provs[k]; return `<tr><td>${esc(p.n)}</td><td class="n">${p.escanos}</td><td>${p.r.filter(r => r[5] > 0).map(r => `<span class="chip"><i style="background:${r[2]}"></i>${esc(niceSig(r[0]))} ${r[5]}</span>`).join(' ')}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}

/* ================================================================ vista: elecciones del 29-N */
// Información oficial: Constitución (arts. 68-69), LOREG (arts. 85, 96, 162-166), Real Decreto 806/2026 de convocatoria
// (BOE de 6-10-2026) y calendario de la Junta Electoral Central.
const ESC_2026 = {"02":4,"03":12,"04":6,"01":4,"33":7,"05":3,"06":5,"07":8,"08":32,"48":8,"09":4,"10":4,"11":8,"39":5,"12":5,"13":5,"14":6,"15":8,"16":3,"20":6,"17":6,"18":7,"19":3,"21":5,"22":3,"23":5,"24":4,"25":4,"27":4,"28":38,"29":11,"30":10,"31":5,"32":4,"34":3,"35":8,"36":7,"26":4,"37":4,"38":7,"40":3,"41":12,"42":2,"43":6,"44":3,"45":6,"46":16,"47":5,"49":3,"50":7,"51":1,"52":1};   // anexo del Real Decreto 806/2026
const CAL_29N = [   // [inicio, fin, qué, detalle] — calendario electoral de la Junta Electoral Central
  ['2026-10-06', null, 'Convocatoria', 'El BOE publica el Real Decreto 806/2026, de disolución de las Cortes y convocatoria de elecciones.'],
  ['2026-10-06', '2026-11-19', 'Voto por correo', 'Plazo para pedir el voto por correo (electores residentes en España).'],
  ['2026-10-07', '2026-10-16', 'Coaliciones', 'Los partidos comunican a la Junta Electoral las coaliciones con las que se presentarán.'],
  ['2026-10-12', '2026-10-19', 'Censo electoral', 'Consulta del censo en ayuntamientos y consulados, y plazo para reclamar inclusiones o exclusiones.'],
  ['2026-10-21', '2026-10-26', 'Candidaturas', 'Presentación de las candidaturas ante las juntas electorales provinciales.'],
  ['2026-10-24', '2026-10-30', 'Residentes en el extranjero', 'La Oficina del Censo Electoral envía la documentación para votar a los españoles inscritos como residentes en el extranjero (CERA).'],
  ['2026-10-28', null, 'Candidaturas', 'El BOE publica las candidaturas presentadas.'],
  ['2026-10-31', '2026-11-04', 'Mesas electorales', 'Sorteo de los presidentes, vocales y suplentes de las mesas electorales.'],
  ['2026-11-02', null, 'Candidaturas', 'Las juntas electorales provinciales proclaman las candidaturas. El BOE las publica al día siguiente.'],
  ['2026-11-09', '2026-11-22', 'Voto por correo', 'La Oficina del Censo Electoral envía la documentación a quienes pidieron votar por correo.'],
  ['2026-11-10', '2026-11-25', 'Voto por correo', 'Plazo para enviar el voto por correo.'],
  ['2026-11-13', '2026-11-27', 'Campaña electoral', 'Quince días de campaña: desde las 0:00 del viernes 13 hasta las 24:00 del viernes 27.'],
  ['2026-11-21', '2026-11-26', 'Residentes en el extranjero', 'Quien reside en el extranjero puede depositar su voto en una urna de su consulado.'],
  ['2026-11-24', '2026-11-28', 'Sondeos', 'Prohibido publicar, difundir o reproducir sondeos electorales.'],
  ['2026-11-28', null, 'Jornada de reflexión', 'No se puede hacer campaña.'],
  ['2026-11-29', null, 'Votación', 'Se vota de 9:00 a 20:00, hora local. Al cerrar, cada mesa cuenta sus votos en público.'],
  ['2026-12-04', '2026-12-07', 'Escrutinio general', 'Las juntas electorales provinciales hacen el escrutinio oficial, con los votos llegados del extranjero, y después proclaman a los electos.'],
  ['2026-12-23', null, 'Nuevas Cortes', 'Sesiones constitutivas del Congreso y del Senado, a las 10:00.'],
];
const DH_EJEMPLO = [['A', 168000], ['B', 104000], ['C', 72000], ['D', 64000], ['E', 40000], ['F', 32000]];   // ejemplo del art. 163 LOREG
// Reparto de escaños: barrera del 3 % de los votos válidos y ley D'Hondt (art. 163 LOREG)
function dhondt(cands, blancos, escanos){
  const validos = cands.reduce((a, c) => a + c.v, 0) + blancos, barrera = validos * .03;
  const ok = cands.filter(c => c.v > 0 && c.v >= barrera);
  const cocientes = [];
  ok.forEach(c => { for (let d = 1; d <= escanos; d++) cocientes.push({c, d, q: c.v / d}); });
  cocientes.sort((a, b) => b.q - a.q || b.c.v - a.c.v);
  const gana = cocientes.slice(0, escanos);
  const sig = cocientes[escanos], ult = gana[gana.length - 1];
  const sorteo = !!(sig && ult && sig.q === ult.q && sig.c.v === ult.c.v);
  const res = new Map(cands.map(c => [c, 0])); gana.forEach(g => res.set(g.c, res.get(g.c) + 1));
  return {validos, barrera, ok, gana: new Set(gana.map(g => g.c.i + ':' + g.d)), res, ult, sorteo};
}
const fmtQ = q => q.toLocaleString('es-ES', {maximumFractionDigits: 2, useGrouping: 'always'});

async function view29N(){
  setTitle('Elecciones del 29-N');
  const [G, M] = await Promise.all([load('generales.json').catch(() => null), load('municipios.json').catch(() => null)]);
  const conv = G && G.convocatoria;
  const e23 = G && G.congreso['2023'];
  // calendario
  const dia = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
  const fechaTxt = (a, b) => { if (!b) return fecha(a).replace(/ de 2026$/, ''); const [, ma, da] = a.split('-').map(Number), [, mb, db] = b.split('-').map(Number); return ma === mb ? `Del ${da} al ${db} de ${MESES[mb - 1]}` : `Del ${da} de ${MESES[ma - 1]} al ${db} de ${MESES[mb - 1]}`; };
  const ahora = ahoraReal().getTime();
  const proximo = CAL_29N.findIndex(r => ahora < dia(r[0]));
  const cal = CAL_29N.map((r, i) => {
    const ini = dia(r[0]), fin = dia(r[1] || r[0]) + 864e5;
    const est = ahora >= fin ? 'past' : ahora >= ini ? 'now' : i === proximo ? 'next' : '';
    const tag = est === 'now' ? (r[1] ? 'En curso' : 'Hoy') : est === 'next' ? 'Lo próximo' : '';
    return `<li class="${est}"><time datetime="${r[0]}">${fechaTxt(r[0], r[1])}</time><b>${esc(r[2])}${tag ? ` <span class="e-tag">${tag}</span>` : ''}${est === 'past' ? '<span class="vh"> (ya pasó)</span>' : ''}</b><span>${esc(r[3])}</span></li>`;
  }).join('');
  // escaños por provincia
  const provs = Object.entries(ESC_2026).map(([k, s]) => {
    const n = (M && M.provincias[k]) || k, antes = e23 && e23.provincias && e23.provincias[k] ? e23.provincias[k].escanos : s;
    return {k, n, s, d: s - antes};
  }).sort((a, b) => b.s - a.s || a.n.localeCompare(b.n, 'es'));
  const cambios = provs.filter(p => p.d);
  // tipos de voto con los datos oficiales del 23-J
  const rc = e23 ? recuentoDe(e23) : null;
  const pc = (a, b) => fmtPct(100 * a / b);
  app.innerHTML = `${bloqueEncuesta()}${avisoElecciones(conv, true)}
  <div class="page-head"><span class="eyebrow">Elecciones generales · 29 de noviembre de 2026</span><h1>Cómo funcionan las elecciones del 29-N</h1>
    <p class="lede">El calendario oficial, cómo se reparten los escaños del Congreso y del Senado y qué significa cada tipo de voto, según la Constitución, la Ley Orgánica del Régimen Electoral General (LOREG), el Real Decreto de convocatoria y la Junta Electoral Central.</p></div>
  <nav class="tabs" aria-label="En esta página"><a class="tab" href="#sec-cal">Calendario</a><a class="tab" href="#sec-congreso">Escaños del Congreso</a><a class="tab" href="#sec-dhondt">Calculadora D'Hondt</a><a class="tab" href="#sec-senado">Senado</a><a class="tab" href="#sec-votos">Tipos de voto</a><a class="tab" href="#sec-como">Cómo votar</a><a class="tab" href="#sec-fuentes">Fuentes</a></nav>
  <div class="e-facts">
    <div class="e-fact"><b>350</b><span>diputados del Congreso, elegidos en 52 circunscripciones: las 50 provincias, Ceuta y Melilla.</span></div>
    <div class="e-fact"><b>176</b><span>escaños son la mayoría absoluta del Congreso, la que hace falta para investir en primera votación.</span></div>
    <div class="e-fact"><b>209</b><span>senadores se eligen en las urnas. Los parlamentos autonómicos designan después a otros.</span></div>
    <div class="e-fact"><b>4 años</b><span>dura la legislatura. Las nuevas Cortes se constituyen el 23 de diciembre.</span></div>
  </div>

  <section class="section" id="sec-cal" aria-labelledby="t-cal"><div class="section-head"><h2 id="t-cal">Calendario electoral</h2><p>Plazos oficiales de la Junta Electoral Central para las elecciones del 29 de noviembre.</p></div>
    <ol class="e-cal">${cal}</ol></section>

  <section class="section" id="sec-congreso" aria-labelledby="t-congreso"><div class="section-head"><h2 id="t-congreso">Cómo se reparten los escaños del Congreso</h2><p>El reparto se hace en dos pasos: primero se decide cuántos diputados elige cada provincia y, después, cómo se reparten entre las candidaturas según los votos de esa provincia.</p></div>
    <ol class="e-steps">
      <li><h3>Paso 1. Cuántos diputados elige cada provincia</h3>
        <p>La Constitución fija la provincia como circunscripción (art. 68) y la LOREG reparte los 350 escaños así (art. 162):</p>
        <ul class="e-list"><li>Cada provincia tiene un mínimo de <b>2 diputados</b>, y Ceuta y Melilla, <b>1 cada una</b>.</li><li>Los <b>248 restantes</b> se reparten según la población: se divide la población de las provincias entre 248, cada provincia recibe tantos diputados como veces contiene ese cociente y los que sobran van a las provincias con los decimales más altos.</li><li>El decreto de convocatoria fija el resultado. Para el 29-N es el anexo del <b>Real Decreto 806/2026</b>.</li></ul>
        ${cambios.length ? `<p class="small">Respecto a 2023 cambian ${listaY(cambios.map(p => `${p.n} (${p.d > 0 ? 'gana' : 'pierde'} ${Math.abs(p.d)}: ${p.s} diputados)`))}.</p>` : ''}
        <ul class="e-prov" aria-label="Diputados por circunscripción en 2026">${provs.map(p => `<li><a href="#prov-${p.k}"><span>${esc(p.n)}</span><b>${p.s}${p.d ? `<span class="chg">${p.d > 0 ? '+' : '−'}${Math.abs(p.d)}</span>` : ''}</b></a></li>`).join('')}</ul>
      </li>
      <li><h3>Paso 2. Quién se queda los escaños de cada provincia</h3>
        <p>Dentro de cada provincia, los escaños se reparten con estas reglas (art. 163 LOREG):</p>
        <ul class="e-list">
          <li><b>Barrera del 3 %.</b> No entran en el reparto las candidaturas con menos del 3 % de los votos válidos de la provincia (incluidos los votos en blanco). La barrera se aplica en cada provincia, no en toda España.</li>
          <li><b>Ley D'Hondt.</b> Los votos de cada candidatura se dividen entre 1, 2, 3… hasta el número de escaños de la provincia. Los escaños van a los cocientes más altos.</li>
          <li><b>Empates.</b> Si dos cocientes coinciden, el escaño es para la candidatura con más votos en total; si también empatan en votos, se sortea.</li>
          <li><b>Listas cerradas.</b> Cada candidatura recibe sus escaños en el orden de su lista: no se puede votar a personas sueltas.</li>
          <li><b>Ceuta y Melilla.</b> Eligen un solo diputado, que es el candidato más votado.</li>
        </ul>
        <p>Este es el ejemplo que trae la propia ley: 480.000 votos válidos en una provincia que elige 8 diputados.</p>
        <div id="dh-ej"></div>
        <p class="small muted">En las provincias que eligen pocos diputados hace falta mucho más del 3 % para conseguir escaño. En la práctica, la barrera legal solo llega a dejar fuera a alguna candidatura en las circunscripciones más grandes, como Madrid y Barcelona.</p>
      </li>
    </ol></section>

  <section class="section" id="sec-dhondt" aria-labelledby="t-dh"><div class="section-head"><h2 id="t-dh">Calculadora D'Hondt</h2><p>Escribe los votos de cada candidatura y los escaños en juego para ver cómo se reparten. Empieza con el ejemplo de la ley.</p></div>
    <div class="sheet pad e-dh">
      <div class="e-dh-cfg">
        <label>Escaños en juego <input type="number" id="dh-esc" min="1" max="60" value="8" inputmode="numeric"></label>
        <label>Usar los de una provincia <select class="select" id="dh-prov"><option value="">Elige una provincia</option>${provs.slice().sort((a, b) => a.n.localeCompare(b.n, 'es')).map(p => `<option value="${p.s}">${esc(p.n)} (${p.s})</option>`).join('')}</select></label>
        <label>Votos en blanco <input type="number" id="dh-bl" min="0" value="0" inputmode="numeric"></label>
      </div>
      <div class="tablewrap"><table class="data e-dh-in"><caption class="vh">Candidaturas y votos de la calculadora</caption><thead><tr><th>Candidatura</th><th class="n">Votos</th><th><span class="vh">Quitar</span></th></tr></thead><tbody id="dh-rows"></tbody></table></div>
      <div class="row"><button class="btn ghost" type="button" id="dh-add">Añadir candidatura</button><button class="btn ghost" type="button" id="dh-reset">Volver al ejemplo de la ley</button></div>
      <p class="e-dh-sum" id="dh-sum" aria-live="polite"></p>
      <div id="dh-out"></div>
    </div></section>

  <section class="section" id="sec-senado" aria-labelledby="t-senado"><div class="section-head"><h2 id="t-senado">Cómo se elige el Senado</h2></div>
    <div class="prose">
      <p>El 29-N se eligen en las urnas <b>209 senadores</b> (art. 69 de la Constitución, art. 165 LOREG y art. 3 del Real Decreto 806/2026):</p>
      <ul><li><b>4</b> en cada provincia, salvo en Illes Balears, Las Palmas y Santa Cruz de Tenerife, donde se vota por islas.</li><li><b>3</b> en Gran Canaria, Mallorca y Tenerife.</li><li><b>1</b> en Ibiza, Formentera, Menorca, Fuerteventura, La Gomera, El Hierro, Lanzarote y La Palma.</li><li><b>2</b> en Ceuta y otros <b>2</b> en Melilla.</li></ul>
      <p>Aquí se vota a personas, no a listas cerradas: en una papeleta común con todos los candidatos se marcan con una cruz hasta <b>3 nombres</b> en las provincias, <b>2</b> en Gran Canaria, Mallorca, Tenerife, Ceuta y Melilla, y <b>1</b> en las demás islas. Ganan los más votados hasta cubrir los puestos (art. 166 LOREG). En las provincias, como cada elector marca 3 nombres para 4 puestos, lo habitual es que la candidatura más votada saque 3 senadores y la segunda, 1.</p>
      <p>Además, cada parlamento autonómico designa un senador y otro más por cada millón de habitantes de su comunidad (art. 69.5 de la Constitución). Esos senadores se nombran después de las elecciones autonómicas, no el 29-N.</p>
    </div></section>

  <section class="section" id="sec-votos" aria-labelledby="t-votos"><div class="section-head"><h2 id="t-votos">Tipos de voto y qué significan</h2>${rc ? '<p>Con las cifras oficiales de las generales del 23 de julio de 2023 como ejemplo.</p>' : ''}</div>
    ${rc ? `<ul class="e-tree" aria-label="Del censo a los votos a candidaturas, 23-J de 2023">
      <li><b>Censo electoral</b> <span class="n">${fmt(rc.censo)}</span><span class="d">Todas las personas con derecho a votar.</span>
        <ul>
          <li><b>Votantes</b> <span class="n">${fmt(rc.votantes)} · ${pc(rc.votantes, rc.censo)} del censo</span><span class="d">Quienes votaron. Su porcentaje sobre el censo es la participación.</span>
            <ul>
              <li><b>Votos válidos</b> <span class="n">${fmt(rc.validos)}</span><span class="d">Los votos a candidaturas más los votos en blanco. Son la base de los porcentajes y de la barrera del 3 %.</span>
                <ul>
                  <li><b>Votos a candidaturas</b> <span class="n">${fmt(rc.cand)} · ${pc(rc.cand, rc.validos)} de los válidos</span><span class="d">Los únicos que dan escaños.</span></li>
                  <li><b>Votos en blanco</b> <span class="n">${fmt(rc.blancos)} · ${pc(rc.blancos, rc.validos)} de los válidos</span><span class="d">Cuentan como válidos, así que suben la barrera del 3 %, pero no dan escaños a nadie.</span></li>
                </ul></li>
              <li><b>Votos nulos</b> <span class="n">${fmt(rc.nulos)} · ${pc(rc.nulos, rc.votantes)} de los votantes</span><span class="d">Cuentan como participación, pero no entran en ningún reparto ni en la barrera.</span></li>
            </ul></li>
          <li><b>Abstención</b> <span class="n">${fmt(rc.censo - rc.votantes)} · ${pc(rc.censo - rc.votantes, rc.censo)} del censo</span><span class="d">Quienes no votaron. No cuenta para nada en el reparto.</span></li>
        </ul></li></ul>` : ''}
    <div class="tablewrap"><table class="data e-cuenta"><caption class="vh">Qué cuenta cada tipo de voto</caption><thead><tr><th>Tipo</th><th>¿Cuenta para la barrera del 3 %?</th><th>¿Puede dar escaños?</th></tr></thead><tbody>
      <tr><td><b>A una candidatura</b></td><td>Sí</td><td>Sí</td></tr>
      <tr><td><b>En blanco</b></td><td>Sí: es un voto válido y sube la barrera</td><td>No</td></tr>
      <tr><td><b>Nulo</b></td><td>No</td><td>No</td></tr>
      <tr><td><b>Abstención</b></td><td>No</td><td>No</td></tr></tbody></table></div>
    <div class="e-two">
      <div><h3>Cuándo un voto es en blanco</h3><ul class="e-list"><li>Cuando el sobre está <b>vacío</b>, sin papeleta.</li><li>En el Senado, también cuando la papeleta <b>no tiene ninguna cruz</b>.</li><li>Ojo: un papel en blanco metido en el sobre no es voto en blanco sino <b>nulo</b>, porque no es una papeleta oficial (Junta Electoral Central).</li></ul></div>
      <div><h3>Cuándo un voto es nulo</h3><ul class="e-list"><li>El sobre o la papeleta no son los oficiales.</li><li>La papeleta va sin sobre.</li><li>En el sobre hay papeletas de candidaturas distintas. Si son varias de la misma, cuenta como un solo voto válido.</li><li>La papeleta tiene nombres tachados, añadidos o cambiados de orden, o cualquier frase, dibujo o alteración hecha a propósito.</li><li>En el Senado, se marcan más nombres de los permitidos.</li></ul><p class="small muted">Art. 96 LOREG.</p></div>
    </div></section>

  <section class="section" id="sec-como" aria-labelledby="t-como"><div class="section-head"><h2 id="t-como">Formas de votar</h2></div>
    <dl class="e-dl">
      <div><dt>En tu colegio electoral</dt><dd>El domingo 29, de 9:00 a 20:00. Lleva el DNI, el pasaporte o el carné de conducir con fotografía (art. 85 LOREG). La papeleta y el sobre del Congreso son blancos; los del Senado, de color sepia.</dd></div>
      <div><dt>Por correo</dt><dd>Se pide en cualquier oficina de Correos, o en su web con certificado digital, hasta el 19 de noviembre. La documentación llega a casa entre el 9 y el 22, y el voto hay que enviarlo hasta el 25.</dd></div>
      <div><dt>Desde el extranjero</dt><dd>Los inscritos como residentes en el extranjero (CERA) reciben la documentación sin pedirla y pueden votar por correo o en una urna de su consulado entre el 21 y el 26 de noviembre.</dd></div>
      <div><dt>Fuera de España por unos días</dt><dd>Quien vaya a estar temporalmente en el extranjero puede pedir el voto del 6 al 31 de octubre.</dd></div>
      <div><dt>En braille</dt><dd>Las personas ciegas o con discapacidad visual pueden pedir hasta el 2 de noviembre la documentación en braille para votar de forma autónoma.</dd></div>
    </dl></section>

  <section class="section" id="sec-fuentes" aria-labelledby="t-fuentes"><div class="section-head"><h2 id="t-fuentes">Fuentes oficiales</h2></div>
    <ul class="e-list">
      <li><a href="https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742" target="_blank" rel="noopener">Real Decreto 806/2026, de 5 de octubre, de disolución del Congreso de los Diputados y del Senado y de convocatoria de elecciones</a> (BOE de 6 de octubre de 2026): fecha, campaña, constitución de las Cortes, diputados por provincia y senadores.</li>
      <li><a href="https://www.juntaelectoralcentral.es/cs/jec/documentos/eg2026_calendario.pdf" target="_blank" rel="noopener">Calendario electoral de las elecciones generales de 29 de noviembre de 2026</a> (Junta Electoral Central).</li>
      <li><a href="https://www.boe.es/buscar/act.php?id=BOE-A-1985-11672" target="_blank" rel="noopener">Ley Orgánica 5/1985, del Régimen Electoral General</a> (texto consolidado en el BOE): arts. 85 (identificación), 96 (votos nulos y en blanco), 162 y 163 (Congreso), 165 y 166 (Senado).</li>
      <li><a href="https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229" target="_blank" rel="noopener">Constitución Española</a>: arts. 68 (Congreso) y 69 (Senado).</li>
    </ul>
    <p class="small muted">Resumen informativo de pactómetro.es, actualizado a ${ACTUALIZADO}. Para cualquier trámite valen siempre el BOE y las resoluciones de la Junta Electoral Central.</p></section>`;
  iniciarCuenta();
  app.querySelectorAll('.tabs a[href^="#sec-"]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const t = app.querySelector(a.getAttribute('href')); t.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); const h = t.querySelector('h2'); if (h){ h.tabIndex = -1; h.focus({preventScroll: true}); } }));
  // ejemplo de la ley (fijo) y calculadora
  const tabla = (cands, blancos, escanos, r) => {
    const cols = Math.min(escanos, 12);
    const filas = cands.slice().sort((a, b) => b.v - a.v).map(c => {
      const dentro = r.ok.includes(c);
      const celdas = Array.from({length: cols}, (_, j) => { const d = j + 1, g = dentro && r.gana.has(c.i + ':' + d); return `<td class="n${g ? ' win' : ''}${dentro ? '' : ' out'}">${dentro ? fmtQ(c.v / d) : '—'}${g ? '<span class="vh"> (escaño)</span>' : ''}</td>`; }).join('');
      return `<tr><th scope="row">${esc(c.n || 'Sin nombre')}</th><td class="n">${fmtQ(c.v)}</td><td class="n">${r.validos ? fmtPct(100 * c.v / r.validos) : '—'}</td>${celdas}<td class="n"><b>${dentro ? r.res.get(c) : '—'}</b></td></tr>`;
    }).join('');
    return `<div class="tablewrap"><table class="data e-dh-t"><caption class="vh">Cocientes de la ley D'Hondt. Las celdas marcadas obtienen escaño.</caption><thead><tr><th>Candidatura</th><th class="n">Votos</th><th class="n">% válidos</th>${Array.from({length: cols}, (_, j) => `<th class="n">÷ ${j + 1}</th>`).join('')}<th class="n">Escaños</th></tr></thead><tbody>${filas}</tbody></table></div>${escanos > 12 ? '<p class="small muted">Se muestran los doce primeros divisores; el reparto usa todos.</p>' : ''}`;
  };
  const ej = DH_EJEMPLO.map(([n, v], i) => ({i, n, v}));
  const rej = dhondt(ej, 0, 8);
  app.querySelector('#dh-ej').innerHTML = tabla(ej, 0, 8, rej).replace('<caption class="vh">Cocientes', '<caption class="vh">Ejemplo del artículo 163 de la LOREG: cocientes') + `<p class="small">Resultado: A, 4 escaños; B, 2; C, 1, y D, 1. E y F superan el 3 % (14.400 votos) pero sus cocientes no llegan a los ocho más altos.</p>`;
  const $rows = app.querySelector('#dh-rows'), $esc = app.querySelector('#dh-esc'), $bl = app.querySelector('#dh-bl'), $out = app.querySelector('#dh-out'), $sum = app.querySelector('#dh-sum');
  let filas = DH_EJEMPLO.map(([n, v]) => ({n, v}));
  const pintarFilas = () => {
    $rows.innerHTML = filas.map((f, i) => `<tr><td><input type="text" data-i="${i}" data-f="n" value="${esc(f.n)}" aria-label="Nombre de la candidatura ${i + 1}" maxlength="30"></td><td class="n"><input type="number" data-i="${i}" data-f="v" value="${f.v}" min="0" inputmode="numeric" aria-label="Votos de la candidatura ${i + 1}"></td><td><button class="btn ghost" type="button" data-q="${i}" aria-label="Quitar la candidatura ${i + 1}"${filas.length < 2 ? ' disabled' : ''}>Quitar</button></td></tr>`).join('');
  };
  const calcular = () => {
    const escanos = Math.max(1, Math.min(60, parseInt($esc.value, 10) || 1)), blancos = Math.max(0, parseInt($bl.value, 10) || 0);
    const cands = filas.map((f, i) => ({i, n: f.n.trim(), v: Math.max(0, Math.round(+f.v) || 0)}));
    const r = dhondt(cands, blancos, escanos);
    if (!r.validos){ $out.innerHTML = ''; $sum.textContent = 'Escribe los votos de al menos una candidatura.'; return; }
    const reparto = cands.filter(c => r.res.get(c) > 0).sort((a, b) => r.res.get(b) - r.res.get(a)).map(c => `${c.n || 'Sin nombre'} (${r.res.get(c)})`);
    const fuera = cands.filter(c => c.v > 0 && !r.ok.includes(c)).map(c => c.n || 'Sin nombre');
    $sum.innerHTML = `<b>Reparto de ${escanos} ${escanos === 1 ? 'escaño' : 'escaños'}:</b> ${esc(listaY(reparto)) || 'ninguno'}. La barrera del 3 % es de ${fmt(Math.ceil(r.barrera))} votos (sobre ${fmt(r.validos)} válidos).${fuera.length ? ` No llegan: ${esc(listaY(fuera))}.` : ''}${r.ult ? ` El último escaño se adjudica con un cociente de ${fmtQ(r.ult.q)}.` : ''}${r.sorteo ? ' Hay un empate exacto en el último escaño: se resolvería por sorteo.' : ''}`;
    $out.innerHTML = tabla(cands, blancos, escanos, r);
  };
  $rows.addEventListener('input', ev => { const t = ev.target, i = +t.dataset.i; if (!filas[i]) return; filas[i][t.dataset.f] = t.dataset.f === 'v' ? t.value : t.value; calcular(); });
  $rows.addEventListener('click', ev => { const b = ev.target.closest('[data-q]'); if (!b || filas.length < 2) return; filas.splice(+b.dataset.q, 1); pintarFilas(); calcular(); const f = $rows.querySelector('input'); if (f) f.focus(); });
  app.querySelector('#dh-add').addEventListener('click', () => { filas.push({n: String.fromCharCode(65 + filas.length % 26), v: 0}); pintarFilas(); calcular(); const nf = $rows.querySelector('tr:last-child input'); nf.focus(); nf.select(); });
  app.querySelector('#dh-reset').addEventListener('click', () => { filas = DH_EJEMPLO.map(([n, v]) => ({n, v})); $esc.value = 8; $bl.value = 0; app.querySelector('#dh-prov').value = ''; pintarFilas(); calcular(); });
  app.querySelector('#dh-prov').addEventListener('change', ev => { if (ev.target.value){ $esc.value = ev.target.value; calcular(); } });
  $esc.addEventListener('input', calcular); $bl.addEventListener('input', calcular);
  pintarFilas(); calcular();
}

/* ================================================================ vista: autonomías */
async function viewAutonomias(){
  const A = await load('autonomicas.json');
  const ids = Object.keys(A).sort((a, b) => A[a].n.localeCompare(A[b].n, 'es'));
  app.innerHTML = `<div class="page-head"><span class="eyebrow">17 parlamentos y 2 asambleas</span><h1>Parlamentos autonómicos</h1>
    <p class="lede">Resultado de las últimas elecciones de cada comunidad y ciudad autónoma. Entra en cualquiera para probar pactos o recorrer todas sus elecciones desde 1980.</p></div>
    <h2 class="vh">Últimas elecciones de cada comunidad</h2>
    <div class="cards">${ids.map(id => { const a = A[id], e = a.elecciones[a.elecciones.length - 1]; return `<a class="card" href="#auto-${id}">
      <div class="stack" style="gap:2px"><span class="eyebrow">${esc(a.camara)}</span><h3>${esc(a.n)}</h3></div>
      ${miniBar(e.r, e.escanos)}${miniLegend(e.r)}
      <div class="meta"><span>${fecha(e.fecha)}</span><span>${e.escanos} escaños · mayoría ${Math.floor(e.escanos / 2) + 1}</span></div>
      ${a.gobierno ? `<div class="gov">Presidencia: ${esc(a.gobierno.presidente)}</div>` : ''}</a>`; }).join('')}</div>
    <div class="section"><div class="section-head"><h2>Quién ganó cada elección</h2><p>Cada franja es una legislatura, del día de las elecciones al de las siguientes, con el color de la candidatura con más escaños. Opaca si tuvo mayoría absoluta; translúcida si no. Pulsa una franja para abrir esa elección.</p></div>
    <div id="tl"></div></div>`;
  app.querySelector('#tl').appendChild(timeline(ids.map(id => ({label: A[id].n, href: x => `#auto-${id}.${x.fecha}`, items: A[id].elecciones.map(e => ({fecha: e.fecha, r: e.r, total: e.escanos}))})), '1980-01-01'));
}
async function viewAutonomia(id, fechaSel){
  const A = await load('autonomicas.json');
  const a = own(A, id); if (!a) return notFound();
  const els = a.elecciones;
  const e = els.find(x => x.fecha === fechaSel) || els[els.length - 1];
  const ultima = e === els[els.length - 1];
  const partidos = e.r.map(rowToParty);
  const rc = recuentoDe(e), validos = validosDe(e.r, rc);
  setTitle(a.n);
  app.innerHTML = `<div class="page-head"><span class="eyebrow">${esc(a.camara)} · ${e.escanos} escaños</span><h1>${esc(a.n)}</h1>
    <div class="row">${badge(e.fuente)}<span class="small muted">Elecciones del ${fecha(e.fecha)}</span></div>
    ${ultima && a.gobierno ? `<p class="lede">Presidencia actual: <b>${esc(a.gobierno.presidente)}</b>. ${esc(a.gobierno.nota)}</p>` : ''}
    ${a.nota ? `<p class="small muted">${esc(a.nota)}</p>` : ''}</div>
    <div class="tabs"><a class="tab" href="#autonomias">← Todas las autonomías</a>
      <select class="select" id="sel-el" aria-label="Elección">${els.slice().reverse().map(x => `<option value="${x.fecha}" ${x === e ? 'selected' : ''}>${fecha(x.fecha)}</option>`).join('')}</select>
      ${cmpLink(`auto:${id}:${e.fecha}`)}</div>
    <div class="sheet pad" id="pacto-slot"></div>
    <div class="section"><div class="section-head"><h2>Todas sus elecciones</h2><p>Escaños por candidatura en cada elección. La marca vertical indica la mayoría absoluta.</p></div><div class="hbars" id="hist"></div></div>
    <div class="section"><div class="section-head"><h2>${e.r.some(r => r[4]) ? 'Resultado' : 'Resultado en escaños'}</h2></div>${resultsTable(e.r, {validos})}</div>`;
  app.querySelector('#sel-el').addEventListener('change', ev => irA(`auto-${id}.${ev.target.value}`));
  app.querySelector('#pacto-slot').appendChild(Pactometro({total: e.escanos, partidos, regla: 'parlamento', preset: presetLargest(partidos), votosValidos: validos, recuento: rc,
    exportar: {institucion: a.camara, eleccion: 'Elecciones del ' + fecha(e.fecha), fecha: e.fecha, fuente: e.fuente, archivo: `${id}-${e.fecha}`,
      historico: els.slice().reverse().map(x => ({eleccion: 'Autonómicas ' + x.fecha.slice(0, 4), fecha: x.fecha, total: x.escanos, r: x.r, rc: recuentoDe(x)}))},
    presetNota: 'Empieza con la candidatura con más escaños a favor. Cambia los votos o pulsa una de las combinaciones posibles.'}));
  const h = app.querySelector('#hist');
  h.innerHTML = els.slice().reverse().map(x => hbar(x.fecha.slice(0, 4), fechaCorta(x.fecha), x.r, x.escanos, `#auto-${id}.${x.fecha}`)).join('');
  wireBarTips(h);
}

/* ================================================================ vista: diputaciones, cabildos, consells, juntas */
const TIPOS = {
  dip: {k: 'diputaciones', titulo: 'Diputaciones provinciales', regla: 'diputacion', pref: 'Diputación de '},
  cab: {k: 'cabildos', titulo: 'Cabildos insulares', regla: 'insular', pref: 'Cabildo de '},
  con: {k: 'consells', titulo: 'Consells insulars', regla: 'insular', pref: ''},
  jjgg: {k: 'juntas', titulo: 'Juntas Generales', regla: 'insular', pref: ''},
};
const DIP_NOMBRE = {'03': 'Diputación de Alicante', '12': 'Diputación de Castellón', '46': 'Diputación de Valencia', '17': 'Diputació de Girona', '25': 'Diputació de Lleida', '43': 'Diputació de Tarragona', '08': 'Diputació de Barcelona', '15': 'Deputación da Coruña', '27': 'Deputación de Lugo', '32': 'Deputación de Ourense', '36': 'Deputación de Pontevedra'};
const nombreLocal = (tipo, x) => tipo === 'dip' ? (DIP_NOMBRE[x.id] || 'Diputación de ' + x.n.split('/')[0]) : tipo === 'cab' ? 'Cabildo de ' + x.n : x.n;
async function viewLocales(){
  const [L, M] = await Promise.all([load('locales.json'), load('municipios.json')]);
  const card = (tipo, x) => { const ys = Object.keys(x.e).sort(); const e = x.e[ys[ys.length - 1]]; return `<a class="card" href="#${tipo}-${x.id}">
      <h3>${esc(nombreLocal(tipo, x))}</h3>${miniBar(e.r, e.escanos)}${miniLegend(e.r, 4)}
      <div class="meta"><span>${fecha(e.fecha)}</span><span>${e.escanos} escaños</span></div></a>`; };
  const dips = Object.values(L.diputaciones);
  const byCa = {};
  dips.forEach(d => (byCa[d.ca] = byCa[d.ca] || []).push(d));
  const caOrder = Object.keys(byCa).sort((a, b) => M.ccaa[a].localeCompare(M.ccaa[b], 'es'));
  app.innerHTML = `<div class="page-head"><span class="eyebrow">Gobiernos provinciales e insulares</span><h1>Diputaciones, cabildos, consells y juntas</h1>
    <p class="lede">Las 38 diputaciones de régimen común se forman con los resultados municipales de cada partido judicial; los cabildos canarios, los consells baleares y las juntas generales vascas se eligen en urnas propias.</p></div>
    <div class="tabs"><a class="tab" href="#locales">Todas</a><a class="tab" href="#sec-cab">Cabildos</a><a class="tab" href="#sec-con">Consells</a><a class="tab" href="#sec-jjgg">Juntas Generales</a></div>
    <div class="stack" style="gap:26px">${caOrder.map(ca => `<div class="stack"><h2 class="group-label">${esc(M.ccaa[ca])}</h2><div class="cards">${byCa[ca].sort((a, b) => a.n.localeCompare(b.n, 'es')).map(d => card('dip', d)).join('')}</div></div>`).join('')}
    <div class="stack" id="sec-cab"><h2 class="group-label">Cabildos insulares · Canarias</h2><div class="cards">${Object.values(L.cabildos).sort((a, b) => a.n.localeCompare(b.n, 'es')).map(c => card('cab', c)).join('')}</div></div>
    <div class="stack" id="sec-con"><h2 class="group-label">Consells insulars · Illes Balears</h2><div class="cards">${Object.values(L.consells).map(c => card('con', c)).join('')}</div></div>
    <div class="stack" id="sec-jjgg"><h2 class="group-label">Juntas Generales · País Vasco</h2><div class="cards">${Object.values(L.juntas).map(c => card('jjgg', c)).join('')}</div></div></div>`;
  app.querySelectorAll('.tabs a[href^="#sec-"]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); app.querySelector(a.getAttribute('href')).scrollIntoView({behavior: 'smooth'}); }));
}
async function viewLocal(tipo, id, year){
  const L = await load('locales.json');
  const T = TIPOS[tipo]; const x = own(L[T.k], id); if (!x) return notFound();
  const ys = Object.keys(x.e).sort();
  const y = (year && x.e[year]) ? year : ys[ys.length - 1];
  const e = x.e[y];
  const partidos = e.r.map(rowToParty);
  const rc = recuentoDe(e), validos = validosDe(e.r, rc);
  const titulo = nombreLocal(tipo, x);
  setTitle(titulo);
  app.innerHTML = `<div class="page-head"><span class="eyebrow">${esc(T.titulo)} · ${e.escanos} escaños</span><h1>${esc(titulo)}</h1>
    <div class="row">${badge(e.fuente)}<span class="small muted">${tipo === 'dip' ? 'Constituida tras las elecciones municipales del ' : 'Elecciones del '}${fecha(e.fecha)}</span></div>
    ${x.nota ? `<p class="small muted">${esc(x.nota)}</p>` : ''}
    ${tipo === 'dip' ? '<p class="small muted">Los votos son la suma de los obtenidos por cada candidatura en los municipios de la provincia; los diputados se reparten por partidos judiciales.</p>' : ''}</div>
    <div class="tabs"><a class="tab" href="#locales">← Todas</a>${ys.length > 1 ? `<select class="select" id="sel-el" aria-label="Elección">${ys.slice().reverse().map(k => `<option value="${k}" ${k === y ? 'selected' : ''}>${fecha(x.e[k].fecha)}</option>`).join('')}</select>` : ''}${cmpLink(`${tipo}:${id}:${y}`)}</div>
    <div class="sheet pad" id="pacto-slot"></div>
    ${ys.length > 1 ? `<div class="section"><div class="section-head"><h2>Todas sus elecciones</h2></div><div class="hbars" id="hist"></div></div>` : ''}
    <div class="section"><div class="section-head"><h2>Resultado</h2></div>${resultsTable(e.r, {validos})}</div>`;
  const sel = app.querySelector('#sel-el'); if (sel) sel.addEventListener('change', ev => irA(`${tipo}-${id}.${ev.target.value}`));
  app.querySelector('#pacto-slot').appendChild(Pactometro({total: e.escanos, partidos, regla: T.regla, preset: presetLargest(partidos), votosValidos: validos || 0, recuento: rc,
    exportar: {institucion: titulo, eleccion: (tipo === 'dip' ? 'Tras las municipales del ' : 'Elecciones del ') + fecha(e.fecha), fecha: e.fecha, fuente: e.fuente, archivo: `${archivoSlug(titulo)}-${y}`,
      historico: ys.slice().reverse().map(k => ({eleccion: (tipo === 'dip' ? 'Municipales ' : 'Elecciones ') + k, fecha: x.e[k].fecha, total: x.e[k].escanos, r: x.e[k].r, rc: recuentoDe(x.e[k])}))},
    presetNota: 'Empieza con la candidatura con más escaños a favor.'}));
  const h = app.querySelector('#hist');
  if (h){ h.innerHTML = ys.slice().reverse().map(k => hbar(k, fechaCorta(x.e[k].fecha), x.e[k].r, x.e[k].escanos, `#${tipo}-${id}.${k}`)).join(''); wireBarTips(h); }
}

/* ================================================================ vista: ayuntamientos */
async function viewAyuntamientos(q0){
  const M = await load('municipios.json');
  const idx = M.municipios;
  if (!M._n) M._n = idx.map(r => norm(r[1]));
  const byIne = {}; idx.forEach(r => byIne[r[0]] = r);
  const provOpts = Object.entries(M.provincias).sort((a, b) => a[1].localeCompare(b[1], 'es')).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  app.innerHTML = `<div class="page-head"><span class="eyebrow">Todos los municipios de España</span><h1>Ayuntamientos</h1>
    <p class="lede">Busca tu municipio para ver su pleno, calcular quién puede gobernar y recorrer sus elecciones municipales desde 1979. Resultados oficiales del Ministerio del Interior: 8.087 municipios con resultados en 2023; en el resto no hubo candidaturas o no constan resultados.</p></div>
    <div class="search"><input type="search" id="q" placeholder="Escribe un municipio: Lugo, Getafe, Ponferrada…" aria-label="Buscar municipio" autocomplete="off">
      <select class="select" id="prov" aria-label="Provincia"><option value="">Todas las provincias</option>${provOpts}</select></div>
    <p class="small muted" id="count" style="margin:12px 0"></p>
    <div class="results" id="res"></div>`;
  const $q = app.querySelector('#q'), $p = app.querySelector('#prov'), $res = app.querySelector('#res'), $c = app.querySelector('#count');
  const item = r => `<a class="result" href="#mun-${r[0]}"><span class="t"><b>${esc(r[1])}</b><small>${r[4] ? fmt(r[4]) + ' hab.' : ''}</small></span><span class="p">${esc(M.provincias[r[2]])} · ${r[3] === 2023 ? 'pleno de 2023' : 'último dato: ' + r[3]}</span></a>`;
  function render(){
    const q = norm($q.value.trim()), p = $p.value;
    let list;
    if (!q && !p){ list = M.capitales.map(c => byIne[c]).filter(Boolean); $c.textContent = 'Capitales de provincia y de comunidad. Escribe para buscar entre los ' + fmt(idx.length) + ' municipios con datos.'; }
    else {
      list = [];
      for (let i = 0; i < idx.length; i++){ const r = idx[i]; if (p && r[2] !== p) continue; if (q && !M._n[i].includes(q)) continue; list.push(r); }
      list.sort((a, b) => (q ? (norm(a[1]).startsWith(q) ? 0 : 1) - (norm(b[1]).startsWith(q) ? 0 : 1) : 0) || (b[3] - a[3]) || (b[4] - a[4]));
      $c.textContent = list.length ? `${fmt(list.length)} municipio${list.length === 1 ? '' : 's'}${list.length > 60 ? ' · se muestran los 60 primeros' : ''}` : 'Ningún municipio coincide. Prueba sin tildes o con otra provincia.';
      list = list.slice(0, 60);
    }
    $res.innerHTML = list.map(item).join('');
  }
  $q.addEventListener('input', render); $p.addEventListener('change', render);
  if (q0) $q.value = q0;
  render(); if (!q0) $q.focus({preventScroll: true});
}
async function viewMunicipio(ine, year){
  const M = await load('municipios.json');
  const prov = ine.slice(0, 2);
  const P = await load('mun/' + prov + '.json');
  const m = P.m[ine]; if (!m) return notFound();
  const ys = Object.keys(m.e).sort();
  const y = (year && m.e[year]) ? year : ys[ys.length - 1];
  const rec = m.e[y];
  const [tipo, escanos, censo, votantes, blancos, nulos, res] = rec;
  const rows = res.map(([ci, v, s]) => { const c = P.c[ci]; return [c[0], c[1], c[2], c[3], v, s]; });
  rows.sort((a, b) => b[5] - a[5] || b[4] - a[4]);
  const validos = votantes - nulos;
  const partidos = rows.map(rowToParty);
  const masVotada = rows.slice().sort((a, b) => (b[4] || 0) - (a[4] || 0))[0];
  const L = await load('locales.json').catch(() => null);
  const dip = L && L.diputaciones[prov];
  const ix = M.municipios.find(r => r[0] === ine);
  setTitle(m.n);
  const TIPO = {G: 'Listas cerradas', A: 'Listas abiertas (municipio de 100 a 250 habitantes)', C: 'Concejo abierto (menos de 100 habitantes)'};
  app.innerHTML = `<div class="page-head"><span class="eyebrow">${esc(M.provincias[prov])} · ${esc(M.ccaa[P.ca] || '')}</span><h1>${esc(m.n)}</h1>
    <div class="row">${badge('oficial')}<span class="small muted">Elecciones municipales del ${y} · ${tipo === 'C' ? 'alcalde de elección directa' : escanos + ' concejales'}${ix && ix[4] ? ` · ${fmt(ix[4])} habitantes (${ix[3]})` : ''}</span></div>
    <p class="small muted">${TIPO[tipo] || ''}${censo ? ` · censo ${fmt(censo)} · votantes ${fmt(votantes)} (${fmtPct(100 * votantes / censo)})` : ''}</p></div>
    <div class="tabs"><a class="tab" href="#ayuntamientos">← Buscar otro municipio</a>
      <select class="select" id="sel-el" aria-label="Elección">${ys.slice().reverse().map(k => `<option value="${k}" ${k === y ? 'selected' : ''}>Municipales ${k}</option>`).join('')}</select>
      ${dip ? `<a class="tab" href="#dip-${prov}">${esc(nombreLocal('dip', dip))} →</a>` : ''}${cmpLink(`mun:${ine}:${y}`)}</div>
    <div class="sheet pad" id="pacto-slot"></div>
    ${ys.length > 1 ? `<div class="section"><div class="section-head"><h2>Su historia electoral</h2><p>Concejales por candidatura en cada elección municipal. Pulsa una fila para abrirla en el pactómetro.</p></div><div class="hbars" id="hist"></div></div>` : ''}
    <div class="section"><div class="section-head"><h2>Resultado de ${y}</h2></div>${resultsTable(rows, {validos: validos - 0, unit: tipo === 'C' ? 'Electo' : 'Concejales'})}
    <p class="small muted">Votos válidos: ${fmt(validos)} · en blanco: ${fmt(blancos)} · nulos: ${fmt(nulos)}.</p></div>`;
  app.querySelector('#sel-el').addEventListener('change', ev => irA(`mun-${ine}.${ev.target.value}`));
  const slot = app.querySelector('#pacto-slot');
  if (tipo === 'C' || escanos < 2){
    const el = rows.filter(r => r[5] > 0);
    slot.innerHTML = `<div class="stack"><span class="eyebrow">Concejo abierto</span><h2>${el.length ? esc(el.map(r => niceSig(r[0])).join(', ')) : 'Sin candidato electo en los datos'}</h2><p class="muted">En los municipios de menos de 100 habitantes que funcionan en concejo abierto los vecinos eligen directamente al alcalde, sin pleno de concejales. No hay pactos que calcular.</p></div>`;
  } else {
    const filasDe = r => r[6].map(([ci, v, s2]) => { const c = P.c[ci]; return [c[0], c[1], c[2], c[3], v, s2]; });
    slot.appendChild(Pactometro({total: escanos, partidos, regla: 'municipal', preset: presetLargest(partidos), votosValidos: validos, masVotada: masVotada ? {sig: masVotada[0], votos: masVotada[4]} : null,
      recuento: recuentoMun(rec),
      exportar: {institucion: 'Ayuntamiento de ' + m.n + ' (' + M.provincias[prov] + ')', eleccion: 'Elecciones municipales de ' + y, fecha: null, fuente: 'oficial', archivo: `${archivoSlug(m.n)}-${ine}-${y}`,
        historico: ys.slice().reverse().map(k => ({eleccion: 'Municipales ' + k, fecha: null, total: Math.max(m.e[k][1], 1), r: filasDe(m.e[k]), rc: recuentoMun(m.e[k])}))},
      presetNota: tipo === 'A' ? 'Listas abiertas: los vecinos votan a personas; aquí se agrupan los concejales por candidatura.' : 'Empieza con la candidatura con más concejales a favor.'}));
  }
  const h = app.querySelector('#hist');
  if (h){
    h.innerHTML = ys.slice().reverse().map(k => { const r = m.e[k]; const rr = r[6].map(([ci, v, s]) => { const c = P.c[ci]; return [c[0], c[1], c[2], c[3], v, s]; }).sort((a, b) => b[5] - a[5]); return hbar(k, r[0] === 'C' ? 'concejo abierto' : r[1] + ' concejales', rr, Math.max(r[1], 1), `#mun-${ine}.${k}`, {noMark: r[0] === 'C'}); }).join('');
    wireBarTips(h, 'concejales');
  }
}

/* ================================================================ vista: comparar */
const CMP_TIPOS = [
  ['congreso', 'Congreso · toda España'],
  ['congreso-ca', 'Congreso · en una comunidad'],
  ['congreso-prov', 'Congreso · en una provincia'],
  ['auto', 'Parlamento autonómico'],
  ['dip', 'Diputación provincial'],
  ['cab', 'Cabildo insular'],
  ['con', 'Consell insular'],
  ['jjgg', 'Juntas Generales'],
  ['mun', 'Ayuntamiento'],
];
const CMP_LETRAS = ['A', 'B', 'C', 'D'];
const cmpSpec = s => `${s.t}:${s.id || ''}:${s.y || ''}`;
const cmpParse = str => { const [t, id, y] = String(str || '').split(':'); return CMP_TIPOS.some(x => x[0] === t) ? {t, id: id || '', y: y || ''} : null; };
// Territorios y elecciones disponibles para un tipo (y territorio)
async function cmpOpciones(t, id){
  const M = await load('municipios.json');
  if (t.startsWith('congreso')){
    const G = await load('generales.json');
    const ks = Object.keys(G.congreso).sort().reverse().filter(k => t === 'congreso' || G.congreso[k].provincias);
    let terr = [];
    if (t === 'congreso-prov') terr = Object.entries(M.provincias).sort((a, b) => a[1].localeCompare(b[1], 'es'));
    if (t === 'congreso-ca') terr = Object.entries(M.ccaa).filter(([k]) => Object.values(M.prov_ccaa).includes(k)).sort((a, b) => a[1].localeCompare(b[1], 'es'));
    return {terr, elecciones: ks.map(k => [k, 'Generales ' + LEYENDA_ELECCION(k)])};
  }
  if (t === 'auto'){
    const A = await load('autonomicas.json');
    const terr = Object.keys(A).sort((a, b) => A[a].n.localeCompare(A[b].n, 'es')).map(k => [k, A[k].n]);
    const a = A[id] || A[terr[0][0]];
    return {terr, elecciones: a.elecciones.slice().reverse().map(e => [e.fecha, fecha(e.fecha)])};
  }
  if (TIPOS[t]){
    const L = await load('locales.json'); const grp = L[TIPOS[t].k];
    const terr = Object.values(grp).sort((a, b) => nombreLocal(t, a).localeCompare(nombreLocal(t, b), 'es')).map(x => [x.id, nombreLocal(t, x)]);
    const x = grp[id] || grp[terr[0][0]];
    return {terr, elecciones: Object.keys(x.e).sort().reverse().map(k => [k, (t === 'dip' ? 'Municipales ' : 'Elecciones ') + k])};
  }
  if (t === 'mun'){
    const prov = (id || '15078').slice(0, 2);
    const terr = M.municipios.filter(r => r[2] === prov).sort((a, b) => a[1].localeCompare(b[1], 'es')).map(r => [r[0], r[1]]);
    const P = await load('mun/' + prov + '.json');
    const m = P.m[id] || P.m[terr[0][0]];
    return {terr, provincias: Object.entries(M.provincias).sort((a, b) => a[1].localeCompare(b[1], 'es')), elecciones: m ? Object.keys(m.e).sort().reverse().map(k => [k, 'Municipales ' + k]) : []};
  }
  return {terr: [], elecciones: []};
}
// Normaliza una selección: {titulo, lugar, eleccion, total, conMayoria, rows, rc, fuente, href}
async function cmpDatos(s){
  const M = await load('municipios.json');
  if (s.t.startsWith('congreso')){
    const G = await load('generales.json'); const e = own(G.congreso, s.y); if (!e) return null;
    const base = {eleccion: 'Generales ' + LEYENDA_ELECCION(s.y), fecha: e.fecha, fuente: e.fuente || 'oficial', href: '#congreso-' + s.y};
    if (s.t === 'congreso') return {...base, titulo: 'Congreso de los Diputados', lugar: 'España', total: e.escanos || 350, conMayoria: true, rows: e.r, rc: recuentoDe(e)};
    if (!e.provincias) return null;
    const provs = s.t === 'congreso-prov' ? [s.id] : Object.keys(e.provincias).filter(p => M.prov_ccaa[p] === s.id);
    const map = new Map(); let total = 0;
    for (const pk of provs){
      const pv = own(e.provincias, pk); if (!pv) continue; total += pv.escanos;
      for (const r of pv.r){ const k = r[0]; const cur = map.get(k); if (cur){ cur[4] = (cur[4] || 0) + (r[4] || 0); cur[5] += r[5] || 0; } else map.set(k, [r[0], r[1], r[2], r[3], r[4] || 0, r[5] || 0]); }
    }
    if (!map.size) return null;
    const lugar = s.t === 'congreso-prov' ? M.provincias[s.id] : M.ccaa[s.id];
    return {...base, titulo: 'Congreso · voto en ' + lugar, lugar, total, conMayoria: false, rows: [...map.values()].sort((a, b) => b[5] - a[5] || b[4] - a[4]), rc: null,
      nota: 'Diputados elegidos en ' + (s.t === 'congreso-prov' ? 'la provincia' : 'las provincias de la comunidad') + '; votos de las candidaturas que figuran en los datos provinciales.'};
  }
  if (s.t === 'auto'){
    const A = await load('autonomicas.json'); const a = own(A, s.id); if (!a) return null;
    const e = a.elecciones.find(x => x.fecha === s.y); if (!e) return null;
    return {titulo: a.camara, lugar: a.n, eleccion: 'Autonómicas ' + fecha(e.fecha), fecha: e.fecha, total: e.escanos, conMayoria: true, rows: e.r, rc: recuentoDe(e), fuente: e.fuente, href: `#auto-${s.id}.${e.fecha}`};
  }
  if (TIPOS[s.t]){
    const L = await load('locales.json'); const x = own(L[TIPOS[s.t].k], s.id); if (!x) return null;
    const e = own(x.e, s.y); if (!e) return null;
    return {titulo: nombreLocal(s.t, x), lugar: x.n, eleccion: (s.t === 'dip' ? 'Municipales ' : 'Elecciones ') + fecha(e.fecha), fecha: e.fecha, total: e.escanos, conMayoria: true, rows: e.r, rc: recuentoDe(e), fuente: e.fuente, href: `#${s.t}-${s.id}.${s.y}`};
  }
  if (s.t === 'mun'){
    if (!/^\d{5}$/.test(s.id)) return null;
    const P = await load('mun/' + s.id.slice(0, 2) + '.json'); const m = own(P.m, s.id); if (!m) return null;
    const rec = own(m.e, s.y); if (!rec) return null;
    const rows = rec[6].map(([ci, v, sx]) => { const c = P.c[ci]; return [c[0], c[1], c[2], c[3], v, sx]; }).sort((a, b) => b[5] - a[5] || b[4] - a[4]);
    return {titulo: 'Ayuntamiento de ' + m.n, lugar: m.n + ' (' + M.provincias[s.id.slice(0, 2)] + ')', eleccion: 'Municipales ' + s.y, fecha: null, total: Math.max(rec[1], 1), conMayoria: rec[0] !== 'C', rows, rc: recuentoMun(rec), fuente: 'oficial', href: `#mun-${s.id}.${s.y}`};
  }
  return null;
}
// Agrupa los resultados por familia política o por candidatura para poder compararlos
function cmpAgrupar(datos, modo){
  const claves = new Map();
  const vals = datos.map(d => {
    const out = new Map(); if (!d) return out;
    const filas = d.rows.slice(); const ot = otrasFila(d.rows, d.rc); if (ot) filas.push(ot);
    for (const r of filas){
      const k = modo === 'fam' ? (r[3] || 'local') : (r[3] === 'otras' ? '~otras' : norm(niceSig(r[0])));
      if (!claves.has(k)) claves.set(k, modo === 'fam' ? {k, label: famCorto(k), largo: famNombre(k), color: famColor(k)} : {k, label: r[3] === 'otras' ? 'Resto sin escaño' : niceSig(r[0]), largo: r[1] ? nice(r[1]) : '', color: r[2]});
      const c = out.get(k) || {votos: 0, esc: 0, tieneV: false};
      c.votos += r[4] || 0; c.esc += r[5] || 0; c.tieneV = c.tieneV || !!r[4];
      out.set(k, c);
    }
    return out;
  });
  const tot = datos.map(d => d ? {validos: validosDe(d.rows, d.rc), total: d.total, hayV: d.rows.some(r => r[4])} : null);
  const share = (k, i, met) => { const v = vals[i].get(k), t = tot[i]; if (!v || !t) return 0; return met === 'votos' ? (t.hayV && t.validos ? v.votos / t.validos : 0) : met === 'escp' ? v.esc / t.total : v.esc; };
  const keys = [...claves.values()];
  keys.forEach(c => { c.peso = Math.max(...datos.map((_, i) => Math.max(share(c.k, i, 'votos'), share(c.k, i, 'escp')))); });
  keys.sort((a, b) => (a.k === 'otras' || a.k === '~otras') - (b.k === 'otras' || b.k === '~otras') || (a.k === 'local') - (b.k === 'local') || b.peso - a.peso);
  return {keys, vals, tot, share};
}
const CMP_ESTADO = {sels: null, modo: 'fam', met: null};
async function viewComparar(query){
  setTitle('Comparar');
  const q = new URLSearchParams(query || '');
  let sels = (q.get('s') || '').split('|').map(cmpParse).filter(Boolean).slice(0, 4);
  if (sels.length === 1) sels.push(sels[0].t === 'congreso' && sels[0].y !== '2023' ? {t: 'congreso', id: '', y: '2023'} : {t: 'congreso', id: '', y: sels[0].t === 'congreso' ? '2019-11' : '2023'});
  if (!sels.length) sels = [{t: 'congreso', id: '', y: '2023'}, {t: 'congreso', id: '', y: '2019-11'}];
  const st = {sels, modo: q.get('m') === 'cand' ? 'cand' : 'fam', met: ['votos', 'escp', 'esc'].includes(q.get('v')) ? q.get('v') : null};
  app.innerHTML = `<div class="page-head"><span class="eyebrow">Cruce de datos</span><h1>Comparar</h1>
    <p class="lede">Elige hasta cuatro instituciones y elecciones (el Congreso, un parlamento autonómico, una diputación, un cabildo, un consell, unas juntas generales o cualquier ayuntamiento) y compara votos y escaños. Puedes cruzar dimensiones distintas, la misma institución en dos elecciones o dos territorios entre sí.</p></div>
    <div class="sheet pad stack" style="gap:14px"><div class="cmp-sels" id="cmp-sels"></div>
      <div class="row" style="justify-content:space-between"><div class="row"><button class="btn ghost" type="button" id="cmp-add">+ Añadir otra</button></div>
      <div class="row"><span class="small muted">Agrupar por</span><div class="seg" role="radiogroup" aria-label="Agrupar por" id="cmp-modo"><button type="button" role="radio" data-m="fam">Familia política</button><button type="button" role="radio" data-m="cand">Candidatura</button></div>
      <button class="btn" type="button" id="cmp-xlsx"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 12v2.5h12V12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>Descargar Excel</button></div></div></div>
    <div id="cmp-out" class="stack" style="gap:0"></div>`;
  const $sels = app.querySelector('#cmp-sels'), $out = app.querySelector('#cmp-out');
  let datos = [], gen = 0;
  async function drawSel(i){
    const s = st.sels[i];
    const o = await cmpOpciones(s.t, s.id);
    if (!s.id && o.terr.length) s.id = o.terr[0][0];
    if (s.t === 'mun' && !o.terr.some(t => t[0] === s.id) && o.terr.length) s.id = o.terr[0][0];
    if (s.t !== 'mun' && o.terr.length && !o.terr.some(t => t[0] === s.id)) s.id = o.terr[0][0];
    let el = o.elecciones;
    if (s.t === 'mun' || s.t === 'auto' || TIPOS[s.t]){ const o2 = await cmpOpciones(s.t, s.id); el = o2.elecciones; }
    if (!el.some(e => e[0] === s.y)){ const same = el.find(e => String(e[0]).slice(0, 4) === String(s.y).slice(0, 4)); s.y = (same || el[0] || [''])[0]; }
    const box = document.createElement('div'); box.className = 'cmp-sel'; box.dataset.i = i;
    const opt = (list, v) => list.map(([k, n]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(n)}</option>`).join('');
    box.innerHTML = `<span class="cmp-letter" aria-hidden="true">${CMP_LETRAS[i]}</span>
      <select class="select" data-f="t" aria-label="Institución ${CMP_LETRAS[i]}">${opt(CMP_TIPOS, s.t)}</select>
      ${s.t === 'mun' ? `<select class="select" data-f="mprov" aria-label="Provincia ${CMP_LETRAS[i]}">${opt(o.provincias, s.id.slice(0, 2))}</select>` : ''}
      ${o.terr.length ? `<select class="select" data-f="id" aria-label="Territorio ${CMP_LETRAS[i]}">${opt(o.terr, s.id)}</select>` : ''}
      <select class="select" data-f="y" aria-label="Elección ${CMP_LETRAS[i]}">${opt(el, s.y)}</select>
      ${st.sels.length > 2 ? `<button class="btn ghost cmp-x" type="button" data-f="x" aria-label="Quitar ${CMP_LETRAS[i]}">Quitar</button>` : ''}`;
    return box;
  }
  async function drawSels(){
    const boxes = [];
    for (let i = 0; i < st.sels.length; i++) boxes.push(await drawSel(i));
    $sels.replaceChildren(...boxes);
    app.querySelector('#cmp-add').hidden = st.sels.length >= 4;
  }
  $sels.addEventListener('change', async ev => {
    const f = ev.target.dataset.f; const box = ev.target.closest('.cmp-sel'); if (!f || !box) return;
    const s = st.sels[+box.dataset.i];
    if (f === 't'){ s.t = ev.target.value; s.id = s.t === 'mun' ? '15078' : ''; }
    if (f === 'mprov'){ const M = await load('municipios.json'); const first = M.municipios.filter(r => r[2] === ev.target.value).sort((a, b) => b[4] - a[4])[0]; s.id = first ? first[0] : ''; }
    if (f === 'id') s.id = ev.target.value;
    if (f === 'y') s.y = ev.target.value;
    await drawSels(); await compute();
  });
  $sels.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-f="x"]'); if (!b) return;
    st.sels.splice(+b.closest('.cmp-sel').dataset.i, 1); await drawSels(); await compute();
  });
  app.querySelector('#cmp-add').addEventListener('click', async () => {
    if (st.sels.length >= 4) return;
    const last = st.sels[st.sels.length - 1]; st.sels.push({...last}); await drawSels(); await compute();
  });
  const $modo = app.querySelector('#cmp-modo');
  const syncModo = () => $modo.querySelectorAll('button').forEach(b => { b.setAttribute('aria-checked', b.dataset.m === st.modo); b.tabIndex = b.dataset.m === st.modo ? 0 : -1; });
  $modo.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; st.modo = b.dataset.m; syncModo(); render(); });
  syncModo();
  app.querySelector('#cmp-xlsx').addEventListener('click', ev => { const btn = ev.currentTarget; try { exportarComparacion(st, datos); } catch(e){ console.error(e); alertaExcel(btn); setTimeout(() => { btn.innerHTML = btn.dataset.html; delete btn.dataset.err; }, 3500); } });
  app.querySelector('#cmp-xlsx').dataset.html = app.querySelector('#cmp-xlsx').innerHTML;
  function syncHash(){
    const p = new URLSearchParams(); p.set('s', st.sels.map(cmpSpec).join('|')); if (st.modo !== 'fam') p.set('m', st.modo); if (st.met) p.set('v', st.met);
    const q = '?' + p.toString().replace(/%3A/g, ':').replace(/%7C/g, '|');
    history.replaceState(null, '', '/comparar/' + q); lastHash = 'comparar' + q;
  }
  async function compute(){
    const my = ++gen;
    $out.innerHTML = '<p class="loading">Cargando…</p>';
    const d = await Promise.all(st.sels.map(s => cmpDatos(s).catch(() => null)));
    if (my !== gen) return;
    datos = d; render();
  }
  function render(){
    syncHash();
    const ok = datos.map(Boolean);
    const allV = datos.every(d => d && d.rows.some(r => r[4]));
    const met = st.met || (allV ? 'votos' : 'escp');
    const G = cmpAgrupar(datos, st.modo);
    const L = i => `<span class="cmp-letter sm" aria-hidden="true">${CMP_LETRAS[i]}</span>`;
    const head = datos.map((d, i) => `<th class="n" colspan="3">${L(i)} ${d ? esc(d.lugar) : 'Sin datos'}<br><span class="cmp-sub">${d ? esc(d.eleccion) : ''}</span></th>`).join('');
    const nDif = datos.length - 1;
    const pp = x => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const cuerpo = G.keys.map(c => {
      const celdas = datos.map((d, i) => {
        const v = G.vals[i].get(c.k), t = G.tot[i];
        if (!d) return '<td class="n">—</td><td class="n">—</td><td class="n">—</td>';
        return `<td class="n">${v && v.tieneV ? fmt(v.votos) : '—'}</td><td class="n">${v && v.tieneV && t.validos ? fmtPct(100 * v.votos / t.validos) : '—'}</td><td class="n"><b>${v ? v.esc : 0}</b> <span class="muted small">${fmtPct(100 * (v ? v.esc : 0) / t.total)}</span></td>`;
      }).join('');
      const difs = datos.slice(1).map((d, j) => {
        const i = j + 1; if (!d || !datos[0]) return '<td class="n">—</td>';
        const m = met === 'esc' ? 'escp' : met;
        if (m === 'votos' && !(G.tot[0].hayV && G.tot[i].hayV)) return '<td class="n">—</td>';
        return `<td class="n">${pp(G.share(c.k, i, m) - G.share(c.k, 0, m))}</td>`;
      }).join('');
      return `<tr><td><span class="sw" style="background:${c.color}"></span><b>${esc(c.label)}</b>${c.largo && norm(c.largo) !== norm(c.label) ? ` <span class="muted small nm">${esc(c.largo)}</span>` : ''}</td>${celdas}${difs}</tr>`;
    }).join('');
    const totales = datos.map((d, i) => { const t = G.tot[i]; if (!d) return '<td></td><td></td><td></td>'; const sv = [...G.vals[i].values()].reduce((a, v) => a + v.votos, 0); return `<td class="n"><b>${t.hayV ? fmt(sv) : '—'}</b></td><td class="n"></td><td class="n"><b>${d.total}</b></td>`; }).join('');
    // gráfico de barras agrupadas
    const metLabel = {votos: '% de votos válidos', escp: '% de escaños', esc: 'Escaños'}[met];
    const max = Math.max(1e-9, ...G.keys.flatMap(c => datos.map((_, i) => G.share(c.k, i, met))));
    const opac = [1, .62, .38, .2];
    const chartKeys = G.keys.filter(c => datos.some((_, i) => G.share(c.k, i, met) > 0)).slice(0, 16);
    const chart = chartKeys.map(c => `<div class="cmp-row"><span class="cmp-lab" title="${esc(c.largo)}"><i style="background:${c.color}"></i>${esc(c.label)}</span><div class="cmp-bars">${datos.map((d, i) => {
        const v = G.share(c.k, i, met); const txt = !d ? '—' : met === 'esc' ? fmt(v) : fmtPct(100 * v);
        return `<div class="cmp-bar"><span class="cmp-l">${CMP_LETRAS[i]}</span><span class="cmp-track"><i style="width:${(100 * v / max).toFixed(2)}%;background:${c.color};opacity:${opac[i]}"></i></span><b>${txt}</b></div>`;
      }).join('')}</div></div>`).join('');
    // datos generales
    const filaG = (k, f) => `<tr><th scope="row">${k}</th>${datos.map(d => `<td class="n">${d ? f(d) : '—'}</td>`).join('')}</tr>`;
    const ganador = d => { const w = d.rows.slice().sort((a, b) => b[5] - a[5] || (b[4] || 0) - (a[4] || 0))[0]; return w ? `${esc(niceSig(w[0]))} (${w[5]})` : '—'; };
    const rcv = (d, k) => d.rc && d.rc[k] !== null && d.rc[k] !== undefined ? fmt(d.rc[k]) : '—';
    const generales = `<div class="tablewrap"><table class="data cmp-gen"><thead><tr><th><span class="vh">Dato</span></th>${datos.map((d, i) => `<th class="n">${L(i)} ${d ? esc(d.lugar) : ''}</th>`).join('')}</tr></thead><tbody>
      ${filaG('Institución', d => esc(d.titulo))}${filaG('Elección', d => esc(d.eleccion))}${filaG('Escaños', d => fmt(d.total))}${filaG('Mayoría absoluta', d => d.conMayoria ? fmt(Math.floor(d.total / 2) + 1) : '—')}
      ${filaG('Más escaños', ganador)}${filaG('Censo', d => rcv(d, 'censo'))}${filaG('Votantes', d => rcv(d, 'votantes'))}${filaG('Participación', d => d.rc && d.rc.censo && d.rc.votantes !== null ? fmtPct(100 * d.rc.votantes / d.rc.censo) : '—')}
      ${filaG('Votos válidos', d => rcv(d, 'validos'))}${filaG('En blanco', d => rcv(d, 'blancos'))}${filaG('Nulos', d => rcv(d, 'nulos'))}${filaG('Fuente', d => d.fuente === 'compilada' ? 'Recopilado' : 'Dato oficial')}
      ${filaG('<span class="vh">Enlace</span>', d => `<a href="${d.href}">Abrir en el pactómetro →</a>`)}</tbody></table></div>`;
    const notas = datos.map((d, i) => d && d.nota ? `<li>${CMP_LETRAS[i]}: ${esc(d.nota)}</li>` : '').join('') + (datos.some(d => d && !d.rows.some(r => r[4])) ? '<li>En las elecciones sin votos en los datos solo se comparan escaños.</li>' : '') + (st.modo === 'fam' ? '<li>Las familias agrupan a cada partido con sus federaciones, coaliciones y nombres anteriores (PSOE con PSdeG, PSC…; PP con AP…) para poder comparar instituciones distintas. Cambia a «Candidatura» para ver las siglas exactas.</li>' : '');
    $out.innerHTML = `
      <div class="section"><div class="section-head"><h2>${metLabel}</h2></div>
        <div class="row cmp-met"><div class="seg" role="radiogroup" aria-label="Métrica del gráfico">${[['votos', '% votos'], ['escp', '% escaños'], ['esc', 'Escaños']].map(([k, n]) => `<button type="button" role="radio" data-met="${k}" aria-checked="${met === k}" tabindex="${met === k ? 0 : -1}" ${k === 'votos' && !datos.some(d => d && d.rows.some(r => r[4])) ? 'disabled' : ''}>${n}</button>`).join('')}</div>
        <div class="legend-row">${datos.map((d, i) => `<span><span class="cmp-letter sm">${CMP_LETRAS[i]}</span>${d ? esc(d.lugar + ' · ' + d.eleccion) : 'Sin datos'}</span>`).join('')}</div></div>
        <div class="cmp-chart">${chart || '<p class="muted">No hay datos para comparar.</p>'}</div></div>
      <div class="section"><div class="section-head"><h2>Votos y escaños ${st.modo === 'fam' ? 'por familia política' : 'por candidatura'}</h2><p>${nDif ? `Las últimas columnas son la diferencia con ${CMP_LETRAS[0]} en puntos de ${met === 'votos' ? 'porcentaje de voto' : 'porcentaje de escaños'}.` : ''}</p></div>
        <div class="tablewrap"><table class="data cmp-tab"><thead><tr><th rowspan="2">${st.modo === 'fam' ? 'Familia política' : 'Candidatura'}</th>${head}${datos.slice(1).map((_, j) => `<th class="n" rowspan="2">${CMP_LETRAS[j + 1]} − ${CMP_LETRAS[0]}<br><span class="cmp-sub">puntos</span></th>`).join('')}</tr>
          <tr>${datos.map(() => '<th class="n">Votos</th><th class="n">%</th><th class="n">Escaños</th>').join('')}</tr></thead>
          <tbody>${cuerpo}<tr class="tot"><td><b>Total</b></td>${totales}${datos.slice(1).map(() => '<td></td>').join('')}</tr></tbody></table></div></div>
      <div class="section"><div class="section-head"><h2>Datos generales</h2></div>${generales}
        ${notas ? `<ul class="small muted cmp-notas">${notas}</ul>` : ''}</div>`;
    $out.querySelector('.cmp-met .seg').addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; const foco = b === document.activeElement; st.met = b.dataset.met; render(); if (foco){ const nb = $out.querySelector(`.cmp-met [data-met="${st.met}"]`); if (nb) nb.focus(); } });
  }
  await drawSels(); await compute();
}
function exportarComparacion(st, datos){
  const G = cmpAgrupar(datos, st.modo);
  const desc = (d, i) => d ? `${CMP_LETRAS[i]}: ${d.titulo} · ${d.eleccion}` : `${CMP_LETRAS[i]}: sin datos`;
  const h = [[{v: 'pactómetro.es · Comparativa', s: 't'}], [{v: st.modo === 'fam' ? 'Agrupado por familia política' : 'Agrupado por candidatura', s: 'note'}], []];
  datos.forEach((d, i) => h.push([{v: desc(d, i), s: 'b'}]));
  h.push([]);
  const cab = [st.modo === 'fam' ? 'Familia política' : 'Candidatura'];
  datos.forEach((_, i) => cab.push(`${CMP_LETRAS[i]} · Votos`, `${CMP_LETRAS[i]} · % votos válidos`, `${CMP_LETRAS[i]} · Escaños`, `${CMP_LETRAS[i]} · % escaños`));
  datos.slice(1).forEach((_, j) => cab.push(`${CMP_LETRAS[j + 1]} − ${CMP_LETRAS[0]} · % votos (puntos)`, `${CMP_LETRAS[j + 1]} − ${CMP_LETRAS[0]} · % escaños (puntos)`));
  const r0 = h.length;
  h.push(cab.map(v => ({v, s: 'h'})));
  for (const c of G.keys){
    const f = [c.label + (c.largo && norm(c.largo) !== norm(c.label) ? ' · ' + c.largo : '')];
    datos.forEach((d, i) => { const v = G.vals[i].get(c.k), t = G.tot[i]; if (!d){ f.push(null, null, null, null); return; }
      f.push(v && v.tieneV ? v.votos : null, {v: v && v.tieneV && t.validos ? v.votos / t.validos : null, s: 'pct'}, v ? v.esc : 0, {v: (v ? v.esc : 0) / t.total, s: 'pct'}); });
    datos.slice(1).forEach((d, j) => { const i = j + 1; const ok = d && datos[0];
      f.push({v: ok && G.tot[0].hayV && G.tot[i].hayV ? +(100 * (G.share(c.k, i, 'votos') - G.share(c.k, 0, 'votos'))).toFixed(2) : null, s: 'pp'}, {v: ok ? +(100 * (G.share(c.k, i, 'escp') - G.share(c.k, 0, 'escp'))).toFixed(2) : null, s: 'pp'}); });
    h.push(f);
  }
  const fin = h.length - 1;
  const tf = [{v: 'Total', s: 'b'}]; datos.forEach((d, i) => { if (!d){ tf.push(null, null, null, null); return; } const sv = [...G.vals[i].values()].reduce((a, v) => a + v.votos, 0); tf.push({v: G.tot[i].hayV ? sv : null, s: 'intb'}, null, {v: d.total, s: 'intb'}, null); });
  h.push(tf);
  h.push(...pieExcel('Ministerio del Interior, Congreso de los Diputados y fuentes recopiladas indicadas en pactómetro.es/#fuentes'));
  const hojas = [{name: 'Comparativa', rows: h, cols: [40].concat(datos.flatMap(() => [13, 12, 10, 11]), datos.slice(1).flatMap(() => [16, 16])), freeze: r0 + 1, filter: XLSX.rango(r0, cab.length, fin)}];
  // datos generales
  const g = [[{v: 'Datos generales', s: 't'}], [], ['', ...datos.map((d, i) => CMP_LETRAS[i])].map(v => ({v, s: 'h'}))];
  const fila = (k, f) => g.push([{v: k, s: 'b'}, ...datos.map(d => d ? f(d) : null)]);
  fila('Institución', d => d.titulo); fila('Territorio', d => d.lugar); fila('Elección', d => d.eleccion); fila('Fecha', d => d.fecha ? fechaCorta(d.fecha) : '');
  fila('Escaños', d => d.total); fila('Mayoría absoluta', d => d.conMayoria ? Math.floor(d.total / 2) + 1 : null);
  fila('Censo', d => d.rc ? d.rc.censo : null); fila('Votantes', d => d.rc ? d.rc.votantes : null);
  fila('Participación', d => ({v: d.rc && d.rc.censo && d.rc.votantes !== null ? d.rc.votantes / d.rc.censo : null, s: 'pct'}));
  fila('Votos válidos', d => d.rc ? d.rc.validos : null); fila('Votos a candidaturas', d => d.rc ? d.rc.cand : null); fila('En blanco', d => d.rc ? d.rc.blancos : null); fila('Nulos', d => d.rc ? d.rc.nulos : null);
  fila('Fuente', d => fuenteTexto(d.fuente)); fila('Enlace', d => location.origin + location.pathname + d.href);
  hojas.push({name: 'Datos generales', rows: g, cols: [22, ...datos.map(() => 40)]});
  // una hoja por selección
  datos.forEach((d, i) => {
    if (!d) return;
    const hh = [[{v: `${CMP_LETRAS[i]} · ${d.titulo}`, s: 't'}], [{v: d.eleccion, s: 'sub'}], [], ['Escaños', d.total]];
    if (d.conMayoria) hh.push(['Mayoría absoluta', Math.floor(d.total / 2) + 1]);
    hh.push([]); const rec = bloqueRecuentoExcel(d.rc); if (rec.length) hh.push(...rec, []);
    const r1 = hh.length; const tabla = tablaResultadosExcel(d.rows, d.rc, d.total); hh.push(...tabla);
    if (d.nota) hh.push([], [{v: d.nota, s: 'note'}]);
    hojas.push({name: `${CMP_LETRAS[i]} · ${d.lugar} ${d.fecha ? d.fecha.slice(0, 4) : d.eleccion.replace(/\D+/g, '')}`, rows: hh, cols: [30, 46, 34, 14, 15, 10, 11], filter: XLSX.rango(r1, 7, r1 + tabla.length - 2)});
  });
  XLSX.descargar(hojas, 'pactometro-comparativa-' + datos.map(d => d ? archivoSlug(d.lugar + '-' + (d.fecha ? d.fecha.slice(0, 4) : d.eleccion.replace(/\D+/g, ''))) : 'x').join('-vs-').slice(0, 120));
}

/* ================================================================ línea temporal (quién ganó) */
function timeline(series, start){
  const t0 = new Date(start).getTime(), t1 = new Date('2027-06-30').getTime();
  const W = 1000, labelW = 150, rowH = 26, gap = 6, top = 22, H = top + series.length * (rowH + gap) + 4;
  const X = d => labelW + (new Date(d).getTime() - t0) / (t1 - t0) * (W - labelW - 6);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Línea temporal: candidatura con más escaños en cada elección">`;
  for (let y = 1980; y <= 2026; y += 2){
    if (new Date(y + '-01-01').getTime() < t0) continue;
    const x = X(y + '-01-01');
    svg += `<line x1="${x}" x2="${x}" y1="${top - 4}" y2="${H}" stroke="var(--rule)" stroke-width="1"/>`;
    if (y % 6 === 0 || y === 2026) svg += `<text x="${x}" y="12" font-size="11" text-anchor="middle">${y}</text>`;
  }
  const wrap = document.createElement('div'); wrap.className = 'stack';
  const famSeen = new Map();
  series.forEach((s, i) => {
    const y = top + i * (rowH + gap);
    svg += `<text x="0" y="${y + rowH / 2 + 4}" font-size="12.5" font-weight="600" style="fill:var(--ink)">${esc(s.label)}</text>`;
    s.items.forEach((it, j) => {
      const next = s.items[j + 1];
      const x0 = X(it.fecha), x1 = next ? X(next.fecha) : X('2027-05-31');
      const w = it.r.filter(r => r[5] > 0).sort((a, b) => b[5] - a[5])[0]; if (!w) return;
      const absm = w[5] >= Math.floor(it.total / 2) + 1;
      famSeen.set(w[3] + '|' + w[2], [w[0], w[2], w[3]]);
      const tipTxt = `${s.label} · ${fecha(it.fecha)}|${niceSig(w[0])} ${w[5]} de ${it.total}|${absm ? 'mayoría absoluta' : 'sin mayoría absoluta'}`;
      svg += `<a href="${s.href(it)}" aria-label="${esc(`${s.label}, ${fecha(it.fecha)}: ${niceSig(w[0])}, ${w[5]} de ${it.total} escaños, ${absm ? 'mayoría absoluta' : 'sin mayoría absoluta'}`)}"><rect class="cell" x="${(x0 + 1).toFixed(1)}" y="${y}" width="${Math.max(2, x1 - x0 - 2).toFixed(1)}" height="${rowH}" rx="3" fill="${w[2]}" fill-opacity="${absm ? 1 : .42}" data-t="${esc(tipTxt)}"></rect>`;
      if (x1 - x0 > 30) svg += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${y + rowH / 2 + 4}" font-size="11" font-weight="700" text-anchor="middle" style="fill:${absm ? ink(w[2]) : 'var(--ink)'};pointer-events:none">${w[5]}</text>`;
      svg += `</a>`;
    });
  });
  svg += '</svg>';
  const box = document.createElement('div'); box.className = 'tl-wrap'; box.innerHTML = svg;
  box.addEventListener('pointerover', ev => { const t = ev.target.getAttribute && ev.target.getAttribute('data-t'); if (!t) return; const [a, b, c] = t.split('|'); showTip(ev, `<strong>${esc(b)}</strong>${esc(a)}<br>${esc(c)}`); });
  box.addEventListener('pointermove', ev => { if (!tip.hidden) moveTip(ev); });
  box.addEventListener('pointerout', ev => { if (ev.target.getAttribute && ev.target.getAttribute('data-t')) hideTip(); });
  const leg = document.createElement('div'); leg.className = 'legend-row';
  const fams = {}; famSeen.forEach(v => { fams[v[2]] = fams[v[2]] || v; });
  leg.innerHTML = Object.values(fams).map(([sig, col, fam]) => `<span><i style="background:${col}"></i>${esc(fam !== 'local' && FAM[fam] ? FAM[fam].corto : sig)}</span>`).join('') +
    '<span style="margin-left:auto"><i style="background:var(--ink)"></i>mayoría absoluta</span><span><i class="plural" style="background:var(--ink)"></i>sin mayoría absoluta</span><span class="muted">El número es el de escaños del ganador.</span>';
  wrap.appendChild(leg); wrap.appendChild(box);
  return wrap;
}

/* ================================================================ vista: histórico */
async function viewHistorico(){
  const [G, A, L, R] = await Promise.all([load('generales.json'), load('autonomicas.json'), load('locales.json'), load('resumen.json')]);
  const keys = Object.keys(G.congreso).sort().reverse();
  const famBar = (fams, total, top = 9) => {
    const ent = Object.entries(fams).filter(([f]) => f !== 'local').sort((a, b) => b[1][0] - a[1][0]);
    const rows = ent.slice(0, top).map(([f, v]) => [FAM[f].corto, FAM[f].largo, FAM[f].color, f, v[1], v[0]]);
    const rest = total - rows.reduce((a, r) => a + r[5], 0);
    if (rest > 0) rows.push(['Locales y otros', 'Candidaturas locales, independientes y otras', '#8a8f98', 'local', null, rest]);
    return rows;
  };
  const munYears = Object.keys(R.municipales).sort().reverse();
  app.innerHTML = `<div class="page-head"><span class="eyebrow">De 1977 a 2026</span><h1>Histórico electoral</h1>
    <p class="lede">Todas las elecciones generales, las investiduras y mociones de censura, el Senado, los parlamentos autonómicos, las diputaciones y el voto municipal, con los datos oficiales disponibles. Pulsa cualquier barra para abrirla en el pactómetro.</p></div>
    <div class="tabs"><a class="tab" href="#h-congreso">Congreso</a><a class="tab" href="#h-inv">Investiduras</a><a class="tab" href="#h-senado">Senado</a><a class="tab" href="#h-auto">Autonomías</a><a class="tab" href="#h-dip">Diputaciones</a><a class="tab" href="#h-mun">Municipales</a></div>
    <div class="section" id="h-congreso"><div class="section-head"><h2>Congreso de los Diputados, 1977-2023</h2><p>Escaños por candidatura en las 16 elecciones generales. La marca vertical señala la mayoría absoluta (176).</p></div><div class="hbars" id="hb-congreso"></div></div>
    <div class="section" id="h-inv"><div class="section-head"><h2>Investiduras</h2><p>Votaciones de investidura del presidente del Gobierno según el archivo oficial del Congreso. En las votaciones fallidas de 2016 y 2019 se recoge la votación final de cada debate.</p></div>
      <div class="tablewrap"><table class="data"><thead><tr><th>Leg.</th><th>Fecha</th><th>Candidato</th><th>Votación</th><th class="n">Sí</th><th class="n">No</th><th class="n">Abst.</th><th>Resultado</th></tr></thead><tbody>
      ${G.investiduras.slice().reverse().map(r => `<tr><td>${r[0]}</td><td class="num">${fechaCorta(r[3])}</td><td><b>${esc(r[1])}</b> <span class="muted small">${esc(r[2])}</span></td><td>${r[4] === 'final' ? 'única/final' : r[4]}</td><td class="n">${r[5]}</td><td class="n">${r[6]}</td><td class="n">${r[7] ?? '—'}</td><td>${r[8] ? '<span class="pill on">Investido</span>' : '<span class="pill off">Rechazada</span>'}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="section-head" style="margin-top:12px"><h3>Mociones de censura</h3></div>
      <div class="tablewrap"><table class="data"><thead><tr><th>Fecha</th><th>Candidato</th><th>Contra</th><th class="n">Sí</th><th class="n">No</th><th class="n">Abst.</th><th>Resultado</th></tr></thead><tbody>
      ${G.mociones.slice().reverse().map(r => `<tr><td class="num">${fechaCorta(r[0])}</td><td><b>${esc(r[1])}</b> <span class="muted small">${esc(r[2])}</span></td><td>${esc(r[3])}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td class="n">${r[6]}</td><td>${r[7] ? '<span class="pill on">Aprobada</span>' : '<span class="pill off">Rechazada</span>'}</td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="section" id="h-senado"><div class="section-head"><h2>Senado: senadores electos</h2><p>Senadores elegidos en las urnas en cada elección general (208; 207 en 1977), agrupados por partido. No incluye los designados por los parlamentos autonómicos.</p></div><div class="hbars" id="hb-senado"></div></div>
    <div class="section" id="h-auto"><div class="section-head"><h2>Parlamentos autonómicos, 1980-2026</h2><p>Partido con más escaños en cada elección autonómica. Opaco: mayoría absoluta; translúcido: sin ella.</p></div><div id="tl-auto"></div></div>
    <div class="section" id="h-dip"><div class="section-head"><h2>Diputaciones provinciales, 1987-2023</h2><p>Partido con más diputados provinciales tras cada elección municipal (datos oficiales disponibles desde 1987).</p></div><div id="tl-dip"></div></div>
    <div class="section" id="h-mun"><div class="section-head"><h2>Concejales en toda España, 1979-2023</h2><p>Concejales obtenidos por cada familia política en las elecciones municipales, sumando todos los municipios. Las candidaturas locales e independientes se agrupan.</p></div><div class="hbars" id="hb-mun"></div>
      <details class="more"><summary>Tabla de concejales por familia política</summary><div>${munTable(R, munYears)}</div></details></div>`;
  app.querySelectorAll('.tabs a[href^="#h-"]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); app.querySelector(a.getAttribute('href')).scrollIntoView({behavior: 'smooth'}); }));
  const hc = app.querySelector('#hb-congreso');
  hc.innerHTML = keys.map(k => { const e = G.congreso[k]; return hbar(LEYENDA_ELECCION(k).replace(/^\w/, c => c.toUpperCase()), e.leg === 'Constituyente' ? 'Constituyentes' : e.leg + ' Leg.', e.r, 350, `#congreso-${k}`); }).join('');
  wireBarTips(hc);
  const hs = app.querySelector('#hb-senado');
  hs.innerHTML = Object.keys(G.senado).sort().reverse().map(k => { const e = G.senado[k]; return hbar(LEYENDA_ELECCION(k).replace(/^\w/, c => c.toUpperCase()), e.electos + ' electos', e.r, e.electos, '#h-senado', {noMark: true}); }).join('');
  wireBarTips(hs, 'senadores');
  hs.querySelectorAll('a').forEach(a => a.addEventListener('click', ev => ev.preventDefault()));
  const aIds = Object.keys(A).sort((a, b) => A[a].n.localeCompare(A[b].n, 'es'));
  app.querySelector('#tl-auto').appendChild(timeline(aIds.map(id => ({label: A[id].n, href: x => `#auto-${id}.${x.fecha}`, items: A[id].elecciones.map(e => ({fecha: e.fecha, r: e.r, total: e.escanos}))})), '1980-01-01'));
  const dIds = Object.keys(L.diputaciones).sort((a, b) => L.diputaciones[a].n.localeCompare(L.diputaciones[b].n, 'es'));
  app.querySelector('#tl-dip').appendChild(timeline(dIds.map(id => { const d = L.diputaciones[id]; return {label: d.n.split('/')[0], href: x => `#dip-${id}.${x.fecha.slice(0, 4)}`, items: Object.keys(d.e).sort().map(y => ({fecha: d.e[y].fecha, r: d.e[y].r, total: d.e[y].escanos}))}; }), '1986-01-01'));
  const hm = app.querySelector('#hb-mun');
  hm.innerHTML = munYears.map(y => { const e = R.municipales[y]; return hbar(y, fmt(e.concejales) + ' conc.', famBar(e.familias, e.concejales), e.concejales, '#h-mun', {noMark: true}); }).join('');
  wireBarTips(hm, 'concejales');
  hm.querySelectorAll('a').forEach(a => a.addEventListener('click', ev => ev.preventDefault()));
}
function munTable(R, years){
  const fams = new Set(); years.forEach(y => Object.keys(R.municipales[y].familias).forEach(f => fams.add(f)));
  const tot = f => years.reduce((a, y) => a + ((R.municipales[y].familias[f] || [0])[0]), 0);
  const list = [...fams].sort((a, b) => tot(b) - tot(a));
  return `<div class="tablewrap"><table class="data"><thead><tr><th>Familia</th>${years.map(y => `<th class="n">${y}</th>`).join('')}</tr></thead><tbody>
    ${list.map(f => `<tr><td><span class="sw" style="background:${FAM[f].color}"></span>${esc(FAM[f].largo)}</td>${years.map(y => `<td class="n">${fmt((R.municipales[y].familias[f] || [null])[0])}</td>`).join('')}</tr>`).join('')}
    <tr><td><b>Total concejales</b></td>${years.map(y => `<td class="n"><b>${fmt(R.municipales[y].concejales)}</b></td>`).join('')}</tr>
  </tbody></table></div>`;
}

/* ================================================================ cuenta atrás 29-N */
// Colegios electorales: abren a las 9:00 y cierran a las 20:00 (hora peninsular; en Canarias, a la misma hora local).
const ELEC = {apertura: new Date('2026-11-29T08:00:00Z'), cierre: new Date('2026-11-29T19:00:00Z')};
let relojCuenta = null;
function pararCuenta(){ if (relojCuenta){ clearInterval(relojCuenta); relojCuenta = null; } }
function cuentaContenido(t){
  const pad = n => String(n).padStart(2, '0');
  const partes = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return {d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60}; };
  const seg = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nums = (p, conDias) => `<div class="cd-nums">${conDias ? `<span><b>${p.d}</b><i>${p.d === 1 ? 'día' : 'días'}</i></span>` : ''}<span><b>${pad(p.h)}</b><i>horas</i></span><span><b>${pad(p.m)}</b><i>min</i></span>${seg ? `<span><b>${pad(p.s)}</b><i>seg</i></span>` : ''}</div>`;
  const etiqueta = (p, que) => `Faltan ${p.d ? p.d + (p.d === 1 ? ' día, ' : ' días, ') : ''}${p.h} horas y ${p.m} minutos ${que}`;
  if (t < ELEC.apertura){
    const p = partes(ELEC.apertura - t);
    return {html: nums(p, true) + '<p class="cd-txt">para que abran los colegios electorales, a las 9:00 hora peninsular (en Canarias, una hora después).</p>', label: etiqueta(p, 'para que abran los colegios electorales.')};
  }
  if (t < ELEC.cierre){
    const p = partes(ELEC.cierre - t);
    return {html: '<p class="cd-hoy">Hoy se vota</p>' + nums(p, false) + '<p class="cd-txt">para que cierren los colegios electorales, a las 20:00 hora peninsular (en Canarias, una hora después).</p>', label: 'Hoy se vota. ' + etiqueta(p, 'para que cierren los colegios electorales.')};
  }
  return {html: '<p class="cd-hoy">Los colegios electorales han cerrado</p><p class="cd-txt">Empieza el escrutinio. <a href="/29n/resultados/">Sigue los resultados en directo y prueba los pactos</a>.</p>', label: 'Los colegios electorales han cerrado.', fin: true};
}
function iniciarCuenta(){
  pararCuenta();
  const el = document.getElementById('cuenta'); if (!el) return;
  let ultimaEtiqueta = '';
  const tick = () => {
    if (!el.isConnected){ pararCuenta(); return; }
    const c = cuentaContenido(ahoraReal());
    el.innerHTML = c.html;
    if (c.label !== ultimaEtiqueta){ el.setAttribute('aria-label', c.label); ultimaEtiqueta = c.label; }
    if (c.fin) pararCuenta();
  };
  tick();
  relojCuenta = setInterval(tick, 1000);
}

/* ================================================================ vista: encuesta 29-N */
/* En pactómetro.es la encuesta está abierta desde que se publica (config.js con la URL de la hoja) hasta el domingo 22 de noviembre a las 20:00
   (hora peninsular). Modos: «real» (config.js con la URL de la hoja de Google), «pendiente» (config.js sin URL)
   y «previa» (enlace de Claude: siempre visible para revisarla; no guarda nada). La dirección #encuesta-prueba
   deja al titular probar el envío cualquier día: esas respuestas van a la pestaña «Pruebas» y no cuentan. */
const CFG = window.PACTOMETRO_CONFIG || {};
let relojDesfase = 0;                                    // corrección con la hora del servidor de la web
const ahoraReal = () => new Date(Date.now() + relojDesfase);
const ENC = {
  apertura: new Date('2026-10-12T22:00:00Z'),          // 13-X: abierta desde que se publica (cuando config.js tiene la URL)
  cierre: new Date('2026-11-22T19:00:00Z'),            // domingo 22-N, 20:00 hora peninsular
  clave: 'pacto.encuesta29n.v1',
  partidos: [
    {k: 'pp', n: 'PP', f: 'pp'},
    {k: 'psoe', n: 'PSOE', f: 'psoe'},
    {k: 'vox', n: 'Vox', f: 'vox'},
    {k: 'fa', n: 'Frente Amplio', nota: 'Sumar, IU, Más Madrid y Comuns', f: 'sumar'},
    {k: 'd21', n: 'Democracia 21'},
    {k: 'podemos', n: 'Podemos', f: 'podemos'},
    {k: 'erc', n: 'ERC', nota: 'Cataluña', f: 'erc', p: ['08', '17', '25', '43']},
    {k: 'junts', n: 'Junts', nota: 'Cataluña', f: 'junts', p: ['08', '17', '25', '43']},
    {k: 'bildu', n: 'EH Bildu', nota: 'País Vasco y Navarra', f: 'bildu', p: ['01', '20', '48', '31']},
    {k: 'pnv', n: 'PNV', nota: 'País Vasco', f: 'pnv', p: ['01', '20', '48']},
    {k: 'bng', n: 'BNG', nota: 'Galicia', f: 'bng', p: ['15', '27', '32', '36']},
    {k: 'compromis', n: 'Compromís', nota: 'Comunitat Valenciana', f: 'compromis', p: ['03', '12', '46']},
    {k: 'cc', n: 'Coalición Canaria', nota: 'Canarias', f: 'cc', p: ['35', '38']},
    {k: 'upn', n: 'UPN', nota: 'Navarra', f: 'upn', p: ['31']},
  ],
  otras: [
    {k: 'otro', n: 'Otro partido', marca: true}, {k: 'blanco', n: 'En blanco'}, {k: 'nulo', n: 'Nulo'},
    {k: 'abst', n: 'No votaré'}, {k: 'nsnc', n: 'Aún no lo sé'},
  ],
  recuerdo: [['PP', 'PP'], ['PSOE', 'PSOE'], ['Vox', 'Vox'], ['Sumar', 'Sumar'], ['ERC', 'ERC'], ['Junts', 'Junts'],
    ['EH Bildu', 'EH Bildu'], ['PNV', 'PNV'], ['BNG', 'BNG'], ['Coalición Canaria', 'Coalición Canaria'], ['UPN', 'UPN'],
    ['Otro partido', 'Otro partido'], ['En blanco o nulo', 'En blanco o nulo'], ['No votó', 'No voté'],
    ['No tenía edad para votar', 'No tenía edad para votar']],
};
const ENC_ORDEN = (() => { const a = ENC.partidos.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
// config.js only exists on the self-hosted site: with it the poll is live (or pending until its URL is set); without it, preview.
const encModo = () => CFG.encuestaURL ? 'real' : ('encuestaURL' in CFG ? 'pendiente' : 'previa');
const encEstado = () => { const t = ahoraReal(); return t < ENC.apertura ? 'antes' : t < ENC.cierre ? 'abierta' : 'cerrada'; };
const encVisible = () => encModo() === 'previa' || (encModo() === 'real' && encEstado() !== 'antes');      // enlace del menú
const encVotable = () => encModo() === 'previa' || encEstado() === 'abierta';    // botones que invitan a votar
function actualizarNavEncuesta(){ const a = document.querySelector('.nav a[data-nav="encuesta"]'); if (a) a.hidden = !encVisible(); }
// Promoción de la encuesta: mientras se pueda responder y esta persona no haya respondido ya.
const encYaRespondida = () => encModo() === 'real' && !!store.get(ENC.clave);
const encPromo = () => encModo() !== 'pendiente' && encVotable() && !encYaRespondida();
const PROMO_KEY = 'pacto.promo.oculta';
function actualizarPromo(h){
  const el = document.getElementById('promo'); if (!el) return;
  const pag = (h || 'inicio').split(/[-.?]/)[0];
  el.hidden = !encPromo() || store.get(PROMO_KEY) === hoyISO() || pag === 'encuesta' || pag === '29n';
}
// Bloque destacado de la encuesta (página del 29-N)
function bloqueEncuesta(){
  if (encModo() === 'pendiente') return '';
  const estado = encModo() === 'previa' ? 'abierta' : encEstado();
  if (estado === 'cerrada') return '<section class="enc-promo" aria-label="Encuesta del 29-N"><p class="enc-promo-q">La encuesta del 29-N está cerrada</p><p>Se pudo responder hasta el domingo 22 de noviembre a las 20:00. Gracias a quienes participasteis.</p></section>';
  if (encYaRespondida()) return '<section class="enc-promo" aria-label="Encuesta del 29-N"><p class="enc-promo-q">Ya has respondido la encuesta del 29-N</p><p>Gracias por participar. Puedes compartirla para que responda más gente: está abierta hasta el domingo 22 de noviembre a las 20:00.</p></section>';
  return `<section class="enc-promo" aria-labelledby="t-enc"><div class="enc-promo-txt"><p class="enc-promo-k">Encuesta de pactómetro.es</p><h2 id="t-enc">¿A quién piensas votar el 29-N?</h2><p>Es anónima, se responde en un minuto y está abierta hasta el domingo 22 de noviembre a las 20:00. Te preguntamos tu provincia, tu intención de voto y, si quieres, lo que votaste el 23-J.</p></div><a class="btn lg btn-l" href="#encuesta">${encModo() === 'previa' ? 'Ver la encuesta' : 'Responder la encuesta'}</a></section>`;
}
function sincronizarReloj(){
  // Usa la hora del servidor (cabecera Date, más Age si viene de una caché) para no depender del reloj del visitante.
  if (!('encuestaURL' in CFG)) return Promise.resolve();
  return fetch(location.href.split('#')[0], {method: 'HEAD', cache: 'no-store'}).then(r => {
    const t = Date.parse(r.headers.get('Date') || '') + (parseInt(r.headers.get('Age') || '0', 10) || 0) * 1000;
    if (!isNaN(t) && Math.abs(t - Date.now()) > 60000) relojDesfase = t - Date.now();
  }).catch(() => {});
}
const hoyISO = () => { const d = ahoraReal(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

async function viewEncuesta(prueba){
  const M = await load('municipios.json');
  const modo = encModo(), estado = encEstado();
  const probando = prueba && modo === 'real';
  const ya = modo === 'real' && !probando ? store.get(ENC.clave) : null;
  const provs = Object.entries(M.provincias).sort((a, b) => a[1].localeCompare(b[1], 'es'));
  const color = f => (FAM[f] || {}).color || '#8a8f98';
  const opHTML = (o, party) => `<label class="enc-op" data-k="${o.k}"${o.p ? ` data-prov="${o.p.join(' ')}"` : ''}>
      <input type="radio" name="intencion" value="${o.k}" id="enc-${o.k}">
      <span class="sw${party || o.marca ? '' : ' none'}" style="${party ? `background:${color(o.f)}` : o.marca ? 'background:var(--seat-empty)' : ''}"></span>
      <span class="t"><b>${esc(o.n)}</b>${o.nota ? `<small>${esc(o.nota)}</small>` : ''}</span></label>`;
  const aviso = modo === 'previa'
    ? '<div class="notice prev"><span class="date">Vista previa</span><p>En pactómetro.es la encuesta se podrá responder hasta el domingo 22 de noviembre a las 20:00. Aquí puedes probarla, pero no se guarda nada.</p></div>'
    : probando ? '<div class="notice prev"><span class="date">Modo prueba</span><p>Esta respuesta se guarda en la pestaña «Pruebas» de la hoja de cálculo y no cuenta en la encuesta.</p></div>' : '';
  const cabecera = `<div class="page-head"><span class="eyebrow">Encuesta de pactómetro.es · abierta hasta el 22 de noviembre a las 20:00</span>
    <h1>¿A quién piensas votar el 29-N?</h1>
    <p class="lede">Es anónima: no te pedimos nombre, correo ni ningún dato que te identifique. Y el recuento es privado: los resultados no se publican en la web.</p></div>${aviso}`;
  const como = `<aside class="enc-how"><h2 class="h3">Cómo funciona</h2><dl>
      <div><dt>Hasta el domingo 22 de noviembre</dt><dd>Se puede responder hasta las 20:00 de ese día (hora peninsular). La lista de partidos se actualizará cuando se proclamen las candidaturas, a primeros de noviembre.</dd></div>
      <div><dt>Anónima</dt><dd>Solo se guardan tus respuestas, tu provincia y la fecha con la hora redondeada. Ni nombre, ni correo, ni dirección IP. Más en la <a href="#privacidad">política de privacidad</a>.</dd></div>
      <div><dt>Recuento oculto</dt><dd>Los resultados solo los ve el titular de pactómetro.es. La web no muestra cuántos votos lleva cada partido.</dd></div>
      <div><dt>Una respuesta por navegador</dt><dd>Tu navegador recuerda que ya has respondido, sin cookies y sin guardar tu respuesta (<a href="#cookies">política de cookies</a>).</dd></div>
      <div><dt>Abierta, no representativa</dt><dd>Responde quien quiere, así que no es una muestra representativa ni una estimación de voto.</dd></div>
    </dl></aside>`;
  const msg = (eyebrow, titulo, texto, boton = true) => `<div class="sheet pad enc-msg"><span class="eyebrow">${eyebrow}</span><h2>${titulo}</h2><p>${texto}</p>${boton ? '<a class="btn" href="#congreso-simulador">Mientras tanto, prueba el simulador del 29-N</a>' : ''}</div>`;
  let cuerpo = null;
  if (prueba && modo === 'pendiente'){
    cuerpo = msg('Modo prueba', 'Falta conectar la hoja de cálculo', 'Pega la URL de tu aplicación web de Google en config.js y vuelve a publicar la web; después podrás probar aquí el envío.', false);
  } else if (!probando && modo !== 'previa'){
    if (estado === 'antes') cuerpo = msg('Próximamente', 'La encuesta abrirá muy pronto', 'Se podrá responder hasta el domingo 22 de noviembre a las 20:00 (hora peninsular).');
    else if (estado === 'cerrada') cuerpo = msg('Encuesta cerrada', 'Gracias a quienes participasteis', 'Se podía responder hasta el domingo 22 de noviembre a las 20:00 (hora peninsular).', false);
    else if (modo === 'pendiente') cuerpo = msg('En un momento', 'La encuesta todavía no está disponible', 'Estamos terminando de preparar la recogida de respuestas. Vuelve a entrar en unos minutos.');
    else if (ya && ya.dia) cuerpo = `<div class="sheet pad enc-msg"><span class="eyebrow">Ya has respondido</span><h2>Gracias por participar</h2><p>Solo se admite una respuesta por navegador. Se puede responder hasta las 20:00.</p><div class="row"><a class="btn" href="#congreso-simulador">Probar pactos en el simulador</a><a class="btn ghost" href="#congreso">Ver el Congreso</a></div></div>`;
  }
  if (!cuerpo){
    cuerpo = `<form class="sheet pad enc" id="enc-form" novalidate autocomplete="off">
      <fieldset class="enc-q"><legend><span class="enc-n">1</span><span>¿En qué provincia votas?</span></legend>
        <select class="select" id="enc-prov" aria-label="¿En qué provincia votas? (obligatoria)" aria-describedby="enc-prov-h" required aria-required="true"><option value="" disabled selected>Elige tu provincia</option>${provs.map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
        <p class="hint" id="enc-prov-h">Obligatoria. Así verás solo los partidos que se presentan allí. Si votas desde el extranjero, elige la provincia en la que estás inscrito.</p></fieldset>
      <fieldset class="enc-q"><legend><span class="enc-n">2</span><span>¿A quién piensas votar el 29 de noviembre?</span></legend>
        <div class="enc-ops">${ENC_ORDEN.map(o => opHTML(o, true)).join('')}</div>
        <span class="enc-sub">Otras respuestas</span>
        <div class="enc-ops">${ENC.otras.map(o => opHTML(o, false)).join('')}</div>
        <p class="hint">Los partidos aparecen en orden aleatorio para no favorecer a ninguno.</p></fieldset>
      <fieldset class="enc-q"><legend><span class="enc-n">3</span><span>¿A quién votaste en las generales del 23 de julio de 2023?<span class="opt">Opcional</span></span></legend>
        <select class="select" id="enc-rec" aria-label="¿A quién votaste en las generales del 23 de julio de 2023? (opcional)"><option value="">Prefiero no decirlo</option>${ENC.recuerdo.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></fieldset>
      <div class="hp" aria-hidden="true"><label for="enc-web">No rellenes este campo</label><input type="text" id="enc-web" name="web" tabindex="-1" autocomplete="off"></div>
      <section class="enc-rgpd" aria-labelledby="enc-rgpd-t">
        <h2 class="enc-rgpd-t" id="enc-rgpd-t">Antes de enviar: protección de datos</h2>
        <dl>
          <div><dt>Responsable</dt><dd>Javier Pereiro Pérez, titular de pactómetro.es (pactometroes@gmail.com).</dd></div>
          <div><dt>Qué se guarda</dt><dd>Tus respuestas, tu provincia y la hora redondeada. Sin nombre, correo, dirección IP ni cookies: no se puede saber qué respuesta es la tuya.</dd></div>
          <div><dt>Para qué</dt><dd>Recuentos estadísticos de uso interno. Las respuestas individuales no se publican.</dd></div>
          <div><dt>Base jurídica</dt><dd>Tu consentimiento explícito, porque la intención de voto es una opinión política (art. 9 del RGPD).</dd></div>
          <div><dt>Dónde</dt><dd>En una hoja de cálculo privada de Google, hasta el 31 de mayo de 2027 como máximo.</dd></div>
        </dl>
        <p>Más detalles y tus derechos en la <a href="#privacidad">política de privacidad</a>.</p>
        <label class="enc-ok"><input type="checkbox" id="enc-acepto" required aria-required="true"><span>Tengo 18 años o más y acepto enviar mi respuesta anónima, que incluye mi opinión política, para la encuesta de pactómetro.es.</span></label>
      </section>
      <div class="enc-foot"><button class="btn solid" type="submit" id="enc-enviar" disabled>${probando ? 'Enviar respuesta de prueba' : 'Enviar mi respuesta'}</button>
        <p class="small muted" id="enc-estado">Elige una respuesta en la pregunta 2 para poder enviar.</p></div>
    </form>`;
  }
  app.innerHTML = `${cabecera}<div class="enc-layout"><div id="enc-main">${cuerpo}</div>${como}</div>`;
  const form = app.querySelector('#enc-form');
  if (!form) return;
  const $prov = form.querySelector('#enc-prov'), $rec = form.querySelector('#enc-rec'), $btn = form.querySelector('#enc-enviar'), $est = form.querySelector('#enc-estado'), $ok = form.querySelector('#enc-acepto');
  const etiquetaBoton = $btn.textContent;
  const marcar = () => {
    form.querySelectorAll('.enc-op').forEach(l => l.classList.toggle('sel', l.querySelector('input').checked));
    const conVoto = !!form.querySelector('input[name="intencion"]:checked'), conProv = !!$prov.value, conOk = $ok.checked, ok = conVoto && conProv && conOk;
    $btn.disabled = !ok;
    const falta = [!conProv && 'elige tu provincia (pregunta 1)', !conVoto && 'elige una respuesta en la pregunta 2', !conOk && 'marca la casilla de protección de datos'].filter(Boolean);
    $est.textContent = ok ? 'Respuesta anónima. Puedes cambiarla antes de enviar.'
      : 'Para poder enviar, ' + (falta.length === 1 ? falta[0] : falta.slice(0, -1).join(', ') + ' y ' + falta[falta.length - 1]) + '.';
  };
  form.addEventListener('change', ev => {
    if (ev.target === $prov){
      const pv = $prov.value;
      form.querySelectorAll('.enc-op[data-prov]').forEach(l => {
        const visible = !pv || l.dataset.prov.split(' ').includes(pv);
        l.hidden = !visible;
        if (!visible) l.querySelector('input').checked = false;
      });
    }
    marcar();
  });
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    const sel = form.querySelector('input[name="intencion"]:checked');
    if (!sel || !$prov.value || !$ok.checked){ marcar(); (!$prov.value ? $prov : !sel ? form.querySelector('input[name="intencion"]') : $ok).focus(); return; }
    const main = app.querySelector('#enc-main');
    if (modo === 'real' && !probando && encEstado() !== 'abierta'){ viewEncuesta(false); return; }   // cerró mientras rellenaba
    const op = ENC.partidos.concat(ENC.otras).find(o => o.k === sel.value);
    const datos = {intencion: op.n, recuerdo: $rec.value, provincia: $prov.value ? M.provincias[$prov.value] : '', consentimiento: '1', web: form.querySelector('#enc-web').value, v: '2'};
    if (probando) datos.prueba = '1';
    if (modo === 'previa'){
      main.innerHTML = `<div class="sheet pad enc-msg" role="status"><span class="eyebrow">Vista previa · no se ha guardado</span><h2>Así verá la confirmación quien responda</h2>
        <p>Has elegido <b>${esc(op.n)}</b>${datos.provincia ? ` en ${esc(datos.provincia)}` : ''}${datos.recuerdo ? ` (recuerdo de voto: ${esc(datos.recuerdo)})` : ''}. En pactómetro.es esta respuesta se guardaría de forma anónima en la hoja de cálculo privada del titular.</p>
        <button class="btn" type="button" id="enc-otra">Volver a probar</button></div>`;
      main.querySelector('#enc-otra').addEventListener('click', () => viewEncuesta(prueba));
      main.scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }
    $btn.disabled = true; $btn.textContent = 'Enviando…';
    try {
      await fetch(CFG.encuestaURL, {method: 'POST', mode: 'no-cors', body: new URLSearchParams(datos)});
      if (probando){
        main.innerHTML = `<div class="sheet pad enc-msg" role="status"><span class="eyebrow">Prueba enviada</span><h2>Comprueba la pestaña «Pruebas»</h2>
          <p>Si la conexión con la hoja funciona, en unos segundos aparecerá una fila con <b>${esc(op.n)}</b> en la pestaña «Pruebas». No cuenta en la encuesta.</p>
          <button class="btn" type="button" id="enc-otra">Enviar otra prueba</button></div>`;
        main.querySelector('#enc-otra').addEventListener('click', () => viewEncuesta(true));
        return;
      }
      store.set(ENC.clave, {dia: hoyISO()});
      main.innerHTML = `<div class="sheet pad enc-msg" role="status"><span class="eyebrow">Respuesta registrada</span><h2>Gracias por participar</h2>
        <p>Tu respuesta se ha guardado de forma anónima. Los resultados no se publican en la web.</p>
        <div class="row"><a class="btn" href="#congreso-simulador">Probar pactos en el simulador</a><a class="btn ghost" href="#congreso">Ver el Congreso</a></div></div>`;
      main.scrollIntoView({behavior: 'smooth', block: 'start'});
    } catch(e){
      $btn.disabled = false; $btn.textContent = etiquetaBoton;
      $est.innerHTML = '<span class="enc-err">No se pudo enviar. Comprueba tu conexión a internet y vuelve a pulsar el botón.</span>';
    }
  });
  marcar();
}

/* ================================================================ vista: aviso legal, privacidad y cookies */
const LEGAL_FECHA = '22 de octubre de 2026';          // last change of the legal texts
const ACTUALIZADO = '22 de octubre de 2026', ACTUALIZADO_ISO = '2026-10-22';   // date of the last publication, set by scripts/build_dist.py
const LINKEDIN = 'https://www.linkedin.com/in/javier-pereiro-p%C3%A9rez-159763213/';
const LEGAL_PAGS = [['aviso-legal', 'Aviso legal', 'Aviso legal'], ['privacidad', 'Privacidad', 'Política de privacidad'], ['cookies', 'Cookies', 'Política de cookies']];
// What the site keeps in the browser (localStorage). Keep in sync with every store.set() in this file.
const DATOS_LOCALES = [
  ['pacto.consentimiento', 'Necesario', 'Tu elección en el aviso de cookies y su fecha, para no preguntarte en cada visita.', 'Cuando eliges en el aviso.', '24 meses; después se te vuelve a preguntar.'],
  ['pacto.encuesta29n.v1', 'Necesario', 'La fecha en que respondiste la encuesta, para admitir una respuesta por navegador y no volver a pedírtela. No guarda tu respuesta.', 'Cuando envías la encuesta.', 'Hasta que lo borres.'],
  ['pacto.sim.v2', 'Preferencias', 'El escenario del simulador del 29-N: los escaños y el voto que pones a cada candidatura.', 'Cuando usas el simulador, si has aceptado las preferencias.', 'Hasta que lo borres o rechaces las preferencias.'],
  ['pacto.promo.oculta', 'Preferencias', 'El día en que cerraste el aviso de la encuesta, para no volver a enseñártelo ese día.', 'Cuando cierras el aviso, si has aceptado las preferencias.', 'Solo tiene efecto ese día; se borra si rechazas las preferencias.'],
];
const MAIL = '<a href="mailto:pactometroes@gmail.com">pactometroes@gmail.com</a>';
const EXT = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}<span class="vh"> (se abre en una pestaña nueva)</span></a>`;
function legalAviso(){
  return `<h2>Titular del sitio web</h2>
    <dl class="legal-dl">
      <dt>Titular</dt><dd>Javier Pereiro Pérez</dd>
      <dt>Sitio web</dt><dd>pactómetro.es (https://pactometro.es)</dd>
      <dt>Contacto</dt><dd class="copy"><output id="mail">pactometroes@gmail.com</output> <button class="btn ghost" type="button" id="copy-mail">Copiar</button></dd>
      <dt>Perfil profesional</dt><dd><a class="in-link" href="${LINKEDIN}" target="_blank" rel="noopener me" aria-label="Perfil de LinkedIn de Javier Pereiro Pérez (se abre en una pestaña nueva)">LinkedIn<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a></dd>
      <dt>Naturaleza</dt><dd>Proyecto personal, informativo y sin ánimo de lucro. La web no vende productos ni servicios, no tiene publicidad y su acceso es gratuito.</dd>
    </dl>
    <p>pactómetro.es no está vinculado a ninguna administración pública, partido político ni medio de comunicación.</p>
    <h2>Condiciones de uso</h2>
    <p>El acceso a la web es libre, gratuito y sin registro. Al usarla te comprometes a hacerlo de forma lícita y, en particular, a no:</p>
    <ul>
      <li>dañar, sobrecargar o impedir el funcionamiento de la web, ni intentar acceder a sus partes no públicas;</li>
      <li>enviar a la encuesta respuestas automatizadas, masivas o falsas, ni intentar manipular sus resultados;</li>
      <li>presentar los datos, las simulaciones o las capturas de la web como resultados oficiales.</li>
    </ul>
    <h2>Exactitud de los datos y responsabilidad</h2>
    <p>Los resultados electorales proceden de las fuentes oficiales que se indican en <a href="#fuentes">Fuentes y metodología</a> o, cuando no hay datos oficiales descargables, se han recopilado de fuentes públicas y llevan la marca «Recopilado». Se revisan con cuidado, pero pueden contener errores u omisiones.</p>
    <p>Los cálculos de mayorías y pactos, el simulador y la proyección de escaños a partir de encuestas son herramientas orientativas: no son resultados oficiales ni predicciones. Para cualquier uso con efectos jurídicos, consulta las publicaciones oficiales (Boletín Oficial del Estado, boletines autonómicos y provinciales, y juntas electorales).</p>
    <p>El titular no garantiza que la web esté siempre disponible o libre de errores y no responde de los daños que puedan derivarse de su uso o de las decisiones tomadas a partir de su contenido, salvo en los casos en que la ley lo establezca.</p>
    <h2>Encuestas</h2>
    <p>La encuesta del 29-N de pactómetro.es es abierta: responde quien quiere, así que no es representativa ni una estimación de voto, y sus resultados no se publican en la web. Cómo se tratan las respuestas se explica en la <a href="#privacidad">política de privacidad</a>.</p>
    <p>Las encuestas de otros organismos, como el Centro de Investigaciones Sociológicas (CIS), se reproducen citando la fuente y con su ficha técnica, y no se muestran durante los cinco días anteriores a la votación ni el día de las elecciones hasta el cierre de los colegios (artículo 69 de la Ley Orgánica 5/1985, del Régimen Electoral General).</p>
    <h2>Propiedad intelectual</h2>
    <p>El diseño, el código, los textos y la recopilación y organización de los datos de pactómetro.es pertenecen a su titular. © 2026 Javier Pereiro Pérez. Todos los derechos reservados.</p>
    <p>Los resultados electorales oficiales son información del sector público, que se reutiliza citando su origen (Ley 37/2007, sobre reutilización de la información del sector público). Puedes reutilizar los datos que descargas en Excel citando pactómetro.es y la fuente oficial. Los datos de terceros se citan con su licencia en <a href="#fuentes">Fuentes y metodología</a>, y las tipografías Archivo e Ibarra Real Nova se usan con licencia SIL Open Font License 1.1.</p>
    <h2>Enlaces a otras webs</h2>
    <p>La web enlaza a fuentes oficiales y a otros sitios para que puedas comprobar los datos. El titular no controla esos sitios ni responde de su contenido.</p>
    <h2>Legislación aplicable</h2>
    <p>Este aviso legal se rige por la legislación española.</p>`;
}
function legalPrivacidad(){
  return `<p class="lede">pactómetro.es no pide ni guarda datos que te identifiquen: no hay registro ni cuentas de usuario, y la web no usa cookies, analítica ni publicidad. Esta política explica los pocos casos en que se trata alguna información.</p>
    <h2>Responsable</h2>
    <p>Javier Pereiro Pérez, titular de pactómetro.es. Contacto: ${MAIL}.</p>
    <h2>1. Cuando visitas la web</h2>
    <p>pactómetro.es está alojada en GitHub Pages, un servicio de GitHub, Inc. Como en cualquier web, tu navegador se conecta con los servidores del alojamiento, y GitHub registra la dirección IP de quienes visitan las páginas por motivos de seguridad. pactómetro.es no tiene acceso a esos registros ni los usa. Más información en la ${EXT('https://docs.github.com/es/site-policy/privacy-policies/github-general-privacy-statement', 'declaración de privacidad de GitHub')}.</p>
    <p>La web no carga contenidos de terceros: el código, los datos y las tipografías se sirven desde el propio pactómetro.es. Los botones para compartir (WhatsApp, Telegram, X, Bluesky, LinkedIn, correo) son enlaces normales: la web no carga nada de esas redes y solo te llevan a ellas si los pulsas. La imagen para compartir se genera en tu propio navegador.</p>
    <p>La noche electoral del 29 de noviembre, la página de resultados en directo y el widget consultan cada minuto una hoja de cálculo de Google del titular para mostrar el escrutinio. Al hacerlo, tu navegador se conecta con los servidores de Google LLC, que reciben tu dirección IP como en cualquier conexión; la consulta no lleva cookies ni ningún dato tuyo.</p>
    <p>El widget que otras webs pueden insertar no usa cookies ni guarda nada en el navegador de quien lo ve.</p>
    <h2>2. La encuesta del 29-N</h2>
    <dl class="legal-dl">
      <dt>Qué datos se recogen</dt><dd>Tu provincia y tu intención de voto (obligatorias), tu voto en las generales del 23 de julio de 2023 (opcional) y la fecha y la hora de la respuesta, redondeada a la hora en punto. Nada más: ni nombre, ni correo, ni dirección IP, ni identificadores de tu dispositivo.</dd>
      <dt>Por qué con especial cuidado</dt><dd>La intención y el recuerdo de voto son opiniones políticas, una categoría especial de datos según el artículo 9 del Reglamento General de Protección de Datos (RGPD). La encuesta está pensada para que las respuestas no se puedan asociar a ninguna persona y, además, solo se envían si lo aceptas expresamente marcando la casilla del formulario.</dd>
      <dt>Para qué</dt><dd>Para elaborar recuentos y cruces estadísticos (por provincia y según el recuerdo de voto) de uso interno. Las respuestas individuales no se publican nunca y los resultados no se muestran en la web.</dd>
      <dt>Base jurídica</dt><dd>Tu consentimiento explícito (artículos 6.1.a y 9.2.a del RGPD), que das al marcar la casilla y enviar. Responder es voluntario.</dd>
      <dt>Quién puede responder</dt><dd>Personas de 18 años o más.</dd>
      <dt>Dónde se guardan</dt><dd>En una hoja de cálculo privada de Google Sheets de la cuenta del titular, que recibe las respuestas a través de Google Apps Script. Al enviar, tu navegador se conecta con los servidores de Google LLC, que reciben tu dirección IP como en cualquier conexión a internet; el envío no lleva cookies y la hoja no guarda la IP. Más información en la ${EXT('https://policies.google.com/privacy?hl=es', 'política de privacidad de Google')}.</dd>
      <dt>Quién las ve</dt><dd>Solo el titular. No se ceden a nadie.</dd>
      <dt>Cuánto tiempo</dt><dd>Las respuestas individuales se borran como tarde el 31 de mayo de 2027. Después solo se conservan los totales agregados.</dd>
      <dt>Una respuesta por navegador</dt><dd>Tu navegador guarda la fecha en que respondiste, sin tu respuesta, para no volver a pedírtela. Se explica en la <a href="#cookies">política de cookies</a>.</dd>
    </dl>
    <h2>3. Si escribes al correo de contacto</h2>
    <p>Tu dirección y tu mensaje se usan solo para responderte y se conservan mientras haga falta para atender tu consulta. El correo se gestiona con Gmail, de Google LLC.</p>
    <h2>Transferencias internacionales</h2>
    <p>GitHub, Inc. y Google LLC tienen su sede en Estados Unidos. Según sus políticas de privacidad, las transferencias de datos desde la Unión Europea se amparan en el Marco de Privacidad de Datos UE-EE. UU. y en las demás garantías que prevé el RGPD.</p>
    <h2>Tus derechos</h2>
    <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar tu consentimiento, escribiendo a ${MAIL}.</p>
    <p>Las respuestas de la encuesta no llevan ningún dato que permita saber cuál es la tuya, así que no es posible localizarla para consultarla o borrarla (artículo 11 del RGPD). Por la misma razón, nunca podrá vincularse a ti.</p>
    <p>Si crees que no se han respetado tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (${EXT('https://www.aepd.es', 'aepd.es')}).</p>
    <h2>Seguridad</h2>
    <p>La web solo funciona con conexión cifrada (HTTPS), no carga código de terceros y tiene una política de seguridad de contenidos que impide ejecutar scripts ajenos. La hoja de respuestas es privada y solo se puede abrir desde la cuenta del titular.</p>`;
}
function legalCookies(){
  return `<p class="lede"><b>pactómetro.es no usa cookies</b>: ni propias ni de terceros, ni de analítica, ni de publicidad, ni de redes sociales.</p>
    <h2>Lo que sí guarda tu navegador</h2>
    <p>Para que algunas funciones recuerden lo que has hecho, la web usa el almacenamiento local de tu navegador (localStorage). Solo se guarda algo cuando haces la acción correspondiente, se queda en tu dispositivo y la web no lo envía a ningún sitio. Los datos <b>necesarios</b> se guardan siempre; los de <b>preferencias</b>, solo si los aceptas en el aviso de cookies.</p>
    <div class="tablewrap"><table class="data"><caption class="vh">Datos que pactómetro.es guarda en tu navegador</caption>
      <thead><tr><th>Dato</th><th>Tipo</th><th>Para qué sirve</th><th>Cuándo se guarda</th><th>Cuánto dura</th></tr></thead>
      <tbody>${DATOS_LOCALES.map(([k, t, a, b, c]) => `<tr><td data-l="Dato"><code>${k}</code></td><td data-l="Tipo">${t}</td><td data-l="Para qué sirve">${a}</td><td data-l="Cuándo se guarda">${b}</td><td data-l="Cuánto dura">${c}</td></tr>`).join('')}</tbody></table></div>
    <h2>El aviso de cookies</h2>
    <p>La primera vez que entras, la web te pregunta si puede guardar tus preferencias. Puedes aceptarlas, rechazarlas o configurarlas, con la misma facilidad, y cambiar de opinión cuando quieras desde «Configurar cookies», al pie de todas las páginas. Rechazar no te impide usar nada: solo hace que el simulador no recuerde tu escenario cuando cierras la página. Tu elección se vuelve a pedir pasados 24 meses.</p>
    <p>El artículo 22.2 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), exige consentimiento para guardar o leer datos en el dispositivo de quien visita una web, salvo cuando sea estrictamente necesario para un servicio que ha pedido expresamente. Los datos necesarios de la tabla son de ese tipo; para los de preferencias, la web pide tu permiso aunque solo sirvan para funciones que tú usas y nunca para seguirte ni con fines publicitarios.</p>
    <p>Si algún día la web incorpora publicidad o analítica, esta política se actualizará y el aviso te pedirá permiso para cada uso, con la opción de rechazarlo.</p>
    <h2>Tu elección</h2>
    <p id="ck-estado" role="status">${textoConsentimiento()}</p>
    <div class="row"><button class="btn" type="button" data-ck-abrir>Cambiar mi elección</button></div>
    <h2>Cómo borrarlos</h2>
    <p>Puedes borrarlos con este botón o desde la configuración de tu navegador (datos de los sitios web). Se borrarán el escenario del simulador, la marca de encuesta respondida y tu elección en el aviso de cookies, que se te volverá a preguntar.</p>
    <div class="row"><button class="btn" type="button" id="borrar-local">Borrar los datos de pactómetro.es de este navegador</button></div>
    <p class="small" id="borrar-estado" role="status"></p>`;
}
function viewLegal(pag){
  const [, , titulo] = LEGAL_PAGS.find(x => x[0] === pag);
  setTitle(titulo);
  const cuerpo = pag === 'privacidad' ? legalPrivacidad() : pag === 'cookies' ? legalCookies() : legalAviso();
  app.innerHTML = `<div class="page-head"><span class="eyebrow">Información legal</span><h1>${titulo}</h1></div>
    <nav class="tabs" aria-label="Páginas de información legal">${LEGAL_PAGS.map(([k, n]) => `<a class="tab" href="#${k}"${k === pag ? ' aria-current="page"' : ''}>${n}</a>`).join('')}<a class="tab" href="#fuentes">Fuentes y metodología</a></nav>
    <div class="prose legal">${cuerpo}<p class="small muted">Última actualización: ${LEGAL_FECHA}.</p></div>`;
  const cm = app.querySelector('#copy-mail');
  if (cm) cm.addEventListener('click', async ev => {
    const out = app.querySelector('#mail');
    try { await navigator.clipboard.writeText(out.textContent); ev.target.textContent = 'Copiado'; }
    catch(e){ const r = document.createRange(); r.selectNodeContents(out); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ev.target.textContent = 'Seleccionado: pulsa Ctrl+C'; }
  });
  const bl = app.querySelector('#borrar-local');
  if (bl) bl.addEventListener('click', () => {
    let n = 0;
    try { Object.keys(localStorage).filter(k => k.startsWith('pacto.')).forEach(k => { localStorage.removeItem(k); n++; }); } catch(e){}
    app.querySelector('#borrar-estado').textContent = n === 1 ? 'Hecho: se ha borrado el dato de pactómetro.es que había en este navegador.' : n ? `Hecho: se han borrado los ${n} datos de pactómetro.es que había en este navegador.` : 'Este navegador no tenía ningún dato de pactómetro.es guardado.';
    actualizarPromo('cookies');
    const est = app.querySelector('#ck-estado'); if (est) est.textContent = textoConsentimiento();
    abrirAvisoCookies(false);
  });
}

/* ================================================================ vista: fuentes y metodología */
async function viewFuentes(){
  setTitle('Fuentes y metodología');
  app.innerHTML = `<div class="page-head"><span class="eyebrow">Metodología</span><h1>Fuentes y metodología</h1></div>
  <div class="prose">
    <h2>De dónde salen los datos</h2>
    <ul>
      <li><b>Ayuntamientos (1979-2023), diputaciones provinciales (1987-2023), cabildos insulares (1987-2023) y Congreso (1977-2023):</b> ficheros oficiales de resultados del Ministerio del Interior (área de descargas de <a href="https://infoelectoral.interior.gob.es/" target="_blank" rel="noopener">infoelectoral.interior.gob.es</a>), leídos directamente con el formato oficial de registros. Los ficheros de 2023 son los publicados por el Ministerio; los de 1977 a 2019 proceden de la copia íntegra de esos mismos ficheros que mantiene el proyecto <a href="https://github.com/JaimeObregon/infoelectoral" target="_blank" rel="noopener">infoelectoral</a> de Jaime Gómez-Obregón.</li>
      <li><b>Congreso, 1989 y 1993:</b> el Ministerio no ofrece ficheros de totales para esas dos elecciones; los escaños se obtienen de la relación oficial de candidatos electos, decodificada por el proyecto <a href="https://github.com/PucelaBits/listas-electorales" target="_blank" rel="noopener">listas-electorales</a> (licencia CC BY 4.0). No hay votos para esos dos años.</li>
      <li><b>Senado:</b> senadores electos según la relación oficial de candidatos de cada elección.</li>
      <li><b>Investiduras y mociones de censura:</b> archivo oficial del <a href="https://www.congreso.es/es/cem/sesiones-de-investidura" target="_blank" rel="noopener">Congreso de los Diputados</a>.</li>
      <li><b>Parlamentos autonómicos:</b> las elecciones autonómicas no las publica el Ministerio del Interior sino cada comunidad. Los escaños de las 201 elecciones autonómicas celebradas entre 1980 y 2026 se han recopilado de fuentes públicas (Wikipedia) y se ha comprobado que cada elección suma exactamente el tamaño de su cámara. Ceuta y Melilla sí son datos oficiales, porque sus asambleas se eligen en las elecciones municipales. Se marcan como «Recopilado».</li>
      <li><b>Juntas Generales vascas y consells de Mallorca, Menorca y Eivissa (2023):</b> resultados recopilados de fuentes públicas. El Consell de Formentera es dato oficial (se elige en las municipales).</li>
      <li><b>Composición del Congreso al disolverse las Cortes (6-10-2026):</b> recopilada de fuentes públicas y prensa. No es un resultado electoral.</li>
      <li><b>Simulador del 29-N, encuesta del CIS:</b> estimación de voto del <a href="https://www.cis.es/gl/w/avance-de-resultados-del-estudio-3582-bar%C3%B3metro-de-octubre-2026-" target="_blank" rel="noopener">Barómetro de octubre 2026</a> del Centro de Investigaciones Sociológicas (estudio n.º 3582; trabajo de campo del 1 al 6 de octubre de 2026; 5.025 entrevistas; publicado el 14 de octubre de 2026). El CIS no estima escaños: los escaños de partida son una proyección de pactómetro.es (variación proporcional sobre los resultados provinciales del 23-J, barrera del 3 % y ley D'Hondt con los escaños por provincia del Real Decreto 806/2026). No se muestra durante los cinco días anteriores a la votación ni el 29 de noviembre hasta el cierre de los colegios (art. 69.7 LOREG).</li>
      <li><b>Encuesta 29-N:</b> encuesta abierta de pactómetro.es, del 13 de octubre al domingo 22 de noviembre de 2026 a las 20:00 (hora peninsular). Responde quien quiere, así que no es representativa ni una estimación de voto. Sus resultados no se publican en la web.</li>
    </ul>
    <h2>Cómo se calcula</h2>
    <ul>
      <li>Mayoría absoluta = la mitad del número legal de miembros, redondeada hacia abajo, más uno (176 en el Congreso).</li>
      <li>Investidura: mayoría absoluta en la primera votación; en la segunda basta con más votos a favor que en contra. Las abstenciones no cuentan como «no».</li>
      <li>Alcaldías: si ningún cabeza de lista obtiene la mayoría absoluta de los concejales, es alcalde el de la lista más votada (art. 196 LOREG).</li>
      <li>«Mayorías posibles» son las coaliciones mínimas ganadoras: suman mayoría absoluta y la pierden si sale cualquiera de sus miembros.</li>
      <li>Recuento de votos: los porcentajes de voto se calculan sobre los votos válidos (votos a candidaturas más votos en blanco), como en los resultados oficiales. En las diputaciones provinciales, el censo, los votantes, los votos en blanco y los nulos son la suma de los resultados municipales oficiales de los municipios de la provincia. «Resto de candidaturas sin escaño» son los votos a candidaturas que no figuran una a una en los datos.</li>
      <li>Comparar: las familias políticas agrupan a cada partido con sus federaciones, coaliciones y nombres anteriores para poder comparar instituciones distintas. «Congreso en una comunidad» suma los resultados del Congreso en las provincias de esa comunidad.</li>
      <li>Descargas en Excel: cada pactómetro y cada comparación se pueden descargar en una hoja de cálculo (.xlsx) generada en tu navegador con los mismos datos de la web. Si reutilizas los datos, cita pactómetro.es y la fuente oficial.</li>
      <li>Los colores identifican familias políticas (PSOE y sus federaciones, PP y la antigua AP, etc.) solo para leer los gráficos; el nombre oficial de cada candidatura se mantiene siempre.</li>
      <li>Los resultados reflejan lo que salió de las urnas. Cambios posteriores (tránsfugas, expulsiones, mociones de censura) no se recogen, salvo en la pestaña «Al disolverse las Cortes».</li>
    </ul>
    <h2>Información legal</h2>
    <p>Quién está detrás de la web, cómo se tratan las respuestas de la encuesta y qué guarda tu navegador: <a href="#aviso-legal">aviso legal</a>, <a href="#privacidad">política de privacidad</a> y <a href="#cookies">política de cookies</a>. La web no usa cookies.</p>
    <p class="small muted">Datos actualizados a ${ACTUALIZADO}.</p>
  </div>`;
}
function notFound(){
  setTitle('Página no encontrada');
  app.innerHTML = `<div class="error"><h1 class="h3" style="font-size:24px">No encontramos esa página</h1><p class="muted">El enlace no corresponde a ninguna institución con datos. <a href="#inicio">Ir a la portada</a> o <a href="#ayuntamientos">buscar un municipio</a>.</p></div>`;
}

/* ================================================================ vista: portada */
// The portada teaches the idea by doing it (a live Congreso hemicycle: tap parties, watch them reach 176),
// takes people to any institution with one search box, and keeps the 29-N in view.
const INICIO_EJEMPLOS = [['#mun-28079', 'Ayuntamiento de Madrid'], ['#auto-cataluna', 'Parlament de Catalunya'], ['#dip-41', 'Diputación de Sevilla'], ['#cab-tenerife', 'Cabildo de Tenerife']];
const ICO_LUPA = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 13l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICO_OK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NUM_TXT = ['ninguna', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
const miles = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // 8.174, también con cuatro cifras
const listaY = n => n.length < 2 ? (n[0] || '') : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1];

async function viewInicio(){
  document.title = 'Pactómetro · Mayorías y pactos en todas las instituciones de España';
  app.className = 'home';
  app.innerHTML = `
  <section class="h-hero" aria-labelledby="h-titulo"><div class="wrap">
    ${avisoElecciones()}
    <div class="h-intro">
      <h1 class="h-title" id="h-titulo">¿Quién puede gobernar?</h1>
      <p class="h-lede">Calcula las mayorías y los pactos posibles en el Congreso, los parlamentos autonómicos, las diputaciones, los cabildos y los más de 8.000 ayuntamientos de España, con los resultados oficiales desde 1977.</p>
      <form class="h-search" id="h-search" role="search" autocomplete="off" novalidate>
        <label for="h-q">Busca tu ayuntamiento, tu diputación o tu parlamento</label>
        <div class="h-sbox">
          <div class="h-sfield">
            <div class="h-sinput">${ICO_LUPA}<input id="h-q" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="h-list" aria-describedby="h-sres" placeholder="Por ejemplo: Getafe, Lugo o Canarias" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></div>
            <button class="h-sgo" type="submit">Buscar</button>
          </div>
          <ul class="h-list" id="h-list" role="listbox" aria-label="Instituciones encontradas" hidden></ul>
        </div>
        <p class="vh" id="h-sres" aria-live="polite"></p>
      </form>
      <div class="h-try"><span>Prueba con</span>${INICIO_EJEMPLOS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>
    </div>
    <div class="h-demo" role="group" aria-labelledby="h-demo-t">
      <div class="h-demo-head"><h2 id="h-demo-t">Pruébalo con el Congreso</h2><span>Escaños del 23 de julio de 2023</span></div>
      <div class="h-hemi" id="h-hemi"><p class="loading">Cargando el Congreso…</p></div>
      <p class="h-status" id="h-status" aria-live="polite"></p>
      <div class="h-chips" id="h-chips" role="group" aria-label="Partidos del Congreso: púlsalos para sumar sus escaños"></div>
      <p class="h-demo-src" id="h-demo-src" hidden></p>
      <div class="h-demo-foot"><a href="#congreso" id="h-demo-link">Abrir el pactómetro del Congreso</a><button class="btn ghost" type="button" id="h-vaciar" hidden>Vaciar la suma</button></div>
    </div>
  </div></section>
  <section class="h-band" aria-labelledby="h-29n"><div class="wrap">
    <div class="h-band-top">
      <div class="h-band-txt"><h2 id="h-29n">Calendario del 29-N</h2><p>De la disolución de las Cortes a la constitución de las nuevas. La campaña va del 13 al 27 de noviembre y el domingo 29 se vota de 9:00 a 20:00, hora local.</p></div>
      <div class="h-band-acts">
        ${encPromo() ? `<a class="btn lg btn-l" href="#encuesta">${encModo() === 'previa' ? 'Ver la encuesta' : 'Responder la encuesta'}</a>` : ''}
        <a class="btn lg ${encPromo() ? 'btn-o' : 'btn-l'}" href="#congreso-simulador">Simular el 29-N</a>
        <a class="btn lg btn-o" href="#29n">Calendario completo y cómo se vota</a>
        <a class="btn lg btn-o" href="#congreso-disolucion">El Congreso al disolverse</a>
      </div>
    </div>
    <ol class="h-cal" id="h-cal" aria-label="Calendario electoral"></ol>
  </div></section>
  <section class="h-sec" aria-labelledby="h-niveles"><div class="wrap">
    <div class="h-sec-head"><h2 id="h-niveles">Del Congreso a tu ayuntamiento</h2><p>Cada institución tiene su propia mayoría absoluta: la mitad de sus miembros más uno. Elige dónde quieres calcularla.</p></div>
    <div class="h-levels">
      <div class="h-level">
        <div class="h-ltxt"><h3>Congreso de los Diputados</h3><p id="h-l1">350 diputados y una mayoría absoluta de 176, con todas las elecciones generales desde 1977.</p>
          <div class="h-acts"><a class="btn lg solid" href="#congreso">Abrir el Congreso</a><a class="btn lg ghost" href="#congreso-simulador">Simulador del 29-N</a></div></div>
        <figure class="h-fig"><figcaption>Escaños del partido ganador en cada elección general. La línea marca la mayoría absoluta.</figcaption><div id="h-wins"></div></figure>
      </div>
      <div class="h-level">
        <div class="h-ltxt"><h3>Parlamentos autonómicos</h3><p>Los 17 parlamentos autonómicos y las asambleas de Ceuta y Melilla, con todas sus elecciones desde 1980.</p>
          <div class="h-acts"><a class="btn lg ghost" href="#autonomias">Ver las autonomías</a></div></div>
        <figure class="h-fig"><figcaption>Reparto de escaños tras las últimas elecciones de cada comunidad. La marca vertical señala la mayoría absoluta.</figcaption><ul class="h-auto" id="h-auto"></ul></figure>
      </div>
      <div class="h-level">
        <div class="h-ltxt"><h3>Diputaciones, cabildos y consells</h3><p id="h-l3">Las diputaciones provinciales, los cabildos canarios, los consells de Baleares y las juntas generales del País Vasco.</p>
          <div class="h-acts"><a class="btn lg ghost" href="#locales">Ver todas</a></div></div>
        <form class="h-pick" id="h-pick"><label for="h-loc">Elige una institución provincial o insular</label><div class="h-pick-row"><select class="select" id="h-loc"><option value="">Cargando…</option></select><button class="btn lg solid" type="submit">Abrir</button></div></form>
      </div>
      <div class="h-level">
        <div class="h-ltxt"><h3>Ayuntamientos</h3><p id="h-l4">Todos los municipios de España, con las elecciones municipales desde 1979.</p>
          <div class="h-acts"><a class="btn lg ghost" href="#ayuntamientos">Buscar un municipio</a></div></div>
        <figure class="h-fig"><figcaption>Las ciudades más pobladas y la mayoría absoluta de su pleno.</figcaption><ul class="h-cities" id="h-cities"></ul></figure>
      </div>
    </div>
  </div></section>
  <section class="h-sec" aria-labelledby="h-prov"><div class="wrap">
    <div class="h-sec-head"><h2 id="h-prov">Tu provincia</h2><p>Cuántos diputados elige el 29-N, cómo votó el 23-J y todos sus ayuntamientos.</p></div>
    <ul class="h-provs" id="h-provs">${Object.entries(ESC_2026).sort((a, b) => (PROV_NOMBRE[a[0]] || '').localeCompare(PROV_NOMBRE[b[0]] || '', 'es')).map(([k, n]) => `<li><a href="#prov-${k}"><span>${esc(PROV_NOMBRE[k] || k)}</span><b>${n}<span class="vh"> diputados</span></b></a></li>`).join('')}</ul>
  </div></section>
  <section class="h-sec h-more" aria-labelledby="h-mas"><div class="wrap">
    <h2 id="h-mas">Más formas de explorar</h2>
    <div class="h-tools">
      <div class="h-tool"><h3>Histórico electoral</h3><p>Las elecciones generales, las investiduras y el Senado desde 1977, las autonómicas desde 1980 y los concejales de toda España desde 1979.</p><a href="#historico">Ver el histórico</a></div>
      <div class="h-tool"><h3>Comparar</h3><p>Pon frente a frente hasta cuatro instituciones o elecciones: tu ayuntamiento en 2019 y en 2023, el Congreso y tu comunidad, dos diputaciones…</p><a href="#comparar">Comparar instituciones</a></div>
      <div class="h-tool"><h3>Descargas en Excel</h3><p>Cada pactómetro y cada comparación se descargan en una hoja de cálculo con los votos, los escaños, las mayorías posibles y el histórico.</p></div>
      <div class="h-tool"><h3>De dónde salen los datos</h3><p>Resultados oficiales del Ministerio del Interior y del Congreso. Las autonómicas, que el Ministerio no publica, se han recopilado de fuentes públicas y llevan la marca «Recopilado».</p><a href="#fuentes">Fuentes y metodología</a></div>
    </div>
  </div></section>`;
  Buscador(app.querySelector('#h-search'));
  iniciarCuenta();
  const aviso = (el, txt) => e => { console.error(e); if (el) el.innerHTML = `<p class="small muted">${txt} Recarga la página para intentarlo de nuevo.</p>`; };
  // the demo shows the latest CIS poll until the 29-N results are loaded (hidden during the legal blackout, art. 69.7 LOREG)
  Promise.all([load('generales.json'), enVedaSondeos() ? null : load('cis.json').catch(() => null)]).then(([G, C]) => {
    DemoCongreso(G, app.querySelector('.h-demo'), C);
    ganadoresCongreso(G, app.querySelector('#h-wins'), app.querySelector('#h-l1'));
    calendarioInicio(G, app.querySelector('#h-cal'));
  }).catch(aviso(app.querySelector('#h-hemi'), 'No se pudo cargar el Congreso.'));
  load('autonomicas.json').then(A => autonomiasInicio(A, app.querySelector('#h-auto'))).catch(aviso(app.querySelector('#h-auto'), 'No se pudieron cargar los parlamentos.'));
  load('locales.json').then(L => localesInicio(L, app.querySelector('#h-pick'), app.querySelector('#h-l3'))).catch(aviso(app.querySelector('#h-pick'), 'No se pudo cargar la lista.'));
  Promise.all([load('municipios.json'), load('resumen.json')]).then(([M, R]) => ciudadesInicio(M, R, app.querySelector('#h-cities'), app.querySelector('#h-l4'))).catch(aviso(app.querySelector('#h-cities'), 'No se pudieron cargar los municipios.'));
}

// Hemiciclo del Congreso: los partidos elegidos se colocan a la izquierda con su color y el resto pasa a gris.
// Muestra la proyección de la última encuesta del CIS (C) mientras no haya resultados del 29-N; si no, la última elección general.
function DemoCongreso(G, box, C){
  if (!box || !box.isConnected) return;
  const ult = Object.keys(G.congreso).sort((a, b) => G.congreso[a].fecha.localeCompare(G.congreso[b].fecha)).pop();   // newest general election
  const e = G.congreso[ult];
  const cis = C && Array.isArray(C.partidos) && e.fecha < '2026-11-29';
  let total, P;
  if (cis){
    total = 350;
    P = C.partidos.filter(p => p.esc > 0).map((p, i) => ({id: 'p' + i, sig: niceSig(p.sig), nom: `${p.nom}: ${fmtPct(p.est)} en la estimación de voto del CIS`, color: p.color, esc: p.esc})).sort((a, b) => b.esc - a.esc);
    box.querySelector('.h-demo-head span').textContent = 'Encuesta del CIS · octubre de 2026';
    const src = box.querySelector('#h-demo-src'), lk = box.querySelector('#h-demo-link');
    src.innerHTML = `Escaños estimados por pactómetro.es a partir de la estimación de voto del <a href="${esc(C.estudio.url)}" target="_blank" rel="noopener">barómetro de octubre de 2026 del CIS<span class="vh"> (se abre en una pestaña nueva)</span></a> (estudio n.º ${C.estudio.numero}). El CIS publica porcentajes de voto, no escaños.`;
    src.hidden = false;
    lk.href = '#congreso-simulador'; lk.textContent = 'Abrir el simulador con la encuesta del CIS';
  } else {
    total = e.escanos || 350;
    P = e.r.filter(r => r[5] > 0).map((r, i) => ({id: 'p' + i, sig: niceSig(r[0]), nom: r[1] ? nice(r[1]) : '', color: r[2], esc: r[5]})).sort((a, b) => b.esc - a.esc);
    box.querySelector('.h-demo-head span').textContent = 'Escaños del ' + fecha(e.fecha);
  }
  const maj = Math.floor(total / 2) + 1;
  const sel = [];
  const $h = box.querySelector('#h-hemi'), $st = box.querySelector('#h-status'), $ch = box.querySelector('#h-chips'), $vac = box.querySelector('#h-vaciar');
  const {pos, rad} = seatLayout(total);
  const cx = 200, cy = 204, S = 192 / 1.75, r = Math.max(1.3, rad * S * .84);
  const Rmin = Math.min(...pos.map(q => q[1])), Rmax = Math.max(...pos.map(q => q[1]));
  let svg = `<svg viewBox="0 0 400 222" aria-hidden="true" focusable="false">`;
  pos.forEach(([a, R]) => {
    const x = cx + R * Math.cos(a) * S, y = cy - R * Math.sin(a) * S;
    svg += `<circle class="hs" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" style="--d:${((Math.PI - a) / Math.PI * .6 + (R - Rmin) * .12).toFixed(3)}s"/>`;
  });
  const am = (pos[maj - 1][0] + pos[maj][0]) / 2, pt = R => [cx + R * Math.cos(am) * S, cy - R * Math.sin(am) * S];
  const [x0, y0] = pt(Rmin - rad * 1.6), [x1, y1] = pt(Rmax + rad * 1.8);
  svg += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round"/>`;
  svg += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="${Math.min(72, Rmin * S * .76).toFixed(1)}" font-weight="800" style="font-variation-settings:'wdth' 125;letter-spacing:-.03em">${maj}</text>`;
  svg += `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="13" style="fill:var(--muted)">escaños para la mayoría absoluta</text></svg>`;
  $h.innerHTML = svg; $h.classList.add('intro');
  setTimeout(() => $h.classList.remove('intro'), 1700);
  const svgEl = $h.querySelector('svg'), seats = [...svgEl.querySelectorAll('.hs')];
  $ch.innerHTML = P.map(p => `<button type="button" class="hchip" data-id="${p.id}" aria-pressed="false"${p.nom && norm(p.nom) !== norm(p.sig) ? ` title="${esc(p.nom)}"` : ''}>${ICO_OK}<span class="dot" style="background:${p.color}" aria-hidden="true"></span>${esc(p.sig)}<span class="n">${p.esc}<span class="vh"> escaños</span></span></button>`).join('');
  const byId = id => P.find(p => p.id === id);
  function paint(){
    const on = new Set(sel);
    const order = sel.map(byId).concat(P.filter(p => !on.has(p.id)));
    let i = 0;
    for (const p of order) for (let k = 0; k < p.esc && i < seats.length; k++, i++){
      seats[i].style.fill = !sel.length || on.has(p.id) ? p.color : 'var(--seat-empty)';
      seats[i].dataset.p = p.id;
    }
    for (; i < seats.length; i++) seats[i].style.fill = 'var(--seat-empty)';
    const s = sel.reduce((a, id) => a + byId(id).esc, 0), quien = esc(listaY(sel.map(id => byId(id).sig))), verbo = sel.length > 1 ? 'suman' : 'tiene';
    $st.innerHTML = !sel.length ? `Pulsa los partidos para sumar sus escaños. Para gobernar hacen falta <b>${maj}</b> de ${total}.`
      : s >= maj ? `<span class="pill on">Mayoría absoluta</span>${quien} ${verbo} <b>${s}</b> escaños, ${s === maj ? 'justo los necesarios' : `${s - maj} más de los necesarios`}.`
      : `${quien} ${verbo} <b>${s}</b> escaños. Faltan <b>${maj - s}</b> para la mayoría absoluta.`;
    $ch.querySelectorAll('.hchip').forEach(b => b.setAttribute('aria-pressed', on.has(b.dataset.id)));
    $vac.hidden = !sel.length;
  }
  function resaltar(id){
    svgEl.classList.toggle('dim', !!id);
    seats.forEach(c => c.classList.toggle('hi', !!id && c.dataset.p === id));
  }
  // with a mouse, hovering a party shows where its seats are; a click clears it so the sum is visible at once
  let pausa = null;
  $ch.addEventListener('click', ev => {
    const b = ev.target.closest('.hchip'); if (!b) return;
    const i = sel.indexOf(b.dataset.id);
    if (i >= 0) sel.splice(i, 1); else sel.push(b.dataset.id);
    pausa = b.dataset.id; resaltar(null); paint();
  });
  $ch.addEventListener('pointerover', ev => {
    if (ev.pointerType !== 'mouse') return;
    const b = ev.target.closest('.hchip'), id = b ? b.dataset.id : null;
    if (id !== pausa){ pausa = null; resaltar(id); }
  });
  $ch.addEventListener('pointerleave', () => { pausa = null; resaltar(null); });
  $vac.addEventListener('click', () => { sel.length = 0; paint(); $ch.querySelector('.hchip').focus(); });
  paint();
}

function ganadoresCongreso(G, box, txt){
  const ks = Object.keys(G.congreso).sort((a, b) => G.congreso[a].fecha.localeCompare(G.congreso[b].fecha));
  const MAX = 210, H = 160, BASE = 20, abs = [];
  const items = ks.map(k => {
    const e = G.congreso[k], total = e.escanos || 350, w = e.r.slice().sort((a, b) => b[5] - a[5])[0];  // one <li> per election
    const m = w[5] >= Math.floor(total / 2) + 1; if (m) abs.push(k.slice(0, 4));
    const nombre = `${LEYENDA_ELECCION(k)}: ${niceSig(w[0])}, ${w[5]} escaños`;
    return `<li><a href="#congreso-${k}" aria-label="${esc(nombre + (m ? ', mayoría absoluta' : ''))}" title="${esc(nombre)}" style="--h:${(Math.min(w[5], MAX) / MAX * H).toFixed(1)}px;--c:${w[2]}"><span class="b"></span><span class="y" aria-hidden="true">${k.slice(2, 4)}</span></a></li>`;
  });
  const mitad = Math.ceil(items.length / 2), linea = `<span class="h-maj" style="--y:${(BASE + 176 / MAX * H).toFixed(1)}px" aria-hidden="true"><b>176</b></span>`;
  box.innerHTML = `<div class="h-wins2">${[items.slice(0, mitad), items.slice(mitad)].map((parte, i) => `<div class="h-wins-c"><ul class="h-wins" aria-label="Partido ganador en las elecciones generales de ${i ? ks[mitad].slice(0, 4) : ks[0].slice(0, 4)} a ${i ? ks[ks.length - 1].slice(0, 4) : ks[mitad - 1].slice(0, 4)}">${parte.join('')}</ul>${linea}</div>`).join('')}</div>`;
  txt.textContent = `350 diputados y una mayoría absoluta de 176. De las ${ks.length} elecciones generales desde 1977, solo ${NUM_TXT[abs.length] || abs.length} dieron la mayoría absoluta a un partido: ${listaY(abs)}.`;
}

function autonomiasInicio(A, ul){
  const ids = Object.keys(A).sort((a, b) => A[a].n.localeCompare(A[b].n, 'es'));
  ul.innerHTML = ids.map(id => {
    const a = A[id], e = a.elecciones[a.elecciones.length - 1], maj = Math.floor(e.escanos / 2) + 1;
    const rows = e.r.filter(r => r[5] > 0).sort((x, y) => y[5] - x[5]), w = rows[0];
    const nombre = `${a.n}. ${a.camara}, elecciones del ${fecha(e.fecha)}: ${w ? `${niceSig(w[0])} tiene ${w[5]} de ${e.escanos} escaños` : ''}; la mayoría absoluta es ${maj}`;
    return `<li><a href="#auto-${id}" aria-label="${esc(nombre)}"><span>${esc(a.n)}</span>${miniBar(rows, e.escanos, true)}</a></li>`;
  }).join('');
}

function localesInicio(L, form, txt){
  const grupos = [['dip', 'Diputaciones provinciales'], ['cab', 'Cabildos insulares'], ['con', 'Consells insulars'], ['jjgg', 'Juntas Generales']];
  const sel = form.querySelector('select');
  sel.innerHTML = '<option value="">Elige de la lista</option>' + grupos.map(([t, g]) => `<optgroup label="${g}">${Object.values(L[TIPOS[t].k]).sort((a, b) => a.n.localeCompare(b.n, 'es')).map(x => `<option value="${t}-${x.id}">${esc(nombreLocal(t, x))}</option>`).join('')}</optgroup>`).join('');
  form.addEventListener('submit', ev => { ev.preventDefault(); if (sel.value) irA(sel.value); else sel.focus(); });
  const n = t => Object.keys(L[TIPOS[t].k]).length;
  txt.textContent = `Las ${n('dip')} diputaciones provinciales, los ${n('cab')} cabildos canarios, los ${n('con')} consells de Baleares y las ${n('jjgg')} juntas generales del País Vasco.`;
}

function ciudadesInicio(M, R, ul, txt){
  const top = M.municipios.filter(r => r[5]).sort((a, b) => (b[4] || 0) - (a[4] || 0)).slice(0, 12);
  ul.innerHTML = top.map(r => { const mj = Math.floor(r[5] / 2) + 1; return `<li><a href="#mun-${r[0]}" aria-label="${esc(`${r[1]}: ${r[5]} concejales, mayoría absoluta ${mj}`)}">${esc(r[1])}<small aria-hidden="true">${mj} de ${r[5]}</small></a></li>`; }).join('');
  const m23 = R && R.municipales && R.municipales['2023'];
  txt.textContent = `Los ${miles(M.municipios.length)} municipios con resultados y todas sus elecciones municipales desde 1979.${m23 ? ` En 2023 se eligieron ${miles(m23.concejales)} concejales.` : ''}`;
}

function calendarioInicio(G, ol){
  const c = (G && G.convocatoria) || {};
  const campana = c.campana || ['2026-11-13', '2026-11-27'];
  const items = [
    {ini: c.decreto_boe || '2026-10-06', t: 'Disolución de las Cortes'},
    {ini: campana[0], fin: campana[1], t: `Campaña electoral, hasta el ${+campana[1].slice(8)} de noviembre`},
    {ini: '2026-11-22', t: 'Cierra la encuesta de pactómetro.es, a las 20:00'},     // misma fecha que ENC.cierre
    {ini: '2026-11-28', t: 'Jornada de reflexión'},
    {ini: c.fecha_eleccion || '2026-11-29', t: 'Votación, de 9:00 a 20:00'},
    {ini: c.constitucion_cortes || '2026-12-23', t: 'Se constituyen las nuevas Cortes'},
  ];
  const dia = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const ahora = ahoraReal().getTime();
  const siguiente = items.findIndex(it => ahora < dia(it.ini).getTime());
  ol.innerHTML = items.map((it, i) => {
    const ini = dia(it.ini).getTime(), fin = dia(it.fin || it.ini).getTime() + 864e5;
    const nxt = items[i + 1] ? dia(items[i + 1].ini).getTime() : null;
    const estado = ahora >= fin ? 'past' : ahora >= ini ? 'past now' : i === siguiente ? 'next' : '';
    const f = nxt === null ? 0 : ahora >= nxt ? 100 : ahora <= ini ? 0 : 100 * (ahora - ini) / (nxt - ini);
    const hoy = nxt !== null && ahora > ini && ahora < nxt;
    const [, mm, dd] = it.ini.split('-').map(Number);
    const extra = estado.includes('now') ? ' (hoy)' : estado === 'next' ? ' (lo próximo)' : estado === 'past' ? ' (ya pasó)' : '';
    return `<li class="${estado}" style="--f:${f.toFixed(1)}%">${hoy ? '<span class="hoy" aria-hidden="true">Hoy</span>' : ''}<time datetime="${it.ini}">${dd} de ${MESES[mm - 1]}</time><span class="d">${esc(it.t)}<span class="vh">${extra}</span></span></li>`;
  }).join('');
}

// Buscador universal: Congreso, parlamentos, diputaciones, cabildos, consells, juntas y los 8.000 ayuntamientos.
let INDICE = null;
function indiceBusqueda(){
  if (INDICE) return INDICE;
  INDICE = Promise.all([load('municipios.json'), load('autonomicas.json'), load('locales.json')]).then(([M, A, L]) => {
    const limpio = s => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
    const out = [];
    const add = (o, extra) => { o.k = ' ' + limpio(o.label + ' ' + (extra || '')) + ' '; o.nk = limpio(o.label); o.nk2 = o.nk.replace(/^(a|o|as|os|la|las|el|los|les|els|l|lo|sa|ses|es) /, ''); out.push(o); };
    add({label: 'Congreso de los Diputados', sub: 'Cortes Generales, elecciones generales', href: '#congreso', tipo: 0, total: 350}, 'españa generales cortes');
    for (const [id, a] of Object.entries(A)){
      const e = a.elecciones[a.elecciones.length - 1];
      add({label: a.camara, sub: (id === 'ceuta' || id === 'melilla' ? 'Ciudad autónoma de ' : 'Parlamento autonómico, ') + a.n, href: '#auto-' + id, tipo: 1, total: e.escanos}, a.n + ' comunidad autonomia autonomicas');
    }
    const SUB = {dip: 'Diputación provincial', cab: 'Cabildo insular', con: 'Consell insular', jjgg: 'Juntas Generales'};
    for (const t of Object.keys(TIPOS)) for (const x of Object.values(L[TIPOS[t].k])){
      const ys = Object.keys(x.e).sort();
      add({label: nombreLocal(t, x), sub: SUB[t] + (t === 'dip' ? ', provincia de ' + x.n : ''), href: `#${t}-${x.id}`, tipo: 2, total: x.e[ys[ys.length - 1]].escanos}, x.n + (t === 'dip' ? ' provincia diputacion' : ' isla'));
    }
    for (const r of M.municipios) add({label: r[1], sub: 'Ayuntamiento, ' + M.provincias[r[2]], href: '#mun-' + r[0], tipo: 3, total: r[5], c: r[6], pob: r[4] || 0});
    return out;
  }).catch(e => { INDICE = null; throw e; });
  return INDICE;
}
function buscarInstituciones(idx, q){
  const nq = norm(q).replace(/[^a-z0-9]+/g, ' ').trim(); if (!nq) return [];
  const toks = nq.split(' '), out = [];
  for (const o of idx){
    let sc = 0, ok = true;
    for (const t of toks){
      if (o.k.includes(' ' + t)) sc += 2;
      else if (t.length > 2 && o.k.includes(t)) sc += .5;
      else { ok = false; break; }
    }
    if (!ok) continue;
    // how well the name itself matches, then how important the institution is (population for ayuntamientos)
    const nk = ' ' + o.nk + ' ', nk2 = ' ' + o.nk2 + ' ';     // nk2: without a leading article (A Coruña, Las Rozas, Sa Pobla)
    sc += o.nk === nq || o.nk2 === nq ? 10 : nk.startsWith(' ' + nq + ' ') || nk2.startsWith(' ' + nq + ' ') ? 6 : o.nk.startsWith(nq) || o.nk2.startsWith(nq) ? 5 : nk.includes(' ' + nq + ' ') ? 5 : nk.includes(' ' + nq) ? 3 : 1;
    sc += o.tipo === 3 ? .5 * Math.log10(o.pob + 10) : [3.2, 3, 2.6][o.tipo] + (o.k.includes(' ' + nq + ' ') ? 2 : 0);
    out.push([sc, o]);
  }
  out.sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label, 'es'));
  return out.slice(0, 8).map(x => x[1]);
}
function Buscador(form){
  const $q = form.querySelector('input'), $l = form.querySelector('[role="listbox"]'), $res = form.querySelector('[aria-live]');
  let idx = null, items = [], act = -1, tAviso = 0;
  const cargar = () => idx ? Promise.resolve(idx) : indiceBusqueda().then(x => (idx = x));
  const mayoria = o => o.c === 'C' ? 'concejo abierto' : o.total ? `mayoría absoluta: ${Math.floor(o.total / 2) + 1} de ${o.total}` : '';
  function abrir(){ $l.hidden = false; $q.setAttribute('aria-expanded', 'true'); }
  function cerrar(){ $l.hidden = true; $q.setAttribute('aria-expanded', 'false'); $q.removeAttribute('aria-activedescendant'); act = -1; }
  function marcar(){
    $l.querySelectorAll('.h-opt').forEach((li, i) => li.setAttribute('aria-selected', i === act));
    const li = act >= 0 && $l.querySelector('#h-op-' + act);
    if (li){ $q.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({block: 'nearest'}); } else $q.removeAttribute('aria-activedescendant');
  }
  const mensaje = t => `<li class="h-msg" role="option" aria-disabled="true" aria-selected="false">${t}</li>`;
  async function actualizar(){
    const q = $q.value.trim();
    if (!q){ cerrar(); $res.textContent = ''; return; }
    if (!idx){
      $l.innerHTML = mensaje('Cargando las instituciones…'); abrir();
      try { await cargar(); } catch(e){ $l.innerHTML = mensaje('No se pudo cargar el buscador. Recarga la página.'); return; }
      if ($q.value.trim() !== q) return;
    }
    items = buscarInstituciones(idx, q); act = -1;
    $l.innerHTML = items.length ? items.map((o, i) => `<li role="option" id="h-op-${i}" class="h-opt" aria-selected="false" data-i="${i}" aria-label="${esc(`${o.label}. ${o.sub}. ${mayoria(o)}`)}"><span class="t"><b>${esc(o.label)}</b><small>${esc(o.sub)}</small></span>${o.c === 'C' ? '<span class="mj">Concejo<br>abierto</span>' : o.total ? `<span class="mj"><strong>${Math.floor(o.total / 2) + 1}</strong>de ${o.total}</span>` : ''}</li>`).join('')
      : mensaje(`No encontramos «${esc(q)}». Prueba con otro nombre o sin tildes.`);
    abrir(); marcar();
    clearTimeout(tAviso);
    tAviso = setTimeout(() => { $res.textContent = items.length ? `${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}. Usa las flechas para elegir y Intro para abrir.` : 'Ningún resultado.'; }, 500);
  }
  function ir(o){ cerrar(); irA(o.href); }
  $q.addEventListener('input', actualizar);
  $q.addEventListener('focus', () => { cargar().catch(() => {}); if ($q.value.trim()) actualizar(); });
  $q.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp'){
      ev.preventDefault();
      if ($l.hidden){ actualizar(); return; }
      if (!items.length) return;
      act = ev.key === 'ArrowDown' ? (act + 1) % items.length : (act <= 0 ? items.length - 1 : act - 1);
      marcar();
    } else if (ev.key === 'Escape'){
      if (!$l.hidden){ ev.preventDefault(); cerrar(); } else if ($q.value){ ev.preventDefault(); $q.value = ''; $res.textContent = ''; }
    } else if (ev.key === 'Tab') cerrar();
  });
  $l.addEventListener('mousedown', ev => ev.preventDefault());
  $l.addEventListener('click', ev => { const li = ev.target.closest('.h-opt'); if (li) ir(items[+li.dataset.i]); });
  form.addEventListener('focusout', ev => { if (!form.contains(ev.relatedTarget)) cerrar(); });
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (act >= 0 && items[act]) return ir(items[act]);
    const q = $q.value.trim();
    if (!q){ $q.focus(); return; }
    try { await cargar(); } catch(e){ irA('ayuntamientos?q=' + encodeURIComponent(q)); return; }
    items = buscarInstituciones(idx, q);
    if (items.length) ir(items[0]); else irA('ayuntamientos?q=' + encodeURIComponent(q));
  });
  setTimeout(() => { if (form.isConnected) cargar().catch(() => {}); }, 1500);
}

/* ================================================================ vistas con contenido estático (provincias, programas, directo) */
// The static page already carries the full text (scripts/paginas.py); the app only adds what changes or needs data.
async function viewProvincia(p){
  const slot = app.querySelector('#prov-cis');
  if (!slot || enVedaSondeos()) return;
  const C = await load('cis.json').catch(() => null);
  const pr = C && C.proyeccion && C.proyeccion.provincias[p]; if (!pr) return;
  const filas = C.partidos.filter(x => pr.r[x.k]).map(x => [x.sig, x.nom, x.color, x.fam, null, pr.r[x.k]]).sort((a, b) => b[5] - a[5]);
  slot.innerHTML = `<div class="section"><div class="section-head"><h2>Con la última encuesta del CIS</h2>
    <p>Diputados que obtendría cada candidatura en ${esc(pr.n)} con la estimación de voto del <a href="${esc(C.estudio.url)}" target="_blank" rel="noopener">barómetro del CIS de ${esc(C.estudio.titulo.replace(/^Barómetro de /, ''))}<span class="vh"> (se abre en una pestaña nueva)</span></a> (estudio n.º ${C.estudio.numero}).
    Es una proyección de pactómetro.es, no un dato del CIS, que no estima escaños: se explica en el <a href="#congreso-simulador">simulador</a>.</p></div>
    ${resultsTable(filas, {unit: 'Diputados'})}</div>`;
}
async function viewProgramas(){}
// Noche electoral: escrutinio provisional que se actualiza solo. Datos: la pestaña «Directo» de la hoja de Google
// (Apps Script, ?directo=1) o, si no, /data/directo.json. Formato: {actualizado, escrutado, participacion, fuente,
// partidos: [{sig, nom?, esc, votos?, color?}]}.
const DIRECTO_DESDE = Date.parse('2026-11-29T19:00:00Z');   // 20:00 en la península: cierran los colegios
let relojDirecto = null;
const votosDirecto = new Map();                              // lo que marca quien mira, por candidatura, entre actualizaciones
function pararDirecto(){ if (relojDirecto){ clearTimeout(relojDirecto); relojDirecto = null; } }
const directoValido = D => D && Array.isArray(D.partidos) && D.partidos.some(p => +p.esc > 0);
async function datosDirecto(){
  const src = CFG.directoURL || (CFG.encuestaURL ? CFG.encuestaURL + (CFG.encuestaURL.includes('?') ? '&' : '?') + 'directo=1' : '');
  let D = null;
  if (src) D = await fetch(src, {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
  if (!directoValido(D)) D = await fetch('/data/directo.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
  return directoValido(D) ? D : null;
}
async function viewDirecto(){
  pararDirecto();
  if (ahoraReal().getTime() < DIRECTO_DESDE){
    app.insertAdjacentHTML('beforeend', `<div class="notice directo-aviso"><span class="date">29-N</span><p>Los resultados empezarán a aparecer aquí cuando cierren los colegios, a las 20:00 (hora peninsular) del domingo 29 de noviembre. Mientras tanto, puedes <a href="/congreso/simulador/">simular el resultado</a> o consultar el <a href="/29n/">calendario y cómo se reparten los escaños</a>.</p></div>`);
    return;
  }
  const [G, C] = await Promise.all([load('generales.json').catch(() => null), load('cis.json').catch(() => null)]);
  const color = {}, fam = {};
  const pon = (sig, c, f) => { const k = norm(niceSig(sig)); if (!color[k]){ color[k] = c; fam[k] = f; } };
  if (G) G.congreso['2023'].r.concat(G.disolucion.r).forEach(r => pon(r[0], r[2], r[3]));
  if (C) C.partidos.forEach(x => pon(x.sig, x.color, x.fam));
  pon('Frente Amplio', '#e5007e', 'sumar'); pon('SALF', '#5b4b8a', 'local');
  let ultimo = null, escAnunciado = null;
  const dibujar = D => {
    const partidos = D.partidos.filter(p => +p.esc > 0 || +p.votos > 0).map((p, i) => { const k = norm(niceSig(p.sig));
      return {id: 'd' + i, sig: String(p.sig), nom: String(p.nom || ''), color: /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : (color[k] || '#8a8f98'), fam: fam[k] || 'local', votos: +p.votos || null, esc: Math.max(0, +p.esc || 0)}; })
      .sort((a, b) => b.esc - a.esc || (b.votos || 0) - (a.votos || 0));
    const preset = {}; partidos.forEach(p => { const v = votosDirecto.get(norm(niceSig(p.sig))); if (v) preset[p.id] = v; });
    const esc_ = +D.escrutado || 0, hora = D.actualizado ? new Date(D.actualizado).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : '';
    const asignados = partidos.reduce((a, p) => a + p.esc, 0);
    app.innerHTML = `<div class="page-head"><span class="eyebrow">Elecciones generales · 29 de noviembre de 2026 · resultados provisionales</span><h1>Resultados del 29-N en directo</h1>
      <div class="directo-cifras"><div><b>${fmtPct(esc_)}</b><span>escrutado</span></div>${D.participacion ? `<div><b>${fmtPct(+D.participacion)}</b><span>participación</span></div>` : ''}<div><b>${asignados}</b><span>de 350 escaños asignados</span></div>${hora ? `<div><b>${hora}</b><span>última actualización</span></div>` : ''}</div>
      <p class="vh" id="directo-estado" aria-live="polite"></p></div>
      <div class="sheet pad" id="pacto-slot"></div>
      <p class="small muted">Fuente: ${esc(D.fuente || 'Ministerio del Interior, escrutinio provisional')}. Los resultados provisionales pueden cambiar con el escrutinio definitivo de las juntas electorales, que empieza el 4 de diciembre. La página se actualiza sola cada minuto.</p>`;
    app.querySelector('#pacto-slot').appendChild(Pactometro({total: 350, partidos, regla: 'congreso', preset, votosValidos: partidos.reduce((a, p) => a + (p.votos || 0), 0),
      alCambiar: m => { votosDirecto.clear(); m.forEach((v, k) => votosDirecto.set(k, v)); },
      exportar: {institucion: 'Congreso de los Diputados', eleccion: 'Elecciones generales del 29 de noviembre de 2026 · escrutinio provisional al ' + fmtPct(esc_), fecha: '2026-11-29', fuente: 'oficial', archivo: 'congreso-29n-provisional'},
      presetNota: 'Marca el voto de cada candidatura para probar mayorías: se mantiene aunque lleguen datos nuevos.'}));
    const estado = app.querySelector('#directo-estado');
    if (escAnunciado !== esc_){ estado.textContent = `Escrutado el ${fmtPct(esc_)}.`; escAnunciado = esc_; }
  };
  const ciclo = async () => {
    if (!document.body.contains(app) || rutaActual() !== 'directo') return;
    const D = await datosDirecto();
    if (D && D.actualizado + '|' + D.escrutado !== ultimo){ ultimo = D.actualizado + '|' + D.escrutado; dibujar(D); }
    else if (!D && ultimo === null){
      const est = app.querySelector('.directo-aviso') || (app.insertAdjacentHTML('beforeend', '<div class="notice directo-aviso"><span class="date">29-N</span><p aria-live="polite">Esperando los primeros datos del escrutinio. Esta página se actualiza sola cada minuto.</p></div>'), null);
    }
    relojDirecto = setTimeout(ciclo, 60000 + Math.floor(Math.random() * 15000));
  };
  await ciclo();
}

/* ================================================================ direcciones */
// Every view has a route key, as before ('mun-27028', 'congreso-simulador', 'comparar?s=…'), and a real address
// (/ayuntamiento/lugo/, /congreso/simulador/, /comparar/?s=…). Each address is a static page with its own title and
// text for search engines (scripts/build_dist.py); this script then draws the interactive view on top.
const SLUG_PROV = {"01": "alava", "02": "albacete", "03": "alicante", "04": "almeria", "05": "avila", "06": "badajoz", "07": "baleares", "08": "barcelona", "09": "burgos", "10": "caceres", "11": "cadiz", "12": "castellon", "13": "ciudad-real", "14": "cordoba", "15": "a-coruna", "16": "cuenca", "17": "girona", "18": "granada", "19": "guadalajara", "20": "gipuzkoa", "21": "huelva", "22": "huesca", "23": "jaen", "24": "leon", "25": "lleida", "26": "la-rioja", "27": "lugo", "28": "madrid", "29": "malaga", "30": "murcia", "31": "navarra", "32": "ourense", "33": "asturias", "34": "palencia", "35": "las-palmas", "36": "pontevedra", "37": "salamanca", "38": "santa-cruz-de-tenerife", "39": "cantabria", "40": "segovia", "41": "sevilla", "42": "soria", "43": "tarragona", "44": "teruel", "45": "toledo", "46": "valencia", "47": "valladolid", "48": "bizkaia", "49": "zamora", "50": "zaragoza", "51": "ceuta", "52": "melilla"};   // provincia → slug de su dirección; lo pone build_dist.py
const PROV_NOMBRE = {"01": "Araba/Álava", "02": "Albacete", "03": "Alicante/Alacant", "04": "Almería", "05": "Ávila", "06": "Badajoz", "07": "Illes Balears", "08": "Barcelona", "09": "Burgos", "10": "Cáceres", "11": "Cádiz", "12": "Castellón/Castelló", "13": "Ciudad Real", "14": "Córdoba", "15": "A Coruña", "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa", "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León", "25": "Lleida", "26": "La Rioja", "27": "Lugo", "28": "Madrid", "29": "Málaga", "30": "Murcia", "31": "Navarra", "32": "Ourense", "33": "Asturias", "34": "Palencia", "35": "Las Palmas", "36": "Pontevedra", "37": "Salamanca", "38": "Santa Cruz de Tenerife", "39": "Cantabria", "40": "Segovia", "41": "Sevilla", "42": "Soria", "43": "Tarragona", "44": "Teruel", "45": "Toledo", "46": "Valencia/València", "47": "Valladolid", "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza", "51": "Ceuta", "52": "Melilla"};
let MUN_SLUG = null;               // INE → slug (columna 7 de municipios.json en la web publicada)
function indexarSlugs(M){
  if (MUN_SLUG || !M || !Array.isArray(M.municipios)) return;
  MUN_SLUG = {}; M.municipios.forEach(r => { if (r[7]) MUN_SLUG[r[0]] = r[7]; });
  setTimeout(() => enlazar(document), 0);
}
const cargarSlugs = () => MUN_SLUG ? Promise.resolve() : load('municipios.json').then(() => {});
const LOCAL_URL = {dip: 'diputacion', cab: 'cabildo', con: 'consell', jjgg: 'juntas-generales'};
const PAG_FIJAS = {inicio: '/', congreso: '/congreso/', 'congreso-disolucion': '/congreso/disolucion/', 'congreso-simulador': '/congreso/simulador/',
  autonomias: '/autonomias/', locales: '/locales/', ayuntamientos: '/ayuntamientos/', historico: '/historico/', encuesta: '/encuesta/', 'encuesta-prueba': '/encuesta/?prueba=1',
  comparar: '/comparar/', '29n': '/29n/', programas: '/29n/programas/', directo: '/29n/resultados/', fuentes: '/fuentes/', 'aviso-legal': '/aviso-legal/',
  privacidad: '/privacidad/', cookies: '/cookies/'};
const esRuta = h => !!h && !/^(sec-|h-|app$|ck-|t-|enc-)/.test(h);   // anything else after # is an in-page anchor
// Route key → address (null if a municipality's address is not known yet)
function urlDe(h){
  h = String(h || '').replace(/^#/, '');
  if (!h) return '/';
  if (own(PAG_FIJAS, h)) return PAG_FIJAS[h];
  const el = v => v ? '?eleccion=' + encodeURIComponent(v) : '';
  const qs = () => '?' + h.split('?').slice(1).join('?');
  let m;
  if ((m = h.match(/^congreso-(\d{4}(?:-\d{2})?)$/))) return m[1] === '2023' ? '/congreso/' : `/congreso/${m[1]}/`;
  if ((m = h.match(/^auto-([a-z-]+?)(?:\.(\d{4}-\d{2}-\d{2}))?$/))) return `/parlamento/${m[1]}/${el(m[2])}`;
  if ((m = h.match(/^(dip|cab|con|jjgg)-([a-z0-9-]+?)(?:\.(\d{4}))?$/))) return `/${LOCAL_URL[m[1]]}/${m[1] === 'dip' ? (own(SLUG_PROV, m[2]) || m[2]) : m[2]}/${el(m[3])}`;
  if ((m = h.match(/^mun-(\d{5})(?:\.(\d{4}))?$/))) return MUN_SLUG && own(MUN_SLUG, m[1]) ? `/ayuntamiento/${MUN_SLUG[m[1]]}/${el(m[2])}` : null;
  if ((m = h.match(/^prov-(\d{2})$/))) return own(SLUG_PROV, m[1]) ? `/provincia/${SLUG_PROV[m[1]]}/` : null;
  if (h.startsWith('ayuntamientos?')) return '/ayuntamientos/' + qs();
  if (h.startsWith('comparar?')) return '/comparar/' + qs();
  return null;
}
// Address of this page → route key (each static page names its view in <body data-ruta>)
function rutaActual(){
  const base = document.body.dataset.ruta || '404';
  const p = new URLSearchParams(location.search), e = p.get('eleccion');
  if (/^(auto|dip|cab|con|jjgg|mun)-/.test(base) && e && /^\d{4}(-\d{2}-\d{2})?$/.test(e)) return base + '.' + e;
  if (base === 'ayuntamientos' && p.get('q')) return 'ayuntamientos?q=' + encodeURIComponent(p.get('q'));
  if (base === 'comparar' && location.search.length > 1) return 'comparar' + location.search;
  if (base === 'encuesta' && p.get('prueba') === '1') return 'encuesta-prueba';
  return base;
}
// Go to a view: same page with other options → no reload; another page → load it
async function irA(h, reemplazar){
  h = String(h || '').replace(/^#/, '');
  let u = urlDe(h);
  if (!u && /^mun-/.test(h)){ try { await cargarSlugs(); } catch(e){} u = urlDe(h); }
  if (!u){ if (reemplazar){ history.replaceState(null, '', location.pathname + location.search); return route(); } return; }
  const d = new URL(u, location.origin);
  if (d.pathname === location.pathname){
    history[reemplazar ? 'replaceState' : 'pushState'](null, '', d.pathname + d.search);
    return route();
  }
  if (reemplazar) location.replace(d.href); else location.assign(d.href);
}
// Links drawn with #ruta get their real address (so they can be opened in a new tab and followed by search engines)
let tEnlaces = 0;
function enlazar(root){
  root.querySelectorAll('a[href^="#"]').forEach(a => {
    const h = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!esRuta(h)) return;
    const u = urlDe(h); if (u) a.setAttribute('href', u);
  });
}
document.addEventListener('click', ev => {
  if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const a = ev.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (href.startsWith('#')){ const h = decodeURIComponent(href.slice(1)); if (esRuta(h)){ ev.preventDefault(); irA(h); } return; }
  const d = new URL(a.href, location.href);
  if (d.origin === location.origin && d.pathname === location.pathname && d.search !== location.search && !d.hash){
    ev.preventDefault(); history.pushState(null, '', d.pathname + d.search); route();
  }
});

/* ================================================================ router */
async function dispatch(h){
  let m;
  if (h === '404') return notFound();
  if (!h || h === 'inicio') return viewInicio();
  if (h === 'congreso'){ setTitle('Congreso'); return viewCongreso('2023'); }
  if (h === 'congreso-disolucion'){ setTitle('Congreso al disolverse'); return viewCongreso('disolucion'); }
  if (h === 'congreso-simulador'){ setTitle('Simulador 29-N'); return viewCongreso('simulador'); }
  if ((m = h.match(/^congreso-(\d{4}(?:-\d{2})?)$/))){ setTitle('Congreso ' + m[1]); return viewCongreso('hist', m[1]); }
  if (h === 'autonomias'){ setTitle('Autonomías'); return viewAutonomias(); }
  if ((m = h.match(/^auto-([a-z-]+?)(?:\.(\d{4}-\d{2}-\d{2}))?$/))) return viewAutonomia(m[1], m[2]);
  if (h === 'locales'){ setTitle('Diputaciones y cabildos'); return viewLocales(); }
  if ((m = h.match(/^(dip|cab|con|jjgg)-([a-z0-9-]+?)(?:\.(\d{4}))?$/))) return viewLocal(m[1], m[2], m[3]);
  if (h === 'ayuntamientos' || h.startsWith('ayuntamientos?')){ setTitle('Ayuntamientos'); return viewAyuntamientos(new URLSearchParams(h.split('?')[1] || '').get('q') || ''); }
  if ((m = h.match(/^mun-(\d{5})(?:\.(\d{4}))?$/))) return viewMunicipio(m[1], m[2]);
  if (h === 'historico'){ setTitle('Histórico'); return viewHistorico(); }
  if (h === 'encuesta' || h === 'encuesta-prueba'){ setTitle('Encuesta 29-N'); return viewEncuesta(h === 'encuesta-prueba'); }
  if (h === 'comparar' || h.startsWith('comparar?')) return viewComparar(h.slice(9));
  if (h === '29n') return view29N();
  if (h === 'fuentes'){ setTitle('Fuentes y metodología'); return viewFuentes(); }
  if ((m = h.match(/^prov-(\d{2})$/))) return viewProvincia(m[1]);
  if (h === 'programas'){ setTitle('Programas electorales del 29-N'); return viewProgramas(); }
  if (h === 'directo'){ setTitle('Resultados del 29-N en directo'); return viewDirecto(); }
  if (LEGAL_PAGS.some(x => x[0] === h)) return viewLegal(h);
  return notFound();
}
const NAV = {inicio: 'inicio', '29n': '29n', congreso: 'congreso', disolucion: 'congreso', simulador: 'congreso', auto: 'autonomias', autonomias: 'autonomias', locales: 'locales', dip: 'locales', cab: 'locales', con: 'locales', jjgg: 'locales', ayuntamientos: 'ayuntamientos', mun: 'ayuntamientos', historico: 'historico', comparar: 'comparar', fuentes: 'fuentes', aviso: 'fuentes', privacidad: 'fuentes', cookies: 'fuentes', encuesta: 'encuesta', programas: '29n', directo: '29n'};
const $mast = document.querySelector('.mast'), $menu = document.getElementById('menu-btn');
function cerrarMenu(){ $mast.classList.remove('open'); $menu.setAttribute('aria-expanded', 'false'); }
$menu.addEventListener('click', () => { const abrir = !$mast.classList.contains('open'); $mast.classList.toggle('open', abrir); $menu.setAttribute('aria-expanded', String(abrir)); });
document.getElementById('nav').addEventListener('click', ev => { if (ev.target.closest('a')) cerrarMenu(); });
document.getElementById('saltar').addEventListener('click', ev => { ev.preventDefault(); cerrarMenu(); app.focus(); });
document.getElementById('promo-x').addEventListener('click', () => { store.set(PROMO_KEY, hoyISO()); document.getElementById('promo').hidden = true; app.focus({preventScroll: true}); });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && $mast.classList.contains('open')){ cerrarMenu(); $menu.focus(); return; }
  // radio groups made of buttons (Sí / Abs. / No, métricas…): arrows move the choice, like native radios
  const b = ev.target.closest && ev.target.closest('[role="radiogroup"] > [role="radio"]'); if (!b) return;
  const d = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[ev.key]; if (!d) return;
  const all = [...b.parentElement.querySelectorAll(':scope > [role="radio"]:not(:disabled)')];
  const n = all[(all.indexOf(b) + d + all.length) % all.length];
  ev.preventDefault(); n.focus(); n.click();
});
// Tables and timelines wider than the screen scroll sideways: make them reachable and scrollable from the keyboard.
function marcarDesplazables(){
  app.querySelectorAll('.tablewrap, .tl-wrap').forEach(el => {
    const desborda = el.scrollWidth > el.clientWidth + 1;
    if (desborda && el.getAttribute('role') !== 'region'){
      // named after the closest heading before it (each scrolling region needs its own name)
      const h = [...app.querySelectorAll('h1, h2, h3, summary')].filter(x => x.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
      el.tabIndex = 0; el.setAttribute('role', 'region');
      const cap = el.querySelector('caption');
      el.setAttribute('aria-label', (cap ? cap.textContent.trim() : h ? h.textContent.trim() : 'Tabla de datos') + ' (se desplaza en horizontal)');
    } else if (!desborda && el.getAttribute('role') === 'region'){
      el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label');
    }
  });
}
let tDesplaza = 0;
const programarDesplazables = () => { clearTimeout(tDesplaza); tDesplaza = setTimeout(marcarDesplazables, 150); };
new MutationObserver(programarDesplazables).observe(app, {childList: true, subtree: true, attributes: true, attributeFilter: ['open']});
addEventListener('resize', programarDesplazables);
let lastHash = null, primeraVista = true;
async function route(){
  // an old address with # (pactometro.es/#encuesta, pactometro.es/#mun-27028): go to its own page
  const viejo = decodeURIComponent(location.hash.slice(1));
  if (esRuta(viejo)) return irA(viejo, true);
  const h = rutaActual();
  const key = NAV[(h || 'inicio').split(/[-.?]/)[0]] || '';
  document.querySelectorAll('.nav a').forEach(a => { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  cerrarMenu();
  hideTip();
  pararCuenta();
  pararDirecto();
  actualizarNavEncuesta();
  actualizarPromo(h);
  const sameView = lastHash !== null && (lastHash.split('.')[0] === h.split('.')[0] || (lastHash.startsWith('comparar') && h.startsWith('comparar')));
  lastHash = h;
  app.className = 'wrap';
  try { await dispatch(h); }
  catch(e){ app.className = 'wrap'; app.innerHTML = `<div class="error"><h1 class="h3" style="font-size:24px">No se pudieron cargar los datos</h1><p class="muted">${esc(e.message)}</p></div>`; }
  enlazar(document);
  const ancla = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (ancla) ancla.scrollIntoView();           // /29n/#sec-fuentes: the section exists only once the view is drawn
  else if (!sameView){
    window.scrollTo(0, 0);
    // after moving to another page, put keyboard and screen-reader focus on its title
    if (!primeraVista){ const t = app.querySelector('h1'); if (t){ t.tabIndex = -1; t.focus({preventScroll: true}); } else app.focus({preventScroll: true}); }
  }
  primeraVista = false;
}
// Aviso de cookies: Aceptar y Rechazar en la primera capa, con el mismo peso; Configurar abre las dos categorías.
const $ck = document.getElementById('ck');
let ckVolver = null;
function ajustarHuecoCk(){ document.body.style.paddingBottom = $ck.hidden ? '' : $ck.offsetHeight + 'px'; }
function abrirAvisoCookies(configurar, desde){
  ckVolver = desde || null;
  const c = leerConsentimiento();
  $ck.querySelector('#ck-pref').checked = !!(c && c.pref);
  $ck.classList.toggle('cfg', !!configurar);
  $ck.querySelector('#ck-cfg').hidden = !configurar;
  $ck.querySelector('[data-ck="guardar"]').hidden = !configurar;
  $ck.querySelector('[data-ck="cfg"]').hidden = !!configurar;
  $ck.querySelector('[data-ck="cfg"]').setAttribute('aria-expanded', String(!!configurar));
  $ck.hidden = false; ajustarHuecoCk();
  if (desde) $ck.querySelector(configurar ? '#ck-pref' : '#ck-t').focus();
}
function cerrarAvisoCookies(){
  const dentro = $ck.contains(document.activeElement);
  $ck.hidden = true; ajustarHuecoCk();
  if (ckVolver && ckVolver.isConnected) ckVolver.focus(); else if (dentro) app.focus({preventScroll: true});
  ckVolver = null;
  const est = document.getElementById('ck-estado'); if (est) est.textContent = textoConsentimiento();
}
function textoConsentimiento(){
  const c = leerConsentimiento();
  if (!c) return 'Todavía no has elegido: solo se guardan los datos necesarios.';
  const f = new Date(c.fecha).toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'});
  return c.pref ? `Aceptaste guardar tus preferencias el ${f}.` : `Rechazaste guardar tus preferencias el ${f}: solo se guardan los datos necesarios.`;
}
$ck.addEventListener('click', ev => {
  const b = ev.target.closest('[data-ck]'); if (!b) return;
  const a = b.dataset.ck;
  if (a === 'si' || a === 'no'){ guardarConsentimiento(a === 'si'); cerrarAvisoCookies(); }
  else if (a === 'guardar'){ guardarConsentimiento($ck.querySelector('#ck-pref').checked); cerrarAvisoCookies(); }
  else if (a === 'cfg'){ abrirAvisoCookies(true, ckVolver); $ck.querySelector('#ck-pref').focus(); }
});
document.addEventListener('click', ev => { const b = ev.target.closest('[data-ck-abrir]'); if (b) abrirAvisoCookies(true, b); });
if (window.ResizeObserver) new ResizeObserver(ajustarHuecoCk).observe($ck);
if (!leerConsentimiento()) abrirAvisoCookies(false);

window.addEventListener('hashchange', () => { const h = decodeURIComponent(location.hash.slice(1)); if (esRuta(h)) irA(h, true); });
window.addEventListener('popstate', route);
new MutationObserver(() => { clearTimeout(tEnlaces); tEnlaces = setTimeout(() => enlazar(document), 0); }).observe(document.body, {childList: true, subtree: true});
{ const up = document.getElementById('actualizado'); if (up) up.innerHTML = ` · Actualizado el <time datetime="${ACTUALIZADO_ISO}">${ACTUALIZADO}</time>`; }
Promise.all([load('resumen.json').then(R => { FAM = R.familias; }).catch(() => {}), sincronizarReloj()]).finally(route);
