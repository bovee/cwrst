export class Audio {
  context?: AudioContext = null;
  oscillator1?: OscillatorNode = null;
  oscillator2?: OscillatorNode = null;
  keyGain1?: GainNode = null;
  keyGain2?: GainNode = null;
  analyser?: AnalyserNode = null;
  analyserBuffer?: Uint8Array = null;
  volGain?: GainNode = null;
  keyEndTime?: number = null;
  _volume: number;
  keyCallbacks: number[] = [];

  constructor(volume: number) {
    this._volume = volume;
  }

  start() {
    this.context = new AudioContext();
    this.oscillator1 = this.context.createOscillator();
    this.oscillator1.type = 'sine';
    this.oscillator2 = this.context.createOscillator();
    this.oscillator2.type = 'sine';
    this.oscillator2.frequency.setValueAtTime(330, this.context.currentTime);
    this.keyGain1 = this.context.createGain();
    this.keyGain1.gain.value = 0;
    this.keyGain2 = this.context.createGain();
    this.keyGain2.gain.value = 0;
    this.analyser = this.context.createAnalyser();
    this.analyserBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.volGain = this.context.createGain();
    this.volGain.gain.value = this._volume;
    this.oscillator1
      .connect(this.keyGain1)
      .connect(this.analyser)
      .connect(this.volGain)
      .connect(this.context.destination);
    this.oscillator1.start();
    this.oscillator2.connect(this.keyGain2).connect(this.analyser);
    this.oscillator2.start();
  }

  clear() {
    this.keyEndTime = this.context.currentTime;
    this.keyGain1.gain.cancelScheduledValues(this.context.currentTime);
    this.keyGain2.gain.cancelScheduledValues(this.context.currentTime);
    if (this.keyCallbacks.length) {
      for (const id of this.keyCallbacks) clearTimeout(id);
      this.keyCallbacks = [];
    }
  }

  on() {
    if (!this.context) this.start();
    this.clear();
    this.keyGain1.gain.setTargetAtTime(
      1,
      this.context.currentTime + 0.01,
      0.01,
    );
  }

  off() {
    this.keyGain1.gain.setTargetAtTime(
      0,
      this.context.currentTime + 0.01,
      0.01,
    );
  }

  key(
    sequence: string,
    ditLen: number,
    fditLen: number,
    primary: boolean = true,
    endGap: boolean = true,
    callback?: () => void,
  ): number {
    if (!this.context) this.start();
    let totalTime = this.context.currentTime + 0.001;
    if (this.keyEndTime > totalTime) totalTime = this.keyEndTime;
    for (const key of sequence) {
      if (key === ' ') {
        totalTime += 3 * fditLen;
        continue;
      } else if (key === '/') {
        totalTime += 7 * fditLen;
        continue;
      }
      const time = key === '.' ? ditLen : 3 * ditLen;
      if (primary) {
        this.keyGain1.gain.setTargetAtTime(1, totalTime, 0.001);
        this.keyGain1.gain.setTargetAtTime(0, totalTime + time + 0.001, 0.001);
      } else {
        this.keyGain2.gain.setTargetAtTime(1, totalTime, 0.001);
        this.keyGain2.gain.setTargetAtTime(0, totalTime + time + 0.001, 0.001);
      }
      // add the time for the mark plus spacing time equivalent to a dit
      totalTime += time + ditLen;
    }
    totalTime += endGap ? 3 * fditLen : 0;
    this.keyEndTime = totalTime;
    const milliDelay = 1000 * (totalTime - this.context.currentTime - 0.001);
    if (callback)
      this.keyCallbacks.push(
        setTimeout(() => {
          this.keyCallbacks.shift();
          callback();
        }, Math.round(milliDelay)),
      );
    return milliDelay;
  }

  isKeying(): boolean {
    if (!this.context) this.start();
    return this.keyEndTime > this.context.currentTime;
  }

  getActualVolume() {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.analyserBuffer);
    let vol = this.analyserBuffer.reduce((a, b) => a + b * b, 0);
    vol = Math.sqrt(vol / this.analyserBuffer.length);
    return 10 ** vol;
  }

  public set volume(volume: number) {
    volume = Math.min(Math.max(1, volume), 10);
    this._volume = Math.log10(volume);
    if (this.volGain) this.volGain.gain.value = this._volume;
    localStorage.setItem('volume', `${this._volume}`);
  }

  public get volume() {
    return 10 ** this._volume;
  }
}
