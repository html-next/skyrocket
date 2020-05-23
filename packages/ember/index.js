'use strict';
const fs = require('fs');
const path = require('path');

const compileSchemas = require('@skyrocketjs/compiler');
const Funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');
const BroccoliDebug = require('broccoli-debug');

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.debugTree = BroccoliDebug.buildDebugCallback(`@skyrocketjs/ember`);
  },

  treeForApp(tree) {
    this.treeForPublic();
    if (this.workerTree) {
      let schemaTree = this.debugTree(
        new Funnel(this.workerTree, { srcDir: 'schemas', destDir: 'schemas', allowEmpty: true }),
        'final-schemas'
      );
      return this.debugTree(merge([tree, schemaTree]), 'addon-app-tree');
    }
    return tree;
  },
  treeForPublic() {
    let root = this.parent.root;
    let workersDir = path.join(root, 'workers');
    let appDir = path.join(root, 'app');
    this.workerTree = null;

    if (fs.existsSync(workersDir)) {
      let files = fs.readdirSync(workersDir);

      if (files.length) {
        let funneled = this.debugTree(
          merge([
            new Funnel(appDir, { destDir: 'app', allowEmpty: true }),
            new Funnel(workersDir, { destDir: 'workers', allowEmpty: true }),
          ]),
          'funneled'
        );
        let workerTree = this.debugTree(compileSchemas(funneled, { projectRoot: root }), 'worker-tree');
        this.workerTree = workerTree;
        return new Funnel(workerTree, {
          srcDir: 'workers',
          destDir: 'workers',
        });
      }
    }
  },
};
