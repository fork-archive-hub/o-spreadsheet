import { Component, useRef, useState } from "@odoo/owl";
import { MENU_WIDTH } from "../../../constants";
import { getMaxFigureSize } from "../../../helpers/figures/figure/figure";
import { createMenu } from "../../../registries/menu_items_registry";
import { _lt } from "../../../translation";
import { DOMCoordinates, Figure, SpreadsheetChildEnv, UID } from "../../../types";
import { useAbsoluteBoundingRect } from "../../helpers/position_hook";
import { Menu, MenuState } from "../../menu/menu";

interface Props {
  figure: Figure;
  onFigureDeleted: () => void;
}

export class ImageFigure extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-ImageFigure";
  static components = { Menu };
  private menuState: Pick<MenuState, "isOpen" | "position"> = useState({
    isOpen: false,
    position: null,
  });

  private imageContainerRef = useRef("o-image");
  private menuButtonRef = useRef("menuButton");
  private menuButtonRect = useAbsoluteBoundingRect(this.menuButtonRef);
  private position: DOMCoordinates = useAbsoluteBoundingRect(this.imageContainerRef);

  readonly menuItems = createMenu([
    {
      id: "copy",
      name: _lt("Copy"),
      description: "Ctrl+C",
      action: async () => {
        this.env.model.dispatch("SELECT_FIGURE", { id: this.figureId });
        this.env.model.dispatch("COPY");
        await this.env.clipboard.write(this.env.model.getters.getClipboardContent());
      },
    },
    {
      id: "cut",
      name: _lt("Cut"),
      description: "Ctrl+X",
      action: async () => {
        this.env.model.dispatch("SELECT_FIGURE", { id: this.figureId });
        this.env.model.dispatch("CUT");
        await this.env.clipboard.write(this.env.model.getters.getClipboardContent());
      },
    },
    {
      id: "reset_size",
      name: _lt("Reset size"),
      action: async () => {
        const imagePath = this.getImagePath;
        const figure = this.env.model.getters.getFigure(
          this.env.model.getters.getActiveSheetId(),
          this.figureId
        )!;
        const size = (await this.env.imageProvider?.getImageSize(imagePath)) || {
          width: figure.width,
          height: figure.height,
        };
        const { height, width } = getMaxFigureSize(this.env.model.getters, size);
        this.env.model.dispatch("UPDATE_FIGURE", {
          sheetId: this.env.model.getters.getActiveSheetId(),
          id: this.figureId,
          height,
          width,
        });
      },
    },
    {
      id: "delete",
      name: _lt("Delete image"),
      description: "delete",
      action: () => {
        this.env.model.dispatch("DELETE_FIGURE", {
          sheetId: this.env.model.getters.getActiveSheetId(),
          id: this.figureId,
        });
      },
    },
  ]);

  onContextMenu(ev: MouseEvent) {
    const position = {
      x: this.position.x + ev.offsetX,
      y: this.position.y + ev.offsetY,
    };
    this.openContextMenu(position);
  }

  showMenu() {
    const { x, y, width } = this.menuButtonRect;
    const menuPosition = {
      x: x >= MENU_WIDTH ? x - MENU_WIDTH : x + width,
      y: y,
    };
    this.openContextMenu(menuPosition);
  }

  private openContextMenu(position: DOMCoordinates) {
    this.menuState.isOpen = true;
    this.menuState.position = position;
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get figureId(): UID {
    return this.props.figure.id;
  }

  get getImagePath(): string {
    return this.env.model.getters.getImagePath(this.figureId);
  }
}

ImageFigure.props = {
  figure: Object,
  onFigureDeleted: Function,
};
