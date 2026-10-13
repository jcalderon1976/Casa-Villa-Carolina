export const KEY = 'villaCarolina.v1';

export const CATS = [
  'Adquisición',
  'Cierre / Legal',
  'Techo / Exterior',
  'Electricidad',
  'Cocina',
  'Baño',
  'Piso',
  'Puertas / Ventanas',
  'Herramientas / Equipo',
  'Misceláneos',
  'Tenencia (CRIM / luz / agua / seguro)',
];

export const TABS = {
  dash: 'Dashboard',
  gastos: 'Gastos',
  socios: 'Socios',
  docs: 'Documentos',
  fotos: 'Fotos',
  ajustes: 'Ajustes',
};

export const APP_ONLY = ['Adquisición', 'Cierre / Legal'];

let uid = 1;
const E = (cat, desc, vendor, receipt, total, date, jose, arnaldo, note, file, check) => ({
  id: uid++,
  cat,
  desc,
  vendor,
  receipt: receipt || '',
  total,
  date: date || '',
  jose: jose || 0,
  arnaldo: arnaldo || 0,
  note: note || '',
  file: file || '',
  check: check || '',
});

export const SEED = {
  settings: {
    salePrice: 260000,
    commissionPct: 5,
    sellerClosing: 3000,
    renoBudget: 25000,
    profitSplit: 'capital',
    targetRoi: 20,
  },
  expenses: [
    E('Adquisición', 'Precio de compra – cheque a vendedor (Enrique Rodríguez)', 'Banco Popular', '103114600016304', 71182, '2026-07-20', 71182, 0, 'Cheque oficial', 'Cheques Pago Total07272026.pdf'),
    E('Adquisición', 'Precio de compra – cheque a vendedora (Lissa Dávila)', 'Banco Popular', '103114600016302', 71182, '2026-07-20', 0, 71182, 'Cheque oficial', 'Cheques Pago Total07272026.pdf'),
    E('Adquisición', 'Factura legal parte vendedora (descontada del precio)', 'Lcda. Lesbia Hernández', '103114600016303', 2636, '2026-07-20', 0, 2636, 'Parte del precio de $150,000', 'Cheques Pago Total07272026.pdf'),
    E('Adquisición', 'Depósito de buena fe', '—', '', 5000, '2026-06-07', 2500, 2500, 'Parte del precio de $150,000', 'Contrato Compra y Venta Casa Villa Carolina06072026 (1).pdf', '¿Quién pagó el depósito? Se asumió 50/50 — corregir'),
    E('Cierre / Legal', 'Factura legal parte compradora (escritura, aranceles, CRIM)', 'Lcda. Lesbia Hernández', '', 1199.5, '2026-07-20', 599.75, 599.75, '', 'Factura y desglose de pago por gastos legales07272026.pdf', '¿Quién pagó? Se asumió 50/50 — corregir'),
    E('Cierre / Legal', 'Cargos de cheques oficiales (3 × $10)', 'Banco Popular', '', 30, '2026-07-20', 10, 20, '', 'Cheques Pago Total07272026.pdf'),
    E('Techo / Exterior', 'Sellado de techo / estucado / pintura / jardín', 'Jose', '', 4500, '', 1750, 2250, 'Restan $500'),
    E('Electricidad', 'Electricista', 'Rigo Electric', '', 1100, '2026-08-19', 550, 550, ''),
    E('Electricidad', 'Electricista (cotización, se restó del trabajo)', 'Rigo Electric', '', 98, '2026-08-27', 49, 49, 'Se pagó por cotización'),
    E('Cocina', 'Ebanistería – cotización', 'jbmProjectsPr', '', 150, '2026-08-20', 75, 75, 'Cotización muy alta'),
    E('Techo / Exterior', 'Materiales techo (Crossco 8500, Harris, pega)', 'Home Depot', 'C7LUN-PDG6U', 492.79, '2026-09-21', 246.39, 246.4, '', 'Home Depot $492.79  Sep 21 2026 eReceipt.pdf'),
    E('Herramientas / Equipo', 'Hammer Milwaukee (shipping)', 'Home Depot', 'DP3TP-THSC3', 348.95, '2026-08-29', 174.47, 174.48, 'Herramientas', 'Home Depot $348.95    Aug 29 2026 eReceipt.pdf'),
    E('Herramientas / Equipo', 'Wet Tile Saw', 'Home Depot', 'FX5FD-P71PL', 279.55, '2026-08-05', 139.77, 139.78, '', 'Home Depot 279.55    Aug 5  2026 - Tile Cutter-  eReceipt.pdf'),
    E('Puertas / Ventanas', '1 puerta – back patio', 'Luis Mercado', '', 400, '2026-09-23', 200, 200, '', '', 'Excel: depósito $200 pero Jose $200 + Arnaldo $200 = $400. Verificar'),
    E('Techo / Exterior', 'Renta máquina de presión (techo)', 'JD Equipment & Supply', '4KFHH9E8MQAEP', 116.5, '2026-09-09', 58.25, 58.25, ''),
    E('Cocina', 'Cocina – gabinetes/instalación', 'Dario', '1753', 4240, '2026-10-09', 1500, 740, 'Restan $2,000', 'planso de cocina lower.png'),
    E('Baño', 'Ducha baño pasillo y switch de luces', 'Home Depot', '', 492.79, '', 492.79, 0, '', 'Home Depot $193.10    Aug 1 2026 - Shower -  eReceipt.pdf', 'Mismo monto que la compra de techo del 21-sep ($492.79). ¿Duplicado? El recibo de ducha es $193.10'),
    E('Piso', 'Instalación de losas', 'Jose', '', 4000, '', 2000, 0, 'Restan $2,000'),
    E('Piso', 'Losas 24"×24"', 'Carolina Tile Outlet', '', 2892.31, '', 2892.31, 0, '1.69 ft² losa 24×24', 'losas 24 x 24 1.30 home depot.png'),
    E('Piso', 'Envío de losas (ATH Móvil)', 'Juan Acevedo – Carolina Tile Outlet', '', 250, '', 250, 0, ''),
    E('Piso', 'Bloques, pegas de losa, herramientas', 'Home Depot', 'U9UW5-TWY73', 210.87, '2026-09-30', 0, 210.87, '', 'Home Depot $210 Spet 30 2026 eReceipt.pdf'),
    E('Herramientas / Equipo', 'Renta máquina destapar desagües + disco 5" canaletas', 'JD Equipment & Supply', 'XZFRQAK19HR1R', 189.51, '2026-09-23', 189.51, 0, '', '', 'Excel muestra $169.97 pagado vs. total $189.51. Verificar'),
    E('Misceláneos', 'Angulares', 'Market China', '345242', 17.06, '2026-09-29', 17.06, 0, ''),
    E('Misceláneos', 'Ferretería – angulares', 'Pepito Food Market', 'C3202583', 51.41, '2026-09-28', 51.41, 0, ''),
    E('Electricidad', 'Tornillos y bases para receptáculos', 'National Lumber', '', 8.99, '2026-09-30', 8.99, 0, ''),
    E('Piso', 'Lash floor level clip', 'Home Depot', '8X4GH-HF2TV', 232.58, '2026-09-30', 232.58, 0, ''),
    E('Misceláneos', 'Door locks, goznes, pintura de bañera', 'Amazon', '', 257.33, '2026-10-07', 257.33, 0, '', '', 'Pago no registrado en Excel; se asumió pagado por Jose'),
    E('Baño', 'Ducha, sellador de techo, misceláneos', 'Home Depot', '', 411.64, '2026-10-07', 0, 411.64, '', 'Home Depot 411.64  Octubre 7 2026 -Shower-Sellado de Techo .pdf', 'Pago no registrado en Excel; se asumió pagado por Arnaldo'),
    E('Puertas / Ventanas', '11 ventanas – cocina, sala, frente', 'Javier – Ventanas', '', 3495, '', 0, 0, 'Pendiente'),
    E('Puertas / Ventanas', '2 fijos – frente', 'Air Master', '', 458, '', 0, 0, 'Pendiente'),
    E('Puertas / Ventanas', '2 puertas – cocina', 'Luis Mercado', '', 0, '', 0, 0, 'Falta cotización', '', 'Sin precio todavía'),
  ],
};

export const DOCS = [
  ['Compra / Legal', 'Contrato Compra y Venta Casa Villa Carolina06072026 (1).pdf', 'Contrato de compraventa (7 jun 2026)'],
  ['Compra / Legal', 'Contrato-firmado.pdf', 'Contrato firmado'],
  ['Compra / Legal', 'cuadre.pdf', 'Desglose de cheques del cierre'],
  ['Compra / Legal', 'Cheques Pago Total07272026.pdf', 'Cheques oficiales de pago'],
  ['Compra / Legal', 'Cheque Conpraventa 2.pdf', 'Cheque compraventa 2'],
  ['Compra / Legal', 'Factura y desglose de pago por gastos legales07272026.pdf', 'Factura legal parte compradora'],
  ['Compra / Legal', 'certificado de pago por gastos legales07272026.pdf', 'Certificado de pago gastos legales'],
  ['Compra / Legal', 'Complete_with_Docusign_Mutual_NDA_Orchids_Te.pdf', 'NDA mutuo (DocuSign)'],
  ['Tasación', 'Tasacion VillaCarolina.pdf', 'Tasación'],
  ['Recibos', 'Home Depot $193.10    Aug 1 2026 - Shower -  eReceipt.pdf', 'Home Depot $193.10 – Ducha (1 ago)'],
  ['Recibos', 'Home Depot 279.55    Aug 5  2026 - Tile Cutter-  eReceipt.pdf', 'Home Depot $279.55 – Tile saw (5 ago)'],
  ['Recibos', 'Home Depot $348.95    Aug 29 2026 eReceipt.pdf', 'Home Depot $348.95 (29 ago)'],
  ['Recibos', 'Home Depot $120.42 - Canceled   Aug 29 2026 eReceipt.pdf', 'Home Depot $120.42 – CANCELADO (29 ago)'],
  ['Recibos', 'Home Depot $492.79  Sep 21 2026 eReceipt.pdf', 'Home Depot $492.79 (21 sep)'],
  ['Recibos', 'Home Depot $210 Spet 30 2026 eReceipt.pdf', 'Home Depot $210.87 (30 sep)'],
  ['Recibos', 'Home Depot 411.64  Octubre 7 2026 -Shower-Sellado de Techo .pdf', 'Home Depot $411.64 – Ducha / sellador (7 oct)'],
  ['Recibos', 'Recibo 411.64 Home Depot 10-7-2026.png', 'Recibo $411.64 (imagen)'],
  ['Planos', 'plano.jpg', 'Plano de la casa'],
  ['Planos', 'planso de cocina lower.png', 'Plano gabinetes cocina'],
];

export const PHOTOS = [
  ['front view original.jpeg', 'Frente – original'],
  ['Fron View - Remodelado.jpeg', 'Frente – remodelado'],
  ['cocina original.jpeg', 'Cocina – original'],
  ['cocina remodelada.jpeg', 'Cocina – remodelada'],
  ['cocina remodelada 2.jpeg', 'Cocina – remodelada 2'],
  ['cocina remodelada 3.jpeg', 'Cocina – remodelada 3'],
  ['bano master.jpg', 'Baño master'],
  ['casa piso losa 12 x 12.jpg', 'Piso losa 12×12'],
  ['casa piso losa 24 x 24.png', 'Piso losa 24×24 (render)'],
  ['losas 24 x 24 1.30 home depot.png', 'Losa 24×24 Home Depot'],
  ['Problema de luz.jpg', 'Problema de luz'],
  ['plano.jpg', 'Plano'],
];

export const CATKW = {
  Piso: /TILE|LOSA|THINSET|GROUT|PEGA|LEVEL(ING)? CLIP|FLOOR|PISO|MORTAR/,
  Baño: /SHOWER|DUCHA|TOILET|INODORO|FAUCET|LAVAMANOS|BAÑ|BATH|VANITY|TUB/,
  'Techo / Exterior': /ROOF|TECHO|SEAL|SELLA|PAINT|PINTURA|STUCCO|ESTUC|GUTTER|CANALETA|PRESSURE|PRESION|COAT/,
  Electricidad: /WIRE|CABLE|BREAKER|OUTLET|RECEPT|SWITCH|BULB|LIGHT|ELECTRIC|GFCI|CONDUIT/,
  Cocina: /CABINET|GABINETE|COUNTER|SINK|FREGADERO|KITCHEN|COCINA|ESTUFA/,
  'Puertas / Ventanas': /DOOR|PUERTA|WINDOW|VENTANA|HINGE|GOZNE|LOCK|CERRADURA/,
  'Herramientas / Equipo': /DRILL|TALADRO|SAW|SIERRA|HAMMER|MARTILLO|\bBITS?\b|BLADE|DISCO|RENTAL|RENTA|ALQUILER|MILWAUKEE|\bMKE\b|DEWALT|RYOBI|TOOL/,
};

export function guessCat(text) {
  const U = String(text || '').toUpperCase();
  let best = ['Misceláneos', 0];
  for (const [cat, re] of Object.entries(CATKW)) {
    const n = (U.match(new RegExp(re.source, 'g')) || []).length;
    if (n > best[1]) best = [cat, n];
  }
  return best[0];
}

export function fileHref(name) {
  if (!name) return '';
  return '/' + encodeURI(name).replace(/#/g, '%23');
}

export function blankExpense() {
  return {
    id: 0,
    cat: 'Misceláneos',
    desc: '',
    vendor: '',
    receipt: '',
    total: 0,
    date: new Date().toISOString().slice(0, 10),
    jose: 0,
    arnaldo: 0,
    note: '',
    file: '',
    check: '',
  };
}
