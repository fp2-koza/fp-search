// FP2級 完全講義 検索 — client-side search over slide manifest
(function () {
  const state = { all: [], filtered: [], domain: "all", q: "", results: [], terms: [] };

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
    lbNote: document.getElementById("lb-note"),
    lbClose: document.getElementById("lb-close"),
    lbPrev: document.getElementById("lb-prev"),
    lbNext: document.getElementById("lb-next"),
  };

  let lbIndex = -1;

  // 全角英数(ＮＩＳＡ等)や半角カナでも一致するよう NFKC 正規化 + 小文字化
  const norm = (t) => (t || "").normalize("NFKC").toLowerCase();

  // 検索用インデックス: 正規化文字列 _n と「正規化後の位置→元テキスト位置」対応表 _map。
  // ハイライト表示で元テキストの正しい位置に <mark> を付けるために使う。
  function buildIndex(s) {
    const text = s.text || "";
    let n = "";
    const map = [];
    for (let i = 0; i < text.length; i++) {
      const c = norm(text[i]);
      for (let k = 0; k < c.length; k++) { n += c[k]; map.push(i); }
    }
    s._n = n;
    s._map = map;
  }

  // --- load data ---
  // notes.json = 制度改正の補足（スライド画像は2025年度版のため、現行制度との差分を注記）
  Promise.all([
    fetch("data/slides.json").then((r) => r.json()),
    fetch("data/notes.json").then((r) => r.json()).catch(() => ({})),
  ])
    .then(([data, notes]) => {
      state.all = data.slides || [];
      state.all.forEach((s) => { buildIndex(s); s.note = notes[s.id] || ""; }); // 検索用に事前正規化+注記付与
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
    // スペース(全角含む)区切りで AND 検索。NFKCで全角英数・半角カナも一致。
    const terms = norm(state.q.trim()).split(/\s+/).filter(Boolean);
    let list = state.all;
    if (state.domain !== "all") list = list.filter((s) => s.domain === state.domain);
    if (terms.length) {
      // 本文(text)のみを検索対象にする。
      // 分野名(domainTitle)やID(A-001等)を含めると、本文に無いキーワードでも
      // 分野まるごと・ID一致で誤ヒットするため除外。
      list = list.filter((s) => terms.every((t) => s._n.includes(t)));
    }
    state.terms = terms;
    state.results = list;
    render(list);
  }

  const escapeHtml = (t) =>
    t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 最初の一致箇所の前後を抜き出し、全キーワードを <mark> でハイライトしたHTMLを返す
  function snippetHtml(s, terms) {
    const text = s.text || "";
    const first = s._n.indexOf(terms[0]);
    if (first < 0) return "";
    const oStart = s._map[first];
    const from = Math.max(0, oStart - 20);
    const to = Math.min(text.length, oStart + 60);
    // 表示窓と重なる一致範囲を全キーワード分収集（元テキスト上の位置で）
    const ranges = [];
    for (const t of terms) {
      let idx = 0, guard = 0;
      while ((idx = s._n.indexOf(t, idx)) !== -1 && guard++ < 20) {
        const a = s._map[idx];
        const b = s._map[idx + t.length - 1] + 1;
        if (b > from && a < to) ranges.push([Math.max(a, from), Math.min(b, to)]);
        idx += t.length;
      }
    }
    ranges.sort((x, y) => x[0] - y[0]);
    const merged = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    }
    let html = from > 0 ? "…" : "";
    let pos = from;
    for (const [a, b] of merged) {
      html += escapeHtml(text.slice(pos, a)) + "<mark>" + escapeHtml(text.slice(a, b)) + "</mark>";
      pos = b;
    }
    html += escapeHtml(text.slice(pos, to)) + (to < text.length ? "…" : "");
    return html;
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
      const snip = state.terms && state.terms.length ? snippetHtml(s, state.terms) : "";
      card.innerHTML = `
        <img class="card-thumb" loading="lazy" src="${s.img}" alt="${s.id}">
        <div class="card-body">
          <span class="card-domain">${s.domain}</span>
          <span class="card-id">${s.id} ・ p${s.page}</span>
          ${s.note ? `<span class="card-note-badge">⚠ 制度改正あり</span>` : ""}
          ${snip ? `<p class="card-snippet">${snip}</p>` : ""}
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
    el.lbNote.textContent = s.note || "";
    el.lbNote.hidden = !s.note;
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
