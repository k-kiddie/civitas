'use strict';
(function(root) {
  const institutions = typeof module !== 'undefined' ? require('./institutions') : root.Institutions;
  function choice(id,reply,detail,reaction,effects) { return {id,reply,detail,reaction,effects}; }
  const templates = [
    {
      id:'extraShift',title:'갑자기 빈 교대표',person:'은호',scene:'opening-factory',
      eligible:state=>['worker','apprentice','artisan'].includes(state.career),
      text:'아픈 동료 대신 야간 일을 맡아 달라는 부탁이 왔다.',
      line:'오늘 밤만 교대를 바꿔 줄 수 있어? 수당은 네 몫으로 넘길게. 피곤하면 거절해도 돼.',
      choices:[choice('help','오늘 밤은 내가 맡을게.','기력 12 · 수입 +14','고마워. 네가 쉬어야 할 때도 이야기해 줘.',{energy:-12,cash:14}),choice('rest','오늘은 나도 쉬어야겠어.','기력 +8 · 지지 −1','알겠어. 다른 사람을 찾아볼게.',{energy:8,support:-1})]
    },
    {
      id:'arrears',title:'문 앞에서 기다리는 부탁',person:'소라',scene:'storm-partial',
      eligible:state=>state.cash<12,
      text:'생활비가 빠듯한 당신에게도 이웃이 일감을 부탁한다.',line:'짐을 옮겨 줄 사람이 필요해요. 오늘 도와주면 12크라운을 줄 수 있어요.',
      choices:[choice('carry','짐을 함께 옮기죠.','기력 8 · 수입 +12','약속한 품삯이에요. 당신에게도 도움이 됐으면 해요.',{energy:-8,cash:12}),choice('decline','지금은 도와드리기 어렵겠어요.','추가 비용 없음','알겠어요. 다음에 다시 이야기해요.',{})]
    },
    {
      id:'wellRepair',title:'낡은 급수관의 물소리',person:'다솔',scene:'opening-farm',
      eligible:state=>state.career==='farmer'||state.career==='medic',
      text:'공동 급수관이 새기 시작했다. 주민들이 작은 수리 모임을 꾸린다.',line:'재료비를 조금씩 모으고 있어. 돈을 보태거나 직접 수리 일을 도와줄래?',
      choices:[choice('fund','재료비를 보탤게요.','개인 돈 6 · 지지 +5','오늘 안에 수리할 수 있겠어. 네 이름도 기여 명단에 적을게.',{cash:-6,support:5}),choice('labor','돈 대신 수리를 돕겠습니다.','기력 10 · 지지 +3','같이 손을 보태 줘서 고마워.',{energy:-10,support:3}),choice('decline','이번에는 참여하기 어렵겠어요.','지지 −2','알겠어. 다른 주민들과 먼저 시작할게.',{support:-2})]
    },
    {
      id:'source',title:'제보자의 이름을 묻는 사람',person:'민석',scene:'opening-police',
      eligible:state=>['journalist','investigator','policeAide','undercover'].includes(state.career),
      text:'거래 내역에 관한 제보가 왔다. 상대는 자신의 신원을 숨겨 달라고 했다.',line:'사실 확인에는 시간이 걸리네. 이름을 넘기면 도윤이 돈을 주겠다는 말도 들었어. 어떻게 처리하겠나?',
      choices:[choice('verify','출처를 보호하고 사실부터 확인하겠습니다.','기력 10 · 지지 +5','제보자를 노출하지 않고 확인한 내용을 기록하겠네.',{energy:-10,support:5}),choice('sell','신원을 넘기고 대가를 받겠습니다.','수입 +12 · 지지 −8','이번 선택은 나도 기억하겠네. 다음 제보자가 찾아올지는 모르겠어.',{cash:12,support:-8}),choice('decline','이번 제보는 맡기 어렵겠습니다.','추가 비용 없음','알겠네. 신원은 다른 담당자가 보호하도록 하지.',{})]
    },
    {
      id:'supplies',title:'훈련 전에 비어 있는 상자',person:'민석',scene:'opening-police',
      eligible:state=>institutions.active(state)&&state.institution.department==='army'&&state.institution.supplies<35,
      text:'훈련 일정은 다가오지만 보급 창고의 재고가 부족하다.',line:'부족분을 조달하거나 훈련 강도를 낮춰야 해. 빈 창고를 채워졌다고 보고할 수는 없지.',
      choices:[choice('procure','예산으로 부족분을 조달하겠습니다.','직급 1 이상 · 기관 예산 6 · 군수품 +10','도착 물품과 지출 내역을 함께 기록하겠네.',{budget:-6,supplies:10,needsRank:1}),choice('reduce','이번 훈련 강도를 낮추겠습니다.','준비도 −4 · 추가 비용 없음','보급 수준에 맞춰 일정을 줄이겠네.',{readiness:-4})]
    },
    {
      id:'agencyPressure',title:'친분이 적힌 신청서',person:'지안',scene:'opening-clerk',
      eligible:state=>institutions.active(state)&&state.institution.department!=='army',
      text:'유력 인사가 자신의 지인 신청을 먼저 처리해 달라고 요구했다.',line:'접수 순서를 지킬까요? 그쪽에서는 빨리 처리해 주면 사례하겠다고 하네요.',
      choices:[choice('order','접수 순서대로 검토하겠습니다.','기력 8 · 실적 +3 · 감사 주목도 −3','처리 근거를 남겨 둘게요.',{energy:-8,merit:3,scrutiny:-3}),choice('favor','그 신청을 먼저 처리하겠습니다.','수입 +10 · 감사 주목도 +15','순서를 바꾼 경위도 기록에는 남겨야겠어요.',{cash:10,scrutiny:15}),choice('defer','공식 검토 일정에 맞춰 처리하겠습니다.','추가 비용 없음','접수 기한을 지키는 것으로 회신할게요.',{})]
    },
    {
      id:'networkFriction',title:'모임 안에서 나온 불만',person:'지안',scene:'hearing',
      eligible:state=>Boolean(state.network?.members.length),
      text:'개인 조직 구성원들이 다음 인사와 역할 배분을 두고 갈등한다.',line:'서로 자기 기여를 인정받고 싶어 해요. 직접 이야기를 듣거나 이번에는 맡겨 두겠어요?',
      choices:[choice('listen','모두의 이야기를 직접 듣겠습니다.','기력 10 · 구성원 충성 +5','서로의 말을 듣는 자리를 마련할게요.',{energy:-10,loyalty:5}),choice('leave','이번에는 구성원들끼리 정하게 하죠.','구성원 충성 −3','결정은 맡기겠지만 불만도 남을 수 있어요.',{loyalty:-3})]
    },
    {
      id:'publicReading',title:'읽을 수 없는 계약서',person:'서윤',scene:'opening-clerk',
      eligible:state=>['teacher','clerk','trader','councillor'].includes(state.career),
      text:'시민 한 명이 이해하지 못하는 계약서를 들고 찾아왔다.',line:'서명하기 전에 설명을 듣고 싶대요. 지금 함께 읽어 줄 수 있을까요?',
      choices:[choice('explain','조건을 하나씩 함께 읽어 드리겠습니다.','기력 8 · 지지 +4','자기가 무엇에 서명하는지 알고 돌아갔어요.',{energy:-8,support:4}),choice('decline','오늘은 제 일을 먼저 끝내야겠어요.','수입 +6 · 지지 −2','알겠어요. 다른 서기를 찾아볼게요.',{cash:6,support:-2})]
    }
  ];
  function roll(state) {
    let seed=state.randomState.seed>>>0;
    seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
    state.randomState.seed=seed>>>0;
    return (seed>>>0)/4294967296;
  }
  function eligible(state) {
    return templates.filter(item=>item.eligible(state)&&state.day-(state.randomState.seen[item.id]??-100)>=14);
  }
  function schedule(state) {
    const random=state.randomState;
    if(!state.startConfigured||state.day<6||random.checkedDay===state.day)return null;
    random.checkedDay=state.day;
    if(state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||state.day-random.lastDay<4||!['none','complete'].includes(state.jobStory.stage))return null;
    if(state.followUps.some(item=>item.day<=state.day+1))return null;
    const candidates=eligible(state);
    if(!candidates.length||roll(state)>.45)return null;
    const item=candidates[Math.floor(roll(state)*candidates.length)];
    random.lastDay=state.day;random.seen[item.id]=state.day;
    return {id:'random-'+item.id+'-'+state.day,randomType:item.id,day:state.day,scene:item.scene,title:item.title,text:item.text,destination:'city',dialogue:[{speaker:item.person,text:item.line}],randomChoices:item.choices,randomPerson:item.person};
  }
  function choices(state,event) {
    return event.randomChoices.map(item=>({id:item.id,title:item.reply,detail:item.detail,
      disabled:(item.effects.cash<0&&state.cash< -item.effects.cash)||(item.effects.energy<0&&state.energy< -item.effects.energy)||(item.effects.budget<0&&state.institution.agencyBudget< -item.effects.budget)||(item.effects.needsRank&&state.institution.rank<item.effects.needsRank)}));
  }
  function reply(event,id) {
    const selected=event.randomChoices.find(item=>item.id===id);
    return {reply:selected.reply,speaker:event.randomPerson,reaction:selected.reaction};
  }
  function resolve(state,event,id) {
    const item=event.randomChoices.find(value=>value.id===id);
    const effects=item.effects;
    state.cash+=effects.cash||0;
    state.energy=Math.max(0,Math.min(100,state.energy+(effects.energy||0)));
    state.support=Math.max(0,Math.min(100,state.support+(effects.support||0)));
    state.institution.agencyBudget+=effects.budget||0;
    state.institution.merit=Math.max(0,state.institution.merit+(effects.merit||0));
    state.institution.supplies=Math.max(0,Math.min(100,state.institution.supplies+(effects.supplies||0)));
    state.institution.readiness=Math.max(0,Math.min(100,state.institution.readiness+(effects.readiness||0)));
    state.institution.scrutiny=Math.max(0,state.institution.scrutiny+(effects.scrutiny||0));
    if(effects.loyalty&&state.network)for(const member of state.network.members)member.loyalty=Math.max(0,Math.min(100,member.loyalty+effects.loyalty));
    return item.detail+'. '+item.reaction;
  }
  const api={templates,eligible,schedule,choices,reply,resolve};
  if(typeof module!=='undefined')module.exports=api;
  root.RandomEvents=api;
})(globalThis);
