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
  assert.notEqual(campaign.election.districts[0].shares.sora,campaign.election.districts[1].shares.sora);
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
const institutions=require('../institutions');
for(const department of Object.keys(institutions.departments)) {
  let state={...fresh(),day:2,cash:500,energy:100,support:90};
  const act=action=>{state=apply(state,action).state};
  const agency=institutions.departments[department];
  assert.equal(apply(state,{type:'enlist',department}).state,state);
  act({type:'train',skill:agency.skill});act({type:'enlist',department});
  assert.equal(state.institution.department,department);
  for(let days=0;state.institution.rank<4 && days<30;days++){
    act({type:'advance'});
    if(department==='army'&&!state.skills.administration)act({type:'train',skill:'administration'});
    act({type:'officialDuty'});
    const original=state;act({type:'officialDuty'});assert.equal(state,original);
    if(!institutions.promotionReason(state))act({type:'promote'});
  }
  assert.equal(state.institution.rank,4);
  assert.match(institutions.title(state),department==='army'?/장군/:/청장|처장/);
  act({type:'advance'});
  act({type:'foundNetwork',kind:'secret',name:'동기 모임'});
  assert.equal(state.network.kind,'secret');
  act({type:'recruitMember',person:'officer'});
  act({type:'advance'});act({type:'recruitMember',person:'accountant'});
  assert.equal(state.network.members.length,2);
  act({type:'minister'});
  assert.equal(state.career,'defenseMinister');
  assert.equal(state.institution.department,'army');
  act({type:'advance'});
  const personalCash=state.cash;const budget=state.institution.agencyBudget;
  act({type:'agencyOrder'});
  assert.equal(state.cash,personalCash);assert.equal(state.institution.agencyBudget,budget-12);
  const before=state.cash;act({type:'work'});assert.equal(state.cash-before,30);
  state=JSON.parse(JSON.stringify(state));assert.equal(state.network.members.length,2);
}
let networkState={...fresh(),day:10,cash:100,career:'official',institution:{...institutions.fresh(),department:'audit',rank:2,merit:25},network:{name:'인사 모임',kind:'secret',members:[{id:'personnel',loyalty:40,competence:65}]}};
for(let i=0;i<3;i++){
 networkState=apply(networkState,{type:'appointMember',person:'personnel',choice:'loyalty'}).state;
 if(i<2){networkState=apply(networkState,{type:'advance'}).state;networkState=apply(networkState,{type:'advance'}).state;networkState=apply(networkState,{type:'advance'}).state;}
}
assert.equal(networkState.institution.scrutiny,60);
assert.equal(networkState.eventQueue.filter(event=>event.institutionAudit).length,1);
networkState.eventQueue=networkState.eventQueue.filter(event=>event.institutionAudit);
networkState=apply(networkState,{type:'eventChoice',eventId:networkState.eventQueue[0].id,choice:'resign'}).state;
assert.equal(networkState.career,'worker');assert.equal(networkState.network.members.length,1);
assert.equal(networkState.institution.appointments.length,3);
assert.equal(networkState.institution.scrutiny,0);
console.log('행정 3기관·군 경력 실무 승진·기관장/장군·장관 임명·공금 분리·조직 영입·측근 인사 감사·사임 기록 보존 통과');
const junior={...fresh(),career:'soldier',institution:{...institutions.fresh(),department:'army'}};
assert.equal(apply(junior,{type:'agencyOrder'}).state,junior);
assert.equal(apply(junior,{type:'minister'}).state,junior);
assert.equal(apply({...junior,career:'worker'},{type:'officialDuty'}).state.career,'worker');
let disclosure={...fresh(),cash:30,career:'official',institution:{...institutions.fresh(),department:'audit',merit:20,scrutiny:60},eventQueue:[{id:'audit-test',institutionAudit:true}]};
disclosure=apply(disclosure,{type:'eventChoice',eventId:'audit-test',choice:'disclose'}).state;
assert.equal(disclosure.cash,18);assert.equal(disclosure.institution.merit,12);assert.equal(disclosure.institution.scrutiny,0);assert.equal(disclosure.career,'official');
assert.equal(apply(disclosure,{type:'eventChoice',eventId:'audit-test',choice:'disclose'}).state,disclosure);
const Agencies=require('../agencies');
function reformState(){return {...fresh(),day:22,cash:100,support:70,career:'official',institution:{...institutions.fresh(),department:'reconstruction',rank:4,merit:40}};}
for(const type of ['createAgency','splitAgency','mergeAgency','abolishAgency']){
 let state=reformState();
 const total=s=>Object.values(s.agencies).reduce((sum,item)=>sum+item.staff,0)+s.unassignedOfficials;
 const beforeTotal=total(state),beforeBudget=state.institution.agencyBudget;
 const original=JSON.stringify(state.agencies);
 state=apply(state,{type,name:'재난대응청',target:'welfare'}).state;
 assert.equal(state.agencyProposal.stage,'cabinet');assert.equal(JSON.stringify(state.agencies),original);
 state=apply(state,{type:'advance',to:'event'}).state;
 assert.equal(state.day,25);assert.equal(state.agencyProposal.stage,'legislature');assert.equal(JSON.stringify(state.agencies),original);
 state=JSON.parse(JSON.stringify(state));
 state=apply(state,{type:'advance',to:'event'}).state;
 assert.equal(state.day,28);assert.equal(state.agencyProposal,null);assert.equal(state.agencyHistory[0].status,'enacted');
 assert.equal(total(state),beforeTotal);
 assert.equal(state.institution.agencyBudget,beforeBudget+(type==='abolishAgency'?0:8)-(type==='createAgency'?20:type==='splitAgency'?10:5));
 if(type==='createAgency'||type==='splitAgency')assert(Object.values(state.agencies).some(item=>item.name==='재난대응청'));
 if(type==='splitAgency')assert.equal(state.agencies.reconstruction.staff,12);
 if(type==='mergeAgency'){assert.equal(state.institution.department,'welfare');assert.equal(state.agencies.welfare.staff,44)}
 if(type==='abolishAgency'){assert.equal(state.career,'worker');assert.equal(state.institution.department,null)}
}
let rejected=reformState();rejected.support=40;
rejected=apply(rejected,{type:'abolishAgency'}).state;
rejected=apply(rejected,{type:'advance',to:'event'}).state;
assert.equal(rejected.agencyProposal,null);assert.equal(rejected.agencyHistory[0].status,'rejected');assert(rejected.agencies.reconstruction);
let withdrawn=apply(reformState(),{type:'mergeAgency',target:'welfare'}).state;
withdrawn=apply(withdrawn,{type:'withdrawReform'}).state;
assert.equal(withdrawn.followUps.filter(item=>item.type==='agencyReform').length,0);
assert.equal(withdrawn.agencyHistory[0].status,'withdrawn');
const same=reformState();assert.equal(apply(same,{type:'mergeAgency',target:'reconstruction'}).state,same);
assert.equal(apply(same,{type:'createAgency',name:'도시재건청'}).state,same);
assert.equal(apply({...fresh(),career:'worker'},{type:'abolishAgency'}).state.career,'worker');
console.log('조직개편 건의→정부→법·예산 승인·신설/분리/흡수/폐지·정원 보존·보직 승계·부결·철회·중복 이름 방지 통과');
let legislatureRejected=reformState();legislatureRejected.support=50;
legislatureRejected=apply(legislatureRejected,{type:'splitAgency',name:'재난대응청'}).state;
legislatureRejected=apply(legislatureRejected,{type:'advance',to:'event'}).state;
assert.equal(legislatureRejected.agencyProposal.stage,'legislature');
legislatureRejected=apply(legislatureRejected,{type:'advance',to:'event'}).state;
assert.equal(legislatureRejected.agencyHistory[0].status,'rejected');
assert.equal(legislatureRejected.agencies.reconstruction.staff,24);
const noHistory={...fresh()};delete noHistory.agencies;delete noHistory.agencyHistory;
assert.equal(Object.keys(require('../campaign').normalize(noHistory).agencies).length,10);
const RandomEvents=require('../random-events');
const randomScenario=seed=>({...fresh(),startConfigured:true,profileSet:true,day:30,cash:30,career:'apprentice',jobStory:{...fresh().jobStory,stage:'complete'},randomState:{seed,checkedDay:0,lastDay:-10,seen:{}}});
let first=randomScenario(1);const occurrence=RandomEvents.schedule(first);
assert(occurrence);assert.equal(occurrence.randomType,'extraShift');
assert.equal(RandomEvents.schedule(first),null);
const firstSnapshot=JSON.parse(JSON.stringify(first));
assert.equal(RandomEvents.schedule(firstSnapshot),null);
let sameRun=randomScenario(1);assert.deepEqual(RandomEvents.schedule(sameRun),occurrence);
let cooldown=randomScenario(1);cooldown.randomState.seen.extraShift=25;assert.equal(RandomEvents.schedule(cooldown),null);
let plot=randomScenario(1);plot.jobStory.stage='waiting';assert.equal(RandomEvents.schedule(plot),null);
let hearingPriority=randomScenario(1);hearingPriority.hearing={day:33};assert.equal(RandomEvents.schedule(hearingPriority),null);
let duePriority=randomScenario(1);duePriority.followUps=[{day:31,type:'job'}];assert.equal(RandomEvents.schedule(duePriority),null);
assert(!RandomEvents.eligible({...randomScenario(1),career:'teacher'}).some(item=>item.id==='supplies'));
for(const template of RandomEvents.templates){
 let state=randomScenario(1);
 state.cash=100;state.energy=100;state.institution.rank=2;
 state.eventQueue=[{id:'random-test',randomType:template.id,randomPerson:template.person,randomChoices:template.choices}];
 const choice=template.choices[0];
 state=apply(state,{type:'eventChoice',eventId:'random-test',choice:choice.id}).state;
 assert.equal(state.eventQueue[0].resolved.choice,choice.id);
 assert.equal(apply(state,{type:'eventChoice',eventId:'random-test',choice:choice.id}).state,state);
}
let randomAdvance={...randomScenario(1),day:29};
randomAdvance=apply(randomAdvance,{type:'advance',to:'event'}).state;
assert.equal(randomAdvance.day,30);assert.equal(randomAdvance.eventQueue[0].randomType,'extraShift');
const savedIncident=JSON.parse(JSON.stringify(randomAdvance));
assert.deepEqual(savedIncident.eventQueue,randomAdvance.eventQueue);
const seeds=new Set();
for(const seed of [1,123456,987654321,0x61c1a5,0xdeadbeef]){
 const scenario=randomScenario(seed);const event=RandomEvents.schedule(scenario);seeds.add(event?.randomType||'quiet');
}
assert(seeds.size>1);
console.log('조건별 사건 8종·확률과 조용한 날·동일 저장 재추첨 방지·4/14일 간격·연속사건 우선·선택 중복 방지·시간 정지 통과');
let shortGap=randomScenario(1);shortGap.randomState.lastDay=28;assert.equal(RandomEvents.schedule(shortGap),null);
const pressure=RandomEvents.templates.find(item=>item.id==='agencyPressure');
let corrupt={...fresh(),career:'official',institution:{...institutions.fresh(),department:'audit',scrutiny:50},eventQueue:[{id:'pressure',randomType:'agencyPressure',randomPerson:'지안',randomChoices:pressure.choices}]};
corrupt=apply(corrupt,{type:'eventChoice',eventId:'pressure',choice:'favor'}).state;
assert.equal(corrupt.institution.scrutiny,65);assert.equal(corrupt.eventQueue[1].institutionAudit,true);
let lowEnergy=randomScenario(1);lowEnergy.energy=0;
const source=RandomEvents.templates.find(item=>item.id==='source');
lowEnergy.eventQueue=[{id:'source-test',randomType:'source',randomChoices:source.choices,randomPerson:source.person}];
assert.equal(apply(lowEnergy,{type:'eventChoice',eventId:'source-test',choice:'verify'}).state,lowEnergy);
assert.equal(apply(lowEnergy,{type:'eventChoice',eventId:'source-test',choice:'decline'}).state.eventQueue[0].resolved.choice,'decline');
function adultState(){return {...fresh(),age:24,ageChosen:true};}
const Underworld=require('../underworld');
assert.equal(Object.keys(Underworld.catalog).length,26);
for(const [id,role] of Object.entries(Underworld.catalog)){
 for(const choice of ['careful','bold','quit']){
  let state={...adultState(),day:8,cash:100,energy:100,career:'teacher',underworld:{...Underworld.fresh(),discovered:[id]},eventQueue:[Underworld.encounter(id,{day:8})]};
  const act=action=>{state=apply(state,action).state};
  act({type:'eventChoice',eventId:'under-offer-'+id,choice:'accept'});
  assert.equal(state.career,'teacher');assert.equal(state.underworld.role,id);
  act({type:'acknowledge'});act({type:'advance',to:'event'});
  assert.equal(state.day,9);assert.equal(state.eventQueue[0].underworldMission,true);
  const before=state.cash;act({type:'eventChoice',eventId:'under-mission-'+id,choice});
  assert.equal(apply(state,{type:'eventChoice',eventId:'under-mission-'+id,choice}).state,state);
  assert.equal(state.career,'teacher');
  if(choice==='quit'){assert.equal(state.underworld.role,null);continue;}
  assert.equal(state.underworld.missions[id],'complete');
  assert.equal(state.cash-before,choice==='careful'?8:id==='sexWorker'?0:role.pay);
  if(!role.crime)assert.equal(state.underworld.heat,0);
  act({type:'acknowledge'});
  act({type:'underworldWork'});
  assert.equal(state.underworld.lastWork,state.day);
  assert.equal(apply(state,{type:'underworldWork'}).state,state);
  state=JSON.parse(JSON.stringify(state));assert(state.underworld.completed.includes(id));
  act({type:'leaveUnderworld'});act({type:'revisitUnderworld',role:id});
  act({type:'eventChoice',eventId:'under-offer-'+id,choice:'accept'});
  assert.equal(state.followUps.filter(item=>item.type==='underworld').length,0);
 }
}
let known={...adultState(),skills:{investigation:1},underworld:Underworld.fresh()};
for(const circle of Object.keys(Underworld.circles)){
 let state=apply(known,{type:'exploreUnderworld',circle}).state;
 assert.equal(state.underworld.discovered.length,1);
 assert.equal(Underworld.catalog[state.underworld.discovered[0]].circle,circle);
 assert.equal(apply(state,{type:'exploreUnderworld',circle}).state,state);
}
let stopped={...adultState(),day:8,underworld:{...Underworld.fresh(),role:'smuggler',missions:{smuggler:'pending'}},followUps:[{type:'underworld',role:'smuggler',day:9}]};
stopped=apply(stopped,{type:'leaveUnderworld'}).state;assert.equal(stopped.followUps.length,0);
let reviewState={...adultState(),cash:0,underworld:{...Underworld.fresh(),role:'smuggler',heat:60}};
Underworld.review(reviewState);assert(reviewState.eventQueue[0].underworldReview);
assert.equal(Underworld.choices(reviewState,reviewState.eventQueue[0])[0].disabled,true);
reviewState=apply(reviewState,{type:'eventChoice',eventId:reviewState.eventQueue[0].id,choice:'leave'}).state;assert.equal(reviewState.underworld.role,null);
let privacy={...adultState(),underworld:{...Underworld.fresh(),role:'sexWorker',exposure:60}};
Underworld.review(privacy);assert.equal(privacy.eventQueue[0].underworldReview,'privacy');
privacy=apply(privacy,{type:'eventChoice',eventId:privacy.eventQueue[0].id,choice:'affirm'}).state;
assert.equal(privacy.underworld.role,'sexWorker');assert.equal(privacy.underworld.heat,0);assert.equal(privacy.underworld.exposure,20);
console.log('음지 26경로×3선택·정식 직업 병행·첫 의뢰·동의/거절·중복 수입 차단·재접속·연락망 탐색·수사/사생활 구분 통과');
for(const id of Object.keys(Underworld.catalog)){
 const state={...adultState(),career:'teacher',eventQueue:[Underworld.encounter(id,{day:1})]};
 const declined=apply(state,{type:'eventChoice',eventId:'under-offer-'+id,choice:'decline'}).state;
 assert.equal(declined.underworld.role,null);assert.equal(declined.career,'teacher');assert.equal(declined.followUps.length,0);
}
const notAdult={...adultState(),age:17};assert.equal(apply(notAdult,{type:'exploreUnderworld',circle:'nightlife'}).state,notAdult);
assert.equal(fresh().age,null);
for(const age of [18,27,65,100]){
 const started=apply(fresh(),{type:'start',name:'선택한 인물',gender:'female',background:'merchant',occupation:'clerk',age}).state;
 assert.equal(started.age,age);assert.equal(started.ageChosen,true);assert.equal(started.career,'clerk');
 const edited=apply({...started,day:9,cash:77},{type:'profile',name:'선택한 인물',gender:'female',age:age===100?50:age+1}).state;
 assert.equal(edited.day,9);assert.equal(edited.cash,77);assert.equal(edited.career,'clerk');
 assert.equal(edited.age,age===100?50:age+1);
}
for(const age of [null,17,101,22.5,NaN,'25']){
 const state=fresh();assert.equal(apply(state,{type:'start',name:'시민',gender:'male',background:'worker',occupation:'worker',age}).state,state);
}
let oldAge={...fresh(),age:24,profileSet:true,startConfigured:true,day:17,cash:58};delete oldAge.ageChosen;
oldAge=require('../campaign').normalize(oldAge);assert.equal(oldAge.ageChosen,false);
oldAge=apply(oldAge,{type:'profile',name:'기존 인물',gender:'unspecified',age:39}).state;
assert.equal(oldAge.age,39);assert.equal(oldAge.day,17);assert.equal(oldAge.cash,58);
console.log('시작 나이 직접 입력·범위와 정수 검증·편집 시 경력/자원 유지·기존 24세 저장 수정 통과');
const Politics=require('../politics');
for(const id of Object.keys(Politics.candidates)){
 const state={...fresh(),day:19,politics:{...Politics.fresh(),activity:{sora:0,doyun:0,jian:0}}};
 state.politics.activity[id]=6;
 const result=Politics.result(state);
 assert.equal(result.winnerId,id);
 for(const district of result.districts)assert(Math.abs(Object.values(district.shares).reduce((a,b)=>a+b,0)-100)<.0001);
}
let political={...fresh(),candidate:true,cash:100,network:{name:'모임',members:[{id:'accountant',loyalty:40,competence:75}]}};
political=apply(political,{type:'seekEndorsement',person:'accountant'}).state;assert.equal(political.politics.endorsements.accountant,'jian');
political=apply(political,{type:'choosePlatform',platform:'transparency'}).state;assert.equal(political.politics.endorsements.accountant,'player');
let deserter={...fresh(),day:12,network:{name:'조직',members:[{id:'planner',loyalty:10,competence:80}]},institution:{...institutions.fresh(),scrutiny:60}};
deserter=apply(deserter,{type:'advance'}).state;assert.equal(deserter.network.members.length,0);assert(deserter.journal.some(item=>item.text.includes('떠나')));
let reelection={...fresh(),day:19,career:'clerk',support:90,candidate:true,cash:300};
reelection=apply(reelection,{type:'advance'}).state;assert.equal(reelection.election.won,true);assert.equal(reelection.career,'mayor');assert.equal(reelection.politics.nextDay,48);assert.equal(reelection.candidate,false);
reelection=apply(reelection,{type:'acknowledge'}).state;
reelection=apply(reelection,{type:'run'}).state;assert.equal(reelection.candidate,true);
reelection=JSON.parse(JSON.stringify(reelection));
while(reelection.day<47)reelection=apply(reelection,{type:'advance'}).state;
reelection.support=0;
reelection=apply(reelection,{type:'advance'}).state;assert.equal(reelection.day,48);assert.equal(reelection.election.won,false);assert.equal(reelection.career,'clerk');assert.equal(reelection.politics.nextDay,76);assert.equal(reelection.politics.history.length,2);
console.log('NPC 3후보 당선 가능·구역 합계·공약과 독립 지지·조직 이탈·20/48일 선거·임기 종료·재출마·저장 이력 통과');
let expanding={...fresh(),startConfigured:true,startingOccupation:'apprentice',support:50};
Politics.ensureField(expanding);
const firstField=JSON.parse(JSON.stringify(expanding.politics.field));
assert(Object.keys(Politics.pool(expanding)).length>3);
assert(Politics.pool(expanding).eunho);
expanding=JSON.parse(JSON.stringify(expanding));Politics.ensureField(expanding);assert.deepEqual(expanding.politics.field,firstField);
const snapshot=Politics.result(expanding);assert(Object.keys(snapshot.candidates).some(id=>id.startsWith('citizen-')));
expanding.politics.round++;
Politics.ensureField(expanding);assert(!Object.keys(expanding.politics.field).includes('citizen-1-0'));assert(expanding.politics.field['citizen-2-0']);
assert(snapshot.candidates['citizen-1-0']);
const beforeDefection={...fresh(),day:13,startConfigured:true,institution:{...institutions.fresh(),scrutiny:60},network:{name:'조직',members:[{id:'officer',loyalty:10,competence:70}]}};
Politics.ensureField(beforeDefection);Politics.tick(beforeDefection);
assert(Politics.pool(beforeDefection)['independent-officer']);assert.equal(beforeDefection.network.members.length,0);
let generatedWin=false;
for(let seed=1;seed<20;seed++){
 const state={...fresh(),startConfigured:true,randomState:{...fresh().randomState,seed}};Politics.ensureField(state);
 for(const id of Object.keys(state.politics.field).filter(id=>id.startsWith('citizen-'))){
  state.politics.activity={sora:0,doyun:0,jian:0,[id]:6};
  const result=Politics.result(state);
  if(result.winnerId===id)generatedWin=true;
  assert(Number.isFinite(result.totals[id]));
 }
}
assert(generatedWin);
console.log('3명 고정 해제·상황별 후보·회차별 생성 인물·동일 저장 유지·이탈자 독립 출마·신규 후보 당선·과거 명부 보존 통과');
