import { BroccoliRollupOptions } from 'broccoli-rollup';

import gatherSchemas from './utils/gather-schemas';

const BroccoliRollup = require('broccoli-rollup');

interface PluginOptions extends BroccoliRollupOptions {
  schemaPath: string;
}

export default class WorkerCompiler extends BroccoliRollup {
  constructor(node: any, options: PluginOptions) {
    options.name = 'WorkerCompiler';
    options.annotation = 'WorkerCompiler extends BroccoliRollup';
    super(node, options);
    this.schemaPath = options.schemaPath;
    this.rollupOptions.output = {
      dir: 'workers',
      format: 'es',
      exports: 'named',
    };
  }

  public async build(): Promise<void> {
    const schemas = gatherSchemas(this.schemaPath);
    const inputs: { [key: string]: string } = {};

    Object.keys(schemas).forEach(key => {
      // rollup bug doesnt allow for dashes in this key
      let fixedKey = key.replace(/-/g, '_');
      inputs[fixedKey] = schemas[key].path;
    });
    this.rollupOptions.input = inputs;
    await super.build();
  }
}
