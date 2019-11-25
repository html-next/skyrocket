import WorkerService from "@skyrocket/service";
import { getOwner, setOwner } from "@ember/application";

export default class EmberWorkerService extends WorkerService {
  static create(args) {
    const result = new this(args);
    const owner = getOwner(args);
    setOwner(result, owner);
    return result;
  }
}
