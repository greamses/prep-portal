// ══════════════════════════════════════════════
//  phaser-input.js — Keyboard & Pointer Input
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_phaser_cursors",
    "message0": "this.input.keyboard.createCursorKeys()",
    "output": null,
    "colour": 290,
    "tooltip": "Create arrow-key + shift + space handlers.\nStore in a variable, then use cursors.left.isDown etc. in update().\n\nGenerates:  this.input.keyboard.createCursorKeys()"
  },

  {
    "type": "js_phaser_add_key",
    "message0": "this.input.keyboard.addKey(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "SPACE" }],
    "output": null,
    "colour": 290,
    "tooltip": "Create a handler for a single named key.\n\nCommon values:\n  SPACE, ENTER, SHIFT, CTRL\n  W, A, S, D\n  UP, DOWN, LEFT, RIGHT\n\nGenerates:  this.input.keyboard.addKey('SPACE')"
  },

  {
    "type": "js_phaser_key_is_down",
    "message0": "%1.%2.isDown",
    "args0": [
      { "type": "input_value", "name": "CURSORS" },
      { "type": "field_dropdown", "name": "KEY",
        "options": [
          ["left","left"],["right","right"],["up","up"],
          ["down","down"],["space","space"],["shift","shift"]
        ]
      }
    ],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 290,
    "tooltip": "true while the key is held down — fires every frame.\nUse inside an if block in update().\n\nGenerates:  cursors.left.isDown"
  },

  {
    "type": "js_phaser_key_just_down",
    "message0": "Phaser.Input.Keyboard.JustDown(%1)",
    "args0": [{ "type": "input_value", "name": "KEY" }],
    "inputsInline": true,
    "output": "Boolean",
    "colour": 290,
    "tooltip": "true only on the FIRST frame the key is pressed.\nUse this for actions like jump or fire to avoid repeated triggering.\n\nGenerates:  Phaser.Input.Keyboard.JustDown(key)"
  },

  {
    "type": "js_phaser_pointer_on",
    "message0": "this.input.on(\"%1\", (pointer) => {%2  %3})",
    "args0": [
      { "type": "field_dropdown", "name": "EVENT",
        "options": [
          ["pointerdown","pointerdown"],
          ["pointerup","pointerup"],
          ["pointermove","pointermove"]
        ]
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Listen for mouse / touch events.\nInside the block, use pointer.x and pointer.y for coordinates.\n\nGenerates:\n  this.input.on('pointerdown', (pointer) => {\n    ...\n  });"
  }

]);
