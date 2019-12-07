import { WSCanvasApi, WSCanvasColumnClickBehavior, WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasColumnSortInfo, WSCanvasScrollbarMode, WSCanvasColumnToSortInfo } from "./lib";

import React, { useState, useEffect } from "react";

interface MyData {
  col1: string;
  col2: number;
  col3: boolean;
  col4: Date;
  col5: Date;
  col6: Date;
}

export function Sample2(debug: boolean, dbgDiv: React.RefObject<HTMLDivElement>,
  width: number, height: number, api: WSCanvasApi, columnClickBehavior: WSCanvasColumnClickBehavior) {
  const [rows, setRows] = useState<MyData[]>([]);

  const ROWS = 5000;

  const columns = [
    {
      type: "text",
      header: "col1",
      field: "col1",
      lessThan: (a, b) => {
        const aNr = parseInt((a as string).replace("r", ""));
        const bNr = parseInt((b as string).replace("r", ""));

        return aNr < bNr;
      },
      sortDirection: WSCanvasSortDirection.Descending,
      sortOrder: 1,
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
      field: "col3"
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

  api.onMouseDown = (e, cell) => {
    if (cell) {
      if (cell.row >= 0) {
        const data = rows[cell.row] as MyData;
        console.log("clicked cell row:" + cell.row + " col1:" + data.col1);
      }
    }
  };

  return <WSCanvas
    api={api}
    width={width} height={height}
    containerStyle={{ margin: "2em" }}
    columnClickBehavior={columnClickBehavior}
    getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
    setCellData={(cells) => {
      const q = rows.slice();
      for (let i = 0; i < cells.length; ++i) {
        const cell = cells[i].coord;
        const value = cells[i].value;
        (q[cell.row] as any)[columns[cell.col].field] = value;
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
          (q[cell.row] as any)[columns[cell.col].field] = "";
        }
        viewCellIt = viewCellRng.next();
      }
      setRows(q);
    }}
    columnInitialSort={WSCanvasColumnToSortInfo(columns)}
    getCellBackgroundColor={(cell, props) => {
      if (cell.row === 2) return "navy";
      if (cell.col === 1) return "lightyellow";
    }}
    getCellFont={(cell, props) => {
      if (cell.col === 1) return "bold " + props.font;
    }}
    getCellTextColor={(cell, props) => {
      if (cell.row === 2) return "white";
    }}
    getCellTextAlign={(cell, val) => (cell.col === 0) ? "center" : undefined}
    getColumnHeader={(col) => columns[col].header}
    getColumnLessThanOp={(col) => columns[col].lessThan}
    getCellType={(cell, data) => columns[cell.col].type}
    colWidth={(col) => 120}
    rowHeight={() => 30}
    showFilter={true}
    showColNumber={true} showRowNumber={true}
    debug={debug} dbgDiv={dbgDiv} colWidthExpand={false}
    frozenRowsCount={0} frozenColsCount={0}
    rowsCount={rows.length} colsCount={columns.length} />
}