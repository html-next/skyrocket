const babel = require("broccoli-babel-transpiler");
const SchemaPlugin = require.resolve("./build/index");
const Funnel = require("broccoli-funnel");
const merge = require("broccoli-merge-trees");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");
const tmp = require("tmp");

tmp.setGracefulCleanup();

module.exports = () => {
  const app = new Funnel("tests/fixtures/input");
  const tmpobj = tmp.dirSync();
  const transpiled = babel(app, {
    throwUnlessParallelizable: true,
    plugins: [
      [
        SchemaPlugin,
        {
          schemaSourceFiles: {
            "@ember-data/model": true
          },
          filePrefix: "workers/",
          outputPath: tmpobj.name
        }
      ],
      [Decorators, { decoratorsBeforeExport: true }],
      [ClassProps]
    ]
  });
  const fullTree = merge([
    transpiled,
    new Funnel(tmpobj.name, { destDir: "parsed-schemas" })
  ]);
  return fullTree;
};
