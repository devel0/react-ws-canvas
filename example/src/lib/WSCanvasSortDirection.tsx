import { WSCanvasColumn } from "./WSCanvasColumn";

export interface WSCanvasColumnSortInfo {
    columnIndex: number;
    sortOrder: number;
    sortDirection: WSCanvasSortDirection;
}

export const WSCanvasColumnToSortInfo = (columns: WSCanvasColumn[]) =>
    columns.map((c, idx) => {
        return {
            columnIndex: idx,
            sortDirection: c.sortDirection,
            sortOrder: c.sortOrder
        } as WSCanvasColumnSortInfo
    });

export enum WSCanvasSortDirection {
    None,
    Ascending,
    Descending
}