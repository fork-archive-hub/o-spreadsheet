import { ChildElementSchema, ElementSchema } from "./types";

export function extract(schema: ElementSchema, xml: string): object {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const el = doc.firstElementChild;
  if (el === null) {
    throw new Error("No element found");
  }
  return _extract(schema, el);
}

function _extract(schema: ElementSchema, el: Element) {
  if (schema.name !== el.localName) {
    throw new Error(`Expected '${schema.name}' but found '${el.localName}'`);
  }
  const data: Record<string, ParsedElement> = {
    [schema.name]: {},
  };
  if (schema.children) {
    if (Array.isArray(schema.children)) {
      data[schema.name].children = extractOrderedChildren(schema.children, el);
    }
  } else if (el.textContent) {
    data[schema.name].textContent = el.textContent;
  }
  for (const attribute of schema.attributes || []) {
    const attributes = {};
    data[schema.name].attributes = attributes;
    const value = el.getAttribute(attribute.name);
    if (value === null) {
      throw new Error(`Expected '${schema.name}' to have attribute '${attribute.name}'`);
    }
    attributes[attribute.name] = value;
  }
  return data;
}

function extractOrderedChildren(
  childrenSchema: ChildElementSchema[],
  el: Element
): NamedParsedElement[] {
  let childSchema = childrenSchema.shift();
  const parsedChildren: NamedParsedElement[] = [];
  for (const child of el.children) {
    if (childSchema === undefined) {
      return parsedChildren;
    }
    switch (childSchema.quantifier) {
      case undefined: // default value is "one"
      case "one": {
        if (childSchema.name !== child.localName) {
          break;
          // throw new Error(`Missing child: '${childSchema.name}'`);
        }
        const childData = {
          name: child.localName,
          ..._extract(childSchema, child)[child.localName],
        };
        parsedChildren.push(childData);
        childSchema = childrenSchema.shift();
        break;
      }
      case "many": {
        if (childSchema.name !== child.localName) {
          childSchema = childrenSchema.shift();
          break;
        }
        const childData = {
          name: child.localName,
          ..._extract(childSchema, child)[child.localName],
        };
        parsedChildren.push(childData);
        break;
      }
      case "optional": {
        break;
      }
    }
  }
  if (
    childSchema !== undefined &&
    (childSchema.quantifier === "one" || childSchema.quantifier === undefined)
  ) {
    throw new Error(`Missing child: '${childSchema.name}'`);
  }
  if (childrenSchema.length) {
    throw new Error(`Missing child: '${childrenSchema[0].name}'`);
  }
  return parsedChildren;
}
interface ParsedElement {
  attributes?: Record<string, string>;
  children?: ParsedElement[];
  textContent?: string;
}

interface NamedParsedElement extends ParsedElement {
  name: string;
}
