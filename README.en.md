[한국어](./README.md) | [English](./README.en.md)

# Dream Decoder
> Dream interpretation service powered by Retrieval-Augmented Generation (RAG)
>
> 1. `Retrieval`: search the dream-symbol dataset for entries that are semantically closest to the user’s dream.
> 2. `Augmentation`: combine the retrieved information with the user’s metadata before sending it to the LLM.
> 3. `Generation`: the LLM produces a response with richer context based on the augmented prompt.

# Demo
<img src="https://github.com/user-attachments/assets/0aab3d44-d5ca-4b7b-b937-55dc31d59d76" width="500" />

# Getting Started

### Prerequisites
> - Docker & Docker Compose</br>
> - Node.js, npm</br>
> - Python 3.11+</br>
> - OpenAI API key

### Environment variables
> - Create a `.env` file in the project root and fill out the values below.</br>
> - Default values already exist in `docker-compose.yml`.</br>
> - `OPENAI_API_KEY` is mandatory.</br>
> - Contact us if you do not have access to an OpenAI API.

```env
OPENAI_API_KEY=
OPENAI_API_URL=
OPENAI_MODEL=
```

### Run
```bash
# build the app
git clone https://github.com/2eungwoo/dream-decoder-cli.git
cd dream-decoder-be
docker-compose up --build -d
```

```bash
# install embedding-server dependencies
pip3 install -r embedding-server/scripts/requirements.txt
# or
python3 -m pip install -r embedding-server/scripts/requirements.txt
```

```bash
# set up DB schema
PYTHONPATH=embedding-server python3 embedding-server/scripts/init_schema.py

# embed data/dream_symbols.json
PYTHONPATH=embedding-server python3 embedding-server/scripts/run_ingest.py
```

> After the setup above, the schema looks like this.<br/>
> <img width="562" height="297" alt="image" src="https://github.com/user-attachments/assets/454c6b4c-3a82-4ec8-acc7-9f4a453c0010" /> <br/>
> Verify with:

```bash
# container app CLI
docker-compose exec dd-postgresql psql -U postgres -d dream_decoder

# inside the PostgreSQL container
\d dream_symbols
```

```bash
# run CLI
npm run cli
```

## Dataset structure
> The RAG pipeline uses a curated dream-symbol dataset.<br/>
> Each entry combines a `symbol` with an `action`, not just a list of keywords.

```json
[
  {
    "archetypeId": "FRUIT",
    "archetypeName": "Fruit",
    "symbol": "Apple",
    "symbolMeanings": ["Choice", "Knowledge", "Fresh start"],
    "action": "See",
    "derivedMeanings": [
      "Observing different options",
      "Trying to interpret a new opportunity"
    ],
    "advice": "Pick only one comparison criterion before deciding."
  },
  {
    "archetypeId": "FRUIT",
    "archetypeName": "Fruit",
    "symbol": "Apple",
    "symbolMeanings": ["Choice", "Knowledge", "Fresh start"],
    "action": "Eat",
    "derivedMeanings": [
      "Wanting to absorb new energy",
      "Actively embracing a new beginning"
    ],
    "advice": "Decide based on the value you deem the most important."
  }
]
```
> Dream symbols and actions together become the basis of an interpretation.<br/>
> Each combination yields a different meaning and advice, so the LLM receives precise context.

## Weighted hybrid ranking
> Pure embedding search can return entries whose symbol matches but action does not.</br>
> Example: in a dream “I took a bite of a golden apple”, the embedding might focus on `apple`</br>
> and bring up `Apple/See` or `Apple/Choose` first.</br>
> Then the true action “Eat” never reaches the LLM, leading to a mismatched interpretation.

> 1. **Embedding search**: compare vectors with `pgvector`’s `<=>` operator and fetch symbol/action candidates.</br>
> 2. **Weighted re-ranking**: match each candidate against the user’s symbol/action/derived keywords and apply weights.</br>
> This enforces both semantic and lexical alignment before the prompt is sent to the LLM.</br>

> _Scenario: “I bit into a golden apple.”_

| Candidate (symbol, action) | Keyword matches      | Score (weighted)     |
|---------------------------|----------------------|----------------------|
| `(Apple, See)`            | matches `apple`      | Medium (1 match)     |
| **`(Apple, Eat)`**        | matches `apple`, `eat` | **High (2 matches)** |
| `(Apple, Pick)`           | matches `apple`      | Medium (1 match)     |

> **Weight definition**<br/>
> Location: `src/interpretation/config/interpretation.config.ts` <br/>
> `similarityWeights` = `symbol: 0.5`, `action: 0.25`, `derived: 0.25`.</br>
> Because the symbol counts for half of the score, only entries that match action/derived simultaneously reach the top.</br>
> Increase the action weight in the same file if you need more action-sensitive interpretations.

### Current RAG limitations
> **Context cap**: `topN` in the embedding query is 2 by default, so any third symbol is omitted from the prompt.<br/>
> **Dataset coverage**: anything missing from `data/dream_symbols.json` cannot be retrieved; the LLM must guess.<br/>
> **Expression variance**: alternative phrasings (e.g., “took a bite”) may bypass lexical matching, leaving only embedding scores.<br/>
> **Response variance**: even with the same context, LLM output can change depending on weight adjustments or model behavior.<br/>

> Feel free to tune these knobs according to your use case.

### RAG tuning hooks
> **Dataset extension**: `/data/dream_symbols.json`<br/>
> **Weight ratios**: `interpretation/config/interpretation.config.ts` (default symbol 0.5 / action 0.25 / derived 0.25)<br/>
> **Prompt guidance**: `prompts/interpretation-system.prompt.ts`

## Resilience (Redis Stream Queue)
> Dream requests stay safe even if the system crashes.
> Each request is pushed into a Redis Stream queue.</br>

> If the CLI or services are interrupted, any un-ACKed entries remain in the stream.</br>
> When the system comes back, the same request ID resumes processing automatically, and failed entries fall into a DLQ.</br>

<img src="https://github.com/user-attachments/assets/a37ba55e-d06e-4b9e-b313-7f3f7ba6a5ea" width="500" />

> The demo above shows the CLI and services being terminated right after submitting a request.<br/>
> After reconnecting, `/status` can still retrieve and save the pending result.<br/>
> When an outage occurs, `/failed` lists queued failures, which can be retried once the services recover.
