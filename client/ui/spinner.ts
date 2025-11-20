const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  private timer?: NodeJS.Timeout;
  private frameIndex = 0;
  private message = "";

  public start(message: string) {
    this.message = message;
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex];
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length; // frame-idx 돌리면서 스피너 구현
      process.stdout.write(`\r${frame} ${this.message}`);
    }, 80);
  }

  public stop(finalMessage?: string) {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;

    process.stdout.write("\r");
    if (finalMessage) {
      console.log(finalMessage);
    } else {
      process.stdout.write(" ".repeat(this.message.length + 2));
      process.stdout.write("\r");
    }

    this.frameIndex = 0;
  }
}
