// modules/links.js
(function () {
  if (typeof Blockly === 'undefined') return;

  delete Blockly.Blocks['html_a'];
  delete Blockly.Blocks['html_nav'];
  delete Blockly.Blocks['html_nav_a'];

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'html_a',
      colour: '#00BFA5',
      message0: '<a %1 > %2 </a>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Anchor link with href and content'
    },
    {
      type: 'html_nav',
      colour: '#00BFA5',
      message0: '<nav %1 > %2 </nav>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Navigation section container'
    },
    {
      type: 'html_nav_a',
      colour: '#00BFA5',
      message0: 'nav link %1 %2 %3',
      args0: [
        { type: 'input_dummy' },
        { type: 'field_input', name: 'HREF', text: 'page.html' },
        { type: 'field_input', name: 'TEXT', text: 'Home' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Quick navigation link (shortcut block)'
    }
  ]);

  // Dynamic init for html_a
  Blockly.Blocks['html_a'].init = function () {
    this.jsonInit({
      colour: '#00BFA5',
      message0: '<a %1 > %2 </a>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_nav
  Blockly.Blocks['html_nav'].init = function () {
    this.jsonInit({
      colour: '#00BFA5',
      message0: '<nav %1 > %2 </nav>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

  // Dynamic init for html_nav_a
  Blockly.Blocks['html_nav_a'].init = function () {
    this.jsonInit({
      colour: '#00BFA5',
      message0: 'nav link %1 %2 %3',
      args0: [
        { type: 'input_dummy' },
        { type: 'field_input', name: 'HREF', text: 'page.html' },
        { type: 'field_input', name: 'TEXT', text: 'Home' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };

})();

