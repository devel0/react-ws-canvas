import React, { useRef, useState } from 'react';
import './App.css';

import { WSCanvasApi, WSCanvasCellCoord, useWindowSize, useElementSize, WSCanvasColumnClickBehavior } from './lib';
import { Sample1 } from './Sample1';
import { Sample2 } from './Sample2';
import { Sample3 } from './Sample3';

const App: React.FC = () => {
  const winSize = useWindowSize();
  const userDivRef = useRef<HTMLDivElement>(null);
  const userSize = useElementSize(userDivRef);
  const [debug, setDebug] = useState(false);
  const api = new WSCanvasApi();
  const [columnClickBehavior, setColumnClickBehavior] = useState(WSCanvasColumnClickBehavior.ToggleSort);
  const dbgDiv = useRef<HTMLDivElement>(null);

  api.onMouseDown = (e, c) => {
    //  console.log("CELL CLICKED " + c);
  };

  api.onContextMenu = (e, c) => {
    if (c) {
      console.log("context menu on cell:" + c + " cursel:" + api.getSelection().toString());
      e.preventDefault();
    }
  }

  return <div>

    <div ref={userDivRef} style={{ margin: 10 }}>
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
      {Sample3(debug, dbgDiv, winSize.width, winSize.height * .8, api, columnClickBehavior)}
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

export default App;
