'use strict';
(function(root) {
  const backgrounds = {
    worker: { name: '노동자 집안', cash: 0, support: 5, detail: '주민 지지 +5 · 저축 추가 없음' },
    merchant: { name: '상인 집안', cash: 12, support: 0, detail: '시작 자금 +12 · 주민 지지 추가 없음' },
    migrant: { name: '이주민', cash: 4, support: 2, detail: '시작 자금 +4 · 주민 지지 +2' }
  };
  const occupations = {
    farmer: { name:'농장 일꾼', firstEpisode:'farmRecords', wage:13, energy:14, person:'다솔', scene:'opening-farm', title:'사슬이 걸린 공동 우물', text:'첫 농장 일을 마치자 마을 우물에 압류 봉인이 붙었다. 마을 대표 다솔이 오래된 공동 사용권을 찾고 있다.', opening:'우물은 마을 것이었어. 그런데 지주가 빚 대신 가져간대. 계약을 확인해 줄 사람이 필요해.', options:[
      {id:'help',reply:'공동 사용권을 함께 찾아볼게요.',detail:'기력 −10 · 지지 +3 · 다솔과 조사 시작',result:'다솔과 압류 봉인을 확인했다. 공동 사용권의 원본을 찾기로 했다.'},
      {id:'earn',reply:'오늘은 밭일 수당부터 벌어야겠어요.',detail:'소지금 +8 · 기력 −10',result:'추가 밭일로 8크라운을 벌었다. 다솔은 주민들과 계약을 찾기 시작했다.'}
    ]},
    clerk: { name:'하급 서기', firstEpisode:'clerkRecords', wage:15, energy:10, person:'서윤', scene:'opening-clerk', title:'토지 명부에서 지워진 이름', text:'옛 왕실 기록보관소의 첫 근무일. 공화국으로 이관할 토지 명부에서 농민들의 사용권 기록이 빠졌다.', opening:'명부를 옮기는 사이 한 장이 사라졌어요. 누락을 묻어 두라는 지시도 내려왔고요. 함께 확인할래요?', options:[
      {id:'help',reply:'이관 전의 목록과 대조하겠습니다.',detail:'기력 −10 · 지지 +3 · 서윤과 누락 확인',result:'서윤과 누락 목록을 확인했다. 원본과 이관 명부를 대조하기로 했다.'},
      {id:'earn',reply:'오늘 맡은 필사부터 끝내겠습니다.',detail:'소지금 +8 · 기력 −10',result:'추가 필사 수당을 받았다. 서윤은 따로 원본 목록을 찾아 나섰다.'}
    ]},
    worker: { name: '항구 노동자', wage: 16, energy: 15, person: '윤', scene: 'storm-safe', title: '부두에 남은 물자국', text: '첫 근무를 마치려는데 수문공 윤이 바닥의 물자국을 가리킨다.', opening: '이번 장마에는 여기까지 잠길 거야. 품삯을 더 벌지, 물길부터 확인할지 정해야 해.', options: [
      { id: 'help', reply: '물길을 함께 확인하죠.', detail: '기력 −10 · 제방 조사 완료', result: '윤과 현장을 측량했다. 첫날부터 제방 계획을 비교할 수 있다.' },
      { id: 'earn', reply: '오늘은 추가 하역부터 하겠습니다.', detail: '소지금 +8 · 기력 −10', result: '추가 하역으로 품삯을 벌었다. 윤의 조사는 다음에 함께하기로 했다.' }
    ] },
    apprentice: { firstEpisode:'factoryRecords', name: '공장 견습', wage: 14, energy: 12, person: '은호', scene: 'opening-factory', title: '기계가 멈춘 아침', text: '방직 공장의 첫 근무일. 밀린 임금을 요구하던 동료 은호 앞에서 반장이 출근 명부를 닫는다.', opening: '우리 임금이 사흘째 밀렸어. 같이 명부를 확인해 줄래? 반장 눈에 찍힐 수도 있어.', options: [
      { id: 'help', reply: '명부를 같이 확인하겠어요.', detail: '주민 지지 +6 · 기력 −10 · 임금 증언 기록', result: '은호와 임금 누락을 확인했다. 동료들이 당신의 증언을 기억한다.' },
      { id: 'earn', reply: '일단 제 몫의 교대 근무를 하겠습니다.', detail: '소지금 +8 · 기력 −10', result: '교대 근무 수당을 받았다. 은호는 다른 동료에게 도움을 구하러 갔다.' }
    ] },
    policeAide: { firstEpisode:'policeSearch', name: '경찰 보조', wage: 12, energy: 10, person: '민석', scene: 'opening-police', title: '비어 있는 체포 기록', text: '기록실의 첫 근무일. 어제 체포된 상인의 이름이 오늘 장부에서는 사라졌다.', opening: '내가 인계한 사람의 이름이 없어. 원본과 사본을 대조해 줄 수 있나? 누가 지웠는지도 기록해야 해.', options: [
      { id: 'help', reply: '원본을 찾아 함께 대조하겠습니다.', detail: '기력 −10 · 주민 지지 +3 · 수사 단서 기록', result: '민석과 기록 누락을 확인했다. 삭제된 이름의 사본을 수첩에 남겼다.' },
      { id: 'earn', reply: '오늘은 지시받은 기록 정리부터 하겠습니다.', detail: '소지금 +8 · 기력 −10', result: '추가 기록 업무의 수당을 받았다. 민석은 직접 원본을 찾으러 갔다.' }
    ] }
  };
  const api = { backgrounds, occupations };
  if (typeof module !== 'undefined') module.exports = api;
  root.Starts = api;
})(globalThis);
