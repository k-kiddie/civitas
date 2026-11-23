'use strict';
(function(root){
  const projects=typeof module!=='undefined'?require('./work-projects'):root.WorkProjects;
  const echoes=typeof module!=='undefined'?require('./career-echoes'):root.CareerEchoes;
  const careers=typeof module!=='undefined'?require('./careers'):root.Careers;
  const institutions=typeof module!=='undefined'?require('./institutions'):root.Institutions;
  const underground=typeof module!=='undefined'?require('./underworld'):root.Underworld;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const activeId=state=>state.life.activeId||'player';
  const player=state=>state.life.people[activeId(state)];
  function restore(state){state.life.succession={heir:null,history:[],nextOffer:1,...state.life.succession};state.life.generation=state.life.generation||1;}
  function eligible(state,p){return Boolean(p&&p.id!==activeId(state)&&p.age>=18&&player(state).family.children.includes(p.id)&&p.family.parents.includes(activeId(state))&&p.source==='resident'&&p.occupation!=='retired'&&(careers.jobs[p.occupation]||['soldier','official'].includes(p.occupation)));}
  function blocked(state,offer=false){
    if(!state.startConfigured||state.hearing||state.underReview||state.agencyProposal||state.bill==='pending'||['open','evidence','sealed'].includes(state.caseStage))return '수사·심사·안건 처리를 먼저 마치자.';
    if(state.eventQueue.some(event=>!offer||!event.successionOffer)||state.followUps.length||!['none','complete'].includes(state.jobStory.stage))return '현재 사건과 예정된 후속 만남을 먼저 처리하자.';
    if(state.pacts.agreements.some(pact=>['signed','governing'].includes(pact.status)))return '서명했거나 이행 대기 중인 정책 협약을 먼저 마치자.';
    if(state.life.family.pending.some(plan=>plan.parents.includes(activeId(state))))return '진행 중인 가족 합류 계획을 먼저 마치자.';
    if(state.life.chronicles?.runs.some(run=>run.actor===activeId(state)&&run.status==='active'))return '진행 중인 장기 직업 이야기를 마치거나 내려놓은 뒤 은퇴하자.';
    if(projects.blocked(state))return projects.blocked(state);
    if(echoes.blocked(state))return echoes.blocked(state);
    if(state.cash<0)return '개인 빚을 정리한 뒤 재산 인계를 결정하자.';
    return '';
  }
  function quote(state,share){
    const heir=state.life.people[state.life.succession.heir];
    if(!eligible(state,heir)||![0,50,75,100].includes(share))return null;
    const amount=Math.floor(state.cash*share/100);
    return {from:activeId(state),to:heir.id,fromName:player(state).name,toName:heir.name,share,amount,fromCash:state.cash,toCash:heir.wealth,remaining:state.cash-amount,total:heir.wealth+amount};
  }
  function validOffer(state,event){const offer=event.successionOffer;return !blocked(state,true)&&activeId(state)===offer.from&&state.life.succession.heir===offer.to&&eligible(state,state.life.people[offer.to])&&state.cash===offer.fromCash&&state.life.people[offer.to].wealth===offer.toCash;}
  function choices(state,event){return [
    {id:'continue',title:'은퇴하고 후계자의 삶을 이어간다',detail:'개인 재산 '+event.successionOffer.amount+' 인계 · 공직·조직 권한 승계 없음',disabled:!validOffer(state,event)},
    {id:'stay',title:'지금 인물로 계속 살아간다',detail:'조작 인물과 재산 유지 · 은퇴하지 않음',disabled:false}
  ];}
  function reply(event,id){return {reply:id==='continue'?'은퇴하고 다음 인물의 삶을 이어가겠습니다.':'아직은 이 인물의 삶을 계속하겠습니다.',speaker:'가족 기록관',reaction:id==='continue'?'두 인물의 기록과 재산 인계 내역을 남겼습니다. 새 삶은 자신의 직업에서 이어집니다.':'은퇴와 재산 이전은 진행하지 않겠습니다.'};}
  function relate(p,id){return p.family.parents.includes(id)||p.family.children.includes(id);}
  function retireParties(state){
    for(const [id,party] of Object.entries(state.parties.registry)){
      delete party.members.player;
      if(party.leader==='player')party.leader=Object.keys(party.members)[0]||null;
      if(party.nomination?.id==='player')party.nomination=null;
      if(!Object.keys(party.members).length){state.treasury+=party.funds;state.parties.history.unshift({day:state.day,text:party.name+'은 은퇴 후 주요 구성원이 남지 않아 해산하고 잔여 자금을 공적 금고에 정산했다.'});delete state.parties.registry[id];}
    }
    state.parties.membership=null;state.parties.standing=0;state.parties.lastActivity=0;
  }
  function resolve(state,event,id){
    if(id==='stay')return '은퇴를 미뤘다. 조작 인물과 재산을 그대로 유지한다.';
    if(!validOffer(state,event))return '조건이 바뀌어 인계를 진행하지 않았다.';
    const offer=event.successionOffer,old=player(state),heir=state.life.people[offer.to],day=state.day;
    old.controlArchive={day,training:copy(old.society?.training||null),career:state.career,title:old.jobTitle,skills:copy(state.skills),institution:copy(state.institution),network:copy(state.network),party:state.parties.membership,support:state.support,memories:copy(state.memories),underworld:copy(state.underworld),pacts:copy(state.pacts),partyStanding:state.parties.standing,promise:state.promise};
    old.history.push({day,type:'succession',text:'은퇴하고 '+heir.name+'에게 개인 돈 '+offer.amount+'을 인계했다. 남은 개인 돈 '+offer.remaining});
    if(old.society)old.society.training=null;
    old.source='resident';old.occupation='retired';old.jobTitle='은퇴 생활';old.rank=0;old.since=day;old.wealth=offer.remaining;old.lastDay=day;old.skills=copy(state.skills);
    heir.originalAgeAnchor=heir.originalAgeAnchor||{baseAge:heir.baseAge,ageDay:heir.ageDay};
    heir.baseAge=heir.age;heir.ageDay=day;heir.source='player';heir.started=true;heir.lastDay=day;heir.wealth=offer.total;heir.sideRole=null;
    heir.history.push({day,type:'succession',text:old.name+'의 은퇴 후 조작 인물이 됐다. 기존 개인 돈 '+offer.toCash+' + 인계 '+offer.amount+' = '+offer.total});
    for(const p of Object.values(state.life.people)){
      p.relations={...p.relations,[offer.from]:p.relationship};
      p.relationship=p.relations[heir.id]??p.society?.ties[heir.id]?.bond??(p.family.partner===heir.id?85:relate(p,heir.id)||relate(heir,p.id)?60:45);
      if(p.councilId){
        const member=state.council.chamber?.members.find(member=>member.id===p.councilId);if(member)member.relationship=p.relationship;
        if(state.council.people[p.councilId])state.council.people[p.councilId].relationship=p.relationship;
      }
    }
    retireParties(state);
    for(const agreement of state.pacts.agreements)agreement.actor=agreement.actor||offer.from;
    state.pacts.trust={};state.pacts.offers=[];state.pacts.meetings=[];
    state.candidate=false;state.officeResigned=true;state.network=null;
    state.institution={...institutions.fresh(),agencyBudget:state.institution.agencyBudget,supplies:state.institution.supplies,readiness:state.institution.readiness};
    if(['soldier','official'].includes(heir.occupation)){
      const agency=heir.occupation==='soldier'?'army':heir.agency;
      if(state.agencies[agency]){state.institution.department=agency;state.institution.rank=Math.min(2,heir.rank||0);}else {heir.occupation='unemployed';heir.jobTitle='구직 중';}
    }
    state.career=heir.occupation;state.skills={};
    for(const skill of Object.keys(careers.skills))if((heir.skills[skill]||0)>0)state.skills[skill]=1;
    if((heir.skills.security||0)>0)state.skills.investigation=1;
    if(heir.education?.years>=2&&careers.skills[heir.education.path])state.skills[heir.education.path]=1;
    state.cash=offer.total;state.energy=Math.max(20,Math.min(100,heir.health));state.name=heir.name;state.age=heir.age;state.gender=heir.gender;
    state.profileSet=true;state.ageChosen=true;state.startConfigured=true;state.startingOccupation=heir.firstOccupation||heir.occupation;
    state.support=25;state.memories=[];state.promise=null;state.testimony=false;state.witness=false;state.policeRecommendation=false;state.councilRecommendation=false;state.barredInvestigator=false;
    state.recruitment={};state.careerDutyDay=0;state.secretMissionDone=false;state.caseStage='closed';state.underworld=underground.fresh();
    state.jobStory={stage:'none',opening:null,evidence:false,wageBonus:0,outcome:null};state.politics.returnCareer=heir.occupation;state.politics.endorsements={};state.politics.requested=[];state.politics.platform='housing';
    if(state.election&&!state.election.actor)state.election.actor=offer.from;
    state.life.clock.plan=null;state.life.activeId=heir.id;state.life.generation++;
    state.life.succession.history.push({...offer,day,generation:state.life.generation});state.life.succession.heir=null;
    return old.name+'은 은퇴했고 '+heir.name+'의 삶을 이어간다. 개인 돈 '+offer.amount+'을 인계했고 선대에게 '+offer.remaining+'을 남겼다. 도시와 가족 기록은 유지하며 부모의 공직·정당·사조직·음지 권한은 승계하지 않는다.';
  }
  function act(state,action){
    if(!['heirDesignate','heirRetire'].includes(action.type))return null;
    const fail=message=>({ok:false,message});
    if(!state.startConfigured||!state.actions||state.energy<5||state.hearing||state.underReview||state.eventQueue.length)return fail('사건과 심사를 마치고 행동 1 · 기력 5를 확인하자.');
    if(action.type==='heirDesignate'){
      const p=Object.hasOwn(state.life.people,action.person)?state.life.people[action.person]:null;
      if(!eligible(state,p)||state.life.succession.heir===p.id)return fail('아직 은퇴하지 않은 성년 자녀와 현재 후계자 지정 여부를 확인하자.');
      state.life.succession.heir=p.id;player(state).history.push({day:state.day,type:'succession',text:p.name+'을 다음 조작 인물 후보로 지정했다. 재산이나 권한은 아직 이전하지 않음'});state.actions--;state.energy-=5;
      return {ok:true,message:p.name+'을 후계자로 지정했다. 지정을 바꿀 수 있고, 실제 은퇴는 별도로 결정한다.'};
    }
    const reason=blocked(state);if(reason)return fail(reason);
    const transfer=quote(state,action.share);if(!transfer)return fail('성년 후계자와 재산 인계 비율을 확인하자.');
    state.eventQueue.push({id:'succession-'+state.life.succession.nextOffer++,day:state.day,scene:'hearing',familyReport:true,successionOffer:transfer,title:'다음 삶으로 이어갈 준비',text:'은퇴는 자발적인 세대 전환이다. 사망 상속이 아니다.',destination:'people',dialogue:[
      {speaker:'가족 기록관',text:transfer.fromName+'의 개인 돈 '+transfer.fromCash+' 중 '+transfer.amount+'을 넘기고 '+transfer.remaining+'을 남깁니다. '+transfer.toName+'의 현재 돈 '+transfer.toCash+'을 합쳐 새 조작 인물의 돈은 '+transfer.total+'입니다.'},
      {speaker:'가족 기록관',text:'도시·가족·인물 기록은 유지합니다. 공직·정당 대표직·조직·개인 추천과 정치적 지지는 자동 승계하지 않습니다. 등록한 출마는 철회하고, 구성원이 없는 정당은 잔여 자금을 공적으로 정산합니다. 이 결정을 진행할까요?'}]});
    state.actions--;state.energy-=5;return {ok:true,message:'재산 인계와 은퇴 내용을 확인하고 대화에서 결정하자.'};
  }
  const api={restore,eligible,blocked,quote,choices,reply,resolve,act};
  if(typeof module!=='undefined')module.exports=api;
  root.Succession=api;
})(globalThis);
