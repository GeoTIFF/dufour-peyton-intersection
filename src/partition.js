module.exports = function partition(array, filter) {
  const passed = [];
  const unpassed = [];
  const len = array.length;
  for (let i = 0; i < len; i++) {
    const item = array[i];
    if (filter(item)) passed.push(item);
    else unpassed.push(item);
  }
  return [passed, unpassed];
};
