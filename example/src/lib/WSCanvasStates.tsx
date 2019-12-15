import { WSCanvasState } from "./WSCanvasState";
import { ViewMap } from "./WSCanvas";

export interface WSCanvasStates {     
    state: WSCanvasState;
    vm: ViewMap | null;
    overrideRowHeight: number[] | null;
}