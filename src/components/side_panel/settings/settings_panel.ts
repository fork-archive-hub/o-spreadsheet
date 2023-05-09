import { Component, onWillStart, onWillUpdateProps, useState } from "@odoo/owl";
import { deepEquals, formatValue } from "../../../helpers";
import { Locale, LocaleCode, SpreadsheetChildEnv } from "../../../types";
import { css } from "../../helpers";

interface Props {
  onCloseSidePanel: () => void;
}

css/* scss */ `
  .o-locale-preview {
    color: dimgrey;
  }
`;

export class SettingsPanel extends Component<Props, SpreadsheetChildEnv> {
  static template = "o-spreadsheet-SettingsPanel";

  state = useState({ ...this.initState() });

  numberFormat = "";
  dateFormat = "";
  dateTimeFormat = "";

  setup() {
    onWillStart(() => this.loadLocales());
    onWillUpdateProps(() => {
      const currentLocale = this.env.model.getters.getLocale();
      this.state.locale = currentLocale;
      this.addLocaleInSupportedLocales(currentLocale);
      this.updatePreviews();
    });
    this.updatePreviews();
  }

  onLocaleChange(code: LocaleCode) {
    const locale = this.state.supportedLocales.find((l) => l.code === code);
    if (!locale) return;
    this.env.model.dispatch("UPDATE_LOCALE", { locale });
  }

  private async loadLocales() {
    this.state.supportedLocales = await this.env.loadLocales();
    this.addLocaleInSupportedLocales(this.env.model.getters.getLocale());
  }

  private addLocaleInSupportedLocales(locale: Locale) {
    const localeInSupported = this.state.supportedLocales.find((l) => l.code === locale.code);

    if (!localeInSupported) {
      this.state.supportedLocales.push(locale);
    } else if (!deepEquals(locale, localeInSupported)) {
      const index = this.state.supportedLocales.indexOf(localeInSupported);
      this.state.supportedLocales[index] = locale;
    }
  }

  private updatePreviews() {
    const locale = this.env.model.getters.getLocale();

    const dateTimeFormat = locale.dateFormat + " " + locale.timeFormat;
    this.dateFormat = formatValue(1.6, { format: locale.dateFormat, locale });
    this.dateTimeFormat = formatValue(1.6, { format: dateTimeFormat, locale });

    this.numberFormat = formatValue(1234567.89, { format: "#,##0.00", locale });
  }

  private initState() {
    const currentLocale = this.env.model.getters.getLocale();
    return {
      locale: currentLocale,
      supportedLocales: [currentLocale],
    };
  }
}

SettingsPanel.props = {
  onCloseSidePanel: Function,
};
