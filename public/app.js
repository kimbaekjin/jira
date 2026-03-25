const characterList = [
  "혜진이",
  "응애나또아가할래",
  "나혜찌니",
  "적묵법",
  "흐앙계란주께",
  "도빵울",
  "이풀립",
  "콩당콩설",
  "이콩덩",
  "다굥이의기묘한모험"
];

const raidGoldTable = {
  "4막": { "노말": 33000, "하드": 42000 },
  "종막": { "노말": 40000, "하드": 52000 },
  "세르카": { "노말": 35000, "하드": 44000, "나메": 54000 },
  "성당": { "1단계": 30000, "2단계": 40000, "3단계": 50000 }
};

const raidTasks = [
  { name: "4막", gold: true },
  { name: "종막", gold: true },
  { name: "세르카", gold: true },
  { name: "성당", gold: false }
];

const homeworkGroups = {
  general: ["쿠르잔전선", "가디언토벌", "할의모래시계"],
  raid: ["4막", "종막", "세르카", "성당"]
};

const MAX_GAUGE = 200;

// 카드 생성
function createCard() {
  const card = document.createElement("div");
  card.className = "card";

  let dailyTasksHTML = homeworkGroups.general.map(task => `
    <div class="hw-task" data-task="${task}">
      <label><input type="checkbox" class="hw-checkbox" /> ${task}</label>
      <div class="hw-gauge"><div class="hw-gauge-fill">0 / ${MAX_GAUGE}</div></div>
    </div>
  `).join("");

  card.innerHTML = `
    <div class="img-box">
      <img class="char-img" src="" />
      <div class="overlay">
        <div class="name">로딩중...</div>
        <div class="level">Lv. -</div>
        <div class="power">전투력 -</div>
      </div>
    </div>

    <div class="homework-section">
      <div class="hw-group-title daily-title">일일 숙제</div>
      <div class="hw-group daily">${dailyTasksHTML}</div>
      <div class="hw-group-title raid-title">레이드 숙제</div>
    </div>
  `;
  return card;
}

// 레이드 UI 업데이트
function updateCardRaidUI(card, selectedRaids) {
  const raidContainer = card.querySelector(".hw-group.raid");
  if (!raidContainer) return;
  raidContainer.innerHTML = "";

  selectedRaids.forEach(task => {
    const div = document.createElement("div");
    div.className = "raid-task";
    div.innerText = task;
    div.style.cssText = `
      display:inline-block; width:80px; height:30px;
      margin:5px; border:1px solid #ccc; border-radius:4px;
      text-align:center; line-height:30px; background-color:#eee;
    `;
    raidContainer.appendChild(div);
  });
}

function renderRaidDisplay(displayArea, data, characterName) {
  displayArea.innerHTML = "";

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
    // 선택 안 된 레이드는 패스
    if (!r.level && (!r.busFee || r.busFee === 0)) return;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "10px";
    row.style.minHeight = "60px";

    const heartWrap = document.createElement("div");
    heartWrap.style.width = "150px";
    heartWrap.style.height = "150px";
    heartWrap.style.position = "relative";
    heartWrap.style.marginRight = "8px";

    // ❤️ 하트
    const heart = document.createElement("div");
    heart.className = "heart-badge";
    heart.style.position = "absolute";
    heart.style.top = "50%";
    heart.style.left = "50%";
    heart.style.transform = "translate(-50%, -50%) rotate(45deg)";
    heart.style.cursor = "pointer";

    const text = document.createElement("span");
    text.style.position = "relative";
    text.style.zIndex = "1";
    text.style.fontFamily = "Pretendard, sans-serif";
    text.style.fontWeight = "900";
    text.style.transform = "rotate(-45deg)";
    text.style.fontSize = "15px";
    text.style.textAlign = "center";
    text.innerText = r.level ? `${r.raid} ${r.level}` : r.raid;

    const baseColor = colors[r.level] || "#fff";
    text.style.color = baseColor;

    heart.appendChild(text);
    heartWrap.appendChild(heart);
    row.appendChild(heartWrap);

    // ----------------- 골드 박스 -----------------
    const goldBox = document.createElement("div");
    goldBox.style.background = "#ffe4ec"; // 연분홍
    goldBox.style.padding = "10px";
    goldBox.style.borderRadius = "10px";
    goldBox.style.marginLeft = "10px";
    goldBox.style.minWidth = "140px";
    goldBox.style.fontSize = "12px";
    goldBox.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

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
      <div>레이드 골드: ${raidGold.toLocaleString()}G</div>
      <div>버스 골드: ${busGold.toLocaleString()}G</div>
      <div style="font-weight:700; margin-top:4px;">
        합계: ${sum.toLocaleString()}G
      </div>
    `;

    row.appendChild(goldBox);

    // ----------------- 하트 클릭 완료 기능 -----------------
    let completed = r.completed || false;

    function updateCompletedStyle() {
      if (completed) {
        // 텍스트 취소선 + 투명화
        text.style.textDecoration = "line-through";
        text.style.opacity = "0.5";

        // 하트 반투명
        heart.style.opacity = "0.4";

        // 연분홍 박스 완료 표시
        goldBox.style.opacity = "0.3";
        goldBox.style.textDecoration = "line-through";
      } else {
        // 원래 상태로 복원
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
                completed: x.completed !== undefined ? x.completed : false
            }))
          })
        });
        console.log("✅ DB 저장 요청 완료");
      } catch (e) {
        console.warn("완료 상태 저장 실패", e);
      }
    });
    // ------------------------------------------------------

    displayArea.appendChild(row);
  });

  // 아무것도 안 그려졌으면 숨김
  if (displayArea.children.length === 0) {
    displayArea.style.display = "none";
    return;
  }

  const total = document.createElement("div");
  total.innerText = `총 골드: ${totalGold.toLocaleString()}G`;
  total.style.marginBottom = "8px";
  total.style.fontWeight = "bold";

  displayArea.prepend(total);
}

// 레이드 UI 초기화
async function initRaidUI(card, characterName) {
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
    console.warn("레이드 데이터 로드 실패", e);
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

function openRaidEditPopup(card, displayArea, characterName, savedData = []) {
  // -------------------- 오버레이 --------------------
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(3px);
    z-index: 9998;
  `;
  document.body.appendChild(overlay);

  // -------------------- 팝업 박스 --------------------
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

  // 등장 애니메이션
  requestAnimationFrame(() => {
    popup.style.transform = "translate(-50%,-50%) scale(1)";
    popup.style.opacity = "1";
  });

  // -------------------- 타이틀 --------------------
  const title = document.createElement("h3");
  title.innerText = "레이드 선택";
  title.style.cssText = `
    margin-top:0; margin-bottom:15px;
    font-family:Pretendard, sans-serif;
    font-weight:700; color:#ff6f91; text-align:center;
  `;
  popup.appendChild(title);

  // -------------------- 닫기 버튼 --------------------
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

  // -------------------- 기존 레이드 UI 생성 --------------------
  const raids = [
    { name: "4막", levels: ["노말", "하드"] },
    { name: "종막", levels: ["노말", "하드"] },
    { name: "세르카", levels: ["노말", "하드", "나메"] },
    { name: "성당", levels: ["1단계", "2단계", "3단계"] }
  ];

  const colors = {
    "노말": "#3498db", "하드": "#e74c3c", "나메": "#7f8c8d",
    "1단계": "#3498db", "2단계": "#3498db", "3단계": "#3498db"
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

  // -------------------- 저장 버튼 --------------------
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

// 숙제 UI 초기화
function initHomeworkUI(name, card, homeworkData) {
  const hwTasks = card.querySelectorAll(".hw-task");

  hwTasks.forEach(taskEl => {
    const taskName = taskEl.dataset.task;
    const checkbox = taskEl.querySelector(".hw-checkbox");

    // 할의모래시계 특별 처리
    if (taskName === "할의모래시계") {
    const gaugeWrapper = taskEl.querySelector(".hw-gauge");
    if (gaugeWrapper) gaugeWrapper.style.display = "none"; // 🔥 게이지 숨김

      const taskData = homeworkData.find(h => h.task_name === taskName);
      if (checkbox && taskData && taskData.checked) checkbox.checked = true;

      if (checkbox) {
        checkbox.addEventListener("change", async () => {
          await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checked: checkbox.checked, gauge: 0 })
          });
        });
      }
      return;
    }

    const gaugeFill = taskEl.querySelector(".hw-gauge-fill");
    const taskData = homeworkData.find(h => h.task_name === taskName);

    // 숙제별 최대값과 단위
    let maxGauge = MAX_GAUGE;
    let step = 20;
    if (taskName === "가디언토벌") { maxGauge = 100; step = 10; }

    let gauge = taskData ? taskData.gauge : maxGauge;

    // 체크박스 초기 상태
    if (checkbox && taskData && taskData.checked) checkbox.checked = true;

    if (gaugeFill) {
      gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
      gaugeFill.innerText = `${gauge} / ${maxGauge}`;
    }

    // 숫자 입력창
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0; input.max = maxGauge; input.value = gauge;
    input.style.width = "50px"; input.style.marginLeft = "10px"; input.style.display = "none";
    taskEl.querySelector("label").appendChild(input);

    // 버튼 생성
    const btn = document.createElement("button");
    btn.innerText = "게이지 수정"; btn.style.marginLeft = "10px"; btn.style.fontSize = "12px";
    taskEl.querySelector("label").appendChild(btn);

    btn.addEventListener("click", () => {
      input.style.display = input.style.display === "none" ? "inline-block" : "none";
      if (input.style.display !== "none") input.focus();
    });

    // 숫자 입력 이벤트
    input.addEventListener("blur", async () => {
      let val = parseInt(input.value);
      if (isNaN(val)) val = gauge;

      // step 단위 적용
      if (val < 0 || val > maxGauge || (val % step !== 0)) {
        input.value = gauge;
        return;
      }

      gauge = val;
      if (gaugeFill) {
        gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
        gaugeFill.innerText = `${gauge} / ${maxGauge}`;
      }
      if (checkbox) checkbox.checked = gauge > 0;

      await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: gauge > 0, gauge })
      });
    });

    // 체크박스 이벤트 (step 단위 증감)
    if (checkbox) {
      checkbox.addEventListener("change", async () => {
        if (checkbox.checked && gauge >= step) gauge -= step;
        else if (!checkbox.checked && gauge >= step) {
          gauge += step;
          if (gauge > maxGauge) gauge = maxGauge;
        }

        if (input) input.value = gauge;
        if (gaugeFill) {
          gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
          gaugeFill.innerText = `${gauge} / ${maxGauge}`;
        }

        await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: checkbox.checked, gauge })
        });
      });
    }
  });
}

// 캐릭터 데이터 불러오기
async function getCharacter(name) {
  try {
    const res = await fetch(`/character/${encodeURIComponent(name)}`);
    return await res.json();
  } catch {
    return {};
  }
}

// 초기화
async function init() {
  const container = document.getElementById("container");
  for (const name of characterList) {
    const card = createCard();
    container.appendChild(card);
    await initRaidUI(card, name);

    const data = await getCharacter(name);
    card.querySelector(".char-img").src = data.CharacterImage || "/images/placeholder.png";
    card.querySelector(".name").innerText = data.CharacterName || name;
    card.querySelector(".level").innerText = `Lv. ${data.ItemAvgLevel || "-"}`;
    card.querySelector(".power").innerText = `전투력 ${data.CombatPower || "-"}`;

    let homeworkData = [];
    try {
      const homeworkRes = await fetch(`/api/homework/${encodeURIComponent(name)}`);
      homeworkData = await homeworkRes.json();
      if (!Array.isArray(homeworkData)) homeworkData = [];
    } catch { homeworkData = []; }

    initHomeworkUI(name, card, homeworkData);
  }
}

init();