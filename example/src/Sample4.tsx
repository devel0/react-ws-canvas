import React, { useState, useEffect } from "react";
import {
    WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasApi, useWindowSize,
    WSCanvasStates, WSCanvasColumnClickBehavior, WSCanvasCellCoord, WSCanvasSelection, WSCanvasSelectionRange
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
                renderTransform: (cell, value) => cell.row
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
                renderTransform: (cell, value) => {
                    const row = ds.current[cell.row];
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

        if (colVisible) {
            cols.splice(1, 0, {
                type: "number",
                header: "vidx",
                field: "idx",
                width: 100,
                sortOrder: 0,
                sortDirection: WSCanvasSortDirection.Ascending,
                lessThan: (a, b) => a < b,
                textAlign: () => "center",
            });
        }

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

    return <div style={{ margin: "1em" }}>

        focusedCell:{api ? api.states.state.focusedCell.toString() : ""} - focusedViewCell:{api ? api.realCellToView(api.states.state.focusedCell).toString() : ""}<br />
        viewSelection:{api ? api.states.state.viewSelection.toString() : ""}<br />
        apiOverCell:{api ? String(api.states.state.cursorOverCell) : ""}<br />
        realToView:{(api && api.states.vm) ? api.states.vm.realToView.join('-') : ""}<br />
        viewToReal:{(api && api.states.vm) ? api.states.vm.viewToReal.join('-') : ""}<br />

        <button onClick={() => {
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
        }}>ADD</button>

        <button disabled={gridStates === null || gridStates.state.viewSelection.empty}
            onClick={() => {
                if (gridStates && api) {
                    const viewRows = gridStates.state.viewSelection.rowIdxs();
                    const idxsToRemove: number[] = [];
                    viewRows.forEach((viewRow) => {
                        const rowIdx = api.viewRowToRealRow(viewRow);
                        idxsToRemove.push(rowIdx);
                    });

                    idxsToRemove.sort((a, b) => b - a);

                    const newset = new IUpdateEntityNfo<MyData[]>(ds.current.slice());

                    const arr = newset.current;
                    for (let i = 0; i < idxsToRemove.length; ++i) {
                        arr.splice(idxsToRemove[i], 1);
                    }

                    setDs(newset);

                    api.begin();
                    api.clearSelection();
                    api.commit();
                }
            }}
        >
            DEL
        </button>

        <button color="primary" disabled={!dirty} onClick={() => {
            setDs(new IUpdateEntityNfo<MyData[]>(ds.current.slice()));
        }}>SAVE</button>

        {/* UP */}
        <button style={{ marginLeft: "1em" }} onClick={() => {
            if (api) {
                const focusedCell = api.states.state.focusedCell;
                const focusedViewCell = api.realCellToView(focusedCell);

                if (focusedViewCell.row > 0) {
                    api.begin();                    

                    const viewCellUpper = focusedViewCell.setRow(focusedViewCell.row - 1);
                    const cellUpper = api.viewCellToReal(viewCellUpper);

                    const qup = ds.current[cellUpper.row].idx;// api.getCellData(new WSCanvasCellCoord(cellUpper.row, COL));
                    const qthis = ds.current[focusedCell.row].idx;// api.getCellData(new WSCanvasCellCoord(focusedCell.row, COL));

                    api.prepareCellDataset();
                    // api.setCellData(new WSCanvasCellCoord(cellUpper.row, COL), qthis);
                    // api.setCellData(new WSCanvasCellCoord(focusedCell.row, COL), qup);
                    (api.ds[cellUpper.row] as MyData).idx = qthis;
                    (api.ds[focusedCell.row] as MyData).idx = qup;
                    //api.commitCellDataset();

                    api.filterAndSort();
                    api.selectFocusedCell();

                    api.commit();;
                }
            }
        }}>UP</button>

        {/* DOWN */}
        <button onClick={() => {
           
        }}>DOWN</button>

        <button style={{ marginLeft: "1em" }} onClick={() => {
            if (api && gridStates) {
                api.begin();
                const cell = new WSCanvasCellCoord(0, 0);
                api.setRealSelection(new WSCanvasSelection([new WSCanvasSelectionRange(cell, cell)]));
                api.focusCell(cell);
                api.commit();
            }
        }}>TEST SEL REAL ROW 0</button>

        <button onClick={() => {
            setColVisible(!colVisible);
            if (api && gridStates) { api.resetView(); }
        }}>
            toggle col
        </button>

        <WSCanvas
            columns={columns}
            rowsCount={ds.current.length}
            dataSource={ds}
            getCellData={(cell) => {
                const row = (ds.current as any[])[cell.row];
                if (row) return (row as any)[columns[cell.col].field];
                return "";
            }}
            prepareCellDataset={() => ds.current.slice()}
            setCellData={(q, cell, value) => {
                const row = (q as any[])[cell.row];
                if (row) { (row as any)[columns[cell.col].field] = value; }
            }}
            commitCellDataset={(q) => { setDs(new IUpdateEntityNfo<MyData[]>(q, ds.original)); }}

            containerStyle={{ marginTop: "1em" }}
            fullwidth
            height={Math.max(300, winSize.height * .4)}
            showColNumber={true}
            columnClickBehavior={WSCanvasColumnClickBehavior.ToggleSort}

            debug={false}
            onApi={(api) => setApi(api)}
            onStateChanged={(states) => setGridState(states)}
        />
    </div>
}