![npm (tag)](https://img.shields.io/npm/v/@skyrocketjs/ember/latest?color=%2355dd55&style=flat-square)
![npm (tag)](https://img.shields.io/npm/v/@skyrocketjs/ember/lts?color=%233333ff&style=flat-square)
![npm (tag)](https://img.shields.io/npm/v/@skyrocketjs/ember/beta?color=%235ff33ff&style=flat-square)
![npm (tag)](https://img.shields.io/npm/v/@skyrocketjs/ember/canary?color=%23ffbb55&style=flat-square)
<br>
![CI](https://github.com/html-next/skyrocket/workflows/CI/badge.svg?branch=master)

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

- [🚀🐹@skyrocketjs/ember](./packages/ember/README.md)

An ember-addon which enables your ember-app or ember-addon to have workers built with
`@skyrocketjs/worker` located in a top-level `workers/` directory that are useable by
consuming apps via service-like injection.

Configuration is as easy as adding this package to your app or addon dependencies.

In `Fastboot`, each app instance will get it's own unique worker instances that run
as their own [node worker](https://nodejs.org/api/worker_threads.html). These workers
will be torn down when the app instance is destroyed.

In `testing`, each app instance will get it's own unique `WebWorker` instances. `SharedWorkers`
will be instantiated as `WebWorkers` to ensure encapsulation.

These workers will be torn down when the app instance is destroyed.

- [🚀@skyrocketjs/worker](./packages/worker/README.md)

Provides decorators and base classes for creating both `WebWorkers` and `SharedWorkers`
that abstract away the need for authoring main-thread code or using `postMessage`.

Communication is driven by async APIs that work naturally with `Promise` and `async...await`.

- [🚀@skyrocketjs/schema](./packages/schema/README.md)

A BabelPlugin which parses schema information based on config from encountered classes.

This is reusable by many projects, but won't need to be configured directly for users
of `@skyrocketjs/ember`.

- [🚀@skyrocketjs/service](./packages/service/README.md)

Service wrapper for instantiating workers on the main thread. Meant to be generic but tied
to `Ember` in the current `alpha` while a plan for either synchronous or asynchronous dynamic
imports is devised. The instantiated workers use the schemas produced by for workers built
with `@skyrocketjs/worker` to provide async APIs and event listenting.

- [🚀@skyrocketjs/compiler](./packages/compiler/README.md)

A BroccoliPlugin which takes compiled schemas from `@skyrocketjs/schema` for workers built
with `@skyrocketjs/worker` and produces runnable worker scripts.

This is reusable by many projects, but won't need to be configured directly for users
of `@skyrocketjs/ember`.
