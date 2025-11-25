import chalk from "chalk";
import { postApi } from "../api";
import { SessionStore } from "../sessions/session-store";
import { printPanel, formatKeyValue } from "../ui/layout";

interface RetryResponse {
  requestId: string;
}

export async function handleRetryFailed(
  args: string[],
  sessions: SessionStore
) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const [requestId] = args;
  if (!requestId) {
    console.log("Usage: /retry <failedRequestId>");
    return;
  }

  const response = await postApi<RetryResponse>(
    `/interpret/failed/${requestId}/retry`,
    {},
    {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    }
  );

  if (!response.success || !response.data) {
    console.error(
      chalk.red(response.message ?? "<!> 실패한 요청을 재처리하지 못했습니다.")
    );
    return;
  }

  printPanel("Failed Request Retried", [
    {
      title: "새 요청 정보",
      lines: [
        formatKeyValue("Request ID", response.data.requestId),
        "실패한 요청을 다시 처리하기 시작했습니다. /status 명령으로 진행 상황을 확인할 수 있습니다.",
      ],
    },
  ]);
}
