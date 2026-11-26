"use strict";
// 이야기 뼈대: 3막 · 목표 · 라이벌의 얼굴 · 식구마다 3단계 사연 · 밤의 선택이 돌아오는 사건 · 마지막 탈출.
// 지금은 극 빙하기만. 다른 재난은 story가 없으면 예전처럼 날짜가 되면 끝난다.
(function (root) {
  // fx 확장: clue(선로 단서) · prog(준비물) · stance(라이벌 태도) · cb(며칠 뒤 돌아올 사건) · check(판정) · castAway · castCraft · castDie · rivalGone · leaveWeak · carryWeak
  // jr: 결말에 남을 결정적인 순간
  const iceage = {
    rivalName: "백곰",
    clueNeed: 2,
    acts: [
      { act: 1, title: "1막 · 얼어붙은 기지", goal: "선로가 어디 있는지 알아내기" },
      { act: 2, title: "2막 · 늑대의 겨울", day: 5, goal: "떠날 준비: 선로와 썰매" },
      { act: 3, title: "3막 · 남행", fromEnd: 3, goal: "살아서 열차에 오르기" },
    ],
    actText: {
      2: (s) => [
        "밤사이 기지 둘레 눈 위에 발자국이 원을 그렸다. 늑대단이 우리를 찾았다.",
        s.story.rail ? "선로는 찾았다. 이제 그곳까지 갈 방법이 필요하다. 썰매가 없으면 걷지 못하는 사람은 데려갈 수 없다." : "아직 선로가 어디인지도 모른다. 열차는 기다려 주지 않는다.",
      ],
      3: (s) => [
        `열차가 ${s.rescueDay}일 밤에 이 근처 선로를 지난다. 서지 않는다. 속도만 늦춘다.`,
        `${s.story.rail ? "선로까지 가는 길은 안다." : "선로가 어디인지 아직 모른다. 이대로면 별을 보고 헤매야 한다."} ${s.story.prog.sled ? "썰매도 있다." : "썰매가 없다."}`,
        s.flags.stash ? "복순이 숨겨 둔 비상 식량을 꺼냈다. (식량 +4)" : "",
      ].filter(Boolean),
    },
    // 단계별 목표 표시
    goalLine(s) {
      const st = s.story;
      if (st.act === 1) return `🎯 선로 찾기 · 단서 ${Math.min(st.clues, 2)}/2`;
      if (st.act === 2) return `🎯 떠날 준비 · 선로 ${st.rail ? "✔" : "✘"} · 썰매 ${st.prog.sled ? "✔" : "✘"}`;
      return `🚂 열차까지 ${Math.max(0, s.rescueDay - s.day)}일 · 선로 ${st.rail ? "✔" : "✘"} · 썰매 ${st.prog.sled ? "✔" : "✘"}`;
    },
    // 이야기 장면: 해당 장소의 첫 장면으로 먼저 나온다
    scenes: [
      { id: "s_map", loc: "station", kind: "search", story: true, text: "관측소 맨 안쪽, 측량실. 문을 열자 숨이 멎는다. 벽 한 면 전체가 남행선 노선도다. 손으로 그린 선 위에 대원들이 연필로 적은 메모가 빼곡하다. 그 절반이 얼음에 덮여 있다. 이 종이 한 장이 우리를 살릴 수도 있다.", approaches: [
        { label: "얼음을 녹여 통째로 떼어 낸다", stat: "craft", dc: 12, noise: 1, win: { clue: 2, loot: { meds: 1, wood: 2 }, text: "노선도를 말아 품에 넣었다. 기지에서 남쪽으로 반나절. 선로가 거기 있다.", jr: "관측소에서 남행선 노선도를 찾았다." }, lose: { clue: 1, harm: 1, text: "종이가 찢어졌다. 절반만 건졌다. 손끝이 얼었다." } },
        { label: "보이는 만큼 외운다", stat: "wits", dc: 12, noise: 0, win: { clue: 1, loot: { wood: 2 }, text: "{who}이(가) 입술을 달싹이며 외웠다. 기지에서 남동쪽. 개울 두 개를 건너고 송전탑을 따라간다." }, lose: { stress: 10, text: "성에가 끼어 읽을 수가 없었다. {who}은(는) 손바닥으로 얼음을 문지르다 포기했다." } },
        { label: "[은서와 함께] 은서가 메모까지 해독한다", stat: "wits", dc: 7, req: { with: "meteorologist" }, noise: 0, win: { clue: 2, loot: { wood: 2 }, text: "은서가 연필 메모를 손가락으로 짚었다. “‘3월, 하얀나루역까지 4시간. 개울 얼음 두께 확인.’ 이 사람들, 직접 걸어갔어요.” 노선도를 통째로 머릿속에 넣었다.", jr: "은서가 관측소 노선도를 해독했다." }, lose: { clue: 1, text: "은서가 반쯤 읽다 고개를 저었다. 나머지는 얼음 밑이었다." } },
      ] },
      { id: "s_sign", loc: "village", kind: "search", story: true, text: "마을 끝 버스 정류장. 지붕은 무너지고 의자만 남았다. 눈 더미 사이로 녹슨 표지판 귀퉁이가 삐죽 나와 있다. 화살표 끝이 보인다. 어딘가를 가리키고 있다.", approaches: [
        { label: "눈을 파서 표지판을 드러낸다", stat: "force", dc: 11, noise: 2, win: { clue: 1, loot: { food: 2 }, text: "‘남행선 하얀나루역 4km →’ 방향을 알았다." }, lose: { harm: 1, text: "표지판이 쓰러지며 정강이를 쳤다." } },
        { label: "근처 집에서 지도를 찾는다", stat: "wits", dc: 13, noise: 1, win: { clue: 1, loot: { food: 3 }, text: "냉장고 문에 붙은 관광 지도. 역에 동그라미가 쳐져 있다." }, lose: { stress: 10, text: "빈집마다 같은 냄새가 났다." } },
      ] },
      { id: "s_sled", loc: "plane", kind: "search", story: true, text: "화물칸 맨 뒤. 방수포를 들추자 극지용 스키 썰매가 나온다. 주황색 페인트가 아직 선명하다. 화물 끈 여섯 개가 썰매를 바닥에 붙들어 매고 있고, 끈마다 얼음이 돌처럼 엉겨 붙었다. 머리 위에서 동체가 바람에 신음한다.", approaches: [
        { label: "끈을 끊고 끌어낸다", stat: "force", dc: 13, noise: 3, tool: "knife", win: { prog: "sled", loot: { meds: 2 }, text: "썰매를 끌어냈다. 썰매 가방엔 구급약도 있었다. 이제 걷지 못하는 사람도 데려갈 수 있다.", jr: "수송기에서 썰매를 끌어냈다." }, lose: { harm: 1, text: "동체가 기울며 썰매가 깔렸다. 다음에 다시 와야 한다." } },
        { label: "고정 장치를 풀어 조심히 뺀다", stat: "craft", dc: 13, noise: 1, tool: "crowbar", win: { prog: "sled", loot: { meds: 2 }, text: "{who}이(가) 걸쇠를 하나씩 녹이며 풀었다. 썰매가 스르륵 미끄러져 나왔다.", jr: "수송기에서 썰매를 끌어냈다." }, lose: { stress: 10, text: "장치가 얼어 꿈쩍도 하지 않았다." } },
        { label: "[석구와 함께] 석구가 화물 고정 장치를 단번에 푼다", stat: "craft", dc: 7, req: { with: "mechanic" }, noise: 1, win: { prog: "sled", loot: { meds: 2 }, text: "석구가 혀를 찼다. “이건 군용 래칫이야. 이렇게, 이렇게.” 여섯 개가 차례로 풀렸다.", jr: "석구가 수송기에서 썰매를 풀어냈다." }, lose: { stress: 5, text: "석구가 욕을 했다. 래칫 하나가 부러졌다." } },
      ] },
    ],
    // 라이벌 백곰: 거래 → 요구 → 결판
    rival: [
      { id: "r1", day: 3, text: "썰매 한 대가 기지 앞에 섰다. 흰 털옷을 입은 거구가 내린다. “백곰이다. 연료 둘이면 식량 넷을 주지. 이 설원에선 서로 돕는 거야.”", choices: [
        { label: "거래한다 (연료 2 → 식량 4)", need: { wood: 2 }, fx: { wood: -2, food: 4, stance: 1 }, text: "백곰이 웃었다. “말이 통하는군.”", jr: "백곰과 처음 거래했다." },
        { label: "거절한다", fx: { stance: -1, rivalAlert: 1 }, text: "“후회할 거다.” 썰매 자국이 길게 남았다.", jr: "백곰의 첫 거래를 거절했다." },
        { label: "기지엔 아무것도 없다고 둘러댄다", fx: { flag: "lied" }, text: "백곰은 기지 창문을 한참 올려다보다 돌아갔다." },
      ] },
      { id: "r2", day: 6, when: (s) => s.story.stance >= 1, text: "백곰이 혼자 왔다. 털모자를 벗는다. “우리 쪽 꼬마가 열이 안 내려. 약 하나만. 은혜는 잊지 않는다.”", choices: [
        { label: "약을 준다", need: { meds: 1 }, fx: { meds: -1, stance: 2, hope: 3 }, text: "백곰이 약병을 쥐고 고개를 숙였다. 처음 보는 얼굴이었다.", jr: "적의 아이에게 마지막 약을 내줬다." },
        { label: "줄 약이 없다", fx: { stance: -1 }, text: "“…그래.” 그는 다시 털모자를 썼다." },
      ] },
      { id: "r2", day: 6, when: (s) => s.story.stance < 1, text: "기지 둘레에 늑대 머리뼈를 꽂은 말뚝이 박혔다. 백곰의 목소리가 눈보라를 뚫고 온다. “이 일대는 우리 땅이다. 오늘부터 식량 셋.”", choices: [
        { label: "식량 셋을 내준다", need: { food: 3 }, fx: { food: -3, stance: 1 }, text: "말뚝 하나가 뽑혔다. 굴욕은 오래 남는다." },
        { label: "거절하고 문을 막는다", fx: { stance: -1, rivalAlert: 2, wood: -1 }, text: "판자를 덧댔다. 밤새 바깥에서 개들이 울었다.", jr: "백곰의 요구를 거절하고 문을 막았다." },
        { label: "혜안을 보내 이야기하게 한다", needPerson: "monk", fx: { check: { who: "monk", stat: "talk", dc: 12, win: { fx: { stance: 2 }, text: "혜안이 돌아왔다. “그들도 굶고 있습니다.” 말뚝이 뽑혔다.", jr: "혜안이 늑대단과 화해를 이끌어 냈다." }, lose: { fx: { stance: -1, hurtCast: 1 }, text: "혜안이 피투성이로 돌아왔다." } } }, text: "" },
      ] },
      { id: "r3", day: 9, when: (s) => s.story.stance >= 2, text: "백곰이 지도를 펼친다. “열차 말이야. 우리 꼬마들도 태우고 싶다. 같이 가자. 길은 우리가 연다.”", choices: [
        { label: "함께 간다", fx: { flag: "ally", hope: 6 }, text: "손을 맞잡았다. 털장갑 너머로 온기가 느껴졌다.", jr: "백곰과 함께 남행하기로 했다." },
        { label: "거절한다", fx: { stance: -1 }, text: "“그래. 각자 살아남자.”" },
      ] },
      { id: "r3", day: 9, when: (s) => s.story.stance < 2 && s.story.stance > -2, text: "백곰이 기지 앞에 썰매를 세웠다. “열차 자리는 많지 않다. 연료 넷을 두고 가면 선로 앞에서 길을 비켜 주지.”", choices: [
        { label: "연료 넷을 준다", need: { wood: 4 }, fx: { wood: -4, stance: 1, flag: "passage" }, text: "그는 약속했다. 믿어도 될까.", jr: "선로 앞을 지나가려고 연료를 바쳤다." },
        { label: "거절한다", fx: { stance: -1 }, text: "“그럼 선로에서 보자.”" },
      ] },
      { id: "r3", day: 9, when: (s) => s.story.stance <= -2, text: "새벽. 개 짖는 소리와 함께 늑대단이 기지를 에워쌌다. 백곰이 외친다. “다 내놓고 나와!”", choices: [
        { label: "맞서 싸운다", fx: { check: { who: "best", stat: "force", dc: 14, win: { fx: { stance: 0, gear: "rifle", hope: 6 }, text: "문을 지켜 냈다. 쓰러진 늑대단 하나에게서 사냥총을 빼앗았다.", jr: "늑대단의 포위를 몸으로 막아 냈다." }, lose: { fx: { foodPct: -0.5, hurtTwo: 1 }, text: "문이 부서졌다. 식량 절반을 빼앗겼다.", jr: "늑대단에게 기지를 털렸다." } } }, text: "" },
        { label: "식량 절반을 주고 물린다", fx: { foodPct: -0.5, stance: 1 }, text: "그들은 자루를 메고 떠났다. 백곰이 돌아보며 웃었다." },
      ] },
    ],
    // 식구마다 3단계 사연 (함께 있을 때만)
    arcs: {
      meteorologist: [
        { text: "은서가 낡은 기상 도표를 펼친다. “이 기지 대원들은 선로까지 측량을 했어요. 관측소 측량실에 노선도가 있을 거예요.”", choices: [
          { label: "관측소를 뒤져 보자", fx: { castStress: -10 }, text: "은서가 관측소 위치에 동그라미를 쳤다." },
          { label: "지금은 살아남는 게 먼저야", fx: { castStress: 10 }, text: "은서는 도표를 접었다." },
        ] },
        { text: "은서가 창밖 별을 본다. “위도를 재면 선로 방향을 알 수 있어요. 대신 하룻밤 밖에 있어야 해요.”", choices: [
          { label: "허락한다", fx: { castAway: 1, check: { who: "cast", stat: "wits", dc: 11, win: { fx: { clue: 1 }, text: "은서가 얼어붙은 얼굴로 돌아왔다. “남동쪽. 확실해요.”", jr: "은서가 별을 재어 선로 방향을 알아냈다." }, lose: { fx: { hurtCast: 1 }, text: "구름이 끼었다. 은서는 동상만 얻고 돌아왔다." } } }, text: "" },
          { label: "너무 위험해", fx: { castStress: 10 }, text: "“시간이 없는데…”" },
        ] },
        { text: "은서가 기압계를 두드린다. “사흘 안에 마지막 큰 눈보라가 와요. 그게 지나면… 열차가 와요.”", choices: [
          { label: "모두 보강하자 (연료 1)", need: { wood: 1 }, fx: { wood: -1, braceThreat: true, hope: 5 }, text: "판자를 덧대고 틈을 막았다. 은서가 처음으로 웃었다." },
          { label: "은서를 안아 준다", fx: { castStress: -30 }, text: "은서가 울었다. 오래 참았던 울음이었다." },
        ] },
      ],
      hunter: [
        { text: "백곰이라는 이름에 마루의 얼굴이 굳는다. “…내 동생을 눈밭에 버린 놈이야.”", choices: [
          { label: "이야기를 들어 준다", fx: { castStress: -10, flag: "grudge" }, text: "마루는 한 번도 울지 않고 끝까지 말했다." },
          { label: "복수는 안 된다고 못 박는다", fx: { castStress: 15 }, text: "마루는 대답하지 않았다." },
        ] },
        { text: "마루가 사냥총이 없는 손을 본다. “오늘 밤 순록 떼가 골짜기를 지나. 혼자 가게 해 줘.”", choices: [
          { label: "보낸다", fx: { check: { who: "cast", stat: "force", dc: 12, win: { fx: { food: 5, hope: 3 }, text: "새벽에 마루가 순록 한 마리를 끌고 왔다. 모두 오랜만에 배불리 먹었다." }, lose: { fx: { hurtCast: 1 }, text: "순록에게 받혔다. 마루는 피를 흘리며 기어 돌아왔다." } } }, text: "" },
          { label: "말린다", fx: { castStress: 10 }, text: "그 밤, 골짜기에서 순록 울음이 들렸다." },
        ] },
        { text: "마루가 칼을 간다. “백곰이 혼자 사냥 나오는 길을 알아. 오늘 끝낼 수 있어.”", choices: [
          { label: "끝내게 둔다", fx: { check: { who: "cast", stat: "force", dc: 14, win: { fx: { rivalGone: true, allStress: 10 }, text: "마루가 돌아왔다. 손에 흰 털모자가 들려 있었다. 아무도 말하지 않았다.", jr: "마루가 백곰을 죽였다." }, lose: { fx: { castDie: "백곰을 노리다가" }, text: "마루는 돌아오지 않았다. 사흘 뒤 문 앞에 그의 칼이 꽂혀 있었다.", jr: "마루가 복수하러 나갔다가 돌아오지 못했다." } } }, text: "" },
          { label: "말린다", fx: { castStress: 20 }, text: "마루가 칼을 내려놓았다. 손이 떨렸다." },
          { label: "백곰을 용서하라고 설득한다", fx: { check: { who: "leader", stat: "talk", dc: 13, win: { fx: { castStress: -20, stance: 1 }, text: "마루가 오래 울었다. 그리고 칼을 묻었다.", jr: "마루가 복수를 내려놓았다." }, lose: { fx: { castStress: 20 }, text: "“당신은 몰라.” 마루가 등을 돌렸다." } } }, text: "" },
        ] },
      ],
      pilot: [
        { text: "한별이 하늘을 올려다본다. “수송기 화물칸 뒤쪽에 극지용 썰매가 실려 있었어요. 아직 거기 있을 거예요.”", choices: [
          { label: "다음에 가 보자", fx: { castStress: -5 }, text: "한별이 수송기 위치를 그려 줬다." },
        ] },
        { text: "한별: “수송기 무전기를 살리면 열차 통제소에 닿을지도 몰라요. 배터리를 데울 연료 둘이 필요해요.”", choices: [
          { label: "연료 둘을 준다", need: { wood: 2 }, fx: { wood: -2, check: { who: "cast", stat: "craft", dc: 12, win: { fx: { radio: true, hope: 8 }, text: "잡음 사이로 목소리. “…하얀나루역… 정차 가능…” 열차가 하루 일찍 온다!", jr: "한별이 무전으로 열차와 닿았다." }, lose: { fx: {}, text: "배터리가 터졌다. 연료만 날렸다." } } }, text: "" },
          { label: "연료를 아낀다", fx: { castStress: 10 }, text: "한별은 무전기를 끌어안고 잤다." },
        ] },
        { text: "한별이 눈을 빛낸다. “수송기 엔진 하나가 살아 있어요. 잠깐이라도 띄우면 하늘에서 선로를 볼 수 있어요.”", choices: [
          { label: "보낸다", fx: { check: { who: "cast", stat: "craft", dc: 13, win: { fx: { clue: 2, hope: 10 }, text: "하늘에서 엔진 소리가 한 바퀴 돌았다. 한별이 내려와 외쳤다. “선로가 보여요!”", jr: "한별이 마지막으로 날았다. 선로가 보였다." }, lose: { fx: { castDie: "수송기를 띄우다가" }, text: "엔진 소리가 멀어지다 끊겼다. 설원 위로 검은 연기가 올랐다.", jr: "한별이 하늘로 떠났다. 돌아오지 않았다." } } }, text: "" },
          { label: "말린다", fx: { castStress: 15 }, text: "“그럼 평생 못 날겠네요.” 한별이 웃었다. 슬픈 웃음이었다." },
        ] },
      ],
      mechanic: [
        { text: "석구가 난로를 두드린다. “이 난로, 연료를 두 배로 처먹어. 고치려면 하루 종일 붙어 있어야 해.”", choices: [
          { label: "고쳐 달라 (오늘 밤 못 나감)", fx: { castAway: 0, flag: "stove", castStress: 5 }, text: "다음 날부터 난로가 조용히 탔다. (밤 연료 소모가 줄어든다)" },
          { label: "나중에", fx: {}, text: "난로는 계속 그르렁거렸다." },
        ] },
        { text: "석구가 장갑을 벗는다. 손가락 두 개가 검게 변했다. “…잘라야 해. 아니면 손 전체가 썩어.”", choices: [
          { label: "잘라 준다", fx: { castCraft: -1, castStress: 20, hope: -3 }, text: "칼을 불에 달궜다. 석구는 비명을 지르지 않았다. 이제 렌치를 왼손으로 쥔다.", jr: "석구의 손가락을 잘랐다." },
          { label: "약을 쓴다", need: { meds: 1 }, fx: { meds: -1 }, text: "검은 기운이 조금 물러났다. 석구가 손을 쥐었다 폈다." },
          { label: "두고 본다", fx: { hurtCast: 2 }, text: "다음 날 아침, 석구는 열이 펄펄 끓었다." },
        ] },
        { text: "석구가 철판을 두드린다. “썰매 날 정도는 만들 수 있어. 연료 셋이랑 하루면 돼.”", choices: [
          { label: "만들어 달라 (연료 3)", need: { wood: 3 }, fx: { wood: -3, prog: "sled" }, text: "삐걱거리지만 굴러간다. 석구가 처음으로 자랑스러운 얼굴을 했다.", jr: "석구가 썰매를 만들었다." },
          { label: "연료가 아깝다", fx: { castStress: 10 }, text: "석구는 철판을 구석에 세워 두었다." },
        ] },
      ],
      cook: [
        { text: "복순이 자기 몫을 덜어 눈 밑에 묻는 걸 봤다. “비상용이야. 마지막 날을 위해서.”", choices: [
          { label: "믿는다", fx: { flag: "stash", castStress: -10 }, text: "복순이 고개를 끄덕였다. 그 눈 밑엔 무엇이 얼마나 있을까." },
          { label: "다 내놓으라고 한다", fx: { food: 2, castStress: 25 }, text: "식량 둘. 복순은 그날부터 말이 줄었다." },
        ] },
        { text: "복순이 얼음 굴을 판다. “고기를 여기 얼려 두면 상하지 않아. 손이 하나 더 필요해.”", choices: [
          { label: "다 같이 판다", fx: { food: 2, allStress: -5 }, text: "웃으며 얼음을 팠다. 오랜만이었다." },
          { label: "그럴 힘이 없다", fx: {}, text: "복순 혼자 끝까지 팠다." },
        ] },
        { text: "복순이 마지막 쌀을 꺼낸다. “오늘 한 번만, 제대로 된 밥상을 차리자. 다들 사람이었다는 걸 잊기 전에.”", choices: [
          { label: "잔치를 연다 (식량 2)", need: { food: 2 }, fx: { food: -2, hope: 15, allStress: -20 }, text: "따뜻한 밥 냄새. 누군가 노래를 했다. 누군가 울었다.", jr: "복순이 마지막 쌀로 밥상을 차렸다." },
          { label: "아낀다", fx: { castStress: 10 }, text: "복순은 쌀을 다시 묻었다." },
        ] },
      ],
      monk: [
        { text: "혜안이 밤마다 기지 밖에 촛불을 켠다. “죽은 이들이 길을 잃지 않게.”", choices: [
          { label: "허락한다", fx: { hope: 4, rivalAlert: 1 }, text: "눈 위의 작은 불빛. 멀리서도 보였을 것이다." },
          { label: "불빛이 위험하다", fx: { castStress: 5 }, text: "혜안이 조용히 촛불을 껐다." },
        ] },
        { text: "혜안: “저 늑대단 사람들도 굶고 있습니다. 제가 가서 이야기해 보겠습니다.”", choices: [
          { label: "보낸다", fx: { check: { who: "cast", stat: "talk", dc: 12, win: { fx: { stance: 2 }, text: "혜안이 돌아왔다. 늑대단의 아이 하나가 그의 손을 잡고 문 앞까지 따라왔다.", jr: "혜안이 홀로 늑대단을 찾아갔다." }, lose: { fx: { hurtCast: 2, stance: -1 }, text: "혜안이 피를 흘리며 기어 돌아왔다. 그래도 그들을 원망하지 않았다." } } }, text: "" },
          { label: "말린다", fx: {}, text: "“그럼 기도라도 하지요.”" },
        ] },
        { text: "혜안이 열에 들떠 있다. 그런데도 약을 아이에게 주라고 한다. “저는 충분히 살았습니다.”", choices: [
          { label: "억지로 약을 먹인다", need: { meds: 1 }, fx: { meds: -1, heal: "monk" }, text: "혜안이 쓴웃음을 지으며 삼켰다." },
          { label: "그의 뜻대로 한다", fx: { hurtCast: 2, hope: 5 }, text: "혜안이 웃었다. 그리고 눈을 감고 염불을 외웠다.", jr: "혜안이 자기 약을 아이에게 양보했다." },
        ] },
      ],
      child: [
        { text: "눈이가 창밖을 본다. “눈사람 만들고 싶어.” 밖은 영하 오십 도다.", choices: [
          { label: "잠깐만 같이 만든다", fx: { hope: 8, check: { who: "cast", stat: "force", dc: 6, win: { fx: {}, text: "작고 삐뚤어진 눈사람. 눈이가 처음으로 깔깔 웃었다." }, lose: { fx: { hurtCast: 1 }, text: "눈사람은 만들었다. 눈이의 볼이 하얗게 얼었다." } } }, text: "" },
          { label: "안 된다고 한다", fx: { hope: -2 }, text: "눈이는 창에 김을 불어 눈사람을 그렸다." },
        ] },
        { text: "눈이가 그림을 내민다. 기차, 그리고 모두. {dead_or} ", choices: [
          { label: "벽에 붙인다", fx: { hope: 6 }, text: "그림은 그날부터 기지 벽에 붙어 있었다." },
        ] },
        { text: "눈이가 이불 속에서 묻는다. “기차 못 타면 어떡해? 나 두고 가면 어떡해?”", choices: [
          { label: "절대 안 두고 간다고 약속한다", fx: { flag: "promise", hope: 4 }, text: "눈이가 새끼손가락을 걸었다. 차가운 손가락이었다.", jr: "눈이에게 절대 두고 가지 않겠다고 약속했다." },
          { label: "사실대로 말한다", fx: { castStress: 15 }, text: "“…다들 노력할 거야.” 눈이는 한참 동안 대답하지 않았다." },
        ] },
      ],
    },
    // 밤의 선택이 며칠 뒤 돌아온다
    callbacks: {
      boy_return: { text: "기지 문을 두드리는 소리. 늑대단 털옷을 입은 소년. 그 캠프에서, 사슬에 묶여 있던 그 아이다. “…날 두고 갔잖아.”", choices: [
        { label: "들여보낸다", fx: { join: true, flag: "boyIn" }, text: "소년은 난로 앞에서 아무 말 없이 떨었다. 그가 늑대단에 무엇을 말했는지는 모른다.", jr: "사슬에 묶여 있던 소년을 늦게나마 들였다." },
        { label: "돌려보낸다", fx: { flag: "boyWolf", stance: -1, allStress: 10 }, text: "소년이 눈밭으로 걸어갔다. 늑대단 캠프 쪽으로.", jr: "소년을 두 번 버렸다." },
      ] },
      boy_thanks: { text: "구해 온 소년이 늑대단 순찰 경로를 그려 준다. “밤엔 동쪽 골짜기로 다녀요. 거긴 피해요.”", choices: [
        { label: "고맙다고 한다", fx: { clue: 0, rivalAlert: -2, hope: 4 }, text: "소년이 처음으로 웃었다." },
      ] },
      old_smoke: { text: "얼어붙은 마을 쪽 하늘. 매일 피어오르던 그 노부부 집 굴뚝 연기가 오늘은 없다.", choices: [
        { label: "가 본다", fx: { check: { who: "best", stat: "wits", dc: 8, win: { fx: { allStress: 15, food: 1 }, text: "노부부는 서로를 껴안은 채 굳어 있었다. 빈 쌀통 옆에 우리가 놓고 간 쪽지가 있었다." }, lose: { fx: { allStress: 15 }, text: "문을 열지 못했다. 열고 싶지 않았다." } } }, text: "", jr: "우리가 식량을 빼앗은 노부부가 얼어 죽었다." },
        { label: "보지 않는다", fx: { allStress: 10 }, text: "아무도 그 이야기를 꺼내지 않았다." },
      ] },
      old_tale: { text: "데려온 할아버지가 지팡이로 눈 위에 선을 긋는다. “하얀나루역. 옛날에 거기서 표를 팔았지. 남동쪽으로 반나절이야.”", choices: [
        { label: "귀 기울인다", fx: { clue: 1, hope: 4 }, text: "할아버지가 길목마다 무엇이 있는지 하나하나 짚어 줬다." },
      ] },
      frozen_pilot: { text: "수송기에서 총을 빼앗고 두고 온 그 조종사. 그가 기지 앞 눈밭에 앉아 있다. 이미 얼어붙었다. 기지 쪽을 보고 있다.", choices: [
        { label: "묻어 준다", fx: { allStress: 10, hope: 2 }, text: "언 땅을 하루 종일 팠다." },
        { label: "그대로 둔다", fx: { allStress: 20 }, text: "창밖을 볼 때마다 그가 있었다.", jr: "총을 빼앗고 버려둔 조종사가 기지 앞에서 얼어 죽었다." },
      ] },
    },
    // 장면 결과에 붙일 콜백(기존 장면 id → 결과별)
    sceneHooks: {
      i_slave: [{ win: { cb: "boy_thanks", jr: "늑대단 캠프에서 사슬에 묶인 소년을 구했다." } }, { win: { cb: "boy_return", jr: "사슬에 묶인 소년을 못 본 척했다." }, lose: { cb: "boy_return", jr: "사슬에 묶인 소년을 못 본 척했다." } }],
      i_family: [{ win: { cb: "old_tale" } }, null, { win: { cb: "old_smoke", jr: "노부부의 마지막 식량을 빼앗았다." } }],
      i_survivor: [null, { win: { cb: "frozen_pilot" } }],
    },
    // 마지막 밤: 선로까지
    finale: {
      place: { name: "남쪽 선로", danger: 2, loot: "", desc: "열차가 지나는 곳" },
      eve: { text: "오늘 밤, 열차가 선로를 지난다. 모두 짐을 싼다. {weak}", choices: [
        { label: "모두 데려간다", fx: { carryWeak: true }, text: "아무도 두고 가지 않는다. 그게 얼마나 무거운지는 곧 알게 될 것이다." },
        { label: "걷지 못하는 사람은 두고 간다", fx: { leaveWeak: true }, text: "", jr: "걷지 못하는 사람을 기지에 두고 떠났다." },
      ] },
      scenes: [
        { id: "f_cross", kind: "trap", text: "기지 문을 닫았다. 누구도 돌아보지 않았다. 설원은 끝없이 하얗고, 바람은 칼날처럼 얼굴을 긋는다. 발밑에서 눈이 뽀드득 운다. {route}", approaches: [
          { label: "밧줄로 서로를 묶고 걷는다", stat: "force", dc: 12, tool: "rope", win: { text: "누구도 놓치지 않고 걸었다." }, lose: { harm: 1, text: "누군가 쓰러졌다. 일으켜 세우는 데 한참 걸렸다." } },
          { label: "별과 바람을 읽으며 간다", stat: "wits", dc: 12, tool: "snowshoe", win: { text: "남동쪽. 발이 기억하는 듯 길이 열렸다." }, lose: { harm: 1, lost: true, text: "길을 잃었다. 한 시간을 헤맸다." } },
        ] },
        { id: "f_wolf_ally", kind: "meet", text: "선로 앞. 늑대단 썰매가 기다리고 있다. 백곰이 손을 흔든다. “늦었잖아.”", approaches: [
          { label: "함께 선로로 간다", stat: "talk", dc: 0, auto: true, win: { loot: { hope: 5 }, text: "백곰의 아이들이 우리 아이 손을 잡았다. 두 무리가 함께 선로에 섰다." } },
        ] },
        { id: "f_wolf_pass", kind: "meet", text: "선로 앞을 늑대단이 막고 섰다. 백곰이 팔짱을 낀다. “연료는 받았지. 지나가.”", approaches: [
          { label: "고개를 숙이고 지나간다", stat: "talk", dc: 0, auto: true, win: { text: "늑대단이 길을 비켰다. 백곰은 약속을 지켰다." } },
        ] },
        { id: "f_wolf_block", kind: "meet", text: "송전탑 아래, 선로가 보인다. 그리고 그 앞에 늑대단의 썰매 다섯 대. 모닥불 너머로 흰 털옷이 일어선다. 백곰이 웃는다. “자리는 정해져 있어. 너희 자리는 없어.” {boy}", approaches: [
          { label: "자리를 나누자고 설득한다", stat: "talk", dc: 14, win: { text: "백곰이 한참 노려보다 길을 비켰다. “열차에서 보자.”" }, lose: { harm: 2, text: "설득은 통하지 않았다. 몸싸움 끝에 겨우 빠져나갔다." } },
          { label: "어둠을 틈타 돌아간다", stat: "wits", dc: 14, tool: "snowshoe", win: { text: "늑대단 뒤로 크게 돌아 선로에 닿았다." }, lose: { harm: 1, lost: true, text: "들켰다. 쫓기다 시간을 잃었다." } },
          { label: "정면으로 뚫는다", stat: "force", dc: 15, tool: "knife", win: { text: "피투성이로 선로에 닿았다." }, lose: { harm: 2, text: "백곰의 주먹이 먼저였다." } },
        ] },
        { id: "f_train", kind: "chase", text: "멀리서 기적 소리. 지평선 끝에 불빛 하나. 점점 커진다. 땅이 떨린다. 열차는 서지 않는다. 속도만 늦춘다. 문이 열린 화물칸 하나가 다가온다. 손을 뻗은 사람들이 보인다. 뛰어야 한다. 지금.", approaches: [
          { label: "약한 사람부터 밀어 올린다", stat: "force", dc: 12, win: { text: "한 사람씩, 손이 손을 잡아 올렸다. 마지막으로 당신이 뛰었다." }, lose: { harm: 2, text: "누군가 발을 헛디뎠다. 바퀴 소리가 비명을 덮었다." } },
          { label: "짐을 다 버리고 같이 뛴다", stat: "force", dc: 0, auto: true, win: { text: "모든 걸 버렸다. 사람만 남았다. 다 같이 뛰었다." } },
        ] },
      ],
    },
    endings: {
      missed: "열차 불빛이 지평선 저편으로 지나갔다. 선로는 생각보다 멀었다. 기적 소리만 오래 남았다.",
    },
  };
  const api = { iceage };
  root.SurviveStory = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
