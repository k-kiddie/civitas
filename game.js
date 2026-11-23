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
  let editingProfile = false;
  const partyDraft={name:'',platform:'housing'};
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  function button(label, type, detail, disabled = false, extra = '') {
    return `<button class="choice" data-action="${type}" ${extra} ${disabled ? 'disabled' : ''}><strong>${label}</strong><small>${detail}</small></button>`;
  }
  const careerNames = { ...Object.fromEntries(Object.entries(Careers.jobs).map(([id,job])=>[id,job.name])), farmer:'농장 일꾼', clerk:'하급 서기', apprentice: '공장 견습', policeAide: '경찰 보조', worker: '항구 일용직', mayor: '동장', investigator: '항만 수사관', councillor: '주민 협의회 위원' };
  function careerTitle() { return Institutions.title(state) || careerNames[state.career]; }
  function careerPanel() {
    if (Institutions.active(state) || state.day < 21 || (state.hearing && state.hearing.day <= state.day)) return '';
    const tired = !state.actions;
    let html = `<article class="card"><h3>${careerTitle()}의 오늘</h3><p>도시 공금 ${state.treasury}크라운 · ${state.underReview ? '직무 심사 중 · 주급 정지' : '공직 주급 18크라운 / 7일'}</p>`;
    if (Object.hasOwn(Starts.occupations, state.career)) {
      html += `<p>계약 공개로 공직 추천을 받을 수 있다. 경찰 기록 공개는 민석의 추천, 토지 명부 공개는 지안의 추천으로 이어진다. 협의회 위원은 선출직 시의원과 별도 직책이다.</p>`;
      html += button('민석의 추천을 받아 수사관으로 일한다', 'join', '계약 공개 또는 경찰 기록 공개 필요 · 행동 1', tired || !(state.witness || state.policeRecommendation) || state.barredInvestigator, 'data-career="investigator"');
      html += button('지안의 추천을 받아 협의회 위원이 된다', 'join', '계약 또는 토지 명부 공개 필요 · 행동 1', tired || !(state.witness || state.councilRecommendation), 'data-career="councillor"');
    }
    if (state.career === 'investigator' && !state.underReview) {
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
    if (state.barredInvestigator) html += '<p>이전 직무 기록으로 수사관 재임용이 제한된다. 주민 협의회 참여는 가능하다.</p>';
    if (state.underReview) html += '<p class="toast">직무 심사가 진행 중이다. 사건창에서 답변하거나 예정된 청문회에서 소명하자.</p>';
    if (state.hearing) html += `<p class="toast">${state.hearing.day}일 청문회 예정. 시간을 넘기면 그날에 멈춘다.</p>`;
    if (state.bill && state.bill !== 'pending') html += `<p>재협상안 ${state.bill === 'passed' ? '통과' : '부결'} · ${state.contractRelief ? '품삯 공제 폐지' : '계약 유지'}</p>`;
    return html + '</article>';
  }
  function hearingPanel() {
    const hearing = state.hearing;
    const heard = hearing.heard || [];
    const strength = Campaign.hearingStrength(state);
    return `<article class="card"><div class="eyebrow">공개 청문회 · ${state.day}일</div><h2>${hearing.source === 'oversight' ? '당신의 직무를 심사한다' : '누구의 증언을 남길 것인가'}</h2>${hearing.source === 'oversight' ? '<p>통과하면 합의금 20크라운 환수 후 복직한다. 부결 또는 철회하면 해임된다.</p>' : ''}<p>청문회 중에는 시간이 멈춘다. 증언과 증거는 하루 행동을 소모하지 않는다. 설득력 ${strength}/4 · 4 이상이면 표결 통과.</p>${['윤','소라','민석','도윤'].map(person => button(person + '에게 질문한다', 'question', heard.includes(person) ? '증언 기록 완료 · 사람들 수첩에서 다시 확인' : '증언을 듣는다', heard.includes(person), `data-person="${person}"`)).join('')}${button('지안이 보관한 계약 사본을 공개한다', 'evidence', '설득력 +2 · 당신의 서명도 공개된다', !state.witness || hearing.evidence)}${button('표결을 요청한다', 'verdict', strength >= 4 ? '현재 증거로 통과 가능' : '현재 증거로는 부결 · 증언과 사본을 확인하자', false, 'data-choice="vote"')}${state.funding === 'merchant' && hearing.source !== 'oversight' ? button('도윤에게 공사비를 보전하고 합의한다', 'verdict', '개인 돈 12크라운 · 임금 공제 폐지', state.cash < 12 || !heard.includes('도윤'), 'data-choice="settle"') : ''}${button('안건을 철회한다', 'verdict', hearing.source === 'oversight' ? '소명 포기 · 수사관 해임' : '현재 계약 유지 · 청문회 종료', false, 'data-choice="withdraw"')}</article>`;
  }
  function reformPanel() {
    const agencies=Agencies.registry(state);
    const proposal=state.agencyProposal;
    const blocked=Agencies.reason(state);
    const options=Object.entries(agencies).filter(([,item])=>item.branch==='civil').map(([id,item])=>`<option value="${id}">${escape(item.name)} · 정원 ${item.staff}</option>`).join('');
    return `<details class="card"><summary>정부조직 현황과 개편 건의</summary><p>기관은 ${Object.keys(agencies).length}곳 · 재배치 대기 인력 ${state.unassignedOfficials}명. 개편은 정부 심사와 의회의 법·예산 승인 후 시행된다.</p>${Object.entries(agencies).map(([,item])=>`<p>${escape(item.name)} · 정원 ${item.staff}명</p>`).join('')}${proposal?`<p class="toast">${proposal.stage==='cabinet'?'국무회의 심사':'의회 법·예산 심사'} · ${proposal.due}일 결과 예정<br>${escape(proposal.sourceName)} 개편안 · 예정 예산 ${proposal.cost}</p>${button('건의를 철회한다','withdrawReform','기관·보직 유지 · 행동 1',!state.actions)}`:`<p>${blocked || '국장급 이상은 자기 기관의 개편을 건의할 수 있다. 건의에 기력 10과 행동 1이 필요하다.'}</p>${state.career==='defenseMinister'?`<label for="agency-source">건의 대상</label><select id="agency-source" class="network-input">${options}</select>`:''}<label for="agency-name">신설·분리할 기관 이름</label><input id="agency-name" class="network-input" placeholder="예: 재난대응청" maxlength="20">${button('새 기관 설치를 건의한다','createAgency','최종 승인 시 공적 예산 20 · 대기 인력 6명 배치',Boolean(blocked)||!state.actions||state.energy<10)}${button('현재 기관의 일부 분리를 건의한다','splitAgency','최종 승인 시 예산 10 · 정원을 절반씩 분리',Boolean(blocked)||!state.actions||state.energy<10)}<label for="agency-target">흡수 통합할 대상</label><select id="agency-target" class="network-input">${options}</select>${button('대상 기관으로 흡수를 건의한다','mergeAgency','최종 승인 시 예산 5 · 정원·소속 승계',Boolean(blocked)||!state.actions||state.energy<10)}${button('대상 기관 폐지를 건의한다','abolishAgency','최종 승인 시 예산 5 · 해당 보직 종료 · 정원 재배치 대기',Boolean(blocked)||!state.actions||state.energy<10)}`}${state.agencyHistory.slice(0,4).map(item=>`<p class="muted">${item.resolvedDay}일 · ${escape(item.sourceName)} · ${item.status==='enacted'?'시행':item.status==='withdrawn'?'철회':'부결'}</p>`).join('')}</details>`;
  }
  function institutionPanel() {
    const item=state.institution;
    const active=Institutions.active(state);
    const agency=Agencies.registry(state)[item.department];
    const busy=!state.actions || state.underReview || Boolean(state.hearing);
    const promotion=Institutions.promotionReason(state);
    let html=`<h3>행정기관과 군 경력</h3><details class="card"><summary>기관 채용·입대</summary>${Object.entries(Agencies.registry(state)).map(([id,org])=>button(org.name+' 지원','enlist',Careers.skills[org.skill]+' 훈련 필요 · 행동 1 · 신입 직급부터 시작',busy || state.career==='mayor' || state.career==='defenseMinister' || !(state.skills[org.skill]>=1) || (active && item.department===id),`data-department="${id}"`)).join('')}</details>`;
    if(!active)return html+(state.network ? `<article class="card"><h3>${escape(state.network.name)}</h3><p>이전 소속을 떠나도 모임과 구성원 ${state.network.members.length}명의 기록은 남는다. 기관에 다시 들어가면 인사 활동을 재개할 수 있다.</p></article>` : '');
    html+=`<article class="card"><h3>${careerTitle()}</h3><p>${agency.name} · 실적 ${item.merit} · 기관 예산 ${item.agencyBudget}<br>준비도 ${item.readiness} · 군수품 ${item.supplies} · 감사 주목도 ${item.scrutiny}</p>${button('오늘의 기관 업무','officialDuty','기력 12 · 실적 +4 · 하루 1회',busy || state.energy<12 || item.lastDuty===state.day)}${button('승진·임명을 신청한다','promote',promotion || '조건 충족 · 행동 1',busy || Boolean(promotion))}${button(agency.branch==='military'?'군수품 조달을 승인한다':'주민 지원을 승인한다','agencyOrder','직급 1 이상 · 기관 예산 12 · 행동 1',busy || item.rank<1 || item.agencyBudget<12)}${button('국방부장관 임명을 요청한다','minister','기관장·장군 · 지지 60 · 개인 조직 구성원 2명 · 행동 1',busy || item.rank<4 || state.support<60 || (state.network?.members.length||0)<2 || state.career==='defenseMinister')}${button('기관·보직에서 사임한다','leaveInstitution','현재 권한 상실 · 조직과 기록 유지 · 행동 1',busy)}</article>`;
    if(!state.network) {
      return html+`<article class="card"><h3>개인 조직을 만든다</h3><label for="network-name">모임 이름</label><input id="network-name" class="network-input" maxlength="24" value="동료 연구회"><label for="network-kind">조직 성격</label><select id="network-kind" class="network-input"><option value="public">공개 연구회</option><option value="secret">비공개 사조직 · 감사 주목도 +10</option></select>${button('모임을 결성한다','foundNetwork','개인 돈 10 · 행동 1',busy || state.cash<10)}</article>`;
    }
    html+=`<article class="card"><h3>${escape(state.network.name)}</h3><p>${state.network.kind==='secret'?'비공개 사조직':'공개 연구회'} · 구성원 ${state.network.members.length}명</p>${Object.entries(Institutions.colleagues).map(([id,person])=>{const member=state.network.members.find(value=>value.id===id);return `<section><h3>${person.name} · ${person.role}</h3><p>역량 ${person.competence}${member?' · 개인 충성 '+member.loyalty:''}</p>${member?`${button('역량 기준으로 인사를 추천한다','appointMember','직급 2 이상 · 준비도 +5 · 감사 주목도 −5 · 3일 간격',busy || item.rank<2 || state.day-item.lastAppointment<3,`data-person="${id}" data-choice="merit"`)}${button('측근 인사를 밀어붙인다','appointMember','개인 충성 +15 · 준비도 −4 · 감사 주목도 +20 · 3일 간격',busy || item.rank<2 || state.day-item.lastAppointment<3,`data-person="${id}" data-choice="loyalty"`)}`:button('동료를 영입한다','recruitMember','개인 비용 4 · 행동 1',busy || state.cash<4,`data-person="${id}"`)}</section>`}).join('')}</article>`;
    return html;
  }
  function underworldPanel() {
    const under=state.underworld;
    const role=Underworld.catalog[under.role];
    const blocked=state.underReview||Boolean(state.hearing)||state.age<18;
    const roleCard=role?`<article class="card"><h3>${role.name} · 병행 활동</h3><p>정식 직업 ${careerTitle()} 유지<br>수사 주목도 ${under.heat} · 사생활 노출 ${under.exposure} · 연락망 신뢰 ${under.trust}</p>${button('오늘의 비공개 활동','underworldWork',`수입 ${role.pay} · 기력 12 · ${role.crime?'수사 주목도':'사생활 노출'} +${role.risk} · 행동 1 · 하루 1회`,blocked||!state.actions||state.energy<12||under.lastWork===state.day||under.missions[under.role]!=='complete')}${button('이 활동을 중단한다','leaveUnderworld','정식 직업 유지 · 예정된 첫 의뢰 취소',blocked)}</article>`:'';
    return `<details class="card"><summary>또 다른 삶 · 비공개 연락망</summary><p>성인 인물의 병행 활동. 정식 직업을 유지하며 연락망을 탐색합니다. 소개받기 전에는 구체적인 직업이 드러나지 않습니다.</p>${roleCard}<p>만난 연락망 ${under.discovered.length} / ${Object.keys(Underworld.catalog).length}</p>${Object.entries(Underworld.circles).map(([id,circle])=>button(circle.name+'을 찾아간다','exploreUnderworld','기력 8 · 행동 1 · 하루 한 번 소개받기'+(id==='barracks'?' · 조사 훈련 필요':''),blocked||Boolean(under.role)||!state.actions||state.energy<8||under.lastExplore===state.day||(id==='barracks'&&!(state.skills.investigation>=1)),`data-circle="${id}"`)).join('')}<h3>알고 있는 연락망</h3>${under.discovered.map(id=>`<article class="card"><h3>${Underworld.catalog[id].name}</h3><p>${Underworld.catalog[id].hook}</p>${button('다시 조건을 듣는다','revisitUnderworld','행동 1 · 현재 활동이 없어야 함',blocked||!state.actions||Boolean(under.role),`data-role="${id}"`)}</article>`).join('')||'<p class="muted">아직 소개받은 일이 없습니다.</p>'}</details>`;
  }
  function jobsPanel() {
    const job=Careers.jobs[state.career];
    const listings=Object.entries(Careers.jobs).filter(([,item])=>!item.secret);
    return `${underworldPanel()}${reformPanel()}${institutionPanel()}<h2>일과 새로운 기회</h2><p class="prose">현재 ${careerTitle()}. 일자리를 옮겨도 인맥과 약속은 남는다. 이직은 행동 1회를 소모한다.</p>${job?.duty ? `<article class="card"><h3>${job.duty}</h3>${button('오늘의 직업 업무', 'careerDuty', `기력 12 · 비용 ${job.cost} · 지지 +${job.support} · 하루 1회`,!state.actions || state.energy<12 || state.cash<job.cost || state.careerDutyDay===state.day || state.underReview || (job.secret && !state.secretMissionDone))}</article>` : ''}${state.career==='mayor'?button('동장직에서 사임한다','resignOffice','주급과 예산 권한 상실 · 지지 −8 · 행동 1',!state.actions || Boolean(state.hearing)):''}<h3>구직 공고</h3><div class="cards">${listings.map(([id,item])=>{const reason=Careers.requirement(state,id);return `<article class="card"><span class="eyebrow">${item.group}</span><h3>${item.name}</h3><p>업무 수입 ${item.wage} · 기력 ${item.energy}<br>${item.skill?Careers.skills[item.skill]+' 훈련 필요':'기초 일자리'}</p>${button('지원한다','applyJob',reason || '조건 충족 · 행동 1',Boolean(reason)||!state.actions,`data-career="${id}"`)}</article>`}).join('')}</div><h3>직업 훈련</h3>${Object.entries(Careers.skills).map(([id,name])=>button(name+' 훈련','train',`현재 ${state.skills[id]||0}/1 · 비용 8 · 기력 10 · 행동 1`,!state.actions || state.cash<8 || state.energy<10 || (state.skills[id]||0)>=1,`data-skill="${id}"`)).join('')}<p class="muted">일부 인물은 당신이 한 일을 보고 비공개 만남을 제안할 수 있다.</p>`;
  }
  function councilGroupVote(group) {
    return `${escape(group.name)} ${group.seats}석 · 찬성 ${group.yesCount??(group.yes?group.seats:0)} / 반대 ${group.noCount??(group.yes?0:group.seats)}`;
  }
  function councillorVotes(vote,bill,blocked,active) {
    if(!vote.members)return '';
    return `<details class="card"><summary>의원별 판단 · ${vote.members.length}명</summary>${vote.members.map(member=>`<article class="councillor"><h4>${escape(member.name)} · ${member.yes?'찬성':'반대'}${member.defected?' · 당론 이탈':''}</h4><p>${Council.districtNames[member.district]} · 우선 ${Council.priorities[member.platform]}<br>자율성 ${member.independence} · 개인 관계 ${member.relationship}<br>${member.reason}</p>${bill.status==='draft'&&!member.yes?button('이 의원과 정책 면담을 한다','councilMeet','행동 1 · 기력 8 · 안건별 1회 · 대화로 제안 선택',blocked||!active||state.energy<8||(bill.contacts||[]).includes(member.id),`data-policy="${bill.policy}" data-member="${member.id}"`):''}</article>`).join('')}</details>`;
  }
  function politicianArchive() {
    const people=Council.people(state).sort((a,b)=>Number(b.status==='seated')-Number(a.status==='seated')||Council.terms(b)-Council.terms(a)||a.name.localeCompare(b.name));
    const statuses={seated:'현직',defeated:'낙선·원외',dormant:'소속 단체 원외'};
    const types={election:'선거',vote:'표결',meeting:'면담',delivery:'사업 이행',unfulfilled:'미이행 책임'};
    return `<details class="card"><summary>정치 인물 기록 · ${people.length}명</summary><p class="muted">낙선해도 인물과 관계는 사라지지 않습니다. 같은 교섭단체가 의석을 얻는 다음 선거에서 다시 경쟁합니다.</p>${people.map(person=>`<details class="card"><summary>${escape(person.name)} · ${statuses[person.status]||'정치 신인'} · 당선 ${Council.terms(person)}회</summary><p>${Council.districtNames[person.district]} · 우선 ${Council.priorities[person.platform]}<br>개인 관계 ${person.relationship} · 지역 평판 ${person.reputation??50}</p>${(person.terms||[]).map(term=>`<p>제${term.round}회 · ${term.day}일 · ${term.elected?'당선':term.reason?'원외':'낙선'}${term.rank?' · 명부 '+term.rank+'위':''}</p>`).join('')}<details><summary>활동 기록 · ${(person.career||[]).length}건</summary>${[...(person.career||[])].reverse().map(record=>`<p>${record.day}일 · 제${record.round}회 · ${types[record.type]||record.type}<br>${escape(record.text)}</p>`).join('')||'<p>이전 상세 활동은 저장되어 있지 않습니다.</p>'}</details></details>`).join('')}</details>`;
  }
  function councilContests(chamber) {
    if(!chamber.contests)return '';
    return `<details class="card"><summary>이번 의회 인선 결과</summary><p class="muted">교섭단체가 얻은 의석 안에서 지역 평판·의정 경력·현역 기반·노선과 이번 선거의 지역 반응으로 명부 순위를 정합니다. 개인 관계 수치로 당선을 직접 결정하지 않습니다.</p>${chamber.contests.map(contest=>`<details><summary>${escape(contest.name)} · ${contest.seats}석 · 경쟁 ${contest.candidates.length}명</summary>${contest.candidates.map(person=>`<p>${person.rank}위 ${escape(person.name)} · ${person.elected?'당선':'낙선'} · 평가 ${person.score}<br><span class="muted">${person.factors.map(([label,value])=>`${label} ${value>=0?'+':''}${value}`).join(' · ')}</span></p>`).join('')}</details>`).join('')}</details>`;
  }
  function councilPanel() {
    const chamber=Council.current(state);
    if(!chamber)return '<details class="card"><summary>의회</summary><p>다음 동장 선거부터 득표에 따라 지역 의회 11석을 선출합니다. 기존 저장의 임기는 종전 방식으로 진행할 수 있습니다.</p></details>';
    const blocked=!state.actions||state.underReview||Boolean(state.hearing)||!Pacts.canGovern(state);
    const policies=[...new Set(Pacts.governing(state).map(pact=>pact.policy))];
    const roster=Council.members(state);
    const tiles=roster.map(member=>`<span class="council-seat ${member.group===chamber.governmentGroup?'government':''}" title="${escape(member.name)}" aria-label="${escape(member.name)} 의원">${escape(Array.from(member.name).slice(-2).join(''))}</span>`).join('');
    const memberList=`<details class="card"><summary>의원 명부 · ${roster.length}명</summary>${roster.map(member=>`<p><strong>${escape(member.name)}</strong> · ${escape(chamber.groups.find(group=>group.id===member.group)?.name)}<br>${Council.districtNames[member.district]} · 우선 ${Council.priorities[member.platform]} · 자율성 ${member.independence} · 관계 ${member.relationship}<br>당선 ${Council.terms(member)}회 · 지역 평판 ${member.reputation??50}</p>`).join('')}</details>`;
    const pending=policies.filter(policy=>!Council.billFor(state,policy)).map(policy=>button(Pacts.projects[policy].name+' 예산안 제출','councilSubmit','행동 1 · 기본 공금 '+Pacts.projects[policy].cost+' · 제출 시 지출 없음',blocked,`data-policy="${policy}"`)).join('');
    const bills=state.council.bills.filter(bill=>bill.round===chamber.round).map(bill=>{
      const vote=bill.status==='draft'?Council.preview(state,bill):bill.ballots[bill.ballots.length-1]||Council.preview(state,bill);
      const active=policies.includes(bill.policy);
      const status={draft:'심의 중',passed:'가결 · 집행 가능',rejected:'부결',executed:'집행 완료'}[bill.status];
      const groups=vote.votes.map(group=>`<p>${councilGroupVote(group)}<br><span class="muted">${group.reason}</span>${bill.status==='draft'&&!Council.intent(state,bill,group).yes?button('교섭단체 지도부와 수정안을 협상한다','councilLobby','기력 10 · 행동 1 · 신뢰 30 · 집행 비용 +4 · 의원 이탈 가능',blocked||!active||state.energy<10,`data-policy="${bill.policy}" data-group="${group.id}"`):''}</p>`).join('');
      const amendments=bill.amendments.map(item=>`<p class="muted">${escape(item.name)} 합의: 주민 공청회·결과 보고 · 공금 +${item.cost??4} · 집행 시 지지 +1</p>`).join('');
      const controls=bill.status==='draft'?button('예산안을 표결에 부친다','councilVote','행동 1 · 의원 찬성 6명 이상 가결 · 부결 시 다음 날 수정 재상정',blocked||!active,`data-policy="${bill.policy}"`):bill.status==='rejected'?button('예산안을 수정 재상정한다','councilRevise','부결 다음 날부터 · 행동 1 · 기존 합의 유지',blocked||!active||state.day<=bill.lastVoteDay,`data-policy="${bill.policy}"`):'';
      const history=bill.ballots.map(ballot=>`<details><summary>${ballot.day}일 표결 · 찬성 ${ballot.yes} / 반대 ${ballot.no} · ${ballot.status==='passed'?'가결':'부결'}</summary>${ballot.votes.map(group=>`<p>${councilGroupVote(group)} · ${group.reason}</p>`).join('')}${ballot.members?ballot.members.map(member=>`<p>${escape(member.name)} · ${member.yes?'찬성':'반대'}${member.defected?' · 당론 이탈':''} · ${member.reason}</p>`).join(''):''}</details>`).join('');
      const meetings=(bill.meetings||[]).map(meeting=>`<p class="muted">${meeting.day}일 ${escape(meeting.name)} 면담 · ${meeting.reason}</p>`).join('');
      return `<article class="card"><span class="eyebrow">${status}</span><h3>${escape(bill.name)}</h3><p>총 집행 예산 ${Council.cost(state,bill.policy,bill.baseCost)} · 수정 조항 ${bill.amendments.length}개<br>${bill.status==='draft'?'현재 예상':'마지막 표결'} 찬성 ${vote.yes} / 반대 ${vote.no} · 과반 ${chamber.majority}명</p>${amendments}${groups}${councillorVotes(vote,bill,blocked,active)}${meetings}${controls}${history}</article>`;
    }).join('');
    return `<details class="card"><summary>의회 · ${chamber.size}석 · 과반 ${chamber.majority}석</summary><p>제${chamber.round}회 선거 득표를 합산한 비례 의석입니다. 의원들이 당론·지역 사정·개인 정책과 관계를 보고 각각 한 표를 행사합니다.</p><div class="council-seats">${tiles}</div>${chamber.groups.map(group=>`<p>${escape(group.name)} · ${group.seats}석 · ${group.votes.toFixed(1)}%</p>`).join('')}${memberList}${politicianArchive()}${councilContests(chamber)}<p class="muted">협약 사업은 의회 승인 후 집행합니다. 지도부와 합의해도 소속 의원이 이탈할 수 있습니다. 의원별 판단에서 이유를 확인하고 개별 면담을 할 수 있습니다. 부결되어도 협약 기한은 연장되지 않습니다.</p>${pending}${bills||'<p>심의한 협약 예산안이 없습니다.</p>'}</details>`;
  }
  function pactPanel() {
    const statuses={signed:'선거 전 서명',governing:'집행 대기',fulfilled:'이행 완료',broken:'파기',expired:'당선 조건 미충족',annulled:'상대 정당 소멸'};
    const blocked=!state.actions||state.underReview||Boolean(state.hearing);
    const own=state.parties.registry[state.parties.membership];
    const eligible=own?.leader==='player'&&state.candidate&&own.nomination?.round===state.politics.round&&own.nomination.id==='player';
    const negotiations=Object.entries(state.parties.registry).filter(([id])=>id!==state.parties.membership).map(([id,party])=>{
      const project=Pacts.projects[party.platform];
      return `<article class="card"><h3>${escape(party.name)}</h3><p>상대 당 신뢰 ${Pacts.trust(state,id)}/100<br>요구 정책: ${project.name} · 공금 ${project.cost}<br>${project.detail}</p>${button('정책 협약을 협상한다','pactOffer','행동 1 · 기반 40 · 신뢰 30 · 회차당 상대별 1회',blocked||!eligible||state.parties.standing<40||Pacts.trust(state,id)<30||Pacts.offered(state,id),`data-party="${id}"`)}${button('공개 정책 간담회를 연다','pactRepair','당 자금 4 · 기력 10 · 신뢰 +10 · 회차당 1회',blocked||own?.leader!=='player'||(own?.funds||0)<4||state.energy<10||Pacts.met(state,id),`data-party="${id}"`)}</article>`;
    }).join('');
    const records=state.pacts.agreements.slice(0,12).map(pact=>{
      const project=Pacts.projects[pact.policy];
      const budget=Council.cost(state,pact.policy,project.cost);
      return `<article class="card"><span class="eyebrow">제${pact.round}회 선거 · ${statuses[pact.status]}</span><h3>${escape(pact.partyName)} × ${escape(pact.targetName)}</h3><p>${project.name} · 공금 ${project.cost}<br>${project.detail}${pact.dueDay?`<br>집행 기한 ${pact.dueDay}일 · 오늘 ${state.day}일`:''}</p>${pact.status==='governing'?`${button('협약 사업을 집행한다','pactDeliver','공금 '+budget+' · 행동 1 · 의회 승인 필요 · 같은 정책의 협약은 함께 이행',blocked||!Pacts.canGovern(state)||state.treasury<budget||!Council.authorized(state,pact.policy),`data-policy="${pact.policy}"`)}${button('이 협약을 공개 철회한다','pactBreak','지지 −8 · 소속 당 기반 −10 · 상대 신뢰 −25 · 행동 1',blocked,`data-pact="${pact.id}"`)}`:''}${pact.outcome?`<p class="muted">${escape(pact.outcome)}</p>`:''}</article>`;
    }).join('');
    return `<details class="card"><summary>정책 협약 · 집행 대기 ${Pacts.governing(state).length}건</summary><p>선거 지원을 받는 대신 당선 후 첫 주의 공적 사업을 약속합니다. 공천을 받은 당대표 후보가 협상할 수 있습니다. 후보들은 출마를 유지합니다.</p><p class="muted">이행하면 상대 신뢰 +15. 기한 초과·동장직 사임·협약 정당 탈퇴 시 파기 불이익이 생깁니다. 같은 정책을 여러 당과 약속해도 공금은 한 사업에 한 번만 씁니다.</p>${records||'<p>서명한 협약이 없습니다.</p>'}<h3>정당별 요구와 관계</h3>${negotiations}</details>`;
  }
  function partyBallots() {
    return (state.parties.ballots||[]).slice(0,6).map(result=>`<details class="card"><summary>${escape(result.partyName)} · ${result.kind==='leadership'?'당대표':'공천'} 경선 · ${result.day}일</summary><p>${Object.entries(result.totals).map(([id,count])=>`${escape(result.candidates[id].name)} ${count}표`).join(' · ')}<br>선출: ${escape(result.candidates[result.winner].name)}${result.tied?' · 동률 규칙 적용':''}</p><p class="muted">주요 당원과 지역 대표 각 1표 · 최다 득표로 선출 · 동률은 현 대표, 후보 명부 순</p>${result.votes.map(vote=>`<p><strong>${escape(vote.name)}</strong> → ${escape(result.candidates[vote.choice].name)}<br><span class="muted">${vote.reasons.map(escape).join(' · ')}</span></p>`).join('')}</details>`).join('');
  }
  function partyPanel() {
    const data=state.parties;const own=data.registry[data.membership];
    const blocked=!state.actions||state.underReview||Boolean(state.hearing);
    const field=Politics.pool(state);
    const founders=!state.network?`<h3>창당 준비 모임</h3><label for="network-name">공개 모임 이름</label><input id="network-name" class="network-input" placeholder="발기 모임 이름">${button('공개 발기 모임을 만든다','foundNetwork','개인 돈 10 · 행동 1 · 일반 시민도 가능',blocked||state.cash<10)}`:`<h3>${escape(state.network.name)} · 발기 모임</h3>${Object.entries(Institutions.colleagues).filter(([id])=>!state.network.members.some(member=>member.id===id)).map(([id,person])=>button(person.name+'에게 모임 참여를 요청한다','recruitMember',person.role+' · 개인 비용 4 · 행동 1',blocked||state.cash<4,`data-person="${id}"`)).join('')}<p class="muted">선택한 노선에 동의하거나 개인 충성이 충분한 동료만 창당에 참여한다.</p>`;
    const createFields=`<label for="party-name">새 정당 이름</label><input id="party-name" class="network-input" maxlength="24" value="${escape(partyDraft.name)}" placeholder="직접 당명을 입력하세요"><label for="party-platform">핵심 노선</label><select id="party-platform" class="network-input">${Object.entries(Parties.positions).map(([id,label])=>`<option value="${id}" ${partyDraft.platform===id?'selected':''}>${label}</option>`).join('')}</select><p class="muted">창당·분당에는 지지 30, 개인 돈 20, 공약 또는 충성으로 동의하는 조직원 2명이 필요하다. 분당에는 당내 기반 40도 필요하다.</p>`;
    return `<details class="card"><summary>정당과 공천 · ${Object.keys(data.registry).length}개 정당</summary>${own?`<h3>${escape(own.name)}</h3><p>당내 기반 ${data.standing} · 당 재정 ${own.funds} · 주요 당원 ${Object.keys(own.members).length}명<br>대표 ${own.leader==='player'?escape(state.name):escape(own.members[own.leader]?.name||own.leader||'공석')}</p>${button('지역 당원 모임을 연다','partyOrganize','기력 10 · 기반 +6 · 당 후원금 +2 · 하루 1회',blocked||state.energy<10||data.lastActivity===state.day)}${button('공천 경선에 출마한다','partyNominate','당원·지역 대표가 투표 · 후보 등록 · 회차당 1회',blocked||!state.candidate||own.nomination?.round===state.politics.round||Parties.contested(state,data.membership,'nomination'))}${button('당대표 경선에 도전한다','partyLeadership','기반 40부터 도전 · 당원·지역 대표 투표 · 회차당 1회',blocked||data.standing<40||own.leader==='player'||Parties.contested(state,data.membership,'leadership'))}${button('탈당한다','partyLeave','당 지원 상실 · 개인 후보 등록 유지',blocked||own.leader==='player')}`:'<p>정당에 가입하거나 동료들과 새 당을 창설할 수 있다. 개인 조직과 정당은 별도로 운영된다.</p>'}<div class="cards">${Object.entries(data.registry).map(([id,party])=>`<article class="card"><h3>${escape(party.name)}</h3><p>${Parties.positions[party.platform]} · 재정 ${party.funds}<br>이번 회차 지원 후보 ${escape(field[Parties.nominee(state,id,field)]?.name||(Parties.nominee(state,id,field)==='player'?state.name:'미정'))}</p>${!own?button('가입한다','partyJoin','가입비 4 · 당 재정으로 납부 · 행동 1',blocked||state.cash<4,`data-party="${id}"`):id!==data.membership&&own.leader==='player'?`${button('선거 연대를 제안한다','partyAlliance','동일 노선 기반 40 · 다른 노선 기반 60',blocked,`data-party="${id}"`)}${button('상대 당으로 합당한다','partyMerge','동일 노선 · 기반 60 · 대표직 이양 · 당원·자금 이전',blocked||party.platform!==own.platform||data.standing<60,`data-party="${id}"`)}`:''}</article>`).join('')}</div>${partyBallots()}${founders}${createFields}${button(own?'분당해 새 당을 창설한다':'새 정당을 창당한다',own?'partySplit':'partyFound','발기인 동의와 자금 필요 · 행동 1',blocked||state.cash<20||state.support<30)}${own?.leader==='player'?button('현재 정당을 해산한다','partyDissolve','당원·자금 정산 · 잔여 자금은 공적 금고로 이전',blocked):''}${data.history.slice(0,4).map(item=>`<p class="muted">${item.day}일 · ${escape(item.text)}</p>`).join('')}</details>`;
  }
  function politicsPanel() {
    const field=Politics.pool(state);
    const preview=Campaign.electionResult(state);
    const election=state.election;
    return `${councilPanel()}${pactPanel()}${partyPanel()}<h2>${state.politics.nextDay}일 · 제${state.politics.round}회 동장 선거</h2><p class="prose">임기는 ${state.life.clock.mode==='lifetime'?'4년':'28일(기존 진행 방식)' }. 현재 NPC 후보 ${Object.keys(field).length}명이 각자의 공약으로 경쟁한다. 도시 상황과 경력에 따라 새 후보가 출마한다. 후보 등록비는 8크라운이며, 최다 득표자가 당선된다.</p>${button('이번 선거에 후보 등록한다','run','개인 돈 8 · 행동 1',state.candidate||state.cash<8||!state.actions)}${button('골목에서 주민을 만난다','campaign','주민 지지 +7 · 기력 10 · 행동 1',!state.candidate||!state.actions||state.energy<10)}<div class="cards">${Object.entries(field).sort((a,b)=>preview.totals[b[0]]-preview.totals[a[0]]).map(([id,npc])=>`<article class="card"><h3>${escape(npc.name)}</h3><p>${escape(Parties.ballotLabel(state,id,field))} · ${escape(npc.occupation||'지역 활동가')} · ${escape(npc.pledge)}<br>예상 득표 ${preview.totals[id].toFixed(1)}%</p></article>`).join('')}</div>${state.candidate?`<article class="card"><h3>${escape(state.name)} · 예상 ${preview.votes}%</h3><p>핵심 공약 ${Politics.platforms[state.politics.platform]}</p>${Object.entries(Politics.platforms).map(([id,label])=>button(label+' 공약','choosePlatform','행동 1 · 구역별 표심과 구성원 판단에 반영',!state.actions||state.politics.platform===id,`data-platform="${id}"`)).join('')}</article>`:''}${state.network?`<h3>조직 구성원의 선택</h3>${state.network.members.map(member=>`<article class="card"><h3>${Institutions.colleagues[member.id]?.name||member.id}</h3><p>개인 충성 ${member.loyalty} · 지지 ${state.politics.endorsements[member.id]==='player'?escape(state.name):field[state.politics.endorsements[member.id]]?.name||'아직 표명하지 않음'}</p>${button('이번 선거의 지지를 요청한다','seekEndorsement','행동 1 · 한 선거에 한 번 · 수락은 관계와 공약에 따라 판단',!state.candidate||!state.actions||state.politics.requested.includes(member.id),`data-person="${member.id}"`)}</article>`).join('')}`:''}${election?`<h3>최근 선거 · ${election.day||20}일</h3><p class="toast">${escape(election.winner)} 당선 · ${election.ran?'당신의 득표 '+election.votes+'%':'당신은 출마하지 않았다.'}</p>${election.districts.map(district=>`<article class="card"><h3>${district.name}</h3><p>${district.shares?Object.entries(district.shares).filter(([id])=>id!=='player'||election.ran).map(([id,share])=>`${id==='player'?escape(election.playerName||state.name):escape(election.candidates?.[id]?.name||field[id]?.name||id)} ${share.toFixed(1)}%`).join(' · '):'당신의 득표 '+district.share+'%'}</p></article>`).join('')}`:''}`;
  }
  function firstPolicy(policy,label,detail) {
    const projectId=policy==='audit'?'transparency':policy;
    const promised=Pacts.canGovern(state)&&Pacts.governing(state).some(pact=>pact.policy===projectId);
    const project=Pacts.projects[projectId];
    return button(label,'policy',promised?`협약 이행 · 공금 ${Council.cost(state,projectId,project.cost)} · 의회 승인 필요 · 행동 1`:detail,!state.actions||Pacts.hasProject(state,projectId)||(promised&&(state.treasury<Council.cost(state,projectId,project.cost)||!Council.authorized(state,projectId))),`data-policy="${policy}"`);
  }
  function lifeTimePanel() {
    const clock=state.life.clock,plan=clock.plan;
    const blocked=state.day<28||Boolean(state.eventQueue.length)||Boolean(state.hearing)||state.underReview||Pacts.governing(state).length>0;
    return `<details class="card"><summary>생활 기간 보내기${plan?' · 남은 '+Math.max(0,plan.target-state.day)+'일':''}</summary><p>달력은 1년 365일입니다. 평소 생활을 묶어 진행하다가 직접 선택할 사건·심사·선거운동 기간에 멈춥니다. 일상 소식은 사람들의 생애 기록에서 확인합니다.</p><p class="muted">근무 생활: 주 3회 현재 직업의 일반 근무, 생활비·집세·주급 정산. 피로할 때 휴식합니다. 정치·사조직·음지 활동의 선택은 대신하지 않습니다. 회복 생활은 근무 수입 없이 휴식합니다. 선택형 일상 사건은 장기 생활에서 90일 이상 간격으로 등장합니다.</p>${clock.mode!=='lifetime'?'<p class="muted">기존 저장에서 처음 사용하면 다음 선거부터 4년 임기로 전환합니다. 등록한 출마와 선거 협약이 있으면 먼저 마쳐야 합니다.</p>':''}${plan?`<p>목표 ${Life.calendar(plan.target)} · ${plan.routine==='work'?'근무':'회복'} 생활</p>${button('남은 생활 기간을 이어간다','lifeContinue','사건 처리 후 재개 · 공금 집행과 정치 선택은 자동으로 하지 않음',Boolean(blocked))}${button('남은 계획을 종료한다','lifeCancel','이미 지난 시간과 결과는 유지')}`:`${button('한 달 근무하며 살기','lifePass','30일 · 일반 근무와 생활 정산',Boolean(blocked),'data-days="30" data-routine="work"')}${button('석 달 근무하며 살기','lifePass','90일 · 중요한 사건에서 멈춤',Boolean(blocked),'data-days="90" data-routine="work"')}${button('1년 근무하며 살기','lifePass','365일 · 중요한 사건에서 멈춤',Boolean(blocked),'data-days="365" data-routine="work"')}${button('한 달 회복 생활하기','lifePass','30일 · 근무 수입 없이 휴식 · 생활비 필요',Boolean(blocked),'data-days="30" data-routine="rest"')}`}${state.day<28?'<p class="muted">첫 지역 사건 이후 28일부터 사용할 수 있습니다.</p>':''}</details>`;
  }
  function lifeHistory(person) {
    const types={observed:'관찰 시작',career:'경력',work:'근무',training:'훈련',finance:'개인 재정',living:'생활',age:'나이',profile:'인물 설정',health:'건강',relationship:'관계'};
    return `<details class="card"><summary>생애 기록 · ${person.history.length}건</summary>${[...person.history].reverse().map(item=>`<p>${item.day}일 · ${types[item.type]||item.type}<br>${escape(item.text)}</p>`).join('')||'<p>아직 기록된 변화가 없습니다.</p>'}</details>`;
  }
  function lifePanel() {
    const player=state.life.people.player;
    const blocked=!state.actions||Boolean(state.hearing)||state.underReview;
    const groups=[['resident','함께 살아가는 주민'],['story','이야기에서 만난 사람들'],['council','정치 경력과 연결된 인물']];
    const residents=groups.map(([source,title])=>{
      const population=Object.values(state.life.people).filter(person=>person.source===source);
      if(!population.length)return '';
      return `<details class="card"><summary>${title} · ${population.length}명</summary>${population.map(person=>`<details class="card"><summary>${escape(person.name)} · ${escape(person.jobTitle)}</summary><p>${person.age??'미설정'}세 · 건강 ${person.health} · 개인 돈 ${person.wealth}<br>개인 관계 ${person.relationship} · 현재 경력 ${state.day-person.since}일${person.rank?' · 실무 '+person.rank+'단계':''}${person.goalText?'<br>'+escape(person.goalText):person.goal&&person.goal!==person.occupation?'<br>관심 경로: '+escape(Life.jobs[person.goal]||person.goal):''}${person.source==='story'?'<br>직업 변화는 해당 이야기에서 진행됩니다.':''}${person.politics?'<br>정치 경력은 기존 의원 기록과 연결됩니다.':''}</p>${button('안부를 나눈다','lifeVisit','행동 1 · 기력 5 · 관계 +6 · 하루 한 번 · 표결 찬성 약속 없음',blocked||state.energy<5||person.visitDay===state.day,`data-person="${person.id}"`)}${person.source==='resident'&&person.occupation==='unemployed'?button('구직을 도와준다','lifeRefer','개인 돈 4 · 기력 5 · 관계 55 · 건강 35 · 다음 날 취업',blocked||state.cash<4||state.energy<5||person.relationship<55||person.health<35||Boolean(person.jobOffer),`data-person="${person.id}"`):''}${state.memories.filter(memory=>memory.person===person.name).map(memory=>`<p class="muted">${memory.day}일 · ${escape(memory.text)}</p>`).join('')}${lifeHistory(person)}</details>`).join('')}</details>`;
    }).join('');
    return `<h2>살아가는 사람들</h2><article class="card"><span class="eyebrow">나의 생애</span><h3>${escape(player.name)} · ${player.age??'나이 미설정'}${player.age==null?'':'세'}</h3><p>${escape(player.jobTitle)} · 건강 ${player.health}/100<br>개인 돈 ${player.wealth} · 공금과 당 자금은 별도<br>병행 활동 ${escape(Underworld.catalog[state.underworld.role]?.name||"없음")}<br>직업이 바뀌어도 경력과 관계는 이어집니다.</p>${button('건강을 돌본다','lifeCare','개인 돈 6 · 행동 1 · 건강 +12 · 기력 +10 · 하루 한 번',blocked||state.cash<6||player.careDay===state.day)}${lifeHistory(player)}</article><details class="card"><summary>이웃들의 최근 소식 · ${state.life.news.length}건</summary>${state.life.news.slice(0,20).map(item=>`<p>${item.day}일 · ${escape(item.text)}</p>`).join('')||'<p>시간이 흐르면 구직·전직·전역·은퇴 소식이 이곳에 남습니다.</p>'}</details>${residents}`;
  }
  function content() {
    if(tab==='jobs')return jobsPanel();
    if (tab === 'journal') return `<h2>도시가 기억하는 일</h2>${state.journal.map(entry => `<div class="log"><small>${entry.day}일</small>${escape(entry.text)}</div>`).join('') || '<p>아직 기록된 일이 없다.</p>'}`;
    if (tab === 'people') return lifePanel();
    if (tab === 'power') return politicsPanel();
    if (state.hearing && state.hearing.day <= state.day) return hearingPanel();
    const job = Institutions.job(state) || Careers.jobs[state.career] || Starts.occupations.worker;
    const toll = state.career === 'worker' && state.funding === 'merchant' && state.flooded !== null && !state.contractRelief;
    const locked = Boolean(state.built) || state.day >= 12;
    const plan = plans[preview];
    return `<div class="scene-head"><span class="eyebrow">첫 장 · 강 하구</span><span class="tag">행동 ${state.actions}회</span></div><h2>${state.flooded === null ? '다음 장마 전에' : '물이 빠진 자리'}</h2><p class="prose">${state.flooded === null ? '12일에 큰 비가 예보됐다. 평민인 당신은 수문공과 현장을 조사하고, 주민과 선주를 설득해 공동 공사를 제안할 수 있다.' : `장마로 ${state.flooded}가구가 침수됐다. 지도에 남은 집과 떠난 주민들은 다음 선거의 판도를 바꾼다.`}</p>
    ${!locked ? `<div class="choices">${button('수문공 윤과 현장을 조사한다', 'survey', '기력 10 · 행동 1 · 제방 비교 해제', state.surveyed || !state.actions || state.energy < 10)}${button('어촌에서 소라의 증언을 듣는다', 'testimony', '행동 1 · 주민 공동 출자 가능', state.testimony || !state.actions)}</div>` : ''}
    ${state.testimony && state.day < 12 && !state.promise ? button('주민 앞에서 어촌 보호를 약속한다', 'promise', '즉시 지지 +6 · 장마 뒤 이행을 검증한다 · 행동 1', !state.actions) : ''}
    ${state.promise ? `<p class="toast">어촌 보호 약속 · ${state.promise === 'pending' ? '장마 때 검증 예정' : state.promise === 'kept' ? '이행됨' : '위반됨'}</p>` : ''}
    ${state.built && !state.witness ? button('지안에게 계약 사본을 공개한다', 'witness', '민석과 지안이 증거를 확보한다 · 언덕 지지에 영향 · 행동 1', !state.actions) : ''}
    ${state.surveyed ? `<h3>${state.built ? '확정한 공사' : '지도에서 계획을 비교한다'}</h3><div class="plan-tabs">${Object.entries(plans).map(([id, item]) => `<button data-preview="${id}" aria-pressed="${preview === id}">${item.name}</button>`).join('')}</div><article class="card"><h3>${plan.name}</h3><p>${plan.description}</p><p>예상 공사비 ${plan.cost}크라운 · 보호 ${plan.homes}가구</p>${!locked ? preview === 'long' ? `${button('선주와 계약해 긴 제방을 짓는다', 'build', '내 돈 12 · 부두 사용료 20년 양도 · 행동 1', state.cash < 12 || !state.actions || state.energy < 10, 'data-plan="long" data-funding="merchant"')}${button('주민들과 공동 출자한다', 'build', '내 돈 30 · 소라의 증언 필요 · 행동 1', !state.testimony || state.cash < 30 || !state.actions || state.energy < 10, 'data-plan="long" data-funding="cooperative"')}` : button('이 계획을 확정한다', 'build', `${plan.cost}크라운 · 기력 10 · 행동 1`, state.cash < plan.cost || !state.actions || state.energy < 10, `data-plan="${preview}"`) : `<p>확정 ${plans[state.built || 'none'].name} · 자금 ${state.funding === 'merchant' ? '선주 계약' : state.funding === 'cooperative' ? '주민 공동 출자' : '직접 부담'}</p>`}</article>` : ''}
    ${state.election && state.day >= (state.election.day ?? 20)+1 && !state.policy ? `<h3>${state.career==='mayor' ? '동장으로서 첫 예산을 집행한다' : '새 동장에게 주민 청원을 낸다'}</h3>${firstPolicy('housing','임시 주택을 마련한다','떠난 주민 중 최대 8가구가 돌아온다 · 행동 1')}${firstPolicy('audit','항만 계약의 공개 감사를 연다','지안의 증언을 기록한다 · 행동 1')}` : ''}
    <h3>오늘의 생활</h3><div class="choices">${button(job.name + ' 업무를 한다', 'work', `품삯 ${(toll ? 10 : job.wage) + (state.career === state.startingOccupation ? state.jobStory.wageBonus : 0)}크라운 · 기력 ${job.energy} · 행동 1`, !state.actions || state.energy < job.energy)}${button('하숙방에서 쉰다', 'rest', '기력 +30 · 행동 1', !state.actions)}</div>`;
  }
function cityArt(){let b='';let seed=41;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};for(let i=0;i<100;i++){let x=rand()*1000,y=100+rand()*200,w=18+rand()*34,h=25+rand()*75;b+=`<g opacity="${.35+y/600}"><path d="M${x} ${y}v${-h}l${w/2} -14 ${w/2} 14v${h}Z" fill="${['#263c44','#365059','#425960','#20343d'][i%4]}"/><path d="M${x} ${y-h}l${w/2} -14 ${w/2} 14Z" fill="#182c35"/><path d="M${x+6} ${y-h+12}h4v7h-4z M${x+w-10} ${y-h+12}h4v7h-4z" fill="${i%3?'#8c987f':'#e9bd72'}" opacity=".6"/></g>`}return `<svg viewBox="0 0 1000 410" preserveAspectRatio="xMidYMid slice" aria-label="소금 항구와 언덕 위 궁전의 도시 풍경" role="img"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#4b6268"/><stop offset="1" stop-color="#122b36"/></linearGradient><filter id="fog"><feGaussianBlur stdDeviation="13"/></filter></defs><path fill="url(#sky)" d="M0 0h1000v410H0z"/><circle cx="750" cy="65" r="29" fill="#acb6a3" opacity=".35"/><path d="M0 170L180 125 350 180 620 68 810 88 1000 145V410H0" fill="#263d45"/><path d="M0 310Q250 230 450 300T1000 270V410H0" fill="#152f3c"/>${b}<g fill="#1c3038" stroke="#6d8080" stroke-width="1"><path d="M672 130V60h18v-18h12v18h20v70zM730 130V37l12-24 12 24v93zM766 130V60h20v-18h12v18h18v70zM690 130V85h96v45z"/></g><path d="M0 345Q250 300 460 340T1000 320" fill="none" stroke="#7e9999" opacity=".3"/><g fill="#101f29"><path d="M50 345h130l-22 18H78zM112 340V247l40 85h-40M375 356h105l-18 15h-70zM420 350v-85l-30 72h30"/></g><path d="M0 200Q300 160 600 210T1000 170" fill="none" stroke="#a1b4b2" stroke-width="35" filter="url(#fog)" opacity=".18"/></svg>`}
  const genderNames = { male: '남성', female: '여성', unspecified: '미지정' };
  function profileDialog() {
    const starting = !state.startConfigured;
    const backgrounds = Object.entries(Starts.backgrounds).map(([id, item]) => `<option value="${id}">${item.name} · ${item.detail}</option>`).join('');
    const jobs = Object.entries(Starts.occupations).map(([id, job]) => `<label class="occupation-card"><input type="radio" name="occupation" value="${id}" ${id === 'worker' ? 'checked' : ''}><span><strong>${job.name}</strong><small>품삯 ${job.wage} · 기력 ${job.energy} · 첫 인맥 ${job.person}</small><em>${job.title}</em></span></label>`).join('');
    const setup = starting ? `<label for="background">출신 배경</label><select id="background" name="background">${backgrounds}<option value="random">무작위 출신</option></select><fieldset class="occupation-list"><legend>첫 직업</legend>${jobs}<label class="occupation-card"><input type="radio" name="occupation" value="random"><span><strong>무작위 직업</strong><small>다섯 직업 중 하나로 시작</small></span></label></fieldset><p class="muted">벨라르 공화국 · 산업화 시대. 출신과 직업은 시작 조건이며, 이후 다른 길로 옮길 수 있습니다.</p>` : `<p class="muted">출신 ${Starts.backgrounds[state.background]?.name || '노동자 집안'} · 첫 직업 ${Starts.occupations[state.startingOccupation]?.name || '항구 노동자'}</p>`;
    return `<dialog id="profile-dialog" class="profile-dialog" aria-labelledby="profile-title"><form id="profile-form"><p class="eyebrow">CIVITAS</p><h2 id="profile-title">${starting ? '어떤 삶을 시작할까요?' : '인물 설정'}</h2><label for="player-age">시작 나이</label><input id="player-age" class="network-input" name="age" type="number" inputmode="numeric" min="18" max="100" step="1" value="${state.age ?? ''}" placeholder="나이를 직접 입력하세요" required><p class="muted">현재 지원 범위 18~100세. 나이도 직접 설정합니다.</p><label for="player-name">이름</label><input id="player-name" name="playerName" value="${escape(state.name)}" maxlength="18" required autocomplete="off" autofocus><fieldset><legend>성별</legend>${Object.entries(genderNames).map(([value,label]) => `<label class="gender-option"><input type="radio" name="gender" value="${value}" ${state.gender === value ? 'checked' : ''}>${label}</label>`).join('')}</fieldset>${setup}<button class="endday" type="submit">${starting ? '이 삶으로 시작한다' : '설정 저장'}</button></form></dialog>`;
  }
  function eventDialog() {
    const event = state.eventQueue[0];
    if (!event) return '';
    const choices = Campaign.eventChoices(state, event);
    const lines = Campaign.eventDialogue(state, event);
    const index = event.resolved ? lines.length - 1 : (event.dialogueIndex || 0);
    const reading = !event.resolved && index < lines.length - 1;
    const current = event.resolved?.reaction
      ? { speaker: event.resolved.speaker, text: event.resolved.reaction }
      : lines[index];
    const conversation = `<div class="conversation" aria-live="polite"><div class="speech"><span>${escape(current.speaker)}</span><p id="current-line">${escape(current.text)}</p></div></div>`;
    const history = `<details class="dialogue-history"><summary>상황과 지난 대화</summary><p>${escape(event.text)}</p>${lines.slice(0, event.resolved ? lines.length : index).map(line => `<p><b>${escape(line.speaker)}</b> ${escape(line.text)}</p>`).join('')}${event.resolved?.reply ? `<p><b>${escape(state.name)} · 나</b> ${escape(event.resolved.reply)}</p>` : ''}</details>`;
    const nextLine = reading ? `<button class="dialogue-next" data-action="dialogueNext" data-event-id="${event.id}">이야기를 더 듣는다</button>` : '';
    const decision = event.resolved
      ? `<section class="event-outcome" role="status"><span class="eyebrow">선택의 결과</span><p>${escape(event.resolved.result)}</p></section>`
      : !reading && choices.length ? `<div class="event-choices">${choices.map(choice => `<button class="choice" data-action="eventChoice" data-event-id="${event.id}" data-choice="${choice.id}" ${choice.disabled ? 'disabled' : ''}><strong>“${escape(Campaign.eventReply ? Campaign.eventReply(event, choice.id).reply : choice.title)}”</strong><small>${escape(choice.detail)}</small></button>`).join('')}</div>` : '';
    const continueButton = !reading && !choices.length ? `<button class="endday" data-event-dismiss autofocus>${event.councilReport ? '의회로 돌아간다' : event.pactReport ? '협약 화면으로 돌아간다' : event.partyBallot ? '경선 기록으로 돌아간다' : event.scene === 'hearing' ? '청문회에 참석한다' : event.resolved ? '이 결정을 안고 계속한다' : '도시로 돌아간다'}</button>` : '';
    return `<dialog id="event-dialog" class="event-dialog" aria-labelledby="event-title" aria-describedby="current-line"><div class="event-visual"><img class="event-picture" src="/assets/events/${event.scene}.webp" alt="${escape(event.title)}"><div class="event-caption"><p>${event.day}일 · ${event.councilReport ? '의회 표결' : event.pactReport ? '정책 협약' : event.partyBallot ? '정당 경선' : event.randomType ? '도시에서 생긴 일' : event.jobEpisode ? '직업 이야기' : event.id === 'opening' ? '첫 만남' : event.id === 'storm' ? '첫 장마' : event.id === 'election' ? '선거 결과' : event.scene === 'hearing' ? '공개 청문회' : '후속 소식'}</p><h2 id="event-title">${escape(event.title)}</h2></div></div><div class="event-copy">${conversation}${nextLine}${decision}${continueButton}${history}</div></dialog>`;
  }
  function nextStopLabel() {
    const fallback = state.day < 12 ? {day:12,label:'첫 장마'} : state.day < 20 ? {day:20,label:'선거'} : state.day === 20 ? {day:21,label:'새 임기'} : {day:Math.min(state.day+7,state.politics.nextDay),label:state.politics.nextDay<=state.day+7?'선거':'다음 주'};
    const candidates = [fallback, ...state.followUps.filter(item=>item.day > state.day).map(item=>({day:item.day,label:item.type === 'job' ? '직업 이야기' : '후속 사건'}))];
    if (state.hearing && state.hearing.day > state.day) candidates.push({day:state.hearing.day,label:'청문회'});
    candidates.sort((a,b)=>a.day-b.day);
    return `${candidates[0].day}일 · ${candidates[0].label}`;
  }
  function render() {
    const previousFocus = document.activeElement?.dataset?.action;
    const selected = state.built || (state.surveyed ? preview : 'none');
    const safe = selected === 'long';
    const homes = Object.values(state.residents).reduce((a, b) => a + b, 0);
    document.querySelector('#app').innerHTML = `<header><div class="brand">CIVITAS<small>${careerTitle()}</small></div><div class="clock"><strong>${Life.calendar(state.day)}</strong>${state.day < 12 ? '장마까지 ' + (12 - state.day) + '일' : state.day < 20 ? '선거까지 ' + (20 - state.day) + '일' : '다음 선거까지 '+(state.politics.nextDay-state.day)+'일'}</div></header><div class="layout"><aside><div class="identity"><div class="portrait">${escape(Array.from(state.name)[0])}</div><div><strong>${escape(state.name)}</strong><small>${careerTitle()} · ${genderNames[state.gender]} · ${state.life.people.player.age??"나이 미설정"}${state.life.people.player.age==null?"":"세"}</small></div></div><div class="stats">${[['소지금', state.cash + ' ₭'], ['기력', state.energy], ['주민', homes + '가구'], ['예상 지지', state.support + '%']].map(([key, value]) => `<div class="stat"><small>${key}</small><b>${value}</b></div>`).join('')}</div><nav class="nav">${[['city','도시'],['people','사람들'],['power','선거'],['jobs','직업'],['journal','연대기']].map(([id, label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}</nav><div class="promise">생활비 하루 ${3 + (state.jobStory.livingExpense || 0)}크라운<br>집세 7일마다 12크라운<br>평소 시간은 직접 넘긴다.</div></aside><main><section class="world ${state.flooded > 0 ? 'flooded' : ''}">${cityArt()}<div class="world-title"><div class="eyebrow">벨라르 · 강 하구</div><h1>${state.flooded === null ? '물이 닿을 곳에 사람이 산다.' : '선택은 도시의 모양으로 남는다.'}</h1></div><div class="district-overlay"><span>항구 ${state.residents.harbor}가구</span><span class="${safe ? 'protected' : 'risk'}">어촌 ${state.residents.village}가구 · ${safe ? '보호 계획' : '침수 위험'}</span><span>언덕 ${state.residents.hill}가구</span></div><div class="levee ${selected}" aria-label="${plans[selected].name} 위치"></div></section><section class="scene">${state.notices.slice(0,2).map(notice => `<p class="muted">${escape(notice)}</p>`).join('')}${message ? `<div class="toast" role="status">${escape(message)}</div>` : ''}${state.jobStory.stage !== 'none' && tab === 'city' ? `<p class="muted">직업 이야기 · ${state.jobStory.stage === 'complete' ? '첫 사건의 결말이 기록됐다' : state.jobStory.stage === 'waiting' ? '다음 만남을 기다리는 중' : '현재 만남 진행 중'}${state.jobStory.evidence ? ' · 사본 보유' : ''}</p>` : ''}${content()}${lifeTimePanel()}${tab === 'city' || tab === 'power' ? careerPanel() : ''}<button class="endday" data-action="advance" data-to="day" ${state.hearing && state.hearing.day <= state.day ? 'disabled' : ''}>하루를 마친다 · 생활비 ${3 + (state.jobStory.livingExpense || 0)}크라운</button><button class="choice" data-action="advance" data-to="event" ${state.hearing && state.hearing.day <= state.day ? 'disabled' : ''}><strong>${nextStopLabel()}까지 진행</strong><small>남은 행동을 쉬고 생활비와 집세를 정산한다</small></button><button class="reset" data-profile>인물 설정</button><button class="reset" data-reset>${resetPending ? '다시 눌러 새 캠페인 시작' : '새 캠페인 시작'}</button></section></main><aside class="right"><div class="eyebrow">도시의 달력</div><h3>12일 · 첫 장마</h3><p class="muted">공사할 수 있는 마지막 날은 11일이다.</p><h3>${state.politics.nextDay}일 · 동장 선거</h3><p class="muted">등록은 ${state.politics.nextDay-1}일까지. 임기는 ${state.life.clock.mode==='lifetime'?'4년':'28일(기존 진행 방식)'}이다.</p><h3>당선 다음 날 · 새 예산</h3><p class="muted">당선자는 집행하고, 주민은 청원한다.</p>${state.journal.slice(0,4).map(entry => `<div class="log"><small>${entry.day}일</small>${escape(entry.text)}</div>`).join('')}</aside></div>${!state.profileSet || !state.startConfigured || !state.ageChosen || editingProfile ? profileDialog() : eventDialog()}`;
    const profile = document.querySelector('#profile-dialog');
    if (profile) {
      profile.showModal();
      profile.addEventListener('cancel', event => {
        event.preventDefault();
        if (state.profileSet) { editingProfile = false; render(); }
      });
    }
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
    if (!event || Campaign.eventChoices(state, event).length) return;
    tab = event.destination;
    state = apply(state, { type: 'acknowledge' }).state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { message = '사건 확인 상태를 저장하지 못했다.'; }
    render();
  }
  document.addEventListener('click', event => {
    const element = event.target.closest('button');
    if (!element || element.disabled || element.closest('#profile-form')) return;
    if (element.hasAttribute('data-profile')) { editingProfile = true; render(); return; }
    if (element.hasAttribute('data-event-dismiss')) { dismissEvent(); return; }
    if (element.hasAttribute('data-reset')) {
      if (resetPending) { state = fresh(); message = ''; resetPending = false; localStorage.setItem(KEY, JSON.stringify(state)); }
      else resetPending = true;
    } else if (element.dataset.tab) { tab = element.dataset.tab; message = ''; }
    else if (element.dataset.preview) preview = element.dataset.preview;
    else if (element.dataset.action) {
      const result = apply(state, { type: element.dataset.action, plan: element.dataset.plan, funding: element.dataset.funding, policy: element.dataset.policy, to: element.dataset.to, career: element.dataset.career, choice: element.dataset.choice, person: element.dataset.person, platform:['partyFound','partySplit'].includes(element.dataset.action)?partyDraft.platform:element.dataset.platform, party:element.dataset.party, pact:element.dataset.pact, group:element.dataset.group, member:element.dataset.member, days:Number(element.dataset.days), routine:element.dataset.routine, skill: element.dataset.skill, department: element.dataset.department, kind: document.querySelector('#network-kind')?.value, name: ['partyFound','partySplit'].includes(element.dataset.action) ? partyDraft.name : ['createAgency','splitAgency'].includes(element.dataset.action) ? document.querySelector('#agency-name')?.value : document.querySelector('#network-name')?.value, source:document.querySelector('#agency-source')?.value, target:document.querySelector('#agency-target')?.value, eventId: element.dataset.eventId, circle:element.dataset.circle, role:element.dataset.role });
      state = result.state;
      message = result.message;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { message += ' 저장 공간에 접근할 수 없어 이번 진행은 자동 저장되지 않았다.'; }
    }
    render();
    if (['dialogueNext','eventChoice'].includes(element.dataset.action)) {
      const copy = document.querySelector('#event-dialog .event-copy');
      if (copy) copy.scrollTop = 0;
    }
  });
  document.addEventListener('input',event=>{if(event.target.id==='party-name')partyDraft.name=event.target.value;if(event.target.id==='party-platform')partyDraft.platform=event.target.value;});
  document.addEventListener('submit', event => {
    if (event.target.id !== 'profile-form') return;
    event.preventDefault();
    const form = new FormData(event.target);
    const choose = (value, options) => value === 'random' ? options[Math.floor(Math.random() * options.length)] : value;
    const starting = !state.startConfigured;
    const result = apply(state, {
      type: starting ? 'start' : 'profile', name: form.get('playerName'), gender: form.get('gender'), age:Number(form.get('age')),
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      occupation: choose(form.get('occupation'), Object.keys(Starts.occupations)),
      background: choose(form.get('background'), Object.keys(Starts.backgrounds))
    });
    if(result.message){
      let error=document.querySelector('#profile-error');
      if(!error){error=document.createElement('p');error.id='profile-error';error.setAttribute('role','alert');event.target.prepend(error);}
      error.textContent=result.message;
      return;
    }
    state = result.state;
    if (!state.profileSet || (starting && !state.startConfigured)) return;
    editingProfile = false;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { message = '설정을 저장하지 못했습니다.'; }
    render();
  });
  render();
})();
