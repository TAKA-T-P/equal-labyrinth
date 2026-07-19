// 生成された問題データが正しいか検証するモジュール

import { validateEquation } from "../equation/equation-validator.js";
import { tokenize, TokenType } from "../equation/tokenizer.js";
import { LINEAR_CATEGORIES } from "./linear/categories.js";

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
 * 生成された問題データを検証する。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateQuestion(question) {
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
