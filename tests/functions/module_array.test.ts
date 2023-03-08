import { setCellContent, setFormat } from "../test_helpers/commands_helpers";
import {
  evaluateCell,
  getModelFromGrid,
  getRangeFormatsAsMatrix,
  getRangeValuesAsMatrix,
  target,
} from "../test_helpers/helpers";

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

describe("TRANSPOSE function", () => {
  test("TRANSPOSE takes 1 arguments", () => {
    expect(evaluateCell("A1", { A1: "=TRANSPOSE()" })).toBe("#BAD_EXPR");
    expect(evaluateCell("A1", { A1: "=TRANSPOSE(B1:C2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TRANSPOSE(B1:C2, 0)" })).toBe("#BAD_EXPR");
  });

  test("Transpose matrix", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TRANSPOSE(A1:B2)");
    expect(getRangeValuesAsMatrix(model, "D1:E2")).toEqual([
      ["A1", "A2"],
      ["B1", "B2"],
    ]);
  });

  test("Transpose matrix with empty cells", () => {
    const grid = { A1: "A1", A2: undefined, B1: "B1", B2: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TRANSPOSE(A1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:E2")).toEqual([
      ["A1", "0"],
      ["B1", "0"],
    ]);
  });

  test("Transpose single cell", () => {
    const grid = { A1: "A1" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TRANSPOSE(A1)");
    expect(getRangeValuesAsMatrix(model, "D1")).toEqual([["A1"]]);
  });

  test("Format is transposed", () => {
    const grid = { A1: "1", A2: "5" };
    const model = getModelFromGrid(grid);
    setFormat(model, "0.00", target("A1"));
    setFormat(model, "0.000", target("A2"));
    setCellContent(model, "D1", "=TRANSPOSE(A1:A2)");
    expect(getRangeFormatsAsMatrix(model, "D1:E1")).toEqual([["0.00", "0.000"]]);
  });
});
