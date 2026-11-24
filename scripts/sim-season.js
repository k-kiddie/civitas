"use strict";
// 첫 장 균형 검사: 봇 3종 × N판. node scripts/sim-season.js [판 수]
const E = require("../src/engine/season"), C = require("../src/content/harbor");
const N = Number(process.argv[2]) || 1000;
function bot(strategy, seed) {
  let g = E.fresh({ seed }), draw = seed >>> 0;
  const rand = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  const S0 = strategy; if (strategy === "short") strategy = "careful_s";
  const value = (c) => {
    const e = c.effects, v = e.votes || {};
    if (strategy === "greedy") return (e.money || 0);
    return (v.harbor || 0) * 0.56 + (v.fishing || 0) * 0.3 + (v.hill || 0) * 0.14 + (e.money || 0) / 12 + (e.prepared || 0) * 30 + (e.progress || 0) * 3 + (e.dirt || 0) * 2 + (e.promise ? 2 : 0) + (e.plan === "long" ? 3 : 0);
  };
  while (!g.ended || g.queue.length) {
    let guard = 0;
    while (g.queue.length) {
      if (++guard > 6) throw Error("queue loop");
      const ev = C.events.find((e) => e.id === g.queue[0]);
      const ok = ev.choices.filter((c) => !E.choiceReason(g, c));
      if (!ok.length) throw Error("no choice " + ev.id);
      let c = strategy === "random" ? ok[rand(ok.length)] : ok.slice().sort((a, b) => value(b) - value(a))[0];
      if (S0 === "short" && ev.id === "plan") c = ok.find((x) => x.id === "short");
      if (S0 === "short" && ev.id === "offer") c = ok.find((x) => x.id === "refuse");
      if (strategy === "careful" && ev.id === "offer" && g.plan === "long") c = ok.find((x) => x.id === "accept") || c;
      const r = E.choose(g, ev.id, c.id); if (r.error) throw Error(r.error); g = r.state;
      g = { ...g, lastResult: null };
    }
    if (g.ended) break;
    const crisisPlace = g.crisis && !g.crisis.resolved && g.crisis.due === g.turn ? C.crises[g.crisis.kind].place : null;
    let plan;
    if (strategy === "random") plan = g.family.map(() => C.places[rand(C.places.length)].id);
    else if (strategy === "greedy") plan = ["company", "dock", "dock"];
    else {
      const H = require("../src/shared/harbor"); const needMoney = g.turn < 5 && g.plan && g.plan !== "none" && !g.started && g.money < H.plans[g.plan].cost + 12;
      const rivalAt = (id) => g.rivals.some((r) => r.place === id);
      const pre = g.turn < 5 ? [needMoney ? "dock" : "gate", g.started && !g.built ? "gate" : (needMoney ? "dock" : "union"), rivalAt("square") ? "square" : "union"]
        : ["union", rivalAt("square") ? "square" : "union", g.secret ? "square" : "tavern"];
      plan = pre;
      if (crisisPlace) plan[2] = crisisPlace;
    }
    g.family.forEach((p, i) => { const r = E.place(g, p.id, plan[i]); if (!r.error) g = r.state; });
    const r = E.advance(g); if (r.error) throw Error(r.error); g = r.state;
  }
  return g;
}
const out = {};
if (require.main === module) for (const st of ["careful", "short", "random", "greedy"]) {
  const o = { won: 0, safe: 0, share: 0, secret: 0, crisis: 0, money: 0 };
  for (let seed = 1; seed <= N; seed++) {
    const g = bot(st, seed * 7919);
    o.won += g.election.won; o.safe += g.flooded === 0; o.share += g.election.share; o.secret += g.secret; o.crisis += g.crisis.outcome === "held"; o.money += g.money;
  }
  for (const k of Object.keys(o)) o[k] = k === "share" || k === "money" ? Math.round(o[k] / N) : Math.round((o[k] / N) * 100) + "%";
  out[st] = o;
}
if (require.main === module) console.log(JSON.stringify(out, null, 1));
module.exports = { bot };
