// ============================================================
// FLICK & PROJECTILE CONSTANTS
// ============================================================
const MIN_FLICK_DISTANCE = 20;
const MIN_GESTURE_DURATION = 0.03;
const NORMAL_PROJECTILE_SPEED = 800;
const NORMAL_FIRE_RATE = 0.4;
const SPEED_MULTIPLIER = 1.0;
const PERFECT_RELEASE_SPEED_MIN = 680;
const PERFECT_RELEASE_SPEED_MAX = 920;
const PERFECT_POPUP_DURATION = 0.45;
const MIN_HORIZONTAL_SPEED = 250;
const MAX_HORIZONTAL_SPEED = 1100;
const HORIZONTAL_SPEED_MULTIPLIER = 0.9;
const LANDED_PROJECTILE_CAN_HIT_ENEMIES = false;
const LANDED_PROJECTILE_FILL = 0xa8aeb5;
const LANDED_PROJECTILE_STROKE = 0xd4d8dd;
const LANDING_HIT_RADIUS = 40;

const PIERCE_BEAM_CONFIG = {
  enabled: true,
  fireIntervalSeconds: 0.55,
  angleOffsetDeg: 7,
  secondaryDamageMultiplier: 0.5,
  range: 1000,
  hitWidth: 14,
  damageMultiplier: 1.0,
  maxTargets: 2,
  durationMs: 70,
  fadeMs: 90,
  coreColor: 0xd9fbff,
  glowColor: 0x5ad2f0,
  coreAlpha: 0.95,
  glowAlpha: 0.42,
  coreWidth: 3,
  glowWidth: 12,
  muzzleOffsetX: 0,
  muzzleOffsetY: -18,
  impactFxEnabled: true,
  impactFxRadius: 12,
  impactFxDurationMs: 100,
  depth: 205,
  startPadding: 6,
  endPadding: 0,
  stopOnHit: true,
  hitStopPadding: 6,
  screenShake: 0,
  hitStunMultiplier: 1,
  damageFalloffPerTarget: 0.7,
  visualType: 'beam',
};

const SATELLITE_BEAM_CONFIG = {
  enabled: true,
  fireIntervalSeconds: 0.95,
  damageMultiplier: 0.35,
  maxTargets: 1,
  targetMode: 'closest_to_core',
  visualDurationMs: 65,
  fadeMs: 85,
  coreColor: 0xbfefff,
  glowColor: 0x7fd8ff,
  coreAlpha: 0.9,
  glowAlpha: 0.28,
  coreWidth: 2,
  glowWidth: 8,
  impactFxEnabled: true,
  impactFxRadius: 9,
  impactFxDurationMs: 90,
  originOffsetX: 18,
  originOffsetY: -28,
};

const CONTINUOUS_BEAM_CONFIG = {
  enabled: true,
  tickRateMultiplier: 10,
  damagePerTickMultiplier: 0.01,
  hitGaugeMultiplier: 0.10,
  fireWindowSeconds: 3,
  cooldownSeconds: 1,
  maxTargetsPerTick: 1,
  stopOnHit: true,
  hitStopPadding: 6,
  maxEnergy: 1.0,
  energyDrainPerSecond: 0.42,
  energyRegenPerSecond: 0.32,
  minEnergyToFire: 0.10,
  beamWidthMultiplier: 1.15,
  visualDurationMs: 50,
  fadeMs: 55,
};

// ============================================================
// TOWER WEAPON TYPES
// Three equal type-based slots: left | center | right
// Each type carries all config it needs as a flat object.
// ============================================================
const DEFAULT_TOWER_WEAPON_TYPES = {
  left:   'bomb',
  center: 'standard',
  right:  'auto_bolt',
};

const TOWER_WEAPON_TYPES = {
  left: {
    bomb: {
      label:                        'Bomb',
      mode:                         'arcing_projectile',
      visualKey:                    'bomb',
      cooldownSeconds:              3.5,
      damage:                       2,
      projectileRadius:             1,
      hitRadius:                    1,
      speedMultiplier:              0.45,
      hasArc:                       true,
      arcInitialVerticalMultiplier: 0.2,
      arcGravity:                   1000,
      arcMinUpwardSpeed:            220,
      shotCount:                    1,
      spreadDeg:                    0,
      landingEffectType:            'explosion',
      landingExplosionRadius:       50,
    },
  },

  center: {
    standard: {
      label:                        'Standard',
      mode:                         'projectile',
      visualKey:                    'standard_bolt',
      damage:                       1,
      projectileRadius:             6,
      hitRadius:                    10,
      speedMultiplier:              1.3,
      hasArc:                       false,
      arcInitialVerticalMultiplier: 0,
      arcGravity:                   0,
      arcMinUpwardSpeed:            0,
      shotCount:                    1,
      spreadDeg:                    0,
      landingExplosionRadius:       0,
      damageMultiplier:             1,
      hitRadiusMultiplier:          1,
      projectileRadiusMultiplier:   1,
      pierceCount:                  1,
      pierceDamageFalloff:          1,
    },
    wide: {
      label:                        'Wide',
      mode:                         'projectile',
      visualKey:                    'standard_bolt',
      damage:                       1,
      projectileRadius:             6,
      hitRadius:                    10,
      speedMultiplier:              0.95,
      hasArc:                       false,
      arcInitialVerticalMultiplier: 0,
      arcGravity:                   0,
      arcMinUpwardSpeed:            0,
      shotCount:                    1,
      spreadDeg:                    0,
      landingExplosionRadius:       0,
      damageMultiplier:             0.8,
      hitRadiusMultiplier:          2,
      projectileRadiusMultiplier:   1.5,
      pierceCount:                  1,
      pierceDamageFalloff:          1,
    },
    pierce: {
      label:                        'Pierce',
      mode:                         'beam',
      visualKey:                    'standard_bolt',
      damage:                       0.5,
      projectileRadius:             6,
      hitRadius:                    10,
      speedMultiplier:              1.05,
      hasArc:                       false,
      arcInitialVerticalMultiplier: 0,
      arcGravity:                   0,
      arcMinUpwardSpeed:            0,
      shotCount:                    1,
      spreadDeg:                    0,
      landingExplosionRadius:       0,
      damageMultiplier:             1,
      hitRadiusMultiplier:          0.75,
      projectileRadiusMultiplier:   0.9,
      pierceCount:                  2,
      pierceDamageFalloff:          0.7,
    },
  },

  right: {
    auto_bolt: {
      label:    'Auto Bolt',
      mode:     'auto_attack',
      visualKey: 'standard_bolt',
    },
  },
};

// ============================================================
// PROJECTILE VISUAL CONFIG (keyed by weapon visualKey)
// ============================================================
const PROJECTILE_VISUAL_CONFIG = {
  standard_bolt: {
    assetKey: 'weapon_normal',
    assetPath: 'assets/shots/shot1.png',
    displayWidth: 20,
    displayHeight: 20,
    rotationOffsetRadians: 20,
    alpha: 1,
    fallbackColor: CYAN,
    fallbackStroke: WHITE,
    fallbackShape: 'dart',
  },
  bomb: {
    assetKey: 'weapon_bomb',
    assetPath: 'assets/shots/bomb1.png',
    displayWidth: 56,
    displayHeight: 56,
    rotationOffsetRadians: 0,
    alpha: 1,
    fallbackColor: 0xffb14d,
    fallbackStroke: WHITE,
    fallbackShape: 'orb',
  },
};

const RIGHT_TOWER_PASSIVE_VISUAL_CONFIG = {
  enabled: true,
  assetKey: 'right_tower_passive_bolt',
  assetPath: 'assets/ninja.png',
  displayWidth: 18,
  displayHeight: 18,
  alpha: 0.95,
  rotationOffsetRadians: 20,
  fallbackLineEnabled: true,
};
