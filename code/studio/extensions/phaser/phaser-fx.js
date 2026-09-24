// ══════════════════════════════════════════════
//  phaser-fx.js — Animations, Camera, Tweens,
//                 Timer, Utility
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  // ── Animations ────────────────────────────

  {
    "type": "js_phaser_anim_create",
    "message0": "this.anims.create( key:\"%1\" sprite:\"%2\" frames:%3–%4 rate:%5 repeat:%6 )",
    "args0": [
      { "type": "field_input",  "name": "KEY",        "text": "walk" },
      { "type": "field_input",  "name": "SPRITE_KEY", "text": "player" },
      { "type": "field_number", "name": "START",      "value": 0 },
      { "type": "field_number", "name": "END",        "value": 3 },
      { "type": "field_number", "name": "RATE",       "value": 10 },
      { "type": "field_number", "name": "REPEAT",     "value": -1 }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 230,
    "tooltip": "Define a named animation from a range of spritesheet frames.\n\n  key    → name used by anims.play()\n  sprite → the spritesheet's load key\n  frames → start and end frame numbers (inclusive)\n  rate   → frames per second\n  repeat → -1 = loop forever, 0 = play once\n\nGenerates:\n  this.anims.create({\n    key: 'walk',\n    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),\n    frameRate: 10,\n    repeat: -1\n  });"
  },

  {
    "type": "js_phaser_anim_play",
    "message0": "%1.anims.play(\"%2\", %3)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_input", "name": "KEY",    "text": "walk" },
      { "type": "field_dropdown", "name": "IGNORE",
        "options": [["ignoreIfPlaying: true","true"],["restart always","false"]] }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 230,
    "tooltip": "Play an animation on a sprite.\nignoreIfPlaying: true → won't restart if already running (prevents jitter).\n\nGenerates:  sprite.anims.play('walk', true);"
  },

  {
    "type": "js_phaser_set_frame",
    "message0": "%1.setFrame(%2)",
    "args0": [
      { "type": "input_value",  "name": "SPRITE" },
      { "type": "field_number", "name": "FRAME",  "value": 4 }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 230,
    "tooltip": "Jump to a specific frame on a spritesheet.\nUseful for idle / standing still poses.\n\nGenerates:  sprite.setFrame(4);"
  },

  {
    "type": "js_phaser_flip_x",
    "message0": "%1.setFlipX(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_dropdown", "name": "VALUE",
        "options": [["true — face left","true"],["false — face right","false"]] }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 230,
    "tooltip": "Flip a sprite horizontally to face left or right.\n\nGenerates:  sprite.setFlipX(true);"
  },

  // ── Camera ────────────────────────────────

  {
    "type": "js_phaser_camera_follow",
    "message0": "this.cameras.main.startFollow(%1)",
    "args0": [{ "type": "input_value", "name": "TARGET" }],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Make the main camera continuously track a sprite.\nCombine with setBounds to keep it inside the level.\n\nGenerates:  this.cameras.main.startFollow(player);"
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
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Clamp camera scrolling to the world boundary.\nSet width/height to match your level size.\n\nGenerates:  this.cameras.main.setBounds(0, 0, 3200, 600);"
  },

  // ── Tween ─────────────────────────────────

  {
    "type": "js_phaser_tween",
    "message0": "this.tweens.add( target:%1  %2:%3  duration:%4ms  ease:%5 )",
    "args0": [
      { "type": "input_value", "name": "TARGET" },
      { "type": "field_dropdown", "name": "PROP",
        "options": [["x","x"],["y","y"],["alpha","alpha"],
                    ["scaleX","scaleX"],["scaleY","scaleY"],["angle","angle"]] },
      { "type": "field_number", "name": "TO",       "value": 0 },
      { "type": "field_number", "name": "DURATION", "value": 1000 },
      { "type": "field_dropdown", "name": "EASE",
        "options": [
          ["Linear","Linear"],["Power2","Power2"],
          ["Bounce.Out","Bounce.Out"],["Back.Out","Back.Out"],["Sine.InOut","Sine.InOut"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Smoothly animate a property from its current value to a target.\n\nGenerates:\n  this.tweens.add({\n    targets: obj,\n    x: 400,\n    duration: 1000,\n    ease: 'Linear'\n  });"
  },

  // ── Timer ─────────────────────────────────

  {
    "type": "js_phaser_timer",
    "message0": "this.time.addEvent( delay:%1ms  loop:%2 {%3  %4} )",
    "args0": [
      { "type": "field_number", "name": "DELAY", "value": 1000 },
      { "type": "field_dropdown", "name": "LOOP",
        "options": [["true","true"],["false","false"]] },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Run code once after a delay, or on a repeating interval.\n\nGenerates:\n  this.time.addEvent({\n    delay: 1000,\n    loop: true,\n    callback: () => { ... }\n  });"
  },

  // ── Utility ───────────────────────────────

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
    "tooltip": "Random whole number between min and max (both inclusive).\nMore concise than Math.floor(Math.random() * …).\n\nGenerates:  Phaser.Math.Between(0, 100)"
  }

]);
