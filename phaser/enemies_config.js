const ENEMY_SPAWN_MS = 1000;
const ENEMY_SPAWN_MIN_MS = 650;
const ENEMY_SPAWN_STEP_MS = 110;
const ENEMY_RADIUS = 16;
const ENEMY_MIN_SPEED = 70;
const ENEMY_MAX_SPEED = 140;

const FAST_ENEMY_START_LEVEL = 2;
const TANK_ENEMY_START_LEVEL = 3;
const FAST_ENEMY_BASE_CHANCE = 0.18;
const FAST_ENEMY_CHANCE_STEP = 0.04;
const FAST_ENEMY_MAX_CHANCE = 0.45;
const TANK_ENEMY_BASE_CHANCE = 0.08;
const TANK_ENEMY_CHANCE_STEP = 0.03;
const TANK_ENEMY_MAX_CHANCE = 0.30;
const ZIGZAG_ENEMY_START_LEVEL = 2;
const ZIGZAG_ENEMY_BASE_CHANCE = 0.04;
const ZIGZAG_ENEMY_CHANCE_STEP = 0.03;
const ZIGZAG_ENEMY_MAX_CHANCE = 0.22;

// ============================================================
// ENEMY SIZE
// ============================================================
const ENEMY_SIZE_CONFIG = {
  normal: { bodySize: 45, hitRadius: 16, scale: 1.00 },
  fast:   { bodySize: 32, hitRadius: 14, scale: 0.88 },
  tank:   { bodySize: 53, hitRadius: 21, scale: 1.24 },
  zigzag: { bodySize: 34, hitRadius: 17, scale: 1.03 },
};

// ============================================================
// ENEMY PATH
// ============================================================
const ENEMY_PATH_CONFIG = {
  straight: { swayMin: 3,  swayMax: 7,  freqMin: 0.013, freqMax: 0.020, driftMin: 0,  driftMax: 0,  wobbleMin: 0.12, wobbleMax: 0.28 },
  drift:    { swayMin: 6,  swayMax: 12, freqMin: 0.014, freqMax: 0.022, driftMin: 8,  driftMax: 18, wobbleMin: 0.18, wobbleMax: 0.36 },
  zigzag:   { swayMin: 14, swayMax: 24, freqMin: 0.018, freqMax: 0.032, driftMin: 10, driftMax: 22, wobbleMin: 0.28, wobbleMax: 0.54 },
};

// ============================================================
// ENEMY MOVEMENT CONFIG (hop-based)
// normal = basic slime movement
// ============================================================
const ENEMY_MOVEMENT_CONFIG = {
  normal: {
    movementType: 'hop',
    hopDistanceMin: 28,
    hopDistanceMax: 52,
    hopDurationMin: 0.42,
    hopDurationMax: 0.68,
    landingPauseMin: 0.08,
    landingPauseMax: 0.18,
    lateralDriftMin: -10,
    lateralDriftMax: 10,
    jumpArcHeight: 14,
    squashScaleX: 0,
    squashScaleY: 0,
    stretchScaleX: 0,
    stretchScaleY: 0,
    hitStunMs: 110,
    nearBaseMultiplier: 1.15,
  },
  fast: {
    movementType: 'hop',
    hopDistanceMin: 38,
    hopDistanceMax: 64,
    hopDurationMin: 0.28,
    hopDurationMax: 0.44,
    landingPauseMin: 0.04,
    landingPauseMax: 0.10,
    lateralDriftMin: -8,
    lateralDriftMax: 8,
    jumpArcHeight: 10,
    squashScaleX: 1.08,
    squashScaleY: 0.92,
    stretchScaleX: 0.94,
    stretchScaleY: 1.06,
    hitStunMs: 80,
    nearBaseMultiplier: 1.20,
  },
  tank: {
    movementType: 'hop',
    hopDistanceMin: 18,
    hopDistanceMax: 34,
    hopDurationMin: 0.60,
    hopDurationMax: 0.90,
    landingPauseMin: 0.14,
    landingPauseMax: 0.26,
    lateralDriftMin: -6,
    lateralDriftMax: 6,
    jumpArcHeight: 8,
    squashScaleX: 1.16,
    squashScaleY: 0.84,
    stretchScaleX: 0.90,
    stretchScaleY: 1.10,
    hitStunMs: 185,
    nearBaseMultiplier: 1.10,
  },
  zigzag: {
    movementType: 'hop',
    hopDistanceMin: 30,
    hopDistanceMax: 56,
    hopDurationMin: 0.38,
    hopDurationMax: 0.60,
    landingPauseMin: 0.06,
    landingPauseMax: 0.14,
    lateralDriftMin: -22,
    lateralDriftMax: 22,
    jumpArcHeight: 14,
    squashScaleX: 1.10,
    squashScaleY: 0.90,
    stretchScaleX: 0.93,
    stretchScaleY: 1.07,
    hitStunMs: 90,
    nearBaseMultiplier: 1.15,
  },
};

// ============================================================
// ENEMY TYPES
// ============================================================
const ENEMY_TYPES = {
  normal: {
    label: 'normal',
    hp: 2,
    speedMultiplier: 1.0,
    sizeMultiplier: ENEMY_SIZE_CONFIG.normal.scale,
    bodySize: ENEMY_SIZE_CONFIG.normal.bodySize,
    hitRadius: ENEMY_SIZE_CONFIG.normal.hitRadius,
    scoreValue: 1,
    color: 0xdc4646,
    accent: 0xf0f0f0,
    movement: ENEMY_MOVEMENT_CONFIG.normal,
  },
  fast: {
    label: 'fast',
    hp: 1,
    speedMultiplier: 1.35,
    sizeMultiplier: ENEMY_SIZE_CONFIG.fast.scale,
    bodySize: ENEMY_SIZE_CONFIG.fast.bodySize,
    hitRadius: ENEMY_SIZE_CONFIG.fast.hitRadius,
    scoreValue: 1,
    color: 0xff9f43,
    accent: 0xffe8b5,
    movement: ENEMY_MOVEMENT_CONFIG.fast,
  },
  tank: {
    label: 'tank',
    hp: 3,
    speedMultiplier: 0.78,
    sizeMultiplier: ENEMY_SIZE_CONFIG.tank.scale,
    bodySize: ENEMY_SIZE_CONFIG.tank.bodySize,
    hitRadius: ENEMY_SIZE_CONFIG.tank.hitRadius,
    scoreValue: 3,
    color: 0x6ec3ff,
    accent: 0xf0f0f0,
    movement: ENEMY_MOVEMENT_CONFIG.tank,
  },
  zigzag: {
    label: 'zigzag',
    hp: 2,
    speedMultiplier: 1.05,
    sizeMultiplier: ENEMY_SIZE_CONFIG.zigzag.scale,
    bodySize: ENEMY_SIZE_CONFIG.zigzag.bodySize,
    hitRadius: ENEMY_SIZE_CONFIG.zigzag.hitRadius,
    scoreValue: 2,
    color: 0xc86eff,
    accent: 0xffe8ff,
    movement: ENEMY_MOVEMENT_CONFIG.zigzag,
  },
};

// ============================================================
// ENEMY VISUAL / HIT
// ============================================================
const ENEMY_HIT_HEIGHT_MAX = 35;
const ENEMY_HEIGHT = 70;
const ENEMY_HEIGHT_TOP = 10;
const ENEMY_HEIGHT_BOTTOM = ENEMY_HEIGHT_TOP + ENEMY_HEIGHT;
const ENEMY_AIR_HIT_HEIGHT_MIN = ENEMY_HEIGHT_TOP;
const ENEMY_AIR_HIT_HEIGHT_MAX = ENEMY_HEIGHT_BOTTOM;
const ENEMY_SHADOW_BASE_W = 18;
const ENEMY_SHADOW_BASE_H = 7;
const ENEMY_SHADOW_MIN_ALPHA = 0.22;
const ENEMY_SHADOW_MAX_ALPHA = 0.42;
const ENEMY_SHADOW_ANGLE_DEG = 40;
const ENEMY_SHADOW_OFFSET = 10;
