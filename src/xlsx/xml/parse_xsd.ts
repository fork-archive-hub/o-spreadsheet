import {
  areNamespaceIgnoredByQuerySelector,
  escapeNamespaces,
  removeNamespaces,
} from "../helpers/xml_helpers";
import { ElementSchema } from "./types";

// const schema = {
//   name: "schema",
//   children: [
//     { name: "complexType", minOccurs: 0 },
//     { name: "element", minOccurs: 0 },
//   ],
// }

// https://github.com/sublimedatasys/xsdlib/blob/master/index.js
export function parseXSD(xsd: string): ElementSchema {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xsd.trim(), "text/xml");
  const schemaEl = doc.firstElementChild;
  if (schemaEl === null) {
    throw new Error("Invalid XSD");
  }
  for (const child of schemaEl.children) {
    switch (child.localName) {
      case "element": {
        const schema = parseElementElement(child);
        return schema;
      }
    }
  }
  throw new Error("Invalid XSD");
}

function parseElementElement(el: Element): ElementSchema {
  const schema: ElementSchema = {
    name: el.getAttribute("name")!,
  };
  const type = el.getAttribute("type");
  if (type) {
    schema.type = type as ElementSchema["type"];
  }
  for (const child of el.children) {
    switch (child.localName) {
      case "complexType": {
        const attributes: Array<{ name: string }> = [];
        for (const childComplexType of child.children) {
          switch (childComplexType.localName) {
            case "attribute": {
              attributes.push({ name: childComplexType.getAttribute("name")! });
              break;
            }
          }
        }
        if (attributes.length) {
          schema.attributes = attributes;
        }
      }
    }
  }
  return schema;
}
const ignoreNamespace = areNamespaceIgnoredByQuerySelector();

function querySelector(element: Element | Document, query: string) {
  query = ignoreNamespace ? removeNamespaces(query) : escapeNamespaces(query);
  return element.querySelector(query);
}
function querySelectorAll(element: Element | Document, query: string) {
  query = ignoreNamespace ? removeNamespaces(query) : escapeNamespaces(query);
  return element.querySelectorAll(query);
}
querySelector;
querySelectorAll;
// function parseXSDElement(el: Element): ElementSchema {
//   const schema: ElementSchema = {
//     tagName: el.tagName,
//   }
//   if (el.namespaceURI) {
//     schema.namespace = {
//       uri: el.namespaceURI,
//     }
//   }
//   if (el.prefix) {
//     schema.namespace = {
//       ...schema.namespace,
//       prefix: el.prefix,
//     }
//   }
//   if (el.attributes.length) {
//     schema.attributes = Array.from(el.attributes).map((attr) => ({
//       name: attr.name,
//     }));
//   }
//   if (el.children.length) {
//     schema.children = Array.from(el.children).map(parseXSDElement);
//   }
//   return schema;
// }

export function parseElement(element: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(element, "text/xml");
  const el = doc.firstElementChild;
  if (el === null) {
    return undefined;
  }
  if (el.attributes.length) {
    return {
      name: el.localName,
      attributes: Array.from(el.attributes).map((attr) => ({
        name: attr.name,
        value: attr.value,
      })),
    };
  }
  return {
    tagName: el.tagName,
  };
}
