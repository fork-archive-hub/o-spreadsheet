import { Border, ExcelChartDefinition } from ".";
import { Align } from "./misc";

/**
 * Most of the times we tried to create Objects that matched quite closely with the data in the XLSX files.
 * The most notable exceptions are graphs and charts, as their definition are complex and we won't use most of it.
 *
 * Used the specification of the OpenXML file formats
 * https://www.ecma-international.org/publications-and-standards/standards/ecma-376/
 *
 * Or XLSX extension of OpenXml
 * https://docs.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/2c5dee00-eff2-4b22-92b6-0738acd4475e
 *
 *
 * Quick reference :
 * [OpenXml] :
 *  - border (XLSXBorder): §18.8.4 (border)
 *  - cells (XLSXCell): §18.3.1.4 (c)
 *  - color (XLSXColor): §18.3.1.15 (color)
 *  - columns (XLSXSColumn): §18.3.1.13 (col)
 *  - conditional format (XLSXConditionalFormat): §18.3.1.18 (conditionalFormatting)
 *  - chart (ExcelChartDefinition): §21.2.2.27 (chart)
 *  - cf rule (XLSXCFRule): §18.3.1.10 (cfRule)
 *  - cf rule icon set (XLSXIconSet) : §18.3.1.49 (iconSet)
 *  - fills (XLSXFill): §18.8.20 (fill)
 *  - figure (XLSXFigure): §20.5.2.35 (wsDr (Worksheet Drawing))
 *  - fonts (XLSXFont): §18.8.22 (font)
 *  - merge (string): §18.3.1.55 (mergeCell)
 *  - rows (XLSXSRow): §18.3.1.73 (row)
 *  - sheet (XLSXWorksheet): §18.3.1.99 (worksheet)
 *  - sheet format (XLSXSheetFormat): §18.3.1.81 (sheetFormatPr)
 *  - style, for cell (XLSXStyle): §18.8.45 (xf)
 *  - style, for non-cell (eg. conditional format) (XLSXDxf): §18.8.14 (dxf)
 *  - table (XLSXTable) : §18.5.1.2 (table)
 *  - table column (XLSXTableCol) : §18.5.1.3 (tableColumn)
 *  - table style (XLSXTableStyleInfo) : §18.5.1.5 (tableStyleInfo)
 *  - theme color : §20.1.2.3.32 (srgbClr/sysClr)
 *
 * [XLSX]: :
 * - cf rule (XLSXCFRule): §2.6.2 (CT_ConditionalFormatting)
 * - cf rule icon set (XLSXIconSet): §2.6.28 (CT_IconSet)
 * - cf icon (XLSXCFIcon): §2.6.36 (CT_CfIcon)
 *
 * Simple Types :
 * [OpenXml] :
 *  - border style (XLSXBorderStyle):  §18.18.3 (Border Line Styles)
 *  - cell type (XLSXCellType):  §18.18.11 (Cell Type) (mapped with xlsxCellTypeMap to be human readable)
 *  - cf type (XLSXCFType):  §18.18.12 (Conditional Format Type)
 *  - cf value object type (XLSXCFValueObjectType):  §18.18.13 (Conditional Format Value Object Type)
 *  - cf operator type (XLSXCFOperatorType):  §18.18.15 (Conditional Format Operators)
 *  - fill pattern types (XLSXFillPatternType):  §18.18.55 (Pattern Type)
 *  - horizontal alignment (XLSXHorizontalAlignment):  §18.18.40 (Horizontal Alignment Type)
 *  - vertical alignment (XLSXVerticalAlignment):  §18.18.88 (Horizontal Alignment Type)
 *
 * [XLSX] :
 *  - icon set types (ExcelIconSet):  §2.7.10 (ST_IconSetType)
 */

/**
 * This structure covers all the necessary "assets" to generate an XLSX file.
 * Those assets consist of:
 *  - a rel file including metadata specifying how the others files form the final document
 *    (this currently includes sheets, styles, shared content (string))
 *  - a sharedStrings file that regroups all static string values found in the cells
 *  - a style file including all the normalized style elements for cells,
 *    including cell-specific conditional formatting
 *
 * @param rels: a list of files and their specific type/role in the final document
 * @param sharedStrings: regroups all static string values found in the cells.
 * @param fonts: All normalized fonts
 * @param fills: " normalized fills
 * @param borders: " normalized borders
 * @param NumFmts: " normalized number formats
 * @param styles: " combinations of font-fill-border, number format found in the cells
 * @param dxf: " Conditional Formatting of type "CellIsRule"
 */
export interface XLSXStructure {
  relsFiles: XLSXRelFile[];
  sharedStrings: string[];
  fonts: XLSXFont[];
  fills: XLSXFill[];
  borders: Border[];
  numFmts: string[];
  styles: XLSXStyle[];
  dxfs: XLSXDxf[];
}

export interface XLSXFileStructure {
  sheets: XLSXImportFile[];
  workbook: XLSXImportFile;
  styles: XLSXImportFile;
  sharedStrings: XLSXImportFile;
  theme?: XLSXImportFile;
  charts: XLSXImportFile[];
  figures: XLSXImportFile[];
  tables: XLSXImportFile[];
  pivots: XLSXImportFile[];
}

export interface XLSXImportData {
  sharedStrings: string[];
  fonts: XLSXFont[];
  fills: XLSXFill[];
  borders: XLSXBorder[];
  dxfs: XLSXDxf[];
  numFmts: string[];
  styles: XLSXStyle[];
  sheets: XLSXWorksheet[];
}

export type XMLAttributeValue = string | number | boolean;
type XMLAttribute = [string, XMLAttributeValue];
export type XMLAttributes = XMLAttribute[];

/**
 * Represent a raw XML string
 */
export class XMLString {
  /**
   * @param xmlString should be a well formed, properly escaped XML string
   */
  constructor(private xmlString: string) {}

  toString(): string {
    return this.xmlString;
  }
}

export interface XLSXDxf {
  font?: Partial<XLSXFont>; // TODO : check if partial really needed for export
  fill?: XLSXFill;
  numFmt?: string;
  alignment?: XLSXCellAlignement;
  border?: XLSXBorder;
}

export interface XLSXRel {
  id: string;
  type: string;
  target: string;
  targetMode?: "External";
}

export interface XLSXRelFile {
  path: string;
  rels: XLSXRel[];
}

export interface XLSXExportFile {
  path: string;
  content: string;
  contentType?: string;
}

export interface XLSXExport {
  name: string;
  files: XLSXExportFile[];
}

export interface XLSXFont {
  size?: number;
  family?: number;
  color?: XLSXColor;
  name?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}
export interface XLSXCellAlignement {
  horizontal?: XLSXHorizontalAlignment;
  vertical?: XLSXVerticalAlignment;
  textRotation?: number;
  wrapText?: boolean;
  indent?: number;
  relativeIndent?: number;
  justifyLastLine?: boolean;
  shrinkToFit?: boolean;
  readingOrder?: number;
}

export interface XLSXFill {
  patternType?: XLSXFillPatternType;
  reservedAttribute?: string; // will generate a specific specific attribute in XML. If set, fgColor is ignored.
  fgColor?: XLSXColor;
  bgColor?: XLSXColor;
}

export interface XLSXStyle {
  fontId: number;
  fillId: number;
  borderId: number;
  numFmtId: number;
  verticalAlignment?: string; //TODO replace this by alignment in export
  horizontalAlignment?: string; //TODO replace this by alignment in export
  alignment?: XLSXCellAlignement;
}

export interface ExtractedStyle {
  font: XLSXFont;
  fill: XLSXFill;
  border: Border;
  numFmt: string | undefined;
  verticalAlignment: Align;
  horizontalAlignment: Align;
}

export interface XLSXWorksheet {
  sheetName: string;
  sheetFormat?: XLSXSheetFormat;
  cols: XLSXColumn[];
  rows: XLSXRow[];
  cfs: XLSXConditionalFormat[];
  sharedFormulas: string[];
  merges: string[];
  figures: XLSXFigure[];
  hyperlinks: XLSXHyperLink[];
  tables: XLSXTable[];
}

export interface XLSXSheetFormat {
  defaultColWidth: number;
  defaultRowHeight: number;
}

export interface XLSXColumn {
  min: number;
  max: number;
  width?: number;
  customWidth?: boolean;
  bestFit?: boolean;
  hidden?: boolean;
}
export interface XLSXRow {
  index: number;
  height?: number;
  customHeight?: boolean;
  hidden?: boolean;
  cells: XLSXCell[];
}

export interface XLSXFormula {
  content?: string;
  sharedIndex?: number;
  ref?: string;
}

export interface XLSXCell {
  xc: string; // OpenXml specs defines it as optional, but not having it makes no sense
  styleIndex?: number;
  type: XLSXCellType;
  value?: string;
  formula?: XLSXFormula;
}
export interface XLSXTheme {
  clrScheme?: XLSXColorScheme[];
}

export interface XLSXColorScheme {
  name: string;
  value: string;
  lastClr?: string;
}

export interface XLSXBorder {
  top?: XLSXBorderDescr;
  left?: XLSXBorderDescr;
  bottom?: XLSXBorderDescr;
  right?: XLSXBorderDescr;
  diagonal?: XLSXBorderDescr;
  diagonalUp?: boolean;
  diagonalDown?: boolean;
}

export interface XLSXBorderDescr {
  style: XLSXBorderStyle;
  color: XLSXColor;
}

export type ExcelIconSet =
  | "NoIcons"
  | "3Arrows"
  | "3ArrowsGray"
  | "3Symbols"
  | "3Symbols2"
  | "3Signs"
  | "3Flags"
  | "3TrafficLights1"
  | "3TrafficLights2"
  | "4Arrows"
  | "4ArrowsGray"
  | "4RedToBlack"
  | "4Rating"
  | "4TrafficLights"
  | "5Arrows"
  | "5ArrowsGray"
  | "5Rating"
  | "5Quarters"
  | "3Stars"
  | "3Triangles"
  | "5Boxes";

export interface ImportedFiles {
  [path: string]: string;
}

export interface XLSXXmlDocuments {
  [path: string]: XMLDocument;
}

export type XLSXFillPatternType =
  | "none"
  | "solid"
  | "gray0625"
  | "gray125"
  | "lightGray"
  | "mediumGray"
  | "darkGray"
  | "darkHorizontal"
  | "darkVertical"
  | "darkUp"
  | "darkDown"
  | "darkGrid"
  | "darkTrellis"
  | "lightHorizontal"
  | "lightVertical"
  | "lightDown"
  | "lightUp"
  | "lightGrid"
  | "lightTrellis";

export type XLSXBorderStyle =
  | "dashDot"
  | "dashDotDot"
  | "dashed"
  | "dotted"
  | "double"
  | "hair"
  | "medium"
  | "mediumDashDot"
  | "mediumDashDotDot"
  | "mediumDashed"
  | "none"
  | "slantDashDot"
  | "thick"
  | "thin";

export type XLSXCellType =
  | "boolean"
  | "date"
  | "error"
  | "inlineStr"
  | "number"
  | "sharedString"
  | "str";

export type XLSXCFType =
  | "aboveAverage"
  | "expression"
  | "cellIs"
  | "colorScale"
  | "dataBar"
  | "iconSet"
  | "top10"
  | "uniqueValues"
  | "duplicateValues"
  | "containsText"
  | "notContainsText"
  | "beginsWith"
  | "endsWith"
  | "containsBlanks"
  | "notContainsBlanks"
  | "containsErrors"
  | "notContainsErrors"
  | "timePeriod";

export type XLSXCFOperatorType =
  | "beginsWith"
  | "between"
  | "containsText"
  | "endsWith"
  | "equal"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "notBetween"
  | "notContains"
  | "notEqual";

export type XLSXHorizontalAlignment =
  | "general"
  | "left"
  | "center"
  | "right"
  | "fill"
  | "justify"
  | "centerContinuous"
  | "distributed";

export type XLSXVerticalAlignment = "top" | "center" | "bottom" | "justify" | "distributed";

export type XLSXCFValueObjectType = "num" | "percent" | "max" | "min" | "percentile" | "formula";

export interface XLSXCFValueObject {
  type: XLSXCFValueObjectType;
  gte?: boolean;
  value?: string;
}
export interface XLSXColorScale {
  colors: XLSXColor[];
  cfvos: XLSXCFValueObject[];
}

export interface XLSXIconSet {
  iconSet: ExcelIconSet;
  cfvos: XLSXCFValueObject[];
  cfIcons?: XLSXCfIcon[]; // Icons can be defined individually instead of following iconSet
  showValue?: boolean;
  percent?: boolean;
  reverse?: boolean;
  custom?: boolean;
}

export interface XLSXCfIcon {
  iconSet: ExcelIconSet;
  iconId: number;
}
export interface XLSXConditionalFormat {
  cfRules: XLSXCFRule[];
  sqref: string[];
  pivot?: boolean;
}

export interface XLSXCFRule {
  type: XLSXCFType;
  priority: number;
  formula?: string[];
  colorScale?: XLSXColorScale;
  dataBar?: any;
  iconSet?: XLSXIconSet;
  dxfId?: number;
  stopIfTrue?: boolean;
  aboveAverage?: boolean;
  percent?: boolean;
  bottom?: boolean;
  operator?: XLSXCFOperatorType;
  text?: string;
  timePeriod?: any;
  rank?: number;
  stdDev?: number;
  equalAverage?: boolean;
}

export interface XLSXSharedFormula {
  formula: string;
  refCellXc: string;
}

export interface XLSXColor {
  auto?: boolean;
  indexed?: number;
  rgb?: string;
  tint?: number;
}

export type XLSXFigureAnchortype = "twoCellAnchor" | "oneCellAnchor" | "absoluteAnchor";

export interface XLSXFigureAnchor {
  col: number;
  colOffset: number; // in EMU (English Metrical Unit)
  row: number;
  rowOffset: number; // in EMU (English Metrical Unit)
}

export interface XLSXFigure {
  anchors: XLSXFigureAnchor[];
  data: ExcelChartDefinition;
}

export const XLSX_CHART_TYPES = [
  "areaChart",
  "area3DChart",
  "lineChart",
  "line3DChart",
  "stockChart",
  "radarChart",
  "scatterChart",
  "pieChart",
  "pie3DChart",
  "doughnutChart",
  "barChart",
  "bar3DChart",
  "ofPieChart",
  "surfaceChart",
  "surface3DChart",
  "bubbleChart",
] as const;
export type XLSXChartType = typeof XLSX_CHART_TYPES[number];

/** An XLSX File is a main XML file and optionally a corresponding rel file */
export interface XLSXImportFile {
  file: XMLFile;
  rels?: XMLFile;
}

export interface XMLFile {
  fileName: string;
  xml: XMLDocument;
}

export interface XLSXHyperLink {
  xc: string;
  location?: string;
  display?: string;
  relTarget?: string;
}

export interface XLSXTableStyleInfo {
  name?: string;
  showFirstColumn?: boolean;
  showLastColumn?: boolean;
  showRowStripes?: boolean;
  showColumnStripes?: boolean;
}

export interface XLSXTableCol {
  name: string;
  id: string;
  colFormula?: string;
}

export interface XLSXTable {
  displayName: string;
  name?: string;
  id: string;
  ref: string;
  headerRowCount: number;
  totalsRowCount: number;
  cols: XLSXTableCol[];
  style?: XLSXTableStyleInfo;
}
