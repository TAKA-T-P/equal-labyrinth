// 生成された問題データが正しいか検証するモジュール
// 単元による分岐は、このファイルの validateQuestion() の1か所へ集中させている。

import { validateEquation } from "../equation/equation-validator.js";
import {
  parseEquationToStandardForm,
  solveTwoVariableSystem
} from "../equation/system-equation-validator.js";
import {
  parseEquationToQuadraticStandardForm,
  solveQuadraticStandardForm
} from "../equation/quadratic-equation-validator.js";
import { tokenize, TokenType } from "../equation/tokenizer.js";
import { LINEAR_CATEGORIES } from "./linear/categories.js";
import { SIMULTANEOUS_CATEGORIES } from "./simultaneous/categories.js";
import { QUADRATIC_CATEGORIES } from "./quadratic/categories.js";
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

// キーボードに表示してよい記号（将来のy・x²も見据えて許可しておく）。
// "square"は、2次方程式専用の「□²」ボタン（かっこの中身をまとめて2乗する記号）。
// "÷"は後方互換のために残す（表示時にui.jsが"fraction"へ自動変換する）。
const ALLOWED_KEYPAD_SYMBOLS = new Set([
  "x",
  "y",
  "x²",
  "square",
  "+",
  "-",
  "×",
  "÷",
  "fraction",
  "(",
  ")",
  "="
]);

const NUMBER_TEXT_PATTERN = /^\d+(\.\d+)?$/;
// 「1/2」「x/10」のような単純な分数表記も、数字の選択肢カードとして許可する
// （動点カテゴリの三角形の面積の公式、利益と割引カテゴリのx/10などで使う）。
// 分子は数値のほか"x"・"y"も許可する。
const FRACTION_TEXT_PATTERN = /^([xy]|\d+)\/\d+$/;

/**
 * keypadNumbersに「1/2」のような分数表記のカードが含まれるかどうか。
 * このカード1つで割り算記号（/）自体を入力できるため、canonicalEquationに
 * 割り算が含まれていても、別途「fraction」ボタンを用意する必要がなくなる。
 */
function hasFractionKeypadNumber(keypadNumbers) {
  return keypadNumbers.some((value) => FRACTION_TEXT_PATTERN.test(String(value)));
}

function validateKeypadNumbers(keypadNumbers) {
  if (!Array.isArray(keypadNumbers) || keypadNumbers.length === 0) {
    return "keypadNumbersが1つ以上の配列ではありません。";
  }

  for (const value of keypadNumbers) {
    if (typeof value !== "string" || value.trim() === "") {
      return "keypadNumbersに空でない文字列以外の要素が含まれています。";
    }
    if (!NUMBER_TEXT_PATTERN.test(value) && !FRACTION_TEXT_PATTERN.test(value)) {
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
  // 「1/2」「x/10」のような分数カードは、ボタン1つで分子・分母どちらの数値も
  // 入力できたことになるため、両方の数値をカバー済みとして扱う
  // （分子が"x"のように数値でない場合は、そのぶんは単に無視される）。
  keypadNumbers.forEach((value) => {
    const fractionMatch = String(value).match(/^([xy]|\d+)\/(\d+)$/);
    if (fractionMatch) {
      keypadNumberSet.add(fractionMatch[1]);
      keypadNumberSet.add(fractionMatch[2]);
    }
  });

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
 * 数式文字列（内部表現）に割り算（/）が含まれるかどうかを判定する。
 * 解析できない場合は、別のチェックで検出されるためfalseを返す。
 */
function equationContainsDivision(equationString) {
  try {
    const tokens = tokenize(equationString);
    return tokens.some((token) => token.type === TokenType.DIVIDE);
  } catch (error) {
    return false;
  }
}

/**
 * alternateEquations（式①・式②のどちらかについて、別解として追加で正解にする式）を検証する。
 * 未設定（undefined）の場合は何も検証しない。各要素について、
 * keypadNumbersで入力できること・解析できること・もう一方のcanonicalEquationsと
 * 組み合わせてもexpectedSolutionへ解けることを確認する。
 */
function validateAlternateEquations(question) {
  if (question.alternateEquations === undefined) {
    return null;
  }
  if (!Array.isArray(question.alternateEquations)) {
    return "alternateEquationsが配列ではありません。";
  }

  const tolerance = APP_CONFIG.numericTolerance;

  for (const alternate of question.alternateEquations) {
    if (!alternate || typeof alternate !== "object") {
      return "alternateEquationsの要素がオブジェクトではありません。";
    }
    if (alternate.index !== 0 && alternate.index !== 1) {
      return "alternateEquationsのindexは0または1である必要があります。";
    }
    if (typeof alternate.internal !== "string" || alternate.internal.trim() === "") {
      return "alternateEquationsのinternalが空です。";
    }
    if (typeof alternate.display !== "string" || alternate.display.trim() === "") {
      return "alternateEquationsのdisplayが空です。";
    }

    const keypadCoverageReason = validateKeypadCoversEquation(
      alternate.internal,
      question.keypadNumbers
    );
    if (keypadCoverageReason) {
      return `alternateEquations: ${keypadCoverageReason}`;
    }

    let alternateStandard;
    try {
      alternateStandard = parseEquationToStandardForm(alternate.internal);
    } catch (error) {
      return `alternateEquationsのinternalを解析できません：${error.message}`;
    }

    const otherIndex = alternate.index === 0 ? 1 : 0;
    let otherStandard;
    try {
      otherStandard = parseEquationToStandardForm(question.canonicalEquations[otherIndex].internal);
    } catch (error) {
      // canonicalEquations自体の解析エラーは、呼び出し側の別のチェックで検出される
      continue;
    }

    const solved = solveTwoVariableSystem(alternateStandard, otherStandard, tolerance);
    if (!solved) {
      return "alternateEquationsが、もう一方のcanonicalEquationsと組み合わせても解けません（比例している可能性があります）。";
    }
    if (
      Math.abs(solved.x - question.expectedSolution.x) > tolerance ||
      Math.abs(solved.y - question.expectedSolution.y) > tolerance
    ) {
      return "alternateEquationsの解がexpectedSolutionと一致しません。";
    }
  }

  return null;
}

/**
 * ヒント使用時に追加する式パーツ1件を検証する。
 * 完成した方程式全体（＝を含むもの）は登録できない。
 * 分数型（type: "fraction"）の場合は、numerator・denominatorも検証する。
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

  if (part.type === "fraction") {
    if (typeof part.numerator !== "string" || part.numerator.trim() === "") {
      return "hintKeypadPartsの分数パーツにnumeratorが必要です。";
    }
    if (typeof part.denominator !== "string" || part.denominator.trim() === "") {
      return "hintKeypadPartsの分数パーツにdenominatorが必要です。";
    }
    if (!NUMBER_TEXT_PATTERN.test(part.denominator) || Number(part.denominator) === 0) {
      return "hintKeypadPartsの分数パーツのdenominatorは0でない数値である必要があります。";
    }
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
 * （中2「連立方程式」・中3「2次方程式」はunitフィールドで判別する）。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateQuestion(question) {
  if (question && question.unit === "simultaneous") {
    return validateSimultaneousQuestion(question);
  }
  if (question && question.unit === "quadratic") {
    return validateQuadraticQuestion(question);
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

  // canonicalEquationsに割り算（分数）が含まれる場合、分数ボタンをkeypadSymbolsに
  // 用意しておく必要がある（"fraction"のほか、後方互換の"÷"「/」も許可する。
  // 「1/2」のような分数カードがkeypadNumbersにあれば、それ自体で割り算を
  // 入力できるため例外とする）
  const needsFractionSymbol =
    question.canonicalEquations.some((equation) => equationContainsDivision(equation.internal)) &&
    !hasFractionKeypadNumber(question.keypadNumbers);
  if (needsFractionSymbol) {
    const hasFractionSymbol =
      question.keypadSymbols.includes("fraction") ||
      question.keypadSymbols.includes("÷") ||
      question.keypadSymbols.includes("/");
    if (!hasFractionSymbol) {
      return {
        valid: false,
        reason: "canonicalEquationsに割り算が含まれていますが、keypadSymbolsに分数ボタン（fraction）がありません。"
      };
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

  const alternateEquationsReason = validateAlternateEquations(question);
  if (alternateEquationsReason) {
    return { valid: false, reason: alternateEquationsReason };
  }

  return { valid: true };
}

// ============================================================
// 中3「2次方程式」の問題データ検証
// ============================================================

const QUADRATIC_REQUIRED_STRING_FIELDS = [
  "id",
  "templateId",
  "unit",
  "categoryId",
  "categoryName",
  "prompt",
  "variableDefinition",
  "solutionDisplay",
  "rankDifficulty",
  "hint",
  "explanation"
];

const QUADRATIC_CATEGORY_DIFFICULTY_BY_ID = new Map(
  QUADRATIC_CATEGORIES.map((category) => [category.id, category.difficulty])
);

const QUADRATIC_DIAGRAM_TYPES = new Set([
  "cross-road",
  "open-box-net",
  "open-box-net-rect",
  "moving-points-rectangle"
]);

/**
 * rankDifficultyが妥当な値であり、2次方程式のカテゴリ定義の難易度と一致することを確認する。
 */
function validateQuadraticRankDifficulty(question) {
  if (!VALID_RANK_DIFFICULTIES.has(question.rankDifficulty)) {
    return `rankDifficultyがNORMALまたはHARDではありません：${question.rankDifficulty}`;
  }

  const expectedDifficulty = QUADRATIC_CATEGORY_DIFFICULTY_BY_ID.get(question.categoryId);
  if (expectedDifficulty && expectedDifficulty !== question.rankDifficulty) {
    return (
      `rankDifficulty（${question.rankDifficulty}）が` +
      `カテゴリ定義の難易度（${expectedDifficulty}）と一致しません。`
    );
  }

  return null;
}

/**
 * 2次方程式用のkeypadSymbolsを検証する。x・square（□²）・＝がすべて必要になる点が、
 * 中1（xのみ必須）との違い。x²ボタンは「x」→「□²」で代用できるため必須にしない
 * （x²は非表示だがALLOWED_KEYPAD_SYMBOLSには残しており、指定しても許可はする）。
 */
function validateKeypadSymbolsForQuadratic(keypadSymbols) {
  if (!Array.isArray(keypadSymbols) || keypadSymbols.length === 0) {
    return "keypadSymbolsが1つ以上の配列ではありません。";
  }
  if (!keypadSymbols.includes("x")) {
    return "keypadSymbolsにxが含まれていません。";
  }
  if (!keypadSymbols.includes("square")) {
    return "keypadSymbolsにsquare（□²）が含まれていません。";
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
 * 図形問題のdiagramデータを検証する。null（図なし）は許可する。
 * 図の描画（SVG組み立て）自体はquadratic-diagram-renderer.jsの責務であり、
 * ここでは「必要なデータが揃っているか」だけを確認する。
 */
function validateDiagram(diagram) {
  if (diagram === null || diagram === undefined) {
    return null;
  }
  if (typeof diagram !== "object") {
    return "diagramはnullまたはオブジェクトである必要があります。";
  }
  if (!QUADRATIC_DIAGRAM_TYPES.has(diagram.type)) {
    return `diagram.typeが未対応です：${diagram.type}`;
  }
  if (typeof diagram.ariaLabel !== "string" || diagram.ariaLabel.trim() === "") {
    return "diagram.ariaLabelが空です。";
  }

  if (diagram.type === "cross-road") {
    if (typeof diagram.widthValue !== "number" || !Number.isFinite(diagram.widthValue)) {
      return "diagram.widthValueが数値ではありません。";
    }
    if (typeof diagram.heightValue !== "number" || !Number.isFinite(diagram.heightValue)) {
      return "diagram.heightValueが数値ではありません。";
    }
    if (typeof diagram.pathWidthSymbol !== "string" || diagram.pathWidthSymbol.trim() === "") {
      return "diagram.pathWidthSymbolが空です。";
    }
  } else if (diagram.type === "open-box-net") {
    if (typeof diagram.paperSideSymbol !== "string" || diagram.paperSideSymbol.trim() === "") {
      return "diagram.paperSideSymbolが空です。";
    }
    if (typeof diagram.cutSideValue !== "number" || !Number.isFinite(diagram.cutSideValue)) {
      return "diagram.cutSideValueが数値ではありません。";
    }
  } else if (diagram.type === "open-box-net-rect") {
    if (typeof diagram.paperHeightSymbol !== "string" || diagram.paperHeightSymbol.trim() === "") {
      return "diagram.paperHeightSymbolが空です。";
    }
    if (typeof diagram.widthDiffValue !== "number" || !Number.isFinite(diagram.widthDiffValue)) {
      return "diagram.widthDiffValueが数値ではありません。";
    }
    if (typeof diagram.cutSideValue !== "number" || !Number.isFinite(diagram.cutSideValue)) {
      return "diagram.cutSideValueが数値ではありません。";
    }
  } else if (diagram.type === "moving-points-rectangle") {
    if (typeof diagram.widthValue !== "number" || !Number.isFinite(diagram.widthValue)) {
      return "diagram.widthValueが数値ではありません。";
    }
    if (typeof diagram.heightValue !== "number" || !Number.isFinite(diagram.heightValue)) {
      return "diagram.heightValueが数値ではありません。";
    }
    if (diagram.pointQMovesToward !== "A" && diagram.pointQMovesToward !== "D") {
      return "diagram.pointQMovesTowardは\"A\"または\"D\"である必要があります。";
    }
    if (typeof diagram.pSpeedValue !== "number" || !Number.isFinite(diagram.pSpeedValue)) {
      return "diagram.pSpeedValueが数値ではありません。";
    }
    if (typeof diagram.qSpeedValue !== "number" || !Number.isFinite(diagram.qSpeedValue)) {
      return "diagram.qSpeedValueが数値ではありません。";
    }
  }

  return null;
}

/**
 * expectedRoots・validXValuesが、実際にcanonicalEquationを解いた結果と一致することを確認する。
 * 重解の場合はexpectedRootsに1回だけ登録されていることも確認する。
 */
function validateExpectedRootsAndValidXValues(question, standardForm) {
  if (!Array.isArray(question.expectedRoots) || question.expectedRoots.length === 0) {
    return "expectedRootsが1つ以上の配列ではありません。";
  }
  if (question.expectedRoots.length > 2) {
    return "expectedRootsは1つまたは2つの要素である必要があります。";
  }
  for (const root of question.expectedRoots) {
    if (typeof root !== "number" || !Number.isFinite(root)) {
      return "expectedRootsに数値以外の要素があります。";
    }
  }

  if (!Array.isArray(question.validXValues) || question.validXValues.length === 0) {
    return "validXValuesが1つ以上の配列ではありません。";
  }

  const tolerance = APP_CONFIG.numericTolerance;

  for (const validValue of question.validXValues) {
    const matches = question.expectedRoots.some(
      (root) => Math.abs(root - validValue) < tolerance
    );
    if (!matches) {
      return "validXValuesに、expectedRootsに含まれない値があります。";
    }
  }

  const computedRoots = solveQuadraticStandardForm(standardForm, tolerance);
  if (!computedRoots) {
    return "canonicalEquationが実数解を持ちません。";
  }
  if (computedRoots.length !== question.expectedRoots.length) {
    return (
      "expectedRootsの個数がcanonicalEquationの実際の解の個数と一致しません" +
      "（重解を2回登録していないか確認してください）。"
    );
  }

  const sortedExpected = [...question.expectedRoots].sort((a, b) => a - b);
  for (let i = 0; i < computedRoots.length; i += 1) {
    if (Math.abs(computedRoots[i] - sortedExpected[i]) > tolerance) {
      return "expectedRootsがcanonicalEquationの実際の解と一致しません。";
    }
  }

  return null;
}

/**
 * 中3「2次方程式」の問題データを検証する。
 * @param {object} question
 * @returns {{valid: boolean, reason?: string}}
 */
function validateQuadraticQuestion(question) {
  if (!question || typeof question !== "object") {
    return { valid: false, reason: "問題データがオブジェクトではありません。" };
  }

  for (const field of QUADRATIC_REQUIRED_STRING_FIELDS) {
    const value = question[field];
    if (typeof value !== "string" || value.trim() === "") {
      return { valid: false, reason: `必須項目「${field}」が空です。` };
    }
  }

  if (question.unit !== "quadratic") {
    return { valid: false, reason: `unitが"quadratic"ではありません：${question.unit}` };
  }

  if (
    !question.canonicalEquation ||
    typeof question.canonicalEquation.internal !== "string" ||
    question.canonicalEquation.internal.trim() === ""
  ) {
    return { valid: false, reason: "canonicalEquation.internalが空です。" };
  }
  if (
    typeof question.canonicalEquation.display !== "string" ||
    question.canonicalEquation.display.trim() === ""
  ) {
    return { valid: false, reason: "canonicalEquation.displayが空です。" };
  }

  const rankDifficultyReason = validateQuadraticRankDifficulty(question);
  if (rankDifficultyReason) {
    return { valid: false, reason: rankDifficultyReason };
  }

  const keypadNumbersReason = validateKeypadNumbers(question.keypadNumbers);
  if (keypadNumbersReason) {
    return { valid: false, reason: keypadNumbersReason };
  }

  const keypadSymbolsReason = validateKeypadSymbolsForQuadratic(question.keypadSymbols);
  if (keypadSymbolsReason) {
    return { valid: false, reason: keypadSymbolsReason };
  }

  const keypadCoverageReason = validateKeypadCoversEquation(
    question.canonicalEquation.internal,
    question.keypadNumbers
  );
  if (keypadCoverageReason) {
    return { valid: false, reason: keypadCoverageReason };
  }

  // canonicalEquationに割り算（分数）が含まれる場合、分数ボタンをkeypadSymbolsに
  // 用意しておく必要がある（「1/2」のような分数カードがkeypadNumbersにあれば、
  // それ自体で割り算を入力できるため例外とする）
  if (
    equationContainsDivision(question.canonicalEquation.internal) &&
    !hasFractionKeypadNumber(question.keypadNumbers)
  ) {
    const hasFractionSymbol =
      question.keypadSymbols.includes("fraction") ||
      question.keypadSymbols.includes("÷") ||
      question.keypadSymbols.includes("/");
    if (!hasFractionSymbol) {
      return {
        valid: false,
        reason: "canonicalEquationに割り算が含まれていますが、keypadSymbolsに分数ボタン（fraction）がありません。"
      };
    }
  }

  const hintKeypadPartsReason = validateHintKeypadParts(question.hintKeypadParts);
  if (hintKeypadPartsReason) {
    return { valid: false, reason: hintKeypadPartsReason };
  }

  const diagramReason = validateDiagram(question.diagram);
  if (diagramReason) {
    return { valid: false, reason: diagramReason };
  }

  let standardForm;
  try {
    standardForm = parseEquationToQuadraticStandardForm(question.canonicalEquation.internal);
  } catch (error) {
    return {
      valid: false,
      reason: `canonicalEquationを解析できません：${error.message}`
    };
  }

  // x²の係数が0の場合でも、xの係数が0でなければ許可する（「正方形を固定の長さだけ
  // 変形し、面積の増加量を問う」パターンなど、見かけは2次式でも整理するとx²が消えて
  // 1次方程式になる問題のため）。x²の係数もxの係数も0（恒等式・解なしの定数式）は、
  // 方程式として意味をなさないため引き続き拒否する。
  if (
    Math.abs(standardForm.xSquaredCoefficient) < APP_CONFIG.numericTolerance &&
    Math.abs(standardForm.xCoefficient) < APP_CONFIG.numericTolerance
  ) {
    return { valid: false, reason: "canonicalEquationのx²の係数もxの係数も0です（方程式になっていません）。" };
  }

  const rootsReason = validateExpectedRootsAndValidXValues(question, standardForm);
  if (rootsReason) {
    return { valid: false, reason: rootsReason };
  }

  return { valid: true };
}
