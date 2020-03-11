import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_WEIGHT,
  HEADER_HEIGHT,
  HEADER_WIDTH
} from "../constants";
import { fontSizeMap } from "../fonts";
// import { overlap, toXC } from "../helpers";
// import { Border, Cell, GridModel, GridState, Style, Zone } from "../model/index";
import { Box, GridState } from "../model/types";

let dpr = window.devicePixelRatio || 1;
let thinLineWidth = 0.4 * dpr;

export function drawGrid(context: CanvasRenderingContext2D, state: GridState) {
  // 1. initial setup, clear canvas, collect info
  dpr = window.devicePixelRatio || 1;
  thinLineWidth = 0.4 * dpr;
  context.fillStyle = "white"; // model.state.styles[0].fillColor || "white";
  context.fillRect(0, 0, state.width, state.height);
  const boxes = state.boxes;

  // 2. draw grid content
  drawBackgroundGrid(state, context);
  drawBackgrounds(boxes, context);
  drawBorders(boxes, context);
  drawTexts(boxes, context);

  // 3. draw additional chrome: selection, clipboard, headers, ...
  drawHighlights(state, context);
  drawClipBoard(state, context);
  drawSelection(state, context);
  drawHeader(state, context);
  drawActiveZone(state, context);
}

// function formatCell(state: GridRenderState, cell: Cell) {
//   let value = valuesCache[cell.xc];
//   if (value) {
//     return value;
//   }
//   value = model.formatCell(cell);
//   valuesCache[cell.xc] = value;
//   return value;
// }

// export function clearCache() {
//   valuesCache = {};
// }

// function hasContent(state: GridState, col: number, row: number): boolean {
//   const { cells, mergeCellMap } = state;
//   const xc = toXC(col, row);
//   const cell = cells[xc];
//   return (cell && cell.content) || ((xc in mergeCellMap) as any);
// }

// function getGridBoxes(model: GridModel, ctx: CanvasRenderingContext2D): Box[] {
//   const result: Box[] = [];
//   const state = model.state;
//   const { cols, rows, viewport, mergeCellMap, offsetX, offsetY, merges } = state;
//   const { cells } = state;
//   const { right, left, top, bottom } = viewport;
//   // process all visible cells
//   for (let rowNumber = top; rowNumber <= bottom; rowNumber++) {
//     let row = rows[rowNumber];
//     for (let colNumber = left; colNumber <= right; colNumber++) {
//       let cell = row.cells[colNumber];
//       if (cell && !(cell.xc in mergeCellMap)) {
//         let col = cols[colNumber];
//         const text = formatCell(model, cell);
//         const textWidth = getCellWidth(cell, model, ctx);
//         const style = cell.style ? state.styles[cell.style] : null;
//         const align = text
//           ? (style && style.align) || (cell.type === "text" ? "left" : "right")
//           : null;
//         let clipRect: Rect | null = null;
//         if (text && textWidth > cols[cell.col].size) {
//           if (align === "left") {
//             let c = cell.col;
//             while (c < right && !hasContent(state, c + 1, cell.row)) {
//               c++;
//             }
//             const width = cols[c].right - col.left;
//             if (width < textWidth) {
//               clipRect = [col.left - offsetX, row.top - offsetY, width, row.size];
//             }
//           } else {
//             let c = cell.col;
//             while (c > left && !hasContent(state, c - 1, cell.row)) {
//               c--;
//             }
//             const width = col.right - cols[c].left;
//             if (width < textWidth) {
//               clipRect = [cols[c].left - offsetX, row.top - offsetY, width, row.size];
//             }
//           }
//         }

//         result.push({
//           x: col.left - offsetX,
//           y: row.top - offsetY,
//           width: col.size,
//           height: row.size,
//           text,
//           textWidth,
//           border: cell.border ? state.borders[cell.border] : null,
//           style,
//           align,
//           clipRect,
//           isError: cell.error
//         });
//       }
//     }
//   }
//   // process all visible merges
//   for (let id in merges) {
//     let merge = merges[id];
//     if (overlap(merge, viewport)) {
//       const refCell = cells[merge.topLeft];
//       const width = cols[merge.right].right - cols[merge.left].left;
//       let text, textWidth, style, align, border;
//       if (refCell) {
//         text = refCell ? formatCell(model, refCell) : "";
//         textWidth = getCellWidth(refCell, model, ctx);
//         style = refCell.style ? state.styles[refCell.style] : {};
//         align = text
//           ? (style && style.align) || (refCell.type === "text" ? "left" : "right")
//           : null;
//         border = refCell.border ? state.borders[refCell.border] : null;
//       }
//       style = style || {};
//       if (!style.fillColor) {
//         style = Object.create(style);
//         style.fillColor = "#fff";
//       }

//       const x = cols[merge.left].left - offsetX;
//       const y = rows[merge.top].top - offsetY;
//       const height = rows[merge.bottom].bottom - rows[merge.top].top;
//       result.push({
//         x: x,
//         y: y,
//         width,
//         height,
//         text,
//         textWidth,
//         border,
//         style,
//         align,
//         clipRect: [x, y, width, height],
//         isError: refCell ? refCell.error : false
//       });
//     }
//   }
//   return result;
// }

// function getCellWidth(cell: Cell, model: GridModel, ctx: CanvasRenderingContext2D): number {
//   if (cell.width) {
//     return cell.width;
//   }
//   const style = model.state.styles[cell ? cell.style || 0 : 0];
//   const italic = style.italic ? "italic " : "";
//   const weight = style.bold ? "bold" : DEFAULT_FONT_WEIGHT;
//   const sizeInPt = style.fontSize || DEFAULT_FONT_SIZE;
//   const size = fontSizeMap[sizeInPt];
//   ctx.font = `${italic}${weight} ${size}px ${DEFAULT_FONT}`;
//   cell.width = ctx.measureText(formatCell(model, cell)).width;
//   return cell.width;
// }

function drawBackgroundGrid(state: GridState, ctx: CanvasRenderingContext2D) {
  const { rows, cols, height, width, offsetY, offsetX } = state;

  ctx.lineWidth = 0.4 * thinLineWidth;
  ctx.strokeStyle = "#222";
  ctx.beginPath();

  // vertical lines
  for (let col of cols) {
    const x = col.end - offsetX;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  // horizontal lines
  for (let row of rows) {
    const y = row.end - offsetY;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function drawBackgrounds(boxes: Box[], ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 0.3 * thinLineWidth;
  const inset = 0.1 * thinLineWidth;
  ctx.strokeStyle = "#111";
  for (let box of boxes) {
    // fill color
    let style = box.style;
    if (style && style.fillColor) {
      ctx.fillStyle = style.fillColor;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.strokeRect(box.x + inset, box.y + inset, box.width - 2 * inset, box.height - 2 * inset);
    }
    if (box.isError) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - 5, box.y);
      ctx.lineTo(box.x + box.width, box.y);
      ctx.lineTo(box.x + box.width, box.y + 5);
      ctx.fill();
    }
  }
}

function drawBorders(boxes: Box[], ctx: CanvasRenderingContext2D) {
  for (let box of boxes) {
    // fill color
    let border = box.border;
    if (border) {
      const { x, y, width, height } = box;
      if (border.left) {
        drawBorder(border.left, x, y, x, y + height);
      }
      if (border.top) {
        drawBorder(border.top, x, y, x + width, y);
      }
      if (border.right) {
        drawBorder(border.right, x + width, y, x + width, y + height);
      }
      if (border.bottom) {
        drawBorder(border.bottom, x, y + height, x + width, y + height);
      }
    }
  }
  function drawBorder([style, color], x1, y1, x2, y2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = (style === "thin" ? 2 : 3) * thinLineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawTexts(boxes: Box[], ctx: CanvasRenderingContext2D) {
  ctx.textBaseline = "middle";
  let currentFont;
  for (let box of boxes) {
    if (box.text) {
      const style = box.style || {};
      const align = box.align!;
      const italic = style.italic ? "italic " : "";
      const weight = style.bold ? "bold" : DEFAULT_FONT_WEIGHT;
      const sizeInPt = style.fontSize || DEFAULT_FONT_SIZE;
      const size = fontSizeMap[sizeInPt];
      const font = `${italic}${weight} ${size}px ${DEFAULT_FONT}`;
      if (font !== currentFont) {
        currentFont = font;
        ctx.font = font;
      }
      ctx.fillStyle = style.textColor || "#000";
      let x: number;
      let y = box.y + box.height / 2 + 1;
      if (align === "left") {
        x = box.x + 3;
      } else if (align === "right") {
        x = box.x + box.width - 3;
      } else {
        x = box.x + box.width / 2;
      }
      ctx.textAlign = align;
      if (box.clipRect) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(...box.clipRect);
        ctx.clip();
      }
      ctx.fillText(box.text, Math.round(x), Math.round(y));
      if (style.strikethrough) {
        if (align === "right") {
          x = x - box.textWidth;
        }
        ctx.fillRect(x, y, box.textWidth, 2.6 * thinLineWidth);
      }
      if (box.clipRect) {
        ctx.restore();
      }
    }
  }
}

function drawSelection(state: GridState, ctx: CanvasRenderingContext2D) {
  // const { selection } = state;
  // const { zones } = selection;
  // ctx.fillStyle = "#f3f7fe";
  // const onlyOneCell =
  //   zones.length === 1 && zones[0].left === zones[0].right && zones[0].top === zones[0].bottom;
  // ctx.fillStyle = onlyOneCell ? "#f3f7fe" : "#e9f0ff";
  // ctx.strokeStyle = "#3266ca";
  // ctx.lineWidth = 1.5 * thinLineWidth;
  // ctx.globalCompositeOperation = "multiply";
  // for (const zone of zones) {
  //   const [x, y, width, height] = getRect(zone, state);
  //   if (width > 0 && height > 0) {
  //     ctx.fillRect(x, y, width, height);
  //     ctx.strokeRect(x, y, width, height);
  //   }
  // }
  // ctx.globalCompositeOperation = "source-over";
}

function drawActiveZone(state: GridState, ctx: CanvasRenderingContext2D) {
  // const { mergeCellMap } = state;
  // ctx.strokeStyle = "#3266ca";
  // ctx.lineWidth = 3 * thinLineWidth;
  // let zone: Zone;
  // if (state.activeXc in mergeCellMap) {
  //   zone = state.merges[mergeCellMap[state.activeXc]];
  // } else {
  //   zone = {
  //     top: state.activeRow,
  //     bottom: state.activeRow,
  //     left: state.activeCol,
  //     right: state.activeCol
  //   };
  // }
  // const [x, y, width, height] = getRect(zone, state);
  // if (width > 0 && height > 0) {
  //   ctx.strokeRect(x, y, width, height);
  // }
}

// function getRect(zone: Zone, state: GridState): Rect {
//   const { left, top, right, bottom } = zone;
//   const { cols, rows, offsetY, offsetX } = state;
//   const x = Math.max(cols[left].left - offsetX, HEADER_WIDTH);
//   const width = cols[right].right - offsetX - x;
//   const y = Math.max(rows[top].top - offsetY, HEADER_HEIGHT);
//   const height = rows[bottom].bottom - offsetY - y;
//   return [x, y, width, height];
// }

function drawHighlights(state: GridState, ctx: CanvasRenderingContext2D) {
  // ctx.lineWidth = 3 * thinLineWidth;
  // for (let h of state.highlights) {
  //   const [x, y, width, height] = getRect(h.zone, state);
  //   if (width > 0 && height > 0) {
  //     ctx.strokeStyle = h.color!;
  //     ctx.strokeRect(x, y, width, height);
  //   }
  // }
}

function drawClipBoard(state: GridState, ctx: CanvasRenderingContext2D) {
  // const { clipboard } = state;
  // if (clipboard.status !== "visible" || !clipboard.zones.length) {
  //   return;
  // }
  // ctx.save();
  // ctx.setLineDash([8, 5]);
  // ctx.strokeStyle = "#3266ca";
  // ctx.lineWidth = 3.3 * thinLineWidth;
  // for (const zone of clipboard.zones) {
  //   const [x, y, width, height] = getRect(zone, state);
  //   if (width > 0 && height > 0) {
  //     ctx.strokeRect(x, y, width, height);
  //   }
  // }
  // ctx.restore();
}

function drawHeader(state: GridState, ctx: CanvasRenderingContext2D) {
  const { width, height, cols, offsetX, rows, offsetY } = state;
  // const { state, zoneIsEntireColumn, zoneIsEntireRow } = model;
  // const { selection, viewport, width, height, cols, rows, offsetX, offsetY } = state;
  // const { top, left, bottom, right } = viewport;
  ctx.fillStyle = "#f4f5f8";
  ctx.font = "400 12px Source Sans Pro";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = thinLineWidth;
  ctx.strokeStyle = "#333";

  // background
  ctx.fillRect(0, 0, width, HEADER_HEIGHT);
  ctx.fillRect(0, 0, HEADER_WIDTH, height);

  // selection background
  // ctx.fillStyle = "#dddddd";
  // for (let zone of selection.zones) {
  //   const x1 = Math.max(HEADER_WIDTH, cols[zone.left].left - offsetX);
  //   const x2 = Math.max(HEADER_WIDTH, cols[zone.right].right - offsetX);
  //   const y1 = Math.max(HEADER_HEIGHT, rows[zone.top].top - offsetY);
  //   const y2 = Math.max(HEADER_HEIGHT, rows[zone.bottom].bottom - offsetY);
  //   ctx.fillStyle = zoneIsEntireColumn(zone) ? "#595959" : "#dddddd";
  //   ctx.fillRect(x1, 0, x2 - x1, HEADER_HEIGHT);
  //   ctx.fillStyle = zoneIsEntireRow(zone) ? "#595959" : "#dddddd";
  //   ctx.fillRect(0, y1, HEADER_WIDTH, y2 - y1);
  // }

  // 2 main lines
  ctx.beginPath();
  ctx.moveTo(HEADER_WIDTH, 0);
  ctx.lineTo(HEADER_WIDTH, height);
  ctx.moveTo(0, HEADER_HEIGHT);
  ctx.lineTo(width, HEADER_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  // column text + separator
  for (let col of cols) {
    ctx.fillStyle = "#111"; // activeCols.has(i) ? "#fff" : "#111";
    ctx.fillText(col.name, (col.start + col.end) / 2 - offsetX, HEADER_HEIGHT / 2);
    ctx.moveTo(col.end - offsetX, 0);
    ctx.lineTo(col.end - offsetX, HEADER_HEIGHT);
  }
  // row text + separator
  for (let row of rows) {
    ctx.fillStyle = "#111"; // activeRows.has(i) ? "#fff" : "#111";
    ctx.fillText(row.name, HEADER_WIDTH / 2, (row.start + row.end) / 2 - offsetY);
    ctx.moveTo(0, row.end - offsetY);
    ctx.lineTo(HEADER_WIDTH, row.end - offsetY);
  }
  ctx.stroke();
}

/**
 * Return the max size of the text in a row/col
 * @param context Canvas context
 * @param _model Model
 * @param col True if the size it's a column, false otherwise
 * @param index Index of the row/col
 *
 * @returns Max size of the row/col
 */
// export function getMaxSize(
//   ctx: CanvasRenderingContext2D,
//   model: GridModel,
//   col: boolean,
//   index: number
// ): number {
//   let size = 0;
//   const state = model.state;
//   const headers = state[col ? "rows" : "cols"];
//   for (let i = 0; i < headers.length; i++) {
//     const cell = state.rows[col ? i : index].cells[col ? index : i];
//     if (cell) {
//       if (col) {
//         size = Math.max(size, getCellWidth(cell, model, ctx));
//       } else {
//         const style = state.styles[cell ? cell.style || 0 : 0];
//         const sizeInPt = style.fontSize || DEFAULT_FONT_SIZE;
//         const fontSize = fontSizeMap[sizeInPt];
//         size = Math.max(size, fontSize);
//       }
//     }
//   }
//   return size ? size + 6 : 0;
// }
