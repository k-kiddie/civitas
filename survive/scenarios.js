"use strict";
// 시나리오 3종. 같은 뼈대(4인 파티·저녁 결정·밤 탐색·아침 사건) 위에 세계·자원·위협·장소·사건·결말을 바꾼다.
(function (root) {
  const D = typeof module !== "undefined" ? require("./data") : root.SurviveData;
  const ICE = typeof module !== "undefined" ? require("./iceage") : root.SurviveIceage;
  const S = (id, loc, text, approaches) => ({ id, loc, text, approaches });
  const A = (label, stat, dc, win, lose, tool) => ({ label, stat, dc, win, lose, tool });

  // ── 공통 아침 사건 ({rival}{goal}{food} 등은 시나리오 이름으로 바뀐다) ──
  const commonEvents = [
    { id: "theft", text: "{who}이(가) 밤중에 {food}을(를) 몰래 먹다 걸렸다. 다들 당신을 본다.", cast: "hungry",
      choices: [
        { label: "모두 앞에서 꾸짖는다", fx: { hope: -3, castStress: 25 }, text: "{who}은(는) 고개를 숙였다." },
        { label: "용서하고 넘어간다", fx: { food: -1, hope: 4 }, text: "{who}이(가) 울었다. 누군가는 불공평하다고 수군댔다." },
        { label: "쫓아낸다", fx: { exile: true, hope: -10 }, text: "{who}이(가) 어둠 속으로 걸어 나갔다. 돌아보지 않았다." },
      ] },
    { id: "argue", text: "{who}와(과) {who2}이(가) 마지막 담요 한 장을 두고 주먹다짐을 벌였다.", cast: "two",
      choices: [
        { label: "{who} 편을 든다", fx: { castStress: -10, cast2Stress: 25 }, text: "{who2}이(가) 이를 갈며 구석으로 갔다." },
        { label: "{who2} 편을 든다", fx: { castStress: 25, cast2Stress: -10 }, text: "{who}이(가) 당신을 노려봤다." },
        { label: "담요를 태워 다 같이 불을 쬔다 (연료 대신)", fx: { wood: 1, hope: 3 }, text: "다들 어이없어 웃었다. 그날 밤은 조금 따뜻했다." },
      ] },
    { id: "despair", text: "{who}이(가) 밤새 울었다. “우린 다 죽을 거야.”", cast: "stressed",
      choices: [
        { label: "곁에 앉아 이야기를 들어 준다", fx: { castStress: -40 }, text: "{who}이(가) 겨우 잠들었다." },
        { label: "다 같이 노래를 부른다", fx: { hope: 6, allStress: -10 }, text: "누군가 첫 소절을 시작했다. 목소리가 하나씩 보태졌다." },
        { label: "입 다물라고 한다", fx: { hope: -5, castStress: 15 }, text: "울음은 멈췄다. 공기가 차갑게 식었다." },
      ] },
    { id: "brave", text: "{who}이(가) 혼자 {goal}이(가) 올 곳까지 가서 신호를 남기겠다고 한다. 목숨을 건 길이다.", cast: "brave",
      choices: [
        { label: "보낸다", fx: { swim: true }, text: "{who}이(가) 문을 나섰다." },
        { label: "말린다", fx: { hope: -2 }, text: "{who}은(는) 분하다는 듯 주먹을 쥐었다." },
      ] },
    { id: "rival_offer", text: "{rival}이(가) 찾아왔다. “{food} 다섯을 주지. 대신 너희 사람 하나를 사흘 동안 우리 일꾼으로 빌려 가겠다.”",
      choices: [
        { label: "받아들인다 (식량 +5, 한 명 사흘 떠남)", fx: { food: 5, lend: 1 }, text: "한 사람이 끌려가듯 따라갔다." },
        { label: "거절한다", fx: { hope: 3, rivalAlert: 1 }, text: "“후회할 거다.” 그들이 돌아갔다." },
      ] },
    { id: "stranger", text: "문 앞에 낯선 사람이 쓰러져 있다. 아직 숨이 붙어 있다.",
      choices: [
        { label: "들여서 돌본다 (식량 1)", fx: { food: -1, join: true, hope: 4 }, text: "그는 며칠 뒤 눈을 떴다. 새 식구가 생겼다." },
        { label: "가진 걸 뒤지고 내버려 둔다", fx: { meds: 1, hope: -6, allStress: 10 }, text: "약 한 병이 나왔다. 아무도 그 얘기를 꺼내지 않는다." },
        { label: "모른 척한다", fx: { allStress: 8 }, text: "아침에 보니 그는 사라져 있었다." },
      ] },
    // ── 도덕적 딜레마 ──
    { id: "quarantine", text: "{who}이(가) 열에 들떠 기침을 멈추지 못한다. 옮는 병일지도 모른다. 다른 사람들이 당신을 본다.", cast: "sick",
      choices: [
        { label: "구석에 격리한다 (홀로 버텨야 한다)", fx: { castStress: 30, hope: -4, isolate: true }, text: "{who}을(를) 담요 한 장과 함께 구석에 두었다. 밤새 기침 소리가 벽을 넘어왔다." },
        { label: "모두 함께 돌본다 (옮을 수 있다)", fx: { hope: 3, spread: true }, text: "모두 번갈아 {who}의 이마를 짚었다." },
        { label: "내보낸다", fx: { exile: true, hope: -12, allStress: 15 }, text: "{who}이(가) 비틀거리며 밖으로 나갔다. 아무도 문을 닫지 못했다." },
      ] },
    { id: "child_share", text: "{food}이(가) 바닥났다. 아이 몫을 줄이면 일할 어른 하나가 더 먹을 수 있다.", need: "@child",
      choices: [
        { label: "아이 몫을 줄인다", fx: { childHunger: 1, food: 1, hope: -8, allStress: 10 }, text: "아이는 아무것도 묻지 않았다. 그게 더 힘들었다." },
        { label: "어른 둘이 굶는다", fx: { adultsHunger: 2, hope: 4 }, text: "배가 고파 잠이 오지 않았다. 아이는 배부르게 잤다." },
      ] },
    { id: "neighbor_hurt", text: "건너편 건물에서 다친 이웃이 손을 흔든다. 데려오려면 위험한 길을 건너야 한다.",
      choices: [
        { label: "누군가 데리러 간다 (판정)", fx: { rescueCheck: true }, text: "" },
        { label: "못 본 척한다", fx: { hope: -5, allStress: 15 }, text: "손짓은 해 질 무렵 멈췄다." },
      ] },
    { id: "neighbor_food", text: "이웃 가족이 마지막 {food}을(를) 어디 숨겼는지 알아냈다. 그 집엔 아이가 둘이다.",
      choices: [
        { label: "밤에 몰래 가져온다", fx: { food: 4, hope: -10, allStress: 15, flag: "stole" }, text: "{food} 넷. 그 집에서 들리던 웃음소리가 다음 날부터 들리지 않았다." },
        { label: "그냥 둔다", fx: { hope: 2 }, text: "배는 고팠지만 잠은 잘 잤다." },
        { label: "찾아가서 나누자고 한다", fx: { food: 1, hope: 6 }, text: "그들은 한 끼를 나눠 줬다. 다음엔 우리가 갚기로 했다." },
      ] },
    { id: "mercy", text: "{who}이(가) 숨을 몰아쉰다. 약은 없다. {who}이(가) 당신 손을 잡고 “이제 그만… 편하게 해 줘” 하고 속삭인다.", cast: "dying",
      choices: [
        { label: "끝까지 곁을 지킨다", fx: { castStay: true, allStress: 15 }, text: "밤새 손을 잡고 있었다. {who}은(는) 아직 숨을 쉰다." },
        { label: "마지막으로 가진 것을 다 쓴다 (식량 2·연료 1)", fx: { food: -2, wood: -1, castHeal: true, hope: 2 }, text: "죽을 쑤고 불을 지폈다. {who}의 뺨에 핏기가 조금 돌았다.", need: { food: 2, wood: 1 } },
      ] },
    { id: "grief", text: "{who}이(가) {dead}이(가) 쓰던 자리에 앉아 아무 말도 하지 않는다.", cast: "grieving",
      choices: [
        { label: "곁에 앉아 {dead} 이야기를 한다", fx: { castStress: -25, hope: 2 }, text: "{who}이(가) {dead}의 우스운 버릇을 이야기하다 웃었다. 그리고 울었다." },
        { label: "{dead}의 물건을 태워 불을 지핀다", fx: { wood: 1, castStress: 15 }, text: "불은 따뜻했다. {who}은(는) 당신을 보지 않았다." },
        { label: "그냥 둔다", fx: {}, text: "{who}은(는) 해가 질 때까지 그 자리에 있었다." },
      ] },
    { id: "revenge", text: "문 앞에 낯익은 사람이 서 있다. 당신이 {food}을(를) 가져간 그 집 아버지다. 손에 쇠파이프가 들려 있다.", need: "@stole",
      choices: [
        { label: "돌려주고 사과한다 (식량 3)", fx: { food: -3, hope: 4, unflag: "stole" }, text: "그는 한참 서 있다가 {food}을(를) 받아 갔다.", need: { food: 3 } },
        { label: "맞서 쫓아낸다", fx: { hurtRandom: 1, allStress: 10, unflag: "stole" }, text: "그는 쓰러진 뒤 다시 오지 않았다. 아이들은 어떻게 됐을까." },
      ] },
  ];

  // ── ☢ 핵겨울 ──
  const nuclear = {
    id: "nuclear", name: "핵겨울", icon: "☢", level: "어려움", start: { food: 10, wood: 5, meds: 2 }, tagline: "잿빛 하늘 아래, 무너진 지하철역",
    words: { food: "통조림", wood: "연료", meds: "항생제", threat: "낙진 폭풍", goal: "구조 헬기", rival: "약탈자 두목 까마귀", shelter: "지하철역 대피소" },
    intro: [
      "섬광이 지나고 사흘. 서울은 잿빛으로 덮였다.",
      "당신은 세 사람과 함께 무너진 지하철역 승강장에 숨었다.",
      "무전기에서 끊기는 목소리: “구조 헬기… 2주 뒤… 신호를…”",
    ],
    threatHeld: "환기구를 연료 먹인 천으로 막고 버텼다. 낙진이 문밖에 쌓였다.",
    threatHit: "낙진 폭풍이 승강장까지 들이쳤다. 기침 소리가 밤새 이어졌다.",
    homeFind: "선로에서 쥐를 잡았다",
    people: [
      { id: "medic", last: "손이… 이제야 안 떨리네. 남은 약은… 아이부터 써요.", name: "지수", role: "간호사", stats: { force: 0, talk: 2, craft: 1, wits: 3 }, bio: "응급실에서 마지막까지 버텼다. 손이 떨리는 걸 숨긴다.", care: 1 },
      { id: "soldier", last: "명령이다… 살아서… 헬기 타.", name: "강철", role: "전직 하사", stats: { force: 3, talk: 0, craft: 1, wits: 2 }, bio: "명령이 없어진 세상에서 스스로 명령을 만든다." },
      { id: "electrician", last: "불… 꺼지지 않게… 배선은 내가 다 적어 뒀어.", name: "덕배", role: "전기공", stats: { force: 2, talk: 0, craft: 3, wits: 1 }, bio: "전등 하나만 켜도 사람들이 웃는다는 걸 안다." },
      { id: "teacher", last: "우리 반 애들… 이름… 아무도 안 잊었으면 해서…", name: "미영", role: "초등학교 교사", stats: { force: 0, talk: 3, craft: 1, wits: 2 }, bio: "아이들을 찾지 못했다. 매일 밤 이름을 부른다." },
      { id: "scavenger", last: "공짜는… 없다고 했지. 이건… 공짜야.", name: "고물상 노인", role: "고물상", stats: { force: 0, talk: 2, craft: 1, wits: 3 }, bio: "폐허를 손바닥 보듯 안다. 대가는 꼭 받는다.", sly: 1 },
      { id: "radio", last: "무전기… 켜 둬요. 누군가는… 듣고 있어.", name: "하나", role: "무전 소녀", stats: { force: 0, talk: 1, craft: 2, wits: 2 }, bio: "열여섯. 무전기만 있으면 세상과 이어져 있다고 믿는다.", radio: 1 },
      { id: "child", last: "엄마… 저기 있어… 보여?", name: "준", role: "길 잃은 아이", stats: { force: 0, talk: 0, craft: 0, wits: 0 }, bio: "일곱 살. 엄마를 찾고 있다.", child: true },
    ],
    places: {
      mart: { name: "무너진 마트", danger: 1, loot: "통조림", desc: "천장이 내려앉은 대형 마트" },
      tunnel: { name: "지하철 터널", danger: 1, loot: "연료", desc: "물이 고인 선로, 버려진 정비 차량" },
      hospital: { name: "폐허 병원", danger: 2, loot: "항생제", desc: "응급실 불이 아직 깜빡인다는 소문" },
      depot: { name: "군 보급창", danger: 3, loot: "무엇이든", desc: "철조망과 지뢰 경고판" },
      raider: { name: "약탈자 소굴", danger: 3, loot: "통조림 많이", desc: "까마귀 무리가 쌓아 둔 약탈품" },
    },
    scenes: [
      S("n_shelf", "mart", "무너진 진열대 밑에 통조림 상자가 깔려 있다. 천장이 삐걱거린다.", [
        A("진열대를 들어 올린다", "force", 12, { loot: { food: 4 }, text: "통조림 상자를 끌어냈다." }, { harm: 1, loot: { food: 1 }, text: "철판이 떨어져 팔을 찢었다." }, "crowbar"),
        A("잔해 틈으로 기어 들어간다", "wits", 13, { loot: { food: 3 }, tool: "lamp", text: "비상용 랜턴과 통조림을 챙겼다." }, { stress: 15, text: "잔해가 무너져 겨우 빠져나왔다." }),
      ]),
      S("n_family", "mart", "계산대 뒤에 한 가족이 숨어 있다. 아버지가 쇠파이프를 쥐고 있다.", [
        A("나눠 갖자고 설득한다", "talk", 13, { loot: { food: 2, hope: 5 }, text: "반씩 나눴다. 아이가 손을 흔들었다." }, { stress: 10, text: "쇠파이프가 날아왔다. 빈손으로 물러났다." }),
        A("힘으로 빼앗는다", "force", 12, { loot: { food: 5, hope: -8 }, stress: 20, text: "아이 울음소리가 귀에서 떠나지 않는다." }, { harm: 1, text: "아버지가 필사적으로 덤볐다." }, "knife"),
        A("우리 대피소로 데려간다", "talk", 15, { join: true, loot: { hope: 6 }, text: "새 식구가 생겼다. 입도 늘었다." }, { stress: 10, text: "그들은 믿지 않았다." }),
      ]),
      S("n_drum", "tunnel", "정비 차량 옆에 경유 드럼통. 선로엔 허리까지 물이 찼다.", [
        A("드럼통을 굴려 온다", "force", 12, { loot: { wood: 4 }, text: "무거운 드럼을 끝까지 굴려 왔다." }, { harm: 1, text: "미끄러져 선로에 머리를 박았다." }),
        A("호스로 연료를 빼낸다", "craft", 12, { loot: { wood: 3 }, text: "깡통 세 개에 연료를 채웠다." }, { stress: 10, loot: { wood: 1 }, text: "기름을 삼켜 토했다." }),
      ]),
      S("n_rats", "tunnel", "터널 저편에서 붉은 눈들이 반짝인다. 쥐 떼다.", [
        A("불을 휘둘러 쫓는다", "force", 13, { loot: { wood: 3 }, text: "쥐들이 흩어진 사이 정비실 연료를 챙겼다." }, { harm: 1, text: "다리를 물렸다. 상처가 곪을지도." }, "knife"),
        A("다른 길로 돌아간다", "wits", 12, { loot: { wood: 2 }, text: "환풍구를 통해 돌아갔다." }, { stress: 15, text: "길을 잃었다. 새벽까지 헤맸다." }, "lamp"),
      ]),
      S("n_er", "hospital", "응급실 약품 창고. 전자 자물쇠가 아직 살아 있다.", [
        A("전원을 끊고 연다", "craft", 13, { loot: { meds: 3 }, text: "자물쇠가 풀렸다. 항생제 상자다." }, { harm: 1, text: "감전됐다." }),
        A("문을 부순다", "force", 14, { loot: { meds: 2 }, text: "문이 찌그러지며 열렸다." }, { harm: 1, stress: 10, text: "소리를 듣고 무언가 다가왔다. 도망쳤다." }, "crowbar"),
      ]),
      S("n_patient", "hospital", "병상에 환자복 차림의 노인이 아직 살아 있다. “물… 물 좀…”", [
        A("치료해 준다 (항생제 1)", "wits", 11, { loot: { meds: -1, hope: 6 }, join: true, text: "노인이 일어섰다. 함께 가겠다고 했다." }, { loot: { meds: -1 }, stress: 15, text: "늦었다. 노인은 당신 손을 잡은 채 숨을 거뒀다." }),
        A("물만 주고 약을 챙긴다", "wits", 9, { loot: { meds: 2 }, stress: 10, text: "노인은 고맙다고 했다. 그게 더 아팠다." }, { loot: { meds: 1 }, stress: 15, text: "서두르다 약병을 깨뜨렸다." }),
      ]),
      S("n_geiger", "hospital", "방사선 계측기가 미친 듯이 울린다. 영상의학과 쪽이다.", [
        A("빨리 지나간다", "wits", 13, { loot: { meds: 2 }, text: "숨을 참고 뛰었다. 약품 카트를 밀고 나왔다." }, { harm: 1, stress: 10, text: "피폭됐다. 머리카락이 빠지기 시작할 것이다." }, "lamp"),
        A("돌아간다", "talk", 5, { text: "목숨이 먼저다." }, { text: "목숨이 먼저다." }),
      ]),
      S("n_wire", "depot", "철조망 너머 보급 컨테이너. 바닥엔 지뢰 경고판.", [
        A("경고판 사이로 길을 읽는다", "wits", 14, { loot: { food: 4, meds: 1 }, text: "지뢰 사이로 들어가 컨테이너를 열었다." }, { harm: 2, text: "땅이 터졌다." }),
        A("철조망을 끊고 담 쪽으로 간다", "craft", 13, { loot: { food: 3 }, tool: "crowbar", text: "공구함에서 쇠지레까지 챙겼다." }, { harm: 1, text: "철조망에 온몸이 긁혔다." }),
      ]),
      S("n_body", "depot", "컨테이너 옆에 군인 시신. 허리에 대검이 있다.", [
        A("장비를 챙긴다", "wits", 10, { tool: "knife", loot: { food: 2 }, stress: 5, text: "대검과 전투식량을 챙겼다. 이름표는 주머니에 넣었다." }, { stress: 15, text: "손이 떨려 끝내 만지지 못했다." }),
        A("묻어 준다", "talk", 10, { loot: { hope: 5 }, text: "짧게 경례했다." }, { stress: 10, text: "땅이 얼어 묻지 못했다." }),
      ]),
      S("n_guard", "raider", "약탈자 소굴 앞, 드럼통 불가에 보초가 졸고 있다.", [
        A("몰래 지나간다", "wits", 14, { loot: { food: 6 }, text: "약탈품 더미에서 통조림을 퍼 왔다." }, { harm: 1, rivalAlert: true, text: "보초가 깼다. 총알이 날아왔다." }, "lamp"),
        A("보초를 제압한다", "force", 14, { loot: { food: 7 }, rivalAlert: true, text: "보초를 묶고 털었다. 까마귀가 가만있지 않을 것이다." }, { harm: 2, text: "보초가 먼저 칼을 뽑았다." }, "knife"),
      ]),
      S("n_cage", "raider", "철창 안에 붙잡힌 사람이 있다. “살려 줘… 문 좀…”", [
        A("자물쇠를 딴다", "craft", 14, { join: true, loot: { hope: 6 }, rivalAlert: true, text: "포로를 데리고 빠져나왔다." }, { harm: 1, text: "들켰다." }, "crowbar"),
        A("못 본 척한다", "wits", 5, { stress: 20, text: "철창 소리가 계속 들렸다." }, { stress: 20, text: "철창 소리가 계속 들렸다." }),
      ]),
      S("n_ash", null, "돌아오는 길, 하늘이 검게 변하며 재가 쏟아진다.", [
        A("젖은 천으로 입을 막고 달린다", "force", 12, { text: "숨이 끊어질 듯 달려 돌아왔다." }, { harm: 1, lose: 0.5, text: "쓰러져 짐 절반을 버렸다." }),
        A("건물 안에서 그칠 때까지 기다린다", "wits", 12, { text: "무너진 은행 금고 안에서 버텼다." }, { stress: 15, text: "밤새 기침했다." }, "lamp"),
      ]),
      S("n_dog", null, "폐허 골목에서 목줄 맨 개 한 마리가 따라온다. 말라 비틀어졌다.", [
        A("통조림 하나를 나눠 준다", "talk", 8, { loot: { food: -1, hope: 6 }, text: "개가 대피소까지 따라왔다. 사람들이 웃었다." }, { loot: { food: -1 }, text: "개는 먹고 달아났다." }),
        A("쫓아 버린다", "force", 6, { stress: 5, text: "개가 낑낑대며 사라졌다." }, { stress: 5, text: "개가 낑낑대며 사라졌다." }),
      ]),
    ],
    events: [
      { id: "radio_call", text: "하나의 무전기에서 목소리가 잡혔다. “생존자… 위치를… 연료가 필요…”", need: "radio",
        choices: [
          { label: "연료 2로 무전기를 밤새 돌린다", fx: { wood: -2, radio: true }, text: "위치를 보냈다. 구조 헬기가 하루 일찍 온다!", need: { wood: 2 } },
          { label: "연료를 아낀다", fx: { stress: { radio: 20 } }, text: "하나는 꺼진 무전기를 끌어안고 잤다." },
        ] },
      { id: "fever_kid", text: "준의 이마가 불덩이다. 피폭 증상일지도 모른다.", need: "child",
        choices: [
          { label: "항생제를 쓴다", fx: { meds: -1, heal: "child", hope: 4 }, text: "열이 내렸다. 준이 처음으로 웃었다.", need: { meds: 1 } },
          { label: "약은 어른들에게 아낀다", fx: { worsen: "child", allStress: 15 }, text: "그날 밤 아무도 잠들지 못했다." },
        ] },
    ],
    endings: {
      all: "구조 헬기 프로펠러 소리가 재를 갈랐다. 넷 모두 함께였다.",
      most: "헬기에 오르며 누군가 뒤를 돌아봤다. 승강장에 빈자리가 있었다.",
      few: "헬기 문이 닫혔다. 살아남은 자들은 서로의 눈을 피했다.",
      riot: "희망이 꺼진 밤, 사람들이 당신을 대피소 밖으로 끌어냈다.",
      lost: "재는 모든 것을 덮었다.",
    },
  };

  // ── ❄ 극 빙하기 ──
  const iceage = {
    id: "iceage", name: "극 빙하기", icon: "❄", level: "어려움", start: { food: 10, wood: 7, meds: 1 }, tagline: "영하 60도, 눈에 묻힌 연구 기지",
    words: { food: "식량", wood: "연료", meds: "의약품", threat: "눈보라", goal: "남행 열차", rival: "늑대단", shelter: "연구 기지" },
    intro: [
      "태양이 흐려진 지 세 해. 북반구는 얼음에 덮였다.",
      "당신은 세 사람과 함께 눈에 반쯤 묻힌 극지 연구 기지에 남았다.",
      "마지막 소식: 남쪽으로 가는 열차가 2주 뒤 이 근처 선로를 지난다.",
    ],
    threatHeld: "연료를 아낌없이 태워 기지를 데웠다. 눈보라가 문을 두드리다 지나갔다.",
    threatHit: "눈보라에 창이 깨졌다. 눈이 침낭 위로 쌓였다.",
    homeFind: "얼음 구멍에서 물고기를 낚았다",
    people: [
      { id: "meteorologist", last: "바람이… 남쪽으로 돌아요. 이제 따뜻해질 거예요.", name: "은서", role: "기상학자", stats: { force: 0, talk: 2, craft: 1, wits: 3 }, bio: "눈보라가 언제 올지 아는 유일한 사람." },
      { id: "hunter", last: "…눈 냄새가 바뀌었어. 봄이 오려나.", name: "마루", role: "사냥꾼", stats: { force: 3, talk: 0, craft: 1, wits: 2 }, bio: "설원에서 혼자 살아남은 사내. 말이 적다." },
      { id: "pilot", last: "한 번만… 더 날고 싶었는데.", name: "한별", role: "조종사", stats: { force: 1, talk: 1, craft: 2, wits: 2 }, bio: "추락한 수송기에서 걸어 나왔다. 다시 날고 싶어 한다." },
      { id: "mechanic", last: "난로는… 왼쪽으로 세 번 두드리면 돌아가.", name: "석구", role: "정비공", stats: { force: 2, talk: 1, craft: 3, wits: 0 }, bio: "난로와 발전기는 그의 손에서만 돈다." },
      { id: "cook", last: "밥은… 꼭 같이 먹어. 따로 먹으면 다 무너져.", name: "복순", role: "취사병 출신", stats: { force: 1, talk: 2, craft: 2, wits: 1 }, bio: "쌀 한 줌으로 넷을 먹인다.", cook: 1 },
      { id: "monk", last: "아무도… 원망하지 마세요. 나도 안 합니다.", name: "혜안", role: "스님", stats: { force: 0, talk: 3, craft: 1, wits: 2 }, bio: "얼어붙은 산사에서 내려왔다. 누구도 원망하지 않는다.", care: 1 },
      { id: "child", last: "눈사람… 같이 만들기로 했잖아…", name: "눈이", role: "구조된 아이", stats: { force: 0, talk: 0, craft: 0, wits: 0 }, bio: "여덟 살. 눈사람을 만들고 싶어 한다.", child: true },
    ],
    places: {
      village: { name: "얼어붙은 마을", danger: 1, loot: "식량", desc: "지붕까지 눈에 묻힌 집들" },
      cave: { name: "빙하 동굴", danger: 1, loot: "연료", desc: "얼어붙은 옛 연료 저장고가 있다는 동굴" },
      plane: { name: "추락한 수송기", danger: 2, loot: "의약품", desc: "반쯤 열린 화물칸" },
      station: { name: "버려진 관측소", danger: 2, loot: "무엇이든", desc: "얼어붙은 안테나와 계기판" },
      camp: { name: "늑대단 캠프", danger: 3, loot: "식량 많이", desc: "무장한 생존자들의 텐트" },
    },
    scenes: ICE.scenes,
    events: [
      { id: "forecast", text: "은서가 기압계를 두드린다. “사흘 뒤가 아니라 내일이에요. 큰 게 와요.”", need: "meteorologist",
        choices: [
          { label: "모두 문과 창을 보강한다 (연료 1)", fx: { wood: -1, delayThreat: false, hope: 3, braceThreat: true }, text: "판자를 덧대고 틈을 막았다.", need: { wood: 1 } },
          { label: "믿지 않는다", fx: { stress: { meteorologist: 15 } }, text: "은서는 입을 다물었다." },
        ] },
      { id: "frost_kid", text: "눈이의 손가락이 하얗게 얼었다. 울지도 못한다.", need: "child",
        choices: [
          { label: "의약품과 연료를 쓴다", fx: { meds: -1, heal: "child", hope: 4 }, text: "손가락에 핏기가 돌아왔다.", need: { meds: 1 } },
          { label: "품에 안고 버틴다", fx: { worsen: "child", allStress: 10 }, text: "밤새 아이를 안고 있었다." },
        ] },
    ],
    endings: {
      all: "눈 덮인 선로 끝에서 열차 불빛이 다가왔다. 모두가 손을 흔들었다.",
      most: "열차에 오르며 누군가 설원을 돌아봤다. 눈 위에 작은 무덤이 있었다.",
      few: "열차 문이 닫혔다. 살아남은 자들은 창밖의 하얀 들판을 보지 않았다.",
      riot: "마지막 연료가 바닥난 밤, 사람들이 당신을 기지 밖으로 내몰았다.",
      lost: "눈은 기지를 완전히 덮었다. 봄은 오지 않았다.",
    },
  };

  const FLOOD_LAST = {
    sora: "도담이를… 부탁해요. 꼭… 배에 태워 줘요.", eunho: "우리 손이 멈추면… 아니, 이제 좀 쉬자.", yun: "물길은… 언덕 쪽으로 빠진다. 기억해.",
    minseok: "규칙은… 지켰어요. 끝까지.", seoyun: "기록해 줘요. 우리가… 여기 있었다고.", harin: "형… 아니, 언니… 무서웠어.",
    haejin: "삼촌한테는… 말하지 마. 나 여기서 처음으로… 사람답게 살았어.", taeo: "나 겁 안 났어. 진짜야…",
  };
  // ── 🌊 대홍수 (기존 콘텐츠를 4인 구조로) ──
  const flood = {
    id: "flood", name: "대홍수", icon: "🌊", level: "보통", start: { food: 7, wood: 5, meds: 1 }, tagline: "강둑이 터진 항구, 물에 잠긴 창고 2층",
    words: { food: "식량", wood: "땔감", meds: "약", threat: "폭우", goal: "구조선", rival: "선주 도윤", shelter: "창고 2층" },
    intro: [
      "강둑이 터졌다. 항구가 하룻밤 새 물에 잠겼다.",
      "당신은 세 사람과 함께 물에 갇힌 창고 2층으로 피했다.",
      "구조선이 2주쯤 뒤에 온다는 소문만 돈다.",
    ],
    threatHeld: "판자로 창을 막고 땔감을 태우며 버텼다. 물이 문턱에서 멈췄다.",
    threatHit: "폭우에 물이 2층까지 차올랐다. 짐이 떠내려갔다.",
    homeFind: "창문 밖으로 그물을 던져 물고기를 잡았다",
    people: D.people.filter((p) => p.id !== "sundeok").map((p) => ({ ...p, last: FLOOD_LAST[p.id] })).concat([{ ...D.child, id: "dodam", last: "엄마… 배 타고… 집에 가자…" }]),
    places: D.places,
    scenes: D.scenes,
    events: D.events.filter((e) => ["cough", "doyun_offer", "haejin"].includes(e.id)),
    endings: {
      all: "구조선이 왔을 때, 모두가 함께였다.",
      most: "구조선에 오르며 누군가는 뒤를 돌아봤다. 빈자리가 있었다.",
      few: "살아남은 자들은 그 겨울 이야기를 하지 않는다.",
      riot: "희망이 꺼진 밤, 사람들이 당신을 끌어내렸다.",
      lost: "물은 모든 것을 삼켰다.",
    },
  };
  const scenarios = { nuclear, iceage, flood };
  const api = { scenarios, commonEvents, order: ["nuclear", "iceage", "flood"] };
  if (typeof module !== "undefined") module.exports = api;
  root.SurviveScenarios = api;
})(globalThis);
