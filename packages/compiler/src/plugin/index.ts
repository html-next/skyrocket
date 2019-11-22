const BroccoliPlugin = require("broccoli-plugin");
const fs = require("fs");
const path = require("path");
import { sync as symlinkOrCopy } from "symlink-or-copy";
import RollupHelper from "broccoli-rollup/dist/rollup-helper";
import { nodeModulesPath, normalizeArray } from "broccoli-rollup/dist/utils";
import { all } from "rsvp";

const mkdirSync = fs.mkdirSync;

type InputOptions = import("rollup").InputOptions;
type OutputOptions = import("rollup").OutputOptions;

interface BroccoliRollupOptions {
  annotation?: string;
  name?: string;
  entries: string[];
  rollup: RollupOptions;
  cache?: boolean;
  nodeModulesPath?: string;
}

type RollupOptions = InputOptions & {
  output: OutputOptions | OutputOptions[];
};

module.exports = class BroccoliRollup extends BroccoliPlugin {
  public rollupOptions: RollupOptions;
  public cache: boolean;
  public nodeModulesPath: string;
  public entries: string[];

  private _rollupHelpers: RollupHelper[] | undefined;

  constructor(node: any, options: BroccoliRollupOptions) {
    super([node], {
      annotation: options.annotation,
      name: options.name,
      persistentOutput: true
    });
    this.rollupOptions = options.rollup;
    this.entries = options.entries || [];
    this.cache =
      options.rollup.cache === false ? false : options.cache !== false;

    this._rollupHelpers = undefined;

    if (
      options.nodeModulesPath !== undefined &&
      !path.isAbsolute(options.nodeModulesPath)
    ) {
      throw new Error(
        `nodeModulesPath must be fully qualified and you passed a relative path`
      );
    }

    this.nodeModulesPath =
      options.nodeModulesPath || nodeModulesPath(process.cwd());
  }

  public async build(): Promise<void> {
    let rollupHelpers = this._rollupHelpers;

    if (rollupHelpers === undefined) {
      if (this.nodeModulesPath) {
        symlinkOrCopy(this.nodeModulesPath, `${this.cachePath}/node_modules`);
      }

      const buildPath = `${this.cachePath}/build`;
      mkdirSync(buildPath);

      let inputPath = this.inputPaths[0];
      this._rollupHelpers = rollupHelpers = [];

      for (let i = 0; i < this.entries.length; i++) {
        let entry = this.entries[i];
        let entryOptions = {
          input: entry,
          output: [
            {
              file: entry,
              format: "es",
              exports: "named"
            }
          ]
        };
        let options = Object.assign({}, this.rollupOptions, entryOptions);
        rollupHelpers[i] = new RollupHelper(
          inputPath,
          buildPath,
          this.outputPath,
          options,
          normalizeArray<OutputOptions>(options.output),
          this.cache
        );
      }
    }

    await all(rollupHelpers.map(h => h.build()));
  }
};
