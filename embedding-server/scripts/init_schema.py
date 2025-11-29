import logging
from src.utils.config import load_config
from src.services.dream_symbol_repository import DreamSymbolRepository

# 로깅 설정
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

def main():
  """
  데이터베이스 스키마와 HNSW 인덱스를 생성합니다.
  이 스크립트는 프로젝트 설정 시 최초 1회만 실행하면 됩니다.
  """
  config = load_config()
  repository = DreamSymbolRepository(config.db)
  
  try:
    repository.connect()
    repository.create_schema_if_not_exists(768) # ko-sroberta-nli 모델의 벡터 차원(768)
  finally:
    repository.close()

if __name__ == "__main__":
  main()
