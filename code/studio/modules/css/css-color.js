// modules/css-color.js
// CSS color & border property blocks with pluggable color values

if (typeof Blockly !== 'undefined') {
  Blockly.defineBlocksWithJsonArray([
    
    // ── Color value: dropdown of named / common colors ──
    {
      "type": "css_color_value_named",
      "message0": "%1",
      "args0": [{
        "type": "field_dropdown",
        "name": "COLOR",
        "options": [
          ["red", "red"],
          ["blue", "blue"],
          ["green", "green"],
          ["yellow", "yellow"],
          ["orange", "orange"],
          ["purple", "purple"],
          ["pink", "pink"],
          ["black", "black"],
          ["white", "white"],
          ["gray", "gray"],
          ["transparent", "transparent"],
          ["cyan", "cyan"],
          ["magenta", "magenta"],
          ["lime", "lime"],
          ["teal", "teal"],
          ["navy", "navy"],
          ["coral", "coral"],
          ["gold", "gold"],
          ["salmon", "salmon"],
          ["violet", "violet"],
          ["indigo", "indigo"]
        ]
      }],
      "output": "CSS_COLOR",
      "colour": 180,
      "tooltip": "A named CSS color."
    },
    
    // ── Color value: color wheel picker ──
    {
      "type": "css_color_value_picker",
      "message0": "%1",
      "args0": [{
        "type": "field_colour",
        "name": "COLOR",
        "colour": "#ff0000"
      }],
      "output": "CSS_COLOR",
      "colour": 180,
      "tooltip": "Pick any color from the wheel."
    },
    
    // ── Color value: hex input ──
    {
      "type": "css_color_value_hex",
      "message0": "# %1",
      "args0": [{
        "type": "field_input",
        "name": "HEX",
        "text": "ff0000"
      }],
      "output": "CSS_COLOR",
      "colour": 180,
      "tooltip": "Enter a hex color code."
    },
    
    // ── Color value: rgb/rgba ──
    {
      "type": "css_color_value_rgb",
      "message0": "rgb ( %1 , %2 , %3 )",
      "args0": [
        { "type": "field_number", "name": "R", "value": 255, "min": 0, "max": 255 },
        { "type": "field_number", "name": "G", "value": 0, "min": 0, "max": 255 },
        { "type": "field_number", "name": "B", "value": 0, "min": 0, "max": 255 }
      ],
      "output": "CSS_COLOR",
      "colour": 180,
      "tooltip": "An RGB color value."
    },
    
// modules/css-color.js — corrected color & bg blocks

// ── text color property (with spacer) ──
{
  "type": "css_color",
  "message0": "text color %1 %2 ;",
  "args0": [
    { "type": "input_dummy" },
    { "type": "input_value", "name": "VAL", "check": "CSS_COLOR" }
  ],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": 180,
  "tooltip": "Sets the text color."
},

// ── background-color property (with spacer) ──
{
  "type": "css_bg_color",
  "message0": "background %1 %2 ;",
  "args0": [
    { "type": "input_dummy" },
    { "type": "input_value", "name": "VAL", "check": "CSS_COLOR" }
  ],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": 180,
  "tooltip": "Sets the background color."
},

// ── border property (with spacer before color) ──
{
  "type": "css_border",
  "message0": "border %1 %2 %3 %4 ;",
  "args0": [
    { "type": "field_input", "name": "WIDTH", "text": "1px" },
    {
      "type": "field_dropdown",
      "name": "STYLE",
      "options": [
        ["solid", "solid"],
        ["dashed", "dashed"],
        ["dotted", "dotted"],
        ["double", "double"],
        ["groove", "groove"],
        ["ridge", "ridge"],
        ["inset", "inset"],
        ["outset", "outset"],
        ["none", "none"]
      ]
    },
    { "type": "input_dummy" },
    { "type": "input_value", "name": "COLOR", "check": "CSS_COLOR" }
  ],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": 180,
  "tooltip": "Sets border width, style, and color."
},
  ]);
}