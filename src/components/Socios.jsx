import { useMemo } from 'react';
import { calc, shares } from '../lib/calc';
import { money, pct } from '../lib/format';

export function Socios({ state }) {
  const c = useMemo(() => calc(state), [state]);
  const { pj, pa } = shares(c, state.settings.profitSplit);
  const people = [
    ['Jose Javier Calderon', c.J, pj],
    ['Arnaldo Aponte', c.A, pa],
  ];
  const diff = (c.J - c.A) / 2;
  const splitLabel = state.settings.profitSplit === 'capital' ? 'según capital' : '50/50';

  return (
    <>
      <div className="grid k2">
        {people.map(([name, capital, share]) => (
          <div className="card" key={name}>
            <h3>{name}</h3>
            <div className="row">
              <span>Capital aportado</span>
              <b>{money(capital)}</b>
            </div>
            <div className="row">
              <span>% del capital</span>
              <b>{pct((capital / (c.J + c.A)) * 100)}</b>
            </div>
            <div className="row">
              <span>Participación en ganancia ({splitLabel})</span>
              <b>{pct(share * 100)}</b>
            </div>
            <div className="row">
              <span>Ganancia proyectada</span>
              <b className="pos">{money(c.profit * share)}</b>
            </div>
            <div className="row">
              <span>Recibe al vender (capital + ganancia)</span>
              <b>{money(capital + c.profit * share)}</b>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Balance entre socios</h3>
        <p>
          {Math.abs(diff) < 1 ? (
            'Los aportes están balanceados.'
          ) : (
            <>
              {diff > 0 ? 'Jose Javier' : 'Arnaldo'} ha aportado <b>{money(Math.abs(diff * 2))}</b> más. Para quedar 50/50,{' '}
              {diff > 0 ? 'Arnaldo' : 'Jose Javier'} debería aportar <b>{money(Math.abs(diff))}</b> (o se compensa al repartir la venta).
            </>
          )}
        </p>
        <p className="mute">Pendiente por pagar a suplidores: {money(c.pendT)}. Cambia la forma de repartir la ganancia en Ajustes.</p>
      </div>
    </>
  );
}
