// server.js (ES Module)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= DB 연결 =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // 🔥 Supabase 필수
});

// ================= 루트 =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= 캐릭터 API =================
const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMjgzMzcifQ.DyyRxqMKmeWLtf_zJWNkMabxMBbdqa5YZorrfgA1nXOwyvzuBi-fHzfLO91JIDZLdalvoUVFq-egSAG3ylQlSiMVHA6bBxrlrjjR8-gbVHYP2r3QB0SPFU5kwvTLSsfczDJeVextkgWa_V7BYfIFHrL8rn5MG0xJINb6gbZSIOC9uDnoJ7l0tZ7eos-1qzf-M7Wpa_3V4OriI3jJszn7xuvyIxyFSGd2X5zaVCkRdLNRAxb6qCReX0glkUabYC99GjhgW2Ckz42AA2UhREF4NbAU9hRH7cXeytwoYq_GpaAOw0lrGL8I_T_f3tZqpEE5vpUNbFqcxMvTyr9G04Hh3A";

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

// 🔹 저장
app.post("/api/raid/save", async (req, res) => {
  const { character, raids } = req.body;

  try {
    // 기존 삭제
    await pool.query(
      `DELETE FROM public.character_raid WHERE character_name = $1`,
      [character]
    );

    // 새로 저장
    for (const r of raids) {
      await pool.query(
        `INSERT INTO public.character_raid
         (character_name, raid_name, level, gold, selected)
         VALUES ($1, $2, $3, $4, $5)`,
        [character, r.raid, r.level, r.gold, r.selected]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("RAID SAVE ERROR:", err);
    res.status(500).json({ error: "raid 저장 실패" });
  }
});

// 🔹 조회 (팝업 복원용)
app.get("/api/raid/:character", async (req, res) => {
  const { character } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT raid_name AS raid, level, gold, selected
       FROM public.character_raid
       WHERE character_name = $1`,
      [character]
    );

    res.json(rows);
  } catch (err) {
    console.error("RAID LOAD ERROR:", err);
    res.status(500).json({ error: "raid 조회 실패" });
  }
});

// ================= HOMEWORK =================
const { rows } = await pool.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_name = 'character_raid'
`);
console.log(rows);
// 🔹 조회
app.get("/api/homework/:character", async (req, res) => {
  const { character } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT task_name, checked, gauge
       FROM character_homework
       WHERE character_name = $1 AND date = CURRENT_DATE`,
      [character]
    );

    res.json(rows);
  } catch (err) {
    console.error("HOMEWORK LOAD ERROR:", err);
    res.status(500).json({ error: "DB 오류" });
  }
});

// 🔹 저장
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