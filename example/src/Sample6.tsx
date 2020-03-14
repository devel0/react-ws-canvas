import React, { useState, useEffect } from 'react';
import { WSCanvas, useWindowSize, WSCanvasColumnClickBehavior, WSCanvasColumnSortInfo, WSCanvasSortDirection, WSCanvasApi } from './lib';

export const Sample6 = () => {
    const ROWS = 10;
    const COLS = 10;

    const rndSrc = () => {
        const _rows = [];
        for (let ri = 0; ri < ROWS; ++ri) {
            const row = [];
            for (let ci = 0; ci < COLS; ++ci) {
                row.push(Math.trunc(Math.random() * ROWS));
            }
            _rows.push(row);
        }
        return _rows;
    };
    const [rows, setRows] = useState<any[][]>(rndSrc());
    const winSize = useWindowSize();
    const [api, setapi] = useState<WSCanvasApi | null>(null);
    const [useReset, setUseReset] = useState(true);
    const [resetColumnSorting, setResetColumnSorting] = useState(false);

    const setRndDatasource = () => {
        setRows(rndSrc());
        // reset the view to inform the grid that an initial sort required
        // elsewhere grid tought it was an editing effect and doesn't apply sorting
        if (api && useReset) api.resetView(resetColumnSorting); // UNCOMMENT THIS TO SEE UNSORT data after "set datasource" 2th button click
    };

    return <div>
        <button onClick={() => {
            setRndDatasource();
        }}>set datasource</button>
        
        <span>
            <input type="checkbox" id="chk" checked={useReset} onChange={(e) => { setUseReset(e.target.checked) }} />
            <label htmlFor="chk">useResetView</label>
        </span>

        <span>
            <input type="checkbox" id="chk1" checked={resetColumnSorting} onChange={(e) => { setResetColumnSorting(e.target.checked) }} />
            <label htmlFor="chk1">reset Column Sort to initial</label>
        </span>

        <WSCanvas
            width={winSize.width} height={winSize.height}
            rowsCount={rows.length} colsCount={COLS}
            showColNumber={true} showRowNumber={true}
            columnClickBehavior={WSCanvasColumnClickBehavior.ToggleSort}
            rows={rows}
            rowGetCellData={(row, colIdx) => row[colIdx]}
            prepareCellDataset={() => rows.slice()}
            commitCellDataset={(q) => setRows(q)}
            rowSetCellData={(row, colIdx, value) => row[colIdx] = value}
            onApi={(api) => setapi(api)}
            columnInitialSort={[
                {
                    columnIndex: 0,
                    sortDirection: WSCanvasSortDirection.Ascending
                } as WSCanvasColumnSortInfo
            ] as WSCanvasColumnSortInfo[]}
        />
    </div>
}