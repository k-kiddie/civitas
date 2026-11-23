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
for (const [plan, scene] of [['long','storm-safe'],['short','storm-partial'],['none','storm-flood']]) {
  let state = {...fresh(),day:11,built:plan};
  state = apply(state,{type:'advance'}).state;
  assert.equal(state.eventQueue[0].scene,scene);
  const saved = JSON.parse(JSON.stringify(state));
  assert.equal(saved.eventQueue[0].id,'storm');
  state = apply(state,{type:'acknowledge'}).state;
  assert.equal(state.eventQueue.length,0);
  state = apply(state,{type:'advance'}).state;
  assert.equal(state.eventQueue.length,0);
}
const oldSave = fresh();
delete oldSave.eventQueue;
assert.deepEqual(require('../campaign').normalize(oldSave).eventQueue,[]);
console.log('선택별 사건 그림·미확인 저장·확인 뒤 재등장 방지·기존 저장 보완 통과');
for (const gender of ['male','female','unspecified']) {
  const original = fresh();
  const changed = apply(original,{type:'profile',name:'새 시민',gender}).state;
  assert.equal(changed.gender,gender);
  assert.equal(changed.profileSet,true);
  assert.equal(changed.actions,original.actions);
  assert.equal(changed.cash,original.cash);
  assert.equal(JSON.parse(JSON.stringify(changed)).name,'새 시민');
}
assert.equal(apply(fresh(),{type:'profile',name:' ',gender:'male'}).state.profileSet,false);
assert.equal(apply(fresh(),{type:'profile',name:'시민',gender:'invalid'}).state.profileSet,false);
const oldProfile = fresh();
delete oldProfile.gender;
delete oldProfile.profileSet;
oldProfile.name='기존 이름';
const migrated = require('../campaign').normalize(oldProfile);
assert.equal(migrated.name,'기존 이름');
assert.equal(migrated.gender,'unspecified');
assert.equal(migrated.profileSet,false);
console.log('이름·성별 3종 설정·저장·잘못된 입력·구형 인물 유지 통과');
for (const choice of ['aid','organize','livelihood']) {
  let state = apply({...fresh(),day:11,cash:30},{type:'advance'}).state;
  const before = state;
  state = apply(state,{type:'eventChoice',eventId:'storm',choice}).state;
  assert.equal(state.storyHistory[0].choice,choice);
  assert.equal(state.eventQueue[0].resolved.choice,choice);
  assert.equal(apply(state,{type:'eventChoice',eventId:'storm',choice}).state,state);
  assert.equal(JSON.parse(JSON.stringify(state)).eventQueue[0].resolved.choice,choice);
  if (choice === 'aid') {
    assert.equal(state.cash,before.cash - 8);
    state = apply(state,{type:'acknowledge'}).state;
    state = apply(state,{type:'advance',to:'event'}).state;
    assert.equal(state.day,14);
    assert.equal(state.residents.village,10);
    assert.match(state.eventQueue[0].id,/followup/);
  }
  if (choice === 'organize') assert.equal(state.testimony,true);
  if (choice === 'livelihood') assert.equal(state.cash,before.cash+6);
}
let broke = apply({...fresh(),day:11,cash:0},{type:'advance'}).state;
assert.equal(apply(broke,{type:'eventChoice',eventId:'storm',choice:'aid'}).state,broke);
assert.equal(apply(broke,{type:'eventChoice',eventId:'wrong',choice:'livelihood'}).state,broke);
for (const won of [true,false]) {
  let state = {...fresh(),day:20,election:{won}, eventQueue:[{id:'election'}]};
  const choices = require('../campaign').eventChoices(state,state.eventQueue[0]);
  assert.equal(choices.length,won ? 3 : 2);
  state = apply(state,{type:'eventChoice',eventId:'election',choice:won?'audit':'delegation'}).state;
  assert.equal(won ? state.hearing.day : state.support,won ? 23 : 31);
}
console.log('사건 선택 분기·비용 검증·중복 방지·중간 저장·이틀 뒤 후속 사건·당선/낙선 선택 통과');
const dialogueApi = require('../campaign');
for (const promise of ['kept','broken']) {
  let state = {...fresh(),promise,flooded:promise === 'kept' ? 0 : 18,eventQueue:[{id:'storm'}]};
  const opening = dialogueApi.eventDialogue(state,state.eventQueue[0]);
  assert.match(opening[0].text,promise === 'broken' ? /했잖아요/ : /멈췄어요/);
  const cash = state.cash;
  state = apply(state,{type:'dialogueNext',eventId:'storm'}).state;
  assert.equal(state.eventQueue[0].dialogueIndex,1);
  assert.equal(state.cash,cash);
  state = JSON.parse(JSON.stringify(state));
  assert.equal(dialogueApi.eventDialogue(state,state.eventQueue[0])[0].text,opening[0].text);
  state = apply(state,{type:'eventChoice',eventId:'storm',choice:'organize'}).state;
  assert.match(state.eventQueue[0].resolved.reply,/이야기/);
  assert.match(state.eventQueue[0].resolved.reaction,/증언/);
  assert(state.memories.some(item=>item.text.includes('당신 “')));
}
console.log('이전 약속별 대사·읽은 위치 저장·응답과 NPC 반응·대화 기억 통과');
for (const choice of ['repay','resign','defend']) {
  let state = {...fresh(), day:22, cash:100, career:'investigator', caseStage:'evidence', surveyed:true, testimony:true, witness:true, support:50};
  const act = action => { state = apply(state,action).state; };
  act({type:'caseDecision',choice:'private'});
  assert.equal(state.followUps[0].day,25);
  act({type:'advance',to:'event'});
  assert.equal(state.day,25);
  assert.equal(state.underReview,true);
  assert.equal(state.eventQueue[0].id,'oversight');
  const before = state.cash;
  act({type:'eventChoice',eventId:'oversight',choice});
  if (choice === 'repay') {
    assert.equal(state.cash,before-20);
    assert.equal(state.underReview,false);
    assert.equal(state.caseStage,'corrected');
  } else if (choice === 'resign') {
    assert.equal(state.career,'worker');
    assert.equal(state.barredInvestigator,true);
    const original = state;
    act({type:'join',career:'investigator'});
    assert.equal(state,original);
    act({type:'join',career:'councillor'});
    assert.equal(state.career,'councillor');
  } else {
    act({type:'acknowledge'});
    act({type:'advance',to:'event'});
    assert.equal(state.day,28);
    assert.equal(state.cash,before-9-12);
    assert.equal(state.underReview,true);
    for (const person of ['윤','민석']) act({type:'question',person});
    act({type:'evidence'});
    act({type:'verdict',choice:'vote'});
    assert.equal(state.career,'investigator');
    assert.equal(state.underReview,false);
    assert.equal(state.caseStage,'corrected');
    assert.equal(state.cash,before-9-12-20);
    assert.equal(state.contractRelief,false);
  }
}
let failedReview = {...fresh(), day:28, career:'investigator', underReview:true, hearing:{day:28,source:'oversight'}};
failedReview = apply(failedReview,{type:'verdict',choice:'vote'}).state;
assert.equal(failedReview.career,'worker');
assert.equal(failedReview.barredInvestigator,true);
assert.equal(failedReview.underReview,false);
console.log('봉인 기록 후속 사건·반환/사직/소명·주급 정지·해임 후 다른 직업·계약 효과 분리 통과');
for (const occupation of Object.keys(require('../starts').occupations)) {
  for (const background of Object.keys(require('../starts').backgrounds)) {
    const base = fresh();
    let state = apply(base,{type:'start',name:'첫 시민',gender:'female',occupation,background}).state;
    assert.equal(state.career,occupation);
    assert.equal(state.startConfigured,true);
    assert.equal(state.eventQueue[0].occupation,occupation);
    assert.equal(state.cash,32 + require('../starts').backgrounds[background].cash);
    assert.equal(apply(state,{type:'start',name:'다시',gender:'male',occupation,background}).state,state);
    const before = state.cash;
    state = apply(state,{type:'eventChoice',eventId:'opening',choice:'help'}).state;
    assert(state.memories.some(memory=>memory.person===require('../starts').occupations[occupation].person));
    state = apply(state,{type:'acknowledge'}).state;
    state = apply(state,{type:'work'}).state;
    assert.equal(state.cash,before + require('../starts').occupations[occupation].wage);
    assert.equal(JSON.parse(JSON.stringify(state)).startingOccupation,occupation);
  }
}
const priorSave = fresh();
delete priorSave.startConfigured;
priorSave.day=22;priorSave.cash=73;
assert.equal(require('../campaign').normalize(priorSave).startConfigured,true);
assert.equal(require('../campaign').normalize(priorSave).cash,73);
console.log('출신 3종×직업 5종·시작 장면·초기 자원·직업별 품삯·중복 시작 차단·기존 저장 유지 통과');
for (const occupation of ['apprentice','policeAide']) {
  for (const opening of ['help','earn']) {
    for (const path of ['evidence','money']) {
      let state = apply(fresh(),{type:'start',name:'연속 시민',gender:'unspecified',occupation,background:'worker'}).state;
      const act = action => { state = apply(state,action).state; };
      act({type:'eventChoice',eventId:'opening',choice:opening});
      act({type:'acknowledge'});
      act({type:'advance',to:'event'});
      assert.equal(state.day,3);
      const first = state.eventQueue[0];
      assert.equal(first.jobEpisode,occupation === 'apprentice' ? 'factoryRecords' : 'policeSearch');
      act({type:'eventChoice',eventId:first.id,choice:occupation === 'apprentice' ? (path === 'evidence' ? 'copy':'envelope') : (path === 'evidence' ? 'preserve':'obey')});
      act({type:'acknowledge'});
      act({type:'advance',to:'event'});
      assert.equal(state.day,5);
      state = JSON.parse(JSON.stringify(state));
      const final = state.eventQueue[0];
      const evidenceChoice = occupation === 'apprentice' ? 'collective':'report';
      if (path === 'money') assert.equal(apply(state,{type:'eventChoice',eventId:final.id,choice:evidenceChoice}).state,state);
      const choice = path === 'evidence' ? evidenceChoice : occupation === 'apprentice' ? 'personal':'close';
      act({type:'eventChoice',eventId:final.id,choice});
      assert.equal(state.jobStory.stage,'complete');
      assert.equal(apply(state,{type:'eventChoice',eventId:final.id,choice}).state,state);
      if (occupation === 'policeAide') {
        assert.equal(state.policeRecommendation,path === 'evidence');
        assert.equal(state.witness,false);
      }
      act({type:'acknowledge'});
      const before = state.cash;
      act({type:'work'});
      assert.equal(state.cash-before,occupation === 'apprentice' ? (path === 'money' ? 16:14):12);
      assert.equal(state.followUps.filter(item=>item.type === 'job').length,0);
    }
  }
}
const legacyJob = {...fresh(),day:8,startingOccupation:'apprentice',career:'apprentice',storyHistory:[{id:'opening',choice:'help'}]};
delete legacyJob.jobStory;
const migratedJob = require('../campaign').normalize(legacyJob);
assert.equal(migratedJob.followUps[0].day,10);
assert.equal(require('../campaign').normalize(migratedJob).followUps.length,1);
console.log('직업 연속사건 8경로·2회 지연·증거 없는 공개 차단·저장 복원·승급 품삯·중복 지급 방지·구형 시작 보완 통과');
const recommended = {...fresh(),day:21,career:'policeAide',policeRecommendation:true};
assert.equal(apply(recommended,{type:'join',career:'investigator'}).state.career,'investigator');
assert.equal(apply(recommended,{type:'join',career:'councillor'}).state,recommended);
assert.equal(recommended.witness,false);
for (const occupation of ['farmer','clerk']) {
  for (const opening of ['help','earn']) {
    for (const path of ['evidence','money']) {
      let state = apply(fresh(),{type:'start',name:'새 직업',gender:'male',occupation,background:'merchant'}).state;
      const act = action => {state=apply(state,action).state};
      act({type:'eventChoice',eventId:'opening',choice:opening});act({type:'acknowledge'});
      act({type:'advance',to:'event'});assert.equal(state.day,3);
      let event=state.eventQueue[0];
      const middle=occupation==='farmer'?(path==='evidence'?'copy':'water'):(path==='evidence'?'preserve':'handover');
      act({type:'eventChoice',eventId:event.id,choice:middle});act({type:'acknowledge'});
      act({type:'advance',to:'event'});assert.equal(state.day,5);
      state=JSON.parse(JSON.stringify(state));event=state.eventQueue[0];
      const final=occupation==='farmer'?(path==='evidence'?'restore':'rent'):(path==='evidence'?'publish':'patron');
      if(path==='money')assert.equal(apply(state,{type:'eventChoice',eventId:event.id,choice:occupation==='farmer'?'restore':'publish'}).state,state);
      const before=state.cash;act({type:'eventChoice',eventId:event.id,choice:final});assert.equal(state.jobStory.stage,'complete');
      if(occupation==='farmer'&&path==='evidence')assert.equal(state.cash,before-12);
      if(occupation==='clerk'&&path==='evidence'){assert.equal(state.councilRecommendation,true);assert.equal(state.witness,false);assert.equal(state.policeRecommendation,false)}
      act({type:'acknowledge'});
      const wageBefore=state.cash;act({type:'work'});
      assert.equal(state.cash-wageBefore,occupation==='clerk'?(path==='money'?17:15):13);
      const dayBefore=state.cash;act({type:'advance'});
      assert.equal(dayBefore-state.cash,occupation==='farmer'&&path==='money'?5:3);
    }
  }
}
const clerkRecommendation={...fresh(),day:21,career:'clerk',councilRecommendation:true};
assert.equal(apply(clerkRecommendation,{type:'join',career:'councillor'}).state.career,'councillor');
assert.equal(apply(clerkRecommendation,{type:'join',career:'investigator'}).state,clerkRecommendation);
console.log('농촌·서기 8경로·사본 조건·우물 복구비·물값 생활비·서기 승급·독립 추천 권한 통과');
const careers = require('../careers');
for(const [id,job] of Object.entries(careers.jobs).filter(([,job])=>!job.secret)) {
  let state={...fresh(),career:'worker',cash:100,energy:100,day:2};
  if(id==='worker')state.career='farmer';
  if(job.skill){
    assert.equal(apply(state,{type:'applyJob',career:id}).state,state);
    state=apply(state,{type:'train',skill:job.skill}).state;
  }
  state=apply(state,{type:'applyJob',career:id}).state;
  assert.equal(state.career,id);
  state=apply(state,{type:'advance'}).state;
  const before=state.cash;
  state=apply(state,{type:'work'}).state;
  assert.equal(state.cash-before,job.wage);
}
for(const secret of ['undercover','courier']) {
  let state={...fresh(),day:6,cash:100,energy:100,policeRecommendation:secret==='undercover',jobStory:{...fresh().jobStory,outcome:secret==='courier'?'collective':null},support:50};
  assert.equal(apply(state,{type:'applyJob',career:secret}).state,state);
  state=apply(state,{type:'rest'}).state;
  assert.equal(state.recruitment[secret],'scheduled');
  state=apply(state,{type:'advance',to:'event'}).state;
  assert.equal(state.day,7);
  assert.equal(state.eventQueue[0].recruitCareer,secret);
  const declined=apply(state,{type:'eventChoice',eventId:'recruit-'+secret,choice:'decline'}).state;
  assert.equal(declined.career,'worker');assert.equal(declined.recruitment[secret],'declined');
  state=apply(state,{type:'eventChoice',eventId:'recruit-'+secret,choice:'accept'}).state;
  assert.equal(state.career,secret);
  state=apply(state,{type:'acknowledge'}).state;
  state=apply(state,{type:'advance',to:'event'}).state;
  assert.equal(state.day,8);
  assert.equal(state.eventQueue[0].missionCareer,secret);
  state=apply(state,{type:'eventChoice',eventId:'mission-'+secret,choice:'protect'}).state;
  assert.equal(state.secretMissionDone,true);
  state=apply(state,{type:'acknowledge'}).state;
  state=apply(state,{type:'careerDuty'}).state;
  assert.equal(apply(state,{type:'careerDuty'}).state,state);
  assert.equal(state.followUps.filter(item=>item.type==='recruitment').length,0);
}
let retired={...fresh(),day:22,career:'mayor',election:{won:true,winner:'시민'}};
retired=apply(retired,{type:'resignOffice'}).state;
assert.equal(require('../campaign').normalize(retired).career,'worker');
assert.equal(retired.election.won,true);
assert.equal(apply({...fresh(),underReview:true},{type:'applyJob',career:'farmer'}).state.underReview,true);
console.log('일반직 11종·훈련 조건·품삯·비밀 영입 2종·수락/거절·첫 임무·중복/직접진입 차단·동장 사임 통과');
