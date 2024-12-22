export default class Char {
    ch: any;
    fontFamily: any;
    fontSize: number;
    fontStyle: any;
    width: number;
    shapes: any;

    constructor(data: { ch: any; fFamily: any; size: number; style: any; w: number; data: { shapes: any } }) {
        this.ch = data.ch;
        this.fontFamily = data.fFamily;
        this.fontSize = data.size;
        this.fontStyle = data.style;
        this.width = data.w;
        this.shapes = data.data.shapes;
    }
}
