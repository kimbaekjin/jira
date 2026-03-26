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

async function init() {
  const container = document.getElementById("container");

  for (const name of characterList) {
    const card = createCard(name);
    container.appendChild(card);

    await initRaidUI(card, name);

    const data = await getCharacter(name);

    card.querySelector(".char-img").src = data.CharacterImage || "/images/placeholder.png";
    card.querySelector(".name").innerText = data.CharacterName || name;
    card.querySelector(".level").innerText = `Lv. ${data.ItemAvgLevel || "-"}`;
    card.querySelector(".power").innerText = `전투력 ${data.CombatPower || "-"}`;

    let homeworkData = await autoUpdateDailyGaugesDB(name);
    initHomeworkUI(name, card, homeworkData);
  }
}

init();