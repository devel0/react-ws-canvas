import { WSCanvasApi, WSCanvasColumnClickBehavior, WSCanvas, WSCanvasColumn } from "./lib";

import React, { useState, useEffect } from "react";

interface MyData {
  col1: string;
  col2: number;
  col3: boolean;
  col4: Date;
  col5: Date;
  col6: Date;
}

export function Sample2(width: number, height: number, api: WSCanvasApi, columnClickBehavior: WSCanvasColumnClickBehavior) {
  const [rows, setRows] = useState<MyData[]>([]);

  const ROWS = 100;

  const columns = [
    {
      type: "text",
      header: "col1",
      field: "col1",
      lessThan: (a, b) => {
        const aNr = parseInt((a as string).replace("r", ""));
        const bNr = parseInt((b as string).replace("r", ""));

        return aNr < bNr;
      }
    },
    {
      type: "number",
      header: "col2",
      field: "col2",
      lessThan: (a,b) => (a as number) < (b as number)
    },
    {
      type: "boolean",
      header: "col3",
      field: "col3"
    },
    {
      type: "date",
      header: "col4",
      field: "col4"
    },
    {
      type: "time",
      header: "col5",
      field: "col5"
    },
    {
      type: "datetime",
      header: "col6",
      field: "col6"
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

  return <WSCanvas
    api={api}
    width={width} height={height}
    columnClickBehavior={columnClickBehavior}
    getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
    setCellData={(cell, value) => {
      const q = rows.slice();
      (q[cell.row] as any)[columns[cell.col].field] = value;
      setRows(q);
    }}
    getColumnHeader={(col) => columns[col].header}
    getColumnLessThanOp={(col) => columns[col].lessThan}
    getCellType={(cell, data) => columns[cell.col].type}
    colWidth={(col) => 120}
    rowHeight={30}
    showFilter={true}
    showColNumber={true} showRowNumber={true}
    debug={true}
    frozenRowsCount={0} frozenColsCount={0}
    rowsCount={rows.length} colsCount={columns.length} />
}