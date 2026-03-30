import { fetchArkGrid } from "./arkgridAPI.js";

export async function renderArkGrid(name) {
  const container = document.createElement("div");

  let data;

  try {
    data = await fetchArkGrid(name);
  } catch (err) {
    console.error("ArkGrid fetch 실패:", err);
    container.innerText = "아크그리드 불러오기 실패";
    return container;
  }

  // ✅ 데이터 구조 안전 처리
  const slots = data?.Slots || [];
  const effects = data?.Effects || [];

  if (!Array.isArray(slots)) {
    console.error("Slots 데이터 이상:", data);
    container.innerText = "데이터 형식 오류";
    return container;
  }

  // =========================
  // 🎯 GRID UI
  // =========================
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(6, 1fr)";
  grid.style.gap = "8px";

  slots.forEach(slot => {
    const slotEl = document.createElement("div");

    slotEl.style.border = "1px solid #ccc";
    slotEl.style.padding = "8px";
    slotEl.style.borderRadius = "6px";
    slotEl.style.textAlign = "center";
    slotEl.style.background = "#1e1e1e";
    slotEl.style.color = "#fff";

    // Gems 존재할 경우 표시
    const gemsHtml = (slot.Gems || [])
      .map(g => `
        <div style="margin-top:4px; font-size:12px;">
          ${g.IsActive ? "🟢" : "⚪"} ${g.Grade}
        </div>
      `)
      .join("");

    slotEl.innerHTML = `
      <img src="${slot.Icon}" width="40" height="40" />
      <div style="font-size:12px;">${slot.Name || ""}</div>
      <div style="font-size:12px;">P: ${slot.Point}</div>
      <div style="font-size:12px;">${slot.Grade || ""}</div>
      ${gemsHtml}
    `;

    grid.appendChild(slotEl);
  });

  container.appendChild(grid);

  // =========================
  // 🎯 EFFECTS UI
  // =========================
  const effectBox = document.createElement("div");
  effectBox.style.marginTop = "16px";
  effectBox.style.padding = "10px";
  effectBox.style.border = "1px solid #444";

  const effectTitle = document.createElement("div");
  effectTitle.innerText = "Effects";
  effectTitle.style.marginBottom = "8px";
  effectTitle.style.fontWeight = "bold";

  effectBox.appendChild(effectTitle);

  effects.forEach(e => {
    const el = document.createElement("div");
    el.style.fontSize = "13px";
    el.innerText = `${e.Name} (Lv.${e.Level})`;
    effectBox.appendChild(el);
  });

  container.appendChild(effectBox);

  return container;
}