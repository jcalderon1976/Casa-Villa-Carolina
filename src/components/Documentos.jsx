import { DOCS, fileHref } from '../data';

export function Documentos() {
  const groups = {};
  DOCS.forEach((doc) => {
    groups[doc[0]] = groups[doc[0]] || [];
    groups[doc[0]].push(doc);
  });

  return (
    <>
      <p className="mute">Los enlaces abren los archivos de la carpeta public del proyecto. Mantén los PDF y las fotos junto a la app.</p>
      <div className="grid k2">
        {Object.entries(groups).map(([group, docs]) => (
          <div className="card" key={group}>
            <h3>{group}</h3>
            {docs.map(([, file, label]) => (
              <div className="doc" key={file}>
                {/\.pdf$/i.test(file) ? '📄' : '🖼️'}
                <a href={fileHref(file)} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
