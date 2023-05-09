import { parseXSD } from "../../src/xlsx/xml";

function schema(xsdBody: string) {
  return /*xml*/ `
  <?xml version="1.0"?>
    <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
      ${xsdBody}
    </xs:schema>`;
}

describe("parse xsd", () => {
  test("simple element", () => {
    const xsd = schema(/*xml*/ `<xs:element name="note"/>`);
    expect(parseXSD(xsd)).toEqual({
      name: "note",
    });
  });
  test("element with a type", () => {
    const xsd = schema(/*xml*/ `
      <xs:element name="note" type="integer"/>
    `);
    expect(parseXSD(xsd)).toEqual({
      name: "note",
      type: "integer",
    });
  });
  test("element with an attribute", () => {
    const xsd = schema(/*xml*/ `
      <xs:element name="person">
        <xs:complexType>
          <xs:attribute name="age"/>
        </xs:complexType>
      </xs:element>`);
    expect(parseXSD(xsd)).toEqual({
      name: "person",
      attributes: [{ name: "age" }],
    });
  });
  test("element with a typed attribute", () => {
    const xsd = schema(/*xml*/ `
      <xs:element name="person">
        <xs:complexType>
          <xs:attribute name="age" type="integer"/>
        </xs:complexType>
      </xs:element>`);
    expect(parseXSD(xsd)).toEqual({
      name: "person",
      attributes: [{ name: "age", type: "integer" }],
    });
  });
});
