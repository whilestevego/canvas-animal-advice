'use strict';

const inc = num => num + 1;
const dec = num => num - 1;

const keyfy = obj => {
  if (typeof obj === 'string') return obj;

  return map(obj, (val, key) => `${key}:${val}`).sort().join(',');
}

// TODO: Support multiple arguments
const memoize = fn => {
  if (!(window._memos instanceof Map)) {
    window._memos = new Map();
  }

  return arg => {
    const key = `${fn.name}#${keyfy(arg)}`;
    if (window._memos.has(key)) {
      return window._memos.get(key);
    }

    window._memos.set(key, fn(arg));
    return window._memos.get(key);
  }
}

// ––––––––––––– //
// Boolean Utils //
// ––––––––––––– //
const eq = (l, r) => l === r;
const greater = (l, r) => l > r;
const not = fn => (...args) => !fn(...args)
const or = (lfn, rfn) => (...args) => lfn(...args) || rfn(...args);
const smaller = (l, r) => l < r;

const greaterOrEq = or(greater, eq);
const smallerOrEq = or(smaller, eq);

// ––––––––––– //
// Array Utils //
// ––––––––––– //
const pushInLast = (arr, val) => {
  if (arr.length <= 0) {
    arr.push([]);
    return pushToLast(arr, val);
  }
  return arr[arr.length - 1].push(val);
}

const toIterator = function* (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [obj[key], key, obj];
    }
  }
}

const range = function* (left, right) {
  const direct = (right - left > 0) ? inc : dec;
  const compare = (right - left > 0) ? smallerOrEq : greaterOrEq;

  for (let i = left; compare(i, right); i = direct(i)) {
    yield i;
  }
}

const each = function (obj, fn) {
  for (let params of toIterator(obj)) {
    fn(...params);
  }
}

// Transform //
const map = (obj, fn) => {
  const out = [];
  each(obj, (...args) => { out.push(fn(...args)) });

  return out;
}

const reduce = (obj, fn, initialVal = null) => {
  let objGen = toIterator(obj);
  let prevVal = initialVal !== null ? initialVal : objGen.next().value[0];

  for (let [val, key] of objGen) {
    prevVal = fn(prevVal, val, key, obj);
  }

  return prevVal;
}

const pickBy = (obj, fn) => reduce(
  obj,
  (newObj, val, key) => {
    if (fn(val, key) === true) newObj[key] = val;
    return newObj;
  },
  {}
);
const omitBy = (obj, fn) => pickBy(obj, not(fn));
const omit = (obj, keys) => omitBy(obj, (val, key) => keys.includes(key));

const partitionBy = (obj, fn) => {
  let prevTest;

  return reduce(obj, (newArr, val, key) => {
    const currentTest = fn(val);
    if (currentTest === prevTest) {
      pushInLast(newArr, val);
    } else {
      newArr.push([val]);
    };
    prevTest = currentTest;
    return newArr;
  }, [])
}

const HTML5Tags = [
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
const findById = (idOrNode, id) => {
  if (typeof idOrNode.getElementById !== 'function') {
    return findById(document, idOrNode);
  }
  return idOrNode.getElementById(id);
}

const findBySelector = (selectorOrNode, selector) => {
  if (typeof selectorOrNode.querySelector !== 'function') {
    return findBySelector(document, selectorOrNode);
  }
  return selectorOrNode.querySelector(selector);
}

const setAttributes = (element, attrs) => {
  for (let name in attrs) {
    if (attrs.hasOwnProperty(name)) {
      element.setAttribute(name, attrs[name]);
    }
  }
}

const createTag = (name, attrs = {}) => {
  const el = document.createElement(name);
  setAttributes(el, attrs);

  return el;
}

const h = {};
each(
  HTML5Tags,
  tag => {
    h[tag] = attrs => createTag(tag, attrs);
  }
);

const prompt = findById('prompt');
const container = findBySelector('#advice-animal > .canvas-box');

// –––––––––––––––– //
// Canvas Utilities //
// –––––––––––––––– //
const fontSizeRatiosFor = memoize(font => {
  const reference = new Map();
  const ctx = h.canvas().getContext('2d');

  ctx.font = `1px ${font}`

  for (let code of range(0,126)) {
    const char = String.fromCharCode(code);
    reference.set(char, ctx.measureText(char).width);
  }

  return reference;
});

const charWidthRatio = (char, font) => fontSizeRatiosFor(font).get(char);
const measureText = (text, font, size) => reduce(text, (total, char) => total + charWidthRatio(char, font) * size, 0)

const breakSentenceAt = (sentence, width, fontName, fontSize) => {
  if (width.toString() === 'NaN' || typeof width !== 'number') {
    throw new TypeError('length must be a number');
  }

  let cumulativeLength = 0;
  const linesOfWords = partitionBy(sentence.split(' '), word => {
    const length = measureText(`${word} `, fontName, fontSize);
    cumulativeLength += length;

    return Math.ceil(cumulativeLength / width);
  });

  return linesOfWords.map(words => words.join(' '));
}

// ––––––––––––––––– //
// Application Logic //
// ––––––––––––––––– //
let getSurface = ({height, width}) => {
  const surface = h.canvas({id: 'surface', height: height * 2, width: width * 2});
  container.appendChild(surface);

  return surface;
}

getSurface = memoize(getSurface);

const getSurfaceFor = ({naturalHeight, naturalWidth}) => getSurface({
  height: naturalHeight,
  width: naturalWidth
})

const getImage = src => {
  return new Promise ((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      resolve(img)
    });

    img.addEventListener('error', error => {
      reject(error)
    });

    img.src = src;
  });
}

//TODO: Move text drawing bit to a function
const defaultCaptionOpts = {
  fontName: 'Impact',
  fontSize: 10,
  lineWidth: 5,
  lineJoin: 'bevel',
  textAlign: 'center',
  fillStyle: 'white',
  textBaseline: 'bottom'
}

const drawCaption = (text, options) => {
  const opts = Object.assign({}, defaultCaptionOpts, options);
  const margin = 30;

  return cvs => {
    let {fontSize, fontName} = opts;
    const ctx = cvs.getContext('2d');

    // Consider fontSize a percentage of Canvas height
    fontSize = fontSize / 100 * cvs.height;
    const font = `${fontSize}px ${fontName}`;

    // Set style properties on drawing context
    each(
      Object.assign(omit(opts, ['fontName', 'fontSize', 'verticalAlign']), {font}),
      (val, key) => { ctx[key] = val; }
    );

    const paragraph = breakSentenceAt(
      text,
      cvs.width - margin * 2,
      fontName,
      fontSize
    );

    each(paragraph, (line, lineNumber) => {
      ctx.strokeText(line, cvs.width/2, cvs.height - margin - (paragraph.length - lineNumber - 1) * fontSize);
      ctx.fillText(line, cvs.width/2, cvs.height - margin - (paragraph.length - lineNumber - 1) * fontSize);
    })
  }
}

const createWriter = (cvs, img, font = 'Impact', fontSize = 100) => text => {
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if (img) ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

  drawCaption(text)(cvs);
}

// After image is loaded, initialize program
getImage('./imminent-ned.jpg')
  .then(img => {
    const surface = getSurfaceFor(img)
    const writer = createWriter(surface, img);

    container.appendChild(surface);

    prompt.addEventListener('input', ({target}) => {
      window.requestAnimationFrame(() => {writer(target.value)});
    });

    writer('');
  })

{
  const container = findBySelector('#shapes > .canvas-box');

  const canvas = h.canvas({height: 2000, width: 1000});
  container.appendChild(canvas);

  const π = Math.PI;

  const Artist = cvs => {
    const ctx = cvs.getContext('2d');

    const circle = ({cx = 0, cy = 0, r = 1}) => {
      const path = new Path2D();

      path.moveTo(cx, cy);
      path.arc(cx, cy, r, 0, 2*π, true);

      ctx.fillStyle = 'white';
      ctx.fill(path);
    }

    return {circle};
  };

  Artist(canvas).circle({cx: 100, cy: 100, r: 60});
};

const extractHash = url => {
  const HASH_REGEX = /#(.+)$/;
  const match = url.match(HASH_REGEX);
  return match ? match[1] : null;
}

window.addEventListener('load', () => {
  if (window.location.hash !== '') {
    const shownNode = findById(extractHash(window.location.hash));
    shownNode.style.display = 'initial';
  } else {
    window.location.hash = findBySelector('nav > a').getAttribute('href');
  }
})

window.addEventListener('hashchange', ({oldURL, newURL}) => {
  const {location} = event.target;
  const oldSection = findById(extractHash(oldURL) || '');
  const newSection = findById(extractHash(newURL) || '');

  oldSection && (oldSection.style.display = 'none');
  newSection && (newSection.style.display = 'initial');
});
//# sourceMappingURL=index.js.map
