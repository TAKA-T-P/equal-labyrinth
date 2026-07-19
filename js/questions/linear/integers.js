// カテゴリ：整数
// 基本式：連続する整数（または偶数）の和＝合計

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-06";
const CATEGORY_NAME = "整数";

// このカテゴリの式は加法とかっこだけで組み立てられるため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "(", ")", "="];

export const integersTemplates = [
  {
    templateId: "L1-06-three-consecutive",
    categoryId: CATEGORY_ID,

    generate() {
      const expectedX = randomInt(5, 50);
      const sum = expectedX + (expectedX + 1) + (expectedX + 2);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `連続する3つの整数の和が${sum}です。最も小さい整数をxとして` +
          `方程式を立てなさい。`,

        variableDefinition: "最も小さい整数",

        expectedX,

        canonicalEquation: `x+(x+1)+(x+2)=${sum}`,
        displayEquation: `x＋(x＋1)＋(x＋2)＝${sum}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers(["1", "2", sum]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          { display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }
        ],

        hint:
          `連続する整数は、1ずつ大きくなります。真ん中の整数は「x＋1」、` +
          `一番大きい整数は「x＋2」と表せます。`,

        explanation:
          "3つの整数を、すべてxを使って表してから足し合わせます。"
      };
    }
  },

  {
    templateId: "L1-06-two-consecutive-even",
    categoryId: CATEGORY_ID,

    generate() {
      const expectedX = randomInt(3, 25) * 2;
      const sum = expectedX + (expectedX + 2);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `連続する2つの偶数の和が${sum}です。小さいほうの偶数をxとして` +
          `方程式を立てなさい。`,

        variableDefinition: "小さいほうの偶数",

        expectedX,

        canonicalEquation: `x+(x+2)=${sum}`,
        displayEquation: `x＋(x＋2)＝${sum}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers(["2", sum]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          { display: "（x＋2）", value: "(x+2)", ariaLabel: "xたす2" }
        ],

        hint:
          `連続する偶数は、2ずつ大きくなります。大きいほうの偶数は` +
          `「x＋2」と表せます。`,

        explanation:
          "2つの偶数を、どちらもxを使って表してから足し合わせます。"
      };
    }
  }
];
