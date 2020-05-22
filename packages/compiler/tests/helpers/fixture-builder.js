const path = require('path');

const Funnel = require('broccoli-funnel');
const { Builder } = require('broccoli');

const compile = require('../../build/index'); // eslint-disable-line node/no-missing-require

module.exports = () => {
  const app = new Funnel('tests/fixtures/input');
  const compiledTree = compile(app, { projectRoot: path.resolve('../../') });
  const builder = new Builder(compiledTree);

  builder.discard = async () => {
    await builder.cleanup();
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
