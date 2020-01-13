import { WSCanvas, WSCanvasColumn, WSCanvasSortDirection, useWindowSize, setFieldData } from "./lib";

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

  return <WSCanvas
    columns={columns}
    rowsCount={rows.length}
    rows={rows}
    rowGetCellData={(row, colIdx) => row[columns[colIdx].field]}
    // getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
    prepareCellDataset={() => rows.slice()}
    commitCellDataset={(q) => setRows(q)}
    rowSetCellData={(row, colIdx, value) => setFieldData(row, columns[colIdx].field, value)}

    fullwidth height={winSize.height * .8}
    containerStyle={{ margin: "2em" }}
    rowHoverColor={(row, ridx) => {
      if (ridx !== 2) return "rgba(248,248,248,1)";
    }}
    getCellBackgroundColor={(row, cell) => {
      if (cell.row === 2) return "navy";
      if (cell.col === 1) return "lightyellow";
    }}
    getCellFont={(row, cell, props) => {
      if (cell.col === 1) return "bold " + props.font;
    }}
    getCellTextColor={(row, cell) => {
      if (cell.row === 2) return "white";
    }}
    rowHeight={() => 30}
    showFilter={true}
    showColNumber={true} showRowNumber={true}
    colWidthExpand={false}
    frozenRowsCount={0} frozenColsCount={0}
  />
}