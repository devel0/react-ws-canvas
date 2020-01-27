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
    nextCol = (colsCnt: number, qColHidden: (c: number) => boolean) => {
        let _c = this._colIdx + 1;
        while (_c < colsCnt && qColHidden(_c))++_c;
        return new WSCanvasCellCoord(this._rowIdx, _c);
    }
    prevCol = (qColHidden: (c: number) => boolean) => {
        let _c = this._colIdx - 1;
        while (_c > 0 && qColHidden(_c))--_c;
        return new WSCanvasCellCoord(this._rowIdx, _c);
    }

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
