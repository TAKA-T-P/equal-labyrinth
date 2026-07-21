// Web Audio APIを利用した簡易効果音モジュール
// 外部音声ファイルは使用しない。

let audioContext = null;
let soundEnabled = true;

/**
 * AudioContextを初期化する。ユーザー操作（クリックなど）の直後に呼び出すこと。
 */
export function initializeAudio() {
  if (audioContext !== null) {
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  audioContext = new AudioContextClass();
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
}

export function isSoundEnabled() {
  return soundEnabled;
}

function ensureContextRunning() {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

/**
 * 単純なトーンを1つ再生する。
 */
function playTone({
  frequency,
  startOffset = 0,
  duration = 0.15,
  type = "sine",
  peakGain = 0.2
}) {
  if (!soundEnabled || !audioContext) {
    return;
  }

  ensureContextRunning();

  const startTime = audioContext.currentTime + startOffset;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playSequence(notes) {
  notes.forEach((note) => playTone(note));
}

export function playKeySound() {
  playTone({ frequency: 720, duration: 0.05, type: "square", peakGain: 0.08 });
}

export function playCountdownSound() {
  playTone({ frequency: 440, duration: 0.18, type: "triangle", peakGain: 0.2 });
}

export function playStartSound() {
  playSequence([
    { frequency: 523.25, startOffset: 0, duration: 0.14, type: "triangle", peakGain: 0.22 },
    { frequency: 659.25, startOffset: 0.1, duration: 0.14, type: "triangle", peakGain: 0.22 },
    { frequency: 783.99, startOffset: 0.2, duration: 0.26, type: "triangle", peakGain: 0.24 }
  ]);
}

export function playCorrectSound() {
  playSequence([
    { frequency: 659.25, startOffset: 0, duration: 0.12, type: "sine", peakGain: 0.22 },
    { frequency: 987.77, startOffset: 0.1, duration: 0.28, type: "sine", peakGain: 0.24 }
  ]);
}

export function playIncorrectSound() {
  playSequence([
    { frequency: 196, startOffset: 0, duration: 0.22, type: "sawtooth", peakGain: 0.18 }
  ]);
}

export function playPassSound() {
  playSequence([
    { frequency: 392, startOffset: 0, duration: 0.14, type: "sine", peakGain: 0.18 },
    { frequency: 294, startOffset: 0.12, duration: 0.2, type: "sine", peakGain: 0.16 }
  ]);
}

export function playResultSound() {
  playSequence([
    { frequency: 523.25, startOffset: 0, duration: 0.15, type: "triangle", peakGain: 0.2 },
    { frequency: 659.25, startOffset: 0.12, duration: 0.15, type: "triangle", peakGain: 0.2 },
    { frequency: 783.99, startOffset: 0.24, duration: 0.15, type: "triangle", peakGain: 0.2 },
    { frequency: 1046.5, startOffset: 0.36, duration: 0.35, type: "triangle", peakGain: 0.22 }
  ]);
}

// ============================================================
// 段位認定モード専用の効果音
// ============================================================

export function playComboSound(combo) {
  // コンボ数が増えるほど、少しだけ音程を上げる（上がりすぎないよう上限を設ける）
  const step = Math.min(combo, 12);
  const frequency = 587.33 * Math.pow(2, step / 24);
  playTone({ frequency, duration: 0.1, type: "triangle", peakGain: 0.18 });
}

export function playComboBreakSound() {
  playSequence([
    { frequency: 349.23, startOffset: 0, duration: 0.12, type: "sawtooth", peakGain: 0.16 },
    { frequency: 261.63, startOffset: 0.1, duration: 0.18, type: "sawtooth", peakGain: 0.16 }
  ]);
}

export function playUrgentTickSound() {
  playTone({ frequency: 880, duration: 0.06, type: "square", peakGain: 0.14 });
}

export function playTimeUpSound() {
  playSequence([
    { frequency: 220, startOffset: 0, duration: 0.3, type: "sawtooth", peakGain: 0.2 },
    { frequency: 164.81, startOffset: 0.22, duration: 0.4, type: "sawtooth", peakGain: 0.2 }
  ]);
}

export function playRankDecidedSound() {
  playSequence([
    { frequency: 392, startOffset: 0, duration: 0.16, type: "triangle", peakGain: 0.2 },
    { frequency: 523.25, startOffset: 0.14, duration: 0.16, type: "triangle", peakGain: 0.22 },
    { frequency: 659.25, startOffset: 0.28, duration: 0.16, type: "triangle", peakGain: 0.24 },
    { frequency: 783.99, startOffset: 0.42, duration: 0.5, type: "triangle", peakGain: 0.26 }
  ]);
}

export function playHighScoreSound() {
  playSequence([
    { frequency: 659.25, startOffset: 0, duration: 0.1, type: "square", peakGain: 0.2 },
    { frequency: 830.61, startOffset: 0.09, duration: 0.1, type: "square", peakGain: 0.2 },
    { frequency: 1046.5, startOffset: 0.18, duration: 0.1, type: "square", peakGain: 0.22 },
    { frequency: 1318.5, startOffset: 0.27, duration: 0.4, type: "square", peakGain: 0.24 }
  ]);
}

// ============================================================
// クエストモード専用の効果音
// ============================================================

export function playQuestEnemyAppearSound() {
  playSequence([
    { frequency: 220, startOffset: 0, duration: 0.14, type: "sawtooth", peakGain: 0.16 },
    { frequency: 174.61, startOffset: 0.12, duration: 0.2, type: "sawtooth", peakGain: 0.18 }
  ]);
}

export function playQuestBossAppearSound() {
  playSequence([
    { frequency: 130.81, startOffset: 0, duration: 0.22, type: "sawtooth", peakGain: 0.22 },
    { frequency: 146.83, startOffset: 0.18, duration: 0.22, type: "sawtooth", peakGain: 0.22 },
    { frequency: 110, startOffset: 0.36, duration: 0.4, type: "sawtooth", peakGain: 0.24 }
  ]);
}

// ------------------------------------------------------------
// 敵撃破音・アイテム獲得音（複数レイヤーを重ねた効果音）
// ------------------------------------------------------------
// この2つの効果音だけは複数の発振器・ノイズを同時に重ねるため、通常の
// playTone/playSequence（audioContext.destinationへ直接つなぐ経路）とは
// 別に、専用のミキシングバス（GainNode → DynamicsCompressorNode →
// destination）を都度作って経由させる。こうすることで、音量が重なって
// 大きくなりすぎる・音割れする事態を防ぎつつ、他の効果音（正解音・
// 不正解音・ボタン音・宝箱発見音など）が使う経路には一切手を加えない。

// performance.now()（壁時計時間）を基準にする。audioContext.currentTimeは
// AudioContextが実際に"running"へ遷移するまで進まないため、これを基準にすると
// resume()が遅れる・失敗する環境では2回目以降の再生が永久に無音化してしまう。
const QUEST_EFFECT_REPLAY_GUARD_MILLISECONDS = 80;
const QUEST_REVERB_DURATION_SECONDS = 0.32;
const QUEST_REVERB_DECAY = 2.6;

const QUEST_EFFECT_CONFIG = {
  enemyDefeat: {
    masterGain: 0.65,
    impact: { startOffset: 0, duration: 0.07, peakGain: 0.1, lowpassFrequency: 2000 },
    sweep: {
      type: "triangle",
      startOffset: 0.02,
      duration: 0.42,
      startFrequency: 480,
      endFrequency: 100,
      peakGain: 0.07
    },
    low: {
      type: "sine",
      startOffset: 0.05,
      duration: 0.34,
      startFrequency: 150,
      endFrequency: 62,
      peakGain: 0.085
    },
    brightType: "triangle",
    brightPeakGain: 0.05,
    brightNotes: [
      { startOffset: 0.4, duration: 0.1, frequency: 698.46 },
      { startOffset: 0.5, duration: 0.1, frequency: 830.61 },
      { startOffset: 0.6, duration: 0.13, frequency: 1046.5 }
    ]
  },
  bossDefeat: {
    masterGain: 0.75,
    reverbMix: 0.16,
    impact: { startOffset: 0, duration: 0.09, peakGain: 0.12, lowpassFrequency: 2000 },
    sweep: {
      type: "triangle",
      startOffset: 0.02,
      duration: 0.62,
      startFrequency: 560,
      endFrequency: 78,
      peakGain: 0.083
    },
    low: {
      type: "sine",
      startOffset: 0.06,
      duration: 0.52,
      startFrequency: 165,
      endFrequency: 55,
      peakGain: 0.1
    },
    brightType: "triangle",
    brightPeakGain: 0.06,
    brightNotes: [
      { startOffset: 0.62, duration: 0.12, frequency: 698.46 },
      { startOffset: 0.76, duration: 0.12, frequency: 830.61 },
      { startOffset: 0.9, duration: 0.12, frequency: 1046.5 },
      { startOffset: 1.04, duration: 0.16, frequency: 1318.51 }
    ]
  },
  itemAcquired: {
    masterGain: 0.7,
    reverbMix: 0.18,
    noteType: "triangle",
    notePeakGain: 0.095,
    notes: [
      { startOffset: 0, duration: 0.12, frequency: 440.0 },
      { startOffset: 0.13, duration: 0.12, frequency: 523.25 },
      { startOffset: 0.27, duration: 0.13, frequency: 659.25 },
      { startOffset: 0.42, duration: 0.16, frequency: 987.77 }
    ],
    sparkleDuration: 0.05,
    sparklePeakGain: 0.03,
    sparkles: [
      { startOffset: 0.3, frequency: 1975.53 },
      { startOffset: 0.36, frequency: 2349.32 },
      { startOffset: 0.46, frequency: 2793.83 },
      { startOffset: 0.55, frequency: 3135.96 }
    ],
    chordPeakGain: 0.06,
    chordTypes: ["triangle", "triangle", "sine"],
    chord: { startOffset: 0.6, duration: 0.55, frequencies: [659.25, 830.61, 987.77] }
  }
};

let activeQuestEffectGains = [];
let sharedReverbImpulseBuffer = null;
let lastQuestEnemyDefeatAt = -Infinity;
let lastQuestItemAcquiredAt = -Infinity;

/**
 * 敵撃破音・アイテム獲得音専用の、レイヤーをまとめて重ねるためのバス。
 * コンプレッサーを挟むことで、複数レイヤーが重なっても音割れしにくくする。
 */
function createQuestEffectBus(masterVolume) {
  const master = audioContext.createGain();
  master.gain.setValueAtTime(masterVolume, audioContext.currentTime);
  const compressor = audioContext.createDynamicsCompressor();
  master.connect(compressor);
  compressor.connect(audioContext.destination);
  return master;
}

/**
 * 簡易リバーブ用のインパルス応答を1つだけ生成し、以降は使い回す
 * （外部のインパルス応答ファイルは使用しない）。
 */
function getSharedReverbImpulse() {
  if (sharedReverbImpulseBuffer) {
    return sharedReverbImpulseBuffer;
  }
  const length = Math.max(
    1,
    Math.floor(audioContext.sampleRate * QUEST_REVERB_DURATION_SECONDS)
  );
  const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, QUEST_REVERB_DECAY);
    }
  }
  sharedReverbImpulseBuffer = impulse;
  return impulse;
}

function connectReverbSend(sourceNode, destinationBus, mix) {
  if (!mix) return;
  const convolver = audioContext.createConvolver();
  convolver.buffer = getSharedReverbImpulse();
  const sendGain = audioContext.createGain();
  sendGain.gain.setValueAtTime(mix, audioContext.currentTime);
  sourceNode.connect(convolver);
  convolver.connect(sendGain);
  sendGain.connect(destinationBus);
}

function registerActiveQuestEffectGain(gainNode, stopTime) {
  activeQuestEffectGains.push(gainNode);
  const cleanupDelayMs = Math.max(0, (stopTime - audioContext.currentTime) * 1000) + 80;
  setTimeout(() => {
    activeQuestEffectGains = activeQuestEffectGains.filter((node) => node !== gainNode);
  }, cleanupDelayMs);
}

/**
 * 敵撃破音・アイテム獲得音の1レイヤー分の音を、指定のバスへつないで再生する。
 * クリックノイズを防ぐため、音量は必ずexponentialRampで立ち上げ・立ち下げる。
 * endFrequencyを指定すると、開始周波数から終了周波数へ滑らかに変化させる
 * （下降音・低音レイヤーで使用）。
 */
function scheduleQuestTone(destinationBus, { type, frequency, endFrequency = null, startOffset, duration, peakGain }) {
  const startTime = audioContext.currentTime + startOffset;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency !== null) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), startTime + duration);
  }

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(destinationBus);

  oscillator.start(startTime);
  const stopTime = startTime + duration + 0.03;
  oscillator.stop(stopTime);
  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
  };

  registerActiveQuestEffectGain(gainNode, stopTime);
  return { gainNode, stopTime };
}

/**
 * 敵撃破音のレイヤー1（最後の一撃の衝撃音）専用の、短いノイズ音を再生する。
 * ローパスフィルターで高音を抑え、爆発音のように激しくなりすぎないようにする。
 */
function scheduleQuestNoiseImpact(destinationBus, { startOffset, duration, peakGain, lowpassFrequency }) {
  const startTime = audioContext.currentTime + startOffset;
  const bufferSize = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lowpassFrequency, startTime);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(peakGain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destinationBus);

  noiseSource.start(startTime);
  const stopTime = startTime + duration + 0.02;
  noiseSource.stop(stopTime);
  noiseSource.onended = () => {
    noiseSource.disconnect();
    filter.disconnect();
    gainNode.disconnect();
  };

  registerActiveQuestEffectGain(gainNode, stopTime);
}

/**
 * 再生中の敵撃破音・アイテム獲得音を、約0.05秒でフェードアウトして止める。
 * リタイアなど、演出を途中で打ち切る場面から呼び出す想定。
 */
export function stopQuestEffectSounds() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  activeQuestEffectGains.forEach((gainNode) => {
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    } catch (error) {
      // すでに再生し終えたノードでは何もしない
    }
  });
  activeQuestEffectGains = [];
}

/**
 * 敵撃破音。衝撃音（ノイズ）・下降する消滅音・低音の着地音・短い高音の
 * 4レイヤーを重ねる。isBoss: trueのときは、全体を引き延ばし高音を1つ
 * 増やし、軽い残響を加えた豪華な音にする（通常音の1.2倍以内の音量）。
 * @param {{isBoss?: boolean}} options
 */
export function playQuestEnemyDefeatSound(options = {}) {
  if (!soundEnabled || !audioContext) return;
  ensureContextRunning();

  const nowMs = performance.now();
  if (nowMs - lastQuestEnemyDefeatAt < QUEST_EFFECT_REPLAY_GUARD_MILLISECONDS) return;
  lastQuestEnemyDefeatAt = nowMs;

  const config = options.isBoss ? QUEST_EFFECT_CONFIG.bossDefeat : QUEST_EFFECT_CONFIG.enemyDefeat;
  const bus = createQuestEffectBus(config.masterGain);

  scheduleQuestNoiseImpact(bus, config.impact);

  scheduleQuestTone(bus, {
    type: config.sweep.type,
    frequency: config.sweep.startFrequency,
    endFrequency: config.sweep.endFrequency,
    startOffset: config.sweep.startOffset,
    duration: config.sweep.duration,
    peakGain: config.sweep.peakGain
  });

  const lowLayer = scheduleQuestTone(bus, {
    type: config.low.type,
    frequency: config.low.startFrequency,
    endFrequency: config.low.endFrequency,
    startOffset: config.low.startOffset,
    duration: config.low.duration,
    peakGain: config.low.peakGain
  });

  if (config.reverbMix) {
    connectReverbSend(lowLayer.gainNode, bus, config.reverbMix);
  }

  config.brightNotes.forEach((note) => {
    scheduleQuestTone(bus, {
      type: config.brightType,
      frequency: note.frequency,
      startOffset: note.startOffset,
      duration: note.duration,
      peakGain: config.brightPeakGain
    });
  });
}

/**
 * アイテム獲得音。低音から高音へ跳躍を交えて上昇する4音・きらめきの
 * 短音・最後の明るい和音の3レイヤーを重ねる、短いファンファーレ。
 */
export function playQuestItemAcquiredSound() {
  if (!soundEnabled || !audioContext) return;
  ensureContextRunning();

  const nowMs = performance.now();
  if (nowMs - lastQuestItemAcquiredAt < QUEST_EFFECT_REPLAY_GUARD_MILLISECONDS) return;
  lastQuestItemAcquiredAt = nowMs;

  const config = QUEST_EFFECT_CONFIG.itemAcquired;
  const bus = createQuestEffectBus(config.masterGain);

  config.notes.forEach((note) => {
    scheduleQuestTone(bus, {
      type: config.noteType,
      frequency: note.frequency,
      startOffset: note.startOffset,
      duration: note.duration,
      peakGain: config.notePeakGain
    });
  });

  config.sparkles.forEach((sparkle) => {
    scheduleQuestTone(bus, {
      type: "sine",
      frequency: sparkle.frequency,
      startOffset: sparkle.startOffset,
      duration: config.sparkleDuration,
      peakGain: config.sparklePeakGain
    });
  });

  let lastChordLayer = null;
  config.chord.frequencies.forEach((frequency, index) => {
    lastChordLayer = scheduleQuestTone(bus, {
      type: config.chordTypes[index % config.chordTypes.length],
      frequency,
      startOffset: config.chord.startOffset,
      duration: config.chord.duration,
      peakGain: config.chordPeakGain
    });
  });

  if (config.reverbMix && lastChordLayer) {
    connectReverbSend(lastChordLayer.gainNode, bus, config.reverbMix);
  }
}

export function playQuestTreasureFoundSound() {
  playTone({ frequency: 523.25, duration: 0.2, type: "triangle", peakGain: 0.18 });
}

export function playQuestTreasureOpenSound() {
  playSequence([
    { frequency: 392, startOffset: 0, duration: 0.1, type: "triangle", peakGain: 0.16 },
    { frequency: 523.25, startOffset: 0.08, duration: 0.1, type: "triangle", peakGain: 0.18 },
    { frequency: 659.25, startOffset: 0.16, duration: 0.2, type: "triangle", peakGain: 0.2 }
  ]);
}

export function playQuestRetreatSound() {
  playSequence([
    { frequency: 349.23, startOffset: 0, duration: 0.2, type: "sawtooth", peakGain: 0.18 },
    { frequency: 261.63, startOffset: 0.16, duration: 0.2, type: "sawtooth", peakGain: 0.16 },
    { frequency: 196, startOffset: 0.32, duration: 0.35, type: "sawtooth", peakGain: 0.16 }
  ]);
}

export function playQuestClearSound() {
  playSequence([
    { frequency: 523.25, startOffset: 0, duration: 0.16, type: "triangle", peakGain: 0.22 },
    { frequency: 659.25, startOffset: 0.14, duration: 0.16, type: "triangle", peakGain: 0.22 },
    { frequency: 783.99, startOffset: 0.28, duration: 0.16, type: "triangle", peakGain: 0.24 },
    { frequency: 1046.5, startOffset: 0.42, duration: 0.2, type: "triangle", peakGain: 0.24 },
    { frequency: 1318.5, startOffset: 0.62, duration: 0.5, type: "triangle", peakGain: 0.26 }
  ]);
}
