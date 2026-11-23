'use strict';
(() => {
  const SAVE_KEY = 'civitas-save-v1';
  const $ = (s, root = document) => root.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, min = 0, max = 12) => Math.max(min, Math.min(max, n));
  const number = n => Math.max(0, Number(n) || 0);
  const factions = {
    workers:{name:'골목 주민',sub:'식량 · 집세 · 안전',icon:'⌂',district:'market'},
    merchants:{name:'시장 상인',sub:'가격 · 통행 · 계약',icon:'◇',district:'market'},
    court:{name:'궁정 가문',sub:'혈통 · 의전 · 충성',icon:'♛',district:'palace'},
    watch:{name:'도시 경비대',sub:'증거 · 치안 · 정보',icon:'⌕',district:'watch'},
  };
  const districts = {
    market:{name:'시장 골목',label:'사람과 물자가 모이는 곳',tone:'#ad8461'},
    council:{name:'의회 언덕',label:'법과 표가 오가는 곳',tone:'#8c9d83'},
    palace:{name:'왕궁 구역',label:'가문과 권력이 얽힌 곳',tone:'#aa8c67'},
    watch:{name:'등대 지구',label:'경비대와 소문이 모이는 곳',tone:'#718993'},
  };
  const people = [
    {id:'jian',name:'지안',role:'세입자 연대의 기록관',face:'知',faction:'workers',line:'주민들이 한자리에 모이도록 돕고 싶어 한다.'},
    {id:'doyun',name:'도윤',role:'시장 조합의 젊은 상인',face:'道',faction:'merchants',line:'가격을 잡을 힘은 결국 거래망에 있다고 믿는다.'},
    {id:'yunseo',name:'윤서',role:'왕궁의 먼 친척',face:'允',faction:'court',line:'왕가의 빈자리를 둘러싼 소문을 알고 있다.'},
    {id:'minseok',name:'민석',role:'도시 경비대 수사관',face:'珉',faction:'watch',line:'사람보다 장부와 흔적을 먼저 믿는 편이다.'},
  ];
  const events = [
    {kicker:'제1장 · 궁핍의 봄',place:'시장 골목',title:'곡물 값이 하룻밤 새 두 배가 됐다',text:'새 통행세가 붙은 뒤 첫 장날. 품삯을 받은 사람들은 장바구니를 비운 채 돌아가고, 상인들은 창고 문을 닫았다. 당신에게는 아직 누구도 기대를 걸지 않는다.',options:[
      {label:'남은 돈으로 공동 솥을 연다',detail:'배고픈 이웃과 밤새 곡물을 나눈다.',effect:'−2냥 · 주민 지지와 조직력 상승',cost:2,faction:'workers',person:'jian',effects:{trust:2,organization:1,workers:2,relationship:1}},
      {label:'상인에게 내일의 물량을 먼저 맡는다',detail:'도윤의 거래망에 들어가 곡물을 되판다.',effect:'+3냥 · 상인 지지 상승, 주민 신뢰 하락',faction:'merchants',person:'doyun',effects:{cash:3,trust:-1,merchants:2,relationship:2}},
      {label:'경비대와 창고 봉인을 조사한다',detail:'누가 물량을 묶었는지 장부와 흔적을 찾는다.',effect:'증거 · 치안 영향력 상승',faction:'watch',person:'minseok',effects:{evidence:1,authority:1,watch:2,trust:-1,relationship:2}},
    ]},
    {kicker:'제2장 · 닫힌 문',place:'시장 골목',title:'세입자 한 가족이 거리로 쫓겨날 처지다',text:'집주인은 밀린 집세를 이유로 자물쇠를 바꿨다. 주민들은 화가 났지만, 누구도 앞에 나서지 않는다. 지안이 서명부를 들고 당신을 찾아왔다.',options:[
      {label:'세입자 연대의 서명부를 완성한다',detail:'골목 사람들과 함께 집주인에게 공개 협상을 요구한다.',effect:'조직력 · 주민 지지 상승',faction:'workers',person:'jian',effects:{organization:2,workers:2,trust:1,relationship:2}},
      {label:'도윤에게 임시 숙소와 보증을 부탁한다',detail:'상인의 신용을 빌려 가족이 머물 방을 구한다.',effect:'+2냥 · 상인 지지와 인맥 상승',faction:'merchants',person:'doyun',effects:{cash:2,merchants:1,relationship:2}},
      {label:'집주인의 계약 장부를 몰래 살핀다',detail:'경비대 수사관 민석과 거래할 증거를 찾는다.',effect:'증거 · 치안 영향력 상승',faction:'watch',person:'minseok',effects:{evidence:2,authority:1,watch:1,trust:1,relationship:1}},
    ]},
    {kicker:'제3장 · 초대장',place:'의회 언덕',title:'세 갈래의 문이 당신 앞에 열렸다',text:'의회는 빈 자리를 채울 얼굴을 찾고, 왕궁은 오래된 가문의 저녁 연회를 준비한다. 경비대도 정보원을 모집한다. 어느 쪽 문턱을 밟든, 다른 문은 닫히지 않는다.',options:[
      {label:'의회 토론회에서 집세 문제를 말한다',detail:'주민 앞에서 공개적으로 해결책을 제시한다.',effect:'영향력 · 주민 지지 상승',faction:'workers',person:'jian',effects:{influence:2,workers:1,trust:1,relationship:1}},
      {label:'왕궁 연회에서 윤서를 만난다',detail:'가문의 계승 문제에 관한 소문을 듣는다.',effect:'−1냥 · 궁정 지지와 인맥 상승',cost:1,faction:'court',person:'yunseo',effects:{cash:-1,court:2,relationship:2}},
      {label:'민석의 수사에 합류한다',detail:'시장 창고의 봉인 기록을 대조한다.',effect:'증거 · 치안 영향력 상승',faction:'watch',person:'minseok',effects:{evidence:1,authority:2,watch:2,relationship:1}},
    ]},
    {kicker:'제4장 · 봉인된 장부',place:'등대 지구',title:'도시의 돈이 사라진 흔적을 찾았다',text:'창고 수리비와 경비대 급료가 같은 날 두 번 지급됐다. 장부 사본에는 시장 조합과 궁정 회계관의 인장이 함께 찍혀 있다. 공개하면 동맹도 적도 생긴다.',options:[
      {label:'장부를 주민 회의에 공개한다',detail:'진실을 알리고, 의회에 공개 조사를 요구한다.',effect:'신뢰 · 영향력 상승, 관계 하나 악화',faction:'workers',person:'jian',effects:{evidence:-1,trust:2,influence:2,workers:1,relationship:-1},flags:{scandal:true}},
      {label:'윤서에게 원본을 맡기고 궁정을 돕는다',detail:'왕가가 회계관을 정리하도록 조용히 손을 보탠다.',effect:'궁정 지지 · 인맥 상승, 신뢰 하락',faction:'court',person:'yunseo',effects:{court:2,relationship:2,trust:-2}},
      {label:'민석에게 장부를 넘겨 비밀 정보망을 만든다',detail:'공식 수사가 닿지 않는 곳에서 증거를 모은다.',effect:'증거 · 치안 영향력 상승',faction:'watch',person:'minseok',effects:{evidence:2,authority:1,watch:1,relationship:1}},
    ]},
    {kicker:'제5장 · 빈 의자',place:'의회 언덕',title:'대표 한 자리를 두고 선거가 열린다',text:'주민 대표가 물러나고, 의회는 새 선거를 공고했다. 왕궁의 계승 문제도 급해졌다. 경비대장은 당신에게 정식 수사관 자리를 제안한다. 이제 기반을 공식적인 권한으로 바꿀 때다.',options:[
      {label:'주민 대표 선거에 출마한다',detail:'지금까지 쌓은 신뢰와 조직을 표로 바꾼다.',effect:'−2냥 · 후보 등록, 주민 지지 상승',cost:2,faction:'workers',person:'jian',effects:{cash:-2,influence:3,workers:1,trust:1},flags:{campaign:true}},
      {label:'궁정의 계승 연합에 이름을 올린다',detail:'윤서와 함께 왕위 계승 협상을 시작한다.',effect:'−1냥 · 왕실 계승권과 궁정 지지 상승',cost:1,faction:'court',person:'yunseo',effects:{cash:-1,court:3,relationship:1},flags:{royalClaim:true}},
      {label:'경비대 정보국의 정식 제안을 받는다',detail:'도시 안의 음모를 수사할 권한을 얻는다.',effect:'수사 권한 · 정보망 상승',faction:'watch',person:'minseok',effects:{authority:2,watch:2,evidence:1},flags:{spyJoin:true}},
    ]},
    {kicker:'제6장 · 선택의 밤',place:'시장 골목',title:'내일, 도시의 주인이 바뀐다',text:'투표함은 봉인됐고, 왕궁에는 새 깃발이 걸렸다. 경비대는 마지막 보고서를 기다린다. 당신이 지난날 누구와 무엇을 나눴는지가 이제 결과를 만든다.',options:[
      {label:'주민들과 함께 투표소를 지킨다',detail:'선거의 공정성을 감시하고 지지자들을 모은다.',effect:'조직력 · 주민 지지 크게 상승',faction:'workers',person:'jian',effects:{organization:2,workers:2,trust:1},flags:{campaign:true}},
      {label:'궁정 가문들의 최종 합의를 끌어낸다',detail:'계승 연합의 마지막 지지를 확보한다.',effect:'−2냥 · 궁정 지지 크게 상승',cost:2,faction:'court',person:'yunseo',effects:{cash:-2,court:3,relationship:1},flags:{royalClaim:true}},
      {label:'마지막 증거로 간첩 조직을 무너뜨린다',detail:'정보망의 출처를 지키면서 수사를 마무리한다.',effect:'증거 · 치안 영향력 크게 상승',faction:'watch',person:'minseok',effects:{evidence:2,authority:1,watch:2,trust:1},flags:{spyJoin:true}},
    ]},
  ];
  const fresh = () => ({version:1,turn:0,tab:'city',district:'market',goal:'civic',name:'민서',cash:6,trust:1,influence:0,organization:0,evidence:0,authority:0,relationship:0,groups:{workers:1,merchants:1,court:0,watch:1},contacts:Object.fromEntries(people.map(p=>[p.id,0])),flags:{},history:[],complete:false,role:'평민'});
  let state;
  try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); state = saved?.version===1 ? {...fresh(),...saved,groups:{...fresh().groups,...saved.groups},contacts:{...fresh().contacts,...saved.contacts},flags:{...fresh().flags,...saved.flags}} : fresh(); }
  catch { state = fresh(); }
  const career = {
    civic:{name:'민심과 의회',icon:'⚖',sub:'주민을 모아 대표와 대통령에 도전한다.',goal:'주민 대표 선거에서 표를 모으고, 정책 연합으로 도시를 움직인다.'},
    crown:{name:'궁정과 왕위',icon:'♛',sub:'가문과 계승권을 통해 왕좌를 노린다.',goal:'궁정 가문의 신뢰를 얻고, 후계 분쟁에서 계승권을 확보한다.'},
    shadow:{name:'수사와 첩보',icon:'⌕',sub:'경찰에서 정보기관의 실세로 올라선다.',goal:'증거와 정보망으로 사건을 해결하고 국가 권한을 얻는다.'},
  };
  const money = n => `${Math.max(0,n)}냥`;
  function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));$('#saveState').textContent='저장됨';}catch{$('#saveState').textContent='기록 중';}}
  function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1900);}
  function score(){return {
    civic:state.groups.workers*1.4+state.organization*2+state.influence+state.trust*.7+(state.goal==='civic'?2:0),
    crown:state.groups.court*2+state.relationship*.8+(state.goal==='crown'?2:0),
    shadow:state.groups.watch*1.5+state.evidence*2+state.authority*.7+(state.goal==='shadow'?2:0),
  };}
  function outcome(){
    const s=score(),lead=Object.entries(s).sort((a,b)=>b[1]-a[1])[0][0];
    if(lead==='civic'){
      if(state.flags.campaign&&s.civic>=14)return {name:'주민 대표',tag:'골목에서 시작한 의회 정치',text:'주민들은 당신의 이름을 투표함에 적었습니다. 이제 첫 법안을 내고, 도시의 예산과 다음 선거를 책임져야 합니다.',next:'의원으로 시작'};
      if(state.organization>=3)return {name:'세입자 연대의 대표',tag:'거리에서 시작한 정치',text:'당신은 아직 의석을 얻지 못했지만, 누구도 무시할 수 없는 주민 조직을 만들었습니다. 이 조직은 다음 선거의 기반이 됩니다.',next:'조직을 이끌다'};
      return {name:'지역 의회 후보',tag:'첫 선거를 치른 평민',text:'표는 충분하지 않았지만, 선거는 이름과 약속을 도시 전체에 알렸습니다. 다음에는 더 넓은 연합이 필요합니다.',next:'재출마 준비'};
    }
    if(lead==='crown'){
      if(state.flags.royalClaim&&s.crown>=20)return {name:'왕',tag:'왕위 계승 분쟁의 승자',text:'궁정은 당신의 계승권을 인정했습니다. 왕관을 썼지만, 귀족들의 약속과 거리의 분노가 함께 따라옵니다.',next:'왕으로 통치'};
      if(state.flags.royalClaim)return {name:'왕위 계승 후보',tag:'궁정에 발을 들인 평민',text:'왕관은 아직 멀지만, 중요한 가문들이 당신의 편에 섰습니다. 다음 분쟁에서 이 인맥이 권력이 됩니다.',next:'계승권을 다지다'};
      return {name:'궁정의 책사',tag:'왕실을 움직이는 인물',text:'혈통은 없지만 궁정의 신뢰와 정보가 당신의 자산이 됐습니다. 이제 후계자를 세우거나 왕실을 바꿀 수 있습니다.',next:'궁정에 남다'};
    }
    if(state.flags.spyJoin&&s.shadow>=17)return {name:'정보국 책임자',tag:'도시의 그림자를 다루는 사람',text:'경비대에서 시작한 수사망이 정보기관으로 성장했습니다. 당신은 위협을 막을 수 있지만, 감시의 한계를 정해야 합니다.',next:'정보기관을 이끌다'};
    if(state.evidence>=3)return {name:'수사관',tag:'증거로 얻은 공직',text:'장부와 증언을 따라 부패를 밝혀냈습니다. 권한은 작지만, 당신의 보고서는 왕궁과 의회를 움직입니다.',next:'수사를 계속하다'};
    return {name:'경비대 정보원',tag:'도시의 소문을 쥔 사람',text:'당신은 도시의 비밀을 들을 수 있는 사람이 됐습니다. 이제 누구를 감시할지, 누구를 지킬지 선택해야 합니다.',next:'정보망을 넓히다'};
  }
  function apply(option){
    const effects=option.effects||{};
    for(const key of ['cash','trust','influence','organization','evidence','authority','relationship'])state[key]=clamp((state[key]||0)+(effects[key]||0),0,key==='cash'?30:24);
    for(const key of Object.keys(factions))state.groups[key]=clamp(state.groups[key]+(effects[key]||0),0,12);
    if(option.person)state.contacts[option.person]=clamp((state.contacts[option.person]||0)+(effects.relationship||0),0,10);
    Object.assign(state.flags,option.flags||{});
    const place=districts[state.district],bonus=option.faction&&factions[option.faction].district===state.district;
    if(bonus)state.groups[option.faction]=clamp(state.groups[option.faction]+1,0,12);
    const peopleText=option.person?` ${people.find(p=>p.id===option.person).name}과의 관계가 ${effects.relationship>0?'깊어졌다':'흔들렸다'}.`:'';
    const bonusText=bonus?` ${place.name}에서 행동해 ${factions[option.faction].name}의 지지를 추가로 얻었다.`:'';
    state.history.unshift({turn:state.turn+1,place:place.name,choice:option.label,text:option.detail+peopleText+bonusText});
    state.turn++;
    if(state.turn>=events.length){state.complete=true;state.role=outcome().name;state.history.unshift({turn:7,place:'도시 광장',choice:'첫 권력의 자리',text:`당신은 ${state.role}이 되었다. ${outcome().text}`});}
    state.tab='city';persist();render();
    if(bonus)toast(`${place.name} · ${factions[option.faction].name} +1`);
    else toast('선택이 사람들과 도시의 기억에 남았다');
  }
  function mapSvg(){
    const shapes=[
      ['market','M30 75 L145 38 L220 80 L175 143 L60 150 Z',135,103],
      ['council','M218 58 L342 34 L420 87 L365 145 L222 116 Z',320,92],
      ['palace','M62 157 L175 145 L230 208 L165 263 L47 220 Z',131,204],
      ['watch','M230 120 L365 148 L420 218 L286 255 L218 209 Z',317,194],
    ];
    return `<svg class="city-map" viewBox="0 0 460 290" role="img" aria-label="네 구역으로 나뉜 도시 지도"><defs><pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="#f5ecd0" stroke-opacity=".12" stroke-width=".7"/></pattern><linearGradient id="land" x2="0" y2="1"><stop stop-color="#82917a"/><stop offset="1" stop-color="#526a61"/></linearGradient></defs><rect width="460" height="290" fill="url(#land)"/><path d="M0 35Q102 60 174 0H250Q195 46 121 78T0 91M0 265Q110 225 176 285H0" fill="#617883" opacity=".8"/><path d="M-10 158C80 117 136 128 205 114S332 107 465 125M116 0C150 67 189 108 235 138S300 214 348 300" fill="none" stroke="#d3bf91" stroke-opacity=".78" stroke-width="10"/><path d="M-10 158C80 117 136 128 205 114S332 107 465 125M116 0C150 67 189 108 235 138S300 214 348 300" fill="none" stroke="#efe1bd" stroke-opacity=".65" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M26 232l40-21 17 20-28 21zM371 51l25 9 8 24-31-4zM183 24l24-11 17 17-22 17z" fill="#e4d6ad" opacity=".5"/><g opacity=".9"><circle cx="60" cy="96" r="3" fill="#edf0dc"/><circle cx="80" cy="103" r="3" fill="#e5d4a9"/><circle cx="194" cy="171" r="4" fill="#c7ad76"/><circle cx="348" cy="90" r="5" fill="#d7c18a"/><circle cx="332" cy="224" r="4" fill="#e7dfca"/></g>${shapes.map(([id,d,x,y])=>`<g data-district="${id}" class="district-shape ${state.district===id?'selected':''}"><path d="${d}" fill="${districts[id].tone}" fill-opacity=".33" stroke="#f0e8d7" stroke-opacity=".5" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${state.district===id?8:5}" fill="${state.district===id?'#f1cf81':'#f2ead7'}" stroke="#303c37" stroke-width="2"/><text class="map-label" x="${x}" y="${y+21}" text-anchor="middle">${districts[id].name}</text></g>`).join('')}</svg>`;
  }
  function chapterHead(title,sub){return `<div class="chapter-head"><div><p class="eyebrow">CHAPTER ${String(Math.min(state.turn+1,6)).padStart(2,'0')} · THE CITY REMEMBERS</p><h1>${title}</h1></div><div class="chapter-meta">${sub}</div></div>`;}
  function cityView(){
    if(state.complete){const r=outcome();return `${chapterHead('첫 번째 권력','한 계절 · 6번의 결정')}<article class="result"><span class="result-mark">✦</span><p class="eyebrow">${esc(r.tag)}</p><h2>${esc(r.name)}</h2><p>${esc(r.text)}</p><div class="route"><span class="route-glyph">${career[state.goal].icon}</span><span class="route-copy"><b>${career[state.goal].name}</b><small>${career[state.goal].goal}</small></span></div><button class="primary" data-action="new-life">다음 장을 시작한다</button></article><section class="panel" style="margin-top:12px"><h3>이번 삶의 기반</h3>${factionRows()}</section>`;}
    const e=events[state.turn],d=districts[state.district];
    return `${chapterHead('도시의 오늘',`제${state.turn+1}일째 · ${esc(d.name)}에 머무는 중`)}<section class="scene"><div class="scene-top"><span>1271 · 봄</span><span>자유 도시 · 북부 연안</span></div>${mapSvg()}<div class="scene-caption"><span><strong>${esc(d.name)}</strong> · ${esc(d.label)}</span><span>지도를 눌러 행동할 장소를 정하세요</span></div></section><article class="event-card"><div class="event-kicker"><span>${esc(e.kicker)}</span><span>현장 · ${esc(e.place)}</span></div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><div class="choice-list">${e.options.map((o,i)=>{const disabled=number(o.cost)>state.cash;const locationBonus=o.faction&&factions[o.faction].district===state.district;return `<button class="choice" data-choice="${i}" ${disabled?'disabled':''}><span class="choice-number">${i+1}</span><span><strong>${esc(o.label)}</strong><small>${esc(o.detail)}${disabled?' · 자금 부족':' '}${locationBonus?' · 이 구역과 맞는 행동':''}</small></span><span class="effect">${esc(o.effect)}</span></button>`;}).join('')}</div></article>`;
  }
  function factionRows(){return Object.entries(factions).map(([key,f])=>`<div class="faction"><span class="faction-icon">${f.icon}</span><div class="faction-name">${f.name}<small>${f.sub}</small><div class="mini-track"><i style="width:${Math.min(100,state.groups[key]*8)}%"></i></div></div><b class="faction-score">${state.groups[key]}</b></div>`).join('');}
  function sidePanels(){const s=score();return `<section class="panel"><h3>세력의 온도</h3><p class="muted" style="margin:-5px 0 10px;color:#93a09a;font-size:10px">내 행동이 바꾼 실제 지지 기반</p>${factionRows()}<div class="meters"><div><div class="meter-head"><span>주민 신뢰</span><b>${state.trust}</b></div><div class="meter-track"><div class="meter-fill" style="width:${Math.min(100,state.trust*4)}%"></div></div></div><div><div class="meter-head"><span>영향력</span><b>${state.influence}</b></div><div class="meter-track"><div class="meter-fill" style="width:${Math.min(100,state.influence*4)}%"></div></div></div></div></section><section class="panel"><h3>세 갈래의 야망</h3>${Object.entries(career).map(([key,r])=>`<div class="route ${state.goal===key?'active':''}"><span class="route-glyph">${r.icon}</span><span class="route-copy"><b>${r.name}</b><small>${r.sub}</small></span><span class="route-state">${Math.round(s[key])}</span></div>`).join('')}<p style="margin:10px 0 0;color:#929f99;font-size:10px">어느 길을 택해도 다른 세력과의 관계는 남습니다.</p></section>`;}
  function peopleView(){return `${chapterHead('인물과 세력','관계는 약속과 선택을 기억한다')}<section class="panel"><h3>당신의 선택을 기억하는 사람들</h3><div class="people-grid">${people.map(p=>`<article class="person-card"><span class="person-face">${p.face}</span><span><b>${p.name} · ${p.role}</b><small>${p.line}</small><small>${factions[p.faction].name} · ${state.groups[p.faction]} 지지</small></span><span class="relation">관계 ${state.contacts[p.id]||0}</span></article>`).join('')}</div></section><section class="panel"><h3>관계가 바뀐 순간</h3>${state.history.length?`<ol class="log-list">${state.history.filter(h=>/관계|인맥/.test(h.text)).slice(0,5).map(h=>`<li><time>${h.turn}일차</time><span>${esc(h.text)}</span></li>`).join('')||'<li><time>—</time><span>아직 깊어진 인연은 없습니다. 선택에 따라 사람이 당신을 기억하기 시작합니다.</span></li>'}</ol>`:'<p class="muted" style="color:#9aa6a0">아직 누구도 당신을 잘 모릅니다. 첫 약속과 행동이 관계를 만듭니다.</p>'}</section>`;}
  function ambitionView(){return `${chapterHead('나의 야망','목표를 바꿔도 지나온 인맥은 남는다')}<p class="muted" style="margin:0 0 14px;color:#a6b0a8">원하는 권력 경로를 고르세요. 선택한 목표는 결말의 방향에 영향을 주지만, 필요한 지지 기반은 직접 만들어야 합니다.</p><section class="goal-grid">${Object.entries(career).map(([key,r])=>`<button class="goal-card ${state.goal===key?'active':''}" data-goal="${key}"><span class="goal-icon">${r.icon}</span><b>${r.name}</b><small>${r.goal}</small></button>`).join('')}</section><section class="panel" style="margin-top:13px"><h3>이번 목표의 다음 조건</h3>${state.goal==='civic'?`<p class="muted" style="color:#aab4ad">주민 신뢰 ${state.trust}/8 · 조직력 ${state.organization}/3 · 선거 출마 ${state.flags.campaign?'완료':'필요'}</p><p class="muted" style="color:#87948e">주민 대표가 되면 다음 시대에 의회·법안·정당 연합이 열립니다.</p>`:state.goal==='crown'?`<p class="muted" style="color:#aab4ad">궁정 지지 ${state.groups.court}/8 · 계승 주장 ${state.flags.royalClaim?'완료':'필요'}</p><p class="muted" style="color:#87948e">왕위에 오르면 가문·후계·봉신 관리가 주요 플레이가 됩니다.</p>`:`<p class="muted" style="color:#aab4ad">경비대 지지 ${state.groups.watch}/6 · 증거 ${state.evidence}/4 · 정보국 제안 ${state.flags.spyJoin?'완료':'필요'}</p><p class="muted" style="color:#87948e">정보기관 책임자가 되면 수사망·비밀 작전·정치 감시를 다룹니다.</p>`}</section>`;}
  function chronicleView(){return `${chapterHead('연대기','당신의 행동이 도시의 기록이 된다')}<section class="panel"><h3>내가 남긴 흔적</h3>${state.history.length?`<ol class="log-list">${state.history.map(h=>`<li><time>${h.turn}일차<br>${esc(h.place)}</time><span><b>${esc(h.choice)}</b><br>${esc(h.text)}</span></li>`).join('')}</ol>`:'<p class="muted" style="color:#9aa6a0">아직 기록이 없습니다. 도시에서 첫 행동을 선택하면 연대기가 시작됩니다.</p>'}</section><section class="panel"><h3>지금 도시가 기억하는 당신</h3><p class="muted" style="color:#aab4ad">${state.name} · ${state.role}<br>${state.cash}냥 · 신뢰 ${state.trust} · 증거 ${state.evidence} · 조직 ${state.organization}</p><button class="primary" data-action="new-life">새로운 인생 시작</button></section>`;}
  function render(){
    $('#season').textContent=`봄 · ${1+Math.floor(state.turn/6)}년`;
    $('#playerName').textContent=state.name;$('#playerSub').textContent=`${districts[state.district].name} · ${state.role}`;$('#portrait').textContent=state.name.slice(0,1);$('#rank').textContent=`● ${state.role}`;
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
    if(state.tab==='city'){$('#screen').innerHTML=cityView();$('#rightbar').innerHTML=sidePanels();}
    if(state.tab==='people'){$('#screen').innerHTML=peopleView();$('#rightbar').innerHTML=sidePanels();}
    if(state.tab==='ambition'){$('#screen').innerHTML=ambitionView();$('#rightbar').innerHTML=sidePanels();}
    if(state.tab==='chronicle'){$('#screen').innerHTML=chronicleView();$('#rightbar').innerHTML=sidePanels();}
    persist();
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-tab]');if(nav){state.tab=nav.dataset.tab;render();return;}
    const area=e.target.closest('[data-district]');if(area){state.district=area.dataset.district;persist();render();toast(`${districts[state.district].name}을 행동 장소로 선택`);return;}
    const goal=e.target.closest('[data-goal]');if(goal){state.goal=goal.dataset.goal;persist();render();toast(`${career[state.goal].name}을 이번 인생의 목표로 선택`);return;}
    const choice=e.target.closest('[data-choice]');if(choice){if(choice.disabled)return;const option=events[state.turn]?.options[Number(choice.dataset.choice)];if(option)apply(option);return;}
    const action=e.target.closest('[data-action]');if(action?.dataset.action==='new-life'){state=fresh();persist();render();toast('새로운 평민의 삶이 시작됐다');}
  });
  render();
})();
