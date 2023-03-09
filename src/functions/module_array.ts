import { transpose2dArray } from "../helpers";
import { _lt } from "../translation";
import {
  AddFunctionDescription,
  CellValue,
  MatrixArg,
  MatrixArgValue,
  OptionalCellValue,
  PrimitiveArgValue,
} from "../types";
import { arg } from "./arguments";
import { assert, flattenRowFirst, toCellValue, toCellValueMatrix, toNumber } from "./helpers";

// -----------------------------------------------------------------------------
// EXPAND
// -----------------------------------------------------------------------------
export const EXPAND: AddFunctionDescription = {
  description: _lt("Expands or pads an array to specified row and column dimensions."),
  args: [
    arg("array (range<any>)", _lt("The array to expand.")),
    arg(
      "rows (number, optional)",
      _lt("The number of rows in the expanded array. If missing, rows will not be expanded.")
    ),
    arg(
      "columns (boolean, optional)",
      _lt("The number of columns in the expanded array. If missing, columns will not be expanded.")
    ),
    arg("pad_with (any, default=0)", _lt("The value with which to pad.")), // @compatibility: on Excel, pad with #N/A
  ],
  returns: ["RANGE<ANY>"],
  //TODO computeFormat
  compute: function (
    array: MatrixArgValue,
    rows: PrimitiveArgValue | undefined,
    columns: PrimitiveArgValue | undefined,
    padWith: PrimitiveArgValue | undefined
  ): CellValue[][] {
    const _rows = rows !== undefined ? toNumber(rows) : array[0].length;
    const _columns = columns !== undefined ? toNumber(columns) : array.length;
    const _padWith = padWith !== undefined && padWith !== null ? padWith : 0; // TODO : Replace with #N/A errors once it's supported

    assert(
      () => _rows >= array[0].length,
      _lt(
        "The rows arguments (%s) must be greater or equal than the number of rows of the array.",
        _rows.toString()
      )
    );
    assert(
      () => _columns >= array.length,
      _lt(
        "The columns arguments (%s) must be greater or equal than the number of columns of the array.",
        _columns.toString()
      )
    );

    const result: OptionalCellValue[][] = [];
    for (let col = 0; col < _columns; col++) {
      result[col] = [];
      for (let row = 0; row < _rows; row++) {
        result[col][row] = col < array.length && row < array[0].length ? array[col][row] : _padWith;
      }
    }
    return toCellValueMatrix(result);
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// FLATTEN
// -----------------------------------------------------------------------------
export const FLATTEN: AddFunctionDescription = {
  description: _lt("Flattens all the values from one or more ranges into a single column."),
  args: [
    arg("range (range<any>)", _lt("The first range to flatten.")),
    arg("range2 (range<any>, repeating)", _lt("Additional ranges to flatten.")),
  ],
  returns: ["RANGE<ANY>"],
  compute: function (...ranges: MatrixArgValue[]): CellValue[][] {
    return [flattenRowFirst(ranges, toCellValue)];
  },
  isExported: false,
};

// -----------------------------------------------------------------------------
// TRANSPOSE
// -----------------------------------------------------------------------------
export const TRANSPOSE: AddFunctionDescription = {
  description: _lt("Transposes the rows and columns of a range."),
  args: [arg("range (range<any>)", _lt("The range to be transposed."))],
  returns: ["RANGE<ANY>"],
  computeFormat: (values: MatrixArg) => {
    return transpose2dArray(values, (x) => x?.format);
  },
  compute: function (values: MatrixArgValue): CellValue[][] {
    return toCellValueMatrix(transpose2dArray(values));
  },
  isExported: true,
};
