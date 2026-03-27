import { el, setText } from '../utils/helpers.js';

const TABLE = {
  ru: {
    cb_head: 'Официальное заявление МИД',
    cb_btn: 'Во имя Родины',
    cb_lang: 'EN',
    cb_sig: 'г. · Пресс-служба МИД',
    vs_ai: 'vs ИИ',
    vs_2p: '2 игрока',
    game_lang: 'EN',
    casualties: 'погибших',
    atk_l: '◀ наступать',
    atk_r: 'наступать ▶',
    s_init: 'Выберите режим и наступайте',
    s_exhaust: 'Население исчерпано',
    s_won: 'Территория противника захвачена.',
    s_lost: 'Территория утрачена.',
    e_silence: '. . .',
    e_title: 'Война окончена',
    el_t: 'Всего погибло',
    el_d: 'Продолжительность',
    e_casus: 'Повод: «',
    e_casus_suffix: '»',
    btn_new: 'Новая война',
    btn_rematch: 'Реванш',
    km_won: ' отвоевала ',
    km_km: ' км территории',
    km_none: 'Территория не изменилась',
    d_easy: 'Лёгкий',
    d_med: 'Средний',
    d_hard: 'Сложный',
    mode_dev: 'Развитие',
    mode_atk: 'Наступление',
    mode_def: 'Укрепление',
    mode_neu: 'Переход...',
    ml: 'Режим',
    tip_dev: '📈 +75% рост, нельзя атаковать',
    tip_atk: '⚔️ ×2 сдвиг, нет роста',
    tip_def: '🛡️ враг −75% силы, ×2 стоимость атаки',
    switching: 'Переход 3с...',
    dl_children: 'дети',
    dl_women: 'женщины',
    dl_elderly: 'старики',
    menu_play: 'Играть',
    menu_tagline: 'Сколько жизней стоит километр?',
    menu_settings: 'Настройки',
    menu_version: 'веб · концепт',
    pause_title: 'Пауза',
    pause_resume: 'Продолжить',
    pause_restart: 'Заново',
    pause_menu: 'В меню',
    settings_title: 'Настройки',
    settings_close: 'Закрыть',
    settings_sound: 'Звук',
    settings_sound_on: 'вкл',
    settings_sound_off: 'выкл',
    settings_speed: 'Скорость роста',
    settings_speed_slow: 'Медленно',
    settings_speed_normal: 'Норма',
    settings_speed_fast: 'Быстро',
    settings_lang: 'Язык',
    end_to_menu: 'В меню',
    btn_memorial: 'Назвать погибшего',
    mem_prompt: 'Вы можете назвать одного из погибших.',
    mem_sub: 'Введите имя — или нажмите «Пропустить».',
    mem_save: 'Запомнить',
    mem_skip: 'Пропустить',
    mem_list_title: 'Мемориал этой сессии',
    mem_empty: 'Никто не ввёл имени.',
    menu_help: 'Помощь',
    help_title: 'ИНСТРУКЦИЯ ПО ВЕДЕНИЮ ВОЙНЫ',
    help_close: 'Вернуться',
    help_text: `В этой войне нет случайных побед. Каждый километр имеет свою цену — человеческую.

1. РЕСУРС: ВАШЕ НАСЕЛЕНИЕ
Ваше население — это и ваши солдаты, и ваша способность атаковать. Каждое нажатие «Наступать» стоит жизней. Чем дальше вы продвигаетесь на чужую территорию, тем быстрее растут потери.

2. ДИНАМИЧЕСКИЕ РЕЖИМЫ (ПЕРЕКЛЮЧЕНИЕ 3С):
• РАЗВИТИЕ (📈): Останавливает атаку, но даёт огромный прирост населения. Используйте для восстановления после тяжелых боёв.
• НАСТУПЛЕНИЕ (⚔️): Удваивает силу вашего толчка, но полностью останавливает рост населения.
• ОБОРОНА (🛡️): Снижает силу вражеского натиска на 75%. Ваши атаки стоят в 2 раза дороже, но продвижение врага блокируется.

3. ПОБЕДА И ПОРАЖЕНИЕ
Война окончена, когда граница доходит до столицы одной из сторон или население одной из стран полностью исчерпано.

Чья кровь прольётся следующей?`,
  },
  en: {
    cb_head: 'Official Statement — Ministry of Foreign Affairs',
    cb_btn: 'For the Homeland',
    cb_lang: 'RU',
    cb_sig: '· Press Office, MFA',
    vs_ai: 'vs AI',
    vs_2p: '2 players',
    game_lang: 'RU',
    casualties: 'casualties',
    atk_l: '◀ advance',
    atk_r: 'advance ▶',
    s_init: 'Choose a mode and advance',
    s_exhaust: 'Population exhausted',
    s_won: "The enemy's territory has been captured.",
    s_lost: 'Your territory has been lost.',
    e_silence: '. . .',
    e_title: 'The War Is Over',
    el_t: 'Total dead',
    el_d: 'Duration',
    e_casus: 'Pretext: “',
    e_casus_suffix: '”',
    btn_new: 'New war',
    btn_rematch: 'Rematch',
    km_won: ' gained ',
    km_km: ' km of territory',
    km_none: 'The border did not move',
    d_easy: 'Easy',
    d_med: 'Medium',
    d_hard: 'Hard',
    mode_dev: 'Economy',
    mode_atk: 'Assault',
    mode_def: 'Defence',
    mode_neu: 'Switching...',
    ml: 'Mode',
    tip_dev: '📈 +75% growth — cannot attack',
    tip_atk: '⚔️ ×2 push — growth halted',
    tip_def: '🛡️ enemy push −75% — your attacks cost ×2',
    switching: 'Switching — 3s...',
    dl_children: 'children',
    dl_women: 'women',
    dl_elderly: 'elderly',
    menu_play: 'Play',
    menu_tagline: 'What is the price of a kilometer?',
    menu_settings: 'Settings',
    menu_version: 'web · concept',
    pause_title: 'Paused',
    pause_resume: 'Resume',
    pause_restart: 'Restart',
    pause_menu: 'Main menu',
    settings_title: 'Settings',
    settings_close: 'Close',
    settings_sound: 'Sound',
    settings_sound_on: 'on',
    settings_sound_off: 'off',
    settings_speed: 'Growth speed',
    settings_speed_slow: 'Slow',
    settings_speed_normal: 'Normal',
    settings_speed_fast: 'Fast',
    settings_lang: 'Language',
    end_to_menu: 'Main menu',
    btn_memorial: 'Name the fallen',
    mem_prompt: 'You may name one of the fallen.',
    mem_sub: 'Enter a name — or press “Skip”.',
    mem_save: 'Remember',
    mem_skip: 'Skip',
    mem_list_title: 'Memorial of this session',
    mem_empty: 'No names have been entered.',
    menu_help: 'Help',
    help_title: 'WAR MANUAL',
    help_close: 'Back',
    help_text: `There are no accidental victories in this war. Every kilometer has a price—a human one.

1. RESOURCE: YOUR POPULATION
Your population is both your army and your ability to strike. Every "Advance" click costs lives. The further you push into enemy territory, the faster your casualties rise.

2. DYNAMIC MODES (3S SWITCHING):
• ECONOMY (📈): Halts all attacks but provides massive population growth. Use this to recover after heavy combat.
• ASSAULT (⚔️): Doubles your pushing power but completely stops population growth.
• DEFENCE (🛡️): Reduces enemy pushing power by 75%. Your attacks cost 2x more, but the enemy's advance is effectively blocked.

3. VICTORY AND DEFEAT
The war ends when the border reaches either capital or when one nation's population is completely exhausted.

Whose blood will be spilled next?`,
  },
};

/**
 * Локализация UI: текущий язык и строки для DOM.
 */
export class I18n {
  constructor() {
    /** @type {'ru'|'en'} */
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    this.lang = browserLang.startsWith('ru') ? 'ru' : 'en';
  }

  /** @param {string} key */
  t(key) {
    const row = TABLE[this.lang];
    return (row && row[key]) || key;
  }

  toggle() {
    this.lang = this.lang === 'ru' ? 'en' : 'ru';
  }

  /** Локаль для форматирования чисел */
  get numberLocale() {
    return this.lang === 'en' ? 'en-US' : 'ru-RU';
  }

  /** Длительность партии на экране итогов */
  formatDuration(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return this.lang === 'ru' ? `${m} мин ${s} с` : `${m}m ${s}s`;
  }

  applyStaticLabels() {
    setText('menu-lang', this.t('cb_lang'));
     setText('menu-play', this.t('menu_play'));
    setText('menu-settings', this.t('menu_settings'));
    setText('menu-help', this.t('menu_help'));
    setText('menu-tagline', this.t('menu_tagline'));
    setText('menu-version', this.t('menu_version'));
    setText('pause-title', this.t('pause_title'));
    setText('pause-resume', this.t('pause_resume'));
    setText('pause-restart', this.t('pause_restart'));
    setText('pause-menu', this.t('pause_menu'));
    setText('settings-close', this.t('settings_close'));
    setText('settings-h', this.t('settings_title'));
    setText('set-lbl-sound', this.t('settings_sound'));
    setText('set-lbl-speed', this.t('settings_speed'));
    setText('set-lbl-lang', this.t('settings_lang'));
    setText('set-snd-on', this.t('settings_sound_on'));
    setText('set-snd-off', this.t('settings_sound_off'));
    setText('set-spd-slow', this.t('settings_speed_slow'));
    setText('set-spd-normal', this.t('settings_speed_normal'));
    setText('set-spd-fast', this.t('settings_speed_fast'));
    setText('btn-open-memorial', this.t('btn_memorial'));
    setText('mem-prompt', this.t('mem_prompt'));
    setText('mem-sub', this.t('mem_sub'));
    setText('mem-save-btn', this.t('mem_save'));
    setText('mem-list-title', this.t('mem_list_title'));
    setText('btn-to-menu', this.t('end_to_menu'));
    setText('dl-children', this.t('dl_children'));
    setText('dl-women', this.t('dl_women'));
    setText('dl-elderly', this.t('dl_elderly'));
    setText('cb-langbtn', this.t('cb_lang'));
    setText('lang-btn', this.t('game_lang'));
    setText('cb-head', this.t('cb_head'));
    setText('cb-btn', this.t('cb_btn'));
    setText('mbt-ai', this.t('vs_ai'));
    setText('mbt-2p', this.t('vs_2p'));
    setText('hint-abl', this.t('atk_l'));
    setText('hint-ard', this.t('atk_r'));
    setText('e-silence', this.t('e_silence'));
    setText('e-title', this.t('e_title'));
    setText('el-t', this.t('el_t'));
    setText('el-d', this.t('el_d'));
    setText('btn-new', this.t('btn_new'));
    setText('btn-rematch', this.t('btn_rematch'));
    setText('ml-l', this.t('ml'));
    setText('ml-r', this.t('ml'));
    const ds = el('diff-sel');
    if (ds) {
      ds.options[0].text = this.t('d_med');
      ds.options[1].text = this.t('d_easy');
      ds.options[2].text = this.t('d_hard');
    }
    setText('help-title', this.t('help_title'));
    setText('help-text', this.t('help_text'));
    setText('help-close', this.t('help_close'));
  }
}
