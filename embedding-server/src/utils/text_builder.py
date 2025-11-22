from typing import Any, Dict

from src.models.dream_symbol_model import TEXT_FIELDS_FOR_EMBEDDING


# RAG에 사용할 문서를 생성하기 위해 임베딩 대상 텍스트를 구성
# doc 받으면 임베딩에 쓸 텍스트 추출하고 결합 후 리턴
def build_text(doc: Dict[str, Any]) -> str:
    parts = []
    for field in TEXT_FIELDS_FOR_EMBEDDING:
        value = doc.get(field)
        if not value:
            continue

        if field == "categories" and isinstance(value, list):
            parts.append(", ".join(value))
        elif isinstance(value, list):
            parts.extend(value)
        elif isinstance(value, str):
            parts.append(value)

    return "\n".join(filter(None, parts))
