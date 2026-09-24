// ══════════════════════════════════════════════
//  phaser-assets.js — Load & Audio Blocks
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_phaser_load_image",
    "message0": "this.load.image(\"%1\", \"%2\")",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "sky" },
      { "type": "field_input", "name": "URL", "text": "assets/sky.png" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Load a static image.\n  key → name you'll use to reference it (e.g. 'sky')\n  URL → path to the file\n\nGenerates:  this.load.image('sky', 'assets/sky.png');"
  },

  {
    "type": "js_phaser_load_spritesheet",
    "message0": "this.load.spritesheet(\"%1\", \"%2\", frameW:%3 frameH:%4)",
    "args0": [
      { "type": "field_input",  "name": "KEY", "text": "player" },
      { "type": "field_input",  "name": "URL", "text": "assets/player.png" },
      { "type": "field_number", "name": "FW",  "value": 32 },
      { "type": "field_number", "name": "FH",  "value": 48 }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Load a spritesheet for frame-based animations.\nSpecify each individual frame's pixel size.\n\nGenerates:\n  this.load.spritesheet('player', 'assets/player.png',\n    { frameWidth: 32, frameHeight: 48 });"
  },

  {
    "type": "js_phaser_load_audio",
    "message0": "this.load.audio(\"%1\", \"%2\")",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "jump" },
      { "type": "field_input", "name": "URL", "text": "assets/jump.mp3" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Load an audio file.\n\nGenerates:  this.load.audio('jump', 'assets/jump.mp3');"
  },

  {
    "type": "js_phaser_sound_play",
    "message0": "this.sound.play(\"%1\")",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "jump" }],
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Play a loaded sound immediately by its key.\n\nGenerates:  this.sound.play('jump');"
  },

  {
    "type": "js_phaser_sound_add",
    "message0": "this.sound.add(\"%1\", loop:%2)",
    "args0": [
      { "type": "field_input", "name": "KEY", "text": "music" },
      { "type": "field_dropdown", "name": "LOOP",
        "options": [["true","true"],["false","false"]] }
    ],
    "output": null,
    "colour": 120,
    "tooltip": "Create a sound object for fine-grained control.\nStore it, then call .play() / .stop() / .pause() on it.\n\nGenerates:  this.sound.add('music', { loop: true })"
  }

]);
