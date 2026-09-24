// ══════════════════════════════════════════════
//  js-string.js — String Methods
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_str_length",
    "message0": "%1.length",
    "args0": [{ "type": "input_value", "name": "STR" }],
    "inputsInline": true,
    "output": "Number", "colour": 160,
    "tooltip": "Get the number of characters in a string.\n\nGenerates:  str.length"
  },

  {
    "type": "js_str_method_0",
    "message0": "%1.%2()",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_dropdown", "name": "METHOD",
        "options": [
          ["toUpperCase","toUpperCase"],["toLowerCase","toLowerCase"],
          ["trim","trim"],["trimStart","trimStart"],["trimEnd","trimEnd"],
          ["reverse — split first","split(\"\").reverse().join(\"\")"]
        ]
      }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Call a zero-argument string method.\n\n  toUpperCase → \"hello\" → \"HELLO\"\n  toLowerCase → \"HELLO\" → \"hello\"\n  trim        → removes whitespace from both ends\n\nGenerates:  str.toUpperCase()"
  },

  {
    "type": "js_str_includes",
    "message0": "%1.includes(%2)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "input_value", "name": "SEARCH" }
    ],
    "inputsInline": true,
    "output": "Boolean", "colour": 160,
    "tooltip": "Check if a string contains another string.\nReturns true or false.\n\nGenerates:  str.includes(search)"
  },

  {
    "type": "js_str_starts_ends",
    "message0": "%1.%2(%3)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_dropdown", "name": "METHOD",
        "options": [["startsWith","startsWith"],["endsWith","endsWith"]] },
      { "type": "input_value", "name": "SEARCH" }
    ],
    "inputsInline": true,
    "output": "Boolean", "colour": 160,
    "tooltip": "Check if a string starts or ends with a given value.\nReturns true or false.\n\nGenerates:  str.startsWith(search)"
  },

  {
    "type": "js_str_index_of",
    "message0": "%1.indexOf(%2)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "input_value", "name": "SEARCH" }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 160,
    "tooltip": "Find the position of a substring (zero-based index).\nReturns -1 if not found.\n\nGenerates:  str.indexOf(search)"
  },

  {
    "type": "js_str_slice",
    "message0": "%1.slice(%2, %3)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_number", "name": "START", "value": 0 },
      { "type": "field_number", "name": "END", "value": 5 }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Extract a portion of a string (start is inclusive, end is exclusive).\nNegative numbers count from the end.\n\nGenerates:  str.slice(0, 5)"
  },

  {
    "type": "js_str_replace",
    "message0": "%1.replace(%2, %3)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "input_value", "name": "FROM" },
      { "type": "input_value", "name": "TO" }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Replace the first occurrence of a substring.\nDoes not change the original string — returns a new one.\n\nGenerates:  str.replace(from, to)"
  },

  {
    "type": "js_str_replace_all",
    "message0": "%1.replaceAll(%2, %3)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "input_value", "name": "FROM" },
      { "type": "input_value", "name": "TO" }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Replace every occurrence of a substring.\nReturns a new string.\n\nGenerates:  str.replaceAll(from, to)"
  },

  {
    "type": "js_str_split",
    "message0": "%1.split(%2)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "input_value", "name": "SEP" }
    ],
    "inputsInline": true,
    "output": "Array", "colour": 160,
    "tooltip": "Split a string into an array using a separator.\n\nExample: \"a,b,c\".split(\",\")  → [\"a\", \"b\", \"c\"]\nUse \"\" to split into individual characters.\n\nGenerates:  str.split(sep)"
  },

  {
    "type": "js_str_char_at",
    "message0": "%1.charAt(%2)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_number", "name": "INDEX", "value": 0 }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Get the character at a specific index (zero-based).\n\nGenerates:  str.charAt(0)"
  },

  {
    "type": "js_str_repeat",
    "message0": "%1.repeat(%2)",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_number", "name": "TIMES", "value": 3 }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Repeat a string N times.\n\nExample: \"ha\".repeat(3)  → \"hahaha\"\n\nGenerates:  str.repeat(3)"
  },

  {
    "type": "js_str_pad",
    "message0": "%1.%2(%3, \"%4\")",
    "args0": [
      { "type": "input_value", "name": "STR" },
      { "type": "field_dropdown", "name": "METHOD",
        "options": [["padStart","padStart"],["padEnd","padEnd"]] },
      { "type": "field_number", "name": "LEN", "value": 5 },
      { "type": "field_input", "name": "FILL", "text": "0" }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Pad a string to a target length with a fill character.\n\n  padStart(5, \"0\") → \"007\" becomes \"00007\"\n  padEnd(5, \".\")   → \"hi\" becomes \"hi...\"\n\nGenerates:  str.padStart(5, \"0\")"
  }

]);