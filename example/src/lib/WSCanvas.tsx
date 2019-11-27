import React, { useRef, useEffect, useState, useLayoutEffect, CSSProperties } from "react";
import useDebounce, { useElementSize, toColumnName } from "./Utils";
import { WSCanvasProps } from "./WSCanvasProps";
import { WSCanvasEditMode } from "./WSCanvasEditMode";
import { WSCanvasState } from "./WSCanvasState";
import { WSCanvasPropsDefault } from "./WSCanvasPropsDefault";
import { WSCanvasScrollbarMode } from "./WSCanvasScrollbarMode";
import { WSCanvasSelection } from "./WSCanvasSelection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasSelectionRange } from "./WSCanvasSelectionRange";
import { WSCanvasRect, WSCanvasRectMode } from "./WSCanvasRect";
import { WSCanvasCoord } from "./WSCanvasCoord";
import { WSCanvasColumnClickBehavior, WSCanvasSortingRowInfo } from "./WSCanvasColumn";
import { WSCanvasSortDirection } from "./WSCanvasSortDirection";

import moment from "moment";
import 'moment/min/locales';
import * as _ from 'lodash';
import { WSCanvasFilter } from "./WSCanvasFilter";

export interface ViewMap {
    viewToReal: number[];
    realToView: number[];
}

export function WSCanvas(props: WSCanvasProps) {
    useEffect(() => {
        const lang = navigator.language;
        moment.locale(lang);
    }, [navigator.language]);

    const {
        api,

        width,
        height,
        rowsCount,
        colsCount,
        colWidth,
        colWidthExpand,
        rowHeight,
        frozenRowsCount,
        frozenColsCount,
        selectionModeMulti,
        selectionMode,
        selectFocusedCellOrRow,
        showFocusedCellOutline,
        showRowNumber,
        highlightRowNumber,
        showColNumber,
        highlightColNumber,
        columnClickBehavior,
        showFilter,
        showPartialColumns,
        preventWheelOnBounds,

        getCellData,
        setCellData,
        getCellCustomEdit,
        getColumnHeader,
        getColumnLessThanOp,
        getCellType,
        isCellReadonly,
        columnInitialSort,
        getCellTextAlign,

        getCellBackgroundColor,
        sheetBackgroundColor,
        gridLinesColor,
        frozenCellGridLinesColor,
        focusedCellBorderColor,

        selectionBackgroundColor,
        selectionBorderColor,
        selectedHeaderTextColor,
        selectedHeaderBackgroundColor,

        dateCellMomentFormat,
        timeCellMomentFormat,
        dateTimeCellMomentFormat,
        getCellTextWrap,
        textMargin,
        getCellFont,
        font,
        getCellTextColor,
        cellTextColor,
        headerFont,
        cellCursor,
        outsideCellCursor,
        rowHoverColor,

        filterDebounceMs,
        filterTextMargin,
        filterIgnoreCase,
        filterBackground,

        recomputeRowHeightDebounceFilterMs,
        rowNumberColWidth,
        colNumberRowHeight,
        cellNumberBackgroundColor,

        verticalScrollbarMode,
        horizontalScrollbarMode,
        scrollBarThk,
        minScrollHandleLen,
        scrollBarColor,
        clickedScrollBarColor,

        containerStyle,
        canvasStyle,

        debug
    } = props;

    //#region STATE AND INIT

    const containerRef = useRef<HTMLDivElement>(null);
    const debugRef = useRef<HTMLDivElement>(null);
    const canvasDivRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const debugSize = useElementSize(debugRef);

    const [stateNfo, setStateNfo] = useState<WSCanvasState>(new WSCanvasState());
    const [dbgNfo, setDbgNfo] = useState<string>("");

    const [children, setChildren] = useState<JSX.Element[]>([]);
    const [filterChildren, setFilterChildren] = useState<JSX.Element[]>([]);
    const [viewMap, setViewMap] = useState<ViewMap | null>(null);
    const [overridenRowHeight, setOverridenRowHeight] = useState<number[] | null>(null);
    const debouncedFilter = useDebounce(stateNfo.filtersTrack, filterDebounceMs);
    const debouncedColumnWidth = useDebounce(stateNfo.columnWidthOverrideTrack, recomputeRowHeightDebounceFilterMs);

    const colNumberRowHeightFull = () => colNumberRowHeight + (showFilter ? rowHeight(-1) : 0);

    const minH = (showColNumber ? colNumberRowHeightFull() : 0) + rowsCount * (rowHeight(-1) + 1) + scrollBarThk + 10;

    let margin_padding_W = 0;
    let margin_padding_H = 0;

    if (canvasDivRef.current) {
        const csty = getComputedStyle(canvasDivRef.current);

        const marginLeft = csty.marginLeft ? parseFloat(csty.marginLeft) : 0;
        const marginRight = csty.marginRight ? parseFloat(csty.marginRight) : 0;
        const marginTop = csty.marginTop ? parseFloat(csty.marginTop) : 0;
        const marginBottom = csty.marginBottom ? parseFloat(csty.marginBottom) : 0;

        const paddingLeft = csty.paddingLeft ? parseFloat(csty.paddingLeft) : 0;
        const paddingRight = csty.paddingRight ? parseFloat(csty.paddingRight) : 0;
        const paddingTop = csty.paddingTop ? parseFloat(csty.paddingTop) : 0;
        const paddingBottom = csty.paddingBottom ? parseFloat(csty.paddingBottom) : 0;

        margin_padding_W += (marginLeft + marginRight + paddingLeft + paddingRight);
        margin_padding_H += (marginTop + marginBottom + paddingTop + paddingBottom);
    }

    let W = width - margin_padding_W;
    let H = Math.min(height - debugSize.height - margin_padding_H, minH);

    const viewRowToRealRow = (vm: ViewMap | null, viewRow: number) => {
        if (vm === null)
            return viewRow;
        else
            return vm.viewToReal[viewRow];
    }

    const viewColToRealCol = (vm: ViewMap | null, viewCol: number) => viewCol; // not yet impemented (eg. column order)

    const realRowToViewRow = (vm: ViewMap | null, row: number) => {
        if (vm === null)
            return row;
        else
            return vm.realToView[row];
    }

    const realColToViewCol = (vm: ViewMap | null, col: number) => col; // not yet implemented (eg. column order)

    const viewCellToReal = (vm: ViewMap | null, viewCell: WSCanvasCellCoord) =>
        new WSCanvasCellCoord(viewRowToRealRow(vm, viewCell.row), viewColToRealCol(vm, viewCell.col));

    const realCellToView = (vm: ViewMap | null, cell: WSCanvasCellCoord) =>
        new WSCanvasCellCoord(realRowToViewRow(vm, cell.row), realColToViewCol(vm, cell.col));

    const computeViewRows = (state: WSCanvasState, vm: ViewMap | null, withHorizontalScrollbar: boolean) => {
        const h = H - (showColNumber ? (colNumberRowHeightFull() + 1) : 0) - 2;
        const hAvailOrig = h - (withHorizontalScrollbar ? scrollBarThk : 0);
        if (overridenRowHeight) {
            let hAvail = hAvailOrig;
            let rCnt = 0;
            let viewRowIdx = state.viewScrollOffset.row;
            while (hAvail > 0) {
                rCnt++;
                const ri = viewRowToRealRow(vm, viewRowIdx);
                const rh = overridenRowHeight[ri];
                hAvail -= rh;
                ++viewRowIdx;
            }
            return rCnt - 1;
        }
        return Math.floor(hAvailOrig / (rowHeight(-1) + 1)); // initial compute
    };

    /** (NO side effects on state) */
    const overridenColWidth = (state: WSCanvasState, cidx: number) => {
        const q = state.columnWidthOverride.get(cidx);
        if (q)
            return q;
        else
            return colWidth(cidx);
    }

    const computeViewCols = (state: WSCanvasState, withVerticalScrollbar: boolean) => {
        let q = 0;
        {
            const ww = W - (showRowNumber ? (rowNumberColWidth + 1) : 0) - (withVerticalScrollbar ? scrollBarThk : 0);
            let w = 0;
            for (let cidx = 0; cidx < frozenColsCount; ++cidx) {
                w += overridenColWidth(state, cidx) + 1;
                if (w > ww) break;
                ++q;
            }
            for (let cidx = frozenColsCount + state.viewScrollOffset.col; cidx < colsCount; ++cidx) {
                w += overridenColWidth(state, cidx) + 1;
                if (w > ww) break;
                ++q;
            }
        }
        return q;
    };

    const filteredSortedRowsCount = () => (viewMap === null) ? rowsCount : viewMap.viewToReal.length;

    const verticalScrollbarActive =
        verticalScrollbarMode === WSCanvasScrollbarMode.on ||
        (verticalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewRows(stateNfo, viewMap, false) < filteredSortedRowsCount());

    const horizontalScrollbarActive =
        horizontalScrollbarMode === WSCanvasScrollbarMode.on ||
        (horizontalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewCols(stateNfo, false) < colsCount);

    const viewRowsCount = computeViewRows(stateNfo, viewMap, horizontalScrollbarActive);
    const viewColsCount = computeViewCols(stateNfo, verticalScrollbarActive);

    const buildInverseView = (map: number[]) => {
        const res = new Array<number>(rowsCount);
        for (let i = 0; i < map.length; ++i) {
            const ri = map[i];
            res[ri] = i;
        }
        return res;
    }

    const filterAndSort = (state: WSCanvasState, vm: ViewMap) => {
        //
        // FILTER
        //
        const filteredToReal: number[] = [];
        {
            if (rowsCount > 0) {
                if (stateNfo.filters) {
                    for (let ri = 0; ri < rowsCount; ++ri) {
                        let matching = true;
                        for (let fi = 0; fi < stateNfo.filters.length; ++fi) {
                            const { colIdx, filter } = stateNfo.filters[fi];
                            const data = getCellData(new WSCanvasCellCoord(ri, colIdx));

                            const F = filterIgnoreCase ? String(filter).toLowerCase() : String(filter);
                            const S = filterIgnoreCase ? String(data).toLowerCase() : String(data);

                            if (S.indexOf(F) === -1) {
                                matching = false;
                                break;
                            }
                        }
                        if (matching) {
                            filteredToReal.push(ri);
                        }
                    }
                } else {
                    for (let ri = 0; ri < rowsCount; ++ri) filteredToReal.push(ri);
                }
            }
        }

        //
        // SORT
        //
        if (state.columnsSort.length === 0) {
            vm.viewToReal = filteredToReal;
            vm.realToView = buildInverseView(filteredToReal);
        } else {
            const filteredSortedToReal = new Array<number>(filteredToReal.length);

            const orderedColumnSort = _.orderBy(state.columnsSort, (x) => x.sortOrder, "desc");

            for (let si = 0; si < orderedColumnSort.length; ++si) {
                const columnSort = orderedColumnSort[si];
                const columnType = getCellType ? getCellType(new WSCanvasCellCoord(0, columnSort.columnIndex), null) : "text";
                let predefinedLessThanOp: (a: any, b: any) => boolean = (a, b) => true;
                switch (columnType) {
                    case "date":
                    case "time":
                    case "datetime":
                    case "boolean":
                        predefinedLessThanOp = (a, b) => (a < b);
                        break;
                    default:
                        predefinedLessThanOp = (a, b) => String(a).localeCompare(String(b)) < 0;
                        break;
                }
                let lessThanOp = getColumnLessThanOp ? getColumnLessThanOp(columnSort.columnIndex) : predefinedLessThanOp;
                if (lessThanOp === undefined) lessThanOp = predefinedLessThanOp;

                let colData: WSCanvasSortingRowInfo[] = [];
                for (let fsri = 0; fsri < filteredSortedToReal.length; ++fsri) {
                    if (si > 0)
                        colData.push({
                            ri: filteredSortedToReal[fsri],
                            cellData: getCellData(new WSCanvasCellCoord(filteredSortedToReal[fsri], columnSort.columnIndex))
                        }); else colData.push({
                            ri: filteredToReal[fsri],
                            cellData: getCellData(new WSCanvasCellCoord(filteredToReal[fsri], columnSort.columnIndex))
                        });
                }

                colData.sort((a, b) => {
                    const valA = a.cellData;
                    const valB = b.cellData;
                    let ascRes = -1;
                    ascRes = lessThanOp(valA, valB) ? -1 : 1;

                    if (columnSort.sortDirection === WSCanvasSortDirection.Descending)
                        return -ascRes;
                    else
                        return ascRes;
                });

                for (let fsri = 0; fsri < filteredSortedToReal.length; ++fsri) {
                    filteredSortedToReal[fsri] = colData[fsri].ri;
                }
            }

            vm.viewToReal = filteredSortedToReal;
            vm.realToView = buildInverseView(filteredSortedToReal);
        }
    }

    if (!stateNfo.initialized) {
        if (columnInitialSort && rowsCount > 0) {
            const state = stateNfo.dup();
            state.columnsSort = columnInitialSort.filter(w => w.sortDirection !== undefined && w.sortDirection !== WSCanvasSortDirection.None);
            state.initialized = true;

            const vm = {} as ViewMap;
            filterAndSort(state, vm);
            setViewMap(vm);

            setStateNfo(state);
        }
    }

    //#endregion    

    useEffect(() => {
        const state = stateNfo.dup();
        setStateNfo(state);
    }, [rowsCount]);

    /** [-2,0] not on screen ; -1:(row col number); [ci,cwidth] is the result */
    const xGetCol = (state: WSCanvasState, x: number, allowPartialCol: boolean = false) => {
        if (showRowNumber && x >= 1 && x <= 1 + rowNumberColWidth) return [-1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);

        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (x >= _x && x < _x + cWidth) return [ci, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + stateNfo.viewScrollOffset.col + viewColsCount;
        if (allowPartialCol && lastColView < colsCount) lastColView++;

        for (let ci = frozenColsCount + stateNfo.viewScrollOffset.col; ci < lastColView; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (x >= _x && x < _x + cWidth) return [ci, cWidth];
            _x += cWidth;
        }

        return [-2, 0];
    }

    /** [-2,0] not on screen
     * (NO side effects on state) */
    const colGetXWidth = (state: WSCanvasState, qci: number, allowPartialCol: boolean = false) => {
        if (qci === -1) return [1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);
        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (ci === qci) return [_x, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + stateNfo.viewScrollOffset.col + viewColsCount;
        if (allowPartialCol && lastColView < colsCount) lastColView++;

        for (let ci = frozenColsCount + stateNfo.viewScrollOffset.col; ci < lastColView; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (ci === qci) return [_x, cWidth];
            _x += cWidth;
        }
        return [-2, 0];
    }

    const recomputeOverridenRowHeight = () => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext("2d");

            if (ctx) {
                const hs: number[] = [];
                for (let ri = 0; ri < rowsCount; ++ri) {
                    let rh = rowHeight(-1);

                    if (ctx && getCellTextWrap) {
                        for (let ci = 0; ci < colsCount; ++ci) {
                            const cell = new WSCanvasCellCoord(ri, ci);
                            const colXWidth = colGetXWidth(stateNfo, ci, showPartialColumns);
                            const colW = colXWidth[1];
                            if (colW > 0) {
                                if (getCellTextWrap(cell, props)) {
                                    const data = getCellData(cell);
                                    const txtWidth = ctx.measureText(data).width;
                                    rh *= Math.ceil(txtWidth / colW);
                                }
                            }
                        }
                    }

                    hs.push(rh);
                }
                setOverridenRowHeight(hs);
            }
        }
    }

    useEffect(() => {
        if (stateNfo.initialized) {
            if (overridenRowHeight === null && rowsCount > 0 && canvasRef.current && canvasRef.current.getContext('2d')) {
                recomputeOverridenRowHeight();
            }
        }
    }, [stateNfo.initialized]);

    const getRowHeight = (ri: number) => {
        if (overridenRowHeight !== null) {
            if (ri < 0) return rowHeight(-1);
            return overridenRowHeight[ri];
        }
        else
            return rowHeight(ri);
    }

    const canvasToViewRow = (state: WSCanvasState, ccoord: WSCanvasCoord) => {
        const py = ccoord.y;

        // on data cells
        {
            let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
            for (let ri = state.viewScrollOffset.row; ri < state.viewScrollOffset.row + viewRowsCount; ++ri) {
                if (ri >= filteredSortedRowsCount()) break;
                if (py >= y && py < y + getRowHeight(ri)) return ri;

                y += getRowHeight(ri) + 1;
            }

            return -2;
        }
    }

    // const canvasToViewCell = (state: WSCanvasState, ccoord: WSCanvasCoord, allowPartialCol: boolean = false) =>
    // new 

    const canvasToCellCoord = (state: WSCanvasState, vm: ViewMap | null, ccoord: WSCanvasCoord, allowPartialCol: boolean = false) => {
        const px = ccoord.x;
        const py = ccoord.y;

        const ci = xGetCol(state, ccoord.x, allowPartialCol);

        // on column headers
        if (showColNumber && py >= 0 && py <= 2 + colNumberRowHeightFull()) {
            // on left-top corner cell
            if (ci[0] === -1) return new WSCanvasCellCoord(-1, -1);

            if (ci[0] !== -2) return new WSCanvasCellCoord(-1, ci[0], showFilter && py > 1 + colNumberRowHeight);

            return null;
        }

        // on row headers
        if (showRowNumber && ci[0] === -1) {
            let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
            for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + viewRowsCount; ++vri) {
                if (vri >= filteredSortedRowsCount()) break;

                if (py >= y && py < y + getRowHeight(vri))
                    return new WSCanvasCellCoord(viewRowToRealRow(vm, vri), -1);

                const ri = viewRowToRealRow(vm, vri);
                const rh = getRowHeight(ri);

                y += rh + 1;
            }
            return null;
        }

        // on data cells
        {
            if (ci[0] !== -2) {
                let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
                for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + viewRowsCount; ++vri) {
                    if (vri >= filteredSortedRowsCount()) break;

                    const ri = viewRowToRealRow(vm, vri);
                    const rh = getRowHeight(ri);

                    if (py >= y && py < y + rh) {
                        return new WSCanvasCellCoord(viewRowToRealRow(vm, vri), viewColToRealCol(vm, ci[0]));
                    }

                    y += getRowHeight(ri) + 1;
                }
            }

            return null;
        }
    }

    /** (NO side effects on state) */
    const cellToCanvasCoord = (state: WSCanvasState, cell: WSCanvasCellCoord, allowPartialCol: boolean = false) => {
        const colXW = colGetXWidth(state, cell.col, allowPartialCol);
        if (cell.filterRow) return new WSCanvasCoord(colXW[0], colNumberRowHeight + filterTextMargin, colXW[1]);

        let y = 1;
        for (let ri = state.viewScrollOffset.row; ri < state.viewScrollOffset.row + viewRowsCount; ++ri) {
            if (ri >= filteredSortedRowsCount()) break;

            if (ri === cell.row) {
                let resy = y + (showColNumber ? colNumberRowHeightFull() : 0);

                return new WSCanvasCoord(colXW[0], resy, colXW[1]);
            }

            y += getRowHeight(ri) + 1;
        }
        return null;
    }

    const formatCellDataAsDate = (cellData: any) => moment(cellData as Date).format(dateCellMomentFormat);
    const formatCellDataAsTime = (cellData: any) => moment(cellData as Date).format(timeCellMomentFormat);
    const formatCellDataAsDateTime = (cellData: any) => moment(cellData as Date).format(dateTimeCellMomentFormat);

    /** (NO side effects on state/vm) */
    const redrawCellInternal = (state: WSCanvasState, vm: ViewMap | null, viewCell: WSCanvasCellCoord, ctx: CanvasRenderingContext2D, cWidth: number, x: number, y: number) => {
        const cell = viewCellToReal(vm, viewCell)!;
        const isSelected = (
            ((selectFocusedCellOrRow && state.selection.ranges.length === 1) || state.selection.ranges.length > 1) ||
            (state.selection.ranges.length === 1 && !state.selection.ranges[0].from.equals(state.selection.ranges[0].to))
        ) &&
            state.selection.containsCell(cell, selectionMode);

        // https://usefulangle.com/post/17/html5-canvas-drawing-1px-crisp-straight-lines
        const x_ = x - 0.5;
        const y_ = y + 0.5;

        let cellBackground = sheetBackgroundColor;
        if (state.hoveredViewRow === viewCell.row && rowHoverColor) {
            cellBackground = rowHoverColor;
        } else if (getCellBackgroundColor !== undefined) {
            const q = getCellBackgroundColor(cell, props);
            if (q) cellBackground = q;
        }
        ctx.fillStyle = isSelected ? selectionBackgroundColor : cellBackground;
        if (overridenRowHeight) {
            ctx.fillRect(x, y, cWidth, overridenRowHeight[cell.row]);
        }

        if (isSelected) {
            const leftBorder = cell.col === 0 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row, cell.col - 1), selectionMode);
            const rightBorder = cell.col === colsCount - 1 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row, cell.col + 1), selectionMode);
            const topBorder = cell.row === 0 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row - 1, cell.col), selectionMode);
            const bottomBorder = cell.row === filteredSortedRowsCount() - 1 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row + 1, cell.col), selectionMode);

            if (leftBorder || rightBorder || topBorder || bottomBorder) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.strokeStyle = selectionBorderColor;

                if (leftBorder) {
                    ctx.moveTo(x_, y_);
                    ctx.lineTo(x_, y_ + getRowHeight(cell.row));
                    ctx.stroke();
                }

                if (rightBorder) {
                    ctx.moveTo(x_ + cWidth + 1, y_ - 1);
                    ctx.lineTo(x_ + cWidth + 1, y_ + getRowHeight(cell.row));
                    ctx.stroke();
                }

                if (topBorder) {
                    ctx.moveTo(x_, y_ - 1);
                    ctx.lineTo(x_ + cWidth - 1, y_ - 1);
                    ctx.stroke();
                }

                if (bottomBorder) {
                    ctx.moveTo(x_, y_ + getRowHeight(cell.row));
                    ctx.lineTo(x_ + cWidth - 1, y_ + getRowHeight(cell.row));
                    ctx.stroke();
                }
            }
        }

        let cellFont = font;
        if (getCellFont !== undefined) {
            const q = getCellFont(cell, props);
            if (q) cellFont = q;
        }
        ctx.font = cellFont;

        let cellColor = cellTextColor;
        if (getCellTextColor !== undefined) {
            const q = getCellTextColor(cell, props);
            if (q) cellColor = q;
        }
        ctx.fillStyle = cellColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        let cellData = getCellData(cell);
        const RSINGLE = getRowHeight(-1);
        const RH = getRowHeight(cell.row);
        let posX = x + textMargin;
        let posY = y + RH / 2 - textMargin / 2 + 2;

        let str = "";
        const _cellType = getCellType ? getCellType(cell, cellData) : undefined;
        if (_cellType === undefined)
            str = String(cellData);
        else {
            const cellType = getCellType ? _cellType : "text";
            switch (cellType) {
                case "boolean":
                    const val = cellData as boolean;
                    if (val === true) str = "\u25FC"; // https://www.rapidtables.com/code/text/unicode-characters.html                                        
                    ctx.textAlign = "center";
                    break;
                case "date":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = cellData ? formatCellDataAsDate(cellData) : "";
                    break;
                case "time":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = cellData ? formatCellDataAsTime(cellData) : "";
                    break;
                case "datetime":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = cellData ? formatCellDataAsDateTime(cellData) : "";
                    break;
                case "number":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = Number(cellData).toLocaleString(navigator.language);
                    ctx.textAlign = "right";
                    break;
                case "text":
                    str = cellData;
                    break;
            }
        }

        if (getCellTextAlign) {
            const q = getCellTextAlign(cell, cellData);
            if (q) {
                ctx.textAlign = q;
            }
        }

        switch (ctx.textAlign) {
            case "left":
            case "start":
                posX = x + textMargin;
                break;

            case "center":
                posX = x + textMargin + cWidth / 2;
                break;

            case "right":
            case "end":
                posX = x + cWidth - textMargin;
                break;

            default:
                posX = x + textMargin;
                break;
        }

        const textWrap = getCellTextWrap && getCellTextWrap(cell, props);
        if (textWrap && RH > RSINGLE) {
            ctx.textBaseline = "bottom";

            //posY = y + getRowHeight(viewCell.row) / 2 - textMargin / 2 + 2;   
            posY = y + textMargin + 2 + RSINGLE / 2;

            var words = str.split(' ');
            let wc = words.length;
            const maxLineW = cWidth - 2 * textMargin;

            let line = "";
            for (let i = 0; i < wc; ++i) {
                const appendline = (i > 0 ? (" " + words[i]) : words[i]);
                const w = ctx.measureText(line + appendline).width;
                if (w > maxLineW) {
                    ctx.fillText(line, posX, posY);
                    posY += getRowHeight(-1);
                    line = words[i];
                } else {
                    line += appendline;
                }
            }
            if (line.length > 0) {
                ctx.fillText(line, posX, posY);
            }
        }
        else
            ctx.fillText(str, posX, posY);

        if (showFocusedCellOutline && state.focusedCell.row === cell.row && state.focusedCell.col === cell.col) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = focusedCellBorderColor;
            ctx.rect(x, y, cWidth, getRowHeight(cell.row));
            ctx.stroke();
        }
    }

    /** side effect on state ; NO side effect on vm */
    const confirmCustomEdit = (state: WSCanvasState, vm: ViewMap | null) => {
        if (state.customEditCell !== null) {
            setCellData(viewCellToReal(vm, state.customEditCell), state.customEditValue);
            closeCustomEdit(state);
        }
    }

    const closeCustomEdit = (state: WSCanvasState) => {
        if (stateNfo.customEditCell !== null) {
            state.customEditCell = null;
            state.editMode = WSCanvasEditMode.none;
        }
        if (canvasRef.current) {
            canvasRef.current.focus();
        }
    }

    const horizontalScrollHanleLen = () => Math.max(minScrollHandleLen, (W - scrollBarThk) / colsCount * viewColsCount);
    const verticalScrollHandleLen = (state: WSCanvasState) => Math.max(minScrollHandleLen, (H - scrollBarThk) / filteredSortedRowsCount() * viewRowsCount);

    /** @returns true if side effects on state */
    const paintHorizontalScrollbar = (state: WSCanvasState, ctx: CanvasRenderingContext2D, factor: number) => {
        let stateChanged = false;
        ctx.lineWidth = 1;

        const scrollHandleLen = horizontalScrollHanleLen();
        const scrollPos = factor * (W - scrollBarThk - scrollHandleLen - 4);

        {
            const W_ = W - 4 - scrollBarThk;
            const Y_ = H - 2 - scrollBarThk;
            ctx.fillStyle = gridLinesColor;
            const newHorizontalScrollBarRect = new WSCanvasRect(new WSCanvasCoord(1, Y_), new WSCanvasCoord(W_ + 1, scrollBarThk), WSCanvasRectMode.pointAndSize);
            if (state.horizontalScrollBarRect === null || !newHorizontalScrollBarRect.equals(state.horizontalScrollBarRect)) {
                state.horizontalScrollBarRect = newHorizontalScrollBarRect;
                stateChanged = true;
            }

            const r = state.horizontalScrollBarRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);

            ctx.fillStyle = cellNumberBackgroundColor;
            ctx.fillRect(W_ + 1, Y_, W - (W_ + 2), scrollBarThk);
        }

        {
            const scrollBarLeftTop = new WSCanvasCoord(scrollPos, H - scrollBarThk - 2);
            const scrollBarSize = new WSCanvasCoord(scrollHandleLen - 1, scrollBarThk - 1);
            const newHorizontalScrollHandleRect = new WSCanvasRect(scrollBarLeftTop, scrollBarSize, WSCanvasRectMode.pointAndSize);
            if (state.horizontalScrollHandleRect === null || !newHorizontalScrollHandleRect.equals(state.horizontalScrollHandleRect)) {
                state.horizontalScrollHandleRect = newHorizontalScrollHandleRect;
                stateChanged = true;
            }

            ctx.fillStyle = (state.horizontalScrollClickStartCoord !== null) ? clickedScrollBarColor : scrollBarColor;
            const r = state.horizontalScrollHandleRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }

        return stateChanged;
    }

    /** @returns true if side effects on state */
    const paintVerticalScrollbar = (state: WSCanvasState, ctx: CanvasRenderingContext2D, factor: number) => {
        let stateChanged = false;
        ctx.lineWidth = 1;

        const scrollHandleLen = verticalScrollHandleLen(state);
        const scrollPos = factor * (H - scrollBarThk - scrollHandleLen - 3);

        {
            const H_ = H - 3 - scrollBarThk;
            const X_ = W - 2 - scrollBarThk;
            ctx.fillStyle = gridLinesColor;
            const newVerticalScrollBarRect = new WSCanvasRect(new WSCanvasCoord(X_, 0), new WSCanvasCoord(scrollBarThk, H_ + 1), WSCanvasRectMode.pointAndSize);
            if (state.verticalScrollBarRect === null || !newVerticalScrollBarRect.equals(state.verticalScrollBarRect)) {
                state.verticalScrollBarRect = newVerticalScrollBarRect;
                stateChanged = true;
            }
            const r = state.verticalScrollBarRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }

        {
            const scrollBarHandleLeftTop = new WSCanvasCoord(W - scrollBarThk - 2, scrollPos);
            const scrollBarSize = new WSCanvasCoord(scrollBarThk - 1, scrollHandleLen - 1);
            const newVerticalScrollHandleRect = new WSCanvasRect(scrollBarHandleLeftTop, scrollBarSize, WSCanvasRectMode.pointAndSize);
            if (state.verticalScrollHandleRect === null || !newVerticalScrollHandleRect.equals(state.verticalScrollHandleRect)) {
                state.verticalScrollHandleRect = newVerticalScrollHandleRect;
                stateChanged = true;
            }

            ctx.fillStyle = (state.verticalScrollClickStartCoord !== null) ? clickedScrollBarColor : scrollBarColor;
            const r = state.verticalScrollHandleRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }

        return stateChanged;
    }

    const cleanupScrollClick = (state: WSCanvasState) => {
        if (stateNfo.verticalScrollClickStartCoord !== null || stateNfo.horizontalScrollClickStartCoord !== null) {
            state.verticalScrollClickStartCoord = null;
            state.horizontalScrollClickStartCoord = null;
        }
    }

    /** side effect on state ; NO side effect on vm */
    const rectifyScrollOffset = (state: WSCanvasState, vm: ViewMap | null) => {
        scrollTo(state, vm, state.focusedCell);
    }

    const clearSelection = (state: WSCanvasState) => {
        state.selection.clearSelection();
    }

    const setSelectionByEndingCell = (state: WSCanvasState, cell: WSCanvasCellCoord, endingCell: boolean = false, clearPreviousSel: boolean = true) => {
        state.selection = (selectionModeMulti && endingCell) ?
            state.selection.extendsTo(cell) :
            (!selectionModeMulti || clearPreviousSel) ?
                new WSCanvasSelection([new WSCanvasSelectionRange(cell, cell)]) :
                state.selection.add(cell);
    }

    const openCellCustomEdit = (state: WSCanvasState) => {
        if (canvasRef.current) {
            const xy = cellToCanvasCoord(state, state.focusedCell);
            const cell = state.focusedCell;
            if (isCellReadonly && isCellReadonly(cell)) return;

            if (xy) {
                state.customEditCell = cell;
                let cellVal = getCellData(cell);
                if (getCellType) {
                    const cellType = getCellType(cell, cellVal);
                    switch (cellType) {
                        case "date":
                            cellVal = formatCellDataAsDate(cellVal);
                            break;

                        case "time":
                            cellVal = formatCellDataAsTime(cellVal);
                            break;

                        case "datetime":
                            cellVal = formatCellDataAsDateTime(cellVal);
                            break;
                    }
                }
                state.customEditValue = cellVal;
                state.editMode = WSCanvasEditMode.F2;
            }
        }
    }

    const postEditFormat = (state: WSCanvasState) => {
        if (getCellType) {
            const cellData = getCellData(state.focusedCell);
            const cellType = getCellType(state.focusedCell, cellData);

            switch (cellType) {
                case "date":
                    setCellData(state.focusedCell, moment(cellData, dateCellMomentFormat));
                    break;
                case "time":
                    setCellData(state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
                case "datetime":
                    setCellData(state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
            }
        }
    }

    /** side effect on state ; NO side effect on vm */
    const focusCell = (state: WSCanvasState, vm: ViewMap | null, cell: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearPreviousSel?: boolean) => {
        if (canvasRef.current) canvasRef.current.focus();
        setSelectionByEndingCell(state, cell, endingCell, clearPreviousSel);

        state.focusedCell = cell;
        confirmCustomEdit(state, vm);
        state.editMode = WSCanvasEditMode.none;

        if (scrollTo === true) rectifyScrollOffset(state, vm);
    }

    /** side effect on state ; NO side effect on vm */
    const scrollTo = (state: WSCanvasState, vm: ViewMap | null, cell: WSCanvasCellCoord) => {
        const viewCell = realCellToView(vm, cell);

        // adjust scrollOffset.row
        if (viewCell.row >= state.viewScrollOffset.row + viewRowsCount) {
            state.viewScrollOffset = state.viewScrollOffset.setRow(viewCell.row - viewRowsCount + 1);
        }
        else if (viewCell.row - frozenRowsCount <= state.viewScrollOffset.row) {
            state.viewScrollOffset = state.viewScrollOffset.setRow(Math.max(0, viewCell.row - frozenRowsCount));
        }

        // adjust scrollOffset.col
        if (viewCell.col >= state.viewScrollOffset.col + viewColsCount - 1) {
            state.viewScrollOffset = state.viewScrollOffset.setCol(viewCell.col - viewColsCount + 1);
        }
        else if (viewCell.col - frozenColsCount <= state.viewScrollOffset.col) {
            state.viewScrollOffset = state.viewScrollOffset.setCol(Math.max(0, viewCell.col - frozenColsCount));
        }
    }

    const evalClickStart = (state: WSCanvasState, ccoord: WSCanvasCoord) => {
        const onVerticalScrollBar = state.verticalScrollBarRect && state.verticalScrollBarRect.contains(ccoord);
        const onHorizontalScrollBar = state.horizontalScrollBarRect && state.horizontalScrollBarRect.contains(ccoord);
        const SCROLL_FACTOR_TOL = 50;

        if (stateNfo.resizingCol !== -2) {
            return true;
        } else if (onVerticalScrollBar) {
            const onVerticalScrollHandle = state.verticalScrollHandleRect && state.verticalScrollHandleRect.contains(ccoord);
            if (onVerticalScrollHandle) {
                if (state.verticalScrollClickStartCoord === null) {
                    state.verticalScrollClickStartFactor = (state.viewScrollOffset.row + frozenRowsCount) / (filteredSortedRowsCount() - viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }
            } else if (state.verticalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.y / (state.verticalScrollBarRect.height - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.verticalScrollClickStartFactor = factor;
                state.verticalScrollClickStartCoord = ccoord;

                const newRowScrollOffset = Math.max(0, Math.trunc((filteredSortedRowsCount() - viewRowsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setRow(newRowScrollOffset);
            }
            return true;
        } else if (onHorizontalScrollBar) {
            const onHorizontalScrollHandle = state.horizontalScrollHandleRect && state.horizontalScrollHandleRect.contains(ccoord);

            if (onHorizontalScrollHandle) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = (state.viewScrollOffset.col + frozenColsCount) / (colsCount - viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }
            } else if (state.horizontalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.x / (state.horizontalScrollBarRect.width - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.horizontalScrollClickStartFactor = factor;
                state.horizontalScrollClickStartCoord = ccoord;

                const newColScrollOffset = Math.max(0, Math.trunc((colsCount - viewColsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setCol(newColScrollOffset);
            }
            return true;
        }

        return false;
    }

    const evalVerticalScrollMove = (state: WSCanvasState, yClickStart: number, y: number) => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const factoryStart = state.verticalScrollClickStartFactor;
            const deltay = y - yClickStart;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                const factor = Math.min(1, Math.max(0, factoryStart + (deltay / (H - scrollBarThk - verticalScrollHandleLen(state) - 1))));
                const newRowScrollOffset = Math.max(0, Math.trunc((filteredSortedRowsCount() - viewRowsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setRow(newRowScrollOffset);
            }
        }
    }

    const evalHorizontalScrollMove = (state: WSCanvasState, xClickStart: number, x: number) => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const factorxStart = state.horizontalScrollClickStartFactor;
            const deltax = x - xClickStart;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                const factor = Math.min(1, Math.max(0, factorxStart + (deltax / (W - scrollBarThk - horizontalScrollHanleLen() - 1))));

                const newColScrollOffset = Math.max(0, Math.trunc((colsCount - viewColsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setCol(newColScrollOffset);
            }
        }
    }

    /** (NO side effects on state) */
    const computeIsOverCell = (state: WSCanvasState, x: number, y: number) => {
        return x >= state.tableCellsBBox.leftTop.x && x <= state.tableCellsBBox.rightBottom.x &&
            y >= state.tableCellsBBox.leftTop.y && y <= state.tableCellsBBox.rightBottom.y;
    }

    useEffect(() => {
        paint(stateNfo, viewMap);
    }, [width, height, stateNfo, viewMap, debugSize, getCellData, setCellData]);

    //#region APPLY FILTER 
    useEffect(() => {
        const vm = {} as ViewMap;
        const state = stateNfo.dup();
        if (stateNfo.initialized) {
            filterAndSort(state, vm);

            if (viewMap) {
                const viewRowToFocus = vm.viewToReal[0];
                const q = viewCellToReal(vm, new WSCanvasCellCoord(0, viewColToRealCol(vm, state.focusedFilterColIdx)));
                focusCell(state, vm, q, true, false, true);
                rectifyScrollOffset(state, vm);
            }

            setViewMap(vm);
            setStateNfo(state);
        }
    }, [debouncedFilter]);
    //#endregion

    //#region RECOMPUTE ROW HEIGHT when COLUMN WIDTH changes
    useEffect(() => {
        if (overridenRowHeight !== null && canvasRef.current && canvasRef.current.getContext('2d')) {
            recomputeOverridenRowHeight();
        }
    }, [debouncedColumnWidth]);
    //#endregion

    const paint = (state: WSCanvasState, vm: ViewMap | null) => {
        let stateChanged = false;
        ++state.paintcnt;

        const colwavail = W - (verticalScrollbarActive ? scrollBarThk : 0) - rowNumberColWidth - 2;
        let colwsumbefore = 0;
        for (let ci = 0; ci < viewColsCount; ++ci) colwsumbefore += colWidth(ci);

        // if (state.paintcnt === 1 && canvasRef.current) canvasRef.current.focus();

        if (state.paintcnt > 1 && colWidthExpand && colwsumbefore > state.colWidthExpanded) {
            let wtofillTotal = colwavail - colwsumbefore;

            if (wtofillTotal > 0) {
                // compute column width weight factor
                const wfact = new Map<number, number>();
                for (let ci = 0; ci < viewColsCount; ++ci) {
                    wfact.set(ci, colWidth(ci) / colwsumbefore);
                }
                // distribute space
                let wtofillUsed = 0;
                for (let ci = 0; ci < viewColsCount; ++ci) {
                    let wtoadd = wtofillTotal * wfact.get(ci)!;
                    if (wtofillUsed + wtoadd > wtofillTotal) wtoadd = wtofillTotal - wtofillUsed;
                    state.columnWidthOverride.set(ci, colWidth(ci) + wtoadd);
                    wtofillUsed += wtoadd;
                }
                state.colWidthExpanded = colwsumbefore;
                stateChanged = true;
            }
        }

        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineWidth = 1;

                let colsXMax = 0;
                let rowsYMax = 0;

                //#region GRID LINE BACKGROUND ( to make grid lines as diff result )
                {
                    const lastViewdCol = colGetXWidth(state, state.viewScrollOffset.col + viewColsCount - 1);
                    colsXMax = lastViewdCol[0] + lastViewdCol[1] + (showRowNumber ? 1 : 0);
                    rowsYMax = (showColNumber ? (colNumberRowHeightFull() + 1) : 0) + 1;
                    for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + viewRowsCount; ++vri)
                        rowsYMax += getRowHeight(viewRowToRealRow(vm, vri)) + 1;

                    const newTableCellsBBox = new WSCanvasRect(new WSCanvasCoord(0, 0), new WSCanvasCoord(colsXMax, rowsYMax));
                    if (!state.tableCellsBBox.equals(newTableCellsBBox)) {
                        state.tableCellsBBox = newTableCellsBBox;
                        stateChanged = true;
                    }

                    ctx.fillStyle = gridLinesColor;
                    ctx.fillRect(0, 0, (showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - viewColsCount) ? W : colsXMax, rowsYMax);
                }
                //#endregion

                let y = 1;
                if (showColNumber) y = colNumberRowHeightFull() + 2;

                //#region DRAW CELLS
                {
                    const drawRows = (riFrom: number, riTo: number) => {
                        for (let vri = riFrom; vri <= riTo; ++vri) {
                            if (vri >= filteredSortedRowsCount()) break;
                            let x = 1;
                            if (showRowNumber) x = rowNumberColWidth + 2;

                            const drawCols = (ciFrom: number, ciTo: number) => {
                                for (let ci = ciFrom; ci <= ciTo; ++ci) {
                                    const cWidth = overridenColWidth(state, ci);

                                    redrawCellInternal(state, vm, new WSCanvasCellCoord(vri, ci), ctx, cWidth, x, y);

                                    x += cWidth + 1;
                                }
                            }

                            drawCols(0, frozenColsCount - 1);
                            drawCols(
                                state.viewScrollOffset.col + frozenColsCount,
                                state.viewScrollOffset.col + viewColsCount - ((showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - viewColsCount) ? 0 : 1));

                            const ri = viewRowToRealRow(vm, vri);
                            const rh = getRowHeight(ri);
                            y += rh + 1;
                        }
                    };

                    drawRows(0, frozenRowsCount - 1);
                    drawRows(state.viewScrollOffset.row + frozenRowsCount, Math.min(filteredSortedRowsCount() - 1, state.viewScrollOffset.row + viewRowsCount - 1));
                }
                //#endregion

                //#region DRAW COLUMN NUMBERS ( optional )
                if (showColNumber) {
                    y = 1;
                    let x = showRowNumber ? (rowNumberColWidth + 2) : 1;
                    const selectedColIdxs = state.selection.colIdxs();

                    const drawColNumber = (ciFrom: number, ciTo: number) => {
                        for (let ci = ciFrom; ci <= ciTo; ++ci) {
                            const cWidth = overridenColWidth(state, ci);

                            const isSelected = highlightColNumber && selectedColIdxs.has(ci);

                            ctx.fillStyle = cellNumberBackgroundColor;
                            ctx.fillRect(x, y, cWidth, colNumberRowHeightFull());

                            ctx.fillStyle = isSelected ? selectedHeaderBackgroundColor : cellNumberBackgroundColor;
                            ctx.fillRect(x, y, cWidth, colNumberRowHeight);

                            ctx.font = isSelected ? "bold " + headerFont : headerFont;
                            ctx.fillStyle = isSelected ? selectedHeaderTextColor : cellTextColor;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            const colHeader = getColumnHeader ? getColumnHeader(ci) : toColumnName(ci + 1);
                            ctx.fillText(colHeader, x + cWidth / 2, y + getRowHeight(-1) / 2 + 2);

                            const qSort = state.columnsSort.find((x) => x.columnIndex === ci);
                            if (qSort) {
                                let colTxt = "";
                                ctx.textAlign = "right";
                                switch (qSort.sortDirection) {
                                    case WSCanvasSortDirection.Ascending: colTxt = "\u25B4"; break;
                                    case WSCanvasSortDirection.Descending: colTxt = "\u25BE"; break;
                                }
                                ctx.fillText(colTxt, x + cWidth - filterTextMargin - 2, y + getRowHeight(-1) / 2 + 2);
                            }

                            if (showFilter) {
                                var r = new WSCanvasRect(
                                    new WSCanvasCoord(x + filterTextMargin, y + colNumberRowHeight + filterTextMargin),
                                    new WSCanvasCoord(cWidth - 2 * filterTextMargin - 1, colNumberRowHeightFull() - colNumberRowHeight - 2 * filterTextMargin - 1),
                                    WSCanvasRectMode.pointAndSize);

                                const q = state.filters.find((x) => x.colIdx === ci);

                                ctx.fillStyle = (q && q.filter) ? filterBackground : sheetBackgroundColor;
                                ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);

                                ctx.beginPath();
                                ctx.lineWidth = 1;
                                ctx.strokeStyle = gridLinesColor;
                                ctx.rect(r.leftTop.x, r.leftTop.y, r.width, r.height);
                                ctx.stroke();

                                if (state.focusedFilterColIdx !== ci) {

                                    if (q) {
                                        ctx.font = font;
                                        ctx.fillStyle = cellTextColor;
                                        ctx.textAlign = "left";
                                        ctx.textBaseline = "bottom";
                                        ctx.fillText(q.filter, r.leftTop.x + 1, colNumberRowHeightFull() - filterTextMargin - 4);
                                    }
                                }
                            }

                            x += cWidth + 1;
                        }
                    };

                    if (showRowNumber) {
                        ctx.fillStyle = cellNumberBackgroundColor;
                        ctx.fillRect(1, 1, x - 2, colNumberRowHeightFull());
                    }
                    if (frozenColsCount > 0) drawColNumber(0, frozenColsCount - 1);
                    drawColNumber(
                        frozenColsCount + state.viewScrollOffset.col,
                        state.viewScrollOffset.col + viewColsCount - ((showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - viewColsCount) ? 0 : 1));
                }
                //#endregion

                //#region DRAW FILTER EDIT
                if (state.focusedFilterColIdx === -1 && filterChildren.length > 0) {
                    setFilterChildren([]);
                }

                if (state.focusedFilterColIdx !== -1) {
                    let qFilter = state.filters.find((x) => x.colIdx === state.focusedFilterColIdx);
                    if (qFilter === undefined) {
                        qFilter = { colIdx: state.focusedFilterColIdx, filter: "" } as WSCanvasFilter;
                        state.filters.push(qFilter);
                        stateChanged = true;
                    }

                    const ccoord = cellToCanvasCoord(state,
                        new WSCanvasCellCoord(0, state.focusedFilterColIdx, true),
                        showPartialColumns);

                    if (ccoord) {
                        let canceling = false;
                        setFilterChildren([
                            <input
                                autoFocus
                                key="filteredit"
                                style={{
                                    font: font,
                                    background: filterBackground,
                                    margin: 0, padding: 0, outline: 0, border: 0,
                                    position: "absolute",
                                    overflow: "hidden",
                                    left: canvasRef.current.offsetLeft + ccoord.x + filterTextMargin + 2,
                                    top: canvasRef.current.offsetTop + ccoord.y + filterTextMargin - 1,
                                    width: overridenColWidth(state, state.focusedFilterColIdx) - 2 * filterTextMargin - 2,
                                    height: getRowHeight(-1) - 2 * filterTextMargin - 2
                                }}
                                value={state.filters.find((x) => x.colIdx === state.focusedFilterColIdx)!.filter || ""}
                                onChange={(e) => {
                                    const state = stateNfo.dup();
                                    const q = state.filters.find((x) => x.colIdx === state.focusedFilterColIdx);
                                    if (q) {
                                        q.filter = e.target.value;
                                    }
                                    state.filtersTrack = JSON.stringify(state.filters);
                                    setStateNfo(state);
                                }}
                                onFocus={(e) => {
                                    if (stateNfo.focusedCell.row !== -1 || stateNfo.focusedCell.col !== -1) {
                                        const state = stateNfo.dup();
                                        state.focusedCell = new WSCanvasCellCoord(-1, -1);
                                        setStateNfo(state);
                                    }
                                    e.target.setSelectionRange(0, e.target.value.length);
                                }}
                                onBlur={(e) => { // workaround                                                                                                            
                                    if (!canceling) e.target.focus();
                                }}
                                onKeyDown={(e) => {
                                    switch (e.key) {
                                        case "ArrowDown":
                                        case "Enter":
                                            {
                                                canceling = true; // workaround

                                                const state = stateNfo.dup();
                                                state.focusedCell = new WSCanvasCellCoord(0, state.focusedFilterColIdx);
                                                state.focusedFilterColIdx = -1;
                                                focusCell(state, vm, state.focusedCell, true, false, true);
                                                if (canvasRef.current) {
                                                    canvasRef.current.focus();
                                                }
                                                setStateNfo(state);
                                            }
                                            break;
                                    }
                                }} />
                        ]);
                    }
                }
                //#endregion               

                //#region DRAW ROW NUMBERS ( optional )
                if (showRowNumber) {
                    let x = 1;
                    y = showColNumber ? (colNumberRowHeightFull() + 2) : 1;
                    const selectedRowIdxs = state.selection.rowIdxs();

                    const drawRowNumber = (vriFrom: number, vriTo: number) => {

                        for (let vri = vriFrom; vri <= vriTo; ++vri) {
                            const ri = viewRowToRealRow(vm, vri);
                            var rh = getRowHeight(ri);
                            const isSelected = highlightRowNumber && selectedRowIdxs.has(ri);

                            ctx.fillStyle = isSelected ? selectedHeaderBackgroundColor : cellNumberBackgroundColor;
                            ctx.fillRect(x, y, rowNumberColWidth, rh);

                            ctx.font = isSelected ? "bold " + headerFont : headerFont;
                            ctx.fillStyle = isSelected ? selectedHeaderTextColor : cellTextColor;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            ctx.fillText(String(vri + 1), x + rowNumberColWidth / 2, y + getRowHeight(ri) / 2 + 2);

                            y += getRowHeight(ri) + 1;
                        }
                    };

                    if (frozenRowsCount > 0) drawRowNumber(0, frozenRowsCount - 1);
                    drawRowNumber(frozenRowsCount + state.viewScrollOffset.row, Math.min(filteredSortedRowsCount() - 1, state.viewScrollOffset.row + viewRowsCount - 1));
                }
                //#endregion

                //#region DRAW FROZEN ROWS SEPARATOR LINE ( optional )
                if (frozenRowsCount > 0) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = frozenCellGridLinesColor;
                    ctx.beginPath();
                    let y = 1 + (showColNumber ? colNumberRowHeightFull() : 0) + 1;
                    for (let fri = 0; fri < frozenRowsCount; ++fri) {
                        const rfri = viewRowToRealRow(vm, fri);
                        const rh = getRowHeight(rfri);
                        //console.log("frozen row:" + fri + " realrow:" + rfri + " H=" + rh);
                        y += rh;
                    }
                    ctx.moveTo(0, y);
                    ctx.lineTo(W, y);
                    ctx.stroke();
                }
                //#endregion

                //#region DRAW FROZEN COLS SEPARATOR LINE ( optional )
                if (frozenColsCount > 0) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = frozenCellGridLinesColor;
                    ctx.beginPath();
                    let x = 2 + (showRowNumber ? rowNumberColWidth : 0);
                    for (let ci = 0; ci < frozenColsCount; ++ci) {
                        x += overridenColWidth(state, ci);
                    }
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, rowsYMax);
                    ctx.stroke();
                }
                //#endregion

                //#region DRAW CUSTOM EDIT CELL ( editing mode )
                if (state.customEditCell === null && children.length > 0) {
                    setChildren([]);
                }

                if (state.focusedFilterColIdx === -1 && state.customEditCell !== null) {
                    const ccoord = cellToCanvasCoord(state, state.customEditCell);
                    if (ccoord) {
                        let defaultEdit = true;

                        const ceditStyle = {
                            font: font,
                            //background: "yellow",
                            margin: 0, padding: 0, outline: 0, border: 0,
                            position: "absolute",
                            overflow: "hidden",
                            left: canvasRef.current.offsetLeft + ccoord.x + textMargin + 1,
                            top: canvasRef.current.offsetTop + ccoord.y + textMargin,
                            width: overridenColWidth(state, state.customEditCell.col) - textMargin - 2,
                            height: getRowHeight(state.customEditCell.row) - textMargin
                        } as CSSProperties;

                        if (getCellCustomEdit) {
                            const q = getCellCustomEdit(state.customEditCell, props);
                            if (q) {
                                defaultEdit = false;
                                setChildren([<div
                                    key="edit"
                                    style={ceditStyle}>
                                    {q}
                                </div>]);
                            }
                        }

                        if (defaultEdit)
                            setChildren([
                                <input
                                    autoFocus
                                    key="edit"
                                    style={ceditStyle}
                                    value={state.customEditValue || ""}
                                    onKeyDown={(e) => {
                                        switch (e.key) {
                                            case "Enter":
                                                {
                                                    const state = stateNfo.dup();
                                                    confirmCustomEdit(state, vm);
                                                    state.focusedCell = state.focusedCell.nextRow();
                                                    rectifyScrollOffset(state, vm);
                                                    setStateNfo(state);
                                                }
                                                break;

                                            case "Escape":
                                                {
                                                    const state = stateNfo.dup();
                                                    closeCustomEdit(state);
                                                    setStateNfo(state);
                                                }
                                                break;

                                        }
                                    }}
                                    onChange={(e) => {
                                        const state = stateNfo.dup();
                                        state.customEditValue = e.target.value;
                                        setStateNfo(state);
                                    }} />
                            ]);
                    }
                }
                //#endregion

                //#region CLEAR EXCEEDING TEXT ( after ending col cells )
                if (!showPartialColumns || stateNfo.viewScrollOffset.col === colsCount - viewColsCount) {
                    ctx.fillStyle = sheetBackgroundColor;
                    ctx.fillRect(colsXMax, 0, W - colsXMax, H);
                }
                //#endregion

                //#region DRAW HORIZONTAL SCROLLBAR
                if (horizontalScrollbarActive) {
                    const scrollFactor = state.viewScrollOffset.col / (colsCount - viewColsCount);
                    if (paintHorizontalScrollbar(state, ctx, scrollFactor)) stateChanged = true;
                }
                //#endregion

                //#region DRAW VERTICAL SCROLLBAR
                if (verticalScrollbarActive) {
                    const scrollFactor = state.viewScrollOffset.row / (filteredSortedRowsCount() - viewRowsCount);
                    if (paintVerticalScrollbar(state, ctx, scrollFactor)) stateChanged = true;
                }
                //#endregion

                if (debug) {
                    ctx.beginPath();
                    ctx.strokeStyle = "red";
                    ctx.rect(0, 0, W - 1, H - 1);
                    ctx.stroke();
                }
            }
        }

        return stateChanged;
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLCanvasElement>) => {
        if (api.onPreviewKeyDown) api.onPreviewKeyDown(e);

        if (!e.defaultPrevented) {
            const ctrl_key = e.getModifierState("Control");
            const shift_key = e.getModifierState("Shift");
            const state = stateNfo.dup();
            let keyHandled = false;

            const ifBoolToggle = () => {
                const cell = state.focusedCell;
                const data = getCellData(cell);
                if (getCellType && getCellType(cell, data) === "boolean") {
                    keyHandled = true;
                    const boolVal = data as boolean;
                    setCellData(cell, !boolVal);
                }
            };

            const focusedViewCell = new WSCanvasCellCoord(
                realRowToViewRow(viewMap, state.focusedCell.row),
                realColToViewCol(viewMap, state.focusedCell.col),
                state.focusedCell.filterRow);

            if (state.editMode !== WSCanvasEditMode.F2 && state.focusedFilterColIdx === -1) {
                //const focusedViewCell = viewCellToReal
                switch (e.key) {
                    case "ArrowDown":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(filteredSortedRowsCount() - 1));
                        else if (focusedViewCell.row < filteredSortedRowsCount() - 1) {
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextRow());
                        }
                        break;

                    case "ArrowUp":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(0));
                        else if (state.focusedCell.row > 0)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.prevRow());
                        break;

                    case "ArrowRight":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(colsCount - 1));
                        else if (state.focusedCell.col < colsCount - 1)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextCol());
                        break;

                    case "ArrowLeft":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(0));
                        else if (state.focusedCell.col > 0)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.prevCol());
                        break;

                    case "PageDown":
                        keyHandled = true;
                        state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(
                            Math.min(focusedViewCell.row + viewRowsCount, filteredSortedRowsCount() - 1)));
                        break;

                    case "PageUp":
                        keyHandled = true;
                        state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(Math.max(focusedViewCell.row - viewRowsCount, 0)));
                        break;

                    case "Home":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, new WSCanvasCellCoord());
                        else
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(0));
                        break;

                    case "End":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, new WSCanvasCellCoord(filteredSortedRowsCount() - 1, colsCount - 1));
                        else
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(colsCount - 1));
                        break;

                    case "Enter":
                        keyHandled = true;
                        if (state.editMode !== WSCanvasEditMode.none) {
                            postEditFormat(state);
                        }
                        state.editMode = WSCanvasEditMode.none;
                        state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextRow());
                        break;

                    case "Escape":
                        keyHandled = true;
                        state.editMode = WSCanvasEditMode.none;
                        break;

                    case "c":
                    case "C":
                        if (ctrl_key) {
                            keyHandled = true;
                            navigator.clipboard.writeText(getCellData(state.focusedCell));
                        }
                        break;

                    case "v":
                    case "V":
                        if (ctrl_key) {
                            keyHandled = true;
                            e.persist();
                            const text = await navigator.clipboard.readText();
                            const rng = state.selection;
                            let rngCells = rng.cells();
                            let cellIt = rngCells.next();
                            while (!cellIt.done) {
                                const cell = cellIt.value;
                                if (isCellReadonly === undefined || !isCellReadonly(cell)) {
                                    if (getCellType && getCellType(cell, getCellData(cell)) === "boolean") {
                                        setCellData(cell, text === "true");
                                    }
                                    else {
                                        setCellData(cell, text);
                                    }
                                }
                                cellIt = rngCells.next();
                            }
                        }
                        break;

                    case " ":
                        {
                            ifBoolToggle();
                        }
                        break;

                    case "F2":
                        {
                            if (getCellType && getCellType(state.focusedCell, getCellData(state.focusedCell)) === "boolean") {
                                keyHandled = true;
                            }
                            else {
                                openCellCustomEdit(state);
                            }
                        }
                        break;
                }

                if (shift_key &&
                    (stateNfo.focusedCell.row !== state.focusedCell.row ||
                        stateNfo.focusedCell.col !== state.focusedCell.col)) {
                    setSelectionByEndingCell(state, state.focusedCell, shift_key, !ctrl_key);
                }
                else
                    setSelectionByEndingCell(state, state.focusedCell, false, true);

                let applyState = true;

                if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" ||
                    e.key === "CapsLock" || e.key === "NumLock" || e.key === "Pause" || e.key === "ScrollLock" ||
                    e.key === "Insert" ||
                    e.key === "Meta" || e.key === "ContextMenu" ||
                    (e.key !== "F2" && e.key.length > 0 && e.key[0] === "F")) {
                    keyHandled = true;
                    applyState = false;
                }

                if (!keyHandled) {
                    const cell = state.focusedCell;

                    switch (state.editMode) {
                        case WSCanvasEditMode.none:
                            switch (e.key) {
                                case "Backspace":
                                case "Delete":
                                    {
                                        let cellRng = stateNfo.selection.cells();
                                        let cellIt = cellRng.next();
                                        while (!cellIt.done) {
                                            const cell = cellIt.value;
                                            if (isCellReadonly === undefined || !isCellReadonly(cell)) {
                                                setCellData(cell, "");
                                            }
                                            cellIt = cellRng.next();
                                        }
                                    }
                                    keyHandled = true;
                                    break;
                            }

                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell))) {
                                if (getCellType) {
                                    const prevData = getCellData(cell);
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            {
                                                if (parseFloat(e.key) !== NaN) {
                                                    setCellData(cell, e.key);
                                                }
                                            }
                                            break;
                                        default:
                                            setCellData(cell, e.key);
                                            break;
                                    }
                                }
                                else
                                    setCellData(cell, e.key);

                                state.editMode = WSCanvasEditMode.direct;
                            }
                            break;

                        case WSCanvasEditMode.direct:
                            switch (e.key) {
                                case "Backspace":
                                    const str = String(getCellData(cell));
                                    if (str.length > 0) setCellData(cell, str.substring(0, str.length - 1));
                                    keyHandled = true;
                                    break;
                                case "Delete":
                                    keyHandled = true;
                                    break;
                            }

                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell))) {
                                const prevData = getCellData(cell);
                                if (getCellType) {
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            {
                                                if (parseFloat(String(prevData) + e.key) !== NaN) {
                                                    setCellData(cell, String(prevData) + e.key);
                                                }
                                            }
                                            break;
                                        default:
                                            setCellData(cell, String(prevData) + e.key);
                                            break;
                                    }
                                }
                                else
                                    setCellData(cell, String(prevData) + e.key);
                            }
                            break;
                    }

                    paint(state, viewMap);
                    applyState = true;
                } else {
                    state.editMode = WSCanvasEditMode.none;
                }

                if (keyHandled) e.preventDefault();

                if (applyState) {
                    rectifyScrollOffset(state, viewMap);
                    setStateNfo(state);
                }
            }

            if (api.onKeyDown) api.onKeyDown(e);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        let cellCoord: WSCanvasCellCoord | null = null;
        const x = e.pageX - e.currentTarget.offsetLeft;
        const y = e.pageY - e.currentTarget.offsetTop;
        const ccoord = new WSCanvasCoord(x, y);

        if (api.onPreviewMouseDown) api.onPreviewMouseDown(e, cellCoord ? viewCellToReal(viewMap, cellCoord) : null);

        if (!e.defaultPrevented) {

            if (e.button === 0) {
                const ctrl_key = e.getModifierState("Control");
                const shift_key = e.getModifierState("Shift");

                const state = stateNfo.dup();

                if (!evalClickStart(state, ccoord)) {
                    cellCoord = canvasToCellCoord(state, viewMap, ccoord, showPartialColumns);

                    if (cellCoord) {
                        e.preventDefault();
                        if (cellCoord.row === -1 && cellCoord.col === -1) { // ENTIRE GRID SEL                        
                            state.focusedFilterColIdx = -1;
                            state.selection = new WSCanvasSelection([
                                new WSCanvasSelectionRange(
                                    new WSCanvasCellCoord(0, 0),
                                    new WSCanvasCellCoord(filteredSortedRowsCount() - 1, colsCount - 1)
                                )
                            ]);
                        } else if (cellCoord.col === -1) { // ROW SELECTIONS                        
                            state.focusedFilterColIdx = -1;
                            if (filteredSortedRowsCount() > 0) {
                                if (shift_key && state.selection.ranges.length > 0) {
                                    const lastSelectionBounds = state.selection.ranges[state.selection.ranges.length - 1].bounds;

                                    if (cellCoord.row < lastSelectionBounds.minRowIdx) {
                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                            new WSCanvasCellCoord(cellCoord.row, 0),
                                            new WSCanvasCellCoord(lastSelectionBounds.minRowIdx - 1, colsCount - 1)
                                        ));
                                    } else if (cellCoord.row > lastSelectionBounds.maxRowIdx) {
                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                            new WSCanvasCellCoord(lastSelectionBounds.maxRowIdx + 1, 0),
                                            new WSCanvasCellCoord(cellCoord.row, colsCount - 1)
                                        ));
                                    }
                                } else {
                                    const newRngSel = new WSCanvasSelectionRange(
                                        new WSCanvasCellCoord(cellCoord.row, 0),
                                        new WSCanvasCellCoord(cellCoord.row, colsCount - 1));
                                    if (ctrl_key) {
                                        state.selection.ranges.push(newRngSel);
                                    }
                                    else
                                        state.selection = new WSCanvasSelection([newRngSel]);
                                }
                            }
                        } else if (cellCoord.row === -1) { // COLUMN SORT / SELECTIONS                        
                            if (cellCoord.filterRow) { // FILTER ROW                            
                                state.focusedFilterColIdx = cellCoord.col;
                            } else {
                                state.focusedFilterColIdx = -1;
                                switch (columnClickBehavior) {
                                    case WSCanvasColumnClickBehavior.ToggleSort:
                                        {
                                            if (!shift_key) {
                                                //TODO: check single sort canceling multisort
                                                //setRowToSortedRowIndexMap(null);
                                                state.columnsSort = state.columnsSort.filter((x) => x.columnIndex === cellCoord!.col);
                                            }

                                            const qExisting = state.columnsSort.findIndex((x) => x.columnIndex === cellCoord!.col);

                                            if (qExisting !== -1) {
                                                const columnSort = state.columnsSort[qExisting];
                                                columnSort.sortDirection = columnSort.sortDirection === WSCanvasSortDirection.Ascending ?
                                                    WSCanvasSortDirection.Descending : WSCanvasSortDirection.Ascending;
                                            }
                                            else {
                                                const newOrder = state.columnsSort.length > 0 ?
                                                    (_.max(state.columnsSort.map((x) => x.sortOrder))! + 1) : 0;

                                                state.columnsSort.push({
                                                    columnIndex: cellCoord.col,
                                                    sortDirection: WSCanvasSortDirection.Ascending,
                                                    sortOrder: newOrder
                                                });
                                            }

                                            clearSelection(state);
                                            const vm = {} as ViewMap;
                                            filterAndSort(state, vm);
                                            setViewMap(vm);
                                        }
                                        break;

                                    case WSCanvasColumnClickBehavior.Select:
                                        {
                                            if (filteredSortedRowsCount() > 0) {
                                                if (shift_key && state.selection.ranges.length > 0) {
                                                    const lastSelectionBounds = state.selection.ranges[state.selection.ranges.length - 1].bounds;

                                                    if (cellCoord.col < lastSelectionBounds.minColIdx) {
                                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, cellCoord.col),
                                                            new WSCanvasCellCoord(filteredSortedRowsCount() - 1, lastSelectionBounds.minColIdx - 1)
                                                        ));
                                                    } else if (cellCoord.col > lastSelectionBounds.maxColIdx) {
                                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, lastSelectionBounds.maxColIdx + 1),
                                                            new WSCanvasCellCoord(filteredSortedRowsCount() - 1, cellCoord.col)
                                                        ));
                                                    }
                                                } else {
                                                    const newRngSel = new WSCanvasSelectionRange(
                                                        new WSCanvasCellCoord(0, cellCoord.col),
                                                        new WSCanvasCellCoord(filteredSortedRowsCount() - 1, cellCoord.col));
                                                    if (ctrl_key) {
                                                        state.selection.ranges.push(newRngSel);
                                                    }
                                                    else
                                                        state.selection = new WSCanvasSelection([newRngSel]);
                                                }
                                            }
                                        }
                                        break;
                                }
                            }
                        } else {
                            state.focusedFilterColIdx = -1;
                            focusCell(state, viewMap, cellCoord, false, shift_key, !ctrl_key);
                        }
                    }
                }

                setStateNfo(state);
            }

            if (api.onMouseDown) api.onMouseDown(e, cellCoord ? viewCellToReal(viewMap, cellCoord) : null);
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (api.onPreviewMouseUp) api.onPreviewMouseUp(e);

        if (!e.defaultPrevented) {
            const state = stateNfo.dup();
            cleanupScrollClick(state);
            state.resizingCol = -2;
            setStateNfo(state);

            if (api.onMouseUp) api.onMouseUp(e);
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (api.onPreviewMouseMove) api.onPreviewMouseMove(e);

        if (!e.defaultPrevented) {
            const x = e.pageX - e.currentTarget.offsetLeft;
            const y = e.pageY - e.currentTarget.offsetTop;
            const ccoord = new WSCanvasCoord(x, y);
            const RESIZE_HANDLE_TOL = 10;
            let stateUpdated = false;
            let state: WSCanvasState | undefined = undefined;

            const isOverCell = computeIsOverCell(stateNfo, x, y);
            if (isOverCell !== stateNfo.cursorOverCell) {
                stateUpdated = true;
                state = stateNfo.dup();
                state.cursorOverCell = isOverCell;
            }

            if (canvasRef.current) {
                if (e.buttons === 0) {
                    //
                    // track resizing col
                    //
                    if (showColNumber && y < colNumberRowHeightFull()) {
                        let qCol = xGetCol(stateNfo, x);

                        let resizingCol = -2;
                        let cwidth = qCol[1];
                        let onHandle = false;
                        if (qCol[0] > -2) {
                            let tryResizingCol = qCol[0];
                            let colX = colGetXWidth(stateNfo, tryResizingCol);
                            cwidth = colX[1];
                            let skip = false; // workaround avoid cursor flicker

                            if (Math.abs(x - colX[0]) < 2 * RESIZE_HANDLE_TOL) {
                                skip = true;
                            } else if (x - colX[0] > RESIZE_HANDLE_TOL) {
                                ++tryResizingCol;
                                colX = colGetXWidth(stateNfo, tryResizingCol);
                                cwidth = colX[1];
                            }

                            if (qCol[0] === colsCount - 1) {
                                const lastX = stateNfo.tableCellsBBox.rightBottom.x;
                                if (Math.abs(x - lastX) <= RESIZE_HANDLE_TOL) {
                                    onHandle = true;
                                    resizingCol = colsCount - 1;
                                    cwidth = colGetXWidth(stateNfo, resizingCol)[1];
                                }
                            }

                            if (!skip && (x === colX[0] || (colX[0] >= x - RESIZE_HANDLE_TOL && colX[0] <= x + RESIZE_HANDLE_TOL))) {
                                onHandle = true;
                                resizingCol = tryResizingCol - 1;
                                cwidth = colGetXWidth(stateNfo, resizingCol)[1];
                            }
                        }

                        if (stateNfo.resizingCol !== resizingCol) {
                            if (state === undefined) {
                                state = stateNfo.dup();
                                stateUpdated = true;
                            }
                            state.resizingCol = resizingCol;
                            state.resizingColStartNfo = [x, cwidth];
                        }
                    } else if (stateNfo.resizingCol !== -2) {
                        if (state === undefined) {
                            state = stateNfo.dup();
                            stateUpdated = true;
                        }
                        state.resizingCol = -2;
                    }
                }
            }

            const hoveredViewRow = canvasToViewRow(stateNfo, ccoord);
            if (hoveredViewRow !== -2 && hoveredViewRow !== stateNfo.hoveredViewRow) {
                if (state === undefined) {
                    state = stateNfo.dup();
                    stateUpdated = true;
                }
                state.hoveredViewRow = hoveredViewRow;
            }

            if (e.buttons === 0 && (stateNfo.verticalScrollClickStartCoord !== null || stateNfo.horizontalScrollClickStartCoord !== null)) {
                if (state === undefined) {
                    state = stateNfo.dup();
                    stateUpdated = true;
                }
                cleanupScrollClick(state);
            }

            if (e.buttons === 1 && e.button === 0) {
                if (state === undefined) {
                    state = stateNfo.dup();
                    stateUpdated = true;
                }

                //
                // RESIZE COLUMN
                //
                if (state.resizingCol !== -2) {
                    const startX = state.resizingColStartNfo[0];
                    const startWidth = state.resizingColStartNfo[1];
                    const newWidth = startWidth + (x - startX);
                    // console.log("changing col:" + state.resizingCol + " from:" + startWidth + " to:" + newWidth);
                    state.columnWidthOverride.set(state.resizingCol, newWidth);
                    state.columnWidthOverrideTrack = JSON.stringify([...state.columnWidthOverride]);
                }
                else if (state.verticalScrollClickStartCoord !== null)
                    evalVerticalScrollMove(state, state.verticalScrollClickStartCoord.y, ccoord.y);
                else if (state.horizontalScrollClickStartCoord !== null)
                    evalHorizontalScrollMove(state, state.horizontalScrollClickStartCoord.x, ccoord.x);
            }

            {
                const isOverCell = computeIsOverCell(stateNfo, x, y);

                if (stateNfo.cursorOverCell !== isOverCell) {
                    if (state === undefined) {
                        state = stateNfo.dup();
                        stateUpdated = true;
                    }
                    state.cursorOverCell = isOverCell;
                }
            }

            if (stateUpdated) setStateNfo(state!);

            if (api.onMouseMove) api.onMouseMove(e);
        }
    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const x = e.pageX - e.currentTarget.offsetLeft;
        const y = e.pageY - e.currentTarget.offsetTop;
        const ccoord = new WSCanvasCoord(x, y);
        const cell = canvasToCellCoord(stateNfo, viewMap, ccoord);

        if (api.onPreviewMouseDoubleClick) api.onPreviewMouseDoubleClick(e, cell ? viewCellToReal(viewMap, cell) : null);

        if (!e.defaultPrevented) {
            if (cell) {
                if (cell.row >= 0 && cell.col >= 0) {

                    const data = getCellData(cell);
                    if (getCellType && getCellType(cell, data) === "boolean") {
                        const boolVal = data as boolean;
                        setCellData(cell, !boolVal);
                        return;
                    }

                    const state = stateNfo.dup();
                    openCellCustomEdit(state);
                    setStateNfo(state);
                }

                if (api.onMouseDown) api.onMouseDown(e, viewCellToReal(viewMap, cell));
            }
        }
    }

    const handleWheel = (e: WheelEvent) => {
        if (api.onPreviewMouseWheel) api.onPreviewMouseWheel(e);

        if (!e.defaultPrevented && stateNfo.cursorOverCell) {
            const shift_key = e.getModifierState("Shift");
            const state = stateNfo.dup();
            let prevent = true;

            if (e.deltaY > 0) {
                if (shift_key) {
                    if (!preventWheelOnBounds && state.viewScrollOffset.col === colsCount - viewColsCount) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setCol(Math.min(state.viewScrollOffset.col + 1, colsCount - viewColsCount));
                }
                else {
                    if (!preventWheelOnBounds && state.viewScrollOffset.row === filteredSortedRowsCount() - viewRowsCount) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setRow(Math.min(state.viewScrollOffset.row + 1, filteredSortedRowsCount() - viewRowsCount));
                }
            }
            else if (e.deltaY < 0) {
                if (shift_key) {
                    if (!preventWheelOnBounds && state.viewScrollOffset.col === 0) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setCol(Math.max(0, state.viewScrollOffset.col - 1));
                }
                else {
                    if (!preventWheelOnBounds && state.viewScrollOffset.row === 0) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setRow(Math.max(0, state.viewScrollOffset.row - 1));
                }
            }

            setStateNfo(state);

            if (prevent) e.preventDefault();

            if (api.onMouseWheel) api.onMouseWheel(e);
        }
    }

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) return;

        const state = stateNfo.dup();

        state.scrollOffsetStart = new WSCanvasCellCoord(state.viewScrollOffset.row, state.viewScrollOffset.col);

        const touch = e.touches.item(0);
        if (touch && canvasRef.current) {
            state.touchCur = [touch.clientX, touch.clientY];
            state.touchStart = [touch.clientX, touch.clientY];
            state.touchStartTime = new Date().getTime();

            const canv = canvasRef.current;
            const x = touch.clientX - canv.offsetLeft;
            const y = touch.clientY - canv.offsetTop;
            const ccoord = new WSCanvasCoord(x, y);
            state.cursorOverCell = computeIsOverCell(state, x, y);

            evalClickStart(state, ccoord);
        }

        setStateNfo(state);
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) return;

        const touch = e.touches.item(0);
        if (touch && canvasRef.current) {
            const canv = canvasRef.current;
            const x = touch.clientX - canv.offsetLeft;
            const y = touch.clientY - canv.offsetTop;
            const ccoord = new WSCanvasCoord(x, y);

            const isOverCell = computeIsOverCell(stateNfo, x, y);
            let isOverCellChanged = stateNfo.cursorOverCell !== isOverCell;

            const state = stateNfo.dup();
            state.cursorOverCell = isOverCell;
            state.touchCur = [touch.clientX, touch.clientY];

            const SCROLL_TOUCH_TOLERANCE = 20;

            const onVerticalScrollBar = state.verticalScrollBarRect &&
                (state.verticalScrollBarRect.contains(ccoord, SCROLL_TOUCH_TOLERANCE) ||
                    state.verticalScrollClickStartCoord !== null &&
                    state.verticalScrollBarRect.leftTop.x <= x + SCROLL_TOUCH_TOLERANCE &&
                    state.verticalScrollBarRect.rightBottom.x >= x - SCROLL_TOUCH_TOLERANCE
                );

            const onHorizontalScrollBar = state.horizontalScrollBarRect &&
                (state.horizontalScrollBarRect.contains(ccoord, SCROLL_TOUCH_TOLERANCE) ||
                    state.horizontalScrollClickStartCoord !== null &&
                    state.horizontalScrollBarRect.leftTop.y <= y + SCROLL_TOUCH_TOLERANCE &&
                    state.horizontalScrollBarRect.rightBottom.y >= y - SCROLL_TOUCH_TOLERANCE
                );

            if (state.verticalScrollHandleRect) {
                state.debugNfo = state.verticalScrollHandleRect.toString() + " cx:" + (touch.clientX - canv.offsetLeft) + " cy:" + (touch.clientY - canv.offsetTop);
            }

            if (state.horizontalScrollClickStartCoord === null && (onVerticalScrollBar || state.verticalScrollClickStartCoord)) {
                if (state.verticalScrollClickStartCoord === null) {
                    state.verticalScrollClickStartFactor = state.viewScrollOffset.row / (filteredSortedRowsCount() - viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }

                evalVerticalScrollMove(state, state.verticalScrollClickStartCoord.y, y);

                e.preventDefault();
            } else if (onHorizontalScrollBar || state.horizontalScrollClickStartCoord) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = state.viewScrollOffset.col / (colsCount - viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }

                evalHorizontalScrollMove(state, state.horizontalScrollClickStartCoord.x, x);

                e.preventDefault();
            } else if (isOverCell) {
                const X_SENSITIVITY = width / 10;
                const Y_SENSITIVITY = height / 25;

                const delta = [state.touchCur[0] - state.touchStart[0], state.touchCur[1] - state.touchStart[1]];
                if (Math.abs(delta[0]) > X_SENSITIVITY || Math.abs(delta[1]) > Y_SENSITIVITY) {
                    const deltaRow = -Math.trunc(delta[1] / Y_SENSITIVITY);
                    const deltaCol = -Math.trunc(delta[0] / X_SENSITIVITY);

                    state.touchStart = [state.touchCur[0], state.touchCur[1]];

                    state.viewScrollOffset = new WSCanvasCellCoord(
                        Math.max(0, Math.min(filteredSortedRowsCount() - viewRowsCount, state.viewScrollOffset.row + deltaRow)),
                        Math.max(0, Math.min(colsCount - viewColsCount, state.viewScrollOffset.col + deltaCol)));
                }

                e.preventDefault();
            }

            setStateNfo(state);

            if (state.horizontalScrollClickStartCoord !== null || state.verticalScrollClickStartCoord !== null)
                e.preventDefault();
        }
    }

    const handleTouchEnd = (e: TouchEvent) => {
        if (stateNfo.verticalScrollClickStartCoord || stateNfo.horizontalScrollClickStartCoord) {
            const state = stateNfo.dup();
            state.horizontalScrollClickStartCoord = null;
            state.verticalScrollClickStartCoord = null;
            setStateNfo(state);
        }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (canvasRef.current) {
            canvasRef.current.setPointerCapture(e.pointerId);
        }
    }

    const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const x = e.pageX - e.currentTarget.offsetLeft;
        const y = e.pageY - e.currentTarget.offsetTop;
        const cell = canvasToCellCoord(stateNfo, viewMap, new WSCanvasCoord(x, y));

        if (api.onContextMenu) api.onContextMenu(e, cell ? viewCellToReal(viewMap, cell) : null);
    }

    useLayoutEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.addEventListener("wheel", handleWheel);
            canvasRef.current.addEventListener("touchstart", handleTouchStart);
            canvasRef.current.addEventListener("touchmove", handleTouchMove, { passive: false });
            canvasRef.current.addEventListener("touchend", handleTouchEnd);
            return () => {
                if (canvasRef.current) {
                    canvasRef.current.removeEventListener("wheel", handleWheel);
                    canvasRef.current.removeEventListener("touchstart", handleTouchStart);
                    canvasRef.current.removeEventListener("touchmove", handleTouchMove);
                    canvasRef.current.removeEventListener("touchend", handleTouchEnd);
                }
            };
        }
        return () => { };
    }, [canvasRef, stateNfo]);

    //#region API
    {
        api.clearSelection = () => {
            const state = stateNfo.dup();
            clearSelection(state);
            setStateNfo(state);
        };
        api.getSelection = () => stateNfo.selection;
        api.setSelection = (selection: WSCanvasSelection) => {
            const state = stateNfo.dup();
            state.selection = selection;
            setStateNfo(state);
        }

        // TODO: sorted
        api.cellToCanvasCoord = (cell) => cellToCanvasCoord(stateNfo, cell);
        api.canvasCoordToCellCoord = (ccoord) => canvasToCellCoord(stateNfo, viewMap, ccoord);
        api.focusCell = (cell, scrollTo, endingCell, clearSelection) => {
            const state = stateNfo.dup();
            focusCell(state, viewMap, cell, scrollTo, endingCell, clearSelection);
            setStateNfo(state);
        }
        //

        api.scrollTo = (coord) => {
            const state = stateNfo.dup();
            scrollTo(state, viewMap, coord);
            setStateNfo(state);
        }
        api.setSorting = (newSorting) => {
            const state = stateNfo.dup();
            state.columnsSort = newSorting;
            setStateNfo(state);
        }
        api.currentState = () => stateNfo;

        //api.currentState = () => { return stateNfo; }
    }
    //#endregion

    const baseDivContainerStyle = {
        overflow: "hidden",
    } as CSSProperties;

    const baseCanvasStyle = {
        outline: 0,
        cursor: (stateNfo.resizingCol !== -2) ? "w-resize" :
            stateNfo.cursorOverCell ? cellCursor : outsideCellCursor
    } as CSSProperties;

    //#region DEBUG CTL
    let DEBUG_CTL: JSX.Element | null = null;
    {
        const stateNfoSize = debug ? JSON.stringify(stateNfo).length : 0;

        DEBUG_CTL = debug ? <div ref={debugRef}>
            <b>paint cnt</b> => {stateNfo.paintcnt}<br />
            <b>state size</b> => <span style={{ color: stateNfoSize > 2000 ? "red" : "" }}>{stateNfoSize}</span><br />
            <b>graphics</b> => (W:{W} x H:{H}) (viewRowsCnt:{viewRowsCount})<br />
            <b>scroll</b> => {stateNfo.viewScrollOffset.toString()}<br />
            <b>focused cell</b> => {stateNfo.focusedCell.toString()}<br />
            <b>rows</b> => cnt:{rowsCount}<br />
            <b>viewmap size</b> => {viewMap ? viewMap.realToView.length : "null"}<br />
            <b>override row height</b> => {overridenRowHeight ? overridenRowHeight.length : "null"}<br />
            <b>first override rh</b> => {overridenRowHeight ? overridenRowHeight[0] : "null"}<br />
            <b>x</b>=> {stateNfo.verticalScrollClickStartCoord ? stateNfo.verticalScrollClickStartCoord.toString() : ""}
        </div> : null;
    }
    //#endregion

    return <div ref={containerRef}
        style={{
            width: width,
            height: height,
            border: debug ? "1px solid blue" : "",
            overflow: "hidden"
        }}>

        <div style={{ background: "lightcyan" }}>
            {DEBUG_CTL}
        </div>

        <div ref={canvasDivRef}
            style={containerStyle === undefined ? baseDivContainerStyle : Object.assign(baseDivContainerStyle, containerStyle)}>

            <canvas ref={canvasRef}
                tabIndex={0}
                style={canvasStyle === undefined ? baseCanvasStyle : Object.assign(baseCanvasStyle, canvasStyle, { margin: 0, padding: 0 })}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                width={W}
                height={H}
            />
        </div>

        {children}

        {filterChildren}
    </div>
}

WSCanvas.defaultProps = WSCanvasPropsDefault();
