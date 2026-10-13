import { CATKW, guessCat } from '../data';
import { money } from './format';

const VENDORS = [
  [/HOME ?DEPOT|HOW DOERS/, 'Home Depot'],
  [/LOWE'?S/, "Lowe's"],
  [/AMAZON/, 'Amazon'],
  [/NATIONAL LUMBER/, 'National Lumber'],
  [/JD EQUI/, 'JD Equipment & Supply'],
  [/CAROLINA TILE/, 'Carolina Tile Outlet'],
  [/PEPITO/, 'Pepito Food Market'],
  [/MARKET CHINA/, 'Market China'],
  [/WAL-?MART/, 'Walmart'],
  [/COSTCO/, 'Costco'],
  [/SAM'?S CLUB/, "Sam's Club"],
  [/BUILDERS/, 'Builders'],
  [/KRESKO/, 'Kresko'],
  [/ACE HARDWARE/, 'Ace Hardware'],
  [/PLAZA LAS AM/, 'Plaza Las Américas'],
];

const MES = { jan: 1, ene: 1, feb: 2, mar: 3, apr: 4, abr: 4, may: 5, jun: 6, jul: 7, aug: 8, ago: 8, sep: 9, oct: 10, nov: 11, dec: 12, dic: 12 };

const fixOcr = (text) =>
  text.replace(/[$\d€£SOolI|]*\d[$\d€£SOolI|]*[.,][\d€£SOolI|]{2}\b/g, (match) =>
    match.replace(/[€£]/g, '6').replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(/S/g, '5'),
  );

async function prep(src) {
  let bitmap = src;
  if (src instanceof Blob) bitmap = await createImageBitmap(src);
  const w = bitmap.width;
  const h = bitmap.height;
  const k = Math.min(Math.max(1, 1700 / w), Math.sqrt(30e6 / (w * h)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.4)';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function ocr(img, show) {
  show('Cargando lector de texto (OCR)…');
  const Tesseract = (await import('tesseract.js')).default;
  const prepared = await prep(img);
  const { data } = await Tesseract.recognize(prepared, 'eng', {
    logger: (m) => m.status === 'recognizing text' && show(`Leyendo texto… ${Math.round(m.progress * 100)}%`),
  });
  return fixOcr(data.text);
}

async function pdfText(file, show) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  const lib = pdfjs.getDocument ? pdfjs : pdfjs.default;
  lib.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = '';
  for (let p = 1; p <= Math.min(pdf.numPages, 4); p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    const rows = [];
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let row = rows.find((entry) => Math.abs(entry.y - y) < 3);
      if (!row) rows.push((row = { y, i: [] }));
      row.i.push({ x, s: item.str });
    }
    rows.sort((a, b) => b.y - a.y);
    out += rows.map((row) => row.i.sort((a, b) => a.x - b.x).map((i) => i.s).join(' ')).join('\n') + '\n';
  }
  if (out.replace(/\s/g, '').length > 30 && /\bTOTAL\b/i.test(out)) return out;
  show('PDF escaneado: leyendo la imagen con OCR…');
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return ocr(canvas, show);
}

export function parseReceipt(text, expenses) {
  const lines = text.split(/\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const upper = text.toUpperCase();
  const result = {};
  const num = (s) => +s.replace(/[^\d.]/g, '');
  const AMT = /\$?\s?(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})/g;
  const SKIP = /SUB-?TOTAL|SAVING|AHORR|\bTAX\b|IVU|ITEMS|ART[IÍ]CULOS|DESCUENTO|DISCOUNT|CAMBIO|CHANGE/i;
  const totals = lines
    .filter((line) => /\b(TOTAL|AMOUNT|MONTO|BALANCE|PAGADO)\b/i.test(line) && !SKIP.test(line))
    .flatMap((line) => [...line.matchAll(AMT)].map((m) => num(m[1])));
  const all = [...text.matchAll(AMT)].map((m) => num(m[1]));
  result.total = totals.length ? Math.max(...totals) : all.length ? Math.max(...all) : null;
  result.hasTotal = totals.length > 0;

  const ok = (y, m, d) => {
    y = +y < 100 ? 2000 + +y : +y;
    m = +m;
    d = +d;
    return y >= 2020 && y <= 2040 && m >= 1 && m <= 12 && d >= 1 && d <= 31
      ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      : null;
  };
  const mes = (s) => MES[s.toLowerCase()];
  const datePatterns = [
    [/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (m) => ok(m[1], m[2], m[3])],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g, (m) => ok(m[3], m[1], m[2])],
    [/\b([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/g, (m) => mes(m[1]) && ok(m[3], mes(m[1]), m[2])],
    [/\b(\d{1,2})\s+de\s+([a-z]{3})[a-z]*\s+(?:de\s+)?(\d{4})\b/gi, (m) => mes(m[2]) && ok(m[3], mes(m[2]), m[1])],
  ];
  for (const [re, fn] of datePatterns) {
    for (const match of text.matchAll(re)) {
      const date = fn(match);
      if (date) {
        result.date = date;
        break;
      }
    }
    if (result.date) break;
  }

  const known = expenses.map((e) => e.vendor).filter((v) => v && v.length > 3 && v !== '—');
  result.vendor =
    (VENDORS.find(([re]) => re.test(upper)) || [])[1] ||
    known.find((v) => upper.includes(v.toUpperCase())) ||
    lines.find((line) => /[A-Za-z]{3}/.test(line) && !/\d{3}/.test(line) && line.length < 40) ||
    '';

  const receiptMatch =
    upper.match(/CONTROL[:#\s]*([A-Z0-9]{4,}-[A-Z0-9]{4,})/) ||
    upper.match(/(?:ORDER|ORDEN|INVOICE|FACTURA|RECIBO|RECEIPT|TRANSACTION|TRANS)\s*(?:NO\.?|NUM(?:ERO)?\.?|#)?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,})/);
  if (receiptMatch && /\d/.test(receiptMatch[1])) result.receipt = receiptMatch[1];

  const items = [];
  const marker = /<\s?[A-Z]/;
  const lastAmt = (s) => {
    const amounts = [...(s || '').matchAll(AMT)];
    return amounts.length ? num(amounts[amounts.length - 1][1]) : 0;
  };
  if (lines.some((line) => marker.test(line))) {
    lines.forEach((line, i) => {
      if (!marker.test(line)) return;
      const next = lines[i + 1] || '';
      const next2 = lines[i + 2] || '';
      const name = (/[A-Za-z]{3}/.test(next) && !marker.test(next) ? next : line.replace(/<.*$/, ''))
        .replace(/^[\d-]{6,}\s*/, '')
        .trim();
      const price = /\d+\s*@/.test(next2) ? lastAmt(next2) : lastAmt(line.split(/<[^>]*>?/).pop());
      items.push({ name, price });
    });
  } else {
    lines.forEach((line, i) => {
      if (SKIP.test(line) || /\b(TOTAL|USD|VISA|MASTERCARD|AUTH|CASH|EFECTIVO)\b/i.test(line)) return;
      const match = line.match(/^(?:\d{6,}\s+)?(.*?[A-Za-zÁÉÍÓÚÑáéíóúñ].*?)\s+(?:<\w>\s*)?\$?(\d[\d,]*\.\d{2})\s*[A-Z]?$/);
      if (!match) return;
      let name = match[1].replace(/^\d+\s*@\s*[\d.]+\s*/, '').trim();
      const next = lines[i + 1] || '';
      if (next && !/\d\.\d{2}\b/.test(next) && /^[A-Z0-9 "'/+&.,#-]{8,}$/.test(next) && !/^\d+$/.test(next)) name = next;
      items.push({ name, price: num(match[2]) });
    });
  }
  const cap = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  if (items.length) {
    result.desc = items.slice(0, 3).map((x) => cap(x.name)).join(', ') + (items.length > 3 ? ` y ${items.length - 3} más` : '');
    result.note = items.length > 1 ? items.map((x) => `${cap(x.name)} ${money(x.price)}`).join(' · ') : '';
  }
  const src = (items.map((x) => x.name).join(' ') || upper).toUpperCase();
  let best = ['Misceláneos', 0];
  for (const [cat, re] of Object.entries(CATKW)) {
    const n = (src.match(new RegExp(re.source, 'g')) || []).length;
    if (n > best[1]) best = [cat, n];
  }
  result.cat = best[0] || guessCat(src);
  return result;
}

export function findDuplicate(result, expenses) {
  return expenses.find(
    (expense) =>
      (result.receipt && expense.receipt === result.receipt) ||
      (result.total && Math.abs(expense.total - result.total) < 0.005 && (!result.date || !expense.date || expense.date === result.date)),
  );
}

export async function readReceiptFile(file, expenses, onStatus) {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return parseReceipt(await pdfText(file, onStatus), expenses);
  if (file.type.startsWith('image/')) return parseReceipt(await ocr(file, onStatus), expenses);
  throw new Error('Formato no soportado. Usa PDF, JPG o PNG.');
}
