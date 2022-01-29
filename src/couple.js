// This function takes in an array with an even number of elements and
// returns an array that couples every two consecutive elements;
module.exports = function couple(array) {
  const couples = [];
  const lengthOfArray = array.length;
  for (let i = 0; i < lengthOfArray; i += 2) {
    couples.push([array[i], array[i + 1]]);
  }
  return couples;
};
