// トレーニング「おてがる」の4択生成を、全問題テンプレートで大量テストするスクリプト（Node.js用）
//
// 使い方（equal-labyrinthフォルダで実行）：
//   node tools/check-easy-choices.mjs            … 各テンプレート30回（既定）
//   node tools/check-easy-choices.mjs 100        … 各テンプレート100回
//   node tools/check-easy-choices.mjs 30 --show  … 各テンプレートの4択の例を1つずつ表示
//
// 確認内容：4択を必ず作れるか（失敗率）／正解が1つ・誤答が3つか／誤答がすべて既存バリデーターで
// incorrectか（correct・input-errorが混ざらないか）／重複がないか／正解位置の偏り／
// 誤答パターン（distractorType）の内訳。問題があれば終了コード1で終わる。

import { getTemplatesForUnit, generateQuestionFromTemplate } from "../js/questions/question-manager.js";
import {
  buildEasyChoicesWithReport,
  validateEasyChoices
} from "../js/training/easy-choice-builder.js";
import { validateCurrentAnswer } from "../js/equation/answer-validator.js";
import { toValidatorInput } from "../js/training/distractor-validator.js";

const UNITS = ["linear", "simultaneous", "quadratic"];
const runs = Number(process.argv[2]) || 30;
const showExamples = process.argv.includes("--show");

let totalAttempts = 0;
let totalFailures = 0;
let totalProblems = 0;
const positionCounts = { A: 0, B: 0, C: 0, D: 0 };
const typeCounts = {};
const failingTemplates = [];

for (const unit of UNITS) {
  const seenTemplateKeys = new Map();
  for (const template of getTemplatesForUnit(unit)) {
    // 同じtemplateIdを持つ複数のテンプレート（rectangular-paperなど）を区別する
    const count = (seenTemplateKeys.get(template.templateId) || 0) + 1;
    seenTemplateKeys.set(template.templateId, count);
    const label = count > 1 ? `${template.templateId}#${count}` : template.templateId;

    let failures = 0;
    let shown = false;
    const reasons = new Set();

    for (let i = 0; i < runs; i += 1) {
      const question = generateQuestionFromTemplate(template, unit);
      const { result, reason } = buildEasyChoicesWithReport(question, unit);
      totalAttempts += 1;

      if (!result) {
        failures += 1;
        reasons.add(reason);
        continue;
      }

      const check = validateEasyChoices(question, unit, result.choices);
      if (!check.valid) {
        totalProblems += 1;
        console.error(`[NG] ${label}:`, check.errors);
      }

      // 既存バリデーターでの最終確認（正解はcorrect、誤答はincorrectのみ）
      result.choices.forEach((choice) => {
        const status = validateCurrentAnswer(unit, toValidatorInput(unit, choice.equations), question).status;
        const expected = choice.isCorrect ? "correct" : "incorrect";
        if (status !== expected) {
          totalProblems += 1;
          console.error(`[NG] ${label}: ${choice.equations.join(" , ")} → ${status}`);
        }
        if (!choice.isCorrect) {
          typeCounts[choice.distractorType] = (typeCounts[choice.distractorType] || 0) + 1;
        }
      });

      const correct = result.choices.find((choice) => choice.id === result.correctChoiceId);
      positionCounts[correct.label] += 1;

      if (showExamples && !shown) {
        shown = true;
        console.log(`\n■ ${unit} / ${label}`);
        console.log(`  ${question.prompt}`);
        result.choices.forEach((choice) => {
          const mark = choice.isCorrect ? "○" : " ";
          const type = choice.distractorType ? `  … ${choice.distractorType}` : "";
          console.log(`  ${mark} ${choice.label}  ${choice.equations.join("   ,   ")}${type}`);
        });
      }
    }

    totalFailures += failures;
    if (failures > 0) {
      failingTemplates.push({ unit, label, failures, reasons: [...reasons] });
    }
  }
}

console.log("\n========== 結果 ==========");
console.log(`試行回数：${totalAttempts}（各テンプレート${runs}回）`);
console.log(`生成失敗：${totalFailures}（${((totalFailures / totalAttempts) * 100).toFixed(2)}%）`);
console.log(`検証エラー：${totalProblems}`);
console.log("正解位置の分布：", positionCounts);
console.log("誤答パターンの内訳：", typeCounts);
if (failingTemplates.length > 0) {
  console.log("\n生成に失敗したテンプレート：");
  failingTemplates.forEach((entry) => {
    console.log(`  ${entry.unit} / ${entry.label}：${entry.failures}/${runs}回`, entry.reasons);
  });
}

if (totalFailures > 0 || totalProblems > 0) {
  process.exitCode = 1;
}
