// public/js/subscribe.js

// --- (1) 브라우저 콘솔 출력 -> 서버로 전송 -> DB 저장 ---
// 서버(server.js)의 POST /api/client-logs 에서 app_logs 테이블에 저장합니다.
(function attachClientConsoleLogger() {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  async function send(level, args) {
    try {
      // console과 유사하게 문자열로 합치기
      const message = args
        .map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");

      await fetch("/api/client-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          message,
          meta: {
            args,
            url: location.href,
            userAgent: navigator.userAgent,
            ts: new Date().toISOString(),
          },
        }),
      });
    } catch {
      // 로깅 전송 실패는 조용히 무시
    }
  }

  console.log = (...args) => {
    original.log(...args);
    send("log", args);
  };
  console.info = (...args) => {
    original.info(...args);
    send("info", args);
  };
  console.warn = (...args) => {
    original.warn(...args);
    send("warn", args);
  };
  console.error = (...args) => {
    original.error(...args);
    send("error", args);
  };
  console.debug = (...args) => {
    original.debug(...args);
    send("debug", args);
  };
})();

// MVP용: 페이지 내부에서만 키워드 상태 관리
const keywords = new Set();

const $chips = document.getElementById("chips");
const $keywordInput = document.getElementById("keywordInput");
const $addBtn = document.getElementById("addKeywordBtn");
const $form = document.getElementById("subscribeForm");
const $status = document.getElementById("status");

function setStatus(msg, type) {
  $status.textContent = msg || "";
  $status.className = "status " + (type || "");
}

function normalizeKeyword(raw) {
  return (raw || "").trim().replace(/\s+/g, " ");
}

function renderChips() {
  $chips.innerHTML = "";

  for (const kw of keywords) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = kw;

    const x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", `${kw} 삭제`);
    x.textContent = "×";
    x.addEventListener("click", () => {
      keywords.delete(kw);
      renderChips();
    });

    chip.appendChild(x);
    $chips.appendChild(chip);
  }
}

function addKeywordFromInput() {
  const kw = normalizeKeyword($keywordInput.value);
  if (!kw) return;

  if (keywords.has(kw)) {
    setStatus(`이미 등록된 키워드: ${kw}`, "err");
    $keywordInput.select();
    return;
  }

  keywords.add(kw);
  $keywordInput.value = "";
  setStatus("", "");
  renderChips();
}

$addBtn.addEventListener("click", addKeywordFromInput);

$keywordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addKeywordFromInput();
  }
});

$form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const langs = Array.from(
    document.querySelectorAll('input[name="lang"]:checked')
  ).map((el) => el.value);

  const kwList = Array.from(keywords);

  if (!email) return setStatus("이메일을 입력해줘.", "err");
  if (langs.length === 0) return setStatus("언어를 최소 1개 선택해줘.", "err");
  if (kwList.length === 0) return setStatus("키워드를 최소 1개 추가해줘.", "err");

  const payload = { email, languages: langs, keywords: kwList };
  console.log("SUBSCRIBE PAYLOAD:", payload);

  // --- (2) 저장 요청: 서버로 보내서 DB에 저장 ---
  fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json().catch(() => ({})))
    .then((data) => {
      if (data && data.ok) {
        setStatus("구독 정보가 저장됐어! (DB 저장 완료)", "ok");
      } else {
        setStatus("저장에 실패했어. 서버/DB 설정을 확인해줘.", "err");
        console.error("SUBSCRIBE SAVE FAILED:", data);
      }
    })
    .catch((err) => {
      setStatus("저장에 실패했어. 서버가 실행 중인지 확인해줘.", "err");
      console.error("SUBSCRIBE FETCH ERROR:", err);
    });
});
