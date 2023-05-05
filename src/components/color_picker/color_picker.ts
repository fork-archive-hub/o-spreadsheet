import { Component, useState } from "@odoo/owl";
import {
  COLOR_PICKER_DEFAULTS,
  MENU_SEPARATOR_BORDER_WIDTH,
  MENU_SEPARATOR_PADDING,
  SEPARATOR_COLOR,
} from "../../constants";
import { hslaToRGBA, isColorValid, isSameColor, rgbaToHex, toHex } from "../../helpers";
import { chartFontColor } from "../../helpers/figures/charts";
import { Color, Pixel, Rect } from "../../types";
import { SpreadsheetChildEnv } from "../../types/env";
import { css, cssPropertiesToCss } from "../helpers/css";
import { Popover, PopoverProps } from "../popover/popover";

const PICKER_PADDING = 6;

const LINE_VERTICAL_PADDING = 1;
const LINE_HORIZONTAL_PADDING = 6;

const ITEM_HORIZONTAL_MARGIN = 1;
const ITEM_EDGE_LENGTH = 18;
const ITEM_BORDER_WIDTH = 1;

const ITEMS_PER_LINE = 10;
const PICKER_WIDTH =
  ITEMS_PER_LINE * (ITEM_EDGE_LENGTH + ITEM_HORIZONTAL_MARGIN * 2 + 2 * ITEM_BORDER_WIDTH) +
  2 * LINE_HORIZONTAL_PADDING;

const GRADIENT_WIDTH = PICKER_WIDTH - 2 * LINE_HORIZONTAL_PADDING - 2 * ITEM_BORDER_WIDTH;
const GRADIENT_HEIGHT = PICKER_WIDTH - 50;

css/* scss */ `
  .o-color-picker {
    padding: ${PICKER_PADDING}px 0px;
    box-shadow: 1px 2px 5px 2px rgba(51, 51, 51, 0.15);
    background-color: white;
    line-height: 1.2;
    overflow-y: auto;
    overflow-x: hidden;
    width: ${GRADIENT_WIDTH + 2 * PICKER_PADDING}px;

    .o-color-picker-section-name {
      margin: 0px ${ITEM_HORIZONTAL_MARGIN}px;
      padding: 4px ${LINE_HORIZONTAL_PADDING}px;
    }
    .colors-grid {
      display: grid;
      padding: ${LINE_VERTICAL_PADDING}px ${LINE_HORIZONTAL_PADDING}px;
      grid-template-columns: repeat(${ITEMS_PER_LINE}, 1fr);
      grid-gap: ${ITEM_HORIZONTAL_MARGIN * 2}px;
    }
    .o-color-picker-line-item {
      width: ${ITEM_EDGE_LENGTH}px;
      height: ${ITEM_EDGE_LENGTH}px;
      margin: 0px;
      border-radius: 50px;
      border: ${ITEM_BORDER_WIDTH}px solid #666666;
      padding: 0px;
      font-size: 16px;
      background: white;
      &:hover {
        background-color: rgba(0, 0, 0, 0.08);
        outline: 1px solid gray;
        cursor: pointer;
      }
    }
    .o-buttons {
      padding: 6px;
      display: flex;
      .o-cancel {
        margin: 0px ${ITEM_HORIZONTAL_MARGIN}px;
        border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
        width: 100%;
        padding: 5px;
        font-size: 14px;
        background: white;
        border-radius: 4px;
        &:hover:enabled {
          background-color: rgba(0, 0, 0, 0.08);
        }
      }
    }
    .o-add-button {
      border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
      padding: 4px;
      background: white;
      border-radius: 4px;
      &:hover:enabled {
        background-color: rgba(0, 0, 0, 0.08);
      }
    }
    .o-separator {
      border-bottom: ${MENU_SEPARATOR_BORDER_WIDTH}px solid ${SEPARATOR_COLOR};
      margin-top: ${MENU_SEPARATOR_PADDING}px;
      margin-bottom: ${MENU_SEPARATOR_PADDING}px;
    }
    input {
      box-sizing: border-box;
      width: 100%;
      border-radius: 4px;
      padding: 4px 23px 4px 10px;
      height: 24px;
      border: 1px solid #c0c0c0;
      margin: 0 2px 0 0;
    }
    input.o-wrong-color {
      border-color: red;
    }
    .o-custom-selector {
      padding: ${LINE_HORIZONTAL_PADDING}px;
      position: relative;

      .o-gradient {
        position: relative;
        background: linear-gradient(90deg, #fff 0, hsla(0, 0%, 100%, 0));
        background-color: red;
        border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
        width: ${GRADIENT_WIDTH}px;
        height: ${GRADIENT_HEIGHT}px;
        &:hover {
          cursor: crosshair;
        }
        .o-gradient-overlay {
          background: linear-gradient(180deg, transparent 0, #000);
          z-index: 2;
          border-radius: 4px;
          height: 100%;
          left: 0;
          position: absolute;
          top: 0;
          width: 100%;
        }
      }
      .o-custom-input-preview {
        padding: 2px ${LINE_VERTICAL_PADDING}px;
        display: flex;
      }
      .o-custom-input-buttons {
        padding: 2px ${LINE_VERTICAL_PADDING}px;
        text-align: right;
      }
      .o-color-preview {
        border: 1px solid #c0c0c0;
        border-radius: 4px;
        width: 100%;
      }
    }
  }
`;

function computeCustomColor(ev: MouseEvent) {
  return rgbaToHex(
    hslaToRGBA({
      h: (360 * ev.offsetX) / GRADIENT_WIDTH,
      s: 100,
      l: (100 * ev.offsetY) / GRADIENT_HEIGHT,
      a: 1,
    })
  );
}

export interface ColorPickerProps {
  anchorRect: Rect;
  maxHeight?: Pixel;
  onColorPicked: (color: Color) => void;
  currentColor: Color;
}

interface State {
  showGradient: boolean;
  currentColor: Color;
  isCurrentColorInvalid: boolean;
  style: {
    display: string;
    background: Color;
    left: string;
    top: string;
  };
}

export class ColorPicker extends Component<ColorPickerProps, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-ColorPicker";
  static defaultProps = {
    currentColor: "", //TODO Change it to false instead of empty string
  };
  static components = { Popover };
  COLORS = COLOR_PICKER_DEFAULTS;

  private state: State = useState({
    showGradient: false,
    currentColor: isColorValid(this.props.currentColor) ? this.props.currentColor : "",
    isCurrentColorInvalid: false,
    style: {
      display: "none",
      background: "#ffffff",
      left: "0",
      top: "0",
    },
  });

  get colorPickerStyle(): string {
    if (this.props.maxHeight !== undefined && this.props.maxHeight <= 0) {
      return cssPropertiesToCss({ display: "none" });
    }
    return "";
  }

  get popoverProps(): PopoverProps {
    return {
      anchorRect: this.props.anchorRect,
      maxHeight: this.props.maxHeight,
      positioning: "BottomLeft",
      verticalOffset: 0,
    };
  }
  onColorClick(color: Color) {
    if (color) {
      this.props.onColorPicked(toHex(color));
    }
  }

  getCheckMarkColor(): Color {
    return chartFontColor(this.props.currentColor);
  }

  resetColor() {
    this.props.onColorPicked("");
  }

  setCustomColor(ev: Event) {
    if (!isColorValid(this.state.currentColor)) {
      ev.stopPropagation();
      this.state.isCurrentColorInvalid = true;
      return;
    }
    const color = toHex(this.state.currentColor);
    this.state.isCurrentColorInvalid = false;
    this.props.onColorPicked(color);
    this.state.currentColor = color;
  }

  toggleColorPicker() {
    this.state.showGradient = !this.state.showGradient;
  }

  computeCustomColor(ev: MouseEvent) {
    this.state.isCurrentColorInvalid = false;
    this.state.currentColor = computeCustomColor(ev);
  }

  isSameColor(color1: Color, color2: Color): boolean {
    return isSameColor(color1, color2);
  }
}

ColorPicker.props = {
  onColorPicked: Function,
  currentColor: { type: String, optional: true },
  maxHeight: { type: Number, optional: true },
  anchorRect: Object,
};
