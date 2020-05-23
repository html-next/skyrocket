import Service from '@ember/service';

import { module, test } from 'qunit';

import { setupTest } from 'ember-qunit';

import { worker } from '@skyrocketjs/ember';

module('Hello World Worker', function(hooks) {
  setupTest(hooks);

  test('We can launch the worker', async function(assert) {
    this.owner.register(
      'service:test',
      class TestService extends Service {
        @worker('hello-world') helloWorld;
      }
    );
    let service = this.owner.lookup('service:test');
    let greeting = await service.helloWorld.greet('Chris');

    assert.strictEqual(greeting, 'Welcome Chris!', 'We can properly greet!');

    greeting = await service.helloWorld.greet('Chris & Wesley');

    assert.strictEqual(greeting, 'Welcome Chris & Wesley!', 'We can properly greet multiple times');
  });
});
