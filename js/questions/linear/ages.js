// カテゴリ：年齢
// 基本式：現在の倍率×x＋年数 ＝ 将来の倍率×(x＋年数)

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-05";
const CATEGORY_NAME = "年齢";

// このカテゴリの式は「現在の倍率×x＋年数＝将来の倍率×(x＋年数)」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "(", ")", "="];

/**
 * x（子どもの現在の年齢）が正の整数になるように、倍率と年数を組み立てる。
 */
function buildAgeNumbers() {
  const futureMultiplier = randomInt(2, 3);
  const diff = randomInt(1, 2); // 現在の倍率 - 将来の倍率
  const currentMultiplier = futureMultiplier + diff;
  const m = randomInt(3, 8);

  const yearsLater = diff * m;
  const expectedX = (futureMultiplier - 1) * m;

  return { expectedX, currentMultiplier, futureMultiplier, yearsLater };
}

export const agesTemplates = [
  {
    templateId: "L1-05-father-son",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, currentMultiplier, futureMultiplier, yearsLater } =
        buildAgeNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、父の年齢は息子の年齢の${currentMultiplier}倍です。` +
          `${yearsLater}年後には、父の年齢が息子の年齢の${futureMultiplier}倍に` +
          `なります。息子の現在の年齢をx歳として方程式を立てなさい。`,

        variableDefinition: "息子の現在の年齢",

        expectedX,

        canonicalEquation: `${currentMultiplier}*x+${yearsLater}=${futureMultiplier}*(x+${yearsLater})`,
        displayEquation: `${currentMultiplier}x＋${yearsLater}＝${futureMultiplier}(x＋${yearsLater})`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          currentMultiplier,
          yearsLater,
          futureMultiplier
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${yearsLater}）`,
            value: `(x+${yearsLater})`,
            ariaLabel: `xたす${yearsLater}`
          }
        ],

        hint:
          `${yearsLater}年後の息子の年齢は「x＋${yearsLater}」歳と表せます。` +
          `父の年齢も同じように${yearsLater}を足して表しましょう。`,

        explanation:
          `${yearsLater}年後の父の年齢と、息子の年齢の${futureMultiplier}倍が等しくなります。`
      };
    }
  },

  {
    templateId: "L1-05-mother-daughter",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, currentMultiplier, futureMultiplier, yearsLater } =
        buildAgeNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、母の年齢は娘の年齢の${currentMultiplier}倍です。` +
          `${yearsLater}年後には、母の年齢が娘の年齢の${futureMultiplier}倍に` +
          `なります。娘の現在の年齢をx歳として方程式を立てなさい。`,

        variableDefinition: "娘の現在の年齢",

        expectedX,

        canonicalEquation: `${currentMultiplier}*x+${yearsLater}=${futureMultiplier}*(x+${yearsLater})`,
        displayEquation: `${currentMultiplier}x＋${yearsLater}＝${futureMultiplier}(x＋${yearsLater})`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          currentMultiplier,
          yearsLater,
          futureMultiplier
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${yearsLater}）`,
            value: `(x+${yearsLater})`,
            ariaLabel: `xたす${yearsLater}`
          }
        ],

        hint:
          `${yearsLater}年後の娘の年齢は「x＋${yearsLater}」歳と表せます。` +
          `母の年齢も同じように${yearsLater}を足して表しましょう。`,

        explanation:
          `${yearsLater}年後の母の年齢と、娘の年齢の${futureMultiplier}倍が等しくなります。`
      };
    }
  },

  {
    templateId: "L1-05-sisters",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, currentMultiplier, futureMultiplier, yearsLater } =
        buildAgeNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、姉の年齢は妹の年齢の${currentMultiplier}倍です。` +
          `${yearsLater}年後には、姉の年齢が妹の年齢の${futureMultiplier}倍に` +
          `なります。妹の現在の年齢をx歳として方程式を立てなさい。`,

        variableDefinition: "妹の現在の年齢",

        expectedX,

        canonicalEquation: `${currentMultiplier}*x+${yearsLater}=${futureMultiplier}*(x+${yearsLater})`,
        displayEquation: `${currentMultiplier}x＋${yearsLater}＝${futureMultiplier}(x＋${yearsLater})`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          currentMultiplier,
          yearsLater,
          futureMultiplier
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（x＋${yearsLater}）`,
            value: `(x+${yearsLater})`,
            ariaLabel: `xたす${yearsLater}`
          }
        ],

        hint:
          `${yearsLater}年後の妹の年齢は「x＋${yearsLater}」歳と表せます。` +
          `姉の年齢も同じように${yearsLater}を足して表しましょう。`,

        explanation:
          `${yearsLater}年後の姉の年齢と、妹の年齢の${futureMultiplier}倍が等しくなります。`
      };
    }
  }
];
