// All config loaded from config.js

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

  function battlefieldProgress(y) {
    return Phaser.Math.Clamp((y - FAR_BATTLEFIELD_Y) / (DEFENSE_LINE_Y - FAR_BATTLEFIELD_Y), 0, 1);
  }

  function battlefieldWidthAtY(y) {
    return Phaser.Math.Linear(FAR_BATTLEFIELD_WIDTH, NEAR_BATTLEFIELD_WIDTH, battlefieldProgress(y));
  }

  function battlefieldBoundsAtY(y) {
    const width = battlefieldWidthAtY(y);
    const halfWidth = width / 2;
    return {
      left: WIDTH / 2 - halfWidth,
      right: WIDTH / 2 + halfWidth,
      width,
    };
  }

  function battlefieldEdgePolygon(side) {
    const farBounds = battlefieldBoundsAtY(FAR_BATTLEFIELD_Y);
    const nearBounds = battlefieldBoundsAtY(DEFENSE_LINE_Y);
    const outerOffset = side === 'left' ? -18 : 18;
    return [
      new Phaser.Geom.Point(side === 'left' ? 0 : WIDTH, 0),
      new Phaser.Geom.Point(side === 'left' ? 0 : WIDTH, HEIGHT),
      new Phaser.Geom.Point(nearBounds[side] + outerOffset, DEFENSE_LINE_Y),
      new Phaser.Geom.Point(farBounds[side] + outerOffset, FAR_BATTLEFIELD_Y),
    ];
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
    const fastChance = level >= FAST_ENEMY_START_LEVEL
      ? Phaser.Math.Clamp(
        FAST_ENEMY_BASE_CHANCE + (level - FAST_ENEMY_START_LEVEL) * FAST_ENEMY_CHANCE_STEP,
        FAST_ENEMY_BASE_CHANCE,
        FAST_ENEMY_MAX_CHANCE,
      )
      : 0;

    const tankChance = level >= TANK_ENEMY_START_LEVEL
      ? Phaser.Math.Clamp(
        TANK_ENEMY_BASE_CHANCE + (level - TANK_ENEMY_START_LEVEL) * TANK_ENEMY_CHANCE_STEP,
        TANK_ENEMY_BASE_CHANCE,
        TANK_ENEMY_MAX_CHANCE,
      )
      : 0;

    const zigzagChance = level >= ZIGZAG_ENEMY_START_LEVEL
      ? Phaser.Math.Clamp(
        ZIGZAG_ENEMY_BASE_CHANCE + (level - ZIGZAG_ENEMY_START_LEVEL) * ZIGZAG_ENEMY_CHANCE_STEP,
        ZIGZAG_ENEMY_BASE_CHANCE,
        ZIGZAG_ENEMY_MAX_CHANCE,
      )
      : 0;

    const roll = Math.random();
    if (roll < zigzagChance) {
      return 'zigzag';
    }
    if (roll < zigzagChance + tankChance) {
      return 'tank';
    }
    if (roll < zigzagChance + tankChance + fastChance) {
      return 'fast';
    }
    return 'normal';
  }

  class Enemy {
    constructor(scene, typeName) {
      this.scene = scene;
      this.type = ENEMY_TYPES[typeName] || ENEMY_TYPES.normal;
      const spawnBounds = battlefieldBoundsAtY(FAR_BATTLEFIELD_Y);
      this.baseX = Phaser.Math.Between(
        Math.ceil(spawnBounds.left + 18),
        Math.floor(spawnBounds.right - 18),
      );
      this.x = this.baseX;
      this.y = -20;
      this.speed = Phaser.Math.FloatBetween(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED) * this.type.speedMultiplier;
      this.maxHp = this.type.hp;
      this.hp = this.maxHp;
      this.pathMode = this.type.label === 'zigzag'
        ? 'zigzag'
        : (Math.random() < 0.38 ? 'drift' : 'straight');
      if (this.type.label !== 'zigzag' && this.scene.currentLevel >= 4 && Math.random() < 0.14) {
        this.pathMode = 'zigzag';
      }
      this.pathPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.pathFrequency = Phaser.Math.FloatBetween(
        this.pathMode === 'zigzag' ? ENEMY_PATH_CONFIG.zigzag.freqMin : ENEMY_PATH_CONFIG[this.pathMode].freqMin,
        this.pathMode === 'zigzag' ? ENEMY_PATH_CONFIG.zigzag.freqMax : ENEMY_PATH_CONFIG[this.pathMode].freqMax,
      );
      const pathConfig = ENEMY_PATH_CONFIG[this.pathMode];
      this.pathAmplitude = Phaser.Math.FloatBetween(pathConfig.swayMin, pathConfig.swayMax);
      this.pathDriftAmount = Phaser.Math.FloatBetween(pathConfig.driftMin, pathConfig.driftMax);
      this.pathWobble = Phaser.Math.FloatBetween(pathConfig.wobbleMin, pathConfig.wobbleMax);
      this.pathDirection = Math.random() < 0.5 ? -1 : 1;

      // Hop movement state
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop') {
        this.hopState = 'CHARGING';
        this.hopTimer = 0;
        this.hopChargeDuration = 0.08;
        this.hopDistance = Phaser.Math.FloatBetween(mv.hopDistanceMin, mv.hopDistanceMax);
        this.hopDuration = Phaser.Math.FloatBetween(mv.hopDurationMin, mv.hopDurationMax);
        this.hopPause = Phaser.Math.FloatBetween(mv.landingPauseMin, mv.landingPauseMax);
        this.hopLateralDrift = Phaser.Math.FloatBetween(mv.lateralDriftMin, mv.lateralDriftMax);
        this.hopArcHeight = mv.jumpArcHeight;
        this.hopVisualOffsetY = 0;
        this.hopScaleX = 1;
        this.hopScaleY = 1;
        this.hitStunTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;
        this.slimeSprite = null;
      }
    }

  progress() {
    return Phaser.Math.Clamp(this.y / DEFENSE_LINE_Y, 0, 1);
    }

    visualScale() {
      const perspectiveScale = Phaser.Math.Linear(FAR_ENEMY_SCALE, NEAR_ENEMY_SCALE, this.progress());
      return perspectiveScale * this.type.sizeMultiplier;
    }

    displayedRadius() {
      return Math.max(10, Math.round(this.type.hitRadius * this.visualScale()));
    }

    update(dt) {
      if (this.isDead) {
        this.deathTimer += dt;
        return;
      }
      if (this.inZone) {
        this.updateInZone(dt);
        return;
      }
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop') {
        this.updateHop(dt);
      } else {
        this.updateGlide(dt);
      }
    }

    updateInZone(dt) {
      // Y 固定在防線，X 往中心靠
      const targetX = WIDTH / 2;
      const speed = 60 * dt;
      if (Math.abs(this.x - targetX) > speed) {
        this.x += this.x < targetX ? speed : -speed;
      } else {
        this.x = targetX;
      }
      this.y = DEFENSE_LINE_Y - this.displayedRadius();

      // 繼續播 hop 動畫（視覺用）
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop') {
        if (this.hitStunTimer > 0) {
          this.hitStunTimer -= dt;
          return;
        }
        this.hopTimer += dt;
        if (this.hopState === 'CHARGING') {
          this.hopScaleX = mv.squashScaleX;
          this.hopScaleY = mv.squashScaleY;
          this.hopVisualOffsetY = 0;
          if (this.hopTimer >= this.hopChargeDuration) {
            this.hopTimer = 0;
            this.hopDuration = Phaser.Math.FloatBetween(mv.hopDurationMin, mv.hopDurationMax);
            this.hopState = 'AIRBORNE';
          }
        } else if (this.hopState === 'AIRBORNE') {
          const t = Math.min(this.hopTimer / this.hopDuration, 1);
          this.hopVisualOffsetY = -mv.jumpArcHeight * Math.sin(Math.PI * t);
          this.hopScaleX = mv.stretchScaleX;
          this.hopScaleY = mv.stretchScaleY;
          if (t >= 1) { this.hopTimer = 0; this.hopVisualOffsetY = 0; this.hopState = 'LANDING'; }
        } else if (this.hopState === 'LANDING') {
          this.hopScaleX = mv.squashScaleX;
          this.hopScaleY = mv.squashScaleY;
          this.hopPause = Phaser.Math.FloatBetween(mv.landingPauseMin, mv.landingPauseMax);
          if (this.hopTimer >= this.hopPause) { this.hopTimer = 0; this.hopScaleX = 1; this.hopScaleY = 1; this.hopState = 'CHARGING'; }
        }
      }
    }

    updateGlide(dt) {
      const progress = this.progress();
      const speedScale = (0.55 + progress * 1.35) * this.scene.levelSpeedMultiplier;
      this.y += this.speed * speedScale * dt;

      const driftProgress = this.progress();
      const wave = Math.sin((this.y * this.pathFrequency) + this.pathPhase);
      let pathOffset = wave * this.pathAmplitude * (0.4 + driftProgress * 0.65);
      pathOffset += Math.sin((this.y * this.pathFrequency * 0.68) + this.pathPhase * 0.7) *
        this.pathWobble * (0.2 + driftProgress * 0.5);
      if (this.pathMode === 'drift') {
        pathOffset += this.pathDirection * this.pathDriftAmount * driftProgress;
      } else if (this.pathMode === 'zigzag') {
        const zigzagWave = Math.sin((this.y * this.pathFrequency * 1.55) + this.pathPhase * 1.35);
        pathOffset = zigzagWave * this.pathAmplitude * (0.75 + driftProgress * 0.45);
        pathOffset += this.pathDirection * this.pathDriftAmount * (0.12 + driftProgress * 0.35);
      }
      this.x = this.baseX + pathOffset;

      const radius = this.displayedRadius();
      const bounds = battlefieldBoundsAtY(this.y);
      this.x = Phaser.Math.Clamp(this.x, bounds.left + radius, bounds.right - radius);
    }

    updateHop(dt) {
      const mv = this.type.movement;

      // hit stun
      if (this.hitStunTimer > 0) {
        this.hitStunTimer -= dt;
        this.hopScaleX = mv.squashScaleX;
        this.hopScaleY = mv.squashScaleY;
        return;
      }

      this.hopTimer += dt;
      const progress = this.progress();
      const nearMultiplier = 1 + (mv.nearBaseMultiplier - 1) * progress;
      const speedScale = this.scene.levelSpeedMultiplier * nearMultiplier;

      if (this.hopState === 'CHARGING') {
        this.hopScaleX = mv.squashScaleX;
        this.hopScaleY = mv.squashScaleY;
        this.hopVisualOffsetY = 0;
        if (this.hopTimer >= this.hopChargeDuration) {
          this.hopTimer = 0;
          // 每跳重新抽距離和側飄
          this.hopDistance = Phaser.Math.FloatBetween(mv.hopDistanceMin, mv.hopDistanceMax) * speedScale;
          this.hopLateralDrift = Phaser.Math.FloatBetween(mv.lateralDriftMin, mv.lateralDriftMax);
          this.hopDuration = Phaser.Math.FloatBetween(mv.hopDurationMin, mv.hopDurationMax);
          this.hopStartY = this.y;
          this.hopStartX = this.x;
          this.hopState = 'AIRBORNE';
        }

      } else if (this.hopState === 'AIRBORNE') {
        const t = Math.min(this.hopTimer / this.hopDuration, 1);
        this.y = this.hopStartY + this.hopDistance * t;
        this.x = this.hopStartX + this.hopLateralDrift * t;
        // 拋物線弧高
        this.hopVisualOffsetY = -mv.jumpArcHeight * Math.sin(Math.PI * t);
        this.hopScaleX = mv.stretchScaleX;
        this.hopScaleY = mv.stretchScaleY;
        if (t >= 1) {
          this.hopTimer = 0;
          this.hopVisualOffsetY = 0;
          this.hopState = 'LANDING';
        }

      } else if (this.hopState === 'LANDING') {
        this.hopScaleX = mv.squashScaleX;
        this.hopScaleY = mv.squashScaleY;
        this.hopVisualOffsetY = 0;
        this.hopPause = Phaser.Math.FloatBetween(mv.landingPauseMin, mv.landingPauseMax);
        if (this.hopTimer >= this.hopPause) {
          this.hopTimer = 0;
          this.hopScaleX = 1;
          this.hopScaleY = 1;
          this.hopState = 'CHARGING';
        }
      }

      const radius = this.displayedRadius();
      const bounds = battlefieldBoundsAtY(this.y);
      this.x = Phaser.Math.Clamp(this.x, bounds.left + radius, bounds.right - radius);
    }

    applyHitStun() {
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop') {
        this.hitStunTimer = (mv.hitStunMs || 110) / 1000;
        this.hopState = 'CHARGING';
        this.hopTimer = 0;
      }
    }

  bottom() {
    return this.y + this.displayedRadius();
  }

    getSlimeSpriteKey() {
      if (this.isDead) return 'slime_death';
      if (this.hitStunTimer > 0) return 'slime_hit';
      if (this.hopState === 'AIRBORNE') return 'slime_hop';
      return 'slime_idle';
    }

    draw(gfx) {
      const radius = this.displayedRadius();
      const progress = this.progress();
      const bodyColor = this.type.color;
      const bodySize = Math.max(this.type.bodySize, radius * 2.0);
      const scaleX = this.hopScaleX || 1;
      const scaleY = this.hopScaleY || 1;
      const visualY = this.y + (this.hopVisualOffsetY || 0);
      const bodyWidth = bodySize * 1.04 * scaleX;
      const bodyHeight = bodySize * 0.94 * scaleY;
      const bodyTop = visualY - bodyHeight / 2;

      // slime sprite 顯示
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop' && this.scene.textures.exists('slime_idle')) {
        const spriteKey = this.getSlimeSpriteKey();
        if (!this.slimeSprite) {
          this.slimeSprite = this.scene.add.image(this.x, visualY, spriteKey).setDepth(10);
        }
        const displaySize = bodySize * 1.8 * this.visualScale();
        this.slimeSprite.setTexture(spriteKey);
        this.slimeSprite.setPosition(this.x, visualY);
        this.slimeSprite.setDisplaySize(displaySize * scaleX, displaySize * scaleY);
        this.slimeSprite.setDepth(10);
        // 影子
        const shadowScale = this.visualScale();
        const shadowWidth = ENEMY_SHADOW_BASE_W + shadowScale * 22;
        const shadowHeight = ENEMY_SHADOW_BASE_H + shadowScale * 10;
        const shadowAlpha = ENEMY_SHADOW_MIN_ALPHA + shadowScale * (ENEMY_SHADOW_MAX_ALPHA - ENEMY_SHADOW_MIN_ALPHA);
        gfx.fillStyle(SHADOW, shadowAlpha);
        gfx.fillEllipse(this.x, this.y + bodySize * 0.5, shadowWidth, shadowHeight);

        // 禁區發光
        if (this.y >= DANGER_ZONE_TOP_Y && !this.isDead) {
          const glowRadius = (displaySize / 2) + DANGER_GLOW_RADIUS_EXTRA;
          gfx.fillStyle(DANGER_GLOW_COLOR, DANGER_GLOW_ALPHA * 0.3);
          gfx.fillCircle(this.x, visualY, glowRadius + 6);
          gfx.lineStyle(2, DANGER_GLOW_COLOR, DANGER_GLOW_ALPHA);
          gfx.strokeCircle(this.x, visualY, glowRadius);
        }
        return;
      }
      const sideRadius = Math.max(5, bodyWidth * 0.16);
      const shadowScale = this.visualScale();
      const shadowWidth = ENEMY_SHADOW_BASE_W + shadowScale * 22;
      const shadowHeight = ENEMY_SHADOW_BASE_H + shadowScale * 10;
      const shadowAlpha = ENEMY_SHADOW_MIN_ALPHA + shadowScale * (ENEMY_SHADOW_MAX_ALPHA - ENEMY_SHADOW_MIN_ALPHA);
      const shadowAngle = Phaser.Math.DegToRad(ENEMY_SHADOW_ANGLE_DEG);
      const shadowOffsetX = Math.cos(shadowAngle) * ENEMY_SHADOW_OFFSET * shadowScale;
      const shadowOffsetY = Math.sin(shadowAngle) * ENEMY_SHADOW_OFFSET * shadowScale;
      const bounds = battlefieldBoundsAtY(this.y);
      const bodyCenterX = Phaser.Math.Clamp(this.x, bounds.left + radius, bounds.right - radius);
      const bodyLeft = bodyCenterX - bodyWidth / 2;
      const bodyRight = bodyCenterX + bodyWidth / 2;
      const headHeight = Math.max(10, bodyHeight * 0.22);
      const highlightHeight = Math.max(4, bodyHeight * 0.10);

      gfx.fillStyle(SHADOW, shadowAlpha);
      gfx.fillEllipse(bodyCenterX + shadowOffsetX, bodyTop + bodyHeight * 0.62 + shadowOffsetY, shadowWidth, shadowHeight);
      gfx.fillStyle(bodyColor, 1);
      gfx.fillRoundedRect(bodyLeft, bodyTop, bodyWidth, bodyHeight, sideRadius);
      gfx.fillStyle(0xffffff, 0.14);
      gfx.fillRoundedRect(bodyLeft + bodyWidth * 0.14, bodyTop + bodyHeight * 0.10, bodyWidth * 0.72, highlightHeight, highlightHeight / 2);
      gfx.fillStyle(0xffffff, 0.12);
      gfx.fillRoundedRect(bodyLeft + bodyWidth * 0.20, bodyTop + bodyHeight * 0.18, bodyWidth * 0.24, bodyHeight * 0.58, 4);
      gfx.fillStyle(0x000000, 0.10);
      gfx.fillRect(bodyLeft + bodyWidth * 0.10, bodyTop + bodyHeight * 0.72, bodyWidth * 0.80, bodyHeight * 0.12);
      gfx.lineStyle(2, this.type.accent, 1);
      gfx.strokeRoundedRect(bodyLeft, bodyTop, bodyWidth, bodyHeight, sideRadius);
      gfx.lineStyle(1, 0xffffff, 0.15);
      gfx.lineBetween(bodyLeft + bodyWidth * 0.2, bodyTop + bodyHeight * 0.22, bodyRight - bodyWidth * 0.2, bodyTop + bodyHeight * 0.18);
    }
  }

  class Projectile {
    constructor(scene, startX, startY, directionX, directionY, speed, weaponType) {
      this.scene = scene;
      this.weaponType = weaponType;
      this.weapon = WEAPON_TYPES[weaponType] || WEAPON_TYPES.normal;
      this.visual = WEAPON_VISUAL_CONFIG[weaponType] || WEAPON_VISUAL_CONFIG.normal;
      this.sprite = null;
      this.perfect = false;
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
      this.spawnSpriteIfAvailable();
    }

    spawnSpriteIfAvailable() {
      if (!this.scene || !this.scene.textures.exists(this.visual.assetKey)) {
        return;
      }
      this.sprite = this.scene.add.image(this.groundX, this.groundY, this.visual.assetKey)
        .setOrigin(0.5, 0.5)
        .setDepth(20);
      this.sprite.setDisplaySize(this.visual.displayWidth, this.visual.displayHeight);
      this.sprite.setAlpha(this.visual.alpha ?? 1);
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

    destroy() {
      if (this.sprite) {
        this.sprite.destroy();
        this.sprite = null;
      }
    }

    draw(gfx) {
      const { x, y } = this.visualPos();
      const { x: gx, y: gy } = this.groundPos();
      const shadowScale = Math.max(0.25, 1 - this.height / 220);
      const shadowW = Math.max(8, Math.round(24 * shadowScale));
      const shadowH = Math.max(4, Math.round(8 * shadowScale));
      gfx.fillStyle(SHADOW, 0.7);
      gfx.fillEllipse(gx, gy, shadowW, shadowH);
      if (this.sprite) {
        const angle = Math.atan2(this.vy || (y - this.prevGroundY), this.vx || (x - this.prevGroundX));
        // If the sprite points sideways or backward, adjust rotationOffsetRadians in WEAPON_VISUAL_CONFIG.
        const rotationOffset = this.visual.rotationOffsetRadians ?? 0;
        this.sprite.setPosition(x, y);
        this.sprite.setRotation(angle + rotationOffset);
        this.sprite.setVisible(true);
        this.sprite.setDisplaySize(this.visual.displayWidth, this.visual.displayHeight);
        this.sprite.setTint(this.perfect ? 0xfff2a8 : 0xffffff);
        this.sprite.setAlpha((this.visual.alpha ?? 1) * (this.landed ? 0.92 : 1));
        return;
      }
      if (this.weaponType === 'normal') {
        const angle = Math.atan2(this.vy || (y - this.prevGroundY), this.vx || (x - this.prevGroundX));
        const length = Math.max(12, this.radius * (this.perfect ? 3.7 : 3.2));
        const width = Math.max(5, Math.round(this.radius * (this.perfect ? 1.05 : 0.85)));
        const tipX = x + Math.cos(angle) * length * 0.5;
        const tipY = y + Math.sin(angle) * length * 0.5;
        const tailX = x - Math.cos(angle) * length * 0.5;
        const tailY = y - Math.sin(angle) * length * 0.5;
        const leftAngle = angle + Math.PI / 2;
        const rightAngle = angle - Math.PI / 2;
        const finX = tailX - Math.cos(angle) * 4;
        const finY = tailY - Math.sin(angle) * 4;
        gfx.lineStyle(width, this.perfect ? 0xffffff : (this.landed ? LANDED_PROJECTILE_STROKE : WHITE), 1);
        gfx.lineBetween(tailX, tailY, tipX, tipY);
        gfx.fillStyle(this.perfect ? 0xfff7b8 : (this.landed ? LANDED_PROJECTILE_FILL : CYAN), 1);
        gfx.fillTriangle(
          tipX, tipY,
          tailX + Math.cos(leftAngle) * width, tailY + Math.sin(leftAngle) * width,
          tailX + Math.cos(rightAngle) * width, tailY + Math.sin(rightAngle) * width,
        );
        gfx.fillStyle(this.perfect ? 0xffffff : 0xffffff, this.landed ? 0.18 : (this.perfect ? 0.4 : 0.28));
        gfx.fillCircle(tipX, tipY, Math.max(2, width * 0.34));
        gfx.lineStyle(2, this.perfect ? 0xfff7b8 : (this.landed ? LANDED_PROJECTILE_STROKE : WHITE), 0.9);
        gfx.lineBetween(finX, finY, tailX, tailY);
      } else {
          const fillColor = this.perfect ? 0xfff7b8 : (this.landed ? LANDED_PROJECTILE_FILL : this.visual.fallbackColor);
          const strokeColor = this.perfect ? 0xffffff : (this.landed ? LANDED_PROJECTILE_STROKE : this.visual.fallbackStroke);
          gfx.fillStyle(fillColor, 1);
          gfx.fillCircle(x, y, this.radius + (this.perfect ? 1 : 0));
          gfx.lineStyle(2, strokeColor, 1);
          gfx.strokeCircle(x, y, this.radius + (this.perfect ? 1 : 0));
      }
    }
  }

  class MainScene extends Phaser.Scene {
    constructor() {
      super('main');
      this.enemies = [];
      this.projectiles = [];
      this.landingEffects = [];
      this.perfectPopups = [];
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
        this.slashCooldown = 0;
        this.slashEffects = [];
    }
  
    preload() {
      this.load.image('background_arena', 'assets/background_arena.png');
      this.load.image('slime_idle', 'assets/slime1.png');
      this.load.image('slime_hop', 'assets/slime2.png');
      this.load.image('slime_hit', 'assets/slime3.png');
      this.load.image('slime_death', 'assets/slime4.png');
      for (const visual of Object.values(WEAPON_VISUAL_CONFIG)) {
        this.load.image(visual.assetKey, visual.assetPath);
      }
    }

      create() {
        this.cameras.main.setBackgroundColor(BG);
        this.backgroundImage = this.add.image(WIDTH / 2, HEIGHT / 2, 'background_arena')
          .setDisplaySize(WIDTH, HEIGHT)
          .setDepth(-1000);
        this.gfx = this.add.graphics();
        this.gfx.setDepth(0);
        this.hudGfx = this.add.graphics();
        this.hudGfx.setDepth(60);
      this.hudText = this.add.text(16, 14, 'Score: 0', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setDepth(70);
      this.levelText = this.add.text(HUD_LEVEL_TEXT_X, HUD_LEVEL_TEXT_Y, 'Level: 1', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(0.5, 0).setDepth(70);
      this.debugText = this.add.text(16, 48, '', { fontFamily: 'Arial', fontSize: '18px', color: '#f0f0f0' }).setDepth(70);
      this.debugText.setVisible(false);
      this.hpText = this.add.text(WIDTH - 16, 14, 'HP: 5', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(1, 0).setDepth(70);
      this.gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2 - 20, 'GAME OVER', { fontFamily: 'Arial', fontSize: '72px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
      this.finalScoreText = this.add.text(WIDTH / 2, HEIGHT / 2 + 34, '', { fontFamily: 'Arial', fontSize: '42px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
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

      // 起點在禁區內 → flick
      if (this.aimStart.y >= DANGER_ZONE_TOP_Y) {
        if (dragDistance >= MIN_FLICK_DISTANCE) {
          const length = Math.hypot(dx, dy);
          if (length > 0) {
            const directionX = dx / length;
            const directionY = dy / length;
            const releaseTime = this.time.now / 1000;
            const dragDuration = Math.max(releaseTime - this.aimStartTime, MIN_GESTURE_DURATION);
            const gestureSpeed = dragDistance / dragDuration;
            const isPerfectRelease = gestureSpeed >= PERFECT_RELEASE_SPEED_MIN && gestureSpeed <= PERFECT_RELEASE_SPEED_MAX;
            this.spawnWeaponProjectiles(aimEnd.x, aimEnd.y, directionX, directionY, gestureSpeed, isPerfectRelease);
          }
        }
        this.aimStart = null;
        return;
      }

      // 否則斬殺（起點在禁區外，終點必須在禁區內）
      if (dragDistance >= MIN_FLICK_DISTANCE && aimEnd.y >= DANGER_ZONE_TOP_Y) {
        this.applySlash(this.aimStart.x, this.aimStart.y, aimEnd.x, aimEnd.y);
      }
      this.aimStart = null;
    });
  }

    applySlash(x1, y1, x2, y2) {
      if (this.slashCooldown > 0) return;

      let hitCount = 0;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (hitCount >= SLASH_MAX_TARGETS) break;
        const enemy = this.enemies[i];
        if (enemy.isDead) continue;
        if (enemy.y < DANGER_ZONE_TOP_Y) continue;
        const dist = distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2);
        if (dist <= SLASH_HIT_RADIUS + enemy.displayedRadius()) {
          enemy.hp -= SLASH_DAMAGE;
          enemy.applyHitStun();
          hitCount++;
          if (enemy.hp <= 0) {
            enemy.isDead = true;
            enemy.deathTimer = 0;
            this.score += enemy.type.scoreValue || 1;
          }
        }
      }

      // 斬殺特效
      this.slashEffects.push({ x1, y1, x2, y2, timer: 0, duration: 0.18, hit: hitCount > 0 });
      this.slashCooldown = hitCount > 0 ? SLASH_COOLDOWN : SLASH_MISS_STUN;
    }

    spawnWeaponProjectiles(startX, startY, directionX, directionY, gestureSpeed, isPerfectRelease) {
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
        const leftProjectile = new Projectile(this, startX, startY, left.x, left.y, baseSpeed, CURRENT_WEAPON_TYPE);
        const rightProjectile = new Projectile(this, startX, startY, right.x, right.y, baseSpeed, CURRENT_WEAPON_TYPE);
        leftProjectile.perfect = isPerfectRelease;
        rightProjectile.perfect = isPerfectRelease;
        this.projectiles.push(leftProjectile);
        this.projectiles.push(rightProjectile);
      spawnedCount = 2;
      this.lastFiredWeaponType = CURRENT_WEAPON_TYPE;
      this.lastSpawnedProjectileCount = spawnedCount;
      return;
    }

      const projectile = new Projectile(this, startX, startY, directionX, directionY, baseSpeed, CURRENT_WEAPON_TYPE);
      projectile.perfect = isPerfectRelease;
      this.projectiles.push(projectile);
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

    applyDamageToEnemy(enemyIndex, damage, isPerfect = false) {
      const enemy = this.enemies[enemyIndex];
      if (!enemy) {
        return false;
      }
      enemy.hp -= damage;
      if (enemy.hp <= 0) {
        if (isPerfect) {
          this.spawnPerfectPopup(enemy.x, enemy.y);
        }
        enemy.isDead = true;
        enemy.deathTimer = 0;
        this.score += enemy.type.scoreValue || 1;
        return true;
      }
      enemy.applyHitStun();
      if (isPerfect) {
        this.spawnPerfectPopup(enemy.x, enemy.y);
      }
      return false;
    }

    applyBombDamage(cx, cy, radius, damage, isPerfect = false) {
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.enemies[i];
        const hitRadius = radius + enemy.displayedRadius();
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, cx, cy) <= hitRadius) {
          enemy.hp -= damage;
          if (isPerfect) {
            this.spawnPerfectPopup(enemy.x, enemy.y);
          }
          if (enemy.hp <= 0) {
            this.enemies.splice(i, 1);
            this.score += enemy.type.scoreValue || 1;
          }
        }
      }
    }

    spawnPerfectPopup(x, y) {
      const text = this.add.text(x, y - 24, 'PERFECT', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#fff3b0',
        stroke: '#ffffff',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
      this.perfectPopups.push({
        x,
        y: y - 24,
        timer: 0,
        duration: PERFECT_POPUP_DURATION,
        text,
      });
    }

    drawTerrain() {
      const g = this.gfx;
      g.clear();

      // 禁區背景
      g.fillStyle(DANGER_ZONE_FILL_COLOR, DANGER_ZONE_FILL_ALPHA);
      g.fillRect(0, DANGER_ZONE_TOP_Y, WIDTH, DANGER_ZONE_HEIGHT);

      // 禁區上邊界線
      g.lineStyle(DANGER_ZONE_LINE_WIDTH, DANGER_ZONE_LINE_COLOR, DANGER_ZONE_LINE_ALPHA);
      g.lineBetween(0, DANGER_ZONE_TOP_Y, WIDTH, DANGER_ZONE_TOP_Y);
    }

  update(time, delta) {
    const dt = delta / 1000;

      if (!this.gameOver) {
        this.playTime += dt;
        this.currentLevel = 1 + Math.floor(this.playTime / LEVEL_UP_INTERVAL_SEC);
        this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
        this.updateWeaponAmmo(dt);
        if (this.slashCooldown > 0) this.slashCooldown -= dt;
        for (const ef of this.slashEffects) { ef.timer += dt; }
        this.slashEffects = this.slashEffects.filter(ef => ef.timer < ef.duration);

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

      for (const popup of this.perfectPopups) {
        popup.timer += dt;
        const progress = popup.timer / popup.duration;
        popup.text.setAlpha(1 - progress);
        popup.text.setPosition(popup.x, popup.y - progress * 22);
      }

      const DEATH_DISPLAY_DURATION = 0.5;
      const aliveEnemies = [];
      for (const enemy of this.enemies) {
        if (enemy.isDead) {
          if (enemy.deathTimer >= DEATH_DISPLAY_DURATION) {
            if (enemy.slimeSprite) { enemy.slimeSprite.destroy(); enemy.slimeSprite = null; }
            continue;
          }
          aliveEnemies.push(enemy);
          continue;
        }
        if (!enemy.inZone && enemy.bottom() >= DEFENSE_LINE_Y) {
          this.hp -= 1;
          enemy.inZone = true;
          enemy.y = DEFENSE_LINE_Y - enemy.displayedRadius();
        }
        aliveEnemies.push(enemy);
      }
      this.enemies = aliveEnemies;

        const aliveProjectiles = [];
          for (const projectile of this.projectiles) {
            if (projectile.offscreen()) {
              projectile.destroy();
              continue;
            }

            if (projectile.landed && !LANDED_PROJECTILE_CAN_HIT_ENEMIES) {
              aliveProjectiles.push(projectile);
              continue;
            }

            if (projectile.weaponType === 'bomb' && projectile.height <= 0) {
              if (LANDED_PROJECTILE_CAN_HIT_ENEMIES && !projectile.landedHitApplied) {
                const { x: gx, y: gy } = projectile.groundPos();
                const bombDamage = projectile.weapon.damage + (projectile.perfect ? PERFECT_DAMAGE_BONUS : 0);
                this.applyBombDamage(gx, gy, projectile.weapon.landingExplosionRadius, bombDamage, projectile.perfect);
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
              const hitDamage = projectile.weapon.damage + (projectile.perfect ? PERFECT_DAMAGE_BONUS : 0);
              this.applyDamageToEnemy(hitIndex, hitDamage, projectile.perfect);
              projectile.destroy();
              continue;
            }
          }

        aliveProjectiles.push(projectile);
      }
      this.projectiles = aliveProjectiles;
      this.landingEffects = this.landingEffects.filter((effect) => effect.timer < effect.duration);
      const alivePopups = [];
      for (const popup of this.perfectPopups) {
        if (popup.timer < popup.duration) {
          alivePopups.push(popup);
        } else {
          popup.text.destroy();
        }
      }
      this.perfectPopups = alivePopups;

      if (this.hp <= 0) {
        this.hp = 0;
        this.gameOver = true;
        this.gameOverText.setVisible(true);
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.finalScoreText.setVisible(true);
      }
    }

      this.drawTerrain();

      // 斬殺特效
      for (const ef of this.slashEffects) {
        const progress = ef.timer / ef.duration;
        const alpha = 1 - progress;
        const color = ef.hit ? 0xffffff : 0xff4444;
        this.gfx.lineStyle(3 + (1 - progress) * 3, color, alpha);
        this.gfx.lineBetween(ef.x1, ef.y1, ef.x2, ef.y2);
      }

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
