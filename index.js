const prompt = document.getElementById('prompt');
const container = document.getElementById('container');

// ––––––– //
// Aliases //
// ––––––– //

const π = Math.PI;
const {floor} = Math;

// ––––––––– //
// DOM Utils //
// ––––––––– //
const findById = id => document.getElementById(id);
const findByQuery = query => document.querySelector(query);

const setAttributes = (element, attrs) => {
  for (let name in attrs) {
    if (attrs.hasOwnProperty(name)) {
      element.setAttribute(name, attrs[name]);
    }
  }
}

const h = {
  canvas: (attr = {}) => {
    const el = document.createElement('canvas');
    setAttributes(el, attr);

    return el;
  }
}

// ––––––––––––– //
// General Utils //
// ––––––––––––– //

const inc = num => num + 1;
const dec = num => num - 1;

const flip = fn => (...args) => fn(...args.reverse());

const isEmpty = object => Object.keys(object).length === 0;

const keyfy = obj => {
  if (typeof obj === 'string') return obj;

  return map(obj, (val, key) => `${key}:${val}`).sort().join(',');
}

// TODO: Support multiple arguments
const memoize = func => {
  if (!(window._memos instanceof Map)) {
    window._memos = new Map();
  }

  return arg => {
    const key = `${func.name}#${keyfy(arg)}`;
    if (window._memos.has(key)) {
      return window._memos.get(key);
    }

    window._memos.set(key, func(arg));
    return window._memos.get(key);
  }
}

// ––––––––––––– //
// Boolean Utils //
// ––––––––––––– //

const not = fn => (...args) => !fn(...args)

const or = (lfn, rfn) => (...args) => lfn(...args) || rfn(...args);

const eq = (l, r) => l === r;
const smaller = (l, r) => l < r;
const greater = (l, r) => l > r;

const smallerOrEq = or(smaller, eq);
const greaterOrEq = or(greater, eq);

// –––––––––––––– //
// Sequence Utils //
// –––––––––––––– //

// Generate //

const toGen = function* (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [obj[key], key, obj];
    }
  }
}

const range = function* (left, right) {
  const move = (right - left > 0) ? inc : dec;
  const comp = (right - left > 0) ? smallerOrEq : greaterOrEq;

  for (let i = left; comp(i, right); i = move(i)) {
    yield i;
  }
}

const take = (gen, n) => {
  const out = [];
  
  for (let i = 0; i < n; i += 1) {
    const cursor = gen.next();

    if (typeof cursor.value === 'undefined') return out;
    out.push(cursor.value)
  }

  return out;
}

// Read //

const each = function (obj, fn) {
  for (let params of toGen(obj)) {
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
  let objGen = toGen(obj);
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
const pick = (obj, keys) => pickBy(obj, (val, key) => keys.includes(key));

const omitBy = (obj, fn) => pickBy(obj, not(fn));
const omit = (obj, keys) => omitBy(obj, (val, key) => keys.includes(key));


// –––––––––––––––– //
// Canvas Utilities //
// –––––––––––––––– //

const generateFontSizeRatios = font => {
  const reference = new Map();
  const ctx = h.canvas().getContext('2d');

  ctx.font = `1px ${font}`

  for (let code of range(0,126)) {
    const char = String.fromCharCode(code);
    reference.set(char, ctx.measureText(char).width);
  }

  return reference;
}

const memoGenFontSizeRatios = memoize(generateFontSizeRatios);
const charWidthRatio = (char, font) => memoGenFontSizeRatios(font).get(char);
const measureText = (text, font, size) => reduce(text, (total, char) => total + charWidthRatio(char, font) * size, 0)
const createTextMeasurer = (...args) => text => measureText(text, ...args)

const breakSentenceAt = (sentence, length, font, size) => {
  if (length.toString() === 'NaN' || typeof length !== 'number') {
    throw new TypeError('length must be a number');
  }

  const left = [];
  const right = sentence.split(' ');

  const ruler = createTextMeasurer(font, size);
  const wordsRuler = arr => reduce(arr, (total, word) => ruler(word) + total, 0);


  while (wordsRuler(left + right[0]) < length && right.length > 0) {
    left.push(right.shift())
  }

  return [left.join(' '), right.join(' ')]
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

getSurfaceFor = ({naturalHeight, naturalWidth}) => getSurface({
  height: naturalHeight,
  width: naturalWidth
})

const getImage = src => {
  return new Promise ((resolve, reject) => {
    const img = new Image();
    img.src = src;

    img.addEventListener('load', () => {
      resolve(img)
    });

    img.addEventListener('error', error => {
      reject(error)
    });
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
  textBaseline: 'top'
}

const drawCaption = (text, opts = defaultCaptionOpts) => {

  return cvs => {
    let {fontSize, fontName} = opts;
    const ctx = cvs.getContext('2d');

    // Consider fontSize a percentage of Canvas height
    fontSize = fontSize / 100 * cvs.height;
    const font = `${fontSize}px ${fontName}`;
    each(
      Object.assign(omit(opts, ['fontName', 'fontSize']), {font}),
      (val, key) => { ctx[key] = val; }
    );

    let [left, right] = breakSentenceAt(text, cvs.width - 20, fontName, fontSize)

    ctx.strokeText(left, cvs.width/2, 10);
    ctx.fillText(left, cvs.width/2, 10);

    ctx.strokeText(right, cvs.width/2, fontSize + 10);
    ctx.fillText(right, cvs.width/2, fontSize + 10);
  }
}

const createWriter = (cvs, img, font = 'Impact', fontSize = 100) => text => {
  ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if (img) ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

  drawCaption(text)(cvs);
}

getImage('./imminent-ned.jpg')
  .then(image => {
    const surface = getSurfaceFor(image)
    const writer = createWriter(surface, image);

    container.appendChild(surface);

    prompt.addEventListener('input', ({target}) => {
      window.requestAnimationFrame(() => {writer(target.value)});
    });

    writer('');
  })
