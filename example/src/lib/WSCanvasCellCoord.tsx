export class WSCanvasCellCoord {
    private _rowIdx: number;
    private _colIdx: number;
    private _filterRow: boolean;

    constructor(rowIdx: number = 0, colIdx: number = 0, filterRow: boolean = false) {
        this._rowIdx = rowIdx;
        this._colIdx = colIdx;
        this._filterRow = filterRow;
    }

    get row() { return this._rowIdx; }
    get col() { return this._colIdx; }
    get filterRow() { return this._filterRow; }

    key = () => this.toString();

    setRow = (newRow: number) => new WSCanvasCellCoord(newRow, this._colIdx);
    setCol = (newCol: number) => new WSCanvasCellCoord(this._rowIdx, newCol);

    nextRow = () => new WSCanvasCellCoord(this._rowIdx + 1, this._colIdx);
    prevRow = () => new WSCanvasCellCoord(this._rowIdx - 1, this._colIdx);
    nextCol = () => new WSCanvasCellCoord(this._rowIdx, this._colIdx + 1);
    prevCol = () => new WSCanvasCellCoord(this._rowIdx, this._colIdx - 1);

    lessThan(other: WSCanvasCellCoord) {
        return this.row < other.row || (this.row === other.row && this.col < other.col);
    }

    greatThan(other: WSCanvasCellCoord) {
        return this.row > other.row || (this.row === other.row && this.col > other.col);
    }

    equals(other: WSCanvasCellCoord) {
        return this.row === other.row && this.col === other.col;
    }

    toString() { return "(r:" + this._rowIdx + ", c:" + this._colIdx + ")"; }
}
