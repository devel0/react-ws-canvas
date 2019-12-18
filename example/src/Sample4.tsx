import React, { useState, useEffect } from "react";
import {
    WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasColumnToSortInfo, WSCanvasApi, useWindowSize,
    WSCanvasStates, WSCanvasColumnClickBehavior, WSCanvasCellCoord
} from "./lib";
import * as _ from 'lodash';

interface MyData {
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

    // dup() {
    //     return _.cloneDeep(this) as IUpdateEntityNfo<T>;
    // }
}

export function Sample4() {
    const [ds, setDs] = useState<IUpdateEntityNfo<MyData[]>>(new IUpdateEntityNfo<MyData[]>([], []));
    const [gridApi, setGridApi] = useState<WSCanvasApi | null>(null);
    const [gridStates, setGridState] = useState<WSCanvasStates | null>(null);
    const [dirty, setDirty] = useState(false);
    const winSize = useWindowSize();

    const columns = [
        {
            type: "text",
            header: "Description",
            field: "description",
            width: 100,
            sortOrder: 0,
            sortDirection: WSCanvasSortDirection.Ascending
        },
        {
            type: "text",
            header: "Last modify",
            field: "modify_timestamp",
            width: 250
        }
    ] as WSCanvasColumn[];

    const addItem = () => {
        const newset = new IUpdateEntityNfo<MyData[]>(ds.current.slice());
        newset.current.push({ description: "test" + ds.current.length, timestamp: new Date() });
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
        const newset = new IUpdateEntityNfo<MyData[]>([{ description: "test", timestamp: new Date() }]);
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

        <WSCanvas
            containerStyle={{ marginTop: "1em" }}
            dataSource={ds}
            fullwidth
            immediateSort={false}
            height={Math.max(300, winSize.height * .4)}
            rowsCount={ds.current.length} colsCount={columns.length}
            showColNumber={true} getColumnHeader={(col) => columns[col].header}
            colWidth={(col) => columns[col].width}
            columnInitialSort={WSCanvasColumnToSortInfo(columns)}
            columnClickBehavior={WSCanvasColumnClickBehavior.ToggleSort}
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
            renderTransform={(cell) => {
                const fieldname = columns[cell.col].field;
                const row = ds.current[cell.row];
                if (row) {
                    if (fieldname === "modify_timestamp") {
                        if (gridApi && row.timestamp) {
                            return gridApi.formatCellDataAsDateTime(row.timestamp) + " (custom user) " + row.timestamp.getTime();
                        }
                        return "";
                    }
                    return (row as any)[columns[cell.col].field];
                }
                return "";
            }}
            isCellReadonly={(cell) => {
                const fieldname = columns[cell.col].field;
                return fieldname === "modify_timestamp";
            }}
            focusInsertedRow={true}
            onApi={(states, api) => setGridApi(api)}
            onStateChanged={(states) => setGridState(states)}
            onRowsAppended={(states, rowFrom, rowTo) => {
                console.log("rows appended from:" + rowFrom + " to:" + rowTo);
            }}
        />
    </div>
}