import { Point } from '../../wrappers/point';

// @ts-ignore: Number.EPSILON is not defined in ES5.
const epsilon: number = Number.EPSILON || 2.2204460492503130808472633361816E-16;
const zero = 0.0000001;

/**
* Solver for cubic bezier curve with implicit control points at (0,0) and (1.0, 1.0)
*/
export class BezierCurve {
    pointA: Point;
    pointB: Point;
    pointC: Point;

    constructor(p1: Point, p2: Point) {
        // Calculate coeficients (points p0 and p3 are (0, 0) and (1.0, 1.0)).
        this.pointC = new Point(3.0 * p1.x, 3.0 * p1.y);
        this.pointB = new Point(3.0 * (p2.x - p1.x) - this.pointC.x, 3.0 * (p2.y - p1.y) - this.pointC.y);
        this.pointA = new Point(1.0 - this.pointC.x - this.pointB.x, 1.0 - this.pointC.y - this.pointB.y);
    }

    public solve = (time: number): number => this.sampleCurveY(this.solveCurveX(time));

    private sampleCurveX = (time: number): number => ((this.pointA.x * time + this.pointB.x) * time + this.pointC.x) * time;
    private sampleCurveY = (time: number): number => ((this.pointA.y * time + this.pointB.y) * time + this.pointC.y) * time;
    private sampleCurveDerivativeX = (time: number): number => (3.0 * this.pointA.x * time + 2.0 * this.pointB.x) * time + this.pointC.x;

    private solveCurveXNewtonMethod = (time: number): number | undefined => {
        const numberOfIterations = 8;
        let t2: number = time;
        let x2: number;
        let d2: number;
        let isSolutionFound = false;

        for (let i = 0; i < numberOfIterations; i++) {
            x2 = this.sampleCurveX(t2) - time;
            if (Math.abs(x2) < epsilon) {
                isSolutionFound = true;
                break;
            }
            d2 = this.sampleCurveDerivativeX(t2);
            if (Math.abs(d2) < epsilon) {
                break;
            }
            t2 = t2 - x2 / d2;
        }

        return isSolutionFound ? t2 : undefined;
    }

    private solveCurveXBiSectionMethod = (time: number): number => {
        let t0 = 0.0;
        let t1 = 1.0;
        let t2: number = time;
        let x2: number;

        if (t2 < t0) {
            return t0;
        }
        if (t2 > t1) {
            return t1;
        }

        while (zero < t1 - t0) {
            x2 = this.sampleCurveX(t2);
            if (Math.abs(x2 - time) < epsilon) {
                break;
            }
            if (time > x2) {
                t0 = t2;
            } else {
                t1 = t2;
            }

            t2 = (t1 - t0) * .5 + t0;
        }
        return t2;
    }

    private solveCurveX = (time: number): number => {
        let t2: number;
        let isSolutionFound: boolean;

        // First try a few iterations of Newton's method -- normally very fast.
        const firstSolution: number | undefined = this.solveCurveXNewtonMethod(time);
        isSolutionFound = firstSolution !== undefined;
        t2 = isSolutionFound ? firstSolution! : time;

        if (!isSolutionFound) {
            // No solution found - use bi-section.
            t2 = this.solveCurveXBiSectionMethod(time);
        }

        return t2;
    }
}
