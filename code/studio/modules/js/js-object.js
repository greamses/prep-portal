// ══════════════════════════════════════════════
//  js-object.js — Object & JSON Blocks
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_object_literal",
    "message0": "{ %1 }",
    "args0": [{ "type": "field_input", "name": "PAIRS", "text": "name: \"Alice\", age: 20" }],
    "output": "Object", "colour": 65,
    "tooltip": "Create an object with key: value pairs.\nSeparate pairs with commas.\nString values need quotes; numbers/booleans don't.\n\nExample:  name: \"Alice\", age: 20, active: true\nGenerates:  { name: \"Alice\", age: 20, active: true }"
  },

  {
    "type": "js_object_get",
    "message0": "%1.%2",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      { "type": "field_input", "name": "KEY", "text": "name" }
    ],
    "inputsInline": true,
    "output": null, "colour": 65,
    "tooltip": "Read a property from an object using dot notation.\n\nGenerates:  obj.name"
  },

  {
    "type": "js_object_get_bracket",
    "message0": "%1[%2]",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      { "type": "input_value", "name": "KEY" }
    ],
    "inputsInline": true,
    "output": null, "colour": 65,
    "tooltip": "Read a property using bracket notation.\nUseful when the key is stored in a variable.\n\nGenerates:  obj[key]"
  },

  {
    "type": "js_object_set",
    "message0": "%1.%2 = %3",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      { "type": "field_input", "name": "KEY", "text": "name" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Set or update a property on an object.\nCreates the key if it doesn't exist.\n\nGenerates:  obj.name = value;"
  },

  {
    "type": "js_object_delete",
    "message0": "delete %1.%2",
    "args0": [
      { "type": "input_value", "name": "OBJ" },
      { "type": "field_input", "name": "KEY", "text": "name" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 65,
    "tooltip": "Remove a property from an object entirely.\n\nGenerates:  delete obj.name;"
  },

  {
    "type": "js_object_keys",
    "message0": "Object.keys(%1)",
    "args0": [{ "type": "input_value", "name": "OBJ" }],
    "inputsInline": true,
    "output": "Array", "colour": 65,
    "tooltip": "Get all property names (keys) of an object as an array.\n\nGenerates:  Object.keys(obj)"
  },

  {
    "type": "js_object_values",
    "message0": "Object.values(%1)",
    "args0": [{ "type": "input_value", "name": "OBJ" }],
    "inputsInline": true,
    "output": "Array", "colour": 65,
    "tooltip": "Get all property values of an object as an array.\n\nGenerates:  Object.values(obj)"
  },

  {
    "type": "js_object_entries",
    "message0": "Object.entries(%1)",
    "args0": [{ "type": "input_value", "name": "OBJ" }],
    "inputsInline": true,
    "output": "Array", "colour": 65,
    "tooltip": "Get all [key, value] pairs as an array of arrays.\nUseful for looping over an object.\n\nGenerates:  Object.entries(obj)"
  },

  {
    "type": "js_object_assign",
    "message0": "Object.assign(%1, %2)",
    "args0": [
      { "type": "input_value", "name": "TARGET" },
      { "type": "input_value", "name": "SOURCE" }
    ],
    "inputsInline": true,
    "output": "Object", "colour": 65,
    "tooltip": "Copy all properties from source into target.\nMutates target and returns it.\n\nGenerates:  Object.assign(target, source)"
  },

  {
    "type": "js_spread_object",
    "message0": "{ ...%1 }",
    "args0": [{ "type": "input_value", "name": "OBJ" }],
    "inputsInline": true,
    "output": "Object", "colour": 65,
    "tooltip": "Create a shallow copy of an object using spread syntax.\n\nGenerates:  { ...obj }"
  },

  {
    "type": "js_json_stringify",
    "message0": "JSON.stringify(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": null, "colour": 65,
    "tooltip": "Convert an object (or array) to a JSON string.\nUseful for saving data or sending it to a server.\n\nGenerates:  JSON.stringify(value)"
  },

  {
    "type": "js_json_parse",
    "message0": "JSON.parse(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": "Object", "colour": 65,
    "tooltip": "Parse a JSON string back into a JavaScript object.\nWrap in try/catch — throws if the string is invalid JSON.\n\nGenerates:  JSON.parse(value)"
  }

]);