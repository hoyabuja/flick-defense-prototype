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
// PLAYER
// ============================================================
const HEALTH_POT_RADIUS = 18;
const HEALTH_POT_CONFIG = {
  dropChance: 0.05,
  duration: 4.0,
  heal: 1,
};

const LEVEL_UP_INTERVAL_SEC = 20;
const LEVEL_SPEED_BONUS = 0.05;

// ============================================================
// RIGHT TOWER
// ============================================================
const RIGHT_TOWER_X = 0.85;
const RIGHT_TOWER_Y = 0.75;
const RIGHT_TOWER_RANGE = 90;
const RIGHT_TOWER_DPS = 1;
const RIGHT_TOWER_TICK_INTERVAL = 0.2;
const RIGHT_TOWER_MAX_TARGETS = 2;
const RIGHT_TOWER_ENABLED = true;
const RIGHT_ULT_CHARGE_MAX = 50;
const RIGHT_ULT_HOLD_REQUIRED_MS = 2000;
const RIGHT_ULT_FROZEN_MS = 3000;
const RIGHT_ULT_REPULSE_DISTANCE_RATIO = 0.18;
const DEFAULT_RIGHT_ULT_TYPE = 'repulse';
const RIGHT_TOWER_ULTIMATE_TYPES = {
  repulse: { label: 'Repulse' },
  freeze: { label: 'Freeze' },
};

// ============================================================
// HUD
// ============================================================
const HUD_LEVEL_TEXT_X = WIDTH / 2;
const HUD_LEVEL_TEXT_Y = 14;
const HUD_SKILL_BTN_X = 8;
const HUD_SKILL_BTN_Y = 80;
const HUD_SKILL_BTN_W = 68;
const HUD_SKILL_BTN_H = 52;
const HUD_SKILL_BTN_GAP = 10;
const HUD_SKILL_BTN_COLORS = {
  left: { ready: 0xffb14d, stroke: 0xff8800 },
};

const HUD_HIT_GAUGE_X = WIDTH - 28;
const HUD_HIT_GAUGE_Y = 90;
const HUD_HIT_GAUGE_WIDTH = 12;
const HUD_HIT_GAUGE_MAX_HEIGHT = 160;
const HUD_COMBO_X = WIDTH - 28;
const HUD_COMBO_Y = 64;

const HUD_HP_BAR_X = HUD_HIT_GAUGE_X - 24 - HUD_HIT_GAUGE_WIDTH;
const HUD_HP_BAR_Y = HUD_HIT_GAUGE_Y;
const HUD_HP_BAR_WIDTH = HUD_HIT_GAUGE_WIDTH;
const HUD_HP_BAR_MAX_HEIGHT = HUD_HIT_GAUGE_MAX_HEIGHT;
const HUD_RIGHT_ULT_TEXT_X = WIDTH - 72;
const HUD_RIGHT_ULT_TEXT_Y = 18;
const HUD_RIGHT_ULT_RING_RADIUS = 24;

// ============================================================
// SLASH
// ============================================================
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

// ============================================================
// VIRTUAL JOYSTICK
// ============================================================
const JOYSTICK_LEFT_X_MAX = 0.3;
const JOYSTICK_MAIN_X_MIN = 0.3;
const JOYSTICK_MAIN_X_MAX = 0.7;
const JOYSTICK_RIGHT_X_MIN = 0.7;
const JOYSTICK_ZONE_Y_MIN = 0.7;
const JOYSTICK_ZONE_Y_MAX = 1.0;
const JOYSTICK_CRYSTAL_RADIUS = 0.28;
const JOYSTICK_CRYSTAL_X = 0.5;
const JOYSTICK_CRYSTAL_Y = 0.75;
const JOYSTICK_AIM_RANGE_SCALE = 4.0;
const JOYSTICK_LEFT_LAUNCH_X = 0.15;
const JOYSTICK_LEFT_LAUNCH_Y = 0.75;
const JOYSTICK_MAIN_LAUNCH_X = 0.5;
const JOYSTICK_MAIN_LAUNCH_Y = 0.75;
const JOYSTICK_MAIN_AIM_EXTEND = 300;
const LEFT_TOWER_AUTO_FIRE_ENABLED = true;

// ============================================================
// DEBUG
// ============================================================
const DEBUG_PANEL_VISIBLE = false;

// ============================================================
// HIT GAUGE
// ============================================================
const HIT_GAUGE_HIT_VALUE = 0.5;
const HIT_GAUGE_MISS_PENALTY = 0.15;
const HIT_GAUGE_MIN = 0;

function hitGaugeThreshold(cardCount) {
  let total = 20;
  for (let i = 1; i <= cardCount; i++) {
    total += i * 6;
  }
  return total;
}

// ============================================================
// MODULES (assets/modules/*.png)
// All sprites placed via this list; scale/depth adjustable at runtime.
// visible:false = loaded but hidden by default.
// ============================================================
const MODULES_CONFIG = [
  { key: 'front_wall_intact', path: 'assets/modules/front_wall_intact.png', x: 195, y: 440, scale: 0.60, depth: 150, visible: false },
  { key: 'crystal_core', path: 'assets/modules/crystal_core.png', x: 195, y: 600, scale: 0.30, depth: 19, visible: false },
  { key: 'turretl', path: 'assets/modules/turretl.png', x: 338.5, y: 730, scale: 0.40, depth: 200, visible: false },
  { key: 'turretm', path: 'assets/modules/turretm.png', x: 195, y: 750, scale: 0.40, depth: 200, visible: false },
  { key: 'turretr', path: 'assets/modules/turretr.png', x: 51.5, y: 730, scale: 0.40, depth: 200, visible: false },
];

// ============================================================
// DEFENSE LAYOUT  (gameplay only — visuals live in MODULES_CONFIG)
// ============================================================
const DEFENSE_LAYOUT_CONFIG = {
  // Sprite keys — links to MODULES_CONFIG entries
  wallSpriteKey:    'front_wall_intact',
  crystalSpriteKey: 'crystal_core',

  // Front wall — gameplay
  wallFrontEdgeY:             400,
  wallLeftX:                  0,
  wallRightX:                 WIDTH,
  wallMaxHp:                  0,
  wallAttackIntervalFallback: 1.0,

  // Crystal core — gameplay
  crystalApproachStartY: 480,
  crystalTargetX: WIDTH / 2,
  crystalTargetY: 540,
  crystalAggroRadius: 100,  // legacy visual radius reused by the energy zone overlay
  crystalEllipseRadiusX: 100,
  crystalEllipseRadiusY: 68,
  targetZoneOrbitRadiusMinFactor: 0.42,
  targetZoneOrbitRadiusMaxFactor: 0.86,
  targetZoneOrbitSpeedMin: 0.55,
  targetZoneOrbitSpeedMax: 1.0,
  crystalMaxHp: 20,
  crystalHealPerLevelClear: 1,
};

// ============================================================
// ENERGY ZONE OVERLAY (visual only)
// Reuses crystal defense zone position and applies optional offsets.
// ============================================================
const ENERGY_ZONE_CONFIG = {
  enabled: true,
  offsetX: 0,
  offsetY: -12,
  radius: DEFENSE_LAYOUT_CONFIG.crystalAggroRadius,
  maxLinks: 4,
  idleAlpha: 0.22,
  activeAlpha: 0.38,
  lowHpThreshold: 0.35,
  pulseDurationMs: 1800,
  visualScaleX: 1.0,
  visualScaleY: 0.65,
  rotationDeg: 0,
  particleEnabled: true,
  particleCount: 18,
  particleSpeed: 0.00035,
  particleAlpha: 0.45,
  particleSize: 2,
  particleOrbitJitter: 8,
};

// ============================================================
// LOADOUT MENU
// ============================================================
const LOADOUT_MENU_ENABLED          = true;
const LOADOUT_MENU_TAB_RATIO_LEFT   = 0.30;
const LOADOUT_MENU_TAB_RATIO_CENTER = 0.40;
const LOADOUT_MENU_TAB_RATIO_RIGHT  = 0.30;
const LOADOUT_MENU_TAB_HEIGHT       = 250;
const LOADOUT_MENU_DEFAULT_TAB      = 'left';

// Backdrop behind everything (reduced so background peeks through glass panels).
const LOADOUT_MENU_BACKDROP_ALPHA           = 0.58;

// Selected tab — translucent glass fill, bright stroke, full-alpha text.
const LOADOUT_MENU_TAB_SELECTED_FILL_ALPHA  = 0.3;
const LOADOUT_MENU_TAB_SELECTED_STROKE_ALPHA = 0.90;
const LOADOUT_MENU_TAB_SELECTED_TEXT_ALPHA  = 1.0;

// Dim (unselected) tabs — barely visible tint.
const LOADOUT_MENU_TAB_DIM_FILL_ALPHA       = 0.8;
const LOADOUT_MENU_TAB_DIM_STROKE_ALPHA     = 0.28;
const LOADOUT_MENU_TAB_DIM_TEXT_ALPHA       = 0.44;

// Content page glass panel — fill alpha matches selected tab so they feel connected.
const LOADOUT_MENU_PAGE_FILL_ALPHA          = 0.48;   // must equal TAB_SELECTED_FILL_ALPHA
const LOADOUT_MENU_PAGE_STROKE_ALPHA        = 0.90;

// Colors (shared by tabs and page panel).
const LOADOUT_MENU_TAB_SELECTED_COLOR  = 0x1a2e44;
const LOADOUT_MENU_TAB_DIM_COLOR       = 0x0c1520;
const LOADOUT_MENU_TAB_STROKE_SELECTED = 0x5ad2f0;
const LOADOUT_MENU_TAB_STROKE_DIM      = 0x1e2c3a;

// ============================================================
// SKILL COOLDOWN STATE
// ============================================================
function createSkillCooldownState() {
  return {
    left: { current: 0, max: TOWER_WEAPON_TYPES.left.bomb.cooldownSeconds },
  };
}

function createRightTowerUltimateState() {
  return {
    rightUltType: DEFAULT_RIGHT_ULT_TYPE,
    rightUltCharge: 0,
    rightUltChargeMax: RIGHT_ULT_CHARGE_MAX,
    rightUltReady: false,
    rightUltHoldMs: 0,
    rightUltHoldRequiredMs: RIGHT_ULT_HOLD_REQUIRED_MS,
    rightUltFrozenMs: RIGHT_ULT_FROZEN_MS,
    rightUltRepulseDistanceRatio: RIGHT_ULT_REPULSE_DISTANCE_RATIO,
  };
}
