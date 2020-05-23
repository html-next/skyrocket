import { getOwner, setOwner } from '@ember/application';
import { DEBUG } from '@glimmer/env';

import WorkerService from '@skyrocketjs/service';

export default class EmberWorkerService extends WorkerService {
  useSRI = !DEBUG;
  static create(args) {
    const result = new this(args);
    const owner = getOwner(args);
    setOwner(result, owner);
    return result;
  }
}
