import { useEffect, useRef, useState } from 'react';
import { SEED, blankExpense } from './data';
import { Ajustes } from './components/Ajustes';
import { Dashboard } from './components/Dashboard';
import { Documentos } from './components/Documentos';
import { ExpenseDialog } from './components/ExpenseDialog';
import { Fotos } from './components/Fotos';
import { Gastos } from './components/Gastos';
import { Header } from './components/Header';
import { ImageDialog } from './components/ImageDialog';
import { Socios } from './components/Socios';
import { buildBackup, download, readBackup } from './lib/backup';
import { exportCsv } from './lib/csv';
import { createExcelSync } from './lib/excelSync';
import { chk } from './lib/format';
import { idb, openUpload } from './lib/idb';
import { loadState, loadTab, resolveChecks, saveState, saveTab } from './lib/storage';

let booted = false;

export default function App() {
  const [state, setState] = useState(() => {
    const initial = resolveChecks(loadState());
    saveState(initial);
    return initial;
  });
  const [tab, setTab] = useState(loadTab);
  const [sort, setSort] = useState({ k: 'date', d: 1 });
  const [filt, setFilt] = useState({ q: '', cat: '', st: '' });
  const [editing, setEditing] = useState(null);
  const [photo, setPhoto] = useState('');
  const [sync, setSync] = useState({ short: '', err: false, info: '' });
  const stateRef = useRef(state);
  stateRef.current = state;

  const syncApi = useRef(null);
  if (!syncApi.current) {
    syncApi.current = createExcelSync({
      getState: () => stateRef.current,
      setState: (next) => {
        const resolved = resolveChecks(next);
        saveState(resolved);
        stateRef.current = resolved;
        setState(resolved);
      },
      onStatus: (short, err, info) => setSync({ short, err, info }),
    });
  }

  useEffect(() => {
    if (booted) return undefined;
    booted = true;
    syncApi.current.init();
    return undefined;
  }, []);

  function commit(recipe) {
    const next = resolveChecks(recipe(stateRef.current));
    saveState(next);
    stateRef.current = next;
    setState(next);
    syncApi.current.schedulePush();
  }

  function go(nextTab) {
    setTab(nextTab);
    saveTab(nextTab);
  }

  function setSetting(key, value) {
    commit((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  }

  async function saveExpense(form, file) {
    const id = form.id || Math.max(0, ...stateRef.current.expenses.map((expense) => expense.id)) + 1;
    const expense = { ...form, id };
    if (expense.check) expense.checkAt = chk(expense);
    else delete expense.checkAt;
    if (file) {
      expense.upload = { name: file.name, type: file.type };
      try {
        await idb('put', expense.id, file);
      } catch {
        alert('No se pudo guardar el archivo del recibo en este navegador; el gasto sí se guardó.');
      }
    }
    commit((prev) => ({
      ...prev,
      expenses: form.id ? prev.expenses.map((item) => (item.id === form.id ? { ...item, ...expense } : item)) : [...prev.expenses, expense],
    }));
    setEditing(null);
  }

  function deleteExpense(id) {
    if (!confirm('¿Borrar este gasto?')) return;
    idb('delete', id).catch(() => {});
    commit((prev) => ({ ...prev, expenses: prev.expenses.filter((item) => item.id !== id) }));
    setEditing(null);
  }

  function resolveFlag(id) {
    commit((prev) => ({
      ...prev,
      expenses: prev.expenses.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, check: '' };
        delete next.checkAt;
        return next;
      }),
    }));
  }

  async function backup() {
    const json = await buildBackup(stateRef.current);
    download('villa-carolina-respaldo-' + new Date().toISOString().slice(0, 10) + '.json', json, 'application/json');
  }

  async function restore(file) {
    try {
      const data = await readBackup(file);
      commit(() => data);
      alert('Respaldo importado ✓');
    } catch {
      alert('Archivo no válido');
    }
  }

  function reset() {
    if (confirm('¿Volver a los datos originales del Excel? Se perderán los cambios.')) commit(() => structuredClone(SEED));
  }

  async function pickExcel() {
    try {
      await syncApi.current.pickExcel();
      await syncApi.current.syncExcel(true);
    } catch {
      /* el usuario canceló el selector */
    }
  }

  return (
    <>
      <Header tab={tab} onTab={go} onSync={() => syncApi.current.syncExcel(true)} syncMsg={sync.short} syncErr={sync.err} />
      <main>
        {tab === 'dash' ? <Dashboard state={state} onSetting={setSetting} onResolve={resolveFlag} /> : null}
        {tab === 'gastos' ? (
          <Gastos
            expenses={state.expenses}
            filt={filt}
            sort={sort}
            onFilt={setFilt}
            onSort={(key) => setSort((prev) => ({ k: key, d: prev.k === key ? -prev.d : 1 }))}
            onEdit={(expense) => setEditing(expense ? { ...expense } : blankExpense())}
            onExport={() => exportCsv(state.expenses)}
            onOpenUpload={openUpload}
          />
        ) : null}
        {tab === 'socios' ? <Socios state={state} /> : null}
        {tab === 'docs' ? <Documentos /> : null}
        {tab === 'fotos' ? <Fotos onOpen={setPhoto} /> : null}
        {tab === 'ajustes' ? (
          <Ajustes
            settings={state.settings}
            syncInfo={sync.info}
            onSetting={setSetting}
            onSync={() => syncApi.current.syncExcel(true)}
            onPick={pickExcel}
            onUnlink={() => syncApi.current.unlinkExcel()}
            onBackup={backup}
            onRestore={restore}
            onExport={() => exportCsv(state.expenses)}
            onReset={reset}
          />
        ) : null}
      </main>
      {editing ? (
        <ExpenseDialog
          expense={editing}
          expenses={state.expenses}
          onClose={() => setEditing(null)}
          onSave={saveExpense}
          onDelete={deleteExpense}
          onOpenUpload={openUpload}
        />
      ) : null}
      {photo ? <ImageDialog src={photo} onClose={() => setPhoto('')} /> : null}
    </>
  );
}
