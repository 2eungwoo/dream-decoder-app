import json
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class DocumentLoader:
  """/data/dream_symbols.json 문서 로딩"""

  def __init__(self, path: str):
    self.path = path

  def load(self) -> List[Dict[str, Any]]:
    logger.info("[==] 꿈 심볼 JSON을 로딩합니다: %s", self.path)
    with open(self.path, "r", encoding="utf-8") as f:
      docs = json.load(f)
    logger.info("[==] 총 %d건을 로딩했습니다", len(docs))
    return docs
