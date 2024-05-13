const ENGLISH = {
  COLOR_SCHEME: 'Color Scheme',
  COLOR_SCHEME_LIGHT: 'Light',
  COLOR_SCHEME_DARK: 'Dark',
  COLOR_SCHEME_AUTO: 'Auto',
  VOLUME: 'Volume',
  KEY: 'Key',
  KEY_STRAIGHT: 'Straight',
  KEY_PADDLE: 'Iambic Paddle',
  KEY_REVERSE: 'Reverse Paddle',
  WORDS_PER_MINUTE: 'Words per Minute',
  FARNSWORTH_WPM: 'Farnsworth Words per Minute',
  CLICK_TO_ENABLE: 'Click to Enable',
  CLICK_TO: 'Click to',
  ENABLE: 'Enable',
  TRANSMIT: 'Transmit',
  COPY: 'Copy',
};

export function msg(key: string) {
  const lang = (
    window.navigator.userLanguage || window.navigator.language
  ).toLowerCase();
  if (lang === 'en' || lang === 'en-us') return ENGLISH[key];
  if (lang.startsWith('es')) return;
  if (lang.startsWith('fr')) return;
  if (lang === 'zh' || lang === 'zh-cn') return; //simplified
  if (lang.startsWith('zh')) return; // traditional
}
