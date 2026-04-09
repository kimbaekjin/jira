import { characterList } from "./js/data/data.js";
import { createCard } from "./js/card/card.js";
import { initRaidUI } from "./js/raid/raidUI.js";
import { initHomeworkUI, autoUpdateDailyGaugesDB } from "./js/homework/homeworkUI.js";

async function getCharacter(name) {
  try {
    const res = await fetch(`/character/${encodeURIComponent(name)}`);
    return await res.json();
  } catch {
    return {};
  }
}

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
      if (currentDir.includes("left")) {
        newLeft -= (minWidth - newWidth);
      }
      newWidth = minWidth;
    }

    if (newHeight < minHeight) {
      if (currentDir.includes("top")) {
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

    // right/bottom → left/top 기준으로 변환
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

    data.items.forEach(item => {
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

async function init() {
  const container = document.getElementById("container");

  for (const name of characterList) {
    const card = createCard(name);
    container.appendChild(card);

    await initRaidUI(card, name);

    const data = await getCharacter(name);

    card.querySelector(".char-img").src =
      data.CharacterImage || "/images/placeholder.png";
    card.querySelector(".name").innerText = data.CharacterName || name;
    card.querySelector(".level").innerText = `Lv. ${data.ItemAvgLevel || "-"}`;
    card.querySelector(".power").innerText = `전투력 ${data.CombatPower || "-"}`;

    const homeworkData = await autoUpdateDailyGaugesDB(name);
    initHomeworkUI(name, card, homeworkData);
  }

  initMusicBoxResize();
  initMusicBoxDrag();
  initYoutubeSearch();
}
init();