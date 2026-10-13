import { PHOTOS, fileHref } from '../data';

export function Fotos({ onOpen }) {
  return (
    <div className="gal">
      {PHOTOS.map(([file, label]) => (
        <figure key={file}>
          <img loading="lazy" src={fileHref(file)} alt={label} onClick={() => onOpen(fileHref(file))} />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
