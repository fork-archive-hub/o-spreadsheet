import { DEFAULT_REVISION_ID } from "../constants";
import { _lt } from "../translation";
import {
  ImportedFiles,
  XLSXFileStructure,
  XLSXImportData,
  XLSXWorksheet,
  XLSXXmlDocuments,
  XMLString,
} from "../types/xlsx";
import { WorkbookData } from "./../types/workbook_data";
import { CONTENT_TYPES } from "./constants";
import {
  cleanImportedBorders,
  cleanImportedStyles,
  convertBorders,
  convertFormats,
  convertSheets,
  convertStyles,
  convertTables,
} from "./conversion";
import { XlsxMiscExtractor, XlsxSheetExtractor, XlsxStyleExtractor } from "./extraction";
import { getXLSXFilesOfType } from "./helpers/xlsx_helper";
import { XLSXImportWarningManager } from "./helpers/xlsx_parser_error_manager";
import { parseXML } from "./helpers/xml_helpers";

const EXCEL_IMPORT_VERSION = 10;

// TODO check indexes for styles, shared strings, shared formulas, dxfs ?
export class XlsxReader {
  warningManager: XLSXImportWarningManager;
  xmls: XLSXXmlDocuments;

  constructor(files: ImportedFiles) {
    this.warningManager = new XLSXImportWarningManager();

    this.xmls = {};
    for (let key of Object.keys(files)) {
      // Randoms files can be in xlsx (like a bin file for printer settings)
      if (key.endsWith(".xml") || key.endsWith(".rels")) {
        this.xmls[key] = parseXML(new XMLString(files[key]));
      }
    }
  }

  convertXlsx(): WorkbookData {
    const xlsxData = this.getXlsxData();
    const convertedData = this.convertImportedData(xlsxData);
    return convertedData;
  }

  // ---------------------------------------------------------------------------
  // Parsing XMLs
  // ---------------------------------------------------------------------------

  private getXlsxData(): XLSXImportData {
    const xlsxFileStructure = this.buildXlsxFileStructure();

    const theme = xlsxFileStructure.theme
      ? new XlsxMiscExtractor(
          xlsxFileStructure.theme,
          xlsxFileStructure,
          this.warningManager
        ).getTheme()
      : undefined;

    const sharedStrings = new XlsxMiscExtractor(
      xlsxFileStructure.sharedStrings,
      xlsxFileStructure,
      this.warningManager
    ).getSharedStrings();

    const sheets = xlsxFileStructure.sheets.map((sheetFile): XLSXWorksheet => {
      return new XlsxSheetExtractor(
        sheetFile,
        xlsxFileStructure,
        this.warningManager,
        theme
      ).getSheet();
    });

    const styleExtractor = new XlsxStyleExtractor(xlsxFileStructure, this.warningManager, theme);

    return {
      fonts: styleExtractor.getFonts(),
      fills: styleExtractor.getFills(),
      borders: styleExtractor.getBorders(),
      dxfs: styleExtractor.getDxfs(),
      numFmts: styleExtractor.getNumFormats(),
      styles: styleExtractor.getStyles(),
      sheets: sheets,
      sharedStrings,
    };
  }

  private buildXlsxFileStructure(): XLSXFileStructure {
    const xlsxFileStructure = {
      sheets: getXLSXFilesOfType(CONTENT_TYPES.sheet, this.xmls),
      workbook: getXLSXFilesOfType(CONTENT_TYPES.workbook, this.xmls)[0],
      styles: getXLSXFilesOfType(CONTENT_TYPES.styles, this.xmls)[0],
      sharedStrings: getXLSXFilesOfType(CONTENT_TYPES.sharedStrings, this.xmls)[0],
      theme: getXLSXFilesOfType(CONTENT_TYPES.themes, this.xmls)[0],
      charts: getXLSXFilesOfType(CONTENT_TYPES.chart, this.xmls),
      figures: getXLSXFilesOfType(CONTENT_TYPES.drawing, this.xmls),
      tables: getXLSXFilesOfType(CONTENT_TYPES.table, this.xmls),
      pivots: getXLSXFilesOfType(CONTENT_TYPES.pivot, this.xmls),
    };

    if (!xlsxFileStructure.workbook.rels) {
      throw Error(_lt("Cannot find workbook relations file"));
    }

    return xlsxFileStructure;
  }

  // ---------------------------------------------------------------------------
  // Conversion
  // ---------------------------------------------------------------------------

  convertImportedData(data: XLSXImportData): WorkbookData {
    const convertedData = {
      version: EXCEL_IMPORT_VERSION,
      sheets: convertSheets(data, this.warningManager),
      styles: convertStyles(data, this.warningManager),
      formats: convertFormats(data),
      borders: convertBorders(data, this.warningManager),
      entities: {},
      revisionId: DEFAULT_REVISION_ID,
    } as WorkbookData;

    convertTables(convertedData, data);

    this.cleanImportedData(convertedData);

    return convertedData;
  }

  /**
   * Clean the imported data. This will :
   *  - remove duplicate styles + remove undefined values in Style objects
   *  - remove duplicate borders + remove undefined values in border objects
   */
  cleanImportedData(data: WorkbookData) {
    cleanImportedStyles(data);
    cleanImportedBorders(data);
  }
}
