'use strict';
(function(root){
  const size=11;
  function fresh(){return {chamber:null,bills:[],nextId:1,history:[]};}
  const districtNames=['항구','어촌','언덕'];
  const priorities={housing:'주거·복지',trade:'교역·일자리',transparency:'공개감사',security:'치안·보급'};
  function createMembers(chamber,seed){
    const surnames=['강','문','백','신','유','정','최','한'];
    const names=['이든','라온','서하','도현','지율','해솔','나린','수현','예담','지우','은재','시우','다인','도겸','수안','해원'];
    let random=((seed||0x61c1a5)^Math.imul(chamber.round,2654435761))>>>0;
    const draw=max=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return Math.floor(random/4294967296*max);};
    let index=0;const members=[];
    for(const group of chamber.groups){
      for(let seat=0;seat<group.seats;seat++){
        const district=(index+chamber.round)%3;
        members.push({id:'councillor-'+chamber.round+'-'+index,name:surnames[draw(surnames.length)]+names[(index+chamber.round)%names.length],
          group:group.id,district,platform:index%4===0?['trade','housing','transparency'][district]:group.platform,
          independence:25+draw(61),relationship:40+draw(21)});
        index++;
      }
    }
    return members;
  }
  function restore(state){
    const chamber=state.council.chamber;
    if(chamber&&!chamber.members)state.council.chamber={...chamber,members:createMembers(chamber,state.randomState?.seed)};
  }
  function members(state){const chamber=current(state);return chamber?.members|| (chamber?createMembers(chamber,state.randomState?.seed):[]);}
  function localObjection(state,bill,member){
    return member.independence>=60&&member.district===1&&state.flooded>=18&&bill.policy!=='housing';
  }
  function memberIntent(state,bill,member){
    const group=current(state).groups.find(item=>item.id===member.group);
    const line=intent(state,bill,group);
    const commitment=(bill.meetings||[]).find(item=>item.member===member.id&&item.supported);
    if(commitment)return {yes:true,reason:commitment.reason,defected:!line.yes};
    if(localObjection(state,bill,member))return {yes:false,reason:'침수 지역의 주거 대책을 먼저 요구',defected:line.yes};
    if(member.independence>=60&&state.promise==='broken'&&member.relationship<60)return {yes:false,reason:'어촌 보호 약속 위반으로 정부를 불신',defected:line.yes};
    if(member.independence>=60&&member.platform===bill.policy&&member.relationship>=40)return {yes:true,reason:'당론보다 개인 정책 우선순위를 지지',defected:!line.yes};
    return {...line,defected:false};
  }
  function meetingContext(state,event){
    const data=event.councilMeeting;
    const bill=state.council.bills.find(item=>item.id===data.bill);
    const member=members(state).find(item=>item.id===data.member);
    const valid=member&&bill?.status==='draft'&&bill.round===state.election?.round&&state.career==='mayor'&&!state.officeResigned&&!state.underReview&&!state.hearing&&
      state.pacts.agreements.some(pact=>pact.status==='governing'&&pact.round===bill.round&&pact.policy===bill.policy);
    return {bill,member,valid};
  }
  function meetingChoices(state,event){
    const {valid}=meetingContext(state,event);
    return [
      {id:'explain',title:'정책의 필요성을 설명한다',detail:'개인 노선·신뢰와 지역 반발에 따라 수락 · 공금 추가 없음',disabled:!valid},
      {id:'hearing',title:'지역 주민 공청회와 공개 보고를 약속한다',detail:'찬성 합의 · 집행 공금 +2 · 집행 시 지지 +1',disabled:!valid},
      {id:'listen',title:'의견을 듣고 다음 논의를 기약한다',detail:valid?'개인 관계 +8 · 이번 안건의 찬성 보장 없음':'심의가 종료되어 만남을 마친다',disabled:false}
    ];
  }
  function meetingReply(event,id){
    return {reply:{explain:'이 정책이 지역에 필요한 이유를 설명하겠습니다.',hearing:'지역 주민의 의견을 듣고 결과를 공개하겠습니다.',listen:'의견을 듣겠습니다. 다음 논의에도 반영하겠습니다.'}[id],
      speaker:event.councilMeeting.name,reaction:id==='hearing'?'공개 보고 조항을 의사록에 남겨 주세요. 그 조건으로 찬성하겠습니다.':'오늘의 대화와 제 판단을 의회 기록에 남기겠습니다.'};
  }
  function resolveMeeting(state,event,id){
    const {bill,member,valid}=meetingContext(state,event);
    if(!valid)return '해당 예산안의 심의가 종료되어 만남을 마쳤다. 예산과 표결 결과는 바뀌지 않는다.';
    const group=current(state).groups.find(item=>item.id===member.group);
    const supported=id==='hearing'||(id==='explain'&&!localObjection(state,bill,member)&&member.relationship>=30&&
      (member.platform===bill.policy||bill.amendments.some(item=>item.group===group.id)));
    const reason=id==='hearing'?'개별 면담의 지역 공청회·공개 보고 합의':'개별 면담에서 정책 취지에 동의';
    bill.meetings=bill.meetings||[];bill.meetings.push({member:member.id,name:member.name,day:state.day,approach:id,supported,reason:supported?reason:'의견 청취 · 찬성 합의 없음'});
    member.relationship=Math.min(100,member.relationship+(id==='listen'?8:3));
    if(id==='hearing')bill.amendments.push({member:member.id,name:member.name,day:state.day,cost:2});
    return member.name+' 의원과 면담했다. '+(supported?'찬성 합의: '+reason+'.':'찬성 합의에는 이르지 못했다. '+memberIntent(state,bill,member).reason+'.')+' 개인 관계 +'+(id==='listen'?8:3)+(id==='hearing'?' · 집행 공금 +2 · 집행 시 주민 지지 +1.':'.');
  }
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
    state.council.chamber.members=createMembers(state.council.chamber,state.randomState?.seed);
    state.council.history.unshift(JSON.parse(JSON.stringify(state.council.chamber)));
  }
  function current(state){return state.council.chamber?.round===state.election?.round?state.council.chamber:null;}
  function billFor(state,policy){return state.council.bills.find(bill=>bill.round===state.election?.round&&bill.policy===policy);}
  function authorized(state,policy){return !current(state)||billFor(state,policy)?.status==='passed';}
  function cost(state,policy,base){return base+(billFor(state,policy)?.amendments||[]).reduce((sum,item)=>sum+(item.cost??4),0);}
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
    const individual=members(state).map(member=>({...member,...memberIntent(state,bill,member)}));
    const votes=chamber.groups.map(group=>{
      const caucus=individual.filter(member=>member.group===group.id);
      const yesCount=caucus.filter(member=>member.yes).length;
      return {...group,yes:yesCount===group.seats,yesCount,noCount:group.seats-yesCount,
        reason:yesCount>0&&yesCount<group.seats?'개별 판단으로 찬반 분열':[...new Set(caucus.map(member=>member.reason))].join(' · ')};
    });
    const yes=individual.filter(member=>member.yes).length;
    return {yes,no:chamber.size-yes,majority:chamber.majority,votes,members:individual};
  }

  function act(state,action,projects){
    if(!['councilSubmit','councilLobby','councilVote','councilRevise','councilMeet'].includes(action.type))return null;
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
    if(action.type==='councilMeet'){
      restore(state);
      const member=members(state).find(item=>item.id===action.member);
      if(!member||state.energy<8||(bill.contacts||[]).includes(member.id)||memberIntent(state,bill,member).yes)return fail('반대 의원 · 기력 8 · 안건별 한 번의 면담 여부를 확인하자.');
      bill.contacts=bill.contacts||[];bill.contacts.push(member.id);state.actions--;state.energy-=8;
      const group=current(state).groups.find(item=>item.id===member.group);
      state.eventQueue.push({id:bill.id+'-meet-'+member.id,day:state.day,scene:'hearing',councilReport:true,
        councilMeeting:{bill:bill.id,member:member.id,name:member.name},title:member.name+' 의원과의 면담',destination:'power',
        text:districtNames[member.district]+' 지역 · '+group.name+' · 우선 의제 '+priorities[member.platform],
        dialogue:[{speaker:member.name,text:'제 우선 의제는 '+priorities[member.platform]+'입니다. '+districtNames[member.district]+' 주민들도 제 판단을 지켜보고 있습니다.'},
          {speaker:member.name,text:memberIntent(state,bill,member).reason+' 때문에 현재는 반대합니다. 어떤 제안을 하시겠습니까?'}]});
      return {ok:true,message:member.name+' 의원과의 정책 면담을 시작했다. 행동 1 · 기력 8을 사용했다.'};
    }
    if(action.type==='councilLobby'){
      const group=current(state).groups.find(item=>item.id===action.group);
      if(!group||intent(state,bill,group).yes||state.energy<10)return fail('반대 교섭단체와 기력 10을 확인하자.');
      const trust=group.party?(state.pacts.trust[group.party]??50):50;
      if(trust<30)return fail('신뢰 30 미만이면 수정안 협상을 거부한다. 정당 간담회로 관계부터 회복하자.');
      bill.amendments.push({group:group.id,name:group.name,day:state.day,cost:4});state.energy-=10;state.actions--;
      return {ok:true,message:group.name+' 지도부가 주민 공청회·결과 보고 조항에 합의했다. 의원은 개인 사정으로 이탈할 수 있다. 집행 공금 +4 · 집행 시 주민 지지 +1. 사업을 집행하지 않으면 추가 공금도 쓰지 않는다.'};
    }
    const result=preview(state,bill);
    bill.status=result.yes>=result.majority?'passed':'rejected';bill.lastVoteDay=state.day;
    bill.ballots.push({...result,day:state.day,status:bill.status});state.actions--;
    const text=bill.name+' 예산안 '+(bill.status==='passed'?'가결':'부결')+' · 찬성 '+result.yes+' / 반대 '+result.no+' · 필요 '+result.majority+'석. '+(bill.status==='passed'?'이제 공금 '+cost(state,bill.policy,bill.baseCost)+'으로 집행할 수 있다.':'공금은 지출되지 않았다. 다음 날부터 수정 재상정할 수 있다. 협약 기한은 계속 흐른다.');
    state.eventQueue.push({id:bill.id+'-vote-'+bill.ballots.length,day:state.day,scene:'hearing',councilReport:true,title:bill.status==='passed'?'의회가 예산안을 승인했다':'의회가 예산안을 부결했다',text,destination:'power',dialogue:[{speaker:'의회 의장',text},{speaker:'의회 기록관',text:'의원별 찬반과 이탈 이유를 의회 기록에 남겼습니다. 승인과 실제 공금 집행은 별도입니다.'}]});
    return {ok:true,message:text};
  }
  function execute(state,policy){
    const bill=billFor(state,policy);
    if(bill?.status==='passed'){bill.status='executed';bill.executedDay=state.day;state.support=Math.min(100,state.support+bill.amendments.length);}
  }
  const api={fresh,priorities,districtNames,restore,members,memberIntent,meetingChoices,meetingReply,resolveMeeting,seatElection,current,billFor,authorized,cost,intent,preview,act,execute};
  if(typeof module!=='undefined')module.exports=api;
  root.Council=api;
})(globalThis);
