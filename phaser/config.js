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
const PLAYER_HP_START = 10;
const HEALTH_POT_CHANCE = 0.05;
const HEALTH_POT_DURATION = 4.0;
const HEALTH_POT_HEAL = 1;
const HEALTH_POT_RADIUS = 18;

const LEVEL_UP_INTERVAL_SEC = 20;
const LEVEL_SPEED_BONUS = 0.05;

// ============================================================
// RIGHT TOWER
// ============================================================
const RIGHT_TOWER_X = 0.85;
const RIGHT_TOWER_Y = 0.75;
const RIGHT_TOWER_RANGE = 90;
const RIGHT_TOWER_DPS = 0.6;
const RIGHT_TOWER_TICK_INTERVAL = 0.2;
const RIGHT_TOWER_MAX_TARGETS = 2;
const RIGHT_TOWER_ENABLED = true;

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
  sub: { ready: 0xffb14d, stroke: 0xff8800 },
};

const HUD_HIT_GAUGE_X = WIDTH - 28;
const HUD_HIT_GAUGE_Y = 90;
const HUD_HIT_GAUGE_WIDTH = 12;
const HUD_HIT_GAUGE_MAX_HEIGHT = 160;
const HUD_COMBO_X = WIDTH - 28;
const HUD_COMBO_Y = 64;

const HUD_HP_BAR_X = 16;
const HUD_HP_BAR_Y = HEIGHT - 44;
const HUD_HP_BAR_SEGMENT_W = 22;
const HUD_HP_BAR_SEGMENT_H = 14;
const HUD_HP_BAR_SEGMENT_GAP = 5;

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

// ============================================================
// DEBUG
// ============================================================
const DEBUG_PANEL_VISIBLE = true;

// ============================================================
// HIT GAUGE
// ============================================================
const HIT_GAUGE_HIT_VALUE = 0.5;
const HIT_GAUGE_MISS_PENALTY = 0.15;
const HIT_GAUGE_MIN = 0;

function hitGaugeThreshold(cardCount) {
  let total = 20;
  for (let i = 1; i <= cardCount; i++) {
    total += 10 + i * 2;
  }
  return total;
}

// ============================================================
// SKILL COOLDOWN STATE
// ============================================================
function createSkillCooldownState() {
  return {
    sub: { current: 0, max: SUB_WEAPON_CONFIG.cooldownSeconds },
  };
}
