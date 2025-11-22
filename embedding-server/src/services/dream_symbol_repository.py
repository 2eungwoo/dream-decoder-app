import json
import logging
import uuid
from typing import Any, Dict, List

import psycopg  # type: ignore
from pgvector.psycopg import register_vector  # type: ignore

from src.config import DbConfig  # type: ignore
from src.models.dream_symbol_model import ALL_DB_FIELDS, DOCUMENT_TO_DB_MAP

logger = logging.getLogger(__name__)


class DreamSymbolRepository:
    """pgvector repository 스키마/데이터 세팅"""

    def __init__(self, config: DbConfig):
        self.config = config
        self.conn: psycopg.Connection | None = None

    def connect(self):
        if self.conn is None:
            self.conn = psycopg.connect(
                host=self.config.host,
                port=self.config.port,
                dbname=self.config.name,
                user=self.config.user,
                password=self.config.password,
            )
            register_vector(self.conn)

    def close(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    def ensure_schema(self, dim: int):
        if self.conn is None:
            raise RuntimeError("<!> [ERROR] Connection is not initialized")

        logger.info("[==] dream_symbols 테이블 스키마 검사 (벡터 차원=%d)", dim)

        column_definitions = [
            "id UUID PRIMARY KEY",
            "symbol TEXT",
            "categories JSONB",
            "description TEXT",
            "emotions JSONB",
            "mbti_tone JSONB", 
            "interpretations JSONB",
            "advice TEXT",
            f"embedding VECTOR({dim})",
        ]
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS dream_symbols ({', '.join(column_definitions)});
        """

        with self.conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(create_table_sql)
            cur.execute("TRUNCATE TABLE dream_symbols;")
        self.conn.commit()

    def insert_documents(
        self, docs: List[Dict[str, Any]], vectors: List[List[float]]
    ):
        if self.conn is None:
            raise RuntimeError("<!> [ERROR] Connection is not initialized")

        logger.info("[==] dream_symbols 테이블에 %d건 적재 시작", len(docs))

        # DB에 삽입할 컬럼 목록 (id와 embedding 제외)
        cols_to_insert = [
            f for f in ALL_DB_FIELDS if f not in ["id", "embedding"]
        ]
        
        # 동적 INSERT SQL 구문 생성
        cols_sql = ", ".join(cols_to_insert)
        vals_placeholder = ", ".join(["%s"] * len(cols_to_insert))
        insert_sql = f"INSERT INTO dream_symbols (id, {cols_sql}, embedding) VALUES (%s, {vals_placeholder}, %s);"

        with self.conn.cursor() as cur:
            for doc, vector in zip(docs, vectors):
                # cols_to_insert 순서에 맞춰 값을 준비
                values = []
                for key in cols_to_insert:
                    # 'mbtiTone'은 JSON에서 'mbti_tone'으로 매핑되므로 키 변환
                    json_key = "mbtiTone" if key == "mbti_tone" else key
                    default_value = DOCUMENT_TO_DB_MAP.get(key)
                    value = doc.get(json_key, default_value)

                    if isinstance(value, (list, dict)):
                        values.append(json.dumps(value))
                    else:
                        values.append(value)
                
                # 최종 튜플 생성 (id, ...나머지 값, embedding)
                final_values = (str(uuid.uuid4()), *values, vector)
                cur.execute(insert_sql, final_values)

        self.conn.commit()
