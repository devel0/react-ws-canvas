export class WSCanvasCoord {
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get width() { return this._width; }
    get height() { return this._height; }

    sum(delta: WSCanvasCoord) {
        return new WSCanvasCoord(this._x + delta._x, this._y + delta._y);
    }

    key = () => this.toString();

    toString() { return "(" + this._x + ", " + this._y + ")"; }
}
