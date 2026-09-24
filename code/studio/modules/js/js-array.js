// ══════════════════════════════════════════════
//  js-array.js — Array Blocks
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_array_literal",
    "message0": "[ %1 ]",
    "args0": [{ "type": "field_input", "name": "ITEMS", "text": "1, 2, 3" }],
    "output": "Array", "colour": 120,
    "tooltip": "Create an array. Separate items with commas.\nNumbers and booleans are unquoted; strings need quotes.\n\nExample: 1, 2, 3  or  \"a\", \"b\", \"c\"\nGenerates:  [1, 2, 3]"
  },

  {
    "type": "js_array_get",
    "message0": "%1[%2]",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "field_number", "name": "INDEX", "value": 0 }
    ],
    "inputsInline": true,
    "output": null, "colour": 120,
    "tooltip": "Get the element at an index (zero-based).\n\nFirst element → index 0\nLast element  → index arr.length - 1\n\nGenerates:  arr[0]"
  },

  {
    "type": "js_array_set",
    "message0": "%1[%2] = %3",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "field_number", "name": "INDEX", "value": 0 },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Set the value at a specific index.\n\nGenerates:  arr[0] = value;"
  },

  {
    "type": "js_array_length",
    "message0": "%1.length",
    "args0": [{ "type": "input_value", "name": "ARR" }],
    "inputsInline": true,
    "output": "Number", "colour": 120,
    "tooltip": "Get the number of elements in the array.\n\nGenerates:  arr.length"
  },

  {
    "type": "js_array_push",
    "message0": "%1.push(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "input_value", "name": "ITEM" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Add an element to the END of an array.\nModifies the original array.\n\nGenerates:  arr.push(item);"
  },

  {
    "type": "js_array_pop",
    "message0": "%1.pop()",
    "args0": [{ "type": "input_value", "name": "ARR" }],
    "inputsInline": true,
    "output": null, "colour": 120,
    "tooltip": "Remove and return the LAST element of an array.\nModifies the original array.\n\nGenerates:  arr.pop()"
  },

  {
    "type": "js_array_unshift",
    "message0": "%1.unshift(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "input_value", "name": "ITEM" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Add an element to the START of an array.\nModifies the original array.\n\nGenerates:  arr.unshift(item);"
  },

  {
    "type": "js_array_shift",
    "message0": "%1.shift()",
    "args0": [{ "type": "input_value", "name": "ARR" }],
    "inputsInline": true,
    "output": null, "colour": 120,
    "tooltip": "Remove and return the FIRST element of an array.\nModifies the original array.\n\nGenerates:  arr.shift()"
  },

  {
    "type": "js_array_includes",
    "message0": "%1.includes(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "input_value", "name": "ITEM" }
    ],
    "inputsInline": true,
    "output": "Boolean", "colour": 120,
    "tooltip": "Check if an array contains a value.\nReturns true or false.\n\nGenerates:  arr.includes(item)"
  },

  {
    "type": "js_array_index_of",
    "message0": "%1.indexOf(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "input_value", "name": "ITEM" }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 120,
    "tooltip": "Find the index of a value in an array.\nReturns -1 if not found.\n\nGenerates:  arr.indexOf(item)"
  },

  {
    "type": "js_array_join",
    "message0": "%1.join(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "input_value", "name": "SEP" }
    ],
    "inputsInline": true,
    "output": null, "colour": 120,
    "tooltip": "Join all array elements into one string.\n\nExample: [\"a\",\"b\",\"c\"].join(\", \")  → \"a, b, c\"\n\nGenerates:  arr.join(\", \")"
  },

  {
    "type": "js_array_slice",
    "message0": "%1.slice(%2, %3)",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "field_number", "name": "START", "value": 0 },
      { "type": "field_number", "name": "END", "value": 2 }
    ],
    "inputsInline": true,
    "output": "Array", "colour": 120,
    "tooltip": "Return a section of an array as a new array.\nOriginal is unchanged.\nEnd index is exclusive.\n\nGenerates:  arr.slice(0, 2)"
  },

  {
    "type": "js_array_reverse",
    "message0": "[...%1].reverse()",
    "args0": [{ "type": "input_value", "name": "ARR" }],
    "inputsInline": true,
    "output": "Array", "colour": 120,
    "tooltip": "Return a reversed copy of the array (original unchanged).\n\nGenerates:  [...arr].reverse()"
  },

  {
    "type": "js_array_sort",
    "message0": "[...%1].sort()",
    "args0": [{ "type": "input_value", "name": "ARR" }],
    "inputsInline": true,
    "output": "Array", "colour": 120,
    "tooltip": "Return a sorted copy of the array (original unchanged).\nSorts alphabetically by default.\nFor numbers, a custom comparator is needed.\n\nGenerates:  [...arr].sort()"
  },

  {
    "type": "js_array_foreach",
    "message0": "%1.forEach((%2) => {%3  %4})",
    "args0": [
      { "type": "input_value", "name": "ARR" },
      { "type": "field_input", "name": "ITEM", "text": "item" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 120,
    "tooltip": "Run code once for every element in the array.\nThe current element is available as the named variable.\n\nGenerates:\n  arr.forEach((item) => {\n    ...\n  });"
  },

  {
    "type": "js_array_concat",
    "message0": "%1.concat(%2)",
    "args0": [
      { "type": "input_value", "name": "ARR1" },
      { "type": "input_value", "name": "ARR2" }
    ],
    "inputsInline": true,
    "output": "Array", "colour": 120,
    "tooltip": "Merge two arrays into one new array.\n\nGenerates:  arr1.concat(arr2)"
  }

]);