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

  armoryCache.set(key, { data, time: now });
  console.log(data[12])
  return data;
}