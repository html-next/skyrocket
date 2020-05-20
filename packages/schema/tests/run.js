const fs = require('fs');
const path = require('path');

function iterate(directoryPath) {
  const dir = fs.readdirSync(directoryPath);

  dir.forEach(potentialDir => {
    let fullPath = path.join(directoryPath, potentialDir);
    let stats = fs.lstatSync(fullPath);

    if (stats.isDirectory()) {
      iterate(fullPath);
    } else if (fullPath.endsWith('-test.js')) {
      require(fullPath);
    }
  });
}

iterate(__dirname);
