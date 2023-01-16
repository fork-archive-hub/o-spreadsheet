import { Component, onWillUpdateProps, useState } from "@odoo/owl";
import { numberToLetters, zoneToDimension } from "../../../helpers";
import { _lt } from "../../../translation";
import { HeaderIndex, SpreadsheetChildEnv } from "../../../types/index";
import { RemoveDuplicateTerms } from "../../translations_terms";

interface Props {
  onCloseSidePanel: () => void;
}

type Column = {
  isSelected: boolean;
  label: string;
};

interface RemoveDuplicatesState {
  columnsHaveHeaderRow: boolean;
  selectAll: boolean;
  columns: { [colIndex: number]: Column };
}

// Your selection contains a merged cell. To remove duplicates, all cells must contain the same number of rows and columns.

export class RemoveDuplicatesPanel extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-RemoveDuplicatesPanel";

  state: RemoveDuplicatesState = useState({
    columnsHaveHeaderRow: false,
    selectAll: true,
    columns: {},
  });

  setup() {
    onWillUpdateProps(() => this.updateColumns());
  }

  takeHeaderRowIntoAccount() {
    this.state.columnsHaveHeaderRow = !this.state.columnsHaveHeaderRow;
    Object.keys(this.state.columns).forEach((colIndex) => {
      this.state.columns[colIndex].label = this.createColLabel(parseInt(colIndex));
    });
  }

  selectAllColumns() {
    this.state.selectAll = !this.state.selectAll;
    Object.keys(this.state.columns).forEach((colIndex) => {
      this.state.columns[colIndex].isSelected = this.state.selectAll;
    });
  }

  selectColumn(colIndex: number) {
    this.state.columns[colIndex].isSelected = !this.state.columns[colIndex].isSelected;
    this.updateSelectAll();
  }

  onRemoveDuplicates() {
    this.env.model.dispatch("REMOVE_DUPLICATES", {
      hasHeader: this.state.columnsHaveHeaderRow,
      columnsToAnalyze: this.getColToAnalyze(),
    });
  }

  get errorMessages(): string[] {
    const cancelledReasons = this.env.model.canDispatch("REMOVE_DUPLICATES", {
      hasHeader: this.state.columnsHaveHeaderRow,
      columnsToAnalyze: this.getColToAnalyze(),
    }).reasons;

    const errors = new Set<string>();

    for (const reason of cancelledReasons) {
      errors.add(RemoveDuplicateTerms.Errors[reason] || RemoveDuplicateTerms.Errors.Unexpected);
    }
    return Array.from(errors);
  }

  get selectionStatisticalInformation(): string {
    const dimention = zoneToDimension(this.env.model.getters.getSelectedZone());
    return _lt(
      "%s rows and %s columns selected",
      dimention.numberOfRows.toString(),
      dimention.numberOfCols.toString()
    );
  }

  get isRemoveDisabled(): boolean {
    return this.errorMessages.length > 0;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private updateSelectAll() {
    this.state.selectAll = Object.keys(this.state.columns).every(
      (colIndex) => this.state.columns[colIndex].isSelected
    );
  }

  private updateColumns() {
    const zone = this.env.model.getters.getSelectedZone();
    const oldColumns = this.state.columns;
    const newColumns = {};
    for (let i = zone.left; i <= zone.right; i++) {
      newColumns[i] = {
        isSelected: oldColumns[i] ? oldColumns[i].isSelected : true,
        label: this.createColLabel(i),
      };
    }
    this.state.columns = newColumns;
    this.updateSelectAll();
  }

  private createColLabel(col: number) {
    let colLabel = _lt("Column %s", numberToLetters(col));
    if (this.state.columnsHaveHeaderRow) {
      const sheetId = this.env.model.getters.getActiveSheetId();
      const row = this.env.model.getters.getSelectedZone().top;
      const colHeader = this.env.model.getters.getEvaluatedCell({ sheetId, col, row });
      if (colHeader.type !== "empty") {
        colLabel += ` - ${colHeader.value}`;
      }
    }
    return colLabel;
  }

  private getColToAnalyze(): HeaderIndex[] {
    return Object.keys(this.state.columns)
      .filter((colIndex) => this.state.columns[colIndex].isSelected)
      .map((colIndex) => parseInt(colIndex));
  }
}
