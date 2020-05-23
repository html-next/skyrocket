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
    this._configuredMinify = false;
  },

  included() {
    this.configureMinifyOptions();
    return true;
  },

  configureMinifyOptions() {
    if (this._configuredMinify) {
      return;
    }
    /*
      ember-cli-uglify modifies our file during postprocessTree prior to
      broccoli-asset-rev calculating the sha to tag it with. This prevents
      us from pre-calculating the sha to add to the schema info so that
      we can build the url correctly to load the worker in production.

      so we turn off minification for our worker launchers. We will (soon)
      run uglify on our own tree in advance so as to not loose any optimizations.
    */
    this._configuredMinify = true;
    let host = this._findHost();
    let minifyOptions = (host.options['ember-cli-uglify'] = host.options['ember-cli-uglify'] || {});
    minifyOptions.exclude = minifyOptions.exclude || [];
    minifyOptions.exclude.push('workers/**__launcher.js');
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
