import { CommandDispatcher } from "./commands";
import { Getters } from "./getters";
import { Env } from "@odoo/owl/dist/types/component/component";
import { TranslationFunction } from "../translation";

export interface SpreadsheetEnv extends Env {
  openSidePanel: (panel: string, panelProps?: any) => void;
  toggleSidePanel: (panel: string, panelProps?: any) => void;
  dispatch: CommandDispatcher["dispatch"];
  getters: Getters;
  clipboard: Clipboard;
  _t: TranslationFunction;
}
