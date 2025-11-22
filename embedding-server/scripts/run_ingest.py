import logging

from src.config import load_config
from src.services.document_loader import DocumentLoader
from src.services.dream_symbol_ingestor import DreamSymbolIngestor
from src.services.dream_symbol_repository import DreamSymbolRepository
from src.services.embedding_service import EmbeddingService

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


def main():
  config = load_config()
  loader = DocumentLoader(config.data_path)
  embedding_service = EmbeddingService(config.embedding_url)
  repository = DreamSymbolRepository(config.db)
  DreamSymbolIngestor(loader, embedding_service, repository).run()


if __name__ == "__main__":
  main()
