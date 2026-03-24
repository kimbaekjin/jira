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
  "4막": {
    "노말": 33000,
    "하드": 42000
  },
  "종막": {
    "노말": 40000,
    "하드": 52000
  },
  "세르카": {
    "노말": 35000,
    "하드": 44000,
    "나메": 54000
  },
  "성당": {
    "1단계": 30000,
    "2단계": 40000,
    "3단계": 50000
  }
};

const raidTasks = [
  { name: "4막", gold: true },
  { name: "종막", gold: true },
  { name: "세르카", gold: true },
  { name: "성당", gold: false }
];

function updateCardRaidUI(card, selectedRaids) {
  const raidContainer = card.querySelector(".hw-group.raid");
  raidContainer.innerHTML = ""; // 초기화

  selectedRaids.forEach(task => {
    const div = document.createElement("div");
    div.className = "raid-task";
    div.innerText = task;
    div.style.display = "inline-block";
    div.style.width = "80px";
    div.style.height = "30px";
    div.style.margin = "5px";
    div.style.border = "1px solid #ccc";
    div.style.borderRadius = "4px";
    div.style.textAlign = "center";
    div.style.lineHeight = "30px";
    div.style.backgroundColor = "#eee"; // 기본 색
    raidContainer.appendChild(div);
  });
}

// 각 카드에 들어갈 숙제 그룹 정의
const homeworkGroups = {
  general: ["쿠르잔전선", "가디언토벌", "할의모래시계"],
  raid: ["4막", "종막", "세르카", "성당"] // 예시, 원하는 레이드 숙제 추가 가능
};

const MAX_GAUGE = 200;

function createCard() {
  const card = document.createElement("div");
  card.className = "card";

  // 일일 숙제 HTML (게이지 적용)
  let dailyTasksHTML = homeworkGroups.general.map(task => `
    <div class="hw-task" data-task="${task}">
      <label><input type="checkbox" class="hw-checkbox" /> ${task}</label>
      <div class="hw-gauge"><div class="hw-gauge-fill">0 / ${MAX_GAUGE}</div></div>
    </div>
  `).join("");

  raidTasks.map(task => `
  <div class="hw-task raid" data-task="${task.name}" data-gold="${task.gold}">
    <label>
      <input type="checkbox" class="hw-checkbox" />
      ${task.name} ${task.gold ? "(골드)" : ""}
    </label>
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
async function applyGaugeChange() {
  let val = parseInt(input.value);
  if (isNaN(val)) val = 0;

  // 20 단위 + 0~200 체크
  if (val < 0 || val > MAX_GAUGE || (val !== 0 && val % 20 !== 0)) {
    input.value = gauge; // 원래 값으로 복원
    return;
  }

  gauge = val;

  // 체크 상태 동기화
  if (checkbox) checkbox.checked = gauge > 0;

  // UI 업데이트
  gaugeFill.style.width = `${(gauge / MAX_GAUGE) * 100}%`;
  gaugeFill.innerText = `${gauge} / ${MAX_GAUGE}`;

  // 서버 갱신
  await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checked: gauge > 0, gauge })
  });
}

function updateRaidTitle(titleEl, totalGold) {
  const safeGold = totalGold || 0; // 🔥 방어
}

async function initRaidUI(card, characterName) {
  const titleEl = card.querySelector(".raid-title");

  const displayArea = document.createElement("div");
  displayArea.className = "raid-display";
  displayArea.style.marginTop = "10px";
  displayArea.style.display = "none";
  card.appendChild(displayArea);

  // 👉 기존 데이터 불러오기
  let savedData = [];
  try {
    const res = await fetch(`/api/raid/${encodeURIComponent(characterName)}`);
    savedData = await res.json();
    if (!Array.isArray(savedData)) savedData = [];
  } catch (e) {
    console.warn("레이드 데이터 로드 실패", e);
  }

  // 👉 화면 먼저 그림
  const totalGold = renderRaidDisplay(displayArea, savedData);

  updateRaidTitle(card.querySelector(".raid-title"), totalGold);
  const editBtn = document.createElement("button");
  editBtn.innerText = "편집";
  editBtn.style.marginLeft = "10px";
  titleEl.appendChild(editBtn);

editBtn.addEventListener("click", () => {
  openRaidEditPopup(card, displayArea, characterName, savedData);
});
}

// 🔥 팝업
function openRaidEditPopup(card, displayArea, characterName, savedData = []) {
  const popup = document.createElement("div");
  popup.style.cssText = `
    position:fixed; left:50%; top:50%;
    transform:translate(-50%,-50%);
    background:#fff; padding:20px;
    border-radius:12px; z-index:9999;
    width:400px;
  `;

  popup.innerHTML = `<h3>레이드 선택</h3>`;

  const raids = [
    { name: "4막", levels: ["노말", "하드"] },
    { name: "종막", levels: ["노말", "하드"] },
    { name: "세르카", levels: ["노말", "하드", "나메"] },
    { name: "성당", levels: ["1단계", "2단계", "3단계"] }
  ];

  const colors = {
    "노말": "#3498db",
    "하드": "#e74c3c",
    "나메": "#7f8c8d",
    "1단계": "#3498db",
    "2단계": "#3498db",
    "3단계": "#3498db"
  };

  let goldCount = 0;
  const result = [];

  raids.forEach(raid => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.marginBottom = "10px";

    const name = document.createElement("div");
    name.innerText = raid.name;
    name.style.width = "60px";

    const levelWrap = document.createElement("div");
    let selectedLevel = null;

    const existing = savedData.find(r => r.raid === raid.name);

    // 🔥 난이도 버튼 생성
    raid.levels.forEach(lv => {
      const btn = document.createElement("div");
      btn.innerText = lv;
      btn.style.cssText = `
        padding:5px; border:1px solid #ccc;
        border-radius:6px; margin-right:5px;
        cursor:pointer; font-size:12px;
      `;

      // 🔥 기존 데이터 반영
      if (existing && existing.level === lv) {
        btn.style.background = colors[lv];
        btn.style.color = "#fff";
        selectedLevel = lv;
      }

      btn.addEventListener("click", () => {
        const currentSelected = result
          .map(r => r.getData())
          .filter(r => r.level !== null).length;

        // 🔥 선택 제한 (4개)
        if (!selectedLevel && currentSelected >= 4) {
          alert("레이드 4개 제한");
          return;
        }

        // 같은거 다시 누르면 해제
        if (selectedLevel === lv) {
          btn.style.background = "#fff";
          btn.style.color = "#000";
          selectedLevel = null;
          return;
        }

        // 전체 초기화
        levelWrap.querySelectorAll("div").forEach(b => {
          b.style.background = "#fff";
          b.style.color = "#000";
        });

        // 선택 적용
        btn.style.background = colors[lv];
        btn.style.color = "#fff";
        selectedLevel = lv;
      });

      levelWrap.appendChild(btn); // 🔥 이거 빠져있었음 (중요)
    });

    // 🔥 골드 체크
    const checkWrap = document.createElement("div");

    const goldCheck = document.createElement("input");
    goldCheck.type = "checkbox";

    // 기존 데이터 반영
    if (existing && existing.gold) {
      goldCheck.checked = true;
      goldCount++;
    }

    goldCheck.addEventListener("change", () => {
      if (goldCheck.checked) {
        if (goldCount >= 3) {
          alert("골드 3개 제한");
          goldCheck.checked = false;
          return;
        }
        goldCount++;
      } else {
        goldCount--;
      }
    });

    checkWrap.append("G ", goldCheck);

    row.append(name, levelWrap, checkWrap);
    popup.appendChild(row);

    // 🔥 결과 저장 구조
    result.push({
      raid: raid.name,
      getData: () => ({
        raid: raid.name,
        level: selectedLevel,
        gold: goldCheck.checked
      })
    });
  });

  // 🔥 저장 버튼
  const saveBtn = document.createElement("button");
  saveBtn.innerText = "저장";
  saveBtn.style.marginTop = "10px";

  saveBtn.addEventListener("click", async () => {
    const finalData = result
      .map(r => r.getData())
      .filter(r => r.level !== null);

    renderRaidDisplay(displayArea, finalData);

    await fetch("/api/raid/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: characterName,
        raids: finalData
      })
    });

    // 🔥 savedData 갱신 (핵심)
    savedData.length = 0;
    savedData.push(...finalData);

    popup.remove();
  });

  popup.appendChild(saveBtn);
  document.body.appendChild(popup);
}

function renderRaidDisplay(displayArea, data) {
  displayArea.innerHTML = "";

  if (data.length === 0) {
    displayArea.style.display = "none";
    return 0;
  }

  displayArea.style.display = "block";

  const colors = {
    "노말": "#3498db",
    "하드": "#e74c3c",
    "나메": "#7f8c8d",
    "1단계": "#3498db",
    "2단계": "#3498db",
    "3단계": "#3498db"
  };

  let totalGold = 0;

  data.forEach(r => {
    const row = document.createElement("div");
    row.style.marginBottom = "5px";

    const badge = document.createElement("span");
    badge.innerText = `${r.raid} ${r.level}`;
    badge.style.background = colors[r.level];
    badge.style.color = "#fff";
    badge.style.padding = "3px 6px";
    badge.style.borderRadius = "6px";

    row.appendChild(badge);

    // 🔥 골드 계산
    if (r.gold) {
      const goldValue = raidGoldTable[r.raid]?.[r.level] || 0;
      totalGold += goldValue;

      const gold = document.createElement("span");
      gold.innerText = ` ${goldValue.toLocaleString()}G`;
      gold.style.color = "gold";
      gold.style.marginLeft = "5px";

      row.appendChild(gold);
    }

    displayArea.appendChild(row);

    return totalGold
  });

  // 🔥 총합 표시
  const total = document.createElement("div");
  total.innerText = `총 골드: ${totalGold.toLocaleString()}G`;
  total.style.marginBottom = "8px";
  total.style.fontWeight = "bold";

  displayArea.prepend(total); // 위에 넣기
}

// 체크박스 및 게이지 UI 초기화
function initHomeworkUI(name, card, homeworkData) {
   const hwTasks = card.querySelectorAll(".hw-task");

  hwTasks.forEach(taskEl => {
    const taskName = taskEl.dataset.task;
    if (taskName === "할의모래시계") {
  const gaugeWrapper = taskEl.querySelector(".hw-gauge");
  if (gaugeWrapper) gaugeWrapper.style.display = "none";
  return; // 이후 코드 실행 중단
} // 모래시계 제외

    const checkbox = taskEl.querySelector(".hw-checkbox");
    const gaugeFill = taskEl.querySelector(".hw-gauge-fill");
    if (!gaugeFill) return;

    const taskData = homeworkData.find(h => h.task_name === taskName);
    let gauge = taskData ? taskData.gauge : MAX_GAUGE;

    // 체크 상태 초기 반영
    if (checkbox && taskData && taskData.checked) {
      checkbox.checked = true;
    }

    // 게이지 표시
    gaugeFill.style.width = `${(gauge / MAX_GAUGE) * 100}%`;
    gaugeFill.innerText = `${gauge} / ${MAX_GAUGE}`;

    // 40 단위 구간선
    const numLines = 4;
    for (let i = 1; i <= numLines; i++) {
      const line = document.createElement("div");
      line.style.position = "absolute";
      line.style.left = `${(i * 40 / MAX_GAUGE) * 100}%`;
      line.style.top = "0";
      line.style.height = "100%";
      line.style.width = "1px";
      line.style.background = "rgba(0,0,0,0.1)";
      gaugeFill.parentElement.appendChild(line);
    }

    // 숫자 입력창 생성 (숨김)
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = MAX_GAUGE;
    input.value = gauge;
    input.style.width = "50px";
    input.style.marginLeft = "10px";
    input.style.display = "none";
    taskEl.querySelector("label").appendChild(input);

    // "게이지 수정" 버튼 생성
    const btn = document.createElement("button");
    btn.innerText = "게이지 수정";
    btn.style.marginLeft = "10px";
    btn.style.fontSize = "12px";
    taskEl.querySelector("label").appendChild(btn);

    // 버튼 클릭 시 입력창 토글
    btn.addEventListener("click", () => {
      input.style.display = input.style.display === "none" ? "inline-block" : "none";
      if (input.style.display !== "none") input.focus();
    });

    // task 스코프 안에서 정의
    async function applyGaugeChange() {
      let val = parseInt(input.value);
      if (isNaN(val)) val = gauge;

      // 20 단위 + 0~200 체크
      if (val < 0 || val > MAX_GAUGE || (val !== 0 && val % 20 !== 0)) {
        input.value = gauge; // 원래 값으로 복원
        return;
      }

      gauge = val;

      // UI 업데이트
      gaugeFill.style.width = `${(gauge / MAX_GAUGE) * 100}%`;
      gaugeFill.innerText = `${gauge} / ${MAX_GAUGE}`;

      // 체크박스 동기화
      if (checkbox) checkbox.checked = gauge > 0;

      // 서버 업데이트
      await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: gauge > 0, gauge })
      });
    }

    // 숫자 입력 이벤트
    input.addEventListener("blur", applyGaugeChange);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });

    // 체크박스 이벤트 (40 단위 증감)
    if (checkbox) {
      checkbox.addEventListener("change", async () => {
        if (!gaugeFill) return;

        if (checkbox.checked && gauge >= 40) {
          gauge -= 40;
        } else if (!checkbox.checked && gauge >= 40) {
          gauge += 40;
          if (gauge > MAX_GAUGE) gauge = MAX_GAUGE;
        }

        // 숫자 입력창 동기화
        if (input) input.value = gauge;

        // UI 업데이트
        gaugeFill.style.width = `${(gauge / MAX_GAUGE) * 100}%`;
        gaugeFill.innerText = `${gauge} / ${MAX_GAUGE}`;

        // 서버 업데이트
        await fetch(`/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: checkbox.checked, gauge })
        });
      });
    }
  }); // forEach 끝
} // initHomeworkUI 끝

async function getCharacter(name) {
  console.log("[DEBUG] getCharacter 호출:", name);
  const res = await fetch(`/character/${encodeURIComponent(name)}`);
  console.log("[DEBUG] API 상태 코드:", res.status);
  const data = await res.json();
  console.log("[DEBUG] API 데이터:", data);
  return data;
}

async function init() {
  const container = document.getElementById("container");

  for (const name of characterList) {
    const card = createCard();
    container.appendChild(card);
    await initRaidUI(card, name);

    // 캐릭터 정보 먼저
    try {
      const data = await getCharacter(name);
      card.querySelector(".char-img").src = data.CharacterImage || "/images/placeholder.png";
      card.querySelector(".name").innerText = data.CharacterName || name;
      card.querySelector(".level").innerText = `Lv. ${data.ItemAvgLevel || "-"}`;
      card.querySelector(".power").innerText = `전투력 ${data.CombatPower || "-"}`;
    } catch (e) {
      card.querySelector(".char-img").src = "/images/placeholder.png";
      card.querySelector(".name").innerText = "불러오기 실패";
    }

    // 숙제 상태
    let homeworkData = [];
    try {
      const homeworkRes = await fetch(`/api/homework/${encodeURIComponent(name)}`);
      homeworkData = await homeworkRes.json();
      if (!Array.isArray(homeworkData)) homeworkData = [];
    } catch (e) {
      console.warn("숙제 UI 초기화 실패:", e);
      homeworkData = [];
    }

    initHomeworkUI(name, card, homeworkData);
  }
}

init();