require("dotenv").config();

const path = require("path");
const express = require("express");

const { getPool } = require("./src/db/pool");
const { attachConsoleDbLogger } = require("./src/logging/consoleDbLogger");

const app = express();
app.use(express.json({ limit: "1mb" }));

// 정적 페이지 (구독 폼)
app.use(express.static(path.join(__dirname, "public")));

const pool = getPool();

// 서버 콘솔 출력 DB로 저장
attachConsoleDbLogger({ pool, source: "server" });

/**
 * 구독 저장 (MVP)
 * - subscribers / subscriber_languages / subscriber_keywords 저장
 */
app.post("/api/subscribe", async (req, res) => {
  const { email, languages, keywords } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "email is required" });
  }
  if (!Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ ok: false, error: "languages is required" });
  }
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ ok: false, error: "keywords is required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanLangs = [...new Set(languages.map((l) => String(l).trim()))].filter(Boolean);
  const cleanKeywords = [...new Set(keywords.map((k) => String(k).trim()))].filter(Boolean);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // upsert subscriber
    await conn.execute(
      "INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = VALUES(email)",
      [cleanEmail]
    );

    const [[row]] = await conn.execute("SELECT id FROM subscribers WHERE email = ?", [cleanEmail]);
    const subscriberId = row.id;

    // 기존 설정 제거 후 재삽입 (MVP 단순화)
    await conn.execute("DELETE FROM subscriber_languages WHERE subscriber_id = ?", [subscriberId]);
    await conn.execute("DELETE FROM subscriber_keywords WHERE subscriber_id = ?", [subscriberId]);

    for (const lang of cleanLangs) {
      await conn.execute(
        "INSERT INTO subscriber_languages (subscriber_id, lang) VALUES (?, ?)",
        [subscriberId, lang]
      );
    }
    for (const kw of cleanKeywords) {
      await conn.execute(
        "INSERT INTO subscriber_keywords (subscriber_id, keyword) VALUES (?, ?)",
        [subscriberId, kw]
      );
    }

    await conn.commit();

    console.log("SUBSCRIBE SAVED:", { email: cleanEmail, languages: cleanLangs, keywords: cleanKeywords });

    return res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("/api/subscribe failed:", e);
    return res.status(500).json({ ok: false, error: "internal error" });
  } finally {
    conn.release();
  }
});

/**
 * 브라우저(클라이언트) 콘솔 로그를 DB로 저장
 * - public/js/subscribe.js 에서 console 래핑 후 호출
 */
app.post("/api/client-logs", async (req, res) => {
  const { level, message, meta } = req.body || {};

  // 너무 큰 payload 방지
  const lv = String(level || "log").slice(0, 16);
  const msg = String(message || "").slice(0, 20000);
  let safeMeta = null;
  if (meta) {
    const raw = JSON.stringify(meta);
    // JSON 컬럼이므로 잘려서 깨지지 않게 별도 포맷으로 제한합니다.
    if (raw.length <= 20000) {
      safeMeta = raw;
    } else {
      safeMeta = JSON.stringify({
        truncated: true,
        preview: raw.slice(0, 19000),
      });
    }
  }

  try {
    await pool.execute(
      "INSERT INTO app_logs (source, level, message, meta) VALUES (?, ?, ?, ?)",
      ["client", lv, msg, safeMeta]
    );
    return res.json({ ok: true });
  } catch (e) {
    // 클라이언트 로깅은 실패해도 사용자 경험에 영향 없게 200 유지
    console.error("/api/client-logs failed:", e);
    return res.json({ ok: false });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`server running: http://localhost:${PORT}`);
});
