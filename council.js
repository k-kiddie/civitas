'use strict';
(function(root){
  const size=11;
  function fresh(){return {chamber:null,bills:[],nextId:1,history:[]};}
  function seatElection(state,result){
    const groups={};const candidateGroups={};
    for(const [id,votes] of Object.entries(result.totals)){
      if(votes<=0||(id==='player'&&!result.ran))continue;
      const person=id==='player'?{name:result.playerName}:result.candidates[id];
      const partyId=id==='player'
        ?(state.parties.registry[state.parties.membership]?.nomination?.round===result.round&&state.parties.registry[state.parties.membership]?.nomination.id==='player'?state.parties.membership:null)
        :Object.keys(state.parties.registry).find(key=>state.parties.registry[key].name===person.partyName);
      const key=partyId||'independent-'+id;candidateGroups[id]=key;
      if(!groups[key])groups[key]={id:key,party:partyId||null,name:partyId?state.parties.registry[partyId].name:'무소속 '+person.name,
        platform:partyId?state.parties.registry[partyId].platform:id==='player'?state.politics.platform:person.platform,votes:0,seats:0};
      groups[key].votes+=votes;
    }
    const total=Object.values(groups).reduce((sum,group)=>sum+group.votes,0);
    const rows=Object.values(groups);
    for(const group of rows){const quota=size*group.votes/total;group.seats=Math.floor(quota);group.remainder=quota-group.seats;}
    rows.sort((a,b)=>b.remainder-a.remainder||b.votes-a.votes||a.id.localeCompare(b.id));
    const remaining=size-rows.reduce((sum,group)=>sum+group.seats,0);
    for(let index=0;index<remaining;index++)rows[index].seats++;
    state.council.chamber={round:result.round,day:result.day,size,majority:6,governmentGroup:candidateGroups[result.winnerId],groups:rows.filter(group=>group.seats)};
    state.council.history.unshift(JSON.parse(JSON.stringify(state.council.chamber)));
  }
  function current(state){return state.council.chamber?.round===state.election?.round?state.council.chamber:null;}
  function billFor(state,policy){return state.council.bills.find(bill=>bill.round===state.election?.round&&bill.policy===policy);}
  function authorized(state,policy){return !current(state)||billFor(state,policy)?.status==='passed';}
  function cost(state,policy,base){return base+(billFor(state,policy)?.amendments.length||0)*4;}
  function intent(state,bill,group){
    const own=current(state)?.governmentGroup===group.id&&state.election?.won&&(!group.party||state.parties.membership===group.party);
    const promised=state.pacts.agreements.some(pact=>pact.round===bill.round&&pact.status==='governing'&&pact.policy===bill.policy&&pact.target===group.party&&pact.party===state.parties.membership);
    const trust=group.party?(state.pacts.trust[group.party]??50):50;
    if(own)return {yes:true,reason:'소속 정부의 예산안'};
    if(bill.amendments.some(item=>item.group===group.id))return {yes:true,reason:'주민 공청회·결과 보고 수정안 합의'};
    if(promised&&trust>=30)return {yes:true,reason:'서명한 정책 협약 이행'};
    if(group.platform===bill.policy&&trust>=30)return {yes:true,reason:'정책 노선 일치'};
    return {yes:false,reason:trust<30?'낮은 신뢰로 정부안 반대':'다른 정책 우선 · 보완 요구'};
  }
  function preview(state,bill){
    const chamber=current(state);if(!chamber)return null;
    const votes=chamber.groups.map(group=>({...group,...intent(state,bill,group)}));
    const yes=votes.filter(group=>group.yes).reduce((sum,group)=>sum+group.seats,0);
    return {yes,no:chamber.size-yes,majority:chamber.majority,votes};
  }
  function act(state,action,projects){
    if(!['councilSubmit','councilLobby','councilVote','councilRevise'].includes(action.type))return null;
    const fail=message=>({ok:false,message});
    if(!current(state)||!state.election?.won||state.career!=='mayor'||state.officeResigned||state.day<=state.election.day||!state.actions||state.hearing||state.underReview)return fail('현직 동장 · 의회 임기 · 행동과 직무 상태를 확인하자.');
    const project=projects[action.policy];let bill=billFor(state,action.policy);
    if(action.type==='councilSubmit'){
      if(!project||bill||!state.pacts.agreements.some(pact=>pact.round===state.election.round&&pact.status==='governing'&&pact.policy===action.policy))return fail('이번 임기의 이행 대기 협약과 제출 여부를 확인하자.');
      bill={id:'budget-'+state.council.nextId++,round:state.election.round,policy:action.policy,name:project.name,baseCost:project.cost,status:'draft',day:state.day,amendments:[],ballots:[]};
      state.council.bills.unshift(bill);state.actions--;
      return {ok:true,message:project.name+' 예산안을 의회에 제출했다. 공금은 승인 후 실제 집행할 때 지출한다.'};
    }
    if(!bill)return fail('먼저 협약 사업의 예산안을 제출하자.');
    if(!state.pacts.agreements.some(pact=>pact.round===bill.round&&pact.status==='governing'&&pact.policy===bill.policy))return fail('이행 대기 협약이 종료되어 예산안 심의를 진행할 수 없다.');
    if(action.type==='councilRevise'){
      if(bill.status!=='rejected'||state.day<=bill.lastVoteDay)return fail('부결 다음 날부터 수정 재상정할 수 있다.');
      bill.status='draft';state.actions--;return {ok:true,message:'기존 수정 조항을 유지해 예산안을 재상정했다. 표결 전에 반대 교섭단체를 설득할 수 있다.'};
    }
    if(bill.status!=='draft')return fail('심의 중인 예산안만 협상·표결할 수 있다.');
    if(action.type==='councilLobby'){
      const group=current(state).groups.find(item=>item.id===action.group);
      if(!group||intent(state,bill,group).yes||state.energy<10)return fail('반대 교섭단체와 기력 10을 확인하자.');
      const trust=group.party?(state.pacts.trust[group.party]??50):50;
      if(trust<30)return fail('신뢰 30 미만이면 수정안 협상을 거부한다. 정당 간담회로 관계부터 회복하자.');
      bill.amendments.push({group:group.id,name:group.name,day:state.day});state.energy-=10;state.actions--;
      return {ok:true,message:group.name+' 측이 주민 공청회·결과 보고 조항을 조건으로 찬성했다. 집행 공금 +4 · 집행 시 주민 지지 +1. 사업을 집행하지 않으면 추가 공금도 쓰지 않는다.'};
    }
    const result=preview(state,bill);
    bill.status=result.yes>=result.majority?'passed':'rejected';bill.lastVoteDay=state.day;
    bill.ballots.push({...result,day:state.day,status:bill.status});state.actions--;
    const text=bill.name+' 예산안 '+(bill.status==='passed'?'가결':'부결')+' · 찬성 '+result.yes+' / 반대 '+result.no+' · 필요 '+result.majority+'석. '+(bill.status==='passed'?'이제 공금 '+cost(state,bill.policy,bill.baseCost)+'으로 집행할 수 있다.':'공금은 지출되지 않았다. 다음 날부터 수정 재상정할 수 있다. 협약 기한은 계속 흐른다.');
    state.eventQueue.push({id:bill.id+'-vote-'+bill.ballots.length,day:state.day,scene:'hearing',councilReport:true,title:bill.status==='passed'?'의회가 예산안을 승인했다':'의회가 예산안을 부결했다',text,destination:'power',dialogue:[{speaker:'의회 의장',text},{speaker:'의회 기록관',text:'교섭단체별 찬반과 이유를 의회 기록에 남겼습니다. 승인과 실제 공금 집행은 별도입니다.'}]});
    return {ok:true,message:text};
  }
  function execute(state,policy){
    const bill=billFor(state,policy);
    if(bill?.status==='passed'){bill.status='executed';bill.executedDay=state.day;state.support=Math.min(100,state.support+bill.amendments.length);}
  }
  const api={fresh,seatElection,current,billFor,authorized,cost,intent,preview,act,execute};
  if(typeof module!=='undefined')module.exports=api;
  root.Council=api;
})(globalThis);
