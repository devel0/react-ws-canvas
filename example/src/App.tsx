import React from 'react';
import { Frame } from './Frame';

import { Sample3 } from './Sample3';

const App: React.FC = () => {
  return <div>
    {Frame((props) => Sample3(props))}
  </div>
}

export default App;
