// 生成された問題データが正しいか検証するモジュール
// 単元による分岐は、このファイルの validateQuestion() の1か所へ集中させている。

import { validateEquation } from "../equation/equation-validator.js";
import {
  parseEquationToStandardForm,
  solveTwoVariableSystem
} from "../equation/system-equation-validator.js";
import { tokenize, TokenType } from "../equation/tokenizer.js";
import { LINEAR_CATEGORIES } from "./linear/categories.js";
import { SIMULTANEOUS_CATEGORIES } from "./simultaneous/categories.js";
import { APP_CONFIG } from "../config.js";

const REQUIRED_STRING_FIELDS = [
  "id",
  "templateId",
  "categoryId",
  "categoryName",
  "prompt",
  "variableDefinition",
  "canonicalEquation",
  "displayEquation",
  "solutionDisplay",
  "rankDifficulty",
  "hint",
  "explanation"
];

const VALID_RANK_DIFFICULTIES = new Set(["NORMAL", "HARD"]);
const CATEGORY_DIFFICULTY_BY_ID = new Map(
  LINEAR_CATEGORIES.map((category) => [category.id, category.difficulty])
);

/**
 * rankDifficultyが妥当な値であり、カテゴリ定義の難易度と一致することを確認する。
 */
function validateRankDifficulty(question) {
  if (!VALID_RANK_DIFFICULTIES.has(question.rankDifficulty)) {
    return `rankDifficultyがNORMALまたはHARDではありません：${question.rankDifficulty}`;
  }

  const expectedDifficulty = CATEGORY_DIFFICULTY_BY_ID.get(question.categoryId);
  if (expectedDifficulty && expectedDifficulty !== question.rankDifficulty) {
    return (
      `rankDifficulty（${question.rankDifficulty}）が` +
      `カテゴリ定義の難易度（${expectedDifficulty}）と一致しません。`
    );
  }

  return null;
}

// キーボードに表示してよい記号（将来のy・x²も見据えて許可しておく）
const ALLOWED_KEYPAD_SYMBOLS = new Set([
  "x",
  "y",
  "x²",
  "+",
  "-",
  "×",
  "÷",
  "(",
  ")",
  "="
]);

const NUMBER_TEXT_PATTERN = /^\d+(\.\d+)?$/;

function validateKeypadNumbers(keypadNumbers) {
  if (!Array.isArray(keypadNumbers) || keypadNumbers.length === 0) {
    return "keypadNumbersが1つ以上の配列ではありません。";
  }

  for (const value of keypadNumbers) {
    if (typeof value !== "string" || value.trim() === "") {
      return "keypadNumbersに空でない文字列以外の要素が含まれています。";
    }
    if (!NUMBER_TEXT_PATTERN.test(value)) {
      return `keypadNumbersに有効な数値表現ではない要素があります：${value}`;
    }
  }

  return null;
}

function validateKeypadSymbols(keypadSymbols) {
  if (!Array.isArray(keypadSymbols) || keypadSymbols.length === 0) {
    return "keypadSymbolsが1つ以上の配列ではありません。";
  }
  if (!keypadSymbols.includes("x")) {
    return "keypadSymbolsにxが含まれていません。";
  }
  if (!keypadSymbols.includes("=")) {
    return "keypadSymbolsに＝が含まれていません。";
  }
  for (const symbol of keypadSymbols) {
    if (!ALLOWED_KEYPAD_SYMBOLS.has(symbol)) {
      return `keypadSymbolsに許可されていない記号があります：${symbol}`;
    }
  }

  return null;
}

/**
 * canonicalEquationに登場する定数が、原則としてkeypadNumbersから
 * 入力できることを確認する。
 * 係数1・負号で作られる負の数・計算結果の数・数値の再利用は例外とする。
 */
function validateKeypadCoversEquation(canonicalEquation, keypadNumbers) {
  let tokens;
  try {
    tokens = tokenize(canonicalEquation);
  } catch (error) {
    // canonicalEquationの解析エラーは別のチェックで検出されるため、ここでは無視する
    return null;
  }

  const keypadNumberSet = new Set(keypadNumbers.map(String));

  for (const token of tokens) {
    if (token.type !== TokenType.NUMBER) continue;
    if (token.value === 1) continue; // 暗黙的な係数1は例外

    const text = String(token.value);
    if (!keypadNumberSet.has(text)) {
      return `canonicalEquationの数値「${text}」がkeypadNumbersから入力できません。`;
    }
  }

  return null;
}

/**
 * ヒント使用時に追加する式パーツ1件を検証する。
 * 完成した方程式全体（＝を含むもの）は登録できない。
 */
function validateHintKeypadPart(part) {
  if (!part || typeof part !== "object") {
    return "hintKeypadPartsの要素がオブジェクトではありません。";
  }
  if (typeof part.display !== "string" || part.display.trim() === "") {
    return "hintKeypadPartsのdisplayが空です。";
  }
  if (typeof part.value !== "string" || part.value.trim() === "") {
    return "hintKeypadPartsのvalueが空です。";
  }

  let tokens;
  try {
    tokens = tokenize(part.value);
  } catch (error) {
    return `hintKeypadPartsのvalueを解析できません：${error.message}`;
  }

  const hasEquals = tokens.some((token) => token.type === TokenType.EQUALS);
  if (hasEquals) {
    return "hintKeypadPartsのvalueに完成した方程式全体が登録されています。";
  }

  return null;
}

/**
 * hintKeypadParts配列全体を検証する。空配列は許可する。
 */
function validateHintKeypadParts(hintKeypadParts) {
  if (!Array.isArray(hintKeypadParts)) {
    return "hintKeypadPartsが配列ではありません。";
  }

  for (const part of hintKeypadParts) {
    const reason = validateHintKeypadPart(part);
    if (reason) return reason;
  }

  return null;
}

/**
 * 生成された問題データを検証する。単元に応じて検証内容を振り分ける
 * （中2「連立方程式」はunit === "simultaneous"で判別する）。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateQuestion(question) {
  if (question && question.unit === "simultaneous") {
    return validateSimultaneousQuestion(question);
  }
  return validateLinearQuestion(question);
}

/**
 * 中1「1次方程式」の問題データを検証する。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
function validateLinearQuestion(question) {
  if (!question || typeof question !== "object") {
    return { valid: false, reason: "問題データがオブジェクトではありません。" };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = question[field];
    if (typeof value !== "string" || value.trim() === "") {
      return { valid: false, reason: `必須項目「${field}」が空です。` };
    }
  }

  if (
    typeof question.expectedX !== "number" ||
    !Number.isFinite(question.expectedX)
  ) {
    return { valid: false, reason: "expectedXが有限の数値ではありません。" };
  }

  if (question.expectedX <= 0 || !Number.isInteger(question.expectedX)) {
    return {
      valid: false,
      reason: "expectedXが正の整数ではありません。"
    };
  }

  const rankDifficultyReason = validateRankDifficulty(question);
  if (rankDifficultyReason) {
    return { valid: false, reason: rankDifficultyReason };
  }

  const keypadNumbersReason = validateKeypadNumbers(question.keypadNumbers);
  if (keypadNumbersReason) {
    return { valid: false, reason: keypadNumbersReason };
  }

  const keypadSymbolsReason = validateKeypadSymbols(question.keypadSymbols);
  if (keypadSymbolsReason) {
    return { valid: false, reason: keypadSymbolsReason };
  }

  const keypadCoverageReason = validateKeypadCoversEquation(
    question.canonicalEquation,
    question.keypadNumbers
  );
  if (keypadCoverageReason) {
    return { valid: false, reason: keypadCoverageReason };
  }

  const hintKeypadPartsReason = validateHintKeypadParts(question.hintKeypadParts);
  if (hintKeypadPartsReason) {
    return { valid: false, reason: hintKeypadPartsReason };
  }

  let result;
  try {
    result = validateEquation(question.canonicalEquation, question.expectedX);
  } catch (error) {
    return {
      valid: false,
      reason: `canonicalEquationを解析できません：${error.message}`
    };
  }

  if (result.status !== "correct") {
    return {
      valid: false,
      reason: "canonicalEquationの解がexpectedXと一致しません。"
    };
  }

  return { valid: true };
}

// ============================================================
// 中2「連立方程式」の問題データ検証
// ============================================================

const SIMULTANEOUS_REQUIRED_STRING_FIELDS = [
  "id",
  "templateId",
  "unit",
  "categoryId",
  "categoryName",
  "prompt",
  "solutionDisplay",
  "rankDifficulty",
  "hint",
  "explanation"
];

const SIMULTANEOUS_CATEGORY_DIFFICULTY_BY_ID = new Map(
  SIMULTANEOUS_CATEGORIES.map((category) => [category.id, category.difficulty])
);

/**
 * rankDifficultyが妥当な値であり、連立方程式のカテゴリ定義の難易度と一致することを確認する。
 */
function validateSimultaneousRankDifficulty(question) {
  if (!VALID_RANK_DIFFICULTIES.has(question.rankDifficulty)) {
    return `rankDifficultyがNORMALまたはHARDではありません：${question.rankDifficulty}`;
  }

  const expectedDifficulty = SIMULTANEOUS_CATEGORY_DIFFICULTY_BY_ID.get(question.categoryId);
  if (expectedDifficulty && expectedDifficulty !== question.rankDifficulty) {
    return (
      `rankDifficulty（${question.rankDifficulty}）が` +
      `カテゴリ定義の難易度（${expectedDifficulty}）と一致しません。`
    );
  }

  return null;
}

/**
 * 連立方程式用のkeypadSymbolsを検証する。x・y・＝がすべて必要になる点が、
 * 中1（xのみ必須）との違い。
 */
function validateKeypadSymbolsForSystem(keypadSymbols) {
  if (!Array.isArray(keypadSymbols) || keypadSymbols.length === 0) {
    return "keypadSymbolsが1つ以上の配列ではありません。";
  }
  if (!keypadSymbols.includes("x")) {
    return "keypadSymbolsにxが含まれていません。";
  }
  if (!keypadSymbols.includes("y")) {
    return "keypadSymbolsにyが含まれていません。";
  }
  if (!keypadSymbols.includes("=")) {
    return "keypadSymbolsに＝が含まれていません。";
  }
  for (const symbol of keypadSymbols) {
    if (!ALLOWED_KEYPAD_SYMBOLS.has(symbol)) {
      return `keypadSymbolsに許可されていない記号があります：${symbol}`;
    }
  }

  return null;
}

/**
 * 中2「連立方程式」の問題データを検証する。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
function validateSimultaneousQuestion(question) {
  if (!question || typeof question !== "object") {
    return { valid: false, reason: "問題データがオブジェクトではありません。" };
  }

  for (const field of SIMULTANEOUS_REQUIRED_STRING_FIELDS) {
    const value = question[field];
    if (typeof value !== "string" || value.trim() === "") {
      return { valid: false, reason: `必須項目「${field}」が空です。` };
    }
  }

  if (question.unit !== "simultaneous") {
    return { valid: false, reason: `unitが"simultaneous"ではありません：${question.unit}` };
  }

  if (
    !question.variableDefinitions ||
    typeof question.variableDefinitions.x !== "string" ||
    question.variableDefinitions.x.trim() === ""
  ) {
    return { valid: false, reason: "variableDefinitions.xが空です。" };
  }
  if (
    typeof question.variableDefinitions.y !== "string" ||
    question.variableDefinitions.y.trim() === ""
  ) {
    return { valid: false, reason: "variableDefinitions.yが空です。" };
  }

  if (
    !question.expectedSolution ||
    typeof question.expectedSolution.x !== "number" ||
    !Number.isFinite(question.expectedSolution.x)
  ) {
    return { valid: false, reason: "expectedSolution.xが有限の数値ではありません。" };
  }
  if (
    typeof question.expectedSolution.y !== "number" ||
    !Number.isFinite(question.expectedSolution.y)
  ) {
    return { valid: false, reason: "expectedSolution.yが有限の数値ではありません。" };
  }

  if (!Array.isArray(question.canonicalEquations) || question.canonicalEquations.length !== 2) {
    return { valid: false, reason: "canonicalEquationsは2つの要素を持つ配列である必要があります。" };
  }
  for (const equation of question.canonicalEquations) {
    if (!equation || typeof equation.internal !== "string" || equation.internal.trim() === "") {
      return { valid: false, reason: "canonicalEquationsの各要素にinternalが必要です。" };
    }
    if (typeof equation.display !== "string" || equation.display.trim() === "") {
      return { valid: false, reason: "canonicalEquationsの各要素にdisplayが必要です。" };
    }
  }

  const rankDifficultyReason = validateSimultaneousRankDifficulty(question);
  if (rankDifficultyReason) {
    return { valid: false, reason: rankDifficultyReason };
  }

  const keypadNumbersReason = validateKeypadNumbers(question.keypadNumbers);
  if (keypadNumbersReason) {
    return { valid: false, reason: keypadNumbersReason };
  }

  const keypadSymbolsReason = validateKeypadSymbolsForSystem(question.keypadSymbols);
  if (keypadSymbolsReason) {
    return { valid: false, reason: keypadSymbolsReason };
  }

  for (const equation of question.canonicalEquations) {
    const keypadCoverageReason = validateKeypadCoversEquation(
      equation.internal,
      question.keypadNumbers
    );
    if (keypadCoverageReason) {
      return { valid: false, reason: keypadCoverageReason };
    }
  }

  const hintKeypadPartsReason = validateHintKeypadParts(question.hintKeypadParts);
  if (hintKeypadPartsReason) {
    return { valid: false, reason: hintKeypadPartsReason };
  }

  let standard1;
  let standard2;
  try {
    standard1 = parseEquationToStandardForm(question.canonicalEquations[0].internal);
    standard2 = parseEquationToStandardForm(question.canonicalEquations[1].internal);
  } catch (error) {
    return {
      valid: false,
      reason: `canonicalEquationsを解析できません：${error.message}`
    };
  }

  const tolerance = APP_CONFIG.numericTolerance;
  const solved = solveTwoVariableSystem(standard1, standard2, tolerance);
  if (!solved) {
    return {
      valid: false,
      reason: "canonicalEquationsの2本が独立していません（解が定まりません）。"
    };
  }

  if (
    Math.abs(solved.x - question.expectedSolution.x) > tolerance ||
    Math.abs(solved.y - question.expectedSolution.y) > tolerance
  ) {
    return {
      valid: false,
      reason: "canonicalEquationsの解がexpectedSolutionと一致しません。"
    };
  }

  return { valid: true };
}
