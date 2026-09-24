// ══════════════════════════════════════════════
//  phaser-extension.js
//  Self-contained Phaser 3 extension.
//  Depends on: phaser-scene.js, phaser-assets.js,
//    phaser-display.js, phaser-physics.js,
//    phaser-input.js, phaser-fx.js  (all loaded
//    before this file in index.html)
// ══════════════════════════════════════════════

// ── Generator helpers (lazy — use window refs) ──
const _ph = {
  f:    (block, name)       => block.getFieldValue(name) || '',
  expr: (block, name)       => window.exprToJS(block.getInputTargetBlock(name)),
  stmt: (block, name, ind)  => {
    let child = block.getInputTargetBlock(name), out = '';
    while (child) { out += window.blockToJS(child, ind); child = child.getNextBlock(); }
    return out;
  },
  pad:  (n) => '  '.repeat(n)
};

// ══════════════════════════════════════════════
ExtensionRegistry.register('phaser', {

  name:        'Phaser 3',
  version:     '3.70',
  description: 'Game development framework. Build 2D games with scenes, physics, input, and animations.',
  targetLanguages: ['js'],
  color:       '#E65100',
  shadow:      '#8d3200',
  iconSvg:     '<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v1H6v-3h2v1h3V9h2v5h-2v-1zm4.5 1L13 9h2l1 3 1-3h2l-1.5 5h-2z" fill="white"/>',

  // Phaser CDN — injected into <head> on first activation
  scripts: [
    'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js'
  ],

  // ── Toolbox categories with metadata ──
  categories: {
    'ph:scene': {
      label: '',
      colour: '#1B5E20',
      icon: {
        color: '#1B5E20',
        shadow: '#0a2d0c',
        svg: '<path d="M4 6h16v2H4zm8-4l-8 4h16zm4 14H8l-4 4h16z" fill="white"/>'
      },
      blocks: [
        'js_phaser_game', 'js_phaser_scene', 'js_phaser_constructor',
        'js_phaser_preload', 'js_phaser_create', 'js_phaser_update',
        'js_phaser_this_assign', 'js_phaser_this_prop',
        'js_phaser_scene_start', 'js_phaser_scene_restart'
      ]
    },
    'ph:assets': {
      label: '',
      colour: '#E65100',
      icon: {
        color: '#E65100',
        shadow: '#8d3200',
        svg: '<path d="M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 0 0-6 0 3 3 0 0 0-6 0c0 .14.11.56.18 1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 5a1 1 0 0 1 2 0c0 .55-.45 2-1 2S9 5.55 9 5zm3 14H6v-2h6v2zm0-4H6v-2h6v2zm6 4h-4v-6h4v6zm0-8H6V9h12v2z" fill="white"/>'
      },
      blocks: [
        'js_phaser_load_image', 'js_phaser_load_spritesheet', 'js_phaser_load_audio',
        'js_phaser_sound_play', 'js_phaser_sound_add'
      ]
    },
    'ph:display': {
      label: '',
      colour: '#4A148C',
      icon: {
        color: '#4A148C',
        shadow: '#1a0040',
        svg: '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="white"/>'
      },
      blocks: [
        'js_phaser_add_image', 'js_phaser_add_sprite', 'js_phaser_add_text',
        'js_phaser_add_rect', 'js_phaser_set_text', 'js_phaser_set_position',
        'js_phaser_destroy', 'js_phaser_set_active'
      ]
    },
    'ph:physics': {
      label: '',
      colour: '#0D47A1',
      icon: {
        color: '#0D47A1',
        shadow: '#001970',
        svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/>'
      },
      blocks: [
        'js_phaser_physics_sprite', 'js_phaser_static_group', 'js_phaser_dynamic_group',
        'js_phaser_group_create', 'js_phaser_collider', 'js_phaser_overlap',
        'js_phaser_set_velocity', 'js_phaser_set_bounce', 'js_phaser_world_bounds',
        'js_phaser_gravity', 'js_phaser_body_touching'
      ]
    },
    'ph:input': {
      label: '',
      colour: '#006064',
      icon: {
        color: '#006064',
        shadow: '#002b2e',
        svg: '<path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-3-4l-2 4h4z" fill="white"/>'
      },
      blocks: [
        'js_phaser_cursors', 'js_phaser_add_key', 'js_phaser_key_is_down',
        'js_phaser_key_just_down', 'js_phaser_pointer_on'
      ]
    },
    'ph:fx': {
      label: '',
      colour: '#880E4F',
      icon: {
        color: '#880E4F',
        shadow: '#4a0029',
        svg: '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white"/>'
      },
      blocks: [
        'js_phaser_anim_create', 'js_phaser_anim_play', 'js_phaser_set_frame',
        'js_phaser_flip_x', 'js_phaser_camera_follow', 'js_phaser_camera_bounds',
        'js_phaser_tween', 'js_phaser_timer', 'js_phaser_math_between'
      ]
    }
  },

  // ── Generator registration (called once on first activation) ──
  init() {

    const EXPR = {

      // Scene
      'js_phaser_this_prop':       (b) => `this.${_ph.f(b,'PROP')}`,

      // Display (all return objects)
      'js_phaser_add_image':       (b) =>
        `this.add.image(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, "${_ph.f(b,'KEY')}")`,
      'js_phaser_add_sprite':      (b) =>
        `this.add.sprite(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, "${_ph.f(b,'KEY')}")`,
      'js_phaser_add_text':        (b) =>
        `this.add.text(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, "${_ph.f(b,'TEXT')}", { fontSize: "${_ph.f(b,'SIZE')}", color: "${_ph.f(b,'COLOR')}" })`,
      'js_phaser_add_rect':        (b) =>
        `this.add.rectangle(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, ${_ph.f(b,'W')}, ${_ph.f(b,'H')}, 0x${_ph.f(b,'COLOR')})`,

      // Physics
      'js_phaser_physics_sprite':  (b) =>
        `this.physics.add.sprite(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, "${_ph.f(b,'KEY')}")`,
      'js_phaser_static_group':    ()  => `this.physics.add.staticGroup()`,
      'js_phaser_dynamic_group':   ()  => `this.physics.add.group()`,
      'js_phaser_group_create':    (b) =>
        `${_ph.expr(b,'GROUP')}.create(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, "${_ph.f(b,'KEY')}")`,
      'js_phaser_body_touching':   (b) =>
        `${_ph.expr(b,'SPRITE')}.body.blocked.${_ph.f(b,'DIR')}`,

      // Input
      'js_phaser_cursors':         ()  => `this.input.keyboard.createCursorKeys()`,
      'js_phaser_add_key':         (b) =>
        `this.input.keyboard.addKey("${_ph.f(b,'KEY')}")`,
      'js_phaser_key_is_down':     (b) =>
        `${_ph.expr(b,'CURSORS')}.${_ph.f(b,'KEY')}.isDown`,
      'js_phaser_key_just_down':   (b) =>
        `Phaser.Input.Keyboard.JustDown(${_ph.expr(b,'KEY')})`,

      // FX
      'js_phaser_math_between':    (b) =>
        `Phaser.Math.Between(${_ph.f(b,'MIN')}, ${_ph.f(b,'MAX')})`,

      // Assets
      'js_phaser_sound_add':       (b) =>
        `this.sound.add("${_ph.f(b,'KEY')}", { loop: ${_ph.f(b,'LOOP')} })`
    };

    const STMT = {

      // Scene structure
      'js_phaser_game': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}new Phaser.Game({\n${p}  type: Phaser.AUTO,\n${p}  width: ${_ph.f(b,'WIDTH')},\n${p}  height: ${_ph.f(b,'HEIGHT')},\n${p}  physics: { default: "${_ph.f(b,'PHYSICS')}", ${_ph.f(b,'PHYSICS')}: { gravity: { y: 300 } } },\n${p}  scene: [${_ph.f(b,'SCENE')}]\n${p}});\n`;
      },
      'js_phaser_scene': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}class ${_ph.f(b,'NAME')} extends Phaser.Scene {\n${_ph.stmt(b,'BODY',ind+1)}${p}}\n`;
      },
      'js_phaser_constructor': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}constructor() {\n${p}  super("${_ph.f(b,'KEY')}");\n${_ph.stmt(b,'BODY',ind+1)}${p}}\n`;
      },
      'js_phaser_preload': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}preload() {\n${_ph.stmt(b,'BODY',ind+1)}${p}}\n`;
      },
      'js_phaser_create': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}create() {\n${_ph.stmt(b,'BODY',ind+1)}${p}}\n`;
      },
      'js_phaser_update': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}update() {\n${_ph.stmt(b,'BODY',ind+1)}${p}}\n`;
      },
      'js_phaser_this_assign': (b, ind) =>
        `${_ph.pad(ind)}this.${_ph.f(b,'PROP')} = ${_ph.expr(b,'VALUE')};\n`,
      'js_phaser_scene_start': (b, ind) =>
        `${_ph.pad(ind)}this.scene.start("${_ph.f(b,'KEY')}");\n`,
      'js_phaser_scene_restart': (b, ind) =>
        `${_ph.pad(ind)}this.scene.restart();\n`,

      // Assets
      'js_phaser_load_image': (b, ind) =>
        `${_ph.pad(ind)}this.load.image("${_ph.f(b,'KEY')}", "${_ph.f(b,'URL')}");\n`,
      'js_phaser_load_spritesheet': (b, ind) =>
        `${_ph.pad(ind)}this.load.spritesheet("${_ph.f(b,'KEY')}", "${_ph.f(b,'URL')}", { frameWidth: ${_ph.f(b,'FW')}, frameHeight: ${_ph.f(b,'FH')} });\n`,
      'js_phaser_load_audio': (b, ind) =>
        `${_ph.pad(ind)}this.load.audio("${_ph.f(b,'KEY')}", "${_ph.f(b,'URL')}");\n`,
      'js_phaser_sound_play': (b, ind) =>
        `${_ph.pad(ind)}this.sound.play("${_ph.f(b,'KEY')}");\n`,

      // Display
      'js_phaser_set_text': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'TEXT_OBJ')}.setText(${_ph.expr(b,'VALUE')});\n`,
      'js_phaser_set_position': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'OBJ')}.setPosition(${_ph.expr(b,'X')}, ${_ph.expr(b,'Y')});\n`,
      'js_phaser_destroy': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'OBJ')}.destroy();\n`,
      'js_phaser_set_active': (b, ind) => {
        const v = _ph.f(b,'VALUE').split(' ')[0]; // strip label text
        return `${_ph.pad(ind)}${_ph.expr(b,'OBJ')}.setActive(${v}).setVisible(${v});\n`;
      },

      // Physics
      'js_phaser_collider': (b, ind) =>
        `${_ph.pad(ind)}this.physics.add.collider(${_ph.expr(b,'OBJ1')}, ${_ph.expr(b,'OBJ2')});\n`,
      'js_phaser_overlap': (b, ind) =>
        `${_ph.pad(ind)}this.physics.add.overlap(${_ph.expr(b,'OBJ1')}, ${_ph.expr(b,'OBJ2')}, ${_ph.expr(b,'CALLBACK')});\n`,
      'js_phaser_set_velocity': (b, ind) => {
        const axis = _ph.f(b,'AXIS'); // 'X', 'Y', or ''
        return axis
          ? `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setVelocity${axis}(${_ph.expr(b,'VALUE')});\n`
          : `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setVelocity(${_ph.expr(b,'VALUE')});\n`;
      },
      'js_phaser_set_bounce': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setBounce(${_ph.f(b,'VALUE')});\n`,
      'js_phaser_world_bounds': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setCollideWorldBounds(${_ph.f(b,'VALUE')});\n`,
      'js_phaser_gravity': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setGravityY(${_ph.f(b,'VALUE')});\n`,

      // Input
      'js_phaser_pointer_on': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}this.input.on("${_ph.f(b,'EVENT')}", (pointer) => {\n${_ph.stmt(b,'BODY',ind+1)}${p}});\n`;
      },

      // FX — Animations
      'js_phaser_anim_create': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}this.anims.create({\n${p}  key: "${_ph.f(b,'KEY')}",\n${p}  frames: this.anims.generateFrameNumbers("${_ph.f(b,'SPRITE_KEY')}", { start: ${_ph.f(b,'START')}, end: ${_ph.f(b,'END')} }),\n${p}  frameRate: ${_ph.f(b,'RATE')},\n${p}  repeat: ${_ph.f(b,'REPEAT')}\n${p}});\n`;
      },
      'js_phaser_anim_play': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.anims.play("${_ph.f(b,'KEY')}", ${_ph.f(b,'IGNORE') === 'true'});\n`,
      'js_phaser_set_frame': (b, ind) =>
        `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setFrame(${_ph.f(b,'FRAME')});\n`,
      'js_phaser_flip_x': (b, ind) => {
        const v = _ph.f(b,'VALUE').split(' ')[0]; // strip label text
        return `${_ph.pad(ind)}${_ph.expr(b,'SPRITE')}.setFlipX(${v});\n`;
      },

      // FX — Camera
      'js_phaser_camera_follow': (b, ind) =>
        `${_ph.pad(ind)}this.cameras.main.startFollow(${_ph.expr(b,'TARGET')});\n`,
      'js_phaser_camera_bounds': (b, ind) =>
        `${_ph.pad(ind)}this.cameras.main.setBounds(${_ph.f(b,'X')}, ${_ph.f(b,'Y')}, ${_ph.f(b,'W')}, ${_ph.f(b,'H')});\n`,

      // FX — Tween
      'js_phaser_tween': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}this.tweens.add({\n${p}  targets: ${_ph.expr(b,'TARGET')},\n${p}  ${_ph.f(b,'PROP')}: ${_ph.f(b,'TO')},\n${p}  duration: ${_ph.f(b,'DURATION')},\n${p}  ease: "${_ph.f(b,'EASE')}"\n${p}});\n`;
      },

      // FX — Timer
      'js_phaser_timer': (b, ind) => {
        const p = _ph.pad(ind);
        return `${p}this.time.addEvent({\n${p}  delay: ${_ph.f(b,'DELAY')},\n${p}  loop: ${_ph.f(b,'LOOP')},\n${p}  callback: () => {\n${_ph.stmt(b,'BODY',ind+2)}${p}  }\n${p}});\n`;
      }
    };

    ExtensionRegistry.registerGenerators(EXPR, STMT);
  }

});