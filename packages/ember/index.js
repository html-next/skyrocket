'use strict';
const fs = require('fs');
const path = require('path');

const compileWorkers = require('@skyrocketjs/compiler');
const merge = require('broccoli-merge-trees');
const BroccoliDebug = require('broccoli-debug');

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.debugTree = BroccoliDebug.buildDebugCallback(`@skyrocketjs/ember`);
    this._configuredMinify = false;
    this.hasCalculatedForCycle = false;
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

  buildWorkerOptions() {
    // get babel config from parent
    let babelOptions = this.parent.findAddonByName('ember-cli-babel').buildBabelOptions();
    // get worker options from parent
    let parentOptions = (this.parent.options = this.parent.options || {});
    let compilerOptions = parentOptions.skyrocketjs || {};
    let parentRoot = this.parent.root;

    compilerOptions.importPaths = compilerOptions.importPaths || [];
    compilerOptions.directoryToCompile = compilerOptions.directoryToCompile || 'workers';
    compilerOptions.node_modules_path = compilerOptions.node_modules_path || path.join(parentRoot, 'node_modules');

    return {
      babelOptions,
      compilerOptions,
      parentRoot,
    };
  },

  treeForWorkers() {
    // since we call this from both treeForApp and treeForPublic
    // we only want to recalc every other time we are called.
    if (this.hasCalculatedForCycle === true) {
      this.hasCalculatedForCycle = false;
      return this.workerTrees;
    }
    this.hasCalculatedForCycle = true;

    // if the parent project doesn't have workers
    // we don't want to pay the cost of this tree
    let root = this.parent.root;
    let workersDir = path.join(root, 'workers');
    let hasWorkersDir = fs.existsSync(workersDir);
    let hasWorkers = hasWorkersDir && fs.readdirSync(workersDir).length;

    if (!hasWorkers) {
      this.workerTrees = null;
      return;
    }

    this.workerTrees = compileWorkers(this.buildWorkerOptions());
  },

  treeForApp(tree) {
    this.treeForWorkers();
    if (this.workerTrees) {
      return merge([tree, this.workerTrees.schemas]);
    }
    return tree;
  },

  treeForPublic() {
    this.treeForWorkers();
    if (this.workerTrees) {
      return this.workerTrees.workers;
    }
    return;
  },
};
