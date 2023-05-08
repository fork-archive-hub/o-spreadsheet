"<person></person>";

function parseElement(element: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(element, "text/xml");
  const el = doc.firstElementChild;
  if (el === null) {
    return undefined;
  }
  if (el.attributes.length) {
    return {
      tagName: el.tagName,
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

function createBaseElement(schema: ElementSchema) {
  const xmlDocument = document.implementation.createDocument(schema.namespace?.uri || "", "", null);
  if (schema.namespace) {
    const tag = schema.namespace.prefix
      ? `${schema.namespace.prefix}:${schema.tagName}`
      : schema.tagName;
    return xmlDocument.createElementNS(schema.namespace.uri, tag);
  }
  return xmlDocument.createElement(schema.tagName);
}

function generateElement(schema: ElementSchema, data: object): Element {
  if (schema.tagName in data === false) {
    throw new Error(`Expected ${schema.tagName} but found ${Object.keys(data)}`);
  }

  const element = createBaseElement(schema);
  if (typeof data[schema.tagName] !== "object") {
    element.textContent = data[schema.tagName];
    return element;
  }
  const properties = new Set(Object.keys(data[schema.tagName]));
  for (const attribute of schema.attributes || []) {
    if (!properties.has(attribute.name)) {
      throw new Error(
        `Expected ${schema.tagName}.${attribute.name} but found ${Object.keys(
          data[schema.tagName]
        )}`
      );
    }
    properties.delete(attribute.name);
    element.setAttribute(attribute.name, data[schema.tagName][attribute.name]);
  }
  if (properties.size === 1 && properties) {
    debugger;
    if (schema.children?.length === 1) {
      element.appendChild(generateElement(schema.children[0], data[schema.tagName]));
    }

    // const innerValue   = properties.values().next().value;
    // if (typeof data[schema.tagName][innerValue] === "object" && schema.children?.length === 1) {
    //   element.appendChild(generateElement(schema.children[0], data[schema.tagName]));
    // }
  }
  return element;
}

function generate(schema: ElementSchema, data: object) {
  const s = new XMLSerializer();
  return s.serializeToString(generateElement(schema, data));
}

interface ElementSchema {
  tagName: string;
  namespace?: {
    prefix?: string;
    uri: string;
  };
  attributes?: Array<{ name: string }>;
  children?: ElementSchema[];
}

describe("js schema to xml", () => {
  test("should be able to generate a single element", () => {
    const schema = {
      tagName: "person",
    };
    const data = {
      person: {},
    };
    expect(generate(schema, data)).toEqual("<person/>");
  });
  test("should be able to generate a single element with a value", () => {
    const schema = {
      tagName: "person",
    };
    const data = {
      person: "John",
    };
    expect(generate(schema, data)).toEqual("<person>John</person>");
  });
  test("should be able to generate an element with an attribute", () => {
    const schema = {
      tagName: "person",
      attributes: [{ name: "name" }],
    };
    const data = {
      person: {
        name: "John",
      },
    };
    expect(generate(schema, data)).toEqual('<person name="John"/>');
  });
  test("should be able to generate an element with two attributes", () => {
    const schema = {
      tagName: "person",
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
  test("should be able to generate a single element with an attribute and a value", () => {
    const schema = {
      tagName: "person",
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
      tagName: "person",
    };
    const data = {
      city: "London",
    };
    expect(() => generate(schema, data)).toThrow("Expected person but found city");
  });
  test("attribute not found", () => {
    const schema = {
      tagName: "person",
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
      tagName: "person",
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
  test("namespace without prefix", () => {
    const schema = {
      tagName: "person",
      namespace: {
        uri: "http://example.com",
      },
    };
    const data = {
      person: "John",
    };
    expect(generate(schema, data)).toBe('<person xmlns="http://example.com">John</person>');
  });

  test("should be able to generate a single element with a single child element", () => {
    const schema = {
      tagName: "person",
      children: [
        {
          tagName: "address",
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
  test("should be able to generate a single element with a single child wrong element", () => {
    const schema = {
      tagName: "person",
      children: [
        {
          tagName: "address",
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

describe("XML", () => {
  test("should be able to parse a single XML element", () => {
    expect(parseElement("<person></person>")).toEqual({
      tagName: "person",
    });
  });
  test("should be able to parse a single XML element with an attribute", () => {
    expect(parseElement('<person name="John"></person>')).toEqual({
      tagName: "person",
      attributes: [{ name: "name", value: "John" }],
    });
  });
});
