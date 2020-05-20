import { getOwner, setOwner } from '@ember/application';

import WorkerService from '@skyrocketjs/service';

export default class EmberWorkerService extends WorkerService {
  static create(args) {
    const result = new this(args);
    const owner = getOwner(args);
    setOwner(result, owner);
    return result;
  }
}
