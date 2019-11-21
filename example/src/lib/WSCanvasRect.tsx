import { WSCanvasCoord } from "./WSCanvasCoord";

export enum WSCanvasRectMode { twoPoints, pointAndSize };

export class WSCanvasRect {
    private _leftTop: WSCanvasCoord;
    private _rightBottom: WSCanvasCoord;

    constructor(
        p1: WSCanvasCoord = new WSCanvasCoord(),
        p2: WSCanvasCoord = new WSCanvasCoord(),
        mode: WSCanvasRectMode = WSCanvasRectMode.twoPoints) {

        if (mode === WSCanvasRectMode.twoPoints) {
            this._leftTop = new WSCanvasCoord(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y));
            this._rightBottom = new WSCanvasCoord(Math.max(p1.x, p2.x), Math.max(p1.y, p2.y));
        } else {
            this._leftTop = new WSCanvasCoord(p1.x, p1.y);
            this._rightBottom = new WSCanvasCoord(p1.x + p2.x, p1.y + p2.y);
        }
    }

    equals(other:WSCanvasRect) {
        return this._leftTop.equals(other._leftTop) && this._rightBottom.equals(other._rightBottom);
    }

    get leftTop() { return this._leftTop; }
    get rightBottom() { return this._rightBottom; }

    get width() { return this._rightBottom.x - this._leftTop.x + 1; }
    get height() { return this._rightBottom.y - this._leftTop.y + 1; }

    contains(coord: WSCanvasCoord, tolerance: number = 0) {
        return (coord.x >= this._leftTop.x - tolerance) && (coord.y >= this._leftTop.y - tolerance) &&
            (coord.x <= this._rightBottom.x + tolerance) && (coord.y <= this._rightBottom.y + tolerance);
    }

    key = () => this._leftTop + "_" + this._rightBottom;

    toString() { return "(" + this.leftTop + "," + this.rightBottom + ")"; }
}
