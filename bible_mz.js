/* ===================== 유엘이키우기 · 성경 읽기 확장 (10-27) =====================
   곽준영 키우기의 성경 리뉴얼본에서 가져옴: 20대 말투 본문(66권) · 아담~예수님 계보 빨간 밑줄 · 대화 이름표 · 족보·율법 접기(이야기 흐름)
   · 인물·지명·어려운 말(원어·생활) 밑줄 → 뜻 카드(제목·한 줄 뜻·원어 낱말) · 절 번호 → 원어(히브리어)·사본 메모 · 카드 속 성경 주소 → 관련 구절 보기 · 읽던 자리로 돌아오기
   · 읽기 모양(글꼴 9종·크기·바탕 4종·종이 결·줄 간격). 긴 해설(본문 해설·더 깊이 읽기)과 설교 자료는 넣지 않음(사용자 결정).
   유엘이키우기의 읽기 보상(끝까지 읽고 시간 차면 체크·달란트)은 그대로. 이 파일은 index.html 본문 스크립트 뒤에 붙어 renderReader·openReader·rdEndHTML을 덮어씀. */
(function () {
  const MZ_VER = "y1";
  const $ = id => document.getElementById(id);
  const bibleMz = new Map(), bibleX = new Map(), bibleNt = new Map(), bibleHe = new Map();
  let bibleLin = null, bibleLinP = null, XB = null;
  const NK = { person: ["인물", "k-person"], place: ["지명", "k-place"], hebrew: ["원어", "k-hebrew"], culture: ["생활·단위", "k-culture"] };
  const jget = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
  const pad = b => String(b + 1).padStart(2, "0");
  function loadMz(b) { if (bibleMz.has(b)) return Promise.resolve(bibleMz.get(b)); return jget(`bible/mz/${pad(b)}.json?v=${MZ_VER}`).then(d => { bibleMz.set(b, d); return d; }); }
  function loadLin() { if (bibleLin) return Promise.resolve(bibleLin); if (!bibleLinP) bibleLinP = jget(`bible/lin.json?v=${MZ_VER}`).then(d => { bibleLinP = null; if (d) bibleLin = d; return d; }); return bibleLinP; }
  function loadXB() { if (XB) return Promise.resolve(XB); return jget(`bible/xbooks.json?v=${MZ_VER}`).then(d => { XB = new Set((d || []).map(x => x - 1)); return XB; }); }
  function xFetch(dir, b, map) {
    if (map.has(b)) return Promise.resolve(map.get(b));
    return loadXB().then(xb => { if (b > 11 && !(xb.has(b) && (dir === "x" || dir === "nt"))) { map.set(b, null); return null; } return jget(`bible/${dir}/${pad(b)}.json?v=${MZ_VER}`).then(d => { map.set(b, d); return d; }); });
  }
  const loadX = b => xFetch("x", b, bibleX), loadNt = b => xFetch("nt", b, bibleNt), loadHe = b => xFetch("he", b, bibleHe);
  const mzChapter = (b, c) => { const d = bibleMz.get(b); const ch = d && d[c]; return ch && Array.isArray(ch.v) && ch.v.length ? ch : null; };
  const xChap = (b, c) => { const d = bibleX.get(b); return (d && d[String(c + 1)]) || null; };
  const ntOf = (b, id) => { const d = bibleNt.get(b); return d && d[id] || null; };
  const mzLines = t => String(t || "").split("\n");
  const mzPlain = ch => ch.v.map(t => mzLines(t).join(" ").replace(/\([^)]*\)/g, ""));
  function linOf(b, c, ver) {
    const m = bibleLin && bibleLin[ver === "mz" ? "m" : "k"] && bibleLin[ver === "mz" ? "m" : "k"][String(b + 1)], out = {};
    if (!m) return out; const pre = (c + 1) + ":";
    for (const k in m) if (k.indexOf(pre) === 0) out[+k.slice(pre.length)] = String(m[k]).split(",");
    return out;
  }
  /* ---------- 상태 ---------- */
  const R = () => S.read;
  const rdVer = () => { const v = R().ver; return v === "easy" || v === "orig" ? v : "mz"; };
  const rdOpt = () => { const o = R().o || {}; return { sp: o.sp !== false, ln: o.ln !== false, col: o.col !== false, flow: !!o.flow, nonum: !!o.nonum }; };
  const setOpt = (k, v) => { R().o = R().o || {}; R().o[k] = v; save(); };
  const FONTS = ["maru", "batang", "sans", "dodum", "donghwa", "kkot", "dahaeng", "seongsil", "mirae"];
  const look = () => { const L = R().look || {}; return { fs: L.fs >= 14 && L.fs <= 30 ? L.fs : (R().fs || 18), sfs: L.sfs >= 15 && L.sfs <= 26 ? L.sfs : 17, font: FONTS.includes(L.font) ? L.font : "maru", bg: ["dark", "paper", "cream", "night"].includes(L.bg) ? L.bg : "cream", gr: L.gr !== false, lh: L.lh === "w" ? "w" : L.lh === "t" ? "t" : "n" }; };
  const setLook = (k, v) => { R().look = Object.assign({}, R().look || {}, { [k]: v }); save(); applyLook(); };
  /* ---------- 글자 꾸미기 ---------- */
  const LIN_PART = ["이라고", "이라", "이었", "이고", "이며", "이요", "이니", "이에", "이지", "이시", "이신", "이셨", "이야", "이랑", "이네", "이여", "이다", "에게", "에서", "한테", "처럼", "보다", "부터", "까지", "으로", "하고", "조차", "마저", "께서",
    "이", "가", "은", "는", "을", "를", "의", "에", "께", "과", "와", "도", "만", "아", "야", "여", "님", "라", "랑", "로", "였", "뿐", "씨", "네", "다", "요", "왕", "성"];
  const isHan = ch => !!ch && ch >= "가" && ch <= "힣";
  function findWord(text, w, from) {
    let i = text.indexOf(w, from || 0);
    while (i >= 0) { const j = i + w.length, rest = text.slice(j, j + 3); if (!isHan(text[i - 1]) && (!isHan(text[j]) || LIN_PART.some(p => rest.indexOf(p) === 0))) return i; i = text.indexOf(w, j); }
    return -1;
  }
  function markLine(text, linNames, links, done) {
    const sp = [];
    (linNames || []).slice().sort((a, b) => b.length - a.length).forEach(nm => { if (!nm) return; let i = findWord(text, nm); while (i >= 0) { sp.push({ a: i, z: i + nm.length, lin: true }); i = findWord(text, nm, i + nm.length); } });
    (links || []).forEach(([id, w, k]) => { if (done.has(id)) return; const i = findWord(text, w); if (i < 0) return; sp.push({ a: i, z: i + w.length, id, k }); done.add(id); });
    if (!sp.length) return esc(text);
    sp.sort((x, y) => x.a - y.a || (x.id ? -1 : 1));
    const out = [];
    sp.forEach(s => { const prev = out[out.length - 1]; if (prev && s.a < prev.z) { if (s.lin && prev.id) prev.lin = true; else if (s.id && prev.lin && !prev.id && s.a === prev.a) { s.lin = true; out[out.length - 1] = s; } return; } out.push(s); });
    let html = "", p = 0;
    out.forEach(s => { html += esc(text.slice(p, s.a)); const t = esc(text.slice(s.a, s.z)); html += s.id ? `<a class="nl ${NK[s.k] ? NK[s.k][1] : ""}${s.lin ? " lin" : ""}" data-r="nt" data-nt="${esc(s.id)}" role="button" tabindex="0">${t}</a>` : `<u class="lin">${t}</u>`; p = s.z; });
    return html + esc(text.slice(p));
  }
  function spLabel(l) {
    const [, who, to, kind, kt] = l; let h = `<span class="sp-lab"><b>${esc(who)}</b>`;
    if (kind === "thought") h += ` <i>속마음</i>`; else { if (to) h += `<span class="sp-ar">→</span>${esc(to)}`; if (kind === "prayer") h += ` <i>기도</i>`; else if (kind === "reported") h += ` <i>전달</i>`; }
    const extra = String(kt || "").replace(/^(속마음|기도)( · )?/, "").replace(/^전달 · /, ""); if (extra && extra !== "속마음") h += ` <i>${esc(extra)}</i>`;
    return h + `</span>`;
  }
  const foldState = () => { RDR.opened = RDR.opened || {}; return RDR.opened; };
  function foldsClosed() {
    if (!RDR || !RDR.verses || !RDR.verses.length || !rdOpt().flow || rdVer() !== "mz") return 0;
    const x = xChap(RDR.b, RDR.c); if (!x || !x.fold) return 0; const op = foldState(); let n = 0;
    x.fold.forEach((f, i) => { if (!op[i]) n += f[1] - f[0] + 1; }); return n;
  }
  function foldCard(f, i, again) {
    const [s, e, cat, title, lines, labs, ref, c0] = f, n = e - s + 1, cont = c0 || again;
    const ls = cont ? "" : (lines || []).map((t, k) => `<p><b>${esc((labs && labs[k]) || "")}</b>${esc(t)}</p>`).join("");
    return `<div class="rd-fold"><div class="rd-fold-top"><span class="rd-fold-cat">${esc(cat)}</span><span>${s}~${e}절</span></div><b class="rd-fold-t">${esc(title)}${cont ? " (이어서)" : ""}</b>${ls ? `<div class="rd-fold-l">${ls}</div>` : ""}<small class="rd-fold-note">읽기를 돕는 안내예요 · 성경 본문이 아니에요</small><button type="button" class="btn line rd-fold-btn" data-r="fold-open" data-i="${i}">본문 펼치기 · ${n}절</button></div>`;
  }
  function chapterHtml(b, c, mz, krv, lin) {
    const o = rdOpt(), x = xChap(b, c), heads = {}, done = new Set(), op = foldState();
    if (mz) (mz.h || []).forEach(h => { if (Array.isArray(h) && h[0] >= 1) heads[h[0]] = (heads[h[0]] ? heads[h[0]] + " · " : "") + h[1]; });
    const folds = (mz && o.flow && x && x.fold) ? x.fold : [], nv = mz ? mz.v.length : krv.length;
    let html = "";
    for (let n = 1; n <= nv; n++) {
      const fi = folds.findIndex(f => n >= f[0] && n <= f[1]);
      if (fi >= 0) { if (!op[fi]) { if (n === folds[fi][0]) html += foldCard(folds[fi], fi, fi > 0 && folds[fi - 1][3] === folds[fi][3]); continue; } if (n === folds[fi][0]) html += `<button type="button" class="rd-fold-close" data-r="fold-close" data-i="${fi}">▲ ${esc(folds[fi][3])} · 다시 접기</button>`; }
      const hasM = !!(x && x.vn && x.vn[n]), canTap = b <= 11 || hasM;
      const num = o.nonum ? "" : `<sup class="${canTap ? "vn-t" : ""}${hasM ? " has" : ""}"${canTap ? ` data-r="vn" data-vn="${n}" role="button" tabindex="0"` : ""}>${n}</sup>`;
      if (mz) {
        const labs = {}; if (o.sp && x && x.sp && x.sp[n]) x.sp[n].forEach(l => { if (!labs[l[0]]) labs[l[0]] = l; });
        const links = o.ln && x && x.ln ? x.ln[n] : null;
        const ls = mzLines(mz.v[n - 1]).map((t, k) => { const sup = /^\s*〔.*〕\s*$/.test(t); return `${labs[k] ? spLabel(labs[k]) : ""}<span class="ln${sup ? " sup-t" : ""}${labs[k] ? " sq" : ""}">${k === 0 ? num : ""}${markLine(t, lin[n], links, done)}</span>`; }).join("");
        html += (heads[n] ? `<h4 class="rd-h">${esc(heads[n])}</h4>` : "") + `<p class="mz">${ls}</p>`;
      } else html += `<p class="kv">${num}${markLine(krv[n - 1], lin[n], null, done)}</p>`;
    }
    return html;
  }
  function optPanel() {
    const o = rdOpt(), t = (k, on, label, sub) => `<button type="button" class="rd-op${on ? " on" : ""}" data-r="op" data-k="${k}" aria-pressed="${on}"><b>${label}</b><small>${sub}</small></button>`;
    return `<div class="rd-ops">${t("sp", o.sp, "대화 이름표", "누가 누구에게 말하는지")}${t("ln", o.ln, "낱말 밑줄", "인물·지명·원어·생활")}${t("col", o.col, "색으로 구분", "인물·지명·원어·생활 색")}${t("flow", o.flow, "이야기 흐름", "족보·율법 접기")}${t("nonum", o.nonum, "절 번호 숨기기", "원어 메모는 절 번호로")}
      <p class="rd-legend"><span class="k-person">인물</span><span class="k-place">지명</span><span class="k-hebrew">원어</span><span class="k-culture">생활·단위</span><span class="lg-lin">계보(빨간 밑줄)</span></p></div>`;
  }
  /* ---------- 읽기 화면 그리기 (유엘이의 renderReader를 덮음) ---------- */
  const renderV0 = renderReader, openV0 = openReader, endV0 = rdEndHTML, closeV0 = closeReader;
  renderReader = function () {
    if (!RDR) return;
    const { b, c } = RDR, body = $("rdBody"), st = body.scrollTop, o = rdOpt(), ver = rdVer();
    const mz = RDR.verses && RDR.verses.length ? mzChapter(b, c) : null, showMz = ver === "mz" && !!mz;
    if (RDR.verses && RDR.verses.length) RDR.min = minReadSec(showMz ? mzPlain(mz) : RDR.verses);
    $("rdTitle").textContent = `${BOOKS[b][0]} ${c + 1}장`;
    const vname = showMz ? "20대 말투" : ver === "orig" ? "개역한글 원문" : "쉬운 말 개역한글";
    $("rdSub").textContent = rdToday(b, c) ? `오늘 읽음 ✓ · ${vname}` : isRead(b, c) ? `읽은 장 · ${vname}` : vname;
    body.classList.toggle("rd-col", o.col);
    let html = `<div class="rd-ver" role="group" aria-label="번역 고르기"><button type="button" data-r="v-mz" class="${ver === "mz" ? "on" : ""}">20대 말투</button><button type="button" data-r="v-easy" class="${ver === "easy" ? "on" : ""}">쉬운 말</button><button type="button" data-r="v-orig" class="${ver === "orig" ? "on" : ""}">원문</button><button type="button" class="rd-opbtn${RDR.ops ? " on" : ""}" data-r="ops" aria-expanded="${!!RDR.ops}">보기</button></div>`;
    if (RDR.ops) html += optPanel();
    if (!RDR.verses) html += '<p class="rdmsg">말씀을 불러오는 중…</p>';
    else if (RDR.err || !RDR.verses.length) html += '<p class="rdmsg">본문을 불러오지 못했어요. 인터넷에 연결되어 있는지 확인하고 다시 눌러 주세요.</p><div class="rdend"><button class="btn line" data-act="rdretry">다시 불러오기</button></div>';
    else {
      const x = xChap(b, c), lin = linOf(b, c, showMz ? "mz" : "krv");
      if (x && (x.t || x.g)) html += `<div class="rd-cx"><small>이 장은</small>${x.t ? `<b>${esc(x.t)}</b>` : ""}${(x.g || []).map(g => `<p>${esc(g)}</p>`).join("")}</div>`;
      if (ver === "mz" && !mz) html += `<p class="rd-note">이 장은 20대 말투로 다듬는 중이에요 · 지금은 쉬운 말 개역한글로 보여 드려요</p>`;
      if (Object.keys(lin).length) html += `<p class="rd-note lin-key"><u class="lin">빨간 밑줄</u> = 아담부터 예수님까지 이어지는 족보 이름</p>`;
      const krv = ver === "orig" ? RDR.verses : RDR.verses.map(v => MODERN.modernize(v));
      html += chapterHtml(b, c, showMz ? mz : null, krv, lin) + '<div class="rdend" id="rdEnd"></div>';
    }
    body.innerHTML = html; body.scrollTop = st; RDR.key = "";
    updateReaderState();
  };
  rdEndHTML = function () {
    const closed = foldsClosed();
    if (closed && !rdToday(RDR.b, RDR.c)) return [`fold${closed}`, `<button class="btn violet" data-r="fold-all">접힌 본문 ${closed}절 펼치기 · 펼쳐 읽어야 체크돼요</button>`];
    return endV0();
  };
  openReader = function (b, c) {
    const r = openV0(b, c); applyLook(); sheetClose();
    Promise.all([loadMz(b), loadLin(), loadX(b)]).then(() => { if (RDR && RDR.b === b && RDR.c === c) { renderReader(); requestAnimationFrame(readerScrolled); } });
    loadNt(b);
    return r;
  };
  closeReader = function () { sheetClose(); return closeV0(); };
  /* ---------- 아래 창: 뜻 카드 · 원어 메모 · 관련 구절 ---------- */
  function sheet(html, label) {
    let sh = $("rdSheet");
    if (!sh) {
      sh = document.createElement("div"); sh.className = "rd-sheet"; sh.id = "rdSheet"; sh.hidden = true;
      sh.innerHTML = `<div class="rd-sh-bg" data-r="sh-x"></div><div class="rd-sh-card" role="dialog" aria-modal="true"><div class="rd-sh-top"><button type="button" class="rd-sh-x" data-r="sh-x">‹ <span id="rdShLab">본문</span></button><div class="rd-sh-tt" id="rdShTt"></div><button type="button" class="rd-sh-aa" data-r="sh-aa" aria-label="읽기 모양">Aa</button></div>${optsHtml("sh")}<div class="rd-sh-body" id="rdShBody"></div><button type="button" class="btn line rd-sh-back" data-r="sh-x">← 읽던 본문으로</button></div>`;
      $("reader").appendChild(sh);
    }
    $("rdShOpts").hidden = true; applyLook();
    $("rdShBody").innerHTML = html; sh.hidden = false; $("rdShBody").scrollTop = 0; sh.dataset.label = label || "";
    $("rdShLab").textContent = label || "본문"; const h3 = $("rdShBody").querySelector("h3"); $("rdShTt").textContent = h3 ? h3.textContent : "";
  }
  function sheetClose() { const sh = $("rdSheet"); if (sh) sh.hidden = true; if (RDR) RDR.shStack = []; }
  function shPush() { const sh = $("rdSheet"), bd = $("rdShBody"); if (!RDR || !sh || sh.hidden || !bd) return; (RDR.shStack = RDR.shStack || []).push({ html: bd.innerHTML, y: bd.scrollTop, label: sh.dataset.label || "" }); }
  const BACK = `<button type="button" class="btn line rd-sh-prev" data-r="sh-prev">← 돌아가기</button>`;
  const heTerm = tm => `<span class="tm"><bdi dir="rtl" lang="he">${esc(tm[0] || "")}</bdi><small><b>${esc(tm[1] || "")}</b>${esc(tm[2] || "")}</small></span>`;
  const REF_AB = ["창", "출", "레", "민", "신", "수", "삿", "룻", "삼상", "삼하", "왕상", "왕하", "대상", "대하", "스", "느", "에", "욥", "시", "잠", "전", "아", "사", "렘", "애", "겔", "단", "호", "욜", "암", "옵", "욘", "미", "나", "합", "습", "학", "슥", "말", "마", "막", "눅", "요", "행", "롬", "고전", "고후", "갈", "엡", "빌", "골", "살전", "살후", "딤전", "딤후", "딛", "몬", "히", "약", "벧전", "벧후", "요일", "요이", "요삼", "유", "계"];
  const REF_MAP = (() => { const m = {}; BOOKS.forEach((x, i) => { m[x[0]] = i; }); REF_AB.forEach((a, i) => { m[a] = i; }); m["애가"] = 24; m["시"] = 18; return m; })();
  const REF_RE = new RegExp(`(^|[^가-힣A-Za-z0-9])(${Object.keys(REF_MAP).sort((a, b) => b.length - a.length).join("|")})\\s?(\\d{1,3}):(\\d{1,3})(?:\\s?[-–~]\\s?(\\d{1,3})(?!:))?`, "g");
  const REF_KO = new RegExp(`(^|[^가-힣A-Za-z0-9])(${BOOKS.map(x => x[0]).concat(["애가"]).sort((a, b) => b.length - a.length).join("|")})\\s?(\\d{1,3})\\s?(?:장|편)(?:\\s?(\\d{1,3})(?:\\s?[-–~]\\s?(\\d{1,3}))?\\s?절(?:\\s?(?:부터|에서|~|-|–)\\s?(\\d{1,3})\\s?절)?)?(?![0-9])`, "g");
  function refHtml(t) {
    const ko = esc(t).replace(REF_KO, (all, pre, bk, c, v, v2a, v2b) => { const v2 = v2a || v2b, b = REF_MAP[bk], cn = +c; if (b == null || !cn || cn > BOOKS[b][1]) return all; const vn = v ? +v : 1, ve = v ? (v2 ? +v2 : vn) : 999; if (v && (ve < vn || ve - vn > 60)) return all; return `${pre}<button type="button" class="vref" data-r="go" data-go="${b}|${cn}|${vn}|${ve}">${all.slice(pre.length)}</button>`; });
    return ko.replace(REF_RE, (all, pre, bk, c, v, v2) => { const b = REF_MAP[bk], cn = +c, vn = +v, ve = v2 ? +v2 : vn; if (b == null || !cn || cn > BOOKS[b][1] || !vn || ve < vn || ve - vn > 40) return all; return `${pre}<button type="button" class="vref" data-r="go" data-go="${b}|${cn}|${vn}|${ve}">${all.slice(pre.length)}</button>`; });
  }
  function noteHtml(n, from) {
    const k = NK[n.k] || ["낱말", ""];
    let h = `<div class="nt-head"><span class="nt-badge ${k[1]}">${esc(n.b || k[0])}</span><small>${esc(from || n.l || "")}</small></div><h3>${esc(n.t)}</h3>`;
    if (n.s) h += `<p class="nt-brief">${refHtml(n.s)}</p>`;
    if (n.tm && n.tm.length) h += `<div class="tms">${n.tm.map(heTerm).join("")}</div>`;
    h += `<p class="nt-cap">원어는 사전 표제어나 본문 형태예요. 한글은 읽기를 돕는 근사 발음이에요.</p>`;
    return h;
  }
  function openNote(id) {
    if (!RDR) return; const b = RDR.b, from = `${BOOKS[b][0]} ${RDR.c + 1}장`, was = $("rdSheet") && !$("rdSheet").hidden;
    const show = () => { const n = ntOf(b, id); if (was) shPush(); sheet((was ? BACK : "") + (n ? noteHtml(n, from) : `<p class="rdmsg">낱말 뜻을 불러오지 못했어요. 인터넷에 연결된 상태로 한 번 열면 그다음부터는 없어도 볼 수 있어요.</p>`), from); };
    if (bibleNt.has(b)) show(); else loadNt(b).then(show);
  }
  function openVerse(n) {
    if (!RDR) return; const b = RDR.b, c = RDR.c, ref = `${BOOKS[b][0]} ${c + 1}:${n}`, ot = b <= 11;
    const show = () => {
      const x = xChap(b, c), he = bibleHe.get(b), heV = he && he[c] && he[c][n - 1];
      let h = `<div class="nt-head"><span class="nt-badge k-hebrew">${ot ? "원어로 보기" : "본문 메모"}</span><small>${esc(ref)}</small></div>`;
      if (heV) h += `<p class="he-verse" dir="rtl" lang="he">${esc(heV)}</p><p class="nt-cap">히브리어 본문: 레닌그라드 사본(WLC). 오른쪽에서 왼쪽으로 읽어요.</p>`;
      const ms = x && x.vn && x.vn[n] || [];
      if (ms.length) h += `<h4>${ot ? "원어 메모" : "사본 메모"}</h4>` + ms.map(m => `<div class="vm">${m.he || m.rd ? `<div class="tms">${heTerm([m.he, m.rd, m.m])}</div>` : (m.m ? `<p class="nt-form">${esc(m.m)}</p>` : "")}<p>${refHtml(m.t)}</p></div>`).join("") + (ot ? "" : `<p class="nt-cap">사본마다 조금씩 다른 곳을 적어 둔 메모예요.</p>`);
      else if (ot) h += `<p class="rdmsg">이 절에는 따로 단 원어 메모가 없어요.</p>`;
      const ln = x && x.ln && x.ln[n] || [];
      if (ln.length) { const nt = bibleNt.get(b); h += `<h4>이 절의 낱말</h4><div class="nt-chips">${ln.map(l => `<button type="button" class="nt-chip ${NK[l[2]] ? NK[l[2]][1] : ""}" data-r="nt" data-nt="${esc(l[0])}">${esc(nt && nt[l[0]] ? nt[l[0]].t : l[1])}</button>`).join("")}</div>`; }
      sheet(h, `${BOOKS[b][0]} ${c + 1}장`);
    };
    sheet(`<p class="rdmsg">불러오는 중…</p>`, `${BOOKS[b][0]} ${c + 1}장`);
    Promise.all([ot ? loadHe(b) : null, loadNt(b)]).then(show);
  }
  function openRef(go) {
    const sh = $("rdSheet"); if (!sh) return;
    const [b, c, v1, v2] = go.split("|").map(Number), ref = v2 >= 999 ? `${BOOKS[b][0]} ${c}장` : `${BOOKS[b][0]} ${c}:${v1}${v2 > v1 ? "–" + v2 : ""}`;
    shPush();
    const show = (mz, krv) => {
      const vs = mz && mz[c - 1] && mz[c - 1].v, kv = krv && krv[c - 1];
      let h = BACK + `<div class="nt-head"><span class="nt-badge">관련 구절</span><small>${esc(ref)}</small></div>`;
      if (vs && v1 <= vs.length) { for (let n = v1; n <= Math.min(v2, vs.length); n++) h += `<p class="rf-v"><sup>${n}</sup> ${mzLines(vs[n - 1]).map(esc).join("<br>")}</p>`; h += `<p class="nt-cap">20대 말투 본문이에요. 읽던 자리는 그대로 있어요.</p>`; }
      else if (kv && v1 <= kv.length) { for (let n = v1; n <= Math.min(v2, kv.length); n++) h += `<p class="rf-v"><sup>${n}</sup> ${esc(MODERN.modernize(kv[n - 1]))}</p>`; h += `<p class="nt-cap">쉬운 말 개역한글이에요. 읽던 자리는 그대로 있어요.</p>`; }
      else h += `<p class="rdmsg">이 주소의 본문을 찾지 못했어요.</p>`;
      sheet(h, sh.dataset.label || "");
    };
    sheet(`<p class="rdmsg">불러오는 중…</p>`, sh.dataset.label || "");
    loadMz(b).then(mz => { if (mz && mz[c - 1] && mz[c - 1].v) show(mz, null); else loadBook(b).then(krv => show(null, krv)).catch(() => show(null, null)); });
  }
  /* ---------- 읽기 모양 (Aa) ---------- */
  function optsHtml(kind) {
    const fs = kind === "rd" ? `<button type="button" data-r="fs-">가−</button><b id="rdFsV">18</b><button type="button" data-r="fs+">가+</button>` : `<button type="button" data-r="sfs-">가−</button><b id="rdShFs">17</b><button type="button" data-r="sfs+">가+</button>`;
    const seg = (k, items) => `<div class="rd-sh-seg rd-sh-fonts">${items.map(([v, l, st]) => `<button type="button" data-r="${k}-${v}" data-k="${v}"${st ? ` style="${st}"` : ""}>${l}</button>`).join("")}</div>`;
    return `<div class="rd-sh-opts" id="${kind === "rd" ? "rdOpts" : "rdShOpts"}" hidden>
      <div class="rd-sh-or"><span>글자 크기</span><div class="rd-sh-seg">${fs}</div></div>
      <div class="rd-sh-or"><span>글꼴</span>${seg("font", [["maru", "마루부리", "font-family:'MaruBuri',serif"], ["batang", "고운바탕", "font-family:'Gowun Batang',serif"], ["sans", "고딕", "font-family:'Apple SD Gothic Neo',sans-serif"], ["dodum", "둥근돋움", "font-family:'Gowun Dodum',sans-serif"]])}</div>
      <div class="rd-sh-or"><span>손글씨</span>${seg("font", [["donghwa", "동화또박", "font-family:'NSDonghwa'"], ["kkot", "꽃내음", "font-family:'NSKkot'"], ["dahaeng", "다행체", "font-family:'NSDahaeng'"], ["seongsil", "성실체", "font-family:'NSSeongsil'"], ["mirae", "미래나무", "font-family:'NSMirae'"]])}</div>
      <div class="rd-sh-or"><span>바탕</span>${seg("bg", [["cream", "크림"], ["paper", "종이"], ["dark", "어둡게"], ["night", "밤"]])}</div>
      <div class="rd-sh-or"><span>종이 결</span>${seg("gr", [["on", "있음"], ["off", "없음"]])}</div>
      <div class="rd-sh-or"><span>줄 간격</span>${seg("lh", [["t", "촘촘"], ["n", "보통"], ["w", "넓게"]])}</div></div>`;
  }
  function applyLook() {
    const L = look(), rdr = $("reader"), sh = $("rdSheet");
    [rdr, sh].filter(Boolean).forEach(r => {
      ["paper", "night", "cream", "dark"].forEach(k => r.classList.toggle(k, L.bg === k));
      r.classList.toggle("wide", L.lh === "w"); r.classList.toggle("tight", L.lh === "t"); r.classList.toggle("grain", L.gr);
      FONTS.forEach(f => r.classList.toggle("f-" + f, L.font === f));
      r.querySelectorAll(".rd-sh-seg [data-k]").forEach(b => { const x = b.dataset.r; b.classList.toggle("on", (x.startsWith("font-") && b.dataset.k === L.font) || (x.startsWith("bg-") && b.dataset.k === L.bg) || (x.startsWith("lh-") && b.dataset.k === L.lh) || (x.startsWith("gr-") && b.dataset.k === (L.gr ? "on" : "off"))); });
    });
    const rb = $("rdBody"); if (rb) { rb.style.setProperty("--rdfs", L.fs + "px"); rb.style.fontSize = ""; }
    const bd = $("rdShBody"); if (bd) bd.style.setProperty("--shfs", L.sfs + "px");
    const a = $("rdFsV"); if (a) a.textContent = L.fs; const b2 = $("rdShFs"); if (b2) b2.textContent = L.sfs;
  }
  function ensureAa() {
    const head = document.querySelector("#reader .rdhead"); if (!head || $("rdAa")) return;
    const bt = document.createElement("button"); bt.className = "rdb txt rd-aa"; bt.id = "rdAa"; bt.setAttribute("data-r", "rd-aa"); bt.setAttribute("aria-label", "읽기 모양"); bt.textContent = "Aa"; head.appendChild(bt);
    head.insertAdjacentHTML("afterend", optsHtml("rd"));
  }
  /* ---------- 누르기 ---------- */
  function act(t, e) {
    const box = $("reader");
    while (t && t !== box) {
      const d = t.dataset || {}, a = d.r;
      if (a) {
        if (a === "nt") openNote(d.nt);
        else if (a === "vn") openVerse(+d.vn);
        else if (a === "go") openRef(d.go);
        else if (a === "sh-x") sheetClose();
        else if (a === "sh-prev") { const st = RDR && RDR.shStack || [], p = st.pop(); if (p) { sheet(p.html, p.label); $("rdShBody").scrollTop = p.y; } }
        else if (a === "v-mz" || a === "v-easy" || a === "v-orig") { const v = a.slice(2); if (rdVer() !== v) { R().ver = v; R().orig = v === "orig"; save(); renderReader(); $("rdBody").scrollTop = 0; } }
        else if (a === "ops") { RDR.ops = !RDR.ops; renderReader(); }
        else if (a === "op") { const o = rdOpt(); setOpt(d.k, !o[d.k]); renderReader(); }
        else if (a === "fold-open") { foldState()[+d.i] = true; renderReader(); }
        else if (a === "fold-close") { foldState()[+d.i] = false; renderReader(); }
        else if (a === "fold-all") { const x = xChap(RDR.b, RDR.c); (x && x.fold || []).forEach((f, i) => { foldState()[i] = true; }); RDR.bottom = false; renderReader(); }
        else if (a === "rd-aa" || a === "sh-aa") { const o = $(a === "rd-aa" ? "rdOpts" : "rdShOpts"); if (o) o.hidden = !o.hidden; }
        else if (a === "fs-" || a === "fs+") { setLook("fs", Math.max(14, Math.min(30, look().fs + (a === "fs+" ? 1 : -1)))); R().fs = look().fs; }
        else if (a === "sfs-" || a === "sfs+") setLook("sfs", Math.max(15, Math.min(26, look().sfs + (a === "sfs+" ? 1 : -1))));
        else if (a.startsWith("font-")) setLook("font", a.slice(5));
        else if (a.startsWith("bg-")) setLook("bg", a.slice(3));
        else if (a.startsWith("gr-")) setLook("gr", a.slice(3) === "on");
        else if (a.startsWith("lh-")) setLook("lh", a.slice(3));
        else return false;
        e.stopPropagation(); e.preventDefault(); return true;
      }
      t = t.parentElement;
    }
    return false;
  }
  function init() {
    ensureAa(); applyLook();
    const box = $("reader");
    box.addEventListener("click", e => { act(e.target, e); }, true);
    box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.dataset && e.target.dataset.r) act(e.target, e); if (e.key === "Escape") sheetClose(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
