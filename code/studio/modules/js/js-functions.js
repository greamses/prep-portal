// ══════════════════════════════════════════════
//  js-functions.js — Functions & Output
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_function",
    "message0": "function %1(%2) {%3  %4}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "myFunction" },
      { "type": "field_input", "name": "PARAMS", "text": "" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Define a named, reusable function.\nSeparate multiple parameters with commas.\n\nGenerates:\n  function myFunction(a, b) {\n    ...\n  }"
  },

  {
    "type": "js_arrow_function",
    "message0": "const %1 = (%2) => {%3  %4};",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "myFunc" },
      { "type": "field_input", "name": "PARAMS", "text": "" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Define a function using modern arrow syntax.\nBest for short callbacks and event handlers.\n\nGenerates:\n  const myFunc = (a, b) => {\n    ...\n  };"
  },

  {
    "type": "js_call_stmt",
    "message0": "%1(%2)",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "myFunction" },
      { "type": "field_input", "name": "ARGS", "text": "" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Call (invoke) a function as a statement.\nSeparate multiple arguments with commas.\n\nGenerates:  myFunction(arg1, arg2);"
  },

  {
    "type": "js_call_expr",
    "message0": "%1(%2)",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "myFunction" },
      { "type": "field_input", "name": "ARGS", "text": "" }
    ],
    "output": null, "colour": 290,
    "tooltip": "Call a function and use its return value.\nUse this when the result is needed inside another block.\n\nGenerates:  myFunction(arg1, arg2)"
  },

  {
    "type": "js_return",
    "message0": "return %1",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "previousStatement": null,
    "colour": 290,
    "tooltip": "Exit a function and send back a value.\nMust be placed inside a function block.\n\nGenerates:  return value;"
  },

  {
    "type": "js_console_log",
    "message0": "console.log(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Print a value to the browser DevTools console.\nOpen it with F12 → Console.\n\nGenerates:  console.log(value);"
  },

  {
    "type": "js_alert",
    "message0": "alert(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Show a popup dialog box with a message.\nBlocks the page until the user clicks OK.\n\nGenerates:  alert(value);"
  },

  {
    "type": "js_confirm",
    "message0": "confirm(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": "Boolean", "colour": 290,
    "tooltip": "Show an OK / Cancel dialog.\nReturns true if OK clicked, false if Cancel.\n\nGenerates:  confirm(value)"
  },

  {
    "type": "js_prompt",
    "message0": "prompt(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": null, "colour": 290,
    "tooltip": "Show a text-input dialog and return the typed value.\nReturns null if the user cancels.\n\nGenerates:  prompt(value)"
  },

  {
    "type": "js_set_timeout",
    "message0": "setTimeout(() => {%1  %2}, %3)",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" },
      { "type": "field_number", "name": "DELAY", "value": 1000 }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Run code once after a delay (milliseconds).\n1000 ms = 1 second.\n\nGenerates:\n  setTimeout(() => {\n    ...\n  }, 1000);"
  },

  {
    "type": "js_set_interval",
    "message0": "setInterval(() => {%1  %2}, %3)",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" },
      { "type": "field_number", "name": "INTERVAL", "value": 1000 }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 290,
    "tooltip": "Run code repeatedly every N milliseconds.\nUse clearInterval() to stop it.\n\nGenerates:\n  setInterval(() => {\n    ...\n  }, 1000);"
  }

]);