const path = require("path");
import BabelTypes, {
  ImportDeclaration,
  Identifier,
  CallExpression,
  ObjectExpression,
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
  };
  file: {
    path: NodePath;
  };
}

interface BabelPlugin {
  name: string;
  visitor: Visitor<PluginOptions>;
}

export interface Babel {
  types: typeof BabelTypes;
}

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

type Def = {
  type: string;
  name: string;
  fields: Field[];
};
type Field = {
  key: string;
  type: string;
  config: any[];
};

function skyrocketSchemaParser(babel: Babel): BabelPlugin {
  let shouldParse = false;
  let foundSchemas: { [key: string]: ParsedSchema } = {};
  let hasFoundSchemas = false;
  let sourceFiles: Schemas;
  let definitions: Def[] = [];

  return {
    name: "skyrocket-schema-parser",

    visitor: {
      Program: {
        enter(path: NodePath, state: PluginOptions) {
          const config = state.opts;
          const { schemaSourceFiles, filePrefix } = config;
          const fileName = path.hub.file.opts.sourceFileName;
          shouldParse = shouldParseFile(fileName, filePrefix);
          if (!shouldParse) {
            return;
          }
          sourceFiles = schemaSourceFiles;
        },
        exit() {
          if (definitions.length) {
            console.log(JSON.stringify(definitions, null, 2));
          }
          definitions = [];
          shouldParse = false;
          foundSchemas = {};
          hasFoundSchemas = false;
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
                }
              });
              definitions.push({
                type: schema.source,
                name,
                fields
              });
            }
          }
        }
      }
    }
  };
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

const SerializableTypes = [
  "ObjectExpression",
  "ArrayExpression",
  "BooleanLiteral",
  "NumericLiteral",
  "StringLiteral",
  "NullLiteral"
];

type CallArg = CallExpression["arguments"][0];
type ValArg = ObjectProperty["value"];
type ArrArg = ArrayExpression["elements"][0];
type Arg = CallArg | ValArg | ArrArg;

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

skyrocketSchemaParser.baseDir = function() {
  return path.join(__dirname, "../");
};

module.exports = skyrocketSchemaParser;
