const BroccoliRollup = require("broccoli-rollup");
const fs = require("fs");
const path = require("path");
import { BroccoliRollupOptions } from "broccoli-rollup";

interface PluginOptions extends BroccoliRollupOptions {
  schemaPath: string;
}

module.exports = class WorkerCompiler extends BroccoliRollup {
  constructor(node: any, options: PluginOptions) {
    options.name = "WorkerCompiler";
    options.annotation = "WorkerCompiler extends BroccoliRollup";
    super(node, options);
    this.schemaPath = options.schemaPath;
    this.rollupOptions.output = {
      dir: "workers",
      format: "es",
      exports: "named"
    };
  }

  public async build(): Promise<void> {
    const schemas = gatherSchemas(this.schemaPath);
    const inputs: { [key: string]: string } = {};

    Object.keys(schemas).forEach(key => {
      // rollup bug doesnt allow for dashes in this key
      let fixedKey = key.replace(/-/g, "_");
      inputs[fixedKey] = schemas[key].path;
    });
    this.rollupOptions.input = inputs;
    await super.build();
  }
};

interface Schema {
  module: string;
  path: string;
}
function gatherSchemas(schemaPath: string): { [key: string]: Schema } {
  const workerPath = path.join(schemaPath, "workers");
  const dir = fs.readdirSync(workerPath);
  const schemas: { [key: string]: Schema } = {};

  for (let i = 0; i < dir.length; i++) {
    const schema = require(path.join(workerPath, dir[i]));
    schemas[schema.module] = schema;
  }

  return schemas;
}
