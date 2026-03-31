const arkPassiveCache = new Map();

export async function fetchArkPassive(name) {
  const key = `${name}-arkpassive`;
  const now = Date.now();

  if (arkPassiveCache.has(key)) {
    const cached = arkPassiveCache.get(key);
    if (now - cached.time < 30000) {
      return cached.data;
    }
  }

  const res = await fetch(`/api/armories/${name}/arkpassive`);
  const data = await res.json();

  arkPassiveCache.set(key, { data, time: now });

  return data;
}
