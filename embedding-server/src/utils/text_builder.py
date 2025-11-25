from typing import Any, Dict, List

from src.models.dream_symbol_model import TEXT_FIELDS_FOR_EMBEDDING


# RAG에 사용할 문서를 생성하기 위해 임베딩 대상 텍스트를 구성
def build_text(doc: Dict[str, Any]) -> str:
    parts: List[str] = []
    for field in TEXT_FIELDS_FOR_EMBEDDING:
        value = doc.get(field)
        if not value:
            continue

        if isinstance(value, list):
            parts.extend(str(item) for item in value if item)
        elif isinstance(value, str):
            parts.append(value)

    return "\n".join(filter(None, parts))
