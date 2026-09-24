// modules/style.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_div'];
  delete Blockly.Blocks['html_span'];
  delete Blockly.Blocks['html_style'];
  delete Blockly.Blocks['html_text'];
  delete Blockly.Blocks['html_format'];

  Blockly.defineBlocksWithJsonArray([
    {
      "type": "html_div",
      "colour": "#AD1457",
      "message0": "<div %1> %2 </div>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    },
    {
      "type": "html_span",
      "colour": "#AD1457",
      "message0": "<span %1> %2 </span>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    },
    {
      "type": "html_style",
      "colour": "#AD1457",
      "message0": "<style %1> %2 </style>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    },
    {
      "type": "html_text",
      "colour": "#AD1457",
      "message0": "text %1",
      "args0": [
        { "type": "field_input", "name": "TEXT", "text": "Hello world" }
      ],
      "previousStatement": null,
      "nextStatement": null
    },
    {
      "type": "html_format",
      "colour": "#AD1457",
      "message0": "<%1 %2> %3 </%4>",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TAG",
          "options": [
            ["strong", "strong"],
            ["b", "b"],
            ["em", "em"],
            ["i", "i"],
            ["u", "u"],
            ["mark", "mark"],
            ["small", "small"],
            ["sub", "sub"],
            ["sup", "sup"],
            ["del", "del"],
            ["ins", "ins"],
            ["code", "code"],
            ["kbd", "kbd"],
            ["samp", "samp"],
            ["abbr", "abbr"],
            ["q", "q"],
            ["cite", "cite"]
          ]
        },
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "field_input", "name": "TEXT", "text": "formatted text" },
        { "type": "field_label_serializable", "name": "CLOSE", "text": "strong" }
      ],
      "previousStatement": null,
      "nextStatement": null
    }
  ]);

  Blockly.Blocks['html_div'].init = function () {
    this.jsonInit({
      "colour": "#AD1457",
      "message0": "<div %1> %2 </div>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    });
  };

  Blockly.Blocks['html_span'].init = function () {
    this.jsonInit({
      "colour": "#AD1457",
      "message0": "<span %1> %2 </span>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    });
  };

  Blockly.Blocks['html_style'].init = function () {
    this.jsonInit({
      "colour": "#AD1457",
      "message0": "<style %1> %2 </style>",
      "args0": [
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "input_statement", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null
    });
  };

  Blockly.Blocks['html_text'].init = function () {
    this.jsonInit({
      "colour": "#AD1457",
      "message0": "text %1",
      "args0": [
        { "type": "field_input", "name": "TEXT", "text": "Hello world" }
      ],
      "previousStatement": null,
      "nextStatement": null
    });
  };

  Blockly.Blocks['html_format'].init = function () {
    this.jsonInit({
      "colour": "#AD1457",
      "message0": "<%1 %2> %3 </%4>",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TAG",
          "options": [
            ["strong", "strong"],
            ["b", "b"],
            ["em", "em"],
            ["i", "i"],
            ["u", "u"],
            ["mark", "mark"],
            ["small", "small"],
            ["sub", "sub"],
            ["sup", "sup"],
            ["del", "del"],
            ["ins", "ins"],
            ["code", "code"],
            ["kbd", "kbd"],
            ["samp", "samp"],
            ["abbr", "abbr"],
            ["q", "q"],
            ["cite", "cite"]
          ]
        },
        { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
        { "type": "field_input", "name": "TEXT", "text": "formatted text" },
        { "type": "field_label_serializable", "name": "CLOSE", "text": "strong" }
      ],
      "previousStatement": null,
      "nextStatement": null
    });

    this.setOnChange(() => {
      const tag = this.getFieldValue('TAG');
      this.setFieldValue(tag, 'CLOSE');
    });
  };

})();