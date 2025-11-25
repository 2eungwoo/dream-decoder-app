import { postApi } from "../api";
import { printResponse } from "../ui/output";
import { SessionStore } from "../sessions/session-store";

export async function handleNoRag(args: string[], sessions: SessionStore) {
  const session = sessions.get();
  if (!session) {
    console.log("<!> 로그인이 필요합니다.");
    return;
  }

  const message = args.join(" ");
  if (!message) {
    console.log("Usage: chat <message>");
    return;
  }

  const data = await postApi<{ reply: string }>("/chat", {
    username: session.username,
    password: session.password,
    message,
  });
  printResponse(data);
}
