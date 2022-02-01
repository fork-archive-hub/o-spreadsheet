import { transform } from "../../../src/collaborative/ot/ot";
import { toZone } from "../../../src/helpers";
import {
  AddMergeCommand,
  ClearCellCommand,
  ClearFormattingCommand,
  DeleteContentCommand,
  RemoveMergeCommand,
  SetBorderCommand,
  SetDecimalCommand,
  SetFormattingCommand,
  SortCommand,
  UpdateCellCommand,
  UpdateCellPositionCommand,
} from "../../../src/types";
import { target } from "../../test_helpers/helpers";

describe("OT with ADD_MERGE", () => {
  const sheetId = "Sheet1";
  const addMerge: AddMergeCommand = {
    type: "ADD_MERGE",
    target: target("B2:C3"),
    sheetId,
  };

  const updateCell: Omit<UpdateCellCommand, "row" | "col"> = {
    type: "UPDATE_CELL",
    sheetId,
    content: "test",
  };
  const updateCellPosition: Omit<UpdateCellPositionCommand, "row" | "col"> = {
    type: "UPDATE_CELL_POSITION",
    cellId: "Id",
    sheetId,
  };
  const clearCell: Omit<ClearCellCommand, "row" | "col"> = {
    type: "CLEAR_CELL",
    sheetId,
  };
  const setBorder: Omit<SetBorderCommand, "row" | "col"> = {
    type: "SET_BORDER",
    sheetId,
    border: { left: ["thin", "#000"] },
  };

  describe.each([updateCell, updateCellPosition, clearCell, setBorder])(
    "single cell commands",
    (cmd) => {
      test(`${cmd.type} inside the merge`, () => {
        const command = { ...cmd, col: 2, row: 2 };
        const result = transform(command, addMerge);
        expect(result).toBeUndefined();
      });
      test(`${cmd.type} = the top-left of the merge`, () => {
        const command = { ...cmd, col: 1, row: 1 };
        const result = transform(command, addMerge);
        expect(result).toEqual(command);
      });
      test(`${cmd.type} outside the merge`, () => {
        const command = { ...cmd, col: 10, row: 10 };
        const result = transform(command, addMerge);
        expect(result).toEqual(command);
      });

      test(`${cmd.type} in another sheet`, () => {
        const command = { ...cmd, col: 2, row: 1, sheetId: "42" };
        const result = transform(command, addMerge);
        expect(result).toEqual(command);
      });
    }
  );

  const deleteContent: Omit<DeleteContentCommand, "target"> = {
    type: "DELETE_CONTENT",
    sheetId,
  };

  const setFormatting: Omit<SetFormattingCommand, "target"> = {
    type: "SET_FORMATTING",
    sheetId,
    style: { fillColor: "#000000" },
  };

  const clearFormatting: Omit<ClearFormattingCommand, "target"> = {
    type: "CLEAR_FORMATTING",
    sheetId,
  };

  const setDecimal: Omit<SetDecimalCommand, "target"> = {
    type: "SET_DECIMAL",
    sheetId,
    step: 1,
  };

  describe.each([deleteContent, setFormatting, clearFormatting, setDecimal])(
    "target commands",
    (cmd) => {
      test(`${cmd.type} outside merge`, () => {
        const command = { ...cmd, target: [toZone("E1:F2")] };
        const result = transform(command, addMerge);
        expect(result).toEqual(command);
      });
    }
  );

  test("sort a merged zone", () => {
    const sortCommand: SortCommand = {
      type: "SORT_CELLS",
      col: 0,
      row: 0,
      sheetId,
      sortDirection: "ascending",
      zone: toZone("A1:C3"),
    };
    const result = transform(sortCommand, { ...addMerge, target: target("B2:C3, F1:F3") });
    expect(result).toEqual([
      {
        type: "REMOVE_MERGE",
        sheetId,
        target: target("B2:C3"),
      },
      sortCommand,
    ]);
  });

  test("sort a merged zone in an other sheet", () => {
    const sortCommand: SortCommand = {
      type: "SORT_CELLS",
      col: 0,
      row: 0,
      sheetId,
      sortDirection: "ascending",
      zone: toZone("A1:C3"),
    };
    const result = transform(sortCommand, {
      ...addMerge,
      sheetId: "another sheet",
      target: target("B2:C3, F1:F3"),
    });
    expect(result).toEqual(sortCommand);
  });

  test("sort zone which is unmerged", () => {
    const sortCommand: SortCommand = {
      type: "SORT_CELLS",
      col: 0,
      row: 0,
      sheetId,
      sortDirection: "ascending",
      zone: toZone("A1:C3"),
    };
    const result = transform(sortCommand, {
      type: "REMOVE_MERGE",
      sheetId,
      target: target("B2:C3, F1:F3"),
    });
    expect(result).toEqual([
      {
        type: "ADD_MERGE",
        sheetId,
        target: target("B2:C3"),
      },
      sortCommand,
    ]);
  });

  test("sort zone which is unmerged in another sheet", () => {
    const sortCommand: SortCommand = {
      type: "SORT_CELLS",
      col: 0,
      row: 0,
      sheetId,
      sortDirection: "ascending",
      zone: toZone("A1:C3"),
    };
    const result = transform(sortCommand, {
      type: "REMOVE_MERGE",
      sheetId: "another sheet",
      target: target("B2:C3, F1:F3"),
    });
    expect(result).toEqual(sortCommand);
  });

  const removeMerge: Omit<RemoveMergeCommand, "target"> = {
    type: "REMOVE_MERGE",
    sheetId,
  };

  describe.each([addMerge, removeMerge])(`ADD_MERGE & AddMerge | RemoveMerge`, (cmd) => {
    test("two distinct merges", () => {
      const command = { ...cmd, target: target("E1:F2") };
      const result = transform(command, addMerge);
      expect(result).toEqual(command);
    });
    test("two overlapping merges", () => {
      const command = { ...cmd, target: target("C3:D5") };
      const result = transform(command, addMerge);
      expect(result).toBeUndefined();
    });
    test("two overlapping merges in different sheets", () => {
      const command = { ...cmd, target: target("C3:D5"), sheetId: "another sheet" };
      const result = transform(command, addMerge);
      expect(result).toEqual(command);
    });
  });
});