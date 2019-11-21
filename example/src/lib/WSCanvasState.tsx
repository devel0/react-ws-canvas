import { WSCanvasEditMode } from "./WSCanvasEditMode";
import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasRect } from "./WSCanvasRect";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import * as _ from 'lodash';
import { WSCanvasFilter } from "./WSCanvasFilter";

export class WSCanvasState {    
    constructor() {
        this.scrollOffset = new WSCanvasCellCoord();
        this.scrollOffsetStart = new WSCanvasCellCoord();
        this.tableCellsBBox = new WSCanvasRect();

        this.touchStartTime = 0;
        this.touchStart = [0, 0];
        this.touchCur = [0, 0];

        this.focusedCell = new WSCanvasCellCoord();
        this.focusedFilterColIdx = -1;
        this.filters = [];
        this.filtersTrack = "";
        this.hoveredRow = -2;

        this.editMode = WSCanvasEditMode.none;
        this.filteredRowsCount = 0;

        this.customEditCell = null;
        this.customEditValue = null;
        this.columnWidthOverride = new Map<number, number>();
        this.resizingCol = -2;
        this.resizingColStartNfo = [-2, 0];
        this.colWidthExpanded = 0;

        this.selection = new WSCanvasSelection([]);
        this.columnsSort = [];
        this.cursorOverCell = false;

        this.verticalScrollBarRect = null;
        this.verticalScrollHandleRect = null;
        this.verticalScrollClickStartCoord = null;
        this.verticalScrollClickStartFactor = 0;
        this.horizontalScrollBarRect = null;
        this.horizontalScrollHandleRect = null;
        this.horizontalScrollClickStartCoord = null;
        this.horizontalScrollClickStartFactor = 0;

        this.paintcnt = 0;
        this.debugNfo = "";
        this.initialized = false;
    }

    scrollOffset: WSCanvasCellCoord;
    scrollOffsetStart: WSCanvasCellCoord;
    tableCellsBBox: WSCanvasRect;

    touchStartTime: number;
    touchStart: number[];
    touchCur: number[];

    focusedCell: WSCanvasCellCoord;
    focusedFilterColIdx: number;
    filters: WSCanvasFilter[];
    filtersTrack: string;
    hoveredRow: number;

    editMode: WSCanvasEditMode;
    filteredRowsCount: number;

    customEditCell: WSCanvasCellCoord | null;
    customEditValue: any;
    columnWidthOverride: Map<number, number>;
    resizingCol: number;
    /** x,width */
    resizingColStartNfo: number[];
    colWidthExpanded: number;

    selection: WSCanvasSelection;
    columnsSort: WSCanvasColumnSortInfo[];
    cursorOverCell: boolean;

    verticalScrollBarRect: WSCanvasRect | null;
    verticalScrollHandleRect: WSCanvasRect | null;
    verticalScrollClickStartCoord: WSCanvasCoord | null;
    verticalScrollClickStartFactor: number;
    horizontalScrollBarRect: WSCanvasRect | null;
    horizontalScrollHandleRect: WSCanvasRect | null;
    horizontalScrollClickStartCoord: WSCanvasCoord | null;
    horizontalScrollClickStartFactor: number;

    paintcnt: number;
    debugNfo: string;
    initialized: boolean;

    dup() {
        const q = _.cloneDeep(this) as WSCanvasState;
        return q;
    }
}