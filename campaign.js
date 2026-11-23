'use strict';
(function (root) {
  const plans = {
    short: { name: '항구 제방', cost: 24, homes: 68, description: '항구를 보호한다. 어촌 18가구가 침수된다.' },
    long: { name: '어촌까지 잇는 제방', cost: 60, homes: 86, description: '모든 86가구를 보호한다. 선주 계약 또는 주민 공동 출자가 필요하다.' },
    none: { name: '공사를 보류한다', cost: 0, homes: 0, description: '돈을 쓰지 않는다. 장마 때 34가구가 침수된다.' }
  };
  function fresh() {
    return { version: 3, day: 1, actions: 2, cash: 32, energy: 80, name: '하린', place: 'harbor',
      surveyed: false, testimony: false, funding: null, built: null, flooded: null,
      candidate: false, election: null, policy: null, support: 25, memories: [], journal: [],
      promise: null, notices: [], witness: false,
      residents: { harbor: 48, village: 26, hill: 12 } };
  }
  function record(state, text) { state.journal.unshift({ day: state.day, text }); }
  function remember(state, person, text) { state.memories.push({ person, text, day: state.day }); }
  function normalize(state) {
    return { ...fresh(), ...state };
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
  function apply(state, action) {
    const next = normalize(JSON.parse(JSON.stringify(state)));
    let message = '';
    const spend = (energy = 0) => {
      if (next.actions < 1 || next.energy < energy) return false;
      next.actions -= 1;
      next.energy -= energy;
      return true;
    };
    switch (action.type) {
      case 'place': next.place = action.place; return { state: next, message: '' };
      case 'work':
        if (!spend(15)) break;
        next.cash += next.funding === 'merchant' && next.flooded !== null ? 10 : 16;
        message = '부두에서 품삯을 받았다. 선주 계약이 발효된 뒤에는 임금에서 통행료가 공제된다.';
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
        const target = action.to === 'event' ? (next.day < 12 ? 12 : next.day < 20 ? 20 : next.day < 21 ? 21 : next.day + 7) : next.day + 1;
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
            const report = `첫 장마. ${next.flooded}가구가 침수되어 도시를 떠났다.`;
            record(next, report);
            remember(next, '소라', plan === 'long' ? '어촌이 장마를 버텼다. 공사에 참여한 당신을 기억한다.' : '어촌 18가구가 침수됐다. 당신이 어떤 결정을 했는지 기억한다.');
          }
          if (next.day === 20) {
            next.election = electionResult(next);
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
  const api = { fresh, apply, plans, normalize, electionResult };
  if (typeof module !== 'undefined') module.exports = api;
  root.Campaign = api;
})(globalThis);
