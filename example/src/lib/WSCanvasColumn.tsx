import { WSCanvasSortDirection } from "./WSCanvasSortDirection";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasStates } from "./WSCanvasStates";
import { WSCanvasProps } from "./WSCanvasProps";
import { CSSProperties } from "react";

export type WSCanvasColumnType = "text" | "number" | "boolean" | "custom" | "date" | "time" | "datetime";

export enum WSCanvasColumnClickBehavior {
    ToggleSort,
    Select,
    None
}

export interface WSCanvasSortingRowInfo {
    ri: number;
    cellData: any;
}

/** helper to store column info ; see hints for WSCanvas prop transferring */
export interface WSCanvasColumn {
    /** hint: getCellType={(cell, data) => columns[cell.col].type} */
    type?: WSCanvasColumnType;

    /** hint: getColumnHeader={(col) => columns[col].header} */
    header?: string;

    /** hint:
     * dataSource={rows}
     * getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
     * prepareCellDataset={() => rows.slice()}
     * commitCellDataset={(q) => setRows(q)}     
     */
    field: string;

    /** hint: getColumnLessThanOp={(col) => columns[col].lessThan} */
    lessThan?: (a: any, b: any) => boolean;

    textAlign?: (coord: WSCanvasCellCoord, value: any) => CanvasTextAlign | undefined;

    /** hint: colWidth={(col) => columns[col].width || 100} */
    width?: number;

    /** hint: columnInitialSort={WSCanvasColumnToSortInfo(columns)} */
    sortDirection?: WSCanvasSortDirection;

    /** hint: columnInitialSort={WSCanvasColumnToSortInfo(columns)} */
    sortOrder?: number;

    /** hint: getCellTextWrap={(cell, props) => { if (columns[cell.col].wrapText) return columns[cell.col].wrapText; }} */
    wrapText?: boolean;

    renderTransform?: (row: any, cell: WSCanvasCellCoord, value: any) => any;

    /** if true datasource will be used instead of renderTransform if present */
    filterUseDataSource?: boolean;

    readonly?: boolean | undefined;

    customEdit?: ((states: WSCanvasStates, row: any, cell: WSCanvasCellCoord,
        containerStyle?: CSSProperties, cellWidth?: number, cellHeight?: number) => JSX.Element) | undefined,

    hidden?: boolean | undefined;
}