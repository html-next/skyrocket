const path = require("path");
import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";

type Schema = "*" | true | string[];
type Schemas = {
  [key: string]: Schema | undefined;
};

interface PluginOptions {
  opts: {
    schemaSourceFiles: Schemas;
    filePrefix: string;
  };
  file: {
    path: NodePath;
  };
}

interface BabelPlugin {
  name: string;
  visitor: Visitor<PluginOptions>;
}

export interface Babel {
  types: typeof BabelTypes;
}

/*
function shouldParseFile(fileName: string, filePrefix: string): boolean {
  return fileName.indexOf(filePrefix) === 0;
}
function hasSchemaForImport(importPath: string, schemas: Schemas): boolean {
  return importPath in schemas;
}
*/

// function schemaForImport(importPath, schemas): Schema {}

function skyrocketSchemaParser(babel: Babel): BabelPlugin {
  // let shouldParse = false;
  // let foundSchemas = {};
  // let hasFoundSchemas = false;
  let enterCycles = 0;
  let exitCycles = 0;

  return {
    name: "skyrocket-schema-parser",

    visitor: {
      Program: {
        enter(path: NodePath, state: PluginOptions) {
          enterCycles++;
          const config = state.opts;
          const { schemaSourceFiles, filePrefix } = config;
          console.log({
            schemaSourceFiles,
            filePrefix,
            enterCycles,
            exitCycles
          });
        },
        exit(path: NodePath, state: PluginOptions) {
          exitCycles++;
          const config = state.opts;
          const { schemaSourceFiles, filePrefix } = config;
          console.log({
            schemaSourceFiles,
            filePrefix,
            enterCycles,
            exitCycles
          });
        }
      }
    }
  };
}

skyrocketSchemaParser.baseDir = function() {
  return path.join(__dirname, "../");
};

module.exports = skyrocketSchemaParser;
