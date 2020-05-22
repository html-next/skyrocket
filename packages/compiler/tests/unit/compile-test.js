const path = require('path');
const fs = require('fs');

const QUnit = require('qunit');

const fixtureBuilder = require('../helpers/fixture-builder');
const setupTest = require('../helpers/setup');
const iterateDirectoryFiles = require('../helpers/iterate');

const { module: testModule, test } = QUnit;

function collect(rootPath, cache) {
  let allPaths = [];
  iterateDirectoryFiles(rootPath, function(fullPath, segments) {
    allPaths.push(fullPath.replace(rootPath, ''));
    let lastSegment;
    let currentCache = cache;
    let lastCache;
    for (let segment of segments) {
      lastSegment = segment;
      currentCache[segment] = currentCache[segment] || {};
      lastCache = currentCache;
      currentCache = currentCache[segment];
    }

    lastCache[lastSegment] = fs.readFileSync(fullPath, { encoding: 'utf-8' });
  });
  return allPaths;
}

function iterateObjectValues(obj, callback, segments = []) {
  if (typeof obj === 'string') {
    callback(obj, segments);
  } else {
    Object.keys(obj).forEach(key => {
      iterateObjectValues(obj[key], callback, [...segments, key]);
    });
  }
}

function get(obj, segments) {
  let value = obj;
  for (let segment of segments) {
    if (!Object.prototype.hasOwnProperty.call(value, segment)) {
      return undefined;
    }
    value = value[segment];
  }
  return value;
}

testModule('Schema Compilation', async function(hooks) {
  setupTest(hooks);
  let builder;
  let expectedArtifacts = {};
  let builtArtifacts = {};
  let expectedFiles;
  let builtFiles;

  hooks.before(async function() {
    builder = fixtureBuilder();
    expectedFiles = collect(path.join(__dirname, '../fixtures/output/'), expectedArtifacts);
    await builder.build();
    builtFiles = collect(path.join(builder.outputPath, '/'), builtArtifacts);
  });

  hooks.after(async function() {
    await builder.discard();
  });

  test('We have only the expected files', async function(assert) {
    assert.deepEqual(builtFiles, expectedFiles, 'We built only what we expected');
  });

  test('We compiled optimized schema artifacts correctly', async function(assert) {
    iterateObjectValues(builtArtifacts.schemas, function(value, segments) {
      let matchingValue = get(expectedArtifacts.schemas, segments);
      assert.strictEqual(value, matchingValue, `schemas.${segments.join('.')} is what we expected`);
    });
  });

  test('We compiled worker scripts correctly', async function(assert) {
    iterateObjectValues(builtArtifacts.workers, function(value, segments) {
      let matchingValue = get(expectedArtifacts.workers, segments);
      assert.strictEqual(value, matchingValue, `workers.${segments.join('.')} is what we expected`);
    });
  });
});
