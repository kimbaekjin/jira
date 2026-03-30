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

    if (type === "팔찌") {
      const raw = tooltip?.Element_005?.value?.Element_001 || "";

      const { baseStats, effects } = parseBracelet(raw);

      return {
        name,
        type,
        icon,
        baseStats,
        effects
      };
    }

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

function parseBracelet(raw) {
  if (!raw) return { baseStats: [], effects: [] };

  // 1. 옵션 기준 분리
  const blocks = raw
    .split(/<img[^>]*>/i) // img 기준 분리
    .map(v => v.trim())
    .filter(Boolean);

  const baseStats = [];
  const effects = [];

  const statKeywords = [
    "힘", "민첩", "지능", "체력",
    "특화", "신속", "치명", "제압", "인내", "최대 생명력"
  ];

  blocks.forEach(block => {
    // 2. 태그 제거 + 줄 정리
    const clean = block
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .split("\n")
      .map(v => v.trim())
      .filter(Boolean);

    if (clean.length === 0) return;

    // 3. stat vs effect 분리 (첫 줄 기준)
    const first = clean[0];

    const isStat = statKeywords.some(stat =>
      new RegExp(`^${stat}\\s*\\+\\s*\\d+$`).test(first)
    );

    const mergedLine = clean.join(" "); // 👉 한 줄로 합치기

    if (isStat) baseStats.push(mergedLine);
    else effects.push(mergedLine);
  });

  return { baseStats, effects };
}