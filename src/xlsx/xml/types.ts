export interface ElementSchema {
  name: string;
  namespace?: NameSpace;
  type?: XMLType;
  attributes?: Array<{ name: string }>;
  children?: ChildElementSchema[];
}

export interface ChildElementSchema extends ElementSchema {
  /**
   * Defaults to "one"
   */
  quantifier?: "one" | "many" | "optional";
}

type XMLType = "string" | "decimal" | "integer" | "boolean" | "date" | "time";

export interface Attribute {
  name: string;
  type: XMLType;
}
export interface NameSpace {
  prefix?: string;
  uri?: string;
}
