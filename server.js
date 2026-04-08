// server.js (ES Module)
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= 로그 미들웨어 =================
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// ================= 환경변수 =================
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.LOSTARK_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  console.error("❌ LOSTARK_API_KEY가 설정되지 않았습니다.");
}
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL이 설정되지 않았습니다.");
}

// ================= DB 연결 =================
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================= 캐시 =================
const profileCache = new Map();
const armoryCache = new Map();

const PROFILE_TTL = 10 * 60 * 1000; // 10분
const CACHE_TTL = 10 * 60 * 1000;   // 10분

// ================= 유틸 =================
function getCache(cacheMap, key, ttl) {
  const cached = cacheMap.get(key);
  if (!cached) return null;

  if (Date.now() - cached.time < ttl) {
    return cached.data;
  }

  cacheMap.delete(key);
  return null;
}

function setCache(cacheMap, key, data) {
  cacheMap.set(key, {
    data,
    time: Date.now()
  });
}

function getArmoryEndpoint(type) {
  const map = {
    equipment: "equipment",
    arkpassive: "arkpassive",
    "combat-skills": "combat-skills",
    gems: "gems",
    arkgrid: "arkgrid"
  };

  return map[type] || "";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safeFetchJson(url, options = {}, timeoutMs = 5000) {
  try {
    const response = await fetchWithTimeout(url, options, timeoutMs);
    const text = await response.text();

    if (!response.ok) {
      console.error("[API ERROR]", response.status, url, text);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error("[JSON PARSE ERROR]", url, parseErr);
      return null;
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[TIMEOUT]", url);
    } else {
      console.error("[FETCH ERROR]", url, err);
    }
    return null;
  }
}

async function fetchProfile(name) {
  const key = name;
  const cached = getCache(profileCache, key, PROFILE_TTL);
  if (cached) {
    console.log("[CACHE HIT] profile:", key);
    return cached;
  }

  const encoded = encodeURIComponent(name);
  const url = `https://developer-lostark.game.onstove.com/armories/characters/${encoded}/profiles`;

  console.time(`[PROFILE FETCH] ${name}`);

  const data = await safeFetchJson(
    url,
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${API_KEY}`
      }
    },
    5000
  );

  console.timeEnd(`[PROFILE FETCH] ${name}`);

  if (data) {
    setCache(profileCache, key, data);
    return data;
  }

  return {
    CharacterImage: "/images/placeholder.png",
    CharacterName: name,
    ItemAvgLevel: 0,
    CombatPower: 0
  };
}

async function fetchArmory(name, type) {
  const endpoint = getArmoryEndpoint(type);
  if (!endpoint) return null;

  const key = `${name}-${type}`;
  const cached = getCache(armoryCache, key, CACHE_TTL);
  if (cached) {
    console.log("[CACHE HIT] armory:", key);
    return cached;
  }

  const url = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(name)}/${endpoint}`;

  console.time(`[ARMORY FETCH] ${key}`);

  const data = await safeFetchJson(
    url,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    },
    5000
  );

  console.timeEnd(`[ARMORY FETCH] ${key}`);

  if (data) {
    setCache(armoryCache, key, data);
    return data;
  }

  return null;
}

// ================= 루트 =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= 빠른 통합 API =================
// profile + equipment 먼저
app.get("/api/main/:name", async (req, res) => {
  const { name } = req.params;

  console.time(`[MAIN API] ${name}`);

  try {
    const [profile, equipment] = await Promise.all([
      fetchProfile(name),
      fetchArmory(name, "equipment")
    ]);

    res.json({
      profile,
      equipment: equipment || []
    });
  } catch (err) {
    console.error("[MAIN API ERROR]", err);
    res.status(500).json({
      profile: {
        CharacterImage: "/images/placeholder.png",
        CharacterName: name,
        ItemAvgLevel: 0,
        CombatPower: 0
      },
      equipment: []
    });
  } finally {
    console.timeEnd(`[MAIN API] ${name}`);
  }
});

// ================= 상세 통합 API =================
// 느린 데이터는 따로
app.get("/api/detail/:name", async (req, res) => {
  const { name } = req.params;

  console.time(`[DETAIL API] ${name}`);

  try {
    const results = await Promise.allSettled([
      fetchArmory(name, "arkpassive"),
      fetchArmory(name, "combat-skills"),
      fetchArmory(name, "gems"),
      fetchArmory(name, "arkgrid")
    ]);

    res.json({
      arkpassive: results[0].status === "fulfilled" ? results[0].value : null,
      skills: results[1].status === "fulfilled" ? results[1].value : null,
      gems: results[2].status === "fulfilled" ? results[2].value : null,
      arkgrid: results[3].status === "fulfilled" ? results[3].value : null
    });
  } catch (err) {
    console.error("[DETAIL API ERROR]", err);
    res.status(500).json({
      arkpassive: null,
      skills: null,
      gems: null,
      arkgrid: null
    });
  } finally {
    console.timeEnd(`[DETAIL API] ${name}`);
  }
});

// ================= 기존 Armory 단일 API 유지 =================
app.get("/api/armories/:name/:type", async (req, res) => {
  const { name, type } = req.params;

  try {
    const endpoint = getArmoryEndpoint(type);

    if (!endpoint) {
      return res.status(400).json({ error: "잘못된 type" });
    }

    const data = await fetchArmory(name, type);

    if (data === null) {
      return res.status(502).json({ error: "외부 API 응답 실패" });
    }

    res.json(data);
  } catch (err) {
    console.error("Armory API 에러:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// ================= 기존 Profile API 유지 =================
app.get("/character/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const data = await fetchProfile(name);
    res.json(data);
  } catch (err) {
    console.error("Profile API 에러:", err);
    res.json({
      CharacterImage: "/images/placeholder.png",
      CharacterName: name,
      ItemAvgLevel: 0,
      CombatPower: 0
    });
  }
});

// ================= RAID 저장 =================
app.post("/api/raid/save", async (req, res) => {
  const { character, raids } = req.body;

  if (!Array.isArray(raids)) {
    return res.status(400).json({ error: "raids 배열 필요" });
  }

  try {
    for (const r of raids) {
      console.log("DB에 넣을 레이드 데이터:", [
        character,
        r.raid,
        r.level,
        r.gold ?? false,
        r.selected ?? true,
        Number(r.busFee) || 0,
        r.completed ?? false
      ]);

      await pool.query(
        `INSERT INTO public.character_raid
         (character_name, raid_name, level, gold, selected, bus_fee, completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (character_name, raid_name)
         DO UPDATE SET
           level = EXCLUDED.level,
           gold = EXCLUDED.gold,
           selected = EXCLUDED.selected,
           bus_fee = EXCLUDED.bus_fee,
           completed = EXCLUDED.completed`,
        [
          character,
          r.raid,
          r.level,
          r.gold ?? false,
          r.selected ?? true,
          Number(r.busFee) || 0,
          r.completed ?? false
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("RAID SAVE ERROR:", err);
    res.status(500).json({ error: "raid 저장 실패" });
  }
});

// ================= RAID 조회 =================
app.get("/api/raid/:character", async (req, res) => {
  const { character } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         raid_name AS raid,
         level,
         gold,
         selected,
         bus_fee,
         completed
       FROM character_raid
       WHERE character_name = $1`,
      [character]
    );

    const formatted = rows.map((r) => ({
      raid: r.raid,
      level: r.level,
      gold: r.gold,
      selected: r.selected,
      busFee: r.bus_fee ?? 0,
      completed: r.completed ?? false
    }));

    res.json(formatted);
  } catch (err) {
    console.error("RAID LOAD ERROR:", err);
    res.status(500).json([]);
  }
});

// ================= HOMEWORK 조회 =================
app.get("/api/homework/:character", async (req, res) => {
  const { character } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT task_name, checked, gauge
       FROM character_homework
       WHERE character_name = $1
         AND date = (NOW() AT TIME ZONE 'Asia/Seoul')::date`,
      [character]
    );

    res.json(rows || []);
  } catch (err) {
    console.error("HOMEWORK LOAD ERROR:", err);
    res.status(500).json([]);
  }
});

// ================= HOMEWORK 저장 =================
app.post("/api/homework/:character/:task", async (req, res) => {
  const { character, task } = req.params;
  const { checked, gauge } = req.body;

  try {
    await pool.query(
      `INSERT INTO character_homework
       (character_name, task_name, date, checked, gauge)
       VALUES ($1, $2, (NOW() AT TIME ZONE 'Asia/Seoul')::date, $3, $4)
       ON CONFLICT (character_name, task_name, date)
       DO UPDATE SET checked = EXCLUDED.checked, gauge = EXCLUDED.gauge`,
      [character, task, checked, gauge]
    );

    console.log("[POST 요청]", {
      character,
      task,
      checked,
      gauge,
      time: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("HOMEWORK SAVE ERROR:", err);
    res.status(500).json({ error: "DB 업데이트 실패" });
  }
});

// ================= HOMEWORK CRON TRIGGER =================
app.post("/api/homework/cron-trigger", async (req, res) => {
  try {
    await pool.query("BEGIN");

    const today = `(NOW() AT TIME ZONE 'Asia/Seoul')::date`;
    const yesterday = `(NOW() AT TIME ZONE 'Asia/Seoul')::date - INTERVAL '1 day'`;

    // 1. 3일 이전 데이터 삭제
    await pool.query(`
      DELETE FROM character_homework
      WHERE date < ${today} - INTERVAL '2 days'
    `);

    console.log("[CRON] 오래된 데이터 삭제 완료");

    // 2. 어제 데이터 가져오기
    const { rows } = await pool.query(`
      SELECT character_name, task_name, gauge, checked
      FROM character_homework
      WHERE date = ${yesterday}
    `);

    for (const row of rows) {
      let increment = 0;
      let maxGauge = 100;

      if (row.task_name === "쿠르잔전선") maxGauge = 200;
      else if (row.task_name === "가디언토벌") maxGauge = 100;

      if (!row.checked) {
        if (row.task_name === "쿠르잔전선") increment = 20;
        else if (row.task_name === "가디언토벌") increment = 10;
      }

      let newGauge = row.gauge;
      if (increment > 0) {
        newGauge = Math.min(row.gauge + increment, maxGauge);
      }

      // 3. 오늘 데이터로 저장
      await pool.query(
        `
        INSERT INTO character_homework
        (character_name, task_name, date, checked, gauge)
        VALUES ($1, $2, ${today}, $3, $4)
        ON CONFLICT (character_name, task_name, date)
        DO UPDATE SET
          checked = EXCLUDED.checked,
          gauge = EXCLUDED.gauge
        `,
        [row.character_name, row.task_name, false, newGauge]
      );
    }

    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("CRON ERROR:", err);
    res.status(500).json({ error: "cron 실패" });
  }
});

// ================= 상태 확인 =================
app.get("/test", (req, res) => {
  res.send("OK");
});

// ================= 서버 실행 =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});