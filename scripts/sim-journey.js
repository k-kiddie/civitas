"use strict";
// 「남행」 봇: node scripts/sim-journey.js [판 수]
const E = require("../journey/engine");
function bot(seed, origin, style = "smart", legacy = null) {
  let s = E.newGame({ origin, seed, legacy }), guard = 0, draw = seed >>> 0;
  const r = (m) => ((draw = (Math.imul(draw, 1664525) + 1013904223) >>> 0), Math.floor((draw / 2 ** 32) * m));
  s = E.begin(s).state;
  while (s.phase !== "end") {
    if (++guard > 2000) throw Error(`멈춤 ${s.phase} ${JSON.stringify(s.ev?.cur)}`);
    if (s.phase === "map") {
      while (E.bagCount(s) > E.BAG) s = E.drop(s, s.bag.find((b) => !E.C.items[b.k].key).k).state;
      const ok = E.options(s).filter((o) => !o.lock);
      s = E.go(s, (style === "random" ? ok[r(ok.length)] : ok.find((o) => o.dest && o.dest !== "station" && o.dest !== "valley" && o.dest !== "return") || ok.find((o) => o.dest === "station") || ok[r(ok.length)]).id).state;
    } else if (s.phase === "event") {
      if (s.ev.pending) { const pd = s.ev.pending; s = (style === "smart" && ["lose", "fumble"].includes(pd.tier) && s.will > 0 && !pd.rerolled ? E.reroll(s) : E.accept(s)).state; continue; }
      if (s.ev.result) { if (s.ev.result.cost) { const cs = E.view(s).costs; const k = style === "random" ? cs[r(cs.length)].k : (cs.find((c) => c.k === "item") || cs.find((c) => c.k === "clock")).k; s = E.payCost(s, k).state; continue; } s = E.cont(s).state; continue; }
      if (style === "smart" && E.view(s).canScout && s.act >= 1 && (s.clocks.storm < 3 && s.clocks.wolves < 4)) { s = E.scout(s).state; continue; }
      const v = E.view(s), ok = v.choices.filter((c) => !c.lock);
      if (!ok.length) throw Error("고를 것이 없음 " + v.text.slice(0, 40));
      const FEEL = { 해볼만하다: 3 };
      const best = style === "random" ? ok[r(ok.length)] : ok.slice().sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0) || ["해볼 만하다", "", "반반이다", "위험하다", "무모하다"].indexOf(a.feel) - ["해볼 만하다", "", "반반이다", "위험하다", "무모하다"].indexOf(b.feel))[0];
      const x = E.choose(s, best.i); if (x.error) throw Error(x.error); s = x.state;
    } else if (s.phase === "camp") {
      for (const b of s.bag.slice()) if (E.C.items[b.k].use) { for (const t of ["me", ...E.live(s).map((c) => c.id)]) { const who = t === "me" ? s.me : E.live(s).find((c) => c.id === t); if (who && who.hp >= 1 && E.hasItem(s, b.k)) { const y = E.useItem(s, b.k, t); if (!y.error) s = y.state; } } }
      const c = E.live(s)[0]; if (c && !s.camp.talked) s = E.campToggle(s, "talk", c.id).state;
      while (E.bagCount(s) > E.BAG) s = E.drop(s, s.bag.find((b) => !E.C.items[b.k].key).k).state;
      s = E.sleep(s).state;
    } else if (s.phase === "intro") s = E.begin(s).state;
  }
  return s;
}
if (require.main === module) {
  const N = Number(process.argv[2]) || 300;
  for (const style of ["smart", "random"]) {
    const end = {}, prem = {}, titles = new Set(); let days = 0, twisted = 0, comps = 0;
    for (let i = 1; i <= N; i++) {
      const o = ["parent", "deserter", "drifter", "crew", "pilot"][i % 5];
      const s = bot((i * 2654435761) >>> 0, o, style);
      const k = s.ending.key + (s.ending.inhuman ? "+인간성" : "");
      end[k] = (end[k] || 0) + 1; prem[s.dir.premise + s.dir.twist] = (prem[s.dir.premise + s.dir.twist] || 0) + 1;
      titles.add(s.title); days += s.day; if (s.dir.twisted) twisted++; comps += s.comps.length;
    }
    console.log(style, JSON.stringify(end), "평균", (days / N).toFixed(1) + "일", "반전 도달", Math.round((twisted / N) * 100) + "%", "동행", (comps / N).toFixed(1), "제목", titles.size + "종");
    if (style === "smart") console.log("  전제", JSON.stringify(prem));
  }
}
module.exports = { bot };
