import { Injectable } from '@nestjs/common';
import { InterpretDreamRequestDto } from '../dto/interpret-dream-request.dto';
import { RelatedSymbol } from '../types/related-symbol.type';

@Injectable()
export class InterpretationPromptBuilder {
  public buildPrompt(
    request: InterpretDreamRequestDto,
    symbols: RelatedSymbol[],
  ) {
    const normalizedMbti = request.mbti?.toUpperCase();

    const formattedSymbols = symbols
      .map((symbol, idx) => this.formatSymbol(symbol, idx, normalizedMbti))
      .filter(Boolean)
      .join('\n\n');

    /*
      RAG 기반이므로 프롬프팅에서 오히려 요구사항 넣으면 부작용난다함
      따라서 RAG 기반 정보만 깔끔히 넘겨줘서 알잘딱깔쎈을 기대해야한다
        - dream -> 내용
        - emotions/mbti/context -> 이걸로 맥락 
        - symbols -> LLM이 참고할 데이터
        - 그리고 advice나 뭐 그런 조언같은거만 첨가하고 줄마다 \n제거해서 보냄
    */
    const parts = [
      `Dream narrative:\n${request.dream.trim()}`,
      this.optionalLine('Dreamer emotions', request.emotions?.join(', ')),
      this.optionalLine('Dreamer MBTI', normalizedMbti),
      this.optionalLine('Additional context', request.extraContext?.trim()),
      'Symbol insights to weave into the response:',
      formattedSymbols || 'No prior references found.',
      'Respond as a single conversational paragraph that blends interpretation with gentle guidance, avoids lists/headings, and can naturally mention similar dream themes.',
    ];

    return parts.filter(Boolean).join('\n\n');
  }

  // 심볼 하나마다 갖고있는 모든 정보를 보기좋게 문자열로 정리
  private formatSymbol(
    symbol: RelatedSymbol,
    index: number,
    mbti?: string,
  ): string {
    const tone = this.resolveTone(symbol, mbti);
    const interpretations = symbol.interpretations?.length
      ? symbol.interpretations.map((line) => `- ${line}`).join('\n')
      : null;

    const lines = [
      `Symbol #${index + 1}: ${symbol.symbol}`,
      this.optionalLine('Categories', symbol.categories?.join(', ')),
      this.optionalLine('Description', symbol.description),
      this.optionalLine('Emotions', symbol.emotions?.join(', ')),
      this.optionalLine('Suggested Tone', tone),
      interpretations ? `Interpretations:\n${interpretations}` : null,
      this.optionalLine('Advice', symbol.advice),
    ];

    return lines.filter(Boolean).join('\n');
  }

  // mbti 톤 선택값/기본값으로 초기화
  private resolveTone(symbol: RelatedSymbol, mbti?: string): string | null {
    if (!symbol.mbtiTone) return null;

    if (mbti && symbol.mbtiTone[mbti]) {
      return symbol.mbtiTone[mbti];
    }

    return symbol.mbtiTone.DEFAULT || null;
  }

  // 넘겨받은 값 있으면 Label:value 형태로 변환
  private optionalLine(label: string, value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return `${label}: ${value.trim()}`;
  }
}
