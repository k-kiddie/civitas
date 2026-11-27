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
    maru: { name: "마루", role: "사냥꾼", stats: { force: 3, wits: 2, talk: 0, craft: 1 }, art: "hunter", bio: "말이 적은 거구. 백곰 이야기에 얼굴이 굳는다.", appetite: 3, heart: "hard", perk: "hunt", perkText: "야영 때 사냥해 식량을 구해 온다",
      talk: ["“…불 꺼지지 않게 해.”", "마루가 칼을 갈며 말했다. “동생이 있었어. 백곰이 눈밭에 버렸지.”", "“네가 왜 남쪽으로 가는지 이제 알 것 같아.”"] },
    hanbyeol: { name: "한별", role: "조종사", stats: { force: 1, wits: 2, talk: 1, craft: 3 }, art: "pilot", bio: "추락한 수송기에서 걸어 나왔다. 다시 날고 싶어 한다.", heart: "kind", perk: "fire", perkText: "고철로 난로를 만들어 연료를 아낀다",
      talk: ["“하늘에서 보면 이 설원도 꽤 예뻤어요.”", "한별이 별을 가리켰다. “저게 남쪽이에요. 나침반보다 정확해요.”", "“…같이 가 줘서 고마워요. 혼자였으면 벌써 멈췄을 거예요.”"] },
    hyean: { name: "혜안", role: "스님", stats: { force: 0, wits: 2, talk: 3, craft: 1 }, art: "monk", bio: "누구도 원망하지 않는다. 그래서 가끔 무섭다.", appetite: 1, heart: "kind", perk: "heal", perkText: "밤새 다친 사람을 돌본다",
      talk: ["“배고프면 화가 납니다. 먼저 드세요.”", "혜안이 불을 보며 말했다. “늑대단 사람들도 처음엔 우리 같았을 겁니다.”", "“당신이 누구를 두고 왔는지 압니다. 그래도 당신은 나쁜 사람이 아닙니다.”"] },
    eunseo: { name: "은서", role: "기상학자", stats: { force: 0, wits: 3, talk: 2, craft: 1 }, art: "meteorologist", bio: "바람을 읽는다. 기지 대원들을 알았다.", heart: "kind", perk: "shelter", perkText: "바람을 피할 자리를 찾아 체온을 지킨다",
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
        C("소리를 따라 들어간다", { check: ["wits", 11], win: { t: "늙은 광부 셋이 갱도 안에 마을을 꾸리고 있었다. 석탄 한 자루와 고철을 나눠 줬다. “남쪽? 역장 영감 손자가 그쪽 길 표식을 남겼다더군.”", fx: { fuel: 3, item: "scrap", fact: "grandson_sign", fact2: "helped_village" } }, lose: { t: "갱도가 갈라졌다. 돌이 쏟아졌다.", fx: { hp: 1 } } }),
        C("광차를 뒤진다", { t: "녹슨 연장과 천 조각. 쓸 만하다.", fx: { item: ["scrap", "cloth"] } }),
      ]),
    } },
    p_lastcamp: { scenes: {
      start: S("쓰러진 텐트들. 눈에 반쯤 묻힌 장비에 파란 번호 패치가 붙어 있다. 기지 대원들이다. 셋이 서로 등을 기댄 채 얼어 있다. 하나의 품에 무언가가 있다.", [
        C("품속을 살핀다", { fx: { names: 3 }, t: "녹음 테이프 한 개. 겉에 3년 전 날짜와 ‘소이—아빠에게’라는 글씨. 그리고 일기의 마지막 장. ‘명단에 없는 사람은 태우지 않는다. 그래서 우린 명단을 훔쳤다.’", fx: { item: "tape", fact: "tape_found", clue: "hk" } }),
        C("묻어 주고 떠난다", { t: "언 땅을 오래 팠다. 셋의 이름을 불러 주었다.", fx: { human: 5, names: 3 } }),
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
        C("[도와준 사람들] 고개를 넘지 않는다. 길에서 도운 사람들에게 돌아간다", { req: { fact: "helped_village" }, fx: { ending: "settle" }, t: "고개 위에서 뒤를 돌아봤다. 연기 한 줄이 오르는 곳. 당신이 도왔던 사람들이 거기 있다. 열차보다 그쪽이 가까웠다." }),
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
        { id: "bt_p1", text: "새벽 세 시쯤, 불이 꺼져 가는 소리에 눈을 떴다. {traitor}의 자리가 비어 있다. 침낭은 아직 따뜻하다. 한참 뒤 {traitor}이(가) 돌아와 조용히 눕는다. 장갑에 이 근처에선 볼 수 없는 붉은 흙이 묻어 있다.", choices: [
          C("어디 갔었냐고 묻는다", { t: "“볼일.” 짧은 대답. {traitor}은(는) 등을 돌리고 누웠다. 그 등이 오래 깨어 있었다." }),
          C("발자국을 몰래 따라가 본다", { check: ["wits", 11], win: { t: "발자국은 바위 뒤에서 다른 발자국과 만났다가 돌아왔다. 썰매 자국도 있다.", fx: { clue: "bt" } }, lose: { t: "바람이 발자국을 지웠다." } }),
          C("모른 척 다시 눕는다", { t: "잠이 오지 않았다." }),
        ] },
        { id: "bt_p2", text: "아침에 짐을 꾸리다 손이 멈춘다. 식량 자루가 가볍다. 세어 보니 하나가 모자란다. 당신이 입을 열기도 전에 {traitor}이(가) 먼저 말한다. “쥐가 있나 봐. 어젯밤에 바스락거리더라.” 너무 빨랐다.", choices: [
          C("“그래, 쥐겠지.”", { t: "{traitor}이(가) 웃었다. 웃음이 조금 늦었다." }),
          C("{traitor}의 짐을 슬쩍 살핀다", { check: ["wits", 12], win: { t: "{traitor}의 짐 바닥에 통조림 하나와, 늑대 이빨이 꿰인 끈. 늑대단의 표식이다.", fx: { clue: "bt" } }, lose: { t: "{traitor}이(가) 돌아봤다. 손을 거뒀다." } }),
        ] },
        { id: "bt_p3", text: "능선 아래로 늑대단 썰매 두 대가 지나간다. 모두 눈 속에 엎드렸다. 숨을 죽인다. 그런데 {traitor}만 고개를 들고 썰매를 오래 바라본다. 썰매 위에서 누군가 이쪽으로 손을 든다. 마치 약속이라도 한 것처럼.", choices: [
          C("“아는 사람이야?”", { t: "“…아니.” {traitor}의 턱이 굳었다." }),
          C("썰매 위 사람의 얼굴을 기억해 둔다", { check: ["wits", 10], win: { t: "{twist_b_face}", fx: { clue: "bt" } }, lose: { t: "눈보라가 시야를 덮었다." } }),
        ] },
      ],
      complicate: { id: "bt_c", text: "불이 거의 꺼졌을 때 {traitor}이(가) 입을 연다. “있잖아. 남쪽에 가면… 우리 둘 다 탈 수 있을까.” 장작을 뒤적이던 손이 멈춘다. “자리가 하나뿐이면, 넌 어떡할 거야?” 농담처럼 말했지만, 대답을 기다리는 눈은 농담이 아니다.", choices: [
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
        { id: "fs_p1", text: "길가 눈더미에 사람이 반쯤 묻혀 있다. 손을 대자 눈을 뜬다. 아직 숨이 붙어 있다. 그가 당신 소매를 잡는다. “계곡… 피난처… 구씨한테 지도를 샀어. 식구들이 먼저 갔어. 나는 다리가… 근데 아무도… 아무도 돌아오지 않았어.” 말이 끊긴다.", choices: [
          C("가족이 어떻게 됐냐고 묻는다", { check: ["talk", 9], win: { t: "“돌아오지… 않았어. 아무도.” 그의 손에 피 묻은 지도 조각.", fx: { clue: "fs" } }, lose: { t: "그는 다시 눈을 뜨지 않았다." } }),
          C("마지막 물을 먹여 준다", { fx: { human: 4 }, t: "그가 희미하게 웃었다." }),
        ] },
        { id: "fs_p2", text: "피난처로 간다는 사람들의 행렬이 지나간다. 다들 구씨의 지도를 들고 있다. 행렬 끝의 아이가 묻는다. “아저씨도 계곡 가요? 거기 따뜻하대요.”", choices: [
          C("지도를 보여 달라고 한다", { check: ["wits", 11], win: { t: "지도의 길은 늑대단 캠프 바로 옆을 지난다. 이상하다.", fx: { clue: "fs" } }, lose: { t: "어른들이 아이를 끌고 갔다." } }),
          C("조심하라고만 한다", { t: "아이가 손을 흔들었다." }),
        ] },
        { id: "fs_p3", text: "구씨의 썰매 자국을 따라 걷다가, 썰매가 오래 멈춰 있었던 자리를 지난다. 눈이 다져져 있다. 그 가운데 얼어붙은 핏자국. 썰매에서 떨어진 판자 조각 하나. 안쪽에 손톱으로 긁은 자국이 빼곡하다. 안에서, 밖으로 나오려고.", choices: [
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
      1: { id: "o_parent1", text: "길가 무너진 집 앞에서, 아이 하나가 혼자 눈사람을 만들고 있다. 빨간 털모자. 소이가 쓰던 것과 같은 모자다. 심장이 한 번 크게 뛰었다. 아이가 돌아본다. 소이가 아니다. 아이가 묻는다. “아저씨, 우리 엄마 봤어요? 금방 온다고 했는데.” 눈사람 옆에 발자국은 아이 것뿐이다.", choices: [
        C("데려간다", { fx: { fact: "took_child", human: 8, food: -1, debt: { id: "child", good: true, text: "마을에서 혼자인 아이를 데려갔다" } }, t: "아이가 당신 손을 잡았다. 소이의 손보다 조금 컸다." }),
        C("엄마를 찾아 주겠다고 하고 떠난다", { fx: { human: -6, debt: { id: "child", text: "혼자인 아이를 마을에 두고 왔다" } }, t: "아이는 눈사람 옆에 계속 서 있었다." }),
      ] },
      2: { id: "o_parent2", text: "늑대단 보초들이 아이들 명단을 읽고 있다. “열차 자리랑 바꿀 놈들.” 명단 맨 아래 어딘가에 익숙한 이름이 있을지도 모른다.", choices: [
        C("명단을 훔쳐본다", { check: ["wits", 12], win: { t: "{parent_list_line}", fx: { fact: "saw_list" } }, lose: { t: "보초가 고개를 들었다. 물러났다.", fx: { stress: 10 } } }),
        C("보지 않는다. 무섭다", { t: "명단 넘기는 소리가 귀에 남았다." }),
      ] },
    },
    deserter: {
      1: { id: "o_des1", text: "등 뒤에서 썰매개 방울 소리. 처음엔 멀었다. 이제는 가깝다. 늑대 가죽 두건을 쓴 똑같은 얼굴 둘이 썰매에서 내린다. 쌍둥이. 백곰이 가장 아끼는 사냥개들이다. 하나가 웃는다. “돌아가자. 백곰이 용서해 준대.” 다른 하나는 웃지 않는다. 칼을 쥐고 있다.", choices: [
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

  // ── 2단계: 장소마다 두 번째 사건 (판마다 둘 중 하나가 나온다) ──
  Object.assign(events, {
    p_village2: { scenes: {
      start: S("마을 광장 한가운데 버스 한 대가 눈에 반쯤 묻혀 있다. 창문마다 성에. 안에서 누군가 유리를 두드린다. 똑, 똑. 아주 약하게.", [
        C("[쇠지레] 문을 비틀어 연다", { req: { item: "crowbar" }, t: "문이 비명을 지르며 열렸다. 노부부가 서로를 껴안고 있었다. 할머니만 숨이 붙어 있다. 할머니가 품에서 무언가를 꺼냈다. 손자에게 줄 거였다는 초콜릿 상자.", fx: { food: 2, human: 5 } }),
        C("창문을 깨고 들어간다", { check: ["force", 10], win: { t: "유리가 쏟아졌다. 안에 남은 건 얼어붙은 승객들과 짐 가방. 가방에서 붕대와 천.", fx: { item: ["bandage", "cloth"], stress: 5 } }, lose: { t: "유리 파편이 팔을 그었다.", fx: { hp: 1 } } }),
        C("두드리는 소리를 외면한다", { t: "똑, 똑. 소리는 마을을 벗어날 때까지 따라왔다.", fx: { human: -4 } }),
      ]),
    } },
    p_church2: { scenes: {
      start: S("교회 지하 납골당에 불빛이 있다. 계단을 내려가자 대여섯 명이 촛불 하나를 둘러싸고 있다. 그들이 일제히 돌아본다. 한 남자가 일어선다. “여기 자리는 없소. 식량도.”", [
        C("하룻밤만 불을 나눠 달라고 한다", { check: ["talk", 11], win: { t: "남자가 한참 보더니 자리를 비켰다. 밤새 그들의 기도 소리를 들었다. 새벽에 그들이 말린 빵 한 조각을 쥐여 줬다.", fx: { food: 1, cold: -2, human: 2, fact: "helped_village" }, go: "join" }, lose: { t: "그들이 촛불을 등지고 일어섰다. 물러났다.", go: "join" } }),
        C("[칼] 칼을 보이며 식량을 요구한다", { req: { item: "knife" }, t: "아무도 맞서지 않았다. 그들이 내준 자루를 메고 나왔다. 계단 위로 아이 울음이 따라왔다.", fx: { food: 3, human: -12, debt: { id: "crypt", text: "교회 지하 사람들의 식량을 칼로 빼앗았다" } } }),
        C("조용히 계단을 올라간다", { t: "촛불 하나가 등 뒤에서 흔들렸다.", go: "join" }),
      ]),
      join: S("교회 문을 나서는데 누군가 따라 나온다. 승복 위에 털옷을 껴입은 사람. “혜안이라 합니다. 저들은 여기서 겨울을 기다리겠다지요. 저는 남쪽으로 가려 합니다.”", [
        C("함께 가자고 한다", { fx: { join: "hyean" } }),
        C("혼자가 낫다", { t: "혜안은 고개를 숙였다. “부처님이 길을 비추시길.”" }),
      ]),
    } },
    p_cave2: { scenes: {
      start: S("동굴 벽에 손바닥 자국이 가득하다. 붉은 흙으로 찍은 것. 누군가 여기서 겨울을 셌다. 자국 끝에 얼어붙은 사람과, 그가 지키던 작은 상자.", [
        C("상자를 연다", { check: ["wits", 9], win: { t: "상자 안에 라이터와 사냥총 총알 몇 발, 그리고 쪽지. ‘지열 계곡은 진짜다. 돌담 문지기에게 내 이름을 대라. — 박’", fx: { item: ["lighter", "refuge_note"], fact: "refuge_known" } }, lose: { t: "상자가 얼어붙어 열리지 않았다." } }),
        C("손바닥 자국 옆에 내 손을 찍는다", { t: "붉은 흙이 차가웠다. 당신도 여기 있었다.", fx: { stress: -5, human: 2 } }),
      ]),
    } },
    p_cabin2: { scenes: {
      start: S("오두막은 비어 있다. 난로는 식었고, 식탁 위에 먹다 만 수프가 얼어 있다. 벽에 걸린 덫과 사냥 도구들. 바닥에 끌려간 자국. 문밖으로, 숲으로.", [
        C("끌린 자국을 따라간다", { check: ["wits", 12], win: { t: "자국 끝에 덫에 걸린 사냥꾼. 다리가 부러졌지만 살아 있다. 그가 이를 악물고 웃었다. “마루다. 빚졌군.”", fx: { join: "maru" } }, lose: { t: "자국은 눈보라에 지워졌다. 숲이 너무 조용했다." } }),
        C("벽의 도구를 챙긴다", { t: "밧줄과 고철 덫 부품을 챙겼다.", fx: { item: ["rope", "scrap"] } }),
      ]),
    } },
    p_observatory2: { scenes: {
      start: S("관측소 무전기가 아직 켜져 있다. 배터리 표시등이 깜빡인다. 스피커에서 숫자를 읽는 목소리가 반복된다. “…셋, 일곱, 둘… 남행선… 정원 마흔…”", [
        C("[배터리] 배터리를 갈고 끝까지 듣는다", { req: { item: "battery" }, fx: { take: "battery", fact: "list_rumor", fact2: "route_hint" }, t: "“…정원 마흔. 명단에 없는 자는 태우지 않는다. 명단은 하얀나루역장이 보관…” 목소리가 끊겼다. 열차는 진짜다. 그리고 자리는 정해져 있다.", go: "join" }),
        C("무전기를 분해해 부품을 챙긴다", { check: ["craft", 10], win: { t: "진공관 몇 개와 고철, 배터리 하나.", fx: { item: ["scrap", "battery", "vacuum_tube"] }, go: "join" }, lose: { t: "감전됐다. 손이 한참 떨렸다.", fx: { hp: 1 }, go: "join" } }),
      ]),
      join: S("문이 열리고 안경에 성에가 낀 여자가 들어온다. 손에 기상 기록을 쥐었다. “그 무전, 저도 매일 듣고 있었어요. 은서예요. 남쪽으로 가요? 저 혼자선 못 가겠어요.”", [
        C("같이 가자", { fx: { join: "eunseo" } }),
        C("미안하다", { t: "은서는 웃으려 했다. 잘 되지 않았다." }),
      ]),
    } },
    p_pylon2: { scenes: {
      start: S("송전탑 하나에 사람이 매달려 있다. 끈으로 묶여서. 아직 살아 있다. 탑 아래 눈 위에 늑대단의 표식이 그려져 있다. 본보기다.", [
        C("올라가 끈을 푼다", { check: ["force", 12], win: { t: "얼어붙은 철골을 올라 끈을 끊었다. 그는 내려오자마자 울며 당신 손에 금반지를 쥐여 줬다. “늑대단이… 열차 명단을 판대요. 사람 하나에 자리 하나.”", fx: { item: "gold_ring", human: 8, wolves: -1, fact: "list_rumor" } }, lose: { t: "철골에서 미끄러졌다.", fx: { hp: 1 } } }),
        C("표식을 보고 그냥 지나간다", { t: "늑대단을 건드리지 않는 게 살아남는 법이다. 그의 눈이 오래 따라왔다.", fx: { human: -6, wolves: 1 } }),
      ]),
    } },
    p_highway2: { scenes: {
      start: S("고속도로 휴게소. 무너진 지붕 아래 자판기들이 줄지어 서 있다. 그 앞에서 두 무리가 서로를 노려본다. 가운데 바닥에 통조림 상자 하나. 누가 먼저 움직이느냐의 문제다.", [
        C("상자를 반씩 나누자고 끼어든다", { check: ["talk", 12], win: { t: "두 무리가 당신을 봤다. 그리고 상자를 반으로 나눴다. 수고비라며 통조림 둘을 던져 줬다.", fx: { food: 2, human: 4 }, go: "join" }, lose: { t: "두 무리가 동시에 당신을 향했다. 뛰었다.", fx: { hp: 1 } } }),
        C("혼란을 틈타 상자를 낚아챈다", { check: ["wits", 13], win: { t: "상자를 안고 뛰었다. 등 뒤에서 두 무리가 서로를 탓하는 소리.", fx: { food: 4, human: -6 }, go: "join" }, lose: { t: "두 무리 모두에게 쫓겼다.", fx: { hp: 1, food: -1 } } }),
        C("멀리 돌아간다", { t: "고함이 터지고, 이어서 조용해졌다.", go: "join" }),
      ]),
      join: S("휴게소를 벗어나자 무너진 표지판 밑에서 조종복 위에 담요를 두른 여자가 손을 든다. “한별이에요. 저 무리들, 사흘째 저래요. 같이 가도 될까요? 남쪽 하늘길은 제가 알아요.”", [
        C("같이 가자", { fx: { join: "hanbyeol" } }),
        C("혼자 가겠다", { t: "“조심해요. 하늘에서 보면 이 길, 끝이 없었어요.”" }),
      ]),
    } },
    g_bridge2: { scenes: {
      start: S("다리 앞에 누군가 통행세를 받는다. 털옷을 겹겹이 입은 사내 셋. “지나가려면 하나 내놔. 식량이든, 물건이든, 사람이든.” 그들 뒤로 끊긴 철교에 판자가 걸쳐져 있다.", [
        C("식량 둘을 낸다", { req: { food: 2 }, fx: { food: -2 }, t: "사내가 자루를 받고 판자 길을 가리켰다." }),
        C("[금반지] 반지를 낸다", { req: { item: "gold_ring" }, fx: { take: "gold_ring" }, t: "사내가 반지를 햇빛에 비춰 보고 웃었다. “좋은 손님.”" }),
        C("[늑대 이빨 표식] 늑대단 표식을 내민다", { req: { item: "wolf_token" }, t: "사내들의 얼굴이 굳었다. 그들은 아무 말 없이 길을 비켰다.", fx: { wolves: 1 } }),
        C("밀어붙인다", { check: ["force", 13], win: { t: "하나를 강물 쪽으로 밀쳤다. 나머지가 물러섰다.", fx: { human: -5 } }, lose: { t: "셋을 당할 수 없었다. 짐을 빼앗기고 내쫓겼다. 하류로 하루를 돌았다.", fx: { hp: 1, food: -1, day: 1 } } }),
      ]),
    } },
    p_merchant2: { scenes: {
      start: S("구씨의 썰매가 뒤집혀 있다. 개들은 흩어졌고, 물건들이 눈 위에 흩어졌다. 썰매 밑에 구씨의 다리가 깔렸다. 그가 이를 악문다. “좀… 들어 줘. 공짜로 안 할게.”", [
        C("썰매를 들어 구씨를 꺼낸다", { check: ["force", 11], win: { t: "구씨가 기어 나왔다. 다리를 절며 웃었다. “빚은 없던 걸로 하지. 그리고 이거.” 피난처 쪽지.", fx: { unfact: "owe_gu", item: "refuge_note", fact: "refuge_known", debt: { id: "gu", good: true, text: "썰매에 깔린 구씨를 구했다" } } }, lose: { t: "썰매가 다시 내려앉았다. 구씨가 비명을 질렀다.", fx: { stress: 10 } } }),
        C("흩어진 물건을 줍고 떠난다", { t: "항생제, 담배, 술. 구씨의 욕설이 오래 따라왔다. “기억해 둔다! 다 기억해 둔다!”", fx: { item: ["antibiotics", "cigarettes", "liquor"], human: -10, debt: { id: "gu", text: "썰매에 깔린 구씨를 두고 물건을 주워 갔다" } } }),
      ]),
    } },
    p_outpost2: { scenes: {
      start: S("전초 감시탑이 불타고 있다. 늑대단끼리 싸움이 붙었다. 한쪽은 백곰 편, 한쪽은 새 두목을 세우려는 무리. 불길 사이로 식량 창고 문이 열려 있다.", [
        C("창고로 뛰어든다", { check: ["wits", 11], win: { t: "연기 속에서 고기 자루와 연료통을 들고 나왔다. 아무도 당신을 보지 못했다.", fx: { food: 3, fuel: 2 } }, lose: { t: "불붙은 기둥이 쓰러졌다.", fx: { hp: 1, food: 1 } } }),
        C("반란 무리를 돕는다", { check: ["force", 12], win: { t: "반란 무리가 이겼다. 우두머리가 당신 어깨를 두드렸다. “백곰을 끌어내릴 날이 온다. 그때 너도 와.”", fx: { wolves: 1, fact: "rebels_friend" } }, lose: { t: "백곰 편이 이겼다. 당신 얼굴을 기억하는 자들이 생겼다.", fx: { hp: 1, wolves: -2 } } }),
        C("멀리서 지켜본다", { t: "늑대단은 하나가 아니다. 그걸 알았다.", fx: { fact: "wolves_split" } }),
      ]),
    } },
    p_mine2: { scenes: {
      start: S("갱도 입구가 무너졌다. 안쪽에서 두드리는 소리. 세 번, 쉬고, 세 번. 갇힌 사람이 있다. 돌을 치우려면 하루가 걸린다.", [
        C("하루를 써서 돌을 치운다", { t: "손톱이 다 부러졌다. 저녁 무렵 구멍이 뚫렸다. 늙은 광부 둘이 기어 나왔다. 석탄 자루를 통째로 내줬다.", fx: { day: 1, fuel: 4, human: 8, fact: "helped_village" } }),
        C("[쇠지레] 지렛대로 큰 돌만 옮긴다", { req: { item: "crowbar" }, check: ["craft", 10], win: { t: "큰 돌이 굴러 나갔다. 광부들이 나와 석탄 한 자루를 줬다.", fx: { fuel: 3, human: 6, fact: "helped_village" } }, lose: { t: "돌이 다시 내려앉았다. 두드리는 소리가 멈췄다.", fx: { stress: 15 } } }),
        C("두드리는 소리를 두고 떠난다", { t: "세 번, 쉬고, 세 번. 산을 내려갈 때까지 들렸다.", fx: { human: -8 } }),
      ]),
    } },
    p_lastcamp2: { scenes: {
      start: S("대원들의 텐트 하나가 아직 서 있다. 안에 마지막 대원이 앉은 채 얼어 있다. 무릎 위에 무전기, 손에 연필. 일기장에 마지막으로 적힌 줄. ‘우리가 명단을 훔쳤다. 그래서 이렇게 된 거다. 돌려줘야 한다.’ 그 아래 접힌 종이.", [
        C("접힌 종이를 편다", { t: "열차 탑승 명단. 이름 마흔 개. 몇 줄에 줄이 그어져 있다. 이걸 가진 사람이 열차의 문을 연다.", fx: { item: "passenger_list", fact: "has_list", human: -2, names: 1 } }),
        C("손대지 않고 묻어 준다", { t: "명단은 그의 품에 그대로 두었다. 그가 돌려주려던 것을 당신이 빼앗고 싶지 않았다.", fx: { human: 6, names: 1 } }),
      ]),
    } },
    p_kennel2: { scenes: {
      start: S("개 우리가 비어 있다. 사슬만 기둥에 걸려 흔들린다. 사슬 끝에 작은 발자국이 눈 위로 이어진다. 그리고 그 옆에 큰 발자국 둘. 쫓기고 있다.", [
        C("발자국을 따라 달린다", { check: ["force", 12], win: { t: "골짜기 끝에서 소년을 덮치려던 늑대단 둘을 밀쳐 냈다. 소년이 숨을 헐떡이며 말했다. “…도치예요.”", fx: { fact: "dochi_saved", human: 8, wolves: -1, debt: { id: "dochi", good: true, text: "쫓기던 소년 도치를 구했다" } } }, lose: { t: "늦었다. 골짜기 끝에서 소년은 끌려가고 있었다. 소년이 당신을 봤다.", fx: { debt: { id: "dochi", text: "쫓기던 소년을 구하지 못했다" } } } }),
        C("상관하지 않는다", { t: "발자국은 눈보라에 지워졌다.", fx: { human: -5, debt: { id: "dochi", text: "쫓기던 소년을 외면했다" } } }),
      ]),
    } },
    p_lake2: { scenes: {
      start: S("호수 한가운데 얼음 낚시 구멍이 줄지어 있다. 낚싯줄 하나가 팽팽하다. 주인은 없다. 줄 끝에서 무언가 거세게 당긴다.", [
        C("줄을 끌어당긴다", { check: ["force", 10], win: { t: "팔뚝만 한 물고기가 얼음 위로 튀어 올랐다. 그날 밤은 배불렀다.", fx: { food: 3 } }, lose: { t: "얼음이 갈라졌다. 발이 빠졌다.", fx: { cold: 2 } } }),
        C("주인을 기다린다", { t: "해 질 무렵 소년 하나가 와서 줄을 거뒀다. 물고기 반을 나눠 줬다. “아저씨도 남쪽 가요? 열차 탈 때 명단이 있어야 한대요.”", fx: { food: 1, fact: "list_rumor", human: 3 } }),
      ]),
    } },
    p_wolfcamp2: { scenes: {
      start: S("늑대단 캠프에서 잔치가 열렸다. 모닥불 앞에 사람들이 줄 서 있다. 늑대단이 아니다. 피난민들. 한 사람씩 앞으로 나가 이름을 대면, 백곰이 장부에 적고 고기 한 점을 준다. 장부 표지에 ‘남행 명단’.", [
        C("줄에 서서 이름을 댄다", { check: ["talk", 12], win: { t: "백곰이 당신 이름을 적었다. “열차 날 선로로 와. 자리 하나 비워 두지. 대가는 그때 말해 주마.”", fx: { food: 1, wolves: 1, fact: "baekgom_list" } }, lose: { t: "백곰이 당신 얼굴을 오래 봤다. “넌 아니야.” 쫓겨났다.", fx: { wolves: -1 } } }),
        C("장부를 훔칠 틈을 노린다", { check: ["wits", 14], win: { t: "취한 장부지기 품에서 명단을 빼냈다. 이제 당신이 자리를 쥐었다.", fx: { item: "passenger_list", fact: "has_list", wolves: -2 } }, lose: { t: "장부지기가 눈을 떴다. 몰매를 맞고 도망쳤다.", fx: { hp: 2, wolves: -2 } } }),
        C("줄 선 사람들에게 경고한다", { check: ["talk", 11], win: { t: "몇몇이 줄을 빠져나왔다. 그들이 당신에게 고개를 숙였다.", fx: { human: 6, wolves: -1 } }, lose: { t: "아무도 듣지 않았다. 고기 냄새가 더 셌다." } }),
      ]),
    } },
    g_checkpoint2: { scenes: {
      start: S("검문소 앞에 줄이 길다. 보초들이 사람마다 몸을 뒤진다. 줄 앞쪽에서 한 여자가 아이를 빼앗기며 비명을 지른다. “통행세가 모자라!” 보초가 웃는다.", [
        C("여자의 통행세를 대신 낸다 (식량 2)", { req: { food: 2 }, fx: { food: -2, human: 8, debt: { id: "mother", good: true, text: "검문소에서 아이 엄마의 통행세를 대신 냈다" } }, t: "보초가 아이를 돌려줬다. 여자가 당신 손에 입을 맞췄다. 당신도 무사히 지나갔다." }),
        C("소란을 틈타 옆으로 빠진다", { check: ["wits", 12], win: { t: "모두가 비명 쪽을 볼 때 차단봉 옆을 지났다.", fx: { human: -4 } }, lose: { t: "보초가 돌아봤다. 짐을 털리고 겨우 지나갔다.", fx: { food: -2, hp: 1 } } }),
        C("[늑대 이빨 표식] 표식으로 지나간다", { req: { item: "wolf_token" }, check: ["talk", 11], win: { t: "보초가 고개를 끄덕였다. 등 뒤의 비명은 계속됐다." }, lose: { t: "보초가 표식을 빼앗았다. 뛰었다.", fx: { take: "wolf_token", hp: 1 } } }),
      ]),
    } },
  });
  for (const [k, p] of Object.entries(places)) if (events[`${p.ev}2`] && p.ev) p.ev = [p.ev, `${p.ev}2`];

  // ── 명장면 (판마다 3개를 감독이 고른다) ──
  const setpieces = {
    sp_whiteout: { act: 1, art: "sp_whiteout", scenes: {
      start: S("길 한가운데서 세상이 하얗게 지워진다. 화이트아웃. 발밑도, 손끝도 보이지 않는다. 바람이 사방에서 이름을 부르는 것 같다. 여기서 길을 잃으면 봄까지 아무도 찾지 못한다.", [
        C("[밧줄] 밧줄로 서로를 묶고 걷는다", { req: { item: "rope" }, t: "앞사람의 등만 보며 걸었다. 몇 시간 뒤, 바람이 갑자기 멎었다. 아무도 잃지 않았다." }),
        C("눈굴을 파고 멎길 기다린다", { check: ["craft", 11], win: { t: "눈굴 안은 이상하리만치 따뜻했다. 새벽에 바람이 멎었다.", fx: { day: 1 } }, lose: { t: "눈굴이 무너졌다. 밤새 떨었다.", fx: { cold: 2, day: 1 } } }),
        C("감으로 걷는다", { check: ["wits", 13], win: { t: "발이 길을 기억했다. 빠져나왔다." }, lose: { t: "같은 바위를 세 번 지났다. 손가락이 하얗게 얼었다.", fx: { hp: 1, cold: 1 } } }),
      ]),
    } },
    sp_wolfpack: { act: 1, art: "sp_wolfpack", scenes: {
      start: S("해가 지자 숲 가장자리에서 눈빛들이 켜진다. 하나, 둘, 일곱. 늑대 무리다. 굶주렸다. 불빛이 닿지 않는 곳에서 원을 좁혀 온다.", [
        C("[라이터] 불을 크게 피운다", { req: { item: "lighter" }, fx: { fuel: -1 }, t: "불길이 치솟자 눈빛들이 물러났다. 밤새 불을 지켰다. 새벽, 무리는 사라져 있었다." }),
        C("[사냥총] 우두머리를 쏜다", { req: { item: "rifle" }, fx: { food: 3 }, t: "총성 한 번. 우두머리가 쓰러지자 무리가 흩어졌다. 오늘 밤은 고기가 있다." }),
        C("나무 위로 올라간다", { check: ["force", 11], win: { t: "나뭇가지 위에서 밤을 새웠다. 아래에서 늑대들이 짐을 뜯었다.", fx: { food: -2 } }, lose: { t: "다리를 물렸다. 겨우 올라갔다.", fx: { hp: 1, food: -2 } } }),
      ]),
    } },
    sp_ice_chase: { act: 2, art: "sp_ice_chase", scenes: {
      start: S("등 뒤에서 썰매개 방울 소리. 늑대단 썰매 둘이 얼음 호수 위로 쫓아온다. 발밑에서 얼음이 갈라지는 소리. 앞은 검은 물이 숨 쉬는 얇은 얼음, 옆은 끝없는 호숫가.", [
        C("얇은 얼음 쪽으로 달린다", { check: ["wits", 12], win: { t: "얼음이 등 뒤에서 무너졌다. 첫 썰매가 개들과 함께 물속으로 사라졌다. 두 번째 썰매가 멈췄다.", fx: { wolves: -1 } }, lose: { t: "발밑이 꺼졌다. 허리까지 빠졌다. 겨우 기어 나왔을 때 썰매는 사라지고 짐도 사라졌다.", fx: { cold: 2, food: -2 } } }),
        C("짐을 던지며 달린다", { t: "식량 자루를 하나씩 던졌다. 썰매가 멈춰 그것을 주웠다. 살았다. 가벼워졌다.", fx: { food: -3 } }),
        C("돌아서 맞선다", { check: ["force", 14], win: { t: "첫 썰매꾼을 끌어내렸다. 개들이 놀라 달아났다. 썰매에 실린 고기를 챙겼다.", fx: { food: 3, wolves: -2, human: -3 } }, lose: { t: "채찍이 얼굴을 갈랐다.", fx: { hp: 2 } } }),
      ]),
    } },
    sp_avalanche: { act: 3, art: "sp_avalanche", scenes: {
      start: S("산비탈 위에서 낮은 천둥 소리. 눈이 미끄러지기 시작한다. 눈사태다. 하얀 벽이 산을 집어삼키며 내려온다. 몇 초.", [
        C("바위 뒤로 뛴다", { check: ["force", 12], win: { t: "바위 그늘에 몸을 던졌다. 하얀 굉음이 머리 위로 지나갔다. 살았다." }, lose: { t: "눈에 휩쓸렸다. 한참을 파고 나왔다.", fx: { hp: 1, cold: 2 } } }),
        C("비스듬히 달려 빠져나간다", { check: ["wits", 12], win: { t: "눈사태의 가장자리를 비켜 달렸다. 등 뒤에서 산이 무너졌다." }, lose: { t: "발이 걸렸다. 눈이 다리를 삼켰다.", fx: { hp: 1 } } }),
      ]),
    } },
  };
  Object.assign(events, Object.fromEntries(Object.entries(setpieces).map(([k, v]) => [k, v])));

  // ── 3막 출신 결단 ──
  Object.assign(originBeats.parent, { 3: { id: "o_parent3", text: "{parent3_text}", choices: [
    C("무전기에 대고 말한다", { fx: { fact: "parent_spoke", human: 3 }, t: "“소이야. 아빠야. 가고 있어.” 잡음뿐이었다. 그래도 말하고 나니 다리가 덜 떨렸다." }),
    C("무전기를 끈다", { fx: { fact: "parent_silent" }, t: "이제 목소리 없이 간다. 남은 건 사진 한 장." }),
  ] } });
  Object.assign(originBeats.deserter, { 3: { id: "o_des3", text: "산길 고개 위에 흰 곰 털옷이 서 있다. 백곰이다. 쌍둥이 하나가 그 곁에 있다. 백곰이 웃는다. “3년이었지. 넌 내 오른손이었어. 돌아와. 아니면 여기서 끝내.” {des3_extra}", choices: [
    C("맞선다. 여기서 끝낸다", { check: ["force", 14], win: { t: "눈 위에서 오래 뒹굴었다. 마침내 백곰이 무릎을 꿇었다. 쌍둥이가 칼을 내려놓았다. 늑대단의 두목이 쓰러졌다. 그 자리는 이제 비어 있다.", fx: { fact: "baekgom_down", wolves: 2, human: -5 } }, lose: { t: "백곰의 주먹이 먼저였다. 그는 당신을 눈밭에 버려두고 웃으며 떠났다. “선로에서 보자.”", fx: { hp: 2, wolves: -2 } } }),
    C("그날 밤 철창 이야기를 꺼낸다", { check: ["talk", 13], win: { t: "백곰의 웃음이 멎었다. 한참 뒤 그가 낮게 말했다. “…그건 내가 아니라 명단이 시킨 거다.” 그가 길을 비켰다. “가. 다시는 보지 말자.”", fx: { fact: "baekgom_spared", wolves: 1, human: 4 } }, lose: { t: "“말로 될 일이 아니야.” 쌍둥이가 덤볐다.", fx: { hp: 1 } } }),
    C("돌아간다. 늑대단으로", { fx: { fact: "rejoin_wolves", wolves: 3, human: -8 }, t: "백곰이 당신 어깨에 털옷을 걸쳤다. 따뜻했다. 그게 가장 무서웠다." }),
    C("무엇을 잃더라도 끝까지 싸운다", { fx: { ending: "revenge" }, t: "눈이 붉게 물들 때까지 싸웠다. 백곰이 먼저 쓰러졌다. 당신은 그 곁에 무릎을 꿇었다. 일어설 수 없었다." }),
  ] } });
  Object.assign(originBeats.drifter, { 3: { id: "o_drift3", text: "{drift3_text}", choices: [
    C("끝까지 지킨다", { fx: { fact: "purpose_final", human: 5 }, t: "이유가 당신을 여기까지 데려왔다. 끝까지 가 보자." }),
    C("놓아 버린다", { fx: { fact: "purpose_abandoned", human: -5 }, t: "가벼워졌다. 그리고 텅 비었다." }),
  ] } });

  // ── 동행의 기억 (함께 있을 때 생긴 빚을 기억한다) ──
  const memory = {
    dochi: "사슬에 묶여 있던 그 아이… 우리가 두고 왔잖아.",
    stationmaster: "그 노인 식량을 뺏었을 때, 난 아무 말도 못 했어.",
    guard: "보초를 쓰러뜨린 밤, 네 눈이 무서웠어.",
    child: "빨간 모자 애… 아직도 눈사람 옆에 서 있을 거야.",
    crypt: "교회 지하에서 아이가 울던 소리, 너도 들었지?",
    gu: "구씨를 썰매 밑에 두고 왔어. 장사꾼이라도 사람이야.",
    comrade: "네 옛 동료가 마지막에 네 이름을 불렀어.",
    twins: "쌍둥이 하나가 눈 위에 쓰러져 있던 거, 아직 생각나.",
  };
  // 동행이 길을 막아선다
  const confront = { id: "confront", text: "{cname}이(가) 걸음을 멈추고 당신 앞을 막아선다. “{cmem} 이대로는 너랑 못 가.”", choices: [
    C("진심으로 사과한다", { check: ["talk", 11], win: { t: "{cname}이(가) 오래 당신을 봤다. 그리고 다시 걸었다. 조금 떨어져서.", fx: { ctrust: 2, human: 3 } }, lose: { t: "“말은 쉽지.” {cname}의 눈빛은 그대로였다.", fx: { ctrust: 0 } } }),
    C("“살아남으려면 어쩔 수 없었어.”", { t: "{cname}이(가) 고개를 저었다. 아침에 그 자리가 비어 있었다.", fx: { cleave: true } }),
    C("멱살을 잡는다", { check: ["force", 11], win: { t: "{cname}은(는) 따라왔다. 증오가 등에 꽂혔다.", fx: { ctrust: -1, human: -5 } }, lose: { t: "{cname}이(가) 당신을 밀쳐 내고 떠났다.", fx: { cleave: true, hp: 1 } } }),
  ] };
  // 화자: 결말에서 이 이야기를 들려주는 사람
  const narrators = {
    soi: "몇 해 뒤, 소이가 이 겨울 이야기를 아이들에게 들려준다.",
    dochi: "도치는 지금도 그 노래를 휘파람으로 분다. 그리고 그 겨울 이야기를 한다.",
    companion: "{name}은(는) 그 겨울을 이렇게 기억한다.",
    grandson: "하얀나루역장의 손자가 남긴 기록에 이렇게 적혀 있다.",
    wolves: "늑대단의 아이들은 모닥불 앞에서 이 이야기를 전설처럼 듣는다.",
    snow: "아무도 이 이야기를 기억하지 않는다. 눈만이 기억한다.",
    self: "당신이 직접 남긴 마지막 일기.",
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
    king: { title: "설원의 왕", text: "늑대단의 큰 모닥불 앞, 흰 곰 털옷이 이제 당신의 어깨에 걸려 있다. 아이들이 당신을 두려워한다. 그 눈빛을, 당신은 안다." },
    crash: { title: "추락", text: "구름 위로 오르던 날개가 한 번 떨렸다. 엔진 소리가 멎었다. 하얀 설원이 다시 가까워졌다. 마지막으로 본 것은 처음 보는 햇빛이었다." },
    settle: { title: "멈춘 곳", text: "고개를 넘지 않았다. 당신이 도왔던 사람들의 불가로 돌아갔다. 열차는 오지 않는다. 대신 아침마다 누군가 당신 몫의 국을 데워 둔다." },
    revenge: { title: "복수의 끝", text: "백곰은 눈 위에 누워 있다. 당신도 그 곁에 누워 있다. 하늘이 이상하게 맑다. 끝났다. 무엇이 끝났는지는 모르겠다." },
    letgo: { title: "딸을 보낸 사람", text: "화물칸 문이 닫혔다. 창밖 승강장에 흰 털옷과 빨간 털모자가 나란히 서 있다. 소이가 손을 흔든다. 당신을 향해서인지, 떠나는 열차를 향해서인지 모르겠다." },
    missed: { title: "놓친 열차", text: "선로에 닿았을 때 지평선 끝에 불빛 하나가 사라지고 있었다. 기적 소리만 오래 남았다." },
    frozen: { title: "눈 속에서 잠들다", text: "졸음이 왔다. 이상하게 따뜻했다. 눈이 천천히 당신을 덮었다." },
    inhuman: { title: "사람이 아니게 되어", text: "살아남았다. 그런데 아무도 당신 곁에 앉지 않는다. 당신도 그 이유를 안다." },
  };
  // ── 3단계: 출신 2개 ──
  Object.assign(items, {
    crew_list: { name: "대원 명단", kind: "단서", key: true, desc: "일곱 개의 이름. 셋에 줄이 그어져 있다" },
    obs_key: { name: "관측소 열쇠", kind: "단서", key: true, desc: "무전실 문을 연다" },
    flight_log: { name: "조종사 수첩", kind: "단서", key: true, desc: "부품 목록: 연료 네 통, 진공관" },
    vacuum_tube: { name: "진공관", kind: "단서", key: true, desc: "무전기·엔진을 살리는 부품" },
  });
  Object.assign(origins, {
    crew: {
      name: "기지의 마지막 대원", short: "대원", stats: { force: 1, wits: 2, talk: 1, craft: 2 },
      start: "base", items: ["crew_list", "obs_key", "bandage"], food: 5, fuel: 2,
      pitch: "대원 일곱이 남쪽 길을 찾으러 떠났다. 아무도 돌아오지 않았다.",
      intro: [
        "식당의 의자 일곱 개가 비어 있다. 석 달째.",
        "그날 당신은 열이 난다며 남았다. 정말 열이 났었는지, 이제는 기억이 흐리다.",
        "명단의 일곱 이름을 손가락으로 짚는다. 남쪽으로 간다. 그들에게 무슨 일이 있었는지 알아야 한다.",
      ],
      premises: ["betrayal", "false_salvation"],
    },
    pilot: {
      name: "추락한 조종사", short: "조종사", stats: { force: 1, wits: 2, talk: 1, craft: 3 },
      start: "start_wreck", items: ["flight_log", "lighter", "scrap"], food: 5, fuel: 2,
      pitch: "수송기가 떨어졌다. 다시 띄우면 남쪽으로 날 수 있다.",
      intro: [
        "눈을 뜨니 조종석 유리에 성에가 꽃처럼 피어 있었다. 부조종사는 대답하지 않았다.",
        "구조 비행이었다. 무엇을 구하러 가던 비행이었는지, 수첩에 적혀 있다.",
        "날개 아래로 기어 나온다. 하늘은 잃었지만 하늘로 가는 길은 안다. 남쪽으로.",
      ],
      premises: ["betrayal", "false_salvation"],
    },
  });
  places.start_wreck = { act: 0, name: "수송기 잔해", art: "start_wreck", fb: "plane" };
  places.old_airfield = { act: 3, dest: "sky", name: "옛 비행장", art: "old_airfield", fb: "plane", ev: "d_sky" };
  places.observatory_back = { act: 3, dest: "signal", name: "관측소로 되돌아가는 길", art: "observatory", fb: "station", ev: "d_signal" };
  events.d_sky = { climax: "sky" };
  events.d_signal = { climax: "signal" };
  climax.sky = { name: "옛 비행장", art: "climax_airfield", fb: "plane", arrive: "눈 덮인 활주로 끝, 격납고 문이 반쯤 열려 있다. 안에 낡은 수송기 한 대. 날개 위에 눈이 쌓였다. 연료 계기는 바닥이다. 그래도 형태는 온전하다." };
  climax.signal = { name: "관측소", art: "end_signal", fb: "station", arrive: "왔던 길을 되짚어 관측소에 닿았다. 무전실 문 너머, 먼지 쌓인 송신기. 이걸 살리면 이 설원의 모든 생존자가 열차 시간과 길을 알게 된다." };
  Object.assign(endings, {
    sky: { title: "하늘로", text: "엔진이 기침하듯 살아났다. 활주로가 짧았다. 바퀴가 눈을 떠났다. 구름 위로 오르자 처음 보는 햇빛이 조종석을 채웠다." },
    signal: { title: "신호를 지키는 사람", text: "송신기의 빨간 불이 켜졌다. 당신은 매일 같은 시간, 같은 말을 한다. “열차는 온다. 남동쪽, 송전탑을 따라와라.” 대답은 없다. 그래도 누군가는 듣고 있다." },
    open: { title: "모두의 열차", text: "명단이 불길 속에서 오그라들었다. 화물칸 문 앞에서 누구도 이름을 부르지 않았다. 사람들이 서로를 끌어올렸다. 열차는 무거웠고, 느렸고, 모두를 태웠다." },
  });
  Object.assign(originBeats, {
    crew: {
      1: { id: "o_crew1", text: "눈 속에 파란 번호 패치가 보인다. 3번. 정우다. 당신과 같은 방을 쓰던. 그는 남쪽을 향해 엎드려 있다. 품에 일기장.", choices: [
        C("[대원 명단] 명단에서 정우의 이름에 줄을 긋는다", { req: { item: "crew_list" }, fx: { fact: "crew_found1", names: 1 }, t: "일곱 중 하나. 연필이 떨렸다. 그의 이름표를 주머니에 넣었다." }),
        C("일기를 끝까지 읽는다", { check: ["wits", 10], win: { t: "‘명단의 자리가 넷뿐이란 걸 알았다. 우리는 셋으로 갈라졌다. 넷을 고른 건… 남겨 둔 그 녀석이었다.’ 당신 이야기다. 당신이 넷을 골랐다. 그래서 남았던 것이다.", fx: { fact: "truth_crew", human: -3, names: 1 } }, lose: { t: "마지막 몇 장이 얼어 붙어 떨어지지 않았다." } }),
      ] },
      2: { id: "o_crew2", text: "늑대단 무리 속에 대원복이 보인다. 그 위에 늑대단 털옷. 6번, 민재다. 그가 당신을 알아보고 얼굴이 하얘진다. “너… 살아 있었구나. 넷 중에 네 이름이 없던 게 이상하다 했어.”", choices: [
        C("빼내 온다", { check: ["wits", 12], win: { t: "밤에 그를 빼냈다. 민재가 털어놓았다. “구씨가 명단 자리를 팔았어. 우린 넷만 살리려고 명단을 훔쳤고, 나머지는 계곡 문 앞에서 쫓겨났어.”", fx: { fact: "crew_saved", fact2: "truth_crew", human: 5, names: 1 } }, lose: { t: "늑대단이 눈치챘다. 민재는 끌려갔다.", fx: { hp: 1 } } }),
        C("멀리서 지켜만 본다", { t: "민재는 다시는 이쪽을 보지 않았다.", fx: { human: -4, names: 1 } }),
      ] },
      3: { id: "o_crew3", text: "고개 위에서 북쪽을 돌아본다. 관측소 안테나가 아주 작게 보인다. 송신기를 살리면 이 설원의 모든 생존자에게 열차 시간과 길을 알릴 수 있다. 하지만 누군가 거기 남아 신호를 지켜야 한다. 일곱의 이름이 주머니에서 무겁다.", choices: [
        C("관측소로 돌아가기로 한다", { fx: { fact: "signal_path" }, t: "열차는 당신 없이 떠날 것이다. 대신 다른 누군가가 탈 것이다." }),
        C("남쪽으로 간다", { t: "안테나가 등 뒤에서 사라졌다." }),
      ] },
    },
    pilot: {
      1: { id: "o_pilot1", text: "수첩 사이에 블랙박스 녹음 테이프를 끼워 두었다. 밤에 무전기로 틀어 본다. 마지막 교신. “…구조 대상 마흔, 하얀나루 경유, 명단 외 탑승 불가…” 그리고 부조종사의 목소리. “명단 밖 사람들은요?” 대답은 없다.", choices: [
        C("부품 목록을 다시 외운다", { fx: { fact: "plane_plan" }, t: "연료 네 통. 진공관 하나. 그거면 남은 수송기 하나를 띄울 수 있다. 남서쪽 옛 비행장에." }),
        C("녹음을 끝까지 듣는다", { check: ["wits", 10], win: { t: "녹음 끝에 관제사의 낮은 목소리. “명단은 기지 대원이 넘겨줬다. 넷만 고른 명단이다.” 이 비행은 처음부터 마흔만 구하러 온 것이다.", fx: { fact: "plane_plan", fact2: "truth_pilot" } }, lose: { t: "테이프가 늘어져 소리가 일그러졌다.", fx: { fact: "plane_plan" } } }),
      ] },
      2: { id: "o_pilot2", text: "늑대단 연료 창고. 드럼통 수십 개가 철조망 안에 쌓여 있다. 보초는 셋. 수송기를 띄우려면 네 통이 필요하다.", choices: [
        C("[금반지] 반지를 주고 거래한다", { req: { item: "gold_ring" }, fx: { take: "gold_ring", fuel: 4, wolves: 1 }, t: "보초가 반지를 깨물어 보고 드럼 넷을 굴려 줬다." }),
        C("밤에 숨어든다", { check: ["wits", 13], win: { t: "드럼 다섯을 하나씩 굴려 냈다. 창고 구석 공구함에서 진공관도 하나.", fx: { fuel: 5, item: "vacuum_tube", wolves: -1 } }, lose: { t: "드럼 하나가 넘어지며 굉음을 냈다. 하나만 들고 뛰었다.", fx: { fuel: 1, hp: 1, wolves: -1 } } }),
        C("정면으로 턴다", { check: ["force", 14], win: { t: "보초들이 달아났다. 연료를 썰매 가득 실었다.", fx: { fuel: 6, wolves: -2, human: -4 } }, lose: { t: "총알이 드럼을 뚫었다. 불길 속에서 도망쳤다.", fx: { hp: 2 } } }),
      ] },
      3: { id: "o_pilot3", text: "고개 위에서 남서쪽을 본다. 눈 덮인 평원 끝에 작은 격납고 지붕. 옛 비행장이다. 저기 수송기가 있다면, 그리고 연료와 진공관이 있다면, 열차를 기다릴 필요가 없다. 자리는 둘.", choices: [
        C("비행장으로 가기로 한다", { fx: { fact: "sky_path" }, t: "하늘은 아직 거기 있다." }),
        C("선로로 간다", { t: "격납고 지붕이 눈보라에 가려졌다." }),
      ] },
    },
  });
  // 관측소 두 번째 사건에서 진공관도 나온다
  // ── 길 위의 우연한 만남 (한 판에 몇 번, 같은 건 한 번만) ──
  const road = {
    road_dog: { art: "road_dog", scenes: { start: S("앙상한 개 한 마리가 멀찍이 따라온다. 갈비뼈가 드러났다. 멈추면 멈추고, 걸으면 걷는다.", [
      C("식량 하나를 나눠 준다", { req: { food: 1 }, fx: { food: -1, fact: "dog", human: 3 }, t: "개가 허겁지겁 먹고 당신 발치에 앉았다. 그날부터 밤마다 당신 등에 붙어 잤다. 따뜻했다." }),
      C("쫓아 버린다", { t: "개는 낑낑대며 사라졌다. 밤에 멀리서 울음소리가 들렸다." }),
      C("잡는다", { check: ["force", 10], win: { t: "그날 밤은 고기가 있었다. 아무도 맛있다고 말하지 않았다.", fx: { food: 3, human: -6 } }, lose: { t: "개가 손을 물고 달아났다.", fx: { hp: 1 } } }),
    ]) } },
    road_sled: { art: "road_sled", scenes: { start: S("길가에 버려진 썰매. 개들은 없다. 방수포 아래 짐이 그대로다. 썰매 손잡이에 피 묻은 장갑 한 짝이 걸려 있다.", [
      C("짐을 뒤진다", { check: ["wits", 9], win: { t: "통조림과 천 조각, 술 한 병. 장갑 주인은 어디 갔을까.", fx: { food: 2, item: ["cloth", "liquor"] } }, lose: { t: "방수포 아래에서 무언가 꿈틀거렸다. 쥐 떼였다. 거의 다 먹혔다.", fx: { food: 1 } } }),
      C("손대지 않는다", { t: "누군가 돌아올지도 모른다. 그럴 리 없다는 걸 알면서도." }),
    ]) } },
    road_soldier: { art: "road_soldier", scenes: { start: S("눈 위에 앉은 채 얼어붙은 군인. 무릎 위에 사냥총이 놓여 있다. 손가락이 아직 방아쇠에 걸려 있다.", [
      C("총을 빼낸다", { check: ["craft", 10], win: { t: "언 손가락을 하나씩 폈다. 총알이 세 발 남아 있었다.", fx: { item: "rifle", stress: 5 } }, lose: { t: "손가락이 부러지는 소리. 총은 빼냈지만 그 소리가 오래 남았다.", fx: { item: "rifle", human: -3 } } }),
      C("경례하고 지나간다", { t: "짧게 경례했다. 그가 지키던 쪽을 한 번 바라봤다.", fx: { human: 2 } }),
    ]) } },
    road_family: { art: "road_family", scenes: { start: S("눈길 위에 가족 셋이 주저앉아 있다. 엄마, 아빠, 그리고 여섯 살쯤 된 아이. 아빠가 일어서려다 넘어진다. 엄마가 당신을 본다. 말은 하지 않는다.", [
      C("식량 둘을 나눠 준다", { req: { food: 2 }, fx: { food: -2, human: 8, debt: { id: "family", good: true, text: "눈길의 가족에게 식량을 나눴다" } }, t: "아이가 통조림을 두 손으로 받았다. 엄마가 고개를 깊이 숙였다." }),
      C("남쪽 길만 알려 준다", { t: "아빠가 고개를 끄덕였다. 일어서지는 못했다.", fx: { human: 1 } }),
      C("지나친다", { t: "아이의 눈이 오래 따라왔다.", fx: { human: -5 } }),
    ]) } },
    road_trader: { art: "trade_merchant", scenes: { start: S("작은 썰매를 끄는 늙은 떠돌이가 손을 든다. “바꾸세. 난 붕대가 많고 담배가 없네.”", [
      C("[담배] 담배를 붕대 둘과 바꾼다", { req: { item: "cigarettes" }, fx: { take: "cigarettes", item: ["bandage", "bandage"] }, t: "노인이 담배 냄새를 맡고 눈을 감았다." }),
      C("[술] 술을 항생제와 바꾼다", { req: { item: "liquor" }, fx: { take: "liquor", item: "antibiotics" }, t: "노인이 술병을 품에 넣었다. “남쪽은 춥다네. 더 춥다네.”" }),
      C("그냥 이야기만 듣는다", { t: "“하얀나루 역장 영감이 진짜 명단을 숨겨 놨다더군. 열차는 명단만 태운다지.”", fx: { fact: "list_rumor" } }),
    ]) } },
    road_grave: { art: "road_grave", scenes: { start: S("길가에 눈으로 쌓은 무덤. 꽂힌 나무 막대에 이름 대신 빨간 털실이 묶여 있다. 무덤 앞에 통조림 하나가 공물처럼 놓였다.", [
      C("통조림을 가져간다", { fx: { food: 1, human: -4 }, t: "통조림은 차가웠다. 털실이 바람에 흔들렸다." }),
      C("내 것도 하나 놓고 간다", { req: { food: 1 }, fx: { food: -1, human: 5 }, t: "통조림이 둘이 되었다. 누군가는 이걸 보고 덜 외로울 것이다." }),
      C("그냥 지나간다", { t: "빨간 털실. 어디서 본 색이다." }),
    ]) } },
  };
  Object.assign(events, road);
  // 지난 판의 내가 남긴 시신
  const pastSelf = { id: "past_self", art: "past_self", text: "눈 속에 웅크린 시신. {past_who}의 옷차림이다. 이상하게 낯익다. 품에 일기장이 있다. 마지막 장: ‘{past_line}’", choices: [
    C("일기와 짐을 챙긴다", { fx: { pastTake: true }, t: "일기장 첫 장에 적힌 날짜는 없다. 글씨체가 당신 것과 닮았다. 짐을 나눠 졌다. 이번엔 다르게 가겠다." }),
    C("눈을 덮어 묻어 준다", { fx: { human: 4 }, t: "눈을 한 줌씩 덮었다. 이 사람도 남쪽으로 가고 있었다. 당신처럼." }),
  ] };
  // 중심 줄기: 열차의 명단 (모든 판에 반드시 나온다)
  const spine = {
    1: { id: "spine1", art: "past_list", text: "밤, 무전기에서 잡음 섞인 방송이 흘러나온다. 누군가 같은 말을 되풀이한다. “남행 열차는 온다. 정원 마흔. 명단에 있는 자만 태운다. 명단은 셋이 나눠 쥐고 있다. 늑대단의 백곰, 떠돌이 상인 구씨, 하얀나루 역장.” 그리고 끊긴다.", choices: [
      C("마흔이라는 숫자를 곱씹는다", { fx: { fact: "list_rumor" }, t: "이 설원에 살아남은 사람이 몇인지 모른다. 마흔은 너무 적다. 누군가는 탈 것이고, 누군가는 못 탈 것이다." }),
      C("명단 따위 믿지 않는다", { fx: { fact: "list_rumor" }, t: "그래도 그 숫자는 머리에서 떠나지 않았다." }),
    ] },
    2: { id: "spine2", art: "past_list", text: "{spine2_text}", choices: [
      C("기억해 둔다", { fx: { fact: "list_known" }, t: "명단이 어디 있는지 안다는 건, 누군가와 부딪쳐야 한다는 뜻이다." }),
    ] },
  };
  // ── 고도화: 하루를 잇는 문장 재료 ──
  const travel = {
    terrain: {
      1: ["얼어붙은 들판을 가로질렀다. 발자국은 뒤에서 금세 지워졌다.", "무너진 마을들 사이로 길이 이어졌다. 창문마다 성에가 눈처럼 막혀 있었다.", "송전탑 그림자를 하나씩 세며 걸었다. 끊어진 전선이 바람에 울었다.", "눈에 묻힌 차들 지붕을 징검다리 삼아 걸었다."],
      2: ["늑대 머리뼈를 꽂은 말뚝이 띄엄띄엄 박힌 길이었다. 누구의 땅인지 말하지 않아도 알았다.", "협곡 바람이 등을 떠밀었다. 멈추면 넘어질 것 같았다.", "썰매 자국이 여러 갈래로 엇갈렸다. 어떤 자국에는 붉은 얼룩이 섞여 있었다.", "얼어붙은 호숫가를 따라 걸었다. 얼음 아래 무언가 반짝였다."],
      3: ["산이 가까워질수록 공기가 칼날 같았다. 숨을 쉴 때마다 가슴이 아팠다.", "고개가 하늘에 닿아 있었다. 그 너머가 남쪽이다.", "바람이 방향을 잃고 사방에서 불었다. 열차 소리를 들은 것 같았다. 착각이었다."],
    },
    sky: ["하늘은 낮고 무거웠다.", "해가 떴지만 따뜻해지지 않았다.", "오후 내내 가는 눈이 내렸다.", "바람이 잠깐 멎었다. 그 고요가 더 무서웠다.", "멀리서 늑대 울음이 들렸다."],
    body: { hunger: "배가 등에 붙었다. 다리가 자꾸 꺾였다.", cold: "발가락 감각이 없다. 장화 안에서 무언가 얼어 가는 것 같다.", hurt: "상처가 걸음마다 욱신거렸다.", fine: "" },
  };
  // 동행이 길에서 하는 말 (신뢰에 따라)
  const roadTalk = {
    maru: { warm: "마루가 앞장서 바람을 막았다. “내 뒤에 붙어.”", mid: "마루는 말없이 걸었다. 가끔 뒤를 돌아 당신이 따라오는지 봤다.", cold: "마루는 당신과 몇 걸음 떨어져 걸었다." },
    hanbyeol: { warm: "한별이 하늘을 가리켰다. “저 구름 모양이면 내일은 맑아요. 진짜예요.”", mid: "한별이 노래를 흥얼거리다 멈췄다.", cold: "한별은 하루 종일 하늘만 봤다. 당신 쪽은 보지 않았다." },
    hyean: { warm: "혜안이 당신 몫의 짐을 조용히 나눠 졌다.", mid: "혜안이 걸음마다 작게 염불을 외었다.", cold: "혜안은 눈을 감고 걸었다. 당신을 보지 않으려는 것 같았다." },
    eunseo: { warm: "은서가 바람 냄새를 맡았다. “오늘 밤은 덜 추울 거예요. 제가 봐 둔 자리가 있어요.”", mid: "은서가 공책에 무언가를 적었다. 기온, 바람, 그리고 당신 이름.", cold: "은서는 묻는 말에만 짧게 대답했다." },
  };
  // 크게 착하거나 잔인한 선택 앞에서 동행이 보이는 반응
  const reacts = {
    maru: { good: "마루가 짧게 고개를 끄덕였다.", bad: "마루는 아무 말도 하지 않았다. 그날 밤 오래 칼을 갈았다." },
    hanbyeol: { good: "한별이 작게 웃었다. “그래서 같이 가는 거예요.”", bad: "한별이 고개를 돌렸다. 입술을 깨물고 있었다." },
    hyean: { good: "혜안이 조용히 합장했다.", bad: "혜안이 눈을 감았다. 오래. 그리고 아무것도 묻지 않았다." },
    eunseo: { good: "은서가 안경을 고쳐 쓰며 숨을 내쉬었다. 안도한 얼굴이었다.", bad: "은서의 손이 떨렸다. “…꼭 그래야 했어요?”" },
  };
  // 반전 장면 앞에 붙여 그 자리로 이어 주는 문장
  const leads = {
    hk_tA_parent: "백곰의 썰매 자국을 따라 하루 종일 걸었다. 해 질 무렵, 늑대단 캠프 가장자리까지 숨어들었다.",
    hk_tA_deserter: "휘파람 소리를 따라 밤새 걸었다. 늑대단 개 우리의 울타리가 눈앞에 나타났다.",
    hk_tB_deserter: "휘파람 소리를 따라 밤새 걸었다. 늑대단 개 우리의 울타리가 눈앞에 나타났다.",
    hk_tB_parent: "불가에 앉아 품에서 테이프를 꺼냈다. 대원의 품에서 나온 그 테이프다. 오래 망설이다 무전기에 넣었다.",
    fs_tA: "피난처로 간다던 행렬이 사라진 쪽으로 반나절을 따라갔다. 바람에 비명 같은 것이 섞여 왔다.",
    fs_tB: "소문을 확인하러 계곡이 내려다보이는 능선에 올랐다. 김이 오르는 돌담 마을이 정말 거기 있었다.",
    bt_tA: "",
    bt_tB: "",
  };
  // ── TRPG: 막마다 모험 하나 ──
  const adventures = {
    1: { title: "1막 · 다리를 건너라", goal: "남쪽으로 가는 길은 강 위의 끊어진 철교 하나뿐이다. 그 전에 건널 방법을 마련해야 한다.",
      need: [{ item: "rope", label: "밧줄 — 끊긴 철골에 걸 수 있다" }, { companion: "maru", label: "마루 — 짐승만 다니는 길을 안다" }, { food: 2, label: "식량 둘 — 다리 지키는 자들의 통행세" }, { item: "gold_ring", label: "금반지 — 무엇이든 살 수 있다" }] },
    2: { title: "2막 · 검문소를 넘어라", goal: "협곡을 늑대단 검문소가 막고 있다. 넘으려면 통과할 수단이 필요하다. 그리고 열차의 명단이 어디 있는지 알아내야 한다.",
      need: [{ item: "wolf_token", label: "늑대 이빨 표식 — 암호를 대면 지나간다" }, { item: "liquor", label: "술 — 보초의 입을 막는다" }, { item: "cigarettes", label: "담배 — 뇌물" }, { fact: "dochi_saved", label: "도치 — 늑대단만 아는 길" }, { fact: "list_known", label: "명단의 행방" }] },
    3: { title: "3막 · 선로 앞에서", goal: "산을 넘으면 목적지가 갈린다. 열차는 명단의 마흔만 태운다. 지금까지 모은 것으로 결판을 낸다.",
      need: [{ item: "passenger_list", label: "탑승 명단 — 화물칸 문을 연다" }, { fact: "grandson_ok", label: "역장의 손자 — 하얀나루에서 문을 잡아 준다" }, { fact: "gave_medicine", label: "백곰의 빚 — 약값" }, { truths: 3, label: "그 겨울의 진실 셋 — 명단을 불태울 이유" }] },
  };
  // 늑대단 추적 시계가 다 차면: 백곰이 직접 나선다
  const hunt = { id: "hunt", art: "event_rival", text: "썰매개 방울 소리가 사방에서 동시에 울린다. 눈보라 속에서 썰매 넷이 원을 그리며 다가온다. 맨 앞 썰매에서 흰 곰 털옷이 내린다. 백곰이다. 그가 웃는다. “소리가 너무 컸어. 설원 끝까지 다 들리더군.”", choices: [
    C("맞서 싸운다", { check: ["force", 15], win: { t: "백곰의 썰매개 둘이 쓰러지자 늑대단이 주춤했다. 백곰이 손을 들었다. “오늘은 여기까지.” 그들이 물러났다.", fx: { wolves: -1 } }, lose: { t: "눈 위에 쓰러졌다. 그들이 짐을 뒤져 가져갔다. 백곰이 당신 귀에 속삭였다. “다음엔 짐이 아니야.”", fx: { hp: 2, food: -3 } } }),
    C("[늑대 이빨 표식] 표식을 보이며 형제라 말한다", { req: { item: "wolf_token" }, check: ["talk", 12], win: { t: "백곰이 표식을 한참 들여다봤다. “…형제라.” 그가 썰매로 돌아갔다.", fx: { wolves: 1 } }, lose: { t: "“형제는 도망치지 않아.” 표식을 빼앗겼다.", fx: { take: "wolf_token", hp: 1 } } }),
    C("가진 것을 내주고 물린다", { fx: { food: -3, fuel: -2 }, t: "자루가 썰매에 실렸다. 백곰이 당신 어깨를 두드렸다. “현명하군.” 그 손이 오래 남았다." }),
    C("눈보라 속으로 흩어져 달아난다", { check: ["wits", 13], win: { t: "눈보라가 발자국을 지웠다. 방울 소리가 멀어졌다." }, lose: { t: "길을 잃고 하루를 헤맸다. 짐 일부도 버렸다.", fx: { day: 1, food: -1, cold: 1 } } }),
  ] };
  // 눈보라 시계가 다 차면: 길이 막힌다
  const stormBlock = { id: "storm_block", art: "sp_whiteout", text: "아침부터 하늘이 내려앉았다. 사흘 동안 쌓인 바람이 한꺼번에 쏟아진다. 눈보라. 한 걸음 앞도 보이지 않는다. 오늘은 갈 수 없다.", choices: [
    C("움직이지 않고 버틴다 (하루를 잃는다)", { fx: { day: 1, cold: 1 }, t: "하루 종일 눈굴 안에서 서로의 숨소리만 들었다." }),
    C("그래도 간다", { check: ["force", 14], win: { t: "얼굴이 찢어질 것 같았다. 그래도 하루를 잃지 않았다." }, lose: { t: "눈보라가 당신을 삼켰다. 겨우 기어 돌아왔다.", fx: { hp: 1, cold: 2, day: 1 } } }),
  ] };
  // ── TRPG 3단계: 기술 8개 · 상태 · 특성 ──
  const skills = {
    lift: { name: "힘쓰기", stat: "force", desc: "들고, 밀고, 버틴다" },
    fight: { name: "싸움", stat: "force", desc: "덮치고, 맞서고, 제압한다" },
    look: { name: "살피기", stat: "wits", desc: "찾고, 읽고, 알아챈다" },
    hide: { name: "숨기", stat: "wits", desc: "몰래, 조용히, 들키지 않게" },
    persuade: { name: "설득", stat: "talk", desc: "달래고, 흥정하고, 마음을 연다" },
    threat: { name: "위협", stat: "talk", desc: "윽박지르고, 겁을 준다" },
    fix: { name: "수리", stat: "craft", desc: "고치고, 엮고, 만든다" },
    aid: { name: "응급처치", stat: "craft", desc: "상처를 돌본다" },
  };
  // 선택지 문장으로 어떤 기술인지 고른다 (장면 글은 그대로 둔다)
  const skillHints = [
    ["fight", /싸|덮치|맞서|제압|칼|주먹|멱살|뚫는다|밀어붙|밀치|쓰러뜨|쫓아낸|털는다|턴다|빼앗는다/], ["threat", /위협|윽박|칼을 보이|요구|겁을/],
    ["hide", /몰래|숨|기다렸다|살금|기어|어둠|들키지|매복|흩어져|밤을 기다려|틈을 노/], ["aid", /치료|붕대|상처|간호|부목/],
  ];
  const originSkills = {
    parent: { persuade: 1, aid: 1 }, deserter: { fight: 1, hide: 1 }, drifter: { look: 1, hide: 1 },
    crew: { look: 1, fix: 1 }, pilot: { fix: 1, look: 1 },
  };
  const companionSkills = { maru: { fight: 1, look: 1 }, hanbyeol: { fix: 1 }, hyean: { persuade: 1, aid: 1 }, eunseo: { look: 1 } };
  const conditions = {
    fear: { name: "공포", desc: "숨기 +1 · 싸움·위협 −2", mods: { hide: 1, fight: -2, threat: -2 } },
    exhaust: { name: "탈진", desc: "힘쓰기·싸움 −2", mods: { lift: -2, fight: -2 } },
    frost: { name: "동상", desc: "수리·응급처치 −2 (손가락이 말을 안 듣는다)", mods: { fix: -2, aid: -2 } },
    anger: { name: "분노", desc: "싸움·위협 +1 · 설득 −2 · 숨기 −1", mods: { fight: 1, threat: 1, persuade: -2, hide: -1 } },
  };
  const traits = {
    tracker: { name: "눈길의 사냥꾼", desc: "살피기 +1 · 하루에 배가 덜 꺼진다", mods: { look: 1 } },
    wolfeye: { name: "늑대의 눈", desc: "위협 +2 · 마음 약한 동행은 당신을 조금 무서워한다", mods: { threat: 2 } },
    callus: { name: "굳은살", desc: "힘쓰기 +1 · 동상에 걸리지 않는다", mods: { lift: 1 } },
    quiet: { name: "조용한 발", desc: "숨기 +2", mods: { hide: 2 } },
    friend: { name: "말벗", desc: "설득 +1 · 동행의 신뢰가 오른다", mods: { persuade: 1 } },
    medic: { name: "야전 의무병", desc: "응급처치 +2 · 야영 때 다친 사람을 더 잘 돌본다", mods: { aid: 2 } },
    tinker: { name: "고철쟁이", desc: "수리 +1 · 불을 피워도 가끔 연료를 아낀다", mods: { fix: 1 } },
    endure: { name: "버티는 자", desc: "의지 최대 4", mods: {} },
    fearless: { name: "겁 없는", desc: "공포에 빠지지 않는다 · 싸움 +1", mods: { fight: 1 } },
    coldblood: { name: "차가운 피", desc: "분노에 빠지지 않는다 · 살피기 +1", mods: { look: 1 } },
  };
  // 진실 조각 (여러 판에 걸쳐 모은다)
  const truths = {
    radio: { name: "무전의 목소리", text: "딸의 목소리는 3년 전 녹음이었고, 그걸 틀던 건 명단을 쥔 자들이었다." },
    cage: { name: "철창의 밤", text: "백곰이 아이들을 철창에 가둔 건 명단의 자리와 바꾸기 위해서였다." },
    gu: { name: "상인의 장부", text: "명단의 자리를 처음 판 사람은 구씨였다." },
    crew: { name: "넷만 고른 명단", text: "기지 대원 일곱 중 넷만 고른 사람은 남았던 그 대원이었다." },
    pilot: { name: "마흔의 비행", text: "구조 비행은 처음부터 명단의 마흔만 태우러 왔다. 명단 밖은 없었다." },
  };

  // ── TRPG 2단계: 장면마다 접근 방식(힘으로·몰래·말로·꾀로)을 갖춘다. 이야기는 그대로, 방법만 늘린다 ──
  const moreApproaches = {
    "p_village.start": [
      C("집 뒤로 돌아가 창고를 몰래 살핀다", { check: ["wits", 11], win: { t: "창고 문틈으로 들어가 감자 몇 알과 장작을 챙겼다. 노인은 끝내 몰랐다.", fx: { food: 1, fuel: 1, human: -2 } }, lose: { t: "창고 문이 삐걱였다. 노인이 지팡이를 들고 나왔다. 서로 아무 말도 못 한 채 물러났다.", fx: { cold: 1 } } }),
    ],
    "p_church.start": [
      C("염불이 끝나길 기다리지 않고 말을 건다", { check: ["talk", 9], win: { t: "그가 눈을 떴다. 화내지 않았다. “혜안이라 합니다. 남쪽으로 가십니까. 저도 그쪽입니다.”", go: "join" }, lose: { t: "그는 염불을 멈추지 않았다. 당신은 신도석에 앉아 끝날 때까지 기다렸다. 몸이 다 식었다.", fx: { cold: 1 }, go: "join" } }),
      C("기운 종탑에서 마른 들보를 뜯어낸다", { check: ["craft", 11], win: { t: "들보 몇 개를 뜯어냈다. 오래 마른 나무라 잘 탈 것이다.", fx: { fuel: 3, human: -2 } }, lose: { t: "종탑이 크게 흔들렸다. 종이 한 번 울렸다. 그 소리가 설원 끝까지 퍼졌다.", fx: { hp: 1 } } }),
    ],
    "p_cave.start": [
      C("작은 불을 피워 얼음을 천천히 녹인다", { check: ["craft", 11], win: { t: "물방울이 똑똑 떨어지고 드럼이 미끄러져 나왔다. 안쪽 숨소리는 깨지 않았다.", fx: { fuel: 3 } }, lose: { t: "녹은 물이 안쪽으로 흘렀다. 무언가 몸을 뒤척였다. 연료통 하나만 들고 뛰었다.", fx: { fuel: 1, hp: 1 } } }),
    ],
    "p_cabin.start": [
      C("문을 박차고 들어가 총부터 빼앗는다", { check: ["force", 14], win: { t: "총구가 천장을 향했다. 거구의 사내가 당신 손목을 잡은 채 웃었다. “배짱 좋군. 마루다.”", go: "join" }, lose: { t: "개머리판이 먼저였다. 눈밭에 쓰러졌다. 문이 다시 닫혔다.", fx: { hp: 1 } } }),
    ],
    "p_observatory.start": [
      C("꺼져 가는 발전기를 손봐 준다", { check: ["craft", 10], win: { t: "발전기가 고르게 돌기 시작했다. 관측소 안이 조금 따뜻해졌다. 여자가 처음으로 웃었다. “…은서예요.”", fx: { cold: -2 }, go: "join" }, lose: { t: "발전기가 연기를 뿜고 멈췄다. 둘 다 한참 떨었다.", fx: { cold: 1 }, go: "join" } }),
    ],
    "p_pylon.start": [
      C("외상 없이 값을 깎는다", { check: ["talk", 12], win: { t: "구씨가 혀를 찼다. “장사꾼 울리는 손님이군.” 붕대 하나를 그냥 던져 줬다.", fx: { item: "bandage" } }, lose: { t: "“그럼 외상이지.” 구씨가 장부에 당신 이름을 적고 붕대를 건넸다.", fx: { item: "bandage", debt: { id: "gu", text: "상인 구씨에게 외상을 졌다", owe: true } } } }),
      C("개들을 제압하고 짐을 턴다", { check: ["force", 13], win: { t: "개들이 낑낑대며 물러났다. 썰매에서 항생제 한 병을 낚아챘다. 구씨의 욕설이 멀리까지 따라왔다.", fx: { item: "antibiotics", human: -8, debt: { id: "gu", text: "구씨의 썰매를 털었다" } } }, lose: { t: "개 한 마리가 팔을 물었다. 구씨가 웃었다. “다음엔 물리지 말고 사.”", fx: { hp: 1, debt: { id: "gu", text: "구씨의 썰매를 털려다 들켰다" } } } }),
    ],
    "p_highway.start": [
      C("차 엔진룸에서 연료를 빼낸다", { check: ["craft", 11], win: { t: "얼어붙은 연료관을 녹여 깡통 두 개를 채웠다.", fx: { fuel: 2 }, go: "join" }, lose: { t: "연료가 얼굴로 튀었다. 한참 눈이 따가웠다.", fx: { cold: 1 }, go: "join" } }),
    ],
    "g_bridge.start": [
      C("부서진 차 문짝들을 엮어 끊긴 자리에 걸친다", { check: ["craft", 13], win: { t: "문짝 세 개를 철사로 묶어 다리를 놓았다. 삐걱였지만 건넜다." }, lose: { t: "문짝 하나가 빠졌다. 짐 하나가 강으로 떨어졌다. 겨우 건넜다.", fx: { hp: 1, food: -1 } } }),
    ],
    "p_merchant.start": [
      C("짐 사이를 몰래 살핀다", { check: ["wits", 12], win: { t: "방수포 밑에 사슬과 아이 신발. 그리고 이름과 숫자가 적힌 장부. 사람값이다.", fx: { fact: "gu_chains", clue: "fs" } }, lose: { t: "구씨의 눈이 가늘어졌다. “손님, 장사 방해하면 값이 올라.”", fx: { food: -1 } } }),
      C("구씨를 위협해 약을 빼앗는다", { check: ["force", 12], win: { t: "구씨가 항생제를 내밀며 웃었다. 금니가 떨렸다. “기억해 두지.”", fx: { item: "antibiotics", human: -8, debt: { id: "gu", text: "구씨를 위협해 약을 빼앗았다" } } }, lose: { t: "구씨의 개들이 덤볐다. 구씨는 휘파람을 불며 썰매를 몰고 떠났다.", fx: { hp: 1, debt: { id: "gu", text: "구씨를 위협하려다 쫓겨났다" } } } }),
    ],
    "p_mine.start": [
      C("막힌 갱도를 힘으로 뚫는다", { check: ["force", 12], win: { t: "돌을 치우자 안쪽에서 석탄 더미가 나왔다. 망치 소리가 멈추고 누군가 웃었다.", fx: { fuel: 3, fact: "helped_village" } }, lose: { t: "천장에서 돌이 쏟아졌다. 망치 소리가 멎었다.", fx: { hp: 1 } } }),
      C("망치 소리를 향해 소리쳐 말을 건다", { check: ["talk", 10], win: { t: "늙은 광부가 등불을 들고 나왔다. 당신 얼굴을 보더니 갱도 안 마을로 데려갔다. 따뜻한 국 한 그릇.", fx: { food: 1, cold: -2, fact: "helped_village", fact2: "grandson_sign" } }, lose: { t: "망치 소리가 뚝 그쳤다. 아무도 나오지 않았다.", fx: { cold: 1 } } }),
    ],
    "p_kennel.start": [
      C("개들이 깊이 잠들 때까지 기다렸다 몰래 다가간다", { check: ["wits", 13], win: { t: "새벽, 개들의 숨소리가 고를 때 사슬을 풀었다. 소년이 속삭였다. “도치예요.”", fx: { fact: "dochi_saved", human: 8, debt: { id: "dochi", good: true, text: "사슬에 묶인 소년 도치를 구했다" } } }, lose: { t: "한 마리가 눈을 떴다. 우리 전체가 짖었다. 소년을 두고 뛰었다.", fx: { wolves: -2, debt: { id: "dochi", text: "사슬에 묶인 소년을 두고 도망쳤다" } } } }),
      C("보초를 찾아가 소년을 사겠다고 한다", { req: { food: 2 }, check: ["talk", 12], win: { t: "보초가 식량 자루를 들어 보고 웃었다. “어차피 먹는 입이야.” 사슬 열쇠를 던졌다.", fx: { food: -2, fact: "dochi_saved", human: 6, debt: { id: "dochi", good: true, text: "식량을 주고 소년 도치를 데려왔다" } } }, lose: { t: "보초가 식량만 받고 웃었다. “꺼져.”", fx: { food: -2, wolves: -1 } } }),
    ],
    "p_lake.start": [
      C("판자로 썰매를 엮어 얼음 위를 미끄러진다", { check: ["craft", 12], win: { t: "얼음 위를 미끄러지듯 건넜다. 반나절을 벌었다.", fx: { day: -1 } }, lose: { t: "썰매가 얇은 얼음을 깼다. 물에 빠지기 직전에 뛰어내렸다.", fx: { cold: 2 } } }),
    ],
    "p_wolfcamp.start": [
      C("모닥불에 기름을 끼얹어 혼란을 만든다", { check: ["craft", 13], win: { t: "불길이 치솟았다. 늑대단이 우왕좌왕하는 사이 창고에서 식량을 퍼냈다. 백곰의 텐트 안에서 아이 기침 소리가 났다.", fx: { food: 3, wolves: -2, fact: "saw_sick_child", clue: "hk" } }, lose: { t: "불이 바람을 타고 이쪽으로 왔다. 겨우 빠져나왔다. 늑대단이 당신 얼굴을 봤다.", fx: { hp: 1, wolves: -2 } } }),
    ],
    "g_pass.start": [
      C("바람이 약한 능선을 찾아 돌아간다", { check: ["wits", 12], win: { t: "바위 그늘을 따라 바람을 피해 넘었다. 손가락 하나 얼지 않았다." }, lose: { t: "능선을 잘못 골랐다. 하루를 헤맸다.", fx: { day: 1, cold: 1 } } }),
    ],
    "p_village2.start": [
      C("유리 너머로 말을 걸어 진정시킨다", { check: ["talk", 11], win: { t: "두드리던 손이 멈췄다. 안에서 할머니가 녹슨 비상문 손잡이를 가리켰다. 문이 열렸다. 할머니가 초콜릿 상자를 내밀었다.", fx: { food: 2, human: 5 } }, lose: { t: "두드리는 소리가 점점 약해졌다. 그리고 멈췄다.", fx: { human: -2 } } }),
    ],
    "p_church2.start": [
      C("납골당 뒤 통로로 몰래 들어가 창고를 뒤진다", { check: ["wits", 12], win: { t: "그들의 비축품에서 천과 술 한 병을 슬쩍했다. 기도 소리는 끊기지 않았다.", fx: { item: ["cloth", "liquor"], human: -4 } }, lose: { t: "아이 하나가 당신을 봤다. 소리를 지르진 않았다. 그 눈이 더 아팠다. 빈손으로 나왔다.", fx: { human: -2 } } }),
    ],
    "p_cave2.start": [
      C("얼음을 깨서 상자를 꺼낸다", { check: ["force", 11], win: { t: "상자가 얼음째 빠져나왔다. 안에 라이터와 쪽지. ‘지열 계곡은 진짜다. — 박’", fx: { item: ["lighter", "refuge_note"], fact: "refuge_known" } }, lose: { t: "얼음 파편이 튀어 손등을 그었다. 상자는 꿈쩍도 하지 않았다.", fx: { hp: 1 } } }),
    ],
    "p_cabin2.start": [
      C("벽의 덫을 손봐 오두막 둘레에 놓는다", { check: ["craft", 11], win: { t: "밤사이 산토끼 둘이 걸렸다.", fx: { food: 2 } }, lose: { t: "덫이 손가락을 물었다.", fx: { hp: 1 } } }),
    ],
    "p_observatory2.start": [
      C("무전 숫자를 끝까지 받아 적는다", { check: ["wits", 11], win: { t: "“…정원 마흔. 명단은 하얀나루역장이 보관…” 받아 적은 숫자들 사이에서 열차 시간이 보였다.", fx: { fact: "list_rumor" }, go: "join" }, lose: { t: "배터리가 먼저 죽었다. 숫자 몇 개만 남았다.", go: "join" } }),
    ],
    "p_pylon2.start": [
      C("돌을 쌓아 디딤대를 만들고 끈을 끊는다", { check: ["craft", 11], win: { t: "디딤대 위에서 끈을 끊었다. 그가 무너지듯 내려와 금반지를 쥐여 줬다.", fx: { item: "gold_ring", human: 8, wolves: -1, fact: "list_rumor" } }, lose: { t: "디딤대가 무너졌다. 발목을 접질렸다.", fx: { hp: 1 } } }),
      C("지나가는 늑대단 썰매를 세워 풀어 달라고 한다", { check: ["talk", 13], win: { t: "늑대단이 비웃더니 끈을 끊어 줬다. “본보기는 하루면 충분하지.”", fx: { human: 5, wolves: 1 } }, lose: { t: "“너도 같이 매달아 줄까?” 썰매가 지나가며 채찍이 날아왔다.", fx: { hp: 1, wolves: -1 } } }),
    ],
    "p_highway2.start": [
      C("두 무리를 다 쫓아낸다", { check: ["force", 14], win: { t: "고함 한 번에 두 무리가 흩어졌다. 상자는 당신 것이다.", fx: { food: 4, human: -5 }, go: "join" }, lose: { t: "두 무리가 동시에 덤볐다.", fx: { hp: 2 }, go: "join" } }),
    ],
    "g_bridge2.start": [
      C("밤을 기다려 판자 길을 몰래 건넌다", { check: ["wits", 13], win: { t: "사내들이 불가에서 졸 때 판자를 건넜다. 아무도 몰랐다." }, lose: { t: "판자가 삐걱였다. 붙잡혀 짐을 털렸다.", fx: { food: -2, hp: 1 } } }),
      C("통행세를 깎는다", { check: ["talk", 12], win: { t: "사내가 웃었다. “말 잘하네.” 식량 하나만 받았다.", fx: { food: -1 } }, lose: { t: "사내가 정색했다. 식량 둘을 받고, 덤으로 주먹 한 대.", fx: { food: -2, hp: 1 } } }),
    ],
    "p_merchant2.start": [
      C("지렛대를 대고 썰매를 들어 올린다", { check: ["craft", 10], win: { t: "부서진 썰매 판자로 지렛대를 댔다. 구씨가 기어 나왔다. “빚은 없던 걸로 하지. 그리고 이거.” 피난처 쪽지.", fx: { unfact: "owe_gu", item: "refuge_note", fact: "refuge_known", debt: { id: "gu", good: true, text: "썰매에 깔린 구씨를 구했다" } } }, lose: { t: "지렛대가 부러졌다. 구씨가 비명을 질렀다.", fx: { hp: 1 } } }),
    ],
    "p_mine2.start": [
      C("맨손으로 큰 돌을 밀어낸다", { check: ["force", 13], win: { t: "돌이 굴러 나갔다. 늙은 광부 둘이 기어 나와 당신 손을 잡았다. 석탄 한 자루.", fx: { fuel: 3, human: 6, fact: "helped_village" } }, lose: { t: "돌은 꿈쩍도 하지 않았다. 어깨가 빠질 것 같았다. 두드리는 소리가 약해졌다.", fx: { hp: 1 } } }),
    ],
    "p_kennel2.start": [
      C("지름길로 앞질러 매복한다", { check: ["wits", 12], win: { t: "골짜기 끝 바위 뒤에서 기다렸다. 늑대단 둘이 지나갈 때 소년을 낚아챘다. “…도치예요.”", fx: { fact: "dochi_saved", human: 8, debt: { id: "dochi", good: true, text: "쫓기던 소년 도치를 구했다" } } }, lose: { t: "길을 잘못 들었다. 멀리서 소년의 비명이 들렸다.", fx: { debt: { id: "dochi", text: "쫓기던 소년을 구하지 못했다" } } } }),
    ],
    "p_lake2.start": [
      C("낚싯줄을 얼음에 고정하고 천천히 감는다", { check: ["craft", 10], win: { t: "한참을 감았다. 팔뚝만 한 물고기가 올라왔다.", fx: { food: 2 } }, lose: { t: "줄이 끊어졌다. 손바닥이 다 까졌다.", fx: { cold: 1 } } }),
    ],
    "g_checkpoint2.start": [
      C("보초를 설득해 여자를 보내게 한다", { check: ["talk", 13], win: { t: "“이 여자 남편이 백곰 일꾼이었소.” 거짓말이었다. 보초가 망설이다 아이를 돌려줬다. 당신도 그 틈에 지나갔다.", fx: { human: 6, debt: { id: "mother", good: true, text: "검문소에서 아이 엄마를 거짓말로 구했다" } } }, lose: { t: "보초가 당신을 노려봤다. 둘 다 몸수색을 당했다.", fx: { food: -1 } } }),
      C("보초를 밀치고 아이를 되찾는다", { check: ["force", 13], win: { t: "아이를 엄마 품에 안겨 주고 함께 차단봉 너머로 뛰었다. 등 뒤에서 호루라기.", fx: { human: 8, wolves: -2 } }, lose: { t: "보초 셋이 덤볐다. 겨우 차단봉을 넘었다.", fx: { hp: 2, wolves: -2 } } }),
    ],
  };
  for (const [key, list] of Object.entries(moreApproaches)) {
    const [eid, sid] = key.split(".");
    const sc = events[eid] && events[eid].scenes[sid];
    if (!sc) continue;
    // 판정 없는 '그냥 지나간다'류는 맨 뒤로
    const plain = sc.choices.filter((c) => !c.check && !c.req && !c.fx?.join && !c.go);
    sc.choices = [...sc.choices.filter((c) => !plain.includes(c)), ...list, ...plain];
  }

  const api = { items, recipes, origins, people, cast, places, events, premises, originBeats, climax, endings, setpieces, memory, confront, narrators, road, pastSelf, truths, spine, travel, roadTalk, reacts, leads, adventures, hunt, stormBlock, skills, skillHints, originSkills, companionSkills, conditions, traits };
  root.JourneyContent = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
