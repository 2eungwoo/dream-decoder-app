import os
from dataclasses import dataclass

@dataclass
class DbConfig:
  host: str
  port: int
  name: str
  user: str
  password: str


@dataclass
class AppConfig:
  data_path: str
  embedding_url: str
  db: DbConfig


def load_config() -> AppConfig:
  return AppConfig(
    data_path=os.getenv("SYMBOL_DATA", "data/dream_symbols.json"),
    embedding_url=os.getenv("EMBEDDING_API_URL", "http://localhost:8001/embed"),
    db=DbConfig(
      host=os.getenv("DB_HOST", "localhost"),
      port=int(os.getenv("DB_PORT", "5432")),
      name=os.getenv("DB_NAME", "dream_decoder"),
      user=os.getenv("DB_USER", "postgres"),
      password=os.getenv("DB_PASSWORD", "postgres"),
    ),
  )
