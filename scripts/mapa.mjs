// Mapa de pactómetro.es: límites de municipios, provincias y comunidades ya proyectados (cónica conforme de España,
// con Canarias al lado de la península) y simplificados, en un TopoJSON ligero que la web dibuja sin bibliotecas.
//
// Fuente: es-atlas 0.6.0 (Martín González, MIT), generado a partir del Equipamiento Geográfico de Referencia
// Nacional del Instituto Geográfico Nacional (CC BY 4.0, ign.es).
//
// Salida (site/data/mapa/):
//   espana.json      comunidades, provincias, islas de Baleares y Canarias, fronteras interiores y el marco de Canarias
//   municipios.json  además, los municipios (vista de ayuntamientos)
// Coordenadas en píxeles de un lienzo de 1000 de ancho, cuantizadas a 0,1 px y codificadas como diferencias.
// Canarias va en un recuadro a la izquierda de Andalucía (no debajo, como en d3-composite-projections).
//
// Preparación (una vez), en una carpeta de trabajo:
//   npm i es-atlas@0.6.0 d3-geo@3 d3-composite-projections@2.0.0 topojson-client@3 topojson-simplify@3
//   cp node_modules/d3-composite-projections/d3-composite-projections.js composite.cjs
//   (el paquete ESM de d3-composite-projections importa sin extensión y Node no lo carga; su versión UMD sí)
// Uso: MAPA_BUILD=/ruta/a/esa/carpeta SITE=/ruta/a/site node scripts/mapa.mjs
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
const BUILD = process.env.MAPA_BUILD || '/home/claude/mapa-build', SITE = process.env.SITE || '/home/claude/site';
const require = createRequire(path.join(BUILD, 'package.json'));
const {geoConicConformalSpain} = require(path.join(BUILD, 'composite.cjs'));   // UMD bundle of d3-composite-projections 2.0.0 (BSD-3)
const topojson = require('topojson-client');
const {presimplify, simplify} = require('topojson-simplify');

const es = JSON.parse(fs.readFileSync(path.join(BUILD, 'node_modules/es-atlas/es/municipalities.json'), 'utf8'));
const M = JSON.parse(fs.readFileSync(path.join(SITE, 'data/municipios.json'), 'utf8'));
const OUT = path.join(SITE, 'data/mapa');
const W = 1000;

// ---------------------------------------------------------------- projection fitted to Spain (without Gibraltar)
const sinGib = g => !String(g.id).startsWith('54');
const provGeo = topojson.feature(es, {type: 'GeometryCollection', geometries: es.objects.provinces.geometries.filter(sinGib)});
const d3geo = require('d3-geo');
const proj = geoConicConformalSpain().fitExtent([[10, 10], [W - 10, 4000]], provGeo);
{ const b = d3geo.geoPath(proj).bounds(provGeo); proj.translate([proj.translate()[0], proj.translate()[1] - (b[0][1] - 10)]); }   // fitExtent centres vertically: move to the top

// ---------------------------------------------------------------- arcs → absolute lon/lat → pixels
const {scale: [sx, sy], translate: [tx, ty]} = es.transform;
let nulos = 0;
const canaria = [];   // arc → is it in the Canary Islands
const arcos = es.arcs.map((arc, i) => { let x = 0, y = 0; return arc.map(([dx, dy], j) => { x += dx; y += dy; const lon = x * sx + tx, lat = y * sy + ty; if (!j) canaria[i] = lon < -12.5 && lat < 30.5; const p = proj([lon, lat]); if (!p) nulos++; return p || [NaN, NaN]; }); });
if (nulos) console.warn('puntos fuera de la proyección:', nulos);

// ---------------------------------------------------------------- Canary Islands beside the peninsula
// d3-composite-projections puts them below Andalusia. Moved up into the Atlantic, left of Huelva and level with the
// southern coast, the map is about a fifth shorter; then everything is scaled again to fill the width.
let marcoPts;
{
  const usados = new Set();
  for (const g of es.objects.provinces.geometries.filter(sinGib)) for (const a of (g.type === 'Polygon' ? g.arcs.flat() : g.arcs.flat(2))) usados.add(a < 0 ? ~a : a);
  const pen = [...usados].filter(i => !canaria[i]).flatMap(i => arcos[i]);
  const can = arcos.filter((a, i) => canaria[i]).flat();
  const cx0 = Math.min(...can.map(p => p[0])), cx1 = Math.max(...can.map(p => p[0])), cy0 = Math.min(...can.map(p => p[1])), cy1 = Math.max(...can.map(p => p[1]));
  const MARGEN = 14, penBottom = Math.max(...pen.map(p => p[1]));
  const dy = penBottom - (cy1 + MARGEN), arriba = cy0 - MARGEN + dy;                     // box bottom level with the southernmost point
  const oeste = Math.min(...pen.filter(p => p[1] >= arriba - 10 && p[1] <= penBottom).map(p => p[0]));
  const dx = oeste - 22 - (cx1 + MARGEN);                                                  // and 22 px left of the peninsula
  for (let i = 0; i < arcos.length; i++) if (canaria[i]) arcos[i] = arcos[i].map(([x, y]) => [x + dx, y + dy]);   // every arc: municipal ones too
  marcoPts = [[cx0 - MARGEN + dx, arriba], [cx1 + MARGEN + dx, arriba], [cx1 + MARGEN + dx, penBottom]];   // top and right sides of the box
  const todos = arcos.flat().filter(p => isFinite(p[0])).concat(marcoPts);
  const x0 = Math.min(...todos.map(p => p[0])), y0 = Math.min(...todos.map(p => p[1])), x1 = Math.max(...todos.map(p => p[0]));
  const s = (W - 20) / (x1 - x0), ajustar = ([x, y]) => [(x - x0) * s + 10, (y - y0) * s + 10];
  for (let i = 0; i < arcos.length; i++) arcos[i] = arcos[i].map(ajustar);
  marcoPts = marcoPts.map(ajustar);
  console.log('Canarias movidas', dx.toFixed(1), dy.toFixed(1), '· escala ×' + s.toFixed(3));
}

// a topology in pixel space (no transform), so topojson-simplify can work with planar areas
const topo = {
  type: 'Topology',
  arcs: arcos,
  objects: {
    municipios: {type: 'GeometryCollection', geometries: es.objects.municipalities.geometries.filter(sinGib).map(g => ({type: g.type, arcs: g.arcs, id: g.id, properties: {n: g.properties.name}}))},
    provincias: {type: 'GeometryCollection', geometries: es.objects.provinces.geometries.filter(sinGib).map(g => ({type: g.type, arcs: g.arcs, id: g.id}))},
  },
};
// simplification: drop points whose triangle is smaller than 0.04 px² (invisible at 1:1, slightly visible at 6×)
const pre = presimplify(topo);
const simp = simplify(pre, 0.04);

// ---------------------------------------------------------------- communities = provinces merged with the site's own codes
const provCcaa = M.prov_ccaa;
const porCa = {};
for (const g of simp.objects.provincias.geometries) (porCa[provCcaa[g.id]] = porCa[provCcaa[g.id]] || []).push(g);
simp.objects.comunidades = {type: 'GeometryCollection', geometries: Object.entries(porCa).map(([ca, gs]) => ({...topojson.mergeArcs(simp, gs), id: ca}))};

// islands of the Balearic and Canary Islands (their cabildos and consells take the place of a diputación): each
// municipality goes to the island whose reference point is closest to its centre; the counts are checked below
const ISLAS = {mallorca: [2.98, 39.62], menorca: [4.10, 39.95], eivissa: [1.43, 38.98], formentera: [1.47, 38.70],
  'gran-canaria': [-15.60, 27.95], tenerife: [-16.60, 28.27], lanzarote: [-13.62, 29.03], fuerteventura: [-14.02, 28.40],
  'la-palma': [-17.86, 28.68], 'la-gomera': [-17.23, 28.11], 'el-hierro': [-18.00, 27.74]};
const MUNICIPIOS_ISLA = {mallorca: 53, menorca: 8, eivissa: 5, formentera: 1, 'gran-canaria': 21, tenerife: 31, lanzarote: 7, fuerteventura: 6, 'la-palma': 14, 'la-gomera': 6, 'el-hierro': 3};
{
  const porIsla = {};
  for (const g of simp.objects.municipios.geometries){
    const p = String(g.id).slice(0, 2); if (!['07', '35', '38'].includes(p)) continue;
    const c = d3geo.geoCentroid(topojson.feature(es, es.objects.municipalities.geometries.find(x => x.id === g.id)));
    const cand = Object.entries(ISLAS).filter(([k]) => (p === '07') === ['mallorca', 'menorca', 'eivissa', 'formentera'].includes(k));
    const [isla] = cand.map(([k, q]) => [k, (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2]).sort((a, b) => a[1] - b[1])[0];
    (porIsla[isla] = porIsla[isla] || []).push(g);
  }
  for (const [k, n] of Object.entries(MUNICIPIOS_ISLA)) if ((porIsla[k] || []).length !== n) console.warn('isla', k, 'municipios', (porIsla[k] || []).length, 'esperados', n);
  simp.objects.islas = {type: 'GeometryCollection', geometries: Object.entries(porIsla).map(([k, gs]) => ({...topojson.mergeArcs(simp, gs), id: k}))};
}

// interior borders: arcs shared by two different provinces / communities
function frontera(obj){
  const uso = new Map();
  const arcsDe = g => g.type === 'Polygon' ? g.arcs.flat() : g.type === 'MultiPolygon' ? g.arcs.flat(2) : [];
  for (const g of obj.geometries) for (const a of arcsDe(g)){ const i = a < 0 ? ~a : a; if (!uso.has(i)) uso.set(i, new Set()); uso.get(i).add(g.id); }
  return {type: 'MultiLineString', arcs: [...uso].filter(([, s]) => s.size > 1).map(([i]) => [i])};
}
simp.objects.borde_prov = frontera(simp.objects.provincias);
simp.objects.borde_ccaa = frontera(simp.objects.comunidades);

// ---------------------------------------------------------------- write a compact file with only the arcs it uses
// Format (read by app.js, mapaDecodificar):
//   {ancho, alto, q, marco, fuente, arcos: [[x0, y0, dx1, dy1, …], …],      coordinates × q, first point absolute
//    capas: {nombre: {ids: […], g: [[[[arco, …] anillo, …] polígono, …] geometría, …]} | [arco, …] (líneas)},
//    nombres: {id: nombre}}                                                  only areas without municipal data
const enDatos = new Set(M.municipios.map(r => r[0]));
function escribir(nombre, capas, extra){
  const usados = new Map(), nuevos = [];
  const remap = a => { const i = a < 0 ? ~a : a; if (!usados.has(i)){ usados.set(i, nuevos.length); nuevos.push(simp.arcs[i]); } const j = usados.get(i); return a < 0 ? ~j : j; };
  const poligonos = g => g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  const out = {};
  for (const k of capas){
    const o = simp.objects[k];
    if (o.type === 'GeometryCollection') out[k] = {ids: o.geometries.map(g => String(g.id)), g: o.geometries.map(g => poligonos(g).map(p => p.map(r => r.map(remap))))};
    else out[k] = o.arcs.map(r => remap(r[0]));
  }
  const Q = 10;
  const arcos = nuevos.map(arc => {
    const flat = []; let px = 0, py = 0, prev = null;
    for (const p of arc){ const x = Math.round(p[0] * Q), y = Math.round(p[1] * Q); if (prev && prev[0] === x && prev[1] === y) continue; flat.push(x - px, y - py); px = x; py = y; prev = [x, y]; }
    if (flat.length < 4) flat.push(0, 0);
    return flat;
  });
  const nombres = {};
  if (capas.includes('municipios')) for (const g of simp.objects.municipios.geometries) if (!enDatos.has(String(g.id))) nombres[g.id] = g.properties.n;
  const s = JSON.stringify({...extra, q: Q, arcos, capas: out, nombres});
  fs.writeFileSync(path.join(OUT, nombre), s);
  console.log(nombre, (s.length / 1024).toFixed(0) + ' KB', 'arcos', arcos.length, 'puntos', arcos.reduce((a, x) => a + x.length / 2, 0));
}
fs.mkdirSync(OUT, {recursive: true});
let maxY = 0; for (const a of simp.arcs) for (const p of a) if (isFinite(p[1]) && p[1] > maxY) maxY = p[1];
// the Canary Islands frame, in the same units as the arcs (× 10)
const marco = 'M' + marcoPts.map(([x, y]) => Math.round(x * 10) + ',' + Math.round(y * 10)).join('L');
const meta = {ancho: W, alto: Math.ceil(maxY + 10), marco, fuente: 'Instituto Geográfico Nacional (CC BY 4.0), vía es-atlas'};
escribir('espana.json', ['comunidades', 'provincias', 'islas', 'borde_prov', 'borde_ccaa'], meta);
escribir('municipios.json', ['municipios', 'provincias', 'comunidades', 'borde_prov', 'borde_ccaa'], meta);
