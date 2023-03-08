import { transpose2dArray } from "../helpers";
import { _lt } from "../translation";
import {
  AddFunctionDescription,
  CellValue,
  MatrixArgValue,
  OptionalCellValue,
  PrimitiveArgValue,
} from "../types";
import { NotAvailableError } from "../types/errors";
import { arg } from "./arguments";
import { toBoolean, toCellValueMatrix } from "./helpers";
import {
  assertArraySameDimensions,
  assertSameDimensions,
  assertSingleColOrRow,
} from "./helper_assert";

// -----------------------------------------------------------------------------
// FILTER
// -----------------------------------------------------------------------------
export const FILTER: AddFunctionDescription = {
  description: _lt(
    "Returns a filtered version of the source range, returning only rows or columns that meet the specified conditions."
  ),
  args: [
    arg("range (range<any>)", _lt("The data to be filtered.")),
    arg(
      "condition1 (range<boolean>)",
      _lt(
        "A column or row containing true or false values corresponding to the first column or row of range."
      )
    ),
    arg(
      "condition2 (range<boolean>, repeating)",
      _lt("Additional column or row containing true or false values.")
    ),
  ],
  returns: ["RANGE<ANY>"],
  //TODO computeFormat
  compute: function (range: MatrixArgValue, ...conditions: MatrixArgValue[]): CellValue[][] {
    conditions.map((c) =>
      assertSingleColOrRow(_lt("The arguments condition must be a single column or row."), c)
    );
    assertSameDimensions(
      _lt("The arguments conditions must have the same dimensions."),
      ...conditions
    );
    const _conditions = conditions.map((c) => c.flat());

    const mode = conditions[0].length === 1 ? "row" : "col";
    range = mode === "row" ? transpose2dArray(range) : range;

    assertArraySameDimensions(
      _lt("The range and conditions must have the same dimensions."),
      range,
      _conditions[0]
    );

    const results: OptionalCellValue[][] = [];

    for (let i = 0; i < range.length; i++) {
      const row = range[i];
      if (_conditions.every((c) => c[i])) results.push(row);
    }

    if (!results.length) throw new NotAvailableError("No match found in FILTER evaluation");

    return toCellValueMatrix(mode === "row" ? transpose2dArray(results) : results);
  },
  isExported: true,
};

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
