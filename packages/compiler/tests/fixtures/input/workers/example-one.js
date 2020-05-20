import Worker, { event, method } from '@skyrocketjs/worker';

export default class WorkerOne extends Worker {
  @method
  fetchUsers() {}

  @event
  reload() {}
}
