import { homeworkGroups, MAX_GAUGE } from "../data/data.js";
import { openCharacterPopup } from "../ui/popup/popup.js";

export function createCard(name) {
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
        <div class="name-row">
          <div class="name">로딩중...</div>
        </div>

        <div class="meta-row">
          <div class="meta-pill level">Lv. -</div>
          <div class="meta-pill power">전투력 -</div>
        </div>
      </div>
    </div>

    <div class="homework-section">
      <div class="hw-group-title daily-title">일일 숙제</div>
      <div class="hw-group daily">${dailyTasksHTML}</div>
      <div class="hw-group-title raid-title">레이드 숙제</div>
    </div>
  `;

  const imgBox = card.querySelector(".img-box");

  imgBox.addEventListener("click", () => {
    openCharacterPopup(name);
  });

  return card;
}