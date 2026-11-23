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
const Parties=require('../parties');
const founding=()=>({...fresh(),cash:100,support:50,network:{name:'시민 모임',kind:'public',members:[{id:'planner',loyalty:40,competence:80},{id:'accountant',loyalty:40,competence:75}]}});
let partyState=founding();
partyState=apply(partyState,{type:'partyFound',name:'새로운시민당',platform:'transparency'}).state;
assert.equal(partyState.parties.membership,'party-1');assert.equal(partyState.cash,80);assert.equal(partyState.parties.registry['party-1'].funds,20);
assert.equal(Object.keys(partyState.parties.registry['party-1'].members).length,3);
partyState=apply(partyState,{type:'partyOrganize'}).state;
assert.equal(apply(partyState,{type:'partyOrganize'}).state,partyState);
partyState=apply(partyState,{type:'advance'}).state;partyState=apply(partyState,{type:'partyOrganize'}).state;
partyState=apply(partyState,{type:'run'}).state;partyState=apply(partyState,{type:'advance'}).state;
partyState=apply(partyState,{type:'partyNominate'}).state;
assert.equal(partyState.parties.registry['party-1'].nomination.id,'player');
const bonusBefore=Parties.bonus(partyState,'player',Politics.pool(partyState));
partyState=apply(partyState,{type:'partyAlliance',party:'civic'}).state;
assert(Parties.bonus(partyState,'player',Politics.pool(partyState))>bonusBefore);
partyState=apply(partyState,{type:'advance'}).state;
const fundTotal=Object.values(partyState.parties.registry).reduce((sum,party)=>sum+party.funds,0);
partyState=apply(partyState,{type:'partyMerge',party:'civic'}).state;
assert.equal(partyState.parties.membership,'civic');assert(!partyState.parties.registry['party-1']);assert.equal(Object.values(partyState.parties.registry).reduce((sum,party)=>sum+party.funds,0),fundTotal);
let splitState=founding();splitState=apply(splitState,{type:'partyJoin',party:'civic'}).state;
assert.equal(splitState.parties.registry.civic.funds,29);splitState.parties.standing=45;
splitState=apply(splitState,{type:'partySplit',name:'분당개혁당',platform:'transparency'}).state;
assert.equal(splitState.parties.membership,'party-1');assert(splitState.parties.registry.civic);assert(!splitState.parties.registry.civic.members.player);
splitState=apply(splitState,{type:'advance'}).state;const funds=splitState.parties.registry['party-1'].funds,publicBefore=splitState.treasury,cashBefore=splitState.cash;
splitState=apply(splitState,{type:'partyDissolve'}).state;assert.equal(splitState.parties.membership,null);assert.equal(splitState.treasury,publicBefore+funds);assert.equal(splitState.cash,cashBefore);
for(const decision of ['accept','independent']){
 let nomination={...fresh(),cash:100};nomination=apply(nomination,{type:'partyJoin',party:'civic'}).state;nomination=apply(nomination,{type:'run'}).state;nomination=apply(nomination,{type:'advance'}).state;
 nomination=apply(nomination,{type:'partyNominate'}).state;assert(nomination.eventQueue[0].partyDecision);
 nomination=apply(nomination,{type:'eventChoice',eventId:nomination.eventQueue[0].id,choice:decision}).state;
 assert.equal(nomination.candidate,decision==='independent');assert.equal(nomination.parties.membership,decision==='accept'?'civic':null);
}
let leadership=apply({...fresh(),cash:100},{type:'partyJoin',party:'labor'}).state;leadership.parties.standing=60;
const leadershipBefore=JSON.parse(JSON.stringify(leadership));
leadership=apply(leadership,{type:'partyLeadership'}).state;
assert.equal(leadership.parties.registry.labor.leader,'sora'); // 60 is eligibility, not an automatic victory.
const lostBallot=leadership.parties.ballots[0];
assert.equal(lostBallot.votes.length,6);
assert.equal(Object.values(lostBallot.totals).reduce((sum,count)=>sum+count,0),6);
assert(lostBallot.votes.every(vote=>vote.reasons.length&&lostBallot.candidates[vote.choice]));
assert.deepEqual(apply(leadershipBefore,{type:'partyLeadership'}).state.parties.ballots[0],lostBallot);
leadership=apply(leadership,{type:'acknowledge'}).state;
leadership.actions=2;leadership.parties.standing=100;
assert.equal(apply(leadership,{type:'partyLeadership'}).state,leadership);
leadership.parties.membership=null;delete leadership.parties.registry.labor.members.player;
leadership=apply(leadership,{type:'partyJoin',party:'labor'}).state;leadership.parties.standing=100;
assert.equal(apply(leadership,{type:'partyLeadership'}).state,leadership); // Rejoining cannot reroll.
leadership.politics.round++;leadership.actions=2;
leadership=apply(leadership,{type:'partyLeadership'}).state;
assert.equal(leadership.parties.registry.labor.leader,'player');
assert.equal(leadership.parties.ballots.length,2);
assert.deepEqual(JSON.parse(JSON.stringify(leadership)).parties.ballots,leadership.parties.ballots);
// A previously off-ballot party member can win nomination and really enter the public poll.
let outsider=apply({...fresh(),cash:100},{type:'partyJoin',party:'civic'}).state;
outsider.candidate=true;outsider.parties.registry.civic.leader='seoyun';
outsider=apply(outsider,{type:'partyNominate'}).state;
assert.equal(outsider.parties.registry.civic.nomination.id,'seoyun');
assert(Politics.pool(outsider).seoyun);
assert.equal(Politics.result(outsider).candidates.seoyun.partyName,'시민개혁당');
const alreadyNominated={...outsider,actions:2};assert.equal(apply(alreadyNominated,{type:'partyNominate'}).state,alreadyNominated);
const archived=JSON.parse(JSON.stringify(outsider.parties.ballots[0]));
outsider.name='바뀐 이름';outsider.politics.round++;
assert(!Politics.pool(outsider).seoyun);assert.deepEqual(outsider.parties.ballots[0],archived);
const platformVotes={};
for(const platform of ['housing','transparency']){
 let aligned=apply({...fresh(),cash:100},{type:'partyJoin',party:'civic'}).state;
 aligned.parties.standing=80;aligned.politics.platform=platform;
 aligned=apply(aligned,{type:'partyLeadership'}).state;
 platformVotes[platform]=aligned.parties.ballots[0].totals.player;
}
assert(platformVotes.transparency>platformVotes.housing);
console.log('개별 경선 표수 보존·표별 이유·조건 충족 후 패배·활동 후 승리·재가입 재추첨 차단·다음 회차 재도전·명부 밖 당원 공천·저장 기록 통과');
let civicGroup=apply({...fresh(),cash:100},{type:'foundNetwork',kind:'public',name:'시민 발기 모임'}).state;assert(civicGroup.network);assert.equal(civicGroup.career,'worker');
const rebel={...fresh(),day:13,network:{name:'모임',members:[{id:'planner',loyalty:10,competence:80}]},institution:{...institutions.fresh(),scrutiny:60}};
Politics.tick(rebel);assert(Object.keys(rebel.parties.registry).some(id=>id.startsWith('breakaway-')));
assert.equal(JSON.parse(JSON.stringify(partyState)).parties.membership,'civic');
console.log('창당·가입·활동·공천 수락/탈당·당대표·분당·합당·해산 자금 보존·선거연대·일반 시민 발기모임·NPC 신당 통과');

// Public policy contracts: negotiate before an election, deliver from the public purse after it.
{
const Pacts=require('../pacts');
function pactCandidate(){
 const state={...fresh(),day:19,actions:2,cash:500,treasury:100,support:95,candidate:true,flooded:18,built:'short',residents:{harbor:48,village:8,hill:12}};
 state.parties.membership='civic';state.parties.standing=80;
 Object.assign(state.parties.registry.civic,{leader:'player',nomination:{round:1,id:'player'}});
 state.parties.registry.civic.members.player={name:state.name};
 state.politics.platform='transparency';
 return state;
}
function signPact(state,target,choice='accept'){
 state=apply(state,{type:'pactOffer',party:target}).state;
 const event=state.eventQueue[0];assert(event.pactOffer);
 const before=JSON.parse(JSON.stringify(state));
 state=apply(state,{type:'eventChoice',eventId:event.id,choice}).state;
 assert(state.eventQueue[0].resolved);
 assert.equal(apply(state,{type:'eventChoice',eventId:event.id,choice}).state,state);
 // Replaying the same saved negotiation always yields the same terms.
 assert.deepEqual(apply(before,{type:'eventChoice',eventId:event.id,choice}).state.pacts,state.pacts);
 return apply(state,{type:'acknowledge'}).state;
}
function winPactElection(state){
 state=apply(state,{type:'advance'}).state;assert(state.election.won);assert.equal(state.pacts.agreements[0].status,'governing');
 assert.equal(state.pacts.agreements[0].dueDay,27);
 state.eventQueue=[];state=apply(state,{type:'advance'}).state;
 // These policy tests use pre-approved budgets; parliamentary negotiation is tested separately.
 for(const policy of new Set(Pacts.governing(state).map(pact=>pact.policy))){
  state.actions=2;state=apply(state,{type:'councilSubmit',policy}).state;
  state=apply(state,{type:'councilVote',policy}).state;
  assert.equal(require('../council').billFor(state,policy).status,'passed');state.eventQueue=[];
 }
 state.actions=2;
 return state;
}

let contracted=pactCandidate();const supportBeforePact=Politics.result(contracted).totals.player;
contracted=signPact(contracted,'labor');assert.equal(Pacts.electionBonus(contracted),2);
assert(Politics.result(contracted).totals.player>supportBeforePact);
assert.equal(apply(contracted,{type:'pactOffer',party:'labor'}).state,contracted);
const signedCopy=JSON.parse(JSON.stringify(contracted.pacts));
contracted=winPactElection(contracted);
const publicFunds=contracted.treasury,privateFunds=contracted.cash,partyFunds=contracted.parties.registry.civic.funds;
let poorTreasury={...contracted,treasury:0};assert.equal(apply(poorTreasury,{type:'pactDeliver',policy:'housing'}).state,poorTreasury);
contracted=apply(contracted,{type:'policy',policy:'housing'}).state;
assert.equal(contracted.policy,'housing');assert.equal(contracted.treasury,publicFunds-20);
assert.equal(contracted.cash,privateFunds);assert.equal(contracted.parties.registry.civic.funds,partyFunds);
assert.equal(contracted.residents.village,16);assert.equal(contracted.pacts.agreements[0].status,'fulfilled');
assert.equal(Pacts.trust(contracted,'labor'),65);
assert.equal(apply(contracted,{type:'pactDeliver',policy:'housing'}).state,contracted);
assert.equal(apply(contracted,{type:'policy',policy:'housing'}).state,contracted);
assert.deepEqual(JSON.parse(JSON.stringify(contracted)).pacts,contracted.pacts);
assert.equal(signedCopy.agreements[0].status,'signed');
let declined=signPact(pactCandidate(),'labor','decline');assert.equal(declined.pacts.agreements.length,0);assert.equal(Pacts.electionBonus(declined),0);
assert.equal(apply(declined,{type:'pactOffer',party:'labor'}).state,declined);
let counter=signPact(pactCandidate(),'labor','counter');assert.equal(counter.pacts.agreements[0].policy,'transparency');
counter=winPactElection(counter);counter=apply(counter,{type:'pactDeliver',policy:'transparency'}).state;assert(counter.witness);
let lowStanding=pactCandidate();lowStanding.parties.standing=50;lowStanding=apply(lowStanding,{type:'pactOffer',party:'labor'}).state;
assert.equal(apply(lowStanding,{type:'eventChoice',eventId:lowStanding.eventQueue[0].id,choice:'counter'}).state,lowStanding);
let badTrust=pactCandidate();badTrust.pacts.trust.labor=20;assert.equal(apply(badTrust,{type:'pactOffer',party:'labor'}).state,badTrust);
let repair=pactCandidate();repair.pacts.trust.labor=25;
const meetingFunds=repair.parties.registry.civic.funds;
repair=apply(repair,{type:'pactRepair',party:'labor'}).state;
assert.equal(Pacts.trust(repair,'labor'),35);assert.equal(repair.parties.registry.civic.funds,meetingFunds-4);
assert.equal(apply(repair,{type:'pactRepair',party:'labor'}).state,repair);
assert(apply(repair,{type:'pactOffer',party:'labor'}).state.eventQueue[0].pactOffer);
let nonLeader=pactCandidate();nonLeader.parties.registry.civic.leader='jian';assert.equal(apply(nonLeader,{type:'pactOffer',party:'labor'}).state,nonLeader);
let lateOffer=apply(pactCandidate(),{type:'pactOffer',party:'labor'}).state;lateOffer.day=20;lateOffer.politics.round=2;lateOffer.politics.nextDay=48;
assert.equal(apply(lateOffer,{type:'eventChoice',eventId:lateOffer.eventQueue[0].id,choice:'accept'}).state,lateOffer);
let missed=winPactElection(signPact(pactCandidate(),'labor'));
missed.day=27;missed.eventQueue=[];missed.support=50;
const trustBeforeMiss=Pacts.trust(missed,'labor');
missed=apply(missed,{type:'advance'}).state;
assert.equal(missed.pacts.agreements[0].status,'broken');assert.equal(missed.support,42);assert.equal(Pacts.trust(missed,'labor'),trustBeforeMiss-25);
const penaltyOnce=missed.support;Pacts.tick(missed);assert.equal(missed.support,penaltyOnce);
let onDeadline=winPactElection(signPact(pactCandidate(),'labor'));onDeadline.day=27;
onDeadline=apply(onDeadline,{type:'pactDeliver',policy:'housing'}).state;assert.equal(onDeadline.pacts.agreements[0].status,'fulfilled');
let resigned=winPactElection(signPact(pactCandidate(),'labor'));
resigned=apply(resigned,{type:'resignOffice'}).state;assert.equal(resigned.pacts.agreements[0].status,'broken');assert.equal(resigned.career,'worker');
let withdrawn=winPactElection(signPact(pactCandidate(),'labor'));
const withdrawnId=withdrawn.pacts.agreements[0].id;
withdrawn=apply(withdrawn,{type:'pactBreak',pact:withdrawnId}).state;
assert.equal(withdrawn.pacts.agreements[0].status,'broken');
assert.equal(apply(withdrawn,{type:'pactBreak',pact:withdrawnId}).state,withdrawn);
let mergedPact=winPactElection(signPact(pactCandidate(),'commerce'));
mergedPact.parties.registry.labor.platform='transparency';
mergedPact=apply(mergedPact,{type:'partyMerge',party:'labor'}).state;
assert.equal(mergedPact.parties.membership,'labor');assert.equal(mergedPact.pacts.agreements[0].status,'broken');
let dissolved=winPactElection(signPact(pactCandidate(),'labor'));const dissolutionSupport=dissolved.support;
delete dissolved.parties.registry.labor;Pacts.tick(dissolved);assert.equal(dissolved.pacts.agreements[0].status,'annulled');assert.equal(dissolved.support,dissolutionSupport);
let lost=signPact(pactCandidate(),'labor');lost.support=0;lost=apply(lost,{type:'advance'}).state;
assert(!lost.election.won);assert.equal(lost.pacts.agreements[0].status,'expired');assert.equal(Pacts.trust(lost,'labor'),50);
// One shared project fulfills two same-policy contracts, without paying or granting effects twice.
let shared=signPact(pactCandidate(),'labor','counter');shared=signPact(shared,'commerce','counter');
shared=winPactElection(shared);const beforeShared=shared.treasury;
shared=apply(shared,{type:'pactDeliver',policy:'transparency'}).state;
assert.equal(shared.treasury,beforeShared-16);assert(shared.pacts.agreements.every(pact=>pact.status==='fulfilled'));
let trade=winPactElection(signPact(pactCandidate(),'commerce'));
trade=apply(trade,{type:'pactDeliver',policy:'trade'}).state;assert.equal(Pacts.weeklyRevenue(trade),4);
trade.eventQueue=[];trade.day=27;const tradeTreasury=trade.treasury;
trade=apply(trade,{type:'advance'}).state;assert.equal(trade.treasury,tradeTreasury+14);
trade.election={...trade.election,round:2};assert.equal(Pacts.weeklyRevenue(trade),0);
let security=pactCandidate();security.parties.registry.commerce.platform='security';
security=winPactElection(signPact(security,'commerce'));
security=apply(security,{type:'pactDeliver',policy:'security'}).state;assert.equal(Pacts.districtBonus(security,2),6);assert.equal(Pacts.districtBonus(security,0),0);
security.officeResigned=true;assert.equal(Pacts.districtBonus(security,2),0);
const prePactSave=fresh();delete prePactSave.pacts;assert.deepEqual(require('../campaign').normalize(prePactSave).pacts,Pacts.fresh());
console.log('협약 수락/역제안/거절·신뢰·자격·재협상 차단·득표 지원·당선 의무·낙선 종료·공금 분리·중복 집행 차단·기한/사임 파기·상대 소멸·공동 사업·임기 세수/지역 기반·구형 저장 통과');
}

{
 const Council=require('../council');
 const Pacts=require('../pacts');
 const state=fresh();
 const synthetic={round:1,day:20,ran:true,won:true,winnerId:'player',winner:state.name,playerName:state.name,
   totals:{player:34,sora:33,doyun:33,jian:0},candidates:{sora:{name:'소라',platform:'housing',partyName:'생활노동연대'},doyun:{name:'도윤',platform:'trade',partyName:'도시경제당'},jian:{name:'지안',platform:'transparency',partyName:'시민개혁당'}}};
 state.parties.membership='civic';state.parties.registry.civic.members.player={name:state.name};
 state.parties.registry.civic.leader='player';state.parties.registry.civic.nomination={round:1,id:'player'};
 state.parties.standing=80;state.day=21;state.career='mayor';state.election=synthetic;
 state.politics.round=2;state.politics.nextDay=48;state.treasury=100;state.energy=100;
 // A security pledge has neither the labor nor commerce caucus's automatic support.
 state.pacts.agreements=[{id:'test-pact',party:'civic',partyName:'시민개혁당',target:'labor',targetName:'생활노동연대',round:1,policy:'security',status:'governing',dueDay:27}];
 Council.seatElection(state,synthetic);
 assert.equal(state.council.chamber.groups.reduce((sum,group)=>sum+group.seats,0),11);
 assert.equal(state.council.chamber.groups.find(group=>group.id==='civic').seats,4);
 assert(!state.council.chamber.groups.find(group=>group.votes===0));
 const recordedChamber=JSON.parse(JSON.stringify(state.council.history[0]));
 let chamber=JSON.parse(JSON.stringify(state));
 // A broken alliance's trust makes its pledge support unavailable.
 chamber.pacts.trust.labor=20;
 assert.equal(apply(chamber,{type:'pactDeliver',policy:'security'}).state,chamber);
 const fundsBefore=chamber.treasury;
 chamber=apply(chamber,{type:'councilSubmit',policy:'security'}).state;
 assert.equal(chamber.treasury,fundsBefore);assert.equal(Council.preview(chamber,Council.billFor(chamber,'security')).yes,4);
 assert.equal(apply(chamber,{type:'councilSubmit',policy:'security'}).state,chamber);
 chamber=apply(chamber,{type:'councilVote',policy:'security'}).state;
 assert.equal(Council.billFor(chamber,'security').status,'rejected');assert.equal(chamber.treasury,fundsBefore);
 chamber.eventQueue=[];chamber.actions=2;
 assert.equal(apply(chamber,{type:'councilRevise',policy:'security'}).state,chamber);
 chamber=apply(chamber,{type:'advance'}).state;
 chamber=apply(chamber,{type:'councilRevise',policy:'security'}).state;
 const refused=apply(chamber,{type:'councilLobby',policy:'security',group:'labor'});assert.equal(refused.state,chamber);
 chamber=apply(chamber,{type:'councilLobby',policy:'security',group:'commerce'}).state;
 assert.equal(Council.cost(chamber,'security',20),24);assert.equal(chamber.treasury,fundsBefore);
 chamber=apply(chamber,{type:'advance'}).state;
 const persisted=JSON.parse(JSON.stringify(chamber));
 const predicted=Council.preview(chamber,Council.billFor(chamber,'security'));
 chamber=apply(chamber,{type:'councilVote',policy:'security'}).state;
 assert.equal(Council.billFor(chamber,'security').status,'passed');assert.equal(predicted.yes,8);
 const accepted=Council.billFor(chamber,'security');assert.equal(accepted.ballots.length,2);
 assert.deepEqual(apply(persisted,{type:'councilVote',policy:'security'}).state.council,chamber.council);
 chamber.eventQueue=[];
 const poor={...chamber,treasury:23};assert.equal(apply(poor,{type:'pactDeliver',policy:'security'}).state,poor);
 const personal=chamber.cash,partyMoney=chamber.parties.registry.civic.funds,supportBefore=chamber.support;
 chamber=apply(chamber,{type:'pactDeliver',policy:'security'}).state;
 assert.equal(chamber.treasury,fundsBefore-24);assert.equal(chamber.cash,personal);assert.equal(chamber.parties.registry.civic.funds,partyMoney);
 assert.equal(chamber.support,supportBefore+4);assert.equal(Council.billFor(chamber,'security').status,'executed');
 assert.equal(apply(chamber,{type:'pactDeliver',policy:'security'}).state,chamber);
 assert.equal(accepted.ballots[0].yes,4);assert.equal(accepted.ballots[1].yes,8);
 assert.deepEqual(chamber.council.history[0],recordedChamber);
 // Automatic support responds to the exact promised policy and to policy alignment.
 const policyDraft={policy:'security',round:1,amendments:[]};
 assert(Council.intent(state,policyDraft,state.council.chamber.groups.find(group=>group.id==='labor')).yes);
 const housingDraft={policy:'housing',round:1,amendments:[]};
 assert(Council.intent(state,housingDraft,state.council.chamber.groups.find(group=>group.id==='labor')).yes);
 assert(!Council.intent(state,policyDraft,state.council.chamber.groups.find(group=>group.id==='commerce')).yes);
 // A mayor elected independently doesn't gain another party's votes merely by joining it.
 const independentState=fresh();independentState.election={...synthetic};
 Council.seatElection(independentState,synthetic);
 const independentGroup=independentState.council.chamber.groups.find(group=>group.id==='independent-player');
 assert(Council.intent(independentState,policyDraft,independentGroup).yes);
 independentState.parties.membership='labor';
 assert(!Council.intent(independentState,policyDraft,independentState.council.chamber.groups.find(group=>group.id==='labor')).yes);
 for(let seed=1;seed<=8;seed++){
  const electionState={...fresh(),startConfigured:true,candidate:seed%2===0,support:seed*12,randomState:{...fresh().randomState,seed}};
  Politics.ensureField(electionState);const electionResult=Politics.result(electionState);
  Council.seatElection(electionState,electionResult);
  assert.equal(electionState.council.chamber.groups.reduce((sum,group)=>sum+group.seats,0),11);
  assert(electionState.council.chamber.groups.every(group=>Number.isInteger(group.seats)&&group.seats>0));
 }
 const old=fresh();delete old.council;const restored=require('../campaign').normalize(old);
 assert.deepEqual(restored.council,Council.fresh());assert(Council.authorized(restored,'housing'));
 // Reapportion on the next election; preserve the previous term and recorded names.
 Council.seatElection(chamber,{...synthetic,round:2,day:48,totals:{player:10,sora:70,doyun:20,jian:0},won:false,winnerId:'sora'});
 assert.equal(chamber.council.chamber.groups.reduce((sum,group)=>sum+group.seats,0),11);
 assert.deepEqual(chamber.council.history[1],recordedChamber);
 console.log('의회 11석·최대잔여 배분·무소속 정부·협약/노선 찬반·부결 무지출·다음 날 재상정·수정 협상·8석 가결·공금 추가 비용·중복 집행 차단·개표 저장·임기 교체·구형 저장 통과');
}

{
 const Council=require('../council');
 function memberFixture(){
  const s={...fresh(),day:21,actions:2,career:'mayor',cash:500,treasury:100,support:40,flooded:18};
  s.election={round:1,day:20,ran:true,won:true,winnerId:'player',playerName:s.name,totals:{player:34,sora:33,doyun:33},candidates:{sora:{name:'소라',platform:'housing',partyName:'생활노동연대'},doyun:{name:'도윤',platform:'trade',partyName:'도시경제당'}}};
  s.parties.membership='civic';s.parties.registry.civic.members.player={name:s.name};s.parties.registry.civic.leader='player';s.parties.standing=80;
  s.parties.registry.civic.nomination={round:1,id:'player'};s.politics.round=2;s.politics.nextDay=48;
  s.pacts.trust.labor=20;s.pacts.agreements=[{id:'member-pact',party:'civic',partyName:'시민개혁당',target:'labor',targetName:'생활노동연대',round:1,policy:'security',status:'governing',dueDay:27}];
  Council.seatElection(s,s.election);
  for(const member of s.council.chamber.members){member.independence=25;member.relationship=45;member.district=0;}
  return apply(s,{type:'councilSubmit',policy:'security'}).state;
 }
 function meet(s,member,choice){
  s=apply(s,{type:'councilMeet',policy:'security',member}).state;
  const event=s.eventQueue[0];assert(event.councilMeeting);
  const replay=JSON.parse(JSON.stringify(s));
  s=apply(s,{type:'eventChoice',eventId:event.id,choice}).state;
  assert(s.eventQueue[0].resolved);
  assert.deepEqual(apply(replay,{type:'eventChoice',eventId:event.id,choice}).state.council,s.council);
  assert.equal(apply(s,{type:'eventChoice',eventId:event.id,choice}).state,s);
  return apply(s,{type:'acknowledge'}).state;
 }
 let personal=memberFixture();
 const government=personal.council.chamber.members.find(member=>member.group==='civic');
 const outsider=personal.council.chamber.members.find(member=>member.group==='commerce');
 government.independence=80;government.district=1;
 outsider.independence=80;outsider.platform='security';
 const bill=Council.billFor(personal,'security');
 const preview=Council.preview(personal,bill);
 assert.equal(preview.members.length,11);assert.equal(preview.yes,4);
 assert(preview.members.find(member=>member.id===government.id).defected);
 assert(preview.members.find(member=>member.id===outsider.id).defected);
 assert.equal(preview.votes.find(group=>group.id==='civic').yesCount,3);
 assert.equal(preview.votes.find(group=>group.id==='commerce').yesCount,1);
 const noSpending=personal.treasury;
 personal=meet(personal,government.id,'hearing');assert.equal(Council.cost(personal,'security',20),22);
 assert.equal(personal.treasury,noSpending);assert.equal(Council.preview(personal,Council.billFor(personal,'security')).yes,5);
 personal=apply(personal,{type:'advance'}).state;
 const second=personal.council.chamber.members.find(member=>member.group==='commerce'&&member.id!==outsider.id);
 personal=meet(personal,second.id,'hearing');assert.equal(Council.preview(personal,Council.billFor(personal,'security')).yes,6);
 assert.equal(Council.cost(personal,'security',20),24);
 assert.equal(apply(personal,{type:'councilMeet',policy:'security',member:second.id}).state,personal);
 personal=apply(personal,{type:'councilVote',policy:'security'}).state;
 assert.equal(Council.billFor(personal,'security').status,'passed');
 const recorded=JSON.parse(JSON.stringify(Council.billFor(personal,'security').ballots[0]));
 personal.eventQueue=[];personal=apply(personal,{type:'advance'}).state;
 const funds=personal.treasury,opinion=personal.support;
 personal=apply(personal,{type:'pactDeliver',policy:'security'}).state;
 assert.equal(personal.treasury,funds-24);assert.equal(personal.support,opinion+5);
 personal.council.chamber.members[0].relationship=99;
 assert.deepEqual(Council.billFor(personal,'security').ballots[0],recorded);
 assert.deepEqual(JSON.parse(JSON.stringify(personal)).council,personal.council);
 let scandal=memberFixture();scandal.promise='broken';
 const critic=scandal.council.chamber.members.find(member=>member.group==='civic');critic.independence=80;
 assert(!Council.memberIntent(scandal,Council.billFor(scandal,'security'),critic).yes);
 critic.relationship=60;assert(Council.memberIntent(scandal,Council.billFor(scandal,'security'),critic).yes);
 let explained=memberFixture();const persuadable=explained.council.chamber.members.find(member=>member.group==='commerce');
 persuadable.platform='security';const relation=persuadable.relationship;
 explained=meet(explained,persuadable.id,'explain');
 assert(Council.memberIntent(explained,Council.billFor(explained,'security'),explained.council.chamber.members.find(member=>member.id===persuadable.id)).yes);
 assert.equal(Council.cost(explained,'security',20),20);
 assert.equal(explained.council.chamber.members.find(member=>member.id===persuadable.id).relationship,relation+3);
 let refused=memberFixture();const rebel=refused.council.chamber.members.find(member=>member.group==='civic');rebel.independence=80;rebel.district=1;
 refused=meet(refused,rebel.id,'explain');assert(!Council.memberIntent(refused,Council.billFor(refused,'security'),refused.council.chamber.members.find(member=>member.id===rebel.id)).yes);
 refused.actions=2;assert.equal(apply(refused,{type:'councilMeet',policy:'security',member:rebel.id}).state,refused);
 let listened=memberFixture();const listener=listened.council.chamber.members.find(member=>member.group==='commerce');
 listened=meet(listened,listener.id,'listen');assert.equal(listened.council.chamber.members.find(member=>member.id===listener.id).relationship,53);
 assert.equal(Council.cost(listened,'security',20),20);
 let stale=memberFixture();const staleMember=stale.council.chamber.members.find(member=>member.group==='commerce');
 stale=apply(stale,{type:'councilMeet',policy:'security',member:staleMember.id}).state;
 Council.billFor(stale,'security').status='rejected';const staleId=stale.eventQueue[0].id;
 assert.equal(apply(stale,{type:'eventChoice',eventId:staleId,choice:'hearing'}).state,stale);
 stale=apply(stale,{type:'eventChoice',eventId:staleId,choice:'listen'}).state;assert.equal(Council.cost(stale,'security',20),20);
 const legacy=memberFixture();delete legacy.council.chamber.members;
 Council.billFor(legacy,'security').ballots=[{day:20,yes:4,no:7,status:'rejected',votes:[]}];
 const historical=JSON.parse(JSON.stringify(legacy.council.bills));
 const restored=require('../campaign').normalize(legacy);
 assert.equal(restored.council.chamber.members.length,11);assert(!legacy.council.chamber.members);
 assert.deepEqual(restored.council.bills,historical);assert.deepEqual(require('../campaign').normalize(restored).council,restored.council);
 assert.equal(new Set(restored.council.chamber.members.map(member=>member.name)).size,11);
 console.log('의원 11명·개별 찬반 합산·여당 반란/야당 소신표·면담 3선택·설득 성공/실패·지역 조항 예산·6표 가결·중복 면담/효과 차단·낡은 면담 종료·표결 명부 보존·구형 의회 보완 통과');
}

{
 const Council=require('../council');
 function termResult(round,player=100){return {round,day:20+(round-1)*28,ran:true,won:player>=50,winnerId:player>=50?'player':'sora',playerName:'시민',winner:player>=50?'시민':'소라',totals:{player,sora:100-player},candidates:{sora:{name:'소라',platform:'housing',partyName:'생활노동연대'}},districts:[],votes:player};}
 function elect(s,round,share){
  const result=termResult(round,share);s.day=result.day;s.election=result;
  s.parties.registry.civic.nomination={round,id:'player'};Council.seatElection(s,result);return s;
 }
 let s=fresh();s.parties.membership='civic';s.parties.registry.civic.members.player={name:s.name};s.parties.registry.civic.leader='player';
 s=elect(s,1,100);assert.equal(s.council.chamber.members.length,11);
 const originals=s.council.chamber.members.map(member=>member.id),star=originals[0],returning=originals[1];
 for(const member of s.council.chamber.members){member.reputation=69;member.relationship=71;}
 s.council.chamber.members[0].reputation=100;s.council.chamber.members[0].relationship=77;s.council.chamber.members[0].platform='transparency';
 const originalName=s.council.chamber.members[0].name;
 s.day=21;s.career='mayor';s.politics.round=2;s.politics.nextDay=48;
 s.pacts.agreements=[{id:'career-pact',party:'civic',partyName:'시민개혁당',target:'labor',targetName:'생활노동연대',round:1,policy:'security',status:'governing',dueDay:27}];
 s=apply(s,{type:'councilSubmit',policy:'security'}).state;
 s=apply(s,{type:'councilVote',policy:'security'}).state;
 const oldBallot=JSON.parse(JSON.stringify(Council.billFor(s,'security').ballots[0]));
 assert(s.council.people[star].career.some(record=>record.type==='vote'));
 s.eventQueue=[];s=apply(s,{type:'advance'}).state;
 s=apply(s,{type:'pactDeliver',policy:'security'}).state;
 assert(s.council.people[star].career.some(record=>record.type==='delivery'));
 assert.deepEqual(Council.billFor(s,'security').ballots[0],oldBallot); // Career appends cannot mutate a recorded vote.
 const past=JSON.parse(JSON.stringify(s.council.history[0]));
 s=elect(s,2,10);
 assert.equal(s.council.chamber.members.filter(member=>member.group==='civic').length,1);
 assert(s.council.chamber.members.some(member=>member.id===star));
 assert.equal(s.council.people[star].name,originalName);assert.equal(s.council.people[star].relationship,77);
 assert.equal(Council.terms(s.council.people[star]),2);
 assert.equal(s.council.people[returning].status,'defeated');assert.equal(Council.terms(s.council.people[returning]),1);
 assert.equal(s.council.chamber.transition.reelected.length,1);
 assert.equal(s.council.chamber.transition.departed.length,10);
 const saved=JSON.parse(JSON.stringify(s));
 s=elect(s,3,100);const replay=elect(saved,3,100);
 assert.deepEqual(s.council,replay.council);
 assert.equal(s.council.chamber.transition.returned.length,10);
 assert(s.council.chamber.transition.returned.some(member=>member.id===returning));
 assert.equal(Council.terms(s.council.people[returning]),2);assert.equal(s.council.people[returning].relationship,71);
 assert.equal(Council.terms(s.council.people[star]),3);
 assert.equal(new Set(s.council.chamber.members.map(member=>member.id)).size,11);
 const sameRound=JSON.stringify(s.council);Council.seatElection(s,termResult(3,100));assert.equal(JSON.stringify(s.council),sameRound);
 assert.deepEqual(s.council.history[2],past);
 assert.deepEqual(Council.billFor({...s,election:termResult(1)},'security').ballots[0],oldBallot);
 let memoryState=JSON.parse(JSON.stringify(s));memoryState.day=77;memoryState.career='mayor';memoryState.actions=2;memoryState.flooded=18;memoryState.eventQueue=[];
 memoryState.politics.round=4;memoryState.politics.nextDay=104;
 const remembered=memoryState.council.chamber.members.find(member=>member.id===star);remembered.independence=80;remembered.district=1;
 memoryState.pacts.agreements=[{id:'later-pact',party:'civic',target:'labor',round:3,policy:'security',status:'governing',dueDay:83}];
 memoryState=apply(memoryState,{type:'councilSubmit',policy:'security'}).state;
 memoryState=apply(memoryState,{type:'councilMeet',policy:'security',member:star}).state;
 assert(memoryState.eventQueue[0].dialogue.some(line=>line.text.includes('지난 제1회 임기')));
 s=elect(s,4,0);assert.equal(s.council.people[star].status,'dormant');
 s=elect(s,5,100);assert(s.council.chamber.members.some(member=>member.id===star));
 assert.equal(new Set(Council.people(s).map(member=>member.name)).size,Council.people(s).length);
 // An unfulfilled personal commitment is reviewed once when the old term ends.
 let failed=fresh();failed.parties.membership='civic';failed.parties.registry.civic.members.player={name:failed.name};failed=elect(failed,1,100);
 const accountable=failed.council.chamber.members[0];accountable.reputation=90;accountable.relationship=70;
 failed.council.bills=[{id:'unfulfilled-project',round:1,policy:'housing',status:'rejected',amendments:[{member:accountable.id,cost:2}],ballots:[]}];
 failed=elect(failed,2,100);assert.equal(failed.council.people[accountable.id].reputation,80);assert.equal(failed.council.people[accountable.id].relationship,62);
 assert.equal(failed.council.people[accountable.id].career.filter(record=>record.type==='unfulfilled').length,1);
 failed=elect(failed,3,100);assert.equal(failed.council.people[accountable.id].reputation,80);
 const legacy=JSON.parse(JSON.stringify(failed));delete legacy.council.people;
 for(const member of legacy.council.chamber.members){delete member.terms;delete member.career;delete member.reputation;}
 const legacyHistory=JSON.parse(JSON.stringify(legacy.council.history));
 const restored=require('../campaign').normalize(legacy);
 assert.equal(Object.keys(restored.council.people).length,11);assert.deepEqual(restored.council.history,legacyHistory);
 assert(!legacy.council.people);assert.deepEqual(require('../campaign').normalize(restored).council,restored.council);
 // Use the actual daily election path and keep the mayor result before the council transition report.
 let daily=JSON.parse(JSON.stringify(s));daily.day=159;daily.election=termResult(5);daily.politics.round=6;daily.politics.nextDay=160;daily.candidate=false;daily.eventQueue=[];daily.pacts.agreements=[];
 daily=apply(daily,{type:'advance'}).state;
 assert.equal(daily.council.chamber.round,6);assert.equal(daily.council.chamber.members.length,11);
 assert(daily.eventQueue.find(event=>event.id==='council-election-6'));
 assert(daily.eventQueue.findIndex(event=>event.id==='election')<daily.eventQueue.findIndex(event=>event.id==='council-election-6'));
 console.log('인물 ID·관계·활동 지속·재선/낙선/원외 복귀·평판과 경력 평가·교섭단체 원외와 재등장·동일 회차 중복 차단·이행/미이행 책임·과거 개표 보존·구형 저장·실제 반복 선거 보고 통과');
}
