import { isDefined } from "../../helpers";
import { ChartDefinition, ExcelChartDefinition, FigureData } from "../../types";
import { XLSXFigure, XLSXWorksheet } from "../../types/xlsx";
import { convertEMUToDotValue, getColPosition, getRowPosition } from "../helpers/content_helpers";
import { ExcelImage } from "./../../types/image";
import { convertColor } from "./color_conversion";

export function convertFigures(sheetData: XLSXWorksheet): FigureData<any>[] {
  let id = 1;
  return sheetData.figures
    .map((figure) => convertFigure(figure, (id++).toString(), sheetData))
    .filter(isDefined);
}

function convertFigure(
  figure: XLSXFigure,
  id: string,
  sheetData: XLSXWorksheet
): FigureData<any> | undefined {
  const x1 =
    getColPosition(figure.anchors[0].col, sheetData) +
    convertEMUToDotValue(figure.anchors[0].colOffset);
  const x2 =
    getColPosition(figure.anchors[1].col, sheetData) +
    convertEMUToDotValue(figure.anchors[1].colOffset);

  const y1 =
    getRowPosition(figure.anchors[0].row, sheetData) +
    convertEMUToDotValue(figure.anchors[0].rowOffset);
  const y2 =
    getRowPosition(figure.anchors[1].row, sheetData) +
    convertEMUToDotValue(figure.anchors[1].rowOffset);

  const width = x2 - x1;
  const height = y2 - y1;

  if (isChartData(figure.data)) {
    return {
      id,
      x: x1,
      y: y1,
      width,
      height,
      tag: "chart",
      data: convertChartData(figure.data),
    };
  } else if (isImageData(figure.data)) {
    const imageData = figure.data;
    if (!imageData.path) return undefined;
    const imageHeight = width / imageData.aspectRatio;
    return {
      id,
      x: x1,
      y: y1,
      width,
      height: imageHeight,
      tag: "image",
      data: {
        path: imageData.path,
      },
    };
  }
  return undefined;
}

function isChartData(data: ExcelChartDefinition | ExcelImage): data is ExcelChartDefinition {
  return "dataSets" in data;
}

function isImageData(data: ExcelChartDefinition | ExcelImage): data is ExcelImage {
  return "path" in data;
}

function convertChartData(chartData: ExcelChartDefinition): ChartDefinition {
  const labelRange = chartData.dataSets[0].label?.replace(/\$/g, "");
  let dataSets = chartData.dataSets.map((data) => data.range.replace(/\$/g, ""));
  // For doughnut charts, in chartJS first dataset = outer dataset, in excel first dataset = inner dataset
  if (chartData.type === "pie") {
    dataSets.reverse();
  }
  return {
    dataSets,
    dataSetsHaveTitle: false,
    labelRange,
    title: chartData.title || "",
    type: chartData.type,
    background: convertColor({ rgb: chartData.backgroundColor }) || "#FFFFFF",
    verticalAxisPosition: chartData.verticalAxisPosition,
    legendPosition: chartData.legendPosition,
    stacked: chartData.stacked || false,
    aggregated: false,
    labelsAsText: false,
  };
}
