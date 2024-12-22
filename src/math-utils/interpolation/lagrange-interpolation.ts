import { Equation } from './types';
import { Point } from '../../wrappers/point';

// From: https://codepen.io/ichko/pen/RGEqmA
export class Lagrange {
    private polynomial: Equation;

    constructor(private points: Point[] = []) {
        this.polynomial = x => 1;
        this.setPoints(points);
    }

    getBuilder() {
        return this.polynomial;
    }

    build() {
        const px: number[] = this.points.map(p => p.x);
        const divisor: number[] = px.map((x, i) => this.splitPolynomial(i, px)(x), this);

        return (this.polynomial = x => this.points
                .map(p => p.y)
                .reduce((sum, y, i) => sum + (y * this.splitPolynomial(i, px)(x)) / divisor[i], 0));
    }

    private setPoints(points: Point[]) {
        this.points = points;
        this.polynomial = this.build();
    }

    private fullPolynomial(roots: number[]) {
        return (x: number) => roots.reduce(
            (product, xi) => product * (x - xi),
            1);
    }

    private splitPolynomial(i: number, px: number[]) {
        const left = this.fullPolynomial(px.slice(0, i));
        const right = this.fullPolynomial(px.slice(i + 1, px.length));

        return (x: number) => left(x) * right(x);
    }
}
