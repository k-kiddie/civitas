"use strict";
// CIVITAS 맛보기 엔진. 순수 함수: (state, 입력) → 새 state. 난수 상태는 state에 저장해 새로고침해도 결과가 같다.
(function (root) {
  const D = typeof module !== "undefined" ? require("./data") : root.ProtoData;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const MAX_HP = 60,
    AP = 3,
    LAST_SEASON = 32,
    UPKEEP_FAMILY = 3,
    UPKEEP_COMPANION = 2;
  const STATS = ["talk", "force", "scheme", "lore"];
  const SIBLINGS = ["여울", "하린", "도현", "가람", "소율", "한결", "다온", "새봄"];
  const STAT_NAME = { money: "₭", fame: "명성", health: "건강", hostility: "강씨 적의", rivalFame: "도윤 명성", dirt: "약점" };

  function rnd(s) {
    s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }
  const pick = (s, list) => list[Math.floor(rnd(s) * list.length)];

  function newGame({ name = "이름 없는 가장", origin = "worker", seed = 1 } = {}) {
    const o = D.origins[origin] || D.origins.worker;
    const s = {
      v: 1,
      rng: seed >>> 0,
      season: 0,
      ap: AP,
      money: o.money,
      fame: o.fame,
      health: MAX_HP,
      hostility: o.hostility || 0,
      rivalFame: 22,
      dirt: 0,
      title: 0,
      origin,
      family: [],
      head: 0,
      companions: [],
      buildings: [],
      threats: [],
      flags: {},
      seen: {},
      event: null,
      result: null,
      summary: null,
      log: [],
      ending: null,
      lastAssassin: -99,
      plans: [],
      opps: [],
      stages: {},
      hooks: [],
      virtue: 0,
      fate: 2,
      items: [],
      perkChoice: null,
      levelups: 0,
    };
    s.family.push(person(s, String(name).slice(0, 12) || "이름 없는 가장", "가장", 25, o.stats));
    // 매 판 바뀌는 것: 라이벌 가문, 도시 특성, 가족 구성, 사건 묶음, 위기 시기
    s.rival = pick(s, Object.keys(D.rivals));
    s.trait = pick(s, Object.keys(D.cityTraits));
    if (rnd(s) < 0.4) {
      s.family.push(person(s, pick(s, SIBLINGS), "배우자", 24));
      s.flags.married = true;
    } else s.family.push(person(s, pick(s, SIBLINGS), "동생", 19));
    s.excluded = D.events.filter((e) => !e.repeat && !e.priority && !e.chain && !e.opp && rnd(s) < 0.3).map((e) => e.id);
    const floodAt = 5 + Math.floor(rnd(s) * 4) - (s.trait === "rainy" ? 2 : 0);
    s.threats.push({ id: "flood", left: floodAt });
    s.plagueAt = s.trait === "plague" ? 5 : 6 + Math.floor(rnd(s) * 7);
    if (s.trait === "poor") s.money -= 10;
    if (o.companion) s.companions.push({ id: o.companion, loyalty: 6 });
    s.log.push({ season: 0, text: `${s.family[0].name}의 가문이 벨라르 항구에 자리를 잡았다.` });
    makePlans(s);
    makeOpps(s);
    const R = D.rivals[s.rival], T = D.cityTraits[s.trait];
    s.summary = {
      date: "가문의 시작",
      headline: "이번 판의 벨라르",
      lines: [
        `⚔ 라이벌: ${R.desc}`,
        `${T.icon} 도시 특성 · ${T.name}: ${T.desc}`,
        `🌊 큰 장마까지 ${floodAt}계절${s.trait === "rainy" ? " (더 세게)" : ""}`,
        `👪 ${s.family.map((p) => `${p.role} ${p.name}`).join(", ")}`,
        `이번 판에는 사건 일부가 빠지고, 다른 판에서 못 본 사건이 나올 수 있다.`,
      ],
      net: 0,
      hooks: [],
    };
    return s;
  }
  // 인물: 능력치(−1~6), 경험치, 특기. base가 없으면 무작위(합계 약 5)
  function person(s, name, role, age, base) {
    const st = base ? { ...base } : { talk: 0, force: 0, scheme: 0, lore: 0 };
    if (!base) for (let i = 0; i < 5; i++) st[pick(s, STATS)] += 1;
    st[pick(s, STATS)] += 1;
    return { name, role, age, alive: true, stats: st, xp: {}, perks: [] };
  }
  const head = (s) => s.family[s.head];
  // 글 속 기본 라이벌 이름(도윤·강씨)을 이번 판 라이벌로 바꾼다
  function rename(s, text) {
    const R = D.rivals[s.rival || "kang"];
    return String(text).replaceAll("강씨 저택", R.manor).replaceAll("강무열", R.son).replaceAll("강씨", R.house).replaceAll("도윤", R.head);
  }
  const hasPerk = (s, id) => head(s).perks.includes(id);
  const date = (season) => `${1 + Math.floor(season / 4)}년 ${["봄", "여름", "가을", "겨울"][season % 4]}`;
  const headName = (s) => s.family[s.head].name;
  const has = (s, id) => s.companions.some((c) => c.id === id);
  const built = (s, id) => s.buildings.some((b) => b.id === id);
  const hasThreat = (s, id) => s.threats.some((t) => t.id === id);
  const nextTitle = (s) => D.titles[s.title + 1];
  // 다음 선거 계절(없으면 null)과 당선 확률
  function nextElection(s) {
    if (s.title >= 2) return null;
    const at = D.elections[s.title + 1].find((x) => x >= s.season);
    return at === undefined ? null : at;
  }
  function canElect(s) {
    return s.title < 2 && s.fame >= nextTitle(s).fame;
  }
  function electionChance(s) {
    if (!canElect(s)) return 0;
    const p = 0.5 + (s.fame - s.rivalFame) / 30 + (s.flags.bought ? 0.2 : 0) + (has(s, "sora") ? 0.05 : 0) + (has(s, "eunho") ? 0.05 : 0) + (s.virtue >= 30 ? 0.05 : 0) + (hasPerk(s, "orator") ? 0.1 : 0) - (s.trait === "corrupt" && !s.flags.bought ? 0.1 : 0);
    return clamp(Math.round(p * 100) / 100, 0.05, 0.95);
  }
  const bribeCost = (s) => Math.round(((s.title === 0 ? 35 : 70) * (s.trait === "corrupt" ? 0.6 : 1)) / (hasPerk(s, "negotiator") ? 2 : 1));
  // 도윤의 다음 수: 계절마다 미리 공개
  function makePlans(s) {
    const n = 1 + (s.title >= 1 ? 1 : 0);
    const favor = D.rivals[s.rival || "kang"].favor;
    let pool = D.rivalMoves.filter((m) => s.title >= (m.title || 0) && (m.titleMax === undefined || s.title <= m.titleMax));
    const out = [];
    while (out.length < n && pool.length) {
      const weighted = pool.flatMap((m) => (favor.includes(m.id) ? [m, m, m] : [m]));
      const m = weighted[Math.floor(rnd(s) * weighted.length)];
      pool = pool.filter((x) => x !== m);
      out.push({ id: m.id, loc: m.loc, blocked: false });
    }
    s.plans = out;
  }
  function unlocked(s, loc) {
    return s.title >= loc.title;
  }

  const DUEL_BRIBE = (s) => Math.round(((10 + s.title * 10) * (s.trait === "corrupt" ? 0.6 : 1)) / (hasPerk(s, "negotiator") ? 2 : 1));
  function getEvent(s, id) {
    if (id.startsWith("duel:")) return D.duel(D.rivalMoves.find((m) => m.id === id.slice(5)), DUEL_BRIBE(s));
    return D.events.find((e) => e.id === id);
  }
  // 이번 계절 한정 기회: 도윤이 노리는 곳과 겹치지 않게 1~2개
  function makeOpps(s) {
    const n = 1 + (s.title >= 1 ? 1 : 0);
    const taken = new Set(s.plans.map((p) => p.loc));
    const pool = D.events.filter(
      (e) => e.opp && eligible(s, e, true) && !taken.has(e.loc) && unlocked(s, D.locations.find((l) => l.id === e.loc)) &&
        (s.seen[e.id] === undefined || s.season - s.seen[e.id] >= 4),
    );
    const out = [];
    while (out.length < n && pool.length) {
      const e = pool.splice(Math.floor(rnd(s) * pool.length), 1)[0];
      if (out.some((o) => o.loc === e.loc)) continue;
      out.push({ id: e.id, loc: e.loc });
    }
    s.opps = out;
  }
  // ── 조건·확률 ──
  function eligible(s, e, forOpp = false) {
    const c = e.cond || {};
    if (e.opp && !forOpp) return false;
    if (s.excluded && s.excluded.includes(e.id)) return false;
    if (c.stage) {
      const st = s.stages[c.stage[0]];
      if (c.stage[1] === undefined ? st !== undefined : !st || st.v !== c.stage[1]) return false;
      if (c.wait && st && s.season - st.at < c.wait) return false;
    }
    if (c.titleMax !== undefined && s.title > c.titleMax) return false;
    if (e.once && s.seen[e.id] !== undefined) return false;
    if (e.cooldown && s.seen[e.id] !== undefined && s.season - s.seen[e.id] < e.cooldown) return false;
    if (c.seasonMin !== undefined && s.season < c.seasonMin) return false;
    if (c.titleMin !== undefined && s.title < c.titleMin) return false;
    if (c.fameMin !== undefined && s.fame < c.fameMin) return false;
    if (c.healthMax !== undefined && s.health > c.healthMax) return false;
    if (c.dirtMin !== undefined && s.dirt < c.dirtMin) return false;
    if (c.flag && !s.flags[c.flag]) return false;
    if (c.notFlag && s.flags[c.notFlag]) return false;
    if (c.companion && !has(s, c.companion)) return false;
    if (c.notCompanion && has(s, c.notCompanion)) return false;
    if (c.threat && !hasThreat(s, c.threat)) return false;
    if (c.building && !built(s, c.building)) return false;
    if (c.canElect && !canElect(s)) return false;
    if (c.campaign) {
      const at = nextElection(s);
      if (at === null || at - s.season > 1 || !canElect(s) || s.flags.bought) return false;
    }
    return true;
  }
  function odds(s, choice) {
    let p =
      choice.odds === "election"
        ? 0.5 + (s.fame - s.rivalFame) / 40
        : choice.odds === "showdown"
          ? 0.4 + (s.fame - s.rivalFame) / 60
          : choice.odds === "duel"
            ? Math.max(0.35, 0.6 + (s.fame - s.rivalFame) / 80)
            : choice.odds;
    for (const [who, amt] of choice.bonus || []) {
      if (who.startsWith("b:") ? built(s, who.slice(2)) : has(s, who)) p += amt;
    }
    return clamp(Math.round(p * 100) / 100, 0.1, 0.95);
  }
  // ── TRPG 판정 ──
  // 선택지의 판정 정보: [능력치, 난이도]. 예전 확률 선택지는 능력치를 붙이고 난이도로 바꾼다.
  function checkSpec(s, e, index, c) {
    let stat, dc;
    if (c.check) [stat, dc] = c.check;
    else if (typeof c.odds === "number") {
      stat = D.checkStat[`${e.id}:${index}`] || "force";
      dc = clamp(Math.round(21 - c.odds * 20 + 4), 5, 20);
    } else if (c.odds === "showdown") {
      stat = D.checkStat[`${e.id}:${index}`] || "talk";
      dc = "showdown";
    } else return null;
    if (dc === "duel") dc = clamp(13 + Math.round((s.rivalFame - s.fame) / 6), 8, 19);
    if (dc === "showdown") dc = clamp(16 + Math.round((s.rivalFame - s.fame) / 5), 10, 20);
    const parts = [[`${D.stats[stat].icon}${D.stats[stat].name}`, head(s).stats[stat]]];
    for (const comp of s.companions) if (D.companions[comp.id].assist === stat) parts.push([D.companions[comp.id].name, 2]);
    for (const id of s.items) if (D.items[id].stat === stat) parts.push([D.items[id].name, D.items[id].bonus]);
    if (stat === "lore" && hasPerk(s, "scholar")) parts.push(["학자", 2]);
    if (stat === "scheme" && built(s, "tavern")) parts.push(["주점", 1]);
    const mod = parts.reduce((n, [, v]) => n + v, 0);
    const p = clamp((21 - (dc - mod)) / 20, 0.05, 0.95);
    return { stat, dc, mod, parts, p: Math.round(p * 100) / 100 };
  }
  const scale = (fx, k) => {
    const out = { ...fx };
    for (const key of ["money", "fame", "health", "rivalFame", "dirt"]) if (typeof out[key] === "number") out[key] = Math.round(out[key] * k);
    return out;
  };
  const resolveMoney = (s, v) => (v === "bribe" ? -bribeCost(s) : v);
  function needReason(s, choice) {
    const n = choice.need || {};
    if (n.money !== undefined) {
      const cost = n.money === "bribe" ? bribeCost(s) : n.money;
      if (s.money < cost) return `₭${cost} 필요`;
    }
    if (n.companion && !has(s, n.companion)) return `${D.companions[n.companion].name} 필요`;
    if (n.flag && !s.flags[n.flag]) return "그림자 조합 가입 필요";
    if (n.hostilityMax !== undefined) {
      const max = ["ally", "friend", "kind"].includes(s.stages.son?.v) ? 50 : n.hostilityMax;
      if (s.hostility > max) return `강씨 적의 ${max} 이하 필요`;
    }
    if (n.notFlag && s.flags[n.notFlag]) return "이미 혼인했다";
    if (n.dirt !== undefined && s.dirt < n.dirt) return `약점 ${n.dirt}개 필요`;
    return "";
  }
  function fill(s, text) {
    const need = s.title < 2 ? nextTitle(s) : null;
    return String(text)
      .replace("{office}", s.title < 2 && text.includes("선거") ? nextTitle(s).name : D.titles[s.title].name)
      .replace("{bribe}", bribeCost(s))
      .replace("{left}", nextElection(s) === s.season ? "이번 계절 끝에 열린다" : "다음 계절 끝에 열린다")
      .replace("{chance}", Math.round(electionChance(s) * 100))
      .replace(
        "{requirement}",
        need
          ? `${need.name} 선거는 ${nextElection(s) === null ? "더 이상 없다" : date(nextElection(s)) + " 끝에 열린다"}. 출마하려면 명성 ★${need.fame} (지금 ★${s.fame}). 당선 확률은 도윤(★${s.rivalFame})과의 명성 차이로 정해진다.`
          : "당신은 시장이다. 이제 강씨 저택에서 결판을 낼 때다 (명성 ★110 필요).",
      );
  }
  // 화면이 그대로 쓰는 사건 보기: 문구 채우기, 선택 가능 여부, 확률.
  function view(s) {
    if (!s.event) return null;
    const e = getEvent(s, s.event.id);
    const move = e.duel ? D.rivalMoves.find((m) => "duel:" + m.id === e.id) : null;
    return {
      id: e.id,
      icon: e.icon,
      title: fill(s, e.title),
      text: fill(s, e.text).replace("{fail}", move ? describe(s, move.fail) : ""),
      duel: !!e.duel,
      opp: !!e.opp,
      chain: !!e.chain,
      loc: D.locations.find((l) => l.id === e.loc),
      choices: e.choices.map((c, i) => ({
        i,
        label: fill(s, c.label),
        reason: needReason(s, c),
        check: checkSpec(s, e, i, c),
        odds: checkSpec(s, e, i, c)?.p ?? (c.odds !== undefined ? odds(s, c) : null),
        preview: c.win ? null : describe(s, c.fx),
        win: c.win ? describe(s, c.win.fx) : null,
        lose: c.lose ? describe(s, c.lose.fx) : null,
      })),
    };
  }
  function describe(s, fx) {
    const out = [];
    for (const k of ["money", "fame", "health", "rivalFame", "hostility", "dirt"]) {
      if (fx[k] === undefined) continue;
      const v = k === "money" ? resolveMoney(s, fx[k]) : fx[k];
      if (v) out.push(`${STAT_NAME[k]} ${v > 0 ? "+" : ""}${v}`);
    }
    if (fx.recruit) out.push(`${D.companions[fx.recruit].name} 동료`);
    if (fx.marry) out.push("혼인");
    if (fx.item) out.push(`${D.items[fx.item].icon} ${D.items[fx.item].name}`);
    if (fx.loyalty) out.push(`${D.companions[fx.loyalty[0]].name} 충성 ${fx.loyalty[1] > 0 ? "+" : ""}${fx.loyalty[1]}`);
    if (fx.block) out.push("도윤의 계획 저지");
    if (fx.duelLoss) out.push("도윤의 계획 성공(1.2배)");
    if (fx.loseSibling) out.push("동생을 잃는다");
    if (fx.title) out.push("지위 상승");
    if (fx.resolve) out.push(`${D.threats[fx.resolve].name} 해결`);
    if (fx.threat) out.push(`위협: ${D.threats[fx.threat.id].name}`);
    return out.join(" · ");
  }

  // ── 효과 적용 ──
  function apply(s, fx, deltas) {
    const bump = (k, v) => {
      if (!v) return;
      const before = s[k];
      if (k === "health") s[k] = clamp(s[k] + v, 0, MAX_HP);
      else if (k === "hostility") s[k] = clamp(s[k] + v, 0, 100);
      else if (k === "rivalFame" || k === "dirt") s[k] = Math.max(0, s[k] + v);
      else s[k] += v;
      if (s[k] !== before) deltas.push({ k, v: s[k] - before });
    };
    bump("money", resolveMoney(s, fx.money));
    const hp = fx.health && fx.health < 0 && hasPerk(s, "ironside") ? Math.round(fx.health * 0.7) : fx.health;
    for (const k of ["fame", "hostility", "rivalFame", "dirt"]) bump(k, fx[k]);
    bump("health", hp);
    if (fx.item && !s.items.includes(fx.item)) {
      s.items.push(fx.item);
      deltas.push({ k: "item", v: `${D.items[fx.item].icon} ${D.items[fx.item].name}` });
      if (D.items[fx.item].fate) gainFate(s, D.items[fx.item].fate, deltas);
    }
    if (fx.recruit && !has(s, fx.recruit)) {
      s.companions.push({ id: fx.recruit, loyalty: 6 });
      deltas.push({ k: "recruit", v: D.companions[fx.recruit].name });
      log(s, `${D.companions[fx.recruit].name}이(가) 동료가 되었다.`);
    }
    if (fx.leave) s.companions = s.companions.filter((c) => c.id !== fx.leave);
    if (fx.loyalty) {
      const c = s.companions.find((x) => x.id === fx.loyalty[0]);
      if (c) {
        c.loyalty = clamp((c.loyalty ?? 6) + fx.loyalty[1], 0, 10);
        deltas.push({ k: "loyalty", v: `${D.companions[c.id].name} ${fx.loyalty[1] > 0 ? "+" : ""}${fx.loyalty[1]}` });
      }
    }
    if (fx.virtue) s.virtue = clamp(s.virtue + fx.virtue, -100, 100);
    if (fx.stage) s.stages[fx.stage[0]] = { v: fx.stage[1], at: s.season };
    if (fx.hook) s.hooks.push({ text: fx.hook, at: s.season });
    if (fx.loseSibling) {
      const sib = s.family.find((p, i) => p.role === "동생" && p.alive && i !== s.head);
      if (sib) {
        sib.alive = false;
        sib.lost = true;
        deltas.push({ k: "lost", v: sib.name });
        log(s, `동생 ${sib.name}을(를) 잃었다.`);
      }
    }
    if (fx.flag) s.flags[fx.flag] = true;
    if (fx.resolve && hasThreat(s, fx.resolve)) {
      s.threats = s.threats.filter((t) => t.id !== fx.resolve);
      deltas.push({ k: "resolve", v: D.threats[fx.resolve].name });
    }
    if (fx.threat && !hasThreat(s, fx.threat.id)) {
      s.threats.push(clone(fx.threat));
      deltas.push({ k: "threat", v: D.threats[fx.threat.id].name });
    }
    if (fx.marry) {
      s.family.push(person(s, fx.marry === "소라" ? "소라" : pick(s, ["서진", "유나", "이든", "보람"]), "배우자", 24, fx.marry === "소라" ? { talk: 3, force: 1, scheme: 0, lore: 1 } : null));
      s.flags.married = true;
      if (fx.marry === "소라") s.flags.married_sora = true;
      deltas.push({ k: "family", v: "배우자" });
      log(s, `${headName(s)}이(가) 혼인했다.`);
    }
    if (fx.title) {
      gainFate(s, 1, deltas);
      s.title = Math.min(3, s.title + fx.title);
      deltas.push({ k: "title", v: D.titles[s.title].name });
      log(s, `${headName(s)}이(가) ${D.titles[s.title].name}이(가) 되었다.`);
    }
    if (fx.ending) s.ending = fx.ending;
  }
  const fateMax = (s) => 3 + (hasPerk(s, "lucky") ? 1 : 0);
  function gainFate(s, n, deltas) {
    const before = s.fate;
    s.fate = Math.min(fateMax(s), s.fate + n);
    if (deltas && s.fate > before) deltas.push({ k: "fate", v: s.fate - before });
  }
  // 판정할 때마다 경험치. 6이 차면 능력치 +1, 두 번 오를 때마다 특기 고르기.
  function gainXp(s, stat, success, deltas) {
    const h = head(s);
    h.xp[stat] = (h.xp[stat] || 0) + (success ? 2 : 1);
    if (h.xp[stat] < 6) return;
    h.xp[stat] -= 6;
    if (h.stats[stat] < 6) {
      h.stats[stat] += 1;
      deltas.push({ k: "level", v: `${D.stats[stat].icon}${D.stats[stat].name} +1` });
      log(s, `${h.name}의 ${D.stats[stat].name}이(가) ${h.stats[stat]}이(가) 되었다.`);
    }
    s.levelups += 1;
    if (s.levelups % 2 === 0) {
      const pool = Object.keys(D.perks).filter((id) => !h.perks.includes(id));
      const out = [];
      while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd(s) * pool.length), 1)[0]);
      if (out.length) s.perkChoice = out;
    }
  }
  function pickPerk(state, id) {
    if (!state.perkChoice || !state.perkChoice.includes(id)) return { state, error: "고를 수 없는 특기입니다." };
    const s = clone(state);
    const h = head(s);
    h.perks.push(id);
    const pk = D.perks[id];
    if (pk.stat) h.stats[pk.stat[0]] += pk.stat[1];
    if (id === "lucky") gainFate(s, 1);
    s.perkChoice = null;
    log(s, `${h.name}이(가) 특기 ‘${pk.name}’을(를) 얻었다.`);
    return { state: s };
  }
  // 실패한 판정을 운명 1점으로 다시 굴린다(판정당 한 번)
  function reroll(state) {
    const r = state.result;
    if (!r || !r.pre || state.fate <= 0) return { state, error: "다시 굴릴 수 없습니다." };
    const pre = clone(r.pre);
    pre.rng = state.rng;
    pre.fate = state.fate - 1;
    return choose(pre, r.index);
  }
  function log(s, text) {
    s.log.push({ season: s.season, text });
  }
  // 가장이 쓰러지면 살아 있는 가족이 잇는다. 없으면 가문 단절.
  function checkDeath(s, notes) {
    if (s.health > 0 || s.ending) return;
    const dead = s.family[s.head];
    dead.alive = false;
    log(s, `${dead.name}이(가) 쓰러졌다.`);
    const heir = s.family.findIndex((p) => p.alive);
    if (heir < 0) {
      s.ending = "extinct";
      notes.push(`${dead.name}이(가) 쓰러졌다. 대를 이을 사람이 없다.`);
      return;
    }
    s.head = heir;
    s.family[heir].role = "가장";
    s.health = 50;
    s.fame = Math.round(s.fame * 0.8);
    notes.push(`${dead.name}이(가) 쓰러졌다. ${s.family[heir].name}이(가) 가문을 잇는다. (명성 일부를 잃었다)`);
    log(s, `${s.family[heir].name}이(가) 가문을 이었다.`);
  }

  // ── 행동 ──
  function busy(s) {
    if (s.ending) return "가문의 이야기가 끝났습니다.";
    if (s.event) return "사건부터 결정하세요.";
    if (s.result) return "결과를 확인하세요.";
    if (s.summary) return "계절 결산을 확인하세요.";
    if (s.perkChoice) return "새 특기를 고르세요.";
    return "";
  }
  function visitReason(s, locId) {
    const b = busy(s);
    if (b) return b;
    const loc = D.locations.find((l) => l.id === locId);
    if (!loc) return "알 수 없는 장소입니다.";
    if (!unlocked(s, loc)) return `${D.titles[loc.title].name} 이상만 갈 수 있습니다.`;
    if (s.ap <= 0) return "이번 계절 행동을 다 썼습니다. 계절을 넘기세요.";
    return "";
  }
  function visit(state, locId) {
    const reason = visitReason(state, locId);
    if (reason) return { state, error: reason };
    const s = clone(state);
    const plan = s.plans.find((p) => p.loc === locId && !p.blocked);
    const opp = s.opps.find((o) => o.loc === locId);
    const pool = D.events.filter((e) => e.loc === locId && eligible(s, e));
    const priority = pool.filter((e) => e.priority);
    let e;
    if (plan) e = getEvent(s, "duel:" + plan.id);
    else if (opp) {
      e = getEvent(s, opp.id);
      s.opps = s.opps.filter((o) => o !== opp);
    } else if (priority.length) e = pick(s, priority);
    else {
      const weighted = [];
      for (const ev of pool) for (let i = 0; i < (ev.repeat ? 1 : 3); i++) weighted.push(ev);
      e = pick(s, weighted);
    }
    s.ap -= 1;
    s.seen[e.id] = s.season;
    s.event = { id: e.id };
    return { state: s };
  }
  function choose(state, index) {
    if (!state.event) return { state, error: "열린 사건이 없습니다." };
    const e = getEvent(state, state.event.id);
    const c = e.choices[index];
    if (!c) return { state, error: "알 수 없는 선택입니다." };
    const reason = needReason(state, c);
    if (reason) return { state, error: reason };
    const s = clone(state);
    const deltas = [],
      notes = [];
    let text, success = null, p = null, fx, chk = null;
    const spec = checkSpec(s, e, index, c);
    if (spec) {
      const roll = 1 + Math.floor(rnd(s) * 20);
      const total = roll + spec.mod;
      const crit = roll === 20;
      const fumble = roll === 1 && !(spec.stat === "force" && hasPerk(s, "brawler"));
      success = crit || (!fumble && total >= spec.dc);
      p = spec.p;
      const out = success ? c.win : c.lose;
      fx = crit ? scale(out.fx, 1.5) : fumble ? scale(out.fx, 1.5) : out.fx;
      text = (crit ? "대성공! " : fumble ? "대실패! " : "") + out.text;
      chk = { ...spec, roll, total, crit, fumble };
      gainXp(s, spec.stat, success, deltas);
    } else if (c.odds !== undefined) {
      p = odds(s, c);
      success = rnd(s) < p;
      const out = success ? c.win : c.lose;
      fx = out.fx;
      text = out.text;
    } else {
      fx = c.fx;
      text = c.text;
    }
    apply(s, fx, deltas);
    const tag = D.virtueTags[`${e.id}:${index}`];
    if (tag) s.virtue = clamp(s.virtue + tag, -100, 100);
    if (e.duel) {
      const move = D.rivalMoves.find((m) => "duel:" + m.id === e.id);
      const plan = s.plans.find((x) => x.id === move.id);
      if (plan) plan.blocked = true;
      if (fx.block) {
        apply(s, { hostility: 3 }, deltas);
        notes.unshift(`🛡 도윤의 계획 ‘${move.text}’을(를) 막았다!`);
      } else if (fx.duelLoss) {
        const big = {};
        for (const [k, v] of Object.entries(move.fail)) big[k] = Math.round(v * 1.2);
        apply(s, big, deltas);
        notes.unshift(`⚔ 도윤이 ${move.text}: ${describe(s, big)}`);
      }
    }
    checkDeath(s, notes);
    const canReroll = chk && !success && !state.event.rerolled && !s.ending;
    s.event = null;
    s.result = {
      index,
      check: chk,
      pre: canReroll ? { ...clone(state), event: { ...state.event, rerolled: true } } : null, icon: e.icon, title: fill(s, e.title), choice: fill(s, c.label), text, success, odds: p, deltas, notes };
    return { state: s };
  }
  function dismiss(state) {
    if (!state.result && !state.summary) return { state };
    const s = clone(state);
    s.result = null;
    s.summary = null;
    return { state: s };
  }
  function buildReason(s, id) {
    const b = D.buildings[id];
    if (!b) return "알 수 없는 건물입니다.";
    const busyText = busy(s);
    if (busyText) return busyText;
    if (s.title < b.title) return `${D.titles[b.title].name} 이상`;
    if (b.unique && built(s, id)) return "이미 지었습니다";
    if (s.buildings.length >= D.LOTS) return "빈 땅이 없습니다";
    if (s.money < buildCost(s, id)) return `₭${buildCost(s, id)} 필요`;
    return "";
  }
  const buildCost = (s, id) => D.buildings[id].cost - (id === "dike" && has(s, "yun") ? 20 : 0);
  function build(state, id) {
    const reason = buildReason(state, id);
    if (reason) return { state, error: reason };
    const s = clone(state);
    const b = D.buildings[id];
    const deltas = [];
    s.money -= buildCost(s, id);
    deltas.push({ k: "money", v: -buildCost(s, id) });
    s.buildings.push({ id, lot: firstFreeLot(s) });
    if (b.now) apply(s, b.now, deltas);
    log(s, `${b.name}을(를) 지었다.`);
    s.result = { icon: b.icon, title: `${b.name} 완공`, choice: "", text: b.desc, success: null, odds: null, deltas, notes: [] };
    return { state: s };
  }
  function firstFreeLot(s) {
    for (let i = 0; i < D.LOTS; i++) if (!s.buildings.some((b) => b.lot === i)) return i;
    return 0;
  }
  // 계절 결산 미리보기(화면에 "다음 계절 ₭" 표시용)
  function forecast(s) {
    let income = 0,
      fame = 0;
    for (const b of s.buildings) {
      income += D.buildings[b.id].income + (s.trait === "trade" && D.buildings[b.id].income ? 2 : 0);
      fame += D.buildings[b.id].fame;
    }
    if (s.flags.edict_tax) income += 8;
    if (s.flags.partner) income += 6;
    if (s.flags.railway) income += 10;
    if (s.trait === "poor") fame += 1;
    income += [0, 15, 30, 30][s.title]; // 직책 봉급
    if (hasPerk(s, "trader")) income += 5;
    if (s.flags.edict_relief) fame += 2;
    if (has(s, "sora")) fame += 1;
    const upkeep = UPKEEP_FAMILY * s.family.filter((p) => p.alive).length + UPKEEP_COMPANION * s.companions.length + 5 * s.title;
    return { income, upkeep, fame, net: income - upkeep };
  }
  function endSeason(state) {
    const b = busy(state);
    if (b) return { state, error: b };
    const s = clone(state);
    const lines = [],
      notes = [];
    const f = forecast(s);
    s.money += f.net;
    lines.push(`수입 ₭+${f.income} · 생활비 ₭−${f.upkeep}`);
    if (f.fame) {
      s.fame += f.fame;
      lines.push(`건물·동료·칙령 덕에 명성 +${f.fame}`);
    }
    if (built(s, "press")) s.rivalFame = Math.max(0, s.rivalFame - 2);
    const rivalGain = 2 + s.title + (s.trait === "trade" ? 1 : 0);
    s.rivalFame += rivalGain;
    lines.push(`도윤의 명성 +${rivalGain} (★${s.rivalFame})`);
    if (s.title >= 1) s.hostility = clamp(s.hostility + 2 * s.title, 0, 100);
    // 막지 못한 도윤의 계획
    for (const p of s.plans) {
      if (p.blocked) continue;
      const m = D.rivalMoves.find((x) => x.id === p.id);
      const d = [];
      apply(s, m.fail, d);
      lines.push(`⚔ 도윤이 ${m.text}: ${describe(s, m.fail)}`);
    }
    // 정해진 선거
    let election = null;
    if (nextElection(s) === s.season) {
      const office = nextTitle(s).name;
      if (!canElect(s)) {
        election = { office, eligible: false, need: nextTitle(s).fame };
        lines.unshift(`🗳 ${office} 선거 — 명성 ★${nextTitle(s).fame}이 안 돼 출마하지 못했다. 도윤 측이 자리를 지켰다.`);
      } else {
        const p = electionChance(s);
        const won = rnd(s) < p;
        election = { office, eligible: true, won, p };
        if (won) {
          s.title += 1;
          s.fame += 5;
          gainFate(s, 1);
          log(s, `${headName(s)}이(가) ${office} 선거에서 이겼다.`);
          lines.unshift(`🗳 ${office} 선거 당선! (확률 ${Math.round(p * 100)}%) 명성 +5`);
        } else {
          s.fame = Math.max(0, s.fame - 3);
          log(s, `${headName(s)}이(가) ${office} 선거에서 졌다.`);
          lines.unshift(`🗳 ${office} 선거 낙선… (확률 ${Math.round(p * 100)}%) 명성 −3`);
        }
      }
      delete s.flags.bought;
    }
    // 공포로 다스리면 곧은 동료들이 등을 돌린다. 충성이 바닥나면 배신.
    if (s.virtue <= -30) for (const c of s.companions) if (["sora", "minseok", "seoyun", "yun"].includes(c.id)) c.loyalty = Math.max(0, (c.loyalty ?? 6) - 1);
    for (const c of s.companions.slice()) {
      if ((c.loyalty ?? 6) > 2) continue;
      s.companions = s.companions.filter((x) => x !== c);
      s.rivalFame += 5;
      s.dirt = 0;
      lines.push(`🐍 ${D.companions[c.id].name}이(가) 도윤에게 넘어갔다. 당신이 모은 약점도 함께 사라졌다. 도윤 ★+5`);
      log(s, `${D.companions[c.id].name}이(가) 배신했다.`);
    }
    // 위협 진행
    for (const t of s.threats) t.left -= 1;
    const due = s.threats.filter((t) => t.left <= 0);
    s.threats = s.threats.filter((t) => t.left > 0);
    for (const t of due) lines.push(expire(s, t.id));
    // 새 위협
    if (s.money < 0 && !hasThreat(s, "debt")) {
      s.threats.push({ id: "debt", left: 2 });
      lines.push("💸 빚쟁이가 찾아오기 시작했다 (2계절 안에 갚아야 한다).");
    }
    if (s.hostility >= 70 && !hasThreat(s, "assassin") && s.season - s.lastAssassin >= 6) {
      s.threats.push({ id: "assassin", left: 2 });
      s.lastAssassin = s.season;
      lines.push("🗡 강씨 가문이 자객을 고용했다는 소문이다.");
    }
    if (s.season === (s.plagueAt ?? 8) && !s.flags.plagued && (s.trait === "plague" || rnd(s) < 0.7)) {
      s.flags.plagued = true;
      s.threats.push({ id: "plague", left: 3 });
      lines.push("🤒 남쪽 항구에서 열병이 번지고 있다.");
    }
    s.season += 1;
    s.ap = AP;
    makePlans(s);
    makeOpps(s);
    if (s.season % 4 === 0) s.family.forEach((p) => p.alive && p.age++);
    checkDeath(s, notes);
    if (!s.ending && s.season >= LAST_SEASON) s.ending = "time";
    const hooks = s.hooks.filter((h) => h.at === s.season - 1).map((h) => h.text);
    s.summary = { date: date(s.season - 1), headline: pick(s, D.headlines), lines: [...lines, ...notes], net: f.net, election, hooks };
    return { state: s };
  }
  function expire(s, id) {
    const removeBuilding = () => {
      const victims = s.buildings.filter((b) => b.id !== "dike");
      if (!victims.length) return "";
      const v = pick(s, victims);
      s.buildings = s.buildings.filter((b) => b !== v);
      return ` ${D.buildings[v.id].name}이(가) 물에 잠겼다.`;
    };
    if (id === "flood") {
      if (s.flags.promise && has(s, "sora")) s.stages.sora = { v: built(s, "dike") ? "kept" : "broken", at: s.season };
      if (built(s, "dike")) {
        const bonus = s.flags.promise ? 15 : 10;
        s.fame += bonus;
        gainFate(s, 1);
        return `🌊 큰 장마! 제방이 버텼다. 명성 +${bonus}${s.flags.promise ? " (소라와의 약속을 지켰다)" : ""}.`;
      }
      const hard = s.trait === "rainy" ? 1.5 : 1;
      s.money -= Math.round(30 * hard);
      s.fame = Math.max(0, s.fame - Math.round((s.flags.promise ? 16 : 8) * hard));
      s.health = Math.max(0, s.health - 10);
      return `🌊 큰 장마! 제방이 없어 항구가 잠겼다. ₭−${Math.round(30 * hard)} · 명성 −${Math.round((s.flags.promise ? 16 : 8) * hard)}${s.flags.promise ? " (약속을 어겼다)" : ""} · 건강 −10.${removeBuilding()}`;
    }
    if (id === "debt") {
      if (s.money >= 0) return "💸 빚을 정리해 빚쟁이가 물러났다.";
      s.money = 0;
      s.health = Math.max(0, s.health - 25);
      s.fame = Math.max(0, s.fame - 6);
      return "💸 빚쟁이들이 집을 털고 가장을 두들겨 팼다. 건강 −25 · 명성 −6.";
    }
    if (id === "customs") {
      if (has(s, "minseok")) return "🚨 민석이 단속 명단을 미리 빼냈다. 무사히 넘어갔다.";
      s.money -= 30;
      s.fame = Math.max(0, s.fame - 10);
      return "🚨 세관 단속에 걸렸다. 벌금 ₭−30 · 명성 −10.";
    }
    if (id === "assassin") {
      if (has(s, "minseok")) return "🗡 민석이 자객을 붙잡았다.";
      if (rnd(s) < 0.5) {
        s.health = Math.max(0, s.health - 50);
        return "🗡 밤길에 자객이 덮쳤다. 건강 −50.";
      }
      return "🗡 자객의 칼이 빗나갔다. 운이 좋았다.";
    }
    if (id === "plague") {
      s.health = Math.max(0, s.health - 25);
      s.fame = Math.max(0, s.fame - 5);
      return "🤒 열병이 덮쳤다. 건강 −25 · 명성 −5.";
    }
    if (id === "sibling") {
      s.money -= 25;
      return "🎲 동생의 노름빚 ₭25가 빠져나갔다.";
    }
    return "";
  }
  function score(s) {
    return s.fame + s.title * 30 + s.buildings.length * 5 + Math.floor(Math.max(0, s.money) / 5) + (D.endings[s.ending]?.win ? 50 : 0);
  }
  function validate(s) {
    const ok =
      s && s.v === 1 && Number.isInteger(s.season) && s.season >= 0 && s.season <= LAST_SEASON &&
      Number.isInteger(s.rng) && [s.money, s.fame, s.health, s.hostility, s.rivalFame, s.dirt].every(Number.isFinite) &&
      Array.isArray(s.family) && s.family.length >= 1 && s.family[s.head] && Array.isArray(s.companions) &&
      Array.isArray(s.buildings) && Array.isArray(s.threats) && Array.isArray(s.plans) && Array.isArray(s.opps) && s.stages && Array.isArray(s.hooks) && Number.isFinite(s.virtue) && Number.isFinite(s.fate) && D.rivals[s.rival] && D.cityTraits[s.trait] && Array.isArray(s.excluded) && Array.isArray(s.items) && s.family.every((p) => p.stats && p.xp && Array.isArray(p.perks)) && s.flags && s.seen && Array.isArray(s.log) &&
      (!s.event || !!getEvent(s, s.event.id)) &&
      s.buildings.every((b) => D.buildings[b.id]) && s.threats.every((t) => D.threats[t.id]) &&
      s.companions.every((c) => D.companions[c.id]);
    if (!ok) throw Error("저장이 손상되었습니다.");
    return clone(s);
  }
  const api = {
    newGame, visit, visitReason, choose, dismiss, build, buildReason, buildCost, endSeason, forecast,
    view, describe, canElect, nextElection, electionChance, date, getEvent, eligible, pickPerk, reroll, checkSpec, fateMax, rename, MAX_HP, headName, score, validate, unlocked, odds,
    AP, LAST_SEASON,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.ProtoEngine = api;
})(globalThis);
