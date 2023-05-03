import {
  Component,
  onMounted,
  onPatched,
  onWillRender,
  onWillUpdateProps,
  useExternalListener,
  useRef,
  useState,
} from "@odoo/owl";
import { Action } from "../../actions/action";
import {
  BG_HOVER_COLOR,
  ICONS_COLOR,
  MENU_ITEM_DISABLED_COLOR,
  MENU_ITEM_HEIGHT,
  MENU_ITEM_PADDING_HORIZONTAL,
  MENU_ITEM_PADDING_VERTICAL,
  MENU_VERTICAL_PADDING,
  MENU_WIDTH,
} from "../../constants";
import { DOMCoordinates, MenuMouseEvent, Pixel, Ref, SpreadsheetChildEnv, UID } from "../../types";
import { css } from "../helpers/css";
import { getOpenedMenus, isChildEvent } from "../helpers/dom_helpers";
import { useAbsoluteBoundingRect } from "../helpers/position_hook";
import { Popover, PopoverProps } from "../popover/popover";

//------------------------------------------------------------------------------
// Context Menu Component
//------------------------------------------------------------------------------

css/* scss */ `
  .o-menu {
    background-color: white;
    padding: ${MENU_VERTICAL_PADDING}px 0px;
    width: ${MENU_WIDTH}px;
    box-sizing: border-box !important;

    &:focus {
      outline: none;
    }

    .o-menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      height: ${MENU_ITEM_HEIGHT}px;
      padding: ${MENU_ITEM_PADDING_VERTICAL}px ${MENU_ITEM_PADDING_HORIZONTAL}px;
      cursor: pointer;
      user-select: none;

      &.o-menu-root {
        display: flex;
        justify-content: space-between;
      }

      .o-menu-item-icon {
        display: inline-block;
        margin: 0px 8px 0px 0px;
        width: ${MENU_ITEM_HEIGHT - 2 * MENU_ITEM_PADDING_VERTICAL}px;
        line-height: ${MENU_ITEM_HEIGHT - 2 * MENU_ITEM_PADDING_VERTICAL}px;
      }
      .o-menu-item-root {
        width: 10px;
      }

      &:not(.disabled) {
        &.o-menu-item-active {
          background-color: ${BG_HOVER_COLOR};
        }
        .o-menu-item-description {
          color: grey;
        }
        .o-menu-item-icon {
          .o-icon {
            color: ${ICONS_COLOR};
          }
        }
      }
      &.disabled {
        color: ${MENU_ITEM_DISABLED_COLOR};
        cursor: not-allowed;
      }
    }
  }
`;

type MenuItemOrSeparator = Action | "separator";

interface Props {
  position: DOMCoordinates;
  menuItems: Action[];
  depth: number;
  maxHeight?: Pixel;
  onClose: () => void;
  onMenuClicked?: (ev: CustomEvent) => void;
  menuId?: UID;
  backToParent?: (direction?: string, propagation?: boolean) => void;
  shouldSelectFirstItem?: boolean;
}

export interface MenuState {
  isOpen: boolean;
  parentMenu?: Action;
  position: null | DOMCoordinates;
  scrollOffset?: Pixel;
  menuItems: Action[];
  menuIndex?: number;
  shouldSelectFirstItem?: boolean;
}
export class Menu extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-Menu";

  static components = { Menu, Popover };
  static defaultProps = {
    depth: 1,
  };
  private clickableMenuItems: Action[] = [];
  private subMenu: MenuState = useState({
    isOpen: false,
    position: null,
    scrollOffset: 0,
    menuItems: [],
    menuIndex: this.props.shouldSelectFirstItem ? 0 : undefined,
    shouldSelectFirstItem: false,
  });
  private menuRef = useRef("menu");
  private position: DOMCoordinates = useAbsoluteBoundingRect(this.menuRef);
  private menuItemRefs: { [id: string]: { action: Action; ref: Ref<HTMLElement> } } = {};
  // @ts-ignore: childrenHaveIcon will be used in XML
  childrenHaveIcon: boolean = false;

  setup() {
    this.props.menuItems.forEach((menuItem) => {
      this.menuItemRefs[menuItem.id] = {
        action: menuItem,
        ref: useRef(menuItem.id),
      };
    });
    useExternalListener(window, "click", this.onExternalClick, { capture: true });
    useExternalListener(window, "contextmenu", this.onExternalClick, { capture: true });
    onWillRender(() => {
      let previousSelectedMenuId: string | undefined;
      if (this.subMenu.menuIndex !== undefined && this.clickableMenuItems[this.subMenu.menuIndex]) {
        previousSelectedMenuId = this.clickableMenuItems[this.subMenu.menuIndex].id;
      }
      this.childrenHaveIcon = this.props.menuItems.some(
        (menuItem) => !!menuItem.icon || !!menuItem.isActive
      );
      this.clickableMenuItems = this.props.menuItems.filter(
        (menuItem) => menuItem.isEnabled(this.env) && menuItem.isVisible(this.env)
      );
      const newSelectedMenuIndex = this.clickableMenuItems.findIndex(
        (item) => item.id === previousSelectedMenuId
      );
      this.subMenu.menuIndex = newSelectedMenuIndex === -1 ? undefined : newSelectedMenuIndex;
      if (
        this.subMenu.menuIndex === undefined &&
        this.clickableMenuItems.length > 0 &&
        this.props.shouldSelectFirstItem
      ) {
        this.subMenu.menuIndex = 0;
      }
    });
    onMounted(() => this.focus());
    onWillUpdateProps((nextProps: Props) => {
      if (nextProps.menuItems !== this.props.menuItems) {
        this.closeSubMenu();
      }
    });
    onPatched(() => this.focus());
  }

  focus() {
    if (this.subMenu.isOpen) return;
    this.menuRef.el?.focus();
  }

  get menuItemsAndSeparators(): MenuItemOrSeparator[] {
    const menuItemsAndSeparators: MenuItemOrSeparator[] = [];
    for (let i = 0; i < this.props.menuItems.length; i++) {
      const menuItem = this.props.menuItems[i];
      if (menuItem.isVisible(this.env)) {
        menuItemsAndSeparators.push(menuItem);
      }
      if (
        menuItem.separator &&
        i !== this.props.menuItems.length - 1 && // no separator at the end
        menuItemsAndSeparators[menuItemsAndSeparators.length - 1] !== "separator" // no double separator
      ) {
        menuItemsAndSeparators.push("separator");
      }
    }
    if (menuItemsAndSeparators[menuItemsAndSeparators.length - 1] === "separator") {
      menuItemsAndSeparators.pop();
    }
    if (menuItemsAndSeparators.length === 1 && menuItemsAndSeparators[0] === "separator") {
      return [];
    }
    return menuItemsAndSeparators;
  }

  get subMenuPosition(): DOMCoordinates {
    const position = Object.assign({}, this.subMenu.position);
    position.y -= this.subMenu.scrollOffset || 0;
    return position;
  }

  get popoverProps(): PopoverProps {
    const isRoot = this.props.depth === 1;
    return {
      anchorRect: {
        x: this.props.position.x - MENU_WIDTH * (this.props.depth - 1),
        y: this.props.position.y,
        width: isRoot ? 0 : MENU_WIDTH,
        height: isRoot ? 0 : MENU_ITEM_HEIGHT,
      },
      positioning: "TopRight",
      verticalOffset: isRoot ? 0 : MENU_VERTICAL_PADDING,
      onPopoverHidden: () => this.closeSubMenu(),
      onPopoverMoved: () => this.closeSubMenu(),
    };
  }

  isMenuItemActive(menuItem: Action): boolean {
    if (this.subMenu.menuIndex === undefined) {
      return this.isParentMenu(this.subMenu, menuItem);
    }
    return (
      this.isParentMenu(this.subMenu, menuItem) ||
      menuItem.id === this.clickableMenuItems[this.subMenu.menuIndex]?.id
    );
  }

  getIconName(menu: Action) {
    if (menu.icon) {
      return menu.icon;
    }
    if (menu.isActive?.(this.env)) {
      return "o-spreadsheet-Icon.CHECK";
    }

    return "";
  }

  getColor(menu: Action) {
    return menu.textColor ? `color: ${menu.textColor}` : undefined;
  }

  async activateMenu(menu: Action) {
    const result = await menu.execute?.(this.env);
    this.close();
    this.props.onMenuClicked?.({ detail: result } as CustomEvent);
  }

  private close() {
    this.closeSubMenu();
    this.props.onClose();
  }

  private onExternalClick(ev: MenuMouseEvent) {
    // Don't close a root menu when clicked to open the submenus.
    const el = this.menuRef.el;
    if (el && getOpenedMenus().some((el) => isChildEvent(el, ev))) {
      return;
    }
    ev.closedMenuId = this.props.menuId;
    this.close();
  }

  getName(menu: Action) {
    return menu.name(this.env);
  }

  isRoot(menu: Action) {
    return !menu.execute;
  }

  isEnabled(menu: Action) {
    if (menu.isEnabled(this.env)) {
      return this.env.model.getters.isReadonly() ? menu.isReadonlyAllowed : true;
    }
    return false;
  }

  onScroll(ev) {
    this.subMenu.scrollOffset = ev.target.scrollTop;
  }

  /**
   * If the given menu is not disabled, open it's submenu at the
   * correct position according to available surrounding space.
   */
  openSubMenu(parentMenuEl: HTMLElement, parentMenu: Action) {
    const y = parentMenuEl.getBoundingClientRect().top;
    this.subMenu.position = {
      x: this.position.x + this.props.depth * MENU_WIDTH,
      y: y - (this.subMenu.scrollOffset || 0),
    };
    this.subMenu.menuIndex = this.clickableMenuItems.findIndex(
      (menuItem) => menuItem.id === parentMenu.id
    );
    this.subMenu.menuItems = parentMenu.children(this.env);
    this.subMenu.isOpen = true;
    this.subMenu.parentMenu = parentMenu;
  }

  openSubMenuViaMouse(parentMenu: Action, ev: MouseEvent) {
    const parentMenuEl = ev.currentTarget as HTMLElement;
    this.openSubMenu(parentMenuEl, parentMenu);
  }

  openSubMenuViaKeyboard() {
    if (this.subMenu.menuIndex === undefined || this.clickableMenuItems.length === 0) {
      this.props.backToParent?.("right", true);
      return;
    }
    const parentMenu = this.clickableMenuItems[this.subMenu.menuIndex];
    if (!parentMenu || !this.menuItemRefs[parentMenu.id]) return;
    if (parentMenu.children(this.env).length === 0) {
      this.props.backToParent?.("right", true);
      return;
    }
    const { ref } = this.menuItemRefs[parentMenu.id];
    const parentMenuEl = ref.el as HTMLElement;
    if (!parentMenuEl) return;
    this.subMenu.shouldSelectFirstItem = true;
    this.openSubMenu(parentMenuEl, parentMenu);
  }

  isParentMenu(subMenu: MenuState, menuItem: Action) {
    return subMenu.parentMenu?.id === menuItem.id;
  }

  closeSubMenu() {
    this.subMenu.isOpen = false;
    this.subMenu.parentMenu = undefined;
  }

  onClickMenu(menu: Action, ev: MouseEvent) {
    if (this.isEnabled(menu)) {
      if (this.isRoot(menu)) {
        this.openSubMenuViaMouse(menu, ev);
      } else {
        this.activateMenu(menu);
      }
    }
  }

  onMouseMove(menu: Action, ev: MouseEvent) {
    this.subMenu.shouldSelectFirstItem = false;
    this.subMenu.menuIndex = this.clickableMenuItems.findIndex(
      (menuItem) => menuItem.id === menu.id
    );
    if (this.isEnabled(menu)) {
      if (this.isRoot(menu)) {
        this.openSubMenuViaMouse(menu, ev);
      } else {
        this.closeSubMenu();
      }
    }
  }

  onKeydown(ev: KeyboardEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.key.startsWith("Arrow")) {
      this.processArrows(ev);
    } else if (ev.key === "Enter") {
      if (this.subMenu.menuIndex === undefined) return;
      const menu = this.clickableMenuItems[this.subMenu.menuIndex];
      if (this.isEnabled(menu)) {
        if (this.isRoot(menu)) {
          this.openSubMenuViaKeyboard();
        } else {
          this.activateMenu(menu);
        }
      }
    } else if (ev.key === "Escape") {
      this.close();
    }
  }

  processArrows(ev: KeyboardEvent) {
    switch (ev.key) {
      case "ArrowDown": {
        this.selectNextMenuItem();
        break;
      }
      case "ArrowUp": {
        this.selectPreviousMenuItem();
        break;
      }
      case "ArrowRight": {
        this.openSubMenuViaKeyboard();
        break;
      }
      case "ArrowLeft": {
        if (!this.subMenu.isOpen || this.clickableMenuItems.length === 0) {
          this.props.backToParent?.("left", false);
          return;
        }
        this.closeSubMenu();
        break;
      }
    }
  }

  forSubMenuToComeBack(direction: string, propagation: boolean) {
    this.closeSubMenu();
    if (propagation) {
      this.props.backToParent?.(direction);
    }
  }

  private selectNextMenuItem() {
    if (this.clickableMenuItems.length === 0) return;
    if (this.subMenu.menuIndex === undefined) {
      this.subMenu.menuIndex = 0;
    } else if (this.subMenu.menuIndex === this.clickableMenuItems.length - 1) {
      this.subMenu.menuIndex = 0;
    } else {
      this.subMenu.menuIndex++;
    }
    const nextMenuItem = this.clickableMenuItems[this.subMenu.menuIndex];
    const el = this.menuItemRefs[nextMenuItem.id]?.ref.el;
    el?.scrollIntoView(false);
  }

  private selectPreviousMenuItem() {
    if (this.clickableMenuItems.length === 0) return;
    if (this.subMenu.menuIndex === undefined) {
      this.subMenu.menuIndex = this.clickableMenuItems.length - 1;
    } else if (this.subMenu.menuIndex === 0) {
      this.subMenu.menuIndex = this.clickableMenuItems.length - 1;
    } else {
      this.subMenu.menuIndex--;
    }
    const previousMenuItem = this.clickableMenuItems[this.subMenu.menuIndex];
    const el = this.menuItemRefs[previousMenuItem.id]?.ref.el;
    el?.scrollIntoView(false);
  }
}

Menu.props = {
  position: Object,
  menuItems: Array,
  depth: { type: Number, optional: true },
  maxHeight: { type: Number, optional: true },
  onClose: Function,
  onMenuClicked: { type: Function, optional: true },
  menuId: { type: String, optional: true },
  backToParent: { type: Function, optional: true },
  shouldSelectFirstItem: { type: Boolean, optional: true },
};
