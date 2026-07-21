// クエストモード専用のDOM操作を担当するモジュール
// ui.jsと同じ方針：ゲームルール・ルート分岐・演出タイミングの判断はここに書かず、
// quest-mode.js（進行管理）・quest-effects.js（演出のタイミング）から渡された値を
// 表示するだけにする。カテゴリ名の解決（IDから日本語名へ）もquest-mode.js側で行い、
// ここへは表示用の文字列として渡す。

const elements = {
  screen: document.getElementById("screen-quest"),

  map: document.getElementById("quest-map"),

  views: {
    opening: document.getElementById("quest-view-opening"),
    "room-select": document.getElementById("quest-view-room-select"),
    "enemy-intro": document.getElementById("quest-view-enemy-intro"),
    victory: document.getElementById("quest-view-victory"),
    treasure: document.getElementById("quest-view-treasure"),
    "item-get": document.getElementById("quest-view-item-get"),
    failure: document.getElementById("quest-view-failure"),
    summary: document.getElementById("quest-view-summary")
  },

  openingLines: document.getElementById("quest-opening-lines"),
  openingRoomChoices: document.getElementById("quest-opening-room-choices"),

  roomSelectChoices: document.getElementById("quest-room-select-choices"),

  enemyIntroRoomName: document.getElementById("quest-enemy-intro-room-name"),
  enemyIntroEmoji: document.getElementById("quest-enemy-intro-emoji"),
  enemyIntroMessage: document.getElementById("quest-enemy-intro-message"),
  enemyIntroMission: document.getElementById("quest-enemy-intro-mission"),
  fightButton: document.getElementById("quest-fight-button"),
  introRetireButton: document.getElementById("quest-intro-retire-button"),

  victoryEmoji: document.getElementById("quest-victory-emoji"),
  victoryMessage: document.getElementById("quest-victory-message"),

  treasureChest: document.getElementById("quest-treasure-chest"),
  openChestButton: document.getElementById("quest-open-chest-button"),

  itemGetEmoji: document.getElementById("quest-item-get-emoji"),
  itemGetName: document.getElementById("quest-item-get-name"),
  itemGetCount: document.getElementById("quest-item-get-count"),
  itemGetNextButton: document.getElementById("quest-item-get-next-button"),

  failureMessage: document.getElementById("quest-failure-message"),
  failureNextButton: document.getElementById("quest-failure-next-button"),

  summaryHeading: document.getElementById("quest-summary-heading"),
  summaryMessage: document.getElementById("quest-summary-message"),
  summaryEnemies: document.getElementById("quest-summary-enemies"),
  summaryItems: document.getElementById("quest-summary-items"),
  summaryRoute: document.getElementById("quest-summary-route"),
  summaryCorrect: document.getElementById("quest-summary-correct"),
  summaryIncorrect: document.getElementById("quest-summary-incorrect"),
  summaryHints: document.getElementById("quest-summary-hints"),
  summaryRooms: document.getElementById("quest-summary-rooms"),
  summaryUnit: document.getElementById("quest-summary-unit"),
  summaryToTitleButton: document.getElementById("quest-summary-to-title-button"),

  retireBackdrop: document.getElementById("quest-retire-backdrop"),
  retireConfirmPanel: document.getElementById("quest-retire-confirm-panel"),
  retireConfirmYesButton: document.getElementById("quest-retire-confirm-yes"),
  retireConfirmNoButton: document.getElementById("quest-retire-confirm-no")
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendStyledVariableParts(container, text) {
  const parts = String(text).split(/([xy])/);
  parts.forEach((part) => {
    if (part === "x" || part === "y") {
      const span = document.createElement("span");
      span.className = "var-x";
      span.textContent = part;
      container.appendChild(span);
    } else if (part) {
      container.appendChild(document.createTextNode(part));
    }
  });
}

// ============================================================
// 画面・ビューの切り替え
// ============================================================

export function showQuestScreen() {
  elements.screen.hidden = false;
}

export function hideQuestScreen() {
  elements.screen.hidden = true;
}

/**
 * #screen-quest内の1つのビューだけを表示する（他はすべて隠す）。
 * @param {string} viewName opening/room-select/enemy-intro/victory/treasure/item-get/failure/summary
 */
export function showQuestView(viewName) {
  Object.entries(elements.views).forEach(([name, element]) => {
    if (!element) return;
    element.hidden = name !== viewName;
  });
}

// ============================================================
// マップ
// ============================================================

/**
 * 冒険マップを描画する。まだ到達していないステージは「？」で表示する。
 * @param {string[]} visitedRoomIds ステージ順（1〜5）に並んだ、これまでに訪れた部屋ID
 * @param {number} totalStages
 */
export function renderQuestMap(visitedRoomIds, totalStages = 5) {
  elements.map.innerHTML = "";

  for (let stage = 1; stage <= totalStages; stage += 1) {
    const roomId = visitedRoomIds[stage - 1];
    const row = document.createElement("div");
    row.className = "quest-map-row";
    if (stage === visitedRoomIds.length) {
      row.classList.add("is-current");
    }

    const label = document.createElement("span");
    label.className = "quest-map-label";
    label.textContent = `STAGE ${stage}`;

    const value = document.createElement("span");
    value.className = "quest-map-value";
    value.textContent = roomId ? `${roomId}の部屋` : "？";

    row.appendChild(label);
    row.appendChild(value);
    elements.map.appendChild(row);

    if (stage < totalStages) {
      const arrow = document.createElement("div");
      arrow.className = "quest-map-arrow";
      arrow.textContent = "↓";
      arrow.setAttribute("aria-hidden", "true");
      elements.map.appendChild(arrow);
    }
  }
}

// ============================================================
// オープニング
// ============================================================

/**
 * オープニングのメッセージを1行ずつ表示する。
 * @param {string[]} lines
 * @returns {Promise<void>}
 */
export async function playOpeningLines(lines) {
  elements.openingLines.innerHTML = "";
  elements.openingRoomChoices.hidden = true;

  for (const line of lines) {
    const p = document.createElement("p");
    p.className = "quest-opening-line";
    appendStyledVariableParts(p, line);
    elements.openingLines.appendChild(p);
    await sleep(650);
  }
}

export function showOpeningRoomChoices() {
  elements.openingRoomChoices.hidden = false;
}

// ============================================================
// 部屋選択カード（オープニング・通常の部屋選択で共通）
// ============================================================

function createMissionInfoList(mission) {
  const list = document.createElement("dl");
  list.className = "quest-mission-info";

  const rows = [
    ["必要正解数", `${mission.requiredCorrectText}`],
    ["制限時間", mission.timeLimitText],
    ["ミス上限", mission.maxIncorrectText],
    ["ヒント", mission.hintText],
    ["出題カテゴリ", mission.categoryLabel]
  ];

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.appendChild(dt);
    list.appendChild(dd);
  });

  return list;
}

/**
 * 部屋選択カード1枚を作る。
 * @param {{roomId: string, enemy: {emoji: string, name: string}, missionDisplay: object}} choice
 * @param {() => void} onSelect
 */
function createRoomChoiceCard(choice, onSelect) {
  const card = document.createElement("div");
  card.className = "quest-room-card";

  const title = document.createElement("p");
  title.className = "quest-room-card-title";
  title.textContent = `${choice.roomId}の部屋`;

  const emoji = document.createElement("div");
  emoji.className = "quest-room-card-emoji";
  emoji.textContent = choice.enemy.emoji;

  const enemyName = document.createElement("p");
  enemyName.className = "quest-room-card-enemy-name";
  enemyName.textContent = choice.enemy.name;

  const missionList = createMissionInfoList(choice.missionDisplay);

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "primary-button quest-room-card-select";
  selectButton.textContent = "この部屋を選ぶ";
  selectButton.addEventListener("click", () => {
    selectButton.disabled = true;
    onSelect();
  });

  card.appendChild(title);
  card.appendChild(emoji);
  card.appendChild(enemyName);
  card.appendChild(selectButton);
  card.appendChild(missionList);

  return card;
}

/**
 * 部屋選択の2枚のカードを描画する。
 * @param {HTMLElement} container
 * @param {Array<{roomId, enemy, missionDisplay, reward}>} choices
 * @param {(roomId: string) => void} onSelect
 */
function renderRoomChoicesInto(container, choices, onSelect) {
  container.innerHTML = "";
  choices.forEach((choice) => {
    container.appendChild(
      createRoomChoiceCard(choice, () => onSelect(choice.roomId))
    );
  });
}

export function renderOpeningRoomChoices(choices, onSelect) {
  renderRoomChoicesInto(elements.openingRoomChoices, choices, onSelect);
}

export function renderRoomSelectChoices(choices, onSelect) {
  renderRoomChoicesInto(elements.roomSelectChoices, choices, onSelect);
}

// ============================================================
// 敵出現・ミッション確認
// ============================================================

export function renderEnemyIntro(data) {
  elements.enemyIntroRoomName.textContent = `${data.roomId}の部屋`;
  elements.enemyIntroEmoji.textContent = data.enemy.emoji;
  elements.enemyIntroEmoji.classList.toggle("is-boss", Boolean(data.isBoss));
  elements.enemyIntroMessage.textContent = `${data.enemy.name}があらわれた！`;

  elements.enemyIntroMission.innerHTML = "";
  elements.enemyIntroMission.appendChild(createMissionInfoList(data.missionDisplay));

  elements.fightButton.disabled = false;
}

export function getEnemyIntroEmojiElement() {
  return elements.enemyIntroEmoji;
}

// ============================================================
// 敵撃破
// ============================================================

export function renderVictory(data) {
  elements.victoryEmoji.textContent = data.enemy.emoji;
  elements.victoryEmoji.classList.remove(
    "quest-anim-blink",
    "quest-anim-vanish",
    "quest-anim-fade-out"
  );
  elements.victoryMessage.textContent = `${data.enemy.name}をたおした！`;
}

export function getVictoryEmojiElement() {
  return elements.victoryEmoji;
}

// ============================================================
// 宝箱・アイテム獲得
// ============================================================

export function resetTreasureChest() {
  elements.treasureChest.textContent = "🔒";
  elements.treasureChest.classList.remove("quest-anim-chest-open", "is-open");
  elements.openChestButton.hidden = false;
  elements.openChestButton.disabled = false;
}

export function markTreasureChestOpen() {
  elements.treasureChest.textContent = "🔓";
  elements.treasureChest.classList.add("is-open");
  elements.openChestButton.hidden = true;
}

export function getTreasureChestElement() {
  return elements.treasureChest;
}

export function renderItemGet(data) {
  elements.itemGetEmoji.textContent = data.reward.emoji;
  elements.itemGetName.textContent = data.reward.name;
  elements.itemGetCount.textContent =
    data.count > 1 ? `所持数：${data.count}` : "";
}

export function getItemGetEmojiElement() {
  return elements.itemGetEmoji;
}

// ============================================================
// ミッション失敗
// ============================================================

export function renderFailureMessage(lines) {
  elements.failureMessage.innerHTML = "";
  lines.forEach((line, index) => {
    const p = document.createElement("p");
    if (index > 0) {
      p.className = "quest-failure-line";
    }
    appendStyledVariableParts(p, line);
    elements.failureMessage.appendChild(p);
  });
}

// ============================================================
// 冒険結果（ボス撃破エンディング／敗走エンディング／リタイア結果）
// ============================================================

function renderEmojiList(container, entries) {
  container.innerHTML = "";
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quest-summary-empty";
    empty.textContent = "―";
    container.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const row = document.createElement("span");
    row.className = "quest-summary-emoji-item";
    row.textContent = `${entry.emoji} ${entry.name}`;
    container.appendChild(row);
  });
}

/**
 * 冒険結果画面を描画する（ボス撃破・敗走・リタイアのいずれでも使う）。
 * @param {{
 *   heading: string,
 *   message: string,
 *   enemies: Array<{emoji:string, name:string}>,
 *   items: Array<{emoji:string, name:string}>,
 *   routeText: string,
 *   correctCount: number,
 *   incorrectCount: number,
 *   hintUseCount: number,
 *   clearedRoomCount: number,
 *   unitDisplayName: string
 * }} data
 */
export function renderQuestSummary(data) {
  elements.summaryHeading.textContent = data.heading;
  elements.summaryMessage.textContent = data.message;

  renderEmojiList(elements.summaryEnemies, data.enemies);
  renderEmojiList(elements.summaryItems, data.items);

  elements.summaryRoute.textContent = data.routeText;

  elements.summaryCorrect.textContent = `${data.correctCount}問`;
  elements.summaryIncorrect.textContent = `${data.incorrectCount}回`;
  elements.summaryHints.textContent = `${data.hintUseCount}回`;
  elements.summaryRooms.textContent = `${data.clearedRoomCount}部屋`;
  elements.summaryUnit.textContent = data.unitDisplayName;
}

// ============================================================
// リタイア確認モーダル
// ============================================================

export function showRetireConfirm() {
  elements.retireConfirmPanel.hidden = false;
  elements.retireBackdrop.hidden = false;
}

export function hideRetireConfirm() {
  elements.retireConfirmPanel.hidden = true;
  elements.retireBackdrop.hidden = true;
}

// ============================================================
// イベント登録
// ============================================================

/**
 * クエスト専用画面のDOMイベントを登録する。
 * @param {{
 *   onFight: Function,
 *   onIntroRetire: Function,
 *   onOpenChest: Function,
 *   onItemGetNext: Function,
 *   onFailureNext: Function,
 *   onSummaryToTitle: Function,
 *   onRetireConfirmYes: Function,
 *   onRetireConfirmNo: Function
 * }} callbacks
 */
export function initQuestUI(callbacks) {
  elements.fightButton.addEventListener("click", () => {
    elements.fightButton.disabled = true;
    callbacks.onFight();
  });

  elements.introRetireButton.addEventListener("click", () => {
    callbacks.onIntroRetire();
  });

  elements.openChestButton.addEventListener("click", () => {
    elements.openChestButton.disabled = true;
    callbacks.onOpenChest();
  });

  elements.itemGetNextButton.addEventListener("click", () => {
    callbacks.onItemGetNext();
  });

  elements.failureNextButton.addEventListener("click", () => {
    callbacks.onFailureNext();
  });

  elements.summaryToTitleButton.addEventListener("click", () => {
    callbacks.onSummaryToTitle();
  });

  elements.retireConfirmYesButton.addEventListener("click", () => {
    callbacks.onRetireConfirmYes();
  });

  elements.retireConfirmNoButton.addEventListener("click", () => {
    callbacks.onRetireConfirmNo();
  });

  elements.retireBackdrop.addEventListener("click", () => {
    callbacks.onRetireConfirmNo();
  });
}
