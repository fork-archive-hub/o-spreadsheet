import { Component, onMounted, onWillUnmount, xml } from "@odoo/owl";
import { Model } from "../../src";
import { DEFAULT_LOCALE, DEFAULT_LOCALES, SpreadsheetChildEnv } from "../../src/types";
import { customLocale } from "../plugins/settings_plugin.test";
import { updateLocale } from "../test_helpers/commands_helpers";
import { setInputValueAndTrigger } from "../test_helpers/dom_helper";
import { mountComponent, nextTick } from "../test_helpers/helpers";
import { SettingsPanel } from "./../../src/components/side_panel/settings/settings_panel";

const frLocale = DEFAULT_LOCALES.find((l) => l.code === "fr-FR")!;

interface ParentProps {
  onCloseSidePanel: () => void;
}
class Parent extends Component<ParentProps, SpreadsheetChildEnv> {
  static components = { SettingsPanel };
  static template = xml/*xml*/ `
    <SettingsPanel onCloseSidePanel="props.onCloseSidePanel"/>
  `;
  setup() {
    onMounted(() => this.env.model.on("update", this, () => this.render(true)));
    onWillUnmount(() => this.env.model.off("update", this));
  }
}

describe("settings sidePanel component", () => {
  let model: Model;
  let fixture: HTMLElement;
  let onCloseSidePanel: jest.Mock;

  async function mountSettingsSidePanel(modelArg?: Model) {
    model = modelArg ?? new Model();
    ({ fixture } = await mountComponent(Parent, {
      model,
      props: { onCloseSidePanel: () => onCloseSidePanel() },
    }));
    await nextTick();
  }

  describe("Locale", () => {
    test("Locale select is initialized with correct value", async () => {
      model = new Model({ settings: { locale: frLocale } });
      await mountSettingsSidePanel(model);
      const localeInput = fixture.querySelector<HTMLInputElement>(".o-settings-panel select")!;
      expect(localeInput.value).toEqual(frLocale.code);
    });

    test("Can change locale", async () => {
      await mountSettingsSidePanel();
      setInputValueAndTrigger(".o-settings-panel select", "fr-FR", "change");
      expect(model.getters.getLocale().code).toEqual("fr-FR");
    });

    test("Side panel is updated when model is updated", async () => {
      await mountSettingsSidePanel();
      const localeInput = fixture.querySelector<HTMLInputElement>(".o-settings-panel select")!;
      expect(localeInput.value).toEqual(DEFAULT_LOCALE.code);
      updateLocale(model, frLocale);
      await nextTick();

      expect(localeInput.value).toEqual(frLocale.code);
    });

    test("Current locale in loaded model that is not in env.getLocales() is displayed", async () => {
      model = new Model({ settings: { locale: customLocale } });
      await mountSettingsSidePanel(model);
      const options = fixture.querySelectorAll<HTMLOptionElement>(
        ".o-settings-panel select option"
      );
      const optionValues = Array.from(options).map((option) => option.value);

      for (const defaultLocale of DEFAULT_LOCALES) {
        expect(optionValues).toContain(defaultLocale.code);
      }
      expect(optionValues).toContain(customLocale.code);
    });

    test("Updating model locale with a locale not in env.getLocales() displays the locale in the panel", async () => {
      model = new Model();
      await mountSettingsSidePanel(model);
      updateLocale(model, customLocale);
      await nextTick();

      const localeInput = fixture.querySelector<HTMLInputElement>(".o-settings-panel select")!;
      expect(localeInput.value).toBe(customLocale.code);
    });
  });
});
