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
import {
  assert,
  flattenRowFirst,
  isCellValueANumber,
  toCellValue,
  toCellValueMatrix,
  toNumber,
} from "./helpers";

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
// FREQUENCY
// -----------------------------------------------------------------------------
export const FREQUENCY: AddFunctionDescription = {
  description: _lt("Calculates the frequency distribution of a range."),
  args: [
    arg("data (range<any>)", _lt("The array of ranges containing the values to be counted.")),
    arg("classes (number, range<any>)", _lt("The range containing the set of classes.")),
  ],
  returns: ["RANGE<NUMBER>"],
  compute: function (data: MatrixArgValue, classes: MatrixArgValue): CellValue[][] {
    const _data = flattenRowFirst([data], (val) => val).filter(isCellValueANumber);
    const _classes = flattenRowFirst([classes], (val) => val).filter(isCellValueANumber);

    /**
     * Returns the frequency distribution of the data in the classes, ie. the number of elements in the range
     * between each classes.
     *
     * For example:
     * - data = [1, 2, 3, 4, 5]
     * - classes = [3, 5, 1]
     *
     * The result will be:
     * - 2 ==> number of elements 3 > el >= 5
     * - 2 ==> number of elements 1 > el >= 3
     * - 1 ==> number of elements <= 1
     * - 0 ==> number of elements > 5
     */

    const classesWithIndex = _classes
      .map((value, index) => ({ index, value, count: 0 }))
      .sort((a, b) => a.value - b.value);
    classesWithIndex.push({ index: classesWithIndex.length, value: Infinity, count: 0 });

    const sortedData = _data.sort((a, b) => a - b);

    let currentClassIndex = 0;
    for (const val of sortedData) {
      while (
        val > classesWithIndex[currentClassIndex].value &&
        currentClassIndex < classesWithIndex.length - 1
      ) {
        currentClassIndex++;
      }
      classesWithIndex[currentClassIndex].count++;
    }

    const result = classesWithIndex.sort((a, b) => a.index - b.index).map((val) => val.count);
    return [result];
  },
  isExported: true,
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
