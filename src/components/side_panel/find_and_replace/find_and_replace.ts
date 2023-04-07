import { Component, onMounted, onWillUnmount, useEffect, useRef, useState } from "@odoo/owl";
import { RangeImpl } from "../../../helpers";
import { SpreadsheetChildEnv } from "../../../types/index";
import { css } from "../../helpers/css";
import { SelectionInput } from "../../selection_input/selection_input";

css/* scss */ `
  .o-find-and-replace {
    .o-far-item {
      display: block;
      .o-far-checkbox {
        display: inline-block;
        .o-far-input {
          vertical-align: middle;
        }
        .o-far-label {
          position: relative;
          top: 1.5px;
          padding-left: 4px;
        }
      }
    }
    outline: none;
    height: 100%;
    .o-input-search-container {
      display: flex;
      .o-input-with-count {
        flex-grow: 1;
        width: auto;
      }
      .o-input-without-count {
        width: 100%;
      }
      .o-input-count {
        width: fit-content;
        padding: 4 0 4 4;
      }
    }
  }
`;

interface Props {
  onCloseSidePanel: () => void;
}

interface FindAndReplaceState {
  toSearch: string;
  replaceWith: string;
  searchOptions: {
    matchCase: boolean;
    exactMatch: boolean;
    searchFormulas: boolean;
    searchScope: "allSheets" | "thisSheet" | "specificRange";
    specificRange: RangeImpl | undefined;
  };
}

export class FindAndReplacePanel extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-FindAndReplacePanel";
  private state: FindAndReplaceState = useState(this.initialState());
  private debounceTimeoutId;
  private showFormulaState: boolean = false;
  static components = { SelectionInput };

  private findAndReplaceRef = useRef("findAndReplace");
  private selectionInputref = useRef("selectionInput");
  private dataRange: string[] = [];
  private lastSpecificRange: RangeImpl | undefined = undefined;
  private lastClickedButton: string = "next";

  get hasSearchResult() {
    return this.env.model.getters.getCurrentSelectedMatchIndex() !== null;
  }

  get pendingSearch() {
    return this.debounceTimeoutId !== undefined;
  }

  setup() {
    this.showFormulaState = this.env.model.getters.shouldShowFormulas();

    onMounted(() => this.focusInput());

    useEffect(
      () => {
        this.focusButton(this.lastClickedButton);
      },
      () => [this.env.model.getters.getActiveSheetId()]
    );

    useEffect(
      () => {
        if (
          this.state.searchOptions.searchScope === "specificRange" &&
          !this.state.searchOptions.specificRange
        ) {
          this.state.searchOptions.specificRange = this.lastSpecificRange;
        } else if (
          this.state.searchOptions.searchScope !== "specificRange" &&
          this.state.searchOptions.specificRange
        ) {
          this.lastSpecificRange = this.state.searchOptions.specificRange;
          this.state.searchOptions.specificRange = undefined;
        }
        this.updateSearch();
      },
      () => [this.state.searchOptions.searchScope]
    );

    onWillUnmount(() => {
      this.env.model.dispatch("CLEAR_SEARCH");
      this.env.model.dispatch("SET_FORMULA_VISIBILITY", { show: this.showFormulaState });
    });
  }

  private focusButton(buttonName: string) {
    setTimeout(() => {
      const el = this.selectionInputref.el!;
      if (el) {
        const buttonElement = this.findAndReplaceRef.el!.querySelector(
          `button[name=${buttonName}]`
        ) as HTMLButtonElement;
        buttonElement.focus();
      }
    }, 0);
  }

  onFocusSearch() {
    const el = this.selectionInputref.el!;
    if (el) {
      const confirmButton = el.querySelector(".o-btn-action.o-selection-ok") as HTMLButtonElement;
      confirmButton.click();
    }
  }

  onInput(ev) {
    this.state.toSearch = ev.target.value;
    this.debouncedUpdateSearch();
  }

  onKeydownSearch(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();
      this.onSelectNextCell();
    }
  }

  onKeydownReplace(ev: KeyboardEvent) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();
      this.replace();
    }
  }

  onFocusSidePanel() {
    this.state.searchOptions.searchFormulas = this.env.model.getters.shouldShowFormulas();
  }

  searchFormulas() {
    this.env.model.dispatch("SET_FORMULA_VISIBILITY", {
      show: this.state.searchOptions.searchFormulas,
    });
    this.updateSearch();
  }

  onSearchRangeChanged(ranges: string[]) {
    this.dataRange = ranges;
  }

  updateDataRange() {
    const range = this.dataRange[0];
    const sheetId = this.env.model.getters.getActiveSheetId();
    if (!range) {
      return;
    }
    if (this.state.searchOptions.searchScope === "specificRange") {
      this.state.searchOptions.specificRange = this.env.model.getters.getRangeFromSheetXC(
        sheetId,
        range
      );
    }
    this.env.model.dispatch("UPDATE_SEARCH", {
      toSearch: this.state.toSearch,
      searchOptions: this.state.searchOptions,
    });
  }

  onSelectPreviousCell() {
    this.env.model.dispatch("SELECT_SEARCH_PREVIOUS_MATCH");
    this.lastClickedButton = "prev";
  }
  onSelectNextCell() {
    this.env.model.dispatch("SELECT_SEARCH_NEXT_MATCH");
    this.lastClickedButton = "next";
  }
  updateSearch() {
    this.env.model.dispatch("UPDATE_SEARCH", {
      toSearch: this.state.toSearch,
      searchOptions: this.state.searchOptions,
    });
  }
  debouncedUpdateSearch() {
    clearTimeout(this.debounceTimeoutId);
    this.debounceTimeoutId = setTimeout(() => {
      this.updateSearch();
      this.debounceTimeoutId = undefined;
    }, 400);
  }

  replace() {
    this.env.model.dispatch("REPLACE_SEARCH", {
      replaceWith: this.state.replaceWith,
    });
    this.lastClickedButton = "replace";
  }

  replaceAll() {
    this.env.model.dispatch("REPLACE_ALL_SEARCH", {
      replaceWith: this.state.replaceWith,
    });
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------
  private focusInput() {
    const el = this.findAndReplaceRef.el!;
    const input = el.querySelector(`input`);
    if (input) {
      input.focus();
    }
  }

  private initialState(): FindAndReplaceState {
    return {
      toSearch: "",
      replaceWith: "",
      searchOptions: {
        matchCase: false,
        exactMatch: false,
        searchFormulas: false,
        searchScope: "allSheets",
        specificRange: undefined,
      },
    };
  }
}

FindAndReplacePanel.props = {
  onCloseSidePanel: Function,
};
