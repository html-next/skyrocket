const babel = require("broccoli-babel-transpiler");
const SchemaPlugin = require("./build/index");
const Funnel = require("broccoli-funnel");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");

module.exports = () => {
  const app = new Funnel("tests/fixtures/input");
  const transpiled = babel(app, {
    plugins: [
      [
        SchemaPlugin,
        {
          schemaSourceFiles: {
            "@ember-data/model": true
          },
          filePrefix: "workers/"
        }
      ],
      [Decorators, { decoratorsBeforeExport: true }],
      [ClassProps]
    ]
  });
  return transpiled;
};
