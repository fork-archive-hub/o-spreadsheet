import { deepEquals, positions, zoneToDimension } from "../../helpers";
import { ClipboardCellsState } from "../../helpers/clipboard/clipboard_cells_state";
import { _lt } from "../../translation";
import { CellValue, Command, CommandResult, HeaderIndex, UID, Zone } from "../../types/index";
import { UIPlugin } from "../ui_plugin";

type CellValueByRow = { [rowIndex: number]: CellValue[] };

export class RemoveDuplicatesPlugin extends UIPlugin {
  // ---------------------------------------------------------------------------
  // Command Handling
  // ---------------------------------------------------------------------------

  allowDispatch(cmd: Command) {
    switch (cmd.type) {
      case "REMOVE_DUPLICATES":
        return this.chainValidations(
          this.checkSingleRangeSelected,
          this.checkNoMergingZone,
          this.checkRangeContainsValues
        )(cmd);
    }
    return CommandResult.Success;
  }

  handle(cmd: Command) {
    switch (cmd.type) {
      case "REMOVE_DUPLICATES":
        this.removeDuplicates(cmd.columnsToAnalyze, cmd.hasHeader);

        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private removeDuplicates(columnsToAnalyze: HeaderIndex[], hasHeader: boolean) {
    const sheetId = this.getters.getActiveSheetId();
    const zone = this.getters.getSelectedZone();
    if (hasHeader) {
      zone.top += 1;
    }

    const uniqueRowsIndex = this.getUniqueRowsIndex(sheetId, zone, columnsToAnalyze);
    if (uniqueRowsIndex.length === zoneToDimension(zone).numberOfRows) {
      return;
    }

    const rowsToKeep: Zone[] = uniqueRowsIndex.map((rowIndex) => {
      return {
        sheetId,
        left: zone.left,
        top: parseInt(rowIndex),
        right: zone.right,
        bottom: parseInt(rowIndex),
      };
    });

    const state = new ClipboardCellsState(
      rowsToKeep,
      "COPY",
      this.getters,
      this.dispatch,
      this.selection
    );

    for (const { col, row } of positions(zone)) {
      this.dispatch("CLEAR_CELL", { col, row, sheetId });
    }

    const zonePasted: Zone = {
      left: zone.left,
      top: zone.top,
      right: zone.left,
      bottom: zone.top,
    };

    state.paste([zonePasted]);

    const remainingRows = uniqueRowsIndex.length;
    const removedRows = zone.bottom - zone.top + 1 - remainingRows;

    const remainingZone = {
      left: zone.left,
      top: zone.top - (hasHeader ? 1 : 0),
      right: zone.right,
      bottom: zone.top + remainingRows - 1,
    };

    this.selection.selectZone({
      cell: { col: remainingZone.left, row: remainingZone.top },
      zone: remainingZone,
    });

    this.ui.notifyUI({
      type: "ERROR",
      text: _lt(
        "%s duplicate rows found and removed.\n%s unique rows remain.",
        removedRows.toString(),
        remainingRows.toString()
      ),
    });
  }

  private getUniqueRowsIndex(sheetId: UID, zone: Zone, columnsToAnalyze: HeaderIndex[]): string[] {
    const uniqueRows: CellValueByRow = {};

    for (let rowIndex = zone.top; rowIndex <= zone.bottom; rowIndex++) {
      // Ensures that the columns to be analyzed are in the the zone
      const colToAnalyze = columnsToAnalyze.filter(
        (colIndex) => zone.left <= colIndex && colIndex <= zone.right
      );

      const cellsValueToAnalyze = colToAnalyze.map((colIndex) => {
        return this.getters.getEvaluatedCell({
          sheetId,
          col: colIndex,
          row: rowIndex,
        }).value;
      });

      const isRowUnique = !Object.values(uniqueRows).some((uniqueRow) => {
        return deepEquals(uniqueRow, cellsValueToAnalyze);
      });

      if (isRowUnique) {
        uniqueRows[rowIndex] = cellsValueToAnalyze;
      }
    }
    return Object.keys(uniqueRows);
  }

  private checkSingleRangeSelected(): CommandResult {
    const zones = this.getters.getSelectedZones();
    if (zones.length !== 1) {
      return CommandResult.MoreThanOneRangeSelected;
    }
    return CommandResult.Success;
  }

  private checkNoMergingZone(): CommandResult {
    const sheetId = this.getters.getActiveSheetId();
    const zone = this.getters.getSelectedZone();
    const mergesInZone = this.getters.getMergesInZone(sheetId, zone);
    if (mergesInZone.length > 0) {
      return CommandResult.WillRemoveExistingMerge;
    }
    return CommandResult.Success;
  }

  private checkRangeContainsValues(): CommandResult {
    const sheetId = this.getters.getActiveSheetId();
    const zones = this.getters.getSelectedZones();
    const evaluatedCells = this.getters.getEvaluatedCellsInZone(sheetId, zones[0]);
    if (evaluatedCells.every((evaluatedCel) => evaluatedCel.type === "empty")) {
      return CommandResult.NoValueSelected;
    }
    return CommandResult.Success;
  }
}
