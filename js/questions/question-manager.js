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
    rankDifficulty: "NORMAL",
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
    hintKeypadParts: [],
    hint: "りんごの代金は「1個100円×個数」で表せます。そこに箱代100円を足すと合計になります。",
    explanation: "りんごの代金と箱代を合わせた金額が、代金の合計と等しくなります。"
  },
  "L1-02": {
    templateId: "L1-02-fallback",
    categoryId: "L1-02",
    categoryName: "所持金・過不足",
    rankDifficulty: "HARD",
    prompt:
      "持っているお金でノートを買おうとしました。1冊100円のノートを買うと100円" +
      "余り、1冊150円のノートを買うと50円足りません。買おうとした冊数をx冊として" +
      "方程式を立てなさい。",
    variableDefinition: "買おうとした冊数",
    expectedX: 3,
    canonicalEquation: "100*x+100=150*x-50",
    displayEquation: "100x＋100＝150x−50",
    solutionDisplay: "x＝3",
    keypadNumbers: ["100", "150", "50"],
    keypadSymbols: ["x", "+", "-", "="],
    hintKeypadParts: [
      { display: "100x＋100", value: "100x+100", ariaLabel: "100xたす100" }
    ],
    hint: "持っているお金は「1冊100円×冊数＋100円」でも、「1冊150円×冊数－50円」でも表せます。",
    explanation: "どちらの買い方でも、もとの所持金は変わらないことから方程式が立てられます。"
  },
  "L1-03": {
    templateId: "L1-03-fallback",
    categoryId: "L1-03",
    categoryName: "分配・過不足",
    rankDifficulty: "NORMAL",
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
    hintKeypadParts: [
      { display: "5x＋3", value: "5x+3", ariaLabel: "5xたす3" }
    ],
    hint: "あめの個数は「1人5個×人数＋3個」でも、「1人7個×人数－9個」でも表せます。",
    explanation: "配り方が変わっても、あめの総数は変わらないことから方程式が立てられます。"
  },
  "L1-04": {
    templateId: "L1-04-fallback",
    categoryId: "L1-04",
    categoryName: "長いす・過不足",
    rankDifficulty: "HARD",
    prompt:
      "体育館で、生徒が長いすに座ります。1脚に5人ずつ座ると10人が座れず、" +
      "1脚に6人ずつ座ると、最後の1脚には2人だけ座りました。長いすの数をx脚として" +
      "方程式を立てなさい。",
    variableDefinition: "長いすの数",
    expectedX: 14,
    canonicalEquation: "5*x+10=6*(x-1)+2",
    displayEquation: "5x＋10＝6(x−1)＋2",
    solutionDisplay: "x＝14",
    keypadNumbers: ["5", "10", "6", "2"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x−1）", value: "(x-1)", ariaLabel: "xひく1" }
    ],
    hint: "1脚に6人ずつ座ったとき、最後の1脚をのぞいた長いすの数は「x－1」脚と表せます。",
    explanation: "座り方が変わっても、生徒の総数は変わらないことから方程式が立てられます。"
  },
  "L1-05": {
    templateId: "L1-05-fallback",
    categoryId: "L1-05",
    categoryName: "年齢",
    rankDifficulty: "NORMAL",
    prompt:
      "現在、父の年齢は息子の年齢の3倍です。6年後には、父の年齢が息子の年齢の" +
      "2倍になります。息子の現在の年齢をx歳として方程式を立てなさい。",
    variableDefinition: "息子の現在の年齢",
    expectedX: 6,
    canonicalEquation: "3*x+6=2*(x+6)",
    displayEquation: "3x＋6＝2(x＋6)",
    solutionDisplay: "x＝6",
    keypadNumbers: ["3", "6", "2"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋6）", value: "(x+6)", ariaLabel: "xたす6" }
    ],
    hint: "6年後の息子の年齢は「x＋6」歳と表せます。父の年齢も同じように6を足して表しましょう。",
    explanation: "6年後の父の年齢と、息子の年齢の2倍が等しくなります。"
  },
  "L1-06": {
    templateId: "L1-06-fallback",
    categoryId: "L1-06",
    categoryName: "整数",
    rankDifficulty: "HARD",
    prompt: "連続する3つの整数の和が72です。最も小さい整数をxとして方程式を立てなさい。",
    variableDefinition: "最も小さい整数",
    expectedX: 23,
    canonicalEquation: "x+(x+1)+(x+2)=72",
    displayEquation: "x＋(x＋1)＋(x＋2)＝72",
    solutionDisplay: "x＝23",
    keypadNumbers: ["1", "2", "72"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }
    ],
    hint: "連続する整数は、1ずつ大きくなります。真ん中の整数は「x＋1」と表せます。",
    explanation: "3つの整数を、すべてxを使って表してから足し合わせます。"
  },
  "L1-07": {
    templateId: "L1-07-fallback",
    categoryId: "L1-07",
    categoryName: "速さ・時間・道のり",
    rankDifficulty: "HARD",
    prompt:
      "家から図書館まで、毎分60mで歩くと、毎分80mで歩く場合より5分多くかかります。" +
      "毎分80mで歩くときにかかる時間をx分として方程式を立てなさい。",
    variableDefinition: "毎分80mで歩くときにかかる時間（分）",
    expectedX: 15,
    canonicalEquation: "60*(x+5)=80*x",
    displayEquation: "60(x＋5)＝80x",
    solutionDisplay: "x＝15",
    keypadNumbers: ["60", "80", "5"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋5）", value: "(x+5)", ariaLabel: "xたす5" }
    ],
    hint: "毎分60mで歩くときにかかる時間は、毎分80mで歩くときの時間より5分長いので「x＋5」と表せます。",
    explanation: "どちらの速さで歩いても、進む道のりは変わらないことから方程式が立てられます。"
  },
  "L1-08": {
    templateId: "L1-08-fallback",
    categoryId: "L1-08",
    categoryName: "追いつき・出会い",
    rankDifficulty: "NORMAL",
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
    hintKeypadParts: [
      { display: "（x＋3）", value: "(x+3)", ariaLabel: "xたす3" }
    ],
    hint: "弟が進んだ時間は、兄が出発してからの時間に3分を足した時間になります。",
    explanation: "追いついたとき、2人が進んだ道のりは等しくなります。"
  },
  "L1-09": {
    templateId: "L1-09-fallback",
    categoryId: "L1-09",
    categoryName: "割合・増減",
    rankDifficulty: "HARD",
    prompt: "ある品物を定価の20％引きで買うと2400円でした。定価をx円として方程式を立てなさい。",
    variableDefinition: "定価",
    expectedX: 3000,
    canonicalEquation: "0.8*x=2400",
    displayEquation: "0.8x＝2400",
    solutionDisplay: "x＝3000",
    keypadNumbers: ["0.8", "2400"],
    keypadSymbols: ["x", "="],
    hintKeypadParts: [],
    hint: "定価の20％引きは、定価の80÷100倍、つまり定価×0.8で表せます。",
    explanation: "割引後の値段は、定価に割引後の割合（小数）をかけた金額になります。"
  },
  "L1-10": {
    templateId: "L1-10-fallback",
    categoryId: "L1-10",
    categoryName: "2種類の品物と代金",
    rankDifficulty: "NORMAL",
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
    hintKeypadParts: [
      { display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }
    ],
    hint: "りんごがx個なら、みかんは10－x個と表せます。",
    explanation: "りんごの代金とみかんの代金の合計が、全体の代金になります。"
  },
  "L1-11": {
    templateId: "L1-11-fallback",
    categoryId: "L1-11",
    categoryName: "大人・子どもの人数と料金",
    rankDifficulty: "NORMAL",
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
    hintKeypadParts: [
      { display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }
    ],
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
 * hintKeypadPartsが未設定の問題データを、空配列（式パーツなし）として扱う。
 * 式パーツは学習内容に関わるため、自動生成は行わない。
 */
function ensureHintKeypadParts(question) {
  if (Array.isArray(question.hintKeypadParts)) {
    return question;
  }

  console.warn(
    `問題 ${question.id} にhintKeypadPartsが設定されていません。` +
      `式パーツなしのヒントとして処理します。`
  );

  return {
    ...question,
    hintKeypadParts: []
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
    question = ensureHintKeypadParts(question);

    const result = validateQuestion(question);
    if (result.valid) {
      return question;
    }
  }

  return createFallbackQuestion(template.categoryId);
}

/**
 * 出題対象のカテゴリ数をNとすると、直近N問の中で各カテゴリが必ず1回ずつ
 * 出題されるよう、「袋の中からカテゴリを引いて、空になったら詰め直す」方式
 * （バッグ方式）でカテゴリの偏りを防ぐ。
 * recentCategoryIdsを先頭から読み直すことで、現在の袋の残りを毎回導出する
 * （呼び出し側に袋の状態を持たせる必要をなくすための、あえての設計）。
 */
function pickNextCategoryFromBag(allCategoryIds, recentCategoryIds) {
  let remaining = new Set(allCategoryIds);

  recentCategoryIds.forEach((categoryId) => {
    if (!remaining.has(categoryId)) return;
    remaining.delete(categoryId);
    if (remaining.size === 0) {
      remaining = new Set(allCategoryIds);
    }
  });

  let pool = [...remaining];
  const lastCategoryId = recentCategoryIds[recentCategoryIds.length - 1];
  if (pool.length > 1) {
    const notSameCategory = pool.filter((id) => id !== lastCategoryId);
    if (notSameCategory.length > 0) {
      pool = notSameCategory;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickNextTemplate(candidateTemplates, recentTemplateIds, recentCategoryIds) {
  const allCategoryIds = [...new Set(candidateTemplates.map((t) => t.categoryId))];
  const categoryId = pickNextCategoryFromBag(allCategoryIds, recentCategoryIds);

  const templatesInCategory = candidateTemplates.filter(
    (template) => template.categoryId === categoryId
  );

  const lastTemplateId = recentTemplateIds[recentTemplateIds.length - 1];
  const notSameTemplate = templatesInCategory.filter(
    (template) => template.templateId !== lastTemplateId
  );
  const pool = notSameTemplate.length > 0 ? notSameTemplate : templatesInCategory;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
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

const CATEGORY_IDS_BY_DIFFICULTY = {
  NORMAL: LINEAR_CATEGORIES.filter((c) => c.difficulty === "NORMAL").map(
    (c) => c.id
  ),
  HARD: LINEAR_CATEGORIES.filter((c) => c.difficulty === "HARD").map(
    (c) => c.id
  )
};

/**
 * 指定した難易度（NORMAL・HARD）のカテゴリだけからテンプレート候補を絞り込む。
 */
function getTemplatesByDifficulty(difficulty) {
  const categoryIds = new Set(CATEGORY_IDS_BY_DIFFICULTY[difficulty] || []);
  return linearQuestionTemplates.filter((template) =>
    categoryIds.has(template.categoryId)
  );
}

/**
 * 段位認定モード用に、難易度に応じた問題を1問生成する。
 * 問題数の上限を設けない終了条件（120秒経過）のため、キューを事前構築せず
 * 1問ずつ呼び出す設計にしている。
 * @param {"NORMAL"|"HARD"} difficulty
 * @param {string[]} recentTemplateIds 直近に出題したtemplateIdの履歴
 * @param {string[]} recentCategoryIds 直近に出題したcategoryIdの履歴
 * @returns {{question: object, template: object}}
 */
export function getNextRankQuestion(difficulty, recentTemplateIds, recentCategoryIds) {
  const candidateTemplates = getTemplatesByDifficulty(difficulty);

  if (candidateTemplates.length === 0) {
    throw new Error(`難易度「${difficulty}」に対応する問題テンプレートがありません。`);
  }

  const template = pickNextTemplate(
    candidateTemplates,
    recentTemplateIds,
    recentCategoryIds
  );
  const question = generateQuestionFromTemplate(template);

  return { question, template };
}
