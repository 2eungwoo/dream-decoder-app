import { cliTheme as theme } from "./theme";
import { clampWidth, DEFAULT_BOX_WIDTH } from "./layout-config";
import { visibleLength, wrapLines } from "./text-utils";

export interface BoxSection {
  title?: string;
  lines: string[];
}

export interface BoxPrintOptions {
  width?: number;
}

export function printPanel(
  title: string,
  sections: BoxSection[],
  options?: BoxPrintOptions
) {
  const lines = buildPanelLines(title, sections, options);
  for (const line of lines) {
    console.log(line);
  }
}

export function formatKeyValue(label: string, value: string) {
  return `${theme.sectionTitle(label)} ${theme.muted("│")} ${theme.text(
    value
  )}`;
}

export function formatBullet(text: string) {
  return `${theme.bullet("•")} ${text}`;
}

export function dim(text: string) {
  return theme.muted(text);
}

export function highlight(text: string) {
  return theme.highlight(text);
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  const limit = Math.max(1, maxLength - 1);
  const sliced = text.slice(0, limit).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const trimmed =
    lastSpace > 0 ? sliced.slice(0, lastSpace).trimEnd() : sliced;
  return `${trimmed}…`;
}

function buildPanelLines(
  title: string,
  sections: BoxSection[],
  options?: BoxPrintOptions
) {
  const width = clampWidth(options?.width ?? DEFAULT_BOX_WIDTH);
  const innerWidth = width - 4;
  const lines: string[] = [];
  const topBorder = `┌${"─".repeat(width - 2)}┐`;
  const bottomBorder = `└${"─".repeat(width - 2)}┘`;
  lines.push(theme.border(topBorder));

  if (title) {
    lines.push(formatContentLine(theme.title(title), innerWidth));
    lines.push(formatContentLine("", innerWidth));
  }

  sections.forEach((section, index) => {
    if (section.title) {
      lines.push(formatContentLine(theme.sectionTitle(section.title), innerWidth));
    }
    const wrapped = wrapLines(section.lines, innerWidth);
    wrapped.forEach((line) => {
      lines.push(formatContentLine(theme.text(line), innerWidth));
    });

    if (index < sections.length - 1) {
      lines.push(formatContentLine("", innerWidth));
    }
  });

  lines.push(theme.border(bottomBorder));
  return lines;
}

function formatContentLine(text: string, width: number) {
  const plainLength = visibleLength(text);
  const padding = Math.max(0, width - plainLength);
  const padded = `${text}${" ".repeat(padding)}`;
  return `${theme.border("│ ")}${padded}${theme.border(" │")}`;
}
