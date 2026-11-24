"use strict";
// 첫 장 "동장 선거" 계절 엔진 (v2).
// 목표 하나(선거 승리) + 점수판(구역별 득표) + 매 판 바뀌는 가족·라이벌·위기.
(function (root) {
  const content =
    typeof module !== "undefined"
      ? require("../content/harbor")
      : root.HarborContent;
  const harbor =
    typeof module !== "undefined"
      ? require("../shared/harbor")
      : root.HarborRules;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
  const FLOOD_TURN = 5,
    ELECTION_TURN = 8;
  const DISTRICTS = [
    { id: "harbor", name: "항구", voters: 48 },
    { id: "fishing", name: "어촌", voters: 26 },
    { id: "hill", name: "언덕", voters: 12 },
  ];
  const DNAME = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.name]));
  const SKILLS = ["talk", "manage", "scheme", "nerve"];

  function random(state) {
    state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
    return state.rng / 4294967296;
  }
  const pick = (s, list) => list[Math.floor(random(s) * list.length)];
  const between = (s, [lo, hi]) => lo + Math.floor(random(s) * (hi - lo + 1));

  // ── 매 판 바뀌는 가족 ────────────────────────────────────────────
  function makeFamily(s, name, gender) {
    const traits = Object.keys(content.traits);
    const names = content.familyNames.slice();
    const takeName = () => names.splice(Math.floor(random(s) * names.length), 1)[0];
    const skills = (bonus) => {
      const out = Object.fromEntries(SKILLS.map((k) => [k, 6 + Math.floor(random(s) * 5)]));
      const best = pick(s, SKILLS);
      out[best] = Math.min(14, out[best] + 4);
      for (const [k, v] of Object.entries(bonus)) out[k] = Math.min(14, out[k] + v);
      return out;
    };
    const template = pick(s, content.familyTemplates);
    const headTrait = pick(s, traits.filter((t) => t !== "겁쟁이"));
    const used = new Set([headTrait]);
    const traitFor = () => {
      const left = traits.filter((t) => !used.has(t));
      const t = pick(s, left);
      used.add(t);
      return t;
    };
    return [
      {
        id: "head",
        name: String(name).slice(0, 20),
        gender,
        role: "가장",
        age: 25,
        trait: headTrait,
        skills: skills({ talk: 1 }),
      },
      ...template.map((m, i) => ({
        id: i === 0 ? "kin" : "young",
        name: takeName(),
        role: m.role,
        age: between(s, m.age),
        trait: traitFor(),
        skills: skills({}),
      })),
    ];
  }

  // ── 라이벌 ───────────────────────────────────────────────────────
  function makeRival(s) {
    const type = pick(s, Object.keys(content.rivalTypes));
    const names = content.rivalNames.slice();
    const a = names.splice(Math.floor(random(s) * names.length), 1)[0];
    const b = names.splice(Math.floor(random(s) * names.length), 1)[0];
    return { type, members: ["도윤", a, b] };
  }
  function rivalPlan(s) {
    const t = content.rivalTypes[s.rival.type];
    // 위기가 이번 계절에 걸린 장소는 라이벌도 노린다.
    const crisisPlace =
      s.crisis && !s.crisis.resolved && s.crisis.due === s.turn
        ? content.crises[s.crisis.kind].place
        : null;
    s.rivals = s.rival.members.map((name, i) => ({
      id: "kang" + i,
      name,
      place:
        i === 0 && crisisPlace && random(s) < 0.6
          ? crisisPlace
          : pick(s, s.turn >= FLOOD_TURN ? t.lateTargets : t.targets),
      skill: i === 0 ? 11 : 7,
      hidden: i === 2 && random(s) < 0.4,
    }));
  }

  // ── 득표 ─────────────────────────────────────────────────────────
  function voters(s) {
    return DISTRICTS.map((d) =>
      d.id === "fishing" ? d.voters - Math.min(18, s.flooded || 0) : d.voters,
    );
  }
  function share(s) {
    const v = voters(s);
    const total = v.reduce((a, b) => a + b, 0);
    return Math.round(
      DISTRICTS.reduce((n, d, i) => n + clamp(s.votes[d.id], 5, 95) * v[i], 0) / total,
    );
  }
  // 득표 변화는 모두 여기로 모아 원인을 장부에 남긴다(결말에서 승패 이유로 보여 줌).
  function shift(s, deltas, cause) {
    const parts = [];
    for (const d of DISTRICTS) {
      const n = Math.round(deltas[d.id] || 0);
      if (!n) continue;
      s.votes[d.id] = clamp(s.votes[d.id] + n, 5, 95);
      parts.push(`${d.name} ${n > 0 ? "+" : ""}${n}`);
    }
    if (parts.length && cause) {
      const total = DISTRICTS.reduce((n, d) => n + Math.round(deltas[d.id] || 0), 0);
      s.ledger[cause] = (s.ledger[cause] || 0) + total;
    }
    return parts.length ? ` (${parts.join(" · ")})` : "";
  }

  function fresh({ name = "이름 없는 가장", gender = "unspecified", seed = 0x61c1a5 } = {}) {
    const s = {
      version: 2,
      turn: 0,
      rng: seed >>> 0,
      money: 32,
      votes: { harbor: 32, fishing: 36, hill: 33 },
      ledger: {},
      prepared: 0,
      plan: null,
      progress: 0,
      started: false,
      built: null,
      contract: null,
      promise: null,
      witness: false,
      secret: false,
      dirt: 0,
      platform: null,
      flooded: null,
      election: null,
      ended: false,
      family: [],
      rival: null,
      crisis: null,
      relations: Object.fromEntries(content.people.map((p) => [p.id, 0])),
      placements: {},
      rivals: [],
      queue: ["plan"],
      seen: [],
      memories: [],
      history: [],
      reports: [],
      lastResult: null,
    };
    s.family = makeFamily(s, name, gender);
    s.rival = makeRival(s);
    const kind = pick(s, Object.keys(content.crises));
    s.crisis = { kind, due: pick(s, content.crises[kind].dues), resolved: false, outcome: null };
    rivalPlan(s);
    const rt = content.rivalTypes[s.rival.type],
      cr = content.crises[kind];
    s.reports.push({
      turn: 0,
      title: "동장 선거까지 여덟 계절",
      lines: [
        `이번 장의 목표: 3년 봄 동장 선거에서 선주 도윤을 이긴다. 지금 예상 득표 ${share(s)}%.`,
        `강씨 가문은 ${rt.name}이다. ${rt.desc}`,
        `${date(s.crisis.due)}: ${cr.name}. ${cr.detail}`,
        `2년 여름에 큰 장마가 온다. 어촌을 지키면 어촌 표가, 잃으면 표와 사람이 함께 떠난다.`,
        `가족: ${s.family
          .slice(1)
          .map((p) => `${p.role} ${p.name}(${p.trait})`)
          .join(", ")}.`,
      ],
    });
    return s;
  }
  function date(turn) {
    const t = Math.min(turn, ELECTION_TURN);
    return `${1 + Math.floor(t / 4)}년 ${["봄", "여름", "가을", "겨울"][t % 4]}`;
  }
  function horizons(s) {
    const list = [];
    if (s.crisis && !s.crisis.resolved && s.turn <= s.crisis.due) {
      const c = content.crises[s.crisis.kind];
      list.push({ id: "crisis", name: c.name, left: s.crisis.due - s.turn, detail: c.detail });
    }
    if (s.turn < FLOOD_TURN)
      list.push({
        id: "flood",
        name: "큰 장마",
        left: FLOOD_TURN - s.turn,
        detail: "제방 공정과 수문 대비가 피해를 바꿉니다. 어촌 표가 크게 움직입니다.",
      });
    if (s.turn < ELECTION_TURN)
      list.push({
        id: "election",
        name: "동장 선거",
        left: ELECTION_TURN - s.turn,
        detail: "구역별 득표를 인구로 가중해 50%를 넘기면 당선입니다.",
      });
    return list.sort((a, b) => a.left - b.left);
  }
  function remember(s, person, text, kind = "choice") {
    s.memories.push({ turn: s.turn, person, kind, text, inherit: true });
  }
  function eligible(s, e) {
    const r = e.requires;
    return (
      e.kind !== "climax" &&
      !s.seen.includes(e.id) &&
      (r.turn === undefined || s.turn === r.turn) &&
      (r.turnMin === undefined || s.turn >= r.turnMin) &&
      (r.turnMax === undefined || s.turn <= r.turnMax) &&
      (!r.building || (s.plan && s.plan !== "none")) &&
      (!r.contract || s.contract) &&
      (!r.flooded || s.flooded > 0) &&
      (!r.safe || s.flooded === 0) &&
      (!r.secret || s.secret) &&
      (!r.rival || r.rival === s.rival.type)
    );
  }
  function schedule(s) {
    const room = 2 - s.queue.length;
    if (room <= 0) return;
    const candidates = content.events.filter((e) => eligible(s, e) && !s.queue.includes(e.id));
    const major = candidates
      .filter((e) => e.kind === "major")
      .sort((a, b) => (b.requires.turn !== undefined) - (a.requires.turn !== undefined));
    s.queue.push(...major.slice(0, room).map((e) => e.id));
    if (s.queue.length < 2) {
      const minor = candidates.filter((e) => e.kind === "minor");
      if (minor.length) s.queue.push(minor[Math.floor(random(s) * minor.length)].id);
    }
  }
  function choiceReason(s, c) {
    if (c.requires.secret && !s.secret) return "강씨 가문의 약점이 필요합니다.";
    if (c.requires.money > 0 && s.money < c.requires.money) return "가문 돈이 부족합니다.";
    return "";
  }
  function effects(s, e, cause) {
    if (e.money) s.money += e.money;
    if (e.votes) shift(s, e.votes, cause);
    if (e.plan) s.plan = e.plan;
    if (e.prepared) s.prepared = clamp(s.prepared + e.prepared, 0, 1);
    if (e.progress && s.plan && s.plan !== "none") s.progress += e.progress;
    if (e.contract)
      s.contract = {
        with: "doyun",
        what: "부두 사용권",
        start: s.turn,
        expires: s.turn + 80,
        witnesses: [],
      };
    if (e.promise) s.promise = "pending";
    if (e.witness) {
      s.witness = true;
      if (s.contract) s.contract.witnesses = ["민석", "지안"];
    }
    if (e.dirt) addDirt(s, e.dirt);
    if (e.secret) s.secret = true;
    if (e.relation)
      s.relations[e.relation[0]] = clamp(s.relations[e.relation[0]] + e.relation[1], -100, 100);
    if (e.platform) s.platform = e.platform;
    if (e.training) {
      const young = s.family.find((p) => p.id === "young");
      young.skills.manage = Math.min(14, young.skills.manage + 2);
    }
    if (e.memory) remember(s, "doyun", e.memory, "grudge");
    finishProject(s);
  }
  function addDirt(s, n) {
    s.dirt = Math.min(3, s.dirt + n);
    if (s.dirt >= 3) s.secret = true;
  }
  function finishProject(s) {
    if (s.started && s.progress >= required(s)) {
      s.progress = required(s);
      s.built = s.plan;
    }
  }
  function required(s) {
    return s.plan === "long" ? 6 : s.plan === "short" ? 3 : 0;
  }
  function choose(state, eventId, choiceId) {
    if (state.queue[0] !== eventId) return { state, error: "이미 처리했거나 현재 사건이 아닙니다." };
    const e = content.events.find((e) => e.id === eventId),
      c = e?.choices.find((c) => c.id === choiceId);
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const reason = choiceReason(state, c);
    if (reason) return { state, error: reason };
    const s = clone(state);
    const before = share(s);
    effects(s, c.effects, e.title);
    s.queue.shift();
    s.seen.push(e.id);
    const person = content.people.find((p) => p.id === e.who);
    remember(s, e.who, `${e.title} · ${c.label}. ${c.reply}`);
    const after = share(s);
    s.lastResult = {
      who: person?.name || "",
      text: c.reply,
      delta: e.kind === "climax" ? "" : describe(c.effects) + (after !== before ? ` → 예상 득표 ${before}% → ${after}%` : ""),
    };
    return { state: s };
  }
  // 선택지/결과에 붙는 짧은 효과 설명. 화면 미리보기에서도 같은 함수를 쓴다.
  function describe(e) {
    const parts = [];
    if (e.money) parts.push(`₭${e.money > 0 ? "+" : ""}${e.money}`);
    for (const d of DISTRICTS)
      if (e.votes?.[d.id]) parts.push(`${d.name} 표 ${e.votes[d.id] > 0 ? "+" : ""}${e.votes[d.id]}`);
    if (e.prepared) parts.push("장마 대비 +");
    if (e.progress) parts.push(`제방 공정 +${e.progress}`);
    if (e.dirt) parts.push("약점 단서 +");
    if (e.contract) parts.push("부두 20년 계약");
    if (e.promise) parts.push("약속(장마 때 판가름)");
    return parts.join(" · ");
  }
  function placeReason(s, personId, placeId) {
    if (s.ended) return "첫 장을 마쳤습니다.";
    if (s.queue.length) return "열린 사건부터 결정하세요.";
    if (!s.family.some((p) => p.id === personId)) return "가문 사람을 선택하세요.";
    const p = content.places.find((p) => p.id === placeId);
    if (!p) return "알 수 없는 장소입니다.";
    if (s.placements[personId] === placeId) return "";
    if (Object.values(s.placements).filter((id) => id === placeId).length >= p.slots)
      return "이 장소의 자리가 모두 찼습니다.";
    return "";
  }
  function place(state, personId, placeId) {
    const reason = placeReason(state, personId, placeId);
    if (reason) return { state, error: reason };
    const s = clone(state);
    s.placements[personId] = placeId;
    return { state: s };
  }
  function traitBonus(person, placeId) {
    const t = content.traits[person.trait] || {};
    return (t.place === placeId ? t.bonus : 0) + (t.tavern && placeId === "tavern" ? t.tavern : 0);
  }
  function election(s) {
    const v = voters(s);
    const districts = DISTRICTS.map((d, i) => {
      const sh = clamp(s.votes[d.id], 5, 95);
      return { name: d.name, voters: v[i], share: sh, winner: sh >= 50 ? "player" : "kang" };
    });
    const total = share(s);
    return { won: total >= 50, share: total, districts, winner: total >= 50 ? s.family[0].name : "도윤" };
  }
  // 플레이어 사람이 장소에서 성공했을 때.
  function playerAction(s, person, p, score, lines) {
    const tag = `${person.name} · ${p.name}`;
    const t = content.traits[person.trait] || {};
    if (p.kind === "work") {
      const pay = s.contract ? 13 : 18;
      s.money += pay;
      lines.push(`${tag}: 하역 품삯 ₭${pay}.`);
    } else if (p.kind === "trade") {
      s.money += 24;
      lines.push(`${tag}: 상단 품삯 ₭24. 강씨 일꾼으로 보였다${shift(s, { harbor: -2 }, "강씨 상관 일")}.`);
    } else if (p.kind === "home") {
      const pay = 7 + (t.home || 0);
      s.money += pay;
      lines.push(`${tag}: 집안 수입 ₭${pay}.`);
    } else if (p.kind === "organize") {
      s.money += 3;
      lines.push(`${tag}: 어촌 모임을 열었다${shift(s, { fishing: 4 }, "어촌 모임")}.`);
    } else if (p.kind === "union") {
      lines.push(`${tag}: 조합원들을 설득했다${shift(s, { harbor: 4 }, "조합 설득")}.`);
    } else if (p.kind === "spy") {
      const had = s.secret;
      addDirt(s, score >= 14 ? 2 : 1);
      const extra = shift(s, { hill: 1 }, "주점 인맥");
      lines.push(
        s.secret && !had
          ? `${tag}: 강씨 상관의 밀수 장부를 손에 넣었다! 폭로·협박 선택지가 열린다${extra}.`
          : s.secret
            ? `${tag}: 언덕 유지들과 술잔을 나눴다${extra}.`
            : `${tag}: 강씨 상관의 야간 하역 소문을 들었다 (약점 ${s.dirt}/3)${extra}.`,
      );
    }
  }
  function rivalAction(s, r, p, lines) {
    const fx = content.rivalTypes[s.rival.type].effects[p.id];
    if (!fx) return;
    const who = r.hidden && !s.secret ? "강씨 가문의 누군가" : r.name;
    let extra = "";
    if (fx.votes) extra = shift(s, fx.votes, `강씨: ${fx.cause}`);
    if (fx.sabotage) {
      if (s.started && !s.built && s.progress > 0) {
        s.progress -= 1;
        extra = " (제방 공정 −1)";
      } else if (s.turn < FLOOD_TURN && s.prepared > 0) {
        s.prepared = clamp(s.prepared - 0.1, 0, 1);
        extra = " (장마 대비 −)";
      } else return;
    }
    lines.push(`${who} · ${p.name}: ${fx.text}${extra}.`);
  }
  function advance(state) {
    if (state.ended || state.queue.length)
      return { state, error: state.ended ? "첫 장을 마쳤습니다." : "열린 사건부터 결정하세요." };
    const s = clone(state),
      lines = [],
      rivalLines = [],
      before = s.money,
      startShare = share(s),
      oldTurn = s.turn;
    const jobs = s.family.map((person) => ({
      person,
      place: content.places.find((p) => p.id === (s.placements[person.id] || "home")),
    }));
    const successful = [];
    const contested = new Set();
    for (const { person, place: p } of jobs) {
      const rivals = s.rivals.filter((r) => r.place === p.id);
      const t = content.traits[person.trait] || {};
      const score =
        person.skills[p.skill] +
        Math.floor(random(s) * 9) +
        traitBonus(person, p.id) +
        (rivals.length ? t.contest || 0 : 0);
      const rivalScore = rivals.length
        ? Math.max(...rivals.map((r) => r.skill + Math.floor(random(s) * 9)))
        : -1;
      if (rivals.length) contested.add(p.id);
      if (score < rivalScore) {
        lines.push(`${person.name} · ${p.name}: 강씨 가문과 맞붙어 밀렸다.`);
        s.relations.doyun = Math.max(-100, s.relations.doyun - 3);
        continue;
      }
      if (rivals.length) lines.push(`${person.name} · ${p.name}: 강씨 가문을 밀어냈다.`);
      successful.push({ person, place: p, score });
      playerAction(s, person, p, score, lines);
    }
    // 라이벌: 플레이어에게 밀리지 않은 장소에서 행동한다.
    const beaten = new Set(successful.filter((j) => contested.has(j.place.id)).map((j) => j.place.id));
    for (const r of s.rivals) {
      if (beaten.has(r.place)) continue;
      rivalAction(s, r, content.places.find((p) => p.id === r.place), rivalLines);
    }
    // 수입 정산 뒤 공사(배치 순서와 무관).
    for (const { person } of successful.filter((j) => j.place.kind === "prepare")) {
      const t = content.traits[person.trait] || {};
      s.prepared = clamp(s.prepared + 0.1, 0, 1);
      if (s.turn >= FLOOD_TURN) {
        lines.push(`${person.name} · 수문: 무너진 둑을 보수했다${shift(s, { fishing: 2 }, "수문 보수")}.`);
        continue;
      }
      if (s.plan === "none") {
        lines.push(`${person.name} · 수문: 피난 물길을 확보했다 (장마 대비 +).`);
        continue;
      }
      if (!s.started) {
        const cost = harbor.plans[s.plan]?.cost;
        if (cost && s.money >= cost) {
          s.money -= cost;
          s.started = true;
          lines.push(`${harbor.plans[s.plan].name} 착공 · 자재비 ₭${cost}.`);
        } else {
          lines.push(`${person.name} · 수문: 착공 자금(₭${cost})이 모자라 물길만 살폈다 (장마 대비 +).`);
          continue;
        }
      }
      if (s.started && !s.built) {
        s.progress += 1 + (person.skills.manage >= 10 ? 1 : 0) + (t.build || 0);
        finishProject(s);
        lines.push(`${person.name} · 수문: 제방 공정 ${s.progress}/${required(s)}.`);
      }
    }
    // 위기: 정해진 계절에 그 장소를 지켰는지로 판가름.
    if (s.crisis && !s.crisis.resolved && s.crisis.due === oldTurn) {
      const c = content.crises[s.crisis.kind];
      const held = successful.some((j) => j.place.id === c.place);
      s.crisis.resolved = true;
      s.crisis.outcome = held ? "held" : "failed";
      if (!held && c.failMoney) s.money -= c.failMoney;
      lines.unshift(
        `${c.name} · ${held ? c.win : c.lose}${shift(s, held ? c.winVotes : c.loseVotes, c.name)}${!held && c.failMoney ? ` · ₭−${c.failMoney}` : ""}.`,
      );
    }
    const expense = s.family.length * 4;
    s.money -= expense;
    lines.push(`가문 생활비 ₭${expense}.`);
    if (s.money < 0) lines.push(`외상 장부가 늘었다${shift(s, { harbor: -1, fishing: -1, hill: -2 }, "외상")}.`);
    s.turn++;
    s.family.forEach((p) => {
      if (s.turn % 4 === 0) p.age++;
    });
    if (s.turn === FLOOD_TURN) {
      const baseline = harbor.floodLoss(s.built || "none");
      s.flooded = Math.max(0, baseline - Math.floor(s.prepared * 8));
      if (s.promise === "pending") {
        s.promise = s.flooded === 0 ? "kept" : "broken";
        remember(
          s,
          "sora",
          s.promise === "kept" ? "어촌을 지키겠다는 약속을 지켰다." : "어촌 보호 약속을 지키지 못했다.",
          s.promise,
        );
      }
      const fish =
        (s.flooded === 0 ? 10 : s.flooded <= 12 ? -4 : -10) +
        (s.promise === "kept" ? 8 : s.promise === "broken" ? -10 : 0);
      const port = s.built ? 4 : s.flooded >= 30 ? -6 : 0;
      s.queue.push("flood");
      remember(s, "sora", `큰 장마에 ${s.flooded}가구가 침수됐다.`, s.flooded ? "loss" : "gratitude");
      lines.unshift(
        `큰 장마 · ${s.flooded}가구 침수. ${s.built ? harbor.plans[s.built].name + "이 버텼다." : "미완성 제방은 물을 막지 못했다."}${shift(s, { fishing: fish, harbor: port }, "큰 장마")}`,
      );
    }
    const endShare = share(s);
    if (s.turn === ELECTION_TURN) {
      s.election = election(s);
      s.ended = true;
      s.queue.push("election", "ending");
      lines.unshift(`동장 선거 · ${s.election.winner} 당선. 당신의 득표율 ${s.election.share}%.`);
      remember(s, "jian", lines[0], "election");
    } else schedule(s);
    const allLines = [
      `예상 득표 ${startShare}% → ${endShare}%${endShare > startShare ? " ▲" : endShare < startShare ? " ▼" : ""}`,
      ...lines,
      ...rivalLines,
    ];
    s.history.push({ turn: oldTurn, placements: clone(s.placements), net: s.money - before, share: endShare, lines: clone(allLines) });
    s.reports.unshift({
      turn: s.turn,
      title:
        s.turn === FLOOD_TURN
          ? "강물이 남긴 이름"
          : s.turn === ELECTION_TURN
            ? s.election.won
              ? "항구의 새 동장"
              : "도윤, 동장 당선"
            : endShare >= 50
              ? "판세가 뒤집혔다"
              : endShare > startShare
                ? "추격하는 이름 없는 가문"
                : "강씨 가문, 굳히기 들어가나",
      lines: allLines,
    });
    s.placements = {};
    s.lastResult = null;
    if (!s.ended) rivalPlan(s);
    else s.rivals = [];
    return { state: s };
  }
  // 결말에서 보여 줄 승패 이유: 득표 장부에서 가장 크게 도운 것과 해친 것.
  function reasons(s) {
    const entries = Object.entries(s.ledger).filter(([, v]) => v);
    const plus = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const minus = entries.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 3);
    return { plus, minus };
  }
  function validate(s) {
    const finite = (n, min = -1e9, max = 1e9) =>
      typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
    const fail = (m) => {
      throw Error(m);
    };
    if (!s || s.version !== 2 || !Number.isInteger(s.turn) || s.turn < 0 || s.turn > ELECTION_TURN ||
        !Number.isInteger(s.rng) || s.rng < 0 || s.rng > 0xffffffff)
      fail("지원하지 않는 저장 형식입니다.");
    if (!finite(s.money) || !finite(s.prepared, 0, 1) || !finite(s.progress, 0, 20) || !finite(s.dirt, 0, 3))
      fail("저장 수치가 올바르지 않습니다.");
    if (!s.votes || DISTRICTS.some((d) => !finite(s.votes[d.id], 0, 100)) || !s.ledger ||
        Object.values(s.ledger).some((v) => !finite(v)))
      fail("득표 기록이 올바르지 않습니다.");
    if (s.family?.length !== 3 || s.family.map((p) => p.id).join() !== "head,kin,young" ||
        s.family.some((p) => typeof p.name !== "string" || p.name.length > 20 || !finite(p.age, 16, 120) ||
          !content.traits[p.trait] || typeof p.role !== "string" || !p.skills ||
          SKILLS.some((k) => !finite(p.skills[k], 0, 30))))
      fail("가문 정보가 올바르지 않습니다.");
    if (!s.rival || !content.rivalTypes[s.rival.type] || !Array.isArray(s.rival.members) ||
        s.rival.members.length !== 3 || s.rival.members.some((m) => typeof m !== "string"))
      fail("라이벌 정보가 올바르지 않습니다.");
    if (!s.crisis || !content.crises[s.crisis.kind] || !finite(s.crisis.due, 0, ELECTION_TURN) ||
        typeof s.crisis.resolved !== "boolean")
      fail("위기 정보가 올바르지 않습니다.");
    if (!Array.isArray(s.queue) || s.queue.some((id) => !content.events.some((e) => e.id === id)) ||
        !Array.isArray(s.seen) || !Array.isArray(s.reports) || !Array.isArray(s.memories) ||
        !Array.isArray(s.rivals) || !Array.isArray(s.history))
      fail("저장 기록이 올바르지 않습니다.");
    if (!s.relations || !s.placements || ![null, "short", "long", "none"].includes(s.plan) ||
        ![null, "short", "long"].includes(s.built) || s.ended !== (s.turn === ELECTION_TURN))
      fail("저장 진행이 올바르지 않습니다.");
    for (const [id, p] of Object.entries(s.placements))
      if (!s.family.some((f) => f.id === id) || !content.places.some((l) => l.id === p))
        fail("배치 정보가 올바르지 않습니다.");
    for (const p of content.places)
      if (Object.values(s.placements).filter((id) => id === p.id).length > p.slots)
        fail("장소 정원을 초과했습니다.");
    for (const key of ["started", "witness", "secret", "ended"])
      if (typeof s[key] !== "boolean") fail("저장 상태가 올바르지 않습니다.");
    for (const p of content.people)
      if (!finite(s.relations[p.id], -100, 100)) fail("관계 기록이 올바르지 않습니다.");
    if (s.contract && (!Array.isArray(s.contract.witnesses) || s.contract.witnesses.some((v) => typeof v !== "string")))
      fail("계약 기록이 올바르지 않습니다.");
    if (s.lastResult && (typeof s.lastResult.who !== "string" || typeof s.lastResult.text !== "string"))
      fail("사건 결과가 올바르지 않습니다.");
    if (s.reports.some((r) => !r || !finite(r.turn, 0, ELECTION_TURN) || typeof r.title !== "string" ||
          !Array.isArray(r.lines) || r.lines.some((l) => typeof l !== "string")) ||
        s.memories.some((m) => !m || !finite(m.turn, 0, ELECTION_TURN) || typeof m.person !== "string" || typeof m.text !== "string"))
      fail("연대기 기록이 올바르지 않습니다.");
    if (s.election && (!finite(s.election.share, 0, 100) || typeof s.election.winner !== "string" ||
        typeof s.election.won !== "boolean" || !Array.isArray(s.election.districts) || s.election.districts.length !== 3))
      fail("개표 기록이 올바르지 않습니다.");
    if (s.rivals.some((r) => !r || typeof r.name !== "string" || !finite(r.skill, 0, 30) ||
          !content.places.some((p) => p.id === r.place)))
      fail("라이벌 기록이 올바르지 않습니다.");
    return clone(s);
  }
  const api = {
    fresh, date, horizons, choose, place, placeReason, advance, required, choiceReason,
    validate, election, share, describe, reasons, voters,
    DISTRICTS, FLOOD_TURN, ELECTION_TURN,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.SeasonEngine = api;
})(globalThis);
