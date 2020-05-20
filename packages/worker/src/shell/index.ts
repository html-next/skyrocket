import SkyrocketWorker from '../program';

const SkyrocketMessageIdentifier = '-srwm';
const SkyrocketErrorIdentifier = '-srwme';

type Field = [number, number | any[]];
type OptimizedSchema = any[];

type Payload = ['-srwm', string, any?, number?];
type Context = (Window & typeof globalThis) | MessagePort;

interface SkyrocketMessageEvent extends MessageEvent {
  data: Payload;
}

function createShell(Global: Context, schema: OptimizedSchema, WorkerMain: typeof SkyrocketWorker) {
  const channel = {
    onmessage: function(...args: any[]): void {},
    postMessage: function(a: any, b: any) {
      Global.postMessage(a, b);
    },
  };
  const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
  const worker = new WorkerMain(channel, { isWorker });
  let DEF_CACHE = Object.create(null);

  async function recieve(event: SkyrocketMessageEvent) {
    const data = event.data;
    if (Array.isArray(data) && data[0] === SkyrocketMessageIdentifier) {
      const fieldDef = getFieldDef(data[1]);
      (worker as unknown) as SkyrocketWorker;
      switch (fieldDef[0]) {
        case 1: // method
          try {
            const result = await exec(worker, data[1], data[2]);
            return send(result, data[3] as number);
          } catch (e) {
            const result = {
              message: e.message,
              stack: e.stack,
            };
            return send(result, data[3] as number);
          }
        case 2: // event
          return exec(worker, data[1], data[2]);
        case 3: // signal
          return exec(worker, data[1], data[2]);
        default:
          throw new Error(`Unknown field type`);
      }
    } else {
      channel.onmessage(...arguments);
    }
  }

  function getFieldDef(name: string): Field {
    let def = DEF_CACHE[name];
    if (def === undefined) {
      for (let i = 0; i < schema.length; i += 3) {
        let fieldType = schema[i];
        let fieldName = schema[i + 1];
        let fieldConfig = schema[i + 2];

        if (fieldName === name) {
          def = DEF_CACHE[name] = [fieldType, fieldConfig];
        }
      }
      if (!def) {
        throw new Error(`No such SkyrocketWorker field ${name}`);
      }
    }
    return def;
  }

  function send(data: any, id: number) {
    if (data instanceof Error) {
      Global.postMessage([SkyrocketMessageIdentifier, data, id]);
    } else {
      Global.postMessage([SkyrocketErrorIdentifier, data, id]);
    }
  }

  Global.onmessage = recieve;
}

function exec(worker: any, fieldName: string, args: any): any {
  if (args !== undefined) {
    return worker[fieldName](...args);
  }
  return worker[fieldName]();
}

export default function setupWorkerShell(Global: Context, schemaStr: string, WorkerMain: typeof SkyrocketWorker) {
  const schema: OptimizedSchema = JSON.parse(schemaStr);
  createShell(Global, schema, WorkerMain);
}
