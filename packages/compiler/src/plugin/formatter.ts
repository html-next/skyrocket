const BroccoliPlugin = require("broccoli-plugin");
import gatherSchemas, { Schema, Schemas } from "./utils/gather-schemas";
import { mkdirSync } from "fs";
const path = require("path");
const fs = require("fs");

function formatSchema(schema: Schema): string {
  return `export default '${JSON.stringify(schema)}'`;
}

function writeModules(moduleList: OptimizedSchemas, directory: string) {
  Object.keys(moduleList).forEach(moduleName => {
    const modulePath = path.join(directory, moduleName + ".js");
    console.log("writing", modulePath);
    fs.writeFileSync(modulePath, moduleList[moduleName], { encoding: "utf8" });
  });
}

export interface OptimizedSchemas {
  [moduleName: string]: string;
}

function buildSchemaModules(schemas: Schemas): OptimizedSchemas {
  const combinedSchema: OptimizedSchemas = {};
  Object.keys(schemas).forEach(key => {
    let schema = schemas[key];
    combinedSchema[key] = formatSchema(schema);
  });
  return combinedSchema;
}

export default class SchemaFormatter extends BroccoliPlugin {
  constructor(options: any) {
    super([], options);
    this.schemaPath = options.schemaPath;
    this.schemaOutputDirectory = path.join(
      "schemas",
      options.schemaOutputDirectory
    );
  }
  async build(): Promise<void> {
    const schemas = gatherSchemas(this.schemaPath);
    const moduleList = buildSchemaModules(schemas);
    const outputPath = path.join(this.outputPath, this.schemaOutputDirectory);

    mkdirSync(outputPath, { recursive: true });
    writeModules(moduleList, outputPath);
  }
}
