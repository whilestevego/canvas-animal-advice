import 'advice-animal';
import {findById, findAllBySelector} from 'dom';
import {each} from 'sequence';

// each(
//   findAllBySelector('nav > a'),
//   a => {
//     a.addEventListener('click', e => {e.preventDefault()});
//   }
// );
const extractHash = url => url.match(/#(.+)$/)[1];

const toggleIn = (targetId, containerSelector) => {
  each(findAllBySelector(`${containerSelector} > *`), node => {
    console.log(node.styles);
  });
};

window.addEventListener('load', () => {
  const shownNode = findById(extractHash(window.location.hash));
  shownNode.style.display = 'initial';
})

window.addEventListener('hashchange', ({oldURL, newURL}) => {
  const {location} = event.target;
  const oldSection = findById(extractHash(oldURL));
  const newSection = findById(extractHash(newURL));

  oldSection.style.display = 'none';
  newSection.style.display = 'initial';
});

