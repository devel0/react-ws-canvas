import { WSCanvasSortDirection } from "./WSCanvasSortDirection";

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
    type: WSCanvasColumnType;

    /** hint: getColumnHeader={(col) => columns[col].header} */
    header: string;

    /** hint:
     * dataSource={rows}
     * getCellData={(cell) => (rows[cell.row] as any)[columns[cell.col].field]}
     * prepareCellDataset={() => rows.slice()}
     * commitCellDataset={(q) => setRows(q)}     
     */
    field: string;

    /** hint: getColumnLessThanOp={(col) => columns[col].lessThan} */
    lessThan: (a: any, b: any) => boolean;

    /** hint: colWidth={(col) => columns[col].width || 100} */
    width: number;

    /** hint: columnInitialSort={WSCanvasColumnToSortInfo(columns)} */
    sortDirection: WSCanvasSortDirection;

    /** hint: columnInitialSort={WSCanvasColumnToSortInfo(columns)} */
    sortOrder: number;  

    /** hint: getCellTextWrap={(cell, props) => { if (columns[cell.col].wrapText) return columns[cell.col].wrapText; }} */
    wrapText?: boolean; 
}