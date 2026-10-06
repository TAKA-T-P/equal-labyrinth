// トレーニング「おてがる」（4択）の選択肢を組み立てるモジュール
//
// 正解：現在の問題データに登録されている模範関係（canonicalEquation／canonicalEquations）
//       そのもの。おてがる専用の正解式は持たない。
// 誤答：distractor-generator.jsで多めに作った候補を、distractor-validator.jsで検証し、
//       ミスの系統（符号・数量の対応・数字・式の形）がなるべく重ならないよう3つ選ぶ。
// 4つを1回だけシャッフルし、A〜Dの位置に並べる（再描画のたびに作り直さない）。

import { getTemplatesForUnit } from "../questions/question-manager.js";
import {
  DISTRACTOR_TYPES,
  generateDistractorCandidates as generateAutoCandidates,
  normalizeTemplateCandidates,
  getCanonicalEquationStrings
} from "./distractor-generator.js";
import {
  filterValidDistractors as filterCandidates,
  validateEasyChoices,
  buildAllowedNumbers,
  getCorrectEquationKey,
  evaluateDistractorCandidate,
  toValidatorInput
} from "./distractor-validator.js";
import { validateCurrentAnswer } from "../equation/answer-validator.js";

export const EASY_CHOICE_LABELS = ["A", "B", "C", "D"];

// 1つ目・2つ目・3つ目の誤答を選ぶときに優先するミスの系統
const GROUP_PRIORITY = ["sign", "swap", "direction", "number", "structure", "template", "other"];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function typeInfo(type) {
  return DISTRACTOR_TYPES[type] || { group: "other", tier: 3 };
}

/**
 * 問題テンプレートに任意で用意された誤答候補を集める。
 * - 問題データのeasyDistractorCandidates（テンプレートのgenerate()が問題へ含めた配列）
 * - テンプレートのbuildEasyDistractors(question)（問題の数値に応じて作る関数）
 */
function collectTemplateCandidates(question, unit) {
  const raw = [];
  if (Array.isArray(question.easyDistractorCandidates)) {
    raw.push(...question.easyDistractorCandidates);
  }

  const template = getTemplatesForUnit(unit).find(
    (candidate) =>
      candidate.templateId === question.templateId &&
      typeof candidate.buildEasyDistractors === "function"
  );
  if (template) {
    try {
      const built = template.buildEasyDistractors(question);
      if (Array.isArray(built)) raw.push(...built);
    } catch (error) {
      console.warn(`テンプレート ${question.templateId} のbuildEasyDistractorsでエラーが発生しました。`, error);
    }
  }

  return normalizeTemplateCandidates(raw, unit);
}

/**
 * 誤答候補をすべて（自動生成＋テンプレート固有）集める。
 * 候補は3個ちょうどではなく、問題によっておおむね6〜20個程度になる。
 */
export function generateDistractorCandidates(question, unit) {
  return [...generateAutoCandidates(question, unit), ...collectTemplateCandidates(question, unit)];
}

/**
 * 既存バリデーターでincorrectになり、正解・他の候補と重複しない候補だけを残す。
 */
export function filterValidDistractors(question, unit, candidates) {
  const templateCandidates = candidates.filter((candidate) => candidate.distractorType === "template");
  return filterCandidates(question, unit, candidates, {
    allowedNumbers: buildAllowedNumbers(question, unit, templateCandidates),
    correctKey: getCorrectEquationKey(question, unit)
  });
}

/**
 * 有効な誤答候補から3つを選ぶ。品質の段階（tier）の順に使い切る：
 *   1＝自動生成した高品質候補 → 2＝テンプレート固有の候補 → 3・4＝その他の安全な共通変形
 * 各段階の中では、
 *   1周目：まだ使っていない系統（group）の候補を、GROUP_PRIORITYの順に1つずつ選ぶ
 *          （例：符号ミス・数量の対応ミス・式の形のミス）
 *   2周目：まだ使っていない種類（distractorType）の候補を選ぶ
 *   3周目：それでも足りなければ、その段階の残りから選ぶ
 * 同じ段階・系統の中では、毎回ランダムに選ぶ（同じ問題でも誤答の顔ぶれが変わる）。
 */
export function selectThreeDistractors(validCandidates) {
  const pool = shuffle(validCandidates);
  const selected = [];
  const usedGroups = new Set();
  const usedTypes = new Set();

  const take = (candidate) => {
    selected.push(candidate);
    usedGroups.add(typeInfo(candidate.distractorType).group);
    usedTypes.add(candidate.distractorType);
  };

  const tiers = [...new Set(pool.map((candidate) => typeInfo(candidate.distractorType).tier))].sort();
  for (const tier of tiers) {
    const inTier = () =>
      pool.filter(
        (candidate) =>
          !selected.includes(candidate) && typeInfo(candidate.distractorType).tier === tier
      );

    for (const group of GROUP_PRIORITY) {
      if (selected.length >= 3) break;
      if (usedGroups.has(group)) continue;
      const found = inTier().find(
        (candidate) => typeInfo(candidate.distractorType).group === group
      );
      if (found) take(found);
    }
    inTier().forEach((candidate) => {
      if (selected.length < 3 && !usedTypes.has(candidate.distractorType)) take(candidate);
    });
    inTier().forEach((candidate) => {
      if (selected.length < 3) take(candidate);
    });
    if (selected.length >= 3) break;
  }

  return selected;
}

/**
 * 正解1つ＋誤答3つをシャッフルし、表示位置の順にid（choice-a〜choice-d）を振る。
 */
export function shuffleChoices(correctEquations, distractors) {
  const entries = shuffle([
    { equations: [...correctEquations], isCorrect: true, distractorType: null },
    ...distractors.map((distractor) => ({
      equations: [...distractor.equations],
      isCorrect: false,
      distractorType: distractor.distractorType
    }))
  ]);

  return entries.map((entry, index) => ({
    id: `choice-${EASY_CHOICE_LABELS[index].toLowerCase()}`,
    label: EASY_CHOICE_LABELS[index],
    ...entry
  }));
}

/**
 * 4択の構築を試み、成功・失敗の理由をあわせて返す（テスト・デバッグ用の詳細版）。
 * @returns {{result: {choices: Array, correctChoiceId: string}|null, reason: string|null,
 *   candidateCount: number, validCount: number}}
 */
export function buildEasyChoicesWithReport(question, unit) {
  const report = (result, reason, candidateCount = 0, validCount = 0) => ({
    result,
    reason,
    candidateCount,
    validCount
  });

  let correctEquations;
  try {
    correctEquations = getCanonicalEquationStrings(question, unit);
  } catch (error) {
    return report(null, "模範式を取得できません。");
  }

  const correctStatus = validateCurrentAnswer(
    unit,
    toValidatorInput(unit, correctEquations),
    question
  ).status;
  if (correctStatus !== "correct") {
    return report(null, `模範式が既存バリデーターで${correctStatus}になります。`);
  }

  const candidates = generateDistractorCandidates(question, unit);
  const valid = filterValidDistractors(question, unit, candidates);
  const distractors = selectThreeDistractors(valid);
  if (distractors.length < 3) {
    return report(
      null,
      `誤答を3つそろえられません（候補${candidates.length}個／有効${valid.length}個）。`,
      candidates.length,
      valid.length
    );
  }

  const choices = shuffleChoices(correctEquations, distractors);
  const templateCandidates = candidates.filter((candidate) => candidate.distractorType === "template");
  const check = validateEasyChoices(question, unit, choices, {
    allowedNumbers: buildAllowedNumbers(question, unit, templateCandidates)
  });
  if (!check.valid) {
    return report(null, check.errors.join(" / "), candidates.length, valid.length);
  }

  const correctChoice = choices.find((choice) => choice.isCorrect);
  return report(
    { choices, correctChoiceId: correctChoice.id },
    null,
    candidates.length,
    valid.length
  );
}

/**
 * 問題データから、おてがる用の4択を構築する。問題を表示する前に1回だけ呼ぶ。
 * 3つの誤答をそろえられない・検証に失敗した場合は、不正確な4択を表示しないよう
 * nullを返す（呼び出し側でその問題をスキップする）。
 * @param {object} question
 * @param {string} unit
 * @returns {{choices: Array<{id: string, label: string, equations: string[],
 *   isCorrect: boolean, distractorType: string|null}>, correctChoiceId: string}|null}
 */
export function buildEasyChoices(question, unit) {
  const { result, reason } = buildEasyChoicesWithReport(question, unit);
  if (!result) {
    console.warn(
      `おてがるの4択を作れませんでした（${question && question.templateId}）：${reason}`
    );
  }
  return result;
}

export { validateEasyChoices, evaluateDistractorCandidate };
