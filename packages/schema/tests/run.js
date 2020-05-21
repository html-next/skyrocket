const iterate = require('./helpers/iterate');

iterate(__dirname, fullPath => {
  if (fullPath.endsWith('-test.js')) {
    require(fullPath);
  }
});
