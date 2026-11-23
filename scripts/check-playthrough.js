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
