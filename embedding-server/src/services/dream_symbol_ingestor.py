import logging
from typing import Dict, List, Any

from src.services.document_loader import DocumentLoader
from src.services.embedding_service import EmbeddingService
from src.services.dream_symbol_repository import DreamSymbolRepository
from src.utils.text_builder import build_text

logger = logging.getLogger(__name__)


class DreamSymbolIngestor:
  """전체 파이프라인 수행"""

  def __init__(
    self,
    loader: DocumentLoader,
    embedding_service: EmbeddingService,
    repository: DreamSymbolRepository,
  ):
    self.loader = loader
    self.embedding_service = embedding_service
    self.repository = repository

  def run(self):
    docs: List[Dict[str, Any]] = self.loader.load()
    if not docs:
      logger.warning("No documents found.")
      return

    texts = [build_text(doc) for doc in docs]
    vectors = self.embedding_service.embed(texts)

    self.repository.connect()
    try:
      self.repository.ensure_schema(len(vectors[0]))
      self.repository.insert_documents(docs, vectors)
      logger.info("[완료] dream_symbols 테이블에 %d건 적재 완료", len(docs))
    finally:
      self.repository.close()
