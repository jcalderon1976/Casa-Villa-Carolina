import { APP_ONLY, CATS, KEY, guessCat } from '../data';
import { download } from './backup';
import { idb } from './idb';

const PS = 'Proyeccion';
const XR = 'Resumen (App)';
const OLD = 'Gastos (App)';
const BKEY = KEY + '.base2';
const PX = ['date', 'cat', 'desc', 'vendor', 'receipt', 'total', 'jose', 'arnaldo', 'note'];
const NUM = ['total', 'jose', 'arnaldo'];
const SETK = [
  ['salePrice', 'Precio de venta meta ($)'],
  ['commissionPct', 'Comisión corredor (%)'],
  ['sellerClosing', 'Gastos de cierre del vendedor ($)'],
  ['renoBudget', 'Presupuesto remodelación ($)'],
  ['targetRoi', 'ROI meta (%)'],
  ['profitSplit', 'Repartir ganancia (capital o 50/50)'],
];

const synced = (expense) => !APP_ONLY.includes(expense.cat);
const hasFS = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

const getBase = () => {
  try {
    return JSON.parse(localStorage.getItem(BKEY));
  } catch {
    return null;
  }
};
const setBase = (base) => {
  try {
    if (base) localStorage.setItem(BKEY, JSON.stringify(base));
    else localStorage.removeItem(BKEY);
  } catch {
    /* se ignora */
  }
};
const norm = (expense) => {
  const out = {};
  for (const key of PX) {
    const value = expense[key];
    out[key] = NUM.includes(key) ? Math.round((+value || 0) * 100) / 100 : String(value ?? '').trim();
  }
  return out;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pick = (row) => Object.fromEntries(PX.map((key) => [key, row[key]]));
const snapEx = (list) => Object.fromEntries(list.filter(synced).map((expense) => [expense.id, norm(expense)]));
const exEq = (a, b) => {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((key) => b[key] && same(a[key], b[key]));
};
const stEq = (a, b) => SETK.every(([key]) => String(a?.[key]) === String(b?.[key]));
const colL = (n) => (n > 26 ? String.fromCharCode(64 + Math.floor((n - 1) / 26)) : '') + String.fromCharCode(65 + ((n - 1) % 26));

function cv(cell) {
  let value = cell.value;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if ('result' in value) value = value.result;
    else if (value.richText) value = value.richText.map((part) => part.text).join('');
    else if ('text' in value) value = value.text;
    else value = null;
  }
  return value;
}

const toDate = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  value = String(value ?? '').trim();
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  return match ? `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}` : value;
};

function layout(ws) {
  let hr = 0;
  ws.eachRow((row, n) => {
    if (!hr && /^total$/i.test(String(cv(row.getCell(2)) ?? '').trim())) hr = n;
  });
  if (!hr) throw new Error('No encontré el encabezado "Total" en la hoja Proyeccion');
  const header = ws.getRow(hr);
  const C = { desc: 1 };
  let maxc = 1;
  header.eachCell((cell, i) => {
    maxc = Math.max(maxc, i);
    const t = String(cv(cell) ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const key =
      t === 'total'
        ? 'total'
        : t === 'tienda'
          ? 'vendor'
          : t === 'recibo'
            ? 'receipt'
            : t.startsWith('deposito')
              ? 'paid'
              : t === 'restante'
                ? 'rest'
                : t === 'pago'
                  ? 'flag'
                  : t.startsWith('quien pag')
                    ? 'who'
                    : t.includes('calderon')
                      ? 'jose'
                      : t.includes('aponte')
                        ? 'arnaldo'
                        : t === 'fecha'
                          ? 'date'
                          : t === 'comentario'
                            ? 'note'
                            : t === 'categoria'
                              ? 'cat'
                              : t === 'id app'
                                ? 'id'
                                : null;
    if (key && !C[key]) C[key] = i;
  });
  for (const [key, label] of [
    ['cat', 'Categoría'],
    ['id', 'ID App'],
  ]) {
    if (!C[key]) {
      C[key] = ++maxc;
      const cell = header.getCell(C[key]);
      cell.value = label;
      cell.style = JSON.parse(JSON.stringify(header.getCell(C.note || C.total).style || {}));
    }
  }
  let tr = 0;
  for (let n = hr + 1; n <= ws.rowCount && !tr; n++) {
    if (/^SUM\(/i.test(ws.getRow(n).getCell(C.total).formula || '')) tr = n;
  }
  return { hr, tr: tr || ws.rowCount + 1, C, maxc };
}

function readPro(wb) {
  const ws = wb.getWorksheet(PS);
  if (!ws) return null;
  const L = layout(ws);
  const rows = [];
  for (let n = L.hr + 1; n < L.tr; n++) {
    const row = ws.getRow(n);
    const g = (key) => (L.C[key] ? cv(row.getCell(L.C[key])) : null);
    const item = {
      row: n,
      id: Math.round(+g('id')) || 0,
      desc: String(g('desc') ?? '').trim(),
      total: +g('total') || 0,
      jose: +g('jose') || 0,
      arnaldo: +g('arnaldo') || 0,
      date: toDate(g('date')),
    };
    ['vendor', 'receipt', 'note', 'cat'].forEach((key) => {
      item[key] = String(g(key) ?? '').trim();
    });
    if (!item.desc && !item.total) continue;
    item.raw = { jose: item.jose, arnaldo: item.arnaldo };
    const dep = +g('paid') || 0;
    const extra = Math.round((dep - item.jose - item.arnaldo) * 100) / 100;
    if (extra > 0) {
      const who = String(g('who') ?? '').toLowerCase();
      const byJose = /calder|jose|javier/.test(who);
      const byArnaldo = /aponte|arnaldo/.test(who);
      if ((byJose && byArnaldo) || (!byJose && !byArnaldo)) {
        const half = Math.round(extra * 50) / 100;
        item.jose += half;
        item.arnaldo += extra - half;
      } else if (byArnaldo) item.arnaldo += extra;
      else item.jose += extra;
      item.adj = true;
    }
    if (!CATS.includes(item.cat)) item.cat = '';
    item.noCat = !item.cat;
    rows.push(item);
  }
  const st = {};
  const acq = {};
  const rs = wb.getWorksheet(XR);
  if (rs) {
    rs.eachRow((row) => {
      const key = String(cv(row.getCell(3)) ?? '').trim();
      const value = cv(row.getCell(2));
      if (SETK.some((entry) => entry[0] === key)) st[key] = key === 'profitSplit' ? (String(value).includes('50') ? '50' : 'capital') : +value || 0;
      else if (key) acq[key] = +value || 0;
    });
  }
  return { ws, L, rows, st: rs ? st : null, acq };
}

function mergeInto(state, x, base) {
  const S = { settings: { ...state.settings }, expenses: state.expenses.map((expense) => ({ ...expense })) };
  const report = { fromX: 0, added: 0, deleted: 0, conf: [] };
  const app = S.expenses.filter(synced);
  const A = new Map(app.map((expense) => [expense.id, expense]));
  const freeId = (id) => id && !S.expenses.some((expense) => expense.id === id && !synced(expense));
  let uid = Math.max(0, ...S.expenses.map((expense) => expense.id), ...x.rows.map((row) => row.id)) + 1;

  if (!base) {
    const used = new Set();
    const find = (fn) => app.find((expense) => !used.has(expense.id) && fn(expense));
    const key = (s) => String(s || '').toLowerCase().replace(/\W/g, '');
    let maxId = Math.max(0, ...S.expenses.map((expense) => expense.id), ...x.rows.map((row) => row.id));
    const outIds = new Set();
    const out = x.rows.map((row) => {
      const match =
        (row.id && !used.has(row.id) && A.get(row.id)) ||
        (row.receipt && find((expense) => key(expense.receipt) === key(row.receipt))) ||
        find((expense) => Math.abs(expense.total - row.total) < 0.005 && row.total) ||
        find((expense) => key(expense.vendor) && key(expense.vendor) === key(row.vendor));
      if (match) used.add(match.id);
      const expense = {
        check: '',
        file: '',
        ...(match || {}),
        ...pick(row),
        cat: row.cat || match?.cat || guessCat(row.desc),
      };
      expense.id = freeId(row.id) && !outIds.has(row.id) ? row.id : match && !outIds.has(match.id) ? match.id : ++maxId;
      outIds.add(expense.id);
      row.id = expense.id;
      return expense;
    });
    S.expenses = [...S.expenses.filter((expense) => !synced(expense)), ...out];
    if (x.st) Object.assign(S.settings, x.st);
    report.fromX = out.length;
    return { state: S, report };
  }

  const previous = base.ex || {};
  const inX = new Set();
  for (const row of x.rows) {
    if (inX.has(row.id)) row.id = 0;
    if (!row.cat) row.cat = A.get(row.id)?.cat || guessCat(row.desc);
    const fromExcel = norm(row);
    const current = row.id && A.get(row.id);
    const saved = row.id && previous[row.id];
    if (!row.id || (!current && !saved)) {
      const expense = {
        ...pick(row),
        check: '',
        file: '',
        id: freeId(row.id) && !S.expenses.some((item) => item.id === row.id) ? row.id : uid++,
      };
      row.id = expense.id;
      S.expenses.push(expense);
      inX.add(expense.id);
      report.added++;
      continue;
    }
    inX.add(row.id);
    if (current && saved) {
      const appChanged = !same(norm(current), saved);
      const excelChanged = !same(fromExcel, saved);
      if (excelChanged && !appChanged) {
        Object.assign(current, fromExcel);
        report.fromX++;
      } else if (excelChanged && appChanged && !same(fromExcel, norm(current))) report.conf.push([current, fromExcel]);
    } else if (current && !saved && !same(norm(current), fromExcel)) report.conf.push([current, fromExcel]);
  }

  const gone = app.filter((expense) => previous[expense.id] && !inX.has(expense.id) && same(norm(expense), previous[expense.id]));
  if (
    gone.length &&
    (gone.length <= 3 ||
      confirm(`En el Excel se borraron ${gone.length} gastos:\n${gone.slice(0, 8).map((expense) => '• ' + expense.desc).join('\n')}\n\n¿Borrarlos también de la app?`))
  ) {
    const ids = new Set(gone.map((expense) => expense.id));
    S.expenses = S.expenses.filter((expense) => !ids.has(expense.id));
    report.deleted = gone.length;
  }
  if (
    report.conf.length &&
    confirm(
      `${report.conf.length} gasto(s) se cambiaron en la app Y en el Excel:\n${report.conf
        .slice(0, 8)
        .map(([expense]) => '• ' + expense.desc)
        .join('\n')}\n\nAceptar = quedarse con la versión del EXCEL\nCancelar = quedarse con la versión de la APP`,
    )
  ) {
    report.conf.forEach(([expense, fromExcel]) => {
      Object.assign(expense, fromExcel);
      report.fromX++;
    });
  }
  if (x.st) {
    for (const [key] of SETK) {
      const fromExcel = x.st[key];
      const saved = base.st?.[key];
      if (fromExcel !== undefined && String(fromExcel) !== String(saved) && String(S.settings[key]) === String(saved)) {
        S.settings[key] = fromExcel;
        report.fromX++;
      }
    }
  }
  return { state: S, report };
}

const shiftF = (formula, from, delta) =>
  formula.replace(/(^|[^A-Za-z0-9_!'.])(\$?[A-Z]{1,3}\$?)(\d+)(?![\d(A-Za-z_])/g, (match, prefix, col, row) => prefix + col + (+row >= from ? +row + delta : row));

function shift(ws, from, delta) {
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      const formula = cell.formula;
      if (formula) {
        const next = shiftF(formula, from, delta);
        if (next !== formula) cell.value = { formula: next };
      }
    }),
  );
}

function unshare(ws) {
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      const value = cell.value;
      if (value && typeof value === 'object' && (value.sharedFormula || value.shareType)) cell.value = { formula: cell.formula, result: value.result };
    }),
  );
}

function put(row, expense, C, old) {
  const set = (key, value) => {
    if (C[key]) row.getCell(C[key]).value = value;
  };
  const current = norm(expense);
  const changed = (key) => !old || String(old[key]) !== String(current[key]);
  if (changed('desc')) set('desc', expense.desc);
  if (changed('total')) set('total', +expense.total || 0);
  for (const key of ['vendor', 'receipt', 'note']) if (changed(key)) set(key, expense[key] || null);
  if (changed('date')) set('date', /^\d{4}-\d{2}-\d{2}$/.test(expense.date || '') ? new Date(expense.date + 'T00:00:00Z') : expense.date || null);
  set('cat', expense.cat);
  set('id', expense.id);
  if (changed('jose') || changed('arnaldo') || changed('total')) {
    const jose = +expense.jose || 0;
    const arnaldo = +expense.arnaldo || 0;
    const total = +expense.total || 0;
    if (changed('jose')) set('jose', jose || null);
    if (changed('arnaldo')) set('arnaldo', arnaldo || null);
    set('paid', jose + arnaldo);
    set('who', jose && arnaldo ? 'Jose Javier Calderon / Arnaldo Aponte' : jose ? 'Jose Javier Calderon' : arnaldo ? 'Arnaldo Aponte' : null);
    set('flag', total > 0 && total - jose - arnaldo <= 0.005 ? 'X' : null);
  }
}

function writePro(x, state) {
  const { ws, L } = x;
  const C = L.C;
  const app = state.expenses.filter(synced);
  const ids = new Set(app.map((expense) => expense.id));
  const base = getBase();
  unshare(ws);
  for (const row of x.rows.filter((item) => !ids.has(item.id) && base?.ex?.[item.id]).sort((a, b) => b.row - a.row)) {
    ws.spliceRows(row.row, 1);
    shift(ws, row.row + 1, -1);
    L.tr--;
    x.rows.forEach((item) => {
      if (item.row > row.row) item.row--;
    });
    row.row = 0;
  }
  const rowOf = new Map(x.rows.filter((item) => item.row && ids.has(item.id)).map((item) => [item.id, item]));
  for (const expense of app) {
    const row = rowOf.get(expense.id);
    if (row) put(ws.getRow(row.row), expense, C, { ...norm({ ...row, ...row.raw }), cat: row.noCat ? '' : row.cat });
  }
  for (const expense of app.filter((item) => !rowOf.has(item.id))) {
    const at = L.tr;
    ws.spliceRows(at, 0, []);
    shift(ws, at, 1);
    L.tr++;
    const row = ws.getRow(at);
    const prev = ws.getRow(at - 1);
    for (let c = 1; c <= L.maxc; c++) row.getCell(c).style = JSON.parse(JSON.stringify(prev.getCell(c).style || {}));
    put(row, expense, C, null);
    if (C.rest && C.paid) row.getCell(C.rest).value = { formula: `${colL(C.total)}${at}-${colL(C.paid)}${at}` };
  }
  const f = L.hr + 1;
  const l = L.tr - 1;
  if (C.rest && C.paid) {
    for (let n = f; n <= l; n++) {
      const cell = ws.getRow(n).getCell(C.rest);
      if (/^\$?[A-Z]+\$?\d+-\$?[A-Z]+\$?\d+$/.test(cell.formula || '')) cell.value = { formula: `${colL(C.total)}${n}-${colL(C.paid)}${n}` };
    }
  }
  if (L.tr <= ws.rowCount) {
    ws.getRow(L.tr).eachCell((cell) => {
      const formula = cell.formula;
      if (formula && /^SUM\(\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+\)$/i.test(formula)) {
        cell.value = { formula: formula.replace(/^SUM\((\$?[A-Z]+)\$?\d+:(\$?[A-Z]+)\$?\d+\)$/i, (m, a, b) => `SUM(${a}${f}:${b}${l})`) };
      }
    });
  }
  for (let n = f; n <= l + 100; n++) {
    ws.getCell(colL(C.cat) + n).dataValidation = { type: 'list', allowBlank: true, formulae: ['"' + CATS.join(',') + '"'] };
  }
  return { f, l };
}

function acqVals(state) {
  const sum = (cat, key) => state.expenses.filter((expense) => expense.cat === cat).reduce((total, expense) => total + (+expense[key] || 0), 0);
  return {
    acq: sum('Adquisición', 'total'),
    cie: sum('Cierre / Legal', 'total'),
    acqJ: sum('Adquisición', 'jose') + sum('Cierre / Legal', 'jose'),
    acqA: sum('Adquisición', 'arnaldo') + sum('Cierre / Legal', 'arnaldo'),
  };
}

function writeResumen(wb, x, range, state) {
  for (const name of [XR, OLD]) {
    const sheet = wb.getWorksheet(name);
    if (sheet) wb.removeWorksheet(sheet.id);
  }
  const green = 'FF1F6F5C';
  const moneyFmt = '"$"#,##0.00';
  const head = (row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: green } };
  };
  const rs = wb.addWorksheet(XR, { properties: { tabColor: { argb: 'FFC98A2B' } } });
  rs.columns = [{ width: 46 }, { width: 18 }, { width: 16 }];
  const C = x.L.C;
  const P = `'${PS}'!`;
  const rg = (key) => `${P}$${colL(C[key])}$${range.f}:$${colL(C[key])}$${range.l}`;
  const av = acqVals(state);
  rs.addRow(['Casa Villa Carolina — Resumen']).font = { bold: true, size: 14 };
  rs.addRow(['Edita los valores en amarillo; la app los toma al sincronizar. Los gastos se editan en la hoja Proyeccion.']).font = {
    italic: true,
    color: { argb: 'FF6B736F' },
  };
  head(rs.addRow(['Supuestos', 'Valor', '(clave)']));
  SETK.forEach(([key, label]) => {
    const row = rs.addRow([label, key === 'profitSplit' ? (state.settings[key] === '50' ? '50/50' : 'capital') : +state.settings[key], key]);
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    row.getCell(3).font = { color: { argb: 'FF9AA39F' }, size: 9 };
  });
  ['B4', 'B6', 'B7'].forEach((addr) => {
    rs.getCell(addr).numFmt = moneyFmt;
  });
  rs.addRow([]);
  head(rs.addRow(['Resultados (se calculan solos)', '', '']));
  const F = (label, value, key, fmt = moneyFmt) => {
    const row = rs.addRow([label, typeof value === 'string' ? { formula: value } : value, key || '']);
    row.getCell(2).numFmt = fmt;
    row.getCell(3).font = { color: { argb: 'FF9AA39F' }, size: 9 };
    return row.number;
  };
  const cmp = F('Compra de la casa (de la app)', av.acq, 'acq');
  const cie = F('Cierre / legal (de la app)', av.cie, 'cie');
  const ren = F('Remodelación (hoja Proyeccion)', `SUM(${rg('total')})`);
  const inv = F('Inversión total', `B${cmp}+B${cie}+B${ren}`);
  const cvn = F('Costos de venta (comisión + cierre)', 'B4*B5/100+B6');
  const gan = F('GANANCIA NETA PROYECTADA', `B4-B${cvn}-B${inv}`);
  rs.getRow(gan).font = { bold: true };
  F('% Ganancia (ROI)', `IFERROR(B${gan}/B${inv},0)`, '', '0.0%');
  F('Margen sobre venta', `IFERROR(B${gan}/B4,0)`, '', '0.0%');
  F('Punto de equilibrio', `(B${inv}+B6)/(1-B5/100)`);
  F('Presupuesto remodelación disponible', `B7-B${ren}`);
  const aj = F('Compra/cierre pagado por Jose (de la app)', av.acqJ, 'acqJ');
  const aa = F('Compra/cierre pagado por Arnaldo (de la app)', av.acqA, 'acqA');
  const tj = F('Total aportado por Jose', `B${aj}+SUM(${C.jose ? rg('jose') : '0'})`);
  const ta = F('Total aportado por Arnaldo', `B${aa}+SUM(${C.arnaldo ? rg('arnaldo') : '0'})`);
  F('Pendiente por pagar', `B${inv}-B${tj}-B${ta}`);
}

async function loadWorkbook(file) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  return wb;
}

async function firstBackup(file) {
  try {
    const mark = KEY + '.bk2.' + file.name;
    if (localStorage.getItem(mark)) return;
    download(file.name.replace(/\.xlsx$/i, '') + ' - copia antes de sincronizar Proyeccion.xlsx', file, file.type);
    localStorage.setItem(mark, '1');
  } catch {
    /* se ignora */
  }
}

export function createExcelSync({ getState, setState, onStatus }) {
  let xHandle = null;
  let syncing = false;
  let pushT = null;
  let retryT = null;
  let lastMod = 0;
  let listening = false;

  function emit(msg, err = false) {
    const prefix = xHandle
      ? `Archivo conectado: ${xHandle.name}. `
      : hasFS
        ? 'Sin archivo conectado. '
        : 'Este navegador no permite escribir el archivo directamente: al sincronizar se descargará el Excel actualizado para que reemplaces el de la carpeta. (Usa Chrome o Edge para sincronización directa.) ';
    onStatus(msg, !!err, prefix + msg);
  }

  async function syncCore(file, writeOut) {
    const wb = await loadWorkbook(file);
    const x = readPro(wb);
    if (!x) throw new Error('No encontré la hoja "Proyeccion" en el Excel');
    const needIds = x.rows.some((row) => !row.id || row.noCat || row.adj) || new Set(x.rows.map((row) => row.id)).size !== x.rows.length;
    const { state, report } = mergeInto(getState(), x, getBase());
    const now = { ex: snapEx(state.expenses), st: { ...state.settings } };
    const av = acqVals(state);
    const xNow = Object.fromEntries(x.rows.map((row) => [row.id, norm(row)]));
    setState(state);
    let wrote = false;
    if (
      needIds ||
      !exEq(xNow, now.ex) ||
      !stEq(x.st, now.st) ||
      Object.keys(av).some((key) => Math.abs((x.acq[key] ?? -1) - av[key]) > 0.005) ||
      wb.getWorksheet(OLD)
    ) {
      await firstBackup(file);
      const range = writePro(x, state);
      writeResumen(wb, x, range, state);
      await writeOut(await wb.xlsx.writeBuffer());
      wrote = true;
    }
    setBase(now);
    const parts = [];
    if (report.fromX) parts.push(`${report.fromX} cambio(s) traídos del Excel`);
    if (report.added) parts.push(`${report.added} nuevo(s) del Excel`);
    if (report.deleted) parts.push(`${report.deleted} borrado(s)`);
    if (wrote) parts.push('Excel actualizado');
    return parts.join(' · ') || 'sin cambios';
  }

  async function syncExcel(manual) {
    if (syncing) return;
    clearTimeout(retryT);
    if (!hasFS) {
      if (manual) fallbackSync();
      return;
    }
    try {
      if (!xHandle) {
        if (!manual) return;
        await pickExcel();
      }
      const mode = { mode: 'readwrite' };
      if ((await xHandle.queryPermission(mode)) !== 'granted') {
        if (!manual) {
          emit('Presiona 🔄 para sincronizar');
          return;
        }
        if ((await xHandle.requestPermission(mode)) !== 'granted') throw new Error('No se dio permiso para usar el archivo');
      }
      syncing = true;
      emit('Sincronizando…');
      const msg = await syncCore(await xHandle.getFile(), async (buf) => {
        const writable = await xHandle.createWritable();
        await writable.write(buf);
        await writable.close();
      });
      lastMod = (await xHandle.getFile()).lastModified;
      emit(`✓ ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} — ${msg}`);
    } catch (error) {
      if (error.name === 'AbortError') emit('');
      else if (/NoModificationAllowed|InvalidState|NotReadable|NotAllowed/.test(error.name) && xHandle) {
        emit('⚠ El Excel está abierto: ciérralo (después de guardar) y se sincroniza solo', true);
        retryT = setTimeout(() => syncExcel(false), 10000);
      } else emit('⚠ ' + (error.message || error), true);
    } finally {
      syncing = false;
    }
  }

  function fallbackSync() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      emit('Sincronizando…');
      try {
        const msg = await syncCore(file, async (buf) => download(file.name, buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
        emit(`✓ ${msg}. Si se descargó un Excel, reemplaza el de la carpeta con ese archivo.`);
      } catch (error) {
        emit('⚠ ' + (error.message || error), true);
      }
    };
    input.click();
  }

  async function pickExcel() {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
    });
    xHandle = handle;
    await idb('put', 'excelHandle', handle);
    setBase(null);
    lastMod = 0;
  }

  function unlinkExcel() {
    xHandle = null;
    idb('delete', 'excelHandle').catch(() => {});
    setBase(null);
    emit('Desconectado.');
  }

  function schedulePush() {
    if (!xHandle) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => syncExcel(false), 1500);
  }

  async function checkExcel() {
    if (!xHandle || syncing) return;
    try {
      if ((await xHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') return;
      if ((await xHandle.getFile()).lastModified !== lastMod) syncExcel(false);
    } catch {
      /* el archivo puede estar bloqueado */
    }
  }

  async function init() {
    if (!listening) {
      listening = true;
      window.addEventListener('focus', checkExcel);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkExcel();
      });
    }
    try {
      xHandle = (await idb('get', 'excelHandle')) || null;
    } catch {
      xHandle = null;
    }
    if (xHandle) syncExcel(false);
    else emit(hasFS ? 'Excel no conectado' : '');
  }

  return { syncExcel, pickExcel, unlinkExcel, schedulePush, init, hasFS };
}
