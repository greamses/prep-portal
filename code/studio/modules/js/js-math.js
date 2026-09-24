// ══════════════════════════════════════════════
//  js-math.js — Math Blocks
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_math_op",
    "message0": "%1 %2 %3",
    "args0": [
      { "type": "input_value", "name": "LEFT" },
      { "type": "field_dropdown", "name": "OP",
        "options": [["+","+"],["-","-"],["*","*"],["/","/"],["%","%"],["**","**"]] },
      { "type": "input_value", "name": "RIGHT" }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 230,
    "tooltip": "Arithmetic between two values.\n\n  +   addition\n  -   subtraction\n  *   multiplication\n  /   division\n  %   remainder (modulo)\n  **  exponentiation (power)\n\nGenerates:  a + b"
  },

  {
    "type": "js_math_single",
    "message0": "Math.%1(%2)",
    "args0": [
      { "type": "field_dropdown", "name": "METHOD",
        "options": [
          ["abs","abs"],["ceil","ceil"],["floor","floor"],
          ["round","round"],["sqrt","sqrt"],["cbrt","cbrt"],
          ["log","log"],["log2","log2"],["log10","log10"],
          ["sign","sign"],["trunc","trunc"]
        ]
      },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 230,
    "tooltip": "Apply a Math method to one value.\n\n  abs   → absolute value (removes minus sign)\n  ceil  → round up to nearest integer\n  floor → round down to nearest integer\n  round → round to nearest integer\n  sqrt  → square root\n  sign  → -1, 0, or 1\n\nGenerates:  Math.floor(value)"
  },

  {
    "type": "js_math_double",
    "message0": "Math.%1(%2, %3)",
    "args0": [
      { "type": "field_dropdown", "name": "METHOD",
        "options": [["max","max"],["min","min"],["pow","pow"]] },
      { "type": "input_value", "name": "A" },
      { "type": "input_value", "name": "B" }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 230,
    "tooltip": "Math methods that take two values.\n\n  max(a, b) → the larger of a or b\n  min(a, b) → the smaller of a or b\n  pow(a, b) → a raised to the power b  (same as a**b)\n\nGenerates:  Math.max(a, b)"
  },

  {
    "type": "js_math_random",
    "message0": "Math.random()",
    "output": "Number", "colour": 230,
    "tooltip": "Returns a random decimal between 0 (inclusive) and 1 (exclusive).\n\nGenerates:  Math.random()"
  },

  {
    "type": "js_math_random_int",
    "message0": "random int 0 to %1",
    "args0": [{ "type": "field_number", "name": "MAX", "value": 10 }],
    "output": "Number", "colour": 230,
    "tooltip": "Returns a random whole number from 0 up to (but not including) max.\n\nGenerates:  Math.floor(Math.random() * 10)"
  },

  {
    "type": "js_math_random_range",
    "message0": "random int %1 to %2",
    "args0": [
      { "type": "field_number", "name": "MIN", "value": 1 },
      { "type": "field_number", "name": "MAX", "value": 6 }
    ],
    "output": "Number", "colour": 230,
    "tooltip": "Returns a random whole number between min and max (both inclusive).\n\nGenerates:  Math.floor(Math.random() * (6 - 1 + 1)) + 1"
  },

  {
    "type": "js_math_const",
    "message0": "Math.%1",
    "args0": [
      { "type": "field_dropdown", "name": "CONST",
        "options": [["PI","PI"],["E","E"],["SQRT2","SQRT2"],
                    ["LN2","LN2"],["LN10","LN10"]] }
    ],
    "output": "Number", "colour": 230,
    "tooltip": "Built-in mathematical constants.\n\n  PI    → 3.14159… (ratio of circle circumference to diameter)\n  E     → 2.71828… (Euler's number)\n  SQRT2 → 1.41421… (square root of 2)\n\nGenerates:  Math.PI"
  },

  {
    "type": "js_parse_int",
    "message0": "parseInt(%1, %2)",
    "args0": [
      { "type": "input_value", "name": "VALUE" },
      { "type": "field_number", "name": "RADIX", "value": 10 }
    ],
    "inputsInline": true,
    "output": "Number", "colour": 230,
    "tooltip": "Convert a string to a whole number.\nRadix is the base: 10 = decimal, 16 = hex, 2 = binary.\n\nGenerates:  parseInt(value, 10)"
  },

  {
    "type": "js_parse_float",
    "message0": "parseFloat(%1)",
    "args0": [{ "type": "input_value", "name": "VALUE" }],
    "inputsInline": true,
    "output": "Number", "colour": 230,
    "tooltip": "Convert a string to a decimal number.\n\nGenerates:  parseFloat(value)"
  }

]);