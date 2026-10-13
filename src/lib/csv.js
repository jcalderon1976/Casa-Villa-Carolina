import { pend } from './format';
import { download } from './backup';

export function exportCsv(expenses) {
  const headers = ['Fecha', 'Categoría', 'Descripción', 'Suplidor', 'Recibo', 'Total', 'Pagó Jose', 'Pagó Arnaldo', 'Pendiente', 'Comentario', 'Revisar', 'Documento'];
  const quote = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const rows = expenses.map((expense) =>
    [expense.date, expense.cat, expense.desc, expense.vendor, expense.receipt, expense.total, expense.jose, expense.arnaldo, pend(expense), expense.note, expense.check, expense.file]
      .map(quote)
      .join(','),
  );
  download('gastos-villa-carolina.csv', '\uFEFF' + [headers.map(quote).join(','), ...rows].join('\r\n'), 'text/csv');
}
