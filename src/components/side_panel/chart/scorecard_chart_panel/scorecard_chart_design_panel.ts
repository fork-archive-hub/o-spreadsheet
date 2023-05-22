import { Component, useExternalListener, useState } from "@odoo/owl";
import { ScorecardChartDefinition } from "../../../../types/chart/scorecard_chart";
import { Color, DispatchResult, SpreadsheetChildEnv, UID } from "../../../../types/index";
import { ColorPicker } from "../../../color_picker/color_picker";

type ColorPickerId = undefined | "backgroundColor" | "baselineColorUp" | "baselineColorDown";

interface Props {
  figureId: UID;
  definition: ScorecardChartDefinition;
  updateChart: (figureId: UID, definition: Partial<ScorecardChartDefinition>) => DispatchResult;
}

interface PanelState {
  openedColorPicker: ColorPickerId;
}

export class ScorecardChartDesignPanel extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-ScorecardChartDesignPanel";
  static components = { ColorPicker };

  private state: PanelState = useState({
    openedColorPicker: undefined,
  });

  onClick(ev: MouseEvent) {
    this.state.openedColorPicker = undefined;
  }

  setup() {
    useExternalListener(window, "click", this.onClick);
  }

  updateTitle(ev) {
    this.props.updateChart(this.props.figureId, {
      title: ev.target.value,
    });
  }

  updateBaselineDescr(ev) {
    this.props.updateChart(this.props.figureId, { baselineDescr: ev.target.value });
  }

  openColorPicker(colorPickerId: ColorPickerId) {
    this.state.openedColorPicker = colorPickerId;
  }

  setColor(color: Color, colorPickerId: ColorPickerId) {
    switch (colorPickerId) {
      case "backgroundColor":
        this.props.updateChart(this.props.figureId, { background: color });
        break;
      case "baselineColorDown":
        this.props.updateChart(this.props.figureId, { baselineColorDown: color });
        break;
      case "baselineColorUp":
        this.props.updateChart(this.props.figureId, { baselineColorUp: color });
        break;
    }
    this.state.openedColorPicker = undefined;
  }
}

ScorecardChartDesignPanel.props = {
  figureId: String,
  definition: Object,
  updateChart: Function,
};
