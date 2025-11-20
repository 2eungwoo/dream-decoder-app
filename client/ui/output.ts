import chalk from "chalk";
import { ApiResponse } from "../../src/shared/dto/api-response.dto";

export function printResponse<T>(res: ApiResponse<T>) {
  const CLIENT_ERROR = 400;
  const SERVER_ERROR = 500;
  if (!res.success) {
    const color =
      res.code >= CLIENT_ERROR && res.code < SERVER_ERROR
        ? chalk.yellow
        : chalk.red;
    console.error(color(`<!> Error (${res.code}): ${res.message}`));
    return;
  }

  if (res.message) {
    console.log(res.message);
  }

  const data = res.data ?? ({} as Record<string, unknown>);
  if (isInterpretationData(data)) {
    console.log(chalk.cyanBright("\n\n[Dream Interpretation]\n"));
    console.log(chalk.white(data.interpretation));
    console.log();
    return;
  }

  if (isChatData(data)) {
    console.log(data.reply);
    return;
  }

  if (Object.keys(data).length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function printUsage() {
  console.log(`Commands:
  register <username> <password>
  login <username> <password>
  logout <username> <password>
  chat <message>
  interpret
  help
  /quit
`);
}

function isChatData(data: Record<string, unknown>): data is { reply: string } {
  return typeof data.reply === "string";
}

function isInterpretationData(data: Record<string, unknown>): data is {
  interpretation: string;
} {
  return typeof data.interpretation === "string";
}
