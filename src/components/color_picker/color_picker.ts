import { Component, useRef, useState } from "@odoo/owl";
import {
  COLOR_PICKER_DEFAULTS,
  ICON_EDGE_LENGTH,
  MENU_SEPARATOR_BORDER_WIDTH,
  MENU_SEPARATOR_PADDING,
  SEPARATOR_COLOR,
} from "../../constants";
import {
  clip,
  hexToHSLA,
  hslaToHex,
  isColorValid,
  isHSLAValid,
  isSameColor,
  toHex,
} from "../../helpers";
import { chartFontColor } from "../../helpers/figures/charts";
import { Color, HSLA, Pixel, PixelPosition, Rect } from "../../types";
import { SpreadsheetChildEnv } from "../../types/env";
import { css, cssPropertiesToCss } from "../helpers/css";
import { startDnd } from "../helpers/drag_and_drop";
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

const MAGNIFIER_EDGE = 18;

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
    .o-color-picker-toggler-button {
      display: flex;
      .o-color-picker-toggler-sign {
        margin: auto auto;
        width: 55%;
        height: 55%;
        .o-icon {
          width: 100%;
          height: 100%;
        }
      }
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

    .o-custom-selector {
      padding: ${LINE_HORIZONTAL_PADDING}px ${LINE_HORIZONTAL_PADDING + 2 * LINE_VERTICAL_PADDING}px;
      position: relative;
      .o-gradient {
        border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
        box-sizing: border-box;
        width: 100%;
        height: ${GRADIENT_HEIGHT}px;
        position: relative;
      }
      /** TODORAR: add constants for this shit */
      .magnifier {
        height: ${MAGNIFIER_EDGE}px;
        width: ${MAGNIFIER_EDGE}px;
        box-sizing: border-box;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0px 0px 3px #c0c0c0;
        position: absolute;
        z-index: 2;
      }

      .saturation {
        background: linear-gradient(to right, #fff 0%, transparent 100%);
      }
      .lightness {
        background: linear-gradient(to top, #000 0%, transparent 100%);
      }
      .hue {
        border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
        box-sizing: border-box;
        width: 100%;
        height: 12px;
        border-radius: 4px;
        background: linear-gradient(
          to right,
          hsl(0 100% 50%) 0%,
          hsl(0.2turn 100% 50%) 20%,
          hsl(0.3turn 100% 50%) 30%,
          hsl(0.4turn 100% 50%) 40%,
          hsl(0.5turn 100% 50%) 50%,
          hsl(0.6turn 100% 50%) 60%,
          hsl(0.7turn 100% 50%) 70%,
          hsl(0.8turn 100% 50%) 80%,
          hsl(0.9turn 100% 50%) 90%,
          hsl(1turn 100% 50%) 100%
        );
        position: relative;
        cursor: crosshair;
      }

      .slider {
        margin-top: 5px;
        left: -8;
      }

      input {
        box-sizing: border-box;
        width: 50%;
        border-radius: 4px;
        padding: 4px 23px 4px 10px;
        height: 24px;
        border: 1px solid #c0c0c0;
        margin: 0 2px 0 0;
      }
      input.o-wrong-color {
        outline-color: red;
        border-color: red;
        &:focus {
          outline-style: solid;
          outline-width: 1px;
        }
      }
      .o-custom-input-preview {
        padding: 2px 0px;
        display: flex;
      }
      .o-custom-input-buttons {
        padding: 2px 0px;
        text-align: right;
      }
      .o-color-preview {
        border: 1px solid #c0c0c0;
        border-radius: 4px;
        width: 50%;
      }
    }
  }
  .o-magnifier-glass {
    position: absolute;
    border: ${ITEM_BORDER_WIDTH}px solid #c0c0c0;
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`;

export interface ColorPickerProps {
  anchorRect: Rect;
  maxHeight?: Pixel;
  onColorPicked: (color: Color) => void;
  currentColor: Color;
}

interface State {
  showGradient: boolean;
  currentHslaColor: HSLA;
  isCurrentColorInvalid: boolean;
  customHexColor: Color;
}

export class ColorPicker extends Component<ColorPickerProps, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-ColorPicker";
  static defaultProps = {
    currentColor: "", //TODO Change it to false instead of empty string
  };
  static components = { Popover };
  COLORS = COLOR_PICKER_DEFAULTS;

  gradientRef = useRef("gradient");
  hueRef = useRef("hue");
  hexInputRef = useRef("hexInput");

  private state: State = useState({
    showGradient: false,
    currentHslaColor: isColorValid(this.props.currentColor)
      ? hexToHSLA(this.props.currentColor)
      : { h: 0, s: 100, l: 100, a: 1 },
    isCurrentColorInvalid: false,
    customHexColor: isColorValid(this.props.currentColor) ? toHex(this.props.currentColor) : "",
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

  get gradientStyle(): string {
    const hue = this.state.currentHslaColor?.h || 0;
    return cssPropertiesToCss({
      background: `hsl(${hue} 100% 50%)`,
    });
  }

  get sliderStyle(): string {
    const hue = this.state.currentHslaColor?.h || 0;
    const delta = Math.round((hue / 360) * GRADIENT_WIDTH);
    const left = -(ICON_EDGE_LENGTH / 2 - 1) + delta;
    return cssPropertiesToCss({
      left: `${left}px`,
    });
  }

  get pointerStyle(): string {
    // TODORAR too complicated
    const { s, l } = this.state.currentHslaColor || { s: 0, l: 0 };
    const left =
      -MAGNIFIER_EDGE / 2 + clip(Math.round((s / 100) * GRADIENT_WIDTH), 0, GRADIENT_WIDTH);
    const top =
      -MAGNIFIER_EDGE / 2 +
      clip(Math.round(GRADIENT_HEIGHT * (1 - (l * 2) / (200 - s))), 0, GRADIENT_HEIGHT);

    return cssPropertiesToCss({
      left: `${left}px`,
      top: `${top}px`,
      background: hslaToHex(this.state.currentHslaColor!),
    });
  }

  get colorPreviewStyle(): string {
    return cssPropertiesToCss({
      "background-color": hslaToHex(this.state.currentHslaColor),
    });
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

  AddCustomColor(ev: Event) {
    if (!isHSLAValid(this.state.currentHslaColor) || !isColorValid(this.state.customHexColor)) {
      ev.stopPropagation();
      this.state.isCurrentColorInvalid = true;
      return;
    }
    ev.stopPropagation();
    this.state.isCurrentColorInvalid = false;
    this.props.onColorPicked(toHex(this.state.customHexColor));
  }

  toggleColorPicker() {
    this.state.showGradient = !this.state.showGradient;
  }

  setCustomGradient({ x, y }: PixelPosition) {
    // TODORAR: round issues
    // TODORAR make a converter and inverse converter
    const offsetX = clip(x, 0, GRADIENT_WIDTH);
    const offsetY = clip(y, 0, GRADIENT_HEIGHT);
    const deltaX = offsetX / GRADIENT_WIDTH;
    const deltaY = offsetY / GRADIENT_HEIGHT;
    const s = 100 * deltaX;
    const l = 100 * (1 - deltaY) * (1 - 0.5 * deltaX);
    this.updateColor({ s, l });
  }

  setCustomHue(x: Pixel) {
    const h = (360 * x) / GRADIENT_WIDTH;
    this.updateColor({ h });
  }

  updateColor(newHsl: Partial<Omit<HSLA, "a">>) {
    this.state.isCurrentColorInvalid = false;
    this.state.currentHslaColor = { ...this.state.currentHslaColor, ...newHsl };
    this.state.customHexColor = hslaToHex(this.state.currentHslaColor);
  }

  dragGradientPointer(ev: MouseEvent) {
    const initialGradientCoordinates = { x: ev.offsetX, y: ev.offsetY };
    this.setCustomGradient(initialGradientCoordinates);

    const initialMousePosition = { x: ev.clientX, y: ev.clientY };

    // TODORAR: does not work ,we probably should use the magnifier logic instead
    // while hiding the pointer
    // copy what goes on in figure drag & drop
    const onMouseMove = (ev: MouseEvent) => {
      const currentMousePosition = { x: ev.clientX, y: ev.clientY };
      const deltaX = currentMousePosition.x - initialMousePosition.x;
      const deltaY = currentMousePosition.y - initialMousePosition.y;

      // TODORAR too complicated
      const currentGradientCoordinates = {
        x: clip(
          initialGradientCoordinates.x + deltaX,
          0,
          GRADIENT_WIDTH - ITEM_BORDER_WIDTH * 2 - 2
        ),
        y: clip(
          initialGradientCoordinates.y + deltaY,
          0,
          GRADIENT_HEIGHT - ITEM_BORDER_WIDTH * 2 - 2
        ),
      };
      this.setCustomGradient(currentGradientCoordinates);
    };

    startDnd(onMouseMove, () => {});
  }

  dragHuePointer(ev: MouseEvent) {
    const initialX = ev.offsetX;
    const initialMouseX = ev.clientX;
    this.setCustomHue(initialX);
    const onMouseMove = (ev: MouseEvent) => {
      const currentMouseX = ev.clientX;
      const deltaX = currentMouseX - initialMouseX;
      const x = clip(initialX + deltaX, 0, GRADIENT_WIDTH - ITEM_BORDER_WIDTH * 2 - 2);
      this.setCustomHue(x);
    };
    startDnd(onMouseMove, () => {});
  }

  setHexColor() {
    const val = (this.hexInputRef.el as HTMLInputElement)?.value;
    this.state.customHexColor = val;
    this.state.isCurrentColorInvalid = false;
    if (!isColorValid(val)) {
      this.state.isCurrentColorInvalid = true;
    } else {
      this.state.currentHslaColor = hexToHSLA(val);
    }
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
