import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, Select, MenuItem, Input, InputLabelProps } from '@material-ui/core';
import {
    WSCanvas, WSCanvasColumn, WSCanvasApi, useWindowSize,
    WSCanvasStates, WSCanvasColumnClickBehavior, WSCanvasCellCoord, setFieldData, getFieldData, pathBuilder
} from "./lib";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from '@date-io/date-fns';
import * as _ from 'lodash';

interface MyDataUser {
    id: number;
    username: string;
}

interface MyData {
    descr: string;
    users: MyDataUser[];
    dt: Date;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

// to specify field using secure path by intellisense
const SP_MyData = pathBuilder<MyData>();

export function Sample5() {
    const [ds, setDs] = useState<MyData[]>([]);
    const [api, setApi] = useState<WSCanvasApi | null>(null);
    const [gridStates, setGridState] = useState<WSCanvasStates | null>(null);
    const winSize = useWindowSize();
    const [colVisible] = useState(true);
    const [columns, setColumns] = useState<WSCanvasColumn[]>([]);
    const [usersSelectOpened, setUsersSelectOpened] = useState(false);
    const [dtDlgOpened, setDtDlgOpened] = useState(false);

    const USERS_BASE: MyDataUser[] = [];
    for (let i = 1; i <= 10; ++i) USERS_BASE.push(
        {
            id: i,
            username: "user" + i
        });

    useEffect(() => {
        const cols = [
            {
                type: "text",
                header: "description",
                field: SP_MyData("descr"),
                width: 20,
                textAlign: () => "center",
            },
            {
                type: "text",
                header: "users",
                field: SP_MyData("users"),
                width: 100,
                renderTransform: (_row, cell, value) => {
                    const row = _row as MyData;
                    if (value) {
                        const users = row.users;

                        return users.map(x => x.username).join(",");
                    }
                },
                customEdit: (states, _row) => {
                    const row = _row as MyData;

                    return <div>
                        <FormControl>
                            <InputLabel>Users set</InputLabel>
                            <Select
                                multiple
                                autoFocus
                                open={usersSelectOpened}
                                onClose={() => {
                                    setUsersSelectOpened(false)
                                    if (api) api.closeCustomEdit(true);
                                }}
                                value={row.users.map(x => String(x.id))}
                                onChange={(e) => {
                                    const id_users = e.target.value as string[];

                                    const users = row.users;
                                    users.splice(0, users.length);

                                    id_users.forEach(_id_user => {
                                        const id_user = parseInt(_id_user);

                                        users.push(USERS_BASE.find(y => y.id === id_user)!);
                                    });

                                    if (api) {
                                        api.begin();
                                        api.setCustomEditValue(users);
                                        api.commit();
                                    }
                                }}
                                style={{ minWidth: 200 }}
                                input={<Input />}
                                MenuProps={MenuProps}
                            >
                                {USERS_BASE.map(x => (
                                    <MenuItem key={x.id} value={String(x.id)}>
                                        {x.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div >
                }
            },
            {
                // https://material-ui-pickers.dev/getting-started/installation
                type: "date",
                header: "date",
                field: SP_MyData("dt"),
                width: 100,

                customEdit: (states, row) => {
                    const r = row as MyData;

                    setDtDlgOpened(true);

                    return <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker
                            label={null}
                            value={r.dt || new Date()}
                            open={dtDlgOpened}
                            onAccept={() => {
                                if (api) api.closeCustomEdit(true);
                                setDtDlgOpened(false);
                            }}
                            onAbort={() => {
                                if (api) api.closeCustomEdit(false);
                                setDtDlgOpened(false);
                            }}
                            onClose={() => {
                                if (api) api.closeCustomEdit(false);
                                setDtDlgOpened(false);
                            }}
                            onChange={date => {
                                if (api) {
                                    api.setCustomEditValue(date);
                                }
                            }}
                            animateYearScrolling
                        />
                    </MuiPickersUtilsProvider>
                }
            }
        ] as WSCanvasColumn[];

        setColumns(cols);
    }, [colVisible, api]);

    const addRow = () => {
        const newset = ds.slice();
        newset.push({
            descr: "test" + ds.length,
            dt: new Date(),
            users: []
        });
        setDs(newset);

        if (api && gridStates) {
            api.begin();
            const cell = new WSCanvasCellCoord(newset.length - 1, 0);
            api.focusCell(cell);
            api.commit();
        }
    }

    useEffect(() => {
        addRow();
    }, []);

    return <div style={{ margin: "1em" }}>

        <button onClick={() => addRow()}>ADD</button>

        <WSCanvas
            columns={columns}
            rowsCount={ds.length}
            rows={ds}
            rowGetCellData={(row, colIdx) => {
                if (row) return getFieldData(row, columns[colIdx].field);
                return "";
            }}
            prepareCellDataset={() => ds.slice()}
            rowSetCellData={(row, colIdx, value) => {
                if (row) setFieldData(row, columns[colIdx].field, value);
            }}
            // rowHeight={() => 50}
            commitCellDataset={() => { setDs(ds); }}
            showFilter={true}

            containerStyle={{ marginTop: "1em" }}
            fullwidth
            height={Math.max(300, winSize.height * .4)}
            showColNumber={true}
            columnClickBehavior={WSCanvasColumnClickBehavior.None}

            debug={false}
            onApi={(api) => setApi(api)}
            onCustomEdit={() => { setUsersSelectOpened(true); }}
            onStateChanged={(states) => setGridState(states)}
        />
    </div>
}