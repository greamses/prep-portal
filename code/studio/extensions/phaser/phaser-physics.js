// ══════════════════════════════════════════════
//  phaser-physics.js — Arcade Physics Blocks
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_phaser_physics_sprite",
    "message0": "this.physics.add.sprite(%1, %2, \"%3\")",
    "args0": [
      { "type": "field_number", "name": "X",   "value": 100 },
      { "type": "field_number", "name": "Y",   "value": 450 },
      { "type": "field_input",  "name": "KEY", "text": "player" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 65,
    "tooltip": "Add a sprite with Arcade Physics enabled.\nAlways store the result — you need it for colliders, velocity, etc.\n\nGenerates:  this.physics.add.sprite(100, 450, 'player')"
  },

  {
    "type": "js_phaser_static_group",
    "message0": "this.physics.add.staticGroup()",
    "output": null,
    "colour": 65,
    "tooltip": "Create a static physics group — objects that don't move (platforms, walls).\nUse .create(x, y, key) to add members.\n\nGenerates:  this.physics.add.staticGroup()"
  },

  {
    "type": "js_phaser_dynamic_group",
    "message0": "this.physics.add.group()",
    "output": null,
    "colour": 65,
    "tooltip": "Create a dynamic physics group — objects that can move (enemies, bullets, coins).\n\nGenerates:  this.physics.add.group()"
  },

  {
    "type": "js_phaser_group_create",
    "message0": "%1.create(%2, %3, \"%4\")",
    "args0": [
      { "type": "input_value",  "name": "GROUP" },
      { "type": "field_number", "name": "X",    "value": 0 },
      { "type": "field_number", "name": "Y",    "value": 0 },
      { "type": "field_input",  "name": "KEY",  "text": "platform" }
    ],
    "inputsInline": true,
    "output": null,
    "colour": 65,
    "tooltip": "Add a new physics object to a group.\n\nGenerates:  group.create(0, 0, 'platform')"
  },

  {
    "type": "js_phaser_collider",
    "message0": "this.physics.add.collider(%1, %2)",
    "args0": [
      { "type": "input_value", "name": "OBJ1" },
      { "type": "input_value", "name": "OBJ2" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Make two objects (or groups) collide — they can't pass through each other.\n\nGenerates:  this.physics.add.collider(player, platforms);"
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
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Detect when two objects touch without physical blocking.\nThe callback function is called on each overlapping frame.\n\nGenerates:  this.physics.add.overlap(player, coins, collectCoin);"
  },

  {
    "type": "js_phaser_set_velocity",
    "message0": "%1.setVelocity%2(%3)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_dropdown", "name": "AXIS",
        "options": [["X","X"],["Y","Y"],["","(x,y)"]] },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Set a physics sprite's velocity.\n\n  X → horizontal (positive = right, negative = left)\n  Y → vertical   (positive = down,  negative = up)\n  (x,y) → set both at once, e.g. value = '160, -200'\n\nGenerates:  sprite.setVelocityX(160);"
  },

  {
    "type": "js_phaser_set_bounce",
    "message0": "%1.setBounce(%2)",
    "args0": [
      { "type": "input_value",  "name": "SPRITE" },
      { "type": "field_number", "name": "VALUE",  "value": 0.2,
        "min": 0, "max": 1, "precision": 0.1 }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Set how bouncy the object is on collision.\n  0.0 → no bounce at all\n  1.0 → full energy preserved (bounces forever)\n\nGenerates:  sprite.setBounce(0.2);"
  },

  {
    "type": "js_phaser_world_bounds",
    "message0": "%1.setCollideWorldBounds(%2)",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_dropdown", "name": "VALUE",
        "options": [["true","true"],["false","false"]] }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Prevent the object from leaving the game world boundary.\n\nGenerates:  sprite.setCollideWorldBounds(true);"
  },

  {
    "type": "js_phaser_gravity",
    "message0": "%1.setGravityY(%2)",
    "args0": [
      { "type": "input_value",  "name": "SPRITE" },
      { "type": "field_number", "name": "VALUE",  "value": 300 }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Apply extra gravity to a single sprite (on top of world gravity).\n  Positive → pulled down faster\n  Negative → floats upward\n\nGenerates:  sprite.setGravityY(300);"
  },

  {
    "type": "js_phaser_body_touching",
    "message0": "%1.body.blocked.%2",
    "args0": [
      { "type": "input_value", "name": "SPRITE" },
      { "type": "field_dropdown", "name": "DIR",
        "options": [["down","down"],["up","up"],["left","left"],["right","right"]] }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 65,
    "tooltip": "Check if a physics body is touching a surface on a given side.\n\n  body.blocked.down → sprite is standing on the ground ✓ jump check\n\nGenerates:  sprite.body.blocked.down"
  }

]);
