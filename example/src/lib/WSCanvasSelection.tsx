import { WSCanvasSelectionRange as WSCanvasSelectionRange } from "./WSCanvasSelectionRange";
import { WSCanvasCellCoord } from "./WSCanvasCellCoord";
import { WSCanvasSelectMode } from "./WSCanvasSelectionMode";

export class WSCanvasSelection {

    private _ranges: WSCanvasSelectionRange[];

    constructor(ranges: WSCanvasSelectionRange[]) {
        this._ranges = ranges;
    }

    get ranges() { return this._ranges; }

    get bounds() {
        if (this._ranges.length === 0)
            return null;
        else {
            let res = this._ranges[0].bounds;
            for (let i = 1; i < this._ranges.length; ++i) {
                const b = this._ranges[i].bounds;
                res = res.union(b);
            }
            return res;
        }
    }

    /** return copy of this */
    dup(): WSCanvasSelection {
        return new WSCanvasSelection(this._ranges.map((r) => r.dup()));
    }

    add(cell: WSCanvasCellCoord) {
        const res = this.dup();

        const newRange = new WSCanvasSelectionRange(cell, cell);
        res.ranges.push(newRange);

        return res;
    }

    /** create a copy of this with last range extends to given cell */
    extendsTo(cell: WSCanvasCellCoord) {
        const res = this.dup();

        const lastrng = res.ranges[res.ranges.length - 1];
        res.ranges.splice(res.ranges.length - 1, 1);

        const newRng = new WSCanvasSelectionRange(lastrng ? lastrng.from : cell, cell);
        res.ranges.push(newRng);

        return res;
    }

    clearSelection() {
        this._ranges = [];
    }

    setSelection(range: WSCanvasSelectionRange) {
        this._ranges = [range];
    }

    containsCell(cell: WSCanvasCellCoord, selectionMode: WSCanvasSelectMode): boolean {
        return this._ranges.find((w) => w.contains(cell, selectionMode === WSCanvasSelectMode.Row)) !== undefined;
    }

    /** LOOP: let rngCells = rng.cells(); let cell = rngCells.next(); while (!cell.done) { ...; cell = rngCells.next(); } */
    *cells() {
        for (let rngIdx = 0; rngIdx < this._ranges.length; ++rngIdx) {
            const rng = this._ranges[rngIdx];
            let rngCells = rng.cells();
            let cell = rngCells.next();
            while (!cell.done) {
                yield cell.value;
                cell = rngCells.next();
            }
        }
    }

    rowIdxs() {
        let res: Set<number> = new Set<number>();

        for (let rngIdx = 0; rngIdx < this._ranges.length; ++rngIdx) {
            const rng = this._ranges[rngIdx];
            let rngCells = rng.cells();
            let cell = rngCells.next();
            while (!cell.done) {
                res.add(cell.value.row);
                cell = rngCells.next();
            }
        }

        return res;
    }

    colIdxs() {
        let res: Set<number> = new Set<number>();

        for (let rngIdx = 0; rngIdx < this._ranges.length; ++rngIdx) {
            const rng = this._ranges[rngIdx];
            let rngCells = rng.cells();
            let cell = rngCells.next();
            while (!cell.done) {
                res.add(cell.value.col);
                cell = rngCells.next();
            }
        }

        return res;
    }

    toString() {
        let str = "";
        for (let i = 0; i < this.ranges.length; ++i) {
            if (i > 0) str += " ; "
            str += this.ranges[i].toString();
        }

        return str;
    }

}