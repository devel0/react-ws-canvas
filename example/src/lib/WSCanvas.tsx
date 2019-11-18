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

        getCellData,
        setCellData,
        getCellCustomEdit,
        getColumnHeader,
        getColumnLessThanOp,
        getCellType,
        isCellReadonly,

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
        textMargin,
        font,
        cellTextColor,
        headerFont,
        cellCursor,
        outsideCellCursor,

        filterDebounceMs,
        filterTextMargin,
        filterIgnoreCase,
        filterBackground,

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

    const containerRef = useRef<HTMLDivElement>(null);
    const debugRef = useRef<HTMLDivElement>(null);
    const canvasDivRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const debugSize = useElementSize(debugRef);

    const [stateNfo, setStateNfo] = useState<WSCanvasState>(new WSCanvasState());

    const [children, setChildren] = useState<JSX.Element[]>([]);
    const [filterChildren, setFilterChildren] = useState<JSX.Element[]>([]);
    const [rowToSortedRowIndexMap, setRowToSortedRowIndexMap] = useState<number[] | null>(null);
    const [rowToMatchingFilterRow, setRowToMatchingFilterRow] = useState<number[] | null>(null);

    const colNumberRowHeightFull = () => colNumberRowHeight + (showFilter ? rowHeight : 0);

    const minH = (showColNumber ? colNumberRowHeightFull() : 0) + rowsCount * (rowHeight + 1) + scrollBarThk + 10;

    let W = width;
    let H = Math.min(height, minH) - debugSize.height;

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

        W -= (marginLeft + marginRight + paddingLeft + paddingRight);
        H -= (marginTop + marginBottom + paddingTop + paddingBottom);
    }

    const overridenColWidth = (state: WSCanvasState, cidx: number) => {
        const q = state.columnWidthOverride.get(cidx);
        if (q)
            return q;
        else
            return colWidth(cidx);
    }

    const computeFilteredRowsCount = (state: WSCanvasState) => {
        const q = (rowToMatchingFilterRow === null) ? rowsCount : rowToMatchingFilterRow.length;
        return q;
    };

    useEffect(() => {
        const state = stateNfo.dup();
        state.filteredRowsCount = computeFilteredRowsCount(state);
        setStateNfo(state);
    }, [rowsCount]);

    let sortingRowToSortedRowIndexMap: number[] | null = null;

    const sortedGetCellData = (state: WSCanvasState, coord: WSCanvasCellCoord) => {
        const filterMap = rowToMatchingFilterRow;
        const sortingMap = sortingRowToSortedRowIndexMap;
        const sortedMap = rowToSortedRowIndexMap;

        if (sortingMap !== null) {
            return getCellData(new WSCanvasCellCoord(sortingMap[coord.row], coord.col));
        }
        else if (sortedMap !== null) {
            if (filterMap === null)
                return getCellData(new WSCanvasCellCoord(sortedMap[coord.row], coord.col));
            else
                return getCellData(new WSCanvasCellCoord(filterMap[sortedMap[coord.row]], coord.col));
        }
        else {
            if (filterMap === null)
                return getCellData(coord);
            else
                return getCellData(new WSCanvasCellCoord(filterMap[coord.row], coord.col))
        }
    }

    const sortedSetCellData = (state: WSCanvasState, coord: WSCanvasCellCoord, value: any) => {
        const filterMap = rowToMatchingFilterRow;
        const sortingMap = sortingRowToSortedRowIndexMap;
        const sortedMap = rowToSortedRowIndexMap;

        if (sortingMap !== null) {
            setCellData(new WSCanvasCellCoord(sortingMap[coord.row], coord.col), value);
        } else if (sortedMap !== null) {
            if (filterMap === null)
                setCellData(new WSCanvasCellCoord(sortedMap[coord.row], coord.col), value);
            else
                setCellData(new WSCanvasCellCoord(filterMap[sortedMap[coord.row]], coord.col), value);
        } else {
            if (filterMap === null)
                setCellData(coord, value);
            else
                setCellData(new WSCanvasCellCoord(filterMap[coord.row], coord.col), value);
        }
    }

    const computeViewRows = (withHorizontalScrollbar: boolean) => {
        const h = H - (showColNumber ? (colNumberRowHeightFull() + 1) : 0) - 2;
        return Math.floor((h - (withHorizontalScrollbar ? scrollBarThk : 0)) / (rowHeight + 1));
    };

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
            for (let cidx = frozenColsCount + state.scrollOffset.col; cidx < colsCount; ++cidx) {
                w += overridenColWidth(state, cidx) + 1;
                if (w > ww) break;
                ++q;
            }
        }
        return q;
    };

    const verticalScrollbarActive =
        verticalScrollbarMode === WSCanvasScrollbarMode.on ||
        (verticalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewRows(false) < stateNfo.filteredRowsCount)

    const horizontalScrollbarActive =
        horizontalScrollbarMode === WSCanvasScrollbarMode.on ||
        (horizontalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewCols(stateNfo, false) < colsCount);

    const viewRowsCount = computeViewRows(horizontalScrollbarActive);
    const viewColsCount = computeViewCols(stateNfo, verticalScrollbarActive);

    const formatCellDataAsDate = (cellData: any) => moment(cellData as Date).format(dateCellMomentFormat);
    const formatCellDataAsTime = (cellData: any) => moment(cellData as Date).format(timeCellMomentFormat);
    const formatCellDataAsDateTime = (cellData: any) => moment(cellData as Date).format(dateTimeCellMomentFormat);

    const redrawCellInternal = (state: WSCanvasState, cell: WSCanvasCellCoord, ctx: CanvasRenderingContext2D, cWidth: number, x: number, y: number) => {
        const isSelected = (
            ((selectFocusedCellOrRow && state.selection.ranges.length === 1) || state.selection.ranges.length > 1) ||
            (state.selection.ranges.length === 1 && !state.selection.ranges[0].from.equals(state.selection.ranges[0].to))
        ) &&
            state.selection.containsCell(new WSCanvasCellCoord(cell.row, cell.col), selectionMode);

        // https://usefulangle.com/post/17/html5-canvas-drawing-1px-crisp-straight-lines
        const x_ = x - 0.5;
        const y_ = y + 0.5;

        ctx.fillStyle = isSelected ? selectionBackgroundColor : sheetBackgroundColor;
        ctx.fillRect(x, y, cWidth, rowHeight);

        if (isSelected) {
            const leftBorder = cell.col === 0 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row, cell.col - 1), selectionMode);
            const rightBorder = cell.col === colsCount - 1 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row, cell.col + 1), selectionMode);
            const topBorder = cell.row === 0 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row - 1, cell.col), selectionMode);
            const bottomBorder = cell.row === state.filteredRowsCount - 1 || !state.selection.containsCell(new WSCanvasCellCoord(cell.row + 1, cell.col), selectionMode);

            if (leftBorder || rightBorder || topBorder || bottomBorder) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.strokeStyle = selectionBorderColor;

                if (leftBorder) {
                    ctx.moveTo(x_, y_);
                    ctx.lineTo(x_, y_ + rowHeight);
                    ctx.stroke();
                }

                if (rightBorder) {
                    ctx.moveTo(x_ + cWidth + 1, y_ - 1);
                    ctx.lineTo(x_ + cWidth + 1, y_ + rowHeight);
                    ctx.stroke();
                }

                if (topBorder) {
                    ctx.moveTo(x_, y_ - 1);
                    ctx.lineTo(x_ + cWidth - 1, y_ - 1);
                    ctx.stroke();
                }

                if (bottomBorder) {
                    ctx.moveTo(x_, y_ + rowHeight);
                    ctx.lineTo(x_ + cWidth - 1, y_ + rowHeight);
                    ctx.stroke();
                }
            }
        }

        ctx.font = font;
        ctx.fillStyle = cellTextColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        let cellData = sortedGetCellData(state, cell);
        let posX = x + textMargin;
        let posY = y + rowHeight / 2 - textMargin / 2 + 2;

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
                    posX = x + textMargin + cWidth / 2;
                    ctx.textAlign = "center";
                    break;
                case "date":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = formatCellDataAsDate(cellData);
                    break;
                case "time":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = formatCellDataAsTime(cellData);
                    break;
                case "datetime":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = formatCellDataAsDateTime(cellData);
                    break;
                case "number":
                    if (state.editMode !== WSCanvasEditMode.none && state.focusedCell.equals(cell))
                        str = cellData;
                    else
                        str = Number(cellData).toLocaleString(navigator.language);
                    posX = x + cWidth - textMargin;
                    ctx.textAlign = "right";
                    break;
                case "text":
                    str = String(cellData);
                    break;
            }
        }

        ctx.fillText(str, posX, posY);

        if (showFocusedCellOutline && state.focusedCell.row === cell.row && state.focusedCell.col === cell.col) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = focusedCellBorderColor;
            ctx.rect(x, y, cWidth, rowHeight);
            ctx.stroke();
        }
    }

    const confirmCustomEdit = (state: WSCanvasState) => {
        if (state.customEditCell !== null) {
            sortedSetCellData(state, state.customEditCell, state.customEditValue);
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
    const verticalScrollHandleLen = (state: WSCanvasState) => Math.max(minScrollHandleLen, (H - scrollBarThk) / state.filteredRowsCount * viewRowsCount);

    const paintHorizontalScrollbar = (state: WSCanvasState, ctx: CanvasRenderingContext2D, factor: number) => {
        ctx.lineWidth = 1;

        const scrollHandleLen = horizontalScrollHanleLen();
        const scrollPos = factor * (W - scrollBarThk - scrollHandleLen - 4);

        {
            const W_ = W - 4 - scrollBarThk;
            const Y_ = H - 2 - scrollBarThk;
            ctx.fillStyle = gridLinesColor;
            state.horizontalScrollBarRect = new WSCanvasRect(new WSCanvasCoord(1, Y_), new WSCanvasCoord(W_ + 1, scrollBarThk), WSCanvasRectMode.pointAndSize);
            const r = state.horizontalScrollBarRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);

            ctx.fillStyle = cellNumberBackgroundColor;
            ctx.fillRect(W_ + 1, Y_, W - (W_ + 2), scrollBarThk);
        }

        {
            const scrollBarLeftTop = new WSCanvasCoord(scrollPos, H - scrollBarThk - 2);
            const scrollBarSize = new WSCanvasCoord(scrollHandleLen - 1, scrollBarThk - 1);
            state.horizontalScrollHandleRect = new WSCanvasRect(scrollBarLeftTop, scrollBarSize, WSCanvasRectMode.pointAndSize);

            ctx.fillStyle = (state.horizontalScrollClickStartCoord !== null) ? clickedScrollBarColor : scrollBarColor;
            const r = state.horizontalScrollHandleRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }
    }

    const paintVerticalScrollbar = (state: WSCanvasState, ctx: CanvasRenderingContext2D, factor: number) => {
        ctx.lineWidth = 1;

        const scrollHandleLen = verticalScrollHandleLen(state);
        const scrollPos = factor * (H - scrollBarThk - scrollHandleLen - 3);

        {
            const H_ = H - 3 - scrollBarThk;
            const X_ = W - 2 - scrollBarThk;
            ctx.fillStyle = gridLinesColor;
            state.verticalScrollBarRect = new WSCanvasRect(new WSCanvasCoord(X_, 0), new WSCanvasCoord(scrollBarThk, H_ + 1), WSCanvasRectMode.pointAndSize);
            const r = state.verticalScrollBarRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }

        {
            const scrollBarHandleLeftTop = new WSCanvasCoord(W - scrollBarThk - 2, scrollPos);
            const scrollBarSize = new WSCanvasCoord(scrollBarThk - 1, scrollHandleLen - 1);
            state.verticalScrollHandleRect = new WSCanvasRect(scrollBarHandleLeftTop, scrollBarSize, WSCanvasRectMode.pointAndSize);

            ctx.fillStyle = (state.verticalScrollClickStartCoord !== null) ? clickedScrollBarColor : scrollBarColor;
            const r = state.verticalScrollHandleRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);
        }
    }

    const cleanupScrollClick = (state: WSCanvasState) => {
        if (stateNfo.verticalScrollClickStartCoord !== null || stateNfo.horizontalScrollClickStartCoord !== null) {
            state.verticalScrollClickStartCoord = null;
            state.horizontalScrollClickStartCoord = null;
        }
    }

    const rectifyScrollOffset = (state: WSCanvasState) => {
        scrollTo(state, state.focusedCell);
    }

    /** [-2,0] not on screen ; -1:(row col number); [ci,cwidth] is the result */
    const xGetCol = (state: WSCanvasState, x: number, allowPartialCol: boolean = false) => {
        if (showRowNumber && x >= 1 && x <= 1 + rowNumberColWidth) return [-1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);

        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (x >= _x && x < _x + cWidth) return [ci, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + stateNfo.scrollOffset.col + viewColsCount;
        if (allowPartialCol && lastColView < colsCount) lastColView++;

        for (let ci = frozenColsCount + stateNfo.scrollOffset.col; ci < lastColView; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (x >= _x && x < _x + cWidth) return [ci, cWidth];
            _x += cWidth;
        }

        return [-2, 0];
    }

    /** [-2,0] not on screen */
    const colGetXWidth = (state: WSCanvasState, qci: number, allowPartialCol: boolean = false) => {
        if (qci === -1) return [1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);
        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (ci === qci) return [_x, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + stateNfo.scrollOffset.col + viewColsCount;
        if (allowPartialCol && lastColView < colsCount) lastColView++;

        for (let ci = frozenColsCount + stateNfo.scrollOffset.col; ci < lastColView; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (ci === qci) return [_x, cWidth];
            _x += cWidth;
        }
        return [-2, 0];
    }

    const canvasToCellCoord = (state: WSCanvasState, ccoord: WSCanvasCoord, allowPartialCol: boolean = false) => {
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
            for (let ri = state.scrollOffset.row; ri < state.scrollOffset.row + viewRowsCount; ++ri) {
                if (ri >= state.filteredRowsCount) break;

                if (py >= y && py < y + rowHeight)
                    return new WSCanvasCellCoord(ri, -1);

                y += rowHeight + 1;
            }
            return null;
        }

        // on data cells
        {
            if (ci[0] !== -2) {
                let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
                for (let ri = state.scrollOffset.row; ri < state.scrollOffset.row + viewRowsCount; ++ri) {
                    if (ri >= state.filteredRowsCount) break;
                    if (py >= y && py < y + rowHeight) return new WSCanvasCellCoord(ri, ci[0]);

                    y += rowHeight + 1;
                }
            }

            return null;
        }
    }
    api.canvasCoordToCellCoord = (ccoord) => canvasToCellCoord(stateNfo, ccoord);

    const cellToCanvasCoord = (state: WSCanvasState, cell: WSCanvasCellCoord, allowPartialCol: boolean = false) => {
        const colXW = colGetXWidth(state, cell.col, allowPartialCol);
        if (cell.filterRow) return new WSCanvasCoord(colXW[0], colNumberRowHeight + filterTextMargin, colXW[1]);

        let y = 1;
        for (let ri = state.scrollOffset.row; ri < state.scrollOffset.row + viewRowsCount; ++ri) {
            if (ri >= state.filteredRowsCount) break;

            if (ri === cell.row) {
                let resy = y + (showColNumber ? colNumberRowHeightFull() : 0);

                return new WSCanvasCoord(colXW[0], resy, colXW[1]);
            }

            y += rowHeight + 1;
        }
        return null;
    }
    api.cellToCanvasCoord = (cell) => cellToCanvasCoord(stateNfo, cell);

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

    api.setSelection = (selection: WSCanvasSelection) => {
        const state = stateNfo.dup();
        state.selection = selection;
        setStateNfo(state);
    }

    const openCellCustomEdit = (state: WSCanvasState) => {
        if (canvasRef.current) {
            const xy = cellToCanvasCoord(state, state.focusedCell);
            const cell = state.focusedCell;
            if (isCellReadonly && isCellReadonly(cell)) return;

            if (xy) {
                state.customEditCell = cell;
                let cellVal = sortedGetCellData(state, cell);
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
            const cellData = sortedGetCellData(state, state.focusedCell);
            const cellType = getCellType(state.focusedCell, cellData);

            switch (cellType) {
                case "date":
                    sortedSetCellData(state, state.focusedCell, moment(cellData, dateCellMomentFormat));
                    break;
                case "time":
                    sortedSetCellData(state, state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
                case "datetime":
                    sortedSetCellData(state, state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
            }
        }
    }

    const focusCell = (state: WSCanvasState, cell: WSCanvasCellCoord, scrollTo?: boolean, endingCell?: boolean, clearPreviousSel?: boolean) => {
        setSelectionByEndingCell(state, cell, endingCell, clearPreviousSel);

        state.focusedCell = cell;
        confirmCustomEdit(state);
        state.editMode = WSCanvasEditMode.none;

        if (scrollTo === true) rectifyScrollOffset(state);
    }

    const scrollTo = (state: WSCanvasState, cell: WSCanvasCellCoord) => {
        // adjust scrollOffset.row
        if (cell.row >= state.scrollOffset.row + viewRowsCount) {
            state.scrollOffset = state.scrollOffset.setRow(cell.row - viewRowsCount + 1);
        }
        else if (cell.row - frozenRowsCount <= state.scrollOffset.row) {
            state.scrollOffset = state.scrollOffset.setRow(Math.max(0, cell.row - frozenRowsCount));
        }

        // adjust scrollOffset.col
        if (cell.col >= state.scrollOffset.col + viewColsCount) {
            state.scrollOffset = state.scrollOffset.setCol(cell.col - viewColsCount + 1);
        }
        else if (cell.col - frozenColsCount <= state.scrollOffset.col) {
            state.scrollOffset = state.scrollOffset.setCol(Math.max(0, cell.col - frozenColsCount));
        }
    }

    const applyFilter = (state: WSCanvasState) => {
        const qfilter: number[] = [];

        if (rowsCount > 0 && stateNfo.filters) {
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
                    qfilter.push(ri);
                }
            }
            setRowToMatchingFilterRow(qfilter);
            state.filteredRowsCount = qfilter.length;
        }

        return qfilter;
    }

    const sortRows = (state: WSCanvasState) => {
        if (state.columnsSort.length === 0) {
            setRowToSortedRowIndexMap(null);
        }
        else {
            sortingRowToSortedRowIndexMap = null;

            const orderedColumnSort = _.orderBy(state.columnsSort, (x) => x.sortOrder, "desc");

            for (let si = 0; si < orderedColumnSort.length; ++si) {
                const columnSort = orderedColumnSort[si];
                const lessThanOp = getColumnLessThanOp ? getColumnLessThanOp(columnSort.columnIndex) : undefined;

                let colData: WSCanvasSortingRowInfo[] = [];
                for (let ri = 0; ri < state.filteredRowsCount; ++ri) {
                    if (si > 0)
                        colData.push({
                            ri: sortingRowToSortedRowIndexMap![ri],
                            cellData: getCellData(new WSCanvasCellCoord(sortingRowToSortedRowIndexMap![ri], columnSort.columnIndex))
                        });
                    else colData.push({
                        ri: ri,
                        cellData: getCellData(new WSCanvasCellCoord(ri, columnSort.columnIndex))
                    });
                }

                colData.sort((a, b) => {
                    const valA = a.cellData;
                    const valB = b.cellData;
                    const ascRes = lessThanOp ? (lessThanOp(valA, valB) ? -1 : 1) : String(valA).localeCompare(String(valB));
                    if (columnSort.sortDirection === WSCanvasSortDirection.Descending)
                        return -ascRes;
                    else
                        return ascRes;
                });

                sortingRowToSortedRowIndexMap = colData.map((x) => x.ri);
            }
            setRowToSortedRowIndexMap(sortingRowToSortedRowIndexMap);
            sortingRowToSortedRowIndexMap = null;
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
                    state.verticalScrollClickStartFactor = (state.scrollOffset.row + frozenRowsCount) / (state.filteredRowsCount - viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }
            } else if (state.verticalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.y / (state.verticalScrollBarRect.height - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.verticalScrollClickStartFactor = factor;
                state.verticalScrollClickStartCoord = ccoord;

                const newRowScrollOffset = Math.max(0, Math.trunc((state.filteredRowsCount - viewRowsCount) * factor));
                state.scrollOffset = state.scrollOffset.setRow(newRowScrollOffset);
            }
            return true;
        } else if (onHorizontalScrollBar) {
            const onHorizontalScrollHandle = state.horizontalScrollHandleRect && state.horizontalScrollHandleRect.contains(ccoord);

            if (onHorizontalScrollHandle) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = (state.scrollOffset.col + frozenColsCount) / (colsCount - viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }
            } else if (state.horizontalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.x / (state.horizontalScrollBarRect.width - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.horizontalScrollClickStartFactor = factor;
                state.horizontalScrollClickStartCoord = ccoord;

                const newColScrollOffset = Math.max(0, Math.trunc((colsCount - viewColsCount) * factor));
                state.scrollOffset = state.scrollOffset.setCol(newColScrollOffset);
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
                const newRowScrollOffset = Math.max(0, Math.trunc((state.filteredRowsCount - viewRowsCount) * factor));
                state.scrollOffset = state.scrollOffset.setRow(newRowScrollOffset);
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
                state.scrollOffset = state.scrollOffset.setCol(newColScrollOffset);
            }
        }
    }

    useEffect(() => {
        paint(stateNfo);
    }, [width, height, stateNfo, debugSize, getCellData, setCellData]);

    const debouncedFilter = useDebounce(stateNfo.filtersTrack, filterDebounceMs);
    useEffect(() => {
        const state = stateNfo.dup();
        const qfilter = applyFilter(state);
        sortRows(state);
        if (qfilter && qfilter.length > 0) {
            focusCell(state, new WSCanvasCellCoord(0, state.focusedFilterColIdx), true, false, true);
            rectifyScrollOffset(state);
        }
        setStateNfo(state);
    }, [debouncedFilter]);

    const paint = (state: WSCanvasState) => {
        ++state.paintcnt;

        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineWidth = 1;

                let colsXMax = 0;
                let rowsYMax = 0;

                //#region GRID LINE BACKGROUND ( to make grid lines as diff result )
                {
                    const lastViewdCol = colGetXWidth(state, state.scrollOffset.col + viewColsCount - 1);
                    colsXMax = lastViewdCol[0] + lastViewdCol[1] + (showRowNumber ? 1 : 0);
                    rowsYMax = viewRowsCount * (rowHeight + 1) + (showColNumber ? (colNumberRowHeightFull() + 1) : 0) + 1;

                    ctx.fillStyle = gridLinesColor;
                    ctx.fillRect(0, 0, (showPartialColumns && stateNfo.scrollOffset.col !== colsCount - viewColsCount) ? W : colsXMax, rowsYMax);
                }
                //#endregion

                let y = 1;
                if (showColNumber) y = colNumberRowHeightFull() + 2;

                //#region DRAW CELLS
                {
                    const drawRows = (riFrom: number, riTo: number) => {
                        for (let ri = riFrom; ri <= riTo; ++ri) {
                            if (ri >= state.filteredRowsCount) break;
                            let x = 1;
                            if (showRowNumber) x = rowNumberColWidth + 2;

                            const drawCols = (ciFrom: number, ciTo: number) => {
                                for (let ci = ciFrom; ci <= ciTo; ++ci) {
                                    const cWidth = overridenColWidth(state, ci);

                                    redrawCellInternal(state, new WSCanvasCellCoord(ri, ci), ctx, cWidth, x, y);

                                    x += cWidth + 1;
                                }
                            }

                            drawCols(0, frozenColsCount - 1);
                            drawCols(
                                state.scrollOffset.col + frozenColsCount,
                                state.scrollOffset.col + viewColsCount - ((showPartialColumns && stateNfo.scrollOffset.col !== colsCount - viewColsCount) ? 0 : 1));

                            y += rowHeight + 1;
                        }
                    };

                    drawRows(0, frozenRowsCount - 1);
                    drawRows(state.scrollOffset.row + frozenRowsCount, Math.min(state.filteredRowsCount - 1, state.scrollOffset.row + viewRowsCount - 1));
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
                            ctx.fillText(colHeader, x + cWidth / 2, y + rowHeight / 2 + 2);

                            const qSort = state.columnsSort.find((x) => x.columnIndex === ci);
                            if (qSort) {
                                let colTxt = "";
                                ctx.textAlign = "right";
                                switch (qSort.sortDirection) {
                                    case WSCanvasSortDirection.Ascending: colTxt = "\u25B4"; break;
                                    case WSCanvasSortDirection.Descending: colTxt = "\u25BE"; break;
                                }
                                ctx.fillText(colTxt, x + cWidth - filterTextMargin - 2, y + rowHeight / 2 + 2);
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
                        frozenColsCount + state.scrollOffset.col,
                        state.scrollOffset.col + viewColsCount - ((showPartialColumns && stateNfo.scrollOffset.col !== colsCount - viewColsCount) ? 0 : 1));
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
                                    height: rowHeight - 2 * filterTextMargin - 2
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
                                                focusCell(state, state.focusedCell, true, false, true);
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

                    const drawRowNumber = (riFrom: number, riTo: number) => {

                        for (let ri = riFrom; ri <= riTo; ++ri) {
                            const isSelected = highlightRowNumber && selectedRowIdxs.has(ri);

                            ctx.fillStyle = isSelected ? selectedHeaderBackgroundColor : cellNumberBackgroundColor;
                            ctx.fillRect(x, y, rowNumberColWidth, rowHeight);

                            ctx.font = isSelected ? "bold " + headerFont : headerFont;
                            ctx.fillStyle = isSelected ? selectedHeaderTextColor : cellTextColor;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            ctx.fillText(String(ri + 1), x + rowNumberColWidth / 2, y + rowHeight / 2 + 2);

                            y += rowHeight + 1;
                        }
                    };

                    if (frozenRowsCount > 0) drawRowNumber(0, frozenRowsCount - 1);
                    drawRowNumber(frozenRowsCount + state.scrollOffset.row, Math.min(state.filteredRowsCount - 1, state.scrollOffset.row + viewRowsCount - 1));
                }
                //#endregion

                //#region DRAW FROZEN ROWS SEPARATOR LINE ( optional )
                if (frozenRowsCount > 0) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = frozenCellGridLinesColor;
                    ctx.beginPath();
                    const y = 1 + (showColNumber ? colNumberRowHeightFull() : 0) + (frozenRowsCount * rowHeight) + 1;
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
                            height: rowHeight - textMargin
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
                                                    confirmCustomEdit(state);
                                                    state.focusedCell = state.focusedCell.nextRow();
                                                    rectifyScrollOffset(state);
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
                if (!showPartialColumns || stateNfo.scrollOffset.col === colsCount - viewColsCount) {
                    ctx.fillStyle = sheetBackgroundColor;
                    ctx.fillRect(colsXMax, 0, W - colsXMax, H);
                }
                //#endregion

                //#region DRAW HORIZONTAL SCROLLBAR
                if (horizontalScrollbarActive) {
                    const scrollFactor = state.scrollOffset.col / (colsCount - viewColsCount);
                    paintHorizontalScrollbar(state, ctx, scrollFactor);
                }
                //#endregion

                //#region DRAW VERTICAL SCROLLBAR
                if (verticalScrollbarActive) {
                    const scrollFactor = state.scrollOffset.row / (state.filteredRowsCount - viewRowsCount);
                    paintVerticalScrollbar(state, ctx, scrollFactor);
                }
                //#endregion
            }
        }
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
                const data = sortedGetCellData(state, cell);
                if (getCellType && getCellType(cell, data) === "boolean") {
                    keyHandled = true;
                    const boolVal = data as boolean;
                    sortedSetCellData(state, cell, !boolVal);
                }
            };

            if (state.editMode !== WSCanvasEditMode.F2 && state.focusedFilterColIdx === -1) {
                switch (e.key) {
                    case "ArrowDown":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = state.focusedCell.setRow(state.filteredRowsCount - 1);
                        else if (state.focusedCell.row < state.filteredRowsCount - 1)
                            state.focusedCell = state.focusedCell.nextRow();
                        break;

                    case "ArrowUp":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = state.focusedCell.setRow(0);
                        else if (state.focusedCell.row > 0)
                            state.focusedCell = state.focusedCell.prevRow();
                        break;

                    case "ArrowRight":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = state.focusedCell.setCol(colsCount - 1);
                        else if (state.focusedCell.col < colsCount - 1)
                            state.focusedCell = state.focusedCell.nextCol();
                        break;

                    case "ArrowLeft":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = state.focusedCell.setCol(0);
                        else if (state.focusedCell.col > 0)
                            state.focusedCell = state.focusedCell.prevCol();
                        break;

                    case "PageDown":
                        keyHandled = true;
                        state.focusedCell = state.focusedCell.setRow(Math.min(state.focusedCell.row + viewRowsCount, state.filteredRowsCount - 1));
                        break;

                    case "PageUp":
                        keyHandled = true;
                        state.focusedCell = state.focusedCell.setRow(Math.max(state.focusedCell.row - viewRowsCount, 0));
                        break;

                    case "Home":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = new WSCanvasCellCoord();
                        else
                            state.focusedCell = state.focusedCell.setCol(0);
                        break;

                    case "End":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = new WSCanvasCellCoord(state.filteredRowsCount - 1, colsCount - 1);
                        else
                            state.focusedCell = state.focusedCell.setCol(colsCount - 1);
                        break;

                    case "Enter":
                        keyHandled = true;
                        if (state.editMode !== WSCanvasEditMode.none) {
                            postEditFormat(state);
                        }
                        state.editMode = WSCanvasEditMode.none;
                        state.focusedCell = state.focusedCell.nextRow();
                        break;

                    case "Escape":
                        keyHandled = true;
                        state.editMode = WSCanvasEditMode.none;
                        break;

                    case "c":
                    case "C":
                        if (ctrl_key) {
                            keyHandled = true;
                            navigator.clipboard.writeText(sortedGetCellData(state, state.focusedCell));
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
                                    if (getCellType && getCellType(cell, sortedGetCellData(state, cell)) === "boolean") {
                                        sortedSetCellData(state, cell, text === "true");
                                    }
                                    else {
                                        sortedSetCellData(state, cell, text);
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
                            if (getCellType && getCellType(state.focusedCell, sortedGetCellData(state, state.focusedCell)) === "boolean") {
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
                                                sortedSetCellData(state, cell, "");
                                            }
                                            cellIt = cellRng.next();
                                        }
                                    }
                                    keyHandled = true;
                                    break;
                            }

                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell))) {
                                if (getCellType) {
                                    const prevData = sortedGetCellData(state, cell);
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            {
                                                if (parseFloat(e.key) !== NaN) {
                                                    sortedSetCellData(state, cell, e.key);
                                                }
                                            }
                                            break;
                                        default:
                                            sortedSetCellData(state, cell, e.key);
                                            break;
                                    }
                                }
                                else
                                    sortedSetCellData(state, cell, e.key);

                                state.editMode = WSCanvasEditMode.direct;
                            }
                            break;

                        case WSCanvasEditMode.direct:
                            switch (e.key) {
                                case "Backspace":
                                    const str = String(sortedGetCellData(state, cell));
                                    if (str.length > 0) sortedSetCellData(state, cell, str.substring(0, str.length - 1));
                                    keyHandled = true;
                                    break;
                                case "Delete":
                                    keyHandled = true;
                                    break;
                            }

                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell))) {
                                const prevData = sortedGetCellData(state, cell);
                                if (getCellType) {
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            {
                                                if (parseFloat(String(prevData) + e.key) !== NaN) {
                                                    sortedSetCellData(state, cell, String(prevData) + e.key);
                                                }
                                            }
                                            break;
                                        default:
                                            sortedSetCellData(state, cell, String(prevData) + e.key);
                                            break;
                                    }
                                }
                                else
                                    sortedSetCellData(state, cell, String(prevData) + e.key);
                            }
                            break;
                    }

                    paint(state);
                    applyState = true;
                } else {
                    state.editMode = WSCanvasEditMode.none;
                }

                if (applyState) {
                    rectifyScrollOffset(state);
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

        if (api.onPreviewMouseDown) api.onPreviewMouseDown(e, cellCoord);

        if (!e.defaultPrevented) {

            if (e.button === 0) {
                const ctrl_key = e.getModifierState("Control");
                const shift_key = e.getModifierState("Shift");

                const state = stateNfo.dup();

                if (!evalClickStart(state, ccoord)) {
                    cellCoord = canvasToCellCoord(state, ccoord, showPartialColumns);

                    if (cellCoord) {
                        if (cellCoord.row === -1 && cellCoord.col === -1) { // ENTIRE GRID SEL                        
                            state.focusedFilterColIdx = -1;
                            state.selection = new WSCanvasSelection([
                                new WSCanvasSelectionRange(
                                    new WSCanvasCellCoord(0, 0),
                                    new WSCanvasCellCoord(state.filteredRowsCount - 1, colsCount - 1)
                                )
                            ]);
                        } else if (cellCoord.col === -1) { // ROW SELECTIONS                        
                            state.focusedFilterColIdx = -1;
                            if (state.filteredRowsCount > 0) {
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
                                                setRowToSortedRowIndexMap(null);
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
                                            sortRows(state);
                                        }
                                        break;

                                    case WSCanvasColumnClickBehavior.Select:
                                        {
                                            if (state.filteredRowsCount > 0) {
                                                if (shift_key && state.selection.ranges.length > 0) {
                                                    const lastSelectionBounds = state.selection.ranges[state.selection.ranges.length - 1].bounds;

                                                    if (cellCoord.col < lastSelectionBounds.minColIdx) {
                                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, cellCoord.col),
                                                            new WSCanvasCellCoord(state.filteredRowsCount - 1, lastSelectionBounds.minColIdx - 1)
                                                        ));
                                                    } else if (cellCoord.col > lastSelectionBounds.maxColIdx) {
                                                        state.selection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, lastSelectionBounds.maxColIdx + 1),
                                                            new WSCanvasCellCoord(state.filteredRowsCount - 1, cellCoord.col)
                                                        ));
                                                    }
                                                } else {
                                                    const newRngSel = new WSCanvasSelectionRange(
                                                        new WSCanvasCellCoord(0, cellCoord.col),
                                                        new WSCanvasCellCoord(state.filteredRowsCount - 1, cellCoord.col));
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
                            focusCell(state, cellCoord, false, shift_key, !ctrl_key);
                        }
                    }
                }

                setStateNfo(state);
            }

            if (api.onMouseDown) api.onMouseDown(e, cellCoord);
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

            if (canvasRef.current) {
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

                if (state.resizingCol !== -2) {
                    const startX = state.resizingColStartNfo[0];
                    const startWidth = state.resizingColStartNfo[1];
                    const newWidth = startWidth + (x - startX);
                    state.columnWidthOverride.set(state.resizingCol, newWidth);
                }
                else if (state.verticalScrollClickStartCoord !== null)
                    evalVerticalScrollMove(state, state.verticalScrollClickStartCoord.y, ccoord.y);
                else if (state.horizontalScrollClickStartCoord !== null)
                    evalHorizontalScrollMove(state, state.horizontalScrollClickStartCoord.x, ccoord.x);
            }

            {
                const isOverCell =
                    y > (2 + colNumberRowHeightFull()) && y < (H - (horizontalScrollbarActive ? scrollBarThk : 0)) &&
                    x > (1 + (showRowNumber ? (rowNumberColWidth + 1) : 0)) && x < (W - (verticalScrollbarActive ? scrollBarThk : 0));
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
        const cell = canvasToCellCoord(stateNfo, ccoord);

        if (api.onPreviewMouseDoubleClick) api.onPreviewMouseDoubleClick(e, cell);

        if (!e.defaultPrevented) {
            if (cell) {
                if (cell.row >= 0 && cell.col >= 0) {

                    const data = sortedGetCellData(stateNfo, cell);
                    if (getCellType && getCellType(cell, data) === "boolean") {
                        const boolVal = data as boolean;
                        sortedSetCellData(stateNfo, cell, !boolVal);
                        return;
                    }

                    const state = stateNfo.dup();
                    openCellCustomEdit(state);
                    setStateNfo(state);
                }

                if (api.onMouseDown) api.onMouseDown(e, cell);
            }
        }
    }

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        if (api.onPreviewMouseWheel) api.onPreviewMouseWheel(e);

        if (!e.defaultPrevented) {
            const shift_key = e.getModifierState("Shift");
            const state = stateNfo.dup();

            if (e.deltaY > 0) {
                if (shift_key)
                    state.scrollOffset = state.scrollOffset.setCol(Math.min(state.scrollOffset.col + 1, colsCount - viewColsCount));
                else
                    state.scrollOffset = state.scrollOffset.setRow(Math.min(state.scrollOffset.row + 1, state.filteredRowsCount - viewRowsCount));
            }
            else if (e.deltaY < 0) {
                if (shift_key)
                    state.scrollOffset = state.scrollOffset.setCol(Math.max(0, state.scrollOffset.col - 1));
                else
                    state.scrollOffset = state.scrollOffset.setRow(Math.max(0, state.scrollOffset.row - 1));
            }

            setStateNfo(state);

            if (api.onMouseWheel) api.onMouseWheel(e);
        }
    }

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) return;

        const state = stateNfo.dup();

        state.scrollOffsetStart = new WSCanvasCellCoord(state.scrollOffset.row, state.scrollOffset.col);

        const touch = e.touches.item(0);
        if (touch && canvasRef.current) {
            state.touchCur = [touch.clientX, touch.clientY];
            state.touchStart = [touch.clientX, touch.clientY];
            state.touchStartTime = new Date().getTime();

            const canv = canvasRef.current;
            const x = touch.clientX - canv.offsetLeft;
            const y = touch.clientY - canv.offsetTop;
            const ccoord = new WSCanvasCoord(x, y);

            evalClickStart(state, ccoord);
        }

        setStateNfo(state);
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) return;

        const state = stateNfo.dup();

        const touch = e.touches.item(0);
        if (touch && canvasRef.current) {
            state.touchCur = [touch.clientX, touch.clientY];

            const canv = canvasRef.current;
            const x = touch.clientX - canv.offsetLeft;
            const y = touch.clientY - canv.offsetTop;
            const ccoord = new WSCanvasCoord(x, y);

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

            if (onVerticalScrollBar) {
                if (state.verticalScrollClickStartCoord === null) {
                    state.verticalScrollClickStartFactor = state.scrollOffset.row / (state.filteredRowsCount - viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }

                evalVerticalScrollMove(state, state.verticalScrollClickStartCoord.y, y);
            } else if (onHorizontalScrollBar) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = state.scrollOffset.col / (colsCount - viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }

                evalHorizontalScrollMove(state, state.horizontalScrollClickStartCoord.x, x);
            } else {
                const X_SENSITIVITY = width / 10;
                const Y_SENSITIVITY = height / 25;

                const delta = [state.touchCur[0] - state.touchStart[0], state.touchCur[1] - state.touchStart[1]];
                if (Math.abs(delta[0]) > X_SENSITIVITY || Math.abs(delta[1]) > Y_SENSITIVITY) {
                    const deltaRow = -Math.trunc(delta[1] / Y_SENSITIVITY);
                    const deltaCol = -Math.trunc(delta[0] / X_SENSITIVITY);

                    state.touchStart = [state.touchCur[0], state.touchCur[1]];

                    state.scrollOffset = new WSCanvasCellCoord(
                        Math.max(0, Math.min(state.filteredRowsCount - viewRowsCount, state.scrollOffset.row + deltaRow)),
                        Math.max(0, Math.min(colsCount - viewColsCount, state.scrollOffset.col + deltaCol)));
                }
            }
        }
        e.preventDefault();

        setStateNfo(state);
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
        const cell = canvasToCellCoord(stateNfo, new WSCanvasCoord(x, y));

        if (api.onContextMenu) api.onContextMenu(e, cell);
    }

    useLayoutEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.addEventListener("touchstart", handleTouchStart);
            canvasRef.current.addEventListener("touchmove", handleTouchMove, { passive: false });
            canvasRef.current.addEventListener("touchend", handleTouchEnd);
            return () => {
                if (canvasRef.current) {
                    canvasRef.current.removeEventListener("touchstart", handleTouchStart);
                    canvasRef.current.removeEventListener("touchmove", handleTouchMove);
                    canvasRef.current.removeEventListener("touchend", handleTouchEnd);
                }
            };
        }
        return () => { };
    }, [canvasRef, stateNfo]);

    let s = "";
    stateNfo.columnWidthOverride.forEach((x, k) => {
        s += " k:" + k + " w:" + x;
    });

    const stateNfoSize = debug ? JSON.stringify(stateNfo).length : 0;

    const DEBUG_CTL = debug ? <div ref={debugRef}>
        <b>paint cnt</b> => {stateNfo.paintcnt}<br />
        <b>state size</b> => <span style={{ color: stateNfoSize > 2000 ? "red" : "" }}>{stateNfoSize}</span><br />

        <b>graphics (w x h)</b> => frame({width} x {height}) -
        debug({debugSize.width} x {debugSize.height}) -
        canvasDiv({width} x {height - debugSize.height})<br />

        <b>grid (rows x cols))</b> => data({stateNfo.filteredRowsCount} x {colsCount}) -
        view:({viewRowsCount} x {viewColsCount})<br />

        <b>edit</b> => mode({stateNfo.editMode}) -
        cell({stateNfo.customEditCell ? (stateNfo.customEditCell.row + "," + stateNfo.customEditCell.col) : ""}) -
        focusedCell({stateNfo.focusedCell.row},{stateNfo.focusedCell.col}) -
        scrollOffset:({stateNfo.scrollOffset.row},{stateNfo.scrollOffset.col}) - overcell:{String(stateNfo.cursorOverCell)}<br />

        <b>selection</b> => {stateNfo.selection.toString()}<br />
        <b>columnSort</b> => {_.orderBy(stateNfo.columnsSort, (x) => x.sortOrder)
            .map((x, idx) => "ord:" + x.sortOrder + " col:" + x.columnIndex + " dir:" + x.sortDirection + " ; ")}<br />

        <b>misc</b> => lang({navigator.language}) - momentLocale({moment().locale()})<br />

        resizingCol:{stateNfo.resizingCol} - focusedFilterColIdx:{stateNfo.focusedFilterColIdx}
        <br />
    </div> : null;

    api.clearSelection = () => {
        const state = stateNfo.dup();
        clearSelection(state);
        setStateNfo(state);
    };

    api.focusCell = (cell, scrollTo, endingCell, clearSelection) => {
        const state = stateNfo.dup();
        focusCell(state, cell, scrollTo, endingCell, clearSelection);
        setStateNfo(state);
    }
    api.scrollTo = (coord) => {
        const state = stateNfo.dup();
        scrollTo(state, coord);
        setStateNfo(state);
    }

    api.getSelection = () => stateNfo.selection;

    api.setSorting = (newSorting) => {
        const state = stateNfo.dup();
        state.columnsSort = newSorting;
        setStateNfo(state);
    }

    const baseDivContainerStyle = {
        overflow: "hidden",
    } as CSSProperties;

    const baseCanvasStyle = {
        outline: 0,
        cursor: (stateNfo.resizingCol !== -2) ? "w-resize" :
            stateNfo.cursorOverCell ? cellCursor : outsideCellCursor
    } as CSSProperties;

    return <div ref={containerRef}
        style={{
            width: width,
            height: height,
            overflow: "hidden"
        }}>

        {DEBUG_CTL}

        <div ref={canvasDivRef}
            style={containerStyle === undefined ? baseDivContainerStyle : Object.assign(baseDivContainerStyle, containerStyle)}>

            <canvas ref={canvasRef}
                tabIndex={0}
                style={canvasStyle === undefined ? baseCanvasStyle : Object.assign(baseCanvasStyle, canvasStyle, { margin: 0, padding: 0 })}
                onWheel={handleWheel}
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
