const UI_TEXT_CONFIG = {
  locale: 'en',
  fallbackLocale: 'en',
  dictionaries: {
    en: {
      common: {
        continue: 'Continue',
      },
      hud: {
        score_prefix: 'Score',
        level_prefix: 'Level',
        core_label: 'Core',
        skill: {
          locked: 'LOCK',
          aiming: 'AIM!',
          ready: 'READY',
        },
        right_ult: {
          label: 'ULT',
          ready: 'READY',
          charging: 'Charging',
          hold: 'Hold',
          hold_ready: 'Hold 2s',
        },
        perfect_popup: 'PERFECT',
        health_pot_label: '❤️',
      },
      game_over: {
        title: 'GAME OVER',
        final_score: 'Final Score',
      },
      level_clear: {
        title: 'CLEAR',
        continue_button: 'Continue',
      },
      card_picker: {
        title: 'Choose Upgrade',
      },
      cards: {
        core_pierce_main: {
          name: 'Pierce Main',
          desc: 'Main weapon starts in Pierce form and gains +{percent}% damage',
        },
        core_shotgun_main: {
          name: 'Shotgun Main',
          desc: 'Main weapon starts in Shotgun form and fires {pellets} spread pellets',
        },
        core_left_explosion: {
          name: 'Blast Core',
          desc: 'Left bomb gains +{damagePercent}% damage and +{radiusPercent}% blast radius',
        },
        core_right_guard: {
          name: 'Guard Core',
          desc: 'Right tower gains +{damagePercent}% damage and +{speedPercent}% attack speed',
        },
        core_control_knockback: {
          name: 'Control Core',
          desc: 'Gain +{knockback} knockback level and +{pull} gravity pull level',
        },
        core_combo_engine: {
          name: 'Rapid / Combo Main',
          desc: 'Main weapon starts in Rapid form and combo hits grant +{gaugePercent}% extra card gauge',
        },
        main_damage: {
          name: 'Main Damage +{percent}%',
          desc: 'Main weapon deals {percent}% more damage per stack',
        },
        main_fire_rate: {
          name: 'Main Fire Rate +{percent}%',
          desc: 'Main weapon fires {percent}% faster per stack',
        },
        sub_damage: {
          name: 'Sub Damage +{percent}%',
          desc: 'Sub weapon deals {percent}% more damage per stack',
        },
        sub_cooldown: {
          name: 'Sub Cooldown Speed +{percent}%',
          desc: 'Sub weapon cooldown is {percent}% shorter per stack',
        },
        sub_range: {
          name: 'Sub Range +{percent}%',
          desc: 'Sub weapon explosion radius is {percent}% larger per stack',
        },
        passive_damage: {
          name: 'Passive Damage +{percent}%',
          desc: 'Passive tower deals {percent}% more damage per stack',
        },
        passive_fire_rate: {
          name: 'Passive Fire Rate +{percent}%',
          desc: 'Passive tower fires {percent}% faster per stack',
        },
        passive_multitarget: {
          name: 'Passive Multitarget +{targets} Target',
          desc: 'Passive tower attacks {targets} more enemy per stack (max {maxLevel})',
        },
        hp_up: {
          name: 'Max HP +1',
          desc: 'Increase max HP by 1',
        },
        main_knockback: {
          name: 'Main Knockback',
          desc: 'Main shots push enemies back on hit',
        },
        sub_pull: {
          name: 'Sub Gravity Pull',
          desc: 'Sub weapon pulls nearby enemies on landing',
        },
        main_multishot: {
          name: 'Main Multishot',
          desc: 'Main weapon fires an extra projectile path',
        },
        main_power_shot: {
          name: 'Main Power Shot',
          desc: 'Every {shots}th main shot deals heavy bonus damage',
        },
        pierce_focus: {
          name: 'Pierce Focus',
          desc: 'Pierce shots gain +{damagePercent}% damage and +{pierce} extra pierce',
        },
        shotgun_close_burst: {
          name: 'Close Burst',
          desc: 'Shotgun pellets deal up to +{bonusPercent}% damage at close range',
        },
        left_volatile_payload: {
          name: 'Volatile Payload',
          desc: 'Left bomb gains +{damagePercent}% damage and +{speedPercent}% cooldown speed',
        },
        right_hold_fast: {
          name: 'Hold Fast',
          desc: 'Right tower gains +{damagePercent}% damage and +{guardPercent}% inner-zone damage',
        },
        combo_momentum: {
          name: 'Combo Momentum',
          desc: 'Combo hits grant +{gaugePercent}% extra card gauge and +{fireRatePercent}% main fire rate',
        },
        beam_form_twin: {
          name: 'Twin Beam',
          desc: 'Main beam splits into two beams. The second beam deals reduced damage',
        },
        beam_form_satellite: {
          name: 'Satellite Beam',
          desc: 'Adds a weaker auto-targeting sub beam that helps attack dangerous enemies',
        },
        beam_form_continuous: {
          name: 'Continuous Beam',
          desc: 'Main beam becomes a continuous beam that uses energy while held',
        },
        beam_twin_equalized: {
          name: 'Equalized Beam',
          desc: 'Increase the second beam damage',
        },
        beam_twin_cross: {
          name: 'Cross Focus',
          desc: 'Twin beams create a stronger crossing hit zone',
        },
        beam_satellite_smart_lock: {
          name: 'Smart Lock',
          desc: 'Satellite beam locks onto targets faster and more reliably',
        },
        beam_satellite_relay: {
          name: 'Relay Beam',
          desc: 'Satellite beam can jump to a new target after a kill',
        },
        beam_continuous_heat_focus: {
          name: 'Heat Focus',
          desc: 'Continuous beam deals more damage when staying on the same target',
        },
        beam_continuous_stable: {
          name: 'Stable Output',
          desc: 'Continuous beam consumes less energy and is easier to maintain',
        },
        beam_damage: {
          name: 'Beam Damage',
          desc: 'Beam damage increases',
        },
        beam_width: {
          name: 'Beam Width',
          desc: 'Beam hit width increases',
        },
        beam_recharge: {
          name: 'Beam Recharge',
          desc: 'Beam ammo and energy recover faster',
        },
      },
      loadout: {
        start_button: 'Start Guarding',
        current_prefix: 'Current',
        card: {
          selected: 'Selected',
          click_to_select: 'Click',
        },
        card_role: {
          left: 'Skill',
          center: 'Main Core',
          right: 'Passive',
        },
        summary: {
          title: 'Loadout',
          left: 'Left',
          center: 'Main',
          right: 'Right',
          right_ultimate: 'Right Ult',
        },
        placeholder: {
          weapon_choices_later: 'Weapon choices will be added later.',
        },
        right_ultimate: {
          title: 'Ultimate Loadout',
          subtitle: 'Pick the right tower ultimate before the run starts.',
        },
        tabs: {
          left: {
            title: 'Left Tower',
            badge: 'SKILL SLOT',
            desc: 'Choose your starting skill weapon.',
          },
          center: {
            title: 'Main Weapon',
            badge: 'WEAPON CORE',
            desc: 'Choose your starting weapon core.',
          },
          right: {
            title: 'Right Tower',
            badge: 'PASSIVE SLOT',
            desc: 'Choose your starting passive defense.',
          },
        },
      },
      weapons: {
        left: {
          bomb: {
            name: 'Bomb',
            desc: 'Arcing explosion shot',
          },
        },
        center: {
          standard: {
            name: 'Standard',
            desc: 'Balanced shot',
          },
          wide: {
            name: 'Wide',
            desc: 'Easier to hit',
          },
          pierce: {
            name: 'Pierce',
            desc: 'Narrow pierce shot',
          },
        },
        right: {
          auto_bolt: {
            name: 'Auto Bolt',
            desc: 'Automatic defense shot',
          },
        },
        ultimates: {
          repulse: {
            name: 'Repulse',
            desc: 'Knock all alive enemies back toward spawn.',
          },
          freeze: {
            name: 'Freeze',
            desc: 'Freeze all alive enemies for 3 seconds.',
          },
        },
      },
    },
    zh_tw: {
      common: {
        continue: '繼續',
      },
      hud: {
        score_prefix: '分數',
        level_prefix: '關卡',
        core_label: '核心',
        skill: {
          locked: '鎖定',
          aiming: '瞄準中',
          ready: '準備就緒',
        },
        perfect_popup: '完美',
        health_pot_label: '❤️',
      },
      game_over: {
        title: '遊戲結束',
        final_score: '最終分數',
      },
      level_clear: {
        title: '通關',
        continue_button: '繼續',
      },
      card_picker: {
        title: '選擇升級',
      },
      cards: {
        core_pierce_main: {
          name: 'Pierce Core',
          desc: 'Switch main weapon to Pierce and gain +{percent}% main damage',
        },
        core_shotgun_main: {
          name: 'Shotgun Core',
          desc: 'Switch main weapon to Wide and fire {pellets} spread pellets',
        },
        core_left_explosion: {
          name: 'Blast Core',
          desc: 'Left bomb gains +{damagePercent}% damage and +{radiusPercent}% blast radius',
        },
        core_right_guard: {
          name: 'Guard Core',
          desc: 'Right tower gains +{damagePercent}% damage and +{speedPercent}% attack speed',
        },
        core_control_knockback: {
          name: 'Control Core',
          desc: 'Gain +{knockback} knockback level and +{pull} gravity pull level',
        },
        core_combo_engine: {
          name: 'Combo Core',
          desc: 'Combo hits grant +{gaugePercent}% extra card gauge and +5% main damage',
        },
        main_damage: {
          name: '主武傷害 +{percent}%',
          desc: '主武器每層造成 {percent}% 額外傷害',
        },
        main_fire_rate: {
          name: '主武射速 +{percent}%',
          desc: '主武器每層提升 {percent}% 射速',
        },
        sub_damage: {
          name: '副武傷害 +{percent}%',
          desc: '副武器每層造成 {percent}% 額外傷害',
        },
        sub_cooldown: {
          name: '副武冷卻速度 +{percent}%',
          desc: '副武器每層縮短 {percent}% 冷卻時間',
        },
        sub_range: {
          name: '副武範圍 +{percent}%',
          desc: '副武器爆炸半徑每層提升 {percent}%',
        },
        passive_damage: {
          name: '被動傷害 +{percent}%',
          desc: '被動塔每層造成 {percent}% 額外傷害',
        },
        passive_fire_rate: {
          name: '被動射速 +{percent}%',
          desc: '被動塔每層提升 {percent}% 射速',
        },
        passive_multitarget: {
          name: '被動多目標 +{targets} 目標',
          desc: '被動塔每層可多攻擊 {targets} 個敵人（上限 {maxLevel} 層）',
        },
        hp_up: {
          name: '最大 HP +1',
          desc: '最大 HP 提升 1',
        },
        main_knockback: {
          name: '主武擊退',
          desc: '主武射擊命中時會擊退敵人',
        },
        sub_pull: {
          name: '副武重力吸引',
          desc: '副武器落地時會吸引附近敵人',
        },
        main_multishot: {
          name: '主武多重射擊',
          desc: '主武器會額外發射一條彈道',
        },
        main_power_shot: {
          name: '主武強力射擊',
          desc: '每 {shots} 發主武射擊中，第 {shots} 發造成大幅額外傷害',
        },
      },
      loadout: {
        start_button: '開始遊戲',
        current_prefix: '目前',
        card: {
          selected: '已選擇',
          click_to_select: '點擊選擇',
        },
        card_role: {
          left: '技能',
          center: '主核心',
          right: '被動',
        },
        summary: {
          title: '配置',
          left: '左塔',
          center: '主武器',
          right: '右塔',
          right_ultimate: '右大招',
        },
        placeholder: {
          weapon_choices_later: '武器選項之後加入。',
        },
        right_ultimate: {
          title: '終極配置',
          subtitle: '在開始前選擇右塔終極技能。',
        },
        tabs: {
          left: {
            title: '左塔',
            badge: '技能槽',
            desc: '選擇起始技能武器。',
          },
          center: {
            title: '主武器',
            badge: '武器核心',
            desc: '選擇你的起始武器核心。',
          },
          right: {
            title: '右塔',
            badge: '被動槽',
            desc: '選擇起始被動防禦。',
          },
        },
      },
      weapons: {
        left: {
          bomb: {
            name: '炸彈',
            desc: '拋物線爆炸攻擊',
          },
        },
        center: {
          standard: {
            name: '標準',
            desc: '平衡型射擊',
          },
          wide: {
            name: '寬彈',
            desc: '較容易命中',
          },
          pierce: {
            name: '穿透',
            desc: '狹窄判定穿透彈',
          },
        },
        right: {
          auto_bolt: {
            name: '自動電彈',
            desc: '自動防守射擊',
          },
        },
      },
    },
  },
};

const CARD_DISPLAY_CATEGORY_TEXT = {
  en: {
    firing_form: 'Firing Form',
    form_upgrade: 'Form Upgrade',
    stat_upgrade: 'Stat Upgrade',
    ammo_energy: 'Ammo / Energy',
    support: 'Support',
    upgrade: 'Upgrade',
  },
  zh_tw: {
    firing_form: '發射型態',
    form_upgrade: '形態強化',
    stat_upgrade: '數值強化',
    ammo_energy: '彈藥 / 能量',
    support: '支援',
    upgrade: '強化',
  },
};

const CARD_EXTRA_TEXT = {
  en: {
    cards: {
      beam_form_twin: {
        name: 'Twin Beam',
        desc: 'Main beam splits into two beams. The second beam deals reduced damage',
      },
      beam_form_satellite: {
        name: 'Satellite Beam',
        desc: 'Adds a weaker auto-targeting sub beam that helps attack dangerous enemies',
      },
      beam_form_continuous: {
        name: 'Continuous Beam',
        desc: 'Main beam becomes a continuous beam that uses energy while held',
      },
      beam_twin_equalized: {
        name: 'Equalized Beam',
        desc: 'Increase the second beam damage',
      },
      beam_twin_cross: {
        name: 'Cross Focus',
        desc: 'Twin beams create a stronger crossing hit zone',
      },
      beam_satellite_smart_lock: {
        name: 'Smart Lock',
        desc: 'Satellite beam locks onto targets faster and more reliably',
      },
      beam_satellite_relay: {
        name: 'Relay Beam',
        desc: 'Satellite beam can jump to a new target after a kill',
      },
      beam_continuous_heat_focus: {
        name: 'Heat Focus',
        desc: 'Continuous beam deals more damage when staying on the same target',
      },
      beam_continuous_stable: {
        name: 'Stable Output',
        desc: 'Continuous beam consumes less energy and is easier to maintain',
      },
      beam_damage: {
        name: 'Beam Damage',
        desc: 'Beam damage increases',
      },
      beam_width: {
        name: 'Beam Width',
        desc: 'Beam hit width increases',
      },
      beam_recharge: {
        name: 'Beam Recharge',
        desc: 'Beam ammo and energy recover faster',
      },
    },
  },
  zh_tw: {
    cards: {
      beam_form_twin: {
        name: '雙重光束',
        desc: '主光束分裂為兩道光束，第二道光束造成較低傷害',
      },
      beam_form_satellite: {
        name: '衛星副光束',
        desc: '增加一道較弱的自動索敵副光束，幫助攻擊危險目標',
      },
      beam_form_continuous: {
        name: '持續光束',
        desc: '主光束變為可持續輸出的光束，按住時會消耗能量',
      },
      beam_twin_equalized: {
        name: '光束平衡',
        desc: '提高第二道光束的傷害',
      },
      beam_twin_cross: {
        name: '交叉焦點',
        desc: '雙重光束交會時形成更強的交叉命中區',
      },
      beam_satellite_smart_lock: {
        name: '智慧鎖定',
        desc: '衛星副光束能更快、更聰明地鎖定目標',
      },
      beam_satellite_relay: {
        name: '連鎖轉移',
        desc: '衛星副光束擊殺後可轉移到新的目標',
      },
      beam_continuous_heat_focus: {
        name: '熱能聚焦',
        desc: '持續光束持續照射同一目標時造成更高傷害',
      },
      beam_continuous_stable: {
        name: '穩定輸出',
        desc: '持續光束消耗更少能量，更容易維持輸出',
      },
      beam_damage: {
        name: '光束傷害',
        desc: '提高光束傷害',
      },
      beam_width: {
        name: '光束寬度',
        desc: '提高光束命中寬度',
      },
      beam_recharge: {
        name: '光束回充',
        desc: '提高光束彈藥與能量回復速度',
      },
    },
  },
};

function getUiText(key) {
  function readPath(source, path) {
    const parts = path.split('.');
    let current = source;
    for (const part of parts) {
      if (current == null || typeof current !== 'object' || !(part in current)) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  const localeDict = UI_TEXT_CONFIG.dictionaries?.[UI_TEXT_CONFIG.locale];
  const fallbackDict = UI_TEXT_CONFIG.dictionaries?.[UI_TEXT_CONFIG.fallbackLocale];
  if (key.startsWith('card_categories.')) {
    const categoryKey = key.slice('card_categories.'.length);
    const localizedCategory = CARD_DISPLAY_CATEGORY_TEXT[UI_TEXT_CONFIG.locale]?.[categoryKey];
    if (localizedCategory !== undefined) return localizedCategory;
    const fallbackCategory = CARD_DISPLAY_CATEGORY_TEXT[UI_TEXT_CONFIG.fallbackLocale]?.[categoryKey];
    if (fallbackCategory !== undefined) return fallbackCategory;
  }
  const localizedExtraValue = readPath(CARD_EXTRA_TEXT[UI_TEXT_CONFIG.locale], key);
  if (localizedExtraValue !== undefined) return localizedExtraValue;
  const fallbackExtraValue = readPath(CARD_EXTRA_TEXT[UI_TEXT_CONFIG.fallbackLocale], key);
  if (fallbackExtraValue !== undefined) return fallbackExtraValue;
  const localeValue = readPath(localeDict, key);
  if (localeValue !== undefined) return localeValue;
  const fallbackValue = readPath(fallbackDict, key);
  if (fallbackValue !== undefined) return fallbackValue;
  return key;
}

function getUiTextFormat(key, vars) {
  let text = String(getUiText(key));
  if (!vars || typeof vars !== 'object') return text;
  for (const [name, value] of Object.entries(vars)) {
    const token = `{${name}}`;
    text = text.split(token).join(String(value));
  }
  return text;
}

function setUiLocale(locale) {
  if (UI_TEXT_CONFIG.dictionaries?.[locale]) {
    UI_TEXT_CONFIG.locale = locale;
  }
  return UI_TEXT_CONFIG.locale;
}

function toggleUiLocale() {
  const nextLocale = UI_TEXT_CONFIG.locale === 'zh_tw' ? 'en' : 'zh_tw';
  return setUiLocale(nextLocale);
}
