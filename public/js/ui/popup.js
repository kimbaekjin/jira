export function openCharacterPopup(name) {
  // ---------------- overlay ----------------
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top:0; left:0;
    width:100%; height:100%;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 9998;
  `;
  document.body.appendChild(overlay);

  // ---------------- popup ----------------
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed; left:50%; top:50%;
    transform: translate(-50%, -50%) scale(0.8);
    background: linear-gradient(145deg, #fff0f5, #ffe4ec);
    padding: 25px;
    border-radius: 20px;
    width: 600px;
    max-height: 80%;
    overflow-y: auto;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    opacity: 0;
    transition: all 0.25s ease;
    z-index: 9999;
  `;
  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.transform = "translate(-50%, -50%) scale(1)";
    popup.style.opacity = "1";
  });

  // ---------------- 닫기 ----------------
  const closeBtn = document.createElement("div");
  closeBtn.innerText = "✕";
  closeBtn.style.cssText = `
    position:absolute;
    top:10px;
    right:15px;
    cursor:pointer;
    font-size:18px;
  `;
  closeBtn.onclick = () => {
    overlay.remove();
    popup.remove();
  };

  // ---------------- 제목 ----------------
  const title = document.createElement("h2");
  title.innerText = `${name} 상세보기`;

  // ---------------- 탭 ----------------
  const tabWrap = document.createElement("div");
  tabWrap.style.cssText = `
    display:flex;
    justify-content: space-around;
    margin-top:20px;
    margin-bottom:10px;
  `;
  const tabs = ["장비", "스킬", "아크그리드", "보석"];
  let activeTab = "보석";

  // ---------------- 콘텐츠 ----------------
  const content = document.createElement("div");
  content.style.cssText = `
    margin-top:15px;
    font-size:14px;
    min-height:150px;
  `;

  // ---------------- API ----------------
  async function fetchArmory(type) {
    const res = await fetch(`/api/armories/${name}/${type}`);
    return await res.json();
  }

  // ---------------- Tooltip 텍스트 ----------------
function getGemRawText(gem) {
  try {
    const tooltip = JSON.parse(gem.Tooltip);
    for (const key in tooltip) {
      const el = tooltip[key];
      if (el?.type === "ItemPartBox") {
        let text = el.value?.Element_001;
        if (text) {
          // 1. <BR> → \n
          text = text.replace(/<br\s*\/?>/gi, "\n");
          // 2. 나머지 HTML 제거
          text = text.replace(/<[^>]*>/g, "");
          return text;
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

  // ---------------- 보석 타입 ----------------
function getGemType(gem) {
  const rawText = getGemRawText(gem);
  const firstLine = rawText.split(/\r?\n/)[0] || "";

  // 겁화: 피해 또는 지원 효과
  if (firstLine.includes("피해") || rawText.includes("지원 효과")) return "damage";

  // 작열: 재사용
  if (firstLine.includes("재사용") || rawText.includes("재사용")) return "cooldown";

  // 기타
  return "etc";
}

  // ---------------- 텍스트 포맷 ----------------
function formatGemTextLines(rawText) {
  let text = rawText.replace(/<[^>]*>/g, "").replace(/\[[^\]]*\]/g, "");
  text = text.replace(/\s*%증가/g, "% 증가"); // % 증가 통일
  text = text.replace(/\r?\n/g, "\n"); // 줄바꿈 통일

  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  const result = [];

  lines.forEach(line => {
    // 피해 / 재사용
    if (/피해|재사용/.test(line)) {
      result.push(line);
      return;
    }

    // 지원 효과 처리
    if (/지원 효과/.test(line)) {
      // "스킬 지원 효과 8.00% 증가" 형태로 한 줄
      const m = line.match(/(.*지원 효과)\s*(.*)/);
      if (m) result.push(m[1] + " " + m[2].trim());
      else result.push(line);
      return;
    }

    // 추가 효과 처리
if (/추가 효과/.test(line)) {
  const m = line.match(/추가 효과\s*(.*)/);
  if (m && m[1]) {
    result.push("기본 공격력 " + m[1].trim());
  }
  // 내용 없으면 그냥 패스
  return;
}

    // 기타 일반 텍스트
    result.push(line);
  });

  return result;
}

  // ---------------- 보석 아이템 ----------------
  function createGemItem(gem) {
    const item = document.createElement("div");
    item.style.cssText = `
      display:flex;
      gap:8px;
      align-items:center;
      padding:6px;
      border-radius:10px;
      background:rgba(255,255,255,0.3);
    `;

    const type = getGemType(gem);
    item.style.borderLeft =
      type === "damage"
        ? "4px solid #ff4d4f"
        : type === "cooldown"
        ? "4px solid #4dabf7"
        : "4px solid #aaa";

    const img = document.createElement("img");
    img.src = gem.Icon;
    img.style.cssText = `
      width:40px;
      height:40px;
      border-radius:6px;
    `;

    const info = document.createElement("div");
    info.style.cssText = `
      display:flex;
      flex-direction:column;
      text-align:left;
      font-size:12px;
    `;

    const nameEl = document.createElement("div");
    nameEl.innerText = gem.Name.replace(/<[^>]*>/g, "");
    nameEl.style.fontWeight = "bold";

    const skill = document.createElement("div");

    const lines = formatGemTextLines(getGemRawText(gem));
    skill.innerHTML = lines.map(l => `<div>${l}</div>`).join("");

    skill.style.cssText = `
      font-size:11px;
      color:#555;
    `;

    info.appendChild(nameEl);
    info.appendChild(skill);

    item.appendChild(img);
    item.appendChild(info);

    return item;
  }

  // ---------------- 섹션 ----------------
  function createGemSection(title, gemList) {
    const section = document.createElement("div");
    section.style.marginBottom = "16px";

    const header = document.createElement("div");
    header.innerText = `💎 ${title}`;
    header.style.cssText = `
      font-weight:bold;
      margin-bottom:6px;
      text-align:left;
    `;

    const list = document.createElement("div");
    list.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:6px;
    `;

    gemList.forEach(gem => list.appendChild(createGemItem(gem)));

    section.appendChild(header);
    section.appendChild(list);

    return section;
  }

  // ---------------- 보석 렌더 ----------------
  function renderGems(data) {
    content.innerHTML = "";

    if (!data || !data.Gems || data.Gems.length === 0) {
      content.innerHTML = "<div>보석 없음</div>";
      return;
    }

    const gems = data.Gems;
    const damageGems = gems.filter(g => getGemType(g) === "damage");
    const cooldownGems = gems.filter(g => getGemType(g) === "cooldown");
    const etcGems = gems.filter(g => getGemType(g) === "etc");

    if (damageGems.length) content.appendChild(createGemSection("겁화", damageGems));
    if (cooldownGems.length) content.appendChild(createGemSection("작열", cooldownGems));
    if (etcGems.length) content.appendChild(createGemSection("기타", etcGems));
  }

  // ---------------- 렌더 ----------------
  async function renderContent() {
    content.innerHTML = "로딩중...";

    if (activeTab === "보석") {
      const data = await fetchArmory("gems");
      renderGems(data);
      return;
    }

    if (activeTab === "장비") content.innerText = "장비 UI 영역";
    if (activeTab === "스킬") content.innerText = "스킬 UI 영역";
    if (activeTab === "아크그리드") content.innerText = "아크그리드 UI 영역";
  }

  // ---------------- 탭 버튼 ----------------
  tabs.forEach(tab => {
    const btn = document.createElement("button");
    btn.innerText = tab;

    btn.style.cssText = `
      padding:8px 12px;
      border:none;
      border-radius:8px;
      background:#ffd6e0;
      cursor:pointer;
    `;

    btn.addEventListener("click", () => {
      activeTab = tab;
      renderContent();
    });

    tabWrap.appendChild(btn);
  });

  // ---------------- 조립 ----------------
  popup.append(closeBtn, title, tabWrap, content);

  renderContent();
}