"use strict";
// 생존 맛보기 엔진 검사: 콘텐츠 규격, 입력 불변·결정성·저장, 판정 확률, 봇 균형.
const assert = require("node:assert/strict");
const E = require("../survive/engine"), D = require("../survive/data");
const { bot } = require("./sim-survive");
for (const sc of D.scenes) {
  assert(sc.approaches.length >= 2 && sc.approaches.length <= 3, sc.id);
  for (const a of sc.approaches) assert(D.stats[a.stat] && Number.isInteger(a.dc) && a.win && a.lose, sc.id);
}
for (const k of Object.keys(D.places)) assert(D.scenes.filter((x) => x.loc === k).length >= 2, "장소마다 장면 2개 이상: " + k);
for (const e of D.events) assert(e.choices.some((c) => !c.need), "조건 없는 선택지: " + e.id);
let s = E.dismiss(E.newGame({ name: "검사", seed: 9 })).state;
assert.equal(s.phase, "day");
const raw = JSON.stringify(s);
const worker = s.people.find((p) => E.canWork(s, p));
const a = E.setJob(s, worker.id, "fish").state;
assert.equal(JSON.stringify(s), raw, "입력 불변");
const n1 = E.endDay(a).state;
assert.deepEqual(n1, E.endDay(JSON.parse(JSON.stringify(a))).state, "결정성");
assert.equal(n1.phase, "night");
const go = n1.people.find((p) => E.canGo(n1, p));
const ex = E.startExp(n1, "store", [go.id]).state;
const v = E.sceneView(ex);
for (const ap of v.approaches) assert.equal(ap.p, Math.min(0.95, Math.max(0.05, Math.round(((21 - (ap.dc - ap.mod)) / 20) * 100) / 100)));
const r1 = E.choose(ex, 0).state;
assert.deepEqual(r1, E.choose(JSON.parse(JSON.stringify(ex)), 0).state, "새로고침해도 같은 주사위");
assert(r1.exp.result && typeof r1.exp.result.roll === "number");
const home = E.proceed(r1, false).state;
assert(["dawn", "end"].includes(home.phase) && home.report);
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(home))), home);
assert.throws(() => E.validate({ ...home, v: 7 }));
// 매 판 다른 주민 구성과 폭우 시기
const rosters = new Set(), storms = new Set();
for (let i = 1; i <= 40; i++) { const g = E.newGame({ seed: i * 7919 }); rosters.add(g.people.map((p) => p.id).sort().join()); storms.add(g.storms.map((t) => t.day).join()); }
assert(rosters.size > 15 && storms.size > 5);
// 봇 균형: 잘해도 사람을 잃고, 아무렇게나 하면 폭동·몰살이 잦아야 한다
const out = {};
for (const st of ["smart", "random"]) {
  out[st] = { end: {}, alive: 0 };
  for (let i = 1; i <= 200; i++) {
    const g = bot(st, (i * 2654435761) >>> 0);
    assert(g.ending && D.endings[g.ending]);
    out[st].end[g.ending] = (out[st].end[g.ending] || 0) + 1;
    out[st].alive += E.alive(g).length / g.total;
  }
}
const allRate = (out.smart.end.all || 0) / 200, badRandom = ((out.random.end.riot || 0) + (out.random.end.lost || 0)) / 200;
assert(allRate < 0.5, "모두 살리기는 어려워야 함 " + allRate);
assert(badRandom > 0.3, "아무렇게나 하면 무너져야 함 " + badRandom);
assert(out.smart.alive > out.random.alive);
console.log(`생존 맛보기 엔진: 장면 ${D.scenes.length} · 사건 ${D.events.length} · 결정성/저장/판정 확률 통과 · 잘함 생존율 ${Math.round((out.smart.alive / 200) * 100)}% / 무작위 ${Math.round((out.random.alive / 200) * 100)}%`);
