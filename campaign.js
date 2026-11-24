'use strict';
(function (root) {
  const projects = typeof module !== 'undefined' ? require('./work-projects') : root.WorkProjects;
  const echoes = typeof module !== 'undefined' ? require('./career-echoes') : root.CareerEchoes;
  const chronicles = typeof module !== 'undefined' ? require('./chronicles') : root.Chronicles;
  const society = typeof module !== 'undefined' ? require('./society') : root.Society;
  const succession = typeof module !== 'undefined' ? require('./succession') : root.Succession;
  const family = typeof module !== 'undefined' ? require('./family') : root.Family;
  const life = typeof module !== 'undefined' ? require('./life') : root.Life;
  const council = typeof module !== 'undefined' ? require('./council') : root.Council;
  const pacts = typeof module !== 'undefined' ? require('./pacts') : root.Pacts;
  const parties = typeof module !== 'undefined' ? require('./parties') : root.Parties;
  const politics = typeof module !== 'undefined' ? require('./politics') : root.Politics;
  const underworld = typeof module !== 'undefined' ? require('./underworld') : root.Underworld;
  const randomEvents = typeof module !== 'undefined' ? require('./random-events') : root.RandomEvents;
  const agencies = typeof module !== 'undefined' ? require('./agencies') : root.Agencies;
  const institutions = typeof module !== 'undefined' ? require('./institutions') : root.Institutions;
  const jobStories = typeof module !== 'undefined' ? require('./job-stories') : root.JobStories;
  const careers = typeof module !== 'undefined' ? require('./careers') : root.Careers;
  const starts = typeof module !== 'undefined' ? require('./starts') : root.Starts;
  const harbor = typeof module !== 'undefined' ? require('./src/shared/harbor') : root.HarborRules;
  const plans = harbor.plans;
  function fresh() {
    return { version: 3, age:null, ageChosen:false, underworld:underworld.fresh(), day: 1, actions: 2, cash: 32, energy: 80, name: '시민', gender: 'unspecified', profileSet: false, place: 'harbor', startConfigured: false, background: 'worker', startingOccupation: 'worker',
      surveyed: false, testimony: false, funding: null, built: null, flooded: null,
      life:life.fresh(), council:council.fresh(), pacts:pacts.fresh(), parties:parties.fresh(), politics:politics.fresh(), candidate: false, election: null, policy: null, support: 25, memories: [], journal: [],
      promise: null, notices: [], witness: false,
      underReview: false, barredInvestigator: false, policeRecommendation: false, councilRecommendation: false,
      agencies: agencies.initial(), unassignedOfficials: 30, agencyProposal: null, agencyHistory: [], nextAgencyProposal: 1,
      randomState: {seed:0x61c1a5,checkedDay:0,lastDay:-10,seen:{}},
      institution: institutions.fresh(), network: null,
      skills: {}, recruitment: {}, careerDutyDay: 0, secretMissionDone: false, officeResigned: false,
      career: 'worker', treasury: 40, caseStage: 'closed', contractRelief: false,
      hearing: null, bill: null, hearingRecord: null, eventQueue: [], storyHistory: [], followUps: [],
      jobStory: { stage:'none', opening:null, evidence:false, wageBonus:0, outcome:null },
      residents: { harbor: 48, village: 26, hill: 12 } };
  }
  function record(state, text) { state.journal.unshift({ day: state.day, text }); }
  function remember(state, person, text) { state.memories.push({ person, text, day: state.day }); }
  function normalize(state,owned=false) {
    const result = { ...fresh(), ...state };
    result.startConfigured = state.startConfigured ?? (state.profileSet || state.day > 1 || state.journal.length > 0);
    if (!state.jobStory && starts.occupations[result.startingOccupation]?.firstEpisode) {
      const opening = result.storyHistory.find(item => item.id === 'opening');
      if (opening) {
        result.jobStory.opening = opening.choice;
        result.jobStory.stage = 'waiting';
        result.followUps = [...result.followUps, {type:'job', episode:starts.occupations[result.startingOccupation].firstEpisode, day:result.day + 2}];
      }
    }
    if(!state.politics && result.election)result.election={...result.election,day:result.election.day??20,ran:result.election.ran??Boolean(result.election.won||state.candidate)};
    if(!state.politics && state.day>=20){
      result.politics.nextDay=20+(Math.floor((state.day-20)/28)+1)*28;
      result.politics.round=Math.floor((state.day-20)/28)+2;
      result.candidate=false;
    }
    if(result.politics.nextDay<=state.day)result.politics={...result.politics,nextDay:result.politics.nextDay+28*(Math.floor((state.day-result.politics.nextDay)/28)+1)};
    if (result.election?.won && (result.election.actor??'player')===(result.life?.activeId||'player') && !result.officeResigned) result.career = 'mayor';
    if (result.caseStage === 'sealed' && !result.underReview && !result.followUps.some(item => item.type === 'oversight')) {
      result.followUps = [...result.followUps, { type: 'oversight', day: result.day + 3 }];
    }
    result.council={...council.fresh(),...state.council};
    council.restore(result);
    result.pacts={...pacts.fresh(),...state.pacts};
    result.politics={...result.politics};
    politics.ensureField(result);
    life.restore(result,lifeDescriptor(result),owned);
    return result;
  }
  function electionResult(state) { return politics.result(state.politics?state:normalize(state)); }
  function hearingStrength(state) {
    const hearing = state.hearing;
    if (!hearing) return 0;
    const heard = hearing.heard || [];
    let score = 0;
    if (heard.includes('윤') && state.surveyed) score += 1;
    if (heard.includes('소라') && state.testimony && state.promise !== 'broken') score += 1;
    if (heard.includes('민석') && state.witness) score += 1;
    if (hearing.evidence) score += 2;
    if (state.support >= 40 || state.promise === 'kept') score += 1;
    return score;
  }
  function eventDialogue(state, event) {
    if (event.dialogue) return event.dialogue;
    if (event.id === 'opening') {
      const job = starts.occupations[event.occupation];
      return [{ speaker: job.person, text: job.opening }, { speaker: job.person, text: '네 사정도 있을 테니 직접 정해 줘. 오늘의 선택은 기억하겠어.' }];
    }
    if (event.id === 'oversight') return [
      { speaker: '민석', text: '봉인된 수사 기록과 도윤에게 받은 돈. 둘이 무관하다고 말할 수 있습니까?' },
      { speaker: '도윤', text: '서로 합의한 돈이었소. 당신이 이 일을 공개하면 나도 가만있지는 않겠소.' },
      { speaker: '민석', text: '지금부터 직무와 주급이 정지됩니다. 돈을 반환하고 시정할지, 공개 심사를 받을지 결정하십시오.' }
    ];
    if (event.id === 'storm') return [
      { speaker: '소라', text: state.promise === 'broken' ? '당신, 어촌을 지킨다고 했잖아요. 지금 저 집들을 봐요.' : state.flooded === 0 ? '물이 제방 밖에서 멈췄어요. 사람들이 밤새 서로의 집을 확인했어요.' : '사람들이 젖은 짐을 들고 언덕에 모였어요. 오늘 밤부터 어디서 자죠?' },
      { speaker: '윤', text: state.flooded === 0 ? '제방은 버텼지만 배급과 물자 정리는 남았어. 누군가는 도와야 해.' : '복구하려면 돈도, 손도 필요해. 그전에 누가 무엇을 잃었는지부터 알아야 하고.' },
      { speaker: '소라', text: '여기 남아서 도와줄 건가요? 당신도 먹고살아야 한다는 건 알아요.' }
    ];
    if (event.id === 'election' && (event.election || state.election)?.won) return [
      { speaker: '지안', text: `${state.name} 님, 개표가 끝났어요. 당신이 동장이에요.` },
      { speaker: '소라', text: state.promise === 'broken' ? '당선된 건 인정해요. 하지만 지난번 약속도 잊지는 않았어요.' : '축하 인사는 내일 할게요. 오늘도 집에 못 돌아간 사람들이 있어요.' },
      { speaker: '지안', text: '첫 예산과 첫 일정에 무슨 말을 적을까요?' }
    ];
    if (event.id === 'election') return [
      { speaker: '지안', text: (event.election || state.election)?.ran ? '개표가 끝났어요. 이번 선거는 '+(event.election || state.election).winner+' 후보가 이겼어요.' : (event.election || state.election).winner+' 후보가 선출됐어요. 주민들이 회의장으로 가고 있어요.' },
      { speaker: '소라', text: '선거가 끝났다고 동네 일이 끝나는 건 아니잖아요. 다음 회의에 같이 와 줄래요?' }
    ];
    if (event.scene === 'hearing') return [
      { speaker: '지안', text: '청문회를 시작하겠습니다. 오늘의 발언과 증거는 공개 기록에 남습니다.' },
      { speaker: '도윤', text: state.funding === 'merchant' ? '제방 공사비는 내가 댔소. 계약에 적힌 서명은 당신 것도 맞지?' : '장부부터 확인합시다. 소문으로 누군가의 책임을 정할 순 없소.' },
      { speaker: '민석', text: '누구에게 먼저 질문하겠습니까? 당신이 가진 사본도 제출할 수 있습니다.' }
    ];
    return [{ speaker: event.id.includes('housing') ? '윤' : '소라', text: event.text }];
  }
  function eventReply(event, choice) {
    if(event.workAgreement)return projects.agreements.reply(event,choice);
    if(event.workProject)return projects.reply(event,choice);
    if(event.careerEcho)return echoes.reply(event,choice);
    if(event.chronicle)return chronicles.reply(event,choice);
    if(event.reunion)return society.reply(event,choice);
    if(event.successionOffer)return succession.reply(event,choice);
    if(event.familyOffer)return family.reply(event,choice);
    if(event.councilMeeting)return council.meetingReply(event,choice);
    if(event.pactOffer)return pacts.reply(event,choice);
    if(event.partyDecision)return parties.decisionReply(choice);
    if(event.underworldRole || event.underworldReview)return underworld.reply(event,choice);
    if (event.randomType) return randomEvents.reply(event,choice);
    if (event.institutionAudit) return institutions.auditReply(choice);
    if (event.recruitCareer || event.missionCareer) return careers.reply(event,choice);
    if (event.jobEpisode) {
      const item = event.jobChoices.find(option => option.id === choice);
      return { reply:item.reply, speaker:event.jobPerson, reaction:item.reaction };
    }
    const replies = {
      repay: ['받은 돈을 반환하고 기록을 바로잡겠습니다.', '민석', '반환 기록과 시정 보고서를 남기겠습니다. 같은 일이 반복되면 추천할 수 없습니다.'],
      defend: ['공개 청문회에서 증거와 함께 설명하겠습니다.', '민석', '사흘 뒤에 뵙겠습니다. 통과해도 받은 돈 20크라운은 환수됩니다. 부결되면 해임입니다.'],
      resign: ['수사관 자리에서 물러나겠습니다.', '민석', '사직은 수리하겠습니다. 이 일은 인사 기록에 남습니다.'],
      aid: ['내 돈을 보탤게요. 오늘 필요한 물자부터 구하죠.', '소라', '고마워요. 누가 무엇을 받았는지 기록해 둘게요. 며칠 뒤 다시 와 주세요.'],
      organize: ['먼저 사람들 이야기를 듣겠어요. 함께 기록하죠.', '소라', '좋아요. 이 일을 숫자로만 남기지는 말아 주세요. 제가 증언할게요.'],
      livelihood: ['지금은 제 품삯부터 벌어야 해요.', '소라', '알겠어요. 당신 없이 먼저 시작할게요. 기다리는 사람들은 오늘도 있어요.'],
      housing: ['첫 예산은 집을 잃은 사람들에게 쓰겠습니다.', '윤', '그럼 내가 공사를 맡지. 사흘 뒤에 입주 명단을 가져오겠어.'],
      audit: ['항만 계약부터 공개적으로 검토하겠습니다.', '지안', '당신의 서명도 검토 대상이에요. 그 각오까지 기록할게요.'],
      pause: ['오늘 하루는 쉬고 싶어요.', '소라', '쉬세요. 대신 내일은 주민들 앞에서 직접 말해 줘요.'],
      delegation: ['같이 가겠어요. 주민들 이야기는 계속 들어야죠.', '소라', '그럼 다음 회의에서 봐요. 서로 동의하지 않는 일도 이야기해요.'],
      work: ['일단 부두로 돌아갈게요. 생활비가 밀렸어요.', '소라', '알겠어요. 회의록은 남겨 둘게요. 다음에는 당신 자리도 있었으면 해요.']
    };
    if (event.id === 'opening') {
      const job = starts.occupations[event.occupation];
      const option = job.options.find(item => item.id === choice);
      return { reply: option.reply, speaker: job.person, reaction: choice === 'help' ? '함께 확인해 줘서 고마워. 이 일은 기록으로 남겨 두자.' : '알겠어. 오늘 일은 내가 마저 알아볼게.' };
    }
    const entry = replies[choice];
    return { reply: entry[0], speaker: entry[1], reaction: entry[2] };
  }
  function eventChoices(state, event) {
    if (!event || event.resolved) return [];
    if(event.workAgreement)return projects.agreements.choices(state,event);
    if(event.workProject)return projects.choices(state,event);
    if(event.careerEcho)return echoes.choices(state,event);
    if(event.chronicle)return chronicles.choices(state,event);
    if(event.reunion)return society.choices(state,event);
    if(event.successionOffer)return succession.choices(state,event);
    if(event.familyOffer)return family.choices(state,event);
    if(event.councilMeeting)return council.meetingChoices(state,event);
    if(event.pactOffer)return pacts.choices(state,event);
    if(event.partyDecision)return parties.decisionChoices();
    if(event.underworldRole || event.underworldReview)return underworld.choices(state,event);
    if (event.randomType) return randomEvents.choices(state,event);
    if (event.institutionAudit) return institutions.auditChoices(state);
    if (event.recruitCareer || event.missionCareer) return careers.choices(state,event);
    if (event.jobEpisode) return jobStories.choices(state,event);
    if (event.id === 'opening') return starts.occupations[event.occupation].options.map(option => ({ id: option.id, title: option.reply, detail: option.detail, disabled: state.energy < 10 }));
    if (event.id === 'oversight') return [
      { id: 'repay', title: '합의금 반환과 기록 시정', detail: '20크라운 반환 · 지지 −4 · 수사관 복직', disabled: state.cash < 20 },
      { id: 'defend', title: '공개 직무 심사 요청', detail: '사흘간 정직 · 통과 시 20크라운 환수 · 부결 시 해임', disabled: Boolean(state.hearing) },
      { id: 'resign', title: '사직서를 제출한다', detail: '수사관 직책과 주급 상실 · 지지 −8 · 재임용 제한', disabled: false }
    ];
    if (event.id === 'storm') return [
      { id: 'aid', title: '내 돈으로 구호 물자를 마련한다', detail: '8크라운 · 주민 지지 +5 · 이틀 뒤 지원 결과', disabled: state.cash < 8 },
      { id: 'organize', title: '소라와 피해 주민의 증언을 모은다', detail: '기력 10 · 주민 지지 +4 · 청문회 증언 확보', disabled: state.energy < 10 },
      { id: 'livelihood', title: '긴급 하역 일자리를 맡는다', detail: '수입 +6크라운 · 주민 지지 −4', disabled: false }
    ];
    if (event.id === 'election' && (event.election || state.election)?.won) return [
      { id: 'housing', title: '첫 예산을 주거 복구에 배정한다', detail: '공금 12 · 사흘 뒤 최대 4가구 복귀', disabled: state.treasury < 12 },
      { id: 'audit', title: '첫 일정으로 항만 계약 청문회를 잡는다', detail: '기력 10 · 사흘 뒤 청문회 개회', disabled: state.energy < 10 || Boolean(state.hearing) || Boolean(state.bill) },
      { id: 'pause', title: '취임 전 하루는 나를 위해 쉰다', detail: '기력 +15 · 주민 지지 −3', disabled: false }
    ];
    if (event.id === 'election') return [
      { id: 'delegation', title: '소라와 함께 주민 대표단을 꾸린다', detail: '기력 10 · 주민 지지 +6 · 소라가 기억함', disabled: state.energy < 10 },
      { id: 'work', title: '부두로 돌아가 밀린 품삯을 번다', detail: '수입 +12크라운 · 주민 지지 −4', disabled: false }
    ];
    return [];
  }
  function transition(state, action,owned=false) {
    const next = normalize(owned?state:JSON.parse(JSON.stringify(state)),owned);
    let message = '';
    const spend = (energy = 0) => {
      if (next.actions < 1 || next.energy < energy) return false;
      next.actions -= 1;
      next.energy -= energy;
      return true;
    };
    if (['start','profile'].includes(action.type)) {
      const age=action.age===undefined ? (state.age ?? 24) : action.age;
      if(!Number.isInteger(age)||age<18||age>100)return {state,message:'나이는 18~100 사이의 정수로 입력해 주세요.'};
      next.age=age;
      next.ageChosen=true;
    }
    if (action.type === 'start') {
      if (next.startConfigured || typeof action.name !== 'string' || !action.name.trim() || !['male','female','unspecified'].includes(action.gender)) return { state, message: '시작 설정을 확인해 주세요.' };
      const background = starts.backgrounds[action.background];
      const job = starts.occupations[action.occupation];
      if (!background || !job) return { state, message: '출신과 첫 직업을 골라 주세요.' };
      next.name = Array.from(action.name.trim()).slice(0,18).join('');
      next.gender = action.gender;
      next.profileSet = true;
      next.startConfigured = true;
      next.underworld.seed=Number.isInteger(action.seed)?(action.seed>>>0)||0x713a91:0x713a91;
      next.randomState.seed=Number.isInteger(action.seed)&&(action.seed>>>0)!==0?action.seed>>>0:0x61c1a5;
      politics.ensureField(next);
      next.background = action.background;
      next.startingOccupation = action.occupation;
      next.career = action.occupation;
      next.cash += background.cash;
      next.support += background.support;
      next.eventQueue.push({ id:'opening', occupation:action.occupation, day:next.day, scene:job.scene, title:job.title, text:job.text, destination:'city' });
      record(next, `${background.name} 출신으로 ${job.name} 일을 시작했다.`);
      return { state:next, message:'' };
    }
    if (action.type === 'profile') {
      if (typeof action.name !== 'string' || !action.name.trim() || !['male','female','unspecified'].includes(action.gender)) return { state, message: '이름과 성별 설정을 확인해 주세요.' };
      next.name = Array.from(action.name.trim()).slice(0,18).join('');
      next.gender = action.gender;
      next.profileSet = true;
      return { state: next, message: '' };
    }
    if (action.type === 'dialogueNext') {
      const event = next.eventQueue[0];
      if (!event || event.id !== action.eventId || event.resolved) return { state, message: '' };
      event.dialogue = eventDialogue(next, event);
      event.dialogueIndex = Math.min((event.dialogueIndex || 0) + 1, event.dialogue.length - 1);
      return { state: next, message: '' };
    }
    if (action.type === 'eventChoice') {
      const event = next.eventQueue[0];
      const choice = eventChoices(next, event).find(item => item.id === action.choice);
      if (!event || event.id !== action.eventId || !choice || choice.disabled) return { state, message: '지금은 이 선택을 할 수 없다.' };
      let result = '';
      if(event.workAgreement){
        result=projects.agreements.resolve(next,event,choice.id);
      } else if(event.workProject){
        result=projects.resolve(next,event,choice.id);
      } else if(event.careerEcho){
        result=echoes.resolve(next,event,choice.id);
      } else if(event.chronicle){
        result=chronicles.resolve(next,event,choice.id);
      } else if(event.reunion){
        result=society.resolve(next,event,choice.id);
      } else if(event.successionOffer){
        result=succession.resolve(next,event,choice.id);
      } else if(event.familyOffer){
        result=family.resolve(next,event,choice.id);
      } else if(event.councilMeeting){
        result=council.resolveMeeting(next,event,choice.id);
      } else if(event.pactOffer){
        result=pacts.resolve(next,event,choice.id);
      } else if(event.partyDecision){
        result=parties.resolve(next,event,choice.id);
      } else if(event.underworldRole || event.underworldReview){
        result=underworld.resolve(next,event,choice.id);
        underworld.review(next);
      } else if (event.randomType) {
        result=randomEvents.resolve(next,event,choice.id);
        remember(next,event.randomPerson,result);
      } else if (event.institutionAudit) {
        if(choice.id==='disclose') {
          next.cash-=12;next.institution.merit=Math.max(0,next.institution.merit-8);
          result='인사 자료를 공개하고 시정 비용 12크라운을 부담했다. 실적 8을 잃고 감사 주목도는 초기화됐다.';
        }else{
          next.career='worker';result='측근 인사 논란으로 보직에서 사임했다. 사조직과 과거 인사 명단은 남았다.';
        }
        next.institution.scrutiny=0;
        remember(next,'지안',result);
      } else if (event.missionCareer) {
        if(choice.id==='protect') {
          next.energy-=8;
          next.support=Math.min(100,next.support+6);
          result='첫 임무에서 이름과 연락망을 보호했다. 연락 상대의 신임을 얻었다.';
        } else {
          next.support=Math.max(0,next.support-3);
          result='첫 임무를 포기했다. 현재 직업은 유지되지만 연락 상대는 실패를 기억한다.';
        }
        next.secretMissionDone=true;
        remember(next,careers.routes[event.missionCareer].person,result);
      } else if (event.recruitCareer) {
        next.recruitment[event.recruitCareer] = choice.id === 'accept' ? 'accepted' : 'declined';
        if (choice.id === 'accept') {
          next.career = event.recruitCareer;
          next.secretMissionDone = false;
          next.followUps.push({type:'secretMission',career:event.recruitCareer,day:next.day+1});
          result = careers.routes[event.recruitCareer].mission;
        } else result = '비공개 제안을 거절했다. 현재 직업과 수입은 유지된다.';
        remember(next,careers.routes[event.recruitCareer].person,result);
      } else if (event.jobEpisode) {
        result = jobStories.resolve(next,event,choice.id);
        remember(next,event.jobPerson,result);
      } else if (event.id === 'opening') {
        const job = starts.occupations[event.occupation];
        result = job.options.find(option => option.id === choice.id).result;
        next.energy -= 10;
        if (choice.id === 'earn') next.cash += 8;
        else if (event.occupation === 'worker') next.surveyed = true;
        else next.support += event.occupation === 'apprentice' ? 6 : 3;
        remember(next, job.person, result);
        next.jobStory.opening = choice.id;
        if (starts.occupations[event.occupation].firstEpisode) {
          next.followUps.push({ type:'job', episode:starts.occupations[event.occupation].firstEpisode, day:next.day + 2 });
          next.jobStory.stage = 'waiting';
        }
      } else if (event.id === 'oversight') {
        if (choice.id === 'repay') {
          next.cash -= 20;
          next.caseStage = 'corrected';
          next.underReview = false;
          next.support = Math.max(0, next.support - 4);
          result = '20크라운을 반환하고 봉인했던 보고서를 시정했다. 민석의 경고와 함께 수사관으로 복직했다.';
        } else if (choice.id === 'defend') {
          next.hearing = { day: next.day + 3, source: 'oversight' };
          result = '사흘 뒤 공개 직무 심사를 요청했다. 결과가 나올 때까지 주급 지급이 정지된다.';
        } else {
          next.career = 'worker';
          next.underReview = false;
          next.barredInvestigator = true;
          next.support = Math.max(0, next.support - 8);
          next.caseStage = 'resigned';
          result = '수사관에서 사직하고 부두 노동자로 돌아왔다. 공직 주급은 끝나지만 삶은 계속된다. 지안의 협의회 추천은 여전히 가능하다.';
        }
        remember(next, '민석', result);
      } else if (event.id === 'storm') {
        if (choice.id === 'aid') {
          next.cash -= 8;
          next.support = Math.min(100, next.support + 5);
          next.followUps.push({ day: next.day + 2, type: 'aid' });
          result = '소라가 구호 물자를 받았다. 이틀 뒤 대피한 가족들의 소식이 돌아온다.';
        } else if (choice.id === 'organize') {
          next.energy -= 10;
          next.support = Math.min(100, next.support + 4);
          next.testimony = true;
          result = '소라와 피해 가족들의 증언을 모았다. 이후 공개 청문회에서 주민의 목소리를 전할 수 있다.';
        } else {
          next.cash += 6;
          next.support = Math.max(0, next.support - 4);
          result = '긴급 하역으로 6크라운을 벌었다. 소라는 당신을 기다리다 주민들과 직접 구호를 시작했다.';
        }
        remember(next, '소라', result);
      } else if (next.election?.won) {
        if (choice.id === 'housing') {
          next.treasury -= 12;
          next.followUps.push({ day: next.day + 3, type: 'housing' });
          result = '윤에게 복구 공사를 맡겼다. 공금 12크라운을 배정했고, 사흘 뒤 입주 결과가 돌아온다.';
          remember(next, '윤', result);
        } else if (choice.id === 'audit') {
          next.energy -= 10;
          next.bill = 'pending';
          next.hearing = { day: next.day + 3, source: 'bill' };
          result = '지안이 첫 청문회를 잡았다. 사흘 뒤 당신의 서명이 담긴 계약도 공개 검토를 받는다.';
          remember(next, '지안', result);
        } else {
          next.energy = Math.min(100, next.energy + 15);
          next.support = Math.max(0, next.support - 3);
          result = '조용히 집으로 돌아갔다. 휴식은 얻었지만 주민들은 취임 첫 발표를 기다리고 있다.';
        }
      } else if (choice.id === 'delegation') {
        next.energy -= 10;
        next.support = Math.min(100, next.support + 6);
        result = '소라와 주민 대표단을 꾸렸다. 선거 결과를 받아들이고 다음 예산 회의에 함께 참석하기로 했다.';
        remember(next, '소라', result);
      } else {
        next.cash += 12;
        next.support = Math.max(0, next.support - 4);
        result = '부두로 돌아가 12크라운을 벌었다. 주민 대표단은 당신 없이 회의를 시작했다.';
        remember(next, '소라', result);
      }
      event.dialogue = eventDialogue(next, event);
      const response = eventReply(event, choice.id);
      event.resolved = { choice: choice.id, result, ...response };
      remember(next, response.speaker, `당신 “${response.reply}” · ${response.speaker} “${response.reaction}”`);
      next.storyHistory.push({ id: event.id, day: next.day, choice: choice.id, result, ...response });
      record(next, result);
      institutions.checkAudit(next);
      careers.schedule(next);
      return { state: next, message: result };
    }
    if (action.type === 'acknowledge') {
      next.eventQueue.shift();
      underworld.review(next);
      chronicles.tick(next);
      echoes.tick(next);
      projects.tick(next);
      return { state: next, message: '' };
    }
    const inHearing = next.hearing && next.hearing.day <= next.day;
    if (inHearing && !['question', 'evidence', 'verdict'].includes(action.type)) {
      return { state, message: '청문회가 진행 중이다. 증언을 듣고 표결 또는 합의를 선택하자.' };
    }
    const projectResult=projects.act(next,action);
    if(projectResult){
      if(!projectResult.ok)return {state,message:projectResult.message};
      record(next,projectResult.message);return {state:next,message:projectResult.message};
    }
    const echoResult=echoes.act(next,action);
    if(echoResult){
      if(!echoResult.ok)return {state,message:echoResult.message};
      record(next,echoResult.message);return {state:next,message:echoResult.message};
    }
    const chronicleResult=chronicles.act(next,action);
    if(chronicleResult){
      if(!chronicleResult.ok)return {state,message:chronicleResult.message};
      record(next,chronicleResult.message);return {state:next,message:chronicleResult.message};
    }
    const successionResult=succession.act(next,action);
    if(successionResult){
      if(!successionResult.ok)return {state,message:successionResult.message};
      record(next,successionResult.message);return {state:next,message:successionResult.message};
    }
    const familyResult=family.act(next,action);
    if(familyResult){
      if(!familyResult.ok)return {state,message:familyResult.message};
      record(next,familyResult.message);return {state:next,message:familyResult.message};
    }
    const lifeResult=life.act(next,action);
    if(lifeResult){
      if(!lifeResult.ok)return {state,message:lifeResult.message};
      record(next,lifeResult.message);return {state:next,message:lifeResult.message};
    }
    const councilResult=council.act(next,action,pacts.projects);
    if(councilResult){
      if(!councilResult.ok)return {state,message:councilResult.message};
      record(next,councilResult.message);return {state:next,message:councilResult.message};
    }
    const pactResult=pacts.act(next,action);
    if(pactResult){
      if(!pactResult.ok)return {state,message:pactResult.message};
      record(next,pactResult.message);
      return {state:next,message:pactResult.message};
    }
    const partyResult=parties.act(next,action,politics.pool(next));
    if(partyResult){
      if(!partyResult.ok)return {state,message:partyResult.message};
      pacts.tick(next);
      record(next,partyResult.message);
      return {state:next,message:partyResult.message};
    }
    const politicalResult=politics.act(next,action);
    if(politicalResult){
      if(!politicalResult.ok)return {state,message:politicalResult.message};
      record(next,politicalResult.message);
      return {state:next,message:politicalResult.message};
    }
    const undergroundResult=underworld.act(next,action);
    if(undergroundResult){
      if(!undergroundResult.ok)return {state,message:undergroundResult.message};
      record(next,undergroundResult.message);
      institutions.checkAudit(next);
      return {state:next,message:undergroundResult.message};
    }
    const reformResult=agencies.propose(next,action);
    if(reformResult) {
      if(!reformResult.ok)return {state,message:reformResult.message};
      record(next,reformResult.message);
      return {state:next,message:reformResult.message};
    }
    const officialResult = institutions.apply(next, action);
    if (officialResult) {
      if (!officialResult.ok) return { state, message: officialResult.message };
      record(next,officialResult.message);
      const agency=agencies.registry(next)[next.institution.department];
      remember(next,institutions.colleagues[action.person]?.name || agency?.person || '지안',officialResult.message);
      return { state:next, message:officialResult.message };
    }
    switch (action.type) {
      case 'train': {
        if (!Object.hasOwn(careers.skills,action.skill) || (next.skills[action.skill]||0)>=1 || next.cash<8 || !spend(10)) break;
        next.cash-=8;
        next.skills[action.skill]=(next.skills[action.skill]||0)+1;
        message=`${careers.skills[action.skill]} 훈련을 받았다. 해당 구직 공고의 조건을 확인하자.`;
        break;
      }
      case 'applyJob': {
        if (careers.requirement(next,action.career) || !spend()) break;
        const previous=next.career;
        next.career=action.career;
        if(previous==='investigator' && ['open','evidence'].includes(next.caseStage)) next.caseStage='transferred';
        message=`${careers.jobs[action.career].name}로 전직했다. 기존 인맥과 약속은 유지되며 업무 수입이 바뀐다.`;
        break;
      }
      case 'resignOffice':
        if(next.career!=='mayor' || next.hearing || !spend()) break;
        next.officeResigned=true;
        next.career='worker';
        next.support=Math.max(0,next.support-8);
        message='동장직에서 사임했다. 당선 기록은 남고, 공직 주급과 예산 집행 권한은 내려놓았다.';
        break;
      case 'careerDuty': {
        const job=careers.jobs[next.career];
        if(!job?.duty || (job.secret && !next.secretMissionDone) || next.underReview || next.careerDutyDay===next.day || next.cash<job.cost || !spend(12)) break;
        next.cash-=job.cost;
        next.support=Math.min(100,next.support+job.support);
        next.careerDutyDay=next.day;
        message=`${job.duty}. ${job.group} 업무로 주민 지지 ${job.support}를 얻었다.`;

        break;
      }

      case 'question': {
        if (!inHearing || !['윤', '소라', '민석', '도윤'].includes(action.person)) break;
        const heard = next.hearing.heard || [];
        if (heard.includes(action.person)) break;
        next.hearing.heard = [...heard, action.person];
        const testimony = {
          '윤': next.surveyed ? '“당신과 함께 물길을 확인했다. 긴 제방은 어촌까지 보호한다.”' : '“직접 조사에 함께하지 않은 사람의 책임을 제가 보증할 수는 없다.”',
          '소라': next.promise === 'broken' ? '“당신은 지킨다고 약속했다. 그 약속을 어긴 뒤에 이제 와서 누구의 편이라는 건가?”' : next.testimony ? '“당신은 우리 말을 들었다. 임금에서 공사비까지 가져가는 계약은 바뀌어야 한다.”' : '“어촌에 오지도 않은 사람을 어떻게 믿으라는 건가?”',
          '민석': next.witness ? '“지안이 보관한 사본을 대조했다. 계약의 서명과 공제 내역은 사실이다.”' : '“원본 대조가 안 됐다. 소문으로 계약을 뒤집을 수는 없다.”',
          '도윤': next.funding === 'merchant' ? '“내 돈으로 제방을 지었다. 계약을 바꾸려면 최소한 12크라운은 보전해 줘야 한다.”' : '“내가 공사에 투자한 계약은 없다. 공개 기록을 남기는 데 반대하지 않는다.”'
        };
        const reviewTestimony = {
          '윤': next.surveyed ? '“현장 조사는 당신과 함께했다. 하지만 합의금을 받는 자리에는 없었어.”' : '“당신의 직무 수행을 직접 본 적이 없어.”',
          '소라': next.promise === 'broken' ? '“약속을 어긴 데 이어 기록까지 봉인했나요?”' : '“돈을 받았던 일부터 공개하고 시정해야 해요.”',
          '민석': next.witness ? '“기존 공개 사본과 봉인 기록을 대조했다. 사실대로 공개하고 환수에 응하면 시정을 검토하겠다.”' : '“공개된 자료가 부족하다. 추천인이라는 이유만으로 변호할 수는 없다.”',
          '도윤': '“합의금을 준 사실은 인정하겠소. 당신이 받은 돈도 기록에 남겨야 공평하지.”'
        };
        message = `${action.person}의 증언 ${next.hearing.source === 'oversight' ? reviewTestimony[action.person] : testimony[action.person]}`;
        remember(next, action.person, message);
        break;
      }
      case 'evidence':
        if (!inHearing || !next.witness || next.hearing.evidence) break;
        next.hearing.evidence = true;
        message = '계약 사본을 공개했다. 당신의 서명까지 공개 기록에 남았다. 증거 설득력 +2.';
        remember(next, '지안', '청문회에서 당신이 서명한 계약까지 공개했다.');
        break;
      case 'verdict': {
        if (!inHearing || !['vote', 'settle', 'withdraw'].includes(action.choice)) break;
        if (action.choice === 'settle' && (next.hearing.source === 'oversight' || next.cash < 12 || next.funding !== 'merchant' || !(next.hearing.heard || []).includes('도윤'))) break;
        const strength = hearingStrength(next);
        const passed = action.choice === 'settle' || (action.choice === 'vote' && strength >= 4);
        if (action.choice === 'settle') next.cash -= 12;
        if (next.hearing.source !== 'oversight') next.bill = passed ? 'passed' : 'rejected';
        if (next.hearing.source !== 'oversight') next.contractRelief = passed && next.funding === 'merchant';
        next.hearingRecord = { day: next.day, choice: action.choice, strength, passed, heard: next.hearing.heard || [], evidence: Boolean(next.hearing.evidence) };
        message = action.choice === 'settle' ? '개인 돈 12크라운으로 도윤과 합의했다. 임금 공제 조항이 폐지됐다.' : passed ? '증언과 증거를 바탕으로 표결이 통과됐다. 공개 감사가 확정되고 선주 계약이 있다면 임금 공제도 폐지된다.' : action.choice === 'withdraw' ? '안건을 철회했다. 원래 계약이 유지된다.' : '증언과 증거가 부족해 표결에서 부결됐다. 원래 계약이 유지된다.';
        if (next.hearing.source === 'oversight') {
          next.underReview = false;
          if (passed) {
            next.cash -= 20;
            next.caseStage = 'corrected';
            message = '공개 심사에서 시정 보고가 받아들여졌다. 합의금 20크라운을 환수하고 복직했다. 부족한 돈은 빚으로 남는다.';
          } else {
            next.career = 'worker';
            next.caseStage = 'dismissed';
            next.barredInvestigator = true;
            next.support = Math.max(0, next.support - 12);
            message = '직무 심사에서 해임됐다. 수사관 재임용이 제한되고 부두 노동자로 돌아왔다.';
          }
          remember(next, '민석', message);
        }
        remember(next, '도윤', message);
        remember(next, '소라', message);
        next.hearing = null;
        break;
      }

      case 'place': next.place = action.place; return { state: next, message: '' };
      case 'work': {
        const offer=workTerms(next);
        if (next.career==='unemployed'||!spend(offer.energy)) break;
        next.cash+=offer.wage;
        message = `${offer.name} 업무로 ${offer.wage}크라운을 받았다.${offer.toll ? ' 선주 계약의 사용료 6크라운이 공제됐다.' : ''}`;
        break;
      }
      case 'rest':
        if (!spend()) break;
        next.energy = Math.min(100, next.energy + 30);
        message = '하숙방에서 쉬었다. 창밖으로 부두의 종이 울린다.';
        break;
      case 'survey':
        if (next.surveyed || next.day >= 12 || !spend(10)) break;
        next.surveyed = true;
        message = '수문공 윤과 침수선을 측량했다. 항구 제방만 지으면 어촌 18가구가 물길에 남는다.';
        remember(next, '윤', '함께 침수선을 조사했다. 당신의 측량을 증언할 수 있다.');
        break;
      case 'testimony':
        if (next.testimony || !spend()) break;
        next.testimony = true;
        next.support += 10;
        message = '어민 대표 소라가 주민 공동 출자를 제안했다. 당신도 30크라운을 보태야 한다.';
        remember(next, '소라', '어촌을 지켜 달라는 부탁을 직접 들었다.');
        break;
      case 'promise':
        if (next.promise || next.day >= 12 || !next.testimony || !spend()) break;
        next.promise = 'pending';
        next.support += 6;
        message = '소라와 주민들 앞에서 어촌을 지키겠다고 약속했다. 첫 장마 때 이행 여부가 드러난다.';
        remember(next, '소라', '주민들이 함께 들은 공개 약속의 증인이다.');
        break;
      case 'witness':
        if (!next.built || next.witness || !spend()) break;
        next.witness = true;
        message = '지안에게 공사 결정과 자금 출처를 공개했다. 민석은 계약 사본을 확보했다.';
        remember(next, '지안', '공사 자금과 계약을 공개 기록으로 남겼다.');
        remember(next, '민석', '공사 결정의 사본을 가지고 있다. 공개 감사에서 증언할 수 있다.');
        break;
      case 'build': {
        const plan = plans[action.plan];
        if (!plan || next.built || next.day >= 12 || !next.surveyed) break;
        let cost = plan.cost;
        if (action.plan === 'long') {
          if (action.funding === 'cooperative' && next.testimony) cost = 30;
          else if (action.funding === 'merchant') cost = 12;
          else break;
        }
        if (next.cash < cost || !spend(10)) break;
        next.cash -= cost;
        next.built = action.plan;
        next.funding = action.plan === 'long' ? action.funding : null;
        message = `${plan.name} 결정. ${cost}크라운을 지불했다.`;
        if (next.funding === 'merchant') {
          message += ' 선주 도윤에게 20년간 부두 사용료 징수권을 주었다.';
          remember(next, '도윤', '공사비를 지원했다. 부두 사용료 20년 계약의 당사자다.');
        }
        if (next.funding === 'cooperative') remember(next, '소라', '주민들과 함께 공사비를 부담했다.');
        break;
      }
      case 'run':
        if (next.candidate || next.day >= next.politics.nextDay || next.cash < 8 || !spend()) break;
        next.cash -= 8;
        next.candidate = true;
        message = '기록관 지안에게 후보 등록서를 맡겼다. 선거일은 '+next.politics.nextDay+'일이다.';
        remember(next, '지안', '후보 등록 서류를 함께 작성했다.');
        break;
      case 'campaign':
        if (!next.candidate || next.day >= next.politics.nextDay || !spend(10)) break;
        next.support = Math.min(90, next.support + 7);
        message = '골목 집회에서 주민들의 이야기를 들었다. 예상 지지가 올랐다.';
        break;
      case 'join':
        if (next.underReview || next.hearing || next.day < 21 || !careers.jobs[next.career] || !['investigator', 'councillor'].includes(action.career) || (action.career === 'investigator' && next.barredInvestigator) || !(next.witness || (action.career === 'investigator' && next.policeRecommendation) || (action.career === 'councillor' && next.councilRecommendation)) || !spend()) break;
        next.career = action.career;
        next.caseStage = action.career === 'investigator' ? 'open' : next.caseStage;
        message = action.career === 'investigator' ? '민석의 추천으로 항만 수사관이 됐다. 임명은 선거 당선과 다른 경로의 권한을 열었다.' : '지안의 추천으로 주민 협의회 위원에 위촉됐다. 안건을 제출하고 공개 청문회를 소집할 수 있다.';
        remember(next, action.career === 'investigator' ? '민석' : '지안', '당신을 공직에 추천했다. 앞으로의 결정에 책임을 묻는다.');
        break;
      case 'investigate':
        if (next.underReview || next.career !== 'investigator' || next.caseStage !== 'open' || !spend(10)) break;
        next.caseStage = 'evidence';
        message = next.funding === 'merchant' ? '임금 장부와 선주 계약을 대조했다. 사용료가 노동자 임금에서 공제되는 조항을 확인했다. 당신의 서명도 있다.' : '장부 대조 결과 횡령 증거는 없었다. 다만 배급을 받지 못한 가구 명단이 발견됐다.';
        remember(next, '민석', message);
        break;
      case 'caseDecision':
        if (next.underReview || next.career !== 'investigator' || next.caseStage !== 'evidence' || !['public', 'private'].includes(action.choice) || !spend()) break;
        next.caseStage = action.choice === 'public' ? 'reported' : 'sealed';
        if (action.choice === 'public') {
          next.hearing = { day: next.day + 3, source: 'report' };
          message = '수사 자료를 공개했다. 사흘 뒤 주민 청문회가 열린다. 서명자에게도 질문이 돌아온다.';
        } else {
          next.cash += 20;
          next.followUps.push({ type: 'oversight', day: next.day + 3 });
          next.support = Math.max(0, next.support - 8);
          message = '도윤의 비공개 합의를 받아들였다. 20크라운을 받았고 민석은 보고서 누락을 기억한다.';
          remember(next, '민석', '공개 가능한 자료를 봉인한 당신에게 책임을 묻는다.');
        }
        break;
      case 'bill':
        if (!['mayor', 'councillor'].includes(next.career) || next.bill || next.hearing || !spend(10)) break;
        next.bill = 'pending';
        next.hearing = { day: next.day + 3, source: 'bill' };
        message = '항만 계약 재협상안을 제출했다. 사흘 뒤 소라·도윤·윤이 공개 청문회에서 의견을 낸다.';
        remember(next, '지안', '당신의 재협상안을 의사록에 올렸다.');
        break;
      case 'budget': {
        if (next.career !== 'mayor' || next.day < 21 || next.treasury < 12 || !spend()) break;
        const returned = Math.min(4, Math.max(0, 86 - Object.values(next.residents).reduce((a, b) => a + b, 0)));
        if (!returned) {
          next.actions += 1;
          break;
        }
        next.treasury -= 12;
        next.residents.village += returned;
        message = `공금 12크라운으로 복구 공사를 발주했다. ${returned}가구가 돌아왔다. 개인 소지금은 공금과 별도로 관리된다.`;
        remember(next, '윤', '당신이 발주한 복구 공사를 맡았다.');
        break;
      }
      case 'policy':
        if (!next.election || next.policy || next.day < (next.election.day ?? 20)+1 || !spend()) break;
        next.policy = action.policy === 'housing' ? 'housing' : 'audit';
        message = next.career==='mayor' ? '첫 예산안을 집행했다.' : `${next.election.winner} 동장에게 주민 청원을 제출했다.`;
        if (next.policy === 'housing') {
          const returned = Math.min(8, 86 - Object.values(next.residents).reduce((a, b) => a + b, 0));
          next.residents.village += returned;
          message += ` 임시 주택에 ${returned}가구가 돌아왔다.`;
        } else {
          next.support = Math.min(100, next.support + 8);
          message += ' 지안이 계약 공개 감사의 첫 증인이 됐다.';
        }
        break;
      case 'advance': {
        let target = action.to === 'event' ? (next.day < 12 ? 12 : next.day < 20 ? 20 : next.day === 20 ? 21 : Math.min(next.day+7,next.politics.nextDay)) : next.day + 1;
        const upcoming = next.followUps.filter(item => item.day > next.day).map(item => item.day);
        if (upcoming.length) target = Math.min(target, ...upcoming);
        if (next.hearing && next.hearing.day > next.day) target = Math.min(target, next.hearing.day);
        while (next.day < target) {
          next.day += 1;
          next.cash -= 3 + (next.jobStory.livingExpense || 0) + (next.day % 7 === 0 ? life.rent(next,life.player(next)) : 0);
          next.energy = Math.max(0, Math.min(100, next.energy + 20) - (next.cash < 0 ? 10 : 0));
          const due = next.followUps.filter(item => item.day <= next.day);
          next.followUps = next.followUps.filter(item => item.day > next.day);
          for (const item of due) {
            if(item.type==='underworld'){
              if(next.underworld.role===item.role){next.eventQueue.push(underworld.encounter(item.role,next,true));record(next,'병행하는 활동의 첫 의뢰가 도착했다.');}
              continue;
            }
            if(item.type==='agencyReform') {
              const report=agencies.process(next,item);
              if(report){next.eventQueue.push(report);record(next,report.text);}
              continue;
            }
            if(item.type==='secretMission') {
              next.eventQueue.push(careers.mission(item.career,next));
              record(next,'비밀 직업의 첫 임무가 도착했다.');
              continue;
            }
            if(item.type==='recruitment') {
              next.eventQueue.push(careers.invitation(item.career,next));
              next.recruitment[item.career]='offered';
              record(next,careers.routes[item.career].title);
              continue;
            }
            if (item.type === 'job') {
              const episode = jobStories.create(item.episode,next);
              if (episode) {
                next.eventQueue.push(episode);
                next.jobStory.stage = item.episode;
                record(next,episode.title);
              }
              continue;
            }
            if (item.type === 'oversight') {
              next.underReview = true;
              next.eventQueue.push({ id: 'oversight', day: next.day, scene: 'hearing', title: '봉인했던 기록이 돌아왔다', text: '민석이 합의금 지급 내역을 확보했다. 직무 심사에 앞서 당신의 답변을 요구한다.', quote: '민석 “돈을 받은 이유를 설명해 주십시오.”', destination: 'city' });
              record(next, '민석이 합의금의 출처를 확인하고 직무와 주급을 정지했다.');
              continue;
            }
            const missing = Math.max(0, 86 - Object.values(next.residents).reduce((a, b) => a + b, 0));
            const returned = Math.min(item.type === 'aid' ? 2 : 4, missing);
            next.residents.village += returned;
            const text = item.type === 'aid' ? `구호 물자가 도착했다. ${returned}가구가 임시 거처로 돌아왔다.` : `윤이 복구 공사를 마쳤다. ${returned}가구가 새 거처에 입주했다.`;
            record(next, text);
            remember(next, item.type === 'aid' ? '소라' : '윤', text);
            next.eventQueue.push({ id: 'followup-' + item.type + '-' + next.day, day: next.day, scene: next.flooded > 0 ? 'storm-partial' : 'storm-safe', title: '당신의 결정이 돌아왔다', text, quote: '“기록에만 남은 약속은 아니었네요.”', destination: 'city' });
          }
          if (next.day === 6 && !next.testimony) {
            next.notices.unshift('소라가 어촌 주민 공동 출자를 모집한다. 장마 전에 어촌을 방문할 수 있다.');
            record(next, '소라가 공동 출자 모임을 열었다. 당신이 오기를 기다리고 있다.');
          }
          if (next.day === 9 && next.funding === 'merchant' && !next.witness) {
            next.notices.unshift('민석이 선주 계약의 사본을 요청했다. 공개 여부는 당신이 결정한다.');
            record(next, '민석이 항만 계약에 관심을 보였다. 아직 사본은 전달하지 않았다.');
          }
          if (next.day === 12) {
            const plan = next.built || 'none';
            next.flooded = harbor.floodLoss(plan);
            next.residents.village -= Math.min(18, next.flooded);
            next.residents.harbor -= Math.max(0, next.flooded - 18);
            next.support = Math.max(0, Math.min(100, next.support + (plan === 'long' ? 22 : plan === 'short' ? -8 : -18)));
            if (next.promise === 'pending') {
              next.promise = plan === 'long' ? 'kept' : 'broken';
              next.support = Math.max(0, Math.min(90, next.support + (plan === 'long' ? 8 : -15)));
              const response = plan === 'long' ? '소라가 주민 모임에서 당신이 약속을 지켰다고 증언했다.' : '소라가 주민 모임에서 당신의 어촌 보호 약속이 깨졌다고 말했다.';
              remember(next, '소라', response);
              record(next, response);
            }
            next.eventQueue.push({
              id: 'storm', day: next.day,
              scene: plan === 'long' ? 'storm-safe' : plan === 'short' ? 'storm-partial' : 'storm-flood',
              title: plan === 'long' ? '물은 제방 밖에서 멈췄다' : '물이 빠진 뒤, 빈집이 남았다',
              text: `${plans[plan].name}. ${next.flooded}가구가 침수되어 도시를 떠났다.`,
              quote: next.promise === 'broken' ? '소라 “지켜 준다고 했잖아.”' : plan === 'long' ? '소라 “우리 집 문턱까지 왔다가 멈췄어.”' : '소라 “떠나는 사람들의 이름을 기억해 줘.”',
              destination: 'city'
            });
            const report = `첫 장마. ${next.flooded}가구가 침수되어 도시를 떠났다.`;
            record(next, report);
            remember(next, '소라', plan === 'long' ? '어촌이 장마를 버텼다. 공사에 참여한 당신을 기억한다.' : '어촌 18가구가 침수됐다. 당신이 어떤 결정을 했는지 기억한다.');
          }
          if (next.day % 7 === 0 && institutions.active(next)) {
            next.institution.agencyBudget+=8;
            if(next.institution.department==='army') {
              next.institution.supplies=Math.max(0,next.institution.supplies-4);
              if(next.institution.supplies<20) next.institution.readiness=Math.max(0,next.institution.readiness-5);
            }
          }
          if (next.day > 20 && next.day % 7 === 0) {
            next.treasury += 10+pacts.weeklyRevenue(next);
            if(pacts.weeklyRevenue(next))record(next,'교역 지원 사업으로 공적 세수 4크라운이 추가로 들어왔다.');
            if (['mayor','investigator','councillor','official','soldier','defenseMinister'].includes(next.career) && !next.underReview) {
              next.cash += 18;
              record(next, '주급 18크라운을 받았다. 시 재정에는 세수 10크라운이 들어왔다.');
            }
          }
          if (next.hearing && next.day === next.hearing.day) {
            next.hearing.heard = [];
            next.hearing.evidence = false;
            next.notices.unshift('청문회가 시작됐다. 증언과 증거를 확인하고 마지막 결정을 내려야 시간이 흐른다.');
            next.eventQueue.push({ id: 'hearing-' + next.day, day: next.day, scene: 'hearing', title: next.hearing.source === 'oversight' ? '이번에는 당신이 답할 차례다' : '당신의 서명도 이 자리에 있다', text: next.hearing.source === 'oversight' ? '합의금 수령과 기록 봉인에 대한 직무 심사다. 증거와 증언으로 소명하거나 책임을 지고 물러나야 한다.' : '계약과 임금 장부가 증언대에 놓였다. 누구에게 질문하고 무엇을 공개할지 결정하자.', quote: '지안 “오늘의 말은 모두 기록에 남습니다.”', destination: 'city' });
            record(next, '청문회 개회. 윤·소라·민석·도윤이 참석했다.');
          }
          if (next.day === 24 && !next.hearing && !next.bill) {
            next.notices.unshift('지안이 재협상안 제출을 권했다. 수사관은 장부를 조사하고, 동장과 협의회 위원은 안건을 제출할 수 있다.');
            record(next, '지안이 계약 재협상에 필요한 절차를 안내했다.');
          }
          for(const update of politics.tick(next))record(next,update);
          const reportsBefore=next.eventQueue.length;
          pacts.tick(next);
          if(next.eventQueue.length>reportsBefore)target=next.day;
          if (next.day === next.politics.nextDay) {
            next.election = electionResult(next);
            council.seatElection(next,next.election);
            parties.settleElection(next,next.election);
            pacts.settleElection(next,next.election);
            if(next.election.won){
              if(next.career!=='mayor')next.politics.returnCareer=starts.occupations[next.career]?next.career:'worker';
              next.career='mayor';next.officeResigned=false;
            }else if(next.career==='mayor')next.career=next.politics.returnCareer;
            next.policy=null;
            next.eventQueue.push({
              id: 'election', election:JSON.parse(JSON.stringify(next.election)), day: next.day, scene: next.election.won ? 'election-win' : 'election-loss',
              title: next.election.won ? '광장이 당신의 이름을 부른다' : next.candidate ? '광장은 다른 이름을 불렀다' : '당신이 지켜본 선거',
              text: `${next.election.winner} 동장 당선. ${next.election.ran ? '당신의 득표율 ' + next.election.votes + '%.' : '당신은 출마하지 않았다.'} 내일도 도시의 삶은 이어진다.`,
              quote: next.election.won ? '지안 “이제 약속을 예산으로 옮길 차례예요.”' : '소라 “내일 아침, 우리 동네에서 만나요.”', destination: 'power'
            });
            council.electionReport(next);
            next.politics.history.unshift(JSON.parse(JSON.stringify(next.election)));
            next.politics.nextDay+=next.life.clock.mode==='lifetime'?1460:28;next.politics.round++;next.politics.activity={sora:0,doyun:0,jian:0};next.politics.endorsements={};next.politics.requested=[];next.candidate=false;
            record(next, `${next.election.winner} 동장 당선. ${next.election.ran ? '당신의 득표율 ' + next.election.votes + '%' : '당신은 출마하지 않았다.'}`);
          }
          const lifeEventsBefore=next.eventQueue.length;
          life.tick(next);
          if(next.eventQueue.length>lifeEventsBefore)target=next.day;
          careers.schedule(next);
          const incidental=randomEvents.schedule(next);
          if(incidental){next.eventQueue.push(incidental);record(next,incidental.title);target=next.day;}
          const encounters = next.followUps.filter(item => item.day > next.day).map(item => item.day);
          if (encounters.length) target = Math.min(target, ...encounters);
        }
        next.actions = 2;
        message = `${next.day}일이 되었다. 생활비와 집세를 정산했다.${next.cash < 0 ? ' 생활비가 모자라 빚이 쌓이고 있다.' : ''}`;
        break;
      }
    }
    if (!message) return { state, message: '지금은 이 행동을 할 수 없다. 비용, 기력, 일정 조건을 확인하자.' };
    pacts.tick(next);
    record(next, message);
    careers.schedule(next);
    return { state: next, message };
  }
  function lifeDescriptor(state){
    const title=institutions.title(state)||careers.jobs[state.career]?.name||({mayor:'동장',investigator:'수사관',councillor:'협의회 위원'}[state.career])||state.career;
    return {title,sideTitle:underworld.catalog[state.underworld.role]?.name};
  }
  function workTerms(state){
    const job=institutions.job(state)||careers.jobs[state.career]||starts.occupations.worker;
    const toll=state.career==='worker'&&state.funding==='merchant'&&state.flooded!==null&&!state.contractRelief;
    const bonus=state.career===state.startingOccupation?state.jobStory.wageBonus||0:0;
    return {name:job.name,energy:job.energy,wage:(toll?10:job.wage)+bonus,toll};
  }
  function lifePassReason(state,kind='lifePass'){
    if(!state.startConfigured)return '시작 설정을 먼저 마치자.';
    if(state.day<28)return '첫 지역 사건 이후 28일부터 기간 생활을 사용할 수 있다.';
    if(state.eventQueue.length)return '열린 사건의 답변과 결과 확인을 먼저 마치자.';
    if(state.hearing)return '예정되거나 진행 중인 청문회를 먼저 마치자.';
    if(state.underReview)return '직무 심사를 먼저 처리하자.';
    if(!['none','complete'].includes(state.jobStory.stage))return '진행 중인 첫 직업 이야기를 먼저 마치자.';
    if(pacts.governing(state).length)return '집행 대기 중인 정책 협약을 먼저 처리하자. 기간을 넘겨 약속을 자동 파기하지 않는다.';
    if(kind==='lifePass'&&state.life?.clock?.plan)return '진행 중인 생활 계획을 이어가거나 종료하자.';
    if(kind==='lifeContinue'&&!state.life?.clock?.plan)return '이어갈 생활 계획이 없다.';
    if(kind==='lifePass'&&state.life?.clock?.mode!=='lifetime'&&(state.candidate||state.pacts.agreements.some(p=>p.status==='signed')))return '등록한 선거나 서명한 선거 협약을 마친 뒤 장기 생활로 전환하자.';
    return '';
  }
  function advanceLife(state,action){
    const fail=message=>({state,message});
    const blocked=lifePassReason(state,action.type);if(blocked)return fail(blocked);
    let next=normalize(JSON.parse(JSON.stringify(state)));
    if(action.type==='lifePass'){
      if(next.life.clock.plan)return fail('진행 중인 생활 계획을 이어가거나 종료하자.');
      if(![30,90,365].includes(action.days)||!['work','rest'].includes(action.routine))return fail('생활 기간과 방식을 확인하자.');
      if(next.life.clock.mode!=='lifetime'){
        if(next.candidate||next.pacts.agreements.some(pact=>pact.status==='signed'))return fail('등록한 선거나 서명한 선거 협약을 마친 뒤 장기 생활로 전환하자.');
        next.life.clock.mode='lifetime';
        if(next.election)next.politics.nextDay=(next.election.day??20)+1460;
      }
      next.life.clock.plan={from:next.day,target:next.day+action.days,routine:action.routine};
    }
    const plan=next.life.clock.plan;
    if(!plan)return fail('이어갈 생활 계획이 없다.');
    const startDay=next.day,startCash=next.cash;
    let reason='계획한 기간을 마쳤다.';
    while(next.day<plan.target){
      if(next.day>=next.politics.nextDay-10&&plan.electionSeen!==next.politics.round){plan.electionSeen=next.politics.round;reason='선거운동 기간에 들어섰다. 출마와 선거 활동을 직접 결정하자.';break;}
      next.life.processing=true;
      if(next.actions&&next.energy>=20&&plan.routine==='work'&&[1,3,5].includes(next.day%7)){
        const worked=transition(next,{type:'work'},true);
        if(worked.state!==next){
          life.observe(worked.state,next,{type:'work'},lifeDescriptor(worked.state));next=worked.state;
          const index=next.journal.findIndex(item=>item.day===next.day&&item.text===worked.message);if(index>=0)next.journal.splice(index,1);
        }
      }else if(next.actions&&next.energy<70){
        const rested=transition(next,{type:'rest'},true);
        if(rested.state!==next){life.observe(rested.state,next,{type:'rest'},lifeDescriptor(rested.state));next=rested.state;next.journal=next.journal.filter(item=>!(item.day===next.day&&item.text===rested.message));}
      }
      const moved=transition(next,{type:'advance',to:'day'},true);
      if(moved.state===next){reason=moved.message;break;}
      life.observe(moved.state,next,{type:'advance'},lifeDescriptor(moved.state));next=moved.state;
      next.journal=next.journal.filter(item=>!(item.day===next.day&&item.text===moved.message));
      delete next.life.processing;
      // normalize makes a fresh copy on each action; keep the persisted plan as the authority.
      next.life.clock.plan.electionSeen=plan.electionSeen;
      if(next.eventQueue.length||next.hearing||next.underReview){reason='직접 결정할 사건이 생겨 멈췄다. 처리 후 남은 기간을 이어갈 수 있다.';break;}
      if(next.cash<0){reason='생활비가 부족해 멈췄다. 돈을 마련하거나 계획을 종료하자.';break;}
    }
    delete next.life.processing;
    next.life.clock.plan.electionSeen=plan.electionSeen;
    const completed=next.day>=plan.target;
    if(completed)next.life.clock.plan=null;
    life.summarize(next,startDay,startCash);
    const message=(next.day-startDay)+'일의 생활을 진행했다. '+reason;
    record(next,message);return {state:next,message};
  }
  function apply(state,action){
    if(['lifePass','lifeContinue'].includes(action.type))return advanceLife(state,action);
    if(action.type==='lifeCancel'){
      if(!state.life?.clock?.plan)return {state,message:'진행 중인 생활 계획이 없다.'};
      const next=normalize(JSON.parse(JSON.stringify(state)));next.life.clock.plan=null;
      return {state:next,message:'남은 생활 계획을 종료했다. 이미 지난 시간과 결과는 유지된다.'};
    }
    const result=transition(state,action);
    if(result.state!==state)life.observe(result.state,state,action,lifeDescriptor(result.state));
    return result;
  }
  const api = { workTerms, lifePassReason, fresh, apply, plans, normalize, electionResult, hearingStrength, eventChoices, eventDialogue, eventReply, starts, careers, institutions, randomEvents, underworld, politics, parties, pacts, council, life, family, succession, society, chronicles, echoes, projects };
  if (typeof module !== 'undefined') module.exports = api;
  root.Campaign = api;
})(globalThis);
