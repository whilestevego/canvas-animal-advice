import {h} from 'dom';
import {memoize} from 'base';
import {each, omit, partitionBy, range, reduce} from 'sequence';

const prompt = document.getElementById('prompt');
const container = document.getElementById('container');

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
