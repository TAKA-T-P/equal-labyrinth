// カテゴリ：食塩水の混合（L2-09）
// 基本式：食塩水の重さの合計／食塩の重さの合計（濃度×重さ＝食塩の重さ）

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-09";
const CATEGORY_NAME = "食塩水の混合";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "×", "="];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * 天びん算（うで比）の考え方で、混ぜたあとの濃度がちょうど整数％になるよう
 * x（薄いほう）とy（濃いほう）の重さの比を決めてから、実際の重さへ拡大する。
 */
function buildMixtureNumbers() {
  const concentrationLow = randomInt(2, 10);
  const concentrationMixed = randomInt(concentrationLow + 1, concentrationLow + 8);
  const concentrationHigh = randomInt(concentrationMixed + 1, concentrationMixed + 8);

  const diffLow = concentrationMixed - concentrationLow; // yの比
  const diffHigh = concentrationHigh - concentrationMixed; // xの比
  const g = gcd(diffLow, diffHigh);
  const ratioX = diffHigh / g;
  const ratioY = diffLow / g;

  const scale = randomInt(2, 9) * 10;
  const x = ratioX * scale;
  const y = ratioY * scale;
  const total = x + y;

  return { concentrationLow, concentrationHigh, concentrationMixed, x, y, total };
}

function buildSaltWaterQuestion({ concentrationLow, concentrationHigh, concentrationMixed, x, y }) {
  const total = x + y;
  const decimalLow = concentrationLow / 100;
  const decimalHigh = concentrationHigh / 100;
  const decimalMixed = concentrationMixed / 100;

  return {
    id: createUniqueId("L2-09-salt-water"),
    templateId: "L2-09-salt-water",
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `${concentrationLow}％の食塩水と${concentrationHigh}％の食塩水を混ぜて、` +
      `${concentrationMixed}％の食塩水を${total}g作ります。${concentrationLow}％の食塩水を` +
      `xg、${concentrationHigh}％の食塩水をygとして連立方程式を立てなさい。`,

    variableDefinitions: {
      x: `${concentrationLow}％の食塩水の重さ（g）`,
      y: `${concentrationHigh}％の食塩水の重さ（g）`
    },

    expectedSolution: { x, y },

    canonicalEquations: [
      { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "食塩水の重さの合計" },
      {
        internal: `${decimalLow}*x+${decimalHigh}*y=${decimalMixed}*${total}`,
        display: `${decimalLow}x＋${decimalHigh}y＝${decimalMixed}×${total}`,
        relationName: "食塩の重さの合計"
      }
    ],

    solutionDisplay: `x＝${x}、y＝${y}`,

    keypadNumbers: buildKeypadNumbers([total, decimalLow, decimalHigh, decimalMixed]),
    keypadSymbols: KEYPAD_SYMBOLS,

    hint: `含まれる食塩の重さは「濃度×食塩水の重さ」で表せます。全体では「${decimalMixed}×${total}」です。`,
    hintKeypadParts: [],

    explanation: "食塩水の重さの合計と、含まれる食塩の重さの合計から2本の式を作ります。"
  };
}

export const mixtureTemplates = [
  {
    templateId: "L2-09-salt-water",
    categoryId: CATEGORY_ID,

    generate() {
      const { concentrationLow, concentrationHigh, concentrationMixed, x, y } =
        buildMixtureNumbers();
      return buildSaltWaterQuestion({ concentrationLow, concentrationHigh, concentrationMixed, x, y });
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildSaltWaterQuestion({
        concentrationLow: 5,
        concentrationHigh: 15,
        concentrationMixed: 10,
        x: 100,
        y: 100
      });
    }
  },

  {
    templateId: "L2-09-sugar-water",
    categoryId: CATEGORY_ID,

    generate() {
      const { concentrationLow, concentrationHigh, concentrationMixed, x, y, total } =
        buildMixtureNumbers();
      const decimalLow = concentrationLow / 100;
      const decimalHigh = concentrationHigh / 100;
      const decimalMixed = concentrationMixed / 100;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `${concentrationLow}％の砂糖水と${concentrationHigh}％の砂糖水を混ぜて、` +
          `${concentrationMixed}％の砂糖水を${total}g作ります。${concentrationLow}％の砂糖水を` +
          `xg、${concentrationHigh}％の砂糖水をygとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `${concentrationLow}％の砂糖水の重さ（g）`,
          y: `${concentrationHigh}％の砂糖水の重さ（g）`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "砂糖水の重さの合計" },
          {
            internal: `${decimalLow}*x+${decimalHigh}*y=${decimalMixed}*${total}`,
            display: `${decimalLow}x＋${decimalHigh}y＝${decimalMixed}×${total}`,
            relationName: "砂糖の重さの合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([total, decimalLow, decimalHigh, decimalMixed]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `含まれる砂糖の重さは「濃度×砂糖水の重さ」で表せます。全体では「${decimalMixed}×${total}」です。`,
        hintKeypadParts: [],

        explanation: "砂糖水の重さの合計と、含まれる砂糖の重さの合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-09-mix-with-water",
    categoryId: CATEGORY_ID,

    generate() {
      const { concentrationLow, concentrationHigh, concentrationMixed, x, y, total } =
        buildMixtureNumbers();
      const decimalLow = concentrationLow / 100;
      const decimalHigh = concentrationHigh / 100;
      const decimalMixed = concentrationMixed / 100;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `濃度${concentrationLow}％の消毒液と濃度${concentrationHigh}％の消毒液を混ぜて、` +
          `濃度${concentrationMixed}％の消毒液を${total}mL作ります。濃度${concentrationLow}％の` +
          `消毒液をxmL、濃度${concentrationHigh}％の消毒液をymLとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `濃度${concentrationLow}％の消毒液の量（mL）`,
          y: `濃度${concentrationHigh}％の消毒液の量（mL）`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${total}`, display: `x＋y＝${total}`, relationName: "消毒液の量の合計" },
          {
            internal: `${decimalLow}*x+${decimalHigh}*y=${decimalMixed}*${total}`,
            display: `${decimalLow}x＋${decimalHigh}y＝${decimalMixed}×${total}`,
            relationName: "有効成分の量の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([total, decimalLow, decimalHigh, decimalMixed]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `含まれる成分の量は「濃度×消毒液の量」で表せます。全体では「${decimalMixed}×${total}」です。`,
        hintKeypadParts: [],

        explanation: "消毒液の量の合計と、含まれる成分の量の合計から2本の式を作ります。"
      };
    }
  }
];
