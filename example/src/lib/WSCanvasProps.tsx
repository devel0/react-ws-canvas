import { WSCanvasScrollbarMode } from "./WSCanvasScrollbarMode";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasColumnType, WSCanvasColumnClickBehavior } from "./WSCanvasColumn";
import { WSCanvasApi } from "./WSCanvasApi";
import { CSSProperties } from "react";

/** see WSCanvasPropsDefault for default values */
export interface WSCanvasProps {
    api: WSCanvasApi;

    /** width of canvas */
    width: number;
    /** height of canvas */
    height: number;
    /** nr of rows in the grid */
    rowsCount: number;
    /** nr of cols in the grid */
    colsCount: number;
    /** width of column in the grid */
    colWidth: (cidx: number) => number;
    /** height of rows in the grid */
    rowHeight: number;
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

    /** retrieve data from a cell */
    getCellData: (coord: WSCanvasCellCoord) => any;
    /** set data of a cell */
    setCellData: (coord: WSCanvasCellCoord, value: any) => void;
    /** allow to define a custom editor or return undefined to use builtin cell editor */
    getCellCustomEdit?: (coord: WSCanvasCellCoord, props: WSCanvasProps) => JSX.Element | undefined;
    /** header of given col */
    getColumnHeader?: (col: number) => string;
    /** column sort method */
    getColumnLessThanOp?: (col: number) => (a: any, b: any) => boolean;
    /** specify type of a cell */
    getCellType?: (coord: WSCanvasCellCoord, value: any) => WSCanvasColumnType;
    /** specify cell editor inhibit */
    isCellReadonly?: (coord: WSCanvasCellCoord) => boolean;

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
    /** font of cells text */
    font: string;
    /** color of cell text */
    cellTextColor: string;
    /** font of row/col nunbers */
    headerFont: string;
    /** default cell cursor */
    cellCursor: string;
    /** default non cell cursor */
    outsideCellCursor: string;

    /** filter apply debounce (ms) */
    filterDebounceMs: number;
    /** filter edit cell margin */
    filterTextMargin: number;
    /** filter match ignore case */
    filterIgnoreCase: boolean;
    /** filter cell background color */
    filterBackground: string;

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
    containerStyle?: CSSProperties;
    /** canvas custom styles ( margin and padding will overriden to 0; use containerStyle for these ) */
    canvasStyle?: CSSProperties;

    /** enable debug div ( for dev purpose ) */
    debug: boolean;
}