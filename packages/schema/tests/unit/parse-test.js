const path = require('path');

const QUnit = require('qunit');

const fixtureBuilder = require('../helpers/fixture-builder');
const setupTest = require('../helpers/setup');
const iterate = require('../helpers/iterate');

const { module: testModule, test } = QUnit;

function collect(rootPath, cache) {
  iterate(rootPath, function(fullPath, segments) {
    let lastSegment;
    for (let segment of segments) {
      lastSegment = segment;
      cache[segment] = cache[segment] || {};
    }
    let nicePath = fullPath.replace(rootPath, '');

    cache[nicePath] = cache[lastSegment] = require(fullPath);
  });
}

testModule('Package Detection', async function(hooks) {
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
