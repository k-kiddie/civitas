'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');
function ready(type='trade',seed=0){
 const t=C.projects.templates[type],s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:3000,energy:100,career:t.jobs[0],built:'long',flooded:type==='patrol'&&seed===1?18:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;s.randomState.seed=seed;s.skills[t.skill]=1;if(s.career==='soldier')s.institution.department='army';
 for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;if(p.source==='resident'){p.age=p.baseAge=30;p.ageDay=100;p.health=90;p.relationship=60;p.society.ambition=80;p.society.security=60;p.society.community=60;p.society.independence=30;}}return s;
}
function act(s,a){const r=C.apply(s,a);assert(r.state!==s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0],c=C.eventChoices(s,e).find(c=>c.id===id);assert(c&&!c.disabled,'선택 가능: '+id);return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function ack(s){return act(s,{type:'acknowledge'});}
function r(s){return C.projects.current(s)||s.life.projects.runs.at(-1);}
function a(s){return s.life.workAgreements.contracts.at(-1);}
function pass(s,days=30){return act(s,{type:'lifePass',days,routine:'work'});}
function next(s){return act(s,{type:'lifeContinue'});}
function cancelPlan(s){return s.life.clock.plan?act(s,{type:'lifeCancel'}):s;}
function start(s,type='trade',variant='field'){return act(s,{type:'projectStart',project:type,variant});}
function peer(s){return C.projects.pool(s,r(s).type).sort((a,b)=>C.projects.competence(b,r(s).type)-C.projects.competence(a,r(s).type))[0].id;}
function atField(type='trade',seed=0){let s=start(ready(type,seed),type);s=ack(pick(s,'partner:'+peer(s)));s=pass(s);assert.equal(s.day,103);assert.equal(r(s).stage,'field');return s;}
function publicMoney(s){return {treasury:s.treasury,budget:s.institution.agencyBudget,supplies:s.institution.supplies,party:Object.values(s.parties.registry).map(p=>p.funds)};}
const seen=new Set();
for(const type of Object.keys(C.projects.templates))for(const seed of [0,1])for(const choice of [0,1,2]){
 let s=atField(type,seed);seen.add(type+':'+r(s).incident.case);const peerId=r(s).partner,peerWealth=s.life.people[peerId].wealth,cash=s.cash,publicBefore=publicMoney(s),caseId=r(s).incident.case;
 s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(r(s).incident.case,caseId);const input=JSON.stringify(s),oldEvent=s.eventQueue[0].id;s=pick(s,'field:'+choice);assert.equal(s.cash,cash-r(s).incident.cost.actor);assert.equal(s.life.people[peerId].wealth,peerWealth-r(s).incident.cost.person);assert.deepEqual(publicMoney(s),publicBefore);assert.equal(r(s).choices.at(-1).cash,r(s).incident.cost.actor);assert.equal(C.apply(s,{type:'eventChoice',eventId:oldEvent,choice:'field:'+choice}).state,s);assert.notEqual(JSON.stringify(s),input);
 const cap=r(s).awardCap,expectedDay=107+r(s).incident.effect.delay;s=ack(s);s=next(s);assert.equal(s.day,expectedDay);assert.equal(r(s).stage,'contest');assert(C.projects.evaluation(s,r(s)).parts.some(p=>p.label==='현장 조건 확인'));s=ack(pick(s,'verify'));s=next(s);assert.equal(s.day,expectedDay+14);assert(r(s).evaluation.won);
 const client=r(s).client,before=s.cash,clientBefore=s.life.people[client].wealth,peerBefore=s.life.people[peerId].wealth;s=pick(s,'confirm');assert.equal(s.cash,before+cap-6);assert.equal(s.life.people[peerId].wealth,peerBefore+6);assert.equal(s.life.people[client].wealth,clientBefore+24-cap);assert.equal(r(s).payments.reduce((sum,p)=>sum+p.amount,0)+r(s).clientRefund,24);assert.equal(r(s).escrow,0);
}
assert.equal(seen.size,12);
console.log('6분야×상황 2종×세 선택 · 3일 현장 협의/7일 비교/지연 · 개인/NPC 비용 · 범위별 보수 18/24와 차액 반환 · 공금 분리/저장/중복 통과');
{
 let s=atField();const p=r(s).partner;s.life.people[p].wealth=1;assert.match(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:1').detail,/돈이 부족/);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:1').disabled);const input=JSON.stringify(s);assert.equal(C.apply(s,{type:'eventChoice',eventId:s.eventQueue[0].id,choice:'field:1'}).state,s);assert.equal(JSON.stringify(s),input);
 s.life.people[p].wealth=20;s.life.people[p].relationship=54;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:1').disabled);s.life.people[p].relationship=60;r(s).incident.opinion.community=40;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:1').disabled);
}
for(const type of ['workshop','military']){
 let s=start(ready(type),type),p=peer(s);s.life.people[p].society.independence=80;s=ack(pick(s,'partner:'+p));s=pass(s);const oldRelation=s.life.people[p].relationship;s=pick(s,'field:'+(type==='workshop'?2:1));assert.equal(r(s).partner,null);assert.equal(r(s).formerPartner,p);assert.equal(s.life.people[p].relationship,oldRelation-2);assert.equal(s.life.people[p].workLinks.player.lastOutcome,'steppedAway');s=ack(s);s=next(s);assert.notEqual(r(s).rival,p);
}
{
 let s=start(ready('care'),'care'),p=peer(s);s.life.people[p].society.training={target:'journalist',skill:'administration',dueDay:125};s=ack(pick(s,'partner:'+p));s=pass(s);assert(r(s).incident.opinion.trainingSoon);s=pick(s,'field:0');assert.equal(r(s).formerPartner,p);assert.equal(r(s).partner,null);
}
console.log('동료의 비용 동의와 자금 조건 · 무리한 일정/교육 충돌 거절 · 참여자와 평가 변경 · 빠진 동료를 즉시 경쟁자로 재사용하지 않음 통과');
function signed(type='workshop'){
 let s=start(ready(type),type,'basic'),p=peer(s);s=ack(pick(s,'partner:'+p));s=pass(s);s=ack(pick(s,'verify'));s=next(s);s=ack(pick(s,'confirm'));s=cancelPlan(s);s=act(s,{type:'agreementInvite',project:type,person:p});s=ack(pick(s,'agree'));s=pass(s,90);s=pass(s,90);return {s,p};
}
{
 let {s,p}=signed();s=start(s,'workshop');s=ack(pick(s,'partner:'+p));s=pass(s);assert(C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='field:fund'));const cash=s.cash;s=pick(s,'field:fund');assert.equal(s.cash,cash);assert.equal(a(s).balance,8);assert.equal(a(s).spent,4);assert(a(s).expenses[0].text.includes('현장 의뢰'));s=ack(s);s=next(s);s=ack(pick(s,'jointCheck'));assert.equal(a(s).balance,4);assert.equal(a(s).spent,8);s=next(s);s=ack(pick(s,'confirm'));assert.equal(a(s).fulfilled,1);s=cancelPlan(s);s=pass(s,365);const before=s.cash,wealth=s.life.people[p].wealth;s=pick(s,'settle');assert.equal(s.cash,before+2);assert.equal(s.life.people[p].wealth,wealth+2);assert.equal(a(s).spent+a(s).refunds.actor+a(s).refunds.person,12);
}
{
 let {s,p}=signed();s=start(s,'workshop');s.life.people[p].society.training={target:'journalist',skill:'administration',dueDay:s.day+25};s=ack(pick(s,'partner:'+p));s=pass(s);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:fund').disabled);const cash=s.cash,wealth=s.life.people[p].wealth;s=pick(s,'field:0');assert.equal(a(s).status,'mutual');assert.equal(s.cash,cash-4+6);assert.equal(s.life.people[p].wealth,wealth+6);assert.equal(r(s).agreement,null);assert.equal(a(s).spent,0);
}
console.log('현장 비용을 공동 준비금으로 지출/검증과 별도 기록 · 잔액 12 보존 · 동료의 일정 거절 시 동의 없는 공동금 사용 차단과 약속 중립 정산 통과');
{
 let s=atField();const p=r(s).partner,client=r(s).client;s=pick(s,'field:1');assert.equal(r(s).incident.cost.person,2);const spent=s.cash,wealth=s.life.people[client].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(r(s).status,'archived');assert.equal(s.life.people[client].wealth,wealth+24);const cash=s.cash;s=ack(s);assert.equal(s.cash,cash);s=C.normalize(s);assert.equal(s.life.people[client].wealth,wealth+24);
}
{
 let s=start(ready(),'trade','basic');s=ack(pick(s,'solo'));s=pass(s);assert.equal(s.day,107);assert.equal(r(s).stage,'contest');assert(!r(s).incident);
 const old=ready();assert.equal(C.apply(old,{type:'projectStart',project:'trade',variant:'__proto__'}).state,old);
}
{
 let s=atField();s=ack(pick(s,'later'));s=next(s);assert.equal(s.day,110);s=pick(s,'field:2');assert.equal(r(s).dueDay,111,'날짜가 지난 비교는 최소 다음날 진행');
}
console.log('기존 저장/기본 제안 유지 · 세대 교체 뒤 보수 반환과 실제 지출 보존 · 잘못된 의뢰 방식 차단 · 현장 연기 뒤 비교 일정 역행 방지 통과');

{
 let s=atField();s.cash=-5;assert(!C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:2').disabled);assert(!C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='cancel').disabled);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='field:0').disabled);s=pick(s,'field:2');assert.equal(s.cash,-5);
}
console.log('생활비 부족으로 빚이 있어도 추가 비용 없는 범위 축소/인계를 선택할 수 있어 사건에 갇히지 않음 통과');
