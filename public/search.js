import { createCard } from "./js/card/card.js";
import { initRaidUI } from "./js/raid/raidUI.js";
import { initHomeworkUI, autoUpdateDailyGaugesDB } from "./js/homework/homeworkUI.js";

const container = document.getElementById("container");
const input = document.getElementById("searchCharacterInput");
const btn = document.getElementById("searchCharacterBtn");
const statusEl = document.getElementById("searchStatus");

const backHomeBtn = document.getElementById("backHomeBtn");
const myRosterBtn = document.getElementById("myRosterBtn");

backHomeBtn?.addEventListener("click", () => {
  window.location.href = "/index.html";
});

myRosterBtn?.addEventListener("click", () => {
  window.location.href = "/index.html?mode=my";
});

async function getCharacter(name) {
  try {
    const res = await fetch(`/character/${encodeURIComponent(name)}`);
    return await res.json();
  } catch {
    return {};
  }
}

async function renderCharacterCards(characterNames) {
  if (!container) return;

  container.innerHTML = "";

  for (const name of characterNames) {
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
      console.error(`[검색 카드 초기화 실패] ${name}`, err);
    }
  }
}

async function searchRoster() {
  const name = input.value.trim();

  if (!name) {
    statusEl.innerText = "캐릭터명을 입력해줘.";
    return;
  }

  statusEl.innerText = "검색중...";
  container.innerHTML = "";

  try {
    const res = await fetch(`/api/search-roster/${encodeURIComponent(name)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "검색 실패");
    }

    if (!Array.isArray(data) || data.length === 0) {
      statusEl.innerText = "검색 결과가 없습니다.";
      return;
    }

    const characterNames = data.map((char) => char.name);

    statusEl.innerText = `${name} 원정대 상위 ${characterNames.length}개 캐릭터`;
    await renderCharacterCards(characterNames);
  } catch (err) {
    console.error("[ROSTER SEARCH ERROR]", err);
    statusEl.innerText = "검색 실패. 캐릭터명을 다시 확인해줘.";
  }
}

btn?.addEventListener("click", searchRoster);

input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchRoster();
  }
});