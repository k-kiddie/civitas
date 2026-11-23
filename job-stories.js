'use strict';
(function (root) {
  function option(id, reply, detail, reaction, effects, next = null) {
    return { id, reply, detail, reaction, effects, next };
  }

  function create(episode, state) {
    const evidence = Boolean(state.jobStory.evidence);
    const helped = state.jobStory.opening === 'help';
    const episodes = {
      factoryRecords: {
        title: '반장이 내민 봉투', person: '은호', scene: 'opening-factory',
        text: '반장이 당신 몫의 체불 임금만 먼저 주겠다고 한다. 은호는 모두의 임금 명부를 확인하자고 한다.',
        lines: [helped ? '첫날 함께 봤던 명부, 반장이 치웠어. 하지만 사무실에 사본이 남아 있대.' : '첫날에는 시간이 없었지. 지금이라도 같이 확인해 줄 수 있어?', '반장은 네 임금만 먼저 줄 테니 조용히 있으래. 다른 사람들은 계속 기다려야 하고.'],
        choices: [
          option('copy', '사본을 확보하자. 내가 야간 기록을 맡을게.', '기력 8 · 임금 명부 사본 확보 · 이틀 뒤 협상', '좋아. 사본을 갖고 모두가 있는 자리에서 이야기하자.', {energy:-8,evidence:true}, 'factoryTalk'),
          option('envelope', '내 몫이라도 먼저 받아야겠어.', '소지금 +12 · 지지 −4 · 이틀 뒤 반장과 면담', '네 사정은 알겠어. 다음 면담에는 다른 동료들 이름도 떠올려 줘.', {cash:12,support:-4,evidence:false}, 'factoryTalk')
        ]
      },
      factoryTalk: {
        title: evidence ? '명부를 펼친 협상 자리' : '나만의 계약서', person:'은호', scene:'opening-factory',
        text: evidence ? '반장과 동료들이 작업대 앞에 모였다. 명부 사본에는 지급하지 않은 임금이 남아 있다.' : '반장이 개인 계약서를 내밀었다. 은호와 동료들은 문밖에서 기다리고 있다.',
        lines: [evidence ? '사본과 원본을 맞춰 봤어. 이걸 내면 체불 임금 지급을 요구할 수 있어.' : '우리가 가진 건 말뿐이야. 네가 받은 봉투에는 다른 사람 몫이 없었고.', '개인 계약은 네 품삯을 올려 준대. 대신 다른 동료들의 문제는 더 꺼내지 말라고 해.'],
        choices: [
          option('collective', '모두의 체불 임금을 지급하고 약속을 기록하자.', evidence ? '체불 임금 +18 · 지지 +10 · 공동 지급 합의' : '명부 사본 필요', '좋아. 함께 받은 합의서에는 동료들 이름도 남길게.', {cash:18,support:10,needsEvidence:true,outcome:'collective'}),
          option('petition', '증거가 부족하면 동료들 진술부터 공개하자.', '기력 8 · 지지 +8 · 개인 승급 포기', '당장 돈을 받지는 못해도 우리 진술은 남길 수 있겠네.', {energy:-8,support:8,outcome:'petition'}),
          option('personal', '개인 계약에 서명하겠어.', '공장 품삯 +2 · 지지 −8 · 은호가 기억함', '네 선택이구나. 다음에 우리가 일손을 멈추면 넌 어느 쪽에 있을까?', {wageBonus:2,support:-8,outcome:'personal'})
        ]
      },
      policeSearch: {
        title:'원본을 찾는 밤', person:'민석', scene:'opening-police',
        text:'사라진 체포 기록의 원본이 지하 보관실에 있다는 제보가 왔다. 상관은 이미 종결된 일이라고 말한다.',
        lines:[helped ? '첫날 확인한 누락을 추적했어. 기록을 옮긴 시각이 보관실 출입부에 남았어.' : '네가 기록 정리를 하는 동안 내가 출입부를 찾았네. 아직 원본을 확인할 기회는 있어.', '상관은 여기서 그만두라고 하네. 정리 수당을 받거나, 나와 함께 보관실에 갈 수 있어.'],
        choices:[
          option('preserve','보관실에 가서 사본을 보존하겠습니다.','기력 8 · 체포 원본 사본 확보 · 이틀 뒤 보고','그 사본의 출처도 기록해 둬. 공개할 때 필요할 걸세.',{energy:-8,evidence:true},'policeReport'),
          option('obey','지시대로 기록 정리만 하겠습니다.','소지금 +8 · 지지 −3 · 이틀 뒤 보고','알겠네. 하지만 사건이 지워지는 걸 보고도 몰랐다고 할 수는 없지.',{cash:8,support:-3,evidence:false},'policeReport')
        ]
      },
      policeReport: {
        title:evidence ? '지울 수 없는 사본' : '서명만 남은 보고서', person:'민석', scene:'opening-police',
        text:'상관이 사건 종결 보고서에 서명하라고 한다. 민석은 공개 기록에 무엇을 남길지 묻는다.',
        lines:[evidence ? '보존한 원본에는 체포된 상인의 이름이 있어. 종결 보고서와 모순되지.' : '사본을 확보하지 못했어. 지금 가능한 일은 누락 사실을 진술하거나 종결에 동의하는 걸세.', '공개하면 추천서에도 이 일을 적겠네. 조용히 끝내면 상관은 수당을 주겠지만, 난 그 결정도 기록할 걸세.'],
        choices:[
          option('report','원본과 누락 경위를 공개하겠습니다.',evidence ? '지지 +8 · 경찰 기록 공개 · 민석 추천 확보' : '원본 사본 필요','그 자료를 공식 보관하겠네. 기록을 지키는 사람을 수사에 추천할 수 있지.',{needsEvidence:true,recommendation:true,support:8,outcome:'reported'}),
          option('testify','제가 확인한 누락 사실만이라도 진술하겠습니다.','기력 8 · 지지 +5 · 누락 진술 기록','자네가 직접 본 범위까지 적겠네. 없는 증거를 만들어서는 안 돼.',{energy:-8,support:5,outcome:'testified'}),
          option('close','종결 보고서에 서명하겠습니다.','소지금 +12 · 지지 −8 · 기록 은폐에 동의','보고서는 접수하겠네. 언젠가 누가 이 기록을 다시 열 수도 있어.',{cash:12,support:-8,outcome:'closed'})
        ]
      }
    };
    const item = episodes[episode];
    if (!item) return null;
    return { id:'job-' + episode, day:state.day, jobEpisode:episode, scene:item.scene, title:item.title, text:item.text, destination:'city',
      dialogue:item.lines.map(text=>({speaker:item.person,text})), jobPerson:item.person, jobChoices:item.choices };
  }

  function choices(state, event) {
    return event.jobChoices.map(item=>({ id:item.id, title:item.reply, detail:item.detail,
      disabled:(item.effects.energy && state.energy < -item.effects.energy) || (item.effects.needsEvidence && !state.jobStory.evidence) }));
  }

  function resolve(state, event, choiceId) {
    const selected = event.jobChoices.find(item=>item.id === choiceId);
    const effects = selected.effects;
    state.cash += effects.cash || 0;
    state.energy += effects.energy || 0;
    state.support = Math.max(0,Math.min(100,state.support + (effects.support || 0)));
    if (Object.hasOwn(effects,'evidence')) state.jobStory.evidence = effects.evidence;
    if (effects.recommendation) state.policeRecommendation = true;
    if (effects.wageBonus) state.jobStory.wageBonus = effects.wageBonus;
    if (effects.outcome) state.jobStory.outcome = effects.outcome;
    if (selected.next) {
      state.followUps.push({ type:'job', episode:selected.next, day:state.day + 2 });
      state.jobStory.stage = 'waiting';
    } else state.jobStory.stage = 'complete';
    return `${event.jobPerson} “${selected.reaction}” ${selected.detail}`;
  }
  const api = {create,choices,resolve};
  if (typeof module !== 'undefined') module.exports = api;
  root.JobStories = api;
})(globalThis);
