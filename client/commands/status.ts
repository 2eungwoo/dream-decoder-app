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
    const friendlyMessage = extractMessage(response);
    if (isStatusClearedMessage(friendlyMessage)) {
      printStatusClearedNotice(requestId, friendlyMessage);
      return;
    }
    console.error(
      chalk.red(
        friendlyMessage ??
          "<!> 해몽 상태를 불러오지 못했습니다. 다시 시도해주세요."
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
      formatBullet(
        `해몽 결과가 준비되었습니다. \n /detail 명령으로 내용을 다시 보거나, 저장하려면 /save ${status.requestId} 명령으로 저장할 수 있습니다.`
      )
    );
  }

  if (status.errorMessage) {
    lines.push("", chalk.red(status.errorMessage));
  }

  printPanel(
    "해몽 요청 상태",
    [
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
    ].filter((section): section is NonNullable<typeof section> =>
      Boolean(section)
    )
  );
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

function extractMessage(response: unknown) {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const message = (response as { message?: string | string[] }).message;
  if (Array.isArray(message)) {
    return message.join(" ");
  }
  return message;
}

function isStatusClearedMessage(message?: string) {
  if (!message) {
    return false;
  }
  return (
    // 이거 포함돼있으면 cleared 처리
    message.includes("기록이 사라졌") ||
    message.includes("이미 저장되어") ||
    message.includes("찾을 수 없습니다")
  );
}

function printStatusClearedNotice(requestId: string, message?: string) {
  printPanel("해몽 요청 상태", [
    {
      title: "요청 정보",
      lines: [
        formatKeyValue("Request ID", requestId),
        formatKeyValue("상태", "완료"),
      ],
    },
    {
      title: "안내",
      lines: [
        message ??
          "이 해몽은 이미 저장되어 상태 기록이 사라졌어요. /list 또는 /detail 명령으로 다시 확인해 보세요.",
      ],
    },
  ]);
}
