import { fetchArkGrid } from "./arkgridAPI.js";

/* =========================
   유틸
========================= */

function cleanText(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/* =========================
   등급 색상
========================= */

const getGradeColor = (grade) => {
  switch (grade) {
    case "고대":
      return "#C9A472";
    case "유물":
      return "#E88A50";
    case "전설":
      return "#ffcc00";
    case "영웅":
      return "#C07FE0";
    default:
      return "#888";
  }
};

/* =========================
   🔥 Tooltip 파싱 (핵심 수정)
========================= */

function parseTooltip(tooltipStr) {
  if (!tooltipStr) return null;

  try {
    const data = JSON.parse(tooltipStr);

    let result = [];

    Object.values(data).forEach((el) => {
      if (!el?.value) return;

      const val = el.value;

      // 👉 ItemPartBox만 사용
      if (typeof val === "object" && val.Element_001) {
        const text = val.Element_001;

        // 🔥 핵심: [숫자P] 있는 것만 남김
        if (/\[\d+P\]/.test(text)) {
          result.push(text);
        }
      }
    });

    return result.join("<br>");
  } catch (err) {
    console.error("Tooltip parse 실패:", err);
    return null;
  }
}

/* =========================
   🔥 블록 분리 (진짜 핵심)
========================= */

function splitCoreBlocks(html) {
  if (!html) return [];

  // [10P], [14P] 기준 split
  const parts = html.split(/(?=<FONT color='#FFD200'>\[\d+P\])/g);

  return parts
    .map((part) => {
      const match = part.match(/\[(\d+)P\]/);
      const level = match ? Number(match[1]) : 0;

      return {
        level,
        content: cleanText(part)
      };
    })
    .filter((b) => b.content);
}

/* =========================
   🔥 렌더링 (강조 + 줄바꿈)
========================= */

function renderBlocks(blocks, currentPoint) {
  return blocks
    .map((block) => {
      const isActive = block.level <= currentPoint;

      return `
        <div style="
          background: rgba(255,204,0,0.05);
          border: 1px solid ${isActive ? "#ffcc00" : "#555"};
          border-radius: 6px;
          padding: 6px;
          margin-bottom: 6px;
          line-height: 1.4;
          color: ${isActive ? "#ffcc00" : "#ccc"};
          text-shadow: ${isActive ? "0 0 4px #ffcc00" : "none"};
          font-weight: ${isActive ? "bold" : "normal"};
          white-space: pre-line;
        ">
          ${block.content}
        </div>
      `;
    })
    .join("");
}

/* =========================
   Tooltip
========================= */

function attachTooltip(el, content) {
  const tooltip = document.createElement("div");

  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(20,20,20,0.95)";
  tooltip.style.border = "1px solid #555";
  tooltip.style.padding = "10px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.color = "#fff";
  tooltip.style.whiteSpace = "normal";
  tooltip.style.display = "none";
  tooltip.style.zIndex = 9999;
  tooltip.style.maxWidth = "320px";
  tooltip.style.lineHeight = "1.4";

  tooltip.innerHTML = content || "정보 없음";

  document.body.appendChild(tooltip);

  el.addEventListener("mouseenter", () => {
    tooltip.style.display = "block";
  });

  el.addEventListener("mousemove", (e) => {
    tooltip.style.left = e.pageX + 10 + "px";
    tooltip.style.top = e.pageY + 10 + "px";
  });

  el.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
}

/* =========================
   슬롯 카드
========================= */

function createSlotCard(slot) {
  const gradeColor = getGradeColor(slot.Grade);
  const card = document.createElement("div");

  card.style.background = "#1c1c1c";
  card.style.border = "1px solid #333";
  card.style.borderRadius = "10px";
  card.style.padding = "10px";
  card.style.color = "#fff";
  card.style.fontSize = "12px";
  card.style.cursor = "pointer";

  if (slot.IsActive) {
    card.style.background = "rgba(255,204,0,0.12)";
    card.style.border = "1px solid #ffcc00";
  }

  // 🔥 Tooltip 파싱 → HTML 추출
  const rawHtml = parseTooltip(slot.Tooltip);

  // 🔥 블록 분리
  const blocks = splitCoreBlocks(rawHtml);

  const tooltipHtml =
    blocks.length > 0
      ? renderBlocks(blocks, slot.Point || 0)
      : "정보 없음";

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
      <span style="
        background: ${gradeColor};
        color:#000;
        font-weight:bold;
        font-size:11px;
        padding:2px 6px;
        border-radius:4px;
      ">
        ${slot.Grade || "일반"}
      </span>

      <span style="
        background:#3a82f7;
        color:#fff;
        font-weight:bold;
        font-size:11px;
        padding:2px 6px;
        border-radius:4px;
      ">
        ${slot.Point || 0}P
      </span>
    </div>

    <div style="display:flex; gap:10px; align-items:center;">
      <img src="${slot.Icon}" width="40" height="40"/>
      <div style="
        font-weight:bold;
        color:${gradeColor};
        ${slot.IsActive ? `text-shadow:0 0 4px ${gradeColor};` : ""}
      ">
        ${slot.Name || ""}
      </div>
    </div>
  `;

  attachTooltip(card, tooltipHtml);

  return card;
}

/* =========================
   메인
========================= */

export async function renderArkGrid(name) {
  const container = document.createElement("div");

  let data;

  try {
    data = await fetchArkGrid(name);
  } catch (err) {
    container.innerText = "아크그리드 불러오기 실패";
    return container;
  }

  const slots = data?.Slots || [];
  const effects = data?.Effects || [];

  if (!Array.isArray(slots)) {
    container.innerText = "데이터 형식 오류";
    return container;
  }

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr";
  grid.style.gap = "10px";

  slots.forEach((slot) => {
    grid.appendChild(createSlotCard(slot));
  });

  container.appendChild(grid);

  /* EFFECTS */
  const effectBox = document.createElement("div");
  effectBox.style.marginTop = "20px";
  effectBox.style.padding = "10px";
  effectBox.style.border = "1px solid #444";

  effectBox.innerHTML = `<b>Effects</b>`;

  effects.forEach((e) => {
    const el = document.createElement("div");
    el.innerText = `${e.Name} (Lv.${e.Level})`;
    effectBox.appendChild(el);
  });

  container.appendChild(effectBox);

  return container;
}