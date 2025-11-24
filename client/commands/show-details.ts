import chalk from "chalk";
import { getApi } from "../api";
import { SessionStore } from "../sessions/session-store";
import { BoxSection, formatKeyValue, printPanel } from "../ui/layout";

interface InterpretationDetailResponse {
  id: string;
  dream: string;
  emotions?: string[];
  mbti?: string | null;
  extraContext?: string | null;
  interpretation: string;
  createdAt: string;
}

export async function handleShowDetails(
  args: string[],
  sessions: SessionStore
) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 /login 명령으로 로그인 해주세요.");
    return;
  }

  const [recordId] = args;
  if (!recordId) {
    console.log("Usage: /detail <recordId>");
    return;
  }

  const response = await getApi<InterpretationDetailResponse>(
    `/interpret/logs/${recordId}`,
    {
      headers: {
        "x-username": session.username,
        "x-password": session.password,
      },
    }
  );

  if (!response.success || !response.data) {
    console.error(
      chalk.red(response.message ?? "<!> 해몽 기록을 불러오지 못했습니다.")
    );
    return;
  }

  const detail = response.data;
  const createdAt = new Date(detail.createdAt);
  const timestamp = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${createdAt.getDate().toString().padStart(2, "0")} ${createdAt
    .getHours()
    .toString()
    .padStart(2, "0")}:${createdAt.getMinutes().toString().padStart(2, "0")}`;

  const metadata = [
    formatKeyValue("ID", detail.id),
    formatKeyValue("생성 시각", timestamp),
  ];

  if (detail.mbti) {
    metadata.push(formatKeyValue("MBTI", detail.mbti));
  }

  if (detail.emotions?.length) {
    metadata.push(formatKeyValue("감정", detail.emotions.join(", ")));
  }

  const sections: Array<BoxSection | undefined> = [
    {
      title: "요청 정보",
      lines: metadata,
    },
    {
      title: "꿈 내용",
      lines: [detail.dream],
    },
    detail.extraContext
      ? {
          title: "추가 맥락",
          lines: [detail.extraContext],
        }
      : undefined,
    {
      title: "해몽 결과",
      lines: [detail.interpretation],
    },
  ];

  const compactSections = sections.filter(
    (section): section is BoxSection => Boolean(section)
  );

  printPanel("Saved Interpretation Detail", compactSections);
}
