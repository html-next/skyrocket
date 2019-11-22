const Funnel = require("broccoli-funnel");
const Rollup = require("./build/index");
const babel = require("broccoli-babel-transpiler");
const SchemaPlugin = require.resolve("@skyrocket/schema");
const Decorators = require.resolve("@babel/plugin-proposal-decorators");
const ClassProps = require.resolve("@babel/plugin-proposal-class-properties");
const debug = require("broccoli-debug").buildDebugCallback("tests");
const tmp = require("tmp");

tmp.setGracefulCleanup();

module.exports = () => {
  const app = new Funnel("tests/fixtures/input");
  const tmpobj = tmp.dirSync();
  // acord used by rollup doesn't support decorators or class fields
  const transpiled = debug(
    babel(app, {
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
  const rollup = debug(
    new Rollup(transpiled, {
      cache: false,
      schemaPath: tmpobj.name,
      rollup: {
        input: {
          example_one: "workers/example-one.js",
          example_two: "workers/example-two.js"
        },
        output: {
          dir: "workers",
          format: "es",
          exports: "named"
        }
      }
    }),
    "rollup"
  );

  return rollup;
};
