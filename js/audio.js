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
