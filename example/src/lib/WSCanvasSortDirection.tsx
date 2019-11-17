export interface WSCanvasColumnSortInfo {
    columnIndex: number;
    sortOrder: number;
    sortDirection: WSCanvasSortDirection;
}

export enum WSCanvasSortDirection {    
    None,
    Ascending,
    Descending
}