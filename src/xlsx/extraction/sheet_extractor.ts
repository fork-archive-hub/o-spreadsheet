import { _lt } from "../../translation";
import {
  XLSXCell,
  XLSXColumn,
  XLSXConditionalFormat,
  XLSXFigure,
  XLSXFileStructure,
  XLSXFormula,
  XLSXHyperLink,
  XLSXImportFile,
  XLSXRow,
  XLSXSheetFormat,
  XLSXTable,
  XLSXTheme,
  XLSXWorksheet,
} from "../../types/xlsx";
import { EXCEL_DEFAULT_COL_WIDTH, EXCEL_DEFAULT_ROW_HEIGHT } from "../constants";
import { CELL_TYPE_CONVERSION_MAP } from "../conversion";
import { getRelativePath } from "../helpers/misc";
import { XLSXImportWarningManager } from "../helpers/xlsx_parser_error_manager";
import { XlsxBaseExtractor } from "./base_extractor";
import { XlsxCfExtractor } from "./cf_extractor";
import { XlsxFigureExtractor } from "./figure_extractor";
import { XlsxPivotExtractor } from "./pivot_extractor";
import { XlsxTableExtractor } from "./table_extractor";

export class XlsxSheetExtractor extends XlsxBaseExtractor {
  theme?: XLSXTheme;

  constructor(
    sheetFile: XLSXImportFile,
    xlsxStructure: XLSXFileStructure,
    warningManager: XLSXImportWarningManager,
    theme: XLSXTheme | undefined
  ) {
    super(sheetFile, xlsxStructure, warningManager);
    this.theme = theme;
  }

  getSheet(): XLSXWorksheet {
    return this.mapOnElements(
      { query: "worksheet", document: this.rootFile.file },
      (sheetElement): XLSXWorksheet => {
        return {
          sheetName: this.extractSheetName(),
          sheetFormat: this.extractSheetFormat(sheetElement),
          cols: this.extractCols(sheetElement),
          rows: this.extractRows(sheetElement),
          sharedFormulas: this.extractSharedFormulas(sheetElement),
          merges: this.extractMerges(sheetElement),
          cfs: this.extractConditionalFormats(),
          figures: this.extractFigures(sheetElement),
          hyperlinks: this.extractHyperLinks(sheetElement),
          tables: [...this.extractTables(sheetElement), ...this.extractPivotTables()],
        };
      }
    )[0];
  }

  private extractSheetName(): string {
    const relativePath = getRelativePath(
      this.xlsxFileStructure.workbook.file.fileName,
      this.rootFile.file.fileName
    );
    const workbookRels = this.extractRelationships(this.xlsxFileStructure.workbook.rels!);
    const relId = workbookRels.find((rel) => rel.target === relativePath)!.id;

    // Having a namspace in the attributes names mess with the querySelector, and the behaviour is not the same
    // for every XML parser. So we'll search manually instead of using a querySelector to search for an attribute value.
    for (let sheetElement of this.querySelectorAll(
      this.xlsxFileStructure.workbook.file.xml,
      "sheet"
    )) {
      if (sheetElement.attributes["r:id"].value === relId) {
        return sheetElement.attributes["name"].value;
      }
    }
    throw new Error(_lt("Missing sheet name"));
  }

  private extractConditionalFormats(): XLSXConditionalFormat[] {
    return new XlsxCfExtractor(
      this.rootFile,
      this.xlsxFileStructure,
      this.warningManager,
      this.theme
    ).extractConditionalFormattings();
  }

  private extractFigures(worksheet: Element): XLSXFigure[] {
    const figures = this.mapOnElements(
      { parent: worksheet, query: "drawing" },
      (drawingElement): XLSXFigure[] => {
        const drawingId = this.extractAttr(drawingElement, "r:id", { required: true }).asString()!;
        const drawingFile = this.getTargetXmlFile(this.relationships[drawingId])!;

        const figures = new XlsxFigureExtractor(
          drawingFile,
          this.xlsxFileStructure,
          this.warningManager
        ).extractFigures();
        return figures;
      }
    )[0];

    return figures || [];
  }

  private extractTables(worksheet: Element): XLSXTable[] {
    return this.mapOnElements(
      { query: "tablePart", parent: worksheet },
      (tablePartElement): XLSXTable => {
        const tableId = this.extractAttr(tablePartElement, "r:id", { required: true }).asString()!;
        const tableFile = this.getTargetXmlFile(this.relationships[tableId])!;

        const tableExtractor = new XlsxTableExtractor(
          tableFile,
          this.xlsxFileStructure,
          this.warningManager
        );
        return tableExtractor.getTable();
      }
    );
  }

  private extractPivotTables(): XLSXTable[] {
    try {
      return Object.values(this.relationships)
        .filter((relationship) => relationship.type.endsWith("pivotTable"))
        .map((pivotRelationship) => {
          const pivotFile = this.getTargetXmlFile(pivotRelationship)!;
          const pivot = new XlsxPivotExtractor(
            pivotFile,
            this.xlsxFileStructure,
            this.warningManager
          ).getPivotTable();
          return pivot;
        });
    } catch (e) {
      this.catchErrorOnElement(e);
      return [];
    }
  }

  private extractMerges(worksheet: Element): string[] {
    return this.mapOnElements({ parent: worksheet, query: "mergeCell" }, (mergeElement): string => {
      return this.extractAttr(mergeElement, "ref", { required: true }).asString()!;
    });
  }

  private extractSheetFormat(worksheet: Element): XLSXSheetFormat | undefined {
    const formatElement = this.querySelector(worksheet, "sheetFormatPr");
    if (!formatElement) return undefined;

    return {
      defaultColWidth: this.extractAttr(formatElement, "defaultColWidth", {
        default: EXCEL_DEFAULT_COL_WIDTH.toString(),
      }).asNum()!,
      defaultRowHeight: this.extractAttr(formatElement, "defaultRowHeight", {
        default: EXCEL_DEFAULT_ROW_HEIGHT.toString(),
      }).asNum()!,
    };
  }

  private extractCols(worksheet: Element): XLSXColumn[] {
    return this.mapOnElements(
      { parent: worksheet, query: "cols col" },
      (colElement): XLSXColumn => {
        return {
          width: this.extractAttr(colElement, "width").asNum(),
          customWidth: this.extractAttr(colElement, "customWidth").asBool(),
          bestFit: this.extractAttr(colElement, "bestFit").asBool(),
          hidden: this.extractAttr(colElement, "hidden").asBool(),
          min: this.extractAttr(colElement, "min", { required: true }).asNum()!,
          max: this.extractAttr(colElement, "max", { required: true }).asNum()!,
        };
      }
    );
  }

  private extractRows(worksheet: Element): XLSXRow[] {
    return this.mapOnElements(
      { parent: worksheet, query: "sheetData row" },
      (rowElement): XLSXRow => {
        return {
          index: this.extractAttr(rowElement, "r", { required: true }).asNum()!,
          cells: this.extractCells(rowElement),
          height: this.extractAttr(rowElement, "ht").asNum(),
          customHeight: this.extractAttr(rowElement, "customHeight").asBool(),
          hidden: this.extractAttr(rowElement, "hidden").asBool(),
        };
      }
    );
  }

  private extractCells(row: Element): XLSXCell[] {
    return this.mapOnElements({ parent: row, query: "c" }, (cellElement): XLSXCell => {
      return {
        xc: this.extractAttr(cellElement, "r", { required: true }).asString()!,
        styleIndex: this.extractAttr(cellElement, "s").asNum(),
        type: CELL_TYPE_CONVERSION_MAP[
          this.extractAttr(cellElement, "t", { default: "n" }).asString()!
        ],
        value: this.extractChildTextContent(cellElement, "v"),
        formula: this.extractCellFormula(cellElement),
      };
    });
  }

  private extractCellFormula(cellElement: Element): XLSXFormula | undefined {
    const formulaElement = this.querySelector(cellElement, "f");
    if (!formulaElement) return undefined;
    return {
      content: this.extractTextContent(formulaElement),
      sharedIndex: this.extractAttr(formulaElement, "si").asNum(),
      ref: this.extractAttr(formulaElement, "ref").asString(),
    };
  }

  private extractHyperLinks(worksheet: Element): XLSXHyperLink[] {
    return this.mapOnElements(
      { parent: worksheet, query: "hyperlink" },
      (linkElement): XLSXHyperLink => {
        const relId = this.extractAttr(linkElement, "r:id").asString();
        return {
          xc: this.extractAttr(linkElement, "ref", { required: true }).asString()!,
          location: this.extractAttr(linkElement, "location").asString(),
          display: this.extractAttr(linkElement, "display").asString(),
          relTarget: relId ? this.relationships[relId].target : undefined,
        };
      }
    );
  }

  private extractSharedFormulas(worksheet: Element): string[] {
    const sfElements = this.querySelectorAll(worksheet, `f[si][ref]`);
    const sfMap: Record<number, string> = {};
    for (let sfElement of sfElements) {
      const index = this.extractAttr(sfElement, "si", { required: true }).asNum()!;
      const formula = this.extractTextContent(sfElement, { required: true })!;
      sfMap[index] = formula;
    }

    const sfs: string[] = [];
    for (let i = 0; i < Object.keys(sfMap).length; i++) {
      if (!sfMap[i]) {
        this.warningManager.addParsingWarning(
          `Missing shared formula ${i}, replacing it by empty formula`
        );
        sfs.push("");
      } else {
        sfs.push(sfMap[i]);
      }
    }
    return sfs;
  }
}
