'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');const Agenda=require('../agenda');
function ready(){const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:2000,energy:100,built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=1000;s.randomState.lastDay=100000;for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;}return s;}
function act(s,a){const r=C.apply(s,a);assert(r.state!==s,r.message);return r.state;}
{
 let s=ready();s=act(s,{type:'projectStart',project:'workshop',variant:'field'});s=act(s,{type:'eventChoice',eventId:s.eventQueue[0].id,choice:'solo'});s=act(s,{type:'acknowledge'});
 const before=JSON.stringify(s);const model=Agenda.build(s);assert.equal(JSON.stringify(s),before);assert.equal(model.focus.id,'project:1');assert.equal(model.focus.day,103);assert.deepEqual(model.focus.route,{tab:'jobs',section:'projects',jobTab:'work'});assert.equal(model.items[0].id,'project:1');assert.equal(model.timeReason,'');
 s.life.clock.plan={from:100,target:190,routine:'work'};assert.equal(Agenda.build(s).timeReason,'');
}
{
 const s=ready();s.life.echoes.offers.push({id:1,actor:'player',person:'story-sora',sourceTitle:'이전 일',kind:'commission',status:'working',stage:'delivery',dueDay:110},{id:2,actor:'old-person',kind:'challenge',status:'waiting',dueDay:100});
 s.life.workAgreements.contracts.push({id:1,actor:'player',person:'resident-0',type:'workshop',status:'active',dueDay:200,reviewDay:207},{id:2,actor:'old-person',status:'active',dueDay:100});
 s.life.family.pending.push({name:'솔',type:'adoption',parents:['player'],dueDay:120},{name:'이웃 아이',type:'birth',parents:['resident-1','resident-2'],dueDay:101});
 s.followUps.push({type:'agencyReform',day:108});s.agencyProposal={due:108};const before=JSON.stringify(s),m=Agenda.build(s);assert.equal(JSON.stringify(s),before);
 assert(!m.items.some(i=>i.id==='echo:2'||i.id==='agreement:2'||i.title.includes('이웃 아이')));assert.equal(m.items.filter(i=>i.title==='정부조직 개편 심사').length,1);assert.equal(m.items.find(i=>i.id==='agreement:1').day,207);assert.equal(m.items.find(i=>i.title==='솔의 가족 합류').route.section,'family');assert.equal(m.items.find(i=>i.id==='followup:0').route.jobTab,'mobility');
}
{
 const s=ready();s.hearing={day:100,heard:[]};const m=Agenda.build(s);assert.equal(m.focus.id,'hearing');assert.equal(m.focus.route.section,'hearing');assert(m.work.reason);assert(m.rest.reason);assert.match(m.timeReason,/청문회/);s.eventQueue.push({id:'critical',title:'먼저 답할 사건'});assert(Agenda.build(s).focus.event);assert.equal(Agenda.build(s).focus.title,'먼저 답할 사건');
}
{
 const s=ready();s.election.round=1;s.pacts.agreements.push({id:1,round:1,status:'governing',dueDay:105});const m=Agenda.build(s);assert.equal(m.focus.id,'policy:1');assert.equal(m.focus.route.section,'pacts');assert.match(m.timeReason,/협약/);
}
console.log('오늘의 우선순위/진행 의뢰/연락 날짜와 이동 경로 · 본인 가족과 약속만 표시 · 읽기 불변 · 사건/청문회/정책 협약 우선 통과');
for(const kind of ['lifePass','lifeContinue'])for(const condition of ['setup','early','event','hearing','review','story','pact','conversion']){
 const s=ready();if(kind==='lifeContinue')s.life.clock.plan={from:100,target:190,routine:'work'};
 if(condition==='setup')s.startConfigured=false;if(condition==='early')s.day=20;if(condition==='event')s.eventQueue.push({id:'x'});if(condition==='hearing')s.hearing={day:101};if(condition==='review')s.underReview=true;if(condition==='story')s.jobStory.stage='waiting';if(condition==='pact'){s.election.round=1;s.pacts.agreements.push({id:1,status:'governing',round:1});}
 if(condition==='conversion'){s.life.clock.mode='daily';s.candidate=true;if(kind==='lifeContinue')continue;}
 const why=C.lifePassReason(s,kind);assert(why,condition);const action=kind==='lifePass'?{type:kind,days:30,routine:'work'}:{type:kind};const result=C.apply(s,action);assert.equal(result.state,s);assert.equal(result.message,why);
}
{
 const s=ready();s.actions=0;assert(Agenda.build(s).work.reason);assert(Agenda.build(s).rest.reason);assert(Agenda.build(s).warnings.some(w=>w.includes('행동')));s.actions=2;s.energy=5;assert.match(Agenda.build(s).work.reason,/기력/);s.career='unemployed';assert.match(Agenda.build(s).work.reason,/구직/);
}
for(const career of ['worker','trader','soldier','mayor']){
 let s=ready();s.career=career;s.institution.department='army';s.startingOccupation='worker';s.jobStory.wageBonus=2;if(career==='worker')s.funding='merchant';const m=Agenda.build(s),before=s.cash;const n=C.apply(s,{type:'work'});assert(n.state!==s);assert.equal(n.state.cash-before,m.work.wage);assert.equal(s.energy-n.state.energy,m.work.energy);
}
console.log('기간 생활 차단 설명과 실제 처리 동일 · 행동/기력/구직 안내 · 근무 품삯/계약 공제/기력과 기존 행동 일치 통과');
function child(s,id,shared=false,adultTomorrow=false){s.life.people[id]={id,name:id,source:'family',baseAge:adultTomorrow?17:6,ageDay:adultTomorrow?s.day+1-365:s.day,age:adultTomorrow?17:6,gender:'unspecified',health:90,wealth:0,relationship:60,occupation:'student',jobTitle:'학생',rank:0,since:s.day,lastDay:s.day,skills:{},history:[],education:{path:null,years:0},family:{parents:shared?['player','resident-0']:['player'],children:[],status:'dependent',sharedCare:shared}};}
{
 let s=ready();s.day=104;s.life.lastDay=104;for(const p of Object.values(s.life.people))p.lastDay=104;child(s,'kid-a');child(s,'kid-b',true);child(s,'kid-adult',false,true);const budget=Agenda.costs(s);assert.equal(budget.care,3);assert.equal(budget.rent,12);assert.equal(budget.total,18);assert.equal(budget.rentDay,105);const before=s.cash;s=act(s,{type:'advance',to:'day'});assert.equal(before-s.cash,budget.total);
}
{
 let s=ready();s.day=104;s.life.lastDay=104;for(const p of Object.values(s.life.people))p.lastDay=104;const player=C.life.player(s),spouse=s.life.people['resident-0'];player.family={...player.family,status:'married',partner:spouse.id,sharedHome:true};spouse.family={...spouse.family,status:'married',partner:player.id,sharedHome:true};assert.equal(Agenda.costs(s).rent,6);s.cash=0;assert(Agenda.build(s).warnings.some(w=>w.includes('기본 지출')));
}
console.log('내일 지출의 집세/공동 거주/돌봄 분담/성년 종료 · 실제 하루 정산과 일치 · 부족한 개인 돈 안내 통과');

{
 const s=C.normalize(C.fresh()),before=JSON.stringify(s);const model=Agenda.build(s);assert.equal(JSON.stringify(s),before);assert.equal(model.expenses.living,3);assert.match(model.timeReason,/시작 설정/);
}
{
 const s=ready();s.followUps.push({type:'job',day:102});s.jobStory.stage='waiting';const m=Agenda.build(s);assert.equal(m.items[0].title,'직업 이야기의 다음 만남');assert.equal(m.items[0].day,102);assert.match(m.timeReason,/직업 이야기/);
}
{
 const s=ready();s.life.clock.plan={from:80,target:120,routine:'rest'};const m=Agenda.build(s);assert.equal(m.focus.route.section,'time');assert.equal(m.timeReason,'');
}
console.log('시작 설정 전 조회 · 직업별 첫 후속 만남과 시간 제한 · 멈춘 생활 계획의 이동 안내 통과');
