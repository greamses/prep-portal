// modules/form.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_form'];
  delete Blockly.Blocks['html_input'];
  delete Blockly.Blocks['html_btn'];
  delete Blockly.Blocks['html_label'];
  delete Blockly.Blocks['html_textarea'];
  delete Blockly.Blocks['html_select'];
  delete Blockly.Blocks['html_option'];
  delete Blockly.Blocks['html_optgroup'];
  delete Blockly.Blocks['html_fieldset'];
  delete Blockly.Blocks['html_legend'];
  delete Blockly.Blocks['html_datalist'];
  delete Blockly.Blocks['html_output'];

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'html_form',
      colour: '#1565C0',
      message0: '<form %1 > %2 </form>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Form container with action, method, etc.'
    },
    {
      type: 'html_label',
      colour: '#1565C0',
      message0: '<label %1 > %2 </label>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Label for form controls (use "for" attribute to bind to input id)'
    },
    {
      type: 'html_input',
      colour: '#1565C0',
      message0: '<input %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Form input — set type, name, placeholder, etc. via attributes'
    },
    {
      type: 'html_textarea',
      colour: '#1565C0',
      message0: '<textarea %1 > %2 </textarea>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Multi-line text input'
    },
    {
      type: 'html_btn',
      colour: '#1565C0',
      message0: '<button %1 > %2 </button>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Clickable button'
    },
    {
      type: 'html_select',
      colour: '#1565C0',
      message0: '<select %1 > %2 </select>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Dropdown select list'
    },
    {
      type: 'html_optgroup',
      colour: '#1565C0',
      message0: '<optgroup %1 > %2 </optgroup>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Group of options in a select list'
    },
    {
      type: 'html_option',
      colour: '#1565C0',
      message0: '<option %1 > %2 </option>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Selectable option'
    },
    {
      type: 'html_fieldset',
      colour: '#1565C0',
      message0: '<fieldset %1 > %2 </fieldset>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Groups related form controls'
    },
    {
      type: 'html_legend',
      colour: '#1565C0',
      message0: '<legend %1 > %2 </legend>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Caption for a fieldset'
    },
    {
      type: 'html_datalist',
      colour: '#1565C0',
      message0: '<datalist %1 > %2 </datalist>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Predefined options for an input (bind with list attribute)'
    },
    {
      type: 'html_output',
      colour: '#1565C0',
      message0: '<output %1 > %2 </output>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Result of a calculation'
    }
  ]);

  // Dynamic init for html_form
  Blockly.Blocks['html_form'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<form %1 > %2 </form>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_label
  Blockly.Blocks['html_label'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<label %1 > %2 </label>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_input
  Blockly.Blocks['html_input'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<input %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_textarea
  Blockly.Blocks['html_textarea'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<textarea %1 > %2 </textarea>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_btn
  Blockly.Blocks['html_btn'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<button %1 > %2 </button>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_select
  Blockly.Blocks['html_select'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<select %1 > %2 </select>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_optgroup
  Blockly.Blocks['html_optgroup'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<optgroup %1 > %2 </optgroup>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_option
  Blockly.Blocks['html_option'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<option %1 > %2 </option>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_fieldset
  Blockly.Blocks['html_fieldset'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<fieldset %1 > %2 </fieldset>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_legend
  Blockly.Blocks['html_legend'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<legend %1 > %2 </legend>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_datalist
  Blockly.Blocks['html_datalist'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<datalist %1 > %2 </datalist>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_output
  Blockly.Blocks['html_output'].init = function () {
    this.jsonInit({
      colour: '#1565C0',
      message0: '<output %1 > %2 </output>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

})();