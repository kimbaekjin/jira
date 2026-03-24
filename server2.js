// server2.js (ES Module)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// static 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

// 루트 접근 시 test.html 반환
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/test.html"));
});

// /test 라우트
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "public/test.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});