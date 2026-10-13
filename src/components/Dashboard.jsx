import { useMemo } from 'react';
import { calc } from '../lib/calc';
import { money, money0, pct } from '../lib/format';

const SCENARIOS = [230000, 240000, 250000, 260000, 270000, 280000];

export function Dashboard({ state, onSetting, onResolve }) {
  const c = useMemo(() => calc(state), [state]);
  const st = state.settings;
  const rb = Math.min(100, (c.reno / st.renoBudget) * 100);
  const cats = Object.entries(c.byCat)
    .filter(([key]) => key !== 'Adquisición')
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(...cats.map((entry) => entry[1]), 1);

  return (
    <>
      <div className="card hero" style={{ marginBottom: 14 }}>
        <div className="slider">
          <b>Precio de venta meta</b>
          <input type="range" min="200000" max="320000" step="1000" value={st.salePrice} onChange={(e) => onSetting('salePrice', +e.target.value)} />
          <b style={{ fontSize: 20, minWidth: 110, textAlign: 'right' }}>{money0(st.salePrice)}</b>
        </div>
        <div className="slider mute" style={{ marginTop: 6 }}>
          Comisión de venta
          <input type="range" min="0" max="7" step="0.5" value={st.commissionPct} onChange={(e) => onSetting('commissionPct', +e.target.value)} />
          <span style={{ minWidth: 110, textAlign: 'right' }}>
            {st.commissionPct}% + {money0(st.sellerClosing)} cierre
          </span>
        </div>
      </div>
      <div className="grid k4">
        <div className="card kpi">
          <h3>Ganancia neta proyectada</h3>
          <div className={`v ${c.profit < 0 ? 'neg' : 'pos'}`}>{money0(c.profit)}</div>
          <div className="s">después de {money0(c.sell)} en costos de venta</div>
        </div>
        <div className="card kpi">
          <h3>% Ganancia (ROI)</h3>
          <div className={`v ${c.roi < 0 ? 'neg' : 'pos'}`}>{pct(c.roi)}</div>
          <div className="s">ganancia ÷ inversión total · margen sobre venta {pct(c.margin)}</div>
        </div>
        <div className="card kpi">
          <h3>Inversión total</h3>
          <div className="v">{money0(c.total)}</div>
          <div className="s">
            compra {money0(c.acq)} · cierre {money0(c.close)} · remodelación {money0(c.reno)}
          </div>
        </div>
        <div className="card kpi">
          <h3>Punto de equilibrio</h3>
          <div className="v">{money0(c.be)}</div>
          <div className="s">precio mínimo de venta para no perder</div>
        </div>
      </div>
      <div className="grid k2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Presupuesto de remodelación</h3>
          <div className="row">
            <span>Comprometido</span>
            <b>
              {money0(c.reno)} de {money0(st.renoBudget)}
            </b>
          </div>
          <div className="bar" style={{ margin: '8px 0' }}>
            <i style={{ width: `${rb}%`, background: rb > 95 ? 'var(--neg)' : rb > 80 ? 'var(--acc2)' : 'var(--acc)' }} />
          </div>
          <div className="row">
            <span>Disponible</span>
            <b className={st.renoBudget - c.reno < 0 ? 'neg' : ''}>{money0(st.renoBudget - c.reno)}</b>
          </div>
          <div className="row">
            <span>Pagado hasta hoy (todo)</span>
            <b>{money0(c.paidT)}</b>
          </div>
          <div className="row">
            <span>Pendiente por pagar</span>
            <b className="neg">{money0(c.pendT)}</b>
          </div>
          <div className="row">
            <span>Máx. remodelación para ROI de {st.targetRoi}%</span>
            <b>{money0(c.maxReno)}</b>
          </div>
        </div>
        <div className="card">
          <h3>Gastos por categoría (sin precio de compra)</h3>
          {cats.map(([name, value]) => (
            <div className="hbar" key={name}>
              <span>{name}</span>
              <div className="bar">
                <i style={{ width: `${(value / max) * 100}%` }} />
              </div>
              <b className="n" style={{ textAlign: 'right' }}>
                {money0(value)}
              </b>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Escenarios de precio de venta</h3>
          <table>
            <thead>
              <tr>
                <th>Venta</th>
                <th className="n">Ganancia</th>
                <th className="n">ROI</th>
                <th className="n">Margen</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((price) => {
                const net = price * (1 - st.commissionPct / 100) - st.sellerClosing;
                const profit = net - c.total;
                return (
                  <tr key={price} style={price === st.salePrice ? { fontWeight: 700 } : undefined}>
                    <td>{money0(price)}</td>
                    <td className={`n ${profit < 0 ? 'neg' : 'pos'}`}>{money0(profit)}</td>
                    <td className="n">{pct((profit / c.total) * 100)}</td>
                    <td className="n">{pct((profit / price) * 100)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Para revisar ({c.flags.length})</h3>
          {c.flags.length ? (
            c.flags.map((expense) => (
              <div className="alert" key={expense.id} style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'start' }}>
                <span>
                  <b>{expense.desc}</b> — {money(expense.total)}
                  <br />
                  {expense.check}
                </span>
                <button className="btn sm" type="button" onClick={() => onResolve(expense.id)}>
                  ✓ Resuelto
                </button>
              </div>
            ))
          ) : (
            <span className="mute">Todo en orden ✓</span>
          )}
        </div>
      </div>
    </>
  );
}
