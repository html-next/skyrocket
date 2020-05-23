import Worker, { method } from '@skyrocketjs/worker';
import Promise from 'rsvp';

export default class HelloWorldWorker extends Worker {
  @method
  async greet(name) {
    await Promise.resolve();
    return `Welcome ${name}!`;
  }
}
