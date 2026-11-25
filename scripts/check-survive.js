"use strict";
// 「넷이서 버티기」 엔진 검사: 시나리오 콘텐츠 규격, 저녁 결정, 탐색 판정, 결정성·저장, 매 판 변화, 봇 균형.
const assert = require("node:assert/strict");
const E = require("../survive/engine"), D = require("../survive/data"), SC = require("../survive/scenarios");
const { bot } = require("./sim-survive");
for (const [k, sc] of Object.entries(SC.scenarios)) {
  for (const w of ["food", "wood", "meds", "threat", "goal", "rival", "shelter"]) assert(sc.words[w], `${k}.${w}`);
  assert(sc.people.filter((p) => !p.child).length >= 5, k + " 인물 5명 이상");
  for (const pl of Object.keys(sc.places)) assert(sc.scenes.filter((x) => x.loc === pl).length >= 2, `${k}: ${pl} 장면 2개 이상`);
  assert(sc.scenes.some((x) => x.loc === null), k + " 귀갓길 장면");
  for (const x of sc.scenes) for (const a of x.approaches) {
    assert(D.stats[a.stat] && Number.isInteger(a.dc) && a.win && a.lose, x.id);
    if (a.tool) assert(D.tools[a.tool], x.id);
  }
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
for (const ap of v.approaches) assert.equal(ap.p, Math.min(0.95, Math.max(0.05, Math.round(((21 - (ap.dc - ap.mod)) / 20) * 100) / 100)));
const r1 = E.choose(n1, 0).state;
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
console.log("넷이서 버티기 엔진: " + SC.order.map((k) => `${SC.scenarios[k].name} 잘함 ${Math.round((out[k].smart / 120) * 100)}%/무작위 ${Math.round((out[k].random / 120) * 100)}%`).join(" · ") + " · 결정성/저장/저녁 결정 통과");
