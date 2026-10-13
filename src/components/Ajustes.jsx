export function Ajustes({ settings, syncInfo, onSetting, onSync, onPick, onUnlink, onBackup, onRestore, onExport, onReset }) {
  const field = (key, label) => (
    <label>
      {label}
      <input type="number" value={settings[key]} onChange={(e) => onSetting(key, +e.target.value)} />
    </label>
  );

  return (
    <>
      <div className="card">
        <h3>Supuestos de la venta</h3>
        <div className="form">
          {field('salePrice', 'Precio de venta meta ($)')}
          {field('commissionPct', 'Comisión corredor (%)')}
          {field('sellerClosing', 'Gastos de cierre del vendedor ($)')}
          {field('renoBudget', 'Presupuesto remodelación ($)')}
          {field('targetRoi', 'ROI meta (%)')}
          <label>
            Repartir ganancia
            <select value={settings.profitSplit} onChange={(e) => onSetting('profitSplit', e.target.value)}>
              <option value="capital">Según capital aportado</option>
              <option value="50">50 / 50</option>
            </select>
          </label>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Sincronización con Excel</h3>
        <p className="mute">
          La app y el Excel se mantienen iguales. En el Excel se usa la hoja <b>«Proyeccion»</b> (la app le añade las columnas «Categoría» e «ID App»); los supuestos de venta están en <b>«Resumen (App)»</b>. La compra y el cierre se manejan aquí en la app. Si cambias algo aquí, se escribe en el Excel; si cambias el Excel, se trae aquí al presionar 🔄 o al volver a esta ventana.
        </p>
        <div className="tools">
          <button className="btn p" type="button" onClick={onSync}>
            🔄 Sincronizar ahora
          </button>
          <button className="btn" type="button" onClick={onPick}>
            Escoger otro archivo de Excel
          </button>
          <button className="btn" type="button" onClick={onUnlink}>
            Desconectar
          </button>
        </div>
        <div className="mute" style={{ fontSize: 12.5 }}>
          {syncInfo}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Respaldo de datos</h3>
        <p className="mute">Los datos se guardan en este navegador. Exporta un respaldo (.json) para que tu socio lo pueda importar en su computadora.</p>
        <div className="tools">
          <button className="btn p" type="button" onClick={onBackup}>
            Descargar respaldo
          </button>
          <label className="btn file-btn">
            Importar respaldo
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onRestore(file);
              }}
            />
          </label>
          <button className="btn" type="button" onClick={onExport}>
            Exportar gastos a Excel (CSV)
          </button>
          <button className="btn" type="button" onClick={onReset}>
            Restaurar datos originales
          </button>
        </div>
      </div>
    </>
  );
}
