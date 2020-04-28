import { WSCanvasScrollbarMode } from "./WSCanvasScrollbarMode";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasColumnType, WSCanvasColumnClickBehavior, WSCanvasColumn } from "./WSCanvasColumn";
import { WSCanvasApi } from "./WSCanvasApi";
import { CSSProperties } from "react";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasXYCellCoord } from "./WSCanvasXYCellCoord";

export interface WSCanvasCellDataNfo {
    coord: WSCanvasCellCoord;
    value: any;
}

/** see WSCanvasPropsDefault for default values */
export interface WSCanvasProps {
    /** custom identifier */
    id?: string;
    /** width 100% [default: false] */
    fullwidth: boolean;
    /** width of canvas [default: window.innerWidth] */
    width: number;
    /** height of canvas [default: window.innerHeight] */
    height: number;
    /** rows datasource (note: when sort changes array order will change accordingly) [default: []] */
    rows: any[];
    /** nr of rows in the grid [default: 0] */
    rowsCount: number;
    /** nr of cols in the grid ( or use columns ) [default: 0] */
    colsCount?: number;
    /** compact column info [default: undefined] */
    columns?: WSCanvasColumn[];
    /** width of column in the grid ( or use columns ) [default: undefined] */
    colWidth?: (cidx: number) => number;
    /** expand column width to fit control width ( if column width sum not already exceed control width ) [default: true] */
    colWidthExpand: boolean;
    /** height of rows in the grid [default: DEFAULT_ROW_HEIGHT=30] 
     * if overriden, when row===null or ridx===-1 should return default height */
    rowHeight: (row: any, ridx: number) => number;
    /** nr of frozen rows [default: 0] */
    frozenRowsCount: number;
    /** nr of frozen cols [default: 0] */
    frozenColsCount: number;
    /** selection mode allow append using ctrl key [default: true] */
    selectionModeMulti: boolean;
    /** selection mode row or cell [default: WSCanvasSelectMode.Cell] */
    selectionMode: WSCanvasSelectMode;
    /** show focused cell outline [default: false] */
    showFocusedCellOutline: boolean;
    /** show row numbers column [default: false] */
    showRowNumber: boolean;
    /** highlight row header matching current sel [default: true] */
    highlightRowNumber: boolean;
    /** show column headers row [default: false] */
    showColNumber: boolean;
    /** highlight column header matching current sel [default: true] */
    highlightColNumber: boolean;
    /** behavior for column header click sort or select [default: WSCanvasColumnClickBehavior.ToggleSort] */
    columnClickBehavior: WSCanvasColumnClickBehavior;
    /** show column filters row [default: false] */
    showFilter: boolean;
    /** whatever select first avail row after filtering [default: false] */
    selectFirstOnFilter: boolean;
    /** if set true filter consider datasource instead of renderTransform if present [default: ()=>false]*/
    filterUseDatasource: (cell: WSCanvasCellCoord) => boolean;
    /** show or truncate partial columns [default: true] */
    showPartialColumns: boolean;
    /** show or truncate partial rows [default: true] */
    showPartialRows: boolean;
    /** prevent wheel default window scroll when scroll at top or bottom [default: true] */
    preventWheelOnBounds: boolean;
    /** if set new rows goes inserted at given view index [default: undefined] */
    newRowsInsertAtViewIndex?: number;
    /** allow to force a global filter ; rows that not satisfy the filter aren't shown */
    globalFilter?: (row: any, ridx:number) => boolean | undefined;

    /** retrieve data from a row */
    rowGetCellData?: (row: any, colIdx: number) => any;
    /** allow to transform data before being displayed (useful for enum types); if defined must return input data as is or transformed ( or use columns ) [default: undefined] */
    renderTransform?: (row: any, cell: WSCanvasCellCoord, data: any) => any;
    /** retrieve rows dataset copy [default: []] */
    prepareCellDataset: () => any;
    /** retrieve rows from dataset [default: (ds) => ds as any[]] */
    cellDatasetGetRows: (ds: any) => any[];
    /** set row cell data [default: {}] */
    rowSetCellData: (row: any, colIdx: number, value: any) => void;
    /** set cell dataset state [default: {}] */
    commitCellDataset: (dataset: any) => void;
    /** allow to define a custom editor or return undefined to use builtin cell editor [default: undefined] */
    getCellCustomEdit?: ((states: WSCanvasStates, row: any, cell: WSCanvasCellCoord,
        containerStyle?: CSSProperties, cellWidth?: number, cellHeight?: number) => JSX.Element) | undefined;
    /** header of given col ( or use columns ) [default: undefined] */
    getColumnHeader?: (col: number) => string | undefined;
    /** states whatever colum should hidden [default: undefined] */
    getColumnHidden?: (col: number) => boolean;
    /** column sort method  ( or use columns ) [default: undefined] */
    getColumnLessThanOp?: (col: number) => ((a: any, b: any) => boolean) | undefined;
    /** specify type of a cell ( or use columns)  [default: undefined] */
    getCellType?: (row: any, coord: WSCanvasCellCoord, value: any) => WSCanvasColumnType | undefined;
    /** specify cell editor inhibit ( or use columns ) [default: undefined] */
    isCellReadonly?: (row: any, coord: WSCanvasCellCoord) => boolean | undefined;
    /** specify predefined column sort ( WSCanvasColumn array helper or use columns ) [default: undefined] */
    columnInitialSort?: WSCanvasColumnSortInfo[] | undefined;
    /** specify text align of a cell ( or use columns ) [default: undefined] */
    getCellTextAlign?: (row: any, coord: WSCanvasCellCoord, value: any) => CanvasTextAlign | undefined;

    /** individual cell background customization [default: undefined] */
    getCellBackgroundColor?: (row: any, coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** cell background [default: "white"] */
    sheetBackgroundColor: string;
    /** grid lines color [default: "#c0c0c0"] */
    gridLinesColor: string;
    /** color of frozen row/cols separator line [default: "black"] */
    frozenCellGridLinesColor: string;
    /** color or focused cell outline [default: "black"] */
    focusedCellBorderColor: string;

    /** background color of selected cells [default: "#f9d4c7"] */
    selectionBackgroundColor: string;
    /** border color of selection [default: "#e95420"] */
    selectionBorderColor: string;
    /** color of row/col numbers [default: "white"] */
    selectedHeaderTextColor: string;
    /** background of row/col numbers [default: "#e95420"] */
    selectedHeaderBackgroundColor: string;

    /** moment formatting for date type cells [default: "L"] */
    dateCellMomentFormat: string;
    /** moment formatting for time type cells [default: "LT"] */
    timeCellMomentFormat: string;
    /** moment formatting for datetime type cells (ex. "L LTS" to include seconds) [default: "L LT"] */
    dateTimeCellMomentFormat: string;
    /** margin of text inside cells [default: 2] */
    textMargin: number;
    /** individual cell text wrap ( or use columns ) [default: undefined] */
    getCellTextWrap?: (row: any, coord: WSCanvasCellCoord, props: WSCanvasProps) => boolean | undefined;
    /** individual cell font customization [default: undefined] */
    getCellFont?: (row: any, coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** font of cells text [default: "12px Liberation Sans"] */
    font: string;
    /** individual cell text color customization [default: undefined] */
    getCellTextColor?: (row: any, coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** color of cell text [default: "black"] */
    cellTextColor: string;
    /** font of row/col nunbers [default: "16px Liberation Sans"] */
    headerFont: string;
    /** default cell cursor [default: "default"] */
    cellCursor: string;
    /** default non cell cursor [default: "default"] */
    outsideCellCursor: string;
    /** row hover (ex. "rgba(127,127,127, 0.1)") [default: undefined] */
    rowHoverColor: (row: any, ridx: number) => string | undefined;

    /** filter apply debounce (ms) [default: 500] */
    filterDebounceMs: number;
    /** filter edit cell margin [default: 3] */
    filterTextMargin: number;
    /** filter match ignore case [default: true] */
    filterIgnoreCase: boolean;
    /** filter cell background color [default: "yellow"] */
    filterBackground: string;
    /** if autoselect all text when click on filter */
    filterAutoSelectAll: boolean;

    /** ms from last column change to recompute row height [default: 0] */
    recomputeRowHeightDebounceFilterMs: number;
    /** width of row numbers col [default: 80] */
    rowNumberColWidth: number;
    /** height of column numbers row [default: DEFAULT_ROW_HEIGHT=30] */
    colNumberRowHeight: number;
    /** background of row/col number cells [default: "#f5f6f7"] */
    cellNumberBackgroundColor: string;

    /** mode of vertical scrollbar ( auto, on, off ) [default: WSCanvasScrollbarMode.auto] */
    verticalScrollbarMode: WSCanvasScrollbarMode;
    /** mode of horizontal scrollbar ( auto, on, off ) [default: WSCanvasScrollbarMode.auto] */
    horizontalScrollbarMode: WSCanvasScrollbarMode;
    /** thickness of scrollbar [default: 10] */
    scrollBarThk: number;
    /** min length of scrollbar handle [default: 20] */
    minScrollHandleLen: number;
    /** scrollbar handle color [default: "#878787"] */
    scrollBarColor: string;
    /** scrollbar handle actived color [default: "red"] */
    clickedScrollBarColor: string;

    /** div container custom styles [default: undefined] */
    containerStyle: CSSProperties | undefined;
    /** canvas custom styles ( margin and padding will overriden to 0; use containerStyle for these ) [default: undefined] */
    canvasStyle: CSSProperties | undefined;

    /** enable debug div ( for dev purpose ) [default: false] */
    debug: boolean;
    /** div where to place debug [default: undefined] */
    dbgDiv: React.RefObject<HTMLDivElement> | undefined;

    /** receive api */
    onApi?: (api: WSCanvasApi) => void,

    onStateChanged?: (states: WSCanvasStates) => void;

    onMouseOverCell?: (states: WSCanvasStates, nfo: WSCanvasXYCellCoord | null) => void;

    /** fired when custom edit opens */
    onCustomEdit?: (states: WSCanvasStates, cell: WSCanvasCellCoord) => void;

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

    /** fired before cell editing done ; can prevent editing done by return false */
    onCellEditing?: (states: WSCanvasStates, row: any, cell: WSCanvasCellCoord, oldValue: any, newValue:any) => boolean;

    /** fired after cell edited */
    onCellEdited?: (states: WSCanvasStates, row: any, cell: WSCanvasCellCoord, oldValue: any, newValue:any) => void;
}