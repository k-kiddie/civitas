'use strict';
(function(root) {
  const circles = {
    docks:{name:'부두의 비공개 소개',person:'도윤',scene:'storm-safe'},
    market:{name:'뒷시장의 거래 모임',person:'도윤',scene:'opening-factory'},
    nightlife:{name:'밤의 접객업 모임',person:'연우',scene:'hearing'},
    street:{name:'골목의 일거리',person:'은호',scene:'opening-factory'},
    records:{name:'기록과 정치의 뒷문',person:'서윤',scene:'opening-clerk'},
    barracks:{name:'군과 수사기관의 비공개 연락',person:'민석',scene:'opening-police'}
  };
  // Each route has its own first dilemma. Amounts are game resources, not real-world procedures.
  const catalog = {
    smuggler:{name:'밀수 운반책',circle:'docks',pay:22,risk:10,crime:true,hook:'약품을 기다리는 마을과 화물 소유자의 요구가 충돌한다.',careful:'수취인의 사정부터 확인하겠습니다.',bold:'의뢰받은 화물만 넘기겠습니다.'},
    information:{name:'정보상',circle:'records',pay:20,risk:8,crime:false,hook:'구매자가 정보와 함께 제보자의 이름도 요구한다.',careful:'사람의 이름을 빼고 사실만 넘기겠습니다.',bold:'이름까지 포함한 거래를 받아들이겠습니다.'},
    forger:{name:'문서 위조꾼',circle:'records',pay:24,risk:12,crime:true,hook:'의뢰한 서류가 다른 가족의 토지 권리를 빼앗는 데 쓰일 수 있다.',careful:'권리 다툼이 있는 의뢰는 거절하겠습니다.',bold:'의뢰인이 책임진다는 조건으로 받겠습니다.'},
    blackmarket:{name:'암시장 중개인',circle:'market',pay:22,risk:10,crime:true,hook:'약품이 부족한 상황에서 구매자가 물량을 독점하려 한다.',careful:'여러 진료소에 나눠 거래하겠습니다.',bold:'높은 값을 부른 구매자에게 넘기겠습니다.'},
    gambling:{name:'불법 도박장 운영자',circle:'nightlife',pay:25,risk:12,crime:true,hook:'오래된 손님이 감당하지 못할 빚을 지고도 계속 참여하려 한다.',careful:'오늘은 그 손님을 돌려보내겠습니다.',bold:'본인이 원한다면 계속 받겠습니다.'},
    enforcer:{name:'조직 행동대원',circle:'street',pay:23,risk:12,crime:true,hook:'조직이 지키라던 상점의 주인이 당신의 옛 동료다.',careful:'사정을 듣고 중재를 요청하겠습니다.',bold:'조직의 지시를 우선하겠습니다.'},
    fixer:{name:'뒷거래 해결사',circle:'records',pay:25,risk:11,crime:true,hook:'의뢰인이 분쟁 해결보다 상대의 침묵을 원한다.',careful:'양쪽이 동의하는 합의만 맡겠습니다.',bold:'의뢰인이 요구한 조건을 밀겠습니다.'},
    broker:{name:'정치 브로커',circle:'records',pay:26,risk:12,crime:true,hook:'후원자가 공직 추천의 대가로 비공개 약속을 요구한다.',careful:'추천 근거를 기록에 남기겠습니다.',bold:'비공개 약속을 받아들이겠습니다.'},
    sexWorker:{name:'성노동자',circle:'nightlife',pay:20,risk:7,crime:false,hook:'성인 손님이 사전에 합의하지 않은 조건을 요구한다. 당신은 경계를 정하거나 일을 거절할 수 있다.',careful:'제가 동의한 조건과 경계를 지켜 주세요.',bold:'이번 만남은 거절하고 돌아가겠습니다.'},
    companion:{name:'고급 접객인',circle:'nightlife',pay:22,risk:8,crime:false,hook:'연회 손님이 다른 손님의 사적인 대화를 전해 달라고 부탁한다.',careful:'접객은 하되 사적인 대화는 지키겠습니다.',bold:'사적인 정보 제공까지 포함한 제안을 받겠습니다.'},
    venueOwner:{name:'유흥업소 운영자',circle:'nightlife',pay:24,risk:9,crime:false,hook:'큰 손님이 종업원의 휴식과 합의한 근무 시간을 무시해 달라고 한다.',careful:'약속한 근무 시간과 거절 의사를 존중하겠습니다.',bold:'손님의 요구를 받되 추가 수당을 주겠습니다.'},
    fighter:{name:'불법 격투 선수',circle:'street',pay:24,risk:10,crime:true,hook:'후원자가 경기 결과에 관한 거래를 제안한다.',careful:'제 경기는 제가 결정하겠습니다.',bold:'후원자의 조건을 받아들이겠습니다.'},
    lender:{name:'사채업자',circle:'market',pay:21,risk:9,crime:true,hook:'채무자가 가족의 치료비 때문에 상환을 미뤄 달라고 한다.',careful:'이번 상환은 유예하겠습니다.',bold:'계약한 날짜대로 상환을 요구하겠습니다.'},
    collector:{name:'추심원',circle:'street',pay:21,risk:10,crime:true,hook:'채무자가 분할 상환을 제안하지만 의뢰인은 일괄 지급을 원한다.',careful:'분할 상환안을 의뢰인에게 전달하겠습니다.',bold:'의뢰인의 일괄 지급 요구를 고수하겠습니다.'},
    fence:{name:'장물 중개인',circle:'market',pay:23,risk:11,crime:true,hook:'반입된 물건에 실종된 이웃의 이름이 새겨져 있다.',careful:'거래를 멈추고 출처부터 확인하겠습니다.',bold:'물건을 맡긴 사람의 설명을 믿겠습니다.'},
    tombRaider:{name:'도굴꾼',circle:'street',pay:25,risk:12,crime:true,hook:'발견물이 마을 공동 묘역의 일부라는 주장이 제기됐다.',careful:'마을의 설명을 듣고 작업을 멈추겠습니다.',bold:'의뢰 계약이 우선이라고 주장하겠습니다.'},
    unlicensedMedic:{name:'무면허 치료사',circle:'market',pay:18,risk:9,crime:true,hook:'도움이 필요한 환자가 당신의 능력 범위를 넘는 상태다.',careful:'정식 진료소로 연결하고 이송을 돕겠습니다.',bold:'제 손으로 끝까지 돌보겠습니다.'},
    drugTrader:{name:'금지 약물 거래상',circle:'market',pay:27,risk:14,crime:true,hook:'단골 구매자의 가족이 거래를 중단해 달라고 찾아왔다.',careful:'그 사람과의 거래를 중단하겠습니다.',bold:'성인 구매자의 요청에 따라 거래하겠습니다.'},
    counterfeiter:{name:'위조 화폐 제작자',circle:'records',pay:27,risk:15,crime:true,hook:'조직이 약속보다 더 많은 물량을 떠넘기며 책임도 요구한다.',careful:'약속 밖의 추가 의뢰는 거절하겠습니다.',bold:'추가 보수를 받고 의뢰를 받겠습니다.'},
    burglar:{name:'잠입 절도범',circle:'street',pay:24,risk:13,crime:true,hook:'의뢰 대상의 집에 예상하지 못한 사람이 남아 있다.',careful:'이번 의뢰를 포기하겠습니다.',bold:'일정을 바꿔 의뢰를 계속 맡겠습니다.'},
    escapeAgent:{name:'탈옥 알선인',circle:'barracks',pay:26,risk:14,crime:true,hook:'의뢰인이 숨겼던 혐의가 뒤늦게 드러났다.',careful:'확인할 때까지 의뢰를 멈추겠습니다.',bold:'약속한 계약을 계속 맡겠습니다.'},
    bountyHunter:{name:'현상금 사냥꾼',circle:'barracks',pay:23,risk:9,crime:false,hook:'대상자가 의뢰인의 주장과 다른 증언을 내놓았다.',careful:'증언을 기록하고 사실을 확인하겠습니다.',bold:'의뢰인의 설명대로 인계하겠습니다.'},
    informant:{name:'경찰 정보원',circle:'barracks',pay:20,risk:10,crime:false,hook:'수사관이 무관한 동료의 이름까지 보고서에 넣으라고 한다.',careful:'제가 확인한 사실만 진술하겠습니다.',bold:'담당 수사관의 요청대로 보고하겠습니다.'},
    electionOperative:{name:'선거 공작원',circle:'records',pay:25,risk:13,crime:true,hook:'후보가 확인되지 않은 상대 후보의 소문을 퍼뜨리라고 한다.',careful:'확인된 주장만 전달하겠습니다.',bold:'후보의 요청을 따르겠습니다.'},
    supplyThief:{name:'군수품 횡령 조직원',circle:'barracks',pay:28,risk:15,crime:true,hook:'거래 물량을 빼면 옛 동료 부대의 보급이 부족해진다.',careful:'이번 거래는 멈추겠습니다.',bold:'조직이 정한 거래를 계속하겠습니다.'},
    sectPreacher:{name:'사이비 종교 설교자',circle:'nightlife',pay:21,risk:10,crime:false,hook:'후원자가 헌금과 조직 운영 내역을 공개하지 말라고 요구한다.',careful:'헌금 사용 내역을 공개하겠습니다.',bold:'후원자의 조건대로 비공개로 운영하겠습니다.'}
  };
  function fresh(){return {role:null,completed:[],discovered:[],missions:{},heat:0,exposure:0,trust:0,lastWork:0,lastExplore:0,seed:0x713a91};}
  function canAct(state){return state.age>=18&&!state.underReview&&!state.hearing;}
  function encounter(id,state,mission=false){
    const role=catalog[id],circle=circles[role.circle];
    return {id:(mission?'under-mission-':'under-offer-')+id,day:state.day,scene:circle.scene,title:mission?role.name+'의 첫 의뢰':'공개 공고에는 없는 제안',text:mission?role.hook:circle.name+'에서 '+role.name+' 일을 소개받았다. 주간 직업은 유지할 수 있다.',destination:'jobs',underworldRole:id,underworldMission:mission,
      dialogue:[{speaker:circle.person,text:mission?role.hook:'여기서는 '+role.name+' 일을 소개해. 수입만큼 사람과의 약속, 노출도 감당해야 해. 원치 않으면 거절해도 돼.'}]};
  }
  function choices(state,event){
    if(event.underworldReview==='privacy')return [{id:'affirm',title:'개인 활동과 공적 업무를 구분해 설명한다',detail:'사생활 노출 −40 · 지지 −2 · 직업 유지',disabled:false},{id:'leave',title:'당분간 음지 활동을 멈춘다',detail:'음지 직업 종료 · 사생활 노출 20으로 감소',disabled:false}];
    if(event.underworldReview)return [{id:'cooperate',title:'기록을 정리하고 해명한다',detail:'개인 비용 15 · 수사 주목도 −40',disabled:state.cash<15},{id:'leave',title:'음지 활동을 중단한다',detail:'현재 음지 직업 종료 · 신뢰 −5 · 수사 주목도 20으로 감소',disabled:false}];
    const role=catalog[event.underworldRole];
    if(event.underworldMission && state.underworld.role!==event.underworldRole)return [{id:'cancel',title:'이 의뢰는 이미 취소됐습니다.',detail:'현재 활동 유지',disabled:false}];
    if(!event.underworldMission)return [{id:'accept',title:'조건을 듣고 이 일을 시작하겠습니다.',detail:'정식 직업 유지 · 다음 날 첫 의뢰',disabled:!canAct(state)||Boolean(state.underworld.role)},{id:'decline',title:'지금은 이 제안을 받지 않겠습니다.',detail:'정식 직업과 현재 상태 유지',disabled:false}];
    return [{id:'careful',title:role.careful,detail:'기력 8 · 신뢰 +5 · 보수 8 · 낮은 노출',disabled:state.energy<8},{id:'bold',title:role.bold,detail:event.underworldRole==='sexWorker'?'만남 거절 · 보수 없음 · 경계 존중':'기력 8 · 보수 '+role.pay+' · 신뢰 −3 · 노출 증가',disabled:event.underworldRole==='sexWorker'?false:state.energy<8},{id:'quit',title:'이 일을 그만두겠습니다.',detail:'음지 직업 종료 · 정식 직업 유지',disabled:false}];
  }
  function reply(event,id){
    if(event.underworldReview==='privacy')return {reply:id==='affirm'?'제 개인 생활과 공적 업무를 구분해 설명하겠습니다.':'당분간 활동을 멈추겠습니다.',speaker:'연우',reaction:'당신의 사생활과 선택이 존중되도록 기록해 둘게요.'};
    if(event.underworldReview)return {reply:id==='cooperate'?'기록을 정리하고 해명하겠습니다.':'음지 활동을 중단하겠습니다.',speaker:'민석',reaction:'이번 답변과 남은 기록을 보관하겠습니다.'};
    const role=catalog[event.underworldRole],circle=circles[role.circle];
    return {reply:event.underworldMission?(id==='careful'?role.careful:id==='bold'?role.bold:'이 일을 그만두겠습니다.'):(id==='accept'?'이 일을 시작하겠습니다.':'지금은 받지 않겠습니다.'),speaker:circle.person,reaction:id==='quit'||id==='decline'?'알겠어. 그 결정은 존중할게.':event.underworldRole==='sexWorker'?'동의한 조건과 거절 의사를 기록해 둘게.':'이번 선택과 약속을 기억하겠어.'};
  }
  function resolve(state,event,id){
    const under=state.underworld;
    if(event.underworldReview==='privacy'){
      if(id==='affirm'){under.exposure=Math.max(0,under.exposure-40);state.support=Math.max(0,state.support-2);return '사생활에 관한 질문에 답했다. 개인 활동을 계속하고 공적 업무와 구분하기로 했다.';}
      under.role=null;under.exposure=20;return '개인 활동을 쉬기로 했다. 정식 직업은 유지된다.';
    }
    if(event.underworldReview){
      if(id==='cooperate'){state.cash-=15;under.heat=Math.max(0,under.heat-40);return '해명 비용 15를 부담하고 수사 주목도를 낮췄다. 과거 활동 기록은 남는다.';}
      under.role=null;under.heat=20;under.trust=Math.max(0,under.trust-5);return '음지 활동을 중단했다. 정식 직업은 유지된다.';
    }
    const role=catalog[event.underworldRole];
    if(id==='cancel')return '이전 의뢰는 취소됐다. 현재 활동은 유지된다.';
    if(!event.underworldMission){
      if(id==='decline')return '이번 소개를 거절했다. 나중에 아는 연락망에서 다시 조건을 들을 수 있다.';
      under.role=event.underworldRole;
      if(under.completed.includes(event.underworldRole)){under.missions[event.underworldRole]='complete';return role.name+' 연락망과 다시 일하기로 했다. 첫 의뢰는 반복하지 않는다.';}
      under.missions[event.underworldRole]='pending';
      state.followUps.push({type:'underworld',role:event.underworldRole,day:state.day+1});
      return role.name+' 일을 병행하기 시작했다. 다음 날 첫 의뢰가 온다.';
    }
    if(id==='quit'){under.role=null;under.missions[event.underworldRole]='quit';return '음지 일을 그만뒀다. 이미 한 약속과 사람의 기억은 남는다.';}
    under.missions[event.underworldRole]='complete';
    if(!under.completed.includes(event.underworldRole))under.completed.push(event.underworldRole);
    if(event.underworldRole==='sexWorker'&&id==='bold')return '합의하지 않은 조건을 거절했다. 수입은 없지만 이번 만남은 종료됐다.';
    state.energy-=8;
    state.cash+=id==='careful'?8:role.pay;
    under.trust=Math.max(0,Math.min(100,under.trust+(id==='careful'?5:-3)));
    const risk=id==='careful'?2:role.risk;
    if(role.crime)under.heat=Math.min(100,under.heat+risk);else under.exposure=Math.min(100,under.exposure+risk);
    if(id==='bold')state.support=Math.max(0,state.support-3);
    if(event.underworldRole==='supplyThief'&&id==='bold')state.institution.supplies=Math.max(0,state.institution.supplies-10);
    return '첫 의뢰의 선택이 기록됐다. 보수 '+(id==='careful'?8:role.pay)+' · '+(role.crime?'수사 주목도':'사생활 노출')+' +'+risk+'.';
  }
  function review(state){
    if(state.underworld.exposure>=60&&!state.eventQueue.some(event=>event.underworldReview)){
      state.eventQueue.push({id:'under-privacy-'+state.day,day:state.day,scene:'hearing',title:'사적인 삶에 관한 질문',text:'개인 활동이 알려지면서 주변에서 질문이 들어왔다. 동의와 업무 경계를 분명하게 설명할 수 있다.',destination:'jobs',underworldReview:'privacy',dialogue:[{speaker:'연우',text:'사람들이 당신의 개인 활동을 묻고 있어요. 설명할지, 잠시 쉴지는 당신이 정해요.'}]});
    }
    if(state.underworld.heat<60||state.eventQueue.some(event=>event.underworldReview))return;
    state.eventQueue.push({id:'under-review-'+state.day,day:state.day,scene:'opening-police',title:'활동의 흔적을 묻는 사람',text:'비공개 거래가 쌓여 수사기관이 해명을 요구했다.',destination:'jobs',underworldReview:true,dialogue:[{speaker:'민석',text:'거래 기록에 당신의 이름이 반복해서 나옵니다. 자료를 정리해 해명하거나 활동을 중단해야 합니다.'}]});
  }
  function act(state,action){
    if(!['exploreUnderworld','underworldWork','leaveUnderworld','revisitUnderworld'].includes(action.type))return null;
    const fail=message=>({ok:false,state,message});
    if(!canAct(state))return fail('현재 심사를 마친 뒤 활동할 수 있다.');
    const under=state.underworld;
    if(action.type==='leaveUnderworld'){
      if(!under.role)return fail('현재 병행 중인 음지 직업이 없다.');
      const previous=under.role;
      under.role=null;under.missions[previous]='quit';
      state.followUps=state.followUps.filter(item=>item.type!=='underworld');
      return {ok:true,state,message:'음지 일을 중단했다. 정식 직업과 과거 활동 기록은 유지된다.'};
    }
    if(state.actions<1)return fail('행동이 부족하다.');
    if(action.type==='underworldWork'){
      const role=catalog[under.role];
      if(!role||under.missions[under.role]!=='complete'||under.lastWork===state.day||state.energy<12)return fail('첫 의뢰·기력·일정 조건을 확인하자.');
      state.actions--;state.energy-=12;under.lastWork=state.day;state.cash+=role.pay;
      if(role.crime)under.heat=Math.min(100,under.heat+role.risk);else under.exposure=Math.min(100,under.exposure+role.risk);
      if(role.crime&&['official','soldier','defenseMinister','investigator'].includes(state.career))state.institution.scrutiny+=5;
      review(state);
      return {ok:true,state,message:role.name+' 활동으로 '+role.pay+'크라운을 벌었다. '+(role.crime?'수사 주목도':'사생활 노출')+'가 늘었다.'};
    }
    if(under.role)return fail('새 일을 시작하려면 현재 음지 활동부터 마무리하자.');
    if(action.type==='revisitUnderworld'){
      if(!under.discovered.includes(action.role))return fail('아직 만나지 않은 연락망이다.');
      state.actions--;state.eventQueue.push(encounter(action.role,state));
      return {ok:true,state,message:'알고 있는 연락망에 다시 만남을 요청했다.'};
    }
    if(!circles[action.circle]||state.energy<8||under.lastExplore===state.day)return fail('모임·기력·하루 탐색 횟수를 확인하자.');
    if(action.circle==='barracks'&&!(state.skills.investigation>=1))return fail('군·수사 연락에는 조사 훈련이 필요하다.');
    const candidates=Object.keys(catalog).filter(id=>catalog[id].circle===action.circle&&!under.discovered.includes(id));
    if(!candidates.length)return fail('이 모임의 연락망은 모두 만났다.');
    under.seed=(Math.imul(under.seed,1664525)+1013904223)>>>0;
    const id=candidates[under.seed%candidates.length];
    state.actions--;state.energy-=8;under.lastExplore=state.day;under.discovered.push(id);state.eventQueue.push(encounter(id,state));
    return {ok:true,state,message:'비공개 소개자를 만났다. 수락 여부는 직접 결정할 수 있다.'};
  }
  const api={catalog,circles,fresh,encounter,choices,reply,resolve,review,act};
  if(typeof module!=='undefined')module.exports=api;
  root.Underworld=api;
})(globalThis);
