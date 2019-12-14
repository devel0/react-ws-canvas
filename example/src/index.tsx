import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { Sample3 } from './Sample3';
import Frame from './Frame';

ReactDOM.render(
    <Frame/>,
    document.getElementById('root'));

serviceWorker.unregister();
