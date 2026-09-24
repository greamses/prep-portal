// modules/css-selectors.js
// CSS Selector blocks for Blockly

if (typeof Blockly !== 'undefined') {
  
  // ── Extension: force combinator block to never wrap ──
  Blockly.Extensions.register('combinator_no_wrap', function() {
    const block = this;
    
    // After every render, measure the dropdown text and expand the block if needed
    const originalRender = block.rendered ? block.render.bind(block) : null;
    
    block.onchange = function() {
      // Let normal change handling happen
      if (originalRender) originalRender();
      expandBlock();
    };
    
    // Also hook into the init to set a minimum width from the start
    const originalInitSvg = block.initSvg;
    block.initSvg = function() {
      originalInitSvg.call(this);
      expandBlock();
    };
    
    function expandBlock() {
      if (!block.rendered) return;
      
      const dropdownField = block.getField('COMBINATOR');
      if (!dropdownField) return;
      
      // Get the text element inside the dropdown
      const fieldSvg = dropdownField.getSvgRoot();
      if (!fieldSvg) return;
      
      const textEl = fieldSvg.querySelector('text');
      if (!textEl) return;
      
      const textLength = textEl.getComputedTextLength();
      const minWidth = Math.max(textLength + 40, 180); // 40px padding, 180px minimum
      
      // Calculate the current block width
      const currentWidth = block.width;
      
      if (currentWidth < minWidth) {
        // Force the block wider by modifying the SVG directly
        const diff = minWidth - currentWidth;
        const paths = block.svgGroup.querySelectorAll('path');
        paths.forEach(path => {
          const d = path.getAttribute('d');
          if (d) {
            // Shift the right side of paths to the right
            const newD = d.replace(/H\s+(\d+)/g, (match, num) => {
              return 'H ' + (parseInt(num) + diff);
            });
            path.setAttribute('d', newD);
          }
        });
        
        // Shift right-side inputs
        const inputs = block.inputList;
        inputs.forEach(input => {
          if (input.connection && input.connection.x_ > currentWidth / 2) {
            input.connection.x_ += diff;
          }
        });
      }
    }
  });
  
  Blockly.defineBlocksWithJsonArray([
    // Rule block – accepts a selector value (round socket)
    {
      "type": "css_rule",
      "message0": "select %1 %2",
      "args0": [
        { "type": "input_value", "name": "SELECTOR", "check": "CSS_SELECTOR" },
        { "type": "input_statement", "name": "PROPS", "check": "CSS_PROP" }
      ],
      "previousStatement": "CSS_RULE",
      "nextStatement": "CSS_RULE",
      "colour": 350,
      "tooltip": "Creates a CSS rule for the given selector."
    },
    // Tag selector (dropdown of common HTML elements)
    {
      "type": "css_selector_tag",
      "message0": "tag %1",
      "args0": [{
        "type": "field_dropdown",
        "name": "TAG",
        "options": [
          ["div", "div"],
          ["p", "p"],
          ["h1", "h1"],
          ["h2", "h2"],
          ["h3", "h3"],
          ["h4", "h4"],
          ["h5", "h5"],
          ["h6", "h6"],
          ["span", "span"],
          ["a", "a"],
          ["img", "img"],
          ["ul", "ul"],
          ["ol", "ol"],
          ["li", "li"],
          ["table", "table"],
          ["tr", "tr"],
          ["td", "td"],
          ["th", "th"],
          ["form", "form"],
          ["input", "input"],
          ["button", "button"]
        ]
      }],
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Selects an element by its HTML tag."
    },
    // Class selector
    {
      "type": "css_selector_class",
      "message0": "class %1",
      "args0": [{ "type": "field_input", "name": "CLASS", "text": "my-class" }],
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Selects elements with a specific class."
    },
    // ID selector
    {
      "type": "css_selector_id",
      "message0": "id %1",
      "args0": [{ "type": "field_input", "name": "ID", "text": "my-id" }],
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Selects the element with a specific ID."
    },
    // Pseudo-class selector
    {
      "type": "css_selector_pseudo",
      "message0": "pseudo %1",
      "args0": [{
        "type": "field_dropdown",
        "name": "PSEUDO",
        "options": [
          [":hover", ":hover"],
          [":active", ":active"],
          [":focus", ":focus"],
          [":visited", ":visited"],
          [":first-child", ":first-child"],
          [":last-child", ":last-child"]
        ]
      }],
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Adds a pseudo‑class to the selector."
    },
    // Attribute selector
    {
      "type": "css_selector_attr",
      "message0": "attribute %1 = %2",
      "args0": [
        { "type": "field_input", "name": "ATTR", "text": "data-type" },
        { "type": "field_input", "name": "VALUE", "text": "example" }
      ],
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Selects elements by an attribute value."
    },
    // Combinator block — with no-wrap extension
    // Combinator block — fixed inline layout
    {
      "type": "css_selector_combinator",
      "message0": "%1 %2 %3",
      "args0": [
        { "type": "input_value", "name": "LEFT", "check": "CSS_SELECTOR" },
        {
          "type": "field_dropdown",
          "name": "COMBINATOR",
          "options": [
            ["descendant", " "],
            ["child >", " > "],
            ["adjacent sibling +", " + "],
            ["general sibling ~", " ~ "]
          ]
        },
        { "type": "input_value", "name": "RIGHT", "check": "CSS_SELECTOR" }
      ],
      "inputsInline": true, // <--- ADD THIS LINE
      "output": "CSS_SELECTOR",
      "colour": 350,
      "tooltip": "Combines two selectors (descendant, child, sibling)."
      // Remove the "extensions":["combinator_no_wrap"] line completely
    }
  ]);
}