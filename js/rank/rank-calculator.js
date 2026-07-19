// 段位計算だけを担当するモジュール

const BASE_TIME_SECONDS = 12; // 1次方程式の基準時間 timeB

// 段位係数(0〜20)に対応する段位名
const RANK_NAMES_BY_COEFFICIENT = [
  "皆伝", // 0
  "十段", // 1
  "九段", // 2
  "八段", // 3
  "七段", // 4
  "六段", // 5
  "五段", // 6
  "四段", // 7
  "三段", // 8
  "二段", // 9
  "初段", // 10
  "1級", // 11
  "2級", // 12
  "3級", // 13
  "4級", // 14
  "5級", // 15
  "6級", // 16
  "7級", // 17
  "8級", // 18
  "9級", // 19
  "10級" // 20
];

/**
 * 平均正解時間から、基本段位係数を計算する（小数点以下切り上げ）。
 * @param {number} averageCorrectTime timeA（秒）
 * @param {number} baseTimeSeconds timeB（秒）
 */
export function calculateBaseCoefficient(
  averageCorrectTime,
  baseTimeSeconds = BASE_TIME_SECONDS
) {
  const raw = Math.sqrt((averageCorrectTime / baseTimeSeconds) * 400) - 20;
  return Math.ceil(raw);
}

function formatDisplayRankName(rankName, difficulty) {
  return difficulty === "HARD" ? `${rankName}＋` : rankName;
}

function buildResult(baseCoefficient, penaltyCoefficient, difficulty) {
  const rawFinal = baseCoefficient + penaltyCoefficient;
  const finalCoefficient = Math.min(20, Math.max(0, rawFinal));
  const rankName = RANK_NAMES_BY_COEFFICIENT[finalCoefficient];

  return {
    baseCoefficient,
    penaltyCoefficient,
    finalCoefficient,
    rankName,
    displayRankName: formatDisplayRankName(rankName, difficulty)
  };
}

/**
 * 段位認定の結果から、最終的な段位を計算する。
 * @param {{
 *   averageCorrectTime: number|null,
 *   baseTime?: number,
 *   correctCount: number,
 *   incorrectCount: number,
 *   passCount: number,
 *   finalTimedOut: boolean,
 *   difficulty: "NORMAL"|"HARD"
 * }} input
 */
export function calculateRankResult(input) {
  const {
    averageCorrectTime,
    baseTime = BASE_TIME_SECONDS,
    correctCount,
    incorrectCount,
    passCount,
    finalTimedOut,
    difficulty
  } = input;

  // 正解数0問の場合は、平均正解時間が定義できないため、必ず10級（係数20）とする
  if (correctCount === 0) {
    return buildResult(0, 20, difficulty);
  }

  const baseCoefficient = calculateBaseCoefficient(averageCorrectTime, baseTime);

  let penaltyCoefficient = 0;
  penaltyCoefficient += incorrectCount * 1;
  penaltyCoefficient += passCount * 4;
  if (finalTimedOut) {
    penaltyCoefficient += 2;
  }

  if (correctCount === 1) {
    penaltyCoefficient += 10;
  } else if (correctCount === 2) {
    penaltyCoefficient += 3;
  }

  return buildResult(baseCoefficient, penaltyCoefficient, difficulty);
}

export function getRankNameByCoefficient(coefficient) {
  return RANK_NAMES_BY_COEFFICIENT[coefficient];
}

/**
 * 2つの段位係数を比較し、より上位（数値が小さい方）を返す。
 */
export function isBetterRankCoefficient(candidateCoefficient, currentBestCoefficient) {
  if (currentBestCoefficient === null || currentBestCoefficient === undefined) {
    return true;
  }
  return candidateCoefficient < currentBestCoefficient;
}

export { BASE_TIME_SECONDS };
