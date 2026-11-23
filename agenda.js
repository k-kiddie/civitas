'use strict';
(function(root){
  const C=typeof module!=='undefined'?require('./campaign'):root.Campaign;
  const route=(tab,section,jobTab)=>({tab,section,...(jobTab?{jobTab}:{})});
  function costs(state){
    const tomorrow=state.day+1,id=C.life.activeId(state),player=C.life.player(state);
    const living=3+(state.jobStory.livingExpense||0),rent=tomorrow%7===0?C.life.rent(state,player):0;
    let care=0;
    for(const p of Object.values(state.life.people)){
      if(p.source!=='family'||p.lastDay>=tomorrow||C.life.age(p,tomorrow)>=18)continue;
      if(p.family.sharedCare&&p.family.parents.includes(id))care+=2/p.family.parents.length;
      else if(!p.family.sharedCare&&p.family.parents[0]===id)care+=2;
    }
    return {living,rent,care,total:living+rent+care,rentDay:state.day+(7-state.day%7),weeklyRent:C.life.rent(state,player)};
  }
  function build(state){
    const id=C.life.activeId(state),items=[],name=person=>state.life.people[person]?.name||'이전 동료';
    const add=(key,title,day,priority,to,detail)=>{if(Number.isFinite(day))items.push({id:key,title,day,priority,route:to,detail});};
    if(state.hearing)add('hearing','공개 청문회',state.hearing.day,0,route('city',state.hearing.day<=state.day?'hearing':'daily'),'증언과 증거를 확인하고 직접 결론을 정한다.');
    for(const p of C.pacts.governing(state))add('policy:'+p.id,'이행 대기 정책 협약',p.deadline??p.dueDay??state.day,1,route('power','pacts'),'기간 생활 전에 서명한 정책의 처리를 확인한다.');
    const project=C.projects.current(state);
    if(project)add('project:'+project.id,C.projects.templates[project.type].name,project.dueDay,2,route('jobs','projects','work'),({planning:'함께할 사람을 정한다.',field:'현장의 비용·일정·참여 조건을 협의한다.',contest:'다른 제안과 비교하고 준비 방식을 정한다.',settlement:'결과와 각자의 보수를 확인한다.'}[project.stage])+(project.dueDay>state.day?' 기다리는 동안 다른 생활을 할 수 있다.':''));
    const story=C.chronicles.current(state);
    if(story)add('story:'+story.id,C.chronicles.templates[story.template].name,story.dueDay,3,route('jobs','chronicles','work'),'이전 답변과 확보한 기록을 바탕으로 다음 만남을 이어간다.');
    for(const e of state.life.echoes.offers.filter(e=>e.actor===id&&!['complete','declined','cancelled','archived'].includes(e.status)))add('echo:'+e.id,({challenge:'옛 서명에 대한 답변',referral:'추천과 교육 기회',repair:'관계를 다시 쌓는 부탁',commission:e.status==='working'?'맡은 의뢰의 결과 확인':'함께할 의뢰의 제안'}[e.kind]),e.dueDay,e.status==='working'||e.kind==='challenge'?2:5,route('jobs','echoes','work'),name(e.person)+' · '+e.sourceTitle+' 이후의 연락');
    for(const a of C.projects.agreements.own(state).filter(a=>a.status==='active'))add('agreement:'+a.id,name(a.person)+'과의 약속 정산',Math.max(a.dueDay,a.reviewDay||0),4,route('jobs','agreements','partners'),project?.agreement===a.id?'함께 맡은 제안을 마치거나 인계한 뒤 정산한다.':'함께한 일과 남은 준비금을 확인한다.');
    for(const plan of state.life.family.pending.filter(p=>p.parents.includes(id)))add('family:'+plan.parents.join(':')+':'+plan.dueDay,plan.name+'의 가족 합류',plan.dueDay,3,route('people','family'),plan.type==='adoption'?'합의한 입양과 돌봄 계획을 확인한다.':'합의한 출생·돌봄 계획을 확인한다.');
    const labels={job:'직업 이야기의 다음 만남',oversight:'직무 심사 연락',agencyReform:'정부조직 개편 심사',recruitment:'비공개 영입 제안',secretMission:'비밀 직업의 임무',underworld:'병행 활동의 첫 의뢰',aid:'지원 물자 도착',repair:'복구 후속 소식'};
    state.followUps.forEach((f,index)=>add('followup:'+index,labels[f.type]||'예정된 후속 연락',f.day,f.type==='oversight'?1:4,route(f.type==='agencyReform'?'jobs':'city',f.type==='agencyReform'?'agencies':'chapter',f.type==='agencyReform'?'mobility':undefined),'예정일에 시간 진행이 멈추고 사건이 나타날 수 있다.'));
    if(state.agencyProposal&&!state.followUps.some(f=>f.type==='agencyReform'))add('agency','정부조직 개편 심사',state.agencyProposal.due,4,route('jobs','agencies','mobility'),'기관 개편의 법·예산 심사 일정을 확인한다.');
    if(state.day<12)add('storm','첫 장마',12,2,route('city','chapter'),'공사 계획과 자금은 11일까지 직접 결정한다.');
    if(state.politics.nextDay>state.day){
      if(state.life.clock.mode==='lifetime'&&state.politics.nextDay-state.day>10)add('campaign','선거운동 기간',state.politics.nextDay-10,5,route('power','politics'),'출마와 선거 활동을 직접 선택할 수 있는 시점');
      add('election','동장 선거',state.politics.nextDay,5,route('power','politics'),'등록과 공약, 지지 기반을 확인한다.');
    }
    items.sort((a,b)=>a.day-b.day||a.priority-b.priority||a.id.localeCompare(b.id));
    const activeEvent=state.eventQueue[0],pendingPolicy=C.pacts.governing(state).length;
    let focus;
    if(activeEvent)focus={title:activeEvent.title,detail:activeEvent.resolved?'선택 결과를 확인한 뒤 다음 화면으로 돌아간다.':'이야기를 듣고 직접 답변한다.',event:true};
    else if(state.hearing&&state.hearing.day<=state.day)focus=items.find(i=>i.id==='hearing');
    else if(pendingPolicy)focus=items.find(i=>i.id.startsWith('policy:'));
    else focus=items.find(i=>i.day<=state.day)||items.find(i=>i.id.startsWith('project:')||i.id.startsWith('story:')||i.id.startsWith('echo:')&&i.priority===2);
    if(!focus&&state.life.clock.plan)focus={title:'멈춘 생활 계획을 확인한다',detail:'목표 '+state.life.clock.plan.target+'일 · 날짜를 넘기려면 남은 기간 이어가기를 직접 선택한다.',route:route('city','time')};
    if(!focus&&state.day<12)focus={title:state.surveyed?'장마 전 공사 조건을 비교한다':'수문공과 현장을 조사한다',detail:'측량·공동 출자·선주 계약의 조건을 직접 비교한다.',route:route('city','chapter')};
    if(!focus)focus={title:'오늘의 생활을 정한다',detail:'일하기·쉬기·사람 만나기 중 지금 필요한 행동을 고른다.',route:route('city','daily')};
    const expenses=costs(state),offer=C.workTerms(state),hearingNow=state.hearing&&state.hearing.day<=state.day;
    const workReason=activeEvent?'열린 사건을 먼저 확인하자.':hearingNow?'진행 중인 청문회를 먼저 마치자.':state.underReview?'직무 심사 중이다. 심사 연락과 가능한 생활 행동을 확인하자.':state.career==='unemployed'?'현재는 구직 중이다. 직업의 전직·조직에서 공고를 확인하자.':state.actions<1?'오늘 남은 행동이 없다.':state.energy<offer.energy?'기력 '+offer.energy+'이 필요하다. 지금 기력은 '+state.energy+'.':'';
    const restReason=activeEvent?'열린 사건을 먼저 확인하자.':hearingNow?'진행 중인 청문회를 먼저 마치자.':state.actions<1?'오늘 남은 행동이 없다.':state.energy>=100?'기력이 충분하다.':'';
    const warnings=[];
    if(state.cash<expenses.total)warnings.push('지금 소지금으로는 내일 기본 지출 '+expenses.total+'을 감당하기 어렵다. 근무나 자금 마련을 먼저 살펴보자.');
    if(state.actions<1)warnings.push('오늘의 행동을 모두 썼다. 하루를 마치거나 가능한 기간 생활을 직접 선택할 수 있다.');
    else if(state.energy<offer.energy&&state.career!=='unemployed')warnings.push('현재 근무에는 기력이 부족하다. 휴식은 행동 1을 쓰고 기력을 최대 30 회복한다.');
    return {items,focus,expenses,warnings,work:{...offer,reason:workReason},rest:{gain:Math.min(30,100-state.energy),reason:restReason},timeReason:C.lifePassReason(state,state.life.clock.plan?'lifeContinue':'lifePass')};
  }
  const api={build,costs};if(typeof module!=='undefined')module.exports=api;root.Agenda=api;
})(globalThis);
