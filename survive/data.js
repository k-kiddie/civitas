"use strict";
// 「물에 잠기는 항구」 콘텐츠. 생존 관리(낮) + TRPG 탐색(밤) + 사람 사이 드라마(아침).
(function (root) {
  const stats = {
    force: { name: "완력", icon: "💪" },
    talk: { name: "말솜씨", icon: "🗣" },
    craft: { name: "손재주", icon: "🔧" },
    wits: { name: "눈치", icon: "👁" },
  };
  // 주민 후보. 매 판 대표 + 7명이 무작위로 갇힌다(소라가 있으면 아들 도담도 함께).
  const people = [
    { id: "sora", name: "소라", face: "🧕", role: "어촌 대표", stats: { force: 0, talk: 3, craft: 1, wits: 2 }, bio: "아들 도담을 지키는 게 전부다.", kin: "dodam" },
    { id: "eunho", name: "은호", face: "👷", role: "공장 노동자", stats: { force: 3, talk: 0, craft: 2, wits: 1 }, bio: "다리를 다친 채 갇혔다. 쉬는 걸 못 견딘다.", hp: 1 },
    { id: "yun", name: "윤", face: "👴", role: "늙은 수문공", stats: { force: 0, talk: 1, craft: 3, wits: 2 }, bio: "이 강둑을 쌓은 사람. 물길을 안다.", dike: 1 },
    { id: "minseok", name: "민석", face: "👮", role: "경찰 보조", stats: { force: 2, talk: 1, craft: 0, wits: 3 }, bio: "규칙을 지키려 하지만 굶주림 앞에선 흔들린다." },
    { id: "seoyun", name: "서윤", face: "👩‍⚕️", role: "기록관 서기", stats: { force: 0, talk: 2, craft: 1, wits: 2 }, bio: "의서를 읽어 본 유일한 사람.", care: 1 },
    { id: "harin", name: "하린", face: "🧑", role: "당신의 동생", stats: { force: 1, talk: 1, craft: 2, wits: 2 }, bio: "당신을 믿고 따라왔다." },
    { id: "sundeok", name: "순덕", face: "👵", role: "국밥집 할머니", stats: { force: 0, talk: 2, craft: 2, wits: 1 }, bio: "쌀 한 줌으로 열 명을 먹인다.", cook: 1 },
    { id: "haejin", name: "강해진", face: "🧔", role: "선주 도윤의 조카", stats: { force: 2, talk: 2, craft: 0, wits: 2 }, bio: "삼촌의 쌀 창고 열쇠를 안다고 했다. 믿어도 될까.", sly: 1 },
    { id: "taeo", name: "태오", face: "🧒", role: "열일곱 살 하역꾼", stats: { force: 2, talk: 0, craft: 1, wits: 1 }, bio: "겁이 없다. 그래서 위험하다." },
  ];
  const child = { id: "dodam", name: "도담", face: "👦", role: "소라의 아들", stats: { force: 0, talk: 0, craft: 0, wits: 0 }, bio: "여섯 살. 기침을 한다.", child: true };
  // 낮의 일
  const jobs = {
    dike: { name: "둑 쌓기", icon: "🧱", desc: "둑 진척 + (손재주) · 땔감 1" },
    fish: { name: "고기잡이", icon: "🎣", desc: "식량 + (눈치)" },
    wood: { name: "땔감 줍기", icon: "🪵", desc: "땔감 + (완력)" },
    care: { name: "돌보기", icon: "🩹", desc: "가장 아픈 사람 치료 (중상 이상은 약 1)" },
    rest: { name: "쉬기", icon: "💤", desc: "스트레스 −25 · 부상 회복" },
  };
  const rations = {
    full: { name: "넉넉히", per: 1, hope: 4, stress: -5 },
    normal: { name: "보통", per: 0.85, hope: 0, stress: 0 },
    half: { name: "반만", per: 0.5, hope: -3, stress: 8 },
    none: { name: "굶긴다", per: 0, hope: -12, stress: 15 },
  };
  const hpNames = ["건강", "부상", "중상", "위독", "사망"];
  // 밤 탐색 장소
  const places = {
    store: { name: "무너진 창고", icon: "🏚", danger: 1, loot: "식량", desc: "물에 반쯤 잠긴 상점 창고" },
    pharmacy: { name: "약국", icon: "💊", danger: 2, loot: "약", desc: "문이 잠겼다. 안에서 소리가 난다는 소문" },
    mill: { name: "목재소", icon: "🪓", danger: 1, loot: "땔감", desc: "떠내려가지 않은 판자가 쌓여 있다" },
    granary: { name: "도윤의 쌀 창고", icon: "🏯", danger: 3, loot: "식량 많이", desc: "도윤의 사병이 지킨다" },
    wreck: { name: "떠내려온 배", icon: "⛵", danger: 2, loot: "무엇이든", desc: "누가 타고 있었을까" },
  };
  // 탐색 장면: 접근법마다 능력치 판정. win/lose: loot {food,wood,meds,hope}, harm(부상 단계), stress, special
  const S = (id, loc, text, approaches) => ({ id, loc, text, approaches });
  const A = (label, stat, dc, win, lose) => ({ label, stat, dc, win, lose });
  const scenes = [
    // 창고
    S("st_shelf", "store", "무너진 선반 밑에 쌀자루가 깔려 있다. 천장이 삐걱거린다.", [
      A("선반을 들어 올린다", "force", 12, { loot: { food: 5 }, text: "쌀자루 두 개를 끌어냈다." }, { harm: 1, loot: { food: 1 }, text: "선반이 무너지며 팔을 짓눌렀다." }),
      A("받침을 대고 천천히 뺀다", "craft", 13, { loot: { food: 4 }, text: "천장을 받치고 무사히 꺼냈다." }, { stress: 15, text: "천장이 내려앉았다. 겨우 빠져나왔다." }),
    ]),
    S("st_rats", "store", "쌀통 주위로 쥐 떼가 들끓는다. 일부는 이미 썩었다.", [
      A("성한 것만 골라낸다", "wits", 12, { loot: { food: 4 }, text: "깨끗한 쌀만 골라 담았다." }, { loot: { food: 2 }, stress: 10, text: "썩은 쌀이 섞였다. 몇 명이 배앓이를 할 것이다." }),
      A("통째로 들고 나온다", "force", 11, { loot: { food: 6 }, text: "통째로 짊어지고 나왔다." }, { harm: 1, text: "쥐에게 물렸다. 상처가 곪을지도 모른다." }),
    ]),
    S("st_family", "store", "창고 구석에 굶주린 가족이 웅크리고 있다. 쌀자루를 끌어안고 있다.", [
      A("나눠 갖자고 설득한다", "talk", 13, { loot: { food: 3, hope: 4 }, text: "반씩 나눴다. 그들은 고맙다며 울었다." }, { stress: 15, text: "아버지가 칼을 들었다. 빈손으로 물러났다." }),
      A("빼앗는다", "force", 11, { loot: { food: 6, hope: -8 }, stress: 20, text: "아이 울음소리가 귀에서 떠나지 않는다." }, { harm: 1, stress: 15, text: "아버지가 필사적으로 덤볐다." }),
      A("우리 거처로 데려간다", "talk", 15, { join: true, loot: { hope: 6 }, text: "새 식구가 생겼다. 입도 늘었다." }, { stress: 10, text: "그들은 믿지 않았다." }),
    ]),
    // 약국
    S("ph_door", "pharmacy", "약국 문이 안에서 잠겼다. 사람의 숨소리가 들린다.", [
      A("문을 부순다", "force", 13, { loot: { meds: 2 }, text: "문이 부서졌다. 안의 노인은 겁에 질려 도망쳤다." }, { harm: 1, text: "문틀이 무너지며 다쳤다." }),
      A("말을 건다", "talk", 12, { loot: { meds: 2, hope: 3 }, text: "약사가 문을 열었다. 약을 나눠 줬다." }, { stress: 10, text: "“꺼져!” 대답 대신 깨진 병이 날아왔다." }),
      A("뒷창문을 찾는다", "wits", 13, { loot: { meds: 3 }, text: "뒷창문으로 들어가 선반을 털었다." }, { harm: 1, text: "유리 조각에 손이 찢겼다." }),
    ]),
    S("ph_shelf", "pharmacy", "물에 젖은 약병들. 이름표가 다 지워졌다.", [
      A("냄새와 색으로 가려낸다", "wits", 14, { loot: { meds: 3 }, text: "쓸 만한 약을 가려냈다." }, { loot: { meds: 1 }, harm: 1, text: "잘못 맛본 약에 속이 뒤집혔다." }),
      A("서랍째 챙긴다", "craft", 12, { loot: { meds: 2 }, text: "서랍을 뜯어 통째로 챙겼다." }, { stress: 10, text: "서랍이 물에 불어 열리지 않았다." }),
    ]),
    S("ph_rival", "pharmacy", "도윤의 사병 두 명이 먼저 와서 약을 쓸어 담고 있다.", [
      A("정면으로 덤빈다", "force", 15, { loot: { meds: 4, hope: 5 }, text: "사병들을 쫓아냈다. 그들의 약까지 챙겼다." }, { harm: 2, text: "몽둥이에 맞아 쓰러졌다." }),
      A("도윤 이름을 팔아 속인다", "talk", 14, { loot: { meds: 3 }, text: "“도윤 어른이 더 가져오래.” 사병들이 약을 넘겼다." }, { harm: 1, stress: 10, text: "거짓말이 들통났다." }),
      A("숨어서 기다린다", "wits", 12, { loot: { meds: 1 }, text: "사병들이 떠난 뒤 남은 걸 주웠다." }, { stress: 15, text: "들킬 뻔했다. 심장이 아직도 뛴다." }),
    ]),
    // 목재소
    S("ml_stack", "mill", "물에 뜬 판자 더미. 밑으로 물살이 세다.", [
      A("물에 들어가 끌어온다", "force", 12, { loot: { wood: 5 }, text: "판자를 한가득 끌어왔다." }, { harm: 1, text: "물살에 휩쓸려 바위에 부딪혔다." }),
      A("갈고리를 만들어 건진다", "craft", 11, { loot: { wood: 4 }, text: "물에 들어가지 않고 건져 냈다." }, { loot: { wood: 1 }, text: "갈고리가 부러졌다." }),
    ]),
    S("ml_saw", "mill", "목재소 기계 밑에 마른 장작이 보인다. 기계가 기울어 있다.", [
      A("기계를 받치고 꺼낸다", "craft", 13, { loot: { wood: 6 }, text: "마른 장작이다. 며칠은 따뜻하겠다." }, { harm: 2, text: "기계가 넘어졌다." }),
      A("포기하고 젖은 판자만 줍는다", "wits", 8, { loot: { wood: 2 }, text: "젖은 판자라도 없는 것보다 낫다." }, { loot: { wood: 1 }, text: "거의 건진 게 없다." }),
    ]),
    // 쌀 창고
    S("gr_guard", "granary", "횃불 아래 도윤의 사병이 졸고 있다. 창고 문은 쇠사슬로 묶였다.", [
      A("사슬을 몰래 끊는다", "craft", 14, { loot: { food: 8 }, text: "사슬이 끊어졌다. 쌀가마를 둘이나 메고 나왔다." }, { harm: 1, rivalAlert: true, text: "쇳소리에 사병이 깼다. 화살이 날아왔다." }),
      A("사병을 덮친다", "force", 14, { loot: { food: 9 }, rivalAlert: true, text: "사병을 묶고 창고를 털었다. 도윤이 가만있지 않을 것이다." }, { harm: 2, text: "사병이 먼저 칼을 뽑았다." }),
      A("사병에게 술을 먹여 꾄다", "talk", 13, { loot: { food: 6 }, text: "취한 사병이 문을 열어 줬다." }, { stress: 15, rivalAlert: true, text: "사병이 비웃으며 호루라기를 불었다." }),
    ]),
    S("gr_inside", "granary", "창고 안. 쌀이 산처럼 쌓였다. 도윤은 이걸 쥐고 사람들이 굶는 걸 지켜봤다.", [
      A("들 수 있는 만큼 든다", "force", 13, { loot: { food: 10 }, text: "허리가 휘도록 짊어졌다." }, { harm: 1, loot: { food: 4 }, text: "무게에 넘어져 쌀을 쏟았다." }),
      A("장부를 훔쳐 협상 카드로 쓴다", "wits", 14, { loot: { hope: 8 }, ledger: true, text: "도윤의 장부를 챙겼다. 이걸로 그와 거래할 수 있다." }, { stress: 10, text: "장부는 찾지 못했다." }),
    ]),
    // 배
    S("wr_hold", "wreck", "기울어진 배의 화물칸. 상자들이 물에 떠 있다.", [
      A("물속으로 잠수한다", "force", 13, { loot: { food: 3, meds: 1, wood: 2 }, text: "상자 몇 개를 건져 올렸다." }, { harm: 1, text: "숨이 막혀 겨우 올라왔다." }),
      A("떠 있는 것만 건진다", "wits", 10, { loot: { wood: 3 }, text: "떠 있는 상자를 끌어왔다." }, { text: "쓸 만한 건 없었다." }),
    ]),
    S("wr_radio", "wreck", "선장실에 무전기가 있다. 배터리가 거의 없다.", [
      A("무전기를 고친다", "craft", 15, { radio: true, loot: { hope: 15 }, text: "지지직… 구조대가 응답했다! 구조선이 더 빨리 온다." }, { stress: 10, text: "전선이 타 버렸다." }),
      A("배터리를 떼어 거처 등불로 쓴다", "craft", 9, { loot: { hope: 5 }, text: "밤마다 작은 불빛이 생겼다." }, { text: "배터리가 젖어 있었다." }),
    ]),
    S("wr_survivor", "wreck", "갑판 밑에서 신음 소리. 선원 하나가 다리가 끼어 있다.", [
      A("끌어낸다", "force", 13, { join: true, loot: { hope: 6 }, text: "선원을 구했다. 그는 당신을 따르겠다고 했다." }, { harm: 1, text: "배가 기울며 함께 끼일 뻔했다." }),
      A("두고 간다", "wits", 5, { stress: 20, text: "신음 소리가 멀어졌다. 아무도 그 이야기를 꺼내지 않는다." }, { stress: 20, text: "신음 소리가 멀어졌다." }),
    ]),
    // 어디서나
    S("any_current", null, "돌아가는 길, 골목이 급류로 변했다.", [
      A("헤엄쳐 건넌다", "force", 12, { text: "무사히 건넜다." }, { harm: 1, lose: 0.5, text: "물살에 휩쓸렸다. 짐 절반을 잃었다." }),
      A("지붕을 타고 돌아간다", "wits", 12, { text: "지붕 위로 돌아왔다." }, { stress: 10, text: "길을 잃고 새벽까지 헤맸다." }),
    ]),
    S("any_body", null, "물 위에 떠 있는 시신. 아는 얼굴이다.", [
      A("건져서 묻어 준다", "talk", 10, { loot: { hope: 4 }, stress: 5, text: "짧은 기도를 했다. 마음이 조금 가라앉았다." }, { stress: 15, text: "손이 떨려 끝내 건지지 못했다." }),
      A("주머니를 뒤진다", "wits", 10, { loot: { meds: 1, food: 1 }, stress: 15, text: "약 한 병과 마른 빵. 그리고 죄책감." }, { stress: 20, text: "아무것도 없었다. 죄책감만 남았다." }),
    ]),
  ];
  // 아침 사건 (사람 사이 드라마). who: 조건에 맞는 주민이 배역을 맡는다.
  const events = [
    { id: "theft", text: "{who}이(가) 밤중에 배급 창고에서 쌀을 훔치다 걸렸다. 다들 당신을 본다.", cast: "hungry",
      choices: [
        { label: "모두 앞에서 벌한다 (하루 배급 없음)", fx: { hope: -4, castStress: 25 }, text: "{who}은(는) 고개를 숙였다. 아무도 다시 훔치지 않을 것이다." },
        { label: "용서하고 쌀을 나눈다", fx: { food: -3, hope: 5 }, text: "{who}이(가) 울었다. 몇몇은 불공평하다고 수군댔다." },
        { label: "거처에서 내쫓는다", fx: { exile: true, hope: -10 }, text: "{who}이(가) 물속으로 걸어 나갔다. 돌아보지 않았다." },
      ] },
    { id: "cough", text: "도담의 기침이 심해졌다. 이마가 불덩이다. 소라가 당신 팔을 붙잡는다.", need: "dodam",
      choices: [
        { label: "약을 쓴다 (약 1)", fx: { meds: -1, hope: 4, heal: "dodam" }, text: "열이 내렸다. 소라가 밤새 아이 곁을 지켰다.", need: { meds: 1 } },
        { label: "약은 일하는 사람에게 아낀다", fx: { worsen: "dodam", stress: { sora: 30 } }, text: "소라는 아무 말도 하지 않았다. 그 눈빛을 잊을 수 없다." },
      ] },
    { id: "doyun_offer", text: "도윤의 배가 거처 앞에 섰다. “쌀 열 되를 주지. 대신 당신 사람 둘을 사흘간 내 창고 지기로 보내.”",
      choices: [
        { label: "받아들인다 (쌀 +10, 둘을 사흘 보냄)", fx: { food: 10, lend: 2 }, text: "쌀가마가 내려졌다. 끌려가는 두 사람의 뒷모습이 무겁다." },
        { label: "거절한다", fx: { hope: 3 }, text: "도윤은 웃으며 배를 돌렸다. “굶어 보면 생각이 바뀔 거야.”" },
        { label: "장부로 협박해 쌀만 받는다", fx: { food: 12, hope: 6 }, text: "도윤의 얼굴이 하얘졌다. 쌀만 내려놓고 도망치듯 떠났다.", need: { ledger: true } },
      ] },
    { id: "argue", text: "{who}와(과) {who2}이(가) 마지막 담요 한 장을 두고 주먹다짐을 벌였다.", cast: "two",
      choices: [
        { label: "{who} 편을 든다", fx: { castStress: -10, cast2Stress: 25 }, text: "{who2}이(가) 이를 갈며 구석으로 갔다." },
        { label: "{who2} 편을 든다", fx: { castStress: 25, cast2Stress: -10 }, text: "{who}이(가) 당신을 노려봤다." },
        { label: "담요를 태워 다 같이 불을 쬔다 (땔감 대신)", fx: { wood: 1, hope: 3 }, text: "다들 어이없어 웃었다. 그날 밤은 조금 따뜻했다." },
      ] },
    { id: "swim", text: "{who}이(가) 헤엄쳐 건너편 마을에 도움을 청하겠다고 한다. 물살이 거세다.", cast: "brave",
      choices: [
        { label: "보낸다", fx: { swim: true }, text: "{who}이(가) 물에 뛰어들었다." },
        { label: "말린다", fx: { hope: -2 }, text: "{who}은(는) 분하다는 듯 주먹을 쥐었다." },
      ] },
    { id: "despair", text: "{who}이(가) 밤새 울었다. “우린 다 죽을 거야.” 다른 사람들도 흔들린다.", cast: "stressed",
      choices: [
        { label: "곁에 앉아 이야기를 들어 준다", fx: { castStress: -40 }, text: "{who}이(가) 겨우 잠들었다." },
        { label: "다 같이 노래를 부른다", fx: { hope: 6, allStress: -10 }, text: "순덕 할머니가 첫 소절을 시작했다." },
        { label: "입 다물라고 한다", fx: { hope: -5, castStress: 15 }, text: "울음소리는 멈췄다. 공기가 차갑게 식었다." },
      ] },
    { id: "law_order", text: "배급 순서를 정해야 한다는 말이 나왔다. 누구부터 먹일까.",
      choices: [
        { label: "일하는 사람부터 (식량 절약, 희망 −)", fx: { law: "workers", hope: -6 }, text: "효율적이다. 아이와 노인의 눈빛이 어둡다." },
        { label: "아이와 노인부터 (희망 +, 식량 더 듦)", fx: { law: "weak", hope: 6 }, text: "사람들이 고개를 끄덕였다. 쌀통은 빨리 빈다." },
      ] },
    { id: "haejin", text: "강해진이 밤마다 몰래 나간다는 말이 돈다. 도윤에게 우리 사정을 흘리는 걸까.", need: "haejin",
      choices: [
        { label: "몰래 뒤를 밟는다 (눈치 판정)", fx: { spy: true }, text: "" },
        { label: "모두 앞에서 따진다", fx: { hope: -3, stress: { haejin: 20 } }, text: "강해진은 펄쩍 뛰었다. 진실은 알 수 없다." },
        { label: "믿고 넘어간다", fx: { trustHaejin: true }, text: "강해진이 어색하게 웃었다." },
      ] },
  ];
  const endings = {
    all: { title: "아무도 버리지 않았다", icon: "🕊", text: "구조선이 왔을 때, 모두가 함께였다." },
    most: { title: "살아남은 사람들", icon: "⛵", text: "구조선에 오르며 누군가는 뒤를 돌아봤다. 빈자리가 있었다." },
    few: { title: "물이 빠진 뒤의 침묵", icon: "🕯", text: "살아남은 자들은 그 겨울 이야기를 하지 않는다." },
    riot: { title: "폭동", icon: "🔥", text: "희망이 꺼진 밤, 사람들이 당신을 끌어내렸다." },
    lost: { title: "아무도 남지 않았다", icon: "🌊", text: "물은 모든 것을 삼켰다." },
  };
  const api = { stats, people, child, jobs, rations, hpNames, places, scenes, events, endings };
  if (typeof module !== "undefined") module.exports = api;
  root.SurviveData = api;
})(globalThis);
