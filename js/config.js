// アプリ全体で利用する定数

export const APP_CONFIG = {
  minQuestions: 3,
  maxQuestions: 20,
  defaultQuestions: 5,
  hintDelaySeconds: 20,
  passDelaySeconds: 40,
  correctDisplayMilliseconds: 2000,
  passDisplayMilliseconds: 1500,
  countdownMilliseconds: 750,
  numericTolerance: 1e-9,
  maxGenerationAttempts: 30,
  storageKeyPrefix: "equalLabyrinth",

  // 段位認定モード
  rankDurationMs: 120000,
  rankFinalGracePeriodMs: 30000,
  rankUrgentThresholdSeconds: 10,
  rankBaseTimeSeconds: 12,
  rankDefaultDifficulty: "NORMAL"
};
