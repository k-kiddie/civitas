'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');const A=C.projects.agreements;
function ready(type='trade'){
 const t=C.projects.templates[type],s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:3000,energy:100,career:t.jobs[0],built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;s.skills[t.skill]=1;
 if(s.career==='soldier')s.institution.department='army';
 for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;if(p.source==='resident'){p.age=p.baseAge=30;p.ageDay=100;p.health=90;p.relationship=55;p.society.ambition=80;p.society.security=60;p.society.community=60;}}return s;
}
function act(s,a){const r=C.apply(s,a);assert(r.state!==s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0],c=C.eventChoices(s,e).find(c=>c.id===id);assert(c&&!c.disabled,'선택 가능: '+id);return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function ack(s){return act(s,{type:'acknowledge'});}
function run(s){return C.projects.current(s)||s.life.projects.runs.at(-1);}
function pact(s){return s.life.workAgreements.contracts.at(-1);}
function pass(s,days){return act(s,{type:'lifePass',days,routine:'work'});}
function next(s){return act(s,{type:'lifeContinue'});}
function noPlan(s){return s.life.clock.plan?act(s,{type:'lifeCancel'}):s;}
function together(type='trade'){
 let s=act(ready(type),{type:'projectStart',project:type});const p=C.projects.pool(s,type).sort((a,b)=>C.projects.competence(b,type)-C.projects.competence(a,type))[0].id;
 s=ack(pick(s,'partner:'+p));s=pass(s,30);s=ack(pick(s,'verify'));s=next(s);s=ack(pick(s,'confirm'));return {state:noPlan(s),person:p};
}
function sign(s,person,type='trade'){s=act(s,{type:'agreementInvite',project:type,person});s=ack(pick(s,'agree'));return s;}
function publicMoney(s){return {treasury:s.treasury,budget:s.institution.agencyBudget,supplies:s.institution.supplies,party:Object.values(s.parties.registry).map(p=>p.funds)};}
function secondProject(s,person,choice='jointCheck',last='confirm'){
 // Day 280 is reached using the same daily simulation, rather than fabricating another completed project.
 s=pass(s,90);s=pass(s,90);assert.equal(s.day,301);s=act(s,{type:'projectStart',project:'trade'});s=ack(pick(s,'partner:'+person));s=pass(s,30);assert.equal(s.day,308);s=ack(pick(s,choice));s=next(s);assert.equal(s.day,322);s=ack(pick(s,last));return noPlan(s);
}
for(const type of Object.keys(C.projects.templates)){
 let {state:s,person}=together(type);const cash=s.cash,wealth=s.life.people[person].wealth,money=publicMoney(s),input=JSON.stringify(s);let n=act(s,{type:'agreementInvite',project:type,person});assert.equal(JSON.stringify(s),input);assert.equal(n.cash,cash);s=pick(n,'agree');assert.equal(s.cash,cash-6);assert.equal(s.life.people[person].wealth,wealth-6);assert.equal(pact(s).balance,12);assert.equal(pact(s).dueDay,486);assert.deepEqual(publicMoney(s),money);const old=s.eventQueue[0].id;assert.equal(C.apply(s,{type:'eventChoice',eventId:old,choice:'agree'}).state,s);s=ack(s);assert.match(C.succession.blocked(s),/준비금/);s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(s.life.workAgreements.contracts.length,1);
 s.actions=2;s=act(s,{type:'agreementReview',agreement:pact(s).id});const before=s.cash,other=s.life.people[person].wealth;s=pick(s,'settle');assert.equal(s.cash,before+6);assert.equal(s.life.people[person].wealth,other+6);assert.equal(pact(s).balance,0);assert.equal(pact(s).status,'released');assert.equal(s.life.people[person].workLinks.player.lastPromise,'released');
}
console.log('6분야 실제 공동 결과→약속 검토/수락 · 각자 6/준비금12 · 입력 불변/공금 분리/저장/중복/은퇴 제한 · 사전 통지와 양쪽 정산 통과');
{
 let {state:s,person}=together();s=sign(s,person);s=secondProject(s,person);assert.equal(pact(s).spent,4);assert.equal(pact(s).balance,8);assert.equal(pact(s).expenses.length,1);assert.equal(pact(s).fulfilled,1);assert.deepEqual(pact(s).projectIds,[run(s).id]);s=pass(s,365);assert.equal(s.day,486);assert(s.eventQueue[0].workAgreement);s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(pact(s).balance,8);const cash=s.cash,wealth=s.life.people[person].wealth;s=pick(s,'settle');assert.equal(pact(s).status,'fulfilled');assert.equal(s.cash,cash+4);assert.equal(s.life.people[person].wealth,wealth+4);assert.equal(pact(s).balance+pact(s).spent+pact(s).refunds.actor+pact(s).refunds.person,12);
}
{
 let {state:s,person}=together();s=sign(s,person);s=secondProject(s,person);s=pass(s,365);const cash=s.cash,wealth=s.life.people[person].wealth;s=pick(s,'renew');assert.equal(s.life.workAgreements.contracts.length,2);const old=s.life.workAgreements.contracts[0];assert.equal(old.status,'fulfilled');assert.equal(old.balance,0);assert.equal(s.cash,cash+4-6);assert.equal(s.life.people[person].wealth,wealth+4-6);assert.equal(pact(s).balance,12);assert.equal(pact(s).dueDay,851);assert.equal(pact(s).previous,old.id);
}
{
 let {state:s,person}=together();s=sign(s,person);s=pass(s,365);assert.equal(s.day,486);s=ack(pick(s,'extend'));assert(pact(s).extended);assert.equal(pact(s).dueDay,576);assert.equal(s.day,486);s=pass(s,90);assert.equal(s.day,576);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='extend'));const relationship=s.life.people[person].relationship;s=pick(s,'settle');assert.equal(pact(s).status,'unfulfilled');assert.equal(s.life.people[person].relationship,relationship-6);assert.equal(pact(s).refunds.actor,6);
}
console.log('공동 준비금으로 검증→실제 결과 확인→365일 정산 · 잔액/사용액 보존 · 이행 후 새 1년 갱신 · 한 번 90일 연장과 미이행 통과');
{
 let {state:s,person}=together();s=sign(s,person);s=act(s,{type:'agreementReview',agreement:pact(s).id});s=pick(s,'walkaway');assert.equal(pact(s).status,'broken');assert.match(A.reason(s,'trade',person),/70/);assert.equal(pact(s).refunds.actor,6);assert.equal(pact(s).refunds.person,6);
}
{
 let {state:s,person}=together();s=sign(s,person);s=pass(s,90);s=pass(s,90);s=act(s,{type:'projectStart',project:'trade'});s=ack(pick(s,'partner:'+person));s=pass(s,30);run(s).rivalBid=40;s=ack(pick(s,'jointCheck'));s=next(s);assert(!run(s).evaluation.won);s=pick(s,'blame');assert.equal(pact(s).status,'broken');assert.equal(pact(s).spent,4);assert.equal(pact(s).refunds.actor,4);assert.equal(pact(s).refunds.person,4);assert.equal(s.life.people[person].workLinks.player.lastPromise,'broken');
}
for(const reason of ['career','health','retired']){
 let {state:s,person}=together();s=sign(s,person);const cash=s.cash,wealth=s.life.people[person].wealth,relationship=s.life.people[person].relationship;
 if(reason==='career')s.life.people[person].occupation='journalist';if(reason==='health')s.life.people[person].health=20;if(reason==='retired')s.life.people[person].occupation='retired';
 C.projects.agreements.tick(s);assert.equal(pact(s).status,'mutual');assert.equal(s.cash,cash+6);assert.equal(s.life.people[person].wealth,wealth+6);assert.equal(s.life.people[person].relationship,relationship);C.projects.agreements.tick(s);assert.equal(s.cash,cash+6);
}
{
 let {state:s,person}=together();s=sign(s,person);s=pass(s,90);s=pass(s,90);s=act(s,{type:'projectStart',project:'trade'});s=ack(pick(s,'partner:'+person));s.life.people[person].occupation='journalist';A.tick(s);assert.equal(pact(s).status,'active','맡은 공동 일거리 중에는 준비금 정산을 보류');assert(!A.canSupport(s,run(s)));s.actions=2;s=act(s,{type:'projectCancel'});s=act(s,{type:'advance',to:'day'});assert.equal(pact(s).status,'mutual');
}
console.log('약속 파기/책임 전가의 신뢰 손실 · 동료의 전직/회복/은퇴 선택과 중립 정산 · 맡은 일 중 정산 보류 통과');
{
 let {state:s,person}=together();s=sign(s,person);const old='player',wealth=s.life.people[old].wealth,other=s.life.people[person].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(pact(s).status,'archived');assert.equal(s.life.people[old].wealth,wealth+6);assert.equal(s.life.people[person].wealth,other+6);s=C.normalize(s);assert.equal(s.life.people[old].wealth,wealth+6);assert.equal(A.own(s).length,0);
}
{
 let {state:s,person}=together();s=act(s,{type:'agreementInvite',project:'trade',person});const cash=s.cash,wealth=s.life.people[person].wealth;s=pick(s,'decline');assert.equal(s.cash,cash);assert.equal(s.life.people[person].wealth,wealth);assert.equal(s.life.workAgreements.contracts.length,0);
}
{
 let s=ready(),p=C.projects.pool(s,'trade')[0].id;assert.match(A.availability(s,'trade',p),/결과/);
 let result=together();s=result.state;p=result.person;s.life.people[p].society.independence=80;s.life.people[p].society.security=40;assert.match(A.reason(s,'trade',p),/독립/);s.life.people[p].society.security=60;s.life.people[p].wealth=5;assert.match(A.availability(s,'trade',p),/6/);s.life.people[p].wealth=30;s=sign(s,p);assert.match(A.reason(s,'trade',p),/이미/);
 s=ready();delete s.life.workAgreements;s=C.normalize(s);assert.deepEqual(s.life.workAgreements,{nextId:1,nextOffer:1,contracts:[]});
}
console.log('세대별 약속/잔액 귀속 · 거절 시 준비금 미지출 · 공동 경험/독립 성향/자금/중복 제한 · 기존 저장 보완 통과');

{
 let {state:s,person}=together();s=sign(s,person);s=act(s,{type:'agreementReview',agreement:pact(s).id});const cash=s.cash,wealth=s.life.people[person].wealth;s=ack(pick(s,'keep'));assert.equal(pact(s).status,'active');assert.equal(pact(s).balance,12);assert.equal(s.cash,cash);assert.equal(s.life.people[person].wealth,wealth);assert.equal(s.eventQueue.length,0);
 s=pass(s,90);s=pass(s,90);s=act(s,{type:'projectStart',project:'trade'});const other=C.projects.pool(s,'trade').find(p=>p.id!==person&&C.projects.willing(s,p)).id;s=ack(pick(s,'partner:'+other));assert.equal(run(s).agreement,null);s=pass(s,30);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='jointCheck'));assert.equal(pact(s).balance,12);assert.equal(pact(s).fulfilled,0);
}
{
 let {state:s,person}=together();s=sign(s,person);s=pass(s,365);s=ack(pick(s,'later'));assert.equal(pact(s).reviewDay,493);s=pass(s,30);assert.equal(s.day,493);s=ack(pick(s,'later'));s=next(s);assert.equal(s.day,500);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='later'));s=pick(s,'settle');assert.equal(pact(s).status,'unfulfilled');
}
{
 let {state:s,person}=together();s=sign(s,person);s.day=pact(s).dueDay;s.eventQueue.push({id:'critical',title:'중요 사건',day:s.day});A.tick(s);assert.equal(s.eventQueue.length,1);s=ack(s);assert(s.eventQueue[0].workAgreement);const cash=s.cash,wealth=s.life.people[person].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(pact(s).status,'archived');assert.equal(s.life.people[person].wealth,wealth+6);const newCash=s.cash;s=pick(s,'close');assert.equal(s.cash,newCash);
}
console.log('중도 검토 후 약속 유지 · 다른 동료/분야의 준비금 사용 차단 · 만기 7일 연기/횟수 제한 · 중요 사건 우선과 세대 교체 뒤 낡은 정산 선택 차단 통과');
