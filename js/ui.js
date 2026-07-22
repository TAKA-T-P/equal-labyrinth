// 画面表示とDOM操作を担当するモジュール
// ゲームルールや正誤判定はここに書かない。すべて game.js から渡された値を表示するだけ。

import { APP_CONFIG, UNIT_CONFIG, UNIT_IDS } from "./config.js";
import { formatScore } from "./rank/score-manager.js";
import { renderFormattedEquation } from "./equation/equation-formatter.js";
import { renderQuadraticDiagram } from "./diagrams/quadratic-diagram-renderer.js";

const elements = {
  screens: {
    title: document.getElementById("screen-title"),
    countdown: document.getElementById("screen-countdown"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result"),
    "rank-result": document.getElementById("screen-rank-result"),
    quest: document.getElementById("screen-quest"),
    "help-menu": document.getElementById("screen-help-menu"),
    "how-to-play": document.getElementById("screen-how-to-play"),
    "item-catalog": document.getElementById("screen-item-catalog")
  },

  // タイトル画面
  modeTrainingButton: document.getElementById("mode-training"),
  modeRankButton: document.getElementById("mode-rank"),
  modeQuestButton: document.getElementById("mode-quest"),
  modeDescription: document.getElementById("mode-description"),
  unitLinearButton: document.getElementById("unit-linear"),
  unitSimultaneousButton: document.getElementById("unit-simultaneous"),
  unitQuadraticButton: document.getElementById("unit-quadratic"),
  rankDifficultyGroup: document.getElementById("rank-difficulty-group"),
  difficultyNormalButton: document.getElementById("difficulty-normal"),
  difficultyHardButton: document.getElementById("difficulty-hard"),
  trainingOnlySettings: document.getElementById("training-only-settings"),
  questionCountSlider: document.getElementById("question-count-slider"),
  questionCountLabel: document.getElementById("question-count-label"),
  categoryList: document.getElementById("category-list"),
  categoryWarning: document.getElementById("category-warning"),
  categorySelectToggleButton: document.getElementById("category-select-toggle"),
  soundToggleButton: document.getElementById("sound-toggle-button"),
  soundToggleIcon: document.getElementById("sound-toggle-icon"),
  startButton: document.getElementById("start-button"),

  // カウントダウン画面
  countdownDisplay: document.getElementById("countdown-display"),

  // ゲーム画面
  unitLabel: document.getElementById("unit-label"),
  questionProgress: document.getElementById("question-progress"),
  retryButton: document.getElementById("retry-button"),
  retireButton: document.getElementById("retire-button"),
  backToTitleButton: document.getElementById("back-to-title-button"),
  rankTopbarInfo: document.getElementById("rank-topbar-info"),
  rankRemainingTime: document.getElementById("rank-remaining-time"),
  rankScore: document.getElementById("rank-score"),
  rankScoreChange: document.getElementById("rank-score-change"),
  rankComboGaugeFill: document.getElementById("rank-combo-gauge-fill"),
  questTopbarInfo: document.getElementById("quest-topbar-info"),
  questTopbarStageRoom: document.getElementById("quest-topbar-stage-room"),
  questTopbarEnemyEmoji: document.getElementById("quest-topbar-enemy-emoji"),
  questTopbarProgress: document.getElementById("quest-topbar-progress"),
  questTopbarTime: document.getElementById("quest-topbar-time"),
  questionPrompt: document.getElementById("question-prompt"),
  showDiagramButton: document.getElementById("show-diagram-button"),
  diagramBackdrop: document.getElementById("quadratic-diagram-backdrop"),
  diagramPanel: document.getElementById("quadratic-diagram-panel"),
  diagramCloseButton: document.getElementById("quadratic-diagram-close-button"),
  diagramContainer: document.getElementById("quadratic-diagram-container"),
  diagramNote: document.getElementById("quadratic-diagram-note"),
  equationInputSingle: document.getElementById("equation-input-single"),
  equationInputScroll: document.getElementById("equation-input-scroll"),
  equationInputDisplay: document.getElementById("equation-input-display"),
  equationInputSystem: document.getElementById("equation-input-system"),
  equationSwitchButton: document.getElementById("equation-switch-button"),
  equationSlots: [
    document.getElementById("equation-slot-0"),
    document.getElementById("equation-slot-1")
  ],
  equationInputScrolls: [
    document.getElementById("equation-input-scroll-0"),
    document.getElementById("equation-input-scroll-1")
  ],
  equationInputDisplays: [
    document.getElementById("equation-input-display-0"),
    document.getElementById("equation-input-display-1")
  ],
  inputGuidance: document.getElementById("input-guidance"),
  judgeMessage: document.getElementById("judge-message"),
  hintBackdrop: document.getElementById("hint-backdrop"),
  hintPanel: document.getElementById("hint-panel"),
  hintText: document.getElementById("hint-text"),
  passConfirmBackdrop: document.getElementById("pass-confirm-backdrop"),
  passConfirmPanel: document.getElementById("pass-confirm-panel"),
  passConfirmYesButton: document.getElementById("pass-confirm-yes"),
  passConfirmNoButton: document.getElementById("pass-confirm-no"),
  answerRevealBackdrop: document.getElementById("answer-reveal-backdrop"),
  answerRevealPanel: document.getElementById("answer-reveal-panel"),
  answerRevealStatus: document.getElementById("answer-reveal-status"),
  modelEquationsContainer: document.getElementById("model-equations-container"),
  solutionText: document.getElementById("solution-text"),
  nextQuestionButton: document.getElementById("next-question-button"),
  retryQuestionButton: document.getElementById("retry-question-button"),
  hintButton: document.getElementById("hint-button"),
  passButton: document.getElementById("pass-button"),
  submitButton: document.getElementById("submit-button"),
  mathKeyboard: document.getElementById("math-keyboard"),
  keypadNumbers: document.getElementById("keypad-numbers"),
  keypadSymbols: document.getElementById("keypad-symbols"),

  // 結果画面（トレーニング）
  resultHeading: document.getElementById("result-heading"),
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
 * テキスト中の "x"・"y" だけを、斜体太字のTimes New Romanのspanへ差し替えながら
 * containerへ子要素として追加する（containerの既存の中身はクリアしない）。
 */
export function appendStyledVariableParts(container, text) {
  const parts = text.split(/([xy])/);

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

/**
 * 数式入力欄の1トークン分のノードを作る。数値ボタン・記号ボタンだけでなく、
 * ヒントパーツ（"(15-x)"など複数文字のトークン）の中に含まれる"x"も、
 * 斜体太字のTimes New Romanで表示する。
 * トークンが分数オブジェクトの場合は、上下型の分数ノードを作る。
 */
function createEquationCharacterNode(token, index) {
  if (token && typeof token === "object" && token.type === "fraction") {
    return createFractionTokenNode(token, index);
  }
  if (token && typeof token === "object" && token.type === "power") {
    return createPowerTokenNode(token, index);
  }
  if (token && typeof token === "object" && token.type === "square") {
    return createSquareTokenNode(index);
  }

  const wrapper = document.createElement("span");
  wrapper.className = "equation-token";
  wrapper.dataset.tokenIndex = String(index);
  appendStyledVariableParts(wrapper, token);
  return wrapper;
}

/**
 * x²（{type:"power", base:"x", exponent:2}）を、上付き文字のspanとして組み立てる
 * （equation-tokenクラス・dataset.tokenIndexは付けない、内部部品用のビルダー）。
 */
function buildPowerNode(token) {
  const node = document.createElement("span");
  node.className = "math-power";
  node.setAttribute("aria-label", "xの二乗");

  const base = document.createElement("span");
  base.className = "var-x";
  base.textContent = token.base;

  const exponent = document.createElement("sup");
  exponent.textContent = String(token.exponent);

  node.appendChild(base);
  node.appendChild(exponent);
  return node;
}

/**
 * x²トークン（2次方程式専用）を、入力欄の1つのまとまり（equation-token）として描画する。
 * 分数と同様、「1つ消す」でxと2がまとめて削除され、カーソルは内部へ入らない。
 */
function createPowerTokenNode(token, index) {
  const wrapper = document.createElement("span");
  wrapper.className = "equation-token math-power";
  wrapper.dataset.tokenIndex = String(index);
  wrapper.setAttribute("aria-label", "xの二乗");

  const base = document.createElement("span");
  base.className = "var-x";
  base.textContent = token.base;

  const exponent = document.createElement("sup");
  exponent.textContent = String(token.exponent);

  wrapper.appendChild(base);
  wrapper.appendChild(exponent);
  return wrapper;
}

/**
 * 「かっこの中身を2乗する」記号（{type:"square"}）を、上付き文字の"2"のspanとして
 * 組み立てる（equation-tokenクラス・dataset.tokenIndexは付けない、内部部品用のビルダー）。
 * 直前の"(...)"の直後に置かれる前提の後置演算子のため、底（base）は持たない。
 */
function buildSquareSuffixNode() {
  const node = document.createElement("span");
  node.className = "math-power";
  node.setAttribute("aria-label", "2乗");

  const exponent = document.createElement("sup");
  exponent.textContent = "2";

  node.appendChild(exponent);
  return node;
}

/**
 * 「□²」トークン（2次方程式専用）を、入力欄の1つのまとまり（equation-token）として描画する。
 * x²と同様、「1つ消す」でこのトークンだけがまとめて削除される
 * （直前の"(...)"自体は削除されず、通常どおり編集できる）。
 */
function createSquareTokenNode(index) {
  const wrapper = document.createElement("span");
  wrapper.className = "equation-token math-power";
  wrapper.dataset.tokenIndex = String(index);
  wrapper.setAttribute("aria-label", "2乗");

  const exponent = document.createElement("sup");
  exponent.textContent = "2";

  wrapper.appendChild(exponent);
  return wrapper;
}

/**
 * 分数の分子・分母（文字列トークン、x²トークン、□²トークンが混在しうる配列）を、
 * containerへ描画する。文字列トークンは"x"だけ斜体で、x²・□²トークンは上付きで表示する。
 * ここで作るx²・□²はequation-tokenクラスを持たない（タップ位置判定の対象は
 * 分数トークン自体であり、分子・分母の内部トークンではないため）。
 */
function appendMixedFractionPartTokens(container, tokens) {
  tokens.forEach((token) => {
    if (token && typeof token === "object" && token.type === "power") {
      container.appendChild(buildPowerNode(token));
      return;
    }
    if (token && typeof token === "object" && token.type === "square") {
      container.appendChild(buildSquareSuffixNode());
      return;
    }
    appendStyledVariableParts(container, token);
  });
}

/**
 * 分数トークン（{type:"fraction", numeratorTokens, denominatorTokens, isComplete}）を、
 * 上下型のDOM（分子・分数線・分母）として描画する。完成した分数は1つのトークンとして
 * 扱うため（カーソルは内部へ入らない）、equation-tokenクラスとdata-token-indexを持たせる。
 * 分母が未入力の間は、破線の空欄プレースホルダーを表示する。
 */
/**
 * 分子・分母のトークン配列を、aria-label用の平易な文字列へ変換する
 * （x²トークンは"x^2"として読み上げ用文字列に含める）。
 */
function fractionPartToPlainText(tokens) {
  return tokens
    .map((token) => {
      if (token && typeof token === "object" && token.type === "power") {
        return `${token.base}^${token.exponent}`;
      }
      if (token && typeof token === "object" && token.type === "square") {
        return "^2";
      }
      return token;
    })
    .join("");
}

function createFractionTokenNode(token, index) {
  const wrapper = document.createElement("span");
  wrapper.className = token.isComplete
    ? "equation-token math-fraction"
    : "equation-token math-fraction math-fraction--pending";
  wrapper.dataset.tokenIndex = String(index);

  const numerator = document.createElement("span");
  numerator.className = "math-fraction__numerator";
  appendMixedFractionPartTokens(numerator, token.numeratorTokens);

  const bar = document.createElement("span");
  bar.className = "math-fraction__bar";

  const denominator = document.createElement("span");
  denominator.className = "math-fraction__denominator";
  if (token.isComplete) {
    appendMixedFractionPartTokens(denominator, token.denominatorTokens);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "math-fraction__placeholder";
    denominator.appendChild(placeholder);
  }

  wrapper.appendChild(numerator);
  wrapper.appendChild(bar);
  wrapper.appendChild(denominator);

  wrapper.setAttribute(
    "aria-label",
    token.isComplete
      ? `${fractionPartToPlainText(token.denominatorTokens)}分の${fractionPartToPlainText(token.numeratorTokens)}`
      : "分母が未入力の分数"
  );

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

export function renderCategoryCheckboxes(categories, selectedCategoryIds, onToggle) {
  elements.categoryList.innerHTML = "";

  categories.forEach((category) => {
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

export function setAllCategoryCheckboxes(categories, checked) {
  categories.forEach((category) => {
    setCategoryCheckboxState(category.id, checked);
  });
}

export function showCategoryWarning(show) {
  elements.categoryWarning.hidden = !show;
}

/**
 * カテゴリの一括選択ボタンの表示を切り替える。
 * すべて選択済みのときは「すべて解除」、そうでないときは「すべて選択」にする。
 */
export function renderCategorySelectToggle(allSelected) {
  elements.categorySelectToggleButton.textContent = allSelected
    ? "すべて解除"
    : "すべて選択";
}

export function setStartButtonEnabled(enabled) {
  elements.startButton.disabled = !enabled;
}

export function setSoundToggleState(enabled) {
  elements.soundToggleButton.setAttribute("aria-pressed", String(enabled));
  elements.soundToggleButton.setAttribute(
    "aria-label",
    enabled ? "効果音 ON" : "効果音 OFF"
  );
  elements.soundToggleIcon.textContent = enabled ? "🔊" : "🔇";
}

const MODE_DESCRIPTIONS = {
  training: "制限時間なし、問題数や出題内容を選んで自由に練習。",
  rank:
    "120秒以内に、できるだけ多くの方程式を立てよう！\n" +
    "正解数・解答時間・ミス・パスから段位を認定します。",
  quest:
    "A〜Zの部屋を分岐しながら進む、全5ステージの冒険。\n" +
    "文章題を解いて敵を倒し、アイテムを集めよう！"
};

/**
 * モード選択（トレーニング／段位認定／クエスト）の見た目を切り替える。
 * トレーニング専用設定（問題数・カテゴリ）と、段位認定専用設定（難易度）の
 * 表示・非表示もあわせて切り替える（クエストは、どちらの設定も表示しない）。
 */
export function renderModeSelection(mode) {
  const isTraining = mode === "training";
  const isRank = mode === "rank";
  const isQuest = mode === "quest";

  elements.modeTrainingButton.classList.toggle("is-selected", isTraining);
  elements.modeTrainingButton.setAttribute("aria-pressed", String(isTraining));
  elements.modeRankButton.classList.toggle("is-selected", isRank);
  elements.modeRankButton.setAttribute("aria-pressed", String(isRank));
  if (elements.modeQuestButton) {
    elements.modeQuestButton.classList.toggle("is-selected", isQuest);
    elements.modeQuestButton.setAttribute("aria-pressed", String(isQuest));
  }

  elements.trainingOnlySettings.hidden = !isTraining;
  elements.rankDifficultyGroup.hidden = !isRank;

  elements.modeDescription.textContent = MODE_DESCRIPTIONS[mode] || "";

  // タイトル画面の背景を、選んだモードに応じて色づける。
  // #screen-titleにだけ適用するため、他の画面（ゲーム中・結果画面など）の背景には影響しない。
  elements.screens.title.classList.toggle("mode-tint-training", isTraining);
  elements.screens.title.classList.toggle("mode-tint-rank", isRank);
  elements.screens.title.classList.toggle("mode-tint-quest", isQuest);
}

export function renderDifficultySelection(difficulty) {
  const isNormal = difficulty === "NORMAL";
  elements.difficultyNormalButton.classList.toggle("is-selected", isNormal);
  elements.difficultyNormalButton.setAttribute("aria-pressed", String(isNormal));
  elements.difficultyHardButton.classList.toggle("is-selected", !isNormal);
  elements.difficultyHardButton.setAttribute("aria-pressed", String(!isNormal));
}

/**
 * 単元選択（1次方程式／連立方程式／2次方程式）の見た目を切り替える。
 */
export function renderUnitSelection(unit) {
  const buttonsByUnit = {
    [UNIT_IDS.LINEAR]: elements.unitLinearButton,
    [UNIT_IDS.SIMULTANEOUS]: elements.unitSimultaneousButton,
    [UNIT_IDS.QUADRATIC]: elements.unitQuadraticButton
  };

  Object.entries(buttonsByUnit).forEach(([buttonUnit, button]) => {
    if (!button) return;
    const isSelected = buttonUnit === unit;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
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
  elements.questionPrompt.scrollTop = 0;
}

/**
 * 2次方程式の図形問題（十字路・ふたのない箱・動点）の図を準備する。
 * 描画に成功した場合は、出題と同時に図の前面カードを自動的に開く
 * （閉じたあとは「図を表示」ボタンでいつでも再び開ける）。
 * diagramがnull、または描画に失敗した問題（quadratic-diagram-renderer.js側の責務）では
 * 「図を表示」ボタン自体を表示せず、前面カードも開かない。
 */
export function renderDiagram(diagram) {
  if (!elements.diagramContainer) return;
  renderQuadraticDiagram(elements.diagramContainer, diagram);

  const renderedSuccessfully = Boolean(diagram) && !elements.diagramContainer.hidden;
  if (elements.showDiagramButton) {
    elements.showDiagramButton.hidden = !renderedSuccessfully;
  }

  // 動点（moving-points-rectangle）の図では、点P・点Qの移動速度を
  // 「閉じる」ボタンのすぐ上に添える（図だけでは速さが分からないため）。
  if (elements.diagramNote) {
    if (renderedSuccessfully && diagram.type === "moving-points-rectangle") {
      elements.diagramNote.textContent =
        `点P：秒速${diagram.pSpeedValue}cm、点Q：秒速${diagram.qSpeedValue}cm`;
      elements.diagramNote.hidden = false;
    } else {
      elements.diagramNote.textContent = "";
      elements.diagramNote.hidden = true;
    }
  }

  if (renderedSuccessfully) {
    showDiagramPanel();
  } else {
    hideDiagramPanel();
  }
}

export function showDiagramPanel() {
  elements.diagramPanel.hidden = false;
  elements.diagramBackdrop.hidden = false;
  // 図を表示している間も問題文が読めるよう、問題文カードだけは
  // 背景を暗くする幕（diagramBackdrop）より前面に出す
  document.body.classList.add("is-diagram-open");
}

export function hideDiagramPanel() {
  elements.diagramPanel.hidden = true;
  elements.diagramBackdrop.hidden = true;
  document.body.classList.remove("is-diagram-open");
}

/**
 * 単元名（1次方程式／連立方程式）を、ゲーム画面上部へ表示する。
 */
export function renderUnitLabel(unit) {
  const unitConfig = UNIT_CONFIG[unit];
  elements.unitLabel.textContent = unitConfig ? unitConfig.displayName : "";
}

function renderTokensIntoDisplay(container, scrollElement, tokens, cursorPosition) {
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
    container.appendChild(createEquationCharacterNode(char, index));
  });

  if (cursorPosition === tokens.length) {
    container.appendChild(createCursorNode());
  }

  scrollElement.scrollLeft = scrollElement.scrollWidth;
}

export function renderEquationInput(tokens, cursorPosition) {
  renderTokensIntoDisplay(
    elements.equationInputDisplay,
    elements.equationInputScroll,
    tokens,
    cursorPosition
  );
}

/**
 * 連立方程式の式①・式②を、それぞれの入力欄へ描画する。
 * アクティブな式には明るい枠（is-active）を付け、「式切替」ボタンの表示も更新する。
 * @param {[Array, Array]} tokensPair
 * @param {[number, number]} cursorPositions
 * @param {0|1} activeIndex
 */
export function renderSystemEquationInput(tokensPair, cursorPositions, activeIndex) {
  [0, 1].forEach((i) => {
    renderTokensIntoDisplay(
      elements.equationInputDisplays[i],
      elements.equationInputScrolls[i],
      tokensPair[i],
      cursorPositions[i]
    );
    elements.equationSlots[i].classList.toggle("is-active", i === activeIndex);
  });

  elements.equationSwitchButton.textContent = activeIndex === 0 ? "式②へ" : "式①へ";
}

/**
 * 単元に応じて、1本の入力欄（1次方程式）と2本の入力欄（連立方程式）を切り替える。
 */
export function showEquationInputMode(unit) {
  const isSystem = unit === "simultaneous";
  elements.equationInputSingle.hidden = isSystem;
  elements.equationInputSystem.hidden = !isSystem;
  elements.equationSwitchButton.hidden = !isSystem;
}

function createCursorNode() {
  const cursor = document.createElement("span");
  cursor.className = "equation-cursor";
  cursor.setAttribute("aria-hidden", "true");
  return cursor;
}

/**
 * 入力欄をタップ／クリックした位置に最も近いカーソル位置（トークン単位）を求める。
 * 各トークンの中心より左側をタップすればトークンの手前、右側なら奥へカーソルを置く。
 * トークンが1つもない場合は0を返す。
 */
function resolveTapCursorIndex(container, clientX) {
  const tokenNodes = Array.from(container.querySelectorAll(".equation-token"));
  if (tokenNodes.length === 0) return 0;

  for (const node of tokenNodes) {
    const rect = node.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) {
      return Number(node.dataset.tokenIndex);
    }
  }
  return tokenNodes.length;
}

/**
 * 分数入力の案内（「分母を選んでください」など）を表示する。
 * スクリーンリーダーにも伝わるよう、aria-live="polite"の領域を使う。
 */
export function showInputGuidance(text) {
  elements.inputGuidance.textContent = text;
}

export function clearInputGuidance() {
  elements.inputGuidance.textContent = "";
}

export function setSubmitButtonEnabled(enabled) {
  elements.submitButton.disabled = !enabled;
}

/**
 * ヒントボタンは常に表示し、解禁時間（20秒）前は薄暗く押せない状態にする。
 */
export function setHintButtonEnabled(enabled) {
  elements.hintButton.disabled = !enabled;
}

/**
 * パスボタンは常に表示し、解禁時間（40秒）前は薄暗く押せない状態にする。
 */
export function setPassButtonEnabled(enabled) {
  elements.passButton.disabled = !enabled;
}

/**
 * クエストモードにはパス機能がないため、パスボタン自体を非表示にする
 * （トレーニング・段位認定では常に表示する）。
 */
export function setPassButtonVisible(visible) {
  elements.passButton.hidden = !visible;
}

export function showHintPanel(hintText) {
  renderTextWithStyledVariable(elements.hintText, hintText);
  elements.hintPanel.hidden = false;
  elements.hintBackdrop.hidden = false;
  // ヒント表示中も問題文が読めるよう、問題文カードだけは背景を暗くする幕より前面に出す
  document.body.classList.add("is-hint-open");
}

export function hideHintPanel() {
  elements.hintPanel.hidden = true;
  elements.hintBackdrop.hidden = true;
  document.body.classList.remove("is-hint-open");
}

export function isHintPanelOpen() {
  return !elements.hintPanel.hidden;
}

export function showPassConfirm() {
  elements.passConfirmPanel.hidden = false;
  elements.passConfirmBackdrop.hidden = false;
}

export function hidePassConfirm() {
  elements.passConfirmPanel.hidden = true;
  elements.passConfirmBackdrop.hidden = true;
}

const ANSWER_STATUS_CLASS = {
  correct: "is-correct",
  pass: "is-pass"
};

/**
 * 正解・パス時の判定文と模範式・解を、前面の不透明なカードで表示する。
 * displayEquationは、1次方程式では文字列1つ、連立方程式では
 * [式①の表示, 式②の表示] の配列2つを渡す。
 * @param {"correct"|"pass"} statusType
 * @param {string} statusText
 * @param {string|[string, string]} displayEquation
 * @param {string} solutionDisplay
 */
export function showAnswerReveal(statusType, statusText, displayEquation, solutionDisplay) {
  elements.answerRevealStatus.textContent = statusText;
  elements.answerRevealStatus.className = "answer-reveal-status";
  const statusClass = ANSWER_STATUS_CLASS[statusType];
  if (statusClass) {
    elements.answerRevealStatus.classList.add(statusClass);
  }

  const equations = Array.isArray(displayEquation) ? displayEquation : [displayEquation];
  elements.modelEquationsContainer.innerHTML = "";
  equations.forEach((equation, index) => {
    const row = document.createElement("p");
    row.className = "answer-reveal-row";
    const label = equations.length > 1 ? `式${index === 0 ? "①" : "②"}　` : "模範式：";
    renderTextWithStyledVariable(row, label);
    const valueSpan = document.createElement("span");
    renderFormattedEquation(valueSpan, equation);
    row.appendChild(valueSpan);
    elements.modelEquationsContainer.appendChild(row);
  });

  renderTextWithStyledVariable(elements.solutionText, solutionDisplay);
  elements.answerRevealPanel.hidden = false;
  elements.answerRevealBackdrop.hidden = false;
}

export function hideAnswerReveal() {
  elements.answerRevealPanel.hidden = true;
  elements.answerRevealBackdrop.hidden = true;
  showNextQuestionButton(false);
  showRetryQuestionButton(false);
}

/**
 * トレーニングモードの正解時に表示する「次へ」ボタンの表示を切り替える。
 */
export function showNextQuestionButton(show) {
  elements.nextQuestionButton.hidden = !show;
}

/**
 * トレーニングモードの正解・パス時に、「次へ」の左隣に表示する「もう一度」ボタンの
 * 表示を切り替える。同じ問題を出題し直す（`handleRetryQuestion()`）ためのボタン。
 */
export function showRetryQuestionButton(show) {
  elements.retryQuestionButton.hidden = !show;
}

const JUDGE_CLASS_BY_STATUS = {
  correct: "is-correct",
  incorrect: "is-incorrect",
  "input-error": "is-input-error",
  pass: "is-pass"
};

const JUDGE_MESSAGE_DISPLAY_MILLISECONDS = 1000;
let judgeMessageTimeoutId = null;

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
    // 連立方程式では2つの入力欄のうち、現在アクティブなほうだけを光らせる
    const card = elements.equationInputSingle.hidden
      ? elements.equationSlots.find((slot) => slot.classList.contains("is-active"))
      : elements.equationInputSingle;
    if (card) {
      card.classList.remove("is-incorrect-flash");
      void card.offsetWidth;
      card.classList.add("is-incorrect-flash");
    }
  }

  if (judgeMessageTimeoutId !== null) {
    clearTimeout(judgeMessageTimeoutId);
  }
  judgeMessageTimeoutId = setTimeout(() => {
    judgeMessageTimeoutId = null;
    clearJudgeMessage();
  }, JUDGE_MESSAGE_DISPLAY_MILLISECONDS);
}

export function clearJudgeMessage() {
  if (judgeMessageTimeoutId !== null) {
    clearTimeout(judgeMessageTimeoutId);
    judgeMessageTimeoutId = null;
  }
  elements.judgeMessage.textContent = "";
  elements.judgeMessage.className = "judge-message";
}

// ============================================================
// 数式キーボード（問題ごとの数値・記号キー）
// ============================================================

// 記号キーの統一表示順
const SYMBOL_ORDER = ["x", "y", "x²", "square", "+", "-", "×", "fraction", "(", ")", "="];

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

/**
 * 旧仕様の「÷」「/」記号を、上下型分数を作る「fraction」識別子へ変換する
 * （既存問題データとの後方互換のため。正式なテンプレートは順次fractionへ更新する）。
 */
function normalizeKeypadSymbol(symbol) {
  if (symbol === "÷" || symbol === "/") {
    return "fraction";
  }
  return symbol;
}

function getUniqueKeypadNumbers(question) {
  return [...new Set(question.keypadNumbers)];
}

function getOrderedKeypadSymbols(question) {
  const normalized = question.keypadSymbols.map((symbol) => {
    const converted = normalizeKeypadSymbol(symbol);
    if (converted !== symbol) {
      console.warn(
        `問題 ${question.id} のkeypadSymbolsに「${symbol}」が残っています。「fraction」へ自動変換しました。`
      );
    }
    return converted;
  });
  const requested = new Set(normalized);
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

const NUMBER_FRACTION_PATTERN = /^(\d+)\/(\d+)$/;

/**
 * 「1/2」のような分数の数字カードを、上下型分数の見た目で作る。
 * data-action="insert-number-fraction"で識別し（x²・□²ボタンと同じ仕組み）、
 * 解答欄へも文字列ではなく完成済みの分数トークンとして挿入する
 * （解答欄でもカードと同じ上下型分数の見た目になるようにするため）。
 */
function createFractionNumberButton(numerator, denominator) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-button key-button--number key-button--number-fraction";
  button.dataset.action = "insert-number-fraction";
  button.dataset.fractionNumerator = numerator;
  button.dataset.fractionDenominator = denominator;
  button.setAttribute("aria-label", `${denominator}分の${numerator}`);

  const fraction = document.createElement("span");
  fraction.className = "math-fraction math-fraction--number-key";

  const numeratorNode = document.createElement("span");
  numeratorNode.className = "math-fraction__numerator";
  numeratorNode.textContent = numerator;

  const bar = document.createElement("span");
  bar.className = "math-fraction__bar";

  const denominatorNode = document.createElement("span");
  denominatorNode.className = "math-fraction__denominator";
  denominatorNode.textContent = denominator;

  fraction.appendChild(numeratorNode);
  fraction.appendChild(bar);
  fraction.appendChild(denominatorNode);
  button.appendChild(fraction);

  return button;
}

function renderNumberKeys(numbers) {
  elements.keypadNumbers.innerHTML = "";
  numbers.forEach((numberText) => {
    const fractionMatch = numberText.match(NUMBER_FRACTION_PATTERN);
    const button = fractionMatch
      ? createFractionNumberButton(fractionMatch[1], fractionMatch[2])
      : createKeypadButton(numberText, numberText, "key-button--number");
    if (!fractionMatch) {
      button.dataset.keyType = "number";
    }
    elements.keypadNumbers.appendChild(button);
  });
}

/**
 * 分数ボタン（÷の代わりに配置する、上下型分数を作るボタン）を作る。
 * data-inputValueは持たせず、data-action="create-fraction"で識別する
 * （cursor-left・backspaceなどの編集キーと同じ仕組み）。
 */
function createFractionKeyButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-button key-button--symbol key-button--fraction";
  button.dataset.action = "create-fraction";
  button.setAttribute("aria-label", "分数を作る");

  const icon = document.createElement("span");
  icon.className = "fraction-key-icon";
  icon.setAttribute("aria-hidden", "true");

  const top = document.createElement("span");
  top.textContent = "□";
  const bar = document.createElement("span");
  bar.className = "fraction-key-icon__bar";
  const bottom = document.createElement("span");
  bottom.textContent = "□";

  icon.appendChild(top);
  icon.appendChild(bar);
  icon.appendChild(bottom);
  button.appendChild(icon);

  return button;
}

/**
 * x²ボタン（2次方程式専用、上付き文字の見た目のキー）を作る。
 * data-inputValueは持たせず、data-action="insert-power"で識別する
 * （文字列ではなく{type:"power",...}オブジェクトを1つのトークンとして挿入するため、
 * 分数ボタンと同じ仕組みにしている）。
 */
function createPowerKeyButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-button key-button--symbol key-variable key-button--power";
  button.dataset.action = "insert-power";
  button.setAttribute("aria-label", "xの2乗を入力");
  button.appendChild(buildPowerNode({ base: "x", exponent: 2 }));
  return button;
}

/**
 * 「□²」ボタン（2次方程式専用、かっこの中身をまとめて2乗するキー）を作る。
 * data-inputValueは持たせず、data-action="insert-square"で識別する
 * （文字列ではなく{type:"square"}オブジェクトを1つのトークンとして挿入するため、
 * x²ボタン・分数ボタンと同じ仕組みにしている）。直前の"(...)"の直後に押すことを想定する
 * （例："(x-8)" の直後に押すと "(x-8)²" になる）。
 */
function createSquareKeyButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-button key-button--symbol key-variable key-button--power";
  button.dataset.action = "insert-square";
  button.setAttribute("aria-label", "かっこの中身の2乗を入力");

  const label = document.createElement("span");
  label.textContent = "□";
  const exponent = document.createElement("sup");
  exponent.textContent = "2";

  button.appendChild(label);
  button.appendChild(exponent);
  return button;
}

function renderSymbolKeys(symbols) {
  elements.keypadSymbols.innerHTML = "";
  symbols.forEach((symbol) => {
    if (symbol === "fraction") {
      elements.keypadSymbols.appendChild(createFractionKeyButton());
      return;
    }
    if (symbol === "x²") {
      elements.keypadSymbols.appendChild(createPowerKeyButton());
      return;
    }
    if (symbol === "square") {
      elements.keypadSymbols.appendChild(createSquareKeyButton());
      return;
    }
    const displayValue = SYMBOL_DISPLAY[symbol] || symbol;
    const variantClass =
      symbol === "x" || symbol === "y"
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

/**
 * 分数型のヒント式パーツ（x/8など）のボタンを、上下型分数の見た目で作る。
 */
function createFractionHintPartButton(part) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-button key-button--hint-part key-button--hint-fraction";
  button.dataset.inputValue = part.value;
  button.dataset.hintPart = "true";
  button.dataset.hintPartType = "fraction";
  button.dataset.hintPartNumerator = part.numerator;
  button.dataset.hintPartDenominator = part.denominator;
  if (part.ariaLabel) {
    button.setAttribute("aria-label", part.ariaLabel);
  }

  const fraction = document.createElement("span");
  fraction.className = "math-fraction math-fraction--hint-key";

  const numerator = document.createElement("span");
  numerator.className = "math-fraction__numerator";
  appendStyledVariableParts(numerator, part.numerator);

  const bar = document.createElement("span");
  bar.className = "math-fraction__bar";

  const denominator = document.createElement("span");
  denominator.className = "math-fraction__denominator";
  appendStyledVariableParts(denominator, part.denominator);

  fraction.appendChild(numerator);
  fraction.appendChild(bar);
  fraction.appendChild(denominator);
  button.appendChild(fraction);

  return button;
}

function createHintPartButton(part) {
  if (part.type === "fraction") {
    return createFractionHintPartButton(part);
  }

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
 * ヒント使用時に、そのヒントに対応する式パーツを、数値ボタンと同じカード
 * （keypad-numbers）へ追加する。partsが空の場合は何もしない。
 */
export function renderHintKeypadParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return;
  }
  parts.forEach((part) => {
    elements.keypadNumbers.appendChild(createHintPartButton(part));
  });
}

/**
 * 数値ボタンのカードに追加された式パーツだけを取り除く（数値ボタンは残す）。
 * 問題切り替え時に必ず呼び出す。
 */
export function clearHintKeypadParts() {
  elements.keypadNumbers
    .querySelectorAll('[data-hint-part="true"]')
    .forEach((button) => button.remove());
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
  hidePassConfirm();
  hideAnswerReveal();
  hideDiagramPanel();
  clearJudgeMessage();
  clearInputGuidance();
  clearHintKeypadParts();
  setHintButtonRevealed(false);
  setHintButtonEnabled(false);
  setPassButtonEnabled(false);
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

// ============================================================
// クエストモードのHUD（ゲーム画面上部の小さな状況欄）
// ============================================================

/**
 * クエストHUDの表示・非表示を切り替える。
 * 表示中は、トレーニング用の問題数表示（第N問／M問）を隠す（段位認定と同じ方針）。
 */
export function showQuestHud(show) {
  elements.questTopbarInfo.hidden = !show;
  elements.unitLabel.hidden = show;
  elements.questionProgress.hidden = show;
}

/**
 * クエストHUD（STAGE n/5　○の部屋／正解・ミス／残り時間）を描画する。
 * @param {{stage:number, roomId:string, enemyEmoji:string, correctCount:number,
 *   requiredCorrect:number, incorrectCount:number, maxIncorrect:number|null,
 *   remainingSecondsText:number|null}} data
 */
export function renderQuestHud(data) {
  elements.questTopbarStageRoom.textContent = `STAGE ${data.stage}/5　${data.roomId}の部屋`;
  elements.questTopbarEnemyEmoji.textContent = data.enemyEmoji;
  elements.questTopbarProgress.textContent =
    `正解 ${data.correctCount}/${data.requiredCorrect}` +
    (data.maxIncorrect === null ? "" : `　ミス ${data.incorrectCount}/${data.maxIncorrect}`);
  elements.questTopbarTime.textContent =
    data.remainingSecondsText === null ? "残り時間 なし" : `残り時間 ${data.remainingSecondsText}秒`;
}

/**
 * トレーニングモードでは「リタイア」ボタンを、段位認定モードでは「リトライ」ボタンを表示する。
 */
export function showRetireButton(show) {
  elements.retireButton.hidden = !show;
  elements.retryButton.hidden = show;
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

/**
 * トレーニング結果画面の見出しに、単元名を添える。
 */
export function renderResultHeading(unit) {
  const unitConfig = UNIT_CONFIG[unit];
  elements.resultHeading.textContent = unitConfig
    ? `結果発表／${unitConfig.displayName}`
    : "結果発表";
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

/**
 * 数式（入力した式・模範式）を表示する履歴の1行を作る。文字列中の"/"は、
 * renderFormattedEquation()で解析して上下型分数として描画する。
 */
function createHistoryEquationRow(label, equationText) {
  const row = document.createElement("p");
  row.className = "history-item-row";
  renderTextWithStyledVariable(row, `${label}：`);
  const value = document.createElement("span");
  value.className = "value";
  renderFormattedEquation(value, equationText);
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

  if (entry.unit === "simultaneous") {
    item.appendChild(
      createHistoryEquationRow("式①（入力）", entry.lastInput1 || "（未入力）")
    );
    item.appendChild(
      createHistoryEquationRow("式②（入力）", entry.lastInput2 || "（未入力）")
    );
    item.appendChild(createHistoryEquationRow("模範式①", entry.modelEquation1));
    item.appendChild(createHistoryEquationRow("模範式②", entry.modelEquation2));
  } else {
    item.appendChild(
      createHistoryEquationRow("入力した式", entry.lastInput || "（未入力）")
    );
    item.appendChild(createHistoryEquationRow("模範式", entry.modelEquation));
  }

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
  const unitConfig = UNIT_CONFIG[data.unit] || UNIT_CONFIG.linear;
  elements.rankResultHeading.textContent =
    `段位認定／${unitConfig.displayName} ${data.difficulty}`;
  elements.rankResultName.textContent = data.displayRankName;

  const isFullCombo =
    data.correctCount >= 5 &&
    data.correctCount === data.maxCombo &&
    !data.finalTimedOut;
  elements.rankFullComboBadge.hidden = !isFullCombo;
  elements.rankFullComboBadge.classList.toggle(
    "is-glowing",
    isFullCombo && data.correctCount >= 10
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

  elements.categorySelectToggleButton.addEventListener("click", () => {
    callbacks.onCategorySelectToggle();
  });

  elements.soundToggleButton.addEventListener("click", () => {
    const currentlyEnabled =
      elements.soundToggleButton.getAttribute("aria-pressed") === "true";
    callbacks.onSoundToggle(!currentlyEnabled);
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

  if (elements.modeQuestButton) {
    elements.modeQuestButton.addEventListener("click", () => {
      callbacks.onModeSelect("quest");
    });
  }

  elements.unitLinearButton.addEventListener("click", () => {
    callbacks.onUnitSelect("linear");
  });

  elements.unitSimultaneousButton.addEventListener("click", () => {
    callbacks.onUnitSelect("simultaneous");
  });

  if (elements.unitQuadraticButton) {
    elements.unitQuadraticButton.addEventListener("click", () => {
      callbacks.onUnitSelect("quadratic");
    });
  }

  elements.difficultyNormalButton.addEventListener("click", () => {
    callbacks.onDifficultySelect("NORMAL");
  });

  elements.difficultyHardButton.addEventListener("click", () => {
    callbacks.onDifficultySelect("HARD");
  });

  elements.retryButton.addEventListener("click", () => {
    callbacks.onRetry();
  });

  elements.retireButton.addEventListener("click", () => {
    callbacks.onGiveUp();
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

  elements.equationSwitchButton.addEventListener("click", () => {
    callbacks.onEquationSwitch();
  });

  elements.nextQuestionButton.addEventListener("click", () => {
    callbacks.onNextQuestion();
  });

  elements.retryQuestionButton.addEventListener("click", () => {
    callbacks.onRetryQuestion();
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
        if (button.dataset.hintPartType === "fraction") {
          callbacks.onHintFractionPartPress({
            numerator: button.dataset.hintPartNumerator,
            denominator: button.dataset.hintPartDenominator,
            value: button.dataset.inputValue
          });
        } else {
          callbacks.onHintPartPress(button.dataset.inputValue);
        }
      } else {
        callbacks.onKeyPress(button.dataset.inputValue, button.dataset.keyType === "number");
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
      case "create-fraction":
        callbacks.onCreateFraction();
        break;
      case "insert-power":
        callbacks.onInsertPower();
        break;
      case "insert-square":
        callbacks.onInsertSquare();
        break;
      case "insert-number-fraction":
        callbacks.onInsertNumberFraction(
          button.dataset.fractionNumerator,
          button.dataset.fractionDenominator
        );
        break;
      default:
        break;
    }
  });

  elements.equationInputScroll.addEventListener("click", (event) => {
    const tapIndex = resolveTapCursorIndex(elements.equationInputDisplay, event.clientX);
    callbacks.onEquationInputTap(tapIndex);
  });

  elements.equationSlots.forEach((slot, index) => {
    slot.addEventListener("click", (event) => {
      const tapIndex = resolveTapCursorIndex(elements.equationInputDisplays[index], event.clientX);
      callbacks.onEquationSlotSelect(index, tapIndex);
    });
    slot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        callbacks.onEquationSlotSelect(index);
      }
    });
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

  if (elements.showDiagramButton) {
    elements.showDiagramButton.addEventListener("click", () => {
      showDiagramPanel();
    });
  }
  if (elements.diagramCloseButton) {
    elements.diagramCloseButton.addEventListener("click", () => {
      hideDiagramPanel();
    });
  }
  // 図カード以外の場所をタップ・クリックすると、図カードを閉じる
  if (elements.diagramBackdrop) {
    elements.diagramBackdrop.addEventListener("click", () => {
      hideDiagramPanel();
    });
  }

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

  elements.passConfirmYesButton.addEventListener("click", () => {
    callbacks.onPassConfirmYes();
  });

  elements.passConfirmNoButton.addEventListener("click", () => {
    callbacks.onPassConfirmNo();
  });

  // パス確認カード以外の場所をタップ・クリックすると、「いいえ」と同じ扱いで閉じる
  elements.passConfirmBackdrop.addEventListener("click", () => {
    callbacks.onPassConfirmNo();
  });

  renderQuestionCountLabel(APP_CONFIG.defaultQuestions);
}
