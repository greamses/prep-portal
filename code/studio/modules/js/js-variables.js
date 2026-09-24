// ══════════════════════════════════════════════
//  js-variables.js — FIXED & STABLE VERSION
// ══════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  // ─────────────────────────────────────────────
  // VARIABLE DECLARATION (statement)
  // ─────────────────────────────────────────────
  {
    "type": "js_declare",
    "message0": "%1 %2 = %3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "KIND",
        "options": [["let","let"],["const","const"],["var","var"]]
      },
      {
        "type": "field_input",
        "name": "NAME",
        "text": "myVar"
      },
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 35,
    "tooltip": "Declare a variable."
  },

  // ─────────────────────────────────────────────
  // VARIABLE ASSIGNMENT (statement)
  // ─────────────────────────────────────────────
  {
    "type": "js_assign",
    "message0": "%1 = %2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "myVar"
      },
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 35,
    "tooltip": "Reassign a variable."
  },

  // ─────────────────────────────────────────────
  // COMPOUND ASSIGNMENT (statement)
  // ─────────────────────────────────────────────
  {
    "type": "js_compound_assign",
    "message0": "%1 %2 %3",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "x"
      },
      {
        "type": "field_dropdown",
        "name": "OP",
        "options": [["+=","+="],["-=","-="],["*=","*="],["/=","/="],["**=","**="],["%=","%="]]
      },
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // INCREMENT / DECREMENT (statement)
  // ─────────────────────────────────────────────
  {
    "type": "js_increment",
    "message0": "%1%2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "i"
      },
      {
        "type": "field_dropdown",
        "name": "OP",
        "options": [["++","++"],["--","--"]]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // STRING (expression)
  // ─────────────────────────────────────────────
  {
    "type": "js_string",
    "message0": "\"%1\"",
    "args0": [
      {
        "type": "field_input",
        "name": "TEXT",
        "text": "Hello"
      }
    ],
    "output": "String",
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // TEMPLATE LITERAL (expression)
  // ─────────────────────────────────────────────
  {
    "type": "js_template_literal",
    "message0": "`%1`",
    "args0": [
      {
        "type": "field_input",
        "name": "TEXT",
        "text": "Hello ${name}!"
      }
    ],
    "output": "String",
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // NUMBER (expression)
  // ─────────────────────────────────────────────
  {
    "type": "js_number",
    "message0": "%1",
    "args0": [
      {
        "type": "field_number",
        "name": "NUM",
        "value": 0
      }
    ],
    "output": "Number",
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // BOOLEAN (expression)
  // ─────────────────────────────────────────────
  {
    "type": "js_bool",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "BOOL",
        "options": [["true","true"],["false","false"]]
      }
    ],
    "output": "Boolean",
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // NULLISH VALUES (expression)
  // ─────────────────────────────────────────────
  {
    "type": "js_nullish",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "VAL",
        "options": [["null","null"],["undefined","undefined"],["NaN","NaN"]]
      }
    ],
    "output": "Any",
    "colour": 35
  },

  // ─────────────────────────────────────────────
  // VARIABLE REFERENCE (expression) ⭐ FIXED
  // ─────────────────────────────────────────────
  {
    "type": "js_var_ref",
    "message0": "%1",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "myVar"
      }
    ],
    "output": "Any",
    "colour": 35,
    "tooltip": "Read a variable value."
  },

  // ─────────────────────────────────────────────
  // TYPEOF (expression) ⭐ FIXED
  // ─────────────────────────────────────────────
  {
    "type": "js_typeof",
    "message0": "typeof %1",
    "args0": [
      {
        "type": "input_value",
        "name": "VALUE"
      }
    ],
    "inputsInline": true,
    "output": "String",
    "colour": 35
  }

]);