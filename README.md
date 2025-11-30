[한국어](./README.md) | [English](./README.en.md)

# Dream Decoder
> Retrieval-Augmented Generation 기반 꿈 해몽 서비스
> 
> 1. `Retrieval` : 데이터셋에서 사용자의 꿈 핵심과 가장 유사한 정보를 검색합니다.
> 2. `Augmentation` : 검색된 정보와 사용자 입력의 메타 데이터를 조합하여 LLM에게 전달합니다.
> 3. `Generation` : LLM은 이 컨텍스트로 내용을 보강하여 응답을 생성합니다.

# Demo
gif



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

### 가중치 반영 알고리즘
> RAG 과정에서 단순히 최근접한 상징/행동만 고려한다면 다음 문제가 발생할 수 있습니다.</br>
> '호랑이가 사과를 먹는 꿈' 에서, ''호랑이'가 우선시된 해석을 제공하게 될 수 있습니다.</br>
> 사용자 꿈의 핵심인 '사과','먹는다'가 우선 검색되지 않을 수 있습니다.

> 1. 의미적으로 유사한 상징을 폭넓게 찾아 '후보군'을 만듭니다.</br>
> 2. 추출한 후보군 내에서 사용자의 꿈에서 실제로 등장한 키워드와 일치하는 상징에 가중치를 부여합니다.</br>
> 이 접근은 해석의 semantic/lexical 모두를 확보하는 것을 목표로 합니다.</br>
> 데이터셋에서 사용자 꿈과 가장 밀접한 정보를 LLM에게 제공하여 엉뚱한 응답을 생성하지 않도록 합니다.

'호랑이가 사과를 먹는다'

| 후보 (상징, 행동)       | 꿈 속 키워드 매칭                              | 최종 점수 (가중치 적용) |
| ----------------------- | ---------------------------------------------- | ----------------------- |
| **`(호랑이, 본다)`**    | `호랑이`(symbol), `봤어요`(action)             | **높음 (2개 매칭)**     |
| **`(사과, 먹는다)`**    | `사과`(symbol), `먹는`(action)                 | **높음 (2개 매칭)**     |
| `(사과, 본다)`          | `사과`(symbol), `봤어요`(action)               | 높음 (2개 매칭)         |
| `(호랑이, 사냥한다)`    | `호랑이`(symbol)                               | 낮음 (1개 매칭)         |


## 시작하기

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

```bash
# app 실행
npm run cli
```

