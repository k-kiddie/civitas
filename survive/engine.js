"use strict";
// 「물에 잠기는 항구」 엔진. (state, 입력) → 새 state. 난수 상태는 state 안에 있어 새로고침해도 결과가 같다.
(function (root) {
  const D = typeof module !== "undefined" ? require("./data") : root.SurviveData;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const STATS = ["force", "talk", "craft", "wits"];
  function rnd(s) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }
  const pick = (s, list) => list[Math.floor(rnd(s) * list.length)];
  const d20 = (s) => 1 + Math.floor(rnd(s) * 20);

  function makePerson(p, extra = {}) {
    return { id: p.id, name: p.name, face: p.face, role: p.role, bio: p.bio, stats: { ...p.stats }, hp: p.hp || 0, stress: 10, traits: [], alive: true, child: !!p.child, job: "rest", away: 0, xp: {}, ...extra };
  }
  function newGame({ name = "대표", seed = 1 } = {}) {
    const s = {
      v: 1, rng: seed >>> 0, day: 1, rescueDay: 15, phase: "dawn",
      food: 14, wood: 6, meds: 1, hope: 55, dike: 0, ration: "normal",
      people: [], storms: [], flags: {}, rivalAlert: 0, exp: null, event: null, report: null,
      log: [], memorial: [], ending: null, seen: {}, total: 0, dayLines: [],
    };
    const lead = { id: "leader", name: String(name).slice(0, 10) || "대표", face: "🙂", role: "거처의 대표", bio: "모두가 당신의 결정을 기다린다.", stats: { force: 1, talk: 1, craft: 1, wits: 1 } };
    for (let i = 0; i < 2; i++) lead.stats[pick(s, STATS)] += 1;
    s.people.push(makePerson(lead, { leader: true }));
    const pool = D.people.slice();
    for (let i = 0; i < 7 && pool.length; i++) {
      const p = pool.splice(Math.floor(rnd(s) * pool.length), 1)[0];
      s.people.push(makePerson(p));
      if (p.kin === "dodam") s.people.push(makePerson(D.child));
    }
    s.total = s.people.length;
    // 폭우 세 번(시기는 판마다 다르다). need = 그때까지 필요한 둑 진척(누적)
    const base = [4, 8, 12];
    s.storms = base.map((d, i) => ({ day: d + Math.floor(rnd(s) * 3) - 1, need: [5, 12, 20][i], hit: false }));
    s.rescueDay = 14 + Math.floor(rnd(s) * 3);
    s.report = {
      title: "물에 갇힌 첫날",
      lines: [
        `강둑이 터졌다. ${s.people.length}명이 물에 갇힌 창고 2층으로 피했다.`,
        `구조선은 ${s.rescueDay - 2}~${s.rescueDay + 1}일쯤 온다는 소문이다. 그때까지 살아남아야 한다.`,
        `첫 폭우는 ${s.storms[0].day}일. 둑을 쌓지 않으면 거처가 잠긴다.`,
        "낮에는 사람들에게 일을 맡기고, 밤에는 누군가를 물에 잠긴 동네로 보내 물자를 구한다.",
      ],
    };
    return s;
  }
  // ── 조회 ──
  const alive = (s) => s.people.filter((p) => p.alive);
  const adults = (s) => alive(s).filter((p) => !p.child);
  const byId = (s, id) => s.people.find((p) => p.id === id);
  const available = (s, p) => p.alive && !p.child && p.away <= 0 && !p.broken;
  const canWork = (s, p) => available(s, p) && p.hp <= 1;
  const canGo = (s, p) => available(s, p) && p.hp <= 1;
  const nextStorm = (s) => s.storms.find((t) => !t.hit);
  function need(s) {
    const per = D.rations[s.ration].per * (s.flags.law === "workers" ? 0.85 : s.flags.law === "weak" ? 1.1 : 1);
    const mouths = alive(s).reduce((n, p) => n + (p.child ? 0.5 : 1), 0);
    const cook = alive(s).some((p) => p.id === "sundeok" && p.away <= 0) ? 1 : 0;
    return { food: Math.max(0, Math.ceil(mouths * per) - cook), wood: Math.ceil(alive(s).length / 4) };
  }
  function jobYield(s, p, job) {
    const half = p.hp === 1 ? 0.5 : 1;
    const st = p.stats;
    if (job === "dike") return Math.max(1, Math.floor((1 + Math.floor(st.craft / 2) + (D.people.find((x) => x.id === p.id)?.dike || 0)) * half));
    if (job === "fish") return Math.max(1, Math.floor((1 + Math.floor(st.wits / 2)) * half));
    if (job === "wood") return Math.max(1, Math.floor((1 + Math.floor(st.force / 2)) * half));
    return 0;
  }
  // 낮 결과 미리보기(화면용)
  function forecast(s) {
    const out = { food: 0, wood: 0, dike: 0 };
    for (const p of s.people) if (canWork(s, p)) {
      if (p.job === "fish") out.food += jobYield(s, p, "fish");
      if (p.job === "wood") out.wood += jobYield(s, p, "wood");
      if (p.job === "dike") out.dike += jobYield(s, p, "dike");
    }
    const n = need(s);
    return { ...out, eat: n.food, burn: n.wood };
  }
  // ── 낮 ──
  function setJob(state, id, job) {
    if (state.phase !== "day") return { state, error: "낮에만 일을 맡길 수 있습니다." };
    const p = byId(state, id);
    if (!p || !canWork(state, p)) return { state, error: "지금 일할 수 없는 사람입니다." };
    if (!D.jobs[job]) return { state, error: "알 수 없는 일입니다." };
    const s = clone(state);
    byId(s, id).job = job;
    return { state: s };
  }
  function setRation(state, level) {
    if (!D.rations[level]) return { state, error: "알 수 없는 배급입니다." };
    const s = clone(state);
    s.ration = level;
    return { state: s };
  }
  function endDay(state) {
    if (state.phase !== "day") return { state, error: "지금은 낮이 아닙니다." };
    const s = clone(state);
    const lines = [];
    let dike = 0, food = 0, wood = 0;
    for (const p of s.people) {
      if (!canWork(s, p)) continue;
      if (p.job === "fish") food += jobYield(s, p, "fish");
      if (p.job === "wood") wood += jobYield(s, p, "wood");
      if (p.job === "dike") {
        const y = s.wood > 0 ? jobYield(s, p, "dike") : Math.max(1, Math.floor(jobYield(s, p, "dike") / 2));
        dike += y;
        if (s.wood > 0) s.wood -= 1;
      }
      if (p.job === "rest") {
        p.stress = clamp(p.stress - 25, 0, 100);
        if (p.hp === 1 && rnd(s) < 0.5) {
          p.hp = 0;
          lines.push(`${p.name}의 상처가 아물었다.`);
        }
      }
    }
    for (const p of s.people) {
      if (!canWork(s, p) || p.job !== "care") continue;
      const patient = alive(s).filter((x) => x.hp >= 1 && x !== p).sort((a, b) => b.hp - a.hp)[0];
      if (!patient) {
        s.hope = clamp(s.hope + 2, 0, 100);
        continue;
      }
      if (patient.hp >= 2 && s.meds <= 0) {
        lines.push(`${p.name}이(가) ${patient.name}을(를) 돌봤지만 약이 없어 소용없었다.`);
        continue;
      }
      if (patient.hp >= 2) s.meds -= 1;
      const steps = D.people.find((x) => x.id === p.id)?.care ? 2 : 1;
      patient.hp = Math.max(0, patient.hp - steps);
      lines.push(`${p.name}이(가) ${patient.name}을(를) 치료했다 (${D.hpNames[patient.hp]}).`);
    }
    s.food += food;
    s.wood += wood;
    s.dike += dike;
    lines.unshift(`낮 동안: 식량 +${food} · 땔감 +${wood} · 둑 +${dike}`);
    s.dayLines = lines;
    s.phase = "night";
    return { state: s };
  }
  // ── 밤 탐색 (TRPG) ──
  function startExp(state, loc, party) {
    if (state.phase !== "night") return { state, error: "밤에만 나갈 수 있습니다." };
    if (!D.places[loc]) return { state, error: "알 수 없는 장소입니다." };
    const ids = [...new Set(party)].slice(0, 2);
    if (!ids.length) return { state, error: "갈 사람을 고르세요." };
    if (ids.some((id) => !byId(state, id) || !canGo(state, byId(state, id)))) return { state, error: "갈 수 없는 사람이 있습니다." };
    const s = clone(state);
    s.exp = { loc, party: ids, step: 0, loot: { food: 0, wood: 0, meds: 0, hope: 0 }, scene: null, result: null, story: [] };
    for (const id of ids) byId(s, id).stress = clamp(byId(s, id).stress + 5, 0, 100);
    drawScene(s);
    s.phase = "exp";
    return { state: s };
  }
  function drawScene(s) {
    const e = s.exp;
    const used = new Set(e.story.map((x) => x.scene));
    let pool = D.scenes.filter((x) => x.loc === e.loc && !used.has(x.id));
    if (e.step >= 1 && rnd(s) < 0.35) pool = D.scenes.filter((x) => x.loc === null && !used.has(x.id));
    if (!pool.length) pool = D.scenes.filter((x) => x.loc === null && !used.has(x.id));
    e.scene = pool.length ? pick(s, pool).id : null;
  }
  // 접근법마다: 누가 굴리나(그 능력치가 가장 높은 사람) · 보정 · 난이도 · 성공 확률
  function approach(s, a) {
    const party = s.exp.party.map((id) => byId(s, id)).filter((p) => p.alive);
    const roller = party.slice().sort((x, y) => y.stats[a.stat] - x.stats[a.stat])[0];
    const parts = [[`${roller.name} ${D.stats[a.stat].icon}${D.stats[a.stat].name}`, roller.stats[a.stat]]];
    if (party.length > 1) parts.push(["동행 도움", 1]);
    if (roller.hp === 1) parts.push(["부상", -1]);
    if (roller.traits.includes("겁쟁이")) parts.push(["겁쟁이", -2]);
    if (roller.stress >= 70) parts.push(["지침", -1]);
    const mod = parts.reduce((n, [, v]) => n + v, 0);
    const dc = a.dc + (D.places[s.exp.loc].danger - 1) + s.exp.step;
    const p = clamp((21 - (dc - mod)) / 20, 0.05, 0.95);
    return { roller: roller.id, rollerName: roller.name, mod, parts, dc, p: Math.round(p * 100) / 100 };
  }
  function sceneView(s) {
    if (!s.exp || !s.exp.scene) return null;
    const sc = D.scenes.find((x) => x.id === s.exp.scene);
    return { id: sc.id, text: sc.text, place: D.places[s.exp.loc], step: s.exp.step, approaches: sc.approaches.map((a, i) => ({ i, label: a.label, stat: a.stat, ...approach(s, a), win: describe(a.win), lose: describe(a.lose) })) };
  }
  function describe(o) {
    const out = [];
    const L = o.loot || {};
    if (L.food) out.push(`식량 ${L.food > 0 ? "+" : ""}${L.food}`);
    if (L.wood) out.push(`땔감 +${L.wood}`);
    if (L.meds) out.push(`약 +${L.meds}`);
    if (L.hope) out.push(`희망 ${L.hope > 0 ? "+" : ""}${L.hope}`);
    if (o.harm) out.push(`부상 ${o.harm}단계`);
    if (o.stress) out.push(`스트레스 +${o.stress}`);
    if (o.lose) out.push("짐 절반 잃음");
    if (o.join) out.push("새 식구");
    if (o.radio) out.push("구조 앞당김");
    if (o.ledger) out.push("도윤의 장부");
    if (o.rivalAlert) out.push("도윤이 눈치챔");
    return out.join(" · ");
  }
  function hurt(s, p, n, cause, notes) {
    if (!n || !p.alive) return;
    p.hp = Math.min(4, p.hp + n);
    if (p.hp >= 4) die(s, p, cause, notes);
    else notes.push(`${p.name}: ${D.hpNames[p.hp]}`);
  }
  function die(s, p, cause, notes) {
    p.alive = false;
    p.hp = 4;
    s.memorial.push({ id: p.id, name: p.name, face: p.face, day: s.day, cause });
    s.hope = clamp(s.hope - (p.child ? 15 : 8), 0, 100);
    for (const q of alive(s)) q.stress = clamp(q.stress + (q.traits.includes("냉혈한") ? 0 : p.child ? 25 : 15), 0, 100);
    notes.push(`🕯 ${p.name}이(가) 죽었다.`);
    s.log.push({ day: s.day, text: `${p.name}이(가) 죽었다 (${cause}).` });
    if (p.id === "dodam") {
      const mom = byId(s, "sora");
      if (mom && mom.alive) mom.stress = 100;
    }
  }
  function gainXp(s, p, stat, notes) {
    p.xp[stat] = (p.xp[stat] || 0) + 1;
    if (p.xp[stat] >= 3 && p.stats[stat] < 5) {
      p.xp[stat] = 0;
      p.stats[stat] += 1;
      notes.push(`⬆ ${p.name}의 ${D.stats[stat].name}이(가) ${p.stats[stat]}이(가) 되었다.`);
    }
  }
  function choose(state, index) {
    if (state.phase !== "exp" || !state.exp?.scene || state.exp.result) return { state, error: "고를 장면이 없습니다." };
    const sc = D.scenes.find((x) => x.id === state.exp.scene);
    const a = sc.approaches[index];
    if (!a) return { state, error: "알 수 없는 선택입니다." };
    const s = clone(state);
    const e = s.exp;
    const info = approach(s, a);
    const roller = byId(s, info.roller);
    const roll = d20(s);
    const crit = roll === 20, fumble = roll === 1;
    const success = crit || (!fumble && roll + info.mod >= info.dc);
    const o = success ? a.win : a.lose;
    const notes = [];
    const k = crit ? 1.5 : 1;
    for (const [res, v] of Object.entries(o.loot || {})) e.loot[res] += Math.round(v * (v > 0 ? k : 1));
    if (o.lose) for (const res of ["food", "wood", "meds"]) e.loot[res] = Math.floor(e.loot[res] * (1 - o.lose));
    hurt(s, roller, (o.harm || 0) + (fumble ? 1 : 0), "밤 탐색 중 사고", notes);
    if (o.stress) for (const id of e.party) {
      const p = byId(s, id);
      if (p.alive) p.stress = clamp(p.stress + (p.traits.includes("냉혈한") ? Math.round(o.stress / 2) : o.stress), 0, 100);
    }
    if (o.join) {
      const pool = D.people.filter((x) => !s.people.some((p) => p.id === x.id));
      const np = pool.length ? makePerson(pick(s, pool), { hp: 1 }) : makePerson({ id: "sailor" + s.day, name: "갑수", face: "🧑‍✈️", role: "떠돌이 선원", bio: "배가 뒤집혀 혼자 살아남았다.", stats: { force: 2, talk: 0, craft: 1, wits: 2 } }, { hp: 1 });
      s.people.push(np);
      s.total += 1;
      notes.push(`🤝 ${np.name}이(가) 거처에 합류했다.`);
    }
    if (o.radio) {
      s.rescueDay = Math.max(s.day + 2, s.rescueDay - 3);
      notes.push(`📻 구조선이 ${s.rescueDay}일에 온다!`);
    }
    if (o.ledger) s.flags.ledger = true;
    if (o.rivalAlert) s.rivalAlert += 1;
    if (roller.alive) gainXp(s, roller, a.stat, notes);
    e.result = { approach: a.label, roller: roller.name, stat: a.stat, roll, mod: info.mod, parts: info.parts, dc: info.dc, total: roll + info.mod, success, crit, fumble, text: (crit ? "대성공! " : fumble ? "대실패! " : "") + o.text, notes };
    e.story.push({ scene: sc.id, success });
    return { state: s };
  }
  // 결과를 본 뒤: 더 들어가거나(위험↑) 돌아간다
  function proceed(state, deeper) {
    if (state.phase !== "exp" || !state.exp?.result) return { state, error: "결과를 먼저 확인하세요." };
    const s = clone(state);
    const e = s.exp;
    const party = e.party.map((id) => byId(s, id)).filter((p) => p.alive);
    if (deeper && party.length && e.step < 2) {
      e.step += 1;
      e.result = null;
      drawScene(s);
      if (e.scene) return { state: s };
    }
    // 귀환: 전리품을 거처로
    s.food += e.loot.food;
    s.wood += e.loot.wood;
    s.meds += e.loot.meds;
    s.hope = clamp(s.hope + e.loot.hope, 0, 100);
    s.dayLines.push(`밤 탐색 (${D.places[e.loc].name}): ${party.length ? "" : "아무도 돌아오지 못했다. "}식량 +${e.loot.food} · 땔감 +${e.loot.wood} · 약 +${e.loot.meds}`);
    s.log.push({ day: s.day, text: `${e.party.map((id) => byId(s, id).name).join("·")}이(가) ${D.places[e.loc].name}에 다녀왔다.` });
    s.exp = null;
    return dawn(s);
  }
  function skipNight(state) {
    if (state.phase !== "night") return { state, error: "지금은 밤이 아닙니다." };
    const s = clone(state);
    s.dayLines.push("밤에는 아무도 나가지 않았다.");
    return dawn(s);
  }
  // ── 새벽: 소모·폭우·악화·사건 ──
  function dawn(s) {
    const lines = s.dayLines.slice();
    const notes = [];
    const R = D.rations[s.ration];
    const n = need(s);
    if (s.food >= n.food) {
      s.food -= n.food;
      lines.push(`식량 −${n.food} (${R.name})`);
      s.hope = clamp(s.hope + R.hope, 0, 100);
      for (const p of alive(s)) p.stress = clamp(p.stress + R.stress, 0, 100);
    } else {
      lines.push(`🍚 식량이 모자랐다 (필요 ${n.food}, 남은 ${s.food}). 굶주림이 덮쳤다.`);
      s.food = 0;
      s.hope = clamp(s.hope - 10, 0, 100);
      for (const p of alive(s)) p.stress = clamp(p.stress + 15, 0, 100);
      for (const victim of alive(s).slice().sort(() => rnd(s) - 0.5).slice(0, 2)) hurt(s, victim, 1, "굶주림", notes);
    }
    if (s.wood >= n.wood) {
      s.wood -= n.wood;
      lines.push(`땔감 −${n.wood}`);
    } else {
      s.wood = 0;
      lines.push("🥶 땔감이 떨어져 밤새 떨었다.");
      for (const p of alive(s)) p.stress = clamp(p.stress + 10, 0, 100);
      if (rnd(s) < 0.4) {
        const victim = pick(s, alive(s));
        if (victim) hurt(s, victim, 1, "추위와 병", notes);
      }
    }
    // 중상은 악화될 수 있고, 위독은 하루를 넘기지 못한다
    for (const p of alive(s)) {
      if (p.hp === 3) die(s, p, "치료받지 못한 상처", notes);
      else if (p.hp === 2 && rnd(s) < 0.5) hurt(s, p, 1, "상처 악화", notes);
    }
    // 물에 갇힌 거처에는 병이 돈다(배급이 적거나 춥거나 약이 없을수록)
    const sick = 0.2 + (s.ration === "half" || s.ration === "none" ? 0.15 : 0) + (s.wood <= 1 ? 0.1 : 0);
    if (rnd(s) < sick) {
      const v = pick(s, alive(s));
      if (v) {
        notes.push(`🤒 ${v.name}이(가) 열병에 걸렸다.`);
        hurt(s, v, 1, "열병", notes);
      }
    }
    // 폭우
    const storm = s.storms.find((t) => !t.hit && t.day === s.day);
    if (storm) {
      storm.hit = true;
      if (s.dike >= storm.need) {
        s.hope = clamp(s.hope + 6, 0, 100);
        lines.push(`⛈ 폭우! 둑(${s.dike}/${storm.need})이 버텼다. 사람들이 서로를 끌어안았다.`);
      } else {
        const lf = Math.ceil(s.food * 0.4), lw = Math.ceil(s.wood * 0.4);
        s.food -= lf;
        s.wood -= lw;
        s.hope = clamp(s.hope - 15, 0, 100);
        lines.push(`⛈ 폭우! 둑(${s.dike}/${storm.need})이 무너졌다. 식량 −${lf} · 땔감 −${lw}.`);
        const hit = alive(s).slice().sort(() => rnd(s) - 0.5).slice(0, 2);
        for (const p of hit) hurt(s, p, 1, "물에 휩쓸림", notes);
      }
    }
    // 도윤의 보복
    if (s.rivalAlert >= 2 && rnd(s) < 0.5) {
      s.rivalAlert = 0;
      const lf = Math.ceil(s.food * 0.3);
      s.food -= lf;
      lines.push(`🏯 도윤의 사병들이 거처를 습격했다. 식량 −${lf}.`);
      const v = pick(s, adults(s));
      if (v) hurt(s, v, 1, "도윤 사병의 습격", notes);
    }
    // 헤엄쳐 간 사람
    for (const p of alive(s).filter((x) => x.swimming)) {
      p.swimming = false;
      const roll = d20(s) + p.stats.force;
      if (roll >= 14) {
        s.rescueDay = Math.max(s.day + 2, s.rescueDay - 2);
        p.away = 1;
        lines.push(`🏊 ${p.name}이(가) 건너편에 닿았다! 구조선이 ${s.rescueDay}일로 앞당겨졌다.`);
      } else die(s, p, "급류에 휩쓸림", notes);
    }
    // 돌아오는 사람
    for (const p of s.people) {
      if (p.away > 0) {
        p.away -= 1;
        if (p.away === 0 && p.alive) lines.push(`${p.name}이(가) 돌아왔다.`);
      }
      if (p.broken > 0) p.broken -= 1;
    }
    // 무너짐(스트레스 100)
    for (const p of alive(s).filter((x) => x.stress >= 100 && !x.child)) {
      p.stress = 60;
      const r = rnd(s);
      if (r < 0.35 && !p.traits.includes("겁쟁이")) {
        p.traits.push("겁쟁이");
        notes.push(`😨 ${p.name}이(가) 무너졌다. 이제 위험한 판정에서 −2.`);
      } else if (r < 0.6 && !p.traits.includes("냉혈한")) {
        p.traits.push("냉혈한");
        s.hope = clamp(s.hope - 5, 0, 100);
        notes.push(`🧊 ${p.name}의 눈빛이 식었다. 죽음에도 흔들리지 않지만, 사람들은 그를 두려워한다.`);
      } else {
        const stolen = Math.min(s.food, 3);
        s.food -= stolen;
        p.broken = 2;
        notes.push(`💔 ${p.name}이(가) 무너져 식량 ${stolen}을 들고 숨었다. 이틀간 아무것도 못 한다.`);
      }
    }
    s.day += 1;
    s.dayLines = [];
    // 결말
    if (!adults(s).length) s.ending = "lost";
    else if (s.hope <= 0) s.ending = "riot";
    else if (!byId(s, "leader").alive && !s.flags.newLeader) {
      const heir = adults(s).sort((a, b) => b.stats.talk - a.stats.talk)[0];
      s.flags.newLeader = heir.id;
      heir.leader = true;
      notes.push(`👤 ${heir.name}이(가) 대표를 이어받았다.`);
    }
    if (!s.ending && s.day > s.rescueDay) {
      const ratio = alive(s).length / s.total;
      s.ending = ratio >= 1 ? "all" : ratio >= 0.6 ? "most" : "few";
    }
    // 아침 사건
    s.event = s.ending ? null : pickEvent(s);
    s.report = { title: s.ending ? "마지막 아침" : `${s.day}일째 아침`, lines: [...lines, ...notes] };
    s.phase = s.ending ? "end" : "dawn";
    for (const p of s.people) if (!canWork(s, p)) p.job = "rest";
    return { state: s };
  }
  // ── 아침 사건 ──
  function castFor(s, kind) {
    const pool = adults(s).filter((p) => !p.leader && p.away <= 0);
    if (kind === "hungry") return pool.filter((p) => p.stress >= 45 || s.ration === "half" || s.ration === "none");
    if (kind === "two") return pool;
    if (kind === "brave") return pool.filter((p) => p.hp === 0 && p.stats.force >= 2);
    if (kind === "stressed") return pool.filter((p) => p.stress >= 65);
    return pool;
  }
  function eventOk(s, e) {
    const last = s.seen[e.id];
    if (["doyun_offer", "law_order", "haejin", "swim"].includes(e.id) && last !== undefined) return false;
    if (last !== undefined && s.day - last < 3) return false;
    if (e.need && !(byId(s, e.need) && byId(s, e.need).alive)) return false;
    if (e.id === "doyun_offer" && s.day < 3) return false;
    if (e.id === "law_order" && s.day < 2) return false;
    if (e.id === "haejin" && s.day < 4) return false;
    if (e.cast === "two" && castFor(s, "two").length < 2) return false;
    if (e.cast && e.cast !== "two" && !castFor(s, e.cast).length) return false;
    return true;
  }
  function pickEvent(s) {
    if (rnd(s) > 0.7) return null;
    const ok = D.events.filter((e) => eventOk(s, e));
    if (!ok.length) return null;
    const e = pick(s, ok);
    s.seen[e.id] = s.day;
    if (e.id === "cough") {
      const kid = byId(s, "dodam");
      if (kid.hp === 0) kid.hp = 1;
    }
    let cast = null, cast2 = null;
    if (e.cast) {
      const pool = castFor(s, e.cast).slice();
      cast = pool.splice(Math.floor(rnd(s) * pool.length), 1)[0]?.id || null;
      if (e.cast === "two") cast2 = pool[Math.floor(rnd(s) * pool.length)]?.id || null;
    }
    return { id: e.id, cast, cast2 };
  }
  function fillEvent(s, text) {
    const ev = s.event;
    return String(text).replaceAll("{who}", ev?.cast ? byId(s, ev.cast).name : "").replaceAll("{who2}", ev?.cast2 ? byId(s, ev.cast2).name : "");
  }
  function eventView(s) {
    if (!s.event) return null;
    const e = D.events.find((x) => x.id === s.event.id);
    const cast = s.event.cast ? byId(s, s.event.cast) : null;
    return {
      id: e.id, text: fillEvent(s, e.text), face: cast ? cast.face : e.id === "cough" ? "👦" : e.id.startsWith("doyun") ? "🏯" : "🏚",
      choices: e.choices.map((c, i) => ({ i, label: fillEvent(s, c.label), reason: c.need?.meds && s.meds < c.need.meds ? "약이 없다" : c.need?.ledger && !s.flags.ledger ? "도윤의 장부가 필요하다" : "" })),
    };
  }
  function resolveEvent(state, index) {
    if (!state.event || state.phase !== "dawn") return { state, error: "사건이 없습니다." };
    const e = D.events.find((x) => x.id === state.event.id);
    const c = e.choices[index];
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const view = eventView(state).choices[index];
    if (view.reason) return { state, error: view.reason };
    const s = clone(state);
    const fx = c.fx;
    const cast = s.event.cast ? byId(s, s.event.cast) : null;
    const cast2 = s.event.cast2 ? byId(s, s.event.cast2) : null;
    const notes = [];
    let text = fillEvent(s, c.text);
    for (const r of ["food", "wood", "meds"]) if (fx[r]) s[r] = Math.max(0, s[r] + fx[r]);
    if (fx.hope) s.hope = clamp(s.hope + fx.hope, 0, 100);
    if (fx.castStress && cast) cast.stress = clamp(cast.stress + fx.castStress, 0, 100);
    if (fx.cast2Stress && cast2) cast2.stress = clamp(cast2.stress + fx.cast2Stress, 0, 100);
    if (fx.allStress) for (const p of alive(s)) p.stress = clamp(p.stress + fx.allStress, 0, 100);
    if (fx.stress) for (const [id, v] of Object.entries(fx.stress)) if (byId(s, id)) byId(s, id).stress = clamp(byId(s, id).stress + v, 0, 100);
    if (fx.heal) byId(s, fx.heal).hp = 0;
    if (fx.worsen) hurt(s, byId(s, fx.worsen), 1, "열병", notes);
    if (fx.exile && cast) {
      cast.alive = false;
      cast.exiled = true;
      s.memorial.push({ id: cast.id, name: cast.name, face: cast.face, day: s.day, cause: "거처에서 쫓겨남" });
      s.log.push({ day: s.day, text: `${cast.name}을(를) 쫓아냈다.` });
    }
    if (fx.lend) {
      const lent = adults(s).filter((p) => !p.leader && canWork(s, p)).slice(0, fx.lend);
      for (const p of lent) p.away = 3;
      text += ` (${lent.map((p) => p.name).join("·")})`;
    }
    if (fx.swim && cast) cast.swimming = true;
    if (fx.law) s.flags.law = fx.law;
    if (fx.trustHaejin) s.flags.trustHaejin = true;
    if (fx.spy) {
      const lead = byId(s, s.flags.newLeader || "leader");
      const ok = d20(s) + lead.stats.wits >= 13;
      if (ok) {
        const traitor = rnd(s) < 0.5;
        if (traitor) {
          s.flags.ledger = true;
          text = "강해진이 도윤의 사병에게 쪽지를 건네는 걸 봤다. 쪽지를 빼앗았다 — 도윤의 장부 위치가 적혀 있었다.";
        } else {
          s.food += 4;
          text = "강해진은 몰래 고기를 잡아 아이들에게 나눠 주고 있었다. 당신은 부끄러워졌다. (식량 +4)";
        }
      } else text = "뒤를 밟다 놓쳤다. 강해진은 당신을 의심하는 눈치다.";
    }
    s.event = null;
    s.eventResult = { text, notes };
    return { state: s };
  }
  function dismiss(state) {
    const s = clone(state);
    if (s.eventResult) s.eventResult = null;
    else if (s.report) {
      s.report = null;
      if (s.phase === "dawn" && !s.event) s.phase = "day";
    }
    if (!s.report && !s.event && !s.eventResult && s.phase === "dawn") s.phase = "day";
    return { state: s };
  }
  function validate(s) {
    const ok = s && s.v === 1 && Number.isInteger(s.rng) && Number.isInteger(s.day) && Array.isArray(s.people) && s.people.length &&
      ["day", "night", "exp", "dawn", "end"].includes(s.phase) && [s.food, s.wood, s.meds, s.hope, s.dike].every(Number.isFinite) &&
      Array.isArray(s.storms) && Array.isArray(s.memorial) && D.rations[s.ration];
    if (!ok) throw Error("저장이 손상되었습니다.");
    return clone(s);
  }
  const api = {
    newGame, setJob, setRation, endDay, startExp, choose, proceed, skipNight, resolveEvent, dismiss, validate,
    sceneView, eventView, forecast, need, nextStorm, canWork, canGo, alive, adults, byId, describe,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.SurviveEngine = api;
})(globalThis);
