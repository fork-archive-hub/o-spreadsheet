import { _lt } from "../translation";
import {
Cell,
CellValueType,
CommandResult,
DispatchResult,
SortDirection,
SpreadsheetEnv,
UID,
Zone
} from "../types";
import { isEqual } from "./zones";

type CellWithIndex = { index: number; type: CellValueType; value: any };

const SORT_TYPES: CellValueType[] = [
  CellValueType.number,
  CellValueType.error,
  CellValueType.text,
  CellValueType.boolean,
];

function convertCell(cell: Cell | undefined, index: number): CellWithIndex {
  return {
    index,
    type: cell ? cell.evaluated.type : CellValueType.empty,
    value: cell ? cell.evaluated.value : "",
  };
}

export function sortCells(
  cells: (Cell | undefined)[],
  sortDirection: SortDirection
): CellWithIndex[] {
  const cellsWithIndex: CellWithIndex[] = cells.map(convertCell);
  const emptyCells: CellWithIndex[] = cellsWithIndex.filter((x) => x.type === CellValueType.empty);
  const nonEmptyCells: CellWithIndex[] = cellsWithIndex.filter(
    (x) => x.type !== CellValueType.empty
  );

  const inverse = sortDirection === "descending" ? -1 : 1;

  return nonEmptyCells
    .sort((left, right) => {
      let typeOrder = SORT_TYPES.indexOf(left.type) - SORT_TYPES.indexOf(right.type);
      if (typeOrder === 0) {
        if (left.type === CellValueType.text || left.type === CellValueType.error) {
          typeOrder = left.value.localeCompare(right.value);
        } else typeOrder = left.value - right.value;
      }
      return inverse * typeOrder;
    })
    .concat(emptyCells);
}

export function interactiveSortSelection(
  env: SpreadsheetEnv,
  sheetId: UID,
  anchor: [number, number],
  zone: Zone,
  sortDirection: SortDirection
) {
  let result: DispatchResult = DispatchResult.Success;

  //several columns => bypass the contiguity check
  let multiColumns: boolean = zone.right > zone.left;
  if (env.getters.doesIntersectMerge(sheetId, zone)) {
    multiColumns = false;
    let table: UID[];
    for (let r = zone.top; r <= zone.bottom; r++) {
      table = [];
      for (let c = zone.left; c <= zone.right; c++) {
        let merge = env.getters.getMerge(sheetId, c, r);
        if (merge && !table.includes(merge.id.toString())) {
          table.push(merge.id.toString());
        }
      }
      if (table.length >= 2) {
        multiColumns = true;
        break;
      }
    }
  }

  if (multiColumns) {
    result = env.dispatch("SORT_CELLS", { sheetId, col: anchor[0], row: anchor[1], target:[zone], sortDirection });
  } else {
    // check contiguity
    const contiguousZone = env.getters.getContiguousZone(sheetId, zone);
    if (isEqual(contiguousZone, zone)) {
      // merge as it is
      result = env.dispatch("SORT_CELLS", {
        sheetId,
        col: anchor[0],
        row: anchor[1],
        target: [zone],
        sortDirection,
      });
    } else {
      env.askConfirmation(
        _lt(
          "We found data next to your selection. Since this data was not selected, it will not be sorted. Do you want to extend your selection?"
        ),
        () => {
          zone = contiguousZone;
          result = env.dispatch("SORT_CELLS", {
            sheetId,
            col: anchor[0],
            row: anchor[1],
            target: [zone],
            sortDirection,
          });
        },
        () => {
          result = env.dispatch("SORT_CELLS", {
            sheetId,
            col: anchor[0],
            row: anchor[1],
            target: [zone],
            sortDirection,
          });
        }
      );
    }
  }
  if (result.isCancelledBecause(CommandResult.InvalidSortZone)) {
    env.dispatch("SET_SELECTION", {
      anchor: anchor,
      zones: [zone],
      anchorZone: zone,
    });
    env.notifyUser(
      _lt("Cannot sort. To sort, select only cells or only merges that have the same size.")
    );
  }
}
