"use strict";
// 「넷이서 버티기」 균형 검사: node scripts/sim-survive.js [판 수]
const E = require("../survive/engine");
// 잘하는 봇의 사건 선택: 자원·희망 이득은 좋게, 죽음·판정 위험은 나쁘게
function score(s, i) {
  const ev = E.eventView(s), all = [...require("../survive/scenarios").commonEvents, ...E.scen(s).events];
  const raw = require("../survive/story")[s.scenario];
  let c = null;
  const def = all.find((e) => e.id === ev.id);
  if (def) c = def.choices[i];
  else if (raw) {
    const m = ev.id.match(/^arc_(.+)_(\d)$/), r = ev.id.match(/^rv(\d)$/), cb = ev.id.match(/^cb_(.+)$/);
    if (m) c = raw.arcs[m[1]][Number(m[2])].choices[i];
    else if (r) c = raw.rival[Number(r[1])].choices[i];
    else if (cb) c = raw.callbacks[cb[1]].choices[i];
    else c = (ev.choices.length > 1 ? raw.finale.eve.choices : [{ fx: {} }])[i];
  }
  const fx = (c && c.fx) || {};
  if (fx.castDie || fx.exile || fx.leaveWeak || ((fx.meds || 0) < 0 && s.meds <= 1 && fx.stance)) return -10;
  let v = (fx.food || 0) * 1 + (fx.wood || 0) * 0.8 + (fx.meds || 0) * (s.meds <= 1 ? 4 : 2) + (fx.hope || 0) * 0.15 + (fx.stance || 0) * 1.5 + (fx.clue || 0) * 3 + (fx.prog ? 4 : 0);
  v += (fx.join ? 3 : 0) + (fx.heal ? 3 : 0) + (fx.castHeal ? 3 : 0) + (fx.radio ? 4 : 0) + (fx.braceThreat ? 3 : 0) + (fx.foodPct || 0) * 8;
  v -= (fx.spread ? 3 : 0) + (fx.isolate ? 1 : 0) + (fx.worsen ? 3 : 0) + (fx.adultsHunger || 0) * 1.5 + (fx.childHunger || 0) * 2 + (fx.hurtRandom ? 2 : 0) + (fx.swim ? 3 : 0) + (fx.lend ? 2 : 0) + (fx.rivalAlert || 0) * 1.5 + (fx.hurtTwo ? 4 : 0);
  v -= Math.max(0, fx.castStress || 0) * 0.04 + Math.max(0, fx.cast2Stress || 0) * 0.04;
  if (fx.check) v -= 2;
  if (fx.castDie || fx.exile) v -= 10;
  if (fx.hurtCast) v -= 2 * fx.hurtCast;
  if (fx.allStress) v -= fx.allStress * 0.05;
  if (fx.leaveWeak) v -= 3;
  return v;
}
function bot(strategy, seed, scenario = "random") {
  let s = E.newGame({ name: "봇", seed, scenario }), guard = 0, draw = seed >>> 0;
  const r = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  while (!s.ending) {
    if (++guard > 3000) throw Error("stuck " + s.phase);
    if (s.phase === "dawn") {
      if (s.event && !s.eventResult) {
        const ok = E.eventView(s).choices.filter((c) => !c.reason);
        s = E.resolveEvent(s, (strategy === "random" ? ok[r(ok.length)] : (ok.find((c) => score(s, c.i) > -5) || ok[0])).i).state;
      } else s = E.dismiss(s).state;
      continue;
    }
    if (s.phase === "evening") {
      if (strategy === "random") {
        for (const p of E.alive(s)) if (r(3) === 0) { const x = E.toggleFeed(s, p.id); if (!x.error) s = x.state; }
      }
      if (strategy === "smart") {
        const want = s.meds === 0 && E.alive(s).some((p) => p.hp >= 2) ? "bandage" : s.story && !s.story.prog.sled ? "sled" : !s.gear.some((g) => g.k === "trap") ? "trap" : "bandage";
        if (E.recipeOk(s, want)) { const x = E.setCraft(s, want); if (!x.error) s = x.state; }
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
        const v = E.sceneView(s), open = v.approaches.filter((x) => !x.locked);
        const a = strategy === "random" ? open[r(open.length)] : open.slice().sort((x, y) => y.p - x.p)[0];
        s = E.choose(s, a.i).state;
      } else {
        if (strategy === "smart" && !s.exp.result.rummaged && !s.exp.isChase && !s.exp.finale && s.exp.noise <= 4) { const x = E.rummage(s); if (!x.error) { s = x.state; continue; } }
        s = E.proceed(s, strategy === "random" ? r(2) === 0 : s.exp.result.success && s.exp.step < 1).state;
      }
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
