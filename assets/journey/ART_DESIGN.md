# 극 빙하기 · 여정 그림 설계서

> GPT(그림 담당)에게: 이 문서 하나만 보고 그리면 된다. **파일 이름은 표와 똑같이**, 폴더도 똑같이 넣는다.
> 게임 코드는 이 이름을 그대로 찾는다. 없는 그림은 비슷한 그림이 대신 나오니 한 장씩 넣어도 된다.
> 이야기 설계는 `survive/JOURNEY.md` (기지에서 남쪽 선로까지 설원을 건너는 한 사람의 여정, 판마다 다른 이야기).

---

## 1. 그림체 (모든 그림 공통)

- **실사풍 영화 장면.** 이미 넣은 빙하기 그림(`assets/scenarios/iceage/scenes/act2.webp`, `f_train.webp`, `rival_r1.webp`)과 같은 톤.
- **색**: 차가운 청회색·흰색이 바탕. **따뜻한 빛은 불·등불·난로에서만** 나온다. 하늘은 대부분 흐리거나 눈보라.
- **추위가 보여야 한다**: 서리 낀 눈썹, 언 입김, 얼어붙은 천, 바람에 날리는 눈가루.
- **사람**: 두꺼운 방한복, 후드와 목도리로 얼굴 일부가 가려져도 좋다. 같은 인물은 **모든 그림에서 같은 옷과 얼굴**(아래 인물 표 참고).
- **넣지 않는 것**: 글자, 로고, 간판 글씨, 화면 테두리, 워터마크. 표지판은 글씨 없이 형태만.
- **잔혹함**: 시신·피는 나와도 되지만 절제한다(얼어붙은 실루엣, 눈에 스민 얼룩 정도). 고어 금지.

## 2. 크기와 구도

| 종류 | 폴더 | 크기 | 구도 |
|---|---|---|---|
| 장소 | `assets/journey/places/` | 1536×864 (16:9) | 장소 전경. 사람은 작게 있거나 없다. **위쪽 60%에 중심**, 아래 30%는 어둡게(글이 그 위로 스며든다) |
| 장면 | `assets/journey/scenes/` | 1536×864 | 이야기의 한 순간. 인물 중심. 위와 같은 여백 규칙 |
| 결말 | `assets/journey/endings/` | 1536×864 | 마지막 장면. 조금 더 넓고 고요하게 |
| 인물 초상 | `assets/journey/people/` | 512×512 | 어깨 위 정면~3/4. 어두운 배경, **왼쪽 위에서 따뜻한 빛**. 원형으로 잘려도 얼굴이 살게 가운데 |
| 출신 카드 | `assets/journey/origins/` | 1024×1365 (3:4 세로) | 시작 화면에서 고르는 카드. 그 사람이 시작 장소에 서 있는 모습 |
| 물건 | `assets/journey/items/` | 512×512 | 어두운 배경 위 물건 하나, 비스듬한 빛. **이미 있는 `assets/gear/` 그림과 같은 스타일** |
| 화면 바탕 | `assets/journey/ui/` | 표에 적힌 크기 | 글자 없음 |

모두 **webp**. 파일 이름은 영어 소문자와 밑줄만.

---

## 3. 인물 (모습을 고정한다)

### 3-1. 주인공 (출신 5개 × 남/여)
초상 `people/<이름>.webp` + 출신 카드 `origins/<출신>.webp` (카드는 남자 버전 한 장이면 된다)

| 파일 | 출신 | 모습 |
|---|---|---|
| `parent_m` / `parent_f` | 딸을 찾는 부모 | 40대. 지친 눈, 낡은 연구소 방한복(주황색 반사띠가 바랬다). 목에 휴대 무전기, 손에 작은 사진 |
| `deserter_m` / `deserter_f` | 늑대단 탈출자 | 30대. 흰 늑대 털 장식을 뜯어낸 자국이 있는 검은 털옷, 얼굴에 오래된 흉터, 날 선 눈빛 |
| `crew_m` / `crew_f` | 기지의 마지막 대원 | 30대. 연구 기지 대원복(파란 패치에 번호), 두꺼운 안경에 성에, 손에 낡은 수첩 |
| `pilot_m` / `pilot_f` | 추락한 조종사 | 30대. 그을린 조종복 위에 담요를 두름, 이마에 붕대, 헤드셋을 목에 걸었다 |
| `drifter_m` / `drifter_f` | 이름 없는 떠돌이 | 나이를 알 수 없음. 여러 옷을 겹쳐 입었다. 얼굴 대부분을 목도리로 가림, 눈만 보인다 |

출신 카드: `origins/parent.webp`(눈 덮인 연구 기지 문 앞, 무전기를 귀에 댄다) · `origins/deserter.webp`(늑대단 캠프 불빛을 등지고 눈밭을 달린다) · `origins/crew.webp`(텅 빈 기지 식당, 일곱 개의 빈 의자) · `origins/pilot.webp`(부서진 수송기 날개 아래) · `origins/drifter.webp`(끝없는 설원 한가운데 혼자)

### 3-2. 동행 후보 4명
이미 있는 초상(`assets/scenarios/iceage/portraits/`)과 **같은 얼굴·옷**으로. 기본 초상은 다시 그리지 않고, **표정 3가지**만 새로 그린다.

| 이름 | 기존 초상 | 새로 그릴 표정 |
|---|---|---|
| 마루 (사냥꾼, 말 없는 거구) | `hunter.webp` | `maru_angry` · `maru_hurt` · `maru_grief` |
| 한별 (조종사, 밝지만 지친) | `pilot.webp` | `hanbyeol_hopeful` · `hanbyeol_hurt` · `hanbyeol_tears` |
| 혜안 (스님, 고요함) | `monk.webp` | `hyean_calm` · `hyean_sick` · `hyean_smile` |
| 은서 (기상학자, 예민함) | `meteorologist.webp` | `eunseo_worried` · `eunseo_hurt` · `eunseo_resolve` |

### 3-3. 조연과 라이벌

| 파일 | 누구 | 모습 |
|---|---|---|
| `baekgom` | 늑대단 두목 백곰 | 거구, **흰 곰 털옷**(기존 `rival_r1.webp`의 그 사람), 짧은 수염, 웃는 듯 차가운 눈 |
| `baekgom_rage` · `baekgom_broken` | 백곰 표정 | 분노 / 무너져 무릎 꿇은 |
| `gu` · `gu_cold` | 떠돌이 상인 구씨 | 50대, 개털 모자, 금니, 썰매 끈을 쥔 손. 웃는 얼굴 / 웃음이 사라진 얼굴 |
| `stationmaster` | 하얀나루역 역장 노인 | 70대, 낡은 철도 제복 모자, 하얀 수염, 굶어서 야윈 볼 |
| `dochi_chained` · `dochi_wolf` | 사슬 소년 도치 (12살) | 맨발에 사슬, 겁먹었지만 울지 않는 눈 / 같은 얼굴에 늑대단 털옷, 총을 든 |
| `soi` · `soi_sick` | 딸 소이 (9살) | 짧은 단발, 큰 눈, 빨간 털모자 / 열에 들떠 백곰의 털옷에 싸인 |
| `twins` | 추적자 쌍둥이 | 똑같은 얼굴 둘, 늑대 가죽 두건, 썰매개 채찍 |
| `old_comrade` | 탈출자의 옛 동료 | 늑대단 털옷, 한쪽 귀가 없다, 망설이는 표정 |
| `crew_survivor` | 살아남은 대원 | 대원복 위에 늑대단 털옷, 겁에 질린 눈, 무언가 숨기는 손 |
| `wolf_guard` | 늑대단 보초(이름 없음) | 털옷, 늑대 머리뼈 장식, 얼굴 반을 가린 천 |
| `villager_woman` · `villager_old` | 마을 사람 | 굶주린 엄마와 아기 / 장작을 쪼개는 노인 |

---

## 4. 장소

### 시작 장소
| 파일 | 장소 |
|---|---|
| `places/start_base.webp` | 눈에 반쯤 묻힌 연구 기지. 돔 안테나, 불 꺼진 창 |
| `places/start_wreck.webp` | 설원 위 부서진 수송기. 꼬리날개가 비스듬히 솟았다 |
| `places/start_outskirts.webp` | 늑대단 캠프 불빛이 멀리 보이는 밤의 눈밭, 발자국 하나 |

### 1막 · 얼어붙은 마을들
| 파일 | 장소 |
|---|---|
| `places/frozen_village.webp` | 지붕까지 눈에 묻힌 마을, 굴뚝 하나에서만 연기 |
| `places/abandoned_church.webp` | 종탑이 기운 시골 교회, 깨진 스테인드글라스로 눈이 들이친다 |
| `places/ice_cave.webp` | 푸른 빙하 동굴 입구, 안쪽 얼음 속에 드럼통 |
| `places/hunter_cabin.webp` | 숲속 통나무 오두막, 처마에 매달린 언 짐승 가죽 |
| `places/observatory.webp` | 언덕 위 관측소, 얼어붙은 안테나 숲 |
| `places/pylon_road.webp` | 끝없이 이어지는 송전탑 줄, 탑 사이로 끊어진 전선 |
| `places/buried_highway.webp` | 눈에 묻힌 고속도로, 지붕만 보이는 차들의 줄 |
| `places/gate_bridge.webp` | **관문 1** · 강 위 무너진 철교, 가운데가 끊겼다. 아래 얼음 강 |

### 2막 · 늑대단의 땅
| 파일 | 장소 |
|---|---|
| `places/merchant_sled.webp` | 상인 구씨의 큰 썰매, 물건 꾸러미와 개 여섯 마리, 등불 |
| `places/wolf_outpost.webp` | 늑대 머리뼈를 꽂은 말뚝 울타리, 감시탑 |
| `places/abandoned_mine.webp` | 산비탈의 탄광 입구, 녹슨 광차 레일 |
| `places/crew_lastcamp.webp` | 쓰러진 텐트들, 눈에 반쯤 묻힌 대원 장비, 파란 패치 |
| `places/wolf_kennel.webp` | 늑대단 개 우리 옆, 사슬이 매달린 기둥 |
| `places/frozen_lake.webp` | 넓은 얼음 호수, 얼음 아래 검은 물, 멀리 섬 하나 |
| `places/wolf_camp.webp` | 늑대단 캠프 전경, 텐트 열두 개와 큰 모닥불 |
| `places/gate_checkpoint.webp` | **관문 2** · 협곡 길을 막은 늑대단 검문소, 차단봉과 횃불 |

### 3막 · 남쪽 산맥
| 파일 | 장소 |
|---|---|
| `places/mountain_pass.webp` | **관문 3** · 바람 칼날 같은 산길, 한쪽은 낭떠러지 |
| `places/station_whiteferry.webp` | 하얀나루역. 눈 덮인 작은 시골 역, 녹슨 승강장, 끝없는 선로 |
| `places/geothermal_valley.webp` | 김이 오르는 계곡, 눈 사이로 초록 이끼, 돌담 마을 |
| `places/old_airfield.webp` | 버려진 군 비행장, 눈 덮인 활주로, 격납고 하나 |
| `places/return_road.webp` | 왔던 길을 되돌아가는 설원, 멀리 아주 작게 기지 돔 |

### 야영 (매일 밤)
| 파일 | 장면 |
|---|---|
| `places/camp_fire.webp` | 바위 그늘 아래 작은 모닥불 |
| `places/camp_cave.webp` | 동굴 안 야영 |
| `places/camp_ruin.webp` | 무너진 건물 안 야영, 벽 틈으로 바람 |
| `places/camp_storm.webp` | 눈보라 속 눈굴, 등불 하나 |

---

## 5. 장면 (이야기의 순간들)

### 5-1. 전제별 박자 (판마다 전제 하나가 고른다)
| 전제 | 파일 | 장면 |
|---|---|---|
| **배신** | `scenes/bt_trust.webp` | 모닥불 앞에서 동행과 마지막 통조림을 나눈다 |
| | `scenes/bt_crack.webp` | 동행이 밤에 몰래 무언가를 품에 숨기는 뒷모습 |
| | `scenes/bt_evidence.webp` | 눈 위에 떨어진 쪽지와 낯선 발자국 |
| | `scenes/bt_betrayal.webp` | 설원에 홀로 남겨진 주인공, 멀어지는 썰매 |
| | `scenes/bt_reckoning.webp` | 칼끝 앞에 무릎 꿇은 배신자, 눈보라 |
| **숨은 혈육** | `scenes/hk_radio.webp` | 어두운 방, 잡음 섞인 무전기 앞에 귀를 댄 주인공 |
| | `scenes/hk_photo.webp` | 낡은 사진을 내밀며 묻는 손, 고개를 젓는 상대 |
| | `scenes/hk_sick_child.webp` | 백곰이 털옷에 싼 아픈 아이를 안고 서 있다 |
| | `scenes/hk_reveal.webp` | 아이가 사진을 보고 얼어붙는 순간 |
| | `scenes/hk_choice.webp` | 주인공과 백곰 사이에 선 아이, 둘을 번갈아 본다 |
| **거짓 구원** | `scenes/fs_map_sale.webp` | 상인 구씨가 등불 아래 지도를 펼쳐 보인다 |
| | `scenes/fs_bloodstain.webp` | 썰매 바닥 판자 틈의 얼어붙은 핏자국 |
| | `scenes/fs_gathering.webp` | 피난처를 향해 설원을 걷는 사람들의 긴 행렬 |
| | `scenes/fs_trap.webp` | 커다란 철문이 등 뒤에서 닫힌다 |
| | `scenes/fs_cages.webp` | 철창 안에 갇힌 사람들, 바깥에 늑대단 |
| **희생** | `scenes/sc_last_seat.webp` | 한 자리만 남은 화물칸 문, 손을 뻗은 사람들 |
| | `scenes/sc_staying.webp` | 떠나는 사람들을 바라보며 남는 뒷모습 |
| | `scenes/sc_letter.webp` | 언 손으로 쓰는 편지, 등불 |

### 5-2. 그 겨울의 과거와 미스터리
| 파일 | 장면 |
|---|---|
| `scenes/past_night.webp` | **회상**: 3년 전 기지 식당, 탑승 명단을 두고 다투는 대원들 (색이 바랜 세피아 톤) |
| `scenes/past_list.webp` | 열차 탑승 명단 종이(글씨는 알아볼 수 없게), 몇 줄에 줄이 그어져 있다 |
| `scenes/crew_bodies.webp` | 눈 속 대원 시신과 파란 번호 패치 |
| `scenes/recorded_voice.webp` | 녹음기 테이프가 돌아가는 클로즈업 |
| `scenes/past_self.webp` | 눈 속에 웅크린 이전 사람의 시신, 품에 일기장 (다음 판에서 발견하는 '지난 판의 나') |

### 5-3. 명장면 (판마다 3개)
| 파일 | 장면 |
|---|---|
| `scenes/sp_ice_chase.webp` | 갈라지는 얼음 호수 위를 썰매개에 쫓겨 달린다 |
| `scenes/sp_checkpoint_sneak.webp` | 검문소 횃불 그림자 사이로 기어간다 |
| `scenes/sp_train_roof.webp` | 달리는 열차 지붕 위에서 대치, 눈보라 |
| `scenes/sp_avalanche.webp` | 산비탈에서 쏟아지는 눈사태 |
| `scenes/sp_wolfpack.webp` | 밤, 모닥불 바깥 어둠 속 늑대 눈빛 여럿 |
| `scenes/sp_whiteout.webp` | 화이트아웃, 밧줄로 서로를 묶고 걷는 사람들 |

### 5-4. 절정 (빚이 한자리에 모인다)
| 파일 | 장면 |
|---|---|
| `scenes/climax_tracks.webp` | 선로 앞에 모인 여러 사람(상인·소년·노인·늑대단), 멀리 열차 불빛 |
| `scenes/climax_valley.webp` | 피난처 돌담 문 앞, 안과 밖으로 갈린 사람들 |
| `scenes/climax_airfield.webp` | 시동 거는 비행기 옆, 다가오는 늑대단 썰매들 |

### 5-5. 야영과 일상
| 파일 | 장면 |
|---|---|
| `scenes/camp_talk.webp` | 모닥불을 사이에 두고 동행과 이야기 |
| `scenes/camp_treat.webp` | 상처에 붕대를 감아 주는 손 |
| `scenes/camp_cold.webp` | 연료가 떨어져 등을 맞대고 떠는 두 사람 |
| `scenes/camp_watch.webp` | 칼을 쥐고 어둠을 지키는 보초 |
| `scenes/trade_merchant.webp` | 상인 썰매 위에 펼쳐진 물건들, 흥정하는 손 |
| `scenes/find_item.webp` | 잔해 속에서 무언가를 꺼내는 손, 등불 빛 |
| `scenes/companion_leaves.webp` | 등을 돌려 떠나는 동행 |
| `scenes/companion_confront.webp` | 동행이 주인공 앞을 막아선다 |

---

## 6. 결말 11개
| 파일 | 결말 |
|---|---|
| `endings/end_train.webp` | 남행 열차 화물칸 안, 창밖으로 멀어지는 설원 |
| `endings/end_refuge.webp` | 김 오르는 피난처 마을, 닫히는 돌담 문 |
| `endings/end_sky.webp` | 구름 위로 오른 낡은 비행기, 처음 보는 햇빛 |
| `endings/end_spring.webp` | 기지 처마의 고드름이 녹아 떨어진다, 사람들이 밖에 나와 있다 |
| `endings/end_king.webp` | 늑대단 캠프 큰 모닥불 앞 흰 털옷을 걸친 주인공의 뒷모습 |
| `endings/end_wolves.webp` | 늑대단 썰매 행렬 속 주인공 |
| `endings/end_signal.webp` | 관측소 안 무전기 앞에 혼자 앉은 주인공, 창밖 눈 |
| `endings/end_seat.webp` | 떠나는 열차를 승강장에서 바라보는 뒷모습 |
| `endings/end_frozen.webp` | 눈 속에서 잠든 사람, 고요한 별하늘 |
| `endings/end_missed.webp` | 텅 빈 선로, 지평선 너머 사라지는 불빛 |
| `endings/end_inhuman.webp` | 열차 칸 안, 주인공 주변만 텅 비어 있다 |

---

## 7. 물건 (`assets/journey/items/`)
**이미 있는 것은 다시 그리지 않는다** (`assets/gear/`의 crowbar, knife, lamp, rope, medkit, pack, snowshoe, furcoat, rifle, trap은 그대로 쓴다).

| 종류 | 새로 그릴 파일 |
|---|---|
| 도구 | `lighter` 라이터 · `shovel` 접이식 삽 · `compass` 나침반 · `hammer` 망치 · `torch_fire` 기름 먹인 횃불 |
| 무기 | `axe` 손도끼 · `ammo` 총알 몇 발 |
| 방한 | `sleeping_bag` 침낭 · `gloves` 두꺼운 장갑 |
| 의료 | `bandage` 붕대 롤 · `antibiotics` 항생제 병 · `painkiller` 진통제 · `alcohol` 소독용 알코올 병 |
| 식량 | `can` 통조림 · `jerky` 말린 고기 · `chocolate` 초콜릿 |
| 교환품 | `cigarettes` 담배 갑(글씨 없이) · `liquor` 술병 · `battery` 배터리 · `gold_ring` 금반지 |
| 재료 | `cloth` 천 조각 · `scrap` 고철 · `leather` 가죽 · `string` 끈 · `oil` 기름 깡통 |
| 열쇠·단서 | `route_map` 노선도 · `refuge_note` 피난처 쪽지 · `vacuum_tube` 무전기 진공관 · `crew_diary` 대원 일기 · `soi_photo` 아이 사진 · `wolf_token` 늑대 이빨 목걸이 표식 · `passenger_list` 탑승 명단 · `radio` 휴대 무전기 · `crew_badge` 파란 번호 패치 · `tape` 녹음 테이프 |
| 큰 물건 | `sled` 썰매 (가방이 아니라 짐 수레) |

---

## 8. 화면 바탕 (`assets/journey/ui/`)
| 파일 | 크기 | 내용 |
|---|---|---|
| `title.webp` | 1080×1920 (세로) | 설원 한가운데 작은 사람 하나, 멀리 선로. 위쪽 1/3은 비어 있게(제목이 들어간다) |
| `map_act1.webp` | 1080×1920 | 위에서 내려다본 1막 지형: 마을들, 숲, 강. **길·표식·글씨 없이** 지형만 (길은 코드가 그린다) |
| `map_act2.webp` | 1080×1920 | 2막 지형: 협곡, 얼음 호수, 탄광 산 |
| `map_act3.webp` | 1080×1920 | 3막 지형: 산맥, 계곡, 남쪽 평원과 선로 |
| `journal_paper.webp` | 1024×1024 | 어둡고 낡은 종이 질감 (기록 화면 바탕, 은은하게) |

---

## 9. 그리는 순서

**1차 (먼저 · 약 50장)**: 이야기를 시작할 수 있는 최소한
- 출신 3개(부모·탈출자·떠돌이)의 초상 남/여 6장 + 출신 카드 3장
- 시작 장소 3 · 1막 장소 8(관문 포함) · 야영 2(`camp_fire`, `camp_storm`)
- 조연: `baekgom` `gu` `stationmaster` `dochi_chained` `soi`
- 전제 3개(배신·숨은 혈육·거짓 구원)의 박자 15장
- 화면: `title`, `map_act1`
- 물건: 열쇠·단서 10장

**2차**: 2막 장소 8 · 명장면 6 · 과거/미스터리 5 · 동행 표정 12 · 조연 나머지 · 물건 나머지 · `map_act2`

**3차**: 3막 장소 5 · 절정 3 · 결말 11 · 희생 박자 3 · 야영 나머지 · 출신 2개(대원·조종사) · `map_act3` · `journal_paper`

다 넣은 뒤 `node scripts/art-list.js`를 돌리면 여정 그림도 목록에 ✅로 표시되게 할 예정이다.
