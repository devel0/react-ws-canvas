import React, { useState, useEffect } from "react";
import {
    WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasApi, useWindowSize,
    WSCanvasStates, WSCanvasColumnClickBehavior, WSCanvasCellCoord, WSCanvasSelection, WSCanvasSelectionRange, setFieldData, getFieldData
} from "./lib";
import * as _ from 'lodash';

interface MyData {
    idx: number;
    description: string;
    timestamp: Date;
}

class IUpdateEntityNfo<T> {
    constructor(current: T, original?: T) {
        this._current = current;
        if (original)
            this._original = original;
        else
            this._original = _.cloneDeep(current);
    }
    _current: T;
    _original: T;

    get current() { return this._current; }
    get original() { return this._original; }
}

export function Sample4() {
    const [ds, setDs] = useState<IUpdateEntityNfo<MyData[]>>(new IUpdateEntityNfo<MyData[]>([], []));
    const [api, setApi] = useState<WSCanvasApi | null>(null);
    const [gridStates, setGridState] = useState<WSCanvasStates | null>(null);
    const [dirty, setDirty] = useState(false);
    const winSize = useWindowSize();
    const [colVisible, setColVisible] = useState(true);
    const [columns, setColumns] = useState<WSCanvasColumn[]>([]);

    useEffect(() => {
        const cols = [
            {
                type: "text",
                header: "ridx",
                field: "ridx",
                width: 100,
                textAlign: () => "center",
                renderTransform: (row, cell, value) => cell.row
            },
            {
                type: "number",
                header: "vidx",
                field: "idx",
                width: 100,
                sortOrder: 0,
                sortDirection: WSCanvasSortDirection.Ascending,
                lessThan: (a, b) => a < b,
                textAlign: () => "center",
                hidden: !colVisible,
            },
            {
                type: "text",
                header: "Description",
                field: "description",
                width: 100,
            },
            {
                type: "text",
                header: "Last modify",
                field: "timestamp",
                width: 250,
                readonly: true,
                renderTransform: (_row, cell, value) => {
                    const row = _row as MyData;
                    if (row) {
                        if (api && row.timestamp) {
                            return api.formatCellDataAsDateTime(row.timestamp) + " (custom user) " + row.timestamp.getTime();
                        }
                        return "";
                    }
                    return undefined;
                },
            }
        ] as WSCanvasColumn[];

        setColumns(cols);
    }, [colVisible, api]);

    useEffect(() => {
        const qcur = JSON.stringify(ds.current);
        const qorig = JSON.stringify(ds.original);
        if (qorig !== qcur && !dirty) {
            setDirty(true);
        } else if (qorig === qcur && dirty) {
            setDirty(false);
        }
    }, [ds, dirty]);

    useEffect(() => {
        const newset = new IUpdateEntityNfo<MyData[]>([{
            idx: 0,
            description: "test",
            timestamp: new Date()
        }]);
        setDs(newset);
    }, []);

    const addRow = () => {
        const newset = new IUpdateEntityNfo<MyData[]>(ds.current.slice());
        newset.current.push({
            idx: ds.current.length > 0 ? _.max(ds.current.map((r) => r.idx))! + 1 : 0,
            description: "test" + ds.current.length,
            timestamp: new Date()
        });
        setDs(newset);

        if (api && gridStates) {
            api.begin();
            const cell = new WSCanvasCellCoord(newset.current.length - 1, 2);
            api.focusCell(cell);
            api.commit();
        }
    }

    const delRow = () => {
        if (api) {
            api.begin();

            const viewRows = api.states.state.viewSelection.rowIdxs();
            const idxsToRemove: number[] = [];
            viewRows.forEach((viewRow) => {
                const rowIdx = api.viewRowToRealRow(viewRow);
                idxsToRemove.push(rowIdx);
            });

            idxsToRemove.sort((a, b) => b - a);

            api.prepareCellDataset();
            const newset = api.ds as MyData[];

            const arr = newset;
            for (let i = 0; i < idxsToRemove.length; ++i) {
                arr.splice(idxsToRemove[i], 1);
            }
            api.commitCellDataset();

            api.commit();
        }
    }

    const moveRow = (condition: (focusedViewCellRow: number) => boolean, delta: number) => {
        if (api) {
            const focusedCell = api.states.state.focusedCell;
            const focusedViewCell = api.realCellToView(focusedCell);

            if (condition(focusedViewCell.row)) {
                api.begin();

                const viewCellUpper = focusedViewCell.setRow(focusedViewCell.row + delta);
                const cellUpper = api.viewCellToReal(viewCellUpper);

                //const COL = columns.findIndex((x) => x.field === "idx"); // alternative

                //const qup = api.getCellData(new WSCanvasCellCoord(cellUpper.row, COL));  // alternative
                //const qthis = api.getCellData(new WSCanvasCellCoord(focusedCell.row, COL));  // alternative
                const qup = ds.current[cellUpper.row].idx;
                const qthis = ds.current[focusedCell.row].idx;

                api.prepareCellDataset();
                //api.setCellData(new WSCanvasCellCoord(cellUpper.row, COL), qthis);  // alternative
                //api.setCellData(new WSCanvasCellCoord(focusedCell.row, COL), qup);  // alternative
                (api.ds[cellUpper.row] as MyData).idx = qthis;
                (api.ds[focusedCell.row] as MyData).idx = qup;
                api.commitCellDataset();

                api.filter();
                api.sort();
                api.focusCell(api.viewCellToReal(viewCellUpper));
                api.selectFocusedCell();

                api.commit();;
            }
        }
    }

    const toggleCol = () => {
        setColVisible(!colVisible);
        if (api && gridStates) { api.resetView(); }
    }

    const selRealRow0 = () => {
        if (api) {
            api.begin();
            const cell = new WSCanvasCellCoord(0, 0);
            api.setRealSelection(new WSCanvasSelection([new WSCanvasSelectionRange(cell)]));
            api.focusCell(cell);
            api.commit();
        }
    }

    return <div style={{ margin: "1em" }}>

        focusedCell:{api ? api.states.state.focusedCell.toString() : ""} - focusedViewCell:{api ? api.realCellToView(api.states.state.focusedCell).toString() : ""} - rowsCount:{api ? api.states.props.rowsCount : -1} - filteredSortedrRowsCount:{api ? api.states.state.filteredSortedRowsCount : -1}<br />
        viewSelection:{api ? api.states.state.viewSelection.toString() : ""}<br />
        apiOverCell:{api ? String(api.states.state.cursorOverCell) : ""}<br />
        realToView:{(api && api.states.vm) ? api.states.vm.realToView.join('-') : ""}<br />
        viewToReal:{(api && api.states.vm) ? api.states.vm.viewToReal.join('-') : ""}<br />

        <button onClick={() => addRow()}>ADD</button>

        <button disabled={gridStates === null || gridStates.state.viewSelection.empty} onClick={() => delRow()}>DEL</button>

        <button disabled={!dirty} onClick={() => setDs(new IUpdateEntityNfo<MyData[]>(ds.current.slice()))}>SAVE</button>

        {api ?
            <button style={{ marginLeft: "1em" }}
                disabled={!(api.realCellToView(api.states.state.focusedCell).row > 0)}
                onClick={() => moveRow((vrow) => vrow > 0, -1)}>UP</button>
            : null}

        {api ?
            <button disabled={!(api.realCellToView(api.states.state.focusedCell).row < ds.current.length - 1)}
                onClick={() => moveRow((vrow) => vrow < ds.current.length - 1, +1)}>DOWN</button>
            : null}

        <button style={{ marginLeft: "1em" }} onClick={() => toggleCol()}>toggle col</button>

        <button onClick={() => selRealRow0()}>TEST SEL REAL ROW 0</button>

        <WSCanvas
            columns={columns}
            rowsCount={ds.current.length}
            rows={ds.current}
            rowGetCellData={(row, colIdx) => {
                if (row) return getFieldData(row, columns[colIdx].field);
                return "";                
            }}
            prepareCellDataset={() => ds.current.slice()}
            rowSetCellData={(row,colIdx,value) => {                
                if (row) setFieldData(row, columns[colIdx].field, value);
            }}
            commitCellDataset={(q) => { setDs(new IUpdateEntityNfo<MyData[]>(q, ds.original)); }}
            showFilter={true}

            containerStyle={{ marginTop: "1em" }}
            fullwidth
            height={Math.max(300, winSize.height * .4)}
            showColNumber={true}
            columnClickBehavior={WSCanvasColumnClickBehavior.None}

            debug={false}
            onApi={(api) => setApi(api)}
            onStateChanged={(states) => setGridState(states)}
        />
    </div>
}