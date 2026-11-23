'use strict';
(function(root){
  const council=typeof module!=='undefined'?require('./council'):root.Council;
  const projects={
    housing:{name:'임시 주택과 생활 기반',cost:20,detail:'떠난 주민 최대 8가구 귀환 · 주민 지지 +4'},
    transparency:{name:'계약 공개와 독립 감사',cost:16,detail:'계약 증거 공개 · 주민 지지 +6'},
    trade:{name:'시장·항만 거래 지원',cost:18,detail:'이번 임기 동안 매주 공적 세수 +4 · 주민 지지 +3'},
    security:{name:'지역 방재와 순찰망',cost:20,detail:'이번 임기 동안 언덕 지역 선거 기반 +6 · 주민 지지 +3'}
  };
  function fresh(){return {agreements:[],offers:[],meetings:[],trust:{},nextId:1};}
  function ownParty(state){return state.parties.registry[state.parties.membership];}
  function trust(state,id){return state.pacts.trust[id]??50;}
  function changeTrust(state,id,amount){state.pacts.trust[id]=Math.max(0,Math.min(100,trust(state,id)+amount));}
  function governing(state){
    return state.pacts.agreements.filter(pact=>pact.status==='governing'&&pact.round===state.election?.round);
  }
  function canGovern(state){return state.career==='mayor'&&!state.officeResigned&&state.election?.won&&state.day>state.election.day;}
  function offered(state,id){return state.pacts.offers.some(offer=>offer.round===state.politics.round&&offer.target===id);}
  function met(state,id){return state.pacts.meetings.some(meeting=>meeting.round===state.politics.round&&meeting.target===id);}
  function validOffer(state,event){
    const offer=event.pactOffer;
    return offer&&offer.round===state.politics.round&&state.day<state.politics.nextDay&&state.candidate&&
      state.parties.membership===offer.party&&ownParty(state)?.leader==='player'&&
      ownParty(state)?.nomination?.round===offer.round&&ownParty(state)?.nomination.id==='player'&&
      Boolean(state.parties.registry[offer.target]);
  }
  function choices(state,event){
    const valid=validOffer(state,event);
    return [
      {id:'accept',title:'상대 당의 정책 요구를 받아들인다',detail:projects[event.pactOffer.policy].name+' · 당선 7일 뒤까지 공금 '+projects[event.pactOffer.policy].cost+' 집행',disabled:!valid},
      {id:'counter',title:'우리 당의 정책으로 수정 제안한다',detail:projects[event.pactOffer.counter].name+' · 공금 '+projects[event.pactOffer.counter].cost+' · 당내 기반 70이면 수용 · 당선 7일 뒤까지 집행',disabled:!valid||state.parties.standing<70||event.pactOffer.policy===event.pactOffer.counter},
      {id:'decline',title:'협약 없이 이번 선거를 치른다',detail:'추가 지원과 정책 의무 없음',disabled:false}
    ];
  }
  function reply(event,id){
    return {reply:{accept:'그 정책을 기한 안에 집행하겠습니다.',counter:'우리 당의 정책으로 공동 협약을 맺읍시다.',decline:'이번에는 각자의 정책으로 경쟁합시다.'}[id],
      speaker:event.pactOffer.targetName+' 협상 대표',reaction:id==='decline'?'알겠습니다. 협상 결과를 기록하겠습니다.':'서명한 정책과 기한을 공개하겠습니다. 선거 뒤에도 이 약속은 남습니다.'};
  }
  function resolve(state,event,id){
    if(id==='decline')return '정책 협약을 맺지 않았다. 이번 회차에 같은 당과 재협상할 수 없다.';
    const offer=event.pactOffer;
    const policy=id==='counter'?offer.counter:offer.policy;
    const pact={...offer,id:'pact-'+state.pacts.nextId++,policy,status:'signed',signedDay:state.day};
    state.pacts.agreements.unshift(pact);
    return offer.targetName+' 측과 '+projects[policy].name+' 협약에 서명했다. 공천 후보인 당신에게 선거 지원이 더해지며, 당선하면 7일 이내 공금으로 사업을 집행해야 한다.';
  }
  function announce(state,pact,title,text){
    state.eventQueue.push({id:pact.id+'-'+pact.status,day:state.day,scene:'hearing',pactReport:true,title,text,destination:'power',
      dialogue:[{speaker:pact.targetName+' 협상 대표',text},{speaker:'의회 기록관',text:'협약의 정책, 처리 결과와 양당 관계를 공개 기록에 남겼습니다.'}]});
    state.parties.history.unshift({day:state.day,text});
  }
  function breach(state,pact,reason){
    pact.status='broken';pact.closedDay=state.day;pact.outcome=reason;
    state.support=Math.max(0,state.support-8);
    if(state.parties.membership===pact.party)state.parties.standing=Math.max(0,state.parties.standing-10);
    changeTrust(state,pact.target,-25);
    announce(state,pact,'정책 협약이 깨졌다',pact.targetName+' 측과의 '+projects[pact.policy].name+' 협약 파기: '+reason+' 주민 지지 −8 · 당내 기반 −10(소속 유지 시) · 상대 당 신뢰 −25.');
  }
  function act(state,action){
    const mappedPolicy=action.policy==='audit'?'transparency':action.policy;
    if(action.type==='policy'&&hasProject(state,mappedPolicy))return {ok:false,message:'이번 임기에 이미 집행한 협약 사업이다.'};
    const matching=action.type==='policy'&&canGovern(state)&&governing(state).some(pact=>pact.policy===mappedPolicy);
    if(!['pactOffer','pactDeliver','pactBreak','pactRepair'].includes(action.type)&&!matching)return null;
    const fail=message=>({ok:false,message});
    if(!state.actions||state.hearing||state.underReview)return fail('행동과 직무 심사 상태를 확인하자.');
    if(action.type==='pactRepair'){
      const own=ownParty(state),target=Object.hasOwn(state.parties.registry,action.party)?state.parties.registry[action.party]:null;
      if(!own||own.leader!=='player'||!target||target===own||own.funds<4||state.energy<10||met(state,action.party))
        return fail('당대표 권한 · 당 자금 4 · 기력 10 · 이번 회차 간담회 여부를 확인하자.');
      own.funds-=4;state.energy-=10;state.actions--;
      state.pacts.meetings.push({target:action.party,round:state.politics.round});changeTrust(state,action.party,10);
      return {ok:true,message:target.name+' 측과 공개 정책 간담회를 열었다. 당 운영비 4 · 기력 −10 · 상대 신뢰 +10. 지난 협약의 파기 기록은 유지된다.'};
    }
    if(action.type==='pactOffer'){
      const own=ownParty(state),target=Object.hasOwn(state.parties.registry,action.party)?state.parties.registry[action.party]:null;
      if(!own||own.leader!=='player'||!target||target===own||!state.candidate||
        own.nomination?.round!==state.politics.round||own.nomination.id!=='player'||state.day>=state.politics.nextDay)
        return fail('선거 전, 자기 당의 공천을 받은 당대표 후보만 다른 당과 협상할 수 있다.');
      if(state.parties.standing<40||trust(state,action.party)<30||offered(state,action.party))return fail('기반 40 · 상대 당 신뢰 30 · 회차당 한 번의 협상 기회를 확인하자.');
      const offer={party:state.parties.membership,partyName:own.name,target:action.party,targetName:target.name,round:state.politics.round,policy:target.platform,counter:own.platform};
      state.pacts.offers.push({target:action.party,round:offer.round});
      state.eventQueue.push({id:'pact-offer-'+offer.round+'-'+action.party,day:state.day,scene:'hearing',pactOffer:offer,pactReport:true,title:target.name+' 측과의 정책 협상',destination:'power',
        text:'지원에는 조건이 있다. 정책과 공금 부담을 확인하고 결정하자.',dialogue:[
          {speaker:target.name+' 협상 대표',text:'당신이 당선된다면 '+projects[offer.policy].name+' 사업을 취임 첫 주에 추진해 주세요. 공금 '+projects[offer.policy].cost+'이 필요합니다.'},
          {speaker:target.name+' 협상 대표',text:'서명하면 당신의 선거 기반을 지원하겠습니다. 당선 7일 뒤까지 집행하지 않거나 당을 떠나 약속을 버리면 협약을 파기합니다. 각 당의 후보는 출마를 유지합니다.'}
        ]});
      state.actions--;return {ok:true,message:target.name+' 측과의 정책 협상을 시작했다. 사건창에서 조건을 결정하자.'};
    }
    const active=governing(state);
    if(action.type==='pactBreak'){
      const pact=active.find(item=>item.id===action.pact);
      if(!pact)return fail('현재 집행 중인 협약을 확인하자.');
      breach(state,pact,'플레이어가 공개적으로 협약을 철회했다.');state.actions--;
      return {ok:true,message:'정책 협약을 철회했다. 지지와 양당 신뢰가 하락했다.'};
    }
    const policy=matching?mappedPolicy:action.policy;
    const promises=active.filter(pact=>pact.policy===policy);
    const project=projects[policy];
    if(!project||!promises.length||!canGovern(state)||promises.some(pact=>pact.party!==state.parties.membership||!state.parties.registry[pact.target]))return fail('현직 동장과 이번 임기의 이행 대기 협약이 필요하다.');
    if(promises.some(pact=>state.day>pact.dueDay))return fail('협약의 집행 기한이 지났다.');
    if(!council.authorized(state,policy))return fail('협약 예산안을 의회에 제출하고 과반 승인을 먼저 받자.');
    const budget=council.cost(state,policy,project.cost);
    if(state.treasury<budget)return fail('사업에 필요한 공금 '+budget+'이 부족하다. 개인 돈과 당 자금으로 집행할 수 없다.');
    state.treasury-=budget;state.actions--;
    if(matching)state.policy=action.policy;
    if(policy==='housing'){
      const returned=Math.min(8,Math.max(0,86-Object.values(state.residents).reduce((a,b)=>a+b,0)));
      state.residents.village+=returned;state.support=Math.min(100,state.support+4);
    }else if(policy==='transparency'){state.witness=true;state.support=Math.min(100,state.support+6);}
    else state.support=Math.min(100,state.support+3);
    council.execute(state,policy);
    for(const pact of promises){
      pact.status='fulfilled';pact.closedDay=state.day;changeTrust(state,pact.target,15);
      announce(state,pact,'정책 협약을 이행했다',pact.targetName+' 측과 약속한 '+project.name+' 사업을 집행했다. '+project.detail+' · 상대 당 신뢰 +15.');
    }
    return {ok:true,message:project.name+' 집행. 공금 '+budget+'을 사용했고 개인 돈과 당 자금은 유지됐다. 같은 정책의 여러 협약은 한 사업으로 함께 이행했다.'};
  }
  function electionBonus(state){
    return Math.min(4,state.pacts.agreements.filter(pact=>pact.status==='signed'&&pact.round===state.politics.round&&
      pact.party===state.parties.membership&&state.parties.registry[pact.target]&&ownParty(state)?.nomination?.round===pact.round&&ownParty(state)?.nomination.id==='player').length*2);
  }
  function settleElection(state,result){
    for(const pact of state.pacts.agreements.filter(item=>item.status==='signed'&&item.round===result.round)){
      if(result.won&&state.parties.membership===pact.party&&state.parties.registry[pact.target]&&ownParty(state)?.nomination?.round===result.round&&ownParty(state)?.nomination.id==='player'){
        pact.status='governing';pact.electionDay=result.day;pact.dueDay=result.day+7;
      }else {pact.status='expired';pact.closedDay=result.day;pact.outcome='공천 후보 당선과 양당 존속 조건이 충족되지 않아 집행 의무가 종료됐다.';}
    }
  }
  function tick(state){
    for(const pact of governing(state)){
      if(!state.parties.registry[pact.target]){
        pact.status='annulled';pact.closedDay=state.day;pact.outcome='상대 정당이 소멸해 협약을 종료했다.';
        announce(state,pact,'협약 상대 정당이 사라졌다',pact.targetName+'이 소멸해 정책 협약을 종료했다. 신뢰와 지지의 파기 불이익은 없다.');
      }else if(state.career!=='mayor'||state.officeResigned||state.parties.membership!==pact.party)breach(state,pact,'동장직 또는 협약 정당의 소속을 유지하지 않았다.');
      else if(state.day>pact.dueDay)breach(state,pact,'약속한 '+pact.dueDay+'일의 집행 기한을 넘겼다.');
    }
  }
  function hasProject(state,policy){
    return state.career==='mayor'&&!state.officeResigned&&state.election?.won&&state.pacts.agreements.some(pact=>pact.status==='fulfilled'&&pact.policy===policy&&pact.round===state.election.round);
  }
  function weeklyRevenue(state){return hasProject(state,'trade')?4:0;}
  function districtBonus(state,index){return index===2&&hasProject(state,'security')?6:0;}
  const api={fresh,projects,trust,offered,met,governing,canGovern,choices,reply,resolve,act,electionBonus,settleElection,tick,weeklyRevenue,districtBonus,hasProject};
  if(typeof module!=='undefined')module.exports=api;
  root.Pacts=api;
})(globalThis);
