/* global Ember requirejs */
let messageId = 0;
const SkyrocketMessageIdentifier = '-srwm';
const SkyrocketErrorIdentifier = '-srwme';

declare global {
  export const Ember: any;
  export const requirejs: any;
}

type OptimizedSchema = any[];
type Payload = ['-srwm' | '-srwme', any?, number?];

function syncImportSchema(name: string) {
  // The web does not have a dynamic sync import
  //  so we are forced to do something annoying
  const app = Ember.Namespace.NAMESPACES[1] || Ember.Namespace.NAMESPACES[0];
  const appName = app.modulePrefix || app.name;
  let moduleName = `${appName}/schemas/workers/${name}`;
  return requirejs(moduleName).default;
}

function getSchema(name: string): OptimizedSchema {
  const schema: string = syncImportSchema(name);
  return JSON.parse(schema) as OptimizedSchema;
}

type Signal = (...args: any[]) => void;
type Method = (...args: any[]) => Promise<unknown>;

function signal(name: string, config: 0 | any[]): Signal {
  return function(...data: any[]): void {
    this.worker.postMessage([SkyrocketMessageIdentifier, name, data]);
  };
}

function method(name: string, config: 0 | any[]): Method {
  return function(...data: any[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let id = messageId++;
      this.worker.postMessage([SkyrocketMessageIdentifier, name, data, id]);
      this.__pending.set(id, { resolve, reject });
    });
  };
}

type Deferred = {
  resolve: typeof Promise.resolve;
  reject: typeof Promise.reject;
};
type Callback = (event: unknown) => void;

interface SkyrocketMessageEvent extends MessageEvent {
  data: Payload;
}

async function recieve(worker: AsyncWorker, event: SkyrocketMessageEvent) {
  const data = event.data;
  if ((Array.isArray(data) && data[0] === SkyrocketMessageIdentifier) || data[0] === SkyrocketErrorIdentifier) {
    // handle method returns
    if (data[2] !== undefined) {
      let deferred = worker.__pending.get(data[2]);
      if (!deferred) {
        throw new Error(`Unexpected promise return`);
      }
      if (data[0] === SkyrocketErrorIdentifier) {
        deferred.reject(data[1]);
      } else {
        deferred.resolve(data[1]);
      }
      worker.__pending.delete(data[2]);
      return;
    }
    // TODO nicer fail case
    let events = worker.__events[data[1].name]!;
    events.handlers.forEach(cb => cb(event.data));
  } else {
    if (typeof worker.onmessage === 'function') {
      worker.onmessage(...arguments);
    }
  }
}

type VMN = Exclude<string, 'destroy' | '__pending'>;
type PendingRequests = Map<number, Deferred>;
type ValidEvents = {
  [fieldName: string]: { config: 0 | any[]; handlers: Set<Callback> } | undefined;
};
type OnMessage = (...args: any[]) => void;

function underscore(str: string): string {
  return str.replace(/-/g, '_');
}

class AsyncWorker {
  public __pending: PendingRequests = new Map<number, Deferred>();
  public __events: ValidEvents = Object.create(null);
  public onmessage?: OnMessage;
  public url: string;
  public worker: Worker;
  private _sriHash: string;

  [methodName: string]: any | Method | Signal;

  constructor(private _name: string, private _schema: OptimizedSchema, private _useSRI = false) {
    this._sriHash = _schema.shift();
    this.url = `/workers/${underscore(_name)}__launcher${_useSRI ? '-' + this._sriHash : ''}.js`;
    // TODO read into worker config options
    this.worker = new Worker(this.url);
    for (let i = 0; i < _schema.length; i += 3) {
      let fieldType = _schema[i] as number;
      let fieldName = _schema[i + 1] as string;
      let fieldConfig = _schema[i + 2] as 0 | any[];

      switch (fieldType) {
        case 1: // method
          // TODO reduce this limitation by using a WeakMap
          if (
            fieldName === 'destroy' ||
            fieldName === 'on' ||
            fieldName === 'off' ||
            fieldName === 'onmessage' ||
            fieldName === 'postMessage' ||
            fieldName === 'url' ||
            fieldName === 'worker' ||
            fieldName === '__pending' ||
            fieldName === '__events' ||
            fieldName === '_name' ||
            fieldName === '_schema'
          ) {
            throw new Error('disallowed method name');
          }
          this[fieldName] = method(fieldName, fieldConfig);
          break;
        case 3: // signal
          // TODO reduce this limitation by using a WeakMap
          if (
            fieldName === 'destroy' ||
            fieldName === 'on' ||
            fieldName === 'off' ||
            fieldName === 'onmessage' ||
            fieldName === 'postMessage' ||
            fieldName === 'url' ||
            fieldName === 'worker' ||
            fieldName === '__pending' ||
            fieldName === '__events' ||
            fieldName === '_name' ||
            fieldName === '_schema'
          ) {
            throw new Error('disallowed method name');
          }
          this[fieldName] = signal(fieldName, fieldConfig);
          break;
        case 2: // event
          this.__events[fieldName] = {
            config: fieldConfig,
            handlers: new Set(),
          };
          break;
        default:
          throw new Error(`Unknown field type`);
      }
    }

    this.worker.onmessage = e => {
      recieve(this, e);
    };
  }

  postMessage(a: any, b: any) {
    this.worker.postMessage(a, b);
  }

  on(eventName: string, cb: Callback): void {
    let events = this.__events[eventName];
    if (!events) {
      throw new Error(`unknown event`);
    }
    events.handlers.add(cb);
  }

  off(eventName: string, cb?: Callback): void {
    let events = this.__events[eventName];
    if (!events) {
      throw new Error(`unknown event`);
    }
    if (cb) {
      events.handlers.delete(cb);
    } else {
      events.handlers.clear();
    }
  }

  destroy() {
    this.worker.terminate();
    this.__pending = (null as unknown) as PendingRequests;
    this.__events = (null as unknown) as ValidEvents;
    this.onmessage = (null as unknown) as OnMessage;
  }
}

export default class SkyrocketService {
  public useSRI: boolean = false;
  private _workers: { [name: string]: AsyncWorker } = Object.create(null);
  getWorker(name: string): AsyncWorker {
    let worker = this._workers[name];
    if (worker === undefined) {
      const schema = getSchema(name);
      worker = this._workers[name] = new AsyncWorker(name, schema, this.useSRI);
    }
    return worker;
  }
}
