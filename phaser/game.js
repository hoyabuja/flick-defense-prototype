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

  // @deprecated ??replaced by createSkillCooldownState()
  function createWeaponAmmoState() { return {}; }

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
      this.speed = Phaser.Math.FloatBetween(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED) * this.type.speedMultiplier * (this.scene.debugSpeedMultiplier || 1.0);
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
      // Move toward the center X inside the zone.
      const targetX = WIDTH / 2;
      const speed = 60 * dt;
      if (Math.abs(this.x - targetX) > speed) {
        this.x += this.x < targetX ? speed : -speed;
      } else {
        this.x = targetX;
      }
      this.y = DEFENSE_LINE_Y - this.displayedRadius();

      // Hop movement update.
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
          if (this.hopTimer >= this.hopPause) {
            this.hopTimer = 0;
            this.hopScaleX = 1;
            this.hopScaleY = 1;
            this.hopState = 'CHARGING';
            this.scene.playSfx('hop_land');
            // Apply one HP on landing hit.
            if (!this.scene.debugGodMode) this.scene.hp -= 1;
          }
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
          // Prepare the next hop arc.
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
        // Arc lift while airborne.
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
          this.scene.playSfx('hop_land');
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

    getSpritePrefix() {
      if (this.type.label === 'tank') return 'shroom';
      return 'slime';
    }

    getSlimeSpriteKey() {
      const prefix = this.getSpritePrefix();
      if (this.isDead) return prefix + '_death';
      if (this.hitStunTimer > 0) return prefix + '_hit';
      if (this.hopState === 'AIRBORNE') return prefix + '_hop';
      return prefix + '_idle';
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

      // Draw the slime sprite when available.
      const mv = this.type.movement;
      const spritePrefix = this.getSpritePrefix();
      if (mv && mv.movementType === 'hop' && this.scene.textures.exists(spritePrefix + '_idle')) {
        const spriteKey = this.getSlimeSpriteKey();
        if (!this.slimeSprite) {
          this.slimeSprite = this.scene.add.image(this.x, visualY, spriteKey).setDepth(10 + this.y * 0.01);
        }
        const displaySize = bodySize * 1.8 * this.visualScale();
        this.slimeSprite.setTexture(spriteKey);
        this.slimeSprite.setPosition(this.x, visualY);
        this.slimeSprite.setDisplaySize(displaySize * scaleX, displaySize * scaleY);
        this.slimeSprite.setDepth(10 + this.y * 0.01);
        // Shadow under the sprite.
        const shadowScale = this.visualScale();
        const shadowWidth = ENEMY_SHADOW_BASE_W + shadowScale * 22;
        const shadowHeight = ENEMY_SHADOW_BASE_H + shadowScale * 10;
        const shadowAlpha = ENEMY_SHADOW_MIN_ALPHA + shadowScale * (ENEMY_SHADOW_MAX_ALPHA - ENEMY_SHADOW_MIN_ALPHA);
        gfx.fillStyle(SHADOW, shadowAlpha);
        gfx.fillEllipse(this.x, this.y + bodySize * 0.3, shadowWidth, shadowHeight);

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
    constructor(scene, startX, startY, directionX, directionY, speed, slot) {
      this.scene = scene;
      this.weaponType = slot; // 'main' or 'sub'
      this.weapon = slot === 'sub' ? SUB_WEAPON_CONFIG : MAIN_WEAPON_CONFIG;
      this.visual = PROJECTILE_VISUAL_CONFIG[slot] || PROJECTILE_VISUAL_CONFIG.main;
      this.sprite = null;
      this.perfect = false;
      this.groundX = startX;
      this.groundY = startY;
      this.prevGroundX = startX;
      this.prevGroundY = startY;
    this.height = 0;
    this.landed = false;
    this.landedHitApplied = false;
    this.landedMissApplied = false;
    this.hasHit = false;
    this.forcedLandX = null;
    this.forcedLandY = null;
    this.isPowerShot = false;
    this.damageMultiplier = 1;
      const hMult = slot === 'main' ? 1 : HORIZONTAL_SPEED_MULTIPLIER;
      this.vx = directionX * speed * hMult;
      this.vy = directionY * speed * hMult;
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

      // Forced land follows a fixed arc height over time.
    if (this.forcedLandX != null && this.weapon.hasArc) {
      this.flightTimer = (this.flightTimer || 0) + dt;
      const totalTime = this.forcedFlightTime || 1.0;
      const t = Math.min(this.flightTimer / totalTime, 1);
      this.groundX = this.forcedStartX + (this.forcedLandX - this.forcedStartX) * t;
      this.groundY = this.forcedStartY + (this.forcedLandY - this.forcedStartY) * t;
      this.height = Math.sin(t * Math.PI) * (this.forcedArcHeight || 80);
      if (t >= 1) {
        this.height = 0;
        this.landed = true;
      }
      return this.landed;
    }

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
      return this.groundX < -50 || this.groundX > WIDTH + 50 || this.groundY < -50;
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
        const psScale = this.isPowerShot ? 1.4 : 1;
        this.sprite.setDisplaySize(this.visual.displayWidth * psScale, this.visual.displayHeight * psScale);
        this.sprite.setTint(this.isPowerShot ? 0xff9900 : (this.perfect ? 0xfff2a8 : 0xffffff));
        this.sprite.setAlpha((this.visual.alpha ?? 1) * (this.landed ? 0.92 : 1));
        return;
      }
      if (this.weaponType === 'main') {
        const powerScale = this.isPowerShot ? 1.45 : 1;
        const angle = Math.atan2(this.vy || (y - this.prevGroundY), this.vx || (x - this.prevGroundX));
        const length = Math.max(12, this.radius * 3.2 * powerScale);
        const width = Math.max(5, Math.round(this.radius * 0.85 * powerScale));
        const tipX = x + Math.cos(angle) * length * 0.5;
        const tipY = y + Math.sin(angle) * length * 0.5;
        const tailX = x - Math.cos(angle) * length * 0.5;
        const tailY = y - Math.sin(angle) * length * 0.5;
        const leftAngle = angle + Math.PI / 2;
        const rightAngle = angle - Math.PI / 2;
        const finX = tailX - Math.cos(angle) * 4;
        const finY = tailY - Math.sin(angle) * 4;
        const lineColor = this.isPowerShot ? 0xff9900 : (this.landed ? LANDED_PROJECTILE_STROKE : WHITE);
        const dartColor = this.isPowerShot ? 0xff6600 : (this.landed ? LANDED_PROJECTILE_FILL : CYAN);
        gfx.lineStyle(width, lineColor, 1);
        gfx.lineBetween(tailX, tailY, tipX, tipY);
        gfx.fillStyle(dartColor, 1);
        gfx.fillTriangle(
          tipX, tipY,
          tailX + Math.cos(leftAngle) * width, tailY + Math.sin(leftAngle) * width,
          tailX + Math.cos(rightAngle) * width, tailY + Math.sin(rightAngle) * width,
        );
        gfx.fillStyle(0xffffff, this.landed ? 0.18 : (this.isPowerShot ? 0.45 : 0.28));
        gfx.fillCircle(tipX, tipY, Math.max(2, width * 0.34));
        gfx.lineStyle(2, lineColor, 0.9);
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
      this.damagePopups = [];
      this.healthPots = [];
      this.score = 0;
    this.hp = PLAYER_HP_START;
    this.maxHp = PLAYER_HP_START;
    this.gameOver = false;
    this.spawnTimer = 0;
    this.playTime = 0;
      this.currentLevel = 1;
      this.levelSpeedMultiplier = 1;
      this.skillCooldowns = createSkillCooldownState();
      this.skillBtnObjects = {};
      this.joystickLeft  = null;
      this.joystickMain = null;
      this.pendingCrystalGesture = null;
      this.lightningCooldown = 0;
        this.lastFiredWeaponType = 'none';
        this.lastSpawnedProjectileCount = 0;
        this.slashCooldown = 0;
        this.slashEffects = [];
        this.passiveWeaponTickTimer = 0;
        this.passiveWeaponEffects = [];
        this.debugSpawnMultiplier = 1.0;
        this.debugSpeedMultiplier = 1.0;
        this.debugGodMode = false;
        this.debugAllowedTypes = null; // null = all types, array = allowed types
        // Wave / level system
        this.enemiesSpawnedThisLevel = 0;
        this.enemiesToSpawnThisLevel = ENEMIES_PER_LEVEL_BASE;
        this.isLevelClear = false;
        // Card system
        this.isCardPicking = false;
        this.cardHpCount = 0;
        this.unlockedWeapons = { sub: true };
        // Upgrade state — main weapon (additive, start at 0; applied as base × (1 + bonus))
        this.mainDamageBonus = 0.0;
        this.mainFireRateBonus = 0.0;
        this.mainKnockbackLevel = 0;   // behavior pending
        this.mainMultishotLevel = 0;   // behavior pending
        this.mainPowerShotLevel = 0;   // behavior pending
        this.mainShotCounter = 0;      // for power shot tracking
        // Upgrade state — sub weapon (additive, start at 0)
        this.subDamageBonus = 0.0;
        this.subCooldownBonus = 0.0;
        this.subRangeBonus = 0.0;
        this.subPullLevel = 0;         // behavior pending
        // Upgrade state — passive weapon (additive, start at 0)
        this.passiveDamageBonus = 0.0;
        this.passiveFireRateBonus = 0.0;
        this.passiveMultitargetBonus = 0.0; // unused legacy field, kept for reset safety
        this.passiveMultitargetLevel = 0;
        this.cardUiElements = [];
        // Bomb explosions
        this.bombExplosionEffects = [];
        // Hit gauge
        this.hitGauge = 0;
        this.hitGaugeCardCount = 0; // Hit gauge card count.
        // Combo
        this.comboCount = 0;
        this.audioUnlocked = false;
        this.bgmStarted = false;
        this.gameStarted = false;
        this.startOverlayElements = [];
    }
  
    preload() {
      this.load.image('background_arena', 'assets/background_arena.png');
      this.load.image('slime_idle', 'assets/slime1.png');
      this.load.image('slime_hop', 'assets/slime2.png');
      this.load.image('slime_hit', 'assets/slime3.png');
      this.load.image('slime_death', 'assets/slime4.png');
      this.load.image('shroom_idle', 'assets/shroom1.png');
      this.load.image('shroom_hop', 'assets/shroom2.png');
      this.load.image('shroom_hit', 'assets/shroom3.png');
      this.load.image('shroom_death', 'assets/shroom4.png');
      for (const visual of Object.values(PROJECTILE_VISUAL_CONFIG)) {
        this.load.image(visual.assetKey, visual.assetPath);
      }
      // Audio assets.
      const soundFiles = {
        bgm:         'assets/sound/bgm.mp3',
        shoot:       'assets/sound/shoot.mp3',
        shoot_bomb:  'assets/sound/shoot_bomb.mp3',
        hit:         'assets/sound/hit.mp3',
        hop_land:    'assets/sound/hop_land.mp3',
        enemy_death: 'assets/sound/enemy_death.mp3',
        explosion:   'assets/sound/explosion.mp3',
      };
      this._soundKeysToLoad = new Set(Object.keys(soundFiles));
      this.load.on('loaderror', (file) => {
        this._soundKeysToLoad.delete(file.key);
      });
      for (const [key, path] of Object.entries(soundFiles)) {
        this.load.audio(key, path);
      }
    }

      create() {
        this.cameras.main.setBackgroundColor(BG);
        this.backgroundImage = this.add.image(WIDTH / 2, HEIGHT / 2, 'background_arena')
          .setDisplaySize(WIDTH, HEIGHT)
          .setDepth(-1000);
        this.gfx = this.add.graphics();
        this.gfx.setDepth(0);
        // Audio settings.
        const sfxConfig = {
          bgm:         { loop: true,  volume: 0.4 },
          shoot:       { loop: false, volume: 0.6 },
          shoot_bomb:  { loop: false, volume: 0.7 },
          hit:         { loop: false, volume: 0.7 },
          hop_land:    { loop: false, volume: 0.35 },
          enemy_death: { loop: false, volume: 0.6 },
          explosion:   { loop: false, volume: 0.8 },
        };
        this.sfx = {};
        for (const [key, cfg] of Object.entries(sfxConfig)) {
          if (this._soundKeysToLoad && this._soundKeysToLoad.has(key)) {
            try { this.sfx[key] = this.sound.add(key, cfg); } catch(e) {}
          }
        }
        this.hudGfx = this.add.graphics();
        this.hudGfx.setDepth(60);
        this.healthPotGfx = this.add.graphics().setDepth(30);
      this.hudText = this.add.text(16, 14, 'Score: 0', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setDepth(70);
      this.levelText = this.add.text(HUD_LEVEL_TEXT_X, HUD_LEVEL_TEXT_Y, 'Level: 1', { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(0.5, 0).setDepth(70);
      this.debugText = this.add.text(16, 48, '', { fontFamily: 'Arial', fontSize: '18px', color: '#f0f0f0' }).setDepth(70);
      this.debugText.setVisible(false);
      this.gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2 - 20, 'GAME OVER', { fontFamily: 'Arial', fontSize: '72px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
      this.finalScoreText = this.add.text(WIDTH / 2, HEIGHT / 2 + 34, '', { fontFamily: 'Arial', fontSize: '42px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
    this.gameOverText.setVisible(false);
    this.finalScoreText.setVisible(false);

    // Skill buttons and cooldown UI.
    this.aimGfx = this.add.graphics().setDepth(65);
    this.lightningGfx = this.add.graphics().setDepth(85);

    const skillWeapons = ['sub'];
    let skillBtnY = HUD_SKILL_BTN_Y;
    for (const wtype of skillWeapons) {
      const bx = HUD_SKILL_BTN_X;
      const by = skillBtnY;
      const bw = HUD_SKILL_BTN_W;
      const bh = HUD_SKILL_BTN_H;

      const bg = this.add.rectangle(bx + bw / 2, by + bh / 2, bw, bh, 0x1a2a3a, 1)
        .setDepth(70).setStrokeStyle(2, 0x444444).setInteractive({ useHandCursor: true });

      const nameText = this.add.text(bx + bw / 2, by + 14, wtype.toUpperCase(), {
        fontFamily: 'Arial', fontSize: '14px', color: '#888888', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(71);

      const cdText = this.add.text(bx + bw / 2, by + 34, 'LOCK', {
        fontFamily: 'Arial', fontSize: '11px', color: '#666666',
      }).setOrigin(0.5).setDepth(71);

      const cdBarBg = this.add.rectangle(bx + 4, by + bh - 7, bw - 8, 4, 0x222222, 1)
        .setDepth(71).setOrigin(0, 0);
      const cdBar = this.add.rectangle(bx + 4, by + bh - 7, bw - 8, 4, 0x5bc0ff, 1)
        .setDepth(72).setOrigin(0, 0);

      bg.on('pointerup', () => { this.onSkillBtnClick(wtype); });

      this.skillBtnObjects[wtype] = { bg, nameText, cdText, cdBar, cdBarBg };
      skillBtnY += HUD_SKILL_BTN_H + HUD_SKILL_BTN_GAP;
    }

    // Hit gauge UI.
    this.hitGaugeGfx = this.add.graphics().setDepth(70);
    this.hitGaugeLabel = this.add.text(HUD_HIT_GAUGE_X + 6, HUD_HIT_GAUGE_Y + HUD_HIT_GAUGE_MAX_HEIGHT + 6, '', {
      fontFamily: 'Arial', fontSize: '11px', color: '#aaddff',
    }).setOrigin(0.5, 0).setDepth(70);

    // Combo text hidden until active.
    this.comboText = this.add.text(HUD_COMBO_X + 6, HUD_COMBO_Y, '', {
      fontFamily: 'Arial', fontSize: '22px', color: '#ffe066',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(70).setVisible(false);

    // HP bar label.
    this.hpBarGfx = this.add.graphics().setDepth(70);
    this.hpBarLabel = this.add.text(HUD_HP_BAR_X, HUD_HP_BAR_Y - 18, 'Core', {
      fontFamily: 'Arial', fontSize: '13px', color: '#ff8888',
    }).setDepth(70);

    // Level clear UI
    this.levelClearOverlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55).setDepth(90).setVisible(false);
    this.levelClearText = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, 'CLEAR', {
      fontFamily: 'Arial', fontSize: '96px', color: '#ffe066', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(91).setVisible(false);
    this.levelClearBtn = this.add.text(WIDTH / 2, HEIGHT / 2 + 60, 'Continue', {
      fontFamily: 'Arial', fontSize: '48px', color: '#f0f0f0',
      backgroundColor: '#2e6adf', padding: { x: 36, y: 16 },
    }).setOrigin(0.5).setDepth(91).setVisible(false).setInteractive({ useHandCursor: true });
    this.levelClearBtn.on('pointerup', () => {
      this.levelClearOverlay.setVisible(false);
      this.levelClearText.setVisible(false);
      this.levelClearBtn.setVisible(false);
      this.startNextLevel();
    });

    const startOverlayBg = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.72)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });
    const startOverlayTitle = this.add.text(WIDTH / 2, HEIGHT / 2 - 18, 'Tap to Start', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#f0f0f0',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(201);
    const startOverlaySubtitle = this.add.text(WIDTH / 2, HEIGHT / 2 + 26, 'Audio unlock / start game', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#d8dde3',
    }).setOrigin(0.5).setDepth(201);
    this.startOverlayElements = [startOverlayBg, startOverlayTitle, startOverlaySubtitle];
    startOverlayBg.on('pointerup', () => {
      if (this.gameStarted) return;
      this.unlockAudioOnce();
      if (!this.bgmStarted) {
        this.bgmStarted = true;
        try {
          if (this.sfx && this.sfx.bgm && !this.sfx.bgm.isPlaying) {
            this.sfx.bgm.play();
          }
        } catch (e) {}
      }
      for (const element of this.startOverlayElements) {
        if (element && typeof element.destroy === 'function') {
          element.destroy();
        }
      }
      this.startOverlayElements = [];
      this.gameStarted = true;
    });

    this.input.on('pointerdown', (pointer) => {
      if (!this.gameStarted) return;

      // Tap unlocks audio before the first pointerdown is handled.

      if (this.gameOver || this.isLevelClear || this.isCardPicking) return;

      // Health potion pickup.
      for (let i = this.healthPots.length - 1; i >= 0; i--) {
        const pot = this.healthPots[i];
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, pot.x, pot.y) <= HEALTH_POT_RADIUS * 1.5) {
          const maxHp = this.maxHp || PLAYER_HP_START;
          if (this.hp < maxHp) this.hp = Math.min(this.hp + HEALTH_POT_HEAL, maxHp);
          pot.label.destroy();
          this.healthPots.splice(i, 1);
          return;
        }
      }

      const jsCfg = window.DEBUG_JOYSTICK || {};
      const crystalX     = (jsCfg.crystalX  ?? JOYSTICK_CRYSTAL_X)   * WIDTH;
      const crystalY     = (jsCfg.crystalY  ?? JOYSTICK_CRYSTAL_Y)   * HEIGHT;
      const crystalRadius = JOYSTICK_CRYSTAL_RADIUS * WIDTH;
      const leftXMax     = (jsCfg.leftXMax  ?? JOYSTICK_LEFT_X_MAX)  * WIDTH;
      const mainXMin     = (jsCfg.mainXMin ?? jsCfg.rightXMin ?? JOYSTICK_MAIN_X_MIN) * WIDTH;
      const zoneYMin     = (jsCfg.zoneYMin  ?? JOYSTICK_ZONE_Y_MIN)  * HEIGHT;
      const zoneYMax     = (jsCfg.zoneYMax  ?? JOYSTICK_ZONE_Y_MAX)  * HEIGHT;

      // 1. Crystal tap.
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, crystalX, crystalY) <= crystalRadius) {
        this.pendingCrystalGesture = {
          pointerId: pointer.id,
          startX: pointer.x,
          startY: pointer.y,
          currentX: pointer.x,
          currentY: pointer.y,
        };
        return;
      }

      // 2. Main weapon drag gesture.
      if (pointer.x >= mainXMin && pointer.y >= zoneYMin && pointer.y <= zoneYMax) {
        this.joystickMain = {
          startX: pointer.x, startY: pointer.y,
          currentPointerX: pointer.x, currentPointerY: pointer.y,
          fireTimer: NORMAL_FIRE_RATE, // Keep the fire cadence.
        };
        return;
      }

      // 3. Left tower auto-attack.
      if (pointer.x < leftXMax && pointer.y >= zoneYMin && pointer.y <= zoneYMax) {
        this.joystickLeft = { startX: pointer.x, startY: pointer.y, startTime: this.time.now / 1000 };
        return;
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.gameStarted) return;
      if (this.gameOver || this.isLevelClear || this.isCardPicking) return;

      if (this.pendingCrystalGesture && this.pendingCrystalGesture.pointerId === pointer.id) {
        const gesture = this.pendingCrystalGesture;
        this.pendingCrystalGesture = null;
        const dragDist = Math.hypot(pointer.x - gesture.startX, pointer.y - gesture.startY);
        if (dragDist < MIN_FLICK_DISTANCE) {
          const crystal = this.getCrystalDefenseZone();
          if (this.lightningCooldown <= 0) {
            const hasEnemy = this.enemies.some(
              e => !e.isDead && Phaser.Math.Distance.Between(e.x, e.y, crystal.x, crystal.y) <= crystal.radius
            );
            if (hasEnemy) this.applyLightning(pointer.x, pointer.y);
          }
        }
        this.aimGfx.clear();
        return;
      }

      // Crystal tap vs drag gesture resolution.
      if (this.joystickMain) {
        this.joystickMain = null;
        this.aimGfx.clear();
        return;
      }

      // Left zone drag aim.
      if (this.joystickLeft) {
        const js = this.joystickLeft;
        this.joystickLeft = null;
        this.aimGfx.clear();
        const dragDist = Math.hypot(pointer.x - js.startX, pointer.y - js.startY);
        if (dragDist >= MIN_FLICK_DISTANCE && js.targetX != null) {
          const targetX = js.targetX;
          const targetY = js.targetY;
          const launchX = (window.DEBUG_JOYSTICK?.leftTowerX ?? JOYSTICK_LEFT_LAUNCH_X) * WIDTH;
          const launchY = (window.DEBUG_JOYSTICK?.leftTowerY ?? JOYSTICK_LEFT_LAUNCH_Y) * HEIGHT;
          const dx = targetX - launchX;
          const dy = targetY - launchY;
          const dist = Math.hypot(dx, dy);
          const dirX = dx / dist;
          const dirY = dy / dist;
          const vz0 = SUB_WEAPON_CONFIG.arcMinUpwardSpeed;
          const flightTime = (2 * vz0) / SUB_WEAPON_CONFIG.arcGravity;
          const gestureSpeed = Phaser.Math.Clamp(
            dist / (flightTime * HORIZONTAL_SPEED_MULTIPLIER),
            MIN_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED
          );
          const isPerfect = gestureSpeed >= PERFECT_RELEASE_SPEED_MIN && gestureSpeed <= PERFECT_RELEASE_SPEED_MAX;
          this.spawnWeaponProjectiles(launchX, launchY, dirX, dirY, gestureSpeed, isPerfect, 'sub');
          // Sub weapon: apply forced landing arc before hit processing.
          const lastProj = this.projectiles[this.projectiles.length - 1];
          if (lastProj && lastProj.weaponType === 'sub') {
            lastProj.forcedLandX = targetX;
            lastProj.forcedLandY = targetY;
            lastProj.forcedStartX = launchX;
            lastProj.forcedStartY = launchY;
            const dist = Math.hypot(targetX - launchX, targetY - launchY);
            lastProj.forcedFlightTime = Phaser.Math.Clamp(dist / 400, 0.4, 1.8);
            lastProj.forcedArcHeight = Math.min(dist * 0.3, 150);
            lastProj.flightTimer = 0;
          }
        }
        return;
      }
    });

      // Pointer move updates active gestures.
    this.input.on('pointermove', (pointer) => {
      if (!this.gameStarted) return;
      if (this.pendingCrystalGesture && this.pendingCrystalGesture.pointerId === pointer.id) {
        this.pendingCrystalGesture.currentX = pointer.x;
        this.pendingCrystalGesture.currentY = pointer.y;
        const dragDist = Math.hypot(
          pointer.x - this.pendingCrystalGesture.startX,
          pointer.y - this.pendingCrystalGesture.startY,
        );
        if (dragDist >= MIN_FLICK_DISTANCE) {
          this.joystickMain = {
            startX: this.pendingCrystalGesture.startX,
            startY: this.pendingCrystalGesture.startY,
            currentPointerX: pointer.x,
            currentPointerY: pointer.y,
            fireTimer: NORMAL_FIRE_RATE,
          };
          this.pendingCrystalGesture = null;
          this.drawMainAim(this.joystickMain, pointer);
          return;
        }
      }
      if (this.joystickMain) {
        this.joystickMain.currentPointerX = pointer.x;
        this.joystickMain.currentPointerY = pointer.y;
        this.drawMainAim(this.joystickMain, pointer);
      } else if (this.joystickLeft) {
        this.drawLeftAim(this.joystickLeft, pointer);
      } else {
        if (this.aimGfx) this.aimGfx.clear();
      }
    });
  }

    showCardPicker() {
      this.isCardPicking = true;
      this.cardPickerReady = false;
      this.time.delayedCall(500, () => { this.cardPickerReady = true; });

      // Build three upgrade choices via weighted sampling without replacement.
      const available = CARD_POOL.filter(card =>
        !card.canPick || card.canPick(this)
      );
      const pool = available.map(card => ({ card, weight: card.weight ?? CARD_RARITY_WEIGHTS.common }));
      const choices = [];
      while (choices.length < 3 && pool.length > 0) {
        const total = pool.reduce((s, e) => s + e.weight, 0);
        let r = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
          r -= pool[i].weight;
          if (r <= 0) { choices.push(pool[i].card); pool.splice(i, 1); break; }
        }
      }

      const els = [];

      // Card picker overlay.
      const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.72).setDepth(200).setInteractive();
      els.push(overlay);

      // Card picker area = top third of the screen.
      const areaTop = 0;
      const areaBottom = HEIGHT / 3;
      const areaMidY = (areaTop + areaBottom) / 2;

      // Title.
      const title = this.add.text(WIDTH / 2, areaTop + 28, 'Choose Upgrade', {
        fontFamily: 'Arial', fontSize: '26px', color: '#ffe066',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(201);
      els.push(title);

      // Card layout.
      const cardW = 100;
      const cardH = 160;
      const totalCards = choices.length;
      const totalWidth = totalCards * cardW + (totalCards - 1) * 20;
      const startX = WIDTH / 2 - totalWidth / 2 + cardW / 2;
      const cardY = areaMidY + 18; // Center cards vertically.
      choices.forEach((card, i) => {
        const cx = startX + i * (cardW + 20);
        const rarity = card.rarity || 'common';
        const colors = CARD_RARITY_COLORS[rarity] || CARD_RARITY_COLORS.common;

        const bg = this.add.rectangle(cx, cardY, cardW, cardH, colors.bg, 1)
          .setDepth(201).setStrokeStyle(2, colors.stroke).setInteractive({ useHandCursor: true });

        const labelText = this.add.text(cx, cardY - cardH / 2 + 26, card.label, {
          fontFamily: 'Arial', fontStyle: 'bold', fontSize: '15px', color: colors.title,
          wordWrap: { width: cardW - 12 }, align: 'center',
        }).setOrigin(0.5).setDepth(202);

        const descText = this.add.text(cx, cardY - cardH / 2 + 58, card.desc, {
          fontFamily: 'Arial', fontSize: '12px', color: '#aac8e0',
          wordWrap: { width: cardW - 12 }, align: 'center',
        }).setOrigin(0.5, 0).setDepth(202);

        const rarityText = this.add.text(cx, cardY + cardH / 2 - 14, rarity.toUpperCase(), {
          fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: colors.title,
          alpha: 0.75,
        }).setOrigin(0.5).setDepth(202);

        bg.on('pointerover', () => bg.setFillStyle(colors.bgHover));
        bg.on('pointerout', () => bg.setFillStyle(colors.bg));
        bg.on('pointerup', () => {
          if (!this.cardPickerReady) return;
          card.apply(this);
          this.dismissCardPicker();
        });

        els.push(bg, labelText, descText, rarityText);
      });

      this.cardUiElements = els;
    }

    dismissCardPicker() {
      for (const el of this.cardUiElements) { el.destroy(); }
      this.cardUiElements = [];
      this.isCardPicking = false;
    }

    // Debug card helper.
    applyCardById(cardId) {
      const card = CARD_POOL.find(c => c.id === cardId);
      if (!card) return;
      if (card.canPick && !card.canPick(this)) return;
      card.apply(this);
    }

    // Debug level advance helper.
    debugLevelAdvance() {
      this.isLevelClear = false;
      this.isCardPicking = false;
      for (const el of this.cardUiElements) { el.destroy(); }
      this.cardUiElements = [];
      this.levelClearOverlay.setVisible(false);
      this.levelClearText.setVisible(false);
      this.levelClearBtn.setVisible(false);
      for (const enemy of this.enemies) {
        if (enemy.slimeSprite) { enemy.slimeSprite.destroy(); enemy.slimeSprite = null; }
      }
      this.enemies = [];
      this.currentLevel += 1;
      this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
      this.enemiesToSpawnThisLevel = ENEMIES_PER_LEVEL_BASE + (this.currentLevel - 1) * ENEMIES_PER_LEVEL_STEP;
      this.enemiesSpawnedThisLevel = 0;
      this.spawnTimer = 0;
    }

    // Debug level retreat helper.
    debugLevelRetreat() {
      if (this.currentLevel <= 1) return;
      this.isLevelClear = false;
      this.isCardPicking = false;
      for (const el of this.cardUiElements) { el.destroy(); }
      this.cardUiElements = [];
      this.levelClearOverlay.setVisible(false);
      this.levelClearText.setVisible(false);
      this.levelClearBtn.setVisible(false);
      for (const enemy of this.enemies) {
        if (enemy.slimeSprite) { enemy.slimeSprite.destroy(); enemy.slimeSprite = null; }
      }
      this.enemies = [];
      this.currentLevel -= 1;
      this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
      this.enemiesToSpawnThisLevel = ENEMIES_PER_LEVEL_BASE + (this.currentLevel - 1) * ENEMIES_PER_LEVEL_STEP;
      this.enemiesSpawnedThisLevel = 0;
      this.spawnTimer = 0;
    }

    triggerLevelClear() {
      this.isLevelClear = true;
      this.levelClearOverlay.setVisible(true);
      this.levelClearText.setVisible(true);
      this.levelClearBtn.setVisible(true);
    }

    startNextLevel() {
      this.currentLevel += 1;
      this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
      this.enemiesToSpawnThisLevel = ENEMIES_PER_LEVEL_BASE + (this.currentLevel - 1) * ENEMIES_PER_LEVEL_STEP;
      this.enemiesSpawnedThisLevel = 0;
      this.isLevelClear = false;
      this.spawnTimer = 0;
      // Heal by 1 up to max HP.
      const maxHp = this.maxHp || PLAYER_HP_START;
      if (this.hp < maxHp) this.hp = Math.min(this.hp + 1, maxHp);
      // Clear enemies.
      for (const enemy of this.enemies) {
        if (enemy.slimeSprite) { enemy.slimeSprite.destroy(); enemy.slimeSprite = null; }
      }
      this.enemies = [];
      // Clear health pots.
      for (const pot of this.healthPots) { pot.label.destroy(); }
      this.healthPots = [];
      this.levelClearOverlay.setVisible(false);
      this.levelClearText.setVisible(false);
      this.levelClearBtn.setVisible(false);
    }

    applySlash(x1, y1, x2, y2) {
      if (this.slashCooldown > 0) return;

      let hitCount = 0;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (hitCount >= SLASH_MAX_TARGETS) break;
        const enemy = this.enemies[i];
        if (enemy.isDead) continue;
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

      // Slash effect.
      this.slashEffects.push({ x1, y1, x2, y2, timer: 0, duration: 0.18, hit: hitCount > 0 });
      this.slashCooldown = hitCount > 0 ? SLASH_COOLDOWN : SLASH_MISS_STUN;
    }

    spawnWeaponProjectiles(startX, startY, directionX, directionY, gestureSpeed, isPerfectRelease, slot = 'main') {
      const cfg = slot === 'sub' ? SUB_WEAPON_CONFIG : MAIN_WEAPON_CONFIG;
      const baseSpeed = Phaser.Math.Clamp(
        gestureSpeed * SPEED_MULTIPLIER * cfg.speedMultiplier,
        MIN_HORIZONTAL_SPEED,
        MAX_HORIZONTAL_SPEED,
      );

      // Sub weapon uses cooldown.
      if (slot === 'sub') {
        const cd = this.skillCooldowns.sub;
        if (!cd || cd.current > 0) {
          this.lastFiredWeaponType = slot;
          this.lastSpawnedProjectileCount = 0;
          return;
        }
        const effectiveCooldown = SUB_WEAPON_CONFIG.cooldownSeconds / (1 + this.subCooldownBonus);
        cd.current = cd.max = effectiveCooldown;
      }
      this.playSfx(slot === 'sub' ? 'shoot_bomb' : 'shoot');

      if (slot === 'sub') {
        const projectile = new Projectile(this, startX, startY, directionX, directionY, baseSpeed, slot);
        projectile.perfect = isPerfectRelease;
        this.projectiles.push(projectile);
        this.lastFiredWeaponType = slot;
        this.lastSpawnedProjectileCount = 1;
        return;
      }

      // Main slot: determine power shot once per firing event.
      this.mainShotCounter += 1;
      let isPowerShot = false;
      let damageMultiplier = 1;
      if (this.mainPowerShotLevel > 0 && this.mainShotCounter % MAIN_POWER_SHOT_CONFIG.triggerEveryShots === 0) {
        isPowerShot = true;
        damageMultiplier = Math.min(
          MAIN_POWER_SHOT_CONFIG.maxMultiplier,
          MAIN_POWER_SHOT_CONFIG.baseMultiplier + (this.mainPowerShotLevel - 1) * MAIN_POWER_SHOT_CONFIG.multiplierPerLevel
        );
      }

      // Build direction list: original + rotated extra if multishot active.
      const directions = [{ dx: directionX, dy: directionY }];
      if (this.mainMultishotLevel > 0) {
        const rad = MAIN_MULTISHOT_CONFIG.angleOffsetDeg * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        directions.push({
          dx: directionX * cos - directionY * sin,
          dy: directionX * sin + directionY * cos,
        });
      }

      for (const { dx, dy } of directions) {
        const projectile = new Projectile(this, startX, startY, dx, dy, baseSpeed, slot);
        projectile.isPowerShot = isPowerShot;
        projectile.damageMultiplier = damageMultiplier;
        this.projectiles.push(projectile);
      }
      this.lastFiredWeaponType = slot;
      this.lastSpawnedProjectileCount = directions.length;
    }

    updateSkillCooldowns(dt) {
      for (const cd of Object.values(this.skillCooldowns)) {
        if (cd.current > 0) cd.current = Math.max(0, cd.current - dt);
      }
    }

    drawMainAim(joystick, pointer) {
      const g = this.aimGfx;
      g.clear();
      const launchX = joystick.startX;
      const launchY = joystick.startY;
      const dx = pointer.x - launchX;
      const dy = pointer.y - launchY;
      const totalDist = Math.hypot(dx, dy);
      if (totalDist < 4) return;
      const ndx = dx / totalDist;
      const ndy = dy / totalDist;
      const drawDist = totalDist + JOYSTICK_MAIN_AIM_EXTEND;
      let t = 0;
      while (t <= drawDist) {
        const px = launchX + ndx * t;
        const py = launchY + ndy * t;
        if (px < -10 || px > WIDTH + 10 || py < -10 || py > HEIGHT + 10) break;
        g.fillStyle(0xffffff, Math.max(0.12, 0.8 - t / (drawDist * 1.2)));
        g.fillCircle(px, py, 3);
        t += 20;
      }
    }

    drawLeftAim(joystick, pointer) {
      const dx = pointer.x - joystick.startX;
      const dy = pointer.y - joystick.startY;
      const distance = Math.hypot(dx, dy);
      if (distance < 4) { this.aimGfx.clear(); return; }
      const dirX = dx / distance;
      const dirY = dy / distance;
      const scale = window.DEBUG_JOYSTICK?.aimRangeScale ?? JOYSTICK_AIM_RANGE_SCALE;
      const range = distance * scale;
      const launchX = (window.DEBUG_JOYSTICK?.leftTowerX ?? JOYSTICK_LEFT_LAUNCH_X) * WIDTH;
      const launchY = (window.DEBUG_JOYSTICK?.leftTowerY ?? JOYSTICK_LEFT_LAUNCH_Y) * HEIGHT;
      const targetX = launchX + dirX * range;
      const targetY = launchY + dirY * range;
      joystick.targetX = targetX;
      joystick.targetY = targetY;
      this.drawArcToTarget(launchX, launchY, targetX, targetY, 'sub');
    }

      // Draw the arc from start to target.
    drawArcToTarget(startX, startY, targetX, targetY, slot) {
      const g = this.aimGfx;
      g.clear();
      const weapon = slot === 'sub' ? SUB_WEAPON_CONFIG : MAIN_WEAPON_CONFIG;
      if (!weapon.hasArc) return;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const screenDist = Math.hypot(dx, dy);
      if (screenDist < 1) return;
      const ndx = dx / screenDist;
      const ndy = dy / screenDist;
      // Arc points use a sine curve.
      const steps = 30;
      const arcHeight = Math.min(screenDist * 0.35, 120); // Clamp arc height.
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = startX + dx * t;
        const py = startY + dy * t - Math.sin(t * Math.PI) * arcHeight;
        g.fillStyle(0xffb14d, Math.max(0.08, 0.8 - t * 0.55));
        g.fillCircle(px, py, 3);
      }
      // Target marker.
      const explR = (weapon.landingExplosionRadius || 40) * (1 + this.subRangeBonus);
      g.lineStyle(2, 0xffdc78, 0.9);
      g.strokeCircle(targetX, targetY, Math.max(18, explR));
      g.fillStyle(0xffdc78, 0.15);
      g.fillCircle(targetX, targetY, Math.max(18, explR));
    }

    applyLightning(tapX, tapY) {
      const jsCfg = window.DEBUG_JOYSTICK || {};
      const crystalX     = (jsCfg.crystalX ?? JOYSTICK_CRYSTAL_X) * WIDTH;
      const crystalY     = (jsCfg.crystalY ?? JOYSTICK_CRYSTAL_Y) * HEIGHT;
      const crystalRadius = JOYSTICK_CRYSTAL_RADIUS * WIDTH;

      // Find the nearest enemy inside the crystal zone.
      let nearestIdx = -1;
      let nearestDist = Infinity;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isDead) continue;
        const d = Phaser.Math.Distance.Between(e.x, e.y, crystalX, crystalY);
        if (d <= crystalRadius && d < nearestDist) { nearestIdx = i; nearestDist = d; }
      }
      if (nearestIdx === -1) return;

      const enemy = this.enemies[nearestIdx];
      const ex = enemy.x, ey = enemy.y;
      this.applyDamageToEnemy(nearestIdx, SLASH_DAMAGE, false);
      this.lightningCooldown = 0.3;

      // Lightning effect.
      const g = this.lightningGfx;
      g.clear();
      g.lineStyle(2, 0xaaddff, 0.95);
      const SEG = 6;
      let px = crystalX, py = crystalY;
      for (let i = 1; i <= SEG; i++) {
        const t = i / SEG;
        const nx = crystalX + (ex - crystalX) * t + (i < SEG ? (Math.random() - 0.5) * 22 : 0);
        const ny = crystalY + (ey - crystalY) * t + (i < SEG ? (Math.random() - 0.5) * 22 : 0);
        g.lineBetween(px, py, nx, ny);
        px = nx; py = ny;
      }
      this.time.delayedCall(150, () => { if (this.lightningGfx) this.lightningGfx.clear(); });
    }

    onSkillBtnClick(wtype) {
      // skill buttons no longer toggle aim mode; kept for UI CD display
    }

    drawSkillButtons() {
      for (const [wtype, objs] of Object.entries(this.skillBtnObjects)) {
        const unlocked = this.unlockedWeapons[wtype];
        const cd = this.skillCooldowns[wtype];
        const isActive = this.activeSkillWeapon === wtype;
        const onCd = unlocked && cd && cd.current > 0;
        const colors = HUD_SKILL_BTN_COLORS[wtype] || { ready: 0xffffff, stroke: 0x888888 };
        const bw = HUD_SKILL_BTN_W;

        if (!unlocked) {
          objs.bg.setFillStyle(0x111111, 0.7).setStrokeStyle(1, 0x333333);
          objs.nameText.setColor('#555555');
          objs.cdText.setColor('#444444').setText('LOCK');
          objs.cdBar.setVisible(false);
          objs.cdBarBg.setVisible(false);
        } else if (isActive) {
          objs.bg.setFillStyle(0x2a3a2a, 1).setStrokeStyle(2, 0xffffff);
          objs.nameText.setColor('#ffffff');
          objs.cdText.setColor('#aaffaa').setText('AIM!');
          objs.cdBar.setVisible(false);
          objs.cdBarBg.setVisible(false);
        } else if (onCd) {
          const ratio = cd.current / cd.max;
          objs.bg.setFillStyle(0x111111, 0.8).setStrokeStyle(1, 0x333333);
          objs.nameText.setColor('#666666');
          objs.cdText.setColor('#888888').setText(`${cd.current.toFixed(1)}s`);
          objs.cdBar.setVisible(true).setDisplaySize(Math.max(0, (bw - 8) * (1 - ratio)), 4).setFillStyle(colors.stroke, 1);
          objs.cdBarBg.setVisible(true);
        } else {
          objs.bg.setFillStyle(0x1a2a3a, 1).setStrokeStyle(2, colors.stroke);
          objs.nameText.setColor('#' + colors.ready.toString(16).padStart(6, '0'));
          objs.cdText.setColor('#aaddff').setText('READY');
          objs.cdBar.setVisible(false);
          objs.cdBarBg.setVisible(false);
        }
      }
    }

    drawAimPrediction(startX, startY, dx, dy, slot) {
      const g = this.aimGfx;
      g.clear();
      const weapon = slot === 'sub' ? SUB_WEAPON_CONFIG : MAIN_WEAPON_CONFIG;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ndx = dx / len;
      const ndy = dy / len;
      const previewSpeed = 1200;
      const baseSpeed = Phaser.Math.Clamp(previewSpeed * weapon.speedMultiplier, MIN_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);

      if (weapon.hasArc) {
        let gx = startX, gy = startY, gz = 0;
        const vx = ndx * baseSpeed * HORIZONTAL_SPEED_MULTIPLIER;
        const vy = ndy * baseSpeed * HORIZONTAL_SPEED_MULTIPLIER;
        let vz = Math.max(weapon.arcMinUpwardSpeed, previewSpeed * weapon.arcInitialVerticalMultiplier);
        const SIM_DT = 1 / 60;
        for (let i = 0; i < 240; i++) {
          gx += vx * SIM_DT; gy += vy * SIM_DT;
          gz += vz * SIM_DT; vz -= weapon.arcGravity * SIM_DT;
          if (gz <= 0) {
            const explR = weapon.landingExplosionRadius * (1 + this.subRangeBonus);
            g.lineStyle(2, 0xffdc78, 0.9);
            g.strokeCircle(gx, gy, Math.max(18, explR));
            g.fillStyle(0xffdc78, 0.15);
            g.fillCircle(gx, gy, Math.max(18, explR));
            break;
          }
          if (i % 3 === 0) {
            const alpha = Math.max(0.1, 0.8 - i * 0.003);
            g.fillStyle(0xffb14d, alpha);
            g.fillCircle(gx, gy - gz, 3);
          }
        }
      } else {
        const spreadDeg = weapon.spreadDeg || 0;
        const dirs = spreadDeg > 0
          ? [rotateVector(ndx, ndy, -spreadDeg), rotateVector(ndx, ndy, spreadDeg)]
          : [{ x: ndx, y: ndy }];
        for (const dir of dirs) {
          for (let t = 10; t < 280; t += 14) {
            const px = startX + dir.x * t;
            const py = startY + dir.y * t;
            if (px < -20 || px > WIDTH + 20 || py < -60 || py > HEIGHT + 20) break;
            const alpha = Math.max(0.1, 0.75 - t / 400);
            g.fillStyle(0x8fe8ff, alpha);
            g.fillCircle(px, py, 3);
          }
        }
      }
    }

    // drawAmmoHud removed; replaced by drawSkillButtons.

    addHitGauge(value) {
      const threshold = hitGaugeThreshold(this.hitGaugeCardCount);

      // Hit gauge combo scaling.
      if (value > 0) {
        this.comboCount += 1;
        // Every 5 combo hits adds 10%, up to +100%.
        const comboTier = Math.min(Math.floor(this.comboCount / 5), 10);
        const multiplier = 1 + comboTier * 0.1;
        value = value * multiplier;
      }

      this.hitGauge = Math.max(HIT_GAUGE_MIN, Math.min(this.hitGauge + value, threshold));

      if (this.hitGauge >= threshold) {
        this.hitGauge = 0;
        this.hitGaugeCardCount += 1;
        this.showCardPicker();
      }
    }

    // Misses reduce the combo count and the hit gauge.
    addHitGaugePenalty() {
      const threshold = hitGaugeThreshold(this.hitGaugeCardCount);
      this.hitGauge = Math.max(HIT_GAUGE_MIN, this.hitGauge - HIT_GAUGE_MISS_PENALTY);
    }

    drawHitGauge() {
      const g = this.hitGaugeGfx;
      g.clear();
      const threshold = hitGaugeThreshold(this.hitGaugeCardCount);
      const progress = Math.min(this.hitGauge / threshold, 1);
      const x = HUD_HIT_GAUGE_X;
      const topY = HUD_HIT_GAUGE_Y;
      const barW = HUD_HIT_GAUGE_WIDTH;
      const barH = HUD_HIT_GAUGE_MAX_HEIGHT;

      // Hit gauge background.
      g.fillStyle(0x2a2f36, 0.85);
      g.fillRoundedRect(x, topY, barW, barH, 4);

      // Fill based on progress.
      if (progress > 0) {
        const fillH = Math.round(barH * progress);
        const fillColor = progress >= 0.8 ? 0xffe066 : 0x5ad2f0;
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(x, topY + barH - fillH, barW, fillH, 4);
      }

      // Gauge border.
      g.lineStyle(1, 0xaaddff, 0.5);
      g.strokeRoundedRect(x, topY, barW, barH, 4);

      // Hit gauge text.
      this.hitGaugeLabel.setText(`${Math.floor(this.hitGauge)}/${threshold}`);
      this.hitGaugeLabel.setPosition(x + barW / 2, topY + barH + 4);
    }

    drawHpBar() {
      const g = this.hpBarGfx;
      g.clear();
      const hp = Math.max(0, this.hp);
      const x = HUD_HP_BAR_X;
      const y = HUD_HP_BAR_Y;
      const segW = HUD_HP_BAR_SEGMENT_W;
      const segH = HUD_HP_BAR_SEGMENT_H;
      const gap = HUD_HP_BAR_SEGMENT_GAP;
      // HP display uses up to 10 segments.
      const displayMax = Math.min(hp, 10);
      for (let i = 0; i < displayMax; i++) {
        const sx = x + i * (segW + gap);
        g.fillStyle(0xdd2222, 1);
        g.fillRoundedRect(sx, y, segW, segH, 3);
        g.lineStyle(1, 0xff6666, 0.7);
        g.strokeRoundedRect(sx, y, segW, segH, 3);
      }
    }

    drawCombo() {
      if (this.comboCount >= 3) {
        this.comboText.setText(`x${this.comboCount}`);
        this.comboText.setVisible(true);
      } else {
        this.comboText.setVisible(false);
      }
    }

    unlockAudioOnce() {
      if (this.audioUnlocked) {
        return;
      }
      try {
        const soundManager = this.sound;
        const context = soundManager && (soundManager.context || (soundManager.manager && soundManager.manager.context));
        if (context && typeof context.resume === 'function' && context.state === 'suspended') {
          try {
            context.resume();
          } catch (e) {}
        }
        if (soundManager && typeof soundManager.unlock === 'function') {
          try { soundManager.unlock(); } catch (e) {}
        }
      } catch (e) {}
      this.audioUnlocked = true;
    }

    playSfx(key) {
      if (!this.audioUnlocked) {
        return;
      }
      try { if (this.sfx && this.sfx[key]) this.sfx[key].play(); } catch(e) {}
    }

    // cycleWeapon + updateWeaponSwitchBtn removed ??replaced by skill button system

    getRightTowerPosition() {
      return {
        x: RIGHT_TOWER_X * WIDTH,
        y: RIGHT_TOWER_Y * HEIGHT,
      };
    }

    getCrystalDefenseZone() {
      const jsCfg = window.DEBUG_JOYSTICK || {};
      return {
        x: (jsCfg.crystalX ?? JOYSTICK_CRYSTAL_X) * WIDTH,
        y: (jsCfg.crystalY ?? JOYSTICK_CRYSTAL_Y) * HEIGHT,
        radius: JOYSTICK_CRYSTAL_RADIUS * WIDTH,
      };
    }

    updatePassiveWeapon(dt) {
      if (!RIGHT_TOWER_ENABLED) {
        return;
      }

      this.passiveWeaponTickTimer += dt;

      const effectiveTick = RIGHT_TOWER_TICK_INTERVAL / (1 + this.passiveFireRateBonus);
      while (this.passiveWeaponTickTimer >= effectiveTick) {
        this.passiveWeaponTickTimer -= effectiveTick;

        const towerPos = this.getRightTowerPosition();
        const crystalZone = this.getCrystalDefenseZone();
        const tickDamage = RIGHT_TOWER_DPS * (1 + this.passiveDamageBonus) * effectiveTick;
        const passiveExtraTargets = (this.passiveMultitargetLevel || 0) * PASSIVE_MULTITARGET_CONFIG.targetsPerLevel;
        const maxTargets = RIGHT_TOWER_MAX_TARGETS + passiveExtraTargets;
        const targets = this.enemies
          .filter((enemy) => !enemy.isDead
            && Phaser.Math.Distance.Between(enemy.x, enemy.y, crystalZone.x, crystalZone.y) <= crystalZone.radius)
          .sort((a, b) => {
            if (a.inZone !== b.inZone) {
              return a.inZone ? -1 : 1;
            }
            const distA = Phaser.Math.Distance.Between(a.x, a.y, crystalZone.x, crystalZone.y);
            const distB = Phaser.Math.Distance.Between(b.x, b.y, crystalZone.x, crystalZone.y);
            return distA - distB;
          })
          .slice(0, maxTargets);

        for (const enemy of targets) {
          this.passiveWeaponEffects.push({
            fromX: towerPos.x,
            fromY: towerPos.y,
            toX: enemy.x,
            toY: enemy.y,
            timer: 0,
            duration: 0.12,
          });

          enemy.hp -= tickDamage;
          if (enemy.hp <= 0) {
            enemy.isDead = true;
            enemy.deathTimer = 0;
            this.score += enemy.scoreValue || enemy.type.scoreValue || 1;
            this.playSfx('enemy_death');
          }
        }
      }
    }

    applyDamageToEnemy(enemyIndex, damage, isPerfect = false) {
      const enemy = this.enemies[enemyIndex];
      if (!enemy) {
        return false;
      }
      // Add one hit-gauge point.
      this.addHitGauge(HIT_GAUGE_HIT_VALUE);
      this.playSfx('hit');
      this.spawnDamagePopup(enemy.x, enemy.y, damage, isPerfect);
      enemy.hp -= damage;
      if (enemy.hp <= 0) {
        if (isPerfect) {
          this.spawnPerfectPopup(enemy.x, enemy.y);
        }
        this.playSfx('enemy_death');
        if (Math.random() < HEALTH_POT_CHANCE) {
          this.spawnHealthPot(enemy.x, enemy.y);
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

    applyMainKnockback(enemy) {
      if (enemy.isDead) return;
      const level = Math.min(
        Math.max(0, this.mainKnockbackLevel),
        MAIN_KNOCKBACK_CONFIG.maxLevel
      );
      if (level === 0) return;
      let dist = MAIN_KNOCKBACK_CONFIG.knockbackByLevel[level];
      if (enemy.inZone) dist *= 0.3;
      if (enemy.type && enemy.type.label === 'tank') dist *= 0.5;
      if (dist <= 0) return;
      enemy.y = Math.max(FAR_BATTLEFIELD_Y, enemy.y - dist);
    }

    applySubGravityPull(cx, cy, radius) {
      if (this.subPullLevel <= 0) return;
      const level = Math.min(Math.max(0, this.subPullLevel), SUB_PULL_CONFIG.maxLevel);
      const pullConfig = SUB_PULL_CONFIG.pullByLevel[level];
      if (!pullConfig || pullConfig.distance <= 0) return;
      const effectiveRadius = radius * (1 + this.subRangeBonus);
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dx = cx - enemy.x;
        const dy = cy - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > effectiveRadius + enemy.displayedRadius()) continue;
        let pull = pullConfig.distance;
        if (enemy.inZone) pull *= 0.5;
        if (dist <= 0) continue;
        const move = Math.min(pull, dist);
        enemy.x += (dx / dist) * move;
        enemy.y += (dy / dist) * move;
        // Clamp within battlefield.
        enemy.x = Math.max(0, Math.min(WIDTH, enemy.x));
        enemy.y = Math.max(FAR_BATTLEFIELD_Y, Math.min(DEFENSE_LINE_Y, enemy.y));
      }
    }

    applyBombDamage(cx, cy, radius, damage, isPerfect = false) {
      const effectiveRadius = radius * (1 + this.subRangeBonus);
      let hitCount = 0;
      for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.enemies[i];
        if (enemy.isDead) continue;
        const hitRadius = effectiveRadius + enemy.displayedRadius();
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, cx, cy) <= hitRadius) {
          this.addHitGauge(HIT_GAUGE_HIT_VALUE);
          hitCount += 1;
          this.spawnDamagePopup(enemy.x, enemy.y, damage, isPerfect);
          enemy.hp -= damage;
          if (isPerfect) {
            this.spawnPerfectPopup(enemy.x, enemy.y);
          }
          if (enemy.hp <= 0) {
            enemy.isDead = true;
            enemy.deathTimer = 0;
            this.playSfx('enemy_death');
            if (Math.random() < HEALTH_POT_CHANCE) {
              this.spawnHealthPot(enemy.x, enemy.y);
            }
            this.score += enemy.type.scoreValue || 1;
          } else {
            enemy.applyHitStun();
          }
        }
      }
      return hitCount;
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

    spawnDamagePopup(x, y, damage, isPerfect) {
      const displayVal = Math.round(damage * 10) / 10;
      const label = isPerfect ? `${displayVal}!` : `${displayVal}`;
      // Popup color indicates perfect or normal damage.
      let color = '#e0e0e0';
      if (isPerfect)         color = '#ffaa44';
      else if (damage >= 2)  color = '#ffe066';
      else if (damage >= 1)  color = '#ffffff';
      const size = isPerfect ? '22px' : damage >= 2 ? '20px' : '16px';
      const text = this.add.text(x + Phaser.Math.Between(-10, 10), y - 20, label, {
        fontFamily: 'Arial Black, Arial',
        fontSize: size,
        color,
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(190);
      this.damagePopups.push({ x: text.x, y: text.y, timer: 0, duration: 0.55, text });
    }

    spawnHealthPot(x, y) {
      const label = this.add.text(x, y, '❤️', {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(30);
      this.healthPots.push({ x, y, timer: 0, duration: HEALTH_POT_DURATION, label });
    }

    drawTerrain() {
      const g = this.gfx;
      g.clear();

      // Debug overlay.
      if (typeof DEBUG_PANEL_VISIBLE !== 'undefined' && DEBUG_PANEL_VISIBLE) {
        const jsCfg = window.DEBUG_JOYSTICK || {};
        const leftXMax  = (jsCfg.leftXMax  ?? JOYSTICK_LEFT_X_MAX)  * WIDTH;
        const mainXMin = (jsCfg.mainXMin ?? jsCfg.rightXMin ?? JOYSTICK_MAIN_X_MIN) * WIDTH;
        const zoneYMin  = (jsCfg.zoneYMin  ?? JOYSTICK_ZONE_Y_MIN)  * HEIGHT;
        const zoneYMax  = (jsCfg.zoneYMax  ?? JOYSTICK_ZONE_Y_MAX)  * HEIGHT;
        const cxRaw     = (jsCfg.crystalX  ?? JOYSTICK_CRYSTAL_X)   * WIDTH;
        const cyRaw     = (jsCfg.crystalY  ?? JOYSTICK_CRYSTAL_Y)   * HEIGHT;
        const cRadius   = JOYSTICK_CRYSTAL_RADIUS * WIDTH;
        const zoneH     = zoneYMax - zoneYMin;

        // Left zone overlay.
        g.fillStyle(0x4488ff, 0.15);
        g.fillRect(0, zoneYMin, leftXMax, zoneH);

        // Main zone overlay.
        g.fillStyle(0x44ff88, 0.15);
        g.fillRect(mainXMin, zoneYMin, WIDTH - mainXMin, zoneH);

        // Crystal debug ring.
        g.lineStyle(2, 0xff4444, 0.5);
        g.strokeCircle(cxRaw, cyRaw, cRadius);
        g.fillStyle(0xff4444, 0.08);
        g.fillCircle(cxRaw, cyRaw, cRadius);
      }
    }

    drawPassiveWeapon() {
      if (!RIGHT_TOWER_ENABLED) {
        return;
      }

      const g = this.gfx;
      const towerPos = this.getRightTowerPosition();

      g.fillStyle(0xff7b2f, 0.9);
      g.fillCircle(towerPos.x, towerPos.y, 10);
      g.lineStyle(2, 0xffd36b, 0.95);
      g.strokeCircle(towerPos.x, towerPos.y, 10);

      for (const effect of this.passiveWeaponEffects) {
        const progress = effect.timer / effect.duration;
        const alpha = 1 - progress;
        const midX = Phaser.Math.Linear(effect.fromX, effect.toX, 0.55) + Phaser.Math.FloatBetween(-5, 5);
        const midY = Phaser.Math.Linear(effect.fromY, effect.toY, 0.55) + Phaser.Math.FloatBetween(-5, 5);

        g.lineStyle(7 - progress * 3, 0xff7b2f, alpha * 0.75);
        g.lineBetween(effect.fromX, effect.fromY, midX, midY);
        g.lineStyle(3.5 - progress, 0xffd36b, alpha * 0.95);
        g.lineBetween(midX, midY, effect.toX, effect.toY);
      }
    }

  update(time, delta) {
    const dt = delta / 1000;

    if (!this.gameStarted) {
      this.drawTerrain();
      this.drawSkillButtons();
      this.drawHitGauge();
      this.drawHpBar();
      this.drawCombo();
      this.hudText.setText(`Score: ${this.score}`);
      this.levelText.setText(`Level: ${this.currentLevel}`);
      return;
    }

    if (this.isCardPicking) return;

      if (!this.gameOver) {
        this.playTime += dt;
        // Update level speed scaling from the current level.
        this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
        this.updateSkillCooldowns(dt);
        if (this.slashCooldown > 0) this.slashCooldown -= dt;
        if (this.lightningCooldown > 0) this.lightningCooldown -= dt;

        // Main weapon auto-fire while dragging.
        if (this.joystickMain) {
          const js = this.joystickMain;
          js.fireTimer += dt;
          const effectiveFireRate = NORMAL_FIRE_RATE / (1 + this.mainFireRateBonus);
          if (js.fireTimer >= effectiveFireRate) {
            js.fireTimer -= effectiveFireRate;
            const launchX = js.startX;
            const launchY = js.startY;
            const dx = js.currentPointerX - launchX;
            const dy = js.currentPointerY - launchY;
            const d = Math.hypot(dx, dy);
            if (d > 0) {
              this.spawnWeaponProjectiles(launchX, launchY, dx / d, dy / d, NORMAL_PROJECTILE_SPEED, false, 'main');
            }
          }
        }
        for (const ef of this.slashEffects) { ef.timer += dt; }
        this.slashEffects = this.slashEffects.filter(ef => ef.timer < ef.duration);

      // Level completion check.
        if (!this.isLevelClear && this.enemiesSpawnedThisLevel < this.enemiesToSpawnThisLevel) {
          this.spawnTimer += delta;
          const spawnInterval = spawnIntervalForLevel(this.currentLevel) * this.debugSpawnMultiplier;
          while (this.spawnTimer >= spawnInterval && this.enemiesSpawnedThisLevel < this.enemiesToSpawnThisLevel) {
            this.spawnTimer -= spawnInterval;
            let spawnType = enemyTypeForLevel(this.currentLevel);
            if (this.debugAllowedTypes && this.debugAllowedTypes.length > 0) {
              const allowed = this.debugAllowedTypes;
              spawnType = allowed[Math.floor(Math.random() * allowed.length)];
            }
            this.enemies.push(new Enemy(this, spawnType));
            this.enemiesSpawnedThisLevel += 1;
          }
        }

      // Spawn wave complete, then clear the level.
        if (!this.isLevelClear && this.enemiesSpawnedThisLevel >= this.enemiesToSpawnThisLevel) {
          const anyAlive = this.enemies.some(e => !e.isDead);
          if (!anyAlive) {
            this.triggerLevelClear();
          }
        }

      for (const enemy of this.enemies) {
        enemy.update(dt);
      }

      this.updatePassiveWeapon(dt);

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

      for (const popup of this.damagePopups) {
        popup.timer += dt;
        const progress = popup.timer / popup.duration;
        popup.text.setAlpha(1 - progress);
        popup.text.setPosition(popup.x, popup.y - progress * 30);
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
          if (!this.debugGodMode) this.hp -= 1;
          enemy.inZone = true;
          enemy.y = DEFENSE_LINE_Y - enemy.displayedRadius();
        }
        aliveEnemies.push(enemy);
      }
      this.enemies = aliveEnemies;

        const aliveProjectiles = [];
          for (const projectile of this.projectiles) {
            // Offscreen projectiles count as misses.
            if (projectile.offscreen()) {
              if (!projectile.hasHit) {
                this.comboCount = 0;
                this.addHitGaugePenalty();
              }
              projectile.destroy();
              continue;
            }

            // Sub weapon landed guard.
            if (projectile.weaponType === 'sub' && projectile.height <= 0) {
              if (!projectile.landedHitApplied) {
                // Use the forced landing position when present.
                const rawPos = projectile.groundPos();
                const gx = projectile.forcedLandX ?? rawPos.x;
                const gy = projectile.forcedLandY ?? rawPos.y;
                const bombDamage = projectile.weapon.damage * (1 + this.subDamageBonus);
                const bombHitCount = this.applyBombDamage(gx, gy, projectile.weapon.landingExplosionRadius, bombDamage, projectile.perfect);
                this.applySubGravityPull(gx, gy, projectile.weapon.landingExplosionRadius);
                this.playSfx('explosion');
                this.bombExplosionEffects.push({ x: gx, y: gy, timer: 0, duration: 0.45, radius: projectile.weapon.landingExplosionRadius * (1 + this.subRangeBonus) });
                projectile.landedHitApplied = true;
                // Bomb miss check.
                if (bombHitCount === 0) {
                  this.comboCount = 0;
                  this.addHitGaugePenalty();
                }
              }
              projectile.destroy();
              continue;
            }

            // Landed projectiles can still count as misses.
            if (projectile.landed) {
              if (!projectile.landedMissApplied && !projectile.hasHit) {
                projectile.landedMissApplied = true;
                this.comboCount = 0;
                this.addHitGaugePenalty();
              }
              if (!LANDED_PROJECTILE_CAN_HIT_ENEMIES) {
                aliveProjectiles.push(projectile);
                continue;
              }
            }

        if (projectile.weaponType === 'main') {
          const hitRadius = projectile.weapon.hitRadius ?? projectile.weapon.straightHitRadius;
          const x1 = projectile.prevGroundX;
          const y1 = projectile.prevGroundY;
          const x2 = projectile.groundX;
          const y2 = projectile.groundY;
          let hitIndex = -1;
          for (let i = 0; i < this.enemies.length; i += 1) {
            const enemy = this.enemies[i];
            if (enemy.isDead) continue;
            if (distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2) <= hitRadius + enemy.displayedRadius()) {
              hitIndex = i;
              break;
            }
            }
            if (hitIndex !== -1) {
              const hitDamage = projectile.weapon.damage * (1 + this.mainDamageBonus) * projectile.damageMultiplier;
              const killed = this.applyDamageToEnemy(hitIndex, hitDamage, projectile.perfect);
              if (!killed && this.mainKnockbackLevel > 0) {
                this.applyMainKnockback(this.enemies[hitIndex]);
              }
              projectile.hasHit = true;
              projectile.destroy();
              continue;
            }
          }

        aliveProjectiles.push(projectile);
      }
      this.projectiles = aliveProjectiles;
      this.landingEffects = this.landingEffects.filter((effect) => effect.timer < effect.duration);
      // Bomb explosion timers.
      for (const ef of this.bombExplosionEffects) { ef.timer += dt; }
      this.bombExplosionEffects = this.bombExplosionEffects.filter(ef => ef.timer < ef.duration);
      for (const effect of this.passiveWeaponEffects) { effect.timer += dt; }
      this.passiveWeaponEffects = this.passiveWeaponEffects.filter((effect) => effect.timer < effect.duration);
      // Health pot cleanup.
      this.healthPotGfx.clear();
      const alivePots = [];
      for (const pot of this.healthPots) {
        pot.timer += dt;
        if (pot.timer >= pot.duration) {
          pot.label.destroy();
          continue;
        }
        // Health pot fades near expiry.
        const remaining = pot.duration - pot.timer;
        const alpha = remaining < 1 ? Math.sin(pot.timer * 10) * 0.5 + 0.5 : 1;
        pot.label.setAlpha(alpha);
        alivePots.push(pot);
      }
      this.healthPots = alivePots;

      const alivePopups = [];
      for (const popup of this.perfectPopups) {
        if (popup.timer < popup.duration) {
          alivePopups.push(popup);
        } else {
          popup.text.destroy();
        }
      }
      this.perfectPopups = alivePopups;

      const aliveDmgPopups = [];
      for (const popup of this.damagePopups) {
        if (popup.timer < popup.duration) {
          aliveDmgPopups.push(popup);
        } else {
          popup.text.destroy();
        }
      }
      this.damagePopups = aliveDmgPopups;

      if (this.hp <= 0) {
        this.hp = 0;
        this.gameOver = true;
        this.gameOverText.setVisible(true);
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.finalScoreText.setVisible(true);
      }
    }

      this.drawTerrain();

      // Slash effects.
      for (const ef of this.slashEffects) {
        const progress = ef.timer / ef.duration;
        const alpha = 1 - progress;
        const color = ef.hit ? 0xffffff : 0xff4444;
        this.gfx.lineStyle(3 + (1 - progress) * 3, color, alpha);
        this.gfx.lineBetween(ef.x1, ef.y1, ef.x2, ef.y2);
      }

      this.drawPassiveWeapon();

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

      // Bomb explosion effects.
    for (const ef of this.bombExplosionEffects) {
      const progress = ef.timer / ef.duration;
      const expandRadius = ef.radius * (0.3 + progress * 0.7);
      const alpha = 1 - progress;
      // Explosion outline.
      this.gfx.lineStyle(3, 0xffb14d, alpha);
      this.gfx.strokeCircle(ef.x, ef.y, expandRadius);
      // Inner flash.
      if (progress < 0.3) {
        this.gfx.fillStyle(0xffdd88, alpha * (1 - progress / 0.3) * 0.35);
        this.gfx.fillCircle(ef.x, ef.y, expandRadius);
      }
        // Outer ring.
        this.gfx.lineStyle(1.5, 0xff6600, alpha * 0.6);
      this.gfx.strokeCircle(ef.x, ef.y, expandRadius * 0.6);
    }

      for (const projectile of this.projectiles) {
        projectile.draw(this.gfx);
      }

        this.drawSkillButtons();
        this.drawHitGauge();
        this.drawHpBar();
        this.drawCombo();
      this.hudText.setText(`Score: ${this.score}`);
      this.levelText.setText(`Level: ${this.currentLevel}`);
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

window.game = new Phaser.Game(config);
