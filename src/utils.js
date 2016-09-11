// ––––––––––– //
// Array Utils //
// ––––––––––– //
export const pushInLast = (arr, val) => {
  if (arr.length <= 0) {
    arr.push([]);
    return pushToLast(arr, val);
  }
  return arr[arr.length - 1].push(val);
}
