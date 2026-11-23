'use strict';
(function(root){
  const actor=state=>state.life.activeId||'player';
  const templates={
    workshop:{name:'멈춰야 할 작업대',jobs:['worker','apprentice','artisan','farmer'],scene:'opening-factory',people:['story-eunho','story-yun'],skill:'craft',
      opening:'일감을 끝내야 품삯을 받는 동료가 위험한 설비를 그대로 돌리자고 한다.',
      lines:['멈추면 오늘 일감은 밀려. 그래도 이 소리는 평소와 달라. 네가 직접 확인해 줄래?','수리를 주장하려면 고장 기록이 필요해. 일정만 맞추자는 사람도 있어.'],
      conflict:'밀린 일감의 책임',conflictLine:'고장 기록을 공개하면 작업이 멈추고 우리 책임도 드러나. 네 돈으로 임시 수리를 돕거나, 그냥 일정대로 돌렸다고 적을 수도 있겠지.',
      report:'고장 기록을 공개하고 작업 중단을 요구한다',compromise:'개인 돈으로 임시 수리를 돕고 재점검을 약속한다',conceal:'문제없이 가동했다고 기록한다',
      promise:'설비 재점검',result:'작업대의 다음 계절',reportResult:'설비 결함과 작업 중단 사유가 기록에 남았다. 동료들은 위험을 알게 됐지만 일감을 맡긴 쪽은 공개 방식에 반발했다.',compromiseResult:'임시 수리 뒤 재점검을 마쳤다. 네 개인 돈과 노동이 들었고, 이 작은 작업대에서 합의한 방식을 유지했다.',concealResult:'현장의 이상을 지운 기록을 동료가 찾아냈다. 일정을 지켜 준 사람의 호의는 얻었지만 현장 동료의 신뢰를 잃었다.'},
    trade:{name:'약속한 가격의 겨울',jobs:['trader'],scene:'storm-safe',people:['story-sora','story-doyun'],skill:'commerce',
      opening:'물자가 부족해지자 납품 상대가 이미 말한 가격을 바꾸자고 한다. 주민들은 네 말을 믿고 구매를 기다린다.',
      lines:['처음 말한 가격을 믿고 다른 상점을 찾지 않았어요. 납품 조건을 확인해 줄래요?','새 가격으로 팔면 거래처와는 편해지겠죠. 기다린 사람들에게 무슨 말을 할지도 정해야 해요.'],
      conflict:'거래처가 내민 새 조건',conflictLine:'거래처는 인상된 가격을 원해요. 원래 조건을 공개하거나, 차액 일부를 직접 부담해 수량과 가격을 다시 합의할 수도 있어요. 예전 약속이 없었다고 말할 건가요?',
      report:'처음 거래 조건을 공개해 가격 변경에 이의를 제기한다',compromise:'개인 돈으로 차액을 보태고 제한 수량을 합의한다',conceal:'처음부터 새 가격에 합의했다고 기록한다',
      promise:'다음 납품 조건 확인',result:'다시 문을 두드리는 고객',reportResult:'처음 조건이 공개되어 주민은 가격 변경 과정을 알게 됐다. 거래처는 너의 공개 방식 때문에 다음 거래를 경계한다.',compromiseResult:'개인 부담으로 합의한 수량과 가격을 확인했다. 주민과 거래처의 관계는 지켰지만 모든 물가를 바꾼 것은 아니다.',concealResult:'옛 가격을 적은 쪽지를 고객이 가져왔다. 거래처의 호의는 얻었지만 말을 바꾼 상인이라는 기억이 남았다.'},
    care:{name:'명단에 없는 사람들',jobs:['medic','teacher'],scene:'opening-clerk',people:['story-dasol','story-seoyun'],skill:'care',
      opening:'돌봄과 배움이 필요한 이웃이 명단에서 빠졌다. 담당 동료는 실수가 드러나면 다음 모임까지 사라질까 두려워한다.',
      lines:['명단에 없다는 이유로 돌아갔어요. 이름을 함부로 알리고 싶진 않지만 누락된 이유는 알고 싶어요.','이름을 가린 수요 기록을 만들면 절차를 따질 수 있어요. 담당자의 설명만 믿고 넘어갈 수도 있고요.'],
      conflict:'사람을 지킬 것인가, 기록을 지킬 것인가',conflictLine:'담당자는 누락 사실을 조용히 덮자고 해요. 익명 기록으로 정정을 요구하거나, 개인 돈으로 작은 보충 모임을 열 수 있어요. 누락이 없었다는 서명도 요구받았어요.',
      report:'이름을 가린 기록으로 명단 정정을 요구한다',compromise:'개인 돈으로 보충 모임을 열고 참여를 확인한다',conceal:'누락된 사람이 없었다고 서명한다',
      promise:'누락된 이웃의 참여 확인',result:'다음 모임의 빈 의자',reportResult:'이름을 가린 누락 기록과 정정 요구가 남았다. 이웃은 자기 상황이 들렸다고 느꼈지만 담당 동료는 책임을 공개한 너를 경계한다.',compromiseResult:'작은 보충 모임에서 참여를 확인했다. 개인 부담으로 해결한 범위는 남고, 도시 전체의 제도를 고친 것으로 처리하지 않는다.',concealResult:'돌아갔던 이웃이 누락 없음이라는 서명을 보았다. 담당 동료의 체면은 지켰지만 도움을 요청한 사람의 신뢰를 잃었다.'},
    civil:{name:'바뀐 접수 순서',jobs:['official'],scene:'opening-clerk',people:['story-seoyun','story-personnel'],skill:'administration',
      opening:'동료가 유력 인사의 신청을 먼저 올려 달라고 한다. 기다린 주민의 접수증에는 더 이른 날짜가 적혀 있다.',
      lines:['내 접수증 날짜와 처리 순서가 달라요. 누구를 벌주라는 게 아니라 무엇이 바뀌었는지 알고 싶어요.','접수 기록을 대조하면 순서가 드러날 거예요. 담당자는 우선 자기 설명을 믿어 달라고 했어요.'],
      conflict:'같은 사무실의 압력',conflictLine:'인사 담당자는 내부 일을 밖으로 꺼내지 말라고 해요. 기록으로 정정을 요구하거나 개인 시간을 들여 별도 안내를 마련할 수 있어요. 원래 순서였다고 서명하라는 부탁도 왔어요.',
      report:'접수 기록으로 순서 정정을 요구한다',compromise:'개인 돈으로 보충 안내를 마련하고 결과를 확인한다',conceal:'처음부터 올바른 순서였다고 서명한다',
      promise:'대기 주민의 안내 결과 확인',result:'서명 아래 남은 이름',reportResult:'접수 순서의 불일치를 문서로 남겼다. 주민의 신뢰는 얻었지만 같은 사무실의 동료는 공개 방식에 반발했다.',compromiseResult:'개인 부담으로 보충 안내와 확인을 마쳤다. 주민과 동료의 관계는 지켰고 기관 예산을 임의로 쓰지 않았다.',concealResult:'옛 접수증이 네 서명과 함께 다시 제출됐다. 동료의 호의는 얻었지만 기록의 신뢰를 잃었다.'},
    military:{name:'준비됐다는 보고',jobs:['soldier'],scene:'opening-police',people:['story-officer','story-minseok'],skill:'investigation',
      opening:'현장 동료는 훈련 준비가 부족하다고 말한다. 보고 담당자는 부대 평가를 위해 준비 완료 서명을 부탁한다.',
      lines:['사람도 장비도 아직 맞춰 보지 못했어. 준비됐다는 말이 먼저 올라가면 현장에서 버텨야 하는 건 우리야.','현장 점검 기록을 남길래? 아니면 보고 담당자의 설명을 먼저 믿겠어?'],
      conflict:'동료와 보고 계통 사이',conflictLine:'지금 정정을 요구하면 보고 담당자와 틀어질 수 있어. 개인 돈과 시간을 보태 소규모 확인을 돕는 길도 있어. 군수품 구매나 훈련 명령을 네 마음대로 승인할 수는 없어.',
      report:'현장 점검 기록으로 보고 정정을 요구한다',compromise:'개인 돈으로 현장 동료의 준비 확인을 돕는다',conceal:'준비가 끝났다고 서명한다',
      promise:'현장 준비 확인',result:'보고서를 다시 읽는 날',reportResult:'준비 부족과 정정 요구를 기록했다. 현장 동료의 신뢰는 얻었지만 보고 담당자는 네 방식에 반발했다.',compromiseResult:'개인 부담의 작은 준비 확인을 마쳤다. 동료와 보고 담당자의 관계는 지켰으며 부대 전체 준비도나 군수품을 조작하지 않았다.',concealResult:'확인되지 않은 준비 완료 서명이 현장 기록과 대조됐다. 보고 담당자의 호의는 얻었지만 현장 동료의 신뢰를 잃었다.'}
  };
  const clamp=n=>Math.max(0,Math.min(100,n));
  function restore(state){
    state.life.chronicles={nextId:1,runs:[],...state.life.chronicles};
    for(const run of state.life.chronicles.runs)if(run.actor!==actor(state)&&run.status==='active'){run.status='archived';run.closedDay=state.day;run.result='조작 인물이 바뀌어 이전 인물의 미완료 이야기로 보관했다.';}
  }
  function current(state){return state.life.chronicles?.runs.find(run=>run.actor===actor(state)&&run.status==='active');}
  function belongs(state,run){
    if(state.career!==run.career)return false;
    if(!run.department)return true;
    let department=run.department;const seen=new Set();
    while(!state.agencies[department]&&!seen.has(department)){
      seen.add(department);const merger=(state.agencyHistory||[]).find(item=>item.status==='enacted'&&item.type==='mergeAgency'&&item.source===department&&item.resolvedDay>=run.startedDay);
      if(!merger)break;department=merger.target;
    }
    return Boolean(state.agencies[department])&&state.institution.department===department;
  }
  function availability(state,id){
    const t=templates[id];
    if(!t||!t.jobs.includes(state.career))return '현재 직업의 이야기가 아니다';
    if(!state.startConfigured||state.day<28||!['none','complete'].includes(state.jobStory.stage))return '첫 지역 이야기를 마친 28일부터 가능';
    if(state.hearing||state.underReview||state.agencyProposal||state.eventQueue.length)return '진행 중인 사건과 심사를 먼저 마치자';
    if(current(state))return '맡은 장기 이야기를 먼저 마치거나 내려놓자';
    if(state.life.chronicles.runs.some(run=>run.actor===actor(state)&&run.template===id))return '이 인물로 이미 경험한 이야기';
    if(t.people.some(person=>!state.life.people[person]))return '관련 인물이 아직 연결되지 않았다';
    if(['official','soldier'].includes(state.career)&&state.agencies[state.institution.department]?.branch!==(state.career==='soldier'?'military':'civil'))return '해당 기관에 재직 중이어야 한다';
    if(state.actions<1||state.energy<5)return '행동 1 · 기력 5 필요';
    return '';
  }
  function runFor(state,event){return state.life.chronicles.runs.find(run=>run.id===event.chronicle?.run);}
  function valid(state,event){const run=runFor(state,event);return run&&run.actor===actor(state)&&run.status==='active'&&run.stage===event.chronicle.stage&&run.eventId===event.id;}
  function relation(state,run,index,delta,text){
    const p=state.life.people[run.people[index]];if(!p)return;
    p.relationship=clamp(p.relationship+delta);
    p.history.push({day:state.day,type:'relationship',actor:run.actor,text});
    if(p.councilId){const member=state.council.chamber?.members.find(m=>m.id===p.councilId);if(member)member.relationship=p.relationship;if(state.council.people[p.councilId])state.council.people[p.councilId].relationship=p.relationship;}
  }
  function log(state,run,text){
    const p=state.life.people[run.actor];p.history.push({day:state.day,type:'career',text});
    state.life.news.unshift({day:state.day,person:run.actor,text:p.name+' · '+text});
  }
  function close(state,run,result,status='complete'){run.status=status;run.closedDay=state.day;run.result=result;run.dueDay=null;log(state,run,result);}
  function offer(state,run){
    const t=templates[run.template],departed=!belongs(state,run);const names=run.people.map(id=>state.life.people[id]?.name||'이전 동료');
    let title,text,dialogue;
    if(departed){title='직장을 떠난 뒤의 연락';text='직업이 바뀌었어도 함께 맡았던 일의 기록은 남는다.';dialogue=[{speaker:names[0],text:'일을 떠났다는 소식을 들었어요. 남은 확인은 다른 담당자에게 넘길까요? 당신이 선택했던 기록까지 없어지는 것은 아니에요.'}];}
    else if(run.stage===0){title=t.name;text=t.opening;dialogue=t.lines.map(line=>({speaker:names[0],text:line}));const p=state.life.people[run.people[0]];if(p.history.some(h=>h.type==='relationship'&&(h.actor??'player')===run.actor))dialogue.unshift({speaker:names[0],text:p.relationship>=60?'전에 함께했던 일을 기억해요. 그래서 이번에도 당신을 찾아왔어요.':'전에 나눈 이야기와 달라진 관계도 기억해요. 이번에는 실제로 무엇을 하는지 지켜볼게요.'});}
    else if(run.stage===1){title=t.conflict;text='처음 선택과 확보한 기록이 이번 선택의 조건이 된다.';dialogue=[{speaker:names[1],text:t.conflictLine},{speaker:names[0],text:run.evidence?'직접 확인한 기록이 남아 있어요. 그걸 어떻게 쓸지는 당신에게 달렸어요.':'아직 직접 대조한 기록은 없어요. 지금이라도 확인하거나, 기록 없이 타협해야 해요.'}];}
    else {title=t.result;text='몇 달 전 결정의 결과가 같은 사람들에게 돌아온다.';const body=run.route==='report'?t.reportResult:run.route==='compromise'?t.compromiseResult:t.concealResult;
      dialogue=[{speaker:names[0],text:body},{speaker:names[1],text:run.route==='compromise'?t.promise+' 약속을 이제 마칠 건가요? 기력 8이 더 필요해요.':run.route==='report'?'처음 기록과 지금 결과를 함께 남길 건가요? 반발한 사람의 기억도 사라지지 않아요.':'서명을 바로잡고 책임을 인정할 수도 있어요. 이미 받은 호의와 잃은 신뢰가 전부 사라지지는 않겠죠.'}];}
    run.offerNo=(run.offerNo||0)+1;
    const event={id:'chronicle-'+run.id+'-'+run.stage+'-'+run.offerNo+(departed?'-departure':''),day:state.day,chronicle:{run:run.id,stage:run.stage,departed,template:run.template,speaker:names[run.stage===1?1:0]},scene:t.scene,title,text,destination:'jobs',dialogue};
    run.eventId=event.id;state.eventQueue.push(event);
  }
  function choices(state,event){
    const run=runFor(state,event);if(!valid(state,event))return [{id:'close',title:'이전 기록을 닫는다',detail:'현재 인물의 돈·관계에 영향 없음',disabled:false}];
    const t=templates[run.template],inactive=event.chronicle.departed||!belongs(state,run);
    if(inactive)return [{id:'handoff',title:'확보한 기록과 남은 일을 인계한다',detail:'이전 선택과 지출 보존 · 책임 있게 인계 · 추가 보상 없음',disabled:false},{id:'abandon',title:'후속 확인 없이 관계를 끊는다',detail:'먼저 도움을 청한 인물 관계 −8 · 이전 선택과 지출 보존',disabled:false}];
    const result=run.stage===0?[
      {id:'document',title:'직접 확인하고 기록을 남긴다',detail:'기력 10 · 확인 기록 확보 · 요청자 관계 +3',energy:10},
      {id:'trust',title:'동료의 설명을 믿고 먼저 진행한다',detail:'기력 3 · 확인 기록 없음 · 상대 담당자 관계 +4',energy:3},
      {id:'decline',title:'이번 일은 맡지 않겠다',detail:'추가 비용 없음 · 이번 이야기 종료'}
    ]:run.stage===1?[
      {id:'report',title:t.report,detail:'확인 기록 필요 · 기력 8 · 요청자 관계 +6 · 담당자 관계 −8',energy:8,needsEvidence:true},
      ...(!run.evidence?[{id:'verify',title:'지금이라도 기록을 대조한다',detail:'개인 돈 8 · 기력 10 · 확인 기록 확보 후 같은 결정으로 돌아옴',cash:8,energy:10}]:[]),
      {id:'compromise',title:t.compromise,detail:'개인 돈 12 · 기력 5 · 90일 뒤 이행 확인 · 두 사람 관계 35 필요 · 관계 +2',cash:12,energy:5},
      {id:'conceal',title:t.conceal,detail:'개인 수입 없음 · 담당자 관계 +6 · 90일 뒤 기록 대조'}
    ]:run.route==='conceal'?[
      {id:'correct',title:'내 서명을 정정하고 책임을 인정한다',detail:'기력 8 · 요청자 관계 +2 · 담당자 관계 −6 · 지지 −2',energy:8},
      {id:'doubleDown',title:'기존 서명을 끝까지 유지한다',detail:'요청자 관계 −12 · 담당자 관계 +2 · 지지 −5'}
    ]:[
      {id:'finish',title:run.route==='compromise'?'약속한 후속 확인을 직접 마친다':'결과와 반발까지 내 경력에 남긴다',detail:run.route==='compromise'?'기력 8 · 두 사람 관계 +4 · 관련 훈련 인정':'기력 8 · 요청자 관계 +4 · 담당자 관계 −4 · 지지 +4 · 관련 훈련 인정',energy:8},
      {id:'leave',title:'더는 확인을 맡지 않겠다고 알린다',detail:'요청자 관계 −8 · 약속은 미완료 · 추가 훈련 없음'}
    ];
    if((run.postponements||0)<2)result.push({id:'postpone',title:'준비할 시간을 달라고 부탁한다',detail:'7일 뒤 다시 연락 · 추가 비용 없음 · 이야기당 두 번 가능'});
    return result.map(c=>({...c,disabled:state.energy<(c.energy||0)||state.cash<(c.cash||0)||(c.needsEvidence&&!run.evidence)||(c.id==='compromise'&&run.people.some(id=>state.life.people[id].relationship<35))}));
  }
  function reply(event,id){const replies={document:'직접 확인하고 기록을 남기겠습니다.',trust:'우선 동료의 설명을 믿고 진행하겠습니다.',decline:'이번 일은 맡지 않겠습니다.',report:'기록을 근거로 정정을 요구하겠습니다.',verify:'지금이라도 기록을 대조하겠습니다.',compromise:'제 돈으로 작은 합의를 마련하고 확인하겠습니다.',conceal:'문제가 없었다고 서명하겠습니다.',correct:'내 서명을 바로잡고 책임을 인정하겠습니다.',doubleDown:'처음 서명을 유지하겠습니다.',finish:'결과를 확인하고 내 경력에 남기겠습니다.',leave:'더는 후속 확인을 맡지 않겠습니다.',handoff:'기록과 남은 일을 인계하겠습니다.',abandon:'이 일에서는 손을 떼겠습니다.',close:'이전 기록을 닫겠습니다.',postpone:'준비할 시간을 조금 더 주십시오.'};const t=templates[event.chronicle?.template];return {reply:({report:t?.report,compromise:t?.compromise,conceal:t?.conceal})[id]||replies[id]||'기록을 확인하겠습니다.',speaker:event.chronicle?.speaker||'함께한 동료',reaction:id==='postpone'?'7일 뒤 다시 연락하겠습니다. 준비한 뒤 이야기해요.':id==='report'?'기록이 공개된 일은 도움을 청한 사람과 책임을 지적받은 사람이 다르게 기억할 겁니다.':id==='compromise'?'개인 돈으로 마련한 합의와 남은 확인을 기록하겠습니다.':id==='conceal'?'문제가 없었다는 당신의 서명을 남기겠습니다. 다음 기록 대조 때도 이 이름이 남습니다.':'당신의 답변과 실제로 한 일을 함께 기억하겠습니다.'};}
  function resolve(state,event,id){
    if(!valid(state,event))return '이전 인물의 기록을 닫았다. 현재 인물에게 효과를 적용하지 않았다.';
    const run=runFor(state,event),t=templates[run.template],c=choices(state,event).find(c=>c.id===id);
    if(!c||c.disabled)return '선택 조건이 바뀌었다.';
    state.cash-=c.cash||0;state.energy-=c.energy||0;
    run.choices.push({day:state.day,stage:run.stage,id,cash:c.cash||0,energy:c.energy||0});
    const own=state.life.people[run.actor];
    if(id==='handoff'||id==='abandon'){if(id==='abandon')relation(state,run,0,-8,t.name+'의 후속 연락을 끊었다.');close(state,run,t.name+' · '+(id==='handoff'?'직업을 떠난 뒤 기록과 남은 일을 인계했다.':'후속 연락 없이 일을 내려놓았다.'),'departed');return run.result;}
    if(id==='decline'){close(state,run,t.name+' · 이번 일을 맡지 않았다.','declined');return run.result;}
    if(id==='postpone'){run.postponements=(run.postponements||0)+1;run.eventId=null;run.dueDay=state.day+7;log(state,run,t.name+' · 준비를 위해 다음 연락을 '+run.dueDay+'일로 미뤘다.');return '7일 뒤 다시 연락한다. 지출과 이전 선택은 유지한다.';}
    if(id==='verify'){
      run.evidence=true;run.eventId=null;run.dueDay=state.day;log(state,run,t.name+' · 개인 돈 8로 뒤늦게 기록을 대조했다.');return '확인 기록을 확보했다. 대화를 마치면 정정·타협·서명 중 다시 선택할 수 있다.';
    }
    if(run.stage===0){
      run.evidence=id==='document';relation(state,run,id==='document'?0:1,id==='document'?3:4,t.name+' · 첫 대응 '+c.title);run.stage=1;run.dueDay=state.day+14;
    }else if(run.stage===1){
      run.route=id;run.stage=2;run.dueDay=state.day+90;
      if(id==='report'){relation(state,run,0,6,t.name+'의 기록 정정을 요구했다.');relation(state,run,1,-8,t.name+'의 내부 일을 공개했다.');}
      if(id==='compromise'){relation(state,run,0,2,t.name+'의 후속 확인을 약속했다.');relation(state,run,1,2,t.name+'에 자기 돈 12를 사용해 타협했다.');}
      if(id==='conceal')relation(state,run,1,6,t.name+'의 문제없음 서명을 했다.');
    }else{
      if(id==='finish'){
        relation(state,run,0,4,t.name+'의 결과 확인을 마쳤다.');relation(state,run,1,run.route==='report'?-4:4,t.name+'의 결과를 기억한다.');
        if(run.route==='report')state.support=clamp(state.support+4);
        // A first qualification, never unlimited ranks or public office promotions.
        state.skills[t.skill]=Math.max(1,state.skills[t.skill]||0);
      }else if(id==='correct'){relation(state,run,0,2,t.name+'의 서명을 정정했다.');relation(state,run,1,-6,t.name+'의 서명을 뒤늦게 정정했다.');state.support=clamp(state.support-2);}
      else if(id==='doubleDown'){relation(state,run,0,-12,t.name+'의 허위 서명을 유지했다.');relation(state,run,1,2,t.name+'의 기존 서명을 지켰다.');state.support=clamp(state.support-5);}
      else relation(state,run,0,-8,t.name+'의 후속 확인을 마치지 않았다.');
      run.outcome=id==='finish'?run.route:id;close(state,run,t.name+' · '+(id==='finish'?(run.route==='report'?t.reportResult:t.compromiseResult):id==='correct'?'기존 서명을 정정하고 책임을 인정했다.':id==='doubleDown'?t.concealResult:'후속 확인을 맡지 않아 약속을 마치지 못했다.'));
      return run.result;
    }
    run.eventId=null;own.history.push({day:state.day,type:'career',text:t.name+' · '+c.title+' · 다음 연락 '+run.dueDay+'일'});
    return c.title+' · 다음 연락은 '+run.dueDay+'일 이후. 직업을 바꿔도 기록과 남은 일은 유지된다.';
  }
  function act(state,action){
    if(!['chronicleStart','chronicleWithdraw'].includes(action.type))return null;
    if(action.type==='chronicleWithdraw'){
      const run=current(state);
      if(!run||state.eventQueue.length||state.hearing||state.underReview||state.actions<1)return {ok:false,message:'대기 중인 장기 이야기 · 행동 1 · 진행 중인 사건 없음 필요'};
      state.actions--;relation(state,run,0,-5,templates[run.template].name+'을 더 맡지 않겠다고 알렸다.');close(state,run,templates[run.template].name+' · 후속 일을 내려놓았다. 지출과 이전 기록은 남는다.','withdrawn');return {ok:true,message:run.result};
    }
    const reason=availability(state,action.story);if(reason)return {ok:false,message:reason};
    const t=templates[action.story];state.actions--;state.energy-=5;
    const run={id:state.life.chronicles.nextId++,template:action.story,actor:actor(state),career:state.career,department:['soldier','official'].includes(state.career)?state.institution.department:null,people:[...t.people],status:'active',stage:0,startedDay:state.day,dueDay:state.day,evidence:false,choices:[]};
    state.life.chronicles.runs.push(run);offer(state,run);log(state,run,t.name+'을 맡았다.');return {ok:true,message:t.name+' · 함께한 인물과 선택을 장기 경력에 기록한다.'};
  }
  function tick(state){
    const run=current(state);if(!run||run.dueDay>state.day||state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal)return;
    if(state.followUps.some(item=>item.day<=state.day+1))return;
    offer(state,run);
  }
  function pendingDay(state){const run=current(state);return run?.dueDay??null;}
  const api={templates,restore,current,availability,choices,reply,resolve,act,tick,pendingDay};
  if(typeof module!=='undefined')module.exports=api;root.Chronicles=api;
})(globalThis);
