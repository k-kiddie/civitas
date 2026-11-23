'use strict';
const assert = require('node:assert/strict');
const { fresh, apply } = require('../campaign');
function play(plan, funding) {
  let state = fresh();
  const act = action => { state = apply(state, action).state; };
  act({ type: 'survey' });
  act({ type: 'advance' });
  if (funding === 'cooperative') {
    act({ type: 'testimony' });
    act({ type: 'work' });
    act({ type: 'advance' });
  }
  act({ type: 'build', plan, funding });
  assert.equal(state.built, plan);
  act({ type: 'advance', to: 'event' });
  assert.equal(state.flooded, { short: 18, long: 0, none: 34 }[plan]);
  const before = state.cash;
  act({ type: 'work' });
  assert.equal(state.cash - before, funding === 'merchant' ? 10 : 16);
  act({ type: 'advance', to: 'event' });
  assert.equal(state.election.won, false);
  act({ type: 'advance', to: 'event' });
  act({ type: 'policy', policy: 'housing' });
  assert.equal(state.policy, 'housing');
  act({ type: 'advance' });
  assert.equal(state.day, 22);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
}
play('short'); play('none'); play('long', 'merchant'); play('long', 'cooperative');
let state = fresh();
for (const action of [{type:'survey'}, {type:'build',plan:'long',funding:'merchant'}, {type:'advance'}, {type:'run'}, {type:'advance',to:'event'}, {type:'campaign'}, {type:'advance',to:'event'}]) state = apply(state,action).state;
assert.equal(state.election.won,true);
assert.equal(apply(state,{type:'build',plan:'short'}).state,state);
console.log('제방 3안·자금 2경로·장마·당선/기권·선거 이후·저장 상태 통과');
for (const plan of ['long', 'short']) {
  let campaign = fresh();
  function act(action) { campaign = apply(campaign, action).state; }
  act({type:'testimony'});
  act({type:'promise'});
  act({type:'advance'});
  act({type:'survey'});
  act({type:'advance'});
  act({type:'build',plan,funding:'merchant'});
  act({type:'witness'});
  assert(campaign.memories.some(memory => memory.person === '민석'));
  act({type:'advance',to:'event'});
  assert.equal(campaign.promise, plan === 'long' ? 'kept' : 'broken');
  const count = campaign.memories.length;
  act({type:'advance'});
  assert.equal(campaign.memories.length,count);
  act({type:'advance',to:'event'});
  assert.equal(campaign.election.districts.length,3);
  assert.notEqual(campaign.election.districts[0].share,campaign.election.districts[1].share);
}
console.log('공개 약속 이행/위반·증인 확보·중복 사건 방지·구역별 개표 통과');
for (const career of ['investigator', 'councillor', 'mayor']) {
  let campaign = fresh();
  function act(action) { campaign = apply(campaign, action).state; }
  for (const action of [{type:'survey'}, {type:'build',plan:'long',funding:'merchant'}, {type:'advance'}, {type:'witness'}, {type:'advance',to:'event'}, {type:'advance',to:'event'}, {type:'advance'}]) act(action);
  if (career === 'mayor') {
    campaign.election.won = true;
    campaign.career = 'mayor';
  } else act({type:'join',career});
  assert.equal(campaign.career,career);
  if (career === 'investigator') {
    act({type:'investigate'});
    act({type:'advance'});
    act({type:'caseDecision',choice:'public'});
  } else act({type:'bill'});
  const hearingDay = campaign.hearing.day;
  act({type:'advance',to:'event'});
  assert.equal(campaign.day,hearingDay);
  for (const person of ['윤','소라','민석']) act({type:'question',person});
  act({type:'evidence'});
  act({type:'verdict',choice:'vote'});
  assert.equal(campaign.bill,'passed');
  assert.equal(campaign.contractRelief,true);
  const before = campaign.cash;
  act({type:'work'});
  assert.equal(campaign.cash - before,16);
}
let legacy = fresh();
delete legacy.career;
delete legacy.treasury;
legacy.election = { won:true, winner:legacy.name, votes:60 };
legacy.day = 22;
legacy.residents.village -= 4;
const recovered = apply(legacy,{type:'budget'}).state;
assert.equal(recovered.career,'mayor');
assert.equal(recovered.treasury,28);
assert.equal(recovered.residents.village,26);
assert.equal(recovered.cash,legacy.cash);
let privateCase = {...fresh(),day:22,career:'investigator',caseStage:'evidence'};
privateCase = apply(privateCase,{type:'caseDecision',choice:'private'}).state;
assert.equal(privateCase.cash,52);
assert.equal(privateCase.caseStage,'sealed');
assert.equal(privateCase.hearing,null);
console.log('직책 3종·공개수사·비공개합의·청문회 시간 정지·임금 회복·구형 저장 보완·공금 분리 통과');

for (const choice of ['vote', 'settle', 'withdraw']) {
  let state = {...fresh(), day:30, cash:30, funding:'merchant', hearing:{day:30, source:'bill'}};
  assert.equal(apply(state,{type:'advance'}).state,state);
  state = apply(state,{type:'question',person:'도윤'}).state;
  const count = state.memories.length;
  assert.equal(apply(state,{type:'question',person:'도윤'}).state,state);
  assert.equal(state.memories.length,count);
  state = apply(state,{type:'verdict',choice}).state;
  assert.equal(state.hearing,null);
  assert.equal(state.contractRelief,choice === 'settle');
  assert.equal(state.cash,choice === 'settle' ? 18 : 30);
  assert.equal(apply(state,{type:'advance'}).state.day,31);
}
let pending = {...fresh(), day:27, witness:true, surveyed:true, support:45, hearing:{day:27,source:'bill'}};
pending = apply(pending,{type:'question',person:'민석'}).state;
pending = JSON.parse(JSON.stringify(pending));
assert.deepEqual(pending.hearing.heard,['민석']);
assert.equal(apply(pending,{type:'evidence'}).state.hearing.evidence,true);
console.log('직접 청문회·중복 질문 방지·부결/합의/철회·진행 중 저장·시간 차단 통과');
