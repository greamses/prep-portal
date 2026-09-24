// modules/lists.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_ul'];
  delete Blockly.Blocks['html_ol'];
  delete Blockly.Blocks['html_li'];

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'html_ul',
      colour: '#2E7D32',
      message0: '<ul %1 > %2 </ul>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Unordered list container'
    },
    {
      type: 'html_ol',
      colour: '#2E7D32',
      message0: '<ol %1 > %2 </ol>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Ordered list container'
    },
    {
      type: 'html_li',
      colour: '#2E7D32',
      message0: '<li %1 > %2 </li>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'List item'
    }
  ]);

  // Dynamic init for html_ul
  Blockly.Blocks['html_ul'].init = function () {
    this.jsonInit({
      colour: '#2E7D32',
      message0: '<ul %1 > %2 </ul>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_ol
  Blockly.Blocks['html_ol'].init = function () {
    this.jsonInit({
      colour: '#2E7D32',
      message0: '<ol %1 > %2 </ol>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_li
  Blockly.Blocks['html_li'].init = function () {
    this.jsonInit({
      colour: '#2E7D32',
      message0: '<li %1 > %2 </li>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

})();