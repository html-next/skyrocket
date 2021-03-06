const path = require('path');

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

    lastCache[lastSegment] = require(fullPath);
  });
}

testModule('Schema Parsing', async function(hooks) {
  setupTest(hooks);
  let builder;
  let expectedArtifacts = {};
  let builtArtifacts = {};

  hooks.before(async function() {
    builder = fixtureBuilder();
    collect(path.join(__dirname, '../fixtures/output/parsed-schemas'), expectedArtifacts);
    await builder.build();
    collect(path.join(builder.outputPath, 'parsed-schemas'), builtArtifacts);
  });

  hooks.after(async function() {
    await builder.discard();
  });

  test('Artifacts built correctly (development)', async function(assert) {
    assert.deepEqual(builtArtifacts, expectedArtifacts, 'We built only what we expected');
  });
});
