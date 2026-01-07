// public/js/subscribe.js

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

  setStatus("저장 요청 준비 완료! (지금은 콘솔만 출력)", "ok");
});
