/**
 * @file 꿈 상징 데이터소스 dream_symbols.json 스키마 정의용으로 만든 dto.ts
 * @description dream_symbols.json 바꾸면 곳곳의 상수코딩 돼있던 코드를 찾아서 수정해야됐음.
 *              따라서 dto.ts로 전역적으로 타입 등록해서 .json 바꾸면 타입에러 유도하고 이 파일만 수정할 수 있도록 구성
 */
export class DreamSymbolDto {
  /**
   * @embeddingField 꿈 내용의 전반적인 상징 문장
   * LLM/RAG에서 벡터 검색 시 주된 텍스트 신호로 사용
   * @example "맑은 바다를 헤엄치는 꿈"
   */
  symbol!: string;

  /**
   * @metadata 대표 상징 요소 (ex. 물, 자유 등)
   * 벡터 검색 보조 신호나 필터링 용도로 사용
   */
  categories!: string[];

  /**
   * @embeddingField 상징에 대한 기본 의미 설명
   * dream 본문과 유사도 비교 시 함께 벡터화해서 의미적 연결성을 높인다
   */
  description!: string;

  /**
   * @metadata 통상적으로 동반되는 감정 목록
   * 사용자 입력 감정과의 교집합, 가중치 계산 등에 활용
   */
  emotions!: string[];

  /**
   * @metadata MBTI 유형별 응답 톤
   * 해석 결과를 사용자 선호 톤에 맞게 보정할 때 사용
   */
  mbtiTone!: Record<string, string>;

  /**
   * @embeddingField 해몽 응답 본문에 참고할 문장 목록
   * 벡터 검색과 프롬프트 RAG 컨텍스트에 포함
   */
  interpretations!: string[];

  /**
   * @embeddingField + @metadata 사용자 행동 조언
   * 응답 보강 및 RAG 컨텍스트로 활용
   */
  advice!: string;

  /**
   * DB 전용 값, DB 임베딩해서 저장된 벡터 담을 필드
   * ps. 이 필드는 클라이언트로 전송 안함
   */
  embedding?: number[];
}
