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
      const workers = s.people.filter((p) => E.canWork(s, p));
      const storm = E.nextStorm(s);
      const hurt = E.alive(s).some((p) => p.hp >= 1);
      if (strategy === "random") {
        const jobs = Object.keys(D.jobs);
        for (const p of workers) s = E.setJob(s, p.id, jobs[r(jobs.length)]).state;
        s = E.setRation(s, ["full", "normal", "half"][r(3)]).state;
      } else {
        const order = workers.slice().sort((a, b) => b.stats.craft - a.stats.craft);
        order.forEach((p, i) => {
          let job;
          const dikeNeed = storm && s.dike < storm.need && storm.day - s.day <= 4;
          if (p.stress >= 75) job = "rest";
          else if (dikeNeed && i < 2) job = "dike";
          else if (hurt && i === order.length - 1) job = "care";
          else job = s.food < 12 ? "fish" : s.wood < 4 ? "wood" : i % 2 ? "fish" : "dike";
          s = E.setJob(s, p.id, job).state;
        });
        s = E.setRation(s, s.food >= 18 ? "normal" : "half").state;
      }
      s = E.endDay(s).state;
      continue;
    }
    if (s.phase === "night") {
      const goers = s.people.filter((p) => E.canGo(s, p) && p.stress < 80).sort((a, b) => b.stats.force + b.stats.wits - a.stats.force - a.stats.wits);
      if (!goers.length || (strategy !== "random" && r(4) === 0)) { s = E.skipNight(s).state; continue; }
      const hurtMeds = E.alive(s).some((p) => p.hp >= 2) && s.meds < 2;
      const loc = strategy === "random" ? Object.keys(D.places)[r(5)] : hurtMeds ? "pharmacy" : s.wood < 4 ? "mill" : s.food < 15 ? "store" : ["wreck", "store", "mill"][r(3)];
      s = E.startExp(s, loc, goers.slice(0, strategy === "random" ? 1 + r(2) : 2).map((p) => p.id)).state;
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
