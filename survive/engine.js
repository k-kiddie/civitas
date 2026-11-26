"use strict";
// 「넷이서 버티기」 엔진 v2. 시나리오(핵겨울·빙하기·대홍수) × 4인 파티.
// 저녁: 누구를 먹일지·약을 쓸지·누구를 어디로 보낼지 → 밤: d20 탐색(최대 4장면) → 새벽: 결산·위협·아침 사건.
(function (root) {
  const D = typeof module !== "undefined" ? require("./data") : root.SurviveData;
  const SC = typeof module !== "undefined" ? require("./scenarios") : root.SurviveScenarios;
  const N = typeof module !== "undefined" ? require("./night") : root.SurviveNight;
  const ST = typeof module !== "undefined" ? require("./story") : root.SurviveStory;
  const story = (s) => (s.story ? ST[s.scenario] : null);
  const ICE = typeof module !== "undefined" ? require("./iceage") : root.SurviveIceage;
  const TEXT = { iceage: ICE };
  const ROLES = {
    guard: { name: "경계", icon: "🛡", desc: "도둑과 습격을 막는다. 아무도 없으면 도둑이 든다." },
    nurse: { name: "간호", icon: "🩹", desc: "다친 사람 하나를 밤새 돌본다." },
    forage: { name: "먹을 것 구하기", icon: "🎣", desc: "눈치 판정. 성공하면 식량. 밖이라 춥다." },
    fix: { name: "수리", icon: "🔧", desc: "손재주 판정. 성공하면 오늘 밤 연료를 아낀다." },
    rest: { name: "휴식", icon: "💤", desc: "스트레스가 크게 줄고 상처가 아물 수 있다." },
  };
  const NOISE = { force: 3, talk: 2, craft: 1, wits: 1 }, NOISE_MAX = 8;
  const RES = ["food", "wood", "meds"];
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
      v: 3, scenario: "flood", rng: seed >>> 0, day: 1, rescueDay: 13, phase: "dawn",
      food: 8, wood: 5, meds: 1, hope: 60, parts: 1, gear: [], uid: 1, people: [], plan: null, threats: [],
      stock: {}, known: {}, rumors: [], used: {},
      rivalAlert: 0, exp: null, event: null, eventResult: null, report: null, log: [], memorial: [], seen: {}, total: 0, dayLines: [], flags: {},
      deaths: [],
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
    const sg = N.startGear[s.scenario].slice();
    addGear(s, sg.splice(Math.floor(rnd(s) * sg.length), 1)[0]);
    if (rnd(s) < 0.5) addGear(s, sg.splice(Math.floor(rnd(s) * sg.length), 1)[0]);
    initStock(s);
    for (let i = 0; i < 2; i++) addRumor(s);
    s.story = ST[s.scenario] ? { act: 1, clues: 0, rail: false, prog: {}, stance: 0, rival: 0, arcs: {}, arcDay: {}, cbs: [], journal: [], lost: 0, heavy: false } : null;
    s.card = null;
    s.chronicle = [];
    s.scouted = {};
    s.threats = [3, 7, 10].map((d, i) => ({ day: d + Math.floor(rnd(s) * 2), done: false, need: 2 + i }));
    s.rescueDay = 12 + Math.floor(rnd(s) * 3);
    const w = sc.words;
    s.report = {
      title: story(s) ? `${sc.icon} ${story(s).acts[0].title}` : `${sc.icon} ${sc.name}`,
      lines: [
        ...sc.intro,
        `함께 있는 사람: ${s.people.filter((p) => !p.leader).map((p) => `${p.name}(${p.role})`).join(", ")}.`,
        story(s) ? `${w.goal}은(는) ${s.rescueDay}일 밤에 온다. 그 전에 선로를 찾고, 거기까지 갈 방법을 마련해야 한다. 첫 ${w.threat}은(는) ${s.threats[0].day}일.` : `${w.goal}은(는) ${s.rescueDay - 1}~${s.rescueDay + 1}일쯤. 첫 ${w.threat}은(는) ${s.threats[0].day}일.`,
        `챙겨 온 것: ${s.gear.map((g) => gearName(g)).join(", ")}.`,
        ...s.rumors.map((r) => `소문: ${r.text}`),
      ],
    };
    return s;
  }
  // ── 조회 ──
  const alive = (s) => s.people.filter((p) => p.alive);
  const adults = (s) => alive(s).filter((p) => !p.child);
  const byId = (s, id) => s.people.find((p) => p.id === id);
  const home = (s, p) => p.alive && p.away <= 0;
  const canGo = (s, p) => home(s, p) && !p.child && p.hp <= 1 && !p.broken && !p.busy;
  const jr = (s, text, w = 2) => { if (s.story && text) s.story.journal.push({ day: s.day, text, w }); };
  const placeOf = (s, loc) => scen(s).places[loc] || (story(s) && loc === "finale" ? story(s).finale.place : { name: loc, danger: 1, loot: "" });
  const nextThreat = (s) => s.threats.find((t) => !t.done);
  const meta = (s, id) => scen(s).people.find((x) => x.id === id) || {};
  // ── 장비 ──
  const G = (k) => N.gear[k];
  const gearName = (g) => `${G(g.k).icon}${G(g.k).name}${G(g.k).uses ? `(${g.u})` : ""}`;
  function addGear(s, k, notes) {
    if (!k || !G(k)) return;
    s.gear.push({ uid: s.uid++, k, u: G(k).uses || 0, with: null });
    if (notes) notes.push(`🎒 ${G(k).icon} ${G(k).name}을(를) 얻었다.`);
  }
  function dropGear(s, g, why, notes) {
    s.gear = s.gear.filter((x) => x !== g && x.uid !== g.uid);
    if (notes && why) notes.push(`💔 ${G(g.k).icon} ${G(g.k).name}: ${why}`);
  }
  // 지금 탐색에 함께 나간(살아 있는) 사람이 든 장비
  const carried = (s) => (s.exp ? s.gear.filter((g) => g.with && s.exp.party.includes(g.with) && byId(s, g.with)?.alive) : []);
  const findGear = (s, test) => carried(s).find((g) => { const d = G(g.k); return test(d, g.k) && (!d.uses || g.u > 0); });
  const hasTool = (s, k) => !!k && !!findGear(s, (d, gk) => gk === k || d.alias === k);
  // ── 장소: 몰래 정해진 재고, 기억, 소문 ──
  const LEVELS = [["텅 빔", 0], ["조금", 2], ["반쯤", 6], ["가득", 12]];
  const total = (st) => st.food + st.wood + st.meds;
  const lvl = (st) => LEVELS.slice().reverse().find(([, n]) => total(st) >= n)[0];
  function initStock(s) {
    const w = W(s);
    for (const [loc, pl] of Object.entries(scen(s).places)) {
      const r = rnd(s), m = r < 0.15 ? 0.2 : r < 0.4 ? 0.6 : r < 0.75 ? 1 : 1.5;
      const big = /많이/.test(pl.loot) ? 1.5 : 1, any = /무엇이든/.test(pl.loot);
      const prim = RES.find((k) => pl.loot.startsWith(w[k])) || "food";
      const st = {};
      for (const k of RES) st[k] = Math.round((any ? 6 : k === prim ? 13 * big : 2) * m);
      s.stock[loc] = st;
    }
  }
  function addRumor(s, loc) {
    const keys = Object.keys(scen(s).places).filter((k) => !s.rumors.some((r) => r.loc === k));
    if (!keys.length) return;
    loc = loc || pick(s, keys);
    const pl = scen(s).places[loc], truth = rnd(s) < 0.6, rich = total(s.stock[loc]) >= 8;
    const saysRich = truth ? rich : !rich;
    s.rumors.push({ loc, day: s.day, text: saysRich ? `${pl.name}에 아직 손 안 탄 게 잔뜩 있다더라.` : `${pl.name}은(는) 벌써 다 털렸다더라.` });
  }
  function placeInfo(s, loc) {
    const k = s.known[loc], r = s.rumors.filter((x) => x.loc === loc).at(-1);
    const hz = N.placeHazard[s.scenario]?.[loc];
    const gearHere = (N.placeGear[s.scenario]?.[loc] || []).map((g) => G(g).name);
    return { gearHere, known: k ? `${k.day}일에 봤을 때: ${k.lvl}${k.sign ? ` · ${k.sign}` : ""}` : null, scouted: s.scouted && s.day - (s.scouted[loc] ?? -9) <= 2, rumor: !k || (r && r.day > k.day) ? r?.text || null : null, hazard: hz ? N.hazards[hz] : null, guarded: hz ? s.gear.some((g) => G(g.k).guard === hz) : true };
  }
  // 저녁 기본안: 식량이 되는 만큼 먹이고, 중상 이상은 약
  function defaultPlan(s) {
    const plan = { feed: {}, med: {}, send: [], place: null, carry: {}, scout: null, role: {}, craft: null };
    let food = s.food;
    const order = alive(s).filter((p) => home(s, p)).sort((a, b) => (b.child ? 1 : 0) - (a.child ? 1 : 0) || b.hunger - a.hunger);
    for (const p of order) if (food > 0) { plan.feed[p.id] = true; food--; }
    let meds = s.meds;
    for (const p of alive(s).filter((x) => x.hp >= 2).sort((a, b) => b.hp - a.hp)) if (meds > 0) { plan.med[p.id] = true; meds--; }
    // 기본 역할: 가장 힘센 사람이 경계, 환자가 있으면 간호, 나머지는 휴식
    const ad = alive(s).filter((p) => home(s, p) && !p.child && !p.broken);
    const guard = ad.slice().sort((a, b) => b.stats.force - a.stats.force)[0];
    if (guard) plan.role[guard.id] = "guard";
    const sick = alive(s).some((p) => p.hp >= 1);
    const nurse = sick && ad.filter((p) => p !== guard && p.hp === 0).sort((a, b) => (meta(s, b.id).care ? 1 : 0) - (meta(s, a.id).care ? 1 : 0))[0];
    if (nurse) plan.role[nurse.id] = "nurse";
    const forager = s.food < alive(s).length * 2 && ad.filter((p) => !plan.role[p.id] && p.hp === 0).sort((a, b) => b.stats.wits - a.stats.wits)[0];
    if (forager) plan.role[forager.id] = "forage";
    for (const p of ad) if (!plan.role[p.id]) plan.role[p.id] = "rest";
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
    if (s.plan.send.includes(id)) {
      s.plan.send = s.plan.send.filter((x) => x !== id);
      s.plan.role[id] = "rest";
      for (const [u, who] of Object.entries(s.plan.carry)) if (who === id) delete s.plan.carry[u];
    } else if (s.plan.send.length >= 2) return "최대 두 명까지 보낼 수 있습니다.";
    else {
      if (s.plan.scout === id) s.plan.scout = null;
      delete s.plan.role[id];
      s.plan.send.push(id);
      autoCarry(s);
      fixRoles(s);
    }
  });
  // 보낸 사람에게 아직 아무도 안 든 장비를 하나씩 들려 준다(한 사람 최대 2개)
  function autoCarry(s) {
    for (const id of s.plan.send) {
      const mine = () => Object.values(s.plan.carry).filter((x) => x === id).length;
      for (const g of s.gear) if (!s.plan.carry[g.uid] && mine() < 1) s.plan.carry[g.uid] = id;
    }
  }
  const toggleCarry = (state, uid, id) => evening(state, (s) => {
    const g = s.gear.find((x) => x.uid === Number(uid));
    if (!g) return "없는 장비입니다.";
    if (s.plan.carry[g.uid] === id) { delete s.plan.carry[g.uid]; return; }
    if (!s.plan.send.includes(id)) return "밤에 나가는 사람만 들 수 있습니다.";
    if (Object.values(s.plan.carry).filter((x) => x === id).length >= 2) return "한 사람은 두 개까지 들 수 있습니다.";
    s.plan.carry[g.uid] = id;
  });
  const toggleScout = (state, id) => evening(state, (s) => {
    const p = byId(s, id);
    if (!p || !canGo(s, p)) return "지금 정찰 보낼 수 없는 사람입니다.";
    if (s.plan.scout === id) { s.plan.scout = null; s.plan.role[id] = "rest"; return; }
    if (s.plan.send.includes(id)) return "탐색에 나가는 사람입니다.";
    if (s.plan.scout) s.plan.role[s.plan.scout] = "rest";
    s.plan.scout = id;
    delete s.plan.role[id];
    fixRoles(s);
  });
  // 경계가 빠지면 남은 사람 중 가장 힘센 사람이 이어받는다
  function fixRoles(s) {
    const ad = alive(s).filter((p) => home(s, p) && !p.child && !p.broken && !s.plan.send.includes(p.id) && s.plan.scout !== p.id);
    if (ad.length && !ad.some((p) => s.plan.role[p.id] === "guard")) s.plan.role[ad.slice().sort((a, b) => b.stats.force - a.stats.force)[0].id] = "guard";
    const sick = alive(s).some((p) => p.hp >= 1 && !s.plan.send.includes(p.id));
    const free = ad.filter((p) => s.plan.role[p.id] !== "guard");
    if (s.food < alive(s).length * 2 && !ad.some((p) => s.plan.role[p.id] === "forage")) { const f = ad.filter((p) => s.plan.role[p.id] === "rest" && p.hp === 0).sort((a, b) => b.stats.wits - a.stats.wits)[0]; if (f) s.plan.role[f.id] = "forage"; }
    if (sick && free.length && !ad.some((p) => s.plan.role[p.id] === "nurse")) s.plan.role[free.sort((a, b) => (meta(s, b.id).care ? 1 : 0) - (meta(s, a.id).care ? 1 : 0))[0].id] = "nurse";
  }
  // 오늘 밤 맡길 일: explore(탐색) · scout(정찰) · guard · nurse · forage · fix · rest
  function setRole(state, id, role) {
    const p = byId(state, id);
    if (!p || !home(state, p) || p.child) return { state, error: "일을 맡길 수 없는 사람입니다." };
    const cur = state.plan.send.includes(id) ? "explore" : state.plan.scout === id ? "scout" : state.plan.role[id] || "rest";
    if (cur === role) return { state };
    let st = state;
    if (cur === "explore") st = toggleSend(st, id).state;
    if (cur === "scout") st = toggleScout(st, id).state;
    if (role === "explore") return toggleSend(st, id);
    if (role === "scout") return toggleScout(st, id);
    if (!ROLES[role]) return { state, error: "알 수 없는 일입니다." };
    if (p.broken && role !== "rest") return { state, error: `${p.name}은(는) 무너져 아무것도 못 한다.` };
    return evening(st, (s) => { s.plan.role[id] = role; });
  }
  const recipesFor = (s) => N.recipes.filter((r) => !r.scen || r.scen === s.scenario).filter((r) => !(r.make.prog && (!s.story || s.story.prog[r.make.prog])));
  function recipeOk(s, id) {
    const r = recipesFor(s).find((x) => x.id === id);
    return !!r && (s.parts || 0) >= r.parts && (!r.wood || s.wood >= r.wood) && (!r.make.refill || true);
  }
  const setCraft = (state, id) => evening(state, (s) => {
    if (s.plan.craft === id) { s.plan.craft = null; return; }
    const r = recipesFor(s).find((x) => x.id === id);
    if (!r) return "만들 수 없는 것입니다.";
    if (!recipeOk(s, id)) return `부품이 모자랍니다 (${r.parts}개 필요).`;
    s.plan.craft = id;
    if (!alive(s).some((p) => roleOf(s, p.id) === "fix")) {
      const c = alive(s).filter((p) => home(s, p) && !p.child && !p.broken && !s.plan.send.includes(p.id) && s.plan.scout !== p.id && s.plan.role[p.id] !== "guard").sort((a, b) => b.stats.craft - a.stats.craft)[0];
      if (c) s.plan.role[c.id] = "fix";
    }
  });
  // 장비가 어디서 나오는지
  function gearWhere(s, k) {
    const where = Object.entries(N.placeGear[s.scenario] || {}).filter(([, ks]) => ks.includes(k)).map(([loc]) => scen(s).places[loc]?.name).filter(Boolean);
    const r = recipesFor(s).find((x) => x.make.gear === k);
    return [where.length ? `${where.join("·")}에서 나온다` : "", r ? `부품 ${r.parts}개로 만들 수 있다` : ""].filter(Boolean).join(" · ");
  }
  const roleOf = (s, id) => (!s.plan ? null : s.plan.send.includes(id) ? "explore" : s.plan.scout === id ? "scout" : s.plan.role[id] || "rest");
  const setPlace = (state, loc) => evening(state, (s) => {
    if (!scen(s).places[loc]) return "알 수 없는 장소입니다.";
    s.plan.place = s.plan.place === loc ? null : loc;
  });
  // 밤이 된다: 배급·약·휴식·경계·난방을 처리하고 탐색 또는 새벽으로
  function nightfall(state) {
    if (state.phase !== "evening") return { state, error: "지금은 저녁이 아닙니다." };
    if (state.plan.send.length && !state.plan.place && !isFinaleNight(state)) return { state, error: "어디로 보낼지 고르세요." };
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
    const stay = here.filter((p) => !p.child && !plan.send.includes(p.id) && plan.scout !== p.id);
    const R = (p) => (p.broken ? "rest" : plan.role[p.id] || "rest");
    const by = (r) => stay.filter((p) => R(p) === r);
    for (const p of stay) {
      const rest = R(p) === "rest";
      p.stress = clamp(p.stress - (rest ? 22 : 10), 0, 100);
      if (p.hp === 1 && !p.medToday && rnd(s) < (rest ? 0.55 : 0.3)) { p.hp = 0; lines.push(`${p.name}의 상처가 아물었다.`); }
      else if (p.hp === 2 && !p.medToday && rest && rnd(s) < 0.25) { p.hp = 1; p.medToday = true; lines.push(`${p.name}이(가) 푹 쉬고 나서 한결 나아졌다.`); }
    }
    // 간호: 맡은 사람이 환자 하나를 돌본다(간호 경험자는 확실히)
    const patients = () => alive(s).filter((p) => p.hp >= 1 && !p.medToday && !(p.isolated > 0)).sort((a, b) => b.hp - a.hp);
    for (const p of alive(s)) if (p.isolated > 0) p.isolated -= 1;
    for (const c of by("nurse")) {
      const n = meta(s, c.id).care ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const pt = patients().find((p) => p !== c);
        if (!pt) { if (!k) lines.push(`${c.name}은(는) 돌볼 환자가 없어 쉬었다.`); break; }
        if (meta(s, c.id).care || rnd(s) < 0.8) {
          pt.hp -= 1;
          pt.medToday = true;
          lines.push(`🩹 ${c.name}이(가) 밤새 ${pt.name}을(를) 간호했다 (${D.hpNames[pt.hp]}).`);
        } else { pt.medToday = true; lines.push(`🩹 ${c.name}이(가) 밤새 ${pt.name} 곁을 지켰다. 차도는 없지만 고비는 넘겼다.`); }
      }
    }
    for (const c of by("rest")) {
      const pt = patients().find((p) => p !== c);
      if (pt && rnd(s) < 0.25) { pt.hp -= 1; pt.medToday = true; lines.push(`${c.name}이(가) 쉬다 말고 ${pt.name}을(를) 돌봤다 (${D.hpNames[pt.hp]}).`); }
    }
    for (const f of by("forage")) {
      const trap = s.gear.some((g) => G(g.k).forage && !plan.send.includes(plan.carry[g.uid]));
      const r = d20(s) + f.stats.wits + (trap ? 3 : 0);
      if (r >= 11) { const n = r >= 17 ? 2 : 1; s.food += n; lines.push(`🎣 ${f.name}이(가) ${scen(s).homeFind}. (${w.food} +${n})`); }
      else { f.stress = clamp(f.stress + 5, 0, 100); lines.push(`🎣 ${f.name}은(는) 밤새 허탕을 쳤다.`); }
      if (s.scenario === "iceage" && !s.gear.some((g) => G(g.k).warm && !plan.send.includes(plan.carry[g.uid])) && rnd(s) < 0.2) hurt(s, f, 1, "동상", notes);
    }
    if (!by("guard").length && rnd(s) < 0.45) {
      const lost = Math.ceil(s.food * 0.3);
      s.food -= lost;
      lines.push(`🕳 아무도 지키지 않은 ${w.shelter}에 도둑이 들었다. ${w.food} −${lost}.`);
    }
    let need = s.flags.stove && s.day % 2 === 0 ? 0 : 1;
    const rec = plan.craft && recipeOk(s, plan.craft);
    const crafter = by("fix").sort((a, b) => b.stats.craft - a.stats.craft)[0];
    if (rec && crafter) {
      const R = N.recipes.find((x) => x.id === plan.craft);
      if (d20(s) + crafter.stats.craft >= 8) {
        s.parts -= R.parts; if (R.wood) s.wood -= R.wood;
        if (R.make.meds) s.meds += R.make.meds;
        if (R.make.gear) addGear(s, R.make.gear);
        if (R.make.refill) { const l = s.gear.find((g) => g.k === R.make.refill); if (l) l.u += 3; else addGear(s, R.make.refill); }
        if (R.make.prog) storyOutcome(s, { prog: R.make.prog, jr: `${crafter.name}이(가) 부품을 모아 썰매를 짰다.` }, notes);
        lines.push(`🛠 ${crafter.name}이(가) 밤새 ${R.name}에 매달렸다. 완성했다.`);
      } else { s.parts -= Math.ceil(R.parts / 2); lines.push(`🛠 ${crafter.name}이(가) ${R.name}을(를) 하다 부품을 망가뜨렸다.`); }
      plan.craft = null;
    } else for (const f of by("fix")) if (need && d20(s) + f.stats.craft >= 10) { need = 0; lines.push(`🔧 ${f.name}이(가) 난로와 틈을 손봐 오늘 밤 ${w.wood}을(를) 아꼈다.`); }
    for (const p of alive(s)) p.busy = false;
    if (!need) {}
    else if (s.wood > 0) { s.wood -= 1; lines.push(`${w.wood} −1 (밤의 온기)`); }
    else {
      lines.push(`🥶 ${w.wood}이(가) 떨어져 밤새 떨었다.`);
      for (const p of alive(s)) p.stress = clamp(p.stress + 10, 0, 100);
      const coat = s.gear.find((g) => G(g.k).warm && !plan.send.includes(plan.carry[g.uid]));
      if (coat) lines.push(`${G(coat.k).icon}${G(coat.k).name}을(를) 돌려 덮으며 버텼다.`);
      else if (rnd(s) < 0.3) hurt(s, pick(s, alive(s)), 1, "추위", notes);
    }
    if (plan.scout) scout(s, byId(s, plan.scout), lines, notes);
    s.dayLines = [...lines, ...notes];
    if (isFinaleNight(s)) return startFinale(s);
    for (const g of s.gear) g.with = plan.send.includes(plan.carry[g.uid]) ? plan.carry[g.uid] : null;
    if (plan.send.length) {
      const pl = scen(s).places[plan.place];
      s.exp = { loc: plan.place, party: plan.send.slice(), step: 0, loot: { food: 0, wood: 0, meds: 0, hope: 0, parts: 0 }, scene: null, result: null, story: [], noise: pl.danger - 1, chased: false, isChase: false, truth: null, p1: null, refuse: null, scan: null };
      if (s.scouted && s.day - (s.scouted[plan.place] ?? -9) <= 2) { s.exp.knowWay = true; s.exp.noise = 0; }
      const gg = findGear(s, (d) => d.scan);
      if (gg) s.exp.scan = `${G(gg.k).icon} 계수기가 가리킨다: 남은 것 ${lvl(s.stock[plan.place])}`;
      for (const id of plan.send) byId(s, id).stress = clamp(byId(s, id).stress + 5, 0, 100);
      drawScene(s);
      s.phase = "exp";
      return { state: s };
    }
    s.dayLines.push("밤에는 아무도 나가지 않았다.");
    return dawn(s);
  }
  // ── 밤 탐색 ──
  function scout(s, p, lines, notes) {
    const keys = Object.keys(scen(s).places).sort((a, b) => (s.known[a]?.day || 0) - (s.known[b]?.day || 0));
    if (d20(s) + p.stats.wits >= 11) {
      const seen = keys.slice(0, 2);
      const SIGNS = ["발자국이 어지럽다. 누가 다녀갔다", "조용하다. 아무도 없다", "불 피운 흔적이 아직 따뜻하다", "입구가 무너져 돌아가야 한다"];
      for (const k of seen) { s.known[k] = { day: s.day, lvl: lvl(s.stock[k]), sign: pick(s, SIGNS) }; if (s.scouted) s.scouted[k] = s.day; }
      lines.push(`👁 ${p.name}이(가) 몰래 둘러보고 왔다: ${seen.map((k) => `${scen(s).places[k].name} — 남은 것 ${s.known[k].lvl}, ${s.known[k].sign}`).join(" / ")}. 내일 밤 그곳에 가면 길을 안다.`);
    } else {
      p.stress = clamp(p.stress + 10, 0, 100);
      lines.push(`👁 ${p.name}의 정찰은 허탕이었다. 쫓기듯 돌아왔다.`);
      if (rnd(s) < 0.25) hurt(s, p, 1, "정찰 중 사고", notes);
    }
  }
  // 장면 모음: 시나리오 기본 + 재난별 추가 + 공통. 추격·다시 찾은 곳은 따로
  const CACHE = {};
  function allScenes(s) {
    if (!CACHE[s.scenario]) CACHE[s.scenario] = [...scen(s).scenes, ...(N.extra[s.scenario] || []), ...N.common].map((x) => ({ kind: "search", ...x }));
    return CACHE[s.scenario];
  }
  const storyScenes = (s) => (story(s) ? [...story(s).scenes, ...story(s).finale.scenes] : []);
  const sceneById = (s, id) => allScenes(s).find((x) => x.id === id) || storyScenes(s).find((x) => x.id === id) || N.chase.find((x) => x.id === id) || N.revisit.find((x) => x.id === id);
  function setScene(s, sc) {
    const e = s.exp;
    e.scene = sc ? sc.id : null;
    e.truth = sc?.truths ? Math.floor(rnd(s) * sc.truths.length) : null;
    const party = e.party.filter((id) => byId(s, id).alive);
    e.p1 = party.length ? party[Math.floor(rnd(s) * party.length)] : null;
    if (sc && !["*chase", "*revisit"].includes(sc.loc) && !sc.story) s.used[sc.id] = true;
  }
  function drawScene(s) {
    if (s.exp.finale) { const id = s.exp.queue.shift(); setScene(s, id ? sceneById(s, id) : null); return; }
    const e = s.exp, sc = allScenes(s), n = e.party.filter((id) => byId(s, id).alive).length;
    const ok = (x) => !s.used[x.id] && (!x.minParty || n >= x.minParty) && (!x.after || s.used[x.after]);
    // 이야기 장면은 그 장소의 첫 장면으로 먼저 나온다(이미 이룬 목표는 건너뜀)
    const st = story(s) ? story(s).scenes.filter((x) => x.loc === e.loc && !s.used[x.id] && !(x.id === "s_sled" && s.story.prog.sled) && !(x.id !== "s_sled" && s.story.rail)) : [];
    const fresh = st.filter((x) => s.day - (s.story.tried?.[x.id] ?? -9) >= 2);
    if (e.step === 0 && fresh.length) { s.story.tried = { ...(s.story.tried || {}), [fresh[0].id]: s.day }; setScene(s, fresh[0]); return; }
    let pool = sc.filter((x) => x.loc === e.loc && ok(x));
    if (e.step >= 1 && rnd(s) < 0.35) pool = sc.filter((x) => x.loc === null && ok(x));
    if (!pool.length) pool = sc.filter((x) => x.loc === null && ok(x));
    if (!pool.length || (e.loc && !sc.some((x) => x.loc === e.loc && ok(x)) && rnd(s) < 0.6)) {
      const rv = N.revisit.filter((x) => !e.story.some((y) => y.scene === x.id));
      if (rv.length) pool = rv;
    }
    setScene(s, pool.length ? pick(s, pool) : null);
  }
  function drawChase(s) {
    const pool = N.chase.filter((x) => !s.used[x.id]);
    setScene(s, pick(s, pool.length ? pool : N.chase));
    s.exp.isChase = true;
  }
  const fillScene = (s, text) => {
    const w = W(s), p1 = s.exp?.p1 ? byId(s, s.exp.p1).name : "동료";
    const st = s.story;
    const route = st ? (st.rail ? "노선도대로 남동쪽으로 간다. 길은 안다." : "선로가 어디인지 모른다. 남쪽이라는 것만 안다.") + (st.heavy && !st.prog.sled ? " 걷지 못하는 사람을 번갈아 업었다. 걸음이 느리다." : "") : "";
    const boy = s.flags.boyWolf ? "늑대단 사이에 그 소년이 있다. 당신을 보고 있다." : "";
    return String(text ?? "").replaceAll("{route}", route).replaceAll("{boy}", boy).replaceAll("{p1}", p1).replaceAll("{food}", w.food).replaceAll("{wood}", w.wood).replaceAll("{meds}", w.meds).replaceAll("{rival}", w.rival).replaceAll("{shelter}", w.shelter);
  };
  // 조건 선택지: 장비·동행·능력치가 있어야 고를 수 있다
  function reqState(s, req) {
    if (!req) return { ok: true, tag: "" };
    const party = s.exp ? s.exp.party.map((id) => byId(s, id)).filter((p) => p.alive) : [];
    if (req.gear) { const wh = gearWhere(s, req.gear); return { ok: hasTool(s, req.gear), tag: G(req.gear).name, why: `${G(req.gear).name}이(가) 없다${wh ? ` — ${wh}` : ""}` }; }
    if (req.with) { const m = meta(s, req.with); return { ok: party.some((p) => p.id === req.with), tag: `${m.name || req.with}와(과) 함께`, why: `${m.name || "그 사람"}이(가) 함께 오지 않았다` }; }
    if (req.stat) return { ok: party.some((p) => p.stats[req.stat] >= req.min), tag: `${D.stats[req.stat].name} ${req.min}`, why: `${D.stats[req.stat].name} ${req.min} 이상인 사람이 없다` };
    return { ok: true, tag: "" };
  }
  // 이 장면에서 고를 수 있는 것: 장면의 선택지 + (조우·추격에서 총이 있으면) 쏜다
  function approachesOf(s, sc) {
    const list = sc.approaches.slice();
    const gun = ["meet", "chase"].includes(sc.kind) && findGear(s, (d) => d.gun);
    if (gun) {
      const base = sc.approaches.find((a) => a.stat === "force" && !a.auto && a.win) || { win: { text: "" } };
      list.push({ label: `${G(gun.k).icon} ${G(gun.k).name}을(를) 쏜다`, stat: "force", dc: 0, auto: true, gun: true, noise: 5,
        win: { ...(base.win || {}), stress: 10, text: `총성이 울렸다. 그리고 조용해졌다. ${base.win?.text || ""}`.trim() } });
    }
    return list;
  }
  // 정체를 모르는 장면은 몰래 정해진 진실에 따라 결과가 달라진다
  function outcomeOf(s, sc, i, a) {
    const t = sc.truths && s.exp.truth !== null ? sc.truths[s.exp.truth] : null;
    const o = t && t.by[i] ? t.by[i] : { win: a.win, lose: a.lose };
    return { win: o.win || a.win || { text: "" }, lose: o.lose || o.win || a.lose || a.win || { text: "" }, reveal: t ? t.reveal : null };
  }
  // 세상은 날이 갈수록 험해지고, 같은 곳은 갈수록 빈다
  const harsh = (s) => Math.floor((s.day - 1) / 4);
  function approach(s, a) {
    const party = s.exp.party.map((id) => byId(s, id)).filter((p) => p.alive);
    const roller = party.slice().sort((x, y) => y.stats[a.stat] - x.stats[a.stat])[0];
    const parts = [[`${roller.name} ${D.stats[a.stat].icon}${D.stats[a.stat].name}`, roller.stats[a.stat]]];
    if (party.length > 1) parts.push(["동행", 1]);
    if (a.tool && hasTool(s, a.tool)) parts.push([G(a.tool).name, 2]);
    const sc = s.exp.scene ? sceneById(s, s.exp.scene) : null;
    const tg = sc && findGear(s, (d) => d.tag && d.tag === sc.kind);
    if (tg && !(a.tool && hasTool(s, a.tool))) parts.push([G(tg.k).name, 2]);
    const wg = a.stat === "wits" && findGear(s, (d) => d.wits);
    if (wg) parts.push([G(wg.k).name, 1]);
    if (s.exp.knowWay && s.exp.step === 0) parts.push(["정찰로 길을 앎", 2]);
    if (roller.hp === 1) parts.push(["부상", -1]);
    if (roller.hunger >= 1) parts.push([D.hungerNames[roller.hunger], -roller.hunger]);
    if (roller.traits.includes("겁쟁이")) parts.push(["겁쟁이", -2]);
    if (roller.stress >= 70) parts.push(["지침", -1]);
    const mod = parts.reduce((n, [, v]) => n + v, 0);
    let dc = a.dc + (placeOf(s, s.exp.loc).danger - 1) + s.exp.step + harsh(s);
    if (s.exp.finale) { dc = a.dc + harsh(s) + (s.story.heavy && !s.story.prog.sled ? 2 : 0) + (s.exp.scene === "f_cross" && !s.story.rail ? 3 : 0); }
    const p = clamp((21 - (dc - mod)) / 20, 0.05, 0.95);
    if (a.auto) return { roller: roller.id, rollerName: roller.name, mod: 0, parts: [], dc: 0, p: 1, auto: true, tool: null, hasTool: false };
    return { roller: roller.id, rollerName: roller.name, mod, parts, dc, p: Math.round(p * 100) / 100, tool: a.tool || null, hasTool: hasTool(s, a.tool) };
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
    if (o.tool || o.gear) out.push(`${G(o.tool || o.gear).icon}${G(o.tool || o.gear).name}`);
    if (o.radio) out.push(`${w.goal} 앞당김`);
    if (o.forecast) out.push(`${w.threat} 하루 늦춤`);
    if (o.rivalAlert) out.push(`${w.rival}이(가) 눈치챔`);
    return out.join(" · ");
  }
  function sceneView(s) {
    if (!s.exp || !s.exp.scene) return null;
    const e = s.exp, sc = sceneById(s, e.scene), party = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    const hinter = party.slice().sort((a, b) => b.stats.wits - a.stats.wits)[0];
    const sharp = hinter && hinter.stats.wits + (findGear(s, (d) => d.wits) ? 1 : 0) >= 3 ? hinter : null;
    const hz = N.placeHazard[s.scenario]?.[e.loc], guarded = hz && findGear(s, (d) => d.guard === hz);
    const approaches = approachesOf(s, sc).map((a, i) => {
      const info = approach(s, a), o = outcomeOf(s, sc, i, a);
      const rq = reqState(s, a.req);
      return { i, label: fillScene(s, a.label).replace(/^\[[^\]]+\]\s*/, ""), tag: rq.tag, locked: rq.ok ? "" : rq.why, stat: a.stat, ...info, feel: feelOf(info), hint: sharp ? hintOf(o, info) : "", win: describe(s, o.win), lose: describe(s, o.lose) };
    });
    // 함께 간 사람의 한마디
    const voice = TEXT[s.scenario]?.voice, sp = e.p1 ? byId(s, e.p1) : null;
    const vk = sp && (sp.leader && sp.id === "leader" ? "leader" : sp.id);
    const say = voice && sp && voice[vk]?.[sc.kind] ? { id: sp.id, name: sp.name, text: voice[vk][sc.kind] } : null;
    return { id: sc.id, kind: sc.kind, kindName: N.KINDS[sc.kind] || "탐색", text: fillScene(s, sc.text), loc: e.loc, place: placeOf(s, e.loc), step: e.step, finale: !!e.finale, harsh: harsh(s),
      noise: e.noise, noiseMax: NOISE_MAX, chase: e.isChase, scan: e.scan, say, hazard: hz && !guarded ? N.hazards[hz] : null, hinter: sharp ? sharp.name : null, approaches };
  }
  function feelOf(info) {
    if (info.auto) return "확실하다";
    return info.p >= 0.75 ? "해볼 만하다" : info.p >= 0.55 ? "반반이다" : info.p >= 0.35 ? "위험하다" : "무모하다";
  }
  // 눈치 빠른 동행의 귀띔: 실패하면 무엇을 잃는지 한마디로
  function hintOf(o, info) {
    if (info.auto) return "";
    const L = o.lose || {};
    if ((L.harm || 0) >= 2) return "“이건 진짜 죽을 수도 있어.”";
    if (L.harm) return "“잘못되면 다쳐.”";
    if (L.rivalAlert) return "“들키면 끝이야.”";
    if (L.lose) return "“잘못하면 짐을 다 잃어.”";
    if (L.stress >= 15) return "“…안 보는 게 나을 거야.”";
    if (L.loot && Object.values(L.loot).some((v) => v < 0)) return "“우리 것도 내줘야 할 거야.”";
    return "“실패해도 잃을 건 없어.”";
  }
  function hurt(s, p, n, cause, notes) {
    if (!n || !p || !p.alive) return;
    p.hp = Math.min(4, p.hp + n);
    if (p.hp >= 4) die(s, p, cause, notes);
    else notes.push(`${p.name}: ${D.hpNames[p.hp]}`);
  }
  function lastWords(s, p) {
    if (p.leader && p.id === "leader") return "다들… 미안해. 끝까지 같이 못 가서. 꼭… 살아.";
    return meta(s, p.id).last || "…가지 마. 아직… 할 말이…";
  }
  function reactions(s, dead, cause) {
    const out = [];
    const pool = alive(s).filter((q) => q !== dead).slice().sort(() => rnd(s) - 0.5).slice(0, 2);
    for (const q of pool) {
      let t;
      if (q.child) t = `${q.name}이(가) 이해하지 못하고 계속 ${dead.name}을(를) 부른다.`;
      else if (q.traits.includes("냉혈한")) t = `${q.name}은(는) 아무 말 없이 ${dead.name}의 신발을 벗겨 챙겼다.`;
      else if (/밤 탐색|홀로/.test(cause) && rnd(s) < 0.5) t = `${q.name}이(가) 당신을 노려봤다. “당신이 보냈잖아.”`;
      else if (q.stress >= 70) t = `${q.name}이(가) 벽을 치며 울었다.`;
      else t = pick(s, [`${q.name}이(가) ${dead.name}의 눈을 감겨 주었다.`, `${q.name}이(가) 끝내 울음을 터뜨렸다.`, `${q.name}이(가) ${dead.name}의 손을 오래 잡고 있었다.`]);
      out.push({ id: q.id, text: t });
      q.grief = dead.name;
      q.griefDay = s.day;
    }
    return out;
  }
  function die(s, p, cause, notes) {
    p.alive = false;
    p.hp = 4;
    const m = meta(s, p.id);
    const lost = m.care ? "이제 다친 사람을 제대로 돌볼 사람이 없다." : m.cook ? "이제 한 줌으로 여럿을 먹이던 손이 없다." : m.radio ? "무전기는 이제 아무도 켜지 않는다." : p.leader ? "모두가 다음 대표를 바라본다." : "";
    const dd = { id: p.id, name: p.name, cause, last: lastWords(s, p), reactions: reactions(s, p, cause), lost };
    s.deaths.push(dd);
    if (s.chronicle) s.chronicle.push({ day: s.day, title: `🕯 ${p.name}`, paras: [`“${dd.last}”`, ...dd.reactions.map((x) => x.text)] });
    s.memorial.push({ id: p.id, name: p.name, day: s.day, cause });
    jr(s, `${p.name}이(가) 죽었다 (${cause}).`, 3);
    for (const g of s.gear.filter((x) => x.with === p.id)) dropGear(s, g, `${p.name}와(과) 함께 잃었다.`, notes);
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
    if (rnd(s) < 0.4) { const ks = Object.keys(N.gear).filter((k) => !G(k).scen || G(k).scen === s.scenario); addGear(s, pick(s, ks), notes); }
  }
  function gainXp(s, p, stat, notes) {
    p.xp[stat] = (p.xp[stat] || 0) + 1;
    if (p.xp[stat] >= 3 && p.stats[stat] < 5) {
      p.xp[stat] = 0;
      p.stats[stat] += 1;
      notes.push(`⬆ ${p.name}의 ${D.stats[stat].name}이(가) ${p.stats[stat]}이(가) 되었다.`);
    }
  }
  // 기척: 소리가 쌓이면 징조가 보이고, 움직일 때 들킬 확률이 생긴다(무조건 들키지 않는다)
  const STAGES = ["고요", "어딘가 기척", "무언가 귀를 기울인다", "들킬 것 같다"];
  const stageOf = (n) => (n >= 9 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0);
  const caughtChance = (n) => Math.max(0, Math.min(1, (n - 5) * 0.2));
  const SIGNS = ["멀리서 들리던 발소리가 멈췄다.", "어둠 저편에서 무언가 킁킁거린다.", "머리 위에서 먼지가 떨어진다. 무언가 걷고 있다.", "개 한 마리가 짖다가, 뚝 그쳤다.", "등 뒤의 공기가 달라졌다."];
  function noiseWarn(s, before, notes) {
    const e = s.exp, a = stageOf(before), b = stageOf(e.noise);
    if (b > a && b >= 1) notes.push(`${pick(s, SIGNS)} (${STAGES[b]})`);
  }
  function storyOutcome(s, o, notes) {
    if (!s.story || !o) return;
    const st = s.story, def = story(s);
    if (o.clue) {
      st.clues += o.clue;
      if (!st.rail && st.clues >= def.clueNeed) { st.rail = true; notes.push("🗺 선로가 어디 있는지 알아냈다!"); jr(s, "선로가 어디 있는지 알아냈다.", 2); }
      else if (!st.rail) notes.push(`🗺 선로 단서를 얻었다 (${st.clues}/${def.clueNeed}).`);
    }
    if (o.prog && !st.prog[o.prog]) { st.prog[o.prog] = true; notes.push(o.prog === "sled" ? "🛷 썰매가 생겼다! 이제 걷지 못하는 사람도 데려갈 수 있다." : `✔ ${o.prog}`); }
    if (o.cb) st.cbs.push({ id: o.cb, day: s.day + 2 + Math.floor(rnd(s) * 2) });
    if (o.jr) jr(s, o.jr, 2);
  }
  // 장면이 끝난 뒤 주변을 더 뒤진다: 장비나 물자를 주울 수 있지만 소리가 난다
  function rummage(state) {
    const e0 = state.exp;
    if (state.phase !== "exp" || !e0?.result || e0.result.rummaged || e0.isChase || e0.finale) return { state, error: "지금은 뒤질 수 없습니다." };
    const s = clone(state), e = s.exp, notes = e.result.notes;
    const live = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    if (!live.length) return { state, error: "뒤질 사람이 없습니다." };
    const f = live.slice().sort((a, b) => b.stats.wits - a.stats.wits)[0];
    const r = d20(s) + f.stats.wits + (findGear(s, (d) => d.wits) ? 1 : 0);
    e.result.rummaged = true;
    const nb = e.noise;
    e.noise += 2;
    const st = s.stock[e.loc];
    const res = st ? RES.filter((k) => st[k] > 0) : [];
    const table = (N.placeGear[s.scenario]?.[e.loc] || []).filter((k) => s.gear.filter((g) => g.k === k).length < 1);
    e.foundHere = e.foundHere || 0;
    if (r >= 14 && table.length && e.foundHere < 1 && rnd(s) < 0.65) {
      const k = pick(s, table);
      e.foundHere += 1;
      s.gear.push({ uid: s.uid++, k, u: G(k).uses || 0, with: f.id });
      e.result.find = { k, who: f.name, text: pick(s, [`얼어붙은 손으로 무언가를 당겨 냈다. ${G(k).name}이다.`, `잔해 밑, 천에 싸인 꾸러미. 풀어 보니 ${G(k).name}.`, `누군가 숨겨 둔 자리였다. ${G(k).name}이(가) 그대로 있었다.`]) };
      notes.push(`${f.name}이(가) ${G(k).name}을(를) 찾아 챙겼다.`);
    } else if (r >= 8) {
      const p = r >= 14 ? 2 : 1;
      e.loot.parts += p;
      let extra = "";
      if (res.length && rnd(s) < 0.5) { const k = pick(s, res), got = Math.min(st[k], 1); st[k] -= got; e.loot[k] += got; extra = ` ${W(s)[k]} ${got}도.`; }
      notes.push(`${f.name}이(가) 잔해 사이에서 쓸 만한 부품 ${p}개를 챙겼다.${extra}`);
    } else {
      notes.push(`${f.name}이(가) 어둠 속을 더듬었지만 아무것도 없었다.`);
      if (rnd(s) < 0.3) hurt(s, f, 1, "어둠 속을 뒤지다", notes);
    }
    noiseWarn(s, nb, notes);
    return { state: s };
  }
  // 숨죽이고 기다린다: 기척이 가라앉지만 춥고 무섭다
  function hush(state) {
    const e0 = state.exp;
    if (state.phase !== "exp" || !e0?.result || e0.result.hushed || e0.isChase || e0.finale || e0.noise < 4) return { state, error: "지금은 기다릴 필요가 없습니다." };
    const s = clone(state), e = s.exp, notes = e.result.notes;
    e.result.hushed = true;
    e.noise = Math.max(0, e.noise - 4);
    for (const id of e.party) { const p = byId(s, id); if (p.alive) p.stress = clamp(p.stress + 6, 0, 100); }
    notes.push(`숨을 죽이고 오래 기다렸다. 심장 소리만 들렸다. 기척이 가라앉았다. (${STAGES[stageOf(e.noise)]})`);
    const hz = N.placeHazard[s.scenario]?.[e.loc];
    if ((hz === "cold" || s.scenario === "iceage") && !findGear(s, (d) => d.guard === "cold") && rnd(s) < 0.2) {
      const live = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
      if (live.length) hurt(s, pick(s, live), 1, "동상", notes);
    }
    return { state: s };
  }
  function choose(state, index) {
    if (state.phase !== "exp" || !state.exp?.scene || state.exp.result) return { state, error: "고를 장면이 없습니다." };
    const sc0 = sceneById(state, state.exp.scene), a0 = approachesOf(state, sc0)[index];
    if (!a0) return { state, error: "알 수 없는 선택입니다." };
    const rq0 = reqState(state, a0.req);
    if (!rq0.ok) return { state, error: rq0.why };
    const s = clone(state), e = s.exp, sc = sceneById(s, e.scene), a = approachesOf(s, sc)[index], info = approach(s, a), roller = byId(s, info.roller);
    const oc = outcomeOf(s, sc, index, a);
    const roll = a.auto ? 0 : d20(s), crit = roll === 20, fumble = roll === 1;
    const success = a.auto || crit || (!fumble && roll + info.mod >= info.dc);
    const o = success ? oc.win : oc.lose, notes = [];
    const carry = Math.max(1, ...carried(s).map((g) => G(g.k).carry || 1));
    let short = false;
    for (const [k, v] of Object.entries(o.loot || {})) {
      if (v > 0 && k !== "hope") {
        const want = Math.round(v * (crit ? 1.5 : 1) * carry), got = Math.min(want, s.stock[e.loc]?.[k] ?? want);
        if (s.stock[e.loc]) s.stock[e.loc][k] -= got;
        if (got < want) short = true;
        e.loot[k] += got;
      } else e.loot[k] += v;
    }
    if (o.lose) for (const k of [...RES, "parts"]) e.loot[k] = Math.floor(e.loot[k] * (1 - o.lose));
    if (success && !a.auto && ["search", "trap", "revisit"].includes(sc.kind) && rnd(s) < 0.4) { e.loot.parts += 1; notes.push("쓸 만한 부품 하나를 주머니에 넣었다."); }
    let harm = (o.harm || 0) + (fumble ? 1 : 0);
    const kit = harm && findGear(s, (d) => d.armor);
    if (kit) { harm -= 1; kit.u -= 1; notes.push(`${G(kit.k).icon} ${G(kit.k).name}으로 상처를 막았다.`); if (kit.u <= 0) dropGear(s, kit, "다 썼다.", notes); }
    if (fumble && a.tool) { const t = findGear(s, (d, k) => k === a.tool || d.alias === a.tool); if (t) dropGear(s, t, "부러졌다.", notes); }
    if (a.gun) { const g = findGear(s, (d) => d.gun); g.u -= 1; if (g.u <= 0) dropGear(s, g, "총알이 떨어졌다.", notes); }
    hurt(s, roller, harm, "밤 탐색 중 사고", notes);
    if (o.stress) for (const id of e.party) { const p = byId(s, id); if (p.alive) p.stress = clamp(p.stress + (p.traits.includes("냉혈한") ? Math.round(o.stress / 2) : o.stress), 0, 100); }
    const p1 = e.p1 ? byId(s, e.p1) : null;
    if (p1 && p1.alive) {
      if (o.p1Stress) p1.stress = clamp(p1.stress + o.p1Stress, 0, 100);
      if (o.p1Harm) hurt(s, p1, o.p1Harm, "동료와의 다툼", notes);
      if (o.p1Home && e.party.length > 1) {
        e.party = e.party.filter((id) => id !== p1.id);
        for (const g of s.gear.filter((x) => x.with === p1.id)) g.with = null;
      }
    }
    if (o.join) joinStranger(s, notes);
    if (o.tool || o.gear) addGear(s, o.tool || o.gear, notes);
    if (o.radio) { s.rescueDay = Math.max(s.day + 2, s.rescueDay - 1); notes.push(`📻 ${W(s).goal}이(가) ${s.rescueDay}일에 온다!`); }
    if (o.forecast) { const t = nextThreat(s); if (t) t.day += 1; }
    if (o.ledger) s.flags.ledger = true;
    if (o.rivalAlert) s.rivalAlert += 1;
    storyOutcome(s, o, notes);
    const hook = story(s)?.sceneHooks?.[sc.id]?.[index];
    if (hook) storyOutcome(s, hook[success ? "win" : "lose"] || {}, notes);
    if (sc.story && success) s.used[sc.id] = true;
    if (o.lost && e.finale) s.story.lost += 1;
    if (roller.alive && !a.auto) gainXp(s, roller, a.stat, notes);
    // 소음: 행동마다 쌓이고 넘치면 '그것'이 온다
    const quiet = carried(s).some((g) => G(g.k).quiet) ? 1 : 0;
    const nb = e.noise;
    e.noise = Math.max(0, e.noise + (a.noise ?? NOISE[a.stat]) + (success ? 0 : 2) - quiet);
    if (!e.isChase && !e.finale) noiseWarn(s, nb, notes);
    if (e.isChase) e.noise = 2;
    // 장소 위험: 막는 장비가 없으면 누군가 다친다
    const hz = N.placeHazard[s.scenario]?.[e.loc];
    if (hz && !findGear(s, (d) => d.guard === hz) && rnd(s) < 0.3) {
      const live = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
      if (live.length) { const v = pick(s, live); notes.push(`${N.hazards[hz].icon} ${N.hazards[hz].text}`); hurt(s, v, 1, N.hazards[hz].hit, notes); }
    }
    // 더 들어가자고 하면 반대할 사람
    const scared = e.finale ? [] : e.party.map((id) => byId(s, id)).filter((p) => p.alive && (p.stress >= 60 || p.traits.includes("겁쟁이") || p.hp >= 1));
    e.refuse = scared.length && rnd(s) < 0.5 ? pick(s, scared).id : null;
    const text = (oc.reveal ? fillScene(s, oc.reveal) + " " : "") + (crit ? "대성공! " : fumble ? "대실패! " : "") + fillScene(s, o.text).replaceAll("{who}", roller.name) + (short ? " …그런데 남은 게 거의 없었다. 누군가 먼저 다녀갔다." : "");
    if (s.chronicle) s.chronicle.push({ day: s.day, title: `밤 · ${placeOf(s, e.loc).name}`, paras: [fillScene(s, sc.text), `“${fillScene(s, a.label).replace(/^\[[^\]]+\]\s*/, "")}” — ${text}`] });
    e.result = { approach: fillScene(s, a.label), roller: roller.name, stat: a.stat, auto: !!a.auto, roll, mod: info.mod, parts: info.parts, dc: info.dc, total: roll + info.mod, success, crit, fumble, text, notes };
    e.story.push({ scene: sc.id, success });
    return { state: s };
  }
  function proceed(state, deeper) {
    if (state.phase !== "exp" || !state.exp?.result) return { state, error: "결과를 먼저 확인하세요." };
    const s = clone(state), e = s.exp, w = W(s);
    const party = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    if (e.finale) {
      e.result = null;
      if (party.length && e.queue.length) { drawScene(s); return { state: s }; }
      return endFinale(s);
    }
    if (party.length && !e.chased && !e.isChase && rnd(s) < caughtChance(e.noise)) {
      e.chased = true;
      e.result = null;
      drawChase(s);
      return { state: s };
    }
    if (deeper && party.length && e.step < MAX_STEP && !e.isChase) {
      if (e.refuse && byId(s, e.refuse).alive) { const r = byId(s, e.refuse); r.stress = clamp(r.stress + 15, 0, 100); s.hope = clamp(s.hope - 2, 0, 100); }
      e.step += 1;
      e.noise += 1;
      e.result = null;
      drawScene(s);
      if (e.scene) return { state: s };
    }
    if (s.stock[e.loc]) s.known[e.loc] = { day: s.day, lvl: lvl(s.stock[e.loc]) };
    for (const g of carried(s)) if (G(g.k).uses && g.k === "lamp") { g.u -= 1; if (g.u <= 0) dropGear(s, g, "기름이 다 떨어졌다.", s.dayLines); }
    for (const g of s.gear) g.with = null;
    s.food = Math.max(0, s.food + e.loot.food);
    s.wood = Math.max(0, s.wood + e.loot.wood);
    s.meds = Math.max(0, s.meds + e.loot.meds);
    s.parts = Math.max(0, (s.parts || 0) + (e.loot.parts || 0));
    s.hope = clamp(s.hope + e.loot.hope, 0, 100);
    s.dayLines.push(`밤 탐색 (${placeOf(s, e.loc).name}): ${party.length ? "" : "아무도 돌아오지 못했다. "}${w.food} ${e.loot.food >= 0 ? "+" : ""}${e.loot.food} · ${w.wood} +${Math.max(0, e.loot.wood)} · ${w.meds} +${Math.max(0, e.loot.meds)}${e.loot.parts ? ` · 부품 +${e.loot.parts}` : ""}`);
    s.log.push({ day: s.day, text: `${e.party.map((id) => byId(s, id).name).join("·")}이(가) ${placeOf(s, e.loc).name}에 다녀왔다.` });
    s.exp = null;
    return dawn(s);
  }
  // 아침 보고를 짧은 장(章)으로: 날씨 + 그날 일어난 일을 문장으로 엮는다. 숫자는 변화 목록에 남긴다
  function narrate(s) {
    const r = s.report, w = W(s), out = [], tags = new Set();
    const wx = TEXT[s.scenario]?.weather;
    if (wx) out.push(wx[(s.day * 7 + s.rng) % wx.length]);
    const P = [
      [/^저녁: \d+명이 .+?먹었다 · (.+)은\(는\) 굶었다/, (m) => (tags.add("허기"), `${m[1]}의 그릇은 비어 있었다. 누구도 그 얘기를 꺼내지 않았다.`)],
      [/^저녁: \d+명이/, () => `저녁은 ${w.food} 한 그릇씩이었다. 숟가락 긁는 소리만 났다.`],
      [/^(.+)에게 .+을\(를\) 썼다/, (m) => `${m[1]}에게 ${w.meds}을(를) 먹였다. 남은 병을 다들 오래 쳐다봤다.`],
      [/^🩹 (.+)이\(가\) 밤새 (.+)을\(를\) 간호했다/, (m) => `${m[1]}이(가) 밤새 ${m[2]} 곁에 앉아 있었다. 새벽녘, ${m[2]}의 숨소리가 조금 고르게 바뀌었다.`],
      [/^🎣 (.+)이\(가\) .+\+\d/, (m) => `${m[1]}이(가) 밤새 밖에서 떨다 돌아왔다. 손에 먹을 것이 들려 있었다.`],
      [/^🎣 (.+)은\(는\) 밤새 허탕/, (m) => `${m[1]}은(는) 빈손으로 돌아와 아무 말 없이 난로 앞에 앉았다.`],
      [/^🛠 (.+)이\(가\) 밤새 (.+)에 매달렸다/, (m) => `${m[1]}이(가) 난로 불빛 아래서 밤새 ${m[2].replace(/ 기?$/, "")}에 매달렸다. 새벽녘, 무언가 하나가 완성되어 있었다.`],
      [/^⚠ (.+)이\(가\) 고비/, (m) => `${m[1]}의 숨이 얕고 빠르다. 오늘 밤이 고비다.`],
      [/^🔧 (.+)이\(가\)/, (m) => `${m[1]}이(가) 틈마다 헝겊을 쑤셔 넣고 연통을 손봤다. 불은 적게 먹고 오래 탔다.`],
      [/^🕳/, () => (tags.add("도둑"), `아침에 보니 창고 문이 열려 있었다. 지키는 사람이 없던 밤, 누군가 다녀갔다.`)],
      [/^🥶/, () => (tags.add("추위"), `${w.wood}이(가) 떨어졌다. 모두 한데 엉겨 서로의 숨으로 밤을 버텼다.`)],
      [/^👁 (.+)이\(가\) 몰래/, (m) => `${m[1]}이(가) 새벽에 돌아와 본 것을 털어놓았다.`],
      [/^👁 (.+)의 정찰은 허탕/, (m) => `${m[1]}은(는) 쫓기듯 돌아왔다. 아무것도 보지 못했다고 했다.`],
      [/^밤 탐색 \((.+)\): 아무도 돌아오지 못했다/, (m) => (tags.add("빈자리"), `${m[1]}에 간 사람들은 돌아오지 않았다. 문을 밤새 조금 열어 두었다.`)],
      [/^밤 탐색 \((.+)\)/, (m) => (tags.add("밤길"), `${m[1]}에서 돌아온 사람들의 눈썹에 서리가 하얗게 앉아 있었다.`)],
      [/^🤒 (.+)이\(가\) (심하게 )?앓기/, (m) => (tags.add("열"), `${m[1]}의 기침이 새벽까지 이어졌다. 이마가 불덩이 같았다.`)],
      [/^⛈ .*(버텼|지나갔|멈췄)/, () => (tags.add("폭풍"), `${w.threat}이(가) 왔다. 모두 벽에 등을 대고 버텼다. 그리고, 지나갔다.`)],
      [/^⛈/, () => (tags.add("폭풍"), `${w.threat}이(가) 덮쳤다. 아침에 보니 많은 것이 사라져 있었다.`)],
      [/^⚔ .+ (.+)이\(가\) .*막아 냈다/, (m) => (tags.add("습격"), `한밤중 문이 부서질 듯 흔들렸다. ${m[1]}이(가) 문에 등을 대고 끝까지 버텼다.`)],
      [/^⚔/, () => (tags.add("습격"), `${w.rival}이(가) 들이닥쳤다. 고함, 그리고 발소리. 그들이 떠난 뒤 창고가 비어 있었다.`)],
      [/^🕯 (.+)이\(가\) 죽었다/, (m) => (tags.add("빈자리"), `그리고 ${m[1]}은(는) 아침을 보지 못했다.`)],
      [/^(😨|🧊|💔) (.+?)(이\(가\)|의)/, (m) => `${m[2]}의 눈빛이 어딘가 달라졌다.`],
      [/^🧭 (.+)이\(가\) 신호/, (m) => `${m[1]}이(가) 남긴 신호가 닿았다. 처음으로 다들 웃었다.`],
    ];
    const seen = new Set();
    for (const l of r.lines) for (const [re, f] of P) { const m = l.match(re); if (m) { const t = f(m); if (!seen.has(t)) { seen.add(t); out.push(t); } break; } }
    const word = ["빈자리", "습격", "폭풍", "열", "허기", "도둑", "추위", "밤길"].find((t) => tags.has(t)) || "버팀";
    r.chapter = s.day === 1 ? r.title : `${s.day}일째 — ${word}`;
    r.tag = { 빈자리: "dawn_death", 습격: "dawn_raid", 폭풍: "dawn_storm", 열: "dawn_sick", 허기: "dawn_hunger", 도둑: "dawn_theft", 추위: "dawn_cold", 밤길: "dawn_return", 버팀: "dawn_quiet" }[word];
    r.prose = s.day === 1 ? null : out;
    if (s.chronicle && r.prose) s.chronicle.push({ day: s.day, title: r.chapter, paras: r.prose });
  }
  // ── 마지막 밤: 선로까지 ──
  const isFinaleNight = (s) => !!s.story && s.day >= s.rescueDay;
  function startFinale(s) {
    const def = story(s), st = s.story;
    const party = alive(s).filter((p) => home(s, p)).map((p) => p.id);
    s.gear.forEach((g, i) => { g.with = party[i % party.length] || null; });
    const wolf = st.rival === -1 ? null : s.flags.ally ? "f_wolf_ally" : s.flags.passage ? "f_wolf_pass" : "f_wolf_block";
    s.exp = { loc: "finale", finale: true, queue: ["f_cross", wolf, "f_train"].filter(Boolean), party, step: 0, loot: { food: 0, wood: 0, meds: 0, hope: 0, parts: 0 }, scene: null, result: null, story: [], noise: 0, chased: false, isChase: false, truth: null, p1: null, refuse: null, scan: null };
    if (!party.length) { s.exp = { finale: true, party: [] }; return endFinale(s); }
    s.dayLines.push(`🚂 ${def.finale.place.name}로 떠났다. ${party.map((id) => byId(s, id).name).join("·")}.`);
    drawScene(s);
    s.phase = "exp";
    return { state: s };
  }
  function endFinale(s) {
    const st = s.story, e = s.exp, boarded = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    s.exp = null;
    for (const g of s.gear) g.with = null;
    const missed = boarded.length && (st.lost >= 2 || (!st.rail && st.lost >= 1));
    const lines = s.dayLines.slice();
    if (missed) { s.ending = "missed"; lines.push("열차 불빛이 지평선 저편으로 멀어졌다."); jr(s, "열차를 놓쳤다.", 4); }
    else if (!boarded.length) s.ending = "lost";
    else {
      const ratio = boarded.length / s.total;
      s.ending = ratio >= 1 ? "all" : ratio >= 0.6 ? "most" : "few";
      lines.push(`열차에 오른 사람: ${boarded.map((p) => p.name).join(", ")}.`);
      const kid = s.people.find((p) => p.child);
      if (s.flags.promise && kid) jr(s, kid.alive && boarded.includes(kid) ? "눈이와의 약속을 지켰다." : "눈이와의 약속을 지키지 못했다.", 4);
    }
    s.report = { title: "마지막 밤", lines };
    if (s.chronicle) s.chronicle.push({ day: s.day, title: "마지막 밤", paras: lines.slice(-2) });
    s.phase = "end";
    s.event = null;
    return { state: s };
  }
  function advanceAct(s, notes) {
    const def = story(s), st = s.story;
    if (!def) return;
    let next = null;
    if (st.act === 1 && s.day >= def.acts[1].day) next = 2;
    else if (st.act === 2 && s.day >= s.rescueDay - def.acts[2].fromEnd) next = 3;
    if (!next) return;
    st.act = next;
    if (next === 2) s.rivalAlert += 1;
    if (next === 3 && s.flags.stash) s.food += 4;
    const a = def.acts[next - 1];
    s.card = { title: a.title, lines: def.actText[next](s), goal: a.goal };
  }
  // ── 새벽 ──
  function dawn(s) {
    const w = W(s), lines = s.dayLines.slice(), notes = [];
    for (const p of alive(s)) {
      if (p.hunger >= 2) p.stress = clamp(p.stress + 10, 0, 100);
      if (p.hunger >= 3) hurt(s, p, 1, "굶주림", notes);
    }
    const sick = 0.3 + (alive(s).some((p) => p.hunger >= 2) ? 0.1 : 0) + s.day * 0.01;
    if (rnd(s) < sick) {
      const v = pick(s, alive(s));
      if (v) { notes.push(`🤒 ${v.name}이(가) 앓기 시작했다.`); hurt(s, v, 1, "병", notes); }
    }
    // 상처: 위독해도 하루는 버틴다(고비). 고비를 치료 없이 넘기면 그때 죽을 수 있다
    const cold = s.wood <= 0;
    for (const p of alive(s)) {
      if (p.hp < 3) p.crit = 0;
      if (p.hp === 3 && !p.medToday) {
        p.crit = (p.crit || 0) + 1;
        if (p.crit >= 2 && rnd(s) < 0.8) die(s, p, "치료받지 못한 상처", notes);
        else notes.push(`⚠ ${p.name}이(가) 고비를 맞았다. 오늘 밤 치료하지 않으면 위험하다.`);
      } else if (p.hp === 2 && !p.medToday && (p.hunger >= 1 || cold) && rnd(s) < 0.25) hurt(s, p, 1, "상처 악화", notes);
    }
    const t = s.threats.find((x) => !x.done && x.day === s.day);
    if (t) {
      t.done = true;
      const stay = alive(s).filter((p) => home(s, p) && !p.child);
      const needW = t.need || 2;
      if (s.flags.braced || (s.wood >= needW && stay.length)) {
        const braced = s.flags.braced;
        if (!braced) s.wood -= needW;
        s.flags.braced = false;
        s.hope = clamp(s.hope + 4, 0, 100);
        lines.push(`⛈ ${w.threat}! ${scen(s).threatHeld}${braced ? "" : ` (${w.wood} −${needW})`}`);
      } else {
        const lf = Math.ceil(s.food * 0.4), lw = Math.ceil(s.wood * 0.3);
        s.food -= lf;
        s.wood -= lw;
        s.hope = clamp(s.hope - 8, 0, 100);
        lines.push(`⛈ ${w.threat}! ${scen(s).threatHit} ${w.food} −${lf} · ${w.wood} −${lw}.`);
        for (const p of alive(s).slice().sort(() => rnd(s) - 0.5).slice(0, 2)) hurt(s, p, 1, w.threat, notes);
      }
    }
    if (s.day % 4 === 0 || (s.story && s.story.stance < 0 && s.day % 3 === 0)) s.rivalAlert += 1; // 굶주린 라이벌은 점점 가까워진다
    if (s.story && (s.story.rival === -1 || s.flags.ally)) s.rivalAlert = 0;
    if (s.rivalAlert >= 2 && rnd(s) < 0.4 + s.day * 0.03) {
      s.rivalAlert = 0;
      const guard = alive(s).filter((p) => home(s, p) && !p.child && p.hp <= 1 && s.plan?.role?.[p.id] === "guard").sort((a, b) => b.stats.force - a.stats.force)[0];
      const gun = s.gear.find((g) => G(g.k).gun && g.u > 0);
      if (guard && d20(s) + guard.stats.force + (gun ? 3 : 0) >= 15) {
        if (gun) { gun.u -= 1; if (gun.u <= 0) dropGear(s, gun, "총알이 떨어졌다.", notes); }
        lines.push(`⚔ ${w.rival}이(가) 밤에 쳐들어왔다. ${guard.name}이(가) ${gun ? "총을 쏘며 " : ""}막아 냈다!`);
        if (rnd(s) < 0.4) { const ks = Object.keys(N.gear).filter((k) => !G(k).scen || G(k).scen === s.scenario); addGear(s, pick(s, ks), notes); }
      } else {
        const lf = Math.ceil(s.food * 0.3);
        s.food -= lf;
        lines.push(`⚔ ${w.rival}이(가) ${w.shelter}을(를) 습격했다. ${w.food} −${lf}.`);
        hurt(s, pick(s, adults(s)), 1, `${w.rival}의 습격`, notes);
      }
    }
    // 세상은 우리 없이도 돌아간다: 다른 생존자가 털어 가고, 가끔 새로 생긴다(알려 주지 않는다)
    const locs = Object.keys(scen(s).places);
    if (rnd(s) < 0.4) { const st = s.stock[pick(s, locs)], k = pick(s, RES); st[k] = Math.floor(st[k] * (0.2 + rnd(s) * 0.4)); }
    if (rnd(s) < 0.15) { const l = pick(s, locs), k = pick(s, RES); s.stock[l][k] += 3 + Math.floor(rnd(s) * 4); if (rnd(s) < 0.5) s.rumors.push({ loc: l, day: s.day, text: `${scen(s).places[l].name} 쪽에 피난민이 짐을 버리고 갔다더라.` }); }
    else if (rnd(s) < 0.2) { s.rumors = s.rumors.filter((r) => s.day - r.day < 6); addRumor(s); }
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
    if (!s.ending && s.story) advanceAct(s, notes);
    if (!s.ending && s.day > s.rescueDay + (s.story ? 1 : 0)) {
      const ratio = alive(s).length / s.total;
      s.ending = ratio >= 1 ? "all" : ratio >= 0.6 ? "most" : "few";
    }
    s.event = s.ending ? null : pickEvent(s);
    s.report = { title: s.ending ? "마지막 아침" : `${s.day}일째 아침`, lines: [...lines, ...notes] };
    narrate(s);
    s.phase = s.ending ? "end" : "dawn";
    return { state: s };
  }
  // ── 아침 사건 ──
  const events = (s) => [...SC.commonEvents, ...scen(s).events, ...storyEvents(s)];
  // 이야기 사건: 라이벌 3막, 식구 사연, 돌아오는 밤의 선택, 마지막 밤 전날
  function storyEvents(s) {
    const def = story(s);
    if (!def) return [];
    const out = def.rival.map((r, i) => ({ ...r, id: `rv${i}`, beat: r.id, story: true }));
    for (const [pid, beats] of Object.entries(def.arcs)) beats.forEach((b, i) => out.push({ ...b, id: `arc_${pid}_${i}`, need: pid, story: true }));
    for (const [id, c] of Object.entries(def.callbacks)) out.push({ ...c, id: `cb_${id}`, story: true });
    const weak = alive(s).filter((p) => home(s, p) && p.hp >= 2);
    const eve = def.finale.eve;
    out.push({ id: "fin_eve", story: true, text: eve.text, choices: weak.length && !s.story.prog.sled ? eve.choices : [{ label: "짐을 싼다", fx: {}, text: s.story.prog.sled ? "썰매에 짐과 아이를 실었다. 문을 마지막으로 돌아봤다." : "다들 걸을 수 있다. 문을 마지막으로 돌아봤다." }] });
    return out;
  }
  function pickStory(s) {
    const def = story(s), st = s.story;
    if (!def) return null;
    const due = st.cbs.find((c) => c.day <= s.day);
    if (due) { st.cbs = st.cbs.filter((c) => c !== due); return { id: `cb_${due.id}`, cast: null, cast2: null }; }
    if (s.day === s.rescueDay && !s.seen.fin_eve) { s.seen.fin_eve = s.day; return { id: "fin_eve", cast: null, cast2: null }; }
    if (st.rival !== -1) {
      const beats = ["r1", "r2", "r3"], next = beats[st.rival];
      const ev = next && def.rival.map((r, i) => ({ r, i })).find(({ r }) => r.id === next && s.day >= r.day && (!r.when || r.when(s)));
      if (ev) { st.rival += 1; return { id: `rv${ev.i}`, cast: null, cast2: null }; }
    }
    const cands = alive(s).filter((p) => home(s, p) && def.arcs[p.id] && (st.arcs[p.id] || 0) < 3 && s.day - (st.arcDay[p.id] ?? -9) >= 2 && s.day >= 2);
    if (cands.length && rnd(s) < 0.45) {
      const p = pick(s, cands), n = st.arcs[p.id] || 0;
      st.arcs[p.id] = n + 1;
      st.arcDay[p.id] = s.day;
      return { id: `arc_${p.id}_${n}`, cast: p.id, cast2: null };
    }
    return null;
  }
  function castFor(s, kind) {
    const pool = adults(s).filter((p) => !p.leader && p.away <= 0);
    if (kind === "hungry") return pool.filter((p) => p.hunger >= 1 || p.stress >= 45);
    if (kind === "brave") return pool.filter((p) => p.hp === 0 && p.stats.force + p.stats.wits >= 4);
    if (kind === "stressed") return pool.filter((p) => p.stress >= 65);
    if (kind === "sick") return alive(s).filter((p) => !p.leader && p.hp >= 1 && p.away <= 0);
    if (kind === "dying") return alive(s).filter((p) => !p.leader && p.hp >= 2 && s.meds === 0);
    if (kind === "grieving") return alive(s).filter((p) => p.grief && s.day - p.griefDay <= 4 && !p.leader);
    return pool;
  }
  const ONCE = ["rival_offer", "brave", "doyun_offer", "haejin", "radio_call", "forecast", "stranger", "neighbor_hurt", "neighbor_food", "revenge", "child_share"];
  function eventOk(s, e) {
    const last = s.seen[e.id];
    if (ONCE.includes(e.id) && last !== undefined) return false;
    if (last !== undefined && s.day - last < 3) return false;
    if (e.need === "@child") { if (!alive(s).some((p) => p.child)) return false; }
    else if (e.need === "@stole") { if (!s.flags.stole || s.day - (s.flags.stoleDay || 0) < 2) return false; }
    else if (e.need && !(byId(s, e.need) && byId(s, e.need).alive)) return false;
    if (e.id === "child_share" && s.food > 2) return false;
    if ((e.id === "rival_offer" || e.id === "doyun_offer") && s.day < 3) return false;
    if (e.id === "stranger" && s.day < 4) return false;
    if (e.cast === "two" && castFor(s, "two").length < 2) return false;
    if (e.cast && e.cast !== "two" && !castFor(s, e.cast).length) return false;
    return true;
  }
  function pickEvent(s) {
    const sp = pickStory(s);
    if (sp) { s.seen[sp.id] = s.day; return sp; }
    if (rnd(s) > 0.65) return null;
    const ok = events(s).filter((e) => !e.story && eventOk(s, e));
    if (!ok.length) return null;
    const e = pick(s, ok);
    s.seen[e.id] = s.day;
    if ((e.id === "cough" || e.id === "fever_kid" || e.id === "frost_kid") && e.need && byId(s, e.need)) { const k = byId(s, e.need); if (k.hp === 0) k.hp = 1; }
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
    const dead = ev?.cast && byId(s, ev.cast)?.grief ? byId(s, ev.cast).grief : s.memorial.at(-1)?.name || "";
    const weak = alive(s).filter((p) => home(s, p) && p.hp >= 2).map((p) => p.name);
    const weakT = s.story ? (weak.length ? (s.story.prog.sled ? `${weak.join(", ")}은(는) 썰매에 태운다.` : `${weak.join(", ")}은(는) 걸을 수 없다. 썰매도 없다.`) : "") : "";
    const deadOr = s.memorial.length ? `빈칸 하나에 “${s.memorial.at(-1).name}”이라고 적혀 있다.` : "모두 손을 잡고 웃고 있다.";
    return String(text).replaceAll("{weak}", weakT).replaceAll("{dead_or}", deadOr).replaceAll("{who}", ev?.cast ? byId(s, ev.cast).name : "").replaceAll("{who2}", ev?.cast2 ? byId(s, ev.cast2).name : "").replaceAll("{dead}", dead)
      .replaceAll("{rival}", w.rival).replaceAll("{goal}", w.goal).replaceAll("{food}", w.food).replaceAll("{wood}", w.wood).replaceAll("{meds}", w.meds);
  }
  function eventView(s) {
    if (!s.event) return null;
    const e = events(s).find((x) => x.id === s.event.id);
    return {
      id: e.id, art: e.beat ? `rival_${e.beat}` : e.id, text: fillText(s, e.text), cast: s.event.cast, cast2: s.event.cast2, need: e.need || null,
      choices: e.choices.map((c, i) => ({ i, label: fillText(s, c.label), tag: [c.need?.food && `${W(s).food} ${c.need.food}`, c.need?.wood && `${W(s).wood} ${c.need.wood}`, c.need?.meds && `${W(s).meds} ${c.need.meds}`, c.needPerson && `${meta(s, c.needPerson).name}`].filter(Boolean).join(" · "), reason: c.need?.meds && s.meds < c.need.meds ? `${W(s).meds}이(가) 없다` : c.need?.food && s.food < c.need.food ? `${W(s).food}이(가) 모자라다` : c.need?.wood && s.wood < c.need.wood ? `${W(s).wood}이(가) 모자라다` : c.need?.ledger && !s.flags.ledger ? "장부가 필요하다" : c.needPerson && !(byId(s, c.needPerson)?.alive && home(s, byId(s, c.needPerson))) ? `${meta(s, c.needPerson).name || "그 사람"}이(가) 없다` : "" })),
    };
  }
  function resolveEvent(state, index) {
    if (!state.event || state.phase !== "dawn") return { state, error: "사건이 없습니다." };
    const e = events(state).find((x) => x.id === state.event.id), c = e.choices[index];
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const reason = eventView(state).choices[index].reason;
    if (reason) return { state, error: reason };
    const s = clone(state), notes = [];
    const cast = s.event.cast ? byId(s, s.event.cast) : null, cast2 = s.event.cast2 ? byId(s, s.event.cast2) : null;
    let text = applyFx(s, c.fx || {}, cast, cast2, notes, fillText(s, c.text));
    if (c.jr) jr(s, fillText(s, c.jr), 2);
    if (c.fx?.check) {
      const k = c.fx.check, lead = byId(s, s.flags.newLeader || "leader");
      const who = k.who === "cast" ? cast : k.who === "leader" ? lead : k.who === "best" ? adults(s).filter((p) => home(s, p)).sort((a, b) => b.stats[k.stat] - a.stats[k.stat])[0] : byId(s, k.who);
      if (who && who.alive) {
        const roll = d20(s), ok = roll === 20 || (roll !== 1 && roll + who.stats[k.stat] >= k.dc);
        const sub = ok ? k.win : k.lose;
        text = `${text ? text + " " : ""}🎲 ${who.name} ${D.stats[k.stat].name} ${roll}+${who.stats[k.stat]} vs ${k.dc} — ${ok ? "성공" : "실패"}. ${fillText(s, sub.text)}`;
        applyFx(s, sub.fx || {}, who, null, notes, "");
        if (sub.jr) jr(s, sub.jr, 3);
      }
    }
    if (s.chronicle && text) s.chronicle.push({ day: s.day, title: "아침", paras: [fillText(s, e.text), `“${fillText(s, c.label)}” — ${text}`] });
    s.event = null;
    s.eventResult = { text, notes };
    return { state: s };
  }
  function applyFx(s, fx, cast, cast2, notes, text) {
    for (const r of ["food", "wood", "meds"]) if (fx[r]) s[r] = Math.max(0, s[r] + fx[r]);
    if (fx.foodPct) s.food = Math.max(0, s.food + Math.round(s.food * fx.foodPct));
    if (fx.stance && s.story) s.story.stance += fx.stance;
    if (fx.clue !== undefined || fx.prog || fx.cb) storyOutcome(s, { clue: fx.clue, prog: fx.prog, cb: fx.cb }, notes);
    if (fx.gear) addGear(s, fx.gear, notes);
    if (fx.rivalGone && s.story) { s.story.rival = -1; s.rivalAlert = 0; }
    if (fx.castAway !== undefined && cast) { if (fx.castAway > 0) cast.away = fx.castAway; else cast.busy = true; }
    if (fx.castCraft && cast) cast.stats.craft = Math.max(0, cast.stats.craft + fx.castCraft);
    if (fx.hurtCast && cast) hurt(s, cast, fx.hurtCast, "사고", notes);
    if (fx.hurtTwo) for (const p of adults(s).slice().sort(() => rnd(s) - 0.5).slice(0, 2)) hurt(s, p, fx.hurtTwo, "늑대단의 습격", notes);
    if (fx.castDie && cast && cast.alive) die(s, cast, fx.castDie, notes);
    if (fx.carryWeak && s.story) s.story.heavy = true;
    if (fx.leaveWeak) {
      const weak = alive(s).filter((p) => home(s, p) && p.hp >= 2);
      for (const p of weak) {
        p.alive = false;
        p.left = true;
        s.memorial.push({ id: p.id, name: p.name, day: s.day, cause: "기지에 남겨졌다" });
        s.log.push({ day: s.day, text: `${p.name}을(를) 기지에 두고 떠났다.` });
      }
      if (weak.length) { s.hope = clamp(s.hope - 10, 0, 100); text = `${weak.map((p) => p.name).join(", ")}이(가) 문간에서 손을 흔들었다. 아무도 뒤돌아보지 못했다.`; }
    }
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
    if (fx.flag) { s.flags[fx.flag] = true; if (fx.flag === "stole") s.flags.stoleDay = s.day; }
    if (fx.unflag) delete s.flags[fx.unflag];
    if (fx.isolate && cast) { cast.isolated = 2; }
    if (fx.spread && cast) { const others = alive(s).filter((p) => p !== cast && p.hp === 0); if (others.length && rnd(s) < 0.5) { const v = pick(s, others); hurt(s, v, 1, "옮은 병", notes); notes.unshift(`🤒 ${v.name}에게 병이 옮았다.`); } }
    if (fx.childHunger) for (const p of alive(s).filter((x) => x.child)) p.hunger = Math.min(3, p.hunger + fx.childHunger);
    if (fx.adultsHunger) for (const p of adults(s).slice().sort(() => rnd(s) - 0.5).slice(0, fx.adultsHunger)) p.hunger = Math.min(3, p.hunger + 1);
    if (fx.castHeal && cast) cast.hp = Math.max(0, cast.hp - 1);
    if (fx.hurtRandom) hurt(s, pick(s, adults(s)), fx.hurtRandom, "몸싸움", notes);
    if (fx.rescueCheck) {
      const r = adults(s).filter((p) => p.hp <= 1 && p.away <= 0).sort((a, b) => b.stats.force + b.stats.wits - a.stats.force - a.stats.wits)[0];
      if (r && d20(s) + r.stats.force + r.stats.wits >= 16) { joinStranger(s, notes); text = `${r.name}이(가) 위험한 길을 건너 이웃을 업고 돌아왔다.`; s.hope = clamp(s.hope + 5, 0, 100); }
      else if (r) { hurt(s, r, 1, "이웃을 구하러 갔다가", notes); text = `${r.name}이(가) 건너다 쓰러졌다. 이웃의 손짓은 멈췄다.`; }
      else text = "갈 수 있는 사람이 없었다.";
    }
    if (fx.law) s.flags.law = fx.law;
    if (fx.trustHaejin) s.flags.trustHaejin = true;
    if (fx.spy) {
      const lead = byId(s, s.flags.newLeader || "leader");
      if (d20(s) + lead.stats.wits >= 13) {
        if (rnd(s) < 0.5) { s.flags.ledger = true; text = "강해진이 도윤의 사병에게 쪽지를 건네는 걸 봤다. 쪽지를 빼앗았다 — 도윤의 장부 위치가 적혀 있었다."; }
        else { s.food += 2; text = "강해진은 몰래 고기를 잡아 다른 이들에게 나눠 주고 있었다. (식량 +2)"; }
      } else text = "뒤를 밟다 놓쳤다. 강해진은 당신을 의심하는 눈치다.";
    }
    return text;
  }
  function dismiss(state) {
    const s = clone(state);
    if (s.card && !s.report) s.card = null;
    else if (s.report) s.report = null;
    else if (s.eventResult) s.eventResult = null;
    else if (s.deaths && s.deaths.length && s.phase !== "exp") s.deaths.shift();
    if (s.phase === "dawn" && !(s.deaths && s.deaths.length) && !s.report && !s.card && !s.event && !s.eventResult) {
      s.phase = "evening";
      s.plan = defaultPlan(s);
    }
    return { state: s };
  }
  function validate(s) {
    const ok = s && s.v === 3 && Array.isArray(s.gear) && s.stock && s.known && SC.scenarios[s.scenario] && Number.isInteger(s.rng) && Number.isInteger(s.day) && Array.isArray(s.people) && s.people.length &&
      ["dawn", "evening", "exp", "end"].includes(s.phase) && [s.food, s.wood, s.meds, s.hope].every(Number.isFinite) && Array.isArray(s.threats) && Array.isArray(s.memorial) &&
      (s.phase !== "evening" || (s.plan && s.plan.feed && s.plan.med && s.plan.carry && Array.isArray(s.plan.send)));
    if (!ok) throw Error("저장이 손상되었습니다.");
    const c = clone(s);
    if (c.plan && !c.plan.role) c.plan.role = {}; // 역할이 생기기 전 저장
    if (c.story === undefined) c.story = null;
    if (!c.chronicle) c.chronicle = [];
    if (!c.scouted) c.scouted = {};
    if (!Number.isFinite(c.parts)) c.parts = 0;
    if (c.exp && c.exp.loot && c.exp.loot.parts === undefined) c.exp.loot.parts = 0;
    return c;
  }
  // 밤 추천: 가장 모자란 것을 구하러, 그 장소에 맞는 두 사람
  function recommend(s) {
    const pl = scen(s).places, keys = Object.keys(pl);
    const lootOf = (k) => pl[k].loot;
    const w = W(s);
    const want = alive(s).some((p) => p.hp >= 2) && s.meds < 1 ? w.meds : s.food < alive(s).length * 2 ? w.food : s.wood < 3 ? w.wood : null;
    const empty = (k) => s.known[k] && /텅 빔|조금/.test(s.known[k].lvl) && s.day - s.known[k].day < 4;
    const cand = keys.filter((k) => !empty(k));
    const loc = cand.find((k) => want && lootOf(k).startsWith(want) && pl[k].danger <= 2) || cand.find((k) => pl[k].danger === 2) || cand[0] || keys[0];
    let pool = s.people.filter((p) => canGo(s, p) && p.hp === 0 && p.stress < 75 && !p.leader);
    if (pool.length < 2) pool = s.people.filter((p) => canGo(s, p));
    const party = pool.sort((a, b) => b.stats.force + b.stats.wits - a.stats.force - a.stats.wits).slice(0, 2).map((p) => p.id);
    return { loc, party, why: want ? `${want}이(가) 모자라다` : "여유가 있을 때 더 찾아 둔다" };
  }
  const storyGoal = (s) => (story(s) ? story(s).goalLine(s) : null);
  const api = {
    newGame, toggleFeed, toggleMed, toggleSend, setPlace, nightfall, choose, proceed, resolveEvent, dismiss, validate, recommend,
    sceneView, eventView, forecast, harsh, toggleCarry, toggleScout, placeInfo, gearName, N, hush, noiseStage: (s) => (s.exp ? { stage: stageOf(s.exp.noise), name: STAGES[stageOf(s.exp.noise)], risk: caughtChance(s.exp.noise), riskAfter: caughtChance(s.exp.noise + 2) } : null), setCraft, recipesFor, recipeOk, gearWhere, setRole, roleOf, ROLES, rummage, storyGoal, isFinaleNight, nextThreat, alive, adults, byId, canGo, home, describe, scen, meta, defaultPlan, MAX_STEP,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.SurviveEngine = api;
})(globalThis);
