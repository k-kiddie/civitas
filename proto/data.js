"use strict";
// CIVITAS 맛보기 — "이름 없는 가문의 연대기" 콘텐츠.
// 장소에 가면 사건이 바로 터지고, 결과가 즉시 나온다. 선택지 효과 키:
// money fame health hostility rivalFame dirt recruit leave loyalty flag unflag
// resolve(위협 id) threat({id,left}) marry title build ending heal
(function (root) {
  const titles = [
    { name: "부두 일꾼", fame: 0 },
    { name: "동장", fame: 25 },
    { name: "시장", fame: 60 },
    { name: "벨라르의 주인", fame: 110 },
  ];
  const locations = [
    { id: "home", name: "하숙집", icon: "🏠", purpose: "회복·가족", x: 16, y: 55, title: 0 },
    { id: "dock", name: "부두", icon: "⚓", purpose: "돈벌이", x: 26, y: 82, title: 0 },
    { id: "fishing", name: "어촌", icon: "🎣", purpose: "명성·인심", x: 82, y: 70, title: 0 },
    { id: "alley", name: "뒷골목", icon: "🌙", purpose: "큰돈·약점·위험", x: 50, y: 60, title: 0 },
    { id: "market", name: "시장", icon: "🏮", purpose: "거래·사람", x: 52, y: 36, title: 0 },
    { id: "hall", name: "시청", icon: "🏛", purpose: "선거·법", x: 80, y: 30, title: 0 },
    { id: "union", aim: "조합 간부를 매수하려", name: "조합", icon: "⚒", purpose: "노동자·명성", x: 22, y: 24, title: 1 },
    { id: "manor", name: "강씨 저택", icon: "🏯", purpose: "라이벌과 결판", x: 52, y: 10, title: 2 },
  ];
  const companions = {
    eunho: { name: "은호", icon: "👷", role: "공장 노동자", assist: "force", perk: "완력 판정 +2" },
    sora: { name: "소라", icon: "🧕", role: "어촌 대표", assist: "talk", perk: "말솜씨 판정 +2 · 계절마다 명성 +1" },
    yun: { name: "윤", icon: "👴", role: "수문공", assist: "lore", perk: "학식 판정 +2 · 제방 비용 −20" },
    minseok: { name: "민석", icon: "👮", role: "경찰 보조", assist: "scheme", perk: "계략 판정 +2 · 자객·단속을 막는다" },
    seoyun: { name: "서윤", icon: "📜", role: "기록관 서기", assist: "lore", perk: "학식 판정 +2" },
  };
  const buildings = {
    stall: { name: "노점", icon: "🧺", cost: 15, income: 5, fame: 0, title: 0, desc: "계절마다 ₭+5" },
    dike: { name: "제방", icon: "🧱", cost: 50, income: 0, fame: 0, title: 0, unique: true, desc: "큰 장마를 막는다 · 지으면 명성 +8", now: { fame: 8 } },
    tavern: { name: "주점", icon: "🍶", cost: 35, income: 9, fame: 0, title: 1, desc: "계절마다 ₭+9 · 뒷골목 승부 +10%" },
    school: { name: "어촌 학교", icon: "🏫", cost: 40, income: 0, fame: 1, title: 1, unique: true, desc: "계절마다 명성 +1" },
    factory: { name: "공장", icon: "🏭", cost: 70, income: 20, fame: 0, title: 2, desc: "계절마다 ₭+20 · 강씨 적의 +10", now: { hostility: 10 } },
    press: { name: "신문사", icon: "📰", cost: 60, income: 3, fame: 2, title: 2, unique: true, desc: "계절마다 명성 +2 · 도윤 명성 −2" },
  };
  const LOTS = 6;
  const threats = {
    flood: { name: "큰 장마", icon: "🌊", hint: "제방(₭50)을 지으면 막는다" },
    debt: { name: "빚쟁이", icon: "💸", hint: "기한까지 돈을 0 이상으로" },
    customs: { name: "세관 단속", icon: "🚨", hint: "민석이 있거나 뒷골목에서 손을 쓰면 피한다" },
    assassin: { name: "강씨의 자객", icon: "🗡", hint: "민석이 있거나 뒷골목 청부업자로 막는다" },
    plague: { name: "열병", icon: "🤒", hint: "시장에서 약재를 비축하면 막는다" },
    sibling: { name: "동생의 노름빚", icon: "🎲", hint: "기한에 ₭25가 빠져나간다" },
  };
  // 도윤의 다음 수: 매 계절 미리 공개된다. 그 장소에 가면 막는다. 막지 못하면 계절 끝에 fail이 적용된다.
  const rivalMoves = [
    { id: "rice", aim: "어촌에 쌀을 돌리려", loc: "fishing", text: "어촌에 쌀을 돌린다", fail: { rivalFame: 4 } },
    { id: "smear", aim: "장터에 당신 험담을 퍼뜨리려", loc: "market", text: "장터에 당신 험담을 퍼뜨린다", fail: { fame: -4 } },
    { id: "monopoly", aim: "부두 일감을 독차지하려", loc: "dock", text: "부두 일감을 독점한다", fail: { money: -8 } },
    { id: "thugs", aim: "당신 가족을 위협하려", loc: "alley", text: "패거리로 당신 가족을 위협한다", fail: { health: -10 } },
    { id: "lobby", aim: "시청 서기들을 구워삶으려", loc: "hall", text: "시청 서기들을 구워삶는다", fail: { rivalFame: 5 } },
    { id: "rent", aim: "하숙집 주인을 매수해 집세를 올리려", loc: "home", text: "하숙집 주인을 매수해 집세를 올린다", fail: { money: -6 } },
    { id: "union", loc: "union", title: 1, text: "조합 간부를 매수한다", fail: { fame: -4, rivalFame: 3 } },
  ];
  // 선거는 정해진 계절 끝에 열린다. 놓치면 다음 선거까지 기다린다.
  const elections = { 1: [7, 15, 23, 31], 2: [11, 19, 27] };
  const origins = {
    worker: { name: "노동자 집안", desc: "₭20 · 명성 5 · 💪완력이 강하다", money: 20, fame: 5, stats: { talk: 1, force: 3, scheme: 1, lore: 0 }, unlock: null },
    merchant: { name: "상인 집안", desc: "₭50 · 명성 0 · 🗣말솜씨·🦊계략 · 강씨가 경계(적의 15)", money: 50, fame: 0, hostility: 15, stats: { talk: 3, force: 0, scheme: 2, lore: 1 }, unlock: "엔딩 1회" },
    noble: { name: "몰락한 귀족", desc: "₭30 · 명성 15 · 📚학식이 높다 · 서윤이 따른다", money: 30, fame: 15, companion: "seoyun", stats: { talk: 2, force: 0, scheme: 1, lore: 3 }, unlock: "시장 지위 달성" },
  };
  // 선택지 도우미
  const ch = (label, fx, text, extra = {}) => ({ label, fx, text, ...extra });
  const bet = (label, odds, win, lose, extra = {}) => ({ label, odds, win, lose, ...extra });
  // TRPG 판정: d20 + 능력치 + 도움 ≥ 난이도
  const check = (label, chk, win, lose, extra = {}) => ({ label, check: chk, win, lose, ...extra });
  const E = (id, loc, icon, title, text, choices, extra = {}) => ({ id, loc, icon, title, text, choices, ...extra });
  const events = [
    // ── 하숙집: 회복·가족 ──
    E("h_rest", "home", "🛏", "하숙방의 밤", "얇은 이불, 새는 지붕. 그래도 내 방이다.", [
      ch("푹 쉰다", { health: 25 }, "몸이 한결 가볍다."),
      ch("가족과 장부를 맞춘다", { money: 6, health: 10 }, "동생이 숨겨 둔 동전을 내놓는다."),
    ], { repeat: true }),
    E("h_marry", "home", "💍", "혼담이 들어왔다", "상인 집안에서 혼담을 넣었다. 지참금이 두둑하다.", [
      ch("혼인한다 (지참금 ₭30)", { money: 30, marry: "상인 집안 배우자", fame: 2 }, "가문에 식구가 늘었다. 이제 당신이 쓰러져도 대를 이을 사람이 있다."),
      ch("소라와 맺어지고 싶다", { marry: "소라", leave: "sora", fame: 6 }, "어촌 사람들이 혼례에 몰려온다. 소라는 이제 가족이다.", { need: { companion: "sora" } }),
      ch("아직 때가 아니다", {}, "중매쟁이가 혀를 찬다."),
    ], { cond: { fameMin: 12, notFlag: "married" }, once: true, priority: true }),
    E("h_fever", "home", "🤒", "열이 오른다", "식은땀이 멈추지 않는다.", [
      ch("의원을 부른다 (₭15)", { money: -15, health: 30 }, "쓴 탕약을 삼켰다. 열이 내린다.", { need: { money: 15 } }),
      bet("버틴다", 0.5, { fx: { health: 10 }, text: "아침이 되자 열이 내렸다." }, { fx: { health: -15 }, text: "밤새 앓았다. 몸이 더 상했다." }),
    ], { cond: { healthMax: 45 } }),
    E("h_letter", "home", "📜", "지워진 이름의 편지", "옛 왕실 기록보관소의 서기가 몰래 편지를 보냈다.", [
      ch("만나서 돕는다", { recruit: "seoyun" }, "서윤이 동료가 되었다. 기록 속 비밀을 함께 캔다."),
      ch("엮이지 않는다", { fame: 1 }, "편지는 아궁이에 들어갔다."),
    ], { cond: { seasonMin: 3, notCompanion: "seoyun" }, once: true }),
    // ── 부두: 돈벌이 ──
    E("d_work", "dock", "📦", "하역 일감", "배 세 척이 들어왔다. 일손이 모자란다.", [
      ch("하루 하역 (₭+14)", { money: 14, health: -5 }, "허리가 끊어질 듯하지만 품삯은 챙겼다."),
      bet("위험한 야간 하역", 0.6, { fx: { money: 30, health: -5 }, text: "어둠 속에서 두 배의 품삯을 받았다." }, { fx: { health: -20 }, text: "미끄러져 화물에 깔렸다." }),
    ], { repeat: true }),
    E("d_fight", "dock", "👊", "부두 패싸움", "강씨 패거리와 조합원들이 멱살을 잡았다.", [
      bet("뛰어들어 말린다", 0.5, { fx: { fame: 6, hostility: 5 }, text: "당신이 판을 갈랐다. 사람들이 이름을 묻는다." }, { fx: { health: -20, fame: 1 }, text: "주먹이 날아왔다. 그래도 사람들은 봤다." }, { bonus: [["eunho", 0.2]] }),
      check("말로 뜯어말린다", ["talk", 13], { fx: { fame: 5 }, text: "당신 말 한마디에 양쪽이 주먹을 내렸다." }, { fx: { fame: -2, health: -8 }, text: "아무도 듣지 않았다. 날아온 의자에 맞았다." }),
      check("뒤에서 판을 짠다", ["scheme", 14], { fx: { fame: 3, rivalFame: -3 }, text: "강씨 패거리가 경찰에게 끌려가게 만들었다." }, { fx: { hostility: 8 }, text: "강씨 쪽이 당신이 꾸민 걸 눈치챘다." }),
    ], { cooldown: 3 }),
    E("d_smuggle", "dock", "🍾", "선원의 제안", "“상자 몇 개만 옮겨 주면 돼. 세관은 모르게.”", [
      ch("옮긴다 (₭+35)", { money: 35, flag: "smuggler", threat: { id: "customs", left: 3 } }, "주머니가 두둑해졌다. 세관이 냄새를 맡기 시작했다."),
      ch("거절한다", { fame: 1 }, "선원이 침을 뱉고 돌아선다."),
    ], { cond: { notFlag: "smuggler" }, cooldown: 4 }),
    E("d_eunho", "dock", "👷", "밀린 품삯", "은호가 반장 앞에서 출근부를 흔든다. “사흘째 안 줬어!”", [
      bet("함께 반장에게 따진다", 0.55, { fx: { fame: 6, recruit: "eunho" }, text: "반장이 품삯을 내놨다. 은호가 동료가 되었다." }, { fx: { health: -10, fame: 2, recruit: "eunho" }, text: "얻어맞았지만, 은호는 당신 편이 되었다." }),
      ch("은호에게 돈을 빌려준다 (₭10)", { money: -10, recruit: "eunho" }, "은호가 고개를 숙인다. 동료가 되었다.", { need: { money: 10 } }),
      ch("내 일이 아니다", { fame: -1 }, "은호는 혼자 반장실로 들어간다."),
    ], { cond: { notCompanion: "eunho" }, once: true }),
    E("d_contract", "dock", "🤝", "도윤의 부두 계약", "선주 도윤이 웃는다. “내 배 일감은 당신만 쓰지. 대신 내 사람이 되는 거야.”", [
      ch("계약한다 (₭+40)", { money: 40, hostility: -20, fame: -5, flag: "kang_contract" }, "도윤과 손을 잡았다. 조합원들의 눈빛이 식는다."),
      ch("거절한다", { hostility: 15, fame: 3 }, "도윤의 웃음이 굳는다. 강씨 가문이 당신을 적으로 적었다."),
    ], { cond: { seasonMin: 1 }, once: true, priority: true }),
    // ── 어촌: 명성·인심 ──
    E("f_help", "fishing", "🐟", "어촌의 일손", "그물이 찢기고 배가 샌다. 사람이 모자란다.", [
      ch("그물 손질을 돕는다", { fame: 3, health: -5 }, "아이들이 당신 이름을 부르며 따라다닌다."),
      ch("쌀을 나눈다 (₭10)", { money: -10, fame: 6 }, "공터에 밥 짓는 연기가 오른다.", { need: { money: 10 } }),
    ], { repeat: true }),
    E("f_sora", "fishing", "🧕", "소라의 부탁", "“장마가 오면 어촌부터 잠겨요. 우리 편이 되어 줄래요?”", [
      ch("어촌을 지키겠다고 약속한다", { recruit: "sora", flag: "promise", fame: 3 }, "소라가 동료가 되었다. 약속은 장마 때 판가름 난다."),
      ch("확답은 못 하겠다", { fame: 1 }, "소라는 실망한 얼굴로 돌아선다."),
    ], { cond: { notCompanion: "sora", notFlag: "married_sora" }, once: true, priority: true }),
    E("f_yun", "fishing", "👴", "수문공 윤", "늙은 수문공이 물때를 읽는다. “제방을 쌓을 줄 아는 사람은 나뿐이지.”", [
      ch("술 한잔 사며 청한다 (₭8)", { money: -8, recruit: "yun" }, "윤이 동료가 되었다. 제방 비용이 줄어든다.", { need: { money: 8 } }),
      ch("나중에 찾아오겠다", {}, "윤은 다시 물만 바라본다."),
    ], { cond: { notCompanion: "yun" }, once: true }),
    E("f_festival", "fishing", "🎏", "어촌 축제", "풍어제가 열린다. 후원자를 찾고 있다.", [
      ch("후원한다 (₭20)", { money: -20, fame: 10 }, "깃발마다 당신 가문의 이름이 걸렸다.", { need: { money: 20 } }),
      bet("연설만 한다", 0.5, { fx: { fame: 7 }, text: "박수가 터졌다." }, { fx: { fame: -3 }, text: "말이 꼬였다. 누군가 웃었다." }, { bonus: [["sora", 0.25]] }),
    ], { cond: { fameMin: 15 }, cooldown: 4 }),
    E("f_fever", "fishing", "🤒", "열병 환자들", "어촌 오두막마다 기침 소리가 난다.", [
      ch("직접 돌본다", { health: -15, fame: 8 }, "밤새 물수건을 갈았다. 사람들은 잊지 않을 것이다."),
      ch("멀리한다", { fame: -2 }, "문 닫힌 오두막을 지나쳤다."),
    ], { cond: { threat: "plague" } }),
    // ── 뒷골목: 큰돈·약점·위험 ──
    E("a_gamble", "alley", "🎲", "지하 도박장", "연기 자욱한 방. 주사위 소리.", [
      bet("판돈 ₭20을 건다", 0.45, { fx: { money: 50 }, text: "주사위가 웃어 줬다. ₭50!" }, { fx: { money: -20 }, text: "판돈을 잃었다." }, { need: { money: 20 }, bonus: [["b:tavern", 0.1]] }),
      ch("구경하며 소문을 듣는다", { dirt: 1 }, "강씨 상관 이야기가 흘러나온다. (약점 +1)"),
    ], { repeat: true }),
    E("a_broker", "alley", "🕯", "소문 거간꾼", "“강씨 가문의 비밀? 값만 맞으면.”", [
      ch("약점을 산다 (₭15)", { money: -15, dirt: 1 }, "거간꾼이 쪽지를 건넨다. (약점 +1)", { need: { money: 15 } }),
      ch("내 소문부터 막는다 (₭10)", { money: -10, fame: 2, hostility: -5 }, "당신에 대한 헛소문이 잦아든다.", { need: { money: 10 } }),
      ch("공짜로 귀동냥만 한다", {}, "거간꾼이 코웃음을 친다. 돈 없는 손님은 반갑지 않다."),
    ], { cooldown: 2 }),
    E("a_guild", "alley", "🦉", "그림자 조합의 초대", "가면 쓴 자가 속삭인다. “도시의 진짜 주인이 되고 싶지 않나?”", [
      ch("가입한다 (₭30)", { money: -30, flag: "guild", fame: -4 }, "그림자 조합의 문양을 받았다. 다른 길이 열린다.", { need: { money: 30 } }),
      ch("거절한다", { fame: 1 }, "가면은 어둠 속으로 사라졌다."),
    ], { cond: { seasonMin: 4, notFlag: "guild" }, once: true }),
    E("a_hitman", "alley", "🗡", "청부업자", "“당신 목에 강씨 돈이 걸렸더군. 돈이면 마음을 바꾸지.”", [
      ch("자객을 돌려세운다 (₭40)", { money: -40, resolve: "assassin" }, "자객은 도윤에게 돌아갔다. 당분간은 안전하다.", { need: { money: 40 } }),
      bet("직접 매복한다", 0.5, { fx: { resolve: "assassin", fame: 5, item: "dagger" }, text: "자객을 붙잡아 거리에 세웠다. 자객의 단검을 챙겼다." }, { fx: { health: -30 }, text: "칼끝이 옆구리를 스쳤다." }),
      check("가짜 소문으로 함정을 판다", ["scheme", 13], { fx: { resolve: "assassin", rivalFame: -4 }, text: "자객이 엉뚱한 집을 덮쳤다가 붙잡혔다. 배후에 강씨가 있다는 소문이 돌았다." }, { fx: { health: -15 }, text: "함정이 어설펐다. 자객이 눈치채고 당신을 노렸다." }),
    ], { cond: { threat: "assassin" }, priority: true }),
    E("a_minseok", "alley", "👮", "경찰 보조 민석", "민석이 위조된 체포 기록을 들고 있다. “같이 파 볼 사람이 필요합니다.”", [
      bet("같이 조사한다", 0.6, { fx: { recruit: "minseok", dirt: 1 }, text: "민석이 동료가 되었다. 강씨와 경찰의 거래가 드러난다. (약점 +1)" }, { fx: { health: -10, recruit: "minseok" }, text: "골목에서 습격당했지만, 민석은 당신을 믿게 됐다." }, { bonus: [["seoyun", 0.25]] }),
      ch("관여하지 않는다", {}, "민석은 혼자 어둠 속으로 들어간다."),
    ], { cond: { notCompanion: "minseok", seasonMin: 2 }, once: true }),
    E("a_customs", "alley", "🚨", "세관 뒷문", "“단속 명단에 당신 이름이 있어. 지울 수는 있지.”", [
      ch("명단에서 지운다 (₭20)", { money: -20, resolve: "customs" }, "이름이 지워졌다.", { need: { money: 20 } }),
      ch("버텨 본다", {}, "단속은 다가오고 있다."),
    ], { cond: { threat: "customs" }, priority: true }),
    // ── 시장: 거래·사람 ──
    E("m_trade", "market", "🧵", "장사 기회", "남쪽에서 비단이 들어왔다. 값이 오를 거란 소문이다.", [
      bet("비단을 산다 (₭30)", 0.6, { fx: { money: 30 }, text: "되팔아 두 배를 남겼다!" }, { fx: { money: -30 }, text: "비단값이 폭락했다." }, { need: { money: 30 } }),
      check("시세를 읽고 산다 (₭20)", ["lore", 12], { fx: { money: 25 }, text: "장부를 꼼꼼히 보고 오를 물건만 골랐다." }, { fx: { money: -20 }, text: "시세를 잘못 읽었다." }, { need: { money: 20 } }),
      ch("좌판 일을 돕는다 (₭+8)", { money: 8 }, "소소하게 벌었다."),
    ], { repeat: true }),
    E("m_patron", "market", "💰", "상단의 후원", "큰 상단이 선거 자금을 대겠다고 한다. 물론 대가가 있다.", [
      ch("받는다 (₭+50)", { money: 50, fame: -3, flag: "patron", item: "letter" }, "돈이 들어왔다. 상단은 언젠가 청구서를 내밀 것이다."),
      ch("거절한다", { fame: 3 }, "깨끗한 이름이 조금 더 깨끗해졌다."),
    ], { cond: { titleMin: 1 }, once: true }),
    E("m_medicine", "market", "🌿", "약재 상인", "“열병 약재요. 지금 사 두면 목숨을 삽니다.”", [
      ch("약재를 비축한다 (₭25)", { money: -25, resolve: "plague", fame: 5 }, "어촌과 부두에 약재를 나눴다.", { need: { money: 25 } }),
      ch("비싸다", {}, "상인이 어깨를 으쓱한다."),
    ], { cond: { threat: "plague" }, priority: true }),
    E("m_party", "market", "🥂", "도윤의 연회", "시장 연회장에서 도윤이 손짓한다. “와서 한잔하지.”", [
      bet("간다", 0.5, { fx: { dirt: 1, fame: 3 }, text: "취한 상관 서기가 장부 얘기를 흘렸다. (약점 +1)" }, { fx: { hostility: 10 }, text: "도윤이 당신의 속셈을 눈치챘다." }, { bonus: [["seoyun", 0.25]] }),
      ch("거절한다", { hostility: 5 }, "도윤은 빈 잔을 내려놓는다."),
    ], { cond: { seasonMin: 3 }, cooldown: 5 }),
    E("m_rumor", "market", "🗞", "장터의 입", "장꾼들이 다음 선거 이야기로 떠들썩하다.", [
      ch("내 이름을 알린다 (₭10)", { money: -10, fame: 4 }, "장터에 당신 이름이 오르내린다.", { need: { money: 10 } }),
      ch("도윤의 흉을 본다", { rivalFame: -3, hostility: 8 }, "장꾼들이 도윤 이야기에 혀를 찬다."),
    ], { cooldown: 2 }),
    // ── 조합: 노동자·명성 (동장 이상) ──
    E("u_rally", "union", "📣", "조합 집회", "수백 명이 모였다. 연단이 비어 있다.", [
      bet("연설한다", 0.6, { fx: { fame: 8 }, text: "함성이 지붕을 울렸다." }, { fx: { fame: -3 }, text: "야유가 쏟아졌다." }, { bonus: [["eunho", 0.2]] }),
      ch("술을 돌린다 (₭15)", { money: -15, fame: 5 }, "잔이 돌고 노래가 터진다.", { need: { money: 15 } }),
    ], { repeat: true }),
    E("u_kang", "union", "💼", "강씨의 조합 매수", "강씨 사람이 조합 간부들에게 봉투를 돌리고 있다.", [
      ch("현장에서 맞선다", { hostility: 15, fame: 6, rivalFame: -4 }, "봉투가 바닥에 흩어졌다. 도윤은 이를 갈 것이다."),
      ch("눈감고 내 몫을 챙긴다 (₭+20)", { money: 20, fame: -4 }, "간부가 당신 주머니에도 봉투를 꽂는다."),
    ], { cooldown: 5 }),
    E("u_strike", "union", "✊", "파업이냐 협상이냐", "공장 노동자들이 임금을 올려 달라며 연장을 내려놓았다.", [
      ch("임금을 올린다 (₭20)", { money: -20, fame: 7 }, "기계가 다시 돈다. 노동자들이 당신을 믿는다.", { need: { money: 20 } }),
      ch("버틴다", { fame: -6, hostility: -5 }, "도윤이 만족스럽게 웃는다. 노동자들은 아니다."),
    ], { cond: { building: "factory" }, cooldown: 4 }),
    // ── 시청: 선거·법 ──
    E("hall_campaign", "hall", "🗳", "{office} 선거 운동", "선거가 {left}. 지금 판세는 당선 확률 {chance}%.", [
      bet("광장 연설회를 연다", 0.6, { fx: { fame: 6, rivalFame: -2 }, text: "광장이 꽉 찼다. 판세가 움직인다." }, { fx: { fame: -4 }, text: "야유 속에 연단을 내려왔다." }, { bonus: [["sora", 0.1], ["eunho", 0.1]] }),
      ch("표를 산다 (₭{bribe}, 당선 확률 +20%)", { money: "bribe", flag: "bought", hostility: 10 }, "돈이 골목마다 돌았다. 들키지만 않으면 된다.", { need: { money: "bribe" } }),
      ch("평소대로 간다", {}, "서기가 후보 명부에 이름을 적는다."),
    ], { cond: { campaign: true }, priority: true }),
    E("hall_petition", "hall", "📝", "시청 민원실", "{requirement}", [
      ch("청원서를 낸다", { fame: 2 }, "서기가 도장을 찍는다. 이름이 기록에 남았다."),
      ch("서기에게 뒷돈 (₭10)", { money: -10, fame: 4 }, "서기가 당신 서류를 맨 위에 올린다.", { need: { money: 10 } }),
    ], { repeat: true }),
    E("hall_edict", "hall", "⚖", "{office}의 칙령", "책상 위에 결재 서류가 쌓였다.", [
      ch("부두세를 올린다 (계절마다 ₭+8)", { flag: "edict_tax", fame: -4 }, "금고가 두둑해진다. 부두 사람들은 투덜댄다."),
      ch("어촌 구호 예산 (계절마다 명성 +2)", { flag: "edict_relief", money: -10 }, "어촌에 쌀 수레가 간다.", { need: { money: 10 } }),
      ch("강씨 상관 세무조사", { rivalFame: -8, hostility: 20 }, "조사관들이 강씨 상관 문을 두드린다."),
    ], { cond: { titleMin: 1 }, cooldown: 4 }),
    E("hall_scandal", "hall", "📂", "장부를 펼칠 시간", "모은 약점이 쌓였다. 강씨 상관의 밀수 장부가 완성됐다.", [
      ch("시청에서 폭로한다", { rivalFame: -20, hostility: 30, fame: 6, dirt: -3 }, "벨라르 신보 1면에 강씨 가문이 실렸다. 도윤이 무너진다."),
      ch("도윤을 협박한다 (₭+60)", { money: 60, hostility: 20, dirt: -3 }, "도윤이 이를 갈며 돈을 내놓는다."),
    ], { cond: { dirtMin: 3 }, priority: true }),
    // ── 강씨 저택: 결판 (시장 이상) ──
    E("k_visit", "manor", "🏯", "강씨 저택", "도윤이 정원에서 당신을 맞는다. “시장님이 여긴 웬일로.”", [
      ch("협상한다 (₭20)", { money: -20, hostility: -15 }, "둘 사이의 공기가 조금 풀렸다.", { need: { money: 20 } }),
      ch("도발한다", { fame: 6, hostility: 15, rivalFame: -3 }, "도윤의 얼굴이 붉어진다. 하인들이 수군댄다."),
    ], { repeat: true }),
    E("k_showdown", "manor", "⚔", "결판", "도시는 둘을 다 품을 수 없다. 오늘 끝을 낸다.", [
      bet("정면 승부", "showdown", { fx: { title: 1, ending: "ruler" }, text: "강씨 가문이 무너졌다. 벨라르는 이제 당신의 것이다." }, { fx: { health: -40, fame: -10 }, text: "도윤이 한 수 위였다. 당신은 피투성이로 쫓겨났다." }),
      ch("혼인 동맹을 맺는다", { title: 1, ending: "alliance" }, "두 가문이 하나가 되었다. 도시는 피 없이 당신 손에 들어왔다.", { need: { hostilityMax: 25 } }),
      bet("그림자 조합의 칼을 쓴다", 0.7, { fx: { title: 1, ending: "shadow" }, text: "그날 밤 강씨 저택에 불이 꺼졌다. 아무도 진실을 모른다." }, { fx: { health: -50, hostility: 30 }, text: "자객이 붙잡혔다. 도윤은 이제 당신을 죽이려 한다." }, { need: { flag: "guild" } }),
    ], { cond: { titleMin: 2, fameMin: 110 }, priority: true }),
  ];
  // ── 이어지는 이야기 (stage 조건·hook 떡밥) ──
  const C = { chain: true, priority: true };
  events.push(
    // 동생의 노름빚
    E("sib1", "home", "🎲", "동생의 그림자", "동생이 부두 노름꾼들과 어울린다. 눈 밑이 퀭하다.", [
      ch("빚을 대신 갚아 준다 (₭10)", { money: -10, stage: ["sib", "done"], virtue: 2 }, "동생이 고개를 숙인다. 다시는 안 하겠다고.", { need: { money: 10 } }),
      ch("혼쭐만 내고 둔다", { stage: ["sib", 1], hook: "노름꾼들이 동생 이름을 부르며 골목을 뒤진다…" }, "동생은 대답하지 않는다. 빚은 그대로다."),
    ], { ...C, cond: { seasonMin: 2, stage: ["sib", undefined] } }),
    E("sib2", "alley", "⛓", "끌려간 동생", "노름꾼들이 동생을 창고에 가뒀다. “₭30 가져와. 안 그러면 손가락부터다.”", [
      ch("몸값을 낸다 (₭30)", { money: -30, stage: ["sib", "done"], virtue: 1 }, "동생이 비틀거리며 나온다. 당신 품에 안겨 운다.", { need: { money: 30 } }),
      bet("창고로 쳐들어간다", 0.5, { fx: { fame: 6, stage: ["sib", "done"], virtue: 3 }, text: "문을 박차고 동생을 데려왔다. 골목이 당신 이름을 기억한다." }, { fx: { health: -25, stage: ["sib", 2], hook: "동생은 아직 창고에 있다. 다음엔 몸값이 오를 것이다…" }, text: "몰매를 맞고 쫓겨났다." }, { bonus: [["eunho", 0.2], ["minseok", 0.2]] }),
      ch("버린다", { stage: ["sib", "lost"], loseSibling: true, virtue: -6 }, "당신은 등을 돌렸다. 그날 밤 이후 동생을 본 사람은 없다."),
    ], { ...C, cond: { stage: ["sib", 1], wait: 1 } }),
    E("sib3", "alley", "⛓", "마지막 기회", "“이번엔 ₭45다. 내일이면 동생은 강에 떠오를 거야.”", [
      ch("몸값을 낸다 (₭45)", { money: -45, stage: ["sib", "done"] }, "동생을 되찾았다. 비싼 교훈이었다.", { need: { money: 45 } }),
      ch("버린다", { stage: ["sib", "lost"], loseSibling: true, virtue: -6 }, "강물은 아무 말도 하지 않았다."),
    ], { ...C, cond: { stage: ["sib", 2], wait: 1 } }),
    // 소라와의 인연 (장마 때 약속 판가름 → stage sora = kept/broken)
    E("sora_kept", "fishing", "💌", "젖지 않은 문턱", "소라가 제방 위에서 기다린다. “약속을 지켰네요. 이제 내가 뭘 해 줄 수 있죠?”", [
      ch("혼인을 청한다", { marry: "소라", leave: "sora", fame: 8, stage: ["sora", "wed"], virtue: 2 }, "어촌 전체가 혼례에 몰려왔다. 소라는 이제 가족이다.", { need: { notFlag: "married" } }),
      ch("어촌의 표를 부탁한다", { fame: 10, stage: ["sora", "ally"] }, "소라가 어촌 집집마다 당신 이름을 말하고 다닌다."),
    ], { ...C, cond: { stage: ["sora", "kept"], companion: "sora" } }),
    E("sora_broken", "fishing", "💔", "잠긴 문턱", "소라가 젖은 이불을 말리며 돌아보지도 않는다. “약속했잖아요.”", [
      ch("무릎 꿇고 복구비를 낸다 (₭30)", { money: -30, loyalty: ["sora", 4], fame: 4, stage: ["sora", "forgiven"], virtue: 2 }, "소라가 한참 만에 손을 내민다.", { need: { money: 30 } }),
      ch("어쩔 수 없었다", { leave: "sora", rivalFame: 6, stage: ["sora", "gone"], virtue: -2 }, "그날 밤 소라는 도윤의 집 문을 두드렸다."),
    ], { ...C, cond: { stage: ["sora", "broken"], companion: "sora" } }),
    // 밀수 장부
    E("led1", "alley", "🧔", "겁에 질린 선원", "“강씨 상관 밀수 장부를 내가 직접 썼소. 지켜 주면 다 말하겠소.”", [
      ch("숨겨 준다 (₭15)", { money: -15, stage: ["led", 1], hook: "도윤이 사라진 선원을 찾고 있다는 소문이다…", virtue: 1 }, "선원을 하숙집 다락에 숨겼다.", { need: { money: 15 } }),
      ch("돌려보낸다", { stage: ["led", "no"] }, "선원은 어둠 속으로 사라졌다. 다음 날 강에서 신발 한 짝이 떠올랐다."),
    ], { ...C, cond: { dirtMin: 1, stage: ["led", undefined], seasonMin: 3 } }),
    E("led2", "home", "🔥", "다락의 손님", "강씨 패거리가 하숙집 골목에 나타났다. 선원이 떨고 있다.", [
      bet("밤에 몰래 빼돌린다", 0.6, { fx: { dirt: 2, stage: ["led", "done"], item: "ledger" }, text: "선원은 무사히 배에 올랐고, 장부 사본이 당신 손에 남았다. (약점 +2)" }, { fx: { health: -20, stage: ["led", "lost"], hostility: 10 }, text: "들켰다. 선원은 끌려갔고 당신은 칼에 베였다." }, { bonus: [["minseok", 0.3]] }),
      ch("선원을 넘기고 돈을 받는다 (₭+40)", { money: 40, stage: ["led", "sold"], virtue: -6, hostility: -15 }, "도윤이 웃으며 돈을 건넨다. 선원의 비명은 듣지 않았다."),
    ], { ...C, cond: { stage: ["led", 1], wait: 1 } }),
    // 도윤의 아들
    E("son1", "market", "🧒", "도윤의 아들", "도윤의 아들 강무열이 당신 동생과 장터에서 웃고 떠든다.", [
      ch("어울리게 둔다", { stage: ["son", "friend"], hook: "강무열이 하숙집에 자주 드나든다…" }, "두 아이가 연을 날린다. 언젠가 쓸모가 있을지도."),
      ch("떼어 놓는다", { stage: ["son", "enemy"], hostility: 5 }, "강무열이 당신을 노려본다. 그 눈빛을 잊지 못할 것이다."),
    ], { ...C, cond: { seasonMin: 5, stage: ["son", undefined] } }),
    E("son_friend", "home", "🤫", "강무열의 귀띔", "강무열이 밤늦게 찾아왔다. “아버지가 하는 일… 이건 아니에요.”", [
      ch("비밀을 듣는다", { dirt: 2, stage: ["son", "ally"] }, "강씨 상관의 장부 위치를 알게 됐다. (약점 +2)"),
      ch("돌려보낸다", { stage: ["son", "kind"], virtue: 2 }, "아이를 아버지와 싸우게 하고 싶지 않았다."),
    ], { ...C, cond: { stage: ["son", "friend"], wait: 4, titleMin: 1 } }),
    E("son_enemy", "alley", "🗡", "강무열의 칼", "다 자란 강무열이 골목을 막아선다. “그때 기억하지?”", [
      bet("맞붙는다", 0.5, { fx: { fame: 8, rivalFame: -5, stage: ["son", "beaten"] }, text: "칼을 쳐냈다. 강무열은 피를 흘리며 물러났다." }, { fx: { health: -30, stage: ["son", "beaten"] }, text: "옆구리를 찔렸다." }, { bonus: [["eunho", 0.15], ["minseok", 0.15]] }),
      ch("사과한다", { fame: -3, hostility: -15, stage: ["son", "peace"], virtue: 2 }, "강무열이 칼을 거둔다. 오래된 원한이 조금 풀렸다."),
    ], { ...C, cond: { stage: ["son", "enemy"], wait: 4, titleMin: 1 } }),
    // ── 동료의 부탁 (들어주면 충성 +, 거절하면 충성 −) ──
    E("q_eunho", "union", "🩹", "은호의 부탁", "“조합 동료가 기계에 손을 잃었어. 치료비 좀…”", [
      ch("치료비를 댄다 (₭15)", { money: -15, loyalty: ["eunho", 3], fame: 2, virtue: 2 }, "은호가 당신 손을 꽉 잡는다.", { need: { money: 15 } }),
      ch("지금은 여유가 없다", { loyalty: ["eunho", -4] }, "은호의 눈빛이 식는다."),
    ], { cond: { companion: "eunho", seasonMin: 4 }, once: true, priority: true, q: true }),
    E("q_eunho_dock", "dock", "🩹", "은호의 부탁", "“조합 동료가 크게 다쳤어. 치료비 좀…”", [
      ch("치료비를 댄다 (₭15)", { money: -15, loyalty: ["eunho", 3], fame: 2, virtue: 2 }, "은호가 당신 손을 꽉 잡는다.", { need: { money: 15 } }),
      ch("지금은 여유가 없다", { loyalty: ["eunho", -4] }, "은호의 눈빛이 식는다."),
    ], { cond: { companion: "eunho", seasonMin: 4, titleMax: 0 }, once: true, priority: true, q: true }),
    E("q_yun", "fishing", "🔧", "윤의 부탁", "“수문공 동료들이 석 달째 품삯을 못 받았어.”", [
      ch("대신 준다 (₭10)", { money: -10, loyalty: ["yun", 3], virtue: 1 }, "윤이 말없이 고개를 끄덕인다.", { need: { money: 10 } }),
      ch("시청에 따져 보라고 한다", { loyalty: ["yun", -3] }, "윤이 혀를 찬다."),
    ], { cond: { companion: "yun", seasonMin: 3 }, once: true, priority: true, q: true }),
    E("q_minseok", "hall", "🚔", "민석의 부탁", "“부패 경관을 고발하려 합니다. 증인이 되어 주십시오.”", [
      bet("함께 고발한다", 0.6, { fx: { loyalty: ["minseok", 3], fame: 6, virtue: 3 }, text: "경관이 파면됐다. 민석이 처음으로 웃는다." }, { fx: { loyalty: ["minseok", 1], hostility: 10 }, text: "고발은 묻혔다. 그래도 민석은 당신이 곁에 있었던 걸 안다." }),
      ch("엮이기 싫다", { loyalty: ["minseok", -4] }, "민석이 말없이 돌아선다."),
    ], { cond: { companion: "minseok", seasonMin: 4 }, once: true, priority: true, q: true }),
    E("q_seoyun", "market", "📚", "서윤의 부탁", "“기록보관소 원본이 불태워질 거예요. 옮길 돈이 필요해요.”", [
      ch("옮겨 준다 (₭12)", { money: -12, loyalty: ["seoyun", 3], dirt: 1, virtue: 1, item: "map" }, "원본 속에서 강씨 가문의 오래된 땅 문서와 옛 지도가 나왔다. (약점 +1)", { need: { money: 12 } }),
      ch("그냥 둔다", { loyalty: ["seoyun", -4] }, "그날 밤 기록보관소에서 연기가 올랐다."),
    ], { cond: { companion: "seoyun", seasonMin: 4 }, once: true, priority: true, q: true }),
    // ── 이번 계절 한정 기회 (opp) ──
    E("o_ship", "dock", "🚢", "오늘 밤만 정박하는 밀수선", "선장이 손짓한다. “한 번만 실어 나르면 크게 쳐 주지.”", [
      bet("싣는다", 0.55, { fx: { money: 45, virtue: -2 }, text: "새벽까지 상자를 날랐다. 주머니가 터질 것 같다." }, { fx: { money: 10, threat: { id: "customs", left: 2 }, virtue: -2 }, text: "세관 배가 나타났다. 일부만 챙겨 도망쳤다." }),
      ch("신고한다", { fame: 4, hostility: 5, virtue: 2 }, "세관이 밀수선을 덮쳤다. 선주가 강씨 쪽 사람이었다."),
    ], { opp: true }),
    E("o_auction", "market", "🏚", "몰락 귀족의 경매", "옛 귀족 저택의 가보가 경매에 나왔다. 사람들 눈이 쏠린다.", [
      ch("낙찰받아 기증한다 (₭35)", { money: -35, fame: 12, virtue: 2 }, "가보를 어촌 학교에 내놨다. 신문에 이름이 실렸다.", { need: { money: 35 } }),
      ch("구경만 한다", {}, "도윤이 비싼 값에 가져갔다."),
    ], { opp: true }),
    E("o_feast", "fishing", "🎏", "오늘 하루 풍어제", "배가 만선으로 들어왔다. 어촌이 잔치 분위기다.", [
      ch("술과 고기를 낸다 (₭12)", { money: -12, fame: 8, virtue: 1 }, "노래가 밤새 이어졌다.", { need: { money: 12 } }),
      bet("노래 자랑에 나선다", 0.5, { fx: { fame: 6, item: "charm" }, text: "어촌 사람들이 배꼽을 잡았다. 할머니가 행운의 부적을 쥐여 줬다." }, { fx: { fame: 1 }, text: "음이 다 틀렸다. 그래도 사람들은 웃었다." }, { bonus: [["sora", 0.25]] }),
    ], { opp: true }),
    E("o_papers", "alley", "📄", "도윤 부하의 노름빚 문서", "도박장 주인이 문서를 흔든다. “강씨 집사 빚이야. 사겠나?”", [
      ch("산다 (₭20)", { money: -20, dirt: 2 }, "강씨 집사의 약점을 쥐었다. (약점 +2)", { need: { money: 20 } }),
      ch("관심 없다", {}, "문서는 다른 손으로 넘어갔다."),
    ], { opp: true }),
    E("o_clerk", "hall", "🖋", "명부 담당 서기", "선거 명부를 맡은 서기가 은근히 웃는다. “이번만 특별히…”", [
      ch("매수한다 (₭25 · 다음 선거 +20%)", { money: -25, flag: "bought", virtue: -3 }, "서기가 명부를 슬쩍 고쳐 주기로 했다.", { need: { money: 25 } }),
      ch("고발한다", { fame: 5, hostility: 5, virtue: 2 }, "서기가 끌려갔다. 시청 사람들이 당신을 다시 본다."),
    ], { opp: true }),
    E("o_doctor", "home", "🩺", "떠돌이 의원", "이름난 떠돌이 의원이 오늘만 머문다.", [
      ch("진찰받는다 (₭10)", { money: -10, health: 35 }, "몸이 새로 태어난 것 같다.", { need: { money: 10 } }),
      ch("가족에게 양보한다", { health: 10, virtue: 1 }, "동생이 기침을 멈췄다. 당신도 조금 쉬었다."),
    ], { opp: true }),
    E("o_partner", "market", "🤝", "남쪽 상단의 동업 제안", "남쪽 상단이 이 항구의 동업자를 찾는다. 오늘 결정해야 한다.", [
      ch("투자한다 (₭30 · 계절마다 ₭+6)", { money: -30, flag: "partner" }, "동업 계약서에 도장을 찍었다.", { need: { money: 30 } }),
      ch("거절한다", {}, "상단은 도윤과 손을 잡았다."),
    ], { opp: true, cond: { notFlag: "partner" } }),
    E("o_strike", "union", "✊", "오늘 파업 결의", "조합원 수백 명이 모였다. 누가 이끌지 정해지지 않았다.", [
      bet("앞장선다", 0.55, { fx: { fame: 12, hostility: 10, virtue: 2 }, text: "파업이 이겼다. 노동자들이 당신 이름을 연호한다." }, { fx: { fame: -4, health: -10 }, text: "경찰이 들이닥쳤다. 곤봉에 맞았다." }, { bonus: [["eunho", 0.2]] }),
      ch("뒤에서 지켜본다", {}, "파업은 흐지부지 끝났다."),
    ], { opp: true }),
  );
  // 존경(+)·공포(−): 고른 선택지에 따라 가문의 색이 정해진다. "사건id:선택번호" → 값
  const virtueTags = {
    "f_help:0": 2, "f_help:1": 3, "f_sora:0": 2, "f_fever:0": 4, "f_fever:1": -2, "d_fight:0": 1,
    "d_smuggle:0": -3, "d_contract:0": -2, "d_eunho:0": 2, "d_eunho:1": 2, "a_gamble:0": -1, "a_guild:0": -5,
    "a_hitman:0": -2, "m_patron:0": -2, "m_rumor:1": -2, "u_kang:0": 2, "u_kang:1": -3, "u_strike:0": 3, "u_strike:1": -3,
    "hall_campaign:1": -4, "hall_petition:1": -1, "hall_edict:0": -3, "hall_edict:1": 3, "hall_edict:2": -1,
    "hall_scandal:0": 1, "hall_scandal:1": -5, "k_showdown:2": -8, "k_visit:1": -1,
  };
  // 도윤과 맞대결: 도윤이 노리는 장소에 가면 평소 사건 대신 뜬다.
  function duel(move, bribe) {
    return {
      id: "duel:" + move.id, loc: move.loc, icon: "⚔", duel: true,
      title: "도윤의 사람들과 맞대결",
      text: `강씨 패거리가 ${move.aim} 한다. 지금 막지 않으면: {fail}`,
      choices: [
        check("주먹으로 맞선다", ["force", "duel"], { fx: { block: true, fame: 5, rivalFame: -3, virtue: 2 }, text: "패거리가 꽁무니를 뺐다. 구경꾼들이 환호한다." }, { fx: { duelLoss: true, fame: -2 }, text: "밀렸다. 도윤의 계획은 그대로 진행됐고, 망신까지 당했다." }),
        check("말로 구슬린다", ["talk", "duel"], { fx: { block: true, fame: 3, virtue: 1 }, text: "패거리 우두머리가 머리를 긁적이며 돌아갔다." }, { fx: { duelLoss: true }, text: "비웃음만 샀다. 도윤의 계획이 그대로 진행됐다." }),
        ch(`돈으로 무마한다 (₭${bribe})`, { money: -bribe, block: true }, "패거리 우두머리가 돈을 세고는 물러갔다.", { need: { money: bribe } }),
        ch("약점으로 역공한다 (약점 1개)", { dirt: -1, block: true, rivalFame: -6, virtue: -3 }, "도윤 측의 비밀을 들먹이자 패거리가 얼어붙었다.", { need: { dirt: 1 } }),
      ],
    };
  }
  // ── TRPG ──
  const stats = {
    talk: { name: "말솜씨", icon: "🗣" },
    force: { name: "완력", icon: "💪" },
    scheme: { name: "계략", icon: "🦊" },
    lore: { name: "학식", icon: "📚" },
  };
  const items = {
    dagger: { name: "자객의 단검", icon: "🗡", stat: "force", bonus: 2 },
    letter: { name: "상단 추천장", icon: "✉", stat: "talk", bonus: 2 },
    ledger: { name: "밀수 장부 사본", icon: "📒", stat: "scheme", bonus: 2 },
    map: { name: "옛 지도", icon: "🗺", stat: "lore", bonus: 2 },
    charm: { name: "행운의 부적", icon: "🧿", fate: 1 },
  };
  // 능력치가 오를 때마다(2번에 1번) 셋 중 하나를 고른다
  const perks = {
    negotiator: { name: "협상가", icon: "🤝", desc: "돈으로 무마·표 매수 비용이 절반" },
    brawler: { name: "싸움꾼", icon: "🥊", desc: "완력 +1 · 완력 판정에서 대실패 없음", stat: ["force", 1] },
    schemer: { name: "책사", icon: "🦊", desc: "계략 +1 · 약점 역공 때 도윤 명성 −4 더", stat: ["scheme", 1] },
    scholar: { name: "학자", icon: "📚", desc: "학식 판정 +2" },
    orator: { name: "웅변가", icon: "📣", desc: "선거 당선 확률 +10%" },
    ironside: { name: "강골", icon: "🛡", desc: "건강 피해 30% 감소" },
    trader: { name: "장사꾼", icon: "💰", desc: "계절마다 ₭+5" },
    lucky: { name: "행운아", icon: "🍀", desc: "운명 +1 · 운명 최대치 +1" },
  };
  // 예전 확률 선택지가 어떤 능력치 판정인지 (사건id:선택번호)
  const checkStat = {
    "d_work:1": "force", "d_fight:0": "force", "d_eunho:0": "talk", "h_fever:1": "force", "f_festival:1": "talk",
    "a_gamble:0": "scheme", "a_hitman:1": "force", "a_minseok:0": "scheme", "m_trade:0": "lore", "m_party:0": "talk",
    "u_rally:0": "talk", "hall_campaign:0": "talk", "k_showdown:0": "talk", "k_showdown:2": "scheme",
    "sib2:1": "force", "led2:0": "scheme", "son_enemy:0": "force", "q_minseok:0": "lore", "o_ship:0": "scheme",
    "o_feast:1": "talk", "o_strike:0": "talk",
  };
  // 계절 신문 머리기사(분위기용)
  const headlines = [
    "부두 물동량 사상 최대, 일손 모자라",
    "강씨 상관, 새 배 두 척 진수",
    "어촌 아이들, 학교 대신 그물 손질",
    "시청 서기 \"선거 명부 정비 중\"",
    "남쪽 비단값 요동, 장꾼들 술렁",
    "뒷골목 도박장 단속 소문",
    "조합 \"임금 체불 더는 못 참아\"",
    "장마철 앞두고 수문 점검 요구",
  ];
  const endings = {
    ruler: { title: "벨라르의 주인", icon: "👑", text: "이름 없던 가문이 도시를 손에 넣었다. 다음 세대는 이웃 도시를 바라본다.", win: true },
    alliance: { title: "두 가문의 도시", icon: "💍", text: "칼 대신 혼인으로. 피 한 방울 없이 도시가 당신 가문의 것이 되었다.", win: true },
    shadow: { title: "그림자 군주", icon: "🦉", text: "공식 기록에는 사고였다. 도시는 보이지 않는 손이 움직인다.", win: true },
    extinct: { title: "가문 단절", icon: "🕯", text: "대를 이을 사람이 없었다. 이름은 다시 지워졌다.", win: false },
    time: { title: "평범한 이름", icon: "📖", text: "8년이 흘렀다. 도시를 쥐지는 못했지만, 가문의 이름은 남았다.", win: false },
  };
  const api = { titles, locations, companions, buildings, LOTS, threats, origins, events, headlines, endings, rivalMoves, elections, virtueTags, duel, stats, items, perks, checkStat };
  if (typeof module !== "undefined") module.exports = api;
  root.ProtoData = api;
})(globalThis);
