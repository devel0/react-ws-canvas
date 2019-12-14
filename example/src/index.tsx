import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { Route, Router, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import AppQuickStart from './App.quickstart';
import { Sample3 } from './Sample3';
import { Sample1 } from './Sample1';
import Frame from './Frame';
import { Sample2 } from './Sample2';

const history = createBrowserHistory();

ReactDOM.render(
    <Router history={history}>
        <Switch>
            <Route exact path="/">
                <Frame sample={(props) => Sample3(props)} />
            </Route>
            <Route path="/1">
                <Frame sample={(props) => Sample1(props)} />
            </Route>
            <Route path="/2">
                <Frame sample={(props) => Sample2(props)} />
            </Route>
            <Route path="/3">
                <Frame sample={(props) => Sample3(props)} />
            </Route>
            <Route path="/quickstart">
                <AppQuickStart />
            </Route>
        </Switch>
    </Router>, document.getElementById('root'));

serviceWorker.unregister();
