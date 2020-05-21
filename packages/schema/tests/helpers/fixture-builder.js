const { Builder } = require('broccoli');
const babel = require('broccoli-babel-transpiler');
const Funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');
const tmp = require('tmp');

const Decorators = require.resolve('@babel/plugin-proposal-decorators');
const ClassProps = require.resolve('@babel/plugin-proposal-class-properties');
const SchemaPlugin = require.resolve('../../build/index'); // eslint-disable-line node/no-missing-require

tmp.setGracefulCleanup();

module.exports = () => {
  const app = new Funnel('tests/fixtures/input');
  const tmpobj = tmp.dirSync({ unsafeCleanup: true });
  const transpiled = babel(app, {
    throwUnlessParallelizable: true,
    plugins: [
      [
        SchemaPlugin,
        {
          schemaSourceFiles: {
            '@ember-data/model': true,
          },
          filePrefix: 'workers/',
          outputPath: tmpobj.name,
        },
      ],
      [Decorators, { decoratorsBeforeExport: true }],
      [ClassProps],
    ],
  });
  const fullTree = merge([transpiled, new Funnel(tmpobj.name, { destDir: 'parsed-schemas' })]);
  const builder = new Builder(fullTree);
  builder.discard = async () => {
    await builder.cleanup();
    tmpobj.removeCallback();
    let ParallelApi = require('broccoli-babel-transpiler/lib/parallel-api');

    // shut down any workerpool that is running at this point
    let babelCoreVersion = ParallelApi.getBabelVersion();
    let workerPoolId = 'v2/broccoli-babel-transpiler/workerpool/babel-core-' + babelCoreVersion;
    let runningPool = process[workerPoolId];

    if (runningPool) {
      await runningPool.terminate();
      delete process[workerPoolId];
    }
  };
  return builder;
};
