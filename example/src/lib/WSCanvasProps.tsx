import { WSCanvasScrollbarMode } from "./WSCanvasScrollbarMode";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasColumnType, WSCanvasColumnClickBehavior } from "./WSCanvasColumn";
import { WSCanvasApi } from "./WSCanvasApi";
import { CSSProperties } from "react";
import { WSCanvasColumnSortInfo } from "./WSCanvasSortDirection";
import { WSCanvasState } from "./WSCanvasState";
import { ViewMap } from "./WSCanvas";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasHandlers } from "./WSCanvasHandlers";

export interface WSCanvasCellDataNfo {
    coord: WSCanvasCellCoord;
    value: any;
}

/** see WSCanvasPropsDefault for default values */
export interface WSCanvasProps {
    /** handlers */
    handlers?: WSCanvasHandlers,
    /** receive api */
    onApi?: (states: WSCanvasStates, api: WSCanvasApi) => void,

    /** width 100% */
    fullwidth: boolean;
    /** width of canvas */
    width: number;
    /** height of canvas */
    height: number;
    /** datasource to sync refresh */
    dataSource: any;
    /** nr of rows in the grid */
    rowsCount: number;
    /** nr of cols in the grid */
    colsCount: number;
    /** width of column in the grid */
    colWidth: (cidx: number) => number;
    /** expand column width to fit control width ( if column width sum not already exceed control width ) */
    colWidthExpand: boolean;
    /** height of rows in the grid */
    rowHeight: (ridx: number) => number;
    /** nr of frozen rows */
    frozenRowsCount: number;
    /** nr of frozen cols */
    frozenColsCount: number;
    /** selection mode allow append using ctrl key */
    selectionModeMulti: boolean;
    /** selection mode row or cell */
    selectionMode: WSCanvasSelectMode;
    /** select focused cell or row depending on selectionMode */
    selectFocusedCellOrRow: boolean;
    /** show focused cell outline */
    showFocusedCellOutline: boolean;
    /** show row numbers column */
    showRowNumber: boolean;
    /** highlight row header matching current sel */
    highlightRowNumber: boolean;
    /** show column headers row */
    showColNumber: boolean;
    /** highlight column header matching current sel */
    highlightColNumber: boolean;
    /** behavior for column header click sort or select */
    columnClickBehavior: WSCanvasColumnClickBehavior;
    /** show column filters row */
    showFilter: boolean;
    /** whatever select first avail row after filtering */
    selectFirstOnFilter: boolean;
    /** show or truncate partial columns */
    showPartialColumns: boolean;
    /** show or truncate partial rows */
    showPartialRows: boolean;
    /** prevent wheel default window scroll when scroll at top or bottom */
    preventWheelOnBounds: boolean;

    /** retrieve data from a cell */
    getCellData: (coord: WSCanvasCellCoord) => any;
    /** allow to transform data before being displayed (useful for enum types); if defined must return input data as is or transformed */
    renderTransform?: (cell: WSCanvasCellCoord, data: any) => any;
    /** retrieve cells dataset copy */
    prepareCellDataset: () => any;
    /** apply change to dataset */
    setCellData: (dataset: any, cell: WSCanvasCellCoord, value: any) => void;
    /** set cell dataset state */
    commitCellDataset: (dataset: any) => void;
    /** allow to define a custom editor or return undefined to use builtin cell editor */
    getCellCustomEdit?: (states: WSCanvasStates, props: WSCanvasProps, cell: WSCanvasCellCoord,
        containerStyle?: CSSProperties, cellWidth?: number, cellHeight?: number) => JSX.Element | undefined,
    /** header of given col */
    getColumnHeader?: (col: number) => string;
    /** column sort method */
    getColumnLessThanOp?: (col: number) => (a: any, b: any) => boolean | undefined;
    /** specify type of a cell */
    getCellType?: (coord: WSCanvasCellCoord, value: any) => WSCanvasColumnType | undefined;
    /** specify cell editor inhibit */
    isCellReadonly?: (coord: WSCanvasCellCoord) => boolean | undefined;
    /** specify predefined column sort ( WSCanvasColumn array helper ) */
    columnInitialSort: WSCanvasColumnSortInfo[] | undefined;
    /** specify text align of a cell */
    getCellTextAlign?: (coord: WSCanvasCellCoord, value: any) => CanvasTextAlign | undefined;

    /** individual cell background customization */
    getCellBackgroundColor?: (coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** cell background */
    sheetBackgroundColor: string;
    /** grid lines color */
    gridLinesColor: string;
    /** color of frozen row/cols separator line*/
    frozenCellGridLinesColor: string;
    /** color or focused cell outline */
    focusedCellBorderColor: string;

    /** background color of selected cells */
    selectionBackgroundColor: string;
    /** border color of selection */
    selectionBorderColor: string;
    /** color of row/col numbers */
    selectedHeaderTextColor: string;
    /** background of row/col numbers */
    selectedHeaderBackgroundColor: string;

    /** moment formatting for date type cells */
    dateCellMomentFormat: string;
    /** moment formatting for time type cells */
    timeCellMomentFormat: string;
    /** moment formatting for datetime type cells */
    dateTimeCellMomentFormat: string;
    /** margin of text inside cells */
    textMargin: number;
    /** individual cell text wrap */
    getCellTextWrap?: (coord: WSCanvasCellCoord, props: WSCanvasProps) => boolean | undefined;
    /** individual cell font customization */
    getCellFont?: (coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** font of cells text */
    font: string;
    /** individual cell text color customization */
    getCellTextColor?: (coord: WSCanvasCellCoord, props: WSCanvasProps) => string | undefined;
    /** color of cell text */
    cellTextColor: string;
    /** font of row/col nunbers */
    headerFont: string;
    /** default cell cursor */
    cellCursor: string;
    /** default non cell cursor */
    outsideCellCursor: string;
    /** row hover */
    rowHoverColor: string | undefined;    

    /** filter apply debounce (ms) */
    filterDebounceMs: number;
    /** filter edit cell margin */
    filterTextMargin: number;
    /** filter match ignore case */
    filterIgnoreCase: boolean;
    /** filter cell background color */
    filterBackground: string;
    /** sort during typings */
    immediateSort: boolean;    

    /** ms from last column change to recompute row height */
    recomputeRowHeightDebounceFilterMs: number;
    /** width of row numbers col */
    rowNumberColWidth: number;
    /** height of column numbers row */
    colNumberRowHeight: number;
    /** background of row/col number cells */
    cellNumberBackgroundColor: string;

    /** mode of vertical scrollbar ( auto, on, off ) */
    verticalScrollbarMode: WSCanvasScrollbarMode;
    /** mode of horizontal scrollbar ( auto, on, off ) */
    horizontalScrollbarMode: WSCanvasScrollbarMode;
    /** thickness of scrollbar */
    scrollBarThk: number;
    /** min length of scrollbar handle */
    minScrollHandleLen: number;
    /** scrollbar handle color */
    scrollBarColor: string;
    /** scrollbar handle actived color */
    clickedScrollBarColor: string;

    /** div container custom styles */
    containerStyle: CSSProperties | undefined;
    /** canvas custom styles ( margin and padding will overriden to 0; use containerStyle for these ) */
    canvasStyle: CSSProperties | undefined;

    /** enable debug div ( for dev purpose ) */
    debug: boolean;
    /** div where to place debug */
    dbgDiv: React.RefObject<HTMLDivElement> | undefined;
}