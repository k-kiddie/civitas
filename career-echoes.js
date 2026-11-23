'use strict';
(function(root){
  const careers=typeof module!=='undefined'?require('./careers'):root.Careers;
  const actor=state=>state.life.activeId||'player';
  const open=offer=>!['complete','declined','archived','cancelled'].includes(offer.status);
  const clamp=n=>Math.max(0,Math.min(100,n));
  const topics={
    workshop:{name:'작업대 점검 의뢰',task:'작업대 점검 기록',job:'artisan'},
    trade:{name:'다음 납품의 확인 의뢰',task:'약속한 수량과 거래 조건의 대조 기록',job:'journalist'},
    care:{name:'빠진 이웃을 위한 보충 모임',task:'이름을 가린 보충 모임 참여 기록',job:'teacher'},
    civil:{name:'접수 안내를 다시 맡아 달라는 부탁',task:'대기 주민의 접수 안내 기록',job:'journalist'},
    military:{name:'현장 준비를 다시 확인하는 부탁',task:'현장 준비 확인 기록',job:'guard'}
  };
  function sourceRun(state,offer){return state.life.chronicles.runs.find(run=>run.id===offer.run&&run.actor===offer.actor);}
  function wallet(state,id){return id===actor(state)?state.cash:state.life.people[id]?.wealth??0;}
  function money(state,id,delta){if(id===actor(state))state.cash+=delta;const p=state.life.people[id];if(p)p.wealth=id===actor(state)?state.cash:p.wealth+delta;}
  function refund(state,offer){if(offer.escrow>0){money(state,offer.person,offer.escrow);offer.escrow=0;}}
  function restore(state){
    const migrating=!state.life.echoes;
    state.life.echoes={nextId:1,lastSceneDay:-1000,offers:[],...state.life.echoes};
    for(const offer of state.life.echoes.offers)if(offer.actor!==actor(state)&&open(offer)){refund(state,offer);offer.status='archived';offer.closedDay=state.day;offer.result='이전 인물의 후속 연락으로 보관했다. 남은 의뢰 보수는 부탁한 사람에게 반환했다.';}
    for(const run of state.life.chronicles.runs){
      if(run.actor!==actor(state)||run.status!=='complete'||!topics[run.template]||state.life.echoes.offers.some(item=>item.run===run.id&&item.actor===run.actor))continue;
      const kind={report:'referral',compromise:'commission',doubleDown:'challenge',correct:'repair',leave:'repair'}[run.outcome];if(!kind)continue;
      const delay={referral:60,commission:45,challenge:90,repair:45}[kind];
      const topic=topics[run.template];
      state.life.echoes.offers.push({id:state.life.echoes.nextId++,run:run.id,actor:run.actor,kind,person:run.people[0],counterpart:run.people[1],source:run.template,sourceTitle:run.result.split(' · ')[0],job:run.template==='care'&&run.career==='teacher'?'medic':topic.job,
        status:'waiting',stage:'invitation',dueDay:Math.max(run.closedDay+delay,migrating?state.day+14:state.day),createdDay:state.day,escrow:0,choices:[],postponements:0});
    }
  }
  function sameWork(state,offer){
    const run=sourceRun(state,offer);if(!run||state.career!==run.career)return false;if(!run.department)return true;
    let department=run.department;const seen=new Set();
    while(!state.agencies[department]&&!seen.has(department)){
      seen.add(department);const merger=(state.agencyHistory||[]).find(item=>item.status==='enacted'&&item.type==='mergeAgency'&&item.source===department&&item.resolvedDay>=run.startedDay);
      if(!merger)break;department=merger.target;
    }
    return Boolean(state.agencies[department])&&state.institution.department===department;
  }
  function log(state,offer,text){const p=state.life.people[offer.actor];if(p)p.history.push({day:state.day,type:'career',text:offer.sourceTitle+' 이후 · '+text});state.life.news.unshift({day:state.day,person:offer.actor,text:offer.sourceTitle+' 이후 · '+text});}
  function relation(state,offer,id,delta,text){
    const p=state.life.people[id];if(!p)return;p.relationship=clamp(p.relationship+delta);p.history.push({day:state.day,type:'relationship',actor:offer.actor,text});
    if(p.councilId){const member=state.council.chamber?.members.find(item=>item.id===p.councilId);if(member)member.relationship=p.relationship;if(state.council.people[p.councilId])state.council.people[p.councilId].relationship=p.relationship;}
  }
  function finish(state,offer,text,status='complete'){refund(state,offer);offer.status=status;offer.closedDay=state.day;offer.dueDay=null;offer.result=text;offer.eventId=null;log(state,offer,text);}
  function offerEvent(state,offer){
    const person=state.life.people[offer.person],topic=topics[offer.source],name=person?.name||'이전 동료';let title,lines;
    if(offer.kind==='challenge'){
      if(!offer.report){offer.report={submittedDay:state.day,actor:offer.actor,sourceRun:offer.run,reporter:offer.person,answer:null};log(state,offer,'현장 기록과 옛 서명을 대조하는 해명 요구가 접수됐다.');}
      title='그때의 서명을 다시 묻는다';lines=[{speaker:name,text:offer.sourceTitle+'에서 문제없음 서명을 유지했죠. 그 서명과 다른 현장 기록을 함께 제출했어요. 직접 해명해 주세요.'},{speaker:name,text:sameWork(state,offer)&&['official','soldier'].includes(state.career)?'같은 기관의 업무라 이번 답변을 업무 평가와 감사 검토에 넘기겠습니다. 당시 서명과 현장 기록이 다른 이유를 듣고 싶어요.':'지금 일자리와 별개로 당신이 했던 서명에 대한 질문이에요. 다른 직장이나 가족에게 책임을 넘기지는 않겠어요.'}];
    }else if(offer.stage==='delivery'){
      title='맡았던 의뢰를 마칠 날';lines=[{speaker:name,text:topic.task+'을 확인할 날이에요. 준비한 내용을 함께 대조해요.'},{speaker:name,text:'맡길 때 제 돈에서 따로 둔 보수 '+offer.escrow+'이 남아 있어요. 같은 일을 계속하고 확인을 마치면 지급하겠어요. 일을 떠났다면 남은 기록을 인계할 수 있어요.'}];
    }else if(offer.kind==='referral'){
      title='그 기록을 보고 온 추천';lines=[{speaker:name,text:offer.sourceTitle+'에서 기록을 공개하고 결과까지 확인한 일을 기억해요. '+careers.jobs[offer.job].name+' 일을 소개하고 싶어요.'},{speaker:name,text:'필요한 훈련과 현재 직책의 조건은 그대로예요. 교육이 필요하면 준비비 8 중 제 돈 4를 보태겠어요. 지금 직업을 계속하고 싶으면 이번 연락은 거절해도 돼요.'}];
    }else if(offer.kind==='repair'){
      title='다시 믿을 수 있을까';lines=[{speaker:name,text:offer.sourceTitle+'의 결말을 기억해요. 지금 기록을 정리하는 일을 함께 도와줄 수 있을까요?'},{speaker:name,text:'함께 기록을 정리하면서 다시 이야기해 보고 싶어요. 보수나 취업을 약속할 수는 없어요. 예전 일을 당장 잊기도 어렵고요.'}];
    }else{
      title=topic.name;lines=[{speaker:name,text:offer.sourceTitle+'에서 개인 부담으로 합의를 지킨 일을 기억해요. 이번에도 '+topic.task+'을 맡아 주겠어요?'},{speaker:name,text:'준비비 4는 맡는 쪽이 부담해 주세요. 제가 개인 돈 18을 미리 떼어 두고, 14일 뒤 확인을 마치면 드릴게요. 준비비는 일을 취소해도 돌아오지 않아요.'}];
    }
    offer.sequence=(offer.sequence||0)+1;
    const event={id:'career-echo-'+offer.id+'-'+offer.sequence,day:state.day,careerEcho:{id:offer.id,actor:offer.actor,kind:offer.kind,stage:offer.stage,speaker:name,sourceTitle:offer.sourceTitle},scene:offer.kind==='challenge'?'hearing':offer.source==='military'?'opening-police':offer.source==='workshop'?'opening-factory':'storm-safe',title,text:offer.sourceTitle+'의 선택이 새로운 연락으로 돌아왔다.',destination:'jobs',dialogue:lines};
    offer.eventId=event.id;state.eventQueue.push(event);state.life.echoes.lastSceneDay=state.day;
  }
  function context(state,event){const offer=state.life.echoes.offers.find(item=>item.id===event.careerEcho?.id);return {offer,valid:Boolean(offer&&offer.actor===actor(state)&&event.careerEcho.actor===actor(state)&&open(offer)&&offer.eventId===event.id&&offer.stage===event.careerEcho.stage)};}
  function choices(state,event){
    const {offer:o,valid}=context(state,event);if(!valid)return [{id:'close',title:'이전 연락을 닫는다',detail:'현재 인물에게 비용과 관계 효과 없음',disabled:false}];
    const p=state.life.people[o.person],relationNow=p?.relationship??0,job=careers.jobs[o.job];let result;
    if(o.kind==='challenge'){
      const official=sameWork(state,o)&&['official','soldier'].includes(state.career);
      result=[{id:'disclose',title:'서명과 당시 기록을 함께 공개해 해명한다',detail:'행동 1 · 기력 10 · 요청자 관계 +2 · 담당자 관계 −5 · 지지 −2'+(official?' · 실적 −4 · 감사 주목도 +8':''),actions:1,energy:10},
        {id:'admit',title:'잘못된 서명을 인정하고 정정한다',detail:'행동 1 · 기력 6 · 요청자 관계 +4 · 담당자 관계 −4 · 지지 −3'+(official?' · 실적 −6 · 감사 주목도 +12':''),actions:1,energy:6},
        {id:'ignore',title:'해명 요구에 응답하지 않는다',detail:'요청자 관계 −6 · 지지 −6'+(official?' · 실적 −8 · 감사 주목도 +18':'')}];
    }else if(o.stage==='delivery')result=[
      {id:'deliver',title:'함께 기록을 확인하고 의뢰를 마친다',detail:'같은 직업·소속 필요 · 행동 1 · 기력 10 · 보관된 보수 '+o.escrow+' 지급 · 관계 +5',actions:1,energy:10,blocked:!sameWork(state,o)||!p||o.escrow!==18},
      {id:'cancel',title:'남은 기록을 인계하고 의뢰를 종료한다',detail:'보관된 보수는 의뢰인에게 반환 · 준비비 4는 이미 지출 · 관계 −3'}
    ];
    else if(o.kind==='referral'){
      const requirement=careers.requirement(state,o.job),skill=job.skill;
      result=[{id:'job',title:'추천받은 일자리에 지원한다',detail:job.name+' · 관계 55 필요 · '+(requirement||'조건 충족 · 행동 1'),actions:1,blocked:relationNow<55||Boolean(requirement)},
        {id:'train',title:'추천인의 지원을 받아 필요한 교육을 받는다',detail:(careers.skills[skill]||skill)+' 훈련 · 내 돈 4 + 추천인 돈 4 · 행동 1 · 기력 10 · 관계 50 필요',actions:1,energy:10,cash:4,blocked:relationNow<50||wallet(state,o.person)<4||(state.skills[skill]||0)>=1||o.trained},
        {id:'decline',title:'지금의 일을 이어가겠다',detail:'추가 비용·관계 불이익 없음 · 이번 추천 종료'}];
    }else if(o.kind==='repair')result=[
      {id:'help',title:'기록을 정리하는 일을 돕는다',detail:'행동 1 · 기력 8 · 관계 +6 · 예전 기록은 유지',actions:1,energy:8},
      {id:'decline',title:'이번에는 돕기 어렵다고 알린다',detail:'추가 비용·관계 불이익 없음 · 이번 부탁 종료'}];
    else result=[
      {id:'accept',title:'준비비를 내고 의뢰를 맡는다',detail:'같은 직업·소속 · 관계 50 필요 · 내 돈 4 · 행동 1 · 기력 4 · 의뢰인 돈 18 보관',actions:1,energy:4,cash:4,blocked:!sameWork(state,o)||relationNow<50||wallet(state,o.person)<18},
      {id:'decline',title:'이번 의뢰는 맡지 않겠다',detail:'추가 비용·관계 불이익 없음'}];
    if(o.postponements<2)result.push({id:'later',title:'준비한 뒤 다시 이야기하자',detail:'7일 뒤 재연락 · 추가 비용 없음 · 두 번 가능'});
    return result.map(c=>({...c,disabled:Boolean(c.blocked||state.actions<(c.actions||0)||state.energy<(c.energy||0)||state.cash<(c.cash||0)||!p)}));
  }
  function reply(event,id){return {reply:{disclose:'서명과 당시 기록을 함께 공개해 해명하겠습니다.',admit:'잘못된 서명을 인정하고 정정하겠습니다.',ignore:'이번 해명 요구에는 응답하지 않겠습니다.',deliver:'함께 기록을 확인하고 의뢰를 마치겠습니다.',cancel:'남은 기록을 인계하고 의뢰를 종료하겠습니다.',job:'추천받은 일자리에 지원하겠습니다.',train:'교육 지원을 받아 필요한 훈련을 받겠습니다.',decline:'이번 연락은 정중히 사양하겠습니다.',help:'기록을 정리하는 일을 돕겠습니다.',accept:'준비비를 내고 의뢰를 맡겠습니다.',later:'준비한 뒤 다시 이야기하겠습니다.',close:'이전 연락을 닫겠습니다.'}[id],speaker:event.careerEcho?.speaker||'이전 동료',reaction:id==='later'?'7일 뒤 다시 연락할게요.':id==='accept'?'제 개인 돈에서 보수 18을 따로 보관했어요. 14일 뒤에 확인해요.':id==='train'?'서로 준비비 4씩 부담했어요. 교육을 마친 뒤 지원 여부를 결정하세요.':'이번 답변과 실제 처리한 결과를 함께 기록하겠습니다.'};}
  function resolve(state,event,id){
    const {offer:o,valid}=context(state,event);if(!valid)return '이전 인물의 연락을 닫았다. 현재 인물에게 효과를 적용하지 않았다.';
    const choice=choices(state,event).find(c=>c.id===id);if(!choice||choice.disabled)return '선택 조건이 바뀌었다.';
    state.actions-=choice.actions||0;state.energy-=choice.energy||0;money(state,o.actor,-(choice.cash||0));
    o.choices.push({day:state.day,id,cash:choice.cash||0,energy:choice.energy||0});o.eventId=null;
    if(id==='later'){o.postponements++;o.dueDay=state.day+7;log(state,o,'재연락을 '+o.dueDay+'일로 미뤘다.');return '7일 뒤 다시 연락한다. 보관된 보수와 과거 기록은 유지한다.';}
    if(id==='train'){money(state,o.person,-4);state.skills[careers.jobs[o.job].skill]=1;o.trained=true;o.dueDay=state.day;log(state,o,'본인 4와 추천인 4로 필요한 교육을 마쳤다.');return '추천 교육을 마쳤다. 대화를 닫은 뒤 실제 구직 조건을 확인하고 지원할 수 있다.';}
    if(id==='accept'){money(state,o.person,-18);o.escrow=18;o.status='working';o.stage='delivery';o.dueDay=state.day+14;log(state,o,'개인 준비비 4로 의뢰를 맡았다. 의뢰인 개인 돈 18을 보수로 보관 · 확인일 '+o.dueDay);return '14일 뒤 기록을 확인한다. 보수 18은 완료할 때까지 별도로 보관한다.';}
    let result;
    if(id==='deliver'){const amount=o.escrow;o.escrow=0;money(state,o.actor,amount);relation(state,o,o.person,5,'후속 의뢰를 마치고 보수 '+amount+'을 지급했다.');result='후속 의뢰를 마치고 보관된 보수 '+amount+'을 받았다.';}
    if(id==='cancel'){relation(state,o,o.person,-3,'후속 의뢰의 남은 기록을 인계하고 보수를 반환했다.');result='후속 의뢰를 종료하고 보관된 보수 '+o.escrow+'을 의뢰인에게 반환했다. 준비비는 이미 지출했다.';}
    if(id==='job'){if(state.career==='investigator'&&['open','evidence'].includes(state.caseStage))state.caseStage='transferred';state.career=o.job;relation(state,o,o.person,3,'추천을 받아 '+careers.jobs[o.job].name+' 일자리에 지원했다.');result='추천과 기존 자격을 확인해 '+careers.jobs[o.job].name+'로 전직했다.';}
    if(id==='help'){relation(state,o,o.person,6,'다시 찾아와 기록 정리를 도왔다. 과거 선택은 남는다.');result='기록 정리를 도와 관계를 6 회복했다. 과거 선택과 손실은 지우지 않았다.';}
    if(['disclose','admit','ignore'].includes(id)){
      relation(state,o,o.person,{disclose:2,admit:4,ignore:-6}[id],'옛 서명에 대한 답변: '+reply(event,id).reply);
      relation(state,o,o.counterpart,{disclose:-5,admit:-4,ignore:0}[id],'옛 서명에 대한 답변을 기억한다.');
      state.support=clamp(state.support-{disclose:2,admit:3,ignore:6}[id]);
      if(sameWork(state,o)&&['official','soldier'].includes(state.career)){
        state.institution.merit=Math.max(0,state.institution.merit-{disclose:4,admit:6,ignore:8}[id]);state.institution.scrutiny+={disclose:8,admit:12,ignore:18}[id];
      }
      o.answer=id;if(o.report){o.report.answer=id;o.report.answeredDay=state.day;}result='옛 서명과 현장 기록의 대조를 마쳤다. '+reply(event,id).reply+' 기존 이야기의 결말과 이번 답변을 함께 남겼다.';
    }
    if(id==='decline')result='이번 '+(o.kind==='referral'?'추천':o.kind==='repair'?'기록 정리 부탁':'의뢰')+'을 정중히 거절했다. 추가 비용과 관계 불이익은 없다.';
    finish(state,o,result,id==='decline'?'declined':id==='cancel'?'cancelled':'complete');return result;
  }
  function tick(state){
    if(state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||!['none','complete'].includes(state.jobStory.stage))return;
    if(state.followUps.some(item=>item.day<=state.day+1))return;
    const due=state.life.echoes.offers.filter(o=>o.actor===actor(state)&&open(o)&&o.dueDay<=state.day).sort((a,b)=>(a.stage==='delivery'?-1:0)-(b.stage==='delivery'?-1:0)||a.dueDay-b.dueDay||a.id-b.id);
    const o=due.find(item=>item.sequence>0||state.day-state.life.echoes.lastSceneDay>=30);if(o)offerEvent(state,o);
  }
  function act(state,action){
    if(action.type!=='careerEchoReview')return null;
    const o=state.life.echoes.offers.find(item=>item.id===Number(action.echo)&&item.actor===actor(state)&&open(item));
    if(!o||state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||!['none','complete'].includes(state.jobStory.stage)||(o.dueDay>state.day&&o.kind!=='challenge'))return {ok:false,message:'다른 사건을 마친 뒤 연락일에 확인하자. 옛 서명 답변은 미리 정리할 수 있다.'};
    offerEvent(state,o);return {ok:true,message:o.kind==='challenge'?'옛 서명과 관련한 답변을 정리한다.':'도착한 후속 연락을 확인한다.'};
  }
  function blocked(state){return state.life.echoes?.offers.some(o=>o.actor===actor(state)&&open(o)&&(o.kind==='challenge'||o.status==='working'))?'해명 요구나 맡은 후속 의뢰를 마치거나 인계한 뒤 은퇴하자.':'';}
  const api={topics,restore,choices,reply,resolve,tick,act,blocked,sameWork};
  if(typeof module!=='undefined')module.exports=api;root.CareerEchoes=api;
})(globalThis);
