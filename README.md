# react ws canvas

[![NPM](https://img.shields.io/npm/v/react-ws-canvas.svg)](https://www.npmjs.com/package/react-ws-canvas) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Spreadsheet like react canvas datagrid optimized for performance built entirely typescript and react functional components with react hooks.

**LIVE DEMO** ( current [development](https://codesandbox.io/s/github/devel0/react-ws-canvas/tree/master/example) or latest **stable version** [v0.8.4](https://codesandbox.io/s/github/devel0/react-ws-canvas/tree/ce5b975d3c3342002baa05ee4d2f2494553eb830/example) )

---

- [features](#features)
- [quickstart](#quickstart)
- [states, handlers and api usage](#states-handlers-and-api-usage)
- [tips](#tips)
- [examples list](#examples-list)
- [how to contribute ( quickstart )](#how-to-contribute--quickstart-)
- [local deploy](#local-deploy)
- [how this project was built](#how-this-project-was-built)
- [development notes](#development-notes)

---

## features

- **canvas based** high performance datagrid ( able to scroll with ease millions of rows maintaining immediate cell focus and editing features )

50000 rows x 200 cols example ( [LIVE EXAMPLE](https://codesandbox.io/s/github/devel0/react-ws-canvas/tree/master/example) : click *EX1* button )

![](doc/50000rows_200cols.gif)

- **direct cell editing**, just click on a cell then type, hit ENTER or arrows keys to move next ( [native cell types][1] )
  - "text": type text to change cell ; CANC to clear cell ; CTRL+C / CTRL+V to copy/paste
  - "boolean": toggle boolean with keyboard space when cell focused
  - "date", "time", "datetime": smart date insertion ( typing 121030 results in 12/10/2030 ) browser locale supported
  - "number": sci numbers ( typing 12e-3 results in 0.012 displayed ) browser locale support for decimal separators

- [properties default values][22]

- [cell or row][2] selection mode

![](doc/selection-mode-cells.png)

![](doc/selection-mode-rows.png)

- selection [mode multi][9]

![](doc/selection-mode-multi.png)

- frozen [rows][3], [cols][4]

![](doc/frozen-rows-cols.png)

- [wrap][21] text cells

![](doc/text-wrap.gif)

- rows and cols numbering can be [shown or hidden][5]

- if column numbering visible automatic sort can be customized through [less-than-op][6]

- [column click behavior][12] can be full column select, column toggle sort or none to disable sort/select behavior

- [column header][15] can be customized

- canvas size can be specified through width, height ( [fullwidth][26] option available )

- column width can be changed intractively using mouse

![](doc/column-width-resize.png)

- column width [autoexpand][16]

- column custom [initial sort][18]

![](doc/initial-sort.png)

- data getter/setter can follow a [worksheet][7] or a [db record type][8]

- [api][10] and [handlers][27] available for control interactions ( [example][11] )

- each individual cell [custom edit][13] ( F2 ) control can be customized ( [example][24] : through keyboard F2, arrows then enter )

![](doc/custom-combobox.gif)

- [cell style][19] customization and [text align][25]

![](doc/cell-style-customization.png)

- container [height min][23] and canvas [styles][20]

- each individual [cell type][14] can be customized

- support mobile touch scrolling rows, cols and scrollbars

[1]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasColumn.tsx#L1
[2]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L30
[3]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L24
[4]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L26
[5]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L31-L34
[6]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L48-L49
[7]: https://github.com/devel0/react-ws-canvas/blob/6802447dac4247fcb6cd16cab14338d8c8b9dab7/example/src/Sample2.tsx#L98-L100
[8]: https://github.com/devel0/react-ws-canvas/blob/6802447dac4247fcb6cd16cab14338d8c8b9dab7/example/src/Sample3.tsx#L128-L130
[9]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L27-L28
[10]: https://github.com/devel0/react-ws-canvas/blob/7c4270e17742f55e229e1a66e9d16410a9c97b26/example/src/lib/WSCanvasApi.tsx#L9
[11]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L118-L156
[12]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L35-L36
[13]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvasProps.tsx#L87
[14]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L50-L51
[15]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/Sample2.tsx#L87
[16]: https://github.com/devel0/react-ws-canvas/blob/5a7b126b35a08350f1fb3409138c2dfee49360f4/example/src/lib/WSCanvasProps.tsx#L23-L24
[17]: https://github.com/devel0/react-ws-canvas/blob/5a7b126b35a08350f1fb3409138c2dfee49360f4/example/src/lib/WSCanvasProps.tsx#L68-L69
[18]: https://github.com/devel0/react-ws-canvas/blob/86ffa34c4b17f6f56b106119c7874c910df9c371/example/src/Sample2.tsx#L93-L99
[19]: https://github.com/devel0/react-ws-canvas/blob/eea7a9f653fe827300291b3b5b3e6870d9ff4692/example/src/Sample2.tsx#L100-L109
[20]: https://github.com/devel0/react-ws-canvas/blob/eea7a9f653fe827300291b3b5b3e6870d9ff4692/example/src/lib/WSCanvasProps.tsx#L143-L146
[21]: https://github.com/devel0/react-ws-canvas/blob/10556d1e377e8258077f4a87cffb21f722c7e4e6/example/src/lib/WSCanvasProps.tsx#L103-L104
[22]: https://github.com/devel0/react-ws-canvas/blob/6802447dac4247fcb6cd16cab14338d8c8b9dab7/example/src/lib/WSCanvasPropsDefault.tsx#L13
[23]: https://github.com/devel0/react-ws-canvas/blob/e756188d46ffe9fc96bc68d66de65aa6af42b146/example/src/Sample3.tsx#L120
[24]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/Sample3.tsx#L240-L279
[25]: https://github.com/devel0/react-ws-canvas/blob/4029b9f278824215ca2ffdf65cabe6e2ccf32c4c/example/src/lib/WSCanvasProps.tsx#L89
[26]: https://github.com/devel0/react-ws-canvas/blob/cdd013cda94264770b3e62840148e716ac4e76c5/example/src/Sample3.tsx#L138
[27]: https://github.com/devel0/react-ws-canvas/blob/7d9b1b9bb9d02854dcf2080a49ddbf60306d0eeb/example/src/lib/WSCanvasHandlers.tsx#L10

## quickstart

![](doc/quickstart.png)

- create react app

```sh
create-react-app test --typescript
cd test
yarn add react-ws-canvas
```

- edit `App.tsx` as follows

```ts
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
    dataSource={rows}
    getCellData={(cell) => rows[cell.row][cell.col]}
    prepareCellDataset={() => rows.slice()}
    commitCellDataset={(q) => setRows(q)}
    setCellData={(q, cell, value) => q[cell.row][cell.col] = value}
  />;
}

export default AppQuickStart;
```

- run the app

```sh
yarn start
```

## states, handlers and api usage

- [declare][500] your grid handlers and api state variables

- handlers
  - [attach handlers][501]
  - [define handlers][503]
- api
  - [onApi][502] set your api state variable
  - [invoke api][503] passing states info that comes as argument from handlers. If call an api outside grid handlers can use your own [states copy][505]

[500]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L27-L28
[501]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L192
[502]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L193
[503]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L118-L156
[504]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L133
[505]: https://github.com/devel0/react-ws-canvas/blob/c344cb2c2b9e788658e673c5026018922bc0bd8f/example/src/Sample3.tsx#L152

## tips

- prepare column info using [WSCanvasColumn][1000] ( [example][1001] ) then attach required prop using hint provided from WSCanvasColumn field documentation ( ie. `getColumnHeader={(col) => columns[col].header}` )

- to allow read/write cell set `getCellData`, `prepareCellDataset`, `setCellData`, `commitCellDataset` ( [example][1002] )

- to ensure data sync with view set [dataSource][1003]

- to inhibit column sorting set `columnClickBehavior` to [None][1004]

- transform render data on-the-fly using `renderTransform` ( [example][1005] ) useful for enum data value mapping to string when displayed )

[1000]: https://github.com/devel0/react-ws-canvas/blob/3389cbc6b510b209d78fcc277f7ef80d9b8e0b29/example/src/lib/WSCanvasColumn.tsx#L17
[1001]: https://github.com/devel0/react-ws-canvas/blob/3389cbc6b510b209d78fcc277f7ef80d9b8e0b29/example/src/Sample3.tsx#L21
[1002]: https://github.com/devel0/react-ws-canvas/blob/3389cbc6b510b209d78fcc277f7ef80d9b8e0b29/example/src/Sample3.tsx#L128-L132
[1003]: https://github.com/devel0/react-ws-canvas/blob/3389cbc6b510b209d78fcc277f7ef80d9b8e0b29/example/src/Sample3.tsx#L128
[1004]: https://github.com/devel0/react-ws-canvas/blob/3389cbc6b510b209d78fcc277f7ef80d9b8e0b29/example/src/lib/WSCanvasColumn.tsx#L8
[1005]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/Sample3.tsx#L221-L230

## examples list

| example | description |
|---|---|
| [quickstart](example/src/App.quickstart.tsx) | 500000 x 20 grid with minimal props |
| [Sample1](example/src/Sample1.tsx) | 50000 x 200 grid with frozen row/col, filter, custom column width |
| [Sample2](example/src/Sample2.tsx) | 5000 x 6 grid db-record-like column mapping, initial sort, custom sort, api onMouseDown |
| [Sample3](example/src/Sample3.tsx) | 5000 x 7 grid db-record-like, data interact del/change row, custom cell editor, rowHover |

## how to contribute ( quickstart )

- clone repo

```sh
git clone https://github.com/devel0/react-ws-canvas.git
```

- open vscode

```sh
cd react-ws-canvas
code .
```

- from vscode, open terminal ctrl+\` and execute example application ( this allow you to set **breakpoints** directly on library source code from `lib` folder )

```sh
cd example
yarn install
yarn start
```

- start chrome session using F5

## local deploy

- from library

```sh
cd lib
yarn build && yalc publish
```

- from your project

```sh
npm uninstall react-ws-canvas --save && yalc add react-ws-canvas && npm install
```

## how this project was built

```sh
yarn create react-app react-ws-canvas --typescript
```

Because I need a library to publish and either a working example to test/debug the library project structured this way:

- `/package.json` ( workspaces "example" and "lib" )
- `/example` ( example and library sources )
  - `/example/package.json`
  - `/example/.env` with BROWSER=none to avoid browser start when issue `yarn start` because I use F5 from vscode to open debugging session
  - `/example/lib` ( library source codes )
- `/lib` ( library publishing related files )
  - `/lib/package.json`
  - `/lib/rollup.config.json` ( specifically `input: '../example/src/lib/index.tsx',  ` )
  - `/lib/tsconfig.json` ( specifically `"rootDirs": ["../example/src/lib"],` and `"include": ["../example/src/lib"],` )
  - `/lib/prepatch-and-publish` ( helper script to prepatch version and publish with README.md )

## development notes

- **key notes**
  - [W and H][1508] variables represents [canvas size][1509] and used as starting point for [calculations][1510]
  - [stateNfo, viewMap, overridenRowHeight][1500] are kept separate because stateNfo must light because frequently updated while viewMap and overridenRowHeight can be heavy struct for large grids
  - [view][1501] mapping have a size less-or-equal than rowsCount depending on [filtering][1502] and the order of view may different depending on sorting
  - some methods work with [real cells][1503] ( the same as user configure through getCellData, setCellData ), some other methods works with [view cells][1504] that is an internal representation convenient to deal on what-you-see-is-what-you-get
  - [real and view coords][1505] can be transformed between
  - [mkstates][1506] is an helper used primarly by [handlers][1507] to ensure callback uses synced state
- **TODO**
  - type 'select' for cell with combobox integrated
  - date picker when F2 (or double click) on date type cell
  - isOverCell should true on last row when showPartialRows
- deployment
  - remove any `from "react-ws-canvas";`

[1500]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L140-L146
[1501]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L159-L187
[1502]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L382
[1503]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L1053
[1504]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L648
[1505]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L183-L187
[1506]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L267
[1507]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L2039
[1508]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L155-L156
[1509]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L2885-L2886
[1510]: https://github.com/devel0/react-ws-canvas/blob/1c0200495ec75a6fe31f467884b9ac79b1e88ad6/example/src/lib/WSCanvas.tsx#L232