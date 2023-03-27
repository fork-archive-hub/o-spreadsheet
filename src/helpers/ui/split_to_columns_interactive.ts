import { CommandResult } from "../..";
import { _lt } from "../../translation";
import { SpreadsheetChildEnv } from "../../types";

export const SplitToColumnsInteractiveContent = {
  SplitIsDestructive: _lt("This will overwrite data in the subsequent columns. Split anyway?"),
};

export function interactiveSplitToColumns(
  env: SpreadsheetChildEnv,
  separator: string,
  addNewColumns: boolean
) {
  const result = env.model.dispatch("SPLIT_TEXT_INTO_COLUMNS", { separator, addNewColumns });
  if (result.isCancelledBecause(CommandResult.SplitWillOverwriteContent)) {
    env.askConfirmation(SplitToColumnsInteractiveContent.SplitIsDestructive, () => {
      env.model.dispatch("SPLIT_TEXT_INTO_COLUMNS", { separator, addNewColumns, force: true });
    });
  }
}
