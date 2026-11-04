/* ============================================================
   Agent · 课堂助手 — 前端交互
   纯静态实现：hash 路由 + 本地状态 + 模拟数据流
   内容对齐 16 张 UI 参考图（机器学习 · 第三讲 / 梯度下降主题）
   ============================================================ */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fmtH = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;

/* ---------------- 模拟数据（对齐参考图） ---------------- */
const CLASSROOMS = [
  { name: "线性代数 · 矩阵分解", date: "2026.10.18" },
  { name: "学术英语 · 文献阅读", date: "2026.10.16" },
  { name: "机器学习 · 第二讲",   date: "2026.10.15" },
  { name: "概率论 · 条件概率",   date: "2026.10.13" },
  { name: "数据结构 · 图算法",   date: "2026.10.11" },
];

const FILES = [
  { name: "03_Gradient_Descent.pdf",  meta: "PDF · 4.8 MiB · 32 页", state: "ok",   pages: 32, kind: "pdf" },
  { name: "术语补充.txt",             meta: "TXT · 28 KiB",          state: "ok",   pages: 1,  kind: "txt" },
  { name: "04_Neural_Networks.pdf",   meta: "PDF · 8.2 MiB",         state: "proc", pages: 24, kind: "pdf" },
  { name: "课堂补充扫描.pdf",          meta: "PDF · 3.6 MiB",         state: "part", pages: 12, kind: "pdf", partNote: "2 页内容待核对" },
];

/* 转写流：英文原文 + 中文译文（对齐参考图 06 / 07 / 09） */
const SENTENCES = [
  { en: "The learning rate controls the size of each update.",      zh: "学习率决定每次参数更新的步长。", t: "00:22:48" },
  { en: "The learning rate controls how far we move at each step.", zh: "学习率决定了每一步沿梯度方向移动的距离。", t: "00:23:10" },
  { en: "If it is too large, the loss may oscillate around the minimum.", zh: "学习率过大时，损失可能在最小值附近来回震荡。", t: "00:23:25" },
  { en: "A smaller learning rate makes convergence more stable.",   zh: "较小的学习率通常让收敛更稳定。", t: "00:24:10" },
  { en: "If the learning rate is too small, the convergence will be very slow.", zh: "学习率过小则会导致收敛非常缓慢。", t: "00:24:15" },
];

/* 段落要点（对齐参考图 06-03） */
const KEYPOINTS = [
  { t: "00:23:10", title: "学习率决定更新步长", desc: "学习率控制每次沿梯度方向移动的距离。" },
  { t: "00:23:25", title: "学习率过大：容易震荡", desc: "步长过大时，损失可能在最小值附近来回震荡。" },
  { t: "00:24:15", title: "学习率过小：收敛缓慢", desc: "步长过小会减慢参数更新，使收敛过程变慢。", current: true },
];

/* 引用区条目（对齐参考图 07；selection 为默认框选句） */
const REF_ITEMS = [
  { t: "00:22:48", en: "The learning rate controls the size of each update.",    zh: "学习率决定每次参数更新的步长。" },
  { t: "00:23:25", en: "If it is too large, the loss may oscillate around the minimum.", zh: "学习率过大时，损失可能在最小值附近来回震荡。", selection: true },
  { t: "00:24:10", en: "A smaller learning rate makes convergence more stable.", zh: "较小的学习率通常让收敛更稳定。" },
];

const QA_ANSWER = {
  strong: "因为每一步都可能跨过最低点。",
  body: "可以把参数更新想象成下山：步子太大，会从谷底的一侧跳到另一侧。适当减小学习率，可以让更新逐渐靠近最低点。",
  cite: "课件第 12 页",
};

/* 课堂时间轴（对齐参考图 09-01） */
const MTIMELINE = [
  { t: "00:00", label: "梯度下降概念" },
  { t: "12:40", label: "参数更新方向" },
  { t: "23:25", label: "学习率与震荡", active: true },
  { t: "39:10", label: "收敛与练习" },
];

const CORE_POINTS = [
  { title: "更新方向", desc: "沿负梯度方向移动，逐步降低损失。", t: "00:00" },
  { title: "学习率",   desc: "过大会震荡，过小会减慢收敛。",     t: "12:40" },
  { title: "收敛判断", desc: "结合损失变化与梯度大小观察。",     t: "39:10" },
];

const MINUTES_QA = [
  { q: "为什么学习率过大会震荡?", a: "步长过大，可能反复跨过最低点。", time: "23:25", cite: "课件第 12 页" },
  { q: "学习率一般怎么设置?",     a: "常用 0.001 起步，配合学习率衰减调度。", time: "31:02", cite: "课件第 14 页" },
  { q: "收敛变慢一定是坏事吗?",   a: "不一定，小步长更稳定，可与动量法配合。", time: "40:18", cite: "课件第 20 页" },
];

const SLIDES = [
  { name: "03_Gradient_Descent.pdf", meta: "PDF · 4.8 MiB · 32 页", state: "ok" },
  { name: "术语补充.txt",            meta: "TXT · 28 KiB",          state: "ok" },
];

const REVIEW = [
  { q: "学习率过大会导致什么？", opts: ["在最小值附近来回震荡", "收敛加快", "损失单调下降", "没有影响"], ans: 0 },
  { q: "梯度下降的更新方向是？", opts: ["沿负梯度方向", "沿梯度方向", "随机方向", "垂直于梯度"], ans: 0 },
  { q: "学习率过小会怎样？",     opts: ["收敛非常缓慢", "立即发散", "震荡加剧", "不影响收敛"], ans: 0 },
];

/* ---------------- 全局状态 ---------------- */
const state = {
  paused: false,
  recSec: 1458,            /* 00:24:18 起播（对齐参考图） */
  savedSec: 1452,          /* 已保存至 00:24:12 */
  sIdx: 2,
  slidePage: 8, slidePages: 32,
  previewPage: 1,
  lang: "both",            /* en | both */
  sideOpen: false, sideTab: "slides",
  playing: false, playSec: 23 * 60 + 25, playTotal: 48 * 60 + 26, speed: 1.0,
  focusIdx: 2,
  timers: {},
};

/* ---------------- 路由 ---------------- */
const ROUTES = ["classrooms", "library", "prepare", "live", "focus", "qa", "summary", "minutes", "import", "review"];

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
  if (route === "minutes") renderMinutes();
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
  else if (nav.dataset.nav) show(nav.dataset.nav);
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

/* ---------------- 02 课堂列表 ---------------- */
let clsShown = 4;
function renderClassrooms() {
  $("#class-list").innerHTML = CLASSROOMS.slice(0, clsShown).map(c => `
    <tr>
      <td><span class="cname">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/></svg>
        ${c.name}</span></td>
      <td>${c.date}</td>
      <td><span class="badge badge-ok badge-dot">已结束</span></td>
      <td><a class="op" data-route="minutes">查看纪要 →</a></td>
    </tr>`).join("");
}
$("#load-more").addEventListener("click", () => { clsShown = CLASSROOMS.length; renderClassrooms(); });
$("#new-class-btn").addEventListener("click", () => show("prepare"));

/* ---------------- 03 资料库 ---------------- */
const STATE_LABEL = {
  ok:   '<span class="fstate ok"><span class="fcheck">✓</span>可用</span>',
  proc: '<span class="fstate proc"><span class="fspin"></span>转换中</span>',
  part: '<span class="fstate part"><span class="fpart-ico">!</span>部分可用</span>',
};
function renderLibrary() {
  $("#file-list").innerHTML = FILES.map((f, i) => `
    <div class="ft-row ${i === 0 ? "active" : ""}" data-fi="${i}" tabindex="0" role="button">
      <span class="ft-icon ${f.kind === "pdf" ? "pdf" : "txt"}">
        ${f.kind === "pdf"
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="#c94436"><path d="M6 2h9l4 4v16H6z"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#576b65" stroke-width="1.8"><path d="M6 2h9l4 4v16H6z"/><path d="M9 11h6M9 15h6"/></svg>'}
      </span>
      <span class="ft-main"><b>${f.name}</b><span>${f.meta}</span>${f.partNote ? `<span class="ft-part-note">${f.partNote}</span>` : ""}</span>
      ${STATE_LABEL[f.state]}
    </div>`).join("");
  $$("#file-list .ft-row").forEach(el => {
    const open = () => {
      $$("#file-list .ft-row").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
      openFile(FILES[+el.dataset.fi]);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
  });
  $("#lib-note").textContent = `当前有 ${FILES.filter(f => f.state === "proc").length} 份资料正在处理。`;
  openFile(FILES[0]);
}

/* 模拟课件页（Gradient Descent） */
function slidePageHTML(title) {
  return `
    <div class="sp-title">${title || "Gradient Descent"}</div>
    <p class="sp-body">We iteratively move in the direction of the negative gradient to minimize the loss function.</p>
    <div class="sp-formula">θ ← θ − α∇J(θ)</div>
    <div class="sp-chart">
      <svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="30" y1="10" x2="30" y2="145" stroke="#9fb0aa" stroke-width="1.4"/>
        <line x1="30" y1="145" x2="305" y2="145" stroke="#9fb0aa" stroke-width="1.4"/>
        <path d="M45 25 Q 110 150 170 130 T 290 118" fill="none" stroke="#15664e" stroke-width="2"/>
        <circle cx="63" cy="66" r="4" fill="#15664e"/><circle cx="88" cy="108" r="4" fill="#15664e"/><circle cx="126" cy="130" r="4" fill="#15664e"/>
        <text x="46" y="58" font-size="10" fill="#33443f">∇J(θ)</text>
        <text x="238" y="112" font-size="10" fill="#33443f">Minimum</text>
        <text x="12" y="80" font-size="11" fill="#33443f" font-style="italic">J(θ)</text>
        <text x="163" y="162" font-size="11" fill="#33443f" font-style="italic">θ</text>
      </svg>
    </div>`;
}

function openFile(f) {
  $("#preview-name").textContent = f.name;
  const page = $("#preview-page");
  if (f.state === "proc") {
    page.innerHTML = `<div class="proc-row"><span class="spinner"></span>正在处理，完成后可预览…</div>`;
    $("#preview-pager").textContent = "—";
  } else if (f.state === "part") {
    page.innerHTML = slidePageHTML() + `<div class="part-note">⚠ 第 3、7 页内容待核对，可能与原扫描件有出入。</div>`;
    $("#preview-pager").textContent = "1 / 12";
  } else if (f.kind === "txt") {
    page.innerHTML = `<div class="sp-title">术语补充</div>
      <p class="sp-body">learning rate（学习率）：每次参数更新的步长系数。<br>gradient（梯度）：损失函数对参数的偏导向量。<br>convergence（收敛）：损失随迭代趋于稳定的过程。</p>`;
    $("#preview-pager").textContent = "1 / 1";
  } else {
    page.innerHTML = slidePageHTML();
    $("#preview-pager").textContent = `${state.previewPage} / ${f.pages}`;
  }
  state.previewPage = 1;
}
$("#preview-prev").addEventListener("click", () => setPage(state.previewPage - 1));
$("#preview-next").addEventListener("click", () => setPage(state.previewPage + 1));
function setPage(p) {
  state.previewPage = Math.min(Math.max(1, p), 32);
  const f = FILES[$$("#file-list .ft-row").findIndex(x => x.classList.contains("active"))] || FILES[0];
  if (f.state === "ok" && f.kind === "pdf") {
    $("#preview-pager").textContent = `${state.previewPage} / ${f.pages}`;
    $("#preview-page").innerHTML = slidePageHTML();
  }
}

/* 上传列表弹窗 */
$("#library-upload").addEventListener("click", () => { $("#modal-upload").hidden = false; });
$("#library-upload").addEventListener("keydown", e => { if (e.key === "Enter") $("#modal-upload").hidden = false; });
$("#modal-upload-x").addEventListener("click", () => $("#modal-upload").hidden = true);
$("#modal-upload-cancel").addEventListener("click", () => $("#modal-upload").hidden = true);
$("#modal-upload-ok").addEventListener("click", () => {
  $("#modal-upload").hidden = true;
  confirmModal("已加入上传", "2 个文件已加入队列，转换完成后将出现在列表中。", () => {});
});

/* ---------------- 04 录音准备 ---------------- */
function renderPrepare() {
  $("#prep-list").innerHTML = SLIDES.map((s, i) => `
    <div class="prep-row" draggable="true" data-i="${i}">
      <span class="prep-handle" title="拖动排序">⋮⋮</span>
      <span class="prep-idx">${pad(i + 1)}</span>
      <span class="prep-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/></svg>
      </span>
      <span class="prep-name">${s.name}</span>
      <span class="prep-meta">${s.meta}</span>
      <span class="prep-state"><span class="dot-ok dot-ok--solid"></span>已就绪</span>
      <button class="prep-remove" data-rm="${i}">移除</button>
    </div>`).join("");

  $$("#prep-list .prep-remove").forEach(b => b.addEventListener("click", () => {
    SLIDES.splice(+b.dataset.rm, 1);
    updateQuota();
    renderPrepare();
  }));

  /* 拖拽排序 */
  let dragIdx = null;
  $$("#prep-list .prep-row").forEach(row => {
    row.addEventListener("dragstart", () => { dragIdx = +row.dataset.i; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", e => e.preventDefault());
    row.addEventListener("drop", e => {
      e.preventDefault();
      const to = +row.dataset.i;
      if (dragIdx === null || dragIdx === to) return;
      const [m] = SLIDES.splice(dragIdx, 1);
      SLIDES.splice(to, 0, m);
      renderPrepare();
    });
  });
  updateQuota();
}
function updateQuota() {
  $("#quota-main").textContent = `已选 ${SLIDES.length}/10 份 · 4.83 / 100 MiB`;
  if (!SLIDES.length) $("#quota-main").textContent = "已选 0/10 份 · 0 / 100 MiB";
}
$("#pick-from-library").addEventListener("click", () =>
  confirmModal("从资料库选择", "从资料库已就绪的课件中勾选加入本次课堂（演示）。", () => {
    SLIDES.push({ name: "04_Neural_Networks.pdf", meta: "PDF · 8.2 MiB · 24 页", state: "ok" });
    renderPrepare();
  }));
$("#upload-add").addEventListener("click", () =>
  confirmModal("上传并添加", "选择本地 PDF / TXT 文件，确认后加入本次课件列表（演示）。", () => {
    SLIDES.push({ name: "课堂笔记.pdf", meta: "PDF · 1.1 MiB · 6 页", state: "ok" });
    renderPrepare();
  }));

/* 设备确认弹窗 */
$("#btn-start-listen").addEventListener("click", () => { $("#modal-device").hidden = false; });
$("#skip-slides").addEventListener("click", () => { $("#modal-device").hidden = false; });
$("#modal-device-x").addEventListener("click", () => $("#modal-device").hidden = true);
$("#modal-device-cancel").addEventListener("click", () => $("#modal-device").hidden = true);
$("#modal-device-ok").addEventListener("click", () => { $("#modal-device").hidden = true; show("live"); });
(function initMicBars() {
  const box = $("#mic-bars");
  if (!box) return;
  for (let i = 0; i < 18; i++) {
    const b = document.createElement("span");
    b.style.setProperty("--h", (i < 10 ? 40 + Math.random() * 60 : 18 + Math.random() * 20) + "%");
    box.appendChild(b);
  }
})();

/* ---------------- 05 实时课堂 ---------------- */
function stopLiveLoops() {
  ["rec", "stream", "focus", "mic", "play"].forEach(k => {
    clearInterval(state.timers[k]);
    delete state.timers[k];
  });
}

function transcriptItemHTML(s, mode, recognizing) {
  const en = `<p class="t-en">${s.en}</p>`;
  const zh = `<p class="t-zh">${s.zh}</p>`;
  const body = mode === "en" ? en : en + zh;
  if (recognizing) {
    return `<div class="t-item recognizing"><span class="t-badge">正在识别</span><span class="t-time">${s.t}</span>${body}</div>`;
  }
  return `<div class="t-item"><span class="t-time">${s.t}</span>${body}</div>`;
}

function renderLiveTranscript() {
  const done = SENTENCES.slice(0, state.sIdx);
  const cur = SENTENCES[state.sIdx] || SENTENCES[SENTENCES.length - 1];
  $("#live-transcript").innerHTML =
    done.map(s => transcriptItemHTML(s, state.lang, false)).join("") +
    transcriptItemHTML(cur, state.lang, true);
  const flow = $("#live-transcript");
  flow.scrollTop = flow.scrollHeight;
}

function renderLiveSide() {
  $("#live-slide-page").innerHTML = slidePageHTML();
  $("#live-slide-pager").textContent = `${state.slidePage} / ${state.slidePages}`;
  $("#kp-live-list").innerHTML = KEYPOINTS.map(k => `
    <div class="kp-item ${k.current ? "kp-current" : ""}">
      <div class="kp-meta"><span class="kp-time">${k.t}</span>${k.current ? '<span class="kp-badge">当前段落</span>' : ""}</div>
      <b class="kp-heading">${k.title}</b>
      <p class="kp-desc">${k.desc}</p>
    </div>`).join("");
}

function startLive() {
  state.paused = false;
  setPauseUI();
  renderLiveTranscript();
  renderLiveSide();
  applySide();
  clearInterval(state.timers.rec);
  state.timers.rec = setInterval(() => {
    if (state.paused) return;
    state.recSec++;
    state.savedSec = Math.max(0, state.recSec - 6);
    $("#rb-time").textContent = fmtH(state.recSec);
    $("#rb-saved").textContent = fmtH(state.savedSec);
    $("#fb-time") && ($("#fb-time").textContent = fmtH(state.recSec));
    $("#fb-saved") && ($("#fb-saved").textContent = fmtH(state.savedSec));
  }, 1000);
  clearInterval(state.timers.stream);
  state.timers.stream = setInterval(() => {
    if (state.paused) return;
    state.sIdx = Math.min(state.sIdx + 1, SENTENCES.length - 1);
    renderLiveTranscript();
  }, 5200);
}
function setPauseUI() {
  $("#rb-pause-icon").textContent = state.paused ? "▶" : "❚❚";
  $("#rb-pause-label").textContent = state.paused ? "继续" : "暂停";
  $("#fb-pause-icon") && ($("#fb-pause-icon").textContent = state.paused ? "▶" : "❚❚");
  $("#fb-pause-label") && ($("#fb-pause-label").textContent = state.paused ? "继续" : "暂停");
}
function togglePause() { state.paused = !state.paused; setPauseUI(); }
$("#rb-pause").addEventListener("click", togglePause);
$("#fb-pause").addEventListener("click", togglePause);
function stopAndSummarize() {
  confirmModal("停止并总结", `录音时长 ${fmtH(state.recSec)}。停止后将自动整理转写并生成全文纪要。`, () => show("summary"));
}
$("#rb-stop").addEventListener("click", stopAndSummarize);
$("#fb-stop").addEventListener("click", stopAndSummarize);

/* 原 / 双 切换 */
$("#lang-seg").addEventListener("click", e => {
  const b = e.target.closest(".seg-btn"); if (!b) return;
  $$("#lang-seg .seg-btn").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  state.lang = b.dataset.lang;
  renderLiveTranscript();
});

/* 课件 / 要点 右栏开关 */
function applySide() {
  $("#live-side").hidden = !state.sideOpen;
  $("#live-transcript-col").classList.toggle("with-side", state.sideOpen);
}
$("#btn-side-toggle").addEventListener("click", () => { state.sideOpen = !state.sideOpen; applySide(); });
$("#btn-append").addEventListener("click", () =>
  confirmModal("追加课件", "从资料库选择课件追加到当前课堂（演示）。", () => {}));
$$("#live-side .ptab").forEach(t => t.addEventListener("click", () => {
  $$("#live-side .ptab").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  $("#side-slides").hidden = t.dataset.ptab !== "slides";
  $("#side-keypoints").hidden = t.dataset.ptab !== "keypoints";
}));
$("#live-slide-prev").addEventListener("click", () => { state.slidePage = Math.max(1, state.slidePage - 1); $("#live-slide-pager").textContent = `${state.slidePage} / ${state.slidePages}`; });
$("#live-slide-next").addEventListener("click", () => { state.slidePage = Math.min(state.slidePages, state.slidePage + 1); $("#live-slide-pager").textContent = `${state.slidePage} / ${state.slidePages}`; });
$("#back-teaching").addEventListener("click", () => {
  state.slidePage = 12;
  $("#live-slide-pager").textContent = "12 / 32";
  $("#follow-note").textContent = "正在浏览第 12 页 · 与授课同步";
});

/* ---------------- 06 专注模式 ---------------- */
function startFocus() {
  renderFocusSentence();
  clearInterval(state.timers.focus);
  state.timers.focus = setInterval(() => {
    if (state.paused) return;
    state.focusIdx = (state.focusIdx + 1) % SENTENCES.length;
    renderFocusSentence();
  }, 5200);
}
function renderFocusSentence() {
  const cur = SENTENCES[state.focusIdx % SENTENCES.length];
  const prev = SENTENCES[(state.focusIdx - 1 + SENTENCES.length) % SENTENCES.length];
  const words = cur.zh.split("");
  const cut = Math.max(4, Math.floor(words.length * 0.55));
  $("#focus-prev").textContent = prev.zh;
  $("#focus-prev-en").textContent = prev.en;
  $("#focus-cur").innerHTML = words.slice(0, cut).join("") + `<span class="hl">${words.slice(cut).join("")}</span>`;
  $("#focus-cur-en").textContent = cur.en;
}

/* ---------------- 07 选区问答 ---------------- */
function initQA() {
  renderRefList();
  if (!$("#qa-flow").dataset.init) {
    $("#qa-flow").dataset.init = "1";
    pushAgentAnswer(QA_ANSWER.strong, QA_ANSWER.body, QA_ANSWER.cite, true);
  }
}
function renderRefList() {
  $("#ref-list").innerHTML = REF_ITEMS.map((r, i) => `
    <div class="ref-item ${r.selection ? "selected" : ""}" data-ri="${i}">
      <span class="t-time">${r.t}</span>
      <p class="t-en">${r.en}</p>
      <div class="ref-zh-wrap">
        <p class="t-zh">${r.zh}</p>
        ${r.selection ? '<span class="sel-tag">你的选区</span>' : ""}
      </div>
    </div>`).join("");
  $$("#ref-list .ref-item").forEach(el => el.addEventListener("click", () => {
    const i = +el.dataset.ri;
    REF_ITEMS.forEach(r => r.selection = false);
    REF_ITEMS[i].selection = true;
    renderRefList();
    $("#qa-quote").textContent = REF_ITEMS[i].zh;
  }));
}
function pushAgentAnswer(strong, body, cite, first) {
  const flow = $("#qa-flow");
  const user = document.createElement("div");
  user.className = "qa2-user";
  user.textContent = first ? "为什么学习率过大会震荡?" : "再解释一下这个说法。";
  flow.appendChild(user);
  const ans = document.createElement("div");
  ans.className = "qa2-ans";
  ans.innerHTML = `
    <div class="ans-head"><span class="ans-avatar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg>
    </span><span class="ans-name">Agent</span></div>
    <b class="ans-strong">${strong}</b>
    <p class="ans-body">${body}</p>
    <span class="ans-cite">📄 ${cite}</span>`;
  flow.appendChild(ans);
  const typing = document.createElement("div");
  typing.className = "qa2-typing-row";
  typing.innerHTML = '<span class="qa2-typing"><span></span><span></span><span></span></span><button class="stop-answer">⏹ 停止回答</button>';
  flow.appendChild(typing);
  typing.querySelector(".stop-answer").addEventListener("click", () => typing.remove());
  flow.scrollTop = flow.scrollHeight;
  setTimeout(() => typing.remove(), 2600);
}
$("#qa2-send").addEventListener("click", () => {
  const v = $("#qa2-input").value.trim();
  if (!v) return;
  $("#qa2-input").value = "";
  const user = document.createElement("div");
  user.className = "qa2-user";
  user.textContent = v;
  $("#qa-flow").appendChild(user);
  $("#qa-flow").scrollTop = $("#qa-flow").scrollHeight;
  pushAgentAnswer("结合本讲内容：", QA_ANSWER.body, QA_ANSWER.cite, false);
});
$("#qa2-input").addEventListener("keydown", e => { if (e.key === "Enter") $("#qa2-send").click(); });
$("#new-select").addEventListener("click", () =>
  confirmModal("新选区提问", "点击引用区任意句子的译文，框选后即可开启新一轮问答（演示：点击句子即可切换选区）。", () => {}));
$("#revise-trans").addEventListener("click", () =>
  confirmModal("修订这段译文", "对当前选区译文提出修改建议，确认后应用到转写（演示）。", () => {}));

/* ---------------- 08 停止总结 ---------------- */
function startSummary() {
  clearInterval(state.timers.gen);
  $("#goto-minutes").hidden = true;
  $("#gen-badge").innerHTML = "生成中";
  $("#gen-title").textContent = "正在整理这堂课…";
  $("#gen-sub").textContent = "你可以先回看已生成的内容。";
  state.timers.gen = setTimeout(() => {
    $("#gen-badge").innerHTML = "✓ 生成完成";
    $("#gen-title").textContent = "课堂纪要已生成";
    $("#gen-sub").textContent = "全文纪要与核心要点已就绪，可进入纪要页查看。";
    $("#goto-minutes").hidden = false;
  }, 6000);
}
$("#btn-resume-live").addEventListener("click", () => show("live"));

/* ---------------- 09 课堂纪要 ---------------- */
function renderMinutes() {
  $("#mtimeline-list").innerHTML = MTIMELINE.map(m => `
    <button class="mt-row ${m.active ? "active" : ""}" data-t="${m.t}">
      <span class="mt-dot"></span>
      <span class="mt-time">${m.t}</span>
      <span class="mt-label">${m.label}</span>
    </button>`).join("");
  $$("#mtimeline-list .mt-row").forEach(b => b.addEventListener("click", () => {
    $$("#mtimeline-list .mt-row").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    seekPlayer(b.dataset.t);
  }));
  renderMinutesTab("digest");
}
function seekPlayer(t) {
  const [mm, ss] = t.split(":").map(Number);
  state.playSec = mm * 60 + ss;
  updatePlayerUI();
}
function renderMinutesTab(tab) {
  $$("#mtabs2 .mtab").forEach(b => b.classList.toggle("active", b.dataset.mtab === tab));
  const body = $("#minutes2-body");
  if (tab === "digest") {
    body.innerHTML = `
      <div class="digest-head"><h2>梯度下降与学习率</h2><span class="badge badge-ok">已完成</span></div>
      <p class="digest-para">本讲介绍了梯度下降的基本思想，分析了参数更新的方向与学习率的作用，并讨论了学习率过大或过小时对收敛过程的影响，最后通过示例加深理解。</p>
      <div class="core-points">
        <div class="core-title">核心要点</div>
        ${CORE_POINTS.map((p, i) => `
          <div class="core-row">
            <span class="core-num">${i + 1}</span>
            <b>${p.title}：</b><span>${p.desc}</span>
            <span class="core-time">${p.t}</span>
          </div>`).join("")}
      </div>
      <div class="qa-embed">
        <div class="qae-head"><span>💬 课堂问答 · 23:25</span><a class="link-arrow" data-mtab-goto="qa">查看问答 →</a></div>
        <b class="qae-q">为什么学习率过大会震荡?</b>
        <p class="qae-a">步长过大，可能反复跨过最低点。</p>
        <span class="ans-cite">📄 课件第 12 页</span>
      </div>
      <div class="digest-foot">覆盖范围 00:00:00 — 00:48:26 · 无已知缺失区间</div>`;
    const go = body.querySelector("[data-mtab-goto]");
    go && go.addEventListener("click", () => renderMinutesTab(go.dataset.mtabGoto));
  } else if (tab === "transcript") {
    body.innerHTML = `
      <div class="t-head t-head--plain">
        <h3>实时转写</h3>
        <div class="seg" id="m-lang-seg">
          <button data-lang="en" class="seg-btn">原</button>
          <button data-lang="both" class="seg-btn active">双</button>
        </div>
        <span class="live-updating"><span class="dot-ok"></span>实时更新</span>
      </div>
      <div class="transcript-flow transcript-flow--static" id="m-transcript">
        ${SENTENCES.map(s => transcriptItemHTML(s, "both", s.t === "00:24:15")).join("")}
      </div>`;
    const seg = body.querySelector("#m-lang-seg");
    seg.addEventListener("click", e => {
      const b = e.target.closest(".seg-btn"); if (!b) return;
      seg.querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const mode = b.dataset.lang;
      body.querySelector("#m-transcript").innerHTML =
        SENTENCES.map(s => transcriptItemHTML(s, mode, s.t === "00:24:15")).join("");
    });
  } else if (tab === "qa") {
    body.innerHTML = MINUTES_QA.map(x => `
      <div class="card m-card">
        <div class="mq-row"><b>Q · ${x.q}</b><span class="mq-time">⏱ ${x.time}</span></div>
        <p>${x.a}</p>
        <div class="src-line"><span>📄 ${x.cite}</span><a class="link-arrow" data-nav="qa">进入选区问答 →</a></div>
      </div>`).join("");
  } else {
    body.innerHTML = `
      <div class="follow-grid">
        <div class="follow-transcript">
          <div class="t-head t-head--plain"><h3>实时转写</h3></div>
          <div class="transcript-flow transcript-flow--static">
            ${SENTENCES.slice(0, 3).map(s => transcriptItemHTML(s, "both", false)).join("")}
          </div>
        </div>
        <div class="card follow-side">
          <div class="side-tabs">
            <div class="panel-tabs">
              <button class="ptab active">课件</button>
              <button class="ptab">段落要点</button>
            </div>
            <span class="link-add">＋ 追加课件</span>
          </div>
          <div class="side-file">📄 03_Gradient_Descent.pdf</div>
          <div class="slide-page slide-page--sm">${slidePageHTML()}</div>
          <div class="pager-wrap">
            <div class="pager">
              <button class="pg-btn">‹</button><span class="pg-num">8 / 32</span><button class="pg-btn">›</button>
            </div>
          </div>
          <div class="follow-row">
            <span class="follow-note">正在浏览第 8 页 · 授课已到第 12 页</span>
            <a class="link-arrow">返回授课页</a>
          </div>
        </div>
      </div>`;
  }
}
$("#mtabs2").addEventListener("click", e => {
  const b = e.target.closest(".mtab"); if (b) renderMinutesTab(b.dataset.mtab);
});
$("#btn-export-html").addEventListener("click", () =>
  confirmModal("导出摘要 HTML", "将导出包含全文摘要、时间戳与来源定位的 HTML 文件，是否继续？", () => {}));
$("#btn-delete-minutes").addEventListener("click", () =>
  confirmModal("删除此摘要", "删除后无法恢复，确定删除「机器学习 · 第三讲」的课堂纪要吗？", () => {}));

/* 播放器 */
function updatePlayerUI() {
  $("#player-cur").textContent = fmt(state.playSec);
  const pct = (state.playSec / state.playTotal * 100).toFixed(1) + "%";
  $("#player-fill").style.width = pct;
  const knob = $("#player-track .player-knob");
  knob && (knob.style.left = pct);
}
$("#player-btn").addEventListener("click", () => {
  state.playing = !state.playing;
  $("#player-btn").textContent = state.playing ? "❚❚" : "▶";
  clearInterval(state.timers.play);
  if (state.playing) {
    state.timers.play = setInterval(() => {
      state.playSec = (state.playSec + state.speed) % state.playTotal;
      updatePlayerUI();
    }, 1000);
  }
});
$("#player-speed").addEventListener("click", () => {
  const speeds = [1.0, 1.5, 2.0];
  state.speed = speeds[(speeds.indexOf(state.speed) + 1) % speeds.length];
  $("#player-speed").textContent = state.speed.toFixed(1) + "× ⌄";
});
$("#player-track").addEventListener("click", e => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
  state.playSec = Math.round(pct * state.playTotal);
  updatePlayerUI();
});

/* ---------------- 录音导入 ---------------- */
function renderImport() {
  if (!$("#import-list").dataset.init) {
    $("#import-list").dataset.init = "1";
    $("#import-zone").addEventListener("click", () => {
      const div = document.createElement("div");
      div.className = "import-file";
      div.innerHTML = `<svg class="fi" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
        <span class="fn">高等数学-补录.m4a</span><span class="fs">36:24 · 识别中</span><span class="spinner"></span>`;
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

/* ---------------- 通用确认弹窗 ---------------- */
let confirmCb = null;
function confirmModal(title, text, cb) {
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  confirmCb = cb;
  $("#modal-confirm").hidden = false;
}
$("#confirm-cancel").addEventListener("click", () => $("#modal-confirm").hidden = true);
$("#confirm-ok").addEventListener("click", () => { $("#modal-confirm").hidden = true; confirmCb && confirmCb(); });

/* ---------------- 启动：先进入登录页 ---------------- */
$("#view-login").hidden = false;
$("#app-shell").hidden = true;
