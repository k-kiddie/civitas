"use strict";
// 생존 맛보기 균형 검사: node scripts/sim-survive.js [판 수]
const E = require("../survive/engine"), D = require("../survive/data");
function bot(strategy, seed) {
  let s = E.newGame({ name: "봇", seed }), guard = 0, draw = seed >>> 0;
  const r = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  while (!s.ending) {
    if (++guard > 2000) throw Error("stuck " + s.phase);
    if (s.phase === "dawn" || (s.phase === "end" && s.report)) {
      if (s.event && !s.eventResult) {
        const v = E.eventView(s);
        const ok = v.choices.filter((c) => !c.reason);
        const c = strategy === "random" ? ok[r(ok.length)] : ok[0];
        s = E.resolveEvent(s, c.i).state;
      } else s = E.dismiss(s).state;
      continue;
    }
    if (s.phase === "day") {
      // 사람마다 누르지 않고 방침 하나만 고른다
      const storm = E.nextStorm(s), n = E.need(s);
      let pol = "balanced";
      if (strategy === "random") pol = ["balanced", "dike", "fish", "wood", "care", "rest"][r(6)];
      else if (storm && s.dike < storm.need && storm.day - s.day <= 3) pol = "dike";
      else if (s.food < n.food * 2) pol = "fish";
      else if (E.alive(s).some((p) => p.hp >= 2)) pol = "care";
      if (pol !== s.policy) s = E.setPolicy(s, pol).state;
      s = E.setRation(s, strategy === "random" ? ["full", "normal", "half"][r(3)] : s.food >= n.food * 3 ? "normal" : "half").state;
      s = E.endDay(s).state;
      continue;
    }
    if (s.phase === "night") {
      const rec = E.recommend(s);
      if (!rec.party.length || (strategy !== "random" && r(5) === 0)) { s = E.skipNight(s).state; continue; }
      if (strategy === "random") {
        const goers = s.people.filter((p) => E.canGo(s, p));
        s = E.startExp(s, Object.keys(D.places)[r(5)], goers.slice(0, 1 + r(2)).map((p) => p.id)).state;
      } else s = E.startExp(s, rec.loc, rec.party).state;
      continue;
    }
    if (s.phase === "exp") {
      if (!s.exp.result) {
        const v = E.sceneView(s);
        const a = strategy === "random" ? v.approaches[r(v.approaches.length)] : v.approaches.slice().sort((x, y) => y.p - x.p)[0];
        s = E.choose(s, a.i).state;
      } else s = E.proceed(s, strategy === "random" ? r(2) === 0 : s.exp.result.success && s.exp.step < 1).state;
      continue;
    }
  }
  return s;
}
if (require.main === module) {
  const N = Number(process.argv[2]) || 400;
  for (const st of ["smart", "random"]) {
    const end = {}; let alive = 0, days = 0;
    for (let i = 1; i <= N; i++) {
      const s = bot(st, (i * 2654435761) >>> 0);
      end[s.ending] = (end[s.ending] || 0) + 1; alive += E.alive(s).length / s.total; days += s.day;
    }
    console.log(st, JSON.stringify(end), "생존율", Math.round((alive / N) * 100) + "%", "평균 일수", (days / N).toFixed(1));
  }
}
module.exports = { bot };
