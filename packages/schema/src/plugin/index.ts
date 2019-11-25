const path = require("path");
const fs = require("fs");

import BabelTypes, {
  ImportDeclaration,
  Identifier,
  CallExpression,
  ArrayExpression,
  ObjectProperty
} from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";

type Schema = "*" | true | string[];
type Schemas = {
  [key: string]: Schema;
};
type ParsedField = { name: string; localName: string; identifier: Identifier };
type ParsedSchema = {
  type: ParsedField;
  source: string;
  fields: { [key: string]: ParsedField };
};

interface PluginOptions {
  opts: {
    schemaSourceFiles: Schemas;
    filePrefix: string;
    outputPath: string;
    removeDecorators?: boolean;
  };
  file: {
    path: NodePath;
  };
}

interface BabelPlugin {
  name: string;
  visitor: Visitor<PluginOptions>;
}

interface Babel {
  types: typeof BabelTypes;
  getEnv(): any;
  File(): any;
}

type Def = {
  type: string;
  name: string;
  isDefaultExport: boolean;
  fields: Field[];
};
type Field = {
  key: string;
  type: string;
  config: any[];
};
type CallArg = CallExpression["arguments"][0];
type ValArg = ObjectProperty["value"];
type ArrArg = ArrayExpression["elements"][0];
type Arg = CallArg | ValArg | ArrArg;

const SerializableTypes = [
  "ObjectExpression",
  "ArrayExpression",
  "BooleanLiteral",
  "NumericLiteral",
  "StringLiteral",
  "NullLiteral"
];

function shouldParseFile(fileName: string, filePrefix: string): boolean {
  return fileName.indexOf(filePrefix) === 0;
}

function hasSchemaForImport(importPath: string, schemas: Schemas): boolean {
  return importPath in schemas;
}

function importsForSchema(
  importPath: string,
  schema: Schema,
  specifiers: ImportDeclaration["specifiers"]
) {
  let fields: ParsedSchema["fields"] = {};
  let type: ParsedField | null = null;

  for (let i = 0; i < specifiers.length; i++) {
    let s = specifiers[i];
    let name, localName, identifier;
    let isType = false;
    let isAllowed = true;
    if (s.type === "ImportDefaultSpecifier") {
      isType = true;
      name = localName = s.local.name;
      identifier = s.local;
    } else if (s.type === "ImportSpecifier") {
      name = s.imported.name;
      isAllowed =
        schema === true || schema === "*" || schema.indexOf(name) !== -1;
      localName = s.local ? s.local.name : name;
      identifier = s.local ? s.local : s.imported;
    } else {
      throw new Error("Unexpected import syntax");
    }

    let field = { name, localName, identifier };
    if (isType) {
      type = field;
    } else if (isAllowed) {
      fields[localName] = field;
    }
  }

  if (type === null) {
    throw new Error("Invalid Schema: missing default import");
  }

  return { source: importPath, type, fields };
}

function parseField(
  schema: ParsedSchema,
  path: NodePath<BabelTypes.ClassProperty | BabelTypes.ClassMethod>,
  fields: Field[]
) {
  const identifier = path.node.key as Identifier;
  const key = identifier.name;
  let field;

  if (path.node.decorators) {
    let ds = path.node.decorators;
    let matched;
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i].expression as Identifier | CallExpression;
      if (!isCallExpresion(d)) {
        // @foo bar(); e.g. no parens
        let name = d.name;
        if (schema.fields[name]) {
          if (matched) {
            throw new Error(
              `Expected only one schema decorator to be used for this property`
            );
          }
          matched = true;
          field = {
            key,
            type: name,
            config: []
          };
        }
      } else {
        // @foo() bar(); e.g. with parens
        let identifier = d.callee as Identifier;
        let name = identifier.name;
        if (schema.fields[name]) {
          if (matched) {
            throw new Error(
              `Expected only one schema decorator to be used for this property`
            );
          }
          matched = true;
          let config: any[] = [];
          if (d.arguments && d.arguments.length) {
            config = argsToJSON(d.arguments);
          }
          field = {
            key,
            type: name,
            config
          };
        }
      }
    }
  }

  if (field) {
    fields.push(field);
  }
}

function isCallExpresion(thing: any): thing is CallExpression {
  return Object.hasOwnProperty.call(thing, "callee");
}

function argsToJSON(args: Arg[]): any[] {
  let serialized: any[] = [];

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    serialized.push(argToJSON(arg));
  }

  return serialized;
}

function argToJSON(node: Arg) {
  if (node === null) {
    return null;
  }
  const type = node.type;

  if (SerializableTypes.indexOf(type) === -1) {
    throw new Error(`Cannot serialize ${type} to JSON`);
  }

  if (
    node.type === "BooleanLiteral" ||
    node.type === "StringLiteral" ||
    node.type === "NumericLiteral"
  ) {
    return node.value;
  } else if (node.type === "NullLiteral") {
    return null;
  } else if (node.type === "ArrayExpression") {
    return node.elements ? argsToJSON(node.elements) : [];
  } else if (node.type === "ObjectExpression") {
    let json: { [key: string]: any } = {};
    if (node.properties) {
      for (let i = 0; i < node.properties.length; i++) {
        let prop = node.properties[i];
        if (prop.type !== "ObjectProperty") {
          throw new Error(`Cannot serialize ${prop.type} to JSON`);
        }
        if (prop.computed === true) {
          throw new Error(`Cannot serialize dynamic object keys to JSON`);
        }
        let key = prop.key.name;
        json[key] = argToJSON(prop.value);
      }
    }
    return json;
  }
}

function writeSchema(
  definitions: Def[],
  config: {
    env: "development" | "testing" | "production";
    fileName: string;
    filePrefix: string;
    outputPath: string;
  }
) {
  // ensure directory
  const outputPath = path.join(config.outputPath, config.filePrefix);
  fs.mkdirSync(outputPath, { recursive: true });
  const moduleNameParts = path.parse(
    config.fileName.replace(config.filePrefix, "")
  );
  const moduleName = path.join(moduleNameParts.dir, moduleNameParts.name);
  const newFilePath = path.join(
    outputPath,
    `${
      moduleNameParts.dir.length
        ? moduleNameParts.dir.replace(/\//g, "_") + "_"
        : ""
    }${moduleNameParts.name}+${config.env}.json`
  );

  const content = {
    module: moduleName,
    path: config.fileName,
    definitions
  };
  const fileContent = JSON.stringify(content, null, 2);

  fs.writeFileSync(newFilePath, fileContent, {
    encoding: "utf8"
  });
}

function skyrocketSchemaParser(babel: Babel): BabelPlugin {
  let shouldParse = false;
  let foundSchemas: { [key: string]: ParsedSchema } = {};
  let hasFoundSchemas = false;
  let sourceFiles: Schemas;
  let definitions: Def[] = [];
  let shouldRemoveDecorators = false;
  const env = babel.getEnv();

  return {
    name: "skyrocket-schema-parser",

    visitor: {
      Program: {
        enter(path: NodePath, state: PluginOptions) {
          const config = state.opts;
          const { schemaSourceFiles, filePrefix, removeDecorators } = config;
          const fileName = path.hub.file.opts.sourceFileName;
          shouldParse = shouldParseFile(fileName, filePrefix);
          if (!shouldParse) {
            return;
          }
          shouldRemoveDecorators = removeDecorators || false;
          sourceFiles = schemaSourceFiles;
        },
        exit(path: NodePath, state: PluginOptions) {
          if (definitions.length) {
            const fileName = path.hub.file.opts.sourceFileName;
            const config = {
              env,
              fileName,
              outputPath: state.opts.outputPath,
              filePrefix: state.opts.filePrefix
            };
            writeSchema(definitions, config);
          }
          definitions = [];
          shouldParse = false;
          foundSchemas = {};
          hasFoundSchemas = false;
          shouldRemoveDecorators = false;
        }
      },
      ImportDeclaration: {
        enter(path) {
          if (!shouldParse) {
            return;
          }
          const importPath = path.node.source.value;
          if (hasSchemaForImport(importPath, sourceFiles)) {
            const specifiers = path.node.specifiers;
            hasFoundSchemas = true;
            const schema = importsForSchema(
              importPath,
              sourceFiles[importPath],
              specifiers
            );
            foundSchemas[schema.type.localName] = schema;
          }
        }
      },
      ClassDeclaration: {
        enter(path) {
          if (!shouldParse || !hasFoundSchemas) {
            return;
          }
          if (!path.node) {
            return;
          }
          // ignore classes that aren't in module scope
          // and ignore classes assigned dynamically
          // this is a static schema parser afterall ;)
          if (
            path.parent.type !== "Program" &&
            path.parent.type !== "ExportDefaultDeclaration" &&
            path.parent.type !== "ExportNamedDeclaration"
          ) {
            return;
          }

          // TODO we don't currently handle well the situation where
          //  the class definition is not immediately exported.
          // This means the export could change names but we
          //  don't catch this.
          // This also means we might find a schema for a class that is never
          //  exported
          const isDefaultExport =
            path.parent.type === "ExportDefaultDeclaration";
          const superClass: Identifier | null = path.node.superClass
            ? (path.node.superClass as Identifier)
            : null;

          if (superClass) {
            if (!path.node.id) {
              throw new Error(
                `Unexpected anonymous class extending ${superClass.name}`
              );
            }
            const name = path.node.id.name;
            const schema = foundSchemas[superClass.name];
            if (schema) {
              let fields: Field[] = [];
              path.traverse({
                ClassMethod(path) {
                  parseField(schema, path, fields);
                },
                ClassProperty(path) {
                  parseField(schema, path, fields);
                },
                Decorator(path) {
                  if (shouldRemoveDecorators) {
                    let d = path.node.expression as Identifier | CallExpression;
                    if (!isCallExpresion(d)) {
                      let name = d.name;
                      if (schema.fields[name]) {
                        path.remove();
                      }
                    } else {
                      let identifier = d.callee as Identifier;
                      let name = identifier.name;

                      if (schema.fields[name]) {
                        path.remove();
                      }
                    }
                  }
                }
              });
              definitions.push({
                type: schema.source,
                name,
                isDefaultExport,
                fields
              });
            }
          }
        }
      }
    }
  };
}

skyrocketSchemaParser.baseDir = function() {
  return path.join(__dirname, "../");
};

module.exports = skyrocketSchemaParser;
