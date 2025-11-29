import chalk from "chalk";
import { getApi, postApi } from "../api";
import { SessionStore } from "../sessions/session-store";
import { InterpretationStatusResponse } from "../types/interpretation-status";

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

  let attempt = 0;
  const maxAttempts = 3;
  while (attempt < maxAttempts) {
    const confirmation = (
      await ask(chalk.gray("이 해몽 결과를 저장할까요? (y/n) "))
    )
      ?.trim()
      .toLowerCase();

    if (!confirmation) {
      attempt += 1;
      console.log(chalk.yellow("<!> 값을 입력해주세요."));
      continue;
    }

    if (confirmation === "y" || confirmation.startsWith("y")) {
      break;
    }

    if (confirmation === "n" || confirmation.startsWith("n")) {
      console.log(chalk.gray("저장을 건너뜁니다."));
      return;
    }

    attempt += 1;
    console.log(chalk.yellow("<!> y 또는 n으로 입력해 주세요. (예: y)"));
  }

  if (attempt >= maxAttempts) {
    console.log(chalk.yellow("<!> 입력이 없어 저장을 건너뜁니다."));
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

export async function handleSaveRequest(
  args: string[],
  sessions: SessionStore,
  ask: AskFn
) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const [requestId] = args;
  if (!requestId) {
    console.log("Usage: /save <requestId>");
    return;
  }

  const statusResponse = await getApi<InterpretationStatusResponse>(
    `/interpret/status/${requestId}`,
    {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    }
  );

  if (!statusResponse.success || !statusResponse.data) {
    console.error(
      chalk.red(
        statusResponse.message ??
          "<!> 해몽 상태를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      )
    );
    return;
  }

  const status = statusResponse.data;
  if (status.status !== "completed" || !status.interpretation) {
    console.log(
      chalk.yellow(
        "<!> 아직 완료되지 않은 요청이거나 해몽 결과가 없습니다. /status 명령으로 진행 상황을 다시 확인해주세요."
      )
    );
    return;
  }

  const payload = status.payload;
  if (!payload?.dream?.trim()) {
    console.log(
      chalk.yellow(
        "<!> 원본 꿈 내용이 없어 저장할 수 없습니다. 새 요청으로 다시 시도해주세요."
      )
    );
    return;
  }

  await saveInterpretationOrNot(ask, sessions, {
    dream: payload.dream,
    emotions: payload.emotions ?? [],
    mbti: payload.mbti,
    extraContext: payload.extraContext,
    interpretation: status.interpretation,
  });
}
