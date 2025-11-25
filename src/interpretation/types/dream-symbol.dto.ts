/**
 * @file DreamSymbolDto – RAG 기반 꿈 상징 데이터스키마 정의 DTO
 * @description
 *   - dream_symbols.json 전역적인 타입 관리 용도
 *   - json구조 바뀔 시 이 파일만 수정하면 전체 소스코드에서 타입 에러 발생시킴
 *
 * @embeddingField : 벡터화할 텍스트 필드
 * @metadata : 필터링/가중치/후처리/응답보강 등 목적(임베딩제외)
 *
 */

/**
 * @description
 *    - archetype : 최상의 범주
 *    - symbol : 구체적인 상징
 *    - secnario : 상황별 의미
 */
export class DreamSymbolDto {
  /**
   * Archetype metadata (예: 과일, 동물, 자연, 장소 같은 큰 틀)
   * @metadata
   */
  archetypeId!: string;
  archetypeName!: string;

  /**
   * Symbol metadata
   *   아키타입에 속하는 개별 상징의 핵심 의미들
   * @embeddingField
   */
  symbol!: string;
  symbolMeanings!: string[];

  /**
   * Action 기반 시나리오 의미
   *   “먹는다 / 본다 / 만진다” 같은 초 포괄적 동작 단위
   * @embeddingField
   */
  action!: string;
  derivedMeanings!: string[];

  /**
   * 사용자 행동 조언
   *   LLM 응답 보강으로 쓸 RAG 컨텍스트로 사용
   * @embeddingField + @metadata
   */
  advice!: string;

  /**
   * DB 내 벡터 필드
   *   Embedding 저장용, 클라이언트로는 전송 안할 필드
   */
  embedding?: number[];
}
