/* ============================================================
   Agent 2.0 · 课堂助手 — 前端交互
   纯静态实现：hash 路由 + 本地状态 + 模拟数据流
   ============================================================ */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

/* ---------------- 模拟数据 ---------------- */
const CLASSROOMS = [
  { name: "线性代数 · 矩阵分解", date: "2026-10-18", dur: "52:08" },
  { name: "学术英语 · 文献阅读", date: "2026-10-16", dur: "61:40" },
  { name: "机器学习 · 第二讲",   date: "2026-10-15", dur: "47:22" },
  { name: "概率论 · 条件概率",   date: "2026-10-13", dur: "55:03" },
  { name: "数据结构 · 图算法",   date: "2026-10-11", dur: "49:57" },
];

const FILES = [
  { name: "高等数学-第12周课件.pdf", meta: "PDF · 18 页", state: "ok" },
  { name: "矩阵分解讲义.pdf",       meta: "PDF · 12 页", state: "proc" },
  { name: "课后习题集.txt",         meta: "TXT · 6 KB",  state: "ok" },
  { name: "参考文献清单.pdf",       meta: "PDF · 4 页",  state: "err" },
];

const SENTENCES = [
  "我们先把上节课的奇异值分解结论放回到矩阵的视角里。",
  "如果一个矩阵可以写成 U 乘 Σ 乘 V 转置，那它的秩就等于 Σ 中非零奇异值的个数。",
  "注意，这里 Σ 不一定是方阵，这正是 SVD 比特征分解更一般的原因。",
  "接下来看几何意义：任何线性变换都可以拆成旋转、缩放、再旋转三步。",
  "低秩近似的意义在于，用前 k 个奇异值就能保留矩阵的主要信息。",
  "在图像压缩里，这就是把一张图变成若干个秩一矩阵的叠加。",
  "同学们可以课后试一下，取 k 等于 10 和 k 等于 50 的重建效果差异。",
  "下一部分我们讲主成分分析，它和 SVD 的联系会非常紧密。",
];

const KEYPOINTS = [
  "SVD 的定义：A = UΣVᵀ，Σ 非奇异值个数 = 矩阵的秩",
  "SVD 比特征分解更一般：适用于非方阵",
  "几何意义：旋转 → 缩放 → 旋转",
  "低秩近似：前 k 个奇异值保留主要信息",
  "应用：图像压缩 = 秩一矩阵叠加",
];

const QA_SUGGEST = ["SVD 和特征分解的区别？", "为什么低秩近似有效？", "PCA 和 SVD 什么关系？"];

const QA_ANSWERS = {
  default: {
    text: "根据本节课的内容：SVD 对任意矩阵都存在，不需要方阵；而特征分解只适用于可对角化的方阵。两者的联系在于，AᵀA 的特征向量就是 A 的右奇异向量。",
    cite: "高等数学课件 · 第 5 页 · 08:42",
  },
};

const TIMELINE = [
  ["00:00", "开场：回顾上节课奇异值分解的结论"],
  ["06:18", "SVD 定义与秩的关系"],
  ["14:35", "几何意义：旋转、缩放、旋转"],
  ["22:07", "低秩近似与信息保留"],
  ["31:44", "例题：手算 2×3 矩阵的 SVD"],
  ["40:12", "图像压缩应用演示"],
  ["45:30", "引出下一讲：主成分分析"],
];

const SUMMARY = [
  "SVD 将任意矩阵分解为 UΣVᵀ，适用于非方阵，是特征分解的推广。",
  "矩阵的秩等于 Σ 中非零奇异值的个数。",
  "任何线性变换都可以拆解为「旋转 → 缩放 → 旋转」三个基本操作。",
  "低秩近似用前 k 个奇异值重建矩阵，是图像压缩的数学基础。",
  "下一讲将从 SVD 过渡到主成分分析（PCA），注意两者基向量的关系。",
];

const MINUTES = [
  { title: "本讲主题", body: "奇异值分解（SVD）的定义、几何意义与低秩近似应用。", src: "课件 1–4 页 · 00:00–14:35" },
  { title: "核心结论", body: "A = UΣVᵀ；秩 = 非零奇异值个数；任何线性变换 = 旋转 → 缩放 → 旋转。", src: "课件 5–9 页 · 06:18–22:07" },
  { title: "例题记录", body: "板书演示了 2×3 矩阵的手算 SVD 过程，强调 V 转置不要漏写。", src: "课件 10 页 · 31:44" },
  { title: "应用延伸", body: "图像压缩 = 若干秩一矩阵的叠加；k 越大重建越清晰、数据量越大。", src: "课件 12–15 页 · 40:12" },
  { title: "下讲预告", body: "PCA 与 SVD 的联系：AᵀA 的特征向量即 A 的右奇异向量。", src: "课件 16–18 页 · 45:30" },
];

const MINUTES_QA = [
  { q: "SVD 和特征分解的区别？", a: "SVD 对任意矩阵存在；特征分解只适用于可对角化方阵。", time: "08:42" },
  { q: "为什么低秩近似有效？", a: "大部分真实矩阵的奇异值衰减很快，前 k 个已覆盖主要能量。", time: "24:15" },
  { q: "PCA 和 SVD 什么关系？", a: "PCA 的主成分方向来自数据矩阵的 SVD，可避免直接算协方差矩阵。", time: "46:02" },
];

const REVIEW = [
  { q: "一个 3×5 矩阵的 SVD 中，Σ 的形状是？", opts: ["3×3", "3×5", "5×5", "5×3"], ans: 1 },
  { q: "矩阵的秩等于什么？", opts: ["行数", "非零奇异值个数", "特征值个数", "行列式的值"], ans: 1 },
  { q: "低秩近似中，k 增大会怎样？", opts: ["重建更清晰、数据量更大", "重建更模糊", "秩变小", "与 k 无关"], ans: 0 },
];

const SLIDES = [
  { name: "高等数学-第12周课件.pdf", pages: 18 },
  { name: "矩阵分解讲义.pdf", pages: 12 },
  { name: "课后习题集.txt", pages: 6 },
];

/* ---------------- 全局状态 ---------------- */
const state = {
  recording: false,
  paused: false,
  recSec: 0,
  sIdx: 0,
  kIdx: 0,
  slidePage: 1,
  slidePages: 18,
  playSec: 0,
  playing: false,
  focusIdx: 0,
  timers: {},
};

/* ---------------- 路由 ---------------- */
const ROUTES = ["classrooms", "library", "prepare", "live", "focus", "qa", "summary", "minutes", "import", "review"];
const TITLES = { live: "实时课堂", focus: "专注模式" };

let current = null;

function show(route) {
  if (!ROUTES.includes(route)) route = "classrooms";
  current = route;
  $$("#app-shell main > section").forEach(s => { s.hidden = s.id !== "view-" + route; });
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.route === route));
  stopLiveLoops();
  if (route === "classrooms") renderClassrooms();
  if (route === "library") renderLibrary();
  if (route === "prepare") renderPrepare();
  if (route === "live") startLive();
  if (route === "focus") startFocus();
  if (route === "qa") initQA();
  if (route === "summary") startSummary();
  if (route === "minutes") renderMinutes("minutes");
  if (route === "import") renderImport();
  if (route === "review") renderReview();
}

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-nav],[data-route]");
  if (!nav) return;
  const t = nav.dataset.route || nav.dataset.nav;
  if (t === "logout") return confirmModal("退出登录", "未保存的录音内容将保留在本机，下次登录可恢复。", () => { $("#app-shell").hidden = true; $("#view-login").hidden = false; });
  if (t === "new") return show("prepare");
  if (nav.dataset.route) show(nav.dataset.route);
  if (nav.dataset.nav) show(nav.dataset.nav === "live" ? "live" : nav.dataset.nav);
});

/* ---------------- 登录 ---------------- */
$("#login-form").addEventListener("submit", e => {
  e.preventDefault();
  $("#view-login").hidden = true;
  $("#app-shell").hidden = false;
  show("classrooms");
});
$("#pw-toggle").addEventListener("click", () => {
  const p = $("#login-pass");
  p.type = p.type === "password" ? "text" : "password";
});

/* ---------------- 课堂列表 ---------------- */
let clsShown = 3;
function renderClassrooms() {
  $("#class-list").innerHTML = CLASSROOMS.slice(0, clsShown).map(c => `
    <tr>
      <td><span class="cname">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/></svg>
        ${c.name}</span></td>
      <td>${c.date}</td><td>${c.dur}</td>
      <td><span class="badge badge-ok badge-dot">已结束</span></td>
      <td><a class="op" data-route="minutes">查看纪要 →</a></td>
    </tr>`).join("");
}
$("#load-more").addEventListener("click", () => { clsShown = CLASSROOMS.length; renderClassrooms(); });
$("#discard-resume").addEventListener("click", () =>
  confirmModal("放弃本次录音", "放弃后「高等数学 · 第 12 周」的未保存录音将从本机移除，此操作不可撤销。", () => $("#resume-banner").remove()));

/* ---------------- 资料库 ---------------- */
function renderLibrary() {
  $("#file-list").innerHTML = FILES.map((f, i) => `
    <div class="file-item ${i === 0 ? "active" : ""}" data-fi="${i}">
      <svg class="ficon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/></svg>
      <span class="fname">${f.name}</span>
      <span class="fmeta">${f.meta}</span>
      <span class="status-dot ${f.state}"></span>
    </div>`).join("");
  $$("#file-list .file-item").forEach(el => el.addEventListener("click", () => {
    $$("#file-list .file-item").forEach(x => x.classList.remove("active"));
    el.classList.add("active");
    openFile(FILES[+el.dataset.fi]);
  }));
  openFile(FILES[0]);
}

function openFile(f) {
  $("#preview-title").textContent = f.name;
  const badge = $("#preview-state");
  const body = $("#preview-body");
  if (f.state === "proc") {
    badge.textContent = "转换中"; badge.className = "badge badge-warn";
    body.innerHTML = `<div class="proc-row"><span class="spinner"></span>正在处理，完成后可预览…</div>`;
  } else if (f.state === "err") {
    badge.textContent = "转换失败"; badge.className = "badge badge-danger";
    body.innerHTML = `<p>该文件的文字转换未成功（页面为扫描件，OCR 不可用）。</p><p style="margin-top:8px;color:var(--muted)">原件仍可预览，可尝试重新上传更清晰的版本。</p>`;
  } else {
    badge.textContent = "就绪"; badge.className = "badge badge-ok";
    body.innerHTML = `<p><b>${f.name.replace(/\.\w+$/, "")}</b></p>
      <p style="margin-top:12px">1.1 奇异值分解的定义</p>
      <p>设 A 为 m×n 实矩阵，则存在正交矩阵 U（m×m）与 V（n×n），以及对角矩阵 Σ（m×n），使得 A = UΣVᵀ。</p>
      <p style="margin-top:12px">1.2 与秩的关系</p>
      <p>矩阵 A 的秩等于 Σ 中非零奇异值的个数。这一结论在低秩近似中起到关键作用。</p>`;
  }
}

/* 上传弹窗 */
const modalUpload = $("#modal-upload");
$("#btn-upload").addEventListener("click", () => { modalUpload.hidden = false; $("#modal-upload-ok").disabled = true; });
$("#modal-upload-cancel").addEventListener("click", () => modalUpload.hidden = true);
$("#modal-upload-zone").addEventListener("click", () => $("#modal-upload-ok").disabled = false);
$("#modal-upload-ok").addEventListener("click", () => {
  modalUpload.hidden = true;
  FILES.unshift({ name: "新上传资料.pdf", meta: "PDF · 刚刚", state: "proc" });
  renderLibrary();
});

/* 通用确认弹窗 */
let confirmCb = null;
function confirmModal(title, text, cb) {
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  confirmCb = cb;
  $("#modal-confirm").hidden = false;
}
$("#confirm-cancel").addEventListener("click", () => $("#modal-confirm").hidden = true);
$("#confirm-ok").addEventListener("click", () => { $("#modal-confirm").hidden = true; confirmCb && confirmCb(); });

/* ---------------- 录音准备 ---------------- */
function renderPrepare() {
  $("#slide-sort-list").innerHTML = SLIDES.map((s, i) => `
    <div class="sort-item">
      <span class="idx">${i + 1}</span><span class="name">${s.name}</span>
      <button class="move" data-mv="up" data-i="${i}" title="上移">↑</button>
      <button class="move" data-mv="down" data-i="${i}" title="下移">↓</button>
    </div>`).join("");
  $$("#slide-sort-list .move").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.i, j = b.dataset.mv === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= SLIDES.length) return;
    [SLIDES[i], SLIDES[j]] = [SLIDES[j], SLIDES[i]];
    renderPrepare();
  }));
  clearInterval(state.timers.mic);
  state.timers.mic = setInterval(() => {
    $("#mic-meter").style.width = (20 + Math.random() * 55).toFixed(0) + "%";
  }, 500);
}

/* ---------------- 实时课堂 ---------------- */
function stopLiveLoops() {
  ["rec", "stream", "kp", "focus", "mic"].forEach(k => { clearInterval(state.timers[k]); delete state.timers[k]; });
}

function startLive() {
  $("#rec-indicator").style.display = "";
  state.recording = true;
  if (!state.timers.rec) state.timers.rec = setInterval(() => { if (!state.paused) { state.recSec++; $("#rec-time").textContent = fmt(state.recSec); } }, 1000);
  if (!state.timers.stream) state.timers.stream = setInterval(() => { if (!state.paused) pushSentence(); }, 2600);
  if (!state.timers.kp) state.timers.kp = setInterval(() => { if (!state.paused) pushKeypoint(); }, 9000);
  setRecordBtn();
  applyLayout($(".layout-tabs .active")?.dataset.layout || "transcript");
}

function pushSentence() {
  const s = SENTENCES[state.sIdx % SENTENCES.length];
  state.sIdx++;
  const time = fmt(state.recSec);
  $$(".transcript-list").forEach(list => {
    list.querySelectorAll(".tl-item.latest").forEach(x => x.classList.remove("latest"));
    const div = document.createElement("div");
    div.className = "tl-item latest";
    div.innerHTML = `<span class="ts">${time}</span><span class="txt">${s}${state.sIdx % 4 === 0 ? '<span class="tag">译</span>' : ""}</span>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  });
  $("#slides-transcript-cnt") && ($("#slides-transcript-cnt").textContent = state.sIdx + " 条");
  $("#kp-count") && ($("#kp-count").textContent = Math.min(state.kIdx, KEYPOINTS.length) + " 条");
}

function pushKeypoint() {
  if (state.kIdx >= KEYPOINTS.length) return;
  const k = KEYPOINTS[state.kIdx++];
  const list = $("#keypoint-list");
  if (!list) return;
  const div = document.createElement("div");
  div.className = "keypoint-item";
  div.innerHTML = `<span class="k">▸</span><span>${k}</span>`;
  list.appendChild(div);
  $("#kp-count").textContent = state.kIdx + " 条";
}

function setRecordBtn() {
  const b = $("#btn-record");
  b.classList.toggle("paused", state.paused);
  b.innerHTML = state.paused ? "▶" : "❚❚";
  $("#rec-indicator").innerHTML = state.paused
    ? '<span class="badge badge-warn">已暂停</span>'
    : '<span class="rec-dot"></span>录音中';
}

$("#btn-record").addEventListener("click", () => { state.paused = !state.paused; setRecordBtn(); });
$("#btn-stop").addEventListener("click", () =>
  confirmModal("结束录音", `录音时长 ${fmt(state.recSec)}。结束后将自动整理转写并生成课堂总结。`, () => { stopLiveLoops(); show("summary"); }));
$("#btn-focus").addEventListener("click", () => show("focus"));

$("#layout-tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("#layout-tabs button").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  applyLayout(b.dataset.layout);
});
function applyLayout(l) {
  $("#layout-transcript").hidden = l !== "transcript";
  $("#layout-slides").hidden = l !== "slides";
  $("#layout-keypoints").hidden = l !== "keypoints";
}

$("#slide-prev").addEventListener("click", () => setPage(state.slidePage - 1));
$("#slide-next").addEventListener("click", () => setPage(state.slidePage + 1));
function setPage(p) {
  state.slidePage = Math.min(Math.max(1, p), state.slidePages);
  $("#slide-page").textContent = `第 ${state.slidePage} / ${state.slidePages} 页`;
  $("#kp-slide-page").textContent = `第 ${state.slidePage} / ${state.slidePages} 页`;
}

/* ---------------- 专注模式 ---------------- */
function startFocus() {
  state.focusIdx = Math.max(0, state.sIdx - 1);
  const tick = () => {
    const cur = SENTENCES[state.focusIdx % SENTENCES.length];
    const prev = SENTENCES[(state.focusIdx - 1 + SENTENCES.length) % SENTENCES.length];
    const words = cur.split("");
    const cut = Math.max(4, Math.floor(words.length * 0.55));
    $("#focus-prev").textContent = prev;
    $("#focus-cur").innerHTML =
      words.slice(0, cut).join("") + `<span class="hl">${words.slice(cut).join("")}</span>`;
    $("#focus-src").textContent = `高等数学课件 · 第 ${1 + (state.focusIdx % 18)} 页`;
    state.focusIdx++;
  };
  tick();
  clearInterval(state.timers.focus);
  state.timers.focus = setInterval(tick, 5200);
}

/* ---------------- 问答 ---------------- */
function initQA() {
  const list = $("#qa-list");
  if (!list.dataset.init) {
    list.dataset.init = "1";
    $("#qa-chips").innerHTML = QA_SUGGEST.map(q => `<button class="chip">${q}</button>`).join("");
    $$("#qa-chips .chip").forEach(c => c.addEventListener("click", () => ask(c.textContent)));
    pushBubble("user", "SVD 在图像压缩里具体怎么用？");
    setTimeout(() => pushBubble("agent", QA_ANSWERS.default.text, QA_ANSWERS.default.cite), 500);
  }
}
function pushBubble(role, text, cite) {
  const list = $("#qa-list");
  const div = document.createElement("div");
  div.className = "bubble bubble-" + role;
  div.innerHTML = text + (cite ? `<br><span class="cite">📎 ${cite}</span>` : "");
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}
function ask(q) {
  if (!q.trim()) return;
  pushBubble("user", q);
  $("#qa-input").value = "";
  const typing = document.createElement("div");
  typing.className = "bubble bubble-agent qa-typing";
  typing.innerHTML = "<span></span><span></span><span></span>";
  $("#qa-list").appendChild(typing);
  $("#qa-list").scrollTop = $("#qa-list").scrollHeight;
  setTimeout(() => { typing.remove(); pushBubble("agent", QA_ANSWERS.default.text, QA_ANSWERS.default.cite); }, 1200);
}
$("#qa-send").addEventListener("click", () => ask($("#qa-input").value));
$("#qa-input").addEventListener("keydown", e => { if (e.key === "Enter") ask($("#qa-input").value); });

/* ---------------- 停止总结 ---------------- */
function startSummary() {
  clearInterval(state.timers.sum);
  let pct = 0;
  const steps = $$("#sum-steps span");
  steps.forEach(s => s.classList.remove("done"));
  state.timers.sum = setInterval(() => {
    pct = Math.min(100, pct + 4 + Math.random() * 5);
    $("#sum-pct").textContent = Math.round(pct) + "%";
    $("#sum-bar").style.width = pct + "%";
    steps.forEach((s, i) => s.classList.toggle("done", pct > (i + 1) * 33));
    if (pct >= 100) {
      clearInterval(state.timers.sum);
      $("#sum-pct").textContent = "完成";
      steps.forEach(s => s.classList.add("done"));
    }
  }, 300);
  $("#timeline").innerHTML = TIMELINE.map(([t, d]) => `<div class="tl-row"><span class="t">${t}</span><span class="d">${d}</span></div>`).join("");
  $("#summary-list").innerHTML = SUMMARY.map(s => `<li>${s}</li>`).join("");
}

/* 播放器 */
$("#play-btn").addEventListener("click", () => {
  state.playing = !state.playing;
  $("#play-btn").textContent = state.playing ? "❚❚" : "▶";
  clearInterval(state.timers.play);
  if (state.playing) {
    state.timers.play = setInterval(() => {
      state.playSec = (state.playSec + 1) % 2900;
      $("#play-time").textContent = `${fmt(state.playSec)} / 48:12`;
    }, 1000);
  }
});

/* ---------------- 纪要 ---------------- */
function renderMinutes(tab) {
  $$("#minutes-tabs button").forEach(b => b.classList.toggle("active", b.dataset.mtab === tab));
  const body = $("#minutes-body");
  if (tab === "minutes") {
    body.innerHTML = `<div class="minutes-section">` + MINUTES.map((m, i) => `
      <div class="card m-card">
        <h4><span class="n">${i + 1}</span>${m.title}</h4>
        <p>${m.body}</p>
        <div class="src-line">来源：<span>📄 ${m.src.split(" · ")[0]}</span><span>🔊 ${m.src.split(" · ")[1]}</span></div>
      </div>`).join("") + `</div>`;
  } else if (tab === "qa") {
    body.innerHTML = `<div class="minutes-section">` + MINUTES_QA.map(x => `
      <div class="card m-card">
        <h4>Q · ${x.q}</h4>
        <p>${x.a}</p>
        <div class="src-line"><span>⏱ ${x.time}</span></div>
      </div>`).join("") + `</div>`;
  } else {
    body.innerHTML = `<div class="review-grid">
      <div class="card preview-pane" style="min-height:auto">
        <div class="preview-head"><h3>矩阵分解讲义.pdf</h3><span class="badge badge-ok">已结束</span></div>
        <div class="preview-body"><p><b>第 2 章 低秩近似</b></p>
          <p style="margin-top:10px">2.1 Eckart–Young 定理：在 Frobenius 范数意义下，截断 SVD 给出最优低秩逼近。</p>
          <p style="margin-top:10px">2.2 应用：推荐系统中的矩阵补全。</p></div>
      </div>
      <div class="card preview-pane" style="min-height:auto">
        <div class="preview-head"><h3>高等数学-第12周课件.pdf</h3><span class="badge badge-ok">已结束</span></div>
        <div class="preview-body"><p><b>第 5 页 · 例题</b></p>
          <p style="margin-top:10px">手算 A = [1 2; 3 4; 5 6] 的 SVD：先求 AAᵀ 的特征值与特征向量…</p></div>
      </div></div>`;
  }
}
$("#minutes-tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (b) renderMinutes(b.dataset.mtab);
});
$("#btn-export").addEventListener("click", () =>
  confirmModal("导出纪要", "将导出为 Markdown 文件（含时间戳与来源定位），是否继续？", () => {}));

/* ---------------- 录音导入 ---------------- */
function renderImport() {
  if (!$("#import-list").dataset.init) {
    $("#import-list").dataset.init = "1";
    $("#import-zone").addEventListener("click", () => {
      const div = document.createElement("div");
      div.className = "import-file";
      div.innerHTML = `<svg class="fi" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
        <span class="fn">线性代数-补录.m4a</span><span class="fs">36:24 · 识别中</span><span class="spinner"></span>`;
      $("#import-list").appendChild(div);
      setTimeout(() => { div.querySelector(".fs").textContent = "36:24 · 识别完成"; div.querySelector(".spinner").remove(); }, 3000);
    });
  }
}

/* ---------------- 补学 ---------------- */
function renderReview() {
  $("#review-list").innerHTML = REVIEW.map((r, i) => `
    <div class="card review-item" data-ri="${i}">
      <div class="q">${i + 1}. ${r.q}</div>
      <div class="opts">${r.opts.map((o, j) => `<button class="opt" data-oi="${j}">${String.fromCharCode(65 + j)}. ${o}</button>`).join("")}</div>
    </div>`).join("");
  $$("#review-list .opt").forEach(b => b.addEventListener("click", () => {
    const item = b.closest(".review-item");
    $$(".opt", item).forEach(x => x.classList.remove("sel"));
    b.classList.add("sel");
    const ri = +item.dataset.ri, oi = +b.dataset.oi;
    b.style.borderColor = oi === REVIEW[ri].ans ? "var(--ok)" : "var(--danger)";
    b.style.color = oi === REVIEW[ri].ans ? "var(--ok)" : "var(--danger)";
  }));
}

/* ---------------- 启动：先进入登录页 ---------------- */
$("#view-login").hidden = false;
$("#app-shell").hidden = true;
