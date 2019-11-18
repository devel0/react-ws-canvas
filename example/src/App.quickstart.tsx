import React, { useState, useEffect } from 'react';
import { WSCanvas, useWindowSize, WSCanvasColumnClickBehavior } from 'react-ws-canvas';

const AppQuickStart: React.FC = () => {
  const [rows, setRows] = useState<any[][]>([]);
  const winSize = useWindowSize();

  const ROWS = 500000;
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
    width={winSize.width} height={winSize.height}
    rowsCount={rows.length} colsCount={COLS}
    showColNumber={true} showRowNumber={true}
    columnClickBehavior={WSCanvasColumnClickBehavior.ToggleSort}
    getCellData={(cell) => rows[cell.row][cell.col]}
    setCellData={(cell, value) => {
      const q = rows.slice();
      q[cell.row][cell.col] = value;
      setRows(q);
    }}
  />;
}

export default AppQuickStart;