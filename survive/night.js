"use strict";
// 밤 탐색 확장: 장비, 장소 위험, 질문 6종(탐색·조우·함정·유혹·갈등·추격), 정체를 모르는 장면, 다시 찾은 곳.
// {food}{wood}{meds}{rival}{shelter}는 시나리오 단어로, {p1}은 함께 간 사람 이름으로 바뀐다.
(function (root) {
  const KINDS = { search: "탐색", meet: "조우", trap: "함정", tempt: "유혹", conflict: "갈등", chase: "추격", revisit: "다시 찾은 곳" };
  // 장비. tool: 그 이름이 붙은 선택지 +2 · tag: 그 종류 장면 +2 · wits: 살피기 +1 · carry: 가져오는 양 배수
  // guard: 장소 위험 막기 · armor: 다칠 때 한 번 막기 · gun: 조우·추격에서 '쏜다' · quiet: 소음 −1 · scan: 남은 양 탐지 · warm: 집 추위 막기
  // uses: 쓸 때마다 줄고 0이면 사라짐(등불은 나갈 때마다 기름 1)
  const gear = {
    crowbar: { name: "쇠지레", icon: "🪛", desc: "문·잔해를 여는 판정 +2" },
    knife: { name: "칼", icon: "🔪", desc: "몸싸움 판정 +2" },
    lamp: { name: "등불", icon: "🏮", desc: "살피기 +1 · 어둠 판정 +2 · 기름이 닳는다", wits: 1, uses: 4 },
    rope: { name: "밧줄", icon: "🪢", desc: "함정 장면 +2", tag: "trap" },
    medkit: { name: "구급상자", icon: "🩹", desc: "밖에서 다칠 때 막아 준다 (2번)", armor: true, uses: 2 },
    pack: { name: "큰 배낭", icon: "🎒", desc: "가져오는 양 ×1.5", carry: 1.5 },
    gasmask: { name: "방독면", icon: "😷", desc: "오염 지역 피폭을 막는다", guard: "rad", scen: "nuclear" },
    geiger: { name: "가이거 계수기", icon: "📟", desc: "들어간 곳에 남은 양을 알려 준다", scan: true, scen: "nuclear" },
    pistol: { name: "권총", icon: "🔫", desc: "조우·추격에서 '쏜다' (총알 3)", gun: true, uses: 3, scen: "nuclear" },
    snowshoe: { name: "설피", icon: "🥾", desc: "소음 −1 · 추격 +2", quiet: 1, tag: "chase", scen: "iceage" },
    furcoat: { name: "털옷", icon: "🧥", desc: "동상을 막는다 · 집에서 추위를 막는다", guard: "cold", warm: true, scen: "iceage" },
    rifle: { name: "사냥총", icon: "🎯", desc: "조우·추격에서 '쏜다' (총알 3)", gun: true, uses: 3, scen: "iceage" },
    boat: { name: "고무보트", icon: "🛶", desc: "물길 위험을 막는다 · 가져오는 양 ×1.3", guard: "water", carry: 1.3, scen: "flood" },
    boots: { name: "고무장화", icon: "👢", desc: "함정(감전·급류) 장면 +2", tag: "trap", scen: "flood" },
    torch: { name: "방수 손전등", icon: "🔦", desc: "살피기 +1 · 어둠 판정 +2 · 닳지 않는다", wits: 1, alias: "lamp", scen: "flood" },
  };
  const startGear = { nuclear: ["crowbar", "knife", "lamp", "rope", "gasmask"], iceage: ["crowbar", "knife", "lamp", "rope", "snowshoe"], flood: ["crowbar", "knife", "lamp", "rope", "boots"] };
  // 장소 위험: 막는 장비가 없으면 장면마다 누군가 다칠 수 있다
  const hazards = {
    rad: { name: "오염", icon: "☢", hit: "피폭", text: "계측기 없이도 안다. 공기가 쓰다." },
    cold: { name: "혹한", icon: "🥶", hit: "동상", text: "손가락 끝의 감각이 사라진다." },
    water: { name: "급류", icon: "🌊", hit: "물살", text: "발밑의 물이 끌어당긴다." },
  };
  const placeHazard = { nuclear: { hospital: "rad", depot: "rad" }, iceage: { plane: "cold", station: "cold", finale: "cold" }, flood: { wreck: "water", pharmacy: "water" } };

  const S = (id, loc, kind, text, approaches, extra = {}) => ({ id, loc, kind, text, approaches, ...extra });
  const A = (label, stat, dc, win, lose, tool, extra = {}) => ({ label, stat, dc, win, lose, tool, ...extra });
  const AUTO = (label, out, extra = {}) => ({ label, stat: "wits", dc: 0, auto: true, win: out, lose: out, noise: 0, ...extra });
  // 정체를 모르는 장면: truths 중 하나가 몰래 정해지고, 고른 뒤에야 드러난다. by[i]가 그 진실에서 i번째 선택지의 결과
  const M = (id, loc, kind, text, approaches, truths) => ({ id, loc, kind, text, approaches, truths });

  // ── 모든 재난 공통 ──
  const common = [
    M("c_breath", null, "meet", "어둠 속에서 숨소리가 들린다. 가까이. 아주 가까이.", [
      A("불을 비춘다", "wits", 11, null, null, "lamp", { noise: 1 }),
      A("먼저 덮친다", "force", 12, null, null, "knife", { noise: 3 }),
      AUTO("숨을 죽이고 기다린다", null, { noise: -2 }),
    ], [
      { reveal: "다친 아이였다. 무릎을 끌어안고 떨고 있다.", by: [
        { win: { join: true, loot: { hope: 5 }, text: "아이를 업고 나왔다. 아이는 끝까지 이름을 말하지 않았다." }, lose: { stress: 10, text: "아이는 비명을 지르며 어둠 속으로 달아났다." } },
        { win: { stress: 25, loot: { hope: -6 }, text: "덮치고 나서야 알았다. 아이의 울음이 멈추지 않는다." }, lose: { stress: 20, text: "아이가 손을 물고 달아났다. 손이 떨린다." } },
        { win: { stress: 10, text: "숨소리는 새벽 무렵 멎었다. 아무도 확인하러 가지 않았다." }, lose: { stress: 10, text: "숨소리는 새벽 무렵 멎었다." } },
      ] },
      { reveal: "{rival}의 사람이었다. 칼날이 번뜩인다.", by: [
        { win: { rivalAlert: true, text: "빛에 눈이 먼 사이 달아났다. 얼굴을 봤다. 그쪽도 봤다." }, lose: { harm: 1, rivalAlert: true, text: "빛이 위치를 알려 줬다. 칼이 먼저 왔다." } },
        { win: { loot: { food: 2 }, gear: "knife", text: "먼저 쓰러뜨렸다. 주머니에서 {food}과 칼이 나왔다." }, lose: { harm: 2, text: "상대가 더 빨랐다." } },
        { win: { text: "발소리가 멀어졌다. 한참 뒤에야 숨을 쉬었다." }, lose: { text: "발소리가 멀어졌다." } },
      ] },
      { reveal: "굶주린 개였다. 갈비뼈가 드러났다.", by: [
        { win: { text: "개는 빛을 보고 물러났다." }, lose: { harm: 1, text: "개가 다리를 물었다. 상처가 깊다." } },
        { win: { loot: { food: 2 }, stress: 10, text: "개를 잡았다. 오늘 밤은 고기가 있다." }, lose: { harm: 1, text: "개가 팔을 물고 놓지 않았다." } },
        { win: { text: "개는 냄새를 맡다 사라졌다." }, lose: { text: "개는 냄새를 맡다 사라졌다." } },
      ] },
    ]),
    M("c_door", null, "meet", "잠긴 문 너머에서 누군가 속삭인다. “거기 누구야… 혼자야?”", [
      A("혼자라고 답한다", "talk", 12, null, null),
      A("문을 부순다", "force", 13, null, null, "crowbar", { noise: 4 }),
      AUTO("대답하지 않고 물러난다", { stress: 5, text: "속삭임이 등 뒤로 따라왔다. “…혼자구나.”" }, { noise: 0 }),
    ], [
      { reveal: "노인 혼자였다. 마지막 {food}을 지키고 있었다.", by: [
        { win: { loot: { food: 2, hope: 3 }, text: "노인은 문을 열고 {food}를 나눠 줬다. “젊은 사람이 먹어야지.”" }, lose: { text: "노인은 끝내 문을 열지 않았다." } },
        { win: { loot: { food: 3, hope: -8 }, stress: 20, text: "노인이 바닥에 쓰러져 있었다. {food}만 챙겼다." }, lose: { stress: 10, text: "문은 버텼다. 안에서 흐느끼는 소리가 났다." } },
      ] },
      { reveal: "함정이었다. 문 뒤에 셋이 기다리고 있었다.", by: [
        { win: { text: "목소리가 바뀌는 걸 눈치채고 물러났다." }, lose: { harm: 1, lose: 0.5, text: "문이 열리고 손이 뻗어 왔다. 짐 절반을 빼앗겼다." } },
        { win: { harm: 1, loot: { food: 2 }, text: "문이 부서지자 셋이 덮쳤다. 겨우 이겼다." }, lose: { harm: 2, lose: 0.5, text: "부서진 문틈으로 쇠파이프가 날아왔다." } },
      ] },
    ]),
    S("c_pocket", null, "conflict", "{p1}이(가) 방금 주운 {food}을(를) 몰래 주머니에 넣는 걸 봤다.", [
      A("조용히 내놓으라고 한다", "talk", 12, { loot: { food: 2 }, text: "{p1}은(는) 말없이 꺼내 놓았다. 얼굴이 붉어졌다." }, { p1Stress: 20, text: "“내가 찾은 거야.” {p1}은(는) 끝내 내놓지 않았다." }),
      A("못 본 척한다", "wits", 0, { p1Stress: -10, loot: { food: -1 }, text: "{p1}은(는) 돌아오는 내내 당신 눈치를 봤다." }, null, null, { auto: true, noise: 0 }),
      A("멱살을 잡는다", "force", 11, { loot: { food: 2 }, p1Stress: 30, text: "{p1}은(는) 내놓았다. 그리고 다시는 당신 옆에서 걷지 않았다." }, { p1Harm: 1, p1Stress: 25, text: "몸싸움 끝에 {p1}이(가) 넘어져 다쳤다." }, null, { noise: 3 }),
    ], { minParty: 2 }),
    S("c_turnback", null, "conflict", "{p1}이(가) 걸음을 멈춘다. “더는 못 가. 이러다 다 죽어. 돌아가자.”", [
      A("설득한다", "talk", 12, { p1Stress: -10, loot: { hope: 2 }, text: "{p1}이(가) 이를 악물고 다시 걸었다." }, { p1Stress: 15, text: "{p1}은(는) 따라왔지만 눈이 텅 비어 있었다." }),
      A("혼자라도 돌려보낸다", "wits", 0, { p1Home: true, text: "{p1}이(가) 혼자 어둠 속으로 돌아갔다. 무사히 도착했을까." }, null, null, { auto: true, noise: 0 }),
      A("윽박지른다", "force", 10, { p1Stress: 25, text: "{p1}은(는) 따라왔다. 증오가 등에 꽂혔다." }, { p1Stress: 30, loot: { hope: -3 }, text: "{p1}이(가) 소리쳤다. 어둠 속 어딘가에서 무언가 움직였다." }, null, { noise: 3 }),
    ], { minParty: 2 }),
    S("c_hurtfriend", null, "conflict", "{p1}이(가) 발목을 접질렸다. 업고 가면 느리고 시끄럽다. 두고 가면… 돌아올 수 있을까.", [
      A("업고 간다", "force", 12, { text: "숨이 턱까지 찼지만 함께 걸었다." }, { lose: 0.5, text: "결국 짐 절반을 버리고 {p1}을(를) 업었다." }, null, { noise: 3 }),
      A("부목을 대 준다", "craft", 12, { text: "나뭇가지와 천으로 발목을 묶었다. 걸을 만하다." }, { p1Harm: 1, text: "잘못 묶었다. 발목이 퉁퉁 부었다." }, "rope"),
      A("여기서 기다리라고 한다", "wits", 0, { p1Home: true, p1Stress: 30, text: "{p1}을(를) 기둥 뒤에 두고 왔다. {p1}은(는) 새벽에 혼자 기어 돌아왔다." }, null, null, { auto: true, noise: 0 }),
    ], { minParty: 2 }),
    S("c_corpse", null, "tempt", "길 한가운데 시신. 등에 멘 배낭이 아직 불룩하다. 누군가 이걸 미끼로 썼을 수도 있다.", [
      A("재빨리 배낭을 챙긴다", "wits", 12, { gear: "pack", loot: { food: 2 }, text: "큰 배낭과 {food}. 시신의 손이 배낭끈을 놓지 않아 손가락을 펴야 했다." }, { harm: 1, rivalAlert: true, text: "줄이 당겨지며 깡통이 울렸다. 누군가 달려왔다." }, null, { noise: 2 }),
      A("멀리서 한참 지켜본다", "wits", 14, { gear: "pack", text: "아무도 오지 않았다. 배낭을 챙겼다." }, { stress: 10, text: "기다리는 사이 다른 누군가가 먼저 가져갔다." }, null, { noise: 0 }),
      AUTO("지나친다", { text: "등 뒤에서 깡통 소리가 났다. 다른 누군가가 걸린 모양이다." }),
    ]),
    S("c_kit", null, "tempt", "부서진 구급차. 뒷문 안에 구급상자가 보인다. 운전석의 사람은… 아직 움직인다.", [
      A("구급상자만 챙긴다", "wits", 9, { gear: "medkit", stress: 20, text: "구급상자를 들고 나왔다. 뒤에서 “도와줘…” 소리가 따라왔다." }, { stress: 20, text: "손이 떨려 상자를 떨어뜨렸다. 다 쏟아졌다." }),
      A("운전사를 꺼낸다", "force", 13, { join: true, loot: { hope: 5 }, text: "운전사를 끌어냈다. 구급상자는 그의 상처에 다 썼다." }, { harm: 1, text: "차가 기울며 깔릴 뻔했다." }, "crowbar", { noise: 3 }),
    ]),
    S("c_wire", null, "trap", "발목 높이에 가는 철사. 따라가 보니 깡통이 줄줄이 매달려 있다. 누군가의 경보다.", [
      A("철사를 넘어간다", "wits", 12, { loot: { food: 2 }, text: "경보 너머엔 누군가 숨겨 둔 {food}이(가) 있었다." }, { rivalAlert: true, stress: 10, text: "깡통이 울렸다. 멀리서 고함." }, "lamp", { noise: 1 }),
      A("철사를 걷어 간다", "craft", 11, { gear: "rope", text: "철사와 밧줄을 감아 챙겼다." }, { rivalAlert: true, text: "깡통이 울렸다." }, null, { noise: 1 }),
    ]),
  ];
  // 소음이 넘치면 나오는 추격 장면
  const chase = [
    S("ch_steps", "*chase", "chase", "소리를 너무 많이 냈다. 뒤에서 발소리가 겹친다. 하나, 둘… 셋.", [
      A("짐을 버리고 뛴다", "force", 0, { lose: 1, text: "모든 걸 버리고 뛰었다. 살았다. 빈손으로." }, null, null, { auto: true }),
      A("숨는다", "wits", 13, { text: "숨을 참았다. 발소리가 바로 옆을 지나갔다." }, { harm: 1, lose: 0.5, text: "들켰다. 짐 절반과 피를 흘리며 도망쳤다." }, "snowshoe", { noise: -3 }),
      A("돌아서서 맞선다", "force", 14, { loot: { food: 2 }, text: "어둠 속에서 엉켜 싸웠다. 상대가 먼저 달아났다." }, { harm: 2, text: "셋을 당할 수는 없었다." }, "knife"),
    ]),
    S("ch_pack", "*chase", "chase", "울음소리 같은 것이 사방에서 대답한다. 무리다. 이쪽으로 온다.", [
      A("짐을 던져 주고 달린다", "force", 0, { lose: 0.6, text: "짐을 미끼로 던졌다. 뒤에서 뜯어먹는 소리." }, null, null, { auto: true }),
      A("높은 곳으로 기어오른다", "force", 12, { text: "녹슨 사다리 위에서 새벽을 기다렸다." }, { harm: 1, text: "다리를 물렸다. 겨우 올라갔다." }, "rope"),
      A("불을 피워 버틴다", "craft", 13, { loot: { wood: -1 }, text: "불이 꺼지지 않게 밤새 지켰다." }, { harm: 1, stress: 15, text: "불이 꺼지는 순간 덮쳐 왔다." }, "lamp"),
    ]),
    S("ch_collapse", "*chase", "chase", "소리가 울리자 천장에서 먼지가 떨어진다. 건물 전체가 신음한다.", [
      A("짐을 버리고 출구로 뛴다", "force", 0, { lose: 0.5, text: "뒤에서 천장이 무너졌다. 짐 절반이 그 밑에 깔렸다." }, null, null, { auto: true }),
      A("기둥 옆에 웅크린다", "wits", 13, { text: "무너지는 소리가 그칠 때까지 웅크렸다. 살았다." }, { harm: 2, text: "콘크리트 덩어리가 등을 쳤다." }),
    ]),
  ];
  // 이미 다 본 곳을 다시 찾았을 때
  const revisit = [
    S("rv_corner", "*revisit", "revisit", "지난번에 왔던 그 자리다. 네가 열어 둔 문, 네가 남긴 발자국. 다른 발자국도 있다.", [
      A("남은 구석을 샅샅이 뒤진다", "wits", 12, { loot: { food: 1, wood: 1, meds: 1 }, text: "놓쳤던 구석에서 몇 개를 더 찾았다." }, { stress: 10, text: "누군가 이미 다 쓸어 갔다." }, "lamp", { noise: 1 }),
      A("벽을 뜯어 본다", "force", 13, { loot: { food: 2, wood: 2 }, text: "벽 속에 숨겨 둔 것이 있었다." }, { harm: 1, text: "벽이 무너졌다." }, "crowbar", { noise: 4 }),
    ]),
    S("rv_trace", "*revisit", "revisit", "다시 온 이곳은 지난번과 다르다. 누군가 여기서 밤을 보냈다. 모닥불이 아직 따뜻하다.", [
      A("흔적을 따라간다", "wits", 13, { loot: { food: 2, meds: 1 }, text: "흔적 끝에 누군가의 은닉처가 있었다." }, { rivalAlert: true, stress: 10, text: "흔적 끝에서 그들과 마주쳤다. 서로 물러났다." }),
      AUTO("불씨만 챙겨 돌아간다", { loot: { wood: 1 }, text: "불씨를 깡통에 담아 왔다." }),
    ]),
    S("rv_trap", "*revisit", "revisit", "다시 온 이곳. 지난번엔 없던 줄이 문틀에 걸려 있다. 누군가 여길 자기 것으로 정했다.", [
      A("줄을 피해 들어간다", "wits", 13, { loot: { food: 2, wood: 1 }, text: "그들이 쌓아 둔 몫을 조금 덜어 왔다." }, { harm: 1, rivalAlert: true, text: "줄에 걸렸다. 머리 위에서 무언가 떨어졌다." }, "rope", { noise: 1 }),
      AUTO("손대지 않고 돌아간다", { text: "여기도 이제 남의 땅이다." }),
    ]),
    S("rv_body", "*revisit", "revisit", "지난번 그 자리. 그때 없던 시신이 있다. 우리처럼 뒤지러 왔던 사람이다.", [
      A("주머니를 뒤진다", "wits", 10, { loot: { food: 1, meds: 1 }, stress: 10, text: "그도 별것 없었다. 우리처럼." }, { stress: 15, text: "얼굴을 봤다. 아는 얼굴이었다." }),
      A("어떻게 죽었는지 살핀다", "wits", 12, { loot: { hope: 2 }, text: "천장이 무너진 거다. 저쪽 기둥은 피해야 한다." }, { harm: 1, text: "같은 천장이 또 무너졌다." }, "lamp"),
    ]),
  ];

  // ── 재난별 추가 장면 ──
  const extra = {
    nuclear: [
      S("n_freezer", "mart", "trap", "냉동 창고 문이 반쯤 열려 있다. 안은 칠흑. 썩은 냄새 사이로 무언가 똑, 똑 떨어진다.", [
        A("불을 비추며 들어간다", "wits", 13, { loot: { food: 4 }, text: "얼음 사이에 통조림 상자. 떨어지던 건… 보지 않기로 했다." }, { harm: 1, text: "바닥이 꺼졌다. 아래층으로 떨어졌다." }, "lamp"),
        A("밧줄을 매고 내려간다", "craft", 12, { loot: { food: 5 }, text: "천천히, 아주 천천히. 상자 두 개를 끌어올렸다." }, { stress: 15, text: "밧줄이 미끄러졌다. 손바닥이 다 까졌다." }, "rope"),
      ]),
      M("n_crouch", "mart", "meet", "통로 끝에 누군가 쭈그려 앉아 있다. 움직이지 않는다.", [
        A("다가가 어깨를 흔든다", "wits", 11, null, null, null, { noise: 1 }),
        A("멀리서 돌을 던진다", "wits", 10, null, null, null, { noise: 2 }),
        AUTO("그냥 지나친다", { stress: 5, text: "등 뒤가 계속 서늘했다." }),
      ], [
        { reveal: "죽은 지 오래된 사람이다. 배낭이 그대로다.", by: [
          { win: { loot: { food: 3 }, gear: "geiger", text: "배낭 안에 통조림과 가이거 계수기." }, lose: { stress: 15, text: "어깨를 흔들자 머리가 떨어졌다." } },
          { win: { loot: { food: 2 }, text: "반응이 없다. 배낭에서 통조림을 꺼냈다." }, lose: { text: "반응이 없다. 무서워서 다가가지 못했다." } },
        ] },
        { reveal: "죽은 척하던 약탈자였다!", by: [
          { win: { text: "손이 칼로 가는 걸 먼저 봤다. 걷어차고 달아났다." }, lose: { harm: 1, text: "어깨에 손이 닿는 순간 칼이 들어왔다." } },
          { win: { rivalAlert: true, text: "돌에 맞은 그가 벌떡 일어나 달아났다. 까마귀에게 알리러." }, lose: { harm: 1, rivalAlert: true, text: "그가 일어나 덮쳤다." } },
        ] },
      ]),
      S("n_train", "tunnel", "search", "탈선한 전동차. 객실 안에 사람들이 앉은 채로 굳어 있다. 짐칸엔 가방이 가득하다.", [
        A("가방을 뒤진다", "wits", 12, { loot: { food: 2, wood: 2 }, stress: 10, text: "가방마다 사진이 있었다. 사진은 두고 왔다." }, { stress: 20, text: "누군가와 눈이 마주쳤다. 죽은 눈이었다." }),
        A("운전실 연료 탱크를 연다", "craft", 13, { loot: { wood: 5 }, text: "탱크에 경유가 남아 있었다." }, { harm: 1, text: "녹슨 밸브가 터져 얼굴에 기름을 뒤집어썼다." }, "crowbar", { noise: 3 }),
      ]),
      S("n_deep", "tunnel", "trap", "선로에 물이 가슴까지 찼다. 물 아래 무언가 다리를 스친다.", [
        A("밧줄을 매고 건넌다", "force", 12, { loot: { wood: 4 }, text: "건너편 정비실에 연료통이 있었다." }, { harm: 1, lose: 0.3, text: "발이 걸려 물속으로 끌려 들어갔다." }, "rope"),
        A("천장 케이블 선반으로 기어간다", "wits", 14, { loot: { wood: 3 }, text: "선반 위로 건넜다. 물 아래 무언가를 내려다보지 않았다." }, { harm: 2, text: "선반이 무너졌다." }),
      ]),
      M("n_signal", "tunnel", "meet", "터널 저편에 불빛이 깜빡인다. 짧게 셋, 길게 하나.", [
        A("불빛으로 답한다", "talk", 12, null, null, "lamp", { noise: 1 }),
        A("불을 끄고 다가간다", "wits", 13, null, null, null, { noise: 0 }),
        AUTO("돌아선다", { text: "불빛은 한참 동안 깜빡였다. 누군가를 부르듯." }),
      ], [
        { reveal: "다른 생존자들이었다. 그들도 무서웠던 거다.", by: [
          { win: { loot: { wood: 2, hope: 6 }, text: "연료를 나눠 받고 헤어졌다. 사람이 아직 있다." }, lose: { stress: 5, text: "그들은 겁을 먹고 불을 껐다." } },
          { win: { join: true, text: "가까이서 보니 혼자였다. 함께 가자고 했다." }, lose: { stress: 10, text: "들켰다. 그들은 비명을 지르며 흩어졌다." } },
        ] },
        { reveal: "미끼였다. 불빛 옆에 그물이 쳐져 있다.", by: [
          { win: { rivalAlert: true, text: "답하자마자 불빛이 꺼졌다. 이상하다. 바로 물러났다." }, lose: { harm: 1, rivalAlert: true, text: "그물이 떨어졌다. 겨우 칼로 찢고 나왔다." } },
          { win: { loot: { food: 3 }, gear: "rope", text: "그물 옆 보초가 졸고 있었다. 그들의 짐을 털었다." }, lose: { harm: 1, text: "어둠 속에서 그물에 걸렸다." } },
        ] },
      ]),
      S("n_morgue", "hospital", "tempt", "영안실. 시신들 손목에 시계와 반지. 주머니엔 약병이 있다.", [
        A("주머니를 하나씩 뒤진다", "wits", 9, { loot: { meds: 3, hope: -3 }, stress: 15, text: "약병 셋. 차가운 손들이 자꾸 손등에 닿았다." }, { stress: 25, text: "서랍 하나에서 살아 있는 쥐 떼가 쏟아졌다." }),
        AUTO("그냥 나간다", { text: "문을 닫고 한참 숨을 골랐다." }),
      ]),
      S("n_surgeon", "hospital", "meet", "수술실에 불이 켜져 있다. 피 묻은 가운의 남자가 메스를 들고 돌아본다. “환자요? 아니면… 재료요?”", [
        A("거래하자고 한다", "talk", 14, { loot: { meds: 3 }, text: "그는 약을 나눠 줬다. 등 뒤 침대에서 무언가 신음했다." }, { harm: 1, stress: 15, text: "그가 웃으며 다가왔다. 메스가 스쳤다." }),
        A("먼저 제압한다", "force", 13, { loot: { meds: 4 }, stress: 15, text: "그를 묶었다. 침대 위의 것들은 보지 않았다." }, { harm: 2, text: "그는 의외로 빨랐다." }, "knife", { noise: 3 }),
        AUTO("천천히 뒷걸음질 친다", { stress: 10, text: "그는 따라오지 않았다. 웃음소리만 따라왔다." }),
      ]),
      S("n_masks", "hospital", "search", "방재 창고. 방독면 상자가 선반 맨 위에 있다. 선반이 기울어 있다.", [
        A("기어 올라간다", "force", 12, { gear: "gasmask", text: "방독면 하나를 챙겼다. 이제 숨을 쉴 수 있다." }, { harm: 1, text: "선반째 넘어졌다." }, "rope", { noise: 2 }),
        A("선반을 받치고 하나씩 내린다", "craft", 13, { gear: "gasmask", loot: { meds: 1 }, text: "방독면과 붕대 묶음." }, { stress: 10, text: "상자가 쏟아졌다. 전부 깨져 있었다." }),
      ]),
      S("n_mine", "depot", "trap", "발밑에서 딸깍. 모두 그대로 멈췄다. 누구의 발밑인지는 다들 안다.", [
        A("무게를 돌로 바꿔 놓는다", "craft", 14, { loot: { hope: 4 }, text: "식은땀 속에서 발을 뺐다. 아무 일도 없었다." }, { harm: 3, text: "…" }),
        A("옆으로 몸을 날린다", "force", 12, { text: "폭음과 함께 흙이 쏟아졌다. 살았다." }, { harm: 2, text: "파편이 다리에 박혔다." }),
      ]),
      S("n_armory", "depot", "search", "무기고 철창. 안쪽 선반에 권총 한 자루와 탄창이 보인다.", [
        A("자물쇠를 딴다", "craft", 14, { gear: "pistol", text: "권총을 손에 쥐었다. 무겁다." }, { stress: 10, text: "자물쇠가 부러졌다. 이제 열 방법이 없다." }, "crowbar"),
        A("철창을 뜯는다", "force", 15, { gear: "pistol", text: "철창이 비명을 질렀다. 권총을 챙겼다." }, { harm: 1, rivalAlert: true, text: "철창 소리가 온 보급창에 울렸다." }, "crowbar", { noise: 5 }),
      ]),
      S("n_fieldtent", "depot", "tempt", "야전 병원 텐트. 숨이 붙은 부상병 하나가 약 상자를 끌어안고 있다.", [
        A("상자를 빼앗는다", "force", 8, { loot: { meds: 4, hope: -6 }, stress: 25, text: "그는 놓지 않으려 했다. 그러다 놓았다." }, { stress: 20, text: "그가 비명을 질렀다. 상자를 두고 달아났다." }),
        A("치료를 돕는다", "talk", 12, { loot: { meds: 1, hope: 6 }, text: "그는 약 한 병을 건네고 눈을 감았다. “고마워.”" }, { stress: 10, text: "그는 당신을 믿지 않았다." }),
      ]),
      S("n_feast", "raider", "meet", "약탈자들이 불 앞에서 취해 노래한다. 고기 굽는 냄새가 미칠 것 같다.", [
        A("노래에 섞여 들어간다", "talk", 15, { loot: { food: 5 }, text: "같이 웃고 같이 마셨다. 새벽에 자루를 메고 나왔다." }, { harm: 1, rivalAlert: true, text: "누군가 얼굴을 알아봤다." }),
        A("불을 질러 혼란을 만든다", "craft", 13, { loot: { food: 6 }, rivalAlert: true, text: "불길 속에서 식량 자루를 들고 뛰었다." }, { harm: 1, rivalAlert: true, text: "불이 우리 쪽으로 번졌다." }, null, { noise: 5 }),
      ]),
      S("n_rope", "raider", "trap", "소굴 뒷담. 줄에 매달린 시신들이 바람에 흔들린다. 그 사이로 들어가야 한다.", [
        A("시신 사이로 기어간다", "wits", 13, { loot: { food: 5 }, stress: 15, text: "차가운 발들이 머리를 스쳤다. 창고에 닿았다." }, { stress: 25, rivalAlert: true, text: "시신 하나가 떨어졌다. 개들이 짖었다." }, "rope"),
        AUTO("돌아선다", { stress: 10, text: "그들 중 하나는 어제 본 얼굴이었다." }),
      ]),
    ],
    iceage: [
      S("i_cellar", "village", "trap", "지하 저장고 문. 계단이 얼음으로 덮여 미끄럽다. 아래는 깜깜하다.", [
        A("밧줄을 매고 내려간다", "craft", 12, { loot: { food: 5 }, text: "얼어붙은 감자 자루. 이 정도면 며칠은 간다." }, { harm: 1, text: "밧줄이 끊어졌다." }, "rope"),
        A("미끄러지듯 뛰어내린다", "force", 13, { loot: { food: 4 }, text: "엉덩이로 미끄러져 내려갔다. 자루를 던져 올렸다." }, { harm: 1, stress: 10, text: "얼음 계단에 머리를 박았다." }),
      ]),
      S("i_coats", "village", "search", "옷장 안에 두꺼운 털옷이 걸려 있다. 옷장 앞에는 얼어붙은 주인이 앉아 있다.", [
        A("털옷을 벗겨 낸다", "wits", 10, { gear: "furcoat", stress: 10, text: "옷은 따뜻했다. 주인은 이제 필요 없다." }, { stress: 20, text: "주인의 팔이 부러지는 소리. 손을 놓았다." }),
        A("주인과 함께 묻어 주고 옷을 받는다", "talk", 13, { gear: "furcoat", loot: { hope: 4 }, text: "짧게 기도했다. 털옷을 걸쳤다." }, { stress: 10, text: "땅이 얼어 묻을 수 없었다. 옷도 두고 왔다." }),
      ]),
      M("i_smoke", "village", "meet", "마을 끝 집 굴뚝에서 연기가 오른다. 누군가 살아 있다.", [
        A("문을 두드린다", "talk", 12, null, null, null, { noise: 2 }),
        A("창문으로 몰래 들여다본다", "wits", 12, null, null, "lamp", { noise: 0 }),
        AUTO("다가가지 않는다", { text: "연기는 밤새 피어올랐다." }),
      ], [
        { reveal: "젊은 엄마와 아기. 장작이 다 떨어져 간다.", by: [
          { win: { join: true, loot: { hope: 5 }, text: "엄마가 아기를 안고 따라나섰다. 입이 둘 늘었다." }, lose: { stress: 10, text: "“가요. 제발.” 문은 열리지 않았다." } },
          { win: { loot: { hope: -3 }, stress: 15, text: "아기를 안고 불 앞에서 졸고 있다. 장작 몇 개가 보였지만 가져오지 못했다." }, lose: { stress: 10, text: "아기가 울었다. 엄마가 칼을 들고 창가로 왔다." } },
        ] },
        { reveal: "늑대단의 전초였다. 개 짖는 소리.", by: [
          { win: { rivalAlert: true, text: "문이 열리기 전에 눈치챘다. 뛰었다." }, lose: { harm: 1, rivalAlert: true, text: "문이 열리고 개가 먼저 나왔다." } },
          { win: { loot: { food: 4 }, text: "모두 잠들어 있었다. 문가의 식량 자루만 들고 나왔다." }, lose: { harm: 1, text: "개가 창문을 향해 뛰어올랐다." } },
        ] },
      ]),
      S("i_crevasse", "cave", "trap", "동굴 바닥에 갈라진 틈. 건너편에 연료통이 보인다. 틈 아래로는 바닥이 보이지 않는다.", [
        A("뛰어 건넌다", "force", 13, { loot: { wood: 4 }, text: "건넜다. 돌아올 때가 더 무서웠다." }, { harm: 2, text: "발끝이 미끄러졌다. 겨우 가장자리를 잡았다." }),
        A("밧줄로 다리를 놓는다", "craft", 12, { loot: { wood: 5 }, text: "밧줄을 타고 연료통 둘을 옮겼다." }, { stress: 15, text: "밧줄이 풀려 연료통이 틈으로 떨어졌다." }, "rope"),
      ]),
      M("i_echo", "cave", "meet", "동굴 안쪽에서 누군가 이름을 부른다. 당신이 아는 목소리다. 죽은 사람의 목소리.", [
        A("목소리를 따라간다", "wits", 13, null, null, "lamp", { noise: 1 }),
        AUTO("귀를 막고 돌아간다", { stress: 15, text: "목소리는 동굴 입구까지 따라왔다." }),
      ], [
        { reveal: "얼음 틈을 지나는 바람이었다. 그 끝에 옛 연료 저장고가 있다.", by: [
          { win: { loot: { wood: 5 }, stress: 5, text: "바람 소리였다. 그래도 한참 떨렸다. 연료통이 줄지어 있었다." }, lose: { stress: 20, text: "끝까지 따라가지 못했다. 목소리는 계속 불렀다." } },
          null,
        ] },
        { reveal: "굶주린 생존자가 흉내 내고 있었다. 사람을 끌어들이려고.", by: [
          { win: { text: "목소리가 흉내라는 걸 알아챘다. 그림자가 물러났다." }, lose: { harm: 2, stress: 15, text: "어둠 속에서 무언가 뛰어들었다. 이빨이 있었다." } },
          null,
        ] },
      ]),
      S("i_ration", "cave", "tempt", "얼음 속에 사람이 갇혀 있다. 그 손에 쥔 깡통 꾸러미. 얼음을 깨면 꺼낼 수 있다. 사람도.", [
        A("얼음을 깨고 꾸러미만 꺼낸다", "force", 11, { loot: { food: 4 }, stress: 15, text: "꾸러미를 빼내자 손가락이 같이 부러졌다." }, { harm: 1, text: "얼음 파편이 얼굴을 그었다." }, "crowbar", { noise: 3 }),
        AUTO("그대로 둔다", { text: "그 얼굴이 자꾸 생각난다." }),
      ]),
      S("i_tail", "plane", "trap", "수송기 꼬리가 낭떠러지에 걸려 흔들린다. 그 안에 의약품 상자.", [
        A("살금살금 기어 들어간다", "wits", 14, { loot: { meds: 3 }, text: "동체가 한 번 크게 기울었다. 상자를 안고 기어 나왔다." }, { harm: 1, lose: 0.3, text: "동체가 미끄러졌다. 겨우 뛰어내렸다." }),
        A("밧줄로 동체를 묶고 들어간다", "craft", 12, { loot: { meds: 3 }, text: "밧줄이 팽팽하게 버텼다." }, { stress: 15, text: "밧줄이 끊어졌다. 동체째 사라졌다. 상자도." }, "rope"),
      ]),
      S("i_survivor", "plane", "meet", "화물칸 구석에 조종복 입은 사람이 웅크려 있다. 다리가 이상한 방향으로 꺾였다. 권총을 겨눈다.", [
        A("총을 내리라고 설득한다", "talk", 13, { join: true, gear: "rifle", text: "그는 총을 내렸다. 사냥총과 함께 그도 데려왔다." }, { harm: 1, text: "총성. 귀가 먹먹하다." }),
        A("총을 빼앗는다", "force", 14, { gear: "rifle", stress: 15, text: "총을 빼앗았다. 그는 아무 말 없이 우리를 봤다. 우리는 그를 두고 나왔다." }, { harm: 2, text: "그가 먼저 쐈다." }, "knife", { noise: 4 }),
      ]),
      S("i_wires", "station", "trap", "관측소 발전기실. 바닥에 물이 얼었다 녹았다 한다. 끊어진 전선이 불꽃을 튀긴다.", [
        A("발전기를 끄고 들어간다", "craft", 13, { loot: { wood: 3, meds: 1 }, text: "발전기 연료와 비상 구급함." }, { harm: 1, text: "감전됐다. 손이 한참 떨렸다." }),
        A("전선을 피해 뛰어 지나간다", "wits", 13, { loot: { wood: 2 }, text: "불꽃 사이를 빠져나갔다." }, { harm: 1, text: "발이 미끄러졌다." }),
      ]),
      S("i_shoes", "station", "search", "대원 숙소. 벽에 설피 한 켤레가 걸려 있다. 침대 아래에서 긁는 소리가 난다.", [
        A("설피만 재빨리 챙긴다", "wits", 11, { gear: "snowshoe", text: "설피를 챙겼다. 침대 아래는 보지 않았다." }, { harm: 1, text: "침대 밑에서 굶주린 여우가 튀어나와 물었다." }),
        A("침대를 들춘다", "force", 12, { gear: "snowshoe", loot: { food: 2 }, text: "여우였다. 오늘 밤 고기가 생겼다." }, { harm: 1, text: "여우가 팔을 물고 달아났다." }, "knife", { noise: 3 }),
      ]),
      S("i_dogs", "camp", "meet", "캠프 개 우리. 썰매개들이 조용히 당신을 본다. 짖으면 끝이다.", [
        A("고기를 던져 준다 (식량 1)", "talk", 11, { loot: { food: 4 }, text: "개들이 먹는 사이 창고 텐트에 들어갔다." }, { rivalAlert: true, stress: 10, text: "한 마리가 짖었다. 모두가 짖었다." }),
        A("우리를 열어 풀어 준다", "craft", 13, { rivalAlert: true, loot: { hope: 4 }, text: "개들이 눈밭으로 흩어졌다. 늑대단은 밤새 개를 쫓았다." }, { harm: 1, text: "개가 손을 물었다." }, null, { noise: 3 }),
      ]),
      S("i_trial", "camp", "tempt", "늑대단이 누군가를 눈밭에 무릎 꿇렸다. “도둑질하면 이렇게 된다.” 다들 그쪽을 보느라 창고가 비었다.", [
        A("그 틈에 창고를 턴다", "wits", 11, { loot: { food: 6 }, stress: 20, text: "창고를 털었다. 등 뒤에서 총성이 한 번 울렸다." }, { harm: 1, rivalAlert: true, text: "들켰다." }),
        A("소리를 질러 시선을 끈다", "talk", 14, { join: true, rivalAlert: true, text: "혼란 속에 무릎 꿇은 사람이 달아났다. 우리를 따라왔다." }, { harm: 2, rivalAlert: true, text: "총구가 이쪽을 향했다." }, null, { noise: 5 }),
      ]),
    ],
    flood: [
      S("f_wire", "store", "trap", "물에 잠긴 창고 바닥. 끊어진 전선이 물속에서 지지직거린다. 쌀자루가 건너편에 있다.", [
        A("장화를 믿고 건넌다", "wits", 12, { loot: { food: 4 }, text: "물이 장화 목까지 찼다. 쌀자루를 메고 건넜다." }, { harm: 2, text: "감전. 다리에 힘이 빠져 물에 쓰러졌다." }, "boots"),
        A("두꺼비집을 찾아 내린다", "craft", 13, { loot: { food: 4 }, gear: "boots", text: "전기를 끊었다. 선반 아래 새 장화까지 있었다." }, { harm: 1, text: "두꺼비집도 물에 젖어 있었다." }),
      ]),
      M("f_float", "store", "meet", "물 위에 무언가 떠 있다. 사람 크기다. 천천히 이쪽으로 흘러온다.", [
        A("장대로 끌어당긴다", "craft", 11, null, null, null, { noise: 1 }),
        AUTO("비켜서서 흘려보낸다", { stress: 5, text: "그것은 천천히 지나갔다. 한쪽 팔이 물 밖으로 나와 있었다." }),
      ], [
        { reveal: "떠내려온 냉장고다. 문이 꽉 닫혀 있다.", by: [{ win: { loot: { food: 4 }, text: "안에 반찬통과 쌀이 그대로였다." }, lose: { harm: 1, text: "냉장고가 뒤집히며 깔렸다." } }, null] },
        { reveal: "사람이다. 아직 숨을 쉰다.", by: [{ win: { join: true, text: "물을 토해 내고 눈을 떴다. 새 식구다." }, lose: { stress: 20, text: "끌어올렸을 때 숨이 멎었다." } }, null] },
        { reveal: "사람이다. 숨은 없다. 주머니가 불룩하다.", by: [{ win: { loot: { meds: 2 }, stress: 15, text: "주머니에서 약병 둘. 얼굴은 덮어 주었다." }, lose: { stress: 20, text: "끌어올리다 손을 놓쳤다. 그 얼굴이 가라앉으며 이쪽을 봤다." } }, null] },
      ]),
      S("f_torch", "pharmacy", "search", "약국 진열장 아래, 방수 손전등과 붕대 상자. 그 위로 천장 석고가 물에 불어 처져 있다.", [
        A("재빨리 꺼낸다", "wits", 12, { gear: "torch", loot: { meds: 1 }, text: "손전등이 켜졌다. 어둠이 조금 물러났다." }, { harm: 1, text: "석고가 무너져 내렸다." }),
        A("천장을 받치고 꺼낸다", "craft", 13, { gear: "torch", loot: { meds: 2 }, text: "손전등과 붕대 상자를 챙겼다." }, { stress: 10, text: "받침이 미끄러졌다. 다 젖었다." }, "crowbar"),
      ]),
      S("f_pharmacist", "pharmacy", "tempt", "약사가 계산대 뒤에서 죽어 있다. 금고 열쇠를 목에 걸고 있다. 열쇠를 빼려면 목을…", [
        A("열쇠를 뺀다", "wits", 9, { loot: { meds: 4 }, stress: 20, text: "금고 안에 항생제가 가득했다. 손을 오래 씻었다." }, { stress: 25, text: "끝내 손을 대지 못했다." }),
        A("금고를 부순다", "force", 15, { loot: { meds: 3 }, text: "금고 문이 휘었다." }, { harm: 1, text: "손목이 꺾였다." }, "crowbar", { noise: 5 }),
      ]),
      S("f_current", "mill", "trap", "목재소 뒤편 물살이 거세다. 떠내려가는 판자 더미를 붙잡으면 땔감이 한가득이다.", [
        A("물에 뛰어들어 붙잡는다", "force", 13, { loot: { wood: 5 }, text: "온몸이 얼었지만 판자 더미를 끌어 왔다." }, { harm: 1, lose: 0.3, text: "물살에 휩쓸렸다. 한참 떠내려가다 기둥을 잡았다." }, "rope"),
        A("갈고리로 끌어당긴다", "craft", 12, { loot: { wood: 3 }, text: "판자 몇 장을 건졌다." }, { stress: 10, text: "갈고리가 부러졌다." }),
      ]),
      S("f_saw", "mill", "meet", "톱밥 더미 위에 사내가 앉아 도끼를 간다. “여긴 내 땅이야. 나무 한 토막에 쌀 한 줌.”", [
        A("값을 깎는다", "talk", 13, { loot: { wood: 4, food: -1 }, text: "쌀 한 줌에 판자 한 아름." }, { loot: { food: -1 }, text: "쌀만 뺏기고 쫓겨났다." }),
        A("도끼를 빼앗는다", "force", 15, { loot: { wood: 5 }, stress: 15, text: "그는 피를 흘리며 물로 뛰어들었다." }, { harm: 2, text: "도끼가 먼저 왔다." }, "knife", { noise: 4 }),
      ]),
      S("f_guards", "granary", "tempt", "쌀 창고 사병 하나가 몰래 손짓한다. “약 두 병 주면 뒷문 열어 줄게.”", [
        A("약을 주고 들어간다 (약 2)", "talk", 11, { loot: { meds: -2, food: 7 }, text: "뒷문이 열렸다. 쌀 포대를 메고 나왔다." }, { loot: { meds: -2 }, rivalAlert: true, text: "약만 받고 사병이 소리를 질렀다." }),
        A("그 사병을 위협한다", "force", 13, { loot: { food: 5 }, rivalAlert: true, text: "칼끝에 뒷문이 열렸다." }, { harm: 1, rivalAlert: true, text: "사병이 호루라기를 불었다." }, "knife", { noise: 3 }),
      ]),
      S("f_boat", "wreck", "search", "뒤집힌 배 밑에 고무보트가 끼어 있다. 배가 물살에 들썩인다.", [
        A("배 밑으로 잠수한다", "force", 13, { gear: "boat", text: "숨이 다할 즈음 보트를 빼냈다." }, { harm: 1, text: "배가 내려앉으며 다리를 짓눌렀다." }),
        A("밧줄로 배를 들어 올린다", "craft", 12, { gear: "boat", loot: { food: 1 }, text: "지렛대처럼 배를 들고 보트를 빼냈다." }, { stress: 10, text: "밧줄이 미끄러졌다." }, "rope"),
      ]),
    ],
  };
  const api = { KINDS, gear, startGear, hazards, placeHazard, common, chase, revisit, extra };
  root.SurviveNight = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
