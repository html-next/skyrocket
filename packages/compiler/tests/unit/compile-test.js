const path = require('path');
const fs = require('fs');

const QUnit = require('qunit');

const fixtureBuilder = require('../helpers/fixture-builder');
const setupTest = require('../helpers/setup');
const iterate = require('../helpers/iterate');

const { module: testModule, test } = QUnit;

function collect(rootPath, cache) {
  iterate(rootPath, function(fullPath, segments) {
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
}

testModule('Schema Compilation', async function(hooks) {
  setupTest(hooks);
  let builder;
  let expectedArtifacts = {};
  let builtArtifacts = {};

  hooks.before(async function() {
    builder = fixtureBuilder();
    collect(path.join(__dirname, '../fixtures/output/'), expectedArtifacts);
    await builder.build();
    collect(path.join(builder.outputPath, ''), builtArtifacts);
  });

  hooks.after(async function() {
    await builder.discard();
  });

  test('We arent missing stuff', async function(assert) {
    assert.deepEqual(builtArtifacts, expectedArtifacts, 'We built only what we expected');
  });

  test('We compiled optimized schema artifacts correctly', async function(assert) {
    assert.deepEqual(builtArtifacts.schemas, expectedArtifacts.schemas, 'We built only what we expected');
  });

  test('We compiled worker scripts correctly', async function(assert) {
    assert.deepEqual(builtArtifacts.workers, expectedArtifacts.workers, 'We built only what we expected');
  });
});
