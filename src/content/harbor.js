"use strict";
// 첫 장 "동장 선거" 콘텐츠. 효과 키: money, votes{harbor,fishing,hill}, plan, prepared, progress,
// contract, promise, witness, dirt, secret, relation, platform, training, memory.
(function (root) {
  const places = [
    { id: "dock", name: "부두", icon: "⚓", x: 24, y: 77, slots: 2, skill: "nerve",
      action: "하역 일을 한다", hint: "돈 ₭18 (계약 뒤 ₭13)", tag: "₭", risk: "보통", kind: "work" },
    { id: "gate", name: "수문·제방", icon: "≈", x: 73, y: 70, slots: 2, skill: "manage",
      action: "물길을 살피고 공사한다", hint: "장마 대비 + · 착공 뒤 제방 공정 +", tag: "대비", risk: "낮음", kind: "prepare" },
    { id: "square", name: "어촌 공터", icon: "♧", x: 81, y: 38, slots: 2, skill: "talk",
      action: "어촌 모임을 연다", hint: "어촌 표 +4 · ₭3", tag: "어촌표", risk: "낮음", kind: "organize" },
    { id: "company", name: "강씨 상관", icon: "◈", x: 26, y: 28, slots: 1, skill: "manage",
      action: "강씨 상단 일을 맡는다", hint: "돈 ₭24 · 항구 표 −2 (강씨 일꾼으로 보임)", tag: "₭₭", risk: "높음", kind: "trade" },
    { id: "tavern", name: "등불 주점", icon: "♨", x: 48, y: 49, slots: 1, skill: "scheme",
      action: "소문과 약점을 캔다", hint: "도윤의 약점 단서 + · 언덕 표 +1", tag: "약점", risk: "보통", kind: "spy" },
    { id: "union", name: "조합 사무소", icon: "⚒", x: 48, y: 18, slots: 2, skill: "talk",
      action: "조합원들을 설득한다", hint: "항구 표 +4", tag: "항구표", risk: "보통", kind: "union" },
    { id: "home", name: "하숙집", icon: "⌂", x: 13, y: 51, slots: 3, skill: "manage",
      action: "집안을 돌본다", hint: "돈 ₭7", tag: "₭", risk: "없음", kind: "home" },
  ];
  const people = [
    { id: "yun", name: "윤", role: "수문공", trait: "의리", line: "물은 낮은 데로 간다. 사람도 좀 살펴." },
    { id: "sora", name: "소라", role: "어촌 대표", trait: "정직", line: "어촌까지 이어 주는 거죠?" },
    { id: "minseok", name: "민석", role: "경찰 보조", trait: "정직", line: "증인이 없는 계약은 믿지 않습니다." },
    { id: "jian", name: "지안", role: "선거 관리 서기", trait: "학구", line: "이름을 남기세요. 책임도 함께요." },
    { id: "eunho", name: "은호", role: "공장 노동자", trait: "야심", line: "우리 손이 멈추면 부두도 멈춰." },
    { id: "seoyun", name: "서윤", role: "기록관 서기", trait: "학구", line: "지워진 이름부터 다시 적겠어요." },
    { id: "doyun", name: "도윤", role: "강씨 가문 · 선주", trait: "교활", line: "돈에는 늘 주인이 있지." },
  ];
  // 성향: 장소 판정 보너스 등. 매 판 가족에게 무작위로 붙는다.
  const traits = {
    의리: { place: "gate", bonus: 2, text: "수문·제방에서 +2" },
    야심: { place: "union", bonus: 2, text: "조합 사무소에서 +2" },
    정직: { place: "square", bonus: 2, text: "어촌 공터에서 +2" },
    교활: { place: "tavern", bonus: 3, text: "등불 주점에서 +3" },
    억척: { place: "dock", bonus: 2, text: "부두에서 +2" },
    학구: { build: 1, text: "제방 공정 +1" },
    겁쟁이: { contest: -3, text: "강씨와 맞붙으면 −3" },
    방탕: { home: -4, tavern: 2, text: "집안 수입 −4 · 주점 +2" },
  };
  const familyNames = ["하린", "여울", "서진", "도현", "민재", "가람", "지우", "태오", "다온", "소율", "한결", "유나", "준서", "보람", "새봄", "이든"];
  const familyTemplates = [
    [{ role: "형제", age: [21, 27] }, { role: "동생", age: [16, 19] }],
    [{ role: "배우자", age: [22, 28] }, { role: "동생", age: [16, 19] }],
    [{ role: "배우자", age: [22, 28] }, { role: "사촌", age: [18, 24] }],
    [{ role: "누이", age: [24, 30] }, { role: "조카", age: [16, 18] }],
    [{ role: "어머니", age: [46, 54] }, { role: "동생", age: [17, 20] }],
  ];
  const rivalNames = ["강해진", "강수연", "강무열", "강보라", "강치훈", "강윤서"];
  // 라이벌 성격: 노리는 장소와, 그 장소를 차지했을 때 하는 일.
  const rivalTypes = {
    briber: {
      name: "뇌물형", desc: "돈으로 조합 간부와 언덕 유지들을 산다. 조합 사무소와 주점을 지켜라.",
      targets: ["union", "union", "company", "tavern", "dock"],
      lateTargets: ["union", "tavern", "union", "square", "company"],
      effects: {
        union: { votes: { harbor: -4 }, text: "조합 간부에게 봉투를 건넸다", cause: "조합 매수" },
        tavern: { votes: { hill: -2 }, text: "언덕 유지들에게 술을 샀다", cause: "유지 매수" },
        square: { votes: { fishing: -2 }, text: "어촌에 쌀을 돌렸다", cause: "쌀 돌리기" },
      },
    },
    thug: {
      name: "완력형", desc: "일꾼을 풀어 공사장과 모임을 망가뜨린다. 수문과 공터를 비워 두지 마라.",
      targets: ["gate", "gate", "square", "dock", "company"],
      lateTargets: ["square", "union", "dock", "square", "company"],
      effects: {
        gate: { sabotage: true, text: "밤중에 공사장을 망가뜨렸다", cause: "공사 방해" },
        square: { votes: { fishing: -2 }, text: "어촌 모임에 패거리를 보냈다", cause: "모임 방해" },
        union: { votes: { harbor: -2 }, text: "조합원들을 협박했다", cause: "조합 협박" },
      },
    },
    popular: {
      name: "인기형", desc: "잔치와 연설로 표를 모은다. 어촌 공터와 조합에서 맞불을 놓아라.",
      targets: ["square", "union", "square", "dock", "company"],
      lateTargets: ["square", "union", "union", "square", "tavern"],
      effects: {
        square: { votes: { fishing: -4 }, text: "어촌 잔치를 열었다", cause: "어촌 잔치" },
        union: { votes: { harbor: -2 }, text: "조합원 앞에서 연설했다", cause: "조합 연설" },
        tavern: { votes: { hill: -2 }, text: "언덕에서 후원회를 열었다", cause: "후원회" },
      },
    },
  };
  // 장마 외에 매 판 하나 뽑히는 위기. due 계절에 place에 사람을 두고 지켜내면 성공.
  const crises = {
    strike: {
      name: "부두 파업 조짐", place: "union", dues: [2, 3, 6],
      detail: "그 계절 조합 사무소에 사람을 두고 지켜내면 파업을 중재해 항구 표 +6, 비우면 −5.",
      win: "당신 가문이 파업을 중재했다", lose: "파업으로 부두가 멈췄고 사람들은 당신을 찾지 못했다",
      winVotes: { harbor: 6 }, loseVotes: { harbor: -5 },
    },
    fever: {
      name: "어촌 열병", place: "square", dues: [2, 3, 6, 7],
      detail: "그 계절 어촌 공터에 사람을 두면 환자를 돌봐 어촌 표 +6, 비우면 −6.",
      win: "당신 가문이 열병 환자를 돌봤다", lose: "어촌이 열병에 시달리는 동안 아무도 오지 않았다",
      winVotes: { fishing: 6 }, loseVotes: { fishing: -6 },
    },
    fire: {
      name: "창고 화재 위험", place: "dock", dues: [1, 2, 3, 6],
      detail: "그 계절 부두에 사람을 두면 불길을 잡아 항구 표 +4, 비우면 항구 표 −4에 ₭10 손해.",
      win: "당신 가문이 창고 불을 껐다", lose: "부두 창고가 불탔다",
      winVotes: { harbor: 4 }, loseVotes: { harbor: -4 }, failMoney: 10,
    },
    smear: {
      name: "흑색선전", place: "tavern", dues: [3, 6, 7],
      detail: "그 계절 등불 주점에 사람을 두면 헛소문을 잡아 언덕 표 +5, 비우면 −6.",
      win: "당신 가문이 헛소문의 출처를 밝혔다", lose: "당신 가문에 대한 헛소문이 언덕을 돌았다",
      winVotes: { hill: 5 }, loseVotes: { hill: -6 },
    },
  };
  const choice = (id, label, effects, reply, requires = {}) => ({ id, label, effects, reply, requires });
  const event = (id, kind, title, who, text, choices, requires = {}, scene = "hearing") => ({
    id, kind, title, who, lines: [text], choices, requires, scene, cooldown: 99,
  });
  const events = [
    event("plan", "major", "비가 오기 전, 다섯 계절", "yun",
      "항구만 막을까, 어촌까지 이을까. 어느 쪽이든 돈이 들어. 선거 자금과 같은 주머니야.",
      [
        choice("long", "어촌까지 잇는 제방 (자재비 ₭60)", { plan: "long" }, "소라가 젖은 지도 위에 자기 집을 짚는다. 돈을 모아야 착공할 수 있다."),
        choice("short", "항구만 지키는 짧은 제방 (자재비 ₭24)", { plan: "short" }, "윤이 항구 쪽에 말뚝을 박는다. 어촌은 제방 밖이다."),
        choice("none", "공사 대신 구호와 피난만 준비", { plan: "none", money: 8 }, "소라는 말없이 빈 창고 열쇠를 내려놓는다."),
      ], { turn: 0 }, "storm-partial"),
    event("offer", "major", "부두의 값은 스무 해", "doyun",
      "공사비는 내가 대지. 대신 부두 사용권은 20년간 내 것이야.",
      [
        choice("accept", "돈을 받고 부두 사용권을 넘긴다", { money: 60, contract: true, votes: { harbor: -6 }, relation: ["doyun", 20] },
          "도윤이 계약서를 접는다. 부두 노동자들은 당신을 다르게 본다."),
        choice("refuse", "주민들과 힘을 모으겠다", { votes: { fishing: 3, harbor: 2 } }, "소라가 모금함을 가져온다. 돈은 직접 모아야 한다."),
        choice("blackmail", "밀수 장부를 들이밀어 공사비를 받는다",
          { money: 60, relation: ["doyun", -35], votes: { hill: -2 }, memory: "강씨 가문을 밀수 장부로 협박했다" },
          "도윤은 웃음을 거둔다. 이 빚을 잊지 않겠다는 얼굴이다.", { secret: true }),
      ], { turnMin: 1, turnMax: 3, building: true }, "storm-partial"),
    event("promise", "major", "문턱까지 지켜 줄 건가요", "sora",
      "제방 밖에도 사람이 살아요. 우리 이름으로 약속해 줘요.",
      [
        choice("pledge", "어촌 보호를 약속한다", { promise: true, votes: { fishing: 4 } }, "소라가 주민들 앞에서 당신의 이름을 말한다. 장마 때 판가름 난다."),
        choice("honest", "끝내지 못할 수도 있다고 말한다", { votes: { hill: 2 } }, "소라는 고개를 끄덕인다. 확답 대신 준비를 지켜보겠다고 한다."),
        choice("aid", "구호비를 먼저 맡긴다", { money: -8, votes: { fishing: 5 }, prepared: 0.08 }, "소라가 담요와 배를 구한다.", { money: 8 }),
      ], { turn: 1 }, "storm-safe"),
    event("witness", "major", "계약서의 세 번째 이름", "minseok",
      "사본을 공개하면 선주도 당신도 말을 바꾸기 어렵습니다.",
      [
        choice("publish", "계약을 공개하고 증인을 세운다", { witness: true, votes: { hill: 5, harbor: 1 }, relation: ["doyun", -8] }, "민석과 지안이 계약서에 이름을 남긴다."),
        choice("private", "계약을 비공개로 둔다", { money: 6, relation: ["doyun", 8] }, "도윤이 사례를 건넨다. 주민들은 조항을 모른다."),
        choice("copy", "서윤에게 사본만 맡긴다", { votes: { hill: 2 }, dirt: 1 }, "서윤은 서랍을 잠근다. 언젠가 쓸모가 있을 것이다."),
      ], { turnMin: 2, turnMax: 4, contract: true }),
    event("labor", "major", "같은 비를 맞는 손", "eunho",
      "공사에 손을 보탤게. 대신 체불 임금 문제에도 나서 줘.",
      [
        choice("join", "노동자 청원에 서명한다", { progress: 1, votes: { harbor: 4 }, relation: ["doyun", -8] }, "은호와 동료들이 제방 공사장에 모인다."),
        choice("pay", "품삯을 직접 지급한다", { money: -12, progress: 2 }, "은호가 작업 순서를 다시 짠다.", { money: 12 }),
        choice("refuse", "이번에는 공사에 집중하겠다", { votes: { harbor: -3 } }, "은호는 공장으로 돌아간다. 동료들은 오지 않았다."),
      ], { turn: 3, building: true }, "opening-factory"),
    event("warning", "major", "수문의 금이 벌어진다", "yun",
      "여름비가 생각보다 세다. 지금 손보면 아직 버틸 수 있어.",
      [
        choice("repair", "비상 자재를 구한다", { money: -10, prepared: 0.2, progress: 1 }, "윤이 밤새 새 판자를 덧댄다.", { money: 10 }),
        choice("evacuate", "피난선을 준비한다", { prepared: 0.12, votes: { fishing: 2 } }, "소라가 노인과 아이들의 자리를 마련한다."),
        choice("wait", "현재 준비를 믿는다", { money: 4 }, "윤은 수문 곁에 남는다. 다음 계절이면 비가 온다."),
      ], { turn: 4 }, "storm-partial"),
    event("relief", "major", "물이 남긴 자리", "sora",
      "떠난 집의 이름을 적고 있어요. 남은 사람은 어떻게 살죠?",
      [
        choice("aid", "가문 돈으로 복구를 돕는다", { money: -12, votes: { fishing: 7 } }, "소라와 주민들이 빈집의 문을 다시 단다.", { money: 12 }),
        choice("record", "피해 증언을 모아 공개한다", { witness: true, votes: { hill: 3, fishing: 2 } }, "민석이 주민의 말을 한 줄씩 남긴다."),
        choice("work", "복구 하역을 맡아 돈을 번다", { money: 14, votes: { fishing: -3 } }, "도윤은 품삯을 지불한다. 주민들은 당신을 바라본다."),
      ], { turn: 6, flooded: true }, "storm-flood"),
    event("thanks", "major", "아이들이 돌아온 길", "sora",
      "제방 위로 아이들이 학교에 가요. 이 길에 이름을 붙이자고 해요.",
      [
        choice("family", "가문의 이름을 남긴다", { votes: { hill: 4 }, relation: ["doyun", -6] }, "돌 위에 당신 가문의 이름을 새긴다."),
        choice("people", "주민 모두의 제방이라 부른다", { votes: { fishing: 5, harbor: 2 } }, "소라가 모금에 참여한 이름들을 차례로 읽는다."),
        choice("yun", "윤의 공을 기린다", { votes: { harbor: 2, hill: 1 } }, "윤이 모자를 벗는다. 수문공들이 당신 이름을 입에 올린다."),
      ], { turn: 6, safe: true }, "storm-safe"),
    event("expose", "major", "장부를 펼칠 시간", "seoyun",
      "강씨 상관의 밀수 장부예요. 지금 터뜨리면 선거판이 뒤집힐 거예요. 아니면… 값으로 받을 수도 있고요.",
      [
        choice("expose", "신문에 폭로한다", { votes: { harbor: 4, fishing: 4, hill: 7 }, relation: ["doyun", -40], memory: "밀수 장부를 신문에 폭로했다" },
          "벨라르 신보 1면에 강씨 상관의 이름이 실린다. 도윤의 얼굴이 굳는다."),
        choice("fund", "입을 다무는 대가로 선거 자금을 받는다", { money: 30, relation: ["doyun", -25], memory: "밀수 장부로 돈을 뜯었다" },
          "도윤이 돈주머니를 던진다. 장부는 다시 당신 서랍으로 들어간다."),
        choice("bury", "묻어 두고 깨끗하게 싸운다", { votes: { hill: 1 }, relation: ["doyun", 10] }, "서윤은 장부를 태운다. 도윤은 아무것도 모른 채 웃는다."),
      ], { turnMin: 5, turnMax: 7, secret: true }, "hearing"),
    event("rally", "major", "선거 자금을 어디에", "eunho",
      "선거가 두 계절 남았어. 돈을 풀 데가 있으면 지금이야.",
      [
        choice("harbor", "항구 노동자 술자리 (₭20)", { money: -20, votes: { harbor: 6 } }, "부두 술집마다 당신 가문의 이름으로 잔이 돈다.", { money: 20 }),
        choice("fishing", "어촌 잔치 (₭20)", { money: -20, votes: { fishing: 7 } }, "공터에 솥이 걸리고 아이들이 뛰어다닌다.", { money: 20 }),
        choice("save", "돈을 아낀다", { votes: { hill: 1 } }, "은호가 어깨를 으쓱한다. 언덕 사람들은 검소하다고 수군댄다."),
      ], { turn: 6 }, "election-loss"),
    event("campaign", "major", "투표지에 적을 한 줄", "jian",
      "선거가 한 계절 남았어요. 무엇을 내걸고 출마하나요?",
      [
        choice("housing", "복구와 주거를 약속한다", { platform: "housing", votes: { fishing: 6 } }, "소라가 어촌 유세 장소를 알려 준다."),
        choice("trade", "일자리와 교역을 약속한다", { platform: "trade", votes: { harbor: 6 } }, "부두 노동자들이 당신의 말을 듣는다."),
        choice("records", "깨끗한 장부와 공개 행정을 약속한다", { platform: "records", votes: { hill: 6, harbor: 1 } }, "지안이 후보 명부에 당신 이름을 적는다."),
      ], { turn: 7 }, "election-win"),
    event("flood", "climax", "큰 장마가 지나갔다", "sora", "제방 밖에서 무엇이 남았는지, 함께 보러 가요.",
      [choice("continue", "물 빠진 항구를 바라본다", {}, "당신이 한 선택은 이 도시의 기억이 되었다.")], {}, "storm-partial"),
    event("election", "climax", "구역마다 다른 목소리", "jian", "항구, 어촌, 언덕의 표를 모두 셌습니다.",
      [choice("continue", "개표 결과를 받아들인다", {}, "이 결과가 가문의 첫 장이 된다.")], {}, "election-win"),
    event("ending", "climax", "가문의 첫 장", "seoyun", "이름 없던 가문이 도시의 기록에 남았어요.",
      [choice("continue", "첫 장의 결과를 본다", {}, "다른 가족, 다른 라이벌로 새 판을 시작할 수 있습니다.")], {}, "storm-safe"),
  ];
  const minors = [
    ["loan", "술값보다 깊은 빚", "eunho", "조합원이 이번 계절만 돈을 빌려 달래.", { money: -5, votes: { harbor: 3 } }, {}, "은호가 돈을 전한다. 조합원들이 당신 이름을 기억한다."],
    ["rumor", "등불 아래의 소문", "seoyun", "강씨 상관에 밤마다 이름 없는 짐이 들어온대요. 뒤를 밟아 볼까요?", { money: -4, dirt: 1 }, { money: 3 }, "서윤이 화물 명부의 빈칸을 보여 준다."],
    ["bread", "공터의 빈 솥", "sora", "이번 겨울 공동 부엌에 곡식이 모자라요.", { money: -6, votes: { fishing: 4 } }, { money: 2, votes: { fishing: -2 } }, "공터에 따뜻한 김이 오른다."],
    ["overtime", "저녁 배 한 척", "doyun", "늦게 온 배를 받으면 사례하지. 소문은 듣지 말고.", { money: 10, votes: { harbor: -3 } }, { votes: { harbor: 1 } }, "도윤이 동전을 센다. 조합원들은 불 꺼진 사무실로 돌아간다."],
    ["letter", "물 묻은 편지", "yun", "수문 기록을 옮기는 데 손을 빌려줘.", { prepared: 0.08 }, { money: 3 }, "윤이 오래된 수위 표시를 찾아낸다."],
    ["petitioners", "서명 한 줄의 무게", "jian", "상관의 통행료를 묻는 청원이 왔어요.", { votes: { hill: 3 }, relation: ["doyun", -5] }, { money: 5 }, "지안이 당신의 서명을 주민들 앞에서 읽는다."],
    ["lesson", "밤에 켜진 교실", "seoyun", "막내에게 장부 읽는 법을 가르쳐 줄까요?", { money: -5, training: true }, {}, "막내가 처음으로 장부를 또박또박 읽는다. 살림 +2."],
    ["nets", "찢어진 그물", "sora", "제방도 좋지만 오늘 먹을 그물도 필요해요.", { money: -4, votes: { fishing: 4 } }, {}, "소라가 기운 그물을 주민들에게 돌린다."],
    ["inspection", "증인의 자리", "minseok", "하역 검사를 함께 지켜봐 주십시오.", { votes: { hill: 3 } }, { money: 4, relation: ["doyun", 3] }, "민석이 당신의 이름을 입회인 칸에 적는다."],
    ["festival", "항구의 작은 축제", "eunho", "이번만큼은 다 같이 쉬자. 가문도 이름을 보탤래?", { money: -6, votes: { harbor: 2, fishing: 2 } }, { money: 3 }, "가족과 이웃이 같은 식탁에 앉는다."],
  ];
  minors.forEach(([id, title, who, text, yes, no, reply], i) =>
    events.push(event(id, "minor", title, who, text, [
      choice("yes", "함께한다", yes, reply, yes.money < 0 ? { money: -yes.money } : {}),
      choice("no", "이번에는 사양한다", no, "상대는 고개를 끄덕이고 돌아간다. 이 선택도 기억에 남는다."),
    ], { turnMin: i < 5 ? 0 : 5, turnMax: i < 5 ? 4 : 7 }, "hearing")),
  );
  const api = { places, people, traits, familyNames, familyTemplates, rivalNames, rivalTypes, crises, events };
  if (typeof module !== "undefined") module.exports = api;
  root.HarborContent = api;
})(globalThis);
