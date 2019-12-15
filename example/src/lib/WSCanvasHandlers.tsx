import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasState } from "./WSCanvasState";
import { WSCanvasXYCellCoord } from "./WSCanvasXYCellCoord";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasApi } from "./WSCanvasApi";

export interface WSCanvasHandlers {
    // onApi?: (states: WSCanvasStates, api: WSCanvasApi) => void;
    onStateChanged?: (states: WSCanvasStates) => void;

    onMouseOverCell?: (states: WSCanvasStates, nfo: WSCanvasXYCellCoord) => void;

    onPreviewKeyDown?: (states: WSCanvasStates, e: React.KeyboardEvent) => void;
    onKeyDown?: (states: WSCanvasStates, e: React.KeyboardEvent) => void;

    /** cell click ( row=-1 if column header click ; col=-1 if row header click ) */
    onPreviewMouseDown?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;
    onMouseDown?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;

    onPreviewMouseUp?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    onMouseUp?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;

    onPreviewMouseMove?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    onMouseMove?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;

    onPreviewMouseDoubleClick?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;
    onMouseDoubleClick?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;

    onPreviewMouseWheel?: (states: WSCanvasStates, e: WheelEvent) => void;
    onMouseWheel?: (states: WSCanvasStates, e: WheelEvent) => void;

    onContextMenu?: (states: WSCanvasStates, e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;
}
