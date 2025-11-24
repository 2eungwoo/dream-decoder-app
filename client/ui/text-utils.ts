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

  const { prefix, suffix, innerHasAnsi } = extractAnsiWrap(word);
  if (innerHasAnsi) {
    return [word];
  }

  const chunks: string[] = [];
  let buffer = "";
  let bufferWidth = 0;

  for (const char of plain) {
    const charWidth = charDisplayWidth(char);
    if (buffer && bufferWidth + charWidth > width) {
      chunks.push(`${prefix}${buffer}${suffix}`);
      buffer = char;
      bufferWidth = charWidth;
    } else {
      buffer += char;
      bufferWidth += charWidth;
    }
  }

  if (buffer) {
    chunks.push(`${prefix}${buffer}${suffix}`);
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
  const plain = stripAnsi(text);
  let width = 0;
  for (const char of plain) {
    width += charDisplayWidth(char);
  }
  return width;
}

export function stripAnsi(text: string) {
  const ansiRegex = /\u001B\[[0-?]*[ -/]*[@-~]/g;
  return text.replace(ansiRegex, "");
}

function charDisplayWidth(char: string) {
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return 0;
  }

  return isFullWidthCodePoint(codePoint) ? 2 : 1;
}

function isFullWidthCodePoint(code: number) {
  if (
    code >= 0x1100 && // 한글 자모 영역 시작(초성·중성 등)
    (code <= 0x115f || // 한글 자모 블록
      code === 0x2329 || // 전각 괄호(⟨)
      code === 0x232a || // 전각 괄호(⟩)
      (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) || // CJK 부수·Radical, 한중일 관련 기호
      (code >= 0x3250 && code <= 0x4dbf) || // CJK 확장 A
      (code >= 0x4e00 && code <= 0xa4c6) || // CJK 통합 한자 영역
      (code >= 0xa960 && code <= 0xa97c) || // 한글 자모 확장 A
      (code >= 0xac00 && code <= 0xd7a3) || // 한글 음절(가~힣)
      (code >= 0xf900 && code <= 0xfaff) || // CJK 호환 한자
      (code >= 0xfe10 && code <= 0xfe19) || // 전각 문장 부호
      (code >= 0xfe30 && code <= 0xfe6b) || // 전각 기호/구두점
      (code >= 0xff01 && code <= 0xff60) || // 전각 ASCII 변형(！～ 등)
      (code >= 0xffe0 && code <= 0xffe6) || // 전각 화폐/기호(￥￡ 등)
      (code >= 0x1f300 && code <= 0x1f64f) || // 이모지(날씨·표정 등)
      (code >= 0x1f900 && code <= 0x1f9ff) || // 이모지 추가 영역
      (code >= 0x20000 && code <= 0x3fffd)) // CJK 확장 B~G 초대형 한자 영역
  ) {
    return true;
  }
  return false;
}
