"use strict";
// 「넷이서 버티기」 화면. 저녁 한 화면에서 결정 → 밤 탐색 → 새벽 보고·사건.
(function () {
  const E = SurviveEngine, D = SurviveData, SC = SurviveScenarios, A = SurviveArt, app = document.querySelector("#app");
  const SAVE = "civitas-survive-v2";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
    set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {} },
  };
  let state = null, sheet = null, rolling = null, toast = "", lastTap = 0, pickScenario = "random";
  try { const v = store.get(); if (v) state = E.validate(v); } catch { toast = "저장이 손상되어 새로 시작합니다."; }
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const btn = (label, action, attrs = "") => `<button type="button" data-action="${action}" ${attrs}>${label}</button>`;
  const HP = D.hpNames, HU = D.hungerNames;
  const sc = () => state.scenario, words = () => E.scen(state).words;
  const face = (p, size) => A.portrait(sc(), p, size);
  function commit(res) {
    if (res.error) { toast = res.error; render(); return false; }
    state = res.state; toast = ""; store.set(state); render(); return true;
  }
  // ── 위쪽 ──
  function header() {
    const s = state, w = words(), S = E.scen(s), t = E.nextThreat(s);
    const tools = s.tools.map((k) => `<span class="tool" title="${D.tools[k].desc}">${D.tools[k].icon} ${D.tools[k].name}</span>`).join("");
    return `<header><div class="top"><span>${S.icon} <b>${S.name}</b> · ${s.day}일째</span><span>${btn(`🕯 ${s.memorial.length}`, "sheet", 'data-sheet="memorial" class="mini"')} ${btn("새로", "sheet", 'data-sheet="new" class="mini"')}</span></div>
    <div class="res"><div class="r ${s.food < E.alive(s).length ? "low" : ""}"><small>${w.food}</small><b>${s.food}</b></div><div class="r ${s.wood < 2 ? "low" : ""}"><small>${w.wood}</small><b>${s.wood}</b></div><div class="r ${s.meds === 0 ? "low" : ""}"><small>${w.meds}</small><b>${s.meds}</b></div><div class="r ${s.hope < 25 ? "low" : ""}"><small>희망</small><b>${s.hope}</b><i class="hbar"><i style="width:${s.hope}%"></i></i></div></div>
    <div class="chips"><span class="chip goal">🚩 ${w.goal} ${s.rescueDay - 1}~${s.rescueDay + 1}일</span>${t ? `<span class="chip threat ${t.day - s.day <= 1 ? "urgent" : ""}">⚠ ${w.threat} ${t.day - s.day <= 0 ? "오늘 밤" : t.day - s.day + "일 뒤"}${s.flags.braced ? " · 대비함" : ""}</span>` : ""}${tools}</div></header>`;
  }
  // ── 저녁: 한 화면에서 다 정한다 ──
  function personRow(p) {
    const s = state, plan = s.plan, home = E.home(s, p);
    const status = !home ? "밖에 나가 있음" : p.broken ? "무너져 아무것도 못 함" : "";
    const fed = plan && plan.feed[p.id], med = plan && plan.med[p.id], sent = plan && plan.send.includes(p.id);
    const toggles = !plan || !home ? "" : `<div class="toggles">${btn(fed ? `🍚 먹인다` : `🍚 굶긴다`, "feed", `data-id="${p.id}" class="tg ${fed ? "on" : "off"}"`)}${p.hp >= 1 ? btn(med ? "💊 약 쓴다" : "💊 약 안 씀", "med", `data-id="${p.id}" class="tg ${med ? "on" : ""}"`) : ""}${E.canGo(s, p) ? btn(sent ? "🌙 보낸다" : "🌙 남는다", "send", `data-id="${p.id}" class="tg ${sent ? "go" : ""}"`) : ""}</div>`;
    return `<div class="prow hp${p.hp}"><button class="pface" data-action="person" data-id="${p.id}">${face(p, 64)}</button><div class="pmain"><div class="pname"><b>${esc(p.name)}</b>${p.leader ? " 👑" : ""} <small>${esc(p.role)}</small></div><div class="pstate"><span class="st h${p.hp}">${HP[p.hp]}</span>${p.hunger ? `<span class="st hu${p.hunger}">${HU[p.hunger]}</span>` : ""}${p.traits.map((t) => `<span class="st tr">${esc(t)}</span>`).join("")}${status ? `<span class="st">${status}</span>` : ""}</div><span class="stress" title="스트레스 ${p.stress}"><i style="width:${p.stress}%"></i></span>${toggles}</div></div>`;
  }
  function eveningView() {
    const s = state, w = words(), plan = s.plan, f = E.forecast(s);
    const people = E.alive(s).map(personRow).join("");
    let night = "";
    if (plan) {
      const rec = E.recommend(s);
      const places = Object.entries(E.scen(s).places).map(([k, pl]) => btn(`${A.scene(sc(), k, "thumb")}<b>${pl.name}</b><small>${pl.loot} · 위험 ${["", "낮음", "보통", "높음"][pl.danger]}<br><span class="stock s${Math.min(3, s.depleted?.[k] || 0)}">남은 것: ${E.stockLabel(s, k)}</span></small>`, "place", `data-k="${k}" class="place ${plan.place === k ? "on" : ""}"`)).join("");
      night = plan.send.length
        ? `<h3>어디로 보낼까</h3><div class="places">${places}</div>`
        : rec.party.length ? `<div class="rec">추천: <b>${E.scen(s).places[rec.loc].name}</b> · ${rec.party.map((id) => esc(E.byId(s, id).name)).join("·")} <small>(${esc(rec.why)})</small> ${btn("추천대로", "rec", 'class="mini"')}</div>` : "";
    }
    const go = !plan ? "" : plan.send.length ? (plan.place ? `${plan.send.map((id) => esc(E.byId(s, id).name)).join("·")} → ${E.scen(s).places[plan.place].name}` : "보낼 곳을 고르세요") : "아무도 나가지 않는다";
    return `<main><p class="hint">저녁. 누구를 먹이고, 누구에게 약을 쓰고, 누구를 밤에 내보낼지 정하세요. 남은 사람은 거처를 지키고 쉰다.</p><div class="plist">${people}</div>${night}</main>
    <section class="bar"><div class="fc">오늘 밤: ${w.food} −${f ? f.fed : 0}${f && f.hungry ? ` (${f.hungry}명 굶음)` : ""} · ${w.wood} −1 · 지키는 사람 ${f ? f.guard : 0}명 · ${go}</div>${btn("밤이 된다 →", "night", 'class="primary"')}</section>`;
  }
  function personSheet(id) {
    const p = E.byId(state, id);
    if (!p) return "";
    const stats = Object.entries(D.stats).map(([k, m]) => `<span>${m.icon} ${m.name} <b>${p.stats[k]}</b></span>`).join("");
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><div class="pfhead">${face(p, 96)}<div><h2>${esc(p.name)} <small>${esc(p.role)}</small></h2><p class="bio">${esc(p.bio)}</p></div></div><div class="pstats">${stats}</div><p class="muted">${HP[p.hp]} · ${HU[p.hunger]} · 스트레스 ${p.stress}/100${p.traits.length ? " · " + p.traits.join(", ") : ""}</p>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  // ── 밤 탐색 ──
  function expModal() {
    const s = state, e = s.exp, pl = E.scen(s).places[e.loc], w = words();
    const party = e.party.map((id) => E.byId(s, id));
    const loot = `${w.food} ${e.loot.food} · ${w.wood} ${e.loot.wood} · ${w.meds} ${e.loot.meds}`;
    const head = `${A.scene(sc(), e.loc)}<div class="eyebrow">🌙 ${pl.name} · ${e.step + 1}번째 장면${e.stock < 1 ? ` · 이미 뒤진 곳 (수확 ×${Math.round(e.stock * 100) / 100})` : ""}${E.harsh(s) ? ` · 세상이 험해졌다 +${E.harsh(s)}` : ""}${e.step ? ` (깊이 ${e.step} · 난이도 +${e.step})` : ""}</div><div class="party">${party.map((p) => `<span class="${p.alive ? "" : "dead"}">${face(p, 26)} ${esc(p.name)} <small>${HP[p.hp]}</small></span>`).join("")}<span class="loot">챙긴 것 ${loot}</span></div>`;
    if (e.result) {
      const r = e.result, anyAlive = party.some((p) => p.alive);
      return `<div class="veil"><section class="modal result ${r.success ? "win" : "lose"} ${r.crit ? "crit" : ""}" role="dialog" aria-modal="true">${head}<p class="picked">“${esc(r.approach)}” — ${esc(r.roller)}</p><div class="roll-line"><span class="d20 ${r.crit ? "crit" : r.fumble ? "fumble" : ""}">${r.roll}</span><span class="calc">${r.parts.map(([n, v]) => ` ${v >= 0 ? "+" : "−"} ${esc(n)} ${Math.abs(v)}`).join("")} = <b>${r.total}</b> <small>vs 난이도 ${r.dc}</small></span></div><div class="verdict">${r.crit ? "🎉 대성공!" : r.fumble ? "💥 대실패!" : r.success ? "성공" : "실패"}</div><p class="story">${esc(r.text)}</p>${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${anyAlive && e.step < E.MAX_STEP ? btn("더 깊이 들어간다 <small>(난이도 +1 · 더 많이)</small>", "deeper", 'class="secondary"') : ""}${btn(anyAlive ? "돌아간다" : "…", "home", 'class="primary"')}</section></div>`;
    }
    const v = E.sceneView(s);
    const choices = v.approaches.map((a) => btn(`<span>${esc(a.label)}</span><small><b class="odds">${D.stats[a.stat].icon} ${D.stats[a.stat].name} · ${esc(a.rollerName)} · 난이도 ${a.dc} · 성공 ${Math.round(a.p * 100)}%</b>${a.tool ? `<br><span class="${a.hasTool ? "has" : "no"}">${D.tools[a.tool].icon} ${D.tools[a.tool].name} ${a.hasTool ? "+2" : "있으면 +2"}</span>` : ""}<br>성공: ${esc(a.win) || "무사"}<br><b class="fail">실패</b> ${esc(a.lose) || "빈손"}</small>`, "approach", `data-i="${a.i}"`)).join("");
    return `<div class="veil"><section class="modal scene" role="dialog" aria-modal="true">${head}<p class="story big">${esc(v.text)}</p><div class="choices">${choices}</div></section></div>`;
  }
  function rollModal() {
    return `<div class="veil"><section class="modal roll" role="dialog" aria-modal="true"><p class="picked">“${esc(rolling.label)}”</p><p class="roll-head">${D.stats[rolling.stat].icon} ${esc(rolling.who)} · 난이도 ${rolling.dc}</p><div class="dice">🎲</div><div class="odds-bar"><i style="width:${Math.round(rolling.p * 100)}%"></i><b class="needle"></b></div><p class="muted">성공 확률 ${Math.round(rolling.p * 100)}%</p></section></div>`;
  }
  // ── 새벽 ──
  function reportModal() {
    const r = state.report;
    const key = state.day === 1 && !state.memorial.length && r.lines.length && !/아침/.test(r.title) ? "title" : r.lines.some((l) => /⛈/.test(l) && /버텼|지나갔|멈췄/.test(l)) ? "threat_held" : r.lines.some((l) => /⛈|습격/.test(l)) ? "threat_hit" : "dawn";
    return `<div class="veil"><section class="modal report" role="dialog" aria-modal="true">${A.scene(sc(), key)}<div class="eyebrow">🌅 ${esc(r.title)}</div>${r.lines.map((l) => `<p class="line ${/🕯|죽었다/.test(l) ? "death" : /⛈|🥶|습격|🤒|도둑|굶/.test(l) ? "bad" : ""}">${esc(l)}</p>`).join("")}${btn(state.ending ? "결말" : "계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function eventModal() {
    const v = E.eventView(state);
    const cast = v.cast ? E.byId(state, v.cast) : v.need ? E.byId(state, v.need) : null, cast2 = v.cast2 ? E.byId(state, v.cast2) : null;
    return `<div class="veil"><section class="modal event" role="dialog" aria-modal="true"><div class="scene-art">${A.scene(sc(), "ev:" + v.id)}${cast ? `<div class="cast">${face(cast, 76)}${cast2 ? face(cast2, 76) : ""}</div>` : ""}</div><p class="story big">${esc(v.text)}</p><div class="choices">${v.choices.map((c) => btn(`<span>${esc(c.label)}</span>${c.reason ? `<em>${esc(c.reason)}</em>` : ""}`, "event", `data-i="${c.i}" ${c.reason ? "disabled" : ""}`)).join("")}</div></section></div>`;
  }
  function eventResultModal() {
    const r = state.eventResult;
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true"><p class="story">${esc(r.text)}</p>${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${btn("계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function deathModal() {
    const d = state.deaths[0], p = E.byId(state, d.id);
    return `<div class="veil"><section class="modal death" role="dialog" aria-modal="true"><div class="dface">${p ? face(p, 120) : ""}</div><h2>🕯 ${esc(d.name)}</h2><p class="muted">${state.day}일 · ${esc(d.cause)}</p><blockquote class="last">“${esc(d.last)}”</blockquote>${d.reactions.map((r) => { const q = E.byId(state, r.id); return `<p class="react">${q ? face(q, 30) : ""} ${esc(r.text)}</p>`; }).join("")}${d.lost ? `<p class="note">${esc(d.lost)}</p>` : ""}${btn("벽에 이름을 새긴다", "dismiss", 'class="primary"')}</section></div>`;
  }
  function wallList() {
    return state.memorial.map((m) => { const p = E.byId(state, m.id); return `<li>${p ? face(p, 32) : ""} <b>${esc(m.name)}</b> <small>${m.day}일 · ${esc(m.cause)}</small></li>`; }).join("");
  }
  function endingModal() {
    const s = state, base = D.endings[s.ending], text = E.scen(s).endings[s.ending] || base.text;
    const good = ["all", "most"].includes(s.ending);
    return `<div class="veil"><section class="modal ending" role="dialog" aria-modal="true">${A.scene(sc(), good ? "ending_good" : "ending_bad")}<h2>${base.icon} ${base.title}</h2><p class="story">${esc(text)}</p><p class="muted">${s.day - 1}일을 버텼다 · ${E.alive(s).length}/${s.total}명 생존</p><div class="living">${E.alive(s).map((p) => `<span>${face(p, 34)} ${esc(p.name)}</span>`).join("")}</div>${s.memorial.length ? `<h3>🕯 벽에 새긴 이름</h3><ul class="wall">${wallList()}</ul>` : ""}${btn("다른 재난으로 다시", "restart", 'class="primary"')}</section></div>`;
  }
  function memorialSheet() {
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><h2>🕯 벽에 새긴 이름</h2><ul class="wall">${wallList() || "<li class='muted'>아직 아무도 잃지 않았다.</li>"}</ul><h3>기록</h3><ul class="wall">${state.log.slice().reverse().map((l) => `<li><small>${l.day}일</small> ${esc(l.text)}</li>`).join("")}</ul>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function confirmNew() {
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true"><h2>처음부터 다시 할까요?</h2><p class="story">지금 이야기는 사라집니다.</p>${btn("새로 시작", "restart", 'class="primary"')}${btn("취소", "close", 'class="secondary"')}</section></div>`;
  }
  function titleScreen() {
    const cards = SC.order.map((k) => { const x = SC.scenarios[k]; return btn(`${A.scene(k, "title", "thumb")}<b>${x.icon} ${x.name}</b><small>${x.tagline}<br>난이도 ${x.level}</small>`, "pick", `data-k="${k}" class="scard ${pickScenario === k ? "on" : ""}"`); }).join("") + btn(`<div class="art thumb rand">?</div><b>🎲 무작위</b><small>어떤 재난일지 모른다</small>`, "pick", `data-k="random" class="scard ${pickScenario === "random" ? "on" : ""}"`);
    return `<div class="title"><div class="logo">넷이서 버티기</div><p class="sub">CIVITAS · 생존</p><form id="new"><label>당신의 이름<input name="name" maxlength="10" required placeholder="이름" autocomplete="off"></label><h3>어떤 재난인가</h3><div class="scards">${cards}</div><ul class="how"><li>👥 당신과 세 사람. 한 명 한 명이 소중하다.</li><li>🌆 <b>저녁</b>: 누구를 먹일지, 누구에게 약을 쓸지, 누구를 밤에 내보낼지 정한다. 남은 사람은 거처를 지킨다.</li><li>🌙 <b>밤</b>: 장면마다 <b>d20 판정</b>. 도구가 있으면 +2. 더 들어갈수록 많이 얻고 더 위험하다.</li><li>🌅 <b>새벽</b>: 굶주림·병·상처·재난이 덮친다. 위독한 사람은 약이나 간호 없이는 하루를 못 넘긴다.</li></ul><button class="primary" type="submit">시작 →</button></form><a class="back" href="../proto/">이전 맛보기(/proto)</a></div>`;
  }
  function render() {
    if (!state || state.restart) { app.innerHTML = titleScreen() + toastHtml(); return; }
    const s = state;
    let modal = "";
    if (rolling) modal = rollModal();
    else if (s.phase === "exp") modal = expModal();
    else if (s.report) modal = reportModal();
    else if (s.eventResult) modal = eventResultModal();
    else if (s.deaths && s.deaths.length) modal = deathModal();
    else if (s.event) modal = eventModal();
    else if (s.ending) modal = endingModal();
    else if (sheet === "memorial") modal = memorialSheet();
    else if (sheet === "new") modal = confirmNew();
    else if (sheet) modal = personSheet(sheet);
    app.innerHTML = `<div class="shell sc-${s.scenario}">${header()}${eveningView()}</div>${modal}${toastHtml()}`;
    document.body.classList.toggle("modal-open", !!modal);
  }
  function toastHtml() { return toast ? `<div class="toast">${esc(toast)} ${btn("×", "toast")}</div>` : ""; }
  app.addEventListener("submit", (e) => {
    if (e.target.id !== "new") return;
    e.preventDefault();
    state = E.newGame({ name: String(new FormData(e.target).get("name")).trim(), scenario: pickScenario, seed: crypto.getRandomValues(new Uint32Array(1))[0] });
    sheet = null; store.set(state); render();
  });
  function act(a) {
    if (rolling) return;
    const k = a.dataset.action;
    if (k === "pick") { pickScenario = a.dataset.k; const name = app.querySelector("[name=name]")?.value || ""; render(); const inp = app.querySelector("[name=name]"); if (inp) inp.value = name; }
    else if (k === "person") { sheet = a.dataset.id; render(); }
    else if (k === "feed") commit(E.toggleFeed(state, a.dataset.id));
    else if (k === "med") commit(E.toggleMed(state, a.dataset.id));
    else if (k === "send") commit(E.toggleSend(state, a.dataset.id));
    else if (k === "place") commit(E.setPlace(state, a.dataset.k));
    else if (k === "rec") {
      const r = E.recommend(state);
      let s = state;
      for (const id of r.party) { const x = E.toggleSend(s, id); if (!x.error) s = x.state; }
      const y = E.setPlace(s, r.loc);
      commit(y.error ? { state: s } : y);
    } else if (k === "night") commit(E.nightfall(state));
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
  let down = null;
  app.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  app.addEventListener("pointerup", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || e.pointerType === "mouse") return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    lastTap = Date.now();
    act(a);
  });
  app.addEventListener("click", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || Date.now() - lastTap < 500) return;
    if (a.type === "submit") return;
    act(a);
  });
  render();
})();
