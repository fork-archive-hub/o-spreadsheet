import { CorePlugin } from "../../src";
import {
  BACKGROUND_CHART_COLOR,
  DEFAULT_CELL_HEIGHT,
  DEFAULT_CELL_WIDTH,
  DEFAULT_REVISION_ID,
  FORBIDDEN_SHEET_CHARS,
} from "../../src/constants";
import { CURRENT_VERSION } from "../../src/data";
import { Model } from "../../src/model";
import { corePluginRegistry } from "../../src/plugins";
import { BorderDescr, ColorScaleRule, IconSetRule, WorkbookData } from "../../src/types/index";
import {
  activateSheet,
  resizeColumns,
  resizeRows,
  setCellContent,
} from "../test_helpers/commands_helpers";
import { getCellContent, getMerges } from "../test_helpers/getters_helpers";
import "../test_helpers/helpers";
import { mockUuidV4To, toPosition } from "../test_helpers/helpers";

describe("data", () => {
  test("give default col size if not specified", () => {
    const model = new Model();
    const sheet = model.getters.getActiveSheetId();
    // 96 is default cell width
    expect(model.getters.getCol(sheet, 0)!.size).toEqual(DEFAULT_CELL_WIDTH);
    expect(model.getters.getCol(sheet, 1)!.size).toEqual(DEFAULT_CELL_WIDTH);
  });
});

describe("Migrations", () => {
  test("Can upgrade from 1 to 9", () => {
    mockUuidV4To(333);
    const model = new Model({
      version: 1,
      sheets: [
        {
          colNumber: 2,
          rowNumber: 2,
          cols: {
            0: { size: 42 },
          },
          rows: {
            0: { size: 12 },
          },
          cells: { A1: { content: "=a1" } },
          name: "My sheet",
          conditionalFormats: [],
        },
      ],
    });
    const data = model.exportData();
    expect(data.version).toBe(9);
    expect(data.sheets[0].id).toBeDefined();
    expect(data.sheets[0].figures).toBeDefined();
    expect(data.sheets[0].cells.A1!.formula).toBeDefined();
    expect(data.sheets[0].cells.A1!.formula!.text).toBeDefined();
    expect(data.sheets[0].cells.A1!.formula!.dependencies).toBeDefined();
  });
  test("migration 6 to 9: charts", () => {
    mockUuidV4To(333);
    const model = new Model({
      version: 6,
      sheets: [
        {
          colNumber: 2,
          rowNumber: 2,
          cols: {
            0: { size: 42 },
          },
          rows: {
            0: { size: 12 },
          },
          cells: { A1: { content: "=a1" } },
          name: "My sheet",
          conditionalFormats: [],
          figures: [
            {
              id: "1",
              tag: "chart",
              width: 400,
              height: 300,
              x: 100,
              y: 100,
              data: {
                type: "line",
                title: "demo chart",
                labelRange: "My sheet!A27:A35",
                dataSets: [
                  { labelCell: "My sheet!B26", dataRange: "My sheet!B27:B35" },
                  { labelCell: "My sheet!C26", dataRange: "My sheet!C27:C35" },
                ],
              },
            },
            {
              id: "2",
              tag: "chart",
              width: 400,
              height: 300,
              x: 600,
              y: 100,
              data: {
                type: "bar",
                title: "demo chart 2",
                labelRange: "My sheet!A27:A35",
                dataSets: [
                  { labelCell: undefined, dataRange: "My sheet!B27:B35" },
                  { dataRange: "My sheet!C27:C35" },
                ],
              },
            },
            {
              id: "3",
              tag: "chart",
              width: 400,
              height: 300,
              x: 100,
              y: 500,
              data: {
                type: "bar",
                title: "demo chart 3",
                labelRange: "My sheet!A27",
                dataSets: [{ labelCell: "My sheet!B26", dataRange: "My sheet!B27" }],
              },
            },
            {
              id: "4",
              tag: "chart",
              width: 400,
              height: 300,
              x: 600,
              y: 500,
              data: {
                type: "bar",
                title: "demo chart 4",
                labelRange: "My sheet!A27",
                dataSets: [{ dataRange: "My sheet!B27" }],
              },
            },
          ],
        },
      ],
    });
    const data = model.exportData();
    expect(data.sheets[0].figures[0].data).toEqual({
      type: "line",
      title: "demo chart",
      labelRange: "'My sheet'!A27:A35",
      dataSets: ["B26:B35", "C26:C35"],
      dataSetsHaveTitle: true,
      background: BACKGROUND_CHART_COLOR,
      verticalAxisPosition: "left",
      legendPosition: "top",
      stackedBar: false,
    });
    expect(data.sheets[0].figures[1].data).toEqual({
      type: "bar",
      title: "demo chart 2",
      labelRange: "'My sheet'!A27:A35",
      dataSets: ["B27:B35", "C27:C35"],
      dataSetsHaveTitle: false,
      background: BACKGROUND_CHART_COLOR,
      verticalAxisPosition: "left",
      legendPosition: "top",
      stackedBar: false,
    });
    expect(data.sheets[0].figures[2].data).toEqual({
      type: "bar",
      title: "demo chart 3",
      labelRange: "'My sheet'!A27",
      dataSets: ["B26:B27"],
      dataSetsHaveTitle: true,
      background: BACKGROUND_CHART_COLOR,
      verticalAxisPosition: "left",
      legendPosition: "top",
      stackedBar: false,
    });
    expect(data.sheets[0].figures[3].data).toEqual({
      type: "bar",
      title: "demo chart 4",
      labelRange: "'My sheet'!A27",
      dataSets: ["B27"],
      dataSetsHaveTitle: false,
      background: BACKGROUND_CHART_COLOR,
      verticalAxisPosition: "left",
      legendPosition: "top",
      stackedBar: false,
    });
  });
  test.each(FORBIDDEN_SHEET_CHARS)("migration 7 to 8: sheet Names", (char) => {
    const model = new Model({
      version: 7,
      sheets: [
        { name: "My sheet" },
        {
          name: `sheetName${char}`,
          cells: {
            A1: {
              formula: {
                text: "=|0|",
                dependencies: [`sheetName${char}!A2`],
              },
            },
          },
          figures: [
            {
              id: "1",
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              type: "chart",
              data: {
                dataSets: [`=sheetName${char}!A1:A2`, "My sheet!A1:A2"],
                dataSetsHaveTitle: true,
                labelRange: `=sheetName${char}!B1:B2`,
                type: "bar",
              },
            },
          ],
          conditionalFormats: [
            {
              id: 1,
              ranges: [`=sheetName${char}!A1:A2`],
              rule: {
                type: "ColorScaleRule",
                maximum: { type: "formula", value: `=sheetName${char}!B1`, color: 16711680 },
                midpoint: { type: "formula", value: `=sheetName${char}!B1`, color: 16711680 },
                minimum: { type: "formula", value: `=sheetName${char}!B1`, color: 16711680 },
              },
            },
            {
              id: 2,
              ranges: ["D5:D6"],
              rule: {
                type: "IconSetRule",
                icons: { upper: "arrowGood", middle: "dotNeutral", lower: "arrowBad" },
                lowerInflectionPoint: {
                  type: "formula",
                  value: `=sheetName${char}!B1`,
                  operator: "gt",
                },
                upperInflectionPoint: {
                  type: "formula",
                  value: `=sheetName${char}!B1`,
                  operator: "gt",
                },
              },
            },
            {
              id: 3,
              ranges: [`=sheetName${char}!A1:A2`],
              rule: {
                type: "ColorScaleRule",
                minimum: { type: "percentage", value: "33", color: 16711680 },
                midpoint: { type: "number", value: "13", color: 16711680 },
                maximum: { type: "value", color: 16711680 },
              },
            },
          ],
        },
      ],
    });
    const data = model.exportData();
    expect(data.sheets[0].name).toBe("My sheet");
    expect(data.sheets[1].name).toBe("sheetName_");

    const cells = data.sheets[1].cells;
    expect(cells.A1!.formula).toEqual({
      dependencies: ["sheetName_!A2"],
      text: "=|0|",
      value: "Loading...",
    });

    const figures = data.sheets[1].figures;
    expect(figures[0].data?.dataSets).toEqual(["=sheetName_!A1:A2", "My sheet!A1:A2"]);
    expect(figures[0].data?.labelRange).toBe("=sheetName_!B1:B2");

    const cfs = data.sheets[1].conditionalFormats;
    const rule1 = cfs[0].rule as ColorScaleRule;
    expect(cfs[0].ranges).toEqual(["=sheetName_!A1:A2"]);
    expect(rule1.minimum.value).toEqual("=sheetName_!B1");
    expect(rule1.midpoint?.value).toEqual("=sheetName_!B1");
    expect(rule1.maximum.value).toEqual("=sheetName_!B1");

    const rule2 = cfs[1].rule as IconSetRule;
    expect(cfs[1].ranges).toEqual(["D5:D6"]);
    expect(rule2.lowerInflectionPoint.value).toEqual("=sheetName_!B1");
    expect(rule2.upperInflectionPoint.value).toEqual("=sheetName_!B1");

    const rule3 = cfs[2].rule as ColorScaleRule;
    expect(cfs[2].ranges).toEqual(["=sheetName_!A1:A2"]);
    expect(rule3.minimum.value).toEqual("33");
    expect(rule3.midpoint?.value).toEqual("13");
    expect(rule3.maximum.value).toBeUndefined();
  });

  test("migration 7 to 8: duplicated sheet Names without forbidden characters", () => {
    const model = new Model({
      version: 7,
      sheets: [
        { name: "My sheet?" },
        { name: "My sheet]" },
        { name: "My sheet[" },
        { name: "?" },
        { name: "*" },
        { name: "__" },
        { name: "[]" },
      ],
    });
    const data = model.exportData();
    expect(data.sheets[0].name).toBe("My sheet_");
    expect(data.sheets[1].name).toBe("My sheet_1");
    expect(data.sheets[2].name).toBe("My sheet_2");
    expect(data.sheets[3].name).toBe("_");
    expect(data.sheets[4].name).toBe("_1");
    expect(data.sheets[5].name).toBe("__");
    expect(data.sheets[6].name).toBe("__1");
  });
});

describe("Import", () => {
  test("Import sheet with rows/cols size defined.", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 2,
          rowNumber: 2,
          cols: {
            0: { size: 42 },
          },
          rows: {
            1: { size: 13 },
          },
        },
      ],
    });
    const sheet = model.getters.getActiveSheetId();
    expect(model.getters.getCol(sheet, 0)!.size).toBe(42);
    expect(model.getters.getCol(sheet, 1)!.size).toBe(DEFAULT_CELL_WIDTH);
    expect(model.getters.getRow(sheet, 0)!.size).toBe(DEFAULT_CELL_HEIGHT);
    expect(model.getters.getRow(sheet, 1)!.size).toBe(13);
  });

  test("Import 2 sheets with merges", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 2,
          rowNumber: 2,
          merges: ["A2:B2"],
        },
        {
          colNumber: 2,
          rowNumber: 2,
        },
      ],
    });
    const sheet1 = model.getters.getVisibleSheets()[0];
    const sheet2 = model.getters.getVisibleSheets()[1];
    activateSheet(model, sheet2);
    expect(Object.keys(getMerges(model))).toHaveLength(0);
    activateSheet(model, sheet1);
    expect(Object.keys(getMerges(model))).toHaveLength(1);
    expect(Object.values(getMerges(model))[0].topLeft).toEqual(toPosition("A2"));
  });
});

describe("Export", () => {
  test("Can export col size", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 10,
          rowNumber: 10,
        },
      ],
    });
    resizeColumns(model, ["B"], 150);
    const exp = model.exportData();
    expect(exp.sheets![0].cols![1].size).toBe(150);
  });

  test("Can export row size", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 10,
          rowNumber: 10,
        },
      ],
    });
    resizeRows(model, [1], 150);
    const exp = model.exportData();
    expect(exp.sheets![0].rows![1].size).toBe(150);
  });

  test("Can export merges", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 10,
          rowNumber: 10,
          merges: ["A1:A2", "B1:C1", "D1:E2"],
        },
      ],
    });
    const exp = model.exportData();
    expect(exp.sheets![0].merges).toHaveLength(3);
  });

  test("Can export format", () => {
    const model = new Model({
      sheets: [
        {
          colNumber: 10,
          rowNumber: 10,
          cells: {
            A1: { content: "145", format: "0.00%" },
          },
        },
      ],
    });
    const exp = model.exportData();
    expect(exp.sheets![0].cells!.A1!.format).toBe("0.00%");
  });
});

test("complete import, then export", () => {
  const modelData = {
    version: CURRENT_VERSION,
    revisionId: DEFAULT_REVISION_ID,
    sheets: [
      {
        id: "someuuid",
        colNumber: 10,
        rowNumber: 10,
        merges: ["A1:A2"],
        cols: {
          0: { size: 42 },
        },
        rows: {
          1: { size: 13 },
        },
        cells: {
          A1: { content: "hello" },
          B1: {
            formula: { text: "=|0|", dependencies: ["A1"], value: "hello" },
            style: 1,
            border: 1,
            format: "0.00%",
          },
          C1: { content: "=mqdlskjfqmslfkj(++%//@@@)" },
          D1: {
            formula: {
              text: '="This is a quote \\""',
              dependencies: [],
              value: 'This is a quote "',
            },
          },
        },
        name: "My sheet",
        conditionalFormats: [],
        figures: [],
        areGridLinesVisible: true,
      },
      {
        id: "someuuid_2",
        colNumber: 10,
        rowNumber: 10,
        merges: [],
        cols: {},
        rows: {},
        cells: {
          A1: { content: "hello" },
        },
        name: "My sheet 2",
        conditionalFormats: [],
        figures: [],
        areGridLinesVisible: false,
      },
    ],
    entities: {},
    styles: {
      1: { bold: true, textColor: "#3A3791", fontSize: 12 },
    },
    borders: {
      1: {
        top: ["thin", "#000"] as BorderDescr,
      },
    },
  };
  const model = new Model(modelData);
  expect(model).toExport(modelData);
  // We test here a that two import with the same data give the same result.
  const model2 = new Model(modelData);
  expect(model2.exportData()).toEqual(modelData);
});

test("Data of a duplicate sheet are correctly duplicated", () => {
  const model = new Model();
  setCellContent(model, "A1", "hello");
  const sheetId = model.getters.getActiveSheetId();
  model.dispatch("DUPLICATE_SHEET", { sheetId, sheetIdTo: "42" });
  expect(getCellContent(model, "A1", sheetId)).toBe("hello");
  expect(getCellContent(model, "A1", "42")).toBe("hello");
  const data = model.exportData();
  expect(Object.keys(data.sheets[0].cells)).toHaveLength(1);
  expect(Object.keys(data.sheets[1].cells)).toHaveLength(1);
});

test("import then export (figures)", () => {
  const modelData = {
    version: CURRENT_VERSION,
    revisionId: DEFAULT_REVISION_ID,
    sheets: [
      {
        id: "someuuid",
        colNumber: 10,
        rowNumber: 10,
        merges: [],
        cols: {},
        rows: {},
        cells: {},
        name: "My sheet",
        conditionalFormats: [],
        figures: [{ id: "otheruuid", x: 100, y: 100, width: 100, height: 100 }],
        areGridLinesVisible: true,
      },
    ],
    entities: {},
    styles: {},
    borders: {},
  };
  const model = new Model(modelData);
  expect(model).toExport(modelData);
});

test("Can import spreadsheet with only version", () => {
  new Model({ version: 1 });
  // We expect the model to be loaded without traceback
  expect(true).toBeTruthy();
});

test("Imported data are not mutated", () => {
  class MutatePlugin extends CorePlugin {
    private entities: Record<string, {}> = {};

    import(data: WorkbookData) {
      this.entities = data.entities;
      this.entities["e2"] = {
        text: "imported",
      };
    }

    export(data: WorkbookData) {
      data.entities = this.entities;
    }
  }
  corePluginRegistry.add("mutate-plugin", MutatePlugin);
  const data = {
    entities: {
      e1: { text: "base" },
    },
  };
  const model = new Model(data);
  expect(data.entities).toEqual({
    e1: { text: "base" },
  });
  const exported = model.exportData();
  expect(exported.entities).toEqual({
    e1: { text: "base" },
    e2: { text: "imported" },
  });
});
