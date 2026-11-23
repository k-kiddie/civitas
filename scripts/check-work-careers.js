'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');const Career=C.projects.career;
function ready(type='trade'){
 const t=C.projects.templates[type],s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:5000,energy:100,career:t.jobs[0],built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;s.skills[t.skill]=1;if(s.career==='soldier')s.institution.department='army';
 for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;if(p.source==='resident'){p.age=p.baseAge=30;p.ageDay=100;p.health=90;p.relationship=60;p.society.ambition=80;p.society.security=60;p.society.community=60;p.society.independence=30;}}return s;
}
function act(s,a){const r=C.apply(s,a);assert(r.state!==s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0],c=C.eventChoices(s,e).find(c=>c.id===id);assert(c&&!c.disabled,'선택 가능: '+id);return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function ack(s){return act(s,{type:'acknowledge'});}
function run(s){return C.projects.current(s)||s.life.projects.runs.at(-1);}
function noPlan(s){return s.life.clock.plan?act(s,{type:'lifeCancel'}):s;}
function event(s){for(let i=0;i<6&&!s.eventQueue.length;i++)s=act(s,s.life.clock.plan?{type:'lifeContinue'}:{type:'lifePass',days:30,routine:'work'});assert(s.eventQueue[0]?.workProject);return s;}
function finish(s,type='trade',variant='field',grade='standard',cooperate=false){
 s=act(s,{type:'projectStart',project:type,variant,grade});const p=C.projects.pool(s,type).sort((a,b)=>C.projects.competence(b,type)-C.projects.competence(a,type))[0].id;s=ack(pick(s,'partner:'+p));s=event(s);
 if(variant==='field'){s=ack(pick(s,'field:'+(type==='workshop'?1:2)));s=event(s);}
 s=ack(pick(s,cooperate?'cooperate':'verify'));s=event(s);assert(run(s).evaluation.won);s=ack(pick(s,'confirm'));return noPlan(s);
}
function wait(s){s=act(s,{type:'lifePass',days:90,routine:'work'});return act(s,{type:'lifePass',days:90,routine:'work'});}
function qualified(type='trade'){let s=finish(ready(type),type);s=wait(s);s=finish(s,type,'basic');return wait(s);}
function publicMoney(s){return {treasury:s.treasury,budget:s.institution.agencyBudget,supplies:s.institution.supplies,party:Object.values(s.parties.registry).map(p=>p.funds)};}
for(const type of Object.keys(C.projects.templates)){
 let s=ready(type);assert(!Career.summary(s,type).ready);assert.match(C.projects.availability(s,type,'experienced'),/경력|선정/);assert.equal(C.apply(s,{type:'projectStart',project:type,variant:'field',grade:'experienced'}).state,s);
 s=finish(s,type);let report=Career.summary(s,type);assert.equal(report.paid,1);assert.equal(report.field,1);assert.equal(report.earned,12);assert.equal(report.expenses,4);assert(!report.ready);s=wait(s);s=finish(s,type,'basic');report=Career.summary(s,type);assert.equal(report.paid,2);assert.equal(report.field,1);assert.equal(report.trust,4);assert(report.ready);s=wait(s);
 const before=s.cash,client=C.projects.templates[type].client,wealth=s.life.people[client].wealth,publicBefore=publicMoney(s),input=JSON.stringify(s);let n=act(s,{type:'projectStart',project:type,variant:'field',grade:'experienced'});assert.equal(JSON.stringify(s),input);s=n;assert.equal(s.cash,before-8);assert.equal(s.life.people[client].wealth,wealth-48);assert.equal(run(s).escrow,48);assert.deepEqual(publicMoney(s),publicBefore);assert.equal(Career.terms(run(s)).difficulty,4);
 const p=C.projects.pool(s,type).sort((a,b)=>C.projects.competence(b,type)-C.projects.competence(a,type))[0].id;const startDay=s.day;s=ack(pick(s,'partner:'+p));s=event(s);assert.equal(s.day,startDay+3);s=ack(pick(s,'field:'+(type==='workshop'?1:2)));assert.equal(run(s).awardCap,36);s=event(s);assert.equal(s.day,startDay+14);s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(Career.terms(run(s)).budget,48);assert.match(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='verify').detail,/기준/);s=ack(pick(s,'verify'));assert.equal(run(s).evaluation.target,run(s).rivalBid+4);s=event(s);assert.equal(s.day,startDay+42);const cash=s.cash,peerWealth=s.life.people[p].wealth,clientWealth=s.life.people[client].wealth;s=pick(s,'confirm');assert.equal(s.cash,cash+24);assert.equal(s.life.people[p].wealth,peerWealth+12);assert.equal(s.life.people[client].wealth,clientWealth+12);assert.equal(run(s).payments.reduce((sum,p)=>sum+p.amount,0)+run(s).clientRefund,48);assert.equal(Career.summary(s,type).paid,3);assert.equal(Career.summary(s,type).earned,54);
}
console.log('6분야 실제 정산/현장 경력→숙련 해금 · 준비비8/보수48 · 14일 비교/28일 평가 · 기준+4 · 축소 보수36/몫12/차액12 · 공금 분리/저장 통과');
{
 let s=qualified();s=act(s,{type:'projectStart',project:'trade',variant:'field',grade:'experienced'});const p=C.projects.pool(s,'trade').sort((a,b)=>C.projects.competence(b,'trade')-C.projects.competence(a,'trade'))[0].id;s=ack(pick(s,'partner:'+p));s=event(s);s=ack(pick(s,'field:0'));assert.equal(run(s).awardCap,48);s=event(s);s=ack(pick(s,'cooperate'));assert.equal(run(s).evaluation.target,14);s=event(s);assert(run(s).evaluation.won);const cash=s.cash;s=pick(s,'confirm');assert.equal(s.cash,cash+28);assert.deepEqual(run(s).payments.map(p=>p.amount).sort((a,b)=>a-b),[8,12,28]);
}
{
 let s=qualified();const input=JSON.stringify(s);for(let i=0;i<3;i++){const report=Career.summary(s,'trade');assert(report.ready);assert.equal(report.paid,2);}assert.equal(JSON.stringify(s),input);
 s.life.projects.runs.push(JSON.parse(JSON.stringify(s.life.projects.runs[0])));assert.equal(Career.summary(s,'trade').paid,2,'동일 기록을 중복 경력으로 세지 않음');
 const actor=s.life.activeId;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(Career.summary(s,'trade').paid,0);assert(!Career.summary(s,'trade').ready);assert.equal(Career.summary(s,'trade',actor).paid,2);
}
{
 let s=qualified();const original=Career.summary(s,'trade');s.life.workAgreements.contracts.push({id:999,actor:'player',type:'trade',status:'broken'});const damaged=Career.summary(s,'trade');assert.equal(damaged.trust,original.trust-2);assert(!damaged.ready);
 s.life.workAgreements.contracts=[];s.life.projects.runs.push({...s.life.projects.runs[0],id:999,status:'complete',won:false,payments:[],blame:true});assert(!Career.summary(s,'trade').ready);assert.equal(Career.summary(s,'trade').blamed,1);
}
{
 let s=qualified(),client=C.projects.templates.trade.client;s.life.people[client].wealth=47;assert.match(C.projects.availability(s,'trade','experienced'),/48/);s.life.people[client].wealth=100;s.cash=7;assert.match(C.projects.availability(s,'trade','experienced'),/8/);s.cash=100;assert.equal(C.apply(s,{type:'projectStart',project:'trade',grade:'__proto__'}).state,s);
 s=act(s,{type:'projectStart',project:'trade',grade:'experienced'});s=ack(pick(s,'solo'));s.actions=2;const cash=s.cash,wealth=s.life.people[client].wealth;s=act(s,{type:'projectCancel'});assert.equal(s.life.people[client].wealth,wealth+48);assert.equal(s.cash,cash);assert.equal(run(s).escrow,0);
}
{
 let s=qualified();s=act(s,{type:'projectStart',project:'trade',grade:'experienced'});const client=run(s).client,wealth=s.life.people[client].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(run(s).status,'archived');assert.equal(s.life.people[client].wealth,wealth+48);s=C.normalize(s);assert.equal(s.life.people[client].wealth,wealth+48);
}
{
 let s=ready();s=act(s,{type:'projectStart',project:'trade'});delete run(s).terms;s=C.normalize(s);assert.equal(Career.terms(run(s)).budget,24);assert.equal(run(s).escrow,24);s=ack(pick(s,'solo'));s=event(s);assert.equal(s.day,107,'기존 의뢰 일정은 그대로');
}
console.log('숙련 전체 보수48의 세 사람 분배 · 경력 조회 불변/중복 기록/세대 분리 · 약속 파기/책임 전가의 신뢰 · 자금/등급 검증 · 취소/세대 변경 보수 반환 · 기존 저장 유지 통과');

{
 let s=qualified();const template=s.life.projects.runs[0];for(let i=0;i<8;i++)s.life.projects.runs.push({...template,id:100+i,closedDay:600+i});assert(Career.summary(s,'trade').ready);
 for(let i=0;i<2;i++)s.life.projects.runs.push({...template,id:200+i,closedDay:700+i,payments:[],won:false,blame:true});assert(!Career.summary(s,'trade').ready,'오랜 성공이 있어도 최근 반복된 책임 전가가 실무 신뢰를 낮춤');
}
{
 let s=ready();const original=JSON.stringify(s);s=act(s,{type:'projectStart',project:'trade'});s=ack(pick(s,'solo'));s=event(s);s=ack(pick(s,'submit'));s=event(s);assert(!run(s).evaluation.won);s=ack(pick(s,'confirm'));assert.equal(Career.summary(s,'trade').paid,0);assert.equal(Career.summary(s,'trade').honestLosses,1);assert(!Career.summary(s,'trade').ready);
}
console.log('실무 신뢰는 최근 행동을 반영해 과거 성공으로 고정되지 않음 · 선정되지 않은 평가는 보수 정산 경력으로 세지 않음 통과');

{
 let s=finish(ready(),'trade','basic');s=wait(s);s=finish(s,'trade','basic');assert.equal(Career.summary(s,'trade').paid,2);assert.equal(Career.summary(s,'trade').field,0);assert(!Career.summary(s,'trade').ready,'기본 제안 두 번만으로 현장 숙련 의뢰를 열지 않음');
}
{
 let s=finish(qualified(),'trade','field','experienced',true);assert.deepEqual(run(s).payments.map(p=>p.amount).sort((a,b)=>a-b),[8,12,16]);assert.equal(run(s).clientRefund,12);
}
{
 let s=qualified();s=act(s,{type:'projectStart',project:'trade',grade:'experienced'});const client=run(s).client;s.life.workAgreements.contracts.push({id:991,actor:'player',type:'trade',status:'broken'},{id:992,actor:'player',type:'trade',status:'broken'});assert(!Career.summary(s,'trade').ready);s=C.normalize(s);assert.equal(Career.terms(run(s)).budget,48);assert.equal(run(s).escrow,48);s=ack(pick(s,'solo'));s.actions=2;const before=s.life.people[client].wealth;s=act(s,{type:'projectCancel'});assert.equal(s.life.people[client].wealth,before+48);
}
console.log('현장 경력 없는 기본 제안만으로 숙련 해금 차단 · 축소 보수36의 삼자 분배 · 수락 후 신뢰가 바뀌어도 저장한 보수 조건 보존 통과');
