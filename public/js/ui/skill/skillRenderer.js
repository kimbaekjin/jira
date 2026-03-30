import { fetchSkills } from "./skillAPI.js";

export async function renderSkills(name) {
  const container = document.createElement("div");
  let data;

  try {
    data = await fetchSkills(name);
    console.log(data);
  } catch (err) {
    console.error("Skills fetch 실패:", err);
    container.innerText = "스킬 불러오기 실패";
    return container;
  }

  const skills = (data?.Skills || data || [])
  .filter(skill => (skill.Level || 0) >= 4);

  if (!Array.isArray(skills)) {
    console.error("Skills 데이터 이상:", data);
    container.innerText = "데이터 형식 오류";
    return container;
  }

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(6, 1fr)";
  grid.style.gap = "8px";

  skills.forEach(skill => {
    const slot = document.createElement("div");

    slot.style.border = "1px solid #ccc";
    slot.style.padding = "8px";
    slot.style.borderRadius = "6px";
    slot.style.textAlign = "center";
    slot.style.background = "#1e1e1e";
    slot.style.color = "#fff";

    const gemsHtml = `
      <div style="margin-top:4px; font-size:12px;">
        ${skill.IsActive ? "🟢" : "⚪"} ${skill.Type || ""}
      </div>
    `;

    slot.innerHTML = `
      <img src="${skill.Icon}" width="40" height="40" />
      <div style="font-size:12px;">${skill.Name || ""}</div>
      <div style="font-size:12px;">Lv. ${skill.Level || 0}</div>
      ${gemsHtml}
    `;

    grid.appendChild(slot);
  });

  container.appendChild(grid);

  // 🔥 이거 추가해야 함
  return container;
}