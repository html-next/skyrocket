/**
 * The `method` decorator allows you to specify
 * a method callable by the main thread that
 * has a return value.
 *
 * It may take any number of args, as long as they
 *  are serializeable in JSON.
 *
 * The response must also be serializable.
 *
 * ```ts
 * class DataWorker extends SkyrocketWorker {
 *   @method
 *   fetchData(url, options) {
 *     return fetch(url).then(r => r.toJSON());
 *   }
 * }
 * ```
 *
 * @method signal
 * @public
 */
export function method() {
  return false;
}

/**
 * The `event` decorator allows you to specify
 * an event that can be subscribed to by the
 * main thread.
 *
 * ```ts
 * class DataWorker extends SkyrocketWorker {
 *   @event
 *   offline;
 * }
 * ```
 *
 * @method event
 * @public
 */
export function event() {
  return false;
}

/**
 * The `signal` decorator allows you to specify
 * a method callable by the main thread that
 * has no return value.
 *
 * Like `method` it may take args.
 *
 * ```ts
 * class DataWorker extends SkyrocketWorker {
 *   @signal
 *   clearData({ since }) {
 *     this.cache.clear();
 *   }
 * }
 * ```
 *
 * @method signal
 * @public
 */
export function signal() {
  return false;
}

// TODO async iteration with @iterable
// TODO byte streams with @stream
// TODO async byte iteration with @chunk
// TODO Atomics and SharedArrayBuffer

export default class SkyrocketWorker {}
