import nodeResolve from '@rollup/plugin-node-resolve';

import Formatter from './formatter';
import Launchers from './launchers';
import rollupLaunchers from './rollup';
import SchemaSRIGenerator from './schema-sri-generator';

const path = require('path');
const babel = require('broccoli-babel-transpiler');
const merge = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

const SchemaPlugin = require.resolve('@skyrocketjs/schema');
const Decorators = require.resolve('@babel/plugin-proposal-decorators');
const ClassProps = require.resolve('@babel/plugin-proposal-class-properties');
const ParseDecorators = require.resolve('@babel/plugin-syntax-decorators');
const debug = require('broccoli-debug').buildDebugCallback('@skyrocketjs/compiler');
const tmp = require('tmp');

tmp.setGracefulCleanup();

module.exports = function compile(node: any, options: { projectRoot: string }) {
  const tmpobj = tmp.dirSync();
  /*
    Grab just the files in workers/ for schema parsing
  */
  const schemaTree = debug(
    new Funnel(node, {
      srcDir: 'workers',
      destDir: 'workers',
    }),
    'schema-tree'
  );

  /*
   Parse out the schema info into tmpobj.name directory
  */
  const parsedSchemas = debug(
    babel(schemaTree, {
      throwUnlessParallelizable: true,
      plugins: [
        [
          SchemaPlugin,
          {
            schemaSourceFiles: {
              '@skyrocketjs/worker': true,
            },
            filePrefix: 'workers/',
            outputPath: tmpobj.name,
            removeDecorators: true,
          },
        ],
        [ParseDecorators, { decoratorsBeforeExport: false }],
      ],
    }),
    'babel-schemas'
  );

  /*
    Generate the schema modules
  */
  const withSchemas = debug(
    new Formatter({
      schemaPath: tmpobj.name,
      schemaOutputDirectory: 'workers',
    }),
    'schemas'
  );

  /*
    Generate worker launcher scripts
  */
  const withLaunchers = debug(
    new Launchers({
      schemaPath: tmpobj.name,
    }),
    'launchers'
  );

  /*
    Our schema scan has to be "pulled" during broccoli compilation
    in order to run, so we merge it back in.
  */
  const pullTree = debug(merge([node, parsedSchemas, withSchemas, withLaunchers], { overwrite: true }), 'pull-tree');

  /*
    Process our JS from app and workers in advance of rollup
    because rollup cannot handle decorators or class properties
  */
  const parsedForRollup = debug(
    babel(pullTree, {
      throwUnlessParallelizable: true,
      plugins: [[Decorators, { decoratorsBeforeExport: false }], [ClassProps]],
    }),
    'babel-rollup'
  );

  /*
    Convert our worker files into stand-alone executables with the proper
    shell to communicate with the @skyrocketjs/service
  */
  const rollupTree = debug(
    rollupLaunchers(parsedForRollup, {
      cache: true, // likely need to make sure this is keyed to the output of the schemas
      schemaPath: tmpobj.name,
      nodeModulesPath: path.join(options.projectRoot, 'node_modules'),
      rollup: {
        // these options assigned later
        input: '',
        output: {},
        plugins: [
          nodeResolve({
            browser: true,
            modulesOnly: true,
          }),
        ],
      },
    }),
    'rollup'
  );

  const togetherAgainTree = merge([rollupTree, withSchemas]);
  const finalTree = debug(
    new SchemaSRIGenerator(togetherAgainTree, {
      schemaPath: tmpobj.name,
    }),
    'schemas-with-sri'
  );

  return merge([rollupTree, finalTree]);
};
