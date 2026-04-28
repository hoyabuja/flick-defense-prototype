// ============================================================
// DISPLAY & BATTLEFIELD
// ============================================================
const WIDTH = 390;
const HEIGHT = 844;
const FPS = 60;

const BG = 0x5d6b7c;
const WHITE = 0xf0f0f0;
const CYAN = 0x5ad2f0;
const SHADOW = 0x353c45;
const LANDING_RING = 0xffdc78;
const LOW_GROUND = 0x52606c;
const MID_GROUND = 0x727e88;
const HIGH_GROUND = 0x9ca8b0;
const PLATFORM_EDGE = 0xdce2e6;
const PLATFORM_UNDER = 0x2e363e;
const ENEMY_COLOR = 0xdc4646;

const DEFENSE_LINE_Y = HEIGHT - 140;
const FAR_BATTLEFIELD_Y = 70;
const FAR_BATTLEFIELD_WIDTH = 240;
const NEAR_BATTLEFIELD_WIDTH = 360;
const FAR_ENEMY_SCALE = 0.42;
const NEAR_ENEMY_SCALE = 1.05;

// ============================================================
// ENEMY SPAWN & LEVEL
// ============================================================
const ENEMY_SPAWN_MS = 1580;
const ENEMY_SPAWN_MIN_MS = 650;
const ENEMY_SPAWN_STEP_MS = 110;
const ENEMY_RADIUS = 16;
const ENEMY_MIN_SPEED = 70;
const ENEMY_MAX_SPEED = 140;

const LEVEL_UP_INTERVAL_SEC = 20;
const LEVEL_SPEED_BONUS = 0.05;

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
  tank:   { bodySize: 48, hitRadius: 21, scale: 1.24 },
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
    hp: 1,
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
// WEAPON TYPES
// ============================================================
const CURRENT_WEAPON_TYPE = 'normal'; // Change to 'twin' or 'bomb' manually.

const WEAPON_TYPES = {
  normal: {
    speedMultiplier: 1.0,
    projectileRadius: 6,
    straightHitRadius: 10,
    damage: 1,
    hasArc: true,
    arcInitialVerticalMultiplier: 0,
    arcGravity: 1000,
    arcMinUpwardSpeed: 220,
    shotCount: 1,
    spreadDeg: 0,
    landingExplosionRadius: 0,
    maxAmmo: 5,
    ammoCostPerShot: 1,
    ammoRechargeSeconds: 0.75,
  },
  twin: {
    speedMultiplier: 0.65,
    projectileRadius: 7,
    straightHitRadius: 10,
    damage: 1,
    hasArc: false,
    arcInitialVerticalMultiplier: 0,
    arcGravity: 0,
    arcMinUpwardSpeed: 0,
    shotCount: 2,
    spreadDeg: 10,
    landingExplosionRadius: 0,
    maxAmmo: 5,
    ammoCostPerShot: 1,
    ammoRechargeSeconds: 0.95,
  },
  bomb: {
    speedMultiplier: 0.45,
    projectileRadius: 7,
    straightHitRadius: 8,
    damage: 2,
    hasArc: true,
    arcInitialVerticalMultiplier: 0.2,
    arcGravity: 1000,
    arcMinUpwardSpeed: 220,
    shotCount: 1,
    spreadDeg: 0,
    landingExplosionRadius: 85,
    maxAmmo: 2,
    ammoCostPerShot: 1,
    ammoRechargeSeconds: 2.5,
  },
};

// ============================================================
// WEAPON VISUAL
// ============================================================
const WEAPON_VISUAL_CONFIG = {
  normal: {
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
  twin: {
    assetKey: 'weapon_twin',
    assetPath: 'assets/weapon_twin.png',
    displayWidth: 38,
    displayHeight: 18,
    rotationOffsetRadians: 0,
    alpha: 1,
    fallbackColor: 0x8fe8ff,
    fallbackStroke: WHITE,
    fallbackShape: 'dart',
  },
  bomb: {
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

// ============================================================
// FLICK & PROJECTILE
// ============================================================
const MIN_FLICK_DISTANCE = 20;
const MIN_GESTURE_DURATION = 0.03;
// 速度傷害乘數
const SPEED_DAMAGE_MIN_MULTIPLIER = 0.3;  // 最低速對應傷害乘數
const SPEED_DAMAGE_MAX_MULTIPLIER = 2.0;  // 最高速對應傷害乘數
const SPEED_MULTIPLIER = 1.0;
const PERFECT_RELEASE_SPEED_MIN = 680;
const PERFECT_RELEASE_SPEED_MAX = 920;
const PERFECT_DAMAGE_BONUS = 1;
const PERFECT_POPUP_DURATION = 0.45;
const MIN_HORIZONTAL_SPEED = 250;
const MAX_HORIZONTAL_SPEED = 1100;
const HORIZONTAL_SPEED_MULTIPLIER = 0.9;
const LANDED_PROJECTILE_CAN_HIT_ENEMIES = false;
const LANDED_PROJECTILE_FILL = 0xa8aeb5;
const LANDED_PROJECTILE_STROKE = 0xd4d8dd;

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
const LANDING_HIT_RADIUS = 40;

// ============================================================
// HUD
// ============================================================
const HUD_LEVEL_TEXT_X = WIDTH / 2;
const HUD_LEVEL_TEXT_Y = 14;
const HUD_AMMO_X = 16;
const HUD_AMMO_Y = 90;
const HUD_AMMO_BAR_WIDTH = 12;
const HUD_AMMO_SEGMENT_HEIGHT = 12;
const HUD_AMMO_SEGMENT_GAP = 4;
const HUD_AMMO_BAR_GAP = 16;
const HUD_AMMO_LABEL_COLOR = 0xf0f0f0;

// Hit Gauge（右側直立）
const HUD_HIT_GAUGE_X = WIDTH - 28;   // 右側，對稱彈藥條
const HUD_HIT_GAUGE_Y = 90;           // 同彈藥條頂部
const HUD_HIT_GAUGE_WIDTH = 12;
const HUD_HIT_GAUGE_MAX_HEIGHT = 160; // 最大條長

// 連擊提示
const HUD_COMBO_X = WIDTH - 28;
const HUD_COMBO_Y = 64;

// 晶核血條（左下角橫放）
const HUD_HP_BAR_X = 16;
const HUD_HP_BAR_Y = HEIGHT - 44;
const HUD_HP_BAR_SEGMENT_W = 22;
const HUD_HP_BAR_SEGMENT_H = 14;
const HUD_HP_BAR_SEGMENT_GAP = 5;

// ============================================================
// DANGER ZONE
// ============================================================
const DANGER_ZONE_HEIGHT = 180;
const DANGER_ZONE_TOP_Y = DEFENSE_LINE_Y - DANGER_ZONE_HEIGHT;
const DANGER_ZONE_FILL_COLOR = 0xff4444;
const DANGER_ZONE_FILL_ALPHA = 0.08;
const DANGER_ZONE_LINE_COLOR = 0xff6666;
const DANGER_ZONE_LINE_ALPHA = 0.6;
const DANGER_ZONE_LINE_WIDTH = 2;

// 怪物進禁區發光
const DANGER_GLOW_COLOR = 0xff4444;
const DANGER_GLOW_ALPHA = 0.7;
const DANGER_GLOW_RADIUS_EXTRA = 12;

// 斬殺
const SLASH_DAMAGE = 0.4;
const SLASH_COOLDOWN = 0.4;
const SLASH_MAX_TARGETS = 2;
const SLASH_MISS_STUN = 0.2;
const SLASH_HIT_RADIUS = 28;

// ============================================================
// LEVEL / WAVE SYSTEM
// ============================================================
const ENEMIES_PER_LEVEL_BASE = 12;
const ENEMIES_PER_LEVEL_STEP = 5;

// ============================================================
// CARD SYSTEM
// ============================================================
const CARD_EVERY_N_LEVELS = 2;
const CARD_HP_MAX_TIMES = 3;

const CARD_POOL = [
  {
    id: 'ammo_normal',
    label: '主武器彈藥 +1',
    desc: '主武器上限 +1',
    type: 'stat',
    apply(scene) {
      scene.weaponAmmo.normal.maxAmmo += 1;
      scene.weaponAmmo.normal.currentAmmo += 1;
    },
  },
  {
    id: 'ammo_twin',
    label: 'Twin 彈藥 +1',
    desc: 'Twin 上限 +1',
    type: 'stat',
    apply(scene) {
      scene.weaponAmmo.twin.maxAmmo += 1;
      scene.weaponAmmo.twin.currentAmmo += 1;
    },
    canPick(scene) { return scene.unlockedWeapons.twin === true; },
  },
  {
    id: 'ammo_bomb',
    label: 'Bomb 彈藥 +1',
    desc: 'Bomb 上限 +1',
    type: 'stat',
    apply(scene) {
      scene.weaponAmmo.bomb.maxAmmo += 1;
      scene.weaponAmmo.bomb.currentAmmo += 1;
    },
    canPick(scene) { return scene.unlockedWeapons.bomb === true; },
  },
  {
    id: 'recharge_normal',
    label: '主武器回復 +15%',
    desc: '主武器補彈加快',
    type: 'stat',
    apply(scene) {
      scene.weaponAmmo.normal.ammoRechargeSeconds *= 0.85;
    },
  },
  {
    id: 'recharge_twin',
    label: 'Twin 回復 +15%',
    desc: 'Twin 補彈加快',
    type: 'stat',
    apply(scene) {
      scene.weaponAmmo.twin.ammoRechargeSeconds *= 0.85;
    },
    canPick(scene) { return scene.unlockedWeapons.twin === true; },
  },
  {
    id: 'recharge_all',
    label: '全武器回復 +8%',
    desc: '所有武器補彈小幅加快',
    type: 'stat',
    apply(scene) {
      for (const ammo of Object.values(scene.weaponAmmo)) {
        ammo.ammoRechargeSeconds *= 0.92;
      }
    },
  },
  {
    id: 'hp_up',
    label: '晶核 HP +1',
    desc: '最多觸發 3 次',
    type: 'stat',
    apply(scene) {
      scene.hp += 1;
      scene.cardHpCount = (scene.cardHpCount || 0) + 1;
    },
    canPick(scene) {
      return (scene.cardHpCount || 0) < CARD_HP_MAX_TIMES;
    },
  },
  {
    id: 'bomb_radius',
    label: 'Bomb 範圍 +20%',
    desc: '爆炸半徑增加',
    type: 'stat',
    apply(scene) {
      scene.bombRadiusMultiplier = (scene.bombRadiusMultiplier || 1) * 1.2;
    },
    canPick(scene) { return scene.unlockedWeapons.bomb === true; },
  },
  {
    id: 'unlock_twin',
    label: '解鎖 Twin',
    desc: '獲得 Twin 武器（切換機制待開放）',
    type: 'unlock',
    weaponKey: 'twin',
    apply(scene) {
      scene.unlockedWeapons.twin = true;
    },
    canPick(scene) {
      return !scene.unlockedWeapons.twin;
    },
  },
  {
    id: 'unlock_bomb',
    label: '解鎖 Bomb',
    desc: '獲得 Bomb 武器（切換機制待開放）',
    type: 'unlock',
    weaponKey: 'bomb',
    apply(scene) {
      scene.unlockedWeapons.bomb = true;
    },
    canPick(scene) {
      return !scene.unlockedWeapons.bomb;
    },
  },
];

// ============================================================
// DEBUG
// ============================================================
const DEBUG_PANEL_VISIBLE = true; // 改成 false 可隱藏 debug 面板

// ============================================================
// HIT GAUGE (抽卡累積機制)
// ============================================================
const HIT_GAUGE_HIT_VALUE = 1;       // 命中 +1
const HIT_GAUGE_MISS_PENALTY = 0.3;  // miss -0.3
const HIT_GAUGE_MIN = 0;
// 第 n 次抽卡所需命中數：20, 32, 46, 62, 80...（每次+遞增2）
function hitGaugeThreshold(cardCount) {
  // cardCount = 目前已觸發幾次（0-based），算下一次門檻
  let total = 20;
  for (let i = 1; i <= cardCount; i++) {
    total += 10 + i * 2;
  }
  return total;
}
