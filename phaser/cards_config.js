// ============================================================
// CARD TUNING — single source of truth
// ============================================================

const CARD_BASIC_BONUS_CONFIG = {
  mainDamageBonus:        0.05,
  mainFireRateBonus:      0.05,
  subDamageBonus:         0.05,
  subCooldownBonus:       0.05,
  subRangeBonus:          0.05,
  passiveDamageBonus:     0.05,
  passiveFireRateBonus:   0.05,
  passiveMultitargetBonus: 0.05,
};

const MAIN_POWER_SHOT_CONFIG = {
  triggerEveryShots:  5,
  baseMultiplier:     1.4,
  multiplierPerLevel: 0.2,
  maxMultiplier:      2.2,
  maxLevel:           5,
};

const MAIN_MULTISHOT_CONFIG = {
  maxLevel:              1,
  extraProjectilesPerLevel: 1,
  angleOffsetDeg:        8,
};

const MAIN_KNOCKBACK_CONFIG = {
  maxLevel:       5,
  knockbackByLevel: [0, 6, 10, 15, 21, 28],
};

const PASSIVE_MULTITARGET_CONFIG = {
  targetsPerLevel: 1,
  maxLevel:        4,
};

const SUB_PULL_CONFIG = {
  maxLevel: 5,
  pullByLevel: [
    { distance:  0, duration: 0    },
    { distance: 10, duration: 0.15 },
    { distance: 18, duration: 0.20 },
    { distance: 28, duration: 0.25 },
    { distance: 40, duration: 0.30 },
    { distance: 55, duration: 0.35 },
  ],
};

const CARD_RARITY_WEIGHTS = {
  common:    100,
  uncommon:   60,
  rare:       30,
  epic:       12,
  legendary:   5,
};

const CARD_RARITY_COLORS = {
  common:    { bg: 0x1a2a3a, bgHover: 0x2a3a4a, stroke: 0xd8dde3, title: '#d8dde3' },
  uncommon:  { bg: 0x163822, bgHover: 0x265832, stroke: 0x5ee38a, title: '#5ee38a' },
  rare:      { bg: 0x12324a, bgHover: 0x22425a, stroke: 0x5ad2f0, title: '#5ad2f0' },
  epic:      { bg: 0x301a4a, bgHover: 0x402a5a, stroke: 0xb56cff, title: '#b56cff' },
  legendary: { bg: 0x4a3512, bgHover: 0x5a4522, stroke: 0xffe066, title: '#ffe066' },
};

// ============================================================

const CARD_POOL = [

  // ================================================================
  // MAIN WEAPON
  // ================================================================
  {
    id: 'main_damage',
    label: `Main Damage +${CARD_BASIC_BONUS_CONFIG.mainDamageBonus * 100}%`,
    desc: `Main weapon deals ${CARD_BASIC_BONUS_CONFIG.mainDamageBonus * 100}% more damage per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.mainDamageBonus += CARD_BASIC_BONUS_CONFIG.mainDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'main_fire_rate',
    label: `Main Fire Rate +${CARD_BASIC_BONUS_CONFIG.mainFireRateBonus * 100}%`,
    desc: `Main weapon fires ${CARD_BASIC_BONUS_CONFIG.mainFireRateBonus * 100}% faster per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.mainFireRateBonus += CARD_BASIC_BONUS_CONFIG.mainFireRateBonus; },
    canPick() { return true; },
  },

  // ================================================================
  // SUB WEAPON
  // ================================================================
  {
    id: 'sub_damage',
    label: `Sub Damage +${CARD_BASIC_BONUS_CONFIG.subDamageBonus * 100}%`,
    desc: `Sub weapon deals ${CARD_BASIC_BONUS_CONFIG.subDamageBonus * 100}% more damage per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.subDamageBonus += CARD_BASIC_BONUS_CONFIG.subDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'sub_cooldown',
    label: `Sub Cooldown Speed +${CARD_BASIC_BONUS_CONFIG.subCooldownBonus * 100}%`,
    desc: `Sub weapon cooldown is ${CARD_BASIC_BONUS_CONFIG.subCooldownBonus * 100}% shorter per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) {
      scene.subCooldownBonus += CARD_BASIC_BONUS_CONFIG.subCooldownBonus;
      if (scene.skillCooldowns.sub) {
        scene.skillCooldowns.sub.max = SUB_WEAPON_CONFIG.cooldownSeconds / (1 + scene.subCooldownBonus);
      }
    },
    canPick() { return true; },
  },
  {
    id: 'sub_range',
    label: `Sub Range +${CARD_BASIC_BONUS_CONFIG.subRangeBonus * 100}%`,
    desc: `Sub weapon explosion radius is ${CARD_BASIC_BONUS_CONFIG.subRangeBonus * 100}% larger per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.subRangeBonus += CARD_BASIC_BONUS_CONFIG.subRangeBonus; },
    canPick() { return true; },
  },

  // ================================================================
  // PASSIVE WEAPON
  // ================================================================
  {
    id: 'passive_damage',
    label: `Passive Damage +${CARD_BASIC_BONUS_CONFIG.passiveDamageBonus * 100}%`,
    desc: `Passive tower deals ${CARD_BASIC_BONUS_CONFIG.passiveDamageBonus * 100}% more damage per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.passiveDamageBonus += CARD_BASIC_BONUS_CONFIG.passiveDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'passive_fire_rate',
    label: `Passive Fire Rate +${CARD_BASIC_BONUS_CONFIG.passiveFireRateBonus * 100}%`,
    desc: `Passive tower fires ${CARD_BASIC_BONUS_CONFIG.passiveFireRateBonus * 100}% faster per stack`,
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    apply(scene) { scene.passiveFireRateBonus += CARD_BASIC_BONUS_CONFIG.passiveFireRateBonus; },
    canPick() { return true; },
  },
  {
    id: 'passive_multitarget',
    label: `Passive Multitarget +${PASSIVE_MULTITARGET_CONFIG.targetsPerLevel} Target`,
    desc: `Passive tower attacks ${PASSIVE_MULTITARGET_CONFIG.targetsPerLevel} more enemy per stack (max ${PASSIVE_MULTITARGET_CONFIG.maxLevel})`,
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: PASSIVE_MULTITARGET_CONFIG.maxLevel,
    apply(scene) {
      scene.passiveMultitargetLevel = Math.min((scene.passiveMultitargetLevel || 0) + 1, PASSIVE_MULTITARGET_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.passiveMultitargetLevel || 0) < PASSIVE_MULTITARGET_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // HP
  // ================================================================
  {
    id: 'hp_up',
    label: 'Max HP +1',
    desc: 'Increase max HP by 1',
    type: 'stat',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    apply(scene) {
      scene.maxHp = (scene.maxHp || PLAYER_HP_START) + 1;
      scene.hp += 1;
      scene.cardHpCount = (scene.cardHpCount || 0) + 1;
    },
    canPick(scene) {
      return (scene.cardHpCount || 0) < CARD_HP_MAX_TIMES;
    },
  },

  // ================================================================
  // SPECIAL: Main Knockback
  // ================================================================
  {
    id: 'main_knockback',
    label: 'Main Knockback',
    desc: 'Main shots push enemies back on hit',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: MAIN_KNOCKBACK_CONFIG.maxLevel,
    apply(scene) {
      scene.mainKnockbackLevel = Math.min((scene.mainKnockbackLevel || 0) + 1, MAIN_KNOCKBACK_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainKnockbackLevel || 0) < MAIN_KNOCKBACK_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // SPECIAL: Sub Gravity Pull
  // ================================================================
  {
    id: 'sub_pull',
    label: 'Sub Gravity Pull',
    desc: 'Sub weapon pulls nearby enemies on landing',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: SUB_PULL_CONFIG.maxLevel,
    apply(scene) {
      scene.subPullLevel = Math.min((scene.subPullLevel || 0) + 1, SUB_PULL_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.subPullLevel || 0) < SUB_PULL_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // LEGENDARY: Main Multishot
  // ================================================================
  {
    id: 'main_multishot',
    label: 'Main Multishot',
    desc: 'Main weapon fires an extra projectile path',
    type: 'legendary',
    rarity: 'legendary',
    weight: CARD_RARITY_WEIGHTS.legendary,
    maxLevel: MAIN_MULTISHOT_CONFIG.maxLevel,
    apply(scene) {
      scene.mainMultishotLevel = Math.min((scene.mainMultishotLevel || 0) + 1, MAIN_MULTISHOT_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainMultishotLevel || 0) < MAIN_MULTISHOT_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // SPECIAL: Main Power Shot
  // Every N shots deals bonus damage. Lv1=1.4x, +0.2/level, max 2.2x
  // ================================================================
  {
    id: 'main_power_shot',
    label: 'Main Power Shot',
    desc: `Every ${MAIN_POWER_SHOT_CONFIG.triggerEveryShots}th main shot deals heavy bonus damage`,
    type: 'special',
    rarity: 'epic',
    weight: CARD_RARITY_WEIGHTS.epic,
    maxLevel: MAIN_POWER_SHOT_CONFIG.maxLevel,
    apply(scene) {
      scene.mainPowerShotLevel = Math.min((scene.mainPowerShotLevel || 0) + 1, MAIN_POWER_SHOT_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainPowerShotLevel || 0) < MAIN_POWER_SHOT_CONFIG.maxLevel;
    },
  },
];
