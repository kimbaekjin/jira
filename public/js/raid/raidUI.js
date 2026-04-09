import { raidGoldTable } from "../data/data.js";
import { raidOrder } from "../data/data.js";

// ----------------- 레이드 UI 표시 -----------------
export function renderRaidDisplay(displayArea, data, characterName) {
  displayArea.innerHTML = "";

  data.sort((a, b) => {
    return raidOrder.indexOf(a.raid) - raidOrder.indexOf(b.raid);
  });

  if (!data || data.length === 0) {
    displayArea.style.display = "none";
    return;
  }

  displayArea.style.display = "block";

  const colors = {
    "노말": "#ffe3f3",
    "하드": "#A8E6CF",
    "나메": "#EAEAEA",
    "1단계": "#A8E6CF",
    "2단계": "#FFD3B6",
    "3단계": "#1F2937"
  };

  let totalGold = 0;

  data.forEach(r => {
    if (!r.level && (!r.busFee || r.busFee === 0)) return;

    const row = document.createElement("div");
    row.className = "raid-row";

    const heartWrap = document.createElement("div");
    heartWrap.className = "raid-heart-wrap";

    const heart = document.createElement("div");
    heart.className = "heart-badge raid-heart";
    heart.style.position = "absolute";
    heart.style.top = "50%";
    heart.style.left = "50%";
    heart.style.transform = "translate(-50%, -50%) rotate(45deg)";
    heart.style.cursor = "pointer";

    const text = document.createElement("span");
    text.className = "raid-heart-text";
    text.style.position = "relative";
    text.style.zIndex = "1";
    text.style.fontFamily = "Pretendard, sans-serif";
    text.style.fontWeight = "900";
    text.style.transform = "rotate(-45deg)";
    text.style.fontSize = r.raid.length >= 3 ? "13px" : "14px";
    text.style.lineHeight = "1.1";
    text.style.letterSpacing = "-0.03em";
    text.style.textAlign = "center";
    text.style.whiteSpace = "pre-line";
    text.style.textShadow = "0 1px 0 rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)";
    text.style.width = "78px";
    text.innerText = r.level ? `${r.raid} ${r.level}` : r.raid;

    const baseColor = colors[r.level] || "#fff";
    text.style.color = baseColor;

    heart.appendChild(text);
    heartWrap.appendChild(heart);
    row.appendChild(heartWrap);

    const goldBox = document.createElement("div");
    goldBox.className = "raid-gold-box";

    let raidGold = 0;
    let busGold = 0;

    if (r.gold) {
      raidGold = raidGoldTable[r.raid]?.[r.level] || 0;
      totalGold += raidGold;
    }
    if (r.busFee && r.busFee > 0) {
      busGold = r.busFee;
      totalGold += busGold;
    }

    const sum = raidGold + busGold;

    goldBox.innerHTML = `
      <div class="raid-gold-line">레이드 골드: <span class="value">${raidGold.toLocaleString()}G</span></div>
      <div class="raid-gold-line">버스 골드: <span class="value">${busGold.toLocaleString()}G</span></div>
      <div class="raid-gold-line total-line">합계: <span class="value">${sum.toLocaleString()}G</span></div>
    `;

    row.appendChild(goldBox);

    let completed = r.completed || false;

    function updateCompletedStyle() {
      if (completed) {
        text.style.textDecoration = "line-through";
        text.style.opacity = "0.5";
        heart.style.opacity = "0.45";
        goldBox.style.opacity = "0.45";
        goldBox.style.textDecoration = "line-through";
      } else {
        text.style.textDecoration = "none";
        text.style.opacity = "1";
        heart.style.opacity = "1";
        goldBox.style.opacity = "1";
        goldBox.style.textDecoration = "none";
      }
    }

    updateCompletedStyle();

    heart.addEventListener("click", async () => {
      completed = !completed;

      const target = data.find(d => d.raid === r.raid);
      if (target) target.completed = completed;

      heartWrap.classList.remove("pop");
      void heartWrap.offsetWidth;
      heartWrap.classList.add("pop");

      updateCompletedStyle();

      try {
        await fetch("/api/raid/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: characterName,
            raids: data.map(x => ({
              raid: x.raid,
              level: x.level,
              gold: x.gold || false,
              selected: true,
              busFee: Number(x.busFee) || 0,
              completed: x.completed || false
            }))
          })
        });
      } catch (e) {
        console.warn("완료 상태 저장 실패", e);
      }
    });

    displayArea.appendChild(row);
  });

  if (displayArea.children.length === 0) {
    displayArea.style.display = "none";
    return;
  }

  const total = document.createElement("div");
  total.className = "total-gold";
  total.innerHTML = `총 골드 <span class="value">${totalGold.toLocaleString()}G</span>`;

  displayArea.prepend(total);
}

// ----------------- 초기화 -----------------
export async function initRaidUI(card, characterName) {
  const titleEl = card.querySelector(".raid-title");

  const displayArea = document.createElement("div");
  displayArea.className = "raid-display";
  displayArea.style.marginTop = "10px";
  displayArea.style.display = "none";
  card.appendChild(displayArea);

  let savedData = [];
  try {
    const res = await fetch(`/api/raid/${encodeURIComponent(characterName)}`);
    const text = await res.text();
    savedData = text ? JSON.parse(text) : [];
    if (!Array.isArray(savedData)) savedData = [];
  } catch (e) {
    savedData = [];
  }

  renderRaidDisplay(displayArea, savedData, characterName);

  const editBtn = document.createElement("button");
  editBtn.innerText = "편집";
  editBtn.style.marginLeft = "10px";
  titleEl.appendChild(editBtn);

  editBtn.addEventListener("click", () => {
    openRaidEditPopup(card, displayArea, characterName, savedData);
  });
}

export function openRaidEditPopup(card, displayArea, characterName, savedData = []) {

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(3px);
    z-index: 9998;
  `;
  document.body.appendChild(overlay);

  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed; left:50%; top:50%;
    transform: translate(-50%,-50%) scale(0.8);
    background: linear-gradient(145deg, #fff0f5, #ffe4ec);
    padding: 25px 20px; border-radius:16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    width:420px; max-height:80%; overflow-y:auto;
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
    opacity: 0; z-index:9999;
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.transform = "translate(-50%,-50%) scale(1)";
    popup.style.opacity = "1";
  });

  const title = document.createElement("h3");
  title.innerText = "레이드 선택";
  title.style.cssText = `
    margin-top:0; margin-bottom:15px;
    font-family:Pretendard, sans-serif;
    font-weight:700; color:#ff6f91; text-align:center;
  `;
  popup.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "✕";
  closeBtn.style.cssText = `
    position:absolute; top:10px; right:10px;
    background:none; border:none;
    font-size:18px; cursor:pointer; color:#ff6f91;
    transition: transform 0.2s;
  `;
  closeBtn.addEventListener("mouseenter", () => closeBtn.style.transform = "scale(1.2)");
  closeBtn.addEventListener("mouseleave", () => closeBtn.style.transform = "scale(1)");
  closeBtn.addEventListener("click", () => {
    overlay.remove();
    popup.remove();
  });
  popup.appendChild(closeBtn);

  const raids = [
    { name: "4막", levels: ["노말", "하드"] },
    { name: "종막", levels: ["노말", "하드"] },
    { name: "세르카", levels: ["노말", "하드", "나메"] },
    { name: "성당", levels: ["1단계", "2단계", "3단계"] }
  ];

    const colors = {
      "노말": "#fff6fb",
      "하드": "#e9fff4",
      "나메": "#f3f3f3",
      "1단계": "#e9fff4",
      "2단계": "#fff1e8",
      "3단계": "#ffffff"
    };

  let goldCount = 0;
  const result = [];

  raids.forEach(raid => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.padding = "6px 10px";
    row.style.marginBottom = "6px";
    row.style.borderRadius = "10px";
    row.style.background = "rgba(255,255,255,0.6)";
    row.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
    row.style.transition = "background 0.2s, transform 0.2s";

    row.addEventListener("mouseenter", () => row.style.background = "rgba(255,200,220,0.3)");
    row.addEventListener("mouseleave", () => row.style.background = "rgba(255,255,255,0.6)");

    const nameDiv = document.createElement("div");
    nameDiv.innerText = raid.name;
    nameDiv.style.width = "60px";

    const levelWrap = document.createElement("div");
    levelWrap.style.display = "flex";

    let selectedLevel = null;
    let busFee = 0;

    const existing = savedData.find(r => r.raid === raid.name);

    raid.levels.forEach(lv => {
      const btn = document.createElement("div");
      btn.innerText = lv;
      btn.style.cssText = `
        padding:5px; border:1px solid #ccc;
        border-radius:6px; margin-right:5px;
        cursor:pointer; font-size:12px;
        transition: background 0.2s, color 0.2s;
      `;

      if (existing && existing.level === lv) {
        btn.style.background = colors[lv];
        btn.style.color = "#fff";
        selectedLevel = lv;
      }

      btn.addEventListener("click", () => {
        const currentSelected = result
          .map(r => r.getData())
          .filter(r => r.level !== null).length;

        if (!selectedLevel && currentSelected >= 4) {
          alert("레이드 4개 제한");
          return;
        }

        if (selectedLevel === lv) {
          btn.style.background = "#fff";
          btn.style.color = "#000";
          selectedLevel = null;
          return;
        }

        levelWrap.querySelectorAll("div").forEach(b => {
          b.style.background = "#fff";
          b.style.color = "#000";
        });

        btn.style.background = colors[lv];
        btn.style.color = "#fff";
        selectedLevel = lv;
      });

      levelWrap.appendChild(btn);
    });

    const checkWrap = document.createElement("div");

    const goldCheck = document.createElement("input");
    goldCheck.type = "checkbox";
    if (existing && existing.gold) goldCheck.checked = true;

    goldCheck.addEventListener("change", () => {
      const currentGoldCount = result.filter(r => {
        const data = r.getData();
        return data.gold && data.level !== null;
      }).length;

      if (goldCheck.checked && currentGoldCount > 3) {
        alert("골드 3개 제한");
        goldCheck.checked = false;
        return;
      }
    });

    const busInput = document.createElement("input");
    busInput.type = "number";
    busInput.min = 0;
    busInput.value = existing ? existing.busFee || 0 : 0;
    busFee = Number(busInput.value);
    busInput.style.width = "60px";
    busInput.style.marginLeft = "5px";

    busInput.addEventListener("input", () => {
      busFee = Number(busInput.value) || 0;
      renderRaidDisplay(displayArea, result.map(r => r.getData()), characterName);
    });

    checkWrap.append("G ", goldCheck, busInput);

    row.append(nameDiv, levelWrap, checkWrap);
    popup.appendChild(row);

    result.push({
      raid: raid.name,
      completed: existing?.completed || false,
      getData: () => ({
        raid: raid.name,
        level: selectedLevel,
        gold: goldCheck.checked,
        busFee: busFee,
        completed: result.find(r => r.raid === raid.name)?.completed || false
      })
    });
  });

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "저장";
  saveBtn.style.cssText = `
    margin-top:15px; width:100%;
    padding:10px 0; border:none; border-radius:10px;
    background:#ff6f91; color:#fff; font-weight:700;
    font-size:14px; cursor:pointer;
    transition: background 0.2s, transform 0.2s;
  `;

  saveBtn.addEventListener("mouseenter", () => {
    saveBtn.style.background = "#ff4c70";
    saveBtn.style.transform = "scale(1.02)";
  });

  saveBtn.addEventListener("mouseleave", () => {
    saveBtn.style.background = "#ff6f91";
    saveBtn.style.transform = "scale(1)";
  });

  saveBtn.addEventListener("click", async () => {
    const finalData = result.map(r => r.getData());

    renderRaidDisplay(displayArea, finalData, characterName);

    await fetch("/api/raid/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: characterName,
        raids: finalData.map(r => ({
          raid: r.raid,
          level: r.level,
          gold: r.gold || false,
          selected: true,
          busFee: Number(r.busFee) || 0,
          completed: r.completed || false
        }))
      })
    });

    savedData.length = 0;
    savedData.push(...finalData);

    overlay.remove();
    popup.remove();
  });

  popup.appendChild(saveBtn);
}