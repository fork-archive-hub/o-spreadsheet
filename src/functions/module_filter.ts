import { transpose2dArray } from "../helpers";
import { _lt } from "../translation";
import {
  AddFunctionDescription,
  CellValue,
  MatrixArgValue,
  OptionalCellValue,
  PrimitiveArgValue,
} from "../types";
import { arg } from "./arguments";
import { toBoolean, toCellValueMatrix } from "./helpers";

// -----------------------------------------------------------------------------
// UNIQUE
// -----------------------------------------------------------------------------
export const UNIQUE: AddFunctionDescription = {
  description: _lt("Unique rows in the provided source range."),
  args: [
    arg("range (range<any>)", _lt("The data to filter by unique entries.")),
    arg(
      "by_column (boolean, default=FALSE)",
      _lt("Whether to filter the data by columns or by rows.")
    ),
    arg(
      "exactly_once (boolean, default=FALSE)",
      _lt("Whether to return only entries with no duplicates.")
    ),
  ],
  returns: ["RANGE<NUMBER>"],
  // TODO computeFormat
  compute: function (
    range: MatrixArgValue,
    byColumn: PrimitiveArgValue,
    exactlyOnce: PrimitiveArgValue
  ): CellValue[][] {
    const _byColumn = toBoolean(byColumn) || false;
    const _exactlyOnce = toBoolean(exactlyOnce) || false;
    if (!_byColumn) range = transpose2dArray(range);

    const map: Map<string, { val: OptionalCellValue[]; count: number }> = new Map();

    for (const row of range) {
      const key = JSON.stringify(row);
      const occurrence = map.get(key);
      if (!occurrence) {
        map.set(key, { val: row, count: 1 });
      } else {
        occurrence.count++;
      }
    }

    const results = _exactlyOnce
      ? [...map.values()].filter((v) => v.count === 1).map((v) => v.val)
      : [...map.values()].map((v) => v.val);

    if (!results.length) throw new Error(_lt("No unique values found"));

    return toCellValueMatrix(_byColumn ? results : transpose2dArray(results));
  },
  isExported: true,
};
