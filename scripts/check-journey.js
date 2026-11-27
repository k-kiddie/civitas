"use strict";
// 「남행」 검사: 콘텐츠 참조, 결정성, 저장, 가방, 잠긴 선택, 봇 완주와 이야기 다양성
const assert = require("node:assert/strict");
const E = require("../journey/engine"), C = require("../journey/content");
const { bot } = require("./sim-journey");
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
for (const [k, p] of Object.entries(C.places)) if (p.ev) assert(C.events[p.ev], `장소 ${k}의 사건`);
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
while (e.phase === "event" && guard++ < 20) {
  const v = E.view(e);
  if (v.result) { e = E.cont(e).state; continue; }
  const locked = v.choices.find((c) => c.lock);
  if (locked) assert(E.choose(e, locked.i).error, "잠긴 선택 거부");
  e = E.choose(e, v.choices.find((c) => !c.lock).i).state;
}
assert.equal(e.phase, "camp", "사건이 끝나면 야영");
// 가방이 넘치면 떠날 수 없다
let b = JSON.parse(JSON.stringify(e));
while (b.bag.length <= E.BAG) b.bag.push({ k: "scrap", u: 0 });
assert(E.sleep(b).error, "가방이 넘치면 밤을 못 보낸다");
assert(E.drop(b, "radio").error, "단서 물건은 못 버린다");
b = E.drop(b, "scrap").state; assert(!E.sleep(b).error);
// 저장
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(e))), e);
assert.throws(() => E.validate({ v: 0 }));
// 봇: 끝까지 가고, 전제·반전·결말·제목이 다양하다
const out = { end: {}, prem: new Set(), titles: new Set(), twisted: 0, payoff: 0, N: 240 };
for (let i = 1; i <= out.N; i++) {
  const o = ["parent", "deserter", "drifter"][i % 3];
  for (const style of ["smart", "random"]) {
    const g = bot((i * 2654435761) >>> 0, o, style);
    assert.equal(g.phase, "end");
    assert(C.endings[g.ending.key], "결말 " + g.ending.key);
    if (style === "smart") { out.end[g.ending.key] = (out.end[g.ending.key] || 0) + 1; out.prem.add(g.dir.premise + g.dir.twist); out.titles.add(g.title); if (g.dir.twisted) out.twisted++; if (g.dir.payoffDone) out.payoff++; }
  }
}
assert(out.prem.size >= 6, "전제×반전 6가지 모두 나온다 " + [...out.prem]);
assert(Object.keys(out.end).length >= 5, "결말 5가지 이상 " + JSON.stringify(out.end));
assert(out.titles.size >= 8, "이야기 제목 8가지 이상");
assert(out.twisted / out.N > 0.7, "대부분 반전까지 간다");
console.log(`남행 엔진: 결말 ${JSON.stringify(out.end)} · 전제×반전 ${out.prem.size}종 · 제목 ${out.titles.size}종 · 반전 ${Math.round((out.twisted / out.N) * 100)}% · 회수 ${Math.round((out.payoff / out.N) * 100)}% · 결정성/저장/가방 통과`);
