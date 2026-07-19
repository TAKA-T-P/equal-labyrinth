// カテゴリ：年齢
// 基本式：現在の倍率×x＋年数 ＝ 将来の倍率×(x＋年数)

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-05";
const CATEGORY_NAME = "年齢";

// このカテゴリの式は「現在の倍率×x＋年数＝将来の倍率×(x＋年数)」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "(", ")", "="];

// 親子の現在の年齢差が、これ以上離れないようにする上限（歳）
const MAX_CURRENT_AGE_GAP = 50;

/**
 * x（子どもの現在の年齢）が正の整数になるように、倍率と年数を組み立てる。
 * 親子の現在の年齢差がMAX_CURRENT_AGE_GAP未満になるまで組み合わせを引き直し、
 * 非現実的な年齢差（例：親80歳・子16歳）を避ける。
 */
function buildAgeNumbers() {
  let futureMultiplier;
  let diff;
  let currentMultiplier;
  let m;
  let expectedX;

  do {
    futureMultiplier = randomInt(2, 3);
    diff = randomInt(1, 2); // 現在の倍率 - 将来の倍率
    currentMultiplier = futureMultiplier + diff;
    m = randomInt(3, 8);
    expectedX = (futureMultiplier - 1) * m;
  } while ((currentMultiplier - 1) * expectedX >= MAX_CURRENT_AGE_GAP);

  const yearsLater = diff * m;

  return { expectedX, currentMultiplier, futureMultiplier, yearsLater };
}

/**
 * x（今から何年後か）が正の整数になるように、現在の年齢と倍率を組み立てる。
 * 先にx（年数）を決めてから、それに矛盾しない親の現在の年齢を逆算することで、
 * 現在の年齢差から必ず割り切れるxが求まるようにしている。
 */
function buildYearsUntilRatioNumbers() {
  const futureMultiplier = randomInt(2, 3);
  const currentAgeB =
    futureMultiplier === 3 ? randomInt(8, 14) : randomInt(12, 20);
  const expectedX = futureMultiplier === 3 ? randomInt(1, 6) : randomInt(1, 8);

  const currentAgeA =
    futureMultiplier * currentAgeB + expectedX * (futureMultiplier - 1);

  return { expectedX, currentAgeA, currentAgeB, futureMultiplier };
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
  },

  {
    templateId: "L1-05-years-until-ratio",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, currentAgeA, currentAgeB, futureMultiplier } =
        buildYearsUntilRatioNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、父は${currentAgeA}歳で子は${currentAgeB}歳である。` +
          `父の年齢が子の年齢の${futureMultiplier}倍になるのはいまから何年後か。` +
          `x年後として方程式を立てなさい。`,

        variableDefinition: "今から何年後か",

        expectedX,

        canonicalEquation: `${currentAgeA}+x=${futureMultiplier}*(${currentAgeB}+x)`,
        displayEquation: `${currentAgeA}＋x＝${futureMultiplier}(${currentAgeB}＋x)`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          currentAgeA,
          currentAgeB,
          futureMultiplier
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `（${currentAgeB}＋x）`,
            value: `(${currentAgeB}+x)`,
            ariaLabel: `${currentAgeB}たすx`
          }
        ],

        hint:
          `x年後の子の年齢は「${currentAgeB}＋x」歳と表せます。` +
          `父の年齢も同じようにxを足して表しましょう。`,

        explanation:
          `x年後の父の年齢と、子の年齢の${futureMultiplier}倍が等しくなります。`
      };
    }
  }
];
