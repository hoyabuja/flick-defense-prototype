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

const RIGHT_TOWER_TAP_MOVE_THRESHOLD = 18;

// Crystal target Y is tracked in normalized debug terms, then converted to pixels here.
const CRYSTAL_TARGET_Y_DEBUG = 0.66;
if (typeof DEFENSE_LAYOUT_CONFIG !== 'undefined' && typeof HEIGHT !== 'undefined') {
  DEFENSE_LAYOUT_CONFIG.crystalTargetY = CRYSTAL_TARGET_Y_DEBUG * HEIGHT;
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

  const ENEMY_ATLAS_ANIMATION_PROFILES = {
    normal: {
      atlasKey: 'slime1sheet',
      idle: {
        frames: ['idle'],
        fps: 1,
        loop: true,
      },
      move: {
        frames: ['move_01 crouch', 'move_02 jump', 'move_03 landing', 'move_04 recovery'],
        fps: 8,
        loop: true,
      },
      hit: {
        frames: ['hit_01', 'hit_02'],
        fps: 12,
        loop: false,
      },
      death: {
        frames: ['death_01', 'death_02', 'death_03', 'death_04'],
        fps: 8,
        loop: false,
      },
    },
    zigzag: {
      atlasKey: 'zigzag1',
      idle: {
        frames: ['open1', 'open2', 'open3', 'open2'],
        fps: 5,
        loop: true,
      },
      roll: {
        frames: ['walk1', 'walk2', 'walk3'],
        fps: 12,
        loop: true,
      },
      hit: {
        frames: ['hit', 'hit2'],
        fps: 12,
        loop: false,
      },
      death: {
        frames: ['dead', 'dead2', 'dead3', 'dead4'],
        fps: 8,
        loop: false,
      },
    },
  };

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
      } else if (mv && mv.movementType === 'roll') {
        this.rollState = 'PAUSING';
        this.rollTimer = 0;
        this.rollPause = Phaser.Math.FloatBetween(mv.pauseMin, mv.pauseMax);
        this.rollDuration = Phaser.Math.FloatBetween(mv.rollDurationMin, mv.rollDurationMax);
        this.rollStartX = this.x;
        this.rollStartY = this.y;
        this.rollTargetX = this.x;
        this.rollTargetY = this.y;
        this.rollVisualRotation = 0;
        this.hopVisualOffsetY = 0;
        this.hopScaleX = 1;
        this.hopScaleY = 1;
      }
      this.hitStunTimer = 0;
      this.isDead = false;
      this.deathTimer = 0;
      this.slimeSprite = null;
      this.currentAnimName = null;
      this.animTimer = 0;
      this.animFrameIndex = 0;
      this.lastAnimFrameName = null;
      this.lastAnimDt = 0;
      // Defense state — applies to all enemy types
      this.defenseState = 'advancing'; // advancing | attackingWall | movingToCrystal | inTargetZone
      this.attackTimer = 0;
      this.orbitAngle = 0;
      this.orbitRadiusX = 0;
      this.orbitRadiusY = 0;
      this.orbitSpeed = 0;
      this.orbitDirection = 1;
      this.frozenMsRemaining = 0;
      this.repulseTweenMsRemaining = 0;
      this.repulseTweenDurationMs = 0;
      this.repulseStartY = this.y;
      this.repulseTargetY = this.y;
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
      this.lastAnimDt = dt;
      if (this.isDead) {
        this.deathTimer += dt;
        return;
      }
      if (this.repulseTweenMsRemaining > 0) {
        this.repulseTweenMsRemaining = Math.max(0, this.repulseTweenMsRemaining - dt * 1000);
        const durationMs = Math.max(1, this.repulseTweenDurationMs || 1);
        const progress = 1 - (this.repulseTweenMsRemaining / durationMs);
        const eased = 1 - Math.pow(1 - Phaser.Math.Clamp(progress, 0, 1), 3);
        this.y = Phaser.Math.Linear(this.repulseStartY, this.repulseTargetY, eased);
        this.clampToBattlefield(-20);
        return;
      }
      if (this.frozenMsRemaining > 0) {
        this.frozenMsRemaining = Math.max(0, this.frozenMsRemaining - dt * 1000);
        return;
      }
      if (this.defenseState === 'attackingWall') {
        // Stationary — keep hit-stun animation for hop enemies
        const mv = this.type.movement;
        if (mv && mv.movementType === 'hop') {
          if (this.hitStunTimer > 0) {
            this.hitStunTimer -= dt;
            this.hopScaleX = mv.squashScaleX;
            this.hopScaleY = mv.squashScaleY;
          } else {
            this.hopScaleX = 1;
            this.hopScaleY = 1;
          }
        }
        return;
      }
      if (this.defenseState === 'movingToCrystal') {
        this._moveTowardCrystal(dt);
        return;
      }
      if (this.defenseState === 'inTargetZone') {
        this.updateTargetZoneOrbit(dt);
        return;
      }
      // defenseState === 'advancing'
      const mv = this.type.movement;
      if (mv && mv.movementType === 'hop') {
        this.updateHop(dt);
      } else if (mv && mv.movementType === 'roll') {
        this.updateRoll(dt);
      } else {
        this.updateGlide(dt);
      }
    }

    _moveTowardCrystal(dt) {
      const zone = this.scene.getCrystalDefenseZone();
      if (zone.contains(this.x, this.y)) {
        this.scene.enterEnemyTargetZone(this);
        return;
      }
      const tx = zone.x;
      const ty = zone.y;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0.0001) return;
      const move = Math.min(this.speed * (this.scene.levelSpeedMultiplier || 1) * dt, dist);
      this.x += (dx / dist) * move;
      this.y += (dy / dist) * move;
      if (zone.contains(this.x, this.y)) {
        this.scene.enterEnemyTargetZone(this);
      }
    }

    updateTargetZoneOrbit(dt) {
      const zone = this.scene.getCrystalDefenseZone();
      this.orbitAngle += this.orbitSpeed * this.orbitDirection * dt;
      this.x = zone.x + Math.cos(this.orbitAngle) * this.orbitRadiusX;
      this.y = zone.y + Math.sin(this.orbitAngle) * this.orbitRadiusY;
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

    updateRoll(dt) {
      const mv = this.type.movement;

      if (this.hitStunTimer > 0) {
        this.hitStunTimer -= dt;
        this.hopScaleX = 1.02;
        this.hopScaleY = 0.98;
        this.hopVisualOffsetY = 0;
        this.rollVisualRotation *= 0.84;
        return;
      }

      this.rollTimer += dt;
      this.hopVisualOffsetY = 0;
      const progress = this.progress();
      const nearMultiplier = 1 + (mv.nearBaseMultiplier - 1) * progress;
      const speedScale = this.scene.levelSpeedMultiplier * nearMultiplier;

      if (this.rollState === 'PAUSING') {
        this.hopScaleX = 1;
        this.hopScaleY = 1;
        this.rollVisualRotation *= 0.8;
        if (this.rollTimer < this.rollPause) {
          return;
        }

        const forwardDistance = Phaser.Math.FloatBetween(mv.rollDistanceMin, mv.rollDistanceMax) * speedScale;
        const lateralMagnitude = Phaser.Math.FloatBetween(mv.rollLateralMin, mv.rollLateralMax);
        const lateralRoll = Math.random();
        let lateralDirection = 0;
        if (lateralRoll < 0.38) {
          lateralDirection = -1;
        } else if (lateralRoll < 0.76) {
          lateralDirection = 1;
        }

        const targetY = this.y + forwardDistance;
        const targetBounds = battlefieldBoundsAtY(targetY);
        const targetCenterX = (targetBounds.left + targetBounds.right) / 2;
        const edgeMargin = Math.max(20, this.displayedRadius() * 1.6);
        if (this.x <= targetBounds.left + edgeMargin) {
          lateralDirection = 1;
        } else if (this.x >= targetBounds.right - edgeMargin) {
          lateralDirection = -1;
        }

        let targetX = this.x + lateralMagnitude * lateralDirection;
        if (lateralDirection === 0) {
          targetX += Phaser.Math.FloatBetween(-6, 6);
        } else {
          targetX += (targetCenterX - this.x) * 0.12;
        }

        const radius = this.displayedRadius();
        this.rollStartX = this.x;
        this.rollStartY = this.y;
        this.rollTargetY = targetY;
        this.rollTargetX = Phaser.Math.Clamp(targetX, targetBounds.left + radius, targetBounds.right - radius);
        this.rollDuration = Phaser.Math.FloatBetween(mv.rollDurationMin, mv.rollDurationMax);
        this.rollTimer = 0;
        this.rollState = 'ROLLING';
        return;
      }

      if (this.rollState === 'ROLLING') {
        const t = Math.min(this.rollTimer / this.rollDuration, 1);
        this.x = Phaser.Math.Linear(this.rollStartX, this.rollTargetX, t);
        this.y = Phaser.Math.Linear(this.rollStartY, this.rollTargetY, t);
        this.hopScaleX = 1.08;
        this.hopScaleY = 0.92;
        this.rollVisualRotation = Phaser.Math.Linear(0, (this.rollTargetX - this.rollStartX) * 0.12, t);

        if (t >= 1) {
          this.x = this.rollTargetX;
          this.y = this.rollTargetY;
          this.rollState = 'PAUSING';
          this.rollTimer = 0;
          this.rollPause = Phaser.Math.FloatBetween(mv.pauseMin, mv.pauseMax);
          this.hopScaleX = 1;
          this.hopScaleY = 1;
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
      } else if (mv && mv.movementType === 'roll') {
        this.hitStunTimer = (mv.hitStunMs || 110) / 1000;
        this.rollState = 'PAUSING';
        this.rollTimer = 0;
        this.rollPause = Phaser.Math.FloatBetween(mv.pauseMin, mv.pauseMax);
        this.rollTargetX = this.x;
        this.rollTargetY = this.y;
      }
    }

    applyFreeze(durationMs) {
      this.frozenMsRemaining = Math.max(this.frozenMsRemaining, durationMs);
    }

    isFrozen() {
      return this.frozenMsRemaining > 0;
    }

    clampToBattlefield(minY = -20) {
      const radius = this.displayedRadius();
      this.y = Phaser.Math.Clamp(this.y, minY, DEFENSE_LINE_Y);
      const bounds = battlefieldBoundsAtY(this.y);
      this.x = Phaser.Math.Clamp(this.x, bounds.left + radius, bounds.right - radius);
    }

    startRepulseTween(targetY, durationMs) {
      this.repulseStartY = this.y;
      this.repulseTargetY = targetY;
      this.repulseTweenDurationMs = Math.max(1, durationMs);
      this.repulseTweenMsRemaining = this.repulseTweenDurationMs;
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

    getAtlasAnimationProfile() {
      return ENEMY_ATLAS_ANIMATION_PROFILES[this.type.label] || null;
    }

    getDesiredAtlasAnimationName() {
      const mv = this.type.movement;
      if (this.isDead) return 'death';
      if (this.hitStunTimer > 0) return 'hit';
      if (this.type.label === 'normal' && mv && mv.movementType === 'hop') {
        if (this.hopState === 'CHARGING' || this.hopState === 'AIRBORNE' || this.hopState === 'LANDING') {
          return 'move';
        }
      }
      if (this.type.label === 'zigzag' && mv && mv.movementType === 'roll' && this.rollState === 'ROLLING') {
        return 'roll';
      }
      return 'idle';
    }

    getAtlasAnimationFrame(dt) {
      const profile = this.getAtlasAnimationProfile();
      if (!profile) return null;

      const animName = this.getDesiredAtlasAnimationName();
      const anim = profile[animName];
      if (!anim || !anim.frames || !anim.frames.length) return null;

      if (this.currentAnimName !== animName) {
        this.currentAnimName = animName;
        this.animTimer = 0;
        this.animFrameIndex = 0;
      } else {
        this.animTimer += dt;
      }

      const frameDuration = anim.fps > 0 ? (1 / anim.fps) : Infinity;
      if (Number.isFinite(frameDuration) && frameDuration > 0) {
        const frameAdvance = Math.floor(this.animTimer / frameDuration);
        if (anim.loop) {
          this.animFrameIndex = frameAdvance % anim.frames.length;
        } else {
          this.animFrameIndex = Math.min(frameAdvance, anim.frames.length - 1);
        }
      }

      this.lastAnimFrameName = anim.frames[this.animFrameIndex];
      return this.lastAnimFrameName;
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
      const atlasProfile = this.getAtlasAnimationProfile();
      if (atlasProfile && this.scene.textures.exists(atlasProfile.atlasKey)) {
        const atlasFrame = this.getAtlasAnimationFrame(this.lastAnimDt || 0);
        const atlasTexture = this.scene.textures.get(atlasProfile.atlasKey);
        if (atlasFrame && atlasTexture && atlasTexture.has(atlasFrame)) {
          if (!this.slimeSprite) {
            this.slimeSprite = this.scene.add.image(this.x, visualY, atlasProfile.atlasKey, atlasFrame).setDepth(10 + this.y * 0.01);
          }
          const displaySize = bodySize * 1.8 * this.visualScale();
          this.slimeSprite.setTexture(atlasProfile.atlasKey, atlasFrame);
          this.slimeSprite.setPosition(this.x, visualY);
          this.slimeSprite.setDisplaySize(displaySize * scaleX, displaySize * scaleY);
          this.slimeSprite.setDepth(10 + this.y * 0.01);
          const shadowScale = this.visualScale();
          const shadowWidth = ENEMY_SHADOW_BASE_W + shadowScale * 22;
          const shadowHeight = ENEMY_SHADOW_BASE_H + shadowScale * 10;
          const shadowAlpha = ENEMY_SHADOW_MIN_ALPHA + shadowScale * (ENEMY_SHADOW_MAX_ALPHA - ENEMY_SHADOW_MIN_ALPHA);
          gfx.fillStyle(SHADOW, shadowAlpha);
          gfx.fillEllipse(this.x, this.y + bodySize * 0.3, shadowWidth, shadowHeight);
          if (this.isFrozen()) {
            gfx.lineStyle(2, 0x8fe8ff, 0.95);
            gfx.strokeCircle(this.x, visualY, Math.max(radius, bodySize * 0.42));
          }

          return;
        }
      }
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
        if (this.isFrozen()) {
          gfx.lineStyle(2, 0x8fe8ff, 0.95);
          gfx.strokeCircle(this.x, visualY, Math.max(radius, bodySize * 0.42));
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
      if (this.isFrozen()) {
        gfx.lineStyle(2, 0x8fe8ff, 0.95);
        gfx.strokeCircle(bodyCenterX, visualY, Math.max(radius, bodyWidth * 0.42));
      }
    }
  }

  class Projectile {
    constructor(scene, startX, startY, directionX, directionY, speed, resolvedConfig, slotMeta) {
      this.scene = scene;
      this.slot   = slotMeta?.slot   ?? null;
      this.typeId = slotMeta?.typeId ?? null;
      this.startX = startX;
      this.startY = startY;
      this.weapon = resolvedConfig;
      this.visual = PROJECTILE_VISUAL_CONFIG[resolvedConfig.visualKey] || PROJECTILE_VISUAL_CONFIG.standard_bolt;
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
      const hMult = resolvedConfig.hasArc ? HORIZONTAL_SPEED_MULTIPLIER : 1;
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
      if (this.weapon?.mode === 'projectile') {
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
    // Legacy player HP fields; current core health uses crystalHp/crystalMaxHp.
    // Defense layer HP — initialized properly in create()
    this.wallHp = 0;
    this.wallMaxHp = 0;
    this.crystalHp = 0;
    this.crystalMaxHp = 0;
    this.gameOver = false;
    this.spawnTimer = 0;
    this.playTime = 0;
      this.currentLevel = 1;
      this.levelSpeedMultiplier = 1;
      this.skillCooldowns = createSkillCooldownState();
        this.skillBtnObjects = {};
        this.joystickLeft  = null;
        this.joystickMain = null;
        this.joystickRight = null;
        this.rightTowerInput = null;
        this.lastRightTowerInput = null;
        this.lastFiredWeaponType = 'none';
        this.lastSpawnedProjectileCount = 0;
        this.slashCooldown = 0;
        this.slashEffects = [];
        this.passiveWeaponTickTimer = 0;
        this.passiveWeaponEffects = [];
        this.beamEffects = [];
        this.beamImpactEffects = [];
        this.satelliteBeamTimer = 0;
        this.continuousBeamTickTimer = 0;
        this.continuousBeamEnergy = CONTINUOUS_BEAM_CONFIG.maxEnergy ?? 1.0;
        this.continuousBeamFireWindowRemaining = CONTINUOUS_BEAM_CONFIG.fireWindowSeconds ?? 3;
        this.continuousBeamCooldownRemaining = 0;
        this.mainBeamCooldownRemaining = 0;
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
        this.unlockedWeapons = { left: true };
        // Upgrade state — main weapon (additive, start at 0; applied as base × (1 + bonus))
        this.mainDamageBonus = 0.0;
        this.mainFireRateBonus = 0.0;
        this.mainKnockbackLevel = 0;   // behavior pending
        this.mainMultishotLevel = 0;   // behavior pending
        this.mainPowerShotLevel = 0;   // behavior pending
        this.mainShotCounter = 0;      // for power shot tracking
        this.selectedTowerWeaponTypes = { ...DEFAULT_TOWER_WEAPON_TYPES };
        Object.assign(this, createRightTowerUltimateState());
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
        this.mainPierceBonus = 0;
        this.mainShotgunLevel = 0;
        this.mainShotgunCloseBonus = 0;
        this.selectedBeamForm = null;
        this.twinBeamLevel = 0;
        this.satelliteBeamLevel = 0;
        this.continuousBeamLevel = 0;
        this.twinBeamEqualizedLevel = 0;
        this.twinBeamCrossEnabled = false;
        this.satelliteBeamLockLevel = 0;
        this.satelliteBeamRelayEnabled = false;
        this.continuousBeamHeatFocusLevel = 0;
        this.continuousBeamStableLevel = 0;
        this.beamWidthLevel = 0;
        this.beamRechargeLevel = 0;
        this.rightGuardZoneBonus = 0;
        this.comboEconomyLevel = 0;
        this.selectedMainWeaponCoreId = 'core_combo_engine';
        this.selectedMainWeaponCoreTags = [];
        this.cardLevels = {};
        this.pickedCardIds = {};
        this.pickedCardTags = {};
        this.pickedCardRoles = {};
        this.cardDraftCount = 0;
        initCardDraftState(this);
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
        this.loadoutSelectedTab     = LOADOUT_MENU_DEFAULT_TAB;
        this.loadoutMenuElements    = [];
        this.loadoutContentElements = [];
        this.loadoutTabObjects      = {};
    }
  
    preload() {
      this.load.image('background_arena', 'assets/background_arena.png');
      this.load.image('slime_idle', 'assets/slime1.png');
      this.load.image('slime_hop', 'assets/slime2.png');
      this.load.image('slime_hit', 'assets/slime3.png');
      this.load.image('slime_death', 'assets/slime4.png');
      this.load.atlas('slime1sheet', 'assets/sheets/slime1sheet.png', 'assets/sheets/slime1sheet.json');
      this.load.atlas('zigzag1', 'assets/sheets/zigzag1.png', 'assets/sheets/zigzag1.json');
      this.load.image('shroom_idle', 'assets/shroom1.png');
      this.load.image('shroom_hop', 'assets/shroom2.png');
      this.load.image('shroom_hit', 'assets/shroom3.png');
      this.load.image('shroom_death', 'assets/shroom4.png');
      // Module sprites — all entries in MODULES_CONFIG; missing files skipped via textures.exists() in create()
      for (const mod of MODULES_CONFIG) {
        this.load.image(mod.key, mod.path);
      }
      for (const visual of Object.values(PROJECTILE_VISUAL_CONFIG)) {
        this.load.image(visual.assetKey, visual.assetPath);
      }
      if (RIGHT_TOWER_PASSIVE_VISUAL_CONFIG?.enabled && RIGHT_TOWER_PASSIVE_VISUAL_CONFIG.assetKey && RIGHT_TOWER_PASSIVE_VISUAL_CONFIG.assetPath) {
        this.load.image(RIGHT_TOWER_PASSIVE_VISUAL_CONFIG.assetKey, RIGHT_TOWER_PASSIVE_VISUAL_CONFIG.assetPath);
      }
      for (const card of CARD_POOL) {
        if (card?.cardImageKey && card?.cardImagePath) {
          this.load.image(card.cardImageKey, card.cardImagePath);
        }
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
        this.energyZoneGfx = this.add.graphics().setDepth(-100);
        this.gfx = this.add.graphics();
        this.gfx.setDepth(0);

        // Defense layout — HP state
        const _dc = DEFENSE_LAYOUT_CONFIG;
        this.wallHp    = _dc.wallMaxHp;
        this.wallMaxHp = _dc.wallMaxHp;
        this.crystalHp    = _dc.crystalMaxHp;
        this.crystalMaxHp = _dc.crystalMaxHp;

        // Module sprites — created from MODULES_CONFIG; missing textures skipped
        this.moduleSprites = {};
        for (const mod of MODULES_CONFIG) {
          if (this.textures.exists(mod.key)) {
            this.moduleSprites[mod.key] = this.add.image(mod.x, mod.y, mod.key)
              .setScale(mod.scale)
              .setDepth(mod.depth)
              .setVisible(mod.visible);
          }
        }
        // Defense sprite references (used by gameplay + wall-broken tinting, etc.)
        this.frontWallSprite   = this.moduleSprites[_dc.wallSpriteKey]    || null;
        this.crystalCoreSprite = this.moduleSprites[_dc.crystalSpriteKey] || null;
        this.syncDefenseVisuals();

        // Runtime debug visibility — starts from config constant, toggled by the panel button
        this.debugVisible = (typeof DEBUG_PANEL_VISIBLE !== 'undefined' && DEBUG_PANEL_VISIBLE);
        this.createModuleDebugPanel();
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
        this.beamGfx = this.add.graphics().setDepth(PIERCE_BEAM_CONFIG.depth);
        this.healthPotGfx = this.add.graphics().setDepth(30);
        this.activeGameplayPointerIds = new Set();
        this.maxGameplayPointers = 2;
      this.hudText = this.add.text(16, 14, `${getUiText('hud.score_prefix')}: 0`, { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setDepth(70);
      this.levelText = this.add.text(HUD_LEVEL_TEXT_X, HUD_LEVEL_TEXT_Y, `${getUiText('hud.level_prefix')}: 1`, { fontFamily: 'Arial', fontSize: '30px', color: '#f0f0f0' }).setOrigin(0.5, 0).setDepth(70);
      this.debugText = this.add.text(16, 48, '', { fontFamily: 'Arial', fontSize: '18px', color: '#f0f0f0' }).setDepth(70);
      this.rightUltText = this.add.text(HUD_RIGHT_ULT_TEXT_X, HUD_RIGHT_ULT_TEXT_Y, '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#f0f0f0',
        align: 'right',
      }).setOrigin(1, 0).setDepth(75);
      this.rightUltStatusText = this.add.text(HUD_RIGHT_ULT_TEXT_X, HUD_RIGHT_ULT_TEXT_Y + 18, '', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#8fb8d2',
        align: 'right',
      }).setOrigin(1, 0).setDepth(75);
      this.rightUltHoldGfx = this.add.graphics().setDepth(74);
      this.debugText.setVisible(false);
      this.gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2 - 20, getUiText('game_over.title'), { fontFamily: 'Arial', fontSize: '72px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
      this.finalScoreText = this.add.text(WIDTH / 2, HEIGHT / 2 + 34, '', { fontFamily: 'Arial', fontSize: '42px', color: '#f0f0f0' }).setOrigin(0.5).setDepth(80);
    this.gameOverText.setVisible(false);
    this.finalScoreText.setVisible(false);

    // Skill buttons and cooldown UI.
    this.aimGfx = this.add.graphics().setDepth(65);
    const skillWeapons = ['left'];
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

      const cdText = this.add.text(bx + bw / 2, by + 34, getUiText('hud.skill.locked'), {
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
    this.hpBarLabel = this.add.text(HUD_HP_BAR_X + 6, HUD_HP_BAR_Y + HUD_HP_BAR_MAX_HEIGHT + 6, getUiText('hud.core_label'), {
      fontFamily: 'Arial', fontSize: '13px', color: '#ff8888',
    }).setDepth(70);

    // Level clear UI
    this.levelClearOverlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55).setDepth(90).setVisible(false);
    this.levelClearText = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, getUiText('level_clear.title'), {
      fontFamily: 'Arial', fontSize: '96px', color: '#ffe066', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(91).setVisible(false);
    this.levelClearBtn = this.add.text(WIDTH / 2, HEIGHT / 2 + 60, getUiText('level_clear.continue_button'), {
      fontFamily: 'Arial', fontSize: '48px', color: '#f0f0f0',
      backgroundColor: '#2e6adf', padding: { x: 36, y: 16 },
    }).setOrigin(0.5).setDepth(91).setVisible(false).setInteractive({ useHandCursor: true });
    this.levelClearBtn.on('pointerup', () => {
      this.levelClearOverlay.setVisible(false);
      this.levelClearText.setVisible(false);
      this.levelClearBtn.setVisible(false);
      this.startNextLevel();
    });

    this.createLoadoutMenu();

    this.input.on('pointerdown', (pointer) => {
      if (!this.gameStarted) return;

      // Tap unlocks audio before the first pointerdown is handled.

      if (this.gameOver || this.isLevelClear || this.isCardPicking) return;

      // Health potion pickup.
      for (let i = this.healthPots.length - 1; i >= 0; i--) {
        const pot = this.healthPots[i];
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, pot.x, pot.y) <= HEALTH_POT_RADIUS * 1.5) {
        if (this.crystalHp < this.crystalMaxHp) {
          this.crystalHp = Math.min(this.crystalHp + HEALTH_POT_CONFIG.heal, this.crystalMaxHp);
          }
          pot.label.destroy();
          this.healthPots.splice(i, 1);
          return;
        }
      }

      const zones = this.getTouchZoneBounds();

      if (pointer.x >= zones.mainXMin && pointer.x < zones.mainXMax && pointer.y >= zones.zoneYMin && pointer.y <= zones.zoneYMax) {
        if (!this.canAcceptGameplayPointer(pointer.id) || this.joystickMain) return;
        this.registerGameplayPointer(pointer.id);
        this.joystickMain = {
          pointerId: pointer.id,
          startX: pointer.x,
          startY: pointer.y,
          currentPointerX: pointer.x,
          currentPointerY: pointer.y,
          fireTimer: NORMAL_FIRE_RATE,
          beamImmediatePending: true,
        };
        return;
      }

      if (pointer.x >= zones.rightXMin && pointer.y >= zones.zoneYMin && pointer.y <= zones.zoneYMax && !this.rightTowerInput) {
        if (!this.isRightUltimateReady() || !this.canAcceptGameplayPointer(pointer.id)) return;
        this.registerGameplayPointer(pointer.id);
        this.rightTowerInput = {
          pointerId: pointer.id,
          startX: pointer.x,
          startY: pointer.y,
          currentX: pointer.x,
          currentY: pointer.y,
          holdMs: 0,
        };
      }
    });

    this.input.on('pointerup', (pointer) => {
      this.releaseGameplayPointer(pointer, false);
    });

      // Pointer move updates active gestures.
    this.input.on('pointermove', (pointer) => {
      if (!this.gameStarted) return;
      const isRightTowerPointer = !!(this.rightTowerInput && this.rightTowerInput.pointerId === pointer.id);
      if (!this.isRegisteredGameplayPointer(pointer.id) && !isRightTowerPointer) return;
      if (this.joystickMain && this.joystickMain.pointerId === pointer.id) {
        this.joystickMain.currentPointerX = pointer.x;
        this.joystickMain.currentPointerY = pointer.y;
        return;
      }
      if (this.rightTowerInput && this.rightTowerInput.pointerId === pointer.id) {
        this.rightTowerInput.currentX = pointer.x;
        this.rightTowerInput.currentY = pointer.y;
        const moveDist = Math.hypot(
          pointer.x - this.rightTowerInput.startX,
          pointer.y - this.rightTowerInput.startY,
        );
        if (moveDist > RIGHT_TOWER_TAP_MOVE_THRESHOLD) {
          this.cancelRightUltimateHold('moved');
        }
      }
    });

    this.input.on('pointercancel', (pointer) => {
      this.releaseGameplayPointer(pointer, true);
    });
  }

  getTouchZoneBounds() {
    const jsCfg = window.DEBUG_JOYSTICK || {};
    const leftXMax = (jsCfg.leftXMax ?? JOYSTICK_LEFT_X_MAX) * WIDTH;
    const mainXMin = (jsCfg.mainXMin ?? JOYSTICK_MAIN_X_MIN) * WIDTH;
    const rightXMin = (jsCfg.rightXMin ?? JOYSTICK_RIGHT_X_MIN ?? JOYSTICK_MAIN_X_MAX) * WIDTH;
    const mainXMax = (jsCfg.mainXMax ?? jsCfg.rightXMin ?? JOYSTICK_MAIN_X_MAX ?? JOYSTICK_RIGHT_X_MIN) * WIDTH;
    const zoneYMin = (jsCfg.zoneYMin ?? JOYSTICK_ZONE_Y_MIN) * HEIGHT;
    const zoneYMax = (jsCfg.zoneYMax ?? JOYSTICK_ZONE_Y_MAX) * HEIGHT;
    return {
      leftXMax,
      mainXMin,
      mainXMax,
      rightXMin,
      zoneYMin,
      zoneYMax,
    };
  }

  canAcceptGameplayPointer(pointerId) {
    return this.activeGameplayPointerIds.has(pointerId) || this.activeGameplayPointerIds.size < this.maxGameplayPointers;
  }

  isRegisteredGameplayPointer(pointerId) {
    return this.activeGameplayPointerIds.has(pointerId);
  }

  registerGameplayPointer(pointerId) {
    this.activeGameplayPointerIds.add(pointerId);
  }

  unregisterGameplayPointer(pointerId) {
    this.activeGameplayPointerIds.delete(pointerId);
  }

  releaseGameplayPointer(pointer, isCancel) {
    const pointerId = pointer.id;
    let handled = false;

    if (this.rightTowerInput && this.rightTowerInput.pointerId === pointerId) {
      this.lastRightTowerInput = {
        state: isCancel ? 'cancelled' : 'released',
        holdMs: this.rightTowerInput.holdMs || 0,
      };
      this.rightUltHoldMs = 0;
      this.rightTowerInput = null;
      handled = true;
    }

    if (!this.gameStarted) return;

    if (this.joystickMain && this.joystickMain.pointerId === pointerId) {
      this.joystickMain = null;
      handled = true;
    }

    if (handled || this.isRegisteredGameplayPointer(pointerId)) {
      this.unregisterGameplayPointer(pointerId);
    }
  }

  addRightUltCharge(amount) {
    if (amount <= 0) return;
    const maxCharge = this.rightUltChargeMax || RIGHT_ULT_CHARGE_MAX;
    this.rightUltCharge = Phaser.Math.Clamp(this.rightUltCharge + amount, 0, maxCharge);
    this.rightUltReady = this.rightUltCharge >= maxCharge;
    if (!this.rightUltReady) {
      this.rightUltHoldMs = 0;
    }
  }

  isRightUltimateReady() {
    return !!this.rightUltReady && this.rightUltCharge >= (this.rightUltChargeMax || RIGHT_ULT_CHARGE_MAX);
  }

  cancelRightUltimateHold(state = 'idle') {
    if (this.rightTowerInput) {
      this.lastRightTowerInput = {
        state,
        holdMs: this.rightTowerInput.holdMs || 0,
      };
    }
    this.rightUltHoldMs = 0;
    if (this.rightTowerInput) {
      this.rightTowerInput.holdMs = 0;
    }
  }

  consumeRightUltimate() {
    this.rightUltCharge = 0;
    this.rightUltReady = false;
    this.rightUltHoldMs = 0;
  }

  resetEnemyAfterRepulse(enemy) {
    enemy.attackTimer = 0;
    enemy.defenseState = 'advancing';
    enemy.inZone = false;
    enemy.hitStunTimer = 0;
    enemy.hopVisualOffsetY = 0;
    enemy.hopScaleX = 1;
    enemy.hopScaleY = 1;

    const mv = enemy.type?.movement;
    if (mv?.movementType === 'hop') {
      enemy.hopState = 'CHARGING';
      enemy.hopTimer = 0;
      enemy.hopStartX = enemy.x;
      enemy.hopStartY = enemy.y;
      enemy.hopDistance = Phaser.Math.FloatBetween(mv.hopDistanceMin, mv.hopDistanceMax);
      enemy.hopDuration = Phaser.Math.FloatBetween(mv.hopDurationMin, mv.hopDurationMax);
      enemy.hopPause = Phaser.Math.FloatBetween(mv.landingPauseMin, mv.landingPauseMax);
      enemy.hopLateralDrift = Phaser.Math.FloatBetween(mv.lateralDriftMin, mv.lateralDriftMax);
    } else if (mv?.movementType === 'roll') {
      enemy.rollState = 'PAUSING';
      enemy.rollTimer = 0;
      enemy.rollPause = Phaser.Math.FloatBetween(mv.pauseMin, mv.pauseMax);
      enemy.rollStartX = enemy.x;
      enemy.rollStartY = enemy.y;
      enemy.rollTargetX = enemy.x;
      enemy.rollTargetY = enemy.y;
      enemy.rollVisualRotation = 0;
    } else {
      enemy.baseX = enemy.x;
    }
  }

  applyRightUltimateRepulse() {
    const distance = HEIGHT * (this.rightUltRepulseDistanceRatio || RIGHT_ULT_REPULSE_DISTANCE_RATIO);
    const tweenMs = 250;
    for (const enemy of this.enemies) {
      if (!enemy || enemy.isDead) continue;
      this.resetEnemyAfterRepulse(enemy);
      const targetY = Phaser.Math.Clamp(enemy.y - distance, -20, DEFENSE_LINE_Y);
      enemy.startRepulseTween(targetY, tweenMs);
    }
  }

  applyRightUltimateFreeze() {
    const durationMs = this.rightUltFrozenMs || RIGHT_ULT_FROZEN_MS;
    for (const enemy of this.enemies) {
      if (!enemy || enemy.isDead) continue;
      enemy.applyFreeze(durationMs);
    }
  }

  castRightUltimate() {
    if (!this.isRightUltimateReady()) return false;
    if (this.rightUltType === 'freeze') {
      this.applyRightUltimateFreeze();
    } else {
      this.applyRightUltimateRepulse();
    }
    this.lastRightTowerInput = {
      state: `cast ${this.rightUltType}`,
      holdMs: this.rightUltHoldRequiredMs || RIGHT_ULT_HOLD_REQUIRED_MS,
    };
    if (this.rightTowerInput) {
      const pointerId = this.rightTowerInput.pointerId;
      this.rightTowerInput = null;
      this.unregisterGameplayPointer(pointerId);
    }
    this.consumeRightUltimate();
    return true;
  }

  updateRightUltimateHold(delta) {
    if (!this.rightTowerInput) {
      this.rightUltHoldMs = 0;
      return;
    }
    if (!this.isRightUltimateReady()) {
      this.cancelRightUltimateHold('not ready');
      return;
    }
    const nextHoldMs = Phaser.Math.Clamp(
      (this.rightTowerInput.holdMs || 0) + delta,
      0,
      this.rightUltHoldRequiredMs || RIGHT_ULT_HOLD_REQUIRED_MS,
    );
    this.rightTowerInput.holdMs = nextHoldMs;
    this.rightUltHoldMs = nextHoldMs;
    if (nextHoldMs >= (this.rightUltHoldRequiredMs || RIGHT_ULT_HOLD_REQUIRED_MS)) {
      this.castRightUltimate();
    }
  }

    showCardPicker() {
      this.isCardPicking = true;
      this.cardPickerReady = false;
      this.time.delayedCall(500, () => { this.cardPickerReady = true; });
      initCardDraftState(this);

      const resolveCardLabel = (card) => {
        if (card.labelKey) {
          const vars = getCardTextVars(card, this);
          return getUiTextFormat(card.labelKey, vars);
        }
        return card.label ?? card.id;
      };

      const resolveCardDesc = (card) => {
        if (card.descKey) {
          const vars = getCardTextVars(card, this);
          return getUiTextFormat(card.descKey, vars);
        }
        return card.desc ?? '';
      };

      const resolveCardCategory = (card) => {
        const categoryKey = getCardDisplayCategoryKey(card);
        return getUiText(`card_categories.${categoryKey}`);
      };

      const fitTextureInBox = (textureKey, maxW, maxH) => {
        const frame = this.textures.getFrame(textureKey);
        const sourceW = Math.max(1, frame?.cutWidth || frame?.width || maxW);
        const sourceH = Math.max(1, frame?.cutHeight || frame?.height || maxH);
        const scale = Math.min(maxW / sourceW, maxH / sourceH);
        return {
          displayWidth: Math.max(1, Math.floor(sourceW * scale)),
          displayHeight: Math.max(1, Math.floor(sourceH * scale)),
        };
      };

      const truncateCardDesc = (text, maxChars) => {
        const clean = String(text || '').replace(/\s+/g, ' ').trim();
        if (clean.length <= maxChars) return clean;
        return `${clean.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
      };

      const choices = buildCardDraftChoices(this, 3);
      this.cardDraftCount += 1;
      if (choices.length === 0) {
        this.isCardPicking = false;
        return;
      }

      const hasAnyCardImage = choices.some((card) => !!(card.cardImageKey && this.textures.exists(card.cardImageKey)));

      const els = [];

      // Card picker overlay.
      const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.72).setDepth(200).setInteractive();
      els.push(overlay);

      // Card picker area = top third of the screen.
      const areaTop = 0;
      const areaBottom = HEIGHT / 3;
      const areaMidY = (areaTop + areaBottom) / 2;

      // Title.
      const title = this.add.text(WIDTH / 2, areaTop + 28, getUiText('card_picker.title'), {
        fontFamily: 'Arial', fontSize: '26px', color: '#ffe066',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(201);
      els.push(title);

      // Card layout.
      const imageCardGap = 14;
      const cardW = hasAnyCardImage
        ? Math.min(124, Math.floor((WIDTH - 32 - (imageCardGap * 2)) / 3))
        : 100;
      const cardH = hasAnyCardImage ? Math.min(292, Math.floor(HEIGHT * 0.34)) : 160;
      const totalCards = choices.length;
      const totalWidth = totalCards * cardW + (totalCards - 1) * (hasAnyCardImage ? imageCardGap : 20);
      const startX = WIDTH / 2 - totalWidth / 2 + cardW / 2;
      const cardY = hasAnyCardImage ? 176 : (areaMidY + 18); // Image cards sit lower so text has room below the artwork.
      choices.forEach((card, i) => {
        const cx = startX + i * (cardW + (hasAnyCardImage ? imageCardGap : 20));
        const rarity = card.rarity || 'common';
        const colors = CARD_RARITY_COLORS[rarity] || CARD_RARITY_COLORS.common;
        const label = resolveCardLabel(card);
        const desc = resolveCardDesc(card);
        const category = resolveCardCategory(card);
        const hasCardImage = !!(card.cardImageKey && this.textures.exists(card.cardImageKey));
        const cardTop = cardY - cardH / 2;

        const bg = this.add.rectangle(cx, cardY, cardW, cardH, hasCardImage ? 0x000000 : colors.bg, hasCardImage ? 0.001 : 1)
          .setDepth(201)
          .setInteractive({ useHandCursor: true });

        let imageEl = null;
        let artGlow = null;
        let labelText = null;
        let descText = null;
        let categoryText = null;
        let rarityText = null;

        if (hasCardImage) {
          const imageAreaW = cardW - 8;
          const imageAreaH = Math.floor(cardH * 0.62);
          const imageAreaY = cardTop + 10 + (imageAreaH / 2);
          const fit = fitTextureInBox(card.cardImageKey, imageAreaW, imageAreaH);
          artGlow = this.add.rectangle(cx, imageAreaY, imageAreaW + 8, imageAreaH + 8, 0xffffff, 0.035)
            .setDepth(201);
          imageEl = this.add.image(cx, imageAreaY, card.cardImageKey)
            .setDepth(202)
            .setDisplaySize(fit.displayWidth, fit.displayHeight);

          const textTop = cardTop + imageAreaH + 18;
          labelText = this.add.text(cx, textTop, label, {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '16px', color: colors.title,
            wordWrap: { width: cardW - 12 }, align: 'center',
          }).setOrigin(0.5).setDepth(202);

          categoryText = this.add.text(cx, textTop + 20, category, {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '9px', color: '#d8e8f0',
            alpha: 0.9,
            wordWrap: { width: cardW - 12 }, align: 'center',
          }).setOrigin(0.5).setDepth(202);

          descText = this.add.text(cx, textTop + 45, truncateCardDesc(desc, Math.max(40, Math.floor(cardW * 0.5))), {
            fontFamily: 'Arial', fontSize: '10px', color: '#aac8e0',
            wordWrap: { width: cardW - 12 }, align: 'center',
          }).setOrigin(0.5, 0).setDepth(202);

          rarityText = this.add.text(cx, cardTop + cardH - 5, rarity.toUpperCase(), {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '9px', color: colors.title,
            alpha: 0.75,
          }).setOrigin(0.5).setDepth(202);
        } else {
          bg.setStrokeStyle(2, colors.stroke);

          labelText = this.add.text(cx, cardY - cardH / 2 + 26, label, {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '15px', color: colors.title,
            wordWrap: { width: cardW - 12 }, align: 'center',
          }).setOrigin(0.5).setDepth(202);

          descText = this.add.text(cx, cardY - cardH / 2 + 58, desc, {
            fontFamily: 'Arial', fontSize: '12px', color: '#aac8e0',
            wordWrap: { width: cardW - 12 }, align: 'center',
          }).setOrigin(0.5, 0).setDepth(202);

          categoryText = this.add.text(cx, cardY + cardH / 2 - 30, category, {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: '#d8e8f0',
            alpha: 0.9,
            wordWrap: { width: cardW - 10 }, align: 'center',
          }).setOrigin(0.5).setDepth(202);

          rarityText = this.add.text(cx, cardY + cardH / 2 - 14, rarity.toUpperCase(), {
            fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: colors.title,
            alpha: 0.75,
          }).setOrigin(0.5).setDepth(202);
        }

        bg.on('pointerover', () => {
          if (hasCardImage) {
            if (artGlow) artGlow.setAlpha(0.08);
            bg.setAlpha(0.01);
          } else {
            bg.setFillStyle(colors.bgHover);
          }
        });
        bg.on('pointerout', () => {
          if (hasCardImage) {
            if (artGlow) artGlow.setAlpha(0.035);
            bg.setAlpha(0.001);
          } else {
            bg.setFillStyle(colors.bg);
          }
        });
        bg.on('pointerup', () => {
          if (!this.cardPickerReady) return;
          applyCardSelection(this, card);
          this.dismissCardPicker();
        });

        els.push(bg);
        if (artGlow) els.push(artGlow);
        if (imageEl) els.push(imageEl);
        els.push(labelText, descText, categoryText, rarityText);
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
      applyCardSelection(this, card);
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
      const healAmount = DEFENSE_LAYOUT_CONFIG.crystalHealPerLevelClear ?? 0;
      if (healAmount > 0 && this.crystalHp < this.crystalMaxHp) {
        this.crystalHp = Math.min(this.crystalHp + healAmount, this.crystalMaxHp);
      }
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

    spawnWeaponProjectiles(startX, startY, directionX, directionY, gestureSpeed, isPerfectRelease, slot = 'center') {
      // Legacy slot name mapping at the input boundary.
      if (slot === 'main') slot = 'center';
      if (slot === 'sub')  slot = 'left';

      const typeConfig = this.getCurrentTowerWeaponConfig(slot);
      if (!typeConfig) return;

      const baseSpeed = Phaser.Math.Clamp(
        gestureSpeed * SPEED_MULTIPLIER * typeConfig.speedMultiplier,
        MIN_HORIZONTAL_SPEED,
        MAX_HORIZONTAL_SPEED,
      );

      // Cooldown check for weapons that carry one.
      if (typeConfig.cooldownSeconds != null) {
        const cd = this.skillCooldowns[slot];
        if (!cd || cd.current > 0) {
          this.lastFiredWeaponType = slot;
          this.lastSpawnedProjectileCount = 0;
          return;
        }
        const cooldownBonus = slot === 'left' ? this.subCooldownBonus : 0;
        const effectiveCooldown = typeConfig.cooldownSeconds / (1 + cooldownBonus);
        cd.current = cd.max = effectiveCooldown;
      }

      this.playSfx(typeConfig.mode === 'arcing_projectile' ? 'shoot_bomb' : 'shoot');

      const slotMeta = { slot, typeId: this.selectedTowerWeaponTypes[slot] };

      // Arcing projectile (left tower bomb).
      if (typeConfig.mode === 'arcing_projectile') {
        const projectile = new Projectile(this, startX, startY, directionX, directionY, baseSpeed, typeConfig, slotMeta);
        projectile.perfect = isPerfectRelease;
        this.projectiles.push(projectile);
        this.lastFiredWeaponType = slot;
        this.lastSpawnedProjectileCount = 1;
        return;
      }

      if (slot === 'center' && typeConfig.mode === 'beam' && PIERCE_BEAM_CONFIG.enabled) {
        this.firePierceBeam(startX, startY, directionX, directionY, typeConfig, slotMeta, isPerfectRelease);
        return;
      }

      // Straight projectile (center tower standard/wide/pierce).
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

      const directions = [];
      const isShotgunMain = slot === 'center'
        && this.selectedTowerWeaponTypes.center === 'wide'
        && (this.mainShotgunLevel || 0) > 0;

      if (isShotgunMain) {
        const pelletCount = 2 + (this.mainShotgunLevel || 0);
        const spreadRad = Phaser.Math.DegToRad(14 + (this.mainShotgunLevel || 0) * 2);
        const baseAngle = Math.atan2(directionY, directionX);
        for (let i = 0; i < pelletCount; i += 1) {
          const t = pelletCount === 1 ? 0.5 : i / (pelletCount - 1);
          const angle = baseAngle - spreadRad + spreadRad * 2 * t;
          directions.push({ dx: Math.cos(angle), dy: Math.sin(angle) });
        }
      } else {
        directions.push({ dx: directionX, dy: directionY });
      }

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
        const projectile = new Projectile(this, startX, startY, dx, dy, baseSpeed, typeConfig, slotMeta);
        projectile.isPowerShot = isPowerShot;
        projectile.damageMultiplier = damageMultiplier * typeConfig.damageMultiplier * (isShotgunMain ? 0.8 : 1);
        projectile.mainHitRadius = typeConfig.hitRadius * typeConfig.hitRadiusMultiplier;
        projectile.radius = typeConfig.projectileRadius * typeConfig.projectileRadiusMultiplier;
        projectile.pierceRemaining = typeConfig.pierceCount + (slot === 'center' ? (this.mainPierceBonus || 0) : 0);
        projectile.shotgunCloseBonus = isShotgunMain ? (this.mainShotgunCloseBonus || 0) : 0;
        projectile.hitEnemySet = new Set();
        this.projectiles.push(projectile);
      }
      this.lastFiredWeaponType = slot;
      this.lastSpawnedProjectileCount = directions.length;
    }

    getMainWeaponMuzzlePosition() {
      const sprite = this.moduleSprites?.turretm;
      const fallbackX = JOYSTICK_MAIN_LAUNCH_X * WIDTH;
      const fallbackY = JOYSTICK_MAIN_LAUNCH_Y * HEIGHT;
      return {
        x: (sprite?.x ?? fallbackX) + (PIERCE_BEAM_CONFIG.muzzleOffsetX ?? 0),
        y: (sprite?.y ?? fallbackY) + (PIERCE_BEAM_CONFIG.muzzleOffsetY ?? 0),
      };
    }

    getMainWeaponFireInterval() {
      const typeConfig = this.getCurrentMainWeaponConfig();
      const baseInterval = (typeConfig?.mode === 'beam' && PIERCE_BEAM_CONFIG.enabled)
        ? (PIERCE_BEAM_CONFIG.fireIntervalSeconds ?? NORMAL_FIRE_RATE)
        : NORMAL_FIRE_RATE;
      return baseInterval / (1 + this.mainFireRateBonus);
    }

    getLeftTowerPosition() {
      return {
        x: (window.DEBUG_JOYSTICK?.leftTowerX ?? JOYSTICK_LEFT_LAUNCH_X) * WIDTH,
        y: (window.DEBUG_JOYSTICK?.leftTowerY ?? JOYSTICK_LEFT_LAUNCH_Y) * HEIGHT,
      };
    }

    selectLeftAutoTarget(weaponConfig) {
      const clusterRadius = weaponConfig?.autoClusterRadius ?? weaponConfig?.landingExplosionRadius ?? LANDING_HIT_RADIUS;
      const minClusterSize = Math.max(1, weaponConfig?.autoMinClusterSize ?? 1);
      const towerPos = this.getLeftTowerPosition();
      const candidates = this.enemies.filter((enemy) => {
        if (!enemy || enemy.isDead) return false;
        const bounds = battlefieldBoundsAtY(enemy.y);
        return enemy.x >= bounds.left && enemy.x <= bounds.right
          && enemy.y >= FAR_BATTLEFIELD_Y && enemy.y <= DEFENSE_LINE_Y;
      });
      if (candidates.length === 0) return null;

      let bestTarget = null;
      for (const seed of candidates) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const enemy of candidates) {
          if (Phaser.Math.Distance.Between(seed.x, seed.y, enemy.x, enemy.y) <= clusterRadius) {
            sumX += enemy.x;
            sumY += enemy.y;
            count += 1;
          }
        }
        if (count < minClusterSize && candidates.length > 1) continue;
        const targetX = sumX / count;
        const targetY = sumY / count;
        const towerDistance = Phaser.Math.Distance.Between(towerPos.x, towerPos.y, targetX, targetY);
        if (!bestTarget
          || towerDistance < bestTarget.towerDistance
          || (Math.abs(towerDistance - bestTarget.towerDistance) < 0.0001 && count > bestTarget.count)
          || (count === bestTarget.count && Math.abs(towerDistance - bestTarget.towerDistance) < 0.0001 && targetY > bestTarget.y)) {
          bestTarget = {
            x: targetX,
            y: targetY,
            count,
            towerDistance,
          };
        }
      }

      if (!bestTarget) {
        const nearestEnemy = candidates.reduce((best, enemy) => {
          const towerDistance = Phaser.Math.Distance.Between(towerPos.x, towerPos.y, enemy.x, enemy.y);
          if (!best || towerDistance < best.towerDistance) {
            return { x: enemy.x, y: enemy.y, towerDistance };
          }
          return best;
        }, null);
        return nearestEnemy ? { x: nearestEnemy.x, y: nearestEnemy.y } : null;
      }

      const bounds = battlefieldBoundsAtY(bestTarget.y);
      return {
        x: Phaser.Math.Clamp(bestTarget.x, bounds.left, bounds.right),
        y: Phaser.Math.Clamp(bestTarget.y, FAR_BATTLEFIELD_Y, DEFENSE_LINE_Y),
      };
    }

    fireLeftTowerAutoBomb(targetX, targetY) {
      const leftConfig = this.getCurrentTowerWeaponConfig('left');
      if (!leftConfig || leftConfig.mode !== 'arcing_projectile') return false;

      const launchPos = this.getLeftTowerPosition();
      const dx = targetX - launchPos.x;
      const dy = targetY - launchPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0.0001) return false;

      const dirX = dx / dist;
      const dirY = dy / dist;
      const flightTime = (2 * leftConfig.arcMinUpwardSpeed) / leftConfig.arcGravity;
      const gestureSpeed = Phaser.Math.Clamp(
        dist / (flightTime * HORIZONTAL_SPEED_MULTIPLIER),
        MIN_HORIZONTAL_SPEED,
        MAX_HORIZONTAL_SPEED,
      );

      this.spawnWeaponProjectiles(launchPos.x, launchPos.y, dirX, dirY, gestureSpeed, false, 'left');
      const lastProj = this.projectiles[this.projectiles.length - 1];
      if (!lastProj || lastProj.weapon?.mode !== 'arcing_projectile') {
        return false;
      }

      lastProj.forcedLandX = targetX;
      lastProj.forcedLandY = targetY;
      lastProj.forcedStartX = launchPos.x;
      lastProj.forcedStartY = launchPos.y;
      lastProj.forcedFlightTime = Phaser.Math.Clamp(dist / 400, 0.4, 1.8);
      lastProj.forcedArcHeight = Math.min(dist * 0.3, 150);
      lastProj.flightTimer = 0;
      return true;
    }

    updateLeftAutoFire() {
      if (!LEFT_TOWER_AUTO_FIRE_ENABLED) return;
      const leftConfig = this.getCurrentTowerWeaponConfig('left');
      if (!leftConfig || leftConfig.mode !== 'arcing_projectile') return;
      const cooldown = this.skillCooldowns?.left;
      if (cooldown && cooldown.current > 0) return;

      const target = this.selectLeftAutoTarget(leftConfig);
      if (!target) return;
      this.fireLeftTowerAutoBomb(target.x, target.y);
    }

    getSatelliteBeamOrigin() {
      const base = this.getMainWeaponMuzzlePosition();
      return {
        x: base.x + (SATELLITE_BEAM_CONFIG.originOffsetX ?? 0),
        y: base.y + (SATELLITE_BEAM_CONFIG.originOffsetY ?? 0),
      };
    }

    isContinuousBeamSelected() {
      return this.selectedBeamForm === 'continuous' || (this.continuousBeamLevel || 0) > 0;
    }

    firePierceBeam(startX, startY, directionX, directionY, typeConfig, slotMeta, isPerfectRelease = false) {
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

      const fireSinglePierceBeam = (beamDirectionX, beamDirectionY, beamDamageMultiplier = 1) => {
        const beamCfg = PIERCE_BEAM_CONFIG;
        const range = beamCfg.range + (beamCfg.endPadding ?? 0);
        const startPad = beamCfg.startPadding ?? 0;
        const beamStartX = startX + beamDirectionX * startPad;
        const beamStartY = startY + beamDirectionY * startPad;
        const queryEndX = beamStartX + beamDirectionX * range;
        const queryEndY = beamStartY + beamDirectionY * range;
        const maxTargets = Math.max(1, (beamCfg.maxTargets ?? typeConfig.pierceCount ?? 1) + (this.mainPierceBonus || 0));

        const targets = [];
        for (let i = 0; i < this.enemies.length; i += 1) {
          const enemy = this.enemies[i];
          if (!enemy || enemy.isDead) continue;
          const along = ((enemy.x - beamStartX) * beamDirectionX) + ((enemy.y - beamStartY) * beamDirectionY);
          if (along < 0) continue;
          const hitRadius = (beamCfg.hitWidth ?? 0) + enemy.displayedRadius();
          const distToLine = distancePointToSegment(enemy.x, enemy.y, beamStartX, beamStartY, queryEndX, queryEndY);
          if (along > range + enemy.displayedRadius()) continue;
          if (distToLine > hitRadius) continue;
          targets.push({ enemyIndex: i, enemy, along });
        }

        targets.sort((a, b) => a.along - b.along);

        let hitCount = 0;
        let lastHitAlong = null;
        for (let hitIndex = 0; hitIndex < targets.length && hitCount < maxTargets; hitIndex += 1) {
          const { enemyIndex, enemy, along } = targets[hitIndex];
          const falloffBase = beamCfg.damageFalloffPerTarget ?? typeConfig.pierceDamageFalloff ?? 1;
          const falloff = Math.pow(falloffBase, hitIndex);
          const hitDamage = typeConfig.damage
            * (1 + this.getSlotDamageBonus(slotMeta.slot))
            * (typeConfig.damageMultiplier ?? 1)
            * (beamCfg.damageMultiplier ?? 1)
            * damageMultiplier
            * beamDamageMultiplier
            * falloff;
          const killed = this.applyDamageToEnemy(enemyIndex, hitDamage, isPerfectRelease);
          if (!killed && this.mainKnockbackLevel > 0) {
            this.applyMainKnockback(enemy);
          }
          if (beamCfg.impactFxEnabled) {
            this.beamImpactEffects.push({
              x: enemy.x,
              y: enemy.y,
              timer: 0,
              duration: (beamCfg.impactFxDurationMs ?? 100) / 1000,
              radius: beamCfg.impactFxRadius ?? 12,
            });
          }
          hitCount += 1;
          lastHitAlong = along;
        }

        let visualEndDistance = range;
        if (beamCfg.stopOnHit && lastHitAlong != null) {
          visualEndDistance = Math.min(range, lastHitAlong + (beamCfg.hitStopPadding ?? 0));
        }
        const beamEndX = beamStartX + beamDirectionX * visualEndDistance;
        const beamEndY = beamStartY + beamDirectionY * visualEndDistance;

        this.beamEffects.push({
          x1: beamStartX,
          y1: beamStartY,
          x2: beamEndX,
          y2: beamEndY,
          timer: 0,
          duration: (beamCfg.durationMs ?? 70) / 1000,
          fadeDuration: (beamCfg.fadeMs ?? 90) / 1000,
          coreColor: beamCfg.coreColor,
          glowColor: beamCfg.glowColor,
          coreAlpha: beamCfg.coreAlpha,
          glowAlpha: beamCfg.glowAlpha,
          coreWidth: beamCfg.coreWidth,
          glowWidth: beamCfg.glowWidth,
          isPowerShot,
        });

        if ((beamCfg.screenShake ?? 0) > 0 && this.cameras?.main) {
          this.cameras.main.shake(beamCfg.screenShake, 0.0025);
        }

        return hitCount;
      };

      let totalHitCount = fireSinglePierceBeam(directionX, directionY);

      const twinBeamActive = slotMeta.slot === 'center'
        && (this.selectedBeamForm === 'twin' || (this.twinBeamLevel || 0) > 0);
      if (twinBeamActive) {
        const secondaryDirection = rotateVector(directionX, directionY, PIERCE_BEAM_CONFIG.angleOffsetDeg ?? 7);
        totalHitCount += fireSinglePierceBeam(
          secondaryDirection.x,
          secondaryDirection.y,
          PIERCE_BEAM_CONFIG.secondaryDamageMultiplier ?? 0.5,
        );
      }

      if (totalHitCount === 0) {
        this.comboCount = 0;
        this.addHitGaugePenalty();
      }

      this.lastFiredWeaponType = slotMeta.slot;
      this.lastSpawnedProjectileCount = twinBeamActive ? 2 : 1;
    }

    selectSatelliteBeamTarget() {
      const crystalZone = this.getCrystalDefenseZone();
      const candidates = this.enemies.filter((enemy) => !enemy?.isDead);
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => {
        if (a.inZone !== b.inZone) {
          return a.inZone ? -1 : 1;
        }
        const distA = crystalZone.normalizedDistance(a.x, a.y, a.displayedRadius());
        const distB = crystalZone.normalizedDistance(b.x, b.y, b.displayedRadius());
        if (Math.abs(distA - distB) > 0.0001) {
          return distA - distB;
        }
        return b.y - a.y;
      });
      return candidates[0] || null;
    }

    updateSatelliteBeam(dt) {
      if (!SATELLITE_BEAM_CONFIG.enabled) return;
      if (this.selectedBeamForm !== 'satellite' && (this.satelliteBeamLevel || 0) <= 0) return;
      if (!this.joystickMain) {
        this.satelliteBeamTimer = 0;
        return;
      }

      const mainWeaponConfig = this.getCurrentMainWeaponConfig();
      if (!mainWeaponConfig || mainWeaponConfig.mode !== 'beam' || !PIERCE_BEAM_CONFIG.enabled) return;

      this.satelliteBeamTimer += dt;
      const interval = SATELLITE_BEAM_CONFIG.fireIntervalSeconds ?? 0.95;
      if (this.satelliteBeamTimer < interval) return;
      this.satelliteBeamTimer -= interval;

      const target = this.selectSatelliteBeamTarget();
      if (!target) return;

      const origin = this.getSatelliteBeamOrigin();
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0.0001) return;

      const enemyIndex = this.enemies.indexOf(target);
      if (enemyIndex < 0) return;

      const hitDamage = mainWeaponConfig.damage
        * (1 + this.getSlotDamageBonus('center'))
        * (mainWeaponConfig.damageMultiplier ?? 1)
        * (PIERCE_BEAM_CONFIG.damageMultiplier ?? 1)
        * (SATELLITE_BEAM_CONFIG.damageMultiplier ?? 0.35);

      this.applyDamageToEnemy(enemyIndex, hitDamage, false);

      this.beamEffects.push({
        x1: origin.x,
        y1: origin.y,
        x2: target.x,
        y2: target.y,
        timer: 0,
        duration: (SATELLITE_BEAM_CONFIG.visualDurationMs ?? 65) / 1000,
        fadeDuration: (SATELLITE_BEAM_CONFIG.fadeMs ?? 85) / 1000,
        coreColor: SATELLITE_BEAM_CONFIG.coreColor ?? PIERCE_BEAM_CONFIG.coreColor,
        glowColor: SATELLITE_BEAM_CONFIG.glowColor ?? PIERCE_BEAM_CONFIG.glowColor,
        coreAlpha: SATELLITE_BEAM_CONFIG.coreAlpha ?? 0.9,
        glowAlpha: SATELLITE_BEAM_CONFIG.glowAlpha ?? 0.28,
        coreWidth: SATELLITE_BEAM_CONFIG.coreWidth ?? 2,
        glowWidth: SATELLITE_BEAM_CONFIG.glowWidth ?? 8,
        isPowerShot: false,
      });

      if (SATELLITE_BEAM_CONFIG.impactFxEnabled) {
        this.beamImpactEffects.push({
          x: target.x,
          y: target.y,
          timer: 0,
          duration: (SATELLITE_BEAM_CONFIG.impactFxDurationMs ?? 90) / 1000,
          radius: SATELLITE_BEAM_CONFIG.impactFxRadius ?? 9,
        });
      }
    }

    updateContinuousBeam(dt) {
      if (!CONTINUOUS_BEAM_CONFIG.enabled) return false;

      const fireWindowSeconds = CONTINUOUS_BEAM_CONFIG.fireWindowSeconds ?? 3;
      const cooldownSeconds = CONTINUOUS_BEAM_CONFIG.cooldownSeconds ?? 1;
      if (this.continuousBeamFireWindowRemaining == null) {
        this.continuousBeamFireWindowRemaining = fireWindowSeconds;
      }
      if (this.continuousBeamCooldownRemaining == null) {
        this.continuousBeamCooldownRemaining = 0;
      }

      if (this.continuousBeamCooldownRemaining > 0) {
        this.continuousBeamCooldownRemaining = Math.max(0, this.continuousBeamCooldownRemaining - dt);
        if (this.continuousBeamCooldownRemaining <= 0 && this.continuousBeamFireWindowRemaining <= 0) {
          this.continuousBeamFireWindowRemaining = fireWindowSeconds;
        }
      }

      const hasContinuousSelected = this.isContinuousBeamSelected();
      const mainWeaponConfig = this.getCurrentMainWeaponConfig();
      const hasBeamMain = !!(mainWeaponConfig && mainWeaponConfig.mode === 'beam' && PIERCE_BEAM_CONFIG.enabled);
      const canUseContinuousBeam = hasContinuousSelected && hasBeamMain;
      const js = this.joystickMain;

      if (!canUseContinuousBeam || !js || this.continuousBeamCooldownRemaining > 0 || this.continuousBeamFireWindowRemaining <= 0) {
        this.continuousBeamTickTimer = 0;
        return false;
      }

      const startX = js.startX;
      const startY = js.startY;
      const dx = js.currentPointerX - startX;
      const dy = js.currentPointerY - startY;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0.0001) {
        this.continuousBeamTickTimer = 0;
        return false;
      }

      const dirX = dx / dist;
      const dirY = dy / dist;
      const beamRange = PIERCE_BEAM_CONFIG.range + (PIERCE_BEAM_CONFIG.endPadding ?? 0);
      const startPad = PIERCE_BEAM_CONFIG.startPadding ?? 0;
      const beamStartX = startX + dirX * startPad;
      const beamStartY = startY + dirY * startPad;
      const hitWidth = (PIERCE_BEAM_CONFIG.hitWidth ?? 14) * (CONTINUOUS_BEAM_CONFIG.beamWidthMultiplier ?? 1.15);
      const findClosestTargetOnLine = () => {
        let closestTarget = null;
        for (let i = 0; i < this.enemies.length; i += 1) {
          const enemy = this.enemies[i];
          if (!enemy || enemy.isDead) continue;
          const along = ((enemy.x - beamStartX) * dirX) + ((enemy.y - beamStartY) * dirY);
          if (along < 0) continue;
          if (along > beamRange + enemy.displayedRadius()) continue;
          const distToLine = distancePointToSegment(enemy.x, enemy.y, beamStartX, beamStartY, beamStartX + dirX * beamRange, beamStartY + dirY * beamRange);
          if (distToLine > hitWidth + enemy.displayedRadius()) continue;
          if (!closestTarget || along < closestTarget.along) {
            closestTarget = { enemyIndex: i, enemy, along };
          }
        }
        return closestTarget;
      };
      const closestTargetForVisual = findClosestTargetOnLine();
      let visualEndDistance = beamRange;
      if (CONTINUOUS_BEAM_CONFIG.stopOnHit && closestTargetForVisual) {
        visualEndDistance = Math.min(
          beamRange,
          closestTargetForVisual.along + (CONTINUOUS_BEAM_CONFIG.hitStopPadding ?? PIERCE_BEAM_CONFIG.hitStopPadding ?? 0),
        );
      }
      const beamEndX = beamStartX + dirX * visualEndDistance;
      const beamEndY = beamStartY + dirY * visualEndDistance;

      this.continuousBeamFireWindowRemaining = Math.max(0, this.continuousBeamFireWindowRemaining - dt);

      this.beamEffects.push({
        x1: beamStartX,
        y1: beamStartY,
        x2: beamEndX,
        y2: beamEndY,
        timer: 0,
        duration: (CONTINUOUS_BEAM_CONFIG.visualDurationMs ?? 50) / 1000,
        fadeDuration: (CONTINUOUS_BEAM_CONFIG.fadeMs ?? 55) / 1000,
        coreColor: PIERCE_BEAM_CONFIG.coreColor,
        glowColor: PIERCE_BEAM_CONFIG.glowColor,
        coreAlpha: PIERCE_BEAM_CONFIG.coreAlpha,
        glowAlpha: PIERCE_BEAM_CONFIG.glowAlpha,
        coreWidth: PIERCE_BEAM_CONFIG.coreWidth,
        glowWidth: PIERCE_BEAM_CONFIG.glowWidth,
        isPowerShot: false,
      });

      const tickRateMultiplier = Math.max(1, CONTINUOUS_BEAM_CONFIG.tickRateMultiplier ?? 10);
      const tickInterval = this.getMainWeaponFireInterval() / tickRateMultiplier;
      this.continuousBeamTickTimer += dt;

      while (this.continuousBeamTickTimer >= tickInterval) {
        this.continuousBeamTickTimer -= tickInterval;
        const closestTarget = findClosestTargetOnLine();

        if (!closestTarget) continue;

        const hitDamage = mainWeaponConfig.damage
          * (1 + this.getSlotDamageBonus('center'))
          * (mainWeaponConfig.damageMultiplier ?? 1)
          * (PIERCE_BEAM_CONFIG.damageMultiplier ?? 1)
          * (CONTINUOUS_BEAM_CONFIG.damagePerTickMultiplier ?? 0.01);
        this.applyDamageToEnemy(
          closestTarget.enemyIndex,
          hitDamage,
          false,
          CONTINUOUS_BEAM_CONFIG.hitGaugeMultiplier ?? 0.10,
        );

        if (PIERCE_BEAM_CONFIG.impactFxEnabled) {
          this.beamImpactEffects.push({
            x: closestTarget.enemy.x,
            y: closestTarget.enemy.y,
            timer: 0,
            duration: (PIERCE_BEAM_CONFIG.impactFxDurationMs ?? 100) / 1000,
            radius: PIERCE_BEAM_CONFIG.impactFxRadius ?? 12,
          });
        }
      }

      if (this.continuousBeamFireWindowRemaining <= 0) {
        this.continuousBeamFireWindowRemaining = 0;
        this.continuousBeamCooldownRemaining = Math.max(this.continuousBeamCooldownRemaining, cooldownSeconds);
        this.continuousBeamTickTimer = 0;
      }

      return true;
    }

    updateSkillCooldowns(dt) {
      for (const cd of Object.values(this.skillCooldowns)) {
        if (cd.current > 0) cd.current = Math.max(0, cd.current - dt);
      }
    }

    drawMainAim(joystick, g) {
      const launchX = joystick.startX;
      const launchY = joystick.startY;
      const dx = joystick.currentPointerX - launchX;
      const dy = joystick.currentPointerY - launchY;
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

    drawLeftAim(joystick, g) {
      const dx = joystick.currentX - joystick.startX;
      const dy = joystick.currentY - joystick.startY;
      const distance = Math.hypot(dx, dy);
      if (distance < 4) { return; }
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
      this.drawArcToTarget(launchX, launchY, targetX, targetY, this.getCurrentTowerWeaponConfig('left'), g);
    }

      // Draw the arc from start to target.
    drawArcToTarget(startX, startY, targetX, targetY, weaponConfig, g) {
      const weapon = weaponConfig;
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

    redrawAimGraphics() {
      if (!this.aimGfx) return;
      this.aimGfx.clear();
      if (this.joystickMain) {
        this.drawMainAim(this.joystickMain, this.aimGfx);
      }
      if (this.joystickLeft) {
        this.drawLeftAim(this.joystickLeft, this.aimGfx);
      }
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
          objs.cdText.setColor('#444444').setText(getUiText('hud.skill.locked'));
          objs.cdBar.setVisible(false);
          objs.cdBarBg.setVisible(false);
        } else if (isActive) {
          objs.bg.setFillStyle(0x2a3a2a, 1).setStrokeStyle(2, 0xffffff);
          objs.nameText.setColor('#ffffff');
          objs.cdText.setColor('#aaffaa').setText(getUiText('hud.skill.aiming'));
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
          objs.cdText.setColor('#aaddff').setText(getUiText('hud.skill.ready'));
          objs.cdBar.setVisible(false);
          objs.cdBarBg.setVisible(false);
        }
      }
    }

    drawAimPrediction(startX, startY, dx, dy, slot) {
      if (slot === 'main') slot = 'center';
      if (slot === 'sub')  slot = 'left';
      const g = this.aimGfx;
      g.clear();
      const weapon = this.getCurrentTowerWeaponConfig(slot) || this.getCurrentTowerWeaponConfig('center');
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
        const multiplier = 1 + comboTier * 0.1 + (this.comboEconomyLevel || 0) * 0.15;
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
      const maxHp = Math.max(1, this.crystalMaxHp || DEFENSE_LAYOUT_CONFIG.crystalMaxHp || 1);
      const hp = Phaser.Math.Clamp(this.crystalHp, 0, maxHp);
      const progress = Phaser.Math.Clamp(hp / maxHp, 0, 1);
      const x = HUD_HP_BAR_X;
      const topY = HUD_HP_BAR_Y;
      const barW = HUD_HP_BAR_WIDTH;
      const barH = HUD_HP_BAR_MAX_HEIGHT;

      // HP bar background.
      g.fillStyle(0x2a2f36, 0.85);
      g.fillRoundedRect(x, topY, barW, barH, 4);

      // Fill based on current HP.
      if (progress > 0) {
        const fillH = Math.round(barH * progress);
        const fillColor = progress <= 0.35 ? 0xff6666 : 0xdd2222;
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(x, topY + barH - fillH, barW, fillH, 4);
      }

      // Gauge border.
      g.lineStyle(1, 0xff8888, 0.5);
      g.strokeRoundedRect(x, topY, barW, barH, 4);

      // HP text.
      this.hpBarLabel.setText(`${Math.floor(hp)}/${maxHp}`);
      this.hpBarLabel.setPosition(x + barW / 2, topY + barH + 4);
    }

    drawCombo() {
      if (this.comboCount >= 3) {
        this.comboText.setText(`x${this.comboCount}`);
        this.comboText.setVisible(true);
      } else {
        this.comboText.setVisible(false);
      }
    }

    setRightUltimateHudVisible(visible) {
      this.rightUltText?.setVisible(visible);
      this.rightUltStatusText?.setVisible(visible);
      if (!visible) {
        this.rightUltHoldGfx?.clear();
      }
    }

    drawRightUltimateHud() {
      if (!this.rightUltText || !this.rightUltStatusText || !this.rightUltHoldGfx) return;
      const ready = this.isRightUltimateReady();
      const holdRequiredMs = this.rightUltHoldRequiredMs || RIGHT_ULT_HOLD_REQUIRED_MS;
      const holdRatio = Phaser.Math.Clamp((this.rightUltHoldMs || 0) / holdRequiredMs, 0, 1);
      const ultLabel = this._getLocalizedRightUltimateName
        ? this._getLocalizedRightUltimateName(this.rightUltType)
        : (RIGHT_TOWER_ULTIMATE_TYPES[this.rightUltType]?.label || this.rightUltType);

      this.rightUltText.setText(
        `${getUiText('hud.right_ult.label')} ${ultLabel}\n${this.rightUltCharge}/${this.rightUltChargeMax}`,
      );
      this.rightUltStatusText.setText(
        ready
          ? (holdRatio > 0
            ? `${getUiText('hud.right_ult.hold')} ${Math.round(holdRatio * 100)}%`
            : getUiText('hud.right_ult.hold_ready'))
          : getUiText('hud.right_ult.charging'),
      );
      this.rightUltText.setColor(ready ? '#ffdf87' : '#f0f0f0');
      this.rightUltStatusText.setColor(ready ? '#ffd36b' : '#8fb8d2');
      this.setRightUltimateHudVisible(true);

      const g = this.rightUltHoldGfx;
      g.clear();
      const towerPos = this.getRightTowerPosition();
      const radius = HUD_RIGHT_ULT_RING_RADIUS;
      g.lineStyle(2, ready ? 0xffd36b : 0x4b6277, ready ? 0.95 : 0.55);
      g.strokeCircle(towerPos.x, towerPos.y, radius);
      if (!ready) {
        const chargeRatio = Phaser.Math.Clamp(this.rightUltCharge / Math.max(1, this.rightUltChargeMax), 0, 1);
        if (chargeRatio > 0) {
          g.lineStyle(4, 0x5ad2f0, 0.75);
          g.beginPath();
          g.arc(towerPos.x, towerPos.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio, false);
          g.strokePath();
        }
        return;
      }
      if (holdRatio > 0) {
        g.lineStyle(5, 0xffa44d, 1);
        g.beginPath();
        g.arc(towerPos.x, towerPos.y, radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * holdRatio, false);
        g.strokePath();
      }
    }

    // ── Loadout menu — method bodies live in loadout_menu.js ─────────

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
      const dc = DEFENSE_LAYOUT_CONFIG;
      const radiusX = dc.crystalEllipseRadiusX ?? dc.crystalAggroRadius;
      const radiusY = dc.crystalEllipseRadiusY ?? dc.crystalAggroRadius;
      return {
        x: dc.crystalTargetX,
        y: dc.crystalTargetY,
        radius: dc.crystalAggroRadius,
        radiusX,
        radiusY,
        contains: (px, py) => {
          const nx = (px - dc.crystalTargetX) / Math.max(1, radiusX);
          const ny = (py - dc.crystalTargetY) / Math.max(1, radiusY);
          return (nx * nx) + (ny * ny) <= 1;
        },
        normalizedDistance: (px, py, padding = 0) => {
          const paddedRadiusX = Math.max(1, radiusX + padding);
          const paddedRadiusY = Math.max(1, radiusY + padding);
          const nx = (px - dc.crystalTargetX) / paddedRadiusX;
          const ny = (py - dc.crystalTargetY) / paddedRadiusY;
          return Math.sqrt((nx * nx) + (ny * ny));
        },
      };
    }

    enterEnemyTargetZone(enemy) {
      const zone = this.getCrystalDefenseZone();
      const dc = DEFENSE_LAYOUT_CONFIG;
      const rxMin = zone.radiusX * (dc.targetZoneOrbitRadiusMinFactor ?? 0.42);
      const rxMax = zone.radiusX * (dc.targetZoneOrbitRadiusMaxFactor ?? 0.86);
      const ryMin = zone.radiusY * (dc.targetZoneOrbitRadiusMinFactor ?? 0.42);
      const ryMax = zone.radiusY * (dc.targetZoneOrbitRadiusMaxFactor ?? 0.86);
      let orbitAngle = Math.atan2(
        (enemy.y - zone.y) / Math.max(1, zone.radiusY),
        (enemy.x - zone.x) / Math.max(1, zone.radiusX),
      );
      if (!Number.isFinite(orbitAngle)) {
        orbitAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      }
      enemy.defenseState = 'inTargetZone';
      enemy.attackTimer = 0;
      enemy.orbitAngle = orbitAngle;
      enemy.orbitRadiusX = Phaser.Math.FloatBetween(rxMin, rxMax);
      enemy.orbitRadiusY = Phaser.Math.FloatBetween(ryMin, ryMax);
      enemy.orbitSpeed = Phaser.Math.FloatBetween(
        dc.targetZoneOrbitSpeedMin ?? 0.55,
        dc.targetZoneOrbitSpeedMax ?? 1.0,
      );
      enemy.orbitDirection = Math.random() < 0.5 ? -1 : 1;
      enemy.x = zone.x + Math.cos(enemy.orbitAngle) * enemy.orbitRadiusX;
      enemy.y = zone.y + Math.sin(enemy.orbitAngle) * enemy.orbitRadiusY;
    }

    getEnergyZoneVisualState() {
      const baseZone = this.getCrystalDefenseZone();
      const cfg = ENERGY_ZONE_CONFIG;
      return {
        enabled: !!cfg.enabled,
        x: baseZone.x + (cfg.offsetX ?? 0),
        y: baseZone.y + (cfg.offsetY ?? 0),
        radius: cfg.radius ?? baseZone.radius,
        maxLinks: cfg.maxLinks ?? 4,
        idleAlpha: cfg.idleAlpha ?? 0.22,
        activeAlpha: cfg.activeAlpha ?? 0.38,
        lowHpThreshold: cfg.lowHpThreshold ?? 0.35,
        pulseDurationMs: cfg.pulseDurationMs ?? 1800,
        visualScaleX: cfg.visualScaleX ?? 1.25,
        visualScaleY: cfg.visualScaleY ?? 0.48,
        rotationDeg: cfg.rotationDeg ?? 0,
        particleEnabled: !!cfg.particleEnabled,
        particleCount: cfg.particleCount ?? 18,
        particleSpeed: cfg.particleSpeed ?? 0.00035,
        particleAlpha: cfg.particleAlpha ?? 0.45,
        particleSize: cfg.particleSize ?? 2,
        particleOrbitJitter: cfg.particleOrbitJitter ?? 8,
      };
    }

    drawEnergyZone(time) {
      if (!this.energyZoneGfx) return;
      const g = this.energyZoneGfx;
      g.clear();

      const zone = this.getEnergyZoneVisualState();
      if (!zone.enabled) return;

      const maxHp = Math.max(1, this.crystalMaxHp || DEFENSE_LAYOUT_CONFIG.crystalMaxHp || 1);
      const hpRatio = Phaser.Math.Clamp(this.crystalHp / maxHp, 0, 1);
      const isLowHp = hpRatio <= zone.lowHpThreshold;
      const pulseDuration = Math.max(240, isLowHp ? zone.pulseDurationMs * 0.55 : zone.pulseDurationMs);
      const pulsePhase = (time % pulseDuration) / pulseDuration;
      const breath = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);
      const flicker = isLowHp ? (0.82 + 0.18 * Math.sin(time * 0.034)) : 1;
      const glowAlpha = Phaser.Math.Linear(zone.idleAlpha, zone.activeAlpha, breath) * flicker;
      const ringScale = 1 + (breath - 0.5) * (isLowHp ? 0.08 : 0.05);
      const radius = zone.radius * ringScale;
      const glowColor = isLowHp ? 0x786a9d : 0x5ad2f0;
      const ringColor = isLowHp ? 0xb68cff : 0xaeeeff;
      const runeColor = isLowHp ? 0xd1a6ff : 0xe8ffff;
      const centerColor = isLowHp ? 0x1f1730 : 0x10263a;
      const rot = Phaser.Math.DegToRad(zone.rotationDeg);
      const cosRot = Math.cos(rot);
      const sinRot = Math.sin(rot);
      const sx = zone.visualScaleX;
      const sy = zone.visualScaleY;
      const activityBoost = Phaser.Math.Clamp(this.enemies.filter((enemy) => !enemy.isDead && Phaser.Math.Distance.Between(enemy.x, enemy.y, zone.x, zone.y) <= zone.radius + enemy.displayedRadius() * 0.35).length / Math.max(1, zone.maxLinks), 0, 1);

      const ellipsePoint = (angle, scaleMul = 1) => {
        const localX = Math.cos(angle) * radius * sx * scaleMul;
        const localY = Math.sin(angle) * radius * sy * scaleMul;
        return {
          x: zone.x + localX * cosRot - localY * sinRot,
          y: zone.y + localX * sinRot + localY * cosRot,
        };
      };

      const drawEllipsePath = (scaleMul, mode) => {
        const steps = 48;
        g.beginPath();
        for (let i = 0; i <= steps; i += 1) {
          const pt = ellipsePoint((Math.PI * 2 * i) / steps, scaleMul);
          if (i === 0) g.moveTo(pt.x, pt.y);
          else g.lineTo(pt.x, pt.y);
        }
        g.closePath();
        if (mode === 'fill') g.fillPath();
        else g.strokePath();
      };

      g.fillStyle(glowColor, glowAlpha * (isLowHp ? 0.14 : 0.18));
      drawEllipsePath(1.10, 'fill');

      g.fillStyle(centerColor, glowAlpha * (isLowHp ? 0.20 : 0.16));
      drawEllipsePath(0.94, 'fill');

      g.lineStyle(isLowHp ? 3 : 2, ringColor, glowAlpha * 0.95);
      drawEllipsePath(1.0, 'stroke');

      g.lineStyle(1.5, glowColor, glowAlpha * 0.6);
      drawEllipsePath(0.78, 'stroke');

      const outerRotation = time * 0.00022;
      const innerRotation = -time * 0.00016;
      for (let i = 0; i < 12; i += 1) {
        const angle = outerRotation + (Math.PI * 2 * i) / 12;
        const p1 = ellipsePoint(angle, 0.84);
        const p2 = ellipsePoint(angle, 0.98);
        g.lineStyle(1.5, runeColor, glowAlpha * 0.8);
        g.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }

      for (let i = 0; i < 6; i += 1) {
        const angle = innerRotation + (Math.PI * 2 * i) / 6;
        const cp = ellipsePoint(angle, 0.58);
        g.lineStyle(1, runeColor, glowAlpha * 0.55);
        g.beginPath();
        const circleSteps = 18;
        for (let s = 0; s <= circleSteps; s += 1) {
          const a = (Math.PI * 2 * s) / circleSteps;
          const px = cp.x + Math.cos(a) * radius * sx * 0.08;
          const py = cp.y + Math.sin(a) * radius * sy * 0.08;
          if (s === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.strokePath();
      }

      const linkTargets = this.enemies
        .filter((enemy) => !enemy.isDead && Phaser.Math.Distance.Between(enemy.x, enemy.y, zone.x, zone.y) <= zone.radius + enemy.displayedRadius() * 0.35)
        .sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, zone.x, zone.y) - Phaser.Math.Distance.Between(b.x, b.y, zone.x, zone.y))
        .slice(0, zone.maxLinks);

      if (zone.particleEnabled) {
        const particleCount = Math.max(0, zone.particleCount | 0);
        const particleBaseAlpha = zone.particleAlpha * (0.55 + activityBoost * 0.75) * flicker;
        const particleSize = Math.max(1, zone.particleSize);
        for (let i = 0; i < particleCount; i += 1) {
          const seed = i / Math.max(1, particleCount);
          const angle = seed * Math.PI * 2 + time * zone.particleSpeed * ((i % 3) + 0.8);
          const inward = 1 - ((time * zone.particleSpeed * 0.18 * ((i % 5) + 1) + seed * 1.37) % 1);
          const outer = ellipsePoint(angle, 0.66 + ((i * 37) % 28) / 100);
          const jitterMag = zone.particleOrbitJitter * (isLowHp ? 1.45 : 1) * (0.25 + inward * 0.75);
          const jitterX = Math.sin(time * 0.006 + i * 1.91) * jitterMag;
          const jitterY = Math.cos(time * 0.007 + i * 1.37) * jitterMag * 0.6;
          const px = Phaser.Math.Linear(zone.x, outer.x, inward) + jitterX;
          const py = Phaser.Math.Linear(zone.y, outer.y, inward) + jitterY;
          const alpha = particleBaseAlpha * (0.35 + inward * 0.75) * (0.82 + 0.18 * Math.sin(time * 0.02 + i * 2.1));
          g.fillStyle(glowColor, alpha * 0.55);
          g.fillEllipse(px, py, particleSize * 3.2, particleSize * 2.0);
          g.fillStyle(runeColor, alpha);
          g.fillCircle(px, py, particleSize);
        }
      }

      g.fillStyle(runeColor, (glowAlpha * 0.7 + activityBoost * 0.15) * flicker);
      g.fillEllipse(zone.x, zone.y, 10, 6);

      for (let i = 0; i < linkTargets.length; i += 1) {
        const enemy = linkTargets[i];
        const angle = Math.atan2(enemy.y - zone.y, enemy.x - zone.x);
        const start = ellipsePoint(angle, 0.20);
        const flickerAlpha = (0.30 + 0.30 * Math.sin(time * 0.015 + i * 1.7)) * (isLowHp ? 0.8 : 1);
        const midX = Phaser.Math.Linear(start.x, enemy.x, 0.52) + Math.sin(time * 0.01 + i) * 4;
        const midY = Phaser.Math.Linear(start.y, enemy.y, 0.52) + Math.cos(time * 0.013 + i * 2) * 4;
        g.lineStyle(2, glowColor, flickerAlpha * 0.45);
        g.lineBetween(start.x, start.y, midX, midY);
        g.lineStyle(1, runeColor, flickerAlpha);
        g.lineBetween(midX, midY, enemy.x, enemy.y);
      }
    }

    createModuleDebugPanel() {
      const scene = this;
      // Minimal runtime debug toggle. The legacy DOM MODULES panel has been removed.
      const D = 1900;
      const arrowOf = (v) => (v ? '▲' : '▼');
      const toggleBg = this.add.rectangle(22, 132, 40, 16, 0x1a2a3a, 1)
        .setDepth(D).setStrokeStyle(1, 0x445566).setInteractive({ useHandCursor: true });
      const toggleLbl = this.add.text(22, 132, `DBG ${arrowOf(this.debugVisible)}`, {
        fontFamily: 'Arial', fontSize: '9px', color: '#88aabb',
      }).setOrigin(0.5).setDepth(D + 1);
      const onToggle = () => {
        scene.debugVisible = !scene.debugVisible;
        toggleLbl.setText(`DBG ${arrowOf(scene.debugVisible)}`);
      };
      toggleBg.on('pointerup', onToggle);
      toggleLbl.setInteractive({ useHandCursor: true }).on('pointerup', onToggle);
    }

    syncDefenseVisuals() {
      if (!this.frontWallSprite) return;
      const wallCfg = MODULES_CONFIG.find(c => c.key === DEFENSE_LAYOUT_CONFIG.wallSpriteKey);
      const baseVisible = wallCfg ? wallCfg.visible : true;
      this.frontWallSprite.setVisible(this.wallHp > 0 && baseVisible);
    }

    updateEnemyDefenseState(enemy, dt) {
      if (enemy.isDead) return;
      if (enemy.repulseTweenMsRemaining > 0) return;
      const dc = DEFENSE_LAYOUT_CONFIG;

      if (enemy.defenseState === 'inTargetZone') {
        if (enemy.isFrozen()) return;
        if (!this.debugGodMode) {
          this.crystalHp = Math.max(0, this.crystalHp - ((enemy.type.attackDamage ?? 1) * dt));
        }
        return;
      }

      if (enemy.isFrozen()) return;

      if (enemy.defenseState === 'advancing') {
        if (this.wallHp > 0 && enemy.y >= dc.wallFrontEdgeY &&
            enemy.x >= dc.wallLeftX && enemy.x <= dc.wallRightX) {
          // Wall alive — stop and attack wall
          enemy.defenseState = 'attackingWall';
          enemy.y = dc.wallFrontEdgeY;
          enemy.attackTimer = 0;
        } else if (this.wallHp <= 0 && enemy.y >= dc.crystalApproachStartY) {
          // Wall gone — start homing toward crystal target
          enemy.defenseState = 'movingToCrystal';
          enemy.attackTimer = 0;
        }
        return;
      }

      if (enemy.defenseState === 'attackingWall') {
        if (this.wallHp <= 0) {
          enemy.defenseState = 'movingToCrystal';
          enemy.attackTimer = 0;
          return;
        }
        const interval = (enemy.type.attackInterval ?? dc.wallAttackIntervalFallback);
        enemy.attackTimer += dt;
        if (enemy.attackTimer >= interval) {
          enemy.attackTimer -= interval;
          if (!this.debugGodMode) {
            this.wallHp = Math.max(0, this.wallHp - (enemy.type.attackDamage ?? 1));
          }
        }
        return;
      }

      // movingToCrystal transition handled inside Enemy._moveTowardCrystal
    }

    updatePassiveWeapon(dt) {
      if (!RIGHT_TOWER_ENABLED) return;
      const rightConfig = this.getCurrentTowerWeaponConfig('right');
      if (!rightConfig || rightConfig.mode !== 'auto_attack') return;

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
            && (enemy.inZone || crystalZone.normalizedDistance(enemy.x, enemy.y, enemy.displayedRadius()) <= 1.35))
          .sort((a, b) => {
            if (a.inZone !== b.inZone) {
              return a.inZone ? -1 : 1;
            }
            const distA = crystalZone.normalizedDistance(a.x, a.y, a.displayedRadius());
            const distB = crystalZone.normalizedDistance(b.x, b.y, b.displayedRadius());
            return distA - distB;
          })
          .slice(0, maxTargets);

        for (const enemy of targets) {
          let hitDamage = tickDamage;
          if ((this.rightGuardZoneBonus || 0) > 0) {
            const isInnerGuardTarget = crystalZone.normalizedDistance(enemy.x, enemy.y) <= 0.65;
            if (isInnerGuardTarget) {
              hitDamage *= 1 + this.rightGuardZoneBonus;
            }
          }

          this.passiveWeaponEffects.push({
            fromX: towerPos.x,
            fromY: towerPos.y,
            toX: enemy.x,
            toY: enemy.y,
            timer: 0,
            duration: 0.12,
            sprite: null,
          });

          const enemyIndex = this.enemies.indexOf(enemy);
          if (enemyIndex < 0) continue;
          this.applyDamageToEnemy(enemyIndex, hitDamage, false);
          this.addRightUltCharge(1);
        }
      }
    }

    applyDamageToEnemy(enemyIndex, damage, isPerfect = false, hitGaugeMultiplier = 1) {
      const enemy = this.enemies[enemyIndex];
      if (!enemy) {
        return false;
      }
      // Add one hit-gauge point.
      this.addHitGauge(HIT_GAUGE_HIT_VALUE * hitGaugeMultiplier);
      this.playSfx('hit');
      this.spawnDamagePopup(enemy.x, enemy.y, damage, isPerfect);
      enemy.hp -= damage;
      if (enemy.hp <= 0) {
        if (isPerfect) {
          this.spawnPerfectPopup(enemy.x, enemy.y);
        }
        this.playSfx('enemy_death');
        if (Math.random() < HEALTH_POT_CONFIG.dropChance) {
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

    getCurrentTowerWeaponConfig(slot) {
      const typeId = this.selectedTowerWeaponTypes[slot];
      return TOWER_WEAPON_TYPES[slot]?.[typeId] || null;
    }

    getCurrentMainWeaponConfig() {
      return this.getCurrentTowerWeaponConfig('center');
    }

    getSlotDamageBonus(slot) {
      if (slot === 'left')   return this.subDamageBonus;
      if (slot === 'center') return this.mainDamageBonus;
      if (slot === 'right')  return this.passiveDamageBonus;
      return 0;
    }

    handleExplosionLanding(projectile, gx, gy) {
      const rangeBonus = projectile.slot === 'left' ? this.subRangeBonus : 0;
      const bombDamage = projectile.weapon.damage * (1 + this.getSlotDamageBonus(projectile.slot));
      const hitCount = this.applyBombDamage(gx, gy, projectile.weapon.landingExplosionRadius, bombDamage, projectile.perfect);
      this.applySubGravityPull(gx, gy, projectile.weapon.landingExplosionRadius);
      this.playSfx('explosion');
      this.bombExplosionEffects.push({ x: gx, y: gy, timer: 0, duration: 0.45, radius: projectile.weapon.landingExplosionRadius * (1 + rangeBonus) });
      return hitCount;
    }

    applySubGravityPull(cx, cy, radius) {
      if (this.subPullLevel <= 0) return;
      const level = Math.min(Math.max(0, this.subPullLevel), SUB_PULL_CONFIG.maxLevel);
      const pullConfig = SUB_PULL_CONFIG.pullByLevel[level];
      if (!pullConfig || pullConfig.distance <= 0) return;
      const pullDistance = pullConfig.distance;
      const radiusMultiplier = pullConfig.radiusMultiplier ?? 1;
      const pullRadius = radius * (1 + this.subRangeBonus) * radiusMultiplier;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dx = cx - enemy.x;
        const dy = cy - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > pullRadius + enemy.displayedRadius()) continue;
        let pull = pullDistance;
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
            if (Math.random() < HEALTH_POT_CONFIG.dropChance) {
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
      const text = this.add.text(x, y - 24, getUiText('hud.perfect_popup'), {
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
      const label = this.add.text(x, y, getUiText('hud.health_pot_label'), {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(30);
      this.healthPots.push({ x, y, timer: 0, duration: HEALTH_POT_CONFIG.duration, label });
    }

    drawTerrain() {
      const g = this.gfx;
      g.clear();

      // Debug overlay — controlled by this.debugVisible (runtime toggle)
      if (this.debugVisible) {
        const zones = this.getTouchZoneBounds();
        const zoneH = zones.zoneYMax - zones.zoneYMin;

        // Left zone overlay.
        g.fillStyle(0x4488ff, 0.15);
        g.fillRect(0, zones.zoneYMin, zones.leftXMax, zoneH);

        // Main zone overlay.
        g.fillStyle(0x44ff88, 0.15);
        g.fillRect(zones.mainXMin, zones.zoneYMin, Math.max(0, zones.mainXMax - zones.mainXMin), zoneH);

        // Right zone overlay.
        g.fillStyle(0xffaa44, 0.15);
        g.fillRect(zones.rightXMin, zones.zoneYMin, WIDTH - zones.rightXMin, zoneH);

        // Defense layout debug
        const dc = DEFENSE_LAYOUT_CONFIG;
        // Wall front edge line
        g.lineStyle(2, 0xffaa00, 0.8);
        g.lineBetween(dc.wallLeftX, dc.wallFrontEdgeY, dc.wallRightX, dc.wallFrontEdgeY);
        // Wall HP label
        g.lineStyle(1, 0xffaa00, 0.4);
        g.lineBetween(dc.wallLeftX, dc.wallFrontEdgeY - 6, dc.wallLeftX, dc.wallFrontEdgeY + 6);
        g.lineBetween(dc.wallRightX, dc.wallFrontEdgeY - 6, dc.wallRightX, dc.wallFrontEdgeY + 6);
        // Crystal target ellipse
        g.lineStyle(1.5, 0x88ffff, 0.4);
        g.strokeEllipse(
          dc.crystalTargetX,
          dc.crystalTargetY,
          (dc.crystalEllipseRadiusX ?? dc.crystalAggroRadius) * 2,
          (dc.crystalEllipseRadiusY ?? dc.crystalAggroRadius) * 2,
        );
        g.fillStyle(0x88ffff, 0.04);
        g.fillEllipse(
          dc.crystalTargetX,
          dc.crystalTargetY,
          (dc.crystalEllipseRadiusX ?? dc.crystalAggroRadius) * 2,
          (dc.crystalEllipseRadiusY ?? dc.crystalAggroRadius) * 2,
        );
        // Defense HP text
        this.debugText.setText(
          `Wall: ${this.wallHp}/${this.wallMaxHp}  Crystal: ${this.crystalHp}/${this.crystalMaxHp}` +
          `\nRight: ${this.rightTowerInput ? 'holding' : (this.lastRightTowerInput?.state ?? 'idle')}` +
          `  Ult: ${this.rightUltCharge}/${this.rightUltChargeMax}`
        );
        this.debugText.setVisible(true);
      } else {
        this.debugText.setVisible(false);
      }
    }

    drawPassiveWeapon() {
      if (!RIGHT_TOWER_ENABLED) {
        return;
      }

      const g = this.gfx;
      const towerPos = this.getRightTowerPosition();
      const passiveVisual = RIGHT_TOWER_PASSIVE_VISUAL_CONFIG;
      const canDrawPassiveSprite = !!(passiveVisual?.enabled
        && passiveVisual.assetKey
        && this.textures.exists(passiveVisual.assetKey));

      g.fillStyle(0xff7b2f, 0.9);
      g.fillCircle(towerPos.x, towerPos.y, 10);
      g.lineStyle(2, 0xffd36b, 0.95);
      g.strokeCircle(towerPos.x, towerPos.y, 10);

      for (const effect of this.passiveWeaponEffects) {
        const progress = effect.timer / effect.duration;
        const alpha = 1 - progress;
        const midX = Phaser.Math.Linear(effect.fromX, effect.toX, 0.55) + Phaser.Math.FloatBetween(-5, 5);
        const midY = Phaser.Math.Linear(effect.fromY, effect.toY, 0.55) + Phaser.Math.FloatBetween(-5, 5);
        const shouldDrawLine = passiveVisual?.fallbackLineEnabled !== false || !canDrawPassiveSprite;

        if (shouldDrawLine) {
          g.lineStyle(7 - progress * 3, 0xff7b2f, alpha * 0.75);
          g.lineBetween(effect.fromX, effect.fromY, midX, midY);
          g.lineStyle(3.5 - progress, 0xffd36b, alpha * 0.95);
          g.lineBetween(midX, midY, effect.toX, effect.toY);
        }

        if (canDrawPassiveSprite) {
          if (!effect.sprite) {
            effect.sprite = this.add.image(effect.fromX, effect.fromY, passiveVisual.assetKey)
              .setOrigin(0.5, 0.5)
              .setDepth(21);
            effect.sprite.setDisplaySize(passiveVisual.displayWidth, passiveVisual.displayHeight);
          }
          const visualProgress = Phaser.Math.Clamp(0.2 + progress * 0.6, 0, 1);
          effect.sprite.setPosition(
            Phaser.Math.Linear(effect.fromX, effect.toX, visualProgress),
            Phaser.Math.Linear(effect.fromY, effect.toY, visualProgress),
          );
          effect.sprite.setRotation(
            Math.atan2(effect.toY - effect.fromY, effect.toX - effect.fromX)
            + (passiveVisual.rotationOffsetRadians ?? 0),
          );
          effect.sprite.setAlpha((passiveVisual.alpha ?? 1) * alpha);
          effect.sprite.setVisible(true);
        } else if (effect.sprite) {
          effect.sprite.destroy();
          effect.sprite = null;
        }
      }
    }

  update(time, delta) {
    const dt = delta / 1000;

    if (!this.gameStarted) {
      if (this.beamGfx) this.beamGfx.clear();
      this.setRightUltimateHudVisible(false);
      this.drawTerrain();
      this.drawSkillButtons();
      this.drawHitGauge();
      this.drawHpBar();
      this.drawCombo();
      this.hudText.setText(`${getUiText('hud.score_prefix')}: ${this.score}`);
      this.levelText.setText(`${getUiText('hud.level_prefix')}: ${this.currentLevel}`);
      return;
    }

    if (this.isCardPicking) {
      if (this.beamGfx) this.beamGfx.clear();
      return;
    }

      if (!this.gameOver) {
        this.playTime += dt;
        // Update level speed scaling from the current level.
        this.levelSpeedMultiplier = speedMultiplierForLevel(this.currentLevel);
        this.updateSkillCooldowns(dt);
        this.updateLeftAutoFire();
        this.updateRightUltimateHold(delta);
        if (this.slashCooldown > 0) this.slashCooldown -= dt;
        if (this.mainBeamCooldownRemaining > 0) {
          this.mainBeamCooldownRemaining = Math.max(0, this.mainBeamCooldownRemaining - dt);
        }
        this.updateSatelliteBeam(dt);
        const continuousBeamActive = this.updateContinuousBeam(dt);
        // Main weapon auto-fire while dragging.
        if (this.joystickMain) {
          const js = this.joystickMain;
          const effectiveFireRate = this.getMainWeaponFireInterval();
          const mainWeaponConfig = this.getCurrentMainWeaponConfig();
          const isBeamMain = mainWeaponConfig?.mode === 'beam' && PIERCE_BEAM_CONFIG.enabled;
          const isContinuousBeamMain = isBeamMain && this.isContinuousBeamSelected();
          const launchX = js.startX;
          const launchY = js.startY;
          const dx = js.currentPointerX - launchX;
          const dy = js.currentPointerY - launchY;
          const d = Math.hypot(dx, dy);

          if (isContinuousBeamMain) {
            js.beamImmediatePending = !continuousBeamActive;
          } else if (isBeamMain) {
            if (d > 0 && this.mainBeamCooldownRemaining <= 0) {
              this.spawnWeaponProjectiles(launchX, launchY, dx / d, dy / d, NORMAL_PROJECTILE_SPEED, false, 'center');
              js.beamImmediatePending = false;
              js.fireTimer = 0;
              this.mainBeamCooldownRemaining = effectiveFireRate;
            }
          } else {
            js.fireTimer += dt;
            if (js.fireTimer >= effectiveFireRate) {
              js.fireTimer -= effectiveFireRate;
              if (d > 0) {
                this.spawnWeaponProjectiles(launchX, launchY, dx / d, dy / d, NORMAL_PROJECTILE_SPEED, false, 'center');
                js.beamImmediatePending = false;
              }
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
      for (const effect of this.beamEffects) {
        effect.timer += dt;
      }
      for (const effect of this.beamImpactEffects) {
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
        this.updateEnemyDefenseState(enemy, dt);
        // Legacy compat: inZone used by passive weapon sort and knockback dampening
        enemy.inZone = (enemy.defenseState === 'inTargetZone');
        aliveEnemies.push(enemy);
      }
      this.enemies = aliveEnemies;
      this.syncDefenseVisuals();

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

            // Arcing projectile landing (left tower bomb).
            if (projectile.weapon?.mode === 'arcing_projectile' && projectile.height <= 0) {
              if (!projectile.landedHitApplied) {
                const rawPos = projectile.groundPos();
                const gx = projectile.forcedLandX ?? rawPos.x;
                const gy = projectile.forcedLandY ?? rawPos.y;
                projectile.landedHitApplied = true;
                if (projectile.weapon.landingEffectType === 'explosion') {
                  const hitCount = this.handleExplosionLanding(projectile, gx, gy);
                  if (hitCount === 0) {
                    this.comboCount = 0;
                    this.addHitGaugePenalty();
                  }
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

        if (projectile.weapon?.mode === 'projectile') {
          const hitRadius = projectile.mainHitRadius ?? (projectile.weapon.hitRadius ?? projectile.weapon.straightHitRadius);
          const x1 = projectile.prevGroundX;
          const y1 = projectile.prevGroundY;
          const x2 = projectile.groundX;
          const y2 = projectile.groundY;
          let destroyProjectile = false;
          for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.isDead) continue;
            if (projectile.hitEnemySet && projectile.hitEnemySet.has(i)) continue;
            if (distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2) <= hitRadius + enemy.displayedRadius()) {
              const hitNumber = projectile.hitEnemySet ? projectile.hitEnemySet.size : 0;
              const falloff = Math.pow(projectile.weapon.pierceDamageFalloff ?? 1, hitNumber);
              let hitDamage = projectile.weapon.damage * (1 + this.getSlotDamageBonus(projectile.slot)) * projectile.damageMultiplier * falloff;
              if ((projectile.shotgunCloseBonus || 0) > 0) {
                const travelDistance = Phaser.Math.Distance.Between(projectile.startX, projectile.startY, enemy.x, enemy.y);
                if (travelDistance <= 140) {
                  hitDamage *= 1 + projectile.shotgunCloseBonus;
                } else if (travelDistance <= 220) {
                  hitDamage *= 1 + projectile.shotgunCloseBonus * 0.5;
                }
              }
              if (projectile.hitEnemySet) projectile.hitEnemySet.add(i);
              projectile.hasHit = true;
              const killed = this.applyDamageToEnemy(i, hitDamage, projectile.perfect);
              if (!killed && this.mainKnockbackLevel > 0) {
                this.applyMainKnockback(this.enemies[i]);
              }
              projectile.pierceRemaining = (projectile.pierceRemaining ?? 1) - 1;
              if (projectile.pierceRemaining <= 0) {
                destroyProjectile = true;
                break;
              }
            }
          }
          if (destroyProjectile) {
            projectile.destroy();
            continue;
          }
        }

        aliveProjectiles.push(projectile);
      }
      this.projectiles = aliveProjectiles;
      this.landingEffects = this.landingEffects.filter((effect) => effect.timer < effect.duration);
      this.beamEffects = this.beamEffects.filter((effect) => effect.timer < (effect.duration + effect.fadeDuration));
      this.beamImpactEffects = this.beamImpactEffects.filter((effect) => effect.timer < effect.duration);
      // Bomb explosion timers.
      for (const ef of this.bombExplosionEffects) { ef.timer += dt; }
      this.bombExplosionEffects = this.bombExplosionEffects.filter(ef => ef.timer < ef.duration);
      for (const effect of this.passiveWeaponEffects) { effect.timer += dt; }
      this.passiveWeaponEffects = this.passiveWeaponEffects.filter((effect) => {
        if (effect.timer < effect.duration) {
          return true;
        }
        if (effect.sprite) {
          effect.sprite.destroy();
          effect.sprite = null;
        }
        return false;
      });
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

      if (this.crystalHp <= 0) {
        this.crystalHp = 0;
        this.gameOver = true;
        this.gameOverText.setVisible(true);
        this.finalScoreText.setText(`${getUiText('game_over.final_score')}: ${this.score}`);
        this.finalScoreText.setVisible(true);
      }
    }

      this.drawEnergyZone(time);
      this.drawTerrain();
      this.redrawAimGraphics();

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

      this.beamGfx.clear();
      for (const effect of this.beamEffects) {
        const progress = effect.timer <= effect.duration
          ? 0
          : Phaser.Math.Clamp((effect.timer - effect.duration) / effect.fadeDuration, 0, 1);
        const alpha = 1 - progress;
        const glowWidth = effect.isPowerShot ? effect.glowWidth * 1.15 : effect.glowWidth;
        const coreWidth = effect.isPowerShot ? effect.coreWidth * 1.2 : effect.coreWidth;
        this.beamGfx.lineStyle(glowWidth, effect.glowColor, effect.glowAlpha * alpha);
        this.beamGfx.lineBetween(effect.x1, effect.y1, effect.x2, effect.y2);
        this.beamGfx.lineStyle(coreWidth, effect.coreColor, effect.coreAlpha * alpha);
        this.beamGfx.lineBetween(effect.x1, effect.y1, effect.x2, effect.y2);
      }
      for (const effect of this.beamImpactEffects) {
        const progress = Phaser.Math.Clamp(effect.timer / effect.duration, 0, 1);
        const alpha = 1 - progress;
        const radius = effect.radius * (0.45 + progress * 0.9);
        this.beamGfx.fillStyle(PIERCE_BEAM_CONFIG.coreColor, alpha * 0.35);
        this.beamGfx.fillCircle(effect.x, effect.y, radius);
        this.beamGfx.lineStyle(Math.max(1, PIERCE_BEAM_CONFIG.coreWidth * 0.5), PIERCE_BEAM_CONFIG.glowColor, alpha * 0.85);
        this.beamGfx.strokeCircle(effect.x, effect.y, radius);
      }

      for (const projectile of this.projectiles) {
        projectile.draw(this.gfx);
      }

        this.drawSkillButtons();
        this.drawHitGauge();
        this.drawHpBar();
        this.drawCombo();
      this.drawRightUltimateHud();
      this.hudText.setText(`${getUiText('hud.score_prefix')}: ${this.score}`);
      this.levelText.setText(`${getUiText('hud.level_prefix')}: ${this.currentLevel}`);
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
