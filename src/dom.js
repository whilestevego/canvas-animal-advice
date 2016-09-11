import { each } from 'sequence';

// ––––––––––––– //
// DOM Utilities //
// ––––––––––––– //
export const HTML5Tags = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base',
  'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'cite', 'code', 'col', 'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn',
  'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1 to h6', 'head', 'header', 'hr', 'html', 'i',
  'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li',
  'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav',
  'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param',
  'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section',
  'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary',
  'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
  'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
]

//TODO: Write high-order function to abstract pattern below:
export const findById = (idOrNode, id) => {
  if (typeof idOrNode.getElementById !== 'function') {
    return findById(document, idOrNode);
  }
  return idOrNode.getElementById(id);
}

export const findAllBySelector = (selectorOrNode, selector) => {
  if (typeof selectorOrNode.querySelectorAll !== 'function') {
    return findAllBySelector(document, selectorOrNode);
  }
  return selectorOrNode.querySelectorAll(selector);
}

export const findBySelector = (selectorOrNode, selector) => {
  if (typeof selectorOrNode.querySelector !== 'function') {
    return findBySelector(document, selectorOrNode);
  }
  return selectorOrNode.querySelector(selector);
}

export const setAttributes = (element, attrs) => {
  for (let name in attrs) {
    if (attrs.hasOwnProperty(name)) {
      element.setAttribute(name, attrs[name]);
    }
  }
}

export const createTag = (name, attr = {}) => {
  const el = document.createElement(name);
  setAttributes(el, attr);

  return el;
}

export const h = {};
each(
  HTML5Tags,
  tag => {
    h[tag] = attrs => createTag(tag, attrs);
  }
);
