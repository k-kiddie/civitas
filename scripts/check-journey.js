"use strict";
// 「남행」 검사: 콘텐츠 참조, 결정성, 저장, 가방, 잠긴 선택, 봇 완주와 이야기 다양성
const assert = require("node:assert/strict");
const E = require("../journey/engine"), C = require("../journey/content");
const { bot } = require("./sim-journey");
// 사건 한 걸음: 굴린 주사위는 받아들이고, 대가는 첫 번째로 치르고, 결과는 넘긴다
function stepEvent(g, pickChoice) {
  if (g.ev.pending) return E.accept(g).state;
  const v = E.view(g);
  if (v.result) return v.result.cost ? E.payCost(g, v.costs[0].k).state : E.cont(g).state;
  const c = pickChoice ? pickChoice(v) : null;
  return E.choose(g, c ? c.i : v.choices.find((x) => !x.lock).i).state;
}
// 콘텐츠: 모든 선택의 물건·다음 장면·조건이 실제로 있다
const checkChoice = (where, ch, scenes) => {
  for (const o of [ch, ch.win, ch.lose].filter(Boolean)) {
    const fx = o.fx || {};
    for (const k of [].concat(fx.item || [], fx.take || [])) assert(C.items[k], `${where}: 없는 물건 ${k}`);
    if (fx.join) assert(C.people[fx.join], `${where}: 없는 동행 ${fx.join}`);
    const go = o.go; if (go && scenes) assert(scenes[go], `${where}: 없는 장면 ${go}`);
  }
  if (ch.req?.item) assert(C.items[ch.req.item], `${where}: 조건 물건 ${ch.req.item}`);
  if (ch.req?.companion) assert(C.people[ch.req.companion], `${where}: 조건 동행`);
  if (ch.check) assert(E.STATS[ch.check[0]] && Number.isInteger(ch.check[1]), `${where}: 판정`);
  if (/^\[/.test(ch.label)) assert(ch.req, `${where}: [조건] 표시인데 req가 없다 — ${ch.label}`);
};
for (const [id, ev] of Object.entries(C.events)) { if (ev.climax) continue; for (const [sid, sc] of Object.entries(ev.scenes)) for (const ch of sc.choices) checkChoice(`${id}.${sid}`, ch, ev.scenes); }
for (const [pid, P] of Object.entries(C.premises)) {
  const variants = P.byOrigin ? Object.values(P.byOrigin).map((o) => ({ ...P, ...o })) : [P];
  for (const V of variants) {
    assert.equal(V.plant.length, 3, `${pid}: 단서 3개`);
    for (const b of [...V.plant, V.complicate, V.twist.A, V.twist.B, V.payoff]) for (const ch of b.choices) checkChoice(`${pid}.${b.id}`, ch);
    assert(V.titles.A && V.titles.B, `${pid}: 제목`);
  }
}
for (const [o, beats] of Object.entries(C.originBeats)) for (const b of Object.values(beats)) for (const ch of b.choices) checkChoice(`${o}.${b.id}`, ch);
for (const [k, p] of Object.entries(C.places)) for (const ev of [].concat(p.ev || [])) assert(C.events[ev], `장소 ${k}의 사건 ${ev}`);
// 시작과 결정성
let s = E.begin(E.newGame({ origin: "parent", seed: 42 })).state;
assert.equal(s.phase, "map");
assert(s.bag.some((b) => b.k === "radio") && s.bag.some((b) => b.k === "soi_photo"));
const raw = JSON.stringify(s);
const first = E.options(s)[0];
const a1 = E.go(s, first.id).state;
assert.equal(JSON.stringify(s), raw, "입력 불변");
assert.deepEqual(a1, E.go(JSON.parse(raw), first.id).state, "결정성");
assert.equal(a1.phase, "event");
// 잠긴 선택은 고를 수 없다
let e = a1, guard = 0;
while (e.phase === "event" && guard++ < 30) {
  const v = E.view(e);
  if (!v.result && !e.ev.pending) { const locked = v.choices.find((c) => c.lock); if (locked) assert(E.choose(e, locked.i).error, "잠긴 선택 거부"); }
  e = stepEvent(e);
}
assert.equal(e.phase, "camp", "사건이 끝나면 야영");
// 가방이 넘치면 떠날 수 없다
let b = JSON.parse(JSON.stringify(e));
while (E.bagCount(b) <= E.BAG) b.bag.push({ k: "scrap", u: 0 });
assert(E.sleep(b).error, "가방이 넘치면 밤을 못 보낸다");
assert(E.drop(b, "radio").error, "단서 물건은 못 버린다");
b = E.drop(b, "scrap").state; assert(!E.sleep(b).error);
// 저장
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(e))), e);
assert.throws(() => E.validate({ v: 0 }));
// 2단계: 버릇이 전제를 고른다
{
  const mk = (habit, comps) => { const g = E.begin(E.newGame({ origin: "parent", seed: 9 })).state; g.habit = habit; g.comps = comps; g.step = 1; return E.go(g, E.options(g)[0].id).state; };
  const c = [{ id: "maru", name: "마루", hp: 0, hunger: 0, trust: 1, alive: true, talks: 0 }];
  assert.equal(mk({ share: 0, harsh: 3, trust: 0 }, c).dir.premise, "hidden_kin", "냉정하면 혈육");
  assert.equal(mk({ share: 2, harsh: 0, trust: 1 }, c).dir.premise, "betrayal", "믿고 나누면 배신");
  const d = E.begin(E.newGame({ origin: "drifter", seed: 9 })).state; d.habit = { share: 0, harsh: 3, trust: 0 }; d.step = 1;
  assert.equal(E.go(d, E.options(d)[0].id).state.dir.premise, "false_salvation", "떠돌이는 혈육 대신 거짓 구원");
  assert(mk({ share: 2, harsh: 0, trust: 1 }, c).dir.why, "왜 이 이야기인지 한 줄");
}
// 2단계: 마음 상한 동행이 길을 막아선다, 기억을 말한다
{
  let g = E.begin(E.newGame({ origin: "deserter", seed: 5 })).state;
  g.comps = [{ id: "hyean", name: "혜안", hp: 0, hunger: 0, trust: -1, alive: true, talks: 0, mem: ["dochi"] }];
  g = E.go(g, E.options(g)[0].id).state;
  const v = E.view(g);
  assert.match(v.text, /혜안/); assert.match(v.text, /사슬/, "동행이 기억한 빚을 말한다");
}
// 2단계: 백곰을 쓰러뜨리면 설원의 왕이 열린다
{
  let g = E.begin(E.newGame({ origin: "deserter", seed: 3 })).state;
  g.act = 3; g.step = 1; g.facts.baekgom_down = 1; g.day = 5; g.dir.premise = "betrayal"; g.dir.pending = [];
  g = E.go(g, "station_whiteferry").state;
  let guard = 0;
  while (g.phase === "event" && guard++ < 20) g = stepEvent(g, (v) => { const k = v.choices.find((c) => /이제 내가 백곰/.test(c.label)); return k && !k.lock ? k : null; });
  assert.equal(g.ending.key, "king", "설원의 왕");
  assert.match(g.narrator, /늑대단의 아이들/);
}
// 3단계: 출신 5개, 지난 판의 시신, 진실 조각 셋이면 모두의 열차
{
  assert.equal(Object.keys(C.origins).length, 5);
  for (const o of Object.keys(C.origins)) { assert(C.places[C.origins[o].start], o + " 시작 장소"); const g = E.newGame({ origin: o, seed: 2 }); for (const k of C.origins[o].items) assert(g.bag.some((b) => b.k === k), o + " 시작 물건"); assert(C.originBeats[o][1] && C.originBeats[o][2] && C.originBeats[o][3], o + " 막별 사건"); }
  const leg = { truths: ["crew", "pilot", "gu"], corpse: { origin: "crew", act: 1, line: "7일. 다리는 건너지 마라.", items: ["rope"] } };
  const g = E.newGame({ origin: "parent", seed: 4, legacy: leg });
  assert(g.dir.pending.some((p) => p.beat.type === "past"), "지난 판 시신이 배치된다");
  assert.equal(E.allTruths(g).length, 3);
  let h = E.begin(g).state; h.act = 3; h.step = 1; h.day = 5; h.dir.premise = "betrayal"; h.dir.pending = [];
  h = E.go(h, "station_whiteferry").state; let guard = 0;
  while (h.phase === "event" && guard++ < 20) h = stepEvent(h, (v) => { const o = v.choices.find((c) => /불길에 던진다/.test(c.label)); return o && !o.lock ? o : null; });
  assert.equal(h.ending.key, "open", "모두의 열차");
  const pilot = E.begin(E.newGame({ origin: "pilot", seed: 4 })).state; pilot.act = 3; pilot.step = 1;
  assert(E.options(pilot).some((o) => o.dest === "sky"), "조종사는 비행장이 보인다");
  const par = E.begin(E.newGame({ origin: "parent", seed: 4 })).state; par.act = 3; par.step = 1;
  assert(!E.options(par).some((o) => o.dest === "sky" || o.dest === "signal"), "부모는 단서 없이는 비행장·관측소가 안 보인다");
}
// TRPG: 굴림 → 다시 굴리기(의지) → 3단계 결과 → 대가 고르기, 시계
{
  let g = E.begin(E.newGame({ origin: "deserter", seed: 12 })).state;
  assert.equal(g.actCard, 1, "1막 소개");
  g = E.go(g, E.options(g)[0].id).state;
  assert.equal(g.actCard, 0);
  let guard = 0, sawPending = false;
  while (g.phase === "event" && guard++ < 30) {
    const v = E.view(g);
    if (!v.result && !g.ev.pending && v.choices.some((c) => c.feel && !c.lock)) {
      g = E.setWill(g).state; assert(g.ev.useWill);
      const w = g.will; g = E.choose(g, v.choices.find((c) => c.feel && !c.lock).i).state;
      assert.equal(g.will, w - 1, "의지를 쓰면 1점 줄고"); assert.equal(g.ev.pending.bonus >= 2, true, "+2");
      sawPending = true; break;
    }
    g = stepEvent(g);
  }
  assert(sawPending, "판정이 있는 장면");
  // 대가를 치르는 성공
  const p = JSON.parse(JSON.stringify(g)); p.ev.pending.tier = "partial";
  let r = E.accept(p).state; assert(r.ev.result.cost, "대가를 골라야 한다"); assert(E.cont(r).error);
  const costs = E.view(r).costs; assert(costs.length >= 3);
  const day0 = r.day; r = E.payCost(r, "day").state; assert.equal(r.day, day0 + 1); assert(!r.ev.result.cost);
  // 실패는 시계를 채운다(대가 없는 실패일 때)
  assert(E.clocksView(r).length >= 3);
  // 늑대단 추적 시계가 다 차면 백곰이 나타난다
  let h = E.begin(E.newGame({ origin: "parent", seed: 13 })).state; h.clocks.wolves = 6; h.dir.premise = "betrayal"; h.dir.pending = [];
  h = E.go(h, E.options(h)[0].id).state; assert.equal(h.ev.cur.beat?.id, "hunt", "백곰의 사냥");
  // 눈보라 시계
  let w = E.begin(E.newGame({ origin: "parent", seed: 14 })).state; w.clocks.storm = 4; w.dir.pending = [];
  w = E.go(w, E.options(w)[0].id).state; assert.equal(w.ev.cur.beat?.id, "storm_block", "눈보라로 길이 막힌다");
  assert(E.adventure(w, 2).need.length >= 3);
}
// TRPG 2단계: 장면마다 접근이 여럿, 먼저 살펴보기
{
  let mains = 0, rich = 0;
  for (const [id, ev] of Object.entries(C.events)) { if (ev.climax || /^road_/.test(id)) continue; const sc = ev.scenes.start; if (!sc || !sc.choices.some((c) => c.check)) continue; mains++; if (new Set(sc.choices.filter((c) => c.check).map((c) => c.check[0])).size >= 2) rich++; }
  assert(rich / mains > 0.85, `접근 방식이 둘 이상인 장면 비율 ${rich}/${mains}`);
  let g = E.begin(E.newGame({ origin: "drifter", seed: 21 })).state; g.dir.pending = [];
  g = E.go(g, E.options(g)[0].id).state; let guard = 0;
  while (g.phase === "event" && !E.view(g).canScout && guard++ < 10) g = stepEvent(g);
  if (g.phase === "event" && E.view(g).canScout) {
    const before = E.view(g).choices.find((c) => c.feel);
    const sc = E.scout(g).state; assert(E.view(sc).scoutNote, "살핀 결과가 나온다"); assert(!E.view(sc).canScout, "한 번만 살핀다");
    assert(E.view(sc).choices.every((c) => !c.feel || c.approach), "판정 선택에 접근 표시");
  }
}
// 결말 보강: 조사, 명단 줄기, 수첩
{
  assert.equal(E.josa("은서은(는) 마루이(가) 집(으)로 길(으)로"), "은서는 마루가 집으로 길로");
  const g = E.begin(E.newGame({ origin: "crew", seed: 8 })).state;
  assert(g.dir.pending.some((p) => p.beat.type === "spine" && p.beat.n === 1), "1막에 명단 이야기가 반드시 나온다");
  assert.match(E.goals(g).title, /일곱 이름/);
  const n = E.notebook(g); assert(n.goal && Array.isArray(n.sus) && Array.isArray(n.people));
  for (const k of ["crash", "settle", "revenge", "letgo"]) assert(C.endings[k], "결말 " + k);
}
// 2단계: 장소 사건이 판마다 달라진다
{
  const picks = new Set(); for (let i = 1; i <= 20; i++) picks.add(E.newGame({ origin: "parent", seed: i }).evPick.frozen_village);
  assert.equal(picks.size, 2, "마을 사건 두 가지가 번갈아 나온다");
}
// 봇: 끝까지 가고, 전제·반전·결말·제목이 다양하다
const out = { end: {}, prem: new Set(), titles: new Set(), twisted: 0, payoff: 0, N: 240 };
for (let i = 1; i <= out.N; i++) {
  const o = ["parent", "deserter", "drifter", "crew", "pilot"][i % 5];
  for (const style of ["smart", "random"]) {
    const g = bot((i * 2654435761) >>> 0, o, style);
    assert.equal(g.phase, "end");
    assert(C.endings[g.ending.key], "결말 " + g.ending.key);
    assert(g.narrator, "화자가 있다");
    assert(g.epilogue && g.epilogue.knots.length >= 1, "결말에 내 목표의 매듭이 있다 " + g.origin);
    if (g.facts.forgave && g.dir.roles.traitor && !g.comps.find((c) => c.id === g.dir.roles.traitor).abandoned) { const tn = E.C.people[g.dir.roles.traitor].name; assert(!g.epilogue.people.some((x) => x.startsWith(tn) && /떠난 뒤/.test(x)), "용서한 배신자가 떠났다고 나오지 않는다"); }
    assert(E.goals(g).title, "목표가 있다");
    if (style === "smart") { out.sets = out.sets || new Set(); for (const c of g.chronicle) if (/화이트아웃|늑대 무리|썰매개 방울|눈사태/.test(c.paras.join())) out.sets.add(c.title); out.end[g.ending.key] = (out.end[g.ending.key] || 0) + 1; out.prem.add(g.dir.premise + g.dir.twist); out.titles.add(g.title); if (g.dir.twisted) out.twisted++; if (g.dir.payoffDone) out.payoff++; }
  }
}
assert(out.end.signal || out.end.sky, "새 결말이 나온다");
assert(out.prem.size >= 6, "전제×반전 6가지 모두 나온다 " + [...out.prem]);
assert(Object.keys(out.end).length >= 7, "결말 5가지 이상 " + JSON.stringify(out.end));
assert(out.titles.size >= 8, "이야기 제목 8가지 이상");
assert(out.twisted / out.N > 0.7, "대부분 반전까지 간다");
console.log(`남행 엔진: 결말 ${JSON.stringify(out.end)} · 전제×반전 ${out.prem.size}종 · 제목 ${out.titles.size}종 · 반전 ${Math.round((out.twisted / out.N) * 100)}% · 회수 ${Math.round((out.payoff / out.N) * 100)}% · 결정성/저장/가방 통과`);
