"use strict";
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
  function random(state) {
    state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
    return state.rng / 4294967296;
  }
  function rivalPlan(s) {
    const targets =
      s.turn < 5
        ? ["dock", "company", "gate", "tavern", "union"]
        : ["dock", "company", "square", "union", "tavern"];
    s.rivals = ["도윤", "강해진", "강수연"].map((name, i) => ({
      id: "kang" + i,
      name,
      place: targets[Math.floor(random(s) * targets.length)],
      skill: i === 0 ? 12 : 7,
      hidden: i === 2 && random(s) < 0.4,
    }));
  }
  function fresh({
    name = "이름 없는 가장",
    gender = "unspecified",
    seed = 0x61c1a5,
  } = {}) {
    const s = {
      version: 1,
      turn: 0,
      rng: seed >>> 0,
      money: 32,
      influence: 8,
      fame: 0,
      support: 25,
      prepared: 0,
      plan: null,
      progress: 0,
      started: false,
      built: null,
      contract: null,
      promise: null,
      witness: false,
      secret: false,
      candidate: false,
      platform: "housing",
      flooded: null,
      election: null,
      position: null,
      ended: false,
      family: [
        {
          id: "head",
          name: String(name).slice(0, 20),
          gender,
          role: "가장",
          age: 25,
          trait: "야심",
          skills: { talk: 10, manage: 9, scheme: 6, nerve: 10 },
        },
        {
          id: "kin",
          name: "하린",
          role: "형제",
          age: 23,
          trait: "의리",
          skills: { talk: 8, manage: 12, scheme: 7, nerve: 8 },
        },
        {
          id: "young",
          name: "여울",
          role: "동생",
          age: 17,
          trait: "학구",
          skills: { talk: 7, manage: 7, scheme: 11, nerve: 7 },
        },
      ],
      relations: Object.fromEntries(content.people.map((p) => [p.id, 0])),
      placements: {},
      rivals: [],
      queue: ["plan"],
      seen: [],
      memories: [],
      history: [],
      reports: [
        {
          turn: 0,
          title: "강 위에 먹구름",
          lines: [
            "첫 큰 장마까지 다섯 계절. 윤과 제방 계획부터 정하세요.",
            "가문 사람을 골라 장소를 누르거나, 지도 위로 끌어 놓으세요.",
          ],
        },
      ],
      lastResult: null,
    };
    rivalPlan(s);
    return s;
  }
  function date(turn) {
    const t = Math.min(turn, 11);
    return `${1 + Math.floor(t / 4)}년 ${["봄", "여름", "가을", "겨울"][t % 4]}`;
  }
  function horizons(s) {
    return [
      {
        id: "flood",
        name: "첫 큰 장마",
        due: 5,
        detail: "제방 공정과 수문 대비가 피해를 바꿉니다.",
      },
      {
        id: "election",
        name: "동장 선거",
        due: 8,
        detail: "주민 지지와 장마의 기억이 표가 됩니다.",
      },
    ]
      .filter((h) => s.turn < h.due)
      .map((h) => ({ ...h, left: h.due - s.turn }));
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
      (!r.won || s.election?.won) &&
      (!r.lost || (s.election && !s.election.won))
    );
  }
  function schedule(s) {
    const room = 2 - s.queue.length;
    if (room <= 0) return;
    const candidates = content.events.filter(
      (e) => eligible(s, e) && !s.queue.includes(e.id),
    );
    const major = candidates
      .filter((e) => e.kind === "major")
      .sort(
        (a, b) =>
          (b.requires.turn !== undefined) - (a.requires.turn !== undefined),
      );
    s.queue.push(...major.slice(0, room).map((e) => e.id));
    if (s.queue.length < 2) {
      const minor = candidates.filter((e) => e.kind === "minor");
      if (minor.length)
        s.queue.push(minor[Math.floor(random(s) * minor.length)].id);
    }
  }
  function choiceReason(s, c) {
    if (c.requires.secret && !s.secret) return "밀수 장부가 필요합니다.";
    if (c.requires.money > 0 && s.money < c.requires.money)
      return "가문 돈이 부족합니다.";
    return "";
  }
  function effects(s, e) {
    for (const key of ["money", "influence", "fame", "support"])
      if (e[key]) s[key] += e[key];
    s.influence = clamp(s.influence);
    s.fame = Math.max(0, s.fame);
    s.support = clamp(s.support);
    if (e.plan) s.plan = e.plan;
    if (e.prepared) s.prepared = clamp(s.prepared + e.prepared, 0, 1);
    if (e.progress && s.plan !== "none") s.progress += e.progress;
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
    if (e.secret) s.secret = true;
    if (e.relation)
      s.relations[e.relation[0]] = clamp(
        s.relations[e.relation[0]] + e.relation[1],
        -100,
        100,
      );
    if (e.candidate !== undefined) s.candidate = e.candidate;
    if (e.platform) s.platform = e.platform;
    if (e.training) s.family.find((p) => p.id === "young").skills.manage += 2;
    if (e.memory) remember(s, "doyun", e.memory, "grudge");
    finishProject(s);
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
    if (state.queue[0] !== eventId)
      return { state, error: "이미 처리했거나 현재 사건이 아닙니다." };
    const e = content.events.find((e) => e.id === eventId),
      c = e?.choices.find((c) => c.id === choiceId);
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const reason = choiceReason(state, c);
    if (reason) return { state, error: reason };
    const s = clone(state);
    effects(s, c.effects);
    s.queue.shift();
    s.seen.push(e.id);
    const person = content.people.find((p) => p.id === e.who);
    remember(s, e.who, `${e.title} · ${c.label}. ${c.reply}`);
    s.lastResult = { who: person?.name || "", text: c.reply };
    return { state: s };
  }
  function placeReason(s, personId, placeId) {
    if (s.ended) return "첫 장을 마쳤습니다.";
    if (s.queue.length) return "열린 사건부터 결정하세요.";
    if (!s.family.some((p) => p.id === personId))
      return "가문 사람을 선택하세요.";
    const p = content.places.find((p) => p.id === placeId);
    if (!p) return "알 수 없는 장소입니다.";
    if (s.placements[personId] === placeId) return "";
    if (
      Object.values(s.placements).filter((id) => id === placeId).length >=
      p.slots
    )
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
  function election(s) {
    const voters = [48, 26 - Math.min(18, s.flooded || 0), 12],
      names = ["항구", "어촌", "언덕"];
    const districts = voters.map((voters, i) => {
      const strength = clamp(
        s.support +
          (i === 1
            ? s.promise === "kept"
              ? 12
              : s.promise === "broken"
                ? -12
                : 0
            : 0) +
          (i === 2 && s.witness ? 8 : 0) +
          (s.platform === "trade" && i === 0
            ? 8
            : s.platform === "housing" && i === 1
              ? 8
              : 0) -
          (i === 0 && s.contract ? 8 : 0),
        5,
        95,
      );
      const share = s.candidate ? strength : 0;
      return {
        name: names[i],
        voters,
        share,
        winner: share >= 50 ? "player" : "kang",
      };
    });
    const share =
      districts.reduce((n, d) => n + d.share * d.voters, 0) /
      voters.reduce((a, b) => a + b, 0);
    return {
      won: share >= 50,
      share: Math.round(share),
      districts,
      winner: share >= 50 ? s.family[0].name : "도윤",
    };
  }
  function advance(state) {
    if (state.ended || state.queue.length)
      return {
        state,
        error: state.ended
          ? "첫 장을 마쳤습니다."
          : "열린 사건부터 결정하세요.",
      };
    const s = clone(state),
      lines = [],
      before = s.money;
    const oldTurn = s.turn;
    const jobs = s.family.map((person) => ({
      person,
      place: content.places.find(
        (p) => p.id === (s.placements[person.id] || "home"),
      ),
    }));
    const successful = [];
    for (const { person, place: p } of jobs) {
      const rivals = s.rivals.filter((r) => r.place === p.id),
        score =
          person.skills[p.skill] +
          Math.floor(random(s) * 9) +
          (person.trait === "의리" && p.id === "gate" ? 2 : 0);
      const rivalScore = rivals.length
        ? Math.max(...rivals.map((r) => r.skill + Math.floor(random(s) * 9)))
        : -1;
      if (score < rivalScore) {
        lines.push(`${person.name}: ${p.name}에서 강씨 가문과 경쟁해 밀렸다.`);
        s.relations.doyun = Math.max(-100, s.relations.doyun - 3);
        continue;
      }
      successful.push({ person, place: p, score });
      if (p.kind === "work") {
        const pay = s.contract ? 15 : 20;
        s.money += pay;
        lines.push(`${person.name}: 하역 품삯 ${pay}.`);
      }
      if (p.kind === "trade") {
        s.money += 24;
        lines.push(`${person.name}: 상단 품삯 24.`);
      }
      if (p.kind === "home") {
        s.money += 7;
        lines.push(`${person.name}: 집안 수입 7.`);
      }
      if (p.kind === "organize") {
        s.money += 9;
        s.support = clamp(s.support + 5);
        lines.push(`${person.name}: 주민 모금 9, 어민들의 신임을 얻었다.`);
      }
      if (p.kind === "union") {
        s.influence = clamp(s.influence + 4);
        s.support = clamp(s.support + 6);
        lines.push(`${person.name}: 조합이 가문을 지지했다.`);
      }
      if (p.kind === "spy") {
        s.influence = clamp(s.influence + 3);
        if (score >= 14) {
          s.secret = true;
          lines.push(`${person.name}: 강씨 상관의 밀수 장부를 확보했다.`);
        } else lines.push(`${person.name}: 상관의 야간 하역 소문을 들었다.`);
      }
    }
    // Income settles first; construction does not depend on the order of the player's placements.
    for (const { person, place: p } of successful.filter(
      (j) => j.place.kind === "prepare",
    )) {
      s.prepared = clamp(s.prepared + 0.1, 0, 1);
      if (s.turn >= 5) {
        s.support = clamp(s.support + 3);
        lines.push(`${person.name}: 수문을 보수했다. 주민 지지가 올랐다.`);
        continue;
      }
      if (s.plan === "none") {
        lines.push(`${person.name}: 피난 물길을 확보했다.`);
        continue;
      }
      if (!s.started) {
        const cost = harbor.plans[s.plan]?.cost;
        if (cost && s.money >= cost) {
          s.money -= cost;
          s.started = true;
          lines.push(`${harbor.plans[s.plan].name} 착공 · 자재비 ${cost}.`);
        } else {
          lines.push(`${person.name}: 공사 자금이 부족해 물길만 조사했다.`);
          continue;
        }
      }
      if (s.started && !s.built) {
        s.progress += 1 + (person.skills.manage >= 10 ? 1 : 0);
        finishProject(s);
        lines.push(`${person.name}: 제방 공정 ${s.progress}/${required(s)}.`);
      }
    }
    const expense = s.family.length * 4;
    s.money -= expense;
    lines.push(`가문 생활비 ${expense}.`);
    if (s.money < 0) {
      s.support = clamp(s.support - 5);
      lines.push("외상 장부가 늘었다. 가문 지지가 흔들린다.");
    }
    if (s.position) {
      s.money += 10;
      lines.push("동장 계절 보수 10.");
    }
    s.turn++;
    s.family.forEach((p) => {
      if (s.turn % 4 === 0) p.age++;
    });
    if (s.turn === 5) {
      const baseline = harbor.floodLoss(s.built || "none");
      s.flooded = Math.max(0, baseline - Math.floor(s.prepared * 8));
      if (s.promise === "pending") {
        s.promise = s.flooded === 0 ? "kept" : "broken";
        remember(
          s,
          "sora",
          s.promise === "kept"
            ? "어촌을 지키겠다는 약속을 지켰다."
            : "어촌 보호 약속을 지키지 못했다.",
          s.promise,
        );
      }
      s.support = clamp(
        s.support +
          (s.flooded === 0 ? 18 : -12) +
          (s.promise === "kept" ? 8 : s.promise === "broken" ? -8 : 0),
      );
      s.fame += s.flooded === 0 ? 12 : 2;
      s.queue.push("flood");
      remember(
        s,
        "sora",
        `첫 장마에 ${s.flooded}가구가 침수됐다.`,
        s.flooded ? "loss" : "gratitude",
      );
      lines.unshift(
        `첫 장마 · ${s.flooded}가구 침수. ${s.built ? harbor.plans[s.built].name + "이 남았다." : "미완성 제방은 물을 막지 못했다."}`,
      );
    }
    if (s.turn === 8) {
      s.election = election(s);
      s.position = s.election.won ? "동장" : null;
      s.queue.push("election");
      if (s.election.won) s.fame += 10;
      lines.unshift(
        `동장 선거 · ${s.election.winner} 당선. 당신의 득표율 ${s.election.share}%.`,
      );
      remember(s, "jian", lines[0], "election");
    }
    if (s.turn === 12) {
      s.ended = true;
      s.queue.push("ending");
    } else schedule(s);
    s.history.push({
      turn: oldTurn,
      placements: clone(s.placements),
      net: s.money - before,
      lines: clone(lines),
    });
    s.reports.unshift({
      turn: s.turn,
      title:
        s.turn === 5
          ? "강물이 남긴 이름"
          : s.turn === 8
            ? "항구의 새 동장"
            : s.turn === 12
              ? "가문의 첫 장을 덮다"
              : s.built
                ? "제방 위로 이어진 길"
                : "항구의 계절이 바뀌다",
      lines,
    });
    s.placements = {};
    s.lastResult = null;
    rivalPlan(s);
    return { state: s };
  }
  function validate(s) {
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.turn) ||
      s.turn < 0 ||
      s.turn > 12 ||
      !Number.isInteger(s.rng) ||
      s.rng < 0 ||
      s.rng > 0xffffffff
    )
      throw Error("지원하지 않는 저장 형식입니다.");
    for (const key of [
      "money",
      "influence",
      "fame",
      "support",
      "prepared",
      "progress",
    ])
      if (!Number.isFinite(s[key]) || Math.abs(s[key]) > 1e9)
        throw Error("저장 수치가 올바르지 않습니다.");
    if (
      s.family?.length !== 3 ||
      new Set(s.family.map((p) => p.id)).size !== 3 ||
      s.family.some(
        (p) =>
          !["head", "kin", "young"].includes(p.id) ||
          typeof p.name !== "string" ||
          !p.skills ||
          Object.values(p.skills).some((v) => !Number.isFinite(v)),
      )
    )
      throw Error("가문 정보가 올바르지 않습니다.");
    if (
      !Array.isArray(s.queue) ||
      s.queue.some((id) => !content.events.some((e) => e.id === id)) ||
      !Array.isArray(s.seen) ||
      !Array.isArray(s.reports) ||
      !Array.isArray(s.memories) ||
      !Array.isArray(s.rivals) ||
      !Array.isArray(s.history)
    )
      throw Error("저장 기록이 올바르지 않습니다.");
    if (
      !s.relations ||
      !s.placements ||
      ![null, "short", "long", "none"].includes(s.plan) ||
      ![null, "short", "long"].includes(s.built) ||
      s.ended !== (s.turn === 12)
    )
      throw Error("저장 진행이 올바르지 않습니다.");
    for (const [id, p] of Object.entries(s.placements))
      if (
        !s.family.some((f) => f.id === id) ||
        !content.places.some((l) => l.id === p)
      )
        throw Error("배치 정보가 올바르지 않습니다.");
    for (const p of content.places)
      if (
        Object.values(s.placements).filter((id) => id === p.id).length > p.slots
      )
        throw Error("장소 정원을 초과했습니다.");
    for (const key of ["started", "witness", "secret", "candidate", "ended"])
      if (typeof s[key] !== "boolean")
        throw Error("저장 상태가 올바르지 않습니다.");
    const finite = (n, min = -1e9, max = 1e9) =>
      typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
    for (const p of s.family)
      if (
        !finite(p.age, 16, 120) ||
        p.name.length > 20 ||
        typeof p.trait !== "string" ||
        typeof p.role !== "string" ||
        ["talk", "manage", "scheme", "nerve"].some(
          (k) => !finite(p.skills[k], 0, 30),
        )
      )
        throw Error("인물 정보가 올바르지 않습니다.");
    for (const p of content.people)
      if (!finite(s.relations[p.id], -100, 100))
        throw Error("관계 기록이 올바르지 않습니다.");
    if (
      s.contract &&
      (!Array.isArray(s.contract.witnesses) ||
        s.contract.witnesses.some((v) => typeof v !== "string"))
    )
      throw Error("계약 기록이 올바르지 않습니다.");
    if (
      s.lastResult &&
      (typeof s.lastResult.who !== "string" ||
        typeof s.lastResult.text !== "string")
    )
      throw Error("사건 결과가 올바르지 않습니다.");
    if (
      s.reports.some(
        (r) =>
          !r ||
          !finite(r.turn, 0, 12) ||
          typeof r.title !== "string" ||
          !Array.isArray(r.lines) ||
          r.lines.some((l) => typeof l !== "string"),
      ) ||
      s.memories.some(
        (m) =>
          !m ||
          !finite(m.turn, 0, 12) ||
          typeof m.person !== "string" ||
          typeof m.text !== "string",
      )
    )
      throw Error("연대기 기록이 올바르지 않습니다.");
    if (
      s.election &&
      (!finite(s.election.share, 0, 100) ||
        typeof s.election.winner !== "string" ||
        typeof s.election.won !== "boolean" ||
        !Array.isArray(s.election.districts) ||
        s.election.districts.length !== 3 ||
        s.election.districts.some(
          (d) =>
            !["항구", "어촌", "언덕"].includes(d.name) ||
            !finite(d.share, 0, 100) ||
            !finite(d.voters, 0, 100) ||
            !["player", "kang"].includes(d.winner),
        ))
    )
      throw Error("개표 기록이 올바르지 않습니다.");
    if (
      s.rivals.some(
        (r) =>
          !r ||
          typeof r.name !== "string" ||
          !finite(r.skill, 0, 30) ||
          !content.places.some((p) => p.id === r.place),
      )
    )
      throw Error("라이벌 기록이 올바르지 않습니다.");
    return clone(s);
  }
  const api = {
    fresh,
    date,
    horizons,
    choose,
    place,
    placeReason,
    advance,
    required,
    choiceReason,
    validate,
    election,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.SeasonEngine = api;
})(globalThis);
