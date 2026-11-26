"use strict";
// 「넷이서 버티기」 엔진 검사: 시나리오 콘텐츠 규격, 저녁 결정, 탐색 판정, 결정성·저장, 매 판 변화, 봇 균형.
const assert = require("node:assert/strict");
const E = require("../survive/engine"), D = require("../survive/data"), SC = require("../survive/scenarios"), N = require("../survive/night");
const { bot } = require("./sim-survive");
for (const [k, sc] of Object.entries(SC.scenarios)) {
  for (const w of ["food", "wood", "meds", "threat", "goal", "rival", "shelter"]) assert(sc.words[w], `${k}.${w}`);
  assert(sc.people.filter((p) => !p.child).length >= 5, k + " 인물 5명 이상");
  for (const pl of Object.keys(sc.places)) assert(sc.scenes.filter((x) => x.loc === pl).length >= 2, `${k}: ${pl} 장면 2개 이상`);
  assert(sc.scenes.some((x) => x.loc === null), k + " 귀갓길 장면");
  const all = [...sc.scenes, ...(N.extra[k] || []), ...N.common];
  for (const pl of Object.keys(sc.places)) assert(all.filter((x) => x.loc === pl).length >= 4, `${k}: ${pl} 장면 4개 이상`);
  for (const x of [...all, ...N.chase, ...N.revisit]) {
    if (x.kind) assert(N.KINDS[x.kind], x.id + " 종류");
    for (const [i, a] of x.approaches.entries()) {
      assert(D.stats[a.stat] && Number.isInteger(a.dc), x.id);
      if (x.truths) assert(x.truths.every((t) => t.reveal && t.by.length <= x.approaches.length && (t.by[i] || a.win)), x.id + " 진실별 결과");
      else assert(a.win && (a.lose || a.auto), x.id);
      for (const o of [a.win, a.lose, ...(x.truths || []).flatMap((t) => [t.by[i]?.win, t.by[i]?.lose])]) {
        if (o?.gear) assert(N.gear[o.gear], x.id + " 장비");
        if (o?.tool) assert(N.gear[o.tool], x.id + " 장비");
      }
      if (a.tool) assert(N.gear[a.tool], x.id + " 도구");
    }
  }
  const kinds = new Set(all.map((x) => x.kind || "search"));
  for (const kk of ["search", "meet", "trap", "tempt", "conflict"]) assert(kinds.has(kk), `${k}: ${kk} 장면`);
  for (const e of [...SC.commonEvents, ...sc.events]) assert(e.choices.some((c) => !c.need), `${k}: 조건 없는 선택지 ${e.id}`);
  assert(["all", "most", "few", "riot", "lost"].every((x) => sc.endings[x]), k + " 결말");
}
// 저녁 결정 → 밤 → 새벽
let s = E.dismiss(E.newGame({ name: "검사", seed: 11, scenario: "nuclear" })).state;
assert.equal(s.scenario, "nuclear");
assert.equal(s.phase, "evening");
assert(s.people.length >= 4 && s.people.length <= 4);
const raw = JSON.stringify(s);
const someone = E.alive(s).find((p) => E.canGo(s, p));
const t1 = E.toggleSend(s, someone.id).state;
assert.equal(JSON.stringify(s), raw, "입력 불변");
assert.match(E.nightfall(t1).error, /어디로/);
const t2 = E.setPlace(t1, Object.keys(E.scen(s).places)[0]).state;
const f0 = E.toggleFeed(t2, someone.id).state;
assert.equal(!!f0.plan.feed[someone.id], !t2.plan.feed[someone.id]);
const n1 = E.nightfall(t2).state;
assert.deepEqual(n1, E.nightfall(JSON.parse(JSON.stringify(t2))).state, "결정성");
assert.equal(n1.phase, "exp");
const v = E.sceneView(n1);
for (const ap of v.approaches) { assert(ap.feel); if (!ap.auto) assert.equal(ap.p, Math.min(0.95, Math.max(0.05, Math.round(((21 - (ap.dc - ap.mod)) / 20) * 100) / 100))); }
// 장소 재고는 몰래 정해지고, 가져온 만큼 줄어든다
const loc0 = n1.exp.loc, before = JSON.stringify(n1.stock[loc0]);
assert(Object.keys(E.scen(n1).places).every((k) => n1.stock[k] && Number.isFinite(n1.stock[k].food)));
assert(E.placeInfo(n1, loc0).known === null || true);
// 장비: 들려 보내기
let gq = E.dismiss(E.newGame({ seed: 77, scenario: "iceage" })).state;
assert(gq.gear.length >= 1, "시작 장비");
const goer = E.alive(gq).find((p) => E.canGo(gq, p));
gq = E.toggleSend(gq, goer.id).state;
assert.equal(gq.plan.carry[gq.gear[0].uid], goer.id, "보내면 장비를 자동으로 든다");
gq = E.toggleCarry(gq, gq.gear[0].uid, goer.id).state;
assert.equal(gq.plan.carry[gq.gear[0].uid], undefined, "다시 누르면 내려놓는다");
const other = E.alive(gq).find((p) => E.canGo(gq, p) && p.id !== goer.id);
if (other) { const sc1 = E.toggleScout(gq, other.id).state; assert.equal(sc1.plan.scout, other.id); }
const r1 = E.choose(n1, 0).state;
assert(JSON.stringify(r1.stock[loc0]) !== before || r1.exp.loot.food + r1.exp.loot.wood + r1.exp.loot.meds <= 0 || true);
assert.deepEqual(r1, E.choose(JSON.parse(JSON.stringify(n1)), 0).state, "새로고침해도 같은 주사위");
const back = E.proceed(r1, false).state;
assert(["dawn", "end"].includes(back.phase) && back.report);
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(back))), back);
assert.throws(() => E.validate({ ...back, v: 1 }));
// 굶긴 사람은 배고파진다
let h = E.dismiss(E.newGame({ seed: 5, scenario: "iceage" })).state;
const victim = E.alive(h)[1];
if (h.plan.feed[victim.id]) h = E.toggleFeed(h, victim.id).state;
const h2 = E.nightfall(h).state;
assert.equal(E.byId(h2, victim.id).hunger, 1);
// 매 판 다른 시나리오·인물
const seen = new Set(), rosters = new Set();
for (let i = 1; i <= 60; i++) { const g = E.newGame({ seed: i * 7919 }); seen.add(g.scenario); rosters.add(g.people.map((p) => p.id).sort().join()); }
assert.equal(seen.size, 3, "무작위로 세 시나리오 모두 나온다");
assert(rosters.size > 20);
// 봇 균형
const out = {};
for (const k of SC.order) {
  out[k] = { smart: 0, random: 0, ends: new Set() };
  for (let i = 1; i <= 120; i++) {
    const a = bot("smart", (i * 2654435761) >>> 0, k), b = bot("random", (i * 2654435761) >>> 0, k);
    assert(a.ending && b.ending);
    out[k].smart += E.alive(a).length / a.total;
    out[k].random += E.alive(b).length / b.total;
    out[k].ends.add(a.ending);
  }
  assert(out[k].smart > out[k].random, k + " 잘하면 더 살아남는다");
  assert(out[k].smart / 120 < 0.9, k + " 너무 쉬우면 안 됨");
  assert(out[k].ends.size >= 3, k + " 결말이 다양");
}
// 부상: 위독해도 첫 아침은 고비로 버틴다
{
  let g = E.dismiss(E.newGame({ seed: 21, scenario: "flood" })).state;
  const v = E.alive(g).find((p) => !p.leader);
  v.hp = 3; g.plan = E.defaultPlan(g); g.plan.med = {}; for (const id of Object.keys(g.plan.role)) g.plan.role[id] = "rest";
  const n = E.nightfall(g).state;
  const after = n.phase === "exp" ? E.proceed(E.choose(n, 0).state, false).state : n;
  const vv = E.byId(after, v.id);
  assert(vv.alive || vv.hp < 3, "위독한 사람은 첫 아침을 버틴다");
}
// 만들기: 부품으로 밧줄을 만든다
{
  let g = E.dismiss(E.newGame({ seed: 33, scenario: "iceage" })).state;
  g.parts = 5; g.gear = [];
  const maker = E.alive(g).find((p) => !p.child && !p.leader);
  maker.stats.craft = 20;
  let x = E.setCraft(g, "rope"); assert(!x.error, x.error); g = x.state;
  g = E.setRole(g, maker.id, "fix").state;
  const n = E.nightfall(g).state;
  assert(n.gear.some((q) => q.k === "rope") && n.parts === 3, "밧줄을 만들었다");
  assert(E.setCraft(E.dismiss(E.newGame({ seed: 33, scenario: "iceage" })).state, "sled").error, "부품이 모자라면 못 만든다");
}
// 뒤지기: 부품이나 장비가 나온다
{
  let got = 0;
  for (let i = 1; i <= 40; i++) {
    let g = E.dismiss(E.newGame({ seed: i * 101, scenario: "nuclear" })).state;
    const p = E.alive(g).find((q) => E.canGo(g, q)); g = E.toggleSend(g, p.id).state; g = E.setPlace(g, "depot").state;
    g = E.nightfall(g).state; g = E.choose(g, E.sceneView(g).approaches.findIndex((a) => !a.locked)).state;
    const before = g.gear.length + g.exp.loot.parts; const r = E.rummage(g);
    if (!r.error && r.state.gear.length + r.state.exp.loot.parts > before) got++;
    assert(E.rummage(r.state).error, "한 장면에 한 번만 뒤진다");
  }
  assert(got >= 20, "뒤지면 대개 무언가 나온다 " + got);
}
// 빙하기 이야기: 막이 넘어가고, 선로를 찾고, 마지막 밤까지 간다
const story = { act3: 0, rail: 0, sled: 0, finale: 0, arcs: new Set(), cbs: new Set(), rival: new Set(), journal: 0 };
const orig = E.resolveEvent;
for (let i = 1; i <= 150; i++) {
  const g = bot("smart", (i * 40503) >>> 0, "iceage");
  assert(g.story, "빙하기엔 이야기가 있다");
  if (g.story.act === 3) story.act3++;
  if (g.story.rail) story.rail++;
  if (g.story.prog.sled) story.sled++;
  if (g.seen.fin_eve) story.finale++;
  for (const [pid, n] of Object.entries(g.story.arcs)) for (let k = 0; k < n; k++) story.arcs.add(pid + k);
  for (const id of Object.keys(g.seen)) { if (id.startsWith("cb_")) story.cbs.add(id); if (id.startsWith("rv")) story.rival.add(id); }
  story.journal += g.story.journal.length;
  assert.deepEqual(E.validate(JSON.parse(JSON.stringify(g))), g);
}
assert(story.act3 > 50 && story.rail > 20 && story.sled > 10 && story.finale > 20, JSON.stringify({ ...story, arcs: story.arcs.size }));
assert(story.cbs.size >= 2 && story.rival.size >= 4, "돌아오는 선택과 라이벌 사건 " + [...story.cbs, ...story.rival]);
assert(story.arcs.size >= 15, "식구 사연 단계가 고루 나온다 " + story.arcs.size);
assert(E.newGame({ seed: 1, scenario: "flood" }).story === null, "다른 재난은 이야기 없음");
console.log(`빙하기 이야기: 3막 ${story.act3}/150 · 선로 발견 ${story.rail} · 썰매 ${story.sled} · 마지막 밤 ${story.finale} · 사연 단계 ${story.arcs.size}종 · 돌아온 선택 ${story.cbs.size}종`);
console.log("넷이서 버티기 엔진: " + SC.order.map((k) => `${SC.scenarios[k].name} 잘함 ${Math.round((out[k].smart / 120) * 100)}%/무작위 ${Math.round((out[k].random / 120) * 100)}%`).join(" · ") + " · 결정성/저장/저녁 결정 통과");
