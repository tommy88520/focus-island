// 用 Web Audio 即時合成的環境音（雨聲、海浪、圖書館）。
//
// 為什麼不用 mp3：自然音（雨、浪）錄成檔案循環播放，接縫和重複感很容易被聽出來；
// 合成的做法是「穩定的底噪 + 隨機觸發的事件（雨滴、浪、翻書…）」，每次聽都不一樣，
// 也沒有循環點。所有隨機事件都是排程在 AudioContext 時間軸上，不依賴 setTimeout 的精度。

export type SynthKind = 'rain' | 'ocean' | 'library';

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

const factories: Record<SynthKind, SessionFactory> = {
  rain: buildRain,
  ocean: buildOcean,
  library: buildLibrary,
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
