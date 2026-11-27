"use strict";
// 「남행」 엔진. 순수 함수: (상태, 입력) → { state, error }. 난수는 상태 안에 있어 새로고침해도 같다.
// 흐름: intro → map(길 고르기) → event(장소·이야기 박자) → camp(야영) → map … → 절정 → end
(function (root) {
  const C = typeof module !== "undefined" ? require("./content") : root.JourneyContent;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const BAG = 8;
  function rnd(s) { s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0; return s.rng / 4294967296; }
  const pick = (s, a) => a[Math.floor(rnd(s) * a.length)];
  const shuffle = (s, a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const d20 = (s) => 1 + Math.floor(rnd(s) * 20);
  const HP = ["멀쩡함", "다침", "크게 다침", "위독", "죽음"];
  const HUNGER = ["배부름", "배고픔", "굶주림", "아사 직전"];
  const COLD = ["따뜻함", "추움", "몸이 언다", "저체온"];
  const STATS = { force: "완력", wits: "눈치", talk: "말솜씨", craft: "손재주" };
  // 이야기 박자 → 그림 이름 (assets/journey/scenes/)
  const BEAT_ART = { bt_p1: "bt_crack", bt_p2: "bt_evidence", bt_p3: "bt_evidence", bt_c: "bt_trust", bt_tA: "bt_betrayal", bt_tB: "bt_betrayal", bt_pay: "bt_reckoning",
    hk_p1: "hk_radio", hk_p2: "hk_photo", hk_p3: "hk_radio", hk_c: "hk_sick_child", hk_tA: "hk_reveal", hk_tB: "hk_radio", hk_pay: "hk_choice",
    fs_p1: "fs_bloodstain", fs_p2: "fs_gathering", fs_p3: "fs_bloodstain", fs_c: "fs_map_sale", fs_tA: "fs_cages", fs_tB: "fs_trap", fs_pay: "fs_cages" };
  const CLUE_OF = { betrayal: "bt", hidden_kin: "hk", false_salvation: "fs" };

  // ── 시작 ──
  function newGame({ origin = "parent", seed = 1, name = "" } = {}) {
    const o = C.origins[origin] || C.origins.parent;
    const s = {
      v: 1, rng: seed >>> 0, origin: C.origins[origin] ? origin : "parent", day: 1, trainDay: 13, act: 1, step: 0, place: o.start,
      phase: "intro", me: { hp: 0, hunger: 0, cold: 0, stats: { ...o.stats } }, comps: [], food: o.food, fuel: o.fuel, bag: [],
      facts: {}, clues: { bt: 0, hk: 0, fs: 0 }, human: 60, wolves: 0, debts: [], journal: [], chronicle: [],
      map: {}, dir: null, ev: null, camp: null, ending: null, title: "", seen: {},
    };
    s.trainDay = 14 + Math.floor(rnd(s) * 2);
    for (const k of o.items) addItem(s, k);
    if (o.randomItems) for (const k of shuffle(s, ["rope", "knife", "lamp", "crowbar", "lighter", "bandage", "liquor", "cigarettes", "cloth"]).slice(0, o.randomItems)) addItem(s, k);
    // 지도: 막마다 4걸음(걸음마다 2~3곳) + 관문
    const pool = (act) => Object.entries(C.places).filter(([, p]) => p.act === act && !p.gate && !p.dest).map(([k]) => k);
    // 막마다 장소 7곳을 2·2·2·1로 나눠 네 걸음을 만든다(같은 곳이 두 번 나오지 않는다)
    for (const act of [1, 2]) {
      const order = shuffle(s, pool(act)), cols = [];
      for (const n of [2, 2, 2, 1]) cols.push(order.splice(0, n));
      cols.push([act === 1 ? "gate_bridge" : "gate_checkpoint"]);
      s.map[act] = cols;
    }
    s.map[3] = [["mountain_pass"], ["station_whiteferry", "geothermal_valley", "return_road"]];
    // 감독: 출신에 맞는 전제와 반전을 고르고 박자를 배치한다
    const prem = pick(s, o.premises), twist = rnd(s) < 0.5 ? "A" : "B";
    s.dir = { premise: prem, twist, roles: {}, pending: [], done: {}, payoff: null };
    if (prem === "betrayal") ensureCompanionStop(s);
    const P = premiseOf(s);
    // 박자 배치: (막-걸음) → 박자들
    const at = (act, step, beat) => s.dir.pending.push({ act, step, beat });
    at(1, 1, { type: "premise", key: "plant", i: 0 });
    at(1, 3, { type: "premise", key: "plant", i: 1 });
    at(2, 0, { type: "premise", key: "plant", i: 2 });
    at(2, 1, { type: "premise", key: "complicate" });
    at(2, 3, { type: "premise", key: "twist" });
    at(1, 2, { type: "origin", n: 1 });
    at(2, 2, { type: "origin", n: 2 });
    if (s.origin === "drifter") { s.dir.pending = s.dir.pending.filter((b) => !(b.beat.type === "origin" && b.beat.n === 1)); at(2, 0, { type: "origin", n: 1 }); }
    if (prem === "hidden_kin") s.dir.roles.kin = s.origin === "parent" ? "soi" : "dochi";
    s.chronicle.push({ day: 1, title: o.name, paras: o.intro.slice() });
    return s;
  }
  // 배신 전제: 1막 첫 걸음에 동행을 만날 수 있는 곳을 하나는 둔다
  function ensureCompanionStop(s) {
    const joins = ["hunter_cabin", "observatory", "abandoned_church", "buried_highway"];
    if (s.map[1][0].some((p) => joins.includes(p))) return;
    const j = s.map[1].findIndex((col, i) => i > 0 && col.some((p) => joins.includes(p)));
    const k = s.map[1][j].findIndex((p) => joins.includes(p));
    [s.map[1][0][0], s.map[1][j][k]] = [s.map[1][j][k], s.map[1][0][0]];
  }
  function premiseOf(s) {
    const P = C.premises[s.dir.premise];
    const o = P.byOrigin && P.byOrigin[s.origin];
    return o ? { ...P, ...o } : P;
  }
  // ── 조회 ──
  const comp = (s, id) => s.comps.find((c) => c.id === id);
  const live = (s) => s.comps.filter((c) => c.alive && !c.gone);
  const hasItem = (s, k) => s.bag.some((b) => b.k === k);
  const nameOf = (s, id) => (C.people[id] ? C.people[id].name : C.cast[id] ? C.cast[id].name : id);
  function addItem(s, k, notes) {
    if (!C.items[k]) return;
    s.bag.push({ k, u: C.items[k].uses || 0 });
    if (notes) notes.push(`가방에 ${C.items[k].name}을(를) 넣었다.`);
  }
  function takeItem(s, k) { const i = s.bag.findIndex((b) => b.k === k); if (i >= 0) s.bag.splice(i, 1); return i >= 0; }
  const jr = (s, text, w = 2) => s.journal.push({ day: s.day, text, w });
  // ── 글 채우기 ──
  function fill(s, t) {
    if (!t) return "";
    const c1 = live(s)[0];
    const tr = s.dir.roles.traitor ? nameOf(s, s.dir.roles.traitor) : "누군가";
    const P = premiseOf(s);
    const map = {
      "{food}": "식량", "{c1}": c1 ? c1.name : "아무도",
      "{c1_or_nobody}": c1 ? `${c1.name}이(가) 불 건너편에서 잠들어 있다. 이 사람을 끝까지 데려가겠다.` : "곁에 아무도 없다. 그렇다면, 다음에 만나는 누군가를.",
      "{traitor}": tr, "{kin}": s.dir.roles.kin ? nameOf(s, s.dir.roles.kin) : "",
      "{gu_line}": s.facts.owe_gu ? "외상 장부에 네 이름이 아직 있더군." : "다시 만났네. 오늘은 뭘 줄까?",
      "{checkpoint_line}": s.facts.baekgom_hunting ? "보초 하나가 수배 그림을 들고 얼굴을 대조하고 있다." : "",
      "{twist_b_face}": s.dir.twist === "B" ? "개털 모자, 금니. 구씨다. 구씨가 {traitor}을(를) 향해 손을 들었던 것이다." : "늑대단 털옷의 사내. 그는 {traitor}을(를) 향해 무언가를 묻는 몸짓을 했다.",
      "{parent_list_line}": s.dir.premise === "hidden_kin" && s.dir.twist === "A" ? "명단 맨 아래, 연필로 쓴 이름. ‘소이(9) — 백곰 소유, 거래 불가’." : "명단에 소이는 없다. 대신 맨 끝에 적힌 메모. ‘하얀나루역장이 진짜 명단을 갖고 있다.’",
      "{drift2_text}": s.facts.purpose_truth ? "기지 대원의 일기 조각이 바람에 날려 발밑에 걸린다. ‘명단 때문에 우린 셋으로 갈라졌다.’ 진실이 가까워진다." : s.facts.purpose_wealth ? "구씨의 썰매 자국 옆에 떨어진 장부 한 장. 사람 이름과 값이 적혀 있다. 이 설원에서 제일 비싼 건 사람이다." : `${c1 ? c1.name : "곁의 사람"}이(가) 열에 들떠 당신 소매를 잡는다. “나 두고 가지 마.” 지키겠다던 말이 시험받는다.`,
      "{payoff_line}": payoffLine(s),
    };
    let out = String(t);
    for (let k = 0; k < 2; k++) for (const [a, b] of Object.entries(map)) out = out.split(a).join(b);
    return out;
  }
  function payoffLine(s) {
    const d = s.dir, f = s.facts;
    if (d.premise === "betrayal") {
      const tr = nameOf(s, d.roles.traitor || "gu");
      if (d.twist === "A") return f.bt_trust_note ? `${tr}이(가) 약속대로 기다리고 있다. 검문소 통행료를 낸 영수증 같은 늑대 이빨을 내민다. “…믿어 줬구나.”` : `${tr}이(가) 사람들 사이에 서 있다. 당신이 쪽지를 찢은 걸 아는 얼굴이다. “통행료였어. 너를 위한.”`;
      return f.bt_turned ? `${tr}이(가) 당신 옆에 서 있다. 그리고 군중 속에서 구씨가 아이 손을 잡고 나타난다. ${tr}의 동생이다. 구씨가 웃는다. “거래하자고.”` : `${tr}이(가) 구씨 곁에 서 있다. 동생의 손을 잡고. 당신을 팔아 얻은 손이다. ${tr}이(가) 고개를 들지 못한다.`;
    }
    if (d.premise === "hidden_kin") {
      const kin = nameOf(s, d.roles.kin);
      if (f.kin_taken) return `${kin}이(가) 당신 손을 잡고 있다. 그리고 군중 너머, 흰 곰 털옷이 보인다. 백곰이 ${kin}을(를) 본다. 그 눈에 분노가 아니라 무언가 무너지는 것이 있다.`;
      if (f.kin_with_baekgom) return `백곰이 ${kin}을(를) 안고 서 있다. ${kin}이(가) 당신을 본다. ${f.gave_medicine ? "백곰이 낮게 말한다. “약값은 갚아야지. 이 애가 고르게 해.”" : `백곰이 ${kin}을(를) 더 꽉 끌어안는다.`}`;
      return s.origin === "parent" ? `무전을 틀던 사람이 거기 있다. 역장 노인의 손자다. 그가 테이프를 내민다. “소이는… 피난처 쪽으로 갔어요. 이걸 아빠한테 들려 달라고 했어요.”` : `늑대단 털옷을 입은 소년이 사람들 사이에서 휘파람을 분다. 도치다. 그 노래를 끝까지 부를 수 있는 건 둘뿐이다.`;
    }
    if (d.premise === "false_salvation") {
      if (d.twist === "A") return f.fs_freed ? `철창에서 풀려난 사람들이 당신 뒤에 서 있다. 그리고 구씨가 썰매 위에서 굳어 있다. 사람들의 눈이 구씨에게로 향한다.` : `구씨가 썰매에서 내려 장부를 편다. 사람값이 적힌 장부. 그는 아직 당신이 모른다고 생각한다.`;
      return `돌담 문 앞, 구씨가 문지기와 웃으며 이야기한다. 구씨는 자리를 사지 않는다. 사람을 판다. 문지기가 당신을 본다. “규칙은 알지?”`;
    }
    return "";
  }

  // ── 지도 ──
  function options(s) {
    if (s.phase !== "map") return [];
    const col = (s.map[s.act] || [])[s.step] || [];
    return col.map((id) => {
      const p = C.places[id];
      let lock = "";
      if (p.dest === "valley" && !s.facts.refuge_known && !hasItem(s, "refuge_note") && !(s.dir.premise === "false_salvation" && s.dir.twist === "B")) lock = "피난처가 어디 있는지 모른다";
      if (p.dest === "return" && s.food < 2) lock = "돌아갈 식량이 없다";
      return { id, name: p.name, gate: !!p.gate, dest: p.dest || null, lock, visited: !!s.seen[id] };
    });
  }
  function go(state, id) {
    if (state.phase !== "map") return { state, error: "지금은 길을 고를 수 없다." };
    if (state.bag.length > BAG) return { state, error: `가방이 넘친다. ${state.bag.length - BAG}개를 버려야 떠날 수 있다.` };
    const opt = options(state).find((o) => o.id === id);
    if (!opt) return { state, error: "갈 수 없는 곳이다." };
    if (opt.lock) return { state, error: opt.lock };
    const s = clone(state), p = C.places[id];
    s.day += 1;
    s.place = id;
    s.seen[id] = s.day;
    // 길에서 줍는 것
    const found = [];
    if (!p.dest && rnd(s) < 0.6) { if (rnd(s) < 0.6) { s.food += 1; found.push("얼어붙은 통조림 하나"); } else { s.fuel += 1; found.push("부서진 가구 조각(연료)"); } }
    s.found = found;
    const q = [];
    // 이 걸음에 배치된 박자
    const due = s.dir.pending.filter((b) => b.act < s.act || (b.act === s.act && b.step <= s.step));
    for (const b of due) {
      const ev = beatEvent(s, b.beat);
      if (ev === "wait") continue;
      s.dir.pending = s.dir.pending.filter((x) => x !== b);
      if (ev) q.push(ev);
    }
    // 배신 전제인데 아직 동행이 없으면, 길에서 누군가를 만난다
    if (s.dir.premise === "betrayal" && !live(s).length && s.act <= 2 && !s.facts.stray_refused2 && !p.gate) q.unshift({ kind: "stray" });
    if (p.ev && !C.events[p.ev].climax) q.push({ kind: "place", id: p.ev });
    if (p.dest) q.push({ kind: "climax", dest: p.dest });
    s.ev = { queue: q, cur: null, result: null };
    s.phase = "event";
    nextEvent(s);
    return { state: s };
  }
  // 박자를 사건으로. 동행이 필요한 배신 박자는 동행이 생길 때까지 기다린다
  function beatEvent(s, beat) {
    const P = premiseOf(s);
    if (beat.type === "origin") { const ob = C.originBeats[s.origin]?.[beat.n]; return ob ? { kind: "beat", beat: ob } : null; }
    if (s.dir.premise === "betrayal" && !s.dir.roles.traitor) {
      const c = live(s)[0];
      if (!c) return beat.key === "twist" ? null : "wait";
      s.dir.roles.traitor = c.id;
    }
    if (s.dir.premise === "betrayal" && s.dir.roles.traitor && !comp(s, s.dir.roles.traitor)?.alive) return null;
    if (beat.key === "plant") return P.plant[beat.i] ? { kind: "beat", beat: P.plant[beat.i] } : null;
    if (beat.key === "complicate") return { kind: "beat", beat: P.complicate };
    if (beat.key === "twist") { s.dir.twisted = true; jr(s, `반전: ${(P.twistText || C.premises[s.dir.premise].twistText)[s.dir.twist]}.`, 3); return { kind: "beat", beat: P.twist[s.dir.twist] }; }
    return null;
  }
  const STRAY = (s) => {
    const left = Object.keys(C.people).filter((k) => !comp(s, k));
    const id = left[Math.floor((s.day * 7) % left.length)];
    return { id: "stray", text: `눈 덮인 바위 그늘에 누군가 웅크리고 있다. ${C.people[id].role} ${C.people[id].name}. 입술이 파랗다. “…남쪽으로 가요? 같이 가면 안 될까요.”`, choices: [
      { label: "함께 가자", fx: { join: id }, t: `${C.people[id].name}이(가) 고개를 끄덕였다. 손이 얼음장 같았다.` },
      { label: "혼자 가겠다", fx: { fact: s.facts.stray_refused ? "stray_refused2" : "stray_refused" }, t: "등 뒤에서 아무 소리도 들리지 않았다." },
    ], art: "camp_talk" };
  };
  // ── 사건 진행 ──
  function nextEvent(s) {
    const e = s.ev;
    e.result = null;
    while (e.queue.length) {
      const it = e.queue.shift();
      if (it.kind === "place") { e.cur = { kind: "place", id: it.id, scene: "start" }; return; }
      if (it.kind === "beat") { e.cur = { kind: "beat", beat: it.beat, scene: "start" }; return; }
      if (it.kind === "stray") { e.cur = { kind: "beat", beat: STRAY(s), scene: "start" }; return; }
      if (it.kind === "climax") { e.cur = { kind: "climax", dest: it.dest, scene: "arrive" }; return; }
    }
    e.cur = null;
    toCamp(s);
  }
  function sceneOf(s) {
    const c = s.ev && s.ev.cur;
    if (!c) return null;
    if (c.kind === "place") return C.events[c.id].scenes[c.scene];
    if (c.kind === "beat") return c.beat;
    if (c.kind === "climax") return climaxScene(s, c);
    return null;
  }
  function artOf(s) {
    const c = s.ev && s.ev.cur, p = C.places[s.place];
    if (!c) return { key: p.art, fb: p.fb, dir: "places" };
    if (c.kind === "beat") return { key: BEAT_ART[c.beat.id] || c.beat.art || p.art, fb: p.fb, dir: BEAT_ART[c.beat.id] || c.beat.art ? "scenes" : "places" };
    if (c.kind === "climax") return { key: C.climax[c.dest].art, fb: C.climax[c.dest].fb, dir: "scenes" };
    return { key: p.art, fb: p.fb, dir: "places" };
  }
  // 조건 확인
  function reqState(s, r) {
    if (!r) return "";
    if (r.item && !hasItem(s, r.item)) return `${C.items[r.item].name}이(가) 없다`;
    if (r.companion && !live(s).some((c) => c.id === r.companion)) return `${C.people[r.companion].name}이(가) 함께 있지 않다`;
    if (r.food && s.food < r.food) return "식량이 모자라다";
    if (r.fuel && s.fuel < r.fuel) return "연료가 모자라다";
    if (r.fact && !s.facts[r.fact]) return "아직 그럴 이유가 없다";
    if (r.clues && (s.clues[CLUE_OF[s.dir.premise]] || 0) < r.clues) return "아직 알아챈 게 부족하다";
    if (r.anyComp && !live(s).length) return "곁에 아무도 없다";
    if (r.wolves !== undefined && s.wolves < r.wolves) return "늑대단이 당신을 믿지 않는다";
    return "";
  }
  // 판정: 나와 동행 중 가장 잘하는 사람
  function roller(s, stat) {
    const cands = [{ id: "me", name: "당신", v: s.me.stats[stat] - (s.me.hp >= 2 ? 1 : 0) - (s.me.cold >= 2 ? 1 : 0) - (s.me.hunger >= 2 ? 1 : 0) }];
    for (const c of live(s)) cands.push({ id: c.id, name: c.name, v: C.people[c.id].stats[stat] - (c.hp >= 2 ? 1 : 0) });
    return cands.sort((a, b) => b.v - a.v)[0];
  }
  const TOOL_BONUS = { force: ["knife", "crowbar"], wits: ["lamp"], craft: ["crowbar", "scrap"] };
  function chance(s, ch) {
    const [stat, dc] = ch.check, r = roller(s, stat);
    const tool = (TOOL_BONUS[stat] || []).some((k) => hasItem(s, k)) ? 1 : 0;
    const mod = r.v + tool + (live(s).length && r.id === "me" ? 1 : 0);
    return { r, mod, dc, p: clamp((21 - (dc - mod)) / 20, 0.05, 0.95) };
  }
  const feel = (p) => (p >= 0.75 ? "해볼 만하다" : p >= 0.55 ? "반반이다" : p >= 0.35 ? "위험하다" : "무모하다");
  function view(s) {
    const sc = sceneOf(s);
    if (!sc) return null;
    const c = s.ev.cur;
    return {
      kind: c.kind, title: c.kind === "climax" ? C.climax[c.dest].name : C.places[s.place].name,
      text: fill(s, sc.text), art: artOf(s), result: s.ev.result,
      choices: (sc.choices || []).map((ch, i) => {
        const lock = reqState(s, ch.req);
        const tag = ch.label.match(/^\[([^\]]+)\]/)?.[1] || "";
        const info = ch.check ? chance(s, ch) : null;
        return { i, label: fill(s, ch.label.replace(/^\[[^\]]+\]\s*/, "")), tag, lock, feel: info ? feel(info.p) : "", who: info ? info.r.name : "", stat: ch.check ? STATS[ch.check[0]] : "" };
      }),
    };
  }
  function choose(state, i) {
    if (state.phase !== "event" || !state.ev?.cur || state.ev.result) return { state, error: "고를 것이 없다." };
    const sc0 = sceneOf(state), ch0 = sc0.choices[i];
    if (!ch0) return { state, error: "없는 선택이다." };
    const lock = reqState(state, ch0.req);
    if (lock) return { state, error: lock };
    const s = clone(state), sc = sceneOf(s), ch = sc.choices[i], notes = [];
    let out = { t: ch.t, fx: ch.fx, go: ch.go }, roll = null;
    if (ch.check) {
      const info = chance(s, ch), r = d20(s), ok = r === 20 || (r !== 1 && r + info.mod >= info.dc);
      roll = { r, mod: info.mod, dc: info.dc, ok, who: info.r.name, stat: STATS[ch.check[0]] };
      const o = ok ? ch.win : ch.lose;
      out = { t: o?.t, fx: { ...(ch.fx || {}), ...(o?.fx || {}) }, go: o?.go ?? ch.go };
    }
    applyFx(s, out.fx || {}, notes);
    const cur = s.ev.cur;
    if (cur.kind === "beat") { const tw = cur.beat.onTwist; if (tw) twistAfter(s, tw); }
    const text = fill(s, out.t || "");
    s.chronicle.push({ day: s.day, title: view(state).title, paras: [fill(s, sc.text), `“${fill(s, ch.label.replace(/^\[[^\]]+\]\s*/, ""))}” — ${text}`].filter(Boolean) });
    s.ev.result = { text, notes, roll, go: out.go || null, ending: out.fx?.ending || null };
    if (s.me.hp >= 4) { s.ev.result.ending = "frozen"; }
    return { state: s };
  }
  // 반전 뒤처리: 배신자가 떠나거나 남는다
  function twistAfter(s, tw) {
    const id = s.dir.roles.traitor;
    if (!id) return;
    const c = comp(s, id);
    if (tw.leave === "traitor" || (tw.leaveUnless && !tw.leaveUnless.some((f) => s.facts[f]))) { if (c) c.gone = true; }
  }
  function cont(state) {
    if (state.phase !== "event" || !state.ev?.result) return { state, error: "계속할 수 없다." };
    const s = clone(state), r = s.ev.result;
    if (r.ending) return finish(s, r.ending);
    if (r.go) { s.ev.cur.scene = r.go; s.ev.result = null; return { state: s }; }
    nextEvent(s);
    return { state: s };
  }
  function applyFx(s, fx, notes) {
    if (fx.food) s.food = Math.max(0, s.food + fx.food);
    if (fx.fuel) s.fuel = Math.max(0, s.fuel + fx.fuel);
    if (fx.hp) { s.me.hp = clamp(s.me.hp + fx.hp, 0, 4); notes.push(`당신: ${HP[s.me.hp]}`); }
    if (fx.cold) s.me.cold = clamp(s.me.cold + fx.cold, 0, 3);
    if (fx.day) s.day += fx.day;
    if (fx.human) s.human = clamp(s.human + fx.human, 0, 100);
    if (fx.wolves) s.wolves = clamp(s.wolves + fx.wolves, -3, 3);
    for (const k of [].concat(fx.item || [])) addItem(s, k, notes);
    if (fx.take) takeItem(s, fx.take);
    for (const f of [fx.fact, fx.fact2].filter(Boolean)) s.facts[f] = s.day;
    if (fx.unfact) delete s.facts[fx.unfact];
    if (fx.clue) { s.clues[fx.clue] = (s.clues[fx.clue] || 0) + 1; if (fx.clue === CLUE_OF[s.dir.premise]) notes.push("무언가 이상하다. 기억해 둔다."); }
    if (fx.debt) { s.debts.push({ ...fx.debt, day: s.day }); if (fx.debt.owe) s.facts.owe_gu = s.day; jr(s, fx.debt.text, fx.debt.good ? 2 : 3); }
    if (fx.join && live(s).length < 2 && !comp(s, fx.join)) { s.comps.push({ id: fx.join, name: C.people[fx.join].name, hp: 0, hunger: 0, trust: 1, alive: true, talks: 0 }); notes.push(`${C.people[fx.join].name}이(가) 함께 걷는다.`); jr(s, `${C.people[fx.join].name}을(를) 길동무로 받아들였다.`, 1); }
    else if (fx.join && live(s).length >= 2) notes.push("이미 둘이 함께다. 더는 데려갈 수 없다.");
    if (fx.trustAll) for (const c of live(s)) c.trust += fx.trustAll;
    if (fx.payoff) s.dir.payoffDone = true;
    if (fx.abandon) { const c = live(s)[live(s).length - 1]; if (c) { c.gone = true; jr(s, `피난처 문밖에 ${c.name}을(를) 두고 들어갔다.`, 4); } }
  }

  // ── 절정 ──
  function debtLines(s, dest) {
    const out = [], has = (id, good) => s.debts.find((d) => d.id === id && !!d.good === good);
    if (dest === "station") {
      if (has("stationmaster", true)) out.push("승강장 끝에서 낡은 철도 모자를 쓴 청년이 당신을 알아보고 손을 든다. 역장 노인의 손자다.");
      if (has("stationmaster", false)) out.push("역장 노인의 손자가 당신을 노려본다. 할아버지는 그 겨울을 넘기지 못했다고.");
    }
    if (s.facts.owe_gu) out.push("구씨가 썰매 위에서 장부를 흔든다. “빚은 갚고 가야지.”");
    else if (has("gu", true)) out.push("구씨가 금니를 드러내며 웃는다. “신용 좋은 손님!”");
    if (s.facts.dochi_saved) out.push("도치가 사람들 사이를 비집고 달려와 당신의 소매를 잡는다.");
    else if (has("dochi", false)) out.push("늑대단 털옷을 입은 소년이 총을 들고 서 있다. 도치다. 그 눈은 그때처럼 아무 말도 하지 않는다.");
    if (has("guard", false)) out.push("당신이 쓰러뜨린 보초의 동생이 칼을 쥐고 사람들 속에서 당신을 찾는다.");
    if (has("child", true)) out.push("당신이 데려온 빨간 모자 아이가 손을 꼭 잡는다.");
    if (has("comrade", false) || has("twins", false)) out.push("늑대단 무리 속에서 낯익은 얼굴들이 당신을 가리킨다.");
    if (s.facts.comrade_joined) out.push("귀 한쪽 없는 옛 동료가 늑대단 무리 앞을 가로막고 선다. 당신 편이다.");
    return out;
  }
  const PAYOFF = { betrayal: (s) => !!s.dir.roles.traitor, hidden_kin: () => true, false_salvation: () => true };
  function climaxScene(s, c) {
    const cl = C.climax[c.dest];
    if (c.scene === "arrive") {
      const lines = debtLines(s, c.dest);
      const P = premiseOf(s);
      const payoff = PAYOFF[s.dir.premise](s) && s.dir.twisted && !s.dir.payoffDone;
      return { id: "climax", text: [cl.arrive, ...lines].join("\n\n"), choices: [{ label: "앞으로 나아간다", go: payoff ? "payoff" : "resolve" }] };
    }
    if (c.scene === "payoff") {
      const P = premiseOf(s);
      return { ...P.payoff, choices: P.payoff.choices.map((x) => ({ ...x, go: "resolve", fx: { ...(x.fx || {}), payoff: true } })) };
    }
    return resolveScene(s, c.dest);
  }
  function resolveScene(s, dest) {
    const f = s.facts, comps = live(s), kinHere = f.kin_taken || f.kin_reunited || f.took_child;
    if (dest === "station") {
      if (s.day > s.trainDay) return { id: "res", text: "승강장은 비어 있다. 선로 위의 눈에 바퀴 자국이 아직 선명하다. 지평선 끝에 불빛 하나가 사라진다.", choices: [{ label: "선로 위에 주저앉는다", fx: { ending: "missed" } }] };
      return { id: "res", text: "열차가 승강장으로 미끄러져 들어온다. 서지 않는다. 화물칸 문이 열려 있고, 늑대단이 명단을 들고 이름을 부른다. 지금이다.", choices: [
        { label: "[탑승 명단] 명단을 내밀고 오른다", req: { item: "passenger_list" }, fx: { ending: "train" } },
        { label: "[역장의 손자] 손자가 화물칸 문을 잡아 준다", req: { fact: "grandson_ok" }, fx: { ending: "train" } },
        { label: "[백곰의 빚] 백곰이 고개를 끄덕여 자리를 낸다", req: { fact: "gave_medicine" }, fx: { ending: "train" } },
        { label: "[도치] 도치가 늑대단 사이로 길을 연다", req: { fact: "dochi_saved" }, fx: { ending: "train" } },
        { label: "달리는 화물칸으로 뛰어오른다", check: ["force", s.debts.some((d) => d.id === "dochi" && !d.good) ? 15 : 13], win: { t: "손이 문틀을 잡았다. 누군가 당신을 끌어올렸다.", fx: { ending: "train" } }, lose: { t: "손이 미끄러졌다. 바퀴 소리가 멀어진다.", fx: { ending: "missed", hp: 1 } } },
        { label: "마지막 자리를 내준다", req: { anyComp: true }, fx: { ending: "seat", human: 10 } },
        { label: "늑대단 쪽으로 걸어간다", req: { wolves: 1 }, fx: { ending: "wolves" } },
      ] };
    }
    if (dest === "valley") {
      return { id: "res", text: "돌담 문지기가 줄 선 사람들을 하나씩 본다. “자리가 없다. 들어오려면 한 사람을 밖에 두고 와라. 그게 규칙이다.” 김이 문틈으로 새어 나온다. 따뜻하다.", choices: [
        { label: "동행 하나를 밖에 두고 들어간다", req: { anyComp: true }, fx: { ending: "refuge", human: -20, abandon: true } },
        { label: "[피난처 쪽지] 쪽지에 적힌 이름을 댄다", req: { item: "refuge_note" }, check: ["talk", 12], win: { t: "문지기가 쪽지를 오래 들여다봤다. 문이 열렸다. 모두.", fx: { ending: "refuge" } }, lose: { t: "“이 이름은 지난겨울에 죽었다.” 문이 닫혔다.", fx: { ending: "frozen" } } },
        { label: "모두 함께가 아니면 안 들어간다", check: ["talk", 14], win: { t: "문지기가 한숨을 쉬었다. “…들어와. 다들.”", fx: { ending: "refuge", human: 5 } }, lose: { t: "문이 닫혔다. 돌아갈 길은 멀다.", fx: { ending: s.food >= 3 ? "spring" : "frozen" } } },
        { label: "내 자리를 내준다", req: { anyComp: true }, fx: { ending: "seat", human: 10 } },
      ] };
    }
    return { id: "res", text: "기지의 문을 연다. 난로는 차갑다. 하지만 지붕이 있고, 벽이 있다. 봄까지 버틸 수 있을까.", choices: [
      { label: "함께 겨울을 난다", req: { anyComp: true }, check: ["craft", s.food >= 4 && s.fuel >= 2 ? 8 : 13], win: { t: "난로에 불이 붙었다. 누군가 웃었다.", fx: { ending: "spring" } }, lose: { t: "식량이 먼저 떨어졌다.", fx: { ending: "frozen" } } },
      { label: "혼자 겨울을 난다", check: ["wits", s.food >= 4 && s.fuel >= 2 ? 10 : 15], win: { t: "길고 조용한 겨울이었다.", fx: { ending: "spring" } }, lose: { t: "너무 길었다.", fx: { ending: "frozen" } } },
    ] };
  }
  function finish(s, key) {
    const ending = key;
    const inhuman = s.human <= 20 && !["frozen", "missed"].includes(key);
    s.ending = { key: ending, inhuman };
    const P = C.premises[s.dir.premise], tw = premiseOf(s).titles || P.titles;
    s.title = s.dir.twisted ? tw[s.dir.twist] : `${C.origins[s.origin].short}의 겨울`;
    jr(s, `${C.endings[ending].title}.`, 4);
    s.phase = "end";
    s.ev = null;
    return { state: s };
  }

  // ── 야영 ──
  function toCamp(s) {
    s.phase = "camp";
    const feed = { me: s.food > 0 };
    let f = s.food - (feed.me ? 1 : 0);
    for (const c of live(s)) { feed[c.id] = f > 0; if (f > 0) f--; }
    s.camp = { feed, fire: s.fuel > 0, talked: false, used: [] };
    // 역장 손자 지름길 표식 → 하얀나루에서 도움
    if (s.debts.some((d) => d.id === "stationmaster" && d.good)) s.facts.grandson_ok = s.facts.grandson_ok || s.day;
  }
  function campToggle(state, what, id) {
    if (state.phase !== "camp") return { state, error: "야영 중이 아니다." };
    const s = clone(state), c = s.camp;
    if (what === "feed") {
      const n = Object.values(c.feed).filter(Boolean).length;
      if (!c.feed[id] && n >= s.food) return { state, error: "식량이 모자라다." };
      c.feed[id] = !c.feed[id];
    } else if (what === "fire") {
      if (!c.fire && s.fuel <= 0) return { state, error: "연료가 없다." };
      c.fire = !c.fire;
    } else if (what === "talk") {
      const p = live(s).find((x) => x.id === id);
      if (!p || c.talked) return { state, error: "지금은 이야기할 수 없다." };
      c.talked = true; p.trust += 1;
      const line = C.people[p.id].talk[Math.min(p.talks, C.people[p.id].talk.length - 1)]; p.talks += 1;
      c.talk = { id: p.id, line };
    }
    return { state: s };
  }
  function useItem(state, k, target = "me") {
    if (!["camp", "map"].includes(state.phase)) return { state, error: "지금은 쓸 수 없다." };
    const def = C.items[k];
    if (!def || !def.use || !hasItem(state, k)) return { state, error: "쓸 수 없는 물건이다." };
    const s = clone(state), who = target === "me" ? s.me : comp(s, target);
    if (!who || who.hp === 0) return { state, error: "다친 사람이 없다." };
    takeItem(s, k);
    who.hp = Math.max(0, who.hp - def.use.heal);
    who.crit = 0;
    return { state: s };
  }
  function drop(state, k) {
    if (!["camp", "map"].includes(state.phase)) return { state, error: "지금은 버릴 수 없다." };
    if (C.items[k]?.key) return { state, error: "이건 버릴 수 없다." };
    const s = clone(state);
    if (!takeItem(s, k)) return { state, error: "없는 물건이다." };
    return { state: s };
  }
  function craft(state, id) {
    if (state.phase !== "camp") return { state, error: "야영 때만 만들 수 있다." };
    const r = C.recipes.find((x) => x.id === id);
    if (!r || !r.from.every((k) => hasItem(state, k))) return { state, error: "재료가 모자라다." };
    const s = clone(state);
    for (const k of r.from) takeItem(s, k);
    addItem(s, r.make);
    return { state: s };
  }
  // 밤을 보낸다: 먹기·불·상처·체온, 동행의 신뢰
  function sleep(state) {
    if (state.phase !== "camp") return { state, error: "야영 중이 아니다." };
    if (state.bag.length > BAG) return { state, error: `가방이 넘친다. ${state.bag.length - BAG}개를 버려야 한다.` };
    const s = clone(state), c = s.camp, lines = [];
    const eaters = Object.entries(c.feed).filter(([, v]) => v).map(([k]) => k);
    s.food -= eaters.length;
    if (c.fire) s.fuel -= 1;
    const perk = (k) => live(s).find((p) => C.people[p.id].perk === k && p.hp <= 1);
    const hunter = perk("hunt"), healer = perk("heal"), stoker = perk("fire"), finder = perk("shelter");
    if (hunter && rnd(s) < 0.6) { s.food += 1; lines.push(`${hunter.name}이(가) 어둠 속에서 산토끼 한 마리를 들고 왔다.`); }
    if (stoker && c.fire && rnd(s) < 0.5) { s.fuel += 1; lines.push(`${stoker.name}이(가) 고철 깡통으로 바람막이를 만들어 연료를 아꼈다.`); }
    const warm = hasItem(s, "furcoat") || !!finder;
    if (finder && !c.fire) lines.push(`${finder.name}이(가) 바람이 닿지 않는 바위 틈을 찾아냈다.`);
    const body = (p, name, fed) => {
      p.hunger = fed ? 0 : Math.min(3, p.hunger + 1);
      if (p.hunger >= 3 && rnd(s) < 0.6) p.hp = Math.min(4, p.hp + 1);
      if (p === s.me) {
        if (c.fire) p.cold = Math.max(0, p.cold - 2); else if (!warm) p.cold = Math.min(3, p.cold + 1);
        if (p.cold >= 3) p.hp = Math.min(4, p.hp + 1);
      } else if (!c.fire && rnd(s) < 0.3) p.hp = Math.min(4, p.hp + 1);
      if (p.hp >= 1 && p.hp <= 2 && fed && c.fire && rnd(s) < 0.35) p.hp -= 1;
      if (p.hp === 3) { p.crit = (p.crit || 0) + 1; if (p.crit >= 2 && rnd(s) < 0.7) p.hp = 4; }
    };
    body(s.me, "당신", !!c.feed.me);
    if (healer) { const pt = [s.me, ...live(s)].filter((x) => x !== healer && x.hp >= 1 && x.hp < 4).sort((a, b) => b.hp - a.hp)[0]; if (pt && rnd(s) < 0.6) { pt.hp -= 1; pt.crit = 0; lines.push(`${healer.name}이(가) 밤새 ${pt === s.me ? "당신" : pt.name}의 상처를 돌봤다.`); } }
    for (const p of live(s)) {
      body(p, p.name, !!c.feed[p.id]);
      if (!c.feed[p.id]) p.trust -= 1;
      if (!c.fire) p.trust -= 0.5;
      if (p.hp >= 4) { p.alive = false; lines.push(`${p.name}이(가) 아침을 보지 못했다.`); jr(s, `${p.name}이(가) 죽었다.`, 3); }
      else if (p.trust <= -2) { p.gone = true; lines.push(`아침에 보니 ${p.name}의 자리가 비어 있다. 떠났다.`); jr(s, `${p.name}이(가) 떠났다.`, 3); }
    }
    s.chronicle.push({ day: s.day, title: "야영", paras: [c.fire ? "작은 불 앞에서 밤을 보냈다." : "불 없이 밤을 보냈다. 이가 딱딱 부딪혔다.", ...lines] });
    s.camp = null;
    if (s.me.hp >= 4) return finish(s, "frozen");
    // 다음 걸음
    s.step += 1;
    if (s.step >= (s.map[s.act] || []).length) { s.act += 1; s.step = 0; }
    s.phase = "map";
    s.lastNight = lines;
    return { state: s };
  }
  function begin(state) {
    if (state.phase !== "intro") return { state, error: "이미 시작했다." };
    const s = clone(state); s.phase = "map"; return { state: s };
  }
  function validate(s) {
    if (!s || s.v !== 1 || !C.origins[s.origin] || !Array.isArray(s.bag) || !s.map || !s.dir) throw Error("저장이 손상되었다.");
    return clone(s);
  }
  const api = { newGame, begin, options, go, view, choose, cont, campToggle, useItem, drop, craft, sleep, validate, live, hasItem, BAG, HP, HUNGER, COLD, STATS, C, premiseOf, fill };
  root.JourneyEngine = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
