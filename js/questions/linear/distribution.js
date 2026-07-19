// カテゴリ：分配・過不足
// 基本式：1人分×人数＋余り ＝ 別の1人分×人数－不足

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-03";
const CATEGORY_NAME = "分配・過不足";

// このカテゴリの式は「1人分×人数＋余り＝別の1人分×人数－不足」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "-", "="];

/**
 * 余りと不足の組を、人数xに対して整数になるように生成する。
 */
function buildDistributionNumbers() {
  const expectedX = randomInt(4, 15);
  const perPersonDiff = randomInt(1, 3);
  const perPersonA = randomInt(3, 8);
  const perPersonB = perPersonA + perPersonDiff;

  const totalDiff = perPersonDiff * expectedX;
  const surplus = randomInt(1, totalDiff - 1);
  const shortage = totalDiff - surplus;

  return { expectedX, perPersonA, perPersonB, surplus, shortage };
}

export const distributionTemplates = [
  {
    templateId: "L1-03-candy-children",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perPersonA, perPersonB, surplus, shortage } =
        buildDistributionNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `あめを何人かの子どもに配ります。1人${perPersonA}個ずつ配ると` +
          `${surplus}個余り、1人${perPersonB}個ずつ配ると${shortage}個` +
          `足りません。子どもの人数をx人として方程式を立てなさい。`,

        variableDefinition: "子どもの人数",

        expectedX,

        canonicalEquation: `${perPersonA}*x+${surplus}=${perPersonB}*x-${shortage}`,
        displayEquation: `${perPersonA}x＋${surplus}＝${perPersonB}x−${shortage}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perPersonA,
          surplus,
          perPersonB,
          shortage
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「1人分×人数＋余り」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `${perPersonA}x＋${surplus}`,
            value: `${perPersonA}x+${surplus}`,
            ariaLabel: `${perPersonA}xたす${surplus}`
          }
        ],

        hint:
          `あめの個数は「1人${perPersonA}個×人数＋${surplus}個」でも、` +
          `「1人${perPersonB}個×人数－${shortage}個」でも表せます。`,

        explanation:
          "配り方が変わっても、あめの総数は変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-03-pencil-students",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perPersonA, perPersonB, surplus, shortage } =
        buildDistributionNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `鉛筆を、クラスの生徒に配ります。1人${perPersonA}本ずつ配ると` +
          `${surplus}本余り、1人${perPersonB}本ずつ配ると${shortage}本` +
          `足りません。生徒の人数をx人として方程式を立てなさい。`,

        variableDefinition: "生徒の人数",

        expectedX,

        canonicalEquation: `${perPersonA}*x+${surplus}=${perPersonB}*x-${shortage}`,
        displayEquation: `${perPersonA}x＋${surplus}＝${perPersonB}x−${shortage}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perPersonA,
          surplus,
          perPersonB,
          shortage
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「1人分×人数＋余り」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `${perPersonA}x＋${surplus}`,
            value: `${perPersonA}x+${surplus}`,
            ariaLabel: `${perPersonA}xたす${surplus}`
          }
        ],

        hint:
          `鉛筆の本数は「1人${perPersonA}本×人数＋${surplus}本」でも、` +
          `「1人${perPersonB}本×人数－${shortage}本」でも表せます。`,

        explanation:
          "配り方が変わっても、鉛筆の総数は変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-03-card-groups",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, perPersonA, perPersonB, surplus, shortage } =
        buildDistributionNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `カードを、いくつかの班に配ります。1班${perPersonA}枚ずつ配ると` +
          `${surplus}枚余り、1班${perPersonB}枚ずつ配ると${shortage}枚` +
          `足りません。班の数をx班として方程式を立てなさい。`,

        variableDefinition: "班の数",

        expectedX,

        canonicalEquation: `${perPersonA}*x+${surplus}=${perPersonB}*x-${shortage}`,
        displayEquation: `${perPersonA}x＋${surplus}＝${perPersonB}x−${shortage}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          perPersonA,
          surplus,
          perPersonB,
          shortage
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「1人分×人数＋余り」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `${perPersonA}x＋${surplus}`,
            value: `${perPersonA}x+${surplus}`,
            ariaLabel: `${perPersonA}xたす${surplus}`
          }
        ],

        hint:
          `カードの枚数は「1班${perPersonA}枚×班の数＋${surplus}枚」でも、` +
          `「1班${perPersonB}枚×班の数－${shortage}枚」でも表せます。`,

        explanation:
          "配り方が変わっても、カードの総数は変わらないことから方程式が立てられます。"
      };
    }
  }
];
