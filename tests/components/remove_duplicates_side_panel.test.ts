import { Model, Spreadsheet } from "../../src";
import { click, setCellContent, setSelection } from "../test_helpers";
import { mountSpreadsheet, nextTick } from "../test_helpers/helpers";

const selectors = {
  closeSidepanel: ".o-sidePanel .o-sidePanelClose",
  statisticalInformation:
    ".o-sidePanel .o-remove-duplicates .o-section:nth-child(1) .o-section-subtitle",
  checkBoxHasHeaderRow: ".o-sidePanel .o-remove-duplicates .o-section:nth-child(1) input",
  checkBoxColumnsToAnalyze: ".o-sidePanel .o-remove-duplicates .o-section:nth-child(2) label",
  removeDuplicateButton: ".o-sidePanel .o-remove-duplicates .o-sidePanelButtons button",
};

let model: Model;

describe("remove duplicates", () => {
  let fixture: HTMLElement;
  let parent: Spreadsheet;

  beforeEach(async () => {
    ({ parent, model, fixture } = await mountSpreadsheet());

    parent.env.openSidePanel("RemoveDuplicates");
    await nextTick();
  });

  test("Can close the find and replace side panel", async () => {
    expect(document.querySelectorAll(".o-sidePanel").length).toBe(1);
    await click(fixture, selectors.closeSidepanel);
    expect(document.querySelectorAll(".o-sidePanel").length).toBe(0);
  });

  test("displaying column names correspond to columns in selection", async () => {
    setSelection(model, ["B2:C6"]);
    await nextTick();
    const nodeList = fixture.querySelectorAll(selectors.checkBoxColumnsToAnalyze);
    expect(nodeList.length).toBe(3);
    expect(nodeList[0].textContent).toBe(" Select all ");
    expect(nodeList[1].textContent).toBe("Column B");
    expect(nodeList[2].textContent).toBe("Column C");
  });

  test("select 'Data has header row' change the column label if content", async () => {
    setCellContent(model, "B2", "Bachibouzouk");
    setCellContent(model, "C2", "Cucurbitacee");
    setSelection(model, ["B2:D3"]);
    await click(fixture.querySelector(selectors.checkBoxHasHeaderRow)!);
    await nextTick();
    const checkBox = fixture.querySelectorAll(selectors.checkBoxColumnsToAnalyze);
    expect(checkBox.length).toBe(4);
    expect(checkBox[0].textContent).toBe(" Select all ");
    expect(checkBox[1].textContent).toBe("Column B - Bachibouzouk");
    expect(checkBox[2].textContent).toBe("Column C - Cucurbitacee");
    expect(checkBox[3].textContent).toBe("Column D");
  });

  test("display corresponding statistical information on the number of row/col selected", async () => {
    setSelection(model, ["E3:H7"]);
    await nextTick();
    expect(fixture.querySelector(selectors.statisticalInformation)!.textContent).toBe(
      "5 rows and 4 columns selected"
    );
  });

  test("do the remove duplicates with specific columns to analyze", async () => {
    // prettier-ignore
    const cells = {
        A1: { content: "11" }, B1: { content: "B1" }, C1: { content: "AAA" },
        A2: { content: "88" }, B2: { content: "B2" }, C2: { content: "DOG" },
        A3: { content: "11" }, B3: { content: "B3" }, C3: { content: "CAT" },
        A4: { content: "88" }, B4: { content: "B4" }, C4: { content: "GOD" },
        A5: { content: "11" }, B5: { content: "B5" }, C5: { content: "CAT" },
    };
    model = new Model({ sheets: [{ id: "42", cells: cells }] });

    setSelection(model, ["A1:C5"]);
    await nextTick();

    await click(fixture.querySelector(selectors.checkBoxHasHeaderRow)!);
    const checkBox = fixture.querySelectorAll(selectors.checkBoxColumnsToAnalyze);
    const checkBoxColumnB = checkBox[2].querySelector("input")!;
    await click(checkBoxColumnB);
    await click(fixture.querySelector(selectors.removeDuplicateButton)!);
  });

  test.skip("'Select all' checkbox evolve with correct state ", async () => {});

  test.skip("disable 'Remove duplicates button' if no content", async () => {});

  test.skip("disable 'Remove duplicates button' if more than one selection", async () => {});

  test.skip("disable 'Remove duplicates button' if merges zone", async () => {});
});
