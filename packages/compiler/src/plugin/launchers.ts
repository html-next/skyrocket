import { mkdirSync } from 'fs';

import gatherSchemas, { Schema, Schemas } from './utils/gather-schemas';

const BroccoliPlugin = require('broccoli-plugin');
const path = require('path');
const fs = require('fs');

export function launcherNameFromWorkerModule(module: string): string {
  let launcherName = `${module}--launcher`;

  return launcherName;
}

function createLauncher(schema: Schema): { name: string; body: string } {
  const launcherName = launcherNameFromWorkerModule(schema.module);
  const launcherBody = `import setupWorkerShell from '@skyrocketjs/worker/build/shell';
import WorkerMain from './${schema.module}';
import schema from '../schemas/workers/${schema.module}';

setupWorkerShell(self, schema, WorkerMain);
`;

  return {
    name: launcherName,
    body: launcherBody,
  };
}

function writeModules(moduleList: LauncherScripts, directory: string) {
  Object.keys(moduleList).forEach(moduleName => {
    const { name, body } = moduleList[moduleName];
    const modulePath = path.join(directory, name + '.js');

    fs.writeFileSync(modulePath, body, { encoding: 'utf8' });
  });
}

export interface LauncherScripts {
  [moduleName: string]: { name: string; body: string };
}

function buildWorkerLaunchers(schemas: Schemas): LauncherScripts {
  const launcherScripts: LauncherScripts = {};
  Object.keys(schemas).forEach(key => {
    let schema = schemas[key];
    launcherScripts[key] = createLauncher(schema);
  });
  return launcherScripts;
}

export default class Launchers extends BroccoliPlugin {
  constructor(options: any) {
    super([], options);
    this.schemaPath = options.schemaPath;
    this.outputDirectory = 'workers';
  }
  async build(): Promise<void> {
    const schemas = gatherSchemas(this.schemaPath);
    const moduleList = buildWorkerLaunchers(schemas);
    const outputPath = path.join(this.outputPath, this.outputDirectory);

    mkdirSync(outputPath, { recursive: true });
    writeModules(moduleList, outputPath);
  }
}
