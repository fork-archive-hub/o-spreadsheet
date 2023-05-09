import { ElementSchema, extract } from "../../src/xlsx/xml";

describe("extract xml with js schema", () => {
  test("extract a single element", () => {
    const schema = {
      name: "person",
    };
    const xml = "<person/>";
    expect(extract(schema, xml)).toEqual({
      person: {},
    });
  });
  test("an element with a value", () => {
    const schema = {
      name: "person",
    };
    const xml = "<person>John</person>";
    expect(extract(schema, xml)).toEqual({
      person: {
        textContent: "John",
      },
    });
  });
  test("element not found", () => {
    const schema = {
      name: "person",
    };
    const xml = "<city/>";
    expect(() => extract(schema, xml)).toThrow("Expected 'person' but found 'city'");
  });
  test("element with an attribute", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "age" }],
    };
    const xml = '<person age="12"/>';
    expect(extract(schema, xml)).toEqual({
      person: { attributes: { age: "12" } },
    });
  });
  test("attribute not found", () => {
    const schema = {
      name: "person",
      attributes: [{ name: "age" }],
    };
    const xml = '<person name="John"/>';
    expect(() => extract(schema, xml)).toThrow("Expected 'person' to have attribute 'age'");
  });
  test("extract an ordered child", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }],
    };
    const xml = "<person><address>London</address></person>";
    expect(extract(schema, xml)).toEqual({
      person: {
        children: [{ name: "address", textContent: "London" }],
      },
    });
  });
  test("extract two ordered children in the correct order", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }, { name: "age" }],
    };
    const xml = /*xml*/ `<person><address/><age/></person>`;
    expect(extract(schema, xml)).toEqual({
      person: {
        children: [{ name: "address" }, { name: "age" }],
      },
    });
  });
  test("cannot extract two ordered children in the wrong order", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }, { name: "age" }],
    };
    const xml = /*xml*/ `<person><age/><address/></person>`;
    expect(() => extract(schema, xml)).toThrow("Missing child: 'age'");
  });
  test("extract ordered nested children ", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address", children: [{ name: "city" }] }],
    };
    const xml = /*xml*/ `
      <person>
        <address>
          <city>London</city>
        </address>
      </person>`;
    expect(extract(schema, xml)).toEqual({
      person: {
        children: [{ name: "address", children: [{ name: "city", textContent: "London" }] }],
      },
    });
  });
  test("ignore unknown child elements", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }],
    };
    const xml = "<person><age/><address/><job/></person>";
    expect(extract(schema, xml)).toEqual({
      person: {
        children: [{ name: "address" }],
      },
    });
  });
  test("cannot extract a missing child", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }],
    };
    const xml = "<person></person>";
    expect(() => extract(schema, xml)).toThrow("Missing child: 'address'");
  });
  test("with an wrong child", () => {
    const schema: ElementSchema = {
      name: "person",
      children: [{ name: "address" }],
    };
    const xml = "<person><age>42</age></person>";
    expect(() => extract(schema, xml)).toThrow("Missing child: 'address'");
  });
  test("schema with many quantifier extracts many elements", () => {
    const schema: ElementSchema = {
      name: "country",
      children: [{ name: "city", quantifier: "many" }],
    };
    const xml = /*xml*/ `
      <country>
        <city>London</city>
        <city>Edinburgh</city>
      </country>`;
    expect(extract(schema, xml)).toEqual({
      country: {
        children: [
          { name: "city", textContent: "London" },
          { name: "city", textContent: "Edinburgh" },
        ],
      },
    });
  });
  test("schema with many quantifier does not extract from empty parent", () => {
    const schema: ElementSchema = {
      name: "country",
      children: [{ name: "city", quantifier: "many" }],
    };
    const xml = /*xml*/ `<country></country>`;
    expect(extract(schema, xml)).toEqual({
      country: { children: [] },
    });
  });
});
