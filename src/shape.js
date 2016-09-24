import {findBySelector, findById, h} from 'dom';
import {each} from 'sequence';
// TODO: Create Vector class
// TODO: Create functions to manipulate Vector objects
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
