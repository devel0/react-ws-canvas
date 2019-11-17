import { WSCanvasApi, WSCanvasColumnClickBehavior, WSCanvas } from "./lib";

import React, { useState, useEffect } from "react";

export function Sample1(width: number, height: number, api: WSCanvasApi, columnClickBehavior: WSCanvasColumnClickBehavior) {
    const [rows, setRows] = useState<any[][]>([]);
  
    const ROWS = 1000;
    const COLS = 20;
  
    useEffect(() => {
  
      const _rows = [];
      for (let ri = 0; ri < ROWS; ++ri) {
        const row = [];
        for (let ci = 0; ci < COLS; ++ci) {
          row.push("r:" + ri + " c:" + ci);
        }
        _rows.push(row);
      }
  
      setRows(_rows);
    }, []);
  
    return <WSCanvas
      api={api}
      width={width} height={height}
      columnClickBehavior={columnClickBehavior}
      getCellData={(cell) => rows[cell.row][cell.col]}
      setCellData={(cell, value) => {
        const q = rows.slice();
        q[cell.row][cell.col] = value;
        setRows(q);
      }}
      colWidth={(ci) => {
        let w = 50;
        for (let i = 0; i < ci; ++i) {
          w += 50;
          if (w > 200) w = 50;
        }
        return w;
      }}
      rowsCount={rows.length} colsCount={COLS}
      showRowNumber={true} showColNumber={true} showFilter={true}
      frozenRowsCount={1} frozenColsCount={1}
      // getCellCustomEdit={(coord, props) => <button key="btb">{props.getCellData(coord)}</button>}
      debug={false}
    />
  }
  