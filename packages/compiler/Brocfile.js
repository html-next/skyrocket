const Funnel = require('broccoli-funnel');
const tmp = require('tmp');

const compile = require('./build/index'); // eslint-disable-line node/no-missing-require

tmp.setGracefulCleanup();

module.exports = () => {
  const app = new Funnel('tests/fixtures/input');
  return compile(app);
};
