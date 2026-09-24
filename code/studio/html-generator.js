// ══════════════════════════════════════════════
//  html-generator.js – HTML block → code
// ══════════════════════════════════════════════

function processAttributes(attrBlock) {
  if (!attrBlock) return '';
  let parts =[];
  if (attrBlock.type === 'html_attrs') {
    let i = 0;
    while (attrBlock.getInput('ATTR' + i)) {
      let child = attrBlock.getInputTargetBlock('ATTR' + i);
      if (child && child.type && child.type.startsWith('attr_')) {
        parts.push(`${child.type.replace('attr_', '')}="${child.getFieldValue('VALUE')}"`);
      }
      i++;
    }
  } else if (attrBlock.type && attrBlock.type.startsWith('attr_')) {
    parts.push(`${attrBlock.type.replace('attr_', '')}="${attrBlock.getFieldValue('VALUE')}"`);
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function blockToHTML(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => (block.getFieldValue(n) || '');
  const getAttrs = () => block.getInput('ATTR') ? processAttributes(block.getInputTargetBlock('ATTR')) : '';
  const stmt = (name, ind) => {
    let child = block.getInputTargetBlock(name);
    let out = '';
    while (child) {
      out += blockToHTML(child, ind);
      child = child.getNextBlock();
    }
    return out;
  };
  
  switch (block.type) {
    case 'html_root':
      return `<!DOCTYPE html>\n<html>\n${stmt('CONTENT', 1)}</html>\n`;
    case 'html_head':
      return `${pad}<head${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</head>\n`;
    case 'html_body':
      return `${pad}<body${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</body>\n`;
    case 'html_title':
      return `${pad}<title${getAttrs()}>${stmt('CONTENT', indent + 1)}</title>\n`;
    case 'html_meta': {
      let attr = getAttrs();
      if (f('CHARSET')) attr += ` charset="${f('CHARSET')}"`;
      if (f('NAME')) attr += ` name="${f('NAME')}"`;
      if (f('CONTENT')) attr += ` content="${f('CONTENT')}"`;
      return `${pad}<meta${attr}>\n`;
    }
    case 'html_link':
      return `${pad}<link rel="${f('REL')}" href="${f('HREF')}"${getAttrs()}>\n`;
    case 'html_header':
      return `${pad}<header${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</header>\n`;
    case 'html_main':
      return `${pad}<main${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</main>\n`;
    case 'html_footer':
      return `${pad}<footer${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</footer>\n`;
    case 'html_style': {
      let child = block.getInputTargetBlock('STYLE');
      let cssContent = '';
      while (child) {
        cssContent += blockToCSS(child, indent + 1);
        child = child.getNextBlock();
      }
      return `${pad}<style${getAttrs()}>\n${cssContent}${pad}</style>\n`;
    }
    case 'html_script': {
      let child = block.getInputTargetBlock('SCRIPT');
      let jsContent = '';
      while (child) {
        jsContent += blockToJS(child, indent + 1);
        child = child.getNextBlock();
      }
      return `${pad}<script${getAttrs()}>\n${jsContent}${pad}</script>\n`;
    }
    case 'html_element': {
      const tag = f('TAG');
      const attrs = getAttrs();
      const content = stmt('CONTENT', indent + 1);
      return `${pad}<${tag}${attrs}>\n${content}${pad}</${tag}>\n`;
    }
    case 'html_br':
      return `${pad}<br${getAttrs()}>\n`;
    case 'html_a':
      return `${pad}<a href="${f('HREF')}"${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</a>\n`;
    case 'html_nav':
      return `${pad}<nav${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</nav>\n`;
    case 'html_nav_a':
      return `${pad}<nav${getAttrs()}>\n${pad}  <a href="${f('HREF')}"${getAttrs()}>${stmt('CONTENT', indent + 2)}${pad}  </a>\n${pad}</nav>\n`;
    case 'html_img':
      return `${pad}<img src="${f('SRC')}" alt="${f('ALT')}"${getAttrs()}>\n`;
    case 'html_audio':
      return `${pad}<audio src="${f('SRC')}"${getAttrs()} controls>\n${stmt('CONTENT', indent + 1)}${pad}</audio>\n`;
    case 'html_video':
      return `${pad}<video src="${f('SRC')}"${getAttrs()} controls>\n${stmt('CONTENT', indent + 1)}${pad}</video>\n`;
    case 'html_source':
      return `${pad}<source src="${f('SRC')}" type="${f('TYPE')}"${getAttrs()}>\n`;
    case 'html_iframe':
      return `${pad}<iframe src="${f('SRC')}"${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</iframe>\n`;
    case 'html_figure':
      return `${pad}<figure${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</figure>\n`;
    case 'html_figcaption':
      return `${pad}<figcaption${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</figcaption>\n`;
    case 'html_ul':
      return `${pad}<ul${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</ul>\n`;
    case 'html_ol':
      return `${pad}<ol${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</ol>\n`;
    case 'html_li':
      return `${pad}<li${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</li>\n`;
    case 'html_table':
      return `${pad}<table${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</table>\n`;
    case 'html_caption':
      return `${pad}<caption${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</caption>\n`;
    case 'html_colgroup':
      return `${pad}<colgroup${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</colgroup>\n`;
    case 'html_col':
      return `${pad}<col${getAttrs()}>\n`;
    case 'html_thead':
      return `${pad}<thead${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</thead>\n`;
    case 'html_tbody':
      return `${pad}<tbody${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</tbody>\n`;
    case 'html_tfoot':
      return `${pad}<tfoot${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</tfoot>\n`;
    case 'html_tr':
      return `${pad}<tr${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</tr>\n`;
    case 'html_td':
      return `${pad}<td${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</td>\n`;
    case 'html_th':
      return `${pad}<th${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</th>\n`;
    case 'html_form':
      return `${pad}<form${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</form>\n`;
    case 'html_label':
      return `${pad}<label${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</label>\n`;
    case 'html_input':
      return `${pad}<input${getAttrs()}>\n`;
    case 'html_textarea':
      return `${pad}<textarea${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</textarea>\n`;
    case 'html_btn':
      return `${pad}<button${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</button>\n`;
    case 'html_select':
      return `${pad}<select${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</select>\n`;
    case 'html_optgroup':
      return `${pad}<optgroup${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</optgroup>\n`;
    case 'html_option':
      return `${pad}<option${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</option>\n`;
    case 'html_fieldset':
      return `${pad}<fieldset${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</fieldset>\n`;
    case 'html_legend':
      return `${pad}<legend${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</legend>\n`;
    case 'html_datalist':
      return `${pad}<datalist${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</datalist>\n`;
    case 'html_output':
      return `${pad}<output${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</output>\n`;
    case 'html_div':
      return `${pad}<div${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</div>\n`;
    case 'html_span':
      return `${pad}<span${getAttrs()}>\n${stmt('CONTENT', indent + 1)}${pad}</span>\n`;
    case 'html_text':
      return `${pad}${f('TEXT')}\n`;
    case 'html_format':
      return `${pad}<${f('TAG')}${getAttrs()}>${f('TEXT')}</${f('TAG')}>\n`;
    default:
      return '';
  }
}

function generateHTMLCode() {
  if (!workspaceHtml) return '';
  let out = '';
  workspaceHtml.getTopBlocks(true).forEach(b => {
    let curr = b;
    while (curr) {
      out += blockToHTML(curr, 0);
      curr = curr.getNextBlock();
    }
  });
  return out;
}

function highlightHTML(raw) {
  if (!raw || !raw.trim()) return '<span class="empty">&lt;!-- Place blocks to generate HTML --&gt;</span>';
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  s = s.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="cc">$1</span>');
  s = s.replace(/(&lt;\/?\w+)((?:\s+\w+(?:=&quot;[^&]*&quot;)?)*)\s*(\/?)(&gt;)/g, (m, tag, attrs, sl, gt) => {
    const aHL = attrs.replace(/(\w+)=(&quot;[^&]*&quot;)/g, '<span class="ca">$1</span>=<span class="cv">$2</span>');
    return `<span class="ct">${tag}${aHL}${sl}${gt}</span>`;
  });
  return s;
}

