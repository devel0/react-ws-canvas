import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasState } from "./WSCanvasState";
import { WSCanvasXYCellCoord } from "./WSCanvasXYCellCoord";
import { WSCanvasStates } from "./WSCanvasStates";

export class WSCanvasApi {    
    clearSelection: (states: WSCanvasStates) => void;
    getSelection: (states: WSCanvasStates) => WSCanvasSelection;
    setSelection: (states: WSCanvasStates, selection: WSCanvasSelection) => void;

    clientXYToCanvasCoord: (states: WSCanvasStates, x: number, y: number) => WSCanvasCoord | null;
    cellToCanvasCoord: (states: WSCanvasStates, cell: WSCanvasCellCoord) => WSCanvasCoord | null;
    canvasCoord: (states: WSCanvasStates) => WSCanvasCoord | null;
    canvasCoordToCellCoord: (states: WSCanvasStates, ccoord: WSCanvasCoord) => WSCanvasCellCoord | null;    
    focusCell: (states: WSCanvasStates, coord: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearSelection?: boolean) => void;
    scrollTo: (states: WSCanvasStates, coord: WSCanvasCellCoord) => void;
    setSorting: (states: WSCanvasStates, sorting: WSCanvasColumnSortInfo[]) => void;
    confirmCustomEdit: (states: WSCanvasStates) => void;
    closeCustomEdit: (states: WSCanvasStates) => void;
    goToNextCell: (states: WSCanvasStates) => void;
    triggerKey: (states: WSCanvasStates, e:React.KeyboardEvent) => void;

    paint: (states: WSCanvasStates) => void;    

    constructor() {        
        this.clearSelection = () => { };
        this.getSelection = () => new WSCanvasSelection([]);
        this.setSelection = () => { };

        this.clientXYToCanvasCoord = () => null;
        this.cellToCanvasCoord = () => null;
        this.canvasCoord = () => null;
        this.canvasCoordToCellCoord = () => null;
        this.focusCell = () => { };
        this.scrollTo = () => { };
        this.setSorting = () => { };
        this.confirmCustomEdit = () => {};
        this.closeCustomEdit = () => {};
        this.goToNextCell = () => {};
        this.triggerKey = () => {};
                
        this.paint = () => { };
    }
}
