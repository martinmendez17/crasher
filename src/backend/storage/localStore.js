// Adaptador de almacenamiento.
// Hoy guarda en localStorage del navegador. Si en el futuro se agrega un
// servidor, basta con reemplazar este archivo (o la API) por llamadas fetch().

const PREFIX = "crasher00:v2:";

function safeStorage() {
  try {
    const s = window.localStorage;
    const probe = PREFIX + "__probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null; // modo privado o almacenamiento bloqueado: se trabaja en memoria
  }
}

const storage = typeof window !== "undefined" ? safeStorage() : null;
const memory = new Map();

export function read(key, fallback) {
  try {
    const raw = storage ? storage.getItem(PREFIX + key) : memory.get(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (storage) storage.setItem(PREFIX + key, raw);
    else memory.set(key, raw);
  } catch {
    memory.set(key, raw);
  }
}

export function remove(key) {
  try {
    if (storage) storage.removeItem(PREFIX + key);
  } catch {}
  memory.delete(key);
}

export function has(key) {
  try {
    return storage ? storage.getItem(PREFIX + key) !== null : memory.has(key);
  } catch {
    return false;
  }
}

/** Lee claves de la versión anterior (index.html único), sin prefijo. */
export function readLegacy(key) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const isPersistent = !!storage;
