// カテゴリ：長いす・過不足
// 基本式：1脚あたりA人×脚数＋座れない人数 ＝ 1脚あたりB人×(脚数－1)＋最後の1脚の人数

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-04";
const CATEGORY_NAME = "長いす・過不足";

// このカテゴリの式は「A×x＋あまり＝B×(x－1)＋最後の人数」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "-", "(", ")", "="];

/**
 * 「最後の1脚だけ人数が違う」設定が矛盾しないよう、
 * 座れない人数(standingCount)を脚数から逆算して求める。
 */
function buildBenchNumbers() {
  const expectedX = randomInt(8, 18);
  const perBenchA = randomInt(4, 6);
  const perBenchB = perBenchA + 1;
  const lastBenchCount = randomInt(1, perBenchB - 1);

  const standingCount = expectedX - perBenchB + lastBenchCount;

  return { expectedX, perBenchA, perBenchB, lastBenchCount, standingCount };
}

export const benchesTemplates = [
  {
    templateId: "L1-04-gym-students",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perBenchA, perBenchB, lastBenchCount, standingCount } =
        buildBenchNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `体育館で、生徒が長いすに座ります。1脚に${perBenchA}人ずつ座ると` +
          `${standingCount}人が座れず、1脚に${perBenchB}人ずつ座ると、` +
          `最後の1脚には${lastBenchCount}人だけ座りました。長いすの数をx脚として` +
          `方程式を立てなさい。`,

        variableDefinition: "長いすの数",

        expectedX,

        canonicalEquation: `${perBenchA}*x+${standingCount}=${perBenchB}*(x-1)+${lastBenchCount}`,
        displayEquation: `${perBenchA}x＋${standingCount}＝${perBenchB}(x−1)＋${lastBenchCount}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perBenchA,
          standingCount,
          perBenchB,
          lastBenchCount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          { display: "（x−1）", value: "(x-1)", ariaLabel: "xひく1" }
        ],

        hint:
          `1脚に${perBenchB}人ずつ座ったとき、最後の1脚をのぞいた長いすの数は` +
          `「x－1」脚と表せます。`,

        explanation:
          "座り方が変わっても、生徒の総数は変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-04-park-visitors",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perBenchA, perBenchB, lastBenchCount, standingCount } =
        buildBenchNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `公園で、来場者がベンチに座ります。1脚に${perBenchA}人ずつ座ると` +
          `${standingCount}人が座れず、1脚に${perBenchB}人ずつ座ると、` +
          `最後の1脚には${lastBenchCount}人だけ座りました。ベンチの数をx脚として` +
          `方程式を立てなさい。`,

        variableDefinition: "ベンチの数",

        expectedX,

        canonicalEquation: `${perBenchA}*x+${standingCount}=${perBenchB}*(x-1)+${lastBenchCount}`,
        displayEquation: `${perBenchA}x＋${standingCount}＝${perBenchB}(x−1)＋${lastBenchCount}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perBenchA,
          standingCount,
          perBenchB,
          lastBenchCount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          { display: "（x−1）", value: "(x-1)", ariaLabel: "xひく1" }
        ],

        hint:
          `1脚に${perBenchB}人ずつ座ったとき、最後の1脚をのぞいたベンチの数は` +
          `「x－1」脚と表せます。`,

        explanation:
          "座り方が変わっても、来場者の総数は変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-04-meeting-chairs",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perBenchA, perBenchB, lastBenchCount, standingCount } =
        buildBenchNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `集会で、参加者がパイプ椅子に座ります。1脚に${perBenchA}人ずつ座ると` +
          `${standingCount}人が座れず、1脚に${perBenchB}人ずつ座ると、` +
          `最後の1脚には${lastBenchCount}人だけ座りました。パイプ椅子の数をx脚として` +
          `方程式を立てなさい。`,

        variableDefinition: "パイプ椅子の数",

        expectedX,

        canonicalEquation: `${perBenchA}*x+${standingCount}=${perBenchB}*(x-1)+${lastBenchCount}`,
        displayEquation: `${perBenchA}x＋${standingCount}＝${perBenchB}(x−1)＋${lastBenchCount}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perBenchA,
          standingCount,
          perBenchB,
          lastBenchCount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          { display: "（x−1）", value: "(x-1)", ariaLabel: "xひく1" }
        ],

        hint:
          `1脚に${perBenchB}人ずつ座ったとき、最後の1脚をのぞいたパイプ椅子の数は` +
          `「x－1」脚と表せます。`,

        explanation:
          "座り方が変わっても、参加者の総数は変わらないことから方程式が立てられます。"
      };
    }
  }
];
