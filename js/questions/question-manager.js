// 問題の選択と出題順を管理するモジュール

import { APP_CONFIG } from "../config.js";
import { LINEAR_CATEGORIES } from "./linear/categories.js";
import { linearQuestionTemplates } from "./linear/index.js";
import { validateQuestion } from "./question-validator.js";

// テンプレート生成に失敗し続けた場合の固定問題（フォールバック）
const FALLBACK_QUESTIONS = {
  "L1-01": {
    templateId: "L1-01-fallback",
    categoryId: "L1-01",
    categoryName: "個数・代金",
    prompt:
      "1個100円のりんごを何個か買い、箱代100円を別に払ったところ、" +
      "代金の合計が600円になりました。りんごの個数をx個として方程式を立てなさい。",
    variableDefinition: "りんごの個数",
    expectedX: 5,
    canonicalEquation: "100*x+100=600",
    displayEquation: "100x＋100＝600",
    solutionDisplay: "x＝5",
    keypadNumbers: ["100", "600"],
    keypadSymbols: ["x", "+", "="],
    hint: "りんごの代金は「1個100円×個数」で表せます。そこに箱代100円を足すと合計になります。",
    explanation: "りんごの代金と箱代を合わせた金額が、代金の合計と等しくなります。"
  },
  "L1-03": {
    templateId: "L1-03-fallback",
    categoryId: "L1-03",
    categoryName: "分配・過不足",
    prompt:
      "あめを何人かの子どもに配ります。1人5個ずつ配ると3個余り、1人7個ずつ配ると" +
      "9個足りません。子どもの人数をx人として方程式を立てなさい。",
    variableDefinition: "子どもの人数",
    expectedX: 6,
    canonicalEquation: "5*x+3=7*x-9",
    displayEquation: "5x＋3＝7x−9",
    solutionDisplay: "x＝6",
    keypadNumbers: ["5", "3", "7", "9"],
    keypadSymbols: ["x", "+", "-", "="],
    hint: "あめの個数は「1人5個×人数＋3個」でも、「1人7個×人数－9個」でも表せます。",
    explanation: "配り方が変わっても、あめの総数は変わらないことから方程式が立てられます。"
  },
  "L1-08": {
    templateId: "L1-08-fallback",
    categoryId: "L1-08",
    categoryName: "追いつき・出会い",
    prompt:
      "弟が分速60mで家を出発しました。その3分後に、兄が分速96mで同じ道を" +
      "追いかけました。兄が出発してから追いつくまでの時間をx分として方程式を立てなさい。",
    variableDefinition: "兄が出発してから追いつくまでの時間（分）",
    expectedX: 5,
    canonicalEquation: "60*(x+3)=96*x",
    displayEquation: "60(x＋3)＝96x",
    solutionDisplay: "x＝5",
    keypadNumbers: ["60", "3", "96"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hint: "弟が進んだ時間は、兄が出発してからの時間に3分を足した時間になります。",
    explanation: "追いついたとき、2人が進んだ道のりは等しくなります。"
  },
  "L1-10": {
    templateId: "L1-10-fallback",
    categoryId: "L1-10",
    categoryName: "2種類の品物と代金",
    prompt:
      "1個150円のりんごと1個80円のみかんを合わせて10個買うと、代金の合計が" +
      "1080円になりました。りんごの個数をx個として方程式を立てなさい。",
    variableDefinition: "りんごの個数",
    expectedX: 4,
    canonicalEquation: "150*x+80*(10-x)=1080",
    displayEquation: "150x＋80(10−x)＝1080",
    solutionDisplay: "x＝4",
    keypadNumbers: ["150", "80", "10", "1080"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hint: "りんごがx個なら、みかんは10－x個と表せます。",
    explanation: "りんごの代金とみかんの代金の合計が、全体の代金になります。"
  },
  "L1-11": {
    templateId: "L1-11-fallback",
    categoryId: "L1-11",
    categoryName: "大人・子どもの人数と料金",
    prompt:
      "水族館の入館料は、大人1人1500円、子ども1人700円です。大人と子どもを合わせて" +
      "10人が入館し、入館料の合計が10200円になりました。大人の人数をx人として方程式を立てなさい。",
    variableDefinition: "大人の人数",
    expectedX: 4,
    canonicalEquation: "1500*x+700*(10-x)=10200",
    displayEquation: "1500x＋700(10−x)＝10200",
    solutionDisplay: "x＝4",
    keypadNumbers: ["1500", "700", "10", "10200"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hint: "大人がx人なら、子どもは10－x人と表せます。",
    explanation: "大人の入館料と子どもの入館料の合計が、入館料の合計になります。"
  }
};

/**
 * 配列をシャッフルした新しい配列を返す（Fisher-Yates）。
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 選択されたカテゴリが有効か検証する。
 */
export function validateSelectedCategories(selectedCategoryIds) {
  if (!Array.isArray(selectedCategoryIds) || selectedCategoryIds.length === 0) {
    return { valid: false, reason: "出題するカテゴリを1つ以上選んでください。" };
  }

  const validIds = new Set(LINEAR_CATEGORIES.map((category) => category.id));
  const hasInvalidId = selectedCategoryIds.some((id) => !validIds.has(id));

  if (hasInvalidId) {
    return { valid: false, reason: "不明なカテゴリが含まれています。" };
  }

  return { valid: true };
}

function createFallbackQuestion(categoryId) {
  const base = FALLBACK_QUESTIONS[categoryId];
  return {
    ...base,
    id: `${base.templateId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

/**
 * canonicalEquationに含まれる数値を、重複なく抽出する。
 * keypadNumbers未設定時のフォールバックとしてのみ使用する。
 */
function extractNumbersFromEquation(equation) {
  const matches = equation.match(/\d+(?:\.\d+)?/g) ?? [];
  return [...new Set(matches)];
}

/**
 * keypadNumbersが未設定の問題データに対し、canonicalEquationから
 * 数値を自動抽出して補う。正式なテンプレートでは通常発生しない。
 */
function ensureKeypadNumbers(question) {
  if (Array.isArray(question.keypadNumbers) && question.keypadNumbers.length > 0) {
    return question;
  }

  console.warn(
    `問題 ${question.id} にkeypadNumbersが設定されていません。` +
      `canonicalEquationから数値を自動抽出しました。`
  );

  return {
    ...question,
    keypadNumbers: extractNumbersFromEquation(question.canonicalEquation)
  };
}

/**
 * テンプレートから、検証を通過した問題データを1つ生成する。
 * 最大試行回数を超えた場合は、固定問題へフォールバックする。
 */
export function generateQuestionFromTemplate(template) {
  for (let attempt = 0; attempt < APP_CONFIG.maxGenerationAttempts; attempt += 1) {
    let question;
    try {
      question = template.generate();
    } catch (error) {
      continue;
    }

    question = ensureKeypadNumbers(question);

    const result = validateQuestion(question);
    if (result.valid) {
      return question;
    }
  }

  return createFallbackQuestion(template.categoryId);
}

function pickNextTemplate(candidateTemplates, recentTemplateIds, recentCategoryIds) {
  const lastTemplateId = recentTemplateIds[recentTemplateIds.length - 1];
  const lastCategoryId = recentCategoryIds[recentCategoryIds.length - 1];

  const notSameTemplate = candidateTemplates.filter(
    (template) => template.templateId !== lastTemplateId
  );
  const pool = notSameTemplate.length > 0 ? notSameTemplate : candidateTemplates;

  const notSameCategory = pool.filter(
    (template) => template.categoryId !== lastCategoryId
  );
  const finalPool = notSameCategory.length > 0 ? notSameCategory : pool;

  const index = Math.floor(Math.random() * finalPool.length);
  return finalPool[index];
}

/**
 * 選択されたカテゴリから、出題する問題のキューを作成する。
 * @param {string[]} selectedCategoryIds
 * @param {number} totalQuestions
 */
export function buildQuestionQueue(selectedCategoryIds, totalQuestions) {
  const candidateTemplates = linearQuestionTemplates.filter((template) =>
    selectedCategoryIds.includes(template.categoryId)
  );

  if (candidateTemplates.length === 0) {
    throw new Error("選択されたカテゴリに問題テンプレートがありません。");
  }

  const queue = [];
  const recentTemplateIds = [];
  const recentCategoryIds = [];

  for (let i = 0; i < totalQuestions; i += 1) {
    const template = pickNextTemplate(
      candidateTemplates,
      recentTemplateIds,
      recentCategoryIds
    );

    const question = generateQuestionFromTemplate(template);
    queue.push(question);

    recentTemplateIds.push(template.templateId);
    recentCategoryIds.push(template.categoryId);
  }

  return queue;
}

/**
 * キューから指定した番号の問題を取得する。
 */
export function getNextQuestion(queue, index) {
  if (!Array.isArray(queue) || index < 0 || index >= queue.length) {
    return null;
  }
  return queue[index];
}
