import { fetchEquipment } from "./equipmentAPI.js";
import { parseEquipmentTooltip } from "./equipmentParser.js";

const OPTION_TABLE = {
  목걸이: {
    "추가 피해 %": { high: 2.60, mid: 1.60, low: 0.70 },
    "적에게 주는 피해 %": { high: 2.00, mid: 1.20, low: 0.55 },
    "낙인력 %": { high: 8.00, mid: 4.80, low: 2.15 },
    "세레나데, 신앙, 조화 게이지 획득량 %": { high: 6.00, mid: 3.60, low: 1.60 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "무기 공격력 +": { high: 960, mid: 480, low: 195 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명력 회복량 +": { high: 50, mid: 25, low: 10 }
  },
  귀걸이: {
    "공격력 %": { high: 1.55, mid: 0.95, low: 0.40 },
    "파티원 보호막 효과 %": { high: 3.50, mid: 2.10, low: 0.95 },
    "파티원 회복 효과 %": { high: 3.50, mid: 2.10, low: 0.95 },
    "무기 공격력 %": { high: 3.00, mid: 1.80, low: 0.80 },
    "무기 공격력 +": { high: 960, mid: 480, low: 195 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명력 회복량 +": { high: 50, mid: 25, low: 10 }
  },
  반지: {
    "치명타 피해 %": { high: 4.00, mid: 2.40, low: 1.10 },
    "아군 피해량 강화 효과 %": { high: 7.50, mid: 4.50, low: 2.00 },
    "아군 공격력 강화 효과 %": { high: 5.00, mid: 3.00, low: 1.35 },
    "치명타 적중률 %": { high: 1.55, mid: 0.95, low: 0.40 },
    "무기 공격력 +": { high: 960, mid: 480, low: 195 },
    "공격력 +": { high: 390, mid: 195, low: 80 },
    "최대 생명력 +": { high: 6500, mid: 3250, low: 1300 },
    "최대 마나 +": { high: 30, mid: 15, low: 6 },
    "상태이상 공격 지속시간 %": { high: 1.00, mid: 0.50, low: 0.20 },
    "전투 중 생명력 회복량 +": { high: 50, mid: 25, low: 10 }
  },
    팔찌: {
      "공격속도 %": {low: 4.0, mid: 5.0, high: 6.0},
      "치명타 적중률 %": { low: 3.4, mid: 4.2, high: 5.0 },
      "치명타 피해 %": { low: 6.8, mid: 8.4, high: 10.0 },

      "적에게 주는 피해 %": { low: 2.0, mid: 2.5, high: 3.0 },
      "무력화 상태의 적에게 주는 피해 %" : { low: 4.0, mid: 4.5, high: 5.0 },

      "추가 피해 %": { low: 2.5, mid: 3.0, high: 3.5 },
      "악마 및 대악마 계열 피해량 %": { low: 2.5, mid: 2.5, high: 2.5 },

      "적추피 %": { low: 4.5, mid: 5.0, high: 5.5 },

      "무기 공격력 +": { low: 7200, mid: 8100, high: 9000 },
      "공격 및 이동속도 %": { low: 4.0, mid: 5.0, high: 6.0 },

      "적에게 주는 피해 (조건부) %": { low: 4.5, mid: 5.0, high: 5.5 },

      "백어택 스킬 피해 %": { low: 2.5, mid: 3.0, high: 3.5 },
      "헤드어택 스킬 피해 %": { low: 2.5, mid: 3.0, high: 3.5 },
      "비방향 스킬 피해 %": { low: 2.5, mid: 3.0, high: 3.5 },

      // ===== 서포터 =====
      "방어력 감소 %": { low: 1.8, mid: 2.1, high: 2.5 },
      "치명타 저항력 감소 %": { low: 1.8, mid: 2.1, high: 2.5 },
      "치명타 피해 저항력 감소 %": { low: 3.6, mid: 4.2, high: 4.8 },

      "보호 효과 %": { low: 0.9, mid: 1.1, high: 1.3 },
      "보호 및 회복 효과 %": { low: 2.5, mid: 3.0, high: 3.5 },

      "아군 공격력 강화 효과 %": { low: 4.0, mid: 5.0, high: 6.0 },
      "아군 피해량 강화 효과 %": { low: 6.0, mid: 7.5, high: 9.0 }
    }
};

function normalizeForMatch(str) {
  return str
    .replace(/\s/g, "")
    .toLowerCase();
}

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

  let name = stat;
  let value = null;

  // =========================
  // 팔찌 처리
  // =========================
  if (type === "팔찌") {

    let percentMatch = null;
    let flatMatch = stat.match(/무기공격력\s*([\d]+)/);

    if (stat.includes("재사용 대기 시간")) {
      const matches = [...stat.matchAll(/([\d.]+)%/g)];

      if (matches.length >= 2) {
        percentMatch = matches[1];
      }
    }

    if (!percentMatch) {
      percentMatch = stat.match(/([\d.]+)%/);
    }

    if (percentMatch) {
      value = parseFloat(percentMatch[1]);
    } else if (flatMatch) {
      value = parseFloat(flatMatch[1]);
    } else {
      return "#868e96";
    }

    // =========================
    // 이름 매핑
    // =========================
    if (stat.includes("치명타 적중률"))
      name = "치명타 적중률 %";

    else if (stat.includes("보호 효과"))
      name = "보호 효과 %";

    else if (stat.includes("치명타 피해") && stat.includes("저항"))
      name = "치명타 피해 저항력 감소 %";

    else if (stat.includes("재사용 대기"))
      name = "적추피 %";

    else if (stat.includes("치명타 피해"))
      name = "치명타 피해 %";

    else if (stat.includes("공격 및 이동"))
      name = "공격 및 이동속도 %";

    else if (stat.includes("치명타 저항"))
      name = "치명타 저항력 감소 %";

    else if (stat.includes("방어력"))
      name = "방어력 감소 %";

    else if (stat.includes("무력화"))
      name = "무력화 상태의 적에게 주는 피해 %";

    else if (stat.includes("추가 피해"))
      name = "추가 피해 %";

    else if (stat.includes("악마"))
      name = "악마 및 대악마 계열 피해량 %";

    else if (stat.includes("무기공격력"))
      name = "무기 공격력 +";

    else if (stat.includes("공격 및 이동속도"))
      name = "공격 및 이동속도 %";

    else if (stat.includes("백어택"))
      name = "백어택 스킬 피해 %";

    else if (stat.includes("헤드어택"))
      name = "헤드어택 스킬 피해 %";

    else if (stat.includes("방향성 공격이 아닌"))
      name = "비방향 스킬 피해 %";

    else if (stat.includes("아군 공격력"))
      name = "아군 공격력 강화 효과 %";

    else if (stat.includes("아군 피해량"))
      name = "아군 피해량 강화 효과 %";

    else if (stat.includes("적에게 주는 피해") && !stat.includes("무력화"))
      name = "적에게 주는 피해 %";

    else if (stat.includes("적에게 주는 피해") && stat.includes("조건"))
      name = "적에게 주는 피해 (조건부) %";
  }

    else {
      const percentMatch = stat.match(/(.+?)\s*\+?([\d.]+)\s*%/);
      const plusMatch = stat.match(/(.+?)\s*\+\s*([\d.]+)/);

      if (percentMatch) {
        name = percentMatch[1].trim(); // 👈 + 제거
        value = parseFloat(percentMatch[2]);

        // key 포맷 통일
        name = name + " %";
      }
      else if (plusMatch) {
        name = plusMatch[1].trim();
        value = parseFloat(plusMatch[2]);

        name = name + " +";
      }
      else {
        return "#ddd";
      }
    }
    console.log("NAME:", name);
    const key = Object.keys(table).find(k =>
    normalizeForMatch(k) === normalizeForMatch(name)
      );

  if (!key) return "#ddd";

  const opt = table[key];

  if (value >= opt.high) return "#ff922b";
  if (value >= opt.mid) return "#845ef7";
  if (value >= opt.low) return "#339af0";

  return "#adb5bd";
}

function extractKey(stat) {
  // % 여부
  const isPercent = stat.includes("%");

  // + 여부
  const isFlat = /\+\d/.test(stat);

  // 대표 이름 추출 (숫자 제거)
  const name = stat
    .replace(/\d+(\.\d+)?%?/g, "")
    .replace(/\+?\d+/g, "")
    .trim();

  // 최종 key
  if (isPercent) return `${name} %`;
  if (isFlat) return `${name} +`;

  return name;
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
      const {
      name,
      quality,
      type,
      icon,
      stoneEngravings = [],
      accessoryStats = [],
      baseStats = [],
      effects = []
    } = parseEquipmentTooltip(item);

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
    document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    tooltip.style.display = "none";
  }
});


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
          tooltip.innerHTML = `
            <div style="margin-bottom:6px; font-weight:bold; color:#ffd43b;">
              기본 능력치
            </div>

            ${
              baseStats.length > 0
                ? baseStats.map(s => `<div style="color:#4dabf7">${s}</div>`).join("")
                : `<div style="color:#868e96">없음</div>`
            }

            <div style="margin-top:6px; margin-bottom:6px; font-weight:bold; color:#74c0fc;">
              팔찌 효과
            </div>

            ${
                effects.map(s => {
                  const color = getColor(type, s);

                  return `<div style="
                    color:${color};
                    margin-bottom:6px;
                    line-height:1.5;
                  ">
                    ${formatBraceletEffect(s)}
                  </div>`;
                }).join("")

            }
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
      tooltip.style.display = "block";

      const rect = tooltip.getBoundingClientRect();
      const tooltipHeight = rect.height;
      const tooltipWidth = rect.width;

      let top = e.clientY + 12;
      let left = e.clientX + 12;

      // 🔽 아래 넘치면 위로
      if (top + tooltipHeight > window.innerHeight) {
        top = e.clientY - tooltipHeight - 12;
      }

      // 🔼 위로도 넘치면 그냥 0에 붙임
      if (top < 0) {
        top = 5;
      }

      // 👉 오른쪽 넘치면 왼쪽으로
      if (left + tooltipWidth > window.innerWidth) {
        left = e.clientX - tooltipWidth - 12;
      }

      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
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

function formatBraceletEffect(text) {
  return text
    .replace(/(감소시킨다\.)/g, "$1<br>")
    .replace(/(증가한다\.)/g, "$1<br>")
    .replace(/(적용된다\.)/g, "$1<br>")
    .replace(/(\.\s)/g, ".<br>");
}