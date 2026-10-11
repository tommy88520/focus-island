// 用 Web Audio 即時合成的環境音（雨聲、海浪、圖書館）。
//
// 為什麼不用 mp3：自然音（雨、浪）錄成檔案循環播放，接縫和重複感很容易被聽出來；
// 合成的做法是「穩定的底噪 + 隨機觸發的事件（雨滴、浪、翻書…）」，每次聽都不一樣，
// 也沒有循環點。所有隨機事件都是排程在 AudioContext 時間軸上，不依賴 setTimeout 的精度。

// 前五種加 beats / chiptune 是可選的音樂；beach 以後是「場景環境音」，跟著人走到哪個區域自動疊在音樂下面
export type SynthKind = 'rain' | 'ocean' | 'library' | 'blues' | 'classical' | 'beats' | 'chiptune' | SoundscapeKind;
export type SoundscapeKind = 'beach' | 'city' | 'market' | 'zoo' | 'f1';

interface NoiseBuffers {
  pink: AudioBuffer;
  brown: AudioBuffer;
}

interface SynthSession {
  output: GainNode;
  stop: () => void;
}

type SessionFactory = (ctx: AudioContext, noise: NoiseBuffers, out: AudioNode, track: Tracker) => void;

const NOISE_SECONDS = 12;
const LOOP_CROSSFADE_SECONDS = 0.6;
const SCHEDULE_AHEAD_SECONDS = 3;
const SCHEDULER_TICK_MS = 400;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ---------- 噪音緩衝 ----------

// 頭尾做等功率交叉淡化，循環播放時不會有喀噠聲或低頻突波。
function makeSeamless(data: Float32Array, sampleRate: number): Float32Array {
  const fade = Math.floor(LOOP_CROSSFADE_SECONDS * sampleRate);
  const length = data.length - fade;
  const out = new Float32Array(length);
  out.set(data.subarray(0, length));
  for (let i = 0; i < fade; i += 1) {
    const w = i / fade;
    out[i] = (data[i] ?? 0) * Math.sqrt(w) + (data[length + i] ?? 0) * Math.sqrt(1 - w);
  }
  return out;
}

function createNoiseBuffers(ctx: AudioContext): NoiseBuffers {
  const sampleRate = ctx.sampleRate;
  const total = Math.floor(NOISE_SECONDS * sampleRate) + Math.floor(LOOP_CROSSFADE_SECONDS * sampleRate);
  const pink = ctx.createBuffer(2, total - Math.floor(LOOP_CROSSFADE_SECONDS * sampleRate), sampleRate);
  const brown = ctx.createBuffer(2, pink.length, sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const rawPink = new Float32Array(total);
    const rawBrown = new Float32Array(total);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    let last = 0;
    for (let i = 0; i < total; i += 1) {
      const white = Math.random() * 2 - 1;
      // Paul Kellet 的 pink noise 近似
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      rawPink[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      // 漏電積分的 brown noise
      last = (last + 0.02 * white) / 1.02;
      rawBrown[i] = last * 3.5;
    }
    pink.copyToChannel(makeSeamless(rawPink, sampleRate) as Float32Array<ArrayBuffer>, channel);
    brown.copyToChannel(makeSeamless(rawBrown, sampleRate) as Float32Array<ArrayBuffer>, channel);
  }
  return { pink, brown };
}

// ---------- 節點與排程工具 ----------

// 記錄這個 session 建立的來源與計時器，stop 時一次清掉。
class Tracker {
  sources: AudioScheduledSourceNode[] = [];
  timers: number[] = [];

  addSource<T extends AudioScheduledSourceNode>(node: T): T {
    this.sources.push(node);
    return node;
  }

  dispose(): void {
    this.timers.forEach((id) => window.clearInterval(id));
    this.timers = [];
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // 已經停過了
      }
    }
    this.sources = [];
  }
}

function loopNoise(ctx: AudioContext, buffer: AudioBuffer, track: Tracker): AudioBufferSourceNode {
  const source = track.addSource(ctx.createBufferSource());
  source.buffer = buffer;
  source.loop = true;
  // 每個來源從不同位置開始，左右聲道與多層之間才不會同相
  source.start(0, Math.random() * buffer.duration);
  return source;
}

function biquad(ctx: AudioContext, type: BiquadFilterType, frequency: number, q = 0.707): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

function gainNode(ctx: AudioContext, value: number): GainNode {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

// 一個短促的噪音事件：濾波 + 包絡 + 左右位置。雨滴、翻書、按鍵都是它。
interface BurstOptions {
  buffer: AudioBuffer;
  when: number;
  duration: number;
  attack: number;
  peak: number;
  filter: BiquadFilterType;
  frequency: number;
  frequencyEnd?: number;
  q: number;
  pan: number;
}

function burst(ctx: AudioContext, out: AudioNode, track: Tracker, options: BurstOptions): void {
  const source = track.addSource(ctx.createBufferSource());
  source.buffer = options.buffer;
  const filter = biquad(ctx, options.filter, options.frequency, options.q);
  if (options.frequencyEnd !== undefined) {
    filter.frequency.setValueAtTime(options.frequency, options.when);
    filter.frequency.exponentialRampToValueAtTime(options.frequencyEnd, options.when + options.duration);
  }
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, options.when);
  envelope.gain.linearRampToValueAtTime(options.peak, options.when + options.attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, options.when + options.duration);
  const panner = ctx.createStereoPanner();
  panner.pan.value = options.pan;

  source.connect(filter).connect(envelope).connect(panner).connect(out);
  const offset = Math.random() * Math.max(0.1, options.buffer.duration - options.duration - 0.2);
  source.start(options.when, offset, options.duration + 0.05);
  source.onended = () => {
    panner.disconnect();
    track.sources = track.sources.filter((s) => s !== source);
  };
}

// 在 AudioContext 時間軸上提前排程：fire(when) 回傳「距離下一次事件幾秒」。
function scheduleEvents(ctx: AudioContext, track: Tracker, fire: (when: number) => number, startDelay = 0): void {
  let nextAt = ctx.currentTime + startDelay;
  const tick = () => {
    const horizon = ctx.currentTime + SCHEDULE_AHEAD_SECONDS;
    while (nextAt < horizon) {
      nextAt += Math.max(0.01, fire(Math.max(nextAt, ctx.currentTime)));
    }
  };
  tick();
  track.timers.push(window.setInterval(tick, SCHEDULER_TICK_MS));
}

// 先快後慢的鐘形曲線，用來描述一道浪從湧起到退去的音量／亮度。
function waveCurve(base: number, peak: number, points = 96): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i += 1) {
    const x = i / (points - 1);
    const shaped = Math.sin(Math.PI * Math.pow(x, 0.62)) ** 2;
    curve[i] = base + (peak - base) * shaped;
  }
  return curve;
}

// ---------- 三種環境 ----------

const buildRain: SessionFactory = (ctx, noise, out, track) => {
  // 持續的雨幕：中高頻沙沙聲
  const wash = gainNode(ctx, 0.2);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'highpass', 700)).connect(biquad(ctx, 'lowpass', 7500)).connect(wash).connect(out);

  // 雨聲的身體：中頻
  const body = gainNode(ctx, 0.1);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 1600, 0.5)).connect(body).connect(out);

  // 遠處的低頻轟鳴
  const rumble = gainNode(ctx, 0.22);
  loopNoise(ctx, noise.brown, track).connect(biquad(ctx, 'lowpass', 260)).connect(rumble).connect(out);

  // 雨勢緩慢的強弱起伏
  const lfo = track.addSource(ctx.createOscillator());
  lfo.frequency.value = 0.06;
  const lfoDepth = gainNode(ctx, 0.05);
  lfo.connect(lfoDepth).connect(wash.gain);
  lfo.start();

  // 近處的雨滴：大量極短的高頻點
  scheduleEvents(ctx, track, (when) => {
    burst(ctx, out, track, {
      buffer: noise.pink,
      when,
      duration: rand(0.018, 0.06),
      attack: 0.002,
      peak: rand(0.03, 0.16),
      filter: 'bandpass',
      frequency: rand(1800, 6500),
      q: rand(3, 9),
      pan: rand(-0.85, 0.85),
    });
    return rand(0.012, 0.055);
  });

  // 偶爾較大的水滴落在東西上
  scheduleEvents(ctx, track, (when) => {
    burst(ctx, out, track, {
      buffer: noise.pink,
      when,
      duration: rand(0.07, 0.16),
      attack: 0.004,
      peak: rand(0.05, 0.11),
      filter: 'bandpass',
      frequency: rand(500, 1300),
      q: rand(4, 10),
      pan: rand(-0.7, 0.7),
    });
    return rand(0.5, 2.2);
  });
};

const buildOcean: SessionFactory = (ctx, noise, out, track) => {
  // 深處不間斷的低頻
  const deep = gainNode(ctx, 0.2);
  loopNoise(ctx, noise.brown, track).connect(biquad(ctx, 'lowpass', 420)).connect(deep).connect(out);

  // 浪：一個噪音來源，音量和濾波器亮度隨每道浪的曲線變化
  const swell = gainNode(ctx, 0.04);
  const swellFilter = biquad(ctx, 'lowpass', 350, 0.6);
  const swellPan = ctx.createStereoPanner();
  loopNoise(ctx, noise.pink, track).connect(swellFilter).connect(swell).connect(swellPan).connect(out);

  // 浪退去時的泡沫嘶聲，比浪晚一點出現
  const foam = gainNode(ctx, 0);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'highpass', 2200)).connect(biquad(ctx, 'lowpass', 8000)).connect(foam).connect(out);

  scheduleEvents(ctx, track, (when) => {
    const rise = rand(3.4, 4.6);
    const fall = rand(4.6, 6.2);
    const total = rise + fall;
    const peak = rand(0.32, 0.5);

    swell.gain.cancelScheduledValues(when);
    swell.gain.setValueCurveAtTime(waveCurve(0.04, peak), when, total);
    swellFilter.frequency.cancelScheduledValues(when);
    swellFilter.frequency.setValueCurveAtTime(waveCurve(350, rand(1500, 2400)), when, total);
    swellPan.pan.setValueAtTime(rand(-0.4, 0.4), when);

    const foamStart = when + rise * 0.65;
    foam.gain.cancelScheduledValues(foamStart);
    foam.gain.setValueCurveAtTime(waveCurve(0, rand(0.07, 0.14)), foamStart, fall * 1.1);

    // 下一道浪要等這一道（含泡沫）結束，曲線不能重疊
    return Math.max(total, rise * 0.65 + fall * 1.1) + rand(0.4, 3);
  });
};

const buildLibrary: SessionFactory = (ctx, noise, out, track) => {
  // 房間底噪：空調的低頻嗡聲
  const hvac = gainNode(ctx, 0.3);
  loopNoise(ctx, noise.brown, track).connect(biquad(ctx, 'lowpass', 210)).connect(hvac).connect(out);

  // 空氣流動的極輕微嘶聲
  const air = gainNode(ctx, 0.022);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 800, 0.35)).connect(air).connect(out);

  // 翻書：兩段掃過高頻的氣音
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pan = rand(-0.6, 0.6);
      const first = rand(0.16, 0.26);
      burst(ctx, out, track, {
        buffer: noise.pink,
        when,
        duration: first,
        attack: 0.035,
        peak: rand(0.09, 0.15),
        filter: 'bandpass',
        frequency: 2200,
        frequencyEnd: 5600,
        q: 0.9,
        pan,
      });
      if (Math.random() < 0.45) {
        burst(ctx, out, track, {
          buffer: noise.pink,
          when: when + first + rand(0.05, 0.12),
          duration: rand(0.08, 0.14),
          attack: 0.02,
          peak: rand(0.03, 0.06),
          filter: 'bandpass',
          frequency: 3000,
          frequencyEnd: 5200,
          q: 1,
          pan,
        });
      }
      return rand(9, 26);
    },
    rand(2, 6),
  );

  // 鉛筆在紙上書寫：幾道短促的沙沙
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pan = rand(-0.7, 0.7);
      let cursor = when;
      const strokes = Math.floor(rand(3, 8));
      for (let i = 0; i < strokes; i += 1) {
        const length = rand(0.1, 0.3);
        burst(ctx, out, track, {
          buffer: noise.pink,
          when: cursor,
          duration: length,
          attack: length * 0.3,
          peak: rand(0.025, 0.05),
          filter: 'bandpass',
          frequency: rand(3200, 4800),
          q: 2.2,
          pan,
        });
        cursor += length + rand(0.04, 0.18);
      }
      return rand(14, 38);
    },
    rand(4, 12),
  );

  // 遠處有人打字：一小串長短不一的按鍵聲
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pan = rand(-0.9, 0.9);
      let cursor = when;
      const keys = Math.floor(rand(6, 22));
      for (let i = 0; i < keys; i += 1) {
        burst(ctx, out, track, {
          buffer: noise.pink,
          when: cursor,
          duration: 0.014,
          attack: 0.001,
          peak: rand(0.04, 0.09),
          filter: 'bandpass',
          frequency: rand(1800, 2800),
          q: 1.4,
          pan,
        });
        burst(ctx, out, track, {
          buffer: noise.brown,
          when: cursor,
          duration: 0.035,
          attack: 0.002,
          peak: rand(0.03, 0.07),
          filter: 'lowpass',
          frequency: 220,
          q: 0.7,
          pan,
        });
        // 偶爾停頓思考，一般是連續敲擊
        cursor += Math.random() < 0.12 ? rand(0.4, 1.1) : rand(0.07, 0.22);
      }
      return rand(22, 55);
    },
    rand(8, 20),
  );
};


// ---------- 音樂：樂器 ----------

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T;

// 房間迴響：用指數衰減的雙聲道噪音當脈衝響應
function createReverbBus(ctx: AudioContext, out: AudioNode, seconds: number, wetLevel: number): GainNode {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  const send = gainNode(ctx, wetLevel);
  const bus = gainNode(ctx, 1);
  bus.connect(out);
  bus.connect(send).connect(convolver).connect(out);
  return bus;
}

// 每個音符都是一組臨時的振盪器；必須在排定時間才啟動（包絡的增益預設是 1，提早啟動會立刻出聲），結束後自己斷線並從追蹤清單移除
function voiceEnd(track: Tracker, sources: AudioScheduledSourceNode[], nodes: AudioNode[], startTime: number, endTime: number): void {
  for (const source of sources) {
    track.addSource(source);
    source.start(startTime);
    source.stop(endTime);
  }
  const last = sources[0];
  if (!last) return;
  last.onended = () => {
    for (const node of nodes) node.disconnect();
    track.sources = track.sources.filter((src) => !sources.includes(src));
  };
}

// 電鋼琴（Rhodes 風格）：FM 合成，調變量隨時間衰減，所以音頭明亮、尾巴圓潤
function playRhodes(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, velocity: number, pan: number): void {
  const frequency = midiToHz(midi);
  const carrier = ctx.createOscillator();
  carrier.frequency.value = frequency;
  const modulator = ctx.createOscillator();
  modulator.frequency.value = frequency;
  const modulation = ctx.createGain();
  const index = frequency * (0.9 + velocity * 1.6);
  modulation.gain.setValueAtTime(index, when);
  modulation.gain.exponentialRampToValueAtTime(frequency * 0.08, when + duration * 0.7);
  modulator.connect(modulation).connect(carrier.frequency);

  // 高八度的金屬音叉泛音
  const tine = ctx.createOscillator();
  tine.frequency.value = frequency * 4;
  const tineGain = gainNode(ctx, 0);
  tineGain.gain.setValueAtTime(velocity * 0.05, when);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  tine.connect(tineGain);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(velocity * 0.22, when + 0.006);
  envelope.gain.setTargetAtTime(0, when + 0.02, duration / 3.2);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;

  carrier.connect(envelope);
  tineGain.connect(envelope);
  envelope.connect(panner).connect(bus);
  voiceEnd(track, [carrier, modulator, tine], [envelope, modulation, tineGain, panner], when, when + duration + 0.4);
}

// 貝斯：三角波加一個八度下的正弦，低通後很圓
function playBass(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, velocity: number): void {
  const frequency = midiToHz(midi);
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.value = frequency;
  const sub = ctx.createOscillator();
  sub.frequency.value = frequency;
  const filter = biquad(ctx, 'lowpass', 520 + velocity * 500, 0.8);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(velocity * 0.42, when + 0.012);
  envelope.gain.setTargetAtTime(0, when + 0.05, duration / 3);
  body.connect(filter);
  sub.connect(filter);
  filter.connect(envelope).connect(bus);
  voiceEnd(track, [body, sub], [filter, envelope], when, when + duration + 0.3);
}

// 主奏（吉他／薩克斯之間的音色）：鋸齒波低通，帶輕微顫音
function playLead(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, velocity: number, pan: number): void {
  const frequency = midiToHz(midi);
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = frequency;
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = rand(4.6, 5.8);
  const vibratoDepth = gainNode(ctx, 0);
  vibratoDepth.gain.setValueAtTime(0, when);
  vibratoDepth.gain.linearRampToValueAtTime(rand(6, 12), when + duration * 0.6);
  vibrato.connect(vibratoDepth).connect(oscillator.detune);
  const filter = biquad(ctx, 'lowpass', 1500 + velocity * 1400, 1.1);
  filter.frequency.setValueAtTime(900, when);
  filter.frequency.linearRampToValueAtTime(1500 + velocity * 1400, when + 0.08);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(velocity * 0.06, when + 0.035);
  envelope.gain.setTargetAtTime(velocity * 0.04, when + 0.06, 0.15);
  envelope.gain.setTargetAtTime(0, when + duration, 0.07);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  oscillator.connect(filter).connect(envelope).connect(panner).connect(bus);
  voiceEnd(track, [oscillator, vibrato], [vibratoDepth, filter, envelope, panner], when, when + duration + 0.6);
}

// 原音鋼琴：基音 + 泛音 + 輕微失諧的第二根弦，低音比高音共鳴更久
function playPiano(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, velocity: number, pan: number): void {
  const frequency = midiToHz(midi);
  const decay = Math.max(1.3, Math.min(3.6, 3.7 - (midi - 48) * 0.035));
  const fundamental = ctx.createOscillator();
  fundamental.frequency.value = frequency;
  const second = ctx.createOscillator();
  second.frequency.value = frequency * 2;
  const stringPair = ctx.createOscillator();
  stringPair.type = 'triangle';
  stringPair.frequency.value = frequency * 1.0035;

  const partials = ctx.createGain();
  const secondGain = gainNode(ctx, 0.3);
  const pairGain = gainNode(ctx, 0.35);
  fundamental.connect(partials);
  second.connect(secondGain).connect(partials);
  stringPair.connect(pairGain).connect(partials);

  const filter = biquad(ctx, 'lowpass', 1800 + velocity * 3200, 0.5);
  filter.frequency.setValueAtTime(1800 + velocity * 3200, when);
  filter.frequency.exponentialRampToValueAtTime(900, when + decay * 0.8);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(velocity * 0.2, when + 0.004);
  envelope.gain.setTargetAtTime(0, when + 0.012, decay / 4.2);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  partials.connect(filter).connect(envelope).connect(panner).connect(bus);
  voiceEnd(track, [fundamental, second, stringPair], [partials, secondGain, pairGain, filter, envelope, panner], when, when + decay + 0.6);
}

// 弦樂長音墊底（大提琴低音）
function playPad(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, level: number): void {
  const frequency = midiToHz(midi);
  const sources: OscillatorNode[] = [];
  const filter = biquad(ctx, 'lowpass', 520, 0.6);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(level, when + duration * 0.35);
  envelope.gain.linearRampToValueAtTime(0.0001, when + duration);
  for (const detune of [-7, 7]) {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    oscillator.connect(filter);
    sources.push(oscillator);
  }
  filter.connect(envelope).connect(bus);
  voiceEnd(track, sources, [filter, envelope], when, when + duration + 0.2);
}

function playKick(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, velocity: number): void {
  const oscillator = ctx.createOscillator();
  oscillator.frequency.setValueAtTime(115, when);
  oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.13);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(velocity * 0.28, when);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
  oscillator.connect(envelope).connect(bus);
  voiceEnd(track, [oscillator], [envelope], when, when + 0.32);
}

// ---------- 音樂：藍調 ----------

const BLUES_BPM = 68;
const BLUES_ROOT_MIDI = 57; // A3
// 十二小節藍調：I I I I IV IV I I V IV I V（以半音距離表示和弦根音）
const BLUES_PROGRESSION = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
const BLUES_SCALE = [0, 3, 5, 6, 7, 10, 12, 15, 17, 18, 19, 22];
const COMP_PATTERNS: number[][] = [[0, 7], [0, 5, 8], [0, 6], [0, 4, 8], [0, 7, 10]];

function seventhVoicing(rootMidi: number): number[] {
  const base = [rootMidi + 4, rootMidi + 7, rootMidi + 10, rootMidi + 14];
  const mean = base.reduce((sum, note) => sum + note, 0) / base.length;
  const shift = Math.round((64 - mean) / 12) * 12;
  return base.map((note) => note + shift);
}

const buildBlues: SessionFactory = (ctx, noise, out, track) => {
  const bus = createReverbBus(ctx, out, 2.0, 0.22);
  const beat = 60 / BLUES_BPM;
  const stepSeconds = beat / 3; // 每拍三連音，兩短一長就是搖擺感
  let step = 0;
  let compPattern = COMP_PATTERNS[0] as number[];

  scheduleEvents(
    ctx,
    track,
    (rawWhen) => {
      const when = rawWhen + rand(-0.006, 0.012);
      const barInChorus = Math.floor(step / 12) % 12;
      const chorus = Math.floor(step / 144);
      const stepInBar = step % 12;
      const rootOffset = BLUES_PROGRESSION[barInChorus] as number;
      const nextOffset = BLUES_PROGRESSION[(barInChorus + 1) % 12] as number;
      const rootMidi = BLUES_ROOT_MIDI + rootOffset;

      if (stepInBar === 0) compPattern = pick(COMP_PATTERNS);

      // 電鋼琴伴奏：七和弦，音符之間有一點掃弦的時差
      if (compPattern.includes(stepInBar)) {
        const voicing = seventhVoicing(rootMidi);
        const velocity = stepInBar === 0 ? rand(0.55, 0.75) : rand(0.35, 0.55);
        voicing.forEach((note, index) => {
          if (Math.random() < 0.9) {
            playRhodes(ctx, bus, track, when + index * 0.014, note, beat * 1.6, velocity, rand(-0.3, 0.3));
          }
        });
      }

      // 走動貝斯：根音、三音、五音、六音；換和弦前用半音接到下一個根音
      if (stepInBar % 3 === 0) {
        const beatIndex = stepInBar / 3;
        const bassRoot = rootMidi - 12;
        const walk = [0, 4, 7, 9];
        let note = bassRoot + (walk[beatIndex] as number);
        if (beatIndex === 3 && nextOffset !== rootOffset) {
          note = BLUES_ROOT_MIDI - 12 + nextOffset + (nextOffset > rootOffset ? -1 : 1);
        }
        playBass(ctx, bus, track, when, note, beat * 0.85, beatIndex === 0 ? rand(0.7, 0.9) : rand(0.5, 0.7));
      }

      // 鼓：搖擺的 ride、輕柔的底鼓、刷子軍鼓
      if (stepInBar % 3 !== 1) {
        burst(ctx, bus, track, {
          buffer: noise.pink,
          when,
          duration: stepInBar % 3 === 0 ? 0.22 : 0.12,
          attack: 0.002,
          peak: stepInBar % 3 === 0 ? rand(0.05, 0.08) : rand(0.025, 0.045),
          filter: 'highpass',
          frequency: 7200,
          q: 0.7,
          pan: 0.25,
        });
      }
      if (stepInBar === 0 || (stepInBar === 6 && Math.random() < 0.6)) {
        playKick(ctx, bus, track, when, rand(0.35, 0.55));
      }
      if (stepInBar === 3 || stepInBar === 9) {
        burst(ctx, bus, track, {
          buffer: noise.pink,
          when,
          duration: 0.2,
          attack: 0.008,
          peak: rand(0.05, 0.08),
          filter: 'bandpass',
          frequency: 3000,
          q: 0.6,
          pan: -0.2,
        });
      }

      // 主奏：奇數合唱必定即興，偶數合唱偶爾出現；只在小節開頭起句
      if (stepInBar === 0 && barInChorus % 2 === 0 && Math.random() < (chorus % 2 === 1 ? 0.75 : 0.25)) {
        let index = Math.floor(rand(4, 9));
        let offsetSteps = Math.floor(rand(1, 4));
        const noteCount = Math.floor(rand(3, 7));
        for (let i = 0; i < noteCount && offsetSteps < 20; i += 1) {
          const last = i === noteCount - 1;
          const length = last ? Math.floor(rand(4, 8)) : Math.floor(rand(1, 4));
          playLead(ctx, bus, track, when + offsetSteps * stepSeconds, BLUES_ROOT_MIDI + (BLUES_SCALE[index] as number), length * stepSeconds, rand(0.6, 0.9), 0.15);
          offsetSteps += length;
          index = Math.max(0, Math.min(BLUES_SCALE.length - 1, index + (pick([-2, -1, -1, 0, 1, 1, 2]))));
        }
      }

      step += 1;
      return stepSeconds;
    },
    0.4,
  );
};

// ---------- 音樂：古典鋼琴 ----------

const CLASSICAL_BPM = 62;
// 每小節五個音（低音、次低音、三個高音），照巴哈 C 大調前奏曲的和聲走向，最後回到主和弦後循環
const CLASSICAL_BARS: number[][] = [
  [60, 64, 67, 72, 76],
  [60, 62, 69, 74, 77],
  [59, 62, 67, 74, 77],
  [60, 64, 67, 72, 76],
  [60, 64, 69, 76, 81],
  [60, 62, 69, 74, 78],
  [59, 62, 67, 74, 79],
  [59, 60, 64, 67, 72],
  [57, 60, 64, 67, 72],
  [54, 60, 62, 69, 72],
  [55, 59, 62, 67, 71],
  [55, 60, 62, 65, 67],
  [48, 55, 60, 64, 67],
];

const buildClassical: SessionFactory = (ctx, _noise, out, track) => {
  const bus = createReverbBus(ctx, out, 2.8, 0.34);
  const baseStep = 60 / CLASSICAL_BPM / 4;
  let step = 0;

  scheduleEvents(
    ctx,
    track,
    (rawWhen) => {
      const when = rawWhen + rand(-0.004, 0.014);
      const barIndex = Math.floor(step / 16) % CLASSICAL_BARS.length;
      const stepInBar = step % 16;
      const chord = CLASSICAL_BARS[barIndex] as number[];

      // 每小節 8 個音的琶音，重複兩次：低、次低、高三音上去再回來
      const pattern = [0, 1, 2, 3, 4, 2, 3, 4];
      const note = chord[pattern[stepInBar % 8] as number] as number;
      const accent = stepInBar % 8 === 0 ? 1.15 : stepInBar % 2 === 0 ? 0.95 : 0.8;
      playPiano(ctx, bus, track, when, note, rand(0.5, 0.7) * accent, (note - 66) / 40);

      // 小節開頭加一條低八度的弦樂長音
      if (stepInBar === 0) {
        playPad(ctx, bus, track, when, (chord[0] as number) - 12, baseStep * 16 * 1.05, 0.06);
      }

      step += 1;
      // 速度緩慢地呼吸：像真人演奏的 rubato
      return baseStep * (1 + 0.05 * Math.sin(step / 38));
    },
    0.4,
  );
};

// ---------- 音樂：自習 Beats（生成式 lofi） ----------

interface LofiChord {
  bass: number;
  notes: number[];
}

interface LofiProgression {
  chords: LofiChord[];
  scale: number[];
}

// 四小節一輪的爵士和弦（ii–V–I–vi 之類），旋律只用該調的五聲音階，怎麼走都不會難聽
const LOFI_PROGRESSIONS: LofiProgression[] = [
  {
    // Gm9 – C13 – Fmaj9 – Dm9
    chords: [
      { bass: 43, notes: [58, 62, 65, 69] },
      { bass: 36, notes: [52, 58, 62, 69] },
      { bass: 41, notes: [57, 60, 64, 67] },
      { bass: 38, notes: [53, 57, 60, 64] },
    ],
    scale: [65, 67, 69, 72, 74, 77, 79, 81],
  },
  {
    // Ebmaj9 – Dm9 – Cm9 – F9sus
    chords: [
      { bass: 39, notes: [55, 58, 62, 65] },
      { bass: 38, notes: [53, 57, 60, 64] },
      { bass: 36, notes: [51, 55, 58, 62] },
      { bass: 41, notes: [55, 58, 60, 63] },
    ],
    scale: [65, 67, 70, 72, 74, 77, 79, 82],
  },
  {
    // Bbmaj9 – Am7 – Gm9 – C9sus
    chords: [
      { bass: 34, notes: [57, 60, 62, 65] },
      { bass: 45, notes: [55, 60, 64, 67] },
      { bass: 43, notes: [58, 62, 65, 69] },
      { bass: 36, notes: [58, 60, 62, 65] },
    ],
    scale: [65, 67, 69, 72, 74, 77, 79, 81],
  },
];

const BEATS_BPM = 76;

function playSnare(ctx: AudioContext, bus: AudioNode, track: Tracker, noise: NoiseBuffers, when: number, peak: number): void {
  burst(ctx, bus, track, { buffer: noise.pink, when, duration: 0.2, attack: 0.003, peak, filter: 'bandpass', frequency: 1700, q: 0.8, pan: -0.1 });
  burst(ctx, bus, track, { buffer: noise.brown, when, duration: 0.09, attack: 0.002, peak: peak * 1.4, filter: 'lowpass', frequency: 420, q: 0.7, pan: 0 });
}

function playHat(ctx: AudioContext, bus: AudioNode, track: Tracker, noise: NoiseBuffers, when: number, peak: number, open = false): void {
  burst(ctx, bus, track, { buffer: noise.pink, when, duration: open ? 0.16 : 0.045, attack: 0.001, peak, filter: 'highpass', frequency: 7000, q: 0.7, pan: 0.3 });
}

const buildBeats: SessionFactory = (ctx, noise, out, track) => {
  // 整條音軌過一個低通，像錄音帶一樣溫暖、不刺耳
  const tone = biquad(ctx, 'lowpass', 2600, 0.5);
  tone.connect(out);
  const bus = createReverbBus(ctx, tone, 1.6, 0.18);
  const stepSeconds = 60 / BEATS_BPM / 4;
  const swing = stepSeconds * 0.2;
  let step = 0;
  let progression = LOFI_PROGRESSIONS[0] as LofiProgression;
  let drumsOn = false;

  // 黑膠：極小的底噪 + 偶爾的爆裂聲（不進低通，才聽得到）
  const hiss = gainNode(ctx, 0.008);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 4200, 0.6)).connect(hiss).connect(out);
  scheduleEvents(ctx, track, (when) => {
    burst(ctx, out, track, { buffer: noise.pink, when, duration: rand(0.004, 0.012), attack: 0.0008, peak: rand(0.02, 0.07), filter: 'highpass', frequency: rand(2500, 6000), q: 0.7, pan: rand(-0.5, 0.5) });
    return rand(0.05, 0.5);
  });

  scheduleEvents(
    ctx,
    track,
    (rawWhen) => {
      const stepInBar = step % 16;
      const bar = Math.floor(step / 16);
      // 反拍的十六分音符往後拖一點，就是 lofi 那種慵懶的搖擺
      const when = rawWhen + (stepInBar % 2 === 1 ? swing : 0) + rand(-0.004, 0.006);
      const beat = stepSeconds * 4;

      if (step % 64 === 0) {
        // 每四小節可能換一組和弦；前四小節是前奏不打鼓，之後每 16 小節空一小段讓耳朵休息
        if (bar > 0 && Math.random() < 0.4) progression = pick(LOFI_PROGRESSIONS);
        drumsOn = bar >= 4 && bar % 16 !== 12;
      }
      const chord = progression.chords[bar % 4] as LofiChord;

      // 和弦：小節頭彈長音，第三拍後半偶爾補一下切分
      if (stepInBar === 0 || (stepInBar === 10 && Math.random() < 0.45)) {
        const velocity = stepInBar === 0 ? rand(0.38, 0.5) : rand(0.25, 0.35);
        const length = stepInBar === 0 ? beat * 2.4 : beat * 1.2;
        chord.notes.forEach((note, index) => {
          playRhodes(ctx, bus, track, when + index * rand(0.012, 0.024), note, length, velocity, rand(-0.35, 0.35));
        });
      }

      // 貝斯：根音落在 1 和 3 拍附近，偶爾一個往下一個和弦的經過音
      if (stepInBar === 0) playBass(ctx, bus, track, when, chord.bass, beat * 1.4, rand(0.6, 0.75));
      if (stepInBar === 7 && Math.random() < 0.5) playBass(ctx, bus, track, when, chord.bass + 7, beat * 0.6, rand(0.4, 0.5));
      if (stepInBar === 10) playBass(ctx, bus, track, when, chord.bass, beat * 1.1, rand(0.5, 0.65));
      if (stepInBar === 14 && Math.random() < 0.3) {
        const next = progression.chords[(bar + 1) % 4] as LofiChord;
        playBass(ctx, bus, track, when, next.bass + (next.bass > chord.bass ? -1 : 1), beat * 0.45, 0.42);
      }

      if (drumsOn) {
        if (stepInBar === 0 || stepInBar === 10 || (stepInBar === 7 && Math.random() < 0.35)) playKick(ctx, bus, track, when, rand(0.6, 0.75));
        if (stepInBar === 4 || stepInBar === 12) playSnare(ctx, bus, track, noise, when, rand(0.07, 0.09));
        if (stepInBar % 2 === 0) playHat(ctx, bus, track, noise, when, rand(0.025, 0.04), stepInBar === 14 && Math.random() < 0.3);
        else if (Math.random() < 0.2) playHat(ctx, bus, track, noise, when, rand(0.01, 0.018));
      }

      // 旋律：兩小節一句，有一半機率出現，三到六個音，用高音域的電鋼琴輕輕彈
      if (stepInBar === 0 && bar % 2 === 0 && bar >= 2 && Math.random() < 0.55) {
        const scale = progression.scale;
        let index = Math.floor(rand(2, scale.length - 2));
        let offset = pick([0, 2, 4]);
        const count = Math.floor(rand(3, 7));
        for (let i = 0; i < count && offset < 28; i += 1) {
          const last = i === count - 1;
          const length = last ? pick([4, 6, 8]) : pick([1, 2, 2, 3]);
          const swingShift = offset % 2 === 1 ? swing : 0;
          playRhodes(ctx, bus, track, when + offset * stepSeconds + swingShift, (scale[index] as number) + 12, length * stepSeconds * 1.6, rand(0.22, 0.34), 0.2);
          offset += length;
          index = Math.max(0, Math.min(scale.length - 1, index + pick([-2, -1, -1, 1, 1, 2])));
        }
      }

      step += 1;
      return stepSeconds;
    },
    0.4,
  );
};

// ---------- 音樂：像素 8-bit ----------

// 脈衝波（方波的佔空比可調）：紅白機那種「嗶」的音色
const pulseWaveCache = new WeakMap<AudioContext, Map<number, PeriodicWave>>();
function pulseWave(ctx: AudioContext, duty: number): PeriodicWave {
  let byDuty = pulseWaveCache.get(ctx);
  if (!byDuty) {
    byDuty = new Map();
    pulseWaveCache.set(ctx, byDuty);
  }
  const cached = byDuty.get(duty);
  if (cached) return cached;
  const harmonics = 48;
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);
  for (let n = 1; n < harmonics; n += 1) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  }
  const wave = ctx.createPeriodicWave(real, imag);
  byDuty.set(duty, wave);
  return wave;
}

function playChip(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, level: number, duty: number, pan: number): void {
  const oscillator = ctx.createOscillator();
  oscillator.setPeriodicWave(pulseWave(ctx, duty));
  oscillator.frequency.value = midiToHz(midi);
  const sources: AudioScheduledSourceNode[] = [oscillator];
  const nodes: AudioNode[] = [];
  // 長音才加延遲顫音，短音保持乾淨
  if (duration > 0.35) {
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.5;
    const depth = gainNode(ctx, 0);
    depth.gain.setValueAtTime(0, when + 0.18);
    depth.gain.linearRampToValueAtTime(14, when + 0.4);
    vibrato.connect(depth).connect(oscillator.detune);
    sources.push(vibrato);
    nodes.push(depth);
  }
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(level, when + 0.006);
  envelope.gain.setTargetAtTime(level * 0.65, when + 0.03, 0.12);
  envelope.gain.setTargetAtTime(0, when + duration, 0.025);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  oscillator.connect(envelope).connect(panner).connect(bus);
  voiceEnd(track, sources, [...nodes, envelope, panner], when, when + duration + 0.15);
}

function playTriangle(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, midi: number, duration: number, level: number): void {
  const oscillator = ctx.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = midiToHz(midi);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(level, when + 0.005);
  envelope.gain.setTargetAtTime(0, when + duration, 0.02);
  oscillator.connect(envelope).connect(bus);
  voiceEnd(track, [oscillator], [envelope], when, when + duration + 0.12);
}

function playChipKick(ctx: AudioContext, bus: AudioNode, track: Tracker, when: number, level: number): void {
  const oscillator = ctx.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(180, when);
  oscillator.frequency.exponentialRampToValueAtTime(45, when + 0.1);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(level, when);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
  oscillator.connect(envelope).connect(bus);
  voiceEnd(track, [oscillator], [envelope], when, when + 0.2);
}

type ChipChord = [root: number, minor: boolean];

// 一個和弦一小節、四小節一輪（C 大調：I–vi–IV–V 之類）
const CHIP_PROGRESSIONS: ChipChord[][] = [
  [[0, false], [9, true], [5, false], [7, false]],
  [[5, false], [7, false], [4, true], [9, true]],
  [[0, false], [7, false], [9, true], [5, false]],
  [[9, true], [5, false], [0, false], [7, false]],
];
// C 大調五聲音階，主旋律音域
const CHIP_SCALE = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88];
const CHIPTUNE_BPM = 92;

interface MotifNote {
  at: number; // 八分音符位置，兩小節共 16 格
  length: number;
  degree: number; // CHIP_SCALE 的索引
}

function makeMotif(): MotifNote[] {
  const notes: MotifNote[] = [];
  let at = 0;
  let degree = Math.floor(rand(2, 6));
  while (at < 14) {
    if (at > 0 && Math.random() < 0.22) {
      at += 1;
      continue;
    }
    const length = pick([1, 1, 2, 2, 3]);
    notes.push({ at, length: Math.min(length, 16 - at), degree });
    at += length;
    degree = Math.max(0, Math.min(CHIP_SCALE.length - 1, degree + pick([-2, -1, -1, 0, 1, 1, 2])));
  }
  return notes;
}

// 同一句稍微改尾巴：重複帶來旋律感，變化讓它不會無聊
function varyMotif(motif: MotifNote[]): MotifNote[] {
  return motif.map((note, index) =>
    index >= motif.length - 2 ? { ...note, degree: Math.max(0, Math.min(CHIP_SCALE.length - 1, note.degree + pick([-2, -1, 1, 2]))) } : note,
  );
}

// 強拍上的音貼到和弦內音，聽起來才「對」
function snapToChord(midi: number, chord: ChipChord): number {
  const tones = [0, chord[1] ? 3 : 4, 7].map((interval) => (chord[0] + interval) % 12);
  for (const shift of [0, -1, 1, -2, 2]) {
    if (tones.includes((((midi + shift) % 12) + 12) % 12)) return midi + shift;
  }
  return midi;
}

const buildChiptune: SessionFactory = (ctx, noise, out, track) => {
  const bus = createReverbBus(ctx, out, 1.2, 0.12);
  const stepSeconds = 60 / CHIPTUNE_BPM / 4;
  let step = 0;
  let progression = CHIP_PROGRESSIONS[0] as ChipChord[];
  let phrases: MotifNote[][] = [];
  let arpMode = false;
  let drumsOn = false;

  scheduleEvents(
    ctx,
    track,
    (when) => {
      const stepInBar = step % 16;
      const bar = Math.floor(step / 16);
      const barInSection = bar % 8;

      // 八小節一段：A、A'、A、B。每段換主題，偶爾換和弦、伴奏方式
      if (step % 128 === 0) {
        const section = bar / 8;
        if (section > 0 && Math.random() < 0.5) progression = pick(CHIP_PROGRESSIONS);
        const motif = makeMotif();
        phrases = [motif, varyMotif(motif), motif, makeMotif()];
        arpMode = section % 2 === 1;
        drumsOn = section > 0 && section % 4 !== 3;
      }
      const chord = progression[barInSection % 4] as ChipChord;
      const rootMidi = 48 + chord[0];
      const triad = [0, chord[1] ? 3 : 4, 7, 12].map((interval) => rootMidi + 12 + interval);

      // 低音：三角波，八分音符根音／高八度交替
      if (stepInBar % 2 === 0) {
        const octave = stepInBar % 4 === 2 ? 12 : 0;
        const fifth = stepInBar === 14 ? 7 : 0;
        playTriangle(ctx, bus, track, when, rootMidi - 12 + octave + fifth, stepSeconds * 1.6, 0.22);
      }

      // 伴奏：琶音段每個十六分音符跳一個和弦內音；其他段在反拍輕輕點和弦
      if (arpMode) {
        const note = triad[[0, 1, 2, 3, 2, 1][step % 6] as number] as number;
        playChip(ctx, bus, track, when, note, stepSeconds * 0.8, 0.018, 0.125, -0.35);
      } else if (stepInBar % 4 === 2) {
        triad.slice(0, 3).forEach((note) => playChip(ctx, bus, track, when, note, stepSeconds * 1.2, 0.012, 0.25, -0.3));
      }

      // 主旋律：前兩小節是前奏，只有伴奏
      const phrase = phrases[Math.floor(barInSection / 2)];
      if (phrase && bar >= 2 && stepInBar % 2 === 0) {
        const eighth = ((barInSection % 2) * 16 + stepInBar) / 2;
        const note = phrase.find((n) => n.at === eighth);
        if (note) {
          let midi = CHIP_SCALE[note.degree] as number;
          if (eighth % 2 === 0) midi = snapToChord(midi, chord);
          // B 句最後一個音收在主音上
          const isEnding = barInSection === 7 && note === phrase[phrase.length - 1];
          if (isEnding) midi = 72;
          playChip(ctx, bus, track, when, midi, note.length * stepSeconds * 2 * 0.9, 0.05, 0.5, 0.12);
        }
      }

      if (drumsOn) {
        if (stepInBar === 0 || stepInBar === 8 || (stepInBar === 10 && Math.random() < 0.3)) playChipKick(ctx, bus, track, when, 0.32);
        if (stepInBar === 4 || stepInBar === 12) {
          burst(ctx, bus, track, { buffer: noise.pink, when, duration: 0.1, attack: 0.001, peak: 0.07, filter: 'bandpass', frequency: 2400, q: 0.6, pan: 0 });
        }
        if (stepInBar % 2 === 1) {
          burst(ctx, bus, track, { buffer: noise.pink, when, duration: 0.03, attack: 0.001, peak: 0.025, filter: 'highpass', frequency: 8000, q: 0.7, pan: 0.25 });
        }
      }

      step += 1;
      return stepSeconds;
    },
    0.4,
  );
};

// ---------- 場景環境音：跟著人在哪個區域，疊在音樂下面 ----------

// 從遠處靠近再遠去的鐘形曲線（車子、機車、歡呼）
function passCurve(base: number, peak: number, points = 64): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i += 1) {
    const x = (i / (points - 1)) * 2 - 1;
    curve[i] = base + (peak - base) * Math.exp(-x * x * 5);
  }
  return curve;
}

function lineCurve(from: number, to: number, points = 32): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i += 1) curve[i] = from + ((to - from) * i) / (points - 1);
  return curve;
}

// 一團噪音從一側經過到另一側：汽車胎噪、人群的歡呼
function noisePass(
  ctx: AudioContext,
  out: AudioNode,
  track: Tracker,
  buffer: AudioBuffer,
  when: number,
  duration: number,
  peak: number,
  lowHz: number,
  highHz: number,
  panFrom: number,
  panTo: number,
): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = biquad(ctx, 'lowpass', lowHz, 0.7);
  filter.frequency.setValueCurveAtTime(passCurve(lowHz, highHz), when, duration);
  const envelope = gainNode(ctx, 0);
  envelope.gain.setValueCurveAtTime(passCurve(0.0001, peak), when, duration);
  const panner = ctx.createStereoPanner();
  panner.pan.setValueCurveAtTime(lineCurve(panFrom, panTo), when, duration);
  source.connect(filter).connect(envelope).connect(panner).connect(out);
  track.addSource(source);
  source.start(when, rand(0, Math.max(0, buffer.duration - duration - 0.2)));
  source.stop(when + duration);
  source.onended = () => {
    panner.disconnect();
    track.sources = track.sources.filter((s) => s !== source);
  };
}

// 引擎經過：鋸齒波 + 低八度方波，經過面前時音高掉下來（都卜勒效應）
function enginePass(ctx: AudioContext, out: AudioNode, track: Tracker, when: number, duration: number, baseHz: number, peak: number, brightness: number, panFrom: number, panTo: number): void {
  const middle = when + duration / 2;
  const sources: OscillatorNode[] = [];
  const mix = gainNode(ctx, 1);
  for (const [type, multiple, level] of [
    ['sawtooth', 1, 1],
    ['square', 0.5, 0.6],
  ] as const) {
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    const hz = baseHz * multiple;
    oscillator.frequency.setValueAtTime(hz * 1.16, when);
    oscillator.frequency.linearRampToValueAtTime(hz * 1.12, middle - duration * 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(hz * 0.84, middle + duration * 0.07);
    oscillator.frequency.linearRampToValueAtTime(hz * 0.8, when + duration);
    const oscGain = gainNode(ctx, level);
    oscillator.connect(oscGain).connect(mix);
    sources.push(oscillator);
  }
  const filter = biquad(ctx, 'lowpass', 300, 1.2);
  filter.frequency.setValueCurveAtTime(passCurve(300, brightness), when, duration);
  const envelope = gainNode(ctx, 0);
  envelope.gain.setValueCurveAtTime(passCurve(0.0001, peak), when, duration);
  const panner = ctx.createStereoPanner();
  panner.pan.setValueCurveAtTime(lineCurve(panFrom, panTo), when, duration);
  mix.connect(filter).connect(envelope).connect(panner).connect(out);
  voiceEnd(track, sources, [mix, filter, envelope, panner], when, when + duration);
}

// 短促的正弦滑音：鳥叫、蟲鳴、海鷗都是它的變形
function chirp(ctx: AudioContext, out: AudioNode, track: Tracker, when: number, fromHz: number, toHz: number, duration: number, peak: number, pan: number, type: OscillatorType = 'sine'): void {
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(fromHz, when);
  oscillator.frequency.exponentialRampToValueAtTime(toHz, when + duration);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.linearRampToValueAtTime(peak, when + Math.min(0.012, duration * 0.3));
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;
  oscillator.connect(envelope).connect(panner).connect(out);
  voiceEnd(track, [oscillator], [envelope, panner], when, when + duration + 0.02);
}

function isNightNow(): boolean {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 5;
}

// 沙灘：海浪 + 偶爾幾聲海鷗
const buildBeach: SessionFactory = (ctx, noise, out, track) => {
  buildOcean(ctx, noise, out, track);
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const cries = Math.floor(rand(1, 4));
      const pan = rand(-0.8, 0.8);
      const base = rand(1250, 1500);
      for (let i = 0; i < cries; i += 1) {
        const at = when + i * rand(0.42, 0.6);
        const voice = ctx.createOscillator();
        voice.type = 'triangle';
        voice.frequency.setValueAtTime(base, at);
        voice.frequency.linearRampToValueAtTime(base * 1.3, at + 0.06);
        voice.frequency.exponentialRampToValueAtTime(base * 0.78, at + 0.38);
        const nasal = biquad(ctx, 'bandpass', 1700, 1.6);
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.linearRampToValueAtTime(0.05, at + 0.04);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        voice.connect(nasal).connect(envelope).connect(panner).connect(out);
        voiceEnd(track, [voice], [nasal, envelope, panner], at, at + 0.42);
      }
      return rand(9, 22);
    },
    rand(3, 8),
  );
};

// 101 一帶：車流的低鳴、一台台經過的車和機車、偶爾的喇叭與行人號誌
const buildCity: SessionFactory = (ctx, noise, out, track) => {
  const rumble = gainNode(ctx, 0.3);
  loopNoise(ctx, noise.brown, track).connect(biquad(ctx, 'lowpass', 260)).connect(rumble).connect(out);
  const hum = gainNode(ctx, 0.03);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 700, 0.5)).connect(hum).connect(out);
  const lfo = track.addSource(ctx.createOscillator());
  lfo.frequency.value = 0.05;
  const lfoDepth = gainNode(ctx, 0.08);
  lfo.connect(lfoDepth).connect(rumble.gain);
  lfo.start();

  // 汽車
  scheduleEvents(ctx, track, (when) => {
    const leftToRight = Math.random() < 0.5;
    noisePass(ctx, out, track, noise.pink, when, rand(3, 5.5), rand(0.12, 0.24), 220, rand(900, 1500), leftToRight ? -0.9 : 0.9, leftToRight ? 0.9 : -0.9);
    return rand(1.6, 5);
  });
  // 機車：台北的靈魂
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const leftToRight = Math.random() < 0.5;
      enginePass(ctx, out, track, when, rand(2.4, 3.6), rand(58, 82), rand(0.025, 0.045), 1300, leftToRight ? -0.9 : 0.9, leftToRight ? 0.9 : -0.9);
      return rand(4, 11);
    },
    rand(1, 4),
  );
  // 遠處的喇叭
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const double = Math.random() < 0.4;
      const pan = rand(-0.7, 0.7);
      for (let i = 0; i < (double ? 2 : 1); i += 1) {
        const at = when + i * 0.26;
        for (const hz of [415, 520]) chirp(ctx, out, track, at, hz, hz * 0.99, 0.2, 0.008, pan, 'square');
      }
      return rand(18, 40);
    },
    rand(8, 20),
  );
  // 行人號誌綠燈的「嗶嗶嗶」
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const beeps = Math.floor(rand(30, 50));
      for (let i = 0; i < beeps; i += 1) chirp(ctx, out, track, when + i * 0.16, 2100, 2050, 0.05, 0.006, 0.55, 'square');
      return rand(40, 75);
    },
    rand(6, 15),
  );
};

// 一句「人聲」：三角波 + 共振峰濾波，聽不出字，但聽得出是有人在講話
function voicePhrase(ctx: AudioContext, out: AudioNode, track: Tracker, when: number, syllables: number, pitch: number, peak: number, pan: number): number {
  let at = when;
  for (let i = 0; i < syllables; i += 1) {
    const length = rand(0.09, 0.22);
    const voice = ctx.createOscillator();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(pitch * rand(0.95, 1.12), at);
    voice.frequency.linearRampToValueAtTime(pitch * rand(0.85, 1.05), at + length);
    const formant = biquad(ctx, 'bandpass', rand(500, 1300), rand(3, 6));
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(peak, at + 0.025);
    envelope.gain.setTargetAtTime(0, at + length - 0.03, 0.025);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    voice.connect(formant).connect(envelope).connect(panner).connect(out);
    voiceEnd(track, [voice], [formant, envelope, panner], at, at + length + 0.12);
    at += length + rand(0.02, 0.09);
  }
  return at - when;
}

// 士林夜市：人聲鼎沸、烤架滋滋響、碗筷鏗鏘
const buildMarket: SessionFactory = (ctx, noise, out, track) => {
  // 人群的底：兩層不同頻帶的噪音，各自緩慢起伏
  const murmur = gainNode(ctx, 0.12);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 550, 0.8)).connect(murmur).connect(out);
  const chatter = gainNode(ctx, 0.045);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 1500, 1.2)).connect(chatter).connect(out);
  const lfo = track.addSource(ctx.createOscillator());
  lfo.frequency.value = 0.09;
  const lfoDepth = gainNode(ctx, 0.02);
  lfo.connect(lfoDepth).connect(chatter.gain);
  lfo.start();

  // 碎碎的音節：很多人同時在講話
  scheduleEvents(ctx, track, (when) => {
    burst(ctx, out, track, {
      buffer: noise.pink,
      when,
      duration: rand(0.05, 0.16),
      attack: 0.015,
      peak: rand(0.015, 0.045),
      filter: 'bandpass',
      frequency: rand(350, 1800),
      q: rand(2, 5),
      pan: rand(-0.9, 0.9),
    });
    return rand(0.015, 0.05);
  });
  // 比較近的一句話（客人、老闆在喊）
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pitch = Math.random() < 0.5 ? rand(110, 160) : rand(190, 260);
      const length = voicePhrase(ctx, out, track, when, Math.floor(rand(3, 8)), pitch, rand(0.04, 0.08), rand(-0.7, 0.7));
      return length + rand(0.8, 3.5);
    },
    rand(0.5, 2),
  );
  // 烤香腸的滋滋聲
  const sizzle = gainNode(ctx, 0.018);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'highpass', 3500)).connect(sizzle).connect(out);
  scheduleEvents(ctx, track, (when) => {
    burst(ctx, out, track, { buffer: noise.pink, when, duration: rand(0.004, 0.02), attack: 0.001, peak: rand(0.03, 0.1), filter: 'highpass', frequency: rand(3500, 7000), q: 0.7, pan: rand(0.2, 0.6) });
    return rand(0.02, 0.18);
  });
  // 碗、湯匙、鐵板
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const hz = rand(2200, 3800);
      const pan = rand(-0.8, 0.8);
      chirp(ctx, out, track, when, hz, hz * 0.995, rand(0.25, 0.5), rand(0.01, 0.02), pan);
      chirp(ctx, out, track, when, hz * 2.76, hz * 2.75, 0.15, 0.006, pan);
      return rand(1.5, 6);
    },
    1,
  );
};

// 動物園：樹葉、各種鳥、斑鳩、遠處的蟬；晚上換成蟋蟀
const buildZoo: SessionFactory = (ctx, noise, out, track) => {
  const leaves = gainNode(ctx, 0.07);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'lowpass', 1400)).connect(biquad(ctx, 'highpass', 250)).connect(leaves).connect(out);
  const lfo = track.addSource(ctx.createOscillator());
  lfo.frequency.value = 0.07;
  const lfoDepth = gainNode(ctx, 0.05);
  lfo.connect(lfoDepth).connect(leaves.gain);
  lfo.start();

  if (isNightNow()) {
    // 兩隻蟋蟀，各自的節奏
    for (const [pan, hz] of [
      [-0.5, 4300],
      [0.6, 4700],
    ] as const) {
      scheduleEvents(
        ctx,
        track,
        (when) => {
          for (let i = 0; i < 3; i += 1) chirp(ctx, out, track, when + i * 0.045, hz, hz * 0.98, 0.03, 0.012, pan);
          return rand(0.55, 0.9);
        },
        rand(0, 1),
      );
    }
    return;
  }

  // 鳥：三種叫法隨機
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pan = rand(-0.9, 0.9);
      const kind = Math.floor(rand(0, 3));
      if (kind === 0) {
        // 麻雀：一串往下掉的短啾
        const base = rand(3800, 5200);
        const count = Math.floor(rand(3, 7));
        for (let i = 0; i < count; i += 1) chirp(ctx, out, track, when + i * rand(0.08, 0.12), base, base * 0.7, 0.06, 0.03, pan);
        return rand(1.2, 4);
      }
      if (kind === 1) {
        // 白頭翁：兩三個比較長的口哨
        const base = rand(1900, 2500);
        chirp(ctx, out, track, when, base, base * 1.3, 0.22, 0.03, pan);
        chirp(ctx, out, track, when + 0.28, base * 1.3, base * 0.9, 0.26, 0.03, pan);
        if (Math.random() < 0.5) chirp(ctx, out, track, when + 0.6, base * 1.1, base * 1.25, 0.18, 0.025, pan);
        return rand(2, 5);
      }
      // 很快的顫音
      const hz = rand(4200, 5600);
      const count = Math.floor(rand(8, 15));
      for (let i = 0; i < count; i += 1) chirp(ctx, out, track, when + i * 0.045, hz, hz * 0.92, 0.03, 0.02, pan);
      return rand(2, 6);
    },
    0.5,
  );
  // 斑鳩：「咕咕——咕」
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const pan = rand(-0.6, 0.6);
      [0, 0.5, 1.1].forEach((offset, i) => chirp(ctx, out, track, when + offset, i === 2 ? 540 : 600, i === 2 ? 470 : 560, i === 2 ? 0.55 : 0.35, 0.04, pan));
      return rand(10, 22);
    },
    rand(4, 9),
  );
  // 蟬：調幅的窄頻噪音，一陣陣湧上來
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const duration = rand(6, 11);
      const source = ctx.createBufferSource();
      source.buffer = noise.pink;
      source.loop = true;
      const band = biquad(ctx, 'bandpass', rand(4500, 5500), 7);
      const pulse = gainNode(ctx, 0.5);
      const pulser = ctx.createOscillator();
      pulser.frequency.value = rand(38, 52);
      const pulseDepth = gainNode(ctx, 0.5);
      pulser.connect(pulseDepth).connect(pulse.gain);
      const envelope = gainNode(ctx, 0);
      envelope.gain.setValueCurveAtTime(waveCurve(0.0001, rand(0.08, 0.14)), when, duration);
      const panner = ctx.createStereoPanner();
      panner.pan.value = rand(-0.6, 0.6);
      source.connect(band).connect(pulse).connect(envelope).connect(panner).connect(out);
      voiceEnd(track, [source, pulser], [band, pulse, pulseDepth, envelope, panner], when, when + duration);
      return duration + rand(10, 25);
    },
    rand(2, 6),
  );
};

// F1：看台的人聲 + 一台台呼嘯而過的賽車
const buildF1: SessionFactory = (ctx, noise, out, track) => {
  const crowd = gainNode(ctx, 0.06);
  loopNoise(ctx, noise.pink, track).connect(biquad(ctx, 'bandpass', 900, 0.5)).connect(crowd).connect(out);
  const rumble = gainNode(ctx, 0.14);
  loopNoise(ctx, noise.brown, track).connect(biquad(ctx, 'lowpass', 200)).connect(rumble).connect(out);

  // 車隊：一到三台接著經過，然後安靜一陣
  scheduleEvents(
    ctx,
    track,
    (when) => {
      const cars = Math.floor(rand(1, 4));
      let at = when;
      for (let i = 0; i < cars; i += 1) {
        enginePass(ctx, out, track, at, rand(1.6, 2.4), rand(150, 210), rand(0.06, 0.1), 3200, -0.95, 0.95);
        at += rand(0.35, 1.1);
      }
      return at - when + rand(4, 10);
    },
    1,
  );
  // 看台偶爾一陣歡呼
  scheduleEvents(
    ctx,
    track,
    (when) => {
      noisePass(ctx, out, track, noise.pink, when, rand(3, 5), rand(0.1, 0.16), 600, 2000, rand(-0.3, 0), rand(0, 0.3));
      return rand(25, 55);
    },
    rand(10, 20),
  );
};

const factories: Record<SynthKind, SessionFactory> = {
  rain: buildRain,
  ocean: buildOcean,
  library: buildLibrary,
  blues: buildBlues,
  classical: buildClassical,
  beats: buildBeats,
  chiptune: buildChiptune,
  beach: buildBeach,
  city: buildCity,
  market: buildMarket,
  zoo: buildZoo,
  f1: buildF1,
};

// ---------- 播放器 ----------

const FADE_SECONDS = 0.35;

export function createSynthPlayer() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: NoiseBuffers | null = null;
  let session: SynthSession | null = null;
  let currentKind: SynthKind | null = null;
  let startToken = 0;

  function ensureContext(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      // 輕度壓縮，避免多層疊加時偶爾的尖峰
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 3;
      master.connect(compressor).connect(ctx.destination);
      noise = createNoiseBuffers(ctx);
    }
    return ctx;
  }

  function tearDownSession(target: SynthSession): void {
    const audioCtx = ctx;
    if (audioCtx) {
      target.output.gain.cancelScheduledValues(audioCtx.currentTime);
      target.output.gain.setTargetAtTime(0, audioCtx.currentTime, FADE_SECONDS / 3);
    }
    window.setTimeout(() => {
      target.stop();
      target.output.disconnect();
    }, FADE_SECONDS * 1000 + 100);
  }

  async function start(kind: SynthKind, volume: number): Promise<void> {
    startToken += 1;
    const token = startToken;
    const audioCtx = ensureContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    // 等待 resume 期間又有新的 start/stop，這一次就作廢
    if (token !== startToken || !master || !noise) return;

    if (session) {
      tearDownSession(session);
      session = null;
    }

    master.gain.cancelScheduledValues(audioCtx.currentTime);
    master.gain.setValueAtTime(volume, audioCtx.currentTime);

    const output = audioCtx.createGain();
    output.gain.setValueAtTime(0, audioCtx.currentTime);
    output.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.2);
    output.connect(master);

    const track = new Tracker();
    factories[kind](audioCtx, noise, output, track);
    session = { output, stop: () => track.dispose() };
    currentKind = kind;
  }

  function setVolume(volume: number): void {
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }

  function stop(): void {
    startToken += 1;
    if (session) {
      tearDownSession(session);
      session = null;
    }
    currentKind = null;
  }

  function dispose(): void {
    stop();
    const closing = ctx;
    window.setTimeout(() => {
      void closing?.close();
    }, FADE_SECONDS * 1000 + 200);
    ctx = null;
    master = null;
    noise = null;
  }

  return {
    start,
    stop,
    setVolume,
    dispose,
    get isPlaying() {
      return session !== null;
    },
    get kind() {
      return currentKind;
    },
    // 測試用：接到分析節點量測輸出
    get audioContext() {
      return ctx;
    },
    get masterNode() {
      return master;
    },
  };
}

export type SynthPlayer = ReturnType<typeof createSynthPlayer>;
