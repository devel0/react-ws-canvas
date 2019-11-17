import { WSEditorSelectionBounds } from "./WSCanvasSelectionBounds";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";

export class WSCanvasSelectionRange
{
    private _from: WSCanvasCellCoord;
    private _to: WSCanvasCellCoord;

    get from() { return this._from; }
    get to() { return this._to; }

    /** compute this range bounds */
    get bounds(): WSEditorSelectionBounds { return new WSEditorSelectionBounds(this); }

    constructor(from: WSCanvasCellCoord, to: WSCanvasCellCoord) {
        this._from = from;
        this._to = to;
    }

    /** returns copy of this */
    dup() {
        return new WSCanvasSelectionRange(this.from, this.to);
    }

    contains(other: WSCanvasCellCoord, rowMode: boolean = false) {
        if (rowMode === true) {
            let minRow = this._from.row;
            let maxRow = this._to.row;
            if (maxRow < minRow) {
                let x = minRow;
                minRow = maxRow;
                maxRow = x;
            }
            return minRow <= other.row && other.row <= maxRow;
        }
        else
            return this.bounds.contains(other);
    }

    toString() {
        if (this._from.equals(this._to))
            return "(" + this._from.toString() + ")";
        else
            return "(" + this.from.toString() + ")-(" + this.to.toString() + ")";
    }

    /** LOOP: let rngCells = rng.cells(); let cell = rngCells.next(); while (!cell.done) { ...; cell = rngCells.next(); } */
    *cells() {
        const bound = this.bounds;

        for (let ri = bound.minRowIdx; ri <= bound.maxRowIdx; ++ri) {
            for (let ci = bound.minColIdx; ci <= bound.maxColIdx; ++ci) {
                yield new WSCanvasCellCoord(ri, ci);
            }
        }
    }
}
