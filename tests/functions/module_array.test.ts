import { setCellContent, setFormat } from "../test_helpers/commands_helpers";
import { getCellContent, getEvaluatedCell, getRangeValues } from "../test_helpers/getters_helpers";
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

describe("MDETERM function", () => {
  test("MDETERM takes 1 arguments", () => {
    expect(evaluateCell("A1", { A1: "=MDETERM()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=MDETERM(1)" })).toBe(1);
    expect(evaluateCell("A1", { A1: "=MDETERM(1, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Argument must be a square matrix", () => {
    const grid = { A1: "1", B1: "0", A2: "0", B2: "1" };
    expect(evaluateCell("D1", { D1: "=MDETERM(A1:B1)", ...grid })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("D1", { D1: "=MDETERM(A1:A2)", ...grid })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Argument must only contain number, or values convertibale to number", () => {
    expect(evaluateCell("D1", { D1: "=MDETERM(D2)", D2: "hello" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
  });

  test("Determinant of 1x1 matrix", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MDETERM(A1)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(5);

    setCellContent(model, "D1", "=MDETERM(5)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(5);
  });

  test("Determinant of matrices", () => {
    //prettier-ignore
    let grid = {
      A1: "1", B1: "1", C1: "0",
      A2: "1", B2: "1", C2: "1",
      A3: "0", B3: "2", C3: "0",
     };
    let model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MDETERM(A1:C3)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(-2);

    //prettier-ignore
    grid = {
      A1: "1", B1: "1", C1: "0",
      A2: "0", B2: "2", C2: "0",
      A3: "1", B3: "1", C3: "1",
     };
    model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MDETERM(A1:C3)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(2);

    //prettier-ignore
    grid = {
        A1: "-51", B1: "-1", C1: "56",
        A2: "12", B2: "-2", C2: "18",
        A3: "-100", B3: "1", C3: "25.65",
    };
    model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MDETERM(A1:C3)");
    expect(getEvaluatedCell(model, "D1").value).toBeCloseTo(-4885.9);
  });
});

describe("MINVERSE function", () => {
  test("MINVERSE takes 1 arguments", () => {
    expect(evaluateCell("A1", { A1: "=MINVERSE()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=MINVERSE(1)" })).toBe(1);
    expect(evaluateCell("A1", { A1: "=MINVERSE(1, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Argument must be a square matrix", () => {
    const grid = { A1: "1", B1: "0", A2: "0", B2: "1" };
    expect(evaluateCell("D1", { D1: "=MINVERSE(A1:B1)", ...grid })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("D1", { D1: "=MINVERSE(A1:A2)", ...grid })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Argument must be an invertible matrix", () => {
    const grid = { A1: "1", B1: "1", A2: "1", B2: "1" };
    expect(evaluateCell("D1", { D1: "=MINVERSE(0)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
    expect(evaluateCell("D1", { D1: "=MINVERSE(A1:B2)", ...grid })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
  });

  test("Argument must only contain number, or values convertibale to number", () => {
    expect(evaluateCell("D1", { D1: "=MINVERSE(D2)", D2: "hello" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
  });

  test("Invert 1x1 matrix", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MINVERSE(A1)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(1 / 5);

    setCellContent(model, "D1", "=MINVERSE(5)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(1 / 5);
  });

  test("Invert matrices", () => {
    //prettier-ignore
    let grid = {
      A1: "1", B1: "1", C1: "0",
      A2: "1", B2: "1", C2: "1",
      A3: "0", B3: "2", C3: "0",
     };
    let model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MINVERSE(A1:C3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["1", "0", "-0.5"],
      ["0", "0", "0.5"],
      ["-1", "1", "0"],
    ]);

    //prettier-ignore
    grid = {
      A1: "-5", B1: "1", C1: "0",
      A2: "1", B2: "6", C2: "1",
      A3: "0", B3: "1", C3: "0",
     };
    model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MINVERSE(A1:C3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["-0.2", "0", "0.2"],
      ["0", "0", "1"],
      ["0.2", "1", "-6.2"],
    ]);
  });
});

describe("MMULT function", () => {
  test("MMULT takes 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=MMULT()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=MMULT(1)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=MMULT(1, 1)" })).toBe(1);
    expect(evaluateCell("A1", { A1: "=MMULT(1, 1, 1)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Sizes of the matrices should allow for matrix multiplication", () => {
    expect(evaluateCell("D1", { D1: "=MMULT(A1:A2, A1:A2)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
    expect(evaluateCell("D1", { D1: "=MMULT(A1:B1, A1:B1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
    expect(evaluateCell("D1", { D1: "=MMULT(A1:A2, A1:B2)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
  });

  test("Argument must only contain number, or values convertibale to number", () => {
    expect(evaluateCell("D1", { D1: "=MMULT(D2, D2)", D2: "hello" })).toBe("#ERROR"); // @compatibility: on google sheets, return #NUM!
  });

  test("Multiply 1x1 matrices", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MMULT(A1, A1)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(25);

    setCellContent(model, "D1", "=MMULT(5, 5)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(25);
  });

  test("Invert matrices", () => {
    //prettier-ignore
    const grid = {
      A1: "1", B1: "2", C1: "3",
      A2: "4", B2: "5", C2: "6",
      A3: "7", B3: "8", C3: "9",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=MMULT(A1:C3, A1:C3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["30", "36", "42"],
      ["66", "81", "96"],
      ["102", "126", "150"],
    ]);

    setCellContent(model, "D1", "=MMULT(A1:C3, A1:A3)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["30", "", ""],
      ["66", "", ""],
      ["102", "", ""],
    ]);

    setCellContent(model, "D1", "=MMULT(A1:B1, A1:C2)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["9", "12", "15"],
      ["", "", ""],
      ["", "", ""],
    ]);

    setCellContent(model, "D1", "=MMULT(A1:A3, A1:C1)");
    expect(getRangeValuesAsMatrix(model, "D1:F3")).toEqual([
      ["1", "2", "3"],
      ["4", "8", "12"],
      ["7", "14", "21"],
    ]);
  });
});

describe("SUMPRODUCT function", () => {
  test("SUMPRODUCT takes at least 1 argument", () => {
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(5)" })).toBe(5);
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(5, 5)" })).toBe(25);
  });

  test("Values must be numbers, or range of numbers", () => {
    expect(evaluateCell("A1", { A1: '=SUMPRODUCT("hallo")' })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(B1:B2, B1:B2)", B1: "hey", B2: "yo" })).toBe(
      "#ERROR"
    ); // @compatibility: on google sheets, return #VALUE!
  });

  test("Range values must have the same dimensions", () => {
    expect(evaluateCell("D1", { D1: "=SUMPRODUCT(A1:A2, A1:B1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("D1", { D1: "=SUMPRODUCT(A1:A2, A1:A3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("SUMPRODUCT with numbers arguments", () => {
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(6)" })).toBe(6);
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(6, 5)" })).toBe(30);
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(6, 5, 10)" })).toBe(300);
    expect(evaluateCell("A1", { A1: "=SUMPRODUCT(6, 5, B1)", B1: "10" })).toBe(300);
  });

  test("SUMPRODUCT with ranges", () => {
    //prettier-ignore
    const grid = {
      A1: "1", B1: "2", C1: "3",
      A2: "4", B2: "5", C2: "6",
      A3: "7", B3: "8", C3: "9",
     };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMPRODUCT(A1:A3, B1:B3)");
    expect(getCellContent(model, "D1")).toBe((1 * 2 + 4 * 5 + 7 * 8).toString());

    setCellContent(model, "D1", "=SUMPRODUCT(A1:B2, B2:C3)");
    expect(getCellContent(model, "D1")).toBe((1 * 5 + 2 * 6 + 4 * 8 + 5 * 9).toString());
  });

  test("Undefined values are replaced by zeroes", () => {
    const grid = { A1: "1", A2: "6", B1: "5", B2: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMPRODUCT(A1:A2, B1:B2)");
    expect(getCellContent(model, "D1")).toBe("5");
  });
});

describe("SUMX2MY2 function", () => {
  test("SUMX2MY2 takes 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=SUMX2MY2()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2MY2(5)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2MY2(5, 5)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=SUMX2MY2(5, 5, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("2 arguments must have the same dimensions", () => {
    expect(evaluateCell("A1", { A1: "=SUMX2MY2(B1, B1:D3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2MY2(B1:B2, B1:C1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
  });

  test("On single cell", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMX2MY2(6, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe(36 - 16);

    setCellContent(model, "D1", "=SUMX2MY2(A1, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe(25 - 16);
  });

  test("On range", () => {
    const grid = { A1: "1", A2: "2", A3: "3", B1: "4", B2: "5", B3: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMX2MY2(A1:A3, B1:B3)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(-63);
  });

  test("On multidimensional range", () => {
    const grid = { A1: "1", A2: "2", B1: "3", C1: "4", C2: "5", D1: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "E1", "=SUMX2MY2(A1:B2, C1:D2)");
    expect(getEvaluatedCell(model, "E1").value).toEqual(-63);
  });
});

describe("SUMX2PY2 function", () => {
  test("SUMX2PY2 takes 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=SUMX2PY2()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2PY2(5)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2PY2(5, 5)" })).toBe(50);
    expect(evaluateCell("A1", { A1: "=SUMX2PY2(5, 5, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("2 arguments must have the same dimensions", () => {
    expect(evaluateCell("A1", { A1: "=SUMX2PY2(B1, B1:D3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMX2PY2(B1:B2, B1:C1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
  });

  test("On single cell", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMX2PY2(6, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe(36 + 16);

    setCellContent(model, "D1", "=SUMX2PY2(A1, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe(25 + 16);
  });

  test("On range", () => {
    const grid = { A1: "1", A2: "2", A3: "3", B1: "4", B2: "5", B3: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMX2PY2(A1:A3, B1:B3)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(91);
  });

  test("On multidimensional range", () => {
    const grid = { A1: "1", A2: "2", B1: "3", C1: "4", C2: "5", D1: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "E1", "=SUMX2PY2(A1:B2, C1:D2)");
    expect(getEvaluatedCell(model, "E1").value).toEqual(91);
  });
});

describe("SUMXMY2 function", () => {
  test("SUMXMY2 takes 2 arguments", () => {
    expect(evaluateCell("A1", { A1: "=SUMXMY2()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMXMY2(5)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMXMY2(5, 5)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=SUMXMY2(5, 5, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("2 arguments must have the same dimensions", () => {
    expect(evaluateCell("A1", { A1: "=SUMXMY2(B1, B1:D3)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=SUMXMY2(B1:B2, B1:C1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #N/A
  });

  test("On single cell", () => {
    const grid = { A1: "5" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMXMY2(6, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe((6 - 4) ** 2);

    setCellContent(model, "D1", "=SUMXMY2(A1, 4)");
    expect(getEvaluatedCell(model, "D1").value).toBe((5 - 4) ** 2);
  });

  test("On range", () => {
    const grid = { A1: "1", A2: "2", A3: "3", B1: "4", B2: "5", B3: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=SUMXMY2(A1:A3, B1:B3)");
    expect(getEvaluatedCell(model, "D1").value).toEqual(27);
  });

  test("On multidimensional range", () => {
    const grid = { A1: "1", A2: "2", B1: "3", C1: "4", C2: "5", D1: "6" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "E1", "=SUMXMY2(A1:B2, C1:D2)");
    expect(getEvaluatedCell(model, "E1").value).toEqual(27);
  });
});

describe("TOCOL function", () => {
  test("TOCOL takes 1-3 arguments", () => {
    expect(evaluateCell("A1", { A1: "=TOCOL()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 0, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 0, 0, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Argument ignore must be between 0 and 3", () => {
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, -1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 1)" })).toBe("");
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 3)" })).toBe("");
    expect(evaluateCell("A1", { A1: "=TOCOL(B1:B5, 4)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Simple TOCOL call", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOCOL(A1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:D6")).toEqual([
      ["A1"],
      ["B1"],
      ["A2"],
      ["B2"],
      ["A3"],
      ["B3"],
    ]);
  });

  test("TOCOL: undefined values are replaced by zeroes", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOCOL(A1:B2)");
    expect(getRangeValuesAsMatrix(model, "D1:D4")).toEqual([["A1"], ["B1"], ["A2"], ["0"]]);
  });

  test("Argument ignore", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: undefined };
    const model = getModelFromGrid(grid);
    // ignore=0, keep all
    setCellContent(model, "D1", "=TOCOL(A1:B2, 0)");
    expect(getRangeValuesAsMatrix(model, "D1:D4")).toEqual([["A1"], ["B1"], ["A2"], ["0"]]);
    // ignore=1, ignore empty cells
    setCellContent(model, "D1", "=TOCOL(A1:B2, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:D4")).toEqual([["A1"], ["B1"], ["A2"], [""]]);
    // ignore=3, ignore empty cells
    setCellContent(model, "D1", "=TOCOL(A1:B2, 3)");
    expect(getRangeValuesAsMatrix(model, "D1:D4")).toEqual([["A1"], ["B1"], ["A2"], [""]]);
  });

  test("Argument scan_by_column", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOCOL(A1:B3, 0, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:D6")).toEqual([
      ["A1"],
      ["A2"],
      ["A3"],
      ["B1"],
      ["B2"],
      ["B3"],
    ]);
  });
});

describe("TOROW function", () => {
  test("TOROW takes 1-3 arguments", () => {
    expect(evaluateCell("A1", { A1: "=TOROW()" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 0, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 0, 0, 0)" })).toBe("#BAD_EXPR"); // @compatibility: on google sheets, return #N/A
  });

  test("Argument ignore must be between 0 and 3", () => {
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, -1)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 0)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 1)" })).toBe("");
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 2)" })).toBe(0);
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 3)" })).toBe("");
    expect(evaluateCell("A1", { A1: "=TOROW(B1:B5, 4)" })).toBe("#ERROR"); // @compatibility: on google sheets, return #VALUE!
  });

  test("Simple TOROW call", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOROW(A1:B3)");
    expect(getRangeValuesAsMatrix(model, "D1:I1")).toEqual([["A1", "B1", "A2", "B2", "A3", "B3"]]);
  });

  test("TOROW: undefined values are replaced by zeroes", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: undefined };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOROW(A1:B2)");
    expect(getRangeValuesAsMatrix(model, "D1:G1")).toEqual([["A1", "B1", "A2", "0"]]);
  });

  test("Argument ignore", () => {
    const grid = { A1: "A1", A2: "A2", B1: "B1", B2: undefined };
    const model = getModelFromGrid(grid);
    // ignore=0, keep all
    setCellContent(model, "D1", "=TOROW(A1:B2, 0)");
    expect(getRangeValuesAsMatrix(model, "D1:G1")).toEqual([["A1", "B1", "A2", "0"]]);
    // ignore=1, ignore empty cells
    setCellContent(model, "D1", "=TOROW(A1:B2, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:G1")).toEqual([["A1", "B1", "A2", ""]]);
    // ignore=3, ignore empty cells
    setCellContent(model, "D1", "=TOROW(A1:B2, 3)");
    expect(getRangeValuesAsMatrix(model, "D1:G1")).toEqual([["A1", "B1", "A2", ""]]);
  });

  test("Argument scan_by_column", () => {
    const grid = { A1: "A1", A2: "A2", A3: "A3", B1: "B1", B2: "B2", B3: "B3" };
    const model = getModelFromGrid(grid);
    setCellContent(model, "D1", "=TOROW(A1:B3, 0, 1)");
    expect(getRangeValuesAsMatrix(model, "D1:I1")).toEqual([["A1", "A2", "A3", "B1", "B2", "B3"]]);
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
