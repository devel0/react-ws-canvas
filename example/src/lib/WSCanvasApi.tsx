import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasSyncFn } from "./WSCanvas";

/** react-ws-canvas API
 * Glossary:
 * - `real cell coordinates` : row,col indexes correspond to dataset
 * - `view cell coordinates` : row,col indexes correspond to graphic canvas ( affected by filter and/or sort )
 */
export class WSCanvasApi {

    /** initiate API block ( clones api.states ) */
    begin: () => void;

    /** finalize API blocm ( stores api.states )*/
    commit: () => void;

    /** clones dataset into api.ds */
    prepareCellDataset: () => void;
    /** change cell value into api.ds */
    setCellData: (cell: WSCanvasCellCoord, value: any) => void;
    /** commit api.ds to current bounded data */
    commitCellDataset: () => void;
    /** retrieve data of given real cell */
    getCellData: (cell: WSCanvasCellCoord) => any;

    /** force filter */
    filter: () => void;

    /** force sort */
    sort: () => void;

    /** set selection to focused cell */
    selectFocusedCell: () => void;

    /** remove current selection ( not the content ) */
    clearSelection: () => void;

    /** retrieve current selection ( view coordinates ) */
    getViewSelection: () => WSCanvasSelection;

    /** retrieve current real selection [ not optimized ] */
    getRealSelection: () => WSCanvasSelection;

    /** set current selection ( view cells ) */
    setViewSelection: (viewSelection: WSCanvasSelection) => void;

    /** set current selection ( real cells ) */
    setRealSelection: (realSelection: WSCanvasSelection) => void;

    /** convert given selection ( view cells ) into a real one [ not optimized ] */
    viewSelectionToReal: (viewSelection: WSCanvasSelection) => WSCanvasSelection;

    /** convert given selection ( real cells ) into a view one [ not optimized ] */
    realSelectionToView: (realSelection: WSCanvasSelection) => WSCanvasSelection;

    /** convert client x,y to canvas relative coordinate */
    clientXYToCanvasCoord: (x: number, y: number) => WSCanvasCoord | null;

    /** retrieve real cell x,y,width,height */
    cellToCanvasCoord: (cell: WSCanvasCellCoord) => WSCanvasCoord | null;

    /** coordinates of canvas */
    canvasCoord: () => WSCanvasCoord | null;

    /** convert given coordinate relative to canvas into real cell coordinate */
    canvasCoordToCellCoord: (ccoord: WSCanvasCoord) => WSCanvasCellCoord | null;

    /** set focus to given real cell */
    focusCell: (coord: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearSelection?: boolean) => void;

    /** set scroll to view given real cell */
    scrollTo: (coord: WSCanvasCellCoord) => void;

    /** change column sorting */
    setSorting: (sorting: WSCanvasColumnSortInfo[]) => void;

    /** open custom editor at given real cell */
    openCustomEdit: (cell: WSCanvasCellCoord) => void;

    /** close current custom editor */
    closeCustomEdit: (confirm: boolean) => void;

    /** change custom editor value */
    setCustomEditValue: (val: any) => void;

    /** go to next view cell */
    goToNextCell: () => void;

    /** simulate key press */
    triggerKey: (e: React.KeyboardEvent) => void;

    /** convert view to to real row */
    viewRowToRealRow: (viewRow: number) => number;

    /** convert real row to view row */
    realRowToViewRow: (realRow: number) => number;

    /** convert real cell to view cell */
    realCellToView: (realCell: WSCanvasCellCoord) => WSCanvasCellCoord;

    /** convert view cell to real cell */
    viewCellToReal: (realCell: WSCanvasCellCoord) => WSCanvasCellCoord;

    /** copy current selection to clipboard suitable to paste in spreadsheet */
    copySelectionToClipboard: (sel: WSCanvasSelection) => void;

    /** copy entire worksheet to clipboard suitable to paste in spreadsheet */
    copyWorksheetToClipboard: () => void;

    /** states if current selection cover entire worksheet */
    selectionIsFullWorksheet: () => boolean;

    /** format given Date object accordingly moment format for Date (see props) */
    formatCellDataAsDate: (cellData: any) => string;

    /** format given Date object accordingly moment format for Time (see props) */
    formatCellDataAsTime: (cellData: any) => string;

    /** format given Date object accordingly moment format for DateTime (see props) */
    formatCellDataAsDateTime: (cellData: any) => string;

    /** force paint */
    paint: () => void;

    /** force view reset */
    resetView: () => void;

    /** testing */
    onSync: (fn: WSCanvasSyncFn) => void;

    /** current states */
    states: WSCanvasStates;

    /** dataset if using prepareCellDataset, setCellData, commitCellDataset */
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
        this.filter = () => { };
        this.sort = () => { };
        this.selectFocusedCell = () => { };
        this.getViewSelection = () => new WSCanvasSelection([]);
        this.getRealSelection = () => new WSCanvasSelection([]);
        this.setViewSelection = () => { };
        this.setRealSelection = () => { };
        this.realSelectionToView = () => new WSCanvasSelection([]);
        this.viewSelectionToReal = () => new WSCanvasSelection([]);
        this.copySelectionToClipboard = () => { };
        this.copyWorksheetToClipboard = () => { };
        this.selectionIsFullWorksheet = () => false;        

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
