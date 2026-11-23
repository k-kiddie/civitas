'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');
function ready(type='trade'){
 const t=C.projects.templates[type];const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:3000,energy:100,career:t.jobs[0],built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;s.skills[t.skill]=1;
 if(s.career==='official')s.institution.department=Object.keys(s.agencies).find(id=>s.agencies[id].branch==='civil');if(s.career==='soldier')s.institution.department='army';
 for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;if(p.source==='resident'){p.age=p.baseAge=30;p.ageDay=100;p.health=90;p.relationship=55;p.society.ambition=80;p.society.security=60;p.society.community=60;}}
 return s;
}
function act(s,a){const r=C.apply(s,a);assert.notEqual(r.state,s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0],c=C.eventChoices(s,e).find(c=>c.id===id);assert(c&&!c.disabled,'선택 가능: '+id);return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function ack(s){return act(s,{type:'acknowledge'});}
function start(s,type='trade'){return act(s,{type:'projectStart',project:type});}
function run(s){return C.projects.current(s)||s.life.projects.runs.at(-1);}
function time(s){return act(s,{type:'lifePass',days:30,routine:'work'});}
function next(s){return act(s,{type:'lifeContinue'});}
function partner(s){return C.projects.pool(s,run(s).type).filter(p=>C.projects.willing(s,p)).sort((a,b)=>C.projects.competence(b,run(s).type)-C.projects.competence(a,run(s).type))[0].id;}
function publicMoney(s){return {treasury:s.treasury,budget:s.institution.agencyBudget,supplies:s.institution.supplies,party:Object.values(s.parties.registry).map(p=>p.funds)};}
for(const type of Object.keys(C.projects.templates)){
 let s=ready(type),client=C.projects.templates[type].client,cash=s.cash,wealth=s.life.people[client].wealth,input=JSON.stringify(s);const money=publicMoney(s);let n=start(s,type);assert.equal(JSON.stringify(s),input);s=n;assert.equal(s.cash,cash-4);assert.equal(s.life.people[client].wealth,wealth-24);assert.equal(run(s).escrow,24);assert.deepEqual(publicMoney(s),money);
 const peer=partner(s),relation=s.life.people[peer].relationship;s=ack(pick(s,'partner:'+peer));assert.match(C.succession.blocked(s),/공동 일거리/);s=time(s);assert.equal(s.day,107);assert.equal(s.life.clock.plan.target,130);assert(run(s).rival);assert.notEqual(run(s).rival,peer);assert.notEqual(run(s).rival,'player');const opponent=run(s).rival,bid=run(s).rivalBid;
 s=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(run(s).rival,opponent);assert.equal(run(s).rivalBid,bid);assert(Number.isFinite(C.projects.evaluation(s,run(s)).score));const choice=C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='verify');assert.match(choice.detail,/예상 평가/);
 const oldEvent=s.eventQueue[0].id;s=pick(s,'verify');assert.equal(C.apply(s,{type:'eventChoice',eventId:oldEvent,choice:'verify'}).state,s);assert(run(s).evaluation.won);s=ack(s);s=next(s);assert.equal(s.day,121);assert(s.eventQueue[0].workProject);const before=s.cash,peerWealth=s.life.people[peer].wealth;s=pick(s,'confirm');assert.equal(s.cash,before+18);assert.equal(s.life.people[peer].wealth,peerWealth+6);assert.equal(run(s).escrow,0);assert.equal(run(s).payments.reduce((sum,p)=>sum+p.amount,0),24);assert.equal(run(s).status,'complete');assert.equal(s.life.people[peer].relationship,relation+5);assert.equal(s.life.people[peer].workLinks.player.lastOutcome,'success');s=ack(s);assert.equal(C.projects.blocked(s),'');assert.match(C.projects.availability(s,type),/280/);
}
console.log('6분야 공동 제안 · 명부 전체 동료 선택/동적 경쟁자 · 실무/성향 평가 · 7일/21일 연락 · 저장/중복 · 보수 24의 실제 분배와 공금 분리 통과');
{
 let s=start(ready());const p=partner(s);s=ack(pick(s,'partner:'+p));s=time(s);const opponent=run(s).rival,preview=C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='cooperate');assert(!preview.disabled);assert(!preview.detail.includes('NaN'));s=ack(pick(s,'cooperate'));assert.equal(run(s).coauthor,opponent);assert.equal(run(s).evaluation.target,10);s=next(s);const cash=s.cash,a=s.life.people[p].wealth,b=s.life.people[opponent].wealth;s=pick(s,'confirm');assert.equal(s.cash,cash+14);assert.equal(s.life.people[p].wealth,a+6);assert.equal(s.life.people[opponent].wealth,b+4);assert.equal(s.life.people[opponent].workLinks.player.lastOutcome,'success');
}
{
 let s=start(ready());const p=partner(s);s=ack(pick(s,'partner:'+p));s=time(s);const opponent=run(s).rival;s.life.people[opponent].relationship=30;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='cooperate').disabled);s=ack(pick(s,'rework'));assert.equal(run(s).dueDay,128);s=next(s);assert.equal(s.day,128);s=pick(s,'confirm');assert(run(s).won);
}
{
 let s=ready();s.skills.commerce=0;s=start(s);s=ack(pick(s,'solo'));s=time(s);s=ack(pick(s,'submit'));s=next(s);assert(!run(s).evaluation.won);const client=run(s).client,cash=s.cash,wealth=s.life.people[client].wealth;s=pick(s,'confirm');assert.equal(s.cash,cash);assert.equal(s.life.people[client].wealth,wealth+24);assert.equal(run(s).payments.length,0);
}
{
 let s=ready();s.skills.commerce=0;for(const p of C.projects.pool(s,'trade')){p.relationship=45;p.skills={};}s=start(s);const peer=partner(s);s=ack(pick(s,'partner:'+peer));s=time(s);run(s).rivalBid=30;s=ack(pick(s,'submit'));s=next(s);assert(!run(s).evaluation.won);s=pick(s,'blame');assert.equal(s.life.people[peer].relationship,35);assert.equal(s.life.people[peer].workLinks.player.lastOutcome,'blamed');assert(!C.projects.willing(s,s.life.people[peer]));assert(C.projects.historyScore(s,'trade').some(p=>p.value===-2));
}
console.log('경쟁에서 공동 확인으로 전환 · 세 사람에게 보수 24 분배 · 상대 거부 · 추가 준비와 지연 · 미선정 환급 · 책임 전가 뒤 참여 거부와 다음 평가 통과');
// Actor-specific history from earlier stories changes a live project's evaluation, without rewriting those stories.
{
 const s=ready();s.life.chronicles.runs.push({id:91,actor:'player',template:'trade',status:'complete',outcome:'report',result:'이전 거래 · 기록',closedDay:10});s.life.echoes.offers.push({id:91,run:91,actor:'player',status:'complete'});const a=start(s);assert.equal(run(a).reputation[0].value,2);
 const other=ready();other.life.chronicles.runs.push({id:92,actor:'player',template:'trade',status:'complete',outcome:'doubleDown',result:'이전 거래 · 기록',closedDay:10});other.life.echoes.offers.push({id:92,run:92,actor:'player',status:'complete'});const b=start(other);assert.equal(run(b).reputation[0].value,-3);assert.equal(C.projects.evaluation(a,run(a)).score-C.projects.evaluation(b,run(b)).score,5);
}
{
 let s=start(ready());s=ack(pick(s,'solo'));s.actions=2;s=act(s,{type:'applyJob',career:'worker'});s=time(s);assert(s.eventQueue[0].workProject.departed);assert.deepEqual(C.eventChoices(s,s.eventQueue[0]).map(c=>c.id),['cancel']);const client=run(s).client,cash=s.cash,wealth=s.life.people[client].wealth;s=pick(s,'cancel');assert.equal(s.cash,cash);assert.equal(s.life.people[client].wealth,wealth+24);assert.equal(run(s).status,'cancelled');
}
{
 let s=start(ready());const client=run(s).client,wealth=s.life.people[client].wealth;s.life.activeId='resident-0';s=C.normalize(s);assert.equal(run(s).status,'archived');assert.equal(s.life.people[client].wealth,wealth+24);const cash=s.cash;s=pick(s,'close');assert.equal(s.cash,cash);s=C.normalize(s);assert.equal(s.life.people[client].wealth,wealth+24);
}
{
 let s=start(ready());s=ack(pick(s,'solo'));s.actions=2;const client=run(s).client,wealth=s.life.people[client].wealth;s=act(s,{type:'projectCancel'});assert.equal(s.life.people[client].wealth,wealth+24);assert.equal(C.projects.current(s),undefined);
}
{
 let s=start(ready());s=ack(pick(s,'later'));s=time(s);assert.equal(s.day,107);s=ack(pick(s,'later'));s=next(s);assert.equal(s.day,114);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='later'));s=pick(s,'solo');assert.equal(run(s).dueDay,121);
}
console.log('이전 이야기의 신뢰/허위 서명 평가 반영 · 전직 인계 · 세대별 관계와 보수 귀속 · 수동 인계/7일 연기 통과');

{
 let s=ready();s.day=27;assert.equal(C.apply(s,{type:'projectStart',project:'trade'}).state,s);
 s=ready();s.cash=3;assert.equal(C.apply(s,{type:'projectStart',project:'trade'}).state,s);
 s=ready();s.life.people['story-doyun'].wealth=23;assert.equal(C.apply(s,{type:'projectStart',project:'trade'}).state,s);
 s=ready();assert.equal(C.apply(s,{type:'projectStart',project:'__proto__'}).state,s);
 s=ready();s.hearing={day:101};assert.match(C.projects.availability(s,'trade'),/심사/);
 s=ready();const baseline=C.projects.pool(s,'trade').length;const p=s.life.people['resident-11'];p.occupation='trader';p.age=p.baseAge=17;assert.equal(C.projects.pool(s,'trade').length,baseline);p.age=p.baseAge=30;p.health=44;assert.equal(C.projects.pool(s,'trade').length,baseline);p.health=80;assert.equal(C.projects.pool(s,'trade').length,baseline+1);
 s=ready();delete s.life.projects;for(const p of Object.values(s.life.people))delete p.workLinks;const migrated=C.normalize(s);assert.deepEqual(migrated.life.projects,{nextId:1,runs:[]});assert(migrated.life.people['resident-0'].workLinks);
}
{
 let s=ready('civic');s.career='official';const source=Object.keys(s.agencies).find(id=>s.agencies[id].branch==='civil'),target=Object.keys(s.agencies).find(id=>id!==source&&s.agencies[id].branch==='civil');s.institution.department=source;s=start(s,'civic');s=ack(pick(s,'solo'));delete s.agencies[source];s.institution.department=target;s.agencyHistory.push({status:'enacted',type:'mergeAgency',source,target,resolvedDay:101});s=time(s);assert.equal(s.eventQueue[0].workProject.departed,false);
}
{
 let s=start(ready());s=ack(pick(s,'solo'));s.day=107;s.eventQueue.push({id:'critical',title:'중요한 사건',day:107});C.projects.tick(s);assert.equal(s.eventQueue.length,1);s=ack(s);assert(s.eventQueue[0].workProject);
}
{
 let s=start(ready());s=ack(pick(s,'solo'));s=time(s);s=pick(s,'submit');const opponent=run(s).rival;s=ack(s);s=next(s);s=ack(pick(s,'confirm'));s=act(s,{type:'lifeCancel'});s.day=280;s.life.lastDay=280;for(const p of Object.values(s.life.people))p.lastDay=280;
 s=start(s);s=ack(pick(s,'solo'));s=time(s);assert.equal(run(s).rival,opponent,'이전 경쟁 기록이 다시 맞붙을 상대에 반영');
}
console.log('시기/자금/심사/미성년/건강/중복/옛 저장 검증 · 기관 흡수 연속성 · 중요 사건 우선 · 같은 주민과 다음 제안에서 재회 통과');

{
 let s=start(ready());s=ack(pick(s,'solo'));s=time(s);const rival=run(s).rival;s.life.people[rival].relationship=64;s.life.people[rival].workLinks.player.lastOutcome='blamed';assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='cooperate').disabled);s.life.people[rival].relationship=65;assert(!C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='cooperate').disabled);
}
{
 let s=ready('civic');s.career='journalist';s.life.chronicles.runs.push({id:90,actor:'player',template:'trade',status:'complete',outcome:'report',result:'공개한 거래 기록',closedDay:10});s.life.echoes.offers.push({id:90,run:90,actor:'player',status:'complete'});s=start(s,'civic');assert(run(s).reputation.some(p=>p.value===2),'상업 사건의 공개 기록은 기자의 안내 제안에서도 평가');
}
{
 let s=start(ready());s=ack(pick(s,'solo'));s=time(s);const formerRival=run(s).rival;s=ack(pick(s,'submit'));s=next(s);s=ack(pick(s,'confirm'));s=act(s,{type:'lifeCancel'});s.day=280;s.life.lastDay=280;for(const p of Object.values(s.life.people))p.lastDay=280;s=start(s);s=ack(pick(s,'partner:'+formerRival));s=time(s);assert.notEqual(run(s).rival,formerRival);assert.equal(run(s).partner,formerRival);
}
console.log('책임 전가 기억은 공동 확인에도 반영 · 상업 기록에서 기자 제안으로 인연 연결 · 예전 경쟁자를 동료로 고르면 새로운 경쟁자 등장 통과');
