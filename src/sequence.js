import {inc, dec} from 'base';
import {smallerOrEq, greaterOrEq, not} from 'boolean';
import {pushInLast} from 'utils';

// –––––––––––––––––– //
// Sequence functions //
// –––––––––––––––––– //

// Generate //
export const toIterator = function* (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [obj[key], key, obj];
    }
  }
}

export const range = function* (left, right) {
  const direct = (right - left > 0) ? inc : dec;
  const compare = (right - left > 0) ? smallerOrEq : greaterOrEq;

  for (let i = left; compare(i, right); i = direct(i)) {
    yield i;
  }
}

export const take = (gen, n) => {
  const out = [];
  
  for (let i = 0; i < n; i += 1) {
    const cursor = gen.next();

    if (typeof cursor.value === 'undefined') return out;
    out.push(cursor.value)
  }

  return out;
}

// Read //
export const each = function (obj, fn) {
  for (let params of toIterator(obj)) {
    fn(...params);
  }
}

// Transform //
export const map = (obj, fn) => {
  const out = [];
  each(obj, (...args) => { out.push(fn(...args)) });

  return out;
}

export const reduce = (obj, fn, initialVal = null) => {
  let objGen = toIterator(obj);
  let prevVal = initialVal !== null ? initialVal : objGen.next().value[0];

  for (let [val, key] of objGen) {
    prevVal = fn(prevVal, val, key, obj);
  }

  return prevVal;
}

export const pickBy = (obj, fn) => reduce(
  obj,
  (newObj, val, key) => {
    if (fn(val, key) === true) newObj[key] = val;
    return newObj;
  },
  {}
);
export const pick = (obj, keys) => pickBy(obj, (val, key) => keys.includes(key));

export const omitBy = (obj, fn) => pickBy(obj, not(fn));
export const omit = (obj, keys) => omitBy(obj, (val, key) => keys.includes(key));

export const partitionBy = (obj, fn) => {
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
