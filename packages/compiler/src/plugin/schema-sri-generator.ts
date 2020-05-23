import { launcherNameFromWorkerModule } from './launchers';
import gatherSchemas from './utils/gather-schemas';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const BroccoliPlugin = require('broccoli-plugin');

interface PluginOptions {
  schemaPath: string;
}

export default class SchemaSRIGenerator extends BroccoliPlugin {
  constructor(node: any, options: PluginOptions) {
    super([node], options);
    this.schemaPath = options.schemaPath;
  }

  build() {
    let inputPath = this.inputPaths[0];
    let schemas = gatherSchemas(this.schemaPath);

    Object.keys(schemas).map(moduleName => {
      let launcherName = launcherNameFromWorkerModule(moduleName);
      let fixedLauncherName = launcherName.replace(/-/g, '_');
      let md5Hash = crypto.createHash('md5');
      let file = fs.readFileSync(path.join(inputPath, 'workers', fixedLauncherName + '.js'), 'utf-8');
      md5Hash.update(file);
      let hash = md5Hash.digest('hex');
      let schema = fs.readFileSync(path.join(inputPath, 'schemas/workers', moduleName + '.js'), 'utf-8');
      schema = schema.replace("export default '[", `export default '["${hash}",`);
      fs.mkdirSync(path.join(this.outputPath, 'schemas/workers'), { recursive: true });
      fs.writeFileSync(path.join(this.outputPath, 'schemas/workers', moduleName + '.js'), schema);
    });
  }
}
