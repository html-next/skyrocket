# @skyrocketjs/ember

A build chain for WebWorkers in Ember applications with intuitive ergonomics.

## Installation

> ```cli
> yarn add @skyrocketjs/ember @skyrocketjs/worker
> ```

## Usage

To use a worker in your application or addon, you first have to define
a new worker in a top-level `workers/` directory in your project.

> **Example 1**
>
> _workers/hello-world.js_
>
> ```js
> import Worker, { method } from '@skyrocketjs/worker';
>
> export default class HelloWorldWorker extends Worker {
>   @method
>   greet({ firstName, lastName }) {
>     return `Welcome ${firstName} ${lastName}!`;
>   }
> }
> ```

Read [🚀@skyrocketjs/worker](../worker/README.md) for full documentation of the features and APIs available to these workers.

Once you've defined a worker, you can use it from your application
by injecting the worker (for instance into a route, component, controller or service);

> **Example 2**
>
> _app/services/greeter.js_
>
> ```js
> import Service from '@ember/service';
> import { worker } from '@skyrocketjs/ember';
>
> export default class GreeterService extends Service {
>   @worker('hello-world') helloWorld;
>
>   async getGreeting(firstName, lastName) {
>     let greeting = await this.helloWorld.greet({ firstName, lastName });
>     return greeting;
>   }
> }
> ```

## License

This project is licensed under the [MIT License](LICENSE.md).
