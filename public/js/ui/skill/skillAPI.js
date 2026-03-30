export async function fetchSkills(name) {
  const res = await fetch(`/api/armories/${encodeURIComponent(name)}/combat-skills`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}