import { mkdirSync } from 'fs';

import gatherSchemas, { Field, Schema, Schemas } from './utils/gather-schemas';

const BroccoliPlugin = require('broccoli-plugin');
const path = require('path');
const fs = require('fs');

const FieldTypes: { [fieldType: string]: number } = {
  method: 1,
  event: 2,
  signal: 3,
};

function optimizeField(field: Field) {
  const type = FieldTypes[field.type];
  if (field.config && field.config.length) {
    return [type, field.key, field.config];
  }
  return [type, field.key, 0];
}
function optimizeFields(fields: Field[]): any[] {
  const optimized: any[] = [];
  fields.forEach(field => {
    optimized.push(...optimizeField(field));
  });
  return optimized;
}

function formatSchema(schema: Schema): string {
  const defs = schema.definitions;
  if (defs.length !== 1 || !defs[0].isDefaultExport) {
    throw new Error(`Invalid SkyrocketWorker Schema`);
  }
  let fields = optimizeFields(defs[0].fields);
  return `export default '${JSON.stringify(fields)}'`;
}

function writeModules(moduleList: OptimizedSchemas, directory: string) {
  Object.keys(moduleList).forEach(moduleName => {
    const modulePath = path.join(directory, moduleName + '.js');
    fs.writeFileSync(modulePath, moduleList[moduleName], { encoding: 'utf8' });
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
    this.schemaOutputDirectory = path.join('schemas', options.schemaOutputDirectory);
  }
  async build(): Promise<void> {
    const schemas = gatherSchemas(this.schemaPath);
    const moduleList = buildSchemaModules(schemas);
    const outputPath = path.join(this.outputPath, this.schemaOutputDirectory);

    mkdirSync(outputPath, { recursive: true });
    writeModules(moduleList, outputPath);
  }
}
