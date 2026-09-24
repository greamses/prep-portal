// ══════════════════════════════════════════════
//  js-control.js — Control Flow (FIXED & STABLE)
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

    {
    "type": "js_if",
    "message0": "if (%1) {%2  %3}",
    "args0": [
      { 
        "type": "input_value", 
        "name": "CONDITION", 
        "check": "Boolean"  // <--- This turns the slot into a hexagon
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 210,
    "tooltip": "Run code only when the condition is true."
  },

  {
    "type": "js_if_else",
    "message0": "if (%1) {%2  %3} else {%4  %5}",
    "args0": [
      { 
        "type": "input_value", 
        "name": "CONDITION", 
        "check": "Boolean" // <--- This one too
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "ELSE" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 210,
    "tooltip": "Run one block if true, a different block if false."
  },


    {
    "type": "js_for",
    "message0": "for (let %1 = %2; %3 < %4; %5++) {%6 %7}",
    "args0": [
      { "type": "field_input", "name": "VAR", "text": "i" },
      { "type": "field_number", "name": "FROM", "value": 0 },
      { "type": "field_label", "name": "LBL1", "text": "i" },
      { "type": "field_number", "name": "TO", "value": 10 },
      { "type": "field_label", "name": "LBL2", "text": "i" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "extensions": ["js_for_sync_extension"] // This hooks up the logic below
  }
,

  {
    "type": "js_for_of",
    "message0": "for (const %1 of %2) {%3  %4}",
    "args0": [
      { "type": "field_input", "name": "ITEM", "text": "item" },
      { "type": "input_value", "name": "ARRAY" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 210,
    "tooltip": "Loop over every element in an array."
  },

  {
    "type": "js_while",
    "message0": "while (%1) {%2  %3}",
    "args0": [
      {
        "type": "input_value",
        "name": "CONDITION",
        "check": "Boolean" // <--- Adds the hexagonal shape
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Repeat code as long as a condition stays true."
  },

  {
    "type": "js_compare",
    "message0": "%1 %2 %3",
    "args0": [
      { "type": "input_value", "name": "LEFT" },
      { "type": "field_dropdown", "name": "OP",
        "options": [
          ["===","==="], ["!==","!=="],
          ["==","=="],   ["!=","!="],
          [">",">"],     [">=",">="],
          ["<","<"],     ["<=","<="]
        ]
      },
      { "type": "input_value", "name": "RIGHT" }
    ],
    "inputsInline": true,
    "output": "Boolean", "colour": 210,
    "tooltip": "Compare two values. Returns true or false."
  },

  {
    "type": "js_logic",
    "message0": "%1 %2 %3",
    "args0": [
      { "type": "input_value", "name": "LEFT" },
      { "type": "field_dropdown", "name": "OP",
        "options": [["&&","&&"],["||","||"],["??","??"]] },
      { "type": "input_value", "name": "RIGHT" }
    ],
    "inputsInline": true,
    "output": "Boolean", "colour": 210,
    "tooltip": "Combine two conditions."
  },

  {
    "type": "js_not",
    "message0": "!%1",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": "Boolean", "colour": 210,
    "tooltip": "Invert a boolean."
  },

  {
    "type": "js_ternary",
    "message0": "%1 ? %2 : %3",
    "args0": [
      { "type": "input_value", "name": "CONDITION" },
      { "type": "input_value", "name": "IF_TRUE" },
      { "type": "input_value", "name": "IF_FALSE" }
    ],
    "inputsInline": true,
    "output": null, "colour": 210,
    "tooltip": "Inline if/else that returns a value."
  },

  {
    "type": "js_break",
    "message0": "%1",
    "args0": [
      { "type": "field_dropdown", "name": "TYPE",
        "options": [["break","break"],["continue","continue"]] }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 210,
    "tooltip": "Control loop execution."
  }

]);

Blockly.Extensions.register('js_for_sync_extension', function() {
  // Get the variable input field
  const varField = this.getField('VAR');
  
  // Create a validator that runs whenever the text changes
  varField.setValidator((newValue) => {
    // 'this' inside the validator refers to the Field, 
    // so we get the source block first
    const block = varField.getSourceBlock();
    if (block) {
      // Update the two labels to match the new variable name
      block.setFieldValue(newValue, 'LBL1');
      block.setFieldValue(newValue, 'LBL2');
    }
    return newValue; // Keep the value as is
  });
});
