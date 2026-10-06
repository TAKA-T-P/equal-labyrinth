// トレーニング「おてがる」（4択）の誤答候補・完成した4択を検証するモジュール
//
// 誤答は「見た目が違うから不正解」とは判断しない。必ず既存の正誤判定
// validateCurrentAnswer() に通し、status === "incorrect" の候補だけを採用する
// （correct＝実は正解、input-error＝式として不自然、のどちらも採用しない）。
// そのうえで、恒等式・1次式に退化した2次方程式・正しい解をもつ連立方程式など、
// 判定上はincorrectでも「誤答として見せると紛らわしい式」もここで除外する。

import { UNIT_IDS, APP_CONFIG } from "../config.js";
import { validateCurrentAnswer } from "../equation/answer-validator.js";
import { tokenize, TokenType } from "../equation/tokenizer.js";
import { NodeType } from "../equation/parser.js";
import { astToLinearExpression, subtractExpressions } from "../equation/linear-expression.js";
import {
  parseEquationToStandardForm,
  areProportionalEquations,
  solveTwoVariableSystem
} from "../equation/system-equation-validator.js";
import {
  parseEquationToQuadraticStandardForm,
  solveQuadraticStandardForm
} from "../equation/quadratic-equation-validator.js";
import { isLinearOrConstantQuadraticExpression } from "../equation/quadratic-expression.js";
import {
  parseEquationAst,
  getCanonicalEquationStrings,
  collectQuestionNumbers,
  extractEquationNumbers,
  normalizeTemplateCandidates
} from "./distractor-generator.js";

const TOLERANCE = APP_CONFIG.numericTolerance;

function equationCountForUnit(unit) {
  return unit === UNIT_IDS.SIMULTANEOUS ? 2 : 1;
}

/**
 * 選択肢の式（配列）を、validateCurrentAnswer()が要求する形へ変換する
 * （1次・2次方程式は文字列1本、連立方程式は[式①, 式②]）。
 */
export function toValidatorInput(unit, equations) {
  return unit === UNIT_IDS.SIMULTANEOUS ? [equations[0], equations[1]] : equations[0];
}

function roundForKey(value) {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * 係数ベクトルを「絶対値が最大の成分が＋1」になるよう割って正規化した文字列にする
 * （定数倍の関係にある式どうしが、同じ文字列になる）。
 */
function normalizedVectorKey(components) {
  let refIndex = 0;
  components.forEach((value, index) => {
    if (Math.abs(value) > Math.abs(components[refIndex])) refIndex = index;
  });
  const ref = components[refIndex];
  if (Math.abs(ref) < TOLERANCE) return null;
  return components.map((value) => roundForKey(value / ref)).join(",");
}

function linearStandardForm(equationString) {
  const ast = parseEquationAst(equationString);
  if (!ast) return null;
  try {
    return subtractExpressions(astToLinearExpression(ast.left), astToLinearExpression(ast.right));
  } catch (error) {
    return null;
  }
}

function isBareVariableEqualsNumber(equationString) {
  const ast = parseEquationAst(equationString);
  if (!ast) return false;
  const isVariable = (node) => node.type === NodeType.VARIABLE;
  const isNumber = (node) => node.type === NodeType.NUMBER;
  return (
    (isVariable(ast.left) && isNumber(ast.right)) || (isNumber(ast.left) && isVariable(ast.right))
  );
}

/**
 * 式（1本または2本）を、数学的に同じ式どうしが同じ文字列になるよう正規化する。
 * - 1次方程式：整理するとax＋c＝0 になるので、解（x＝－c/a）で比較する
 *   （例：150x－150＝1800 と 150x＝1800＋150 は同じ式として扱う）
 * - 連立方程式：各式の係数比（定数倍は同じ）を、式の順番によらず比較する
 * - 2次方程式：ax²＋bx＋c＝0 の係数比で比較する
 * 解析できない・退化した式はnullを返す。
 */
export function normalizeEquationKey(unit, equations) {
  try {
    if (unit === UNIT_IDS.LINEAR) {
      const form = linearStandardForm(equations[0]);
      if (!form || Math.abs(form.xCoefficient) < TOLERANCE) return null;
      return `x=${roundForKey(-form.constant / form.xCoefficient)}`;
    }
    if (unit === UNIT_IDS.SIMULTANEOUS) {
      const keys = equations.map((equation) => {
        const form = parseEquationToStandardForm(equation);
        return normalizedVectorKey([form.xCoefficient, form.yCoefficient, form.constant]);
      });
      if (keys.some((key) => key === null)) return null;
      return keys.sort().join("|");
    }
    if (unit === UNIT_IDS.QUADRATIC) {
      const form = parseEquationToQuadraticStandardForm(equations[0]);
      return normalizedVectorKey([form.xSquaredCoefficient, form.xCoefficient, form.constant]);
    }
  } catch (error) {
    return null;
  }
  return null;
}

/**
 * 画面の数式表示（renderFormattedEquation）で、分数が上下型として正しく描画できる形か確認する。
 * 「÷」の前後が、数・文字・x²・かっこのまとまりになっていない式は表示が崩れるため不可とする。
 */
export function isDisplayableEquation(equationString) {
  let tokens;
  try {
    tokens = tokenize(equationString);
  } catch (error) {
    return false;
  }
  const atomEnd = new Set([TokenType.NUMBER, TokenType.VARIABLE, TokenType.POWER, TokenType.RPAREN]);
  const atomStart = new Set([TokenType.NUMBER, TokenType.VARIABLE, TokenType.POWER, TokenType.LPAREN]);
  return tokens.every((token, index) => {
    if (token.type !== TokenType.DIVIDE) return true;
    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    return Boolean(previous && next && atomEnd.has(previous.type) && atomStart.has(next.type));
  });
}

function extractNumbers(equationString) {
  return extractEquationNumbers(equationString);
}

/**
 * 式に使われている数が、すべて問題に登場する数（allowedNumbers）かどうか。
 */
export function usesOnlyAllowedNumbers(equations, allowedNumbers) {
  return equations.every((equation) =>
    extractNumbers(equation).every((value) =>
      allowedNumbers.some((allowed) => Math.abs(allowed - value) < TOLERANCE)
    )
  );
}

/**
 * 誤答に使ってよい数の一覧。問題データに登場する数に加えて、テンプレート作成者が
 * 手で用意したeasyDistractorCandidatesの数も許可する（作成者の責任で選んだ数のため）。
 */
export function buildAllowedNumbers(question, unit, templateCandidates = []) {
  const values = collectQuestionNumbers(question, unit);
  templateCandidates.forEach((candidate) => {
    candidate.equations.forEach((equation) => values.push(...extractNumbers(equation)));
  });
  return [...new Set(values)];
}

function runValidator(unit, equations, question) {
  try {
    return validateCurrentAnswer(unit, toValidatorInput(unit, equations), question).status;
  } catch (error) {
    return "input-error";
  }
}

/**
 * 判定上はincorrectでも、誤答として見せるには不適切な式を除外する（単元別）。
 * @returns {string|null} 不採用の理由（採用できる場合はnull）
 */
function findQualityProblem(question, unit, equations) {
  if (unit === UNIT_IDS.LINEAR) {
    const form = linearStandardForm(equations[0]);
    if (!form) return "1次式として整理できない";
    if (Math.abs(form.xCoefficient) < TOLERANCE) return "xが消えてしまう式";
    if (isBareVariableEqualsNumber(equations[0])) return "答えだけの式";
    return null;
  }

  if (unit === UNIT_IDS.SIMULTANEOUS) {
    let forms;
    try {
      forms = equations.map(parseEquationToStandardForm);
    } catch (error) {
      return "式として整理できない";
    }
    const isDegenerate = (form) =>
      Math.abs(form.xCoefficient) < TOLERANCE && Math.abs(form.yCoefficient) < TOLERANCE;
    if (forms.some(isDegenerate)) return "xもyも消えてしまう式";
    if (areProportionalEquations(forms[0], forms[1], TOLERANCE)) {
      return "式①と式②が同じ関係の定数倍";
    }
    const solved = solveTwoVariableSystem(forms[0], forms[1], TOLERANCE);
    if (
      solved &&
      question.expectedSolution &&
      Math.abs(solved.x - question.expectedSolution.x) < 1e-6 &&
      Math.abs(solved.y - question.expectedSolution.y) < 1e-6
    ) {
      return "解が正解と同じになる組（消去法などで導ける式）";
    }
    return null;
  }

  if (unit === UNIT_IDS.QUADRATIC) {
    let form;
    let canonicalForm;
    try {
      form = parseEquationToQuadraticStandardForm(equations[0]);
      canonicalForm = parseEquationToQuadraticStandardForm(question.canonicalEquation.internal);
    } catch (error) {
      return "2次式として整理できない";
    }
    if (
      !isLinearOrConstantQuadraticExpression(canonicalForm) &&
      isLinearOrConstantQuadraticExpression(form)
    ) {
      return "x²がなくなり1次式になる式";
    }
    const roots = solveQuadraticStandardForm(form, TOLERANCE);
    const validValues = Array.isArray(question.validXValues) ? question.validXValues : [];
    if (
      roots &&
      roots.some((root) => validValues.some((value) => Math.abs(root - value) < 1e-6))
    ) {
      return "正しい答えを解にもつ式";
    }
    return null;
  }

  return "未対応の単元";
}

/**
 * 誤答候補1つを検証する。
 * @param {object} question
 * @param {string} unit
 * @param {string[]} equations
 * @param {number[]} allowedNumbers
 * @returns {{accepted: boolean, reason: string|null, key: string|null, status: string}}
 */
export function evaluateDistractorCandidate(question, unit, equations, allowedNumbers) {
  const reject = (reason, status = "incorrect") => ({ accepted: false, reason, key: null, status });

  if (!Array.isArray(equations) || equations.length !== equationCountForUnit(unit)) {
    return reject("式の本数が単元と合わない", "input-error");
  }
  if (equations.some((equation) => typeof equation !== "string" || !parseEquationAst(equation))) {
    return reject("式として解析できない", "input-error");
  }
  if (!equations.every(isDisplayableEquation)) {
    return reject("分数を正しく表示できない形", "input-error");
  }
  if (!usesOnlyAllowedNumbers(equations, allowedNumbers)) {
    return reject("問題と無関係な数を含む");
  }

  const status = runValidator(unit, equations, question);
  if (status !== "incorrect") {
    return reject(status === "correct" ? "実は正解になる式" : "入力エラーになる式", status);
  }

  const problem = findQualityProblem(question, unit, equations);
  if (problem) return reject(problem);

  const key = normalizeEquationKey(unit, equations);
  if (!key) return reject("正規化できない式");

  return { accepted: true, reason: null, key, status };
}

/**
 * 誤答候補の一覧から、既存バリデーターでincorrectになり、正解とも他の候補とも
 * 重複しないものだけを残す（並び順は保つ）。
 * @param {Array<{equations: string[], distractorType: string}>} candidates
 * @param {{allowedNumbers: number[], correctKey: string}} options
 */
export function filterValidDistractors(question, unit, candidates, options) {
  const seenKeys = new Set([options.correctKey]);
  const seenTexts = new Set();
  const accepted = [];

  candidates.forEach((candidate) => {
    const textKey = [...candidate.equations].sort().join("|");
    if (seenTexts.has(textKey)) return;
    seenTexts.add(textKey);

    const result = evaluateDistractorCandidate(
      question,
      unit,
      candidate.equations,
      options.allowedNumbers
    );
    if (!result.accepted || seenKeys.has(result.key)) return;
    seenKeys.add(result.key);
    accepted.push({ ...candidate, normalizedKey: result.key });
  });

  return accepted;
}

/**
 * 完成した4択の品質を検証する（開発・テスト用。ゲーム中も表示前に必ず通す）。
 * @param {object} question
 * @param {string} unit
 * @param {Array<{id: string, equations: string[], isCorrect: boolean}>} choices
 * @param {{allowedNumbers?: number[]}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateEasyChoices(question, unit, choices, options = {}) {
  const errors = [];
  const allowedNumbers =
    options.allowedNumbers ||
    buildAllowedNumbers(
      question,
      unit,
      normalizeTemplateCandidates(question.easyDistractorCandidates, unit)
    );

  if (!Array.isArray(choices) || choices.length !== 4) {
    return { valid: false, errors: ["選択肢が4つではありません。"] };
  }

  const correctChoices = choices.filter((choice) => choice.isCorrect);
  if (correctChoices.length !== 1) errors.push("正解の選択肢がちょうど1つではありません。");
  if (choices.length - correctChoices.length !== 3) errors.push("誤答の選択肢が3つではありません。");

  const ids = new Set(choices.map((choice) => choice.id));
  if (ids.size !== 4) errors.push("選択肢のidが重複しています。");

  const keys = new Set();
  choices.forEach((choice, index) => {
    const label = `選択肢${index + 1}（${(choice.equations || []).join(" , ")}）`;
    if (!Array.isArray(choice.equations) || choice.equations.length !== equationCountForUnit(unit)) {
      errors.push(`${label}：式の本数が単元と合いません。`);
      return;
    }
    if (choice.equations.some((equation) => !parseEquationAst(equation))) {
      errors.push(`${label}：数式として解析できません。`);
      return;
    }
    if (!choice.equations.every(isDisplayableEquation)) {
      errors.push(`${label}：分数・x²を正しく表示できません。`);
    }
    if (!usesOnlyAllowedNumbers(choice.equations, allowedNumbers)) {
      errors.push(`${label}：問題と無関係な数を含みます。`);
    }

    const status = runValidator(unit, choice.equations, question);
    if (choice.isCorrect && status !== "correct") {
      errors.push(`${label}：正解のはずが既存バリデーターで${status}です。`);
    }
    if (!choice.isCorrect) {
      if (status !== "incorrect") {
        errors.push(`${label}：誤答のはずが既存バリデーターで${status}です。`);
      } else {
        const problem = findQualityProblem(question, unit, choice.equations);
        if (problem) errors.push(`${label}：${problem}。`);
      }
    }

    const key = normalizeEquationKey(unit, choice.equations);
    if (!key) {
      errors.push(`${label}：正規化できません。`);
    } else if (keys.has(key)) {
      errors.push(`${label}：他の選択肢と同じ式です。`);
    } else {
      keys.add(key);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * 正解の模範式から、重複判定用の正規化キーを作る（問題データの模範式そのもの）。
 */
export function getCorrectEquationKey(question, unit) {
  return normalizeEquationKey(unit, getCanonicalEquationStrings(question, unit));
}
