import { useMemo } from 'react';
import { CATS, fileHref } from '../data';
import { money, paid, pend } from '../lib/format';

export function Gastos({ expenses, filt, sort, onFilt, onSort, onEdit, onExport, onOpenUpload }) {
  const rows = useMemo(() => {
    const filtered = expenses.filter(
      (expense) =>
        (!filt.cat || expense.cat === filt.cat) &&
        (!filt.st || (filt.st === 'pend' ? pend(expense) > 0 : filt.st === 'rev' ? expense.check : pend(expense) === 0)) &&
        (!filt.q || JSON.stringify(expense).toLowerCase().includes(filt.q.toLowerCase())),
    );
    const { k, d } = sort;
    return filtered.sort((a, b) => {
      const x = k === 'paid' ? paid(a) : k === 'pend' ? pend(a) : a[k];
      const y = k === 'paid' ? paid(b) : k === 'pend' ? pend(b) : b[k];
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * d;
    });
  }, [expenses, filt, sort]);

  const totalOf = (fn) => rows.reduce((sum, expense) => sum + fn(expense), 0);
  const header = (key, label, numeric) => (
    <th className={numeric ? 'n' : undefined} onClick={() => onSort(key)}>
      {label}
      {sort.k === key ? (sort.d > 0 ? ' ▲' : ' ▼') : ''}
    </th>
  );

  return (
    <>
      <div className="tools">
        <button className="btn p" type="button" onClick={() => onEdit(null)}>
          + Nuevo gasto
        </button>
        <input placeholder="Buscar…" value={filt.q} onChange={(e) => onFilt({ ...filt, q: e.target.value })} />
        <select value={filt.cat} onChange={(e) => onFilt({ ...filt, cat: e.target.value })}>
          <option value="">Todas las categorías</option>
          {CATS.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <select value={filt.st} onChange={(e) => onFilt({ ...filt, st: e.target.value })}>
          <option value="">Todos</option>
          <option value="pend">Con balance pendiente</option>
          <option value="ok">Pagados</option>
          <option value="rev">Para revisar</option>
        </select>
        <button className="btn" type="button" onClick={onExport}>
          Exportar a Excel (CSV)
        </button>
      </div>
      <div className="card tw">
        <table>
          <thead>
            <tr>
              {header('date', 'Fecha')}
              {header('cat', 'Categoría')}
              {header('desc', 'Descripción')}
              {header('vendor', 'Suplidor')}
              {header('total', 'Total', true)}
              {header('jose', 'Jose', true)}
              {header('arnaldo', 'Arnaldo', true)}
              {header('pend', 'Pendiente', true)}
              <th>Doc</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((expense) => (
              <tr key={expense.id} className={expense.check ? 'warn' : undefined} title={expense.check || expense.note}>
                <td>{expense.date}</td>
                <td>
                  <span className="tag">{expense.cat}</span>
                </td>
                <td>
                  {expense.desc}
                  {expense.note ? (
                    <div className="mute" style={{ fontSize: 12 }}>
                      {expense.note}
                    </div>
                  ) : null}
                  {expense.check ? (
                    <div style={{ fontSize: 12, color: 'var(--acc2)' }}>⚠ {expense.check}</div>
                  ) : null}
                </td>
                <td>
                  {expense.vendor}
                  {expense.receipt ? (
                    <div className="mute" style={{ fontSize: 11.5 }}>
                      #{expense.receipt}
                    </div>
                  ) : null}
                </td>
                <td className="n">{money(expense.total)}</td>
                <td className="n">{money(expense.jose)}</td>
                <td className="n">{money(expense.arnaldo)}</td>
                <td className={`n ${pend(expense) > 0 ? 'neg' : ''}`}>{pend(expense) > 0 ? money(pend(expense)) : '✓'}</td>
                <td>
                  {expense.upload ? (
                    <a
                      href="#"
                      title={expense.upload.name}
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenUpload(expense.id);
                      }}
                    >
                      🧾
                    </a>
                  ) : null}
                  {expense.file ? (
                    <a href={fileHref(expense.file)} target="_blank" rel="noreferrer" title={expense.file}>
                      📎
                    </a>
                  ) : null}
                </td>
                <td>
                  <button className="btn sm" type="button" onClick={() => onEdit(expense)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4}>{rows.length} partidas</th>
              <th className="n">{money(totalOf((e) => +e.total))}</th>
              <th className="n">{money(totalOf((e) => +e.jose))}</th>
              <th className="n">{money(totalOf((e) => +e.arnaldo))}</th>
              <th className="n">{money(totalOf(pend))}</th>
              <th colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
