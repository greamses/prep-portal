Blockly.defineBlocksWithJsonArray([
{
  "type": "css_display",
  "message0": "display: %1;",
  "args0": [
  {
    "type": "field_dropdown",
    "name": "VAL",
    "options": [
      ["block", "block"],
      ["flex", "flex"],
      ["grid", "grid"],
      ["inline-block", "inline-block"],
      ["none", "none"]
    ]
  }],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": "#3F51B5"
},
{
  "type": "css_box_model",
  "message0": "%1: %2;",
  "args0": [
    { "type": "field_dropdown", "name": "PROP", "options": [
        ["margin", "margin"],
        ["padding", "padding"]
      ] },
    { "type": "field_input", "name": "VAL", "text": "10px" }
  ],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": "#3F51B5"
},
{
  "type": "css_size",
  "message0": "%1: %2;",
  "args0": [
    { "type": "field_dropdown", "name": "PROP", "options": [
        ["width", "width"],
        ["height", "height"],
        ["max-width", "max-width"]
      ] },
    { "type": "field_input", "name": "VAL", "text": "100%" }
  ],
  "previousStatement": "CSS_PROP",
  "nextStatement": "CSS_PROP",
  "colour": "#3F51B5"
}])