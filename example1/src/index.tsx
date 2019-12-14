import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { createBrowserHistory } from 'history';
import { Sample1 } from '../../example/src/Sample1';
import Frame from '../../example/src/Frame';

ReactDOM.render(
    <Frame sample={(props) => Sample1(props)} />,
    document.getElementById('root'));

serviceWorker.unregister();
