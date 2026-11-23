'use strict';
(function(root){
  const paths={craft:'기술 교육',administration:'문서·교육',care:'돌봄 교육',commerce:'상업 교육'};
  const activeId=state=>state.life.activeId||'player';
  const currentPlayer=state=>state.life.people[activeId(state)];
  function fresh(){return {pending:[],nextChild:1,nextOffer:1};}
  function links(p){return {status:'unset',partner:null,children:[],parents:[],...p.family};}
  function restore(state){
    state.life.family={...fresh(),...state.life.family,pending:[...(state.life.family?.pending||[])]};
    for(const p of Object.values(state.life.people))p.family=links(p);
  }
  function log(p,day,text){p.history.push({day,type:'family',text});}
  function adult(p){return p&&p.age>=18;}
  function partner(state){const id=currentPlayer(state).family.partner;return id?state.life.people[id]:null;}
  function relatives(state,a,b){
    const ancestors=p=>{
      const found=new Set(),pending=[...p.family.parents];
      while(pending.length){const id=pending.pop();if(found.has(id))continue;found.add(id);pending.push(...(state.life.people[id]?.family.parents||[]));}
      return found;
    };
    const left=ancestors(a),right=ancestors(b);
    return left.has(b.id)||right.has(a.id)||[...left].some(id=>right.has(id));
  }
  function firstContact(state,p){return p.history.find(item=>item.type==='relationship'&&(item.actor??'player')===activeId(state))?.day??p.society?.ties[activeId(state)]?.metDay;}
  function eligiblePartner(state,p){
    const player=currentPlayer(state);
    return adult(player)&&adult(p)&&p.source==='resident'&&!p.family.partner&&!player.family.partner&&!relatives(state,player,p)&&p.relationship>=70&&state.day-(firstContact(state,p)??state.day)>=30;
  }
  function context(state,event){
    const offer=event.familyOffer;const player=currentPlayer(state);
    const p=offer.person?state.life.people[offer.person]:null;
    let valid=state.startConfigured&&!state.hearing&&!state.underReview;
    if(offer.type==='date')valid=valid&&eligiblePartner(state,p);
    if(offer.type==='marry')valid=valid&&adult(player)&&adult(p)&&player.family.partner===p?.id&&p.family.partner===activeId(state)&&player.family.status==='dating'&&p.relationship>=80&&state.day-player.family.since>=90&&state.cash>=12;
    if(['birth','adoption'].includes(offer.type)){
      valid=valid&&adult(player)&&state.cash>=20&&!state.life.family.pending.some(plan=>plan.parents.includes(activeId(state)));
      if(offer.partner)valid=valid&&player.family.partner===offer.partner&&state.life.people[offer.partner]?.family.partner===activeId(state)&&state.life.people[offer.partner].relationship>=80;
      if(offer.type==='birth')valid=valid&&Boolean(offer.partner)&&player.family.status==='married'&&player.health>=40&&state.life.people[offer.partner]?.health>=40;
    }
    return {offer,player,p,valid};
  }
  function choices(state,event){const {valid}=context(state,event);return [
    {id:'accept',title:'서로 동의한 계획을 진행한다',detail:event.familyOffer.detail,disabled:!valid},
    {id:'wait',title:'지금은 결정하지 않겠다',detail:'관계와 돈 유지 · 강제로 진행하지 않음',disabled:false}
  ];}
  function reply(event,id){return {reply:id==='accept'?'이 선택과 책임에 동의합니다.':'지금은 결정을 미루겠습니다.',speaker:event.familyOffer.speaker,reaction:id==='accept'?'합의한 관계와 돌봄 계획을 기록하겠습니다.':'알겠습니다. 준비되었을 때 다시 이야기합시다.'};}
  function createChild(state,plan,day=state.day){
    while(Object.hasOwn(state.life.people,'child-'+state.life.family.nextChild))state.life.family.nextChild++;
    const id='child-'+state.life.family.nextChild++;
    const age=plan.childAge;
    const child={id,name:plan.name,source:'family',baseAge:age,ageDay:day,age,gender:'unspecified',health:90,wealth:0,relationship:60,
      occupation:age>=6?'student':'child',jobTitle:age>=6?'학교에 다니는 아이':'보호받는 아이',rank:0,since:day,skills:{},history:[],lastDay:day,
      family:{status:'dependent',partner:null,parents:[...plan.parents],children:[],joinedDay:day,method:plan.type,sharedCare:Boolean(plan.sharedCare)},education:{path:null,years:0}};
    state.life.people[id]=child;
    for(const parentId of plan.parents){const parent=state.life.people[parentId];if(!parent)continue;parent.family.children.push(id);log(parent,day,plan.name+'을 가족으로 맞이했다. '+(plan.type==='birth'?'출생':'입양')+' · 돌봄 책임을 함께 기록');}
    log(child,day,(plan.type==='birth'?'출생':'입양으로 가족에 합류')+' · 보호자 '+plan.parents.map(id=>state.life.people[id]?.name||id).join(' · '));
    return child;
  }
  function resolve(state,event,id){
    if(id==='wait')return '가족에 관한 결정을 미뤘다. 돈과 가족 관계를 바꾸지 않았다.';
    const {offer,player,p,valid}=context(state,event);
    if(!valid)return '조건이 바뀌어 가족 계획을 진행하지 않았다.';
    if(offer.type==='date'){
      player.family={...player.family,status:'dating',partner:p.id,since:state.day};p.family={...p.family,status:'dating',partner:activeId(state),since:state.day};
      log(player,state.day,p.name+'과 서로 동의해 연인 관계를 시작했다.');log(p,state.day,player.name+'과 서로 동의해 연인 관계를 시작했다.');
      return p.name+'과 연인 관계를 시작했다. 성별로 관계나 출산 역할을 자동 지정하지 않는다.';
    }
    if(offer.type==='marry'){
      state.cash-=12;player.family.status='married';p.family.status='married';
      log(player,state.day,p.name+'과 혼인했다. 개인 재산과 직업은 별도로 유지');log(p,state.day,player.name+'과 혼인했다.');
      return p.name+'과 혼인했다. 준비비 12를 사용했고 서로의 돈과 직업은 합치지 않았다.';
    }
    state.cash-=20;
    const plan={type:offer.type,name:offer.name,childAge:offer.childAge,parents:[activeId(state),...(offer.partner?[offer.partner]:[])],createdDay:state.day};
    if(offer.type==='adoption'){createChild(state,plan);return offer.name+'을 입양해 가족으로 맞이했다. 준비비 20 · 성년 전까지 돌봄비 하루 2.';}
    state.life.family.pending.push({...plan,dueDay:state.day+270});
    log(player,state.day,offer.name+'을 맞이할 출생·돌봄 계획에 합의했다. '+(state.day+270)+'일 예정');
    log(state.life.people[offer.partner],state.day,offer.name+'을 맞이할 출생·돌봄 계획에 합의했다.');
    return '준비비 20으로 출생·돌봄 계획을 세웠다. 270일 뒤 가족 합류 소식에 멈춘다. 생물학적 부모나 임신 역할은 성별로 추정하지 않는다.';
  }
  function offer(state,data,title,lines){
    state.eventQueue.push({id:'family-offer-'+state.life.family.nextOffer++,day:state.day,scene:'hearing',familyReport:true,familyOffer:data,title,text:data.detail,destination:'people',dialogue:lines.map(text=>({speaker:data.speaker,text}))});
    state.actions--;state.energy-=5;return {ok:true,message:'가족에 관한 대화를 시작했다. 사건창에서 진행 여부를 직접 결정하자.'};
  }
  function act(state,action){
    if(!['familyDate','familyMarry','familySeparate','familyChild','familyEducate','familySingle','familySupport'].includes(action.type))return null;
    const fail=message=>({ok:false,message});
    if(!state.startConfigured||!state.actions||state.energy<5||state.hearing||state.underReview||state.eventQueue.length)return fail('진행 중인 사건 · 행동 1 · 기력 5 · 심사 상태를 확인하자.');
    const player=currentPlayer(state);const spouse=partner(state);
    if(action.type==='familySupport'){
      const relative=Object.hasOwn(state.life.people,action.person)?state.life.people[action.person]:null;
      if(!relative||relative.id===activeId(state)||(!player.family.parents.includes(relative.id)&&!player.family.children.includes(relative.id))||state.cash<10||relative.family.supportDay===state.day)return fail('직계 가족 · 개인 돈 10 · 오늘의 지원 여부를 확인하자.');
      state.cash-=10;relative.wealth+=10;relative.family.supportDay=state.day;state.actions--;state.energy-=5;
      log(player,state.day,relative.name+'에게 생활비 10을 지원했다.');log(relative,state.day,player.name+'에게 생활비 10을 지원받았다.');
      return {ok:true,message:relative.name+'에게 개인 돈 10을 보냈다. 공금과 당 자금은 사용하지 않았다.'};
    }
    if(action.type==='familySingle'){
      if(player.family.partner)return fail('현재 관계를 먼저 정리하자.');
      if(player.family.status==='single')return fail('현재 이미 배우자 없이 살고 있다.');
      player.family.status='single';log(player,state.day,'현재 배우자 없이 살아가기로 했다. 자녀와 돌봄 관계는 유지');state.actions--;state.energy-=5;
      return {ok:true,message:'현재 배우자 없이 살아간다. 나중에 관계를 선택할 수 있고 기존 자녀 관계는 유지된다.'};
    }
    if(action.type==='familyDate'){
      const p=Object.hasOwn(state.life.people,action.person)?state.life.people[action.person]:null;
      if(!eligiblePartner(state,p))return fail('성인 일반 주민 · 개인 관계 70 · 첫 안부 이후 30일 · 서로 기존 파트너나 가까운 가족 관계가 없어야 한다.');
      if(p.family.talkDay!=null&&state.day-p.family.talkDay<30)return fail('같은 인물에게는 30일 뒤 다시 제안할 수 있다.');
      p.family.talkDay=state.day;
      return offer(state,{type:'date',person:p.id,speaker:p.name,detail:'서로 연인 관계를 시작 · 돈과 직업은 각자 유지'},p.name+'과 관계를 이야기한다',['함께한 시간을 돌아봤습니다. 서로 연인 관계를 시작할 준비가 됐어요.','당신도 같은 마음인지 직접 말해 주세요. 지금 결정하지 않아도 됩니다.']);
    }
    if(action.type==='familyMarry'){
      if(!spouse||player.family.status!=='dating'||spouse.relationship<80||state.day-player.family.since<90||state.cash<12||!adult(player)||!adult(spouse))return fail('연인 관계 90일 · 개인 관계 80 · 성인 · 준비비 12가 필요하다.');
      return offer(state,{type:'marry',person:spouse.id,speaker:spouse.name,detail:'혼인 준비비 개인 돈 12 · 각자의 직업·재산 유지'},'함께 살아갈 약속',['관계를 이어 온 시간을 생각해 봤어요. 혼인해 가족으로 살아가고 싶습니다.','직업과 개인 재산은 각자 유지하고, 자녀를 맞을지는 별도로 함께 결정해요.']);
    }
    if(action.type==='familySeparate'){
      if(!spouse)return fail('현재 파트너가 없다.');
      const name=spouse.name;player.family.status='single';player.family.partner=null;player.family.sharedHome=false;spouse.family.status='single';spouse.family.partner=null;spouse.family.sharedHome=false;spouse.relationship=Math.max(0,spouse.relationship-15);
      log(player,state.day,name+'과 관계를 정리했다. 자녀·돌봄 관계와 이전 기록은 유지');log(spouse,state.day,player.name+'과 관계를 정리했다.');
      state.actions--;state.energy-=5;return {ok:true,message:name+'과 관계를 정리했다. 개인 관계 −15 · 자녀·돌봄 계획과 과거 기록은 유지된다. 재산을 강제로 가져오지 않는다.'};
    }
    if(action.type==='familyChild'){
      const name=String(action.name||'').trim();const type=action.method;
      const childAge=type==='birth'?0:action.childAge;
      if(!adult(player)||!['birth','adoption'].includes(type)||name.length<1||name.length>18||!Number.isInteger(childAge)||childAge<0||childAge>16||state.cash<20||state.life.family.pending.some(plan=>plan.parents.includes(activeId(state))))return fail('성인 · 이름 1~18자 · 입양 나이 0~16세 · 준비비 20 · 진행 중인 출생 계획을 확인하자.');
      if(spouse&&spouse.relationship<80)return fail('함께 돌볼 파트너의 개인 관계 80과 동의가 필요하다.');
      if(type==='birth'&&(!spouse||player.family.status!=='married'||player.health<40||spouse.health<40))return fail('혼인한 파트너 · 양쪽 건강 40이 필요하다.');
      return offer(state,{type,name,childAge,partner:spouse?.id||null,speaker:spouse?.name||'돌봄 담당자',detail:type==='birth'?'개인 돈 20 · 270일 뒤 가족 합류 · 이후 미성년 돌봄비 하루 2':'개인 돈 20 · '+childAge+'세 자녀 합류 · 성년 전 돌봄비 하루 2'},type==='birth'?'새 가족을 맞이할 계획':'함께 살아갈 가족을 맞이한다',[type==='birth'?'새 가족을 맞이하는 일과 돌봄 책임을 함께 결정합시다. 출생 과정과 생물학적 역할은 현재 추상화합니다.':'준비된 돌봄 환경에서 아이를 가족으로 맞이할지 직접 결정합시다.',name+'의 이름과 나이, 앞으로의 생활비를 확인해 주세요. 자동 상속이나 후계자 승계까지 처리하는 단계는 아닙니다.']);
    }
    const child=Object.hasOwn(state.life.people,action.person)?state.life.people[action.person]:null;
    if(!child||!child.family.parents.includes(activeId(state))||child.age<6||child.age>=18||!Object.hasOwn(paths,action.path)||state.cash<12||state.day-(child.education?.supportDay??-365)<365)return fail('6~17세 자녀 · 교육 분야 · 개인 돈 12 · 365일 간격의 교육 지원 여부를 확인하자.');
    child.education={path:action.path,years:(child.education?.years||0)+1,year:Math.floor((state.day-1)/365),supportDay:state.day};
    state.cash-=12;state.actions--;state.energy-=5;log(child,state.day,paths[action.path]+' 지원을 받았다. 성년 진로에 반영');log(player,state.day,child.name+'의 '+paths[action.path]+'을 지원했다. 개인 돈 12');
    return {ok:true,message:child.name+'의 '+paths[action.path]+'을 지원했다. 365일 이내에 중복 지원할 수 없고 성년 진로에 반영된다.'};
  }
  function tick(state,day){
    restore(state);
    const due=state.life.family.pending.filter(plan=>plan.dueDay<=day);
    state.life.family.pending=state.life.family.pending.filter(plan=>plan.dueDay>day);
    for(const plan of due){
      const child=createChild(state,plan,day);
      state.life.news.unshift({day,person:child.id,text:child.name+'이 '+plan.parents.map(id=>state.life.people[id]?.name||id).join(' · ')+'의 가족으로 합류했다.'});
      if(!plan.autonomous||plan.parents.includes(activeId(state)))state.eventQueue.push({id:'family-arrival-'+child.id,day,scene:'hearing',familyReport:true,title:'새 가족을 맞이했다',text:child.name+'이 가족으로 합류했다. 미성년 돌봄비 하루 2가 적용된다.',destination:'people',dialogue:[{speaker:'돌봄 담당자',text:child.name+'이 가족으로 합류했습니다. 기존 인물과 같은 생애 명부에서 성장과 건강을 기록합니다.'},{speaker:'돌봄 담당자',text:'돌봄과 교육을 선택할 수 있습니다. 성년이 되어도 부모·자녀 관계와 기록은 이어집니다.'}]});
    }
    for(const child of Object.values(state.life.people)){
      if(child.source!=='family'||child.lastDay>=day)continue;
      const oldAge=child.age;child.age=child.baseAge+Math.max(0,Math.floor((day-child.ageDay)/365));child.lastDay=day;
      if(child.age!==oldAge)log(child,day,child.age+'세가 됐다.');
      if(child.age>=18){
        const path=child.education?.path,trained=(child.education?.years||0)>=2;
        child.source='resident';child.occupation=trained?({craft:'apprentice',administration:'clerk',care:'medic',commerce:'worker'}[path]||'unemployed'):'unemployed';
        child.jobTitle={apprentice:'공장 견습',clerk:'서기',medic:'진료소 보조',worker:'항구 노동자',unemployed:'구직 중'}[child.occupation];child.since=day;
        child.firstOccupation=child.occupation;child.family.status='single';child.goal={craft:'artisan',administration:'teacher',care:'medic',commerce:'trader'}[path]||'worker';
        log(child,day,'성년이 되어 '+child.jobTitle+' 생활을 시작했다. 부모·자녀 관계는 유지');
        if(child.family.parents.includes(activeId(state)))state.eventQueue.push({id:'family-adult-'+child.id,day,scene:'hearing',familyReport:true,title:child.name+'의 새로운 출발',text:'교육과 성장 기록에 따라 '+child.jobTitle+' 생활을 시작한다.',destination:'people',dialogue:[{speaker:child.name,text:'성년이 됐어요. 지금까지의 관계와 배운 것을 가지고 제 생활을 시작하겠습니다.'}]});
        continue;
      }
      if(child.age>=6&&child.occupation!=='student'){child.occupation='student';child.jobTitle='학교에 다니는 아이';log(child,day,'학교 생활을 시작했다.');}
      if(child.family.sharedCare){
        for(const id of child.family.parents){const guardian=state.life.people[id];if(!guardian)continue;const fee=2/child.family.parents.length;if(id===activeId(state))state.cash-=fee;else guardian.wealth-=fee;}
        const funds=child.family.parents.reduce((sum,id)=>sum+(id===activeId(state)?state.cash:state.life.people[id]?.wealth??0),0);
        child.health=Math.max(0,Math.min(100,child.health+(funds>=0?1:-1)));continue;
      }
      const guardian=state.life.people[child.family.parents[0]];
      if(guardian?.id===activeId(state))state.cash-=2;else if(guardian)guardian.wealth-=2;
      const funds=guardian?.id===activeId(state)?state.cash:guardian?.wealth??0;
      child.health=Math.max(0,Math.min(100,child.health+(funds>=0?1:-1)));
    }
  }
  const api={fresh,paths,restore,partner,eligiblePartner,choices,reply,resolve,act,tick};
  if(typeof module!=='undefined')module.exports=api;
  root.Family=api;
})(globalThis);
