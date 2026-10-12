// Tiny external-store helper so mock services can notify React without a
// state library. Each service bumps its own channel; hooks subscribe with
// useSyncExternalStore. No backend dependency.

const channels = new Map();

function getChannel(name) {
  if (!channels.has(name)) channels.set(name, { version: 0, listeners: new Set() });
  return channels.get(name);
}

export function notify(channel) {
  const ch = getChannel(channel);
  ch.version += 1;
  ch.listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* listener errors must never break the store */
    }
  });
}

export function subscribeTo(channel, listener) {
  const ch = getChannel(channel);
  ch.listeners.add(listener);
  return () => ch.listeners.delete(listener);
}

export function snapshotOf(channel) {
  return getChannel(channel).version;
}

function hasStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function readJSON(key, fallback) {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / blocked — mock layer stays in memory only */
  }
}

export function removeKey(key) {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
