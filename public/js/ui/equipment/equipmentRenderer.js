import { fetchEquipment } from "./equipmentAPI.js";
import { parseEquipmentTooltip } from "./equipmentParser.js";

const OPTION_TABLE = {
  목걸이: {
    "추가 피해 %": { high: 2.60, mid: 1.60, low: 0.70 },
    "적에게 주는 피해 %": { high: 2.00, mid: 1.20, low: 0.55 },
    "낙인력 %": { high: 8.00, mid: 4.80, low: 2.15 },
    "세레나데, 신앙, 조화 게이지 획득량 %": { high: 6.00, mid: 3.60, low: 1.60 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명 회복략 +": { high: 50, mid: 25, low: 10 }
  },
  귀걸이: {
    "공격력 %": { high: 1.55, mid: 0.95, low: 0.40 },
    "무기 공격력 %": { high: 3.00, mid: 1.80, low: 0.80 },
    "무기 공격력 +": { high: 960, mid: 480, low: 195 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명 회복략 +": { high: 50, mid: 25, low: 10 }
  },
  반지: {
    "치명타 피해 %": { high: 4.00, mid: 2.40, low: 1.10 },
    "아군 피해량 강화 효과%": { high: 7.50, mid: 4.50, low: 2.00 },
    "아군 공격력 강화 효과 %": { high: 5.00, mid: 3.00, low: 1.35 },
    "치명타 적중률 %": { high: 1.55, mid: 0.95, low: 0.40 },
    "무기 공격력 +": { high: 960, mid: 480, low: 195 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명 회복략 +": { high: 50, mid: 25, low: 10 }
  }
};

function splitTooltipData(type, stats) {
  const baseStats = [];
  const options = [];

  stats.forEach(stat => {
    if (
      stat.includes("힘") ||
      stat.includes("민") ||
      stat.includes("지능") ||
      stat.includes("체력")
    ) {
      baseStats.push(stat);
    } else {
      options.push(stat);
    }
  });

  return { baseStats, options };
}

function getColor(type, stat) {
  const table = OPTION_TABLE[type];
  if (!table) return "#ddd";

  const match = stat.match(/(.+?)\s*\+([\d.]+)(%?)/);
  if (!match) return "#ddd";

  let name = match[1].trim();
  let value = parseFloat(match[2]);

  const key = Object.keys(table).find(k => k.startsWith(name));
  if (!key) return "#ddd";

  const opt = table[key];

  if (value >= opt.high) return "#ff922b";
  if (value >= opt.mid) return "#845ef7";
  if (value >= opt.low) return "#339af0";

  return "#adb5bd";
}

export async function renderEquipment(name) {
  const wrapper = document.createElement("div");
  const data = await fetchEquipment(name);

  if (!data || data.length === 0) {
    wrapper.innerHTML = "<div>장비 없음</div>";
    return wrapper;
  }

  const filtered = data.filter(item =>
    !["나침반", "부적", "보주"].includes(item.Type)
  );

  const leftOrder = ["무기","투구","어깨","상의","하의","장갑"];
  const rightOrder = ["목걸이","귀걸이","귀걸이","반지","반지","어빌리티 스톤","팔찌"];

  const left = [];
  const right = [];

  filtered.forEach(item => {
    if (leftOrder.includes(item.Type)) left.push(item);
    else right.push(item);
  });

  left.sort((a,b)=>leftOrder.indexOf(a.Type)-leftOrder.indexOf(b.Type));
  right.sort((a,b)=>rightOrder.indexOf(a.Type)-rightOrder.indexOf(b.Type));

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";

  const maxLength = Math.max(left.length, right.length);

  for (let i = 0; i < maxLength; i++) {
    const leftCell = document.createElement("div");
    if (left[i]) leftCell.appendChild(createItem(left[i]));

    const rightCell = document.createElement("div");
    if (right[i]) rightCell.appendChild(createItem(right[i]));

    grid.appendChild(leftCell);
    grid.appendChild(rightCell);
  }

  wrapper.appendChild(grid);
  return wrapper;
}

function createItem(item) {
  const { name, quality, type, icon, stoneEngravings = [], accessoryStats = [] } =
    parseEquipmentTooltip(item);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.marginBottom = "8px";

  const box = document.createElement("div");
  box.style.width = "50px";
  box.style.height = "50px";
  box.style.display = "flex";
  box.style.alignItems = "center";
  box.style.justifyContent = "center";
  box.style.position = "relative";

  box.style.background = "radial-gradient(circle at 30% 30%, #ffe0e9, #ff8fab)";
  box.style.border = "1px solid #d4af37";
  box.style.borderRadius = "6px";
  box.style.boxShadow = "0 0 6px rgba(212,175,55,0.6), inset 0 0 6px rgba(255,215,0,0.3)";

  const img = document.createElement("img");
  img.src = icon;
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";
  img.style.objectFit = "contain";
  img.style.filter = "brightness(1.1) contrast(1.1)";

  box.appendChild(img);

  if (quality > 0) {
    const q = document.createElement("div");
    q.innerText = quality;
    q.style.position = "absolute";
    q.style.bottom = "2px";
    q.style.right = "4px";
    q.style.fontSize = "11px";
    box.appendChild(q);
  }

  const nameEl = document.createElement("div");
  nameEl.innerText = name;

  row.appendChild(box);
  row.appendChild(nameEl);

  // ================= TOOLTIP =================
  if (
    type === "어빌리티 스톤" ||
    ["목걸이","귀걸이","반지","팔찌"].includes(type)
  ) {
    const tooltip = document.createElement("div");

    tooltip.style.position = "fixed";
    tooltip.style.background = "#1e1e1e";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "8px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.fontSize = "12px";
    tooltip.style.display = "none";
    tooltip.style.zIndex = "9999";
    tooltip.style.pointerEvents = "none";

    // 스톤
    if (type === "어빌리티 스톤") {
      const positive = stoneEngravings.filter(e => !e.name.includes("감소"));
      const negative = stoneEngravings.filter(e => e.name.includes("감소"));

      tooltip.innerHTML = `
        <div style="color:#4dabf7; font-weight:bold;">각인 효과</div>
        ${positive.map(e => `<div>${e.name} Lv.${e.level}</div>`).join("")}
        <div style="margin-top:6px; color:#ff6b6b; font-weight:bold;">감소 효과</div>
        ${negative.map(e => `<div>${e.name} Lv.${e.level}</div>`).join("")}
      `;
    }

    // 팔찌
    else if (type === "팔찌") {
      const tooltipObj =
        typeof item.Tooltip === "string"
          ? JSON.parse(item.Tooltip)
          : item.Tooltip;

      const raw =
        tooltipObj?.Element_005?.value?.Element_001 || "";

      const clean = raw
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");

      const lines = clean
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

      const baseStats = [];
      const options = [];

      lines.forEach(line => {
        if (
          line.includes("힘") ||
          line.includes("민") ||
          line.includes("지능") ||
          line.includes("체력") ||
          line.includes("신속") ||
          line.includes("치명") ||
          line.includes("특화")
        ) {
          baseStats.push(line);
        } else {
          options.push(line);
        }
      });

      tooltip.innerHTML = `
        <div style="margin-bottom:6px; font-weight:bold; color:#ffd43b;">
          기본 능력치
        </div>

        ${baseStats.map(s => `<div style="color:#4dabf7">${s}</div>`).join("")}

        <div style="margin-top:6px; margin-bottom:6px; font-weight:bold; color:#74c0fc;">
          팔찌 효과
        </div>

        ${options.map(s => `<div style="color:#ff922b">${s}</div>`).join("")}
      `;
    }

    // 악세
    else {
      const { baseStats, options } = splitTooltipData(type, accessoryStats);

      tooltip.innerHTML = `
        <div style="margin-bottom:6px; font-weight:bold; color:#ffd43b;">
          기본 능력치
        </div>

        ${baseStats.map(stat => {
          const color = getColor(type, stat);
          return `<div style="color:${color}">${stat}</div>`;
        }).join("")}

        <div style="margin-top:6px; margin-bottom:6px; font-weight:bold; color:#74c0fc;">
          연마 효과
        </div>

        ${options.map(stat => {
          const color = getColor(type, stat);
          return `<div style="color:${color}">${stat}</div>`;
        }).join("")}
      `;
    }

    document.body.appendChild(tooltip);

    row.addEventListener("mouseenter", () => {
      tooltip.style.display = "block";
    });

    row.addEventListener("mousemove", (e) => {
      tooltip.style.left = e.clientX + 10 + "px";
      tooltip.style.top = e.clientY + 10 + "px";
    });

    row.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  }

  return row;
}

function getQualityTextColor(q) {
  if (q >= 90) return "#a855f7";
  if (q >= 70) return "#4dabf7";
  if (q >= 40) return "#40c057";
  return "#ffd43b";
}