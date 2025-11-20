import { postApi } from "../api";
import { printResponse } from "../ui/output";
import { SessionStore } from "../sessions/session-store";

import {
  promptDream,
  promptEmotionSelections,
  promptMbtiSelection,
  promptExtraContext,
  QuestionFn,
} from "../ui/input";
import { Spinner } from "../ui/spinner";

export async function handleInterpret(ask: QuestionFn, sessions: SessionStore) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 먼저 login 명령으로 로그인 해주세요.");
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
  spinner.start("해몽을 생성하는 중입니다...");
  try {
    const data = await postApi<{
      interpretation: string;
      references: unknown[];
    }>(
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
    printResponse(data);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}
