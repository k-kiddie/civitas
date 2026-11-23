'use strict';
(function(root){
  const parties=typeof module!=='undefined'?require('./parties'):root.Parties;
  const candidates={
    sora:{name:'소라',platform:'housing',pledge:'이재민 주거와 배급 우선',base:[28,50,26]},
    doyun:{name:'도윤',platform:'trade',pledge:'항만 교역과 일자리 확대',base:[40,18,28]},
    jian:{name:'지안',platform:'transparency',pledge:'계약 공개와 공적 감사',base:[24,25,42]}
  };
  const platforms={housing:'주거·복지',trade:'교역·일자리',transparency:'기록 공개·감사',security:'치안·보급'};
  function fresh(){return {nextDay:20,round:1,platform:'housing',activity:{sora:0,doyun:0,jian:0},endorsements:{},requested:[],history:[],returnCareer:'worker'};}
  const challengers = {
    eunho:{name:'은호',platform:'trade',pledge:'체불 임금 지급과 노동자 대표권',base:[38,28,20],occupation:'방직공',eligible:state=>state.startingOccupation==='apprentice'||['collective','petition'].includes(state.jobStory.outcome)},
    dasol:{name:'다솔',platform:'housing',pledge:'공동 우물과 농촌 사용권 보호',base:[18,48,24],occupation:'농민 대표',eligible:state=>state.startingOccupation==='farmer'||state.flooded>0},
    seoyun:{name:'서윤',platform:'transparency',pledge:'토지 명부 공개와 행정 개혁',base:[24,26,43],occupation:'기록관 서기',eligible:state=>state.startingOccupation==='clerk'||state.councilRecommendation},
    chaewon:{name:'채원',platform:'housing',pledge:'공공 진료소와 약품 배급',base:[27,38,29],occupation:'진료소 의사',eligible:state=>state.career==='medic'||state.flooded>=18},
    taegyeong:{name:'태경',platform:'security',pledge:'군 보급 공개와 재난 대응',base:[31,24,38],occupation:'전역 지휘관',eligible:state=>['soldier','defenseMinister'].includes(state.career)},
    hana:{name:'하나',platform:'transparency',pledge:'야학 지원과 교육 예산 공개',base:[23,29,41],occupation:'야학 교사',eligible:state=>state.career==='teacher'||state.institution.department==='education'},
    yeonwoo:{name:'연우',platform:'housing',pledge:'야간 노동자의 권리와 사생활 보호',base:[35,24,25],occupation:'접객업 종사자',eligible:state=>state.underworld.discovered.some(id=>['sexWorker','companion','venueOwner'].includes(id))}
  };
  function profileOf(person) { const {eligible,...profile}=person; return profile; }
  function ensureField(state) {
    if(!state.startConfigured)return;
    if(state.politics.fieldRound===state.politics.round){
      const field={...state.politics.field};
      for(const [id,person] of Object.entries(challengers))if(person.eligible(state))field[id]=profileOf(person);
      state.politics.field=field;
      return;
    }
    const field={...candidates};
    let seed=((state.randomState?.seed||0x61c1a5)^Math.imul(state.politics.round,2654435761))>>>0;
    const draw=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*max)};
    const surnames=['강','문','백','신','유','정','최','한'];
    const given=['가람','다온','도하','서진','시온','여울','지후','하린'];
    const sectors=[['상인 조합 대표','trade','소상공인 부담 완화와 거래 확대'],['구호 활동가','housing','재난 주거 지원과 급수 개선'],['행정 실무자','transparency','민원 처리 공개와 낭비 감축'],['전역 군인','security','보급 개선과 지역 안전']];
    for(let index=0;index<2;index++){
      const sector=sectors[draw(sectors.length)];
      const id='citizen-'+state.politics.round+'-'+index;
      let name=surnames[draw(surnames.length)]+given[draw(given.length)];
      for(let retry=0;retry<8&&Object.values(field).some(person=>person.name===name);retry++)name=surnames[draw(surnames.length)]+given[draw(given.length)];
      if(Object.values(field).some(person=>person.name===name))name+=' '+(index+1);
      field[id]={name,occupation:sector[0],platform:sector[1],pledge:sector[2],base:[20+draw(20),20+draw(20),20+draw(20)]};
    }
    for(const [id,person] of Object.entries(challengers))if(person.eligible(state))field[id]=profileOf(person);
    state.politics.field=field;state.politics.fieldRound=state.politics.round;
  }
  function pool(state) {
    const field={...(state.politics.fieldRound===state.politics.round?state.politics.field:candidates)};
    for(const [id,person] of Object.entries(challengers))if(person.eligible(state))field[id]=profileOf(person);
    for(const person of Object.values(state.politics.independents||{}))field[person.id]=person;
    return field;
  }
  function preferences(id){return {planner:['transparency','jian'],accountant:['transparency','jian'],personnel:['housing','sora'],officer:['security','doyun']}[id]||['housing','sora'];}
  function memberChoice(state,member){
    const [platform,npc]=preferences(member.id);
    const alternatives=Object.entries(pool(state)).filter(([,person])=>person.platform===platform);
    const favored=alternatives.find(([id])=>id===npc)?.[0]||alternatives[0]?.[0]||npc;
    if(state.candidate&&state.institution.scrutiny<60&&(member.loyalty>=65||(member.loyalty>=40&&state.politics.platform===platform)))return 'player';
    return favored;
  }
  function result(state){
    const field=pool(state);
    const common=state.support-25;
    const fulfilled=state.promise==='kept'?8:state.promise==='broken'?-15:0;
    const names=['항구','어촌','언덕'];const voters=[state.residents.harbor,state.residents.village,state.residents.hill];
    const electorate=Math.max(1,voters.reduce((sum,count)=>sum+count,0));
    const districts=names.map((name,index)=>{
      let strength=[35+common+(state.funding==='merchant'&&!state.contractRelief?-12:0),25+common+fulfilled+(state.flooded===0?10:-12),30+common+(state.witness?10:0)][index];
      const favored={housing:1,trade:0,transparency:2,security:2}[state.politics.platform];
      if(index===favored)strength+=6;
      const allies=Object.values(state.politics.endorsements).filter(value=>value==='player').length;
      strength=Math.max(5,Math.min(95,strength+allies*2+parties.bonus(state,'player',field)));
      const raw=Object.fromEntries(Object.entries(field).map(([id,npc])=>[id,npc.base[index]+parties.bonus(state,id,field)+(state.politics.activity[id]||0)*2+(id==='sora'&&index===1&&state.flooded>0?8:0)+(id==='jian'&&state.institution.scrutiny>=60?10:0)]));
      for(const endorsement of Object.values(state.politics.endorsements))if(raw[endorsement]!==undefined)raw[endorsement]+=3;
      const npcTotal=Object.values(raw).reduce((a,b)=>a+b,0);
      const baseline=Object.values(candidates).reduce((sum,person)=>sum+person.base[index],0);
      const playerWeight=state.candidate?strength/(100-strength)*baseline:0;
      const total=npcTotal+playerWeight;
      const shares=Object.fromEntries(Object.entries(raw).map(([id,value])=>[id,100*value/total]));
      shares.player=100*playerWeight/total;
      return {name,voters:voters[index],share:shares.player,shares};
    });
    const totals=Object.fromEntries([...Object.keys(field),'player'].map(id=>[id,districts.reduce((sum,district)=>sum+district.voters*district.shares[id],0)/electorate]));
    const order=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
    const winnerId=order[0][0];
    return {won:winnerId==='player',winnerId,winner:winnerId==='player'?state.name:field[winnerId].name,votes:Math.round(totals.player),totals,districts,ran:state.candidate,playerName:state.name,day:state.day,round:state.politics.round,candidates:Object.fromEntries(Object.entries(field).map(([id,person])=>[id,{name:person.name,pledge:person.pledge,platform:person.platform,occupation:person.occupation||'지역 활동가',partyName:parties.ballotLabel(state,id,field)}]))};
  }
  function tick(state){
    ensureField(state);
    const updates=[];const election=state.politics;const field=pool(state);
    if(state.day<election.nextDay&&state.day>=election.nextDay-10&&state.day%4===0){
      const ids=Object.keys(field);const id=ids[Math.floor(state.day/4)%ids.length];
      election.activity[id]=Math.min(6,(election.activity[id]||0)+1);
      updates.push(field[id].name+'가 '+field[id].pledge+'를 내걸고 주민 모임을 열었다.');
    }
    if(state.day>=election.nextDay-7 && state.day<=election.nextDay && state.network){
      for(const member of [...state.network.members]){
        const choice=memberChoice(state,member);
        const previous=election.endorsements[member.id];election.endorsements[member.id]=choice;
        const name={planner:'한결',accountant:'수빈',personnel:'재호',officer:'태경'}[member.id]||member.id;
        if(previous!==choice){
          const text=name+'이 '+(choice==='player'?state.name:(pool(state)[choice]?.name||'독립 후보'))+' 지지를 표명했다.';
          updates.push(text);state.memories.push({person:name,day:state.day,text});
        }
        if(member.loyalty<25&&state.institution.scrutiny>=60){
          if(!election.independents)election.independents={};
          const independentId='independent-'+member.id;
          election.independents[independentId]={id:independentId,name,platform:preferences(member.id)[0],pledge:'측근 인사 청산과 조직 운영 개혁',base:[25,25,30],occupation:'이탈한 조직 구성원'};
          election.endorsements[member.id]=independentId;
          parties.registerIndependent(state,independentId,election.independents[independentId]);
          state.network.members=state.network.members.filter(value=>value.id!==member.id);
          const text=name+'이 측근 인사에 반발해 조직을 떠나 독립 출마했다.';updates.push(text);state.memories.push({person:name,day:state.day,text});
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
    return {ok:true,state,message:choice==='player'?'구성원이 당신의 공약과 관계를 고려해 지지를 약속했다.':'구성원이 자신의 이해관계에 따라 '+(pool(state)[choice]?.name||'독립 후보')+' 지지를 유지했다.'};
  }
  const api={fresh,candidates,challengers,pool,ensureField,platforms,result,tick,act,memberChoice};
  if(typeof module!=='undefined')module.exports=api;
  root.Politics=api;
})(globalThis);
