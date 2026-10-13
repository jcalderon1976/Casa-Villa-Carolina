import { paid } from './format';

export function calc(state) {
  const ex = state.expenses;
  const st = state.settings;
  const sum = (f) => ex.reduce((a, e) => a + f(e), 0);
  const acq = sum((e) => (e.cat === 'Adquisición' ? +e.total : 0));
  const close = sum((e) => (e.cat === 'Cierre / Legal' ? +e.total : 0));
  const reno = sum((e) => (['Adquisición', 'Cierre / Legal'].includes(e.cat) ? 0 : +e.total));
  const total = acq + close + reno;
  const paidT = sum(paid);
  const pendT = sum((e) => Math.max(0, (+e.total || 0) - paid(e)));
  const sell = (st.salePrice * st.commissionPct) / 100 + +st.sellerClosing;
  const net = st.salePrice - sell;
  const profit = net - total;
  const J = sum((e) => +e.jose);
  const A = sum((e) => +e.arnaldo);
  const be = (total + +st.sellerClosing) / (1 - st.commissionPct / 100);
  const byCat = {};
  ex.forEach((e) => {
    byCat[e.cat] = (byCat[e.cat] || 0) + +e.total;
  });
  const flags = ex.filter((e) => e.check);
  const maxReno = net / (1 + st.targetRoi / 100) - acq - close;
  return {
    acq,
    close,
    reno,
    total,
    paidT,
    pendT,
    sell,
    net,
    profit,
    roi: (profit / total) * 100,
    margin: (profit / st.salePrice) * 100,
    J,
    A,
    be,
    byCat,
    flags,
    maxReno,
  };
}

export function shares(c, profitSplit) {
  let pj = 0.5;
  if (profitSplit === 'capital' && c.J + c.A > 0) pj = c.J / (c.J + c.A);
  return { pj, pa: 1 - pj };
}
