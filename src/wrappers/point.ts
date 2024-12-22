import { Point as PixiPoint } from 'pixi.js';
import { CoreEngine } from '../core-engine';

export class Point {
    private point: PixiPoint;

    constructor(x?: number, y?: number) {
        const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
        this.buildPoint(isPixiWebGl, x, y);
    }

    get pixiPoint() {
        return this.point;
    }

    static zero() {
        return new Point(0, 0);
    }

    static sum(...args: Point[]): Point {
        if (!args || args.length === 0) {
            return new Point();
        }

        const accumulator = new Point();
        args.forEach(p => {
            accumulator.x += p.x;
            accumulator.y += p.y;
        });
        return accumulator;
    }

    get x(): number {
        return this.point.x;
    }

    get y(): number {
        return this.point.y;
    }

    set x(value: number) {
        this.point.x = value;
    }

    set y(value: number) {
        this.point.y = value;
    }

    equals(p: Point): boolean {
        return this.point.equals(p.point);
    }

    set(x?: number, y?: number): void {
        this.point.set(x, y);
    }

    private buildPoint(isPixiWebGl: boolean, x?: number, y?: number) {
        if (isPixiWebGl) {
            this.point = new PixiPoint(x, y);
        }
    }
}
