import React, { useState, useEffect } from "react";
import {
    WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasApi, useWindowSize,
    WSCanvasStates, WSCanvasColumnClickBehavior
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
    const [gridApi, setGridApi] = useState<WSCanvasApi | null>(null);
    const [gridStates, setGridState] = useState<WSCanvasStates | null>(null);
    const [dirty, setDirty] = useState(false);
    const winSize = useWindowSize();
    const [colVisible, setColVisible] = useState(true);
    const [columns, setColumns] = useState<WSCanvasColumn[]>([]);

    useEffect(() => {
        const cols = [
            {
                type: "text",
                header: "Description",
                field: "description",
                width: 100
            },
            {
                type: "text",
                header: "Last modify",
                field: "modify_timestamp",
                width: 250,
                readonly: true,
                renderTransform: (cell, value) => {
                    const row = ds.current[cell.row];
                    if (row) {
                        if (gridApi && row.timestamp) {
                            return gridApi.formatCellDataAsDateTime(row.timestamp) + " (custom user) " + row.timestamp.getTime();
                        }
                        return "";
                    }
                    return undefined;
                },
            }
        ] as WSCanvasColumn[];

        if (colVisible) {
            cols.splice(0, 0, {
                type: "number",
                header: "idx",
                field: "idx",
                width: 100,
                sortOrder: 0,
                sortDirection: WSCanvasSortDirection.Ascending,
                lessThan: (a, b) => a < b,
                textAlign: () => "center",
            });
        }

        setColumns(cols);
    }, [colVisible]);

    const addItem = () => {
        const newset = new IUpdateEntityNfo<MyData[]>(ds.current.slice());
        newset.current.push({
            idx: ds.current.length > 0 ? _.max(ds.current.map((r) => r.idx))! + 1 : 0,
            description: "test" + ds.current.length,
            timestamp: new Date()
        });
        setDs(newset);
    }

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

        <button onClick={() => { addItem() }}>ADD</button>

        <button disabled={gridStates === null || gridStates.state.viewSelection.empty}
            onClick={() => {
                if (gridStates && gridApi) {
                    const viewRows = gridStates.state.viewSelection.rowIdxs();
                    const idxsToRemove: number[] = [];
                    viewRows.forEach((viewRow) => {
                        const rowIdx = gridApi.viewRowToRealRow(gridStates, viewRow);
                        idxsToRemove.push(rowIdx);
                    });

                    idxsToRemove.sort((a, b) => b - a);

                    const newset = new IUpdateEntityNfo<MyData[]>(ds.current.slice());

                    const arr = newset.current;
                    for (let i = 0; i < idxsToRemove.length; ++i) {
                        arr.splice(idxsToRemove[i], 1);
                    }

                    setDs(newset);

                    gridApi.clearSelection(gridStates);
                }
            }}
        >
            DEL
        </button>

        <button color="primary" disabled={!dirty} onClick={() => {
            setDs(new IUpdateEntityNfo<MyData[]>(ds.current.slice()));
        }}>SAVE</button>

        <button onClick={() => {
            setColVisible(!colVisible); if (gridApi && gridStates) {
                gridApi.resetView();
                //gridApi.paint(gridStates, true);
            }
        }}>
            toggle col
        </button>

        <br />
        paitncnt:{gridStates && gridStates.state.paintcnt}<br />
        colWidthExpanded:{gridStates && gridStates.state.colWidthExpanded}        <br />
        colWidthExpanded:{gridStates && Array.from(gridStates.state.columnWidthOverride).map((x) => x[1].toFixed(0)).join(",")}        <br />

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
            immediateSort={false}
            height={Math.max(300, winSize.height * .4)}
            showColNumber={true}
            columnClickBehavior={WSCanvasColumnClickBehavior.ToggleSort}
            focusInsertedRow={true}

            debug={true}
            onApi={(states, api) => setGridApi(api)}
            onStateChanged={(states) => setGridState(states)}
            onRowsAppended={(states, rowFrom, rowTo) => {
                console.log("rows appended from:" + rowFrom + " to:" + rowTo);
            }}
        />
    </div>
}