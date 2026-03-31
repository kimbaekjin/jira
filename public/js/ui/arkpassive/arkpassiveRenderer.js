import { fetchArkPassive } from "./arkpassiveAPI.js";

export async function renderArkPassive(name) {
  const wrapper = document.createElement("div");

  let data;
  try {
    data = await fetchArkPassive(name);
  } catch (err) {
    console.error(err);
    wrapper.innerText = "아크패시브 불러오기 실패";
    return wrapper;
  }

  const root = document.createElement("div");
  root.style.background = "#0f0f0f";
  root.style.padding = "20px";
  root.style.color = "#fff";

  // ================= TAB =================
  const tabs = document.createElement("div");
  tabs.style.display = "flex";
  tabs.style.gap = "10px";
  tabs.style.marginBottom = "20px";

  const categories = ["깨달음", "진화", "도약"];

  let currentTab = "깨달음";
  const tabButtons = {};

  categories.forEach(cat => {
    const btn = document.createElement("button");

    btn.innerText = cat;
    btn.style.background = "#222";
    btn.style.border = "1px solid #555";
    btn.style.color = "#fff";
    btn.style.padding = "8px 12px";
    btn.style.cursor = "pointer";

    btn.onclick = () => {
      currentTab = cat;
      renderUI();
      updateTabUI();
    };

    tabButtons[cat] = btn;
    tabs.appendChild(btn);
  });

  function updateTabUI() {
    Object.keys(tabButtons).forEach(cat => {
      tabButtons[cat].style.border =
        cat === currentTab ? "2px solid #fff" : "1px solid #555";
    });
  }

  // ================= DATA =================
  const grouped = {};

  data.Effects.forEach(effect => {
    const desc = (effect.Description || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "");

    const tierMatch = desc.match(/(\d+)티어/);
    if (!tierMatch) return;

    const tier = parseInt(tierMatch[1]);
    const category = effect.Name;

    if (!grouped[category]) grouped[category] = {};
    if (!grouped[category][tier]) grouped[category][tier] = [];

    const removed = desc.replace(
      /(깨달음|진화|도약)\s*\d*티어\s*/,
      ""
    );

    const nameMatch = removed.match(/(.+?)\s+Lv\.(\d+)/);

    grouped[category][tier].push({
      name: nameMatch ? nameMatch[1] : "Unknown",
      level: nameMatch ? nameMatch[2] : "",
      icon: effect.Icon,
      tooltip: effect.ToolTip
    });
  });

  // ================= FONT PARSER (원래 유지) =================
  function parseTooltip(raw) {
    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);

      let title =
        parsed.Element_001?.value?.name ||
        parsed.Element_000?.value ||
        "";

      let desc = parsed.Element_002?.value || "";

      // FONT → span 변환
      desc = desc.replace(
        /<FONT\s+([^>]+)>(.*?)<\/FONT>/gi,
        (m, attrs, content) => {
          let color = "#fff";
          let size = "12";

          const colorMatch = attrs.match(/COLOR=['"]?(#[0-9A-Fa-f]+)['"]?/i);
          const sizeMatch = attrs.match(/SIZE=['"]?(\d+)['"]?/i);

          if (colorMatch) color = colorMatch[1];
          if (sizeMatch) size = sizeMatch[1];

          // ❗ 폰트 사이즈 제한
          size = Math.min(parseInt(size), 14);

          return `<span style="color:${color}; font-size:${size}px;">${content}</span>`;
        }
      );

      desc = desc
        .replace(/\|\|/g, "\n")
        .replace(/<BR>/gi, "\n");

      // ❗ 큰 제목 제거 (깨달음/진화/도약)
      desc = desc
        .split("\n")
        .join("\n");
      return desc;
    } catch (e) {
      console.error("tooltip parse error", e);
      return "";
    }
  }

  // ================= UI =================
  const content = document.createElement("div");

  function renderUI() {
    content.innerHTML = "";

    const categoryData = grouped[currentTab] || {};

    Object.keys(categoryData)
      .sort((a, b) => a - b)
      .forEach(tier => {
        const box = document.createElement("div");

        box.style.marginBottom = "20px";
        box.style.border = "1px solid #222";
        box.style.padding = "12px";
        box.style.borderRadius = "10px";

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.gap = "12px";

        categoryData[tier].forEach(node => {
          const nodeEl = document.createElement("div");

          nodeEl.style.width = "80px";
          nodeEl.style.height = "90px";
          nodeEl.style.background = "#1a1a1a";
          nodeEl.style.border = "1px solid #333";
          nodeEl.style.borderRadius = "10px";
          nodeEl.style.display = "flex";
          nodeEl.style.flexDirection = "column";
          nodeEl.style.alignItems = "center";
          nodeEl.style.justifyContent = "center";
          nodeEl.style.cursor = "pointer";

          const img = document.createElement("img");
          img.src = node.icon;
          img.style.width = "40px";

          const nm = document.createElement("div");
          nm.innerText = node.name;
          nm.style.fontSize = "11px";
          nm.style.textAlign = "center";

          const lv = document.createElement("div");
          lv.innerText = node.level ? `Lv.${node.level}` : "";
          lv.style.fontSize = "10px";
          lv.style.color = "#00ffcc";

          nodeEl.appendChild(img);
          nodeEl.appendChild(nm);
          nodeEl.appendChild(lv);

          // ================= TOOLTIP =================
          let tooltip = null;

            document.addEventListener("keydown", (e) => {
              if (e.key === "Escape" && tooltip) {
                tooltip.remove();
                tooltip = null;
              }
            });

          nodeEl.addEventListener("mouseenter", () => {
            tooltip = document.createElement("div");

            Object.assign(tooltip.style, {
              position: "fixed",
              background: "#1e1e1e",
              color: "#fff",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "12px",
              zIndex: "9999",
              pointerEvents: "none",
              maxWidth: "320px",
              lineHeight: "1.4",
              whiteSpace: "pre-line",
              border: "1px solid #444"
            });

            tooltip.innerHTML = parseTooltip(node.tooltip);

            document.body.appendChild(tooltip);
          });

          nodeEl.addEventListener("mousemove", (e) => {
            if (!tooltip) return;

            let top = e.clientY + 12;
            let left = e.clientX + 12;

            const rect = tooltip.getBoundingClientRect();

            if (top + rect.height > window.innerHeight) {
              top = e.clientY - rect.height - 12;
            }

            if (left + rect.width > window.innerWidth) {
              left = e.clientX - rect.width - 12;
            }

            tooltip.style.left = left + "px";
            tooltip.style.top = top + "px";
          });

          nodeEl.addEventListener("mouseleave", () => {
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
          });

          row.appendChild(nodeEl);
        });

        // ================= TIER BOX =================
        const tierTitle = document.createElement("div");
        tierTitle.innerText = tier;
        tierTitle.style.width = "40px";
        tierTitle.style.height = "40px";
        tierTitle.style.display = "flex";
        tierTitle.style.alignItems = "center";
        tierTitle.style.justifyContent = "center";
        tierTitle.style.background = "#444";
        tierTitle.style.borderRadius = "6px";
        tierTitle.style.marginBottom = "10px";
        tierTitle.style.fontWeight = "bold";

        box.appendChild(tierTitle);
        box.appendChild(row);
        content.appendChild(box);
      });
  }

  root.appendChild(tabs);
  root.appendChild(content);
  wrapper.appendChild(root);

  updateTabUI();
  renderUI();

  return wrapper;
}