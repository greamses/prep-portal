// ══════════════════════════════════════════════
//  phaser-display.js — Display Object Blocks
//  (Fixed: Unique Placeholders & Dynamic Inputs)
// ══════════════════════════════════════════════

(function() {
  const blocks = [
    {
      type: "js_phaser_add_image",
      message0: "add image x %1 y %2 key %3",
      args0: [
        { type: "input_value",  name: "X" },
        { type: "input_value",  name: "Y" },
        { type: "field_input",  name: "KEY", text: "sky" }
      ],
      inputsInline: true,
      output: null,
      colour: 160,
      tooltip: "Add a static image to the scene. Returns the image object.",
      helpUrl: ""
    },
    {
      type: "js_phaser_add_sprite",
      message0: "add sprite x %1 y %2 key %3",
      args0: [
        { type: "input_value",  name: "X" },
        { type: "input_value",  name: "Y" },
        { type: "field_input",  name: "KEY", text: "player" }
      ],
      inputsInline: true,
      output: null,
      colour: 160,
      tooltip: "Add an animated sprite. Returns the sprite object.",
      helpUrl: ""
    },
    {
      type: "js_phaser_add_text",
      message0: "add text x %1 y %2 text %3 size %4 color %5",
      args0: [
        { type: "input_value",  name: "X" },
        { type: "input_value",  name: "Y" },
        { type: "input_value",  name: "TEXT" },
        { type: "field_input",  name: "SIZE", text: "32px" },
        { type: "field_input",  name: "COLOR", text: "#ffffff" }
      ],
      inputsInline: true,
      output: null,
      colour: 160,
      tooltip: "Add text to the scene.",
      helpUrl: ""
    },
    {
      type: "js_phaser_add_rect",
      message0: "add rect x %1 y %2 w %3 h %4 color 0x%5",
      args0: [
        { type: "input_value",  name: "X" },
        { type: "input_value",  name: "Y" },
        { type: "input_value",  name: "W" },
        { type: "input_value",  name: "H" },
        { type: "field_input",  name: "COLOR", text: "ff0000" }
      ],
      inputsInline: true,
      output: null,
      colour: 160,
      tooltip: "Add a solid coloured rectangle.",
      helpUrl: ""
    },
    {
      type: "js_phaser_set_text",
      message0: "%1 .setText( %2 )",
      args0: [
        { type: "input_value", name: "TEXT_OBJ" },
        { type: "input_value", name: "VALUE" }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Update the text of a text object.",
      helpUrl: ""
    },
    {
      type: "js_phaser_set_position",
      message0: "%1 .setPosition( %2 , %3 )",
      args0: [
        { type: "input_value", name: "OBJ" },
        { type: "input_value", name: "X" },
        { type: "input_value", name: "Y" }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Teleport a game object to a position.",
      helpUrl: ""
    },
    {
      type: "js_phaser_destroy",
      message0: "%1 .destroy()",
      args0: [
        { type: "input_value", name: "OBJ" }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Remove a game object from the scene.",
      helpUrl: ""
    },
    {
      type: "js_phaser_set_active",
      // FIXED: Removed duplicate %2. The generator should handle both methods.
      message0: "%1 set active and visible: %2",
      args0: [
        { type: "input_value", name: "OBJ" },
        { type: "field_dropdown", name: "VALUE",
          options: [["false — hide", "FALSE"], ["true — show", "TRUE"]]
        }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Show or hide a game object (sets Active and Visible).",
      helpUrl: ""
    }
  ];

  // Filter out any block types that are already defined
  const newBlocks = blocks.filter(b => !Blockly.Blocks[b.type]);
  
  if (newBlocks.length < blocks.length) {
    console.warn('phaser-display: skipped duplicate block types:',
      blocks.filter(b => Blockly.Blocks[b.type]).map(b => b.type));
  }
  
  if (newBlocks.length > 0) {
    Blockly.defineBlocksWithJsonArray(newBlocks);
    console.log('phaser-display: defined blocks:', newBlocks.map(b => b.type).join(', '));
  }
})();
