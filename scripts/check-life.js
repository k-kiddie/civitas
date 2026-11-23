'use strict';
const assert=require('node:assert/strict');
const C=require('../campaign');const {fresh,apply,normalize}=C;const Life=C.life;
function start(occupation='worker',age=30){return apply(fresh(),{type:'start',occupation,background:'worker',name:'가람',gender:'unspecified',age}).state;}
function ready(){
 const s=normalize({...fresh(),startConfigured:true,profileSet:true,ageChosen:true,name:'가람',age:30,day:28,cash:1000,energy:100,career:'worker',flooded:0,built:'long',jobStory:{stage:'complete',opening:null,evidence:false,wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.life.clock.mode='lifetime';s.politics.nextDay=1480;s.politics.round=2;s.randomState.lastDay=100000;return s;
}
for(const occupation of Object.keys(C.starts.occupations)){
 let s=start(occupation,37);assert.equal(s.life.people.player.age,37);assert.equal(s.life.people.player.occupation,occupation);assert.equal(s.life.people.player.gender,'unspecified');
 assert.equal(Object.values(s.life.people).filter(p=>p.source==='resident').length,18);
 assert.equal(Object.values(s.life.people).filter(p=>p.source==='story').length,13);
 assert.equal(s.life.clock.mode,'lifetime');assert.deepEqual(start(occupation,37).life,s.life);
}
let career=start();career.eventQueue=[];career.cash=1000;career.energy=100;career.actions=2;
career=apply(career,{type:'train',skill:'craft'}).state;career=apply(career,{type:'applyJob',career:'artisan'}).state;
assert.equal(career.life.people.player.occupation,'artisan');assert(career.life.people.player.history.some(item=>item.type==='training'));assert(career.life.people.player.history.some(item=>item.text.includes('항구 노동자 → 정비공')));
career.actions=2;career.skills.administration=1;career=apply(career,{type:'enlist',department:'reconstruction'}).state;
assert.equal(career.life.people.player.occupation,'official');assert.match(career.life.people.player.jobTitle,/도시재건청/);
career.institution.rank=1;career.actions=2;career=apply(career,{type:'officialDuty'}).state;
assert(career.life.people.player.history.some(item=>item.text.includes('과장')));
career.actions=2;career=apply(career,{type:'leaveInstitution'}).state;
assert(career.life.people.player.history.filter(item=>item.type==='career').length>=3);
assert.equal(career.life.people.player.wealth,career.cash);
const failed=apply(career,{type:'applyJob',career:'invalid'});assert.equal(failed.state,career);
const old=ready();delete old.life;const restored=normalize(old);assert(!old.life);assert.deepEqual(normalize(restored).life,restored.life);
assert.equal(Life.age({baseAge:30,ageDay:1},365),30);assert.equal(Life.age({baseAge:30,ageDay:1},366),31);
assert.equal(Life.calendar(365),'1년 겨울 92일');assert.equal(Life.calendar(366),'2년 봄 1일');
let health=ready();health.life.people.player.health=20;health=apply(health,{type:'lifeCare'}).state;assert.equal(health.life.people.player.health,32);assert.equal(health.cash,994);assert.equal(apply(health,{type:'lifeCare'}).state,health);
const neighbour=Object.values(health.life.people).find(p=>p.occupation==='unemployed');neighbour.relationship=54;
health=apply(health,{type:'lifeVisit',person:neighbour.id}).state;assert.equal(health.life.people[neighbour.id].relationship,60);
health.actions=2;assert.equal(apply(health,{type:'lifeVisit',person:neighbour.id}).state,health);
health=apply(health,{type:'lifeRefer',person:neighbour.id}).state;assert(health.life.people[neighbour.id].jobOffer);
health=apply(health,{type:'advance'}).state;assert.equal(health.life.people[neighbour.id].occupation,'worker');
const npcState=ready();
const apprentice=Object.values(npcState.life.people).find(p=>p.source==='resident'&&p.occupation==='apprentice');
apprentice.baseAge=25;
const soldier=Object.values(npcState.life.people).find(p=>p.source==='resident'&&p.occupation==='soldier');
soldier.baseAge=25;
const farmer=Object.values(npcState.life.people).find(p=>p.source==='resident'&&p.occupation==='farmer'&&p.district===1);
const retiring=Object.values(npcState.life.people).find(p=>p.source==='resident'&&p.occupation==='trader');retiring.baseAge=65;
// Drive the same shared clock for all civilian occupations and story actors.
npcState.flooded=18;
for(let day=29;day<=770;day++){npcState.day=day;Life.tick(npcState);}
assert.equal(apprentice.occupation,'artisan');assert.equal(soldier.occupation,'guard');assert.equal(retiring.occupation,'retired');assert(farmer.floodJobLoss);assert(farmer.history.some(item=>item.text.includes('침수로')));
assert.equal(npcState.life.people['story-eunho'].jobTitle,'방직공');assert.notEqual(npcState.life.people['story-eunho'].wealth,40);
const snapshot=JSON.stringify(npcState.life);Life.tick(npcState);assert.equal(JSON.stringify(npcState.life),snapshot);
console.log('공통 인물·시작 나이/성별·전직/훈련/기관 경력·개인 돈·건강 관리·안부·구직 추천·주민 숙련/전직/전역/은퇴·침수 실직·이야기 인물 생활·구형 저장 통과');

const initial=ready();let manual=JSON.parse(JSON.stringify(initial));
for(let day=28;day<58;day++){
 if([1,3,5].includes(manual.day%7))manual=apply(manual,{type:'work'}).state;
 else if(manual.energy<70)manual=apply(manual,{type:'rest'}).state;
 manual=apply(manual,{type:'advance'}).state;
}
let compressed=apply(initial,{type:'lifePass',days:30,routine:'work'}).state;
assert.equal(compressed.day,58);assert.equal(compressed.cash,manual.cash);assert.equal(compressed.energy,manual.energy);assert.equal(compressed.life.people.player.health,manual.life.people.player.health);
assert.equal(compressed.life.clock.plan,null);assert.equal(compressed.life.people.player.wealth,compressed.cash);
assert.equal(Object.hasOwn(compressed.life,'processing'),false);
let year=apply(ready(),{type:'lifePass',days:365,routine:'work'}).state;
assert.equal(year.day,393);assert.equal(year.life.people.player.age,31);assert.equal(year.life.clock.plan,null);
assert(year.life.people.player.history.length<20); // compressed routine is summarized, not one diary row per workday.
assert.equal(year.politics.nextDay,1480);
let pause=ready();pause.followUps=[{type:'aid',day:35}];pause=apply(pause,{type:'lifePass',days:90,routine:'work'}).state;
assert.equal(pause.day,35);assert.equal(pause.life.clock.plan.target,118);assert(pause.eventQueue.length);
assert.equal(apply(pause,{type:'lifeContinue'}).state,pause);
let replay=JSON.parse(JSON.stringify(pause));pause=apply(pause,{type:'acknowledge'}).state;replay=apply(replay,{type:'acknowledge'}).state;
pause=apply(pause,{type:'lifeContinue'}).state;replay=apply(replay,{type:'lifeContinue'}).state;
assert.equal(pause.day,118);assert.equal(pause.life.clock.plan,null);assert.deepEqual(pause.life,replay.life);assert.equal(pause.cash,replay.cash);
let election=ready();election.politics.nextDay=50;election=apply(election,{type:'lifePass',days:90,routine:'work'}).state;
assert.equal(election.day,40);assert(election.life.clock.plan);election=apply(election,{type:'lifeContinue'}).state;
assert.equal(election.day,50);assert(election.eventQueue.some(event=>event.id==='election'));assert.equal(election.politics.nextDay,1510);
let legacy=ready();legacy.life.clock.mode='daily';legacy.politics.nextDay=48;legacy=apply(legacy,{type:'lifePass',days:30,routine:'work'}).state;
assert.equal(legacy.life.clock.mode,'lifetime');assert.equal(legacy.politics.nextDay,1480);
let registered=ready();registered.life.clock.mode='daily';registered.candidate=true;assert.equal(apply(registered,{type:'lifePass',days:30,routine:'work'}).state,registered);
let pending=ready();pending.pacts.agreements=[{status:'governing',round:1}];assert.equal(apply(pending,{type:'lifePass',days:30,routine:'work'}).state,pending);
let debt=ready();debt.cash=0;debt=apply(debt,{type:'lifePass',days:30,routine:'rest'}).state;assert(debt.day<58);assert(debt.cash<0);assert(debt.life.clock.plan);
const debtDay=debt.day;debt=apply(debt,{type:'lifeCancel'}).state;assert.equal(debt.life.clock.plan,null);assert.equal(debt.day,debtDay);
let cadence=ready();cadence.day=100;cadence.randomState.lastDay=50;cadence.randomState.checkedDay=0;assert.equal(C.randomEvents.schedule(cadence),null);
console.log('30일 자동 근무와 수동 정산 일치·365일/생일·일상 기록 요약·사건 정지/저장 재개·선거운동 정지/4년 임기·기존 저장 전환·협약/등록 보호·자금 부족/계획 취소·장기 사건 간격 통과');

let connected=ready();
connected.election={day:20,round:1,won:true,ran:true,winnerId:'player',playerName:connected.name,totals:{player:100,sora:0},candidates:{sora:{name:'소라',platform:'housing',partyName:'생활노동연대'}}};
C.council.seatElection(connected,connected.election);connected=normalize(connected);
const politician=connected.council.chamber.members[0],commonId='council:'+politician.id;
assert.equal(connected.life.people[commonId].occupation,'councillor');
const relation=politician.relationship;
connected=apply(connected,{type:'lifeVisit',person:commonId}).state;
assert.equal(connected.council.chamber.members.find(p=>p.id===politician.id).relationship,relation+6);
assert.equal(connected.life.people[commonId].relationship,relation+6);
const money=connected.life.people[commonId].wealth,healthBefore=connected.life.people[commonId].health;
connected.election={...connected.election,round:2,day:48,winnerId:'sora',won:false,totals:{player:0,sora:100}};connected.day=48;
C.council.seatElection(connected,connected.election);connected=normalize(connected);
assert.notEqual(connected.life.people[commonId].occupation,'councillor');assert.equal(connected.life.people[commonId].wealth,money);assert.equal(connected.life.people[commonId].health,healthBefore);
assert.equal(connected.life.people[commonId].relationship,relation+6);assert(connected.life.people[commonId].politics.terms.length>=2);
let agency=ready();const officer=Object.values(agency.life.people).find(p=>p.source==='resident'&&p.occupation==='clerk');
officer.goal='official';officer.skills.administration=11;agency.day=35;Life.tick(agency);assert.equal(officer.occupation,'official');delete agency.agencies[officer.agency];agency.day=36;Life.tick(agency);assert.equal(officer.occupation,'unemployed');
console.log('공통 명부와 의원 기록의 동일 인물 연결·안부 관계 양방향 반영·원외 민간 복귀 시 돈/건강 유지·기관 폐지 후 주민 보직 상실 통과');

let firstElection=start('farmer',32);firstElection.eventQueue=[];while(firstElection.day<20){firstElection=apply(firstElection,{type:'advance'}).state;firstElection.eventQueue=[];}assert.equal(firstElection.politics.nextDay,1480);assert.equal(firstElection.life.people.player.age,32);

let absorbed=ready();const transferred=Object.values(absorbed.life.people).find(p=>p.source==='resident'&&p.occupation==='clerk');transferred.goal='official';transferred.skills.administration=11;absorbed.day=35;Life.tick(absorbed);const sourceAgency=transferred.agency;const targetAgency=Object.keys(absorbed.agencies).find(id=>id!==sourceAgency&&absorbed.agencies[id].branch==='civil');delete absorbed.agencies[sourceAgency];absorbed.agencyHistory=[{status:'enacted',type:'mergeAgency',source:sourceAgency,target:targetAgency,resolvedDay:36}];absorbed.day=36;Life.tick(absorbed);assert.equal(transferred.occupation,'official');assert.equal(transferred.agency,targetAgency);
