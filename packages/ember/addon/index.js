import { getOwner } from "@ember/application";

export function worker(name) {
  return function decorator() {
    let worker;
    return {
      enumerable: false,
      writeable: false,
      configurable: false,
      get() {
        if (!worker) {
          worker = getOwner(this)
            .lookup("service:-workers")
            .getWorker(name);
        }
        return worker;
      }
    };
  };
}
