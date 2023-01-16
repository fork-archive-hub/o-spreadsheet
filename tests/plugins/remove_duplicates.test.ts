import { Model } from "../../src";
import { getCell, getEvaluatedCell } from "../test_helpers";
import { selectCell, setFormat, setSelection } from "../test_helpers/commands_helpers";

let model: Model;

describe("remove duplicates", () => {
  beforeEach(() => {
    // prettier-ignore
    const cells = {
        A2: { content: "1" }, B2: { content: "42" }, C2: { content: "C2" }, 
        A3: { content: "1" }, B3: { content: "42" }, C3: { content: "C3" }, 
        A4: { content: "2" }, B4: { content: "42" }, C4: { content: "C4" }, 
        A5: { content: "2" }, B5: { content: "42" }, C5: { content: "C5" }, 
        A6: { content: "3" }, B6: { content: "42" }, C6: { content: "C6" }, 
        A7: { content: "3" }, B7: { content: "42" }, C7: { content: "C7" }, 

        A8: { content: "=A6+1" }, B8: { content: "42" }, C8: { content: "C8" }, 
        A9: { content: "4" }, B9: { content: "42" }, C9: { content: "C9" }, 
    };
    model = new Model({ sheets: [{ id: "42", colNumber: 4, rowNumber: 10, cells: cells }] });
  });

  test("can remove duplicate", () => {
    setSelection(model, ["A2:A7"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "A2").value).toBe(1);
    expect(getEvaluatedCell(model, "A3").value).toBe(2);
    expect(getEvaluatedCell(model, "A4").value).toBe(3);
    expect(getEvaluatedCell(model, "A5").value).toBe("");
    expect(getEvaluatedCell(model, "A6").value).toBe("");
    expect(getEvaluatedCell(model, "A7").value).toBe("");
  });

  test("apply deletion only in selected zone", () => {
    setSelection(model, ["B3:B6"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [1], hasHeader: false });

    expect(getEvaluatedCell(model, "B2").value).toBe(42);
    expect(getEvaluatedCell(model, "B3").value).toBe(42);
    expect(getEvaluatedCell(model, "B4").value).toBe("");
    expect(getEvaluatedCell(model, "B5").value).toBe("");
    expect(getEvaluatedCell(model, "B6").value).toBe("");
    expect(getEvaluatedCell(model, "B7").value).toBe(42);

    expect(getEvaluatedCell(model, "A5").value).toBe(2);
    expect(getEvaluatedCell(model, "C5").value).toBe("C5");
  });

  test("remove duplicates based on columns to analyze", () => {
    setSelection(model, ["A2:B7"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [1], hasHeader: false });

    expect(getEvaluatedCell(model, "A2").value).toBe(1);
    expect(getEvaluatedCell(model, "A3").value).toBe("");
    expect(getEvaluatedCell(model, "A4").value).toBe("");
    expect(getEvaluatedCell(model, "A5").value).toBe("");
    expect(getEvaluatedCell(model, "A6").value).toBe("");
    expect(getEvaluatedCell(model, "A7").value).toBe("");

    expect(getEvaluatedCell(model, "B2").value).toBe(42);
    expect(getEvaluatedCell(model, "B3").value).toBe("");
    expect(getEvaluatedCell(model, "B4").value).toBe("");
    expect(getEvaluatedCell(model, "B5").value).toBe("");
    expect(getEvaluatedCell(model, "B6").value).toBe("");
    expect(getEvaluatedCell(model, "B7").value).toBe("");

    expect(getEvaluatedCell(model, "C5").value).toBe("C5");
  });

  test("return elements of the first unique rows finding", () => {
    setSelection(model, ["A2:C7"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "C2").value).toBe("C2");
    expect(getEvaluatedCell(model, "C3").value).toBe("C4");
    expect(getEvaluatedCell(model, "C4").value).toBe("C6");
  });

  test("when formula take into account the evaluated cell value", () => {
    setSelection(model, ["A2:C7"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "C2").value).toBe("C2");
    expect(getEvaluatedCell(model, "C3").value).toBe("C4");
    expect(getEvaluatedCell(model, "C4").value).toBe("C6");
  });

  test("when formula, take into account the evaluated cell value", () => {
    setSelection(model, ["A8:A9"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "A8").value).toBe(4);
    expect(getEvaluatedCell(model, "A9").value).toBe("");
  });

  test("when formula, update the references", () => {
    setSelection(model, ["A2:A9"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "A2").value).toBe(1);
    expect(getEvaluatedCell(model, "A3").value).toBe(2);
    expect(getEvaluatedCell(model, "A4").value).toBe(3);

    expect(getEvaluatedCell(model, "A5").value).toBe(3);
    expect(getCell(model, "A5")!.content).toBe("=A3+1");

    expect(getEvaluatedCell(model, "A6").value).toBe("");
    expect(getEvaluatedCell(model, "A7").value).toBe("");

    expect(getEvaluatedCell(model, "A8").value).toBe("");
    expect(getCell(model, "A8")).toBe(undefined);

    expect(getEvaluatedCell(model, "A9").value).toBe("");
  });

  test("dont take into account the format", () => {
    selectCell(model, "B2");
    setFormat(model, "0.00%");

    selectCell(model, "B4");
    setFormat(model, "#,##0[$€]");

    expect(getEvaluatedCell(model, "B2").value).toBe(42);
    expect(getEvaluatedCell(model, "B2").format).toBe("0.00%");

    expect(getEvaluatedCell(model, "B3").value).toBe(42);
    expect(getEvaluatedCell(model, "B3").format).toBe(undefined);

    expect(getEvaluatedCell(model, "B4").value).toBe(42);
    expect(getEvaluatedCell(model, "B4").format).toBe("#,##0[$€]");

    setSelection(model, ["B2:B4"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [1], hasHeader: false });

    expect(getEvaluatedCell(model, "B2").value).toBe(42);
    expect(getEvaluatedCell(model, "B2").format).toBe("0.00%");

    expect(getEvaluatedCell(model, "B3").value).toBe("");
    expect(getEvaluatedCell(model, "B3").format).toBe(undefined);

    expect(getEvaluatedCell(model, "B4").value).toBe("");
    expect(getEvaluatedCell(model, "B4").format).toBe(undefined);
  });

  test("can not remove duplicate with more than one selection", () => {
    const cells = {
      A1: { content: "24" },
      A4: { content: "42" },
      A6: { content: "242" },
    };
    model = new Model({ sheets: [{ id: "42", colNumber: 1, rowNumber: 5, cells: cells }] });

    setSelection(model, ["A1:A6"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: false });

    expect(getEvaluatedCell(model, "A1").value).toBe(24);
    expect(getEvaluatedCell(model, "A2").value).toBe("");
    expect(getEvaluatedCell(model, "A3").value).toBe(42);
    expect(getEvaluatedCell(model, "A4").value).toBe(242);
    expect(getEvaluatedCell(model, "A5").value).toBe("");
    expect(getEvaluatedCell(model, "A6").value).toBe("");
  });

  test("can remove duplicates with header", () => {
    // prettier-ignore
    const cells = {
      A1: { content: "42" }, B1: { content: "Michel Blanc" },
      A2: { content: "24" }, B2: { content: "Michel Noir" },
      A3: { content: "42" }, B3: { content: "Michel Noir" },
      A4: { content: "24" }, B4: { content: "Michel Blanc" },
  };
    model = new Model({ sheets: [{ id: "42", cells: cells }] });

    setSelection(model, ["A1:A4"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [0], hasHeader: true });
    expect(getEvaluatedCell(model, "A1").value).toBe(42);
    expect(getEvaluatedCell(model, "A2").value).toBe(24);
    expect(getEvaluatedCell(model, "A3").value).toBe(42);
    expect(getEvaluatedCell(model, "A4").value).toBe("");

    setSelection(model, ["B1:B4"]);
    model.dispatch("REMOVE_DUPLICATES", { columnsToAnalyze: [1], hasHeader: true });
    expect(getEvaluatedCell(model, "B1").value).toBe("Michel Blanc");
    expect(getEvaluatedCell(model, "B2").value).toBe("Michel Noir");
    expect(getEvaluatedCell(model, "B3").value).toBe("Michel Blanc");
    expect(getEvaluatedCell(model, "B4").value).toBe("");
  });
});
