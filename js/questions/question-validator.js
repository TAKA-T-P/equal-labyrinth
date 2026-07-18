// 生成された問題データが正しいか検証するモジュール

import { validateEquation } from "../equation/equation-validator.js";
import { tokenize, TokenType } from "../equation/tokenizer.js";

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
  "hint",
  "explanation"
];

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
