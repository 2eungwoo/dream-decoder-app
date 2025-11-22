/**
 * @file 꿈 상징 데이터소스 dream_symbols.json 스키마 정의용으로 만든 dto.ts
 * @description dream_symbols.json 바꾸면 곳곳의 상수코딩 돼있던 코드를 찾아서 수정해야됐음.
 *              따라서 dto.ts로 전역적으로 타입 등록해서 .json 바꾸면 타입에러 유도하고 이 파일만 수정할 수 있도록 구성
 */
export class DreamSymbolDto {
  /**
   * 꿈 내용의 전반적인 상징 문장
   * @example "맑은 바다를 헤엄치는 꿈"
   */
  symbol!: string;

  /**
   * 위의 상징의 표상 분석을 위한 관련 카테고리 목록
   * @example ["물", "감정", "자유"]
   */
  categories!: string[];

  /**
   * 상징에 대한 기본 설명
   */
  description!: string;

  /**
   * 상징과 주로 관련된 감정 목록
   * @example ["평온", "기대"]
   */
  emotions!: string[];

  /**
   * MBTI 유형별 응답 톤
   */
  mbtiTone!: Record<string, string>;

  /**
   * 해몽 응답 본문에 영향을 주는 설명
   */
  interpretations!: string[];

  /**
   * 이후 사용자의 행동 조언에 쓸 문장
   */
  advice!: string;

  /**
   * DB 전용 값, DB 임베딩해서 저장된 벡터 담을 필드
   * ps. 이 필드는 클라이언트로 전송 안함
   */
  embedding?: number[];
}
