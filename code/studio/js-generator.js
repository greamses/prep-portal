// ══════════════════════════════════════════════
//  js-generator.js – JavaScript block → code
// ══════════════════════════════════════════════

function exprToJS(block) {
  if (!block) return 'undefined';
  const f = n => block.getFieldValue(n) || '';
  const expr = name => exprToJS(block.getInputTargetBlock(name));
  
  switch (block.type) {
    case 'js_string':
      return `"${f('TEXT')}"`;
    case 'js_template_literal':
      return `\`${f('TEXT')}\``;
    case 'js_number':
      return String(f('NUM'));
    case 'js_bool':
      return f('BOOL');
    case 'js_nullish':
      return f('VAL');
    case 'js_var_ref':
      return f('NAME');
    case 'js_typeof':
      return `typeof ${expr('VALUE')}`;
    case 'js_array_literal':
      return `[${f('ITEMS')}]`;
    case 'js_array_get':
      return `${expr('ARR')}[${f('INDEX')}]`;
    case 'js_array_length':
      return `${expr('ARR')}.length`;
    case 'js_array_pop':
      return `${expr('ARR')}.pop()`;
    case 'js_array_shift':
      return `${expr('ARR')}.shift()`;
    case 'js_array_includes':
      return `${expr('ARR')}.includes(${expr('ITEM')})`;
    case 'js_array_index_of':
      return `${expr('ARR')}.indexOf(${expr('ITEM')})`;
    case 'js_array_join':
      return `${expr('ARR')}.join(${expr('SEP')})`;
    case 'js_array_slice':
      return `${expr('ARR')}.slice(${f('START')}, ${f('END')})`;
    case 'js_array_reverse':
      return `[...${expr('ARR')}].reverse()`;
    case 'js_array_sort':
      return `[...${expr('ARR')}].sort()`;
    case 'js_array_concat':
      return `${expr('ARR1')}.concat(${expr('ARR2')})`;
    case 'js_compare':
      return `${expr('LEFT')} ${f('OP')} ${expr('RIGHT')}`;
    case 'js_logic':
      return `${expr('LEFT')} ${f('OP')} ${expr('RIGHT')}`;
    case 'js_not':
      return `!${expr('VALUE')}`;
    case 'js_ternary':
      return `${expr('CONDITION')} ? ${expr('IF_TRUE')} : ${expr('IF_FALSE')}`;
    case 'js_dom_get':
      return `document.${f('METHOD')}("${f('SELECTOR')}")`;
    case 'js_dom_get_prop':
      return `${expr('ELEM')}.${f('PROP')}`;
    case 'js_get_attr':
      return `${expr('ELEM')}.getAttribute("${f('ATTR')}")`;
    case 'js_create_element':
      return `document.createElement("${f('TAG')}")`;
    case 'js_event_target':
      return 'event.target';
    case 'js_event_key':
      return `event.key === "${f('KEY')}"`;
    case 'js_call_expr':
      return `${f('NAME')}(${f('ARGS')})`;
    case 'js_confirm':
      return `confirm(${expr('VALUE')})`;
    case 'js_prompt':
      return `prompt(${expr('VALUE')})`;
    case 'js_math_op':
      return `${expr('LEFT')} ${f('OP')} ${expr('RIGHT')}`;
    case 'js_math_single':
      return `Math.${f('METHOD')}(${expr('VALUE')})`;
    case 'js_math_double':
      return `Math.${f('METHOD')}(${expr('A')}, ${expr('B')})`;
    case 'js_math_random':
      return 'Math.random()';
    case 'js_math_random_int':
      return `Math.floor(Math.random() * ${f('MAX')})`;
    case 'js_math_random_range':
      return `(Math.floor(Math.random() * (${f('MAX')} - ${f('MIN')} + 1)) + ${f('MIN')})`;
    case 'js_math_const':
      return `Math.${f('CONST')}`;
    case 'js_parse_int':
      return `parseInt(${expr('VALUE')}, ${f('RADIX')})`;
    case 'js_parse_float':
      return `parseFloat(${expr('VALUE')})`;
    case 'js_object_literal':
      return `{ ${f('PAIRS')} }`;
    case 'js_object_get':
      return `${expr('OBJ')}.${f('KEY')}`;
    case 'js_object_get_bracket':
      return `${expr('OBJ')}[${expr('KEY')}]`;
    case 'js_object_keys':
      return `Object.keys(${expr('OBJ')})`;
    case 'js_object_values':
      return `Object.values(${expr('OBJ')})`;
    case 'js_object_entries':
      return `Object.entries(${expr('OBJ')})`;
    case 'js_object_assign':
      return `Object.assign(${expr('TARGET')}, ${expr('SOURCE')})`;
    case 'js_spread_object':
      return `{ ...${expr('OBJ')} }`;
    case 'js_json_stringify':
      return `JSON.stringify(${expr('VALUE')})`;
    case 'js_json_parse':
      return `JSON.parse(${expr('VALUE')})`;
    case 'js_str_length':
      return `${expr('STR')}.length`;
    case 'js_str_method_0': {
      const m = f('METHOD');
      return `${expr('STR')}.${m}${m.includes('(') ? '' : '()'}`;
    }
    case 'js_str_includes':
      return `${expr('STR')}.includes(${expr('SEARCH')})`;
    case 'js_str_starts_ends':
      return `${expr('STR')}.${f('METHOD')}(${expr('SEARCH')})`;
    case 'js_str_index_of':
      return `${expr('STR')}.indexOf(${expr('SEARCH')})`;
    case 'js_str_slice':
      return `${expr('STR')}.slice(${f('START')}, ${f('END')})`;
    case 'js_str_replace':
      return `${expr('STR')}.replace(${expr('FROM')}, ${expr('TO')})`;
    case 'js_str_replace_all':
      return `${expr('STR')}.replaceAll(${expr('FROM')}, ${expr('TO')})`;
    case 'js_str_split':
      return `${expr('STR')}.split(${expr('SEP')})`;
    case 'js_str_char_at':
      return `${expr('STR')}.charAt(${f('INDEX')})`;
    case 'js_str_repeat':
      return `${expr('STR')}.repeat(${f('TIMES')})`;
    case 'js_str_pad':
      return `${expr('STR')}.${f('METHOD')}(${f('LEN')}, "${f('FILL')}")`;
    default: {
      const resolved = ExtensionRegistry.resolveExpr(block);
      if (resolved !== null) return resolved;
      return 'undefined';
    }
  }
}

function blockToJS(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => block.getFieldValue(n) || '';
  
  const stmt = (name, ind) => {
    let child = block.getInputTargetBlock(name);
    let out = '';
    while (child) {
      out += blockToJS(child, ind);
      child = child.getNextBlock();
    }
    return out;
  };
  
  const expr = name => exprToJS(block.getInputTargetBlock(name));
  
  switch (block.type) {
    case 'js_declare':
      return `${pad}${f('KIND')} ${f('NAME')} = ${expr('VALUE')};\n`;
    case 'js_assign':
      return `${pad}${f('NAME')} = ${expr('VALUE')};\n`;
    case 'js_compound_assign':
      return `${pad}${f('NAME')} ${f('OP')} ${expr('VALUE')};\n`;
    case 'js_increment':
      return `${pad}${f('NAME')}${f('OP')};\n`;
    case 'js_array_set':
      return `${pad}${expr('ARR')}[${f('INDEX')}] = ${expr('VALUE')};\n`;
    case 'js_array_push':
      return `${pad}${expr('ARR')}.push(${expr('ITEM')});\n`;
    case 'js_array_unshift':
      return `${pad}${expr('ARR')}.unshift(${expr('ITEM')});\n`;
    case 'js_array_foreach':
      return `${pad}${expr('ARR')}.forEach((${f('ITEM')}) => {\n${stmt('BODY', indent + 1)}${pad}});\n`;
    case 'js_if':
      return `${pad}if (${expr('CONDITION')}) {\n${stmt('BODY', indent + 1)}${pad}}\n`;
    case 'js_if_else':
      return `${pad}if (${expr('CONDITION')}) {\n${stmt('DO', indent + 1)}${pad}} else {\n${stmt('ELSE', indent + 1)}${pad}}\n`;
    case 'js_for':
      return `${pad}for (let ${f('VAR')} = ${f('FROM')}; ${f('VAR')} < ${f('TO')}; ${f('VAR')}++) {\n${stmt('BODY', indent + 1)}${pad}}\n`;
    case 'js_for_of':
      return `${pad}for (const ${f('ITEM')} of ${expr('ARRAY')}) {\n${stmt('BODY', indent + 1)}${pad}}\n`;
    case 'js_while':
      return `${pad}while (${expr('CONDITION')}) {\n${stmt('BODY', indent + 1)}${pad}}\n`;
    case 'js_break':
      return `${pad}${f('TYPE')};\n`;
    case 'js_dom_set':
      return `${pad}${expr('ELEM')}.${f('PROP')} = ${expr('VALUE')};\n`;
    case 'js_set_style':
      return `${pad}${expr('ELEM')}.style.${f('PROP')} = ${expr('VALUE')};\n`;
    case 'js_classlist':
      return `${pad}${expr('ELEM')}.classList.${f('METHOD')}("${f('CLASS')}");\n`;
    case 'js_set_attr':
      return `${pad}${expr('ELEM')}.setAttribute("${f('ATTR')}", ${expr('VALUE')});\n`;
    case 'js_append_child':
      return `${pad}${expr('PARENT')}.appendChild(${expr('CHILD')});\n`;
    case 'js_remove_element':
      return `${pad}${expr('ELEM')}.remove();\n`;
    case 'js_add_event_listener':
      return `${pad}${expr('ELEM')}.addEventListener("${f('EVENT')}", (event) => {\n${stmt('BODY', indent + 1)}${pad}});\n`;
    case 'js_window_onload':
      return `${pad}window.addEventListener("load", () => {\n${stmt('BODY', indent + 1)}${pad}});\n`;
    case 'js_dom_content_loaded':
      return `${pad}document.addEventListener("DOMContentLoaded", () => {\n${stmt('BODY', indent + 1)}${pad}});\n`;
    case 'js_prevent_default':
      return `${pad}event.preventDefault();\n`;
    case 'js_stop_propagation':
      return `${pad}event.stopPropagation();\n`;
    case 'js_function':
      return `${pad}function ${f('NAME')}(${f('PARAMS')}) {\n${stmt('BODY', indent + 1)}${pad}}\n`;
    case 'js_arrow_function':
      return `${pad}const ${f('NAME')} = (${f('PARAMS')}) => {\n${stmt('BODY', indent + 1)}${pad}};\n`;
    case 'js_call_stmt':
      return `${pad}${f('NAME')}(${f('ARGS')});\n`;
    case 'js_return':
      return `${pad}return ${expr('VALUE')};\n`;
    case 'js_console_log':
      return `${pad}console.log(${expr('VALUE')});\n`;
    case 'js_alert':
      return `${pad}alert(${expr('VALUE')});\n`;
    case 'js_set_timeout':
      return `${pad}setTimeout(() => {\n${stmt('BODY', indent + 1)}${pad}}, ${f('DELAY')});\n`;
    case 'js_set_interval':
      return `${pad}setInterval(() => {\n${stmt('BODY', indent + 1)}${pad}}, ${f('INTERVAL')});\n`;
    case 'js_object_set':
      return `${pad}${expr('OBJ')}.${f('KEY')} = ${expr('VALUE')};\n`;
    case 'js_object_delete':
      return `${pad}delete ${expr('OBJ')}.${f('KEY')};\n`;
    default: {
      const resolved = ExtensionRegistry.resolveStmt(block, indent);
      if (resolved !== null) return resolved;
      return '';
    }
  }
}

function generateJSCode() {
  if (!workspaceJs) return '';
  let out = '';
  workspaceJs.getTopBlocks(true).forEach(b => {
    let curr = b;
    while (curr) {
      if (!BlockSync.isInternalContainer(curr)) {
        out += blockToJS(curr, 0);
      }
      curr = curr.getNextBlock();
    }
  });
  return out;
}

function highlightJS(raw) {
  if (!raw || !raw.trim()) return '<span class="empty">// Place blocks to generate JS</span>';
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  s = s.replace(/\b(let|const|var|function|if|else|for|of|while|return|true|false|null|undefined|new|this|break|continue|typeof|instanceof)\b/g, '<span class="cc">$1</span>');
  s = s.replace(/\b(document|window|console|event|setTimeout|setInterval|parseInt|parseFloat|isNaN|Math|Array|Object|JSON)\b/g, '<span class="ct">$1</span>');
  s = s.replace(/(&quot;[^&]*&quot;)/g, '<span class="cv">$1</span>');
  s = s.replace(/\.(getElementById|querySelector|querySelectorAll|addEventListener|innerHTML|textContent|style|classList|setAttribute|appendChild|createElement|log|onload|add|remove|toggle|call|apply|bind|forEach|map|filter|push|pop|shift)\b/g, '.<span class="ca">$1</span>');
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="cv">$1</span>');
  s = s.replace(/(\/\/[^\n]*)/g, '<span class="cc">$1</span>');
  return s;
}