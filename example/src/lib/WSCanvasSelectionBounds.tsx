import { WSCanvasSelectionRange } from "./WSCanvasSelectionRange";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";

export class WSEditorSelectionBounds {
    private _minRowIdx: number;
    private _minColIdx: number;
    private _maxRowIdx: number;
    private _maxColIdx: number;

    get minRowIdx() { return this._minRowIdx; }
    get minColIdx() { return this._minColIdx; }
    get maxRowIdx() { return this._maxRowIdx; }
    get maxColIdx() { return this._maxColIdx; }
    get size() { 
        return (this._maxColIdx - this.minColIdx + 1) * (this._maxRowIdx - this._minRowIdx + 1);
    }

    constructor(rng: WSCanvasSelectionRange) {
        this._minRowIdx = rng.from.row < rng.to.row ? rng.from.row : rng.to.row;
        this._minColIdx = rng.from.col < rng.to.col ? rng.from.col : rng.to.col;
        this._maxRowIdx = rng.from.row > rng.to.row ? rng.from.row : rng.to.row;
        this._maxColIdx = rng.from.col > rng.to.col ? rng.from.col : rng.to.col;
    }

    /** return new bound that extends this one to given other */
    union(other: WSEditorSelectionBounds) {
        return new WSEditorSelectionBounds(
            new WSCanvasSelectionRange(
                new WSCanvasCellCoord(
                    this._minRowIdx < other._minRowIdx ? this._minRowIdx : other._minRowIdx,
                    this._minColIdx > other._minColIdx ? this._minColIdx : other._minColIdx),
                new WSCanvasCellCoord(
                    this._maxRowIdx > other._maxRowIdx ? this._maxRowIdx : other._maxRowIdx,
                    this._maxColIdx > other._maxColIdx ? this._maxColIdx : other._maxColIdx)));
    }

    contains(cell: WSCanvasCellCoord) {
        return cell.row >= this._minRowIdx && cell.row <= this._maxRowIdx &&
            cell.col >= this._minColIdx && cell.col <= this._maxColIdx;
    }
}
