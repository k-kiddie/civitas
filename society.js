'use strict';
(function(root){
  const careers=typeof module!=='undefined'?require('./careers'):root.Careers;
  const titles={artisan:'정비공',trader:'시장 상인',teacher:'야학 교사',medic:'진료소 보조',journalist:'신문 기자',guard:'순찰대원',official:'행정 공무원',worker:'항구 노동자',clerk:'서기'};
  const skills={artisan:'craft',trader:'commerce',teacher:'administration',medic:'care',journalist:'administration',guard:'security',official:'administration'};
  const actor=state=>state.life.activeId||'player';
  const copy=value=>JSON.parse(JSON.stringify(value));
  function hash(text,seed=1){let n=seed>>>0;for(const char of text)n=Math.imul(n^char.charCodeAt(0),16777619)>>>0;return n;}
  function fresh(){return {nextEvent:1,pending:[],lastSceneDay:-1000,seen:{}};}
  function profile(state,p){
    if(p.society)return;
    const seed=hash(p.id,state.randomState?.seed||0x61c1a5),goals=Object.keys(skills);
    const independence=30+seed%56;
    const inherited=p.goal&&skills[p.goal]?p.goal:skills[p.occupation]?p.occupation:goals[seed%goals.length];
    const aspiration=p.family?.parents?.length&&independence>=60?goals[(seed>>>5)%goals.length]:inherited;
    p.society={ambition:30+(seed>>>7)%56,security:30+(seed>>>13)%56,community:30+(seed>>>19)%56,independence,
      familyDesire:30+(seed>>>10)%56,aspiration,nextReview:p.lastDay+91,decisions:[],ties:{},socialDay:p.lastDay,training:null};
  }
  function restore(state){
    state.life.society={...fresh(),...state.life.society,pending:[...(state.life.society?.pending||[])],seen:{...state.life.society?.seen}};
    for(const p of Object.values(state.life.people))profile(state,p);
  }
  function remember(p,day,text,owner){p.history.push({day,type:'autonomy',text,...(owner?{actor:owner}:{})});}
  function knows(p,id){return p.family?.parents?.includes(id)||p.family?.children?.includes(id)||p.family?.partner===id||(p.society?.ties[id]?.bond||0)>=60||p.history.some(item=>item.type==='relationship'&&(item.actor??'player')===id);}
  function firstContact(p,id){if(p.family?.parents?.includes(id)||p.family?.children?.includes(id))return p.family.joinedDay??p.history[0]?.day??Infinity;return p.history.find(item=>item.type==='relationship'&&(item.actor??'player')===id)?.day??p.society?.ties[id]?.metDay??Infinity;}
  function note(state,p,text,day){state.life.news.unshift({day,person:p.id,text:p.name+' · '+text});}
  function careerChanged(state,p,from,day){
    if(!p.society)return;
    remember(p,day,from+'에서 '+p.jobTitle+' 생활로 바뀌었다. 자신의 경력으로 기록한다.');
    const id=actor(state);
    if(knows(p,id)&&p.relationship>=60&&p.occupation!=='unemployed'&&p.occupation!=='retired'){
      const pending=state.life.society.pending;
      if(!pending.some(item=>item.person===p.id&&item.actor===id))pending.push({person:p.id,actor:id,from,to:p.occupation,day,readyDay:Math.max(day+30,firstContact(p,id)+90)});
    }
  }
  function review(state,p,day,changeJob){
    const s=p.society;
    if(p.age>=18&&p.family.parents.length&&!s.adultAligned){if(s.independence<60&&skills[p.goal])s.aspiration=p.goal;s.adultAligned=true;}
    if(p.source==='player'||p.source==='family'||p.source==='story'||p.controlArchive||p.politicalStatus==='seated')return;
    if(p.occupation==='soldier'&&day-p.since<730){if(day>=s.nextReview){s.nextReview=day+91;s.decisions.push({day,chosen:'service',reason:'남은 복무 의무를 마친 뒤 진로를 결정',options:[]});}return;}
    if(p.age>=65&&p.source==='council'&&p.occupation!=='retired'){changeJob(p,'retired',day,'원외 생활의 은퇴를 스스로 선택');note(state,p,'원외 생활에서 은퇴했다.',day);}
    if(p.age>=65||p.occupation==='retired'){s.training=null;return;}
    if(s.training&&day>=s.training.dueDay){
      const course=s.training;
      if(course.target==='trader'&&p.wealth<20){s.training.dueDay=day+91;remember(p,day,'상업 교육은 마쳤지만 창업 자금 20을 더 모으기로 했다.');return;}
      if(course.target==='trader')p.wealth-=20;
      s.training=null;p.skills[course.skill]=Math.max(12,p.skills[course.skill]||0);
      if(course.target==='official'){
        const agency=Object.entries(state.agencies).find(([,item])=>item.branch==='civil');
        if(agency){p.agency=agency[0];changeJob(p,'official',day,'본인이 선택한 문서 교육과 채용 준비를 마침');}
        else {remember(p,day,'교육은 마쳤지만 채용할 행정 기관이 없어 현재 일을 유지했다.');}
      }else changeJob(p,course.target,day,'개인 돈과 시간을 들여 준비한 진로로 전직');
      note(state,p,'자신이 준비한 진로의 교육을 마쳤다.',day);
    }
    if(day<s.nextReview)return;
    s.nextReview=day+91;
    const stay={id:'stay',score:45+s.security/3,reason:'현재 일자리와 생활의 안정'};
    const choices=[stay];
    if(p.health<45)choices.push({id:'recover',score:95,reason:'건강을 먼저 회복해야 함'});
    if(p.occupation==='unemployed')choices.push({id:'search',score:90,reason:'생활비를 마련할 일자리가 필요함'});
    if(!s.training&&skills[s.aspiration]&&s.aspiration!==p.occupation&&p.wealth>=30&&p.health>=45){
      const qualified=(p.skills[skills[s.aspiration]]||0)>=12;
      choices.push({id:qualified?'advance':'train',score:50+s.ambition/2+(s.independence>=60?8:0),reason:qualified?'쌓은 숙련으로 '+titles[s.aspiration]+' 경력에 지원':'원하는 '+titles[s.aspiration]+' 경력을 위해 재교육 준비'});
    }
    if(p.district===1&&state.flooded>=18&&p.wealth>=6&&(!s.movedDay||day-s.movedDay>=365))choices.push({id:'move',score:70+s.security/3,reason:'침수 위험이 큰 지역을 떠나 생활 기반을 옮김'});
    choices.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    const chosen=choices[0];s.decisions.push({day,chosen:chosen.id,reason:chosen.reason,options:copy(choices)});
    if(chosen.id==='advance'){
      const target=s.aspiration;
      if(target==='official'){
        const agency=Object.entries(state.agencies).find(([,item])=>item.branch==='civil');
        if(agency){p.agency=agency[0];changeJob(p,'official',day,'본인의 문서 경력과 채용 선택');note(state,p,'행정 기관으로 이직했다.',day);}
        else remember(p,day,'지원할 행정 기관이 없어 현재 일을 유지했다.');
      }else if(target!=='trader'||p.wealth>=20){
        if(target==='trader')p.wealth-=20;
        changeJob(p,target,day,'숙련과 생활 조건을 보고 본인이 선택한 전직');note(state,p,'쌓은 숙련으로 새 경력을 선택했다.',day);
      }
    }else if(chosen.id==='train'){
      p.wealth-=10;s.training={target:s.aspiration,skill:skills[s.aspiration],dueDay:day+180};
      remember(p,day,titles[s.aspiration]+' 경력을 위해 개인 돈 10을 들여 180일 재교육을 시작했다.');
      note(state,p,'다음 진로를 위해 재교육을 시작했다.',day);
      if(p.family.parents.includes(actor(state))&&s.independence>=60&&!state.life.society.pending.some(item=>item.person===p.id&&item.actor===actor(state)))state.life.society.pending.push({kind:'aspiration',person:p.id,actor:actor(state),target:s.aspiration,day,readyDay:day});
    }else if(chosen.id==='move'){
      p.wealth-=6;p.district=0;s.movedDay=day;remember(p,day,'이주 준비비 6으로 항구 지역에 생활 기반을 옮겼다.');note(state,p,'침수 지역을 떠나 항구로 이사했다.',day);
    }else if(chosen.id==='recover'){
      // Income already reflects time off for serious ill health; this is a paid care decision.
      const fee=Math.min(6,Math.max(0,p.wealth));p.wealth-=fee;p.health=Math.min(100,p.health+12);remember(p,day,'건강을 우선해 휴식과 진료에 개인 돈 '+fee+'을 썼다.');
    }else remember(p,day,chosen.reason+' 때문에 현재 생활을 유지했다.');
  }
  function rent(state,p){
    const spouse=state.life.people[p.family?.partner];
    return p.family?.sharedHome&&spouse?.family?.sharedHome&&p.family.status==='married'&&spouse.family.partner===p.id?6:12;
  }
  function kin(state,a,b){
    const ancestors=p=>{const found=new Set(),queue=[...(p.family?.parents||[])];while(queue.length){const id=queue.pop();if(found.has(id))continue;found.add(id);queue.push(...(state.life.people[id]?.family?.parents||[]));}return found;};
    const left=ancestors(a),right=ancestors(b);return left.has(b.id)||right.has(a.id)||[...left].some(id=>right.has(id));
  }
  function socialLife(state,p,day){
    const s=p.society;
    if(p.source!=='resident'||p.controlArchive||p.age<18||day-s.socialDay<91)return;
    s.socialDay=day;
    const candidates=Object.values(state.life.people).filter(other=>other.id!==p.id&&other.id!==actor(state)&&other.source==='resident'&&!other.controlArchive&&other.age>=18&&!kin(state,p,other)&&
      (other.district===p.district||other.occupation===p.occupation));
    candidates.sort((a,b)=>(s.ties[b.id]?.bond||0)-(s.ties[a.id]?.bond||0)||a.id.localeCompare(b.id));
    const other=candidates[0];if(!other)return;
    const before=s.ties[other.id]||{bond:35,metDay:day};
    const tie={...before,bond:Math.min(100,before.bond+8+(p.occupation===other.occupation?3:0)),day};
    s.ties[other.id]=tie;other.society.ties[p.id]={...tie};
    if(tie.bond>=75&&day-tie.metDay>=365&&!p.family.partner&&!other.family.partner&&s.familyDesire>=60&&other.society.familyDesire>=60){
      p.family={...p.family,status:'dating',partner:other.id,since:day,autonomous:true};other.family={...other.family,status:'dating',partner:p.id,since:day,autonomous:true};
      remember(p,day,other.name+'과 서로의 선택으로 연인 관계를 시작했다.');remember(other,day,p.name+'과 서로의 선택으로 연인 관계를 시작했다.');note(state,p,other.name+'과 연인 관계가 됐다.',day);
    }
    const spouse=state.life.people[p.family.partner];
    if(!spouse||spouse.id===actor(state)||!p.family.autonomous||spouse.family.partner!==p.id)return;
    const bond=s.ties[spouse.id]?.bond||0;
    if(p.family.status==='dating'&&day-p.family.since>=180&&bond>=85&&p.wealth>=6&&spouse.wealth>=6){
      p.wealth-=6;spouse.wealth-=6;p.family.status='married';spouse.family.status='married';p.family.sharedHome=true;spouse.family.sharedHome=true;
      p.family.marriedDay=day;spouse.family.marriedDay=day;remember(p,day,spouse.name+'과 혼인했다. 각자 준비비 6 · 공동 거주 집세 분담');remember(spouse,day,p.name+'과 혼인했다.');note(state,p,spouse.name+'과 혼인했다.',day);
    }
    const global=state.life.society;
    if(p.family.status==='married'&&day-(p.family.marriedDay||day)>=365&&p.id<spouse.id&&p.wealth>=120&&spouse.wealth>=120&&
      s.familyDesire>=65&&spouse.society.familyDesire>=65&&day-(global.lastFamilyPlan??-1000)>=91&&
      day-(p.family.lastPlan??-1460)>=1460&&!state.life.family.pending.some(plan=>plan.parents.includes(p.id)||plan.parents.includes(spouse.id))){
      p.wealth-=10;spouse.wealth-=10;p.family.lastPlan=day;spouse.family.lastPlan=day;global.lastFamilyPlan=day;
      const adoption=Math.max(p.age,spouse.age)>=55;
      const names=['솔빛','여름','별하','초롱','이안','나래','봄결','단우'];
      const baseName=names[hash(p.id+spouse.id+day)%names.length];let name=baseName,suffix=2;const used=new Set([...Object.values(state.life.people).map(person=>person.name),...state.life.family.pending.map(plan=>plan.name)]);while(used.has(name))name=baseName+' '+suffix++;
      state.life.family.pending.push({type:adoption?'adoption':'birth',name,childAge:adoption?6:0,parents:[p.id,spouse.id],createdDay:day,dueDay:day+(adoption?90:270),autonomous:true,sharedCare:true});
      remember(p,day,spouse.name+'과 돌봄 예산을 마련해 새 가족을 맞이하기로 했다.');remember(spouse,day,p.name+'과 새 가족 돌봄 계획에 합의했다.');note(state,p,'새 가족을 맞이할 준비를 시작했다.',day);
    }
  }
  function schedule(state,day){
    const global=state.life.society;
    global.pending=global.pending.filter(item=>item.actor===actor(state)&&state.life.people[item.person]);
    if(day-global.lastSceneDay<90||state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||state.followUps.some(item=>item.day<=day+1)||!['none','complete'].includes(state.jobStory.stage))return;
    const index=global.pending.findIndex(item=>item.readyDay<=day&&day-(global.seen[item.actor+':'+item.person]??-1000)>=365);
    if(index<0)return;
    const reunion=global.pending.splice(index,1)[0],p=state.life.people[reunion.person];
    if(!p||p.source==='player'||!titles[p.occupation])return;
    global.lastSceneDay=day;global.seen[reunion.actor+':'+p.id]=day;
    const target=reunion.kind==='aspiration'?reunion.target:p.occupation==='official'?'clerk':p.occupation;
    state.eventQueue.push({id:'reunion-'+global.nextEvent++,day,scene:'storm-safe',reunion:{...reunion,target,name:p.name},title:p.name+(reunion.kind==='aspiration'?'의 진로 계획':'과 다시 만났다'),text:'과거의 인연이 달라진 일자리에서 이어진다.',destination:'people',dialogue:[
      {speaker:p.name,text:reunion.kind==='aspiration'?(p.education?.years>0?'지원해 준 교육과 함께 지낸 시간을 기억해요.':'가족으로 함께 지낸 시간을 기억해요.')+' 하지만 이제는 제가 원하는 '+titles[target]+' 진로를 준비하려고 합니다.':(p.family.parents.includes(actor(state))?'가족으로 함께 지낸 시간을 기억해요.':'전에 제 안부를 묻고 도와줬던 일을 기억해요.')+' 지금은 '+p.jobTitle+' 일을 하고 있습니다.'},
      {speaker:p.name,text:reunion.kind==='aspiration'?'제 돈 10을 들여 재교육을 시작했습니다. 부모님의 뜻도 듣고 싶지만, 제 삶의 진로는 제가 결정하고 싶어요.':'당신도 원한다면 함께 일하거나, 제가 배운 일을 알려드릴 수 있어요. 제 일과 돈으로 제안하는 겁니다.'}]});
  }
  function sceneContext(state,event){const data=event.reunion,p=state.life.people[data.person];return {data,p,valid:data.actor===actor(state)&&p&&p.id!==actor(state)&&!state.hearing&&!state.underReview&&(data.kind!=='aspiration'||p.society.training?.target===data.target)};}
  function choices(state,event){
    const {data,p,valid}=sceneContext(state,event);const job=careers.jobs[data.target];const skill=job?.skill||'administration';
    if(data.kind==='aspiration')return [
      {id:'respect',title:'네가 선택한 진로를 존중하겠다',detail:'추가 비용 없음 · 관계 +6 · 본인의 계획 유지',disabled:false},
      {id:'support',title:'준비 비용을 보태겠다',detail:'개인 돈 12 → 자녀 · 행동 1 · 재교육 기간 30일 단축 · 관계 +6',disabled:!valid||state.cash<12||state.actions<1},
      {id:'discuss',title:'다른 길도 생각해 보라고 말하겠다',detail:'관계 −4 · 성년 자녀의 선택을 강제로 바꾸지는 않음',disabled:!valid}
    ];
    return [
      {id:'job',title:'그 일자리에 지원하겠다',detail:job?job.name+' · '+(careers.requirement(state,data.target)||'조건 충족 · 행동 1'):'현재 지원할 일자리 없음',disabled:!valid||!job||Boolean(careers.requirement(state,data.target))||state.actions<1},
      {id:'trial',title:'오늘의 일을 함께 하겠다',detail:'행동 1 · 기력 8 · 상대 개인 돈에서 보수 12',disabled:!valid||state.actions<1||state.energy<8||p.wealth<12},
      {id:'learn',title:'경험을 배우고 싶다',detail:'개인 돈 8 → 상대 · 행동 1 · 기력 10 · '+(careers.skills[skill]||skill)+' 훈련',disabled:!valid||state.actions<1||state.energy<10||state.cash<8||(state.skills[skill]||0)>=1},
      {id:'talk',title:'근황을 듣고 다음을 기약하겠다',detail:'추가 비용 없음 · 관계 +3',disabled:false}
    ];
  }
  function reply(event,id){return {reply:{job:'그 일자리에 지원하겠습니다.',trial:'오늘 일을 함께 하겠습니다.',learn:'당신의 경험을 배우고 싶습니다.',talk:'근황을 들으니 반갑습니다. 다음에 또 이야기해요.',respect:'네가 선택한 진로를 존중하겠다.',support:'준비 비용을 보태겠다.',discuss:'다른 길도 생각해 보면 좋겠다.'}[id],speaker:event.reunion.name,reaction:event.reunion.kind==='aspiration'?'제 진로에 대해 이야기한 일을 기억하겠습니다.':'오늘 다시 만난 일과 선택을 기억하겠습니다.'};}
  function changeRelation(state,p,delta){
    p.relationship=Math.max(0,Math.min(100,p.relationship+delta));
    if(p.councilId){const member=state.council.chamber?.members.find(item=>item.id===p.councilId);if(member)member.relationship=p.relationship;if(state.council.people[p.councilId])state.council.people[p.councilId].relationship=p.relationship;}
  }
  function resolve(state,event,id){
    const {data,p,valid}=sceneContext(state,event);if(!valid)return '상황이 달라져 재회를 마쳤다. 과거의 기록은 유지된다.';
    if(data.kind==='aspiration'){
      if(id==='support'){state.cash-=12;p.wealth+=12;state.actions--;p.society.training.dueDay=Math.max(state.day+1,p.society.training.dueDay-30);}
      changeRelation(state,p,id==='discuss'?-4:6);
      remember(p,state.day,'진로 대화: '+{respect:'부모가 내 선택을 존중했다.',support:'준비비 12를 지원받았다. 교육 기간 30일 단축.',discuss:'부모는 다른 길을 원했지만 내 계획을 유지한다.'}[id],actor(state));
      return p.name+'의 진로 계획을 이야기했다. 성년 자녀의 계획은 본인에게 남는다.';
    }
    if(id==='job'){if(state.career==='investigator'&&['open','evidence'].includes(state.caseStage))state.caseStage='transferred';state.career=data.target;state.actions--;}
    if(id==='trial'){state.cash+=12;p.wealth-=12;state.energy-=8;state.actions--;}
    if(id==='learn'){const skill=careers.jobs[data.target]?.skill||'administration';state.cash-=8;p.wealth+=8;state.energy-=10;state.actions--;state.skills[skill]=1;}
    changeRelation(state,p,3);
    remember(p,state.day,'다시 만난 '+state.name+'과 '+{job:'새 일자리를 이야기했다.',trial:'함께 일하고 보수 12를 지급했다.',learn:'경험을 가르치고 교육비 8을 받았다.',talk:'서로의 근황을 나눴다.'}[id],actor(state));
    return p.name+'과 다시 만났다. '+{job:'새 직업 '+careers.jobs[data.target]?.name+'으로 옮겼다.',trial:'상대의 개인 돈에서 보수 12를 받았다.',learn:'개인 돈 8로 훈련을 받았다.',talk:'관계가 3 올랐다.'}[id];
  }
  function tick(state,day,changeJob){
    restore(state);
    for(const p of Object.values(state.life.people)){
      if(p.id===actor(state)&&p.society.training&&day>=p.society.training.dueDay){
        const course=p.society.training;const skill=course.skill==='security'?'investigation':course.skill;
        if(careers.skills[skill])state.skills[skill]=Math.max(1,state.skills[skill]||0);
        p.skills[course.skill]=Math.max(12,p.skills[course.skill]||0);p.society.training=null;
        remember(p,day,'조작 인물이 되기 전 시작한 '+titles[course.target]+' 재교육을 마쳤다. 전직 여부는 직접 결정한다.',actor(state));note(state,p,'진행하던 재교육을 마쳤다.',day);
      }
      review(state,p,day,changeJob);socialLife(state,p,day);
    }
    schedule(state,day);
  }
  const api={titles,fresh,restore,profile,careerChanged,rent,kin,choices,reply,resolve,tick};
  if(typeof module!=='undefined')module.exports=api;root.Society=api;
})(globalThis);
