import { isDefined } from "../../helpers/index";
import { otRegistry } from "../../registries";
import { Zone, RemoveRowsCommand, AddRowsCommand, AddMergeCommand } from "../../types";
import { PositionalCommand, RowsCommand, TargetCommand } from "./ot_types";

/*
 * This file contains the transformations when an RemoveRowsCommand is executed
 * before the command to transform.
 * Basically, the transformation is to move/expand/remove position/zone based on the
 * position of the removed rows
 */

otRegistry.addTransformation("UPDATE_CELL", "REMOVE_ROWS", cellCommand);
otRegistry.addTransformation("UPDATE_CELL_POSITION", "REMOVE_ROWS", cellCommand);
otRegistry.addTransformation("CLEAR_CELL", "REMOVE_ROWS", cellCommand);
otRegistry.addTransformation("SET_BORDER", "REMOVE_ROWS", cellCommand);

otRegistry.addTransformation("DELETE_CONTENT", "REMOVE_ROWS", targetCommand);
otRegistry.addTransformation("SET_FORMATTING", "REMOVE_ROWS", targetCommand);
otRegistry.addTransformation("CLEAR_FORMATTING", "REMOVE_ROWS", targetCommand);
otRegistry.addTransformation("SET_DECIMAL", "REMOVE_ROWS", targetCommand);

otRegistry.addTransformation("ADD_ROWS", "REMOVE_ROWS", addRowsCommand);

otRegistry.addTransformation("REMOVE_ROWS", "REMOVE_ROWS", rowsCommand);
otRegistry.addTransformation("RESIZE_ROWS", "REMOVE_ROWS", rowsCommand);

otRegistry.addTransformation("ADD_MERGE", "REMOVE_ROWS", mergeCommand);
otRegistry.addTransformation("REMOVE_MERGE", "REMOVE_ROWS", mergeCommand);

function transformZone(zone: Zone, executed: RemoveRowsCommand): Zone | undefined {
  let top = zone.top;
  let bottom = zone.bottom;
  for (let removedColumn of executed.rows.sort((a, b) => b - a)) {
    if (zone.top > removedColumn) {
      top--;
      bottom--;
    }
    if (zone.top <= removedColumn && zone.bottom >= removedColumn) {
      bottom--;
    }
  }
  if (top > bottom) {
    return undefined;
  }
  return { ...zone, top, bottom };
}

function cellCommand(
  toTransform: PositionalCommand,
  executed: RemoveRowsCommand
): PositionalCommand | undefined {
  if (toTransform.sheetId !== executed.sheetId) {
    return toTransform;
  }
  let row = toTransform.row;
  if (executed.rows.includes(row)) {
    return undefined;
  }
  for (let removedRow of executed.rows) {
    if (row >= removedRow) {
      row--;
    }
  }
  return { ...toTransform, row };
}

function targetCommand(
  toTransform: TargetCommand,
  executed: RemoveRowsCommand
): TargetCommand | undefined {
  if (toTransform.sheetId !== executed.sheetId) {
    return toTransform;
  }
  const adaptedTarget = toTransform.target
    .map((zone) => transformZone(zone, executed))
    .filter(isDefined);
  if (!adaptedTarget.length) {
    return undefined;
  }
  return { ...toTransform, target: adaptedTarget };
}

function addRowsCommand(
  toTransform: AddRowsCommand,
  executed: RemoveRowsCommand
): AddRowsCommand | undefined {
  if (toTransform.sheetId !== executed.sheetId) {
    return toTransform;
  }
  if (executed.rows.includes(toTransform.row)) {
    return undefined;
  }
  let row = toTransform.row;
  for (let removedCol of executed.rows) {
    if (row > removedCol) {
      row--;
    }
  }
  return { ...toTransform, row };
}

function rowsCommand(
  toTransform: RowsCommand,
  executed: RemoveRowsCommand
): RowsCommand | undefined {
  if (toTransform.sheetId !== executed.sheetId) {
    return toTransform;
  }
  const rowsToRemove = toTransform.rows
    .map((row) => {
      if (executed.rows.includes(row)) {
        return undefined;
      }
      for (let removedCol of executed.rows) {
        if (row > removedCol) {
          row--;
        }
      }
      return row;
    })
    .filter(isDefined);
  if (!rowsToRemove.length) {
    return undefined;
  }
  return { ...toTransform, rows: rowsToRemove };
}

function mergeCommand(
  toTransform: AddMergeCommand,
  executed: RemoveRowsCommand
): AddMergeCommand | undefined {
  if (toTransform.sheetId !== executed.sheetId) {
    return toTransform;
  }
  const zone = transformZone(toTransform.zone, executed);
  if (!zone) {
    return undefined;
  }
  return { ...toTransform, zone };
}
