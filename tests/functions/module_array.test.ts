import { setCellContent, setFormat } from "../test_helpers/commands_helpers";
import { getRangeValues } from "../test_helpers/getters_helpers";
import {
  evaluateCell,
  getModelFromGrid,
  getRangeFormatsAsMatrix,
  getRangeValuesAsMatrix,
  target,
} from "../test_helpers/helpers";

describe("ARRAY.CONSTRAIN function", () => {
  test("ARRAY.CONSTRAIN takes 3 arguments", () => {
    expect(evaluateCell("A1", { A1: "=ARRAY.CONSTRAIN()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=ARRAY.CONSTRAIN(D1:F2)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=ARRAY.CONSTRAIN(D1:F2, 2)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=ARRAY.CONSTRAIN(D1:F2, 2, 2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=ARRAY.CONSTRAIN(D1:F2, 2, 2, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Constraint array", () => {
    // prettier-ignore
    const grid = {
      A1: "A1", B1: "B1", C1: "C1",
      A2: "A2", B2: "B2", C2: "C2",
      A3: "A3", B3: "B2", C3: "C3",
    };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=ARRAY.CONSTRAIN(A1:C3, 2, 2)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", ""],
      ["A2", "B2", ""],
      ["", "", ""],
    ]);
  });

  test("Constraint array returns whole array if arguments col/row are greater than the range dimensions", () => {
    // prettier-ignore
    const grid = {
      A1: "A1", B1: "B1", C1: "C1",
      A2: "A2", B2: "B2", C2: "C2",
      A3: "A3", B3: "B3", C3: "C3",
    };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=ARRAY.CONSTRAIN(A1:C3, 11, 569)");
    expect(getRangeValuesAsMatrix(model, "D1:G4")).toEqual([
      ["A1", "B1", "C1", ""],
      ["A2", "B2", "C2", ""],
      ["A3", "B3", "C3", ""],
      ["", "", "", ""],
    ]);
  });

  test("Undefined values are transformed to zeroes", () => {
    const grid = { A1: "A1", B1: "B1" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=ARRAY.CONSTRAIN(A1:B2, 2, 2)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["A1", "B1", ""],
      ["0", "0", ""],
      ["", "", ""],
    ]);
  });
});

describe("CHOOSECOLS function", () => {
  test("CHOOSECOLS takes at least 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 1)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 1, 1)" })).toBe(0);
  });

  test("Column argument bust be greater than 0 and smaller than the number of cols in the range", () => {
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 0)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 1)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 2)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Column arguments should be numbers, or convertible to number", () => {
    expect(evaluateCell("A1", { A1: '=CHOOSECOLS(B1:B5, "kamoulox")' })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, TRUE)" })).toBe(0); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSECOLS(B1:B5, 1)" })).toBe(0);
  });

  test("Chose a column", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSECOLS(A1:B3, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", ""],
      ["A2", ""],
      ["A3", ""],
    ]);
  });

  test("Chose multiple columns", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSECOLS(A1:B3, 1, 2)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", "B1"],
      ["A2", "B2"],
      ["A3", "B3"],
    ]);
  });

  test("Chose multiple column with a range", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3", C1: "1", C2: "2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSECOLS(A1:B3, C1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", "B1"],
      ["A2", "B2"],
      ["A3", "B3"],
    ]);
  });

  test("Order of chosen column is respected (row-first for ranges)", () => {
    //prettier-ignore
    const grid = {
      A1: "A1", B1: "B1", C1: "C1", D1: "1", E1: "2",
      A2: "A2", B2: "B2", C2: "C2", D2: "3", E2: "1",
      A3: "A3", B3: "B3", C3: "C3",
    };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D5", "=CHOOSECOLS(A1:C3, D1:E2, 2)");
    expect(getRangeValuesAsMatrix(model, "D5:H7")).toEqual([
      ["A1", "B1", "C1", "A1", "B1"],
      ["A2", "B2", "C2", "A2", "B2"],
      ["A3", "B3", "C3", "A3", "B3"],
    ]);
  });

  test("Undefined values are transformed to zeroes", () => {
    const grid = { A1: "A1", A2: "A2", A3: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSECOLS(A1:A3, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:D3")).toEqual([["A1"], ["A2"], ["0"]]);
  });
});

describe("CHOOSEROWS function", () => {
  test("CHOOSEROWS takes at least 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 1)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 1, 1)" })).toBe(0);
  });

  test("Column argument bust be greater than 0 and smaller than the number of rows in the range", () => {
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 0)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 1)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 5)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Column arguments should be numbers, or convertible to number", () => {
    expect(evaluateCell("A1", { A1: '=CHOOSEROWS(B1:E1, "kamoulox")' })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, TRUE)" })).toBe(0); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=CHOOSEROWS(B1:E1, 1)" })).toBe(0);
  });

  test("Chose a row", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSEROWS(A1:C2, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:F2")).toEqual([
      ["A1", "B1", "C1"],
      ["", "", ""],
    ]);
  });

  test("Chose multiple rows", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSEROWS(A1:C2, 1, 2)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", "B1"],
      ["A2", "B2"],
      ["", ""],
    ]);
  });

  test("Chose multiple rows with a range", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3", C1: "1", C2: "2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSEROWS(A1:B3, C1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:E3")).toEqual([
      ["A1", "B1"],
      ["A2", "B2"],
      ["", ""],
    ]);
  });

  test("Order of chosen rows is respected (row-first for ranges)", () => {
    //prettier-ignore
    const grid = {
      A1: "A1", B1: "B1", C1: "C1", D1: "1", E1: "2",
      A2: "A2", B2: "B2", C2: "C2", D2: "3", E2: "1",
      A3: "A3", B3: "B3", C3: "C3",
    };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D5", "=CHOOSEROWS(A1:C3, D1:E2, 2)");
    expect(getRangeValuesAsMatrix(model, "D5:F9")).toEqual([
      ["A1", "B1", "C1"],
      ["A2", "B2", "C2"],
      ["A3", "B3", "C3"],
      ["A1", "B1", "C1"],
      ["A2", "B2", "C2"],
    ]);
  });

  test("Undefined values are transformed to zeroes", () => {
    const grid = { A1: "A1", B1: "B1", C1: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=CHOOSEROWS(A1:C1, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:F1")).toEqual([["A1", "B1", "0"]]);
  });
});

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

describe("FLATTEN function", () => {
  test("FLATTEN takes 1 at least arguments", () => {
    expect(evaluateCell("A1", { A1: "=FLATTEN()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=FLATTEN(B1:C2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=FLATTEN(B1:C2, B1:C2)" })).toBe(0);
  });

  test("Flatten a column returns the column", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FLATTEN(A1:A3)");
    expect(getRangeValuesAsMatrix(model, "D1:D3")).toEqual([["A1"], ["A2"], ["A3"]]);
  });

  test("Flatten a row", () => {
    const grid = { A1: "A1", B1: "B1", C1: "C1" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FLATTEN(A1:C1)");
    expect(getRangeValuesAsMatrix(model, "D1:D3")).toEqual([["A1"], ["B1"], ["C1"]]);
  });

  test("Flatten a range goes row-first", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FLATTEN(A1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:D6")).toEqual([
      ["A1"],
      ["B1"],
      ["C1"],
      ["A2"],
      ["B2"],
      ["C2"],
    ]);
  });

  test("Flatten a range with undefined values transform them to zeroes", () => {
    const grid = { A1: "A1", A2: undefined, B1: undefined, B2: "B2", C1: "C1", C2: "C2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FLATTEN(A1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:D6")).toEqual([
      ["A1"],
      ["0"],
      ["C1"],
      ["0"],
      ["B2"],
      ["C2"],
    ]);
  });

  test("Flatten multiple ranges", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", D1: "D1", D2: "D2" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "E1", "=FLATTEN(A1:B2, D1:D2)");
    expect(getRangeValuesAsMatrix(model, "E1:E6")).toEqual([
      ["A1"],
      ["B1"],
      ["A2"],
      ["B2"],
      ["D1"],
      ["D2"],
    ]);
  });
});

describe("FREQUENCY function", () => {
  test("FREQUENCY takes 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=FREQUENCY()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=FREQUENCY(B1:B5)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=FREQUENCY(B1:B5, C1:C3)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=FREQUENCY(B1:B5, C1:C3, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Frequency with single class test", () => {
    const grid = { A1: "1", A2: "2", A3: "3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FREQUENCY(A1:A3, A1)");
    expect(getRangeValues(model, "D1:D2")).toEqual([
      1, // els <= 1
      2, // els > 1
    ]);

    setCellContent(model, "D1", "=FREQUENCY(A1:A3, 1)");
    expect(getRangeValues(model, "D1:D2")).toEqual([
      1, // els <= 1
      2, // els > 1
    ]);
  });

  test("Simple frequency test", () => {
    //prettier-ignore
    const grid = {
      A1: "1", C1: "1",
      A2: "2", C2: "3",
      A3: "3", C3: "5",
      A4: "4",
      A5: "5",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FREQUENCY(A1:A6, C1:C3)");
    expect(getRangeValues(model, "D1:D4")).toEqual([
      1, // els <= 1
      2, // 1 < els <= 3
      2, // 3 < els <= 5
      0, // 5 < els
    ]);
  });

  test("Classes order is preserved", () => {
    //prettier-ignore
    const grid = {
      A1: "1", C1: "3",
      A2: "2", C2: "1",
      A3: "3", C3: "5",
      A4: "4",
      A5: "5",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FREQUENCY(A1:A6, C1:C3)");
    expect(getRangeValues(model, "D1:D4")).toEqual([2, 1, 2, 0]);
  });

  test("Classes order is row-first", () => {
    //prettier-ignore
    const grid = {
      A1: "1", C1: "3", D1: "1",
      A2: "2", C2: "5",
      A3: "3",
      A4: "4",
      A5: "5",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "E1", "=FREQUENCY(A1:A6, C1:D2)");
    expect(getRangeValues(model, "E1:E4")).toEqual([2, 1, 2, 0]);
  });

  test("Data can be multidimensional range", () => {
    //prettier-ignore
    const grid = {
      A1: "1", B1: "1", C1: "3",
      A2: "2", B2: "2", C2: "1",
      A3: "3", B3: "3", C3: "5",
      A4: "4", B4: "4",
      A5: "5", B5: "6",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FREQUENCY(A1:B6, C1:C3)");
    expect(getRangeValues(model, "D1:D4")).toEqual([4, 2, 3, 1]);
  });

  test("Non-number values are ignored", () => {
    //prettier-ignore
    const grid = {
      A1: "1",        B1: "1",    C1: "3",
      A2: "2",        B2: "2",    C2: "1",
      A3: "3",        B3: "3",    C3: "5",
      A4: "4",        B4: "4",    C4 : "geronimo",
      A5: "5",        B5: "6",    C5 : undefined,
      A6 : "hello",   B6 : "true",
      A7 : undefined, B7 : "=A6",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=FREQUENCY(A1:B7, C1:C5)");
    expect(getRangeValues(model, "D1:D4")).toEqual([4, 2, 3, 1]);
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
