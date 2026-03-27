export function createPopupBase(name) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top:0; left:0;
    width:100%; height:100%;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 9998;
  `;
  document.body.appendChild(overlay);

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

  function closePopup() {
    document.removeEventListener("keydown", escHandler);
    overlay.remove();
    popup.remove();
  }

  function escHandler(e) {
    if (e.key === "Escape") closePopup();
  }

  document.addEventListener("keydown", escHandler);
  overlay.addEventListener("click", closePopup);

  const closeBtn = document.createElement("div");
  closeBtn.innerText = "✕";
  closeBtn.style.cssText = `
    position:absolute;
    top:10px;
    right:15px;
    cursor:pointer;
    font-size:18px;
  `;
  closeBtn.onclick = closePopup;

  const title = document.createElement("h2");
  title.innerText = `${name} 상세보기`;

  const content = document.createElement("div");
  content.style.cssText = `
    margin-top:15px;
    font-size:14px;
    min-height:150px;
  `;

  popup.append(closeBtn, title);

  return { popup, content, closePopup };
}