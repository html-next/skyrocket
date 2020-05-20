const fs = require('fs');
const path = require('path');

export interface Schema {
  module: string;
  path: string;
  definitions: Def[];
}
export interface Schemas {
  [key: string]: Schema;
}
export interface Def {
  type: string;
  name: string;
  isDefaultExport: boolean;
  fields: Field[];
}
export interface Field {
  key: string;
  type: string;
  config: any[];
}

export default function gatherSchemas(schemaPath: string): Schemas {
  const workerPath = path.join(schemaPath, 'workers');
  const dir = fs.readdirSync(workerPath);
  const schemas: Schemas = {};

  for (let i = 0; i < dir.length; i++) {
    const schema = require(path.join(workerPath, dir[i]));
    schemas[schema.module] = schema;
  }

  return schemas;
}
