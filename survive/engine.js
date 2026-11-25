"use strict";
// 「넷이서 버티기」 엔진 v2. 시나리오(핵겨울·빙하기·대홍수) × 4인 파티.
// 저녁: 누구를 먹일지·약을 쓸지·누구를 어디로 보낼지 → 밤: d20 탐색(최대 4장면) → 새벽: 결산·위협·아침 사건.
(function (root) {
  const D = typeof module !== "undefined" ? require("./data") : root.SurviveData;
  const SC = typeof module !== "undefined" ? require("./scenarios") : root.SurviveScenarios;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const STATS = ["force", "talk", "craft", "wits"];
  const MAX_STEP = 3; // 0~3 → 최대 4장면
  function rnd(s) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }
  const pick = (s, list) => list[Math.floor(rnd(s) * list.length)];
  const d20 = (s) => 1 + Math.floor(rnd(s) * 20);
  const scen = (s) => SC.scenarios[s.scenario];
  const W = (s) => scen(s).words;

  function person(p, extra = {}) {
    return { id: p.id, name: p.name, role: p.role, bio: p.bio, stats: { ...p.stats }, hp: p.hp || 0, hunger: 0, stress: 15, traits: [], alive: true, child: !!p.child, away: 0, xp: {}, ...extra };
  }
  function newGame({ name = "대표", seed = 1, scenario = "random" } = {}) {
    const s = {
      v: 2, scenario: "flood", rng: seed >>> 0, day: 1, rescueDay: 13, phase: "dawn",
      food: 8, wood: 5, meds: 1, hope: 60, tools: [], people: [], plan: null, threats: [],
      rivalAlert: 0, exp: null, event: null, eventResult: null, report: null, log: [], memorial: [], seen: {}, total: 0, dayLines: [], flags: {},
    };
    s.scenario = SC.scenarios[scenario] ? scenario : pick(s, SC.order);
    const sc = scen(s);
    Object.assign(s, sc.start || {});
    const lead = { id: "leader", name: String(name).slice(0, 10) || "대표", role: "대표", bio: "모두가 당신의 결정을 기다린다.", stats: { force: 1, talk: 1, craft: 1, wits: 1 } };
    for (let i = 0; i < 2; i++) lead.stats[pick(s, STATS)] += 1;
    s.people.push(person(lead, { leader: true }));
    const adults = sc.people.filter((p) => !p.child).slice();
    const kid = sc.people.find((p) => p.child);
    const withKid = kid && rnd(s) < 0.25;
    for (let i = 0; i < (withKid ? 2 : 3) && adults.length; i++) s.people.push(person(adults.splice(Math.floor(rnd(s) * adults.length), 1)[0]));
    if (withKid) s.people.push(person(kid));
    s.total = s.people.length;
    if (rnd(s) < 0.6) s.tools.push(pick(s, Object.keys(D.tools)));
    s.threats = [3, 7, 10].map((d) => ({ day: d + Math.floor(rnd(s) * 2), done: false }));
    s.rescueDay = 12 + Math.floor(rnd(s) * 3);
    const w = sc.words;
    s.report = {
      title: `${sc.icon} ${sc.name}`,
      lines: [
        ...sc.intro,
        `함께 있는 사람: ${s.people.filter((p) => !p.leader).map((p) => `${p.name}(${p.role})`).join(", ")}.`,
        `${w.goal}은(는) ${s.rescueDay - 1}~${s.rescueDay + 1}일쯤. 첫 ${w.threat}은(는) ${s.threats[0].day}일.`,
        s.tools.length ? `챙겨 온 것: ${s.tools.map((t) => D.tools[t].icon + D.tools[t].name).join(", ")}.` : "챙겨 온 도구는 없다.",
      ],
    };
    return s;
  }
  // ── 조회 ──
  const alive = (s) => s.people.filter((p) => p.alive);
  const adults = (s) => alive(s).filter((p) => !p.child);
  const byId = (s, id) => s.people.find((p) => p.id === id);
  const home = (s, p) => p.alive && p.away <= 0;
  const canGo = (s, p) => home(s, p) && !p.child && p.hp <= 1 && !p.broken;
  const nextThreat = (s) => s.threats.find((t) => !t.done);
  const meta = (s, id) => scen(s).people.find((x) => x.id === id) || {};
  // 저녁 기본안: 식량이 되는 만큼 먹이고, 중상 이상은 약
  function defaultPlan(s) {
    const plan = { feed: {}, med: {}, send: [], place: null };
    let food = s.food;
    const order = alive(s).filter((p) => home(s, p)).sort((a, b) => (b.child ? 1 : 0) - (a.child ? 1 : 0) || b.hunger - a.hunger);
    for (const p of order) if (food > 0) { plan.feed[p.id] = true; food--; }
    let meds = s.meds;
    for (const p of alive(s).filter((x) => x.hp >= 2).sort((a, b) => b.hp - a.hp)) if (meds > 0) { plan.med[p.id] = true; meds--; }
    return plan;
  }
  function planCount(plan, key) { return Object.values(plan[key]).filter(Boolean).length; }
  function forecast(s) {
    if (!s.plan) return null;
    const fed = planCount(s.plan, "feed"), med = planCount(s.plan, "med");
    const stay = alive(s).filter((p) => home(s, p) && !p.child && !s.plan.send.includes(p.id));
    return { fed, hungry: alive(s).filter((p) => home(s, p)).length - fed, med, fuel: 1, guard: stay.length };
  }
  // ── 저녁 결정 ──
  function evening(state, fn) {
    if (state.phase !== "evening") return { state, error: "저녁에만 정할 수 있습니다." };
    const s = clone(state);
    const err = fn(s);
    return err ? { state, error: err } : { state: s };
  }
  const toggleFeed = (state, id) => evening(state, (s) => {
    const p = byId(s, id);
    if (!p || !home(s, p)) return "지금 거처에 없는 사람입니다.";
    if (!s.plan.feed[id] && planCount(s.plan, "feed") >= s.food) return `${W(s).food}이(가) 모자랍니다.`;
    s.plan.feed[id] = !s.plan.feed[id];
  });
  const toggleMed = (state, id) => evening(state, (s) => {
    const p = byId(s, id);
    if (!p || !p.alive || p.hp === 0) return "약이 필요 없는 사람입니다.";
    if (!s.plan.med[id] && planCount(s.plan, "med") >= s.meds) return `${W(s).meds}이(가) 없습니다.`;
    s.plan.med[id] = !s.plan.med[id];
  });
  const toggleSend = (state, id) => evening(state, (s) => {
    const p = byId(s, id);
    if (!p || !canGo(s, p)) return "지금 내보낼 수 없는 사람입니다.";
    if (s.plan.send.includes(id)) s.plan.send = s.plan.send.filter((x) => x !== id);
    else if (s.plan.send.length >= 2) return "최대 두 명까지 보낼 수 있습니다.";
    else s.plan.send.push(id);
  });
  const setPlace = (state, loc) => evening(state, (s) => {
    if (!scen(s).places[loc]) return "알 수 없는 장소입니다.";
    s.plan.place = s.plan.place === loc ? null : loc;
  });
  // 밤이 된다: 배급·약·휴식·경계·난방을 처리하고 탐색 또는 새벽으로
  function nightfall(state) {
    if (state.phase !== "evening") return { state, error: "지금은 저녁이 아닙니다." };
    if (state.plan.send.length && !state.plan.place) return { state, error: "어디로 보낼지 고르세요." };
    const s = clone(state), w = W(s), lines = [], notes = [];
    const plan = s.plan;
    const here = alive(s).filter((p) => home(s, p));
    const fed = here.filter((p) => plan.feed[p.id]);
    s.food -= fed.length;
    for (const p of here) {
      if (plan.feed[p.id]) p.hunger = 0;
      else p.hunger = Math.min(3, p.hunger + 1);
    }
    const starving = here.filter((p) => !plan.feed[p.id]);
    lines.push(`저녁: ${fed.length}명이 ${w.food}을(를) 먹었다${starving.length ? ` · ${starving.map((p) => p.name).join(", ")}은(는) 굶었다` : ""}.`);
    s.hope = clamp(s.hope + (starving.length ? -2 : 2), 0, 100);
    for (const p of alive(s)) {
      p.medToday = false;
      if (plan.med[p.id] && s.meds > 0) {
        s.meds--;
        p.hp = Math.max(0, p.hp - 1);
        p.medToday = true;
        lines.push(`${p.name}에게 ${w.meds}을(를) 썼다 (${D.hpNames[p.hp]}).`);
      }
    }
    const stay = here.filter((p) => !p.child && !plan.send.includes(p.id));
    for (const p of stay) {
      p.stress = clamp(p.stress - 10, 0, 100);
      if (p.hp === 1 && !p.medToday && rnd(s) < 0.35) { p.hp = 0; lines.push(`${p.name}의 상처가 아물었다.`); }
    }
    // 남은 사람이 환자를 돌본다(간호 경험자는 확실히, 다른 사람은 운에 따라 한 단계)
    const patients = () => alive(s).filter((p) => p.hp >= 1 && !p.medToday).sort((a, b) => b.hp - a.hp);
    for (const c of stay) {
      const pt = patients().find((p) => p !== c);
      if (!pt) break;
      if (meta(s, c.id).care || rnd(s) < 0.3) {
        pt.hp -= 1;
        pt.medToday = true;
        lines.push(`${c.name}이(가) 밤새 ${pt.name}을(를) 간호했다 (${D.hpNames[pt.hp]}).`);
      }
    }
    const finder = stay.slice().sort((a, b) => b.stats.wits - a.stats.wits)[0];
    if (finder && rnd(s) < 0.3) { s.food += 1; lines.push(`${finder.name}이(가) ${scen(s).homeFind}. (${w.food} +1)`); }
    if (!stay.length && rnd(s) < 0.5) {
      const lost = Math.ceil(s.food * 0.3);
      s.food -= lost;
      lines.push(`🕳 아무도 지키지 않은 ${w.shelter}에 도둑이 들었다. ${w.food} −${lost}.`);
    }
    if (s.wood > 0) { s.wood -= 1; lines.push(`${w.wood} −1 (밤의 온기)`); }
    else {
      lines.push(`🥶 ${w.wood}이(가) 떨어져 밤새 떨었다.`);
      for (const p of alive(s)) p.stress = clamp(p.stress + 10, 0, 100);
      if (rnd(s) < 0.3) hurt(s, pick(s, alive(s)), 1, "추위", notes);
    }
    s.dayLines = [...lines, ...notes];
    if (plan.send.length) {
      s.exp = { loc: plan.place, party: plan.send.slice(), step: 0, loot: { food: 0, wood: 0, meds: 0, hope: 0 }, scene: null, result: null, story: [] };
      for (const id of plan.send) byId(s, id).stress = clamp(byId(s, id).stress + 5, 0, 100);
      drawScene(s);
      s.phase = "exp";
      return { state: s };
    }
    s.dayLines.push("밤에는 아무도 나가지 않았다.");
    return dawn(s);
  }
  // ── 밤 탐색 ──
  function drawScene(s) {
    const e = s.exp, used = new Set(e.story.map((x) => x.scene));
    const sc = scen(s).scenes;
    let pool = sc.filter((x) => x.loc === e.loc && !used.has(x.id));
    if (e.step >= 1 && rnd(s) < 0.3) pool = sc.filter((x) => x.loc === null && !used.has(x.id));
    if (!pool.length) pool = sc.filter((x) => x.loc === null && !used.has(x.id));
    e.scene = pool.length ? pick(s, pool).id : null;
  }
  const sceneById = (s, id) => scen(s).scenes.find((x) => x.id === id);
  function approach(s, a) {
    const party = s.exp.party.map((id) => byId(s, id)).filter((p) => p.alive);
    const roller = party.slice().sort((x, y) => y.stats[a.stat] - x.stats[a.stat])[0];
    const parts = [[`${roller.name} ${D.stats[a.stat].icon}${D.stats[a.stat].name}`, roller.stats[a.stat]]];
    if (party.length > 1) parts.push(["동행", 1]);
    if (a.tool && s.tools.includes(a.tool)) parts.push([D.tools[a.tool].name, 2]);
    if (roller.hp === 1) parts.push(["부상", -1]);
    if (roller.hunger >= 1) parts.push([D.hungerNames[roller.hunger], -roller.hunger]);
    if (roller.traits.includes("겁쟁이")) parts.push(["겁쟁이", -2]);
    if (roller.stress >= 70) parts.push(["지침", -1]);
    const mod = parts.reduce((n, [, v]) => n + v, 0);
    const dc = a.dc + (scen(s).places[s.exp.loc].danger - 1) + s.exp.step;
    const p = clamp((21 - (dc - mod)) / 20, 0.05, 0.95);
    return { roller: roller.id, rollerName: roller.name, mod, parts, dc, p: Math.round(p * 100) / 100, tool: a.tool || null, hasTool: !!(a.tool && s.tools.includes(a.tool)) };
  }
  function describe(s, o) {
    const w = W(s), out = [], L = o.loot || {};
    if (L.food) out.push(`${w.food} ${L.food > 0 ? "+" : ""}${L.food}`);
    if (L.wood) out.push(`${w.wood} ${L.wood > 0 ? "+" : ""}${L.wood}`);
    if (L.meds) out.push(`${w.meds} ${L.meds > 0 ? "+" : ""}${L.meds}`);
    if (L.hope) out.push(`희망 ${L.hope > 0 ? "+" : ""}${L.hope}`);
    if (o.harm) out.push(`부상 ${o.harm}단계`);
    if (o.stress) out.push(`스트레스 +${o.stress}`);
    if (o.lose) out.push("짐 절반 잃음");
    if (o.join) out.push("새 식구");
    if (o.tool) out.push(`${D.tools[o.tool].icon}${D.tools[o.tool].name}`);
    if (o.radio) out.push(`${w.goal} 앞당김`);
    if (o.forecast) out.push(`${w.threat} 하루 늦춤`);
    if (o.rivalAlert) out.push(`${w.rival}이(가) 눈치챔`);
    return out.join(" · ");
  }
  function sceneView(s) {
    if (!s.exp || !s.exp.scene) return null;
    const sc = sceneById(s, s.exp.scene);
    return { id: sc.id, text: sc.text, loc: s.exp.loc, place: scen(s).places[s.exp.loc], step: s.exp.step, approaches: sc.approaches.map((a, i) => ({ i, label: a.label, stat: a.stat, ...approach(s, a), win: describe(s, a.win), lose: describe(s, a.lose) })) };
  }
  function hurt(s, p, n, cause, notes) {
    if (!n || !p || !p.alive) return;
    p.hp = Math.min(4, p.hp + n);
    if (p.hp >= 4) die(s, p, cause, notes);
    else notes.push(`${p.name}: ${D.hpNames[p.hp]}`);
  }
  function die(s, p, cause, notes) {
    p.alive = false;
    p.hp = 4;
    s.memorial.push({ id: p.id, name: p.name, day: s.day, cause });
    s.hope = clamp(s.hope - (p.child ? 15 : 10), 0, 100);
    for (const q of alive(s)) q.stress = clamp(q.stress + (q.traits.includes("냉혈한") ? 0 : p.child ? 25 : 18), 0, 100);
    notes.push(`🕯 ${p.name}이(가) 죽었다.`);
    s.log.push({ day: s.day, text: `${p.name}이(가) 죽었다 (${cause}).` });
  }
  function joinStranger(s, notes) {
    const pool = scen(s).people.filter((x) => !x.child && !s.people.some((p) => p.id === x.id));
    const np = pool.length ? person(pick(s, pool), { hp: 1, hunger: 1 }) : person({ id: "sailor" + s.day, name: "떠돌이", role: "떠돌이 생존자", bio: "어디서 왔는지 말하지 않는다.", stats: { force: 2, talk: 0, craft: 1, wits: 2 } }, { hp: 1, hunger: 1 });
    s.people.push(np);
    s.total += 1;
    notes.push(`🤝 ${np.name}(${np.role})이(가) 합류했다.`);
  }
  function gainXp(s, p, stat, notes) {
    p.xp[stat] = (p.xp[stat] || 0) + 1;
    if (p.xp[stat] >= 3 && p.stats[stat] < 5) {
      p.xp[stat] = 0;
      p.stats[stat] += 1;
      notes.push(`⬆ ${p.name}의 ${D.stats[stat].name}이(가) ${p.stats[stat]}이(가) 되었다.`);
    }
  }
  function choose(state, index) {
    if (state.phase !== "exp" || !state.exp?.scene || state.exp.result) return { state, error: "고를 장면이 없습니다." };
    const sc = sceneById(state, state.exp.scene), a = sc.approaches[index];
    if (!a) return { state, error: "알 수 없는 선택입니다." };
    const s = clone(state), e = s.exp, info = approach(s, a), roller = byId(s, info.roller);
    const roll = d20(s), crit = roll === 20, fumble = roll === 1;
    const success = crit || (!fumble && roll + info.mod >= info.dc);
    const o = success ? a.win : a.lose, notes = [];
    for (const [k, v] of Object.entries(o.loot || {})) e.loot[k] += Math.round(v * (v > 0 && crit ? 1.5 : 1));
    if (o.lose) for (const k of ["food", "wood", "meds"]) e.loot[k] = Math.floor(e.loot[k] * (1 - o.lose));
    hurt(s, roller, (o.harm || 0) + (fumble ? 1 : 0), "밤 탐색 중 사고", notes);
    if (o.stress) for (const id of e.party) { const p = byId(s, id); if (p.alive) p.stress = clamp(p.stress + (p.traits.includes("냉혈한") ? Math.round(o.stress / 2) : o.stress), 0, 100); }
    if (o.join) joinStranger(s, notes);
    if (o.tool && !s.tools.includes(o.tool)) { s.tools.push(o.tool); notes.push(`🎒 ${D.tools[o.tool].icon} ${D.tools[o.tool].name}을(를) 얻었다.`); }
    if (o.radio) { s.rescueDay = Math.max(s.day + 2, s.rescueDay - 1); notes.push(`📻 ${W(s).goal}이(가) ${s.rescueDay}일에 온다!`); }
    if (o.forecast) { const t = nextThreat(s); if (t) t.day += 1; }
    if (o.ledger) s.flags.ledger = true;
    if (o.rivalAlert) s.rivalAlert += 1;
    if (roller.alive) gainXp(s, roller, a.stat, notes);
    e.result = { approach: a.label, roller: roller.name, stat: a.stat, roll, mod: info.mod, parts: info.parts, dc: info.dc, total: roll + info.mod, success, crit, fumble, text: (crit ? "대성공! " : fumble ? "대실패! " : "") + o.text, notes };
    e.story.push({ scene: sc.id, success });
    return { state: s };
  }
  function proceed(state, deeper) {
    if (state.phase !== "exp" || !state.exp?.result) return { state, error: "결과를 먼저 확인하세요." };
    const s = clone(state), e = s.exp, w = W(s);
    const party = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    if (deeper && party.length && e.step < MAX_STEP) {
      e.step += 1;
      e.result = null;
      drawScene(s);
      if (e.scene) return { state: s };
    }
    s.food = Math.max(0, s.food + e.loot.food);
    s.wood = Math.max(0, s.wood + e.loot.wood);
    s.meds = Math.max(0, s.meds + e.loot.meds);
    s.hope = clamp(s.hope + e.loot.hope, 0, 100);
    s.dayLines.push(`밤 탐색 (${scen(s).places[e.loc].name}): ${party.length ? "" : "아무도 돌아오지 못했다. "}${w.food} ${e.loot.food >= 0 ? "+" : ""}${e.loot.food} · ${w.wood} +${Math.max(0, e.loot.wood)} · ${w.meds} +${Math.max(0, e.loot.meds)}`);
    s.log.push({ day: s.day, text: `${e.party.map((id) => byId(s, id).name).join("·")}이(가) ${scen(s).places[e.loc].name}에 다녀왔다.` });
    s.exp = null;
    return dawn(s);
  }
  // ── 새벽 ──
  function dawn(s) {
    const w = W(s), lines = s.dayLines.slice(), notes = [];
    for (const p of alive(s)) {
      if (p.hunger >= 2) p.stress = clamp(p.stress + 10, 0, 100);
      if (p.hunger >= 3) hurt(s, p, 1, "굶주림", notes);
    }
    const sick = 0.22 + (alive(s).some((p) => p.hunger >= 2) ? 0.1 : 0);
    if (rnd(s) < sick) {
      const v = pick(s, alive(s)), bad = rnd(s) < 0.3;
      if (v) { notes.push(`🤒 ${v.name}이(가) ${bad ? "심하게 " : ""}앓기 시작했다.`); hurt(s, v, bad ? 2 : 1, "병", notes); }
    }
    for (const p of alive(s)) {
      if (p.hp === 3 && !p.medToday) die(s, p, "치료받지 못한 상처", notes);
      else if (p.hp === 2 && !p.medToday && rnd(s) < 0.35) hurt(s, p, 1, "상처 악화", notes);
    }
    const t = s.threats.find((x) => !x.done && x.day === s.day);
    if (t) {
      t.done = true;
      const stay = alive(s).filter((p) => home(s, p) && !p.child);
      if (s.flags.braced || (s.wood >= 2 && stay.length)) {
        if (!s.flags.braced) s.wood -= 2;
        s.flags.braced = false;
        s.hope = clamp(s.hope + 5, 0, 100);
        lines.push(`⛈ ${w.threat}! ${scen(s).threatHeld}${s.flags.braced ? "" : ` (${w.wood} −2)`}`);
      } else {
        const lf = Math.ceil(s.food * 0.4), lw = Math.ceil(s.wood * 0.3);
        s.food -= lf;
        s.wood -= lw;
        s.hope = clamp(s.hope - 8, 0, 100);
        lines.push(`⛈ ${w.threat}! ${scen(s).threatHit} ${w.food} −${lf} · ${w.wood} −${lw}.`);
        for (const p of alive(s).slice().sort(() => rnd(s) - 0.5).slice(0, 2)) hurt(s, p, 1, w.threat, notes);
      }
    }
    if (s.rivalAlert >= 2 && rnd(s) < 0.5) {
      s.rivalAlert = 0;
      const lf = Math.ceil(s.food * 0.3);
      s.food -= lf;
      lines.push(`⚔ ${w.rival}이(가) ${w.shelter}을(를) 습격했다. ${w.food} −${lf}.`);
      hurt(s, pick(s, adults(s)), 1, `${w.rival}의 습격`, notes);
    }
    for (const p of alive(s).filter((x) => x.swimming)) {
      p.swimming = false;
      if (d20(s) + p.stats.force + p.stats.wits >= 15) {
        s.rescueDay = Math.max(s.day + 2, s.rescueDay - 2);
        p.away = 1;
        lines.push(`🧭 ${p.name}이(가) 신호를 남기고 돌아오는 중이다! ${w.goal}이(가) ${s.rescueDay}일로 앞당겨졌다.`);
      } else die(s, p, "홀로 길을 나섰다가", notes);
    }
    for (const p of s.people) {
      if (p.away > 0) { p.away -= 1; if (p.away === 0 && p.alive) lines.push(`${p.name}이(가) 돌아왔다.`); }
      if (p.broken > 0) p.broken -= 1;
    }
    for (const p of alive(s).filter((x) => x.stress >= 100 && !x.child)) {
      p.stress = 60;
      const r = rnd(s);
      if (r < 0.35 && !p.traits.includes("겁쟁이")) { p.traits.push("겁쟁이"); notes.push(`😨 ${p.name}이(가) 무너졌다. 이제 위험한 판정에서 −2.`); }
      else if (r < 0.6 && !p.traits.includes("냉혈한")) { p.traits.push("냉혈한"); s.hope = clamp(s.hope - 5, 0, 100); notes.push(`🧊 ${p.name}의 눈빛이 식었다. 죽음에도 흔들리지 않는다.`); }
      else { const st = Math.min(s.food, 2); s.food -= st; p.broken = 2; notes.push(`💔 ${p.name}이(가) ${w.food} ${st}을(를) 들고 숨었다. 이틀간 아무것도 못 한다.`); }
    }
    s.hope = clamp(s.hope - 1, 0, 100);
    s.day += 1;
    s.dayLines = [];
    if (!adults(s).length) s.ending = "lost";
    else if (s.hope <= 0 && s.flags.riotWarn) s.ending = "riot";
    else if (s.hope <= 0) {
      s.flags.riotWarn = true;
      s.hope = 10;
      notes.push("🔥 사람들이 수군거린다. 한 번만 더 무너지면 폭동이 난다. (희망을 지켜야 한다)");
    }
    else if (!byId(s, "leader").alive && !s.flags.newLeader) {
      const heir = adults(s).sort((a, b) => b.stats.talk - a.stats.talk)[0];
      s.flags.newLeader = heir.id;
      heir.leader = true;
      notes.push(`👤 ${heir.name}이(가) 대표를 이어받았다.`);
    }
    if (!s.ending && s.day > s.rescueDay) {
      const ratio = alive(s).length / s.total;
      s.ending = ratio >= 1 ? "all" : ratio >= 0.6 ? "most" : "few";
    }
    s.event = s.ending ? null : pickEvent(s);
    s.report = { title: s.ending ? "마지막 아침" : `${s.day}일째 아침`, lines: [...lines, ...notes] };
    s.phase = s.ending ? "end" : "dawn";
    return { state: s };
  }
  // ── 아침 사건 ──
  const events = (s) => [...SC.commonEvents, ...scen(s).events];
  function castFor(s, kind) {
    const pool = adults(s).filter((p) => !p.leader && p.away <= 0);
    if (kind === "hungry") return pool.filter((p) => p.hunger >= 1 || p.stress >= 45);
    if (kind === "brave") return pool.filter((p) => p.hp === 0 && p.stats.force + p.stats.wits >= 4);
    if (kind === "stressed") return pool.filter((p) => p.stress >= 65);
    return pool;
  }
  const ONCE = ["rival_offer", "brave", "doyun_offer", "haejin", "radio_call", "forecast", "stranger"];
  function eventOk(s, e) {
    const last = s.seen[e.id];
    if (ONCE.includes(e.id) && last !== undefined) return false;
    if (last !== undefined && s.day - last < 3) return false;
    if (e.need && !(byId(s, e.need) && byId(s, e.need).alive)) return false;
    if ((e.id === "rival_offer" || e.id === "doyun_offer") && s.day < 3) return false;
    if (e.id === "stranger" && s.day < 4) return false;
    if (e.cast === "two" && castFor(s, "two").length < 2) return false;
    if (e.cast && e.cast !== "two" && !castFor(s, e.cast).length) return false;
    return true;
  }
  function pickEvent(s) {
    if (rnd(s) > 0.65) return null;
    const ok = events(s).filter((e) => eventOk(s, e));
    if (!ok.length) return null;
    const e = pick(s, ok);
    s.seen[e.id] = s.day;
    if ((e.id === "cough" || e.id === "fever_kid" || e.id === "frost_kid") && e.need) { const k = byId(s, e.need); if (k.hp === 0) k.hp = 1; }
    let cast = null, cast2 = null;
    if (e.cast) {
      const pool = castFor(s, e.cast).slice();
      cast = pool.splice(Math.floor(rnd(s) * pool.length), 1)[0]?.id || null;
      if (e.cast === "two") cast2 = pool[Math.floor(rnd(s) * pool.length)]?.id || null;
    }
    return { id: e.id, cast, cast2 };
  }
  function fillText(s, text) {
    const w = W(s), ev = s.event;
    return String(text).replaceAll("{who}", ev?.cast ? byId(s, ev.cast).name : "").replaceAll("{who2}", ev?.cast2 ? byId(s, ev.cast2).name : "")
      .replaceAll("{rival}", w.rival).replaceAll("{goal}", w.goal).replaceAll("{food}", w.food).replaceAll("{wood}", w.wood).replaceAll("{meds}", w.meds);
  }
  function eventView(s) {
    if (!s.event) return null;
    const e = events(s).find((x) => x.id === s.event.id);
    return {
      id: e.id, text: fillText(s, e.text), cast: s.event.cast, cast2: s.event.cast2, need: e.need || null,
      choices: e.choices.map((c, i) => ({ i, label: fillText(s, c.label), reason: c.need?.meds && s.meds < c.need.meds ? `${W(s).meds}이(가) 없다` : c.need?.wood && s.wood < c.need.wood ? `${W(s).wood}이(가) 모자라다` : c.need?.ledger && !s.flags.ledger ? "장부가 필요하다" : "" })),
    };
  }
  function resolveEvent(state, index) {
    if (!state.event || state.phase !== "dawn") return { state, error: "사건이 없습니다." };
    const e = events(state).find((x) => x.id === state.event.id), c = e.choices[index];
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const reason = eventView(state).choices[index].reason;
    if (reason) return { state, error: reason };
    const s = clone(state), fx = c.fx, notes = [];
    const cast = s.event.cast ? byId(s, s.event.cast) : null, cast2 = s.event.cast2 ? byId(s, s.event.cast2) : null;
    let text = fillText(s, c.text);
    for (const r of ["food", "wood", "meds"]) if (fx[r]) s[r] = Math.max(0, s[r] + fx[r]);
    if (fx.hope) s.hope = clamp(s.hope + fx.hope, 0, 100);
    if (fx.castStress && cast) cast.stress = clamp(cast.stress + fx.castStress, 0, 100);
    if (fx.cast2Stress && cast2) cast2.stress = clamp(cast2.stress + fx.cast2Stress, 0, 100);
    if (fx.allStress) for (const p of alive(s)) p.stress = clamp(p.stress + fx.allStress, 0, 100);
    if (fx.stress) for (const [id, v] of Object.entries(fx.stress)) if (byId(s, id)) byId(s, id).stress = clamp(byId(s, id).stress + v, 0, 100);
    if (fx.heal && byId(s, fx.heal)) byId(s, fx.heal).hp = 0;
    if (fx.worsen) hurt(s, byId(s, fx.worsen), 1, "병", notes);
    if (fx.exile && cast) {
      cast.alive = false;
      s.memorial.push({ id: cast.id, name: cast.name, day: s.day, cause: "쫓겨남" });
      s.log.push({ day: s.day, text: `${cast.name}을(를) 쫓아냈다.` });
    }
    if (fx.lend) {
      const lent = adults(s).filter((p) => !p.leader && canGo(s, p)).slice(0, fx.lend);
      for (const p of lent) p.away = 3;
      text += lent.length ? ` (${lent.map((p) => p.name).join("·")})` : "";
    }
    if (fx.swim && cast) cast.swimming = true;
    if (fx.join) joinStranger(s, notes);
    if (fx.rivalAlert) s.rivalAlert += fx.rivalAlert;
    if (fx.radio) s.rescueDay = Math.max(s.day + 2, s.rescueDay - 1);
    if (fx.braceThreat) s.flags.braced = true;
    if (fx.law) s.flags.law = fx.law;
    if (fx.trustHaejin) s.flags.trustHaejin = true;
    if (fx.spy) {
      const lead = byId(s, s.flags.newLeader || "leader");
      if (d20(s) + lead.stats.wits >= 13) {
        if (rnd(s) < 0.5) { s.flags.ledger = true; text = "강해진이 도윤의 사병에게 쪽지를 건네는 걸 봤다. 쪽지를 빼앗았다 — 도윤의 장부 위치가 적혀 있었다."; }
        else { s.food += 2; text = "강해진은 몰래 고기를 잡아 다른 이들에게 나눠 주고 있었다. (식량 +2)"; }
      } else text = "뒤를 밟다 놓쳤다. 강해진은 당신을 의심하는 눈치다.";
    }
    s.event = null;
    s.eventResult = { text, notes };
    return { state: s };
  }
  function dismiss(state) {
    const s = clone(state);
    if (s.eventResult) s.eventResult = null;
    else if (s.report) s.report = null;
    if (s.phase === "dawn" && !s.report && !s.event && !s.eventResult) {
      s.phase = "evening";
      s.plan = defaultPlan(s);
    }
    return { state: s };
  }
  function validate(s) {
    const ok = s && s.v === 2 && SC.scenarios[s.scenario] && Number.isInteger(s.rng) && Number.isInteger(s.day) && Array.isArray(s.people) && s.people.length &&
      ["dawn", "evening", "exp", "end"].includes(s.phase) && [s.food, s.wood, s.meds, s.hope].every(Number.isFinite) && Array.isArray(s.threats) && Array.isArray(s.memorial) && Array.isArray(s.tools) &&
      (s.phase !== "evening" || (s.plan && s.plan.feed && s.plan.med && Array.isArray(s.plan.send)));
    if (!ok) throw Error("저장이 손상되었습니다.");
    return clone(s);
  }
  // 밤 추천: 가장 모자란 것을 구하러, 그 장소에 맞는 두 사람
  function recommend(s) {
    const pl = scen(s).places, keys = Object.keys(pl);
    const lootOf = (k) => pl[k].loot;
    const w = W(s);
    const want = alive(s).some((p) => p.hp >= 2) && s.meds < 1 ? w.meds : s.food < alive(s).length * 2 ? w.food : s.wood < 3 ? w.wood : null;
    const loc = keys.find((k) => want && lootOf(k).startsWith(want) && pl[k].danger <= 2) || keys.find((k) => pl[k].danger === 2) || keys[0];
    let pool = s.people.filter((p) => canGo(s, p) && p.hp === 0 && p.stress < 75 && !p.leader);
    if (pool.length < 2) pool = s.people.filter((p) => canGo(s, p));
    const party = pool.sort((a, b) => b.stats.force + b.stats.wits - a.stats.force - a.stats.wits).slice(0, 2).map((p) => p.id);
    return { loc, party, why: want ? `${want}이(가) 모자라다` : "여유가 있을 때 더 찾아 둔다" };
  }
  const api = {
    newGame, toggleFeed, toggleMed, toggleSend, setPlace, nightfall, choose, proceed, resolveEvent, dismiss, validate, recommend,
    sceneView, eventView, forecast, nextThreat, alive, adults, byId, canGo, home, describe, scen, meta, defaultPlan, MAX_STEP,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.SurviveEngine = api;
})(globalThis);
