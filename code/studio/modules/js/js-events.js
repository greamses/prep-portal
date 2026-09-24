// ══════════════════════════════════════════════
//  js-events.js — Event Listeners
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  {
    "type": "js_add_event_listener",
    "message0": "%1.addEventListener(\"%2\", (event) => {%3  %4})",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_dropdown", "name": "EVENT",
        "options": [
          ["click","click"],["dblclick","dblclick"],
          ["mouseover","mouseover"],["mouseout","mouseout"],["mousemove","mousemove"],
          ["keydown","keydown"],["keyup","keyup"],["keypress","keypress"],
          ["submit","submit"],["change","change"],["input","input"],
          ["focus","focus"],["blur","blur"],
          ["load","load"],["scroll","scroll"],["resize","resize"]
        ]
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Listen for an event on an element.\nThe event object is available as 'event' inside.\n\nGenerates:\n  elem.addEventListener(\"click\", (event) => {\n    ...\n  });"
  },

  {
    "type": "js_window_onload",
    "message0": "window.addEventListener(\"load\", () => {%1  %2})",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Run code after the entire page (images, styles) has loaded.\n\nGenerates:\n  window.addEventListener(\"load\", () => {\n    ...\n  });"
  },

  {
    "type": "js_dom_content_loaded",
    "message0": "document.addEventListener(\"DOMContentLoaded\", () => {%1  %2})",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Run code as soon as the HTML is parsed (faster than window.load).\nBest place to put your startup code.\n\nGenerates:\n  document.addEventListener(\"DOMContentLoaded\", () => {\n    ...\n  });"
  },

  {
    "type": "js_event_target",
    "message0": "event.target",
    "output": null, "colour": 45,
    "tooltip": "The specific element the user interacted with.\nUseful when one listener handles many elements.\n\nGenerates:  event.target"
  },

  {
    "type": "js_event_key",
    "message0": "event.key === \"%1\"",
    "args0": [{ "type": "field_input", "name": "KEY", "text": "Enter" }],
    "output": "Boolean", "colour": 45,
    "tooltip": "Check which keyboard key was pressed.\n\nCommon keys: Enter, Escape, ArrowUp, ArrowDown, \" \" (Space)\n\nGenerates:  event.key === \"Enter\""
  },

  {
    "type": "js_prevent_default",
    "message0": "event.preventDefault()",
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Stop the browser's default action for this event.\n\nExamples:\n  form submit → prevents page reload\n  link click  → prevents navigation\n\nGenerates:  event.preventDefault();"
  },

  {
    "type": "js_stop_propagation",
    "message0": "event.stopPropagation()",
    "previousStatement": null, "nextStatement": null,
    "colour": 45,
    "tooltip": "Stop the event from bubbling up to parent elements.\nParent listeners won't fire after this.\n\nGenerates:  event.stopPropagation();"
  }

]);