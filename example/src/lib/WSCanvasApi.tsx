import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasState } from "./WSCanvasState";
import { WSCanvasXYCellCoord } from "./WSCanvasXYCellCoord";

export class WSCanvasApi {
    currentState: WSCanvasState | null;
    clearSelection: () => void;
    getSelection: () => WSCanvasSelection;
    setSelection: (selection: WSCanvasSelection) => void;

    clientXYToCanvasCoord: (x: number, y: number) => WSCanvasCoord | null;
    cellToCanvasCoord: (cell: WSCanvasCellCoord) => WSCanvasCoord | null;
    canvasCoordToCellCoord: (ccoord: WSCanvasCoord) => WSCanvasCellCoord | null;    
    focusCell: (coord: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearSelection?: boolean) => void;
    scrollTo: (coord: WSCanvasCellCoord) => void;
    setSorting: (sorting: WSCanvasColumnSortInfo[]) => void;
    confirmCustomEdit: () => void;
    closeCustomEdit: () => void;
    goToNextCell: () => void;
    triggerKey: (e:React.KeyboardEvent) => void;

    onStateChanged?: (state:WSCanvasState) => void;

    paint: () => void;

    onMouseOverCell?: (nfo: WSCanvasXYCellCoord) => void;

    onPreviewKeyDown?: (e: React.KeyboardEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;

    /** cell click ( row=-1 if column header click ; col=-1 if row header click ) */
    onPreviewMouseDown?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;
    onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;

    onPreviewMouseUp?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;

    onPreviewMouseMove?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;

    onPreviewMouseDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;
    onMouseDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;

    onPreviewMouseWheel?: (e: WheelEvent) => void;
    onMouseWheel?: (e: WheelEvent) => void;

    onContextMenu?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>, cell: WSCanvasCellCoord | null) => void;

    constructor() {
        this.currentState = null;
        this.clearSelection = () => { };
        this.getSelection = () => new WSCanvasSelection([]);
        this.setSelection = () => { };

        this.clientXYToCanvasCoord = () => null;
        this.cellToCanvasCoord = () => null;
        this.canvasCoordToCellCoord = () => null;
        this.focusCell = () => { };
        this.scrollTo = () => { };
        this.setSorting = () => { };
        this.confirmCustomEdit = () => {};
        this.closeCustomEdit = () => {};
        this.goToNextCell = () => {};
        this.triggerKey = () => {};

        this.onStateChanged = undefined;
        this.paint = () => { };
    }
}
