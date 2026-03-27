export function getGemRawText(gem) {
  try {
    const tooltip = JSON.parse(gem.Tooltip);
    for (const key in tooltip) {
      const el = tooltip[key];
      if (el?.type === "ItemPartBox") {
        let text = el.value?.Element_001;
        if (text) {
          text = text.replace(/<br\s*\/?>/gi, "\n");
          text = text.replace(/<[^>]*>/g, "");
          return text;
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

export function getGemType(gem) {
  const rawText = getGemRawText(gem);
  const firstLine = rawText.split(/\r?\n/)[0] || "";

  if (firstLine.includes("피해") || rawText.includes("지원 효과")) return "damage";
  if (firstLine.includes("재사용") || rawText.includes("재사용")) return "cooldown";

  return "etc";
}

export function formatGemTextLines(rawText) {
  let text = rawText.replace(/<[^>]*>/g, "").replace(/\[[^\]]*\]/g, "");
  text = text.replace(/\s*%증가/g, "% 증가");
  text = text.replace(/\r?\n/g, "\n");

  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  const result = [];

  lines.forEach(line => {
    if (/피해|재사용/.test(line)) {
      result.push(line);
      return;
    }

    if (/지원 효과/.test(line)) {
      const m = line.match(/(.*지원 효과)\s*(.*)/);
      if (m) result.push(m[1] + " " + m[2].trim());
      else result.push(line);
      return;
    }

    if (/추가 효과/.test(line)) {
      const m = line.match(/추가 효과\s*(.*)/);
      if (m && m[1]) {
        result.push("기본 공격력 " + m[1].trim());
      }
      return;
    }

    result.push(line);
  });

  return result;
}