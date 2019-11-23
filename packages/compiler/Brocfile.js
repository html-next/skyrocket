const Funnel = require("broccoli-funnel");
const compile = require("./build/index");
const tmp = require("tmp");

tmp.setGracefulCleanup();

module.exports = () => {
  const app = new Funnel("tests/fixtures/input");
  return compile(app);
};
