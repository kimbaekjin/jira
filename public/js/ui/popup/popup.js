import { createPopupBase } from "./popupBase.js";
import { createTabs } from "./popupTabs.js";
import { renderGems } from "../gems/gemRenderer.js";
import { renderEquipment } from "../equipment/equipmentRenderer.js";

export function openCharacterPopup(name) {
  const { popup, content } = createPopupBase(name);

  let activeTab = "보석";

  async function renderContent() {
    content.innerHTML = "로딩중...";

    if (activeTab === "보석") {
      const data = await renderGems(name);
      content.innerHTML = "";
      content.appendChild(data);
      return;
    }

    if (activeTab === "장비") {
      console.log("장비 탭 진입");
      const el = await renderEquipment(name);
      content.innerHTML = "";
      content.appendChild(el);
    }

    if (activeTab === "스킬") content.innerText = "스킬 UI 영역";
    if (activeTab === "아크그리드") content.innerText = "아크그리드 UI 영역";
  }

  const tabWrap = createTabs(["장비", "스킬", "아크그리드", "보석"], (tab) => {
    activeTab = tab;
    renderContent();
  });

  popup.append(tabWrap, content);
  renderContent();
}