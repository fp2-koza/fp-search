// FP2級 完全講義 検索 — client-side search over slide manifest
(function () {
  const state = { all: [], filtered: [], domain: "all", q: "", results: [] };

  const el = {
    grid: document.getElementById("grid"),
    q: document.getElementById("q"),
    clear: document.getElementById("clear-btn"),
    empty: document.getElementById("empty"),
    meta: document.getElementById("result-meta"),
    total: document.getElementById("total-count"),
    tabs: document.getElementById("domain-tabs"),
    ocrWarn: document.getElementById("ocr-warning"),
    lb: document.getElementById("lightbox"),
    lbImg: document.getElementById("lb-img"),
    lbCap: document.getElementById("lb-cap"),
    lbClose: document.getElementById("lb-close"),
    lbPrev: document.getElementById("lb-prev"),
    lbNext: document.getElementById("lb-next"),
  };

  let lbIndex = -1;

  // 全角英数(ＮＩＳＡ等)や半角カナでも一致するよう NFKC 正規化 + 小文字化
  const norm = (t) => (t || "").normalize("NFKC").toLowerCase();

  // --- load data ---
  fetch("data/slides.json")
    .then((r) => r.json())
    .then((data) => {
      state.all = data.slides || [];
      state.all.forEach((s) => { s._n = norm(s.text); }); // 検索用に事前正規化
      el.total.textContent = state.all.length;
      const done = state.all.filter((s) => s.text && s.text.length > 0).length;
      const total = state.all.length;
      if (done === 0) {
        el.ocrWarn.textContent =
          "⚠ 現在はスライド画像のみ登録済みです。全文検索は文字起こし（OCR）データ投入後に有効になります。";
      } else if (done < total) {
        el.ocrWarn.textContent =
          `📝 全文検索データ投入中：${done} / ${total} 枚（OCR済みスライドはキーワードで検索できます）`;
      } else {
        el.ocrWarn.textContent = `✅ 全 ${total} 枚が全文検索に対応しています。`;
        el.ocrWarn.classList.add("ocr-done");
      }
      apply();
    })
    .catch(() => {
      el.meta.textContent = "データの読み込みに失敗しました。";
    });

  // --- filtering ---
  function apply() {
    const q = norm(state.q.trim());
    let list = state.all;
    if (state.domain !== "all") list = list.filter((s) => s.domain === state.domain);
    if (q) {
      // 本文(text)のみを検索対象にする。
      // 分野名(domainTitle)やID(A-001等)を含めると、本文に無いキーワードでも
      // 分野まるごと・ID一致で誤ヒットするため除外。
      list = list.filter((s) => (s._n || "").includes(q));
    }
    state.results = list;
    render(list);
  }

  function render(list) {
    el.grid.innerHTML = "";
    el.empty.hidden = list.length > 0;
    const label = state.q ? `「${state.q}」の検索結果` : "表示中";
    el.meta.textContent = `${label}：${list.length} 件`;

    const frag = document.createDocumentFragment();
    list.forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img class="card-thumb" loading="lazy" src="${s.img}" alt="${s.id}">
        <div class="card-body">
          <span class="card-domain">${s.domain}</span>
          <span class="card-id">${s.id} ・ p${s.page}</span>
        </div>`;
      card.addEventListener("click", () => openLightbox(i));
      frag.appendChild(card);
    });
    el.grid.appendChild(frag);
  }

  // --- lightbox ---
  function openLightbox(i) {
    lbIndex = i;
    const s = state.results[i];
    if (!s) return;
    el.lbImg.src = s.img;
    el.lbCap.textContent = `${s.domainTitle}　${s.id}（p${s.page}）`;
    el.lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    el.lb.hidden = true;
    document.body.style.overflow = "";
  }
  function step(d) {
    const n = state.results.length;
    if (!n) return;
    lbIndex = (lbIndex + d + n) % n;
    openLightbox(lbIndex);
  }

  // --- events ---
  el.q.addEventListener("input", (e) => {
    state.q = e.target.value;
    el.clear.hidden = !state.q;
    apply();
  });
  el.clear.addEventListener("click", () => {
    state.q = "";
    el.q.value = "";
    el.clear.hidden = true;
    apply();
    el.q.focus();
  });
  el.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    state.domain = btn.dataset.domain;
    [...el.tabs.children].forEach((b) => b.classList.toggle("active", b === btn));
    apply();
  });
  el.lbClose.addEventListener("click", closeLightbox);
  el.lbPrev.addEventListener("click", () => step(-1));
  el.lbNext.addEventListener("click", () => step(1));
  el.lb.addEventListener("click", (e) => { if (e.target === el.lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (el.lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();
