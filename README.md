# 🚀 Skyrocket

The web needs more zero-cost-abstractions and parallelism. This is a project to help with that.

## Overview

This project is a monorepo using `lerna` and `yarn workspaces` to publish multiple related
packages to `npm`. This directory is unpublished.

The individual published packages are located in the `packages/` and have `private: false`
in their `package.json`. Unpublished packages used for testing or dev-infra are prefixed
with `unpublished_`

To learn more about the individual packages, visit the corresponding package `README`.

## Published Packages

- [🚀🐹@skyrocket/ember](./packages/ember/README.md)

An ember-addon which enables your ember-app or ember-addon to have workers built with
`@skyrocket/worker` located in a top-level `workers/` directory that are useable by
consuming apps via service-like injection.

Configuration is as easy as adding this package to your app or addon dependencies.

In `Fastboot`, each app instance will get it's own unique worker instances that run
as their own [node worker](https://nodejs.org/api/worker_threads.html). These workers
will be torn down when the app instance is destroyed.

In `testing`, each app instance will get it's own unique `WebWorker` instances. `SharedWorkers`
will be instantiated as `WebWorkers` to ensure encapsulation.

These workers will be torn down when the app instance is destroyed.

- [🚀@skyrocket/worker](./packages/worker/README.md)

Provides decorators and base classes for creating both `WebWorkers` and `SharedWorkers`
that abstract away the need for authoring main-thread code or using `postMessage`.

Communication is driven by async APIs that work naturally with `Promise` and `async...await`.

- [🚀@skyrocket/schema](./packages/schema/README.md)

A BabelPlugin which parses schema information based on config from encountered classes.

This is reusable by many projects, but won't need to be configured directly for users
of `@skyrocket/ember`.

- [🚀@skyrocket/compiler](./packages/compiler/README.md)

A BroccoliPlugin which takes compiled schemas from `@skyrocket/schema` for workers built
with `@skyrocket/worker` and produces runnable worker scripts.

This is reusable by many projects, but won't need to be configured directly for users
of `@skyrocket/ember`.
