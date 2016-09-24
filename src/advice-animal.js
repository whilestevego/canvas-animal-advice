import {findBySelector, findById, h} from 'dom';
import {memoize} from 'base';
import {each, omit, partitionBy, range, reduce} from 'sequence';

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
