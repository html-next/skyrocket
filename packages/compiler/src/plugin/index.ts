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

interface BroccoliSchemaCompilerOptions {
  parentRoot: string;
  babelOptions?: any;
  isProduction?: boolean;
  compilerOptions: {
    directoryToCompile: string;
    node_modules_path: string;
    importPaths: string[];
    enableChunks?: boolean;
  };
}

function configurePlugins(babelOptions: any, plugins: any[]): any {
  let babelPlugins = (babelOptions.plugins = babelOptions.plugins || []);
  plugins.forEach(plugin => {
    let pluginPath = plugin[0];
    let pluginOptions = plugin[1] || {};

    for (let i = 0; i < babelPlugins.length; i++) {
      let existingPlugin = babelPlugins[i];
      if (typeof existingPlugin === 'string') {
        if (existingPlugin === pluginPath) {
          babelPlugins[i] = plugin;
          return;
        }
      }
      if (Array.isArray(existingPlugin) && existingPlugin[0] === pluginPath) {
        existingPlugin[1] = Object.assign(existingPlugin[1] || {}, pluginOptions);
        return;
      }
    }

    // plugin not found
    babelPlugins.push(plugin);
  });

  let disallowedPlugins = [
    '@babel/plugin-transform-modules-amd',
    'babel-plugin-module-resolver',
    'babel-plugin-ember-modules-api-polyfill',
  ];

  // remove the AMD plugin
  for (let i = 0; i < babelPlugins.length; i++) {
    let existingPlugin = babelPlugins[i];
    let pluginName =
      typeof existingPlugin === 'string' ? existingPlugin : Array.isArray(existingPlugin) ? existingPlugin[0] : '';

    for (let name of disallowedPlugins) {
      if (pluginName.indexOf(name) !== -1) {
        babelPlugins.splice(i, 1);
        i -= 1;
        break;
      }
    }
  }

  console.log(babelOptions);
  return babelOptions;
}

function enforceTrailingSlash(str: string): string {
  if (str.charAt(str.length - 1) !== '/') {
    return str + '/';
  }
  return str;
}

module.exports = function compile(options: BroccoliSchemaCompilerOptions) {
  const tmpobj = tmp.dirSync();
  /*
    Grab all the other sources for code for workers (other than node_modules)
  */
  let baseTree;
  if (options.compilerOptions.importPaths.length) {
    baseTree = debug(
      merge(
        options.compilerOptions.importPaths.map(dir => {
          return new Funnel(path.join(options.parentRoot, dir), { destDir: dir, allowEmpty: true });
        })
      ),
      `compiler-input-trees`
    );
  }

  /*
    Grab just the files in options.directoryToCompile for schema parsing
  */
  const workerTree = debug(
    new Funnel(path.join(options.parentRoot, options.compilerOptions.directoryToCompile), {
      destDir: options.compilerOptions.directoryToCompile,
    }),
    'worker-files-for-schema-compilation'
  );

  /*
   Parse out the schema info into tmpobj.name directory
  */
  const parsedSchemas = debug(
    babel(workerTree, {
      throwUnlessParallelizable: true,
      plugins: [
        [
          SchemaPlugin,
          {
            schemaSourceFiles: {
              '@skyrocketjs/worker': true,
            },
            filePrefix: enforceTrailingSlash(options.compilerOptions.directoryToCompile),
            outputPath: tmpobj.name,
            removeDecorators: true,
          },
        ],
        [ParseDecorators, { legacy: true }],
      ],
    }),
    'files-post-parsing-for-schema'
  );

  /*
    Generate the schema modules
  */
  const withSchemas = debug(
    new Formatter({
      schemaPath: tmpobj.name,
      schemaOutputDirectory: options.compilerOptions.directoryToCompile,
    }),
    'generated-schema-modules'
  );

  /*
    Generate worker launcher scripts
  */
  const withLaunchers = debug(
    new Launchers({
      schemaPath: tmpobj.name,
    }),
    'generated-launcher-modules'
  );

  /*
    Our schema scan has to be "pulled" during broccoli compilation
    in order to run, so we merge it back in.
  */
  const pullTree = debug(
    merge([baseTree, workerTree, parsedSchemas, withSchemas, withLaunchers].filter(Boolean), { overwrite: true }),
    'pull-tree'
  );

  /*
    Process our JS from app and workers in advance of rollup
    because rollup cannot handle decorators or class properties

    TODO use the passed in babel config
  */
  const babelConfig = configurePlugins(Object.assign(options.babelOptions || {}, { throwUnlessParallelizable: true }), [
    [Decorators, { legacy: true }],
    [ClassProps, { loose: true }],
  ]);
  const parsedForRollup = debug(babel(pullTree, babelConfig), 'babel-processed-files-for-worker-rollup');

  /*
    Convert our worker files into stand-alone executables with the proper
    shell to communicate with the @skyrocketjs/service

    TODO enable chunks. Chunks are more efficient for the build pipeline AND
    more efficient at runtime; however, they will require rewriting `import` to `importScript`
    including accounting for SRI fingerprints in production

    TODO minify rollup output in production
  */
  const rollupTree = debug(
    rollupLaunchers(parsedForRollup, {
      cache: true, // likely need to make sure this is keyed to the output of the schemas
      schemaPath: tmpobj.name,
      nodeModulesPath: options.compilerOptions.node_modules_path,
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
    'rollup-built-workers'
  );

  /*
    Workers do not have integrity features (we could maybe build our own SRI solution)
    but we do the minimum good thing here by allowing our assets to be revisioned with
    a checksum fingerprint.

    This means our worker service on the main thread will need to know these checksums,
    so we insert them into the compiled schemas as the first argument.
  */
  const togetherAgainTree = merge([rollupTree, withSchemas]);
  const finalSchemas = debug(
    new SchemaSRIGenerator(togetherAgainTree, {
      schemaPath: tmpobj.name,
    }),
    'schemas-with-sri'
  );

  return {
    workers: rollupTree,
    schemas: finalSchemas,
  };
};
