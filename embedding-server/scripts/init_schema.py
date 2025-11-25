import os
import psycopg # type: ignore

SQL = """
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS dream_symbols (
  id UUID PRIMARY KEY,
  archetype_id TEXT,
  archetype_name TEXT,
  symbol TEXT,
  symbol_meanings JSONB,
  action TEXT,
  derived_meanings JSONB,
  advice TEXT,
  embedding VECTOR(768)
);
"""

conn = psycopg.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "5432")),
    dbname=os.getenv("DB_NAME", "dream_decoder"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "postgres"),
)
with conn.cursor() as cur:
    cur.execute(SQL)
conn.commit()
conn.close()
print("[init_schema.py] dream_symbols 스키마 생성 완료")
print("임베딩 수행을 위해 다음 명령어를 실행해주세요")
print("PYTHONPATH=embedding-server python3 embedding-server/scripts/run_ingest.py")
