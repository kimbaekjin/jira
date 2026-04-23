import { defaultCharacters, myCharacters } from "./js/data/data.js";
import { createCard } from "./js/card/card.js";
import { initRaidUI } from "./js/raid/raidUI.js";
import { initHomeworkUI, autoUpdateDailyGaugesDB } from "./js/homework/homeworkUI.js";

// =========================
// mode 분기
// =========================
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const characterList = mode === "my" ? myCharacters : defaultCharacters;

// =========================
// 상단 고정 버튼 생성
// =========================
function initModeToggleButton() {
  const oldBtn = document.getElementById("modeToggleFloatingBtn");
  if (oldBtn) oldBtn.remove();

  const btn = document.createElement("button");
  btn.id = "modeToggleFloatingBtn";
  btn.textContent = mode === "my" ? "전체 보기" : "내 정보보기";

  Object.assign(btn.style, {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: "9999",
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "#ff8fb1",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  });

  btn.addEventListener("click", () => {
    if (mode === "my") {
      window.location.href = "/index.html";
    } else {
      window.location.href = "/index.html?mode=my";
    }
  });

  document.body.appendChild(btn);
}

// =========================
// document title 변경
// =========================
function initPageTitle() {
  document.title = mode === "my" ? "내 캐릭터 정보" : "숙제 체크";
}

// =========================
// 캐릭터 기본 정보 fetch
// =========================
async function getCharacter(name) {
  try {
    const res = await fetch(`/character/${encodeURIComponent(name)}`);
    return await res.json();
  } catch {
    return {};
  }
}

// =========================
// music box resize
// =========================
function initMusicBoxResize() {
  const box = document.getElementById("musicBox");
  if (!box) return;

  const handles = box.querySelectorAll(".resize");
  if (!handles.length) return;

  const minWidth = 220;
  const minHeight = 140;

  let isResizing = false;
  let currentDir = null;

  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let startTop = 0;

  function ensureFixedPosition() {
    const rect = box.getBoundingClientRect();
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.right = "auto";
    box.style.bottom = "auto";
  }

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      ensureFixedPosition();

      const rect = box.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      startLeft = rect.left;
      startTop = rect.top;

      if (handle.classList.contains("top-left")) currentDir = "top-left";
      else if (handle.classList.contains("top-right")) currentDir = "top-right";
      else if (handle.classList.contains("bottom-left")) currentDir = "bottom-left";
      else if (handle.classList.contains("bottom-right")) currentDir = "bottom-right";
      else if (handle.classList.contains("top")) currentDir = "top";
      else if (handle.classList.contains("right")) currentDir = "right";
      else if (handle.classList.contains("bottom")) currentDir = "bottom";
      else if (handle.classList.contains("left")) currentDir = "left";

      isResizing = true;
    });
  });

  window.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    switch (currentDir) {
      case "right":
        newWidth = startWidth + dx;
        break;

      case "left":
        newWidth = startWidth - dx;
        newLeft = startLeft + dx;
        break;

      case "bottom":
        newHeight = startHeight + dy;
        break;

      case "top":
        newHeight = startHeight - dy;
        newTop = startTop + dy;
        break;

      case "top-left":
        newWidth = startWidth - dx;
        newLeft = startLeft + dx;
        newHeight = startHeight - dy;
        newTop = startTop + dy;
        break;

      case "top-right":
        newWidth = startWidth + dx;
        newHeight = startHeight - dy;
        newTop = startTop + dy;
        break;

      case "bottom-left":
        newWidth = startWidth - dx;
        newLeft = startLeft + dx;
        newHeight = startHeight + dy;
        break;

      case "bottom-right":
        newWidth = startWidth + dx;
        newHeight = startHeight + dy;
        break;
    }

    if (newWidth < minWidth) {
      if (currentDir && currentDir.includes("left")) {
        newLeft -= (minWidth - newWidth);
      }
      newWidth = minWidth;
    }

    if (newHeight < minHeight) {
      if (currentDir && currentDir.includes("top")) {
        newTop -= (minHeight - newHeight);
      }
      newHeight = minHeight;
    }

    box.style.width = `${newWidth}px`;
    box.style.height = `${newHeight}px`;
    box.style.left = `${newLeft}px`;
    box.style.top = `${newTop}px`;
  });

  window.addEventListener("mouseup", () => {
    isResizing = false;
    currentDir = null;
  });
}

// =========================
// music box drag
// =========================
function initMusicBoxDrag() {
  const box = document.getElementById("musicBox");
  const header = box?.querySelector(".music-title");

  if (!box || !header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  header.style.cursor = "move";

  header.addEventListener("mousedown", (e) => {
    e.preventDefault();

    const rect = box.getBoundingClientRect();

    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.right = "auto";
    box.style.bottom = "auto";

    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    isDragging = true;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    box.style.left = `${startLeft + dx}px`;
    box.style.top = `${startTop + dy}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

// =========================
// youtube search
// =========================
function initYoutubeSearch() {
  const API_KEY = "AIzaSyBbryXAdmVMA8VjR2-LJViqUhBf522wv9c";

  const input = document.getElementById("ytSearchInput");
  const btn = document.getElementById("ytSearchBtn");
  const results = document.getElementById("ytResults");
  const player = document.getElementById("ytPlayer");

  if (!input || !btn || !results || !player) return;

  async function search(query) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
    );

    const data = await res.json();

    results.innerHTML = "";

    if (!data.items) return;

    data.items.forEach((item) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumb = item.snippet.thumbnails.medium.url;

      const el = document.createElement("div");
      el.className = "yt-item";

      el.innerHTML = `
        <img src="${thumb}" class="yt-thumb"/>
        <div class="yt-title">${title}</div>
      `;

      el.addEventListener("click", () => {
        player.src = `https://www.youtube.com/embed/${videoId}`;
      });

      results.appendChild(el);
    });
  }

  btn.addEventListener("click", () => {
    const q = input.value.trim();
    if (q) search(q);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      if (q) search(q);
    }
  });
}

// =========================
// 메인 init
// =========================
async function init() {
  const container = document.getElementById("container");
  if (!container) return;

  container.innerHTML = "";

  for (const name of characterList) {
    try {
      const card = createCard(name);
      container.appendChild(card);

      await initRaidUI(card, name);

      const data = await getCharacter(name);

      const imgEl = card.querySelector(".char-img");
      const nameEl = card.querySelector(".name");
      const levelEl = card.querySelector(".level");
      const powerEl = card.querySelector(".power");

      if (imgEl) imgEl.src = data.CharacterImage || "/images/placeholder.png";
      if (nameEl) nameEl.innerText = data.CharacterName || name;
      if (levelEl) levelEl.innerText = `Lv. ${data.ItemAvgLevel || "-"}`;
      if (powerEl) powerEl.innerText = `전투력 ${data.CombatPower || "-"}`;

      const homeworkData = await autoUpdateDailyGaugesDB(name);
      initHomeworkUI(name, card, homeworkData);
    } catch (err) {
      console.error(`[초기화 실패] ${name}`, err);
    }
  }

  initMusicBoxResize();
  initMusicBoxDrag();
  initYoutubeSearch();
}

initPageTitle();
initModeToggleButton();
init();