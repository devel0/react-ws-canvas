import { WSCanvasState } from "./WSCanvasState";
import { ViewMap } from "./WSCanvas";
import { WSCanvasProps } from "./WSCanvasProps";

export interface WSCanvasStates {  
    props: WSCanvasProps;   
    state: WSCanvasState;
    vm: ViewMap | null;
    overrideRowHeight: number[] | null;
}