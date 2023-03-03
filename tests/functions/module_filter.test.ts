import { setCellContent } from "../test_helpers/commands_helpers";
import { getCellContent, getCellError } from "../test_helpers/getters_helpers";
import { evaluateCell, getModelFromGrid, getRangeValuesAsMatrix } from "../test_helpers/helpers";

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
