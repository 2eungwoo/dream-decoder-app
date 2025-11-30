[한국어](./README.md) | [English](./README.en.md)

# Dream Decoder
> Retrieval-Augmented Generation 기반 꿈 해몽 서비스
> 
> 1. `Retrieval` : 데이터셋에서 사용자의 꿈 핵심과 가장 유사한 정보를 검색합니다.
> 2. `Augmentation` : 검색된 정보와 사용자 입력의 메타 데이터를 조합하여 LLM에게 전달합니다.
> 3. `Generation` : LLM은 이 컨텍스트로 내용을 보강하여 응답을 생성합니다.

# Demo
gif

# 시작하기

### 필요
> - Docker 및 Docker Compose</br>
> - Node.js, npm</br>
> - Python 3.11+ </br>
> - OpenAI API key

### 환경변수
> - 프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 아래 내용을 채워주세요.</br>
> - `docker-compose.yml` 에 이미 기본값이 설정되어 있습니다.</br>
> - `OPENAI_API_KEY` 설정은 필수입니다.</br>
> - 사용중인 openai api가 없다면 문의 부탁드립니다.
```env
OPENAI_API_KEY=
OPENAI_API_URL=
OPENAI_MODEL=
```

### 실행
```bash
# app 빌드
git clone https://github.com/2eungwoo/dream-decoder-cli.git;
cd dream-decoder-be;
docker-compose up --build -d;
```

```bash
# 임베딩서버 의존성 설치
pip3 install -r embedding-server/scripts/requirements.txt
# 또는 
python3 -m pip install -r embedding-server/scripts/requirements.txt
```

```bash
# DB 스키마 세팅
PYTHONPATH=embedding-server python3 embedding-server/scripts/init_schema.py;

# data/dream_symbols.json 임베딩
PYTHONPATH=embedding-server python3 embedding-server/scripts/run_ingest.py;
```

> 위 세팅이 마무리되면 스키마 상태는 다음과 같습니다.<br/>
> ![img.png](img.png)<br/>
> 아래 명령어로 확인할 수 있습니다.
```bash
# container app cli
docker-compose exec dd-postgresql psql -U postgres -d dream_decoder

# container postgresql cli
\d dream_symbols
```
```bash
# app 실행
npm run cli
```


## 데이터셋 구조
> RAG 에서 사용하는 자체적인 데이터셋 입니다.<br/>
> 단순 문장 혹은 키워드 목록이 아닌, `상징`과 `행동`이 조합된 구조입니다.

```json
[
  {
    "archetypeId": "FRUIT",
    "archetypeName": "과일",
    "symbol": "사과",
    "symbolMeanings": ["선택", "지식", "새로운 시작"],
    "action": "본다",
    "derivedMeanings": [
      "선택지를 관찰하는 마음",
      "새로운 기회를 해석하려는 상태"
    ],
    "advice": "결정 전 비교 기준을 하나만 정해보세요."
  },
  {
    "archetypeId": "FRUIT",
    "archetypeName": "과일",
    "symbol": "사과",
    "symbolMeanings": ["선택", "지식", "새로운 시작"],
    "action": "먹는다",
    "derivedMeanings": [
      "에너지를 흡수하고 싶음",
      "새로운 시작을 적극적으로 받아들이려는 의지"
    ],
    "advice": "가장 중요하게 생각하는 가치를 기준으로 선택하세요."
  }
]
```
> 꿈에 등장한 상징 요소와 꿈에서의 행동이 `해석의 기준`이 됩니다. <br/>
> 각각 다른 의미로 해석하고 이에 맞는 조언을 제시하도록 구성했습니다.

## 가중치 반영 알고리즘
> 임베딩 검색만 사용하면 상징은 맞지만 행동이 다른 레코드가 먼저 잡히는 경우가 있습니다.</br>
> ex) “황금 사과를 한입 베어 물었다”라는 꿈에서 모델이 `사과` 의미에 집중하면,</br>
> `사과/본다`, `사과/고른다`처럼 행동이 다른 레코드가 우선순위에 오를 수 있습니다.</br>
> 이러면 사용자가 실제로 강조한 “먹는다” 컨텍스트가 LLM에 전달되지 않아 엉뚱한 해석이 나올 수 있습니다.

> 1. **임베딩 검색**: `pgvector`의 `<=>` 연산으로 임베딩 비교, 상징/행동 후보군을 추출합니다.</br>
> 2. **가중치 정렬**: 후보군을 사용자의 텍스트에 등장한 상징,행동,파생 의미와 매칭해 가중치를 부여합니다.</br>
> 이 과정은 semantic/lexical 모두 보정하여 문맥에 가장 가까운 정보를 LLM에 전달하도록 제어합니다.</br>

> '황금 사과를 한입 베어 물었다' 시나리오

| 후보 (상징, 행동)     | 꿈 속 키워드 매칭 | 가중치 점수  |
|-----------------|-----------|---------------|
| `(사과, 본다)`      | `사과` 일치   | 중간 (1개 매칭)    |
| **`(사과, 먹는다)`** | `사과`, `먹는다` 일치 | **높음 (2개 매칭)** |
| `(사과, 고른다)`     | `사과` 일치   | 중간 (1개 매칭)    |

> **가중치 구성**<br/>
> 위치: `src/interpretation/config/interpretation.config.ts` <br/>
> `similarityWeights` : `symbol: 0.5`, `action: 0.25`, `derived: 0.25`로 설정돼 있습니다.</br>
> 상징이 절반의 점수를 가져가기 때문에, 행동/파생의미가 동시에 맞는 경우에만 1위로 올라옵니다.</br>
> 행동 중요도를 높이고 싶다면 해당 파일에서 비중을 조절하면 됩니다.

### 현재 RAG 구성 한계
> **컨텍스트 수 제한** : 임베딩 문서 쿼리의 `topN`이 현재 2라서, 세 번째 이후 상징은 프롬프트에서 누락됩니다.<br/>
> **데이터셋 커버리지** : 데이터셋에 없는 상징/행동은 검색 자체가 어렵습니다. 일반적인 LLM 추론으로 넘어갑니다.<br/>
> **표현 다양성 제어** : 동일 행위를 다른 표현으로 쓰면 lexical 매칭을 놓칠 수 있습니다. 임베딩 순위만으로 결정됩니다.<br/>
> **응답 변동 가능성** : 같은 컨텍스트라도 위의 변수 조정에 따라 해석 품질이 변할 수 있습니다.<br/>

> 따라서 위의 한계를 벗어나는 튜닝을 마음껏 시도해보셔도 됩니다.

### RAG 튜닝 포인트
> **데이터셋 확장** : `/data/dream_symbols.json` <br/>
> **가중치 비율 조정** : `interpretation/config/interpretation.config.ts`  <br/>
> **프롬프트 지침** : `prompts/interpretation-system.prompt.ts`

## 장애 대응 (Redis Stream Queue)
> 사용자의 요청은 장애 상황에도 유실되지 않고 시스템에서 처리합니다.
> 꿈 해석 요청은 Redis Stream 큐에 등록됩니다.</br>

> 시스템 일시 중단이나 사용자의 강제종료에도 ACK되지 않은 항목은 스트림에 남아</br>
> 서비스가 복구되면 동일한 요청 ID로 자동 재처리, 최종 실패 요청은 DLQ에 적재하여 유실을 방지합니다.

![redis-stream-demo](docs/assets/redis-stream-resilience.gif)

> 위 데모는 요청 접수 직후 CLI 및 서비스 강제 종료 후 재시작 시나리오입니다. <br/>
> CLI에 재접속하여 요청 접수된 ID로 진행 상태 조회, 저장이 가능합니다.<br/>
> 서비스 장애 발생 경우, `/failed`로 처리중인 요청을 조회할 수 있으며 서비스 복구 이후 마찬가지로 재처리 및 저장이 가능합니다.
