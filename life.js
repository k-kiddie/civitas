'use strict';
(function(root){
  const succession=typeof module!=='undefined'?require('./succession'):root.Succession;
  const family=typeof module!=='undefined'?require('./family'):root.Family;
  const jobs={worker:'항구 노동자',farmer:'농장 일꾼',apprentice:'공장 견습',clerk:'서기',artisan:'정비공',trader:'시장 상인',teacher:'야학 교사',medic:'진료소 보조',journalist:'신문 기자',guard:'순찰대원',soldier:'군인',official:'행정 공무원',unemployed:'구직 중',retired:'은퇴 생활',councillor:'지역 의원'};
  const income={worker:5,farmer:5,apprentice:5,clerk:6,artisan:7,trader:8,teacher:5,medic:5,journalist:6,guard:6,soldier:6,official:6,unemployed:0,retired:5,councillor:7};
  const copy=value=>JSON.parse(JSON.stringify(value));
  const activeId=state=>state.life.activeId||'player';
  const currentPlayer=state=>state.life.people[activeId(state)];
  function fresh(){return {activeId:'player',people:{},lastDay:null,seeded:false,news:[],clock:{mode:'daily',plan:null}};}
  function age(person,day){return person.baseAge==null?null:person.baseAge+Math.max(0,Math.floor((day-person.ageDay)/365));}
  function calendar(day){const offset=(day-1)%365;return (Math.floor((day-1)/365)+1)+'년 '+['봄','여름','가을','겨울'][Math.min(3,Math.floor(offset/91))]+' '+(offset-Math.min(3,Math.floor(offset/91))*91+1)+'일';}
  function entry(person,day,type,text){person.history.push({day,type,text});}
  function person(id,name,occupation,source,day,baseAge=30){
    return {id,name,source,baseAge,ageDay:day,age:baseAge,gender:'unspecified',health:85,wealth:40,relationship:45,occupation,jobTitle:jobs[occupation]||occupation,rank:0,since:day,skills:{},family:{status:'unset'},history:[],lastDay:day};
  }
  function changeJob(p,job,day,reason,title=jobs[job]||job){
    const previous=p.jobTitle;p.occupation=job;p.jobTitle=title;p.since=day;p.rank=0;
    entry(p,day,'career',previous+' → '+title+' · '+reason);
  }
  function seedResidents(state){
    if(state.life.seeded||!state.startConfigured)return;
    state.life.seeded=true;
    let random=(state.randomState?.seed||0x61c1a5)>>>0;
    const draw=max=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return Math.floor(random/4294967296*max);};
    const occupations=['worker','farmer','apprentice','clerk','soldier','trader','teacher','medic','journalist','artisan','guard','unemployed','worker','farmer','apprentice','clerk','soldier','unemployed'];
    const names=['도원','서율','해인','윤슬','지한','채린','하온','이솔','준서','태린','세진','민서','수림','주원','가온','누리','하람','온유'];
    occupations.forEach((job,index)=>{
      const p=person('resident-'+index,['김','이','박','서','오','임'][draw(6)]+names[index],job,'resident',state.day,18+draw(47));
      p.district=index%3;p.wealth=20+draw(61);p.relationship=40+draw(16);p.goal={worker:'trader',apprentice:'artisan',clerk:index%2?'official':'teacher',soldier:'guard'}[job]||job;
      entry(p,state.day,'observed','현재 삶 관찰 시작 · '+p.jobTitle+' · 이전 생애는 생성하지 않음');state.life.people[p.id]=p;
    });
    const actors=[['yun','윤','artisan'],['dasol','다솔','farmer'],['seoyun','서윤','clerk'],['eunho','은호','apprentice'],['minseok','민석','guard'],['yeonwoo','연우','접객업 종사자'],['sora','소라','farmer'],['doyun','도윤','trader'],['jian','지안','clerk'],['planner','한결','official'],['accountant','수빈','official'],['personnel','재호','official'],['officer','태경','soldier']];
    const storyTitles={yun:'수문공',dasol:'농민 대표',seoyun:'기록보관소 서기',eunho:'방직공',minseok:'항만 수사관',yeonwoo:'접객업 동료',sora:'어민 대표',doyun:'선주',jian:'의회 기록관',planner:'기획 담당',accountant:'회계 담당',personnel:'인사 담당',officer:'현장 지휘 담당'};
    const storyGoals={yun:'주민들이 물길과 침수 위험을 알기를 바란다.',dasol:'공동 우물의 사용권을 되찾고 싶다.',seoyun:'누락된 토지 명부의 기록을 찾고 있다.',eunho:'체불 임금과 동료들의 안전을 확인하고 싶다.',minseok:'항만 거래와 체포 기록을 조사한다.',yeonwoo:'일의 조건과 사생활의 경계를 지키고 싶다.',sora:'어촌의 집들을 보호하고 싶다.',doyun:'교역과 항만 사용권에 관심이 있다.',jian:'공사와 선거 기록을 공개하고 싶다.'};
    actors.forEach(([id,name,job],index)=>{
      const p=person('story-'+id,name,job,'story',state.day,25+index*2);p.district=index%3;
      p.jobTitle=storyTitles[id];p.goalText=storyGoals[id]||'동료들과 실무 경력을 이어가고 싶다.';
      entry(p,state.day,'observed','이야기 인물의 생활 기록 시작 · 직업은 기존 이야기에서 관리');state.life.people[p.id]=p;
    });
  }
  function syncCouncil(state){
    const registry={...state.council?.people,...Object.fromEntries((state.council?.chamber?.members||[]).map(member=>[member.id,member]))};
    for(const member of Object.values(registry)){
      const id='council:'+member.id;let p=state.life.people[id];
      const civilian={housing:'teacher',trade:'trader',transparency:'clerk',security:'guard'}[member.platform]||'worker';
      const job=member.status==='seated'?'councillor':civilian;
      if(!p){
        p=person(id,member.name,job,'council',state.day,28+(member.independence||25)%28);
        p.district=member.district;p.councilId=member.id;
        entry(p,state.day,'observed','공통 생애 기록 연결 · 과거 정치 경력은 원본 기록 유지');state.life.people[id]=p;
      }else if(p.politicalStatus!==member.status&&p.politicalStatus!=null)changeJob(p,job,state.day,member.status==='seated'?'의회 진입·복귀':'의회를 떠나 민간 생활로 복귀');
      p.name=member.name;p.relationship=member.relationship;p.politicalStatus=member.status;
      p.politics={terms:copy(member.terms||[]),career:copy(member.career||[]),reputation:member.reputation??50};
    }
  }
  function restore(state,descriptor){
    state.life={...fresh(),...state.life,people:copy(state.life?.people||{}),news:[...(state.life?.news||[])]};
    state.life.clock={mode:'daily',plan:null,...state.life.clock};
    if(state.life.lastDay==null)state.life.lastDay=state.day;
    if(!state.life.activeId)state.life.activeId='player';
    let player=currentPlayer(state);
    if(!player){player=person('player',state.name,state.career,'player',state.day,state.age);player.ageDay=1;state.life.people[state.life.activeId]=player;}
    player.baseAge=state.age;player.name=state.name;player.gender=state.gender;player.age=age(player,state.day);player.wealth=state.cash;
    player.publicSupport=state.support;
    if(!Object.hasOwn(player,'sideRole'))player.sideRole=state.underworld.role;
    if(!player.started&&state.startConfigured){
      player.started=true;player.jobTitle=descriptor.title;player.occupation=state.career;player.since=state.day;
      entry(player,state.day,'observed','생애 기록 시작 · '+descriptor.title+' · 현재 나이 '+(player.age??'미설정'));
    }
    seedResidents(state);syncCouncil(state);family.restore(state);succession.restore(state);
  }
  function news(state,p,text){state.life.news.unshift({day:state.day,person:p.id,text:p.name+' · '+text});}
  function npcDay(state,p,day){
    if(p.lastDay>=day)return;
    const oldAge=p.age;p.age=age(p,day);p.lastDay=day;
    if(p.age!==oldAge)entry(p,day,'age',p.age+'세가 됐다.');
    const resting=p.health<35;
    const pay=p.occupation==='retired'&&p.age<65?0:resting&&p.occupation!=='retired'?0:(income[p.occupation]??5)+p.rank;
    const expense=3+(day%7===0?12:0);
    p.wealth+=pay-expense;
    p.health=Math.max(0,Math.min(100,p.health+(resting?3:p.wealth<0?-1:1)));
    if(day%91===0)entry(p,day,'living','현재 돈 '+p.wealth+' · 직업 '+p.jobTitle+' · 건강 '+p.health);
    if(p.source!=='resident')return;
    if(p.occupation==='retired')return;
    if(p.age>=65){changeJob(p,'retired',day,'65세 이후 현장 일을 마치고 연금 생활을 시작');news(state,p,'은퇴했다.');return;}
    if(p.occupation==='official'&&p.agency&&!state.agencies[p.agency]){
      let destination=p.agency;const visited=new Set();
      while(!state.agencies[destination]&&!visited.has(destination)){
        visited.add(destination);
        const reform=(state.agencyHistory||[]).find(item=>item.status==='enacted'&&item.type==='mergeAgency'&&item.source===destination&&item.resolvedDay>=p.since);
        if(!reform)break;destination=reform.target;
      }
      if(state.agencies[destination]){p.agency=destination;entry(p,day,'career','기관 흡수로 소속과 실무 경력을 승계했다.');news(state,p,'흡수 기관으로 소속을 옮겼다.');}
      else {changeJob(p,'unemployed',day,'소속 기관 폐지로 구직 시작');delete p.agency;news(state,p,'기관 폐지 후 새 일자리를 찾는다.');return;}

    }
    if(p.occupation==='official'&&p.agency)p.jobTitle=state.agencies[p.agency].name+' 공무원';
    if(p.health<35)return;
    if(p.jobOffer&&p.occupation==='unemployed'){
      changeJob(p,p.jobOffer,day,'플레이어의 취업 추천과 본인의 구직');delete p.jobOffer;news(state,p,'추천받은 일자리에 취업했다.');return;
    }
    if(day%7!==0)return;
    if(p.occupation==='farmer'&&p.district===1&&state.flooded>=18&&!p.floodJobLoss){
      p.floodJobLoss=true;changeJob(p,'unemployed',day,'침수로 농장 일감이 끊김');news(state,p,'침수 때문에 농장 일감을 잃었다.');return;
    }
    const service=day-p.since;
    if(p.occupation==='unemployed'&&service>=7){
      changeJob(p,'worker',day,'구직 기간 뒤 항구 일자리 확보');news(state,p,'항구에 새 일자리를 구했다.');return;
    }
    const skill={apprentice:'craft',clerk:'administration',worker:'commerce',soldier:'security'}[p.occupation];
    if(skill)p.skills[skill]=(p.skills[skill]||0)+1;
    if(p.occupation==='apprentice'&&p.skills.craft>=12){changeJob(p,'artisan',day,'현장 숙련을 쌓아 정비 일자리로 전직');news(state,p,'견습을 마치고 정비공이 됐다.');}
    else if(p.occupation==='worker'&&p.goal==='trader'&&p.skills.commerce>=12&&p.wealth>=40){
      p.wealth-=20;changeJob(p,'trader',day,'저축 20으로 시장 장사를 시작');news(state,p,'저축으로 작은 장사를 시작했다.');
    }else if(p.occupation==='clerk'&&p.skills.administration>=12){
      const agency=Object.entries(state.agencies).find(([,item])=>item.branch==='civil');
      if(p.goal==='official'&&agency){changeJob(p,'official',day,'문서 실무 경력으로 행정 기관에 채용');p.agency=agency[0];news(state,p,'행정 기관으로 이직했다.');}
      else if(p.goal==='teacher'){changeJob(p,'teacher',day,'문서 실무를 살려 야학 교사로 전직');news(state,p,'야학 교사가 됐다.');}
    }else if(p.occupation==='soldier'&&service>=730){changeJob(p,'guard',day,'복무를 마치고 민간 순찰 업무로 전직');news(state,p,'전역 후 순찰대에 취업했다.');}
    else if(['official','soldier'].includes(p.occupation)&&service>=180*(p.rank+1)&&p.rank<2){p.rank++;entry(p,day,'career','실무 경력 승급 '+p.rank+'단계');news(state,p,'실무 경력이 한 단계 올랐다.');}
  }
  function tick(state){
    if(state.day<=state.life.lastDay)return;
    const player=currentPlayer(state);
    for(let day=state.life.lastDay+1;day<=state.day;day++){
      const oldAge=player.age;player.age=age(player,day);
      if(oldAge!==player.age)entry(player,day,'age',(player.age??'미설정')+'세가 됐다.');
      player.health=Math.max(0,Math.min(100,player.health+(state.cash<0?-1:state.energy>=60?1:0)-(state.energy<20?1:0)));
      family.tick(state,day);
      for(const p of Object.values(state.life.people))if(p.id!==activeId(state)&&p.source!=='family')npcDay(state,p,day);
    }
    state.life.lastDay=state.day;
  }
  function observe(state,before,action,descriptor){
    const p=currentPlayer(state);
    if(p.occupation!==state.career||p.jobTitle!==descriptor.title){changeJob(p,state.career,state.day,'직업·직급 변화',descriptor.title);}
    p.name=state.name;p.gender=state.gender;p.baseAge=state.age;p.age=age(p,state.day);p.wealth=state.cash;p.publicSupport=state.support;
    if(activeId(state)!==(before.life?.activeId||'player')){seedResidents(state);syncCouncil(state);family.restore(state);succession.restore(state);return;}
    if(action.type==='profile'&&(before.age!==state.age||before.name!==state.name||before.gender!==state.gender))entry(p,state.day,'profile','인물 설정 수정 · 시작 나이 '+state.age+' · 현재 나이 '+p.age);
    if(action.type==='start')state.life.clock.mode='lifetime';
    if(!state.life.processing&&before.cash!==state.cash)entry(p,state.day,'finance','개인 돈 '+(state.cash-before.cash>=0?'+':'')+(state.cash-before.cash)+' → '+state.cash+' · 공금·당 자금은 별도');
    for(const key of Object.keys(state.skills||{}))if((state.skills[key]||0)>(before.skills?.[key]||0))entry(p,state.day,'training','훈련 습득 · '+key);
    if(!state.life.processing&&['work','careerDuty','officialDuty'].includes(action.type)&&before.actions>state.actions)entry(p,state.day,'work',descriptor.title+' 업무 수행');
    const role=state.underworld.role;
    if(p.sideRole!==role){entry(p,state.day,'career','병행 활동 '+(descriptor.sideTitle||'종료'));p.sideRole=role;}
    if(state.startConfigured&&!p.started){p.started=true;entry(p,state.day,'observed','선택한 출신과 직업으로 삶을 시작했다.');}
    seedResidents(state);syncCouncil(state);family.restore(state);succession.restore(state);
  }
  function act(state,action){
    if(!['lifeCare','lifeVisit','lifeRefer'].includes(action.type))return null;
    const fail=message=>({ok:false,message});
    if(!state.startConfigured||!state.actions||state.hearing||state.underReview)return fail('시작 설정 · 행동 · 진행 중인 심사를 확인하자.');
    const player=currentPlayer(state);
    if(action.type==='lifeCare'){
      if(state.cash<6||player.careDay===state.day)return fail('개인 돈 6과 오늘의 건강 관리 여부를 확인하자.');
      state.cash-=6;state.actions--;state.energy=Math.min(100,state.energy+10);player.health=Math.min(100,player.health+12);player.careDay=state.day;
      entry(player,state.day,'health','식사·휴식과 진료로 건강을 돌봤다. 개인 돈 6 · 건강 +12 · 기력 +10');
      return {ok:true,message:'식사와 휴식·진료에 개인 돈 6을 썼다. 건강 +12 · 기력 +10.'};
    }
    const p=Object.hasOwn(state.life.people,action.person)?state.life.people[action.person]:null;
    if(!p||p.id===activeId(state)||state.energy<5)return fail('대상 인물과 기력 5를 확인하자.');
    if(action.type==='lifeVisit'){
      if(p.visitDay===state.day)return fail('오늘은 이미 이 인물과 안부를 나눴다.');
      p.visitDay=state.day;p.relationship=Math.min(100,p.relationship+6);state.actions--;state.energy-=5;
      if(p.councilId){
        const member=state.council.chamber?.members.find(member=>member.id===p.councilId);
        if(member)member.relationship=p.relationship;
        if(state.council.people[p.councilId])state.council.people[p.councilId].relationship=p.relationship;
      }
      const text=p.name+'의 근황을 들었다. '+p.jobTitle+' · 건강 '+p.health+' · 개인 관계 +6. 직업과 정책에 대한 동의를 강요하지 않는다.';
      entry(p,state.day,'relationship','플레이어가 안부를 물었다. 개인 관계 +6');entry(player,state.day,'relationship',p.name+'과 안부를 나눴다.');
      return {ok:true,message:text};
    }
    if(p.source!=='resident'||p.occupation!=='unemployed'||p.relationship<55||p.health<35||p.jobOffer||state.cash<4)return fail('구직 중인 일반 주민 · 개인 관계 55 · 건강 35 · 개인 돈 4가 필요하다.');
    p.jobOffer='worker';state.cash-=4;state.actions--;state.energy-=5;
    entry(p,state.day,'relationship','플레이어가 취업 준비비 4와 항구 일자리를 추천했다. 다음 날 채용 확인');
    return {ok:true,message:p.name+'에게 취업 준비비 4와 항구 일자리를 추천했다. 본인이 다음 날 구직을 마친다.'};
  }
  function summarize(state,day,cash){
    const player=currentPlayer(state);
    entry(player,state.day,'living',day+'일부터 '+state.day+'일까지의 생활 · 개인 돈 '+(state.cash-cash>=0?'+':'')+(state.cash-cash)+' → '+state.cash);
  }
  const api={activeId,player:currentPlayer,summarize,fresh,jobs,age,calendar,restore,tick,observe,act};
  if(typeof module!=='undefined')module.exports=api;
  root.Life=api;
})(globalThis);
