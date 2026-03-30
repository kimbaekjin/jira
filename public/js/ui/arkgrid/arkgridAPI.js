export async function fetchArkGrid(name) {
  const res = await fetch(`/api/armories/${name}/arkgrid`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return await res.json();
}