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

const DEFENSE_LINE_Y = HEIGHT - 120;
const ENEMY_SPAWN_MS = 1500;
const ENEMY_SPAWN_MIN_MS = 650;
const ENEMY_SPAWN_STEP_MS = 110;
const ENEMY_RADIUS = 16;
const ENEMY_MIN_SPEED = 70;
const ENEMY_MAX_SPEED = 140;
const CURRENT_WEAPON_TYPE = 'normal'; // Change to 'twin' or 'bomb' manually.
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

const MIN_FLICK_DISTANCE = 20;
const MIN_GESTURE_DURATION = 0.03;
const SPEED_MULTIPLIER = 1.0;
const MIN_HORIZONTAL_SPEED = 250;
const MAX_HORIZONTAL_SPEED = 1100;
const HORIZONTAL_SPEED_MULTIPLIER = 0.9;
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
const HUD_LEVEL_TEXT_X = WIDTH / 2;
const HUD_LEVEL_TEXT_Y = 14;
const LANDED_PROJECTILE_CAN_HIT_ENEMIES = false;
const LANDED_PROJECTILE_FILL = 0xa8aeb5;
const LANDED_PROJECTILE_STROKE = 0xd4d8dd;
const HUD_AMMO_X = 16;
const HUD_AMMO_Y = 90;
const HUD_AMMO_BAR_WIDTH = 12;
const HUD_AMMO_SEGMENT_HEIGHT = 12;
const HUD_AMMO_SEGMENT_GAP = 4;
const HUD_AMMO_BAR_GAP = 16;
const HUD_AMMO_LABEL_COLOR = 0xf0f0f0;

const ENEMY_TYPES = {
  normal: {
    label: 'normal',
    hp: 1,
    speedMultiplier: 1.0,
    sizeMultiplier: 1.0,
    color: 0xdc4646,
    accent: 0xf0f0f0,
  },
  fast: {
    label: 'fast',
    hp: 1,
    speedMultiplier: 1.35,
    sizeMultiplier: 0.8,
    color: 0xff9f43,
    accent: 0xffe8b5,
  },
  tank: {
    label: 'tank',
    hp: 3,
    speedMultiplier: 0.78,
    sizeMultiplier: 1.35,
    color: 0x6ec3ff,
    accent: 0xf0f0f0,
  },
};

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
      maxAmmo: 3,
      ammoCostPerShot: 1,
      ammoRechargeSeconds: 1.2,
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

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Phaser.Math.Distance.Between(px, py, x1, y1);
  }
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Phaser.Math.Distance.Between(px, py, cx, cy);
}

  function rotateVector(x, y, degrees) {
    const radians = Phaser.Math.DegToRad(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    };
  }

  function createWeaponAmmoState() {
    const state = {};
    for (const [weaponType, weapon] of Object.entries(WEAPON_TYPES)) {
      state[weaponType] = {
        maxAmmo: weapon.maxAmmo,
        currentAmmo: weapon.maxAmmo,
        ammoRechargeSeconds: weapon.ammoRechargeSeconds,
        rechargeTimer: 0,
        ammoCostPerShot: weapon.ammoCostPerShot,
      };
    }
    return state;
  }

function spawnIntervalForLevel(level) {
  return Math.max(ENEMY_SPAWN_MIN_MS, ENEMY_SPAWN_MS - (level - 1) * ENEMY_SPAWN_STEP_MS);
}

function speedMultiplierForLevel(level) {
  return 1 + (level - 1) * LEVEL_SPEED_BONUS;
}

function enemyTypeForLevel(level) {
  if (level < FAST_ENEMY_START_LEVEL) {
    return 'normal';
  }

  const fastChance = Phaser.Math.Clamp(
    FAST_ENEMY_BASE_CHANCE + (level - FAST_ENEMY_START_LEVEL) * FAST_ENEMY_CHANCE_STEP,
    FAST_ENEMY_BASE_CHANCE,
    FAST_ENEMY_MAX_CHANCE,
  );

  const tankChance = level >= TANK_ENEMY_START_LEVEL
    ? Phaser.Math.Clamp(
      TANK_ENEMY_BASE_CHANCE + (level - TANK_ENEMY_START_LEVEL) * TANK_ENEMY_CHANCE_STEP,
      TANK_ENEMY_BASE_CHANCE,
      TANK_ENEMY_MAX_CHANCE,
    )
    : 0;

  const roll = Math.random();
  if (roll < tankChance) {
    return 'tank';
  }
  if (roll < tankChance + fastChance) {
    return 'fast';
  }
  return 'normal';
}

class Enemy {
  constructor(scene, typeName) {
    this.scene = scene;
    this.type = ENEMY_TYPES[typeName] || ENEMY_TYPES.normal;
    this.baseX = Phaser.Math.Between(24, WIDTH - 24);
    this.x = this.baseX;
    this.y = -20;
    this.speed = Phaser.Math.FloatBetween(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED) * this.type.speedMultiplier;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.driftSpeed = Phaser.Math.FloatBetween(1.2, 2.0);
    this.driftAmount = Phaser.Math.FloatBetween(10, 22);
    this.maxHp = this.type.hp;
    this.hp = this.maxHp;
  }

  progress() {
    return Phaser.Math.Clamp(this.y / DEFENSE_LINE_Y, 0, 1);
  }

  visualScale() {
    return (0.45 + this.progress() * 0.9) * this.type.sizeMultiplier;
  }

  displayedRadius() {
    return Math.max(8, Math.round(ENEMY_RADIUS * this.visualScale()));
  }

  update(dt) {
    const progress = this.progress();
    const speedScale = (0.55 + progress * 1.35) * this.scene.levelSpeedMultiplier;
    this.y += this.speed * speedScale * dt;

    const driftProgress = this.progress();
    const drift = Math.sin((this.y * 0.018) + this.phase + dt * this.driftSpeed * 2.0) *
      (this.driftAmount * (0.35 + driftProgress * 0.45));
    this.x = this.baseX + drift;

    const radius = this.displayedRadius();
    this.x = Phaser.Math.Clamp(this.x, radius, WIDTH - radius);
  }

  bottom() {
    return this.y + this.displayedRadius();
  }

  draw(gfx) {
    const radius = this.displayedRadius();
    const progress = this.progress();
    const bodyColor = this.type.color;
    const bodyHeight = Math.max(radius * 2, ENEMY_HEIGHT * this.type.sizeMultiplier);
    const bodyWidth = Math.max(radius * 1.4, radius * 2);
    const bodyTop = this.y - bodyHeight / 2;
    const bodyLeft = this.x - bodyWidth / 2;
    const sideRadius = bodyWidth / 2;
    const shadowScale = this.visualScale();
    const shadowWidth = ENEMY_SHADOW_BASE_W + shadowScale * 18;
    const shadowHeight = ENEMY_SHADOW_BASE_H + shadowScale * 6;
    const shadowAlpha = ENEMY_SHADOW_MIN_ALPHA + shadowScale * (ENEMY_SHADOW_MAX_ALPHA - ENEMY_SHADOW_MIN_ALPHA);
    const shadowAngle = Phaser.Math.DegToRad(ENEMY_SHADOW_ANGLE_DEG);
    const shadowOffsetX = Math.cos(shadowAngle) * ENEMY_SHADOW_OFFSET * shadowScale;
    const shadowOffsetY = Math.sin(shadowAngle) * ENEMY_SHADOW_OFFSET * shadowScale;

    gfx.fillStyle(SHADOW, shadowAlpha);
    gfx.fillEllipse(this.x + shadowOffsetX, bodyTop + bodyHeight * 0.46 + shadowOffsetY, shadowWidth, shadowHeight);
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRoundedRect(bodyLeft, bodyTop, bodyWidth, bodyHeight, sideRadius);
    gfx.lineStyle(2, this.type.accent, 1);
    gfx.strokeRoundedRect(bodyLeft, bodyTop, bodyWidth, bodyHeight, sideRadius);
  }
}

class Projectile {
  constructor(startX, startY, directionX, directionY, speed, weaponType) {
    this.weaponType = weaponType;
    this.weapon = WEAPON_TYPES[weaponType] || WEAPON_TYPES.normal;
    this.groundX = startX;
    this.groundY = startY;
    this.prevGroundX = startX;
    this.prevGroundY = startY;
    this.height = 0;
    this.landed = false;
    this.landedHitApplied = false;
    this.vx = directionX * speed * HORIZONTAL_SPEED_MULTIPLIER;
    this.vy = directionY * speed * HORIZONTAL_SPEED_MULTIPLIER;
    this.vz = this.weapon.hasArc ? Math.max(this.weapon.arcMinUpwardSpeed, speed * this.weapon.arcInitialVerticalMultiplier) : 0;
    this.radius = this.weapon.projectileRadius;
  }

  update(dt) {
    if (this.landed) {
      return true;
    }
    this.prevGroundX = this.groundX;
    this.prevGroundY = this.groundY;
    this.groundX += this.vx * dt;
    this.groundY += this.vy * dt;
    if (!this.weapon.hasArc) {
      return false;
    }
    this.height += this.vz * dt;
    this.vz -= this.weapon.arcGravity * dt;
    if (this.height <= 0) {
      this.height = 0;
      this.landed = true;
      this.vx = 0;
      this.vy = 0;
      this.vz = 0;
      return true;
    }
    return false;
  }

  visualPos() {
    return { x: this.groundX, y: this.groundY - this.height };
  }

  groundPos() {
    return { x: this.groundX, y: this.groundY };
  }

  offscreen() {
    return this.groundX < -50 || this.groundX > WIDTH + 50 || this.groundY < -50 || this.groundY > HEIGHT + 50;
  }

  draw(gfx) {
    const { x, y } = this.visualPos();
    const { x: gx, y: gy } = this.groundPos();
    const shadowScale = Math.max(0.25, 1 - this.height / 220);
    const shadowW = Math.max(8, Math.round(24 * shadowScale));
    const shadowH = Math.max(4, Math.round(8 * shadowScale));
    gfx.fillStyle(SHADOW, 0.7);
    gfx.fillEllipse(gx, gy, shadowW, shadowH);
    const fillColor = this.landed ? LANDED_PROJECTILE_FILL : CYAN;
    const strokeColor = this.landed ? LANDED_PROJECTILE_STROKE : WHITE;
    gfx.fillStyle(fillColor, 1);
    gfx.fillCircle(x, y, this.radius);
    gfx.lineStyle(2, strokeColor, 1);
    gfx.strokeCircle(x, y, this.radius);
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.enemies = [];
    this.projectiles = [];
    this.landingEffects = [];
    this.score = 0;
    this.hp = 5;
    this.gameOver = false;
    this.spawnTimer = 0;
    this.playTime = 0;
      this.currentLevel = 1;
      this.levelSpeedMultiplier = 1;
      this.weaponAmmo = createWeaponAmmoState();
      this.isAiming = false;
      this.aimStart = null;
      this.aimStartTime = 0;
      this.lastFiredWeaponType = 'none';
      this.lastSpawnedProjectileCount = 0;
  }

    create() {
      this.cameras.main.setBackgroundColor(BG);
      this.gfx = this.add.graphics();
      this.hudGfx = this.add.graphics();
      this.hudText = this.add.text(16, 14, 'Score: 0', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' });
      this.levelText = this.add.text(HUD_LEVEL_TEXT_X, HUD_LEVEL_TEXT_Y, 'Level: 1', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(0.5, 0);
      this.debugText = this.add.text(16, 48, '', { fontFamily: 'Arial', fontSize: '18px', color: '#f0f0f0' });
      this.debugText.setVisible(false);
      this.hpText = this.add.text(WIDTH - 16, 14, 'HP: 5', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(1, 0);
    this.gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2 - 20, 'GAME OVER', { fontFamily: 'Arial', fontSize: '72px', color: '#f0f0f0' }).setOrigin(0.5);
    this.finalScoreText = this.add.text(WIDTH / 2, HEIGHT / 2 + 34, '', { fontFamily: 'Arial', fontSize: '42px', color: '#f0f0f0' }).setOrigin(0.5);
    this.gameOverText.setVisible(false);
    this.finalScoreText.setVisible(false);

    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      this.isAiming = true;
      this.aimStart = { x: pointer.x, y: pointer.y };
      this.aimStartTime = this.time.now / 1000;
    });

    this.input.on('pointerup', (pointer) => {
      if (this.gameOver || !this.isAiming || !this.aimStart) return;
      this.isAiming = false;
      const aimEnd = { x: pointer.x, y: pointer.y };
      const dx = aimEnd.x - this.aimStart.x;
      const dy = aimEnd.y - this.aimStart.y;
      const dragDistance = Math.hypot(dx, dy);
      if (dragDistance >= MIN_FLICK_DISTANCE) {
        const length = Math.hypot(dx, dy);
        if (length > 0) {
          const directionX = dx / length;
          const directionY = dy / length;
          const releaseTime = this.time.now / 1000;
          const dragDuration = Math.max(releaseTime - this.aimStartTime, MIN_GESTURE_DURATION);
          const gestureSpeed = dragDistance / dragDuration;
          this.spawnWeaponProjectiles(aimEnd.x, aimEnd.y, directionX, directionY, gestureSpeed);
        }
      }
      this.aimStart = null;
    });
  }

    spawnWeaponProjectiles(startX, startY, directionX, directionY, gestureSpeed) {
      const weapon = WEAPON_TYPES[CURRENT_WEAPON_TYPE] || WEAPON_TYPES.normal;
      const baseSpeed = Phaser.Math.Clamp(
        gestureSpeed * SPEED_MULTIPLIER * weapon.speedMultiplier,
        MIN_HORIZONTAL_SPEED,
        MAX_HORIZONTAL_SPEED,
      );
      const ammo = this.weaponAmmo[CURRENT_WEAPON_TYPE];
      if (!ammo || ammo.currentAmmo < ammo.ammoCostPerShot) {
        this.lastFiredWeaponType = CURRENT_WEAPON_TYPE;
        this.lastSpawnedProjectileCount = 0;
        return;
      }
      ammo.currentAmmo -= ammo.ammoCostPerShot;
      ammo.rechargeTimer = 0;
      let spawnedCount = 0;

      if (CURRENT_WEAPON_TYPE === 'twin') {
        const left = rotateVector(directionX, directionY, -weapon.spreadDeg);
        const right = rotateVector(directionX, directionY, weapon.spreadDeg);
      this.projectiles.push(new Projectile(startX, startY, left.x, left.y, baseSpeed, CURRENT_WEAPON_TYPE));
      this.projectiles.push(new Projectile(startX, startY, right.x, right.y, baseSpeed, CURRENT_WEAPON_TYPE));
      spawnedCount = 2;
      this.lastFiredWeaponType = CURRENT_WEAPON_TYPE;
      this.lastSpawnedProjectileCount = spawnedCount;
      return;
    }

    this.projectiles.push(new Projectile(startX, startY, directionX, directionY, baseSpeed, CURRENT_WEAPON_TYPE));
      spawnedCount = 1;
      this.lastFiredWeaponType = CURRENT_WEAPON_TYPE;
      this.lastSpawnedProjectileCount = spawnedCount;
    }

    updateWeaponAmmo(dt) {
      for (const ammo of Object.values(this.weaponAmmo)) {
        if (ammo.currentAmmo >= ammo.maxAmmo) {
          ammo.rechargeTimer = 0;
          continue;
        }
        ammo.rechargeTimer += dt;
        while (ammo.currentAmmo < ammo.maxAmmo && ammo.rechargeTimer >= ammo.ammoRechargeSeconds) {
          ammo.rechargeTimer -= ammo.ammoRechargeSeconds;
          ammo.currentAmmo += 1;
        }
      }
    }

    drawAmmoHud() {
      const g = this.hudGfx;
      g.clear();

      const colors = {
        normal: { fill: 0x5bc0ff, outline: 0xd9f2ff },
        twin: { fill: 0x9ef06d, outline: 0xe2ffd3 },
        bomb: { fill: 0xffb14d, outline: 0xffe1b5 },
      };
      const weaponType = CURRENT_WEAPON_TYPE;
      const weapon = WEAPON_TYPES[weaponType];
      const ammo = this.weaponAmmo[weaponType];
      if (!weapon || !ammo) return;

      const x = HUD_AMMO_X;
      const baseY = HUD_AMMO_Y;
      g.lineStyle(1, HUD_AMMO_LABEL_COLOR, 0.8);

      for (let segment = 0; segment < weapon.maxAmmo; segment += 1) {
        const y = baseY + (weapon.maxAmmo - 1 - segment) * (HUD_AMMO_SEGMENT_HEIGHT + HUD_AMMO_SEGMENT_GAP);
        const filled = segment < ammo.currentAmmo;
        const fillColor = filled ? colors[weaponType].fill : 0x2a2f36;
        const alpha = filled ? 1 : 0.25;
        g.fillStyle(fillColor, alpha);
        g.fillRoundedRect(x, y, HUD_AMMO_BAR_WIDTH, HUD_AMMO_SEGMENT_HEIGHT, 3);
        g.strokeRoundedRect(x, y, HUD_AMMO_BAR_WIDTH, HUD_AMMO_SEGMENT_HEIGHT, 3);
      }
    }

  applyDamageToEnemy(enemyIndex, damage) {
    const enemy = this.enemies[enemyIndex];
    if (!enemy) {
      return false;
    }
    enemy.hp -= damage;
    if (enemy.hp <= 0) {
      this.enemies.splice(enemyIndex, 1);
      this.score += 1;
      return true;
    }
    return false;
  }

  applyBombDamage(cx, cy, radius, damage) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const hitRadius = radius + enemy.displayedRadius();
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, cx, cy) <= hitRadius) {
        enemy.hp -= damage;
        if (enemy.hp <= 0) {
          this.enemies.splice(i, 1);
          this.score += 1;
        }
      }
    }
  }

  drawTerrain() {
    const g = this.gfx;
    g.clear();
    g.fillStyle(BG, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(LOW_GROUND, 1);
    g.fillRect(0, 0, WIDTH, DEFENSE_LINE_Y - 28);
    g.fillStyle(PLATFORM_UNDER, 1);
    g.fillRect(0, DEFENSE_LINE_Y, WIDTH, 18);
    g.fillStyle(HIGH_GROUND, 1);
    g.fillRect(0, DEFENSE_LINE_Y + 18, WIDTH, HEIGHT - (DEFENSE_LINE_Y + 18));
    g.lineStyle(4, PLATFORM_EDGE, 1);
    g.lineBetween(0, DEFENSE_LINE_Y, WIDTH, DEFENSE_LINE_Y);
    g.lineStyle(2, PLATFORM_UNDER, 1);
    g.lineBetween(0, DEFENSE_LINE_Y + 4, WIDTH, DEFENSE_LINE_Y + 4);
    g.lineStyle(1, MID_GROUND, 1);
    for (let y = 50; y < DEFENSE_LINE_Y - 40; y += 70) {
      g.lineBetween(0, y, WIDTH, y);
    }
  }

  update(time, delta) {
    const dt = delta / 1000;

      if (!this.gameOver) {
        this.playTime += dt;
        this.currentLevel = 1 + Math.floor(this.playTime / LEVEL_UP_INTERVAL_SEC);
        this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
        this.updateWeaponAmmo(dt);

        this.spawnTimer += delta;
        const spawnInterval = spawnIntervalForLevel(this.currentLevel);
        while (this.spawnTimer >= spawnInterval) {
          this.spawnTimer -= spawnInterval;
        this.enemies.push(new Enemy(this, enemyTypeForLevel(this.currentLevel)));
      }

      for (const enemy of this.enemies) {
        enemy.update(dt);
      }

      for (const projectile of this.projectiles) {
        projectile.update(dt);
      }

      for (const effect of this.landingEffects) {
        effect.timer += dt;
      }

      const aliveEnemies = [];
      for (const enemy of this.enemies) {
        if (enemy.bottom() >= DEFENSE_LINE_Y) {
          this.hp -= 1;
          continue;
        }
        aliveEnemies.push(enemy);
      }
      this.enemies = aliveEnemies;

        const aliveProjectiles = [];
        for (const projectile of this.projectiles) {
          if (projectile.offscreen()) continue;

          if (projectile.landed && !LANDED_PROJECTILE_CAN_HIT_ENEMIES) {
            aliveProjectiles.push(projectile);
            continue;
          }

          if (projectile.weaponType === 'bomb' && projectile.height <= 0) {
            if (LANDED_PROJECTILE_CAN_HIT_ENEMIES && !projectile.landedHitApplied) {
              const { x: gx, y: gy } = projectile.groundPos();
              this.applyBombDamage(gx, gy, projectile.weapon.landingExplosionRadius, projectile.weapon.damage);
              this.landingEffects.push({ x: gx, y: gy, timer: 0, duration: 0.18 });
              projectile.landedHitApplied = true;
            }
            aliveProjectiles.push(projectile);
            continue;
          }

        if (projectile.weaponType === 'normal' || projectile.weaponType === 'twin') {
          const hitRadius = projectile.weapon.straightHitRadius;
          const x1 = projectile.prevGroundX;
          const y1 = projectile.prevGroundY;
          const x2 = projectile.groundX;
          const y2 = projectile.groundY;
          let hitIndex = -1;
          for (let i = 0; i < this.enemies.length; i += 1) {
            const enemy = this.enemies[i];
            if (distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2) <= hitRadius + enemy.displayedRadius()) {
              hitIndex = i;
              break;
            }
          }
          if (hitIndex !== -1) {
            this.applyDamageToEnemy(hitIndex, projectile.weapon.damage);
            continue;
          }
        }

        aliveProjectiles.push(projectile);
      }
      this.projectiles = aliveProjectiles;
      this.landingEffects = this.landingEffects.filter((effect) => effect.timer < effect.duration);

      if (this.hp <= 0) {
        this.hp = 0;
        this.gameOver = true;
        this.gameOverText.setVisible(true);
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.finalScoreText.setVisible(true);
      }
    }

      this.drawTerrain();

      for (const enemy of this.enemies) {
        enemy.draw(this.gfx);
    }

    for (const effect of this.landingEffects) {
      const progress = effect.timer / effect.duration;
      const radius = Math.round(10 + progress * 18);
      const alpha = 1 - progress;
      this.gfx.lineStyle(2, LANDING_RING, alpha);
      this.gfx.strokeCircle(effect.x, effect.y, radius);
    }

      for (const projectile of this.projectiles) {
        projectile.draw(this.gfx);
      }

      this.drawAmmoHud();
      this.hudText.setText(`Score: ${this.score}`);
      this.levelText.setText(`Level: ${this.currentLevel}`);
      this.hpText.setText(`HP: ${this.hp}`);
    }
  }

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#5d6b7c',
  scene: [MainScene],
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
};

new Phaser.Game(config);

