export function createTabs(tabList, onClick) {
  const tabWrap = document.createElement("div");

  tabWrap.style.cssText = `
    display:flex;
    justify-content: space-around;
    margin-top:20px;
    margin-bottom:10px;
  `;

  tabList.forEach(tab => {
    const btn = document.createElement("button");
    btn.innerText = tab;

    btn.style.cssText = `
      padding:8px 12px;
      border:none;
      border-radius:8px;
      background:#ffd6e0;
      cursor:pointer;
    `;

    btn.addEventListener("click", () => onClick(tab));

    tabWrap.appendChild(btn);
  });

  return tabWrap;
}