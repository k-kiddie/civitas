'use strict';
(function (root) {
  const starts = typeof module !== 'undefined' ? require('./starts') : root.Starts;
  const skills = { craft:'기술', administration:'문서', care:'돌봄', commerce:'상업', investigation:'조사' };
  const jobs = {
    unemployed:{name:'구직 중',group:'생활',wage:0,energy:0,skill:null},
    ...Object.fromEntries(Object.entries(starts.occupations).map(([id,job])=>[id,{...job,group:'생활·현장',skill:null}])),
    artisan:{name:'정비공',group:'기술',skill:'craft',wage:20,energy:16,duty:'공공 설비를 정비한다',cost:0,support:2},
    trader:{name:'시장 상인',group:'상업',skill:'commerce',wage:18,energy:12,duty:'구호 물자 운송을 지원한다',cost:4,support:5},
    teacher:{name:'야학 교사',group:'교육',skill:'administration',wage:15,energy:10,duty:'주민에게 계약 읽는 법을 가르친다',cost:0,support:3},
    medic:{name:'진료소 보조',group:'의료',skill:'care',wage:14,energy:10,duty:'이재민의 진료를 돕는다',cost:4,support:4},
    journalist:{name:'신문 기자',group:'언론',skill:'administration',wage:16,energy:12,duty:'공개 기록을 취재한다',cost:0,support:3},
    guard:{name:'도시 순찰대원',group:'치안',skill:'investigation',wage:16,energy:14,duty:'귀환 주민의 밤길을 순찰한다',cost:0,support:3},
    undercover:{name:'잠입 수사관',group:'비밀 수사',secret:true,wage:20,energy:16,duty:'제보자의 신원을 가리고 단서를 보고한다',cost:0,support:4},
    courier:{name:'지하조직 연락책',group:'지하조직',secret:true,wage:12,energy:14,duty:'노동자 모임의 연락을 전달한다',cost:0,support:5}
  };
  const routes = {
    undercover:{person:'민석',title:'근무가 끝난 뒤의 제안',scene:'opening-police',lines:['체포 기록을 지켜 낸 일을 기억하네. 서류에 이름이 남지 않는 조사에 자네를 추천하려고 해.','항만의 비공개 거래를 추적하는 일이지. 받아들이면 평소 일자리는 내려놓아야 하네.'],accept:'신원을 드러내지 않고 조사하겠습니다.',decline:'지금은 제 일과 사람들 곁에 남겠습니다.',mission:'잠입 수사관 첫 임무를 받았다. 제보자를 보호하며 연락망을 확인해야 한다.'},
    courier:{person:'은호',title:'문이 닫힌 뒤의 모임',scene:'opening-factory',lines:['동료들 편에 서 준 일을 기억해. 공개 모임만으로는 만나지 못하는 사람들이 있어.','연락을 대신 전할 사람이 필요해. 언젠가 당국의 조사를 받을 수도 있는 일이야.'],accept:'연락을 맡겠어. 동료들의 이름은 지킬게.',decline:'아직은 공개적인 방법으로 돕고 싶어.',mission:'연락책 첫 임무를 받았다. 모임의 장소를 안전하게 전달해야 한다.'}
  };
  function canChange(state) { return !state.underReview && !state.hearing && state.career !== 'mayor'; }
  function requirement(state,id) {
    const job=jobs[id];
    if (!job || job.secret) return '공개 구직 대상이 아니다';
    if (!canChange(state)) return '진행 중인 직무 심사를 마치거나 동장직에서 먼저 사임해야 한다';
    if (state.career===id) return '현재 직업';
    if (job.skill && (state.skills[job.skill]||0)<1) return skills[job.skill]+' 훈련 1회 필요';
    return '';
  }
  function schedule(state) {
    if (state.day<6 || !canChange(state)) return;
    const eligible = {
      undercover:state.policeRecommendation && !state.barredInvestigator,
      courier:['collective','petition'].includes(state.jobStory.outcome) && state.support>=35
    };
    for(const [id,ready] of Object.entries(eligible)) {
      if(ready && !state.recruitment[id]) {
        state.recruitment[id]='scheduled';
        state.followUps.push({type:'recruitment',career:id,day:state.day+1});
      }
    }
  }
  function invitation(id,state) {
    const route=routes[id];
    return {id:'recruit-'+id,day:state.day,scene:route.scene,title:route.title,text:'비공개 만남에 초대됐다. 수락과 거절은 모두 기록에 남는다.',destination:'city',recruitCareer:id,dialogue:route.lines.map(text=>({speaker:route.person,text}))};
  }
  function mission(id,state) {
    const route=routes[id];
    const undercover=id==='undercover';
    return {id:'mission-'+id,day:state.day,scene:route.scene,title:undercover?'이름을 묻는 보고서':'전달할 봉투의 이름',text:undercover?'제보자의 이름을 쓰면 보고 수당을 받을 수 있다. 민석은 신원 보호를 우선하라고 했다.':'연락 봉투에는 동료들의 이름이 적혀 있다. 우회로를 이용하면 더 힘들지만 이름을 지킬 수 있다.',destination:'city',missionCareer:id,dialogue:[{speaker:route.person,text:undercover?'보고서에 제보자 실명을 쓰라는 요청이 왔네. 하지만 그 사람이 노출되면 다음 제보는 없을지도 몰라.':'검문이 생겼어. 돌아가면 더 지치겠지만 봉투 속 이름은 지킬 수 있어.'}]};
  }
  function choices(state,event) {
    if(event.missionCareer) return [{id:'protect',title:'이름을 지키고 임무를 마친다',detail:'기력 8 · 지지 +6 · 연락 상대의 신임',disabled:state.energy<8},
      {id:'withdraw',title:'이번 임무를 포기한다',detail:'지지 −3 · 상대가 실패를 기억함',disabled:false}];
    return [{id:'accept',title:routes[event.recruitCareer].accept,detail:'현 직업을 떠나 비밀 직업으로 전직 · 첫 임무 해금',disabled:!canChange(state)},
      {id:'decline',title:routes[event.recruitCareer].decline,detail:'현 직업 유지 · 이번 제안 거절',disabled:false}];
  }
  function reply(event,choice) {
    const route=routes[event.recruitCareer || event.missionCareer];
    if(event.missionCareer) return {reply:choice==='protect'?'이름은 드러내지 않고 마치겠습니다.':'이번 임무는 포기하겠습니다.',speaker:route.person,reaction:choice==='protect'?'이름을 지켰다는 보고를 받았어. 다음에도 신중하게 부탁하네.':'알겠어. 사람을 위험하게 만들지 않은 건 다행이지만, 이번 실패는 기록할게.'};
    return {reply:choice==='accept'?route.accept:route.decline,speaker:route.person,reaction:choice==='accept'?'알겠어. 첫 임무와 연락 방법은 따로 전하겠네.':'알겠어. 이번에는 다른 사람을 찾을게. 네 결정은 존중해.'};
  }
  const api={jobs,skills,routes,canChange,requirement,schedule,invitation,mission,choices,reply};
  if(typeof module!=='undefined')module.exports=api;
  root.Careers=api;
})(globalThis);
