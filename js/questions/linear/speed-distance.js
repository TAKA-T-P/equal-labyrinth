// カテゴリ：速さ・時間・道のり
// 基本式：遅い速さ×(時間＋差)＝速い速さ×時間（同じ道のりを2通りの速さで進む）

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-07";
const CATEGORY_NAME = "速さ・時間・道のり";

// このカテゴリの式は「遅い速さ×(x＋差の分)＝速い速さ×x」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "(", ")", "="];

/**
 * 道のりが一致するように、2つの速さと差の時間を組み立てる。
 */
function buildSpeedNumbers() {
  const expectedX = randomInt(4, 12);
  const unitA = randomInt(6, 14);
  const extraMinutes = randomInt(3, 10);

  const speedSlow = unitA * expectedX;
  const extra = unitA * extraMinutes;
  const speedFast = speedSlow + extra;

  return { expectedX, speedSlow, speedFast, extraMinutes };
}

export const speedDistanceTemplates = [
  {
    templateId: "L1-07-library-walk-run",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, extraMinutes } =
        buildSpeedNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `家から図書館まで、毎分${speedSlow}mで歩くと、毎分${speedFast}mで` +
          `歩く場合より${extraMinutes}分多くかかります。毎分${speedFast}mで` +
          `歩くときにかかる時間をx分として方程式を立てなさい。`,

        variableDefinition: `毎分${speedFast}mで歩くときにかかる時間（分）`,

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${extraMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${extraMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([speedSlow, speedFast, extraMinutes]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${extraMinutes}）`,
            value: `(x+${extraMinutes})`,
            ariaLabel: `xたす${extraMinutes}`
          }
        ],

        hint:
          `毎分${speedSlow}mで歩くときにかかる時間は、毎分${speedFast}mで歩く` +
          `ときの時間より${extraMinutes}分長いので「x＋${extraMinutes}」と表せます。`,

        explanation:
          "どちらの速さで歩いても、進む道のりは変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-07-school-walk-bicycle",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, extraMinutes } =
        buildSpeedNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `駅から学校まで、毎分${speedSlow}mで歩くと、毎分${speedFast}mで` +
          `自転車に乗る場合より${extraMinutes}分多くかかります。自転車で` +
          `かかる時間をx分として方程式を立てなさい。`,

        variableDefinition: "自転車でかかる時間（分）",

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${extraMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${extraMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([speedSlow, speedFast, extraMinutes]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${extraMinutes}）`,
            value: `(x+${extraMinutes})`,
            ariaLabel: `xたす${extraMinutes}`
          }
        ],

        hint:
          `歩くときにかかる時間は、自転車のときの時間より${extraMinutes}分` +
          `長いので「x＋${extraMinutes}」と表せます。`,

        explanation:
          "歩いても自転車でも、進む道のりは変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-07-park-walk-jog",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, speedSlow, speedFast, extraMinutes } =
        buildSpeedNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `家から公園まで、毎分${speedSlow}mで歩くと、毎分${speedFast}mで` +
          `走る場合より${extraMinutes}分多くかかります。走るときにかかる` +
          `時間をx分として方程式を立てなさい。`,

        variableDefinition: "走るときにかかる時間（分）",

        expectedX,

        canonicalEquation: `${speedSlow}*(x+${extraMinutes})=${speedFast}*x`,
        displayEquation: `${speedSlow}(x＋${extraMinutes})＝${speedFast}x`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([speedSlow, speedFast, extraMinutes]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${extraMinutes}）`,
            value: `(x+${extraMinutes})`,
            ariaLabel: `xたす${extraMinutes}`
          }
        ],

        hint:
          `歩くときにかかる時間は、走るときの時間より${extraMinutes}分` +
          `長いので「x＋${extraMinutes}」と表せます。`,

        explanation:
          "歩いても走っても、進む道のりは変わらないことから方程式が立てられます。"
      };
    }
  }
];
