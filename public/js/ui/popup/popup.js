import { createPopupBase } from "./popupBase.js";
import { createTabs } from "./popupTabs.js";
import { renderGems } from "../gems/gemRenderer.js";
import { renderEquipment } from "../equipment/equipmentRenderer.js";
import { renderArkGrid } from "../arkgrid/arkgridRenderer.js";
import { renderSkills} from "../skill/skillRenderer.js";
import { renderArkPassive} from "../arkpassive/arkpassiveRenderer.js";

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

    if (activeTab === "스킬") {
      console.log("스킬 탭 진입");
      const el = await renderSkills(name);
      content.innerHTML = "";
      content.appendChild(el);
    }

    if (activeTab === "아크패시브") {
      console.log("아크패시브 탭 진입");
      const el = await renderArkPassive(name);
      content.innerHTML = "";
      content.appendChild(el);
    }

    if (activeTab === "아크그리드") {
        const el = await renderArkGrid(name);
        content.innerHTML = "";
        content.appendChild(el);
    }
  }

  const tabWrap = createTabs(["아크패시브", "장비", "스킬", "아크그리드", "보석"], (tab) => {
    activeTab = tab;
    renderContent();
  });

  popup.append(tabWrap, content);
  renderContent();
}