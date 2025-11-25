import json
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class DocumentLoader:
    """/data/dream_symbols.json 문서 로딩 + 아키타입 단위 문서를 시나리오 문서로 확장"""

    def __init__(self, path: str):
        self.path = path

    def load(self) -> List[Dict[str, Any]]:
        logger.info("[==] 꿈 심볼 JSON을 로딩합니다: %s", self.path)
        with open(self.path, "r", encoding="utf-8") as f:
            raw_docs = json.load(f)
        documents = self._expand_documents(raw_docs)
        logger.info("[==] 총 %d건의 시나리오 문서를 생성했습니다", len(documents))
        return documents

    def _expand_documents(self, raw_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        expanded: List[Dict[str, Any]] = []
        for doc in raw_docs:
            expanded.append(
                {
                    "archetypeId": doc.get("archetypeId"),
                    "archetypeName": doc.get("archetypeName"),
                    "symbol": doc.get("symbol"),
                    "symbolMeanings": doc.get("symbolMeanings") or [],
                    "action": doc.get("action"),
                    "derivedMeanings": doc.get("derivedMeanings") or [],
                    "advice": doc.get("advice"),
                }
            )
        return expanded
