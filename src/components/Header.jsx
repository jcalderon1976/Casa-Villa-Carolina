import { TABS } from '../data';

export function Header({ tab, onTab, onSync, syncMsg, syncErr }) {
  return (
    <header>
      <div>
        <h1>🏠 Casa Villa Carolina</h1>
        <small>Solar #3 Manzana 202, Urb. Villa Carolina · Flip — Jose Javier Calderon & Arnaldo Aponte</small>
      </div>
      <div className="header-actions">
        <nav>
          {Object.entries(TABS).map(([key, label]) => (
            <button key={key} className={key === tab ? 'on' : ''} onClick={() => onTab(key)} type="button">
              {label}
            </button>
          ))}
        </nav>
        <button className="btn" type="button" onClick={onSync} title="Sincronizar con el Excel">
          🔄 Sincronizar Excel
        </button>
        <small className="mute" style={syncErr ? { color: 'var(--neg)' } : undefined}>
          {syncMsg}
        </small>
      </div>
    </header>
  );
}
