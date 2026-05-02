// ============================================================
// LOADOUT MENU attached to MainScene via prototype.
// Depends on: config.js, weapons_config.js, ui_text_config.js.
// game.js defines MainScene; this file extends it after load.
// ============================================================

MainScene.prototype.createLoadoutMenu = function () {
  if (!LOADOUT_MENU_ENABLED) {
    this.gameStarted = true;
    return;
  }
  this._ensureLoadoutWeaponImagesLoaded();
  this._rebuildLoadoutMenu();
};

MainScene.prototype._rebuildLoadoutMenu = function () {
  this._ensureLoadoutWeaponImagesLoaded();
  const D = 290;
  const tabH = LOADOUT_MENU_TAB_HEIGHT;
  const contentH = HEIGHT - tabH;

  for (const el of this.loadoutContentElements) { if (el?.destroy) el.destroy(); }
  this.loadoutContentElements = [];
  for (const el of this.loadoutMenuElements) { if (el?.destroy) el.destroy(); }
  this.loadoutMenuElements = [];
  this.loadoutTabObjects = {};

  const bg = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x08111a, LOADOUT_MENU_BACKDROP_ALPHA)
    .setDepth(D);
  this.loadoutMenuElements.push(bg);

  this._buildLocaleToggleButton(D);
  this._buildLoadoutTabs(D, tabH);
  this._buildLoadoutPage(this.loadoutSelectedTab, D, contentH);
};

MainScene.prototype._buildLocaleToggleButton = function (D) {
  const btnX = WIDTH - 46;
  const btnY = 34;
  const btnW = 68;
  const btnH = 30;
  const localeLabel = UI_TEXT_CONFIG.locale === 'zh_tw' ? '繁中' : 'EN';

  const toggleBg = this.add.rectangle(btnX, btnY, btnW, btnH, 0x112233, 0.78)
    .setDepth(D + 2)
    .setStrokeStyle(1, 0x5ad2f0, 0.9)
    .setInteractive({ useHandCursor: true });
  const toggleTxt = this.add.text(btnX, btnY, localeLabel, {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#d8e8f0',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 3);

  toggleBg.on('pointerover', () => toggleBg.setFillStyle(0x183146, 0.9));
  toggleBg.on('pointerout', () => toggleBg.setFillStyle(0x112233, 0.78));
  toggleBg.on('pointerup', () => {
    toggleUiLocale();
    this._rebuildLoadoutMenu();
  });

  this.loadoutMenuElements.push(toggleBg, toggleTxt);
};

MainScene.prototype._buildStartGuardingButton = function (D, y) {
  const btnY = y;
  const btnW = 208;
  const btnH = 44;
  const startBg = this.add.rectangle(WIDTH / 2, btnY, btnW, btnH, 0x163828, 1)
    .setDepth(D + 2)
    .setStrokeStyle(2, 0x44cc77)
    .setInteractive({ useHandCursor: true });
  const startTxt = this.add.text(WIDTH / 2, btnY, getUiText('loadout.start_button'), {
    fontFamily: 'Arial',
    fontSize: '18px',
    color: '#88ffaa',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 3);

  startBg.on('pointerover', () => startBg.setFillStyle(0x1e5038, 1));
  startBg.on('pointerout', () => startBg.setFillStyle(0x163828, 1));
  startBg.on('pointerup', () => {
    if (!this.gameStarted) this._destroyLoadoutMenu();
  });

  this.loadoutContentElements.push(startBg, startTxt);
};

MainScene.prototype._buildLoadoutTabs = function (D, tabH) {
  const tabDefs = [
    { slot: 'left', ratio: LOADOUT_MENU_TAB_RATIO_LEFT, roleKey: 'loadout.tabs.left.title' },
    { slot: 'center', ratio: LOADOUT_MENU_TAB_RATIO_CENTER, roleKey: 'loadout.tabs.center.title' },
    { slot: 'right', ratio: LOADOUT_MENU_TAB_RATIO_RIGHT, roleKey: 'loadout.tabs.right.title' },
  ];

  const sepY = HEIGHT - tabH;
  const sep = this.add.rectangle(WIDTH / 2, sepY, WIDTH, 2, 0x2a3d55, 1).setDepth(D + 1);
  this.loadoutMenuElements.push(sep);

  let xCursor = 0;
  for (const def of tabDefs) {
    const tw = WIDTH * def.ratio;
    const tx = xCursor + tw / 2;
    const tabY = HEIGHT - tabH / 2;
    const typeId = def.slot === 'center' ? this.selectedMainWeaponCoreId : this.selectedTowerWeaponTypes[def.slot];
    const wepLabel = this._getLocalizedWeaponName(def.slot, typeId);
    const isSel = this.loadoutSelectedTab === def.slot;
    const fillAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_FILL_ALPHA : LOADOUT_MENU_TAB_DIM_FILL_ALPHA;
    const strokeAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_STROKE_ALPHA : LOADOUT_MENU_TAB_DIM_STROKE_ALPHA;
    const textAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_TEXT_ALPHA : LOADOUT_MENU_TAB_DIM_TEXT_ALPHA;

    const tabBg = this.add.rectangle(
      tx,
      tabY,
      tw - 2,
      tabH - 2,
      isSel ? LOADOUT_MENU_TAB_SELECTED_COLOR : LOADOUT_MENU_TAB_DIM_COLOR,
      fillAlpha,
    )
      .setDepth(D + 1)
      .setStrokeStyle(isSel ? 2 : 1, isSel ? LOADOUT_MENU_TAB_STROKE_SELECTED : LOADOUT_MENU_TAB_STROKE_DIM, strokeAlpha)
      .setInteractive({ useHandCursor: true });

    const roleText = this.add.text(tx, tabY - 13, getUiText(def.roleKey), {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: isSel ? '#c9d7df' : '#4c5d6d',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2).setAlpha(textAlpha);

    const wepText = this.add.text(tx, tabY + 10, wepLabel, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: isSel ? '#74bfd3' : '#2f3e4b',
      wordWrap: { width: Math.max(tw - 18, 40) },
      align: 'center',
    }).setOrigin(0.5).setDepth(D + 2).setAlpha(textAlpha);

    tabBg.on('pointerup', () => {
      if (def.slot !== this.loadoutSelectedTab) this._selectLoadoutTab(def.slot);
    });

    this.loadoutTabObjects[def.slot] = { bg: tabBg, roleText, wepText };
    this.loadoutMenuElements.push(tabBg, roleText, wepText);
    xCursor += tw;
  }
};

MainScene.prototype._buildLoadoutPage = function (tab, D, contentH) {
  for (const el of this.loadoutContentElements) { if (el?.destroy) el.destroy(); }
  this.loadoutContentElements = [];

  const tabKey = `loadout.tabs.${tab}`;
  const cx = WIDTH / 2;
  const layout = this._getLoadoutLayoutMetrics(contentH, tab);
  const panelH = contentH - 12;
  const panel = this.add.rectangle(cx, panelH / 2 + 6, WIDTH, panelH, LOADOUT_MENU_TAB_SELECTED_COLOR, LOADOUT_MENU_PAGE_FILL_ALPHA)
    .setDepth(D + 1)
    .setStrokeStyle(1, LOADOUT_MENU_TAB_STROKE_SELECTED, LOADOUT_MENU_PAGE_STROKE_ALPHA);
  this.loadoutContentElements.push(panel);

  const title = this.add.text(cx, layout.headerTitleY, getUiText(`${tabKey}.title`), {
    fontFamily: 'Arial',
    fontSize: '22px',
    color: '#eef4f8',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 2);

  const badge = this.add.text(cx, layout.headerBadgeY, getUiText(`${tabKey}.badge`), {
    fontFamily: 'Arial',
    fontSize: '9px',
    color: '#5ad2f0',
    backgroundColor: '#091824',
    padding: { x: 7, y: 2 },
  }).setOrigin(0.5).setDepth(D + 2);

  const desc = this.add.text(cx, layout.headerDescY, getUiText(`${tabKey}.desc`), {
    fontFamily: 'Arial',
    fontSize: '10px',
    color: '#7e92a1',
    align: 'center',
    wordWrap: { width: WIDTH - 100 },
  }).setOrigin(0.5).setDepth(D + 2);

  this.loadoutContentElements.push(title, badge, desc);
  this._buildLoadoutWeaponCards(tab, D, layout.cardsY);
  const detailBottomY = this._buildSelectedWeaponDetail(tab, D, layout.detailY, layout.detailH);
  if (tab === 'right') {
    this._buildRightUltimateSelector(D, detailBottomY + 20);
  }
  this._buildLoadoutSummary(tab, D, layout.summaryY);
  this._buildStartGuardingButton(D, layout.startButtonY);
};

MainScene.prototype._getAllLoadoutWeaponEntries = function () {
  const entries = [];
  for (const [typeId] of Object.entries(TOWER_WEAPON_TYPES.left || {})) {
    entries.push({ slot: 'left', typeId });
  }
  for (const card of getMainWeaponCoreCards()) {
    entries.push({ slot: 'center', typeId: card.id });
  }
  for (const [typeId] of Object.entries(TOWER_WEAPON_TYPES.right || {})) {
    entries.push({ slot: 'right', typeId });
  }
  return entries;
};

MainScene.prototype._ensureLoadoutWeaponImagesLoaded = function () {
  if (!this.loadoutWeaponImageAttempts) this.loadoutWeaponImageAttempts = {};
  if (!this.loadoutWeaponImageLoadQueued) this.loadoutWeaponImageLoadQueued = false;

  const pendingLoads = [];
  for (const { slot, typeId } of this._getAllLoadoutWeaponEntries()) {
    const source = this._getLoadoutWeaponImageSource(slot, typeId);
    if (!source || !source.textureKey || !source.path) continue;
    if (this.textures.exists(source.textureKey)) continue;
    if (this.loadoutWeaponImageAttempts[source.textureKey]) continue;
    this.loadoutWeaponImageAttempts[source.textureKey] = true;
    pendingLoads.push(source);
  }

  if (pendingLoads.length === 0 || this.load.isLoading()) return;

  const refreshMenu = () => {
    this.loadoutWeaponImageLoadQueued = false;
    if (!this.gameStarted && (this.loadoutMenuElements?.length || this.loadoutContentElements?.length)) {
      this._rebuildLoadoutMenu();
    }
  };

  if (!this.loadoutWeaponImageLoadQueued) {
    this.loadoutWeaponImageLoadQueued = true;
    this.load.once('complete', refreshMenu);
  }

  for (const source of pendingLoads) {
    this.load.image(source.textureKey, source.path);
  }
  this.load.start();
};

MainScene.prototype._getLoadoutLayoutMetrics = function (contentH, tab) {
  const headerTop = 62;
  const cardsY = 294;
  const detailY = tab === 'right' ? 450 : 460;
  const detailH = tab === 'right' ? 68 : 76;
  const startButtonY = tab === 'right' ? 632 : 600;
  const summaryY = tab === 'right' ? 590 : (startButtonY - 42);
  return {
    headerTitleY: headerTop,
    headerBadgeY: headerTop + 24,
    headerDescY: headerTop + 52,
    cardsY,
    detailY,
    detailH,
    summaryY,
    startButtonY,
  };
};

MainScene.prototype._buildLoadoutSummary = function (tab, D, y) {
  const x = WIDTH / 2;
  const boxW = WIDTH - 64;
  const summaryParts = [
    this._getLocalizedWeaponName('left', this.selectedTowerWeaponTypes.left),
    this._getLocalizedWeaponName('center', this.selectedMainWeaponCoreId),
    this._getLocalizedWeaponName('right', this.selectedTowerWeaponTypes.right),
  ];
  if (tab === 'right') {
    summaryParts.push(this._getLocalizedRightUltimateName(this.rightUltType));
  }
  const summaryText = summaryParts.join(' \u00B7 ');
  const body = this.add.text(x, y, `${getUiText('loadout.summary.title')}: ${summaryText}`, {
    fontFamily: 'Arial',
    fontSize: '8px',
    color: '#c7d3db',
    align: 'center',
    wordWrap: { width: boxW - 10 },
  }).setOrigin(0.5).setDepth(D + 3);
  const boxH = Math.max(18, Math.min(24, body.height + 4));
  const summaryBg = this.add.rectangle(x, y, boxW, boxH, 0x0c1620, 0.58)
    .setDepth(D + 2)
    .setStrokeStyle(1, 0x243a4d, 0.55);

  this.loadoutContentElements.push(summaryBg, body);
};

MainScene.prototype._buildLoadoutWeaponCards = function (slot, D, cardY) {
  const entries = slot === 'center'
    ? getMainWeaponCoreCards().map((card) => [card.id, card])
    : Object.entries(TOWER_WEAPON_TYPES[slot] || {});
  if (entries.length === 0) {
    const placeholder = this.add.text(WIDTH / 2, cardY, getUiText('loadout.placeholder.weapon_choices_later'), {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#334455',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(D + 2);
    this.loadoutContentElements.push(placeholder);
    return;
  }

  const isSingleCard = entries.length === 1;
  const horizontalInset = 18;
  const availableW = WIDTH - horizontalInset * 2;
  const gap = isSingleCard ? 0 : Phaser.Math.Clamp(Math.floor(availableW * 0.025), 10, 22);
  const cardW = isSingleCard
    ? Math.min(availableW - 80, 280)
    : Math.floor((availableW - gap * Math.max(0, entries.length - 1)) / entries.length);
  const cardH = 198;
  const totalW = entries.length * cardW + Math.max(0, entries.length - 1) * gap;
  const startX = horizontalInset + (availableW - totalW) / 2 + cardW / 2;

  entries.forEach(([typeId], index) => {
    const x = startX + index * (cardW + gap);
    const isSelected = slot === 'center'
      ? this.selectedMainWeaponCoreId === typeId
      : this.selectedTowerWeaponTypes[slot] === typeId;
    const weaponLabel = this._getLocalizedWeaponName(slot, typeId);
    const imageKey = this._getLoadoutWeaponImageKey(slot, typeId);
    const imageAreaW = Math.max(Math.floor(cardW * 0.9), 86);
    const imageAreaH = Math.max(Math.floor(cardH * 0.82), 150);
    const imageAreaY = cardY - 10;

    const cardBg = this.add.rectangle(x, cardY, cardW, cardH, isSelected ? 0x163a52 : 0x0f1822, isSelected ? 0.92 : 0.78)
      .setDepth(D + 2)
      .setStrokeStyle(isSelected ? 4 : 2, isSelected ? 0x81e9ff : 0x31485b, isSelected ? 1 : 0.9)
      .setInteractive({ useHandCursor: true });

    const imageFrame = this.add.rectangle(
      x,
      imageAreaY,
      imageAreaW,
      imageAreaH,
      isSelected ? 0x132735 : 0x0d1720,
      isSelected ? 0.92 : 0.8,
    )
      .setDepth(D + 3)
      .setStrokeStyle(2, isSelected ? 0x63d8ff : 0x2e4558, 0.95);

    let imageEl = null;
    if (imageKey && this.textures.exists(imageKey)) {
      imageEl = this.add.image(x, imageAreaY, imageKey)
        .setDepth(D + 4)
        .setDisplaySize(imageAreaW - 6, imageAreaH - 6);
    } else {
      const placeholderBox = this.add.rectangle(
        x,
        imageAreaY,
        imageAreaW - 8,
        imageAreaH - 8,
        isSelected ? 0x173240 : 0x101a24,
        1,
      )
        .setDepth(D + 4)
        .setStrokeStyle(1, isSelected ? 0x4fbfe0 : 0x31485b, 0.95);
      const placeholderMark = this.add.text(x, imageAreaY, '+', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: isSelected ? '#9fe7ff' : '#587080',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(D + 5);
      imageEl = [placeholderBox, placeholderMark];
    }

    const title = this.add.text(x, cardY + 86, weaponLabel, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: isSelected ? '#d8eef7' : '#91a5b3',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.max(cardW - 10, 72) },
      maxLines: 2,
    }).setOrigin(0.5).setDepth(D + 3);

    cardBg.on('pointerup', () => {
      if (slot === 'center') {
        if (this.selectedMainWeaponCoreId === typeId) return;
        this.selectedMainWeaponCoreId = typeId;
        syncSelectedMainWeaponCoreTags(this);
      } else {
        if (this.selectedTowerWeaponTypes[slot] === typeId) return;
        this.selectedTowerWeaponTypes[slot] = typeId;
      }
      this._refreshLoadoutTabLabels();
      this._buildLoadoutPage(slot, D, HEIGHT - LOADOUT_MENU_TAB_HEIGHT);
    });

    this.loadoutContentElements.push(cardBg, imageFrame, title);
    if (Array.isArray(imageEl)) {
      this.loadoutContentElements.push(...imageEl);
    } else if (imageEl) {
      this.loadoutContentElements.push(imageEl);
    }
  });
};

MainScene.prototype._buildSelectedWeaponDetail = function (slot, D, y, panelH) {
  const typeId = this._getSelectedLoadoutTypeId(slot);
  const titleText = this._getLocalizedWeaponName(slot, typeId);
  const descText = this._getLocalizedWeaponDesc(slot, typeId);
  const shortDesc = this._truncateLoadoutDetailText(descText, 112);
  const panelW = WIDTH - 52;
  const panelBg = this.add.rectangle(WIDTH / 2, y, panelW, panelH, 0x0b1620, 0.58)
    .setDepth(D + 2)
    .setStrokeStyle(1, 0x2a4357, 0.55);
  const panelTitle = this.add.text(WIDTH / 2, y - panelH / 2 + 16, titleText, {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#eef4f8',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: panelW - 24 },
  }).setOrigin(0.5).setDepth(D + 3);
  const panelBody = this.add.text(WIDTH / 2, y + 10, shortDesc, {
    fontFamily: 'Arial',
    fontSize: '11px',
    color: '#8ca0ad',
    align: 'center',
    wordWrap: { width: panelW - 24 },
  }).setOrigin(0.5).setDepth(D + 3);

  this.loadoutContentElements.push(panelBg, panelTitle, panelBody);
  return y + panelH / 2;
};

MainScene.prototype._refreshLoadoutTabLabels = function () {
  for (const [slot, objs] of Object.entries(this.loadoutTabObjects)) {
    if (!objs?.wepText) continue;
    const typeId = slot === 'center'
      ? this.selectedMainWeaponCoreId
      : this.selectedTowerWeaponTypes[slot];
    objs.wepText.setText(this._getLocalizedWeaponName(slot, typeId));
  }
};

MainScene.prototype._buildRightUltimateSelector = function (D, topY) {
  const optionEntries = Object.keys(RIGHT_TOWER_ULTIMATE_TYPES);
  const titleY = topY;
  const cardY = topY + 44;
  const cardW = 148;
  const cardH = 50;
  const gap = 16;
  const totalW = optionEntries.length * cardW + (optionEntries.length - 1) * gap;
  const startX = WIDTH / 2 - totalW / 2 + cardW / 2;

  const title = this.add.text(WIDTH / 2, titleY, getUiText('loadout.right_ultimate.title'), {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#eef4f8',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 3);

  const subtitle = this.add.text(WIDTH / 2, titleY + 22, getUiText('loadout.right_ultimate.subtitle'), {
    fontFamily: 'Arial',
    fontSize: '10px',
    color: '#7f95a8',
    align: 'center',
    wordWrap: { width: WIDTH - 96 },
  }).setOrigin(0.5).setDepth(D + 3);

  this.loadoutContentElements.push(title, subtitle);

  optionEntries.forEach((typeId, index) => {
    const x = startX + index * (cardW + gap);
    const isSelected = this.rightUltType === typeId;

    const cardBg = this.add.rectangle(x, cardY, cardW, cardH, isSelected ? 0x163a52 : 0x0f1822, isSelected ? 0.92 : 0.78)
      .setDepth(D + 2)
      .setStrokeStyle(isSelected ? 3 : 2, isSelected ? 0x81e9ff : 0x31485b, isSelected ? 1 : 0.9)
      .setInteractive({ useHandCursor: true });

    const nameText = this.add.text(x, cardY - 12, this._getLocalizedRightUltimateName(typeId), {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: isSelected ? '#ffffff' : '#c5d2db',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(D + 3);

    const descText = this.add.text(x, cardY + 12, this._getLocalizedRightUltimateDesc(typeId), {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: isSelected ? '#9fe7ff' : '#667788',
      align: 'center',
      wordWrap: { width: cardW - 18 },
    }).setOrigin(0.5).setDepth(D + 3);

    cardBg.on('pointerup', () => {
      if (this.rightUltType === typeId) return;
      this.rightUltType = typeId;
      this._buildLoadoutPage('right', D, HEIGHT - LOADOUT_MENU_TAB_HEIGHT);
    });

    this.loadoutContentElements.push(cardBg, nameText, descText);
  });
};

MainScene.prototype._truncateLoadoutDetailText = function (text, maxChars) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trim()}...`;
};

MainScene.prototype._getLoadoutWeaponImageKey = function (slot, typeId) {
  const source = this._getLoadoutWeaponImageSource(slot, typeId);
  if (!source?.textureKey) return null;
  return this.textures.exists(source.textureKey) ? source.textureKey : null;
};

MainScene.prototype._getLoadoutWeaponImageSource = function (slot, typeId) {
  const meta = this._getLoadoutWeaponImageMeta(slot, typeId);
  if (!meta) return null;

  const explicitKey = meta.loadoutImageKey || meta.imageKey || meta.iconKey || null;
  if (explicitKey && this.textures.exists(explicitKey)) {
    return { textureKey: explicitKey, path: null };
  }

  const explicitPath = meta.loadoutImagePath || meta.imagePath || meta.iconPath || null;
  if (explicitPath) {
    return {
      textureKey: explicitKey || `loadout:${slot}:${typeId}`,
      path: explicitPath,
    };
  }

  const safeTypeId = String(typeId || '').trim();
  if (!safeTypeId) return explicitKey ? { textureKey: explicitKey, path: null } : null;

  const fallbackTextureKey = explicitKey || `loadout:${slot}:${safeTypeId}`;
  const fallbackPath = `assets/ui/loadout/${safeTypeId}.png`;
  return {
    textureKey: fallbackTextureKey,
    path: fallbackPath,
  };
};

MainScene.prototype._getLoadoutWeaponImageMeta = function (slot, typeId) {
  if (slot === 'center') {
    const card = getMainWeaponCoreCardById(typeId);
    return card || null;
  }
  const weaponDef = TOWER_WEAPON_TYPES[slot]?.[typeId];
  return weaponDef || null;
};

MainScene.prototype._getSelectedLoadoutTypeId = function (slot) {
  return slot === 'center'
    ? this.selectedMainWeaponCoreId
    : this.selectedTowerWeaponTypes[slot];
};

MainScene.prototype._getLoadoutCardRoleLabel = function (slot) {
  return getUiText(`loadout.card_role.${slot}`);
};

MainScene.prototype._getLocalizedWeaponName = function (slot, typeId) {
  if (slot === 'center') {
    const card = getMainWeaponCoreCardById(typeId);
    if (!card) return typeId || '';
    if (card.labelKey) return getUiTextFormat(card.labelKey, getCardTextVars(card, this));
    return card.label || card.id;
  }
  const key = `weapons.${slot}.${typeId}.name`;
  const localized = getUiText(key);
  if (localized !== key) return localized;
  return TOWER_WEAPON_TYPES[slot]?.[typeId]?.label || typeId;
};

MainScene.prototype._getLocalizedWeaponDesc = function (slot, typeId) {
  if (slot === 'center') {
    const card = getMainWeaponCoreCardById(typeId);
    if (!card) return '';
    if (card.descKey) return getUiTextFormat(card.descKey, getCardTextVars(card, this));
    return card.desc || '';
  }
  const key = `weapons.${slot}.${typeId}.desc`;
  const localized = getUiText(key);
  if (localized !== key) return localized;
  return '';
};

MainScene.prototype._getLocalizedRightUltimateName = function (typeId) {
  const key = `weapons.ultimates.${typeId}.name`;
  const localized = getUiText(key);
  if (localized !== key) return localized;
  return RIGHT_TOWER_ULTIMATE_TYPES[typeId]?.label || typeId;
};

MainScene.prototype._getLocalizedRightUltimateDesc = function (typeId) {
  const key = `weapons.ultimates.${typeId}.desc`;
  const localized = getUiText(key);
  if (localized !== key) return localized;
  return '';
};

MainScene.prototype._selectLoadoutTab = function (tab) {
  this.loadoutSelectedTab = tab;
  const D = 290;
  const contentH = HEIGHT - LOADOUT_MENU_TAB_HEIGHT;
  this._buildLoadoutPage(tab, D, contentH);

  for (const [slot, objs] of Object.entries(this.loadoutTabObjects)) {
    const isSel = slot === tab;
    const fillAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_FILL_ALPHA : LOADOUT_MENU_TAB_DIM_FILL_ALPHA;
    const strokeAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_STROKE_ALPHA : LOADOUT_MENU_TAB_DIM_STROKE_ALPHA;
    const textAlpha = isSel ? LOADOUT_MENU_TAB_SELECTED_TEXT_ALPHA : LOADOUT_MENU_TAB_DIM_TEXT_ALPHA;
    const bgColor = isSel ? LOADOUT_MENU_TAB_SELECTED_COLOR : LOADOUT_MENU_TAB_DIM_COLOR;
    const stroke = isSel ? LOADOUT_MENU_TAB_STROKE_SELECTED : LOADOUT_MENU_TAB_STROKE_DIM;
    objs.bg.setFillStyle(bgColor, fillAlpha)
      .setStrokeStyle(isSel ? 2 : 1, stroke, strokeAlpha);
    objs.roleText.setAlpha(textAlpha).setColor(isSel ? '#d8e8f0' : '#556677');
    objs.wepText.setAlpha(textAlpha).setColor(isSel ? '#5ad2f0' : '#334455');
  }
};

MainScene.prototype._destroyLoadoutMenu = function () {
  applySelectedMainWeaponCore(this);
  this.unlockAudioOnce();
  if (!this.bgmStarted) {
    this.bgmStarted = true;
    try {
      if (this.sfx?.bgm && !this.sfx.bgm.isPlaying) this.sfx.bgm.play();
    } catch (e) {}
  }
  for (const el of this.loadoutContentElements) { if (el?.destroy) el.destroy(); }
  this.loadoutContentElements = [];
  for (const el of this.loadoutMenuElements) { if (el?.destroy) el.destroy(); }
  this.loadoutMenuElements = [];
  this.loadoutTabObjects = {};
  this.gameStarted = true;
};
