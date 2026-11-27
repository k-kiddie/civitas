"use strict";
// 「남행」 화면. 표지(출신 고르기) → 지도 → 사건 → 야영 → … → 결말
(function () {
  const E = JourneyEngine, C = E.C, app = document.querySelector("#app");
  const SAVE = "civitas-journey-v1";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
    set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {} },
  };
  // 판을 넘어 남는 것: 모은 진실 조각, 지난 판에 쓰러진 나
  const LEGACY = "civitas-journey-legacy";
  const legacy = {
    get() { try { return JSON.parse(localStorage.getItem(LEGACY)) || { truths: [], corpse: null, endings: [] }; } catch { return { truths: [], corpse: null, endings: [] }; } },
    set(v) { try { localStorage.setItem(LEGACY, JSON.stringify(v)); } catch {} },
  };
  let state = null, sheet = null, toast = "", pickOrigin = "parent", rolling = null, lastTap = 0;
  try { const v = store.get(); if (v) state = E.validate(v); } catch { toast = "저장이 손상되어 새로 시작합니다."; }
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const btn = (label, action, attrs = "") => `<button type="button" data-action="${action}" ${attrs}>${label}</button>`;
  const prose = (list) => `<div class="prose">${list.filter(Boolean).map((t, i) => `<p style="--i:${i}">${esc(t)}</p>`).join("")}</div>`;
  // ── 그림: 여정 그림이 없으면 빙하기 그림, 그것도 없으면 어두운 바탕 ──
  const A = "../assets/";
  const SKY = `linear-gradient(#1d2a33,#0d0c0a)`;
  function art(a, cls = "banner") {
    const urls = [`${A}journey/${a.dir || "places"}/${a.key}.webp`, a.fb ? `${A}scenarios/iceage/scenes/${a.fb}.webp` : ""].filter(Boolean);
    return `<div class="art ${cls}" style='background-image:${urls.map((u) => `url("${u}")`).join(",")},${SKY}'></div>`;
  }
  const placeArt = (id, cls) => { const p = C.places[id]; return art({ key: p.art, fb: p.fb, dir: "places" }, cls); };
  function face(id, size = 32) {
    const p = C.people[id];
    const urls = p ? [`${A}journey/people/${id}.webp`, `${A}scenarios/iceage/portraits/${p.art}.webp`] : [`${A}journey/people/${state.origin}_m.webp`, `${A}scenarios/iceage/portraits/leader.webp`];
    return `<span class="pt" style='width:${size}px;height:${size}px;background-image:${urls.map((u) => `url("${u}")`).join(",")},${SKY}'></span>`;
  }
  const itemArt = (k) => `<span class="ithumb" style='background-image:url("${A}journey/items/${k}.webp"),url("${A}gear/${k}.webp")'></span>`;
  function commit(res) {
    if (res.error) { toast = res.error; render(); return false; }
    const was = state && state.phase;
    state = res.state; toast = ""; store.set(state);
    if (state.phase === "end" && was !== "end" && state.legacyOut) {
      const L = legacy.get();
      L.truths = [...new Set([...(L.truths || []), ...state.legacyOut.truths])];
      L.corpse = state.legacyOut.corpse || null;
      L.endings = [...new Set([...(L.endings || []), state.ending.key])];
      legacy.set(L);
    }
    render(); return true;
  }
  // ── 머리말 ──
  function header() {
    const s = state, left = s.trainDay - s.day;
    const st = (label, v, bad) => `<span class="${bad ? "bad" : ""}">${label}<b>${v}</b></span>`;
    return `<header class="jhead"><div class="top"><span><b>남행</b>  ${s.day}일째</span><span>${btn("가방", "sheet", 'data-sheet="bag" class="mini"')} ${btn("기록", "sheet", 'data-sheet="chron" class="mini"')} ${btn("새로", "sheet", 'data-sheet="new" class="mini"')}</span></div>
      <div class="jstats">${st("몸", E.HP[s.me.hp], s.me.hp >= 2)}${st("배", E.fullLabel(s.me.full ?? 5), (s.me.full ?? 5) <= 2)}${st("체온", E.COLD[s.me.cold], s.me.cold >= 2)}${st("식량", s.food, s.food < 2)}${st("연료", s.fuel, s.fuel < 1)}${st("열차", left > 0 ? `${left}일 뒤쯤` : left === 0 ? "오늘 밤" : "지나갔다", left <= 1)}</div>
      <div class="clocks"><span>의지 <b class="dots">${"●".repeat(s.will)}${"○".repeat(Math.max(0, 3 - s.will))}</b></span>${E.clocksView(s).map((c) => `<span class="${c.n >= c.max - 1 && c.k !== "clue" ? "hot" : ""}">${esc(c.name)} <b class="dots">${"●".repeat(c.n)}${"○".repeat(c.max - c.n)}</b></span>`).join("")}</div>
      ${E.live(s).length ? `<div class="jcomps">${E.live(s).map((c) => `<span>${face(c.id, 26)} ${esc(c.name)} <small>${E.HP[c.hp]}</small></span>`).join("")}</div>` : ""}</header>`;
  }
  // ── 지도 ──
  const ACTS = { 1: "1막 · 얼어붙은 마을들", 2: "2막 · 늑대단의 땅", 3: "3막 · 남쪽 산맥" };
  function actCard() {
    const a = E.adventure(state, state.actCard);
    if (!a) return "";
    return `<div class="veil night"><section class="modal actcard" role="dialog">${placeArt(state.act === 1 ? "gate_bridge" : state.act === 2 ? "gate_checkpoint" : "mountain_pass")}<h2 class="chapter">${esc(a.title)}</h2>${prose([a.goal])}<h3>필요해 보이는 것</h3><ul class="wall moments need">${a.need.map((n) => `<li class="${n.have ? "have" : ""}">${n.have ? "✔" : "·"} ${esc(n.label)}</li>`).join("")}</ul><p class="muted">하나만 있어도 길은 열린다. 없으면 대가를 치른다.</p>${btn("떠난다", "closeact", 'class="primary"')}</section></div>`;
  }
  function mapView() {
    const s = state, cols = s.map[s.act] || [];
    const route = cols.map((col, i) => {
      const visited = col.find((id) => s.seen[id]);
      const cls = i < s.step ? "done" : i === s.step ? "now" : "";
      const label = visited ? C.places[visited].name : i === s.step ? "지금 고를 길" : C.places[col[0]].gate ? C.places[col[0]].name : "…";
      return `<li class="${cls} ${C.places[col[0]].gate ? "gate" : ""}">${esc(label)}</li>`;
    }).join("");
    const nodes = E.options(s).map((o) => btn(`${placeArt(o.id, "thumb")}<b>${esc(o.name)}</b><small>${o.lock ? esc(o.lock) : o.gate ? "관문 — 넘으면 돌아올 수 없다" : o.dest ? "마지막 목적지" : "하루가 걸린다"}</small>`, "go", `data-id="${o.id}" class="node ${o.gate ? "gate" : ""}" ${o.lock ? "disabled" : ""}`)).join("");
    const night = (s.lastNight || []).length ? `<p class="night">${s.lastNight.map(esc).join(" ")}</p>` : "";
    const g = E.goals(s);
    const goal = `<div class="goal"><b>${esc(g.title)}</b>${g.lines.map((l) => `<small>${esc(l)}</small>`).join("")}${btn("수첩 보기", "sheet", 'data-sheet="note" class="mini"')}</div>`;
    return `${s.actCard ? actCard() : ""}${header()}<main class="jmain">${goal}<p class="act">${ACTS[s.act]}</p><ul class="route">${route}</ul>${night}<h3>어디로 갈까</h3><div class="nodes">${nodes}</div></main>${bar()}`;
  }
  function bar() {
    const over = E.bagCount(state) > E.BAG;
    return `<nav class="jbar">${btn(`가방 ${E.bagCount(state)}/${E.BAG}`, "sheet", `data-sheet="bag" class="${over ? "warn" : ""}"`)}${btn("수첩", "sheet", 'data-sheet="note"')}${btn("기록", "sheet", 'data-sheet="chron"')}</nav>`;
  }
  // ── 사건 ──
  function eventView() {
    const s = state, v = E.view(s);
    if (!v) return mapView();
    const r = v.result;
    const head = `${art(v.art)}<div class="eyebrow">${esc(v.title)} · ${s.day}일째</div>${(s.found || []).length && !r ? `<p class="found">길에서 주운 것: ${s.found.map(esc).join(", ")}</p>` : ""}`;
    if (rolling) return `<div class="veil night"><section class="modal roll" role="dialog"><p class="picked">“${esc(rolling.label)}”</p><p class="roll-head">${esc(rolling.who)} · ${esc(rolling.stat)}</p><div class="dice">d20</div><p class="muted heartbeat">숨을 참는다…</p></section></div>`;
    if (v.pending) {
      const p = v.pending, canRe = !["win", "crit"].includes(p.tier) && s.will > 0;
      return `<div class="veil night"><section class="modal result ${["win", "crit"].includes(p.tier) ? "win" : p.tier === "partial" ? "" : "lose flash"}" role="dialog">${head}<p class="picked">“${esc(p.label)}”</p><div class="roll-line"><span class="d20 ${p.r === 20 ? "crit" : p.r === 1 ? "fumble" : ""}">${p.r}</span><span class="calc">${esc(p.who)} ${esc(p.stat)} ${p.mod >= 0 ? "+" : "−"}${Math.abs(p.mod)}${p.bonus ? ` · 의지·도움 +${p.bonus}` : ""} = <b>${p.total}</b> <small>vs ${p.dc}</small></span></div><div class="verdict tier-${p.tier}">${esc(p.tierName)}</div><p class="muted">${p.tier === "partial" ? "해내긴 한다. 대신 무언가를 내줘야 한다." : ["lose", "fumble"].includes(p.tier) ? "이대로면 실패다." : "해냈다."}${p.rerolled ? ` (다시 굴림 ${p.rerolled}번)` : ""}</p>${canRe ? btn(`의지 1점으로 다시 굴린다 <small>남은 의지 ${s.will}</small>`, "reroll", 'class="secondary"') : ""}${btn("받아들인다", "accept", 'class="primary"')}</section></div>`;
    }
    if (r && r.cost) {
      return `<div class="veil"><section class="modal result" role="dialog">${head}<div class="verdict tier-partial">대가를 치르는 성공</div>${prose([r.text])}${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}<h3>무엇을 내줄까</h3><div class="choices">${v.costs.map((c) => btn(`<span>${esc(c.label)}</span><small class="${c.danger ? "why" : ""}">${esc(c.sub)}</small>`, "cost", `data-k="${c.k}"`)).join("")}</div></section></div>`;
    }
    if (r) {
      const dice = r.roll ? `<div class="roll-line"><span class="d20 ${r.roll.r === 20 ? "crit" : r.roll.r === 1 ? "fumble" : ""}">${r.roll.r}</span><span class="calc">${esc(r.roll.who)} ${esc(r.roll.stat)} ${r.roll.mod >= 0 ? "+" : "−"}${Math.abs(r.roll.mod)} = <b>${r.roll.r + r.roll.mod}</b> <small>vs ${r.roll.dc}</small></span></div><div class="verdict tier-${r.roll.tier}">${esc(r.roll.tierName || (r.roll.ok ? "성공" : "실패"))}</div>` : "";
      return `<div class="veil"><section class="modal result ${r.roll && !r.roll.ok ? "lose flash" : "win"}" role="dialog">${head}${dice}${prose([r.text])}${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${btn(r.ending ? "결말" : "계속", "cont", 'class="primary"')}</section></div>`;
    }
    const choices = v.choices.map((c) => btn(`${c.tag ? `<em class="req ${c.lock ? "no" : "ok"}">[${esc(c.tag)}]</em> ` : ""}<span>${esc(c.label)}</span>${c.lock ? `<small class="why">${esc(c.lock)}</small>` : c.feel ? `<small>${c.approach ? `<span class="appr">${esc(c.approach)}</span> · ` : ""}<b class="feel f-${{ "해볼 만하다": "good", "반반이다": "mid", "위험하다": "bad", "무모하다": "awful" }[c.feel]}">${c.feel}</b> · ${esc(c.stat)} · ${esc(c.who)}</small>` : ""}`, "choose", `data-i="${c.i}" ${c.lock ? "disabled" : ""} class="${c.lock ? "locked" : c.tag ? "special" : ""}"`)).join("");
    const anyRoll = v.choices.some((c) => c.feel && !c.lock);
    const boost = anyRoll ? `<div class="boost">${btn(v.useWill ? `의지를 건다 ✔ <small>+2 · 남은 의지 ${s.will}</small>` : `의지를 건다 <small>+2 · 남은 의지 ${s.will}</small>`, "will", `class="tg ${v.useWill ? "on" : ""}" ${s.will <= 0 && !v.useWill ? "disabled" : ""}`)}${v.helpers.map((h) => btn(v.help === h.id ? `${esc(h.name)}이(가) 돕는다 ✔ <small>+1 · 실패하면 함께 다친다</small>` : `${esc(h.name)}에게 도움을 청한다 <small>+1</small>`, "help", `data-id="${h.id}" class="tg ${v.help === h.id ? "on" : ""}"`)).join("")}</div>` : "";
    const scoutBox = v.scoutNote ? `<p class="note scout">${esc(v.scoutNote)}</p>` : v.canScout ? btn(`먼저 주변을 살핀다 <small>눈치 · 성공하면 이 장면의 판정 −2, 실패하면 시계 +1</small>`, "scout", 'class="secondary scoutbtn"') : "";
    const ask = v.choices.length > 1 ? `<p class="gm">어떻게 하겠는가?</p>` : "";
    return `<div class="veil"><section class="modal scene" role="dialog">${head}${prose(v.text.split("\n\n"))}${scoutBox}${ask}${boost}<div class="choices">${choices}</div></section></div>`;
  }
  // ── 야영 ──
  function campView() {
    const s = state, c = s.camp;
    const people = [{ id: "me", name: "당신", p: s.me }, ...E.live(s).map((x) => ({ id: x.id, name: x.name, p: x }))];
    const MEAL = ["굶긴다", "조금 (식량 1)", "넉넉히 (식량 2)"];
    const used = Object.values(c.feed).reduce((a, b) => a + (b || 0), 0);
    const rows = people.map((x) => { const f = E.mealForecast(s, x.id), m = c.feed[x.id] || 0; return `<div class="crow meal">${x.id === "me" ? face(null, 36) : face(x.id, 36)}<div><b>${esc(x.name)}</b> <small class="inline">${E.HP[x.p.hp]}${x.id === "me" ? ` · ${E.COLD[s.me.cold]}` : ""}</small><span class="fullbar"><i style="width:${f.full * 10}%"></i><em style="left:${f.after * 10}%"></em></span><small>지금 ${f.now} → 내일 아침 <b class="${f.after <= 2 ? "bad" : f.after >= 7 ? "good" : ""}">${f.afterLabel}</b>${f.why.length ? ` · ${esc(f.why.join(", "))}` : ""}</small>${x.id !== "me" ? `<small>${esc(C.people[x.id].perkText)}</small>` : ""}</div>${btn(MEAL[m], "feed", `data-id="${x.id}" class="tg ${m === 0 ? "off" : "on"}"`)}</div>`; }).join("");
    const heal = s.bag.filter((b) => C.items[b.k].use).map((b) => people.filter((x) => x.p.hp >= 1).map((x) => btn(`${esc(C.items[b.k].name)} → ${esc(x.name)}`, "use", `data-k="${b.k}" data-t="${x.id}" class="mini"`)).join(" ")).join(" ");
    const talk = !c.talked ? E.live(s).map((x) => btn(`${esc(x.name)}와(과) 이야기한다`, "talk", `data-id="${x.id}" class="mini"`)).join(" ") : "";
    const crafts = C.recipes.filter((r) => r.from.every((k) => E.hasItem(s, k))).map((r) => btn(esc(r.name), "craft", `data-r="${r.id}" class="mini"`)).join(" ");
    const over = E.bagCount(s) > E.BAG;
    return `${header()}<main class="jmain">${art({ key: c.fire ? "camp_fire" : "camp_storm", fb: c.fire ? "night" : "dawn_cold", dir: "places" })}<p class="act">야영 · ${esc(C.places[s.place].name)} 근처</p>
      <div class="campsec"><h3>저녁 <small>식량 ${s.food} · 오늘 쓸 것 ${used} · 누르면 굶김 → 조금 → 넉넉히</small></h3>${rows}</div>
      <div class="campsec"><h3>불</h3><div class="crow"><span></span><div><b>${c.fire ? "불을 피운다" : "불 없이 버틴다"}</b><small>연료 ${s.fuel} · 불이 없으면 체온이 떨어지고 동행이 지친다</small></div>${btn(c.fire ? "피운다" : "안 피운다", "fire", `class="tg ${c.fire ? "on" : "off"}"`)}</div></div>
      ${heal ? `<div class="campsec"><h3>치료</h3><p>${heal}</p></div>` : ""}
      ${talk || c.talk ? `<div class="campsec"><h3>이야기</h3>${c.talk ? `<p class="talkline">${face(c.talk.id, 24)} ${esc(c.talk.line)}</p>` : `<p>${talk}</p>`}</div>` : ""}
      ${crafts ? `<div class="campsec"><h3>만들기</h3><p>${crafts}</p></div>` : ""}
      ${btn(over ? `가방이 넘친다 — ${E.bagCount(s) - E.BAG}개를 버려야 한다` : "밤을 보낸다", over ? "sheet" : "sleep", over ? 'data-sheet="bag" class="primary"' : 'class="primary"')}</main>${bar()}`;
  }
  // ── 가방 · 기록 · 새로 ──
  function bagSheet() {
    const s = state, over = E.bagCount(s) > E.BAG;
    const rows = s.bag.map((b) => { const d = C.items[b.k]; return `<li>${itemArt(b.k)}<div><b>${esc(d.name)}</b>${d.uses ? ` <small>${b.u}회</small>` : ""}<small>${esc(d.kind)} · ${esc(d.desc)}</small></div><span class="acts">${d.key ? "<small>버릴 수 없다</small>" : btn("버리기", "drop", `data-k="${b.k}" class="drop"`)}</span></li>`; }).join("");
    return `<div class="veil bottom"><section class="sheet" role="dialog"><h2>가방 <small class="slots ${over ? "over" : ""}">${E.bagCount(s)}/${E.BAG}칸 · 단서는 칸을 차지하지 않는다</small></h2><ul class="bagl">${rows || "<li class='muted'>비어 있다.</li>"}</ul>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function chronSheet() {
    const c = state.chronicle || [];
    return `<div class="veil bottom"><section class="sheet chron" role="dialog"><h2>기록</h2>${state.narrator ? `<p class="narrator">${esc(state.narrator)}</p>` : ""}${c.map((x) => `<article><h3><small>${x.day}일</small> ${esc(x.title)}</h3>${x.paras.map((t) => `<p>${esc(t)}</p>`).join("")}</article>`).join("")}${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function noteSheet() {
    const n = E.notebook(state);
    const list = (h, a, empty) => `<h3>${h}</h3>${a.length ? `<ul class="wall moments">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted">${empty}</p>`}`;
    return `<div class="veil bottom"><section class="sheet chron" role="dialog"><h2>수첩</h2><h3>목표</h3><p><b>${esc(n.goal.title)}</b></p>${n.goal.lines.map((l) => `<p class="muted">${esc(l)}</p>`).join("")}${list("이상한 것들", n.sus, "아직 눈치챈 게 없다.")}${list("사람들", n.people, "아직 누구와도 얽히지 않았다.")}${n.truths.length ? list("그 겨울의 진실", n.truths, "") : ""}${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  const newSheet = () => `<div class="veil"><section class="modal" role="dialog"><h2>처음부터 다시 할까요?</h2><p class="story">지금 여정은 사라집니다.</p>${btn("새로 시작", "restart", 'class="primary"')}${btn("취소", "close", 'class="secondary"')}</section></div>`;
  // ── 표지 · 시작 · 결말 ──
  function titleView() {
    const cards = Object.entries(C.origins).map(([k, o]) => btn(`${art({ key: k, fb: o.start === "outskirts" ? "camp" : "title", dir: "origins" }, "thumb")}<b>${esc(o.name)}</b><small>${esc(o.pitch)}</small>`, "origin", `data-k="${k}" class="ocard ${pickOrigin === k ? "on" : ""}"`)).join("");
    return `<div class="title"><div class="logo">남행</div><p class="sub">CIVITAS · 극 빙하기</p><p class="story">열차가 남쪽 선로를 지난다는 소문. 영하 오십 도의 설원을 건너야 한다. 무엇을 들고, 누구와 걷고, 무엇을 내줄 것인가.</p><h3>당신은 누구인가</h3><div class="origins">${cards}</div>${legacyBox()}${btn("떠난다", "start", 'class="primary"')}<a class="back" href="../survive/">넷이서 버티기(/survive)</a></div>`;
  }
  function legacyBox() {
    const L = legacy.get(), T = C.truths, n = Object.keys(T).length;
    const got = (L.truths || []).filter((t) => T[t]);
    if (!got.length && !(L.endings || []).length) return "";
    return `<h3>지난 겨울들</h3><p class="muted">본 결말 ${(L.endings || []).length}/${Object.keys(C.endings).length - 1} · 그 겨울의 진실 ${got.length}/${n}</p>${got.map((t) => `<p class="truth">— ${esc(T[t].name)}: ${esc(T[t].text)}</p>`).join("")}${L.corpse ? `<p class="muted">지난번의 당신은 ${esc(C.origins[L.corpse.origin]?.name || "")}(으)로 쓰러졌다. 이번 길 어딘가에 그 흔적이 있다.</p>` : ""}`;
  }
  function introView() {
    const o = C.origins[state.origin];
    return `<div class="veil"><section class="modal" role="dialog">${placeArt(o.start)}<h2 class="chapter">${esc(o.name)}</h2>${prose(o.intro)}${btn("떠난다", "begin", 'class="primary"')}</section></div>`;
  }
  function endView() {
    const s = state, e = C.endings[s.ending.key];
    const moments = s.journal.slice().sort((a, b) => b.w - a.w || a.day - b.day).slice(0, 6).sort((a, b) => a.day - b.day);
    return `<div class="veil"><section class="modal ending" role="dialog">${art({ key: `end_${s.ending.key}`, fb: s.ending.key === "train" ? "f_train" : s.ending.key === "missed" ? "ending_missed" : s.ending.key === "frozen" ? "ending_bad" : "ending_good", dir: "endings" })}<p class="narrator">${esc(s.narrator || "")}</p><p class="etitle">이번 겨울의 이야기</p><h2 class="storyname">「${esc(s.title)}」</h2><p class="muted">${esc(C.origins[s.origin].name)} · ${s.day}일</p><h3>${esc(e.title)}</h3>${prose([e.text, ...((s.epilogue && s.epilogue.knots) || []), s.ending.inhuman ? C.endings.inhuman.text : ""])}${s.ending.inhuman ? `<p class="inhuman">— ${esc(C.endings.inhuman.title)}</p>` : ""}${s.epilogue && s.epilogue.people.length ? `<h3>그 뒤</h3><ul class="wall moments">${s.epilogue.people.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${s.dir.why ? `<p class="why">${esc(s.dir.why)}</p>` : ""}${(s.newTruths || []).length ? `<h3>새로 알게 된 진실</h3>${s.newTruths.map((t) => `<p class="truth">— ${esc(C.truths[t].name)}: ${esc(C.truths[t].text)}</p>`).join("")}<p class="muted">그 겨울의 진실 ${E.allTruths(s).length}/${Object.keys(C.truths).length}${E.allTruths(s).length >= 3 ? " · 하얀나루역에서 무언가 할 수 있을 것 같다" : ""}</p>` : ""}<h3>그 겨울의 결정들</h3><ul class="wall moments">${moments.map((m) => `<li><small>${m.day}일</small> ${esc(m.text)}</li>`).join("")}</ul>${btn("기록을 처음부터 읽기", "sheet", 'data-sheet="chron" class="secondary"')}${btn("다른 사람으로 다시", "restart", 'class="primary"')}</section></div>`;
  }
  function render() {
    let html;
    if (!state || state.restart) html = titleView();
    else if (state.phase === "intro") html = introView();
    else if (state.phase === "end") html = sheet === "chron" ? chronSheet() : endView();
    else if (state.phase === "event") html = eventView();
    else if (state.phase === "camp") html = campView();
    else html = mapView();
    if (state && !state.restart && state.phase !== "end" && sheet) html += sheet === "bag" ? bagSheet() : sheet === "chron" ? chronSheet() : sheet === "note" ? noteSheet() : sheet === "new" ? newSheet() : "";
    if (toast) html += `<div class="toast">${esc(toast)} ${btn("×", "toast")}</div>`;
    app.innerHTML = E.josa(html);
    document.body.classList.toggle("modal-open", /class="veil/.test(html));
  }
  function act(a) {
    if (rolling) return;
    const k = a.dataset.action;
    if (k === "origin") { pickOrigin = a.dataset.k; render(); }
    else if (k === "start") { const L = legacy.get(); state = E.newGame({ origin: pickOrigin, seed: crypto.getRandomValues(new Uint32Array(1))[0], legacy: { truths: L.truths, corpse: L.corpse } }); sheet = null; store.set(state); render(); }
    else if (k === "begin") commit(E.begin(state));
    else if (k === "go") commit(E.go(state, a.dataset.id));
    else if (k === "choose") {
      const i = Number(a.dataset.i), c = E.view(state).choices[i];
      if (c.feel) { rolling = { label: c.label, who: c.who, stat: c.stat }; render(); setTimeout(() => { rolling = null; commit(E.choose(state, i)); }, 1500); }
      else commit(E.choose(state, i));
    }
    else if (k === "reroll") { rolling = { label: E.view(state).pending.label, who: E.view(state).pending.who, stat: "다시" }; render(); setTimeout(() => { rolling = null; commit(E.reroll(state)); }, 1200); }
    else if (k === "accept") commit(E.accept(state));
    else if (k === "scout") commit(E.scout(state));
    else if (k === "cost") commit(E.payCost(state, a.dataset.k));
    else if (k === "will") commit(E.setWill(state));
    else if (k === "help") commit(E.setHelp(state, a.dataset.id));
    else if (k === "closeact") commit(E.closeAct(state));
    else if (k === "cont") { if (commit(E.cont(state))) window.scrollTo(0, 0); }
    else if (k === "feed") commit(E.campToggle(state, "feed", a.dataset.id));
    else if (k === "fire") commit(E.campToggle(state, "fire"));
    else if (k === "talk") commit(E.campToggle(state, "talk", a.dataset.id));
    else if (k === "use") commit(E.useItem(state, a.dataset.k, a.dataset.t));
    else if (k === "craft") commit(E.craft(state, a.dataset.r));
    else if (k === "drop") commit(E.drop(state, a.dataset.k));
    else if (k === "sleep") { if (commit(E.sleep(state))) window.scrollTo(0, 0); }
    else if (k === "sheet") { sheet = a.dataset.sheet; render(); }
    else if (k === "close") { sheet = null; render(); }
    else if (k === "restart") { state = { restart: true }; sheet = null; store.set(null); render(); }
    else if (k === "toast") { toast = ""; render(); }
  }
  let down = null;
  app.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; const v = e.target.closest(".veil"); if (v) v.classList.add("shown"); }, true);
  app.addEventListener("pointerup", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || e.pointerType === "mouse") return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    lastTap = Date.now(); act(a);
  });
  app.addEventListener("click", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || Date.now() - lastTap < 500) return;
    act(a);
  });
  render();
})();
