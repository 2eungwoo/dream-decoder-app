import chalk from "chalk";
import { getApi } from "../api";
import { SessionStore } from "../sessions/session-store";

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
    console.log("<!> 먼저 login 명령으로 로그인 해주세요.");
    return;
  }

  const [recordId] = args;
  if (!recordId) {
    console.log("Usage: show-details <recordId>");
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
      chalk.red(
        response.message ?? "<!> 해몽 기록을 불러오지 못했습니다."
      )
    );
    return;
  }

  const detail = response.data;
  console.log(chalk.cyanBright(`\n[Saved Interpretation] ${detail.id}`));
  console.log(chalk.gray(`Created: ${new Date(detail.createdAt).toString()}`));
  console.log();
  console.log(chalk.magentaBright("Dream"));
  console.log(detail.dream);
  if (detail.emotions?.length) {
    console.log();
    console.log(chalk.magentaBright("Emotions"));
    console.log(detail.emotions.join(", "));
  }
  if (detail.extraContext) {
    console.log();
    console.log(chalk.magentaBright("Extra Context"));
    console.log(detail.extraContext);
  }
  console.log();
  console.log(chalk.greenBright("Interpretation"));
  console.log(detail.interpretation);
  console.log();
}
