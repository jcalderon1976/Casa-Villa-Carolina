import { KEY, SEED, CATS } from '../data';
import { chk } from './format';

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.expenses) {
      saved.expenses.forEach((expense) => {
        if (/^Tenencia/.test(expense.cat)) expense.cat = CATS[10];
      });
      return saved;
    }
  } catch {
    /* se usan los datos iniciales */
  }
  return structuredClone(SEED);
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* el navegador puede rechazar el almacenamiento */
  }
}

export function loadTab() {
  try {
    return localStorage.getItem(KEY + '.tab') || 'dash';
  } catch {
    return 'dash';
  }
}

export function saveTab(tab) {
  try {
    localStorage.setItem(KEY + '.tab', tab);
  } catch {
    /* se ignora */
  }
}

export function resolveChecks(state) {
  let changed = false;
  const expenses = state.expenses.map((expense) => {
    if (!expense.check) return expense;
    const next = { ...expense };
    if (!next.checkAt) {
      const seed = SEED.expenses.find((item) => item.id === expense.id && item.check === expense.check);
      next.checkAt = chk(seed || expense);
      changed = true;
    }
    if (next.checkAt !== chk(next)) {
      next.check = '';
      delete next.checkAt;
      changed = true;
    }
    return next;
  });
  return changed ? { ...state, expenses } : state;
}
