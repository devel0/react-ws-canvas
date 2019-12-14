import { WSCanvas, WSCanvasColumn, WSCanvasSortDirection, WSCanvasSelectMode, WSCanvasColumnToSortInfo, mapEnum, useElementSize } from "./lib";

import React, { useState, useEffect, useRef } from "react";
import { SampleProps } from "./Frame";

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

export function Sample3(props: SampleProps) {  
  const {
    api, columnClickBehavior, dbgDiv, debug, height  } = props;

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

  }, []);

  api.onMouseDown = (e, cell) => {
    if (cell) {
      if (cell.row >= 0) {
        const data = rows[cell.row] as MyData;
        console.log("clicked cell row:" + cell.row + " col1:" + data.col1);
      }
    }
  };

  const divRef = useRef<HTMLDivElement>(null);

  return <div ref={divRef} style={{ margin: "1em", background: "yellow" }}>
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
      api={api} debug={debug} dbgDiv={dbgDiv}

      containerStyle={{ margin: "1em" }}
      fullwidth
      // width={divSize.width}
      height={Math.max(300, height * .9)}

      frozenRowsCount={0} frozenColsCount={0}
      columnClickBehavior={columnClickBehavior}
      columnInitialSort={WSCanvasColumnToSortInfo(columns)}
      colWidth={(col) => columns[col].width || 100} colWidthExpand={true}
      showFilter={true}
      showPartialColumns={true} showPartialRows={true}
      showColNumber={true} showRowNumber={true}

      rowsCount={rows.length} colsCount={columns.length}
      dataSource={rows}
      getCellData={(cell) => {
        const fieldname = columns[cell.col].field;
        const row = rows[cell.row];
        if (row) {
          const val = (row as any)[columns[cell.col].field];
          switch (fieldname) {
            case "col1": return "( " + val + " )";
            case "cboxcol": {
              const q = mapEnum(MyEnum).find((x) => x.value === val);
              if (q) return q.name;
            }
          }

          return val;
        }
      }}
      prepareCellDataset={() => rows.slice()}
      commitCellDataset={(q) => setRows(q)}
      setCellData={(q, cell, value) => (q[cell.row] as any)[columns[cell.col].field] = value}
      getCellCustomEdit={(cell, props, containerStyle) => {
        const fieldname = columns[cell.col].field;

        if (fieldname === "cboxcol") {

          if (containerStyle) containerStyle.background = "lightyellow";
          const origVal = rows[cell.row].cboxcol;

          return <div>
            <select
              autoFocus
              defaultValue={rows[cell.row].cboxcol}
              onKeyDown={(e) => {
                switch (e.key) {
                  case "Tab":
                  case "Enter":
                    e.preventDefault();
                    api.closeCustomEdit();
                    break;
                  case "Escape":
                    const q = props.prepareCellDataset();
                    props.setCellData(q, cell, origVal);
                    props.commitCellDataset(q);
                    api.closeCustomEdit();
                    break;
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
      getColumnLessThanOp={(col) => columns[col].lessThan}

      getCellTextAlign={(cell) => (cell.col === 0) ? "center" : undefined}
      getCellTextWrap={(cell) => { if (columns[cell.col].wrapText) return columns[cell.col].wrapText; }}
      getCellType={(cell) => columns[cell.col].type}
      getColumnHeader={(col) => columns[col].header}

      rowHoverColor={"rgba(248,248,248,1)"}
      rowHeight={() => 35} textMargin={5}
      selectionMode={WSCanvasSelectMode.Cell}
    />
  </div>
}