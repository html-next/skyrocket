import Worker, { method, event } from "@skyrocket/worker";

export default class WorkerOne extends Worker {
  @method
  fetchUsers() {}

  @event
  reload() {}
}
