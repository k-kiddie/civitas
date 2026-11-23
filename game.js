'use strict';
(() => {
  const KEY = 'civitas-river-v3';
  const { fresh, apply, plans } = Campaign;
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!state || state.version !== 3) state = fresh();
  state = Campaign.normalize(state);
  let tab = 'city';
  let preview = 'long';
  let message = '';
  let resetPending = false;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const people = [
    ['윤', '수문공', '부두에 남은 물자국을 확인하고 싶다.'],
    ['소라', '어민 대표', '어촌의 집을 제방 안에 남기고 싶다.'],
    ['도윤', '선주', '공사비를 대고 항만 사용료를 얻으려 한다.'],
    ['지안', '의회 기록관', '공사와 선거의 기록을 시민에게 공개한다.'],
    ['민석', '항만 수사관', '부두에서 맺어진 계약을 지켜보고 있다.']
  ];
  function button(label, type, detail, disabled = false, extra = '') {
    return `<button class="choice" data-action="${type}" ${extra} ${disabled ? 'disabled' : ''}><strong>${label}</strong><small>${detail}</small></button>`;
  }
  const careerNames = { worker: '항구 일용직', mayor: '동장', investigator: '항만 수사관', councillor: '주민 협의회 위원' };
  function careerPanel() {
    if (state.day < 21 || (state.hearing && state.hearing.day <= state.day)) return '';
    const tired = !state.actions;
    let html = `<article class="card"><h3>${careerNames[state.career]}의 오늘</h3><p>도시 공금 ${state.treasury}크라운 · 공직 주급 18크라운 / 7일</p>`;
    if (state.career === 'worker') {
      html += `<p>계약을 공개한 시민은 민석 또는 지안의 추천을 받아 공직을 맡을 수 있다. 협의회 위원은 선출직 시의원과 별도 직책이다.</p>`;
      html += button('민석의 추천을 받아 수사관으로 일한다', 'join', '계약 공개 필요 · 행동 1', tired || !state.witness, 'data-career="investigator"');
      html += button('지안의 추천을 받아 협의회 위원이 된다', 'join', '계약 공개 필요 · 행동 1', tired || !state.witness, 'data-career="councillor"');
    }
    if (state.career === 'investigator') {
      html += button('임금 장부와 공사 계약을 대조한다', 'investigate', '기력 10 · 행동 1', tired || state.energy < 10 || state.caseStage !== 'open');
      if (state.caseStage === 'evidence') {
        html += button('보고서를 공개하고 청문회를 요청한다', 'caseDecision', '사흘 뒤 청문회 · 행동 1', tired, 'data-choice="public"');
        html += button('도윤과 비공개 합의한다', 'caseDecision', '20크라운 · 주민 지지 −8 · 민석이 기억함', tired, 'data-choice="private"');
      }
    }
    if (['mayor', 'councillor'].includes(state.career)) {
      html += button('계약 재협상안을 제출한다', 'bill', '기력 10 · 사흘 뒤 청문회 · 통과에 주민 지지 40 또는 이행한 약속과 계약 공개 필요', tired || state.energy < 10 || Boolean(state.bill) || Boolean(state.hearing));
    }
    if (state.career === 'mayor') html += button('공금으로 주거 복구를 발주한다', 'budget', '공금 12 · 최대 4가구 복귀 · 행동 1', tired || state.treasury < 12 || Object.values(state.residents).reduce((a,b) => a+b,0) >= 86);
    if (state.hearing) html += `<p class="toast">${state.hearing.day}일 청문회 예정. 시간을 넘기면 그날에 멈춘다.</p>`;
    if (state.bill && state.bill !== 'pending') html += `<p>재협상안 ${state.bill === 'passed' ? '통과' : '부결'} · ${state.contractRelief ? '품삯 공제 폐지' : '계약 유지'}</p>`;
    return html + '</article>';
  }
  function hearingPanel() {
    const hearing = state.hearing;
    const heard = hearing.heard || [];
    const strength = Campaign.hearingStrength(state);
    return `<article class="card"><div class="eyebrow">공개 청문회 · ${state.day}일</div><h2>누구의 증언을 남길 것인가</h2><p>청문회 중에는 시간이 멈춘다. 증언과 증거는 하루 행동을 소모하지 않는다. 설득력 ${strength}/4 · 4 이상이면 표결 통과.</p>${['윤','소라','민석','도윤'].map(person => button(person + '에게 질문한다', 'question', heard.includes(person) ? '증언 기록 완료 · 사람들 수첩에서 다시 확인' : '증언을 듣는다', heard.includes(person), `data-person="${person}"`)).join('')}${button('지안이 보관한 계약 사본을 공개한다', 'evidence', '설득력 +2 · 당신의 서명도 공개된다', !state.witness || hearing.evidence)}${button('표결을 요청한다', 'verdict', strength >= 4 ? '현재 증거로 통과 가능' : '현재 증거로는 부결 · 증언과 사본을 확인하자', false, 'data-choice="vote"')}${state.funding === 'merchant' ? button('도윤에게 공사비를 보전하고 합의한다', 'verdict', '개인 돈 12크라운 · 임금 공제 폐지', state.cash < 12 || !heard.includes('도윤'), 'data-choice="settle"') : ''}${button('안건을 철회한다', 'verdict', '현재 계약 유지 · 청문회 종료', false, 'data-choice="withdraw"')}</article>`;
  }
  function content() {
    if (tab === 'journal') return `<h2>도시가 기억하는 일</h2>${state.journal.map(entry => `<div class="log"><small>${entry.day}일</small>${escape(entry.text)}</div>`).join('') || '<p>아직 기록된 일이 없다.</p>'}`;
    if (tab === 'people') return `<h2>당신을 기억하는 사람들</h2><div class="cards">${people.map(([name, role, goal]) => `<article class="card"><h3>${name} · ${role}</h3><p>${goal}</p>${state.memories.filter(memory => memory.person === name).map(memory => `<div class="log"><small>${memory.day}일</small>${escape(memory.text)}</div>`).join('') || '<p>아직 함께 겪은 일이 없다.</p>'}</article>`).join('')}</div>`;
    if (tab === 'power') return `<h2>${state.election ? state.election.winner + '의 첫 임기' : '강 하구의 동장 선거'}</h2><p class="prose">20일에 선거가 열린다. 장마 이후 주민들의 생활과 당신의 활동이 표심을 바꾼다. 후보 등록비는 8크라운이다. 예상 지지 ${Campaign.electionResult(state).votes}%. 공사 자금 공개 여부와 어촌 보호 약속이 구역마다 다르게 작용한다.</p>${button('후보로 등록한다', 'run', '8크라운 · 행동 1', state.candidate || state.day >= 20 || state.cash < 8 || !state.actions)}${button('골목에서 주민을 만난다', 'campaign', '예상 지지 +7 · 기력 10 · 행동 1', !state.candidate || state.day >= 20 || !state.actions || state.energy < 10)}${state.election ? `${(state.election.districts || []).map(district => `<article class="card"><h3>${district.name}</h3><p>유권자 ${district.voters}가구 · ${state.candidate ? '당신의 득표 ' + district.share + '%' : '후보 등록 안 함'}</p></article>`).join('')}<p class="toast">${state.election.won ? '당신이 당선됐다.' : '소라가 당선됐다.'} ${state.candidate ? '당신의 득표율 ' + state.election.votes + '%' : '당신은 출마하지 않았다.'}</p>` : ''}`;
    if (state.hearing && state.hearing.day <= state.day) return hearingPanel();
    const locked = Boolean(state.built) || state.day >= 12;
    const plan = plans[preview];
    return `<div class="scene-head"><span class="eyebrow">첫 장 · 강 하구</span><span class="tag">행동 ${state.actions}회</span></div><h2>${state.flooded === null ? '다음 장마 전에' : '물이 빠진 자리'}</h2><p class="prose">${state.flooded === null ? '12일에 큰 비가 예보됐다. 평민인 당신은 수문공과 현장을 조사하고, 주민과 선주를 설득해 공동 공사를 제안할 수 있다.' : `장마로 ${state.flooded}가구가 침수됐다. 지도에 남은 집과 떠난 주민들은 다음 선거의 판도를 바꾼다.`}</p>
    ${!locked ? `<div class="choices">${button('수문공 윤과 현장을 조사한다', 'survey', '기력 10 · 행동 1 · 제방 비교 해제', state.surveyed || !state.actions || state.energy < 10)}${button('어촌에서 소라의 증언을 듣는다', 'testimony', '행동 1 · 주민 공동 출자 가능', state.testimony || !state.actions)}</div>` : ''}
    ${state.testimony && state.day < 12 && !state.promise ? button('주민 앞에서 어촌 보호를 약속한다', 'promise', '즉시 지지 +6 · 장마 뒤 이행을 검증한다 · 행동 1', !state.actions) : ''}
    ${state.promise ? `<p class="toast">어촌 보호 약속 · ${state.promise === 'pending' ? '장마 때 검증 예정' : state.promise === 'kept' ? '이행됨' : '위반됨'}</p>` : ''}
    ${state.built && !state.witness ? button('지안에게 계약 사본을 공개한다', 'witness', '민석과 지안이 증거를 확보한다 · 언덕 지지에 영향 · 행동 1', !state.actions) : ''}
    ${state.surveyed ? `<h3>${state.built ? '확정한 공사' : '지도에서 계획을 비교한다'}</h3><div class="plan-tabs">${Object.entries(plans).map(([id, item]) => `<button data-preview="${id}" aria-pressed="${preview === id}">${item.name}</button>`).join('')}</div><article class="card"><h3>${plan.name}</h3><p>${plan.description}</p><p>예상 공사비 ${plan.cost}크라운 · 보호 ${plan.homes}가구</p>${!locked ? preview === 'long' ? `${button('선주와 계약해 긴 제방을 짓는다', 'build', '내 돈 12 · 부두 사용료 20년 양도 · 행동 1', state.cash < 12 || !state.actions || state.energy < 10, 'data-plan="long" data-funding="merchant"')}${button('주민들과 공동 출자한다', 'build', '내 돈 30 · 소라의 증언 필요 · 행동 1', !state.testimony || state.cash < 30 || !state.actions || state.energy < 10, 'data-plan="long" data-funding="cooperative"')}` : button('이 계획을 확정한다', 'build', `${plan.cost}크라운 · 기력 10 · 행동 1`, state.cash < plan.cost || !state.actions || state.energy < 10, `data-plan="${preview}"`) : `<p>확정 ${plans[state.built || 'none'].name} · 자금 ${state.funding === 'merchant' ? '선주 계약' : state.funding === 'cooperative' ? '주민 공동 출자' : '직접 부담'}</p>`}</article>` : ''}
    ${state.election && state.day >= 21 && !state.policy ? `<h3>${state.election.won ? '동장으로서 첫 예산을 집행한다' : '새 동장에게 주민 청원을 낸다'}</h3>${button('임시 주택을 마련한다', 'policy', '떠난 주민 중 최대 8가구가 돌아온다 · 행동 1', !state.actions, 'data-policy="housing"')}${button('항만 계약의 공개 감사를 연다', 'policy', '지안의 증언을 기록한다 · 행동 1', !state.actions, 'data-policy="audit"')}` : ''}
    <h3>오늘의 생활</h3><div class="choices">${button('부두에서 일한다', 'work', `품삯 ${state.funding === 'merchant' && state.flooded !== null && !state.contractRelief ? 10 : 16}크라운 · 기력 15 · 행동 1`, !state.actions || state.energy < 15)}${button('하숙방에서 쉰다', 'rest', '기력 +30 · 행동 1', !state.actions)}</div>`;
  }
function cityArt(){let b='';let seed=41;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};for(let i=0;i<100;i++){let x=rand()*1000,y=100+rand()*200,w=18+rand()*34,h=25+rand()*75;b+=`<g opacity="${.35+y/600}"><path d="M${x} ${y}v${-h}l${w/2} -14 ${w/2} 14v${h}Z" fill="${['#263c44','#365059','#425960','#20343d'][i%4]}"/><path d="M${x} ${y-h}l${w/2} -14 ${w/2} 14Z" fill="#182c35"/><path d="M${x+6} ${y-h+12}h4v7h-4z M${x+w-10} ${y-h+12}h4v7h-4z" fill="${i%3?'#8c987f':'#e9bd72'}" opacity=".6"/></g>`}return `<svg viewBox="0 0 1000 410" preserveAspectRatio="xMidYMid slice" aria-label="소금 항구와 언덕 위 궁전의 도시 풍경" role="img"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#4b6268"/><stop offset="1" stop-color="#122b36"/></linearGradient><filter id="fog"><feGaussianBlur stdDeviation="13"/></filter></defs><path fill="url(#sky)" d="M0 0h1000v410H0z"/><circle cx="750" cy="65" r="29" fill="#acb6a3" opacity=".35"/><path d="M0 170L180 125 350 180 620 68 810 88 1000 145V410H0" fill="#263d45"/><path d="M0 310Q250 230 450 300T1000 270V410H0" fill="#152f3c"/>${b}<g fill="#1c3038" stroke="#6d8080" stroke-width="1"><path d="M672 130V60h18v-18h12v18h20v70zM730 130V37l12-24 12 24v93zM766 130V60h20v-18h12v18h18v70zM690 130V85h96v45z"/></g><path d="M0 345Q250 300 460 340T1000 320" fill="none" stroke="#7e9999" opacity=".3"/><g fill="#101f29"><path d="M50 345h130l-22 18H78zM112 340V247l40 85h-40M375 356h105l-18 15h-70zM420 350v-85l-30 72h30"/></g><path d="M0 200Q300 160 600 210T1000 170" fill="none" stroke="#a1b4b2" stroke-width="35" filter="url(#fog)" opacity=".18"/></svg>`}
  function eventDialog() {
    const event = state.eventQueue[0];
    if (!event) return '';
    return `<dialog id="event-dialog" class="event-dialog" aria-labelledby="event-title" aria-describedby="event-description"><img class="event-picture" src="/assets/events/${event.scene}.webp" alt="${escape(event.title)}"><div class="event-copy"><p class="eyebrow">${event.day}일 · ${event.id === 'storm' ? '첫 장마' : event.id === 'election' ? '선거 결과' : '공개 청문회'}</p><h2 id="event-title">${escape(event.title)}</h2><p id="event-description">${escape(event.text)}</p><blockquote>${escape(event.quote)}</blockquote><button class="endday" data-event-dismiss autofocus>${event.destination === 'power' ? '구역별 개표 결과 보기' : event.scene === 'hearing' ? '청문회에 참석한다' : '달라진 도시를 살펴본다'}</button></div></dialog>`;
  }
  function render() {
    const previousFocus = document.activeElement?.dataset?.action;
    const selected = state.built || preview;
    const safe = selected === 'long';
    const homes = Object.values(state.residents).reduce((a, b) => a + b, 0);
    document.querySelector('#app').innerHTML = `<header><div class="brand">CIVITAS<small>강 하구의 사람들</small></div><div class="clock"><strong>봄 ${state.day}일</strong>${state.day < 12 ? '장마까지 ' + (12 - state.day) + '일' : state.day < 20 ? '선거까지 ' + (20 - state.day) + '일' : '선거 이후의 삶'}</div></header><div class="layout"><aside><div class="identity"><div class="portrait">河</div><div><strong>${state.name}</strong><small>${careerNames[state.career]}</small></div></div><div class="stats">${[['소지금', state.cash + ' ₭'], ['기력', state.energy], ['주민', homes + '가구'], ['예상 지지', state.support + '%']].map(([key, value]) => `<div class="stat"><small>${key}</small><b>${value}</b></div>`).join('')}</div><nav class="nav">${[['city','도시'],['people','사람들'],['power','선거'],['journal','연대기']].map(([id, label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}</nav><div class="promise">생활비 하루 3크라운<br>집세 7일마다 12크라운<br>평소 시간은 직접 넘긴다.</div></aside><main><section class="world ${state.flooded > 0 ? 'flooded' : ''}">${cityArt()}<div class="world-title"><div class="eyebrow">벨라르 · 강 하구</div><h1>${state.flooded === null ? '물이 닿을 곳에 사람이 산다.' : '선택은 도시의 모양으로 남는다.'}</h1></div><div class="district-overlay"><span>항구 ${state.residents.harbor}가구</span><span class="${safe ? 'protected' : 'risk'}">어촌 ${state.residents.village}가구 · ${safe ? '보호 계획' : '침수 위험'}</span><span>언덕 ${state.residents.hill}가구</span></div><div class="levee ${selected}" aria-label="${plans[selected].name} 위치"></div></section><section class="scene">${state.notices.slice(0,2).map(notice => `<p class="muted">${escape(notice)}</p>`).join('')}${message ? `<div class="toast" role="status">${escape(message)}</div>` : ''}${content()}${tab === 'city' || tab === 'power' ? careerPanel() : ''}<button class="endday" data-action="advance" data-to="day" ${state.hearing && state.hearing.day <= state.day ? 'disabled' : ''}>하루를 마친다 · 생활비 3크라운</button><button class="choice" data-action="advance" data-to="event" ${state.hearing && state.hearing.day <= state.day ? 'disabled' : ''}><strong>${state.hearing ? state.hearing.day + '일 청문회' : state.day < 12 ? '첫 장마' : state.day < 20 ? '선거일' : state.day < 21 ? '선거 다음 날' : '다음 주'}까지 진행</strong><small>남은 행동을 쉬고 생활비와 집세를 정산한다</small></button><button class="reset" data-reset>${resetPending ? '다시 눌러 새 캠페인 시작' : '새 캠페인 시작'}</button></section></main><aside class="right"><div class="eyebrow">도시의 달력</div><h3>12일 · 첫 장마</h3><p class="muted">공사할 수 있는 마지막 날은 11일이다.</p><h3>20일 · 동장 선거</h3><p class="muted">등록은 19일까지. 출마하지 않아도 삶은 이어진다.</p><h3>21일 · 새 예산</h3><p class="muted">당선자는 집행하고, 주민은 청원한다.</p>${state.journal.slice(0,4).map(entry => `<div class="log"><small>${entry.day}일</small>${escape(entry.text)}</div>`).join('')}</aside></div>${eventDialog()}`;
    const dialog = document.querySelector('#event-dialog');
    if (dialog) {
      dialog.showModal();
      dialog.addEventListener('cancel', event => { event.preventDefault(); dismissEvent(); });
    } else if (previousFocus) {
      document.querySelector(`[data-action="${previousFocus}"]`)?.focus({ preventScroll: true });
    }
  }
  function dismissEvent() {
    const event = state.eventQueue[0];
    if (!event) return;
    tab = event.destination;
    state = apply(state, { type: 'acknowledge' }).state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { message = '사건 확인 상태를 저장하지 못했다.'; }
    render();
  }
  document.addEventListener('click', event => {
    const element = event.target.closest('button');
    if (!element || element.disabled) return;
    if (element.hasAttribute('data-event-dismiss')) { dismissEvent(); return; }
    if (element.hasAttribute('data-reset')) {
      if (resetPending) { state = fresh(); message = ''; resetPending = false; localStorage.setItem(KEY, JSON.stringify(state)); }
      else resetPending = true;
    } else if (element.dataset.tab) { tab = element.dataset.tab; message = ''; }
    else if (element.dataset.preview) preview = element.dataset.preview;
    else if (element.dataset.action) {
      const result = apply(state, { type: element.dataset.action, plan: element.dataset.plan, funding: element.dataset.funding, policy: element.dataset.policy, to: element.dataset.to, career: element.dataset.career, choice: element.dataset.choice, person: element.dataset.person });
      state = result.state;
      message = result.message;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { message += ' 저장 공간에 접근할 수 없어 이번 진행은 자동 저장되지 않았다.'; }
    }
    render();
  });
  render();
})();
