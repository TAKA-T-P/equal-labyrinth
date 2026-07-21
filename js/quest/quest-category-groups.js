// クエストモード：単元別カテゴリグループ
// NORMAL・HARD・全カテゴリは、各単元のcategories.jsに登録済みのdifficultyを
// そのまま利用する（同じ情報を二重管理しない）。commerce/integer/speedGeometry/
// percentageの4グループだけは、複数カテゴリを横断する新しい分類のため、
// カテゴリIDの一覧としてここで定義する。

import { UNIT_IDS } from "../config.js";
import { getCategoriesForUnit } from "../questions/question-manager.js";

// カテゴリ名の文字列比較ではなく、各単元のcategories.jsに実在するカテゴリIDで管理する。
const EXPLICIT_GROUP_CATEGORY_IDS = {
  commerce: {
    [UNIT_IDS.LINEAR]: ["L1-01", "L1-02", "L1-03", "L1-10", "L1-11"],
    [UNIT_IDS.SIMULTANEOUS]: ["L2-01", "L2-02", "L2-03", "L2-11"],
    [UNIT_IDS.QUADRATIC]: ["L3-08", "L3-09"]
  },
  integer: {
    [UNIT_IDS.LINEAR]: ["L1-06"],
    [UNIT_IDS.SIMULTANEOUS]: ["L2-04"],
    [UNIT_IDS.QUADRATIC]: ["L3-01", "L3-02"]
  },
  speedGeometry: {
    [UNIT_IDS.LINEAR]: ["L1-07", "L1-08"],
    [UNIT_IDS.SIMULTANEOUS]: ["L2-06", "L2-07", "L2-08"],
    [UNIT_IDS.QUADRATIC]: ["L3-03", "L3-04", "L3-05", "L3-06", "L3-07"]
  },
  percentage: {
    [UNIT_IDS.LINEAR]: ["L1-09"],
    [UNIT_IDS.SIMULTANEOUS]: ["L2-09", "L2-10", "L2-11"],
    [UNIT_IDS.QUADRATIC]: ["L3-09"]
  }
};

export const QUEST_CATEGORY_GROUP_IDS = [
  "normal",
  "hard",
  "all",
  "commerce",
  "integer",
  "speedGeometry",
  "percentage"
];

/**
 * 単元・カテゴリグループから、対象となる具体的カテゴリ一覧（{id, name, difficulty}）を返す。
 * 未対応のグループが渡された場合は、コンソールへ警告したうえで全カテゴリを返す
 * （出題自体は継続させ、アプリを止めないため）。
 * @param {string} unit
 * @param {string} groupId
 */
export function getCategoriesForGroup(unit, groupId) {
  const allCategories = getCategoriesForUnit(unit);

  if (groupId === "normal") {
    return allCategories.filter((category) => category.difficulty === "NORMAL");
  }
  if (groupId === "hard") {
    return allCategories.filter((category) => category.difficulty === "HARD");
  }
  if (groupId === "all") {
    return allCategories;
  }

  const idsByUnit = EXPLICIT_GROUP_CATEGORY_IDS[groupId];
  if (!idsByUnit) {
    console.warn(`未対応のカテゴリグループです：${groupId}`);
    return allCategories;
  }

  const ids = new Set(idsByUnit[unit] || []);
  const matched = allCategories.filter((category) => ids.has(category.id));

  if (matched.length === 0) {
    console.warn(`カテゴリグループ「${groupId}」（単元：${unit}）に該当するカテゴリがありません。`);
    return allCategories;
  }

  return matched;
}

/**
 * 部屋データが「？？？」表示になる（必要正解数3問以上の）部屋かどうかを判定する。
 * @param {number} requiredCorrect
 */
export function isHiddenCategoryMission(requiredCorrect) {
  return requiredCorrect >= 3;
}
