import Worker, { method } from '@skyrocketjs/worker';

export default class HelloWorldWorker extends Worker {
  @method
  async greet(name) {
    await Promise.resolve();
    return `Welcome ${name}!`;
  }
}
