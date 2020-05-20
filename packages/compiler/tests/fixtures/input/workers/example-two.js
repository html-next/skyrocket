import Worker, { event, method } from '@skyrocketjs/worker';

import util from '../app/a-util';
import { anotherUtil, aUtil } from './example-two/utils';

export default class WorkerOne extends Worker {
  @method
  fetchUsers(aNum) {
    return aUtil(anotherUtil(util(aNum)));
  }

  @event()
  reload() {
    return this.fetchUsers(util(5) * anotherUtil(6) * aUtil(7));
  }
}
