// server.js (ES Module)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= DB 연결 =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase 등 필요
});

// ================= 루트 =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= 캐릭터 API =================
const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMjgzMzcifQ.DyyRxqMKmeWLtf_zJWNkMabxMBbdqa5YZorrfgA1nXOwyvzuBi-fHzfLO91JIDZLdalvoUVFq-egSAG3ylQlSiMVHA6bBxrlrjjR8-gbVHYP2r3QB0SPFU5kwvTLSsfczDJeVextkgWa_V7BYfIFHrL8rn5MG0xJINb6gbZSIOC9uDnoJ7l0tZ7eos-1qzf-M7Wpa_3V4OriI3jJszn7xuvyIxyFSGd2X5zaVCkRdLNRAxb6qCReX0glkUabYC99GjhgW2Ckz42AA2UhREF4NbAU9hRH7cXeytwoYq_GpaAOw0lrGL8I_T_f3tZqpEE5vpUNbFqcxMvTyr9G04Hh3A";

// 🔥 로아 Armory 통합 API
app.get("/api/armories/:name/:type", async (req, res) => {
  const { name, type } = req.params;

  try {
    let endpoint = "";

    // 🔥 type 매핑
    if (type === "equipment") endpoint = "equipment";
    if (type === "skills") endpoint = "combat-skills";
    if (type === "gems") endpoint = "gems";
    if (type === "ark") endpoint = "arkpassive";

    // ❗ 잘못된 요청 방지
    if (!endpoint) {
      return res.status(400).json({ error: "잘못된 type" });
    }

    const url = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(name)}/${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
    });

    const data = await response.json();
    console.log(data)
    res.json(data);
  } catch (err) {
    console.error("Armory API 에러:", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

app.get("/character/:name", async (req, res) => {
  const name = encodeURIComponent(req.params.name);
  try {
    const response = await fetch(
      `https://developer-lostark.game.onstove.com/armories/characters/${name}/profiles`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${API_KEY}`
        }
      }
    );

    const text = await response.text();
    if (!response.ok) return res.status(response.status).send(text);

    res.json(JSON.parse(text));
  } catch (err) {
    console.error(err);
    res.json({
      CharacterImage: "/images/placeholder.png",
      CharacterName: decodeURIComponent(name),
      ItemAvgLevel: 0,
      CombatPower: 0
    });
  }
});

// ================= RAID =================
app.post("/api/raid/save", async (req, res) => {
  const { character, raids } = req.body;

  if (!Array.isArray(raids)) return res.status(400).json({ error: "raids 배열 필요" });

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

// 🔹 RAID 조회 (팝업/카드 복원용)
// server.js - RAID 조회
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

    // DB → 프론트 변환
    const formatted = rows.map(r => ({
      raid: r.raid,
      level: r.level,
      gold: r.gold,
      selected: r.selected,
      busFee: r.bus_fee ?? 0,
      completed: r.completed ?? false // ✅ 핵심 추가
    }));

    res.json(formatted);
  } catch (err) {
    console.error("RAID LOAD ERROR:", err);
    res.status(500).json([]);
  }
});

// ================= HOMEWORK =================
app.get("/api/homework/:character", async (req, res) => {
  const { character } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT task_name, checked, gauge
       FROM character_homework
       WHERE character_name = $1 AND date = CURRENT_DATE`,
      [character]
    );

    res.json(rows || []);
  } catch (err) {
    console.error("HOMEWORK LOAD ERROR:", err);
    res.status(500).json([]);
  }
});

// 🔹 HOMEWORK 저장
app.post("/api/homework/:character/:task", async (req, res) => {
  const { character, task } = req.params;
  const { checked, gauge } = req.body;

  try {
    await pool.query(
      `INSERT INTO character_homework
       (character_name, task_name, date, checked, gauge)
       VALUES ($1, $2, CURRENT_DATE, $3, $4)
       ON CONFLICT (character_name, task_name, date)
       DO UPDATE SET checked = $3, gauge = $4`,
      [character, task, checked, gauge]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("HOMEWORK SAVE ERROR:", err);
    res.status(500).json({ error: "DB 업데이트 실패" });
  }
});

// 매일 오전 6시
// server.js
// ================= HOMEWORK CRON =================
app.post("/api/homework/cron-trigger", async (req, res) => {
  try {
    const now = new Date();

    // KST 기준 시간 변환
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const hour = kst.getHours();

    if (hour !== 10) {
      console.log("[CRON] KST 기준 6시 아님 → 실행 안함");
      console.log(hour)
      return res.json({ skipped: "not_6am_kst" });
    }
    const today = now.toISOString().slice(0, 10);

    // 👉 2. 이미 오늘 실행했는지 체크
    const { rows } = await pool.query(
      `SELECT last_run_date FROM cron_log WHERE id = 1`
    );

    if (rows[0]?.last_run_date === today) {
      console.log("[CRON] 오늘 이미 실행됨 → 스킵");
      return res.json({ skipped: "already_ran" });
    }

    console.log("[CRON] 6시 실행 시작");

    // 👉 3. 기존 로직
    const { rows: homeworkRows } = await pool.query(
      `SELECT character_name, task_name, gauge, checked
       FROM character_homework
       WHERE date = CURRENT_DATE`
    );

    for (const row of homeworkRows) {
      let increment = 0;
      let maxGauge = 100;

      if (row.task_name === "쿠르잔전선") maxGauge = 200;
      else if (row.task_name === "가디언토벌") maxGauge = 100;

      if (!row.checked) {
        if (row.task_name === "쿠르잔전선") increment = 20;
        else if (row.task_name === "가디언토벌") increment = 10;

        if (increment > 0) {
          const newGauge = Math.min(row.gauge + increment, maxGauge);

          await pool.query(
            `UPDATE character_homework
             SET gauge = $1
             WHERE character_name = $2 AND task_name = $3 AND date = CURRENT_DATE`,
            [newGauge, row.character_name, row.task_name]
          );

          console.log(
            `[CRON] ${row.character_name} - ${row.task_name} +${increment}`
          );
        }
      } else {
        await pool.query(
          `UPDATE character_homework
           SET checked = false
           WHERE character_name = $1 AND task_name = $2 AND date = CURRENT_DATE`,
          [row.character_name, row.task_name]
        );

        console.log(
          `[CRON] ${row.character_name} - ${row.task_name} 체크 해제`
        );
      }
    }

        // 👉 4. 실행 기록 저장
        const result = await pool.query(
      `UPDATE cron_log
       SET last_run_date = $1
       WHERE id = 1 AND last_run_date < $1`,
      [today]
    );

    if (result.rowCount === 0) {
      console.log("이미 실행됨 → 스킵");
      return;
    }

        console.log("[CRON] 완료");

        res.json({ success: true });
      } catch (err) {
        console.error("[CRON ERROR]", err);
        res.status(500).json({ error: "cron 실패" });
      }
    });


// ================= 로그 미들웨어 =================
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

app.get("/test", (req, res) => {
  res.send("OK");
});

// ================= 서버 실행 =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});