const rangeCut = require("./cut.js");

module.exports = function carve(insides, holes) {
  let results = insides;
  holes.forEach(hole => {
    results = results.map(pc => rangeCut(pc, hole)).flat();
  });
  return results;
}
