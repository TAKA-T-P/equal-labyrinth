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
