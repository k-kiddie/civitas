'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');const S=C.society;
function ready(){const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:1000,energy:100,built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=5000;s.randomState.lastDay=100000;return s;}
function npc(s,index=0){return s.life.people['resident-'+index];}
function quiet(s){for(const p of Object.values(s.life.people)){p.society.nextReview=10000;p.society.socialDay=s.day;}return s;}
const noCareer=()=>assert.fail('unexpected career change');
let s=quiet(ready()),p=npc(s);p.goal='worker';p.wealth=200;p.society.aspiration='medic';p.society.ambition=85;p.society.security=30;p.society.independence=80;p.society.nextReview=100;
const publicMoney=s.cash;S.tick(s,100,noCareer);assert.equal(p.wealth,190);assert.equal(p.society.training.target,'medic');assert.equal(p.society.training.dueDay,280);assert.equal(s.cash,publicMoney);
const once=JSON.stringify(s.life);S.tick(s,100,noCareer);assert.equal(JSON.stringify(s.life),once);
s.day=280;C.life.tick(s);assert.equal(p.occupation,'medic');assert(p.skills.care>=12);
let stable=quiet(ready()),careful=npc(stable);careful.wealth=200;careful.goal='worker';careful.society.aspiration='medic';careful.society.ambition=30;careful.society.security=85;careful.society.independence=30;careful.society.nextReview=100;
S.tick(stable,100,noCareer);assert.equal(careful.society.decisions[0].chosen,'stay');assert.equal(careful.wealth,200);
let migrate=quiet(ready()),farmer=npc(migrate,1);farmer.district=1;farmer.wealth=100;farmer.society.nextReview=100;farmer.society.security=85;farmer.society.ambition=30;migrate.flooded=18;
S.tick(migrate,100,noCareer);assert.equal(farmer.district,0);assert.equal(farmer.wealth,94);assert.equal(migrate.cash,1000);
let capital=quiet(ready()),shop=npc(capital);shop.goal='worker';shop.wealth=4;shop.society.training={target:'trader',skill:'commerce',dueDay:101};shop.society.nextReview=10000;
capital.day=101;C.life.tick(capital);assert.notEqual(shop.occupation,'trader');assert(shop.society.training);shop.wealth=100;capital.day=192;C.life.tick(capital);assert.equal(shop.occupation,'trader');assert(shop.skills.commerce>=12);
let inherited=quiet(ready());const owner=C.life.player(inherited);owner.society.training={target:'medic',skill:'care',dueDay:101};inherited.day=101;C.life.tick(inherited);assert.equal(inherited.skills.care,1);assert.equal(inherited.career,'worker');assert.equal(owner.society.training,null);
assert.deepEqual(C.normalize(inherited).life,C.normalize(C.normalize(inherited)).life);
console.log('고정 성향 저장·도전/안정에 따른 다른 선택·자기 돈 재교육·직업 전환·창업 자금·이주·동일 날 중복 차단·조작 인물 교육 완료/전직 선택 보존 통과');

let peers=quiet(ready()),a=npc(peers),b=npc(peers,12);a.district=0;b.district=0;a.wealth=500;b.wealth=500;a.society.familyDesire=85;b.society.familyDesire=85;
a.society.ties[b.id]={bond:90,metDay:100};b.society.ties[a.id]={bond:90,metDay:100};a.society.socialDay=400;b.society.socialDay=400;
S.tick(peers,500,noCareer);assert.equal(a.family.partner,b.id);assert.equal(b.family.partner,a.id);assert.equal(a.family.status,'dating');
S.tick(peers,700,noCareer);assert.equal(a.family.status,'married');assert.equal(b.family.status,'married');assert.equal(a.wealth,494);assert.equal(b.wealth,494);assert.equal(S.rent(peers,a),6);assert.equal(peers.cash,1000);
S.tick(peers,1100,noCareer);assert.equal(peers.life.family.pending.length,1);assert.equal(a.wealth,484);assert.equal(b.wealth,484);assert(peers.life.family.pending[0].autonomous);
const due=peers.life.family.pending[0].dueDay;peers.day=due;C.family.tick(peers,due);
const baby=Object.values(peers.life.people).find(person=>person.source==='family');assert(baby);assert.deepEqual(baby.family.parents,[a.id,b.id]);assert.equal(peers.eventQueue.length,0);assert.equal(peers.cash,1000);assert.equal(baby.wealth,0);
C.family.tick(peers,due+1);assert.equal(a.wealth,483);assert.equal(b.wealth,483);assert.equal(peers.cash,1000);assert.equal(baby.wealth,0);
const frozen=JSON.parse(JSON.stringify(peers));assert.deepEqual(C.normalize(frozen).life,C.normalize(C.normalize(frozen)).life);
let protectedPair=quiet(ready()),taken=npc(protectedPair),friend=npc(protectedPair,12);taken.family.partner='player';taken.family.status='dating';C.life.player(protectedPair).family.partner=taken.id;
taken.society.socialDay=400;friend.society.socialDay=400;taken.society.familyDesire=85;friend.society.familyDesire=85;taken.society.ties[friend.id]={bond:100,metDay:100};friend.society.ties[taken.id]={bond:100,metDay:100};S.tick(protectedPair,500,noCareer);assert.equal(taken.family.partner,'player');assert.equal(friend.family.partner,null);
friend.family.parents=[taken.id];assert(S.kin(protectedPair,taken,friend));
console.log('NPC끼리 만남/연인/혼인·준비비/집세·자율 돌봄 계획·비지인 출생은 소식 처리·NPC 공동 돌봄비·미성년 수입 없음·플레이어 관계와 친족 보호·저장 보존 통과');

function reunion(kind='career'){
 const state=quiet(ready()),person=npc(state);person.occupation='artisan';person.jobTitle='정비공';person.relationship=70;person.wealth=100;person.history.push({day:1,type:'relationship',actor:'player',text:'안부와 취업 도움'});
 state.life.society.pending.push({person:person.id,actor:'player',from:'worker',to:'artisan',target:kind==='aspiration'?'medic':undefined,kind,day:50,readyDay:100});
 if(kind==='aspiration'){person.family.parents=['player'];C.life.player(state).family.children.push(person.id);person.society.training={target:'medic',skill:'care',dueDay:280};}
 S.tick(state,100,noCareer);assert(state.eventQueue[0]?.reunion);return {state,person:person.id};
}
let offer=reunion();let event=offer.state.eventQueue[0];assert(C.eventChoices(offer.state,event).find(item=>item.id==='job').disabled);
const copied=JSON.parse(JSON.stringify(offer.state));let paid=C.apply(offer.state,{type:'eventChoice',eventId:event.id,choice:'trial'}).state;
assert.equal(paid.cash,1012);assert.equal(paid.life.people[offer.person].wealth,88);assert.equal(paid.cash+paid.life.people[offer.person].wealth,1100);assert.equal(C.apply(paid,{type:'eventChoice',eventId:event.id,choice:'trial'}).state,paid);
assert.deepEqual(C.apply(copied,{type:'eventChoice',eventId:event.id,choice:'trial'}).state.life,paid.life);
offer=reunion();event=offer.state.eventQueue[0];let learned=C.apply(offer.state,{type:'eventChoice',eventId:event.id,choice:'learn'}).state;assert.equal(learned.skills.craft,1);assert.equal(learned.cash,992);assert.equal(learned.life.people[offer.person].wealth,108);
offer=reunion();offer.state.skills.craft=1;event=offer.state.eventQueue[0];let hired=C.apply(offer.state,{type:'eventChoice',eventId:event.id,choice:'job'}).state;assert.equal(hired.career,'artisan');assert(hired.life.people.player.history.some(item=>item.text.includes('정비공')));
offer=reunion();event=offer.state.eventQueue[0];offer.state.life.activeId=offer.person;assert(C.eventChoices(offer.state,event).find(item=>item.id==='trial').disabled);const before=offer.state.cash;assert.equal(S.resolve(offer.state,event,'talk'),'상황이 달라져 재회를 마쳤다. 과거의 기록은 유지된다.');assert.equal(offer.state.cash,before);
for(const choice of ['respect','support','discuss']){
 const {state,person}=reunion('aspiration');const ev=state.eventQueue[0];const result=C.apply(state,{type:'eventChoice',eventId:ev.id,choice}).state;
 assert.equal(result.life.people[person].society.training.target,'medic');assert.equal(result.life.people[person].relationship,choice==='discuss'?66:76);
 if(choice==='support'){assert.equal(result.cash,988);assert.equal(result.life.people[person].wealth,112);assert.equal(result.life.people[person].society.training.dueDay,250);}
}
const old=ready();delete old.life.society;for(const person of Object.values(old.life.people))delete person.society;const migrated=C.normalize(old);assert(!old.life.society);assert.equal(migrated.eventQueue.length,0);assert.deepEqual(C.normalize(migrated).life,migrated.life);
console.log('재회 채용/공동 일/교육/안부·기술 자격·NPC와 돈 보존·중복/재추첨 차단·세대별 인연 분리·성년 자녀 존중/지원/이견과 자기 계획 유지·구형 저장 통과');

let reluctant=quiet(ready()),conservative=npc(reluctant);conservative.goal='trader';conservative.skills.commerce=12;conservative.wealth=200;conservative.society.aspiration='trader';conservative.society.ambition=30;conservative.society.security=85;conservative.society.independence=30;conservative.society.nextReview=101;reluctant.day=200;C.life.tick(reluctant);assert.equal(conservative.occupation,'worker');
let promotion=quiet(ready()),ambitious=npc(promotion);ambitious.wealth=200;ambitious.skills.commerce=12;ambitious.society.aspiration='trader';ambitious.society.ambition=85;ambitious.society.security=30;ambitious.society.nextReview=101;promotion.day=101;C.life.tick(promotion);assert.equal(ambitious.occupation,'trader');assert(ambitious.society.decisions.some(item=>item.chosen==='advance'));
