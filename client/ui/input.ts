import { EMOTION_BOX, EMOTION_OPTIONS } from "../constants/emotion-options";
import { MBTI_BOX, MBTI_OPTIONS } from "../constants/mbti-options";

export type QuestionFn = (prompt: string) => Promise<string>;

export async function promptDream(ask: QuestionFn) {
  return (await ask("\n\n꿈 내용을 자유롭게 입력해주세요.\n> ")).trim();
}

export async function promptEmotionSelections(ask: QuestionFn) {
  console.log(EMOTION_BOX);
  const instructions = `꿈 당시 감정(복수 선택 가능)을 입력해주세요.
예시) 2,4 또는 "기쁨, 긴장"
> `;
  const input = (await ask(instructions)).trim();
  return parseMultiSelection(input, EMOTION_OPTIONS);
}

export async function promptMbtiSelection(ask: QuestionFn) {
  console.log(MBTI_BOX);
  const instructions = `AI 응답의 톤을 설정할 MBTI를 골라주세요.
예시) 11 또는 ENFP
> `;
  const input = (await ask(instructions)).trim();
  if (!input) {
    return undefined;
  }
  return parseSingleSelection(input, MBTI_OPTIONS);
}

export async function promptExtraContext(ask: QuestionFn) {
  const context = await ask(
    "최근 겪은 일, 감정 변화, 관계 갈등 등 꿈에 영향을 준 맥락이 있나요? (없으면 Enter)\n> "
  );
  return context.trim();
}

function parseMultiSelection(input: string, options: string[]) {
  if (!input) {
    return [];
  }
  const tokens = input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const selected: string[] = [];
  for (const token of tokens) {
    const index = Number(token);
    if (!Number.isNaN(index) && options[index - 1]) {
      selected.push(options[index - 1]);
    } else {
      selected.push(token);
    }
  }
  return Array.from(new Set(selected));
}

function parseSingleSelection(input: string, options: string[]) {
  const normalized = input.toUpperCase();
  const index = Number(normalized);
  if (!Number.isNaN(index) && options[index - 1]) {
    return options[index - 1];
  }
  if (options.includes(normalized)) {
    return normalized;
  }
  return normalized;
}
