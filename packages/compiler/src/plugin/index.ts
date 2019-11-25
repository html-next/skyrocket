import Rollup from "./rollup";
import Formatter from "./formatter";
const babel = require("broccoli-babel-transpiler");
const merge = require("broccoli-merge-trees");
const Funnel = require("broccoli-funnel");
const SchemaPlugin = require.resolve("@skyrocketjs/schema");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");
const ParseDecorators = require.resolve("@babel/plugin-syntax-decorators");
const debug = require("broccoli-debug").buildDebugCallback(
  "@skyrocketjs/compiler"
);
const tmp = require("tmp");

tmp.setGracefulCleanup();

module.exports = function compile(node: any) {
  const tmpobj = tmp.dirSync();
  // acorn used by rollup doesn't support decorators or class fields
  // we don't do a full parse here, we just want to grab info.

  const schemaTree = new Funnel(node, {
    srcDir: "workers",
    destDir: "workers"
  });

  const parsedSchemas = debug(
    babel(schemaTree, {
      throwUnlessParallelizable: true,
      plugins: [
        [
          SchemaPlugin,
          {
            schemaSourceFiles: {
              "@skyrocketjs/worker": true
            },
            filePrefix: "workers/",
            outputPath: tmpobj.name,
            removeDecorators: true
          }
        ],
        [ParseDecorators, { decoratorsBeforeExport: false }]
      ]
    }),
    "babel-schemas"
  );

  const pullTree = merge([node, parsedSchemas], { overwrite: true });

  const parsedRollup = debug(
    babel(pullTree, {
      throwUnlessParallelizable: true,
      plugins: [[Decorators, { decoratorsBeforeExport: false }], [ClassProps]]
    }),
    "babel-rollup"
  );

  const withSchemas = debug(
    new Formatter({
      schemaPath: tmpobj.name,
      schemaOutputDirectory: "workers"
    }),
    "schemas"
  );

  const rollup = debug(
    new Rollup(parsedRollup, {
      cache: true, // likely need to make sure this is keyed to the output of the schemas
      schemaPath: tmpobj.name,
      rollup: {
        // these options assigned later
        input: "",
        output: {}
      }
    }),
    "rollup"
  );

  return merge([rollup, withSchemas]);
};
