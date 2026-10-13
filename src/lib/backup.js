export function download(name, data, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 15000);
}

const toDataURL = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

export async function buildBackup(state) {
  const files = {};
  const { idb } = await import('./idb');
  for (const expense of state.expenses.filter((e) => e.upload)) {
    try {
      const blob = await idb('get', expense.id);
      if (blob) files[expense.id] = await toDataURL(blob);
    } catch {
      /* el recibo no está en este navegador */
    }
  }
  return JSON.stringify({ ...state, files });
}

export async function readBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data.expenses) throw new Error('Archivo no válido');
  const files = data.files || {};
  delete data.files;
  const { idb } = await import('./idb');
  for (const [id, url] of Object.entries(files)) {
    try {
      await idb('put', +id, await (await fetch(url)).blob());
    } catch {
      /* se omite un archivo dañado */
    }
  }
  return data;
}
