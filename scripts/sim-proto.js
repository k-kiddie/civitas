"use strict";
// 맛보기 균형 검사: node scripts/sim-proto.js [판 수]
const P = require("../proto/engine"), D = require("../proto/data");
function bot(strategy, seed) {
  let s = P.newGame({ name: "봇", seed }), draw = seed >>> 0, guard = 0;
  const r = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  const reach = { t1: null, t2: null };
  const val = (fx) => !fx ? 0 : (typeof fx.money === "number" ? fx.money : fx.money ? -60 : 0) / 3 + (fx.fame || 0) * 1.6 + (fx.health || 0) / (s.health < 50 ? 1.5 : 5) + (fx.title ? 60 : 0) + (fx.ending ? 200 : 0) + (fx.recruit ? 8 : 0) + (fx.dirt || 0) * 4 + (fx.resolve ? 25 : 0) + (fx.block ? 14 : 0) - (fx.duelLoss ? 18 : 0) + (fx.loyalty ? fx.loyalty[1] * 2 : 0) - (fx.loseSibling ? 30 : 0) - (fx.threat ? 15 : 0) - (fx.hostility || 0) / 4 - (fx.rivalFame || 0) * 1.2;
  while (!s.ending) {
    if (++guard > 400) throw Error("stuck");
    if (s.result || s.summary) { s = P.dismiss(s).state; continue; }
    if (s.perkChoice) { s = P.pickPerk(s, s.perkChoice[0]).state; continue; }
    if (s.event) {
      const v = P.view(s), e = P.getEvent(s, s.event.id);
      const ok = v.choices.filter((c) => !c.reason);
      let c;
      if (strategy === "random") c = ok[r(ok.length)];
      else c = ok.map((c) => { const raw = e.choices[c.i]; return { c, v: raw.odds !== undefined ? c.odds * val(raw.win.fx) + (1 - c.odds) * val(raw.lose.fx) : val(raw.fx) }; }).sort((a, b) => b.v - a.v)[0].c;
      const res = P.choose(s, c.i); if (res.error) throw Error(res.error); s = res.state; continue;
    }
    if (strategy === "smart") {
      const f = s.threats.find((t) => t.id === "flood");
      const wants = [f && "dike", "press", "school", "factory", "tavern", s.buildings.length < 2 && "stall"].filter(Boolean);
      for (const b of wants) if (!P.buildReason(s, b) && (b === "dike" || s.money - P.buildCost(s, b) > 25)) { s = P.build(s, b).state; break; }
      if (s.result) continue;
    }
    if (s.ap <= 0) { s = P.endSeason(s).state; delete s._camp; if (s.title >= 1 && reach.t1 === null) reach.t1 = s.season; if (s.title >= 2 && reach.t2 === null) reach.t2 = s.season; continue; }
    let loc;
    const open = D.locations.filter((l) => P.unlocked(s, l));
    if (strategy === "random") loc = open[r(open.length)].id;
    else {
      const at = P.nextElection(s);
      const bribe = 10 + s.title * 10;
      const block = s.plans.find((p) => {
        if (p.blocked || !open.some((l) => l.id === p.loc)) return false;
        const m = D.rivalMoves.find((x) => x.id === p.id);
        const big = (m.fail.health || 0) <= -10 || (m.fail.fame || 0) <= -4 || (m.fail.rivalFame || 0) >= 5;
        const winP = Math.max(0.35, 0.6 + (s.fame - s.rivalFame) / 80);
        return big && (s.dirt >= 1 || s.money >= bribe + 10 || winP >= 0.5);
      });
      if (s.health < 25) loc = "home";
      else if ((at !== null && at - s.season <= 1 && P.canElect(s) && !s.flags.bought && !s._camp) || (s.dirt >= 3 && s.title >= 1)) { loc = "hall"; s._camp = true; }
      else if (s.title >= 2 && s.fame >= 110) loc = "manor";
      else if (s.threats.some((t) => ["assassin", "customs"].includes(t.id)) && s.money >= 40) loc = "alley";
      else if (s.threats.some((t) => t.id === "plague") && s.money >= 25) loc = "market";
      else if (s.money < 8 || (s.threats.some((t) => t.id === "debt"))) loc = "dock";
      else if (block) loc = block.loc;
      else if (s.opps.length && s.money >= 35) loc = s.opps[0].loc;
      else loc = s.title >= 1 ? ["union", "fishing", "union", "alley"][r(4)] : ["fishing", "fishing", "fishing", "alley", "dock"][r(5)];
    }
    const res = P.visit(s, loc); if (res.error) throw Error(res.error + " " + loc); s = res.state;
  }
  return { s, reach };
}
if (require.main === module) {
  const N = Number(process.argv[2]) || 500;
  for (const st of ["smart", "random"]) {
    const end = {}; let t1 = 0, t2 = 0, t1s = 0, t2s = 0, seasons = 0;
    for (let i = 1; i <= N; i++) {
      const { s, reach } = bot(st, i * 2654435761 >>> 0);
      end[s.ending] = (end[s.ending] || 0) + 1; seasons += s.season;
      if (reach.t1 !== null) { t1++; t1s += reach.t1; } if (reach.t2 !== null) { t2++; t2s += reach.t2; }
    }
    console.log(st, JSON.stringify(end), "동장", Math.round(t1 / N * 100) + "%", "(평균 " + (t1s / Math.max(1, t1)).toFixed(1) + "계절)", "시장", Math.round(t2 / N * 100) + "%", "(평균 " + (t2s / Math.max(1, t2)).toFixed(1) + ")", "평균 길이", (seasons / N).toFixed(1));
  }
}
module.exports = { bot };
