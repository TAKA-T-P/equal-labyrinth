// カテゴリ：池の周回（L2-08）
// 反対方向に進むと2人の道のりの和が1周分、同じ方向に進むと2人の道のりの差が
// 1周分になることから、2人の速さ（x, y）を求める。

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-08";
const CATEGORY_NAME = "池の周回";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "-", "="];

/**
 * 出会うまでの時間・追いつくまでの時間の両方から求めた1周の長さが
 * 矛盾なく一致するよう、時間の比率（catchUpTimeがmeetTimeの整数倍）から
 * 速さの比率を整数で作り、最後に現実的な速さになるよう距離の単位で拡大する。
 */
function buildTrackNumbers() {
  const meetTime = randomInt(3, 8);
  const catchUpMultiplier = randomInt(3, 8);
  const catchUpTime = meetTime * catchUpMultiplier;
  const k = randomInt(2, 5);
  const scale = randomChoice([20, 25, 30, 40]);

  const sumSpeedUnits = catchUpMultiplier * k;
  const diffSpeedUnits = k;

  if ((sumSpeedUnits + diffSpeedUnits) % 2 !== 0) {
    return buildTrackNumbers();
  }

  const xUnits = (sumSpeedUnits + diffSpeedUnits) / 2;
  const yUnits = (sumSpeedUnits - diffSpeedUnits) / 2;
  if (yUnits <= 0) {
    return buildTrackNumbers();
  }

  const x = xUnits * scale;
  const y = yUnits * scale;
  const lapLength = meetTime * (x + y);

  return { meetTime, catchUpTime, lapLength, x, y };
}

export const circularTrackTemplates = [
  {
    templateId: "L2-08-pond",
    categoryId: CATEGORY_ID,

    generate() {
      const { meetTime, catchUpTime, lapLength, x, y } = buildTrackNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `1周${lapLength}mの池のまわりを、AさんとB君が同じ地点から同時に出発しました。` +
          `反対方向に走ると${meetTime}分後に初めて出会い、同じ方向に走ると${catchUpTime}分後に` +
          `AさんがB君に追いつきました。Aさんの速さを毎分xm、B君の速さを毎分ymとして` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "Aさんの速さ（毎分m）",
          y: "B君の速さ（毎分m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `${meetTime}*x+${meetTime}*y=${lapLength}`,
            display: `${meetTime}x＋${meetTime}y＝${lapLength}`,
            relationName: "反対方向に進んで出会う関係"
          },
          {
            internal: `${catchUpTime}*x-${catchUpTime}*y=${lapLength}`,
            display: `${catchUpTime}x−${catchUpTime}y＝${lapLength}`,
            relationName: "同じ方向に進んで追いつく関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([meetTime, lapLength, catchUpTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "反対方向では2人の道のりの和が1周分、同じ方向では2人の道のりの差が1周分になります。",
        hintKeypadParts: [],

        explanation: "出会う関係と追いつく関係から、2人の速さについての2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-08-track",
    categoryId: CATEGORY_ID,

    generate() {
      const { meetTime, catchUpTime, lapLength, x, y } = buildTrackNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `1周${lapLength}mの陸上トラックを、姉と妹が同じ地点から同時にスタートしました。` +
          `反対方向に走ると${meetTime}分後に初めて出会い、同じ方向に走ると${catchUpTime}分後に` +
          `姉が妹に追いつきました。姉の速さを毎分xm、妹の速さを毎分ymとして連立方程式を` +
          `立てなさい。`,

        variableDefinitions: {
          x: "姉の速さ（毎分m）",
          y: "妹の速さ（毎分m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `${meetTime}*x+${meetTime}*y=${lapLength}`,
            display: `${meetTime}x＋${meetTime}y＝${lapLength}`,
            relationName: "反対方向に進んで出会う関係"
          },
          {
            internal: `${catchUpTime}*x-${catchUpTime}*y=${lapLength}`,
            display: `${catchUpTime}x−${catchUpTime}y＝${lapLength}`,
            relationName: "同じ方向に進んで追いつく関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([meetTime, lapLength, catchUpTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "反対方向では2人の道のりの和が1周分、同じ方向では2人の道のりの差が1周分になります。",
        hintKeypadParts: [],

        explanation: "出会う関係と追いつく関係から、2人の速さについての2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-08-cycling",
    categoryId: CATEGORY_ID,

    generate() {
      const { meetTime, catchUpTime, lapLength, x, y } = buildTrackNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `1周${lapLength}mのサイクリングコースを、兄と弟が同じ地点から同時に出発しました。` +
          `反対方向に進むと${meetTime}分後に初めて出会い、同じ方向に進むと${catchUpTime}分後に` +
          `兄が弟に追いつきました。兄の速さを毎分xm、弟の速さを毎分ymとして連立方程式を` +
          `立てなさい。`,

        variableDefinitions: {
          x: "兄の速さ（毎分m）",
          y: "弟の速さ（毎分m）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `${meetTime}*x+${meetTime}*y=${lapLength}`,
            display: `${meetTime}x＋${meetTime}y＝${lapLength}`,
            relationName: "反対方向に進んで出会う関係"
          },
          {
            internal: `${catchUpTime}*x-${catchUpTime}*y=${lapLength}`,
            display: `${catchUpTime}x−${catchUpTime}y＝${lapLength}`,
            relationName: "同じ方向に進んで追いつく関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([meetTime, lapLength, catchUpTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "反対方向では2人の道のりの和が1周分、同じ方向では2人の道のりの差が1周分になります。",
        hintKeypadParts: [],

        explanation: "出会う関係と追いつく関係から、2人の速さについての2本の式を作ります。"
      };
    }
  }
];
