"use strict";
// 첫 장(동장 선거) 계절 엔진 검사: 콘텐츠 규격, 입력 불변, 저장/난수 복원, 매 판 변화, 봇 균형.
const assert = require("node:assert/strict");
const E = require("../src/engine/season"),
  C = require("../src/content/harbor"),
  H = require("../src/shared/harbor");
const { bot } = require("./sim-season");

const allowed = new Set(["money", "votes", "plan", "prepared", "progress", "contract", "promise",
  "witness", "dirt", "secret", "relation", "platform", "training", "memory"]);
assert.equal(new Set(C.events.map((e) => e.id)).size, C.events.length);
for (const e of C.events) {
  assert(e.lines.length <= 3 && e.lines.every((l) => typeof l === "string" && l.length < 140), e.id);
  assert.equal(e.choices.length, e.kind === "minor" ? 2 : e.kind === "major" ? 3 : 1, e.id);
  assert(C.people.some((p) => p.id === e.who), e.id);
  for (const c of e.choices) {
    for (const k of Object.keys(c.effects)) assert(allowed.has(k), `${e.id}.${c.id}: ${k}`);
    for (const k of Object.keys(c.effects.votes || {})) assert(["harbor", "fishing", "hill"].includes(k));
    if (c.effects.money < 0) assert(c.requires.money >= -c.effects.money, `${e.id}.${c.id} 비용 조건`);
  }
}
for (const [id, t] of Object.entries(C.rivalTypes))
  for (const p of [...t.targets, ...t.lateTargets, ...Object.keys(t.effects)])
    assert(C.places.some((l) => l.id === p), `${id}: ${p}`);
for (const [id, c] of Object.entries(C.crises)) {
  assert(C.places.some((l) => l.id === c.place), id);
  assert(c.dues.every((d) => d >= 0 && d < E.ELECTION_TURN), id);
}

// 입력 불변·중복 선택·정원·결정성
let s = E.fresh({ seed: 7 }),
  raw = JSON.stringify(s);
assert.equal(s.version, 2);
assert.equal(E.advance(s).state, s, "사건이 열려 있으면 진행 불가");
assert.equal(JSON.stringify(s), raw);
s = E.choose(s, "plan", "long").state;
const cash = s.money;
assert.equal(E.choose(s, "plan", "long").state, s);
assert.equal(s.money, cash);
s = { ...s, lastResult: null };
s = E.place(s, "head", "tavern").state;
assert.match(E.place(s, "kin", "tavern").error, /자리/);
assert.equal(E.place(s, "outsider", "dock").state, s);
const before = JSON.stringify(s);
const next = E.advance(s).state;
assert.equal(JSON.stringify(s), before);
assert.deepEqual(next, E.advance(JSON.parse(before)).state, "같은 상태면 같은 결과");
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(next))), next);
assert.throws(() => E.validate({ ...next, version: 1 }));
assert.throws(() => E.validate({ ...next, turn: 99 }));
assert.throws(() => E.validate({ ...next, money: null }));
assert.throws(() => E.validate({ ...next, votes: { harbor: 500, fishing: 1, hill: 1 } }));
assert.match(next.reports[0].lines[0], /예상 득표 \d+% → \d+%/);

// 득표 = 구역 득표의 인구 가중 평균
const t = E.fresh({ seed: 3 });
t.votes = { harbor: 60, fishing: 40, hill: 50 };
assert.equal(E.share(t), Math.round((60 * 48 + 40 * 26 + 50 * 12) / 86));
t.flooded = 18;
assert.equal(E.share(t), Math.round((60 * 48 + 40 * 8 + 50 * 12) / 68));

// 매 판 달라지는 것: 가족 이름·성향·구성, 라이벌 성격, 위기
const variety = { names: new Set(), traits: new Set(), roles: new Set(), rivals: new Set(), crises: new Set(), dues: new Set() };
for (let seed = 1; seed <= 200; seed++) {
  const g = E.fresh({ seed: seed * 101 });
  g.family.slice(1).forEach((p) => (variety.names.add(p.name), variety.roles.add(p.role)));
  g.family.forEach((p) => variety.traits.add(p.trait));
  assert.equal(new Set(g.family.map((p) => p.trait)).size, 3, "한 집안에 성향 중복 없음");
  variety.rivals.add(g.rival.type);
  variety.crises.add(g.crisis.kind);
  variety.dues.add(g.crisis.due);
  assert.match(g.reports[0].lines[0], /이번 장의 목표/);
}
assert(variety.names.size >= 12 && variety.traits.size === Object.keys(C.traits).length);
assert(variety.roles.size >= 5 && variety.rivals.size === 3 && variety.crises.size === 4 && variety.dues.size >= 4);

// 봇 균형과 도달성
const seen = new Set(),
  counts = {};
for (const st of ["careful", "short", "random", "greedy"]) {
  counts[st] = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const g = bot(st, seed * 7919);
    assert(g.ended && g.election && g.turn === E.ELECTION_TURN && g.flooded !== null);
    assert.equal(E.advance(g).state, g);
    assert.equal(g.history.length, E.ELECTION_TURN);
    g.seen.forEach((id) => seen.add(id));
    counts[st] += g.election.won;
  }
}
for (const e of C.events) if (e.kind !== "climax") assert(seen.has(e.id), "도달 불가 사건: " + e.id);
const rate = (k) => counts[k] / 400;
assert(rate("careful") >= 0.55 && rate("careful") <= 0.9, "장기 대비 전략 승률 " + rate("careful"));
assert(rate("short") >= 0.5 && rate("short") <= 0.9, "짧은 제방 전략 승률 " + rate("short"));
assert(rate("random") < 0.2 && rate("greedy") < 0.1, "아무렇게나 해도 이기면 안 됨");
assert.equal(H.floodLoss("long"), 0);
assert.equal(H.floodLoss("short"), 18);
assert.equal(H.floodLoss("none"), 34);
console.log(
  `계절 엔진 v2: 사건 ${C.events.length}개 도달 · 매 판 변화(가족 ${variety.names.size}명·성향 ${variety.traits.size}·라이벌 3·위기 4) · 저장/난수 복원 · 입력 불변 통과`,
);
console.log("승률(400판):", Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Math.round((v / 400) * 100) + "%"])));
