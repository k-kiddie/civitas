'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');const S=C.succession;const L=C.life;
function decide(s,action,choice='accept'){
 s.actions=Math.max(1,s.actions);s.energy=Math.max(50,s.energy);
 s=C.apply(s,action).state;const event=s.eventQueue[0];assert(event?.familyOffer||event?.successionOffer);
 s=C.apply(s,{type:'eventChoice',eventId:event.id,choice}).state;assert(s.eventQueue[0].resolved);return C.apply(s,{type:'acknowledge'}).state;
}
function fixture(){
 let s=C.normalize({...C.fresh(),name:'가람',gender:'female',age:50,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:5000,energy:100,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});
 s.politics.round=2;s.politics.nextDay=1480;s.life.clock.mode='lifetime';s.randomState.lastDay=100000;
 s=decide(s,{type:'familyChild',method:'adoption',name:'온별',childAge:16});const id=L.player(s).family.children[0];
 s.actions=2;s=C.apply(s,{type:'familyEducate',person:id,path:'craft'}).state;s=C.apply(s,{type:'lifePass',days:365,routine:'work'}).state;
 s=C.apply(s,{type:'familyEducate',person:id,path:'craft'}).state;s=C.apply(s,{type:'lifePass',days:365,routine:'work'}).state;s=C.apply(s,{type:'acknowledge'}).state;
 assert.equal(s.life.people[id].age,18);assert.equal(s.life.people[id].occupation,'apprentice');
 s.actions=2;s=decide(s,{type:'familyChild',method:'adoption',name:'작은별',childAge:6});s.cash=1000;s.life.people[id].wealth=70;
 s.skills={investigation:1};s.policeRecommendation=true;s.councilRecommendation=true;s.witness=true;s.support=90;
 s.career='mayor';s.election={day:20,round:1,won:true,ran:true,winner:'가람',playerName:'가람',winnerId:'player',votes:100,totals:{player:100},candidates:{},districts:[]};
 s.politics.history=[JSON.parse(JSON.stringify(s.election))];s.candidate=true;
 s.institution.agencyBudget=123;s.institution.supplies=44;s.institution.readiness=55;
 s.network={name:'선대 조직',kind:'public',members:[{id:'planner',loyalty:90,competence:80}]};
 s.parties.membership='civic';s.parties.standing=90;s.parties.registry.civic.members.player={name:s.name};s.parties.registry.civic.leader='player';s.parties.registry.civic.funds=43;s.parties.registry.civic.nomination={round:2,id:'player'};
 s.pacts.agreements=[{id:'old-fulfilled',status:'fulfilled',round:1,party:'civic',target:'labor',policy:'housing'}];s.pacts.trust.labor=90;
 s.memories=[{day:30,person:'윤',text:'선대의 증언'}];s.life.people.player.occupation='mayor';s.life.people.player.jobTitle='동장';s.actions=2;
 s=C.normalize(s);return {s,id};
}
let {s,id}=fixture();s=C.apply(s,{type:'heirDesignate',person:id}).state;
assert.equal(s.life.succession.heir,id);assert.equal(L.activeId(s),'player');assert.equal(s.career,'mayor');
const world={treasury:s.treasury,agencies:JSON.stringify(s.agencies),residents:JSON.stringify(s.residents),election:JSON.stringify(s.politics.history),funds:s.parties.registry.civic.funds};
let refused=decide(JSON.parse(JSON.stringify(s)),{type:'heirRetire',share:50},'stay');assert.equal(L.activeId(refused),'player');assert.equal(refused.cash,1000);
s.actions=2;s=C.apply(s,{type:'heirRetire',share:50}).state;const offer=s.eventQueue[0];assert(offer.successionOffer);assert.equal(offer.successionOffer.amount,500);assert.equal(offer.successionOffer.total,570);
const serialized=JSON.parse(JSON.stringify(s));
s=C.apply(s,{type:'eventChoice',eventId:offer.id,choice:'continue'}).state;
assert.deepEqual(C.apply(serialized,{type:'eventChoice',eventId:offer.id,choice:'continue'}).state,s);
assert.equal(C.apply(s,{type:'eventChoice',eventId:offer.id,choice:'continue'}).state,s);
assert.equal(L.activeId(s),id);assert.equal(s.name,'온별');assert.equal(s.age,18);assert.equal(L.player(s).age,18);assert.equal(s.gender,'unspecified');
assert.equal(s.cash,570);assert.equal(s.life.people.player.wealth,500);assert.equal(s.cash+s.life.people.player.wealth,1070);
assert.equal(s.career,'apprentice');assert.equal(s.skills.craft,1);assert(!s.skills.investigation);
assert.equal(s.candidate,false);assert.equal(s.officeResigned,true);assert.equal(s.parties.membership,null);assert.equal(s.parties.standing,0);assert.equal(s.parties.registry.civic.members.player,undefined);assert.notEqual(s.parties.registry.civic.leader,'player');
assert.equal(s.network,null);assert.equal(s.institution.rank,0);assert.equal(s.institution.agencyBudget,123);assert.equal(s.institution.supplies,44);assert.equal(s.institution.readiness,55);
assert.equal(s.witness,false);assert.equal(s.policeRecommendation,false);assert.equal(s.councilRecommendation,false);assert.equal(s.support,25);assert.equal(s.underworld.role,null);assert.equal(s.pacts.trust.labor,undefined);assert.equal(s.pacts.agreements[0].actor,'player');
assert.equal(s.treasury,world.treasury);assert.equal(JSON.stringify(s.agencies),world.agencies);assert.equal(JSON.stringify(s.residents),world.residents);assert.equal(JSON.stringify(s.politics.history),world.election);assert.equal(s.parties.registry.civic.funds,world.funds);
assert.deepEqual(L.player(s).family.parents,['player']);assert(s.life.people.player.family.children.includes(id));assert.equal(s.life.people.player.occupation,'retired');assert(s.life.people.player.controlArchive.network);
assert.equal(s.life.succession.history.length,1);assert.equal(s.life.generation,2);assert.equal(s.life.succession.heir,null);assert.equal(s.life.clock.plan,null);
s=C.apply(s,{type:'acknowledge'}).state;const old=JSON.parse(JSON.stringify(s));const previousCash=s.cash,parentCash=s.life.people.player.wealth;const day=s.day+1;
s=C.apply(s,{type:'advance'}).state;
assert.equal(s.career,'apprentice');assert.equal(L.player(s).age,18);assert.equal(s.life.people.player.name,'가람');assert.equal(s.life.people.player.gender,'female');
assert.equal(s.cash,previousCash-3-(day%7===0?12:0)); // minor sibling remains the retired parent's responsibility.
assert.equal(s.life.people.player.wealth,parentCash-2-3-(day%7===0?12:0));
const supportCash=s.cash,supportParent=s.life.people.player.wealth;s=C.apply(s,{type:'familySupport',person:'player'}).state;assert.equal(s.cash,supportCash-10);assert.equal(s.life.people.player.wealth,supportParent+10);
s.actions=2;assert.equal(C.apply(s,{type:'familySupport',person:'player'}).state,s);
const normalized=C.normalize(JSON.parse(JSON.stringify(s)));assert.equal(L.activeId(normalized),id);assert.equal(normalized.career,'apprentice');assert.equal(L.player(normalized).age,18);
assert(!Feligible(normalized,normalized.life.people.player));function Feligible(state,p){return C.family.eligiblePartner(state,p);}
console.log('후계자 지정·은퇴 보류/확정·개인 재산 보존·고유 ID와 나이·부모/형제 관계·자기 교육/직업·공직/조직/추천 비승계·공적 재정/세계 보존·선대 생활비와 가족 지원·저장 복원 통과');

for(const mutate of [q=>q.cash=-1,q=>q.hearing={day:q.day},q=>q.underReview=true,q=>q.caseStage='sealed',q=>q.followUps=[{type:'aid',day:q.day+2}],q=>q.pacts.agreements.push({status:'signed'}),q=>q.pacts.agreements.push({status:'governing'}),q=>q.life.family.pending.push({parents:['player'],dueDay:q.day+270})]){
 const q=JSON.parse(JSON.stringify(old));q.life.activeId='player';q.life.people.player.source='player';q.life.people[id].source='resident';q.cash=1000;q.life.succession.heir=id;q.actions=2;mutate(q);
 assert.equal(C.apply(q,{type:'heirRetire',share:50}).state,q);
}
let changed=JSON.parse(JSON.stringify(serialized));changed.cash++;assert.equal(C.apply(changed,{type:'eventChoice',eventId:offer.id,choice:'continue'}).state,changed);
let invalid=JSON.parse(JSON.stringify(old));invalid.actions=2;const minorId=invalid.life.people.player.family.children.find(child=>child!==id);
assert.equal(C.apply(invalid,{type:'heirDesignate',person:minorId}).state,invalid);
assert.equal(C.apply(invalid,{type:'heirDesignate',person:'story-yun'}).state,invalid);
// Follow another adopted child into a third controlled generation, without remapping anyone's family IDs.
let third=JSON.parse(JSON.stringify(old));third.cash=5000;third.politics.nextDay=5000;third.actions=2;third.eventQueue=[];
third=decide(third,{type:'familyChild',method:'adoption',name:'다온',childAge:16});const next= L.player(third).family.children[0];assert.deepEqual(third.life.people[next].family.parents,[id]);
third=C.apply(third,{type:'lifePass',days:365,routine:'work'}).state;third=C.apply(third,{type:'lifePass',days:365,routine:'work'}).state;assert(third.eventQueue.some(event=>event.familyReport));third=C.apply(third,{type:'acknowledge'}).state;
assert.equal(third.life.people[next].occupation,'unemployed');third.actions=2;third=C.apply(third,{type:'heirDesignate',person:next}).state;third=decide(third,{type:'heirRetire',share:0},'continue');
assert.equal(L.activeId(third),next);assert.equal(third.life.generation,3);assert.equal(third.cash,0);assert.equal(third.career,'unemployed');assert.equal(third.life.succession.history.length,2);
assert.deepEqual(L.player(third).family.parents,[id]);assert(third.life.people[id].family.children.includes(next));assert(third.life.people.player.family.children.includes(id));
third.actions=2;assert.equal(C.apply(third,{type:'work'}).state,third);third=C.apply(third,{type:'applyJob',career:'worker'}).state;assert.equal(third.career,'worker');assert.equal(L.activeId(third),next);
assert(!C.family.eligiblePartner(third,third.life.people.player));
console.log('미성년/비자녀 차단·의무/빚 회피 차단·금액 변경 재확인·3세대 연결·부모/조부모 보존·0% 인계와 구직 시작·새 직업 선택 통과');

// An empty party's funds are settled publicly, never added to the gift.
let sole=JSON.parse(JSON.stringify(old));sole.life.activeId='player';sole.life.people.player.source='player';sole.life.people[id].source='resident';sole.name='가람';sole.age=52;sole.cash=1000;sole.actions=2;sole.life.succession.heir=id;sole.parties.membership='civic';sole.parties.registry.civic.members={player:{name:'가람'}};sole.parties.registry.civic.leader='player';
const soleBudget=sole.treasury,soleParty=sole.parties.registry.civic.funds;sole=decide(sole,{type:'heirRetire',share:100},'continue');assert(!sole.parties.registry.civic);assert.equal(sole.treasury,soleBudget+soleParty);assert.equal(sole.cash,1000+old.life.people[id].wealth);assert.equal(sole.life.people.player.wealth,0);
// Per-person ballot locks and memories don't silently become the next actor's history.
let actor=JSON.parse(JSON.stringify(old));actor.parties.ballots=[{partyId:'civic',kind:'leadership',round:actor.politics.round,actor:'player'}];assert(!C.parties.contested(actor,'civic','leadership'));actor.parties.ballots[0].actor=id;assert(C.parties.contested(actor,'civic','leadership'));
let blame=JSON.parse(JSON.stringify(serialized));blame.eventQueue=[];blame.actions=2;
const prior=blame.election;C.council.seatElection(blame,prior);for(const member of blame.council.chamber.members)member.relationship=85;
blame=C.normalize(blame);const representative=blame.council.chamber.members[0];
blame.council.bills=[{id:'old-promise',actor:'player',round:1,status:'rejected',policy:'housing',amendments:[{member:representative.id,cost:2}],ballots:[]}];
blame=decide(blame,{type:'heirRetire',share:50},'continue');assert.equal(blame.council.people[representative.id].relationship,45);
blame.day=1480;blame.election={...prior,round:2,day:1480};C.council.seatElection(blame,blame.election);
assert.equal(blame.council.people[representative.id].relationship,45);assert.equal(blame.life.people['council:'+representative.id].relations.player,77);
assert.equal(blame.council.people[representative.id].career.find(record=>record.type==='unfulfilled').actor,'player');
console.log('빈 정당 자금 공적 정산·조작 인물별 경선 제한·선대 미이행의 기억/관계 귀속 분리 통과');

let withdrew=JSON.parse(JSON.stringify(serialized));withdrew.eventQueue=[];withdrew.actions=2;withdrew.pacts.agreements.push({id:'signed-obligation',status:'signed',round:withdrew.politics.round,party:'civic',target:'labor',targetName:'생활노동연대',policy:'housing'});const beforeWithdrawal=withdrew.support;withdrew=C.apply(withdrew,{type:'pactBreak',pact:'signed-obligation'}).state;assert.equal(withdrew.support,beforeWithdrawal-8);assert.equal(withdrew.pacts.agreements.find(pact=>pact.id==='signed-obligation').status,'broken');withdrew=C.apply(withdrew,{type:'acknowledge'}).state;assert.equal(S.blocked(withdrew),'');

let ownMarriage=JSON.parse(JSON.stringify(serialized));ownMarriage.eventQueue=[];ownMarriage.actions=2;const spouseId='resident-0';const inheritor=ownMarriage.life.people[id],spouse=ownMarriage.life.people[spouseId];inheritor.family={...inheritor.family,status:'married',partner:spouseId,sharedHome:true};spouse.family={...spouse.family,status:'married',partner:id,sharedHome:true};inheritor.society.ties[spouseId]={bond:92,metDay:100};spouse.society.ties[id]={bond:92,metDay:100};ownMarriage=decide(ownMarriage,{type:'heirRetire',share:50},'continue');assert.equal(C.family.partner(ownMarriage).id,spouseId);assert.equal(ownMarriage.life.people[spouseId].relationship,92);assert.equal(C.life.rent(ownMarriage,C.life.player(ownMarriage)),6);

let ongoing=JSON.parse(JSON.stringify(serialized));ongoing.eventQueue=[];ongoing.actions=2;ongoing.life.people[id].society.training={target:'medic',skill:'care',dueDay:ongoing.day+180};ongoing.life.people.player.society.training={target:'trader',skill:'commerce',dueDay:ongoing.day+200};ongoing=decide(ongoing,{type:'heirRetire',share:50},'continue');assert.equal(ongoing.life.people.player.society.training,null);ongoing=C.apply(ongoing,{type:'lifePass',days:365,routine:'work'}).state;assert.equal(ongoing.skills.care,1);assert.equal(ongoing.career,'apprentice');
