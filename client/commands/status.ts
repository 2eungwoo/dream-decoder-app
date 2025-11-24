import chalk from "chalk";
import { getApi } from "../api";
import { SessionStore } from "../sessions/session-store";
import { formatBullet, formatKeyValue, printPanel } from "../ui/layout";
import { InterpretationStatusResponse } from "../types/interpretation-status";

export async function handleStatus(args: string[], sessions: SessionStore) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const [requestId] = args;
  if (!requestId) {
    console.log("Usage: /status <requestId>");
    return;
  }

  const response = await getApi<InterpretationStatusResponse>(
    `/interpret/status/${requestId}`,
    {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    }
  );

  if (!response.success || !response.data) {
    console.error(
      chalk.red(
        response.message ?? "<!> 해몽 상태를 불러오지 못했습니다. 다시 시도해주세요."
      )
    );
    return;
  }

  const status = response.data;
  const lines = [
    formatKeyValue("Request ID", status.requestId),
    formatKeyValue("상태", translateStatus(status.status)),
    formatKeyValue("재시도 횟수", status.retryCount.toString()),
  ];

  if (status.interpretation) {
    lines.push(
      "",
      formatBullet("해몽 결과가 준비되었습니다. 아래 detail 명령으로 확인하거나 CLI가 이미 표시했는지 확인하세요.")
    );
  }

  if (status.errorMessage) {
    lines.push("", chalk.red(status.errorMessage));
  }

  printPanel("해몽 요청 상태", [
    {
      title: "요청 정보",
      lines,
    },
    status.interpretation
      ? {
          title: "해몽 결과",
          lines: [status.interpretation],
        }
      : undefined,
  ].filter((section): section is NonNullable<typeof section> => Boolean(section)));
}

function translateStatus(status: InterpretationStatusResponse["status"]) {
  switch (status) {
    case "pending":
      return "대기 중";
    case "running":
      return "생성 중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
    default:
      return status;
  }
}
