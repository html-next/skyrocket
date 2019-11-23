const fs = require("fs");
const path = require("path");

export interface Schema {
  module: string;
  path: string;
}
export interface Schemas {
  [key: string]: Schema;
}

export default function gatherSchemas(schemaPath: string): Schemas {
  const workerPath = path.join(schemaPath, "workers");
  const dir = fs.readdirSync(workerPath);
  const schemas: Schemas = {};

  for (let i = 0; i < dir.length; i++) {
    const schema = require(path.join(workerPath, dir[i]));
    schemas[schema.module] = schema;
  }

  return schemas;
}
