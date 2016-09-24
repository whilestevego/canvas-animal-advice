'use strict';

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
const not = fn => (...args) => !fn(...args)

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

const topCaption = findById('top-caption');
const bottomCaption = findById('bottom-caption');
const captionForm = findBySelector('.caption-form');
const container = findBySelector('#advice-animal > .canvas-box');

// ––––––––––––––––––––– //
// Canvas Text Utilities //
// ––––––––––––––––––––– //

const rulerFor = (fontName, fontSize) => text => {
  const ctx = h.canvas().getContext('2d');

  ctx.font = `${fontSize}px ${fontName}`;
  return ctx.measureText(text).width;
}

const splitIntoLines = (text, width, fontName, fontSize) => {
  if (width.toString() === 'NaN' || typeof width !== 'number') {
    throw new TypeError('width must be a number');
  }
  const measure = rulerFor(fontName, fontSize);
  const spaceLength = measure(' ');

  let cumulativeLength = 0;
  const linesOfWords = partitionBy(text.split(' '),
    word => {
      console.log(cumulativeLength)
      cumulativeLength += measure(word) + spaceLength;
      return Math.ceil((cumulativeLength - spaceLength) / width);
    }
  );

  return linesOfWords.map(words => words.join(' '));
}

// ––––––––––––––––– //
// Application Logic //
// ––––––––––––––––– //
const getSurface = memoize(
  ({height, width}) => {
    const surface = h.canvas({id: 'surface', height: height * 2, width: width * 2});
    container.appendChild(surface);

    return surface;
  }
)

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
  margin: 30,
  lineWidth: 5,
  lineJoin: 'bevel',
  textAlign: 'center',
  fillStyle: 'white',
  textBaseline: 'bottom'
}

function caption (text, options) {
  const opts = Object.assign({}, defaultCaptionOpts, options);

  return {
    draw(cvs) {
      const {height, width} = cvs;
      const {fontSize, fontName, margin} = opts;
      const ctx = cvs.getContext('2d');

      // Consider fontSize a percentage of Canvas height
      const fontSizeInPX = fontSize / 100 * height;
      const font = `${fontSizeInPX}px ${fontName}`;

      // Set style properties on drawing context
      Object.assign(ctx, omit(opts, ['margin','fontName', 'fontSize']), {font});

      const lines = splitIntoLines(text, width - margin * 2, fontName, fontSizeInPX);
      const lineCount = lines.length;

      const verticalLinePos = {
        top: lineNumber => margin + lineNumber * fontSizeInPX,
        middle: lineNumber => (height - lineCount * fontSizeInPX)/2 + lineNumber * fontSizeInPX + fontSizeInPX/2,
        bottom: lineNumber => height - margin - (lineCount - lineNumber - 1) * fontSizeInPX,
      }

      each(lines, (line, lineNumber) => {
        ctx.strokeText(line, cvs.width/2, verticalLinePos[opts.textBaseline](lineNumber));
        ctx.fillText(line, cvs.width/2, verticalLinePos[opts.textBaseline](lineNumber));
      });
    }
  }
}

const createWriter = (cvs, img, font = 'Impact', fontSize = 100) => text => {
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if (img) ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

  caption(text.top, {textBaseline: 'top'}).draw(cvs);
  caption(text.bottom, {textBaseline: 'bottom'}).draw(cvs);
}

// After image is loaded, initialize program
getImage('./imminent-ned.jpg')
  .then(img => {
    const surface = getSurfaceFor(img)
    const writer = createWriter(surface, img);

    container.appendChild(surface);

    captionForm.addEventListener('input', (event) => {
      const text = {
        top: topCaption.value || '',
        bottom: bottomCaption.value || '',
      }
      window.requestAnimationFrame(() => {writer(text)});
    });

    writer('');
  })

{
  const container = findBySelector('#shapes > .canvas-box');

  const canvas = h.canvas({height: 2000, width: 1000});
  container.appendChild(canvas);

  // On macOS, press CMD+P for π
  const π = Math.PI;

  const circle = (ctx, {cx = 0, cy = 0, radius = 1}) => {
    const path = new Path2D();

    path.arc(cx, cy, radius, 0, 2*π, true);

    ctx.fill(path);
  };

  const rectangle = (ctx, {cx = 0, cy = 0, width = 2, height = 1}) => {
    const path = new Path2D();

    path.rect(cx, cy, width, height);

    ctx.fill(path);
  };

  const square = (ctx, {cx = 0, cy = 0, width = 1}) => {
    rectangle(ctx, {cx, cy, width, height: width});
  };

  function Artist (cvs) {
    const ctx = cvs.getContext('2d');
    const fns = [circle, square, rectangle];

    ctx.fillStyle = 'White';

    each(
      fns,
      fn => {
        this[fn.name] = arg => {
          arg ? fn(ctx, arg) : fn(ctx, {});
          return this;
        };
      }
    );
  };

  const artist = new Artist(canvas);

  artist
    .circle({cx: 100, cy: 100, radius: 60})
    .circle({cx: 200, cy: 300, radius: 80})
    .square({cx: 400, cy: 200, width: 60 * 3});
};

const extractHash = url => {
  const HASH_REGEX = /#(.+)$/;
  const match = url.match(HASH_REGEX);
  return match ? match[1] : null;
}

window.addEventListener('load', () => {
  if (window.location.hash !== '') {
    const shownNode = findById(extractHash(window.location.hash));
    shownNode.style.display = 'flex';
  } else {
    window.location.hash = findBySelector('nav > a').getAttribute('href');
  }
})

window.addEventListener('hashchange', ({oldURL, newURL}) => {
  const {location} = event.target;
  const oldSection = findById(extractHash(oldURL) || '');
  const newSection = findById(extractHash(newURL) || '');

  oldSection && (oldSection.style.display = 'none');
  newSection && (newSection.style.display = 'flex');
});
//# sourceMappingURL=index.js.map
