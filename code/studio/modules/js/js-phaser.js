// ══════════════════════════════════════════════
//  js-phaser.js — Phaser 3 Blocks
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([
  
  // ── SCENE STRUCTURE ───────────────────────────
  
  {
    "type": "js_phaser_game",
    "message0": "new Phaser.Game( width: %1  height: %2  physics: %3  scene: %4 )",
    "args0": [
      { "type": "field_number", "name": "WIDTH", "value": 800 },
      { "type": "field_number", "name": "HEIGHT", "value": 600 },
      {
        "type": "field_dropdown",
        "name": "PHYSICS",
        "options": [
          ["arcade", "arcade"],
          ["matter", "matter"],
          ["none", "none"]
        ]
      },
      { "type": "field_input", "name": "SCENE", "text": "GameScene" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Create and launch a Phaser 3 game instance.\n\nGenerates:\n  new Phaser.Game({\n    width: 800,\n    height: 600,\n    physics: { default: 'arcade' },\n    scene: [GameScene]\n  });"
  },
  
  {
    "type": "js_phaser_scene",
    "message0": "class %1 extends Phaser.Scene {%2  %3}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "GameScene" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Define a Phaser Scene class.\nPlace constructor(), preload(), create(), and update() blocks inside.\n\nGenerates:\n  class GameScene extends Phaser.Scene { ... }"
  },
  
  {
    "type": "js_phaser_constructor",
    "message0": "constructor() { super(\"%1\");%2  %3}",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "GameScene" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Scene constructor — runs once when the class is defined.\nThe key passed to super() must match the class name.\nDeclare scene properties here (this.player = null).\n\nGenerates:\n  constructor() { super('GameScene'); ... }"
  },
  
  {
    "type": "js_phaser_preload",
    "message0": "preload() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs before the scene starts — load all assets here.\nPhaser waits for everything to finish loading before calling create().\n\nGenerates:  preload() { ... }"
  },
  
  {
    "type": "js_phaser_create",
    "message0": "create() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs once when assets are loaded — set up sprites, physics, input, and animations here.\n\nGenerates:  create() { ... }"
  },
  
  {
    "type": "js_phaser_update",
    "message0": "update() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs every frame (~60fps) — handle movement and game logic here.\n\nGenerates:  update() { ... }"
  },
  
  {
    "type": "js_phaser_this_assign",
    "message0": "this.%1 = %2",
    "args0": [
      { "type": "field_input", "name": "PROP", "text": "player" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Store a value on the scene so it's accessible across preload / create / update.\n\nGenerates:  this.player = value;"
  },
  
  {
    "type": "js_phaser_this_prop",
    "message0": "this.%1",
    "args0": [{ "type": "field_input", "name": "PROP", "text": "player" }],
    "output": null,
    "colour": 20,
    "tooltip": "Read a scene property.\nUse to access variables stored on the scene (this.player, this.score, …)\n\nGenerates:  this.player"
  },
  
  {
    "type": "js_phaser_scene_start",
    "message0": "this.scene.start(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "GameScene" }],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Stop the current scene and launch a different one.\n\nGenerates:  this.scene.start('GameScene');"
  },
  
  {
    "type": "js_phaser_scene_restart",
    "message0": "this.scene.restart()",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Restart the current scene from the beginning.\n\nGenerates:  this.scene.restart();"
  },
  
  // ── LOAD ─────────────────────────────────────
  
  {
    "type": "js_phaser_load_image",
    "message0": "this.load.image(\"%1\", \"%2\")",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "sky" },
      { "type": "field_input", "name": "URL", "text": "assets/sky.png" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Load a static image asset.\n  key → name used to reference it in create()\n  URL → path to the image file\n\nGenerates:  this.load.image('sky', 'assets/sky.png');"
  },
  
  {
    "type": "js_phaser_load_spritesheet",
    "message0": "this.load.spritesheet(\"%1\", \"%2\", frameW: %3  frameH: %4)",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "player" },
      { "type": "field_input", "name": "URL", "text": "assets/player.png" },
      { "type": "field_number", "name": "FW", "value": 32 },
      { "type": "field_number", "name": "FH", "value": 48 }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Load a spritesheet for frame-based animations.\nSpecify each frame's pixel dimensions.\n\nGenerates:\n  this.load.spritesheet('player', 'assets/player.png',\n    { frameWidth: 32, frameHeight: 48 });"
  },
  
  {
    "type": "js_phaser_load_audio",
    "message0": "this.load.audio(\"%1\", \"%2\")",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "jump" },
      { "type": "field_input", "name": "URL", "text": "assets/jump.mp3" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Load an audio file.\n\nGenerates:  this.load.audio('jump', 'assets/jump.mp3');"
  },
  
  // ── ADD (DISPLAY OBJECTS) ─────────────────────
  
  {
    "type": "js_phaser_add_image",
    "message0": "this.add.image(%1, %2, \"%3\")",
    "args0": [
      { "type": "field_number", "name": "X", "value": 400 },
      { "type": "field_number", "name": "Y", "value": 300 },
      { "type": "field_input", "name": "KEY", "text": "sky" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 160,
    "tooltip": "Add a static (non-animated) image to the scene.\nReturns the image object — store it to update it later.\n\nGenerates:  this.add.image(400, 300, 'sky')"
  },
  
  {
    "type": "js_phaser_add_sprite",
    "message0": "this.add.sprite(%1, %2, \"%3\")",
    "args0": [
      { "type": "field_number", "name": "X", "value": 100 },
      { "type": "field_number", "name": "Y", "value": 100 },
      { "type": "field_input", "name": "KEY", "text": "player" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 160,
    "tooltip": "Add an animated sprite without physics.\nFor physics use physics.add.sprite instead.\n\nGenerates:  this.add.sprite(100, 100, 'player')"
  },
  
  {
    "type": "js_phaser_add_text",
    "message0": "this.add.text(%1, %2, \"%3\", size:\"%4\" color:\"%5\")",
    "args0": [
      { "type": "field_number", "name": "X", "value": 16 },
      { "type": "field_number", "name": "Y", "value": 16 },
      { "type": "field_input", "name": "TEXT", "text": "Score: 0" },
      { "type": "field_input", "name": "SIZE", "text": "32px" },
      { "type": "field_input", "name": "COLOR", "text": "#ffffff" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 160,
    "tooltip": "Add text to the scene.\nReturns the text object — call .setText(value) to update it.\n\nGenerates:\n  this.add.text(16, 16, 'Score: 0',\n    { fontSize: '32px', color: '#ffffff' })"
  },
  
  {
    "type": "js_phaser_add_rect",
    "message0": "this.add.rectangle(%1, %2, %3, %4, 0x%5)",
    "args0": [
      { "type": "field_number", "name": "X", "value": 400 },
      { "type": "field_number", "name": "Y", "value": 300 },
      { "type": "field_number", "name": "W", "value": 200 },
      { "type": "field_number", "name": "H", "value": 100 },
      { "type": "field_input", "name": "COLOR", "text": "ff0000" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 160,
    "tooltip": "Add a coloured rectangle shape.\nColor is a hex string without the # (e.g. ff0000 for red).\n\nGenerates:  this.add.rectangle(400, 300, 200, 100, 0xff0000)"
  },
  
  {
    "type": "js_phaser_set_text",
    "message0": "%1.setText(%2)",
    "args0": [
      { "type": "input_value", "name": "TEXT_OBJ" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Update the string displayed by a text object.\n\nGenerates:  scoreText.setText(value);"
  },
  
  {
    "type": "js_phaser_set_position",
    "message0": "%1.setPosition(%2, %3)",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      { "type": "input_value", "name": "X" },
      { "type": "input_value", "name": "Y" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Move a game object to an absolute position.\n\nGenerates:  obj.setPosition(x, y);"
  },
  
  // ── PHYSICS ───────────────────────────────────
  
  {
    "type": "js_phaser_physics_sprite",
    "message0": "this.physics.add.sprite(%1, %2, \"%3\")",
    "args0": [
      { "type": "field_number", "name": "X", "value": 100 },
      { "type": "field_number", "name": "Y", "value": 450 },
      { "type": "field_input", "name": "KEY", "text": "player" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 65,
    "tooltip": "Add a sprite with arcade physics enabled.\nStore the result — you need it for colliders, velocity, etc.\n\nGenerates:  this.physics.add.sprite(100, 450, 'player')"
  },
  
  {
    "type": "js_phaser_static_group",
    "message0": "this.physics.add.staticGroup()",
    "output": null,
    "colour": 65,
    "tooltip": "Create a static physics group (non-moving objects like platforms/walls).\nUse group.create(x, y, key) to add members.\n\nGenerates:  this.physics.add.staticGroup()"
  },
  
  {
    "type": "js_phaser_dynamic_group",
    "message0": "this.physics.add.group()",
    "output": null,
    "colour": 65,
    "tooltip": "Create a dynamic physics group (moving objects like enemies or bullets).\n\nGenerates:  this.physics.add.group()"
  },
  
  {
    "type": "js_phaser_group_create",
    "message0": "%1.create(%2, %3, \"%4\")",
    "args0": [
      { "type": "input_value", "name": "GROUP" },
      { "type": "field_number", "name": "X", "value": 0 },
      { "type": "field_number", "name": "Y", "value": 0 },
      { "type": "field_input", "name": "KEY", "text": "platform" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 65,
    "tooltip": "Add a new member to an existing physics group.\n\nGenerates:  group.create(0, 0, 'platform')"
  },
  
  {
    "type": "js_phaser_collider",
    "message0": "this.physics.add.collider(%1, %2)",
    "args0": [
      { "type": "input_value", "name": "OBJ1" },
      { "type": "input_value", "name": "OBJ2" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Make two objects (or a group) physically collide.\nPrevents them from passing through each other.\n\nGenerates:  this.physics.add.collider(player, platforms);"
  },
  
  {
    "type": "js_phaser_overlap",
    "message0": "this.physics.add.overlap(%1, %2, %3)",
    "args0": [
      { "type": "input_value", "name": "OBJ1" },
      { "type": "input_value", "name": "OBJ2" },
      { "type": "input_value", "name": "CALLBACK" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Detect when two objects overlap without blocking each other.\nCallback is called when overlap occurs.\n\nGenerates:  this.physics.add.overlap(player, coins, collectCoin);"
  },
  
  {
    "type": "js_phaser_set_velocity",
    "message0": "%1.setVelocity%2(%3)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      {
        "type": "field_dropdown",
        "name": "AXIS",
        "options": [
          ["X", "X"],
          ["Y", "Y"],
          ["", "(x,y)"]
        ]
      },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Set the velocity of a physics sprite.\n\n  X → horizontal speed (positive = right, negative = left)\n  Y → vertical speed (positive = down, negative = up)\n  (x,y) → pass both: use a string like '160, -300'\n\nGenerates:  sprite.setVelocityX(160);"
  },
  
  {
    "type": "js_phaser_set_bounce",
    "message0": "%1.setBounce(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      {
        "type": "field_number",
        "name": "VALUE",
        "value": 0.2,
        "min": 0,
        "max": 1,
        "precision": 0.1
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Set the bounciness of a physics object.\n  0 = no bounce\n  1 = full bounce (never loses energy)\n\nGenerates:  sprite.setBounce(0.2);"
  },
  
  {
    "type": "js_phaser_world_bounds",
    "message0": "%1.setCollideWorldBounds(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      {
        "type": "field_dropdown",
        "name": "VALUE",
        "options": [
          ["true", "true"],
          ["false", "false"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Prevent an object from leaving the game world boundary.\n\nGenerates:  sprite.setCollideWorldBounds(true);"
  },
  
  {
    "type": "js_phaser_gravity",
    "message0": "%1.setGravityY(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_number", "name": "VALUE", "value": 300 }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 65,
    "tooltip": "Apply extra gravity to one sprite only.\n  Positive → pulled down\n  Negative → floats up\n\nGenerates:  sprite.setGravityY(300);"
  },
  
  {
    "type": "js_phaser_body_touching",
    "message0": "%1.body.blocked.%2",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      {
        "type": "field_dropdown",
        "name": "DIR",
        "options": [
          ["down", "down"],
          ["up", "up"],
          ["left", "left"],
          ["right", "right"]
        ]
      }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 65,
    "tooltip": "Check if a physics body is touching a surface on a given side.\n\n  body.blocked.down → sprite is standing on something\n\nGenerates:  sprite.body.blocked.down"
  },
  
  // ── INPUT ─────────────────────────────────────
  
  {
    "type": "js_phaser_cursors",
    "message0": "this.input.keyboard.createCursorKeys()",
    "output": null,
    "colour": 290,
    "tooltip": "Create arrow key + shift + space handlers.\nStore in a variable, then check cursors.left.isDown etc.\n\nGenerates:  this.input.keyboard.createCursorKeys()"
  },
  
  {
    "type": "js_phaser_add_key",
    "message0": "this.input.keyboard.addKey(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "SPACE" }],
    "output": null,
    "colour": 290,
    "tooltip": "Create a single key handler.\n\nCommon values: SPACE, W, A, S, D, UP, DOWN, LEFT, RIGHT, SHIFT, ENTER, CTRL\n\nGenerates:  this.input.keyboard.addKey('SPACE')"
  },
  
  {
    "type": "js_phaser_key_is_down",
    "message0": "%1.%2.isDown",
    "args0": [
      { "type": "input_value", "name": "CURSORS" },
      {
        "type": "field_dropdown",
        "name": "KEY",
        "options": [
          ["left", "left"],
          ["right", "right"],
          ["up", "up"],
          ["down", "down"],
          ["space", "space"],
          ["shift", "shift"]
        ]
      }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 290,
    "tooltip": "Check if a cursor key is currently held down.\ntrue while the key is pressed.\n\nGenerates:  cursors.left.isDown"
  },
  
  {
    "type": "js_phaser_key_just_down",
    "message0": "Phaser.Input.Keyboard.JustDown(%1)",
    "args0": [{ "type": "input_value", "name": "KEY" }],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 290,
    "tooltip": "Returns true only on the single frame the key is first pressed.\nPrefer this over .isDown to avoid repeated firing.\n\nGenerates:  Phaser.Input.Keyboard.JustDown(key)"
  },
  
  {
    "type": "js_phaser_pointer_on",
    "message0": "this.input.on(\"%1\", (pointer) => {%2  %3})",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "EVENT",
        "options": [
          ["pointerdown", "pointerdown"],
          ["pointerup", "pointerup"],
          ["pointermove", "pointermove"]
        ]
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 290,
    "tooltip": "Listen for mouse / touch input.\nThe pointer object inside has .x and .y coordinates.\n\nGenerates:\n  this.input.on('pointerdown', (pointer) => {\n    ...\n  });"
  },
  
  // ── ANIMATION ─────────────────────────────────
  
  {
    "type": "js_phaser_anim_create",
    "message0": "this.anims.create( key:\"%1\"  sprite:\"%2\"  frames: %3–%4  rate: %5  repeat: %6 )",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "walk" },
      { "type": "field_input", "name": "SPRITE_KEY", "text": "player" },
      { "type": "field_number", "name": "START", "value": 0 },
      { "type": "field_number", "name": "END", "value": 3 },
      { "type": "field_number", "name": "RATE", "value": 10 },
      { "type": "field_number", "name": "REPEAT", "value": -1 }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "Define an animation from a range of spritesheet frames.\n\n  key    → animation name used in anims.play()\n  sprite → the spritesheet's load key\n  frames → start and end frame numbers\n  rate   → frames per second\n  repeat → -1 = loop forever, 0 = play once\n\nGenerates:\n  this.anims.create({\n    key: 'walk',\n    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),\n    frameRate: 10,\n    repeat: -1\n  });"
  },
  
  {
    "type": "js_phaser_anim_play",
    "message0": "%1.anims.play(\"%2\", %3)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_input", "name": "KEY", "text": "walk" },
      {
        "type": "field_dropdown",
        "name": "IGNORE",
        "options": [
          ["ignoreIfPlaying: true", "true"],
          ["restart: false", "false"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "Play an animation on a sprite.\nignoreIfPlaying: true → won't restart if already running.\n\nGenerates:  sprite.anims.play('walk', true);"
  },
  
  {
    "type": "js_phaser_set_frame",
    "message0": "%1.setFrame(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_number", "name": "FRAME", "value": 4 }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "Jump to a specific frame on a spritesheet.\nUseful for idle / standing poses.\n\nGenerates:  sprite.setFrame(4);"
  },
  
  {
    "type": "js_phaser_flip_x",
    "message0": "%1.setFlipX(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      {
        "type": "field_dropdown",
        "name": "VALUE",
        "options": [
          ["true (face left)", "true"],
          ["false (face right)", "false"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230,
    "tooltip": "Mirror a sprite horizontally.\n  true  → facing left\n  false → facing right\n\nGenerates:  sprite.setFlipX(true);"
  },
  
  // ── CAMERA ────────────────────────────────────
  
  {
    "type": "js_phaser_camera_follow",
    "message0": "this.cameras.main.startFollow(%1)",
    "args0": [{ "type": "input_value", "name": "TARGET" }],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 45,
    "tooltip": "Make the main camera track a sprite.\nCombine with setBounds to keep camera inside the map.\n\nGenerates:  this.cameras.main.startFollow(player);"
  },
  
  {
    "type": "js_phaser_camera_bounds",
    "message0": "this.cameras.main.setBounds(%1, %2, %3, %4)",
    "args0": [
      { "type": "field_number", "name": "X", "value": 0 },
      { "type": "field_number", "name": "Y", "value": 0 },
      { "type": "field_number", "name": "W", "value": 3200 },
      { "type": "field_number", "name": "H", "value": 600 }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 45,
    "tooltip": "Restrict camera scrolling to the world boundary.\nShould match the size of your level.\n\nGenerates:  this.cameras.main.setBounds(0, 0, 3200, 600);"
  },
  
  // ── TWEEN / TIMER ─────────────────────────────
  
  {
    "type": "js_phaser_tween",
    "message0": "this.tweens.add( target: %1  %2: %3  duration: %4 ms  ease: %5 )",
    "args0": [
      { "type": "input_value", "name": "TARGET" },
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          ["x", "x"],
          ["y", "y"],
          ["alpha", "alpha"],
          ["scaleX", "scaleX"],
          ["scaleY", "scaleY"],
          ["angle", "angle"]
        ]
      },
      { "type": "field_number", "name": "TO", "value": 0 },
      { "type": "field_number", "name": "DURATION", "value": 1000 },
      {
        "type": "field_dropdown",
        "name": "EASE",
        "options": [
          ["Linear", "Linear"],
          ["Power2", "Power2"],
          ["Bounce.Out", "Bounce.Out"],
          ["Back.Out", "Back.Out"],
          ["Sine.InOut", "Sine.InOut"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 45,
    "tooltip": "Smoothly animate an object property over time.\n\nGenerates:\n  this.tweens.add({\n    targets: obj,\n    x: 400,\n    duration: 1000,\n    ease: 'Linear'\n  });"
  },
  
  {
    "type": "js_phaser_timer",
    "message0": "this.time.addEvent( delay: %1 ms  loop: %2 {%3  %4} )",
    "args0": [
      { "type": "field_number", "name": "DELAY", "value": 1000 },
      {
        "type": "field_dropdown",
        "name": "LOOP",
        "options": [
          ["true", "true"],
          ["false", "false"]
        ]
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 45,
    "tooltip": "Run code after a delay, or on a repeating interval.\n\nGenerates:\n  this.time.addEvent({\n    delay: 1000,\n    loop: true,\n    callback: () => { ... }\n  });"
  },
  
  // ── AUDIO ─────────────────────────────────────
  
  {
    "type": "js_phaser_sound_play",
    "message0": "this.sound.play(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "jump" }],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Play a loaded sound immediately.\n\nGenerates:  this.sound.play('jump');"
  },
  
  {
    "type": "js_phaser_sound_add",
    "message0": "this.sound.add(\"%1\", loop: %2)",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "music" },
      {
        "type": "field_dropdown",
        "name": "LOOP",
        "options": [
          ["true", "true"],
          ["false", "false"]
        ]
      }
    ],
    "output": null,
    "colour": 120,
    "tooltip": "Create a sound object for more control.\nStore it in a variable, then call .play() / .stop() on it.\n\nGenerates:  this.sound.add('music', { loop: true })"
  },
  
  // ── UTILITY ───────────────────────────────────
  
  {
    "type": "js_phaser_math_between",
    "message0": "Phaser.Math.Between(%1, %2)",
    "args0": [
      { "type": "field_number", "name": "MIN", "value": 0 },
      { "type": "field_number", "name": "MAX", "value": 100 }
    ],
    "inputsInline": true,
    "output": "Number",
    "colour": 230,
    "tooltip": "Return a random integer between min and max (both inclusive).\nShorter than the vanilla Math.floor(Math.random() * …) approach.\n\nGenerates:  Phaser.Math.Between(0, 100)"
  },
  
  {
    "type": "js_phaser_destroy",
    "message0": "%1.destroy()",
    "args0": [{ "type": "input_value", "name": "OBJ" }],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 0,
    "tooltip": "Permanently remove a game object from the scene and free its memory.\n\nGenerates:  obj.destroy();"
  },
  
  {
    "type": "js_phaser_set_active",
    "message0": "%1.setActive(%2).setVisible(%2)",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      {
        "type": "field_dropdown",
        "name": "VALUE",
        "options": [
          ["false (hide)", "false"],
          ["true (show)", "true"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 0,
    "tooltip": "Show or hide a game object and toggle whether it updates.\n  false → hidden and inactive\n  true  → visible and active\n\nGenerates:  obj.setActive(false).setVisible(false);"
  }
  
]);