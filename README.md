# react ws canvas

[![NPM](https://img.shields.io/npm/v/react-ws-canvas.svg)](https://www.npmjs.com/package/react-ws-canvas) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Spreadsheet like react canvas datagrid optimized for performance built entirely typescript and react functional components with react hooks.

[LIVE DEMO](https://codesandbox.io/s/github/devel0/react-ws-canvas/tree/master/example) of master branch development testing example

---

- [features](#features)
- [quickstart](#quickstart)
- [how to contribute ( quickstart )](#how-to-contribute--quickstart-)
- [how this project was built](#how-this-project-was-built)

---

## features

- **canvas based** high performance datagrid ( able to scroll with ease millions of rows maintaining immediate cell focus and editing features )

![](doc/50000rows_200cols.gif)

- **direct cell editing**, just click on a cell then type, hit ENTER or arrows keys to move next ( [native cell types][1] )
  - "text": type text to change cell ; CANC to clear cell ; CTRL+C / CTRL+V to copy/paste
  - "boolean": toggle boolean with keyboard space when cell focused
  - "date", "time", "datetime": smart date insertion ( typing 121030 results in 12/10/2030 ) browser locale supported
  - "number": sci numbers ( typing 12e-3 results in 0.012 displayed ) browser locale support for decimal separators

- [cell or row][2] selection mode]

![](doc/selection-mode-cells.png)

![](doc/selection-mode-rows.png)

- selection [mode multi][9]

![](doc/selection-mode-multi.png)

- frozen [rows][3], [cols][4]

![](doc/frozen-rows-cols.png)

- rows and cols numbering can be [shown or hidden][5]

- if column numbering visible automatic sort can be customized through [less-than-op][6]

- [column click behavior][12] can be full column select or column toggle sort

- data getter/setter can follow a [worksheet][7] or a [db record type][8]

- [api][10] available for control interactions ( [example][11] )

- each individual cell [custom edit][13] ( F2 ) control can be customized

- each individual [cell type][14] can be customized

- support mobile touch scrolling rows, cols and scrollbars

[1]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasColumn.tsx#L1
[2]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L30
[3]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L24
[4]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L26
[5]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L31-L34
[6]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L48-L49
[7]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/Sample1.tsx#L29-L34
[8]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/Sample2.tsx#L81-L86
[9]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L27-L28
[10]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasApi.tsx#L7
[11]: https://github.com/devel0/react-ws-canvas/blob/38997638bb5f1f043164fdf73802490cfafa06c3/example/src/App.tsx#L15
[12]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L35-L36
[13]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L44-L45
[14]: https://github.com/devel0/react-ws-canvas/blob/3160c5e6548f7543a63d8ae8ef81c896a5bcef9a/example/src/lib/WSCanvasProps.tsx#L50-L51

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
import { WSCanvas, useWindowSize } from 'react-ws-canvas';

const App: React.FC = () => {
  const [rows, setRows] = useState<any[][]>([]);
  const winSize = useWindowSize();

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
    width={winSize.width} height={winSize.height}
    showColNumber={true} showRowNumber={true} showFilter={true}
    getCellData={(cell) => rows[cell.row][cell.col]}
    setCellData={(cell, value) => {
      const q = rows.slice();
      q[cell.row][cell.col] = value;
      setRows(q);
    }}
  />;
}

export default App;
```

- run the app

```sh
yarn start
```

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

## how this project was built

```sh
yarn create-react-app react-ws-canvas --typescript
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
