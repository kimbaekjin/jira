import { fetchArmory } from "./gemAPI.js";
import { getGemType, getGemRawText, formatGemTextLines } from "./gemParser.js";

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

export async function renderGems(name) {
  const wrapper = document.createElement("div");

  const data = await fetchArmory(name, "gems");

  if (!data || !data.Gems || data.Gems.length === 0) {
    wrapper.innerHTML = "<div>보석 없음</div>";
    return wrapper;
  }

  const gems = data.Gems;

  const damageGems = gems.filter(g => getGemType(g) === "damage");
  const cooldownGems = gems.filter(g => getGemType(g) === "cooldown");
  const etcGems = gems.filter(g => getGemType(g) === "etc");

  if (damageGems.length) wrapper.appendChild(createGemSection("겁화", damageGems));
  if (cooldownGems.length) wrapper.appendChild(createGemSection("작열", cooldownGems));
  if (etcGems.length) wrapper.appendChild(createGemSection("기타", etcGems));

  return wrapper;
}