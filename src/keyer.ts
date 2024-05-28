import { Audio } from './audio';

export const MORSE_MAP = {
  ' ': ' ',
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '/': '-..-.',
  '=': '-...-',
  "'": '.---.',
  '(': '-.--.',
  ')': '-.--.-',
  ':': '---...',
  '+': '.-.-.',
  '-': '-....-',
  '@': '.--.-.',
  '🆘': '...---...',
};

const REV_MORSE_MAP = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k]),
);

export class Keyer {
  public audio: Audio;
  ditPaddleDown: boolean = false;
  datPaddleDown: boolean = false;
  spaceDown?: number = null;
  spaceUp?: number = null;
  timeoutGap?: number = null;
  log: string = '';
  txCallback?: (chr: string, primary: boolean) => void = null;
  ditLen: number;
  fditLen: number;

  constructor(audio: Audio, wpm: number, farnsworth: number) {
    this.audio = audio;

    // math from https://morsecode.world/international/timing.html
    this.ditLen = 60 / (50 * wpm);
    this.fditLen =
      (300 * this.wpm - 186 * farnsworth) / (95 * this.wpm * farnsworth);
  }

  get wpm() {
    return 60 / (50 * this.ditLen);
  }

  set wpm(wpm: number) {
    localStorage.setItem('wpm', `${wpm}`);
    this.ditLen = 60 / (50 * wpm);
  }

  get farnsworth() {
    return Math.round((300 * this.wpm) / (186 + 95 * this.wpm * this.fditLen));
  }

  set farnsworth(farnsworth: number) {
    localStorage.setItem('farnsworth', `${farnsworth}`);
    this.fditLen =
      (300 * this.wpm - 186 * farnsworth) / (95 * this.wpm * farnsworth);
  }

  attach(txCallback: (chr: string, primary: boolean) => void) {
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    this.txCallback = txCallback;
  }

  detach() {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.txCallback = null;
  }

  keyDown = (evt: KeyboardEvent) => {
    if (evt.code === 'Space' && !this.spaceDown) {
      evt.stopImmediatePropagation();
      this.straightKeyDown();
    }
    if (evt.code === 'KeyB') this.ditPaddleDown = true;
    if (evt.code === 'KeyN') this.datPaddleDown = true;
    if (this.ditPaddleDown || this.datPaddleDown) {
      evt.stopImmediatePropagation();
      this.paddleDown(this.ditPaddleDown, this.datPaddleDown);
    }
  };

  keyUp = (evt: KeyboardEvent) => {
    if (evt.code === 'Space' && this.spaceDown) {
      evt.stopImmediatePropagation();
      this.straightKeyUp();
    }
    if (this.ditPaddleDown || this.datPaddleDown) this.paddleUp();
    if (evt.code === 'KeyB' || evt.code === 'KeyN')
      evt.stopImmediatePropagation();
    if (evt.code === 'KeyB') this.ditPaddleDown = false;
    if (evt.code === 'KeyN') this.datPaddleDown = false;
  };

  straightKeyDown() {
    this.audio.on();
    if (this.timeoutGap) clearTimeout(this.timeoutGap);
    this.handleGap();
    this.spaceDown = Date.now();
  }

  straightKeyUp() {
    this.audio.off();
    const timeElapsed = (Date.now() - this.spaceDown) / 1000;
    if (timeElapsed <= 2.5 * this.ditLen) this.log += '.';
    if (timeElapsed > 2.5 * this.ditLen) this.log += '-';
    this.spaceDown = null;

    this.spaceUp = Date.now();
    this.timeoutGap = setTimeout(
      () => this.handleGap(),
      7 * this.fditLen * 1000,
    );
  }

  paddleDown(dit: boolean, dat: boolean) {
    if (this.audio.isKeying()) return;
    // TODO: we send ..- if the user holds the dit key before the dash key (but at the same time)
    if (dit) {
      this.log += '.';
      this.audio.key('.', this.ditLen, this.fditLen, true, false);
    }
    if (dat) {
      this.log += '-';
      this.audio.key('-', this.ditLen, this.fditLen, true, false);
    }
  }

  paddleUp() {
    this.spaceUp = Date.now();
    // reuse the timeoutGap for a letter timeout
    if (this.timeoutGap) clearTimeout(this.timeoutGap);
    this.timeoutGap = setTimeout(
      () => {
        this.txCallback(REV_MORSE_MAP[this.log] || '\uFFFD', true);
        this.log = '';
        this.timeoutGap = setTimeout(
          () => {
            this.txCallback(' ', true);
          },
          4 * this.fditLen * 1000,
        );
      },
      3 * this.fditLen * 1000,
    );
  }

  private handleGap() {
    if (!this.spaceUp) return;
    const timeElapsed = (Date.now() - this.spaceUp) / 1000;
    if (timeElapsed < 2 * this.fditLen) {
      // no op
      this.spaceUp = null;
      return;
    }
    if (this.txCallback && this.log) {
      this.txCallback(REV_MORSE_MAP[this.log] || '\uFFFD', true);
      if (timeElapsed >= 5 * this.fditLen) this.txCallback(' ', true);
    }
    this.log = '';
  }

  keyPartnerMessage(message: string) {
    this.audio.clear();
    for (const letter of message) {
      this.keyLetter(letter, false);
    }
  }

  keyLetter(letter: string, primary: boolean = true) {
    if (this.timeoutGap) clearTimeout(this.timeoutGap);
    const code = MORSE_MAP[letter.toLowerCase()];
    if (typeof code === 'undefined') return;
    const delay = this.audio.key(
      code,
      this.ditLen,
      this.fditLen,
      primary,
      true,
      () => {
        if (this.txCallback) this.txCallback(letter.toLowerCase(), primary);
      },
    );
    this.timeoutGap = setTimeout(
      () => {
        if (this.txCallback) this.txCallback(' ', primary);
      },
      delay + 4 * this.fditLen * 1000,
    );
  }

  get currentTime(): number {
    return this.audio.context.currentTime;
  }
}
