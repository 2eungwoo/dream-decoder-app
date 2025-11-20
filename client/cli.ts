import readline from 'node:readline/promises';
import chalk from 'chalk';
import { ASCII_LOGO, COMMANDS_BOX } from './constants/banner';
import { printUsage } from './ui/output';
import { SessionStore } from './sessions/session-store';
import { handleRegister } from './commands/register';
import { handleLogin } from './commands/login';
import { handleLogout } from './commands/logout';
import { handleChat } from './commands/chat';
import { handleInterpret } from './commands/interpret';

type PromptFn = (message: string) => Promise<string>;

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const sessions = new SessionStore();
  printIntro();

  rl.on('SIGINT', () => {
    console.log('\nBye!');
    rl.close();
    process.exit(0);
  });

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const input = (await rl.question(
        chalk.hex('#4CC9F0')('dream-decoder> '),
      ))?.trim();

      if (!input) {
        continue;
      }

      const [command, ...args] = input.split(/\s+/);
      if (command === '/quit') {
        break;
      }

      const ask: PromptFn = (prompt) => rl.question(prompt);
      await dispatchCommand(command, args, sessions, ask);
    }
  } finally {
    rl.close();
  }
}

function printIntro() {
  console.log(chalk.cyanBright(ASCII_LOGO));
  console.log(
    chalk.magentaBright(
      'Welcome, Dream Decoder CLI! type help for commands, /quit to exit.',
    ),
  );
  console.log(chalk.blueBright(COMMANDS_BOX));
}

async function dispatchCommand(
  command: string,
  args: string[],
  sessions: SessionStore,
  ask: PromptFn,
) {
  switch (command) {
    case 'register':
      return handleRegister(args);
    case 'login':
      return handleLogin(args, sessions);
    case 'logout':
      return handleLogout(args, sessions);
    case 'chat':
      return handleChat(args, sessions);
    case 'interpret':
      return handleInterpret(async (prompt) => {
        const response = await ask(chalk.hex('#C792EA')(prompt));
        return response;
      }, sessions);
    case 'help':
      return printUsage();
    default:
      console.log('Unknown command. type help for list.');
  }
}

void main().catch((err) => {
  console.error('CLI failure', err);
  process.exitCode = 1;
});
