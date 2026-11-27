"use strict";
// 「남행」 여정 콘텐츠 1단계. 극 빙하기: 한 사람이 설원을 건너 남쪽으로 간다.
// 장면 글의 {c1} 첫 동행 · {traitor} 배신자 · {kin} 숨은 혈육 · {food} 식량 · {debts} 빚 장부가 모인 문단
(function (root) {
  // ── 물건 (가방 8칸. key는 버릴 수 없다) ──
  const items = {
    rope: { name: "밧줄", kind: "도구", desc: "건너기·내려가기·묶기" },
    knife: { name: "칼", kind: "무기", desc: "몸싸움 +2", uses: 6 },
    lamp: { name: "등불", kind: "도구", desc: "어둠을 살핀다. 기름이 닳는다", uses: 5 },
    crowbar: { name: "쇠지레", kind: "도구", desc: "문·잔해를 연다" },
    lighter: { name: "라이터", kind: "도구", desc: "불을 붙인다. 야영 때 불이 쉽다", uses: 8 },
    rifle: { name: "사냥총", kind: "무기", desc: "쏘면 끝난다. 소리도 끝난다", uses: 3 },
    furcoat: { name: "털옷", kind: "방한", desc: "체온이 덜 떨어진다" },
    snowshoe: { name: "설피", kind: "방한", desc: "눈길이 빠르다. 하루를 번다" },
    bandage: { name: "붕대", kind: "의료", desc: "상처 한 단계", use: { heal: 1 } },
    antibiotics: { name: "항생제", kind: "의료", desc: "위독도 되돌린다", use: { heal: 2 } },
    alcohol: { name: "알코올", kind: "의료", desc: "소독. 붕대와 함께 쓰면 확실하다", use: { heal: 1 } },
    liquor: { name: "술", kind: "교환품", desc: "누군가의 입을 연다" },
    cigarettes: { name: "담배", kind: "교환품", desc: "이 설원에서 돈 대신 쓴다" },
    gold_ring: { name: "금반지", kind: "교환품", desc: "누구의 것이었을까" },
    battery: { name: "배터리", kind: "교환품", desc: "무전기를 살린다" },
    cloth: { name: "천 조각", kind: "재료", desc: "붕대·횃불 재료" },
    scrap: { name: "고철", kind: "재료", desc: "덫·수리 재료" },
    radio: { name: "휴대 무전기", kind: "단서", key: true, desc: "잡음 사이로 목소리가 들린다" },
    soi_photo: { name: "소이의 사진", kind: "단서", key: true, desc: "빨간 털모자를 쓴 아이" },
    wolf_token: { name: "늑대 이빨 표식", kind: "단서", key: true, desc: "늑대단의 통행증. 들키면 끝이다" },
    route_map: { name: "노선도", kind: "단서", key: true, desc: "하얀나루역까지의 길" },
    refuge_note: { name: "피난처 쪽지", kind: "단서", key: true, desc: "‘김이 오르는 계곡, 돌담 너머’" },
    passenger_list: { name: "탑승 명단", kind: "단서", key: true, desc: "열차는 명단에 있는 사람만 태운다" },
    tape: { name: "녹음 테이프", kind: "단서", key: true, desc: "날짜가 3년 전으로 적혀 있다" },
    crew_diary: { name: "대원 일기", kind: "단서", key: true, desc: "‘우린 셋으로 갈라졌다’" },
  };
  // 만들기 (야영)
  const recipes = [
    { id: "bandage", from: ["cloth"], make: "bandage", name: "천을 찢어 붕대를 만든다" },
    { id: "torch", from: ["cloth", "scrap"], make: "lamp", name: "고철과 천으로 횃불 등을 만든다" },
  ];

  // ── 출신 ──
  const origins = {
    parent: {
      name: "딸을 찾는 부모", short: "부모", stats: { force: 1, wits: 2, talk: 2, craft: 1 },
      start: "base", items: ["radio", "soi_photo", "lamp"], food: 6, fuel: 3,
      pitch: "무전기에서 남쪽에 있는 딸의 목소리를 들었다.",
      intro: [
        "사흘째, 무전기는 같은 시간에 같은 잡음을 낸다. 그리고 그 사이로, 목소리.",
        "“아빠… 하얀나루… 기다릴게.”",
        "소이는 아홉 살이다. 마지막으로 본 건 세 번의 겨울 전이다. 당신은 기지의 문을 연다. 남쪽으로.",
      ],
      premises: ["hidden_kin", "betrayal", "false_salvation"],
    },
    deserter: {
      name: "늑대단을 탈출한 사람", short: "탈출자", stats: { force: 2, wits: 2, talk: 1, craft: 1 },
      start: "outskirts", items: ["knife", "wolf_token"], food: 5, fuel: 2,
      pitch: "백곰의 곁에서 3년. 그가 한 일을 보고 도망쳤다.",
      intro: [
        "등 뒤에서 늑대단 캠프의 불빛이 흔들린다. 개들이 짖기 시작했다.",
        "3년 동안 백곰의 오른손이었다. 그날 밤 철창 안에서 본 것을, 당신은 잊지 못한다.",
        "목에 걸린 늑대 이빨이 무겁다. 이것이 당신을 살릴 수도, 죽일 수도 있다. 남쪽으로 뛴다.",
      ],
      premises: ["hidden_kin", "betrayal", "false_salvation"],
    },
    drifter: {
      name: "이름 없는 떠돌이", short: "떠돌이", stats: { force: 1, wits: 2, talk: 1, craft: 2 },
      start: "base", items: [], randomItems: 3, food: 5, fuel: 2,
      pitch: "이유는 없다. 그냥 살아남는다.",
      intro: [
        "이름을 부를 사람이 없어진 지 오래다.",
        "남쪽에 열차가 온다는 소문을 들었다. 믿지는 않는다. 그래도 여기 있으면 죽는다는 건 안다.",
        "당신은 걷기 시작한다. 이유는 걷다 보면 생길지도 모른다.",
      ],
      premises: ["betrayal", "false_salvation"],
    },
  };

  // ── 인물 ──
  const people = {
    maru: { name: "마루", role: "사냥꾼", stats: { force: 3, wits: 2, talk: 0, craft: 1 }, art: "hunter", bio: "말이 적은 거구. 백곰 이야기에 얼굴이 굳는다.", perk: "hunt", perkText: "야영 때 사냥해 식량을 구해 온다",
      talk: ["“…불 꺼지지 않게 해.”", "마루가 칼을 갈며 말했다. “동생이 있었어. 백곰이 눈밭에 버렸지.”", "“네가 왜 남쪽으로 가는지 이제 알 것 같아.”"] },
    hanbyeol: { name: "한별", role: "조종사", stats: { force: 1, wits: 2, talk: 1, craft: 3 }, art: "pilot", bio: "추락한 수송기에서 걸어 나왔다. 다시 날고 싶어 한다.", perk: "fire", perkText: "고철로 난로를 만들어 연료를 아낀다",
      talk: ["“하늘에서 보면 이 설원도 꽤 예뻤어요.”", "한별이 별을 가리켰다. “저게 남쪽이에요. 나침반보다 정확해요.”", "“…같이 가 줘서 고마워요. 혼자였으면 벌써 멈췄을 거예요.”"] },
    hyean: { name: "혜안", role: "스님", stats: { force: 0, wits: 2, talk: 3, craft: 1 }, art: "monk", bio: "누구도 원망하지 않는다. 그래서 가끔 무섭다.", perk: "heal", perkText: "밤새 다친 사람을 돌본다",
      talk: ["“배고프면 화가 납니다. 먼저 드세요.”", "혜안이 불을 보며 말했다. “늑대단 사람들도 처음엔 우리 같았을 겁니다.”", "“당신이 누구를 두고 왔는지 압니다. 그래도 당신은 나쁜 사람이 아닙니다.”"] },
    eunseo: { name: "은서", role: "기상학자", stats: { force: 0, wits: 3, talk: 2, craft: 1 }, art: "meteorologist", bio: "바람을 읽는다. 기지 대원들을 알았다.", perk: "shelter", perkText: "바람을 피할 자리를 찾아 체온을 지킨다",
      talk: ["“내일 바람이 바뀌어요. 일찍 출발해요.”", "은서가 낮게 말했다. “기지 대원들… 제가 마지막으로 무전을 받았어요. 셋으로 갈라졌다고.”", "“열차가 정말 오면, 그다음엔 뭘 하고 싶어요?”"] },
  };
  // 조연 (이름만 쓰고, 배역은 감독이 정한다)
  const cast = {
    gu: { name: "구씨", role: "떠돌이 상인" },
    stationmaster: { name: "역장 노인", role: "하얀나루역 역장" },
    dochi: { name: "도치", role: "사슬 소년" },
    baekgom: { name: "백곰", role: "늑대단 두목" },
    soi: { name: "소이", role: "딸" },
  };

  const S = (text, choices) => ({ text, choices });
  const C = (label, o = {}) => ({ label, ...o });

  // ── 장소 ──
  const places = {
    base: { act: 0, name: "연구 기지", art: "start_base", fb: "shelter" },
    outskirts: { act: 0, name: "늑대단 캠프 밖 눈밭", art: "start_outskirts", fb: "camp" },
    frozen_village: { act: 1, name: "얼어붙은 마을", art: "frozen_village", fb: "village", ev: "p_village" },
    abandoned_church: { act: 1, name: "버려진 교회", art: "abandoned_church", fb: "village", ev: "p_church" },
    ice_cave: { act: 1, name: "빙하 동굴", art: "ice_cave", fb: "cave", ev: "p_cave" },
    hunter_cabin: { act: 1, name: "사냥꾼 오두막", art: "hunter_cabin", fb: "village", ev: "p_cabin" },
    observatory: { act: 1, name: "관측소", art: "observatory", fb: "station", ev: "p_observatory" },
    pylon_road: { act: 1, name: "송전탑 길", art: "pylon_road", fb: "night", ev: "p_pylon" },
    buried_highway: { act: 1, name: "눈에 묻힌 고속도로", art: "buried_highway", fb: "plane", ev: "p_highway" },
    gate_bridge: { act: 1, gate: true, name: "무너진 다리", art: "gate_bridge", fb: "threat_hit", ev: "g_bridge" },
    merchant_sled: { act: 2, name: "상인의 썰매", art: "merchant_sled", fb: "camp", ev: "p_merchant" },
    wolf_outpost: { act: 2, name: "늑대단 전초", art: "wolf_outpost", fb: "camp", ev: "p_outpost" },
    abandoned_mine: { act: 2, name: "버려진 탄광", art: "abandoned_mine", fb: "cave", ev: "p_mine" },
    crew_lastcamp: { act: 2, name: "대원의 마지막 야영지", art: "crew_lastcamp", fb: "station", ev: "p_lastcamp" },
    wolf_kennel: { act: 2, name: "늑대단 개 우리", art: "wolf_kennel", fb: "camp", ev: "p_kennel" },
    frozen_lake: { act: 2, name: "얼어붙은 호수", art: "frozen_lake", fb: "night", ev: "p_lake" },
    wolf_camp: { act: 2, name: "늑대단 캠프", art: "wolf_camp", fb: "camp", ev: "p_wolfcamp" },
    gate_checkpoint: { act: 2, gate: true, name: "늑대단 검문소", art: "gate_checkpoint", fb: "rival_r3", ev: "g_checkpoint" },
    mountain_pass: { act: 3, gate: true, name: "산길", art: "mountain_pass", fb: "f_cross", ev: "g_pass" },
    station_whiteferry: { act: 3, dest: "station", name: "하얀나루역", art: "station_whiteferry", fb: "f_train", ev: "d_station" },
    geothermal_valley: { act: 3, dest: "valley", name: "지열 계곡", art: "geothermal_valley", fb: "act3", ev: "d_valley" },
    return_road: { act: 3, dest: "return", name: "기지로 돌아가는 길", art: "return_road", fb: "act1", ev: "d_return" },
  };

  // ── 장소 사건 ──
  const events = {
    // 1막
    p_village: { scenes: {
      start: S("지붕까지 눈에 묻힌 마을. 굴뚝 하나에서만 가는 연기가 오른다. 문을 두드리자 한참 뒤에야 빗장이 풀린다. 낡은 철도 제복 모자를 쓴 노인이 서 있다. 볼이 움푹 꺼졌다.", [
        C("가진 식량을 조금 나눈다 ({food} 1)", { req: { food: 1 }, fx: { food: -1, human: 5, debt: { id: "stationmaster", good: true, text: "굶던 역장 노인에게 식량을 나눴다" } }, go: "shared" }),
        C("하얀나루역을 아느냐고 묻는다", { check: ["talk", 11], win: { t: "노인의 눈이 잠깐 빛났다. “내가 거기 역장이었소. 선로는 남동쪽, 송전탑을 따라가시오.”", fx: { fact: "route_hint" } }, lose: { t: "노인은 고개만 저었다. 문이 닫혔다." } }),
        C("노인을 밀치고 집 안을 뒤진다", { check: ["force", 8], win: { t: "찬장에 통조림 둘. 노인은 벽에 기대 아무 말도 하지 않았다.", fx: { food: 2, human: -10, debt: { id: "stationmaster", text: "역장 노인의 마지막 식량을 빼앗았다" } } }, lose: { t: "노인이 지팡이를 휘둘렀다. 생각보다 셌다.", fx: { hp: 1 } } }),
      ]),
      shared: S("노인이 통조림을 두 손으로 받았다. 한참을 말없이 있다가, 철도 지도 한 장을 꺼냈다. “하얀나루역. 내가 거기 역장이었소. 손자 녀석이 남쪽 어딘가에 있을 거요. 혹시 보거든…”", [
        C("지도를 받는다", { fx: { item: "route_map", fact: "route_hint" } }),
      ]),
    } },
    p_church: { scenes: {
      start: S("종탑이 기운 시골 교회. 깨진 창으로 눈이 들이쳐 신도석 위에 쌓였다. 제단 앞에 작은 촛불 하나. 그 옆에 승복 위로 털옷을 껴입은 사람이 앉아 염불을 외고 있다.", [
        C("곁에 앉아 기다린다", { t: "염불이 끝나자 그가 눈을 떴다. “혜안이라 합니다. 남쪽으로 가십니까. 저도 그쪽입니다.”", go: "join" }),
        C("제단 뒤를 뒤진다", { check: ["wits", 10], win: { t: "제단 밑 상자에 촛대와 천 조각, 그리고 금반지 하나. 누군가 헌금으로 바친 것.", fx: { item: ["cloth", "gold_ring"], human: -3 } }, lose: { t: "아무것도 없었다. 그가 눈을 감은 채 말했다. “찾는 건 거기 없습니다.”" } }),
      ]),
      join: S("혜안이 촛불을 끄고 일어선다. “걸음이 느려도 괜찮으시다면.”", [
        C("함께 가자고 한다", { fx: { join: "hyean" } }),
        C("혼자가 낫다", { t: "혜안은 고개를 숙였다. “부처님이 길을 비추시길.”" }),
      ]),
    } },
    p_cave: { scenes: {
      start: S("푸른 얼음 벽이 등불 빛을 삼킨다. 동굴 깊은 곳 얼음 속에 드럼통 세 개가 박혀 있다. 그리고 그 옆 바닥에, 무언가 뜯다 만 것과 거대한 발자국.", [
        C("얼음을 깨서 연료를 꺼낸다", { check: ["force", 12], win: { t: "얼음이 갈라지며 드럼 하나가 빠져나왔다. 동굴 안쪽에서 낮은 숨소리가 멈췄다. 서둘러 나왔다.", fx: { fuel: 3 } }, lose: { t: "얼음 파편이 튀었다. 안쪽에서 무언가 일어섰다. 뛰었다.", fx: { hp: 1, fuel: 1 } } }),
        C("[등불] 발자국을 비춰 살핀다", { req: { item: "lamp" }, check: ["wits", 9], win: { t: "늙은 곰이 잠들어 있다. 반대쪽 틈으로 돌아 드럼 둘을 굴려 냈다.", fx: { fuel: 4 } }, lose: { t: "곰이 눈을 떴다. 등불을 던지고 도망쳤다.", fx: { take: "lamp" } } }),
        C("그냥 나간다", { t: "입구에서 고드름 몇 개를 녹여 물을 채웠다. 그게 다였다." }),
      ]),
    } },
    p_cabin: { scenes: {
      start: S("숲속 통나무 오두막. 처마에 언 짐승 가죽이 매달려 있다. 문을 열기도 전에 총구가 창틈으로 나온다. “거기 서.” 낮고 짧은 목소리.", [
        C("두 손을 들고 남쪽으로 간다고 말한다", { check: ["talk", 10], win: { t: "총구가 내려갔다. 거구의 사내가 문을 열었다. “마루다. …남쪽에 열차가 온다는 거, 정말이야?”", go: "join" }, lose: { t: "총성이 귓가를 스쳤다. 물러났다.", fx: { stress: 10 } } }),
        C("[늑대 이빨 표식] 표식을 보여 준다", { req: { item: "wolf_token" }, t: "사내의 눈빛이 바뀌었다. “늑대단이군.” 총구가 이마를 향했다. “백곰한테 전해. 마루가 아직 살아 있다고.” 문이 쾅 닫혔다.", fx: { stress: 15, fact: "maru_hates" } }),
        C("오두막을 돌아 장작더미를 뒤진다", { check: ["wits", 12], win: { t: "장작 밑에 말린 고기 꾸러미. 들키기 전에 빠졌다.", fx: { food: 2, human: -3 } }, lose: { t: "개가 짖었다. 총알이 눈을 튀겼다.", fx: { hp: 1 } } }),
      ]),
      join: S("마루가 가죽을 걷으며 말한다. “나도 갈 데가 있어. 길은 내가 안다.”", [
        C("함께 가자", { fx: { join: "maru" } }),
        C("각자 가자", { t: "마루는 어깨를 으쓱했다. “살아 있으면 또 보겠지.”" }),
      ]),
    } },
    p_observatory: { scenes: {
      start: S("언덕 위 관측소. 얼어붙은 안테나 숲 사이로 불빛 하나. 안에서 누군가 기압계를 두드리고 있다. 여자가 돌아본다. 안경에 성에가 끼었다. “…사람이네요. 진짜 사람.”", [
        C("기지에서 왔다고 말한다", { t: "“기지요?” 그녀가 숨을 삼켰다. “은서예요. 거기 대원들 마지막 무전을 제가 받았어요. 셋으로 갈라졌다고…” 그녀가 낡은 공책을 내밀었다.", fx: { item: "crew_diary", fact: "crew_split" }, go: "join" }),
        C("기상 기록을 같이 본다", { check: ["wits", 11], win: { t: "다음 눈보라는 사흘 뒤. 은서가 고개를 끄덕였다. “당신, 바람을 읽을 줄 아네요.”", fx: { fact: "storm_known" }, go: "join" }, lose: { t: "숫자들이 눈앞에서 흩어졌다.", go: "join" } }),
      ]),
      join: S("은서가 배낭을 챙긴다. “여기 있다간 다음 눈보라에 묻혀요. 같이 가도 될까요?”", [
        C("같이 가자", { fx: { join: "eunseo" } }),
        C("미안하다", { t: "은서는 웃으려 했다. 잘 되지 않았다." }),
      ]),
    } },
    p_pylon: { scenes: {
      start: S("끝없이 이어지는 송전탑 줄. 탑 하나 아래에 개 여섯 마리가 끄는 큰 썰매가 서 있다. 개털 모자를 쓴 사내가 금니를 드러내며 웃는다. “손님! 이 설원에 물건 파는 놈은 나 구씨뿐이야. 외상도 돼.”", [
        C("외상으로 붕대와 밧줄을 받는다", { fx: { item: ["bandage", "rope"], debt: { id: "gu", text: "상인 구씨에게 외상을 졌다", owe: true } }, t: "구씨가 장부에 무언가를 적었다. “다음에 꼭 갚아. 난 잊지 않거든.”" }),
        C("[금반지] 반지를 주고 털옷을 산다", { req: { item: "gold_ring" }, fx: { take: "gold_ring", item: "furcoat" }, t: "구씨가 반지를 깨물어 보고 웃었다. 털옷은 아직 따뜻했다." }),
        C("썰매의 짐을 슬쩍 본다", { check: ["wits", 12], win: { t: "짐 사이로 얼핏, 사슬과 아이 신발 한 짝. 구씨가 방수포를 덮었다. “구경은 공짜 아니야.”", fx: { fact: "gu_chains", clue: "fs" } }, lose: { t: "구씨의 눈이 가늘어졌다. “손 조심해.”" } }),
        C("그냥 지나간다", { t: "“남쪽에서 또 보자고!” 구씨의 웃음이 바람에 섞였다." }),
      ]),
    } },
    p_highway: { scenes: {
      start: S("눈에 묻힌 고속도로. 지붕만 보이는 차들이 줄지어 있다. 그 끝, 비스듬히 박힌 수송기 꼬리날개 옆에서 누군가 연기를 피운다. 조종복 위에 담요를 두른 여자.", [
        C("다가가 말을 건다", { t: "“한별이에요. 저 비행기, 제 거였어요.” 그녀가 웃었다. 슬픈 웃음이었다. “남쪽으로 가요? 저도요.”", go: "join" }),
        C("차 지붕을 깨고 안을 뒤진다", { check: ["force", 10], win: { t: "트렁크에서 담배 한 보루와 배터리. 차 안의 사람은 보지 않으려 했다.", fx: { item: ["cigarettes", "battery"], stress: 5 } }, lose: { t: "유리 파편에 손이 찢어졌다.", fx: { hp: 1 } } }),
      ]),
      join: S("한별이 수송기를 돌아본다. “저건 다시 못 날아요. 그러니까 걸어야죠.”", [
        C("같이 가자", { fx: { join: "hanbyeol" } }),
        C("혼자 가겠다", { t: "“조심해요. 하늘에서 보면 이 길, 끝이 없었어요.”" }),
      ]),
    } },
    g_bridge: { scenes: {
      start: S("강 위 철교의 가운데가 끊겼다. 아래는 얼어붙은 강, 군데군데 검은 물이 숨 쉰다. 건너지 못하면 남쪽은 없다. 바람이 철골 사이로 운다.", [
        C("[밧줄] 끊긴 철골에 밧줄을 걸고 건넌다", { req: { item: "rope" }, check: ["force", 9], win: { t: "밧줄이 비명을 질렀지만 버텼다. 건넜다." }, lose: { t: "중간에 손이 미끄러졌다. 겨우 매달려 건넜다.", fx: { hp: 1 } } }),
        C("[마루와 함께] 마루가 아는 사냥길로 돈다", { req: { companion: "maru" }, t: "마루가 상류 쪽 바위를 가리켰다. 짐승만 다니는 길. 반나절이 더 걸렸지만 아무도 다치지 않았다.", fx: { day: 1 } }),
        C("얼음 강을 걸어서 건넌다", { check: ["wits", 13], win: { t: "얼음이 울 때마다 멈췄다. 건넜다." }, lose: { t: "얼음이 꺼졌다. 허리까지 빠졌다. 옷이 그대로 얼었다.", fx: { hp: 1, cold: 2 } } }),
        C("하류로 돌아간다 (하루가 걸린다)", { t: "끊긴 다리가 시야에서 사라질 때까지 걸었다. 하루를 잃었다.", fx: { day: 1 } }),
      ]),
    } },
    // 2막
    p_merchant: { scenes: {
      start: S("구씨의 썰매가 바람막이 바위 뒤에 서 있다. 등불 아래 물건들이 펼쳐져 있다. 구씨가 장부를 펼친다. “오, 손님. {gu_line}”", [
        C("[외상을 갚는다: 담배] 담배로 빚을 갚는다", { req: { item: "cigarettes", fact: "owe_gu" }, fx: { take: "cigarettes", unfact: "owe_gu", debt: { id: "gu", good: true, text: "구씨에게 빚을 갚았다" } }, t: "구씨가 담배를 받아 냄새를 맡았다. “장사는 신용이지.”" }),
        C("물건을 산다 (식량 2 → 항생제)", { req: { food: 2 }, fx: { food: -2, item: "antibiotics" }, t: "구씨가 항생제 병을 흔들었다. “남쪽에선 이게 금이야.”" }),
        C("피난처 이야기를 묻는다", { check: ["talk", 11], win: { t: "구씨가 목소리를 낮췄다. “김이 오르는 계곡. 돌담 너머. 거기선 아무도 안 굶어.” 그가 쪽지 한 장을 건넸다.", fx: { item: "refuge_note", fact: "refuge_known" } }, lose: { t: "“정보는 공짜가 아니야.” 구씨가 웃었다." } }),
        C("빚을 떼먹고 지나간다", { req: { fact: "owe_gu" }, t: "구씨의 웃음이 사라졌다. “그래. 기억해 두지.”", fx: { debt: { id: "gu", text: "구씨의 빚을 떼먹었다" }, human: -5 } }),
      ]),
    } },
    p_outpost: { scenes: {
      start: S("늑대 머리뼈를 꽂은 말뚝 울타리. 감시탑 위에서 보초가 하품한다. 울타리 안쪽 창고에서 고기 냄새가 난다.", [
        C("밤을 기다려 창고에 숨어든다", { check: ["wits", 13], win: { t: "고기 자루를 메고 같은 길로 빠져나왔다. 보초는 여전히 하품했다.", fx: { food: 4, wolves: -1 } }, lose: { t: "개가 짖었다. 화살이 어깨를 스쳤다.", fx: { hp: 1, wolves: -1 } } }),
        C("[늑대 이빨 표식] 표식을 보이고 들어간다", { req: { item: "wolf_token" }, check: ["talk", 10], win: { t: "보초가 고개를 끄덕였다. 창고지기가 고기를 나눠 줬다. “백곰이 너를 찾던데.”", fx: { food: 3, fact: "baekgom_hunting" } }, lose: { t: "보초가 당신 얼굴을 알아봤다. 뛰었다.", fx: { hp: 1, wolves: -1, fact: "baekgom_hunting" } } }),
        C("보초를 덮친다", { check: ["force", 14], win: { t: "보초가 쓰러졌다. 창고를 털었다. 늑대단이 이 일을 잊지 않을 것이다.", fx: { food: 5, wolves: -2, human: -5, debt: { id: "guard", text: "늑대단 보초를 쓰러뜨렸다" } } }, lose: { t: "보초가 먼저 칼을 뽑았다.", fx: { hp: 2 } } }),
        C("멀리 돌아간다", { t: "울타리를 크게 돌았다. 고기 냄새가 오래 따라왔다." }),
      ]),
    } },
    p_mine: { scenes: {
      start: S("산비탈의 탄광 입구. 녹슨 레일 위에 광차 하나. 안쪽 깊은 곳에서 망치 소리가 규칙적으로 울린다. 누군가 아직 일하고 있다.", [
        C("소리를 따라 들어간다", { check: ["wits", 11], win: { t: "늙은 광부 셋이 갱도 안에 마을을 꾸리고 있었다. 석탄 한 자루와 고철을 나눠 줬다. “남쪽? 역장 영감 손자가 그쪽 길 표식을 남겼다더군.”", fx: { fuel: 3, item: "scrap", fact: "grandson_sign" } }, lose: { t: "갱도가 갈라졌다. 돌이 쏟아졌다.", fx: { hp: 1 } } }),
        C("광차를 뒤진다", { t: "녹슨 연장과 천 조각. 쓸 만하다.", fx: { item: ["scrap", "cloth"] } }),
      ]),
    } },
    p_lastcamp: { scenes: {
      start: S("쓰러진 텐트들. 눈에 반쯤 묻힌 장비에 파란 번호 패치가 붙어 있다. 기지 대원들이다. 셋이 서로 등을 기댄 채 얼어 있다. 하나의 품에 무언가가 있다.", [
        C("품속을 살핀다", { t: "녹음 테이프 한 개. 겉에 3년 전 날짜와 ‘소이—아빠에게’라는 글씨. 그리고 일기의 마지막 장. ‘명단에 없는 사람은 태우지 않는다. 그래서 우린 명단을 훔쳤다.’", fx: { item: "tape", fact: "tape_found", clue: "hk" } }),
        C("묻어 주고 떠난다", { t: "언 땅을 오래 팠다. 셋의 이름을 불러 주었다.", fx: { human: 5, stress: -5 } }),
      ]),
    } },
    p_kennel: { scenes: {
      start: S("늑대단 개 우리 옆 기둥에 사슬이 매달려 있다. 사슬 끝에 맨발의 소년. 열두 살쯤. 소년이 고개를 든다. 소리를 지르지 않는다. 그저 쳐다본다.", [
        C("사슬을 끊는다", { check: ["craft", 12], win: { t: "사슬이 끊어지는 소리가 너무 컸다. 소년을 업고 뛰었다. 소년이 귓가에 속삭였다. “도치예요.”", fx: { fact: "dochi_saved", human: 8, wolves: -1, debt: { id: "dochi", good: true, text: "사슬에 묶인 소년 도치를 구했다" } } }, lose: { t: "개들이 깼다. 소년을 두고 도망쳤다. 소년은 울지 않았다.", fx: { debt: { id: "dochi", text: "사슬에 묶인 소년을 두고 도망쳤다" } } } }),
        C("[쇠지레] 자물쇠를 비튼다", { req: { item: "crowbar" }, t: "자물쇠가 툭 떨어졌다. 소년이 일어섰다. “…도치예요.” 개들은 끝까지 깨지 않았다.", fx: { fact: "dochi_saved", human: 8, debt: { id: "dochi", good: true, text: "사슬에 묶인 소년 도치를 구했다" } } }),
        C("못 본 척 지나간다", { t: "소년의 눈이 등에 박혔다.", fx: { human: -8, debt: { id: "dochi", text: "사슬에 묶인 소년을 못 본 척했다" } } }),
      ]),
    } },
    p_lake: { scenes: {
      start: S("넓은 얼음 호수. 얼음 아래로 검은 물이 흐른다. 건너면 하루를 번다. 돌아가면 안전하다. 멀리 얼음 위에 누군가 쓰러져 있다.", [
        C("얼음 위로 건넌다 (하루를 번다)", { check: ["wits", 12], win: { t: "얼음이 울 때마다 엎드렸다. 건넜다. 쓰러진 사람은 이미 얼어 있었다. 품에서 항생제 한 병.", fx: { day: -1, item: "antibiotics" } }, lose: { t: "얼음이 갈라졌다. 빠졌다. 겨우 기어 나왔다.", fx: { hp: 1, cold: 2 } } }),
        C("호숫가로 돌아간다", { t: "하루 종일 걸었다. 다리가 납덩이 같았다.", fx: { cold: 1 } }),
      ]),
    } },
    p_wolfcamp: { scenes: {
      start: S("늑대단 캠프. 텐트 열두 개가 큰 모닥불을 둘러쌌다. 웃음소리, 고기 냄새. 가장 큰 텐트 앞에 흰 곰 털옷을 입은 거구가 앉아 있다. 백곰이다.", [
        C("정면으로 걸어 들어간다", { check: ["talk", 13], win: { t: "백곰이 웃었다. “배짱 좋군. 앉아.” 고기를 나눠 줬다. “남쪽 열차 말이지. 명단 없인 못 타. 명단은… 내가 갖고 있어.”", fx: { food: 2, wolves: 1, fact: "baekgom_list" } }, lose: { t: "늑대단이 둘러쌌다. 짐을 빼앗기고 쫓겨났다.", fx: { food: -2, wolves: -1 } } }),
        C("멀리서 캠프를 지켜본다", { check: ["wits", 10], win: { t: "백곰이 털옷에 싼 작은 아이를 안고 텐트로 들어갔다. 아이는 기침을 했다.", fx: { fact: "saw_sick_child", clue: "hk" } }, lose: { t: "보초의 눈이 이쪽을 향했다. 물러났다." } }),
      ]),
    } },
    g_checkpoint: { scenes: {
      start: S("협곡 길을 늑대단 검문소가 막았다. 차단봉, 횃불, 늑대 머리뼈. 보초 넷이 썰매마다 짐을 뒤진다. 이곳을 지나야 남쪽 산맥이다. {checkpoint_line}", [
        C("[늑대 이빨 표식] 암호를 대고 지나간다", { req: { item: "wolf_token" }, check: ["talk", 11], win: { t: "보초가 표식을 보고 차단봉을 올렸다. 뒤에서 누군가 이름을 불렀다. 돌아보지 않았다." }, lose: { t: "보초가 표식을 빼앗았다. “백곰이 찾던 놈이다!” 뛰었다.", fx: { take: "wolf_token", hp: 1, wolves: -1 } } }),
        C("[술] 보초에게 술을 건넨다", { req: { item: "liquor" }, fx: { take: "liquor" }, t: "보초들이 병을 돌리는 사이 차단봉 옆을 지났다." }),
        C("[담배] 담배 한 보루를 뇌물로", { req: { item: "cigarettes" }, fx: { take: "cigarettes" }, t: "보초가 담배를 품에 넣고 고개를 돌렸다." }),
        C("밤에 협곡 벽을 타고 넘는다", { check: ["force", 13], win: { t: "얼음 벽을 손톱으로 긁으며 올랐다. 넘었다." }, lose: { t: "떨어졌다. 보초들이 횃불을 들고 왔다. 짐 일부를 버리고 도망쳤다.", fx: { hp: 1, food: -2 } } }),
        C("[도치와 함께 왔다] 도치가 늑대단만 아는 길을 안다", { req: { fact: "dochi_saved" }, t: "도치가 검문소 뒤 개 우리 통로를 가리켰다. 소리 없이 지나갔다." }),
      ]),
    } },
    // 3막
    g_pass: { scenes: {
      start: S("남쪽 산맥의 산길. 한쪽은 낭떠러지, 바람이 칼날 같다. 고개 너머로 세 갈래 길이 보인다. 선로 쪽, 김이 오르는 계곡 쪽, 그리고 왔던 북쪽.", [
        C("바람을 거슬러 넘는다", { check: ["force", 11], win: { t: "고개를 넘었다. 남쪽 하늘이 조금 밝다." }, lose: { t: "돌풍에 넘어졌다. 손가락이 하얗게 얼었다.", fx: { hp: 1, cold: 1 } } }),
        C("[밧줄] 서로를 묶고 넘는다", { req: { item: "rope" }, t: "앞사람의 등만 보며 걸었다. 아무도 놓치지 않았다." }),
      ]),
    } },
    d_station: { climax: "station" },
    d_valley: { climax: "valley" },
    d_return: { climax: "return" },
  };

  // ── 전제 (감독이 판마다 하나를 고른다) ──
  // 박자: plant(단서 3) → complicate → twist(A/B 중 하나) → payoff(절정에서)
  const premises = {
    betrayal: {
      name: "배신", roles: ["traitor"],
      titles: { A: "지켜 준 배신", B: "보이지 않는 손" },
      twistText: { A: "배신자는 우리를 지키려 했다", B: "배신을 시킨 자가 따로 있다" },
      plant: [
        { id: "bt_p1", text: "밤중에 눈을 뜨자 {traitor}이(가) 불가에 없다. 한참 뒤 돌아온 {traitor}의 장갑에 낯선 눈이 묻어 있다.", choices: [
          C("어디 갔었냐고 묻는다", { t: "“볼일.” 짧은 대답. 눈을 마주치지 않는다." }),
          C("발자국을 몰래 따라가 본다", { check: ["wits", 11], win: { t: "발자국은 바위 뒤에서 다른 발자국과 만났다가 돌아왔다. 썰매 자국도 있다.", fx: { clue: "bt" } }, lose: { t: "바람이 발자국을 지웠다." } }),
          C("모른 척 다시 눕는다", { t: "잠이 오지 않았다." }),
        ] },
        { id: "bt_p2", text: "식량 자루가 가볍다. 세어 보니 하나가 모자란다. {traitor}이(가) 먼저 말한다. “쥐가 있나 봐.”", choices: [
          C("“그래, 쥐겠지.”", { t: "{traitor}이(가) 웃었다. 웃음이 조금 늦었다." }),
          C("{traitor}의 짐을 슬쩍 살핀다", { check: ["wits", 12], win: { t: "{traitor}의 짐 바닥에 통조림 하나와, 늑대 이빨이 꿰인 끈. 늑대단의 표식이다.", fx: { clue: "bt" } }, lose: { t: "{traitor}이(가) 돌아봤다. 손을 거뒀다." } }),
        ] },
        { id: "bt_p3", text: "멀리 늑대단 썰매가 지나간다. 다들 엎드렸는데 {traitor}만 그 썰매를 오래 바라본다. 썰매 위에서 누군가 손을 든다.", choices: [
          C("“아는 사람이야?”", { t: "“…아니.” {traitor}의 턱이 굳었다." }),
          C("썰매 위 사람의 얼굴을 기억해 둔다", { check: ["wits", 10], win: { t: "{twist_b_face}", fx: { clue: "bt" } }, lose: { t: "눈보라가 시야를 덮었다." } }),
        ] },
      ],
      complicate: { id: "bt_c", text: "{traitor}이(가) 불가에서 묻는다. “남쪽에 가면… 우리 둘 다 탈 수 있을까. 자리가 하나뿐이면 어떡해?” 대답을 기다리는 눈이 진지하다.", choices: [
        C("“같이 탄다. 무슨 일이 있어도.”", { fx: { trustAll: 1 }, t: "{traitor}이(가) 고개를 숙였다. 뭔가 말하려다 삼켰다." }),
        C("“그때 가서 생각하자.”", { t: "{traitor}은(는) 불만 바라봤다." }),
        C("[단서 2개 이상] “늑대단 표식은 뭐지?”", { req: { clues: 2 }, t: "{traitor}의 얼굴이 하얘졌다. “…다 말할게. 남쪽에 가면.” 이제 당신은 알고 있다.", fx: { fact: "bt_confronted" } }),
      ] },
      twist: {
        A: { id: "bt_tA", text: "새벽. {traitor}이(가) 식량 자루와 함께 사라졌다. 발자국은 늑대단 검문소 쪽으로 이어진다. 그리고 바위 위에 쪽지. ‘검문소에 줄 통행료가 필요했어. 너를 통과시키려고. 미안해. 산길에서 기다릴게.’", choices: [
          C("쪽지를 믿는다", { fx: { fact: "bt_trust_note", food: -2 }, t: "자루가 있던 자리가 비어 있다. 그래도, 믿기로 했다." }),
          C("쪽지를 찢는다", { fx: { food: -2, stress: 15, fact: "bt_hate" }, t: "찢은 종이가 바람에 흩어졌다." }),
        ], onTwist: { leave: "traitor" } },
        B: { id: "bt_tB", text: "새벽. {traitor}이(가) 칼을 겨누고 있다. 손이 떨린다. “미안해. 구씨가… 구씨가 내 동생을 데리고 있어. 너를 늑대단에 넘기면 돌려준대.” 뒤에서 썰매 방울 소리.", choices: [
          C("칼을 쳐내고 달아난다", { check: ["force", 12], win: { t: "칼이 눈 위로 날아갔다. 뛰었다. 뒤에서 {traitor}이(가) 울며 무언가 외쳤다.", fx: { fact: "bt_fled" } }, lose: { t: "칼날이 팔을 그었다. 그래도 뛰었다.", fx: { hp: 1, fact: "bt_fled" } } }),
          C("“같이 네 동생을 찾자.”", { check: ["talk", 12], win: { t: "{traitor}의 칼이 내려갔다. 둘은 썰매 소리를 피해 함께 숨었다. “…구씨가 남쪽 끝에서 기다려.”", fx: { fact: "bt_turned" } }, lose: { t: "{traitor}은(는) 고개를 저으며 뒷걸음질 쳤다. 그리고 사라졌다.", fx: { fact: "bt_fled" } } }),
          C("[단서를 다 모았다] 미리 썰매 길에 함정을 파 두었다", { req: { clues: 3 }, t: "썰매가 함정에 처박혔다. 그 위에 구씨가 있었다. {traitor}이(가) 칼을 떨어뜨렸다. 이제 패는 당신에게 있다.", fx: { fact: "bt_turned", fact2: "gu_caught" } }),
        ], onTwist: { leaveUnless: ["bt_turned"], role: "traitor" } },
      },
      payoff: { id: "bt_pay", text: "{payoff_line}", choices: [
        C("용서한다", { fx: { human: 8, fact: "forgave" }, t: "{traitor}이(가) 무너지듯 울었다. 당신은 그 어깨에 손을 얹었다." }),
        C("대가를 치르게 한다", { fx: { human: -10, fact: "revenge" }, t: "눈 위에 남은 것은 발자국 하나뿐이었다." }),
      ] },
    },
    hidden_kin: {
      name: "숨은 혈육", roles: ["kin"], origins: ["parent", "deserter"],
      titles: { A: "적의 품", B: "지워진 기억" },
      twistText: { A: "적의 품에 혈육이 있다", B: "모른 채 지나친 혈육" },
      byOrigin: {
        // 부모: 혈육 = 딸 소이
        parent: {
          titles: { A: "백곰의 아이", B: "녹음된 목소리" },
          twistText: { A: "백곰의 품의 아이가 딸이었다", B: "딸의 목소리는 3년 전 녹음이었다" },
          plant: [
            { id: "hk_p1", text: "밤마다 무전기를 켠다. 같은 시간, 같은 잡음, 같은 목소리. “아빠… 하얀나루… 기다릴게.” 오늘도 한 글자도 다르지 않다.", choices: [
              C("잡음까지 귀 기울여 듣는다", { check: ["wits", 10], win: { t: "목소리 뒤로 아주 작게, 테이프가 감기는 소리가 섞여 있다. 그리고 그 뒤로, 개 짖는 소리.", fx: { clue: "hk" } }, lose: { t: "목소리만 들렸다. 그걸로 충분했다." } }),
              C("무전기를 끈다. 배터리를 아낀다", { t: "끈 뒤에도 목소리가 귓가에 남았다." }),
            ] },
            { id: "hk_p2", text: "길에서 만난 떠돌이가 소이의 사진을 보더니 멈칫한다. “빨간 털모자… 늑대단 캠프에서 비슷한 애를 봤는데. 백곰이 안고 다니더군.”", choices: [
              C("언제, 어디서였냐고 캐묻는다", { check: ["talk", 10], win: { t: "“한 달 전쯤. 애가 기침을 하더라고. 백곰이 약을 찾아 헤맨대.”", fx: { clue: "hk" } }, lose: { t: "떠돌이는 어깨를 으쓱하고 가 버렸다." } }),
              C("잘못 봤을 거라고 생각한다", { t: "소이는 하얀나루에 있다. 무전이 그렇게 말했다." }),
            ] },
            { id: "hk_p3", text: "모닥불 앞에서 사진을 꺼낸다. 소이의 빨간 털모자. 문득, 무전 속 목소리가 사진 속 소이보다 어리게 들린다는 생각이 든다.", choices: [
              C("그 생각을 붙잡는다", { fx: { clue: "hk" }, t: "세 번의 겨울. 아이의 목소리는 세 번의 겨울 동안 변하지 않을 수 없다." }),
            ] },
          ],
          complicate: { id: "hk_c", text: "늑대단 썰매가 멈췄다. 흰 곰 털옷의 거구가 내린다. 백곰이다. 털옷 안에 작은 아이를 안았다. 아이가 콜록인다. “약. 약 있으면 내놔. 값은 쳐주지.” 털옷 틈으로 빨간 실밥이 보인다.", choices: [
            C("[항생제] 약을 내준다", { req: { item: "antibiotics" }, fx: { take: "antibiotics", fact: "gave_medicine", wolves: 2, human: 6 }, t: "백곰이 약병을 쥐고 오래 서 있었다. “…빚졌다.” 썰매가 떠났다. 아이의 기침 소리가 멀어졌다." }),
            C("줄 것이 없다고 한다", { fx: { fact: "refused_medicine" }, t: "백곰은 아이를 더 꽉 끌어안고 돌아섰다." }),
            C("[단서 2개 이상] 아이의 얼굴을 보여 달라고 한다", { req: { clues: 2 }, fx: { fact: "kin_seen_early" }, t: "털옷이 걷혔다. 빨간 털모자. 당신은 숨을 멈췄다. 아이가 당신을 보고, 천천히 고개를 갸웃했다." }),
          ] },
          twist: {
            A: { id: "hk_tA", text: "늑대단 캠프 가장 큰 텐트. 백곰이 털옷에 싼 아이를 재우고 있다. 아이가 잠결에 중얼거린다. “…아빠.” 백곰이 대답한다. “그래, 아빠 여기 있다.” 빨간 털모자. 소이다.", choices: [
              C("지금 데려간다", { check: ["force", 14], win: { t: "아이를 안고 뛰었다. 등 뒤에서 백곰의 포효가 협곡을 울렸다. 품 안의 소이가 울었다. 당신을 몰라본다.", fx: { fact: "kin_taken", wolves: -3 } }, lose: { t: "늑대단이 막아섰다. 소이는 백곰의 품으로 돌아갔다. 소이가 백곰의 목을 끌어안았다.", fx: { hp: 1, fact: "kin_with_baekgom" } } }),
              C("기다린다. 선로에서 다시 만나자", { fx: { fact: "kin_with_baekgom" }, t: "소이가 백곰의 목을 끌어안고 잠들었다. 당신은 텐트 밖 눈 속에 오래 서 있었다." }),
            ] },
            B: { id: "hk_tB", text: "녹음 테이프를 무전기에 넣고 돌린다. 지지직. “아빠… 하얀나루… 기다릴게.” 무전과 똑같다. 테이프 겉에 적힌 날짜. 세 번의 겨울 전. 누군가 이 테이프를 3년 동안 틀고 있었다.", choices: [
              C("그래도 하얀나루로 간다", { fx: { fact: "kin_voice_real" }, t: "누가 틀고 있는지 알아야 한다. 그 사람은 소이를 안다." }),
              C("주저앉는다", { fx: { stress: 25, fact: "kin_despair" }, t: "한참을 그대로 있었다. 그리고 일어났다. 다른 이유가 필요했다." }),
            ] },
          },
        },
        // 탈출자: 혈육 = 사슬 소년 도치 (죽은 줄 알았던 동생)
        deserter: {
          titles: { A: "사슬의 이름", B: "내가 채운 사슬" },
          twistText: { A: "사슬의 소년은 죽은 줄 알았던 동생이었다", B: "동생에게 사슬을 채운 것은 나였다" },
          plant: [
            { id: "hk_p1", text: "꿈을 꾼다. 3년 전 그날 밤, 철창. 울지 않는 아이. 깨어 보니 휘파람을 불고 있었다. 어릴 적 동생에게 가르쳐 준 노래. 동생은 그 겨울 첫 눈보라에 죽었다.", choices: [
              C("꿈을 떠올려 본다", { check: ["wits", 10], win: { t: "철창 속 아이의 손등에 화상 흉터가 있었다. 동생의 손에도 있던 흉터.", fx: { clue: "hk" } }, lose: { t: "꿈은 흩어졌다." } }),
              C("잊는다", { t: "잊으려 할수록 노래가 맴돌았다." }),
            ] },
            { id: "hk_p2", text: "늑대단 보초 둘이 지나가며 투덜댄다. “그 사슬 꼬마, 또 휘파람 분다. 시끄러워 죽겠어.” 들리는 가락이… 당신의 노래다.", choices: [
              C("숨어서 끝까지 엿듣는다", { check: ["wits", 11], win: { t: "“백곰이 그 꼬마는 절대 풀지 말래. 누구 미끼라나.”", fx: { clue: "hk" } }, lose: { t: "보초들이 멀어졌다." } }),
              C("지나간다", { t: "가락이 바람에 섞여 오래 따라왔다." }),
            ] },
            { id: "hk_p3", text: "쌍둥이가 남긴 쪽지가 길목 나무에 꽂혀 있다. ‘백곰이 말했다. 돌아오면 네 것을 돌려준다고.’ 당신의 것이 뭐가 있었던가.", choices: [
              C("쪽지를 간직한다", { fx: { clue: "hk" }, t: "네 것. 백곰은 당신에게서 무엇을 가져갔나." }),
            ] },
          ],
          complicate: { id: "hk_c", text: "밤, 멀리서 휘파람 소리. 당신의 노래다. 소리는 늑대단 개 우리 쪽에서 난다. 따라가면 위험하다. 따라가지 않으면 평생 모를 것이다.", choices: [
            C("소리를 따라간다", { check: ["wits", 12], win: { t: "우리 너머 사슬 끝에 소년이 웅크려 휘파람을 분다. 손등에 화상 흉터. 숨이 멎었다.", fx: { fact: "kin_seen_early" } }, lose: { t: "개가 짖었다. 물러나야 했다.", fx: { stress: 10 } } }),
            C("휘파람으로 답한다", { fx: { fact: "kin_whistled" }, t: "한참 뒤, 휘파람이 다음 소절로 답했다. 아무도 모르는 소절." }),
          ] },
          twist: {
            A: { id: "hk_tA", text: "사슬의 소년이 당신을 본다. “…형?” 도치. 죽은 줄 알았던 동생. 백곰은 그 눈보라 밤에 도치를 주워 사슬에 묶어 두었다. 언젠가 도망칠 당신을 붙잡을 미끼로.", choices: [
              C("사슬을 끊는다", { check: ["craft", 13], win: { t: "사슬이 끊어졌다. 도치가 당신 목을 끌어안았다. 3년 치의 무게였다.", fx: { fact: "kin_taken", fact2: "dochi_saved", wolves: -2 } }, lose: { t: "늑대단이 왔다. 도치의 손이 손끝에서 미끄러졌다.", fx: { hp: 1, fact: "kin_with_baekgom" } } }),
              C("지금은 못 한다. 반드시 돌아온다", { fx: { fact: "kin_with_baekgom" }, t: "도치가 고개를 끄덕였다. 울지 않았다. 어릴 때부터 그랬다." }),
            ] },
            B: { id: "hk_tB", text: "소년의 손등 흉터를 본 순간 기억이 돌아온다. 3년 전 그날 밤. 백곰이 명령했다. 주운 아이를 묶어라. 사슬을 채운 손은 당신의 손이었다. 당신은 동생인 줄 몰랐다. 도치는 알았다. 그래서 울지 않았다.", choices: [
              C("무릎을 꿇는다", { fx: { fact: "kin_guilt", human: 5, stress: 20 }, t: "도치는 아무 말도 하지 않았다. 그저 당신을 오래 봤다." }),
              C("도망친다", { fx: { fact: "kin_fled", human: -10, stress: 20 }, t: "등 뒤에서 휘파람이 멈췄다." }),
            ] },
          },
        },
      },
      payoff: { id: "hk_pay", text: "{payoff_line}", choices: [
        C("손을 내민다", { fx: { fact: "kin_reunited", human: 5 }, t: "작은 손이 차가웠다. 그리고 꽉 잡아 왔다." }),
        C("고르게 한다", { fx: { fact: "kin_chose", human: 8 }, t: "오래 망설이는 얼굴을, 당신은 기다렸다." }),
      ] },
    },
    false_salvation: {
      name: "거짓 구원", roles: ["savior"],
      titles: { A: "피의 지도", B: "닫힌 문" },
      twistText: { A: "피난처는 늑대단의 덫이다", B: "피난처는 누군가를 내줘야 들어간다" },
      plant: [
        { id: "fs_p1", text: "길가에서 쓰러진 사람을 만났다. 숨이 붙어 있다. “계곡… 피난처… 구씨가 지도를 팔았어. 우리 가족은 먼저…” 말이 끊긴다.", choices: [
          C("가족이 어떻게 됐냐고 묻는다", { check: ["talk", 9], win: { t: "“돌아오지… 않았어. 아무도.” 그의 손에 피 묻은 지도 조각.", fx: { clue: "fs" } }, lose: { t: "그는 다시 눈을 뜨지 않았다." } }),
          C("마지막 물을 먹여 준다", { fx: { human: 4 }, t: "그가 희미하게 웃었다." }),
        ] },
        { id: "fs_p2", text: "피난처로 간다는 사람들의 행렬이 지나간다. 다들 구씨의 지도를 들고 있다. 행렬 끝의 아이가 묻는다. “아저씨도 계곡 가요? 거기 따뜻하대요.”", choices: [
          C("지도를 보여 달라고 한다", { check: ["wits", 11], win: { t: "지도의 길은 늑대단 캠프 바로 옆을 지난다. 이상하다.", fx: { clue: "fs" } }, lose: { t: "어른들이 아이를 끌고 갔다." } }),
          C("조심하라고만 한다", { t: "아이가 손을 흔들었다." }),
        ] },
        { id: "fs_p3", text: "구씨의 썰매 자국을 따라 걷다가, 썰매가 멈췄던 자리에서 얼어붙은 핏자국을 본다. 판자 조각에 손톱자국.", choices: [
          C("자세히 살핀다", { check: ["wits", 9], win: { t: "손톱자국 옆에 작게 새겨진 글자. ‘계곡 아니야’", fx: { clue: "fs" } }, lose: { t: "눈이 덮여 알아볼 수 없었다." } }),
          C("눈을 돌린다", { t: "발걸음이 무거워졌다." }),
        ] },
      ],
      complicate: { id: "fs_c", text: "구씨가 다시 나타났다. “피난처 자리가 거의 찼어. 마지막 지도야. 값은… 네 동행 하나. 일꾼이 필요하대.” 금니가 웃는다.", choices: [
        C("거절한다", { t: "구씨가 어깨를 으쓱했다. “후회할 거야.”" }),
        C("[단서 2개 이상] “핏자국은 뭐지?”", { req: { clues: 2 }, fx: { fact: "fs_confronted" }, t: "구씨의 웃음이 멈췄다. “…알면 다쳐.” 그가 썰매를 돌렸다." }),
        C("가진 것을 주고 지도를 산다", { req: { food: 2 }, fx: { food: -2, item: "refuge_note", fact: "refuge_known" }, t: "구씨가 쪽지를 건넸다. “좋은 선택이야.”" }),
      ] },
      twist: {
        A: { id: "fs_tA", text: "행렬을 따라간 사람들의 비명이 바람을 타고 온다. 계곡 입구라던 곳은 늑대단의 철창 우리였다. 구씨가 늑대단에게서 무언가를 받고 있다. 사람값이다.", choices: [
          C("철창을 열러 간다", { check: ["craft", 13], win: { t: "자물쇠가 떨어졌다. 사람들이 눈밭으로 흩어졌다. 구씨가 당신 얼굴을 봤다.", fx: { fact: "fs_freed", human: 10, wolves: -2 } }, lose: { t: "늑대단이 몰려왔다. 겨우 도망쳤다.", fx: { hp: 1 } } }),
          C("못 본 척 남쪽으로 간다", { fx: { human: -8, fact: "fs_ignored" }, t: "비명이 오래 따라왔다." }),
        ] },
        B: { id: "fs_tB", text: "계곡의 피난처는 진짜였다. 돌담 너머 김이 오른다. 하지만 문지기가 말한다. “규칙은 하나. 들어오려면 한 사람을 밖에 두고 와야 한다. 자리가 없거든.” 구씨는 그걸 알고 지도를 팔았다.", choices: [
          C("그 규칙을 기억해 둔다", { fx: { fact: "fs_rule_known" }, t: "문지기는 웃지 않았다." }),
        ] },
      },
      payoff: { id: "fs_pay", text: "{payoff_line}", choices: [
        C("구씨를 사람들 앞에 세운다", { fx: { fact: "gu_judged", human: 3 }, t: "사람들이 구씨를 둘러쌌다. 금니가 더는 웃지 않았다." }),
        C("구씨를 보내 준다", { fx: { fact: "gu_spared", human: 6 }, t: "구씨는 한 번도 뒤돌아보지 않고 사라졌다." }),
      ] },
    },
  };

  // ── 출신 줄기 (막마다 하나) ──
  const originBeats = {
    parent: {
      1: { id: "o_parent1", text: "마을 어귀, 빨간 털모자를 쓴 아이가 혼자 눈사람을 만들고 있다. 소이와 같은 모자. 아이가 묻는다. “아저씨, 우리 엄마 봤어요?”", choices: [
        C("데려간다", { fx: { fact: "took_child", human: 8, food: -1, debt: { id: "child", good: true, text: "마을에서 혼자인 아이를 데려갔다" } }, t: "아이가 당신 손을 잡았다. 소이의 손보다 조금 컸다." }),
        C("엄마를 찾아 주겠다고 하고 떠난다", { fx: { human: -6, debt: { id: "child", text: "혼자인 아이를 마을에 두고 왔다" } }, t: "아이는 눈사람 옆에 계속 서 있었다." }),
      ] },
      2: { id: "o_parent2", text: "늑대단 보초들이 아이들 명단을 읽고 있다. “열차 자리랑 바꿀 놈들.” 명단 맨 아래 어딘가에 익숙한 이름이 있을지도 모른다.", choices: [
        C("명단을 훔쳐본다", { check: ["wits", 12], win: { t: "{parent_list_line}", fx: { fact: "saw_list" } }, lose: { t: "보초가 고개를 들었다. 물러났다.", fx: { stress: 10 } } }),
        C("보지 않는다. 무섭다", { t: "명단 넘기는 소리가 귀에 남았다." }),
      ] },
    },
    deserter: {
      1: { id: "o_des1", text: "뒤에서 썰매개 방울 소리. 백곰이 보낸 추적자 쌍둥이다. 똑같은 얼굴 둘이 늑대 가죽 두건 아래서 웃는다. “돌아가자. 백곰이 용서해 준대.”", choices: [
        C("숲으로 숨는다", { check: ["wits", 12], win: { t: "눈 속에 엎드려 숨을 죽였다. 방울 소리가 지나갔다.", fx: { fact: "twins_lost" } }, lose: { t: "개가 냄새를 맡았다. 칼부림 끝에 겨우 달아났다.", fx: { hp: 1 } } }),
        C("맞선다", { check: ["force", 13], win: { t: "쌍둥이 하나가 눈밭에 쓰러졌다. 다른 하나가 물러나며 외쳤다. “백곰한테 다 말할 거야!”", fx: { wolves: -2, human: -5, debt: { id: "twins", text: "추적자 쌍둥이 하나를 쓰러뜨렸다" } } }, lose: { t: "둘을 당할 수 없었다. 짐을 버리고 뛰었다.", fx: { hp: 1, food: -1 } } }),
        C("[술] 술을 던져 주고 흥정한다", { req: { item: "liquor" }, fx: { take: "liquor", fact: "twins_bribed" }, t: "쌍둥이가 병을 받았다. “하루. 하루만 못 본 걸로 하지.”" }),
      ] },
      2: { id: "o_des2", text: "늑대단 전초 근처에서 귀 한쪽 없는 사내가 당신을 부른다. 옛 동료다. “살아 있었구나. …널 넘기면 난 자유야. 근데 너도 알지, 그날 철창 안에 뭐가 있었는지.”", choices: [
        C("“같이 가자. 백곰을 떠나.”", { check: ["talk", 12], win: { t: "그가 오래 망설이다 고개를 끄덕였다. 검문소 뒷길 암호를 알려 줬다.", fx: { fact: "comrade_joined", item: "liquor" } }, lose: { t: "그는 고개를 저었다. “난 못 해.” 그리고 돌아섰다." } }),
        C("그를 쓰러뜨리고 간다", { check: ["force", 11], win: { t: "그는 눈 위에 쓰러졌다. 당신의 이름을 마지막으로 불렀다.", fx: { human: -10, debt: { id: "comrade", text: "옛 동료를 쓰러뜨렸다" } } }, lose: { t: "그가 호루라기를 불었다. 뛰었다.", fx: { hp: 1, wolves: -1 } } }),
      ] },
    },
    drifter: {
      1: { id: "o_drift1", text: "다리를 건넌 밤, 불가에서 문득 생각한다. 왜 남쪽으로 가는가. 이유가 없으면 다음 고개에서 멈춰 버릴 것 같다.", choices: [
        C("곁의 사람을 지키기 위해", { fx: { fact: "purpose_protect" }, t: "{c1_or_nobody}" }),
        C("이 설원에서 무슨 일이 있었는지 알기 위해", { fx: { fact: "purpose_truth" }, t: "기지 대원들의 이야기가 마음에 걸렸다. 진실을 알고 싶다." }),
        C("살아남아 부자가 되기 위해", { fx: { fact: "purpose_wealth" }, t: "구씨처럼. 아니, 구씨보다 더." }),
      ] },
      2: { id: "o_drift2", text: "{drift2_text}", choices: [
        C("그 길을 따른다", { fx: { fact: "purpose_kept", human: 3 }, t: "이유가 조금 단단해졌다." }),
        C("이유 따위", { fx: { fact: "purpose_lost", stress: 10 }, t: "다시 아무것도 아닌 사람이 되었다." }),
      ] },
    },
  };

  // ── 절정 (도착지별) ──
  const climax = {
    station: { name: "하얀나루역", art: "climax_tracks", fb: "f_train",
      arrive: "선로가 보인다. 녹슨 승강장 위에 사람들이 모여 있다. 멀리서 기적 소리. 열차가 온다. 서지 않는다. 속도만 늦춘다. 화물칸 문 앞에서 늑대단이 탑승 명단을 들고 이름을 부른다." },
    valley: { name: "지열 계곡", art: "climax_valley", fb: "act3",
      arrive: "눈 사이로 초록 이끼. 김이 오르는 계곡 아래 돌담 마을이 있다. 따뜻한 바람. 돌담 문 앞에 문지기가 서 있고, 그 앞에 사람들이 줄을 섰다." },
    return: { name: "연구 기지", art: "end_spring", fb: "act1",
      arrive: "왔던 길을 되돌아 걸었다. 멀리 눈에 반쯤 묻힌 기지의 돔이 보인다. 이상하게, 집에 돌아온 기분이다." },
  };
  // 결말 (1단계: 7개 + 덮어쓰는 결말)
  const endings = {
    train: { title: "남행 열차", text: "화물칸 문이 닫혔다. 창밖으로 설원이 멀어진다. 바퀴 소리가 심장 소리처럼 규칙적이다." },
    seat: { title: "내 자리를 내준 사람", text: "열차가 떠난다. 승강장에 남은 당신은 화물칸 문틈의 얼굴이 사라질 때까지 손을 흔들었다." },
    refuge: { title: "지열 피난처", text: "돌담 문이 등 뒤에서 닫혔다. 따뜻하다. 너무 따뜻해서, 문밖에 남은 것들을 잊을 수 있을 것 같다." },
    spring: { title: "기지의 봄", text: "처마의 고드름이 처음으로 녹아 떨어졌다. 열차도, 피난처도 없지만, 여기엔 사람이 있다." },
    wolves: { title: "늑대단의 일원", text: "늑대단 썰매 행렬 속에 당신이 있다. 따뜻한 털옷, 배부른 저녁. 그리고 철창 안에서 들려오는 소리." },
    missed: { title: "놓친 열차", text: "선로에 닿았을 때 지평선 끝에 불빛 하나가 사라지고 있었다. 기적 소리만 오래 남았다." },
    frozen: { title: "눈 속에서 잠들다", text: "졸음이 왔다. 이상하게 따뜻했다. 눈이 천천히 당신을 덮었다." },
    inhuman: { title: "사람이 아니게 되어", text: "살아남았다. 그런데 아무도 당신 곁에 앉지 않는다. 당신도 그 이유를 안다." },
  };
  const api = { items, recipes, origins, people, cast, places, events, premises, originBeats, climax, endings };
  root.JourneyContent = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
