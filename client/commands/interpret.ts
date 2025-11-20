import { postApi } from "../api";
import { printResponse } from "../ui/output";
import { SessionStore } from "../sessions/session-store";
import { Spinner } from "../ui/spinner";

type QuestionFn = (prompt: string) => Promise<string>;

const EMOTION_OPTIONS = [
  "기쁨",
  "설렘",
  "불안",
  "무서움",
  "분노",
  "슬픔",
  "당황",
  "안도",
];

const MBTI_OPTIONS = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
];

export async function handleInterpret(ask: QuestionFn, sessions: SessionStore) {
  const session = sessions.get();
  if (!session) {
    console.log("먼저 login 명령으로 로그인 해주세요.");
    return;
  }

  const dream = (
    await ask("\n꿈 내용에 대해 자유롭게 입력해주세요.\n> ")
  ).trim();
  if (!dream) {
    console.log("꿈 내용을 입력하지 않았습니다.");
    return;
  }

  const emotions = await askEmotionSelections(ask);
  const mbti = await askMbtiSelection(ask);

  const extraContext = (
    await ask(
      "최근 겪은 일, 감정 변화, 관계 갈등 등 꿈에 영향을 준 맥락이 있나요? (없으면 Enter)\n> "
    )
  ).trim();

  const spinner = new Spinner();
  spinner.start("해몽을 생성하는 중입니다...");
  try {
    const data = await postApi<{
      interpretation: string;
      references: unknown[];
    }>("/interpret", {
      dream,
      emotions,
      mbti,
      extraContext,
    }, {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    });

    spinner.stop();
    printResponse(data);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

async function askEmotionSelections(ask: QuestionFn) {
  const instructions = `꿈 당시 감정 혹은 깨어난 직후의 감정을 선택해주세요. (복수 선택 가능)
                        \n${formatOptions(EMOTION_OPTIONS)} 
                        \n예시) 2,4 또는 "기쁨, 긴장"`;
  const input = (await ask(instructions)).trim();
  return parseMultiSelection(input, EMOTION_OPTIONS);
}

async function askMbtiSelection(ask: QuestionFn) {
  const instructions = ` AI의 응답 성향을 설정해주세요. MBTI를 기반으로 적절한 성격을 갖게됩니다. 
                        \n${formatOptions(MBTI_OPTIONS)} 
                        \n예시) 11 또는 ENFP `;
  const input = (await ask(instructions)).trim();
  if (!input) {
    return undefined;
  }
  return parseSingleSelection(input, MBTI_OPTIONS);
}

function formatOptions(options: string[]) {
  return options.map((option, idx) => `${idx + 1}. ${option}`).join("  ");
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
    } else if (options.includes(token)) {
      selected.push(token);
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
