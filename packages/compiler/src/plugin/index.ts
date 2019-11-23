import Rollup from "./rollup";
import Formatter from "./formatter";
const babel = require("broccoli-babel-transpiler");
const merge = require("broccoli-merge-trees");
const SchemaPlugin = require.resolve("@skyrocket/schema");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");
const debug = require("broccoli-debug").buildDebugCallback(
  "@skyrocket/compiler"
);
const tmp = require("tmp");

tmp.setGracefulCleanup();

module.exports = function compile(node: any) {
  const tmpobj = tmp.dirSync();
  // acorn used by rollup doesn't support decorators or class fields
  // we don't do a full parse here, we just want to grab info.

  const parsed = debug(
    babel(node, {
      throwUnlessParallelizable: true,
      plugins: [
        [
          SchemaPlugin,
          {
            schemaSourceFiles: {
              "@skyrocket/worker": true
            },
            filePrefix: "workers/",
            outputPath: tmpobj.name
          }
        ],
        [Decorators, { decoratorsBeforeExport: true }],
        [ClassProps]
      ]
    }),
    "babel"
  );

  const withSchemas = debug(
    new Formatter({
      schemaPath: tmpobj.name,
      schemaOutputDirectory: "workers"
    }),
    "schemas"
  );

  const rollup = debug(
    new Rollup(parsed, {
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
