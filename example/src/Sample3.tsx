import { WSCanvasApi, WSCanvasColumnClickBehavior, WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasColumnSortInfo, WSCanvasScrollbarMode, WSCanvasSelectMode, WSCanvasColumnToSortInfo, mapEnum } from "./lib";

import React, { useState, useEffect, useLayoutEffect } from "react";

enum MyEnum {
  first,
  second,
  third
}

interface MyData {
  col1: string;
  col2: number;
  col3: boolean;
  col4: Date;
  col5: Date;
  col6: Date;
  col7: string;
  cboxcol: MyEnum;
}

export function Sample3(exampleInit: number, debug: boolean, dbgDiv: React.RefObject<HTMLDivElement>,
  width: number, height: number, api: WSCanvasApi, columnClickBehavior: WSCanvasColumnClickBehavior) {
  const [rows, setRows] = useState<MyData[]>([]);

  const ROWS = 5000;

  const columns = [
    {
      type: "text",
      header: "col1",
      field: "col1",
      lessThan: (a, b) => {
        if (a && b) {
          const aNr = parseInt((a as string).replace("r", ""));
          const bNr = parseInt((b as string).replace("r", ""));

          return aNr < bNr;
        }
        return -1;
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
      type: "text",
      header: "cbox",
      field: "cboxcol"
    },
    {
      type: "datetime",
      header: "col6",
      field: "col6"
    },
    {
      type: "text",
      header: "description",
      field: "col7",
      wrapText: true,
    }
  ] as WSCanvasColumn[];

  useEffect(() => {
    //setTimeout(() => {
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
        col7: ri % 2 === 0 ? "short text" : "long text that will be wrapped because too long",
        cboxcol: (ri % 3) as MyEnum
      });
    }

    setRows(_rows);
    //}, 100);

  }, [exampleInit]);

  api.onMouseDown = (e, cell) => {
    if (cell) {
      if (cell.row >= 0) {
        const data = rows[cell.row] as MyData;
        console.log("clicked cell row:" + cell.row + " col1:" + data.col1);
      }
    }
  };

  return <>
    <button onClick={() => {
      const q = rows.slice(1);
      setRows(q);
    }}>DEL ROW 0</button>

    <button onClick={() => {
      const q = rows.slice();
      q[0].col7 = "NEW DESC";
      setRows(q);
    }}>CHANGE ROW</button>

    <WSCanvas
      api={api}
      width={width} height={Math.max(300, height * .9)}
      // dataSource={rows}
      containerStyle={{ margin: "2em" }}
      rowHoverColor={"rgba(248,248,248,1)"}
      // isCellReadonly={() => true}
      // cellCursor="pointer"
      getCellTextAlign={(cell, val) => (cell.col === 0) ? "center" : undefined}
      columnClickBehavior={columnClickBehavior}
      dataSource={rows}
      getCellData={(cell) => {
        const fieldname = columns[cell.col].field;
        const val = (rows[cell.row] as any)[columns[cell.col].field];
        switch (fieldname) {
          case "col1": return "( " + val + " )";
          case "cboxcol": {
            const q = mapEnum(MyEnum).find((x) => x.value === val);
            if (q) return q.name;
          }
        }

        return val;
      }}
      prepareCellDataset={() => rows.slice()}
      commitCellDataset={(q) => setRows(q)}
      setCellData={(q, cell, value) => (q[cell.row] as any)[columns[cell.col].field] = value}
      getCellCustomEdit={(cell, props) => {
        const fieldname = columns[cell.col].field;

        if (fieldname === "cboxcol") {

          const options = mapEnum(MyEnum).map((x) => {
            return {
              value: x.value,
              label: x.name
            }
          });

          return <div>
            <select
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Tab" || e.key === "Enter") {
                  e.preventDefault();
                  api.closeCustomEdit();
                }
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                const qval: MyEnum = val;
                const row = rows[cell.row];
                row.cboxcol = qval;
              }}>
              {mapEnum(MyEnum).map((x) =>
                <option value={x.value}>{x.name}</option>
              )}
            </select>
          </div>

        }
        return undefined;
      }}
      columnInitialSort={WSCanvasColumnToSortInfo(columns)}
      // getCellBackgroundColor={(cell, props) => {
      //   // if (cell.row === 2) return "navy";
      //   if (cell.col === 1) return "lightyellow";
      // }}
      // getCellFont={(cell, props) => {
      //   if (cell.col === 1) return "bold " + props.font;
      // }}
      // getCellTextColor={(cell, props) => {
      //   if (cell.row === 2) return "white";
      // }}
      getCellTextWrap={(cell, props) => { if (columns[cell.col].wrapText) return columns[cell.col].wrapText; }}
      // getCellTextAlign={(cell, val) => (cell.col === 0) ? "center" : undefined}
      getColumnHeader={(col) => columns[col].header}
      rowHeight={() => 35} textMargin={5}
      getColumnLessThanOp={(col) => columns[col].lessThan}
      getCellType={(cell, data) => columns[cell.col].type}
      // rowHoverColor={"rgba(240,240,240,1)"}
      colWidth={(col) => columns[col].width || 100}
      selectionMode={WSCanvasSelectMode.Cell}
      showFilter={true}
      showPartialColumns={true} showPartialRows={true}
      showColNumber={true} showRowNumber={true}
      debug={debug} dbgDiv={dbgDiv}
      colWidthExpand={true}
      frozenRowsCount={0} frozenColsCount={0}
      rowsCount={rows.length} colsCount={columns.length} />
  </>
}