/* pactómetro.es · widget para insertar en otras webs
   <iframe src="https://pactometro.es/widget/?i=mun-27028&si=PP,BNG" …></iframe>
   i  = vista: congreso, congreso-1982, congreso-disolucion, congreso-simulador, cis, directo, auto-galicia(.2020-07-12),
        dip-27 / cab-gran-canaria / con-mallorca / jjgg-bizkaia (.2023), mun-27028(.2019)
   si / abs = candidaturas que votan sí / se abstienen (separadas por comas)
   p  = escenario del simulador: sig~escaños~voto,…
   No usa cookies ni almacenamiento del navegador, ni envía datos a nadie. */
'use strict';
(() => {
const SLUG_PROV = {"01": "alava", "02": "albacete", "03": "alicante", "04": "almeria", "05": "avila", "06": "badajoz", "07": "baleares", "08": "barcelona", "09": "burgos", "10": "caceres", "11": "cadiz", "12": "castellon", "13": "ciudad-real", "14": "cordoba", "15": "a-coruna", "16": "cuenca", "17": "girona", "18": "granada", "19": "guadalajara", "20": "gipuzkoa", "21": "huelva", "22": "huesca", "23": "jaen", "24": "leon", "25": "lleida", "26": "la-rioja", "27": "lugo", "28": "madrid", "29": "malaga", "30": "murcia", "31": "navarra", "32": "ourense", "33": "asturias", "34": "palencia", "35": "las-palmas", "36": "pontevedra", "37": "salamanca", "38": "santa-cruz-de-tenerife", "39": "cantabria", "40": "segovia", "41": "sevilla", "42": "soria", "43": "tarragona", "44": "teruel", "45": "toledo", "46": "valencia", "47": "valladolid", "48": "bizkaia", "49": "zamora", "50": "zaragoza", "51": "ceuta", "52": "melilla"};
const CFG = window.PACTOMETRO_CONFIG || {};
const VEDA = ['2026-11-23T23:00:00Z', '2026-11-29T20:00:00Z'];   // art. 69.7 LOREG: sin encuestas del 24 al 29-N
const enVeda = () => Date.now() >= Date.parse(VEDA[0]) && Date.now() < Date.parse(VEDA[1]);
const SIG_FIX = {'PSDEG-PSOE': 'PSdeG-PSOE', 'CCA': 'CCa', 'CCA-PNC': 'CCa-PNC', 'MÉS': 'Més', 'GXF': 'GxF', 'EH BILDU': 'EH Bildu', 'JXCAT': 'JxCat', 'MXME': 'MxMe', 'VOX': 'Vox', 'SUMAR': 'Sumar'};
const DIP_NOMBRE = {'03': 'Diputación de Alicante', '12': 'Diputación de Castellón', '46': 'Diputación de Valencia', '17': 'Diputació de Girona', '25': 'Diputació de Lleida', '43': 'Diputació de Tarragona', '08': 'Diputació de Barcelona', '15': 'Deputación da Coruña', '27': 'Deputación de Lugo', '32': 'Deputación de Ourense', '36': 'Deputación de Pontevedra'};
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const $w = document.getElementById('w');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clave = s => norm(sig(s)).replace(/[^a-z0-9]+/g, '');
const fecha = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return d ? `${d} de ${MESES[m - 1]} de ${y}` : String(y); };
const fmtPct = x => x.toLocaleString('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' %';
function sig(s){
  s = String(s || '');
  if (SIG_FIX[s.toUpperCase()]) return SIG_FIX[s.toUpperCase()];
  if (/\s/.test(s) && s.length > 6 && s === s.toUpperCase()) return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  return s;
}
const cache = {};
const load = f => cache[f] || (cache[f] = fetch('/data/' + f).then(r => { if (!r.ok) throw new Error(f); return r.json(); }));
function lista(k){
  const par = location.search.slice(1).split('&').find(x => x.split('=')[0] === k);
  if (!par) return [];
  return par.split('=').slice(1).join('=').split(',').filter(Boolean).map(x => { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch(e){ return ''; } }).filter(Boolean);
}
const q = new URLSearchParams(location.search);
const ruta = (q.get('i') || 'congreso').slice(0, 60);
const SI = new Set(lista('si').map(clave)), ABS = new Set(lista('abs').map(clave));

// ---------------------------------------------------------------- seat layout (same as the site)
function seatLayout(n){
  const cap = N => { let t = 0; for (let i = 1; i <= N; i++) t += Math.floor(Math.PI / (2 * Math.asin(2 / (3 * N + 4 * i - 2)))); return t; };
  let rows = 1; while (cap(rows) < n) rows++;
  const total = cap(rows), rad = 0.4 / rows, pos = [];
  const arc = (J, R) => { if (J <= 0) return; if (J === 1){ pos.push([Math.PI / 2, R]); return; } for (let j = 0; j < J; j++) pos.push([j * (Math.PI - 2 * Math.sin(rad / R)) / (J - 1) + Math.sin(rad / R), R]); };
  for (let i = 1; i < rows; i++) arc(Math.floor(n / total * Math.PI / (2 * Math.asin(2 / (3 * rows + 4 * i - 2)))), (3 * rows + 4 * i - 2) / (4 * rows));
  arc(n - pos.length, (7 * rows - 2) / (4 * rows));
  pos.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
  return {pos, rad};
}

// ---------------------------------------------------------------- data for each view
async function datos(){
  let m;
  const extra = () => { const s = [...['si', 'abs', 'p']].map(k => { const par = location.search.slice(1).split('&').find(x => x.split('=')[0] === k); return par || ''; }).filter(Boolean).join('&'); return s ? '?' + s : ''; };
  if (ruta === 'directo'){
    if (Date.now() < Date.parse('2026-11-29T19:00:00Z')) return {vacio: 'Los resultados del 29-N aparecerán aquí cuando cierren los colegios, a las 20:00 (hora peninsular) del domingo 29 de noviembre.', enlace: '/29n/resultados/', titulo: 'Resultados del 29-N en directo'};
    const fuente = CFG.directoURL || (CFG.encuestaURL ? CFG.encuestaURL + '?directo=1' : '');
    let D = null;
    if (fuente) D = await fetch(fuente, {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!D || !Array.isArray(D.partidos) || !D.partidos.length) D = await fetch('/data/directo.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!D || !Array.isArray(D.partidos) || !D.partidos.length) return {vacio: 'Los resultados del 29-N aparecerán aquí a partir del cierre de los colegios, el domingo 29 de noviembre.', enlace: '/29n/resultados/', titulo: 'Resultados del 29-N en directo'};
    const G = await load('generales.json').catch(() => null);
    const col = {'frenteamplio': '#e5007e', 'salf': '#5b4b8a'}; if (G) G.congreso['2023'].r.concat(G.disolucion.r).forEach(r => { if (!col[clave(r[0])]) col[clave(r[0])] = r[2]; });
    return {titulo: 'Elecciones generales del 29-N · resultados provisionales', sub: `Escrutado el ${fmtPct(+D.escrutado || 0)}${D.actualizado ? ' · ' + new Date(D.actualizado).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) : ''}`,
      total: 350, rows: D.partidos.map(p => [p.sig, p.nom || '', p.color || col[clave(p.sig)] || '#8a8f98', '', p.votos || null, +p.esc || 0]), enlace: '/29n/resultados/' + extra(), fuente: D.fuente || 'Ministerio del Interior (escrutinio provisional)', directo: true};
  }
  if (ruta === 'cis' || (ruta === 'congreso-simulador' && !q.get('p'))){
    if (enVeda()) return {vacio: 'Del 24 al 28 de noviembre la ley prohíbe publicar encuestas electorales (art. 69.7 de la LOREG), y el día 29 hasta el cierre de los colegios.', enlace: '/congreso/simulador/', titulo: 'Simulador del 29-N'};
    const C = await load('cis.json');
    return {titulo: 'Congreso · proyección con el barómetro del CIS', sub: `${C.estudio.titulo} (estudio ${C.estudio.numero}). Escaños estimados por pactómetro.es: el CIS no estima escaños.`,
      total: 350, rows: C.partidos.filter(p => p.esc).map(p => [p.sig, p.nom, p.color, p.fam, null, p.esc]), enlace: '/congreso/simulador/' + extra(), fuente: 'CIS, estudio ' + C.estudio.numero + ' · proyección de pactómetro.es'};
  }
  if (ruta === 'congreso-simulador'){
    const G = await load('generales.json');
    const ref = {}; G.disolucion.r.concat(G.congreso['2023'].r).forEach(r => { if (!ref[clave(r[0])]) ref[clave(r[0])] = r; });
    const pal = ['#8d6e63', '#5c7a99', '#7e8f3a', '#8c6f8f', '#9e7a4a', '#5f8a8b'];
    const filas = lista('p').map(x => x.split('~')).filter(x => x[0]).slice(0, 40);
    filas.forEach(([s, , v]) => { if (v === 's') SI.add(clave(s)); else if (v === 'a') ABS.add(clave(s)); });
    return {titulo: 'Congreso de los Diputados · simulación para el 29-N', sub: 'Escenario hecho con el simulador de pactómetro.es: no es un resultado electoral ni una encuesta.',
      total: 350, rows: filas.map(([s, n], i) => { const r = ref[clave(s)]; return [r ? r[0] : s, r ? r[1] : '', r ? r[2] : pal[i % pal.length], r ? r[3] : 'local', null, Math.max(0, Math.min(350, parseInt(n, 10) || 0))]; }),
      enlace: '/congreso/simulador/' + extra(), fuente: 'Simulación de pactómetro.es'};
  }
  if (ruta === 'congreso-disolucion'){
    const G = await load('generales.json');
    return {titulo: 'Congreso de los Diputados', sub: 'Composición al disolverse las Cortes (octubre de 2026)', total: 350, rows: G.disolucion.r, enlace: '/congreso/disolucion/' + extra(), fuente: 'Composición recopilada de fuentes públicas'};
  }
  if (ruta === 'congreso' || (m = ruta.match(/^congreso-(\d{4}(?:-\d{2})?)$/))){
    const G = await load('generales.json'); const k = m ? m[1] : '2023'; const e = G.congreso[k]; if (!e) return null;
    return {titulo: 'Congreso de los Diputados', sub: 'Elecciones generales del ' + fecha(e.fecha), total: e.escanos || 350, rows: e.r, enlace: (k === '2023' ? '/congreso/' : `/congreso/${k}/`) + extra(), fuente: 'Ministerio del Interior'};
  }
  if ((m = ruta.match(/^auto-([a-z-]+?)(?:\.(\d{4}-\d{2}-\d{2}))?$/))){
    const A = await load('autonomicas.json'); const a = Object.prototype.hasOwnProperty.call(A, m[1]) ? A[m[1]] : null; if (!a) return null;
    const e = a.elecciones.find(x => x.fecha === m[2]) || a.elecciones[a.elecciones.length - 1];
    const ex = extra();
    return {titulo: a.camara, sub: 'Elecciones del ' + fecha(e.fecha), total: e.escanos, rows: e.r, enlace: `/parlamento/${m[1]}/` + (m[2] ? `?eleccion=${m[2]}` + (ex ? '&' + ex.slice(1) : '') : ex), fuente: e.fuente === 'compilada' ? 'Recopilado de fuentes públicas' : 'Datos oficiales'};
  }
  if ((m = ruta.match(/^(dip|cab|con|jjgg)-([a-z0-9-]+?)(?:\.(\d{4}))?$/))){
    const L = await load('locales.json'); const g = {dip: 'diputaciones', cab: 'cabildos', con: 'consells', jjgg: 'juntas'}[m[1]];
    const x = Object.prototype.hasOwnProperty.call(L[g], m[2]) ? L[g][m[2]] : null; if (!x) return null;
    const ys = Object.keys(x.e).sort(); const y = m[3] && x.e[m[3]] ? m[3] : ys[ys.length - 1]; const e = x.e[y];
    const nombre = m[1] === 'dip' ? (DIP_NOMBRE[x.id] || 'Diputación de ' + x.n.split('/')[0]) : m[1] === 'cab' ? 'Cabildo de ' + x.n : x.n;
    const base = {dip: 'diputacion', cab: 'cabildo', con: 'consell', jjgg: 'juntas-generales'}[m[1]], id = m[1] === 'dip' ? (SLUG_PROV[m[2]] || m[2]) : m[2];
    const ex = extra();
    return {titulo: nombre, sub: (m[1] === 'dip' ? 'Tras las elecciones municipales del ' : 'Elecciones del ') + fecha(e.fecha), total: e.escanos, rows: e.r,
      enlace: `/${base}/${id}/` + (m[3] ? `?eleccion=${m[3]}` + (ex ? '&' + ex.slice(1) : '') : ex), fuente: 'Ministerio del Interior'};
  }
  if ((m = ruta.match(/^mun-(\d{5})(?:\.(\d{4}))?$/))){
    const [M, P] = await Promise.all([load('municipios.json'), load('mun/' + m[1].slice(0, 2) + '.json')]);
    const mm = Object.prototype.hasOwnProperty.call(P.m, m[1]) ? P.m[m[1]] : null; if (!mm) return null;
    const ys = Object.keys(mm.e).sort(); const y = m[2] && mm.e[m[2]] ? m[2] : ys[ys.length - 1]; const rec = mm.e[y];
    const ix = M.municipios.find(r => r[0] === m[1]);
    const rows = rec[6].map(([ci, v, s]) => { const c = P.c[ci]; return [c[0], c[1], c[2], c[3], v, s]; });
    const ex = extra();
    return {titulo: 'Ayuntamiento de ' + mm.n, sub: `${M.provincias[m[1].slice(0, 2)]} · elecciones municipales de ${y}`, total: Math.max(rec[1], 1), rows, abierto: rec[0] === 'C',
      enlace: (ix && ix[7] ? `/ayuntamiento/${ix[7]}/` : '/ayuntamientos/') + (m[2] ? `?eleccion=${m[2]}` + (ex ? '&' + ex.slice(1) : '') : ex), fuente: 'Ministerio del Interior'};
  }
  return null;
}

// ---------------------------------------------------------------- drawing
function pintar(d){
  if (!d){ $w.innerHTML = '<p class="w-error">Este pactómetro no está disponible. <a href="https://pactometro.es/" target="_blank" rel="noopener">Ir a pactómetro.es</a></p>'; return; }
  const url = 'https://pactometro.es' + d.enlace;
  const cab = `<div class="w-head"><div><h1 class="w-t">${esc(d.titulo)}</h1>${d.sub ? `<p class="w-s">${esc(d.sub)}</p>` : ''}</div><a class="w-marca" href="https://pactometro.es/" target="_blank" rel="noopener">pactómetro.es<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> (se abre en una pestaña nueva)</span></a></div>`;
  if (d.vacio){ $w.innerHTML = cab + `<p class="w-cargando">${esc(d.vacio)}</p><div class="w-pie"><span></span><a href="${esc(url)}" target="_blank" rel="noopener">Abrir en pactómetro.es →</a></div>`; return avisarAltura(); }
  const total = d.total, maj = Math.floor(total / 2) + 1;
  const rows = d.rows.filter(r => r[5] > 0).slice().sort((a, b) => b[5] - a[5]);
  const voto = r => SI.has(clave(r[0])) ? 'si' : ABS.has(clave(r[0])) ? 'abs' : 'no';
  const hayCoal = rows.some(r => voto(r) !== 'no');
  const rank = {si: 0, abs: 1, no: 2};
  const orden = rows.slice().sort((a, b) => rank[voto(a)] - rank[voto(b)] || b[5] - a[5]);
  const si = rows.filter(r => voto(r) === 'si').reduce((a, r) => a + r[5], 0);
  const {pos, rad} = seatLayout(total);
  const cx = 180, cy = 178, S = 168 / 1.75, rr = Math.max(1.2, rad * S * 0.86);
  const seats = []; orden.forEach(r => { for (let k = 0; k < r[5]; k++) seats.push(r); });
  let svg = `<svg viewBox="0 0 360 200" role="img" aria-label="${esc(`${d.titulo}: ${rows.map(r => sig(r[0]) + ' ' + r[5]).join(', ')}. Mayoría absoluta: ${maj} de ${total}.`)}">`;
  // with a coalition: its seats in colour, abstentions in grey, the rest empty (as on the home page of the site)
  const relleno = r => !r ? 'var(--empty)' : !hayCoal ? r[2] : voto(r) === 'si' ? r[2] : voto(r) === 'abs' ? '#9aa5b5' : 'var(--empty)';
  pos.forEach(([a, R], i) => { const r = seats[i]; svg += `<circle cx="${(cx + R * Math.cos(a) * S).toFixed(2)}" cy="${(cy - R * Math.sin(a) * S).toFixed(2)}" r="${rr.toFixed(2)}" fill="${relleno(r)}"/>`; });
  if (!d.abierto && maj < pos.length){
    const a = (pos[maj - 1][0] + pos[maj][0]) / 2, R0 = Math.min(...pos.map(p => p[1])) - rad * 1.7, R1 = Math.max(...pos.map(p => p[1])) + rad * 1.9;
    svg += `<line x1="${(cx + R0 * Math.cos(a) * S).toFixed(1)}" y1="${(cy - R0 * Math.sin(a) * S).toFixed(1)}" x2="${(cx + R1 * Math.cos(a) * S).toFixed(1)}" y2="${(cy - R1 * Math.sin(a) * S).toFixed(1)}" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  const big = Math.min(46, Math.min(...pos.map(p => p[1])) * S * 0.62);
  svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="${big.toFixed(1)}" font-weight="700">${maj}</text><text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="9.5" fill="var(--muted)" style="letter-spacing:.12em">PARA LA MAYORÍA · ${total}</text></svg>`;
  const unidad = /^mun-/.test(ruta) ? 'concejales' : 'escaños';
  const fig = hayCoal
    ? `<span>Sí <b>${si}</b></span><span class="w-ver${si >= maj ? ' on' : ''}">${si >= maj ? 'Mayoría absoluta' : `Faltan ${maj - si}`}</span>`
    : `<span>Mayoría absoluta <b>${maj}</b> de ${total}</span>${rows[0] && rows[0][5] >= maj ? `<span class="w-ver on">${esc(sig(rows[0][0]))}, en solitario</span>` : ''}`;
  const ley = `<ul class="w-ley">${rows.map(r => `<li${hayCoal && voto(r) === 'no' ? ' class="fuera"' : ''}><i style="background:${r[2]}"></i>${esc(sig(r[0]))} ${r[5]}</li>`).join('')}</ul>`;
  $w.innerHTML = cab + `<div class="w-hemi">${svg}</div><div class="w-fig">${fig}</div>${ley}<div class="w-pie"><span>Fuente: ${esc(d.fuente)}${d.directo ? ' · se actualiza cada minuto' : ''}</span><a href="${esc(url)}" target="_blank" rel="noopener">Probar pactos en pactómetro.es →<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> (se abre en una pestaña nueva)</span></a></div>`;
  avisarAltura();
}
// the embedding page can listen to this to adjust the iframe height: {tipo: 'pactometro-altura', altura}
function avisarAltura(){ if (window.parent !== window) window.parent.postMessage({tipo: 'pactometro-altura', altura: document.documentElement.scrollHeight}, '*'); }
if (window.ResizeObserver) new ResizeObserver(avisarAltura).observe(document.documentElement);

async function iniciar(){
  try { pintar(await datos()); }
  catch(e){ console.error(e); $w.innerHTML = '<p class="w-error">No se pudieron cargar los datos. <a href="https://pactometro.es/" target="_blank" rel="noopener">Ir a pactómetro.es</a></p>'; }
}
iniciar();
if (ruta === 'directo' && Date.now() >= Date.parse('2026-11-29T15:00:00Z')) setInterval(iniciar, 60000 + Math.floor(Math.random() * 15000));
})();
