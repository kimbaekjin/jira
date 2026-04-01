import { fetchArkGrid } from "./arkgridAPI.js";

/* =========================
   유틸
========================= */

function cleanText(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img[^>]*>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/* =========================
   등급 색상
========================= */

const getGradeColor = (grade) => {
  switch (grade) {
    case "고대": return "#C9A472";
    case "유물": return "#E88A50";
    case "전설": return "#ffcc00";
    case "영웅": return "#C07FE0";
    default: return "#888";
  }
};

/* =========================
   🔥 Tooltip (fixed 버전)
========================= */

let tooltipEl;
let tooltipOwner = null;

function getTooltip() {
  if (tooltipEl) return tooltipEl;

  tooltipEl = document.createElement("div");

  // 🔥 핵심 변경
  tooltipEl.style.position = "fixed";

  tooltipEl.style.background = "rgba(255,240,245,0.97)";
  tooltipEl.style.border = "1px solid #ffb6c1";
  tooltipEl.style.padding = "12px";
  tooltipEl.style.borderRadius = "10px";
  tooltipEl.style.fontSize = "12px";
  tooltipEl.style.color = "#333";
  tooltipEl.style.display = "none";
  tooltipEl.style.zIndex = 9999;
  tooltipEl.style.maxWidth = "320px";
  tooltipEl.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  tooltipEl.style.pointerEvents = "none";

  document.body.appendChild(tooltipEl);

  // 🔥 ESC → 완전 제거
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
      tooltipOwner = null;
    }
  });

  return tooltipEl;
}

function attachTooltip(el, content) {
  const tooltip = getTooltip();

  el.addEventListener("mouseenter", () => {
    tooltipOwner = el;
    tooltip.innerHTML = content || "정보 없음";
    tooltip.style.display = "block";
  });

  el.addEventListener("mousemove", (e) => {
    if (tooltipOwner !== el) return;

    const rect = tooltip.getBoundingClientRect();
    const tooltipWidth = rect.width;
    const tooltipHeight = rect.height;

    // 🔥 핵심 변경 (client 기준)
    let left = e.clientX + 12;
    let top = e.clientY + 12;

    // 🔽 아래 넘치면 → 위로
    if (top + tooltipHeight > window.innerHeight) {
      top = e.clientY - tooltipHeight - 12;
    }

    if (top < 0) {
      top = 5;
    }

    // 👉 오른쪽 넘치면 → 왼쪽
    if (left + tooltipWidth > window.innerWidth) {
      left = e.clientX - tooltipWidth - 12;
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  });

  el.addEventListener("mouseleave", () => {
    if (tooltipOwner !== el) return;

    tooltip.style.display = "none";
    tooltipOwner = null;
  });
}

/* =========================
   이하 전부 그대로
========================= */

/* =========================
   코어 Tooltip
========================= */

function parseTooltip(str) {
  if (!str) return null;

  try {
    const data = JSON.parse(str);
    let result = [];

    Object.values(data).forEach((el) => {
      if (!el?.value) return;

      if (typeof el.value === "object" && el.value.Element_001) {
        const text = el.value.Element_001;
        if (/\[\d+P\]/.test(text)) result.push(text);
      }
    });

    return result.join("<br>");
  } catch {
    return null;
  }
}

function splitCoreBlocks(html) {
  if (!html) return [];

  return html.split(/(?=<FONT color='#FFD200'>\[\d+P\])/g)
    .map((part) => {
      const match = part.match(/\[(\d+)P\]/);
      return {
        level: match ? Number(match[1]) : 0,
        content: cleanText(part)
      };
    });
}

function renderBlocks(blocks, point) {
  return blocks.map(b => {
    const active = b.level <= point;

    return `
      <div style="
        background:#000;
        border:1px solid #333;
        border-radius:6px;
        padding:6px;
        margin-bottom:6px;
        color:${active ? "#ffcc00" : "#aaa"};
        font-weight:${active ? "bold" : "normal"};
        white-space:pre-line;
      ">
        ${b.content}
      </div>
    `;
  }).join("");
}

/* =========================
   젬 Tooltip
========================= */

function parseGemEffects(raw) {
  const text = cleanText(raw);
  const lines = text.split("\n").filter(Boolean);

  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[(.+?)\]\s*Lv\.(\d+)/);
    if (m) {
      result.push({
        name: m[1],
        level: m[2],
        desc: lines[i + 1] || ""
      });
    }
  }

  return result;
}

function parseGemTooltip(str) {
  try {
    const data = JSON.parse(str);

    let name = "";
    let basic = "";
    let effects = [];

    Object.values(data).forEach((el) => {
      if (!el) return;

      if (el.type === "NameTagBox") {
        name = cleanText(el.value);
      }

      if (el.type === "ItemPartBox") {
        const title = el.value.Element_000;

        if (title.includes("기본")) {
          basic = cleanText(el.value.Element_001);
        }

        if (title.includes("효과")) {
          effects = parseGemEffects(el.value.Element_001);
        }
      }
    });

    return `
      <div style="font-weight:bold; margin-bottom:6px;">${name}</div>
      <div style="margin-bottom:6px;">${basic}</div>
      ${effects.map(e => `
        <div style="margin-bottom:4px;">
          <b>[${e.name}] Lv.${e.level}</b><br/>
          ${e.desc}
        </div>
      `).join("")}
    `;
  } catch {
    return "젬 정보 없음";
  }
}

/* =========================
   젬 UI
========================= */

function renderGems(gems) {
  if (!gems?.length) return "";

  return `
    <div style="margin-top:10px; display:flex; gap:6px;">
      ${gems.map((g, i) => `
        <div data-gem="${i}" style="
          background:#111;
          border:1px solid ${g.IsActive ? "#ffcc00" : "#333"};
          border-radius:6px;
          padding:4px;
          cursor:pointer;
        ">
          <img src="${g.Icon}" width="22" height="22"/>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================
   슬롯 카드
========================= */

function createSlotCard(slot) {
  const card = document.createElement("div");
  const gradeColor = getGradeColor(slot.Grade);

  const coreHtml = parseTooltip(slot.Tooltip);
  const blocks = splitCoreBlocks(coreHtml);
  const tooltipHtml = renderBlocks(blocks, slot.Point || 0);

  const gems = slot.Gems || [];

    card.style.background = `
      linear-gradient(145deg, #1a1a1a, #111),
      radial-gradient(circle at 80% 20%, rgba(255,204,0,0.15), transparent 60%)
    `;
  card.style.border = "1px solid #2a2a2a";
  card.style.borderRadius = "14px";
  card.style.padding = "12px";
  card.style.color = "#fff";

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between;">
      <span style="background:linear-gradient(135deg, ${gradeColor}, #222); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">
        ${slot.Grade}
      </span>

      <span style="background:#2d2d2d; color:#ffcc00; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">
        ${slot.Point}P
      </span>
    </div>

    <div style="display:flex; gap:10px; margin-top:8px;">
      <img src="${slot.Icon}" width="40"/>
      <div style="color:${gradeColor}; font-weight:bold;">
        ${slot.Name}
      </div>
    </div>

    ${renderGems(gems)}
  `;

  attachTooltip(card, tooltipHtml);

  // 🔥 카드 hover 시 젬 → 카드 복구
  card.addEventListener("mousemove", (e) => {
    const isGem = e.target.closest("[data-gem]");
    if (isGem) return;

    if (tooltipOwner !== card) {
      const tooltip = getTooltip();
      tooltipOwner = card;
      tooltip.innerHTML = tooltipHtml || "정보 없음";
      tooltip.style.display = "block";
    }
  });

  // 🔥 젬 tooltip
  setTimeout(() => {
    const gemEls = card.querySelectorAll("[data-gem]");

    gemEls.forEach((el) => {
      const gem = gems[el.dataset.gem];
      if (!gem) return;

      attachTooltip(el, parseGemTooltip(gem.Tooltip));
    });
  }, 0);

  return card;
}

/* =========================
   메인
========================= */

export async function renderArkGrid(name) {
  const container = document.createElement("div");

  const data = await fetchArkGrid(name);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gap = "12px";

  (data.Slots || []).forEach(slot => {
    grid.appendChild(createSlotCard(slot));
  });

  container.appendChild(grid);

  return container;
}