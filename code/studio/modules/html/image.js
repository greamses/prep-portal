// modules/image.js
// ── Image & Media Blocks ──────────────────────────
Blockly.defineBlocksWithJsonArray([
  {
    "type": "html_img",
    "colour": "#7B1FA2",
    "message0": "<img src= %1 alt= %2 %3 >",
    "args0": [
      { "type": "field_input", "name": "SRC", "text": "image.jpg" },
      { "type": "field_input", "name": "ALT", "text": "photo" },
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Image with optional attributes"
  },
  {
    "type": "html_audio",
    "colour": "#7B1FA2",
    "message0": "<audio src= %1 %2 controls> %3 </audio>",
    "args0": [
      { "type": "field_input", "name": "SRC", "text": "audio.mp3" },
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
      { "type": "input_statement", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Audio player — C-block"
  },
  {
    "type": "html_video",
    "colour": "#7B1FA2",
    "message0": "<video src= %1 %2 controls> %3 </video>",
    "args0": [
      { "type": "field_input", "name": "SRC", "text": "video.mp4" },
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
      { "type": "input_statement", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Video player — C-block"
  },
  {
    "type": "html_source",
    "colour": "#7B1FA2",
    "message0": "<source src= %1 type= %2 %3 >",
    "args0": [
      { "type": "field_input", "name": "SRC", "text": "media.mp4" },
      { "type": "field_input", "name": "TYPE", "text": "video/mp4" },
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Media source — nest inside audio/video"
  },
  {
    "type": "html_iframe",
    "colour": "#7B1FA2",
    "message0": "<iframe src= %1 %2 > %3 </iframe>",
    "args0": [
      { "type": "field_input", "name": "SRC", "text": "https://" },
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
      { "type": "input_statement", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Embedded iframe — C-block"
  },
  {
    "type": "html_figure",
    "colour": "#7B1FA2",
    "message0": "<figure %1 > %2 </figure>",
    "args0": [
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
      { "type": "input_statement", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Figure container — C-block"
  },
  {
    "type": "html_figcaption",
    "colour": "#7B1FA2",
    "message0": "<figcaption %1 > %2 </figcaption>",
    "args0": [
      { "type": "input_value", "name": "ATTR", "check": "HtmlAttribute" },
      { "type": "input_statement", "name": "CONTENT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "tooltip": "Figure caption — C-block"
  }
]);