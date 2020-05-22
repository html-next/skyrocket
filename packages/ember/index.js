'use strict';
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
    let schemaTree = this.debugTree(
      new Funnel(this.workerTree, { srcDir: 'schemas', destDir: 'schemas', allowEmpty: true }),
      'final-schemas'
    );
    return this.debugTree(merge([tree, schemaTree]), 'addon-app-tree');
  },
  treeForPublic() {
    let root = this.parent.root;
    let funneled = this.debugTree(
      merge([
        new Funnel(root, { srcDir: 'app', destDir: 'app' }),
        new Funnel(root, { srcDir: 'workers', destDir: 'workers' }),
      ]),
      'funneled'
    );
    let workerTree = this.debugTree(compileSchemas(funneled, { projectRoot: root }), 'worker-tree');
    this.workerTree = workerTree;
    return new Funnel(workerTree, {
      srcDir: 'workers',
      destDir: 'workers',
    });
  },
};
