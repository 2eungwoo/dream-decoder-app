export function wrapLines(lines: string[], width: number) {
  return lines.flatMap((line) => wrapLine(line ?? "", width));
}

function wrapLine(text: string, width: number) {
  const raw = text.replace(/\r/g, "");
  const result: string[] = [];
  const paragraphs = raw.split("\n");
  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      result.push("");
      return;
    }
    result.push(...wrapParagraph(trimmed, width));
  });

  return result.length ? result : [""];
}

function wrapParagraph(text: string, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!word) {
      return;
    }

    if (!current) {
      if (visibleLength(word) > width) {
        lines.push(...chunkWord(word, width));
        current = "";
      } else {
        current = word;
      }
      return;
    }

    if (visibleLength(`${current} ${word}`) <= width) {
      current = `${current} ${word}`;
      return;
    }

    lines.push(current);
    if (visibleLength(word) > width) {
      lines.push(...chunkWord(word, width));
      current = "";
    } else {
      current = word;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines;
}

function chunkWord(word: string, width: number) {
  const plain = stripAnsi(word);
  if (!plain.length) {
    return [word];
  }

  const chunks: string[] = [];
  const { prefix, suffix, innerHasAnsi } = extractAnsiWrap(word);
  if (innerHasAnsi) {
    return [word];
  }

  for (let i = 0; i < plain.length; i += width) {
    const chunk = plain.slice(i, i + width);
    chunks.push(`${prefix}${chunk}${suffix}`);
  }
  return chunks;
}

function extractAnsiWrap(text: string) {
  const prefixMatch = text.match(/^((?:\u001B\[[0-?]*[ -/]*[@-~])+)/);
  const suffixMatch = text.match(/((?:\u001B\[[0-?]*[ -/]*[@-~])+)\s*$/);
  const prefix = prefixMatch?.[0] ?? "";
  const suffix = suffixMatch?.[0] ?? "";
  const start = prefix.length;
  const end = Math.max(start, text.length - suffix.length);
  const inner = text.slice(start, end);
  const innerHasAnsi = inner.includes("\u001b");
  return { prefix, suffix, innerHasAnsi };
}

export function visibleLength(text: string) {
  return stripAnsi(text).length;
}

export function stripAnsi(text: string) {
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\u001B\[[0-?]*[ -/]*[@-~]/g;
  return text.replace(ansiRegex, "");
}
