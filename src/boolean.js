// ––––––––––––– //
// Boolean Utils //
// ––––––––––––– //
export const eq = (l, r) => l === r;
export const greater = (l, r) => l > r;
export const not = fn => (...args) => !fn(...args)
export const or = (lfn, rfn) => (...args) => lfn(...args) || rfn(...args);
export const smaller = (l, r) => l < r;

export const greaterOrEq = or(greater, eq);
export const smallerOrEq = or(smaller, eq);
