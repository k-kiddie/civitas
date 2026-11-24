"use strict";
// 맛보기 엔진 검사: 콘텐츠 규격, 입력 불변, 결정성, 저장 복원, 봇 균형·도달성.
const assert = require("node:assert/strict");
const P = require("../proto/engine"), D = require("../proto/data");
const { bot } = require("./sim-proto");
const ids = new Set();
for (const e of D.events) {
  assert(!ids.has(e.id), "중복 id " + e.id); ids.add(e.id);
  assert(D.locations.some((l) => l.id === e.loc), e.id);
  assert(e.choices.length >= 2 && e.choices.length <= 4, e.id);
  assert(e.choices.some((c) => !c.need), "조건 없는 선택지가 하나는 있어야 함: " + e.id);
  assert(e.text.length < 120, e.id);
  for (const c of e.choices) {
    if (c.odds !== undefined || c.check) assert(c.win && c.lose, e.id);
    else assert(c.fx && c.text, e.id);
  }
}
for (const l of D.locations) assert(D.events.some((e) => e.loc === l.id && e.repeat), "장소마다 반복 사건 필요: " + l.id);
// 입력 불변·결정성·저장
let s = P.newGame({ name: "검사", seed: 42 });
const raw = JSON.stringify(s);
const a = P.visit(s, "dock").state;
assert.equal(JSON.stringify(s), raw, "입력 불변");
assert.deepEqual(a, P.visit(JSON.parse(raw), "dock").state, "같은 입력이면 같은 사건");
assert.match(P.visit(a, "fishing").error, /사건부터/);
assert.match(P.visit(s, "union").error, /동장 이상/);
const b = P.choose(a, 0).state;
assert.deepEqual(b, P.choose(JSON.parse(JSON.stringify(a)), 0).state, "새로고침해도 결과가 같다");
assert.deepEqual(P.validate(JSON.parse(JSON.stringify(b))), b);
assert.throws(() => P.validate({ ...b, v: 9 }));
assert(b.result && Array.isArray(b.result.deltas));
// 위협: 제방 없으면 장마 피해, 있으면 명성
let w = P.newGame({ seed: 5 });
for (let i = 0; i < 6; i++) { w = { ...w, ap: 0 }; w = P.endSeason(w).state; w = P.dismiss(w).state; }
assert(!w.threats.some((t) => t.id === "flood"));
assert(w.log.length >= 1);
// TRPG 판정: 확률 = (21 − (난이도 − 보정)) / 20, 실패 시 운명으로 한 번 다시 굴림, 특기 고르기
{
  let g = P.newGame({ name: "판정", seed: 77 });
  g.event = { id: "d_fight" };
  const v = P.view(g);
  const c = v.choices.find((x) => x.check && x.check.stat === "talk");
  assert.equal(c.check.dc, 13);
  assert.equal(c.check.p, Math.min(0.95, Math.max(0.05, (21 - (13 - c.check.mod)) / 20)));
  let tries = 0, failed = null;
  for (let seed = 1; seed < 200 && !failed; seed++) {
    const t = { ...JSON.parse(JSON.stringify(g)), rng: seed };
    const r = P.choose(t, c.i).state;
    tries++;
    if (r.result.success === false) failed = r;
    else assert(r.result.check.total >= 13 || r.result.check.crit);
  }
  assert(failed && failed.result.pre, "실패하면 다시 굴릴 수 있다");
  const rr = P.reroll(failed).state;
  assert.equal(rr.fate, failed.fate - 1);
  assert.equal(rr.result.pre, null, "판정당 한 번만");
  const h = { ...JSON.parse(JSON.stringify(g)), perkChoice: ["brawler", "lucky", "trader"], event: null };
  const k = P.pickPerk(h, "brawler").state;
  assert.equal(k.family[0].stats.force, h.family[0].stats.force + 1);
  assert.equal(k.perkChoice, null);
  assert(P.pickPerk(h, "orator").error);
}
// 봇
const out = {}, reached = new Set();
for (const st of ["smart", "random"]) {
  out[st] = {};
  for (let i = 1; i <= 300; i++) {
    const { s } = bot(st, (i * 2654435761) >>> 0);
    assert(s.ending && D.endings[s.ending], "결말 필요");
    assert(s.season <= P.LAST_SEASON);
    Object.keys(s.seen).forEach((id) => reached.add(id));
    out[st][s.ending] = (out[st][s.ending] || 0) + 1;
  }
}
const win = (st) => ["ruler", "alliance", "shadow"].reduce((n, k) => n + (out[st][k] || 0), 0) / 300;
assert(win("smart") >= 0.5 && win("smart") <= 0.9, "잘하는 봇 승률 " + win("smart"));
assert(win("random") <= 0.15, "아무렇게나 하면 이기기 어려워야 함 " + win("random"));
const missing = D.events.filter((e) => !reached.has(e.id)).map((e) => e.id);
assert(missing.length <= 3, "도달 못 한 사건: " + missing.join(","));
console.log(`맛보기 엔진: 사건 ${D.events.length}개(미도달 ${missing.length}) · 결정성/저장/입력 불변 통과 · 승률 잘함 ${Math.round(win("smart") * 100)}% / 무작위 ${Math.round(win("random") * 100)}%`);
