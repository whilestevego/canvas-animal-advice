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

const or = (lfn, rfn) => (...args) => lfn(...args) || rfn(...args);

const eq = (l, r) => l === r;
const smaller = (l, r) => l < r;
const greater = (l, r) => l > r;

const smallerOrEq = or(smaller, eq);
const greaterOrEq = or(greater, eq);

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

const toGen = function* (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [obj[key], key, obj];
    }
  }
}

const each = function* (obj, cb) {
  for (let params of toGen(obj)) {
    yield cb(...params);
  }
}

const map = (obj, cb) => {
  const out = [];
  each(obj, (...args) => { out.push(cb(...args)) });

  return out;
}

const reduce = (obj, cb, initialVal = null) => {
  let objGen = toGen(obj);
  let prev = initialVal !== null ? initialVal : objGen.next().value[0];

  for (let [val, key] of objGen) {
    prev = cb(prev, val, key, obj);
  }

  return prev;
}

const keyfy = obj => {
  return map(obj, (val, key) => `${key}:${val}`).sort().join(',');
}

const memoize = func => {
  if (!(window.memos instanceof Map)) {
    window.memos = new Map();
  }

  return arg => {
    const key = `${func.name}#${keyfy(arg)}`;
    if (window.memos.has(key)) {
      return window.memos.get(key);
    }

    window.memos.set(key, func(arg));
    return window.memos.get(key);
  }
}

const isEmpty = object => Object.keys(object).length === 0;

// –––––––––––––––– //
// Canvas Utilities //
// –––––––––––––––– //

const generateFontSizeRatios = font => {
  const reference = new Map();
  const ctx = h.canvas().getContext('2d');

  ctx.font = `1px ${font}`

  for (let code of range(33,126)) {
    const char = String.fromCharCode(code);
    reference.set(char, ctx.measureText(char).width);
  }

  return reference;
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

const createWriter = (cvs, img) => text => {
  const {naturalHeight, naturalWidth} = img;

  ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if (img) ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

  ctx.beginPath();
  ctx.moveTo(10, 10)
  ctx.lineTo(cvs.width - 10, 10);
  ctx.moveTo(10, 10 + 60)
  ctx.lineTo(cvs.width - 10, 10 + 60);
  ctx.stroke();

  ctx.font = '60px Impact';
  ctx.lineWidth = '5';
  ctx.lineJoin = 'bevel';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';

  console.log(`'${text} -> ${ctx.measureText(text).width}`)

  ctx.strokeText(text, cvs.width/2, 10);
  ctx.fillText(text, cvs.width/2, 10);
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
