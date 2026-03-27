export function parseEquipmentTooltip(item) {
  try {
    const tooltip =
      typeof item.Tooltip === "string"
        ? JSON.parse(item.Tooltip)
        : item.Tooltip;

    const name = (item.Name || "").replace(/<[^>]*>/g, "");
    const type = item.Type;
    const icon = item.Icon;

    let accessoryStats = [];
    let stoneEngravings = [];

    // ---------------------------
    // 🔥 팔찌 파싱 (핵심 추가)
    // ---------------------------
    if (type === "팔찌") {
      const raw = tooltip?.Element_012?.value?.Element_001 || "";

      const clean = raw
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");

      accessoryStats = clean
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
    }

    // ---------------------------
    // 🔥 기존 악세 파싱 (유지)
    // ---------------------------
    else {
      const baseRaw = tooltip?.Element_004?.value?.Element_001 || "";
      const extraRaw = tooltip?.Element_006?.value?.Element_001 || "";

      const merged = baseRaw + "<br>" + extraRaw;

      const clean = merged
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");

      clean.split("\n").forEach(line => {
        const t = line.trim();
        if (t) accessoryStats.push(t);
      });
    }

    // ---------------------------
    // 🔥 어빌리티 스톤
    // ---------------------------
    if (type === "어빌리티 스톤") {
      const group = tooltip?.Element_007?.value?.Element_000?.contentStr;

      if (group) {
        Object.values(group).forEach(el => {
          let text = el.contentStr || "";
          text = text.replace(/<[^>]*>/g, "");

          const match = text.match(/\[(.*?)\].*Lv\.(\d+)/);
          if (match) {
            stoneEngravings.push({
              name: match[1],
              level: parseInt(match[2])
            });
          }
        });
      }
    }

    return {
      name,
      type,
      icon,
      quality: tooltip?.Element_001?.value?.qualityValue || 0,
      accessoryStats,
      stoneEngravings
    };
  } catch (e) {
    console.log("파싱 에러", e);
    return {
      name: item.Name || "",
      type: item.Type,
      icon: item.Icon,
      quality: 0,
      accessoryStats: [],
      stoneEngravings: []
    };
  }
}