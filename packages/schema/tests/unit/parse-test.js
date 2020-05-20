const QUnit = require('qunit');

const { module: testModule, test } = QUnit;
const setupTest = require('../helpers/setup');

testModule('Package Detection', function(hooks) {
  setupTest(hooks);

  test('a test', function(assert) {
    assert.ok(true, 'We are running');
  });
});
