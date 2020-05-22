import { BroccoliRollupOptions } from 'broccoli-rollup';

import { launcherNameFromWorkerModule } from './launchers';
import gatherSchemas from './utils/gather-schemas';

const path = require('path');
const BroccoliRollup = require('broccoli-rollup');
const BroccoliFunnel = require('broccoli-funnel');
const BroccoliPlugin = require('broccoli-plugin');
const { Builder } = require('broccoli');
const merge = require('broccoli-merge-trees');
const TreeSync = require('tree-sync');

interface PluginOptions extends BroccoliRollupOptions {
  schemaPath: string;
}
interface WorkerPluginOptions extends PluginOptions {
  schemas: any;
  moduleName: string;
}

class BroccoliExpander extends BroccoliPlugin {
  constructor(node: any, options: PluginOptions) {
    super([node], options);
    this.options = options;
  }

  public async build() {
    let schemas = gatherSchemas(this.options.schemaPath);
    let inputPath = this.inputPaths[0];
    let pluginInstances = Object.keys(schemas).map(moduleName => {
      let opts = Object.assign({}, this.options, {
        schemas,
        moduleName,
      });
      return new WorkerCompiler(new BroccoliFunnel(inputPath), opts);
    });
    let merged = merge(pluginInstances);
    let builder = new Builder(merged);
    const outputTree = new TreeSync(builder.outputPath, this.outputPath);
    await builder.build();
    await outputTree.sync();
  }
}

class WorkerCompiler extends BroccoliRollup {
  constructor(node: any, options: WorkerPluginOptions) {
    options.name = 'WorkerCompiler';
    options.annotation = 'WorkerCompiler extends BroccoliRollup';
    super(node, options);
    this.moduleName = options.moduleName;
    this.schema = options.schemas[options.moduleName];
    this.rollupOptions.output = {
      dir: 'workers',
      format: 'es',
      exports: 'named',
    };
  }

  public async build(): Promise<void> {
    const inputs: { [key: string]: string } = {};

    let launcherName = launcherNameFromWorkerModule(this.moduleName);
    let fixedKey = launcherName.replace(/-/g, '_');
    inputs[fixedKey] = path.join(path.parse(this.schema.path).dir, launcherName);
    this.rollupOptions.input = inputs;
    await super.build();
  }
}

export default function rollupLaunchers(tree: any, options: PluginOptions) {
  return new BroccoliExpander(tree, options);
}
