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

        this.touchStartTime = 0;
        this.touchStart = [0, 0];
        this.touchCur = [0, 0];

        this.focusedCell = new WSCanvasCellCoord();
        this.focusedFilterColIdx = -1;
        this.filters = [];
        this.filtersTrack = "";
        this.editMode = WSCanvasEditMode.none;        
        this.filteredRowsCount = 0;

        this.customEditCell = null;
        this.customEditValue = null;
        this.columnWidthOverride = new Map<number, number>();
        this.resizingCol = -2;
        this.resizingColStartNfo = [-2, 0];

        this.selection = new WSCanvasSelection([]);
        this.columnsSort = [];        

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
    }

    scrollOffset: WSCanvasCellCoord;
    scrollOffsetStart: WSCanvasCellCoord;

    touchStartTime: number;
    touchStart: number[];
    touchCur: number[];

    focusedCell: WSCanvasCellCoord;
    focusedFilterColIdx: number;
    filters: WSCanvasFilter[];
    filtersTrack: string;

    editMode: WSCanvasEditMode;    
    filteredRowsCount: number;

    customEditCell: WSCanvasCellCoord | null;
    customEditValue: any;
    columnWidthOverride: Map<number, number>;
    resizingCol: number;
    /** x,width */
    resizingColStartNfo: number[];

    selection: WSCanvasSelection;
    columnsSort: WSCanvasColumnSortInfo[];    

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

    dup() {
        const q = _.cloneDeep(this) as WSCanvasState;
        return q;
    }
}