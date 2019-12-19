import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasSyncFn } from "./WSCanvas";

export class WSCanvasApi {
    /** initiate API block */
    begin: () => void;
    /** finalize API blocm */
    commit: () => void;
    onSync: (fn: WSCanvasSyncFn) => void;

    prepareCellDataset: () => void;
    setCellData: (cell: WSCanvasCellCoord, value: any) => void;
    commitCellDataset: () => void;
    getCellData: (cell: WSCanvasCellCoord) => any;

    filterAndSort: () => void;
    selectFocusedCell: () => void;
    clearSelection: () => void;
    getViewSelection: () => WSCanvasSelection;
    /** not optimized */
    getRealSelection: () => WSCanvasSelection;
    setViewSelection: (viewSelection: WSCanvasSelection) => void;
    setRealSelection: (realSelection: WSCanvasSelection) => void;
    /** not optimized */
    viewSelectionToReal: (viewSelection: WSCanvasSelection) => WSCanvasSelection;
    /** not optimized */
    realSelectionToView: (realSelection: WSCanvasSelection) => WSCanvasSelection;

    clientXYToCanvasCoord: (x: number, y: number) => WSCanvasCoord | null;
    cellToCanvasCoord: (cell: WSCanvasCellCoord) => WSCanvasCoord | null;
    canvasCoord: () => WSCanvasCoord | null;
    canvasCoordToCellCoord: (ccoord: WSCanvasCoord) => WSCanvasCellCoord | null;
    focusCell: (coord: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearSelection?: boolean) => void;
    scrollTo: (coord: WSCanvasCellCoord) => void;
    setSorting: (sorting: WSCanvasColumnSortInfo[]) => void;
    openCustomEdit: (cell: WSCanvasCellCoord) => void;
    closeCustomEdit: (confirm: boolean) => void;
    setCustomEditValue: (val: any) => void;
    goToNextCell: () => void;
    triggerKey: (e: React.KeyboardEvent) => void;
    viewRowToRealRow: (viewRow: number) => number;
    realRowToViewRow: (realRow: number) => number;
    realCellToView: (realCell: WSCanvasCellCoord) => WSCanvasCellCoord;
    viewCellToReal: (realCell: WSCanvasCellCoord) => WSCanvasCellCoord;
    formatCellDataAsDate: (cellData: any) => string;
    formatCellDataAsTime: (cellData: any) => string;
    formatCellDataAsDateTime: (cellData: any) => string;

    paint: () => void;
    resetView: () => void;

    states: WSCanvasStates;
    /** dataset (if use prepare,set,commitCellDataset) */
    ds: any;

    constructor(states: WSCanvasStates) {
        this.states = states;        

        this.begin = () => { };
        this.commit = () => { };
        this.onSync = () => { };

        this.prepareCellDataset = () => { };
        this.setCellData = () => { };
        this.commitCellDataset = () => { };
        this.getCellData = () => null;

        this.clearSelection = () => { };
        this.filterAndSort = () => { };
        this.selectFocusedCell = () => { };
        this.getViewSelection = () => new WSCanvasSelection([]);
        this.getRealSelection = () => new WSCanvasSelection([]);
        this.setViewSelection = () => { };
        this.setRealSelection = () => { };
        this.realSelectionToView = () => new WSCanvasSelection([]);
        this.viewSelectionToReal = () => new WSCanvasSelection([]);

        this.clientXYToCanvasCoord = () => null;
        this.cellToCanvasCoord = () => null;
        this.canvasCoord = () => null;
        this.canvasCoordToCellCoord = () => null;
        this.focusCell = () => { };
        this.scrollTo = () => { };
        this.setSorting = () => { };
        this.openCustomEdit = () => { };
        this.closeCustomEdit = () => { };
        this.setCustomEditValue = () => { };
        this.goToNextCell = () => { };
        this.triggerKey = () => { };
        this.viewRowToRealRow = () => 0;
        this.realRowToViewRow = () => 0;
        this.realCellToView = () => new WSCanvasCellCoord();
        this.viewCellToReal = () => new WSCanvasCellCoord();
        this.formatCellDataAsDate = () => "";
        this.formatCellDataAsTime = () => "";
        this.formatCellDataAsDateTime = () => "";

        this.paint = () => { };
        this.resetView = () => { };
    }
}
