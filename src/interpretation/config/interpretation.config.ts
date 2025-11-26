import { registerAs } from "@nestjs/config";

export const DEFAULT_INTERPRETATION_CONFIG = {
  topN: 2,
  promptLimits: {
    symbolMeanings: 2,
    derivedMeanings: 2,
    adviceLength: 80,
  },
  similarityWeights: {
    symbol: 0.5,
    action: 0.3,
    derived: 0.2,
  },
};

export const interpretationConfig = registerAs("interpretation", () => ({
  topN: DEFAULT_INTERPRETATION_CONFIG.topN,
  promptLimits: { ...DEFAULT_INTERPRETATION_CONFIG.promptLimits },
  similarityWeights: { ...DEFAULT_INTERPRETATION_CONFIG.similarityWeights },
}));

export type InterpretationPromptLimits =
  typeof DEFAULT_INTERPRETATION_CONFIG.promptLimits;

export type InterpretationSimilarityWeights =
  typeof DEFAULT_INTERPRETATION_CONFIG.similarityWeights;

export type InterpretationConfigValues = typeof DEFAULT_INTERPRETATION_CONFIG;
