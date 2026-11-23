'use strict';
(function(root){
  const positions={housing:'주거·복지',trade:'교역·일자리',transparency:'공개감사',security:'치안·보급'};
  const memberNames={planner:'한결',accountant:'수빈',personnel:'재호',officer:'태경'};
  function fresh(){return {registry:{
    labor:{name:'생활노동연대',platform:'housing',leader:'sora',funds:30,members:{sora:{name:'소라'},dasol:{name:'다솔'}},alliances:[],nomination:null},
    commerce:{name:'도시경제당',platform:'trade',leader:'doyun',funds:40,members:{doyun:{name:'도윤'}},alliances:[],nomination:null},
    civic:{name:'시민개혁당',platform:'transparency',leader:'jian',funds:25,members:{jian:{name:'지안'},seoyun:{name:'서윤'}},alliances:[],nomination:null}
  },membership:null,standing:0,lastActivity:0,nextId:1,history:[],ballots:[]};}
  function affiliation(state,id){
    if(id==='player')return state.parties.membership;
    return Object.keys(state.parties.registry).find(key=>state.parties.registry[key].members[id])||null;
  }
  function founders(state,platform){
    const preferences={planner:'transparency',accountant:'transparency',personnel:'housing',officer:'security'};
    return (state.network?.members||[]).filter(member=>member.loyalty>=60||(member.loyalty>=40&&preferences[member.id]===platform));
  }
  function nominee(state,partyId,field){
    const party=state.parties.registry[partyId];
    if(!party)return null;
    if(party.nomination?.round===state.politics.round)return party.nomination.id;
    const members=Object.entries(field).filter(([id])=>affiliation(state,id)===partyId);
    members.sort((a,b)=>score(b,party)-score(a,party));
    return members[0]?.[0]||null;
  }
  function score([id,person],party){return person.base.reduce((a,b)=>a+b,0)/3+(id===party.leader?8:0);}
  function bonus(state,id,field){
    const partyId=affiliation(state,id);const party=state.parties.registry[partyId];
    if(!party||nominee(state,partyId,field)!==id)return 0;
    const allies=party.alliances.filter(entry=>entry.round===state.politics.round&&state.parties.registry[entry.id]);
    return Math.min(10,2+Math.floor(party.funds/15)+allies.length*2);
  }
  function ballotLabel(state,id,field){const key=affiliation(state,id);return key&&nominee(state,key,field)===id?state.parties.registry[key].name:'무소속';}
  function cleanup(state){
    for(const [id,party] of Object.entries(state.parties.registry)){
      if(!party.members[party.leader])party.leader=Object.keys(party.members)[0]||null;
      if(!Object.keys(party.members).length){
        state.treasury+=party.funds;
        state.parties.history.unshift({day:state.day,text:party.name+'은 주요 구성원이 모두 떠나 해산했다. 잔여 자금을 정산했다.'});
        delete state.parties.registry[id];
      }
    }
  }
  const localPreferences=['trade','housing','transparency'];
  const localNames=['항구','어촌','언덕'];
  const memberPreferences={planner:'transparency',accountant:'transparency',personnel:'housing',officer:'security'};
  function profile(state,id,party,field){
    if(id==='player')return {name:state.name,platform:state.politics.platform,base:[state.support,state.support,state.support]};
    if(field[id])return field[id];
    const networkId=id.replace('network-','');
    return {name:party.members[id].name,platform:memberPreferences[networkId]||party.platform,
      base:[28,28,28],pledge:positions[memberPreferences[networkId]||party.platform]+' 지역 의제',occupation:'정당 활동가'};
  }
  function contested(state,partyId,kind){
    return (state.parties.ballots||[]).some(result=>result.partyId===partyId&&result.kind===kind&&result.round===state.politics.round&&(result.actor??'player')===(state.life?.activeId||'player'));
  }
  function ballot(state,partyId,kind,field){
    const party=state.parties.registry[partyId];
    const people=Object.fromEntries(Object.keys(party.members).map(id=>[id,profile(state,id,party,field)]));
    const voters=Object.keys(people).map((id,index)=>({id,name:people[id].name,platform:people[id].platform,district:index%3}));
    for(let index=0;index<3;index++)voters.push({id:'delegate-'+index,name:localNames[index]+' 지역 대표',platform:localPreferences[index],district:index});
    const candidateIds=Object.keys(people);
    const votes=[];const totals=Object.fromEntries(Object.keys(people).map(id=>[id,0]));
    for(const voter of voters){
      const ranked=Object.entries(people).map(([id,person])=>{
        const network=state.network?.members.find(member=>'network-'+member.id===voter.id);
        const factors=[
          ['당내 활동 기반',id==='player'?state.parties.standing*0.65:31],
          ['주민 지지와 지역 활동',id==='player'?state.support*0.1:0],
          ['노선 일치',person.platform===voter.platform?20:0],
          ['지역 기반',person.base[voter.district]*0.25],
          ['공개 선거 활동',(state.politics.activity[id]||0)*3],
          ['현 지도부 신뢰',id===party.leader?12:0],
          ['자기 후보 지지',id===voter.id?35:0],
          ['동료와 쌓은 신뢰',id==='player'&&network?network.loyalty*0.15:0]
        ];
        return {id,value:factors.reduce((sum,[,value])=>sum+value,0),
          reasons:factors.filter(([,value])=>value>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([label])=>label)};
      }).sort((a,b)=>b.value-a.value||Number(b.id===party.leader)-Number(a.id===party.leader)||candidateIds.indexOf(a.id)-candidateIds.indexOf(b.id));
      const choice=ranked[0];totals[choice.id]++;
      votes.push({voter:voter.id,name:voter.name,choice:choice.id,reasons:choice.reasons});
    }
    const order=Object.keys(people).sort((a,b)=>totals[b]-totals[a]||Number(b===party.leader)-Number(a===party.leader)||candidateIds.indexOf(a)-candidateIds.indexOf(b));
    const result={actor:state.life?.activeId||'player',partyId,partyName:party.name,kind,round:state.politics.round,day:state.day,
      winner:order[0],candidates:people,totals,votes,tied:totals[order[0]]===totals[order[1]]};
    state.parties.ballots=state.parties.ballots||[];state.parties.ballots.unshift(result);
    return result;
  }
  function report(state,result,decision){
    const title=result.kind==='leadership'?'당대표 경선 결과':'공천 경선 결과';
    const summary=Object.entries(result.totals).map(([id,count])=>result.candidates[id].name+' '+count+'표').join(' · ');
    state.eventQueue.push({id:'party-ballot-'+result.partyId+'-'+result.kind+'-'+result.round,
      day:state.day,scene:'hearing',partyBallot:true,title:decision?'당은 다른 후보를 택했다':title,
      text:summary,destination:'power',...(decision?{partyDecision:result.partyId}:{}),
      dialogue:[{speaker:'당 선거관리위원',text:result.partyName+'의 '+title+'입니다. '+summary+'. '+result.candidates[result.winner].name+' 후보가 선출됐습니다.'},
        {speaker:'당 선거관리위원',text:'주요 당원과 항구·어촌·언덕 대표가 각각 한 표씩 행사했습니다. 최다 득표자를 선출하며, 동률이면 현 대표 우선, 그다음 후보 명부 순으로 결정합니다. 표별 선택 이유는 정당 화면에서 확인할 수 있습니다.'},
        ...(decision?[{speaker:'당 선거관리위원',text:'당 후보를 지지하고 출마를 철회하시겠습니까, 탈당해 무소속 출마를 이어가시겠습니까?'}]:[])]});
  }
  function act(state,action,field){
    if(!['partyJoin','partyLeave','partyOrganize','partyFound','partySplit','partyMerge','partyDissolve','partyAlliance','partyLeadership','partyNominate'].includes(action.type))return null;
    const fail=message=>({ok:false,state,message});
    const data=state.parties;const own=data.registry[data.membership];
    if(state.hearing||state.underReview||state.actions<1)return fail('현재 심사와 행동을 확인하자.');
    let text='';
    if(action.type==='partyJoin'){
      const target=Object.hasOwn(data.registry,action.party)?data.registry[action.party]:null;
      if(!target||own||state.cash<4)return fail('탈당 여부와 가입비 4크라운을 확인하자.');
      state.cash-=4;target.funds+=4;data.membership=action.party;target.members.player={name:state.name};data.standing=20;
      text=target.name+'에 가입했다. 당 활동과 공천 경쟁에 참여할 수 있다.';
    }else if(action.type==='partyLeave'){
      if(!own)return fail('가입한 정당이 없다.');
      if(own.leader==='player')return fail('당대표는 합당·해산 또는 대표 교체 후 탈당할 수 있다.');
      delete own.members.player;data.membership=null;data.standing=0;
      if(own.nomination?.id==='player')own.nomination=null;
      text=own.name+'에서 탈당했다. 이번 선거의 개인 출마 등록은 유지된다.';
    }else if(['partyFound','partySplit'].includes(action.type)){
      const name=String(action.name||'').trim();const platform=action.platform;
      const supporters=founders(state,platform);
      if(!positions[platform]||name.length<2||name.length>24||Object.values(data.registry).some(party=>party.name===name)||state.cash<20||state.support<30||supporters.length<2)return fail('고유한 당명·지지 30·개인 돈 20·동의하는 조직원 2명이 필요하다.');
      if(action.type==='partyFound'&&own)return fail('기존 당에서 탈당하거나 분당을 선택하자.');
      if(action.type==='partySplit'&&(!own||data.standing<40))return fail('분당에는 당내 기반 40과 현재 소속이 필요하다.');
      if(own){delete own.members.player;if(own.leader==='player')own.leader=Object.keys(own.members)[0]||null;if(own.nomination?.id==='player')own.nomination=null;}
      const id='party-'+data.nextId++;const members={player:{name:state.name}};
      for(const member of supporters){
        const memberId='network-'+member.id;
        for(const party of Object.values(data.registry))delete party.members[memberId];
        members[memberId]={name:memberNames[member.id]};
      }
      state.cash-=20;data.registry[id]={name,platform,leader:'player',funds:20,members,alliances:[],nomination:null,createdDay:state.day};
      data.membership=id;data.standing=50;state.politics.platform=platform;
      text=name+'을 '+(action.type==='partySplit'?'분당해 창설했다.':'창당했다.')+' 발기인과 창당 자금은 기록에 남는다.';
    }else if(!own)return fail('먼저 정당에 가입하자.');
    else if(action.type==='partyOrganize'){
      if(data.lastActivity===state.day||state.energy<10)return fail('기력 10과 오늘의 활동 여부를 확인하자.');
      state.energy-=10;data.lastActivity=state.day;data.standing=Math.min(100,data.standing+6);own.funds+=2;state.support=Math.min(100,state.support+2);
      text='지역 당원 모임을 열었다. 당내 기반 +6 · 공개 소액 후원금 2가 당 재정에 들어왔다.';
    }else if(action.type==='partyLeadership'){
      if(own.leader==='player'||data.standing<40||contested(state,data.membership,'leadership'))return fail('당내 기반 40이 필요하며 같은 회차에는 다시 도전할 수 없다.');
      const result=ballot(state,data.membership,'leadership',field);
      own.leader=result.winner;report(state,result,false);
      text=result.candidates[result.winner].name+' 후보가 당대표로 선출됐다. 개별 투표와 선택 이유를 경선 기록에 남겼다.';
    }else if(action.type==='partyNominate'){
      if(!state.candidate||own.nomination?.round===state.politics.round||contested(state,data.membership,'nomination'))return fail('후보 등록과 이번 회차 공천 여부를 확인하자.');
      const result=ballot(state,data.membership,'nomination',field);
      own.nomination={round:state.politics.round,id:result.winner};
      if(result.winner!=='player'){
        state.politics.partyCandidates=state.politics.partyCandidates||{};
        state.politics.partyCandidates[result.winner]={...result.candidates[result.winner],round:state.politics.round};
      }
      report(state,result,result.winner!=='player');
      text=result.winner==='player'?own.name+'의 공천을 받았다. 당 조직과 연대의 지원이 득표에 반영된다.':'공천 경선에서 패했다. 사건창에서 다음 행동을 고르자.';
    }else{
      if(own.leader!=='player')return fail('당대표 권한이 필요하다.');
      const target=Object.hasOwn(data.registry,action.party)?data.registry[action.party]:null;
      if(action.type==='partyDissolve'){
        state.treasury+=own.funds;delete data.registry[data.membership];data.membership=null;data.standing=0;
        text=own.name+'을 해산하고 잔여 당 자금을 공적 금고에 정산했다. 개인 돈으로 가져가지 않는다.';
      }else if(action.type==='partyMerge'){
        if(!target||target===own||target.platform!==own.platform||data.standing<60)return fail('같은 핵심 노선의 상대 당과 당내 기반 60이 필요하다.');
        Object.assign(target.members,own.members);target.funds+=own.funds;
        delete data.registry[data.membership];data.membership=action.party;data.standing=35;
        text=own.name+'이 '+target.name+'에 합당했다. 자금과 당원을 이관했고 상대 당 지도부를 따르게 됐다.';
      }else if(action.type==='partyAlliance'){
        if(!target||target===own||data.standing<40||own.alliances.some(entry=>entry.id===action.party&&entry.round===state.politics.round))return fail('다른 당과 당내 기반 40, 이번 회차 연대 여부를 확인하자.');
        if(target.platform!==own.platform&&data.standing<60)return fail('노선이 다른 당을 설득하려면 당내 기반 60이 필요하다.');
        own.alliances.push({id:action.party,round:state.politics.round});
        if(!target.alliances.some(entry=>entry.id===data.membership&&entry.round===state.politics.round))target.alliances.push({id:data.membership,round:state.politics.round});
        text=target.name+'과 이번 선거의 지원 연대를 맺었다. 공천 후보의 조직 지원이 강화된다.';
      }else return fail('정당 활동을 확인하자.');
    }
    cleanup(state);
    state.actions--;data.history.unshift({day:state.day,text});
    return {ok:true,state,message:text};
  }
  function decisionChoices(){return [{id:'accept',title:'당의 후보를 지지하고 출마를 접겠다',detail:'개인 후보 등록 철회 · 소속 유지',disabled:false},{id:'independent',title:'탈당하고 무소속으로 출마하겠다',detail:'당 지원 상실 · 개인 후보 등록 유지',disabled:false}];}
  function decisionReply(id){return {reply:id==='accept'?'당의 후보를 지지하겠습니다.':'무소속으로 제 판단을 묻겠습니다.',speaker:'당 선거관리위원',reaction:'결정을 공천 기록에 남기겠습니다.'};}
  function resolve(state,event,id){
    const party=state.parties.registry[event.partyDecision];
    if(id==='accept'){state.candidate=false;return '공천 결과를 받아들이고 출마를 철회했다. 이미 쓴 등록비는 반환되지 않는다.';}
    if(party){delete party.members.player;if(party.leader==='player')party.leader=Object.keys(party.members)[0]||null;}
    state.parties.membership=null;state.parties.standing=0;
    return '탈당해 무소속 후보로 출마한다. 공천과 정당 지원은 받지 않는다.';
  }
  function registerIndependent(state,id,person){
    const key='breakaway-'+id;
    if(state.parties.registry[key])return;
    const formerMember='network-'+id.replace('independent-','');
    for(const party of Object.values(state.parties.registry))delete party.members[formerMember];
    state.parties.registry[key]={name:person.name+' 개혁연합',platform:person.platform,leader:id,funds:10,members:{[id]:{name:person.name},[id+'-supporter1']:{name:'지역 발기인 1'},[id+'-supporter2']:{name:'지역 발기인 2'}},alliances:[],nomination:null,createdDay:state.day};
    cleanup(state);
    state.parties.history.unshift({day:state.day,text:person.name+'이 독립 출마를 위해 새 정당을 창설했다.'});
  }
  function settleElection(state,result){
    for(const [id,party] of Object.entries(state.parties.registry)){
      const sponsoredNpc=Object.values(result.candidates||{}).some(person=>person.partyName===party.name);
      const sponsoredPlayer=result.ran&&state.parties.membership===id&&party.nomination?.round===state.politics.round&&party.nomination.id==='player';
      if(sponsoredNpc||sponsoredPlayer){
        const expense=Math.min(8,party.funds);party.funds-=expense;
        state.parties.history.unshift({day:state.day,text:party.name+'의 선거 운영비 '+expense+'를 당 재정에서 집행했다.'});
      }
    }
  }
  const api={fresh,positions,contested,affiliation,founders,nominee,bonus,ballotLabel,act,decisionChoices,decisionReply,resolve,registerIndependent,settleElection};
  if(typeof module!=='undefined')module.exports=api;
  root.Parties=api;
})(globalThis);
