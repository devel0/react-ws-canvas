# react ws canvas

[![NPM](https://img.shields.io/npm/v/react-ws-canvas.svg)](https://www.npmjs.com/package/react-ws-canvas) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Spreadsheet like react canvas datagrid optimized for performance built entirely typescript and react functional components with react hooks.

## features

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
