import React, { useEffect } from 'react';
import { SetStateType, DispatchType, useStore, StateCallback } from "react-hookstore";
import * as _ from 'lodash';

export function useStoreNfo<T>(storeName: string) {
    return new storeNfo<T>(storeName);
}

export class storeNfo<T> {
    private _state: T;
    private _setState: SetStateType<T> | DispatchType<T>;
    private _storeName: string;
    constructor(storeName: string) {
        this._storeName = storeName;
        const [state, setState] = useStore<T>(storeName);
        this._state = state;
        this._setState = setState;
    }
    get storeName() { return this._storeName; }
    get state() { return this._state; }
    set(stateChanger: (state: T) => void, callback?: StateCallback<T> | undefined) {
        const q = _.cloneDeep(this._state) as T;
        stateChanger(q);
        this._setState(q, () => {
            if (callback) callback(q);
            this._state = q;
        });
    }
}
