const path = require('path');

const merge = require('broccoli-merge-trees');
const { Builder } = require('broccoli');

const compile = require('../../build/index'); // eslint-disable-line node/no-missing-require

module.exports = () => {
  const compiledTree = compile({
    parentRoot: path.resolve('tests/fixtures/input'),
    compilerOptions: {
      importPaths: ['app'],
      directoryToCompile: 'workers',
      node_modules_path: path.resolve('node_modules'),
    },
  });
  const builder = new Builder(merge([compiledTree.schemas, compiledTree.workers]));

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
