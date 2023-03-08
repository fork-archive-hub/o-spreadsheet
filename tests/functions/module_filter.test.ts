import { setCellContent } from "../test_helpers/commands_helpers";
import { getCellContent, getCellError } from "../test_helpers/getters_helpers";
import { evaluateCell, getModelFromGrid, getRangeValuesAsMatrix } from "../test_helpers/helpers";

describe("FILTER function", () => {
  test("FILTER takes at least 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=FILTER()" })).toBe("#BAD_EXPR");
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2)" })).toBe("#BAD_EXPR");
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, D1:D2)" })).toBe("#N/A");
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, D1:D2, D1:D2)" })).toBe("#N/A");
  });

  test("conditions should be single cols or rows", () => {
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, D1:C2)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("conditions should have the same dimensions", () => {
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, D1:D2, D1:D3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A!
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, B1:C1, B1:C3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A!
  });

  test("conditions should have the same dimensions as the filtered range", () => {
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, D1:D3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A!
    expect(evaluateCell("A1", { A1: "=FILTER(B1:C2, B1:D1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A!
  });

  test("Can filter rows", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "0", B2: "0", B3: "1" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FILTER(A1:B3, B1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A3", "1"],
      ["", ""],
      ["", ""],
    ]);
  });

  test("Can filter columns", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "0", B2: "0", B3: "1", A6: "1", B6: "0" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FILTER(A1:B3, A6:B6)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", ""],
      ["A2", ""],
      ["A3", ""],
    ]);
  });

  test("Can have multiple conditions", () => {
    // prettier-ignore
    const grid = {
      A1: "A1", B1: "0", C1: "1",
      A2: "A2", B2: "1", C2: "1",
      A3: "A3", B3: "1", C3: "0",
    };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FILTER(A1:B3, B1:B3, C1:C3)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A2", "1"],
      ["", ""],
      ["", ""],
    ]);
  });

  test("undefined values are converted to 0 in range, and are falsy in conditions", () => {
    const grid = { A1: "A1", A2: "A2", A3: undefined, B1: undefined, B2: "0", B3: "1" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FILTER(A1:B3, B1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["0", "1"],
      ["", ""],
      ["", ""],
    ]);
  });

  test("no match: return N/A", () => {
    const grid = { A1: "A1", B1: "0" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FILTER(A1, B1)");
    expect(getRangeValuesAsMatrix(model, "D1")).toEqual([["#N/A"]]);
  });
});

describe("UNIQUE function", () => {
  test("UNIQUE takes 1-3 arguments", () => {
    expect(evaluateCell("A1", { A1: "=UNIQUE()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=UNIQUE(B1:C3)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=UNIQUE(B1:C3, false)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=UNIQUE(B1:C3, false, false)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=UNIQUE(B1:C3, false, false, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("UNIQUE function with single col", () => {
    const grid = { B1: "hey", B2: "hey" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "A1", "=UNIQUE(B1:B2)");
    expect(getRangeValuesAsMatrix(model, "A1:A2")).toEqual([["hey"], [""]]);
  });

  test("UNIQUE function with multidimensional array", () => {
    const grid = { A1: "hey", A2: "hey", A3: "hey", B1: "olà", B2: "olà", B3: "bjr" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=UNIQUE(A1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["hey", "olà"],
      ["hey", "bjr"],
      ["", ""],
    ]);
  });

  test("UNIQUE function with undefined values", () => {
    const grid = { A1: "hey", A2: "hey", A3: "hey", B3: "bjr" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=UNIQUE(A1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["hey", "0"],
      ["hey", "bjr"],
      ["", ""],
    ]);
  });

  test("UNIQUE function with by_column argument to true", () => {
    const grid = { A1: "hey", A2: "olà", B1: "hey", B2: "olà" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=UNIQUE(A1:B2, true)");
    expect(getRangeValuesAsMatrix(model, "D1:E2")).toEqual([
      ["hey", ""],
      ["olà", ""],
    ]);
  });

  test("UNIQUE function with only_once argument to true", () => {
    const grid = { A1: "hey", A2: "hey", A3: "hey", B1: "olà", B2: "olà", B3: "bjr" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=UNIQUE(A1:B3, false, true)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["hey", "bjr"],
      ["", ""],
      ["", ""],
    ]);
  });

  test("UNIQUE function with no unique rows and only_once argument", () => {
    const grid = { A1: "hey", A2: "hey", A3: "hey", B1: "olà", B2: "olà", B3: "olà" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=UNIQUE(A1:B3, 0 ,1)");
    expect(getCellContent(model, "D1")).toBe("#ERROR");
    expect(getCellError(model, "D1")).toBe("No unique values found");
  });
});
