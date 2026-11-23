'use strict';
(function(root){
  function create({templates,actor,current,pool,willing,money,relation,log}){
    const active=a=>a.status==='active';
    function own(state){return state.life.workAgreements.contracts.filter(a=>a.actor===actor(state));}
    function get(state,id){return own(state).find(a=>a.id===Number(id)&&active(a));}
    function shares(a){const mine=Math.floor(a.balance/2);return {mine,theirs:a.balance-mine};}
    function wallet(state,id){return id===actor(state)?state.cash:state.life.people[id]?.wealth??0;}
    function busy(state,a){const r=current(state);return r?.agreement===a.id;}
    function memo(state,a,status){const p=state.life.people[a.person];if(!p)return;p.workLinks[a.actor]={worked:0,opposed:0,...p.workLinks[a.actor],lastPromise:status,lastPromiseDay:state.day};}
    function close(state,a,status,text,delta=0){
      const refund=shares(a);money(state,a.actor,refund.mine);money(state,a.person,refund.theirs);a.refunds={actor:refund.mine,person:refund.theirs};a.balance=0;
      a.status=status;a.closedDay=state.day;a.result=text+' · 남은 준비금 본인 '+refund.mine+' / 동료 '+refund.theirs+' 반환';a.eventId=null;
      if(delta)relation(state,a,a.person,delta,text);memo(state,a,status);log(state,a,a.result);
    }
    function restore(state){
      state.life.workAgreements={nextId:1,nextOffer:1,contracts:[],...state.life.workAgreements};
      for(const a of state.life.workAgreements.contracts)if(active(a)&&a.actor!==actor(state))close(state,a,'archived','이전 인물의 개인 약속을 보관하고 준비금을 정산했다.');
    }
    function reason(state,type,person,ignore=null){
      const t=Object.hasOwn(templates,type)?templates[type]:null,p=state.life.people[person];
      if(!t||!t.jobs.includes(state.career))return '현재 직업의 분야를 확인하자';
      if(!p||!pool(state,type).some(item=>item.id===person))return '같은 분야에서 일할 수 있는 성년 동료가 필요';
      if(!state.life.projects.runs.some(r=>r.actor===actor(state)&&r.type===type&&r.status==='complete'&&!r.blame&&(r.partner===person||r.coauthor===person)))return '이 분야에서 함께 준비하고 결과를 확인한 동료가 필요';
      if(p.workLinks[actor(state)]?.lastPromise==='broken'&&p.relationship<70)return '깨진 약속 이후 다시 장기 약속을 맺으려면 관계 70 필요';
      if(!willing(state,p)||p.relationship<55)return '동료 관계 55와 참여 의사 필요';
      if(p.society.independence>=70&&p.society.security<50&&p.relationship<70)return '독립적인 활동을 선호하는 동료는 관계 70 필요';
      if(state.life.workAgreements.contracts.some(a=>active(a)&&a.id!==ignore&&(a.person===person||a.actor===actor(state)&&a.type===type)))return '이 동료 또는 같은 분야에 이미 약속이 있다';
      return '';
    }
    function availability(state,type,person){
      if(state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||current(state))return '현재 사건과 공동 일거리를 먼저 마치자';
      const why=reason(state,type,person);if(why)return why;
      if(state.cash<6||wallet(state,person)<6||state.actions<1||state.energy<5)return '서로 개인 돈 6 · 행동 1 · 기력 5 필요';
      return '';
    }
    function options(state,type){const ids=new Set();for(const r of state.life.projects.runs)if(r.actor===actor(state)&&r.type===type&&r.status==='complete'&&!r.blame){if(r.partner)ids.add(r.partner);if(r.coauthor)ids.add(r.coauthor);}return [...ids].map(id=>state.life.people[id]).filter(Boolean);}
    function make(state,type,person){
      money(state,actor(state),-6);money(state,person,-6);
      const a={id:state.life.workAgreements.nextId++,actor:actor(state),person,type,status:'active',startedDay:state.day,dueDay:state.day+365,balance:12,spent:0,expenses:[],projectIds:[],fulfilled:0,extended:false,postponements:0};
      state.life.workAgreements.contracts.push(a);relation(state,a,person,2,'서로 준비금 6을 내고 1년 동안 공동 제안의 결과를 함께 확인하기로 했다.');memo(state,a,'active');log(state,a,'동료와 1년 약속 · 준비금 12 · 확인일 '+a.dueDay);return a;
    }
    function offer(state,a){
      const p=state.life.people[a.person];a.sequence=(a.sequence||0)+1;
      const refund=shares(a),event={id:'work-agreement-'+a.id+'-'+a.sequence,day:state.day,workAgreement:{mode:'review',id:a.id,actor:a.actor,person:a.person,type:a.type,speaker:p?.name||'이전 동료'},scene:templates[a.type].scene,title:'함께하자던 약속을 돌아본다',text:templates[a.type].name+'의 동료와 맺은 개인 약속',destination:'jobs',dialogue:[{speaker:p?.name||'이전 동료',text:'1년 동안 공동 제안의 결과를 함께 확인하자고 했죠. 함께 확인한 일은 '+a.fulfilled+'번, 준비에 쓴 돈은 '+a.spent+'입니다.'},{speaker:p?.name||'이전 동료',text:'남은 준비금은 '+a.balance+'입니다. 정리하면 당신에게 '+refund.mine+', 내게 '+refund.theirs+'이 돌아와요. 계속 함께할지, 이번 약속은 여기서 마칠지 이야기해요.'}]};
      a.eventId=event.id;state.eventQueue.push(event);
    }
    function context(state,event){const d=event.workAgreement,a=d?.mode==='review'?get(state,d.id):null;return {d,a,valid:Boolean(d&&d.actor===actor(state)&&(d.mode==='invite'||a&&a.eventId===event.id))};}
    function choices(state,event){
      const {d,a,valid}=context(state,event);if(!valid)return [{id:'close',title:'이전 인물의 약속을 닫는다',detail:'현재 인물에게 비용과 관계 효과 없음',disabled:false}];
      if(d.mode==='invite')return [
        {id:'agree',title:'서로 준비금을 내고 1년 약속을 맺는다',detail:'내 돈 6 + 동료 돈 6 · 365일 내 한 번 공동 결과 확인 · 준비금으로 공동 검증 지원',disabled:Boolean(reason(state,d.type,d.person)||state.cash<6||wallet(state,d.person)<6)},
        {id:'decline',title:'이번에는 일마다 따로 약속하자',detail:'준비금 지출과 관계 불이익 없음',disabled:false}];
      const refund=shares(a),due=state.day>=a.dueDay,canExtend=!a.extended&&!a.fulfilled&&!reason(state,a.type,a.person,a.id),canRenew=due&&a.fulfilled>0&&!reason(state,a.type,a.person,a.id)&&state.cash+refund.mine>=6&&wallet(state,a.person)+refund.theirs>=6;
      return [
        ...(!due?[{id:'keep',title:'지금은 약속을 계속 유지한다',detail:'준비금과 약속 유지 · 추가 비용 없음',disabled:false}]:[]),
        {id:'settle',title:a.fulfilled?'함께한 일을 확인하고 준비금을 정산한다':due?'약속을 마치지 못했음을 인정하고 정산한다':'미리 알리고 약속을 정리한다',detail:'남은 준비금 본인 '+refund.mine+' / 동료 '+refund.theirs+' 반환 · '+(a.fulfilled?'관계 +3':due?'관계 −6':'행동 1 · 기력 5 · 관계 −2'),disabled:busy(state,a)||!a.fulfilled&&!due&&(state.actions<1||state.energy<5)},
        ...(canExtend?[{id:'extend',title:'함께할 기회를 90일 더 마련하자',detail:'행동 1 · 기력 5 · 추가 준비금 없음 · 한 번만 가능',disabled:!due||busy(state,a)||state.actions<1||state.energy<5}]:[]),
        ...(canRenew?[{id:'renew',title:'남은 돈을 정산하고 다시 1년을 약속한다',detail:'남은 준비금 반환 후 각자 6을 다시 냄 · 행동 1 · 기력 5',disabled:busy(state,a)||state.actions<1||state.energy<5}]:[]),
        {id:'walkaway',title:'더는 연락하지 않겠다고 말한다',detail:'준비금 잔액은 각자 반환 · 관계 −10 · 신뢰를 깨뜨린 기억',disabled:busy(state,a)},
        ...(due&&a.postponements<2?[{id:'later',title:'정산을 준비한 뒤 7일 후 다시 이야기한다',detail:'두 번 가능 · 준비금 유지',disabled:busy(state,a)}]:[])
      ];
    }
    function reply(event,id){return {reply:{keep:'지금은 약속을 계속 유지하겠습니다.',agree:'서로 준비금을 내고 1년 동안 함께할 일을 마련하겠습니다.',decline:'이번에는 일마다 따로 약속하겠습니다.',settle:'그동안 한 일과 남은 준비금을 함께 정리하겠습니다.',extend:'함께할 기회를 90일 더 마련해 보겠습니다.',renew:'남은 돈을 정리하고 다시 1년을 약속하겠습니다.',walkaway:'이 약속을 더 이어가지는 않겠습니다.',later:'정산을 준비하고 7일 뒤 다시 이야기하겠습니다.',close:'이전 인물의 약속을 닫겠습니다.'}[id],speaker:event.workAgreement?.speaker||'함께 일한 동료',reaction:id==='agree'?'각자 낸 돈과 함께하기로 한 일을 기록해 둘게요.':'남은 돈과 이번 답변을 함께 기록하겠습니다.'};}
    function resolve(state,event,id){
      const {d,a,valid}=context(state,event);if(!valid)return '이전 인물의 약속을 닫았다. 현재 인물에게 효과를 적용하지 않았다.';
      const selected=choices(state,event).find(c=>c.id===id);if(!selected||selected.disabled)return '약속의 조건이 달라졌다.';
      if(d.mode==='invite'){if(id==='decline')return '이번에는 일마다 따로 약속하기로 했다. 준비금 지출은 없다.';make(state,d.type,d.person);return '서로 6을 내 공동 준비금 12를 마련했다. 365일 안에 한 번 공동 제안의 결과를 함께 확인한다.';}
      a.eventId=null;
      if(id==='keep')return '약속과 공동 준비금을 그대로 유지했다.';
      if(id==='later'){a.postponements++;a.reviewDay=state.day+7;return '7일 뒤 남은 준비금을 정리한다.';}
      if(id==='extend'){state.actions--;state.energy-=5;a.extended=true;a.dueDay=state.day+90;a.reviewDay=null;log(state,a,'서로 동의해 약속을 90일 연장했다.');return '약속을 한 번, 90일 연장했다. 준비금은 유지한다.';}
      if(id==='renew'){state.actions--;state.energy-=5;close(state,a,'fulfilled','함께 결과를 확인한 약속을 마치고 준비금을 정산했다.',1);const renewed=make(state,a.type,a.person);renewed.previous=a.id;return '이전 약속을 정산하고 각자 6으로 새 1년 약속을 시작했다.';}
      const due=state.day>=a.dueDay;
      if(id==='settle'&&!a.fulfilled&&!due){state.actions--;state.energy-=5;}
      close(state,a,id==='walkaway'?'broken':a.fulfilled?'fulfilled':due?'unfulfilled':'released',id==='walkaway'?'동료와 맺은 약속의 연락을 끊었다.':a.fulfilled?'함께 결과를 확인한 약속을 정산했다.':due?'기한 안에 함께 결과를 확인하지 못해 약속을 정산했다.':'미리 알리고 약속을 정리했다.',id==='walkaway'?-10:a.fulfilled?3:due?-6:-2);return a.result;
    }
    function act(state,action){
      if(!['agreementInvite','agreementReview'].includes(action.type))return null;
      if(action.type==='agreementInvite'){
        const why=availability(state,action.project,action.person);if(why)return {ok:false,message:why};state.actions--;state.energy-=5;
        const p=state.life.people[action.person],event={id:'agreement-invite-'+state.life.workAgreements.nextOffer++,day:state.day,workAgreement:{mode:'invite',actor:actor(state),person:p.id,type:action.project,speaker:p.name},scene:templates[action.project].scene,title:'다음 일도 함께할 수 있을까',text:'한 번 함께한 일에서 1년 약속으로',destination:'jobs',dialogue:[{speaker:p.name,text:'같이 준비하고 결과를 확인한 일을 기억해요. 다음에는 함께 쓸 준비금도 조금씩 마련하면 어떨까요?'},{speaker:p.name,text:'각자 6을 내고 1년 안에 한 번은 공동 제안의 결과를 함께 확인해요. 공동 검증에 쓴 돈과 남은 돈은 따로 기록하고, 약속을 마칠 때 남은 돈은 반씩 돌려받아요.'}]};state.eventQueue.push(event);return {ok:true,message:p.name+'과 다음 일을 함께할 약속을 검토한다.'};
      }
      const a=get(state,action.agreement);if(!a||state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||busy(state,a))return {ok:false,message:'현재 공동 일거리와 사건을 먼저 마치거나 인계하자.'};offer(state,a);return {ok:true,message:'동료와의 약속과 준비금을 함께 정리한다.'};
    }
    function forProject(state,run){return own(state).find(a=>active(a)&&a.type===run.type&&a.person===run.partner)||null;}
    function attach(state,run){run.agreement=forProject(state,run)?.id||null;}
    function canSupport(state,run){const a=get(state,run.agreement);return Boolean(a&&a.person===run.partner&&a.type===run.type&&a.balance>=4&&pool(state,run.type).some(p=>p.id===a.person)&&willing(state,state.life.people[a.person]));}
    function support(state,run,label='공동 검증'){const a=get(state,run.agreement);if(!canSupport(state,run))return false;a.balance-=4;a.spent+=4;a.expenses.push({day:state.day,project:run.id,amount:4,text:label});log(state,a,'공동 준비금 4 사용: '+label+' · 잔액 '+a.balance);return true;}
    function depart(state,run,text){const a=get(state,run.agreement);if(a){close(state,a,'mutual',text+' 남은 준비금을 정산했다.');return a.result;}return null;}
    function record(state,run){
      const a=get(state,run.agreement);if(!a||a.projectIds.includes(run.id))return;
      if(run.blame){close(state,a,'broken','공동 제안의 실패 책임을 동료에게 떠넘겨 약속이 깨졌다.',-4);return;}
      a.projectIds.push(run.id);a.fulfilled++;memo(state,a,'kept');log(state,a,'약속한 공동 제안의 결과를 함께 확인했다. 총 '+a.fulfilled+'회');
    }
    function tick(state){
      for(const a of own(state).filter(active)){
        const p=state.life.people[a.person],t=templates[a.type];
        const why=!p?'동료의 기록을 확인할 수 없어':p.age>=65||p.occupation==='retired'?'동료가 은퇴해':p.health<35?'동료가 회복에 집중하기로 해':!t.peers.includes(p.occupation)?'동료가 다른 분야의 일을 선택해':null;
        if(why&&!busy(state,a))close(state,a,'mutual',why+' 준비금을 정산하고 개인 약속을 마쳤다.');
      }
      if(state.eventQueue.length||state.hearing||state.underReview||state.agencyProposal||state.followUps.some(f=>f.day<=state.day+1))return;
      const due=own(state).filter(a=>active(a)&&Math.max(a.dueDay,a.reviewDay||0)<=state.day&&!busy(state,a)).sort((a,b)=>a.dueDay-b.dueDay||a.id-b.id)[0];if(due)offer(state,due);
    }
    function blocked(state){return own(state).some(active)?'동료와 맺은 개인 약속의 준비금을 정산한 뒤 은퇴하자.':'';}
    return {restore,own,get,shares,reason,availability,options,choices,reply,resolve,act,attach,canSupport,support,depart,record,tick,blocked};
  }
  const api={create};if(typeof module!=='undefined')module.exports=api;root.WorkAgreements=api;
})(globalThis);
