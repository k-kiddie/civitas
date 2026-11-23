'use strict';
const assert=require('node:assert/strict');
const C=require('../campaign');
function ready(career='trader'){
  const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:3000,energy:100,career,built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
  s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;
  if(career==='official')s.institution.department='reconstruction';if(career==='soldier')s.institution.department='army';
  // Use actual agency IDs, not a fabricated active flag.
  if(career==='official')s.institution.department=Object.keys(s.agencies).find(id=>s.agencies[id].branch==='civil');
  for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=10000;}
  return s;
}
function act(s,a){const r=C.apply(s,a);assert.notEqual(r.state,s,r.message);return r.state;}
function pick(s,id){const e=s.eventQueue[0];assert(e?.chronicle,'직업 장면 필요');const choice=C.eventChoices(s,e).find(c=>c.id===id);assert(choice&&!choice.disabled,id+'는 선택 가능해야 함');return act(s,{type:'eventChoice',eventId:e.id,choice:id});}
function dismiss(s){return act(s,{type:'acknowledge'});}
function start(s,id){return act(s,{type:'chronicleStart',story:id});}
function time(s,days){return act(s,{type:'lifePass',days,routine:'work'});}
function toContact(s,days){let n=time(s,days);assert(n.eventQueue[0]?.chronicle,'연락일에 사건 정지');return n;}
function resume(s){return act(s,{type:'lifeContinue'});}
function personalSnapshot(s){return {treasury:s.treasury,funds:Object.values(s.parties.registry).map(p=>p.funds),budget:s.institution.agencyBudget,supplies:s.institution.supplies};}
for(const [id,t] of Object.entries(C.chronicles.templates)){
 for(const route of ['report','compromise','conceal']){
  const career=t.jobs[0];let s=ready(career);const before=JSON.stringify(s);let n=start(s,id);
  assert.equal(JSON.stringify(s),before,'공개 apply는 입력 상태를 바꾸지 않음');assert.equal(n.actions,1);assert.equal(n.energy,95);assert.equal(n.eventQueue[0].title,t.name);
  const stale=n.eventQueue[0].id;n=pick(n,'document');assert.equal(n.energy,85);assert.equal(C.chronicles.current(n).dueDay,114);
  assert.equal(C.apply(n,{type:'eventChoice',eventId:stale,choice:'document'}).state,n,'같은 선택을 재실행하지 않음');
  n=dismiss(n);n=toContact(n,30);assert.equal(n.day,114);assert.equal(n.life.clock.plan.target,130);
  n=C.normalize(JSON.parse(JSON.stringify(n)));assert(n.eventQueue[0].chronicle);
  const snapshot=personalSnapshot(n),cash=n.cash;n=pick(n,route);
  assert.deepEqual(personalSnapshot(n),snapshot,'공금과 군수품은 선택에 유용하지 않음');assert.equal(n.cash,cash-(route==='compromise'?12:0));
  assert.equal(C.chronicles.current(n).dueDay,204);n=dismiss(n);n=resume(n);assert.equal(n.day,130);assert.equal(n.eventQueue.length,0);
  n=toContact(n,90);assert.equal(n.day,204);const beforeFinal=n.cash;
  n=pick(n,route==='conceal'?'doubleDown':'finish');assert.equal(n.cash,beforeFinal);assert.equal(C.chronicles.current(n),undefined);
  const run=n.life.chronicles.runs[0];assert.equal(run.status,'complete');assert.equal(run.outcome,route==='conceal'?'doubleDown':route);assert.equal(run.choices.length,3);
  if(route!=='conceal')assert(n.skills[t.skill]>=1);
  assert(n.life.people[t.people[0]].history.some(h=>h.actor==='player'&&h.type==='relationship'));
  n=dismiss(n);assert.match(C.chronicles.availability(n,id),/이미/);
 }
}
console.log('5개 직업 이야기 × 공개/개인 부담 타협/허위 서명 · 14일/90일 연락 · 압축 중단/재개 · 기록/관계/훈련 · 개인 지출과 공금 분리 통과');
// No evidence: recovery is possible but costs time and money, and cannot be replayed.
{
 let s=start(ready(),'trade');s=dismiss(pick(s,'trust'));s=toContact(s,30);const report=C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='report');assert(report.disabled);
 const e=s.eventQueue[0],cash=s.cash,energy=s.energy;s=pick(s,'verify');assert.equal(s.cash,cash-8);assert.equal(s.energy,energy-10);s=dismiss(s);
 assert.notEqual(s.eventQueue[0].id,e.id,'재대화는 별도 ID');assert.equal(C.apply(s,{type:'eventChoice',eventId:e.id,choice:'verify'}).state,s);
 assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='verify'));s=pick(s,'report');s=dismiss(s);s=resume(s);s=toContact(s,90);s=pick(s,'leave');assert.equal(s.life.chronicles.runs[0].outcome,'leave');assert.equal(s.skills.commerce||0,0);
}
// Scarce resources and damaged relationships change feasible compromises.
{
 let s=start(ready(),'trade');s=dismiss(pick(s,'document'));s=toContact(s,30);
 s.cash=11;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='compromise').disabled);
 const before=JSON.stringify(s);assert.equal(C.apply(s,{type:'eventChoice',eventId:s.eventQueue[0].id,choice:'compromise'}).state,s);assert.equal(JSON.stringify(s),before);
 s.cash=300;s.life.people['story-doyun'].relationship=30;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='compromise').disabled);
 s.energy=0;assert(C.eventChoices(s,s.eventQueue[0]).find(c=>c.id==='report').disabled);s=pick(s,'conceal');s=dismiss(s);s=resume(s);s=toContact(s,90);s=pick(s,'correct');assert.equal(s.life.chronicles.runs[0].outcome,'correct');
}
console.log('늦은 증거 확보/비용 · 오래된 장면 재실행 차단 · 자금/기력/기존 관계에 따른 선택 제한 · 서명 정정/미완료 결말 통과');
// Career departure does not grant training or erase decisions; another actor never pays the old promise.
{
 let s=start(ready(),'trade');s=dismiss(pick(s,'document'));s.actions=2;s=act(s,{type:'applyJob',career:'worker'});s=toContact(s,30);
 assert(s.eventQueue[0].chronicle.departed);assert.deepEqual(C.eventChoices(s,s.eventQueue[0]).map(c=>c.id),['handoff','abandon']);s=pick(s,'handoff');assert.equal(s.life.chronicles.runs[0].status,'departed');assert.equal(s.skills.commerce||0,0);
}
{
 let s=start(ready(),'trade');s=dismiss(pick(s,'document'));s.actions=2;const blocker=C.succession.blocked(s);assert.match(blocker,/장기 직업/);
 s=act(s,{type:'chronicleWithdraw'});assert.equal(s.life.chronicles.runs[0].status,'withdrawn');assert.equal(C.chronicles.current(s),undefined);
}
{
 let s=start(ready(),'trade'),event=s.eventQueue[0];s.life.activeId='resident-0';s=C.normalize(s);assert.equal(s.life.chronicles.runs[0].status,'archived');
 const cash=s.cash,relation=s.life.people['story-sora'].relationship;s=pick(s,'close');assert.equal(s.cash,cash);assert.equal(s.life.people['story-sora'].relationship,relation);
}
// First local stories, critical scenes, agency validation and one active arc are enforced by state, not UI alone.
{
 let s=ready();s.day=27;assert.equal(C.apply(s,{type:'chronicleStart',story:'trade'}).state,s);
 s=ready('worker');assert.equal(C.apply(s,{type:'chronicleStart',story:'trade'}).state,s);
 s=ready('official');delete s.agencies[s.institution.department];assert.match(C.chronicles.availability(s,'civil'),/재직/);
 s=ready();s.hearing={day:101};assert.match(C.chronicles.availability(s,'trade'),/심사/);
 s=ready();s.actions=0;assert.match(C.chronicles.availability(s,'trade'),/행동/);
 s=start(ready(),'trade');assert.equal(C.apply(s,{type:'chronicleStart',story:'trade'}).state,s);
 s=C.normalize(ready());delete s.life.chronicles;const migrated=C.normalize(s);assert.deepEqual(migrated.life.chronicles,{nextId:1,runs:[]});
}
console.log('전직 후 기록 인계 · 약속 내려놓기/은퇴 제한 · 세대별 이야기 귀속 · 기존 저장 보완 · 직업/기관/시기/중복 시작 제한 통과');

{
 let s=start(ready(),'trade');s.energy=0;s=pick(s,'postpone');assert.equal(C.chronicles.current(s).dueDay,107);s=dismiss(s);s=toContact(s,30);assert.equal(s.day,107);
 s=pick(s,'postpone');s=dismiss(s);s=resume(s);assert.equal(s.day,114);assert(!C.eventChoices(s,s.eventQueue[0]).some(c=>c.id==='postpone'));s=pick(s,'document');assert.equal(C.chronicles.current(s).dueDay,128);
}
console.log('자금/기력 준비를 위한 7일 연기 · 두 번 제한 · 원래 생활 계획 안에서 재정지 통과');

// An approved agency absorption preserves the same case; a transfer to an unrelated office does not.
{
 let s=start(ready('official'),'civil');s=dismiss(pick(s,'document'));
 const source=s.institution.department,target=Object.keys(s.agencies).find(id=>id!==source&&s.agencies[id].branch==='civil');
 delete s.agencies[source];s.institution.department=target;s.agencyHistory.push({status:'enacted',type:'mergeAgency',source,target,resolvedDay:101});
 s=toContact(s,30);assert.equal(s.eventQueue[0].chronicle.departed,false);s=pick(s,'report');assert.equal(C.chronicles.current(s).route,'report');
}
{
 let s=start(ready('official'),'civil');s=dismiss(pick(s,'document'));s.institution.department=Object.keys(s.agencies).find(id=>id!==s.institution.department&&s.agencies[id].branch==='civil');
 s=toContact(s,30);assert(s.eventQueue[0].chronicle.departed);s=pick(s,'abandon');assert.equal(s.life.chronicles.runs[0].status,'departed');
}
{
 let s=start(ready(),'trade');s=dismiss(pick(s,'document'));s.day=114;
 s.eventQueue.push({id:'critical',day:114,title:'먼저 처리할 사건'});C.chronicles.tick(s);assert.equal(s.eventQueue.length,1);
 s=act(s,{type:'acknowledge'});assert(s.eventQueue[0].chronicle);assert.equal(s.eventQueue[0].day,114);
}
console.log('기관 흡수 후 사건 유지/무관한 기관 이동 후 인계 · 중요한 사건 우선과 미완료 연락 보존 통과');
