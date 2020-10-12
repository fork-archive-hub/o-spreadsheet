import { Model } from "../../src";
import "../canvas.mock";
import { toCartesian, zoneToXc } from "../../src/helpers";
import { CancelledReason } from "../../src/types";

function select(model: Model, xc: string) {
  const [col, row] = toCartesian(xc);
  model.dispatch("START_SELECTION");
  model.dispatch("SELECT_CELL", { col, row });
  model.dispatch("STOP_SELECTION");
}

function highlightedZones(model: Model) {
  return model.getters
    .getHighlights()
    .map((h) => h.zone)
    .map(zoneToXc);
}

function idOfRange(model: Model, id: string, rangeIndex: number): string {
  return model.getters.getSelectionInput(id)[rangeIndex].id;
}

describe("selection input plugin", () => {
  let model: Model;
  const id = "1";
  beforeEach(() => {
    model = new Model();
  });

  test("empty input should focus the first range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("");
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBe(true);
  });

  test("input with inital ranges should not be focused", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["D4"] });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("D4");
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBeFalsy();
  });

  test("focused input should change with selection", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    select(model, "C2");
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C2");
  });

  test("focus input which is already focused", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    const result = model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(result).toEqual({
      status: "CANCELLED",
      reason: CancelledReason.InputAlreadyFocused,
    });
  });

  test("focused input should not change when selecting a zone for composer", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    model.dispatch("START_COMPOSER_SELECTION");
    select(model, "C2");
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("");
  });

  test("expanding a selection fills empty input then adds a new input", () => {
    let [col, row] = toCartesian("C2");
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    model.dispatch("START_SELECTION");
    model.dispatch("SELECT_CELL", { col, row });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    expect(model.getters.getSelectionInput(id).map((i) => i.xc)).toEqual(["C2"]);
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    [col, row] = toCartesian("D2");
    model.dispatch("SELECT_CELL", { col, row });
    expect(model.getters.getSelectionInput(id).length).toBe(2);
    expect(model.getters.getSelectionInput(id).map((i) => i.xc)).toEqual(["C2", "D2"]);
  });

  test("expanding a selection focuses the last range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    select(model, "C2");
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(true);
  });

  test("expanding a selection does not add input if maximum is reached", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, maximumRanges: 1 });
    select(model, "C2");
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)).toHaveLength(1);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C2");
  });

  test("adding multiple ranges does not add more input than maximum", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, maximumRanges: 2 });
    model.dispatch("ADD_HIGHLIGHTS", {
      ranges: {
        A1: "#000",
        B1: "#000",
        C1: "#000",
      },
      highlightType: "border",
    });
    expect(model.getters.getSelectionInput(id)).toHaveLength(2);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("A1");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("B1");
  });

  test("cannot add emty range when maximum ranges reached", async () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, maximumRanges: 1 });
    expect(model.getters.getSelectionInput(id)).toHaveLength(1);
    model.dispatch("ADD_EMPTY_RANGE", { id });
    expect(model.getters.getSelectionInput(id)).toHaveLength(1);
  });

  test("add an empty range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    model.dispatch("ADD_EMPTY_RANGE", { id });
    expect(model.getters.getSelectionInput(id).length).toBe(2);
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(true);
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("");
  });

  test("add an empty range with initial value", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["A5"] });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    model.dispatch("ADD_EMPTY_RANGE", { id });
    expect(model.getters.getSelectionInput(id).length).toBe(2);
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(true);
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("");
  });

  test("remove a range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    const ids = model.getters.getSelectionInput(id).map((i) => i.id);
    expect(model.getters.getSelectionInput(id).length).toBe(2);
    model.dispatch("REMOVE_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(model.getters.getSelectionInput(id).length).toBe(1);
    expect(model.getters.getSelectionInput(id).map((i) => i.id)).toEqual([ids[1]]);
  });

  test("last range is focused when one is removed", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    expect(model.getters.getSelectionInput(id).length).toBe(4);
    model.dispatch("REMOVE_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(model.getters.getSelectionInput(id).length).toBe(3);
    expect(model.getters.getSelectionInput(id)[2].isFocused).toBe(true);
  });

  test("ranges are unfocused", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBe(true);
    model.dispatch("FOCUS_RANGE", { id, rangeId: null });
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBeFalsy();
  });

  test("same range is updated while selecting", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("START_SELECTION");
    model.dispatch("SELECT_CELL", { col: 2, row: 1 });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C2");
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("D2");
  });

  test("same range is updated while expanding", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["A1"] });
    model.dispatch("ADD_EMPTY_RANGE", { id });

    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    model.dispatch("SELECT_CELL", { col: 2, row: 1 });
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("C2");
    model.dispatch("ALTER_SELECTION", { cell: [3, 1] });
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("C2:D2");
  });

  test("same color while selecting", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("START_SELECTION");
    model.dispatch("SELECT_CELL", { col: 2, row: 1 });
    const color = model.getters.getSelectionInput(id)[0].color;
    expect(color).toBeTruthy();
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)[0].color).toBe(color);
  });

  test("same color with new selection in same range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    select(model, "C2");
    const color = model.getters.getSelectionInput(id)[0].color;
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)[0].color).toBe(color);
  });

  test("color changes when expanding selection", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    select(model, "C2");
    const color = model.getters.getSelectionInput(id)[0].color;
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    model.dispatch("SELECT_CELL", { col: 3, row: 1 });
    expect(model.getters.getSelectionInput(id)[1].color).not.toEqual(color);
  });

  test("color changes in new input", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    select(model, "C2");
    const color = model.getters.getSelectionInput(id)[0].color;
    model.dispatch("ADD_EMPTY_RANGE", { id });
    select(model, "C2");
    expect(model.getters.getSelectionInput(id)[1].color).not.toBe(color);
  });

  test("focus does not change values", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["A1", "B2"] });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("A1");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("B2");
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBe(false);
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(false);
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("A1");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("B2");
    expect(model.getters.getSelectionInput(id)[0].isFocused).toBe(true);
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(false);
  });

  test("focus other input does not use the focused input previous color", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(true);
    select(model, "C2");
    const firstColor = model.getters.getSelectionInput(id)[1].color;
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    select(model, "C3");
    const secondColor = model.getters.getSelectionInput(id)[0].color;
    expect(model.getters.getHighlights().length).toBe(2);
    expect(firstColor).not.toBe(secondColor);
  });

  test("manually changing the input updates highlighted zone", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C5" });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C5");
    expect(highlightedZones(model)).toStrictEqual(["C5"]);
  });

  test("manually changing the input with existing range", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["A8"] });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "A8, C5" });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("A8");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("C5");
    expect(model.getters.getSelectionInput(id)[1].isFocused).toBe(true);
    expect(highlightedZones(model)).toStrictEqual(["A8", "C5"]);
  });

  test("setting multiple ranges in one input", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C5, D8" });
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C5");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("D8");
    expect(highlightedZones(model)).toStrictEqual(["C5", "D8"]);
    const [firstColor, secondColor] = model.getters.getHighlights().map((h) => h.color);
    expect(firstColor).not.toBe(secondColor);
  });

  test("writing an invalid range does not crash", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("CHANGE_RANGE", {
      id,
      rangeId: idOfRange(model, id, 0),
      value: "This is invalid",
    });
    expect(highlightedZones(model)).toStrictEqual([]);
  });

  test("writing an empty range removes the highlight", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C2" });
    expect(highlightedZones(model)).toStrictEqual(["C2"]);
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "" });
    expect(highlightedZones(model)).toStrictEqual([]);
  });

  test("disable input removes highlighted zones", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C2" });
    expect(highlightedZones(model)).toStrictEqual(["C2"]);
    model.dispatch("DISABLE_SELECTION_INPUT", { id });
    expect(highlightedZones(model)).toStrictEqual([]);
  });

  test("initial ranges are not highlighted", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["C2", "D4"] });
    expect(model.getters.getSelectionInput(id).length).toBe(2);
    expect(model.getters.getHighlights().length).toBe(0);
  });

  test("ranges are split for value", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C2, D5" });
    expect(model.getters.getSelectionInputValue(id)).toStrictEqual(["C2", "D5"]);
  });

  test("mutliple ranges are combined", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: "C2" });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 1), value: "C6" });
    expect(model.getters.getSelectionInputValue(id)).toStrictEqual(["C2", "C6"]);
  });

  test("trailing commas and spaces are removed", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("CHANGE_RANGE", { id, rangeId: idOfRange(model, id, 0), value: " ,C2, " });
    expect(model.getters.getSelectionInputValue(id)).toStrictEqual(["C2"]);
  });

  test("new state does not keep previous range focus", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id });
    model.dispatch("ADD_EMPTY_RANGE", { id }); // this range is now focused
    model.dispatch("DISABLE_SELECTION_INPUT", { id });
    expect(highlightedZones(model)).toEqual([]);
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id: "999", initialRanges: ["C2"] });
    expect(highlightedZones(model)).toEqual([]);
    // brand new focus should highlight the zone.
    model.dispatch("FOCUS_RANGE", { id: "999", rangeId: idOfRange(model, "999", 0) });
    expect(highlightedZones(model)).toEqual(["C2"]);
  });

  test("selection expansion adds as many input as needed", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["C4"] });
    let [col, row] = toCartesian("C2");
    model.dispatch("SELECT_CELL", { col, row });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(highlightedZones(model)).toEqual(["C4"]);
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    [col, row] = toCartesian("D2");
    model.dispatch("SELECT_CELL", { col, row });
    model.dispatch("STOP_SELECTION");
    expect(highlightedZones(model)).toEqual(["C4", "C2", "D2"]);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("C4");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("C2");
    expect(model.getters.getSelectionInput(id)[2].xc).toBe("D2");
  });

  test("selection expansion by altering selection adds inputs", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["D4"] });
    let [col, row] = toCartesian("C2");
    model.dispatch("SELECT_CELL", { col, row });
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    model.dispatch("PREPARE_SELECTION_EXPANSION");
    model.dispatch("START_SELECTION_EXPANSION");
    [col, row] = toCartesian("D2");
    model.dispatch("SELECT_CELL", { col, row });
    expect(highlightedZones(model)).toEqual(["D4", "C2", "D2"]);
    model.dispatch("ALTER_SELECTION", { delta: [1, 0] });
    expect(highlightedZones(model)).toEqual(["D4", "C2", "D2:E2"]);
    expect(model.getters.getSelectionInput(id)[0].xc).toBe("D4");
    expect(model.getters.getSelectionInput(id)[1].xc).toBe("C2");
    expect(model.getters.getSelectionInput(id)[2].xc).toBe("D2:E2");
  });

  test("highlights are updated when focus switched from one input to another", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id: "1", initialRanges: ["D4"] });
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id: "2", initialRanges: ["D5"] });
    model.dispatch("FOCUS_RANGE", { id: "1", rangeId: idOfRange(model, "1", 0) });
    expect(model.getters.getSelectionInput("1")[0].isFocused).toBe(true);
    expect(model.getters.getSelectionInput("2")[0].isFocused).toBe(false);
    expect(highlightedZones(model)).toEqual(["D4"]);
    model.dispatch("FOCUS_RANGE", { id: "2", rangeId: idOfRange(model, "2", 0) });
    expect(model.getters.getSelectionInput("1")[0].isFocused).toBe(false);
    expect(model.getters.getSelectionInput("2")[0].isFocused).toBe(true);
    expect(model.getters.getSelectionInput("1")[0].color).toBeFalsy();
    expect(model.getters.getSelectionInput("2")[0].color).toBeTruthy();
    expect(highlightedZones(model)).toEqual(["D5"]);
  });

  test("color is kept between focuses", () => {
    model.dispatch("ENABLE_NEW_SELECTION_INPUT", { id, initialRanges: ["D4"] });
    model.dispatch("FOCUS_RANGE", { id: "1", rangeId: idOfRange(model, "1", 0) });
    const color = model.getters.getSelectionInput(id)[0].color;
    expect(color).toBeTruthy();
    model.dispatch("FOCUS_RANGE", { id, rangeId: null });
    expect(model.getters.getSelectionInput(id)[0].color).toBe(null);
    model.dispatch("FOCUS_RANGE", { id, rangeId: idOfRange(model, id, 0) });
    expect(model.getters.getSelectionInput(id)[0].color).toBe(color);
  });
});
