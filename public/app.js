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

// 레이드 디스플레이 렌더링
function renderRaidDisplay(displayArea, data) {
  displayArea.innerHTML = "";
  if (data.length === 0) {
    displayArea.style.display = "none";
    return;
  }
  displayArea.style.display = "block";

  const colors = {
    "노말": "#fff5e6", "하드": "#fff176", "나메": "#f1f1f1",
    "1단계": "#3498db", "2단계": "#3498db", "3단계": "#3498db"
  };

  let totalGold = 0;

  data.forEach(r => {
        const row = document.createElement("div");
        const heartWrap = document.createElement("div");
        heartWrap.style.width = "150px";
        heartWrap.style.height = "150px";
        heartWrap.style.position = "relative";
        heartWrap.style.marginRight = "8px";

        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.marginBottom = "10px";
        row.style.minHeight = "60px";

        // ❤️ 하트 badge
        const heart = document.createElement("div");
        heart.className = "heart-badge";
        heart.style.position = "absolute";
        heart.style.top = "50%";
        heart.style.left = "50%";
        heart.style.transform = "translate(-50%, -50%) rotate(45deg)";

        // 텍스트 (회전 보정용 span)
        const text = document.createElement("span");
        text.style.position = "relative";
        text.style.zIndex = "1";
        text.style.fontWeight = "700";
        text.style.transform = "rotate(-45deg)";
        text.style.fontSize = "20px";
        text.style.textAlign = "center";
        text.innerText = r.level ? `${r.raid} ${r.level}` : r.raid;

        // 난이도 색 (원하면 텍스트 색만 적용)
        const baseColor = colors[r.level] || "#fff";
        text.style.color = baseColor;

        // 조립
        heart.appendChild(text);
        heartWrap.appendChild(heart);
        row.appendChild(heartWrap);

    if (r.gold) {
      const goldValue = raidGoldTable[r.raid]?.[r.level] || 0;
      totalGold += goldValue;

      const gold = document.createElement("span");
      gold.innerText = ` ${goldValue.toLocaleString()}G`;
      gold.style.color = "gold";
      gold.style.marginLeft = "5px";
      row.appendChild(gold);
    }

    if (r.busFee && r.busFee > 0) {
      totalGold += r.busFee;
      const busSpan = document.createElement("span");
      busSpan.innerText = ` +${r.busFee.toLocaleString()}G`;
      busSpan.style.color = "#f39c12";
      busSpan.style.marginLeft = "5px";
      row.appendChild(busSpan);
    }

    displayArea.appendChild(row);
  });

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

  renderRaidDisplay(displayArea, savedData);

  const editBtn = document.createElement("button");
  editBtn.innerText = "편집";
  editBtn.style.marginLeft = "10px";
  titleEl.appendChild(editBtn);

  editBtn.addEventListener("click", () => {
    openRaidEditPopup(card, displayArea, characterName, savedData);
  });
}

// 레이드 편집 팝업
function openRaidEditPopup(card, displayArea, characterName, savedData = []) {
  const popup = document.createElement("div");
  popup.style.cssText = `
    position:fixed; left:50%; top:50%;
    transform:translate(-50%,-50%);
    background:#fff; padding:20px;
    border-radius:12px; z-index:9999;
    width:400px; max-height:80%; overflow:auto;
  `;
  popup.innerHTML = `<h3>레이드 선택</h3>`;

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

    const name = document.createElement("div");
    name.innerText = raid.name;
    name.style.width = "60px";

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
      if (goldCheck.checked) {
        if (goldCount >= 3) {
          alert("골드 3개 제한");
          goldCheck.checked = false;
          return;
        }
        goldCount++;
      } else goldCount--;
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
      renderRaidDisplay(displayArea, result.map(r => r.getData()));
    });

    checkWrap.append("G ", goldCheck, busInput);
    row.append(name, levelWrap, checkWrap);
    popup.appendChild(row);

    result.push({
      raid: raid.name,
      getData: () => ({
        raid: raid.name,
        level: selectedLevel,
        gold: goldCheck.checked,
        busFee: busFee
      })
    });
  });

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "저장";
  saveBtn.style.marginTop = "10px";
  saveBtn.addEventListener("click", async () => {
    const finalData = result.map(r => r.getData())
      .filter(r => r.level !== null || r.busFee > 0);

    renderRaidDisplay(displayArea, finalData);

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
          busFee: Number(r.busFee) || 0
        }))
      })
    });

    savedData.length = 0;
    savedData.push(...finalData);
    popup.remove();
  });

  popup.appendChild(saveBtn);
  document.body.appendChild(popup);
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