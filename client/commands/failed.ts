import chalk from "chalk";
import { getApi } from "../api";
import { SessionStore } from "../sessions/session-store";
import { formatKeyValue, highlight, printPanel, truncateText } from "../ui/layout";

interface FailedEntry {
  requestId: string;
  failedAt: string;
  errorMessage: string;
  dream?: string;
}

export async function handleShowFailed(
  args: string[],
  sessions: SessionStore
) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const response = await getApi<FailedEntry[]>("/interpret/failed", {
    headers: {
      "x-username": session.username,
      "x-password": session.password,
    },
  });

  if (!response.success || !response.data) {
    console.error(
      chalk.red(
        response.message ?? "<!> 실패한 해몽 요청을 불러오지 못했습니다."
      )
    );
    return;
  }

  if (!response.data.length) {
    printPanel("Failed Interpretation Requests", [
      {
        title: "실패한 요청",
        lines: ["<!> 현재 재처리할 요청이 없습니다."],
      },
    ]);
    return;
  }

  const sections = response.data.map((entry) => {
    const summary = [
      formatKeyValue("실패 시각", entry.failedAt),
      formatKeyValue("사유", entry.errorMessage || "알 수 없음"),
    ];
    if (entry.dream) {
      summary.push(formatKeyValue("꿈 요약", truncateText(entry.dream, 60)));
    }
    return {
      title: highlight(entry.requestId),
      lines: summary,
    };
  });

  printPanel("Failed Interpretation Requests", sections);
}
