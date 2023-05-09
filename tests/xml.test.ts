import { ElementSchema, parseElement } from "../src/xlsx/xml";

function createBaseElement(schema: ElementSchema) {
  const xmlDocument = document.implementation.createDocument(schema.namespace?.uri || "", "", null);
  const tag = schema.namespace?.prefix ? `${schema.namespace.prefix}:${schema.name}` : schema.name;
  if (schema.namespace?.uri) {
    return xmlDocument.createElementNS(schema.namespace.uri, tag);
  }
  return xmlDocument.createElement(tag);
}

function generateElement(schema: ElementSchema, data: object): Element {
  if (schema.name in data === false) {
    throw new Error(`Expected ${schema.name} but found ${Object.keys(data)}`);
  }

  const element = createBaseElement(schema);
  if (typeof data[schema.name] !== "object") {
    element.textContent = data[schema.name];
    return element;
  }
  const properties = new Set(Object.keys(data[schema.name]));
  for (const attribute of schema.attributes || []) {
    if (!properties.has(attribute.name)) {
      throw new Error(
        `Expected ${schema.name}.${attribute.name} but found ${Object.keys(data[schema.name])}`
      );
    }
    properties.delete(attribute.name);
    element.setAttribute(attribute.name, data[schema.name][attribute.name]);
  }
  if (properties.size === 1 && properties) {
    debugger;
    if (schema.children?.length === 1) {
      element.appendChild(generateElement(schema.children[0], data[schema.name]));
    } else {
      element.textContent = data[schema.name][properties.values().next().value];
    }
  }
  return element;
}

function generate(schema: ElementSchema, data: object) {
  const s = new XMLSerializer();
  return s.serializeToString(generateElement(schema, data));
}

describe("js schema to xml", () => {
  test("generate a single element", () => {
    const schema = {
      name: "person",
    };
    const data = {
      person: {},
    };
    expect(generate(schema, data)).toEqual("<person/>");
  });
  test("generate a single element with a value", () => {
    const schema = {
      name: "person",
    };
    const data = {
      person: "John",
    };
    expect(generate(schema, data)).toEqual("<person>John</person>");
  });
  test("escape values", () => {
    const schema = {
      name: "person",
    };
    const data = {
      person: "<John/>",
    };
    expect(generate(schema, data)).toEqual("<person>&lt;John/&gt;</person>");
  });
  test("generate an element with an attribute", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "name" }],
    };
    const data = {
      person: {
        name: "John",
      },
    };
    expect(generate(schema, data)).toEqual('<person name="John"/>');
  });
  test("generate an element with two attributes", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "firstName" }, { name: "lastName" }],
    };
    const data = {
      person: {
        firstName: "John",
        lastName: "Doe",
      },
    };
    expect(generate(schema, data)).toEqual('<person firstName="John" lastName="Doe"/>');
  });
  test("generate a single element with an attribute and a value", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "age" }],
    };
    const data = {
      person: {
        name: "John",
        age: 32,
      },
    };
    expect(generate(schema, data)).toEqual('<person age="32">John</person>');
  });
  test("tag not found", () => {
    const schema = {
      name: "person",
    };
    const data = {
      city: "London",
    };
    expect(() => generate(schema, data)).toThrow("Expected person but found city");
  });
  test("attribute not found", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "age" }],
    };
    const data = {
      person: {
        name: "John",
      },
    };
    expect(() => generate(schema, data)).toThrow("Expected person.age but found name");
  });
  test("namespace with prefix", () => {
    const schema = {
      name: "person",
      namespace: {
        prefix: "ns",
        uri: "http://example.com",
      },
    };
    const data = {
      person: "John",
    };
    expect(generate(schema, data)).toBe(
      '<ns:person xmlns:ns="http://example.com">John</ns:person>'
    );
  });
  test("namespace with prefix on children", () => {
    const schema = {
      name: "person",
      children: [
        {
          name: "address",
          namespace: {
            prefix: "ns",
          },
        },
      ],
      namespace: {
        prefix: "ns",
        uri: "http://example.com",
      },
    };
    const data = {
      person: { address: "London" },
    };
    expect(generate(schema, data)).toBe(
      '<ns:person xmlns:ns="http://example.com"><ns:address>London</ns:address></ns:person>'
    );
  });
  test("namespace without prefix", () => {
    const schema = {
      name: "person",
      namespace: {
        uri: "http://example.com",
      },
    };
    const data = {
      person: "John",
    };
    expect(generate(schema, data)).toBe('<person xmlns="http://example.com">John</person>');
  });

  test("generate a single element with a single child element", () => {
    const schema = {
      name: "person",
      children: [
        {
          name: "address",
        },
      ],
    };
    const data = {
      person: {
        address: "London",
      },
    };
    expect(generate(schema, data)).toEqual("<person><address>London</address></person>");
  });
  test("generate a single element with a single child wrong element", () => {
    const schema = {
      name: "person",
      children: [
        {
          name: "address",
        },
      ],
    };
    const data = {
      person: {
        city: "London",
      },
    };
    expect(() => generate(schema, data)).toThrow("Expected address but found city");
  });
});

describe("XML to js", () => {
  test("parse a single XML element", () => {
    expect(parseElement("<person></person>")).toEqual({
      name: "person",
    });
  });
  test("parse a single XML element with an attribute", () => {
    expect(parseElement('<person name="John"></person>')).toEqual({
      name: "person",
      attributes: [{ name: "name", value: "John" }],
    });
  });
});
