'use strict';
(function(root){
  const incidentFactory=typeof module!=='undefined'?require('./work-incidents'):root.WorkIncidents;
  const agreementFactory=typeof module!=='undefined'?require('./work-agreements'):root.WorkAgreements;
  const actor=state=>state.life.activeId||'player';
  const active=run=>run.status==='active';
  const clamp=n=>Math.max(0,Math.min(100,n));
  const templates={
    workshop:{name:'공동 설비 점검 제안',jobs:['worker','apprentice','artisan','farmer'],peers:['worker','apprentice','artisan','farmer'],skill:'craft',client:'story-yun',scene:'opening-factory',task:'설비 점검과 수리 순서를 정리한 제안'},
    trade:{name:'다음 납품을 맡을 사람',jobs:['trader'],peers:['trader','farmer','worker'],skill:'commerce',client:'story-doyun',scene:'storm-safe',task:'수량·가격·운송 순서를 대조한 납품 제안'},
    care:{name:'보충 모임 운영 제안',jobs:['medic','teacher'],peers:['medic','teacher','clerk'],skill:'care',client:'story-dasol',scene:'opening-clerk',task:'누락된 이웃을 위한 보충 모임 운영안'},
    civic:{name:'누구나 읽을 수 있는 안내',jobs:['clerk','official','journalist'],peers:['clerk','official','journalist','teacher'],skill:'administration',client:'story-seoyun',scene:'opening-clerk',task:'주민이 이해할 수 있게 원본 기록을 대조한 안내안'},
    military:{name:'현장 준비 확인 제안',jobs:['soldier'],peers:['soldier','guard'],skill:'investigation',client:'story-officer',scene:'opening-police',task:'현장 준비 상태를 확인하는 동료들의 제안'},
    patrol:{name:'밤길 안내를 맡을 사람',jobs:['guard','policeAide','investigator'],peers:['guard','soldier','journalist'],skill:'investigation',client:'story-minseok',scene:'opening-police',task:'주민 이동 시간과 어두운 길을 대조한 밤길 안내안'}
  };
  function balance(state,id){return id===actor(state)?state.cash:state.life.people[id]?.wealth??0;}
  function money(state,id,amount){if(id===actor(state))state.cash+=amount;const p=state.life.people[id];if(p)p.wealth=id===actor(state)?state.cash:p.wealth+amount;}
  function refund(state,run){if(run.escrow){money(state,run.client,run.escrow);run.escrow=0;}}
  function restore(state){
    state.life.projects={nextId:1,runs:[],...state.life.projects};
    for(const p of Object.values(state.life.people))p.workLinks={...p.workLinks};
    for(const run of state.life.projects.runs)if(active(run)&&run.actor!==actor(state)){refund(state,run);run.status='archived';run.closedDay=state.day;run.result='이전 인물의 일거리로 보관하고 맡겨 둔 보수를 의뢰인에게 반환했다.';}
    agreements.restore(state);
  }
  function current(state){return state.life.projects.runs.find(run=>run.actor===actor(state)&&active(run));}
  function pool(state,type){const t=templates[type];return Object.values(state.life.people).filter(p=>p.id!==actor(state)&&p.source==='resident'&&!p.controlArchive&&p.age>=18&&p.age<65&&p.health>=45&&t.peers.includes(p.occupation));}
  function competence(p,type){const t=templates[type],key=t.skill==='investigation'?'security':t.skill;return (t.jobs.includes(p.occupation)?3:2)+Math.min(3,Math.floor((p.skills[key]||0)/4))+(p.health>=75?1:0);}
  function willing(state,p){const link=p.workLinks[actor(state)];return p.relationship>=45&&!(link?.lastOutcome==='blamed'&&p.relationship<65);}
  function historyScore(state,type){
    const values=[];
    const relevant={workshop:['workshop'],trade:['trade'],care:['care'],civic:['civil','trade','care'],military:['military'],patrol:['military','civil']}[type];
    for(const run of state.life.chronicles.runs.filter(r=>r.actor===actor(state)&&r.status==='complete'&&relevant.includes(r.template)).slice(-2)){
      const value={report:2,compromise:1,doubleDown:-3,correct:-1,leave:-1}[run.outcome]||0;
      values.push({label:'이전 이야기: '+({report:'기록 공개',compromise:'합의 이행',doubleDown:'허위 서명 유지',correct:'뒤늦은 정정',leave:'확인 미완료'}[run.outcome]||'기록'),value});
      const answered=state.life.echoes.offers.find(o=>o.run===run.id&&o.actor===run.actor&&o.report?.answer==='admit');if(answered)values.push({label:'후속 해명에서 정정',value:1});
    }
    const prior=state.life.projects.runs.filter(r=>r.actor===actor(state)&&r.type===type&&r.status==='complete');
    if(prior.length){const last=prior[prior.length-1];values.push({label:'최근 일거리의 평가',value:last.blame?-2:last.won?1:0});}
    return values;
  }
  function availability(state,type){
    const t=Object.hasOwn(templates,type)?templates[type]:null;if(!t||!t.jobs.includes(state.career))return '현재 직업의 일거리가 아니다';
    if(!state.startConfigured||state.day<28||!['none','complete'].includes(state.jobStory.stage))return '첫 지역 이야기를 마친 28일부터 가능';
    if(state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal)return '진행 중인 사건과 심사를 먼저 마치자';
    if(current(state))return '현재 맡은 공동 일거리를 먼저 마치거나 인계하자';
    const previous=state.life.projects.runs.filter(r=>r.actor===actor(state)&&r.type===type).at(-1);if(previous&&state.day-previous.startedDay<180)return '다음 제안은 '+(previous.startedDay+180)+'일부터 가능';
    if(['official','soldier'].includes(state.career)&&!state.agencies[state.institution.department])return '현재 소속 기관을 확인하자';
    if(!state.life.people[t.client]||balance(state,t.client)<24)return '의뢰인의 개인 보수 24가 필요';
    if(state.cash<4||state.actions<1||state.energy<6)return '개인 준비비 4 · 행동 1 · 기력 6 필요';
    return '';
  }
  function sameWork(state,run){
    if(state.career!==run.career)return false;if(!run.department)return true;
    let department=run.department;const seen=new Set();
    while(!state.agencies[department]&&!seen.has(department)){
      seen.add(department);const merger=(state.agencyHistory||[]).find(item=>item.status==='enacted'&&item.type==='mergeAgency'&&item.source===department&&item.resolvedDay>=run.startedDay);if(!merger)break;department=merger.target;
    }
    return Boolean(state.agencies[department])&&state.institution.department===department;
  }
  function log(state,run,text){const p=state.life.people[run.actor];if(p)p.history.push({day:state.day,type:'career',text:templates[run.type].name+' · '+text});state.life.news.unshift({day:state.day,person:run.actor,text:templates[run.type].name+' · '+text});}
  function relation(state,run,id,amount,text){const p=state.life.people[id];if(!p)return;p.relationship=clamp(p.relationship+amount);p.history.push({day:state.day,type:'relationship',actor:run.actor,text});}
  function link(state,run,id,kind,outcome){
    const p=state.life.people[id];if(!p)return;const old=p.workLinks[run.actor]||{worked:0,opposed:0,metDay:state.day};
    p.workLinks[run.actor]={...old,[kind]:(old[kind]||0)+1,lastDay:state.day,lastOutcome:outcome};
  }
  function close(state,run,text,status='complete'){refund(state,run);run.status=status;run.closedDay=state.day;run.dueDay=null;run.eventId=null;run.result=text;log(state,run,text);}
  function selectRival(state,run){
    const rivals=pool(state,run.type).filter(p=>p.id!==run.partner&&p.id!==run.formerPartner&&p.society.ambition>=50).sort((a,b)=>(b.workLinks[run.actor]?.opposed||0)-(a.workLinks[run.actor]?.opposed||0)||b.society.ambition-a.society.ambition||a.id.localeCompare(b.id));
    const p=rivals[0];run.rival=p?.id||null;
    run.rivalFacts=p?[
      {label:p.jobTitle+'의 실무',value:competence(p,run.type)},
      {label:'도전 성향 '+p.society.ambition,value:Math.floor(p.society.ambition/20)},
      {label:'준비를 중시하는 성향 '+p.society.security,value:Math.floor(p.society.security/30)}
    ]:[];
    run.rivalBid=p?5+run.rivalFacts.reduce((sum,f)=>sum+f.value,0):10;run.rivalContribution=p?Math.min(4,competence(p,run.type)):0;
    if(p)link(state,run,p.id,'opposed','competing');
  }
  function evaluation(state,run,extra=0,coauthor=run.coauthor){
    const parts=[{label:'기본 준비',value:5},{label:'내 관련 훈련',value:run.skillScore},...run.reputation];
    if(run.partner)parts.push({label:'동료의 실무와 신뢰',value:run.partnerScore});
    if(run.incident?.effect)parts.push({label:'현장 조건 확인',value:run.incident.effect.score});
    parts.push({label:'이번에 보강한 기록',value:(run.evidence||0)+extra});
    if(coauthor)parts.push({label:'경쟁자의 공동 확인',value:run.rivalContribution});
    const score=parts.reduce((sum,f)=>sum+f.value,0),target=coauthor?10:run.rivalBid??10;
    return {parts,score,target,won:score>=target};
  }
  function stageEvent(state,run){
    const t=templates[run.type],client=state.life.people[run.client]?.name||'의뢰인';let title,dialogue;
    const departed=!sameWork(state,run);
    if(departed){title='남은 제안을 인계할 때';dialogue=[{speaker:client,text:'일이나 소속을 옮긴 것을 확인했어요. 준비한 기록은 인계받고, 맡겨 둔 보수는 돌려받겠습니다. 준비에 쓴 비용은 되돌리기 어려워요.'}];}
    else if(run.stage==='planning'){title='누구와 함께 제안할까';dialogue=[{speaker:client,text:t.task+'을 비교해 맡길 사람을 정하려고 해요. 제 개인 돈 24를 보수로 맡겨 둘게요.'},{speaker:client,text:'혼자 준비하거나 주민 명부의 동료에게 함께하자고 할 수 있어요. 선정되면 동료 몫은 6, 나중에 경쟁자까지 공동으로 참여하면 그 사람 몫은 4예요. 선정되지 않으면 보수는 지급하지 않아요.'}];}
    else if(run.stage==='field'){title=incidents.data(run).title;dialogue=incidents.lines(state,run);}
    else if(run.stage==='contest'){
      if(run.rivalBid==null){run.skillScore=Math.min(4,(state.skills[t.skill]||0)*2);selectRival(state,run);}
      const rival=state.life.people[run.rival];title=rival?'같은 일을 원하는 다른 사람':'제안을 확인하는 자리';
      dialogue=[{speaker:rival?.name||client,text:rival?'나도 '+t.task+'을 준비했어요. 내 실무와 준비 과정도 함께 비교해 주세요.':'함께 비교할 제안은 없지만, 맡기려면 준비한 내용이 충분해야 해요.'},{speaker:client,text:'자료를 더 확인하거나 일정을 늘려 보강할 수 있어요. 상대가 동의하면 공동 제안으로 바꿀 수도 있어요. 각 선택의 평가를 먼저 보고 결정하세요.'},{speaker:client,text:'현재 제안의 근거: '+evaluation(state,run).parts.map(f=>f.label+' '+(f.value>=0?'+':'')+f.value).join(' · ')+(rival?' / 상대 제안: 기본 5 · '+run.rivalFacts.map(f=>f.label+' +'+f.value).join(' · '):' / 단독 제안 기준 10')}];
    }else{title='함께 준비한 일의 평가';const result=run.evaluation;dialogue=[{speaker:client,text:'제안 평가 '+result.score+'점, 필요한 평가 '+result.target+'점입니다. '+(result.won?'준비한 제안이 기준을 충족했어요. 합의한 범위의 보수 '+(run.awardCap||24)+'을 나누고, 남은 '+(24-(run.awardCap||24))+'은 돌려받겠습니다.':'이번 제안은 기준에 미치지 못했어요. 맡겨 둔 보수는 돌려받고 평가 기록은 함께 남기겠습니다.')},{speaker:run.partner?state.life.people[run.partner]?.name||client:client,text:run.partner?'함께 준비한 일이 어떻게 기억될지도 정하고 싶어요. 결과와 각자 한 일을 같이 남겨 주세요.':'혼자 준비한 과정과 상대의 제안도 다음 일에 참고할 수 있어요.'}];}
    run.sequence=(run.sequence||0)+1;const event={id:'work-project-'+run.id+'-'+run.sequence,day:state.day,workProject:{run:run.id,actor:run.actor,stage:run.stage,departed,speaker:client},scene:t.scene,title,text:t.task,destination:'jobs',dialogue};if(run.stage==='field'&&!departed)event.fieldReplies=Object.fromEntries(incidents.choices(state,run).map(c=>[c.id,c.title]));run.eventId=event.id;state.eventQueue.push(event);
  }
  function context(state,event){const run=state.life.projects.runs.find(r=>r.id===event.workProject?.run);return {run,valid:Boolean(run&&active(run)&&run.actor===actor(state)&&event.workProject.actor===actor(state)&&run.eventId===event.id&&run.stage===event.workProject.stage)};}
  function choices(state,event){
    const {run:r,valid}=context(state,event);if(!valid)return [{id:'close',title:'이전 일거리 기록을 닫는다',detail:'현재 인물에게 비용·관계 효과 없음',disabled:false}];
    if(event.workProject.departed||!sameWork(state,r))return [{id:'cancel',title:'기록을 인계하고 보수를 반환한다',detail:'남은 보수 24를 의뢰인에게 반환 · 준비비는 이미 지출 · 추가 보상 없음',disabled:false}];
    let result;
    if(r.stage==='field')result=incidents.choices(state,r);
    else if(r.stage==='planning')result=[
      ...pool(state,r.type).map(p=>({id:'partner:'+p.id,title:p.name+'에게 함께하자고 한다',detail:p.jobTitle+' · 실무 '+competence(p,r.type)+' · 관계 '+p.relationship+' · '+(willing(state,p)?'참여 의사 있음 · 선정되면 동료 보수 6':'현재는 참여하지 않겠다고 함'),blocked:!willing(state,p)})),
      {id:'solo',title:'혼자 준비한다',detail:'동료 보수 없음 · 동료의 실무 가산 없음'}
    ];
    else if(r.stage==='contest'){
      const rival=state.life.people[r.rival],resentful=rival?.workLinks[r.actor]?.lastOutcome==='blamed'&&rival.relationship<65,cooperate=rival&&!resentful&&rival.health>=45&&(rival.relationship>=60||rival.relationship>=35&&(rival.society.community>=55||rival.society.security>=60));
      const detail=(extra,coauthor)=>{const e=evaluation(state,r,extra,coauthor);return '예상 평가 '+e.score+' / 기준 '+e.target;};
      result=[...(agreements.canSupport(state,r)?[{id:'jointCheck',title:'동료와 공동 준비금으로 함께 검증한다',detail:'공동 준비금 4 · 행동 1 · 기력 6 · 기록 +6 · '+detail(6,false),actions:1,energy:6}]:[]),
        {id:'verify',title:'원본과 현장을 다시 대조한다',detail:'행동 1 · 기력 10 · 기록 +4 · '+detail(4,false),actions:1,energy:10},
        {id:'rework',title:'준비비와 시간을 더 들여 보강한다',detail:'개인 돈 6 · 행동 1 · 기력 6 · 평가 7일 연기 · 기록 +7 · '+detail(7,false),actions:1,energy:6,cash:6},
        ...(rival?[{id:'cooperate',title:rival.name+'에게 공동 제안을 요청한다',detail:'행동 1 · 기력 6 · '+(cooperate?'상대가 공동 확인에 동의':'상대가 독립 제안을 유지하려 함')+' · 선정되면 상대 보수 4 · '+detail(0,true),actions:1,energy:6,blocked:!cooperate}]:[]),
        {id:'submit',title:'지금 준비한 제안으로 평가받는다',detail:'추가 비용 없음 · '+detail(0,false)}];
    }else result=[
      {id:'confirm',title:r.evaluation.won?'각자 한 일을 확인하고 보수를 나눈다':'평가와 각자 한 일을 그대로 받아들인다',detail:r.evaluation.won?'행동 1 · 기력 6 · 내 보수 '+((r.awardCap||24)-(r.partner?6:0)-(r.coauthor?4:0))+' · 동료 '+(r.partner?6:0)+' · 공동 확인자 '+(r.coauthor?4:0):'추가 비용 없음 · 보수는 의뢰인에게 반환 · 동료 관계 +1 · 지지 −1',actions:r.evaluation.won?1:0,energy:r.evaluation.won?6:0},
      ...(!r.evaluation.won&&r.partner?[{id:'blame',title:'실패는 동료 책임이라고 주장한다',detail:'보수는 의뢰인에게 반환 · 동료 관계 −10 · 지지 −3 · 다음 참여 의사에 영향'+(r.agreement?' · 동료 약속 파기/관계 추가 −4':'')}]:[])
    ];
    if(r.postponements<2)result.push({id:'later',title:'준비한 뒤 다시 이야기한다',detail:'7일 뒤 재연락 · 두 번 가능 · 보수 보관 유지'});
    result.push({id:'cancel',title:'제안을 인계하고 그만둔다',detail:'보수는 의뢰인에게 반환 · 준비비는 이미 지출 · 동료가 있으면 관계 −2'});
    return result.map(c=>({...c,disabled:Boolean(c.disabled||c.blocked||state.actions<(c.actions||0)||state.energy<(c.energy||0)||((c.cash||0)>0&&state.cash<c.cash))}));
  }
  function reply(event,id){if(id.startsWith('field:'))return incidents.reply(event,id);return {reply:id.startsWith('partner:')?'함께 준비하고 선정되면 약속한 몫을 나누겠습니다.':{jointCheck:'공동 준비금으로 동료와 함께 검증하겠습니다.',solo:'혼자 준비하겠습니다.',verify:'원본과 현장을 다시 대조하겠습니다.',rework:'돈과 시간을 더 들여 준비하겠습니다.',cooperate:'서로 확인한 내용을 합쳐 공동 제안으로 내겠습니다.',submit:'지금 준비한 제안으로 평가받겠습니다.',confirm:'평가와 각자 한 일을 함께 기록하겠습니다.',blame:'실패는 동료의 책임이라고 생각합니다.',later:'준비한 뒤 다시 이야기하겠습니다.',cancel:'남은 기록을 인계하고 보수를 반환하겠습니다.',close:'이전 기록을 닫겠습니다.'}[id],speaker:event.workProject?.speaker||'의뢰인',reaction:id==='later'?'7일 뒤 다시 연락하겠습니다.':'이번 선택과 각자 한 일을 함께 기록하겠습니다.'};}
  function resolve(state,event,id){
    const {run:r,valid}=context(state,event);if(!valid)return '이전 인물의 일거리를 닫았다. 현재 인물에게 효과를 적용하지 않았다.';
    const choice=choices(state,event).find(c=>c.id===id);if(!choice||choice.disabled)return '선택 조건이 바뀌었다.';
    if(r.stage==='field'&&id.startsWith('field:')){r.choices.push({day:state.day,id,cash:0});r.eventId=null;return incidents.resolve(state,r,id);}
    state.actions-=choice.actions||0;state.energy-=choice.energy||0;money(state,r.actor,-(choice.cash||0));r.choices.push({day:state.day,id,cash:choice.cash||0});r.eventId=null;
    if(id==='cancel'){if(r.partner)relation(state,r,r.partner,-2,'함께 준비하던 제안을 인계했다.');close(state,r,'남은 기록을 인계하고 보수 '+r.escrow+'을 반환했다. 준비비는 이미 지출했다.','cancelled');return r.result;}
    if(id==='later'){r.postponements++;r.dueDay=state.day+7;return '7일 뒤 다시 이야기한다. 보수와 준비 기록은 유지한다.';}
    if(r.stage==='planning'){
      r.partner=id.startsWith('partner:')?id.slice(8):null;
      const p=state.life.people[r.partner];r.partnerScore=p?competence(p,r.type)+(p.relationship>=60?2:1):0;
      if(p){link(state,r,p.id,'worked','preparing');relation(state,r,p.id,0,'함께 제안을 준비하기로 했다. 선정되면 보수 6을 받기로 합의');}
      agreements.attach(state,r);
      r.planningDay=state.day;r.contestDay=state.day+7;
      if(r.variant==='field'){incidents.prepare(state,r);r.stage='field';r.dueDay=state.day+3;}else{r.stage='contest';r.dueDay=r.contestDay;}log(state,r,p?p.name+'과 함께 준비한다.':'혼자 제안을 준비한다.');
    }else if(r.stage==='contest'){
      if(id==='jointCheck')agreements.support(state,r);
      r.evidence={jointCheck:6,verify:4,rework:7,cooperate:0,submit:0}[id];r.coauthor=id==='cooperate'?r.rival:null;
      r.rivalContribution=r.coauthor?Math.min(4,competence(state.life.people[r.coauthor],r.type)):0;
      r.evaluation=evaluation(state,r);r.stage='settlement';r.dueDay=state.day+(id==='rework'?21:14);
      if(r.coauthor){link(state,r,r.coauthor,'worked','coauthor');relation(state,r,r.coauthor,0,'독립 제안에서 공동 확인자로 참여하기로 했다. 선정되면 보수 4 합의');}
      log(state,r,'평가 준비 '+r.evaluation.score+' / 기준 '+r.evaluation.target+' · 확인일 '+r.dueDay);
    }else{
      r.won=r.evaluation.won;r.blame=id==='blame';const payments=[];
      if(r.won){
        if(r.partner)payments.push([r.partner,6]);if(r.coauthor)payments.push([r.coauthor,4]);payments.push([r.actor,(r.awardCap||24)-payments.reduce((sum,[,amount])=>sum+amount,0)]);
        const total=payments.reduce((sum,[,amount])=>sum+amount,0);if(r.escrow!==24||total!==(r.awardCap||24))throw new Error('일거리 보수 기록이 일치하지 않습니다.');r.clientRefund=24-total;money(state,r.client,r.clientRefund);r.escrow=0;
        for(const [person,amount] of payments)money(state,person,amount);state.support=clamp(state.support+2);
      }else state.support=clamp(state.support-(r.blame?3:1));
      r.payments=payments.map(([person,amount])=>({person,amount}));
      if(r.partner){relation(state,r,r.partner,r.blame?-10:r.won?5:1,r.blame?'함께 준비한 일의 실패 책임을 떠넘겼다.':'각자 한 일과 평가 결과를 함께 남겼다.');state.life.people[r.partner].workLinks[r.actor].lastOutcome=r.blame?'blamed':r.won?'success':'reviewed';}
      if(r.coauthor){relation(state,r,r.coauthor,4,'경쟁하던 제안을 합쳐 함께 결과를 확인했다.');state.life.people[r.coauthor].workLinks[r.actor].lastOutcome=r.won?'success':'reviewed';}
      agreements.record(state,r);
      close(state,r,(r.won?'제안이 선정되어 개인 보수 '+(r.awardCap||24)+'을 약속한 몫대로 나눴다. 의뢰인 반환 '+(r.clientRefund||0)+'.':'제안이 선정되지 않아 보수 24를 의뢰인에게 반환했다.')+(r.blame?' 동료에게 책임을 떠넘긴 일도 남는다.':' 각자 한 일을 기록했다.'));return r.result;
    }
    return '다음 연락 '+r.dueDay+'일 · 기다리는 동안 다른 활동과 기간 생활을 진행할 수 있다.';
  }
  function act(state,action){
    const agreed=agreements.act(state,action);if(agreed)return agreed;
    if(!['projectStart','projectCancel'].includes(action.type))return null;
    if(action.type==='projectCancel'){
      const r=current(state);if(!r||state.eventQueue.length||state.hearing||state.underReview||state.actions<1)return {ok:false,message:'진행 중인 일거리 · 행동 1 · 다른 사건 없음 필요'};
      state.actions--;if(r.partner)relation(state,r,r.partner,-2,'공동 제안을 인계하고 그만뒀다.');close(state,r,'제안을 인계하고 보수 '+r.escrow+'을 의뢰인에게 반환했다.','cancelled');return {ok:true,message:r.result};
    }
    if(action.variant!==undefined&&!['field','basic'].includes(action.variant))return {ok:false,message:'맡을 의뢰 방식을 확인하자.'};
    const reason=availability(state,action.project);if(reason)return {ok:false,message:reason};
    const t=templates[action.project];state.actions--;state.energy-=6;money(state,actor(state),-4);money(state,t.client,-24);
    const run={id:state.life.projects.nextId++,variant:action.variant==='field'?'field':'basic',type:action.project,actor:actor(state),career:state.career,department:['official','soldier'].includes(state.career)?state.institution.department:null,client:t.client,startedDay:state.day,status:'active',stage:'planning',dueDay:state.day,escrow:24,partner:null,postponements:0,choices:[],skillScore:Math.min(4,(state.skills[t.skill]||0)*2),reputation:historyScore(state,action.project)};
    state.life.projects.runs.push(run);stageEvent(state,run);log(state,run,'개인 준비비 4 · 의뢰인 개인 보수 24 보관');return {ok:true,message:t.name+' · 함께할 사람과 제안을 고른다.'};
  }
  function tick(state){agreements.tick(state);const r=current(state);if(!r||r.dueDay>state.day||state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||state.followUps.some(item=>item.day<=state.day+1))return;stageEvent(state,r);}
  function blocked(state){return current(state)?'진행 중인 공동 일거리를 마치거나 보수를 반환한 뒤 은퇴하자.':agreements.blocked(state);}
  const agreements=agreementFactory.create({templates,actor,current,pool,willing,money,relation,log});
  const incidents=incidentFactory.create({actor,templates,agreements,pool,money,relation,log});
  const api={incidents,agreements,templates,restore,current,pool,competence,willing,historyScore,availability,evaluation,choices,reply,resolve,act,tick,blocked};
  if(typeof module!=='undefined')module.exports=api;root.WorkProjects=api;
})(globalThis);
