import React, { useRef, useEffect, useState, useLayoutEffect, CSSProperties } from "react";
import useDebounce, { useElementSize, toColumnName, useWindowSize, useDivMarginPadding, GraphicsSize } from "./Utils";
import { WSCanvasProps, WSCanvasCellDataNfo } from "./WSCanvasProps";
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
import ReactDOM from "react-dom";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";
import { WSCanvasApi } from "./WSCanvasApi";
import { WSCanvasStates } from "./WSCanvasStates";

export interface ViewMap {
    viewToReal: number[];
    realToView: number[];
}

export function WSCanvas(props: WSCanvasProps) {
    const winSize = useWindowSize();

    const {
        handlers,
        onApi,

        fullwidth,
        width,
        height,
        dataSource,
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
        selectFirstOnFilter,
        showPartialColumns,
        showPartialRows,
        preventWheelOnBounds,
        newRowsInsertAtViewIndex,
        focusInsertedRow,

        getCellData,
        renderTransform,
        prepareCellDataset,
        setCellData,
        commitCellDataset,
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
        immediateSort,

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

        debug,
        dbgDiv
    } = props;

    useEffect(() => {
        if (debug) console.log("*** locale");
        const lang = navigator.language;
        moment.locale(lang);
    }, [debug]);

    //#region STATE AND INIT

    const toplevelContainerDivRef = useRef<HTMLDivElement>(null);
    const canvasContainerDivRef = useRef<HTMLDivElement>(null);
    const debugRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const debugSize = useElementSize(debugRef);

    const [stateNfo, setStateNfo] = useState<WSCanvasState>(new WSCanvasState());

    const [children, setChildren] = useState<JSX.Element[]>([]);
    const [filterChildren, setFilterChildren] = useState<JSX.Element[]>([]);
    const [viewMap, setViewMap] = useState<ViewMap | null>(null);
    const [overridenRowHeight, setOverridenRowHeight] = useState<number[] | null>(null);
    const debouncedFilter = useDebounce(stateNfo.filtersTrack, filterDebounceMs);
    const debouncedColumnWidth = useDebounce(stateNfo.columnWidthOverrideTrack, recomputeRowHeightDebounceFilterMs);
    const [touchStartTime, setTouchStartTime] = useState<Date>(new Date());

    const colNumberRowHeightFull = () => colNumberRowHeight + (showFilter ? rowHeight(-1) : 0);

    const toplevel_container_size = useElementSize(toplevelContainerDivRef);
    const toplevel_container_mp = useDivMarginPadding(toplevelContainerDivRef, false);
    const canvas_container_mp = useDivMarginPadding(canvasContainerDivRef, true);

    const [cs, setCanvSize] = useState<GraphicsSize>({ width: 0, height: 0 });

    useEffect(() => {
        /** canvas width */
        let CW = fullwidth ? (winSize.width - canvas_container_mp[0] - toplevel_container_mp[0]) : (width - toplevel_container_mp[0]);

        /** canvas height */
        let CH = height - (debug ? debugSize.height : 0) - canvas_container_mp[1];

        setCanvSize({ width: CW, height: CH });
    }, [fullwidth, winSize, width, height, toplevel_container_mp, canvas_container_mp, debugSize.height, toplevel_container_size]);

    /** no side effect on vm */
    const viewRowToRealRow = (vm: ViewMap | null, viewRow: number) => {
        if (viewRow < 0) return viewRow;

        if (vm === null)
            return viewRow;
        else {
            if (vm.viewToReal)
                return vm.viewToReal[viewRow];
            else
                return viewRow;
        }
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


    const getRowHeight = (orh: number[] | null, ri: number) => {
        if (orh !== null && orh !== undefined) {
            if (ri < 0) return rowHeight(-1);
            return orh[ri];
        }
        else
            return rowHeight(ri);
    }

    // TODO: more robust computeviewRows that satisfy frozenRows, allowPartialRows
    /** no side effects on state,vm */
    const computeViewRows = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null, withHorizontalScrollbar: boolean) => {
        const h = cs.height - (showColNumber ? (colNumberRowHeightFull() + 1) : 0) - 2;
        const hAvailOrig = h - (withHorizontalScrollbar ? scrollBarThk : 0);
        if (overridenRowHeight) {
            let hAvail = hAvailOrig;
            let rCnt = 0;
            let viewRowIdx = state.viewScrollOffset.row;
            while (hAvail > 0) {
                rCnt++;
                const ri = viewRowToRealRow(vm, viewRowIdx);
                const rh = getRowHeight(orh, ri);
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
            const ww = cs.width - (showRowNumber ? (rowNumberColWidth + 1) : 0) - (withVerticalScrollbar ? scrollBarThk : 0);
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
        return Math.min(q, colsCount);
    };

    //const filteredSortedRowsCount = () => (viewMap === null) ? rowsCount : viewMap.viewToReal.length;

    const verticalScrollbarActive =
        verticalScrollbarMode === WSCanvasScrollbarMode.on ||
        (verticalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewRows(stateNfo, viewMap, overridenRowHeight, false) < stateNfo.filteredSortedRowsCount);

    const horizontalScrollbarActive =
        horizontalScrollbarMode === WSCanvasScrollbarMode.on ||
        (horizontalScrollbarMode === WSCanvasScrollbarMode.auto && computeViewCols(stateNfo, false) < colsCount);

    const buildInverseView = (map: number[]) => {
        const res = new Array<number>(rowsCount);
        for (let i = 0; i < map.length; ++i) {
            const ri = map[i];
            res[ri] = i;
        }
        return res;
    }

    const mkstates = (_state: WSCanvasState, _vm: ViewMap | null, _overridenRowHeight: number[] | null) => {
        return {
            state: _state,
            vm: _vm,
            overrideRowHeight: _overridenRowHeight
        } as WSCanvasStates;
    }

    const filterAndSort = (state: WSCanvasState, vm: ViewMap | null) => {
        let appendingRows = newRowsInsertAtViewIndex && rowsCount > state.rowsCountBackup;

        //
        // FILTER
        //
        const filteredToReal: number[] = [];
        if (rowsCount > 0) {
            if (stateNfo.filters) {
                for (let ri = 0; ri < rowsCount; ++ri) {
                    if (appendingRows && ri >= state.rowsCountBackup) break;

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
        else return;

        //
        // SORT
        //
        if (vm !== null) {
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
                        if (si > 0) {
                            colData.push({
                                ri: filteredSortedToReal[fsri],
                                cellData: getCellData(new WSCanvasCellCoord(filteredSortedToReal[fsri], columnSort.columnIndex))
                            });
                        } else {
                            colData.push({
                                ri: filteredToReal[fsri],
                                cellData: getCellData(new WSCanvasCellCoord(filteredToReal[fsri], columnSort.columnIndex))
                            });
                        }
                    }
                    // if (debug) {
                    //     for (let i=0; i < colData.length; ++i) {
                    //         console.log(colData[i].ri + " - " + colData[i].cellData);
                    //     }
                    // }

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

                    // if (debug) {
                    //     console.log("-----------");
                    //     for (let i=0; i < colData.length; ++i) {
                    //         console.log(colData[i].ri + " - " + colData[i].cellData);
                    //     }
                    // }

                    for (let fsri = 0; fsri < filteredSortedToReal.length; ++fsri) {
                        filteredSortedToReal[fsri] = colData[fsri].ri;
                    }
                }

                vm.viewToReal = filteredSortedToReal;
                vm.realToView = buildInverseView(filteredSortedToReal);
            }

            if (appendingRows && newRowsInsertAtViewIndex) {
                const newRealIdxs: number[] = [];
                for (let i = state.rowsCountBackup; i < rowsCount; ++i) newRealIdxs.push(i);
                vm.viewToReal.splice(newRowsInsertAtViewIndex, 0, ...newRealIdxs);
                vm.realToView = buildInverseView(vm.viewToReal);
            }
        }

        state.filteredSortedRowsCount = (vm === null) ? rowsCount : vm.viewToReal.length;
    }

    if (!stateNfo.initialized) {
        if (rowsCount > 0) {
            const state = stateNfo.dup();
            if (columnInitialSort)
                state.columnsSort = columnInitialSort.filter(w => w.sortDirection !== undefined && w.sortDirection !== WSCanvasSortDirection.None);

            state.initialized = true;

            const vm = {} as ViewMap;
            filterAndSort(state, vm);
            setViewMap(vm);

            setStateNfo(state);
            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, overridenRowHeight));
        }
    }

    //#endregion    

    /** [-2,0] not on screen ; -1:(row col number); [ci,cwidth] is the result */
    const xGetCol = (state: WSCanvasState, x: number, allowPartialCol: boolean = false) => {
        if (showRowNumber && x >= 1 && x <= 1 + rowNumberColWidth) return [-1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);

        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (x >= _x && x < _x + cWidth) return [ci, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + stateNfo.viewScrollOffset.col + state.viewColsCount;
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
    const viewColGetXWidth = (state: WSCanvasState, vm: ViewMap | null, qvci: number, allowPartialCol: boolean = false) => {
        if (qvci === -1) return [1, rowNumberColWidth];

        let _x = 1 + (showRowNumber ? rowNumberColWidth : 0);
        for (let ci = 0; ci < frozenColsCount; ++ci) {
            const cWidth = overridenColWidth(state, ci) + 1;
            if (ci === qvci) return [_x, cWidth];
            _x += cWidth;
        }

        let lastColView = frozenColsCount + state.viewScrollOffset.col + state.viewColsCount;
        if (allowPartialCol && lastColView < colsCount) lastColView++;

        for (let vci = frozenColsCount + state.viewScrollOffset.col; vci < lastColView; ++vci) {
            const ci = viewColToRealCol(vm, vci);
            const cWidth = overridenColWidth(state, ci) + 1;
            if (vci === qvci) return [_x, cWidth];
            _x += cWidth;
        }
        return [-2, 0];
    }

    const recomputeOverridenRowHeight = (state: WSCanvasState, onlyRowIdx?: number) => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext("2d");

            if (ctx && rowsCount > 0) {
                const rowHeightComputed = (ri: number) => {
                    let rh = rowHeight(-1);

                    if (ctx && getCellTextWrap) {
                        for (let ci = 0; ci < colsCount; ++ci) {
                            const cell = new WSCanvasCellCoord(ri, ci);
                            const colW = overridenColWidth(state, ci);
                            if (colW > 0) {
                                if (getCellTextWrap(cell, props)) {
                                    const data = renderTransform ? renderTransform(cell, getCellData(cell)) : getCellData(cell);
                                    let cellFont = font;
                                    if (getCellFont !== undefined) {
                                        const q = getCellFont(cell, props);
                                        if (q) cellFont = q;
                                    }
                                    ctx.font = cellFont;
                                    const txtWidth = ctx.measureText(data).width;
                                    const f = Math.ceil(txtWidth / colW);
                                    const q = rh * f;
                                    if (q > rh) rh = q;
                                }
                            }
                        }
                    }
                    return rh;
                }

                if (onlyRowIdx && overridenRowHeight) {
                    const hs = overridenRowHeight.slice();
                    hs[onlyRowIdx] = rowHeightComputed(onlyRowIdx);
                    setOverridenRowHeight(hs);
                } else {
                    const hs: number[] = [];
                    for (let ri = 0; ri < rowsCount; ++ri) {
                        hs.push(rowHeightComputed(ri));
                    }
                    setOverridenRowHeight(hs);
                }
            }
        }
    }

    const qViewRowsCount = computeViewRows(stateNfo, viewMap, overridenRowHeight, horizontalScrollbarActive);
    const qViewColsCount = computeViewCols(stateNfo, verticalScrollbarActive);

    if (qViewRowsCount !== stateNfo.viewRowsCount || qViewColsCount !== stateNfo.viewColsCount) {
        const state = stateNfo.dup();
        state.viewRowsCount = qViewRowsCount;
        state.viewColsCount = qViewColsCount;
        setStateNfo(state);
        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
    }

    /** no side effect on vm */
    const canvasToViewRow = (state: WSCanvasState, vm: ViewMap, orh: number[] | null, ccoord: WSCanvasCoord) => {
        const py = ccoord.y;

        // on data cells
        {
            let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
            for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + state.viewRowsCount + (showPartialRows ? 1 : 0); ++vri) {
                const ri = viewRowToRealRow(vm, vri);
                if (ri >= state.filteredSortedRowsCount) break;
                if (py >= y && py < y + getRowHeight(orh, ri)) return vri;

                y += getRowHeight(orh, ri) + 1;
            }

            return -2;
        }
    }

    // const canvasToViewCell = (state: WSCanvasState, ccoord: WSCanvasCoord, allowPartialCol: boolean = false) =>
    // new 

    const canvasToCellCoord = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null, ccoord: WSCanvasCoord, allowPartialCol: boolean) => {
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
            for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + state.viewRowsCount; ++vri) {
                if (vri >= state.filteredSortedRowsCount) break;

                const ri = viewRowToRealRow(vm, vri);

                if (py >= y && py < y + getRowHeight(orh, ri))
                    return new WSCanvasCellCoord(ri, -1);

                const rh = getRowHeight(orh, ri);

                y += rh + 1;
            }
            return null;
        }

        // on data cells        
        if (ci[0] !== -2) {
            let y = 3 + (showColNumber ? colNumberRowHeightFull() : 0);
            const evalRow = (vri: number) => {
                if (vri >= state.filteredSortedRowsCount) return new WSCanvasCellCoord(-2, -2); // sign to break loop

                const ri = viewRowToRealRow(vm, vri);
                const rh = getRowHeight(orh, ri);

                if (py >= y && py < y + rh) {
                    return new WSCanvasCellCoord(viewRowToRealRow(vm, vri), viewColToRealCol(vm, ci[0]));
                }

                y += getRowHeight(orh, ri) + 1;

                return new WSCanvasCellCoord(-3, -3); // sign to continue loop
            }
            for (let vri = 0; vri < frozenRowsCount; ++vri) {
                const q = evalRow(vri);
                if (q.row === -2) break;
                if (q.row !== -3) return q;
            }
            for (let vri = frozenRowsCount + state.viewScrollOffset.row; vri < state.viewScrollOffset.row + state.viewRowsCount + (showPartialRows ? 1 : 0); ++vri) {
                const q = evalRow(vri);
                if (q.row === -2) break;
                if (q.row !== -3) return q;
            }
        }

        return null;
    }

    /** (NO side effects on state) */
    const viewCellToCanvasCoord = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null, viewCell: WSCanvasCellCoord, allowPartialCol: boolean = false) => {
        const colXW = viewColGetXWidth(state, vm, viewCell.col, allowPartialCol);
        if (viewCell.filterRow) return new WSCanvasCoord(colXW[0], colNumberRowHeight + filterTextMargin, colXW[1], getRowHeight(orh, -1));
        let y = 1;
        for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + state.viewRowsCount; ++vri) {
            if (vri >= state.filteredSortedRowsCount) break;

            const ri = viewRowToRealRow(vm, vri);
            const rh = getRowHeight(orh, ri);

            if (vri === viewCell.row) {
                let resy = y + (showColNumber ? colNumberRowHeightFull() : 0);

                return new WSCanvasCoord(colXW[0], resy, colXW[1], rh);
            }

            y += rh + 1;
        }
        return null;
    }

    // const cellGetGeometry = (state: WSCanvasState, vm: ViewMap, cell: WSCanvasCellCoord) => {
    //     const viewCell = realCellToView(vm, cell);
    //     const q = viewCellToCanvasCoord(state, viewCell, showPartialColumns);

    // }

    const formatCellDataAsDate = (cellData: any) => moment(cellData as Date).format(dateCellMomentFormat);
    const formatCellDataAsTime = (cellData: any) => moment(cellData as Date).format(timeCellMomentFormat);
    const formatCellDataAsDateTime = (cellData: any) => moment(cellData as Date).format(dateTimeCellMomentFormat);

    /**
     * 
     * (NO side effects on state/vm) 
     * PAINT CELL
     * 
     */
    const redrawCellInternal = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null, viewCell: WSCanvasCellCoord, ctx: CanvasRenderingContext2D, cWidth: number, x: number, y: number) => {

        const cell = viewCellToReal(vm, viewCell)!;
        const isSelected = (
            ((selectFocusedCellOrRow && state.viewSelection.ranges.length === 1) || state.viewSelection.ranges.length > 1) ||
            (state.viewSelection.ranges.length === 1 && !state.viewSelection.ranges[0].from.equals(state.viewSelection.ranges[0].to))
        ) &&
            state.viewSelection.containsCell(viewCell, selectionMode);

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

        ctx.fillRect(x, y, cWidth, getRowHeight(orh, cell.row));

        if (isSelected) {
            const leftBorder = viewCell.col === 0 || !state.viewSelection.containsCell(new WSCanvasCellCoord(viewCell.row, viewCell.col - 1), selectionMode);
            const rightBorder = viewCell.col === colsCount - 1 || !state.viewSelection.containsCell(new WSCanvasCellCoord(viewCell.row, viewCell.col + 1), selectionMode);
            const topBorder = viewCell.row === 0 || !state.viewSelection.containsCell(new WSCanvasCellCoord(viewCell.row - 1, viewCell.col), selectionMode);
            const bottomBorder = viewCell.row === state.filteredSortedRowsCount - 1 || !state.viewSelection.containsCell(new WSCanvasCellCoord(viewCell.row + 1, viewCell.col), selectionMode);

            if (leftBorder || rightBorder || topBorder || bottomBorder) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.strokeStyle = selectionBorderColor;

                if (leftBorder) {
                    ctx.moveTo(x_, y_);
                    ctx.lineTo(x_, y_ + getRowHeight(orh, cell.row));
                    ctx.stroke();
                }

                if (rightBorder) {
                    ctx.moveTo(x_ + cWidth + 1, y_ - 1);
                    ctx.lineTo(x_ + cWidth + 1, y_ + getRowHeight(orh, cell.row));
                    ctx.stroke();
                }

                if (topBorder) {
                    ctx.moveTo(x_, y_ - 1);
                    ctx.lineTo(x_ + cWidth - 1, y_ - 1);
                    ctx.stroke();
                }

                if (bottomBorder) {
                    ctx.moveTo(x_, y_ + getRowHeight(orh, cell.row));
                    ctx.lineTo(x_ + cWidth - 1, y_ + getRowHeight(orh, cell.row));
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
        if (!isSelected && getCellTextColor !== undefined) {
            const q = getCellTextColor(cell, props);
            if (q) cellColor = q;
        }
        ctx.fillStyle = cellColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        let cellData = getCellData(cell);
        const RSINGLE = getRowHeight(orh, -1);
        const RH = getRowHeight(orh, cell.row);
        let posX = x + textMargin;
        let posY = y + RH / 2 - textMargin / 2 + 2;

        let str = "";
        const _cellType = getCellType ? getCellType(cell, cellData) : undefined;
        if (_cellType === undefined)
            str = renderTransform ? String(renderTransform(cell, cellData)) : String(cellData)
        else {
            const cellType = getCellType ? _cellType : "text";
            switch (cellType) {
                case "boolean":
                    const val = cellData as boolean;
                    if (val === true)
                        str = "\u25FC"; // https://www.rapidtables.com/code/text/unicode-characters.html                                        
                    else
                        str = "\u25A2";
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
                    // console.log("draw cell: " + viewCell.toString() + " y:" + y + " txt:" + cellData);
                    str = renderTransform ? renderTransform(cell, cellData) : cellData;
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

        const drawBool = () => {
            const cellType = getCellType ? _cellType : "text";
            if (cellType === "boolean") {
                const bx = x + cWidth / 2;
                const by = y + RH / 2;
                const bw = 10;
                const bh = 10;
                ctx.fillStyle = "black";
                if (cellData as boolean)
                    ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
                else {
                    ctx.beginPath();
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
                    ctx.stroke();
                }
                return true;
            }
            return false;
        }

        const textWrap = getCellTextWrap && getCellTextWrap(cell, props);
        if (textWrap && RH > RSINGLE) {
            if (!drawBool()) {
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
                        posY += getRowHeight(orh, -1);
                        line = words[i];
                    } else {
                        line += appendline;
                    }
                }
                if (line.length > 0) {
                    ctx.fillText(line, posX, posY);
                }
            }
        } else {
            if (!drawBool())
                ctx.fillText(str, posX, posY);
        }

        if (showFocusedCellOutline && state.focusedCell.row === cell.row && state.focusedCell.col === cell.col) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = focusedCellBorderColor;
            ctx.rect(x, y, cWidth, getRowHeight(orh, cell.row));
            ctx.stroke();
        }
    }

    const singleSetCellData = (cell: WSCanvasCellCoord, value: any) => {
        const q = prepareCellDataset();
        setCellData(q, cell, value);
        commitCellDataset(q);
    }

    const openCellCustomEdit = (state: WSCanvasState, cell: WSCanvasCellCoord, orh: number[] | null) => {
        if (canvasRef.current) {
            const viewCell = realCellToView(viewMap, cell);

            const xy = viewCellToCanvasCoord(state, viewMap, orh, viewCell);

            if (isCellReadonly !== undefined && isCellReadonly(cell)) return;
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
                state.customEditOrigValue = cellVal;
                state.customEditValue = cellVal;
                state.editMode = WSCanvasEditMode.F2;
            }
        }
    }

    /** side effect on state */
    const closeCustomEdit = (state: WSCanvasState, confirm: boolean) => {
        if (state.customEditCell !== null) {
            if (confirm)
                singleSetCellData(state.customEditCell, state.customEditValue);
            else
                singleSetCellData(state.customEditCell, state.customEditOrigValue);

            state.customEditCell = null;
            state.customEditValue = null;
            state.customEditOrigValue = null;
            state.editMode = WSCanvasEditMode.none;
        }
        if (canvasRef.current) {
            canvasRef.current.focus({ preventScroll: true });
        }
    }

    const horizontalScrollHanleLen = (state: WSCanvasState) => Math.max(minScrollHandleLen, (cs.width - scrollBarThk) / colsCount * state.viewColsCount);
    const verticalScrollHandleLen = (state: WSCanvasState) => Math.max(minScrollHandleLen, (cs.height - scrollBarThk) / state.filteredSortedRowsCount * state.viewRowsCount);

    /** @returns true if side effects on state */
    const paintHorizontalScrollbar = (state: WSCanvasState, ctx: CanvasRenderingContext2D, factor: number) => {
        let stateChanged = false;
        ctx.lineWidth = 1;

        const scrollHandleLen = horizontalScrollHanleLen(state);
        const scrollPos = factor * (cs.width - scrollBarThk - scrollHandleLen - 4);

        {
            const W_ = cs.width - 4 - scrollBarThk;
            const Y_ = cs.height - 2 - scrollBarThk;
            ctx.fillStyle = gridLinesColor;
            const newHorizontalScrollBarRect = new WSCanvasRect(new WSCanvasCoord(1, Y_), new WSCanvasCoord(W_ + 1, scrollBarThk), WSCanvasRectMode.pointAndSize);
            if (state.horizontalScrollBarRect === null || !newHorizontalScrollBarRect.equals(state.horizontalScrollBarRect)) {
                state.horizontalScrollBarRect = newHorizontalScrollBarRect;
                stateChanged = true;
            }

            const r = state.horizontalScrollBarRect;
            ctx.fillRect(r.leftTop.x, r.leftTop.y, r.width, r.height);

            ctx.fillStyle = cellNumberBackgroundColor;
            ctx.fillRect(W_ + 1, Y_, cs.width - (W_ + 2), scrollBarThk);
        }

        {
            const scrollBarLeftTop = new WSCanvasCoord(scrollPos, cs.height - scrollBarThk - 2);
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
        const scrollPos = factor * (cs.height - scrollBarThk - scrollHandleLen - 3);

        {
            const H_ = cs.height - 3 - scrollBarThk;
            const X_ = cs.width - 2 - scrollBarThk;
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
            const scrollBarHandleLeftTop = new WSCanvasCoord(cs.width - scrollBarThk - 2, scrollPos);
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
        state.viewSelection.clearSelection();
    }

    const setSelectionByEndingCell = (state: WSCanvasState, viewCell: WSCanvasCellCoord, endingCell: boolean = false, clearPreviousSel: boolean = true) => {
        state.viewSelection = (selectionModeMulti && endingCell) ?
            state.viewSelection.extendsTo(viewCell) :
            (!selectionModeMulti || clearPreviousSel) ?
                new WSCanvasSelection([new WSCanvasSelectionRange(viewCell, viewCell)]) :
                state.viewSelection.add(viewCell);
    }

    const postEditFormat = (state: WSCanvasState) => {
        if (getCellType) {
            const cellData = getCellData(state.focusedCell);
            const cellType = getCellType(state.focusedCell, cellData);

            switch (cellType) {
                case "date":
                    singleSetCellData(state.focusedCell, moment(cellData, dateCellMomentFormat));
                    break;
                case "time":
                    singleSetCellData(state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
                case "datetime":
                    singleSetCellData(state.focusedCell, moment(cellData, timeCellMomentFormat));
                    break;
            }
        }
    }

    /** side effect on state ; NO side effect on vm */
    const focusCell = (state: WSCanvasState, vm: ViewMap | null, cell: WSCanvasCellCoord,
        scrollTo?: boolean, endingCell?: boolean, clearPreviousSel?: boolean, dontApplySelect?: boolean) => {
        if (rowsCount === 0) return;
        if (canvasRef.current) canvasRef.current.focus({ preventScroll: true });
        const viewCell = realCellToView(vm, cell);
        if (dontApplySelect === undefined || dontApplySelect === false) setSelectionByEndingCell(state, viewCell, endingCell, clearPreviousSel);

        state.focusedCell = cell;
        closeCustomEdit(state, true);
        state.editMode = WSCanvasEditMode.none;

        if (scrollTo === true) rectifyScrollOffset(state, vm);
    }

    const evalScrollChanged = (state: WSCanvasState) => {
        if (handlers && handlers.onMouseOverCell) handlers.onMouseOverCell(mkstates(state, viewMap, overridenRowHeight), null);
    }

    /** side effect on state ; NO side effect on vm */
    const scrollTo = (state: WSCanvasState, vm: ViewMap | null, cell: WSCanvasCellCoord) => {
        const viewCell = realCellToView(vm, cell);

        // adjust scrollOffset.row
        if (viewCell.row >= state.viewScrollOffset.row + state.viewRowsCount) {
            state.viewScrollOffset = state.viewScrollOffset.setRow(Math.max(0, viewCell.row - state.viewRowsCount + 1));
        }
        else if (viewCell.row - frozenRowsCount <= state.viewScrollOffset.row) {
            state.viewScrollOffset = state.viewScrollOffset.setRow(Math.max(0, viewCell.row - frozenRowsCount));
        }

        // adjust scrollOffset.col
        if (viewCell.col >= state.viewScrollOffset.col + state.viewColsCount) {
            state.viewScrollOffset = state.viewScrollOffset.setCol(Math.max(0, viewCell.col - state.viewColsCount + 1));
        }
        else if (viewCell.col - frozenColsCount <= state.viewScrollOffset.col) {
            state.viewScrollOffset = state.viewScrollOffset.setCol(Math.max(0, viewCell.col - frozenColsCount));
        }

        evalScrollChanged(state);
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
                    state.verticalScrollClickStartFactor = (state.viewScrollOffset.row + frozenRowsCount) / (state.filteredSortedRowsCount - state.viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }
            } else if (state.verticalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.y / (state.verticalScrollBarRect.height - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.verticalScrollClickStartFactor = factor;
                state.verticalScrollClickStartCoord = ccoord;

                const newRowScrollOffset = Math.max(0, Math.trunc((state.filteredSortedRowsCount - state.viewRowsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setRow(newRowScrollOffset);
            }
            evalScrollChanged(state);
            return true;
        } else if (onHorizontalScrollBar) {
            const onHorizontalScrollHandle = state.horizontalScrollHandleRect && state.horizontalScrollHandleRect.contains(ccoord);

            if (onHorizontalScrollHandle) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = (state.viewScrollOffset.col + frozenColsCount) / (colsCount - state.viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }
            } else if (state.horizontalScrollBarRect) {
                const factor = Math.min(1, Math.max(0, ccoord.x / (state.horizontalScrollBarRect.width - scrollBarThk - SCROLL_FACTOR_TOL)));
                state.horizontalScrollClickStartFactor = factor;
                state.horizontalScrollClickStartCoord = ccoord;

                const newColScrollOffset = Math.max(0, Math.trunc((colsCount - state.viewColsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setCol(newColScrollOffset);
            }
            evalScrollChanged(state);
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
                const factor = Math.min(1, Math.max(0, factoryStart + (deltay / (cs.height - scrollBarThk - verticalScrollHandleLen(state) - 1))));
                const newRowScrollOffset = Math.max(0, Math.trunc((state.filteredSortedRowsCount - state.viewRowsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setRow(newRowScrollOffset);
                evalScrollChanged(state);
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
                const factor = Math.min(1, Math.max(0, factorxStart + (deltax / (cs.width - scrollBarThk - horizontalScrollHanleLen(state) - 1))));

                const newColScrollOffset = Math.max(0, Math.trunc((colsCount - state.viewColsCount) * factor));
                state.viewScrollOffset = state.viewScrollOffset.setCol(newColScrollOffset);
                evalScrollChanged(state);
            }
        }
    }

    /** (NO side effects on state) */
    const computeIsOverCell = (state: WSCanvasState, x: number, y: number, allowPartialCol: boolean = false) => {
        return x >= state.tableCellsBBox.leftTop.x && x <= (allowPartialCol ? cs.width : state.tableCellsBBox.rightBottom.x) &&
            y >= state.tableCellsBBox.leftTop.y && y <= state.tableCellsBBox.rightBottom.y;
    }

    /**
     *=====================================================================================================
     * PAINT
     *=====================================================================================================
     **/
    const paint = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null) => {
        if (!state.initialized) return;

        if (debug) console.log("PAINT (rows:" + rowsCount + ")");

        let stateChanged = false;
        ++state.paintcnt;

        const colwavail = cs.width - (verticalScrollbarActive ? scrollBarThk : 0) - (showRowNumber ? (rowNumberColWidth + 1) : 0);
        let colwsumbefore = 0;
        for (let ci = 0; ci < colsCount; ++ci) colwsumbefore += colWidth(ci) + 1;

        if ((state.paintcnt > 1 && colWidthExpand && colwsumbefore < colwavail && state.colWidthExpanded !== colwavail)) {

            state.widthBackup = winSize.width;
            state.heightBackup = height;
            stateChanged = true;

            let wtofillTotal = colwavail - colwsumbefore;

            if (wtofillTotal > 0) {
                if (debug) console.log("COMPUTE FILL W:" + cs.width.toFixed(0));
                // compute column width weight factor
                const wfact = new Map<number, number>();
                for (let ci = 0; ci < colsCount; ++ci) {
                    wfact.set(ci, colWidth(ci) / colwsumbefore);
                }
                // distribute space
                let wtofillUsed = 0;
                for (let ci = 0; ci < colsCount; ++ci) {
                    let wtoadd = wtofillTotal * wfact.get(ci)!;
                    if (wtofillUsed + wtoadd > wtofillTotal) wtoadd = wtofillTotal - wtofillUsed;
                    state.columnWidthOverride.set(ci, colWidth(ci) + wtoadd);
                    wtofillUsed += wtoadd;
                }
                state.colWidthExpanded = colwavail;
                state.columnWidthOverrideTrack = JSON.stringify([...state.columnWidthOverride]);
                recomputeOverridenRowHeight(state);
                stateChanged = true;
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                paint(state, vm, orh);
                return;
            }
        }

        if (canvasRef.current) {
            const canvas = canvasRef.current;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineWidth = 1;

                let colsXMax = 0;
                let rowsYMax = 0;

                //#region GRID LINE BACKGROUND ( to make grid lines as diff result ) and sheet background after last row
                {
                    const lastViewdCol = viewColGetXWidth(state, vm, state.viewScrollOffset.col + state.viewColsCount - 1);
                    colsXMax = lastViewdCol[0] + lastViewdCol[1] + (showRowNumber ? 1 : 0);
                    rowsYMax = (showColNumber ? (colNumberRowHeightFull() + 1) : 0) + 1;
                    for (let vri = state.viewScrollOffset.row; vri < state.viewScrollOffset.row + state.viewRowsCount; ++vri)
                        rowsYMax += getRowHeight(orh, viewRowToRealRow(vm, vri)) + 1;

                    const newTableCellsBBox = new WSCanvasRect(new WSCanvasCoord(0, 0), new WSCanvasCoord(colsXMax, showPartialRows ? cs.height : rowsYMax));
                    if (!state.tableCellsBBox.equals(newTableCellsBBox)) {
                        state.tableCellsBBox = newTableCellsBBox;
                        stateChanged = true;
                    }

                    const fW = (showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - state.viewColsCount) ? cs.width : colsXMax;

                    if (showPartialRows) {
                        ctx.fillStyle = gridLinesColor;
                        ctx.fillRect(0, 0, fW, cs.height);
                    }
                    else {
                        ctx.fillStyle = gridLinesColor;
                        ctx.fillRect(0, 0, fW, rowsYMax);

                        ctx.fillStyle = sheetBackgroundColor;
                        ctx.fillRect(0, rowsYMax, fW, cs.height - rowsYMax);
                    }
                }
                //#endregion

                let y = 1;
                if (showColNumber) y = colNumberRowHeightFull() + 2;

                //#region CELLS
                {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    let rowExceeded = false;
                    let colExceeded = false;

                    const drawRows = (vriFrom: number, vriTo: number, updateExceeded: boolean) => {
                        const riTo = viewRowToRealRow(vm, vriTo);
                        for (let vri = vriFrom; vri <= vriTo; ++vri) {
                            if (vri >= state.filteredSortedRowsCount) break;
                            let x = 1;
                            if (showRowNumber) x = rowNumberColWidth + 2;

                            // eslint-disable-next-line no-loop-func
                            const drawCols = (ciFrom: number, ciTo: number, updateExceededCol: boolean) => {
                                for (let ci = ciFrom; ci <= ciTo; ++ci) {
                                    const cWidth = overridenColWidth(state, ci);

                                    redrawCellInternal(state, vm, orh, new WSCanvasCellCoord(vri, ci), ctx, cWidth, x, y);

                                    x += cWidth + 1;

                                    if (updateExceededCol && state.focusedCell.col === ciTo && x > cs.width) {
                                        colExceeded = true;
                                        //return;
                                    }
                                }
                            }

                            if (frozenColsCount > 0) drawCols(0, frozenColsCount - 1, false);
                            drawCols(
                                state.viewScrollOffset.col + frozenColsCount,
                                state.viewScrollOffset.col + state.viewColsCount - ((showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - state.viewColsCount) ? 0 : 1), true);

                            const ri = viewRowToRealRow(vm, vri);
                            const rh = getRowHeight(orh, ri);
                            y += rh + 1;

                            if (colExceeded) {
                                continue;
                            }
                        }
                        if (updateExceeded && state.focusedCell.row === riTo && y > cs.height) {
                            rowExceeded = true;
                        }
                    };

                    if (rowsCount > 0) {
                        if (frozenRowsCount > 0) drawRows(0, frozenRowsCount - 1, false);
                        drawRows(state.viewScrollOffset.row + frozenRowsCount,
                            Math.min(state.filteredSortedRowsCount - 1, state.viewScrollOffset.row + state.viewRowsCount - (showPartialRows ? 0 : 1)), true);
                    }

                    // autoscroll when click on partial column
                    if (colExceeded && state.viewColsCount > 1) {
                        scrollTo(state, vm, state.focusedCell);
                        if (debug) console.log("paintfrom:1");
                        paint(state, vm, orh);
                        return;
                    }

                    // TODO: autoscroll when click on partial row                    

                    // if (rowExceeded) {
                    //     scrollTo(state, vm, state.focusedCell);
                    //     if (debug) console.log("paintfrom:2");
                    //     paint(state, vm);
                    //     return;
                    // }
                }
                //#endregion

                //#region COLUMN NUMBERS ( optional )
                if (showColNumber) {
                    y = 1;
                    let x = showRowNumber ? (rowNumberColWidth + 2) : 1;
                    const selectedViewColIdxs = state.viewSelection.colIdxs();

                    const drawColNumber = (ciFrom: number, ciTo: number) => {
                        for (let ci = ciFrom; ci <= ciTo; ++ci) {
                            const cWidth = overridenColWidth(state, ci);

                            const isSelected = highlightColNumber &&
                                ((selectionMode === WSCanvasSelectMode.Row && state.viewSelection.bounds && state.viewSelection.bounds.size > 1)
                                    || selectedViewColIdxs.has(ci));

                            ctx.fillStyle = cellNumberBackgroundColor;
                            ctx.fillRect(x, y, cWidth, colNumberRowHeightFull());

                            ctx.fillStyle = isSelected ? selectedHeaderBackgroundColor : cellNumberBackgroundColor;
                            ctx.fillRect(x, y, cWidth, colNumberRowHeight);

                            ctx.font = isSelected ? "bold " + headerFont : headerFont;
                            ctx.fillStyle = isSelected ? selectedHeaderTextColor : cellTextColor;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            const colHeader = getColumnHeader ? getColumnHeader(ci) : toColumnName(ci + 1);
                            ctx.fillText(colHeader, x + cWidth / 2, y + getRowHeight(orh, -1) / 2 + 2);

                            const qSort = state.columnsSort.find((x) => x.columnIndex === ci);
                            if (qSort) {
                                let colTxt = "";
                                ctx.textAlign = "right";

                                if (window.devicePixelRatio !== 1)
                                    ctx.font = (18 * window.devicePixelRatio) + "px Liberation Sans";

                                switch (qSort.sortDirection) {
                                    case WSCanvasSortDirection.Ascending: colTxt = "\u25B4"; break;
                                    case WSCanvasSortDirection.Descending: colTxt = "\u25BE"; break;
                                }
                                ctx.fillText(colTxt, x + cWidth - filterTextMargin - 2, y + getRowHeight(orh, -1) / 2 + 2);
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
                        state.viewScrollOffset.col + state.viewColsCount - ((showPartialColumns && stateNfo.viewScrollOffset.col !== colsCount - state.viewColsCount) ? 0 : 1));
                }
                //#endregion

                //#region FILTER EDIT
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

                    const ccoord = viewCellToCanvasCoord(state, vm, orh,
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
                                    height: getRowHeight(orh, -1) - 2 * filterTextMargin - 2
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
                                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                }}
                                onFocus={(e) => {
                                    if (stateNfo.focusedCell.row !== -1 || stateNfo.focusedCell.col !== -1) {
                                        const state = stateNfo.dup();
                                        state.focusedCell = new WSCanvasCellCoord(-1, -1);
                                        setStateNfo(state);
                                        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                    }
                                    e.target.setSelectionRange(0, e.target.value.length);
                                }}
                                onBlur={(e) => { // workaround                                                                                                            
                                    if (!canceling && e.target) e.target.focus();
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
                                                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                            }
                                            break;
                                    }
                                }} />
                        ]);
                    }
                }
                //#endregion               

                //#region ROW NUMBERS ( optional )
                if (showRowNumber) {
                    let x = 1;
                    y = showColNumber ? (colNumberRowHeightFull() + 2) : 1;
                    const selectedViewRowIdxs = state.viewSelection.rowIdxs();

                    const drawRowNumber = (vriFrom: number, vriTo: number) => {

                        for (let vri = vriFrom; vri <= vriTo; ++vri) {
                            const ri = viewRowToRealRow(vm, vri);
                            var rh = getRowHeight(orh, ri);
                            const isSelected = highlightRowNumber && selectedViewRowIdxs.has(vri);

                            ctx.fillStyle = isSelected ? selectedHeaderBackgroundColor : cellNumberBackgroundColor;
                            ctx.fillRect(x, y, rowNumberColWidth, rh);

                            ctx.font = isSelected ? "bold " + headerFont : headerFont;
                            ctx.fillStyle = isSelected ? selectedHeaderTextColor : cellTextColor;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";

                            ctx.fillText(String(vri + 1), x + rowNumberColWidth / 2, y + getRowHeight(orh, ri) / 2 + 2);

                            y += getRowHeight(orh, ri) + 1;
                        }
                    };

                    if (rowsCount > 0) {
                        if (frozenRowsCount > 0) drawRowNumber(0, frozenRowsCount - 1);
                        drawRowNumber(frozenRowsCount + state.viewScrollOffset.row,
                            Math.min(state.filteredSortedRowsCount - 1, state.viewScrollOffset.row + state.viewRowsCount - (showPartialRows ? 0 : 1)));
                    }
                }
                //#endregion

                //#region FROZEN ROWS SEPARATOR LINE ( optional )
                if (frozenRowsCount > 0) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = frozenCellGridLinesColor;
                    ctx.beginPath();
                    let y = 1 + (showColNumber ? colNumberRowHeightFull() : 0) + 1;
                    for (let fri = 0; fri < frozenRowsCount; ++fri) {
                        const rfri = viewRowToRealRow(vm, fri);
                        const rh = getRowHeight(orh, rfri);
                        y += rh;
                    }
                    ctx.moveTo(0, y);
                    ctx.lineTo(cs.width, y);
                    ctx.stroke();
                }
                //#endregion

                //#region FROZEN COLS SEPARATOR LINE ( optional )
                if (frozenColsCount > 0) {
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = frozenCellGridLinesColor;
                    ctx.beginPath();
                    let x = 2 + (showRowNumber ? rowNumberColWidth : 0);
                    for (let ci = 0; ci < frozenColsCount; ++ci) {
                        x += overridenColWidth(state, ci);
                    }
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, showPartialRows ? cs.height : rowsYMax);
                    ctx.stroke();
                }
                //#endregion

                //#region CUSTOM EDIT CELL ( editing mode )
                if (state.customEditCell === null && children.length > 0) {
                    setChildren([]);
                }

                if (state.focusedFilterColIdx === -1 && state.customEditCell !== null) {
                    const viewCell = realCellToView(vm, state.customEditCell);
                    const ccoord = viewCellToCanvasCoord(state, vm, orh, viewCell);
                    if (ccoord) {
                        let defaultEdit = true;

                        const cellWidth = overridenColWidth(state, state.customEditCell.col) - textMargin - 2;
                        const cellHeight = getRowHeight(orh, state.customEditCell.row) - textMargin;

                        const ceditStyle = {
                            font: font,
                            //background: "yellow",
                            margin: 0, padding: 0, outline: 0, border: 0,
                            position: "absolute",
                            overflow: "hidden",
                            left: canvasRef.current.offsetLeft + ccoord.x + textMargin + 1,
                            top: canvasRef.current.offsetTop + ccoord.y + textMargin,
                            width: defaultEdit ? cellWidth : undefined,
                            height: defaultEdit ? cellHeight : undefined
                        } as CSSProperties;

                        if (getCellCustomEdit) {
                            const q = getCellCustomEdit(mkstates(state, vm, overridenRowHeight), props, state.customEditCell,
                                ceditStyle, cellWidth, cellHeight);
                            if (q) {
                                defaultEdit = false;
                                setChildren([<div
                                    key={"edit:" + state.customEditCell.toString()}
                                    style={ceditStyle}>
                                    {q}
                                </div>]);
                            }
                        }

                        if (defaultEdit)
                            setChildren([
                                <input
                                    autoFocus
                                    tabIndex={-1}
                                    key="edit"
                                    style={ceditStyle}
                                    value={state.customEditValue || ""}
                                    onKeyDown={(e) => {
                                        switch (e.key) {
                                            case "Enter":
                                                {
                                                    const state = stateNfo.dup();
                                                    closeCustomEdit(state, true);
                                                    state.focusedCell = viewCellToReal(vm, realCellToView(vm, state.focusedCell).nextRow());
                                                    rectifyScrollOffset(state, vm);
                                                    setStateNfo(state);
                                                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                                }
                                                break;

                                            case "Escape":
                                                {
                                                    const state = stateNfo.dup();
                                                    closeCustomEdit(state, false);
                                                    setStateNfo(state);
                                                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                                }
                                                break;

                                            case "Tab":
                                                {
                                                    e.currentTarget.autofocus = false;
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    const state = stateNfo.dup();
                                                    closeCustomEdit(state, true);
                                                    rectifyScrollOffset(state, vm);
                                                    paint(state, vm, overridenRowHeight);
                                                    goToNextCell(state, vm, overridenRowHeight);
                                                }
                                                break;
                                        }
                                    }}
                                    onChange={(e) => {
                                        const state = stateNfo.dup();
                                        state.customEditValue = e.target.value;
                                        setStateNfo(state);
                                        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
                                    }} />
                            ]);
                    }
                }
                //#endregion

                //#region CLEAR EXCEEDING TEXT ( after ending col )                
                if (!showPartialColumns || stateNfo.viewScrollOffset.col === colsCount - state.viewColsCount) {
                    ctx.fillStyle = sheetBackgroundColor;
                    ctx.fillRect(colsXMax, 0, cs.width - colsXMax, cs.height);
                }
                //#endregion                

                //#region HORIZONTAL SCROLLBAR
                if (horizontalScrollbarActive) {
                    const scrollFactor = state.viewScrollOffset.col / (colsCount - state.viewColsCount);
                    if (paintHorizontalScrollbar(state, ctx, scrollFactor)) stateChanged = true;
                }
                //#endregion

                //#region VERTICAL SCROLLBAR
                if (verticalScrollbarActive) {
                    const scrollFactor = state.viewScrollOffset.row / (state.filteredSortedRowsCount - state.viewRowsCount);
                    if (paintVerticalScrollbar(state, ctx, scrollFactor)) stateChanged = true;
                }
                //#endregion

                if (debug) {
                    ctx.beginPath();
                    ctx.strokeStyle = "red";
                    ctx.rect(0, 0, cs.width, cs.height);
                    ctx.stroke();
                }

            }
        }

        // workaround for initial draw
        if (state.paintcnt === 1) paint(state, vm, orh);

        return stateChanged;
    };

    const entireGridSel = (state: WSCanvasState) => {
        state.focusedFilterColIdx = -1;
        state.viewSelection = new WSCanvasSelection([
            new WSCanvasSelectionRange(
                new WSCanvasCellCoord(0, 0),
                new WSCanvasCellCoord(state.filteredSortedRowsCount - 1, colsCount - 1)
            )
        ]);
    }

    const clientXYToCanvasCoord = (x: number, y: number) => {
        if (canvasRef && canvasRef.current) {
            const brect = canvasRef.current.getBoundingClientRect();
            return new WSCanvasCoord(x - brect.left, y - brect.top);
        } else return null;
    }

    const mouseCoordToCanvasCoord = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) =>
        clientXYToCanvasCoord(e.clientX, e.clientY);

    /** side effect on state */
    const goToNextCell = (state: WSCanvasState, vm: ViewMap | null, orh: number[] | null) => {
        if (canvasContainerDivRef.current) {
            canvasContainerDivRef.current.blur();
        }
        const focusedViewCell = new WSCanvasCellCoord(
            realRowToViewRow(vm, state.focusedCell.row),
            realColToViewCol(vm, state.focusedCell.col),
            state.focusedCell.filterRow);
        if (focusedViewCell.col < colsCount - 1)
            state.focusedCell = viewCellToReal(vm, focusedViewCell.nextCol());
        else if (focusedViewCell.row < rowsCount - 1)
            state.focusedCell = viewCellToReal(vm, focusedViewCell.nextRow().setCol(0));
        //        focusCell(state, vm, state.focusedCell, true, false, true);
        const newViewCell = realCellToView(vm, state.focusedCell);
        state.viewSelection = new WSCanvasSelection([new WSCanvasSelectionRange(newViewCell, newViewCell)]);
        setStateNfo(state);
        paint(state, vm, orh);
        if (canvasContainerDivRef.current) {
            canvasContainerDivRef.current.blur();
            canvasContainerDivRef.current.focus();
        }
        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
    }

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (handlers && handlers.onPreviewKeyDown) handlers.onPreviewKeyDown(mkstates(stateNfo, viewMap, overridenRowHeight), e);

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
                    singleSetCellData(cell, !boolVal);
                }
            };

            if (debug) console.log("key:" + e.key + " ctrl:" + String(ctrl_key) + " editmode:" + state.editMode);

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
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(state.filteredSortedRowsCount - 1));
                        else if (focusedViewCell.row < state.filteredSortedRowsCount - 1) {
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextRow());
                        }
                        break;

                    case "ArrowUp":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(0));
                        else if (focusedViewCell.row > 0)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.prevRow());
                        break;

                    case "ArrowRight":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(colsCount - 1));
                        else if (focusedViewCell.col < colsCount - 1)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextCol());
                        break;

                    case "ArrowLeft":
                        keyHandled = true;
                        if (ctrl_key)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setCol(0));
                        else if (focusedViewCell.col > 0)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.prevCol());
                        break;

                    case "Tab":
                        keyHandled = true;
                        if (focusedViewCell.col < colsCount - 1)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextCol());
                        else if (focusedViewCell.row < rowsCount - 1)
                            state.focusedCell = viewCellToReal(viewMap, focusedViewCell.nextRow().setCol(0));
                        break;

                    case "PageDown":
                        keyHandled = true;
                        state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(
                            Math.min(focusedViewCell.row + state.viewRowsCount, state.filteredSortedRowsCount - 1)));
                        break;

                    case "PageUp":
                        keyHandled = true;
                        state.focusedCell = viewCellToReal(viewMap, focusedViewCell.setRow(Math.max(focusedViewCell.row - state.viewRowsCount, 0)));
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
                            state.focusedCell = viewCellToReal(viewMap, new WSCanvasCellCoord(state.filteredSortedRowsCount - 1, colsCount - 1));
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

                    case "a":
                        if (ctrl_key) {
                            keyHandled = true;
                            entireGridSel(state);
                            e.preventDefault();
                            setStateNfo(state);
                            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
                            return;
                        }
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
                            const rngView = state.viewSelection;
                            let rngViewCells = rngView.cells();
                            let viewCellIt = rngViewCells.next();
                            while (!viewCellIt.done) {
                                const cell = viewCellToReal(viewMap, viewCellIt.value);
                                if (isCellReadonly === undefined || !isCellReadonly(cell)) {
                                    if (getCellType && getCellType(cell, getCellData(cell)) === "boolean") {
                                        singleSetCellData(cell, text === "true");
                                    }
                                    else {
                                        singleSetCellData(cell, text);
                                    }
                                }
                                viewCellIt = rngViewCells.next();
                            }
                        }
                        break;

                    case " ":
                        ifBoolToggle();
                        break;

                    case "F2":
                        if (getCellType && getCellType(state.focusedCell, getCellData(state.focusedCell)) === "boolean") {
                            keyHandled = true;
                        }
                        else {
                            openCellCustomEdit(state, state.focusedCell, overridenRowHeight);
                        }
                        break;
                }

                if (shift_key &&
                    (stateNfo.focusedCell.row !== state.focusedCell.row ||
                        stateNfo.focusedCell.col !== state.focusedCell.col)) {
                    setSelectionByEndingCell(state, realCellToView(viewMap, state.focusedCell), shift_key, !ctrl_key);
                }
                else
                    setSelectionByEndingCell(state, realCellToView(viewMap, state.focusedCell), false, true);

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
                                        const ds = prepareCellDataset();
                                        let viewCellRng = stateNfo.viewSelection.cells();
                                        let viewCellIt = viewCellRng.next();
                                        while (!viewCellIt.done) {
                                            const viewCell = viewCellIt.value;
                                            const cell = viewCellToReal(viewMap, viewCell);
                                            if (isCellReadonly === undefined || !isCellReadonly(cell)) {
                                                setCellData(ds, cell, "");
                                            }
                                            viewCellIt = viewCellRng.next();
                                        }
                                        commitCellDataset(ds);
                                    }
                                    keyHandled = true;
                                    break;
                            }

                            //
                            // fist character [direct editing]
                            //
                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell)) &&
                                (getCellCustomEdit === undefined || getCellCustomEdit(mkstates(state, viewMap, overridenRowHeight), props, cell) === undefined)) {
                                if (getCellType) {
                                    const prevData = renderTransform ? renderTransform(cell, getCellData(cell)) : getCellData(cell);
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            if (!isNaN(parseFloat(e.key))) {
                                                singleSetCellData(cell, e.key);
                                            }
                                            break;
                                        default:
                                            singleSetCellData(cell, e.key);
                                            break;
                                    }
                                }
                                else
                                    singleSetCellData(cell, e.key);

                                state.editMode = WSCanvasEditMode.direct;
                            }
                            break;

                        case WSCanvasEditMode.direct:
                            switch (e.key) {
                                case "Backspace":
                                    const str = renderTransform ? renderTransform(cell, String(getCellData(cell))) : String(getCellData(cell));
                                    if (str.length > 0) singleSetCellData(cell, str.substring(0, str.length - 1));
                                    keyHandled = true;
                                    break;
                                case "Delete":
                                    keyHandled = true;
                                    break;
                            }

                            if (!keyHandled && (isCellReadonly === undefined || !isCellReadonly(cell))) {
                                keyHandled = true;
                                const prevData = renderTransform ? renderTransform(cell, getCellData(cell)) : getCellData(cell);
                                if (getCellType) {
                                    const type = getCellType(cell, prevData);
                                    switch (type) {
                                        case "number":
                                            if (!isNaN(parseFloat(String(prevData) + e.key))) {
                                                singleSetCellData(cell, String(prevData) + e.key);
                                            }
                                            break;
                                        default:
                                            singleSetCellData(cell, String(prevData) + e.key);
                                            break;
                                    }
                                }
                                else
                                    singleSetCellData(cell, String(prevData) + e.key);
                            }
                            break;
                    }

                    if (debug) console.log("paintfrom:3");
                    recomputeOverridenRowHeight(state, cell.row);
                    paint(state, viewMap, overridenRowHeight);
                    applyState = true;
                } else {
                    state.editMode = WSCanvasEditMode.none;
                }

                if (keyHandled) e.preventDefault();

                if (applyState) {
                    rectifyScrollOffset(state, viewMap);
                    setStateNfo(state);
                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
                }
            }

            if (handlers && handlers.onKeyDown) handlers.onKeyDown(mkstates(state, viewMap, overridenRowHeight), e);
        }
    };

    const DOUBLE_CLICK_THRESHOLD = 300;

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        let cellCoord: WSCanvasCellCoord | null = null;
        const ccr = mouseCoordToCanvasCoord(e);
        if (ccr !== null) {
            const x = ccr.x;
            const y = ccr.y;
            const ccoord = new WSCanvasCoord(x, y);

            if (handlers && handlers.onPreviewMouseDown) handlers.onPreviewMouseDown(mkstates(stateNfo, viewMap, overridenRowHeight), e, cellCoord);

            if (!e.defaultPrevented) {

                if (e.button === 0) {
                    const ctrl_key = e.getModifierState("Control");
                    const shift_key = e.getModifierState("Shift");

                    const state = stateNfo.dup();

                    if (!evalClickStart(state, ccoord)) {
                        cellCoord = canvasToCellCoord(state, viewMap, overridenRowHeight, ccoord, showPartialColumns);

                        if (cellCoord) {
                            e.preventDefault();
                            if (cellCoord.row === -1 && cellCoord.col === -1) { // ENTIRE GRID SEL                        
                                entireGridSel(state);
                            } else if (cellCoord.col === -1) { // ROW SELECTIONS                        
                                state.focusedFilterColIdx = -1;
                                if (state.filteredSortedRowsCount > 0) {
                                    const viewCell = realCellToView(viewMap, cellCoord);

                                    if (shift_key && state.viewSelection.ranges.length > 0) {
                                        const lastViewSelectionBounds = state.viewSelection.ranges[state.viewSelection.ranges.length - 1].bounds;

                                        if (viewCell.row < lastViewSelectionBounds.minRowIdx) {
                                            state.viewSelection.ranges.push(new WSCanvasSelectionRange(
                                                new WSCanvasCellCoord(viewCell.row, 0),
                                                new WSCanvasCellCoord(lastViewSelectionBounds.minRowIdx - 1, colsCount - 1)
                                            ));
                                        } else if (viewCell.row > lastViewSelectionBounds.maxRowIdx) {
                                            state.viewSelection.ranges.push(new WSCanvasSelectionRange(
                                                new WSCanvasCellCoord(lastViewSelectionBounds.maxRowIdx + 1, 0),
                                                new WSCanvasCellCoord(viewCell.row, colsCount - 1)
                                            ));
                                        }
                                    } else {
                                        const newRngSel = new WSCanvasSelectionRange(
                                            new WSCanvasCellCoord(viewCell.row, 0),
                                            new WSCanvasCellCoord(viewCell.row, colsCount - 1));
                                        if (ctrl_key) {
                                            state.viewSelection.ranges.push(newRngSel);
                                        }
                                        else
                                            state.viewSelection = new WSCanvasSelection([newRngSel]);
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
                                            if (state.filteredSortedRowsCount > 0) {
                                                if (shift_key && state.viewSelection.ranges.length > 0) {
                                                    const lastSelectionBounds = state.viewSelection.ranges[state.viewSelection.ranges.length - 1].bounds;

                                                    if (cellCoord.col < lastSelectionBounds.minColIdx) {
                                                        state.viewSelection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, cellCoord.col),
                                                            new WSCanvasCellCoord(state.filteredSortedRowsCount - 1, lastSelectionBounds.minColIdx - 1)
                                                        ));
                                                    } else if (cellCoord.col > lastSelectionBounds.maxColIdx) {
                                                        state.viewSelection.ranges.push(new WSCanvasSelectionRange(
                                                            new WSCanvasCellCoord(0, lastSelectionBounds.maxColIdx + 1),
                                                            new WSCanvasCellCoord(state.filteredSortedRowsCount - 1, cellCoord.col)
                                                        ));
                                                    }
                                                } else {
                                                    const newRngSel = new WSCanvasSelectionRange(
                                                        new WSCanvasCellCoord(0, cellCoord.col),
                                                        new WSCanvasCellCoord(state.filteredSortedRowsCount - 1, cellCoord.col));
                                                    if (ctrl_key) {
                                                        state.viewSelection.ranges.push(newRngSel);
                                                    }
                                                    else
                                                        state.viewSelection = new WSCanvasSelection([newRngSel]);
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
                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
                }

                if (handlers && handlers.onMouseDown) handlers.onMouseDown(mkstates(stateNfo, viewMap, overridenRowHeight), e, cellCoord);
            }
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (handlers && handlers.onPreviewMouseUp) handlers.onPreviewMouseUp(mkstates(stateNfo, viewMap, overridenRowHeight), e);

        if (!e.defaultPrevented) {
            const state = stateNfo.dup();
            cleanupScrollClick(state);
            state.resizingCol = -2;
            setStateNfo(state);
            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));

            if (handlers && handlers.onMouseUp) handlers.onMouseUp(mkstates(state, viewMap, overridenRowHeight), e);
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (handlers && handlers.onPreviewMouseMove) handlers.onPreviewMouseMove(mkstates(stateNfo, viewMap, overridenRowHeight), e);

        if (!e.defaultPrevented) {
            const ccr = mouseCoordToCanvasCoord(e);
            if (ccr !== null) {
                const x = ccr.x;
                const y = ccr.y;
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

                if (handlers && handlers.onMouseOverCell) {
                    const q = canvasToCellCoord(stateNfo, viewMap, overridenRowHeight, ccr, showPartialColumns);
                    const xy = [e.clientX, e.clientY];
                    if (q != null) {
                        handlers.onMouseOverCell(mkstates(stateNfo, viewMap, overridenRowHeight), { xy: xy, cell: q });
                    }
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

                            if (qCol[0] > -2) {
                                let tryResizingCol = qCol[0];
                                let colX = viewColGetXWidth(stateNfo, viewMap, tryResizingCol, showPartialColumns);
                                cwidth = colX[1];
                                let skip = false; // workaround avoid cursor flicker

                                if (Math.abs(x - colX[0]) < 2 * RESIZE_HANDLE_TOL) {
                                    skip = true;
                                } else if (x - colX[0] > RESIZE_HANDLE_TOL) {
                                    ++tryResizingCol;
                                    colX = viewColGetXWidth(stateNfo, viewMap, tryResizingCol, showPartialColumns);
                                    cwidth = colX[1];
                                }

                                if (qCol[0] === colsCount - 1) {
                                    const lastX = stateNfo.tableCellsBBox.rightBottom.x;
                                    if (Math.abs(x - lastX) <= RESIZE_HANDLE_TOL) {
                                        resizingCol = colsCount - 1;
                                        cwidth = viewColGetXWidth(stateNfo, viewMap, resizingCol)[1];
                                    }
                                }

                                if (!skip && (x === colX[0] || (colX[0] >= x - RESIZE_HANDLE_TOL && colX[0] <= x + RESIZE_HANDLE_TOL))) {
                                    resizingCol = tryResizingCol - 1;
                                    cwidth = viewColGetXWidth(stateNfo, viewMap, resizingCol)[1];
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

                if (viewMap) {
                    const hoveredViewRow = canvasToViewRow(stateNfo, viewMap, overridenRowHeight, ccoord);
                    if (hoveredViewRow !== -2 && hoveredViewRow !== stateNfo.hoveredViewRow) {
                        if (state === undefined) {
                            state = stateNfo.dup();
                            stateUpdated = true;
                        }
                        state.hoveredViewRow = hoveredViewRow;
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

                    //
                    // RESIZE COLUMN
                    //
                    if (state.resizingCol !== -2) {
                        const startX = state.resizingColStartNfo[0];
                        const startWidth = state.resizingColStartNfo[1];
                        const newWidth = startWidth + (x - startX);

                        // console.log("NEW WIDTH:" + newWidth);
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

                if (stateUpdated) {
                    setStateNfo(state!);
                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state!, viewMap, overridenRowHeight));
                }

                if (handlers && handlers.onMouseMove) handlers.onMouseMove(mkstates(stateNfo, viewMap, overridenRowHeight), e);
            }
        }
    }

    const dblClick = (state: WSCanvasState, cell: WSCanvasCellCoord, x: number, y: number) => {
        if (cell) {
            if (cell.row >= 0 && cell.col >= 0) {
                const data = getCellData(cell);
                if (getCellType && getCellType(cell, data) === "boolean") {
                    const boolVal = data as boolean;
                    singleSetCellData(cell, !boolVal);
                    paint(state, viewMap, overridenRowHeight);
                    if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
                    return;
                }

                focusCell(state, viewMap, cell);
                openCellCustomEdit(state, cell, overridenRowHeight);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
            }
        }

    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const ccr = mouseCoordToCanvasCoord(e);

        if (ccr !== null) {
            const x = ccr.x;
            const y = ccr.y;

            const ccoord = new WSCanvasCoord(x, y);
            const cell = canvasToCellCoord(stateNfo, viewMap, overridenRowHeight, ccoord, showPartialColumns);

            if (handlers && handlers.onPreviewMouseDoubleClick) handlers.onPreviewMouseDoubleClick(mkstates(stateNfo, viewMap, overridenRowHeight), e, cell);

            if (!e.defaultPrevented) {
                if (cell) {
                    const state = stateNfo.dup();
                    dblClick(state, cell, x, y);
                    if (handlers && handlers.onMouseDoubleClick) handlers.onMouseDoubleClick(mkstates(state, viewMap, overridenRowHeight), e, cell);
                    setStateNfo(state);
                }
            }
        }
    }

    const handleWheel = (e: WheelEvent) => {
        if (handlers && handlers.onPreviewMouseWheel) handlers.onPreviewMouseWheel(mkstates(stateNfo, viewMap, overridenRowHeight), e);

        if (!e.defaultPrevented && stateNfo.cursorOverCell) {
            const shift_key = e.getModifierState("Shift");
            const state = stateNfo.dup();
            let prevent = true;

            if (e.deltaY > 0) {
                if (shift_key) {
                    if (!preventWheelOnBounds && state.viewScrollOffset.col === colsCount - state.viewColsCount) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setCol(Math.min(state.viewScrollOffset.col + 1, colsCount - state.viewColsCount));
                }
                else {
                    if (!preventWheelOnBounds && state.viewScrollOffset.row === state.filteredSortedRowsCount - state.viewRowsCount) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setRow(Math.min(state.viewScrollOffset.row + 1, state.filteredSortedRowsCount - state.viewRowsCount));
                }
            }
            else if (e.deltaY < 0) {
                // console.log("SCROLL UP");
                if (shift_key) {
                    if (!preventWheelOnBounds && state.viewScrollOffset.col === 0) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setCol(Math.max(0, state.viewScrollOffset.col - (showPartialRows ? 2 : 1)));
                }
                else {
                    if (!preventWheelOnBounds && state.viewScrollOffset.row === 0) prevent = false;
                    state.viewScrollOffset = state.viewScrollOffset.setRow(Math.max(0, state.viewScrollOffset.row - (showPartialRows ? 2 : 1)));
                }
            }

            evalScrollChanged(state);

            setStateNfo(state);
            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));

            if (prevent) {
                e.preventDefault();
            }

            if (handlers && handlers.onMouseWheel) handlers.onMouseWheel(mkstates(state, viewMap, overridenRowHeight), e);
        }
    }

    const getTouchPos = (canvas: HTMLCanvasElement, e: TouchEvent) => {
        var rect = canvas.getBoundingClientRect();
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) return;
        const touch = e.touches.item(0);

        const nowDate = new Date();
        const clkDiff = (nowDate.getTime() - touchStartTime.getTime())
        setTouchStartTime(nowDate);

        const state = stateNfo.dup();

        state.scrollOffsetStart = new WSCanvasCellCoord(state.viewScrollOffset.row, state.viewScrollOffset.col);

        if (touch && canvasRef.current) {
            const pos = getTouchPos(canvasRef.current, e);

            const x = pos.x;
            const y = pos.y;

            state.touchCur = [x, y];
            state.touchStart = [x, y];
            state.touchStartTime = new Date().getTime();

            const ccoord = new WSCanvasCoord(x, y);
            const isOverCell = computeIsOverCell(state, x, y, true);
            state.cursorOverCell = isOverCell;

            evalClickStart(state, ccoord);

            if (clkDiff < DOUBLE_CLICK_THRESHOLD) {
                e.preventDefault();

                const cell = canvasToCellCoord(state, viewMap, overridenRowHeight, ccoord, showPartialColumns);

                if (cell) dblClick(state, cell, x, y);
            }
        }

        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
        setStateNfo(state);
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) return;

        const touch = e.touches.item(0);
        if (touch && canvasRef.current) {
            const pos = getTouchPos(canvasRef.current, e);

            const x = pos.x;
            const y = pos.y;

            const xs = stateNfo.touchCur[0];
            const ys = stateNfo.touchCur[1];

            const dx = x - xs;
            const dy = y - ys;

            if (debug) console.log("touch dx:" + dx + " dy:" + dy);

            if (dx === 0 && dy === 0) return;

            const state = stateNfo.dup();
            state.touchCur = [x, y];

            const ccoord = new WSCanvasCoord(x, y);
            let matches = false;

            const isOverCell = computeIsOverCell(stateNfo, xs, ys, true);

            state.cursorOverCell = isOverCell;

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

            if (state.horizontalScrollClickStartCoord === null && (onVerticalScrollBar || state.verticalScrollClickStartCoord)) {
                if (state.verticalScrollClickStartCoord === null) {
                    state.verticalScrollClickStartFactor = state.viewScrollOffset.row / (state.filteredSortedRowsCount - state.viewRowsCount);
                    state.verticalScrollClickStartCoord = ccoord;
                }

                evalVerticalScrollMove(state, state.verticalScrollClickStartCoord.y, y);

                matches = true;
            } else if (onHorizontalScrollBar || state.horizontalScrollClickStartCoord) {
                if (state.horizontalScrollClickStartCoord === null) {
                    state.horizontalScrollClickStartFactor = state.viewScrollOffset.col / (colsCount - state.viewColsCount);
                    state.horizontalScrollClickStartCoord = ccoord;
                }

                evalHorizontalScrollMove(state, state.horizontalScrollClickStartCoord.x, x);

                matches = true;
            } else if (isOverCell) {
                const X_SENSITIVITY = 5; //width / 20;
                const Y_SENSITIVITY = 1; //height / 25;

                const delta = [dx, dy];

                let deltaRow = 0;
                let deltaCol = 0;

                if (Math.abs(delta[0]) > X_SENSITIVITY)
                    deltaCol = delta[0] === 0 ? 0 : (delta[0] > 0 ? -1 : 1);// -Math.trunc(delta[0] / X_SENSITIVITY);

                if (Math.abs(delta[1]) > Y_SENSITIVITY)
                    deltaRow = delta[1] === 0 ? 0 : (delta[1] > 0 ? -1 : 1); // -Math.trunc(delta[1] / Y_SENSITIVITY);

                if (deltaRow !== 0 || deltaCol !== 0) {
                    state.viewScrollOffset = new WSCanvasCellCoord(
                        Math.max(0, Math.min(state.filteredSortedRowsCount - state.viewRowsCount, state.viewScrollOffset.row + deltaRow)),
                        Math.max(0, Math.min(colsCount - state.viewColsCount, state.viewScrollOffset.col + deltaCol)));
                }

                matches = true;
            }

            if (matches || state.horizontalScrollClickStartCoord !== null || state.verticalScrollClickStartCoord !== null) {
                e.preventDefault();
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
            }
        }
    }

    const handleTouchEnd = (e: TouchEvent) => {
        if (stateNfo.verticalScrollClickStartCoord || stateNfo.horizontalScrollClickStartCoord) {
            const state = stateNfo.dup();
            state.horizontalScrollClickStartCoord = null;
            state.verticalScrollClickStartCoord = null;
            setStateNfo(state);
            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
        }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (canvasRef.current) {
            canvasRef.current.setPointerCapture(e.pointerId);
        }
    }

    const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const ccr = mouseCoordToCanvasCoord(e);
        if (ccr !== null) {
            const x = ccr.x;
            const y = ccr.y;
            const cell = canvasToCellCoord(stateNfo, viewMap, overridenRowHeight, new WSCanvasCoord(x, y), showPartialColumns);

            if (handlers && handlers.onContextMenu) handlers.onContextMenu(mkstates(stateNfo, viewMap, overridenRowHeight), e, cell);
        }
    }

    /**
    *=====================================================================================================
    * EFFECTS
    *=====================================================================================================
    **/

    //#region EFFECTS

    useEffect(() => {
        if (debug) console.log("*** state.initialized");
        if (stateNfo.initialized) {
            if (overridenRowHeight === null && rowsCount > 0 && canvasRef.current && canvasRef.current.getContext('2d')) {
                const state = stateNfo.dup();
                const vm = {} as ViewMap;
                filterAndSort(state, vm);
                recomputeGeometry2(state, vm);
                recomputeOverridenRowHeight(state);
                if (debug) console.log("paintfrom:4");
                paint(state, viewMap, overridenRowHeight);
                setViewMap(vm);
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, overridenRowHeight));
            }
        }
    }, [stateNfo.initialized]);

    const recomputeGeometry1 = (state: WSCanvasState, vm: ViewMap | null) => {
        const newViewRowsCount = computeViewRows(state, vm, overridenRowHeight, horizontalScrollbarActive);
        const newViewColsCount = computeViewCols(state, verticalScrollbarActive);

        if (newViewRowsCount !== state.viewRowsCount || newViewColsCount !== state.viewColsCount) {
            state.viewRowsCount = newViewRowsCount;
            state.viewColsCount = newViewColsCount;
        }
    }

    const recomputeGeometry2 = (state: WSCanvasState, vm: ViewMap | null) => {
        recomputeGeometry1(state, vm);
        recomputeOverridenRowHeight(state);
    }

    //#region RECOMPUTE ROW HEIGHT when COLUMN WIDTH changes
    useEffect(() => {
        if (debug) console.log("*** debounceCol");
        const state = stateNfo.dup();
        const vm = {} as ViewMap;
        filterAndSort(state, vm);
        recomputeGeometry2(state, vm);
        setViewMap(vm);
        setStateNfo(state);
        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, overridenRowHeight));
    }, [debouncedColumnWidth]);
    //#endregion 

    const rebuildView = (doSort: boolean) => {
        const state = stateNfo.dup();
        let vm = viewMap;
        if (state.editMode !== WSCanvasEditMode.direct && doSort) {
            vm = {} as ViewMap;
            filterAndSort(state, vm);
        }
        recomputeGeometry2(state, vm);
        if (debug) console.log("paintfrom:5");
        if (focusInsertedRow && rowsCount > state.rowsCountBackup) {
            state.focusedCell = new WSCanvasCellCoord(rowsCount - 1, 0);
        }
        paint(state, vm, overridenRowHeight);
        state.rowsCountBackup = rowsCount;
        setViewMap(vm);
        setStateNfo(state);
        if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, overridenRowHeight));
    }

    useEffect(() => {
        if (debug) console.log("*** dataSource");

        rebuildView(immediateSort);
    }, [dataSource, rowsCount]);

    useEffect(() => {
        if (!immediateSort) {
            if (debug) console.log("*** rowsCount");
            rebuildView(true);
        }
    }, [rowsCount]);

    //#region APPLY FILTER 
    useEffect(() => {
        if (debug) console.log("*** debounceFilter");
        const vm = {} as ViewMap;
        const state = stateNfo.dup();
        if (stateNfo.initialized && rowsCount > 0) {
            filterAndSort(state, vm);
            recomputeGeometry2(state, vm);

            if (stateNfo.focusedFilterColIdx >= 0 && viewMap) {
                const q = viewCellToReal(vm, new WSCanvasCellCoord(0, viewColToRealCol(vm, state.focusedFilterColIdx)));
                focusCell(state, vm, q, true, false, true, !selectFirstOnFilter);
                rectifyScrollOffset(state, vm);
            }

            setViewMap(vm);
            setStateNfo(state);
            if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, overridenRowHeight));
        }
    }, [debouncedFilter]);
    //#endregion     

    useEffect(() => {
        const state = stateNfo.dup();
        state.winSizeBackup = _.cloneDeep(winSize);
        setStateNfo(state);
    }, [winSize.width, winSize.height]);

    useEffect(() => {
        if (debug) console.log("*** resize width:" + width + " winSize:" + winSize.width);
        if (debug) console.log("paintfrom:6");
        paint(stateNfo, viewMap, overridenRowHeight);
    }, [winSize.width, winSize.height, width, height, debugSize, stateNfo.widthBackup, stateNfo.heightBackup]);

    useEffect(() => {
        if (debug) console.log("*** state, vm");
        if (debug) console.log("paintfrom:7");
        paint(stateNfo, viewMap, overridenRowHeight);
    }, [stateNfo]);

    // useEffect(() => {
    //     if (debug) console.log("*** rowsCount");
    //     if (debug) console.log("paintfrom:8");
    //     paint(stateNfo, viewMap, overridenRowHeight);
    // }, [rowsCount]);

    useLayoutEffect(() => {
        if (debug) console.log("*** layout");
        if (canvasRef.current) {

            // https://github.com/inuyaksa/jquery.nicescroll/issues/799#issuecomment-482200470
            canvasRef.current.addEventListener("wheel", handleWheel, { passive: false });
            canvasRef.current.addEventListener("touchstart", handleTouchStart);
            canvasRef.current.addEventListener("touchmove", handleTouchMove, { passive: false });
            canvasRef.current.addEventListener("touchend", handleTouchEnd);

            const crc = canvasRef.current;

            return () => {
                if (crc) {
                    crc.removeEventListener("wheel", handleWheel);
                    crc.removeEventListener("touchstart", handleTouchStart);
                    crc.removeEventListener("touchmove", handleTouchMove);
                    crc.removeEventListener("touchend", handleTouchEnd);
                }
            };
        }
        return () => { };
    }, [canvasRef, stateNfo]);

    //#endregion

    //#region API    
    useEffect(() => {
        if (onApi) {
            const api = new WSCanvasApi();

            api.clearSelection = (states) => {
                const state = states.state.dup();
                clearSelection(state);
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
            };

            api.getSelection = (states) => states.state.viewSelection;
            api.setSelection = (states, selection: WSCanvasSelection) => {
                const state = states.state.dup();
                state.viewSelection = selection;
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, viewMap, overridenRowHeight));
            }
            api.closeCustomEdit = (states, confirm) => {
                const state = states.state.dup();
                closeCustomEdit(state, confirm);
                setStateNfo(state);
            }
            api.setCustomEditValue = (states, val) => {
                const state = states.state.dup();
                state.customEditValue = val;
                setStateNfo(state);
            }
            api.goToNextCell = (states) => {
                goToNextCell(states.state, states.vm, states.overrideRowHeight);
            }
            api.triggerKey = (states, e: React.KeyboardEvent) => {
                handleKeyDown(e);
            }
            api.clientXYToCanvasCoord = (states, x: number, y: number) => clientXYToCanvasCoord(x, y);
            api.cellToCanvasCoord = (states, cell) => {
                const state = states.state;
                const vm = states.vm;
                const orh = states.overrideRowHeight;
                const viewCell = realCellToView(vm, cell);
                const leftTopCell = viewCellToCanvasCoord(state, vm, orh, state.viewScrollOffset, props.showPartialColumns);
                const tmp = viewCellToCanvasCoord(state, vm, orh, viewCell, props.showPartialColumns);
                if (leftTopCell && tmp) {
                    return new WSCanvasCoord(
                        tmp.x - leftTopCell.x + (showRowNumber ? rowNumberColWidth : 0),
                        tmp.y - leftTopCell.y + (showColNumber ? colNumberRowHeightFull() : 0),
                        tmp.width, tmp.height);
                } else return null;
            }
            api.canvasCoordToCellCoord = (states, ccoord) => canvasToCellCoord(states.state, states.vm, states.overrideRowHeight, ccoord, showPartialColumns);
            api.canvasCoord = (states) => {
                if (canvasRef && canvasRef.current) {
                    const c = canvasRef.current;
                    const br = c.getBoundingClientRect();
                    return new WSCanvasCoord(br.left, br.top, br.width, br.height);
                } else return null;
            }
            api.focusCell = (states, cell, scrollTo, endingCell, clearSelection) => {
                const state = states.state.dup();
                const vm = states.vm;
                const orh = states.overrideRowHeight;
                focusCell(state, vm, cell, scrollTo, endingCell, clearSelection);
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
            }
            //

            api.scrollTo = (states, coord) => {
                const state = states.state.dup();
                const vm = states.vm;
                const orh = states.overrideRowHeight;
                scrollTo(state, vm, coord);
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
            }
            api.setSorting = (states, newSorting) => {
                const state = stateNfo.dup();
                const vm = states.vm;
                const orh = states.overrideRowHeight;
                state.columnsSort = newSorting;
                setStateNfo(state);
                if (handlers && handlers.onStateChanged) handlers.onStateChanged(mkstates(state, vm, orh));
            }
            api.viewRowToRealRow = ((states, viewRow) => viewRowToRealRow(states.vm, viewRow));
            api.formatCellDataAsDate = (cellData: any) => formatCellDataAsDate(cellData);
            api.formatCellDataAsTime = (cellData: any) => formatCellDataAsDate(cellData);
            api.formatCellDataAsDateTime = (cellData: any) => formatCellDataAsDateTime(cellData);
            api.paint = (states) => paint(states.state, states.vm, states.overrideRowHeight);

            onApi(mkstates(stateNfo, viewMap, overridenRowHeight), api);
        }
    }, [dataSource]);
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
            <b>paint cnt</b> => {stateNfo.paintcnt} ; <b>W:</b> => {cs.width.toFixed(0)} x <b>H:</b> => {cs.height.toFixed(0)}<br />
            <b>state size</b> => <span style={{ color: stateNfoSize > 2000 ? "red" : "" }}>{stateNfoSize}</span><br />
            <b>rows cnt</b> => {rowsCount} ; filtered:{stateNfo.filteredSortedRowsCount} ; focused:{stateNfo.focusedCell.toString()} ; scroll:{stateNfo.viewScrollOffset.toString()} ; isOverCell:{String(stateNfo.cursorOverCell)}<br />
            <b>custom edit val</b> => {stateNfo.customEditValue}<br />
        </div> : null;
    }
    //#endregion

    if (debug) {
        if (dbgDiv && dbgDiv.current && DEBUG_CTL) {
            ReactDOM.render(DEBUG_CTL, dbgDiv.current);
        }
    }
    else {
        if (dbgDiv && dbgDiv.current) {
            ReactDOM.unmountComponentAtNode(dbgDiv.current);
        }
    }

    return <div ref={toplevelContainerDivRef}
        style={{
            width: fullwidth ? winSize.width : width,
            border: debug ? "1px solid blue" : "",
            overflow: "hidden"
        }}>

        <div ref={canvasContainerDivRef}
            style={containerStyle === undefined ? baseDivContainerStyle : Object.assign(baseDivContainerStyle, containerStyle)}>

            {/* verticalActive:{String(verticalScrollbarActive)}
            outer size: {fullwidth ? winSize.width : width} x {height}<br />
            toplevel_container_mp:{toplevel_container_mp} ( size: {toplevel_container_size.width} x {toplevel_container_size.height} )<br />
            canvas_container_mp{canvas_container_mp}<br />
            canvas size:{cs.width} x {cs.height}<br /> */}

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
                width={cs.width}
                height={cs.height}
            />
        </div>

        {children}

        {filterChildren}
    </div>
}

WSCanvas.defaultProps = WSCanvasPropsDefault();
