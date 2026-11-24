"use strict";
// CIVITAS 맛보기 화면. 지도에서 장소를 누르면 사건 → 선택 → 결과가 바로 나온다.
(function () {
  const P = ProtoEngine,
    D = ProtoData,
    app = document.querySelector("#app");
  const SAVE = "civitas-proto-v1",
    LEGACY = "civitas-proto-legacy";
  const store = {
    get(k) {
      try {
        return JSON.parse(localStorage.getItem(k));
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch {
        return false;
      }
    },
  };
  let state = null,
    sheet = null, // build | family | log | help
    toast = "",
    prev = null, // 직전 수치(숫자 튀는 효과)
    armed = null, // 두 번 눌러 확인하는 버튼(앱 내 브라우저는 confirm 창이 막힐 수 있다)
    armedAt = 0,
    lastDismiss = 0;
  let legacy = store.get(LEGACY) || { endings: {}, runs: 0, bestTitle: 0 };
  try {
    const saved = store.get(SAVE);
    if (saved) state = P.validate(saved);
  } catch {
    toast = "저장이 손상되어 새로 시작합니다.";
  }
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const btn = (label, action, attrs = "") => `<button data-action="${action}" ${attrs}>${label}</button>`;
  const STAT = { money: ["₭", "money"], fame: ["★", "fame"], health: ["❤", "health"], hostility: ["⚔ 적의", "bad"], rivalFame: ["도윤 ★", "bad"], dirt: ["🗝 약점", "fame"] };

  function commit(res) {
    if (res.error) {
      toast = res.error;
      render();
      return false;
    }
    prev = state && { money: state.money, fame: state.fame, health: state.health };
    state = res.state;
    toast = "";
    store.set(SAVE, state);
    if (state.ending && !state.result && !state.summary) recordEnding();
    render();
    return true;
  }
  function recordEnding() {
    if (state.recorded) return;
    state.recorded = true;
    legacy.runs += 1;
    legacy.endings[state.ending] = (legacy.endings[state.ending] || 0) + 1;
    legacy.bestTitle = Math.max(legacy.bestTitle, state.title);
    store.set(LEGACY, legacy);
    store.set(SAVE, state);
  }
  const originOpen = (id) => (id === "worker" ? true : id === "merchant" ? legacy.runs > 0 : legacy.bestTitle >= 2);

  // ── 위쪽: 수치·목표·위협 ──
  function stat(key, icon, value, extra = "") {
    const d = prev && prev[key] !== undefined ? value - prev[key] : 0;
    return `<div class="stat ${key}"><span class="ico">${icon}</span><b>${value}</b>${extra}${d ? `<i class="pop ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${d}</i>` : ""}</div>`;
  }
  function goal() {
    const s = state;
    if (s.title >= 2) {
      const need = D.titles[3].fame;
      const pct = Math.min(100, (s.fame / need) * 100);
      return `<div class="goal"><div class="goal-text">최종 목표 · <b>강씨 저택에서 결판</b> (명성 ★${need})</div><div class="track"><i style="width:${pct}%"></i><em style="left:${Math.min(100, (s.rivalFame / need) * 100)}%" title="도윤"></em></div><div class="goal-sub">나 ★${s.fame} · 도윤 ★${s.rivalFame}${s.fame >= need ? " · <b class='go'>강씨 저택으로!</b>" : ""}</div></div>`;
    }
    const next = D.titles[s.title + 1];
    const at = P.nextElection(s);
    const pct = Math.min(100, (s.fame / next.fame) * 100);
    const chance = Math.round(P.electionChance(s) * 100);
    const when = at === null ? "남은 선거 없음" : at === s.season ? "이번 계절 끝!" : `${P.date(at)} 끝 · ${at - s.season}계절 뒤`;
    return `<div class="goal ${at !== null && at - s.season <= 1 ? "ready" : ""}"><div class="goal-text">다음 목표 · <b>${next.name} 선거</b> <span class="when">${when}</span></div><div class="track"><i style="width:${pct}%"></i></div><div class="goal-sub">출마 조건 ★${next.fame} · 지금 ★${s.fame} · 도윤 ★${s.rivalFame} · ${P.canElect(s) ? `<b class="go">당선 확률 ${chance}%</b>` : `<b class="no">★${next.fame - s.fame} 부족</b>`}</div></div>`;
  }
  function plans() {
    if (!state.plans.length) return "";
    return `<div class="plans"><span class="plans-head">도윤의 다음 수</span>${state.plans
      .map((p) => {
        const m = D.rivalMoves.find((x) => x.id === p.id);
        const loc = D.locations.find((l) => l.id === p.loc);
        return p.blocked
          ? `<span class="plan done">🛡 ${loc.name} · 막았다</span>`
          : `<span class="plan">⚔ ${loc.icon} ${loc.name}: ${m.text}<small>막지 않으면 ${P.describe(state, m.fail)}</small></span>`;
      })
      .join("")}</div>`;
  }
  function threats() {
    if (!state.threats.length) return "";
    return `<div class="threats">${state.threats
      .slice()
      .sort((a, b) => a.left - b.left)
      .map((t) => {
        const d = D.threats[t.id];
        return `<button class="threat ${t.left <= 1 ? "urgent" : ""}" data-action="threat" data-id="${t.id}">${d.icon} ${d.name} <b>${t.left}계절</b></button>`;
      })
      .join("")}</div>`;
  }
  function tip() {
    const s = state;
    if (s.season === 0 && s.ap === P.AP) return "장소를 누르면 사건이 터지고 결과가 바로 나온다. 계절마다 3번. ⚔ 표시는 도윤이 이번 계절 노리는 곳 — 가면 막는다.";
    const flood = s.threats.find((t) => t.id === "flood");
    if (flood && !s.buildings.some((b) => b.id === "dike")) {
      const cost = P.buildCost(s, "dike");
      return s.money >= cost ? `🧱 제방을 지을 돈이 모였다! 아래 [건설]에서 제방(₭${cost})을 지으세요.` : `🌊 큰 장마까지 ${flood.left}계절. 제방 ₭${cost}이 필요합니다 (지금 ₭${s.money}). 부두·시장에서 돈을 버세요.`;
    }
    const at = P.nextElection(s);
    if (at !== null && at - s.season <= 1 && P.canElect(s) && !s.flags.bought) return `🗳 ${D.titles[s.title + 1].name} 선거가 ${at === s.season ? "이번" : "다음"} 계절 끝에 열린다! 시청에서 선거 운동을 하면 당선 확률이 오른다.`;
    if (at !== null && at - s.season <= 2 && !P.canElect(s)) return `🗳 선거까지 ${at - s.season}계절인데 명성이 ★${D.titles[s.title + 1].fame - s.fame} 모자란다. 어촌·조합에서 명성을 올리세요.`;
    if (s.plans.some((p) => !p.blocked) && s.season < 2) return "⚔ 도윤의 다음 수가 위에 보인다. 그 장소에 가면 막을 수 있다. 행동은 3번뿐 — 막을지, 벌지, 대비할지 고르세요.";
    if (s.health < 40) return "❤ 건강이 위험합니다. 하숙집에서 쉬세요. 0이 되면 가장이 죽습니다.";
    if (s.dirt >= 3 && s.title >= 1) return "🗝 강씨의 약점이 다 모였다! 시청에서 폭로할 수 있습니다.";
    if (s.ap === 0) return "행동을 다 썼습니다. [계절 넘기기]를 누르세요.";
    if (s.money >= 30 && s.buildings.length < 2) return "🏗 돈이 남으면 [건설]로 노점을 지어 계절마다 수입을 늘리세요.";
    if (s.fame < s.rivalFame) return "도윤의 명성이 앞서 있다. 선거 당선 확률이 낮아진다. 도윤의 계획을 막거나 약점을 모아 깎으세요.";
    return "";
  }
  // ── 지도 ──
  const LOT_POS = [
    [34, 66],
    [66, 48],
    [70, 84],
    [36, 40],
    [90, 50],
    [10, 34],
  ];
  function map() {
    const s = state;
    const nodes = D.locations
      .map((l) => {
        const open = P.unlocked(s, l);
        const hot =
          open &&
          ((l.id === "hall" && ((P.canElect(s) && P.nextElection(s) !== null && P.nextElection(s) - s.season <= 1 && !s.flags.bought) || (s.dirt >= 3 && s.title >= 1))) ||
            (l.id === "manor" && s.fame >= D.titles[3].fame) ||
            (l.id === "alley" && s.threats.some((t) => t.id === "assassin" || t.id === "customs")) ||
            (l.id === "market" && s.threats.some((t) => t.id === "plague")) ||
            (l.id === "home" && s.health < 40));
        const plan = s.plans.find((p) => p.loc === l.id);
        const badge = plan ? `<span class="badge ${plan.blocked ? "ok" : ""}">${plan.blocked ? "🛡" : "⚔"}</span>` : "";
        return `<button class="node ${open ? "" : "locked"} ${hot ? "hot" : ""}" data-loc="${l.id}" style="left:${l.x}%;top:${l.y}%" ${!open ? `aria-disabled="true"` : ""}><span class="node-icon">${open ? l.icon : "🔒"}${badge}</span><span class="node-name">${l.name}</span><span class="node-purpose">${open ? l.purpose : D.titles[l.title].name + " 이상"}</span></button>`;
      })
      .join("");
    const lots = s.buildings.map((b) => `<span class="lot" style="left:${LOT_POS[b.lot][0]}%;top:${LOT_POS[b.lot][1]}%" title="${D.buildings[b.id].name}">${D.buildings[b.id].icon}</span>`).join("");
    const ap = Array.from({ length: P.AP }, (_, i) => `<i class="${i < s.ap ? "on" : ""}"></i>`).join("");
    return `<section class="map ${s.season % 4 === 1 ? "summer" : s.season % 4 === 3 ? "winter" : ""}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 74 Q25 66 50 76 T100 70 V100 H0Z" class="water"/><path d="M0 80 Q25 72 50 82 T100 76" class="wave"/><path d="M16 55 L50 60 L52 36 L80 30 M50 60 L82 70 M26 82 L50 60 M22 24 L52 36 L52 10" class="road"/>${s.buildings.some((b) => b.id === "dike") ? '<path d="M0 72 Q25 64 50 74 T100 68" class="dike"/>' : ""}</svg>${lots}${nodes}<div class="ap">남은 행동 ${ap}</div><div class="date">${P.date(s.season)}</div></section>`;
  }
  function bottom() {
    const f = P.forecast(state);
    return `<section class="bar"><div class="forecast">계절 끝 정산: 수입 ₭+${f.income} · 생활비 ₭−${f.upkeep}${f.fame ? ` · 명성 +${f.fame}` : ""} → <b>₭${state.money + f.net}</b></div><div class="actions">${btn("🏗<span>건설</span>", "sheet", 'data-sheet="build"')}${btn("👪<span>가문</span>", "sheet", 'data-sheet="family"')}${btn("📜<span>연대기</span>", "sheet", 'data-sheet="log"')}${btn(armed === "end" ? `정말 넘길까요?<small>행동 ${state.ap}회가 사라집니다 · 한 번 더</small>` : `계절 넘기기 →${state.ap ? `<small>행동 ${state.ap}회 남음</small>` : ""}`, "end", `class="primary ${state.ap && armed !== "end" ? "" : "pulse"}"`)}</div></section>`;
  }
  // ── 모달 ──
  function eventModal() {
    const v = P.view(state);
    const outcome = (c) =>
      c.odds !== null
        ? `<small><b class="odds">성공 ${Math.round(c.odds * 100)}%</b> ${esc(c.win) || "변화 없음"}<br><b class="fail">실패</b> ${esc(c.lose) || "변화 없음"}</small>`
        : c.preview
          ? `<small>${esc(c.preview)}</small>`
          : "";
    return `<div class="veil"><section class="card event" role="dialog" aria-modal="true" aria-labelledby="t"><div class="loc-band">${v.loc.icon} ${v.loc.name} · ${v.loc.purpose}</div><div class="big-icon">${v.icon}</div><h2 id="t">${esc(v.title)}</h2><p class="story">${esc(v.text)}</p><div class="choices">${v.choices
      .map((c) => btn(`<span>${esc(c.label)}</span>${outcome(c)}${c.reason ? `<em>${esc(c.reason)}</em>` : ""}`, "choose", `data-i="${c.i}" ${c.reason ? "disabled" : ""}`))
      .join("")}</div></section></div>`;
  }
  function deltaChips(deltas) {
    return deltas
      .map((d) => {
        if (STAT[d.k]) {
          const good = d.k === "hostility" || d.k === "rivalFame" ? d.v < 0 : d.v > 0;
          return `<span class="chip ${good ? "good" : "bad"}">${STAT[d.k][0]} ${d.v > 0 ? "+" : ""}${d.v}</span>`;
        }
        const label = { recruit: "🤝 동료: ", resolve: "✅ 해결: ", threat: "⚠ 위협: ", family: "💍 가족: ", title: "👑 지위: " }[d.k] || "";
        return `<span class="chip ${d.k === "threat" ? "bad" : "good"}">${label}${esc(d.v)}</span>`;
      })
      .join("");
  }
  function resultModal() {
    const r = state.result;
    const head = r.success === null ? "" : r.success ? `<div class="verdict win">성공! <small>(${Math.round(r.odds * 100)}%)</small></div>` : `<div class="verdict lose">실패… <small>(${Math.round(r.odds * 100)}%)</small></div>`;
    return `<div class="veil"><section class="card result" role="dialog" aria-modal="true" aria-labelledby="t"><div class="big-icon">${r.icon}</div><h2 id="t">${esc(r.title)}</h2>${r.choice ? `<p class="picked">“${esc(r.choice)}”</p>` : ""}${head}<p class="story">${esc(r.text)}</p><div class="chips">${deltaChips(r.deltas)}</div>${r.notes.map((n) => `<p class="note">${esc(n)}</p>`).join("")}${btn(state.ending ? "결말 보기" : "계속", "dismiss", 'class="primary" autofocus')}</section></div>`;
  }
  function summaryModal() {
    const m = state.summary;
    return `<div class="veil"><section class="card paper" role="dialog" aria-modal="true" aria-labelledby="t"><div class="brand">벨 라 르 신 보</div><div class="paper-date">${m.date} 결산</div>${m.election ? `<div class="elect ${m.election.eligible ? (m.election.won ? "win" : "lose") : "lose"}">🗳 ${m.election.office} 선거 · ${!m.election.eligible ? "출마 자격 미달" : m.election.won ? "당선!" : "낙선"}${m.election.eligible ? ` <small>(확률 ${Math.round(m.election.p * 100)}%)</small>` : ""}</div>` : ""}<h2 id="t">${esc(m.headline)}</h2>${m.lines.map((l) => `<p>${esc(l)}</p>`).join("")}<p class="money-line">가문 금고 <b>₭${state.money}</b> (${m.net >= 0 ? "+" : ""}${m.net})</p>${btn(state.ending ? "결말 보기" : `${P.date(state.season)} 시작 →`, "dismiss", 'class="primary" autofocus')}</section></div>`;
  }
  function endingModal() {
    const e = D.endings[state.ending];
    return `<div class="veil"><section class="card ending ${e.win ? "win" : "lose"}" role="dialog" aria-modal="true" aria-labelledby="t"><div class="big-icon">${e.icon}</div><div class="eyebrow">${P.date(state.season)} · ${esc(P.headName(state))} 가문</div><h2 id="t">${e.title}</h2><p class="story">${e.text}</p><div class="end-stats"><span>지위<b>${D.titles[state.title].name}</b></span><span>명성<b>★${state.fame}</b></span><span>건물<b>${state.buildings.length}</b></span><span>점수<b>${P.score(state)}</b></span></div><p class="unlock">${unlockText()}</p>${btn("새 가문으로 다시", "restart", 'class="primary"')}${btn("연대기 보기", "sheet", 'data-sheet="log" class="secondary"')}</section></div>`;
  }
  function unlockText() {
    const seen = Object.keys(legacy.endings).length;
    const parts = [`지금까지 ${legacy.runs}판 · 엔딩 ${seen}/${Object.keys(D.endings).length}종`];
    if (legacy.runs === 1) parts.push("🔓 새 출신 ‘상인 집안’이 열렸다");
    if (state.title >= 2 && legacy.bestTitle >= 2) parts.push("🔓 ‘몰락한 귀족’ 출신 사용 가능");
    return parts.join("<br>");
  }
  function buildSheet() {
    return `<div class="veil bottom"><section class="card sheet" role="dialog" aria-modal="true" aria-labelledby="t"><h2 id="t">🏗 건설 <small>빈 땅 ${D.LOTS - state.buildings.length}/${D.LOTS} · ₭${state.money}</small></h2><p class="muted">건설은 행동을 쓰지 않습니다. 건물은 계절마다 수입과 명성을 냅니다.</p>${Object.entries(D.buildings)
      .map(([id, b]) => {
        const reason = P.buildReason(state, id);
        return btn(`<span class="b-icon">${b.icon}</span><span class="b-body"><b>${b.name}</b> <i>₭${P.buildCost(state, id)}</i><small>${b.desc}</small>${reason ? `<em>${reason}</em>` : ""}</span>`, "build", `data-id="${id}" class="build-row" ${reason ? "disabled" : ""}`);
      })
      .join("")}${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function familySheet() {
    const s = state;
    const fam = s.family.map((p, i) => `<li class="${p.alive ? "" : "dead"}">${i === s.head ? "👑" : p.alive ? "🙂" : "🕯"} <b>${esc(p.name)}</b> <small>${p.role} · ${p.age}세${p.alive ? "" : " · 사망"}</small></li>`).join("");
    const comp = s.companions.length
      ? s.companions.map((c) => { const d = D.companions[c.id]; return `<li>${d.icon} <b>${d.name}</b> <small>${d.role}</small><br><span class="perk">${d.perk}</span></li>`; }).join("")
      : "<li class='muted'>아직 동료가 없습니다. 장소를 돌며 사람을 만나세요.</li>";
    return `<div class="veil bottom"><section class="card sheet" role="dialog" aria-modal="true" aria-labelledby="t"><h2 id="t">👪 ${esc(P.headName(s))} 가문 <small>${D.titles[s.title].name}</small></h2><h3>가족 <small>가장이 쓰러지면 다음 사람이 잇는다</small></h3><ul class="list">${fam}</ul><h3>동료 <small>계절마다 ₭2</small></h3><ul class="list">${comp}</ul><h3>강씨 가문</h3><p>도윤 명성 ★${s.rivalFame} · 적의 ${s.hostility}/100 <small>(70 이상이면 자객)</small><br>모은 약점 🗝 ${s.dirt}/3 <small>(3개면 시청에서 폭로)</small></p>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function logSheet() {
    return `<div class="veil bottom"><section class="card sheet" role="dialog" aria-modal="true" aria-labelledby="t"><h2 id="t">📜 가문의 연대기</h2><ul class="list log">${state.log.slice().reverse().map((l) => `<li><small>${P.date(l.season)}</small> ${esc(l.text)}</li>`).join("")}</ul>${btn("닫기", "close", 'class="secondary"')}</section></div>`;
  }
  function newGame() {
    const origins = Object.entries(D.origins)
      .map(([id, o], i) => `<label class="origin ${originOpen(id) ? "" : "locked"}"><input type="radio" name="origin" value="${id}" ${i === 0 ? "checked" : ""} ${originOpen(id) ? "" : "disabled"}><b>${o.name}</b><small>${originOpen(id) ? o.desc : "🔒 " + o.unlock}</small></label>`)
      .join("");
    return `<div class="title-screen"><div class="logo">CIVITAS</div><p class="sub">이름 없는 가문의 연대기</p><form id="new"><label class="name">가장의 이름<input name="name" maxlength="12" required placeholder="이름" autocomplete="off"></label><div class="origins">${origins}</div><ul class="how"><li>🗺 <b>장소를 누르면 사건</b>이 터지고 결과가 바로 나온다. 계절마다 3번.</li><li>🏗 번 돈으로 <b>건물</b>을 지으면 계절마다 수입·명성이 쌓인다.</li><li>🗳 <b>명성</b>을 모아 도윤을 이기고 동장 → 시장 → 도시의 주인이 되라.</li><li>❤ 가장이 쓰러지면 가족이 잇는다. 대가 끊기면 끝.</li></ul><button class="primary" type="submit">가문 시작 →</button></form>${legacy.runs ? `<p class="legacy">지난 기록: ${legacy.runs}판 · 엔딩 ${Object.keys(legacy.endings).length}종 · 최고 지위 ${D.titles[legacy.bestTitle].name}</p>` : ""}<a class="back" href="../next/">이전 시제품(/next)</a></div>`;
  }
  function render() {
    if (!state || state.restart) {
      app.innerHTML = newGame() + toastHtml();
      return;
    }
    const s = state;
    const modal = s.event ? eventModal() : s.result ? resultModal() : s.summary ? summaryModal() : sheet === "build" ? buildSheet() : sheet === "family" ? familySheet() : sheet === "log" ? logSheet() : s.ending ? endingModal() : "";
    const t = tip();
    app.innerHTML = `<div class="shell"><header><div class="top"><span class="house">${esc(P.headName(s))} 가문 · <b>${D.titles[s.title].name}</b></span><span class="season">${P.date(s.season)} <small>${s.season + 1}/${P.LAST_SEASON}</small> ${btn(armed === "new" ? "한 번 더 누르면 새로 시작" : "새 가문", "new", `class="mini ${armed === "new" ? "armed" : ""}"`)}</span></div><div class="stats">${stat("money", "₭", s.money)}${stat("health", "❤", s.health, `<span class="hbar"><i style="width:${s.health}%"></i></span>`)}${stat("fame", "★", s.fame)}</div>${goal()}${plans()}${threats()}</header>${t ? `<div class="tip">${t}</div>` : ""}${map()}${bottom()}</div>${modal}${toastHtml()}`;
    prev = null;
    document.body.classList.toggle("modal-open", !!modal);
    const focus = document.querySelector("[role=dialog] [autofocus], [role=dialog] button:not(:disabled)");
    focus?.focus({ preventScroll: true });
  }
  function toastHtml() {
    return toast ? `<div class="toast" role="status">${esc(toast)} ${btn("×", "toast-close")}</div>` : "";
  }
  function confirmTwice(name) {
    if (armed === name && Date.now() - armedAt < 5000) return true;
    armed = name;
    armedAt = Date.now();
    render();
    return false;
  }
  function doDismiss() {
    if (Date.now() - lastDismiss < 400) return;
    lastDismiss = Date.now();
    commit(P.dismiss(state));
    if (state.ending) recordEnding(), render();
  }
  // "계속"은 손가락을 떼는 순간 바로 처리하고, 카드 바깥(어두운 배경)을 눌러도 넘어간다.
  app.addEventListener("pointerup", (e) => {
    if (!state || state.restart || !(state.result || state.summary)) return;
    const onButton = e.target.closest("[data-action=dismiss]");
    const onVeil = e.target.classList?.contains("veil");
    if (onButton || onVeil) {
      e.preventDefault();
      doDismiss();
    }
  });
  app.addEventListener("submit", (e) => {
    if (e.target.id !== "new") return;
    e.preventDefault();
    const data = new FormData(e.target);
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    state = P.newGame({ name: String(data.get("name")).trim(), origin: data.get("origin"), seed });
    sheet = null;
    store.set(SAVE, state);
    render();
  });
  app.addEventListener("click", (e) => {
    const loc = e.target.closest("[data-loc]");
    if (loc && !e.target.closest("[role=dialog]")) {
      commit(P.visit(state, loc.dataset.loc));
      return;
    }
    const a = e.target.closest("[data-action]");
    if (!a) return;
    const act = a.dataset.action;
    if (armed && act !== armed) armed = null;
    if (act === "choose") commit(P.choose(state, Number(a.dataset.i)));
    else if (act === "dismiss") doDismiss();
    else if (act === "end") {
      if (state.ap > 0 && !confirmTwice("end")) return;
      armed = null;
      commit(P.endSeason(state));
    } else if (act === "build") {
      sheet = null;
      commit(P.build(state, a.dataset.id));
    } else if (act === "sheet") {
      sheet = a.dataset.sheet;
      render();
    } else if (act === "close") {
      sheet = null;
      render();
    } else if (act === "threat") {
      const d = D.threats[a.dataset.id];
      toast = `${d.icon} ${d.name}: ${d.hint}`;
      render();
    } else if (act === "new") {
      if (!confirmTwice("new")) return;
      armed = null;
      state = { restart: true };
      sheet = null;
      store.set(SAVE, null);
      render();
    } else if (act === "restart") {
      state = { restart: true };
      sheet = null;
      render();
    } else if (act === "toast-close") {
      toast = "";
      render();
    }
  });
  render();
})();
