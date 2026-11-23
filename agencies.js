'use strict';
(function(root) {
  function initial() {
    return {
      reconstruction:{name:'도시재건청',branch:'civil',skill:'administration',duty:'복구 민원과 공사 장부를 처리했다.',person:'윤',staff:24},
      welfare:{name:'주민복지처',branch:'civil',skill:'care',duty:'구호 대상 명부와 급수 민원을 처리했다.',person:'다솔',staff:20},
      audit:{name:'공공감사청',branch:'civil',skill:'investigation',duty:'계약과 지출 내역을 대조했다.',person:'지안',staff:16},
      revenue:{name:'조세행정청',branch:'civil',skill:'administration',duty:'조세 신고와 체납 이의 신청을 검토했다.',person:'지안',staff:18},
      trade:{name:'통상지원청',branch:'civil',skill:'commerce',duty:'교역 허가와 상인의 통관 민원을 처리했다.',person:'도윤',staff:18},
      health:{name:'공중보건청',branch:'civil',skill:'care',duty:'진료소 공급과 방역 보고서를 검토했다.',person:'소라',staff:20},
      food:{name:'식량배급처',branch:'civil',skill:'commerce',duty:'배급 창고의 재고와 출고 기록을 확인했다.',person:'다솔',staff:18},
      education:{name:'교육지원처',branch:'civil',skill:'administration',duty:'야학과 학교의 인력 배치를 검토했다.',person:'서윤',staff:16},
      intelligence:{name:'국가정보처',branch:'civil',skill:'investigation',duty:'제보 출처와 정보 보고서의 신뢰도를 대조했다.',person:'민석',staff:14},
      army:{name:'벨라르 방위군',branch:'military',skill:'investigation',duty:'부대 훈련과 보급 점검을 마쳤다.',person:'민석',staff:60}
    };
  }
  function registry(state) { return state.agencies || initial(); }
  function reason(state) {
    if(state.underReview || state.hearing)return '진행 중인 심사를 먼저 마쳐야 한다';
    if(state.agencyProposal)return '이미 정부가 심사 중인 개편안이 있다';
    if(!['official','defenseMinister'].includes(state.career))return '행정기관 보직 또는 국방부장관 보직 필요';
    if(state.institution.rank<2)return '국장급 이상에서 개편안을 건의할 수 있다';
    return '';
  }
  function propose(state,action) {
    if(!['createAgency','splitAgency','mergeAgency','abolishAgency','withdrawReform'].includes(action.type))return null;
    const fail=message=>({ok:false,state,message});
    if(action.type==='withdrawReform') {
      if(!state.agencyProposal || state.actions<1)return fail('철회할 개편안이 없다.');
      const id=state.agencyProposal.id;
      state.followUps=state.followUps.filter(item=>item.proposalId!==id);
      state.agencyHistory.unshift({...state.agencyProposal,status:'withdrawn',resolvedDay:state.day});
      state.agencyProposal=null;state.actions--;
      return {ok:true,state,message:'개편 건의를 철회했다. 기존 기관과 보직은 유지된다.'};
    }
    const blocked=reason(state);
    if(blocked)return fail(blocked);
    if(state.actions<1||state.energy<10)return fail('행동 1회와 기력 10이 필요하다.');
    const agencies=registry(state);
    const source=state.career==='defenseMinister'?action.source:state.institution.department;
    if(!agencies[source] || agencies[source].branch!=='civil')return fail('개편을 건의할 행정기관을 선택하자.');
    const type=action.type;
    const name=String(action.name||'').trim();
    if(['createAgency','splitAgency'].includes(type)) {
      if(name.length<3||name.length>20||!/[청처]$/.test(name)||!/^[가-힣A-Za-z0-9 ·]+$/.test(name))return fail('새 기관 이름은 청 또는 처로 끝나는 3~20자로 입력하자.');
      if(Object.values(agencies).some(item=>item.name===name))return fail('이미 같은 이름의 기관이 있다.');
    }
    if(type==='mergeAgency'&&(!agencies[action.target]||action.target===source||agencies[action.target].branch!=='civil'))return fail('다른 행정기관을 통합 대상으로 선택하자.');
    if(type==='splitAgency'&&agencies[source].staff<12)return fail('정원 12명 이상인 기관만 분리할 수 있다.');
    const proposal={id:state.nextAgencyProposal++,type,source,target:action.target||null,name,
      sourceName:agencies[source].name,targetName:agencies[action.target]?.name||null,
      cost:type==='createAgency'?20:type==='splitAgency'?10:5,stage:'cabinet',day:state.day,due:state.day+3};
    state.agencyProposal=proposal;
    state.followUps.push({type:'agencyReform',proposalId:proposal.id,day:proposal.due});
    state.actions--;state.energy-=10;
    return {ok:true,state,message:'개편 건의를 정부에 제출했다. 사흘 뒤 국무회의 심사, 통과 시 다시 사흘 뒤 법·예산 승인을 거친다. 아직 기관은 바뀌지 않는다.'};
  }
  function process(state,item) {
    const proposal=state.agencyProposal;
    if(!proposal||proposal.id!==item.proposalId)return null;
    const agencies=state.agencies;
    let text='';
    if(proposal.stage==='cabinet'&&state.support>=45&&state.institution.scrutiny<60&&agencies[proposal.source]) {
      proposal.stage='legislature';proposal.due=state.day+3;
      state.followUps.push({type:'agencyReform',proposalId:proposal.id,day:proposal.due});
      text='국무회의가 개편안 추진에 동의했다. 의회에서 법과 예산을 심사한다. 현재 기관과 보직은 유지된다.';
    } else {
      const approved=proposal.stage==='legislature'&&state.support>=55&&state.institution.scrutiny<60&&state.institution.agencyBudget>=proposal.cost&&agencies[proposal.source]&&(!proposal.target||agencies[proposal.target])&&(proposal.type!=='createAgency'||state.unassignedOfficials>=6);
      if(approved) {
        state.institution.agencyBudget-=proposal.cost;
        const source=agencies[proposal.source];
        if(['createAgency','splitAgency'].includes(proposal.type)) {
          const staff=proposal.type==='splitAgency'?Math.floor(source.staff/2):6;
          if(proposal.type==='splitAgency')source.staff-=staff;
          else state.unassignedOfficials-=staff;
          const id='agency-'+proposal.id;
          agencies[id]={...source,name:proposal.name,staff,createdDay:state.day};
          text=`${proposal.name}이 설치됐다. 정원 ${staff}명 · 공적 예산 ${proposal.cost} 집행.`;
        } else if(proposal.type==='mergeAgency') {
          agencies[proposal.target].staff+=source.staff;
          delete agencies[proposal.source];
          if(state.institution.department===proposal.source)state.institution.department=proposal.target;
          text=`${proposal.sourceName}이 ${proposal.targetName}에 흡수됐다. 정원과 현재 소속을 통합했다. 직급과 인사 기록은 승계된다.`;
        } else {
          state.unassignedOfficials+=source.staff;
          delete agencies[proposal.source];
          if(state.institution.department===proposal.source){state.career='worker';state.institution.department=null;state.institution.rank=0;}
          text=`${proposal.sourceName}이 폐지됐다. 해당 보직과 기관 권한이 종료되고 정원은 재배치 대기 인력으로 넘어갔다. 개인 조직과 과거 기록은 남는다.`;
        }
      } else text=proposal.stage==='cabinet'?'국무회의에서 개편안 추진이 거절됐다. 주민 지지 45 이상과 낮은 감사 주목도가 필요하다.':'의회에서 법·예산 승인이 거절됐다. 지지 55 이상, 낮은 감사 주목도와 집행 예산이 필요하며 신설에는 대기 인력 6명도 필요하다.';
      state.agencyHistory.unshift({...proposal,status:approved?'enacted':'rejected',resolvedDay:state.day});
      state.agencyProposal=null;
    }
    return {id:'agency-review-'+proposal.id+'-'+state.day,day:state.day,scene:'hearing',title:state.agencyProposal?'정부 개편안이 의회로 갔다':'정부조직 개편 심사 결과',text,destination:'jobs',dialogue:[{speaker:state.agencyProposal?'국무회의 기록관':'의회 서기',text}]};
  }
  const api={initial,registry,reason,propose,process};
  if(typeof module!=='undefined')module.exports=api;
  root.Agencies=api;
})(globalThis);
