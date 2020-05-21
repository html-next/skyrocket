const fs = require('fs');
const path = require('path');

module.exports = function iterate(directoryPath, callback, segments = []) {
  const dir = fs.readdirSync(directoryPath);

  dir.forEach(potentialDir => {
    let fullPath = path.join(directoryPath, potentialDir);
    let stats = fs.lstatSync(fullPath);

    if (stats.isFile()) {
      callback(fullPath, [...segments, potentialDir]);
    } else {
      iterate(fullPath, callback, [...segments, potentialDir]);
    }
  });
};
