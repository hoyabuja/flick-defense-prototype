// ============================================================
// CARD TUNING - single source of truth
// ============================================================

const CARD_BASIC_BONUS_CONFIG = {
  mainDamageBonus:          0.05,
  mainFireRateBonus:        0.05,
  subDamageBonus:           0.05,
  subCooldownBonus:         0.05,
  subRangeBonus:            0.05,
  passiveDamageBonus:       0.05,
  passiveFireRateBonus:     0.05,
  passiveMultitargetBonus:  0.05,
};

const MAIN_POWER_SHOT_CONFIG = {
  triggerEveryShots:  5,
  baseMultiplier:     1.4,
  multiplierPerLevel: 0.2,
  maxMultiplier:      2.2,
  maxLevel:           5,
};

const MAIN_MULTISHOT_CONFIG = {
  maxLevel:                 1,
  extraProjectilesPerLevel: 1,
  angleOffsetDeg:           8,
};

const MAIN_KNOCKBACK_CONFIG = {
  maxLevel:         5,
  knockbackByLevel: [0, 10, 20, 30, 40, 50],
};

const PASSIVE_MULTITARGET_CONFIG = {
  targetsPerLevel: 1,
  maxLevel:        4,
};

const SUB_PULL_CONFIG = {
  maxLevel: 5,
  pullByLevel: [
    { distance:  0, duration: 0,    radiusMultiplier: 0    },
    { distance: 35, duration: 0.15, radiusMultiplier: 2    },
    { distance: 40, duration: 0.20, radiusMultiplier: 2.25 },
    { distance: 45, duration: 0.25, radiusMultiplier: 2.3  },
    { distance: 50, duration: 0.30, radiusMultiplier: 2.4  },
    { distance: 55, duration: 0.35, radiusMultiplier: 2.5  },
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

const CARD_ROLE_WEIGHTS = {
  core:    1.0,
  synergy: 1.15,
  utility: 0.9,
  stat:    0.6,
};

const CARD_TAG_WEIGHT_BONUS_PER_MATCH = 0.45;
const CARD_REQUIRED_TAG_WEIGHT_BONUS = 0.25;
const CARD_EARLY_STAT_WEIGHT_MULTIPLIER = 0.45;
const BEAM_FORM_CARD_IDS = ['beam_form_twin', 'beam_form_satellite', 'beam_form_continuous'];

function initCardDraftState(scene) {
  if (!scene.cardLevels) scene.cardLevels = {};
  if (!scene.pickedCardIds) scene.pickedCardIds = {};
  if (!scene.pickedCardTags) scene.pickedCardTags = {};
  if (!scene.pickedCardRoles) scene.pickedCardRoles = {};
  if (!scene.selectedMainWeaponCoreTags) scene.selectedMainWeaponCoreTags = [];
  if (scene.cardDraftCount == null) scene.cardDraftCount = 0;
}

function getCardRole(card) {
  return card.role || 'stat';
}

function getCardDisplayCategoryKey(card) {
  return card.displayCategoryKey || 'upgrade';
}

function getCardPickStage(card) {
  return card.pickStage || 'normal';
}

function isBeamMainSelected(scene) {
  return getSceneTagCount(scene, 'pierce') > 0;
}

function hasSelectedBeamForm(scene) {
  return !!scene.selectedBeamForm
    || getSceneTagCount(scene, 'twin_beam') > 0
    || getSceneTagCount(scene, 'satellite_beam') > 0
    || getSceneTagCount(scene, 'continuous_beam') > 0;
}

function getEligibleBeamFormCards(scene, eligibleCards) {
  const eligibleById = new Map(eligibleCards.map((card) => [card.id, card]));
  return BEAM_FORM_CARD_IDS
    .map((cardId) => eligibleById.get(cardId))
    .filter(Boolean);
}

function getCardTextVars(card, scene) {
  if (card.getTextVars) return card.getTextVars(scene);
  if (typeof card.textVars === 'function') return card.textVars(scene);
  return card.textVars || {};
}

function getCardLevel(scene, cardId) {
  return scene.cardLevels?.[cardId] || 0;
}

function getSceneTagCount(scene, tag) {
  const pickedCount = scene.pickedCardTags?.[tag] || 0;
  const weaponCoreCount = (scene.selectedMainWeaponCoreTags || []).reduce((count, selectedTag) => {
    return count + (selectedTag === tag ? 1 : 0);
  }, 0);
  return pickedCount + weaponCoreCount;
}

function cardHasRequiredTags(scene, card) {
  const requiresTags = card.requiresTags || [];
  return requiresTags.every((tag) => getSceneTagCount(scene, tag) > 0);
}

function cardHasExcludedTags(scene, card) {
  const excludesTags = card.excludesTags || [];
  return excludesTags.some((tag) => getSceneTagCount(scene, tag) > 0);
}

function canCardAppear(scene, card) {
  initCardDraftState(scene);
  if (card.loadoutOnly) {
    return false;
  }
  if (card.maxLevel != null && getCardLevel(scene, card.id) >= card.maxLevel) {
    return false;
  }
  if (!cardHasRequiredTags(scene, card)) {
    return false;
  }
  if (cardHasExcludedTags(scene, card)) {
    return false;
  }
  if (card.canPick && !card.canPick(scene)) {
    return false;
  }
  return true;
}

function getCardDraftWeight(scene, card) {
  const baseWeight = card.weight ?? CARD_RARITY_WEIGHTS.common;
  const role = getCardRole(card);
  let weight = baseWeight * (CARD_ROLE_WEIGHTS[role] ?? 1);

  const overlapCount = (card.tags || []).reduce((count, tag) => {
    return count + (getSceneTagCount(scene, tag) > 0 ? 1 : 0);
  }, 0);
  if (overlapCount > 0) {
    weight *= 1 + overlapCount * CARD_TAG_WEIGHT_BONUS_PER_MATCH;
  }

  const requiredMatchCount = (card.requiresTags || []).reduce((count, tag) => {
    return count + (getSceneTagCount(scene, tag) > 0 ? 1 : 0);
  }, 0);
  if (requiredMatchCount > 0) {
    weight *= 1 + requiredMatchCount * CARD_REQUIRED_TAG_WEIGHT_BONUS;
  }

  if ((scene.cardDraftCount || 0) < 2 && role === 'stat') {
    weight *= CARD_EARLY_STAT_WEIGHT_MULTIPLIER;
  }

  return Math.max(0, weight);
}

function weightedSampleWithoutReplacement(candidates, count, weightResolver) {
  const pool = candidates
    .map((card) => ({ card, weight: Math.max(0, weightResolver(card)) }))
    .filter((entry) => entry.weight > 0);
  const picks = [];

  while (picks.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) break;
    let roll = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        picks.push(pool[i].card);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return picks;
}

function buildCardDraftChoices(scene, count = 3) {
  initCardDraftState(scene);
  const eligible = CARD_POOL.filter((card) => canCardAppear(scene, card));
  if (eligible.length === 0) return [];

  const isFirstDraft = (scene.cardDraftCount || 0) === 0;
  if (isFirstDraft) {
    const starterCards = eligible.filter((card) => getCardPickStage(card) === 'starter');
    if (starterCards.length > 0) {
      return starterCards.slice(0, count);
    }

    const firstRoundPool = eligible.filter((card) => getCardPickStage(card) !== 'after_starter');
    return weightedSampleWithoutReplacement(
      firstRoundPool.length > 0 ? firstRoundPool : eligible,
      count,
      (card) => getCardDraftWeight(scene, card)
    );
  }

  if (isBeamMainSelected(scene) && !hasSelectedBeamForm(scene)) {
    const beamFormCards = getEligibleBeamFormCards(scene, eligible);
    if (beamFormCards.length >= count) {
      return beamFormCards.slice(0, count);
    }
    if (beamFormCards.length > 0) {
      const chosenIds = new Set(beamFormCards.map((card) => card.id));
      const fallback = weightedSampleWithoutReplacement(
        eligible.filter((card) => !chosenIds.has(card.id)),
        count - beamFormCards.length,
        (card) => getCardDraftWeight(scene, card)
      );
      return beamFormCards.concat(fallback);
    }
  }

  return weightedSampleWithoutReplacement(
    eligible,
    count,
    (card) => getCardDraftWeight(scene, card)
  );
}

function applyCardSelection(scene, card) {
  if (!card || !canCardAppear(scene, card)) return false;
  initCardDraftState(scene);
  card.apply(scene);
  scene.cardLevels[card.id] = (scene.cardLevels[card.id] || 0) + 1;
  scene.pickedCardIds[card.id] = scene.cardLevels[card.id];
  const role = getCardRole(card);
  scene.pickedCardRoles[role] = (scene.pickedCardRoles[role] || 0) + 1;
  for (const tag of (card.tags || [])) {
    scene.pickedCardTags[tag] = (scene.pickedCardTags[tag] || 0) + 1;
  }
  return true;
}

function getMainWeaponCoreCards() {
  const orderedIds = ['core_combo_engine', 'core_pierce_main', 'core_shotgun_main'];
  return orderedIds
    .map((cardId) => CARD_POOL.find((card) => card.id === cardId && card.role === 'core' && card.coreType === 'weapon' && card.loadoutOnly))
    .filter(Boolean);
}

function getMainWeaponCoreCardById(cardId) {
  return getMainWeaponCoreCards().find((card) => card.id === cardId) || null;
}

function syncSelectedMainWeaponCoreTags(scene) {
  const selectedCard = getMainWeaponCoreCardById(scene.selectedMainWeaponCoreId);
  scene.selectedMainWeaponCoreTags = [...(selectedCard?.tags || [])];
}

function applySelectedMainWeaponCore(scene) {
  const fallbackCard = getMainWeaponCoreCardById('core_combo_engine') || getMainWeaponCoreCards()[0] || null;
  const selectedCard = getMainWeaponCoreCardById(scene.selectedMainWeaponCoreId) || fallbackCard;
  if (!selectedCard) return null;

  scene.selectedMainWeaponCoreId = selectedCard.id;
  syncSelectedMainWeaponCoreTags(scene);
  scene.selectedTowerWeaponTypes.center = 'standard';
  scene.mainShotgunLevel = 0;
  scene.comboEconomyLevel = 0;
  scene.mainDamageBonus = 0.0;

  selectedCard.apply(scene);
  return selectedCard;
}

// ============================================================

const CARD_POOL = [

  // ================================================================
  // BUILD CORE CARDS
  // ================================================================
  {
    id: 'core_pierce_main',
    labelKey: 'cards.core_pierce_main.name',
    descKey: 'cards.core_pierce_main.desc',
    textVars: { percent: 10 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'firing_form',
    coreType: 'weapon',
    loadoutOnly: true,
    tags: ['main', 'pierce'],
    excludesTags: ['shotgun'],
    apply(scene) {
      scene.selectedTowerWeaponTypes.center = 'pierce';
      scene.mainDamageBonus += 0.10;
    },
    canPick() { return false; },
  },
  {
    id: 'core_shotgun_main',
    labelKey: 'cards.core_shotgun_main.name',
    descKey: 'cards.core_shotgun_main.desc',
    textVars: { pellets: 3 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'firing_form',
    coreType: 'weapon',
    loadoutOnly: true,
    tags: ['main', 'shotgun', 'burst'],
    excludesTags: ['pierce'],
    apply(scene) {
      scene.selectedTowerWeaponTypes.center = 'wide';
      scene.mainShotgunLevel = Math.max(scene.mainShotgunLevel || 0, 1);
    },
    canPick() { return false; },
  },
  {
    id: 'core_left_explosion',
    labelKey: 'cards.core_left_explosion.name',
    descKey: 'cards.core_left_explosion.desc',
    textVars: { damagePercent: 10, radiusPercent: 15 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'support',
    coreType: 'build',
    tags: ['left', 'explosion', 'burst'],
    apply(scene) {
      scene.subDamageBonus += 0.10;
      scene.subRangeBonus += 0.15;
    },
    canPick() { return true; },
  },
  {
    id: 'core_right_guard',
    labelKey: 'cards.core_right_guard.name',
    descKey: 'cards.core_right_guard.desc',
    textVars: { damagePercent: 10, speedPercent: 10 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'support',
    coreType: 'build',
    tags: ['right', 'defense'],
    apply(scene) {
      scene.passiveDamageBonus += 0.10;
      scene.passiveFireRateBonus += 0.10;
    },
    canPick() { return true; },
  },
  {
    id: 'core_control_knockback',
    labelKey: 'cards.core_control_knockback.name',
    descKey: 'cards.core_control_knockback.desc',
    textVars: { knockback: 1, pull: 1 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'support',
    coreType: 'build',
    tags: ['control', 'knockback'],
    apply(scene) {
      scene.mainKnockbackLevel = Math.min((scene.mainKnockbackLevel || 0) + 1, MAIN_KNOCKBACK_CONFIG.maxLevel);
      scene.subPullLevel = Math.min((scene.subPullLevel || 0) + 1, SUB_PULL_CONFIG.maxLevel);
    },
    canPick() { return true; },
  },
  {
    id: 'core_combo_engine',
    labelKey: 'cards.core_combo_engine.name',
    descKey: 'cards.core_combo_engine.desc',
    textVars: { gaugePercent: 15 },
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'core',
    pickStage: 'after_starter',
    displayCategoryKey: 'firing_form',
    coreType: 'weapon',
    loadoutOnly: true,
    tags: ['combo', 'economy', 'main'],
    apply(scene) {
      scene.selectedTowerWeaponTypes.center = 'standard';
      scene.comboEconomyLevel = Math.max(scene.comboEconomyLevel || 0, 1);
      scene.mainDamageBonus += 0.05;
    },
    canPick() { return false; },
  },

  // ================================================================
  // MAIN WEAPON STATS
  // ================================================================
  {
    id: 'main_damage',
    labelKey: 'cards.main_damage.name',
    descKey: 'cards.main_damage.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.mainDamageBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['main'],
    apply(scene) { scene.mainDamageBonus += CARD_BASIC_BONUS_CONFIG.mainDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'main_fire_rate',
    labelKey: 'cards.main_fire_rate.name',
    descKey: 'cards.main_fire_rate.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.mainFireRateBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['main'],
    apply(scene) { scene.mainFireRateBonus += CARD_BASIC_BONUS_CONFIG.mainFireRateBonus; },
    canPick() { return true; },
  },

  // ================================================================
  // LEFT TOWER STATS
  // ================================================================
  {
    id: 'sub_damage',
    labelKey: 'cards.sub_damage.name',
    descKey: 'cards.sub_damage.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.subDamageBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['left', 'burst'],
    apply(scene) { scene.subDamageBonus += CARD_BASIC_BONUS_CONFIG.subDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'sub_cooldown',
    labelKey: 'cards.sub_cooldown.name',
    descKey: 'cards.sub_cooldown.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.subCooldownBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['left', 'utility'],
    apply(scene) {
      scene.subCooldownBonus += CARD_BASIC_BONUS_CONFIG.subCooldownBonus;
      if (scene.skillCooldowns.left) {
        scene.skillCooldowns.left.max = TOWER_WEAPON_TYPES.left.bomb.cooldownSeconds / (1 + scene.subCooldownBonus);
      }
    },
    canPick() { return true; },
  },
  {
    id: 'sub_range',
    labelKey: 'cards.sub_range.name',
    descKey: 'cards.sub_range.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.subRangeBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['left', 'explosion'],
    apply(scene) { scene.subRangeBonus += CARD_BASIC_BONUS_CONFIG.subRangeBonus; },
    canPick() { return true; },
  },

  // ================================================================
  // RIGHT TOWER STATS
  // ================================================================
  {
    id: 'passive_damage',
    labelKey: 'cards.passive_damage.name',
    descKey: 'cards.passive_damage.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.passiveDamageBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['right'],
    apply(scene) { scene.passiveDamageBonus += CARD_BASIC_BONUS_CONFIG.passiveDamageBonus; },
    canPick() { return true; },
  },
  {
    id: 'passive_fire_rate',
    labelKey: 'cards.passive_fire_rate.name',
    descKey: 'cards.passive_fire_rate.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.passiveFireRateBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['right'],
    apply(scene) { scene.passiveFireRateBonus += CARD_BASIC_BONUS_CONFIG.passiveFireRateBonus; },
    canPick() { return true; },
  },
  {
    id: 'passive_multitarget',
    labelKey: 'cards.passive_multitarget.name',
    descKey: 'cards.passive_multitarget.desc',
    getTextVars() {
      return {
        targets: PASSIVE_MULTITARGET_CONFIG.targetsPerLevel,
        maxLevel: PASSIVE_MULTITARGET_CONFIG.maxLevel,
      };
    },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: PASSIVE_MULTITARGET_CONFIG.maxLevel,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['right', 'defense'],
    requiresTags: ['right'],
    apply(scene) {
      scene.passiveMultitargetLevel = Math.min((scene.passiveMultitargetLevel || 0) + 1, PASSIVE_MULTITARGET_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.passiveMultitargetLevel || 0) < PASSIVE_MULTITARGET_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // UTILITY
  // ================================================================
  {
    id: 'hp_up',
    labelKey: 'cards.hp_up.name',
    descKey: 'cards.hp_up.desc',
    type: 'utility',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: CARD_HP_MAX_TIMES,
    role: 'utility',
    displayCategoryKey: 'support',
    tags: ['defense', 'utility'],
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
  // SYNERGY: PIERCE / SHOTGUN / CONTROL / COMBO
  // ================================================================
  {
    id: 'main_knockback',
    labelKey: 'cards.main_knockback.name',
    descKey: 'cards.main_knockback.desc',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: MAIN_KNOCKBACK_CONFIG.maxLevel,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'control', 'knockback'],
    requiresTags: ['control'],
    apply(scene) {
      scene.mainKnockbackLevel = Math.min((scene.mainKnockbackLevel || 0) + 1, MAIN_KNOCKBACK_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainKnockbackLevel || 0) < MAIN_KNOCKBACK_CONFIG.maxLevel;
    },
  },
  {
    id: 'sub_pull',
    labelKey: 'cards.sub_pull.name',
    descKey: 'cards.sub_pull.desc',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: SUB_PULL_CONFIG.maxLevel,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['left', 'control', 'knockback', 'explosion'],
    apply(scene) {
      scene.subPullLevel = Math.min((scene.subPullLevel || 0) + 1, SUB_PULL_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.subPullLevel || 0) < SUB_PULL_CONFIG.maxLevel;
    },
  },
  {
    id: 'main_multishot',
    labelKey: 'cards.main_multishot.name',
    descKey: 'cards.main_multishot.desc',
    type: 'legendary',
    rarity: 'legendary',
    weight: CARD_RARITY_WEIGHTS.legendary,
    maxLevel: MAIN_MULTISHOT_CONFIG.maxLevel,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'shotgun', 'burst'],
    requiresTags: ['shotgun'],
    apply(scene) {
      scene.mainMultishotLevel = Math.min((scene.mainMultishotLevel || 0) + 1, MAIN_MULTISHOT_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainMultishotLevel || 0) < MAIN_MULTISHOT_CONFIG.maxLevel;
    },
  },
  {
    id: 'main_power_shot',
    labelKey: 'cards.main_power_shot.name',
    descKey: 'cards.main_power_shot.desc',
    getTextVars() { return { shots: MAIN_POWER_SHOT_CONFIG.triggerEveryShots }; },
    type: 'special',
    rarity: 'epic',
    weight: CARD_RARITY_WEIGHTS.epic,
    maxLevel: MAIN_POWER_SHOT_CONFIG.maxLevel,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'combo', 'burst'],
    requiresTags: ['main'],
    apply(scene) {
      scene.mainPowerShotLevel = Math.min((scene.mainPowerShotLevel || 0) + 1, MAIN_POWER_SHOT_CONFIG.maxLevel);
    },
    canPick(scene) {
      return (scene.mainPowerShotLevel || 0) < MAIN_POWER_SHOT_CONFIG.maxLevel;
    },
  },

  // ================================================================
  // BUILD-SPECIFIC SYNERGIES
  // ================================================================
  {
    id: 'pierce_focus',
    labelKey: 'cards.pierce_focus.name',
    descKey: 'cards.pierce_focus.desc',
    textVars: { damagePercent: 10, pierce: 1 },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce'],
    requiresTags: ['pierce'],
    apply(scene) {
      scene.mainDamageBonus += 0.10;
      scene.mainPierceBonus = Math.min((scene.mainPierceBonus || 0) + 1, 3);
    },
    canPick(scene) {
      return (scene.mainPierceBonus || 0) < 3;
    },
  },
  {
    id: 'shotgun_close_burst',
    labelKey: 'cards.shotgun_close_burst.name',
    descKey: 'cards.shotgun_close_burst.desc',
    textVars: { bonusPercent: 35 },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'shotgun', 'burst'],
    requiresTags: ['shotgun'],
    apply(scene) {
      scene.mainShotgunCloseBonus = Math.min((scene.mainShotgunCloseBonus || 0) + 0.35, 1.05);
    },
    canPick(scene) {
      return (scene.mainShotgunCloseBonus || 0) < 1.05;
    },
  },
  {
    id: 'left_volatile_payload',
    labelKey: 'cards.left_volatile_payload.name',
    descKey: 'cards.left_volatile_payload.desc',
    textVars: { damagePercent: 10, speedPercent: 10 },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['left', 'explosion', 'burst'],
    requiresTags: ['explosion'],
    apply(scene) {
      scene.subDamageBonus += 0.10;
      scene.subCooldownBonus += 0.10;
      if (scene.skillCooldowns.left) {
        scene.skillCooldowns.left.max = TOWER_WEAPON_TYPES.left.bomb.cooldownSeconds / (1 + scene.subCooldownBonus);
      }
    },
    canPick() { return true; },
  },
  {
    id: 'right_hold_fast',
    labelKey: 'cards.right_hold_fast.name',
    descKey: 'cards.right_hold_fast.desc',
    textVars: { damagePercent: 10, guardPercent: 35 },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['right', 'defense'],
    requiresTags: ['right'],
    apply(scene) {
      scene.passiveDamageBonus += 0.10;
      scene.rightGuardZoneBonus = Math.min((scene.rightGuardZoneBonus || 0) + 0.35, 1.05);
    },
    canPick(scene) {
      return (scene.rightGuardZoneBonus || 0) < 1.05;
    },
  },
  {
    id: 'combo_momentum',
    labelKey: 'cards.combo_momentum.name',
    descKey: 'cards.combo_momentum.desc',
    textVars: { gaugePercent: 15, fireRatePercent: 5 },
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['combo', 'economy', 'main'],
    requiresTags: ['combo'],
    apply(scene) {
      scene.comboEconomyLevel = Math.min((scene.comboEconomyLevel || 0) + 1, 3);
      scene.mainFireRateBonus += 0.05;
    },
    canPick(scene) {
      return (scene.comboEconomyLevel || 0) < 3;
    },
  },

  // ================================================================
  // BEAM / PIERCE FORMS
  // ================================================================
  {
    id: 'beam_form_twin',
    labelKey: 'cards.beam_form_twin.name',
    descKey: 'cards.beam_form_twin.desc',
    cardImageKey: 'beam_form_twin',
    cardImagePath: 'assets/ui/cards/beam_form_twin.png',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'synergy',
    pickStage: 'starter',
    displayCategoryKey: 'firing_form',
    tags: ['main', 'pierce', 'beam', 'beam_form', 'twin_beam'],
    requiresTags: ['pierce'],
    excludesTags: ['satellite_beam', 'continuous_beam'],
    apply(scene) {
      scene.selectedBeamForm = 'twin';
      scene.twinBeamLevel = Math.max(scene.twinBeamLevel || 0, 1);
    },
    canPick() { return true; },
  },
  {
    id: 'beam_form_satellite',
    labelKey: 'cards.beam_form_satellite.name',
    descKey: 'cards.beam_form_satellite.desc',
    cardImageKey: 'beam_form_satellite',
    cardImagePath: 'assets/ui/cards/beam_form_satellite.png',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'synergy',
    pickStage: 'starter',
    displayCategoryKey: 'firing_form',
    tags: ['main', 'pierce', 'beam', 'beam_form', 'satellite_beam'],
    requiresTags: ['pierce'],
    excludesTags: ['twin_beam', 'continuous_beam'],
    apply(scene) {
      scene.selectedBeamForm = 'satellite';
      scene.satelliteBeamLevel = Math.max(scene.satelliteBeamLevel || 0, 1);
    },
    canPick() { return true; },
  },
  {
    id: 'beam_form_continuous',
    labelKey: 'cards.beam_form_continuous.name',
    descKey: 'cards.beam_form_continuous.desc',
    cardImageKey: 'beam_form_continuous',
    cardImagePath: 'assets/ui/cards/beam_form_continuous.png',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'synergy',
    pickStage: 'starter',
    displayCategoryKey: 'firing_form',
    tags: ['main', 'pierce', 'beam', 'beam_form', 'continuous_beam'],
    requiresTags: ['pierce'],
    excludesTags: ['twin_beam', 'satellite_beam'],
    apply(scene) {
      scene.selectedBeamForm = 'continuous';
      scene.continuousBeamLevel = Math.max(scene.continuousBeamLevel || 0, 1);
    },
    canPick() { return true; },
  },

  // ================================================================
  // BEAM / PIERCE FORM UPGRADES
  // ================================================================
  {
    id: 'beam_twin_equalized',
    labelKey: 'cards.beam_twin_equalized.name',
    descKey: 'cards.beam_twin_equalized.desc',
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'twin_beam'],
    requiresTags: ['twin_beam'],
    apply(scene) {
      scene.twinBeamEqualizedLevel = Math.min((scene.twinBeamEqualizedLevel || 0) + 1, 3);
    },
    canPick(scene) {
      return (scene.twinBeamEqualizedLevel || 0) < 3;
    },
  },
  {
    id: 'beam_twin_cross',
    labelKey: 'cards.beam_twin_cross.name',
    descKey: 'cards.beam_twin_cross.desc',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'twin_beam'],
    requiresTags: ['twin_beam'],
    apply(scene) {
      scene.twinBeamCrossEnabled = true;
    },
    canPick(scene) {
      return !scene.twinBeamCrossEnabled;
    },
  },
  {
    id: 'beam_satellite_smart_lock',
    labelKey: 'cards.beam_satellite_smart_lock.name',
    descKey: 'cards.beam_satellite_smart_lock.desc',
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'satellite_beam'],
    requiresTags: ['satellite_beam'],
    apply(scene) {
      scene.satelliteBeamLockLevel = Math.min((scene.satelliteBeamLockLevel || 0) + 1, 3);
    },
    canPick(scene) {
      return (scene.satelliteBeamLockLevel || 0) < 3;
    },
  },
  {
    id: 'beam_satellite_relay',
    labelKey: 'cards.beam_satellite_relay.name',
    descKey: 'cards.beam_satellite_relay.desc',
    type: 'special',
    rarity: 'rare',
    weight: CARD_RARITY_WEIGHTS.rare,
    maxLevel: 1,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'satellite_beam'],
    requiresTags: ['satellite_beam'],
    apply(scene) {
      scene.satelliteBeamRelayEnabled = true;
    },
    canPick(scene) {
      return !scene.satelliteBeamRelayEnabled;
    },
  },
  {
    id: 'beam_continuous_heat_focus',
    labelKey: 'cards.beam_continuous_heat_focus.name',
    descKey: 'cards.beam_continuous_heat_focus.desc',
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'continuous_beam'],
    requiresTags: ['continuous_beam'],
    apply(scene) {
      scene.continuousBeamHeatFocusLevel = Math.min((scene.continuousBeamHeatFocusLevel || 0) + 1, 3);
    },
    canPick(scene) {
      return (scene.continuousBeamHeatFocusLevel || 0) < 3;
    },
  },
  {
    id: 'beam_continuous_stable',
    labelKey: 'cards.beam_continuous_stable.name',
    descKey: 'cards.beam_continuous_stable.desc',
    type: 'special',
    rarity: 'uncommon',
    weight: CARD_RARITY_WEIGHTS.uncommon,
    maxLevel: 3,
    role: 'synergy',
    displayCategoryKey: 'form_upgrade',
    tags: ['main', 'pierce', 'beam', 'continuous_beam'],
    requiresTags: ['continuous_beam'],
    apply(scene) {
      scene.continuousBeamStableLevel = Math.min((scene.continuousBeamStableLevel || 0) + 1, 3);
    },
    canPick(scene) {
      return (scene.continuousBeamStableLevel || 0) < 3;
    },
  },

  // ================================================================
  // BEAM / PIERCE STATS AND ENERGY
  // ================================================================
  {
    id: 'beam_damage',
    labelKey: 'cards.beam_damage.name',
    descKey: 'cards.beam_damage.desc',
    textVars: { percent: CARD_BASIC_BONUS_CONFIG.mainDamageBonus * 100 },
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    maxLevel: 5,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['main', 'pierce', 'beam'],
    requiresTags: ['pierce'],
    apply(scene) {
      scene.mainDamageBonus += CARD_BASIC_BONUS_CONFIG.mainDamageBonus;
    },
    canPick() { return true; },
  },
  {
    id: 'beam_width',
    labelKey: 'cards.beam_width.name',
    descKey: 'cards.beam_width.desc',
    type: 'stat',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    maxLevel: 5,
    role: 'stat',
    displayCategoryKey: 'stat_upgrade',
    tags: ['main', 'pierce', 'beam'],
    requiresTags: ['pierce'],
    apply(scene) {
      scene.beamWidthLevel = Math.min((scene.beamWidthLevel || 0) + 1, 5);
    },
    canPick(scene) {
      return (scene.beamWidthLevel || 0) < 5;
    },
  },
  {
    id: 'beam_recharge',
    labelKey: 'cards.beam_recharge.name',
    descKey: 'cards.beam_recharge.desc',
    type: 'special',
    rarity: 'common',
    weight: CARD_RARITY_WEIGHTS.common,
    maxLevel: 5,
    role: 'utility',
    displayCategoryKey: 'ammo_energy',
    tags: ['main', 'pierce', 'beam', 'energy'],
    requiresTags: ['pierce'],
    apply(scene) {
      scene.beamRechargeLevel = Math.min((scene.beamRechargeLevel || 0) + 1, 5);
    },
    canPick(scene) {
      return (scene.beamRechargeLevel || 0) < 5;
    },
  },
];
