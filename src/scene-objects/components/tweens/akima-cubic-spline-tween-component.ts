import { LagrangeTweenComponent } from "./lagrange-tween-component";
import { Component } from "../component";
import { Equation } from "../../../math-utils/interpolation/types";
import { createAkimaSplineInterpolator } from "../../../math-utils/interpolation/akima-cubic-spline";

/**
 * Tween using an Akima Spline curve of, at least, 5 points (Akima algorithm).
*/
export class AkimaCubicSplineTweenComponent extends LagrangeTweenComponent {

    getNameComponent(): string {
        return "AkimaCubicSplineTweenComponent";
    }

    buildTweenFunction(): Equation {
        const [xVals, yVals] = [this.points.map(p => p.x), this.points.map(p => p.y)];
        return createAkimaSplineInterpolator(xVals, yVals);
    }

    clone(): Component {
        const clone = <AkimaCubicSplineTweenComponent> this.cloneParentBuilder(new AkimaCubicSplineTweenComponent());
        clone.points = [...this.points];
        return clone;
    }
}