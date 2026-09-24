// modules/page.js
(function() {
  if (typeof Blockly === 'undefined') return;
  
  delete Blockly.Blocks['html_root'];
  delete Blockly.Blocks['html_head'];
  delete Blockly.Blocks['html_body'];
  delete Blockly.Blocks['html_title'];
  delete Blockly.Blocks['html_meta'];
  delete Blockly.Blocks['html_link'];
  delete Blockly.Blocks['html_style'];
  delete Blockly.Blocks['html_script'];
  delete Blockly.Blocks['html_header'];
  delete Blockly.Blocks['html_main'];
  delete Blockly.Blocks['html_footer'];
  
  Blockly.defineBlocksWithJsonArray([
    {
      type: 'html_root',
      colour: '#FFB800',
      message0: '<html> %1 %2 </html>',
      args0: [
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      hat: 'cap',
      tooltip: 'The root HTML element'
    },
    {
      type: 'html_head',
      colour: '#FFB800',
      message0: '<head %1 > %2 </head>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Container for metadata and linked resources'
    },
    {
      type: 'html_body',
      colour: '#FFB800',
      message0: '<body %1 > %2 </body>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Contains the visible page content'
    },
    {
      type: 'html_title',
      colour: '#FFB800',
      message0: '<title %1 > %2 </title>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'The title shown in the browser tab'
    },
    {
      type: 'html_meta',
      colour: '#FFB800',
      message0: '<meta %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Metadata with attributes'
    },
    {
      type: 'html_link',
      colour: '#FFB800',
      message0: '<link %1 >',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Link external resources'
    },
    {
      type: 'html_style',
      colour: '#FFB800',
      message0: '<style %1 > %2 </style>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Internal CSS styles'
    },
    {
      type: 'html_script',
      colour: '#FFB800',
      message0: '<script %1 > %2 </script>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Internal or external JavaScript'
    },
    {
      type: 'html_header',
      colour: '#FFB800',
      message0: '<header %1 > %2 </header>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Introductory content or navigational links'
    },
    {
      type: 'html_main',
      colour: '#FFB800',
      message0: '<main %1 > %2 </main>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'The dominant content of the document'
    },
    {
      type: 'html_footer',
      colour: '#FFB800',
      message0: '<footer %1 > %2 </footer>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null,
      tooltip: 'Footer for the document or section'
    }
  ]);
  
  Blockly.Blocks['html_root'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<html> %1 %2 </html>',
      args0: [
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      hat: 'cap'
    });
  };
  
  Blockly.Blocks['html_head'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<head %1 > %2 </head>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_body'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<body %1 > %2 </body>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_title'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<title %1 > %2 </title>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_style'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<style %1 > %2 </style>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_script'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<script %1 > %2 </script>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_header'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<header %1 > %2 </header>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_main'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<main %1 > %2 </main>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
  Blockly.Blocks['html_footer'].init = function() {
    this.jsonInit({
      colour: '#FFB800',
      message0: '<footer %1 > %2 </footer>',
      args0: [
        { type: 'input_value', name: 'ATTR', check: 'HtmlAttribute' },
        { type: 'input_statement', name: 'CONTENT' }
      ],
      previousStatement: null,
      nextStatement: null
    });
  };
  
})();