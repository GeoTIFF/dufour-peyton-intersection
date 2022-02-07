module.exports = function clamp(n, min, max) {
  if (n < min) return min;
  else if (n > max) return max;
  return n;
};
