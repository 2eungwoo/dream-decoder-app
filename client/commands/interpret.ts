import { getApi, postApi } from "../api";
import { ApiResponse } from "../../src/shared/dto/api-response.dto";
import { printResponse } from "../ui/output";
import { SessionStore } from "../sessions/session-store";
import { saveInterpretationOrNot } from "./save";

import {
  promptDream,
  promptEmotionSelections,
  promptMbtiSelection,
  promptExtraContext,
  QuestionFn,
} from "../ui/input";
import { Spinner } from "../ui/spinner";
import { formatKeyValue, printPanel } from "../ui/layout";
import { InterpretationStatusResponse } from "../types/interpretation-status";

interface ApiInterpretResponse {
  requestId: string;
}

const STATUS_POLL_INTERVAL_MS = 1_500;
const MAX_STATUS_POLLS = 120;

export async function handleInterpret(ask: QuestionFn, sessions: SessionStore) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const dream = await promptDream(ask);
  if (!dream) {
    console.log("<!> 꿈 내용을 입력하지 않았습니다.");
    return;
  }

  const emotions = await promptEmotionSelections(ask);
  const mbti = await promptMbtiSelection(ask);
  const extraContext = await promptExtraContext(ask);

  const spinner = new Spinner();
  spinner.start("해몽 요청을 전송하는 중입니다...");
  try {
    const data = await postApi<ApiInterpretResponse>(
      "/interpret",
      {
        dream,
        emotions,
        mbti,
        extraContext,
      },
      {
        headers: {
          "x-username": session.username,
          "x-password": session.password,
        },
      }
    );

    spinner.stop();
    if (!data.success || !data.data?.requestId) {
      printResponse(data);
      return;
    }

    const requestId = data.data.requestId;
    printPanel("해몽 요청이 접수되었습니다", [
      {
        title: "요청 정보",
        lines: [
          formatKeyValue("Request ID", requestId),
          "상태 확인: /status 명령 또는 자동 상태 조회를 기다려주세요.",
        ],
      },
    ]);

    spinner.start("해몽을 생성하는 중입니다...");
    const finalStatus = await pollInterpretationStatus(
      requestId,
      session.username,
      session.password
    );

    spinner.stop();
    if (finalStatus.status === "failed" || !finalStatus.interpretation) {
      console.error(
        finalStatus.errorMessage ??
          "<!> 해몽 생성에 실패했습니다. /status 명령으로 다시 확인해주세요."
      );
      return;
    }

    const response: ApiResponse<{ interpretation: string }> = {
      success: true,
      message: finalStatus.fromCache
        ? "이전과 완전히 동일한 응답이므로 같은 결과가 불러와졌습니다."
        : "해몽이 완료되었습니다! 아래 내용을 확인해주세요",
      data: { interpretation: finalStatus.interpretation },
    };

    printResponse(response);
    await saveInterpretationOrNot(ask, sessions, {
      dream,
      emotions,
      mbti,
      extraContext,
      interpretation: finalStatus.interpretation,
    });
  } catch (error) {
    spinner.stop();
    const message =
      (error as Error)?.message ??
      "<!> 해몽 요청이 실패했습니다. 잠시 후 다시 시도해주세요.";
    console.error(message);
  }
}

async function pollInterpretationStatus(
  requestId: string,
  username: string,
  password: string
) {
  for (let attempt = 0; attempt < MAX_STATUS_POLLS; attempt += 1) {
    const statusResponse = await getApi<InterpretationStatusResponse>(
      `/interpret/status/${requestId}`,
      {
        headers: {
          "x-username": username,
          "x-password": password,
        },
      }
    );

    if (!statusResponse.success || !statusResponse.data) {
      throw new Error(
        statusResponse.message ?? "<!> 해몽 상태를 조회하지 못했습니다."
      );
    }

    const status = statusResponse.data;
    if (status.status === "completed" && status.interpretation) {
      return status;
    }

    if (status.status === "failed") {
      return status;
    }

    await delay(STATUS_POLL_INTERVAL_MS);
  }

  throw new Error(
    "<!> 해몽 요청이 예상보다 오래 걸립니다. /status 명령으로 진행 상황을 확인해주세요."
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
