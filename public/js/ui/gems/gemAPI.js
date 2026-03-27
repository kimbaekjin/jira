const armoryCache = new Map();

export async function fetchArmory(name, type) {
  const key = `${name}-${type}`;
  const now = Date.now();

  if (armoryCache.has(key)) {
    const cached = armoryCache.get(key);
    if (now - cached.time < 30000) {
      console.log("캐시 사용:", key);
      return cached.data;
    }
  }

  const res = await fetch(`/api/armories/${name}/${type}`);
  const data = await res.json();

  armoryCache.set(key, {
    data,
    time: now
  });

  return data;
}