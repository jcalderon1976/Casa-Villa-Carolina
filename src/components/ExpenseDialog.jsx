import { useEffect, useRef, useState } from 'react';
import { CATS, DOCS, PHOTOS } from '../data';
import { money } from '../lib/format';
import { findDuplicate, readReceiptFile } from '../lib/receipt';

const READ_FIELDS = ['cat', 'date', 'desc', 'vendor', 'receipt', 'total', 'note'];

export function ExpenseDialog({ expense, expenses, onClose, onSave, onDelete, onOpenUpload }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [form, setForm] = useState(() => ({ ...expense }));
  const formRef = useRef(form);
  formRef.current = form;
  const [auto, setAuto] = useState({});
  const [over, setOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setAuto((prev) => ({ ...prev, [key]: false }));
  }

  function split(mode) {
    const total = +form.total || 0;
    const half = Math.round(total * 50) / 100;
    setForm((prev) => ({
      ...prev,
      jose: mode === 'J' ? total : mode === 'H' ? half : 0,
      arnaldo: mode === 'A' ? total : mode === 'H' ? +(total - half).toFixed(2) : 0,
    }));
  }

  async function handleFile(next) {
    if (!next) return;
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next.type.startsWith('image/') ? URL.createObjectURL(next) : '';
    });
    setStatus({ text: 'Leyendo el recibo…' });
    try {
      const parsed = await readReceiptFile(next, expenses, (text) => setStatus({ text }));
      const duplicate = findDuplicate(parsed, expenses.filter((item) => item.id !== expense.id));
      const current = formRef.current;
      const patch = {};
      const marks = {};
      for (const key of READ_FIELDS) {
        const value = parsed[key];
        if (value == null || value === '') continue;
        if (key === 'cat' && value === 'Misceláneos' && current.cat !== 'Misceláneos') continue;
        patch[key] = key === 'total' ? (+value).toFixed(2) : value;
        marks[key] = true;
      }
      const filled = Object.keys(marks).length;
      setForm((prev) => ({ ...prev, ...patch }));
      setAuto((prev) => ({ ...prev, ...marks }));
      setStatus({
        text: filled
          ? `Se llenaron ${filled} campos. Revísalos antes de guardar.`
          : 'No se pudo leer información útil; llena los campos a mano.',
        warnNoTotal: parsed.total && !parsed.hasTotal,
        duplicate,
      });
    } catch (error) {
      setStatus({ error: error.message || String(error) });
    }
  }

  function save() {
    if (!String(form.desc || '').trim()) {
      alert('Falta la descripción');
      return;
    }
    onSave(
      {
        ...form,
        total: +form.total || 0,
        jose: +form.jose || 0,
        arnaldo: +form.arnaldo || 0,
      },
      file,
    );
  }

  const docs = DOCS.concat(PHOTOS.map((photo) => ['', photo[0], photo[1]]));
  const mark = (key) => (auto[key] ? 'auto' : undefined);

  return (
    <dialog ref={ref} onCancel={onClose}>
      <h3 style={{ marginTop: 0 }}>{expense.id ? 'Editar' : 'Nuevo'} gasto</h3>
      <div
        className={`drop${file || expense.upload ? ' has' : ''}${over ? ' over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
      >
        {preview ? <img className="th" src={preview} alt="" /> : file || expense.upload ? <span style={{ fontSize: 40 }}>📄</span> : null}
        <div>
          {file || expense.upload ? (
            <>
              <b>{file?.name || expense.upload.name}</b>
              {expense.upload && !file ? (
                <a
                  href="#recibo"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenUpload(expense.id);
                  }}
                >
                  {' '}
                  ver
                </a>
              ) : null}
              <div className="st">{status?.text || 'Haz clic o arrastra otro recibo para reemplazarlo y leerlo de nuevo'}</div>
            </>
          ) : (
            <>
              <div>
                📷 <b>Sube el recibo</b> (PDF o foto) y se llena automático
              </div>
              <div className="st">Haz clic o arrastra el archivo aquí</div>
            </>
          )}
          {status?.error ? (
            <div className="st" style={{ color: 'var(--neg)' }}>
              {status.error} — el archivo igual se guardará con el gasto.
            </div>
          ) : null}
          {status?.warnNoTotal ? (
            <div className="st" style={{ color: 'var(--acc2)' }}>
              No encontré la línea TOTAL; verifica el monto.
            </div>
          ) : null}
          {status?.duplicate ? (
            <div className="st" style={{ color: 'var(--neg)' }}>
              Posible duplicado: «{status.duplicate.desc}» {money(status.duplicate.total)} {status.duplicate.date}
            </div>
          ) : null}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <div className="form">
        <label>
          Categoría
          <select className={mark('cat')} value={form.cat} onChange={(event) => setField('cat', event.target.value)}>
            {CATS.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <input className={mark('date')} type="date" value={form.date || ''} onChange={(event) => setField('date', event.target.value)} />
        </label>
        <label>
          Descripción
          <input className={mark('desc')} value={form.desc || ''} onChange={(event) => setField('desc', event.target.value)} />
        </label>
        <label>
          Suplidor / tienda
          <input className={mark('vendor')} value={form.vendor || ''} onChange={(event) => setField('vendor', event.target.value)} />
        </label>
        <label>
          # Recibo
          <input className={mark('receipt')} value={form.receipt || ''} onChange={(event) => setField('receipt', event.target.value)} />
        </label>
        <label>
          Total ($)
          <input className={mark('total')} type="number" step="0.01" value={form.total} onChange={(event) => setField('total', event.target.value)} />
        </label>
        <label>
          Pagó Jose ($)
          <input type="number" step="0.01" value={form.jose} onChange={(event) => setField('jose', event.target.value)} />
        </label>
        <label>
          Pagó Arnaldo ($)
          <input type="number" step="0.01" value={form.arnaldo} onChange={(event) => setField('arnaldo', event.target.value)} />
        </label>
        <label className="span2">
          ¿Quién pagó?
          <span className="splits">
            <button type="button" className="btn sm" onClick={() => split('J')}>
              Jose
            </button>
            <button type="button" className="btn sm" onClick={() => split('H')}>
              50/50
            </button>
            <button type="button" className="btn sm" onClick={() => split('A')}>
              Arnaldo
            </button>
            <button type="button" className="btn sm" onClick={() => split('0')}>
              Sin pagar
            </button>
          </span>
        </label>
        <label>
          Documento de la carpeta
          <select value={form.file || ''} onChange={(event) => setField('file', event.target.value)}>
            <option value="">—</option>
            {docs.map((doc, index) => (
              <option key={`${doc[1]}-${index}`} value={doc[1]}>
                {doc[1]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Comentario
          <input className={mark('note')} value={form.note || ''} onChange={(event) => setField('note', event.target.value)} />
        </label>
        <label>
          ⚠ Para revisar (vacío = ok)
          <input value={form.check || ''} onChange={(event) => setField('check', event.target.value)} />
        </label>
      </div>
      <div className="tools" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <span>
          {expense.id ? (
            <button type="button" className="btn" style={{ color: 'var(--neg)' }} onClick={() => onDelete(expense.id)}>
              Borrar
            </button>
          ) : null}
        </span>
        <span>
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>{' '}
          <button className="btn p" type="button" onClick={save}>
            Guardar
          </button>
        </span>
      </div>
    </dialog>
  );
}
