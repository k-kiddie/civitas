"use strict";
(async function () {
  const E = SeasonEngine,
    C = HarborContent,
    H = HarborRules,
    app = document.querySelector("#app");
  const loaded = await SeasonSave.load();
  let state = loaded.state || E.fresh(),
    setup = !loaded.state,
    tab = "city",
    selected = null,
    sheet = null,
    newspaper = false,
    showArchive = false,
    message = loaded.warning,
    saveStatus = loaded.state ? "저장된 가문을 불러옴" : "새 가문",
    sequence = 0;
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const button = (label, action, attrs = "") =>
    `<button data-action="${action}" ${attrs}>${label}</button>`;
  function persist() {
    const id = ++sequence;
    saveStatus = "저장 중…";
    SeasonSave.save(state).then(
      (text) => {
        if (id === sequence) {
          saveStatus = text;
          updateSave();
        }
      },
      (error) => {
        if (id === sequence) {
          saveStatus = error.message;
          updateSave();
        }
      },
    );
  }
  function updateSave() {
    const node = document.querySelector("#save-status");
    if (node) node.textContent = saveStatus;
  }
  function commit(result) {
    if (result.error) {
      message = result.error;
      render();
      return false;
    }
    state = result.state;
    message = "";
    persist();
    return true;
  }
  function target(place) {
    const family = state.family.filter(
        (p) => state.placements[p.id] === place.id,
      ),
      rivals = state.rivals.filter((r) => r.place === place.id);
    const count = family.length;
    const blocked = selected && E.placeReason(state, selected, place.id);
    return `<button class="place ${selected ? "ready" : ""} ${blocked ? "blocked" : ""} ${place.id === "gate" && state.built ? "built" : ""}" data-place="${place.id}" style="--x:${place.x}%;--y:${place.y}%" aria-label="${esc(place.name)} · ${count}/${place.slots}人 · ${esc(place.action)}" ${selected && blocked ? 'aria-disabled="true"' : ""}><span class="place-icon" aria-hidden="true">${place.icon}</span><span class="place-name">${place.name}</span><span class="place-tag">${placeTag(place)}</span><span class="pieces">${family.map((p) => `<span class="piece player">${esc(p.name.slice(0, 1))}</span>`).join("")}${rivals.map((r) => `<span class="piece rival" title="${esc(r.hidden && !state.secret ? "은밀한 강씨 가문 사람" : r.name)}">${r.hidden && !state.secret ? "?" : esc(r.name.slice(0, 1))}</span>`).join("")}<span class="slots">${count}/${place.slots}</span></span></button>`;
  }
  function placeTag(place) {
    const c = state.crisis;
    if (c && !c.resolved && c.due === state.turn && C.crises[c.kind].place === place.id) return "⚠ 위기";
    return esc(place.tag);
  }
  function scoreboard() {
    const share = E.share(state),
      v = E.voters(state);
    return `<div class="scoreboard" aria-label="예상 득표"><div class="goal">${state.ended ? "첫 장 · 동장 선거 결과" : `이번 장 목표 · <b>${E.date(E.ELECTION_TURN)} 동장 선거</b>에서 도윤을 이긴다`}</div><div class="vote-bar ${share >= 50 ? "leading" : ""}"><i style="width:${share}%"></i><b class="half" aria-hidden="true"></b><span class="me">나 ${share}%</span><span class="them">도윤 ${100 - share}%</span></div><div class="districts">${E.DISTRICTS.map((d, i) => `<span class="${state.votes[d.id] >= 50 ? "win" : ""}" title="유권자 ${v[i]}">${d.name} <b>${Math.round(state.votes[d.id])}%</b><small>×${v[i]}</small></span>`).join("")}</div></div>`;
  }
  function city() {
    return `<section class="city-view" aria-label="항구 지도"><div class="map-caption"><span>벨라르 · 항구 동네</span><span><i class="legend"></i> 우리 가문 <i class="legend red"></i> 강씨 가문</span></div><div class="map ${state.flooded > 0 ? "flooded" : ""}" id="city-map"><svg class="terrain" viewBox="0 0 400 440" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="water" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M0 12 Q8 8 16 12 T32 12" fill="none" stroke="#51848b" stroke-width="1" opacity=".4"/></pattern></defs><path d="M0 290 Q100 250 215 300 T400 270 V440 H0Z" fill="#224c58"/><path d="M0 290 Q100 250 215 300 T400 270 V440 H0Z" fill="url(#water)"/><path d="M-10 125 Q70 120 120 190 T310 210 L400 180 M180 30 Q210 130 210 240 L300 340 M90 225 L90 360" stroke="#a28e69" stroke-width="14" fill="none" opacity=".3"/><path d="M-10 125 Q70 120 120 190 T310 210 L400 180 M180 30 Q210 130 210 240 L300 340" stroke="#ccb78c" stroke-width="2" stroke-dasharray="4 5" fill="none" opacity=".3"/><path d="M40 310 L150 310 L150 323 L40 323Z M75 315 L75 410 L90 410 L90 315Z" fill="#9b7957"/>${state.built ? '<path d="M220 280 Q295 240 390 260" stroke="#c1b38c" stroke-width="12" fill="none"/>' : ""}</svg><span class="water-label">벨라르 강</span>${C.places.map(target).join("")}<div class="map-weather">${state.turn < 5 ? "장마가 오기 전" : "장마가 지나간 항구"}</div></div><div class="project-strip"><span>${state.plan && state.plan !== "none" ? esc(H.plans[state.plan].name) : "구호와 물길 대비"}</span><strong>${state.built ? "완공" : state.started ? `공정 ${state.progress}/${E.required(state)}` : state.plan && state.plan !== "none" ? `착공 자재비 ₭${H.plans[state.plan].cost}` : "피난 준비"}</strong><div class="progress"><i style="width:${state.built ? 100 : state.started ? (state.progress / E.required(state)) * 100 : state.prepared * 100}%"></i></div><small>${state.turn < 5 ? "수문에 사람을 놓아 대비합니다. 착공은 계절 정산 때 자재비를 내고 진행합니다." : `장마 피해 ${state.flooded ?? 0}가구 · ${state.promise === "kept" ? "어촌 보호 약속 이행" : state.promise === "broken" ? "깨진 어촌 보호 약속" : "도시가 선택을 기억합니다."}`}</small></div></section>`;
  }
  function family() {
    return `<section class="panel"><div class="eyebrow">우리 가문 · 1세대</div><h1>도시에 남길 이름</h1><p>가족 구성·성향·능력은 매 판 달라집니다. 성향에 맞는 장소에 놓으면 판정이 유리합니다. 놓지 않은 사람은 하숙집에서 일합니다.</p>${state.family.map((p) => `<article class="person-card"><div class="avatar large">${esc(p.name.slice(0, 1))}</div><div><h2>${esc(p.name)} <small>${esc(p.role)} · ${p.age}세</small></h2><span class="tag">${esc(p.trait)}</span> <small>${esc(C.traits[p.trait]?.text || "")}</small><p>말솜씨 ${p.skills.talk} · 살림 ${p.skills.manage}<br>계략 ${p.skills.scheme} · 배짱 ${p.skills.nerve}</p><small>${esc(C.places.find((l) => l.id === state.placements[p.id])?.name || "집안일 예정")}</small></div></article>`).join("")}<article class="info-card"><h2>가문 금고 ₭${state.money}</h2><p>계절 생활비 ₭12 · 하숙집 수입 1인 ₭7<br>돈이 바닥나면 외상 때문에 표가 깎입니다.</p>${state.contract ? `<p>도윤과 부두 사용권 계약 · 20년<br>하역 품삯 20 중 5 공제 · 증인 ${esc(state.contract.witnesses.join("·")) || "없음"}</p>` : "<p>부두 사용권 계약 없음</p>"}</article>${state.ended ? ending() : ""}</section>`;
  }
  function people() {
    return `<section class="panel"><div class="eyebrow">관계와 기억</div><h1>항구가 기억하는 사람들</h1>${rivalCard()}${C.people
      .map(
        (p) =>
          `<article class="info-card"><div class="person-heading"><span class="avatar npc">${p.name[0]}</span><div><h2>${p.name} <small>${p.role}</small></h2><span class="tag">${esc(p.trait)}</span> <small>관계 ${state.relations[p.id] > 0 ? "+" : ""}${state.relations[p.id]}</small></div></div><p>“${esc(p.line)}”</p>${state.memories
            .filter((m) => m.person === p.id)
            .slice(-3)
            .reverse()
            .map(
              (m) =>
                `<p class="memory"><small>${E.date(m.turn)}</small><br>${esc(m.text)}</p>`,
            )
            .join("")}</article>`,
      )
      .join(
        "",
      )}${state.secret ? '<article class="info-card secret"><h2>알고 있는 비밀</h2><p>강씨 상관의 밀수 장부 · 도윤과의 공사비 협상에서 숨은 선택이 열립니다.</p></article>' : ""}</section>`;
  }
  function rivalCard() {
    const rt = C.rivalTypes[state.rival.type];
    return `<article class="info-card rival-card"><h2>강씨 가문 · ${rt.name}</h2><p>${esc(rt.desc)}</p><p><small>${state.rival.members.map(esc).join(" · ")} · 가장 도윤은 판정 +11, 나머지 +7</small></p></article>`;
  }
  function ending() {
    const e = state.election;
    if (!e) return "";
    const r = E.reasons(state);
    const line = ([k, v]) => `<li><span>${esc(k)}</span><b>${v > 0 ? "+" : ""}${v}</b></li>`;
    return `<article class="info-card ending ${e.won ? "won" : "lost"}"><div class="eyebrow">가문의 첫 장 · ${E.date(E.ELECTION_TURN)}</div><h2>${e.won ? "당선 — 이름 없던 가문이 동장이 되었다" : "낙선 — 항구는 도윤의 것이 되었다"}</h2><p class="big-share">득표율 <b>${e.share}%</b></p><div class="district-results">${e.districts.map((d) => `<div class="${d.winner}"><span>${d.name} ×${d.voters}</span><strong>${Math.round(d.share)}%</strong></div>`).join("")}</div><h3>표를 모아 준 것</h3><ul class="reasons">${r.plus.map(line).join("") || "<li>없음</li>"}</ul><h3>표를 깎은 것</h3><ul class="reasons minus">${r.minus.map(line).join("") || "<li>없음</li>"}</ul><p>${state.built ? esc(H.plans[state.built].name) + " 완공" : "제방 미완공"} · 침수 ${state.flooded}가구 · 강씨 가문(${C.rivalTypes[state.rival.type].name}) · ${esc(C.crises[state.crisis.kind].name)} ${state.crisis.outcome === "held" ? "막아냄" : "놓침"}</p><p class="muted">다음 판은 가족·라이벌 성격·위기가 바뀝니다. 다른 길로 이겨 보세요.</p>${button("다른 가족으로 새 판 시작", "new", 'class="primary"')}${button("지난 신문 다시 읽기", "archive", 'class="secondary"')}</article>`;
  }
  function hint() {
    if (state.ended) return "첫 장 완료";
    const c = state.crisis;
    if (c && !c.resolved && c.due === state.turn) {
      const cr = C.crises[c.kind];
      return `⚠ 이번 계절 ${cr.name}: ${C.places.find((p) => p.id === cr.place).name}에 사람을 두세요`;
    }
    if (state.turn === E.ELECTION_TURN - 1) return "선거 전 마지막 계절 · 표가 약한 구역을 노리세요";
    if (state.turn < E.FLOOD_TURN && state.plan && state.plan !== "none" && !state.started)
      return `제방 착공에 ₭${H.plans[state.plan].cost} 필요 · 모이면 수문에 사람을 놓으세요`;
    const rt = C.rivalTypes[state.rival.type];
    return `강씨 가문(${rt.name})의 말이 있는 곳에 놓으면 막을 수 있습니다`;
  }
  function roster() {
    return `<section class="command"><div class="ambition"><span>${hint()}</span>${selected ? button("선택 해제", "deselect", 'class="text-button"') : ""}</div><div class="roster">${state.family.map((p) => `<button class="token ${selected === p.id ? "selected" : ""}" data-person="${p.id}" aria-pressed="${selected === p.id}" ${state.queue.length || state.ended ? "disabled" : ""}><span class="avatar">${esc(p.name.slice(0, 1))}</span><span>${esc(p.name)} <em>${esc(p.trait)}</em><small>${esc(C.places.find((l) => l.id === state.placements[p.id])?.name || "→ 하숙집")}</small></span></button>`).join("")}</div><div class="turn-actions">${button("배치 되돌리기", "undo", `class="secondary" ${!Object.keys(state.placements).length || state.queue.length ? "disabled" : ""}`)}${button(state.ended ? "가문의 첫 장 보기" : `${state.turn === E.ELECTION_TURN - 1 ? "선거 전 마지막 계절" : E.date(state.turn)} 마치기 →`, "advance", `${state.queue.length || state.ended ? "disabled" : ""} class="primary"`)}</div><p class="instruction">${selected ? "지도에서 목적지를 누르세요. 계절을 마치기 전까지 다시 놓을 수 있습니다." : "사람을 고르고 장소를 누르세요 · 끌어 놓기도 가능"}</p></section>`;
  }
  function eventModal() {
    if (state.lastResult)
      return `<div class="veil"><section class="modal result" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="eyebrow">선택의 흔적</div><h2 id="dialog-title">${esc(state.lastResult.who)}의 반응</h2><p>${esc(state.lastResult.text)}</p>${state.lastResult.delta ? `<p class="outcome">${esc(state.lastResult.delta)}</p>` : ""}${button("계속", "result", 'class="primary" autofocus')}</section></div>`;
    const e = C.events.find((e) => e.id === state.queue[0]);
    if (!e) return "";
    const person = C.people.find((p) => p.id === e.who);
    let scene = e.scene,
      extra = "";
    if (e.id === "flood") {
      scene =
        state.flooded === 0
          ? "storm-safe"
          : state.flooded < 18
            ? "storm-partial"
            : "storm-flood";
      extra = `<p class="outcome">${state.built ? esc(H.plans[state.built].name) + " 완공" : "제방 미완공"} · 침수 ${state.flooded}가구${state.promise === "broken" ? "<br>소라와의 보호 약속이 깨졌습니다." : ""}</p>`;
    }
    if (e.id === "election") {
      scene = state.election.won ? "election-win" : "election-loss";
      extra = `<p class="outcome">${state.election.won ? "당선!" : "낙선"} · ${esc(state.election.winner)} 동장 · 당신의 득표율 ${state.election.share}%</p><div class="district-results">${state.election.districts.map((d) => `<div class="${d.winner}"><span>${d.name}</span><strong>${Math.round(d.share)}%</strong></div>`).join("")}</div>`;
    }
    return `<div class="veil"><section class="modal event ${e.kind}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" data-card="${e.kind}"><img class="event-art" src="../assets/events/${scene}.webp" alt="항구 도시의 ${e.id === "flood" ? "장마 뒤 풍경" : "사건 장면"}"><div class="event-body"><div class="eyebrow">${e.kind === "climax" ? "도시에 남은 순간" : e.kind === "minor" ? "작은 만남 · 좌우로 밀어 선택" : "항구의 이야기"} · ${E.date(state.turn)}</div><h2 id="dialog-title">${esc(e.title)}</h2><p class="speaker">${person?.name} · ${person?.role}</p>${e.lines.map((l) => `<p class="dialogue">“${esc(l)}”</p>`).join("")}${extra}${e.choices
      .filter((c) => !c.requires.secret || state.secret)
      .map((c) => {
        const reason = E.choiceReason(state, c);
        return button(
          `${esc(c.label)}${reason ? `<small>${reason}</small>` : ""}${E.describe(c.effects) ? `<small>${esc(E.describe(c.effects))}</small>` : ""}`,
          "choice",
          `data-event="${e.id}" data-choice="${c.id}" ${reason ? "disabled" : ""}`,
        );
      })
      .join("")}</div></section></div>`;
  }
  function reportModal() {
    const reports = showArchive ? state.reports : [state.reports[0]];
    return `<div class="veil"><section class="modal newspaper" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="paper-brand" id="dialog-title">벨 라 르 신 보</div><div class="paper-date">항구판 · ${E.date(state.turn)}</div>${reports.map((r) => `<article><small>${E.date(r.turn)}</small><h2>${esc(r.title)}</h2>${r.lines.map((l, i) => `<p class="${i === 0 && r.turn ? "lead" : /^(강씨|도윤|강[가-힣]{2} ·)/.test(l) ? "rival-line" : ""}">${esc(l)}</p>`).join("")}</article>`).join("")}<p class="teaser">${state.ended ? "개표가 끝났다. 가문의 첫 장이 덮인다." : `동장 선거까지 ${E.ELECTION_TURN - state.turn}계절 · 지금 예상 득표 ${E.share(state)}%. ${state.turn < E.FLOOD_TURN ? `큰 장마까지 ${E.FLOOD_TURN - state.turn}계절.` : "장마의 기억이 표가 된다."}`}</p>${button("신문을 접고 항구로", "close-report", 'class="primary" autofocus')}</section></div>`;
  }
  function rivalHere(p) {
    const here = state.rivals.filter((r) => r.place === p.id);
    if (!here.length) return "";
    const fx = C.rivalTypes[state.rival.type].effects[p.id];
    return `<p class="warn">강씨 가문 ${here.length}명이 이 장소를 노립니다${fx ? ` · 막지 않으면: ${esc(fx.text)}` : ""}.</p>`;
  }
  function placeSheet() {
    const p = C.places.find((p) => p.id === sheet);
    if (!p) return "";
    return `<div class="veil bottom"><section class="modal place-sheet" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="eyebrow">장소 · ${p.slots}자리</div><h2 id="dialog-title">${p.name}</h2><h3>${p.action}</h3><p>${p.hint} · 위험 ${p.risk}<br>주요 능력: ${{ talk: "말솜씨", manage: "살림", scheme: "계략", nerve: "배짱" }[p.skill]}</p>${p.id === "gate" ? `<p>${state.turn < 5 && state.plan && state.plan !== "none" ? `착공 자재비 ₭${H.plans[state.plan].cost} · 목표 공정 ${E.required(state)}. 살림 10 이상이면 계절당 공정 2, 나머지는 1.` : "피난 대비 또는 장마 뒤 보수에 참여합니다."}</p>` : ""}${rivalHere(p)}<p>강씨 가문과 같은 곳에 놓으면 능력 대결을 합니다. 이기면 그들의 행동을 막고, 지면 이 장소의 효과를 얻지 못합니다.</p>${state.family
      .map((person) => {
        const reason = E.placeReason(state, person.id, p.id);
        return button(
          `${esc(person.name)} 놓기${reason ? ` · ${reason}` : ""}`,
          "assign",
          `data-person="${person.id}" data-place-id="${p.id}" ${reason ? "disabled" : ""}`,
        );
      })
      .join(
        "",
      )}${button("닫기", "close-sheet", 'class="secondary"')}</section></div>`;
  }
  function setupModal() {
    return `<div class="veil"><section class="modal setup" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="setup-picture"></div><div class="event-body"><div class="eyebrow">CIVITAS · 이름 없는 자들의 도시</div><h1 id="dialog-title">가문의 첫 장</h1><p><b>목표: 여덟 계절 뒤 동장 선거에서 선주 도윤을 이긴다.</b><br>가족을 항구 곳곳에 보내 표를 모으고, 큰 장마에서 어촌을 지키고, 강씨 가문의 방해를 막으세요.</p><form id="new-family"><label>가장의 이름<input name="name" maxlength="20" required value="${esc(state.family[0].name === "이름 없는 가장" ? "" : state.family[0].name)}" placeholder="이름을 적어 주세요" autocomplete="off"></label><label>성별<select name="gender"><option value="unspecified">미지정</option><option value="male">남성</option><option value="female">여성</option></select></label><p class="muted">가족 구성·성향, 강씨 가문의 성격, 위기는 매 판 달라집니다.</p><button class="primary" type="submit">항구에서 시작하기 →</button></form>${button("저장 백업 가져오기", "import", 'class="secondary"')}${loaded.state ? button("기존 가문으로 돌아가기", "cancel-new", 'class="text-button"') : ""}<a class="legacy-link" href="../">기존 게임 이어하기</a></div></section></div>`;
  }
  function render() {
    app.innerHTML = `<div class="game-shell"><header><div class="masthead"><a class="brand" href="./">CIVITAS<span>이름 없는 자들의 도시</span></a><button class="era" data-action="archive">1장 · 동장 선거<br><strong>${E.date(state.turn)}${state.ended ? " · 완료" : ""}</strong></button></div>${scoreboard()}<div class="resources"><span title="가문 금고">₭ <b>${state.money}</b></span><span title="도윤의 약점 단서 (3개 모으면 밀수 장부)">약점 <b>${state.secret ? "장부 확보" : state.dirt + "/3"}</b></span><span title="장마 대비">${state.plan && state.plan !== "none" ? (state.built ? "제방 완공" : state.started ? `제방 ${state.progress}/${E.required(state)}` : "제방 미착공") : "제방 없음"}</span></div><div class="horizons">${
      E.horizons(state)
        .map(
          (h) =>
            `<span title="${h.detail}" class="horizon ${h.left <= 1 ? "urgent" : ""}"><i></i>${h.name}<b>${h.left ? h.left + "계절" : "이번 계절"}</b></span>`,
        )
        .join("") ||
      `<span class="horizon">${state.ended ? "가문의 첫 장이 끝났습니다. 결과는 아래에." : "선거가 다가옵니다."}</span>`
    }</div></header><main>${tab === "city" ? city() + (state.ended ? ending() : roster()) : tab === "family" ? family() : people()}</main><nav aria-label="주요 화면">${[
      ["city", "⌖", "도시"],
      ["family", "♧", "가문"],
      ["people", "♙", "인물"],
    ]
      .map(([id, icon, name]) =>
        button(
          `<span>${icon}</span>${name}`,
          "tab",
          `data-tab="${id}" ${tab === id ? 'aria-current="page"' : ""}`,
        ),
      )
      .join(
        "",
      )}</nav><footer><span id="save-status" role="status">${esc(saveStatus)}</span><div>${button("백업 내보내기", "export", 'class="text-button"')}${button("가져오기", "import", 'class="text-button"')}${button("새 가문", "new", 'class="text-button"')}<a href="../">기존 게임</a></div></footer></div><div class="toast" role="status" ${message ? "" : "hidden"}>${esc(message)}${button("×", "dismiss", 'aria-label="알림 닫기"')}</div>${setup ? setupModal() : newspaper || showArchive ? reportModal() : state.lastResult || state.queue.length ? eventModal() : sheet ? placeSheet() : ""}<input type="file" id="import-file" accept="application/json" hidden>`;
    document.body.classList.toggle(
      "modal-open",
      !!(
        setup ||
        newspaper ||
        showArchive ||
        state.lastResult ||
        state.queue.length ||
        sheet
      ),
    );
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const focus = dialog.querySelector(
        "[autofocus],button:not(:disabled),input",
      );
      focus?.focus({ preventScroll: true });
    }
  }
  app.addEventListener("submit", (event) => {
    if (event.target.id !== "new-family") return;
    event.preventDefault();
    const data = new FormData(event.target);
    const name = String(data.get("name")).trim();
    if (!name) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    state = E.fresh({ name, gender: data.get("gender"), seed });
    setup = false;
    loaded.state = state;
    selected = null;
    sheet = null;
    tab = "city";
    showArchive = false;
    newspaper = true;
    message = "";
    persist();
    render();
  });
  app.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action) {
      const a = action.dataset.action;
      if (a === "choice") {
        commit(E.choose(state, action.dataset.event, action.dataset.choice));
      }
      if (a === "result") {
        state = { ...state, lastResult: null };
        persist();
      }
      if (a === "advance") {
        if (commit(E.advance(state))) {
          selected = null;
          newspaper = true;
        }
      }
      if (a === "undo") {
        state = { ...state, placements: {} };
        persist();
      }
      if (a === "deselect") selected = null;
      if (a === "tab") {
        tab = action.dataset.tab;
        selected = null;
        sheet = null;
      }
      if (a === "assign") {
        if (
          commit(E.place(state, action.dataset.person, action.dataset.placeId))
        ) {
          selected = null;
          sheet = null;
        }
      }
      if (a === "close-sheet") sheet = null;
      if (a === "archive") {
        showArchive = true;
      }
      if (a === "close-report") {
        newspaper = false;
        showArchive = false;
      }
      if (a === "dismiss") message = "";
      if (a === "new") {
        setup = true;
      }
      if (a === "cancel-new") setup = false;
      if (a === "export") {
        const blob = new Blob(
            [JSON.stringify({ savedAt: Date.now(), state }, null, 2)],
            { type: "application/json" },
          ),
          url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = "civitas-season-backup.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        message = "백업 파일을 내려받았습니다.";
      }
      if (a === "import") {
        document.querySelector("#import-file").click();
        return;
      }
      render();
      return;
    }
    const person = event.target.closest("[data-person]");
    if (person) {
      selected =
        selected === person.dataset.person ? null : person.dataset.person;
      render();
      return;
    }
    const place = event.target.closest("[data-place]");
    if (place) {
      if (selected) {
        if (commit(E.place(state, selected, place.dataset.place)))
          selected = null;
      } else sheet = place.dataset.place;
      render();
    }
  });
  app.addEventListener("change", async (event) => {
    if (event.target.id !== "import-file") return;
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024)
        throw Error("백업은 2MB 이하여야 합니다.");
      const value = JSON.parse(await file.text());
      const incoming = E.validate(value.state);
      if (
        !confirm(
          "현재 가문 대신 이 백업을 불러올까요? 현재 진행은 먼저 내보내기로 보관할 수 있습니다.",
        )
      )
        return;
      state = incoming;
      setup = false;
      loaded.state = state;
      selected = null;
      sheet = null;
      newspaper = showArchive = false;
      persist();
      message = "백업에서 가문을 복원했습니다.";
    } catch (error) {
      message = error.message || "백업을 읽지 못했습니다.";
    }
    render();
  });
  // Pointer events provide the same placement operation for mouse, pen and touch.
  let drag = null,
    suppressClick = false;
  app.addEventListener("pointerdown", (e) => {
    const token = e.target.closest(".token:not(:disabled)");
    if (token && e.button === 0) {
      drag = {
        id: token.dataset.person,
        x: e.clientX,
        y: e.clientY,
        active: false,
      };
    }
  });
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 9)
        drag.active = true;
      if (drag.active) {
        e.preventDefault();
        let ghost = document.querySelector(".drag-ghost");
        if (!ghost) {
          ghost = document.createElement("div");
          ghost.className = "drag-ghost";
          ghost.textContent = state.family.find((p) => p.id === drag.id).name;
          document.body.append(ghost);
        }
        ghost.style.left = e.clientX + "px";
        ghost.style.top = e.clientY + "px";
      }
    },
    { passive: false },
  );
  window.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    document.querySelector(".drag-ghost")?.remove();
    if (d.active) {
      const place = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-place]");
      if (place) commit(E.place(state, d.id, place.dataset.place));
      else message = "지도 위 장소에 놓아 주세요.";
      selected = null;
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
      render();
    }
  });
  window.addEventListener("pointercancel", () => {
    drag = null;
    document.querySelector(".drag-ghost")?.remove();
  });
  let swipe = null;
  app.addEventListener("pointerdown", (e) => {
    if (e.target.closest('[data-card="minor"]') && !e.target.closest("button"))
      swipe = { x: e.clientX, y: e.clientY };
  });
  app.addEventListener("pointerup", (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x,
      dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 50) {
      const ev = C.events.find((v) => v.id === state.queue[0]);
      if (ev?.kind === "minor") {
        commit(E.choose(state, ev.id, dx > 0 ? "yes" : "no"));
        render();
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (e.key === "Escape" && sheet) {
      sheet = null;
      render();
      return;
    }
    if (e.key === "Tab" && dialog) {
      const focusable = [
        ...dialog.querySelectorAll(
          "button:not(:disabled),input,select,a[href]",
        ),
      ];
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  render();
})();
