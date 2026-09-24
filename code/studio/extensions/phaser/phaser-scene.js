// ══════════════════════════════════════════════
//  phaser-scene.js — Scene Lifecycle Blocks
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_phaser_game",
    "message0": "new Phaser.Game( width:%1 height:%2 physics:%3 scene:%4 )",
    "args0": [
      { "type": "field_number", "name": "WIDTH",   "value": 800 },
      { "type": "field_number", "name": "HEIGHT",  "value": 600 },
      { "type": "field_dropdown", "name": "PHYSICS",
        "options": [["arcade","arcade"],["matter","matter"],["none","none"]] },
      { "type": "field_input",  "name": "SCENE",   "text": "GameScene" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Create and launch a Phaser 3 game.\nPlace this at the bottom, after your scene class.\n\nGenerates:\n  new Phaser.Game({\n    type: Phaser.AUTO,\n    width: 800,\n    height: 600,\n    physics: { default: 'arcade', arcade: { gravity: { y: 300 } } },\n    scene: [GameScene]\n  });"
  },

  {
    "type": "js_phaser_scene",
    "message0": "class %1 extends Phaser.Scene {%2  %3}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "GameScene" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Define a Phaser Scene class.\nPlace constructor(), preload(), create(), and update() inside.\n\nGenerates:  class GameScene extends Phaser.Scene { ... }"
  },

  {
    "type": "js_phaser_constructor",
    "message0": "constructor() { super(\"%1\");%2  %3}",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "GameScene" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Scene constructor — runs once when the class is defined.\nThe key passed to super() must match the class name.\nInitialise scene properties here (this.player = null).\n\nGenerates:\n  constructor() {\n    super('GameScene');\n    ...\n  }"
  },

  {
    "type": "js_phaser_preload",
    "message0": "preload() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs before the scene starts.\nLoad ALL assets here — Phaser waits until everything finishes before calling create().\n\nGenerates:  preload() { ... }"
  },

  {
    "type": "js_phaser_create",
    "message0": "create() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs once when assets are ready.\nAdd sprites, physics, input, animations, and cameras here.\n\nGenerates:  create() { ... }"
  },

  {
    "type": "js_phaser_update",
    "message0": "update() {%1  %2}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Runs every frame (~60 fps).\nHandle player movement, input checks, and per-frame logic here.\n\nGenerates:  update() { ... }"
  },

  {
    "type": "js_phaser_this_assign",
    "message0": "this.%1 = %2",
    "args0": [
      { "type": "field_input", "name": "PROP", "text": "player" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Store a value on the scene so it persists across methods.\nVariables declared with let are lost between preload/create/update.\n\nGenerates:  this.player = value;"
  },

  {
    "type": "js_phaser_this_prop",
    "message0": "this.%1",
    "args0": [{ "type": "field_input", "name": "PROP", "text": "player" }],
    "output": null,
    "colour": 20,
    "tooltip": "Read a scene property.\n\nGenerates:  this.player"
  },

  {
    "type": "js_phaser_scene_start",
    "message0": "this.scene.start(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "GameScene" }],
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Stop this scene and launch a named scene.\n\nGenerates:  this.scene.start('GameScene');"
  },

  {
    "type": "js_phaser_scene_restart",
    "message0": "this.scene.restart()",
    "previousStatement": null, "nextStatement": null,
    "colour": 20,
    "tooltip": "Restart the current scene from the beginning.\nResets all objects and state.\n\nGenerates:  this.scene.restart();"
  }

]);
