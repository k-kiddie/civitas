# CIVITAS 생존 시나리오 그림 의뢰서 (GPT용)

이 문서대로 그림을 만들어 **아래 폴더에, 아래 파일 이름 그대로** 넣어 주세요.
게임 코드는 이 파일 이름을 찾아서 씁니다. 파일이 없으면 임시 그림이 나오고, 넣는 순간 바로 바뀝니다.

## 폴더와 형식

```
assets/scenarios/
  nuclear/            ← ☢ 핵겨울
    scenes/*.webp     ← 장면 그림 15장
    portraits/*.webp  ← 인물 초상 8장
  iceage/             ← ❄ 극 빙하기
    scenes/*.webp
    portraits/*.webp
```

- 대홍수 시나리오는 이미 있는 그림(`assets/events/`, `assets/portraits/`)을 쓰므로 새로 그리지 않아도 됩니다.
- **장면 그림**: 가로 16:9, 1024×576 이상, `.webp`(어려우면 `.png`도 됨, 이름은 같게)
- **인물 초상**: 정사각형 512×512, 얼굴과 어깨가 가운데, 배경은 어둡고 흐리게, `.webp`
- 글자·로고·워터마크를 넣지 마세요.
- 한 시나리오 안에서 화풍이 같아야 합니다. 아래 "공통 화풍" 문구를 모든 지시문 앞에 붙이세요.

## 공통 화풍

> cinematic digital oil painting, muted desaturated palette, dramatic low light, realistic proportions, Korean people, gritty survival atmosphere, painterly brush texture, no text, no watermark

- 핵겨울 추가: `nuclear winter, grey ash falling, ruined Korean city, cold green-grey tones, gas masks and patched coats`
- 빙하기 추가: `extreme ice age, endless snow, blizzard, deep blue and white tones, frost on faces, fur and layered parkas`

---

## ☢ 핵겨울 `assets/scenarios/nuclear/`

### scenes/
| 파일 | 그림 내용 |
|---|---|
| `title.webp` | 잿빛 하늘 아래 무너진 서울 스카이라인, 멀리 꺼지지 않은 불, 방독면 쓴 사람 넷의 뒷모습 |
| `shelter.webp` | 무너진 지하철역 승강장을 개조한 대피소. 드럼통 불, 매트리스, 걸어 둔 빨래, 희미한 전등 |
| `night.webp` | 손전등을 들고 대피소 출입구 계단을 올라가는 두 사람, 밖은 칠흑 같은 폐허 |
| `dawn.webp` | 재가 내리는 회색 새벽, 대피소 입구에 앉아 담배를 무는 생존자 |
| `threat_held.webp` | 낙진 폭풍이 지나간 뒤, 비닐과 판자로 막은 입구가 버텨 낸 장면 |
| `threat_hit.webp` | 낙진 폭풍이 대피소 안으로 들이치는 장면, 기침하며 몸을 가리는 사람들 |
| `hospital.webp` | 폐허가 된 병원 복도, 쓰러진 침대와 흩어진 약병 |
| `depot.webp` | 철조망이 쳐진 군 보급창, 녹슨 컨테이너와 경고 표지 |
| `mart.webp` | 천장이 무너진 대형 마트, 비어 가는 진열대 |
| `raider.webp` | 불을 피운 약탈자 소굴, 해골 장식과 빼앗은 물건 더미 |
| `tunnel.webp` | 물이 고인 어두운 지하철 터널, 멀리 녹색 빛 |
| `event_people.webp` | 대피소 안 드럼통 불가에 모여 언쟁하는 생존자들 |
| `event_rival.webp` | 방독면에 가죽 코트를 입은 약탈자 두목이 무리를 이끌고 대피소 앞에 선 장면 |
| `ending_good.webp` | 잿빛 구름 사이로 내려오는 구조 헬기, 손을 흔드는 생존자들 |
| `ending_bad.webp` | 텅 빈 대피소, 꺼진 드럼통 불, 벽에 새긴 이름들 |

### portraits/
| 파일 | 인물 |
|---|---|
| `leader.webp` | 30대, 대피소의 대표. 지치지만 결연한 눈, 낡은 야전 점퍼 |
| `medic.webp` | 지수, 20대 후반 여성 간호사. 피 묻은 간호복 위에 방풍 재킷, 목에 방독면 |
| `soldier.webp` | 강철, 40대 남성 전직 하사. 짧은 머리, 흉터, 낡은 군복 |
| `electrician.webp` | 덕배, 50대 남성 전기공. 수염, 작업복, 이마에 헤드랜턴 |
| `teacher.webp` | 미영, 30대 여성 교사. 안경, 털모자, 겁먹었지만 다정한 얼굴 |
| `scavenger.webp` | 고물상 할아버지, 70대. 주름, 누더기 외투, 교활한 웃음 |
| `radio.webp` | 하나, 16세 소녀. 헤드폰을 목에 건 채 무전기를 든 모습 |
| `child.webp` | 준, 7세 소년. 커다란 어른 점퍼, 먼지 묻은 얼굴 |

---

## ❄ 극 빙하기 `assets/scenarios/iceage/`

### scenes/
| 파일 | 그림 내용 |
|---|---|
| `title.webp` | 끝없는 설원 위에 반쯤 묻힌 연구 기지, 눈보라 속 사람 넷의 실루엣 |
| `shelter.webp` | 눈에 묻힌 기지 내부. 난로 하나에 모인 침낭들, 창문에 낀 성에 |
| `night.webp` | 썰매를 끌고 눈보라 속으로 나서는 두 사람, 손전등 빛 |
| `dawn.webp` | 얼어붙은 푸른 새벽, 기지 굴뚝에서 오르는 가는 연기 |
| `threat_held.webp` | 눈보라를 버텨 낸 기지, 문 앞에 쌓인 눈을 치우는 사람들 |
| `threat_hit.webp` | 눈보라에 창문이 깨지고 눈이 들이치는 기지 내부 |
| `village.webp` | 지붕까지 눈에 묻힌 마을, 굴뚝만 삐죽 나온 집들 |
| `plane.webp` | 설원에 추락한 수송기 잔해, 반쯤 열린 화물칸 |
| `cave.webp` | 푸르게 빛나는 빙하 동굴 내부, 고드름 |
| `camp.webp` | 다른 생존자들의 텐트 캠프, 모닥불과 경계하는 사람들 |
| `station.webp` | 버려진 기상 관측소, 얼어붙은 안테나와 계기판 |
| `event_people.webp` | 난로 앞에 모여 마지막 장작을 두고 언쟁하는 생존자들 |
| `event_rival.webp` | 털가죽을 두른 무장 생존자 무리가 기지 앞 설원에 늘어선 장면 |
| `ending_good.webp` | 눈 덮인 선로를 달려오는 남행 열차의 불빛, 손을 흔드는 사람들 |
| `ending_bad.webp` | 눈에 완전히 묻힌 기지, 꺼진 난로 |

### portraits/
| 파일 | 인물 |
|---|---|
| `leader.webp` | 30대, 기지의 대표. 성에 낀 속눈썹, 겹겹이 입은 파카 |
| `meteorologist.webp` | 은서, 30대 여성 기상학자. 둥근 안경, 털모자, 지친 눈 |
| `hunter.webp` | 마루, 40대 남성 사냥꾼. 수염에 고드름, 털가죽 망토, 활 |
| `pilot.webp` | 한별, 20대 여성 조종사. 비행 재킷, 고글을 이마에 올림 |
| `mechanic.webp` | 석구, 50대 남성 정비공. 기름 묻은 얼굴, 두꺼운 장갑 |
| `cook.webp` | 복순, 60대 여성 취사병 출신. 앞치마 위 파카, 단단한 표정 |
| `monk.webp` | 혜안, 50대 스님. 삭발, 승복 위에 담요를 두름, 평온한 눈 |
| `child.webp` | 눈이, 8세 소녀. 털모자에 빨갛게 언 볼 |

---

## 그림을 넣는 방법
- GPT가 저장소에 직접 올릴 수 있으면 위 경로로 커밋해 주세요. 작업 브랜치 이름은 `codex/scenario-art` 같은 새 브랜치를 쓰고, Claude가 검토 후 합칩니다.
- 직접 올릴 수 없으면 동현이 GitHub 웹에서 해당 폴더로 이동해 **Add file → Upload files**로 올리면 됩니다. 파일 이름만 정확하면 됩니다.

## 추가: 장면마다 다른 그림 (2026-11-26)
게임이 찾는 파일 이름 전체와 설명은 `assets/scenarios/ART_LIST.md`에 있다(`node scripts/art-list.js`로 갱신).
같은 폴더 `scenes/`에 그 이름 그대로 넣으면 바로 게임에 나온다. 없는 그림은 기존 장소·분위기 그림이 대신 나온다.
장비 그림은 `assets/gear/<이름>.webp`(정사각 512).
