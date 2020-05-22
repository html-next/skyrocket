var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const SkyrocketMessageIdentifier = '-srwm';
const SkyrocketErrorIdentifier = '-srwme';
function createShell(Global, schema, WorkerMain) {
    const channel = {
        onmessage: function (...args) { },
        postMessage: function (a, b) {
            Global.postMessage(a, b);
        },
    };
    const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    const worker = new WorkerMain(channel, { isWorker });
    let DEF_CACHE = Object.create(null);
    function recieve(event) {
        return __awaiter(this, arguments, void 0, function* () {
            const data = event.data;
            if (Array.isArray(data) && data[0] === SkyrocketMessageIdentifier) {
                const fieldDef = getFieldDef(data[1]);
                switch (fieldDef[0]) {
                    case 1: // method
                        try {
                            const result = yield exec(worker, data[1], data[2]);
                            return send(result, data[3]);
                        }
                        catch (e) {
                            const result = {
                                message: e.message,
                                stack: e.stack,
                            };
                            return send(result, data[3]);
                        }
                    case 2: // event
                        return exec(worker, data[1], data[2]);
                    case 3: // signal
                        return exec(worker, data[1], data[2]);
                    default:
                        throw new Error(`Unknown field type`);
                }
            }
            else {
                channel.onmessage(...arguments);
            }
        });
    }
    function getFieldDef(name) {
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
    function send(data, id) {
        if (data instanceof Error) {
            Global.postMessage([SkyrocketMessageIdentifier, data, id]);
        }
        else {
            Global.postMessage([SkyrocketErrorIdentifier, data, id]);
        }
    }
    Global.onmessage = recieve;
}
function exec(worker, fieldName, args) {
    if (args !== undefined) {
        return worker[fieldName](...args);
    }
    return worker[fieldName]();
}
function setupWorkerShell(Global, schemaStr, WorkerMain) {
    const schema = JSON.parse(schemaStr);
    createShell(Global, schema, WorkerMain);
}

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
// TODO async iteration with @iterable
// TODO byte streams with @stream
// TODO async byte iteration with @chunk
// TODO Atomics and SharedArrayBuffer
class SkyrocketWorker {
}

function aUtil(a) {
  return a * a;
}

function aUtil$1(a) {
  return a * a * 2;
}
function anotherUtil(a) {
  return a * a * 3;
}

class WorkerOne extends SkyrocketWorker {
  fetchUsers(aNum) {
    return aUtil$1(anotherUtil(aUtil(aNum)));
  }

  reload() {
    return this.fetchUsers(aUtil(5) * anotherUtil(6) * aUtil$1(7));
  }

}

var schema = '[1,"fetchUsers",0,2,"reload",0]';

setupWorkerShell(global, schema, WorkerOne);
