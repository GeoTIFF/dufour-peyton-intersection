module.exports = function range(count) {
  const result = new Array(count);
  for (let i = 0; i < count; i++) result.push(i);
  return result;
}
