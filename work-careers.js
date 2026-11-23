'use strict';
(function(root){
  const levels={
    standard:{level:'standard',name:'일반 의뢰',budget:24,startFee:4,peerPay:6,coauthorPay:4,multiplier:1,compareDays:7,reviewDays:14,difficulty:0},
    experienced:{level:'experienced',name:'숙련 의뢰',budget:48,startFee:8,peerPay:12,coauthorPay:8,multiplier:2,compareDays:14,reviewDays:28,difficulty:4}
  };
  function terms(run){return run?.terms||levels.standard;}
  function summary(state,type,id=state.life.activeId||'player'){
    const records=[...new Map((state.life.projects?.runs||[]).filter(r=>r.actor===id&&r.type===type&&['complete','cancelled'].includes(r.status)).map(r=>[r.id,r])).values()];
    const completed=records.filter(r=>r.status==='complete');
    const paid=completed.filter(r=>r.won===true&&r.escrow===0&&(r.payments||[]).reduce((sum,p)=>sum+p.amount,0)===(r.awardCap||terms(r).budget));
    const reviewed=completed.filter(r=>!r.blame&&r.incident?.choice&&r.incident?.effect);
    const honestLosses=completed.filter(r=>r.won===false&&!r.blame&&r.escrow===0).length,blamed=completed.filter(r=>r.blame).length;
    const agreements=[...new Map((state.life.workAgreements?.contracts||[]).filter(a=>a.actor===id&&a.type===type).map(a=>[a.id,a])).values()];
    const kept=agreements.filter(a=>a.status==='fulfilled').length,broken=agreements.filter(a=>a.status==='broken').length;
    const recent=[...completed].sort((a,b)=>b.closedDay-a.closedDay||b.id-a.id).slice(0,5),paidIds=new Set(paid.map(r=>r.id));
    const recentAgreements=agreements.filter(a=>a.status!=='active').sort((a,b)=>(b.closedDay??0)-(a.closedDay??0)||b.id-a.id).slice(0,3);
    const trust=Math.max(0,Math.min(10,recent.reduce((sum,r)=>sum+(r.blame?-3:paidIds.has(r.id)?2:r.won===false?1:0),0)+recentAgreements.reduce((sum,a)=>sum+(a.status==='fulfilled'?1:a.status==='broken'?-2:0),0)));
    const missing=[];if(paid.length<2)missing.push('선정·보수 정산 '+paid.length+'/2회');if(!reviewed.length)missing.push('현장 의뢰 결과 확인 0/1회');if(trust<4)missing.push('실무 신뢰 '+trust+'/4');
    const earned=records.reduce((sum,r)=>sum+(r.payments||[]).filter(p=>p.person===id).reduce((n,p)=>n+p.amount,0),0);
    const expenses=records.reduce((sum,r)=>sum+terms(r).startFee+(r.choices||[]).reduce((n,c)=>n+(c.cash||0),0),0);
    return {actor:id,type,paid:paid.length,field:reviewed.length,honestLosses,blamed,kept,broken,trust,earned,expenses,ready:!missing.length,missing,
      rank:!missing.length?'숙련 의뢰 가능':paid.length?'실무 경험을 쌓는 중':'첫 경력을 기다리는 중',records:[...records].sort((a,b)=>b.closedDay-a.closedDay||b.id-a.id)};
  }
  function requirement(state,type,grade='standard'){
    if(!Object.hasOwn(levels,grade))return '의뢰 규모를 확인하자';if(grade==='standard')return '';
    const s=summary(state,type);return s.ready?'':'숙련 의뢰 준비: '+s.missing.join(' · ');
  }
  const api={levels,terms,summary,requirement};if(typeof module!=='undefined')module.exports=api;root.WorkCareers=api;
})(globalThis);
