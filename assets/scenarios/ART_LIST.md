# 그림 목록 (자동 생성)

`node scripts/art-list.js`로 다시 만든다. ✅는 이미 있는 파일. 없는 그림은 게임이 기본 그림(장소·분위기 그림)으로 대신 보여 주므로 한 장씩 넣어도 된다.

- 장면 그림: `assets/scenarios/<재난>/scenes/<이름>.webp` · 가로 16:9 · 1024×576 이상 · 위쪽이 그림의 중심(아래 30%는 글 뒤로 어둡게 스며든다)
- 장비 그림: `assets/gear/<이름>.webp` · 정사각 512×512 · 어두운 배경에 물건 하나
- 그림체: 지금 있는 유화풍 그대로. 글자·로고 넣지 않기.

## 먼저 그릴 것 (35장)

- **극 빙하기 분위기**: `dawn_quiet` · `dawn_storm` · `dawn_raid` · `dawn_death` · `dawn_sick` · `dawn_cold` · `act1` · `act2` · `act3`
- **극 빙하기 이야기**: `s_map` · `s_sign` · `s_sled` · `rival_r1` · `rival_r2` · `rival_r3` · `f_cross` · `f_wolf_block` · `f_train` · `ending_missed`
- **장비**: `crowbar` · `knife` · `lamp` · `rope` · `medkit` · `pack` · `gasmask` · `geiger` · `pistol` · `snowshoe` · `furcoat` · `rifle` · `boat` · `boots` · `torch` · `trap`

## 핵겨울 (`assets/scenarios/nuclear/scenes/`)

### 분위기 (아침 장 · 막 · 결말)

- ⬜ `dawn_quiet.webp` — 조용한 아침, 거처 안
- ⬜ `dawn_storm.webp` — 낙진 폭풍이(가) 지나간 아침
- ⬜ `dawn_raid.webp` — 약탈자 두목 까마귀에게 습격당한 아침
- ⬜ `dawn_death.webp` — 누군가를 잃은 아침, 빈자리
- ⬜ `dawn_sick.webp` — 앓는 사람 곁의 새벽
- ⬜ `dawn_hunger.webp` — 빈 그릇, 굶주린 얼굴들
- ⬜ `dawn_theft.webp` — 털린 창고
- ⬜ `dawn_cold.webp` — 연료가 떨어져 서로 껴안고 떠는 밤
- ⬜ `dawn_return.webp` — 밤 탐색에서 돌아온 사람들
- ⬜ `last_morning.webp` — 마지막 아침
- ⬜ `ending_all.webp` — 결말: 구조 헬기 프로펠러 소리가 재를 갈랐다.
- ⬜ `ending_most.webp` — 결말: 헬기에 오르며 누군가 뒤를 돌아봤다.
- ⬜ `ending_few.webp` — 결말: 헬기 문이 닫혔다.
- ⬜ `ending_riot.webp` — 결말: 희망이 꺼진 밤, 사람들이 당신을 대피소 밖으로 끌어냈다.
- ⬜ `ending_lost.webp` — 결말: 재는 모든 것을 덮었다.

### 밤 장면

- ⬜ `n_shelf.webp` — [탐색 · 무너진 마트] 무너진 진열대 밑에 통조림 상자가 깔려 있다.
- ⬜ `n_family.webp` — [탐색 · 무너진 마트] 계산대 뒤에 한 가족이 숨어 있다.
- ⬜ `n_drum.webp` — [탐색 · 지하철 터널] 정비 차량 옆에 경유 드럼통.
- ⬜ `n_rats.webp` — [탐색 · 지하철 터널] 터널 저편에서 붉은 눈들이 반짝인다.
- ⬜ `n_er.webp` — [탐색 · 폐허 병원] 응급실 약품 창고.
- ⬜ `n_patient.webp` — [탐색 · 폐허 병원] 병상에 환자복 차림의 노인이 아직 살아 있다.
- ⬜ `n_geiger.webp` — [탐색 · 폐허 병원] 방사선 계측기가 미친 듯이 울린다.
- ⬜ `n_wire.webp` — [탐색 · 군 보급창] 철조망 너머 보급 컨테이너.
- ⬜ `n_body.webp` — [탐색 · 군 보급창] 컨테이너 옆에 군인 시신.
- ⬜ `n_guard.webp` — [탐색 · 약탈자 소굴] 약탈자 소굴 앞, 드럼통 불가에 보초가 졸고 있다.
- ⬜ `n_cage.webp` — [탐색 · 약탈자 소굴] 철창 안에 붙잡힌 사람이 있다.
- ⬜ `n_ash.webp` — [탐색] 돌아오는 길, 하늘이 검게 변하며 재가 쏟아진다.
- ⬜ `n_dog.webp` — [탐색] 폐허 골목에서 목줄 맨 개 한 마리가 따라온다.
- ⬜ `n_freezer.webp` — [함정 · 무너진 마트] 냉동 창고 문이 반쯤 열려 있다.
- ⬜ `n_crouch.webp` — [조우 · 무너진 마트] 통로 끝에 누군가 쭈그려 앉아 있다.
- ⬜ `n_train.webp` — [탐색 · 지하철 터널] 탈선한 전동차.
- ⬜ `n_deep.webp` — [함정 · 지하철 터널] 선로에 물이 가슴까지 찼다.
- ⬜ `n_signal.webp` — [조우 · 지하철 터널] 터널 저편에 불빛이 깜빡인다.
- ⬜ `n_morgue.webp` — [유혹 · 폐허 병원] 영안실.
- ⬜ `n_surgeon.webp` — [조우 · 폐허 병원] 수술실에 불이 켜져 있다.
- ⬜ `n_masks.webp` — [탐색 · 폐허 병원] 방재 창고.
- ⬜ `n_mine.webp` — [함정 · 군 보급창] 발밑에서 딸깍.
- ⬜ `n_armory.webp` — [탐색 · 군 보급창] 무기고 철창.
- ⬜ `n_fieldtent.webp` — [유혹 · 군 보급창] 야전 병원 텐트.
- ⬜ `n_feast.webp` — [조우 · 약탈자 소굴] 약탈자들이 불 앞에서 취해 노래한다.
- ⬜ `n_rope.webp` — [함정 · 약탈자 소굴] 소굴 뒷담.
- ⬜ `c_breath.webp` — [조우] 어둠 속에서 숨소리가 들린다.
- ⬜ `c_door.webp` — [조우] 잠긴 문 너머에서 누군가 속삭인다.
- ⬜ `c_pocket.webp` — [갈등] …이(가) 방금 주운 …을(를) 몰래 주머니에 넣는 걸 봤다.
- ⬜ `c_turnback.webp` — [갈등] …이(가) 걸음을 멈춘다.
- ⬜ `c_hurtfriend.webp` — [갈등] …이(가) 발목을 접질렸다.
- ⬜ `c_corpse.webp` — [유혹] 길 한가운데 시신.
- ⬜ `c_kit.webp` — [유혹] 부서진 구급차.
- ⬜ `c_wire.webp` — [함정] 발목 높이에 가는 철사.
- ⬜ `ch_steps.webp` — [추격] 소리를 너무 많이 냈다.
- ⬜ `ch_pack.webp` — [추격] 울음소리 같은 것이 사방에서 대답한다.
- ⬜ `ch_collapse.webp` — [추격] 소리가 울리자 천장에서 먼지가 떨어진다.
- ⬜ `rv_corner.webp` — [다시 찾은 곳] 지난번에 왔던 그 자리다.
- ⬜ `rv_trace.webp` — [다시 찾은 곳] 다시 온 이곳은 지난번과 다르다.
- ⬜ `rv_trap.webp` — [다시 찾은 곳] 다시 온 이곳.
- ⬜ `rv_body.webp` — [다시 찾은 곳] 지난번 그 자리.

### 아침 사건

- ⬜ `theft.webp` — …이(가) 밤중에 …을(를) 몰래 먹다 걸렸다.
- ⬜ `argue.webp` — …와(과) …이(가) 마지막 담요 한 장을 두고 주먹다짐을 벌였다.
- ⬜ `despair.webp` — …이(가) 밤새 울었다.
- ⬜ `brave.webp` — …이(가) 혼자 …이(가) 올 곳까지 가서 신호를 남기겠다고 한다.
- ⬜ `rival_offer.webp` — …이(가) 찾아왔다.
- ⬜ `stranger.webp` — 문 앞에 낯선 사람이 쓰러져 있다.
- ⬜ `quarantine.webp` — …이(가) 열에 들떠 기침을 멈추지 못한다.
- ⬜ `child_share.webp` — …이(가) 바닥났다.
- ⬜ `neighbor_hurt.webp` — 건너편 건물에서 다친 이웃이 손을 흔든다.
- ⬜ `neighbor_food.webp` — 이웃 가족이 마지막 …을(를) 어디 숨겼는지 알아냈다.
- ⬜ `mercy.webp` — …이(가) 숨을 몰아쉰다.
- ⬜ `grief.webp` — …이(가) …이(가) 쓰던 자리에 앉아 아무 말도 하지 않는다.
- ⬜ `revenge.webp` — 문 앞에 낯익은 사람이 서 있다.
- ⬜ `radio_call.webp` — 하나의 무전기에서 목소리가 잡혔다.
- ⬜ `fever_kid.webp` — 준의 이마가 불덩이다.

## 극 빙하기 (`assets/scenarios/iceage/scenes/`)

### 분위기 (아침 장 · 막 · 결말)

- ⬜ `dawn_quiet.webp` — 조용한 아침, 거처 안
- ⬜ `dawn_storm.webp` — 눈보라이(가) 지나간 아침
- ⬜ `dawn_raid.webp` — 늑대단에게 습격당한 아침
- ⬜ `dawn_death.webp` — 누군가를 잃은 아침, 빈자리
- ⬜ `dawn_sick.webp` — 앓는 사람 곁의 새벽
- ⬜ `dawn_hunger.webp` — 빈 그릇, 굶주린 얼굴들
- ⬜ `dawn_theft.webp` — 털린 창고
- ⬜ `dawn_cold.webp` — 연료가 떨어져 서로 껴안고 떠는 밤
- ⬜ `dawn_return.webp` — 밤 탐색에서 돌아온 사람들
- ⬜ `last_morning.webp` — 마지막 아침
- ⬜ `act1.webp` — 1막 · 얼어붙은 기지 — 선로가 어디 있는지 알아내기
- ⬜ `act2.webp` — 2막 · 늑대의 겨울 — 떠날 준비: 선로와 썰매
- ⬜ `act3.webp` — 3막 · 남행 — 살아서 열차에 오르기
- ⬜ `ending_all.webp` — 결말: 눈 덮인 선로 끝에서 열차 불빛이 다가왔다.
- ⬜ `ending_most.webp` — 결말: 열차에 오르며 누군가 설원을 돌아봤다.
- ⬜ `ending_few.webp` — 결말: 열차 문이 닫혔다.
- ⬜ `ending_riot.webp` — 결말: 마지막 연료가 바닥난 밤, 사람들이 당신을 기지 밖으로 내몰았다.
- ⬜ `ending_lost.webp` — 결말: 눈은 기지를 완전히 덮었다.
- ⬜ `ending_missed.webp` — 결말: 열차 불빛이 지평선 저편으로 지나갔다.

### 밤 장면

- ⬜ `s_map.webp` — [탐색 · 버려진 관측소] 관측소 맨 안쪽, 측량실.
- ⬜ `s_sign.webp` — [탐색 · 얼어붙은 마을] 마을 끝 버스 정류장.
- ⬜ `s_sled.webp` — [탐색 · 추락한 수송기] 화물칸 맨 뒤.
- ⬜ `i_roof.webp` — [탐색 · 얼어붙은 마을] 굴뚝 하나만 눈 위로 삐죽 솟아 있다.
- ⬜ `i_family.webp` — [조우 · 얼어붙은 마을] 마을 끝 집 창문에 희미한 불빛이 있다.
- ⬜ `i_cellar.webp` — [함정 · 얼어붙은 마을] 부서진 헛간 바닥에 지하 저장고 문이 있다.
- ⬜ `i_coats.webp` — [유혹 · 얼어붙은 마을] 옷장 문이 반쯤 열려 있다.
- ⬜ `i_smoke.webp` — [조우 · 얼어붙은 마을] 마을 맨 끝 집 굴뚝에서 연기가 오른다.
- ⬜ `i_fuel.webp` — [탐색 · 빙하 동굴] 동굴 깊은 곳.
- ⬜ `i_bear.webp` — [조우 · 빙하 동굴] 동굴 안쪽에서 숨소리가 들린다.
- ⬜ `i_crevasse.webp` — [함정 · 빙하 동굴] 동굴 바닥이 쩍 갈라져 있다.
- ⬜ `i_echo.webp` — [조우 · 빙하 동굴] 동굴 안쪽에서 누군가 이름을 부른다.
- ⬜ `i_ration.webp` — [유혹 · 빙하 동굴] 투명한 얼음 속에 사람이 갇혀 있다.
- ⬜ `i_cargo.webp` — [탐색 · 추락한 수송기] 수송기 동체가 눈 위에 배를 깔고 누워 있다.
- ⬜ `i_pilot.webp` — [탐색 · 추락한 수송기] 꼬리 쪽에서 규칙적인 소리가 난다.
- ⬜ `i_tail.webp` — [함정 · 추락한 수송기] 수송기 꼬리가 낭떠러지 끝에 걸려 있다.
- ⬜ `i_survivor.webp` — [조우 · 추락한 수송기] 화물칸 구석에서 조종복 입은 사람이 웅크리고 있다.
- ⬜ `i_instr.webp` — [탐색 · 버려진 관측소] 관측소 문을 밀자 성에가 비처럼 쏟아진다.
- ⬜ `i_ghost.webp` — [유혹 · 버려진 관측소] 대원 숙소.
- ⬜ `i_wires.webp` — [함정 · 버려진 관측소] 발전기실 바닥에 물이 얼었다 녹았다를 반복했다.
- ⬜ `i_shoes.webp` — [탐색 · 버려진 관측소] 장비실 벽에 설피 한 켤레가 걸려 있다.
- ⬜ `i_wolfguard.webp` — [조우 · 늑대단 캠프] 늑대단 캠프.
- ⬜ `i_slave.webp` — [유혹 · 늑대단 캠프] 캠프 구석, 개 우리 옆.
- ⬜ `i_dogs.webp` — [조우 · 늑대단 캠프] 캠프의 썰매개 우리.
- ⬜ `i_trial.webp` — [유혹 · 늑대단 캠프] 캠프 한가운데.
- ⬜ `i_storm.webp` — [함정] 돌아오는 길.
- ⬜ `i_ice.webp` — [함정] 얼어붙은 호수를 건너야 한다.
- ⬜ `c_breath.webp` — [조우] 어둠 속에서 숨소리가 들린다.
- ⬜ `c_door.webp` — [조우] 잠긴 문 너머에서 누군가 속삭인다.
- ⬜ `c_pocket.webp` — [갈등] …이(가) 방금 주운 …을(를) 몰래 주머니에 넣는 걸 봤다.
- ⬜ `c_turnback.webp` — [갈등] …이(가) 걸음을 멈춘다.
- ⬜ `c_hurtfriend.webp` — [갈등] …이(가) 발목을 접질렸다.
- ⬜ `c_corpse.webp` — [유혹] 길 한가운데 시신.
- ⬜ `c_kit.webp` — [유혹] 부서진 구급차.
- ⬜ `c_wire.webp` — [함정] 발목 높이에 가는 철사.
- ⬜ `ch_steps.webp` — [추격] 소리를 너무 많이 냈다.
- ⬜ `ch_pack.webp` — [추격] 울음소리 같은 것이 사방에서 대답한다.
- ⬜ `ch_collapse.webp` — [추격] 소리가 울리자 천장에서 먼지가 떨어진다.
- ⬜ `rv_corner.webp` — [다시 찾은 곳] 지난번에 왔던 그 자리다.
- ⬜ `rv_trace.webp` — [다시 찾은 곳] 다시 온 이곳은 지난번과 다르다.
- ⬜ `rv_trap.webp` — [다시 찾은 곳] 다시 온 이곳.
- ⬜ `rv_body.webp` — [다시 찾은 곳] 지난번 그 자리.

### 마지막 밤

- ⬜ `f_cross.webp` — 기지 문을 닫았다.
- ⬜ `f_wolf_ally.webp` — 선로 앞.
- ⬜ `f_wolf_pass.webp` — 선로 앞을 늑대단이 막고 섰다.
- ⬜ `f_wolf_block.webp` — 송전탑 아래, 선로가 보인다.
- ⬜ `f_train.webp` — 멀리서 기적 소리.

### 아침 사건

- ⬜ `theft.webp` — …이(가) 밤중에 …을(를) 몰래 먹다 걸렸다.
- ⬜ `argue.webp` — …와(과) …이(가) 마지막 담요 한 장을 두고 주먹다짐을 벌였다.
- ⬜ `despair.webp` — …이(가) 밤새 울었다.
- ⬜ `brave.webp` — …이(가) 혼자 …이(가) 올 곳까지 가서 신호를 남기겠다고 한다.
- ⬜ `rival_offer.webp` — …이(가) 찾아왔다.
- ⬜ `stranger.webp` — 문 앞에 낯선 사람이 쓰러져 있다.
- ⬜ `quarantine.webp` — …이(가) 열에 들떠 기침을 멈추지 못한다.
- ⬜ `child_share.webp` — …이(가) 바닥났다.
- ⬜ `neighbor_hurt.webp` — 건너편 건물에서 다친 이웃이 손을 흔든다.
- ⬜ `neighbor_food.webp` — 이웃 가족이 마지막 …을(를) 어디 숨겼는지 알아냈다.
- ⬜ `mercy.webp` — …이(가) 숨을 몰아쉰다.
- ⬜ `grief.webp` — …이(가) …이(가) 쓰던 자리에 앉아 아무 말도 하지 않는다.
- ⬜ `revenge.webp` — 문 앞에 낯익은 사람이 서 있다.
- ⬜ `forecast.webp` — 은서가 기압계를 두드린다.
- ⬜ `frost_kid.webp` — 눈이의 손가락이 하얗게 얼었다.
- ⬜ `rival_r1.webp` — 백곰: 썰매 한 대가 기지 앞에 섰다.
- ⬜ `rival_r2.webp` — 백곰: 백곰이 혼자 왔다.
- ⬜ `rival_r3.webp` — 백곰: 백곰이 지도를 펼친다.
- ⬜ `arc_meteorologist_0.webp` — 은서 사연 1: 은서가 낡은 기상 도표를 펼친다.
- ⬜ `arc_meteorologist_1.webp` — 은서 사연 2: 은서가 창밖 별을 본다.
- ⬜ `arc_meteorologist_2.webp` — 은서 사연 3: 은서가 기압계를 두드린다.
- ⬜ `arc_hunter_0.webp` — 마루 사연 1: 백곰이라는 이름에 마루의 얼굴이 굳는다.
- ⬜ `arc_hunter_1.webp` — 마루 사연 2: 마루가 사냥총이 없는 손을 본다.
- ⬜ `arc_hunter_2.webp` — 마루 사연 3: 마루가 칼을 간다.
- ⬜ `arc_pilot_0.webp` — 한별 사연 1: 한별이 하늘을 올려다본다.
- ⬜ `arc_pilot_1.webp` — 한별 사연 2: 한별: “수송기 무전기를 살리면 열차 통제소에 닿을지도 몰라요.
- ⬜ `arc_pilot_2.webp` — 한별 사연 3: 한별이 눈을 빛낸다.
- ⬜ `arc_mechanic_0.webp` — 석구 사연 1: 석구가 난로를 두드린다.
- ⬜ `arc_mechanic_1.webp` — 석구 사연 2: 석구가 장갑을 벗는다.
- ⬜ `arc_mechanic_2.webp` — 석구 사연 3: 석구가 철판을 두드린다.
- ⬜ `arc_cook_0.webp` — 복순 사연 1: 복순이 자기 몫을 덜어 눈 밑에 묻는 걸 봤다.
- ⬜ `arc_cook_1.webp` — 복순 사연 2: 복순이 얼음 굴을 판다.
- ⬜ `arc_cook_2.webp` — 복순 사연 3: 복순이 마지막 쌀을 꺼낸다.
- ⬜ `arc_monk_0.webp` — 혜안 사연 1: 혜안이 밤마다 기지 밖에 촛불을 켠다.
- ⬜ `arc_monk_1.webp` — 혜안 사연 2: 혜안: “저 늑대단 사람들도 굶고 있습니다.
- ⬜ `arc_monk_2.webp` — 혜안 사연 3: 혜안이 열에 들떠 있다.
- ⬜ `arc_child_0.webp` — 눈이 사연 1: 눈이가 창밖을 본다.
- ⬜ `arc_child_1.webp` — 눈이 사연 2: 눈이가 그림을 내민다.
- ⬜ `arc_child_2.webp` — 눈이 사연 3: 눈이가 이불 속에서 묻는다.
- ⬜ `cb_boy_return.webp` — 돌아온 선택: 기지 문을 두드리는 소리.
- ⬜ `cb_boy_thanks.webp` — 돌아온 선택: 구해 온 소년이 늑대단 순찰 경로를 그려 준다.
- ⬜ `cb_old_smoke.webp` — 돌아온 선택: 얼어붙은 마을 쪽 하늘.
- ⬜ `cb_old_tale.webp` — 돌아온 선택: 데려온 할아버지가 지팡이로 눈 위에 선을 긋는다.
- ⬜ `cb_frozen_pilot.webp` — 돌아온 선택: 수송기에서 총을 빼앗고 두고 온 그 조종사.
- ⬜ `fin_eve.webp` — 떠나기 전날, 짐을 싸는 사람들

## 대홍수 (`assets/scenarios/flood/scenes/`)

### 분위기 (아침 장 · 막 · 결말)

- ⬜ `dawn_quiet.webp` — 조용한 아침, 거처 안
- ⬜ `dawn_storm.webp` — 폭우이(가) 지나간 아침
- ⬜ `dawn_raid.webp` — 선주 도윤에게 습격당한 아침
- ⬜ `dawn_death.webp` — 누군가를 잃은 아침, 빈자리
- ⬜ `dawn_sick.webp` — 앓는 사람 곁의 새벽
- ⬜ `dawn_hunger.webp` — 빈 그릇, 굶주린 얼굴들
- ⬜ `dawn_theft.webp` — 털린 창고
- ⬜ `dawn_cold.webp` — 연료가 떨어져 서로 껴안고 떠는 밤
- ⬜ `dawn_return.webp` — 밤 탐색에서 돌아온 사람들
- ⬜ `last_morning.webp` — 마지막 아침
- ⬜ `ending_all.webp` — 결말: 구조선이 왔을 때, 모두가 함께였다.
- ⬜ `ending_most.webp` — 결말: 구조선에 오르며 누군가는 뒤를 돌아봤다.
- ⬜ `ending_few.webp` — 결말: 살아남은 자들은 그 겨울 이야기를 하지 않는다.
- ⬜ `ending_riot.webp` — 결말: 희망이 꺼진 밤, 사람들이 당신을 끌어내렸다.
- ⬜ `ending_lost.webp` — 결말: 물은 모든 것을 삼켰다.

### 밤 장면

- ⬜ `st_shelf.webp` — [탐색 · 무너진 창고] 무너진 선반 밑에 쌀자루가 깔려 있다.
- ⬜ `st_rats.webp` — [탐색 · 무너진 창고] 쌀통 주위로 쥐 떼가 들끓는다.
- ⬜ `st_family.webp` — [탐색 · 무너진 창고] 창고 구석에 굶주린 가족이 웅크리고 있다.
- ⬜ `ph_door.webp` — [탐색 · 약국] 약국 문이 안에서 잠겼다.
- ⬜ `ph_shelf.webp` — [탐색 · 약국] 물에 젖은 약병들.
- ⬜ `ph_rival.webp` — [탐색 · 약국] 도윤의 사병 두 명이 먼저 와서 약을 쓸어 담고 있다.
- ⬜ `ml_stack.webp` — [탐색 · 목재소] 물에 뜬 판자 더미.
- ⬜ `ml_saw.webp` — [탐색 · 목재소] 목재소 기계 밑에 마른 장작이 보인다.
- ⬜ `gr_guard.webp` — [탐색 · 도윤의 쌀 창고] 횃불 아래 도윤의 사병이 졸고 있다.
- ⬜ `gr_inside.webp` — [탐색 · 도윤의 쌀 창고] 창고 안.
- ⬜ `wr_hold.webp` — [탐색 · 떠내려온 배] 기울어진 배의 화물칸.
- ⬜ `wr_radio.webp` — [탐색 · 떠내려온 배] 선장실에 무전기가 있다.
- ⬜ `wr_survivor.webp` — [탐색 · 떠내려온 배] 갑판 밑에서 신음 소리.
- ⬜ `st_cellar.webp` — [탐색 · 무너진 창고] 창고 바닥에 지하실 문이 있다.
- ⬜ `ml_dog.webp` — [탐색 · 목재소] 목재소 안에서 굶주린 개 떼가 으르렁거린다.
- ⬜ `ph_owner.webp` — [탐색 · 약국] 약국 주인 노인이 상처를 입고 쓰러져 있다.
- ⬜ `wr_crate.webp` — [탐색 · 떠내려온 배] 갑판 위에 단단히 묶인 상자.
- ⬜ `gr_dog.webp` — [탐색 · 도윤의 쌀 창고] 창고 뒤편에 도윤의 사냥개가 묶여 있다.
- ⬜ `any_current.webp` — [탐색] 돌아가는 길, 골목이 급류로 변했다.
- ⬜ `any_body.webp` — [탐색] 물 위에 떠 있는 시신.
- ⬜ `f_wire.webp` — [함정 · 무너진 창고] 물에 잠긴 창고 바닥.
- ⬜ `f_float.webp` — [조우 · 무너진 창고] 물 위에 무언가 떠 있다.
- ⬜ `f_torch.webp` — [탐색 · 약국] 약국 진열장 아래, 방수 손전등과 붕대 상자.
- ⬜ `f_pharmacist.webp` — [유혹 · 약국] 약사가 계산대 뒤에서 죽어 있다.
- ⬜ `f_current.webp` — [함정 · 목재소] 목재소 뒤편 물살이 거세다.
- ⬜ `f_saw.webp` — [조우 · 목재소] 톱밥 더미 위에 사내가 앉아 도끼를 간다.
- ⬜ `f_guards.webp` — [유혹 · 도윤의 쌀 창고] 쌀 창고 사병 하나가 몰래 손짓한다.
- ⬜ `f_boat.webp` — [탐색 · 떠내려온 배] 뒤집힌 배 밑에 고무보트가 끼어 있다.
- ⬜ `c_breath.webp` — [조우] 어둠 속에서 숨소리가 들린다.
- ⬜ `c_door.webp` — [조우] 잠긴 문 너머에서 누군가 속삭인다.
- ⬜ `c_pocket.webp` — [갈등] …이(가) 방금 주운 …을(를) 몰래 주머니에 넣는 걸 봤다.
- ⬜ `c_turnback.webp` — [갈등] …이(가) 걸음을 멈춘다.
- ⬜ `c_hurtfriend.webp` — [갈등] …이(가) 발목을 접질렸다.
- ⬜ `c_corpse.webp` — [유혹] 길 한가운데 시신.
- ⬜ `c_kit.webp` — [유혹] 부서진 구급차.
- ⬜ `c_wire.webp` — [함정] 발목 높이에 가는 철사.
- ⬜ `ch_steps.webp` — [추격] 소리를 너무 많이 냈다.
- ⬜ `ch_pack.webp` — [추격] 울음소리 같은 것이 사방에서 대답한다.
- ⬜ `ch_collapse.webp` — [추격] 소리가 울리자 천장에서 먼지가 떨어진다.
- ⬜ `rv_corner.webp` — [다시 찾은 곳] 지난번에 왔던 그 자리다.
- ⬜ `rv_trace.webp` — [다시 찾은 곳] 다시 온 이곳은 지난번과 다르다.
- ⬜ `rv_trap.webp` — [다시 찾은 곳] 다시 온 이곳.
- ⬜ `rv_body.webp` — [다시 찾은 곳] 지난번 그 자리.

### 아침 사건

- ⬜ `theft.webp` — …이(가) 밤중에 …을(를) 몰래 먹다 걸렸다.
- ⬜ `argue.webp` — …와(과) …이(가) 마지막 담요 한 장을 두고 주먹다짐을 벌였다.
- ⬜ `despair.webp` — …이(가) 밤새 울었다.
- ⬜ `brave.webp` — …이(가) 혼자 …이(가) 올 곳까지 가서 신호를 남기겠다고 한다.
- ⬜ `rival_offer.webp` — …이(가) 찾아왔다.
- ⬜ `stranger.webp` — 문 앞에 낯선 사람이 쓰러져 있다.
- ⬜ `quarantine.webp` — …이(가) 열에 들떠 기침을 멈추지 못한다.
- ⬜ `child_share.webp` — …이(가) 바닥났다.
- ⬜ `neighbor_hurt.webp` — 건너편 건물에서 다친 이웃이 손을 흔든다.
- ⬜ `neighbor_food.webp` — 이웃 가족이 마지막 …을(를) 어디 숨겼는지 알아냈다.
- ⬜ `mercy.webp` — …이(가) 숨을 몰아쉰다.
- ⬜ `grief.webp` — …이(가) …이(가) 쓰던 자리에 앉아 아무 말도 하지 않는다.
- ⬜ `revenge.webp` — 문 앞에 낯익은 사람이 서 있다.
- ⬜ `cough.webp` — 도담의 기침이 심해졌다.
- ⬜ `doyun_offer.webp` — 도윤의 배가 거처 앞에 섰다.
- ⬜ `haejin.webp` — 강해진이 밤마다 몰래 나간다는 말이 돈다.

## 장비 (`assets/gear/`)

- ⬜ `crowbar.webp` — 쇠지레 — 문·잔해를 여는 판정 +2
- ⬜ `knife.webp` — 칼 — 몸싸움 판정 +2
- ⬜ `lamp.webp` — 등불 — 살피기 +1 · 어둠 판정 +2 · 기름이 닳는다
- ⬜ `rope.webp` — 밧줄 — 함정 장면 +2
- ⬜ `medkit.webp` — 구급상자 — 밖에서 다칠 때 막아 준다 (2번)
- ⬜ `pack.webp` — 큰 배낭 — 가져오는 양 ×1.5
- ⬜ `gasmask.webp` — 방독면 (핵겨울) — 오염 지역 피폭을 막는다
- ⬜ `geiger.webp` — 가이거 계수기 (핵겨울) — 들어간 곳에 남은 양을 알려 준다
- ⬜ `pistol.webp` — 권총 (핵겨울) — 조우·추격에서 '쏜다' (총알 3)
- ⬜ `snowshoe.webp` — 설피 (극 빙하기) — 소음 −1 · 추격 +2
- ⬜ `furcoat.webp` — 털옷 (극 빙하기) — 동상을 막는다 · 집에서 추위를 막는다
- ⬜ `rifle.webp` — 사냥총 (극 빙하기) — 조우·추격에서 '쏜다' (총알 3)
- ⬜ `boat.webp` — 고무보트 (대홍수) — 물길 위험을 막는다 · 가져오는 양 ×1.3
- ⬜ `boots.webp` — 고무장화 (대홍수) — 함정(감전·급류) 장면 +2
- ⬜ `torch.webp` — 방수 손전등 (대홍수) — 살피기 +1 · 어둠 판정 +2 · 닳지 않는다
- ⬜ `trap.webp` — 덫 — 집에서 먹을 것 구하기 +3
