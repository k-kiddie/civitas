'use strict';
(function(root){
  const candidates={
    sora:{name:'소라',platform:'housing',pledge:'이재민 주거와 배급 우선',base:[28,50,26]},
    doyun:{name:'도윤',platform:'trade',pledge:'항만 교역과 일자리 확대',base:[40,18,28]},
    jian:{name:'지안',platform:'transparency',pledge:'계약 공개와 공적 감사',base:[24,25,42]}
  };
  const platforms={housing:'주거·복지',trade:'교역·일자리',transparency:'기록 공개·감사',security:'치안·보급'};
  function fresh(){return {nextDay:20,round:1,platform:'housing',activity:{sora:0,doyun:0,jian:0},endorsements:{},requested:[],history:[],returnCareer:'worker'};}
  function preferences(id){return {planner:['transparency','jian'],accountant:['transparency','jian'],personnel:['housing','sora'],officer:['security','doyun']}[id]||['housing','sora'];}
  function memberChoice(state,member){
    const [platform,npc]=preferences(member.id);
    if(state.candidate&&state.institution.scrutiny<60&&(member.loyalty>=65||(member.loyalty>=40&&state.politics.platform===platform)))return 'player';
    return npc;
  }
  function result(state){
    const common=state.support-25;
    const fulfilled=state.promise==='kept'?8:state.promise==='broken'?-15:0;
    const names=['항구','어촌','언덕'];const voters=[state.residents.harbor,state.residents.village,state.residents.hill];
    const electorate=Math.max(1,voters.reduce((sum,count)=>sum+count,0));
    const districts=names.map((name,index)=>{
      let strength=[35+common+(state.funding==='merchant'&&!state.contractRelief?-12:0),25+common+fulfilled+(state.flooded===0?10:-12),30+common+(state.witness?10:0)][index];
      const favored={housing:1,trade:0,transparency:2,security:2}[state.politics.platform];
      if(index===favored)strength+=6;
      const allies=Object.values(state.politics.endorsements).filter(value=>value==='player').length;
      strength=Math.max(5,Math.min(95,strength+allies*2));
      const raw=Object.fromEntries(Object.entries(candidates).map(([id,npc])=>[id,npc.base[index]+state.politics.activity[id]*2+(id==='sora'&&index===1&&state.flooded>0?8:0)+(id==='jian'&&state.institution.scrutiny>=60?10:0)]));
      for(const endorsement of Object.values(state.politics.endorsements))if(raw[endorsement]!==undefined)raw[endorsement]+=3;
      const npcTotal=Object.values(raw).reduce((a,b)=>a+b,0);
      const shares=Object.fromEntries(Object.entries(raw).map(([id,value])=>[id,(state.candidate?100-strength:100)*value/npcTotal]));
      shares.player=state.candidate?strength:0;
      return {name,voters:voters[index],share:shares.player,shares};
    });
    const totals=Object.fromEntries([...Object.keys(candidates),'player'].map(id=>[id,districts.reduce((sum,district)=>sum+district.voters*district.shares[id],0)/electorate]));
    const order=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
    const winnerId=order[0][0];
    return {won:winnerId==='player',winnerId,winner:winnerId==='player'?state.name:candidates[winnerId].name,votes:Math.round(totals.player),totals,districts,ran:state.candidate,day:state.day,round:state.politics.round};
  }
  function tick(state){
    const updates=[];const election=state.politics;
    if(state.day<election.nextDay&&state.day>=election.nextDay-10&&state.day%4===0){
      const ids=Object.keys(candidates);const id=ids[Math.floor(state.day/4)%ids.length];
      election.activity[id]=Math.min(6,election.activity[id]+1);
      updates.push(candidates[id].name+'가 '+candidates[id].pledge+'를 내걸고 주민 모임을 열었다.');
    }
    if(state.day>=election.nextDay-7 && state.day<=election.nextDay && state.network){
      for(const member of [...state.network.members]){
        const choice=memberChoice(state,member);
        const previous=election.endorsements[member.id];election.endorsements[member.id]=choice;
        const name={planner:'한결',accountant:'수빈',personnel:'재호',officer:'태경'}[member.id]||member.id;
        if(previous!==choice){
          const text=name+'이 '+(choice==='player'?state.name:candidates[choice].name)+' 지지를 표명했다.';
          updates.push(text);state.memories.push({person:name,day:state.day,text});
        }
        if(member.loyalty<25&&state.institution.scrutiny>=60){
          state.network.members=state.network.members.filter(value=>value.id!==member.id);
          const text=name+'이 측근 인사에 반발해 조직을 떠났다.';updates.push(text);state.memories.push({person:name,day:state.day,text});
        }
      }
    }
    return updates;
  }
  function act(state,action){
    if(!['choosePlatform','seekEndorsement'].includes(action.type))return null;
    const fail=message=>({ok:false,state,message});
    if(state.hearing||state.underReview||state.actions<1)return fail('현재 일정과 행동을 확인하자.');
    if(action.type==='choosePlatform'){
      if(!platforms[action.platform]||!state.candidate)return fail('후보 등록 후 공약을 선택하자.');
      if(state.politics.platform===action.platform)return fail('이미 선택한 공약이다.');
      state.actions--;state.politics.platform=action.platform;
      for(const member of state.network?.members||[])if(state.politics.endorsements[member.id])state.politics.endorsements[member.id]=memberChoice(state,member);
      return {ok:true,state,message:'핵심 공약을 '+platforms[action.platform]+'로 정했다. 구역 표심과 구성원 판단에 반영된다.'};
    }
    const member=state.network?.members.find(value=>value.id===action.person);
    if(!member||!state.candidate||state.politics.requested.includes(member.id))return fail('이번 선거에 지지를 요청할 구성원을 확인하자.');
    state.actions--;state.politics.requested.push(member.id);member.loyalty=Math.min(100,member.loyalty+4);
    const choice=memberChoice(state,member);state.politics.endorsements[member.id]=choice;
    return {ok:true,state,message:choice==='player'?'구성원이 당신의 공약과 관계를 고려해 지지를 약속했다.':'구성원이 자신의 이해관계에 따라 '+candidates[choice].name+' 지지를 유지했다.'};
  }
  const api={fresh,candidates,platforms,result,tick,act,memberChoice};
  if(typeof module!=='undefined')module.exports=api;
  root.Politics=api;
})(globalThis);
