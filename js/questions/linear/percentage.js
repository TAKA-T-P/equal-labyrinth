// カテゴリ：割合・増減
// 基本式：割合を表す小数×x＝結果の数量

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-09";
const CATEGORY_NAME = "割合・増減";

// このカテゴリの式は「小数×x＝結果」だけで組み立てられるため、
// 使用する記号も問題によらず一定になる（かっこ・×は不要）。
const KEYPAD_SYMBOLS = ["x", "="];

const DISCOUNT_PERCENT_CHOICES = [10, 20, 30, 40];
const MARKUP_PERCENT_CHOICES = [10, 20, 30];
const RATIO_PERCENT_CHOICES = [20, 25, 30, 35, 40, 45];

/**
 * ダミーカードが必ず3番目（右端）に並んでしまい見分けやすくならないよう、
 * 1番目か2番目のどちらかにランダムで挿入する。
 */
function buildKeypadNumbersWithDummy(realNumbers, dummy) {
  const values = [...realNumbers];
  values.splice(randomInt(0, 1), 0, dummy);
  return buildKeypadNumbers(values);
}

export const percentageTemplates = [
  {
    templateId: "L1-09-discount-price",
    categoryId: CATEGORY_ID,

    generate() {
      const discountPercent = randomChoice(DISCOUNT_PERCENT_CHOICES);
      const decimal = (100 - discountPercent) / 100;
      // 「割引率そのもの（％を100で割った値）」をダミーの選択肢として混ぜ、
      // 数字カードが2枚だけにならないようにする。
      const dummyDecimal = discountPercent / 100;
      const expectedX = randomInt(50, 300) * 10;
      const finalPrice = Math.round(decimal * expectedX);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある品物を定価の${discountPercent}％引きで買うと${finalPrice}円` +
          `でした。定価をx円として方程式を立てなさい。`,

        variableDefinition: "定価",

        expectedX,

        canonicalEquation: `${decimal}*x=${finalPrice}`,
        displayEquation: `${decimal}x＝${finalPrice}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbersWithDummy([decimal, finalPrice], dummyDecimal),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [],

        hint:
          `定価の${discountPercent}％引きは、定価の(100－${discountPercent})÷100倍、` +
          `つまり定価×${decimal}で表せます。`,

        explanation:
          "割引後の値段は、定価に割引後の割合（小数）をかけた金額になります。"
      };
    }
  },

  {
    templateId: "L1-09-markup-price",
    categoryId: CATEGORY_ID,

    generate() {
      const increasePercent = randomChoice(MARKUP_PERCENT_CHOICES);
      const decimal = (100 + increasePercent) / 100;
      // 「上乗せ率そのもの（％を100で割った値）」をダミーの選択肢として混ぜ、
      // 数字カードが2枚だけにならないようにする。
      const dummyDecimal = increasePercent / 100;
      const expectedX = randomInt(50, 300) * 10;
      const finalPrice = Math.round(decimal * expectedX);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある品物の仕入れ値に${increasePercent}％の利益を上乗せして売ったところ、` +
          `売り値は${finalPrice}円になりました。仕入れ値をx円として方程式を` +
          `立てなさい。`,

        variableDefinition: "仕入れ値",

        expectedX,

        canonicalEquation: `${decimal}*x=${finalPrice}`,
        displayEquation: `${decimal}x＝${finalPrice}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbersWithDummy([decimal, finalPrice], dummyDecimal),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [],

        hint:
          `仕入れ値に${increasePercent}％の利益を上乗せすることは、` +
          `仕入れ値×${decimal}と考えられます。`,

        explanation:
          "売り値は、仕入れ値に利益の割合（小数）をかけた金額になります。"
      };
    }
  },

  {
    templateId: "L1-09-school-ratio",
    categoryId: CATEGORY_ID,

    generate() {
      const percent = randomChoice(RATIO_PERCENT_CHOICES);
      const decimal = percent / 100;
      // 「残り（自転車通学ではない）の割合」をダミーの選択肢として混ぜ、
      // 数字カードが2枚だけにならないようにする。
      const dummyDecimal = (100 - percent) / 100;
      const expectedX = randomInt(3, 15) * 20;
      const partCount = Math.round(decimal * expectedX);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある中学校の生徒数の${percent}％が自転車通学をしていて、` +
          `その人数は${partCount}人でした。全校生徒の人数をx人として` +
          `方程式を立てなさい。`,

        variableDefinition: "全校生徒の人数",

        expectedX,

        canonicalEquation: `${decimal}*x=${partCount}`,
        displayEquation: `${decimal}x＝${partCount}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbersWithDummy([decimal, partCount], dummyDecimal),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [],

        hint:
          `${percent}％は、全体を1としたときの${decimal}にあたります。` +
          `自転車通学の人数は、全校生徒の人数×${decimal}で表せます。`,

        explanation:
          "自転車通学の人数は、全校生徒の人数に割合（小数）をかけた人数になります。"
      };
    }
  }
];
