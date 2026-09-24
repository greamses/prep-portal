// ══════════════════════════════════════════════
//  script.js – UI, Blockly, Extensions, Boot
// ══════════════════════════════════════════════

// The studio opens on the blocks. (It used to open on a map of locked
// lessons; the map is gone, and the workbench is what a person came for.)

// ── Blockly Workspaces ─────────────────────────
let workspaceHtml;
let workspaceCss;
let workspaceJs;
let activeTab = 'blocks';
let currentLangMode = 'html';

// ── Toolbox Categories (HTML) ─────────────────
const TOOLBOX_CATEGORIES = {
  page: ['html_root', 'html_head', 'html_body', 'html_title', 'html_meta', 'html_link', 'html_style', 'html_script', 'html_header', 'html_main', 'html_footer'],
  content: ['html_element', 'html_br'],
  links: ['html_a', 'html_nav', 'html_nav_a'],
  media: ['html_img', 'html_audio', 'html_video', 'html_source', 'html_iframe', 'html_figure', 'html_figcaption'],
  lists: ['html_ul', 'html_ol', 'html_li'],
  table: ['html_table', 'html_caption', 'html_colgroup', 'html_col', 'html_thead', 'html_tbody', 'html_tfoot', 'html_tr', 'html_td', 'html_th'],
  form: ['html_form', 'html_input', 'html_label', 'html_textarea', 'html_btn', 'html_select', 'html_optgroup', 'html_option', 'html_fieldset', 'html_legend', 'html_datalist', 'html_output'],
  style: ['html_div', 'html_span', 'html_text', 'html_format'],
  attributes: ['html_attrs', 'attr_id', 'attr_class', 'attr_style', 'attr_src', 'attr_href']
};

// ── Toolbox Categories (CSS) ──────────────────
const CSS_TOOLBOX_CATEGORIES = {
  selectors: [
    'css_rule', 'css_selector_tag', 'css_selector_class', 'css_selector_id',
    'css_selector_pseudo', 'css_selector_attr', 'css_selector_combinator'
  ],
  layout: ['css_display', 'css_box_model', 'css_size'],
  color: [
    'css_color', 'css_bg_color', 'css_border', 'css_custom',
    'css_color_value_named', 'css_color_value_picker', 'css_color_value_hex', 'css_color_value_rgb'
  ],
  animation: ['css_transition', 'css_transform']
};

// ── Toolbox Categories (JS) ───────────────────
const JS_TOOLBOX_CATEGORIES = {
  variables: [
    'js_declare', 'js_assign', 'js_compound_assign', 'js_increment',
    'js_string', 'js_template_literal', 'js_number', 'js_bool',
    'js_nullish', 'js_var_ref', 'js_typeof'
  ],
  control: [
    'js_if', 'js_if_else', 'js_for', 'js_for_of',
    'js_while', 'js_compare', 'js_logic', 'js_not', 'js_ternary', 'js_break'
  ],
  dom: [
    'js_dom_get', 'js_dom_set', 'js_dom_get_prop', 'js_set_style',
    'js_classlist', 'js_set_attr', 'js_get_attr', 'js_create_element',
    'js_append_child', 'js_remove_element'
  ],
  functions: [
    'js_function', 'js_arrow_function', 'js_call_stmt', 'js_call_expr', 'js_return',
    'js_console_log', 'js_alert', 'js_confirm', 'js_prompt', 'js_set_timeout', 'js_set_interval'
  ],
  events: [
    'js_add_event_listener', 'js_window_onload', 'js_dom_content_loaded',
    'js_event_target', 'js_event_key', 'js_prevent_default', 'js_stop_propagation'
  ],
  math: [
    'js_math_op', 'js_math_single', 'js_math_double', 'js_math_random',
    'js_math_random_int', 'js_math_random_range', 'js_math_const',
    'js_parse_int', 'js_parse_float'
  ],
  string: [
    'js_str_length', 'js_str_method_0', 'js_str_includes', 'js_str_starts_ends',
    'js_str_index_of', 'js_str_slice', 'js_str_replace', 'js_str_replace_all',
    'js_str_split', 'js_str_char_at', 'js_str_repeat', 'js_str_pad'
  ],
  array: [
    'js_array_literal', 'js_array_get', 'js_array_set', 'js_array_length',
    'js_array_push', 'js_array_pop', 'js_array_unshift', 'js_array_shift',
    'js_array_includes', 'js_array_index_of', 'js_array_join', 'js_array_slice',
    'js_array_reverse', 'js_array_sort', 'js_array_foreach', 'js_array_concat'
  ],
  object: [
    'js_object_literal', 'js_object_get', 'js_object_get_bracket', 'js_object_set',
    'js_object_delete', 'js_object_keys', 'js_object_values', 'js_object_entries',
    'js_object_assign', 'js_spread_object', 'js_json_stringify', 'js_json_parse'
  ]
};

// ── Sidebar Styling (HTML) ────────────────────
const CATS = [
  { label: '', color: '#FFB800', shadow: '#b38200', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.89 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 8H13V3.5z" fill="white"/>' },
  { label: '', color: '#FF6000', shadow: '#b34000', svg: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="white"/>' },
  { label: '', color: '#00BFA5', shadow: '#007a69', svg: '<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2z" fill="white"/>' },
  { label: '', color: '#7B1FA2', shadow: '#4a0066', svg: '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="white"/>' },
  { label: '', color: '#2E7D32', shadow: '#1a4d1d', svg: '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2z" fill="white"/>' },
  { label: '', color: '#C62828', shadow: '#8b0000', svg: '<path d="M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H5v-3h6v3zm0-5H5V9h6v3z" fill="white"/>' },
  { label: '', color: '#1565C0', shadow: '#003483', svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5z" fill="white"/>' },
  { label: '', color: '#AD1457', shadow: '#6d0030', svg: '<path d="M2.53 19.65l1.34.56v-9.03l-2.43 5.86c-.41 1.02.08 2.19 1.09 2.61z" fill="white"/>' },
  { label: '', color: '#00897B', shadow: '#00594d', svg: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="white"/>' }
];

// ── Sidebar Styling (CSS) ─────────────────────
const CSS_CATS = [
  { label: '', color: '#E91E63', shadow: '#880e4f', svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="white"/>' },
  { label: '', color: '#3F51B5', shadow: '#1a237e', svg: '<path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" fill="white"/>' },
  { label: '', color: '#00BCD4', shadow: '#006064', svg: '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z" fill="white"/>' },
  { label: '', color: '#8BC34A', shadow: '#33691e', svg: '<path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="white"/>' }
];

// ── Sidebar Styling (JS) ──────────────────────
const JS_CATS = [
  { label: '', color: '#FF6F00', shadow: '#b34d00', svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6z" fill="white"/>' },
  { label: '', color: '#00897B', shadow: '#005b52', svg: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5h-6v-2h6v2zm3-4H6v-2h12v2z" fill="white"/>' },
  { label: '', color: '#1565C0', shadow: '#003483', svg: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="white"/>' },
  { label: '', color: '#6A1B9A', shadow: '#38006b', svg: '<path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12-.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z" fill="white"/>' },
  { label: '', color: '#F57F17', shadow: '#a35200', svg: '<path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51L11 21z" fill="white"/>' },
  { label: '', color: '#C62828', shadow: '#8b0000', svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 8.5h-3V15h-2v-3.5H6V9.5h3V6h2v3.5h3v2z" fill="white"/>' },
  { label: '', color: '#AD1457', shadow: '#6d0030', svg: '<path d="M2.53 19.65l1.34.56v-9.03l-2.43 5.86c-.41 1.02.08 2.19 1.09 2.61zM22.03 15.95L17.07 3.98c-.31-.75-1.04-1.21-1.81-1.23l1.77 4.28-4.64 9.12 3.12 7.51c.74-.18 1.39-.68 1.71-1.44l4.81-11.6v-.68z" fill="white"/>' },
  { label: '', color: '#2E7D32', shadow: '#1a4d1d', svg: '<path d="M4 6h16v2H4zm2-4h12v2H6zm14 8H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-1 6H11v-2h8v2z" fill="white"/>' },
  { label: '', color: '#37474F', shadow: '#102027', svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="white"/>' },
  {
    label: '',
    color: '#E65100',
    shadow: '#8d3200',
    svg: '<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v1H6v-3h2v1h3V9h2v5h-2v-1zm4.5 1L13 9h2l1 3 1-3h2l-1.5 5h-2z" fill="white"/>'
  }
];

// ══════════════════════════════════════════════
//  CUSTOM BLOCK DEFINITIONS
// ══════════════════════════════════════════════
function defineCustomBlocks() {
  Blockly.defineBlocksWithJsonArray([
  {
    "type": "css_display",
    "message0": "display: %1;",
    "args0": [{
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
    "colour": 230
  },
  {
    "type": "css_box_model",
    "message0": "%1: %2;",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          ["margin", "margin"],
          ["padding", "padding"]
        ]
      },
      { "type": "field_input", "name": "VAL", "text": "10px" }
    ],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 230
  },
  {
    "type": "css_size",
    "message0": "%1: %2;",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PROP",
        "options": [
          ["width", "width"],
          ["height", "height"]
        ]
      },
      { "type": "field_input", "name": "VAL", "text": "100%" }
    ],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 230
  },
  {
    "type": "css_color",
    "message0": "color: %1;",
    "args0": [{ "type": "field_colour", "name": "VAL", "colour": "#ff0000" }],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 160
  },
  {
    "type": "css_custom",
    "message0": "%1: %2;",
    "args0": [
      { "type": "field_input", "name": "PROP", "text": "border" },
      { "type": "field_input", "name": "VAL", "text": "1px solid black" }
    ],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 160
  },
  {
    "type": "css_transition",
    "message0": "transition: %1;",
    "args0": [{ "type": "field_input", "name": "VAL", "text": "all 0.3s ease" }],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 65
  },
  {
    "type": "css_transform",
    "message0": "transform: %1;",
    "args0": [{ "type": "field_input", "name": "VAL", "text": "scale(1.1)" }],
    "previousStatement": "CSS_PROP",
    "nextStatement": "CSS_PROP",
    "colour": 65
  }]);
  
  Blockly.defineBlocksWithJsonArray([
  {
    "type": "html_style",
    "message0": "<style> %1 %2 </style>",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "STYLE" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 270,
    "tooltip": "Internal CSS styles"
  },
  {
    "type": "html_script",
    "message0": "<script> %1 %2 </script>",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "SCRIPT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 330,
    "tooltip": "Internal JavaScript"
  }]);
  
  Blockly.defineBlocksWithJsonArray([
  {
    "type": "css_style_container",
    "message0": "internal CSS <style> %1 %2 </style>",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "colour": 270,
    "tooltip": "CSS blocks here are injected into the linked <style> tag in your HTML.",
    "movable": true,
    "deletable": false
  },
  {
    "type": "js_script_container",
    "message0": "internal JS <script> %1 %2 </script>",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "BODY" }
    ],
    "colour": 30,
    "tooltip": "JS blocks here are injected into the linked <script> tag in your HTML.",
    "movable": true,
    "deletable": false
  }]);
}

// ══════════════════════════════════════════════
//  BLOCK SYNC SYSTEM
// ══════════════════════════════════════════════
const BlockSync = (() => {
  const htmlToContainer = new Map();
  const containerToHtml = new Map();
  
  let syncLock = false;
  
  function isInternalContainer(block) {
    return block.type === 'css_style_container' || block.type === 'js_script_container';
  }
  
  function serializeStatementInput(block, inputName) {
    const input = block.getInput(inputName);
    if (!input?.connection?.targetConnection) return '';
    // Only grab the first block. Blockly's XML export automatically serializes the entire nested chain!
    const child = input.connection.targetConnection.getSourceBlock();
    return Blockly.Xml.domToText(Blockly.Xml.blockToDom(child, true));
  }
  
  function clearStatementInput(block, inputName) {
    const input = block.getInput(inputName);
    if (input?.connection?.targetConnection) {
      const child = input.connection.targetConnection.getSourceBlock();
      if (child) {
        // Safe obliteration of the existing stack to prevent orphaned blocks and ID collisions
        child.dispose(true);
      }
    }
  }
  
  function pasteIntoStatementInput(block, inputName, xmlStr, targetWs) {
    if (!xmlStr) return;
    const input = block.getInput(inputName);
    if (!input?.connection) return;
    
    const dom = Blockly.utils.xml.textToDom(`<xml>${xmlStr}</xml>`);
    if (dom.children.length > 0) {
      const newBlock = Blockly.Xml.domToBlock(dom.children[0], targetWs);
      if (newBlock?.previousConnection) {
        input.connection.connect(newBlock.previousConnection);
      }
    }
  }
  
  function syncContainerToHtml(containerBlock) {
    if (syncLock) return;
    const htmlBlockId = containerToHtml.get(containerBlock.id);
    if (!htmlBlockId) return;
    const htmlBlock = workspaceHtml.getBlockById(htmlBlockId);
    if (!htmlBlock) return;
    
    const htmlInputName = htmlBlock.type === 'html_style' ? 'STYLE' : 'SCRIPT';
    const xml = serializeStatementInput(containerBlock, 'BODY');
    
    syncLock = true;
    clearStatementInput(htmlBlock, htmlInputName);
    pasteIntoStatementInput(htmlBlock, htmlInputName, xml, workspaceHtml);
    syncLock = false;
  }
  
  function resyncAllIn(workspace) {
    containerToHtml.forEach((_, containerId) => {
      const block = workspace.getBlockById(containerId);
      if (block) syncContainerToHtml(block);
    });
  }
  
  function createContainer(htmlBlock) {
    if (htmlToContainer.has(htmlBlock.id)) return;
    
    const isStyle = htmlBlock.type === 'html_style';
    const targetWs = isStyle ? workspaceCss : workspaceJs;
    const containerType = isStyle ? 'css_style_container' : 'js_script_container';
    const yPos = 20 + htmlToContainer.size * 260;
    
    syncLock = true;
    const dom = Blockly.utils.xml.textToDom(
      `<xml><block type="${containerType}" x="20" y="${yPos}"></block></xml>`
    );
    const containerBlock = Blockly.Xml.domToBlock(dom.children[0], targetWs);
    containerBlock.setDeletable(false);
    
    htmlToContainer.set(htmlBlock.id, containerBlock.id);
    containerToHtml.set(containerBlock.id, htmlBlock.id);
    syncLock = false;
  }
  
  function removeContainer(htmlBlockId) {
    const containerId = htmlToContainer.get(htmlBlockId);
    if (!containerId) return;
    
    const block = workspaceCss.getBlockById(containerId) || workspaceJs.getBlockById(containerId);
    if (block) {
      syncLock = true;
      block.setDeletable(true);
      block.dispose(false);
      syncLock = false;
    }
    
    htmlToContainer.delete(htmlBlockId);
    containerToHtml.delete(containerId);
  }
  
  function onHtmlChange(event) {
    if (syncLock) return;
    if (!workspaceHtml || !workspaceCss || !workspaceJs) return;
    
    if (event.type === Blockly.Events.BLOCK_CREATE) {
      const block = workspaceHtml.getBlockById(event.blockId);
      if (block?.type === 'html_style' || block?.type === 'html_script') {
        createContainer(block);
      }
    } else if (event.type === Blockly.Events.BLOCK_DELETE) {
      if (htmlToContainer.has(event.blockId)) {
        removeContainer(event.blockId);
      }
    }
  }
  
  const SYNC_EVENTS = new Set([
    Blockly.Events.BLOCK_MOVE,
    Blockly.Events.BLOCK_CREATE,
    Blockly.Events.BLOCK_DELETE,
    Blockly.Events.BLOCK_CHANGE
  ]);
  
  function onCssChange(event) {
    if (syncLock) return;
    if (SYNC_EVENTS.has(event.type)) resyncAllIn(workspaceCss);
  }
  
  function onJsChange(event) {
    if (syncLock) return;
    if (SYNC_EVENTS.has(event.type)) resyncAllIn(workspaceJs);
  }
  
  function initialSync() {
    if (!workspaceHtml) return;
    workspaceHtml.getAllBlocks(false).forEach(block => {
      if (block.type === 'html_style' || block.type === 'html_script') {
        createContainer(block);
      }
    });
  }
  
  function init() {
    if (!workspaceHtml || !workspaceCss || !workspaceJs) return;
    workspaceHtml.addChangeListener(onHtmlChange);
    workspaceCss.addChangeListener(onCssChange);
    workspaceJs.addChangeListener(onJsChange);
    initialSync();
  }
  
  return { init, isInternalContainer };
})();

// ══════════════════════════════════════════════
//  COMBINED CODE GENERATION
// ══════════════════════════════════════════════
function generateCombinedCode() {
  let finalCode = generateHTMLCode();
  const cssOut = generateCSSCode();
  const jsOut = generateJSCode();
  
  if (cssOut.trim()) {
    const styleTag = `<style>\n${cssOut}</style>\n`;
    if (finalCode.includes('</head>')) {
      finalCode = finalCode.replace('</head>', `  ${styleTag}</head>`);
    } else {
      finalCode = styleTag + finalCode;
    }
  }
  
  if (jsOut.trim()) {
    const scriptTag = `<script>\n${jsOut}<\/script>\n`;
    if (finalCode.includes('</body>')) {
      finalCode = finalCode.replace('</body>', `  ${scriptTag}</body>`);
    } else {
      finalCode += scriptTag;
    }
  }
  
  return finalCode;
}

// ══════════════════════════════════════════════
//  SYNTAX HIGHLIGHTING (generic)
// ══════════════════════════════════════════════
function highlight(raw) {
  if (!raw || !raw.trim()) return '<span class="empty">// Place blocks to generate code…</span>';
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  s = s.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="cc">$1</span>');
  s = s.replace(/(&lt;\/?\w+)((?:\s+\w+(?:=&quot;[^&]*&quot;)?)*)\s*(\/?)(&gt;)/g, (m, tag, attrs, sl, gt) => {
    const aHL = attrs.replace(/(\w+)=(&quot;[^&]*&quot;)/g, '<span class="ca">$1</span>=<span class="cv">$2</span>');
    return `<span class="ct">${tag}${aHL}${sl}${gt}</span>`;
  });
  s = s.replace(/([a-zA-Z-]+)\s*:\s*([^;]+);/g, '<span class="ca">$1</span>: <span class="cv">$2</span>;');
  return s;
}

// ══════════════════════════════════════════════
//  EXTENSION SYSTEM FUNCTIONS
// ══════════════════════════════════════════════

function refreshToolboxForLang(lang) {
  let workspace, baseCats, iconArray;
  if (lang === 'html') {
    workspace = workspaceHtml;
    baseCats = TOOLBOX_CATEGORIES;
    iconArray = CATS;
  }
  else if (lang === 'css') {
    workspace = workspaceCss;
    baseCats = CSS_TOOLBOX_CATEGORIES;
    iconArray = CSS_CATS;
  }
  else if (lang === 'js') {
    workspace = workspaceJs;
    baseCats = JS_TOOLBOX_CATEGORIES;
    iconArray = JS_CATS;
  }
  else return;
  
  if (!workspace) return;
  
  const toolboxJson = { kind: 'categoryToolbox', contents: [] };
  
  Object.keys(baseCats).forEach((catKey, idx) => {
    const icon = iconArray[idx] || {};
    toolboxJson.contents.push({
      kind: 'category',
      name: icon.label || '\u200B'.repeat(idx + 1),
      colour: icon.color,
      contents: baseCats[catKey].map(type => ({ kind: 'block', type }))
    });
  });
  
  const activeExts = ExtensionRegistry.getActiveExtensions(lang);
  activeExts.forEach(ext => {
    Object.entries(ext.categories).forEach(([key, catDef]) => {
      if (catDef.blocks && Array.isArray(catDef.blocks)) {
        toolboxJson.contents.push({
          kind: 'category',
          name: catDef.label || '\u200B'.repeat(toolboxJson.contents.length + 1),
          colour: catDef.colour,
          contents: catDef.blocks.map(type => ({ kind: 'block', type }))
        });
      }
    });
  });
  
  workspace.updateToolbox(toolboxJson);
  rebuildSidebarForLang(lang);
}

function rebuildSidebarForLang(lang) {
  const sb = document.getElementById(`icon-sidebar-${lang}`);
  if (!sb) return;
  
  let icons = [];
  let baseCats, iconArray;
  if (lang === 'html') {
    baseCats = TOOLBOX_CATEGORIES;
    iconArray = CATS;
  }
  else if (lang === 'css') {
    baseCats = CSS_TOOLBOX_CATEGORIES;
    iconArray = CSS_CATS;
  }
  else if (lang === 'js') {
    baseCats = JS_TOOLBOX_CATEGORIES;
    iconArray = JS_CATS;
  }
  
  const baseKeys = Object.keys(baseCats);
  baseKeys.forEach((key, idx) => {
    const icon = iconArray[idx] || {};
    icons.push({ ...icon, id: key, isExtension: false });
  });
  
  const activeExts = ExtensionRegistry.getActiveExtensions(lang);
  activeExts.forEach(ext => {
    Object.entries(ext.categories).forEach(([key, catDef]) => {
      if (catDef.icon) {
        icons.push({
          color: catDef.icon.color,
          shadow: catDef.icon.shadow,
          svg: catDef.icon.svg,
          label: catDef.label || '',
          id: key,
          isExtension: true
        });
      }
    });
  });
  
  sb.innerHTML = icons.map((ic, idx) => `
    <div class="side-item ${idx === 0 ? 'active' : ''}" onclick="selectCatByIndex(${idx}, '${lang}')">
      <div class="side-sq" style="background:${(window.BlockStudioTheme && BlockStudioTheme.accent(ic.color)) || ic.color}">
        <svg viewBox="0 0 24 24">${ic.svg}</svg>
      </div>
      <span class="side-label">${ic.label || ''}</span>
    </div>`).join('');
}

function selectCatByIndex(idx, lang) {
  const sb = document.getElementById(`icon-sidebar-${lang}`);
  if (!sb) return;
  sb.querySelectorAll('.side-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  const ws = lang === 'html' ? workspaceHtml : lang === 'css' ? workspaceCss : workspaceJs;
  if (ws && ws.getToolbox()) ws.getToolbox().selectItemByPosition(idx);
}

// ══════════════════════════════════════════════
//  SIDEBAR & TAB HANDLERS
// ══════════════════════════════════════════════
function selectCat(idx, lang) {
  selectCatByIndex(idx, lang);
}

function setLangMode(lang) {
  currentLangMode = lang;
  ['html', 'css', 'js'].forEach(l => {
    document.getElementById(`btn-lang-${l}`)?.classList.toggle('active', l === lang);
    document.getElementById(`icon-sidebar-${l}`)?.classList.toggle('hidden', l !== lang);
    document.getElementById(`blocklyDiv-${l}`)?.classList.toggle('hidden', l !== lang);
  });
  if (lang === 'html' && workspaceHtml) Blockly.svgResize(workspaceHtml);
  if (lang === 'css' && workspaceCss) Blockly.svgResize(workspaceCss);
  if (lang === 'js' && workspaceJs) Blockly.svgResize(workspaceJs);
  if (activeTab === 'code') updateCode();
  const extBtn = document.getElementById('btn-extensions');
  if (extBtn) extBtn.classList.toggle('hidden', lang !== 'js');
}

function switchTab(tab) {
  activeTab = tab;
  ['blocks', 'preview', 'code'].forEach(t =>
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab)
  );
  document.getElementById('preview-panel')?.classList.toggle('hidden', tab !== 'preview');
  document.getElementById('code-panel')?.classList.toggle('hidden', tab !== 'code');
  if (tab === 'preview') updatePreview();
  if (tab === 'code') updateCode();
}

function updatePreview() {
  const combinedOutput = generateCombinedCode();
  const iframe = document.getElementById('preview-iframe');
  const empty = document.getElementById('preview-empty');
  if (!iframe || !empty) return;
  const hasBlocks =
    (workspaceHtml && workspaceHtml.getTopBlocks(true).length > 0) ||
    (workspaceCss && workspaceCss.getTopBlocks(true).length > 0) ||
    (workspaceJs && workspaceJs.getTopBlocks(true).length > 0);
  if (hasBlocks) {
    iframe.style.display = 'block';
    empty.style.display = 'none';
    iframe.srcdoc = combinedOutput;
  } else {
    iframe.style.display = 'none';
    empty.style.display = 'flex';
  }
}

function updateCode() {
  const pre = document.getElementById('code-output');
  const lnums = document.getElementById('line-nums');
  const cnt = document.getElementById('code-line-count');
  const fileName = document.querySelector('.file-name');
  let code = '';
  
  if (currentLangMode === 'html') {
    code = generateHTMLCode();
    if (fileName) fileName.textContent = 'index.html';
    pre.innerHTML = highlightHTML(code);
  } else if (currentLangMode === 'css') {
    code = generateCSSCode();
    if (fileName) fileName.textContent = 'style.css';
    pre.innerHTML = highlightCSS(code);
  } else {
    code = generateJSCode();
    if (fileName) fileName.textContent = 'script.js';
    pre.innerHTML = highlightJS(code);
  }
  
  const lines = code ? code.trim().split('\n').length : 0;
  cnt.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
  lnums.textContent = code ? Array.from({ length: lines }, (_, i) => i + 1).join('\n') : '';
}

// ══════════════════════════════════════════════
//  BLOCKLY INITIALIZATION
// ══════════════════════════════════════════════
function initBlockly() {
  defineCustomBlocks();
  
  const mkToolbox = (cats, catConfig) => ({
    kind: 'categoryToolbox',
    contents: Object.keys(cats).map((cat, i) => ({
      kind: 'category',
      name: catConfig[i]?.label !== '' ? catConfig[i]?.label : '\u200B'.repeat(i + 1),
      colour: catConfig[i]?.color,
      contents: cats[cat].map(type => ({ kind: 'block', type }))
    }))
  });
  
  const baseConfig = {
    renderer: 'zelos',
    theme: {
      componentStyles: {
        workspaceBackgroundColour: '#3c3c3c',
        flyoutBackgroundColour: '#2e2e2e'
      }
    },
    scrollbars: true,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.9,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2
    },
    move: { scrollbars: true, drag: true, wheel: false }
  };
  
  workspaceHtml = Blockly.inject('blocklyDiv-html', {
    toolbox: mkToolbox(TOOLBOX_CATEGORIES, CATS),
    ...baseConfig
  });
  workspaceCss = Blockly.inject('blocklyDiv-css', {
    toolbox: mkToolbox(CSS_TOOLBOX_CATEGORIES, CSS_CATS),
    ...baseConfig
  });
  workspaceJs = Blockly.inject('blocklyDiv-js', {
    toolbox: mkToolbox(JS_TOOLBOX_CATEGORIES, JS_CATS),
    ...baseConfig
  });
  
  // Activate the cross‑workspace sync
  BlockSync.init();
  
  rebuildSidebarForLang('html');
  rebuildSidebarForLang('css');
  rebuildSidebarForLang('js');
  
  const onWorkspaceChange = () => {
    if (activeTab === 'preview') updatePreview();
    if (activeTab === 'code') updateCode();
  };
  
  workspaceHtml.addChangeListener(onWorkspaceChange);
  workspaceCss.addChangeListener(onWorkspaceChange);
  workspaceJs.addChangeListener(onWorkspaceChange);
}


// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (!workspaceHtml) {
    initBlockly();
    setLangMode('html');
    ExtensionRegistry._injectButton();
    ExtensionRegistry.setRefreshCallback((lang) => {
      refreshToolboxForLang(lang);
    });
  }
});