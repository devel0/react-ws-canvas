import React, { useRef, useState, useEffect } from 'react';
import { WSCanvasApi, WSCanvasCellCoord, useWindowSize, WSCanvasColumnClickBehavior } from './lib';
import AppQuickStart from './App.quickstart';
import { Sample1 } from './Sample1';
import { Sample2 } from './Sample2';
import { Sample3 } from './Sample3';

export interface SampleProps {
  debug: boolean,
  dbgDiv: React.RefObject<HTMLDivElement>,
  width: number,
  height: number,
  api: WSCanvasApi,
  columnClickBehavior: WSCanvasColumnClickBehavior
}

const DEFAULT_EXAMPLE = 3;

export default function Frame() {
  const winSize = useWindowSize();
  const userDivRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState(false);
  const api = new WSCanvasApi();
  const [columnClickBehavior, setColumnClickBehavior] = useState(WSCanvasColumnClickBehavior.ToggleSort);
  const dbgDiv = useRef<HTMLDivElement>(null);
  const [example, setExample] = useState(DEFAULT_EXAMPLE);

  api.onMouseDown = (e, c) => {
    console.log("CELL CLICKED " + c);
  };

  api.onContextMenu = (e, c) => {
    if (c) {
      alert("context menu on cell:" + c + " cursel:" + api.getSelection().toString());
      e.preventDefault();
    }
  }  

  const [ctl, setCtl] = useState<JSX.Element | null>(null);  

  const props = {
    api: api,
    columnClickBehavior: columnClickBehavior,
    dbgDiv: dbgDiv,
    debug: debug,
    height: winSize.height,
    width: winSize.width
  } as SampleProps;

  useEffect(() => {
    switch (example) {
      case 0: setCtl(<AppQuickStart />); break;
      case 1: setCtl(<Sample1 {...props} />); break;
      case 2: setCtl(<Sample2  {...props} />); break;
      case 3: setCtl(<Sample3 {...props} />); break;
      default: setCtl(<div>invalid example selection</div>); break;
    }
  }, [example]);

  return <div>

    <div ref={userDivRef} style={{ margin: 10 }}>
      <b>EXAMPLES</b>
      <button onClick={() => { setExample(0); }}>quickstart</button>
      <button onClick={() => { setExample(1); }}>EX1</button>
      <button onClick={() => { setExample(2); }}>EX2</button>
      <button onClick={() => { setExample(3); }}>EX3</button>
      <br />

      <b>API </b>

      <button onClick={() => {
        if (api.clearSelection) api.clearSelection();
      }}>clear selection</button>

      <button onClick={() => {
        if (api.focusCell) api.focusCell(new WSCanvasCellCoord(0, 0), false);
      }}>focus(0,0)</button>

      <button onClick={() => {
        if (api.scrollTo) api.scrollTo(new WSCanvasCellCoord(0, 0));
      }}>scrollTo(0,0)</button>

      <button onClick={() => {
        if (api.getSelection) alert(api.getSelection());
      }}>currentSel</button>

      <button onClick={() => {
        if (api.setSorting) api.setSorting([]);
      }}>clearSort</button>

      <button onClick={() => {
        setColumnClickBehavior(WSCanvasColumnClickBehavior.ToggleSort);
      }}>columnClickSort</button>

      <button onClick={() => {
        setColumnClickBehavior(WSCanvasColumnClickBehavior.Select);
      }}>columnClickSelect</button>

      <button onClick={() => {
        setDebug(!debug);
      }}>toggleDebug</button>
    </div>

    <div ref={dbgDiv}>

    </div>

    <div>
      {ctl}
    </div>

    <div style={{ background: "lightgreen", margin: "1em" }}>
      <h3>TEST DIV AFTER CONTROL</h3>
      <p>sample text 1</p>
      <p>sample text 2</p>
      <p>sample text 3</p>
      <p>sample text 1</p>
      <p>sample text 2</p>
      <p>sample text 3</p>
      <p>sample text 1</p>
      <p>sample text 2</p>
      <p>sample text 3</p>
    </div>
  </div>
}
