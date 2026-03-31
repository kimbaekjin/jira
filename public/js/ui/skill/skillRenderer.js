import { fetchSkills } from "./skillAPI.js";

export async function renderSkills(name) {
  const container = document.createElement("div");
  let data;

  try {
    data = await fetchSkills(name);
  } catch (err) {
    console.error(err);
    container.innerText = "스킬 불러오기 실패";
    return container;
  }

  const skills = (data?.Skills || data || [])
    .filter(skill => (skill.Level || 0) >= 4);

  console.log(skills)

  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    maxWidth: "400px",
    margin: "0 auto"
  });

  skills.forEach(skill => {
    const slot = document.createElement("div");

    Object.assign(slot.style, {
      border: "1px solid #ccc",
      padding: "8px",
      borderRadius: "6px",
      background: "#1e1e1e",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    });

    // ================= HEADER =================
    const header = document.createElement("div");

    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    });

    const left = document.createElement("div");

    Object.assign(left.style, {
      display: "flex",
      alignItems: "center",
      gap: "6px"
    });

    left.innerHTML = `
      <img src="${skill.Icon}" width="40" height="40" />
      <div>
        <div style="font-size:12px;">${skill.Name}</div>
        <div style="font-size:12px;">Lv. ${skill.Level}</div>
      </div>
    `;

    const rune = document.createElement("div");

    Object.assign(rune.style, {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "10px"
    });

    if (skill.Rune) {
      const grade = skill.Rune.Grade;

      let bg = "";
      let border = "#666";

      if (grade === "전설") {
        bg = "linear-gradient(135deg, rgb(54, 32, 3), rgb(158, 95, 4))";
      } else if (grade === "영웅") {
        bg = "linear-gradient(135deg, rgb(38, 19, 49), rgb(72, 13, 93))";
      } else if (grade === "희귀") {
        bg = "linear-gradient(135deg, rgb(17, 31, 44), rgb(17, 61, 93))";
      } else if (grade === "고급") {
        bg = "linear-gradient(135deg, rgb(24, 34, 11), rgb(48, 73, 17))";
      }

      const runeBox = document.createElement("div");

      Object.assign(runeBox.style, {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 6px",
        borderRadius: "6px",
        background: bg,
        border: `1px solid ${border}`,
        fontSize: "10px",
        color: "#fff",
        whiteSpace: "nowrap"
      });

      runeBox.innerHTML = `
        <img src="${skill.Rune.Icon}" width="22" height="22" />
        <span>[${grade}] ${skill.Rune.Name}</span>
      `;

      rune.appendChild(runeBox);
    }

    header.appendChild(left);
    header.appendChild(rune);

    slot.appendChild(header);

    // ================= 트포 ROW =================
    const tripodRow = document.createElement("div");

    Object.assign(tripodRow.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: "4px"
    });

    // ▶ 트포 영역
    const tripodWrap = document.createElement("div");

    Object.assign(tripodWrap.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px"
    });

    const selectedTripods = (skill.Tripods || [])
      .filter(t => t.IsSelected)
      .sort((a, b) => a.Tier - b.Tier);

    selectedTripods.forEach(t => {
      const tDiv = document.createElement("div");

      Object.assign(tDiv.style, {
        display: "flex",
        alignItems: "center",
        gap: "3px",
        border: "1px solid #333",
        borderRadius: "4px",
        padding: "2px 4px",
        background: "#2a2a2a",
        cursor: "pointer"
      });

      tDiv.innerHTML = `
        <img src="${t.Icon}" width="14" height="14"/>
        <span style="font-size:10px;">${t.Name}</span>
      `;

      // ================= TOOLTIP =================
      const tooltip = document.createElement("div");

      Object.assign(tooltip.style, {
        position: "fixed",
        background: "#1e1e1e",
        color: "#fff",
        padding: "8px",
        borderRadius: "8px",
        fontSize: "12px",
        display: "none",
        zIndex: "9999",
        pointerEvents: "none",
        maxWidth: "250px",
        lineHeight: "1.4",
        whiteSpace: "pre-line"
      });

      const raw = t.Tooltip || "";
      const clean = raw
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\|/g, "\n");

      tooltip.innerHTML = clean;
      document.body.appendChild(tooltip);

      tDiv.addEventListener("mouseenter", () => {
        tooltip.style.display = "block";
      });

      tDiv.addEventListener("mousemove", (e) => {
        const rect = tooltip.getBoundingClientRect();

        let top = e.clientY + 12;
        let left = e.clientX + 12;

        if (top + rect.height > window.innerHeight) {
          top = e.clientY - rect.height - 12;
        }

        if (left + rect.width > window.innerWidth) {
          left = e.clientX - rect.width - 12;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
      });

      tDiv.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          tooltip.style.display = "none";
        }
      });

      tripodWrap.appendChild(tDiv);
    });

    // ▶ 슬롯 영역
    const slotIndicator = document.createElement("div");

    Object.assign(slotIndicator.style, {
      display: "flex",
      gap: "4px"
    });

    const tripodSlots = [null, null, null];

    (skill.Tripods || []).forEach(t => {
      if (t.IsSelected) {
        tripodSlots[t.Tier] = t.Slot;
      }
    });

    tripodSlots.forEach(slotNum => {
      const box = document.createElement("div");

      Object.assign(box.style, {
        width: "18px",
        height: "18px",
        border: "1px solid #888",
        borderRadius: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: "bold",
        background: "#2a2a2a",
        color: "#fff"
      });

      if (slotNum !== null) box.innerText = slotNum;
      else box.style.opacity = "0.3";

      slotIndicator.appendChild(box);
    });

    // ================= 조립 =================
    tripodRow.appendChild(tripodWrap);
    tripodRow.appendChild(slotIndicator);

    slot.appendChild(tripodRow);
    grid.appendChild(slot);
  });

  container.appendChild(grid);
  return container;
}