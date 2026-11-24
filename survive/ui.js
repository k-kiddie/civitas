"use strict";
// 「물에 잠기는 항구」 화면. 낮(일·배급) → 밤(탐색 판정) → 새벽(결산·사건).
(function () {
  const E = SurviveEngine, D = SurviveData, app = document.querySelector("#app");
  const SAVE = "civitas-survive-v1";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
    set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {} },
  };
  let state = null, sheet = null, pickPlace = null, pickParty = [], rolling = null, toast = "", lastTap = 0;
  try { const v = store.get(); if (v) state = E.validate(v); } catch { toast = "저장이 손상되어 새로 시작합니다."; }
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const btn = (label, action, attrs = "") => `<button data-action="${action}" ${attrs}>${label}</button>`;
  const HP = ["건강", "부상", "중상", "위독", "사망"];
  function commit(res) {
    if (res.error) { toast = res.error; render(); return false; }
    state = res.state;
    toast = "";
    store.set(state);
    render();
    return true;
  }
  // ── 위쪽 ──
  function header() {
    const s = state, st = E.nextStorm(s), n = E.need(s);
    const stormTxt = st ? `<span class="storm ${st.day - s.day <= 1 ? "urgent" : ""}">⛈ 폭우 ${st.day - s.day <= 0 ? "오늘 밤" : st.day - s.day + "일 뒤"} · 둑 <b>${s.dike}/${st.need}</b></span>` : `<span class="storm">⛈ 큰 폭우는 지나갔다</span>`;
    return `<header><div class="top"><span>🌊 <b>${s.day}일째</b> · 구조선 ${s.rescueDay - 1}~${s.rescueDay + 1}일쯤</span><span>${btn(`🕯 ${s.memorial.length}`, "sheet", 'data-sheet="memorial" class="mini"')} ${btn("새로", "sheet", 'data-sheet="new" class="mini"')}</span></div>
    <div class="res"><div class="r food ${s.food < n.food ? "low" : ""}">🍚<b>${s.food}</b><small>하루 −${n.food}</small></div><div class="r wood ${s.wood < n.wood ? "low" : ""}">🪵<b>${s.wood}</b><small>하루 −${n.wood}</small></div><div class="r meds ${s.meds === 0 ? "low" : ""}">💊<b>${s.meds}</b><small>약</small></div><div class="r hope ${s.hope < 25 ? "low" : ""}">🕯<b>${s.hope}</b><small>희망</small><i class="hbar"><i style="width:${s.hope}%"></i></i></div></div>${stormTxt}</header>`;
  }
  // ── 낮: 사람 카드 ──
  function card(p) {
    const s = state;
    const status = !p.alive ? "" : p.child ? "아이" : p.away > 0 ? "밖에 나감" : p.broken ? "무너짐" : p.hp >= 2 ? "일 못 함" : "";
    const job = E.canWork(s, p) ? D.jobs[p.job] : null;
    return `<button class="card hp${p.hp} ${!p.alive ? "dead" : ""}" data-action="person" data-id="${p.id}"><span class="face">${p.face}</span><span class="who"><b>${esc(p.name)}</b>${p.leader ? " 👑" : ""}<small>${esc(p.role)}</small></span><span class="hpb">${HP[p.hp]}</span><span class="stress"><i style="width:${p.stress}%"></i></span>${p.traits.length ? `<span class="traits">${p.traits.map(esc).join(" ")}</span>` : ""}<span class="job">${job ? `${job.icon} ${job.name}` : status}</span></button>`;
  }
  function dayView() {
    const s = state, f = E.forecast(s);
    const people = E.alive(s).map(card).join("");
    const rations = Object.entries(D.rations).map(([k, r]) => btn(r.name, "ration", `data-k="${k}" class="seg ${s.ration === k ? "on" : ""}"`)).join("");
    return `<main><p class="hint">사람을 눌러 오늘 할 일을 맡기세요. 다친 사람은 쉬게 하거나 누군가 돌봐야 합니다.</p><div class="grid">${people}</div></main>
    <section class="bar"><div class="seg-row"><span>배급</span>${rations}</div><div class="fc">오늘: 🍚+${f.food} 🪵+${f.wood} 🧱+${f.dike} · 밤에 🍚−${f.eat} 🪵−${f.burn}</div>${btn("해가 진다 →", "endday", 'class="primary"')}</section>`;
  }
  function personSheet(id) {
    const s = state, p = E.byId(s, id);
    if (!p) return "";
    const stats = Object.entries(D.stats).map(([k, m]) => `<span>${m.icon} ${m.name} <b>${p.stats[k]}</b></span>`).join("");
    const jobs = E.canWork(s, p)
      ? Object.entries(D.jobs).map(([k, j]) => btn(`<span>${j.icon} ${j.name}</span><small>${j.desc}</small>`, "job", `data-id="${p.id}" data-k="${k}" class="jobbtn ${p.job === k ? "on" : ""}"`)).join("")
      : `<p class="muted">${p.child ? "아이는 일할 수 없다." : p.away > 0 ? "지금 거처 밖에 있다." : p.broken ? "마음이 무너져 아무것도 못 한다." : "몸이 성치 않아 일할 수 없다. 누군가 돌봐야 한다(중상 이상은 약 필요)."}</p>`;
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><div class="pfhead"><span class="face big">${p.face}</span><div><h2>${esc(p.name)} <small>${esc(p.role)}</small></h2><p class="bio">${esc(p.bio)}</p></div></div><div class="pstats">${stats}</div><p class="muted">상태 ${HP[p.hp]} · 스트레스 ${p.stress}/100${p.traits.length ? " · " + p.traits.join(", ") : ""}</p>${jobs}${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  // ── 밤 ──
  function nightModal() {
    const s = state;
    const places = Object.entries(D.places).map(([k, pl]) => btn(`<span>${pl.icon} ${pl.name}</span><small>${pl.loot} · 위험 ${["", "낮음", "보통", "높음"][pl.danger]}<br>${pl.desc}</small>`, "place", `data-k="${k}" class="place ${pickPlace === k ? "on" : ""}"`)).join("");
    const goers = s.people.filter((p) => E.canGo(s, p)).map((p) => btn(`<span class="face">${p.face}</span><span><b>${esc(p.name)}</b><small>💪${p.stats.force} 🗣${p.stats.talk} 🔧${p.stats.craft} 👁${p.stats.wits}${p.hp ? " · 부상" : ""}${p.stress >= 70 ? " · 지침" : ""}</small></span>`, "goer", `data-id="${p.id}" class="goer ${pickParty.includes(p.id) ? "on" : ""}"`)).join("");
    return `<div class="veil"><section class="modal night" role="dialog" aria-modal="true"><div class="eyebrow">🌙 ${s.day}일째 밤</div>${s.dayLines.map((l) => `<p class="line">${esc(l)}</p>`).join("")}<h2>누구를, 어디로 보낼까?</h2><div class="places">${places}</div><h3>갈 사람 <small>최대 2명 · 둘이 가면 서로 돕는다(+1)</small></h3><div class="goers">${goers || "<p class='muted'>나갈 수 있는 사람이 없다.</p>"}</div>${btn("떠난다", "go", `class="primary" ${pickPlace && pickParty.length ? "" : "disabled"}`)}${btn("오늘 밤은 아무도 보내지 않는다", "skip", 'class="secondary"')}</section></div>`;
  }
  function expModal() {
    const s = state, e = s.exp, pl = D.places[e.loc];
    const party = e.party.map((id) => E.byId(s, id));
    const loot = `🍚${e.loot.food} 🪵${e.loot.wood} 💊${e.loot.meds}${e.loot.hope ? ` 🕯${e.loot.hope > 0 ? "+" : ""}${e.loot.hope}` : ""}`;
    const head = `<div class="eyebrow">🌙 ${pl.icon} ${pl.name} · ${e.step + 1}번째 장면${e.step ? ` (더 깊이 · 난이도 +${e.step})` : ""}</div><div class="party">${party.map((p) => `<span class="${p.alive ? "" : "dead"}">${p.face} ${esc(p.name)} <small>${HP[p.hp]}</small></span>`).join("")}<span class="loot">챙긴 것 ${loot}</span></div>`;
    if (e.result) {
      const r = e.result;
      const anyAlive = party.some((p) => p.alive);
      return `<div class="veil"><section class="modal result ${r.success ? "win" : "lose"} ${r.crit ? "crit" : ""}" role="dialog" aria-modal="true">${head}<p class="picked">“${esc(r.approach)}” — ${esc(r.roller)}</p><div class="roll-line"><span class="d20 ${r.crit ? "crit" : r.fumble ? "fumble" : ""}">${r.roll}</span><span class="calc">${r.parts.map(([n, v]) => ` ${v >= 0 ? "+" : "−"} ${esc(n)} ${Math.abs(v)}`).join("")} = <b>${r.total}</b> <small>vs 난이도 ${r.dc}</small></span></div><div class="verdict">${r.crit ? "🎉 대성공!" : r.fumble ? "💥 대실패!" : r.success ? "성공" : "실패"}</div><p class="story">${esc(r.text)}</p>${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${anyAlive && e.step < 2 ? btn("더 깊이 들어간다 <small>(난이도 +1 · 더 많이)</small>", "deeper", 'class="secondary"') : ""}${btn(anyAlive ? "거처로 돌아간다" : "…", "home", 'class="primary"')}</section></div>`;
    }
    const v = E.sceneView(s);
    const choices = v.approaches.map((a) => btn(`<span>${esc(a.label)}</span><small><b class="odds">${D.stats[a.stat].icon} ${D.stats[a.stat].name} · ${esc(a.rollerName)}이(가) 굴림 · 난이도 ${a.dc} · 성공 ${Math.round(a.p * 100)}%</b><br>성공: ${esc(a.win) || "무사"}<br><b class="fail">실패</b> ${esc(a.lose) || "빈손"}</small>`, "approach", `data-i="${a.i}"`)).join("");
    return `<div class="veil"><section class="modal scene" role="dialog" aria-modal="true">${head}<p class="story big">${esc(v.text)}</p><div class="choices">${choices}</div></section></div>`;
  }
  function rollModal() {
    return `<div class="veil"><section class="modal roll" role="dialog" aria-modal="true"><p class="picked">“${esc(rolling.label)}”</p><p class="roll-head">${D.stats[rolling.stat].icon} ${esc(rolling.who)} · 난이도 ${rolling.dc}</p><div class="dice">🎲</div><div class="odds-bar"><i style="width:${Math.round(rolling.p * 100)}%"></i><b class="needle"></b></div><p class="muted">성공 확률 ${Math.round(rolling.p * 100)}%</p></section></div>`;
  }
  // ── 새벽 ──
  function reportModal() {
    const r = state.report;
    return `<div class="veil"><section class="modal report" role="dialog" aria-modal="true"><div class="eyebrow">🌅 새벽</div><h2>${esc(r.title)}</h2>${r.lines.map((l) => `<p class="line ${/🕯|죽었다/.test(l) ? "death" : /⛈|🍚|🥶|습격|🤒/.test(l) ? "bad" : ""}">${esc(l)}</p>`).join("")}${btn(state.ending ? "결말" : "계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function eventModal() {
    const v = E.eventView(state);
    return `<div class="veil"><section class="modal event" role="dialog" aria-modal="true"><div class="big-face">${v.face}</div><p class="story big">${esc(v.text)}</p><div class="choices">${v.choices.map((c) => btn(`<span>${esc(c.label)}</span>${c.reason ? `<em>${esc(c.reason)}</em>` : ""}`, "event", `data-i="${c.i}" ${c.reason ? "disabled" : ""}`)).join("")}</div></section></div>`;
  }
  function eventResultModal() {
    const r = state.eventResult;
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true"><p class="story">${esc(r.text)}</p>${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${btn("계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function endingModal() {
    const s = state, e = D.endings[s.ending];
    const living = E.alive(s).map((p) => `<span>${p.face} ${esc(p.name)}</span>`).join("");
    const wall = s.memorial.map((m) => `<li>${m.face} <b>${esc(m.name)}</b> <small>${m.day}일 · ${esc(m.cause)}</small></li>`).join("");
    return `<div class="veil"><section class="modal ending" role="dialog" aria-modal="true"><div class="big-face">${e.icon}</div><h2>${e.title}</h2><p class="story">${e.text}</p><p class="muted">${s.day - 1}일을 버텼다 · ${E.alive(s).length}/${s.total}명 생존</p><div class="living">${living}</div>${wall ? `<h3>🕯 벽에 새긴 이름</h3><ul class="wall">${wall}</ul>` : ""}${btn("새로운 홍수", "restart", 'class="primary"')}</section></div>`;
  }
  function memorialSheet() {
    const wall = state.memorial.map((m) => `<li>${m.face} <b>${esc(m.name)}</b> <small>${m.day}일 · ${esc(m.cause)}</small></li>`).join("") || "<li class='muted'>아직 아무도 잃지 않았다.</li>";
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><h2>🕯 벽에 새긴 이름</h2><ul class="wall">${wall}</ul><h3>기록</h3><ul class="wall">${state.log.slice().reverse().map((l) => `<li><small>${l.day}일</small> ${esc(l.text)}</li>`).join("")}</ul>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function confirmNew() {
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true"><h2>처음부터 다시 할까요?</h2><p class="story">지금 거처의 이야기는 사라집니다.</p>${btn("새로 시작", "restart", 'class="primary"')}${btn("취소", "close", 'class="secondary"')}</section></div>`;
  }
  function titleScreen() {
    return `<div class="title"><div class="logo">물에 잠기는 항구</div><p class="sub">CIVITAS · 생존</p><form id="new"><label>당신의 이름<input name="name" maxlength="10" required placeholder="이름" autocomplete="off"></label><ul class="how"><li>🌊 강둑이 터졌다. 갇힌 사람들과 <b>구조선이 올 때까지</b> 버텨라.</li><li>☀ <b>낮</b>: 사람마다 일을 맡긴다 — 둑 쌓기, 고기잡이, 땔감, 돌보기, 쉬기. 배급량도 정한다.</li><li>🌙 <b>밤</b>: 1~2명을 물에 잠긴 동네로 보낸다. 장면마다 <b>d20 판정</b>(주사위+능력치 ≥ 난이도). 더 들어갈수록 많이 얻고 더 위험하다.</li><li>🌅 <b>새벽</b>: 식량과 땔감이 줄고, 폭우가 덮치고, 상처가 악화된다. 사람들 사이에 일이 터진다.</li><li>🕯 위독한 사람은 하루 안에 약으로 돌보지 않으면 죽는다. 희망이 꺼지면 폭동이 난다.</li></ul><button class="primary" type="submit">물이 차오른다 →</button></form><a class="back" href="../proto/">이전 맛보기(/proto)</a></div>`;
  }
  function render() {
    if (!state || state.restart) { app.innerHTML = titleScreen() + toastHtml(); return; }
    const s = state;
    let modal = "";
    if (rolling) modal = rollModal();
    else if (s.phase === "exp") modal = expModal();
    else if (s.report) modal = reportModal();
    else if (s.eventResult) modal = eventResultModal();
    else if (s.event) modal = eventModal();
    else if (s.ending) modal = endingModal();
    else if (s.phase === "night") modal = nightModal();
    else if (sheet === "memorial") modal = memorialSheet();
    else if (sheet === "new") modal = confirmNew();
    else if (sheet) modal = personSheet(sheet);
    app.innerHTML = `<div class="shell">${header()}${dayView()}</div>${modal}${toastHtml()}`;
    document.body.classList.toggle("modal-open", !!modal);
  }
  function toastHtml() { return toast ? `<div class="toast">${esc(toast)} ${btn("×", "toast")}</div>` : ""; }
  app.addEventListener("submit", (e) => {
    if (e.target.id !== "new") return;
    e.preventDefault();
    const name = String(new FormData(e.target).get("name")).trim();
    state = E.newGame({ name, seed: crypto.getRandomValues(new Uint32Array(1))[0] });
    sheet = null; pickPlace = null; pickParty = [];
    store.set(state);
    render();
  });
  function act(a) {
    if (rolling) return;
    const k = a.dataset.action;
    if (k === "person") { sheet = a.dataset.id; render(); }
    else if (k === "job") { commit(E.setJob(state, a.dataset.id, a.dataset.k)); sheet = null; render(); }
    else if (k === "ration") commit(E.setRation(state, a.dataset.k));
    else if (k === "endday") { sheet = null; pickPlace = null; pickParty = []; commit(E.endDay(state)); }
    else if (k === "place") { pickPlace = a.dataset.k; render(); }
    else if (k === "goer") {
      const id = a.dataset.id;
      pickParty = pickParty.includes(id) ? pickParty.filter((x) => x !== id) : [...pickParty, id].slice(-2);
      render();
    } else if (k === "go") commit(E.startExp(state, pickPlace, pickParty));
    else if (k === "skip") commit(E.skipNight(state));
    else if (k === "approach") {
      const i = Number(a.dataset.i), v = E.sceneView(state).approaches[i];
      rolling = { label: v.label, stat: v.stat, who: v.rollerName, dc: v.dc, p: v.p };
      render();
      setTimeout(() => { rolling = null; commit(E.choose(state, i)); }, 1200);
    } else if (k === "deeper") commit(E.proceed(state, true));
    else if (k === "home") commit(E.proceed(state, false));
    else if (k === "dismiss") commit(E.dismiss(state));
    else if (k === "event") commit(E.resolveEvent(state, Number(a.dataset.i)));
    else if (k === "sheet") { sheet = a.dataset.sheet; render(); }
    else if (k === "close") { sheet = null; render(); }
    else if (k === "restart") { state = { restart: true }; sheet = null; store.set(null); render(); }
    else if (k === "toast") { toast = ""; render(); }
  }
  // 손가락을 떼는 순간 처리(앱 내 브라우저 대응). 같은 탭에서 click이 한 번 더 오면 무시한다.
  let down = null;
  app.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  app.addEventListener("pointerup", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || e.pointerType === "mouse") return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return; // 스크롤은 누름이 아니다
    lastTap = Date.now();
    act(a);
  });
  app.addEventListener("click", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || Date.now() - lastTap < 500) return;
    act(a);
  });
  render();
})();
