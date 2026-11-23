'use strict';
(function (root) {
  const plans = {
    short: { name: '항구 제방', cost: 24, homes: 68, description: '항구를 보호한다. 어촌 18가구가 침수된다.' },
    long: { name: '어촌까지 잇는 제방', cost: 60, homes: 86, description: '모든 86가구를 보호한다. 선주 계약 또는 주민 공동 출자가 필요하다.' },
    none: { name: '공사를 보류한다', cost: 0, homes: 0, description: '돈을 쓰지 않는다. 장마 때 34가구가 침수된다.' }
  };
  function fresh() {
    return { version: 3, day: 1, actions: 2, cash: 32, energy: 80, name: '시민', gender: 'unspecified', profileSet: false, place: 'harbor',
      surveyed: false, testimony: false, funding: null, built: null, flooded: null,
      candidate: false, election: null, policy: null, support: 25, memories: [], journal: [],
      promise: null, notices: [], witness: false,
      career: 'worker', treasury: 40, caseStage: 'closed', contractRelief: false,
      hearing: null, bill: null, hearingRecord: null, eventQueue: [],
      residents: { harbor: 48, village: 26, hill: 12 } };
  }
  function record(state, text) { state.journal.unshift({ day: state.day, text }); }
  function remember(state, person, text) { state.memories.push({ person, text, day: state.day }); }
  function normalize(state) {
    const result = { ...fresh(), ...state };
    if (result.election?.won) result.career = 'mayor';
    return result;
  }
  function electionResult(state) {
    const common = state.support - 25;
    const fulfilled = state.promise === 'kept' ? 8 : state.promise === 'broken' ? -15 : 0;
    const limit = value => Math.max(5, Math.min(95, Math.round(value)));
    const districts = [
      { name: '항구', voters: 48, share: limit(35 + common + (state.funding === 'merchant' ? -12 : 0)) },
      { name: '어촌', voters: 26, share: limit(25 + common + fulfilled + (state.flooded === 0 ? 10 : -12)) },
      { name: '언덕', voters: 12, share: limit(30 + common + (state.witness ? 10 : 0)) }
    ];
    const votes = Math.round(districts.reduce((sum, district) => sum + district.voters * district.share, 0) / 86);
    const won = state.candidate && votes >= 50;
    return { won, winner: won ? state.name : '소라', votes, districts };
  }
  function hearingStrength(state) {
    const hearing = state.hearing;
    if (!hearing) return 0;
    const heard = hearing.heard || [];
    let score = 0;
    if (heard.includes('윤') && state.surveyed) score += 1;
    if (heard.includes('소라') && state.testimony && state.promise !== 'broken') score += 1;
    if (heard.includes('민석') && state.witness) score += 1;
    if (hearing.evidence) score += 2;
    if (state.support >= 40 || state.promise === 'kept') score += 1;
    return score;
  }
  function apply(state, action) {
    const next = normalize(JSON.parse(JSON.stringify(state)));
    let message = '';
    const spend = (energy = 0) => {
      if (next.actions < 1 || next.energy < energy) return false;
      next.actions -= 1;
      next.energy -= energy;
      return true;
    };
    if (action.type === 'profile') {
      if (typeof action.name !== 'string' || !action.name.trim() || !['male','female','unspecified'].includes(action.gender)) return { state, message: '이름과 성별 설정을 확인해 주세요.' };
      next.name = Array.from(action.name.trim()).slice(0,18).join('');
      next.gender = action.gender;
      next.profileSet = true;
      return { state: next, message: '' };
    }
    if (action.type === 'acknowledge') {
      next.eventQueue.shift();
      return { state: next, message: '' };
    }
    const inHearing = next.hearing && next.hearing.day <= next.day;
    if (inHearing && !['question', 'evidence', 'verdict'].includes(action.type)) {
      return { state, message: '청문회가 진행 중이다. 증언을 듣고 표결 또는 합의를 선택하자.' };
    }
    switch (action.type) {
      case 'question': {
        if (!inHearing || !['윤', '소라', '민석', '도윤'].includes(action.person)) break;
        const heard = next.hearing.heard || [];
        if (heard.includes(action.person)) break;
        next.hearing.heard = [...heard, action.person];
        const testimony = {
          '윤': next.surveyed ? '“당신과 함께 물길을 확인했다. 긴 제방은 어촌까지 보호한다.”' : '“직접 조사에 함께하지 않은 사람의 책임을 제가 보증할 수는 없다.”',
          '소라': next.promise === 'broken' ? '“당신은 지킨다고 약속했다. 그 약속을 어긴 뒤에 이제 와서 누구의 편이라는 건가?”' : next.testimony ? '“당신은 우리 말을 들었다. 임금에서 공사비까지 가져가는 계약은 바뀌어야 한다.”' : '“어촌에 오지도 않은 사람을 어떻게 믿으라는 건가?”',
          '민석': next.witness ? '“지안이 보관한 사본을 대조했다. 계약의 서명과 공제 내역은 사실이다.”' : '“원본 대조가 안 됐다. 소문으로 계약을 뒤집을 수는 없다.”',
          '도윤': next.funding === 'merchant' ? '“내 돈으로 제방을 지었다. 계약을 바꾸려면 최소한 12크라운은 보전해 줘야 한다.”' : '“내가 공사에 투자한 계약은 없다. 공개 기록을 남기는 데 반대하지 않는다.”'
        };
        message = `${action.person}의 증언 ${testimony[action.person]}`;
        remember(next, action.person, message);
        break;
      }
      case 'evidence':
        if (!inHearing || !next.witness || next.hearing.evidence) break;
        next.hearing.evidence = true;
        message = '계약 사본을 공개했다. 당신의 서명까지 공개 기록에 남았다. 증거 설득력 +2.';
        remember(next, '지안', '청문회에서 당신이 서명한 계약까지 공개했다.');
        break;
      case 'verdict': {
        if (!inHearing || !['vote', 'settle', 'withdraw'].includes(action.choice)) break;
        if (action.choice === 'settle' && (next.cash < 12 || next.funding !== 'merchant' || !(next.hearing.heard || []).includes('도윤'))) break;
        const strength = hearingStrength(next);
        const passed = action.choice === 'settle' || (action.choice === 'vote' && strength >= 4);
        if (action.choice === 'settle') next.cash -= 12;
        next.bill = passed ? 'passed' : 'rejected';
        next.contractRelief = passed && next.funding === 'merchant';
        next.hearingRecord = { day: next.day, choice: action.choice, strength, passed, heard: next.hearing.heard || [], evidence: Boolean(next.hearing.evidence) };
        message = action.choice === 'settle' ? '개인 돈 12크라운으로 도윤과 합의했다. 임금 공제 조항이 폐지됐다.' : passed ? '증언과 증거를 바탕으로 표결이 통과됐다. 공개 감사가 확정되고 선주 계약이 있다면 임금 공제도 폐지된다.' : action.choice === 'withdraw' ? '안건을 철회했다. 원래 계약이 유지된다.' : '증언과 증거가 부족해 표결에서 부결됐다. 원래 계약이 유지된다.';
        remember(next, '도윤', message);
        remember(next, '소라', message);
        next.hearing = null;
        break;
      }

      case 'place': next.place = action.place; return { state: next, message: '' };
      case 'work':
        if (!spend(15)) break;
        next.cash += next.funding === 'merchant' && next.flooded !== null && !next.contractRelief ? 10 : 16;
        message = next.funding === 'merchant' && next.flooded !== null && !next.contractRelief ? '부두에서 품삯 10크라운을 받았다. 선주 계약의 사용료 6크라운이 공제됐다.' : '부두에서 품삯 16크라운을 받았다.';
        break;
      case 'rest':
        if (!spend()) break;
        next.energy = Math.min(100, next.energy + 30);
        message = '하숙방에서 쉬었다. 창밖으로 부두의 종이 울린다.';
        break;
      case 'survey':
        if (next.surveyed || next.day >= 12 || !spend(10)) break;
        next.surveyed = true;
        message = '수문공 윤과 침수선을 측량했다. 항구 제방만 지으면 어촌 18가구가 물길에 남는다.';
        remember(next, '윤', '함께 침수선을 조사했다. 당신의 측량을 증언할 수 있다.');
        break;
      case 'testimony':
        if (next.testimony || !spend()) break;
        next.testimony = true;
        next.support += 10;
        message = '어민 대표 소라가 주민 공동 출자를 제안했다. 당신도 30크라운을 보태야 한다.';
        remember(next, '소라', '어촌을 지켜 달라는 부탁을 직접 들었다.');
        break;
      case 'promise':
        if (next.promise || next.day >= 12 || !next.testimony || !spend()) break;
        next.promise = 'pending';
        next.support += 6;
        message = '소라와 주민들 앞에서 어촌을 지키겠다고 약속했다. 첫 장마 때 이행 여부가 드러난다.';
        remember(next, '소라', '주민들이 함께 들은 공개 약속의 증인이다.');
        break;
      case 'witness':
        if (!next.built || next.witness || !spend()) break;
        next.witness = true;
        message = '지안에게 공사 결정과 자금 출처를 공개했다. 민석은 계약 사본을 확보했다.';
        remember(next, '지안', '공사 자금과 계약을 공개 기록으로 남겼다.');
        remember(next, '민석', '공사 결정의 사본을 가지고 있다. 공개 감사에서 증언할 수 있다.');
        break;
      case 'build': {
        const plan = plans[action.plan];
        if (!plan || next.built || next.day >= 12 || !next.surveyed) break;
        let cost = plan.cost;
        if (action.plan === 'long') {
          if (action.funding === 'cooperative' && next.testimony) cost = 30;
          else if (action.funding === 'merchant') cost = 12;
          else break;
        }
        if (next.cash < cost || !spend(10)) break;
        next.cash -= cost;
        next.built = action.plan;
        next.funding = action.plan === 'long' ? action.funding : null;
        message = `${plan.name} 결정. ${cost}크라운을 지불했다.`;
        if (next.funding === 'merchant') {
          message += ' 선주 도윤에게 20년간 부두 사용료 징수권을 주었다.';
          remember(next, '도윤', '공사비를 지원했다. 부두 사용료 20년 계약의 당사자다.');
        }
        if (next.funding === 'cooperative') remember(next, '소라', '주민들과 함께 공사비를 부담했다.');
        break;
      }
      case 'run':
        if (next.candidate || next.day >= 20 || next.cash < 8 || !spend()) break;
        next.cash -= 8;
        next.candidate = true;
        message = '기록관 지안에게 후보 등록서를 맡겼다. 선거일은 20일이다.';
        remember(next, '지안', '후보 등록 서류를 함께 작성했다.');
        break;
      case 'campaign':
        if (!next.candidate || next.day >= 20 || !spend(10)) break;
        next.support = Math.min(90, next.support + 7);
        message = '골목 집회에서 주민들의 이야기를 들었다. 예상 지지가 올랐다.';
        break;
      case 'join':
        if (next.day < 21 || next.career !== 'worker' || !['investigator', 'councillor'].includes(action.career) || !next.witness || !spend()) break;
        next.career = action.career;
        next.caseStage = action.career === 'investigator' ? 'open' : next.caseStage;
        message = action.career === 'investigator' ? '민석의 추천으로 항만 수사관이 됐다. 임명은 선거 당선과 다른 경로의 권한을 열었다.' : '지안의 추천으로 주민 협의회 위원에 위촉됐다. 안건을 제출하고 공개 청문회를 소집할 수 있다.';
        remember(next, action.career === 'investigator' ? '민석' : '지안', '당신을 공직에 추천했다. 앞으로의 결정에 책임을 묻는다.');
        break;
      case 'investigate':
        if (next.career !== 'investigator' || next.caseStage !== 'open' || !spend(10)) break;
        next.caseStage = 'evidence';
        message = next.funding === 'merchant' ? '임금 장부와 선주 계약을 대조했다. 사용료가 노동자 임금에서 공제되는 조항을 확인했다. 당신의 서명도 있다.' : '장부 대조 결과 횡령 증거는 없었다. 다만 배급을 받지 못한 가구 명단이 발견됐다.';
        remember(next, '민석', message);
        break;
      case 'caseDecision':
        if (next.career !== 'investigator' || next.caseStage !== 'evidence' || !['public', 'private'].includes(action.choice) || !spend()) break;
        next.caseStage = action.choice === 'public' ? 'reported' : 'sealed';
        if (action.choice === 'public') {
          next.hearing = { day: next.day + 3, source: 'report' };
          message = '수사 자료를 공개했다. 사흘 뒤 주민 청문회가 열린다. 서명자에게도 질문이 돌아온다.';
        } else {
          next.cash += 20;
          next.support = Math.max(0, next.support - 8);
          message = '도윤의 비공개 합의를 받아들였다. 20크라운을 받았고 민석은 보고서 누락을 기억한다.';
          remember(next, '민석', '공개 가능한 자료를 봉인한 당신에게 책임을 묻는다.');
        }
        break;
      case 'bill':
        if (!['mayor', 'councillor'].includes(next.career) || next.bill || next.hearing || !spend(10)) break;
        next.bill = 'pending';
        next.hearing = { day: next.day + 3, source: 'bill' };
        message = '항만 계약 재협상안을 제출했다. 사흘 뒤 소라·도윤·윤이 공개 청문회에서 의견을 낸다.';
        remember(next, '지안', '당신의 재협상안을 의사록에 올렸다.');
        break;
      case 'budget': {
        if (next.career !== 'mayor' || next.day < 21 || next.treasury < 12 || !spend()) break;
        const returned = Math.min(4, Math.max(0, 86 - Object.values(next.residents).reduce((a, b) => a + b, 0)));
        if (!returned) {
          next.actions += 1;
          break;
        }
        next.treasury -= 12;
        next.residents.village += returned;
        message = `공금 12크라운으로 복구 공사를 발주했다. ${returned}가구가 돌아왔다. 개인 소지금은 공금과 별도로 관리된다.`;
        remember(next, '윤', '당신이 발주한 복구 공사를 맡았다.');
        break;
      }
      case 'policy':
        if (!next.election || next.policy || next.day < 21 || !spend()) break;
        next.policy = action.policy === 'housing' ? 'housing' : 'audit';
        message = next.election.won ? '첫 예산안을 집행했다.' : `${next.election.winner} 동장에게 주민 청원을 제출했다.`;
        if (next.policy === 'housing') {
          const returned = Math.min(8, 86 - Object.values(next.residents).reduce((a, b) => a + b, 0));
          next.residents.village += returned;
          message += ` 임시 주택에 ${returned}가구가 돌아왔다.`;
        } else {
          next.support = Math.min(100, next.support + 8);
          message += ' 지안이 계약 공개 감사의 첫 증인이 됐다.';
        }
        break;
      case 'advance': {
        let target = action.to === 'event' ? (next.day < 12 ? 12 : next.day < 20 ? 20 : next.day < 21 ? 21 : next.day + 7) : next.day + 1;
        if (next.hearing && next.hearing.day > next.day) target = Math.min(target, next.hearing.day);
        while (next.day < target) {
          next.day += 1;
          next.cash -= 3 + (next.day % 7 === 0 ? 12 : 0);
          next.energy = Math.max(0, Math.min(100, next.energy + 20) - (next.cash < 0 ? 10 : 0));
          if (next.day === 6 && !next.testimony) {
            next.notices.unshift('소라가 어촌 주민 공동 출자를 모집한다. 장마 전에 어촌을 방문할 수 있다.');
            record(next, '소라가 공동 출자 모임을 열었다. 당신이 오기를 기다리고 있다.');
          }
          if (next.day === 9 && next.funding === 'merchant' && !next.witness) {
            next.notices.unshift('민석이 선주 계약의 사본을 요청했다. 공개 여부는 당신이 결정한다.');
            record(next, '민석이 항만 계약에 관심을 보였다. 아직 사본은 전달하지 않았다.');
          }
          if (next.day === 12) {
            const plan = next.built || 'none';
            next.flooded = plan === 'long' ? 0 : plan === 'short' ? 18 : 34;
            next.residents.village -= Math.min(18, next.flooded);
            next.residents.harbor -= Math.max(0, next.flooded - 18);
            next.support = Math.max(0, Math.min(100, next.support + (plan === 'long' ? 22 : plan === 'short' ? -8 : -18)));
            if (next.promise === 'pending') {
              next.promise = plan === 'long' ? 'kept' : 'broken';
              next.support = Math.max(0, Math.min(90, next.support + (plan === 'long' ? 8 : -15)));
              const response = plan === 'long' ? '소라가 주민 모임에서 당신이 약속을 지켰다고 증언했다.' : '소라가 주민 모임에서 당신의 어촌 보호 약속이 깨졌다고 말했다.';
              remember(next, '소라', response);
              record(next, response);
            }
            next.eventQueue.push({
              id: 'storm', day: next.day,
              scene: plan === 'long' ? 'storm-safe' : plan === 'short' ? 'storm-partial' : 'storm-flood',
              title: plan === 'long' ? '물은 제방 밖에서 멈췄다' : '물이 빠진 뒤, 빈집이 남았다',
              text: `${plans[plan].name}. ${next.flooded}가구가 침수되어 도시를 떠났다.`,
              quote: next.promise === 'broken' ? '소라 “지켜 준다고 했잖아.”' : plan === 'long' ? '소라 “우리 집 문턱까지 왔다가 멈췄어.”' : '소라 “떠나는 사람들의 이름을 기억해 줘.”',
              destination: 'city'
            });
            const report = `첫 장마. ${next.flooded}가구가 침수되어 도시를 떠났다.`;
            record(next, report);
            remember(next, '소라', plan === 'long' ? '어촌이 장마를 버텼다. 공사에 참여한 당신을 기억한다.' : '어촌 18가구가 침수됐다. 당신이 어떤 결정을 했는지 기억한다.');
          }
          if (next.day > 20 && next.day % 7 === 0) {
            next.treasury += 10;
            if (next.career !== 'worker') {
              next.cash += 18;
              record(next, '주급 18크라운을 받았다. 시 재정에는 세수 10크라운이 들어왔다.');
            }
          }
          if (next.hearing && next.day === next.hearing.day) {
            next.hearing.heard = [];
            next.hearing.evidence = false;
            next.notices.unshift('청문회가 시작됐다. 증언과 증거를 확인하고 마지막 결정을 내려야 시간이 흐른다.');
            next.eventQueue.push({ id: 'hearing-' + next.day, day: next.day, scene: 'hearing', title: '당신의 서명도 이 자리에 있다', text: '계약과 임금 장부가 증언대에 놓였다. 누구에게 질문하고 무엇을 공개할지 결정하자.', quote: '지안 “오늘의 말은 모두 기록에 남습니다.”', destination: 'city' });
            record(next, '청문회 개회. 윤·소라·민석·도윤이 참석했다.');
          }
          if (next.day === 24 && !next.hearing && !next.bill) {
            next.notices.unshift('지안이 재협상안 제출을 권했다. 수사관은 장부를 조사하고, 동장과 협의회 위원은 안건을 제출할 수 있다.');
            record(next, '지안이 계약 재협상에 필요한 절차를 안내했다.');
          }
          if (next.day === 20) {
            next.election = electionResult(next);
            if (next.election.won) next.career = 'mayor';
            next.eventQueue.push({
              id: 'election', day: next.day, scene: next.election.won ? 'election-win' : 'election-loss',
              title: next.election.won ? '광장이 당신의 이름을 부른다' : next.candidate ? '광장은 다른 이름을 불렀다' : '당신이 지켜본 선거',
              text: `${next.election.winner} 동장 당선. ${next.candidate ? '당신의 득표율 ' + next.election.votes + '%.' : '당신은 출마하지 않았다.'} 내일도 도시의 삶은 이어진다.`,
              quote: next.election.won ? '지안 “이제 약속을 예산으로 옮길 차례예요.”' : '소라 “내일 아침, 우리 동네에서 만나요.”', destination: 'power'
            });
            record(next, `${next.election.winner} 동장 당선. ${next.candidate ? '당신의 득표율 ' + next.election.votes + '%' : '당신은 출마하지 않았다.'}`);
          }
        }
        next.actions = 2;
        message = `${next.day}일이 되었다. 생활비와 집세를 정산했다.${next.cash < 0 ? ' 생활비가 모자라 빚이 쌓이고 있다.' : ''}`;
        break;
      }
    }
    if (!message) return { state, message: '지금은 이 행동을 할 수 없다. 비용, 기력, 일정 조건을 확인하자.' };
    record(next, message);
    return { state: next, message };
  }
  const api = { fresh, apply, plans, normalize, electionResult, hearingStrength };
  if (typeof module !== 'undefined') module.exports = api;
  root.Campaign = api;
})(globalThis);
