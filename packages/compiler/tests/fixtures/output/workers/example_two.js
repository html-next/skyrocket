import Worker from '@skyrocketjs/worker';

function aUtil(a) {
  return a * a;
}

function aUtil$1(a) {
  return a * a * 2;
}
function anotherUtil(a) {
  return a * a * 3;
}

class WorkerOne extends Worker {
  fetchUsers(aNum) {
    return aUtil$1(anotherUtil(aUtil(aNum)));
  }

  reload() {
    return this.fetchUsers(aUtil(5) * anotherUtil(6) * aUtil$1(7));
  }

}

export default WorkerOne;
