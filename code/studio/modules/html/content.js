// modules/content.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_element'];
  delete Blockly.Blocks['html_br'];

  Blockly.defineBlocksWithJsonArray([
    {
      "type": "html_element",
      "colour": "#FF6000",
      "message0": "<%1 %2> %3 </%4>",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TAG",
          "options": [
            ["h1", "h1"],
            ["h2", "h2"],
            ["h3", "h3"],
            ["h4", "h4"],
            ["h5", "h5"],
            ["h6", "h6"],
            ["p", "p"],
            ["b", "b"],
            ["i", "i"]
          ]
        },
        {
          "type": "input_value",
          "name": "ATTR",
          "check": "HtmlAttribute"
        },
        {
          "type": "input_statement",
          "name": "CONTENT"
        },
        {
          "type": "field_label_serializable",
          "name": "CLOSE",
          "text": "h1"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "HTML element with optional attributes and nested content"
    },
    {
      "type": "html_br",
      "colour": "#FF6000",
      "message0": "<br %1>",
      "args0": [
        {
          "type": "input_value",
          "name": "ATTR",
          "check": "HtmlAttribute"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "tooltip": "Line break with optional attributes"
    }
  ]);

  // Dynamic closing tag sync
  Blockly.Blocks['html_element'].init = function () {
    this.jsonInit({
      "colour": "#FF6000",
      "message0": "<%1 %2> %3 </%4>",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "TAG",
          "options": [
            ["h1", "h1"],
            ["h2", "h2"],
            ["h3", "h3"],
            ["h4", "h4"],
            ["h5", "h5"],
            ["h6", "h6"],
            ["p", "p"],
            ["b", "b"],
            ["i", "i"]
          ]
        },
        {
          "type": "input_value",
          "name": "ATTR",
          "check": "HtmlAttribute"
        },
        {
          "type": "input_statement",
          "name": "CONTENT"
        },
        {
          "type": "field_label_serializable",
          "name": "CLOSE",
          "text": "h1"
        }
      ],
      "previousStatement": null,
      "nextStatement": null
    });

    // Sync closing tag
    this.setOnChange(() => {
      const tag = this.getFieldValue('TAG');
      this.setFieldValue(tag, 'CLOSE');
    });
  };

})();