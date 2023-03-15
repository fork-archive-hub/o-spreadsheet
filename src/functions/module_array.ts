import { isDefined, matrixMap, transpose2dArray } from "../helpers";
import { _lt } from "../translation";
import {
  AddFunctionDescription,
  ArgValue,
  CellValue,
  Matrix,
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
  isMatrixArgValue,
  mapAndFlattenMatrix,
  reduceNumbers,
  toBoolean,
  toCellValue,
  toCellValueMatrix,
  toMatrixArgValue,
  toNumber,
} from "./helpers";
import { assertSameDimensions, assertSquareMatrix } from "./helper_assert";
import { invertMatrix, multiplyMatrices } from "./helper_matrices";

// -----------------------------------------------------------------------------
// ARRAY_CONSTRAIN
// -----------------------------------------------------------------------------
export const ARRAY_CONSTRAIN: AddFunctionDescription = {
  description: _lt("Returns a result array constrained to a specific width and height."),
  args: [
    arg("input_range (range<any>)", _lt("The range to constrain.")),
    arg("rows (number)", _lt("The number of rows in the constrained array.")),
    arg("columns (number)", _lt("The number of columns in the constrained array.")),
  ],
  returns: ["RANGE<ANY>"],
  //TODO computeFormat
  compute: function (
    array: MatrixArgValue,
    rows: PrimitiveArgValue,
    columns: PrimitiveArgValue | undefined
  ): CellValue[][] {
    const _rows = Math.min(toNumber(rows), array[0].length);
    const _columns = Math.min(toNumber(columns), array.length);

    const result: CellValue[][] = Array(_columns);
    for (let col = 0; col < _columns; col++) {
      result[col] = Array(_rows);
      for (let row = 0; row < _rows; row++) {
        result[col][row] = toCellValue(array[col][row]);
      }
    }
    return result;
  },
  isExported: false,
};

// -----------------------------------------------------------------------------
// CHOOSECOLS
// -----------------------------------------------------------------------------
export const CHOOSECOLS: AddFunctionDescription = {
  description: _lt("Creates a new array from the selected columns in the existing range."),
  args: [
    arg("array (range<any>)", _lt("The array that contains the columns to be returned.")),
    arg(
      "col_num (number, range<number>)",
      _lt("The first column index of the columns to be returned.")
    ),
    arg(
      "col_num2 (number, range<number>, repeating)",
      _lt("The columns indexes of the columns to be returned.")
    ),
  ],
  returns: ["RANGE<ANY>"],
  //TODO computeFormat
  compute: function (array: MatrixArgValue, ...columns: ArgValue[]): CellValue[][] {
    const _columns = flattenRowFirst(columns, toNumber);
    assert(
      () => _columns.every((col) => col > 0 && col <= array.length),
      _lt(
        "The columns arguments must be between 1 and %s (got %s).",
        array.length.toString(),
        (_columns.find((col) => col <= 0 || col > array.length) || 0).toString()
      )
    );

    const result: OptionalCellValue[][] = Array(_columns.length);
    for (let i = 0; i < _columns.length; i++) {
      const colIndex = _columns[i] - 1; // -1 because columns arguments are 1-indexed
      result[i] = array[colIndex];
    }

    return toCellValueMatrix(result);
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// CHOOSEROWS
// -----------------------------------------------------------------------------
export const CHOOSEROWS: AddFunctionDescription = {
  description: _lt("Creates a new array from the selected rows in the existing range."),
  args: [
    arg("array (range<any>)", _lt("The array that contains the rows to be returned.")),
    arg("row_num (number, range<number>)", _lt("The first row index of the rows to be returned.")),
    arg(
      "row_num2 (number, range<number>, repeating)",
      _lt("The rows indexes of the rows to be returned.")
    ),
  ],
  returns: ["RANGE<ANY>"],
  //TODO computeFormat
  compute: function (array: MatrixArgValue, ...rows: ArgValue[]): CellValue[][] {
    const _rows = flattenRowFirst(rows, toNumber);
    assert(
      () => _rows.every((row) => row > 0 && row <= array[0].length),
      _lt(
        "The rows arguments must be between 1 and %s (got %s).",
        array[0].length.toString(),
        (_rows.find((row) => row <= 0 || row > array[0].length) || 0).toString()
      )
    );

    const result: CellValue[][] = Array(array.length);
    for (let col = 0; col < array.length; col++) {
      result[col] = Array(_rows.length);
      for (let row = 0; row < _rows.length; row++) {
        const rowIndex = _rows[row] - 1; // -1 because rows arguments are 1-indexed
        result[col][row] = toCellValue(array[col][rowIndex]);
      }
    }

    return result;
  },
  isExported: true,
};

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
// MDETERM
// -----------------------------------------------------------------------------
export const MDETERM: AddFunctionDescription = {
  description: _lt("Returns the matrix determinant of a square matrix."),
  args: [
    arg(
      "square_matrix (number, range<number>)",
      _lt(
        "An range with an equal number of rows and columns representing a matrix whose determinant will be calculated."
      )
    ),
  ],
  returns: ["NUMBER"],
  compute: function (matrix: ArgValue): number {
    if (!Array.isArray(matrix)) {
      return toNumber(matrix);
    }
    const _matrix: Matrix<number> = matrixMap(matrix, toNumber);

    assertSquareMatrix(
      _lt("The argument square_matrix must have the same number of columns and rows."),
      _matrix
    );

    const { determinant } = invertMatrix(_matrix);

    return determinant;
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// MINVERSE
// -----------------------------------------------------------------------------
export const MINVERSE: AddFunctionDescription = {
  description: _lt("Returns the multiplicative inverse of a square matrix."),
  args: [
    arg(
      "square_matrix (number, range<number>)",
      _lt(
        "An range with an equal number of rows and columns representing a matrix whose multiplicative inverse will be calculated."
      )
    ),
  ],
  returns: ["RANGE<NUMBER>"],
  compute: function (matrix: ArgValue): CellValue[][] {
    const _matrix: Matrix<number> = matrixMap(toMatrixArgValue(matrix), toNumber);

    assertSquareMatrix(
      _lt("The argument square_matrix must have the same number of columns and rows."),
      _matrix
    );

    const { inverted } = invertMatrix(_matrix);
    if (!inverted) {
      throw new Error(_lt("The matrix is not invertible."));
    }

    return inverted;
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// MMULT
// -----------------------------------------------------------------------------
export const MMULT: AddFunctionDescription = {
  description: _lt("Calculates the matrix product of two matrices."),
  args: [
    arg(
      "matrix1 (number, range<number>)",
      _lt("The first matrix in the matrix multiplication operation.")
    ),
    arg(
      "matrix2 (number, range<number>)",
      _lt("The second matrix in the matrix multiplication operation.")
    ),
  ],
  returns: ["RANGE<NUMBER>"],
  compute: function (matrix1: ArgValue, matrix2: ArgValue): CellValue[][] {
    let _matrix1: Matrix<number> = matrixMap(toMatrixArgValue(matrix1), toNumber);
    let _matrix2: Matrix<number> = matrixMap(toMatrixArgValue(matrix2), toNumber);

    assert(
      () => _matrix1.length === _matrix2[0].length,
      _lt(
        "In [[FUNCTION_NAME]], the number of columns of the first matrix (%s) must be equal to the \
        number of rows of the second matrix (%s).",
        _matrix1.length.toString(),
        _matrix2[0].length.toString()
      )
    );

    return multiplyMatrices(_matrix1, _matrix2);
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// SUMPRODUCT
// -----------------------------------------------------------------------------
export const SUMPRODUCT: AddFunctionDescription = {
  description: _lt(
    "Calculates the sum of the products of corresponding entries in equal-sized ranges."
  ),
  args: [
    arg(
      "range1 (number, range<number>)",
      _lt(
        "The first range whose entries will be multiplied with corresponding entries in the other ranges."
      )
    ),
    arg(
      "range2 (number, range<number>, repeating)",
      _lt(
        "The other range whose entries will be multiplied with corresponding entries in the other ranges."
      )
    ),
  ],
  returns: ["NUMBER"],
  compute: function (...args: ArgValue[]): number {
    assertSameDimensions(_lt("All the ranges must have the same dimensions."), ...args);
    if (args.every(isMatrixArgValue)) {
      let result = 0;
      for (let i = 0; i < args[0].length; i++) {
        for (let j = 0; j < args[0][i].length; j++) {
          let product = 1;
          for (const range of args) {
            product *= toNumber(range[i][j]);
          }
          result += product;
        }
      }
      return result;
    }
    return reduceNumbers(args, (acc, a) => acc * a, 1);
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// SUMX2MY2
// -----------------------------------------------------------------------------
export const SUMX2MY2: AddFunctionDescription = {
  description: _lt(
    "Calculates the sum of the difference of the squares of the values in two array."
  ),
  args: [
    arg(
      "array_x (number, range<number>)",
      _lt(
        "The array or range of values whose squares will be reduced by the squares of corresponding entries in array_y and added together."
      )
    ),
    arg(
      "array_y (number, range<number>)",
      _lt(
        "The array or range of values whose squares will be subtracted from the squares of corresponding entries in array_x and added together."
      )
    ),
  ],
  returns: ["NUMBER"],
  compute: function (arrayX: ArgValue, arrayY: ArgValue): number {
    assertSameDimensions(
      "The arguments array_x and array_y must have the same dimensions.",
      arrayX,
      arrayY
    );

    const _arrayX = flattenRowFirst([arrayX], toNumber);
    const _arrayY = flattenRowFirst([arrayY], toNumber);

    let result = 0;
    for (let i = 0; i < _arrayX.length; i++) {
      result += _arrayX[i] ** 2 - _arrayY[i] ** 2;
    }

    return result;
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// SUMX2PY2
// -----------------------------------------------------------------------------
export const SUMX2PY2: AddFunctionDescription = {
  description: _lt("Calculates the sum of the sum of the squares of the values in two array."),
  args: [
    arg(
      "array_x (number, range<number>)",
      _lt(
        "The array or range of values whose squares will be added to the squares of corresponding entries in array_y and added together."
      )
    ),
    arg(
      "array_y (number, range<number>)",
      _lt(
        "The array or range of values whose squares will be added to the squares of corresponding entries in array_x and added together."
      )
    ),
  ],
  returns: ["NUMBER"],
  compute: function (arrayX: ArgValue, arrayY: ArgValue): number {
    assertSameDimensions(
      "The arguments array_x and array_y must have the same dimensions.",
      arrayX,
      arrayY
    );

    const _array = flattenRowFirst([arrayX, arrayY], toNumber);
    const result = _array.reduce((acc, x) => acc + x ** 2, 0);
    return result;
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// SUMXMY2
// -----------------------------------------------------------------------------
export const SUMXMY2: AddFunctionDescription = {
  description: _lt("Calculates the sum of squares of the differences of values in two array."),
  args: [
    arg(
      "array_x (number, range<number>)",
      _lt(
        "The array or range of values that will be reduced by corresponding entries in array_y, squared, and added together."
      )
    ),
    arg(
      "array_y (number, range<number>)",
      _lt(
        "The array or range of values that will be subtracted from corresponding entries in array_x, the result squared, and all such results added together."
      )
    ),
  ],
  returns: ["NUMBER"],
  compute: function (arrayX: ArgValue, arrayY: ArgValue): number {
    assertSameDimensions(
      "The arguments array_x and array_y must have the same dimensions.",
      arrayX,
      arrayY
    );

    const _arrayX = flattenRowFirst([arrayX], toNumber);
    const _arrayY = flattenRowFirst([arrayY], toNumber);

    let result = 0;
    for (let i = 0; i < _arrayX.length; i++) {
      result += (_arrayX[i] - _arrayY[i]) ** 2;
    }

    return result;
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// TOCOL
// -----------------------------------------------------------------------------
const TO_COL_ROW_DEFAULT_IGNORE = 0;
const TO_COL_ROW_DEFAULT_SCAN = false;
const TO_COL_ROW_ARGS = [
  arg("array (any, range<any>)", _lt("The array which will be transformed.")),
  arg(
    `ignore (number, default=${TO_COL_ROW_DEFAULT_IGNORE})`,
    _lt(
      "The control to ignore blanks and errors. 0 (default) is to keep all values, 1 is to ignore blanks, 2 is to ignore errors, and 3 is to ignore blanks and errors."
    )
  ),
  arg(
    `scan_by_column (number, default=${TO_COL_ROW_DEFAULT_SCAN})`,
    _lt(
      "Whether the array should be scanned by column. True scans the array by column and false (default) \
      scans the array by row."
    )
  ),
];

export const TOCOL: AddFunctionDescription = {
  description: _lt("Transforms a range of cells into a single column."),
  args: TO_COL_ROW_ARGS,
  returns: ["RANGE<ANY>"],
  //TODO compute format
  compute: function (
    array: ArgValue,
    ignore: PrimitiveArgValue = TO_COL_ROW_DEFAULT_IGNORE,
    scanByColumn: PrimitiveArgValue = TO_COL_ROW_DEFAULT_SCAN
  ): CellValue[][] {
    const _array = toMatrixArgValue(array);
    const _ignore = toNumber(ignore);
    const _scanByColumn = toBoolean(scanByColumn);

    assert(() => _ignore >= 0 && _ignore <= 3, _lt("Argument ignore must be between 0 and 3"));

    const mappedFn = (item: OptionalCellValue) => {
      // TODO : implement ignore value 2 (ignore error) & 3 (ignore blanks and errors) once we can have errors in
      // the array w/o crashing
      if ((_ignore === 1 || _ignore === 3) && (item === undefined || item === null)) {
        return undefined;
      }

      return toCellValue(item);
    };

    const result = _scanByColumn
      ? mapAndFlattenMatrix(_array, mappedFn, "colFirst")
      : mapAndFlattenMatrix(_array, mappedFn, "rowFirst");

    return [result.filter(isDefined)];
  },
  isExported: true,
};

// -----------------------------------------------------------------------------
// TOROW
// -----------------------------------------------------------------------------
export const TOROW: AddFunctionDescription = {
  description: _lt("Transforms a range of cells into a single row."),
  args: TO_COL_ROW_ARGS,
  returns: ["RANGE<ANY>"],
  //TODO compute format
  compute: function (
    array: ArgValue,
    ignore: PrimitiveArgValue = TO_COL_ROW_DEFAULT_IGNORE,
    scanByColumn: PrimitiveArgValue = TO_COL_ROW_DEFAULT_SCAN
  ): CellValue[][] {
    const _array = toMatrixArgValue(array);
    const _ignore = toNumber(ignore);
    const _scanByColumn = toBoolean(scanByColumn);

    assert(() => _ignore >= 0 && _ignore <= 3, _lt("Argument ignore must be between 0 and 3"));

    const mappedFn = (item: OptionalCellValue) => {
      // TODO : implement ignore value 2 (ignore error) & 3 (ignore blanks and errors) once we can have errors in
      // the array w/o crashing
      if ((_ignore === 1 || _ignore === 3) && (item === undefined || item === null)) {
        return undefined;
      }

      return [toCellValue(item)];
    };

    const result = _scanByColumn
      ? mapAndFlattenMatrix(_array, mappedFn, "colFirst")
      : mapAndFlattenMatrix(_array, mappedFn, "rowFirst");

    return result.filter(isDefined);
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
