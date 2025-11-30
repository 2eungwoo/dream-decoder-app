[한국어](./README.md) | [English](./README.en.md)

# Dream Decoder

> Retrieval-Augmented Generation (RAG) 아키텍처를 활용한 꿈 해석 서비스

사용자의 꿈 내용을 단순히 LLM에 의존해 해석하는 것을 넘어, 자체적으로 구축한 꿈 상징 데이터베이스를 활용하여 더 깊이 있고 맥락에 맞는 해석을 제공하는 시스템입니다. 사용자는 CLI(명령줄 인터페이스)를 통해 꿈을 기록하고 해석을 요청할 수 있습니다.

## 📝 RAG (검색-증강 생성) 

주어진 입력은 RAG(Retrieval-Augmented Generation) 기반으로 응답을 생성합니다.

1.  **Retrieval (검색):** 사용자가 꿈 내용을 입력하면, 시스템은 먼저 자체 데이터베이스에서 의미적으로 가장 유사한 '꿈 상징'들을 검색합니다.
2.  **Augmentation (증강):** 검색된 '꿈 상징' 정보와 사용자의 원본 꿈 내용을 조합하여 LLM에게 전달할 프롬프트를 보강합니다.
3.  **Generation (생성):** LLM은 이 보강된 컨텍스트를 바탕으로 훨씬 더 풍부하고 깊이 있는 해석을 생성합니다.

`/chat` 명령으로는 RAG 파이프라인을 거친 LLM의 응답을, </br>
`/no-rag` 명령으로는 RAG 파이프라인을 거치지 않고 LLM에게 직접 질문하는 기능도 제공하여, RAG의 효과를 비교해볼 수 있습니다.

## 🏛️ 아키텍처

- **`CLI Client`**: 사용자와 상호작용하는 TypeScript 기반 명령줄 인터페이스입니다.
- **`Backend (dd-app)`**: NestJS로 구현된 핵심 백엔드 서버입니다. 비즈니스 로직, 사용자 인증, RAG 파이프라인 조율 등 전체 프로세스를 관리합니다.
- **`Embedding Service (dd-embedding-server)`**: Python(FastAPI)으로 구현된 경량 임베딩 서버입니다. `ko-sroberta-nli` 모델을 사용하여 텍스트(꿈, 상징)를 의미론적 벡터로 변환합니다.
- **`Database (dd-postgresql)`**: PostgreSQL 데이터베이스에 `pgvector` 확장을 설치하여 텍스트 임베딩을 저장하고, 벡터 유사도 기반의 의미 검색을 수행합니다.
- **`Cache/Queue (dd-redis)`**: Redis를 사용하여 꿈 해석과 같은 비동기 작업을 처리하고, API 요청 제한 및 캐싱을 관리합니다.

## 🔮 꿈 상징 데이터 구조

RAG 파이프라인의 핵심은 자체적으로 구축한 꿈 상징 데이터베이스(`data/dream_symbols.json`)입니다. 이 데이터는 단순한 키워드 목록이 아니라, '상징'과 '행동'이 조합된 세분화된 구조를 가집니다.

**데이터 예시:**

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

이처럼 "사과를 보는 꿈"과 "사과를 먹는 꿈"이 서로 다른 `derivedMeanings`(파생 의미)와 `advice`(조언)를 가지도록 설계했습니다. 이 세분화된 구조 덕분에 LLM에 훨씬 더 구체적이고 정확한 컨텍스트를 제공하여, 해석의 깊이와 질을 높일 수 있습니다.

## 🎯 유사도 랭킹 알고리즘

효과적인 RAG를 위해 이 프로젝트는 **의미 검색(Semantic Search)**과 **키워드 기반 재정렬(Lexical Re-ranking)**을 결합한 2단계 하이브리드 랭킹 알고리즘을 사용합니다.

### 왜 하이브리드 랭킹을 사용하는가?

만약 꿈 해석을 위해 의미 검색에만 의존한다면, 해석의 '관련성'이 떨어지는 문제가 발생할 수 있습니다. 예를 들어, 사용자가 "황금 사과를 봤어요"라는 꿈을 입력했을 때, 의미 검색은 '부', '성공', '기회' 등 '황금'의 추상적 의미와 관련된 상징들을 주로 가져올 수 있습니다. 하지만 사용자가 꿈에서 명확히 본 **'사과'**라는 핵심 상징이 결과에서 누락되거나 후순위로 밀릴 수 있습니다.

이러한 문제를 해결하기 위해 **2단계 하이브리드 랭킹**을 설계했습니다.

-   **1단계 (의미 검색):** 먼저 의미적으로 유사한 상징들을 폭넓게 찾아내 '후보군'을 만듭니다. (광범위한 그물 던지기)
-   **2단계 (키워드 재정렬):** 그 후보군 내에서, 사용자의 꿈 설명에 **실제로 등장한 키워드**와 일치하는 상징에 높은 점수를 부여하여 순위를 재조정합니다. (정확한 타겟 조준)

이 접근법은 해석의 **깊이(Semantic)**와 **정확성(Lexical)**을 모두 확보하여, 사용자의 꿈 내용에 가장 밀접하고 만족도 높은 해석을 제공하는 것을 목표로 합니다.

### 상세 작동 방식 및 예시

알고리즘이 복잡한 꿈에서 어떻게 핵심 상징을 추출하는지, "꿈에서 **호랑이**가 나타나더니 **사과**를 **먹는** 것을 **봤어요**"라는 예시를 통해 살펴보겠습니다.

#### 1단계: HNSW 인덱스를 활용한 의미 기반 검색

-   **역할**: `pgvector` 데이터베이스
-   **과정**: 사용자의 꿈이 임베딩으로 변환되면, `pgvector`는 **HNSW(Hierarchical Navigable Small World) 인덱스**를 사용하여 가장 유사한 꿈 상징들을 빠르고 효율적으로 검색합니다. 모든 데이터를 순차적으로 스캔하는 대신, HNSW의 계층적 그래프 구조를 탐색하여 검색 속도를 크게 향상시킵니다. 이 과정을 통해 관련성이 높은 1차 후보군이 선별됩니다.
    -   `(호랑이, 본다)`
    -   `(사과, 먹는다)`
    -   `(사과, 본다)`
    -   `(호랑이, 사냥한다)`

#### 2단계: 키워드 기반 재정렬 (Lexical Re-ranking)

-   **역할**: `InterpretationSimilarityEvaluator`
-   **과정**: 1단계 후보군을 대상으로, 꿈 내용(`호랑이`, `사과`, `먹는`, `봤어요`)과의 키워드 일치도를 점검하여 최종 점수를 계산합니다.
    -   `SymbolMatchStrategy`: 상징(symbol) 필드 일치 여부 확인
    -   `ActionMatchStrategy`: 행동(action) 필드 일치 여부 확인
    -   `DerivedMatchStrategy`: 파생 의미(derivedMeanings) 필드 일치 여부 확인

| 후보 (상징, 행동)       | 꿈 속 키워드 매칭                              | 최종 점수 (가중치 적용) |
| ----------------------- | ---------------------------------------------- | ----------------------- |
| **`(호랑이, 본다)`**    | `호랑이`(symbol), `봤어요`(action)             | **높음 (2개 매칭)**     |
| **`(사과, 먹는다)`**    | `사과`(symbol), `먹는`(action)                 | **높음 (2개 매칭)**     |
| `(사과, 본다)`          | `사과`(symbol), `봤어요`(action)               | 높음 (2개 매칭)         |
| `(호랑이, 사냥한다)`    | `호랑이`(symbol)                               | 낮음 (1개 매칭)         |

#### 최종 컨텍스트 선정

-   `InterpretationSimilarityEvaluator`는 가장 높은 점수를 받은 `(호랑이, 본다)`와 `(사과, 먹는다)`를 최종 컨텍스트로 선정합니다.
-   이처럼 여러 상징이 얽힌 복잡한 꿈에서도, 하이브리드 랭킹 알고리즘은 각각의 핵심 요소를 정확히 포착해냅니다.
-   결과적으로 LLM은 "내면의 용기를 마주하는 상황(`호랑이, 본다`)"과 "새로운 시작을 받아들이는 행위(`사과, 먹는다`)"라는 두 가지의 풍부하고 정확한 맥락을 기반으로 꿈 해석을 생성하게 됩니다.

#### 응답 프롬프트 튜닝

2단계 재정렬 과정에서 각 전략(`SymbolMatchStrategy`, `ActionMatchStrategy`, `DerivedMatchStrategy`)의 **가중치 비중은 `src/interpretation/config/interpretation.config.ts` 파일에서 조정**할 수 있습니다.

`DEFAULT_INTERPRETATION_CONFIG` 객체 내의 `similarityWeights` 속성을 수정하여 각 전략의 중요도를 변경할 수 있습니다. 예를 들어, `symbol` 일치에 더 큰 중요도를 부여하려면 `symbol`의 값을 높이고 다른 값들을 조정하여 전체 합이 1이 되도록 할 수 있습니다. (현재 `symbol: 0.5`, `action: 0.25`, `derived: 0.25`)

#### 컨텍스트 수(topN) 설정의 의미와 한계

1단계 의미 검색에서 가져오는 컨텍스트의 최대 개수는 **`src/interpretation/config/interpretation.config.ts` 파일의 `topN` 값으로 설정**됩니다. 현재 이 값은 `2`로 설정되어 있습니다.

##### 설정 이유
-   **해석의 집중도 향상**: LLM이 소수의 핵심 상징에 집중하게 하여, 더 명확하고 일관된 해석을 생성하도록 유도합니다.
-   **성능 및 비용 최적화**: LLM에 전달되는 프롬프트 길이를 줄여 응답 속도를 높이고 API 비용을 절감합니다.
-   **과잉 해석 방지**: 너무 많은 상징이 한 번에 컨텍스트로 제공될 경우, 해석이 산만해지고 핵심을 벗어나는 것을 방지합니다.

##### 예상되는 한계
-   **복잡한 꿈의 일부 누락 가능성**: 만약 꿈에 3개 이상의 중요한 상징/장면이 등장한다면, `topN` 값으로 인해 상위 2개의 주제만 해석되고 나머지 부분은 누락될 수 있습니다.
-   **1단계 검색 결과에 대한 높은 의존도**: 최종 해석의 품질이 1단계 의미 검색에서 `topN` 순위 안에 드는 결과의 품질에 크게 좌우됩니다. 만약 중요한 상징이 3순위 이하로 밀려나면, 2단계 재정렬 과정에서 고려될 기회조차 얻지 못합니다.

##### 튜닝 제안
더 복잡하고 긴 꿈을 상세하게 해석하고 싶다면, `topN` 값을 `3`이나 `4`로 늘려볼 수 있습니다. 단, 이 경우 컨텍스트가 늘어나는 만큼 응답 속도가 저하되고 비용이 증가할 수 있습니다.

## ✨ 주요 기능 (CLI 명령어)

- **/register \<username> \<password>**: CLI에서 바로 회원가입합니다.
- **/login \<username> \<password>**: 토큰을 발급받아 인증 세션을 시작합니다.
- **/logout**: 현재 세션을 종료하고 저장된 토큰을 삭제합니다.
- **/chat**: 꿈 서술·감정·MBTI를 순차적으로 입력해 RAG 기반 해석을 요청합니다.
- **/save \<requestId>**: 자동 저장을 건너뛴 해석 결과를 다시 저장합니다.
- **/status \<requestId>**: 비동기 파이프라인의 진행 상태(대기/처리/완료/실패)를 조회합니다.
- **/detail \<requestId>**: 저장된 해석 전문과 컨텍스트를 확인합니다.
- **/list**: 내가 저장한 꿈 해석 목록과 요약을 확인합니다.
- **/failed**: 처리에 실패한 요청 목록을 확인합니다.
- **/retry \<requestId>**: 선택한 실패 요청을 다시 큐에 넣어 재시도합니다.
- **/no-rag \<message>**: 임베딩 검색 없이 LLM에게 직접 질문합니다.
- **/help**: CLI에서 사용 가능한 모든 명령어 요약을 다시 보여줍니다.
- **/quit**: Dream Decoder CLI를 종료합니다.

## 💻 기술 스택

- **Backend**: NestJS, TypeScript, TypeORM
- **Embedding Service**: Python, FastAPI, Sentence-Transformers
- **Database**: PostgreSQL, Pgvector
- **Data Precessing**: Redis(stream)
- **CLI**: TypeScript, Node.js
- **Orchestration**: Docker, Docker Compose

## 🚀 시작하기

### 사전 준비

- Docker 및 Docker Compose
- Node.js, npm (CLI 클라이언트 실행용)
- Python 3.11+ (데이터베이스 초기화 및 적재 스크립트 실행용)
- OpenAI API 키

### 1. 환경 변수 설정

프로젝트를 실행하기 위해 **`OPENAI_API_KEY`** 설정이 반드시 필요합니다.

프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 아래 내용을 채워주세요.</br>
사용중인 openai api가 없다면 문의 부탁드립니다.

```env
# OpenAI API 키 (필수)
OPENAI_API_KEY=
OPENAI_API_URL=
OPENAI_MODEL=
```

아래 변수들은 `docker-compose.yml`에 기본값이 설정되어 있어 필수는 아니지만, 필요시 값을 변경할 수 있습니다.
(변경 시 docker-compose.yml 매핑 포트 확인 필요)
로컬 스크립트 실행 시에는 환경에 맞게 설정하거나 아래 기본값을 참고해주세요.

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dream_decoder


### 2. Docker 서비스 실행

전체 애플리케이션(백엔드, 데이터베이스 등)을 실행합니다.

```bash
docker-compose up --build -d
```

### 3. 데이터베이스 초기화 및 데이터 적재 (최초 1회)

로컬 환경에서 Python 스크립트를 실행하여 데이터베이스를 설정합니다.

#### 3-1. 스크립트 의존성 설치

```bash
pip3 install -r embedding-server/scripts/requirements.txt
# 또는
python3 -m pip install -r embedding-server/scripts/requirements.txt
```

#### 3-2. VectorDB 스키마 및 인덱스 생성

아래 명령어를 실행하여 데이터베이스에 `dream_symbols` 테이블과 `HNSW` 인덱스를 생성합니다. 이 작업은 프로젝트 설정 시 **최초 한 번만** 실행하면 됩니다.

```bash
PYTHONPATH=embedding-server python3 embedding-server/scripts/init_schema.py
```

#### 3-3. JSON 데이터 임베딩 및 적재

아래 명령어를 실행하여 `data/dream_symbols.json` 파일의 내용을 임베딩으로 변환하고 데이터베이스에 적재합니다. 데이터 소스가 변경될 경우 이 스크립트만 재실행하면 됩니다.

```bash
PYTHONPATH=embedding-server python3 embedding-server/scripts/run_ingest.py
```

### 4. CLI 클라이언트 실행

아래 명령어를 통해 CLI 클라이언트를 실행하고, 안내에 따라 꿈 해석을 시작할 수 있습니다.

```bash
npm run cli
```
