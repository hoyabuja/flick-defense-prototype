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

// ============================================================
// MAIN WEAPON CONFIG (crystal drag continuous fire)
// ============================================================
const MAIN_WEAPON_CONFIG = {
  damage: 1,
  projectileSpeed: NORMAL_PROJECTILE_SPEED,
  fireRate: NORMAL_FIRE_RATE,
  projectileRadius: 6,
  hitRadius: 10,
  speedMultiplier: 1.0,
  hasArc: false,
  arcInitialVerticalMultiplier: 0,
  arcGravity: 0,
  arcMinUpwardSpeed: 0,
  shotCount: 1,
  spreadDeg: 0,
  landingExplosionRadius: 0,
};

// ============================================================
// SUB WEAPON CONFIG (left tower drag-release, arcing bomb)
// ============================================================
const SUB_WEAPON_CONFIG = {
  cooldownSeconds: 3.5,
  damage: 2,
  projectileRadius: 7,
  hitRadius: 8,
  explosionRadius: 85,
  speedMultiplier: 0.45,
  hasArc: true,
  arcInitialVerticalMultiplier: 0.2,
  arcGravity: 1000,
  arcMinUpwardSpeed: 220,
  shotCount: 1,
  spreadDeg: 0,
  landingExplosionRadius: 85,
};

// ============================================================
// PASSIVE WEAPON (right tower auto flame)
// Constants RIGHT_TOWER_X / Y / DPS / TICK_INTERVAL / MAX_TARGETS / ENABLED
// remain in config.js.
// ============================================================

// ============================================================
// PROJECTILE VISUAL CONFIG (keyed by slot: 'main' | 'sub')
// ============================================================
const PROJECTILE_VISUAL_CONFIG = {
  main: {
    assetKey: 'weapon_normal',
    assetPath: 'assets/ninja.png',
    displayWidth: 50,
    displayHeight: 35,
    rotationOffsetRadians: 60,
    alpha: 1,
    fallbackColor: CYAN,
    fallbackStroke: WHITE,
    fallbackShape: 'dart',
  },
  sub: {
    assetKey: 'weapon_bomb',
    assetPath: 'assets/weapon_bomb.png',
    displayWidth: 56,
    displayHeight: 56,
    rotationOffsetRadians: 0,
    alpha: 1,
    fallbackColor: 0xffb14d,
    fallbackStroke: WHITE,
    fallbackShape: 'orb',
  },
};
