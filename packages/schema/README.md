# 🚀 @skyrocketjs/schema

Babel AST plugin for constructing schemas from decorators and classes

If using `@skyrocketjs/ember` or `@skyrocketjs/compiler`
you do not need to install or configure this plugin
unless you have additional schema info you wish to process and use.

## Overview

This Babel plugin extracts static `schema` information about usage
of imports and decorators from a configured "schema source" from
modules within a configured path.

Basically, it does things like parse this:

```js
import Model, { attribute as attr, belongsTo } from '@ember-data/model';

export default class User extends Model {
  @attr firstName;
  @attr() lastName;
  @attr('number', { defaultValue: 0 }) age;
  @belongsTo user;
  @belongsTo('user') friend;
  @belongsTo('user', { async: false, polymorphic: true, inverse: null })
  bestFriend;
}
```

Into this:

```json
{
  "module": "has-schema",
  "path": "workers/has-schema.js",
  "definitions": [
    {
      "type": "@ember-data/model",
      "name": "User",
      "isDefaultExport": false,
      "fields": [
        {
          "key": "firstName",
          "type": "attr",
          "config": []
        },
        {
          "key": "lastName",
          "type": "attr",
          "config": []
        },
        {
          "key": "age",
          "type": "attr",
          "config": [
            "number",
            {
              "defaultValue": 0
            }
          ]
        },
        {
          "key": "user",
          "type": "belongsTo",
          "config": []
        },
        {
          "key": "friend",
          "type": "belongsTo",
          "config": ["user"]
        },
        {
          "key": "bestFriend",
          "type": "belongsTo",
          "config": [
            "user",
            {
              "async": false,
              "polymorphic": true,
              "inverse": null
            }
          ]
        }
      ]
    }
  ]
}
```

## Installation

```cli
yarn add @skyrocketjs/schema @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties
```

Note: usage of `@babel/plugin-proposal-decorators` and `@babel/plugin-proposal-class-properties` is required.

## Usage

Add `@skyrocket/schema` into your list of babel plugins.

For instance, using a `babel.config.js` file you might do this:

```js
const path = require('path');
const Decorators = require.resolve('@babel/plugin-proposal-decorators');
const ClassProps = require.resolve('@babel/plugin-proposal-class-properties');
const SchemaPlugin = require.resolve('@skyrocketjs/schema');

const presets = [];
const plugins =
        SchemaPlugin,
        {
          schemaSourceFiles: {
            '@ember-data/model': true,
          },
          filePrefix: 'models/',
          outputPath: path.resolve('./schemas/'),
        },
      ],
      [Decorators, { decoratorsBeforeExport: true }],
      [ClassProps]
];

module.exports = { presets, plugins };
```

## Options

The following options are available to this plugin:

- `schemaSourceFiles` _dictionary<moduleName: true|'\*'|string[]>_

  When a file matches `filePrefix`, the usage of imports specified within this list of modules will be treated as `static schema`.

  Individual module sources can be configured for either all named imports to be treated as schema (`true` or `"*"`) or specific named imports only (`["foo", "bar"]`).

  The `default` import is always used as the "base" type for detecting classes making use of a schema.

  For instance, if we were to configure schemaSourceFiles with:

  ```js
  {
    "schemaSourceFiles": {
      "@ember-data/model": ["attr"]
    }
  }
  ```

  Then when we encounter the following:

  ```js
  import Model, { attr, belongsTo } from '@ember-data/model';

  export class Foo {
    // this usage of attr WILL NOT be parsed
    // because Foo does not extend Model
    @attr
    bar;
  }

  export class User extends Model {
    // this usage of attr WILL be parsed
    // because User extends Model
    @attr name;

    // this usage of belongsTo WILL NOT be parsed
    // because belongsTo is not in the list of
    // configured imports
    @belongsTo friend;
  }
  ```

* `filePrefix` _string_

When parsing a file (module), the file's path must begin with this `filePrefix` for parsing to occur, otherwise the file (module) will be skipped.

- `outputPath` _string_

The directory into which to write parsed schema info.

- `removeDecorators` [Optional] _boolean_

When `true`, decorators that were parsed out as schema will be removed from the source as part of parsing.

This allows you to use decorators to specify static schema information only while removing them to avoid runtime overhead.

Example Input

```js
import Model, { attr } from '@ember-data/model';

export class User extends Model {
  @attr name;
}
```

Example Output

```js
import Model from '@ember-data/model';

export class User extends Model {
  name;
}
```
