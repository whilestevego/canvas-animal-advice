import 'advice-animal';
import 'shape';
import {findById, findBySelector, findAllBySelector} from 'dom';
import {each} from 'sequence';

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

