import Worker, { method, event } from "@skyrocket/worker";
import { aUtil, anotherUtil } from "./example-two/utils";
import util from "../app/a-util";

export default class WorkerOne extends Worker {
  @method
  fetchUsers(aNum) {
    return aUtil(anotherUtil(util(aNum)));
  }

  @event
  reload() {
    return this.fetchUsers(util(5) * anotherUtil(6) * aUtil(7));
  }
}
