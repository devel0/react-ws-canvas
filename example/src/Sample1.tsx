import React, { useState, useEffect } from "react";
import { WSCanvas, WSCanvasApi } from "./lib";
import { SampleProps } from "./Frame";
import { useStoreNfo } from "./lib/StoreUtils";

export function Sample1(props: SampleProps) {
  const {
    apiStoreName, columnClickBehavior, dbgDiv, debug, height, width
  } = props;
  const apiStore = useStoreNfo<WSCanvasApi>(apiStoreName);

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
  }, []);

  return <WSCanvas
    apiStore={apiStore}
    width={width} height={height}
    containerStyle={{ margin: "1em" }}
    columnClickBehavior={columnClickBehavior}
    dataSource={rows}
    getCellData={(cell) => rows[cell.row][cell.col]}
    prepareCellDataset={() => rows.slice()}
    commitCellDataset={(q) => setRows(q)}
    setCellData={(q, cell, value) => q[cell.row][cell.col] = value}
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
    debug={debug} dbgDiv={dbgDiv}
  />
}
