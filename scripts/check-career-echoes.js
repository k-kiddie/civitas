'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');
function ready(career='trader'){
 const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:3000,energy:100,career,built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;
 if(career==='official')s.institution.department=Object.keys(s.agencies).find(id=>s.agencies[id].branch==='civil');if(career==='soldier')s.institution.department='army';
 for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;}return s;
}
function act(s,a){const r=C.apply(s,a);assert.notEqual(r.state,s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0],c=C.eventChoices(s,e).find(c=>c.id===id);assert(c&&!c.disabled,'선택 가능: '+id);return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function ack(s){return act(s,{type:'acknowledge'});}
function pass(s,days=90){return act(s,{type:'lifePass',days,routine:'work'});}
function cancel(s){return s.life.clock.plan?act(s,{type:'lifeCancel'}):s;}
function complete(id='trade',route='compromise',last=route==='conceal'?'doubleDown':'finish'){
 let s=ready(C.chronicles.templates[id].jobs[0]);s=act(s,{type:'chronicleStart',story:id});s=ack(pick(s,'document'));s=pass(s,30);s=ack(pick(s,route));s=act(s,{type:'lifeContinue'});s=pass(s);s=ack(pick(s,last));return cancel(s);
}
function echo(s){return s.life.echoes.offers[0];}
function publicMoney(s){return {treasury:s.treasury,budget:s.institution.agencyBudget,supplies:s.institution.supplies,party:Object.values(s.parties.registry).map(p=>p.funds)};}
for(const id of Object.keys(C.chronicles.templates)){
 let s=complete(id);assert.equal(echo(s).kind,'commission');assert.equal(echo(s).dueDay,249);s=pass(s);assert.equal(s.day,249);assert(s.eventQueue[0].careerEcho);
 const p=echo(s).person,cash=s.cash,wealth=s.life.people[p].wealth,publicBefore=publicMoney(s),input=JSON.stringify(s);const oldEvent=s.eventQueue[0].id;
 let n=pick(s,'accept');assert.equal(JSON.stringify(s),input);s=n;assert.equal(s.cash,cash-4);assert.equal(s.life.people[p].wealth,wealth-18);assert.equal(echo(s).escrow,18);assert.equal(echo(s).dueDay,263);assert.deepEqual(publicMoney(s),publicBefore);
 assert.equal(C.apply(s,{type:'eventChoice',eventId:oldEvent,choice:'accept'}).state,s);
 s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(echo(s).escrow,18);assert.match(C.echoes.blocked(s),/후속 의뢰/);s=ack(s);assert.match(C.succession.blocked(s),/후속 의뢰/);s=act(s,{type:'lifeContinue'});assert.equal(s.day,263);assert(s.eventQueue[0].careerEcho);const before=s.cash;s=pick(s,'deliver');assert.equal(s.cash,before+18);assert.equal(echo(s).escrow,0);assert.equal(echo(s).status,'complete');assert.equal(echo(s).choices.length,2);
 s=ack(s);for(let i=0;i<3;i++)s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(s.life.echoes.offers.length,1);assert.equal(echo(s).status,'complete');assert.equal(C.echoes.blocked(s),'');
}
console.log('5개 이야기의 타협 결말→45일 뒤 공동 의뢰→14일 뒤 보수 지급 · 의뢰인 돈/보관 보수 보존 · 개인 준비비 · 공금 분리 · 압축 정지/저장/중복 차단 통과');
{
 let s=complete('trade','report');assert.equal(echo(s).kind,'referral');assert.equal(echo(s).dueDay,264);s=pass(s);assert.equal(s.day,264);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='job').disabled);
 const p=echo(s).person,cash=s.cash,wealth=s.life.people[p].wealth;const oldEvent=s.eventQueue[0].id;s=pick(s,'train');assert.equal(s.cash,cash-4);assert.equal(s.life.people[p].wealth,wealth-4);assert.equal(s.skills.administration,1);s=ack(s);assert.notEqual(s.eventQueue[0].id,oldEvent);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='train').disabled);assert(!C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='job').disabled);
 s=pick(s,'job');assert.equal(s.career,'journalist');assert.equal(echo(s).status,'complete');assert.equal(s.life.people.player.occupation,'journalist');
}
{
 let s=complete('workshop','report');s=pass(s);assert.equal(s.skills.craft,1);assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='train').disabled);s=pick(s,'job');assert.equal(s.career,'artisan');
}
{
 let s=complete('trade','report');s=pass(s);s.life.people[echo(s).person].relationship=40;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='train').disabled);s=pick(s,'decline');assert.equal(echo(s).status,'declined');
}
console.log('공개 결말→추천 · 본인/추천인 공동 교육비 · 자격 충족 후 실제 전직 · 기존 훈련/관계/현재 직책 조건 · 중복 교육 차단 통과');
for(const id of ['trade','civil','military'])for(const answer of ['disclose','admit','ignore']){
 let s=complete(id,'conceal');assert.equal(echo(s).kind,'challenge');assert.equal(echo(s).dueDay,294);assert.match(C.succession.blocked(s),/해명 요구/);
 s.institution.merit=30;s.institution.scrutiny=10;s=pass(s);assert.equal(s.day,294);assert.equal(echo(s).report.submittedDay,294);const merit=s.institution.merit,scrutiny=s.institution.scrutiny,cash=s.cash;s=pick(s,answer);assert.equal(s.cash,cash);assert.equal(echo(s).answer,answer);assert.equal(echo(s).report.answer,answer);assert.equal(s.life.chronicles.runs[0].outcome,'doubleDown');
 if(id==='trade'){assert.equal(s.institution.merit,merit);assert.equal(s.institution.scrutiny,scrutiny);}else{assert(s.institution.merit<merit);assert(s.institution.scrutiny>scrutiny);}
 assert.equal(C.echoes.blocked(s),'');
}
{
 let s=complete('civil','conceal');const oldDepartment=s.institution.department;s.career='official';s.institution.department=Object.keys(s.agencies).find(id=>id!==oldDepartment&&s.agencies[id].branch==='civil');s.institution.merit=30;s=pass(s);const merit=s.institution.merit,scrutiny=s.institution.scrutiny;s=pick(s,'ignore');assert.equal(s.institution.merit,merit);assert.equal(s.institution.scrutiny,scrutiny);
}
{
 let s=complete('military','conceal');s.institution.merit=30;s.institution.scrutiny=50;s=act(s,{type:'careerEchoReview',echo:echo(s).id});assert.equal(s.day,204);s=pick(s,'ignore');assert(s.eventQueue.some(e=>e.institutionAudit),'감사 문턱을 넘으면 기존 감사 절차로 연결');
}
console.log('허위 서명 유지→90일 뒤 해명/정정/무응답 · 같은 기관만 실적/감사 반영 · 무관한 기관 보호 · 미리 답변/은퇴 제한 · 기존 감사 연결 통과');
{
 let s=complete('trade','conceal','correct');assert.equal(echo(s).kind,'repair');s=pass(s);const p=echo(s).person,relationship=s.life.people[p].relationship;s=pick(s,'help');assert.equal(s.life.people[p].relationship,relationship+6);assert.equal(s.life.chronicles.runs[0].outcome,'correct');
}
{
 let s=complete();s=pass(s);s=ack(pick(s,'accept'));s.actions=2;s=act(s,{type:'applyJob',career:'worker'});s=act(s,{type:'lifeContinue'});assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='deliver').disabled);const p=echo(s).person,wealth=s.life.people[p].wealth,cash=s.cash;s=pick(s,'cancel');assert.equal(s.life.people[p].wealth,wealth+18);assert.equal(s.cash,cash);assert.equal(echo(s).status,'cancelled');assert.equal(echo(s).escrow,0);
}
{
 let s=complete();s=pass(s);s=ack(pick(s,'accept'));s=act(s,{type:'lifeContinue'});const p=echo(s).person,wealth=s.life.people[p].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(echo(s).status,'archived');assert.equal(echo(s).escrow,0);assert.equal(s.life.people[p].wealth,wealth+18);const cash=s.cash;s=pick(s,'close');assert.equal(s.cash,cash);s=C.normalize(s);assert.equal(s.life.people[p].wealth,wealth+18,'환급 중복 없음');
}
{
 let s=complete('trade','report');delete s.life.echoes;s.day=900;const migrated=C.normalize(s);assert.equal(echo(migrated).dueDay,914);assert.equal(migrated.life.echoes.offers.length,1);s=C.normalize(migrated);assert.equal(echo(s).dueDay,914);
}
{
 let s=complete();s=pass(s);s=ack(pick(s,'later'));s=act(s,{type:'lifeContinue'});assert.equal(s.day,256,'7일 뒤 재연락은 신규 연락 30일 간격과 별도');s=ack(pick(s,'later'));s=act(s,{type:'lifeContinue'});assert.equal(s.day,263);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='later'));s=pick(s,'decline');
}
console.log('정정 후 관계 회복 부탁 · 전직 후 의뢰 인계/보수 환급 · 조작 인물 교체 시 귀속/보수 보존 · 기존 저장 유예와 일회성 보완 · 7일 연기 통과');

{
 let s=complete();s=pass(s);const p=echo(s).person;s.life.people[p].wealth=17;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='accept').disabled);
 const input=JSON.stringify(s);assert.equal(C.apply(s,{type:'eventChoice',eventId:s.eventQueue[0].id,choice:'accept'}).state,s);assert.equal(JSON.stringify(s),input);
 s.life.people[p].wealth=30;s.cash=3;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='accept').disabled);s.cash=100;s.life.people[p].relationship=49;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='accept').disabled);
}
{
 let s=complete('civil','conceal');const source=s.institution.department,target=Object.keys(s.agencies).find(id=>id!==source&&s.agencies[id].branch==='civil');delete s.agencies[source];s.institution.department=target;s.agencyHistory.push({status:'enacted',type:'mergeAgency',source,target,resolvedDay:205});s.institution.merit=20;s=pass(s);const before=s.institution.merit;s=pick(s,'admit');assert.equal(s.institution.merit,before-6);
}
{
 let s=complete();s.day=249;s.eventQueue.push({id:'critical',title:'먼저 처리할 일',day:249});C.echoes.tick(s);assert.equal(s.eventQueue.length,1);s=ack(s);assert(s.eventQueue[0].careerEcho);
}
{
 let s=complete('trade','report');s=pass(s);s.career='mayor';assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='job').disabled);const input=JSON.stringify(s);assert.equal(C.apply(s,{type:'eventChoice',eventId:s.eventQueue[0].id,choice:'job'}).state,s);assert.equal(JSON.stringify(s),input);
}
console.log('부족한 의뢰인/플레이어 자금과 관계에서 의뢰 차단 · 승인된 기관 흡수 후 책임 유지 · 중요 사건 우선 · 동장 직책의 구직 제한 유지 통과');
