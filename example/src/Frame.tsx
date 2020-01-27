import React, { useState, useEffect } from 'react';
import AppQuickStart from './App.quickstart';
import { Sample1 } from './Sample1';
import { Sample2 } from './Sample2';
import { Sample3 } from './Sample3';
import { Sample4 } from './Sample4';
import { Sample5 } from './Sample5';
import { Sample6 } from './Sample6';

const DEFAULT_EXAMPLE = 4;

export default function Frame() {
  const [example, setExample] = useState(DEFAULT_EXAMPLE);
  const [ctl, setCtl] = useState<JSX.Element | null>(null);

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
      <button onClick={() => { setExample(0); }}>quickstart</button>
      <button onClick={() => { setExample(1); }}>EX1</button>
      <button onClick={() => { setExample(2); }}>EX2</button>
      <button onClick={() => { setExample(3); }}>EX3</button>
      <button onClick={() => { setExample(4); }}>EX4</button>
      <button onClick={() => { setExample(5); }}>EX5</button>
      <button onClick={() => { setExample(6); }}>EX6</button>
      <br />
    </div>

    <div>
      {ctl}
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
