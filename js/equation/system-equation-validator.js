// 連立方程式（中2）の正誤判定を担当するモジュール
//
// 単に(x, y)の解が一致するだけでは正解にしない。文章題は「2つの数量関係」を
// 立式する練習であるため、入力された各方程式が、問題データに登録された
// canonicalEquationsのいずれかと「0でない定数倍」の関係にあるかどうかで判定する
// （詳細はREADMEの「連立方程式の正誤判定」を参照）。

import { tokenize, EquationError } from "./tokenizer.js";
import { parseExpression } from "./parser.js";
import { splitAtEquals } from "./equation-validator.js";
import {
  astToTwoVariableExpression,
  subtractTwoVariableExpressions,
  isConstantTwoVariableExpression
} from "./two-variable-expression.js";
import { APP_CONFIG } from "../config.js";

function buildResult(status, message, extra = {}) {
  return {
    status,
    message,
    solvedValues: extra.solvedValues || null,
    matchedOrder: extra.matchedOrder || null
  };
}

/**
 * 1本の方程式文字列を、ax+by+c=0の標準形（{xCoefficient, yCoefficient, constant}）へ変換する。
 * 構文・非1次の乗除算などの問題は、そのままEquationErrorとして投げる。
 * @param {string} inputString
 */
export function parseEquationToStandardForm(inputString) {
  const tokens = tokenize(inputString);

  const splitResult = splitAtEquals(tokens);
  if (splitResult.error) {
    throw new EquationError(splitResult.error);
  }

  const leftAst = parseExpression(splitResult.leftTokens);
  const rightAst = parseExpression(splitResult.rightTokens);

  const leftExpression = astToTwoVariableExpression(leftAst);
  const rightExpression = astToTwoVariableExpression(rightAst);

  return subtractTwoVariableExpressions(leftExpression, rightExpression);
}

/**
 * 標準形が「恒等式」または「解なしの定数式」かどうかを判定する。
 * どちらでもない（xまたはyの係数を持つ、正常な関係式である）場合はnullを返す。
 * @returns {"identity"|"no-solution"|null}
 */
function classifyDegenerateEquation(standardForm, tolerance) {
  if (!isConstantTwoVariableExpression(standardForm)) {
    return null;
  }
  if (Math.abs(standardForm.constant) < tolerance) {
    return "identity";
  }
  return "no-solution";
}

/**
 * 2つの係数ベクトル[a,b,c]・[A,B,C]が、0でない定数倍の関係にあるかを判定する。
 * 1. 模範式の係数のうち、絶対値が最も大きいものを基準にする
 * 2. 入力式との倍率を求める
 * 3. 3つの係数がすべて同じ倍率か、許容誤差内で確認する
 * 4. 倍率が0の場合は不正解
 */
export function areProportionalEquations(inputExpression, canonicalExpression, tolerance) {
  const canonicalComponents = [
    canonicalExpression.xCoefficient,
    canonicalExpression.yCoefficient,
    canonicalExpression.constant
  ];
  const inputComponents = [
    inputExpression.xCoefficient,
    inputExpression.yCoefficient,
    inputExpression.constant
  ];

  let refIndex = 0;
  for (let i = 1; i < 3; i += 1) {
    if (Math.abs(canonicalComponents[i]) > Math.abs(canonicalComponents[refIndex])) {
      refIndex = i;
    }
  }

  const canonicalRef = canonicalComponents[refIndex];
  if (Math.abs(canonicalRef) < tolerance) {
    return false;
  }

  const ratio = inputComponents[refIndex] / canonicalRef;
  if (Math.abs(ratio) < tolerance) {
    return false;
  }

  for (let i = 0; i < 3; i += 1) {
    if (Math.abs(inputComponents[i] - canonicalComponents[i] * ratio) > tolerance) {
      return false;
    }
  }

  return true;
}

/**
 * 標準形が、候補の標準形のいずれか1つとでも「0でない定数倍」の関係にあるかを判定する。
 */
function isProportionalToAnyOf(standardForm, candidates, tolerance) {
  return candidates.some((candidate) => areProportionalEquations(standardForm, candidate, tolerance));
}

/**
 * canonicalEquationsの各スロット（式①・式②）について、正解として受け付ける標準形の
 * 候補一覧を作る。question.alternateEquationsに{index, internal}が登録されている場合、
 * そのindexのスロットへ「別解」として追加する（例：増減後の合計に着目した式に加えて、
 * 変化量に着目した式も正解にする）。
 * @returns {[Array, Array]} 添字0・1が、それぞれcanonicalEquations[0]・[1]の
 *   スロットに対応する候補標準形の配列
 */
function buildAcceptableExpressionsBySlot(question) {
  const acceptable = [
    [parseEquationToStandardForm(question.canonicalEquations[0].internal)],
    [parseEquationToStandardForm(question.canonicalEquations[1].internal)]
  ];

  if (Array.isArray(question.alternateEquations)) {
    for (const alternate of question.alternateEquations) {
      acceptable[alternate.index].push(parseEquationToStandardForm(alternate.internal));
    }
  }

  return acceptable;
}

/**
 * 標準形2本（a1x+b1y+c1=0, a2x+b2y+c2=0）を実際に解く。
 * 行列式が0（解なし・解が無数）の場合はnullを返す。
 * @returns {{x: number, y: number}|null}
 */
export function solveTwoVariableSystem(standard1, standard2, tolerance) {
  const a1 = standard1.xCoefficient;
  const b1 = standard1.yCoefficient;
  const e1 = -standard1.constant;
  const a2 = standard2.xCoefficient;
  const b2 = standard2.yCoefficient;
  const e2 = -standard2.constant;

  const determinant = a1 * b2 - a2 * b1;
  if (Math.abs(determinant) < tolerance) {
    return null;
  }

  const x = (e1 * b2 - e2 * b1) / determinant;
  const y = (a1 * e2 - a2 * e1) / determinant;

  return { x, y };
}

/**
 * 入力された連立方程式（式①・式②の文字列2本）を検証する。
 * @param {[string, string]} inputStrings
 * @param {{
 *   canonicalEquations: Array<{internal: string}>,
 *   expectedSolution: {x: number, y: number}
 * }} question
 * @returns {{
 *   status: "correct"|"incorrect"|"input-error",
 *   message: string,
 *   solvedValues: {x: number, y: number}|null,
 *   matchedOrder: [number, number]|null
 * }}
 */
export function validateSystemEquations(inputStrings, question) {
  const [input1, input2] = inputStrings;
  const tolerance = APP_CONFIG.numericTolerance;

  if (!input1 || input1.trim() === "" || !input2 || input2.trim() === "") {
    return buildResult("input-error", "式①・式②の両方に式を入力してください。");
  }

  let standard1;
  let standard2;
  try {
    standard1 = parseEquationToStandardForm(input1);
    standard2 = parseEquationToStandardForm(input2);
  } catch (error) {
    if (error instanceof EquationError) {
      return buildResult("input-error", error.message);
    }
    throw error;
  }

  if (
    classifyDegenerateEquation(standard1, tolerance) ||
    classifyDegenerateEquation(standard2, tolerance)
  ) {
    return buildResult(
      "incorrect",
      "その式では数量の関係を表せていません。文章題の内容を見直しましょう。"
    );
  }

  const acceptableExpressions = buildAcceptableExpressionsBySlot(question);

  const matchesInOrder =
    isProportionalToAnyOf(standard1, acceptableExpressions[0], tolerance) &&
    isProportionalToAnyOf(standard2, acceptableExpressions[1], tolerance);
  const matchesSwapped =
    isProportionalToAnyOf(standard1, acceptableExpressions[1], tolerance) &&
    isProportionalToAnyOf(standard2, acceptableExpressions[0], tolerance);

  if (!matchesInOrder && !matchesSwapped) {
    return buildResult(
      "incorrect",
      "文章題に示された数量関係と異なる式です。もう一度考えましょう。"
    );
  }

  const matchedOrder = matchesInOrder ? [0, 1] : [1, 0];

  // 追加チェック：模範関係と一致した式を実際に解いて、expectedSolutionと一致することを確認する
  const solved = solveTwoVariableSystem(standard1, standard2, tolerance);
  if (!solved) {
    return buildResult(
      "incorrect",
      "この連立方程式は解けません。もう一度考えましょう。"
    );
  }

  if (
    Math.abs(solved.x - question.expectedSolution.x) > tolerance ||
    Math.abs(solved.y - question.expectedSolution.y) > tolerance
  ) {
    return buildResult("incorrect", "もう一度考えよう");
  }

  return buildResult("correct", "正解です", {
    solvedValues: { x: solved.x, y: solved.y },
    matchedOrder
  });
}
