export const money = (n) =>
  '$' + (+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money0 = (n) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(+n || 0)).toLocaleString('en-US');

export const pct = (n) => (Number.isFinite(+n) ? (+n).toFixed(1) : '0') + '%';

export const paid = (e) => (+e.jose || 0) + (+e.arnaldo || 0);

export const pend = (e) => Math.max(0, (+e.total || 0) - paid(e));

export function chk(e) {
  return [e.total, e.jose, e.arnaldo].map((v) => (+v || 0).toFixed(2)).join('|');
}
