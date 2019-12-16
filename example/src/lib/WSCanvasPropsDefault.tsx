import { WSCanvasProps } from "./WSCanvasProps";
import { WSCanvasScrollbarMode } from "./WSCanvasScrollbarMode";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";
import { WSCanvasApi } from "./WSCanvasApi";
import { WSCanvasColumnClickBehavior } from "./WSCanvasColumn";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";

const DEFAULT_ROW_HEIGHT = 30;
const DEFAULT_COL_WIDTH = 120;

export const WSCanvasPropsDefault = () => {
    return {        
        onApi: undefined,
        handlers: undefined,

        fullwidth: false,
        width: window.innerWidth,        
        height: window.innerHeight,
        dataSource: null,
        rowsCount: 1000,
        colsCount: 50,
        colWidth: () => DEFAULT_COL_WIDTH,
        colWidthExpand: true,
        rowHeight: () => DEFAULT_ROW_HEIGHT,
        frozenRowsCount: 0,
        frozenColsCount: 0,
        selectionModeMulti: true,
        selectionMode: WSCanvasSelectMode.Cell,
        selectFocusedCellOrRow: false,
        showFocusedCellOutline: true,
        showRowNumber: false,
        highlightRowNumber: true,
        showColNumber: false,
        highlightColNumber: true,
        columnClickBehavior: WSCanvasColumnClickBehavior.ToggleSort,
        showFilter: false,
        selectFirstOnFilter: false,
        showPartialColumns: true,
        showPartialRows: true,
        preventWheelOnBounds: true,

        getCellData: (cell) => null,        
        renderTransform: undefined,
        prepareCellDataset: () => null,
        setCellData: (dataset: any, cell: WSCanvasCellCoord, value: any) => {},
        commitCellDataset: (dataset: any) => {},        
        getCellCustomEdit: undefined,
        getColumnHeader: undefined,
        getColumnLessThanOp: undefined,
        getCellType: undefined,
        isCellReadonly: undefined,
        columnInitialSort: undefined,
        getCellTextAlign: undefined,

        getCellBackgroundColor: undefined,
        sheetBackgroundColor: "white",
        gridLinesColor: "#c0c0c0",
        frozenCellGridLinesColor: "black",
        focusedCellBorderColor: "black",

        selectionBackgroundColor: "#f9d4c7",
        selectionBorderColor: "#e95420",
        selectedHeaderTextColor: "white",
        selectedHeaderBackgroundColor: "#e95420",

        dateCellMomentFormat: "L",
        timeCellMomentFormat: "LT",
        dateTimeCellMomentFormat: "L LT",
        textMargin: 2,
        getCellTextWrap: undefined,
        getCellFont: undefined,
        font: "12px Liberation Sans",
        getCellTextColor: undefined,
        cellTextColor: "black",
        headerFont: "16px Liberation Sans",
        cellCursor: "default",
        outsideCellCursor: "default",
        rowHoverColor: undefined, // "rgba(250,250,250,0.5)",

        filterDebounceMs: 500,
        filterTextMargin: 3,
        filterIgnoreCase: true,
        filterBackground: "yellow",
        immediateSort: false,        

        recomputeRowHeightDebounceFilterMs: 0,
        rowNumberColWidth: 80,
        colNumberRowHeight: DEFAULT_ROW_HEIGHT,
        cellNumberBackgroundColor: "#f5f6f7",

        verticalScrollbarMode: WSCanvasScrollbarMode.auto,
        horizontalScrollbarMode: WSCanvasScrollbarMode.auto,
        scrollBarThk: 10,
        minScrollHandleLen: 20,
        scrollBarColor: "#878787",
        clickedScrollBarColor: "red",

        containerStyle: undefined,
        canvasStyle: undefined,

        debug: true,
        dbgDiv: undefined,
    } as WSCanvasProps;
}