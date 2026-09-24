// ══════════════════════════════════════════════
//  js-dom.js — DOM Selection & Manipulation
// ══════════════════════════════════════════════
Blockly.defineBlocksWithJsonArray([

  // ── Getter (dropdown) ─────────────────────────
  {
    "type": "js_dom_get",
    "message0": "document.%1(\"%2\")",
    "args0": [
      { "type": "field_dropdown", "name": "METHOD",
        "options": [
          ["getElementById","getElementById"],
          ["querySelector","querySelector"],
          ["querySelectorAll","querySelectorAll"]
        ]
      },
      { "type": "field_input", "name": "SELECTOR", "text": "#myId" }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Select element(s) from the DOM.\n\n  getElementById   → use a bare id, e.g.  myId\n  querySelector    → any CSS selector, e.g.  .card\n  querySelectorAll → returns a NodeList\n\nGenerates:  document.getElementById(\"myId\")"
  },

  // ── Property setter (dropdown) ────────────────
  {
    "type": "js_dom_set",
    "message0": "%1.%2 = %3",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_dropdown", "name": "PROP",
        "options": [
          ["innerHTML","innerHTML"],
          ["textContent","textContent"],
          ["value","value"],
          ["src","src"],
          ["href","href"],
          ["className","className"],
          ["id","id"],
          ["placeholder","placeholder"],
          ["disabled","disabled"]
        ]
      },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Set a property on a DOM element.\n\n  innerHTML   → sets HTML content (parses tags)\n  textContent → sets plain text (safe, no HTML)\n  value       → input/textarea current value\n  src / href  → media or link URL\n  className   → full class string\n\nGenerates:  elem.innerHTML = value;"
  },

  // ── Property getter ───────────────────────────
  {
    "type": "js_dom_get_prop",
    "message0": "%1.%2",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_dropdown", "name": "PROP",
        "options": [
          ["innerHTML","innerHTML"],
          ["textContent","textContent"],
          ["value","value"],
          ["src","src"],
          ["href","href"],
          ["className","className"],
          ["id","id"],
          ["checked","checked"]
        ]
      }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Read a property from a DOM element.\n\nGenerates:  elem.innerHTML"
  },

  // ── style property setter ─────────────────────
  {
    "type": "js_set_style",
    "message0": "%1.style.%2 = %3",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_input", "name": "PROP", "text": "color" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Set an inline CSS style on an element.\n\nExamples:\n  prop: color     value: \"red\"\n  prop: fontSize  value: \"24px\"\n\nGenerates:  elem.style.color = \"red\";"
  },

  // ── classList ─────────────────────────────────
  {
    "type": "js_classlist",
    "message0": "%1.classList.%2(\"%3\")",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_dropdown", "name": "METHOD",
        "options": [["add","add"],["remove","remove"],["toggle","toggle"]] },
      { "type": "field_input", "name": "CLASS", "text": "active" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Modify the CSS classes of an element.\n\n  add    → adds a class if not present\n  remove → removes the class\n  toggle → adds if absent, removes if present\n\nGenerates:  elem.classList.add(\"active\");"
  },

  // ── setAttribute ─────────────────────────────
  {
    "type": "js_set_attr",
    "message0": "%1.setAttribute(\"%2\", %3)",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_input", "name": "ATTR", "text": "data-id" },
      { "type": "input_value", "name": "VALUE" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Set any HTML attribute on an element.\n\nUseful for: data-*, aria-*, type, name, etc.\n\nGenerates:  elem.setAttribute(\"data-id\", value);"
  },

  // ── getAttribute ─────────────────────────────
  {
    "type": "js_get_attr",
    "message0": "%1.getAttribute(\"%2\")",
    "args0": [
      { "type": "input_value", "name": "ELEM" },
      { "type": "field_input", "name": "ATTR", "text": "data-id" }
    ],
    "inputsInline": true,
    "output": null, "colour": 160,
    "tooltip": "Read any HTML attribute from an element.\n\nGenerates:  elem.getAttribute(\"data-id\")"
  },

  // ── createElement ────────────────────────────
  {
    "type": "js_create_element",
    "message0": "document.createElement(\"%1\")",
    "args0": [{ "type": "field_input", "name": "TAG", "text": "div" }],
    "output": null, "colour": 160,
    "tooltip": "Create a new HTML element in memory (not yet on the page).\nUse appendChild to attach it.\n\nGenerates:  document.createElement(\"div\")"
  },

  // ── appendChild ──────────────────────────────
  {
    "type": "js_append_child",
    "message0": "%1.appendChild(%2)",
    "args0": [
      { "type": "input_value", "name": "PARENT" },
      { "type": "input_value", "name": "CHILD" }
    ],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Attach a child element inside a parent element.\n\nGenerates:  parent.appendChild(child);"
  },

  // ── remove ───────────────────────────────────
  {
    "type": "js_remove_element",
    "message0": "%1.remove()",
    "args0": [{ "type": "input_value", "name": "ELEM" }],
    "inputsInline": true,
    "previousStatement": null, "nextStatement": null,
    "colour": 160,
    "tooltip": "Remove an element from the DOM entirely.\n\nGenerates:  elem.remove();"
  }

]);