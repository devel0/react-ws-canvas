import { WSCanvasCellCoord } from "./WSCanvasCellCoord";

export interface WSCanvasXYCellCoord {
    /** client coord */
    xy: number[];
    cell: WSCanvasCellCoord;
}