interface SimpleChannel {
  onmessage(...args: any[]): void;
  postMessage(a: any, b: any): void;
}

export default class SkyrocketWorker {
  // true if the program is executing within a worker context
  // false if on the main thread
  public isWorker: boolean;
  public channel: SimpleChannel;

  constructor(channel: SimpleChannel, options: { isWorker: boolean }) {
    this.channel = channel;
    this.isWorker = options.isWorker;
  }
}
