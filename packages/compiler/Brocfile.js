const Funnel = require("broccoli-funnel");
const Rollup = require("./build/index");
const babel = require("broccoli-babel-transpiler");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");

module.exports = () => {
  const app = new Funnel("tests/fixtures/input");
  // acord used by rollup doesn't support decorators or class fields
  const transpiled = babel(app, {
    throwUnlessParallelizable: true,
    plugins: [[Decorators, { decoratorsBeforeExport: true }], [ClassProps]]
  });
  const rollup = new Rollup(transpiled, {
    entries: ["workers/example-one.js", "workers/example-two.js"],
    rollup: {
      cache: true
    }
  });

  return rollup;
};
