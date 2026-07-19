// 画面表示とDOM操作を担当するモジュール
// ゲームルールや正誤判定はここに書かない。すべて game.js から渡された値を表示するだけ。

import { LINEAR_CATEGORIES } from "./questions/linear/categories.js";
import { APP_CONFIG } from "./config.js";
import { formatScore } from "./rank/score-manager.js";

const elements = {
  screens: {
    title: document.getElementById("screen-title"),
    countdown: document.getElementById("screen-countdown"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result"),
    "rank-result": document.getElementById("screen-rank-result")
  },

  // タイトル画面
  modeTrainingButton: document.getElementById("mode-training"),
  modeRankButton: document.getElementById("mode-rank"),
  modeDescription: document.getElementById("mode-description"),
  rankDifficultyGroup: document.getElementById("rank-difficulty-group"),
  difficultyNormalButton: document.getElementById("difficulty-normal"),
  difficultyHardButton: document.getElementById("difficulty-hard"),
  trainingOnlySettings: document.getElementById("training-only-settings"),
  questionCountSlider: document.getElementById("question-count-slider"),
  questionCountLabel: document.getElementById("question-count-label"),
  categoryList: document.getElementById("category-list"),
  categoryWarning: document.getElementById("category-warning"),
  categorySelectAllButton: document.getElementById("category-select-all"),
  categorySelectNoneButton: document.getElementById("category-select-none"),
  soundToggle: document.getElementById("sound-toggle"),
  startButton: document.getElementById("start-button"),

  // カウントダウン画面
  countdownDisplay: document.getElementById("countdown-display"),

  // ゲーム画面
  unitLabel: document.getElementById("unit-label"),
  questionProgress: document.getElementById("question-progress"),
  retryButton: document.getElementById("retry-button"),
  backToTitleButton: document.getElementById("back-to-title-button"),
  rankTopbarInfo: document.getElementById("rank-topbar-info"),
  rankRemainingTime: document.getElementById("rank-remaining-time"),
  rankScore: document.getElementById("rank-score"),
  rankScoreChange: document.getElementById("rank-score-change"),
  rankComboGaugeFill: document.getElementById("rank-combo-gauge-fill"),
  questionPrompt: document.getElementById("question-prompt"),
  equationInputCard: document.querySelector(".equation-input-card"),
  equationInputScroll: document.getElementById("equation-input-scroll"),
  equationInputDisplay: document.getElementById("equation-input-display"),
  judgeMessage: document.getElementById("judge-message"),
  hintBackdrop: document.getElementById("hint-backdrop"),
  hintPanel: document.getElementById("hint-panel"),
  hintText: document.getElementById("hint-text"),
  answerRevealBackdrop: document.getElementById("answer-reveal-backdrop"),
  answerRevealPanel: document.getElementById("answer-reveal-panel"),
  answerRevealStatus: document.getElementById("answer-reveal-status"),
  modelEquationText: document.getElementById("model-equation-text"),
  solutionText: document.getElementById("solution-text"),
  nextQuestionButton: document.getElementById("next-question-button"),
  hintButton: document.getElementById("hint-button"),
  passButton: document.getElementById("pass-button"),
  submitButton: document.getElementById("submit-button"),
  mathKeyboard: document.getElementById("math-keyboard"),
  keypadNumbers: document.getElementById("keypad-numbers"),
  keypadSymbols: document.getElementById("keypad-symbols"),
  hintPartsKeypad: document.getElementById("hint-parts-keypad"),
  hintPartsList: document.getElementById("hint-parts-list"),

  // 結果画面（トレーニング）
  statTotal: document.getElementById("stat-total"),
  statCorrect: document.getElementById("stat-correct"),
  statIncorrect: document.getElementById("stat-incorrect"),
  statPass: document.getElementById("stat-pass"),
  statAccuracy: document.getElementById("stat-accuracy"),
  statAverageTime: document.getElementById("stat-average-time"),
  historyList: document.getElementById("history-list"),
  replayButton: document.getElementById("replay-button"),
  resultToTitleButton: document.getElementById("result-to-title-button"),

  // 結果画面（段位認定）
  rankResultHeading: document.getElementById("rank-result-heading"),
  rankResultName: document.getElementById("rank-result-name"),
  rankFullComboBadge: document.getElementById("rank-full-combo-badge"),
  rankStatCorrect: document.getElementById("rank-stat-correct"),
  rankStatIncorrect: document.getElementById("rank-stat-incorrect"),
  rankStatPass: document.getElementById("rank-stat-pass"),
  rankStatAverageTime: document.getElementById("rank-stat-average-time"),
  rankStatScore: document.getElementById("rank-stat-score"),
  rankStatHighScore: document.getElementById("rank-stat-high-score"),
  rankHistoryList: document.getElementById("rank-history-list"),
  rankReplayButton: document.getElementById("rank-replay-button"),
  rankResultToTitleButton: document.getElementById("rank-result-to-title-button")
};

/**
 * テキスト中の "x" だけを、斜体太字のTimes New Romanのspanへ差し替えながら
 * containerへ子要素として追加する（containerの既存の中身はクリアしない）。
 */
function appendStyledVariableParts(container, text) {
  const parts = text.split("x");

  parts.forEach((part, index) => {
    if (part) {
      container.appendChild(document.createTextNode(part));
    }
    if (index < parts.length - 1) {
      const span = document.createElement("span");
      span.className = "var-x";
      span.textContent = "x";
      container.appendChild(span);
    }
  });
}

/**
 * 数式入力欄の1トークン分のノードを作る。数値ボタン・記号ボタンだけでなく、
 * ヒントパーツ（"(15-x)"など複数文字のトークン）の中に含まれる"x"も、
 * 斜体太字のTimes New Romanで表示する。
 */
function createEquationCharacterNode(token) {
  const wrapper = document.createElement("span");
  wrapper.className = "equation-token";
  appendStyledVariableParts(wrapper, token);
  return wrapper;
}

/**
 * 問題文などの日本語文中にある "x" だけを、斜体太字のTimes New Romanで表示する。
 */
function renderTextWithStyledVariable(container, text) {
  container.innerHTML = "";
  appendStyledVariableParts(container, text);
}

// ============================================================
// 画面切り替え
// ============================================================

export function showScreen(screenName) {
  Object.entries(elements.screens).forEach(([name, element]) => {
    if (!element) return;
    element.hidden = name !== screenName;
  });

  if (screenName === "game" && elements.equationInputScroll) {
    elements.equationInputScroll.scrollLeft = 0;
  }
}

// ============================================================
// タイトル・設定画面
// ============================================================

export function renderQuestionCountLabel(totalQuestions) {
  elements.questionCountLabel.textContent = `問題数：${totalQuestions}問`;
  elements.questionCountSlider.value = String(totalQuestions);
}

export function renderCategoryCheckboxes(selectedCategoryIds, onToggle) {
  elements.categoryList.innerHTML = "";

  LINEAR_CATEGORIES.forEach((category) => {
    const item = document.createElement("label");
    item.className = "category-item";
    item.setAttribute("for", `category-${category.id}`);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `category-${category.id}`;
    checkbox.checked = selectedCategoryIds.includes(category.id);
    checkbox.addEventListener("change", () => {
      onToggle(category.id, checkbox.checked);
    });

    const textWrap = document.createElement("span");
    textWrap.className = "category-item-text";

    const nameEl = document.createElement("span");
    nameEl.className = "category-item-name";
    nameEl.textContent = category.name;

    textWrap.appendChild(nameEl);

    item.appendChild(checkbox);
    item.appendChild(textWrap);
    elements.categoryList.appendChild(item);
  });
}

export function setCategoryCheckboxState(categoryId, checked) {
  const checkbox = document.getElementById(`category-${categoryId}`);
  if (checkbox) {
    checkbox.checked = checked;
  }
}

export function setAllCategoryCheckboxes(checked) {
  LINEAR_CATEGORIES.forEach((category) => {
    setCategoryCheckboxState(category.id, checked);
  });
}

export function showCategoryWarning(show) {
  elements.categoryWarning.hidden = !show;
}

export function setStartButtonEnabled(enabled) {
  elements.startButton.disabled = !enabled;
}

export function setSoundToggleState(enabled) {
  elements.soundToggle.checked = enabled;
}

const MODE_DESCRIPTIONS = {
  training: "制限時間なし、問題数や出題内容を選んで自由に練習。",
  rank:
    "120秒以内に、できるだけ多くの方程式を立てよう！\n" +
    "正解数・解答時間・ミス・パスから段位を認定します。"
};

/**
 * モード選択（トレーニング／段位認定）の見た目を切り替える。
 * トレーニング専用設定（問題数・カテゴリ）と、段位認定専用設定（難易度）の
 * 表示・非表示もあわせて切り替える。
 */
export function renderModeSelection(mode) {
  const isTraining = mode === "training";

  elements.modeTrainingButton.classList.toggle("is-selected", isTraining);
  elements.modeTrainingButton.setAttribute("aria-pressed", String(isTraining));
  elements.modeRankButton.classList.toggle("is-selected", !isTraining);
  elements.modeRankButton.setAttribute("aria-pressed", String(!isTraining));

  elements.trainingOnlySettings.hidden = !isTraining;
  elements.rankDifficultyGroup.hidden = isTraining;

  elements.modeDescription.textContent = MODE_DESCRIPTIONS[mode] || "";
}

export function renderDifficultySelection(difficulty) {
  const isNormal = difficulty === "NORMAL";
  elements.difficultyNormalButton.classList.toggle("is-selected", isNormal);
  elements.difficultyNormalButton.setAttribute("aria-pressed", String(isNormal));
  elements.difficultyHardButton.classList.toggle("is-selected", !isNormal);
  elements.difficultyHardButton.setAttribute("aria-pressed", String(!isNormal));
}

// ============================================================
// カウントダウン画面
// ============================================================

export function renderCountdownValue(value) {
  elements.countdownDisplay.textContent = value;
  // アニメーションを再生させるために、クラスを付け直す
  elements.countdownDisplay.className = "";
  void elements.countdownDisplay.offsetWidth;
  elements.countdownDisplay.className =
    value === "START!" ? "countdown-number is-start" : "countdown-number";
}

// ============================================================
// ゲーム画面
// ============================================================

export function renderQuestionProgress(currentIndex, totalQuestions) {
  elements.questionProgress.textContent = `第${currentIndex}問 / ${totalQuestions}問`;
}

export function renderQuestionPrompt(prompt) {
  renderTextWithStyledVariable(elements.questionPrompt, prompt);
  elements.questionPrompt.parentElement.scrollTop = 0;
}

export function renderEquationInput(tokens, cursorPosition) {
  const container = elements.equationInputDisplay;
  container.innerHTML = "";

  if (tokens.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "equation-input-placeholder";
    placeholder.textContent = "ここに式を入力してください";
    container.appendChild(placeholder);
    return;
  }

  tokens.forEach((char, index) => {
    if (index === cursorPosition) {
      container.appendChild(createCursorNode());
    }
    container.appendChild(createEquationCharacterNode(char));
  });

  if (cursorPosition === tokens.length) {
    container.appendChild(createCursorNode());
  }

  elements.equationInputScroll.scrollLeft =
    elements.equationInputScroll.scrollWidth;
}

function createCursorNode() {
  const cursor = document.createElement("span");
  cursor.className = "equation-cursor";
  cursor.setAttribute("aria-hidden", "true");
  return cursor;
}

export function setSubmitButtonEnabled(enabled) {
  elements.submitButton.disabled = !enabled;
}

export function showHintButton(show) {
  elements.hintButton.hidden = !show;
}

export function showPassButton(show) {
  elements.passButton.hidden = !show;
}

export function showHintPanel(hintText) {
  renderTextWithStyledVariable(elements.hintText, hintText);
  elements.hintPanel.hidden = false;
  elements.hintBackdrop.hidden = false;
}

export function hideHintPanel() {
  elements.hintPanel.hidden = true;
  elements.hintBackdrop.hidden = true;
}

export function isHintPanelOpen() {
  return !elements.hintPanel.hidden;
}

const ANSWER_STATUS_CLASS = {
  correct: "is-correct",
  pass: "is-pass"
};

/**
 * 正解・パス時の判定文と模範式・解を、前面の不透明なカードで表示する。
 * @param {"correct"|"pass"} statusType
 * @param {string} statusText
 * @param {string} displayEquation
 * @param {string} solutionDisplay
 */
export function showAnswerReveal(statusType, statusText, displayEquation, solutionDisplay) {
  elements.answerRevealStatus.textContent = statusText;
  elements.answerRevealStatus.className = "answer-reveal-status";
  const statusClass = ANSWER_STATUS_CLASS[statusType];
  if (statusClass) {
    elements.answerRevealStatus.classList.add(statusClass);
  }

  renderTextWithStyledVariable(elements.modelEquationText, displayEquation);
  renderTextWithStyledVariable(elements.solutionText, solutionDisplay);
  elements.answerRevealPanel.hidden = false;
  elements.answerRevealBackdrop.hidden = false;
}

export function hideAnswerReveal() {
  elements.answerRevealPanel.hidden = true;
  elements.answerRevealBackdrop.hidden = true;
  showNextQuestionButton(false);
}

/**
 * トレーニングモードの正解時に表示する「次へ」ボタンの表示を切り替える。
 */
export function showNextQuestionButton(show) {
  elements.nextQuestionButton.hidden = !show;
}

const JUDGE_CLASS_BY_STATUS = {
  correct: "is-correct",
  incorrect: "is-incorrect",
  "input-error": "is-input-error",
  pass: "is-pass"
};

export function showJudgeMessage(status, message) {
  const el = elements.judgeMessage;
  el.textContent = message;
  el.className = "judge-message";

  const statusClass = JUDGE_CLASS_BY_STATUS[status];
  if (statusClass) {
    void el.offsetWidth;
    el.classList.add(statusClass);
  }

  if (status === "incorrect") {
    const card = elements.equationInputCard;
    card.classList.remove("is-incorrect-flash");
    void card.offsetWidth;
    card.classList.add("is-incorrect-flash");
  }
}

export function clearJudgeMessage() {
  elements.judgeMessage.textContent = "";
  elements.judgeMessage.className = "judge-message";
}

// ============================================================
// 数式キーボード（問題ごとの数値・記号キー）
// ============================================================

// 記号キーの統一表示順（将来のy・x²も見据えた順序）
const SYMBOL_ORDER = ["x", "y", "x²", "+", "-", "×", "÷", "(", ")", "="];

// キーボード上の表示文字（内部の入力値は問題データの表記をそのまま使う）
const SYMBOL_DISPLAY = {
  x: "x",
  y: "y",
  "x²": "x²",
  "+": "+",
  "-": "−",
  "×": "×",
  "÷": "÷",
  "(": "(",
  ")": ")",
  "=": "="
};

function getUniqueKeypadNumbers(question) {
  return [...new Set(question.keypadNumbers)];
}

function getOrderedKeypadSymbols(question) {
  const requested = new Set(question.keypadSymbols);
  return SYMBOL_ORDER.filter((symbol) => requested.has(symbol));
}

function createKeypadButton(label, inputValue, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key-button ${extraClass}`;
  button.dataset.inputValue = inputValue;
  button.textContent = label;
  return button;
}

function renderNumberKeys(numbers) {
  elements.keypadNumbers.innerHTML = "";
  numbers.forEach((numberText) => {
    elements.keypadNumbers.appendChild(
      createKeypadButton(numberText, numberText, "key-button--number")
    );
  });
}

function renderSymbolKeys(symbols) {
  elements.keypadSymbols.innerHTML = "";
  symbols.forEach((symbol) => {
    const displayValue = SYMBOL_DISPLAY[symbol] || symbol;
    const variantClass =
      symbol === "x" || symbol === "y" || symbol === "x²"
        ? "key-button--symbol key-variable"
        : "key-button--symbol key-op";
    elements.keypadSymbols.appendChild(
      createKeypadButton(displayValue, displayValue, variantClass)
    );
  });
}

/**
 * 現在の問題データに合わせて、数値キーと記号キーを描画し直す。
 * 前の問題のキーが残らないよう、必ずコンテナの中身を入れ替える。
 */
export function renderEquationKeypad(question) {
  renderNumberKeys(getUniqueKeypadNumbers(question));
  renderSymbolKeys(getOrderedKeypadSymbols(question));
}

function createHintPartButton(part) {
  const button = createKeypadButton(part.display, part.value, "key-button--hint-part");
  // "x"だけを斜体太字のTimes New Romanで表示し直す
  renderTextWithStyledVariable(button, part.display);
  button.dataset.hintPart = "true";
  if (part.ariaLabel) {
    button.setAttribute("aria-label", part.ariaLabel);
  }
  return button;
}

/**
 * ヒント使用時に、そのヒントに対応する式パーツをキーボードへ追加する。
 * partsが空の場合は何もしない（領域は非表示のまま）。
 */
export function renderHintKeypadParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return;
  }
  elements.hintPartsList.innerHTML = "";
  parts.forEach((part) => {
    elements.hintPartsList.appendChild(createHintPartButton(part));
  });
  elements.hintPartsKeypad.hidden = false;
}

/**
 * 式パーツ領域をクリアする。問題切り替え時に必ず呼び出す。
 */
export function clearHintKeypadParts() {
  elements.hintPartsList.innerHTML = "";
  elements.hintPartsKeypad.hidden = true;
}

export function setHintButtonRevealed(revealed) {
  elements.hintButton.classList.toggle("is-revealed", revealed);
}

export function setKeyboardEnabled(enabled) {
  elements.mathKeyboard
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = !enabled;
    });
}

export function resetGameScreenPanels() {
  hideHintPanel();
  hideAnswerReveal();
  clearJudgeMessage();
  clearHintKeypadParts();
  setHintButtonRevealed(false);
  showHintButton(false);
  showPassButton(false);
  setKeyboardEnabled(true);
}

// ============================================================
// 段位認定モードのHUD（残り時間・スコア・コンボ・コンボゲージ）
// ============================================================

let scoreAnimationFrameId = null;

/**
 * 段位認定HUDの表示・非表示を切り替える。
 * 表示中は、トレーニング用の問題数表示（第N問／M問）を隠す。
 */
export function showRankHud(show) {
  elements.rankTopbarInfo.hidden = !show;
  elements.unitLabel.hidden = show;
  elements.questionProgress.hidden = show;
}

export function renderRankRemainingTime(remainingSeconds, isUrgent) {
  elements.rankRemainingTime.textContent =
    remainingSeconds <= 0 ? "最終問題" : `残り ${remainingSeconds}秒`;
  elements.rankRemainingTime.classList.toggle("is-urgent", isUrgent);
}

/**
 * スコア表示を、現在の表示値から目標値までドラムロール風に変化させる。
 * ゲーム内部の正式なスコア（gameState.score）は、呼び出し前に即座に更新済みである前提。
 * 連続して呼び出された場合は、直前のアニメーションを打ち切って新しい目標値へ向けて描画し直す。
 */
export function animateScoreTo(targetScore) {
  if (scoreAnimationFrameId !== null) {
    cancelAnimationFrame(scoreAnimationFrameId);
    scoreAnimationFrameId = null;
  }

  const startScore = Number(elements.rankScore.dataset.rawScore || "0");
  const startTime = performance.now();
  const durationMs = 500;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const currentValue = Math.round(
      startScore + (targetScore - startScore) * progress
    );
    elements.rankScore.textContent = formatScore(currentValue);
    elements.rankScore.dataset.rawScore = String(currentValue);

    if (progress < 1) {
      scoreAnimationFrameId = requestAnimationFrame(step);
    } else {
      scoreAnimationFrameId = null;
      elements.rankScore.dataset.rawScore = String(targetScore);
    }
  }

  scoreAnimationFrameId = requestAnimationFrame(step);
}

/**
 * 不正解時のスコア減少を、短時間のポップアップで表示する。
 */
export function showRankScoreChange(deltaText) {
  const el = elements.rankScoreChange;
  window.clearTimeout(el._hideTimeoutId);

  el.textContent = deltaText;
  el.className = "rank-score-change";
  void el.offsetWidth;
  el.classList.add("is-negative");
  el.hidden = false;

  el._hideTimeoutId = window.setTimeout(() => {
    el.hidden = true;
  }, 900);
}

export function renderRankComboGauge(ratio) {
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  elements.rankComboGaugeFill.style.width = `${percent}%`;
  elements.rankComboGaugeFill.classList.toggle("is-empty", percent === 0);
}

// ============================================================
// 結果画面
// ============================================================

export function renderResultSummary(stats) {
  elements.statTotal.textContent = `${stats.totalQuestions}問`;
  elements.statCorrect.textContent = `${stats.correctCount}問`;
  elements.statIncorrect.textContent = `${stats.incorrectCount}回`;
  elements.statPass.textContent = `${stats.passCount}回`;
  elements.statAccuracy.textContent = `${stats.accuracyText}%`;
  elements.statAverageTime.textContent = stats.averageTimeText;
}

function createHistoryRow(label, valueText) {
  const row = document.createElement("p");
  row.className = "history-item-row";
  renderTextWithStyledVariable(row, `${label}：`);
  const value = document.createElement("span");
  value.className = "value";
  renderTextWithStyledVariable(value, valueText);
  row.appendChild(value);
  return row;
}

const HISTORY_STATUS_INFO = {
  correct: { className: "is-correct", text: "正解" },
  pass: { className: "is-pass", text: "パス" },
  timeout: { className: "is-timeout", text: "時間切れ" }
};

/**
 * 問題履歴の1件分のカードを作る。トレーニング・段位認定の両方で共通利用する。
 * @param {object} entry
 */
function createHistoryItem(entry) {
  const item = document.createElement("article");
  item.className = "history-item";

  const head = document.createElement("div");
  head.className = "history-item-head";

  const title = document.createElement("span");
  title.textContent = `第${entry.questionNumber}問　${entry.categoryName}`;

  const statusInfo = HISTORY_STATUS_INFO[entry.result] || HISTORY_STATUS_INFO.pass;
  const status = document.createElement("span");
  status.className = `history-item-status ${statusInfo.className}`;
  status.textContent = statusInfo.text;

  head.appendChild(title);
  head.appendChild(status);
  item.appendChild(head);

  item.appendChild(createHistoryRow("問題文", entry.prompt));
  item.appendChild(
    createHistoryRow("入力した式", entry.lastInput || "（未入力）")
  );
  item.appendChild(createHistoryRow("模範式", entry.modelEquation));
  item.appendChild(createHistoryRow("解", entry.solutionDisplay));
  item.appendChild(createHistoryRow("解答時間", `${entry.elapsedTimeText}秒`));

  return item;
}

export function renderHistory(historyEntries) {
  elements.historyList.innerHTML = "";
  historyEntries.forEach((entry) => {
    elements.historyList.appendChild(createHistoryItem(entry));
  });
}

/**
 * 段位認定モードの問題履歴を描画する。
 */
export function renderRankHistory(historyEntries) {
  elements.rankHistoryList.innerHTML = "";
  historyEntries.forEach((entry) => {
    elements.rankHistoryList.appendChild(createHistoryItem(entry));
  });
}

/**
 * 段位認定モードの結果画面を描画する。
 */
export function renderRankResult(data) {
  elements.rankResultHeading.textContent = `段位認定／1次方程式 ${data.difficulty}`;
  elements.rankResultName.textContent = data.displayRankName;
  elements.rankFullComboBadge.hidden = !(
    data.correctCount > 0 &&
    data.correctCount === data.maxCombo &&
    !data.finalTimedOut
  );
  elements.rankStatCorrect.textContent = `${data.correctCount}問`;
  elements.rankStatIncorrect.textContent = `${data.incorrectCount}回`;
  elements.rankStatPass.textContent = `${data.passCount}回`;
  elements.rankStatAverageTime.textContent = data.averageTimeText;
  elements.rankStatScore.textContent = data.scoreText;
  elements.rankStatHighScore.textContent = data.highScoreText;
}

// ============================================================
// イベント登録
// ============================================================

/**
 * すべてのDOMイベントを登録する。実際の処理はcallbacksへ委譲する。
 */
export function initUI(callbacks) {
  elements.questionCountSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    callbacks.onQuestionCountChange(value);
  });

  elements.categorySelectAllButton.addEventListener("click", () => {
    callbacks.onSelectAllCategories();
  });

  elements.categorySelectNoneButton.addEventListener("click", () => {
    callbacks.onDeselectAllCategories();
  });

  elements.soundToggle.addEventListener("change", (event) => {
    callbacks.onSoundToggle(event.target.checked);
  });

  elements.startButton.addEventListener("click", () => {
    callbacks.onStart();
  });

  elements.modeTrainingButton.addEventListener("click", () => {
    callbacks.onModeSelect("training");
  });

  elements.modeRankButton.addEventListener("click", () => {
    callbacks.onModeSelect("rank");
  });

  elements.difficultyNormalButton.addEventListener("click", () => {
    callbacks.onDifficultySelect("NORMAL");
  });

  elements.difficultyHardButton.addEventListener("click", () => {
    callbacks.onDifficultySelect("HARD");
  });

  elements.retryButton.addEventListener("click", () => {
    callbacks.onRetry();
  });

  elements.backToTitleButton.addEventListener("click", () => {
    callbacks.onBackToTitle();
  });

  elements.hintButton.addEventListener("click", () => {
    callbacks.onHintRequest();
  });

  elements.passButton.addEventListener("click", () => {
    callbacks.onPass();
  });

  elements.submitButton.addEventListener("click", () => {
    callbacks.onSubmit();
  });

  elements.nextQuestionButton.addEventListener("click", () => {
    callbacks.onNextQuestion();
  });

  elements.replayButton.addEventListener("click", () => {
    callbacks.onReplay();
  });

  elements.resultToTitleButton.addEventListener("click", () => {
    callbacks.onResultToTitle();
  });

  elements.rankReplayButton.addEventListener("click", () => {
    callbacks.onRankReplay();
  });

  elements.rankResultToTitleButton.addEventListener("click", () => {
    callbacks.onRankResultToTitle();
  });

  elements.mathKeyboard.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.inputValue !== undefined) {
      if (button.dataset.hintPart === "true") {
        callbacks.onHintPartPress(button.dataset.inputValue);
      } else {
        callbacks.onKeyPress(button.dataset.inputValue);
      }
      return;
    }

    switch (button.dataset.action) {
      case "cursor-left":
        callbacks.onCursorLeft();
        break;
      case "cursor-right":
        callbacks.onCursorRight();
        break;
      case "backspace":
        callbacks.onBackspace();
        break;
      case "clear":
        callbacks.onClear();
        break;
      default:
        break;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (elements.screens.game.hidden) {
      return;
    }
    callbacks.onPhysicalKeyDown(event);
  });

  // ヒントカード以外の場所をタップ・クリックすると、ヒントカードを閉じる
  elements.hintBackdrop.addEventListener("click", () => {
    hideHintPanel();
  });

  document.addEventListener("pointerdown", (event) => {
    if (elements.hintPanel.hidden) {
      return;
    }
    const clickedInsideHint = elements.hintPanel.contains(event.target);
    const clickedHintButton = elements.hintButton.contains(event.target);
    if (!clickedInsideHint && !clickedHintButton) {
      hideHintPanel();
    }
  });

  renderQuestionCountLabel(APP_CONFIG.defaultQuestions);
}
