import { setCellContent } from "../test_helpers/commands_helpers";
import { evaluateCell, getModelFromGrid, getRangeValuesAsMatrix } from "../test_helpers/helpers";

describe("EXPAND function", () => {
  test("EXPAND takes 1-4 arguments", () => {
    expect(evaluateCell("A1", { A1: "=EXPAND()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 2, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 2, 0, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("rows argument must be greater or equal to the number of rows in the range", () => {
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 1, 2, 0)" })).toBe("#ERROR");
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 2, 0)" })).toBe(0);
  });

  test("columns argument must be greater or equal to the number of cols in the range", () => {
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 1, 0)" })).toBe("#ERROR");
    expect(evaluateCell("A1", { A1: "=EXPAND(B1:C2, 2, 2, 0)" })).toBe(0);
  });

  test("Expand nothing", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=EXPAND(A1:B2)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", ""],
      ["A2", "B2", ""],
      ["", "", ""],
    ]);
  });

  test("Expand rows", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=EXPAND(A1:B2, 3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", ""],
      ["A2", "B2", ""],
      ["0", "0", ""],
    ]);
  });

  test("Expand columns", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=EXPAND(A1:B2, 2, 3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", "0"],
      ["A2", "B2", "0"],
      ["", "", ""],
    ]);
  });

  test("Expand rows and columns with a default value", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=EXPAND(A1:B2, 3, 3, 66)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", "66"],
      ["A2", "B2", "66"],
      ["66", "66", "66"],
    ]);
  });
});
