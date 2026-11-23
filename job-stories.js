'use strict';
(function (root) {
  function option(id, reply, detail, reaction, effects, next = null) {
    return { id, reply, detail, reaction, effects, next };
  }

  function create(episode, state) {
    const evidence = Boolean(state.jobStory.evidence);
    const helped = state.jobStory.opening === 'help';
    const episodes = {
      farmRecords: {
        title:'사용권 계약의 행방', person:'다솔', scene:'opening-farm', text:'공동 우물 사용권 사본이 마을 문서함에 남아 있다는 소식이다. 지주는 당장 사용료를 내면 물을 주겠다고 한다.',
        lines:[helped?'첫날 살핀 봉인 번호로 계약을 찾았어. 문서함을 열려면 주민 입회가 필요해.':'네가 밭일을 하는 사이 사본이 있다는 소식을 들었어. 아직 확인할 시간은 있어.', '같이 사본을 확인할래? 아니면 당장 지주에게 돈을 내고 물부터 받을까?'],
        choices:[
          option('copy','주민들과 사본부터 확인하죠.','기력 8 · 공동 사용권 사본 · 이틀 뒤 중재','좋아. 마을 사람들도 증인으로 부를게.',{energy:-8,evidence:true},'farmHearing'),
          option('water','당장 쓸 물부터 구하겠습니다.','소지금 −8 · 임시 급수 · 이틀 뒤 중재','오늘은 버틸 수 있겠네. 하지만 사용권 문제는 그대로야.',{cash:-8,evidence:false},'farmHearing')
        ]
      },
      farmHearing: {
        title:evidence?'공동 사용권을 되찾는 자리':'지주의 새 사용료', person:'다솔', scene:'opening-farm', text:'마을 중재인이 공동 우물 문제를 듣는다. 지주는 사용권을 인정하려면 등록 비용이 필요하다고 한다.',
        lines:[evidence?'사본에는 우물의 공동 사용권이 명시돼 있어. 등록 비용만 내면 마을 이름으로 바로잡을 수 있대.':'사용권 사본을 찾지 못했어. 지금은 주민들의 사용 내역을 진술하거나 돈을 내야 해.', '혼자 계속 물값을 감당할지, 공동 권리를 주장할지 정해야 해.'],
        choices:[
          option('restore','공동 사용권을 다시 등록하겠습니다.','사본 필요 · 소지금 −12 · 지지 +12 · 우물 권리 회복','마을 이름을 계약에 올렸어. 당신이 낸 비용도 기록해 둘게.',{needsEvidence:true,cash:-12,support:12,outcome:'waterRestored'}),
          option('petition','주민들의 사용 내역을 진술하겠습니다.','기력 8 · 지지 +8 · 압류 분쟁 계속','지금 되찾지는 못했지만 진술을 남겼어. 다음 심사에서 다시 이야기할 수 있어.',{energy:-8,support:8,outcome:'waterPetition'}),
          option('rent','당분간 제 몫의 물값을 내겠습니다.','매일 생활비 +2 · 지지 −4','알겠어. 마을 사람들은 공동 권리를 계속 요구할 거야.',{livingExpense:2,support:-4,outcome:'waterRent'})
        ]
      },
      clerkRecords: {
        title:'이관 명부의 두 번째 사본', person:'서윤', scene:'opening-clerk', text:'폐기 예정 문서함에 이관 전 명부가 남아 있다. 상관은 문서를 넘기면 추가 수당을 주겠다고 한다.',
        lines:[helped?'첫날 함께 확인했던 누락이 맞아요. 이관 전 사본에는 농민 이름이 남아 있어요.':'당신이 필사하는 동안 이관 전 사본을 찾았어요. 이름을 대조할 시간이 아직 있어요.', '사본을 보존할지, 지시대로 상관에게 넘길지 정해야 해요.'],
        choices:[
          option('preserve','원본 출처를 적고 사본을 보존하겠습니다.','기력 8 · 토지 명부 사본 · 이틀 뒤 면담','출처까지 남기면 이 문서를 없던 일로 만들기는 어렵겠죠.',{energy:-8,evidence:true},'clerkDisclosure'),
          option('handover','상관에게 이관하고 수당을 받겠습니다.','소지금 +10 · 지지 −3 · 이틀 뒤 면담','알겠어요. 제가 누락 목록이라도 따로 남겨 둘게요.',{cash:10,support:-3,evidence:false},'clerkDisclosure')
        ]
      },
      clerkDisclosure: {
        title:evidence?'공개 기록에 남길 이름들':'상관의 추천서', person:'서윤', scene:'opening-clerk', text:'상관은 침묵하면 품삯을 올려 주겠다고 한다. 지안은 명부를 의회 기록으로 넘길 수 있다고 전했다.',
        lines:[evidence?'보존한 사본을 공개하면 지안이 공식 기록으로 보관하겠대요.':'원본 사본이 없어서 소유권을 증명하기는 어려워요. 그래도 누락 사실을 진술할 수는 있어요.', '상관은 개인 승급을 약속했어요. 하지만 농민들 이름은 그 계약에 없겠죠.'],
        choices:[
          option('publish','사본을 의회 공개 기록으로 넘기겠습니다.','사본 필요 · 지지 +8 · 지안의 협의회 추천','지안에게 정식 접수할게요. 명부를 지켜 낸 사람으로 당신을 소개하겠어요.',{needsEvidence:true,councilRecommendation:true,support:8,outcome:'landPublished'}),
          option('testify','제가 확인한 누락 사실만 진술하겠습니다.','기력 8 · 지지 +5 · 누락 진술 기록','직접 본 범위부터 정확히 기록할게요.',{energy:-8,support:5,outcome:'landTestified'}),
          option('patron','상관의 개인 승급을 받아들이겠습니다.','서기 품삯 +2 · 지지 −6','추천서는 받겠네요. 지워진 이름들은 계속 제가 찾아볼게요.',{wageBonus:2,support:-6,outcome:'patron'})
        ]
      },
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
      disabled:(item.effects.cash && state.cash < -item.effects.cash) || (item.effects.energy && state.energy < -item.effects.energy) || (item.effects.needsEvidence && !state.jobStory.evidence) }));
  }

  function resolve(state, event, choiceId) {
    const selected = event.jobChoices.find(item=>item.id === choiceId);
    const effects = selected.effects;
    state.cash += effects.cash || 0;
    state.energy += effects.energy || 0;
    state.support = Math.max(0,Math.min(100,state.support + (effects.support || 0)));
    if (Object.hasOwn(effects,'evidence')) state.jobStory.evidence = effects.evidence;
    if (effects.councilRecommendation) state.councilRecommendation = true;
    if (effects.livingExpense) state.jobStory.livingExpense = effects.livingExpense;
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
