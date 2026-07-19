// カテゴリ：平均（L2-12）
// 基本式：人数の合計／合計点の関係（各グループの平均×人数の合計＝全体の平均×全体の人数）

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-12";
const CATEGORY_NAME = "平均";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "×", "="];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * 天びん算（うで比）の考え方で、全体の平均がちょうど指定した値になるよう
 * x（平均が低いほうの人数）とy（平均が高いほうの人数）の比を決めてから、
 * 実際の人数へ拡大する。
 */
function buildAverageNumbers() {
  const avgLow = randomInt(50, 75);
  const avgOverall = randomInt(avgLow + 1, avgLow + 15);
  const avgHigh = randomInt(avgOverall + 1, avgOverall + 15);

  const diffLow = avgOverall - avgLow; // yの比
  const diffHigh = avgHigh - avgOverall; // xの比
  const g = gcd(diffLow, diffHigh);
  const ratioX = diffHigh / g;
  const ratioY = diffLow / g;

  const scale = randomInt(2, 6);
  const x = ratioX * scale;
  const y = ratioY * scale;
  const total = x + y;

  return { avgLow, avgHigh, avgOverall, x, y, total };
}

export const averagesTemplates = [
  {
    templateId: "L2-12-test-score",
    categoryId: CATEGORY_ID,

    generate() {
      const { avgLow, avgHigh, avgOverall, x, y, total } = buildAverageNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `男子と女子を合わせて${total}人のテストの平均点は${avgOverall}点でした。男子の平均点は` +
          `${avgLow}点、女子の平均点は${avgHigh}点です。男子の人数をx人、女子の人数をy人として` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "男子の人数",
          y: "女子の人数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "人数の合計" },
          {
            internal: `${avgLow}*x+${avgHigh}*y=${avgOverall}*${total}`,
            display: `${avgLow}x＋${avgHigh}y＝${avgOverall}×${total}`,
            relationName: "合計点の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([total, avgLow, avgHigh, avgOverall]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `全体の合計点は「${avgOverall}×${total}」、男女それぞれの合計点の和と等しくなります。`,
        hintKeypadParts: [],

        explanation: "人数の合計と、合計点の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-12-two-classes",
    categoryId: CATEGORY_ID,

    generate() {
      const { avgLow, avgHigh, avgOverall, x, y, total } = buildAverageNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `1組と2組を合わせて${total}人が数学のテストを受け、全体の平均点は${avgOverall}点でした。` +
          `1組の平均点は${avgLow}点、2組の平均点は${avgHigh}点です。1組の人数をx人、2組の人数を` +
          `y人として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "1組の人数",
          y: "2組の人数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "人数の合計" },
          {
            internal: `${avgLow}*x+${avgHigh}*y=${avgOverall}*${total}`,
            display: `${avgLow}x＋${avgHigh}y＝${avgOverall}×${total}`,
            relationName: "合計点の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([total, avgLow, avgHigh, avgOverall]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `全体の合計点は「${avgOverall}×${total}」、1組と2組それぞれの合計点の和と等しくなります。`,
        hintKeypadParts: [],

        explanation: "人数の合計と、合計点の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-12-height",
    categoryId: CATEGORY_ID,

    generate() {
      const { avgLow, avgHigh, avgOverall, x, y, total } = buildAverageNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `1年生と2年生を合わせて${total}人の反復横跳びの平均回数は${avgOverall}回でした。` +
          `1年生の平均回数は${avgLow}回、2年生の平均回数は${avgHigh}回です。1年生の人数をx人、` +
          `2年生の人数をy人として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "1年生の人数",
          y: "2年生の人数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "人数の合計" },
          {
            internal: `${avgLow}*x+${avgHigh}*y=${avgOverall}*${total}`,
            display: `${avgLow}x＋${avgHigh}y＝${avgOverall}×${total}`,
            relationName: "合計回数の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([total, avgLow, avgHigh, avgOverall]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `全体の合計回数は「${avgOverall}×${total}」、1年生と2年生それぞれの合計回数の和と等しくなります。`,
        hintKeypadParts: [],

        explanation: "人数の合計と、合計回数の関係から2本の式を作ります。"
      };
    }
  }
];
