import {findBySelector, findById, h} from 'dom';
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
