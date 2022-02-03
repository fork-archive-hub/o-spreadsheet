import { args, functionRegistry } from "../../../src/functions/index";
import { Model } from "../../../src/model";
import "../../canvas.mock";
import { getCell } from "../../helpers";

let model: Model = new Model();
beforeEach(() => {
  model = new Model();
});

describe("evaluate formula getter", () => {
  test("a ref in the current sheet", () => {
    model.dispatch("SET_VALUE", { xc: "A1", text: "12" });
    expect(model.getters.evaluateFormula("=A1")).toBe(12);
  });

  test("in another sheet", () => {
    model.dispatch("CREATE_SHEET", { id: "42" });
    const sheet2 = model["workbook"].visibleSheets[1];
    model.dispatch("SET_VALUE", { xc: "A1", text: "11", sheetId: sheet2 });
    expect(model.getters.evaluateFormula("=Sheet2!A1")).toBe(11);
  });

  // i think these formulas should throw
  test("in a not existing sheet", () => {
    expect(() => model.getters.evaluateFormula("=Sheet99!A1")).toThrow();
  });

  test("evaluate a cell in error", () => {
    model.dispatch("SET_VALUE", { xc: "A1", text: "=mqsdlkjfqsdf(((--" });
    expect(() => model.getters.evaluateFormula("=A1")).toThrow();
  });

  test("evaluate a pending cell (async)", () => {
    model.dispatch("SET_VALUE", { xc: "A1", text: "=wait(99999)" });
    expect(() => model.getters.evaluateFormula("=A1")).toThrow();
  });

  test("EVALUATE_CELLS with no argument re-evaluate all the cells", () => {
    let value = 1;
    functionRegistry.add("GETVALUE", {
      description: "Get value",
      compute: () => value,
      args: args(``),
      returns: ["NUMBER"],
    });
    model.dispatch("SET_VALUE", { xc: "A1", text: "=GETVALUE()" });
    expect(getCell(model, "A1")!.value).toBe(1);
    value = 2;
    model.dispatch("EVALUATE_CELLS");
    expect(getCell(model, "A1")!.value).toBe(2);
  });

  test("using cells in other sheets", () => {
    model.dispatch("CREATE_SHEET", { id: "42" });
    const s = model.getters.getSheets();
    model.dispatch("ACTIVATE_SHEET", { from: s[1].id, to: s[0].id });
    model.dispatch("SET_VALUE", { sheetId: s[1].id, xc: "A1", text: "12" });
    model.dispatch("SET_VALUE", { sheetId: s[1].id, xc: "A2", text: "=A1" });
    model.dispatch("SET_VALUE", { sheetId: s[0].id, xc: "A2", text: "=Sheet2!A1" });
    expect(model.getters.getCell(0, 1, "Sheet1")!.value).toBe(12);
  });

  test("evaluate references with fixed indexes", () => {
    model.dispatch("SET_VALUE", { xc: "A1", text: "1" });
    model.dispatch("SET_VALUE", { xc: "A2", text: "2" });
    model.dispatch("SET_VALUE", { xc: "A3", text: "=A1" });
    model.dispatch("SET_VALUE", { xc: "A4", text: "=$A1" });
    model.dispatch("SET_VALUE", { xc: "A5", text: "=A$1" });
    model.dispatch("SET_VALUE", { xc: "A6", text: "=$A$1" });
    model.dispatch("SET_VALUE", { xc: "B3", text: "=sum(A$1:A2)" });
    model.dispatch("SET_VALUE", { xc: "B4", text: "=sum(A$1:A$2)" });
    model.dispatch("SET_VALUE", { xc: "B5", text: "=sum($A$1:A2)" });
    model.dispatch("SET_VALUE", { xc: "B6", text: "=sum($A$1:$A$2)" });

    expect(model.getters.getCell(0, 2, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 3, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 4, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 5, "Sheet1")!.value).toBe(1);

    expect(model.getters.getCell(1, 2, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 3, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 4, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 5, "Sheet1")!.value).toBe(3);
  });

  test("evaluate function with fixed reference to another sheet", () => {
    model.dispatch("CREATE_SHEET", { id: "42", name: "second sheet" });

    model.dispatch("SET_VALUE", { xc: "A1", text: "1", sheetId: "42" });
    model.dispatch("SET_VALUE", { xc: "A2", text: "2", sheetId: "42" });
    model.dispatch("SET_VALUE", { xc: "A3", text: "='second sheet'!A1" });
    model.dispatch("SET_VALUE", { xc: "A4", text: "='second sheet'!$A1" });
    model.dispatch("SET_VALUE", { xc: "A5", text: "='second sheet'!A$1" });
    model.dispatch("SET_VALUE", { xc: "A6", text: "='second sheet'!$A$1" });
    model.dispatch("SET_VALUE", { xc: "B3", text: "=sum('second sheet'!A$1:A2)" });
    model.dispatch("SET_VALUE", { xc: "B4", text: "=sum('second sheet'!A$1:A$2)" });
    model.dispatch("SET_VALUE", { xc: "B5", text: "=sum('second sheet'!$A$1:A2)" });
    model.dispatch("SET_VALUE", { xc: "B6", text: "=sum('second sheet'!$A$1:$A$2)" });

    expect(model.getters.getCell(0, 2, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 3, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 4, "Sheet1")!.value).toBe(1);
    expect(model.getters.getCell(0, 5, "Sheet1")!.value).toBe(1);

    expect(model.getters.getCell(1, 2, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 3, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 4, "Sheet1")!.value).toBe(3);
    expect(model.getters.getCell(1, 5, "Sheet1")!.value).toBe(3);
  });
});