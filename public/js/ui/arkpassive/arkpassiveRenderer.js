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
  Object.assign(root.style, {
    background: "linear-gradient(180deg, #05070d 0%, #09111d 100%)",
    padding: "16px",
    color: "#fff",
    borderRadius: "12px",
    border: "1px solid rgba(90,130,180,0.25)",
    boxShadow: "inset 0 0 30px rgba(80,140,255,0.08)"
  });

  // ================= TAB =================
  const tabs = document.createElement("div");
  Object.assign(tabs.style, {
    display: "flex",
    gap: "8px",
    marginBottom: "16px"
  });

  const categories = ["깨달음", "진화", "도약"];
  let currentTab = "깨달음";
  const tabButtons = {};

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.innerText = cat;

    Object.assign(btn.style, {
      background: "#1a1f2b",
      border: "1px solid #3c4b64",
      color: "#dfe8ff",
      padding: "8px 14px",
      cursor: "pointer",
      borderRadius: "0px",
      fontSize: "13px",
      fontWeight: "600"
    });

    btn.onclick = () => {
      currentTab = cat;
      renderUI();
      updateTabUI();
    };

    tabButtons[cat] = btn;
    tabs.appendChild(btn);
  });

  function updateTabUI() {
    Object.keys(tabButtons).forEach((cat) => {
      const active = cat === currentTab;
      Object.assign(tabButtons[cat].style, {
        border: active ? "1px solid #ffffff" : "1px solid #3c4b64",
        background: active ? "#232a38" : "#1a1f2b",
        color: active ? "#ffffff" : "#dfe8ff",
        boxShadow: active ? "0 0 12px rgba(120,170,255,0.25)" : "none"
      });
    });
  }

  // ================= DATA =================
  const grouped = {};

  (data?.Effects || []).forEach((effect) => {
    const desc = (effect.Description || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "");

    const tierMatch = desc.match(/(\d+)티어/);
    if (!tierMatch) return;

    const tier = parseInt(tierMatch[1], 10);
    const category = effect.Name;

    if (!grouped[category]) grouped[category] = {};
    if (!grouped[category][tier]) grouped[category][tier] = [];

    const removed = desc.replace(/(깨달음|진화|도약)\s*\d*티어\s*/, "");
    const nameMatch = removed.match(/(.+?)\s+Lv\.(\d+)/);

    const nodeName = nameMatch ? nameMatch[1].trim() : "Unknown";
    const nodeLevel = nameMatch ? parseInt(nameMatch[2], 10) : 0;

    grouped[category][tier].push({
      name: nodeName,
      level: nodeLevel,
      icon: effect.Icon,
      tooltip: effect.ToolTip
    });
  });

  // 티어별 정렬 안정화
  Object.keys(grouped).forEach((cat) => {
    Object.keys(grouped[cat]).forEach((tier) => {
      grouped[cat][tier].sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return a.name.localeCompare(b.name, "ko");
      });
    });
  });

  // ================= TOOLTIP PARSER =================
  function parseTooltip(raw) {
    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);

      let desc = parsed.Element_002?.value || "";

      desc = desc.replace(
        /<FONT\s+([^>]+)>(.*?)<\/FONT>/gi,
        (m, attrs, content) => {
          let color = "#fff";
          let size = "12";

          const colorMatch = attrs.match(/COLOR=['"]?(#[0-9A-Fa-f]+)['"]?/i);
          const sizeMatch = attrs.match(/SIZE=['"]?(\d+)['"]?/i);

          if (colorMatch) color = colorMatch[1];
          if (sizeMatch) size = sizeMatch[1];

          size = Math.min(parseInt(size, 10), 14);

          return `<span style="color:${color}; font-size:${size}px;">${content}</span>`;
        }
      );

      desc = desc.replace(/\|\|/g, "\n").replace(/<BR>/gi, "\n");
      return desc;
    } catch (e) {
      console.error("tooltip parse error", e);
      return "";
    }
  }

  const content = document.createElement("div");

  // ESC로 툴팁 닫기 중복방지
  let activeTooltip = null;
  if (!window.__arkPassiveEscBound) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && window.__arkPassiveTooltipRef) {
        window.__arkPassiveTooltipRef.remove();
        window.__arkPassiveTooltipRef = null;
      }
    });
    window.__arkPassiveEscBound = true;
  }

  function createTierBadge(tier) {
    const badge = document.createElement("div");
    badge.innerText = tier;

    Object.assign(badge.style, {
      width: "38px",
      height: "38px",
      borderRadius: "10px",
      background: "linear-gradient(180deg, #3c4452 0%, #545d6d 100%)",
      color: "#fff",
      fontWeight: "800",
      fontSize: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 0 10px rgba(255,255,255,0.06)"
    });

    return badge;
  }

  function createNode(node) {
    const isActive = Number(node.level) > 0;

    const nodeWrap = document.createElement("div");
    Object.assign(nodeWrap.style, {
      width: "76px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      position: "relative",
      cursor: "pointer",
      userSelect: "none"
    });

    const orb = document.createElement("div");
    Object.assign(orb.style, {
      width: "54px",
      height: "54px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isActive
        ? "radial-gradient(circle at 35% 30%, #2b3858 0%, #0f182a 55%, #05070b 100%)"
        : "radial-gradient(circle at 35% 30%, #15171d 0%, #090b10 65%, #05070b 100%)",
      border: isActive
        ? "1px solid rgba(132,173,255,0.55)"
        : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isActive
        ? "0 0 12px rgba(92,150,255,0.22), inset 0 0 14px rgba(120,170,255,0.12)"
        : "inset 0 0 10px rgba(255,255,255,0.03)",
      overflow: "hidden",
      transition: "all 0.15s ease"
    });

    const img = document.createElement("img");
    img.src = node.icon;
    img.alt = node.name;
    Object.assign(img.style, {
      width: "40px",
      height: "40px",
      objectFit: "cover",
      filter: isActive ? "none" : "grayscale(1) brightness(0.45)"
    });

    const point = document.createElement("div");
    point.innerText = "1P";
    Object.assign(point.style, {
      marginTop: "6px",
      fontSize: "11px",
      fontWeight: "700",
      color: isActive ? "#d9e7ff" : "#6e7683",
      lineHeight: "1"
    });

    const level = document.createElement("div");
    level.innerText = `Lv.${node.level || 0}/${node.level || 0}`;
    Object.assign(level.style, {
      marginTop: "2px",
      fontSize: "11px",
      fontWeight: "700",
      color: isActive ? "#ffffff" : "#7f8793",
      lineHeight: "1"
    });

    orb.appendChild(img);
    nodeWrap.appendChild(orb);
    nodeWrap.appendChild(point);
    nodeWrap.appendChild(level);

    let tooltip = null;

    nodeWrap.addEventListener("mouseenter", () => {
      tooltip = document.createElement("div");
      activeTooltip = tooltip;
      window.__arkPassiveTooltipRef = tooltip;

      Object.assign(tooltip.style, {
        position: "fixed",
        background: "rgba(14,18,28,0.98)",
        color: "#fff",
        padding: "12px",
        borderRadius: "10px",
        fontSize: "12px",
        zIndex: "9999",
        pointerEvents: "none",
        maxWidth: "320px",
        lineHeight: "1.45",
        whiteSpace: "pre-line",
        border: "1px solid rgba(120,150,220,0.35)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)"
      });

      tooltip.innerHTML = parseTooltip(node.tooltip);
      document.body.appendChild(tooltip);
    });

    nodeWrap.addEventListener("mousemove", (e) => {
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

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    nodeWrap.addEventListener("mouseleave", () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
        if (activeTooltip === tooltip) activeTooltip = null;
        if (window.__arkPassiveTooltipRef) window.__arkPassiveTooltipRef = null;
      }
    });

    return nodeWrap;
  }

  function renderUI() {
    content.innerHTML = "";

    const categoryData = grouped[currentTab] || {};
    const tiers = Object.keys(categoryData)
      .map(Number)
      .sort((a, b) => a - b);

    const board = document.createElement("div");
    Object.assign(board.style, {
      position: "relative",
      background:
        "radial-gradient(circle at 70% 20%, rgba(65,120,255,0.18), transparent 28%), radial-gradient(circle at 30% 60%, rgba(0,150,255,0.08), transparent 24%), linear-gradient(180deg, #05070d 0%, #08101c 100%)",
      border: "1px solid rgba(77,113,170,0.28)",
      borderRadius: "12px",
      padding: "18px 14px",
      overflowX: "auto"
    });

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      position: "relative",
      minWidth: "620px",
      display: "flex",
      flexDirection: "column",
      gap: "18px"
    });

    tiers.forEach((tier, index) => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        alignItems: "center",
        columnGap: "16px",
        minHeight: "96px",
        position: "relative"
      });

      const leftCol = document.createElement("div");
      Object.assign(leftCol.style, {
        position: "relative",
        height: "100%",
        minHeight: "96px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start"
      });

      const badge = createTierBadge(tier);
      badge.style.marginTop = "6px";
      leftCol.appendChild(badge);

      if (index < tiers.length - 1) {
        const line = document.createElement("div");
        Object.assign(line.style, {
          position: "absolute",
          top: "48px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "2px",
          height: "calc(100% + 18px)",
          background:
            "linear-gradient(180deg, rgba(100,160,255,0.75) 0%, rgba(80,120,200,0.18) 100%)",
          boxShadow: "0 0 8px rgba(77,150,255,0.25)"
        });
        leftCol.appendChild(line);
      }

      const nodeArea = document.createElement("div");
      Object.assign(nodeArea.style, {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minHeight: "96px",
        padding: "0 8px",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        background: "rgba(5, 10, 18, 0.42)"
      });

      const rowNodes = categoryData[tier] || [];

      rowNodes.forEach((node, nodeIndex) => {
        const nodeEl = createNode(node);
        nodeArea.appendChild(nodeEl);

        if (nodeIndex < rowNodes.length - 1) {
          const hLine = document.createElement("div");
          Object.assign(hLine.style, {
            width: "22px",
            height: "2px",
            background:
              "linear-gradient(90deg, rgba(100,160,255,0.6) 0%, rgba(100,160,255,0.18) 100%)",
            boxShadow: "0 0 6px rgba(77,150,255,0.16)"
          });
          nodeArea.appendChild(hLine);
        }
      });

      row.appendChild(leftCol);
      row.appendChild(nodeArea);
      grid.appendChild(row);
    });

    board.appendChild(grid);
    content.appendChild(board);
  }

  root.appendChild(tabs);
  root.appendChild(content);
  wrapper.appendChild(root);

  updateTabUI();
  renderUI();

  return wrapper;
}