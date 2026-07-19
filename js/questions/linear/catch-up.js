// カテゴリ：追いつき・出会い
// 基本式：遅い人が進んだ道のり ＝ 速い人が進んだ道のり

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-08";
const CATEGORY_NAME = "追いつき・出会い";

// このカテゴリの式は「遅い人が進んだ道のり＝速い人が進んだ道のり」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "(", ")", "="];

/**
 * 追いつくまでの時間xが整数になるように速さを組み立てる。
 */
function buildCatchUpNumbers() {
  const expectedX = randomInt(3, 7);
  const unitA = randomInt(8, 16);
  const headStartMinutes = randomInt(2, 5);

  const speedSlow = unitA * expectedX;
  const extraSpeed = unitA * headStartMinutes;
  const speedFast = speedSlow + extraSpeed;

  return { expectedX, speedSlow, speedFast, headStartMinutes };
}

export const catchUpTemplates = [
  {
    templateId: "L1-08-brother-chase",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, headStartMinutes } =
        buildCatchUpNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,

        prompt:
          `弟が分速${speedSlow}mで家を出発しました。その${headStartMinutes}分後に、` +
          `兄が分速${speedFast}mで同じ道を追いかけました。兄が出発してから` +
          `追いつくまでの時間をx分として方程式を立てなさい。`,

        variableDefinition: "兄が出発してから追いつくまでの時間（分）",

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${headStartMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${headStartMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          speedSlow,
          headStartMinutes,
          speedFast
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「遅い人が進んだ時間はx＋head分」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（x＋${headStartMinutes}）`,
            value: `(x+${headStartMinutes})`,
            ariaLabel: `xたす${headStartMinutes}`
          }
        ],

        hint:
          `弟が進んだ時間は、兄が出発してからの時間に` +
          `${headStartMinutes}分を足した時間になります。`,

        explanation:
          "追いついたとき、2人が進んだ道のりは等しくなります。"
      };
    }
  },

  {
    templateId: "L1-08-bicycle-chase",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, headStartMinutes } =
        buildCatchUpNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,

        prompt:
          `歩行者が分速${speedSlow}mで歩き始めました。その${headStartMinutes}分後に、` +
          `自転車が分速${speedFast}mで同じ道を追いかけました。自転車が出発してから` +
          `追いつくまでの時間をx分として方程式を立てなさい。`,

        variableDefinition: "自転車が出発してから追いつくまでの時間（分）",

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${headStartMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${headStartMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          speedSlow,
          headStartMinutes,
          speedFast
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「遅い人が進んだ時間はx＋head分」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（x＋${headStartMinutes}）`,
            value: `(x+${headStartMinutes})`,
            ariaLabel: `xたす${headStartMinutes}`
          }
        ],

        hint:
          `歩行者が進んだ時間は、自転車が出発してからの時間に` +
          `${headStartMinutes}分を足した時間になります。`,

        explanation:
          "自転車が追いついたとき、2人が進んだ道のりは等しくなります。"
      };
    }
  },

  {
    templateId: "L1-08-forgotten-item",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, headStartMinutes } =
        buildCatchUpNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,

        prompt:
          `姉が分速${speedSlow}mで学校に向かって歩き始めました。その` +
          `${headStartMinutes}分後、忘れ物に気づいた母が分速${speedFast}mで` +
          `追いかけました。母が出発してから追いつくまでの時間をx分として` +
          `方程式を立てなさい。`,

        variableDefinition: "母が出発してから追いつくまでの時間（分）",

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${headStartMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${headStartMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          speedSlow,
          headStartMinutes,
          speedFast
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「遅い人が進んだ時間はx＋head分」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（x＋${headStartMinutes}）`,
            value: `(x+${headStartMinutes})`,
            ariaLabel: `xたす${headStartMinutes}`
          }
        ],

        hint:
          `姉が進んだ時間は、母が出発してからの時間に` +
          `${headStartMinutes}分を足した時間になります。`,

        explanation:
          "母が追いついたとき、2人が進んだ道のりは等しくなります。"
      };
    }
  }
];
