import { Promise as RSVPPromise } from 'rsvp';

import Worker, { method } from '@skyrocketjs/worker';

// IE11 support
self.Promise = RSVPPromise;

export default class HelloWorldWorker extends Worker {
  @method
  async greet(name) {
    await RSVPPromise.resolve();
    return `Welcome ${name}!`;
  }
}
