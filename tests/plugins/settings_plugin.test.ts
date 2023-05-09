import { Model } from "../../src";
import { Locale } from "../../src/types";
import { setCellContent, setFormat, updateLocale } from "../test_helpers/commands_helpers";
import { getCellContent } from "../test_helpers/getters_helpers";
import { target } from "../test_helpers/helpers";

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

    test("locale thousand separator", () => {
      setCellContent(model, "A1", "1000000");
      setFormat(model, "#,##0", target("A1"));
      expect(getCellContent(model, "A1")).toEqual("1,000,000");

      const locale = { ...customLocale, thousandsSeparator: "¤" };
      updateLocale(model, locale);
      expect(getCellContent(model, "A1")).toEqual("1¤000¤000");
    });

    test("locale decimal separator", () => {
      setCellContent(model, "A1", "9.89");
      setFormat(model, "#,##0.00", target("A1"));
      expect(getCellContent(model, "A1")).toEqual("9.89");

      const locale = { ...customLocale, decimalSeparator: "♥" };
      updateLocale(model, locale);
      expect(getCellContent(model, "A1")).toEqual("9♥89");
    });
  });
});
