// ══════════════════════════════════════════════
//  attributes.js - BLOCK DEFINITIONS
// ══════════════════════════════════════════════

// 1. Dynamic Container Block
Blockly.Blocks['html_attrs'] = {
  init: function() {
    this.setColour('#00897B');
    this.setOutput(true, 'HtmlAttribute');
    this.setTooltip('Container for multiple attributes. Click + to add slots.');
    this.itemCount_ = 1;
    
    this.setInputsInline(true); 
    
    this.updateShape_();
  },

  updateShape_: function() {
    const targetBlocks =[];
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput('ATTR' + i);
      if (input && input.connection && input.connection.targetBlock()) {
        targetBlocks[i] = input.connection.targetBlock();
        input.connection.disconnect();
      }
    }

    // B. Clear out the old input slots
    let i = 0;
    while (this.getInput('ATTR' + i)) {
      this.removeInput('ATTR' + i);
      i++;
    }

    // C. Rebuild the input slots based on the current count
    for (let j = 0; j < this.itemCount_; j++) {
      const input = this.appendValueInput('ATTR' + j).setCheck('HtmlAttribute');
      
      if (j === 0) {
        // First slot gets the "attributes" title and [+] button
        input.appendField("attributes")
             .appendField(new Blockly.FieldImage(
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xMiA3djEwbS01LTVoMTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
          18, 18, '+', 
          () => {
            this.itemCount_++;
            this.updateShape_();
          }
        ));
      } else {
         // Subsequent slots get the [-] button to remove them
         input.appendField(new Blockly.FieldImage(
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik03IDEyaDEwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
          18, 18, '-', 
          () => {
            if (this.itemCount_ > 1) {
              this.itemCount_--;
              this.updateShape_();
            }
          }
        ));
      }

      // D. Safely plug the previous blocks back in
      if (targetBlocks[j]) {
        input.connection.connect(targetBlocks[j].outputConnection);
      }
    }
  },

  // These two functions save the amount of slots into the workspace memory
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },

  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 1;
    this.updateShape_();
  }
};

// 2. Static Pill Blocks Definitions
const attributeBlocks =[
  {
    type: 'attr_id',
    message0: 'id= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: 'elementid' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_class',
    message0: 'class= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: 'classname' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_style',
    message0: 'style= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_height',
    message0: 'height= "%1"',
    args0: [{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_width',
    message0: 'width= "%1"',
    args0: [{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_value',
    message0: 'value= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_src',
    message0: 'src= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  },
  {
    type: 'attr_href',
    message0: 'href= "%1"',
    args0:[{ type: 'field_input', name: 'VALUE', text: '' }],
    output: 'HtmlAttribute',
    colour: '#00897B'
  }
];

Blockly.defineBlocksWithJsonArray(attributeBlocks);