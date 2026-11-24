"use strict";
const assert = require("node:assert/strict");
const E = require("../src/engine/season"),
  C = require("../src/content/harbor"),
  H = require("../src/shared/harbor");
assert.deepEqual(
  ["minor", "major", "climax"].map(
    (k) => C.events.filter((e) => e.kind === k).length,
  ),
  [10, 12, 3],
);
assert.equal(new Set(C.events.map((e) => e.id)).size, 25);
const allowed = new Set([
  "money",
  "influence",
  "fame",
  "support",
  "plan",
  "prepared",
  "progress",
  "contract",
  "promise",
  "witness",
  "secret",
  "relation",
  "candidate",
  "platform",
  "training",
  "memory",
]);
for (const e of C.events) {
  assert(e.lines.length <= 3);
  assert(e.lines.every((l) => typeof l === "string" && l.length < 140));
  assert.equal(
    e.choices.length,
    e.kind === "minor" ? 2 : e.kind === "major" ? 3 : 1,
  );
  for (const c of e.choices) {
    for (const k of Object.keys(c.effects)) assert(allowed.has(k), k);
    if (c.effects.money < 0) assert(c.requires.money >= -c.effects.money);
  }
}
let s = E.fresh({ seed: 7 }),
  raw = JSON.stringify(s);
assert.equal(E.advance(s).state, s);
assert.equal(JSON.stringify(s), raw);
s = E.choose(s, "plan", "long").state;
const cash = s.money;
assert.equal(E.choose(s, "plan", "long").state, s);
assert.equal(s.money, cash);
s = E.place(s, "head", "tavern").state;
assert.match(E.place(s, "kin", "tavern").error, /자리/);
assert.equal(E.place(s, "outsider", "dock").state, s);
const before = JSON.stringify(s);
const next = E.advance(s).state;
assert.equal(JSON.stringify(s), before);
assert.deepEqual(next, E.advance(JSON.parse(before)).state);
assert.deepEqual(E.validate(JSON.parse(JSON.stringify(next))), next);
assert.throws(() => E.validate({ ...next, version: 0 }));
assert.throws(() => E.validate({ ...next, turn: 99 }));
assert.throws(() => E.validate({ ...next, money: null }));
const counts = {
    careful: { safe: 0, won: 0 },
    random: { safe: 0, won: 0 },
    greedy: { safe: 0, won: 0 },
  },
  seen = new Set(),
  choicesSeen = new Set();
function play(seed, strategy) {
  let game = E.fresh({ seed });
  let draw = seed >>> 0;
  const rand = (max) => {
    draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0;
    return Math.floor((draw / 2 ** 32) * max);
  };
  for (let turn = 0; turn <= 12; turn++) {
    let guard = 0;
    while (game.queue.length) {
      assert(++guard < 5, "event queue must terminate");
      const event = C.events.find((e) => e.id === game.queue[0]);
      seen.add(event.id);
      const possible = event.choices.filter((c) => !E.choiceReason(game, c));
      assert(possible.length, "no affordable choice");
      let choice = possible[rand(possible.length)];
      if (strategy === "careful") {
        const ids = {
          plan: "long",
          offer: "accept",
          promise: "pledge",
          witness: "publish",
          labor: "join",
          warning: "repair",
          campaign: "run",
          thanks: "people",
        };
        choice =
          possible.find((c) => c.id === ids[event.id]) ||
          possible.find((c) => c.effects.support > 0) ||
          possible.at(-1);
      }
      choicesSeen.add(event.id + "." + choice.id);
      const snapshot = JSON.stringify(game);
      const result = E.choose(game, event.id, choice.id);
      assert(!result.error);
      assert.equal(JSON.stringify(game), snapshot);
      game = result.state;
      assert.equal(E.choose(game, event.id, choice.id).state, game);
    }
    if (turn === 12) break;
    assert.equal(game.turn, turn);
    for (const person of game.family) {
      let location;
      if (strategy === "careful")
        location =
          turn < 5
            ? person.id === "head"
              ? "dock"
              : "gate"
            : person.id === "head"
              ? "dock"
              : "union";
      else if (strategy === "greedy")
        location = person.id === "head" ? "company" : "dock";
      else location = C.places[rand(C.places.length)].id;
      const result = E.place(game, person.id, location);
      if (!result.error) game = result.state;
    }
    const saved = E.validate(JSON.parse(JSON.stringify(game)));
    const advanced = E.advance(game);
    assert(!advanced.error);
    assert.deepEqual(advanced, E.advance(saved), "reload cannot reroll");
    game = advanced.state;
    assert(game.queue.length <= 2);
    assert.equal(game.history.length, turn + 1);
  }
  assert(game.ended);
  assert.equal(game.turn, 12);
  assert(game.election);
  assert(game.flooded !== null);
  assert.equal(E.advance(game).state, game);
  counts[strategy].safe += game.flooded === 0;
  counts[strategy].won += game.election.won;
  return game;
}
for (let seed = 1; seed <= 1000; seed++)
  for (const strategy of Object.keys(counts)) play(seed, strategy);
assert.equal(seen.size, 25, "every event must be reachable");
assert(counts.careful.safe > counts.random.safe);
assert(counts.careful.won > counts.greedy.won);
assert.equal(H.floodLoss("long"), 0);
assert.equal(H.floodLoss("short"), 18);
assert.equal(H.floodLoss("none"), 34);
console.log(
  "계절 엔진: 25개 사건 도달 · 3전략×1,000판 완료 · 저장/난수 복원 · 중복 선택/정원/입력 불변 통과",
);
console.log(JSON.stringify(counts));
