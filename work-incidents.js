'use strict';
(function(root){
  const cases={
    workshop:[{id:'guard',title:'점검표에 없는 방호판',text:'작업대의 방호판이 빠져 있다. 수리를 기다리면 예정된 일정이 밀린다.',line:'오늘 할 범위를 줄일지, 준비비와 시간을 더 들일지 먼저 정하자.',labels:['준비비를 들여 수리 확인을 기다린다','이번 의뢰를 안전 점검 범위로 줄인다','내가 긴 교대를 맡아 짧은 일정으로 확인한다']},
      {id:'shift',title:'겹쳐 버린 두 교대',text:'확인 작업과 동료의 다음 교대가 겹쳤다. 같은 일정으로는 두 일을 함께 끝낼 수 없다.',line:'일정을 늘리거나 범위를 줄여야 해. 무리한 교대를 부탁하면 나는 참여를 다시 생각할 거야.',labels:['보충 인계 준비를 하고 일정을 늘린다','이번에는 한 설비의 점검만 맡는다','긴 교대를 감수하고 원래 일정을 유지한다']}],
    trade:[{id:'shortfall',title:'약속보다 모자란 상자',text:'납품 제안에 적은 수량과 실제 확인한 상자 수가 다르다. 부족분의 운송비를 누가 부담할지 정해야 한다.',line:'부족한 수량을 숨길 수는 없어. 운송비를 더 내거나, 실제 수량에 맞게 약속을 줄이자.',labels:['추가 운송비를 내가 부담한다','동료와 동의해 추가 운송비를 나눈다','실제 수량으로 계약 범위와 보수를 줄인다']},
      {id:'cart',title:'한 번에 실을 수 없는 짐',text:'짐수레의 적재량으로는 제안한 물량을 한 번에 옮길 수 없다. 추가 운송에 드는 부담을 나눌지 묻는다.',line:'누가 비용을 내는지 적어 두자. 내 돈을 쓰는 일이라면 나도 동의할 수 있어야 해.',labels:['추가 운송편을 내 돈으로 마련한다','동료와 추가 운송편의 비용을 나눈다','이번에는 실을 수 있는 물량만 맡는다']}],
    care:[{id:'privacy',title:'도움을 받는 조건이 된 이름',text:'보충 모임의 참여 사유가 적힌 명단을 그대로 제출해 달라는 요청이 왔다. 필요한 지원을 증명하면서 사생활도 지켜야 한다.',line:'도움이 필요하다는 것과 개인 사정을 모두에게 알리는 것은 다른 일이에요. 어떤 방식으로 확인할지 정해요.',labels:['이름을 가리고 확인 자료를 다시 만든다','개별 동의를 직접 확인해 필요한 정보만 쓴다','개인 사유가 필요 없는 소규모 모임으로 줄인다']},
      {id:'seats',title:'모임의 빈자리보다 많은 신청',text:'예정된 자리보다 신청자가 많다. 사정을 확인할 시간을 더 쓰거나, 동의를 받아 나누어 진행하거나, 범위를 좁혀야 한다.',line:'사람을 더 받겠다고 적기만 해서는 자리가 생기지 않아요. 확인할 수 있는 만큼 약속해요.',labels:['익명으로 필요를 다시 확인하고 일정을 늘린다','동의를 직접 구해 순서를 나누어 진행한다','이번에는 확인 가능한 인원만 맡는다']}],
    civic:[{id:'redaction',title:'안내문에 섞인 개인 기록',text:'누구나 읽게 될 안내문에 신청인의 사정이 그대로 들어 있다. 원본 대조와 공개 범위를 따로 정해야 한다.',line:'확인한 사실을 빼면 안 되지만, 이름과 사정까지 전부 안내문에 싣는 것은 다시 생각해 봐요.',labels:['준비비를 들여 원본과 공개용 사본을 재대조한다','확인된 내용은 유지하고 개인 정보만 가린다','이번에는 공통 절차 안내만 맡는다']},
      {id:'credit',title:'자료를 만든 사람이 빠진 안내',text:'여러 사람이 모은 자료의 출처가 정리되지 않았다. 공을 독차지하지 않으면서 누가 무엇을 확인했는지 남겨야 한다.',line:'표지에 이름을 더 쓰는 것보다 어떤 자료를 누가 확인했는지 명확하게 남기고 싶어요.',labels:['자료별 확인자와 출처를 다시 대조한다','사적인 사정은 가리고 확인 역할을 정리한다','출처를 확인한 공통 절차만 안내한다']}],
    military:[{id:'stores',title:'재고표와 다른 준비 상자',text:'현장 확인용 상자와 보고된 준비 목록이 맞지 않는다. 작은 확인 제안이 부대 전체의 준비 완료 보고로 오해되지 않게 범위를 정한다.',line:'확인하지 않은 것을 준비됐다고 말하지는 말자. 더 확인할 시간과 이번 제안의 범위를 정하자.',labels:['개인 준비비로 확인 일정을 다시 맞춘다','내가 직접 긴 현장 확인을 맡는다','확인된 항목만 담은 제한 보고로 줄인다']},
      {id:'leave',title:'동료의 교육과 겹친 확인 일정',text:'현장 확인 일정이 동료의 교육과 겹쳤다. 지휘 명령으로 밀어붙이는 대신 누가 무엇을 맡을지 다시 정해야 한다.',line:'내 교육 일정도 지켜야 해요. 같이 할 수 있는 범위와 날짜를 이야기해요.',labels:['준비비를 들여 일정을 다시 맞춘다','긴 확인 일정을 맡아 원래 기한을 지킨다','이번에는 직접 확인한 항목만 맡는다']}],
    patrol:[{id:'crossing',title:'물길에 막힌 밤길',text:'침수된 길을 빼면 안내 경로가 달라진다. 주민에게 우회 시간을 묻거나 공개된 길만 확인하거나, 안내 구역을 줄여야 한다.',line:'집 앞과 통행 시간을 묻는다면 먼저 동의를 구해 줘요. 개인의 동선까지 공개하지 말아요.',labels:['주민의 동의를 구하며 우회 경로를 확인한다','공개된 길과 조명 상태만 직접 확인한다','확인된 일부 구역의 밤길만 맡는다']},
      {id:'doorsteps',title:'집 앞까지 들어가는 안내도',text:'편리한 밤길 안내를 만들려다 주민의 귀가 시간과 집 위치를 자세히 적게 됐다. 동의와 공개 범위를 결정해야 한다.',line:'안전한 길을 알려 주는 지도라면 좋겠어요. 누가 언제 집을 비우는지 드러내는 표가 되지는 않았으면 해요.',labels:['동의를 구하고 개인 동선을 뺀 경로를 확인한다','공개된 길과 조명 상태만 안내한다','이번에는 일부 공용 구역의 안내만 맡는다']}]
  };
  function create({actor,templates,agreements,pool,money,relation,log,terms}){
    function prepare(state,r){
      const previous=state.life.projects.runs.filter(p=>p.id!==r.id&&p.actor===r.actor&&p.type===r.type&&p.incident).at(-1);
      let seed=(state.randomState.seed^r.id)>>>0;for(const char of r.partner||r.actor)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
      let index=previous?1-cases[r.type].findIndex(c=>c.id===previous.incident.case):seed%2;
      if(r.type==='patrol')index=state.flooded>0?0:1;
      if(r.type==='workshop'&&state.flooded>0)index=0;
      if(r.type==='military'&&state.life.people[r.partner]?.society.training)index=1;
      r.incident={case:cases[r.type][index].id,selectedDay:null};
    }
    function data(r){return cases[r.type].find(c=>c.id===r.incident?.case);}
    function opinion(state,r){
      const p=state.life.people[r.partner];if(!p)return null;
      const s=p.society,upcoming=Boolean(s.training&&s.training.dueDay>state.day);return {person:p.id,name:p.name,health:p.health,independence:s.independence,security:s.security,community:s.community,
        trainingSoon:Boolean(upcoming&&s.training.dueDay<=state.day+30),preference:upcoming?'schedule':s.security>=65?'careful':s.community>=60?'sharing':s.independence>=65?'autonomy':'speed'};
    }
    function plans(r){
      const general={workshop:[{cash:4,energy:8,delay:7,score:6,tag:'careful'},{energy:5,score:3,cap:18,tag:'schedule'},{energy:14,score:4,intense:true,tag:'speed'}],
        trade:[{cash:6,energy:8,score:6,tag:'careful'},{cash:2,peerCash:2,energy:6,score:4,tag:'sharing'},{energy:5,score:3,cap:18,tag:'schedule'}],
        care:[{energy:10,delay:7,score:6,tag:'careful'},{energy:14,score:4,tag:'autonomy'},{energy:5,score:3,cap:18,tag:'schedule'}],
        civic:[{cash:4,energy:8,delay:7,score:6,tag:'careful'},{energy:10,score:4,tag:'autonomy'},{energy:5,score:3,cap:18,tag:'schedule'}],
        military:[{cash:4,energy:8,delay:7,score:6,tag:'careful'},{energy:14,score:4,intense:true,tag:'speed'},{energy:5,score:3,cap:18,tag:'schedule'}],
        patrol:[{energy:12,delay:7,score:6,tag:'careful'},{energy:10,score:4,tag:'autonomy'},{energy:5,score:3,cap:18,tag:'schedule'}]};return general[r.type];
    }
    function plan(r,id){if(id==='field:fund')return {...plans(r)[0],cash:0,fund:4};const index=Number(id.slice(6));return plans(r)[index];}
    function reaction(r,p){const o=r.incident.opinion;if(!o)return {leaves:false,delta:0,text:'혼자 맡은 범위와 부담으로 진행한다.'};
      if(p.delay&&o.trainingSoon)return {leaves:true,delta:-2,text:o.name+'은 임박한 교육을 지키기 위해 이번 제안에서 빠지겠다고 했다.'};
      if(p.intense&&(o.health<65||o.independence>=70||o.security>=70))return {leaves:true,delta:-2,text:o.name+'은 긴 교대와 무리한 일정을 거절하고 이번 제안에서 빠지겠다고 했다.'};
      const agrees=o.preference===p.tag||o.preference==='sharing'&&Boolean(p.peerCash);
      return {leaves:false,delta:agrees?2:0,text:o.name+(agrees?'은 자신의 생각이 반영된 조건에 동의했다.':'은 역할과 범위를 확인하고 함께 진행하기로 했다.')};
    }
    function lines(state,r){const c=data(r);if(!r.incident.opinionCaptured){r.incident.opinion=opinion(state,r);r.incident.opinionCaptured=true;}
      const o=r.incident.opinion,preferences={schedule:'다가오는 교육 일정은 지키고 싶어요.',careful:'충분히 확인하고 무리하지 않는 쪽을 원해요.',sharing:'누가 어떤 부담을 지는지 서로 동의하고 정하고 싶어요.',autonomy:'제 일정과 맡을 범위는 저도 결정하고 싶어요.',speed:'충분히 확인할 수 있다면 원래 일정도 지키고 싶어요.'};
      return [{speaker:state.life.people[templates[r.type].client]?.name||'의뢰인',text:c.text},{speaker:o?.name||'의뢰인',text:c.line},...(o?[{speaker:o.name,text:preferences[o.preference]}]:[])];
    }
    function choices(state,r){const c=data(r),p=state.life.people[r.partner];
      const all=plans(r).map((p,index)=>({id:'field:'+index,plan:p,title:c.labels[index]}));
      if(plans(r)[0].cash===4&&agreements.canSupport(state,r))all.push({id:'field:fund',plan:plan(r,'field:fund'),title:'공동 준비금을 써서 '+c.labels[0].replace(/^준비비를 들여 /,'').replace(/^개인 준비비로 /,'')});
      return all.map(({id,plan:p,title})=>{const cap=p.cap?p.cap*terms(r).multiplier:terms(r).budget;const answer=reaction(r,p),sharedOkay=!p.peerCash||Boolean(state.life.people[r.partner]&&state.life.people[r.partner].wealth>=p.peerCash&&state.life.people[r.partner].relationship>=55&&r.incident.opinion.community>=50),fundOkay=!p.fund||agreements.canSupport(state,r)&&!answer.leaves;
        const peer=state.life.people[r.partner],refusal=!p.peerCash||sharedOkay?null:!peer?'비용을 나눌 동료가 없다.':peer.wealth<p.peerCash?peer.name+'의 개인 돈이 부족하다.':peer.relationship<55?peer.name+'은 비용을 나눌 만큼 신뢰하지 않는다.':peer.name+'은 추가 비용 분담에 동의하지 않는다.';
        const detail='행동 1 · 기력 '+p.energy+(p.cash?' · 내 돈 '+p.cash:'')+(p.peerCash?' + 동료 돈 '+p.peerCash+' · 동료 동의 필요':'')+(p.fund?' · 공동 준비금 '+p.fund:'')+' · 현장 확인 +'+p.score+(p.delay?' · 다음 비교 '+p.delay+'일 연기':'')+(p.cap?' · 선정 보수 '+cap+' / 남은 '+(terms(r).budget-cap)+'은 의뢰인 반환':' · 선정 보수 '+terms(r).budget)+' · '+(refusal||answer.text);
        return {id,title,detail,disabled:state.actions<1||state.energy<p.energy||((p.cash||0)>0&&state.cash<p.cash)||!sharedOkay||!fundOkay};});
    }
    function resolve(state,r,id){
      const p=plan(r,id),answer=reaction(r,p),peer=r.partner;
      const entry=r.choices.at(-1);entry.cash=p.cash||0;entry.personCash=p.peerCash||0;entry.fund=p.fund||0;
      state.actions--;state.energy-=p.energy;money(state,actor(state),-(p.cash||0));if(p.peerCash)money(state,peer,-p.peerCash);
      if(p.fund)agreements.support(state,r,'현장 의뢰: '+data(r).title);
      r.incident.choice=id;r.incident.selectedDay=state.day;r.incident.cost={actor:p.cash||0,person:p.peerCash||0,fund:p.fund||0};r.incident.effect={score:p.score,cap:p.cap?p.cap*terms(r).multiplier:terms(r).budget,delay:p.delay||0};r.incident.reaction=answer.text;r.awardCap=p.cap?p.cap*terms(r).multiplier:terms(r).budget;
      if(peer&&answer.delta)relation(state,r,peer,answer.delta,answer.text);
      if(answer.leaves){const settlement=agreements.depart(state,r,answer.text);if(settlement)r.incident.reaction+=' '+settlement;r.formerPartner=peer;r.partner=null;r.partnerScore=0;r.agreement=null;state.life.people[peer].workLinks[r.actor].lastOutcome='steppedAway';}
      r.stage='contest';r.dueDay=Math.max(state.day+1,r.contestDay+(p.delay||0));log(state,r,data(r).title+' · '+data(r).labels[id==='field:fund'?0:Number(id.slice(6))]+' · '+answer.text);
      return data(r).title+' · '+r.incident.reaction+' 다음 비교 '+r.dueDay+'일. 선정 보수 '+r.awardCap+'.';
    }
    function reply(event,id){return {reply:event.fieldReplies?.[id]||'현장의 조건과 각자의 부담을 확인하겠습니다.',speaker:event.workProject?.speaker||'동료',reaction:'이번 조건과 실제 지출, 함께할 사람을 제안에 기록하겠습니다.'};}
    return {prepare,data,lines,choices,resolve,reply};
  }
  const api={cases,create};if(typeof module!=='undefined')module.exports=api;root.WorkIncidents=api;
})(globalThis);
