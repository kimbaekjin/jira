const armoryCache = new Map();

export async function fetchEquipment(name) {
  const key = `${name}-equipment`;
  const now = Date.now();

  if (armoryCache.has(key)) {
    const cached = armoryCache.get(key);
    if (now - cached.time < 30000) {
      return cached.data;
    }
  }

  const res = await fetch(`/api/armories/${name}/equipment`);
  const data = await res.json();

  const filtered = data.filter(item =>
    !item.Name.includes("용사의 문장")
  );

  armoryCache.set(key, { data: filtered, time: now });

  return filtered;
}