export function idb(op, key, val) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('villaCarolina', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const store = request.result
        .transaction('files', op === 'get' ? 'readonly' : 'readwrite')
        .objectStore('files');
      const query = op === 'put' ? store.put(val, key) : store[op](key);
      query.onsuccess = () => resolve(query.result);
      query.onerror = () => reject(query.error);
    };
  });
}

export async function openUpload(id) {
  try {
    const blob = await idb('get', id);
    if (!blob) throw new Error('missing');
    window.open(URL.createObjectURL(blob), '_blank');
  } catch {
    alert('El archivo del recibo no está en este navegador. Importa un respaldo que lo incluya.');
  }
}
