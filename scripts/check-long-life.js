'use strict';
const assert=require('node:assert/strict');const C=require('../campaign');
function ready(){const s=C.normalize({...C.fresh(),name:'가람',age:30,ageChosen:true,profileSet:true,startConfigured:true,day:100,cash:10000,energy:100,built:'long',flooded:0,jobStory:{stage:'complete',wageBonus:0,outcome:null},election:{day:20,round:1,won:false,winner:'소라'}});s.life.clock.mode='lifetime';s.politics.round=2;s.politics.nextDay=50000;s.randomState.lastDay=100000;return s;}
const initial=ready(),unchanged=JSON.stringify(initial);let manual=JSON.parse(unchanged);
for(let index=0;index<90;index++){
 if([1,3,5].includes(manual.day%7)&&manual.energy>=20)manual=C.apply(manual,{type:'work'}).state;
 else if(manual.energy<70)manual=C.apply(manual,{type:'rest'}).state;
 manual=C.apply(manual,{type:'advance'}).state;
}
const compressed=C.apply(initial,{type:'lifePass',days:90,routine:'work'}).state;
assert.equal(JSON.stringify(initial),unchanged);assert.equal(compressed.cash,manual.cash);assert.equal(compressed.energy,manual.energy);
for(const p of Object.values(compressed.life.people).filter(p=>p.id!==C.life.activeId(compressed))){assert.deepEqual(p,manual.life.people[p.id]);}
let world=ready();const start=Date.now();
for(let year=1;year<=12;year++){
 const before=JSON.stringify(world),target=world.day+365;const next=C.apply(world,{type:'lifePass',days:365,routine:'work'}).state;
 assert.equal(JSON.stringify(world),before);world=next;assert.equal(world.day,target);assert.equal(world.eventQueue.length,0);assert.equal(world.life.clock.plan,null);
 for(const person of Object.values(world.life.people)){
  assert(Number.isFinite(person.wealth));assert(Number.isFinite(person.health));assert(person.age>=0);
  if(person.family.partner)assert.equal(world.life.people[person.family.partner].family.partner,person.id);
  for(const id of person.family.parents)assert(world.life.people[id]);
 }
}
const people=Object.values(world.life.people);assert.equal(C.life.player(world).age,42);assert(people.some(p=>p.family.autonomous));assert(people.some(p=>p.family.sharedCare));
const bytes=Buffer.byteLength(JSON.stringify(world));assert(bytes<4*1024*1024);
console.log('90일 수동/압축 주민 상태 일치·입력 저장 불변·12년 가족/돈/나이/중복 없는 진행 통과 ('+people.length+'명, '+Math.round(bytes/1024)+'KiB, '+(Date.now()-start)+'ms)');
