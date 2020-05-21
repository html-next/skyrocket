const QUnit = require('qunit');

const fixtureBuilder = require('../helpers/fixture-builder');
const setupTest = require('../helpers/setup');

const { module: testModule, test } = QUnit;

testModule('Package Detection', async function(hooks) {
  setupTest(hooks);
  let builder;

  hooks.beforeEach(async function() {
    builder = fixtureBuilder();
    await builder.build();
  });

  hooks.afterEach(async function() {
    await builder.discard();
  });

  test('a test', async function(assert) {
    assert.ok(true, 'We are running');
  });
});
