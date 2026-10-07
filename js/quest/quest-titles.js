// クエストモード：累計ゴールド（G）に応じた称号の定義と判定
// 称号名・必要Gはこの配列1か所だけで管理する（HTML・UIファイルへ二重登録しない）。
// 判定はすべてQUEST_TITLESから動的に行うため、称号名・必要Gの変更や、
// 21個目以降の称号の追加は、この配列を編集するだけでよい（minGoldの昇順に並べること）。

export const QUEST_TITLES = [
  { minGold: 0, title: "はじめての冒険者" },
  { minGold: 10000, title: "駆け出しトレジャーハンター" },
  { minGold: 20000, title: "財宝さがしの見習い" },
  { minGold: 35000, title: "迷宮の探索者" },
  { minGold: 50000, title: "宝箱ハンター" },
  { minGold: 70000, title: "お宝コレクター" },
  { minGold: 135000, title: "財宝の目利き" },
  { minGold: 200000, title: "腕利きトレジャーハンター" },
  { minGold: 265000, title: "迷宮の冒険家" },
  { minGold: 330000, title: "黄金を追う者" },
  { minGold: 395000, title: "一流トレジャーハンター" },
  { minGold: 460000, title: "財宝の達人" },
  { minGold: 525000, title: "黄金の冒険王" },
  { minGold: 590000, title: "迷宮の富豪" },
  { minGold: 655000, title: "伝説の財宝王" },
  { minGold: 720000, title: "伝説のトレジャーハンター" },
  { minGold: 790000, title: "ラビリンスマスター" },
  { minGold: 860000, title: "秘宝を極めし者" },
  { minGold: 930000, title: "イコール・レジェンド" },
  { minGold: 1000000, title: "イコール・ラビリンスの覇王" }
];

function normalizeGold(totalGold) {
  return Number.isFinite(totalGold) && totalGold > 0 ? Math.floor(totalGold) : 0;
}

/**
 * 累計Gで到達している中で、最も高い称号を返す。
 * @param {number} totalGold
 * @returns {{index: number, title: string, minGold: number}}
 *   indexは0始まり（QUEST_TITLESの添字。大きいほど上位）
 */
export function getQuestTitle(totalGold) {
  const gold = normalizeGold(totalGold);
  let index = 0;
  QUEST_TITLES.forEach((entry, i) => {
    if (gold >= entry.minGold) index = i;
  });
  return { index, title: QUEST_TITLES[index].title, minGold: QUEST_TITLES[index].minGold };
}

/**
 * 次の称号と、そこまでに必要な残りGを返す。最高称号に到達している場合はnull。
 * @returns {{index: number, title: string, requiredGold: number, remainingGold: number}|null}
 */
export function getNextQuestTitle(totalGold) {
  const gold = normalizeGold(totalGold);
  const current = getQuestTitle(gold);
  const next = QUEST_TITLES[current.index + 1];
  if (!next) return null;
  return {
    index: current.index + 1,
    title: next.title,
    requiredGold: next.minGold,
    remainingGold: Math.max(0, next.minGold - gold)
  };
}

/**
 * 現在の称号から次の称号までの進捗率（0〜100、整数）を返す。最高称号到達時は100。
 * 例：現在称号460,000G・次称号525,000G・累計487,350G → (27,350 / 65,000) → 42
 */
export function getQuestTitleProgressPercent(totalGold) {
  const gold = normalizeGold(totalGold);
  const current = getQuestTitle(gold);
  const next = getNextQuestTitle(gold);
  if (!next) return 100;
  const ratio = (gold - current.minGold) / (next.requiredGold - current.minGold);
  return Math.max(0, Math.min(100, Math.floor(ratio * 100)));
}

/**
 * 累計Gの変化で称号が上がったかを判定し、上がった場合は到達した一番高い称号を返す
 * （一度に複数の称号を飛び越えても、最終的に到達した称号だけを返す）。
 * @returns {{index: number, title: string, minGold: number}|null}
 */
export function getTitleRankUp(previousTotalGold, newTotalGold) {
  const oldTitle = getQuestTitle(previousTotalGold);
  const newTitle = getQuestTitle(newTotalGold);
  return newTitle.index > oldTitle.index ? newTitle : null;
}

/**
 * Gを3桁区切りで表示する（例：1000000 → "1,000,000G"）。
 */
export function formatGold(value) {
  return `${normalizeGold(value).toLocaleString("ja-JP")}G`;
}
