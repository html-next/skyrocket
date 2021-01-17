import { getContext } from '@ember/test-helpers';

export function getWorker(name) {
  let { owner } = getContext();

  return owner.lookup('service:-workers').getWorker(name);
}
