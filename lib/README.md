# react ws canvas

Spreadsheet like react canvas datagrid optimized for performance built entirely typescript and react functional components with react hooks.

## features

## quickstart

## build and test

```sh
cd react-ws-canvas

cd lib
yarn install
yarn build
cd ..

cd example
yarn install
yarn start
```

from vscode hit F5 to start chrome session.

> Note: library sources are in `example/src/lib` ; this way you can hit breakpoint on library source files during example application execution

## how this project was built

```sh
yarn create-react-app react-ws-canvas --typescript
```

This project contains library ready to build and publish and example application ready to debug library itself.
Project structure:

- `package.json` ( workspaces "example" and "lib" )
- `example` folder
    - 
- `lib` folder
    - `package.json`
        - `peerDependencies` for react to avoid react hooks mismatch version error
        - `main` and `module` references from `rollup.config.js` as output files
    - `rollup.config.js`
    - `tsconfig.json`
        - `"rootDirs": ["../example/src/lib"],`
        - `"include": ["../example/src/lib"],`
- `example` folder
    - `package.json`
    - `.env` with `BROWSER=none` because we start chrome from vscode with F5
    - `public`
    - `src`
        - `App.tsx`
        - `lib` ( library source code )
            - `index.tsx` with exports

