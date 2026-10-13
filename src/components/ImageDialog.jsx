import { useEffect, useRef } from 'react';

export function ImageDialog({ src, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={ref} onClick={onClose} onClose={onClose}>
      <img src={src} alt="" style={{ width: '100%' }} />
    </dialog>
  );
}
