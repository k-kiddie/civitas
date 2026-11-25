"use strict";
// 「넷이서 버티기」 균형 검사: node scripts/sim-survive.js [판 수]
const E = require("../survive/engine");
function bot(strategy, seed, scenario = "random") {
  let s = E.newGame({ name: "봇", seed, scenario }), guard = 0, draw = seed >>> 0;
  const r = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  while (!s.ending) {
    if (++guard > 3000) throw Error("stuck " + s.phase);
    if (s.phase === "dawn") {
      if (s.event && !s.eventResult) {
        const ok = E.eventView(s).choices.filter((c) => !c.reason);
        s = E.resolveEvent(s, (strategy === "random" ? ok[r(ok.length)] : ok[0]).i).state;
      } else s = E.dismiss(s).state;
      continue;
    }
    if (s.phase === "evening") {
      if (strategy === "random") {
        for (const p of E.alive(s)) if (r(3) === 0) { const x = E.toggleFeed(s, p.id); if (!x.error) s = x.state; }
      }
      const rec = E.recommend(s);
      const go = strategy === "random" ? r(2) === 0 : rec.party.length && (s.food < 8 || s.wood < 3 || r(3) > 0);
      if (go && rec.party.length) {
        const party = strategy === "random" ? rec.party.slice(0, 1 + r(2)) : rec.party.slice(0, E.alive(s).filter((p) => !p.child).length > 2 ? 2 : 1);
        for (const id of party) s = E.toggleSend(s, id).state;
        const places = Object.keys(E.scen(s).places);
        s = E.setPlace(s, strategy === "random" ? places[r(places.length)] : rec.loc).state;
      }
      s = E.nightfall(s).state;
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
  const N = Number(process.argv[2]) || 300;
  for (const sc of ["nuclear", "iceage", "flood"]) for (const st of ["smart", "random"]) {
    const end = {}; let alive = 0, days = 0;
    for (let i = 1; i <= N; i++) {
      const s = bot(st, (i * 2654435761) >>> 0, sc);
      end[s.ending] = (end[s.ending] || 0) + 1; alive += E.alive(s).length / s.total; days += s.day;
    }
    console.log(sc.padEnd(8), st.padEnd(6), JSON.stringify(end), "생존율", Math.round((alive / N) * 100) + "%", "평균", (days / N).toFixed(1) + "일");
  }
}
module.exports = { bot };
