const util = require("util");

function safeJson(value) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      return val;
    });
  } catch (e) {
    return JSON.stringify({
      _error: "JSON.stringify failed",
      message: e && e.message ? e.message : String(e),
    });
  }
}

/**
 * Node 콘솔 출력을 DB로 저장하기
 * - console.log/info/warn/error/debug 를 래핑합니다.
 * - 원래 콘솔 출력은 그대로 유지됩니다.
 *
 * @param {object} opts
 * @param {import('mysql2/promise').Pool} opts.pool
 * @param {string} [opts.source] - 'server' | 'client' 등
 */
function attachConsoleDbLogger({ pool, source = "server" }) {
  if (!pool) throw new Error("attachConsoleDbLogger: pool is required");

  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // DB insert는 비동기로 처리하되, 폭주 방지용 큐를 둡니다.
  const queue = [];
  let flushing = false;
  const MAX_QUEUE = 500;

  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      while (queue.length) {
        const item = queue.shift();
        // eslint-disable-next-line no-await-in-loop
        await pool.execute(
          "INSERT INTO app_logs (source, level, message, meta) VALUES (?, ?, ?, ?)",
          [item.source, item.level, item.message, item.meta]
        );
      }
    } catch (e) {
      // DB 오류로 로그가 무한 재귀하지 않도록 원본 콘솔만 사용
      original.error("[consoleDbLogger] failed to write log:", e);
    } finally {
      flushing = false;
    }
  }

  function enqueue(level, args) {
    // console과 유사한 포맷팅
    const message = util.format(...args);
    const meta = safeJson({ args });

    if (queue.length >= MAX_QUEUE) {
      // 오래된 로그를 버리고 최신을 유지
      queue.shift();
    }
    queue.push({ source, level, message, meta });
    // fire-and-forget flush
    flush();
  }

  console.log = (...args) => {
    original.log(...args);
    enqueue("log", args);
  };
  console.info = (...args) => {
    original.info(...args);
    enqueue("info", args);
  };
  console.warn = (...args) => {
    original.warn(...args);
    enqueue("warn", args);
  };
  console.error = (...args) => {
    original.error(...args);
    enqueue("error", args);
  };
  console.debug = (...args) => {
    original.debug(...args);
    enqueue("debug", args);
  };

  // 프로세스 종료 시 남은 로그를 최대한 flush
  const onExit = async () => {
    try {
      await flush();
    } catch {
      // ignore
    }
  };
  process.on("beforeExit", onExit);
  process.on("SIGINT", async () => {
    await onExit();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await onExit();
    process.exit(0);
  });

  return {
    detach() {
      console.log = original.log;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
      console.debug = original.debug;
    },
  };
}

module.exports = { attachConsoleDbLogger };
