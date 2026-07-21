// クエストモード：部屋ごとの具体的カテゴリ選出
// 既存の問題テンプレート・問題生成処理（question-manager.js）はそのまま利用し、
// ここでは「どのカテゴリ・どのテンプレートを選ぶか」の選出ロジックだけを担当する。

import { getTemplatesForUnit } from "../questions/question-manager.js";
import { getCategoriesForGroup } from "./quest-category-groups.js";

/**
 * カテゴリグループから、具体的カテゴリを1つ選ぶ。
 * excludeCategoryIdsに含まれるカテゴリは、可能な限り避ける
 * （候補が0件になる場合だけ重複を許可し、コンソールへ警告する）。
 * @param {string} unit
 * @param {string} groupId
 * @param {string[]} excludeCategoryIds
 */
export function pickCategoryFromGroup(unit, groupId, excludeCategoryIds = []) {
  const categories = getCategoriesForGroup(unit, groupId);
  const excludeSet = new Set(excludeCategoryIds);
  let candidates = categories.filter((category) => !excludeSet.has(category.id));

  if (candidates.length === 0) {
    console.warn(
      `カテゴリグループ「${groupId}」（単元：${unit}）で、除外条件を満たすカテゴリがありません。重複を許可します。`
    );
    candidates = categories;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index].id;
}

/**
 * 必要正解数3問以上の部屋向けに、部屋開始時点でカテゴリ列を確定させる。
 * 可能な限り部屋内でカテゴリを重複させず、直前の問題とも重複させない。
 * カテゴリ数が必要正解数より少ない場合だけ、袋を詰め直して重複を許可する。
 * @param {string} unit
 * @param {string} groupId
 * @param {number} count 必要正解数
 * @returns {string[]} 長さcountのカテゴリID列
 */
export function buildCategorySequence(unit, groupId, count) {
  const categories = getCategoriesForGroup(unit, groupId);
  const allIds = categories.map((category) => category.id);

  const sequence = [];
  let pool = [...allIds];

  for (let i = 0; i < count; i += 1) {
    if (pool.length === 0) {
      pool = [...allIds];
    }

    const lastCategoryId = sequence[sequence.length - 1];
    const candidates = pool.filter((id) => id !== lastCategoryId);
    const finalCandidates = candidates.length > 0 ? candidates : pool;

    const index = Math.floor(Math.random() * finalCandidates.length);
    const picked = finalCandidates[index];

    sequence.push(picked);
    pool = pool.filter((id) => id !== picked);
  }

  return sequence;
}

/**
 * 部屋選択画面に並ぶ2部屋について、必要正解数が1〜2問の部屋どうしで
 * 具体的カテゴリが重ならないように、2部屋分のカテゴリをまとめて選ぶ。
 * 必要正解数3問以上の部屋（「？？？」表示）は、この重複防止の対象外として
 * 個別にnullを渡す（呼び出し側でカテゴリ列を別途作成する）。
 * @param {string} unit
 * @param {{groupId: string|null}} roomAInfo
 * @param {{groupId: string|null}} roomBInfo
 * @returns {[string|null, string|null]}
 */
export function pickCategoriesForRoomChoices(unit, roomAInfo, roomBInfo) {
  const categoryIdA = roomAInfo.groupId
    ? pickCategoryFromGroup(unit, roomAInfo.groupId)
    : null;

  const categoryIdB = roomBInfo.groupId
    ? pickCategoryFromGroup(unit, roomBInfo.groupId, categoryIdA ? [categoryIdA] : [])
    : null;

  return [categoryIdA, categoryIdB];
}

/**
 * カテゴリから、出題する問題テンプレートを1つ選ぶ。
 * excludeTemplateIdに指定したテンプレートは、可能な限り連続出題しない。
 * @param {string} unit
 * @param {string} categoryId
 * @param {string|null} excludeTemplateId
 */
export function pickTemplateForCategory(unit, categoryId, excludeTemplateId = null) {
  const templatesInCategory = getTemplatesForUnit(unit).filter(
    (template) => template.categoryId === categoryId
  );

  if (templatesInCategory.length === 0) {
    throw new Error(`カテゴリ「${categoryId}」（単元：${unit}）に対応する問題テンプレートがありません。`);
  }

  const candidates = templatesInCategory.filter(
    (template) => template.templateId !== excludeTemplateId
  );
  const pool = candidates.length > 0 ? candidates : templatesInCategory;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
