// modules/table.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_table'];
  delete Blockly.Blocks['html_thead'];
  delete Blockly.Blocks['html_tbody'];
  delete Blockly.Blocks['html_tfoot'];
  delete Blockly.Blocks['html_tr'];
  delete Blockly.Blocks['html_td'];
  delete Blockly.Blocks['html_th'];
  delete Blockly.Blocks['html_caption'];
  delete Blockly.Blocks['html_colgroup'];
  delete Blockly.Blocks['html_col'];

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'html_table',
      colour: '#C62828',
      message0: '<table %1 > %2 </table>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table container'
    },
    {
      type: 'html_caption',
      colour: '#C62828',
      message0: '<caption %1 > %2 </caption>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table caption'
    },
    {
      type: 'html_colgroup',
      colour: '#C62828',
      message0: '<colgroup %1 > %2 </colgroup>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Column group for styling columns'
    },
    {
      type: 'html_col',
      colour: '#C62828',
      message0: '<col %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Column specification (self-closing)'
    },
    {
      type: 'html_thead',
      colour: '#C62828',
      message0: '<thead %1 > %2 </thead>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table header group'
    },
    {
      type: 'html_tbody',
      colour: '#C62828',
      message0: '<tbody %1 > %2 </tbody>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table body group'
    },
    {
      type: 'html_tfoot',
      colour: '#C62828',
      message0: '<tfoot %1 > %2 </tfoot>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table footer group'
    },
    {
      type: 'html_tr',
      colour: '#C62828',
      message0: '<tr %1 > %2 </tr>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table row'
    },
    {
      type: 'html_td',
      colour: '#C62828',
      message0: '<td %1 > %2 </td>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table data cell'
    },
    {
      type: 'html_th',
      colour: '#C62828',
      message0: '<th %1 > %2 </th>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Table header cell'
    }
  ]);

  // Dynamic init for html_table
  Blockly.Blocks['html_table'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<table %1 > %2 </table>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_caption
  Blockly.Blocks['html_caption'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<caption %1 > %2 </caption>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_colgroup
  Blockly.Blocks['html_colgroup'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<colgroup %1 > %2 </colgroup>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_col
  Blockly.Blocks['html_col'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<col %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_thead
  Blockly.Blocks['html_thead'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<thead %1 > %2 </thead>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_tbody
  Blockly.Blocks['html_tbody'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<tbody %1 > %2 </tbody>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_tfoot
  Blockly.Blocks['html_tfoot'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<tfoot %1 > %2 </tfoot>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_tr
  Blockly.Blocks['html_tr'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<tr %1 > %2 </tr>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_td
  Blockly.Blocks['html_td'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<td %1 > %2 </td>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_th
  Blockly.Blocks['html_th'].init = function () {
    this.jsonInit({
      colour: '#C62828',
      message0: '<th %1 > %2 </th>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

})();