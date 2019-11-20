import { WSCanvasSortDirection } from "react-ws-canvas";

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

export interface WSCanvasColumn {
    type: WSCanvasColumnType;
    header: string;
    field: string;
    lessThan: (a: any, b: any) => boolean;
    width: number;
    sortDirection: WSCanvasSortDirection;
    sortOrder: number;    
}