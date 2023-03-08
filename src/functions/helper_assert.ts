import { ArgValue, MatrixArgValue } from "../types";
import { assert, isMatrixArgValue } from "./helpers";

export function assertSingleColOrRow(errorStr: string, arg: MatrixArgValue) {
  assert(() => arg.length === 1 || arg[0].length === 1, errorStr);
}

export function assertSameDimensions(errorStr: string, ...args: ArgValue[]) {
  if (args.every(isMatrixArgValue)) {
    const cols = args[0].length;
    const rows = args[0][0].length;
    for (const arg of args) {
      assert(() => arg.length === cols && arg[0].length === rows, errorStr);
    }
    return;
  }
  if (args.some((arg) => Array.isArray(arg) && arg.length !== 1 && arg[0].length !== 1)) {
    throw new Error(errorStr);
  }
}

export function assertArraySameDimensions(errorStr: string, ...args: any[][]) {
  const dims = args[0].length;
  for (const arg of args) {
    assert(() => arg.length === dims, errorStr);
  }
}
