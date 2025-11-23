import chalk from "chalk";
import { postApi } from "../api";
import { SessionStore } from "../sessions/session-store";

interface SaveInterpretationPayload {
  dream: string;
  emotions: string[];
  mbti?: string;
  extraContext?: string;
  interpretation: string;
}

type AskFn = (prompt: string) => Promise<string>;

export async function saveInterpretationOrNot(
  ask: AskFn,
  sessions: SessionStore,
  payload: SaveInterpretationPayload
) {
  const session = sessions.get();
  if (!session) {
    return;
  }

  const confirmation = (
    await ask(chalk.gray("이 해몽 결과를 저장할까요? (y/n) "))
  )?.trim();
  if (confirmation?.toLowerCase() !== "y") {
    return;
  }

  const response = await postApi<{ id: string }>(
    "/interpret/logs",
    {
      dream: payload.dream,
      emotions: payload.emotions,
      mbti: payload.mbti,
      extraContext: payload.extraContext,
      interpretation: payload.interpretation,
    },
    {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    }
  );

  if (!response.success) {
    console.error(
      chalk.red(response.message ?? "<!> 해몽 기록 저장에 실패했습니다.")
    );
    return;
  }

  console.log(
    chalk.greenBright(
      `해몽 기록이 저장되었습니다. ID: ${response.data?.id ?? ""}`
    )
  );
}
