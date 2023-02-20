import { ExcelChartDefinition, FigureSize } from "../../types";
import { XLSXFigure, XLSXFigureAnchor } from "../../types/xlsx";
import { removeNamespaces } from "../helpers/xml_helpers";
import { ExcelImage } from "./../../types/image";
import { XlsxBaseExtractor } from "./base_extractor";
import { XlsxChartExtractor } from "./chart_extractor";

const ONE_CELL_ANCHOR = "oneCellAnchor";
const TWO_CELL_ANCHOR = "twoCellAnchor";

export class XlsxFigureExtractor extends XlsxBaseExtractor {
  extractFigures(): XLSXFigure[] {
    return this.mapOnElements(
      { parent: this.rootFile.file.xml, query: "xdr:wsDr", children: true },
      (figureElement): XLSXFigure => {
        const anchorType = removeNamespaces(figureElement.tagName);
        const anchors = this.extractFigureAnchorsByType(figureElement, anchorType);
        if (!anchors) {
          throw new Error(`${anchorType} is currently not supported for xlsx drawings. `);
        }

        const chartElement = this.querySelector(figureElement, "c:chart");
        const imageElement = this.querySelector(figureElement, "a:blip");
        if (!chartElement && !imageElement) {
          throw new Error("Only chart and image figures are currently supported.");
        }

        return {
          anchors,
          data: chartElement ? this.extractChart(chartElement) : this.extractImage(imageElement!),
          figureSize:
            anchorType === ONE_CELL_ANCHOR
              ? this.extractFigureSizeFromSizeTag(figureElement)
              : undefined,
        };
      }
    );
  }

  private extractFigureAnchorsByType(
    figureElement: Element,
    anchorType: string
  ): XLSXFigureAnchor[] | undefined {
    switch (anchorType) {
      case ONE_CELL_ANCHOR:
        return [this.extractFigureAnchor("xdr:from", figureElement)];
      case TWO_CELL_ANCHOR:
        return [
          this.extractFigureAnchor("xdr:from", figureElement),
          this.extractFigureAnchor("xdr:to", figureElement),
        ];
      default:
        return undefined;
    }
  }

  private extractFigureSizeFromSizeTag(figureElement: Element): FigureSize {
    const sizeElement = this.querySelector(figureElement, "xdr:ext");
    if (!sizeElement) {
      throw new Error("Missing size element 'xdr:ext'");
    }
    const width = this.extractAttr(sizeElement, "cx", { required: true })!.asNum();
    const height = this.extractAttr(sizeElement, "cy", { required: true })!.asNum();
    return { width, height };
  }

  private extractFigureAnchor(anchorTag: string, figureElement: Element): XLSXFigureAnchor {
    const anchor = this.querySelector(figureElement, anchorTag);
    if (!anchor) {
      throw new Error(`Missing anchor element ${anchorTag}`);
    }

    return {
      col: Number(this.extractChildTextContent(anchor, "xdr:col", { required: true })!),
      colOffset: Number(this.extractChildTextContent(anchor, "xdr:colOff", { required: true })!),
      row: Number(this.extractChildTextContent(anchor, "xdr:row", { required: true })!),
      rowOffset: Number(this.extractChildTextContent(anchor, "xdr:rowOff", { required: true })!),
    };
  }

  private extractChart(chartElement: Element): ExcelChartDefinition {
    const chartId = this.extractAttr(chartElement, "r:id", { required: true }).asString();
    const chartFile = this.getTargetXmlFile(this.relationships[chartId])!;

    const chartDefinition = new XlsxChartExtractor(
      chartFile,
      this.xlsxFileStructure,
      this.warningManager
    ).extractChart();

    if (!chartDefinition) {
      throw new Error("Unable to extract chart definition");
    }
    return chartDefinition;
  }

  private extractImage(imageElement: Element): ExcelImage {
    const imageId = this.extractAttr(imageElement, "r:embed", { required: true }).asString();
    const image = this.getTargetImageFile(this.relationships[imageId])!;
    if (!image) {
      throw new Error("Unable to extract image");
    }
    return { ...image };
  }
}
