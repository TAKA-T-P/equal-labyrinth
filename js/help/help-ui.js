// ヘルプ関連画面（ヘルプメニュー・このゲームの遊び方・アイテム図鑑・データ消去確認）の
// DOM表示と画面遷移だけを担当する。ゲームの進行そのものには一切関与せず、gameStateを
// 直接変更しないため、タイトル画面との行き来だけでモード・単元・カテゴリなどの選択状態が
// 失われることはない（既存のui.js/game.jsの状態管理をそのまま利用する）。
//
// 画面の切り替えは、既存のui.js（showScreen）の仕組みにそのまま合わせている。

import { showScreen, appendStyledVariableParts } from "../ui.js";
import { HOW_TO_PLAY_SECTIONS } from "./help-content.js";
import { buildItemCatalog } from "./item-catalog.js";
import { resetAllEqualLabyrinthData } from "./data-reset.js";

// 第2確認を開いた直後、短時間だけ「はい」を無効にする猶予（誤操作防止）
const RESET_STEP2_INITIAL_DISABLE_MS = 500;
// 消去成功メッセージを表示してから再読み込みするまでの猶予
const RESET_SUCCESS_RELOAD_DELAY_MS = 1500;

const elements = {
  openHelpMenuButton: document.getElementById("open-help-menu-button"),
  helpMenuBackButton: document.getElementById("help-menu-back-button"),
  openHowToPlayButton: document.getElementById("open-how-to-play-button"),
  openItemCatalogButton: document.getElementById("open-item-catalog-button"),
  openDataResetButton: document.getElementById("open-data-reset-button"),

  howToPlayContent: document.getElementById("how-to-play-content"),
  howToPlayBackButton: document.getElementById("how-to-play-back-button"),
  howToPlayBackButtonTop: document.getElementById("how-to-play-back-button-top"),

  itemCatalogSummary: document.getElementById("item-catalog-summary"),
  itemCatalogGrid: document.getElementById("item-catalog-grid"),
  itemCatalogBackButton: document.getElementById("item-catalog-back-button"),
  itemCatalogBackButtonTop: document.getElementById("item-catalog-back-button-top"),

  resetBackdrop: document.getElementById("reset-confirm-backdrop"),
  resetStep1: document.getElementById("reset-confirm-step1"),
  resetStep1No: document.getElementById("reset-confirm-step1-no"),
  resetStep1Yes: document.getElementById("reset-confirm-step1-yes"),
  resetStep2: document.getElementById("reset-confirm-step2"),
  resetStep2No: document.getElementById("reset-confirm-step2-no"),
  resetStep2Yes: document.getElementById("reset-confirm-step2-yes"),
  resetResultMessage: document.getElementById("reset-result-message")
};

// 0: 閉じている／1: 第1確認を表示中／2: 第2確認を表示中
// （第1確認と第2確認は別々のDOM要素・別々のクリックリスナーのため、
// 「第1確認のはいのクリックが第2確認のはいへ伝播する」ことは構造上起こらない）
let resetConfirmStep = 0;
let resetFocusReturnElement = null;
let resetStep2EnableTimeoutId = null;

function elementsReady() {
  return Boolean(elements.openHelpMenuButton && elements.resetStep1 && elements.resetStep2);
}

// ============================================================
// 画面遷移
// ============================================================

function openHelpMenu() {
  closeResetConfirm({ restoreFocus: false });
  if (elements.resetResultMessage) {
    elements.resetResultMessage.hidden = true;
    elements.resetResultMessage.textContent = "";
    elements.resetResultMessage.classList.remove("help-reset-result--error");
  }
  showScreen("help-menu");
}

function backToTitle() {
  showScreen("title");
}

function openHowToPlay() {
  showScreen("how-to-play");
}

function backToHelpMenuFromHowToPlay() {
  showScreen("help-menu");
}

function openItemCatalog() {
  renderItemCatalog();
  showScreen("item-catalog");
}

function backToHelpMenuFromCatalog() {
  showScreen("help-menu");
}

// ============================================================
// 「このゲームの遊び方」（details/summaryのアコーディオン）
// ============================================================

// help-content.jsの段落中に埋め込まれるインライン記法（{{fraction-icon}}・
// {{fraction:分子:分母}}）を検出するパターン。
const INLINE_TOKEN_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * 分数ボタン（□/□）のミニアイコンを、文中に埋め込めるサイズで作る。
 * 数式キーボードの分数ボタン（ui.jsのcreateFractionKeyButton）と同じ組み方。
 */
function appendInlineFractionIcon(container) {
  const icon = document.createElement("span");
  icon.className = "help-inline-fraction-icon";
  icon.setAttribute("role", "img");
  icon.setAttribute("aria-label", "分数ボタン");

  const top = document.createElement("span");
  top.textContent = "□";
  const bar = document.createElement("span");
  bar.className = "help-inline-fraction-icon__bar";
  const bottom = document.createElement("span");
  bottom.textContent = "□";

  icon.append(top, bar, bottom);
  container.appendChild(icon);
}

/**
 * 上下型の分数（分子・分数線・分母）を、文中に埋め込めるサイズで作る。
 * 分子にx・yが含まれる場合は、数式用の斜体フォントで表示する。
 */
function appendInlineFraction(container, numerator, denominator) {
  const fraction = document.createElement("span");
  fraction.className = "math-fraction help-inline-fraction";
  fraction.setAttribute("role", "img");
  fraction.setAttribute("aria-label", `${denominator}分の${numerator}`);

  const numeratorNode = document.createElement("span");
  numeratorNode.className = "math-fraction__numerator";
  appendStyledVariableParts(numeratorNode, numerator);

  const bar = document.createElement("span");
  bar.className = "math-fraction__bar";

  const denominatorNode = document.createElement("span");
  denominatorNode.className = "math-fraction__denominator";
  appendStyledVariableParts(denominatorNode, denominator);

  fraction.append(numeratorNode, bar, denominatorNode);
  container.appendChild(fraction);
}

/**
 * 遊び方の段落1つをcontainerへ描画する。文中の"x"・"y"は斜体フォントで表示し、
 * {{fraction-icon}}・{{fraction:分子:分母}}のインライン記法は、対応するミニ図へ置き換える。
 */
function renderHelpParagraphContent(container, text) {
  let lastIndex = 0;
  let match;

  INLINE_TOKEN_PATTERN.lastIndex = 0;
  while ((match = INLINE_TOKEN_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendStyledVariableParts(container, text.slice(lastIndex, match.index));
    }

    const token = match[1];
    if (token === "fraction-icon") {
      appendInlineFractionIcon(container);
    } else if (token.startsWith("fraction:")) {
      const [, numerator, denominator] = token.split(":");
      appendInlineFraction(container, numerator, denominator);
    }

    lastIndex = INLINE_TOKEN_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    appendStyledVariableParts(container, text.slice(lastIndex));
  }
}

function renderHowToPlayContent() {
  if (!elements.howToPlayContent) return;
  elements.howToPlayContent.innerHTML = "";

  HOW_TO_PLAY_SECTIONS.forEach((section, index) => {
    const details = document.createElement("details");
    details.className = "help-section";
    details.open = index === 0;

    const summary = document.createElement("summary");
    summary.className = "help-section-summary";
    appendStyledVariableParts(summary, section.title);
    details.appendChild(summary);

    const body = document.createElement("div");
    body.className = "help-section-body";
    section.paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      p.className = "help-paragraph";
      renderHelpParagraphContent(p, paragraph);
      body.appendChild(p);
    });
    details.appendChild(body);

    elements.howToPlayContent.appendChild(details);
  });
}

// ============================================================
// アイテム図鑑
// ============================================================

function createLockedItemCard() {
  const card = document.createElement("div");
  card.className = "help-item-card help-item-card--locked";
  card.setAttribute("role", "img");
  card.setAttribute("aria-label", "未獲得のアイテム");

  const emoji = document.createElement("p");
  emoji.className = "help-item-emoji";
  emoji.textContent = "❓";
  emoji.setAttribute("aria-hidden", "true");

  const name = document.createElement("p");
  name.className = "help-item-name";
  name.textContent = "？？？";

  const status = document.createElement("p");
  status.className = "help-item-status";
  status.textContent = "未獲得";

  const room = document.createElement("p");
  room.className = "help-item-room";
  room.textContent = "入手場所：？";

  card.append(emoji, name, status, room);
  return card;
}

function createObtainedItemCard(item) {
  const card = document.createElement("div");
  card.className = "help-item-card";
  card.setAttribute("role", "group");
  const roomLabel = item.roomId ? `${item.roomId}の部屋` : "入手場所の記録なし";
  const descriptionLabel = item.description ? `、${item.description}` : "";
  card.setAttribute("aria-label", `${item.name}、所持数${item.count}、${roomLabel}${descriptionLabel}`);

  const emoji = document.createElement("p");
  emoji.className = "help-item-emoji";
  emoji.textContent = item.emoji;
  emoji.setAttribute("aria-hidden", "true");

  const name = document.createElement("p");
  name.className = "help-item-name";
  name.textContent = item.name;

  const count = document.createElement("p");
  count.className = "help-item-status";
  count.textContent = `所持数：${item.count}`;

  const room = document.createElement("p");
  room.className = "help-item-room";
  room.textContent = item.roomId ? `${item.roomId}の部屋` : "入手場所：記録なし";

  card.append(emoji, name, count, room);

  // 説明文（description）は未設定（旧アイテムなど）の場合があるため、あるときだけ表示する。
  if (item.description) {
    const description = document.createElement("p");
    description.className = "help-item-description";
    description.textContent = item.description;
    card.appendChild(description);
  }

  return card;
}

function renderItemCatalog() {
  if (!elements.itemCatalogGrid || !elements.itemCatalogSummary) return;

  const catalog = buildItemCatalog();
  elements.itemCatalogGrid.innerHTML = "";

  if (catalog.loadFailed) {
    elements.itemCatalogSummary.textContent = "";
    const errorText = document.createElement("p");
    errorText.className = "help-catalog-empty";
    errorText.textContent = "アイテム情報を読み込めませんでした。もう一度画面を開き直してください。";
    elements.itemCatalogGrid.appendChild(errorText);
    return;
  }

  elements.itemCatalogSummary.textContent =
    `獲得種類　${catalog.obtainedCount} / ${catalog.totalCount}　　収集率　${catalog.collectionRate}%`;

  if (catalog.totalCount === 0) {
    const empty = document.createElement("p");
    empty.className = "help-catalog-empty";
    empty.textContent = "現在、図鑑に登録されているアイテムはありません。";
    elements.itemCatalogGrid.appendChild(empty);
    return;
  }

  catalog.items.forEach((item) => {
    const card = item.obtained ? createObtainedItemCard(item) : createLockedItemCard();
    elements.itemCatalogGrid.appendChild(card);
  });
}

// ============================================================
// データ消去：2段階確認
// ============================================================

function getFocusableElements(container) {
  return [...container.querySelectorAll("button:not([disabled])")];
}

function trapFocusKeydown(event, container) {
  if (event.key !== "Tab") return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleDialogKeydown(event) {
  if (resetConfirmStep === 0) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeResetConfirm({ restoreFocus: true });
    return;
  }
  const activeDialog = resetConfirmStep === 1 ? elements.resetStep1 : elements.resetStep2;
  trapFocusKeydown(event, activeDialog);
}

function clearResetStep2EnableTimeout() {
  if (resetStep2EnableTimeoutId !== null) {
    clearTimeout(resetStep2EnableTimeoutId);
    resetStep2EnableTimeoutId = null;
  }
}

function openResetStep1() {
  resetFocusReturnElement = document.activeElement;
  resetConfirmStep = 1;
  elements.resetBackdrop.hidden = false;
  elements.resetStep1.hidden = false;
  elements.resetStep2.hidden = true;
  // 最初から「はい」にフォーカスを置かない
  elements.resetStep1No.focus();
}

function openResetStep2() {
  resetConfirmStep = 2;
  elements.resetStep1.hidden = true;
  elements.resetStep2.hidden = false;
  elements.resetBackdrop.hidden = false;

  // 第1確認の「はい」クリック（Enter連打を含む）がそのまま第2確認の確定に
  // ならないよう、開いた直後の短時間だけ「はい」を無効化し、フォーカスも
  // 「いいえ」へ置く。
  elements.resetStep2Yes.disabled = true;
  elements.resetStep2No.focus();
  clearResetStep2EnableTimeout();
  resetStep2EnableTimeoutId = setTimeout(() => {
    elements.resetStep2Yes.disabled = false;
    resetStep2EnableTimeoutId = null;
  }, RESET_STEP2_INITIAL_DISABLE_MS);
}

function closeResetConfirm({ restoreFocus }) {
  const hadFocusReturnTarget = restoreFocus && resetFocusReturnElement;

  resetConfirmStep = 0;
  elements.resetBackdrop.hidden = true;
  elements.resetStep1.hidden = true;
  elements.resetStep2.hidden = true;
  clearResetStep2EnableTimeout();
  elements.resetStep2Yes.disabled = false;
  setResetButtonsDisabled(false);

  if (hadFocusReturnTarget && typeof resetFocusReturnElement.focus === "function") {
    resetFocusReturnElement.focus();
  }
  resetFocusReturnElement = null;
}

function handleBackdropClick() {
  // 背景クリックでは消去しない。「いいえ」と同じ扱いで閉じるだけにとどめる。
  closeResetConfirm({ restoreFocus: true });
}

function setResetButtonsDisabled(disabled) {
  elements.resetStep1No.disabled = disabled;
  elements.resetStep1Yes.disabled = disabled;
  elements.resetStep2No.disabled = disabled;
  if (!disabled || resetStep2EnableTimeoutId === null) {
    // 開いた直後の一時無効化中は、ここでの解除で上書きしない
    elements.resetStep2Yes.disabled = disabled;
  }
}

function showResetResultMessage(text, isError) {
  if (!elements.resetResultMessage) return;
  elements.resetResultMessage.textContent = text;
  elements.resetResultMessage.hidden = false;
  elements.resetResultMessage.classList.toggle("help-reset-result--error", Boolean(isError));
}

function handleResetConfirmed() {
  if (elements.resetStep2Yes.disabled) return; // 二重クリック・開いた直後の誤操作を防止
  setResetButtonsDisabled(true);

  const result = resetAllEqualLabyrinthData();

  if (result.success) {
    closeResetConfirm({ restoreFocus: false });
    showResetResultMessage("データを消去しました。\nゲームを最初の状態に戻します。", false);
    setTimeout(() => {
      window.location.reload();
    }, RESET_SUCCESS_RELOAD_DELAY_MS);
  } else {
    closeResetConfirm({ restoreFocus: true });
    showResetResultMessage(
      "データを消去できませんでした。\nブラウザの保存設定を確認して、もう一度お試しください。",
      true
    );
  }
}

// ============================================================
// 初期化
// ============================================================

export function initHelpUI() {
  if (!elementsReady()) return;

  renderHowToPlayContent();

  elements.openHelpMenuButton.addEventListener("click", openHelpMenu);
  elements.helpMenuBackButton.addEventListener("click", backToTitle);
  elements.openHowToPlayButton.addEventListener("click", openHowToPlay);
  elements.openItemCatalogButton.addEventListener("click", openItemCatalog);
  elements.openDataResetButton.addEventListener("click", openResetStep1);

  elements.howToPlayBackButton.addEventListener("click", backToHelpMenuFromHowToPlay);
  elements.itemCatalogBackButton.addEventListener("click", backToHelpMenuFromCatalog);
  elements.howToPlayBackButtonTop?.addEventListener("click", backToHelpMenuFromHowToPlay);
  elements.itemCatalogBackButtonTop?.addEventListener("click", backToHelpMenuFromCatalog);

  elements.resetStep1No.addEventListener("click", () => closeResetConfirm({ restoreFocus: true }));
  elements.resetStep1Yes.addEventListener("click", openResetStep2);
  elements.resetStep2No.addEventListener("click", () => closeResetConfirm({ restoreFocus: true }));
  elements.resetStep2Yes.addEventListener("click", handleResetConfirmed);

  elements.resetBackdrop.addEventListener("click", handleBackdropClick);

  document.addEventListener("keydown", handleDialogKeydown);
}
