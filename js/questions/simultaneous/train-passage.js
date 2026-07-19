// カテゴリ：電車の通過（L2-07）
// 電車の長さをx、速さ（毎秒）をyとして、
// 「通過する物の長さ＋電車の長さ＝速さ×時間」の関係から式を立てる。

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-07";
const CATEGORY_NAME = "電車の通過";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "="];

/**
 * x（電車の長さ）とy（速さ）を先に決め、通過に要する時間が整数になるよう
 * 通過する物の長さ（obj1Length・obj2Length）をyの倍数へ調整してから逆算する。
 */
function buildTrainNumbers(speedChoices, lengthRangeA, lengthRangeB) {
  const y = randomChoice(speedChoices);
  const x = randomInt(15, 40) * 10;

  let obj1Length = randomInt(lengthRangeA[0], lengthRangeA[1]) * 10;
  let obj2Length = randomInt(lengthRangeB[0], lengthRangeB[1]) * 10;

  obj1Length += (y - ((x + obj1Length) % y)) % y;
  obj2Length += (y - ((x + obj2Length) % y)) % y;

  // 2つの通過にかかる時間が同じだと2本の式が比例してしまい（行列式が0）、
  // 解が定まらなくなるため、長さが重ならないよう調整する。
  if (obj1Length === obj2Length) {
    obj2Length += y;
  }

  const time1 = (x + obj1Length) / y;
  const time2 = (x + obj2Length) / y;

  return { x, y, obj1Length, obj2Length, time1, time2 };
}

export const trainPassageTemplates = [
  {
    templateId: "L2-07-bridge-tunnel",
    categoryId: CATEGORY_ID,

    generate() {
      const { x, y, obj1Length, obj2Length, time1, time2 } = buildTrainNumbers(
        [15, 20, 25],
        [80, 200],
        [150, 300]
      );

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある電車が${obj1Length}mの鉄橋を渡り始めてから渡り終わるまでに${time1}秒かかりました。` +
          `また、${obj2Length}mのトンネルに入り始めてから出るまでに${time2}秒かかりました。` +
          `電車の長さをxm、電車の速さを毎秒ymとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "電車の長さ（m）",
          y: "電車の速さ（毎秒m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `x+${obj1Length}=${time1}*y`,
            display: `x＋${obj1Length}＝${time1}y`,
            relationName: "鉄橋を渡る関係"
          },
          {
            internal: `x+${obj2Length}=${time2}*y`,
            display: `x＋${obj2Length}＝${time2}y`,
            relationName: "トンネルを通る関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([obj1Length, time1, obj2Length, time2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "電車が渡り始めてから渡り終わるまでに進む道のりは「電車の長さ＋鉄橋の長さ」です。",
        hintKeypadParts: [
          { display: `x＋${obj1Length}`, value: `x+${obj1Length}`, ariaLabel: `xたす${obj1Length}` }
        ],

        explanation: "鉄橋・トンネルそれぞれについて、進んだ道のりと速さ×時間の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-07-overpass-tunnel",
    categoryId: CATEGORY_ID,

    generate() {
      const { x, y, obj1Length, obj2Length, time1, time2 } = buildTrainNumbers(
        [18, 22, 24],
        [60, 150],
        [180, 260]
      );

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある電車が${obj1Length}mの陸橋を渡り始めてから渡り終わるまでに${time1}秒かかりました。` +
          `また、${obj2Length}mのトンネルに入り始めてから出るまでに${time2}秒かかりました。` +
          `電車の長さをxm、電車の速さを毎秒ymとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "電車の長さ（m）",
          y: "電車の速さ（毎秒m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `x+${obj1Length}=${time1}*y`,
            display: `x＋${obj1Length}＝${time1}y`,
            relationName: "陸橋を渡る関係"
          },
          {
            internal: `x+${obj2Length}=${time2}*y`,
            display: `x＋${obj2Length}＝${time2}y`,
            relationName: "トンネルを通る関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([obj1Length, time1, obj2Length, time2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "電車が渡り始めてから渡り終わるまでに進む道のりは「電車の長さ＋陸橋の長さ」です。",
        hintKeypadParts: [
          { display: `x＋${obj1Length}`, value: `x+${obj1Length}`, ariaLabel: `xたす${obj1Length}` }
        ],

        explanation: "陸橋・トンネルそれぞれについて、進んだ道のりと速さ×時間の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-07-two-tunnels",
    categoryId: CATEGORY_ID,

    generate() {
      const { x, y, obj1Length, obj2Length, time1, time2 } = buildTrainNumbers(
        [16, 20, 24, 28],
        [100, 220],
        [230, 350]
      );

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある電車が長さ${obj1Length}mのトンネルAに入り始めてから出るまでに${time1}秒かかりました。` +
          `また、長さ${obj2Length}mのトンネルBに入り始めてから出るまでに${time2}秒かかりました。` +
          `電車の長さをxm、電車の速さを毎秒ymとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "電車の長さ（m）",
          y: "電車の速さ（毎秒m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `x+${obj1Length}=${time1}*y`,
            display: `x＋${obj1Length}＝${time1}y`,
            relationName: "トンネルAを通る関係"
          },
          {
            internal: `x+${obj2Length}=${time2}*y`,
            display: `x＋${obj2Length}＝${time2}y`,
            relationName: "トンネルBを通る関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([obj1Length, time1, obj2Length, time2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "電車がトンネルに入り始めてから出るまでに進む道のりは「電車の長さ＋トンネルの長さ」です。",
        hintKeypadParts: [
          { display: `x＋${obj1Length}`, value: `x+${obj1Length}`, ariaLabel: `xたす${obj1Length}` }
        ],

        explanation: "2つのトンネルについて、進んだ道のりと速さ×時間の関係から2本の式を作ります。"
      };
    }
  }
];
