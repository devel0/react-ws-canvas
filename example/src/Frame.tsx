import React, { useState, useEffect } from 'react';
import AppQuickStart from './App.quickstart';
import { Sample1 } from './Sample1';
import { Sample2 } from './Sample2';
import { Sample3 } from './Sample3';
import { Sample4 } from './Sample4';
import { Sample5 } from './Sample5';
import { Sample6 } from './Sample6';

const EXAMPLE_NOTES = [
  "500000 x 20 grid with minimal props",
  "50000 x 200 grid with frozen row/col, filter, custom column width",
  "5000 x 6 grid db-record-like column mapping, initial sort, custom sort, api onMouseDown",
  "5000 x 7 grid db-record-like, data interact del/change row, custom cell editor, rowHover",
  "add/insert/del/move/currentRealRowSel rows using api",
  "custom multi select with material-ui",
  "resetView behavior to force sync ds ; resetView resetSorting argument usage"
];

const DEFAULT_EXAMPLE = 2;

export default function Frame() {
  const [example, setExample] = useState(DEFAULT_EXAMPLE);
  const [ctl, setCtl] = useState<JSX.Element | null>(null);
  const [notes, setNotes] = useState<string>(EXAMPLE_NOTES[DEFAULT_EXAMPLE]);

  useEffect(() => {
    switch (example) {
      case 0: setCtl(<AppQuickStart />); break;
      case 1: setCtl(<Sample1 />); break;
      case 2: setCtl(<Sample2 />); break;
      case 3: setCtl(<Sample3 />); break;
      case 4: setCtl(<Sample4 />); break;
      case 5: setCtl(<Sample5 />); break;
      case 6: setCtl(<Sample6 />); break;
      default: setCtl(<div>invalid example selection</div>); break;
    }
  }, [example]);

  return <div>

    <div style={{ margin: 10 }}>
      <b>EXAMPLES </b>

      <button onClick={() => { setExample(0); setNotes(EXAMPLE_NOTES[0]); }}>quickstart</button>
      <button onClick={() => { setExample(1); setNotes(EXAMPLE_NOTES[1]); }}>EX1</button>
      <button onClick={() => { setExample(2); setNotes(EXAMPLE_NOTES[2]); }}>EX2</button>
      <button onClick={() => { setExample(3); setNotes(EXAMPLE_NOTES[3]); }}>EX3</button>
      <button onClick={() => { setExample(4); setNotes(EXAMPLE_NOTES[4]); }}>EX4</button>
      <button onClick={() => { setExample(5); setNotes(EXAMPLE_NOTES[5]); }}>EX5</button>
      <button onClick={() => { setExample(6); setNotes(EXAMPLE_NOTES[6]); }}>EX6</button>

      <br />
    </div>

    <div>
      <span style={{ marginLeft: "1em" }}>
        <span style={{ color: "red" }}><b>EX{example}</b></span> : <i style={{ color: "green" }}>{notes}</i>
      </span>
      <div style={{ marginTop: "1em" }}>
        {ctl}
      </div>
    </div>

    {/* <div style={{ background: "lightgreen", margin: "1em" }}>
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
    </div> */}
  </div>
}
