import { WSCanvas, WSCanvasColumn, WSCanvasSortDirection, useWindowSize, setFieldData, WSCanvasSelectMode, WSCanvasApi } from "./lib";

import React, { useState, useEffect } from "react";
import * as _ from 'lodash';

interface MyData {
  col1: string;
  col2: number;
  col3: boolean;
  col4: Date;
  col5: Date;
  col6: Date;
}

export function Sample2() {
  const [rows, setRows] = useState<MyData[]>([]);
  const winSize = useWindowSize();
  const [useGlobalFilter, setUseGlobalFilter] = useState(false);
  const [logEditingToConsole, setLogEditingToConsole] = useState(false);
  const [api, setapi] = useState<WSCanvasApi | null>(null);

  const ROWS = 5000;

  const columns = [
    {
      type: "text",
      header: "col1",
      field: "col1",
      textAlign: () => "center",
      lessThan: (a, b) => {
        const aNr = parseInt((a as string).replace("r", ""));
        const bNr = parseInt((b as string).replace("r", ""));

        return aNr < bNr;
      },
      sortDirection: WSCanvasSortDirection.Descending,
      sortOrder: 1,
      width: 120,
    },
    {
      type: "number",
      header: "col2",
      field: "col2",
      lessThan: (a, b) => (a as number) < (b as number),
      sortDirection: WSCanvasSortDirection.Ascending,
      sortOrder: 0,
    },
    {
      type: "boolean",
      header: "col3",
      field: "col3",
      onChanging: (states, row, cell, oldValue, newValue) => {
        // set to false to inhibit editing
        return true;
      },
      onChanged: (states, _row, cell, oldValue, newValue) => {
        const row = _row as MyData;
        console.log("changed boolean column from [" + String(oldValue) + "] to [" + String(row.col3) + "]");
      },
    },
    {
      type: "date",
      header: "col4",
      field: "col4",
      lessThan: (a, b) => (a as Date) < (b as Date)
    },
    {
      type: "time",
      header: "col5",
      field: "col5"
    },
    {
      type: "datetime",
      header: "col6",
      field: "col6",
    },
  ] as WSCanvasColumn[];

  useEffect(() => {
    console.log("GENERATE DATA");

    const _rows: MyData[] = [];
    for (let ri = 0; ri < ROWS; ++ri) {
      _rows.push({
        col1: "r" + ri,
        col2: Math.trunc(ri / 4) * 10,
        col3: ri % 2 === 0,
        col4: new Date(new Date().getTime() + (ri * 24 * 60 * 60 * 1000)), // +1 day
        col5: new Date(new Date().getTime() + (ri * 60 * 1000)), // +1 min
        col6: new Date(new Date().getTime() + (ri * 24 * 60 * 60 * 1000 + ri * 60 * 1000)), // +1 day +1min
      });
    }

    setRows(_rows);
  }, []);

  useEffect(() => {
    if (api) api.resetView();
  }, [useGlobalFilter]);

  return <div>
    <span style={{ margin: "1em" }}>
      <input type="checkbox" id="chk" checked={useGlobalFilter} onChange={(e) => { setUseGlobalFilter(e.target.checked) }} />
      <label htmlFor="chk">globalFilter col1 contains "1"</label>
    </span>
    <span style={{ margin: "1em" }}>
      <input type="checkbox" id="chk1" checked={logEditingToConsole} onChange={(e) => { setLogEditingToConsole(e.target.checked) }} />
      <label htmlFor="chk1">log editing to console</label>
    </span>
    <WSCanvas
      columns={columns}
      rowsCount={rows.length}
      rows={rows}
      rowGetCellData={(row, colIdx) => row[columns[colIdx].field]}
      // getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
      prepareCellDataset={() => rows.slice()}
      commitCellDataset={(q) => setRows(q)}
      rowSetCellData={(row, colIdx, value) => setFieldData(row, columns[colIdx].field, value)}

      fullwidth height={winSize.height * .8}
      containerStyle={{ margin: "1em" }}
      rowHoverColor={(row, ridx) => "rgba(127,127,127, 0.1)"}
      // rowHoverColor={(row, ridx) => {
      //   if (ridx !== 2) return "rgba(248,248,248,1)";
      // }}            
      globalFilter={(_row, ridx) => {
        if (!useGlobalFilter) return undefined;

        const row = _row as MyData;

        return row.col1.indexOf("1") !== -1;
      }}
      getCellBackgroundColor={(row, cell) => {
        if (cell.row === 2) return "cyan";
        if (cell.col === 1) return "lightyellow";
      }}
      getCellFont={(row, cell, props) => {
        if (cell.col === 1) return "bold " + props.font;
      }}
      getCellTextColor={(row, cell) => {
        if (cell.col === 2) return "green";
      }}
      rowHeight={() => 30}
      selectionMode={WSCanvasSelectMode.Cell}
      showFilter={true}
      showColNumber={true} showRowNumber={true}
      colWidthExpand={false}
      frozenRowsCount={0} frozenColsCount={0}

      onApi={(api) => setapi(api)}
      onCellEditing={(states, row, cell, oldValue, newValue) => {
        // return false to inhibit editing
        return true;
      }}
      onCellEdited={(states, row, cell, oldValue, newValue) => {
        if (logEditingToConsole) console.log("changed cell " + cell.toString() + " from [" + oldValue + "] to [" + newValue + "]");
      }}
    />
  </div>
}