'use strict';
(function(root){
  const agencies = typeof module !== 'undefined' ? require('./agencies') : root.Agencies;
  const departments=agencies.initial();
  const ranks={civil:['실무관','과장','국장','차장','기관장'],military:['병사','부사관','장교','지휘관','장군']};
  const colleagues={
    planner:{name:'한결',role:'기획 담당',competence:80},
    accountant:{name:'수빈',role:'회계 담당',competence:75},
    personnel:{name:'재호',role:'인사 담당',competence:65},
    officer:{name:'태경',role:'현장 지휘 담당',competence:70}
  };
  function fresh(){return {department:null,rank:0,merit:0,lastPromotion:0,lastDuty:0,agencyBudget:50,supplies:40,readiness:30,scrutiny:0,lastAppointment:0,appointments:[]};}
  function active(state){return ['official','soldier','defenseMinister'].includes(state.career);}
  function title(state){
    if(state.career==='defenseMinister')return '국방부장관';
    if(!active(state))return '';
    const agency=agencies.registry(state)[state.institution.department];
    if(!agency)return '';
    if(state.institution.rank===4 && agency.branch==='civil')return agency.name+'장';
    return agency.name+' '+ranks[agency.branch][state.institution.rank];
  }
  function job(state){return active(state)?{name:title(state),wage:state.career==='defenseMinister'?30:12+state.institution.rank*4,energy:12}:null;}
  function promotionReason(state){
    const item=state.institution;
    if(!active(state)||state.career==='defenseMinister')return '기관 경력 필요';
    if(item.rank>=4)return '현재 경로의 최고 직급';
    if(item.merit<(item.rank+1)*8)return `실적 ${(item.rank+1)*8} 필요`;
    if(state.day-item.lastPromotion<3)return '현 직급에서 3일 이상 근무 필요';
    if(agencies.registry(state)[item.department].branch==='military' && item.rank===1 && !(state.skills.administration>=1))return '장교 임관에 문서 훈련 1회 필요';
    if(item.rank===3 && state.support<45)return '기관장·장군 임명에 주민 지지 45 필요';
    return '';
  }
  function apply(state,action){
    if(!['enlist','officialDuty','promote','agencyOrder','foundNetwork','recruitMember','appointMember','minister','leaveInstitution'].includes(action.type))return null;
    const item=state.institution;
    const error=()=>({ok:false,state,message:'직급·실적·비용·일정 조건을 확인하자.'});
    const spend=(energy=0)=>{if(state.actions<1||state.energy<energy)return false;state.actions--;state.energy-=energy;return true};
    if(state.underReview||state.hearing)return error();
    let message='';
    if(action.type==='enlist'){
      const agency=agencies.registry(state)[action.department];
      if(!agency||state.career==='mayor'||state.career==='defenseMinister'||(state.skills[agency.skill]||0)<1||!spend())return error();
      if(active(state)&&item.department===action.department){state.actions++;return error()}
      item.department=action.department;item.rank=0;item.merit=0;item.lastPromotion=state.day;
      state.career=agency.branch==='civil'?'official':'soldier';
      message=agency.name+'에 입직했다. 실무와 훈련으로 경력을 쌓을 수 있다.';
    }else if(action.type==='foundNetwork'){
      if(state.network||(!active(state)&&action.kind==='secret')||state.cash<10||!['public','secret'].includes(action.kind)||!spend())return error();
      state.cash-=10;
      if(action.kind==='secret')item.scrutiny+=10;
      state.network={name:String(action.name||'동료 연구회').trim().slice(0,24)||'동료 연구회',kind:action.kind,members:[]};
      message=state.network.name+'을 결성했다. 동료를 영입하고 인사에 영향력을 행사할 수 있다.';
    }else if(action.type==='recruitMember'){
      if(!state.network||!colleagues[action.person]||state.network.members.some(member=>member.id===action.person)||state.cash<4||!spend())return error();
      state.cash-=4;
      state.network.members.push({id:action.person,loyalty:state.network.kind==='secret'?45:40,competence:colleagues[action.person].competence});
      message=colleagues[action.person].name+'이 '+state.network.name+'에 합류했다. 공적 역량과 개인 충성은 별도로 기록한다.';
    }else if(!active(state))return error();
    else if(action.type==='officialDuty'){
      if(item.lastDuty===state.day||!spend(12))return error();
      item.lastDuty=state.day;item.merit+=4;
      if(agencies.registry(state)[item.department].branch==='military')item.readiness=Math.min(100,item.readiness+4);
      message=agencies.registry(state)[item.department].duty+' 실적 +4.';
    }else if(action.type==='promote'){
      if(promotionReason(state)||!spend())return error();
      item.rank++;item.lastPromotion=state.day;
      message=title(state)+'으로 승진·임명됐다. 업무 수입과 행사 가능한 권한이 늘었다.';
    }else if(action.type==='agencyOrder'){
      if(item.rank<1||item.agencyBudget<12||!spend())return error();
      item.agencyBudget-=12;
      if(agencies.registry(state)[item.department].branch==='military'){
        item.supplies=Math.min(100,item.supplies+12);
        message='기관 예산 12로 군수품을 조달했다. 부대 보급 +12.';
      }else{
        const returned=Math.min(3,Math.max(0,86-Object.values(state.residents).reduce((a,b)=>a+b,0)));
        state.residents.village+=returned;state.support=Math.min(100,state.support+4);
        message=`기관 예산 12로 주민 지원을 승인했다. ${returned}가구 복귀 · 지지 +4.`;
      }
    }else if(action.type==='appointMember'){
      const member=state.network?.members.find(person=>person.id===action.person);
      if(item.rank<2||!member||state.day-item.lastAppointment<3||!['merit','loyalty'].includes(action.choice)||!spend())return error();
      item.lastAppointment=state.day;
      item.appointments.push({day:state.day,person:action.person,method:action.choice});
      if(action.choice==='merit'){
        item.merit+=Math.floor(member.competence/20);item.readiness=Math.min(100,item.readiness+5);item.scrutiny=Math.max(0,item.scrutiny-5);
        message=colleagues[action.person].name+'을 역량 기준으로 추천했다. 조직 업무 준비도가 올랐다.';
      }else{
        member.loyalty=Math.min(100,member.loyalty+15);item.readiness=Math.max(0,item.readiness-4);item.scrutiny+=20;
        message='측근 인사를 밀어붙였다. 개인 충성 +15 · 준비도 −4 · 감사 주목도 +20.';
      }
    }else if(action.type==='minister'){
      if(item.rank<4||state.support<60||!state.network||state.network.members.length<2||state.career==='defenseMinister'||!spend())return error();
      state.career='defenseMinister';item.department='army';message='국방부장관으로 임명됐다. 기관 예산·보급·인사에 관한 권한을 맡는다.';
    }else if(action.type==='leaveInstitution'){
      if(!spend())return error();state.career='worker';message='현재 기관과 보직에서 사임했다. 개인 조직과 과거 인사 기록은 남는다.';
    }
    checkAudit(state);
    return {ok:true,state,message};
  }
  function checkAudit(state) {
    if(!active(state)||state.institution.scrutiny<60||state.eventQueue.some(event=>event.institutionAudit))return;
    state.eventQueue.push({id:'institution-audit-'+state.day,day:state.day,scene:'hearing',title:'인사와 민원 처리 기록을 묻는 사람',text:'감사 담당자가 업무 처리와 개인 이해관계의 관계를 묻는다.',destination:'jobs',institutionAudit:true,dialogue:[{speaker:'지안',text:'업무 처리 기록을 공개해 주세요. 자료를 공개하고 시정하거나 보직을 내려놓아야 합니다.'}]});
  }
  function auditChoices(state){return [{id:'disclose',title:'인사 자료를 공개하고 책임을 지겠다',detail:'개인 비용 12 · 실적 −8 · 감사 주목도 초기화',disabled:state.cash<12},{id:'resign',title:'현재 보직에서 물러나겠다',detail:'직위·기관 권한 상실 · 개인 조직 유지',disabled:false}];}
  function auditReply(choice){return {reply:choice==='disclose'?'자료를 공개하고 책임을 지겠습니다.':'보직에서 물러나겠습니다.',speaker:'지안',reaction:choice==='disclose'?'인사 자료와 시정 보고서를 공개 기록에 남기겠습니다.':'사임을 접수하겠습니다. 인사 기록은 이후에도 남습니다.'};}
  const api={departments,ranks,colleagues,fresh,active,title,job,promotionReason,apply,checkAudit,auditChoices,auditReply};
  if(typeof module!=='undefined')module.exports=api;
  root.Institutions=api;
})(globalThis);
