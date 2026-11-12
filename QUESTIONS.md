# 시작 질문 목록 (초안)

시작 질문 스킬(`skills/start/SKILL.md`)에 들어갈 내용이다. 실제 스킬은 영어로 쓰고, 답변은 사용자의 언어로 나간다.

## 언제 묻는가

- **새 프로젝트일 때**: 폴더에 개발일지(`DEVLOG.md`)가 없으면, 사용자의 첫 메시지에 답하면서 여는 질문부터 시작한다.
- **막연한 요청일 때**: "앱 만들어줘"처럼 정보가 부족하면 시작한다.
- **묻지 않는 경우**: 일지가 이미 있거나, 요청이 이미 구체적이거나, 만들기와 상관없는 질문일 때.

## 묻는 방식

- 여는 질문 1개 → 첫 묶음(최대 4개) → 둘째 묶음(최대 4개). 여는 질문을 빼고 총 8개 이하.
- 여는 질문만 자유롭게 답하고, 나머지는 전부 고르는 방식이다.
- 모든 질문에 추천안 표시와 "잘 모르겠어요 → 추천대로"가 있다.
- 이미 답이 나온 질문은 건너뛴다.
- 기술(어떤 도구로 만들지)은 묻지 않는다.

---

## 여는 질문

| | 문구 |
|---|---|
| 영어 | What do you want to make? Tell me like you'd tell a friend. One or two sentences is enough. |
| 한국어 | 무엇을 만들고 싶으세요? 친구에게 말하듯 편하게 한두 문장이면 충분해요. |

예시를 함께 보여준다:
- "A booking page for my hair salon" / "우리 미용실 예약 페이지"
- "An app where my book club votes on the next book" / "독서 모임에서 다음 책을 투표하는 앱"

답이 막히면 대신 이렇게 묻는다:
- Who has the problem? / 누가 불편을 겪고 있나요?
- What do they do about it today? / 지금은 어떻게 해결하고 있나요?
- What should become easier? / 무엇이 더 쉬워지면 좋을까요?

---

## 첫 묶음 (기본 4개)

### 1. 누가 쓰나요

| | 문구 |
|---|---|
| 영어 | Who will use it? |
| 한국어 | 누가 쓰게 되나요? |

- Just me / 나 혼자
- People I already know (friends, team, my customers) / 내가 아는 사람들 (친구, 팀, 기존 손님) **← 추천**
- Anyone on the internet / 인터넷의 누구나
- Not sure / 잘 모르겠어요

왜 묻는가: 로그인이 필요한지와 보안 수준이 여기서 갈린다.
추천 이유: 첫 버전은 범위가 작을수록 빨리 완성되고 위험이 적다.

### 2. 첫날 꼭 되어야 하는 한 가지

| | 문구 |
|---|---|
| 영어 | What is the one thing it must do on day one? |
| 한국어 | 처음 열었을 때 꼭 되어야 하는 한 가지는 무엇인가요? |

- 선택지는 여는 질문의 답에서 AI가 2~3개를 뽑아 제시한다.
- Something else / 다른 것 (직접 입력)

왜 묻는가: 첫 버전의 범위를 하나로 좁힌다. 나머지 기능은 일지의 "나중에"로 간다.

### 3. 어디서 쓰나요

| | 문구 |
|---|---|
| 영어 | Where will people use it? |
| 한국어 | 사람들이 어디서 쓰게 되나요? |

- A website that works on phones and computers / 휴대폰과 컴퓨터에서 모두 열리는 웹사이트 **← 추천**
- A phone app from the app store / 앱스토어에서 받는 휴대폰 앱
- Not sure / 잘 모르겠어요

추천 이유: 웹사이트는 심사가 없고, 비용이 가장 적고, 나중에 앱으로 바꿀 수 있다.

### 4. 비슷한 서비스

| | 문구 |
|---|---|
| 영어 | Is there an app or site that feels close to what you want? |
| 한국어 | 원하는 것과 비슷한 느낌의 앱이나 사이트가 있나요? |

- Yes (name it) / 있어요 (이름 입력)
- No / 없어요

왜 묻는가: 말로 설명하기 어려운 기대치를 가장 빨리 알 수 있다.

---

## 둘째 묶음 (아래 6개 중 필요한 것만, 최대 4개)

위에서부터 우선순위가 높다. 5번은 항상 묻는다.

### 5. 개인정보 (항상 물음)

| | 문구 |
|---|---|
| 영어 | Will it collect information about people? |
| 한국어 | 사람들의 정보를 받게 되나요? |

- Nothing personal / 개인정보 없음
- Basic (name, email) / 기본 정보 (이름, 이메일)
- Sensitive (payments, health, ID numbers, children) / 민감한 정보 (결제, 건강, 신분증 번호, 어린이)
- Not sure / 잘 모르겠어요

추천: 첫 묶음 답에 따라 필요한 최소 수준을 AI가 추천한다.
"민감한 정보"를 고르면: 보안 점검을 더 엄격하게 하고, 출시 전에 전문가 점검이 필요하다고 안내한다.

### 6. 돈이 오가나요

| | 문구 |
|---|---|
| 영어 | Will people pay through it? |
| 한국어 | 이 서비스 안에서 결제가 이루어지나요? |

- No / 아니요
- Later, not in the first version / 나중에, 첫 버전에는 없음 **← 추천**
- Yes, from day one / 네, 처음부터
- Not sure / 잘 모르겠어요

추천 이유: 결제는 보안과 법적 책임이 커서, 핵심 기능이 작동한 뒤에 붙이는 편이 안전하다.

### 7. 매달 쓸 수 있는 비용

| | 문구 |
|---|---|
| 영어 | How much can you spend per month to keep it running? |
| 한국어 | 운영하는 데 매달 얼마까지 쓸 수 있나요? |

- Nothing, free only / 0원, 무료만 **← 추천**
- Up to about $20 / 약 2~3만 원까지
- Flexible / 상관없음
- Not sure / 잘 모르겠어요

왜 묻는가: 기술을 고르는 기준이 되고, 이 금액을 넘는 선택은 반드시 확인을 받는다.

### 8. 각자 계정이 필요한가요 (답을 추측할 수 없을 때만)

| | 문구 |
|---|---|
| 영어 | Does each person need their own account? |
| 한국어 | 사람마다 자기 계정이 필요한가요? |

- No, everyone sees the same thing / 아니요, 모두 같은 화면을 봐요
- Yes, each person has their own stuff / 네, 사람마다 자기 내용이 있어요
- Not sure / 잘 모르겠어요

### 9. 기억해야 할 내용이 있나요 (답을 추측할 수 없을 때만)

| | 문구 |
|---|---|
| 영어 | Should it remember things between visits? |
| 한국어 | 다시 들어왔을 때 남아 있어야 하는 내용이 있나요? |

- No, it just shows information / 아니요, 정보만 보여줘요
- Yes (for example: bookings, posts, votes) / 네 (예: 예약, 글, 투표)
- Not sure / 잘 모르겠어요

### 10. 분위기

| | 문구 |
|---|---|
| 영어 | What should it feel like? |
| 한국어 | 어떤 분위기였으면 하나요? |

- Clean and minimal / 깔끔하고 단순하게 **← 추천**
- Warm and friendly / 따뜻하고 친근하게
- Bold and playful / 강렬하고 재미있게
- I have a brand or a reference / 이미 브랜드나 참고 자료가 있어요

---

## 마무리: 요약하고 확인받기

질문이 끝나면 아래 형식으로 보여주고, 확인을 받은 뒤 일지를 만들고 시작한다.

```
만들 것:    (한 문장)
쓰는 사람:  (누구)
첫 버전:    (꼭 되어야 하는 한 가지)
나중에:     (미룬 기능)
제가 정한 것: (형태, 사용할 도구와 이유 한 줄씩, 예상 월 비용)
제가 가정한 것: (묻지 않고 추측한 내용)
```

- "제가 가정한 것"은 틀렸으면 바로 고칠 수 있게 따로 적는다.
- 확인 질문은 하나만 한다: "이대로 시작할까요?"

## 써보면서 조정할 숫자

- 총 8개 이하, 한 묶음 최대 4개: 근거가 있는 값이 아니라 추정이다. 실제로 써보고 줄이거나 늘린다.
- 월 비용 선택지의 금액도 추정이다.
