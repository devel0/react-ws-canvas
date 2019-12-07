import { WSCanvasApi, WSCanvasColumnClickBehavior, WSCanvas } from "./lib";

import React, { useState, useEffect } from "react";

export function Sample1(exampleInit: number, debug: boolean, dbgDiv: React.RefObject<HTMLDivElement>,
  width: number, height: number, api: WSCanvasApi, columnClickBehavior: WSCanvasColumnClickBehavior) {
  const [rows, setRows] = useState<any[][]>([]);

  const ROWS = 50000;
  const COLS = 200;

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
  }, [exampleInit]);

  return <WSCanvas
    api={api}
    width={width} height={height}
    containerStyle={{ margin: "1em" }}
    columnClickBehavior={columnClickBehavior}
    getCellData={(cell) => rows[cell.row][cell.col]}
    setCellData={(cells) => {
      const q = rows.slice();      
      for (let i = 0; i < cells.length; ++i) {
        const cell = cells[i].coord;
        const value = cells[i].value;
        q[cell.row][cell.col] = value;
      }      
      setRows(q);
    }}
    clearCellData={(selection, viewCellToReal, isCellReadonly) => {
      const q = rows.slice();
      let viewCellRng = selection.cells();
      let viewCellIt = viewCellRng.next();
      while (!viewCellIt.done) {
        const viewCell = viewCellIt.value;
        const cell = viewCellToReal(viewCell);
        if (isCellReadonly === undefined || !isCellReadonly(cell)) {
          q[cell.row][cell.col] = "";          
        }
        viewCellIt = viewCellRng.next();
      }
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
    debug={debug} dbgDiv={dbgDiv}
  />
}
