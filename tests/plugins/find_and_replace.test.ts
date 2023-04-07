import { Model } from "../../src";
import { toZone } from "../../src/helpers";
import { SearchOptions } from "../../src/plugins/ui_feature/find_and_replace";
import {
  activateSheet,
  createSheet,
  setCellContent,
  setSelection,
  setViewportOffset,
} from "../test_helpers/commands_helpers";
import { getActivePosition, getCellContent, getCellText } from "../test_helpers/getters_helpers";

let model: Model;
let searchOptions: SearchOptions;

describe("basic search", () => {
  beforeEach(() => {
    const sheet1 = "s1";
    model = new Model({ sheets: [{ id: sheet1 }] });
    setCellContent(model, "A1", "hello");
    setCellContent(model, "A2", "hello1");
    setCellContent(model, "A3", "=1");
    setCellContent(model, "A4", "111");
    const sheet2 = "s2";
    createSheet(model, { activate: true, sheetId: sheet2 });
    setCellContent(model, "A1", "hey");
    setCellContent(model, "A2", "hey1");
    setCellContent(model, "A3", "=2");
    setCellContent(model, "A4", "222");
    activateSheet(model, "s1");
    const range = model.getters.getRangeFromSheetXC(sheet1, "Sheet2!A1:D13");
    searchOptions = {
      matchCase: false,
      exactMatch: false,
      searchFormulas: false,
      searchScope: "thisSheet",
      specificRange: range,
    };
  });

  test("simple search for search scope thisSheet", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
  });

  test("simple search for search scope thisSheet", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(4);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
    expect(matches[3]).toStrictEqual({ sheetId: "s2", col: 0, row: 1, selected: false });
  });

  test("simple search for search scope specificRange", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 1, selected: true });
  });

  test("search with a regexp characters", () => {
    setCellContent(model, "A1", "hello (world).*");
    model.dispatch("UPDATE_SEARCH", { toSearch: "(world", searchOptions });
    const matches = model.getters.getSearchMatches();
    expect(matches).toStrictEqual([{ sheetId: "s1", col: 0, row: 0, selected: true }]);
  });

  test("Update search automatically select the first match", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    expect(model.getters.getSelection().zones).toEqual([toZone("A2")]);
  });

  test("change the search for thisSheet searchScope", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "hello", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
  });

  test("change the search for allSheet searchScope", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "hello", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(4);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
    expect(matches[3]).toStrictEqual({ sheetId: "s2", col: 0, row: 1, selected: false });
  });

  test("change the search for specificRange searchScope", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "hello", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 1, selected: true });
  });

  test("search on empty string does not match anything", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "", searchOptions });
    expect(model.getters.getSearchMatches()).toHaveLength(0);
  });

  test("search on empty string clears matches", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    expect(model.getters.getSearchMatches()).toHaveLength(3);
    model.dispatch("UPDATE_SEARCH", { toSearch: "", searchOptions });
    expect(model.getters.getSearchMatches()).toHaveLength(0);
  });

  test("start searching from current sheet and update index", () => {
    searchOptions.searchScope = "allSheets";
    activateSheet(model, "s2");
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(4);
    expect(matchIndex).toStrictEqual(3);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
    expect(matches[3]).toStrictEqual({ sheetId: "s2", col: 0, row: 1, selected: true });
  });

  test("modifying cells update the search", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches.length).toBe(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
    setCellContent(model, "A2", "hello");
    setCellContent(model, "B1", "1");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches.length).toBe(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 1, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
  });

  test.skip("Will search a modified cell", () => {
    // not implemented
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(4);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 0, row: 3, selected: false });
    setCellContent(model, "B1", "=1");
    setCellContent(model, "B2", "=11");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(5);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[2]).toStrictEqual({ sheetId: "s1", col: 1, row: 1, selected: false });
    expect(matches[3]).toStrictEqual({ sheetId: "s1", col: 0, row: 2, selected: false });
    expect(matches[4]).toStrictEqual({ sheetId: "s1", col: 1, row: 2, selected: false });
    expect(matches[5]).toStrictEqual({ sheetId: "s1", col: 1, row: 3, selected: false });
  });
});

describe("next/previous cycle", () => {
  beforeEach(() => {
    const sheet1 = "s1";
    model = new Model({ sheets: [{ id: sheet1 }] });
    setCellContent(model, "A1", "1");
    setCellContent(model, "A2", "1");
    const sheet2 = "s2";
    createSheet(model, { activate: true, sheetId: sheet2 });
    setCellContent(model, "A3", "1");
    activateSheet(model, "s1");
    const range = model.getters.getRangeFromSheetXC(sheet1, "Sheet2!A1:D13");
    searchOptions = {
      matchCase: false,
      exactMatch: false,
      searchFormulas: false,
      searchScope: "thisSheet",
      specificRange: range,
    };
  });

  test("Next will select the next match for thisSheet searcscope", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
  });

  test("Next will select the next match for allSheet searcscope", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });
  });

  test("Next will select the next match for specificRange searcscope", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });
  });

  test("Next than previous will cancel each other for thisSheet searchscope", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
  });

  test("Next than previous will cancel each other for allSheets searchscope", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });
  });

  test("Next than previous will cancel each other for specificRange searchscope", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });
  });

  test("search will cycle with next for thisSheet search scope", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
  });

  test("search will cycle with next for allSheets search scope", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();

    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(2);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });
  });

  test("search will cycle with next for specificRange search scope", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();

    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });

    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });
  });

  test("search will cycle with previous for %s search scope", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
  });

  test("search will cycle with previous for %s search scope", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(2);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A2");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(1);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: false });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: true });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A1");
    expect(matches).toHaveLength(3);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "s1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: false });
  });

  test("search will cycle with previous for %s search scope", () => {
    searchOptions.searchScope = "specificRange";
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });

    model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(getActivePosition(model)).toBe("A3");
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "s2", col: 0, row: 2, selected: true });
  });
});

describe("next/previous with single match", () => {
  beforeEach(() => {
    model = new Model();
    setCellContent(model, "A1", "1");
    searchOptions = {
      matchCase: false,
      exactMatch: false,
      searchFormulas: false,
      searchScope: "thisSheet",
      specificRange: undefined,
    };
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    model.dispatch("SELECT_SEARCH_NEXT_MATCH");
  });

  test.each(["SELECT_SEARCH_NEXT_MATCH", "SELECT_SEARCH_PREVIOUS_MATCH"] as const)(
    "%s after changing selection will re-select the match",
    (cmd) => {
      setSelection(model, ["B3"]);
      expect(model.getters.getSelection().zones).toEqual([toZone("B3")]);
      model.dispatch(cmd);
      expect(model.getters.getSelection().zones).toEqual([toZone("A1")]);
    }
  );

  test("UPDATE_SEARCH after changing selection will re-select the match", () => {
    setSelection(model, ["B3"]);
    expect(model.getters.getSelection().zones).toEqual([toZone("B3")]);
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    expect(model.getters.getSelection().zones).toEqual([toZone("A1")]);
  });

  test.each(["SELECT_SEARCH_NEXT_MATCH", "SELECT_SEARCH_PREVIOUS_MATCH"] as const)(
    "%s after scrolling will re-scroll to the match",
    (cmd) => {
      const viewportAfterSearch = model.getters.getActiveMainViewport();
      setViewportOffset(model, 1000, 1000);
      expect(model.getters.getActiveMainViewport()).not.toMatchObject(viewportAfterSearch);
      model.dispatch("SELECT_SEARCH_NEXT_MATCH");
      expect(model.getters.getActiveMainViewport()).toMatchObject(viewportAfterSearch);
    }
  );

  test("UPDATE_SEARCH after scrolling will re-scroll to the match", () => {
    const viewportAfterSearch = model.getters.getActiveMainViewport();
    setViewportOffset(model, 1000, 1000);
    expect(model.getters.getActiveMainViewport()).not.toMatchObject(viewportAfterSearch);
    model.dispatch("UPDATE_SEARCH", { toSearch: "1", searchOptions });
    expect(model.getters.getActiveMainViewport()).toMatchObject(viewportAfterSearch);
  });
});

describe("search options", () => {
  beforeEach(() => {
    model = new Model();
    setCellContent(model, "A1", "hello=sum");
    setCellContent(model, "A2", "Hello");
    setCellContent(model, "A3", "=SUM(1,3)");
    setCellContent(model, "A4", "hell");
    setCellContent(model, "A5", "Hell");
    searchOptions = {
      matchCase: false,
      exactMatch: false,
      searchFormulas: false,
      searchScope: "thisSheet",
      specificRange: undefined,
    };
  });

  test("Can search matching case", () => {
    searchOptions.matchCase = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "Hell", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 1, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 4, selected: false });
  });

  test("Can search matching entire cell", () => {
    searchOptions.exactMatch = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 3, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 4, selected: false });
  });

  test("Can search in formulas", () => {
    searchOptions.searchFormulas = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "sum", searchOptions });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 2, selected: false });
  });

  test("Can search in formulas(2)", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "4", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 2, selected: true });
    searchOptions.searchFormulas = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "4", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toBe(null);
  });

  test("Combine matching case / matching entire cell / search in formulas", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    let matches = model.getters.getSearchMatches();
    let matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(4);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 1, selected: false });
    expect(matches[2]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 3, selected: false });
    expect(matches[3]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 4, selected: false });

    //match case
    searchOptions.matchCase = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 3, selected: false });

    //match case + exact match
    searchOptions.matchCase = true;
    searchOptions.exactMatch = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 3, selected: true });

    //change input and remove match case + exact match and add look in formula
    searchOptions.searchFormulas = true;
    searchOptions.matchCase = false;
    searchOptions.exactMatch = false;
    model.dispatch("UPDATE_SEARCH", { toSearch: "SUM", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(2);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 0, selected: true });
    expect(matches[1]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 2, selected: false });

    //add match case
    searchOptions.matchCase = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "SUM", searchOptions });
    matches = model.getters.getSearchMatches();
    matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(matches[0]).toStrictEqual({ sheetId: "Sheet1", col: 0, row: 2, selected: true });
  });
});

describe("replace", () => {
  beforeEach(() => {
    const sheet1 = "s1";
    model = new Model({ sheets: [{ id: sheet1 }] });
    setCellContent(model, "A1", "hello");
    setCellContent(model, "A2", "=SUM(2,2)");
    setCellContent(model, "A3", "hell");
    setCellContent(model, "A4", "hell");
    const sheet2 = "s2";
    createSheet(model, { activate: true, sheetId: sheet2 });
    setCellContent(model, "A1", "hello");
    setCellContent(model, "A2", "=SUM(2,2)");
    setCellContent(model, "A3", "hell");
    setCellContent(model, "A4", "hell");
    activateSheet(model, "s1");
    searchOptions = {
      matchCase: false,
      exactMatch: false,
      searchFormulas: false,
      searchScope: "thisSheet",
      specificRange: undefined,
    };
  });

  test("Can replace a simple text value", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "hello", searchOptions });
    model.dispatch("REPLACE_SEARCH", { replaceWith: "kikou" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toStrictEqual(null);
    expect(getCellContent(model, "A1")).toBe("kikou");
  });

  test("Can replace a value in a formula", () => {
    searchOptions.searchFormulas = true;
    model.dispatch("UPDATE_SEARCH", { toSearch: "2", searchOptions });
    model.dispatch("REPLACE_SEARCH", { replaceWith: "4" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toStrictEqual(null);
    expect(getCellText(model, "A2")).toBe("=SUM(4,4)");
  });

  test("formulas wont be modified if not looking in formulas or not modifying formulas", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "4", searchOptions });
    model.dispatch("REPLACE_SEARCH", { replaceWith: "2" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(1);
    expect(matchIndex).toStrictEqual(0);
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
  });

  test("can replace all in thisSheet", () => {
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    model.dispatch("REPLACE_ALL_SEARCH", { replaceWith: "kikou" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toStrictEqual(null);
    expect(getCellContent(model, "A1")).toBe("kikouo");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("kikou");
    expect(getCellContent(model, "A4")).toBe("kikou");
    activateSheet(model, "s2");
    expect(getCellContent(model, "A1")).toBe("hello");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("hell");
    expect(getCellContent(model, "A4")).toBe("hell");
  });

  test("can replace all in allSheet", () => {
    searchOptions.searchScope = "allSheets";
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    model.dispatch("REPLACE_ALL_SEARCH", { replaceWith: "kikou" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toStrictEqual(null);
    expect(getCellContent(model, "A1")).toBe("kikouo");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("kikou");
    expect(getCellContent(model, "A4")).toBe("kikou");
    activateSheet(model, "s2");
    expect(getCellContent(model, "A1")).toBe("kikouo");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("kikou");
    expect(getCellContent(model, "A4")).toBe("kikou");
  });

  test("can replace all in specificRange", () => {
    searchOptions.searchScope = "specificRange";
    const sheetId = model.getters.getActiveSheetId();
    searchOptions.specificRange = model.getters.getRangeFromSheetXC(sheetId, "Sheet2!A1:A3");
    model.dispatch("UPDATE_SEARCH", { toSearch: "hell", searchOptions });
    model.dispatch("REPLACE_ALL_SEARCH", { replaceWith: "kikou" });
    const matches = model.getters.getSearchMatches();
    const matchIndex = model.getters.getCurrentSelectedMatchIndex();
    expect(matches).toHaveLength(0);
    expect(matchIndex).toStrictEqual(null);
    activateSheet(model, "s1");
    expect(getCellContent(model, "A1")).toBe("hello");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("hell");
    expect(getCellContent(model, "A4")).toBe("hell");
    activateSheet(model, "s2");
    expect(getCellContent(model, "A1")).toBe("kikouo");
    expect(getCellText(model, "A2")).toBe("=SUM(2,2)");
    expect(getCellContent(model, "A3")).toBe("kikou");
    expect(getCellContent(model, "A4")).toBe("hell");
  });
});
