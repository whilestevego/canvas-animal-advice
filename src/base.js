import {map} from 'sequence';

// –––––––––––––– //
// Base Functions //
// –––––––––––––– //
export const inc = num => num + 1;
export const dec = num => num - 1;

export const flip = fn => (...args) => fn(...args.reverse());

export const isEmpty = object => Object.keys(object).length === 0;

export const keyfy = obj => {
  if (typeof obj === 'string') return obj;

  return map(obj, (val, key) => `${key}:${val}`).sort().join(',');
}

// TODO: Support multiple arguments
export const memoize = fn => {
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
