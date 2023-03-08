import { Matrix } from "../types";

export function getUnitMatrix(n: number): Matrix<number> {
  const matrix: Matrix<number> = Array(n);
  for (let i = 0; i < n; i++) {
    matrix[i] = Array(n).fill(0);
    matrix[i][i] = 1;
  }
  return matrix;
}
