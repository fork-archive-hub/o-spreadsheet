import { DEFAULT_CELL_HEIGHT } from "../../constants";
import {
  getAddHeaderStartIndex,
  getDefaultCellHeight,
  insertItemsAtIndex,
  range,
  removeIndexesFromArray,
} from "../../helpers";
import { Command } from "../../types";
import { CellPosition, HeaderIndex, Immutable, Pixel, UID } from "../../types/misc";
import { UIPlugin } from "../ui_plugin";

interface HeaderSizeState {
  sizes: Immutable<Record<UID, Array<Pixel>>>;
}

export class UIRowSizePlugin extends UIPlugin<HeaderSizeState> implements HeaderSizeState {
  static getters = ["getRowSize"] as const;

  readonly sizes: Immutable<Record<UID, Array<Pixel>>> = {};

  private ctx = document.createElement("canvas").getContext("2d")!;

  handle(cmd: Command) {
    switch (cmd.type) {
      case "START":
        for (const sheetId of this.getters.getSheetIds()) {
          this.initSheet(sheetId);
        }
        break;
      case "CREATE_SHEET": {
        this.history.update("sizes", cmd.sheetId, this.computeRowSizes(cmd.sheetId));
        break;
      }
      case "DUPLICATE_SHEET":
        this.initSheet(cmd.sheetIdTo);
        break;
      case "DELETE_SHEET":
        const sizes = { ...this.sizes };
        delete sizes[cmd.sheetId];
        this.history.update("sizes", sizes);
        break;
      case "REMOVE_COLUMNS_ROWS": {
        if (cmd.dimension === "COL") return;
        let sizes = [...this.sizes[cmd.sheetId]];
        sizes = removeIndexesFromArray(sizes, cmd.elements);
        this.history.update("sizes", cmd.sheetId, sizes);
        break;
      }
      case "ADD_COLUMNS_ROWS": {
        if (cmd.dimension === "COL") return;
        const oldSizes = [...this.sizes[cmd.sheetId]];
        const addIndex = getAddHeaderStartIndex(cmd.position, cmd.base);
        const newRows = Array(cmd.quantity).fill(DEFAULT_CELL_HEIGHT);
        const newSizes = insertItemsAtIndex(oldSizes, newRows, addIndex);
        this.history.update("sizes", cmd.sheetId, newSizes);
        break;
      }
      case "RESIZE_COLUMNS_ROWS":
        {
          const sheetId = cmd.sheetId;
          if (cmd.dimension === "ROW") {
            for (let el of cmd.elements) {
              this.history.update("sizes", sheetId, el, this.getRowComputedSize(sheetId, el));
            }
          } else {
            // Recompute row heights on col size change, they might have changed because of wrapped text
            for (let row of range(0, this.getters.getNumberRows(sheetId))) {
              this.history.update("sizes", sheetId, row, this.getRowComputedSize(sheetId, row));
            }
          }
        }
        break;
      case "UPDATE_CELL":
        const { sheetId, row } = cmd;
        if (!this.getters.getUserRowSize(sheetId, row)) {
          if (!this.sizes[sheetId]) debugger;
          this.history.update("sizes", sheetId, row, this.getRowComputedSize(sheetId, row));
        }
        break;
      case "ADD_MERGE":
      case "REMOVE_MERGE":
        const changerRows = new Set<number>();
        for (let target of cmd.target) {
          for (let row of range(target.top, target.bottom + 1)) {
            changerRows.add(row);
          }
        }

        for (let row of changerRows) {
          this.history.update("sizes", cmd.sheetId, row, this.getRowComputedSize(cmd.sheetId, row));
        }
        break;
    }
    return;
  }

  getRowSize(sheetId: UID, row: HeaderIndex): Pixel {
    if (!this.sizes[sheetId]) debugger;
    return Math.round(
      this.getters.getUserRowSize(sheetId, row) ?? this.sizes[sheetId][row] ?? DEFAULT_CELL_HEIGHT
    );
  }

  private computeRowSizes(sheetId: UID): Array<Pixel> {
    const sizes: Pixel[] = [];
    for (let row of range(0, this.getters.getNumberRows(sheetId))) {
      sizes.push(this.getRowComputedSize(sheetId, row));
    }
    return sizes;
  }

  private initSheet(sheetId: UID) {
    if (!this.sizes[sheetId]) {
      this.history.update("sizes", sheetId, this.computeRowSizes(sheetId));
    }
  }

  /**
   * Return the height the cell should have in the sheet, which is either DEFAULT_CELL_HEIGHT if the cell is in a multi-row
   * merge, or the height of the cell computed based on its font size.
   */
  private getCellHeight(position: CellPosition): Pixel {
    const merge = this.getters.getMerge(position);
    if (merge && merge.bottom !== merge.top) {
      return DEFAULT_CELL_HEIGHT;
    }
    const cell = this.getters.getCell(position);

    const colSize = this.getters.getColSize(position.sheetId, position.col);
    return getDefaultCellHeight(this.ctx, cell, colSize);
  }

  /**
   * Get the tallest cell of a row and its size.
   *
   * The tallest cell of the row correspond to the cell with the biggest font size,
   * and that is not part of a multi-line merge.
   */
  private getRowComputedSize(sheetId: UID, row: HeaderIndex): Pixel {
    const userRowSize = this.getters.getUserRowSize(sheetId, row);
    if (userRowSize !== undefined) return userRowSize;

    const cellIds = this.getters.getRowCells(sheetId, row);
    let maxHeight = 0;
    for (let i = 0; i < cellIds.length; i++) {
      const cell = this.getters.getCellById(cellIds[i]);
      if (!cell) continue;
      const position = this.getters.getCellPosition(cell.id);
      const cellHeight = this.getCellHeight(position);
      if (cellHeight > maxHeight && cellHeight > DEFAULT_CELL_HEIGHT) {
        maxHeight = cellHeight;
      }
    }

    if (maxHeight <= DEFAULT_CELL_HEIGHT) {
      return DEFAULT_CELL_HEIGHT;
    }
    return maxHeight;
  }
}
