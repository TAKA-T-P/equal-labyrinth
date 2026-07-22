// 例題確認（ヘルプメニュー）専用：各カテゴリの固定代表例題を解決・検証するモジュール。
// カテゴリ名・問題テンプレートは、通常出題（トレーニング・クエスト・段位認定）と
// 完全に同じデータ（categories.js・各テンプレートファイル）を再利用する。
// このファイルはデータの解決・検証だけを担当し、DOM操作は一切行わない（example-ui.jsの責務）。

import { SELECTABLE_UNIT_IDS } from "../config.js";
import { getCategoriesForUnit, getTemplatesForUnit } from "../questions/question-manager.js";
import { validateQuestion } from "../questions/question-validator.js";

// generateExample()が固定して返すべきフィールド（generate()と違い、
// 呼び出すたびに値が変わってはならない）。validateAllCategoryExamples()の
// 安定性チェックと、getExampleQuestionForCategory()の検証で共通して使う。
const STABLE_FIELDS = [
  "prompt",
  "variableDefinition",
  "variableDefinitions",
  "canonicalEquation",
  "canonicalEquations",
  "hint",
  "diagram"
];

function buildPlaceholderExample(unit, categoryId, category) {
  return {
    isPlaceholder: true,
    unit,
    categoryId,
    categoryName: category ? category.name : categoryId
  };
}

/**
 * 指定したカテゴリの固定代表例題を取得する。
 * カテゴリが存在しない・exampleTemplateId未設定・対応テンプレートが見つからない・
 * generateExample()が無い・生成結果がvalidateQuestion()を通らない、のいずれかに該当する
 * 場合は、コンソールへ警告を出したうえで「準備中」プレースホルダーを返す
 * （例題確認画面はここで処理を止めず、1カテゴリ分の表示だけを諦める）。
 * @param {string} unit
 * @param {string} categoryId
 * @returns {object} question、またはisPlaceholder:trueのプレースホルダー
 */
export function getExampleQuestionForCategory(unit, categoryId) {
  const category = getCategoriesForUnit(unit).find((c) => c.id === categoryId);

  if (!category) {
    console.warn(`例題確認：カテゴリが見つかりません（unit=${unit}, categoryId=${categoryId}）。`);
    return buildPlaceholderExample(unit, categoryId, null);
  }

  if (!category.exampleTemplateId) {
    console.warn(`カテゴリ「${category.name}」（${categoryId}）の代表例題を生成できませんでした。`);
    return buildPlaceholderExample(unit, categoryId, category);
  }

  const template = getTemplatesForUnit(unit).find(
    (t) => t.templateId === category.exampleTemplateId
  );

  if (!template || typeof template.generateExample !== "function" || template.categoryId !== categoryId) {
    console.warn(`カテゴリ「${category.name}」（${categoryId}）の代表例題を生成できませんでした。`);
    return buildPlaceholderExample(unit, categoryId, category);
  }

  let question;
  try {
    question = template.generateExample();
  } catch (error) {
    console.warn(`カテゴリ「${category.name}」（${categoryId}）の代表例題の生成に失敗しました。`, error);
    return buildPlaceholderExample(unit, categoryId, category);
  }

  const result = validateQuestion(question);
  if (!result.valid) {
    console.warn(`カテゴリ「${category.name}」（${categoryId}）の代表例題が検証に失敗しました：${result.reason}`);
    return buildPlaceholderExample(unit, categoryId, category);
  }

  return question;
}

/**
 * 問題データのvariableDefinition（1次・2次方程式）/variableDefinitions（連立方程式）という
 * 単元ごとのデータ構造差を吸収し、画面表示用に共通の配列形式へ変換する。
 * @param {object} question
 * @returns {{symbol: string, description: string}[]}
 */
export function normalizeVariableDefinitions(question) {
  if (question.variableDefinitions && typeof question.variableDefinitions === "object") {
    return Object.entries(question.variableDefinitions).map(([symbol, description]) => ({
      symbol,
      description
    }));
  }
  if (typeof question.variableDefinition === "string" && question.variableDefinition.trim() !== "") {
    return [{ symbol: "x", description: question.variableDefinition }];
  }
  return [];
}

/**
 * 収録されている代表例題（＝選択可能な全カテゴリ）の総数を、カテゴリデータから動的に計算する。
 * ハードコードされた件数（例："32"）は使わない。
 */
export function getTotalCategoryCount() {
  return SELECTABLE_UNIT_IDS.reduce(
    (total, unit) => total + getCategoriesForUnit(unit).length,
    0
  );
}

/**
 * 全カテゴリの代表例題が正しく用意されているかを検証する。
 * example-ui.jsの初期化時に一度だけ呼び出す想定。問題が見つかってもアプリ全体は止めず、
 * コンソールへ警告を出すだけにとどめる（個々のカテゴリの表示はgetExampleQuestionForCategory()側の
 * フォールバックに任せる）。
 * @returns {{ok: boolean, problems: string[]}}
 */
export function validateAllCategoryExamples() {
  const problems = [];

  SELECTABLE_UNIT_IDS.forEach((unit) => {
    const categories = getCategoriesForUnit(unit);
    const templates = getTemplatesForUnit(unit);
    const seenCategoryIds = new Set();

    categories.forEach((category) => {
      if (seenCategoryIds.has(category.id)) {
        problems.push(`カテゴリID「${category.id}」が単元「${unit}」内で重複しています。`);
      }
      seenCategoryIds.add(category.id);

      if (!category.exampleTemplateId) {
        problems.push(`カテゴリ「${category.name}」（${category.id}）にexampleTemplateIdがありません。`);
        return;
      }

      const template = templates.find((t) => t.templateId === category.exampleTemplateId);
      if (!template) {
        problems.push(
          `カテゴリ「${category.name}」（${category.id}）のexampleTemplateId` +
            `「${category.exampleTemplateId}」に対応するテンプレートが見つかりません。`
        );
        return;
      }

      if (template.categoryId !== category.id) {
        problems.push(
          `カテゴリ「${category.name}」（${category.id}）の代表テンプレートのcategoryIdが一致しません。`
        );
      }

      if (typeof template.generateExample !== "function") {
        problems.push(
          `カテゴリ「${category.name}」（${category.id}）のテンプレートにgenerateExample()がありません。`
        );
        return;
      }

      let first;
      try {
        first = template.generateExample();
        const second = template.generateExample();
        const stable = STABLE_FIELDS.every(
          (field) => JSON.stringify(first[field]) === JSON.stringify(second[field])
        );
        if (!stable) {
          problems.push(
            `カテゴリ「${category.name}」（${category.id}）のgenerateExample()が毎回同じ結果を返しません。`
          );
        }
      } catch (error) {
        problems.push(
          `カテゴリ「${category.name}」（${category.id}）のgenerateExample()が例外を投げました：${error.message}`
        );
        return;
      }

      const result = validateQuestion(first);
      if (!result.valid) {
        problems.push(
          `カテゴリ「${category.name}」（${category.id}）の代表例題が検証に失敗しました：${result.reason}`
        );
      }
    });
  });

  if (problems.length > 0) {
    console.warn("例題確認：代表例題の検証で問題が見つかりました。", problems);
  }

  return { ok: problems.length === 0, problems };
}
