"use strict";
// 「넷이서 버티기」 화면. 저녁 한 화면에서 결정 → 밤 탐색 → 새벽 보고·사건.
(function () {
  const E = SurviveEngine, D = SurviveData, SC = SurviveScenarios, A = SurviveArt, app = document.querySelector("#app");
  const SAVE = "civitas-survive-v3";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
    set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch {} },
  };
  let state = null, sheet = null, rolling = null, toast = "", lastTap = 0, pickScenario = "random";
  try { const v = store.get(); if (v) state = E.validate(v); } catch { toast = "저장이 손상되어 새로 시작합니다."; }
  try { if (!state && localStorage.getItem("civitas-survive-v2")) { localStorage.removeItem("civitas-survive-v2"); toast = "밤 탐색이 크게 바뀌어 새로 시작합니다."; } } catch {}
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const btn = (label, action, attrs = "") => `<button type="button" data-action="${action}" ${attrs}>${label}</button>`;
  const HP = D.hpNames, HU = D.hungerNames;
  const sc = () => state.scenario, words = () => E.scen(state).words;
  const face = (p, size) => A.portrait(sc(), p, size);
  // 소설 문단: 한 문단씩 떠오르고, 화면을 누르면 다 보인다
  const prose = (list, cls = "") => `<div class="prose ${cls}">${list.filter(Boolean).map((t, i) => `<p style="--i:${i}">${esc(t)}</p>`).join("")}</div>`;
  function commit(res) {
    if (res.error) { toast = res.error; render(); return false; }
    state = res.state; toast = ""; store.set(state); render(); return true;
  }
  // ── 위쪽 ──
  function header() {
    const s = state, w = words(), S = E.scen(s), t = E.nextThreat(s);
    const tools = s.gear.map((g) => `<span class="tool" title="${esc(E.N.gear[g.k].desc)}">${esc(E.gearName(g))}</span>`).join("");
    return `<header><div class="top"><span><b>${S.name}</b>  ${s.day}일째</span><span>${btn(`기록${s.memorial.length ? ` · 잃은 이 ${s.memorial.length}` : ""}`, "sheet", 'data-sheet="memorial" class="mini"')} ${btn("새로", "sheet", 'data-sheet="new" class="mini"')}</span></div>
    <div class="res"><div class="r ${s.food < E.alive(s).length ? "low" : ""}"><small>${w.food}</small><b>${s.food}</b></div><div class="r ${s.wood < 2 ? "low" : ""}"><small>${w.wood}</small><b>${s.wood}</b></div><div class="r ${s.meds === 0 ? "low" : ""}"><small>${w.meds}</small><b>${s.meds}</b></div><div class="r"><small>부품</small><b>${s.parts || 0}</b></div><div class="r ${s.hope < 25 ? "low" : ""}"><small>희망</small><b>${s.hope}</b><i class="hbar"><i style="width:${s.hope}%"></i></i></div></div>
    <div class="chips">${E.storyGoal(s) ? `<span class="chip goal">${esc(E.storyGoal(s))}</span>` : `<span class="chip goal">🚩 ${w.goal} ${s.rescueDay - 1}~${s.rescueDay + 1}일</span>`}${t ? `<span class="chip threat ${t.day - s.day <= 1 ? "urgent" : ""}">⚠ ${w.threat} ${t.day - s.day <= 0 ? "오늘 밤" : t.day - s.day + "일 뒤"}${s.flags.braced ? " · 대비함" : ""}</span>` : ""}</div></header>`;
  }
  // ── 저녁: 한 화면에서 다 정한다 ──
  const RL = () => ({ explore: { icon: "🌙", name: "밤 탐색" }, scout: { icon: "👁", name: "정찰" }, ...E.ROLES });
  function roleBtn(p) {
    const r = E.roleOf(state, p.id), d = RL()[r];
    return btn(`${d.icon} ${d.name} ▾`, "sheet", `data-sheet="role:${p.id}" class="tg role r-${r}"`);
  }
  // 오늘 밤 맡길 일: 각 일이 지금 무엇을 바꾸는지 보여 준다
  function roleSheet(id) {
    const s = state, p = E.byId(s, id), w = words(), cur = E.roleOf(s, id);
    const patients = E.alive(s).filter((x) => x.hp >= 1 && x.id !== id);
    const guards = E.alive(s).filter((x) => x.id !== id && E.roleOf(s, x.id) === "guard");
    const st = (k) => `${D.stats[k].icon}${D.stats[k].name} ${p.stats[k]}`;
    const why = {
      explore: E.canGo(s, p) ? `${st("force")} · ${st("wits")}${p.hp === 1 ? " · 부상(−1)" : ""}${p.hunger ? ` · ${HU[p.hunger]}(−${p.hunger})` : ""}${p.stress >= 70 ? " · 지침(−1)" : ""} — 위험하지만 물자는 밖에만 있다.` : "지금은 밖에 나갈 수 없다.",
      scout: E.canGo(s, p) ? `${st("wits")} — 장소 두 곳의 지금 상태를 보고 온다. 오늘 밤 거처엔 없다.` : "지금은 밖에 나갈 수 없다.",
      guard: guards.length ? `이미 ${guards.map((x) => x.name).join("·")}이(가) 지킨다.` : `${st("force")} — 아무도 지키지 않으면 도둑이 들 수 있다. 습격도 이 사람이 막는다.`,
      nurse: patients.length ? `${patients.map((x) => `${x.name}(${HP[x.hp]})`).join(", ")}을(를) 돌본다.${E.meta(s, id).care ? " 간호 경험이 있어 둘까지 확실히." : ""}` : "돌볼 환자가 없다.",
      forage: `${st("wits")} — 성공하면 ${w.food} 1~2.${s.scenario === "iceage" ? " 밖이라 동상을 입을 수 있다." : ""}`,
      fix: s.plan?.craft ? `${st("craft")} — 오늘 밤 '${E.recipesFor(s).find((r) => r.id === s.plan.craft)?.name}'을(를) 만든다.` : `${st("craft")} — 성공하면 오늘 밤 ${w.wood}을(를) 쓰지 않는다. 아래 '만들기'에서 고르면 대신 물건을 만든다.`,
      rest: `스트레스 ${p.stress} → 크게 줄어든다.${p.hp === 1 ? " 상처가 아물 수 있다." : ""}`,
    };
    const opts = Object.entries(RL()).map(([k, d]) => {
      const dis = (k === "explore" || k === "scout") && !E.canGo(s, p);
      return btn(`<span>${d.icon} ${d.name}${cur === k ? " ✔" : ""}</span><small>${esc(why[k])}</small>`, "role", `data-id="${id}" data-r="${k}" class="ropt ${cur === k ? "on" : ""}" ${dis ? "disabled" : ""}`);
    }).join("");
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><div class="pfhead">${face(p, 56)}<div><h2>${esc(p.name)}에게 오늘 밤 맡길 일</h2><p class="muted">${HP[p.hp]} · 스트레스 ${p.stress}</p></div></div><div class="ropts">${opts}</div>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function personRow(p) {
    const s = state, plan = s.plan, home = E.home(s, p);
    const status = !home ? "밖에 나가 있음" : p.broken ? "무너져 아무것도 못 함" : "";
    const fed = plan && plan.feed[p.id], med = plan && plan.med[p.id], sent = plan && plan.send.includes(p.id), finale = E.isFinaleNight(s);
    const toggles = !plan || !home ? "" : `<div class="toggles">${btn(fed ? `🍚 먹인다` : `🍚 굶긴다`, "feed", `data-id="${p.id}" class="tg ${fed ? "on" : "off"}"`)}${p.hp >= 1 ? btn(med ? "💊 약 쓴다" : "💊 약 안 씀", "med", `data-id="${p.id}" class="tg ${med ? "on" : ""}"`) : ""}${!p.child && !finale ? roleBtn(p) : ""}</div>${sent && s.gear.length ? `<div class="carry"><small>들려 보낼 것</small>${s.gear.map((g) => { const who = plan.carry[g.uid]; return btn(esc(E.gearName(g)), "carry", `data-uid="${g.uid}" data-id="${p.id}" class="gchip ${who === p.id ? "on" : who ? "other" : ""}" title="${esc(E.N.gear[g.k].desc)}"`); }).join("")}</div>` : ""}`;
    return `<div class="prow hp${p.hp}"><button class="pface" data-action="person" data-id="${p.id}">${face(p, 48)}</button><div class="pmain"><div class="pname"><b>${esc(p.name)}</b>${p.leader ? " 👑" : ""} <small>${esc(p.role)}</small></div><div class="pstate"><span class="st h${p.hp}">${HP[p.hp]}</span>${p.hunger ? `<span class="st hu${p.hunger}">${HU[p.hunger]}</span>` : ""}${p.traits.map((t) => `<span class="st tr">${esc(t)}</span>`).join("")}${status ? `<span class="st">${status}</span>` : ""}</div><span class="stress" title="스트레스 ${p.stress}"><i style="width:${p.stress}%"></i></span>${toggles}</div></div>`;
  }
  function eveningView() {
    const s = state, w = words(), plan = s.plan, f = E.forecast(s);
    const people = E.alive(s).map(personRow).join("");
    let night = "";
    const finale = E.isFinaleNight(s);
    if (plan && finale) night = `<div class="finale-banner">🚂 오늘 밤, 선로로 떠난다. 걸을 수 있는 사람은 모두 간다.<br><small>마지막으로 먹이고, 약을 쓰고, 출발한다.</small></div>`;
    else if (plan) {
      const rec = E.recommend(s);
      const places = Object.entries(E.scen(s).places).map(([k, pl]) => {
        const info = E.placeInfo(s, k);
        const memo = info.known ? `<span class="memo">📝 ${esc(info.known)}</span>${info.scouted ? `<br><span class="scouted">👁 정찰함: 길을 안다 (첫 판정 +2, 조용히 시작)</span>` : ""}` : "";
        const rumor = info.rumor ? `<span class="rumor">🗣 ${esc(info.rumor)}</span>` : "";
        const hz = info.hazard ? `<span class="hz ${info.guarded ? "ok" : ""}">${info.hazard.icon} ${info.hazard.name}${info.guarded ? " (막을 장비 있음)" : " — 막을 장비 없음"}</span>` : "";
        return btn(`${A.scene(sc(), k, "thumb")}<b>${pl.name}</b><small>${pl.loot} · 위험 ${["", "낮음", "보통", "높음"][pl.danger]}${info.gearHere.length ? `<br><span class="gearhere">뒤지면 나올 만한 것: ${esc(info.gearHere.join(" · "))}</span>` : ""}${hz ? "<br>" + hz : ""}<br>${memo || rumor || '<span class="unknown">??? 가 본 적 없다</span>'}${memo && rumor ? "<br>" + rumor : ""}</small>`, "place", `data-k="${k}" class="place ${plan.place === k ? "on" : ""}"`);
      }).join("");
      night = plan.send.length
        ? `<h3>어디로 보낼까</h3><div class="places">${places}</div>`
        : rec.party.length ? `<div class="rec">추천: <b>${E.scen(s).places[rec.loc].name}</b> · ${rec.party.map((id) => esc(E.byId(s, id).name)).join("·")} <small>(${esc(rec.why)})</small> ${btn("추천대로", "rec", 'class="mini"')}</div>` : "";
    }
    const roleSum = !plan || finale ? "" : ["guard", "nurse", "forage", "fix"].map((r) => { const who = E.alive(s).filter((p) => E.roleOf(s, p.id) === r && !p.child); return who.length ? `${E.ROLES[r].icon}${who.map((p) => esc(p.name)).join("·")}` : r === "guard" ? `<b class="warn">🛡 아무도 안 지킴</b>` : ""; }).filter(Boolean).join(" ");
    const go = !plan || finale ? "" : (plan.scout ? `👁 ${esc(E.byId(s, plan.scout).name)} 정찰 · ` : "") + (plan.send.length ? (plan.place ? `${plan.send.map((id) => esc(E.byId(s, id).name)).join("·")} → ${E.scen(s).places[plan.place].name}` : "보낼 곳을 고르세요") : "아무도 나가지 않는다");
    const bag = s.gear.length ? s.gear.map((g) => { const d = E.N.gear[g.k], who = plan?.carry?.[g.uid] && plan.send.includes(plan.carry[g.uid]) ? E.byId(s, plan.carry[g.uid]).name : ""; return `<li><b>${esc(d.name)}</b>${d.uses ? ` <small>${g.u}회 남음</small>` : ""}${who ? ` <small class="who">— ${esc(who)}이(가) 든다</small>` : ""}<br><small>${esc(d.desc)}</small></li>`; }).join("") : `<li class="muted">가진 장비가 없다. 밤에 나가 주변을 뒤지거나, 부품으로 만들 수 있다.</li>`;
    const recs = plan && !finale ? E.recipesFor(s).map((r) => { const ok = E.recipeOk(s, r.id), on = plan.craft === r.id; return btn(`<span>${esc(r.name)}${on ? " ✔" : ""}</span><small>부품 ${r.parts}${r.wood ? ` · ${w.wood} ${r.wood}` : ""} — ${esc(r.desc)}</small>`, "craft", `data-r="${r.id}" class="ropt ${on ? "on" : ""}" ${ok || on ? "" : "disabled"}`); }).join("") : "";
    const crafter = E.alive(s).find((p) => E.roleOf(s, p.id) === "fix");
    const gearSec = `<h3>가진 것</h3><ul class="bag">${bag}</ul>${recs ? `<h3>만들기 <small>부품 ${s.parts || 0}개${plan.craft ? ` · ${crafter ? esc(crafter.name) + "이(가) 밤새 만든다" : "수리·만들기를 맡을 사람이 없다"}` : ""}</small></h3><div class="ropts">${recs}</div>` : ""}`;
    return `<main><p class="hint">${finale ? "마지막 저녁." : "저녁. 누구를 먹일지, 누구에게 약을 쓸지, 그리고 각자 오늘 밤 무엇을 맡을지 정하세요."}</p><div class="plist">${people}</div>${night}${gearSec}</main>
    <section class="bar"><div class="fc">오늘 밤: ${w.food} −${f ? f.fed : 0}${f && f.hungry ? ` (${f.hungry}명 굶음)` : ""} · ${w.wood} −1 · ${roleSum}${go ? " · " + go : ""}</div>${btn(finale ? "선로로 떠난다" : "밤이 된다", "night", 'class="primary"')}</section>`;
  }
  function personSheet(id) {
    const p = E.byId(state, id);
    if (!p) return "";
    const stats = Object.entries(D.stats).map(([k, m]) => `<span>${m.icon} ${m.name} <b>${p.stats[k]}</b></span>`).join("");
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><div class="pfhead">${face(p, 96)}<div><h2>${esc(p.name)} <small>${esc(p.role)}</small></h2><p class="bio">${esc(p.bio)}</p></div></div><div class="pstats">${stats}</div><p class="muted">${HP[p.hp]} · ${HU[p.hunger]} · 스트레스 ${p.stress}/100${p.traits.length ? " · " + p.traits.join(", ") : ""}</p>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  // ── 밤 탐색 ──
  function expModal() {
    const s = state, e = s.exp, w = words();
    const pl = E.sceneView(s)?.place || { name: "" };
    const party = e.party.map((id) => E.byId(s, id));
    const gear = s.gear.filter((g) => g.with);
    const loot = `${w.food} ${e.loot.food} · ${w.wood} ${e.loot.wood} · ${w.meds} ${e.loot.meds}`;
    const v = E.sceneView(s);
    const nz = Math.min(100, Math.round((e.noise / 8) * 100));
    const ns = E.noiseStage(s);
    const noise = e.finale ? "" : `<div class="noise ${ns.stage >= 2 ? "hot" : ""}"><small>기척 · ${ns.name}</small><i><i style="width:${nz}%"></i></i></div>`;
    const head = `<div class="nightart">${A.scene(sc(), [e.scene, e.finale ? (e.queue.length ? "night" : "ending_good") : e.isChase ? "threat_hit" : e.loc])}</div><div class="eyebrow">🌙 ${pl.name} · ${e.step + 1}번째 장면${v ? ` · <b class="kind k-${v.kind}">${v.kindName}</b>` : ""}${E.harsh(s) ? ` · 세상이 험해졌다` : ""}</div>${noise}<div class="party">${party.map((p) => `<span class="${p.alive ? "" : "dead"}">${face(p, 26)} ${esc(p.name)} <small>${HP[p.hp]}</small></span>`).join("")}<span class="loot">챙긴 것 ${loot}${gear.length ? ` · ${gear.map((g) => esc(E.gearName(g))).join(" ")}` : ""}</span></div>${e.scan ? `<p class="note">${esc(e.scan)}</p>` : ""}`;
    if (e.result) {
      const r = e.result, alive = party.filter((p) => p.alive), anyAlive = alive.length > 0;
      const refuser = e.refuse ? E.byId(s, e.refuse) : null;
      const canDeeper = anyAlive && e.step < E.MAX_STEP && !e.isChase;
      const RISK = (p) => (p <= 0 ? "" : p < 0.3 ? "들킬 수도 있다" : p < 0.7 ? "들킬 가능성이 높다" : "거의 확실히 들킨다");
      const riskNow = !e.isChase && !e.chased ? RISK(ns.risk) : "";
      const dice = r.auto ? "" : `<div class="roll-line"><span class="d20 ${r.crit ? "crit" : r.fumble ? "fumble" : ""}">${r.roll}</span><span class="calc">${r.parts.map(([n, v]) => ` ${v >= 0 ? "+" : "−"} ${esc(n)} ${Math.abs(v)}`).join("")} = <b>${r.total}</b> <small>vs ${r.dc}</small></span></div><div class="verdict">${r.crit ? "대성공" : r.fumble ? "대실패" : r.success ? "성공" : "실패"}</div>`;
      const deeper = canDeeper ? (refuser && refuser.alive ? btn(`더 들어간다 <small>${esc(refuser.name)}: “난 더 못 가…” — 강행하면 원망을 산다</small>`, "deeper", 'class="secondary warn"') : btn(`더 들어간다 <small>더 많이, 더 위험하게${riskNow ? ` · 지금 움직이면 ${riskNow}` : ""}</small>`, "deeper", 'class="secondary"')) : "";
      const rum = anyAlive && !r.rummaged && !e.isChase && !e.finale ? btn(`주변을 더 뒤진다 <small>부품이나 장비가 나올 수 있다${(E.N.placeGear[s.scenario]?.[e.loc] || []).length ? ` (여기선 ${(E.N.placeGear[s.scenario][e.loc]).map((k) => E.N.gear[k].name).join("·")})` : ""} · 소리가 난다${RISK(ns.riskAfter) ? ` — 뒤지고 나면 ${RISK(ns.riskAfter)}` : ""}</small>`, "rummage", 'class="secondary"') : "";
      const homeLabel = !anyAlive ? "…" : riskNow ? `돌아간다 <small>지금 움직이면 ${riskNow}</small>` : "돌아간다";
      const hushBtn = anyAlive && !r.hushed && !e.isChase && !e.finale && e.noise >= 4 ? btn(`숨죽이고 기다린다 <small>기척이 가라앉는다 · 춥고 무섭다</small>`, "hush", 'class="secondary"') : "";
      return `<div class="veil night"><section class="modal result ${r.success ? "win" : "lose"} ${r.crit ? "crit" : ""} ${r.success ? "" : "flash"}" role="dialog" aria-modal="true">${head}<p class="picked">“${esc(r.approach)}” — ${esc(r.roller)}</p>${dice}${prose([r.text])}${r.find ? `<div class="find">${A.gearArt(r.find.k)}<small>찾았다</small><b>${esc(E.N.gear[r.find.k].name)}</b><p>${esc(r.find.text)}</p><small>${esc(E.N.gear[r.find.k].desc)}</small></div>` : ""}${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${rum}${hushBtn}${e.finale ? btn(e.queue.length && anyAlive ? "계속 간다" : "…", "home", 'class="primary"') : deeper + btn(homeLabel, "home", 'class="primary"')}</section></div>`;
    }
    const FEEL = { "확실하다": "sure", "해볼 만하다": "good", "반반이다": "mid", "위험하다": "bad", "무모하다": "awful" };
    const choices = v.approaches.map((a) => btn(`${a.tag ? `<em class="req ${a.locked ? "no" : "ok"}">[${esc(a.tag)}]</em> ` : ""}<span>${esc(a.label)}</span>${a.locked ? `<small class="why">${esc(a.locked)}</small>` : `<small><b class="feel f-${FEEL[a.feel]}">${a.feel}</b>${a.auto ? "" : ` · ${D.stats[a.stat].icon} ${esc(a.rollerName)}`}${a.tool ? ` · <span class="${a.hasTool ? "has" : "no"}">${E.N.gear[a.tool]?.icon || ""} ${a.hasTool ? "도구 있음" : "도구가 있으면 나을 텐데"}</span>` : ""}${a.hint ? `<br><i class="whisper">${esc(v.hinter)}: ${esc(a.hint)}</i>` : ""}</small>`}`, "approach", `data-i="${a.i}" ${a.locked ? "disabled" : ""} class="${a.locked ? "locked" : a.tag ? "special" : ""}"`)).join("");
    return `<div class="veil night"><section class="modal scene ${v.chase ? "chase" : ""}" role="dialog" aria-modal="true">${head}${v.hazard ? `<p class="note hz">${v.hazard.icon} ${esc(v.hazard.text)}</p>` : ""}${prose([v.text], "big")}${v.say ? `<p class="say">${face(E.byId(s, v.say.id), 28)} <b>${esc(v.say.name)}</b> ${esc(v.say.text)}</p>` : ""}<div class="choices">${choices}</div></section></div>`;
  }
  function rollModal() {
    return `<div class="veil night"><section class="modal roll" role="dialog" aria-modal="true"><p class="picked">“${esc(rolling.label)}”</p><p class="roll-head">${D.stats[rolling.stat].icon} ${esc(rolling.who)}</p><div class="dice">d20</div><p class="muted heartbeat">숨을 참는다…</p></section></div>`;
  }
  // ── 새벽 ──
  function reportModal() {
    const r = state.report;
    const key = state.day === 1 && !state.memorial.length && r.lines.length && !/아침/.test(r.title) ? "title" : r.lines.some((l) => /⛈/.test(l) && /버텼|지나갔|멈췄/.test(l)) ? "threat_held" : r.lines.some((l) => /⛈|습격/.test(l)) ? "threat_hit" : "dawn";
    const lines = r.lines.map((l) => `<p class="line ${/🕯|죽었다/.test(l) ? "death" : /⛈|🥶|습격|🤒|도둑|굶/.test(l) ? "bad" : ""}">${esc(l)}</p>`).join("");
    const body = r.prose && r.prose.length ? `${prose(r.prose)}<details class="changes"><summary>변화 보기</summary>${lines}</details>` : lines;
    return `<div class="veil"><section class="modal report" role="dialog" aria-modal="true">${A.scene(sc(), [state.ending ? "last_morning" : r.tag, key])}<h2 class="chapter">${esc(r.chapter || r.title)}</h2>${body}${btn(state.ending ? "결말" : "계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function eventModal() {
    const v = E.eventView(state);
    const cast = v.cast ? E.byId(state, v.cast) : v.need ? E.byId(state, v.need) : null, cast2 = v.cast2 ? E.byId(state, v.cast2) : null;
    return `<div class="veil"><section class="modal event" role="dialog" aria-modal="true"><div class="scene-art">${A.scene(sc(), "ev:" + v.art)}${cast ? `<div class="cast">${face(cast, 76)}${cast2 ? face(cast2, 76) : ""}</div>` : ""}</div>${prose([v.text], "big")}<div class="choices">${v.choices.map((c) => btn(`${c.tag ? `<em class="req ${c.reason ? "no" : "ok"}">[${esc(c.tag)}]</em> ` : ""}<span>${esc(c.label)}</span>${c.reason ? `<small class="why">${esc(c.reason)}</small>` : ""}`, "event", `data-i="${c.i}" ${c.reason ? "disabled" : ""}`)).join("")}</div></section></div>`;
  }
  function eventResultModal() {
    const r = state.eventResult;
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true">${prose([r.text])}${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${btn("계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function cardModal() {
    const c = state.card;
    return `<div class="veil night"><section class="modal actcard" role="dialog" aria-modal="true">${A.scene(sc(), [`act${state.story.act}`, state.story.act === 3 ? "night" : "threat_hit"])}<h2>${esc(c.title)}</h2>${c.lines.map((l) => `<p class="story">${esc(l)}</p>`).join("")}<p class="goal">🎯 ${esc(c.goal)}</p>${btn("계속", "dismiss", 'class="primary"')}</section></div>`;
  }
  function deathModal() {
    const d = state.deaths[0], p = E.byId(state, d.id);
    return `<div class="veil"><section class="modal death" role="dialog" aria-modal="true"><div class="dface">${p ? face(p, 120) : ""}</div><h2>🕯 ${esc(d.name)}</h2><p class="muted">${state.day}일 · ${esc(d.cause)}</p><blockquote class="last">“${esc(d.last)}”</blockquote>${d.reactions.map((r) => { const q = E.byId(state, r.id); return `<p class="react">${q ? face(q, 30) : ""} ${esc(r.text)}</p>`; }).join("")}${d.lost ? `<p class="note">${esc(d.lost)}</p>` : ""}${btn("벽에 이름을 새긴다", "dismiss", 'class="primary"')}</section></div>`;
  }
  function wallList() {
    return state.memorial.map((m) => { const p = E.byId(state, m.id); return `<li>${p ? face(p, 32) : ""} <b>${esc(m.name)}</b> <small>${m.day}일 · ${esc(m.cause)}</small></li>`; }).join("");
  }
  function endingModal() {
    const s = state, base = D.endings[s.ending], text = (s.ending === "missed" && E.N && SurviveStory[s.scenario]?.endings.missed) || E.scen(s).endings[s.ending] || base.text;
    const moments = s.story ? s.story.journal.slice().sort((a, b) => b.w - a.w || a.day - b.day).slice(0, 5).sort((a, b) => a.day - b.day) : [];
    const good = ["all", "most"].includes(s.ending);
    return `<div class="veil"><section class="modal ending" role="dialog" aria-modal="true">${A.scene(sc(), [`ending_${s.ending}`, good ? "ending_good" : "ending_bad"])}<h2>${base.icon} ${base.title}</h2><p class="story">${esc(text)}</p><p class="muted">${s.day - 1}일을 버텼다 · ${E.alive(s).length}/${s.total}명 생존</p><div class="living">${E.alive(s).map((p) => `<span>${face(p, 34)} ${esc(p.name)}</span>`).join("")}</div>${moments.length ? `<h3>📖 그 겨울의 결정들</h3><ul class="wall moments">${moments.map((m) => `<li><small>${m.day}일</small> ${esc(m.text)}</li>`).join("")}</ul>` : ""}${s.memorial.length ? `<h3>🕯 벽에 새긴 이름</h3><ul class="wall">${wallList()}</ul>` : ""}${state.chronicle?.length ? btn("📖 이번 판의 기록을 처음부터 읽기", "sheet", 'data-sheet="chron" class="secondary"') : ""}${btn("다른 재난으로 다시", "restart", 'class="primary"')}</section></div>`;
  }
  function chronicleSheet() {
    const c = state.chronicle || [];
    return `<div class="veil bottom"><section class="sheet chron" role="dialog" aria-modal="true"><h2>📖 ${esc(E.scen(state).name)}의 기록</h2>${c.length ? c.map((x) => `<article><h3><small>${x.day}일</small> ${esc(x.title)}</h3>${x.paras.map((t) => `<p>${esc(t)}</p>`).join("")}</article>`).join("") : "<p class='muted'>아직 남은 기록이 없다.</p>"}${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function memorialSheet() {
    return `<div class="veil bottom"><section class="sheet" role="dialog" aria-modal="true"><h2>🕯 벽에 새긴 이름</h2>${state.chronicle?.length ? btn("📖 지금까지의 기록 읽기", "sheet", 'data-sheet="chron" class="mini"') : ""}<ul class="wall">${wallList() || "<li class='muted'>아직 아무도 잃지 않았다.</li>"}</ul>${state.story?.journal.length ? `<h3>📖 일기</h3><ul class="wall moments">${state.story.journal.map((m) => `<li><small>${m.day}일</small> ${esc(m.text)}</li>`).join("")}</ul>` : ""}<h3>기록</h3><ul class="wall">${state.log.slice().reverse().map((l) => `<li><small>${l.day}일</small> ${esc(l.text)}</li>`).join("")}</ul>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function confirmNew() {
    return `<div class="veil"><section class="modal" role="dialog" aria-modal="true"><h2>처음부터 다시 할까요?</h2><p class="story">지금 이야기는 사라집니다.</p>${btn("새로 시작", "restart", 'class="primary"')}${btn("취소", "close", 'class="secondary"')}</section></div>`;
  }
  function titleScreen() {
    const cards = SC.order.map((k) => { const x = SC.scenarios[k]; return btn(`${A.scene(k, "title", "thumb")}<b>${x.icon} ${x.name}</b><small>${x.tagline}<br>난이도 ${x.level}</small>`, "pick", `data-k="${k}" class="scard ${pickScenario === k ? "on" : ""}"`); }).join("") + btn(`<div class="art thumb rand">?</div><b>🎲 무작위</b><small>어떤 재난일지 모른다</small>`, "pick", `data-k="random" class="scard ${pickScenario === "random" ? "on" : ""}"`);
    return `<div class="title"><div class="logo">넷이서 버티기</div><p class="sub">CIVITAS · 생존</p><form id="new"><label>당신의 이름<input name="name" maxlength="10" required placeholder="이름" autocomplete="off"></label><h3>어떤 재난인가</h3><div class="scards">${cards}</div><ul class="how"><li>👥 당신과 세 사람. 한 명 한 명이 소중하다.</li><li>🌆 <b>저녁</b>: 누구를 먹일지, 누구에게 약을 쓸지, 누구를 밤에 내보낼지 정한다. 남은 사람은 거처를 지킨다.</li><li>🌙 <b>밤</b>: 어디에 뭐가 남았는지는 모른다. 기억과 소문, 정찰뿐. 장면마다 <b>d20 판정</b>, 소리를 내면 무언가 온다.</li><li>🎒 <b>장비</b>: 누구에게 무엇을 들려 보낼지 정한다. 그 사람이 쓰러지면 장비도 잃는다.</li><li>🌅 <b>새벽</b>: 굶주림·병·상처·재난이 덮친다. 위독한 사람은 약이나 간호 없이는 하루를 못 넘긴다.</li></ul><button class="primary" type="submit">시작</button></form><a class="back" href="../proto/">이전 맛보기(/proto)</a></div>`;
  }
  // 바뀐 부분만 다시 그린다: 화면 전체를 매번 갈아엎으면 그림이 깜빡이고 다시 불러온다
  let paintedMain = null, paintedTop = null;
  // 소설책: 화면에서 그림 문자(이모지)를 걷어 낸다
  const EMOJI = /(?:\p{Extended_Pictographic}|[\u2600-\u27BF])(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s?/gu;
  function paint(main, top) {
    main = main.replace(EMOJI, ""); top = top.replace(EMOJI, "");
    let m = app.querySelector(":scope > .layer-main"), t = app.querySelector(":scope > .layer-top");
    if (!m || !t) { app.innerHTML = '<div class="layer-main"></div><div class="layer-top"></div>'; m = app.firstChild; t = app.lastChild; paintedMain = paintedTop = null; }
    if (main !== paintedMain) { m.innerHTML = main; paintedMain = main; }
    if (top !== paintedTop) { t.innerHTML = top; paintedTop = top; }
  }
  function render() {
    if (!state || state.restart) { paint(titleScreen(), toastHtml()); return; }
    const s = state;
    let modal = "";
    if (rolling) modal = rollModal();
    else if (s.phase === "exp") modal = expModal();
    else if (s.report) modal = reportModal();
    else if (s.card) modal = cardModal();
    else if (s.eventResult) modal = eventResultModal();
    else if (s.deaths && s.deaths.length) modal = deathModal();
    else if (s.event) modal = eventModal();
    else if (s.ending && sheet === "chron") modal = chronicleSheet();
    else if (s.ending) modal = endingModal();
    else if (sheet === "memorial") modal = memorialSheet();
    else if (sheet === "chron") modal = chronicleSheet();
    else if (sheet === "new") modal = confirmNew();
    else if (sheet && sheet.startsWith("role:")) modal = roleSheet(sheet.slice(5));
    else if (sheet) modal = personSheet(sheet);
    paint(`<div class="shell sc-${s.scenario}">${header()}${eveningView()}</div>`, modal + toastHtml());
    document.body.classList.toggle("modal-open", !!modal);
  }
  function toastHtml() { return toast ? `<div class="toast">${esc(toast)} ${btn("×", "toast")}</div>` : ""; }
  app.addEventListener("submit", (e) => {
    if (e.target.id !== "new") return;
    e.preventDefault();
    state = E.newGame({ name: String(new FormData(e.target).get("name")).trim(), scenario: pickScenario, seed: crypto.getRandomValues(new Uint32Array(1))[0] });
    sheet = null; store.set(state); render();
  });
  function act(a) {
    if (rolling) return;
    const k = a.dataset.action;
    if (k === "pick") { pickScenario = a.dataset.k; const name = app.querySelector("[name=name]")?.value || ""; render(); const inp = app.querySelector("[name=name]"); if (inp) inp.value = name; }
    else if (k === "person") { sheet = a.dataset.id; render(); }
    else if (k === "feed") commit(E.toggleFeed(state, a.dataset.id));
    else if (k === "med") commit(E.toggleMed(state, a.dataset.id));
    else if (k === "send") commit(E.toggleSend(state, a.dataset.id));
    else if (k === "scout") commit(E.toggleScout(state, a.dataset.id));
    else if (k === "role") { if (commit(E.setRole(state, a.dataset.id, a.dataset.r))) { sheet = null; render(); } }
    else if (k === "rummage") commit(E.rummage(state));
    else if (k === "hush") commit(E.hush(state));
    else if (k === "craft") commit(E.setCraft(state, a.dataset.r));
    else if (k === "carry") commit(E.toggleCarry(state, a.dataset.uid, a.dataset.id));
    else if (k === "place") commit(E.setPlace(state, a.dataset.k));
    else if (k === "rec") {
      const r = E.recommend(state);
      let s = state;
      for (const id of r.party) { const x = E.toggleSend(s, id); if (!x.error) s = x.state; }
      const y = E.setPlace(s, r.loc);
      commit(y.error ? { state: s } : y);
    } else if (k === "night") commit(E.nightfall(state));
    else if (k === "approach") {
      const i = Number(a.dataset.i), v = E.sceneView(state).approaches[i];
      if (v.auto) { commit(E.choose(state, i)); return; }
      rolling = { label: v.label, stat: v.stat, who: v.rollerName };
      render();
      setTimeout(() => { rolling = null; commit(E.choose(state, i)); }, 1800);
    } else if (k === "deeper") commit(E.proceed(state, true));
    else if (k === "home") commit(E.proceed(state, false));
    else if (k === "dismiss") commit(E.dismiss(state));
    else if (k === "event") commit(E.resolveEvent(state, Number(a.dataset.i)));
    else if (k === "sheet") { sheet = a.dataset.sheet; render(); }
    else if (k === "close") { sheet = null; render(); }
    else if (k === "restart") { state = { restart: true }; sheet = null; store.set(null); render(); }
    else if (k === "toast") { toast = ""; render(); }
  }
  let down = null;
  app.addEventListener("pointerdown", (e) => { const v = e.target.closest(".veil"); if (v) v.classList.add("shown"); }, true);
  app.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  app.addEventListener("pointerup", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || e.pointerType === "mouse") return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    lastTap = Date.now();
    act(a);
  });
  app.addEventListener("click", (e) => {
    const a = e.target.closest("button[data-action]");
    if (!a || a.disabled || Date.now() - lastTap < 500) return;
    if (a.type === "submit") return;
    act(a);
  });
  render();
})();
