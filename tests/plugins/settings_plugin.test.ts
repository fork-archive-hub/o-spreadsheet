import { Model } from "../../src";
import { Locale } from "../../src/types";
import { updateLocale } from "../test_helpers/commands_helpers";

export const customLocale: Locale = {
  name: "Custom locale",
  code: "cus-TOM",
  thousandsSeparator: " ",
  decimalSeparator: ",",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "hh:mm:ss",
};

describe("Settings plugin", () => {
  let model: Model;

  beforeEach(() => {
    model = new Model();
  });

  describe("Locale", () => {
    test("Can set the locale", () => {
      updateLocale(model, customLocale);
      expect(model.getters.getLocale()).toEqual(customLocale);
    });

    test("Can import/export locale", () => {
      updateLocale(model, customLocale);
      const exported = model.exportData();
      expect(exported.settings.locale).toEqual(customLocale);

      const newModel = new Model(exported);
      expect(newModel.getters.getLocale()).toEqual(customLocale);
    });
  });
});
